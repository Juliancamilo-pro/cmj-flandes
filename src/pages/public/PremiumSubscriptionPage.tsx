import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  CreditCard, 
  FileText, 
  Megaphone, 
  Clock, 
  ArrowRight, 
  AlertCircle, 
  HelpCircle,
  Building2,
  Smartphone,
  Coins,
  Lock,
  UserCheck,
  Check,
  ChevronRight,
  Printer,
  Calendar,
  Layers,
  Award,
  Zap,
  QrCode,
  Copy
} from 'lucide-react';
import { PaymentMethod, SubscriberUser, FinancialSettings, SubscriptionPlan } from '../../types';
import { 
  createSubscriber, 
  updateSubscriber,
  getSubscriberByEmail, 
  getFinancialSettings, 
  getSubscriptionPlans, 
  recordSubscriptionPayment,
  updateSubscriptionPaymentStatus,
  DEFAULT_SUBSCRIPTION_PLANS,
  DEFAULT_PAYMENT_METHODS_CONFIG
} from '../../services/db';
import { openWompiCheckout, verifyWompiTransaction } from '../../services/wompi';
import { useAuth } from '../../context/AuthContext';

interface PremiumSubscriptionPageProps {
  onNavigateToSubscriberPanel: () => void;
}

export const PremiumSubscriptionPage: React.FC<PremiumSubscriptionPageProps> = ({
  onNavigateToSubscriberPanel
}) => {
  const { isSubscriber, subscriber, loginSubscriber, setSubscriberSession } = useAuth();

  // Mode: 'subscribe' or 'login'
  const [activeTab, setActiveTab] = useState<'subscribe' | 'login'>('subscribe');

  // Dynamic Plans State
  const [plans, setPlans] = useState<SubscriptionPlan[]>(DEFAULT_SUBSCRIPTION_PLANS);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('plan_mensual');
  const [loadingPlans, setLoadingPlans] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('nequi');
  const [voucherOrPhoneInput, setVoucherOrPhoneInput] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);


  // Subscriber login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Transaction state
  const [submitting, setSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<SubscriberUser | null>(null);
  const [lastPaymentRef, setLastPaymentRef] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Settings
  const [financialSettings, setFinancialSettings] = useState<FinancialSettings | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoadingPlans(true);
    try {
      const [settings, dbPlans] = await Promise.all([
        getFinancialSettings(),
        getSubscriptionPlans()
      ]);
      setFinancialSettings(settings);
      if (settings?.paymentMethodsConfig) {
        const enabled = Object.keys(settings.paymentMethodsConfig).filter(k => settings.paymentMethodsConfig![k]?.enabled);
        if (enabled.length > 0) {
          setSelectedMethod(enabled[0] as PaymentMethod);
        }
      }
      if (dbPlans && dbPlans.length > 0) {
        setPlans(dbPlans);
        const popular = dbPlans.find(p => p.isPopular) || dbPlans[0];
        setSelectedPlanId(popular.id);
      }

    } catch (e) {
      console.error('Error loading subscription data:', e);
    } finally {
      setLoadingPlans(false);
    }
  };

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0] || DEFAULT_SUBSCRIPTION_PLANS[2];

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !email.trim()) {
      setErrorMessage('Por favor ingresa tu nombre completo y correo electrónico.');
      return;
    }

    if (!acceptTerms) {
      setErrorMessage('Debes aceptar las condiciones de publicación y aprobación editorial.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if subscriber already has active subscription
    try {
      const existing = await getSubscriberByEmail(cleanEmail);
      if (existing && existing.status === 'activa') {
        const now = new Date();
        if (new Date(existing.endDate) > now) {
          setErrorMessage('Ya existe una membresía activa con este correo. Puedes ingresar directamente desde la pestaña "Ya tengo Cuenta Premium".');
          return;
        }
      }
    } catch (e) {}

    const isManualQrMethod =
      selectedMethod === 'nequi' ||
      selectedMethod === 'daviplata' ||
      selectedMethod === 'bancolombia_qr';

    if (isManualQrMethod && !voucherOrPhoneInput.trim()) {
      setErrorMessage(
        'Por favor ingresa el número de comprobante, referencia o celular desde el cual realizaste la transferencia.'
      );
      return;
    }

    setSubmitting(true);

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + (selectedPlan.durationDays || 30));

    const reference = voucherOrPhoneInput.trim()
      ? `SUB-${voucherOrPhoneInput.trim().toUpperCase()}`
      : `SUB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Always start as 'pendiente_pago' / 'pendiente' until verified by Wompi or owner
    const initialSubscriberData: Omit<SubscriberUser, 'id'> = {
      fullName: fullName.trim(),
      email: cleanEmail,
      phone: phone.trim() || undefined,
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      period: selectedPlan.period,
      durationDays: selectedPlan.durationDays || 30,
      amountCOP: selectedPlan.priceCOP,
      status: 'pendiente_pago',
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      autoRenew: selectedPlan.period !== 'individual' && selectedPlan.period !== 'pago_unico',
      paymentMethod: selectedMethod,
      lastPaymentRef: reference,
      totalPaidCOP: selectedPlan.priceCOP,
      articlesAllowed: selectedPlan.articlesAllowed ?? (selectedPlan.articleLimit ?? -1),
      articlesSubmittedCount: 0,
      adProposalsAllowed: selectedPlan.adProposalsAllowed ?? (selectedPlan.adProposalsLimit ?? 0),
      adProposalsSubmittedCount: 0,
      paymentStatus: 'pendiente',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    try {
      // 1. Create pending subscriber & payment record first (never activate before payment verification)
      const subId = await createSubscriber(initialSubscriberData);
      const paymentId = await recordSubscriptionPayment({
        subscriberId: subId,
        subscriberEmail: cleanEmail,
        subscriberName: fullName.trim(),
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        period: selectedPlan.period,
        amountCOP: selectedPlan.priceCOP,
        reference,
        paymentMethod: selectedMethod,
        status: 'pendiente',
        periodStart: now.toISOString(),
        periodEnd: endDate.toISOString()
      });

      // 2. If Wompi gateway is used (PSE / Card / Wompi Checkout)
      if (!isManualQrMethod && financialSettings?.wompiPublicKey) {
        await openWompiCheckout(
          {
            reference,
            amountCOP: selectedPlan.priceCOP,
            customerEmail: cleanEmail,
            customerName: fullName.trim(),
            customerPhone: phone.trim() || undefined,
            redirectUrl: window.location.href.split('#')[0] + '#suscriptor/panel'
          },
          financialSettings,
          async (result) => {
            try {
              const txId = result?.transaction?.id;
              if (txId) {
                const verification = await verifyWompiTransaction(
                  txId,
                  financialSettings.wompiPublicKey
                );
                if (
                  verification.success &&
                  verification.status === 'APPROVED' &&
                  (!verification.amountCOP || verification.amountCOP === selectedPlan.priceCOP)
                ) {
                  await updateSubscriber(subId, {
                    status: 'activa',
                    paymentStatus: 'aprobado',
                    lastPaymentRef: txId
                  });
                  await updateSubscriptionPaymentStatus(paymentId.id, 'aprobado');
                  const activeSub: SubscriberUser = {
                    id: subId,
                    ...initialSubscriberData,
                    status: 'activa',
                    paymentStatus: 'aprobado',
                    lastPaymentRef: txId
                  };
                  setSubscriberSession(activeSub);
                  setLastPaymentRef(txId);
                  setPaymentSuccess(activeSub);
                  return;
                }
              }
              setErrorMessage(
                'Tu solicitud quedó registrada en estado pendiente. Una vez Wompi confirme el pago, tu membresía se activará.'
              );
            } finally {
              setSubmitting(false);
            }
          }
        );
        return;
      }

      // 3. Manual QR / Bre-B transfer: stays in 'pendiente_pago' until owner verifies transfer
      const pendingSub: SubscriberUser = { id: subId, ...initialSubscriberData };
      setLastPaymentRef(reference);
      setPaymentSuccess(pendingSub);
    } catch (err: any) {
      console.error('Subscription error:', err);
      setErrorMessage('Ocurrió un error al procesar la suscripción. Por favor intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoginSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginEmail.trim()) {
      setLoginError('Ingresa el correo con el que te suscribiste.');
      return;
    }

    setLoggingIn(true);
    try {
      const res = await loginSubscriber(loginEmail);
      if (res.success && res.subscriber) {
        onNavigateToSubscriberPanel();
      } else {
        setLoginError(res.message);
      }
    } catch (e: any) {
      setLoginError('Error al autenticar suscriptor.');
    } finally {
      setLoggingIn(false);
    }
  };

  // If already subscribed and active
  if (isSubscriber && subscriber) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 space-y-8 animate-fadeIn">
        <div className="p-8 sm:p-10 rounded-3xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center space-y-5 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div className="space-y-1">
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 text-xs font-bold uppercase tracking-wider font-sans">
              Membresía Activa
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-black text-stone-900 dark:text-stone-100">
              ¡Hola, {subscriber.fullName}!
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-300 font-sans max-w-md mx-auto">
              Tu plan <strong className="text-emerald-800 dark:text-emerald-300">{subscriber.planName || 'Premium'}</strong> está activo y vigente hasta el{' '}
              <strong className="text-emerald-700 dark:text-emerald-400">
                {new Date(subscriber.endDate).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
              </strong>.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onNavigateToSubscriberPanel}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950 text-xs font-semibold uppercase tracking-wider hover:bg-gold-600 transition-all shadow-md cursor-pointer"
            >
              <span>Ir a Mi Panel de Artículos y Pautas</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If newly subscribed confirmation with printable receipt
  if (paymentSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-8 animate-fadeIn">
        <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#18181c] border border-gold-300 dark:border-stone-800 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-gold-500 text-stone-950 flex items-center justify-center mx-auto shadow-md">
            <Sparkles className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-gold-100 dark:bg-gold-950/60 text-gold-900 dark:text-gold-300 text-xs font-bold uppercase tracking-wider font-sans">
              ¡Suscripción Confirmada!
            </span>
            <h2 className="text-3xl font-serif font-black text-stone-900 dark:text-stone-100">
              Bienvenido a la comunidad editorial
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-sans max-w-lg mx-auto">
              {paymentSuccess.fullName}, tu cuenta para el plan <strong>{paymentSuccess.planName}</strong> ha sido activada con éxito. Ya puedes comenzar a redactar tus artículos y postular tus propuestas de pauta.
            </p>
          </div>

          {/* Printable Official Voucher Box */}
          <div className="p-6 rounded-2xl bg-[#faf9f6] dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-left space-y-3 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <span className="font-serif font-black text-base text-stone-900 dark:text-white">
                Comprobante Digital de Suscripción
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold uppercase">
                Aprobado
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-stone-600 dark:text-stone-300">
              <div>
                <span className="block text-[10px] text-stone-400 uppercase">Referencia Wompi</span>
                <span className="font-mono font-bold text-stone-800 dark:text-stone-200">{lastPaymentRef}</span>
              </div>
              <div>
                <span className="block text-[10px] text-stone-400 uppercase">Plan Adquirido</span>
                <span className="font-bold text-stone-800 dark:text-stone-200">{paymentSuccess.planName}</span>
              </div>
              <div>
                <span className="block text-[10px] text-stone-400 uppercase">Valor Cancelado</span>
                <span className="font-bold text-stone-800 dark:text-stone-200">{formatCOP(paymentSuccess.amountCOP)} COP</span>
              </div>
              <div>
                <span className="block text-[10px] text-stone-400 uppercase">Vigencia</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  {new Date(paymentSuccess.startDate).toLocaleDateString()} — {new Date(paymentSuccess.endDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-stone-400 uppercase">Cupo de Artículos</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  {paymentSuccess.articlesAllowed === -1 ? 'Ilimitados' : `${paymentSuccess.articlesAllowed} publicación`}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-stone-400 uppercase">Propuestas de Pauta</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200">
                  {paymentSuccess.adProposalsAllowed} permitidas
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handlePrintReceipt}
              className="w-full sm:w-1/2 py-3 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Comprobante</span>
            </button>

            <button
              onClick={onNavigateToSubscriberPanel}
              className="w-full sm:w-1/2 py-3.5 rounded-xl bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950 text-xs font-semibold uppercase tracking-wider hover:bg-gold-600 transition-all shadow-md cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>Acceder a Mi Panel Premium</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 sm:py-14 px-4 space-y-14">
      {/* 1. HERO & PRESENTATION */}
      <header className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gold-50 dark:bg-gold-950/40 border border-gold-300 dark:border-gold-800 text-gold-900 dark:text-gold-300 text-xs font-semibold uppercase tracking-wider font-sans">
          <Sparkles className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />
          <span>Planes Editoriales Dinámicos • Colombia</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-serif font-black text-[#121212] dark:text-[#f3ede2] tracking-tight leading-[1.15]">
          Suscripción Premium Editorial
        </h1>

        <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 font-serif italic leading-relaxed">
          Publica tus artículos de análisis, presenta propuestas publicitarias y accede a una audiencia reflexiva, con el respaldo y cuidado editorial de Julian Camilo.
        </p>

        {/* Tab switch: Suscribirse vs Ya soy suscriptor */}
        <div className="pt-2 inline-flex p-1 bg-stone-100 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800">
          <button
            onClick={() => setActiveTab('subscribe')}
            className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'subscribe'
                ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Quiero Suscribirme (4 Planes)
          </button>
          <button
            onClick={() => setActiveTab('login')}
            className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Ya tengo Cuenta Premium
          </button>
        </div>
      </header>

      {/* 2. SUBSCRIBER LOGIN PANEL */}
      {activeTab === 'login' ? (
        <div className="max-w-md mx-auto bg-white dark:bg-[#18181c] border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">
          <div className="space-y-1 text-center">
            <div className="w-12 h-12 rounded-full bg-gold-100 dark:bg-stone-800 text-gold-700 dark:text-gold-400 flex items-center justify-center mx-auto mb-2">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100">
              Acceder como Suscriptor Premium
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
              Ingresa el correo electrónico asociado a tu pago de suscripción.
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubscriber} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1 font-sans">
                Correo Electrónico *
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full p-3 text-sm border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3.5 rounded-xl bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950 text-xs font-semibold uppercase tracking-wider hover:bg-gold-600 transition-all disabled:opacity-50 shadow-md cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>{loggingIn ? 'Verificando Suscripción...' : 'Ingresar a mi Panel'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-[11px] text-center text-stone-400 font-sans">
            ¿No estás suscrito aún?{' '}
            <button
              type="button"
              onClick={() => setActiveTab('subscribe')}
              className="text-gold-600 dark:text-gold-400 font-semibold underline cursor-pointer"
            >
              Suscríbete aquí
            </button>
          </p>
        </div>
      ) : (
        /* 3. DYNAMIC 4-PLAN SELECTION & CHECKOUT GRID */
        <div className="space-y-12 animate-fadeIn">
          {/* Plan Selector Cards (4 Dynamic Plans) */}
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-serif font-black text-stone-900 dark:text-white">
                Elige el Plan que Mejor se Adapte a tus Metas
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
                Precios transparentes en pesos colombianos (COP), sin costos ocultos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`rounded-3xl p-6 transition-all cursor-pointer relative border flex flex-col justify-between ${
                      isSelected
                        ? 'border-gold-500 bg-white dark:bg-[#1e1c18] shadow-xl ring-2 ring-gold-500/40 dark:ring-gold-500/20'
                        : 'border-stone-200 dark:border-stone-800 bg-[#faf8f4] dark:bg-[#141416] hover:border-gold-300 dark:hover:border-stone-700'
                    }`}
                  >
                    {/* Discount or Popular Badge */}
                    <div className="flex items-center justify-between min-h-[24px] mb-2">
                      {plan.isPopular && (
                        <span className="px-2.5 py-0.5 rounded-full bg-gold-500 text-stone-950 text-[10px] font-black uppercase tracking-wider font-sans">
                          Más Elegido
                        </span>
                      )}
                      {plan.discountBadge && (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider font-sans ml-auto">
                          {plan.discountBadge}
                        </span>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-white">
                          {plan.name}
                        </h3>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 font-sans mt-0.5 line-clamp-2">
                          {plan.description}
                        </p>
                      </div>

                      {/* Pricing */}
                      <div>
                        {plan.originalPriceCOP && (
                          <span className="text-xs text-stone-400 line-through font-mono block">
                            {formatCOP(plan.originalPriceCOP)}
                          </span>
                        )}
                        <div className="flex items-baseline space-x-1">
                          <span className="text-2xl sm:text-3xl font-serif font-black text-stone-900 dark:text-white">
                            {formatCOP(plan.priceCOP)}
                          </span>
                          <span className="text-[11px] text-stone-500 font-sans font-semibold">
                            COP {plan.period === 'individual' ? 'pago único' : `/ ${plan.period}`}
                          </span>
                        </div>
                      </div>

                      {/* Quota Highlights */}
                      <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-100 dark:border-stone-800 text-[11px] font-sans space-y-1">
                        <div className="flex items-center space-x-1.5 text-stone-700 dark:text-stone-300">
                          <FileText className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400 shrink-0" />
                          <span>
                            Artículos:{' '}
                            <strong className="text-stone-900 dark:text-white">
                              {plan.articlesAllowed === -1 ? 'Ilimitados' : `${plan.articlesAllowed} artículo`}
                            </strong>
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-stone-700 dark:text-stone-300">
                          <Megaphone className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400 shrink-0" />
                          <span>
                            Pautas:{' '}
                            <strong className="text-stone-900 dark:text-white">
                              {plan.adProposalsAllowed === 0 ? 'No incluye' : `${plan.adProposalsAllowed} propuestas`}
                            </strong>
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-stone-700 dark:text-stone-300">
                          <Calendar className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400 shrink-0" />
                          <span>
                            Vigencia:{' '}
                            <strong className="text-stone-900 dark:text-white">
                              {plan.durationDays} días
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* Benefits Checklist */}
                      <ul className="space-y-1.5 pt-2 text-[11px] font-sans text-stone-600 dark:text-stone-300">
                        {plan.benefits.slice(0, 4).map((b, i) => (
                          <li key={i} className="flex items-start space-x-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      className={`w-full mt-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gold-500 text-stone-950 shadow-md'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                      }`}
                    >
                      {isSelected ? '✓ Plan Seleccionado' : 'Elegir este Plan'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Checkout Grid (Selected Plan Overview + Wompi Payment Form) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4 border-t border-stone-200 dark:border-stone-800">
            {/* Left: Summary of Selected Plan & Editorial Rules */}
            <div className="lg:col-span-7 space-y-6">
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#fcfbf9] to-[#f5f2e9] dark:from-[#1b1a18] dark:to-[#141416] border border-gold-300 dark:border-stone-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold tracking-widest text-gold-700 dark:text-gold-400 font-sans">
                    Resumen del Plan Elegido
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-gold-200 dark:bg-gold-900/60 text-gold-900 dark:text-gold-300 text-[10px] font-bold uppercase tracking-wider font-sans">
                    {selectedPlan.name}
                  </span>
                </div>

                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl sm:text-4xl font-serif font-black text-stone-900 dark:text-stone-100">
                    {formatCOP(selectedPlan.priceCOP)}
                  </span>
                  <span className="text-xs text-stone-500 dark:text-stone-400 font-sans font-semibold">
                    COP ({selectedPlan.durationDays} días de vigencia)
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-sans leading-relaxed">
                  {selectedPlan.description} Podrás redactar tus textos con el editor enriquecido, guardar borradores y postular tus artículos para revisión directa por Julian Camilo.
                </p>

                {/* All Benefits of the selected plan */}
                <div className="pt-2 border-t border-gold-200/70 dark:border-stone-800 space-y-2">
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200 font-sans uppercase tracking-wider block">
                    Todos los beneficios incluidos:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-sans text-stone-600 dark:text-stone-300">
                    {selectedPlan.benefits.map((benefit, i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Editorial Rule Notice */}
              <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 space-y-2">
                <div className="flex items-center space-x-2 text-amber-900 dark:text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <h4 className="text-xs font-bold font-sans uppercase tracking-wider">
                    Condición de Aprobación Editorial Obligatoria
                  </h4>
                </div>
                <p className="text-xs text-amber-900 dark:text-amber-200 font-sans leading-relaxed">
                  El pago de la suscripción te otorga el derecho de postular artículos y anuncios según el cupo del plan ({selectedPlan.articlesAllowed === -1 ? 'Ilimitados' : `${selectedPlan.articlesAllowed} artículo`} y {selectedPlan.adProposalsAllowed} pautas), pero <strong>no garantiza su publicación automática</strong>. Todo contenido pasa por revisión editorial rigurosa bajo el criterio de Julian Camilo.
                </p>
              </div>
            </div>

            {/* Right: Checkout Form */}
            <div className="lg:col-span-5">
              <div className="bg-white dark:bg-[#18181c] border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-md space-y-5 sticky top-24">
                <div className="space-y-1 border-b border-stone-100 dark:border-stone-800 pb-3">
                  <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
                    Activar {selectedPlan.name}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
                    Total a pagar: <strong className="text-stone-900 dark:text-white">{formatCOP(selectedPlan.priceCOP)} COP</strong>
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSubscribe} className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1 font-sans">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ej. Carlos Mendoza"
                      className="w-full p-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1 font-sans">
                      Correo Electrónico (Tu usuario de acceso) *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ejemplo@correo.com"
                      className="w-full p-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                    <span className="text-[10px] text-stone-400 mt-0.5 block">
                      Con este correo accederás a tu panel y recibirás las notas de revisión editorial.
                    </span>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1 font-sans">
                      Teléfono Celular (Opcional)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="300 123 4567"
                      className="w-full p-2.5 text-xs border border-stone-200 dark:border-stone-700 rounded-xl bg-[#faf9f6] dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                    />
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider font-sans">
                        Método de Pago Colombiano
                      </label>
                      <span className="text-[10px] text-stone-400 font-sans">
                        Habilitado por el administrador
                      </span>
                    </div>

                    {(() => {
                      const cfg = financialSettings?.paymentMethodsConfig || DEFAULT_PAYMENT_METHODS_CONFIG;
                      const allOptions = [
                        { id: 'nequi', label: cfg.nequi?.name || 'Nequi / Bre-B', icon: Smartphone, enabled: cfg.nequi?.enabled ?? true, config: cfg.nequi },
                        { id: 'daviplata', label: cfg.daviplata?.name || 'Daviplata', icon: Smartphone, enabled: cfg.daviplata?.enabled ?? false, config: cfg.daviplata },
                        { id: 'bancolombia_qr', label: cfg.bancolombia_qr?.name || 'Bancolombia QR', icon: Coins, enabled: cfg.bancolombia_qr?.enabled ?? false, config: cfg.bancolombia_qr },
                        { id: 'pse', label: cfg.pse?.name || 'PSE (Bancos)', icon: Building2, enabled: cfg.pse?.enabled ?? false, config: cfg.pse },
                        { id: 'card', label: cfg.card?.name || 'Tarjeta Débito/Crédito', icon: CreditCard, enabled: cfg.card?.enabled ?? false, config: cfg.card },
                      ];
                      const activeOptions = allOptions.filter(o => o.enabled);
                      const displayOptions = activeOptions.length > 0 ? activeOptions : [allOptions[0]];
                      const currentSelectedConfig = displayOptions.find(o => o.id === selectedMethod)?.config || displayOptions[0].config;

                      return (
                        <div className="space-y-3">
                          <div className={`grid gap-2 ${displayOptions.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                            {displayOptions.map((pm) => (
                              <button
                                type="button"
                                key={pm.id}
                                onClick={() => setSelectedMethod(pm.id as PaymentMethod)}
                                className={`p-2.5 rounded-xl border text-xs font-semibold text-left flex items-center space-x-2 transition-all cursor-pointer ${
                                  selectedMethod === pm.id
                                    ? 'border-gold-500 bg-gold-50/50 dark:bg-stone-800 text-stone-900 dark:text-white ring-1 ring-gold-500'
                                    : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:border-stone-300'
                                }`}
                              >
                                <pm.icon className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400 shrink-0" />
                                <span className="truncate">{pm.label}</span>
                              </button>
                            ))}
                          </div>

                          {/* QR and Bre-B details for selected method */}
                          {currentSelectedConfig && (currentSelectedConfig.breBKey || currentSelectedConfig.qrImageUrl) && (
                            <div className="p-3.5 rounded-2xl bg-[#faf8f4] dark:bg-stone-900/90 border border-gold-200 dark:border-stone-800 space-y-2.5 text-xs font-sans">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-stone-800 dark:text-stone-200 flex items-center space-x-1">
                                  <QrCode className="w-3.5 h-3.5 text-gold-600" />
                                  <span>Transferencia {currentSelectedConfig.name}</span>
                                </span>
                                {currentSelectedConfig.breBKey && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(currentSelectedConfig.breBKey!);
                                      setCopiedKey(true);
                                      setTimeout(() => setCopiedKey(false), 2000);
                                    }}
                                    className="text-[10px] text-gold-700 dark:text-gold-400 hover:underline flex items-center space-x-1 cursor-pointer font-bold"
                                  >
                                    <Copy className="w-3 h-3" />
                                    <span>{copiedKey ? '¡Copiada!' : 'Copiar Llave Bre-B'}</span>
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center space-x-3">
                                {currentSelectedConfig.qrImageUrl && (
                                  <div className="w-16 h-16 rounded-xl bg-white p-1 border border-stone-200 dark:border-stone-700 shrink-0 shadow-xs">
                                    <img src={currentSelectedConfig.qrImageUrl} alt="QR" className="w-full h-full object-contain" />
                                  </div>
                                )}
                                <div className="space-y-0.5 text-[11px] text-stone-600 dark:text-stone-300">
                                  <p>
                                    Titular: <strong className="text-stone-900 dark:text-white">{currentSelectedConfig.accountHolder}</strong>
                                  </p>
                                  {currentSelectedConfig.breBKey && (
                                    <p>
                                      Llave Bre-B: <strong className="font-mono text-stone-900 dark:text-white">{currentSelectedConfig.breBKey}</strong>
                                    </p>
                                  )}
                                  <p className="text-[10px] text-stone-400">
                                    Envía <strong>{formatCOP(selectedPlan.priceCOP)} COP</strong> desde tu app.
                                  </p>
                                </div>
                              </div>

                              <div>
                                <input
                                  type="text"
                                  value={voucherOrPhoneInput}
                                  onChange={(e) => setVoucherOrPhoneInput(e.target.value)}
                                  placeholder="Nº de comprobante o celular de envío (Opcional)"
                                  className="w-full p-2 text-[11px] border rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-white font-mono"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>


                  {/* Terms Checkbox */}
                  <div className="pt-2 flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id="terms"
                      required
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-gold-600 rounded focus:ring-gold-500 cursor-pointer"
                    />
                    <label htmlFor="terms" className="text-[11px] text-stone-600 dark:text-stone-400 font-sans leading-tight cursor-pointer">
                      Acepto las condiciones editoriales de publicación, el valor de {formatCOP(selectedPlan.priceCOP)} COP por el {selectedPlan.name} y entiendo que toda publicación está sujeta a la aprobación de Julian Camilo.
                    </label>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950 text-xs font-semibold uppercase tracking-wider hover:bg-gold-600 transition-all disabled:opacity-50 shadow-md cursor-pointer flex items-center justify-center space-x-2 pt-3"
                  >
                    <Lock className="w-3.5 h-3.5 text-gold-400 dark:text-stone-950" />
                    <span>{submitting ? 'Procesando Pago Seguro...' : `Suscribirme por ${formatCOP(selectedPlan.priceCOP)} COP`}</span>
                  </button>
                </form>

                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[10px] text-stone-400 font-sans">
                  <span className="flex items-center">
                    <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
                    Pagos verificados por Wompi Bancolombia
                  </span>
                  <span>Sin permanencia obligatoria</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

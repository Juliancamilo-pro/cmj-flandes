import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
  ShieldCheck, 
  CreditCard, 
  Smartphone, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  ArrowRight, 
  Sparkles,
  Lock,
  RefreshCw,
  Copy,
  Check,
  Coins,
  ExternalLink,
  QrCode,
  ZoomIn,
  X,
  Download
} from 'lucide-react';
import { PaymentMethod, Donation, DonationStatus, FinancialSettings, PaymentMethodConfig } from '../../types';
import { createDonation, updateDonationStatus, getFinancialSettings, sendContactMessage, DEFAULT_PAYMENT_METHODS_CONFIG } from '../../services/db';
import { openWompiCheckout, verifyWompiTransaction } from '../../services/wompi';

const SUGGESTED_AMOUNTS = [
  { value: 10000, label: '$10.000', impact: 'Aporte café editorial' },
  { value: 20000, label: '$20.000', impact: 'Apoyo a columna de opinión' },
  { value: 50000, label: '$50.000', impact: 'Investigación periodística', popular: true },
  { value: 100000, label: '$100.000', impact: 'Mecenazgo editorial independiente' },
  { value: 200000, label: '$200.000', impact: 'Fondo de desarrollo del portal' },
];

interface MethodDisplayItem {
  id: PaymentMethod;
  name: string;
  icon: any;
  description: string;
  badge?: string;
  config?: PaymentMethodConfig;
}

export const DonationsPage: React.FC = () => {
  const [selectedAmount, setSelectedAmount] = useState<number>(50000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('nequi');
  const [donorName, setDonorName] = useState<string>('');
  const [donorEmail, setDonorEmail] = useState<string>('');
  const [donorMessage, setDonorMessage] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [voucherOrPhoneInput, setVoucherOrPhoneInput] = useState<string>('');

  // Flow State
  const [step, setStep] = useState<'form' | 'processing' | 'confirmed' | 'failed'>('form');
  const [createdDonation, setCreatedDonation] = useState<Donation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // QR Zoom Modal State
  const [zoomQrModalOpen, setZoomQrModalOpen] = useState(false);

  // Financial Settings & Wompi
  const [financialSettings, setFinancialSettings] = useState<FinancialSettings | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const s = await getFinancialSettings();
      setFinancialSettings(s);
      
      // Check which methods are enabled
      const cfg = s.paymentMethodsConfig || DEFAULT_PAYMENT_METHODS_CONFIG;
      const enabledKeys = Object.keys(cfg).filter(k => cfg[k]?.enabled);
      
      // Auto select first enabled method
      if (enabledKeys.length > 0) {
        setPaymentMethod(enabledKeys[0] as PaymentMethod);
      }
    } catch (e) {
      console.warn('Error loading financial settings:', e);
    }
  };

  const currentAmount = isCustom ? parseInt(customAmount || '0', 10) : selectedAmount;
  const estimatedUSD = (currentAmount / 4100).toFixed(2);

  // Build the list of active payment methods according to admin settings
  const cfg = financialSettings?.paymentMethodsConfig || DEFAULT_PAYMENT_METHODS_CONFIG;
  
  const allPossibleMethods: MethodDisplayItem[] = [
    {
      id: 'nequi',
      name: cfg.nequi?.name || 'Nequi / Bre-B',
      icon: Smartphone,
      description: cfg.nequi?.instructions || 'Transfiere con Llave Bre-B o escanea el código QR.',
      badge: cfg.nequi?.badge || 'Bre-B Inmediato',
      config: cfg.nequi
    },
    {
      id: 'daviplata',
      name: cfg.daviplata?.name || 'Daviplata / Bre-B',
      icon: Smartphone,
      description: cfg.daviplata?.instructions || 'Pásale por Bre-B o código QR Daviplata.',
      badge: cfg.daviplata?.badge || 'Bre-B Casita Roja',
      config: cfg.daviplata
    },
    {
      id: 'bancolombia_qr',
      name: cfg.bancolombia_qr?.name || 'Bancolombia / Código QR',
      icon: Coins,
      description: cfg.bancolombia_qr?.instructions || 'Código QR oficial desde App Bancolombia.',
      badge: cfg.bancolombia_qr?.badge || 'Transferencia',
      config: cfg.bancolombia_qr
    },
    {
      id: 'pse',
      name: cfg.pse?.name || 'PSE (Bancos Colombianos)',
      icon: Building2,
      description: cfg.pse?.instructions || 'Débito bancario desde más de 25 bancos colombianos.',
      badge: cfg.pse?.badge || 'Débito ACH',
      config: cfg.pse
    },
    {
      id: 'card',
      name: cfg.card?.name || 'Tarjetas Débito / Crédito',
      icon: CreditCard,
      description: cfg.card?.instructions || 'Visa, Mastercard o American Express.',
      badge: cfg.card?.badge || 'Nacional e Int.',
      config: cfg.card
    }
  ];

  // Filter only active methods
  const activeMethods = allPossibleMethods.filter(m => {
    const methodCfg = cfg[m.id];
    return methodCfg ? methodCfg.enabled : false;
  });

  // If no methods enabled by error, fallback to Nequi
  const displayMethods = activeMethods.length > 0 ? activeMethods : [allPossibleMethods[0]];
  const selectedMethodItem = displayMethods.find(m => m.id === paymentMethod) || displayMethods[0];
  const selectedConfig = selectedMethodItem.config;

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmount(raw);
    setIsCustom(true);
  };

  const handleSelectPreset = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustom(false);
    setCustomAmount('');
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const dynamicSuggestedAmounts =
    financialSettings?.suggestedDonationAmounts && financialSettings.suggestedDonationAmounts.length > 0
      ? financialSettings.suggestedDonationAmounts.map((val, idx) => ({
          value: val,
          label: `$${val.toLocaleString('es-CO')}`,
          impact:
            SUGGESTED_AMOUNTS.find((s) => s.value === val)?.impact || 'Apoyo editorial directo',
          popular: idx === 2
        }))
      : SUGGESTED_AMOUNTS;

  const handleSubmitDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (currentAmount < 5000) {
      setErrorMsg('El monto mínimo de donación es de $5.000 COP.');
      return;
    }

    if (!isAnonymous && !donorName.trim()) {
      setErrorMsg('Por favor ingresa tu nombre o marca la opción de donación anónima.');
      return;
    }

    if (donorEmail.trim() && !donorEmail.includes('@')) {
      setErrorMsg('Si ingresas un correo electrónico, asegúrate de que sea válido.');
      return;
    }

    const isManualQrMethod =
      paymentMethod === 'nequi' ||
      paymentMethod === 'daviplata' ||
      paymentMethod === 'bancolombia_qr';

    if (isManualQrMethod && !voucherOrPhoneInput.trim()) {
      setErrorMsg(
        'Por favor ingresa el número de comprobante, referencia o celular desde el cual realizaste la transferencia.'
      );
      return;
    }

    setStep('processing');

    try {
      const reference = voucherOrPhoneInput.trim()
        ? `DON-${voucherOrPhoneInput.trim().toUpperCase()}`
        : `DON-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const receiptNumber = `REC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      const donationPayload: Omit<Donation, 'id' | 'createdAt'> = {
        donorName: isAnonymous ? 'Lector Anónimo' : donorName.trim(),
        donorEmail: donorEmail.trim() ? donorEmail.trim().toLowerCase() : 'anonimo@juliancamilo.co',
        amountCOP: currentAmount,
        currency: 'COP',
        paymentMethod,
        status: 'pendiente',
        reference,
        message: donorMessage.trim() || undefined,
        isAnonymous,
        bankName: selectedConfig?.bankEntity || 'Nequi',
        receiptNumber
      };

      const { id } = await createDonation(donationPayload);

      // Notify owner of new donation
      try {
        await sendContactMessage({
          name: donationPayload.donorName,
          email: donationPayload.donorEmail,
          subject: `Nueva Donación (${paymentMethod.toUpperCase()}) - $${currentAmount.toLocaleString('es-CO')} COP`,
          message: `Referencia: ${reference} | Comprobante: ${receiptNumber}${
            donorMessage.trim() ? ` | Mensaje: ${donorMessage.trim()}` : ''
          }`
        });
      } catch {}

      // If Wompi gateway is used (PSE / Card)
      if (!isManualQrMethod && financialSettings?.wompiPublicKey) {
        await openWompiCheckout(
          {
            reference,
            amountCOP: currentAmount,
            customerEmail: donationPayload.donorEmail,
            customerName: isAnonymous ? 'Lector Julian Camilo' : donorName.trim(),
            redirectUrl: window.location.href.split('#')[0] + '#donaciones'
          },
          financialSettings,
          async (result) => {
            const txId = result?.transaction?.id;
            let outcome: DonationStatus = 'pendiente';
            if (txId) {
              const verification = await verifyWompiTransaction(
                txId,
                financialSettings.wompiPublicKey
              );
              if (verification.success && verification.status === 'APPROVED') {
                outcome = 'aprobada';
              } else if (verification.status === 'DECLINED' || verification.status === 'ERROR') {
                outcome = 'rechazada';
              }
            }

            await updateDonationStatus(id, outcome, txId || reference, receiptNumber);
            const finalized: Donation = {
              ...donationPayload,
              id,
              reference,
              status: outcome,
              receiptNumber,
              transactionId: txId || reference,
              createdAt: new Date().toISOString(),
              confirmedAt: outcome === 'aprobada' ? new Date().toISOString() : undefined
            };
            setCreatedDonation(finalized);
            setStep(outcome === 'rechazada' ? 'failed' : 'confirmed');
          }
        );
        return;
      }

      // Manual QR / Bre-B transfer: recorded as 'pendiente' for owner verification (no fake instant approval)
      const finalizedDonation: Donation = {
        ...donationPayload,
        id,
        reference,
        status: 'pendiente',
        receiptNumber,
        transactionId: reference,
        createdAt: new Date().toISOString()
      };

      setCreatedDonation(finalizedDonation);
      setStep('confirmed');
    } catch (err: any) {
      console.error('Error in donation flow:', err);
      setErrorMsg('Ocurrió un error al procesar la donación: ' + (err.message || ''));
      setStep('form');
    }
  };

  const handleCopyReference = () => {
    if (!createdDonation?.reference) return;
    navigator.clipboard.writeText(createdDonation.reference);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-14 px-4 space-y-12">
      {/* 1. Colombian Tricolor & Header */}
      <header className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gold-50 dark:bg-gold-950/40 border border-gold-300 dark:border-gold-800 text-gold-900 dark:text-gold-300 text-xs font-semibold uppercase tracking-wider font-sans">
          <HeartHandshake className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400" />
          <span>Apoyo al Periodismo y Columnismo Independiente • Colombia</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-serif font-black text-[#121212] dark:text-[#f3ede2] tracking-tight leading-[1.15]">
          Aporte Solidario & Donaciones
        </h1>

        <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 font-serif italic leading-relaxed">
          {financialSettings?.donationCustomMessage ||
            '"Un espacio de pensamiento crítico solo puede ser libre si se sostiene con la confianza y el compromiso ético de sus propios lectores."'}
        </p>
      </header>

      {/* Main Donation Container */}
      <div className="bg-white dark:bg-[#18181b] border border-[#e8e5dc] dark:border-stone-800 rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        {step === 'processing' && (
          <div className="py-16 text-center space-y-5 animate-fadeIn">
            <RefreshCw className="w-12 h-12 text-gold-600 animate-spin mx-auto" />
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-2xl text-[#121212] dark:text-white">
                Procesando tu Donación Segura
              </h3>
              <p className="text-xs text-stone-500 font-sans">
                Registrando tu aporte en el sistema editorial de Julian Camilo...
              </p>
            </div>
          </div>
        )}

        {step === 'confirmed' && createdDonation && (
          <div className="space-y-6 text-center py-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider font-sans">
                ¡Donación Registrada Exitosamente!
              </span>
              <h3 className="font-serif font-black text-2xl sm:text-3xl text-[#121212] dark:text-[#f3ede2]">
                Muchas gracias por tu respaldo, {createdDonation.donorName}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-sans max-w-lg mx-auto">
                Tu aporte sostiene este ejercicio de reflexión y análisis sin compromisos comerciales. Se ha generado tu comprobante oficial de donación.
              </p>
            </div>

            {/* Official Printable Voucher */}
            <div className="p-6 rounded-2xl bg-[#faf8f4] dark:bg-[#141416] border border-[#e8e5dc] dark:border-stone-800 text-left space-y-4 max-w-lg mx-auto text-xs font-sans shadow-xs">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
                <span className="font-serif font-black text-base text-stone-900 dark:text-white">
                  Comprobante Oficial de Aporte
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    createdDonation.status === 'aprobada'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  {createdDonation.status === 'aprobada' ? 'Aprobado' : 'Pendiente de Verificación'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-stone-600 dark:text-stone-300">
                <div>
                  <span className="block text-[10px] text-stone-400 uppercase font-sans">Folio de Recibo</span>
                  <span className="font-mono font-bold text-stone-900 dark:text-white">{createdDonation.receiptNumber}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-stone-400 uppercase font-sans">Referencia</span>
                  <span className="font-mono font-bold text-stone-900 dark:text-white">{createdDonation.reference}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-stone-400 uppercase font-sans">Valor Aportado</span>
                  <span className="font-bold text-stone-900 dark:text-white text-sm">
                    ${createdDonation.amountCOP.toLocaleString('es-CO')} COP
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-stone-400 uppercase font-sans">Medio de Pago</span>
                  <span className="font-bold uppercase text-stone-900 dark:text-white">
                    {createdDonation.paymentMethod} ({createdDonation.bankName || 'Colombia'})
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-stone-400 uppercase font-sans">Fecha y Hora</span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">
                    {new Date(createdDonation.createdAt).toLocaleString('es-CO')}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-stone-400 uppercase font-sans">Beneficiario</span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">
                    Julian Camilo (Plataforma Editorial)
                  </span>
                </div>
              </div>

              {createdDonation.message && (
                <div className="pt-2 border-t border-stone-200 dark:border-stone-800">
                  <span className="text-[10px] text-stone-400 uppercase font-sans block mb-1">
                    Tu Dedicatoria:
                  </span>
                  <p className="font-serif italic text-stone-800 dark:text-stone-200">
                    "{createdDonation.message}"
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="px-5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-semibold flex items-center space-x-2 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir o Guardar PDF</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('form');
                  setCreatedDonation(null);
                }}
                className="px-6 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-stone-950 text-xs font-bold uppercase tracking-wider shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <span>Hacer Otra Donación</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 'failed' && (
          <div className="space-y-6 text-center py-8 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-9 h-9" />
            </div>
            <h3 className="font-serif font-bold text-2xl text-[#121212] dark:text-white">
              No se pudo confirmar la donación
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto font-sans">
              No se ha realizado ningún cobro a tu cuenta. Puedes verificar los datos de la transferencia e intentarlo de nuevo.
            </p>
            <button
              onClick={() => setStep('form')}
              className="px-6 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-stone-950 text-xs font-bold uppercase tracking-wider"
            >
              Intentar de Nuevo
            </button>
          </div>
        )}

        {step === 'form' && (
          <form onSubmit={handleSubmitDonation} className="space-y-8 animate-fadeIn">
            {errorMsg && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Step 1: Amount Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 font-sans">
                  1. Selecciona el valor de tu donación (COP)
                </label>
                <span className="text-xs text-gold-600 dark:text-gold-400 font-mono font-semibold">
                  Aporte libre
                </span>
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {dynamicSuggestedAmounts.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleSelectPreset(preset.value)}
                    className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer relative ${
                      !isCustom && selectedAmount === preset.value
                        ? 'border-gold-500 bg-gold-500 text-stone-950 font-bold shadow-lg shadow-gold-500/20 ring-2 ring-gold-500/30'
                        : 'border-[#eeeae1] dark:border-stone-800 bg-[#faf8f4] dark:bg-[#141416] text-stone-800 dark:text-stone-200 hover:border-gold-400'
                    }`}
                  >
                    {preset.popular && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-gold-600 text-white text-[9px] font-bold uppercase tracking-wider">
                        Sugerido
                      </span>
                    )}
                    <span className="font-serif font-bold text-base block">
                      {preset.label}
                    </span>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5">
                      {preset.impact}
                    </span>
                  </button>
                ))}
              </div>

              {/* Custom Amount input */}
              <div className="p-4 rounded-2xl bg-[#faf8f4] dark:bg-[#141416] border border-[#eeeae1] dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="space-y-0.5 text-center sm:text-left">
                  <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                    O introduce otra cantidad personalizada:
                  </span>
                  <p className="text-[11px] text-stone-400">
                    Elige exactamente cuánto deseas aportar (mínimo $5.000 COP).
                  </p>
                </div>

                <div className="relative w-full sm:w-56">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-serif font-bold text-base">
                    $
                  </span>
                  <input
                    type="text"
                    value={customAmount}
                    onChange={handleCustomAmountChange}
                    placeholder="Ej. 150000"
                    className="w-full pl-8 pr-14 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono text-base font-bold focus:border-gold-500 focus:outline-none"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 uppercase font-bold">
                    COP
                  </span>
                </div>
              </div>

              {/* Value Summary Display */}
              <div className="p-4 rounded-2xl bg-gold-50/60 dark:bg-gold-950/20 border border-gold-200 dark:border-gold-900/50 flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider font-sans">
                  Total a donar:
                </span>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-black font-serif text-gold-700 dark:text-gold-400">
                    ${currentAmount > 0 ? currentAmount.toLocaleString('es-CO') : '0'} COP
                  </span>
                  <span className="text-xs text-stone-400 font-mono block">
                    ≈ ${estimatedUSD} USD (referencia internacional)
                  </span>
                </div>
              </div>
            </div>

            {/* Step 2: Colombian Payment Method Selector (Filtered by Admin) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 font-sans">
                  2. Método de Pago Disponible
                </label>
                <span className="text-[11px] text-stone-500 font-sans">
                  {displayMethods.length === 1 
                    ? `Activo: ${displayMethods[0].name}` 
                    : `${displayMethods.length} opciones habilitadas`}
                </span>
              </div>

              {/* Method Cards */}
              <div className={`grid gap-3 ${displayMethods.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                {displayMethods.map((method) => {
                  const Icon = method.icon;
                  const isSelected = paymentMethod === method.id;

                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start space-x-3.5 relative ${
                        isSelected
                          ? 'border-gold-500 bg-gold-50/40 dark:bg-gold-950/20 shadow-md ring-2 ring-gold-500/20'
                          : 'border-[#eeeae1] dark:border-stone-800 bg-[#faf8f4] dark:bg-[#141416] hover:border-gold-400'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-gold-500 text-stone-950 shadow-md shadow-gold-500/30'
                            : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                            {method.name}
                          </span>
                          {method.badge && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gold-100 dark:bg-gold-900/60 text-gold-800 dark:text-gold-300">
                              {method.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-tight mt-0.5 line-clamp-2">
                          {method.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Dedicated Colombian QR & Bre-B Card */}
              {selectedConfig && (
                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#faf8f4] to-[#f4f0e6] dark:from-[#1b1a18] dark:to-[#141416] border border-gold-300 dark:border-stone-800 space-y-4 shadow-sm animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gold-200/70 dark:border-stone-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <QrCode className="w-5 h-5 text-gold-600 dark:text-gold-400" />
                      <h4 className="font-serif font-black text-base text-stone-900 dark:text-white">
                        Pagar con {selectedMethodItem.name}
                      </h4>
                    </div>

                    {selectedConfig.breBKey && (
                      <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-mono">
                        <span className="text-stone-400">Llave Bre-B:</span>
                        <strong className="text-stone-900 dark:text-white">{selectedConfig.breBKey}</strong>
                        <button
                          type="button"
                          onClick={() => handleCopyKey(selectedConfig.breBKey!)}
                          className="ml-1 text-gold-600 hover:text-gold-700 cursor-pointer"
                          title="Copiar llave"
                        >
                          {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* QR Preview Column */}
                    {selectedConfig.qrImageUrl && (
                      <div className="md:col-span-4 flex flex-col items-center space-y-2">
                        <div 
                          onClick={() => setZoomQrModalOpen(true)}
                          className="w-44 h-44 rounded-2xl bg-white p-2 border border-stone-200 dark:border-stone-700 shadow-sm cursor-pointer group relative overflow-hidden"
                          title="Clic para ver código QR en tamaño grande"
                        >
                          <img 
                            src={selectedConfig.qrImageUrl} 
                            alt={`Código QR ${selectedMethodItem.name}`} 
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform" 
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <ZoomIn className="w-6 h-6" />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setZoomQrModalOpen(true)}
                          className="text-xs font-semibold text-gold-700 dark:text-gold-400 hover:underline inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                          <span>Ampliar Código QR</span>
                        </button>
                      </div>
                    )}

                    {/* Step by step guide */}
                    <div className={selectedConfig.qrImageUrl ? 'md:col-span-8 space-y-3' : 'md:col-span-12 space-y-3'}>
                      <div className="space-y-1">
                        <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider font-sans">
                          Titular Registrado
                        </span>
                        <p className="font-serif font-black text-lg text-stone-900 dark:text-white">
                          {selectedConfig.accountHolder || 'Julian Trujillo'}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-sans space-y-1.5 text-stone-600 dark:text-stone-300">
                        <p className="font-bold text-stone-900 dark:text-white flex items-center space-x-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Pasos rápidos para transferir:</span>
                        </p>
                        <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] leading-relaxed">
                          <li>Abre la app de tu billetera digital (Nequi / Daviplata / Bancolombia) en tu teléfono.</li>
                          <li>Escanea el código QR que ves aquí o usa la opción <strong>Transferir</strong> con la Llave Bre-B <strong>{selectedConfig.breBKey || '1072101045'}</strong>.</li>
                          <li>Ingresa el monto exacto: <strong>${currentAmount.toLocaleString('es-CO')} COP</strong> a nombre de <strong>{selectedConfig.accountHolder}</strong>.</li>
                          <li>Completa la transferencia en tu app y anota el número de confirmación abajo.</li>
                        </ol>
                      </div>

                      {/* Manual Reference / Phone input */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1 font-sans">
                          Número de Comprobante / Celular Nequi de envío (Recomendado)
                        </label>
                        <input
                          type="text"
                          value={voucherOrPhoneInput}
                          onChange={(e) => setVoucherOrPhoneInput(e.target.value)}
                          placeholder="Ej. M1234567 o tu número de celular"
                          className="w-full p-2.5 text-xs font-mono rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white"
                        />
                        <span className="text-[10px] text-stone-400 mt-0.5 block">
                          Esto permite validar de inmediato tu aporte con tu comprobante.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Donor Details */}
            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 font-sans">
                3. Tus datos de contacto (Confidenciales)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-stone-600 dark:text-stone-400 font-sans">
                    Tu nombre completo {isAnonymous && '(Opcional)'}
                  </label>
                  <input
                    type="text"
                    disabled={isAnonymous}
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder={isAnonymous ? 'Donación Anónima' : 'Ej. Carolina Herrera'}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs focus:border-gold-500 focus:outline-none disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-stone-600 dark:text-stone-400 font-sans">
                    Correo electrónico (Opcional — para enviarte el recibo)
                  </label>
                  <input
                    type="email"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs focus:border-gold-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="anonymous-check"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 rounded text-gold-600 focus:ring-gold-500 cursor-pointer"
                />
                <label htmlFor="anonymous-check" className="text-xs text-stone-600 dark:text-stone-400 cursor-pointer select-none font-sans">
                  Deseo que mi donación figure como anónima en los agradecimientos públicos.
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-stone-600 dark:text-stone-400 font-sans">
                  Mensaje o dedicatoria para Julian Camilo (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={donorMessage}
                  onChange={(e) => setDonorMessage(e.target.value)}
                  placeholder="Escribe unas palabras de aliento o sugiere un tema de análisis..."
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs focus:border-gold-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-center space-x-2 text-xs text-stone-400 font-sans">
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                <span>Transacción segura y auditada. No almacenamos claves ni datos financieros sensibles.</span>
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-2xl bg-gold-500 hover:bg-gold-600 text-stone-950 font-serif font-black text-lg tracking-wide shadow-xl hover:shadow-2xl transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Confirmar y Enviar Donación de ${currentAmount.toLocaleString('es-CO')} COP</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* QR Zoom Modal */}
      {zoomQrModalOpen && selectedConfig?.qrImageUrl && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181c] rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-stone-200 dark:border-stone-800 relative animate-fadeIn">
            <button
              onClick={() => setZoomQrModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-800 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1 pt-2">
              <span className="text-[10px] text-gold-600 uppercase font-bold tracking-wider font-sans">
                Código QR de Pago
              </span>
              <h3 className="font-serif font-black text-xl text-stone-900 dark:text-white">
                {selectedMethodItem.name}
              </h3>
              <p className="text-xs text-stone-500 font-sans">
                Titular: {selectedConfig.accountHolder} • Llave: {selectedConfig.breBKey || '1072101045'}
              </p>
            </div>

            <div className="w-64 h-64 mx-auto rounded-2xl bg-white p-2 border border-stone-200 dark:border-stone-700 shadow-md">
              <img 
                src={selectedConfig.qrImageUrl} 
                alt="QR Ampliado" 
                className="w-full h-full object-contain" 
              />
            </div>

            <div className="flex items-center justify-center gap-2">
              <a
                href={selectedConfig.qrImageUrl}
                download={`${selectedMethodItem.name.toLowerCase().replace(/\s+/g, '_')}_qr.jpg`}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gold-500 text-stone-950 text-xs font-bold uppercase tracking-wider hover:bg-gold-600 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Imagen</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Transparency & Impact Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        <div className="p-6 rounded-2xl bg-[#faf8f4] dark:bg-[#18181b] border border-[#eeeae1] dark:border-stone-800 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-gold-100 dark:bg-gold-950/40 text-gold-700 dark:text-gold-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <h4 className="font-serif font-bold text-base text-[#121212] dark:text-[#f3ede2]">
            Independencia Editorial
          </h4>
          <p className="text-xs text-stone-600 dark:text-stone-400 font-sans leading-relaxed">
            Sin patrocinadores ocultos ni líneas impuestas. Cada opinión responde únicamente al análisis riguroso de la realidad colombiana.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#faf8f4] dark:bg-[#18181b] border border-[#eeeae1] dark:border-stone-800 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="font-serif font-bold text-base text-[#121212] dark:text-[#f3ede2]">
            Transparencia Total
          </h4>
          <p className="text-xs text-stone-600 dark:text-stone-400 font-sans leading-relaxed">
            Cada aporte se audita en la plataforma y se destina a la investigación, servidores y sostenimiento técnico del portal.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#faf8f4] dark:bg-[#18181b] border border-[#eeeae1] dark:border-stone-800 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h4 className="font-serif font-bold text-base text-[#121212] dark:text-[#f3ede2]">
            Recibo & Confirmación Inmediata
          </h4>
          <p className="text-xs text-stone-600 dark:text-stone-400 font-sans leading-relaxed">
            Recibes un comprobante oficial con número de folio, fecha y referencia para tu seguimiento personal.
          </p>
        </div>
      </section>
    </div>
  );
};

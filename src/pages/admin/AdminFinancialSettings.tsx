import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CreditCard, 
  ShieldCheck, 
  DollarSign, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  ExternalLink, 
  Smartphone, 
  Coins, 
  ArrowRight, 
  RefreshCw, 
  FileSpreadsheet, 
  Download,
  Filter,
  Search,
  Calendar,
  Clock,
  Star,
  Check,
  TrendingUp,
  ArrowUpRight,
  Send,
  Eye,
  History
} from 'lucide-react';
import { 
  FinancialSettings, 
  Donation, 
  SubscriberUser, 
  BankAccount, 
  DisbursementRecord, 
  FinancialAuditLog,
  FinancialTransactionStatus,
  AdProposal
} from '../../types';
import { 
  getFinancialSettings, 
  saveFinancialSettings, 
  getDonations, 
  getSubscribers,
  getAdProposals,
  getBankAccounts,
  getDisbursements,
  getFinancialAuditLogs,
  updateDisbursementStatus,
  createDisbursement,
  DEFAULT_FINANCIAL_SETTINGS 
} from '../../services/db';
import { maskAccountNumber } from '../../services/wompi';
import { BankAccountsManager } from '../../components/admin/BankAccountsManager';
import { PaymentMethodsManager } from '../../components/admin/PaymentMethodsManager';

export const AdminFinancialSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'methods' | 'history' | 'accounts' | 'disbursements' | 'wompi' | 'audit'>('metrics');
  const [settings, setSettings] = useState<FinancialSettings>(DEFAULT_FINANCIAL_SETTINGS);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriberUser[]>([]);
  const [adProposals, setAdProposals] = useState<AdProposal[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [disbursements, setDisbursements] = useState<DisbursementRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<FinancialAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters for History Tab
  const [filterType, setFilterType] = useState<'all' | 'donation' | 'subscription' | 'disbursement'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<'all' | '7days' | '30days' | '90days'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // New disbursement modal state
  const [newDisbModalOpen, setNewDisbModalOpen] = useState(false);
  const [disbAmountCOP, setDisbAmountCOP] = useState<number>(100000);
  const [disbPeriodName, setDisbPeriodName] = useState<string>('Liquidación Quincenal');
  const [disbNotes, setDisbNotes] = useState<string>('');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, donData, subData, adsData, accData, disbData, logsData] = await Promise.all([
        getFinancialSettings(),
        getDonations(),
        getSubscribers(),
        getAdProposals(),
        getBankAccounts(),
        getDisbursements(),
        getFinancialAuditLogs()
      ]);
      setSettings(s);
      setDonations(donData);
      setSubscribers(subData);
      setAdProposals(adsData);
      setBankAccounts(accData);
      setDisbursements(disbData);
      setAuditLogs(logsData);
    } catch (e) {
      console.error('Error loading financial center data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWompiConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await saveFinancialSettings(settings);
      setSuccessMsg('¡Credenciales y parámetros de Wompi guardados exitosamente!');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      console.error('Error saving financial config:', err);
      setErrorMsg('No fue posible guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePaymentMethods = async (newSettings: FinancialSettings) => {
    await saveFinancialSettings(newSettings);
    setSettings(newSettings);
    setSuccessMsg('¡Configuración de métodos de pago y códigos QR guardada exitosamente!');
    setTimeout(() => setSuccessMsg(null), 3500);
  };


  const handleCreateDisbursement = async (e: React.FormEvent) => {
    e.preventDefault();
    const primaryAccount = bankAccounts.find((a) => a.isPrimary) || bankAccounts[0];
    if (!primaryAccount) {
      setErrorMsg('Debes registrar al menos una cuenta bancaria antes de programar un desembolso.');
      return;
    }

    try {
      await createDisbursement({
        bankAccountId: primaryAccount.id,
        bankName: primaryAccount.bankName,
        accountNumberMasked: maskAccountNumber(primaryAccount.accountNumber),
        amountCOP: disbAmountCOP,
        reference: `DISB-${Date.now().toString(36).toUpperCase()}`,
        period: disbPeriodName,
        status: 'programado',
        notes: disbNotes.trim() || undefined
      });
      setNewDisbModalOpen(false);
      setDisbNotes('');
      await loadAll();
      setSuccessMsg('Desembolso programado exitosamente.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      console.error('Error creating disbursement:', e);
    }
  };

  const handleToggleDisbursementStatus = async (disb: DisbursementRecord) => {
    const nextStatus = disb.status === 'desembolsado' ? 'programado' : 'desembolsado';
    try {
      await updateDisbursementStatus(disb.id, nextStatus);
      await loadAll();
    } catch (e) {
      console.error('Error updating disbursement status:', e);
    }
  };

  // Primary receiving bank account
  const primaryAccount = bankAccounts.find((a) => a.isPrimary) || bankAccounts[0];

  // 1. Calculations: Total Donations
  const isApproved = (s: string) => s === 'aprobada' || s === 'aprobado' || s === 'desembolsado';
  const approvedDonations = donations.filter((d) => isApproved(d.status));
  const totalDonationsCOP = approvedDonations.reduce((acc, curr) => acc + (curr.amountCOP || 0), 0);

  // 2. Calculations: Subscriptions
  const activeSubscribers = subscribers.filter((s) => s.status === 'activa');
  const totalSubscriptionsCOP = activeSubscribers.reduce(
    (acc, curr) => acc + (curr.totalPaidCOP || curr.amountCOP || 20000),
    0
  );

  // 2b. Calculations: Advertising (confirmed third-party ads)
  const confirmedAds = adProposals.filter(
    (a) => !a.isOwnerAd && (a.status === 'activo' || a.status === 'finalizado' || a.status === 'aprobado')
  );
  const totalAdsCOP = confirmedAds.reduce((acc, curr) => acc + (curr.priceCOP || 0), 0);

  // Pending revenue across all 3 channels
  const pendingDonationsCOP = donations
    .filter((d) => d.status === 'pendiente' || d.status === 'procesando')
    .reduce((acc, d) => acc + (d.amountCOP || 0), 0);
  const pendingSubscribersCOP = subscribers
    .filter((s) => s.status === 'pendiente_pago')
    .reduce((acc, s) => acc + (s.amountCOP || 20000), 0);
  const pendingAdsCOP = adProposals
    .filter((a) => !a.isOwnerAd && (a.status === 'pendiente' || a.status === 'pendiente_pago'))
    .reduce((acc, a) => acc + (a.priceCOP || 0), 0);
  const totalPendingRevenueCOP = pendingDonationsCOP + pendingSubscribersCOP + pendingAdsCOP;

  // 3. Totals and Commissions
  const grandTotalGrossCOP = totalDonationsCOP + totalSubscriptionsCOP + totalAdsCOP;
  const approvedOperationsCount = approvedDonations.length + activeSubscribers.length + confirmedAds.length;
  // Wompi official average commission in Colombia: 2.65% + 700 COP + IVA per transaction
  const estimatedCommissionsCOP = Math.round(
    grandTotalGrossCOP * 0.0265 + approvedOperationsCount * 700
  );
  const netAvailableCOP = Math.max(0, grandTotalGrossCOP - estimatedCommissionsCOP);

  // 4. Disbursements Calculations
  const executedDisbursements = disbursements.filter((d) => d.status === 'desembolsado');
  const totalDisbursedCOP = executedDisbursements.reduce((acc, curr) => acc + (curr.amountCOP || 0), 0);
  const pendingDisbursements = disbursements.filter((d) => d.status === 'programado' || d.status === 'procesando');
  const totalPendingDisbursementCOP = pendingDisbursements.reduce((acc, curr) => acc + (curr.amountCOP || 0), 0);

  // 5. Transaction states counts
  const pendingTransactionsCount =
    donations.filter((d) => d.status === 'pendiente' || d.status === 'procesando').length +
    subscribers.filter((s) => s.status === 'pendiente_pago').length +
    adProposals.filter((a) => !a.isOwnerAd && (a.status === 'pendiente' || a.status === 'pendiente_pago')).length;
  const rejectedTransactionsCount = donations.filter((d) => d.status === 'rechazada' || d.status === 'rechazado' || d.status === 'cancelado').length;
  const totalTransactionsCount = donations.length + subscribers.length + adProposals.filter((a) => !a.isOwnerAd).length;

  // Unified financial history items
  interface FinancialItem {
    id: string;
    type: 'Donación' | 'Suscripción Premium' | 'Publicidad';
    reference: string;
    clientName: string;
    clientEmail: string;
    amountCOP: number;
    paymentMethod: string;
    status: string;
    date: string;
    disbursementStatus?: string;
  }

  const unifiedHistory: FinancialItem[] = [
    ...donations.map((d) => ({
      id: d.id,
      type: 'Donación' as const,
      reference: d.receiptNumber || d.reference,
      clientName: d.donorName,
      clientEmail: d.donorEmail,
      amountCOP: d.amountCOP,
      paymentMethod: d.paymentMethod,
      status: d.status,
      date: d.createdAt,
      disbursementStatus: d.disbursementStatus || (isApproved(d.status) ? 'desembolsado' : 'pendiente')
    })),
    ...subscribers.map((s) => ({
      id: s.id,
      type: 'Suscripción Premium' as const,
      reference: s.lastPaymentRef || `SUB-${s.id.slice(0, 8)}`,
      clientName: s.fullName,
      clientEmail: s.email,
      amountCOP: s.amountCOP || 20000,
      paymentMethod: s.paymentMethod || 'pse',
      status: s.status === 'activa' ? 'aprobado' : s.status === 'pendiente_pago' ? 'pendiente' : s.status,
      date: s.createdAt,
      disbursementStatus: s.status === 'activa' ? 'desembolsado' : 'pendiente'
    })),
    ...adProposals
      .filter((a) => !a.isOwnerAd && (a.priceCOP || 0) > 0)
      .map((a) => ({
        id: a.id,
        type: 'Publicidad' as const,
        reference: `AD-${a.id.slice(0, 8).toUpperCase()}`,
        clientName: a.businessName,
        clientEmail: a.subscriberEmail,
        amountCOP: a.priceCOP || 0,
        paymentMethod: 'wompi / transferencia',
        status:
          a.status === 'activo' || a.status === 'finalizado' || a.status === 'aprobado'
            ? 'aprobado'
            : a.status === 'pendiente' || a.status === 'pendiente_pago'
            ? 'pendiente'
            : 'rechazado',
        date: a.createdAt,
        disbursementStatus:
          a.status === 'activo' || a.status === 'finalizado' ? 'desembolsado' : 'pendiente'
      }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Apply filters
  const filteredHistory = unifiedHistory.filter((item) => {
    if (filterType === 'donation' && item.type !== 'Donación') return false;
    if (filterType === 'subscription' && item.type !== 'Suscripción Premium') return false;

    if (filterStatus !== 'all') {
      if (filterStatus === 'aprobado' && !isApproved(item.status)) return false;
      if (filterStatus === 'pendiente' && item.status !== 'pendiente' && item.status !== 'procesando') return false;
      if (filterStatus === 'rechazado' && item.status !== 'rechazada' && item.status !== 'rechazado' && item.status !== 'cancelado') return false;
    }

    if (filterPeriod !== 'all') {
      const now = new Date().getTime();
      const itemTime = new Date(item.date).getTime();
      const diffDays = (now - itemTime) / (1000 * 3600 * 24);
      if (filterPeriod === '7days' && diffDays > 7) return false;
      if (filterPeriod === '30days' && diffDays > 30) return false;
      if (filterPeriod === '90days' && diffDays > 90) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.reference.toLowerCase().includes(q) ||
        item.clientName.toLowerCase().includes(q) ||
        item.clientEmail.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const exportFinancialCSV = () => {
    const rows = [
      ['Tipo', 'Referencia / Folio', 'Nombre Titular', 'Correo', 'Monto COP', 'Medio de Pago', 'Estado Transaccion', 'Estado Desembolso', 'Fecha']
    ];

    filteredHistory.forEach((item) => {
      rows.push([
        item.type,
        item.reference,
        `"${item.clientName.replace(/"/g, '""')}"`,
        item.clientEmail,
        String(item.amountCOP),
        item.paymentMethod.toUpperCase(),
        item.status.toUpperCase(),
        item.disbursementStatus?.toUpperCase() || 'N/A',
        item.date
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_financiero_julian_camilo_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'aprobada' || s === 'aprobado' || s === 'activa') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>Aprobado</span>
        </span>
      );
    }
    if (s === 'pendiente' || s === 'procesando' || s === 'pendiente_pago') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          <span>{s === 'procesando' ? 'Procesando' : 'Pendiente'}</span>
        </span>
      );
    }
    if (s === 'desembolsado') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
          <DollarSign className="w-3 h-3 text-sky-600 dark:text-sky-400" />
          <span>Desembolsado</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
        <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
        <span>{s === 'cancelada' || s === 'cancelado' ? 'Cancelado' : 'Rechazado'}</span>
      </span>
    );
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#e5e1d5] dark:border-stone-800 pb-6 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase tracking-widest text-gold-600 dark:text-gold-400 font-bold font-sans">
              Administración Central
            </span>
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-gold-500/10 text-gold-700 dark:text-gold-300 border border-gold-300 dark:border-gold-700/50">
              <ShieldCheck className="w-3 h-3 text-gold-600" />
              <span>Acceso Exclusivo Propietario</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#121212] dark:text-white mt-1">
            Centro Financiero
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-sans mt-0.5">
            Control integral de donaciones, suscripciones, pasarela Wompi Bancolombia y dispersión a cuentas bancarias verificadas.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={exportFinancialCSV}
            className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 font-sans text-xs uppercase tracking-wider font-semibold transition-all inline-flex items-center space-x-2 shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-stone-600 dark:text-stone-400" />
            <span>Descargar CSV</span>
          </button>

          <button
            onClick={loadAll}
            disabled={loading}
            className="p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-all cursor-pointer"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Donaciones Recibidas */}
        <div className="bg-white dark:bg-[#18181b] border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-sans">Donaciones</span>
            <Coins className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-serif font-black text-stone-900 dark:text-white">
            ${totalDonationsCOP.toLocaleString('es-CO')} <span className="text-xs font-sans font-bold text-stone-400">COP</span>
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500">
            <span>{approvedDonations.length} donaciones aprobadas</span>
            <span className="text-emerald-600 font-bold">100% libre</span>
          </div>
        </div>

        {/* Card 2: Ingresos Suscripciones */}
        <div className="bg-white dark:bg-[#18181b] border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-sans">Suscripciones</span>
            <Building2 className="w-5 h-5 text-gold-500" />
          </div>
          <p className="text-2xl font-serif font-black text-stone-900 dark:text-white">
            ${totalSubscriptionsCOP.toLocaleString('es-CO')} <span className="text-xs font-sans font-bold text-stone-400">COP</span>
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500">
            <span>{activeSubscribers.length} miembros Premium activos</span>
            <span className="font-semibold text-gold-600">$20K/mes</span>
          </div>
        </div>

        {/* Card 3: Dinero Disponible Neto */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-stone-500/5 to-gold-500/10 dark:from-emerald-950/30 dark:to-stone-900 border border-emerald-300 dark:border-emerald-800/80 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-sans">Dinero Disponible</span>
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-serif font-black text-emerald-900 dark:text-emerald-200">
            ${netAvailableCOP.toLocaleString('es-CO')} <span className="text-xs font-sans font-bold text-stone-400">COP</span>
          </p>
          <div className="mt-2 text-[11px] text-stone-500 dark:text-stone-400 flex items-center justify-between">
            <span>Bruto: ${grandTotalGrossCOP.toLocaleString('es-CO')}</span>
            <span className="text-rose-500 text-[10px]">Comis. ~${estimatedCommissionsCOP.toLocaleString('es-CO')}</span>
          </div>
        </div>

        {/* Card 4: Cuenta Bancaria de Destino */}
        <div className="bg-white dark:bg-[#18181b] border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider font-sans">Cuenta de Destino</span>
              <CreditCard className="w-5 h-5 text-sky-500" />
            </div>
            {primaryAccount ? (
              <div className="space-y-0.5">
                <p className="text-sm font-serif font-black text-stone-900 dark:text-white truncate">
                  {primaryAccount.bankName}
                </p>
                <p className="text-xs font-mono font-bold text-stone-600 dark:text-stone-300">
                  {maskAccountNumber(primaryAccount.accountNumber)}
                </p>
              </div>
            ) : (
              <p className="text-xs text-rose-500 font-semibold">Sin cuenta principal vinculada</p>
            )}
          </div>
          <div className="mt-2 pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px]">
            <span className="text-emerald-600 font-semibold">Desembolsos T+1</span>
            <button
              onClick={() => setActiveTab('accounts')}
              className="text-gold-600 dark:text-gold-400 hover:underline font-bold cursor-pointer"
            >
              Administrar
            </button>
          </div>
        </div>
      </div>

      {/* Confirmed vs Pending vs Settled Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Ingresos Confirmados (3 Canales)
            </span>
            <p className="text-xl font-serif font-black text-emerald-900 dark:text-emerald-200 mt-0.5">
              ${grandTotalGrossCOP.toLocaleString('es-CO')} COP
            </p>
            <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80">
              Susc: ${totalSubscriptionsCOP.toLocaleString('es-CO')} • Pub: ${totalAdsCOP.toLocaleString('es-CO')} • Don: ${totalDonationsCOP.toLocaleString('es-CO')}
            </span>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Ingresos Pendientes de Verificación
            </span>
            <p className="text-xl font-serif font-black text-amber-900 dark:text-amber-200 mt-0.5">
              ${totalPendingRevenueCOP.toLocaleString('es-CO')} COP
            </p>
            <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80">
              {pendingTransactionsCount} operaciones por confirmar
            </span>
          </div>
          <Clock className="w-6 h-6 text-amber-600 shrink-0" />
        </div>

        <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">
              Dinero Desembolsado / Liquidado
            </span>
            <p className="text-xl font-serif font-black text-sky-900 dark:text-sky-200 mt-0.5">
              ${totalDisbursedCOP.toLocaleString('es-CO')} COP
            </p>
            <span className="text-[10px] text-sky-700/80 dark:text-sky-400/80">
              Programado: ${totalPendingDisbursementCOP.toLocaleString('es-CO')} COP
            </span>
          </div>
          <Building2 className="w-6 h-6 text-sky-600 shrink-0" />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap border-b border-stone-200 dark:border-stone-800 gap-2">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`pb-3 px-4 text-xs uppercase tracking-wider font-bold font-sans transition-all border-b-2 cursor-pointer flex items-center space-x-2 ${
            activeTab === 'metrics'
              ? 'border-gold-600 text-gold-600 dark:text-gold-400 dark:border-gold-400'
              : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Resumen & Métricas</span>
        </button>

        <button
          onClick={() => setActiveTab('methods')}
          className={`pb-3 px-4 text-xs uppercase tracking-wider font-bold font-sans transition-all border-b-2 cursor-pointer flex items-center space-x-2 ${
            activeTab === 'methods'
              ? 'border-gold-600 text-gold-600 dark:text-gold-400 dark:border-gold-400'
              : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <Smartphone className="w-4 h-4 text-gold-500" />
          <span>Métodos de Pago & QR ({Object.values(settings.paymentMethodsConfig || {}).filter(m => m?.enabled).length} Activos)</span>
        </button>


        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-4 text-xs uppercase tracking-wider font-bold font-sans transition-all border-b-2 cursor-pointer flex items-center space-x-2 ${
            activeTab === 'history'
              ? 'border-gold-600 text-gold-600 dark:text-gold-400 dark:border-gold-400'
              : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Historial Financiero ({unifiedHistory.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('accounts')}
          className={`pb-3 px-4 text-xs uppercase tracking-wider font-bold font-sans transition-all border-b-2 cursor-pointer flex items-center space-x-2 ${
            activeTab === 'accounts'
              ? 'border-gold-600 text-gold-600 dark:text-gold-400 dark:border-gold-400'
              : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Mis Cuentas de Desembolso ({bankAccounts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('disbursements')}
          className={`pb-3 px-4 text-xs uppercase tracking-wider font-bold font-sans transition-all border-b-2 cursor-pointer flex items-center space-x-2 ${
            activeTab === 'disbursements'
              ? 'border-gold-600 text-gold-600 dark:text-gold-400 dark:border-gold-400'
              : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Desembolsos a Bancos ({disbursements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('wompi')}
          className={`pb-3 px-4 text-xs uppercase tracking-wider font-bold font-sans transition-all border-b-2 cursor-pointer flex items-center space-x-2 ${
            activeTab === 'wompi'
              ? 'border-gold-600 text-gold-600 dark:text-gold-400 dark:border-gold-400'
              : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Pasarela Wompi & Producción</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-4 text-xs uppercase tracking-wider font-bold font-sans transition-all border-b-2 cursor-pointer flex items-center space-x-2 ${
            activeTab === 'audit'
              ? 'border-gold-600 text-gold-600 dark:text-gold-400 dark:border-gold-400'
              : 'border-transparent text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Auditoría de Seguridad</span>
        </button>
      </div>

      {/* TAB: MÉTODOS DE PAGO & CÓDIGOS QR */}
      {activeTab === 'methods' && (
        <PaymentMethodsManager
          settings={settings}
          onUpdateSettings={handleUpdatePaymentMethods}
        />
      )}

      {/* TAB 1: METRICS & RESUMEN */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {/* Detailed Transaction Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#18181b] border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-serif font-bold text-stone-900 dark:text-white border-b border-stone-100 dark:border-stone-800 pb-2">
                Estado de Transacciones
              </h3>
              <div className="space-y-3 text-xs font-sans">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Total Operaciones:</span>
                  <span className="font-bold text-stone-900 dark:text-white">{totalTransactionsCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-600 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Aprobadas:</span>
                  </span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">{approvedOperationsCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-amber-600 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pendientes / Procesando:</span>
                  </span>
                  <span className="font-bold text-amber-700 dark:text-amber-400">{pendingTransactionsCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-rose-600 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Rechazadas / Canceladas:</span>
                  </span>
                  <span className="font-bold text-rose-700 dark:text-rose-400">{rejectedTransactionsCount}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#18181b] border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-serif font-bold text-stone-900 dark:text-white border-b border-stone-100 dark:border-stone-800 pb-2">
                Desembolsos a Cuenta Bancaria
              </h3>
              <div className="space-y-3 text-xs font-sans">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Desembolsado en Cuenta:</span>
                  <span className="font-bold text-emerald-600">${totalDisbursedCOP.toLocaleString('es-CO')} COP</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Pendiente por Liquidar:</span>
                  <span className="font-bold text-amber-600">${totalPendingDisbursementCOP.toLocaleString('es-CO')} COP</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Ciclo de Liquidación:</span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">T+1 Bancolombia</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Costo de Transferencia:</span>
                  <span className="font-bold text-emerald-600">$0 COP (Bancolombia)</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#18181b] border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-serif font-bold text-stone-900 dark:text-white border-b border-stone-100 dark:border-stone-800 pb-2">
                Tarifas Wompi Colombia
              </h3>
              <div className="space-y-3 text-xs font-sans">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Comisión Base:</span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">2.65% + $700 COP + IVA</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Total Comisiones Est.:</span>
                  <span className="font-bold text-stone-900 dark:text-white">${estimatedCommissionsCOP.toLocaleString('es-CO')} COP</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Medios Habilitados:</span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">PSE, Nequi, Tarjetas, QR</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Entorno Pasarela:</span>
                  <span className="font-mono text-[11px] font-bold text-gold-600">
                    {settings.wompiPublicKey?.startsWith('pub_prod_') ? 'PRODUCCIÓN REAL' : 'SANDBOX DE PRUEBAS'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setActiveTab('history')}
              className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#18181b] hover:border-gold-500 transition-all text-left flex items-center justify-between cursor-pointer group"
            >
              <div>
                <h4 className="text-sm font-serif font-bold text-stone-900 dark:text-white group-hover:text-gold-600">
                  Ver Historial Financiero Detallado
                </h4>
                <p className="text-xs text-stone-500 mt-1">
                  Revisa todas las transacciones, filtra por los 7 estados y genera reportes en CSV.
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-stone-400 group-hover:text-gold-500 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => setActiveTab('accounts')}
              className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#18181b] hover:border-gold-500 transition-all text-left flex items-center justify-between cursor-pointer group"
            >
              <div>
                <h4 className="text-sm font-serif font-bold text-stone-900 dark:text-white group-hover:text-gold-600">
                  Gestionar Cuentas de Desembolso
                </h4>
                <p className="text-xs text-stone-500 mt-1">
                  Configura o cambia la cuenta principal de Bancolombia, Davivienda, Nequi o Daviplata.
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-stone-400 group-hover:text-gold-500 group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: HISTORIAL FINANCIERO */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-[#18181b] border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-6">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-sans">
            <div>
              <label className="block text-stone-600 dark:text-stone-400 font-semibold mb-1">
                Buscar por Referencia o Correo
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ej. REC-2026, cliente@correo.com..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121214] text-stone-900 dark:text-stone-100"
                />
                <Search className="w-4 h-4 text-stone-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-stone-600 dark:text-stone-400 font-semibold mb-1">
                Tipo de Operación
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121214] text-stone-900 dark:text-stone-100"
              >
                <option value="all">Todas las operaciones</option>
                <option value="donation">Solo Donaciones</option>
                <option value="subscription">Solo Suscripciones Premium</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-600 dark:text-stone-400 font-semibold mb-1">
                Estado de Transacción (7 Estados)
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121214] text-stone-900 dark:text-stone-100"
              >
                <option value="all">Todos los estados</option>
                <option value="aprobado">Aprobado / Activo</option>
                <option value="pendiente">Pendiente / Procesando</option>
                <option value="rechazado">Rechazado / Cancelado</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-600 dark:text-stone-400 font-semibold mb-1">
                Período de Tiempo
              </label>
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121214] text-stone-900 dark:text-stone-100"
              >
                <option value="all">Histórico Completo</option>
                <option value="7days">Últimos 7 días</option>
                <option value="30days">Últimos 30 días</option>
                <option value="90days">Últimos 90 días</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {filteredHistory.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl space-y-2">
              <Filter className="w-6 h-6 mx-auto text-stone-300" />
              <p>No se encontraron transacciones con los filtros seleccionados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-stone-50 dark:bg-stone-900 text-stone-500 uppercase tracking-wider font-semibold border-b border-stone-200 dark:border-stone-800">
                  <tr>
                    <th className="p-3">Operación / Ref</th>
                    <th className="p-3">Titular / Correo</th>
                    <th className="p-3">Monto COP</th>
                    <th className="p-3">Medio de Pago</th>
                    <th className="p-3">Estado Transacción</th>
                    <th className="p-3">Desembolso</th>
                    <th className="p-3">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                      <td className="p-3">
                        <span className="font-bold text-stone-900 dark:text-white block font-serif">
                          {item.type}
                        </span>
                        <span className="font-mono text-[11px] text-stone-400">{item.reference}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-medium text-stone-800 dark:text-stone-200 block">{item.clientName}</span>
                        <span className="text-[11px] text-stone-400 font-mono">{item.clientEmail}</span>
                      </td>
                      <td className="p-3 font-mono font-bold text-stone-900 dark:text-white">
                        ${item.amountCOP.toLocaleString('es-CO')}
                      </td>
                      <td className="p-3 uppercase font-medium text-stone-600 dark:text-stone-300">
                        {item.paymentMethod}
                      </td>
                      <td className="p-3">{getStatusBadge(item.status)}</td>
                      <td className="p-3">
                        {item.disbursementStatus === 'desembolsado' ? (
                          <span className="text-[11px] font-semibold text-emerald-600 flex items-center space-x-1">
                            <Check className="w-3 h-3" />
                            <span>Liquidado</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-stone-400 flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>Pendiente</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-[11px] text-stone-400 font-mono">
                        {new Date(item.date).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MIS CUENTAS DE DESEMBOLSO */}
      {activeTab === 'accounts' && (
        <div className="bg-white dark:bg-[#18181c] border border-stone-200 dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-xs">
          <BankAccountsManager onAccountChanged={loadAll} />
        </div>
      )}

      {/* TAB 4: DESEMBOLSOS A BANCOS */}
      {activeTab === 'disbursements' && (
        <div className="bg-white dark:bg-[#18181b] border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-serif font-bold text-stone-900 dark:text-white">
                Liquidaciones y Desembolsos Bancarios
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Seguimiento a los desembolsos transferidos desde Wompi hacia tu cuenta principal de {primaryAccount?.bankName || 'Bancolombia'}.
              </p>
            </div>

            <button
              onClick={() => setNewDisbModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gold-600 hover:bg-gold-500 text-stone-950 text-xs font-bold font-sans cursor-pointer shadow-xs inline-flex items-center space-x-1.5"
            >
              <DollarSign className="w-4 h-4" />
              <span>Programar Nuevo Desembolso</span>
            </button>
          </div>

          {/* Disbursements Table */}
          {disbursements.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl space-y-2">
              <DollarSign className="w-6 h-6 mx-auto text-stone-300" />
              <p>No hay registros de desembolsos bancarios.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-stone-50 dark:bg-stone-900 text-stone-500 uppercase tracking-wider font-semibold border-b border-stone-200 dark:border-stone-800">
                  <tr>
                    <th className="p-3">Referencia / Período</th>
                    <th className="p-3">Banco Destino</th>
                    <th className="p-3">Cuenta Destino</th>
                    <th className="p-3">Monto Desembolsado</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Fecha</th>
                    <th className="p-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {disbursements.map((d) => (
                    <tr key={d.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                      <td className="p-3">
                        <span className="font-bold text-stone-900 dark:text-white block font-serif">
                          {d.period}
                        </span>
                        <span className="font-mono text-[11px] text-stone-400">{d.reference}</span>
                      </td>
                      <td className="p-3 font-semibold text-stone-800 dark:text-stone-200">
                        {d.bankName}
                      </td>
                      <td className="p-3 font-mono font-medium text-stone-600 dark:text-stone-300">
                        {d.accountNumberMasked}
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ${d.amountCOP.toLocaleString('es-CO')} COP
                      </td>
                      <td className="p-3">
                        {d.status === 'desembolsado' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Desembolsado</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Programado</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-[11px] text-stone-400 font-mono">
                        {d.disbursedAt
                          ? `Abonado: ${new Date(d.disbursedAt).toLocaleDateString('es-CO')}`
                          : `Prog: ${new Date(d.createdAt).toLocaleDateString('es-CO')}`}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleToggleDisbursementStatus(d)}
                          className="text-[11px] font-semibold text-gold-600 hover:underline cursor-pointer"
                        >
                          {d.status === 'desembolsado' ? 'Marcar Pendiente' : 'Marcar Desembolsado'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Modal New Disbursement */}
          {newDisbModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-[#18181b] border border-stone-200 dark:border-stone-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                  <h4 className="text-base font-serif font-bold text-stone-900 dark:text-white">
                    Programar Registro de Desembolso
                  </h4>
                  <button onClick={() => setNewDisbModalOpen(false)} className="text-stone-400 cursor-pointer">✕</button>
                </div>

                <form onSubmit={handleCreateDisbursement} className="space-y-4 text-xs font-sans">
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">Cuenta de Destino</label>
                    <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                      <p className="font-bold text-stone-900 dark:text-white">{primaryAccount?.bankName}</p>
                      <p className="font-mono text-stone-500">{maskAccountNumber(primaryAccount?.accountNumber || '')}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">Monto a Desembolsar ($ COP) *</label>
                    <input
                      type="number"
                      required
                      min={10000}
                      step={1000}
                      value={disbAmountCOP}
                      onChange={(e) => setDisbAmountCOP(parseInt(e.target.value || '0', 10))}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121214] font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">Período / Motivo *</label>
                    <input
                      type="text"
                      required
                      value={disbPeriodName}
                      onChange={(e) => setDisbPeriodName(e.target.value)}
                      placeholder="Ej. Quincena 1 Noviembre 2026"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121214]"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">Notas u Observaciones (opcional)</label>
                    <textarea
                      rows={2}
                      value={disbNotes}
                      onChange={(e) => setDisbNotes(e.target.value)}
                      placeholder="Notas de liquidación..."
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121214]"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                    <button
                      type="button"
                      onClick={() => setNewDisbModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-stone-300 text-stone-600 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-gold-600 text-stone-950 font-bold uppercase tracking-wider cursor-pointer shadow-xs"
                    >
                      Registrar Desembolso
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: WOMPI GATEWAY & PRODUCCIÓN */}
      {activeTab === 'wompi' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveWompiConfig} className="bg-white dark:bg-[#18181b] border border-stone-200 dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-white">
                  Credenciales de Pasarela Wompi Bancolombia
                </h3>
                <p className="text-xs text-stone-500 font-sans mt-0.5">
                  Conexión oficial de Wompi para procesar PSE, Nequi, Daviplata, Bancolombia QR y Tarjetas.
                </p>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                settings.wompiPublicKey?.startsWith('pub_prod_')
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300'
              }`}>
                {settings.wompiPublicKey?.startsWith('pub_prod_') ? 'PRODUCCIÓN ACTIVA' : 'MODO PRUEBAS (SANDBOX)'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-sans">
              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                  Llave Pública Wompi (Public Key) *
                </label>
                <input
                  type="text"
                  required
                  value={settings.wompiPublicKey}
                  onChange={(e) => setSettings({ ...settings, wompiPublicKey: e.target.value.trim() })}
                  placeholder="pub_prod_... o pub_test_..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121214] font-mono text-stone-900 dark:text-stone-100"
                />
                <p className="text-[11px] text-stone-400 mt-1">
                  Inicia con <code className="font-mono text-gold-600">pub_test_</code> para pruebas o <code className="font-mono text-emerald-600">pub_prod_</code> para recibir dinero real en tu cuenta.
                </p>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                  Secreto de Integridad (Integrity Secret) *
                </label>
                <input
                  type="password"
                  value={settings.wompiIntegritySecret || ''}
                  onChange={(e) => setSettings({ ...settings, wompiIntegritySecret: e.target.value.trim() })}
                  placeholder="prod_integrity_... o test_integrity_..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121214] font-mono text-stone-900 dark:text-stone-100"
                />
                <p className="text-[11px] text-stone-400 mt-1">
                  Utilizado para firmar criptográficamente cada transacción con SHA-256 e impedir manipulaciones de montos.
                </p>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                  Tarifa de Comisión Pactada
                </label>
                <input
                  type="text"
                  value={settings.commissionRateWompi}
                  onChange={(e) => setSettings({ ...settings, commissionRateWompi: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121214] text-stone-900 dark:text-stone-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                  Tiempo de Desembolso Estimado
                </label>
                <input
                  type="text"
                  value={settings.disbursementTime}
                  onChange={(e) => setSettings({ ...settings, disbursementTime: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121214] text-stone-900 dark:text-stone-100 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-stone-100 dark:border-stone-800">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-gold-600 hover:bg-gold-500 text-stone-950 font-sans text-xs uppercase tracking-wider font-bold transition-all inline-flex items-center space-x-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Guardando...' : 'Guardar Credenciales Wompi'}</span>
              </button>
            </div>
          </form>

          {/* Step by step Production Guide for Julian Camilo */}
          <div className="bg-white dark:bg-[#18181b] border border-stone-200 dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-stone-100 dark:border-stone-800 pb-3">
              <ExternalLink className="w-5 h-5 text-gold-600 dark:text-gold-400" />
              <h4 className="text-base font-serif font-bold text-stone-900 dark:text-white">
                Guía Paso a Paso para Activar Transacciones Reales en Colombia
              </h4>
            </div>

            <div className="space-y-4 text-xs font-sans text-stone-700 dark:text-stone-300 leading-relaxed">
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
                <span className="font-bold text-stone-900 dark:text-white flex items-center space-x-1.5">
                  <span className="w-5 h-5 rounded-full bg-gold-500 text-stone-950 flex items-center justify-center text-[11px] font-black">1</span>
                  <span>Crear tu cuenta de comercio en Wompi Bancolombia</span>
                </span>
                <p className="text-stone-600 dark:text-stone-400 pl-6">
                  Ingresa a <a href="https://wompi.co" target="_blank" rel="noreferrer" className="text-gold-600 hover:underline font-semibold">wompi.co</a> y regístrate como Persona Natural con negocio o Persona Jurídica a nombre de <strong>Julián Camilo Trujillo Gordillo (CC 111965400)</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
                <span className="font-bold text-stone-900 dark:text-white flex items-center space-x-1.5">
                  <span className="w-5 h-5 rounded-full bg-gold-500 text-stone-950 flex items-center justify-center text-[11px] font-black">2</span>
                  <span>Adjuntar documentación obligatoria colombiana</span>
                </span>
                <p className="text-stone-600 dark:text-stone-400 pl-6">
                  Carga en el panel de Wompi: copia de la Cédula de Ciudadanía (CC 111965400), RUT actualizado de la DIAN y Certificación Bancaria de tu cuenta de Bancolombia o Davivienda con vigencia menor a 30 días.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
                <span className="font-bold text-stone-900 dark:text-white flex items-center space-x-1.5">
                  <span className="w-5 h-5 rounded-full bg-gold-500 text-stone-950 flex items-center justify-center text-[11px] font-black">3</span>
                  <span>Vincular cuenta bancaria de desembolso automático</span>
                </span>
                <p className="text-stone-600 dark:text-stone-400 pl-6">
                  En el módulo de "Mis Cuentas de Transferencia" en Wompi, registra tu cuenta de ahorros Bancolombia. Al ser del mismo grupo Bancolombia, las transferencias de desembolso son automáticas y a costo $0 COP cada día hábil (T+1).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
                <span className="font-bold text-stone-900 dark:text-white flex items-center space-x-1.5">
                  <span className="w-5 h-5 rounded-full bg-gold-500 text-stone-950 flex items-center justify-center text-[11px] font-black">4</span>
                  <span>Copiar llaves de producción a esta plataforma</span>
                </span>
                <p className="text-stone-600 dark:text-stone-400 pl-6">
                  Una vez aprobada tu cuenta por el equipo de cumplimiento de Wompi, dirígete a "Desarrolladores" en Wompi, copia tu <strong>Llave pública de producción (<code className="font-mono text-emerald-600">pub_prod_...</code>)</strong> y tu <strong>Secreto de integridad de producción</strong> y pégalos en el formulario superior. ¡A partir de ese momento recibirás donaciones y suscripciones reales!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: AUDITORÍA Y SEGURIDAD */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-[#18181b] border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
            <div>
              <h3 className="text-base font-serif font-bold text-stone-900 dark:text-white">
                Registro de Auditoría Financiera
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Bitácora de seguridad inmutable que rastrea adiciones de cuentas, cambios de cuenta principal y transacciones.
              </p>
            </div>
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>

          {auditLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-400">
              No hay eventos recientes registrados en la bitácora financiera.
            </div>
          ) : (
            <div className="space-y-2.5 font-sans text-xs">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-start justify-between gap-4"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-stone-900 dark:text-white">{log.action}</p>
                    <p className="text-stone-600 dark:text-stone-400 text-[11px]">{log.details}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-stone-400 font-mono block">
                      {new Date(log.timestamp).toLocaleString('es-CO')}
                    </span>
                    <span className="text-[10px] text-gold-600 font-semibold">{log.adminEmail}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Search, 
  Filter, 
  Calendar, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  FileText, 
  Download,
  Building2,
  Smartphone,
  Coins,
  RefreshCw
} from 'lucide-react';
import { Donation, DonationStatus, PaymentMethod, FinancialSettings } from '../../types';
import { getDonations, updateDonationStatus, getFinancialSettings, saveFinancialSettings, DEFAULT_FINANCIAL_SETTINGS } from '../../services/db';

export const AdminDonations: React.FC = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [settings, setSettings] = useState<FinancialSettings>(DEFAULT_FINANCIAL_SETTINGS);
  const [amountsInput, setAmountsInput] = useState('10000, 20000, 50000, 100000, 200000');
  const [customMessageInput, setCustomMessageInput] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    loadDonations();
  }, []);

  const loadDonations = async () => {
    setLoading(true);
    try {
      const [data, finSettings] = await Promise.all([
        getDonations(),
        getFinancialSettings()
      ]);
      setDonations(data);
      setSettings(finSettings);
      if (finSettings.suggestedDonationAmounts?.length) {
        setAmountsInput(finSettings.suggestedDonationAmounts.join(', '));
      }
      setCustomMessageInput(finSettings.donationCustomMessage || '');
    } catch (e) {
      console.error('Error loading donations:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDonationConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmounts = amountsInput
      .split(',')
      .map((s) => parseInt(s.replace(/[^0-9]/g, ''), 10))
      .filter((n) => !isNaN(n) && n >= 5000);

    setSavingConfig(true);
    try {
      const nextSettings: FinancialSettings = {
        ...settings,
        suggestedDonationAmounts: parsedAmounts.length > 0 ? parsedAmounts : [10000, 20000, 50000, 100000],
        donationCustomMessage: customMessageInput.trim() || undefined
      };
      await saveFinancialSettings(nextSettings);
      setSettings(nextSettings);
      setActionSuccess('Configuración de montos sugeridos y mensaje guardada.');
      setTimeout(() => setActionSuccess(null), 3000);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleExportCsv = () => {
    const headers = ['Comprobante', 'Referencia', 'Donante', 'Correo', 'Monto COP', 'Metodo', 'Estado', 'Fecha'];
    const rows = donations.map((d) => [
      d.receiptNumber || '',
      d.reference || '',
      `"${(d.donorName || '').replace(/"/g, '""')}"`,
      d.donorEmail || '',
      String(d.amountCOP || 0),
      d.paymentMethod || '',
      d.status || '',
      d.createdAt || ''
    ]);
    const csv = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donaciones_julian_camilo_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpdateStatus = async (id: string, newStatus: DonationStatus) => {
    try {
      await updateDonationStatus(id, newStatus);
      setActionSuccess(`Estado de donación actualizado a: ${newStatus}`);
      await loadDonations();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (e) {
      console.error('Error updating status:', e);
    }
  };

  // Calculations (include both 'aprobada' and 'aprobado')
  const approvedDonations = donations.filter(d => d.status === 'aprobada' || d.status === 'aprobado');
  const totalAmountCOP = approvedDonations.reduce((acc, d) => acc + (d.amountCOP || 0), 0);
  const uniqueEmails = new Set(approvedDonations.map(d => d.donorEmail?.toLowerCase()).filter(Boolean));
  const uniqueDonorsCount = uniqueEmails.size;
  const averageDonation = approvedDonations.length > 0 ? Math.round(totalAmountCOP / approvedDonations.length) : 0;

  // Filtered List
  const filteredDonations = donations.filter((d) => {
    const matchesSearch =
      (d.donorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.donorEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.reference || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || d.status === selectedStatus;
    const matchesMethod = selectedMethod === 'all' || d.paymentMethod === selectedMethod;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  const getMethodBadge = (method: PaymentMethod) => {
    switch (method) {
      case 'pse':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            <Building2 className="w-3 h-3" />
            <span>PSE</span>
          </span>
        );
      case 'nequi':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
            <Smartphone className="w-3 h-3" />
            <span>Nequi</span>
          </span>
        );
      case 'daviplata':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
            <Smartphone className="w-3 h-3" />
            <span>Daviplata</span>
          </span>
        );
      case 'card':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CreditCard className="w-3 h-3" />
            <span>Tarjeta</span>
          </span>
        );
      case 'bancolombia_qr':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <Coins className="w-3 h-3" />
            <span>Transferencia / QR</span>
          </span>
        );
      default:
        return <span className="uppercase text-[11px]">{method}</span>;
    }
  };

  const getStatusBadge = (status: DonationStatus) => {
    switch (status) {
      case 'aprobado':
      case 'aprobada':
      case 'desembolsado':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3" />
            <span>{status === 'desembolsado' ? 'Desembolsado' : 'Aprobada'}</span>
          </span>
        );
      case 'pendiente':
      case 'procesando':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <Clock className="w-3 h-3" />
            <span>{status === 'procesando' ? 'Procesando' : 'Pendiente'}</span>
          </span>
        );
      case 'rechazado':
      case 'rechazada':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            <XCircle className="w-3 h-3" />
            <span>Rechazada</span>
          </span>
        );
      case 'cancelado':
      case 'cancelada':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
            <XCircle className="w-3 h-3" />
            <span>Cancelada</span>
          </span>
        );
      case 'reembolsado':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
            <Clock className="w-3 h-3" />
            <span>Reembolsado</span>
          </span>
        );
      default:
        return <span className="capitalize text-[11px]">{status}</span>;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#eeeae1] dark:border-stone-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <HeartHandshake className="w-6 h-6 text-gold-600 dark:text-gold-400" />
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#121212] dark:text-[#f3ede2]">
              Donaciones & Finanzas Editoriales
            </h1>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
            Registro privado de mecenazgo y aportes de lectores (PSE, Nequi, Daviplata y Tarjetas).
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={loadDonations}
            className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={donations.length === 0}
            className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:text-stone-950 text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1b1a18] border border-[#eeeae1] dark:border-stone-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-bold uppercase tracking-wider font-sans">Total Recaudado</span>
            <DollarSign className="w-4 h-4 text-gold-500" />
          </div>
          <div className="font-serif font-black text-2xl text-gold-700 dark:text-gold-400">
            ${totalAmountCOP.toLocaleString('es-CO')} <span className="text-xs font-sans font-normal text-stone-400">COP</span>
          </div>
          <div className="text-[11px] text-stone-400 font-mono">
            ≈ ${((totalAmountCOP) / 4100).toFixed(2)} USD
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1b1a18] border border-[#eeeae1] dark:border-stone-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-bold uppercase tracking-wider font-sans">Aportes Aprobados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="font-serif font-black text-2xl text-stone-900 dark:text-stone-100">
            {approvedDonations.length}
          </div>
          <div className="text-[11px] text-stone-400">
            De {donations.length} intentos totales
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1b1a18] border border-[#eeeae1] dark:border-stone-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-bold uppercase tracking-wider font-sans">Donantes Únicos</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="font-serif font-black text-2xl text-stone-900 dark:text-stone-100">
            {uniqueDonorsCount}
          </div>
          <div className="text-[11px] text-stone-400">
            Lectores comprometidos con el proyecto
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#1b1a18] border border-[#eeeae1] dark:border-stone-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-bold uppercase tracking-wider font-sans">Aporte Promedio</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <div className="font-serif font-black text-2xl text-stone-900 dark:text-stone-100">
            ${averageDonation.toLocaleString('es-CO')} <span className="text-xs font-sans font-normal text-stone-400">COP</span>
          </div>
          <div className="text-[11px] text-stone-400">
            Por transacción aprobada
          </div>
        </div>
      </div>

      {/* Public Donation Page Configuration */}
      <form
        onSubmit={handleSaveDonationConfig}
        className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#1b1a18] border border-[#eeeae1] dark:border-stone-800 shadow-sm space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#eeeae1] dark:border-stone-800 pb-3">
          <div>
            <h2 className="font-serif font-bold text-base text-[#121212] dark:text-[#f3ede2]">
              Configuración Pública de Donaciones
            </h2>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 font-sans">
              Personaliza los montos sugeridos en COP y el mensaje editorial que ven los lectores.
            </p>
          </div>
          <button
            type="submit"
            disabled={savingConfig}
            className="px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-600 text-stone-950 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer self-start sm:self-auto"
          >
            {savingConfig ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 font-sans">
              Montos Sugeridos (COP, separados por coma)
            </label>
            <input
              type="text"
              value={amountsInput}
              onChange={(e) => setAmountsInput(e.target.value)}
              placeholder="10000, 20000, 50000, 100000, 200000"
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs font-mono focus:border-gold-500 focus:outline-none"
            />
            <span className="text-[10px] text-stone-400 block">
              Mínimo $5.000 COP por opción.
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 font-sans">
              Mensaje Editorial de Agradecimiento / Invitación
            </label>
            <input
              type="text"
              value={customMessageInput}
              onChange={(e) => setCustomMessageInput(e.target.value)}
              placeholder="Ej. Tu aporte sostiene el periodismo independiente del Tolima y Colombia."
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs focus:border-gold-500 focus:outline-none"
            />
          </div>
        </div>
      </form>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#1b1a18] border border-[#eeeae1] dark:border-stone-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por donante, email o ref..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs focus:border-gold-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 text-xs focus:border-gold-500 focus:outline-none"
          >
            <option value="all">Todos los Estados</option>
            <option value="aprobada">Aprobada</option>
            <option value="pendiente">Pendiente</option>
            <option value="rechazada">Rechazada</option>
            <option value="cancelada">Cancelada</option>
          </select>

          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 text-xs focus:border-gold-500 focus:outline-none"
          >
            <option value="all">Todos los Métodos</option>
            <option value="pse">PSE</option>
            <option value="nequi">Nequi</option>
            <option value="daviplata">Daviplata</option>
            <option value="card">Tarjeta Débito/Crédito</option>
            <option value="bancolombia_qr">Transferencia / QR</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-[#1b1a18] border border-[#eeeae1] dark:border-stone-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center space-y-2">
            <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-stone-400 font-sans">Cargando donaciones...</p>
          </div>
        ) : filteredDonations.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <HeartHandshake className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto" />
            <p className="text-sm font-semibold text-stone-700 dark:text-stone-300 font-serif">
              No se encontraron donaciones
            </p>
            <p className="text-xs text-stone-400 font-sans max-w-sm mx-auto">
              {searchTerm || selectedStatus !== 'all' || selectedMethod !== 'all'
                ? 'Prueba ajustando los filtros de búsqueda.'
                : 'Aún no se han registrado donaciones en la plataforma.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#faf8f4] dark:bg-[#141416] border-b border-[#eeeae1] dark:border-stone-800 text-[10px] uppercase font-bold text-stone-400">
                <tr>
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Donante</th>
                  <th className="p-4">Valor (COP)</th>
                  <th className="p-4">Método</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Referencia / Comprobante</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeeae1] dark:divide-stone-800">
                {filteredDonations.map((d) => (
                  <tr key={d.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30 transition-colors">
                    <td className="p-4 font-mono text-stone-500 whitespace-nowrap">
                      {new Date(d.createdAt).toLocaleString('es-CO', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-stone-900 dark:text-stone-100">
                        {d.donorName}
                        {d.isAnonymous && (
                          <span className="ml-1 text-[10px] text-stone-400 font-normal italic">
                            (Anónimo)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-400">{d.donorEmail}</div>
                      {d.message && (
                        <div className="text-[10px] text-stone-500 dark:text-stone-400 font-serif italic mt-0.5 line-clamp-1">
                          "{d.message}"
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-bold font-mono text-stone-900 dark:text-stone-100 whitespace-nowrap">
                      ${(d.amountCOP || 0).toLocaleString('es-CO')} COP
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {getMethodBadge(d.paymentMethod)}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {getStatusBadge(d.status)}
                    </td>
                    <td className="p-4 font-mono text-[11px] text-stone-500 whitespace-nowrap">
                      <div>{d.reference}</div>
                      {d.receiptNumber && (
                        <div className="text-gold-600 dark:text-gold-400 text-[10px]">{d.receiptNumber}</div>
                      )}
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <select
                        value={d.status}
                        onChange={(e) => handleUpdateStatus(d.id, e.target.value as DonationStatus)}
                        className="px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 text-[11px]"
                      >
                        <option value="aprobada">Aprobada</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="rechazada">Rechazada</option>
                        <option value="cancelada">Cancelada</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

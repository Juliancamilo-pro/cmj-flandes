import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Plus, 
  Trash2, 
  Edit3, 
  Star, 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  Smartphone,
  HelpCircle,
  Check,
  RefreshCw
} from 'lucide-react';
import { BankAccount, BankAccountType, BankAccountVerificationStatus } from '../../types';
import { 
  getBankAccounts, 
  saveBankAccount, 
  setPrimaryBankAccount, 
  deleteBankAccount,
  deactivateBankAccount,
  getDisbursements
} from '../../services/db';
import { COLOMBIAN_BANKS, maskAccountNumber } from '../../services/wompi';
import { ConfirmModal } from '../common/ConfirmModal';

interface BankAccountsManagerProps {
  onAccountChanged?: () => void;
  compact?: boolean;
}

export const BankAccountsManager: React.FC<BankAccountsManagerProps> = ({
  onAccountChanged,
  compact = false
}) => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Unmask state per account id
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  // Delete / Deactivate modal state
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(null);
  const [deleteValidation, setDeleteValidation] = useState<{
    checking: boolean;
    canDelete: boolean;
    reason?: string;
    recommendDeactivate?: boolean;
    historicalCount?: number;
    message?: string;
    replacementPrimaryId?: string;
  }>({ checking: false, canDelete: true });
  const [isDeleting, setIsDeleting] = useState(false);

  // Form Fields
  const [bankName, setBankName] = useState('Bancolombia');
  const [customBankName, setCustomBankName] = useState('');
  const [accountType, setAccountType] = useState<BankAccountType>('ahorros');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('Julian Camilo Trujillo Gordillo');
  const [documentType, setDocumentType] = useState<'CC' | 'NIT' | 'CE' | 'Pasaporte'>('CC');
  const [documentNumber, setDocumentNumber] = useState('111965400');
  const [holderEmail, setHolderEmail] = useState('trujillogordilooo@gmail.com');
  const [alias, setAlias] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const data = await getBankAccounts();
      setAccounts(data);
    } catch (err) {
      console.warn('Could not load bank accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNew = () => {
    setEditingAccount(null);
    setBankName('Bancolombia');
    setCustomBankName('');
    setAccountType('ahorros');
    setAccountNumber('');
    setAccountHolder('Julian Camilo Trujillo Gordillo');
    setDocumentType('CC');
    setDocumentNumber('111965400');
    setHolderEmail('trujillogordilooo@gmail.com');
    setAlias('');
    setIsPrimary(accounts.length === 0);
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (acc: BankAccount) => {
    setEditingAccount(acc);
    setBankName(acc.bankName);
    setCustomBankName('');
    setAccountType(acc.accountType);
    setAccountNumber(acc.accountNumber);
    setAccountHolder(acc.accountHolder);
    setDocumentType(acc.documentType);
    setDocumentNumber(acc.documentNumber);
    setHolderEmail(acc.holderEmail || 'trujillogordilooo@gmail.com');
    setAlias(acc.alias);
    setIsPrimary(acc.isPrimary);
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const finalBank = bankName === 'OTRO' ? customBankName.trim() : bankName;
    if (!finalBank) {
      setErrorMsg('Por favor especifica la entidad financiera.');
      return;
    }

    if (!accountNumber.trim()) {
      setErrorMsg('Por favor ingresa el número de cuenta o celular.');
      return;
    }

    if (!accountHolder.trim()) {
      setErrorMsg('Por favor ingresa el nombre del titular.');
      return;
    }

    if (!documentNumber.trim()) {
      setErrorMsg('Por favor ingresa el número de identificación.');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<BankAccount> = {
        bankName: finalBank,
        accountType,
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim(),
        documentType,
        documentNumber: documentNumber.trim(),
        holderEmail: holderEmail.trim(),
        alias: alias.trim() || `${finalBank} (${accountType})`,
        isPrimary,
        verificationStatus: editingAccount ? editingAccount.verificationStatus : 'verificada'
      };

      const savedId = await saveBankAccount(payload, editingAccount?.id);

      if (isPrimary && savedId) {
        await setPrimaryBankAccount(savedId);
      }

      setSuccessMsg(
        editingAccount
          ? 'Cuenta bancaria actualizada correctamente.'
          : 'Nueva cuenta bancaria registrada para desembolsos.'
      );
      setTimeout(() => setSuccessMsg(null), 3500);
      setModalOpen(false);
      await loadAccounts();
      if (onAccountChanged) onAccountChanged();
    } catch (err: any) {
      console.error('Error saving bank account:', err);
      setErrorMsg('No fue posible guardar la cuenta bancaria.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetPrimary = async (accountId: string) => {
    try {
      await setPrimaryBankAccount(accountId);
      await loadAccounts();
      setSuccessMsg('Cuenta principal de desembolsos actualizada.');
      setTimeout(() => setSuccessMsg(null), 3000);
      if (onAccountChanged) onAccountChanged();
    } catch (e) {
      console.error('Error setting primary:', e);
    }
  };

  const initiateDeleteAccount = async (acc: BankAccount) => {
    setAccountToDelete(acc);
    const otherActive = accounts.filter((a) => a.id !== acc.id && a.isActive !== false);
    setDeleteValidation({
      checking: true,
      canDelete: true,
      replacementPrimaryId: otherActive[0]?.id || ''
    });

    try {
      const disbursements = await getDisbursements();
      const related = disbursements.filter((d) => d.bankAccountId === acc.id);
      const pendingCount = related.filter(
        (d) => d.status === 'programado' || d.status === 'procesando'
      ).length;
      const historicalCount = related.length;
      const totalActiveAccounts = accounts.filter((a) => a.isActive !== false).length;

      const resp = await fetch('/api/bank-accounts/validate-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: acc,
          totalActiveAccounts,
          pendingDisbursementsCount: pendingCount,
          historicalDisbursementsCount: historicalCount
        })
      });
      const data = await resp.json().catch(() => ({}));

      if (!resp.ok || data.canDelete === false) {
        setDeleteValidation({
          checking: false,
          canDelete: false,
          reason: data.reason,
          historicalCount,
          message: data.error || 'No se puede eliminar esta cuenta en este momento.',
          replacementPrimaryId: otherActive[0]?.id || ''
        });
        return;
      }

      setDeleteValidation({
        checking: false,
        canDelete: true,
        recommendDeactivate: Boolean(data.recommendDeactivate),
        historicalCount,
        message: data.message,
        replacementPrimaryId: otherActive[0]?.id || ''
      });
    } catch (e) {
      setDeleteValidation({
        checking: false,
        canDelete: true,
        replacementPrimaryId: otherActive[0]?.id || ''
      });
    }
  };

  const confirmDelete = async (mode: 'delete' | 'deactivate' = 'delete') => {
    if (!accountToDelete) return;
    setIsDeleting(true);
    try {
      // If primary and user selected a replacement primary account, switch primary first
      if (accountToDelete.isPrimary && deleteValidation.replacementPrimaryId) {
        await setPrimaryBankAccount(deleteValidation.replacementPrimaryId);
      }

      if (mode === 'deactivate') {
        await deactivateBankAccount(
          accountToDelete.id,
          'Desactivada por el propietario conservando historial de desembolsos.'
        );
        setSuccessMsg(`Cuenta ${accountToDelete.bankName} desactivada conservando su historial.`);
      } else {
        await deleteBankAccount(accountToDelete.id);
        setSuccessMsg(`Cuenta ${accountToDelete.bankName} eliminada permanentemente.`);
      }

      await loadAccounts();
      setTimeout(() => setSuccessMsg(null), 4000);
      if (onAccountChanged) onAccountChanged();
    } catch (e) {
      console.error('Error deleting/deactivating account:', e);
      setErrorMsg('No se pudo completar la operación sobre la cuenta bancaria.');
    } finally {
      setIsDeleting(false);
      setAccountToDelete(null);
    }
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusBadge = (status: BankAccountVerificationStatus) => {
    switch (status) {
      case 'verificada':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Verificada</span>
          </span>
        );
      case 'en_revision':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>En verificación</span>
          </span>
        );
      case 'pendiente_documentacion':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
            <HelpCircle className="w-3 h-3 text-sky-600 dark:text-sky-400" />
            <span>Pendiente soporte</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            <span>No verificada</span>
          </span>
        );
    }
  };

  const getBankColor = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('bancolombia')) return 'border-amber-400 dark:border-amber-500/40 bg-amber-50/30 dark:bg-amber-950/20';
    if (n.includes('nequi')) return 'border-fuchsia-400 dark:border-fuchsia-500/40 bg-fuchsia-50/30 dark:bg-fuchsia-950/20';
    if (n.includes('davivienda') || n.includes('daviplata')) return 'border-rose-400 dark:border-rose-500/40 bg-rose-50/30 dark:bg-rose-950/20';
    if (n.includes('bogot') || n.includes('bbva')) return 'border-blue-400 dark:border-blue-500/40 bg-blue-50/30 dark:bg-blue-950/20';
    return 'border-stone-200 dark:border-stone-800 bg-white dark:bg-[#1a1a1e]';
  };

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-gold-600 dark:text-gold-400" />
            <h3 className="text-lg font-serif font-bold text-[#121212] dark:text-white">
              Mis Cuentas y Configuración Financiera
            </h3>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-sans mt-0.5">
            Cuentas bancarias colombianas autorizadas para recibir desembolsos automáticos de donaciones y suscripciones.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-gold-600 hover:bg-gold-500 text-stone-950 font-sans text-xs uppercase tracking-wider font-bold transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Vincular Nueva Cuenta</span>
        </button>
      </div>

      {/* Security Notice */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-stone-500/5 to-emerald-500/10 border border-gold-500/20 flex items-start space-x-3 text-xs text-stone-700 dark:text-stone-300">
        <ShieldCheck className="w-5 h-5 text-gold-600 dark:text-gold-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-stone-900 dark:text-stone-100">
            Seguridad y Privacidad Financiera Absoluta
          </p>
          <p className="text-[11px] leading-relaxed text-stone-600 dark:text-stone-400">
            Estos datos bancarios se utilizan <strong>exclusivamente como destino de los desembolsos</strong> procesados por Wompi Bancolombia. 
            Nunca se solicitan ni almacenan contraseñas bancarias, claves de Nequi, códigos dinámicos ni claves secretas. Ningún lector, colaborador o visitante puede ver estos datos.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Accounts List */}
      {loading ? (
        <div className="p-8 text-center text-xs text-stone-400 flex items-center justify-center space-x-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Cargando cuentas bancarias registradas...</span>
        </div>
      ) : accounts.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl space-y-3">
          <CreditCard className="w-8 h-8 text-stone-400 mx-auto" />
          <p className="text-sm font-serif font-bold text-stone-700 dark:text-stone-300">
            No tienes cuentas bancarias registradas
          </p>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Registra tu cuenta de Bancolombia, Davivienda, Nequi o Daviplata para recibir el dinero de tus donaciones y suscripciones.
          </p>
          <button
            onClick={handleOpenNew}
            className="px-4 py-2 rounded-xl bg-gold-600 hover:bg-gold-500 text-stone-950 text-xs font-bold font-sans cursor-pointer"
          >
            Agregar Primera Cuenta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const isRevealed = revealedIds[acc.id] || false;
            return (
              <div
                key={acc.id}
                className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${getBankColor(
                  acc.bankName
                )} ${acc.isPrimary ? 'ring-2 ring-gold-500/50 shadow-md' : 'shadow-sm'}`}
              >
                <div>
                  {/* Top Bar: Bank & Primary Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center flex-wrap gap-1.5">
                        <span className="text-xs font-bold tracking-wide uppercase text-stone-900 dark:text-white font-sans">
                          {acc.bankName}
                        </span>
                        {acc.isPrimary && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-gold-500 text-stone-950">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            <span>PRINCIPAL</span>
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            acc.isActive === false
                              ? 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-400'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {acc.isActive === false ? '● Inactiva' : '● Activa'}
                        </span>
                      </div>
                      <p className="text-xs font-serif font-semibold text-stone-700 dark:text-stone-300">
                        {acc.alias}
                      </p>
                    </div>

                    {getStatusBadge(acc.verificationStatus)}
                  </div>

                  {/* Account Details */}
                  <div className="space-y-2 py-3 border-y border-stone-200/70 dark:border-stone-800/80 text-xs font-sans">
                    <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
                      <span>Tipo de cuenta:</span>
                      <span className="font-semibold text-stone-800 dark:text-stone-200 uppercase">
                        {acc.accountType === 'deposito_electronico'
                          ? 'Monedero / Celular'
                          : acc.accountType}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
                      <span>Número:</span>
                      <div className="flex items-center space-x-1.5 font-mono font-bold text-stone-900 dark:text-stone-100">
                        <span>{isRevealed ? acc.accountNumber : maskAccountNumber(acc.accountNumber)}</span>
                        <button
                          onClick={() => toggleReveal(acc.id)}
                          title={isRevealed ? 'Ocultar número' : 'Mostrar número'}
                          className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
                      <span>Titular:</span>
                      <span className="font-medium text-stone-800 dark:text-stone-200 truncate max-w-[170px]" title={acc.accountHolder}>
                        {acc.accountHolder}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
                      <span>Documento:</span>
                      <span className="font-mono text-stone-700 dark:text-stone-300">
                        {acc.documentType} {acc.documentNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-stone-500 dark:text-stone-400">
                      <span>Fecha de creación:</span>
                      <span className="text-stone-700 dark:text-stone-300">
                        {acc.createdAt
                          ? new Date(acc.createdAt).toLocaleDateString('es-CO', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })
                          : 'No registrada'}
                      </span>
                    </div>
                  </div>

                  {acc.verificationNotes && (
                    <p className="mt-2 text-[11px] text-stone-500 dark:text-stone-400 italic">
                      Nota: {acc.verificationNotes}
                    </p>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 flex items-center justify-between border-t border-stone-200/50 dark:border-stone-800/60 text-xs">
                  {!acc.isPrimary ? (
                    <button
                      onClick={() => handleSetPrimary(acc.id)}
                      className="text-gold-600 dark:text-gold-400 hover:underline font-semibold cursor-pointer inline-flex items-center space-x-1"
                    >
                      <Star className="w-3.5 h-3.5" />
                      <span>Elegir como Principal</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Recibe desembolsos</span>
                    </span>
                  )}

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenEdit(acc)}
                      title="Modificar datos"
                      className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => initiateDeleteAccount(acc)}
                      title="Eliminar o desactivar cuenta"
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-100/60 dark:hover:bg-rose-950/40 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add / Edit Account */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181b] border border-stone-200 dark:border-stone-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-gold-600 dark:text-gold-400" />
                <h4 className="text-base font-serif font-bold text-stone-900 dark:text-white">
                  {editingAccount ? 'Editar Cuenta de Desembolso' : 'Vincular Cuenta Bancaria Colombiana'}
                </h4>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs font-sans">
              {/* Entidad Financiera */}
              <div>
                <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                  Entidad Financiera / Banco Colombiano *
                </label>
                <select
                  value={bankName}
                  onChange={(e) => {
                    setBankName(e.target.value);
                    if (e.target.value === 'Nequi (Bancolombia)' || e.target.value === 'Daviplata (Davivienda)') {
                      setAccountType('deposito_electronico');
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121214] text-stone-900 dark:text-stone-100 font-medium focus:ring-2 focus:ring-gold-500 focus:outline-hidden"
                >
                  <optgroup label="Más Utilizados en Colombia">
                    <option value="Bancolombia">Bancolombia</option>
                    <option value="Davivienda">Davivienda</option>
                    <option value="Nequi (Bancolombia)">Nequi (Bancolombia)</option>
                    <option value="Daviplata (Davivienda)">Daviplata (Davivienda)</option>
                    <option value="Banco de Bogotá">Banco de Bogotá</option>
                    <option value="BBVA Colombia">BBVA Colombia</option>
                    <option value="Nu Colombia (Cuenta Nu)">Nu Colombia (Cuenta Nu)</option>
                  </optgroup>
                  <optgroup label="Otros Bancos y Cooperativas">
                    {COLOMBIAN_BANKS.filter((b) => !b.popular).map((b) => (
                      <option key={b.code} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                    <option value="OTRO">Otro banco / entidad no listada</option>
                  </optgroup>
                </select>
              </div>

              {bankName === 'OTRO' && (
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    Nombre del banco o entidad *
                  </label>
                  <input
                    type="text"
                    required
                    value={customBankName}
                    onChange={(e) => setCustomBankName(e.target.value)}
                    placeholder="Ej. Banco Agrario, Coopcentral, etc."
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121214] text-stone-900 dark:text-stone-100"
                  />
                </div>
              )}

              {/* Tipo de Cuenta y Número */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    Tipo de Cuenta *
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as BankAccountType)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121214] text-stone-900 dark:text-stone-100"
                  >
                    <option value="ahorros">Cuenta de Ahorros</option>
                    <option value="corriente">Cuenta Corriente</option>
                    <option value="deposito_electronico">Monedero Electrónico / Celular (Nequi/Daviplata)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    {accountType === 'deposito_electronico' ? 'Número de Celular *' : 'Número de Cuenta *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder={accountType === 'deposito_electronico' ? 'Ej. 3158902554' : 'Ej. 486-902554-12'}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121214] text-stone-900 dark:text-stone-100 font-mono font-medium"
                  />
                </div>
              </div>

              {/* Titular y Documento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    Nombre Completo del Titular *
                  </label>
                  <input
                    type="text"
                    required
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121214] text-stone-900 dark:text-stone-100"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                      Tipo Doc.
                    </label>
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value as any)}
                      className="w-full px-2 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121214] text-stone-900 dark:text-stone-100 font-bold"
                    >
                      <option value="CC">CC</option>
                      <option value="NIT">NIT</option>
                      <option value="CE">CE</option>
                      <option value="Pasaporte">Pas.</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                      Número Documento *
                    </label>
                    <input
                      type="text"
                      required
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121214] text-stone-900 dark:text-stone-100 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Alias y Correo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    Alias descriptivo (opcional)
                  </label>
                  <input
                    type="text"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    placeholder="Ej. Bancolombia Ahorros Personal"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121214] text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    Correo del Titular
                  </label>
                  <input
                    type="email"
                    value={holderEmail}
                    onChange={(e) => setHolderEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#121214] text-stone-900 dark:text-stone-100 font-mono"
                  />
                </div>
              </div>

              {/* Marcar como Principal */}
              <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="rounded text-gold-600 focus:ring-gold-500 w-4 h-4 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-bold text-stone-900 dark:text-stone-100">
                    Establecer como cuenta principal de desembolso
                  </span>
                  <p className="text-stone-500 text-[11px]">
                    El proveedor enviará automáticamente los fondos de donaciones y suscripciones a esta cuenta.
                  </p>
                </div>
              </label>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-gold-600 hover:bg-gold-500 text-stone-950 font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {saving ? 'Guardando...' : editingAccount ? 'Guardar Cambios' : 'Vincular Cuenta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Smart Delete / Deactivate Confirmation Modal */}
      {accountToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18181b] border border-stone-200 dark:border-stone-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 font-sans">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-serif font-bold text-stone-900 dark:text-white">
                  Gestionar eliminación de cuenta
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  {accountToDelete.bankName} — {accountToDelete.alias}
                </p>
              </div>
            </div>

            {deleteValidation.checking ? (
              <div className="py-4 text-center text-xs text-stone-500">
                Verificando desembolsos pendientes e historial financiero...
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {!deleteValidation.canDelete && deleteValidation.reason === 'pending_disbursements' && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200">
                    {deleteValidation.message}
                  </div>
                )}

                {accountToDelete.isPrimary &&
                  accounts.filter((a) => a.id !== accountToDelete.id && a.isActive !== false).length > 0 && (
                    <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2">
                      <p className="font-bold text-amber-900 dark:text-amber-200">
                        Esta es tu cuenta principal. Selecciona la nueva cuenta principal antes de continuar:
                      </p>
                      <select
                        value={deleteValidation.replacementPrimaryId || ''}
                        onChange={(e) =>
                          setDeleteValidation((prev) => ({
                            ...prev,
                            replacementPrimaryId: e.target.value,
                            canDelete: Boolean(e.target.value)
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs font-semibold"
                      >
                        {accounts
                          .filter((a) => a.id !== accountToDelete.id && a.isActive !== false)
                          .map((other) => (
                            <option key={other.id} value={other.id}>
                              {other.bankName} — {other.alias} ({maskAccountNumber(other.accountNumber)})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                {deleteValidation.recommendDeactivate && (
                  <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200">
                    {deleteValidation.message}
                  </div>
                )}

                {!deleteValidation.recommendDeactivate && deleteValidation.canDelete && (
                  <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
                    ¿Confirmas que deseas eliminar la cuenta{' '}
                    <strong>
                      {accountToDelete.bankName} ({accountToDelete.alias})
                    </strong>
                    ? Esta acción actualizará tu lista inmediatamente.
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                Cancelar
              </button>

              {!deleteValidation.checking &&
                deleteValidation.reason !== 'pending_disbursements' &&
                deleteValidation.recommendDeactivate && (
                  <button
                    type="button"
                    onClick={() => confirmDelete('deactivate')}
                    disabled={isDeleting}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer"
                  >
                    {isDeleting ? 'Procesando...' : 'Desactivar (conservar historial)'}
                  </button>
                )}

              {!deleteValidation.checking &&
                deleteValidation.reason !== 'pending_disbursements' && (
                  <button
                    type="button"
                    onClick={() => confirmDelete('delete')}
                    disabled={
                      isDeleting ||
                      (accountToDelete.isPrimary &&
                        accounts.filter((a) => a.id !== accountToDelete.id && a.isActive !== false).length > 0 &&
                        !deleteValidation.replacementPrimaryId)
                    }
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-40 cursor-pointer"
                  >
                    {isDeleting ? 'Eliminando...' : 'Eliminar permanentemente'}
                  </button>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  History,
  Search,
  Save,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import {
  PendingPoliticalOrganization,
  PoliticalAuditLog,
  PoliticalLegalStatus,
  PoliticalOrgCategory,
  PoliticalOrganization
} from '../../types';
import {
  getPoliticalOrganizations,
  savePoliticalOrganization,
  deletePoliticalOrganization,
  getPendingPoliticalOrgs,
  reviewPendingPoliticalOrg,
  getPoliticalAuditLogs
} from '../../services/db';
import {
  POLITICAL_CATEGORY_LABELS,
  POLITICAL_LEGAL_STATUS_LABELS
} from '../../data/colombianPoliticalOrgs';

interface AdminPoliticalProps {
  ownerEmail: string;
}

export const AdminPolitical: React.FC<AdminPoliticalProps> = ({ ownerEmail }) => {
  const [tab, setTab] = useState<'catalog' | 'proposals' | 'audit'>('catalog');
  const [catalog, setCatalog] = useState<PoliticalOrganization[]>([]);
  const [proposals, setProposals] = useState<PendingPoliticalOrganization[]>([]);
  const [auditLogs, setAuditLogs] = useState<PoliticalAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add/Edit Organization Modal/Form
  const [editingOrg, setEditingOrg] = useState<Partial<PoliticalOrganization> | null>(null);
  const [savingOrg, setSavingOrg] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [orgs, props, logs] = await Promise.all([
        getPoliticalOrganizations(),
        getPendingPoliticalOrgs(),
        getPoliticalAuditLogs()
      ]);
      setCatalog(orgs);
      setProposals(props);
      setAuditLogs(logs);
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewOrg = () => {
    setEditingOrg({
      officialName: '',
      shortName: '',
      acronym: '',
      category: 'A',
      legalStatus: 'vigente',
      legalStatusDetail: '',
      primaryColor: '#9B1B30',
      secondaryColor: '#F2C94C',
      website: '',
      description: '',
      verificationSource: 'Consejo Nacional Electoral (CNE) - RUPYM',
      isOfficialCatalog: true
    });
    setFeedback(null);
  };

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg?.officialName?.trim()) return;
    setSavingOrg(true);
    setFeedback(null);
    try {
      await savePoliticalOrganization(
        {
          id: editingOrg.id,
          officialName: editingOrg.officialName.trim(),
          shortName: (editingOrg.shortName || editingOrg.officialName).trim(),
          acronym: (editingOrg.acronym || editingOrg.officialName.slice(0, 4)).trim().toUpperCase(),
          category: (editingOrg.category || 'A') as PoliticalOrgCategory,
          legalStatus: (editingOrg.legalStatus || 'vigente') as PoliticalLegalStatus,
          legalStatusDetail: editingOrg.legalStatusDetail || '',
          logoUrl: editingOrg.logoUrl,
          primaryColor: editingOrg.primaryColor || '#9B1B30',
          secondaryColor: editingOrg.secondaryColor || '#F2C94C',
          website: editingOrg.website,
          description: editingOrg.description || '',
          verificationSource: editingOrg.verificationSource || 'CNE - RUPYM',
          lastUpdated: new Date().toISOString().slice(0, 10),
          isOfficialCatalog: editingOrg.isOfficialCatalog ?? true,
          createdAt: editingOrg.createdAt
        },
        ownerEmail
      );
      setEditingOrg(null);
      await loadAll();
      setFeedback({ type: 'success', text: 'Catálogo de organizaciones políticas actualizado.' });
    } catch {
      setFeedback({ type: 'error', text: 'No se pudo guardar la organización.' });
    } finally {
      setSavingOrg(false);
    }
  };

  const handleDeleteOrg = async (org: PoliticalOrganization) => {
    await deletePoliticalOrganization(org.id, ownerEmail, org.officialName);
    await loadAll();
  };

  const handleReviewProposal = async (
    prop: PendingPoliticalOrganization,
    decision: 'aprobada' | 'rechazada'
  ) => {
    await reviewPendingPoliticalOrg(prop, decision, '', ownerEmail);
    await loadAll();
    setFeedback({
      type: 'success',
      text: `Propuesta "${prop.officialName}" marcada como ${decision}.`
    });
  };

  const pendingCount = proposals.filter((p) => p.status === 'pendiente').length;
  const filteredCatalog = catalog.filter(
    (o) =>
      o.officialName.toLowerCase().includes(search.toLowerCase()) ||
      o.acronym.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif font-black text-2xl sm:text-3xl text-[#121212] dark:text-white">
            Administración Política (CNE / RUPYM)
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
            Gestiona el catálogo oficial de organizaciones políticas de Colombia, revisa propuestas de usuarios y consulta el historial de cambios.
          </p>
        </div>

        <button
          type="button"
          onClick={handleStartNewOrg}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#9B1B30] text-white text-xs font-bold hover:bg-[#7d1526] cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar organización al catálogo</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setTab('catalog')}
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
            tab === 'catalog'
              ? 'bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950'
              : 'bg-white dark:bg-[#18181c] text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800'
          }`}
        >
          Catálogo Oficial ({catalog.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('proposals')}
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
            tab === 'proposals'
              ? 'bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950'
              : 'bg-white dark:bg-[#18181c] text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800'
          }`}
        >
          Organizaciones Propuestas ({pendingCount} pendientes)
        </button>
        <button
          type="button"
          onClick={() => setTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
            tab === 'audit'
              ? 'bg-[#121212] dark:bg-gold-500 text-white dark:text-stone-950'
              : 'bg-white dark:bg-[#18181c] text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800'
          }`}
        >
          Historial de Modificaciones ({auditLogs.length})
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Add/Edit Form */}
      {editingOrg && (
        <form
          onSubmit={handleSaveOrg}
          className="bg-white dark:bg-[#18181c] rounded-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-4"
        >
          <h3 className="font-serif font-bold text-lg text-[#121212] dark:text-white">
            {editingOrg.id ? 'Editar Organización Política' : 'Nueva Organización en Catálogo'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Nombre oficial *</label>
              <input
                type="text"
                required
                value={editingOrg.officialName || ''}
                onChange={(e) => setEditingOrg({ ...editingOrg, officialName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Sigla *</label>
              <input
                type="text"
                required
                value={editingOrg.acronym || ''}
                onChange={(e) => setEditingOrg({ ...editingOrg, acronym: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Categoría</label>
              <select
                value={editingOrg.category || 'A'}
                onChange={(e) => setEditingOrg({ ...editingOrg, category: e.target.value as PoliticalOrgCategory })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm"
              >
                <option value="A">A. Con personería vigente</option>
                <option value="B">B. Sin personería vigente / En fusión</option>
                <option value="C">C. Movimientos ciudadanos / Coaliciones</option>
                <option value="D">D. Otras registradas manualmente</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Estado de personería jurídica</label>
              <select
                value={editingOrg.legalStatus || 'vigente'}
                onChange={(e) =>
                  setEditingOrg({ ...editingOrg, legalStatus: e.target.value as PoliticalLegalStatus })
                }
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm"
              >
                {Object.entries(POLITICAL_LEGAL_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Fuente de verificación (CNE / Resolución)</label>
              <input
                type="text"
                value={editingOrg.verificationSource || ''}
                onChange={(e) => setEditingOrg({ ...editingOrg, verificationSource: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Detalle jurídico / Nota CNE</label>
            <input
              type="text"
              value={editingOrg.legalStatusDetail || ''}
              onChange={(e) => setEditingOrg({ ...editingOrg, legalStatusDetail: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Página web oficial</label>
              <input
                type="url"
                value={editingOrg.website || ''}
                onChange={(e) => setEditingOrg({ ...editingOrg, website: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">URL de Logotipo (opcional)</label>
              <input
                type="text"
                value={editingOrg.logoUrl || ''}
                onChange={(e) => setEditingOrg({ ...editingOrg, logoUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Color 1</label>
                <input
                  type="color"
                  value={editingOrg.primaryColor || '#9B1B30'}
                  onChange={(e) => setEditingOrg({ ...editingOrg, primaryColor: e.target.value })}
                  className="h-9 w-14 rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Color 2</label>
                <input
                  type="color"
                  value={editingOrg.secondaryColor || '#F2C94C'}
                  onChange={(e) => setEditingOrg({ ...editingOrg, secondaryColor: e.target.value })}
                  className="h-9 w-14 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditingOrg(null)}
              className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingOrg}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#9B1B30] text-white text-xs font-bold cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{savingOrg ? 'Guardando...' : 'Guardar en catálogo'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 1: CATALOG */}
      {tab === 'catalog' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar organizaciones del catálogo..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#18181c] text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCatalog.map((org) => (
              <div
                key={org.id}
                className="bg-white dark:bg-[#18181c] rounded-2xl border border-stone-200 dark:border-stone-800 p-4 flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-black text-xs text-white shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${org.primaryColor} 0%, ${org.secondaryColor} 100%)`
                    }}
                  >
                    {org.acronym}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="font-serif font-bold text-base text-[#121212] dark:text-white truncate">
                      {org.officialName}
                    </div>
                    <div className="text-xs font-semibold text-[#9B1B30] dark:text-gold-400">
                      Cat. {org.category} · {POLITICAL_LEGAL_STATUS_LABELS[org.legalStatus]}
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2">
                      {org.legalStatusDetail}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingOrg(org)}
                    className="p-2 rounded-lg text-stone-400 hover:text-stone-800 dark:hover:text-white cursor-pointer"
                    title="Editar"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteOrg(org)}
                    className="p-2 rounded-lg text-stone-400 hover:text-rose-600 cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PENDING PROPOSALS */}
      {tab === 'proposals' && (
        <div className="space-y-4">
          {proposals.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-[#18181c] border border-stone-200 dark:border-stone-800 text-center text-sm text-stone-500">
              No hay propuestas de organizaciones enviadas por usuarios.
            </div>
          ) : (
            proposals.map((prop) => (
              <div
                key={prop.id}
                className="bg-white dark:bg-[#18181c] rounded-2xl border border-stone-200 dark:border-stone-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-lg text-[#121212] dark:text-white">
                      {prop.officialName}
                    </span>
                    {prop.acronym && (
                      <span className="text-xs font-bold text-stone-500">({prop.acronym})</span>
                    )}
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        prop.status === 'pendiente'
                          ? 'bg-amber-100 text-amber-800'
                          : prop.status === 'aprobada'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {prop.status}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300">{prop.description}</p>
                  <div className="text-[11px] text-stone-500">
                    Fuente: {prop.verificationSource} · Enviado por: {prop.submittedByName} ({prop.submittedByEmail})
                  </div>
                </div>

                {prop.status === 'pendiente' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleReviewProposal(prop, 'aprobada')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Aprobar (Cat. D)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReviewProposal(prop, 'rechazada')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Rechazar</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {tab === 'audit' && (
        <div className="bg-white dark:bg-[#18181c] rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-sm text-stone-500">
              No hay registros de cambios políticos todavía.
            </div>
          ) : (
            <div className="divide-y divide-stone-200 dark:divide-stone-800">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-bold text-[#121212] dark:text-white">{log.targetName}</span>
                    <span className="mx-2 text-stone-400">·</span>
                    <span className="text-stone-600 dark:text-stone-300">{log.details}</span>
                  </div>
                  <div className="text-[11px] text-stone-500 shrink-0">
                    {log.actorEmail} · {new Date(log.timestamp).toLocaleString('es-CO')}
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

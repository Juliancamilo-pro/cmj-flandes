import React from 'react';
import { MapPin, Mail, Clock, ShieldCheck } from 'lucide-react';
import { CmjInstitutionalConfig, PublicPageId } from '../../types/cmj';
import { CmjLogo } from './CmjLogo';

interface CmjFooterProps {
  config: CmjInstitutionalConfig;
  onNavigate: (page: PublicPageId) => void;
}

export const CmjFooter: React.FC<CmjFooterProps> = ({ config, onNavigate }) => {
  return (
    <footer className="mt-20 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0f1115]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-4">
            <CmjLogo size="md" officialLogoUrl={config.officialLogoUrl} />
            <p className="text-sm text-stone-600 dark:text-stone-400 max-w-md leading-relaxed">
              Organismo autónomo de participación, concertación, vigilancia y control de la gestión pública juvenil en el municipio de Flandes, departamento del Tolima, Colombia (Ley Estatutaria 1622 de 2013 y Ley 1885 de 2018).
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-900 text-xs font-semibold text-stone-700 dark:text-stone-300">
              <ShieldCheck className="w-4 h-4 text-[#166534] dark:text-emerald-400" />
              <span>Plataforma Oficial de Transparencia y Participación Juvenil</span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-stone-900 dark:text-stone-100 mb-4">
              Navegación Institucional
            </h3>
            <ul className="space-y-2 text-sm">
              {[
                { id: 'quienes-somos', label: 'Quiénes somos' },
                { id: 'integrantes', label: 'Integrantes del CMJ' },
                { id: 'control-politico', label: 'Control Político a la Alcaldía' },
                { id: 'rendicion-cuentas', label: 'Rendición de Cuentas' },
                { id: 'sesiones', label: 'Sesiones y convocatorias' },
                { id: 'documentos', label: 'Actas y documentos' },
                { id: 'proyectos', label: 'Proyectos e iniciativas' },
                { id: 'participacion', label: 'Participación juvenil' },
                { id: 'transparencia', label: 'Transparencia' },
              ].map((link) => (
                <li key={link.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(link.id as PublicPageId)}
                    className="text-stone-600 dark:text-stone-400 hover:text-[#8c162a] dark:hover:text-[#f2c94c] transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-stone-900 dark:text-stone-100 mb-4">
              Atención Institucional
            </h3>
            <ul className="space-y-3 text-sm text-stone-600 dark:text-stone-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#8c162a] dark:text-[#f2c94c] shrink-0 mt-0.5" />
                <span>{config.officeAddress}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-[#003893] dark:text-blue-400 shrink-0 mt-0.5" />
                <span className="break-all">{config.institutionalEmail}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#166534] dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>{config.officeHours}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500 dark:text-stone-400">
          <p>
            © {new Date().getFullYear()} Consejo Municipal de Juventud Flandes · Flandes, Tolima, Colombia.
          </p>
          <p>Plataforma institucional sin fines comerciales.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 h-1.5 w-full">
        <div className="colombia-ribbon h-full">
          <div className="colombia-yellow" />
          <div className="colombia-blue" />
          <div className="colombia-red" />
        </div>
        <div className="tolima-ribbon h-full">
          <div className="tolima-vinotinto" />
          <div className="tolima-gold" />
        </div>
      </div>
    </footer>
  );
};

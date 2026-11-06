import {
  PoliticalAffiliationType,
  PoliticalLegalStatus,
  PoliticalOrgCategory,
  PoliticalOrganization,
  UserPoliticalIdentity
} from '../types';

export const POLITICAL_AFFILIATION_OPTIONS: {
  value: PoliticalAffiliationType;
  label: string;
  requiresOrganization: boolean;
}[] = [
  {
    value: 'afiliado',
    label: 'Sí, pertenezco o estoy afiliado a una organización política.',
    requiresOrganization: true
  },
  {
    value: 'simpatizante',
    label: 'Soy simpatizante de una organización política.',
    requiresOrganization: true
  },
  {
    value: 'independiente',
    label: 'Participo en un movimiento político independiente.',
    requiresOrganization: true
  },
  {
    value: 'ninguna',
    label: 'No pertenezco ni me identifico con ninguna organización política.',
    requiresOrganization: false
  },
  {
    value: 'prefiero_no_responder',
    label: 'Prefiero no responder.',
    requiresOrganization: false
  }
];

export const POLITICAL_CATEGORY_LABELS: Record<PoliticalOrgCategory, string> = {
  A: 'A. Partidos y movimientos con personería jurídica vigente',
  B: 'B. Partidos y movimientos sin personería jurídica vigente',
  C: 'C. Movimientos ciudadanos, agrupaciones y organizaciones políticas independientes',
  D: 'D. Otras organizaciones registradas manualmente'
};

export const POLITICAL_LEGAL_STATUS_LABELS: Record<PoliticalLegalStatus, string> = {
  vigente: 'Personería jurídica vigente (CNE - RUPYM)',
  en_fusion_o_transicion: 'Personería jurídica unificada / en transición (CNE)',
  sin_personeria: 'Sin personería jurídica vigente',
  anulada_judicialmente: 'Personería jurídica anulada por decisión judicial',
  agrupacion_ciudadana: 'Agrupación o coalición sin personería jurídica propia',
  no_verificada: 'Organización declarada por el usuario (sin verificación CNE)'
};

export const CNE_RUPYM_OFFICIAL_CATALOG: PoliticalOrganization[] = [
  // =========================================================================
  // CATEGORÍA A: Partidos y movimientos con personería jurídica vigente
  // =========================================================================
  {
    id: 'org-pacto-historico-mov',
    officialName: 'Movimiento Político Pacto Histórico',
    shortName: 'Pacto Histórico',
    acronym: 'PACTO',
    category: 'A',
    legalStatus: 'en_fusion_o_transicion',
    legalStatusDetail:
      'Personería jurídica unificada reconocida por el CNE mediante fusión de Polo Democrático Alternativo, Unión Patriótica y Partido Comunista Colombiano, sujeta a la firmeza de procesos administrativos conforme a la Ley 1475 de 2011.',
    primaryColor: '#6D28D9',
    secondaryColor: '#EC4899',
    website: 'https://pactohistorico.com.co',
    description:
      'Movimiento político nacional reconocido por el CNE tras la unificación orgánica de colectividades progresistas y de izquierda en Colombia.',
    verificationSource: 'Consejo Nacional Electoral (CNE) - RUPYM / Resolución de Fusión',
    lastUpdated: '2026-11-05',
    isOfficialCatalog: true,
    isCoalition: false,
    memberOrgIds: ['org-polo-democratico', 'org-union-patriotica', 'org-partido-comunista'],
    createdAt: '2026-11-05T00:00:00.000Z'
  },
  {
    id: 'org-partido-liberal',
    officialName: 'Partido Liberal Colombiano',
    shortName: 'Partido Liberal',
    acronym: 'PLC',
    category: 'A',
    legalStatus: 'vigente',
    legalStatusDetail: 'Personería jurídica vigente registrada en el RUPYM del Consejo Nacional Electoral.',
    primaryColor: '#DC2626',
    secondaryColor: '#FFFFFF',
    website: 'https://www.partidoliberal.org.co',
    description: 'Partido político tradicional colombiano fundado en 1848 con personería jurídica vigente ante el CNE.',
    verificationSource: 'https://www.cne.gov.co/elecciones/organizaciones-politicas-con-personeria-juridica-vigente',
    lastUpdated: '2026-11-05',
    isOfficialCatalog: true,
    createdAt: '2026-11-05T00:00:00.000Z'
  },
  {
    id: 'org-partido-conservador',
    officialName: 'Partido Conservador Colombiano',
    shortName: 'Partido Conservador',
    acronym: 'PCC',
    category: 'A',
    legalStatus: 'vigente',
    legalStatusDetail: 'Personería jurídica vigente registrada en el RUPYM del Consejo Nacional Electoral.',
    primaryColor: '#1D4ED8',
    secondaryColor: '#FFFFFF',
    website: 'https://www.partidoconservador.com',
    description: 'Partido político tradicional colombiano fundado en 1849 con personería jurídica vigente ante el CNE.',
    verificationSource: 'https://www.cne.gov.co/elecciones/organizaciones-politicas-con-personeria-juridica-vigente',
    lastUpdated: '2026-11-05',
    isOfficialCatalog: true,
    createdAt: '2026-11-05T00:00:00.000Z'
  },
  {
    id: 'org-centro-democratico',
    officialName: 'Partido Centro Democrático',
    shortName: 'Centro Democrático',
    acronym: 'CD',
    category: 'A',
    legalStatus: 'vigente',
    legalStatusDetail: 'Personería jurídica vigente registrada en el RUPYM del Consejo Nacional Electoral.',
    primaryColor: '#0284C7',
    secondaryColor: '#FACC15',
    website: 'https://www.centrodemocratico.com',
    description: 'Partido político colombiano con personería jurídica vigente ante el CNE.',
    verificationSource: 'https://www.cne.gov.co/elecciones/organizaciones-politicas-con-personeria-juridica-vigente',
    lastUpdated: '2026-11-05',
    isOfficialCatalog: true,
    createdAt: '2026-11-05T00:00:00.000Z'
  },
  {
    id: 'org-cambio-radical',
    officialName: 'Partido Cambio Radical',
    shortName: 'Cambio Radical',
    acronym: 'CR',
    category: 'A',
    legalStatus: 'vigente',
    legalStatusDetail: 'Personería jurídica vigente registrada en el RUPYM del Consejo Nacional Electoral.',
    primaryColor: '#E11D48',
    secondaryColor: '#1E3A8A',
    website: 'https://www.partidocambioradical.org',
    description: 'Partido político colombiano con personería jurídica vigente ante el CNE.',
    verificationSource: 'https://www.cne.gov.co/elecciones/organizaciones-politicas-con-personeria-juridica-vigente',
    lastUpdated: '2026-11-05',
    isOfficialCatalog: true,
    createdAt: '2026-11-05T00:00:00.000Z'
  },
  {
    id: 'org-partido-de-la-u',
    officialName: 'Partido de la Unión por la Gente',
    shortName: 'Partido de la U',
    acronym: 'U',
    category: 'A',
    legalStatus: 'vigente',
    legalStatusDetail: 'Personería jurídica vigente registrada en el RUPYM del Consejo Nacional Electoral.',
    primaryColor: '#EA580C',
    secondaryColor: '#16A34A',
    website: 'https://www.partidodelau.com',
    description: 'Partido político colombiano con personería jurídica vigente ante el CNE.',
    verificationSource: 'https://www.cne.gov.co/elecciones/organizaciones-politicas-con-personeria-juridica-vigente',
    lastUpdated: '2026-11-05',
    isOfficialCatalog: true,
    createdAt: '2026-11-05T00:00:00.000Z'
  },
  {
    id: 'org-alianza-verde',
    officialName: 'Partido Alianza Verde',
    shortName: 'Alianza Verde',
    acronym: 'AV',
    category: 'A',
    legalStatus: 'vigente',
    legalStatusDetail: 'Personería jurídica vigente registrada en el RUPYM del Consejo Nacional Electoral.',
    primaryColor: '#16A34A',
    secondaryColor: '#FACC15',
    website: 'https://www.alianzaverde.org.co',
    description: 'Partido político colombiano de orientación ecologista y cívica con personería jurídica vigente.',
    verificationSource: 'https://www.cne.gov.co/elecciones/organizaciones-politicas-con-personeria-juridica-vigente',
    lastUpdated: '2026-11-05',
    isOfficialCatalog: true,
    createdAt: '2026-11-05T00:00:00.000Z'
  },
  {
    id: 'org-nuevo-liberalismo',
    officialName: 'Partido Nuevo Liberalismo',
    shortName: 'Nuevo Liberalismo',
    acronym: 'NL',
    category: 'A',
    legalStatus: 'vigente',
    legalStatusDetail: 'Personería jurídica vigente registrada en el RUPYM del Consejo Nacional Electoral.',
    primaryColor: '#B91C1C',
    secondaryColor: '#F59E0B',
    website: 'https://www.nuevoliberalismo.org',
    description: 'Partido político colombiano con personería jurídica vigente ante el CNE.',
    verificationSource: 'https://www.cne.gov.co/elecciones/organizaciones-politicas-con-personeria-juridica-vigente',
    lastUpdated: '2026-11-05',
    isOfficialCatalog: true,
    createdAt: '2026-11-05T00:00:00.000Z'
  },
  {
    id: 'org-colombia-humana',
    officialName: 'Movimiento Político Colombia Humana',
    shortName: 'Colombia Humana',
    acronym: 'CH',
    category: 'A',
    legalStatus: 'vigente',
    legalStatusDetail: 'Personería jurídica vigente registrada en el RUPYM del Consejo Nacional Electoral.',
    primaryColor: '#7C3AED',
    secondaryColor: '#F59E0B',
    website: 'https://colombiahumana.co',
    description: 'Movimiento político colombiano con personería jurídica vigente ante el CNE.',
    verificationSource: 'https://www.cne.gov.co/elecciones/organizaciones-politicas-con-personeria-juridica-vigente',
    lastUpdated: '2026-11-05',
    isOfficialCatalog: true,
    createdAt: '2026-11-05T00:00:00.000Z'
  },
  {
    id: 'org-mais',
    officialName: 'Movimiento Alternativo Indígena y Social',
    shortName: 'MAIS',
    acronym: 'MAIS',
    category: 'A',
    legalStatus: 'vigente',
    legalStatusDetail: 'Personería jurídica vigente registrada en el RUPYM del Consejo Nacional Electoral.',
    primaryColor: '#15803D',
    secondaryColor: '#CA8A04',
    website: 'https://www.mais.com.co',
    description: 'Movimiento político indígena y social de Colombia con personería jurídica vigente.',
    verificationSource: 'https://www.cne.gov.co/elecciones/organizaciones-politicas-con-personeria-juridica-vigente',
    lastUpdated: '2026-11-05',
    isOfficialCatalog: true,
    createdAt: '2026-11-05T00:00:00.000Z'
  },
  {
    id: 'org-aico',
    officialName: 'Movimiento Autoridades Indígenas de Colombia',
    shortName: 'AICO',
    acronym: 'AICO',
    category: 'A',
    legalStatus: 'vigente',
    legalStatusDetail: 'Personería jurídica vigente registrada en el RUPYM del Consejo Nacional Electoral.',
    primaryColor: '#0F766E',
    secondaryColor: '#FBBF24',
    website: 'https://www.aico.org.co',
    description: 'Movimiento político indígena colombiano con personería jurídica vigente ante el CNE.',
    verificationSource: 'https://www.cne.gov.co/elecciones/organizaciones-politicas-con-personeria-juridica-vigente',
    lastUpdated: '2026-11-05',
    isOfficialCatalog: true,
    createdAt: '2026-11-05T00:00:00.000Z'
  },
  {
    id: 'org-asi',
    officialName: 'Partido Alianza Social Independiente',
    shortName: 'ASI',
    acronym: 'ASI',
    category: 'A',
    legalStatus: 'vigente',
    legalStatusDetail: 'Personería jurídica vigente registrada en el RUPYM del Consejo Nacional Electoral.',
    primaryColor: '#0369A1',
    secondaryColor: '#10B981',
    website: 'https://www.partidoasi.co',
    description: 'Partido político colombiano con personería jurídica vigente ante el CNE.',
    verificationSource: 'https://www.cne.gov.co/elecciones/organizaciones-politicas-con-personeria-juridica-vigente',
    lastUpdated: '2026-11-05',
    isOfficialCatalog: true,
    createdAt: '2026-11-05T00:00:00.000Z'
  },
  {
    id: 'org-ada',
    officialName: 'Partido Alianza Democrática Amplia',
    shortName: 'ADA',
    acronym: 'ADA',
    category: 'A',
    legalStatus: 'vigente',
    legalStatusDetail: 'Personería jurídica vigente registrada en el RUPYM del Consejo Nacional Electoral.',
    primaryColor: '#2563EB',
    secondaryColor: '#F59E0B',
    website: 'https://www.partidoada.co',
    description: 'Partido político colombiano con personería jurídica vigente ante el CNE.',
    verificationSource: 'https://www.cne.gov.co/elecciones/organizaciones-politicas-con-personeria-juridica-vigente',
    lastUpdated: '2026-11-05',
    isOfficialCatalog: true,
    createdAt: '2026-11-05T00:00:00.000Z'
  },
  {
    id: 'org-mira',
    officialName: 'Partido Político MIRA',
    shortName: 'Partido MIRA',
    acronym: 'MIRA',
    category: 'A',
    legalStatus: 'vigente',
    legalStatusDetail: 'Personería jurídica vigente registrada en el RUPYM del Consejo Nacional Electoral.',
    primaryColor: '#1E3A8A',
    secondaryColor: '#38BDF8',
    website: 'https://partidomira.com',
    description: 'Partido político colombiano con personería jurídica vigente ante el CNE.',
    verificationSource: 'https://www.cne.gov.co/elecciones/organizaciones-politicas-con-personeria-juridica-vigente',
    lastUpdated: '2026-11-05',
    isOfficialCatalog: true,
    createdAt: '2026-11-05T00:00:00.000Z'
  },
  {
    id: 'org-colombia-justa-libres',
    officialName: 'Partido Colombia Justa Libres',
    shortName: 'Colombia Justa Libres',
    acronym: 'CJL',
    category: 'A',
    legalStatus: 'vigente',
    legalStatusDetail: 'Personería jurídica vigente registrada en el RUPYM del Consejo Nacional Electoral.',
    primaryColor: '#1D4ED8',
    secondaryColor: '#DC2626',
    website: 'https://colombiajustalibres.com',
    description: 'Partido político colombiano con personería jurídica vigente ante el CNE.',
    verificationSource: 'https://www.cne.gov.co/elecciones/organizaciones-politicas-con-personeria-juridica-vigente',
    lastUpdated: '2026-11-05',
    isOfficialCatalog: true,
    createdAt: '2026-11-05T00:00:00.000Z'
  },
  {
    id: 'org-salvacion-nacional',
    officialName: 'Movimiento de Salvación Nacional',
    shortName: 'Salvación Nacional',
    acronym: 'MSN',
    category: 'A',
    legalStatus: 'vigente',
    legalStatusDetail: 'Personería jurídica vigente registrada en el RUPYM del Consejo Nacional Electoral.',
    primaryColor: '#1E40AF',
    secondaryColor: '#FACC15',
    website: 'https://salvacionnacional.co',
    description: 'Movimiento político colombiano con personería jurídica vigente ante el CNE.',
    verificationSource: 'https://www.cne.gov.co/elecciones/organizaciones-politicas-con-personeria-juridica-vigente',
    lastUpdated: '2026-11-05',
    isOfficialCatalog: true,
    createdAt: '2026-11-05T00:00:00.000Z'
  },
  {
    id: 'org-dignidad-compromiso',
    officialName: 'Partido Dignidad y Compromiso',
    shortName: 'Dignidad y Compromiso',
    acronym: 'DyC',
    category: 'A',
    legalStatus: 'vigente',
    legalStatusDetail: 'Personería jurídica vigente registrada en el RUPYM del Consejo Nacional Electoral.',
    primaryColor: '#0D9488',
    secondaryColor: '#F59E0B',
    website: 'https://dignidadycompromiso.co',
    description: 'Partido político colombiano con personería jurídica vigente ante el CNE.',
    verificationSource: 'https://www.cne.gov.co/elecciones/organizaciones-politicas-con-personeria-juridica-vigente',
    lastUpdated: '2026-11-05',
    isOfficialCatalog: true,
    createdAt: '2026-11-05T00:00:00.000Z'
  },
  {
    id: 'org-colombia-renaciente',
    officialName: 'Partido Colombia Renaciente',
    shortName: 'Colombia Renaciente',
    acronym: 'PCR',
    category: 'A',
    legalStatus: 'vigente',
    legalStatusDetail: 'Personería jurídica vigente registrada en el RUPYM del Consejo Nacional Electoral.',
    primaryColor: '#059669',
    secondaryColor: '#FBBF24',
    website: 'https://partidocolombiarenaciente.co',
    description: 'Partido político colombiano con personería jurídica vigente ante el CNE.',
    verificationSource: 'https://www.cne.gov.co/elecciones/organizaciones-politicas-con-personeria-juridica-vigente',
    lastUpdated: '2026-11-05',
    isOfficialCatalog: true,
    createdAt: '2026-11-05T00:00:00.000Z'
  },
  {
    id: 'org-verde-oxigeno',
    officialName: 'Partido Verde Oxígeno',
    shortName: 'Verde Oxígeno',
    acronym: 'PVO',
    category: 'A',
    legalStatus: 'vigente',
    legalStatusDetail: 'Personería jurídica vigente registrada en el RUPYM del Consejo Nacional Electoral.',
    primaryColor: '#10B981',
    secondaryColor: '#047857',
    website: 'https://verdeoxigeno.co',
    description: 'Partido político colombiano con personería jurídica vigente ante el CNE.',
    verificationSource: 'https://www.cne.gov.co/elecciones/organizaciones-politicas-con-personeria-juridica-vigente',
    lastUpdated: '2026-11-05',
    isOfficialCatalog: true,
    createdAt: '2026-11-05T00:00:00.000Z'
  },
  {
    id: 'org-la-fuerza-de-la-paz',
    officialName: 'Partido La Fuerza de la Paz',
    shortName: 'La Fuerza de la Paz',
    acronym: 'LFP',
    category: 'A',
    legalStatus: 'vigente',
    legalStatusDetail: 'Personería jurídica vigente registrada en el RUPYM del Consejo Nacional Electoral.',
    primaryColor: '#0284C7',
    secondaryColor: '#E11D48',
    website: 'https://lafuerzadelapaz.co',
    description: 'Partido político colombiano con personería jurídica vigente ante el CNE.',
    verificationSource: 'https://www.cne.gov.co/elecciones/organizaciones-politicas-con-personeria-juridica-vigente',
    lastUpdated: '2026-11-05',
    isOfficialCatalog: true,
    createdAt: '2026-11-05T00:00:00.000Z'
  },
  {
    id: 'org-partido-ecologista',
    officialName: 'Partido Ecologista Colombiano',
    shortName: 'Partido Ecologista',
    acronym: 'PEC',
    category: 'A',
    legalStatus: 'vigente',
    legalStatusDetail: 'Personería jurídica vigente registrada en el RUPYM del Consejo Nacional Electoral.',
    primaryColor: '#15803D',
    secondaryColor: '#84CC16',
    website: 'https://partidoecologistacolombiano.co',
    description: 'Partido político colombiano con personería jurídica vigente ante el CNE.',
    verificationSource: 'https://www.cne.gov.co/elecciones/organizaciones-politicas-con-personeria-juridica-vigente',
    lastUpdated: '2026-11-05',
    isOfficialCatalog: true,
    createdAt: '2026-11-05T00:00:00.000Z'
  },

  // =========================================================================
  // CATEGORÍA B: Partidos y movimientos sin personería jurídica vigente
  // (Incluye colectividades históricas fusionadas o con personería anulada)
  // =========================================================================
  {
    id: 'org-polo-democratico',
    officialName: 'Polo Democrático Alternativo',
    shortName: 'Polo Democrático',
    acronym: 'PDA',
    category: 'B',
    legalStatus: 'en_fusion_o_transicion',
    legalStatusDetail:
      'Colectividad histórica integrada en la fusión del Movimiento Político Pacto Histórico ante el CNE. Conserva su identificación histórica; no mantiene personería jurídica independiente tras la unificación.',
    primaryColor: '#FACC15',
    secondaryColor: '#111827',
    website: 'https://www.polodemocratico.net',
    description:
      'Partido político histórico de izquierda democrática en Colombia, integrado orgánicamente en la fusión del Movimiento Político Pacto Histórico.',
    verificationSource: 'Consejo Nacional Electoral (CNE) - RUPYM / Registro Histórico de Fusión',
    lastUpdated: '2026-11-05',
    isOfficialCatalog: true,
    isCoalition: false,
    createdAt: '2026-11-05T00:00:00.000Z'
  },
  {
    id: 'org-union-patriotica',
    officialName: 'Unión Patriótica',
    shortName: 'Unión Patriótica',
    acronym: 'UP',
    category: 'B',
    legalStatus: 'en_fusion_o_transicion',
    legalStatusDetail:
      'Colectividad histórica integrada en la fusión del Movimiento Político Pacto Histórico ante el CNE. Conserva su identificación histórica.',
    primaryColor: '#EAB308',
    secondaryColor: '#15803D',
    website: 'https://unionpatriotica.co',
    description: 'Movimiento político histórico colombiano integrado en la fusión del Movimiento Político Pacto Histórico.',
    verificationSource: 'Consejo Nacional Electoral (CNE) - RUPYM / Registro Histórico de Fusión',
    lastUpdated: '2026-11-05',
    isOfficialCatalog: true,
    createdAt: '2026-11-05T00:00:00.000Z'
  },
  {
    id: 'org-partido-comunista',
    officialName: 'Partido Comunista Colombiano',
    shortName: 'Partido Comunista',
    acronym: 'PCC-C',
    category: 'B',
    legalStatus: 'en_fusion_o_transicion',
    legalStatusDetail:
      'Colectividad histórica integrada en la fusión del Movimiento Político Pacto Histórico ante el CNE. Conserva su identificación histórica.',
    primaryColor: '#B91C1C',
    secondaryColor: '#FACC15',
    website: 'https://pacocol.org',
    description: 'Partido político histórico colombiano integrado en la fusión del Movimiento Político Pacto Histórico.',
    verificationSource: 'Consejo Nacional Electoral (CNE) - RUPYM / Registro Histórico de Fusión',
    lastUpdated: '2026-11-05',
    isOfficialCatalog: true,
    createdAt: '2026-11-05T00:00:00.000Z'
  },
  {
    id: 'org-fuerza-ciudadana',
    officialName: 'Movimiento Fuerza Ciudadana',
    shortName: 'Fuerza Ciudadana',
    acronym: 'FC',
    category: 'B',
    legalStatus: 'anulada_judicialmente',
    legalStatusDetail: 'Personería jurídica anulada por decisión judicial del Consejo de Estado.',
    primaryColor: '#EA580C',
    secondaryColor: '#FFFFFF',
    website: 'https://fuerzaciudadana.com.co',
    description: 'Movimiento político colombiano cuya personería jurídica fue objeto de anulación judicial.',
    verificationSource: 'Consejo Nacional Electoral (CNE) / Consejo de Estado',
    lastUpdated: '2026-11-05',
    isOfficialCatalog: true,
    createdAt: '2026-11-05T00:00:00.000Z'
  },
  {
    id: 'org-independientes',
    officialName: 'Movimiento Independientes',
    shortName: 'Independientes',
    acronym: 'IND',
    category: 'B',
    legalStatus: 'anulada_judicialmente',
    legalStatusDetail: 'Personería jurídica anulada por decisión judicial del Consejo de Estado.',
    primaryColor: '#4F46E5',
    secondaryColor: '#FFFFFF',
    description: 'Movimiento político colombiano cuya personería jurídica fue anulada por decisión judicial.',
    verificationSource: 'Consejo Nacional Electoral (CNE) / Consejo de Estado',
    lastUpdated: '2026-11-05',
    isOfficialCatalog: true,
    createdAt: '2026-11-05T00:00:00.000Z'
  },
  {
    id: 'org-poder-popular',
    officialName: 'Movimiento Poder Popular',
    shortName: 'Poder Popular',
    acronym: 'PP',
    category: 'B',
    legalStatus: 'anulada_judicialmente',
    legalStatusDetail: 'Personería jurídica anulada por decisión judicial del Consejo de Estado.',
    primaryColor: '#DC2626',
    secondaryColor: '#1E293B',
    description: 'Movimiento político colombiano cuya personería jurídica fue anulada por decisión judicial.',
    verificationSource: 'Consejo Nacional Electoral (CNE) / Consejo de Estado',
    lastUpdated: '2026-11-05',
    isOfficialCatalog: true,
    createdAt: '2026-11-05T00:00:00.000Z'
  },

  // =========================================================================
  // CATEGORÍA C: Movimientos ciudadanos, agrupaciones y coaliciones
  // =========================================================================
  {
    id: 'org-coalicion-pacto-historico',
    officialName: 'Coalición Electoral Pacto Histórico',
    shortName: 'Coalición Pacto Histórico',
    acronym: 'CPH',
    category: 'C',
    legalStatus: 'agrupacion_ciudadana',
    legalStatusDetail:
      'Coalición electoral y frente amplio de partidos y movimientos políticos. No debe confundirse con los partidos individuales que la integran.',
    primaryColor: '#7E22CE',
    secondaryColor: '#F43F5E',
    website: 'https://pactohistorico.com.co',
    description:
      'Coalición política y electoral colombiana conformada por diversas colectividades y movimientos sociales.',
    verificationSource: 'https://www.cne.gov.co/informacion-sobre-partidos-y-movimientos-politicos',
    lastUpdated: '2026-11-05',
    isOfficialCatalog: true,
    isCoalition: true,
    memberOrgIds: ['org-pacto-historico-mov', 'org-colombia-humana', 'org-mais', 'org-polo-democratico'],
    createdAt: '2026-11-05T00:00:00.000Z'
  },
  {
    id: 'org-gsc-civico',
    officialName: 'Grupo Significativo de Ciudadanos / Movimiento Cívico Regional',
    shortName: 'Movimiento Cívico GSC',
    acronym: 'GSC',
    category: 'C',
    legalStatus: 'agrupacion_ciudadana',
    legalStatusDetail: 'Agrupación ciudadana inscrita por firmas ante la Registraduría / CNE sin personería permanente.',
    primaryColor: '#0F766E',
    secondaryColor: '#F59E0B',
    description: 'Agrupación política ciudadana de carácter territorial o independiente.',
    verificationSource: 'https://www.cne.gov.co/informacion-sobre-partidos-y-movimientos-politicos',
    lastUpdated: '2026-11-05',
    isOfficialCatalog: true,
    createdAt: '2026-11-05T00:00:00.000Z'
  }
];

/**
 * Configuración inicial del perfil oficial del propietario de DULIMA
 * (Julian Camilo Trujillo Gordillo - trujillogordilooo@gmail.com).
 * Privado por defecto hasta que el propietario active expresamente su visibilidad pública.
 */
export const OWNER_DEFAULT_POLITICAL_IDENTITY: UserPoliticalIdentity = {
  affiliationType: 'afiliado',
  organizations: [
    {
      organizationId: 'org-pacto-historico-mov',
      organizationName: 'Movimiento Político Pacto Histórico',
      acronym: 'PACTO',
      primaryColor: '#6D28D9',
      secondaryColor: '#EC4899',
      legalStatus: 'en_fusion_o_transicion',
      legalStatusDetail:
        'Personería jurídica unificada reconocida por el CNE mediante fusión de Polo Democrático Alternativo, Unión Patriótica y Partido Comunista Colombiano, sujeta a firmeza de procesos administrativos.',
      website: 'https://pactohistorico.com.co',
      isCoalition: false
    },
    {
      organizationId: 'org-polo-democratico',
      organizationName: 'Polo Democrático Alternativo',
      acronym: 'PDA',
      primaryColor: '#FACC15',
      secondaryColor: '#111827',
      legalStatus: 'en_fusion_o_transicion',
      legalStatusDetail:
        'Colectividad histórica integrada en la fusión del Movimiento Político Pacto Histórico ante el CNE. Conserva su identificación histórica; no mantiene personería jurídica independiente tras la unificación.',
      website: 'https://www.polodemocratico.net',
      isCoalition: false
    }
  ],
  isPublic: false,
  updatedAt: '2026-11-05T00:00:00.000Z',
  declaredByOwner: true
};

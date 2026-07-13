/**
 * Minimal i18n for site chrome (navigation, labels, editorial copy, UI states).
 *
 * Per the Foundation Brief §4: EN is the default/canonical language, ES is a
 * cared translation. We translate the CHROME only — catalog data (project
 * names, client, place) comes from the Excel in Spanish and is shown verbatim
 * in both languages.
 */

export type Lang = 'en' | 'es';

export const LANGS: readonly Lang[] = ['en', 'es'] as const;
export const DEFAULT_LANG: Lang = 'en';

export function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value);
}

/** Service-type axis labels (primary categorization, brief §3). */
export interface ServiceTypeLabels {
  Industrial: string;
  Academico: string;
  Corporativo: string;
}

export interface Dictionary {
  nav: {
    work: string;
    about: string;
    contact: string;
    home: string;
    games: string;
  };
  home: {
    h1: string;
    sub: string;
    ctaPrimary: string;
    ctaSecondary: string;
    enterArchive: string;
    scroll: string;
  };
  work: {
    title: string;
    intro: string;
    searchPlaceholder: string;
    filterAll: string;
    filterService: string;
    filterClient: string;
    filterYear: string;
    filterPlace: string;
    nounSingular: string;
    nounPlural: string;
    clearFilters: string;
    emptyDefault: string;
    emptyNoResults: string;
  };
  detail: {
    back: string;
    client: string;
    type: string;
    year: string;
    place: string;
    code: string;
    noPreview: string;
    watchOnVimeo: string;
    narrative: string;
  };
  serviceType: ServiceTypeLabels;
  about: {
    title: string;
    body: string;
    capabilitiesTitle: string;
  };
  contact: {
    title: string;
    body: string;
    emailLabel: string;
  };
  footer: {
    tagline: string;
  };
  meta: {
    langName: string;
    switchTo: string;
  };
}

const en: Dictionary = {
  nav: { work: 'Work', about: 'About', contact: 'Contact', home: 'Home', games: 'Games' },
  home: {
    h1: 'An archive in motion.',
    sub: '15 years of video editing and photography for industry, academia and corporate clients in Chile — catalogued and searchable.',
    ctaPrimary: 'Search the archive',
    ctaSecondary: 'About the studio',
    enterArchive: 'Browse by client, type or year',
    scroll: 'Scroll',
  },
  work: {
    title: 'The Archive',
    intro: '15 years of video editing and photography, indexed. Filter by service type, client, year or place.',
    searchPlaceholder: 'Search by client, project, place or year…',
    filterAll: 'All',
    filterService: 'Service type',
    filterClient: 'Client',
    filterYear: 'Year',
    filterPlace: 'Place',
    nounSingular: 'piece',
    nounPlural: 'pieces',
    clearFilters: 'Clear filters',
    emptyDefault: 'Start typing, or browse the full archive below.',
    emptyNoResults: 'Nothing matches that — try a broader term.',
  },
  detail: {
    back: 'Back to the archive',
    client: 'Client',
    type: 'Type',
    year: 'Year',
    place: 'Place',
    code: 'Catalogue',
    noPreview: 'No preview available for this piece yet.',
    watchOnVimeo: 'Watch on Vimeo',
    narrative: 'About this piece',
  },
  serviceType: {
    Industrial: 'Industrial',
    Academico: 'Academic',
    Corporativo: 'Corporate',
  },
  about: {
    title: 'About',
    body: "Leonfindel is a Chilean audiovisual studio. For over twenty years we've documented industry, education and corporate life on film and in photographs.",
    capabilitiesTitle: 'Capabilities',
  },
  contact: {
    title: 'Contact',
    body: 'For commissions, licensing of archive material, or access to the full catalogue, get in touch.',
    emailLabel: 'Email',
  },
  footer: { tagline: 'Chilean audiovisual studio — archive in motion.' },
  meta: { langName: 'English', switchTo: 'Español' },
};

const es: Dictionary = {
  nav: { work: 'Trabajo', about: 'Estudio', contact: 'Contacto', home: 'Inicio', games: 'Juegos' },
  home: {
    h1: 'Un archivo en movimiento.',
    sub: '15 años de video edición y fotografía industrial, académica y corporativa en Chile — catalogados y buscables.',
    ctaPrimary: 'Busca el archivo',
    ctaSecondary: 'Sobre el estudio',
    enterArchive: 'Explora por cliente, tipo o año',
    scroll: 'Baja',
  },
  work: {
    title: 'El Archivo',
    intro: '15 años de video edición y fotografía, indexados. Filtra por tipo de servicio, cliente, año o lugar.',
    searchPlaceholder: 'Busca por cliente, proyecto, lugar o año…',
    filterAll: 'Todos',
    filterService: 'Tipo de servicio',
    filterClient: 'Cliente',
    filterYear: 'Año',
    filterPlace: 'Lugar',
    nounSingular: 'pieza',
    nounPlural: 'piezas',
    clearFilters: 'Limpiar filtros',
    emptyDefault: 'Empieza a escribir, o explora el archivo completo abajo.',
    emptyNoResults: 'No hay coincidencias — prueba un término más amplio.',
  },
  detail: {
    back: 'Volver al archivo',
    client: 'Cliente',
    type: 'Tipo',
    year: 'Año',
    place: 'Lugar',
    code: 'Catálogo',
    noPreview: 'Esta pieza todavía no tiene preview disponible.',
    watchOnVimeo: 'Ver en Vimeo',
    narrative: 'Sobre esta pieza',
  },
  serviceType: {
    Industrial: 'Industrial',
    Academico: 'Académico',
    Corporativo: 'Corporativo',
  },
  about: {
    title: 'Estudio',
    body: 'Leonfindel es un estudio audiovisual chileno. Por más de veinte años hemos documentado la industria, la educación y el mundo corporativo en cine y fotografía.',
    capabilitiesTitle: 'Capacidades',
  },
  contact: {
    title: 'Contacto',
    body: 'Para encargos, licenciamiento de material de archivo, o acceso al catálogo completo, escríbenos.',
    emailLabel: 'Correo',
  },
  footer: { tagline: 'Estudio audiovisual chileno — archivo en movimiento.' },
  meta: { langName: 'Español', switchTo: 'English' },
};

const DICTIONARIES: Record<Lang, Dictionary> = { en, es };

export function t(lang: Lang): Dictionary {
  return DICTIONARIES[lang];
}

/**
 * Resolve the active language from a route param. ES lives under `/es/…`;
 * everything else is the EN default at the root.
 */
export function langFromParam(param: string | undefined): Lang {
  return param && isLang(param) ? param : DEFAULT_LANG;
}

/** Build an href honouring the active language prefix. EN has no prefix. */
export function localizedPath(lang: Lang, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (lang === DEFAULT_LANG) return clean;
  return clean === '/' ? `/${lang}` : `/${lang}${clean}`;
}

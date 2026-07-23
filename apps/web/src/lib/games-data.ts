/**
 * Static list of "Corte Ferpecto" mini-games. Educational HTML5 games about
 * film/video editing, separate from the audiovisual catalog. Each game is a
 * self-contained static HTML file served from /public/games-raw and embedded via
 * iframe inside the site chrome (Base layout).
 *
 * To add/remove a game: edit this list and drop the HTML file in
 * apps/web/public/games-raw/. No other code changes needed.
 */

export interface GameEntry {
  code: string;
  slug: string;
  file: string;
  title: { en: string; es: string };
  description: { en: string; es: string };
}

export const GAMES: GameEntry[] = [
  {
    code: 'G01',
    slug: 'organiza-la-toma',
    file: 'organiza-la-toma.html',
    title: { en: 'Set the shot', es: 'Organiza la toma' },
    description: {
      en: 'Arrange the elements of a film set before the camera rolls.',
      es: 'Ordena los elementos de un set de rodaje antes de que ruede la camara.',
    },
  },
  {
    code: 'G02',
    slug: 'conecta-el-cable',
    file: 'conecta-el-cable.html',
    title: { en: 'Connect the cable', es: 'Conecta el cable' },
    description: {
      en: 'A mini-game about cabling and technical setup on location.',
      es: 'Un mini-juego sobre cableado y setup tecnico en terreno.',
    },
  },
  {
    code: 'G03',
    slug: 'memoria-scania',
    file: 'memoria-scania.html',
    title: { en: 'Scania memory match', es: 'Memoria Scania: rompecabezas' },
    description: {
      en: 'A memory game using stills from a real Scania project.',
      es: 'Juego de memoria con fotogramas de un proyecto real de Scania.',
    },
  },
  {
    code: 'G04',
    slug: 'lluvia-de-rodaje',
    file: 'lluvia-de-rodaje.html',
    title: { en: 'Shoot-day rain', es: 'Lluvia de rodaje' },
    description: {
      en: 'Dodge on-set mishaps while shooting in the rain.',
      es: 'Esquiva los imprevistos de un rodaje bajo lluvia mientras grabas.',
    },
  },
  {
    code: 'G05',
    slug: 'mejor-toma',
    file: 'mejor-toma.html',
    title: { en: 'Corte Ferpecto: best take', es: 'Corte Ferpecto: mejor toma' },
    description: {
      en: 'Pick the best take among several options of the same scene.',
      es: 'Elige la mejor toma entre varias opciones de una misma escena.',
    },
  },
  {
    code: 'G06',
    slug: 'laberinto',
    file: 'laberinto.html',
    title: { en: "Maze: Diego's route", es: 'Laberinto: la ruta de Diego' },
    description: {
      en: 'Guide the camera operator through the set maze to the final shot.',
      es: 'Guia al camarografo por el laberinto de un set hasta la toma final.',
    },
  },
  {
    code: 'G07',
    slug: 'ojo-de-color',
    file: 'ojo-de-color.html',
    title: { en: 'Corte Ferpecto: color eye', es: 'Corte Ferpecto: ojo de color' },
    description: {
      en: 'Test your eye for color correction between shots.',
      es: 'Pon a prueba tu ojo para la correccion de color entre tomas.',
    },
  },
  {
    code: 'G08',
    slug: 'corte-ferpecto',
    file: 'corte-ferpecto.html',
    title: {
      en: 'Corte Ferpecto - edit with heart or die',
      es: 'Corte Ferpecto - edita con corazon o muere',
    },
    description: {
      en: 'The flagship game of the series: edit against the clock, with judgment.',
      es: 'El juego principal de la serie: edita contra el reloj y con criterio.',
    },
  },
  {
    code: 'G09',
    slug: 'secuencias-perfectas',
    file: 'secuencias-perfectas.html',
    title: { en: 'Perfect sequences', es: 'Secuencias perfectas' },
    description: {
      en: 'Reorder the production layers into the correct sequence before time runs out.',
      es: 'Ordena las capas de produccion en la secuencia correcta antes de que se acabe el tiempo.',
    },
  },
  ];

export function getGame(slug: string): GameEntry | undefined {
  return GAMES.find((g) => g.slug === slug);
}

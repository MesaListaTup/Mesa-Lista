// Ilustraciones del menú: todas comparten estilo (trazo azul tinta de 3 px, formas planas y la paleta de la marca).
// Son SVG de 120×120. Se usan cuando un producto no tiene foto.
const T = '#15233B'; // tinta
const PAPEL = '#FBFAF6';
const TOMATE = '#E5402B';
const LIMON = '#F2D64B';
const SIFON = '#CFE8E4';
const DORADO = '#E9B766';
const MARRON = '#B7743C';
const VERDE = '#7FB069';
const VINO = '#8E2C3A';

export const DIBUJOS = {
  pasta: `
    <path d="M14 62 H106 C104 90 84 104 60 104 C36 104 16 90 14 62 Z" fill="${PAPEL}"/>
    <path d="M22 62 C26 34 94 34 98 62 Z" fill="${LIMON}"/>
    <path d="M32 58 C40 46 50 62 58 50 C66 40 76 58 86 48" fill="none"/>
    <path d="M30 52 C38 42 48 56 56 44 C64 36 74 52 90 44" fill="none" stroke-width="2.4"/>
    <ellipse cx="60" cy="42" rx="17" ry="8" fill="${TOMATE}"/>
    <path d="M66 36 C72 28 80 30 80 30 C80 30 78 38 70 40 Z" fill="${VERDE}"/>
    <path d="M44 96 C52 100 68 100 76 96" fill="none" stroke-width="2.4"/>`,

  parrilla: `
    <path d="M34 26 C28 38 40 40 34 52 M60 18 C52 32 66 36 58 50 M86 26 C80 38 92 40 86 52" fill="none" stroke="${TOMATE}" stroke-width="4"/>
    <path d="M16 66 H104 L96 100 H24 Z" fill="${SIFON}"/>
    <path d="M26 74 H94 M28 84 H92" fill="none" stroke-width="2.4"/>
    <path d="M30 100 V110 M90 100 V110" fill="none"/>
    <path d="M22 62 C22 48 44 44 62 46 C84 46 100 50 98 62 C96 72 70 74 54 72 C36 72 22 70 22 62 Z" fill="${MARRON}"/>
    <path d="M42 50 L54 70 M58 49 L70 71 M74 50 L86 68" fill="none" stroke="${PAPEL}" stroke-width="3"/>`,

  milanesa: `
    <circle cx="60" cy="62" r="46" fill="${PAPEL}"/>
    <circle cx="60" cy="62" r="34" fill="none" stroke-width="2"/>
    <path d="M30 60 C28 42 52 34 72 38 C92 42 96 62 86 76 C74 88 46 88 36 78 C32 74 30 66 30 60 Z" fill="${DORADO}"/>
    <path d="M44 54 C52 46 70 48 76 56 C74 66 56 70 46 64 Z" fill="${TOMATE}"/>
    <path d="M52 58 C58 54 68 56 70 60 C66 64 58 66 52 62 Z" fill="${LIMON}" stroke-width="2.4"/>
    <circle cx="96" cy="32" r="12" fill="${LIMON}"/>
    <path d="M96 22 V42 M86 32 H106" fill="none" stroke-width="2"/>`,

  ensalada: `
    <path d="M14 58 H106 C104 88 84 102 60 102 C36 102 16 88 14 58 Z" fill="${PAPEL}"/>
    <circle cx="36" cy="46" r="15" fill="${VERDE}"/>
    <circle cx="60" cy="38" r="17" fill="${VERDE}"/>
    <circle cx="84" cy="46" r="15" fill="${VERDE}"/>
    <circle cx="46" cy="52" r="8" fill="${TOMATE}"/>
    <circle cx="74" cy="50" r="8" fill="${TOMATE}"/>
    <circle cx="60" cy="56" r="6" fill="${LIMON}"/>
    <path d="M36 44 C42 40 46 44 50 46 M62 34 C68 36 70 40 72 44" fill="none" stroke-width="2"/>`,

  tarta: `
    <ellipse cx="60" cy="92" rx="46" ry="12" fill="${SIFON}"/>
    <path d="M22 84 L98 84 L98 62 C80 40 40 40 22 62 Z" fill="${DORADO}"/>
    <path d="M22 66 C42 52 78 52 98 66" fill="none"/>
    <circle cx="44" cy="62" r="5" fill="${VERDE}"/>
    <circle cx="62" cy="58" r="5" fill="${TOMATE}"/>
    <circle cx="80" cy="64" r="5" fill="${VERDE}"/>
    <circle cx="56" cy="74" r="4" fill="${LIMON}"/>
    <circle cx="76" cy="76" r="4" fill="${VERDE}"/>`,

  postre: `
    <ellipse cx="60" cy="96" rx="48" ry="10" fill="${SIFON}"/>
    <path d="M32 90 L88 90 L80 48 L40 48 Z" fill="${LIMON}"/>
    <ellipse cx="60" cy="48" rx="20" ry="7" fill="${MARRON}"/>
    <path d="M42 54 C42 66 38 72 36 80 M78 54 C78 64 82 72 84 80" fill="none" stroke="${MARRON}" stroke-width="4"/>
    <circle cx="60" cy="34" r="8" fill="${TOMATE}"/>
    <path d="M60 26 C60 20 66 16 70 16" fill="none" stroke-width="2.4"/>`,

  cafe: `
    <path d="M44 28 C38 20 48 16 42 8 M62 28 C56 20 66 16 60 8" fill="none" stroke-width="2.6"/>
    <path d="M22 44 H88 V68 C88 86 76 96 60 96 H50 C34 96 22 86 22 68 Z" fill="${PAPEL}"/>
    <ellipse cx="55" cy="44" rx="33" ry="7" fill="${MARRON}"/>
    <path d="M88 52 C106 50 106 78 86 78" fill="none"/>
    <ellipse cx="55" cy="104" rx="42" ry="7" fill="${SIFON}"/>`,

  bebida: `
    <path d="M84 8 L72 46" fill="none" stroke="${TOMATE}" stroke-width="5"/>
    <path d="M32 26 H88 L80 100 H40 Z" fill="#F7EE9A"/>
    <rect x="44" y="40" width="20" height="20" rx="4" fill="${PAPEL}" stroke-width="2.4" transform="rotate(-10 54 50)"/>
    <rect x="58" y="56" width="18" height="18" rx="4" fill="${PAPEL}" stroke-width="2.4" transform="rotate(12 67 65)"/>
    <path d="M38 26 C42 14 54 14 56 26 Z" fill="${VERDE}"/>
    <circle cx="94" cy="86" r="14" fill="${LIMON}"/>
    <path d="M94 74 V98 M82 86 H106 M85.5 77.5 L102.5 94.5 M102.5 77.5 L85.5 94.5" fill="none" stroke-width="1.8"/>`,

  vino: `
    <path d="M40 18 H80 C84 52 76 72 60 74 C44 72 36 52 40 18 Z" fill="${PAPEL}"/>
    <path d="M41 36 H79 C80 56 74 70 60 72 C46 70 40 56 41 36 Z" fill="${VINO}"/>
    <path d="M60 74 V98" fill="none"/>
    <ellipse cx="60" cy="102" rx="22" ry="6" fill="${SIFON}"/>
    <path d="M48 26 C48 34 49 40 51 44" fill="none" stroke="${PAPEL}" stroke-width="2.4"/>`,

  plato: `
    <circle cx="60" cy="62" r="40" fill="${PAPEL}"/>
    <circle cx="60" cy="62" r="27" fill="${SIFON}"/>
    <path d="M12 30 V58 M8 30 V44 C8 50 16 50 16 44 V30 M12 58 V96" fill="none"/>
    <path d="M110 30 C102 38 102 54 108 60 V96" fill="none"/>`,
};

// Elige la ilustración según el tipo cargado, o por el nombre del plato, o por la categoría
export function tipoDePlato({ tipo_plato, nombre = '', categoria }) {
  if (tipo_plato && DIBUJOS[tipo_plato]) return tipo_plato;
  const n = nombre.toLowerCase();
  if (/(ñoqui|noqui|fideo|spaghetti|espagueti|pasta|ravio|tallarin|sorrent|lasa)/.test(n)) return 'pasta';
  if (/(bife|parrilla|asado|chorizo|entra[ñn]a|vac[ií]o|costilla|lomo)/.test(n)) return 'parrilla';
  if (/milanesa|suprema|schnitzel/.test(n)) return 'milanesa';
  if (/ensalada/.test(n)) return 'ensalada';
  if (/(tarta|pastel|empanada|pizza)/.test(n)) return 'tarta';
  if (/(flan|postre|helado|torta|brownie|budin|panqueque|tiramis)/.test(n)) return 'postre';
  if (/(vino|malbec|cerveza|copa|fernet|aperitivo)/.test(n)) return 'vino';
  if (/(caf[eé]|cortado|capuch|latte|submarino|t[eé] )/.test(n)) return 'cafe';
  if (/(limonada|agua|jugo|gaseosa|licuado|soda)/.test(n)) return 'bebida';
  if (categoria === 'cafeteria') return 'cafe';
  if (categoria === 'bebida') return 'bebida';
  return 'plato';
}

export const TIPOS_PLATO = [
  ['pasta', 'Pasta'],
  ['parrilla', 'Parrilla'],
  ['milanesa', 'Milanesa'],
  ['ensalada', 'Ensalada'],
  ['tarta', 'Tarta / pizza / empanada'],
  ['postre', 'Postre'],
  ['cafe', 'Café'],
  ['bebida', 'Bebida'],
  ['vino', 'Vino / cerveza'],
  ['plato', 'Otro plato'],
];

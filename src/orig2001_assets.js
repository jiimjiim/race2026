// 公开版本不包含原版《汽车赛 II》的图片素材。
// 以下均为自绘 SVG 占位图，仅用于「BACK TO 2001」复古模式，保证该模式仍可完整游玩。

const uri = (w, h, body) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${body}</svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg).replace(/'/g, '%27');
};

const car = (color, roof = color, glass = '#9fd8ef') => `
  <rect x="4" y="6" width="5" height="8" fill="#141414"/>
  <rect x="23" y="6" width="5" height="8" fill="#141414"/>
  <rect x="4" y="19" width="5" height="8" fill="#141414"/>
  <rect x="23" y="19" width="5" height="8" fill="#141414"/>
  <rect x="9" y="2" width="14" height="28" rx="4" fill="${color}" stroke="#101010"/>
  <rect x="11" y="5" width="10" height="5" fill="${glass}"/>
  <rect x="11" y="22" width="10" height="4" fill="${glass}"/>
  <rect x="11" y="12" width="10" height="9" fill="${roof}"/>
  <rect x="14" y="1" width="4" height="2" fill="#f5e04a"/>
  <rect x="14" y="29" width="4" height="2" fill="#e03030"/>
`;

const gear = (cx, cy, r, teeth, fill) => {
  let s = '';
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const x = cx + Math.cos(a) * (r + 4) - 2;
    const y = cy + Math.sin(a) * (r + 4) - 2;
    s += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="4" height="4" fill="${fill}"/>`;
  }
  return `${s}<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
};

const light = (fill, glow) => `
  <circle cx="16" cy="16" r="13" fill="#2a2a2e" stroke="#000"/>
  <circle cx="16" cy="16" r="9" fill="${fill}" stroke="${glow}"/>
  <circle cx="13" cy="13" r="3" fill="#fff" opacity="0.7"/>
`;

export const ORIG_ASSETS = {
  bgFull: (() => {
    let chk = '';
    for (let x = 0; x < 548; x += 20) {
      chk += `<rect x="${x}" y="0" width="10" height="10" fill="${(x / 20) % 2 ? '#1a1a1e' : '#e8e6df'}"/>`;
      chk += `<rect x="${x}" y="10" width="10" height="10" fill="${(x / 20) % 2 ? '#e8e6df' : '#1a1a1e'}"/>`;
    }
    let road = '';
    for (let x = 8; x < 548; x += 48) road += `<rect x="${x}" y="351" width="24" height="3" fill="#5a5a60"/>`;
    return uri(548, 371, `
      <rect width="548" height="371" fill="#0f6666"/>
      <g stroke="#0c5555" stroke-width="1">
        ${Array.from({ length: 12 }, (_, i) => `<line x1="0" y1="${i * 32}" x2="548" y2="${i * 32}"/>`).join('')}
        ${Array.from({ length: 18 }, (_, i) => `<line x1="${i * 32}" y1="0" x2="${i * 32}" y2="371"/>`).join('')}
      </g>
      <rect y="334" width="548" height="37" fill="#1a1a1e"/>
      <rect y="334" width="548" height="2" fill="#3a3a40"/>
      ${road}
      ${chk}
    `);
  })(),

  logo: uri(100, 40, `
    <rect width="100" height="40" fill="#101014"/>
    <rect x="3" y="3" width="94" height="34" fill="none" stroke="#c8a020"/>
    <text x="50" y="21" text-anchor="middle" font-family="monospace" font-size="15" font-weight="bold" fill="#f0d048" letter-spacing="1">MAIZE</text>
    <text x="50" y="32" text-anchor="middle" font-family="monospace" font-size="8" fill="#e8e6df" letter-spacing="3">2001</text>
  `),

  maize: uri(72, 19, `
    <path d="M14 19 L26 9 L22 19 Z" fill="#2f8a3c"/>
    <path d="M58 19 L46 9 L50 19 Z" fill="#2f8a3c"/>
    <rect x="24" y="3" width="24" height="16" rx="7" fill="#e8b830" stroke="#8a6410"/>
    <g fill="#f5d860">
      <rect x="28" y="7" width="3" height="3"/><rect x="34" y="7" width="3" height="3"/><rect x="40" y="7" width="3" height="3"/>
      <rect x="25" y="11" width="3" height="3"/><rect x="31" y="11" width="3" height="3"/><rect x="37" y="11" width="3" height="3"/><rect x="43" y="11" width="3" height="3"/>
      <rect x="28" y="15" width="3" height="3"/><rect x="34" y="15" width="3" height="3"/><rect x="40" y="15" width="3" height="3"/>
    </g>
  `),

  hazard: (() => {
    let s = '';
    for (let x = -10; x < 350; x += 20) s += `<path d="M${x} 10 L${x + 10} 0 L${x + 20} 0 L${x + 10} 10 Z" fill="#f0e8d0"/>`;
    return uri(340, 10, `<rect width="340" height="10" fill="#d02020"/>${s}`);
  })(),

  aboutCar: uri(64, 64, `<g transform="scale(2)">${car('#2b5cb0', '#1d4180')}</g>`),
  shopCar: uri(64, 64, `<g transform="scale(2)">${car('#2b5cb0', '#1d4180')}</g>`),

  iconInfo: uri(32, 32, `
    <rect width="32" height="32" fill="#000080"/>
    <circle cx="16" cy="16" r="11" fill="#e8e6df"/>
    <rect x="14" y="8" width="4" height="4" fill="#000080"/>
    <rect x="14" y="14" width="4" height="11" fill="#000080"/>
  `),

  iconFactory: uri(32, 32, `
    <rect width="32" height="32" fill="#c0c0c0"/>
    ${gear(16, 16, 8, 8, '#606060')}
    <circle cx="16" cy="16" r="4" fill="#c0c0c0"/>
    <circle cx="16" cy="16" r="2" fill="#303030"/>
  `),

  iconShop: uri(32, 32, `
    <path d="M10 12 a6 6 0 0 1 12 0" fill="none" stroke="#5a4a10" stroke-width="2"/>
    <rect x="7" y="12" width="18" height="16" fill="#c8a020" stroke="#5a4a10"/>
    <text x="16" y="25" text-anchor="middle" font-family="monospace" font-size="12" font-weight="bold" fill="#fff">¥</text>
  `),

  iconEngine: uri(48, 48, `
    <rect x="6" y="14" width="36" height="24" fill="#8a8d94" stroke="#303030"/>
    <g fill="#c9ccd2" stroke="#303030">
      <rect x="10" y="8" width="6" height="10"/><rect x="19" y="8" width="6" height="10"/>
      <rect x="28" y="8" width="6" height="10"/><rect x="37" y="8" width="5" height="10"/>
    </g>
    <rect x="10" y="30" width="28" height="4" fill="#303030"/>
    <rect x="4" y="20" width="4" height="8" fill="#606060"/>
  `),

  iconTire: (() => {
    let ticks = '';
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      ticks += `<rect x="${23 + Math.cos(a) * 20 - 2}" y="${23 + Math.sin(a) * 20 - 2}" width="4" height="4" fill="#101010" transform="rotate(${(i * 30).toFixed(0)} ${23 + Math.cos(a) * 20} ${23 + Math.sin(a) * 20})"/>`;
    }
    return uri(48, 48, `
      <circle cx="24" cy="24" r="21" fill="#1a1a1a" stroke="#000"/>
      ${ticks}
      <circle cx="24" cy="24" r="11" fill="#a8adb5" stroke="#303030"/>
      <circle cx="24" cy="24" r="4" fill="#2b3b66"/>
      <circle cx="20" cy="20" r="2" fill="#e8e8e8"/>
    `);
  })(),

  iconFuel: uri(32, 32, `
    <rect x="8" y="8" width="14" height="21" fill="#c03028" stroke="#501008"/>
    <rect x="10" y="11" width="10" height="6" fill="#e88078"/>
    <rect x="11" y="4" width="8" height="4" fill="#501008"/>
    <rect x="22" y="10" width="3" height="12" fill="#501008"/>
    <rect x="24" y="20" width="4" height="3" fill="#501008"/>
  `),

  iconAcc: uri(48, 48, `
    <path d="M28 4 L12 27 L22 27 L18 44 L36 20 L26 20 Z" fill="#8a4fd0" stroke="#3a1a60"/>
    <circle cx="24" cy="24" r="20" fill="none" stroke="#c9a0f0" stroke-width="2"/>
  `),

  iconCheck: uri(48, 48, `
    <path d="M10 26 L20 36 L38 12" fill="none" stroke="#1a7a34" stroke-width="7" stroke-linecap="square"/>
  `),

  arrowLeft: uri(32, 32, `
    <rect width="32" height="32" fill="#c0c0c0"/>
    <path d="M22 6 L10 16 L22 26 Z" fill="#202020" stroke="#fff"/>
  `),

  warn: uri(32, 32, `
    <path d="M16 3 L30 28 L2 28 Z" fill="#f0d020" stroke="#000"/>
    <rect x="14" y="11" width="4" height="9" fill="#101010"/>
    <rect x="14" y="22" width="4" height="4" fill="#101010"/>
  `),

  kmh: uri(32, 32, `
    <circle cx="16" cy="16" r="14" fill="#c9ccd2" stroke="#303030"/>
    <circle cx="16" cy="16" r="10" fill="#1a1e26"/>
    <path d="M16 16 L23 8" stroke="#e03030" stroke-width="2"/>
    <circle cx="16" cy="16" r="2" fill="#e8e6df"/>
    <text x="16" y="27" text-anchor="middle" font-family="monospace" font-size="6" fill="#e8e6df">km/h</text>
  `),

  redLight: uri(32, 32, light('#c02020', '#701010')),
  greenGo: uri(32, 32, light('#20a040', '#0a6020')),

  car1: uri(32, 32, car('#1a1a1e')),
  car2: uri(32, 32, car('#2b5cb0', '#1d4180')),
  car3: uri(32, 32, car('#2f8a3c', '#1f6028')),
  car4: uri(32, 32, car('#e07820', '#a85410')),
  car5: uri(32, 32, car('#6a3fa0', '#4a2a74')),
  car6: uri(32, 32, car('#e0ded6', '#b8b6ae')),
  car7: uri(32, 32, car('#e8c020', '#b08c10')),
  car11: uri(32, 32, car('#f0d8c0', '#d090a0')),
  car12: uri(32, 32, car('#8a8d94', '#5a5d64')),
  car15: uri(32, 32, `
    <ellipse cx="16" cy="16" rx="9" ry="14" fill="#20c8c0" stroke="#0a6060"/>
    <ellipse cx="16" cy="16" rx="4" ry="9" fill="#9ff0ec"/>
    <rect x="12" y="1" width="8" height="3" rx="1" fill="#e8e6df"/>
    <rect x="12" y="28" width="8" height="3" rx="1" fill="#e8e6df"/>
  `),
};

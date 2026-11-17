import { BoxGeometry, CanvasTexture, ConeGeometry, CylinderGeometry, Group, Mesh, MeshStandardMaterial, NearestFilter, SRGBColorSpace, SphereGeometry, TorusGeometry } from 'three';
import { buildWheel } from './wheel.js';

const MAT_CACHE = new Map();
const TEX_CACHE = new Map();

function mat(key, opts) {
  if (!MAT_CACHE.has(key)) {
    const m = new MeshStandardMaterial({ flatShading: true, ...opts });
    m.userData.shared = true;
    MAT_CACHE.set(key, m);
  }
  return MAT_CACHE.get(key);
}

function labelTex(key, w, h, draw) {
  if (TEX_CACHE.has(key)) return TEX_CACHE.get(key);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  draw(ctx, w, h);
  const t = new CanvasTexture(c);
  t.magFilter = NearestFilter;
  t.minFilter = NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = SRGBColorSpace;
  t.userData.shared = true;
  TEX_CACHE.set(key, t);
  return t;
}

function makeBadgeMat(key, bg, fg, text, sub = '', border = null) {
  const tex = labelTex(`lbl:${key}`, 64, 32, (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    if (border) {
      ctx.fillStyle = border;
      ctx.fillRect(0, 0, w, 3);
      ctx.fillRect(0, h - 3, w, 3);
      ctx.fillRect(0, 0, 3, h);
      ctx.fillRect(w - 3, 0, 3, h);
    }
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = sub ? 'bold 13px monospace' : 'bold 16px monospace';
    ctx.fillText(text, w / 2, sub ? 12 : h / 2);
    if (sub) {
      ctx.font = 'bold 8px monospace';
      ctx.fillText(sub, w / 2, 24);
    }
  });
  return mat(`bmat:${key}`, { map: tex, roughness: 0.48, metalness: 0.1 });
}

function addBox(g, w, h, d, x, y, z, m, rx = 0, ry = 0, rz = 0) {
  const mesh = new Mesh(new BoxGeometry(w, h, d), m);
  mesh.position.set(x, y, z);
  if (rx || ry || rz) mesh.rotation.set(rx, ry, rz);
  g.add(mesh);
  return mesh;
}

function addCyl(g, rt, rb, h, x, y, z, m, axis = 'y', seg = 12, rx = 0, ry = 0, rz = 0) {
  const mesh = new Mesh(new CylinderGeometry(rt, rb, h, seg), m);
  mesh.position.set(x, y, z);
  if (axis === 'x') mesh.rotation.z = Math.PI / 2;
  else if (axis === 'z') mesh.rotation.x = Math.PI / 2;
  if (rx || ry || rz) mesh.rotation.set(rx, ry, rz);
  g.add(mesh);
  return mesh;
}

function addTorus(g, r, tube, x, y, z, m, rx = 0, ry = 0, rz = 0, arc = Math.PI * 2) {
  const mesh = new Mesh(new TorusGeometry(r, tube, 8, 18, arc), m);
  mesh.position.set(x, y, z);
  if (rx || ry || rz) mesh.rotation.set(rx, ry, rz);
  g.add(mesh);
  return mesh;
}

// Shared Workshop Material Palette
const P = {
  cast: () => mat('p:cast', { color: 0x626a73, roughness: 0.65, metalness: 0.6 }),
  alloy: () => mat('p:alloy', { color: 0xb6bec6, roughness: 0.34, metalness: 0.78 }),
  chrome: () => mat('p:chrome', { color: 0xe6ebef, roughness: 0.15, metalness: 0.92 }),
  dark: () => mat('p:dark', { color: 0x202429, roughness: 0.55, metalness: 0.45 }),
  black: () => mat('p:black', { color: 0x15171a, roughness: 0.65, metalness: 0.2 }),
  rubber: () => mat('p:rubber', { color: 0x1a1c1e, roughness: 0.9, metalness: 0.05 }),
  carbon: () => mat('p:carbon', { color: 0x282d33, roughness: 0.34, metalness: 0.38 }),
  red: () => mat('p:red', { color: 0xc92620, roughness: 0.4, metalness: 0.3 }),
  crimson: () => mat('p:crimson', { color: 0x9b1815, roughness: 0.42, metalness: 0.35 }),
  blue: () => mat('p:blue', { color: 0x2268c8, roughness: 0.38, metalness: 0.38 }),
  ice: () => mat('p:ice', { color: 0x39b6e6, roughness: 0.3, metalness: 0.45 }),
  cyanGlow: () => mat('p:cyang', { color: 0x52e6ff, emissive: 0x127a96, roughness: 0.25, metalness: 0.2 }),
  orangeHV: () => mat('p:hv', { color: 0xe86c1a, roughness: 0.42, metalness: 0.15 }),
  gold: () => mat('p:gold', { color: 0xd4a634, roughness: 0.3, metalness: 0.78 }),
  copper: () => mat('p:copper', { color: 0xb86832, roughness: 0.34, metalness: 0.76 }),
  yellow: () => mat('p:yellow', { color: 0xe6bf28, roughness: 0.38, metalness: 0.28 }),
  green: () => mat('p:green', { color: 0x2e8848, roughness: 0.48, metalness: 0.2 }),
  teal: () => mat('p:teal', { color: 0x26928c, roughness: 0.42, metalness: 0.32 }),
  ceramic: () => mat('p:ceramic', { color: 0xf0ede6, roughness: 0.35, metalness: 0.06 }),
  dieselGreen: () => mat('p:dgreen', { color: 0x455848, roughness: 0.62, metalness: 0.38 }),
  wood: () => mat('p:wood', { color: 0x94683b, roughness: 0.85, metalness: 0.04 }),
  glass: () => mat('p:glass', { color: 0xd9ecff, roughness: 0.15, metalness: 0.15, transparent: true, opacity: 0.55 }),
  amberOil: () => mat('p:amberoil', { color: 0xd99b26, roughness: 0.22, metalness: 0.08, transparent: true, opacity: 0.84 }),
  stand: () => mat('p:stand', { color: 0x2c3138, roughness: 0.52, metalness: 0.55 }),
};

function addEngineStand(g, width = 0.82, length = 0.96, woodPallet = false) {
  if (woodPallet) {
    for (const z of [-0.32, 0, 0.32]) addBox(g, length, 0.045, 0.12, 0, 0.025, z, P.wood());
    for (const x of [-0.36, 0.36]) addBox(g, 0.08, 0.05, width, x, 0.07, 0, P.wood());
    return 0.08;
  }
  addBox(g, length, 0.05, width, 0, 0.025, 0, P.stand());
  addBox(g, length * 0.92, 0.03, width * 0.92, 0, 0.06, 0, P.dark());
  for (const sx of [-0.22, 0.22]) {
    addBox(g, 0.08, 0.19, 0.26, sx, 0.16, 0, P.alloy());
    addBox(g, 0.11, 0.04, 0.32, sx, 0.25, 0, P.dark());
  }
  return 0.18;
}

// ═══════════════════════════════════════════════════════
//  ENGINES (All 40 IDs individually sculpted)
// ═══════════════════════════════════════════════════════

function buildInlineEngine(cfg) {
  const {
    cyls = 4,
    coverColor = P.alloy(),
    blockMat = P.cast(),
    badge = null,
    turbo = false,
    twinTurbo = false,
    superDiesel = false,
    itb = false,
    redCoils = false,
    mStripes = false,
    anodizedPipe = null,
    slant = 0,
    woodPallet = false,
    coverStyle = 'ribbed',
  } = cfg;

  const g = new Group();
  const baseY = addEngineStand(g, 0.78, cyls >= 6 ? 1.18 : 0.94, woodPallet);
  const len = cyls === 3 ? 0.54 : cyls === 4 ? 0.72 : 1.02;

  const eng = new Group();
  eng.position.y = baseY + 0.22;
  if (slant) eng.rotation.x = slant;
  g.add(eng);

  // Sump & Crankcase
  addBox(eng, len * 0.92, 0.12, 0.38, 0, -0.14, 0, P.dark());
  addBox(eng, len, 0.30, 0.40, 0, 0.06, 0, blockMat);
  for (let i = 0; i < cyls; i++) {
    const cx = -len * 0.36 + (i / Math.max(1, cyls - 1)) * len * 0.72;
    addBox(eng, 0.03, 0.26, 0.43, cx, 0.05, 0, P.dark());
  }

  // Cylinder Head + Valve Cover
  addBox(eng, len * 1.02, 0.12, 0.42, 0, 0.27, 0, P.alloy());
  addBox(eng, len * 0.96, 0.11, 0.32, 0, 0.38, 0, coverColor);
  if (coverStyle === 'ribbed') {
    for (let z of [-0.08, 0, 0.08]) addBox(eng, len * 0.88, 0.025, 0.03, 0, 0.445, z, P.chrome());
  } else if (coverStyle === 'stepped') {
    addBox(eng, len * 0.86, 0.04, 0.20, 0, 0.45, -0.02, P.dark());
  } else if (coverStyle === 'smooth') {
    addBox(eng, len * 0.88, 0.03, 0.26, 0, 0.44, 0, coverColor);
  }

  if (mStripes) {
    addBox(eng, len * 0.72, 0.022, 0.035, 0, 0.45, -0.05, P.ice());
    addBox(eng, len * 0.72, 0.022, 0.035, 0, 0.45, 0, P.blue());
    addBox(eng, len * 0.72, 0.022, 0.035, 0, 0.45, 0.05, P.red());
  }

  if (badge) {
    const bm = makeBadgeMat(badge.key, badge.bg, badge.fg, badge.text, badge.sub || '', badge.border || null);
    addBox(eng, 0.34, 0.02, 0.14, 0, 0.455, 0, bm);
  }

  // Oil filler cap
  addCyl(eng, 0.045, 0.045, 0.045, len * 0.36, 0.455, 0.08, redCoils ? P.yellow() : P.gold(), 'y', 10);

  // Ignition coils
  for (let i = 0; i < cyls; i++) {
    const cx = -len * 0.36 + (i / Math.max(1, cyls - 1)) * len * 0.72;
    addCyl(eng, 0.024, 0.024, 0.06, cx, 0.445, 0.0, redCoils ? P.red() : P.dark(), 'y', 8);
  }

  // Front timing cover, pulleys & serpentine belt
  addBox(eng, 0.05, 0.42, 0.34, len * 0.51, 0.14, 0, P.dark());
  addCyl(eng, 0.11, 0.11, 0.04, len * 0.55, -0.02, 0, P.dark(), 'x', 14);
  addCyl(eng, 0.075, 0.075, 0.04, len * 0.55, 0.34, -0.07, P.alloy(), 'x', 12);
  addCyl(eng, 0.075, 0.075, 0.04, len * 0.55, 0.34, 0.07, P.alloy(), 'x', 12);
  addCyl(eng, 0.055, 0.055, 0.04, len * 0.55, 0.16, 0.12, P.chrome(), 'x', 10);

  // Rear flywheel & bellhousing ring
  addCyl(eng, 0.17, 0.17, 0.05, -len * 0.53, 0.02, 0, P.cast(), 'x', 16);

  // Intake side (+Z)
  if (itb) {
    // 6 Individual Throttle Bodies + Carbon Airbox
    for (let i = 0; i < cyls; i++) {
      const cx = -len * 0.36 + (i / Math.max(1, cyls - 1)) * len * 0.72;
      addCyl(eng, 0.032, 0.036, 0.18, cx, 0.31, 0.25, P.gold(), 'z', 10);
      addCyl(eng, 0.042, 0.034, 0.05, cx, 0.31, 0.35, P.chrome(), 'z', 10);
    }
    addBox(eng, len * 0.88, 0.14, 0.14, 0, 0.34, 0.40, P.carbon());
  } else if (superDiesel) {
    // Mechanical inline diesel injection pump + round steel oil-bath air cleaner
    addBox(eng, len * 0.52, 0.15, 0.12, -0.05, 0.10, 0.26, P.cast());
    for (let i = 0; i < cyls; i++) {
      const cx = -len * 0.30 + (i / Math.max(1, cyls - 1)) * len * 0.60;
      addCyl(eng, 0.01, 0.01, 0.24, cx, 0.22, 0.22, P.chrome(), 'y', 6);
    }
    addCyl(eng, 0.14, 0.14, 0.16, 0.05, 0.42, 0.24, P.dieselGreen(), 'y', 14);
    addCyl(eng, 0.04, 0.04, 0.22, 0.18, 0.42, 0.24, P.dark(), 'x', 8);
  } else {
    addBox(eng, len * 0.84, 0.12, 0.14, 0, 0.25, 0.30, P.black());
    for (let i = 0; i < cyls; i++) {
      const cx = -len * 0.34 + (i / Math.max(1, cyls - 1)) * len * 0.68;
      addCyl(eng, 0.03, 0.03, 0.14, cx, 0.27, 0.21, P.black(), 'z', 8);
    }
    addCyl(eng, 0.055, 0.055, 0.16, len * 0.38, 0.28, 0.30, P.alloy(), 'x', 10);
  }

  // Exhaust side (-Z): headers + optional turbo(s)
  for (let i = 0; i < cyls; i++) {
    const cx = -len * 0.34 + (i / Math.max(1, cyls - 1)) * len * 0.68;
    addCyl(eng, 0.026, 0.026, 0.22, cx, 0.24, -0.25, P.copper(), 'z', 8, 0.35, 0, 0);
  }

  if (twinTurbo) {
    for (const tx of [-len * 0.22, len * 0.22]) {
      addTorus(eng, 0.085, 0.034, tx, 0.20, -0.36, P.chrome(), 0, Math.PI / 2, 0);
      addTorus(eng, 0.075, 0.03, tx + 0.08, 0.20, -0.36, P.copper(), 0, Math.PI / 2, 0);
      addCyl(eng, 0.035, 0.035, 0.26, tx, 0.34, -0.32, anodizedPipe || P.alloy(), 'y', 8);
    }
  } else if (turbo) {
    addTorus(eng, 0.105, 0.042, 0.0, 0.22, -0.36, P.chrome(), 0, Math.PI / 2, 0);
    addTorus(eng, 0.09, 0.036, 0.10, 0.22, -0.36, P.copper(), 0, Math.PI / 2, 0);
    addCyl(eng, 0.042, 0.042, 0.32, -0.02, 0.36, -0.28, anodizedPipe || P.alloy(), 'z', 8);
    addCyl(eng, 0.045, 0.045, 0.18, 0.24, 0.22, -0.36, P.red(), 'x', 10); // wastegate actuator
  } else {
    addBox(eng, len * 0.78, 0.06, 0.08, 0, 0.18, -0.34, P.cast());
    addCyl(eng, 0.045, 0.045, 0.24, -len * 0.38, 0.10, -0.34, P.cast(), 'x', 10);
  }
  return g;
}

function buildVEngine(cfg) {
  const {
    cylsPerBank = 4,
    angle = 0.68,
    coverColor = P.red(),
    badge,
    hotV = false,
    twinTurbo = false,
    trumpets = false,
  } = cfg;

  const g = new Group();
  const baseY = addEngineStand(g, 0.92, 1.06, false);
  const eng = new Group();
  eng.position.y = baseY + 0.26;
  g.add(eng);

  const len = cylsPerBank === 3 ? 0.68 : 0.84;
  // Crankcase & oil sump
  addBox(eng, len * 0.96, 0.22, 0.36, 0, -0.06, 0, P.cast());
  addBox(eng, len * 0.90, 0.10, 0.34, 0, -0.20, 0, P.dark());

  // Two angled V cylinder banks
  for (const s of [1, -1]) {
    const bank = new Group();
    bank.rotation.x = s * angle;
    bank.position.set(0, 0.08, s * 0.08);
    addBox(bank, len, 0.24, 0.24, 0, 0.12, 0, P.alloy());
    addBox(bank, len * 0.96, 0.10, 0.25, 0, 0.28, 0, coverColor);
    for (let i = 0; i < cylsPerBank; i++) {
      const cx = -len * 0.35 + (i / Math.max(1, cylsPerBank - 1)) * len * 0.70;
      addCyl(bank, 0.025, 0.025, 0.18, cx, 0.16, s * 0.16, P.copper(), 'z', 8);
    }
    eng.add(bank);
  }

  // Front pulleys
  addCyl(eng, 0.11, 0.11, 0.04, len * 0.52, -0.05, 0, P.dark(), 'x', 14);
  for (const s of [1, -1]) addCyl(eng, 0.075, 0.075, 0.04, len * 0.52, 0.24, s * 0.22, P.alloy(), 'x', 12);

  if (hotV) {
    // Hot-V Twin Turbos nestled in the valley (Mercedes M178!)
    for (const tx of [-0.14, 0.16]) {
      addTorus(eng, 0.085, 0.035, tx, 0.30, 0, P.chrome(), 0, Math.PI / 2, 0);
      addTorus(eng, 0.075, 0.03, tx + 0.08, 0.30, 0, P.copper(), 0, Math.PI / 2, 0);
    }
    const bm = makeBadgeMat(badge.key, badge.bg, badge.fg, badge.text, badge.sub || '');
    addBox(eng, 0.28, 0.03, 0.20, 0.18, 0.42, 0, bm);
  } else if (twinTurbo) {
    // VR38DETT red twin plenums + outer twin turbos
    for (const s of [1, -1]) {
      addBox(eng, len * 0.80, 0.10, 0.16, 0, 0.42, s * 0.12, coverColor);
      addTorus(eng, 0.095, 0.038, -0.05, 0.16, s * 0.38, P.chrome(), 0, Math.PI / 2, 0);
      addCyl(eng, 0.038, 0.038, 0.28, 0.12, 0.30, s * 0.34, P.chrome(), 'y', 8);
    }
    const bm = makeBadgeMat(badge.key, badge.bg, badge.fg, badge.text, badge.sub || '');
    addBox(eng, 0.24, 0.025, 0.14, 0, 0.48, 0, bm);
  } else if (trumpets) {
    // Ferrari F136 center crinkle-red plenum & 8 aluminum runners
    addBox(eng, len * 0.82, 0.14, 0.28, 0, 0.42, 0, coverColor);
    for (let i = 0; i < 4; i++) {
      const cx = -len * 0.32 + i * (len * 0.21);
      addCyl(eng, 0.028, 0.032, 0.18, cx, 0.34, 0.16, P.chrome(), 'z', 8);
      addCyl(eng, 0.028, 0.032, 0.18, cx, 0.34, -0.16, P.chrome(), 'z', 8);
    }
    const bm = makeBadgeMat(badge.key, badge.bg, badge.fg, badge.text, badge.sub || '');
    addBox(eng, 0.38, 0.025, 0.14, 0, 0.50, 0, bm);
  }
  return g;
}

function buildHybridUnit(cfg) {
  const { cyls = 4, coverColor = P.alloy(), motorColor = P.teal(), badge, split = 'inline' } = cfg;
  const g = new Group();
  const baseY = addEngineStand(g, 0.88, 1.12, false);
  const eng = new Group();
  eng.position.y = baseY + 0.20;
  g.add(eng);

  const len = cyls === 3 ? 0.44 : 0.56;
  // Compact ICE section on +X side
  addBox(eng, len, 0.28, 0.34, 0.22, 0.08, 0, P.cast());
  addBox(eng, len * 0.94, 0.10, 0.28, 0.22, 0.28, 0, coverColor);
  for (let i = 0; i < cyls; i++) {
    const cx = 0.04 + (i / Math.max(1, cyls - 1)) * (len * 0.68);
    addCyl(eng, 0.022, 0.022, 0.14, cx, 0.22, 0.22, P.black(), 'z', 8);
  }

  // Coaxial / Transaxle Electric Motor on -X side
  if (split === 'ths') {
    // Cutaway planetary e-CVT + inverter box on top
    addCyl(eng, 0.19, 0.19, 0.34, -0.24, 0.08, 0, P.alloy(), 'x', 14);
    addCyl(eng, 0.14, 0.14, 0.14, -0.44, 0.08, 0, motorColor, 'x', 12);
    addBox(eng, 0.32, 0.10, 0.28, -0.22, 0.32, 0, P.alloy());
    addBox(eng, 0.24, 0.02, 0.16, -0.22, 0.38, 0, makeBadgeMat(badge.key, badge.bg, badge.fg, badge.text, badge.sub || ''));
  } else {
    addCyl(eng, 0.20, 0.20, 0.32, -0.24, 0.10, 0, motorColor, 'x', 14);
    for (let i = -2; i <= 2; i++) addTorus(eng, 0.205, 0.012, -0.24 + i * 0.055, 0.10, 0, P.dark(), 0, Math.PI / 2, 0);
    addBox(eng, 0.26, 0.08, 0.24, -0.24, 0.33, 0, P.dark());
    addBox(eng, 0.24, 0.02, 0.16, 0.22, 0.34, 0, makeBadgeMat(badge.key, badge.bg, badge.fg, badge.text, badge.sub || ''));
  }

  // Signature Orange High-Voltage Busbar Cables
  addCyl(eng, 0.02, 0.02, 0.34, -0.02, 0.26, -0.18, P.orangeHV(), 'x', 8);
  addCyl(eng, 0.02, 0.02, 0.28, -0.24, 0.22, 0.16, P.orangeHV(), 'y', 8);
  return g;
}

function buildElectricUnit(cfg) {
  const { variant = 'single', color = P.alloy(), accent = P.red(), badge } = cfg;
  const g = new Group();
  const baseY = addEngineStand(g, 0.90, 1.08, false);
  const y0 = baseY + 0.22;

  if (variant === 'quad_zeekr') {
    // Zeekr 001 FR — Carbon H-Subframe + 4 Inboard Wheel-Side Traction Motors + Ice Blue Halo Coils
    addBox(g, 0.72, 0.06, 0.08, 0, y0, 0, P.dark());
    addBox(g, 0.08, 0.06, 0.64, 0.34, y0, 0, P.dark());
    addBox(g, 0.08, 0.06, 0.64, -0.34, y0, 0, P.dark());
    for (const [mx, mz] of [[-0.34, -0.28], [-0.34, 0.28], [0.34, -0.28], [0.34, 0.28]]) {
      addCyl(g, 0.125, 0.125, 0.18, mx, y0 + 0.04, mz, P.carbon(), 'z', 14);
      addCyl(g, 0.05, 0.05, 0.24, mx, y0 + 0.04, mz, P.chrome(), 'z', 10);
      addTorus(g, 0.13, 0.014, mx, y0 + 0.04, mz, P.ice());
    }
    addBox(g, 0.28, 0.10, 0.24, 0, y0 + 0.11, 0, P.alloy());
    addBox(g, 0.24, 0.02, 0.18, 0, y0 + 0.17, 0, makeBadgeMat(badge.key, badge.bg, badge.fg, badge.text, badge.sub || ''));
    return g;
  }

  if (variant === 'quad_yisifang') {
    // BYD YiSiFang (易四方) — Gold Torque-Vectoring Spine + Twin Symmetrical E-Axle Bridges + 4 Gold-Capped Hub Motors + Armored Orange HV Conduits
    addBox(g, 0.86, 0.08, 0.14, 0, y0 + 0.02, 0, P.gold());
    for (const ax of [-0.30, 0.30]) {
      addBox(g, 0.22, 0.16, 0.42, ax, y0 + 0.06, 0, P.cast());
      addBox(g, 0.18, 0.05, 0.38, ax, y0 + 0.16, 0, P.gold());
      addCyl(g, 0.032, 0.032, 0.64, ax, y0 + 0.03, 0, P.chrome(), 'z', 10);
      for (const sz of [-0.34, 0.34]) {
        // Wheel-hub permanent magnet motor drum + gold endbell + copper stator band
        addCyl(g, 0.135, 0.135, 0.16, ax, y0 + 0.03, sz, P.alloy(), 'z', 14);
        addCyl(g, 0.14, 0.14, 0.04, ax, y0 + 0.03, sz * 1.15, P.gold(), 'z', 14);
        addTorus(g, 0.14, 0.016, ax, y0 + 0.03, sz, P.copper());
        addCyl(g, 0.018, 0.018, 0.18, ax, y0 + 0.14, sz * 0.62, P.orangeHV(), 'z', 8);
      }
    }
    addBox(g, 0.30, 0.12, 0.26, 0, y0 + 0.14, 0, P.dark());
    addBox(g, 0.26, 0.02, 0.20, 0, y0 + 0.21, 0, makeBadgeMat(badge.key, badge.bg, badge.fg, badge.text, badge.sub || ''));
    return g;
  }

  if (variant === 'tri_nio900') {
    // NIO Shenji 900V Tri-Motor — True 1+2 Asymmetric Architecture! (1 Front Coaxial Induction Motor + 2 Rear Dual Coaxial 900V SiC Motors + Tall NX-Compute Tower)
    // Front single coaxial motor + subframe yoke
    addCyl(g, 0.15, 0.15, 0.34, 0.34, y0 + 0.02, 0, P.alloy(), 'z', 14);
    addCyl(g, 0.045, 0.045, 0.56, 0.34, y0 + 0.02, 0, P.chrome(), 'z', 10);
    // Rear heavy dual-motor coaxial twin-barrel traction pack
    for (const sz of [-0.18, 0.18]) {
      addCyl(g, 0.19, 0.19, 0.28, -0.24, y0 + 0.06, sz, P.dark(), 'z', 16);
      addTorus(g, 0.195, 0.016, -0.24, y0 + 0.06, sz, P.cyanGlow());
    }
    addBox(g, 0.26, 0.22, 0.58, -0.24, y0 + 0.06, 0, P.carbon());
    // Dual cryogenic 900V silver busbars linking front motor to rear dual axle
    for (const sz of [-0.09, 0.09]) addBox(g, 0.54, 0.04, 0.04, 0.06, y0 + 0.08, sz, P.ice());
    // Raised 900V SiC + Shenji Compute Liquid-Cooled Finned Tower on rear pack
    addBox(g, 0.28, 0.18, 0.38, -0.20, y0 + 0.27, 0, P.alloy());
    for (let i = -2; i <= 2; i++) addBox(g, 0.30, 0.025, 0.03, -0.20, y0 + 0.37, i * 0.068, P.cyanGlow());
    addBox(g, 0.24, 0.02, 0.32, -0.20, y0 + 0.39, 0, makeBadgeMat(badge.key, badge.bg, badge.fg, badge.text, badge.sub || ''));
    return g;
  }

  if (variant === 'v8s') {
    // Xiaomi HyperEngine V8s — Lightning Yellow finned billet + copper hairpin + cyan cooling ports
    addCyl(g, 0.24, 0.24, 0.56, 0, y0 + 0.04, 0, P.yellow(), 'x', 16);
    for (let i = -3; i <= 3; i++) {
      addTorus(g, 0.255, 0.016, i * 0.072, y0 + 0.04, 0, P.dark(), 0, Math.PI / 2, 0);
    }
    // Cutaway end showing copper stator windings
    addCyl(g, 0.19, 0.19, 0.08, 0.29, y0 + 0.04, 0, P.copper(), 'x', 16);
    addCyl(g, 0.06, 0.06, 0.68, 0, y0 + 0.04, 0, P.chrome(), 'x', 12);
    // Top SiC Inverter + Cyan Cooling Ports
    addBox(g, 0.42, 0.11, 0.34, -0.02, y0 + 0.30, 0, P.carbon());
    addBox(g, 0.34, 0.02, 0.20, -0.02, y0 + 0.365, 0, makeBadgeMat(badge.key, badge.bg, badge.fg, badge.text, badge.sub || ''));
    addCyl(g, 0.025, 0.025, 0.12, 0.20, y0 + 0.26, 0.18, P.cyanGlow(), 'z', 8);
    addCyl(g, 0.025, 0.025, 0.12, 0.20, y0 + 0.26, -0.18, P.cyanGlow(), 'z', 8);
    return g;
  }

  if (variant === 'roadster') {
    // SpaceX Cold-Gas Drive: Traction motor + Twin Titanium COPV Spheres + 3 Cold-Gas Thrusters
    addCyl(g, 0.19, 0.19, 0.44, 0.08, y0 + 0.02, 0, P.dark(), 'x', 14);
    for (const z of [-0.26, 0.26]) {
      const copv = new Mesh(new SphereGeometry(0.145, 14, 10), P.carbon());
      copv.position.set(-0.08, y0 + 0.08, z);
      g.add(copv);
      addTorus(g, 0.148, 0.012, -0.08, y0 + 0.08, z, P.ice(), Math.PI / 2, 0, 0);
    }
    // Triple cold-gas nozzles pointing rear-upward (-X)
    for (const [nx, ny, nz] of [[-0.36, y0 + 0.14, 0], [-0.36, y0 + 0.02, -0.12], [-0.36, y0 + 0.02, 0.12]]) {
      addCyl(g, 0.055, 0.028, 0.16, nx, ny, nz, P.chrome(), 'x', 10);
      addCyl(g, 0.042, 0.042, 0.03, nx - 0.075, ny, nz, P.cyanGlow(), 'x', 10);
    }
    addBox(g, 0.30, 0.09, 0.26, 0.08, y0 + 0.24, 0, P.alloy());
    addBox(g, 0.24, 0.02, 0.18, 0.08, y0 + 0.295, 0, makeBadgeMat(badge.key, badge.bg, badge.fg, badge.text, badge.sub || ''));
    return g;
  }

  // Tesla Model S / Model X / P100D drive units
  addCyl(g, 0.21, 0.21, 0.50, -0.04, y0 + 0.02, 0, color, 'x', 16);
  for (let i = -3; i <= 3; i++) addTorus(g, 0.218, 0.014, -0.04 + i * 0.065, y0 + 0.02, 0, P.dark(), 0, Math.PI / 2, 0);
  // Differential housing + halfshaft stubs
  addCyl(g, 0.16, 0.16, 0.22, 0.24, y0 - 0.02, 0, P.cast(), 'x', 14);
  addCyl(g, 0.045, 0.045, 0.72, 0.24, y0 - 0.02, 0, P.chrome(), 'z', 10);
  // Trapezoidal Inverter module on top
  addBox(g, 0.36, 0.11, 0.34, -0.06, y0 + 0.27, 0, accent);
  addBox(g, 0.30, 0.02, 0.22, -0.06, y0 + 0.335, 0, makeBadgeMat(badge.key, badge.bg, badge.fg, badge.text, badge.sub || ''));
  addCyl(g, 0.025, 0.025, 0.14, -0.26, y0 + 0.22, 0.10, P.orangeHV(), 'x', 8);
  addCyl(g, 0.025, 0.025, 0.14, -0.26, y0 + 0.22, -0.10, P.orangeHV(), 'x', 8);
  return g;
}

function buildRotaxBoxer(badge) {
  const g = new Group();
  const baseY = addEngineStand(g, 0.88, 1.04, false);
  const y0 = baseY + 0.20;
  // Central magnesium crankcase
  addBox(g, 0.42, 0.24, 0.28, -0.04, y0, 0, P.cast());
  // Flat-4 opposed cooling-finned cylinders + iconic Rotax white valve covers
  for (const s of [1, -1]) {
    for (const cx of [-0.14, 0.08]) {
      addCyl(g, 0.09, 0.09, 0.18, cx, y0 + 0.02, s * 0.22, P.alloy(), 'z', 10);
      addBox(g, 0.14, 0.14, 0.08, cx, y0 + 0.02, s * 0.34, P.ceramic());
    }
    addCyl(g, 0.025, 0.025, 0.22, 0.0, y0 - 0.10, s * 0.24, P.copper(), 'x', 8);
  }
  // Top twin intake plenum & intercooler
  addBox(g, 0.26, 0.08, 0.26, -0.06, y0 + 0.18, 0, P.blue());
  addBox(g, 0.22, 0.02, 0.18, -0.06, y0 + 0.23, 0, makeBadgeMat(badge.key, badge.bg, badge.fg, badge.text, badge.sub || ''));
  // Reduction gearbox nose + 3-blade carbon propeller!
  addCyl(g, 0.11, 0.13, 0.18, 0.24, y0 + 0.04, 0, P.dark(), 'x', 12);
  const spinner = new Mesh(new ConeGeometry(0.08, 0.14, 12), P.chrome());
  spinner.rotation.z = -Math.PI / 2;
  spinner.position.set(0.40, y0 + 0.04, 0);
  g.add(spinner);
  for (let k = 0; k < 3; k++) {
    const blade = new Group();
    blade.position.set(0.35, y0 + 0.04, 0);
    blade.rotation.x = (k * Math.PI * 2) / 3;
    addBox(blade, 0.025, 0.36, 0.065, 0, 0.20, 0, P.carbon());
    addBox(blade, 0.028, 0.06, 0.065, 0, 0.36, 0, P.yellow());
    g.add(blade);
  }
  return g;
}

const ENGINE_BUILDERS = {
  s0_yunnei4100: () => buildInlineEngine({ cyls: 4, coverColor: P.dieselGreen(), blockMat: P.dieselGreen(), superDiesel: true, woodPallet: true, coverStyle: 'smooth', badge: { key: '4100', bg: '#2c3c2f', fg: '#f0e6c8', text: '4100QB', sub: 'DIESEL' } }),
  s0_4g18: () => buildInlineEngine({ cyls: 4, coverColor: P.alloy(), blockMat: P.cast(), badge: { key: '4g18', bg: '#2b3036', fg: '#ffffff', text: '4G18', sub: '1.6L' } }),
  s0_4g63: () => buildInlineEngine({ cyls: 4, coverColor: P.red(), blockMat: P.dark(), coverStyle: 'smooth', badge: { key: '4g63', bg: '#8f1914', fg: '#ffffff', text: '4G63', sub: 'DOHC 16V' } }),
  s0_huachen18: () => buildInlineEngine({ cyls: 4, coverColor: P.blue(), blockMat: P.cast(), badge: { key: 'hc18', bg: '#1e3e66', fg: '#f2f2ee', text: 'BL18', sub: '1.8L' } }),
  s0_m54: () => buildInlineEngine({ cyls: 6, coverColor: P.dark(), blockMat: P.alloy(), slant: -0.22, badge: { key: 'm54', bg: '#171a1f', fg: '#dce2ea', text: 'M54B30', sub: 'INLINE-6' } }),

  s1_qr480: () => buildInlineEngine({ cyls: 4, coverColor: P.cast(), blockMat: P.dark(), badge: { key: 'qr480', bg: '#30343b', fg: '#e64c3c', text: 'QR480', sub: 'CHERY' } }),
  s1_mr479: () => buildInlineEngine({ cyls: 4, coverColor: P.alloy(), blockMat: P.alloy(), badge: { key: 'mr479', bg: '#1f4f8c', fg: '#ffffff', text: 'MR479Q', sub: '1.3L' } }),
  s1_4g69: () => buildInlineEngine({ cyls: 4, coverColor: P.copper(), blockMat: P.cast(), badge: { key: '4g69', bg: '#5a321a', fg: '#ffe0a8', text: '4G69', sub: 'MIVEC 2.4' } }),
  s1_bl18t: () => buildInlineEngine({ cyls: 4, coverColor: P.gold(), blockMat: P.cast(), turbo: true, badge: { key: 'bl18t', bg: '#634d14', fg: '#fff6d6', text: '1.8T', sub: 'TURBO' } }),
  s1_s54: () => buildInlineEngine({ cyls: 6, coverColor: P.dark(), blockMat: P.cast(), itb: true, mStripes: true, slant: -0.22, badge: { key: 's54', bg: '#18191c', fg: '#ffffff', text: 'S54B32', sub: 'M POWER' } }),

  s2_acteco18: () => buildInlineEngine({ cyls: 4, coverColor: P.cast(), blockMat: P.alloy(), coverStyle: 'stepped', badge: { key: 'act18', bg: '#2c3138', fg: '#80c8ff', text: 'ACTECO', sub: '1.8 DOHC' } }),
  s2_gw20tc: () => buildInlineEngine({ cyls: 4, coverColor: P.dark(), blockMat: P.dieselGreen(), turbo: true, superDiesel: true, badge: { key: 'gw20', bg: '#26382b', fg: '#ffd452', text: '2.0TCI', sub: 'CRDi' } }),
  s2_kavachi: () => buildInlineEngine({ cyls: 4, coverColor: P.green(), blockMat: P.alloy(), turbo: true, anodizedPipe: P.orangeHV(), badge: { key: 'kav', bg: '#144428', fg: '#f2e8cf', text: 'KAVACHI', sub: '1.8 TURBO' } }),
  s2_ea888: () => buildInlineEngine({ cyls: 4, coverColor: P.dark(), blockMat: P.cast(), turbo: true, redCoils: true, coverStyle: 'stepped', badge: { key: 'ea888', bg: '#1c1f24', fg: '#e53935', text: 'EA888', sub: '2.0 TSI' } }),
  s2_n54: () => buildInlineEngine({ cyls: 6, coverColor: P.alloy(), blockMat: P.alloy(), twinTurbo: true, slant: -0.22, anodizedPipe: P.red(), badge: { key: 'n54', bg: '#1c2430', fg: '#ffd04d', text: 'N54B30', sub: 'TWIN TURBO' } }),

  s3_gw4g15: () => buildInlineEngine({ cyls: 4, coverColor: P.dark(), blockMat: P.alloy(), badge: { key: 'gw15', bg: '#2b2d33', fg: '#f05040', text: 'GW4G15', sub: 'VVT 1.5' } }),
  s3_tci20: () => buildInlineEngine({ cyls: 4, coverColor: P.cast(), blockMat: P.dark(), turbo: true, anodizedPipe: P.blue(), badge: { key: 'tci20', bg: '#1b2b44', fg: '#9cd6ff', text: '2.0TCI', sub: 'INTERCOOL' } }),
  s3_ecotec20: () => buildInlineEngine({ cyls: 4, coverColor: P.chrome(), blockMat: P.alloy(), turbo: true, badge: { key: 'eco20', bg: '#1f2833', fg: '#ffdf4d', text: 'ECOTEC', sub: '2.0T' } }),
  s3_vr38: () => buildVEngine({ cylsPerBank: 3, angle: 0.56, coverColor: P.red(), twinTurbo: true, badge: { key: 'vr38', bg: '#1b1d22', fg: '#ffffff', text: 'VR38', sub: 'TAKUMI' } }),
  s3_f136: () => buildVEngine({ cylsPerBank: 4, angle: 0.78, coverColor: P.red(), trumpets: true, badge: { key: 'f136', bg: '#9b1612', fg: '#ffe038', text: 'F136 V8', sub: 'MARANELLO' } }),

  s4_e550: () => buildHybridUnit({ cyls: 4, coverColor: P.dark(), motorColor: P.teal(), badge: { key: 'e550', bg: '#144f4b', fg: '#e6fffb', text: 'e550', sub: 'PHEV EDU' } }),
  s4_qin_dm: () => buildHybridUnit({ cyls: 4, coverColor: P.blue(), motorColor: P.blue(), badge: { key: 'qindm', bg: '#183f7a', fg: '#ffffff', text: 'QIN DM', sub: 'DUAL MODE' } }),
  s4_ths2: () => buildHybridUnit({ cyls: 4, coverColor: P.alloy(), motorColor: P.ice(), split: 'ths', badge: { key: 'ths2', bg: '#164d78', fg: '#a8e6ff', text: 'THS-II', sub: 'e-CVT' } }),
  s4_i8: () => buildHybridUnit({ cyls: 3, coverColor: P.dark(), motorColor: P.ice(), badge: { key: 'bmwi8', bg: '#141920', fg: '#48c8ff', text: 'BMW i8', sub: 'eDrive+B38' } }),
  s4_models: () => buildElectricUnit({ variant: 'single', color: P.alloy(), accent: P.dark(), badge: { key: 'ms', bg: '#20242a', fg: '#ff4a3d', text: 'MODEL S', sub: 'EV DRIVE' } }),

  s5_gac15: () => buildInlineEngine({ cyls: 4, coverColor: P.carbon(), blockMat: P.alloy(), turbo: true, anodizedPipe: P.chrome(), badge: { key: 'gac15', bg: '#22262c', fg: '#e6c24a', text: 'GAC 1.5', sub: 'TGDI' } }),
  s5_acteco20: () => buildInlineEngine({ cyls: 4, coverColor: P.crimson(), blockMat: P.alloy(), turbo: true, anodizedPipe: P.red(), badge: { key: 'act20', bg: '#5a1618', fg: '#ffd6d6', text: 'ACTECO', sub: '2.0TGDI' } }),
  s5_bluewhale20: () => buildInlineEngine({ cyls: 4, coverColor: P.blue(), blockMat: P.alloy(), turbo: true, anodizedPipe: P.ice(), badge: { key: 'bw20', bg: '#103c80', fg: '#ffffff', text: '蓝鲸 2.0T', sub: 'NE POWR' } }),
  s5_m178: () => buildVEngine({ cylsPerBank: 4, angle: 0.78, coverColor: P.carbon(), hotV: true, badge: { key: 'm178', bg: '#1c1f24', fg: '#e2e6eb', text: 'AMG M178', sub: 'HOT-V V8' } }),
  s5_modelx: () => buildElectricUnit({ variant: 'single', color: P.cast(), accent: P.crimson(), badge: { key: 'mx', bg: '#3a1418', fg: '#ffaaaa', text: 'MODEL X', sub: 'DUAL EV' } }),

  s6_ne15: () => buildInlineEngine({ cyls: 4, coverColor: P.ice(), blockMat: P.alloy(), turbo: true, coverStyle: 'stepped', badge: { key: 'ne15', bg: '#164e88', fg: '#e8f4ff', text: 'NE 1.5T', sub: '蓝鲸' } }),
  s6_acteco3: () => buildInlineEngine({ cyls: 4, coverColor: P.copper(), blockMat: P.dark(), turbo: true, redCoils: true, badge: { key: 'act3', bg: '#4e2c14', fg: '#ffe2c2', text: 'GEN-3', sub: '1.6TGDI' } }),
  s6_xiaoyun: () => buildInlineEngine({ cyls: 4, coverColor: P.ceramic(), blockMat: P.alloy(), turbo: true, anodizedPipe: P.red(), badge: { key: 'xy15', bg: '#a81c18', fg: '#ffffff', text: '骁云', sub: '1.5TI' } }),
  s6_honda15: () => buildInlineEngine({ cyls: 4, coverColor: P.red(), blockMat: P.alloy(), turbo: true, anodizedPipe: P.chrome(), badge: { key: 'vtec', bg: '#a81914', fg: '#ffffff', text: 'VTEC', sub: '1.5 TURBO' } }),
  s6_tesla100: () => buildElectricUnit({ variant: 'single', color: P.copper(), accent: P.red(), badge: { key: 'p100d', bg: '#7a1614', fg: '#ffd75e', text: 'P100D', sub: 'LUDICROUS' } }),

  s7_zeekr4: () => buildElectricUnit({ variant: 'quad_zeekr', badge: { key: 'zeekr4', bg: '#122638', fg: '#62e6ff', text: 'ZEEKR 4M', sub: 'SiC QUAD' } }),
  s7_yisifang: () => buildElectricUnit({ variant: 'quad_yisifang', badge: { key: 'e4', bg: '#3e2c10', fg: '#ffe074', text: '易四方', sub: 'e4 QUAD' } }),
  s7_xiaomi_v8s: () => buildElectricUnit({ variant: 'v8s', badge: { key: 'v8s', bg: '#222428', fg: '#f4c828', text: 'XIAOMI', sub: 'V8s 27k' } }),
  s7_xpeng_emotor: () => {
    // XPeng AeroHT Carbon-Copper Aerospace High-Power Coaxial eVTOL Motor
    const g = new Group();
    const baseY = addEngineStand(g, 0.90, 1.08, false);
    const y0 = baseY + 0.22;
    addBox(g, 0.74, 0.08, 0.44, 0, y0 - 0.06, 0, P.dark());
    addCyl(g, 0.24, 0.24, 0.42, -0.04, y0 + 0.14, 0, P.carbon(), 'x', 18);
    for (let i = -2; i <= 2; i++) addTorus(g, 0.25, 0.015, -0.04 + i * 0.08, y0 + 0.14, 0, P.ice(), 0, Math.PI / 2, 0);
    // Visible copper winding crown & twin carbon coaxial eVTOL blades on nose!
    addCyl(g, 0.20, 0.20, 0.10, 0.20, y0 + 0.14, 0, P.copper(), 'x', 16);
    addCyl(g, 0.06, 0.06, 0.28, 0.32, y0 + 0.14, 0, P.chrome(), 'x', 12);
    for (let k = 0; k < 2; k++) {
      const bg = new Group();
      bg.position.set(0.39, y0 + 0.14, 0);
      bg.rotation.x = k * Math.PI + 0.3;
      addBox(bg, 0.02, 0.44, 0.06, 0, 0, 0, P.carbon());
      addBox(bg, 0.025, 0.06, 0.065, 0, 0.21, 0, P.cyanGlow());
      addBox(bg, 0.025, 0.06, 0.065, 0, -0.21, 0, P.cyanGlow());
      g.add(bg);
    }
    addBox(g, 0.36, 0.10, 0.28, -0.06, y0 + 0.42, 0, P.alloy());
    addBox(g, 0.30, 0.02, 0.22, -0.06, y0 + 0.48, 0, makeBadgeMat('xpaero', '#102840', '#70e8ff', 'XPENG eVTOL', '800V AERO EV'));
    return g;
  },
  s7_roadster26: () => buildElectricUnit({ variant: 'roadster', badge: { key: 'rd26', bg: '#181a20', fg: '#7ae8ff', text: 'ROADSTER', sub: 'EV + AIR' } }),
  s7_maize_nuclear: () => {
    const g = new Group();
    addBox(g, 1.06, 0.08, 0.80, 0, 0.04, 0, P.wood());
    addBox(g, 0.84, 0.14, 0.62, 0, 0.14, 0, P.dark());
    // Shielded reactor containment vessel with glowing Cherenkov core window
    addCyl(g, 0.28, 0.30, 0.56, -0.08, 0.46, 0, P.yellow(), 'y', 16);
    for (const ry of [0.28, 0.46, 0.64]) addTorus(g, 0.305, 0.018, -0.08, ry, 0, P.dark(), Math.PI / 2, 0, 0);
    const coreMat = new MeshStandardMaterial({ color: 0x52ff88, emissive: 0x1ee055, emissiveIntensity: 1.0, roughness: 0.25 });
    addCyl(g, 0.16, 0.16, 0.32, -0.08, 0.46, 0, coreMat, 'y', 12);
    addBox(g, 0.20, 0.26, 0.12, -0.08, 0.46, 0.26, coreMat);
    // Heat-exchanger cooling turbine & steam manifold on side
    addCyl(g, 0.18, 0.18, 0.34, 0.30, 0.36, 0, P.alloy(), 'x', 14);
    addCyl(g, 0.06, 0.06, 0.42, 0.12, 0.78, 0, P.chrome(), 'z', 10);
    const bm = makeBadgeMat('maizenuc', '#e6b822', '#18191c', '玉米核动力', 'MAIZE ATOMIC', '#18191c');
    addBox(g, 0.02, 0.20, 0.42, 0.43, 0.36, 0, bm);
    addBox(g, 0.42, 0.20, 0.02, -0.08, 0.77, 0.0, bm);
    return g;
  },
  s8_nio900: () => buildElectricUnit({ variant: 'tri_nio900', badge: { key: 'nio900', bg: '#0c1c28', fg: '#68f0ff', text: 'NIO 900V', sub: 'TRI-MOTOR 1+2' } }),
  s8_byd30k: () => buildElectricUnit({ variant: 'v8s', badge: { key: 'byd30k', bg: '#5a1614', fg: '#ffd75e', text: '30,511rpm', sub: 'MEGAWATT EV' } }),
  s8_tourbillon_v16: () => {
    // 8.3L Cosworth Naturally Aspirated V16 + Front Tri-Motor Hybrid Bridge (Bugatti Tourbillon!)
    const g = new Group();
    const baseY = addEngineStand(g, 1.06, 1.18, false);
    const eng = new Group();
    eng.position.y = baseY + 0.26;
    g.add(eng);
    const len = 1.04;
    addBox(eng, len, 0.22, 0.36, -0.04, -0.06, 0, P.cast());
    addBox(eng, len * 0.94, 0.10, 0.34, -0.04, -0.20, 0, P.carbon());
    // Two 8-cylinder angled V16 banks
    for (const s of [1, -1]) {
      const bank = new Group();
      bank.rotation.x = s * 0.62;
      bank.position.set(-0.04, 0.08, s * 0.08);
      addBox(bank, len, 0.22, 0.24, 0, 0.12, 0, P.alloy());
      addBox(bank, len * 0.96, 0.09, 0.25, 0, 0.27, 0, P.blue());
      for (let i = 0; i < 8; i++) {
        const cx = -len * 0.42 + i * (len * 0.84 / 7);
        addCyl(bank, 0.022, 0.022, 0.16, cx, 0.16, s * 0.16, P.copper(), 'z', 8);
      }
      eng.add(bank);
    }
    // Carbon intake plenum spine + 16 vertical trumpet mouths
    addBox(eng, len * 0.88, 0.14, 0.28, -0.04, 0.42, 0, P.carbon());
    for (let i = 0; i < 8; i++) {
      const cx = -len * 0.40 + i * (len * 0.80 / 7);
      addCyl(eng, 0.024, 0.028, 0.15, cx, 0.34, 0.16, P.gold(), 'z', 8);
      addCyl(eng, 0.024, 0.028, 0.15, cx, 0.34, -0.16, P.gold(), 'z', 8);
    }
    // Front Tri-Motor E-Axle & HV Orange Busbars
    addCyl(eng, 0.14, 0.14, 0.34, 0.56, 0.08, 0, P.alloy(), 'z', 14);
    addBox(eng, 0.14, 0.10, 0.24, 0.56, 0.26, 0, P.orangeHV());
    const bm = makeBadgeMat('v16hyb', '#0d1b36', '#ffd86b', 'V16 HYBRID', '8.3L TOURBILLON', '#39b6e6');
    addBox(eng, 0.52, 0.025, 0.18, -0.04, 0.495, 0, bm);
    return g;
  },
  s8_maize_nuclear2: () => {
    const g = new Group();
    addBox(g, 1.12, 0.07, 0.84, 0, 0.035, 0, P.carbon());
    const plasma = new MeshStandardMaterial({ color: 0x62f2ff, emissive: 0x1aa8ff, emissiveIntensity: 1.2, roughness: 0.2 });
    // Toroidal magnetic tokamak containment ring!
    addTorus(g, 0.28, 0.11, 0, 0.42, 0, P.alloy(), Math.PI / 2, 0, 0);
    addTorus(g, 0.28, 0.06, 0, 0.42, 0, plasma, Math.PI / 2, 0, 0);
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3;
      addTorus(g, 0.13, 0.024, Math.cos(a) * 0.28, 0.42, Math.sin(a) * 0.28, P.copper(), 0, -a, 0);
    }
    addBox(g, 0.30, 0.14, 0.24, 0, 0.14, 0, P.dark());
    const bm = makeBadgeMat('maize2', '#0b2238', '#68f0ff', '玉米核动力 II', 'MAG-FUSION', '#39b6e6');
    addBox(g, 0.44, 0.18, 0.02, 0, 0.18, 0.41, bm);
    addBox(g, 0.02, 0.18, 0.44, 0.41, 0.18, 0, bm);
    return g;
  },
};

function buildEngine(item) {
  const fn = ENGINE_BUILDERS[item.id];
  if (fn) return fn();
  return buildInlineEngine({ cyls: 4, coverColor: P.alloy(), badge: { key: item.id, bg: '#252930', fg: '#fff', text: 'ENGINE' } });
}

// ═══════════════════════════════════════════════════════
//  FUELS & BATTERIES (All 31 IDs individually sculpted)
// ═══════════════════════════════════════════════════════

function buildDrum(colorMat, bandMat, badge, crankPump = false) {
  const g = new Group();
  const baseY = 0.04;
  addBox(g, 0.72, 0.04, 0.72, 0, 0.02, 0, P.wood());
  addCyl(g, 0.27, 0.27, 0.66, 0, baseY + 0.33, 0, colorMat, 'y', 16);
  for (const ry of [baseY + 0.16, baseY + 0.33, baseY + 0.50]) {
    addTorus(g, 0.278, 0.016, 0, ry, 0, bandMat, Math.PI / 2, 0, 0);
  }
  addCyl(g, 0.04, 0.04, 0.04, 0.11, baseY + 0.67, 0.06, P.chrome(), 'y', 8);
  const bm = makeBadgeMat(badge.key, badge.bg, badge.fg, badge.text, badge.sub || '', badge.border || null);
  addBox(g, 0.02, 0.20, 0.34, 0.275, baseY + 0.33, 0, bm);
  addBox(g, 0.34, 0.20, 0.02, 0, baseY + 0.33, 0.275, bm);

  if (crankPump) {
    // Aviation 100LL rotary hand crank + hose
    addCyl(g, 0.022, 0.022, 0.34, -0.10, baseY + 0.80, -0.06, P.chrome(), 'y', 8);
    addBox(g, 0.16, 0.08, 0.10, -0.10, baseY + 0.90, -0.06, P.red());
    addCyl(g, 0.016, 0.016, 0.26, -0.18, baseY + 0.88, 0.08, P.rubber(), 'z', 8);
    addCyl(g, 0.015, 0.015, 0.16, -0.10, baseY + 0.92, -0.18, P.gold(), 'z', 6);
  }
  return g;
}

function buildJerrycan(bodyMat, capMat, badge, style = 'classic') {
  const g = new Group();
  if (style === 'tall_vp') {
    // Translucent/tinted square racing dump-can + curved filler hose
    addBox(g, 0.44, 0.62, 0.44, 0, 0.31, 0, bodyMat);
    addBox(g, 0.10, 0.18, 0.10, -0.16, 0.56, 0, bodyMat);
    addCyl(g, 0.075, 0.09, 0.10, 0.06, 0.66, 0, capMat, 'y', 10);
    addCyl(g, 0.022, 0.022, 0.28, 0.20, 0.72, 0, P.amberOil(), 'y', 8, 0, 0, -0.6);
    const bm = makeBadgeMat(badge.key, badge.bg, badge.fg, badge.text, badge.sub || '', badge.border || null);
    addBox(g, 0.02, 0.22, 0.30, 0.225, 0.34, 0, bm);
    addBox(g, 0.30, 0.22, 0.02, 0, 0.34, 0.225, bm);
    return g;
  }

  if (style === 'twin') {
    for (const s of [-1, 1]) {
      addBox(g, 0.32, 0.54, 0.24, 0, 0.27, s * 0.15, bodyMat);
      addCyl(g, 0.04, 0.04, 0.06, 0.08, 0.56, s * 0.15, capMat, 'y', 8);
    }
    const bm = makeBadgeMat(badge.key, badge.bg, badge.fg, badge.text, badge.sub || '');
    addBox(g, 0.02, 0.20, 0.26, 0.165, 0.28, 0, bm);
    return g;
  }

  // Classic pressed steel / sport jerrycan with embossed X-ribs and 3-bar handle
  addBox(g, 0.46, 0.58, 0.24, 0, 0.29, 0, bodyMat);
  for (const s of [-1, 1]) {
    addBox(g, 0.34, 0.035, 0.02, 0, 0.29, s * 0.125, P.dark(), 0, 0, 0.58);
    addBox(g, 0.34, 0.035, 0.02, 0, 0.29, s * 0.125, P.dark(), 0, 0, -0.58);
  }
  addBox(g, 0.24, 0.09, 0.08, -0.06, 0.61, 0, bodyMat);
  addCyl(g, 0.045, 0.045, 0.08, 0.14, 0.60, 0, capMat, 'y', 8, 0, 0, -0.25);
  const bm = makeBadgeMat(badge.key, badge.bg, badge.fg, badge.text, badge.sub || '', badge.border || null);
  addBox(g, 0.30, 0.18, 0.02, 0, 0.30, 0.13, bm);
  addBox(g, 0.30, 0.18, 0.02, 0, 0.30, -0.13, bm);
  return g;
}

function buildMaotai() {
  const g = new Group();
  // Gold collector base pad
  addCyl(g, 0.26, 0.28, 0.04, 0, 0.02, 0, P.gold(), 'y', 16);
  // White ceramic bottle body & sloped shoulder & neck
  addCyl(g, 0.17, 0.17, 0.48, 0, 0.28, 0, P.ceramic(), 'y', 16);
  addCyl(g, 0.085, 0.17, 0.14, 0, 0.59, 0, P.ceramic(), 'y', 16);
  addCyl(g, 0.085, 0.085, 0.14, 0, 0.72, 0, P.ceramic(), 'y', 14);
  // Signature gold collar + red cap + hanging red silk ribbon!
  addCyl(g, 0.092, 0.092, 0.07, 0, 0.80, 0, P.red(), 'y', 14);
  addCyl(g, 0.088, 0.088, 0.04, 0, 0.75, 0, P.gold(), 'y', 14);
  addBox(g, 0.03, 0.24, 0.06, 0.11, 0.64, 0.06, P.red(), 0, 0, 0.22);
  // Iconic white label with diagonal red sash!
  const mt = makeBadgeMat('maotai', '#f6f2e8', '#c61c18', '贵州茅台', '53%vol', '#d4a634');
  addBox(g, 0.02, 0.30, 0.22, 0.168, 0.28, 0, mt);
  addBox(g, 0.22, 0.30, 0.02, 0, 0.28, 0.168, mt);
  return g;
}

function buildJinlongyu() {
  const g = new Group();
  // Iconic 5L Golden-Yellow translucent oil jug with handle & red cap
  addCyl(g, 0.22, 0.22, 0.52, 0, 0.26, 0, P.amberOil(), 'y', 14);
  addCyl(g, 0.10, 0.22, 0.12, 0, 0.58, 0, P.amberOil(), 'y', 14);
  addCyl(g, 0.075, 0.075, 0.09, 0, 0.68, 0, P.red(), 'y', 12);
  // Side carry handle
  addBox(g, 0.06, 0.28, 0.05, -0.24, 0.34, 0, P.amberOil());
  addBox(g, 0.10, 0.05, 0.05, -0.19, 0.46, 0, P.amberOil());
  addBox(g, 0.10, 0.05, 0.05, -0.19, 0.22, 0, P.amberOil());
  // Golden-red label
  const jl = makeBadgeMat('jinlongyu', '#d8281c', '#ffe24d', '金龙鱼', '5L 色拉油', '#ffd748');
  addBox(g, 0.02, 0.24, 0.26, 0.215, 0.26, 0, jl);
  addBox(g, 0.26, 0.24, 0.02, 0, 0.26, 0.215, jl);
  return g;
}

function buildFuelCell(badge, accentMat = P.red()) {
  const g = new Group();
  // FIA Aluminum Bladder Fuel Cell in red/silver cage with AN fittings
  addBox(g, 0.64, 0.38, 0.48, 0, 0.21, 0, P.alloy());
  addBox(g, 0.68, 0.04, 0.52, 0, 0.02, 0, P.dark());
  addBox(g, 0.66, 0.04, 0.08, 0, 0.41, -0.12, accentMat);
  addBox(g, 0.66, 0.04, 0.08, 0, 0.41, 0.12, accentMat);
  // Brushed top filler neck + braided lines
  addCyl(g, 0.085, 0.085, 0.08, 0.12, 0.43, 0, P.chrome(), 'y', 12);
  addCyl(g, 0.03, 0.03, 0.12, -0.18, 0.43, 0.08, P.blue(), 'y', 8);
  addCyl(g, 0.03, 0.03, 0.12, -0.18, 0.43, -0.08, P.red(), 'y', 8);
  const bm = makeBadgeMat(badge.key, badge.bg, badge.fg, badge.text, badge.sub || '');
  addBox(g, 0.36, 0.18, 0.02, 0, 0.22, 0.25, bm);
  return g;
}

function buildBatteryPack(cfg) {
  const { variant = 'lfp400', badge } = cfg;
  const g = new Group();
  const bm = makeBadgeMat(badge.key, badge.bg, badge.fg, badge.text, badge.sub || '');

  // Authentic Automotive CTP Skateboard Structural Underbody Battery Tray
  // Wide aluminum crash frame + side mounting bolt rails
  addBox(g, 1.02, 0.04, 0.72, 0, 0.02, 0, P.alloy());
  for (const sz of [-0.39, 0.39]) {
    addBox(g, 0.98, 0.03, 0.05, 0, 0.035, sz, P.cast());
    for (let bx = -0.38; bx <= 0.38; bx += 0.19) addCyl(g, 0.015, 0.015, 0.04, bx, 0.055, sz, P.chrome(), 'y', 6);
  }
  // Armored peripheral thermal shell
  addBox(g, 0.96, 0.11, 0.66, 0, 0.095, 0, P.dark());
  // Front liquid-cooling quick-connect ports & orange HV armored bus connectors
  for (const lz of [-0.20, -0.10]) addCyl(g, 0.024, 0.024, 0.09, 0.52, 0.09, lz, P.blue(), 'x', 8);
  addBox(g, 0.08, 0.08, 0.18, 0.50, 0.10, 0.16, P.orangeHV());
  for (const hz of [0.11, 0.21]) addCyl(g, 0.024, 0.024, 0.09, 0.54, 0.10, hz, P.orangeHV(), 'x', 8);
  // Central raised PDU / BMS junction module + red MSD interlock plug
  addBox(g, 0.24, 0.07, 0.24, 0.30, 0.185, 0, P.carbon());
  addBox(g, 0.07, 0.03, 0.07, 0.33, 0.225, -0.05, P.red());
  addBox(g, 0.12, 0.02, 0.20, 0.26, 0.225, 0.04, P.orangeHV());

  if (variant === 'blade800') {
    // Sleek full-span BYD Blade structural pack under smoked top ribs
    addBox(g, 0.92, 0.025, 0.62, 0, 0.16, 0, P.blue());
    for (let i = 0; i < 11; i++) {
      addBox(g, 0.58, 0.03, 0.034, -0.14, 0.172, -0.25 + i * 0.05, P.alloy());
    }
  } else if (variant === 'cap400') {
    // Graphene pouch pack with wide anodized cyan busbars
    for (let c = 0; c < 4; c++) {
      addBox(g, 0.13, 0.04, 0.52, -0.34 + c * 0.15, 0.17, 0, P.ice());
      addBox(g, 0.11, 0.015, 0.54, -0.34 + c * 0.15, 0.195, 0, P.copper());
    }
  } else if (variant === 'solid1000' || variant === 'semi1000' || variant === 'qcell' || variant === 'megawatt') {
    const col = variant === 'solid1000' || variant === 'qcell' ? P.cyanGlow() : P.gold();
    const cellMat = variant === 'qcell' ? P.dark() : variant === 'solid1000' ? P.ceramic() : P.alloy();
    addBox(g, 0.62, 0.04, 0.58, -0.14, 0.165, 0, P.carbon());
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        addBox(g, 0.12, 0.035, 0.24, -0.34 + c * 0.14, 0.195, -0.14 + r * 0.28, cellMat);
        addBox(g, 0.10, 0.012, 0.20, -0.34 + c * 0.14, 0.215, -0.14 + r * 0.28, col);
      }
    }
  } else {
    // 400V LFP / 500V NCM sleek flat skateboard modules under colored shroud
    const shroud = variant === 'ncm500' ? P.blue() : P.green();
    addBox(g, 0.62, 0.045, 0.58, -0.14, 0.168, 0, shroud);
    for (let i = -1; i <= 1; i++) addBox(g, 0.58, 0.02, 0.14, -0.14, 0.195, i * 0.18, P.alloy());
  }

  // Telemetry nameplate cleanly mounted on top/front skirt
  addBox(g, 0.34, 0.02, 0.18, -0.14, 0.228, 0.14, bm);
  addBox(g, 0.36, 0.10, 0.02, -0.14, 0.10, 0.335, bm);
  return g;
}

function buildRocketFuel(badge) {
  const g = new Group();
  // Cryogenic Twin LOX + RP-1 Pressure Tanks in frame with gauges
  addBox(g, 0.72, 0.04, 0.50, 0, 0.02, 0, P.dark());
  for (const [z, m] of [[-0.14, P.chrome()], [0.14, P.orangeHV()]]) {
    addCyl(g, 0.11, 0.11, 0.56, 0, 0.22, z, m, 'x', 14);
    for (const s of [-1, 1]) {
      const cap = new Mesh(new SphereGeometry(0.11, 12, 8), m);
      cap.position.set(s * 0.28, 0.22, z);
      g.add(cap);
    }
    addTorus(g, 0.116, 0.014, -0.14, 0.22, z, P.dark(), 0, Math.PI / 2, 0);
    addTorus(g, 0.116, 0.014, 0.14, 0.22, z, P.dark(), 0, Math.PI / 2, 0);
  }
  // Top cryogenic manifold + pressure dial
  addCyl(g, 0.02, 0.02, 0.30, 0.18, 0.34, 0, P.chrome(), 'z', 8);
  addCyl(g, 0.055, 0.055, 0.03, 0.18, 0.42, 0, P.ceramic(), 'z', 10);
  addBox(g, 0.32, 0.16, 0.02, 0, 0.22, 0.26, makeBadgeMat(badge.key, badge.bg, badge.fg, badge.text, badge.sub || ''));
  return g;
}

function buildUraniumCask(badge) {
  const g = new Group();
  addBox(g, 0.72, 0.04, 0.72, 0, 0.02, 0, P.dark());
  addCyl(g, 0.24, 0.26, 0.64, 0, 0.36, 0, P.yellow(), 'y', 16);
  for (const ry of [0.18, 0.36, 0.54]) addTorus(g, 0.265, 0.018, 0, ry, 0, P.dark(), Math.PI / 2, 0, 0);
  // Central glowing U-235 rod rising out of lead cap
  const uMat = new MeshStandardMaterial({ color: 0x58ff8a, emissive: 0x22d955, emissiveIntensity: 1.1, roughness: 0.2 });
  addCyl(g, 0.075, 0.075, 0.26, 0, 0.76, 0, uMat, 'y', 12);
  addCyl(g, 0.13, 0.15, 0.06, 0, 0.69, 0, P.alloy(), 'y', 12);
  const bm = makeBadgeMat(badge.key, badge.bg, badge.fg, badge.text, badge.sub || '', '#18191c');
  addBox(g, 0.02, 0.22, 0.32, 0.25, 0.36, 0, bm);
  addBox(g, 0.32, 0.22, 0.02, 0, 0.36, 0.25, bm);
  return g;
}

const FUEL_BUILDERS = {
  s0_diesel: () => buildDrum(P.dark(), P.yellow(), { key: 'diesel0', bg: '#222428', fg: '#ffd038', text: 'DIESEL', sub: '0# 柴油' }),
  s0_gas92: () => buildJerrycan(P.red(), P.gold(), { key: 'gas92', bg: '#9b1815', fg: '#ffffff', text: '92#', sub: 'GASOLINE' }),
  s0_gas90: () => buildJerrycan(P.dieselGreen(), P.cast(), { key: 'gas90', bg: '#2c3d2d', fg: '#f0e2a8', text: '90#', sub: 'LEADED' }),
  s0_gas93: () => buildJerrycan(P.crimson(), P.yellow(), { key: 'gas93', bg: '#681614', fg: '#ffe04a', text: '93#', sub: 'REGULAR' }),

  s1_gas95: () => buildJerrycan(P.red(), P.chrome(), { key: 'gas95', bg: '#b01c18', fg: '#ffffff', text: '95#', sub: 'UNLEADED' }),
  s1_gas97: () => buildJerrycan(P.blue(), P.red(), { key: 'gas97', bg: '#164288', fg: '#ffffff', text: '97#', sub: 'PREMIUM' }),
  s1_gas98: () => buildJerrycan(P.carbon(), P.red(), { key: 'gas98', bg: '#1c2026', fg: '#ff4e40', text: '98#', sub: 'HIGH OCT' }),
  s1_ethanol: () => buildJerrycan(P.green(), P.yellow(), { key: 'e10', bg: '#1a5e2c', fg: '#ffe650', text: 'E10', sub: 'ETHANOL' }),
  s1_maotai: () => buildMaotai(),

  s2_diesel3: () => buildDrum(P.blue(), P.chrome(), { key: 'diesel3', bg: '#144478', fg: '#d4f0ff', text: '国 III', sub: 'CLEAN DSL' }),
  s2_gas98c: () => buildJerrycan(P.alloy(), P.red(), { key: 'gas98c', bg: '#30363f', fg: '#ff6454', text: '98#+', sub: 'CLEAN FUEL' }),
  s2_race100: () => buildJerrycan(P.ceramic(), P.red(), { key: 'race100', bg: '#d6241e', fg: '#ffffff', text: '100#', sub: 'RACE SPEC' }, 'tall_vp'),
  s2_m15: () => buildJerrycan(P.teal(), P.orangeHV(), { key: 'm15', bg: '#135c58', fg: '#ffcf56', text: 'M15', sub: 'METHANOL' }, 'tall_vp'),
  s2_jinlongyu: () => buildJinlongyu(),

  s3_gas98d: () => buildJerrycan(P.dark(), P.gold(), { key: 'gas98d', bg: '#1c1f24', fg: '#ffd54a', text: '98#', sub: 'CLEAN+', border: '#d4a634' }),
  s3_raceR1: () => buildJerrycan(P.red(), P.gold(), { key: 'r1', bg: '#9b1815', fg: '#ffffff', text: 'R1 FUEL', sub: 'RACE GAS' }, 'tall_vp'),
  s3_e85: () => buildJerrycan(P.yellow(), P.green(), { key: 'e85', bg: '#266b28', fg: '#fff04a', text: 'E85', sub: 'BIO RACE' }, 'tall_vp'),
  s3_gas95track: () => buildJerrycan(P.red(), P.ceramic(), { key: 'g95t', bg: '#a81c18', fg: '#ffffff', text: '95# T', sub: 'TWIN PACK' }, 'twin'),

  s4_gas98: () => buildJerrycan(P.teal(), P.gold(), { key: 'gas98_4', bg: '#185458', fg: '#e6fffb', text: '98# EFI', sub: 'DIRECT INJ' }, 'tall_vp'),
  s4_ev400a: () => buildBatteryPack({ variant: 'lfp400', badge: { key: 'ev400a', bg: '#144c28', fg: '#a8ffb8', text: '400V LFP', sub: '3C PACK' } }),
  s4_ev400b: () => buildBatteryPack({ variant: 'cap400', badge: { key: 'ev400b', bg: '#124666', fg: '#7ae8ff', text: '5C CAP', sub: '400V BANK' } }),

  s5_gas98e: () => buildJerrycan(P.blue(), P.chrome(), { key: 'g98e', bg: '#1b3d6e', fg: '#ffffff', text: '98#', sub: 'CLEAN GAS' }, 'tall_vp'),
  s5_ev500: () => buildBatteryPack({ variant: 'ncm500', badge: { key: 'ev500', bg: '#163c78', fg: '#ffffff', text: '500V', sub: '5C NCM' } }),
  s5_gas102: () => buildDrum(P.red(), P.gold(), { key: 'g102', bg: '#8f1814', fg: '#ffe04d', text: '102#', sub: 'RACE DRUM' }),

  s6_gas15: () => buildJerrycan(P.ceramic(), P.blue(), { key: 'g15t', bg: '#1d4c90', fg: '#ffffff', text: '98+ TURBO', sub: 'DIRECT INJ' }, 'tall_vp'),
  s6_ev800a: () => buildBatteryPack({ variant: 'blade800', badge: { key: 'blade800', bg: '#103874', fg: '#ffffff', text: '800V 刀片', sub: '8C BLADE' } }),
  s6_e20: () => buildJerrycan(P.green(), P.ice(), { key: 'e20', bg: '#1c6838', fg: '#b4ff9e', text: 'E20', sub: 'ECO GAS' }, 'tall_vp'),

  s7_ev1000: () => buildBatteryPack({ variant: 'semi1000', badge: { key: 'ev1000', bg: '#4f3a12', fg: '#ffe47a', text: '1000V', sub: '8C SEMI' } }),
  s7_solid: () => buildBatteryPack({ variant: 'solid1000', badge: { key: 'solid', bg: '#103c4a', fg: '#68f0ff', text: '10C 全固态', sub: '1000V SOLID' } }),
  s7_uranium: () => buildUraniumCask({ key: 'u235', bg: '#e6b822', fg: '#18191c', text: '铀235', sub: 'NUCLEAR' }),
  s8_qcell: () => buildBatteryPack({ variant: 'qcell', badge: { key: 'qcell', bg: '#0c2a3a', fg: '#68f0ff', text: 'QUANTUM', sub: 'LI-METAL' } }),
  s8_megawatt: () => buildBatteryPack({ variant: 'megawatt', badge: { key: 'megawatt', bg: '#5a1814', fg: '#ffe064', text: '1500V MW', sub: 'MEGACHARGE' } }),
  s8_fusion: () => buildUraniumCask({ key: 'fusion', bg: '#0b2a42', fg: '#68f0ff', text: 'D-T FUSION', sub: 'NUCLEAR II' }),
};

function buildFuel(item) {
  const fn = FUEL_BUILDERS[item.id];
  if (fn) return fn();
  return buildJerrycan(P.red(), P.gold(), { key: item.id, bg: '#9b1815', fg: '#fff', text: 'FUEL' });
}

// ═══════════════════════════════════════════════════════
//  TIRES (All 24 IDs — rebuilt with src/wheel.js!)
// ═══════════════════════════════════════════════════════

const TIRE_SPECS = {
  s0_wood: { style: 'wood', rimColor: 'wood', tread: 'wood', caliperColor: 0x3b3d42, rack: 'wood', tag: { bg: '#684422', fg: '#f6e8ce', t: 'WOOD', s: '1900s' } },
  s0_rubber: { style: 'steelie', rimColor: 'silver', tread: 'sport', caliperColor: 0x444850, tag: { bg: '#2a2e34', fg: '#e6e8ec', t: 'RUBBER', s: 'BIAS-PLY' } },
  s0_radial: { style: 'steelie', rimColor: 'white', tread: 'rain', stripeColor: '#e8e4d8', caliperColor: 0x565c64, tag: { bg: '#384048', fg: '#ffffff', t: 'RADIAL', s: 'STEEL BELT' } },

  s1_anti: { style: '5spoke', rimColor: 'gunmetal', tread: 'allterrain', caliperColor: 0xd93829, tag: { bg: '#263038', fg: '#ffd04d', t: 'GRIP', s: 'ALL-WEATHER' } },
  s1_semislick: { style: '6spoke', rimColor: 'bronze', tread: 'semi', stripeColor: '#d93829', caliperColor: 0xd93829, tag: { bg: '#5a221c', fg: '#ffffff', t: 'SEMI-R', s: '200TW' } },
  s1_pilot: { style: 'multispoke', rimColor: 'silver', tread: 'sport', stripeColor: '#4c8fe0', sidewallText: true, caliperColor: 0x2668c8, tag: { bg: '#164688', fg: '#ffffff', t: 'PILOT', s: 'MICHELIN' } },

  s2_street: { style: '5spoke', rimColor: 'chrome', tread: 'sport', caliperColor: 0xe68a1e, tag: { bg: '#2b3038', fg: '#ffd038', t: 'STREET', s: 'UHP SPORT' } },
  s2_slick2: { style: 'yspoke', rimColor: 'black', tread: 'slick', caliperColor: 0xd93829, tag: { bg: '#1e1f24', fg: '#ff4e40', t: 'SLICK', s: 'TRACK ONLY' } },
  s2_direzza: { style: '6spoke', rimColor: 'gold', tread: 'semi', stripeColor: '#ffd038', sidewallText: true, caliperColor: 0xc92620, tag: { bg: '#5a4412', fg: '#ffe04d', t: 'DIREZZA', s: 'DUNLOP' } },

  s3_slick3: { style: 'multispoke', rimColor: 'white', tread: 'slick', stripeColor: '#40d66a', caliperColor: 0xc92620, tag: { bg: '#184426', fg: '#80ff9e', t: 'HOT SLICK', s: 'COMPOUND' } },
  s3_potenza: { style: 'yspoke', rimColor: 'gunmetal', tread: 'semi', stripeColor: '#d93829', sidewallText: true, caliperColor: 0xd93829, tag: { bg: '#6e1616', fg: '#ffffff', t: 'POTENZA', s: 'BRIDGESTONE' } },
  s3_carbonwheel: { style: 'yspoke', rimColor: 'carbon', lipColor: 'silver', tread: 'semi', centerLock: true, caliperColor: 0xf2c522, tag: { bg: '#20242a', fg: '#68d4ff', t: 'CARBON', s: 'FORGED CF' } },

  s4_michelin4: { style: 'multispoke', rimColor: 'silver', tread: 'slick', stripeColor: '#4c8fe0', centerLock: true, sidewallText: true, caliperColor: 0xf2c522, tag: { bg: '#164688', fg: '#ffd84d', t: 'COMP', s: 'MICHELIN' } },
  s4_pzero4: { style: 'yspoke', rimColor: 'black', lipColor: 'silver', tread: 'semi', stripeColor: '#ffd038', sidewallText: true, caliperColor: 0xd93829, tag: { bg: '#262418', fg: '#ffd038', t: 'P ZERO', s: 'PIRELLI' } },
  s4_domestic4: { style: '5spoke', rimColor: 'bronze', tread: 'semi', stripeColor: '#eceae2', caliperColor: 0xc92620, tag: { bg: '#522c18', fg: '#f6ebd8', t: '国产半热熔', s: 'SEMI SLICK' } },

  s5_sportcontact: { style: 'multispoke', rimColor: 'chrome', tread: 'rain', stripeColor: '#f2b824', sidewallText: true, caliperColor: 0x2878d8, tag: { bg: '#523c10', fg: '#ffd84d', t: 'CONTI', s: 'SPORTCONT' } },
  s5_trofeo: { style: 'yspoke', rimColor: 'gold', tread: 'semi', stripeColor: '#d93829', centerLock: true, sidewallText: true, caliperColor: 0xc92620, tag: { bg: '#681814', fg: '#ffd84d', t: 'TROFEO R', s: 'PIRELLI' } },
  s5_linglong5: { style: '6spoke', rimColor: 'white', tread: 'semi', stripeColor: '#4c8fe0', caliperColor: 0xe86c1a, tag: { bg: '#183f7a', fg: '#ffffff', t: 'LINGLONG', s: 'SEMI-R' } },

  s6_linglong6: { style: 'aero', rimColor: 'gunmetal', lipColor: 'silver', tread: 'sport', stripeColor: '#39b6e6', caliperColor: 0xc92620, tag: { bg: '#1c3048', fg: '#9ce0ff', t: 'LINGLONG', s: 'EV SPORT' } },
  s6_senqi: { style: 'multispoke', rimColor: 'silver', tread: 'aero_rib', stripeColor: '#eceae2', sidewallText: true, caliperColor: 0x2668c8, tag: { bg: '#1c3e6e', fg: '#ffffff', t: 'SENTURY', s: 'AVIATION' } },
  s6_pilotcup: { style: 'yspoke', rimColor: 'gold', tread: 'semi', stripeColor: '#eceae2', centerLock: true, sidewallText: true, caliperColor: 0xf2c522, tag: { bg: '#1c3e6e', fg: '#ffe04d', t: 'CUP 2 R', s: 'MICHELIN' } },

  s7_f1s: { style: 'f1', rimColor: 'black', lipColor: 'red', tread: 'slick', stripeColor: '#d93829', centerLock: true, carbonDisc: true, sidewallText: true, caliperColor: 0xc92620, tag: { bg: '#8f1814', fg: '#ffffff', t: 'F1 SOFT', s: 'P-ZERO RED' } },
  s7_graphene: { style: 'aero', rimColor: 'carbon', lipColor: 'silver', tread: 'graphene', stripeColor: '#39d8ff', carbonDisc: true, sidewallText: true, caliperColor: 0x39b6e6, tag: { bg: '#103442', fg: '#68f0ff', t: 'GRAPHENE', s: 'NANO TREAD' } },
  s7_carbonceramic: { style: 'yspoke', rimColor: 'carbon', lipColor: 'gold', tread: 'slick', centerLock: true, carbonDisc: true, stripeColor: '#f2c522', caliperColor: 0xf2c522, tag: { bg: '#28261a', fg: '#ffd54a', t: 'CCB-WHEEL', s: 'CARBON-CER' } },
  s8_airless: { style: 'multispoke', rimColor: 'silver', lipColor: 'cyan', tread: 'aero_rib', stripeColor: '#7ae8ff', carbonDisc: true, caliperColor: 0x39d8ff, tag: { bg: '#12283a', fg: '#8ceeff', t: 'AIRLESS', s: 'UPTIS 600' } },
  s8_magpad: { style: 'aero', rimColor: 'carbon', lipColor: 'cyan', tread: 'graphene', centerLock: true, carbonDisc: true, stripeColor: '#68f0ff', caliperColor: 0x39d8ff, tag: { bg: '#0c2434', fg: '#68f0ff', t: 'MAGLEV', s: 'SUPERCOND' } },
};

function buildTire(item) {
  const sp = TIRE_SPECS[item.id] || TIRE_SPECS.s2_street;
  const g = new Group();

  // Tire display rack so wheel sits upright securely on showroom pad
  const rackMat = sp.rack === 'wood' ? P.wood() : P.stand();
  addBox(g, 0.42, 0.04, 0.56, 0, 0.02, 0, rackMat);
  addBox(g, 0.14, 0.14, 0.06, 0, 0.10, -0.24, rackMat, 0.35, 0, 0);
  addBox(g, 0.14, 0.14, 0.06, 0, 0.10, 0.24, rackMat, -0.35, 0, 0);

  const w = buildWheel({
    radius: 0.42,
    width: sp.style === 'wood' ? 0.18 : sp.style === 'f1' ? 0.36 : 0.30,
    style: sp.style,
    rimColor: sp.rimColor,
    lipColor: sp.lipColor || null,
    tread: sp.tread,
    stripeColor: sp.stripeColor || null,
    caliperColor: sp.caliperColor,
    centerLock: !!sp.centerLock,
    carbonDisc: !!sp.carbonDisc,
    sidewallText: !!sp.sidewallText,
  });
  // Place tire facing outward (+Z slightly rotated via garage angle)
  w.position.set(0, 0.44, 0);
  g.add(w);

  // Spec plaque on front of display rack
  if (sp.tag) {
    const bm = makeBadgeMat(`tire:${item.id}`, sp.tag.bg, sp.tag.fg, sp.tag.t, sp.tag.s);
    addBox(g, 0.36, 0.14, 0.02, 0, 0.11, 0.285, bm, -0.25, 0, 0);
  }
  return g;
}

// ═══════════════════════════════════════════════════════
//  ACCESSORIES (All 16 IDs individually sculpted)
// ═══════════════════════════════════════════════════════

function buildAcc(item) {
  const g = new Group();
  const id = item.id;

  if (id === 's0_oil') {
    // Shell Helix bright yellow 4L jug + funnel + mini oil filter
    addBox(g, 0.56, 0.04, 0.42, 0, 0.02, 0, P.dark());
    addBox(g, 0.28, 0.54, 0.20, -0.06, 0.31, 0, P.yellow());
    addBox(g, 0.06, 0.22, 0.06, -0.22, 0.38, 0, P.yellow());
    addCyl(g, 0.045, 0.045, 0.08, -0.01, 0.61, 0, P.red(), 'y', 10);
    const lbl = makeBadgeMat('shell', '#e6bf28', '#d9261e', 'SHELL', 'HELIX 5W-40', '#d9261e');
    addBox(g, 0.22, 0.24, 0.02, -0.06, 0.30, 0.105, lbl);
    // Spin-on oil filter beside it
    addCyl(g, 0.09, 0.09, 0.22, 0.18, 0.15, 0.04, P.blue(), 'y', 12);
    return g;
  }

  if (id === 's0_water') {
    // Aluminum crossflow radiator + dual electric shrouds & cooling fans + coolant tank
    addBox(g, 0.86, 0.05, 0.38, 0, 0.025, 0, P.stand());
    addBox(g, 0.78, 0.54, 0.10, 0, 0.32, 0, P.alloy());
    addBox(g, 0.68, 0.44, 0.11, 0, 0.32, 0, P.cast());
    for (let i = -3; i <= 3; i++) addBox(g, 0.68, 0.018, 0.12, 0, 0.32 + i * 0.055, 0, P.chrome());
    for (const fx of [-0.18, 0.18]) {
      addTorus(g, 0.15, 0.018, fx, 0.32, 0.065, P.dark());
      addCyl(g, 0.04, 0.04, 0.04, fx, 0.32, 0.065, P.dark(), 'z', 8);
      for (let b = 0; b < 5; b++) {
        const fg = new Group();
        fg.position.set(fx, 0.32, 0.065);
        fg.rotation.z = (b * Math.PI * 2) / 5;
        addBox(fg, 0.03, 0.13, 0.015, 0, 0.07, 0, P.black());
        g.add(fg);
      }
    }
    addCyl(g, 0.045, 0.045, 0.05, 0.32, 0.61, 0, P.gold(), 'y', 10);
    return g;
  }

  if (id === 's1_intercooler') {
    // Massive polished Front-Mount Bar-and-Plate Intercooler with blue silicone couplers
    addBox(g, 0.94, 0.05, 0.36, 0, 0.025, 0, P.stand());
    addBox(g, 0.68, 0.38, 0.14, 0, 0.28, 0, P.alloy());
    for (let r = -3; r <= 3; r++) addBox(g, 0.66, 0.022, 0.15, 0, 0.28 + r * 0.048, 0, P.chrome());
    for (const s of [-1, 1]) {
      addBox(g, 0.12, 0.36, 0.14, s * 0.40, 0.28, 0, P.chrome());
      addCyl(g, 0.052, 0.052, 0.16, s * 0.44, 0.42, -0.06, P.blue(), 'x', 10);
      addCyl(g, 0.048, 0.048, 0.18, s * 0.48, 0.50, -0.10, P.chrome(), 'y', 10);
    }
    return g;
  }

  if (id === 's1_spark') {
    // Detailed oversized Iridium Spark Plug on CNC stand (hex shell, ribbed ceramic insulator, electrode & plasma spark!)
    addCyl(g, 0.28, 0.30, 0.05, 0, 0.025, 0, P.stand(), 'y', 16);
    addCyl(g, 0.075, 0.075, 0.14, 0, 0.14, 0, P.chrome(), 'y', 12); // thread body
    addCyl(g, 0.12, 0.12, 0.10, 0, 0.25, 0, P.alloy(), 'y', 6);     // hex nut
    addCyl(g, 0.085, 0.09, 0.28, 0, 0.44, 0, P.ceramic(), 'y', 12); // ceramic
    for (const ry of [0.36, 0.42, 0.48, 0.53]) addTorus(g, 0.094, 0.012, 0, ry, 0, P.ceramic(), Math.PI / 2, 0, 0);
    addBox(g, 0.14, 0.02, 0.06, 0, 0.46, 0.08, P.blue());
    addCyl(g, 0.025, 0.03, 0.09, 0, 0.62, 0, P.gold(), 'y', 10);
    // Glowing blue iridium tip below!
    addCyl(g, 0.015, 0.01, 0.05, 0, 0.06, 0, P.cyanGlow(), 'y', 8);
    return g;
  }

  if (id === 's2_turbo') {
    // Polished Billet Compressor Snail + Bronze Turbine Snail + Connected External Wastegate
    addBox(g, 0.72, 0.05, 0.48, 0, 0.025, 0, P.stand());
    addBox(g, 0.14, 0.28, 0.16, 0, 0.18, 0, P.alloy()); // CHRA pedestal
    addCyl(g, 0.07, 0.07, 0.22, 0, 0.34, 0, P.dark(), 'x', 12); // CHRA cartridge
    addTorus(g, 0.19, 0.085, -0.15, 0.34, 0, P.chrome(), 0, Math.PI / 2, 0); // Compressor
    addCyl(g, 0.11, 0.11, 0.12, -0.22, 0.34, 0, P.chrome(), 'x', 12);
    addCyl(g, 0.06, 0.06, 0.24, -0.15, 0.52, 0.12, P.chrome(), 'y', 10);
    // Visible compressor wheel blades inside inlet!
    for (let k = 0; k < 6; k++) {
      const bg = new Group(); bg.position.set(-0.27, 0.34, 0); bg.rotation.x = (k * Math.PI) / 3;
      addBox(bg, 0.02, 0.08, 0.025, 0, 0.04, 0, P.ice());
      g.add(bg);
    }
    addTorus(g, 0.16, 0.072, 0.15, 0.34, 0, P.copper(), 0, Math.PI / 2, 0); // Turbine housing
    // Connected Wastegate manifold + rod + red diaphragm cap
    addCyl(g, 0.032, 0.032, 0.18, 0.10, 0.45, -0.08, P.chrome(), 'y', 8);
    addBox(g, 0.14, 0.04, 0.10, 0.04, 0.48, -0.04, P.alloy());
    addCyl(g, 0.065, 0.065, 0.10, 0.04, 0.54, -0.08, P.red(), 'y', 10);
    return g;
  }

  if (id === 's2_wing') {
    // High-Downforce GT Carbon Rear Wing on Aluminum Uprights
    addBox(g, 0.62, 0.04, 0.46, 0, 0.02, 0, P.stand());
    for (const z of [-0.22, 0.22]) {
      addBox(g, 0.10, 0.54, 0.03, -0.02, 0.30, z, P.alloy(), 0, 0, -0.18);
    }
    addBox(g, 0.32, 0.04, 1.06, 0.04, 0.56, 0, P.carbon(), 0, 0, 0.14);
    for (const s of [-1, 1]) addBox(g, 0.36, 0.18, 0.03, 0.04, 0.56, s * 0.54, P.red());
    return g;
  }

  if (id === 's3_dct') {
    // Cutaway 7-Speed Dual-Clutch Gearbox showing concentric twin clutches & helical gearset!
    addBox(g, 0.94, 0.05, 0.48, 0, 0.025, 0, P.stand());
    // Bellhousing cutaway
    addCyl(g, 0.24, 0.20, 0.28, -0.26, 0.26, 0, P.alloy(), 'x', 14);
    addCyl(g, 0.18, 0.18, 0.06, -0.34, 0.26, 0, P.copper(), 'x', 14); // Clutch K1
    addCyl(g, 0.13, 0.13, 0.08, -0.30, 0.26, 0, P.red(), 'x', 14);    // Clutch K2
    // Stepped alloy gearbox casing + visible gear stack
    addBox(g, 0.48, 0.34, 0.32, 0.14, 0.25, 0, P.cast());
    for (let i = 0; i < 6; i++) {
      addCyl(g, 0.11 - i * 0.008, 0.11 - i * 0.008, 0.035, -0.04 + i * 0.068, 0.30, 0.10, P.chrome(), 'x', 12);
    }
    addCyl(g, 0.055, 0.055, 0.16, 0.44, 0.22, 0, P.chrome(), 'x', 10);
    return g;
  }

  if (id === 's3_ground') {
    // Full Carbon Venturi Floor + Multi-Strake Rear Diffuser!
    addBox(g, 0.96, 0.04, 0.72, 0, 0.08, 0, P.carbon());
    for (const s of [-1, 1]) addBox(g, 0.96, 0.09, 0.03, 0, 0.12, s * 0.36, P.red());
    // Sculpted upturned rear Venturi diffuser strakes
    addBox(g, 0.34, 0.04, 0.70, -0.34, 0.16, 0, P.carbon(), 0, 0, -0.35);
    for (let i = -2; i <= 2; i++) {
      addBox(g, 0.32, 0.14, 0.025, -0.34, 0.12, i * 0.14, P.carbon());
    }
    addBox(g, 0.24, 0.02, 0.32, 0.18, 0.11, 0, makeBadgeMat('ground', '#1b2026', '#68e0ff', 'VENTURI', 'GROUND EFF'));
    return g;
  }

  if (id === 's4_bms4') {
    // Liquid Cooling Cold-Plate Manifold + Orange HV + BMS Telemetry Controller
    addBox(g, 0.86, 0.05, 0.56, 0, 0.025, 0, P.stand());
    addBox(g, 0.78, 0.06, 0.48, 0, 0.10, 0, P.alloy()); // Serpentine cold plate
    for (let i = -2; i <= 2; i++) addCyl(g, 0.016, 0.016, 0.72, 0, 0.14, i * 0.08, P.ice(), 'x', 8);
    // BMS Control Box with glowing LED bars
    addBox(g, 0.38, 0.14, 0.32, -0.10, 0.24, 0, P.dark());
    addBox(g, 0.30, 0.02, 0.22, -0.10, 0.315, 0, makeBadgeMat('bms4', '#0e2d3b', '#68f0ff', 'BMS THERMAL', 'PID COOL'));
    // Dual coolant manifold ports
    for (const z of [-0.14, 0.14]) addCyl(g, 0.035, 0.035, 0.18, 0.30, 0.20, z, P.blue(), 'y', 8);
    return g;
  }

  if (id === 's4_launchctl') {
    // Racing Steering-Column Shift-Light Tach + Launch Control ECU + Red Launch Button
    addBox(g, 0.72, 0.05, 0.50, 0, 0.025, 0, P.stand());
    addBox(g, 0.56, 0.24, 0.12, 0, 0.26, -0.06, P.carbon(), -0.32, 0, 0);
    const disp = makeBadgeMat('lc', '#0b1014', '#40ff7a', '6500 RPM', 'LAUNCH RDY');
    addBox(g, 0.46, 0.15, 0.02, 0, 0.26, 0.005, disp, -0.32, 0, 0);
    // Sequential shift lights (green-yellow-red)
    for (let i = 0; i < 5; i++) {
      const lm = i < 2 ? P.green() : i < 4 ? P.yellow() : P.red();
      addCyl(g, 0.022, 0.022, 0.03, -0.16 + i * 0.08, 0.38, -0.04, lm, 'z', 8);
    }
    // Red Launch Pushbutton Pedestal
    addBox(g, 0.22, 0.08, 0.20, 0, 0.09, 0.16, P.alloy());
    addCyl(g, 0.055, 0.055, 0.05, 0, 0.145, 0.16, P.red(), 'y', 12);
    return g;
  }

  if (id === 's5_carbon5') {
    // Carbon Fiber Aero Kit Display: Front Canards/Splitter + Hood Louvers + Carbon Mirror Caps
    addBox(g, 0.90, 0.04, 0.58, 0, 0.05, 0, P.carbon()); // Carbon front splitter
    addBox(g, 0.92, 0.02, 0.04, 0, 0.05, 0.29, P.red());
    // Pair of carbon aero mirror caps
    for (const s of [-1, 1]) {
      addBox(g, 0.18, 0.11, 0.12, s * 0.30, 0.14, -0.08, P.carbon());
      addBox(g, 0.16, 0.08, 0.03, s * 0.40, 0.14, 0.14, P.carbon(), 0, s * 0.3, 0.2);
    }
    // Angled carbon vented hood panel on display stand
    addBox(g, 0.48, 0.04, 0.36, 0, 0.32, -0.12, P.carbon(), 0.45, 0, 0);
    for (let i = -1; i <= 1; i++) addBox(g, 0.32, 0.02, 0.04, 0, 0.34 + i * 0.04, -0.10 - i * 0.07, P.dark(), 0.45, 0, 0);
    return g;
  }

  if (id === 's5_actwing') {
    // Active DRS Dual-Plane Swan-Neck Hydraulic Wing!
    addBox(g, 0.68, 0.05, 0.46, 0, 0.025, 0, P.stand());
    for (const z of [-0.20, 0.20]) {
      addBox(g, 0.08, 0.58, 0.03, -0.06, 0.34, z, P.alloy());
      addCyl(g, 0.02, 0.02, 0.28, 0.06, 0.38, z, P.chrome(), 'y', 8, 0, 0, -0.25); // hydraulic actuator
    }
    addBox(g, 0.26, 0.035, 1.08, 0.02, 0.56, 0, P.carbon(), 0, 0, 0.08);
    addBox(g, 0.18, 0.03, 1.08, -0.08, 0.69, 0, P.carbon(), 0, 0, 0.38); // DRS flap raised!
    for (const s of [-1, 1]) addBox(g, 0.38, 0.24, 0.03, -0.02, 0.62, s * 0.55, P.gold());
    return g;
  }

  if (id === 's6_regen') {
    // KERS / MGU-K Kinetic Energy Recovery Flywheel + Orange Inverter
    addBox(g, 0.78, 0.05, 0.48, 0, 0.025, 0, P.stand());
    addCyl(g, 0.22, 0.22, 0.16, -0.14, 0.28, 0, P.dark(), 'x', 16);
    addCyl(g, 0.18, 0.18, 0.18, -0.14, 0.28, 0, P.gold(), 'x', 16); // brass/gold high-speed flywheel
    addCyl(g, 0.14, 0.14, 0.28, 0.16, 0.24, 0, P.ice(), 'x', 14); // MGU-K
    addBox(g, 0.28, 0.12, 0.26, 0.16, 0.42, 0, P.orangeHV());
    addBox(g, 0.22, 0.02, 0.18, 0.16, 0.485, 0, makeBadgeMat('mguk', '#22262c', '#68f0ff', 'MGU-K', 'REGEN'));
    return g;
  }

  if (id === 's6_supercap') {
    // Precision Anodized CNC-Finned 800V SiC Ultracapacitor Power Module (zero cheap AA cylinders!)
    addBox(g, 0.90, 0.05, 0.56, 0, 0.025, 0, P.stand());
    addBox(g, 0.84, 0.08, 0.50, 0, 0.09, 0, P.alloy()); // CNC heatsink baseplate
    for (let i = -3; i <= 3; i++) addBox(g, 0.82, 0.05, 0.02, 0, 0.145, i * 0.068, P.cast()); // CNC fins
    // Sealed stepped carbon dielectric housing + copper busbar window
    addBox(g, 0.64, 0.14, 0.42, -0.04, 0.21, 0, P.carbon());
    addBox(g, 0.44, 0.02, 0.26, -0.04, 0.285, 0, makeBadgeMat('scap', '#0e283b', '#68f0ff', '800V SiC', 'ULTRACAP MODULE'));
    // Twin Amphenol HV orange connectors & braided bus leads
    for (const z of [-0.12, 0.12]) {
      addBox(g, 0.12, 0.08, 0.10, 0.34, 0.19, z, P.orangeHV());
      addCyl(g, 0.026, 0.026, 0.12, 0.42, 0.19, z, P.orangeHV(), 'x', 10);
    }
    return g;
  }

  if (id === 's8_xiaomi_track') {
    // Xiaomi Track Aero Kit: Carbon Front Splitter + Canards + 5-Strake Venturi Diffuser + Giant Swan-Neck GT Wing!
    addBox(g, 0.94, 0.04, 0.68, 0, 0.02, 0, P.stand());
    // 1. Carbon Front Splitter & Side Dive Canards (+X)
    addBox(g, 0.40, 0.04, 0.84, 0.30, 0.08, 0, P.carbon());
    addBox(g, 0.06, 0.045, 0.86, 0.48, 0.08, 0, P.yellow()); // racing lip stripe
    for (const s of [-1, 1]) addBox(g, 0.20, 0.03, 0.14, 0.28, 0.16, s * 0.44, P.carbon(), 0, s * 0.2, 0.15);
    // 2. Sculpted Multi-Strake Rear Venturi Diffuser (-X)
    addBox(g, 0.38, 0.04, 0.72, -0.28, 0.14, 0, P.carbon(), 0, 0, -0.32);
    for (let i = -2; i <= 2; i++) addBox(g, 0.36, 0.14, 0.025, -0.28, 0.10, i * 0.14, P.carbon());
    // 3. Towering Swan-Neck Carbon GT Wing + Endplates
    for (const z of [-0.20, 0.20]) {
      addBox(g, 0.08, 0.56, 0.03, -0.06, 0.36, z, P.alloy(), 0, 0, -0.14);
    }
    addBox(g, 0.30, 0.04, 1.06, -0.02, 0.62, 0, P.carbon(), 0, 0, 0.12);
    for (const s of [-1, 1]) addBox(g, 0.34, 0.20, 0.03, -0.02, 0.62, s * 0.54, P.yellow());
    addBox(g, 0.24, 0.02, 0.34, 0.22, 0.105, 0, makeBadgeMat('xmaero', '#141a24', '#ffd84d', 'TRACK AERO', 'XIAOMI KIT'));
    return g;
  }

  if (id === 's8_magchassis') {
    // Superconducting Maglev Active Underbody Skid Array
    addBox(g, 0.92, 0.05, 0.66, 0, 0.025, 0, P.stand());
    addBox(g, 0.84, 0.06, 0.58, 0, 0.10, 0, P.carbon());
    for (const [mx, mz] of [[-0.28, -0.20], [-0.28, 0.20], [0.28, -0.20], [0.28, 0.20]]) {
      addCyl(g, 0.13, 0.13, 0.06, mx, 0.14, mz, P.copper(), 'y', 14);
      addTorus(g, 0.14, 0.015, mx, 0.17, mz, P.cyanGlow(), Math.PI / 2, 0, 0);
    }
    addBox(g, 0.30, 0.02, 0.18, 0, 0.14, 0, makeBadgeMat('magch', '#092436', '#68f0ff', 'MAGLEV', 'ZERO DRAG'));
    return g;
  }

  if (id === 's7_vector') {
    // Torque Vectoring Quad-Axle Frame with Differential & Glowing Cyan Torque Arcs
    addBox(g, 0.86, 0.05, 0.68, 0, 0.025, 0, P.stand());
    addBox(g, 0.62, 0.08, 0.08, 0, 0.22, 0, P.carbon());
    addBox(g, 0.08, 0.08, 0.62, 0, 0.22, 0, P.carbon());
    for (const [mx, mz] of [[-0.28, -0.26], [-0.28, 0.26], [0.28, -0.26], [0.28, 0.26]]) {
      addCyl(g, 0.10, 0.10, 0.14, mx, 0.22, mz, P.gold(), 'z', 12);
      addTorus(g, 0.11, 0.014, mx, 0.22, mz, P.cyanGlow());
    }
    addBox(g, 0.28, 0.12, 0.24, 0, 0.31, 0, P.dark());
    addBox(g, 0.22, 0.02, 0.16, 0, 0.375, 0, makeBadgeMat('vec', '#103448', '#68f0ff', 'TV-QUAD', 'VECTORING'));
    return g;
  }

  if (id === 's7_coldgas') {
    // SpaceX Cold-Gas Thruster Pod: Titanium COPV Sphere + Cradle + Dual De-Laval Nozzles
    addBox(g, 0.72, 0.05, 0.50, 0, 0.025, 0, P.stand());
    addCyl(g, 0.14, 0.18, 0.10, -0.14, 0.09, 0, P.alloy(), 'y', 14);
    const sphere = new Mesh(new SphereGeometry(0.20, 14, 10), P.carbon());
    sphere.position.set(-0.14, 0.28, 0);
    g.add(sphere);
    addTorus(g, 0.205, 0.014, -0.14, 0.28, 0, P.ice(), Math.PI / 2, 0, 0);
    addCyl(g, 0.032, 0.032, 0.24, 0.08, 0.28, 0, P.chrome(), 'x', 10);
    addBox(g, 0.10, 0.22, 0.24, 0.17, 0.26, 0, P.dark()); // Valve manifold block
    addBox(g, 0.10, 0.14, 0.14, 0.17, 0.10, 0, P.alloy()); // Manifold support
    // Triple thruster cluster aiming +X
    for (const [ny, nz] of [[0.34, 0], [0.22, -0.10], [0.22, 0.10]]) {
      addCyl(g, 0.03, 0.068, 0.18, 0.26, ny, nz, P.chrome(), 'x', 12);
      addCyl(g, 0.05, 0.05, 0.03, 0.35, ny, nz, P.cyanGlow(), 'x', 12);
    }
    return g;
  }

  // Fallback
  addBox(g, 0.6, 0.4, 0.4, 0, 0.22, 0, P.alloy());
  return g;
}

export function buildPartPreview(cat, item) {
  if (!item) return new Group();
  let g;
  if (cat === 'engines') g = buildEngine(item);
  else if (cat === 'fuels') g = buildFuel(item);
  else if (cat === 'tires') g = buildTire(item);
  else g = buildAcc(item);
  g.userData.previewKind = cat;
  return g;
}

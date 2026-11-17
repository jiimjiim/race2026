import {
  BoxGeometry,
  CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  NearestFilter,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
} from 'three';

export function eraOf(seasonIndex) {
  if (seasonIndex < 2) return 0;
  if (seasonIndex < 4) return 1;
  if (seasonIndex < 6) return 2;
  if (seasonIndex < 7) return 3;
  return 4;
}

export const ERA_THEMES = [
  // Era 0 (2001-2006): Warm golden autumn industrial town & bustling street shops
  {
    sky: 0xe6cfa8, fog: 0xe8d5b5, fogNear: 78, fogFar: 245,
    ground: 0x6f6c4e, hemiSky: 0xfff1d6, hemiGround: 0x5c4f38, hemiI: 2.3,
    sun: 0xffd79b, sunI: 3.1, rim: 0xffc482,
    hillCols: [0x6e6c4d, 0x5d6245],
    groundStripeA: '#6c6848', groundStripeB: '#777150', groundPatch: '#5a5f42',
    lampColor: 0xffe4a0, lampEmissive: 0xffb848, lampEmissiveI: 0.7,
    treeCols: [0xc48b28, 0x59733d, 0xd8a336],
  },
  // Era 1 (2007-2012): Crisp azure Olympic & Expo metropolis
  {
    sky: 0xa4cee8, fog: 0xbfe0f2, fogNear: 82, fogFar: 260,
    ground: 0x4f6d4a, hemiSky: 0xeaf6ff, hemiGround: 0x495b42, hemiI: 2.5,
    sun: 0xfff5dc, sunI: 3.2, rim: 0xa4d4ff,
    hillCols: [0x4c6858, 0x3e5950],
    groundStripeA: '#4d6c48', groundStripeB: '#55754e', groundPatch: '#66765f',
    lampColor: 0xfff4d4, lampEmissive: 0xffeaad, lampEmissiveI: 0.55,
    treeCols: [0x386a42, 0x4b7c4e, 0x2f5a3a],
  },
  // Era 2 (2013-2018): Modern riverside high-speed rail & clean industrial corridor
  {
    sky: 0xbcd4e4, fog: 0xd0e2ee, fogNear: 85, fogFar: 265,
    ground: 0x4f5f54, hemiSky: 0xedf6ff, hemiGround: 0x465258, hemiI: 2.4,
    sun: 0xfff3de, sunI: 2.9, rim: 0x9bc8ff,
    hillCols: [0x465a63, 0x3b4d57],
    groundStripeA: '#4d5d53', groundStripeB: '#55655b', groundPatch: '#3f5162',
    lampColor: 0xeef8ff, lampEmissive: 0xbfe4ff, lampEmissiveI: 0.75,
    treeCols: [0x325e46, 0x446f54, 0x2d5040],
  },
  // Era 3 (2019-2024): Electric twilight cyber-smart city & neon EV hubs
  {
    sky: 0x1a2340, fog: 0x222d50, fogNear: 68, fogFar: 235,
    ground: 0x242c3c, hemiSky: 0x6280c8, hemiGround: 0x1a1d28, hemiI: 1.9,
    sun: 0x99b8ff, sunI: 2.0, rim: 0x4be2ff,
    hillCols: [0x1c253d, 0x151d32],
    groundStripeA: '#232a3a', groundStripeB: '#283144', groundPatch: '#1c2433',
    lampColor: 0x92f0ff, lampEmissive: 0x3ad8ff, lampEmissiveI: 1.5,
    treeCols: [0x1f4947, 0x285654, 0x1b3a44],
  },
  // Era 4 (2025-2027): Crystalline zero-carbon eco-oasis & sky-port future
  {
    sky: 0xcbeeff, fog: 0xe2f6ff, fogNear: 90, fogFar: 280,
    ground: 0x5c8067, hemiSky: 0xffffff, hemiGround: 0x5a7360, hemiI: 2.6,
    sun: 0xffffff, sunI: 3.1, rim: 0x9ff2ff,
    hillCols: [0x6c8ca0, 0x58788c],
    groundStripeA: '#5b7e65', groundStripeB: '#65886f', groundPatch: '#73987d',
    lampColor: 0xdffeff, lampEmissive: 0x76f2ff, lampEmissiveI: 1.0,
    treeCols: [0x3c7d58, 0x4d9268, 0x5ca477],
  },
];

export const ERA_ADS = [
  [
    ['桑塔纳', '拥有桑塔纳 走遍天下都不怕', '#d9d5c9', '#8e1210'],
    ['捷达', '老三样里的硬骨头', '#e8e6df', '#24479a'],
    ['奇瑞 QQ', '年轻人的第一辆车', '#e2c62f', '#1c1e22'],
    ['汽配老街', '补胎 换机油 钣金喷漆', '#5a6068', '#e8e6df'],
    ['夏利', '省油耐用国民小车', '#a8221e', '#f2efe4'],
  ],
  [
    ['北京 2008', '同一个世界 同一个梦想', '#c01f1a', '#f2efe4'],
    ['上海世博', '城市，让生活更美好', '#1f4e9c', '#e8e6df'],
    ['涡轮时代', '排量不是一切', '#1c1e22', '#e2c62f'],
    ['自主芯', 'ACTECO 点火成功', '#b3221d', '#f2efe4'],
    ['新能源', '十城千辆 示范起步', '#2f6b4f', '#e8e6df'],
  ],
  [
    ['复兴号', '350 km/h 贴地飞行', '#1d4c9c', '#f2efe4'],
    ['新能源', '免购置税 送绿牌', '#2f6b4f', '#e8e6df'],
    ['五菱宏光', '秋名山神车在此', '#b8bcc0', '#24479a'],
    ['跨海大桥', '天堑变通途', '#284a70', '#f0f4f8'],
    ['中国制造', '涡扇混动齐发力', '#434b54', '#e8e4d8'],
  ],
  [
    ['智能网联', '城市 NOA 夜间领航', '#111c33', '#52e8ff'],
    ['5G 基站', '超低时延 车路协同', '#1d1035', '#ff5ea8'],
    ['三分钟换电', '满电即刻出发', '#0f2f3f', '#64f8c8'],
    ['高阶算力', '算力时代全面降临', '#182442', '#ffd15c'],
    ['低空经济', '地面堵车 空中超车', '#1c243b', '#86e8ff'],
  ],
  [
    ['兆瓦超充', '充电五分钟 续航八百里', '#184b96', '#f2f9ff'],
    ['全固态', '能量密度 450 Wh/kg', '#1f6f52', '#ecfff6'],
    ['零碳纪元', '风光储充一体化赛道', '#255873', '#d6f8ff'],
    ['Vision GT', '中国超跑风洞新纪元', '#1b2430', '#70e8ff'],
    ['eVTOL', '立体出行 垂直起降', '#334d5c', '#f4fbff'],
  ],
];

const TEX = {};
export function canvasTex(key, w, h, draw, repeat = false) {
  if (key && TEX[key]) return TEX[key];
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  draw(ctx, w, h);
  const t = new CanvasTexture(c);
  t.magFilter = NearestFilter;
  t.minFilter = NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = RepeatWrapping;
  if (key) TEX[key] = t;
  return t;
}

function matStd(color, extra = {}) {
  return new MeshStandardMaterial({ color, roughness: 0.78, flatShading: true, ...extra });
}

function box(color, w, h, d, x = 0, y = 0, z = 0, mat = null) {
  const m = new Mesh(new BoxGeometry(w, h, d), mat || matStd(color));
  m.position.set(x, y, z);
  return m;
}

export function adTexture(title, sub, bg, fg) {
  return canvasTex(`ad:${title}:${sub}:${bg}`, 256, 128, (ctx, w, h) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = fg;
    ctx.fillRect(0, 0, w, 10);
    ctx.fillRect(0, h - 10, w, 10);
    ctx.font = 'bold 34px SimSun, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(title, w / 2, 58);
    ctx.font = '17px SimSun, monospace';
    ctx.fillText(sub, w / 2, 88);
    ctx.globalAlpha = 0.2;
    for (let i = 0; i < 6; i++) ctx.fillRect(12 + i * 40, 104, 22, 6);
    ctx.globalAlpha = 1;
  });
}

function signPlane(title, sub, bg, fg, w = 6.4, h = 3.2) {
  return new Mesh(
    new PlaneGeometry(w, h),
    new MeshStandardMaterial({ map: adTexture(title, sub, bg, fg), roughness: 0.75 })
  );
}

export function groundTexture(era) {
  const th = ERA_THEMES[era];
  return canvasTex(`ground:${era}`, 128, 128, (ctx, w, h) => {
    ctx.fillStyle = th.groundStripeA;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = th.groundStripeB;
    for (let x = 0; x < w; x += 16) ctx.fillRect(x, 0, 8, h);
    ctx.fillStyle = th.groundPatch;
    for (let y = 0; y < h; y += 16) {
      for (let x = (y % 32 === 0 ? 4 : 12); x < w; x += 24) {
        ctx.fillRect(x, y, 7, 7);
      }
    }
    if (era === 3) {
      // Subtle cyber sidewalk grid
      ctx.fillStyle = 'rgba(72, 224, 255, 0.14)';
      ctx.fillRect(0, 0, w, 2);
      ctx.fillRect(0, 64, w, 2);
    } else if (era === 4) {
      // Eco path ribbon
      ctx.fillStyle = 'rgba(235, 252, 245, 0.18)';
      ctx.fillRect(0, 20, w, 6);
    }
  }, true);
}

export function buildingTexture(era, variant) {
  const key = `bld:${era}:${variant}`;
  const conf = [
    [['#9e7356', '#b89674', '#7e6a58'], '#2b241d', '#ffe29c', false],
    [['#c5cfd4', '#a8b7c0', '#dde3e6'], '#2c3d49', '#fff3cf', false],
    [['#6e8da0', '#547386', '#84a2b4'], '#1b2b38', '#bfe8ff', false],
    [['#182034', '#1d2740', '#121829'], '#0d111e', variant % 2 ? '#52e8ff' : '#ff5ea8', true],
    [['#d8e7eb', '#c1d9df', '#ebf4f6'], '#2f5364', '#96ffd8', true],
  ][era];
  const [bases, win, lit, neonBand] = conf;
  const base = bases[variant % bases.length];
  return canvasTex(key, 96, 192, (ctx, w, h) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.15; ctx.fillStyle = '#fff';
    ctx.fillRect(w / 3, 0, 3, h);
    ctx.fillRect(2 * w / 3, 0, 3, h);
    ctx.globalAlpha = 1;
    for (let y = 10; y < h - 12; y += 14) {
      for (let x = 8; x < w - 8; x += 14) {
        const isLit = ((x * 3 + y * 7 + era * 5 + variant) % 4 === 0);
        ctx.fillStyle = isLit ? lit : win;
        ctx.globalAlpha = isLit ? 0.95 : 0.72;
        ctx.fillRect(x, y, 8, 8);
      }
    }
    if (neonBand) {
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = lit;
      ctx.fillRect(0, 4, w, 4);
      ctx.fillRect(0, h / 2, w, 3);
    }
    ctx.globalAlpha = 1;
  }, true);
}

// ---------- Distant Horizon / Mountains / City Landmarks ----------
function buildDistantHorizon(scene, era) {
  const hills = [];
  const th = ERA_THEMES[era];
  if (era === 2) {
    // River water ribbon + embankment along z = -85
    const river = new Mesh(
      new PlaneGeometry(14000, 38),
      new MeshStandardMaterial({ color: 0x39688c, roughness: 0.25, metalness: 0.45 })
    );
    river.rotation.x = -Math.PI / 2;
    river.position.set(0, -0.02, -88);
    scene.add(river);
    const bank = box(0x7c848a, 14000, 0.7, 3.2, 0, 0.3, -68);
    scene.add(bank);
  } else if (era === 3) {
    // Neon waterfront channel
    const canal = new Mesh(
      new PlaneGeometry(14000, 26),
      new MeshStandardMaterial({ color: 0x10243d, roughness: 0.2, metalness: 0.55 })
    );
    canal.rotation.x = -Math.PI / 2;
    canal.position.set(0, -0.01, -64);
    scene.add(canal);
    const railGlow = new Mesh(
      new BoxGeometry(14000, 0.14, 0.18),
      new MeshStandardMaterial({ color: 0x3ad8ff, emissive: 0x1ca8e8, emissiveIntensity: 1.3 })
    );
    railGlow.position.set(0, 0.22, -51);
    scene.add(railGlow);
  }

  // Sculpted stepped ridge mountains / city silhouettes
  for (let i = 0; i < 16; i++) {
    const col = th.hillCols[i % th.hillCols.length];
    const hMat = matStd(col, { roughness: 0.95 });
    const grp = new Group();
    const r = 24 + (i % 4) * 9;
    const h = era === 4 ? 22 + (i % 4) * 9 : 14 + (i % 4) * 7;
    const peak = new Mesh(new ConeGeometry(r, h, 5), hMat);
    peak.scale.set(1.75, 1, 0.65);
    peak.position.y = h * 0.45 - 0.5;
    grp.add(peak);
    if (era === 4 && h > 25) {
      const snowCap = new Mesh(new ConeGeometry(r * 0.44, h * 0.42, 5), matStd(0xf2f8ff));
      snowCap.scale.set(1.75, 1, 0.65);
      snowCap.position.y = h * 0.72;
      grp.add(snowCap);
    }
    grp.position.set(i * 42 - 140, 0, -108 - (i % 2) * 18);
    scene.add(grp);
    hills.push(grp);
  }
  return hills;
}

// ---------- Era Skylines (Buildings) ----------
function buildSkyline(scene, era) {
  const buildings = [];
  const steelMat = matStd(0x606870, { metalness: 0.5, roughness: 0.5 });
  for (let i = 0; i < 18; i++) {
    const b = new Group();
    const bTex = buildingTexture(era, i % 3);
    const bMat = new MeshStandardMaterial({ map: bTex, roughness: era >= 2 ? 0.55 : 0.9 });
    if (era === 0) {
      // Era 0: Classic 90s-2000s brick Tongzilou apartment blocks & old factory warehouses
      const w = 10 + (i % 3) * 3;
      const h = 7 + (i % 3) * 3.5;
      b.add(box(0, w, h, 7.5, 0, h / 2, 0, bMat));
      // Pitched terracotta tile roof
      const roof = new Mesh(new ConeGeometry(w * 0.68, 2.2, 4), matStd(i % 2 ? 0x8f3a28 : 0x56646c));
      roof.rotation.y = Math.PI / 4;
      roof.scale.set(1.1, 1, 0.85);
      roof.position.y = h + 1.1;
      b.add(roof);
      if (i % 3 === 0) {
        const tank = new Mesh(new CylinderGeometry(0.9, 0.9, 1.8, 8), matStd(0x88949a));
        tank.position.set(w * 0.25, h + 1.8, 0);
        b.add(tank);
      }
      b.position.set(i * 28 - 110, 0, -34 - (i % 2) * 8);
    } else if (era === 1) {
      // Era 1: Lujiazui-inspired skyline (Oriental Pearl sphere tower + Jin Mao stepped skyscraper)
      if (i % 6 === 0) {
        // Pearl-style twin sphere TV tower
        const core = new Mesh(new CylinderGeometry(0.7, 1.4, 34, 10), matStd(0xd8dde4, { metalness: 0.4 }));
        core.position.y = 17; b.add(core);
        const s1 = new Mesh(new SphereGeometry(3.2, 12, 10), matStd(0xc82c58, { roughness: 0.35 }));
        s1.position.y = 11; b.add(s1);
        const s2 = new Mesh(new SphereGeometry(2.3, 12, 10), matStd(0xc82c58, { roughness: 0.35 }));
        s2.position.y = 22; b.add(s2);
        const spire = new Mesh(new CylinderGeometry(0.1, 0.45, 9, 6), matStd(0xeaecef));
        spire.position.y = 37; b.add(spire);
      } else {
        const w = 10 + (i % 3) * 3;
        const h = 15 + (i % 4) * 6;
        b.add(box(0, w, h, 8, 0, h / 2, 0, bMat));
        const step = box(0, w * 0.68, h * 0.36, 5.8, 0, h + h * 0.18, 0, bMat);
        b.add(step);
        const spire = new Mesh(new CylinderGeometry(0.08, 0.3, 5, 6), steelMat);
        spire.position.y = h * 1.36 + 2.5;
        b.add(spire);
      }
      b.position.set(i * 28 - 110, 0, -44 - (i % 3) * 7);
    } else if (era === 2) {
      // Era 2: Gleaming glass CBD towers with angled crowns behind viaduct
      const w = 11 + (i % 3) * 3;
      const h = 18 + (i % 4) * 7;
      b.add(box(0, w, h, 8, 0, h / 2, 0, bMat));
      const tier = box(0, w * 0.72, h * 0.35, 6, 0, h + h * 0.175, 0, bMat);
      b.add(tier);
      const crown = box(0x3a6a94, w * 0.74, 0.7, 6.2, 0, h * 1.35 + 0.35, 0);
      b.add(crown);
      b.position.set(i * 28 - 110, 0, -48 - (i % 3) * 8);
    } else if (era === 3) {
      // Era 3: Neon cyber skyline with vertical LED beacons
      const w = 10 + (i % 3) * 3;
      const h = 22 + (i % 4) * 9;
      b.add(box(0, w, h, 8.5, 0, h / 2, 0, bMat));
      const neonCol = i % 2 ? 0x42e8ff : 0xff4fa8;
      const neonMat = new MeshStandardMaterial({ color: neonCol, emissive: neonCol, emissiveIntensity: 1.4, roughness: 0.3 });
      b.add(box(0, 0.35, h * 0.9, 0.35, w * 0.48, h * 0.46, 4.3, neonMat));
      b.add(box(0, w * 0.85, 0.45, 8.7, 0, h + 0.22, 0, neonMat));
      if (i % 3 === 0) {
        const upper = box(0, w * 0.62, 10, 5.5, 0, h + 5, 0, bMat);
        b.add(upper);
        b.add(box(0, w * 0.66, 0.4, 5.7, 0, h + 10.2, 0, neonMat));
      }
      b.position.set(i * 27 - 110, 0, -38 - (i % 3) * 9);
    } else {
      // Era 4: Clean white/teal eco-arcology spires with sky gardens
      const w = 11 + (i % 3) * 3;
      const h = 20 + (i % 4) * 8;
      b.add(box(0, w, h, 8, 0, h / 2, 0, bMat));
      const greenTerrace = box(0x3b8a5c, w + 0.8, 0.7, 8.6, 0, h * 0.62, 0);
      b.add(greenTerrace);
      const topGlass = new Mesh(new CylinderGeometry(w * 0.25, w * 0.45, 7, 6), matStd(0xbaf2ff, { roughness: 0.25 }));
      topGlass.position.y = h + 3.5;
      b.add(topGlass);
      b.position.set(i * 28 - 110, 0, -40 - (i % 3) * 8);
    }
    scene.add(b);
    buildings.push(b);
  }
  return buildings;
}

// ---------- Era Landmarks & Animated Props ----------
function makeBrickFactory(smokeList) {
  const g = new Group();
  const brick = matStd(0x9a4c38);
  const roof = matStd(0x525a60);
  g.add(box(0, 18, 6.5, 9, 0, 3.25, 0, brick));
  // Sawtooth factory roof ridges
  for (let s = -5.5; s <= 5.5; s += 5.5) {
    const ridge = new Mesh(new ConeGeometry(3.2, 2.2, 4), roof);
    ridge.rotation.y = Math.PI / 4;
    ridge.position.set(s, 7.5, 0);
    g.add(ridge);
  }
  // Twin tall smokestacks with puffs
  for (const cx of [-6, 6]) {
    const stack = new Mesh(new CylinderGeometry(0.65, 1.05, 16, 10), matStd(0x883b2a));
    stack.position.set(cx, 8, -2);
    g.add(stack);
    g.add(new Mesh(new CylinderGeometry(0.8, 0.8, 0.6, 10), matStd(0xe8e2d4))).position?.set(cx, 15.2, -2);
    for (let k = 0; k < 3; k++) {
      const puff = new Mesh(new SphereGeometry(0.8 + k * 0.35, 7, 6), matStd(0xeae6de));
      puff.position.set(cx + k * 1.1, 17.2 + k * 1.4, -2);
      puff.userData = { baseX: cx, baseY: 16.8, baseZ: -2, phase: k * 0.33 };
      g.add(puff);
      smokeList.push(puff);
    }
  }
  const sign = signPlane('汽车配件厂', '2001 国产化起步', '#8e1210', '#f4e6c0', 7.5, 2.1);
  sign.position.set(0, 4.4, 4.6);
  g.add(sign);
  return g;
}

function makeShops(i) {
  const g = new Group();
  const signs = [
    ['小卖部', '汽水 瓜子 方便面', '#d9d5c9', '#8e1210'],
    ['老张汽修', '补胎 换机油 钣金', '#5a6068', '#f4dca0'],
    ['录像厅', '今晚放映 头文字D', '#1c1e22', '#e2c62f'],
    ['招待所', '热水 彩电 停车场', '#b8bcc0', '#24479a'],
  ];
  const [t, s, bg, fg] = signs[i % signs.length];
  const wallCols = [0xc8b594, 0xae9f84, 0xd9cbb0];
  const roofMat = matStd(0x5a646a);
  const awningMat = matStd(i % 2 ? 0xc03228 : 0x245896);
  for (let k = 0; k < 3; k++) {
    const w = 6.2 + (k % 2) * 1.2;
    const h = 3.6 + (k % 2) * 1.1;
    const x = k * 6.4 - 6.4;
    g.add(box(wallCols[k], w, h, 4.4, x, h / 2, 0));
    g.add(box(0, w + 0.3, 0.3, 4.6, x, h + 0.15, 0, roofMat));
    g.add(box(0xdcdad2, 0.9, 0.6, 0.35, x - 1.5, h - 1.1, 2.3));
    g.add(box(0x252d36, 2.4, 2.1, 0.12, x, 1.05, 2.2));
    const awn = box(0, w * 0.78, 0.12, 1.3, x, 2.35, 2.75, awningMat);
    awn.rotation.x = 0.25;
    g.add(awn);
    if (k === 1) {
      const sp = signPlane(t, s, bg, fg, 6.4, 1.85);
      sp.position.set(x, h - 0.5, 2.3);
      g.add(sp);
    }
  }
  return g;
}

function makeCrane() {
  const g = new Group();
  const yMat = matStd(0xdca822);
  const concrete = matStd(0x767c80);
  g.add(box(0, 3.2, 1.2, 3.2, 0, 0.6, 0, concrete));
  for (const [cx, cz] of [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]]) {
    g.add(box(0, 0.18, 18.4, 0.18, cx, 9.8, cz, yMat));
  }
  for (let h = 2; h <= 18; h += 2.2) g.add(box(0, 1.28, 0.14, 1.28, 0, h, 0, yMat));
  g.add(box(0xeae6da, 1.6, 1.6, 1.8, 1.2, 18.2, 0.8));
  g.add(box(0x1d2b36, 1.2, 0.9, 1.2, 1.25, 18.4, 1.4));
  const apex = new Mesh(new ConeGeometry(0.9, 2.6, 4), yMat);
  apex.rotation.y = Math.PI / 4; apex.position.set(0, 20.5, 0); g.add(apex);
  g.add(box(0, 0.85, 0.85, 16, 0, 19.2, 2.0, yMat));
  g.add(box(0, 1.4, 1.5, 2.6, 0, 19.3, -5.0, concrete));
  g.add(new Mesh(new CylinderGeometry(0.04, 0.04, 7.6, 6), matStd(0x222))).position.set(0, 15.2, 7.2);
  g.add(box(0, 0.7, 0.6, 0.7, 0, 11.2, 7.2, yMat));
  return g;
}

function makePagoda() {
  const g = new Group();
  const stone = matStd(0x7b7568);
  const wall = matStd(0xc2b296);
  const pillar = matStd(0x9b241c);
  const roof = matStd(0x355346);
  g.add(box(0, 10.6, 1.2, 10.6, 0, 0.6, 0, stone));
  for (let i = 0; i < 5; i++) {
    const w = 7.6 - i * 1.15;
    const baseY = 1.2 + i * 2.55;
    const body = new Mesh(new CylinderGeometry(w * 0.56, w * 0.58, 2.1, 8), wall);
    body.position.y = baseY + 1.05; g.add(body);
    const eave = new Mesh(new CylinderGeometry(w * 0.62, w * 0.96, 0.78, 8), roof);
    eave.position.y = baseY + 2.35; g.add(eave);
    const trim = new Mesh(new CylinderGeometry(w * 0.60, w * 0.62, 0.22, 8), pillar);
    trim.position.y = baseY + 1.95; g.add(trim);
  }
  const spire = new Mesh(new ConeGeometry(0.32, 2.4, 8), matStd(0xd4a634, { metalness: 0.7, roughness: 0.35 }));
  spire.position.y = 14.9; g.add(spire);
  return g;
}

function makeStadium() {
  const g = new Group();
  const tex = canvasTex('stadiumLattice', 256, 64, (ctx, w, h) => {
    ctx.fillStyle = '#5d6568'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#e2dfd2'; ctx.lineWidth = 3;
    for (let x = -h; x < w + h; x += 14) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + h, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + h, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    ctx.fillStyle = '#c01f1a'; ctx.fillRect(0, h - 10, w, 6);
  }, true);
  tex.repeat.set(5, 1);
  const inner = new Mesh(new CylinderGeometry(9.6, 11.4, 7.6, 28, 1, true), new MeshStandardMaterial({ color: 0x8f1a18, roughness: 0.9, side: DoubleSide }));
  inner.scale.x = 2.2; inner.position.y = 3.8; g.add(inner);
  const wall = new Mesh(new CylinderGeometry(10.6, 12.6, 8.6, 28, 1, true), new MeshStandardMaterial({ map: tex, roughness: 0.78, side: DoubleSide }));
  wall.scale.x = 2.2; wall.position.y = 4.3; g.add(wall);
  const rim = new Mesh(new TorusGeometry(11.0, 0.52, 6, 32), matStd(0xe2dfd4));
  rim.scale.x = 2.2; rim.rotation.x = Math.PI / 2; rim.position.y = 8.6; g.add(rim);
  const banner = signPlane('北京 2008', '第29届奥运会', '#c01f1a', '#f2efe4', 10, 3.2);
  banner.position.set(0, 5.4, 13.0); g.add(banner);
  for (let i = 0; i < 5; i++) {
    const ring = new Mesh(new TorusGeometry(0.85, 0.16, 4, 16), matStd([0x1f5fbf, 0x111111, 0xc01f1a, 0xd8a61f, 0x2f6b4f][i]));
    ring.position.set(i * 1.9 - 3.8, 9.4 + (i % 2) * 0.55, 13.0);
    g.add(ring);
  }
  return g;
}

function makeExpo() {
  const g = new Group();
  const baseMat = matStd(0x736e62);
  const redMat = matStd(0xaa171e);
  const goldMat = matStd(0xd4a634);
  g.add(box(0, 22, 1.4, 16, 0, 0.7, 0, baseMat));
  g.add(box(0, 18, 1.2, 12, 0, 2.0, 0, baseMat));
  for (const [px, pz] of [[-4.2, -3.2], [4.2, -3.2], [-4.2, 3.2], [4.2, 3.2]]) {
    g.add(box(0, 1.6, 5.0, 1.6, px, 4.6, pz, redMat));
  }
  for (let t = 0; t < 4; t++) {
    const w = 10.4 + t * 2.2;
    const d = 8.4 + t * 1.8;
    g.add(box(0, w, 0.78, d, 0, 6.4 + t * 0.88, 0, redMat));
    g.add(box(0, w - 0.4, 0.16, d - 0.4, 0, 6.0 + t * 0.88, 0, goldMat));
  }
  g.add(box(0, 17.6, 0.45, 14.4, 0, 9.65, 0, goldMat));
  const sign = signPlane('中国馆', '上海世博会 2010', '#a6171f', '#f2d38a', 8.0, 2.5);
  sign.position.set(0, 4.2, 6.2);
  g.add(sign);
  return g;
}

function makeCableBridge() {
  const g = new Group();
  const pylonMat = matStd(0xdde2e6);
  const cableMat = matStd(0xc0c8ce);
  // Twin A-frame bridge pylons rising behind the river
  for (const px of [-24, 24]) {
    const legL = box(0, 1.5, 28, 1.6, px - 2.2, 14, 0, pylonMat); legL.rotation.z = -0.09; g.add(legL);
    const legR = box(0, 1.5, 28, 1.6, px + 2.2, 14, 0, pylonMat); legR.rotation.z = 0.09; g.add(legR);
    g.add(box(0, 5.6, 1.2, 1.6, px, 20, 0, pylonMat));
    g.add(box(0, 7.6, 1.2, 1.6, px, 9.5, 0, pylonMat));
    for (let k = 1; k <= 4; k++) {
      const len = 18 + k * 4.5;
      const c1 = new Mesh(new CylinderGeometry(0.06, 0.06, len, 4), cableMat);
      c1.position.set(px - k * 4.2, 16.5, 0);
      c1.rotation.z = 0.55;
      g.add(c1);
      const c2 = new Mesh(new CylinderGeometry(0.06, 0.06, len, 4), cableMat);
      c2.position.set(px + k * 4.2, 16.5, 0);
      c2.rotation.z = -0.55;
      g.add(c2);
    }
  }
  g.add(box(0, 110, 1.3, 4.4, 0, 7.6, 0, matStd(0x8e969e)));
  return g;
}

function makeViaductWithTrain(movers) {
  const g = new Group();
  const concrete = matStd(0x8e969c);
  const steel = matStd(0x5c6670);
  g.add(box(0, 140, 0.9, 4.6, 0, 6.2, 0, concrete));
  g.add(box(0, 140, 0.45, 0.22, 0, 6.9, 2.2, concrete));
  for (let x = -60; x <= 60; x += 20) {
    g.add(box(0, 1.4, 6.2, 1.5, x, 3.1, 0, concrete));
    g.add(box(0, 3.6, 0.7, 3.8, x, 5.5, 0, concrete));
    g.add(box(0, 0.22, 3.8, 0.22, x, 8.6, -2.0, steel));
    g.add(box(0, 0.22, 0.22, 3.6, x, 10.4, -0.3, steel));
  }
  const trainTex = canvasTex('crhTrain', 128, 32, (ctx, w, h) => {
    ctx.fillStyle = '#eef4f6'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#c81c20'; ctx.fillRect(0, 0, w, 5);
    ctx.fillStyle = '#1e4a9e'; ctx.fillRect(0, h - 6, w, 6);
    ctx.fillStyle = '#17222c';
    for (let x = 6; x < w - 8; x += 14) ctx.fillRect(x, 9, 9, 7);
  }, true);
  trainTex.repeat.set(6, 1);
  const trainGrp = new Group();
  const body = new Mesh(new BoxGeometry(44, 2.8, 2.7), new MeshStandardMaterial({ map: trainTex, roughness: 0.35 }));
  body.position.set(0, 8.1, 0);
  const nose = new Mesh(new ConeGeometry(1.36, 4.4, 8), matStd(0xeef4f6));
  nose.rotation.z = -Math.PI / 2;
  nose.position.set(24.2, 7.9, 0);
  trainGrp.add(body, nose);
  trainGrp.add(box(0x16222c, 1.8, 0.55, 1.8, 22.8, 8.7, 0));
  g.add(trainGrp);
  movers.push({ obj: trainGrp, axis: 'x', min: -55, max: 55, speed: 34 });
  return g;
}

function makeSwapOrCharging(isSwap, cyber) {
  const g = new Group();
  const baseMat = matStd(cyber ? 0x1c253a : 0xdde3e8);
  const trimMat = matStd(isSwap ? 0x1b4d9e : 0x1f6e49);
  const glowCol = isSwap ? 0x3ee8ff : 0x52f2a8;
  const glowMat = new MeshStandardMaterial({ color: glowCol, emissive: glowCol, emissiveIntensity: cyber ? 1.4 : 0.85 });
  g.add(box(0, 7.2, 3.8, 4.0, 0, 1.9, 0, baseMat));
  g.add(box(0, 7.8, 0.5, 4.5, 0, 3.9, 0, trimMat));
  g.add(box(0, 7.5, 0.14, 4.2, 0, 3.55, 0, glowMat));
  g.add(box(0x11151c, 3.2, 2.5, 0.16, 0, 1.25, 2.0, matStd(0x11151c)));
  const sign = isSwap
    ? signPlane('换电站', '3分钟 满电出发', '#1b4d9e', '#e8f4ff', 5.2, 2.0)
    : signPlane('超充站', '800V 极速补能', '#195238', '#e6fff2', 5.2, 2.0);
  sign.position.set(0, 5.1, 2.1);
  g.add(sign);
  return g;
}

function make5GHub() {
  const g = new Group();
  const red = matStd(0xc01f1a);
  const white = matStd(0xe8e6df);
  for (let i = 0; i < 6; i++) {
    const s = 1.45 - i * 0.15;
    g.add(box(0, s, 2.8, s, 0, 1.4 + i * 2.8, 0, i % 2 ? white : red));
  }
  g.add(box(0x1a1e28, 2.8, 0.35, 2.8, 0, 17.2, 0));
  const neon = new MeshStandardMaterial({ color: 0x42e8ff, emissive: 0x1aa8d8, emissiveIntensity: 1.4 });
  g.add(box(0, 3.0, 0.14, 3.0, 0, 17.0, 0, neon));
  for (const [x, z] of [[-1.0, 0], [1.0, 0], [0, -1.0], [0, 1.0]]) g.add(box(0xeef4fa, 0.24, 1.9, 0.5, x, 18.2, z));
  const beacon = new Mesh(new SphereGeometry(0.28, 8, 8), new MeshStandardMaterial({ color: 0xff3b30, emissive: 0xff2218, emissiveIntensity: 1.6 }));
  beacon.position.y = 19.6; g.add(beacon);
  return g;
}

function makeWindTurbine(spinners) {
  const g = new Group();
  const white = matStd(0xe8eef0);
  const red = matStd(0xc01f1a);
  const tower = new Mesh(new CylinderGeometry(0.32, 0.68, 24, 10), matStd(0xb2bcc2));
  tower.position.y = 12; g.add(tower);
  g.add(new Mesh(new CylinderGeometry(0.44, 0.48, 0.6, 10), red)).position?.set(0, 18, 0);
  g.add(box(0, 1.5, 1.3, 3.0, 0, 24.2, -0.4, white));
  const blades = new Group();
  blades.position.set(0, 24.2, 1.25);
  const hub = new Mesh(new ConeGeometry(0.55, 1.1, 8), red);
  hub.rotation.x = Math.PI / 2; blades.add(hub);
  for (let i = 0; i < 3; i++) {
    const a = i * Math.PI * 2 / 3;
    const b = new Mesh(new BoxGeometry(0.34, 11.4, 0.12), white);
    b.position.set(Math.sin(a) * 5.6, Math.cos(a) * 5.6, 0);
    b.rotation.z = -a; blades.add(b);
  }
  g.add(blades);
  spinners.push({ obj: blades, axis: 'z', speed: 0.7 });
  return g;
}

function makeSolarFarm() {
  const g = new Group();
  const solarTex = canvasTex('solar', 64, 64, (ctx, w, h) => {
    ctx.fillStyle = '#18346e'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#4f82c4';
    for (let x = 0; x < w; x += 16) ctx.fillRect(x, 0, 2, h);
    for (let y = 0; y < h; y += 16) ctx.fillRect(0, y, w, 2);
  });
  const panelMat = new MeshStandardMaterial({ map: solarTex, roughness: 0.25, metalness: 0.45 });
  const postMat = matStd(0x6a7274);
  for (let i = 0; i < 5; i++) {
    const p = box(0, 4.2, 0.10, 2.5, i * 4.6 - 9.2, 1.3, 0, panelMat);
    p.rotation.x = -0.38; g.add(p);
    g.add(box(0, 0.16, 1.2, 0.16, i * 4.6 - 9.2, 0.6, 0, postMat));
  }
  return g;
}

function makeVertiport(spinners, hoverers) {
  const g = new Group();
  const padMat = matStd(0xdce6ea);
  const ringMat = new MeshStandardMaterial({ color: 0x39e0ff, emissive: 0x1ea8d4, emissiveIntensity: 1.0 });
  const base = new Mesh(new CylinderGeometry(6.8, 7.6, 1.2, 16), padMat);
  base.position.y = 0.6; g.add(base);
  const ring = new Mesh(new TorusGeometry(5.6, 0.22, 6, 24), ringMat);
  ring.rotation.x = Math.PI / 2; ring.position.y = 1.24; g.add(ring);
  // Terminal glass kiosk + air-traffic tower
  g.add(box(0x88d4ee, 4.4, 2.8, 3.0, -7.8, 1.4, -2.5));
  g.add(box(0xeff5f8, 1.4, 8.0, 1.4, -9.2, 4.0, -2.5));
  const drone = new Group();
  drone.add(box(0xf4f7fa, 2.8, 0.7, 1.5, 0, 0, 0));
  drone.add(box(0x1f2d3a, 1.5, 0.5, 1.1, 0.2, 0.45, 0));
  for (const [rx, rz] of [[-1.3, -1.1], [-1.3, 1.1], [1.3, -1.1], [1.3, 1.1]]) {
    const arm = box(0x3a434c, 1.2, 0.08, 0.12, rx * 0.6, 0.2, rz * 0.6);
    g.add(box(0x111, 0.01, 0.01, 0.01, 0, -5, 0));
    drone.add(arm);
    const blade = box(0x28323c, 1.1, 0.04, 0.16, rx, 0.35, rz);
    drone.add(blade);
    spinners.push({ obj: blade, axis: 'y', speed: 14 });
  }
  drone.position.set(0, 7.2, 0);
  g.add(drone);
  hoverers.push({ obj: drone, baseY: 7.2, phase: hoverers.length * 1.4 });
  const sign = signPlane('低空枢纽', 'eVTOL 垂直起降坪', '#1c4f7a', '#e8f8ff', 6.0, 2.0);
  sign.position.set(0, 2.6, 6.2);
  g.add(sign);
  return g;
}

function makeTree(era, variant) {
  const g = new Group();
  const cols = ERA_THEMES[era].treeCols;
  const trunkMat = matStd(0x5c422c);
  const leafMat = matStd(cols[variant % cols.length]);
  if (variant % 3 === 0) {
    const t = new Mesh(new CylinderGeometry(0.16, 0.24, 2.4, 6), trunkMat);
    t.position.y = 1.2; g.add(t);
    const crown = new Mesh(new ConeGeometry(1.35, 4.8, 6), leafMat);
    crown.position.y = 4.3; g.add(crown);
  } else {
    const t = new Mesh(new CylinderGeometry(0.18, 0.26, 2.0, 6), trunkMat);
    t.position.y = 1.0; g.add(t);
    g.add(box(0, 2.5, 1.8, 2.5, 0, 2.7, 0, leafMat));
    g.add(box(0, 1.8, 1.3, 1.8, 0, 3.9, 0, leafMat));
  }
  return g;
}

function makeTelephonePole() {
  const g = new Group();
  const wood = matStd(0x6f5a3d);
  const ins = matStd(0xd9e6ea);
  g.add(box(0, 0.20, 8.4, 0.20, 0, 4.2, 0, wood));
  g.add(box(0, 0.16, 0.16, 2.8, 0, 7.6, 0, wood));
  g.add(box(0, 0.16, 0.16, 1.8, 0, 6.7, 0, wood));
  for (const z of [-1.1, 0, 1.1]) g.add(box(0, 0.14, 0.22, 0.14, 0, 7.75, z, ins));
  return g;
}

export function populateEraScenery(scene, era, out) {
  const th = ERA_THEMES[era];
  const gTex = groundTexture(era);
  gTex.repeat.set(420, 18);
  const ground = new Mesh(
    new PlaneGeometry(14000, 380),
    new MeshStandardMaterial({ map: gTex, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.08;
  scene.add(ground);

  out.hills = buildDistantHorizon(scene, era);
  out.buildings = buildSkyline(scene, era);
  out.eraProps = [];
  out.spinners = [];
  out.movers = [];
  out.smokePuffs = [];
  out.hoverers = [];

  const add = (group, x, z, span, rotate = 0) => {
    group.position.set(x, 0, z);
    group.rotation.y = rotate;
    scene.add(group);
    out.eraProps.push({ group, span });
  };
  const addMany = (make, count, spacing, z, rotate = 0, start = 60) => {
    const span = count * spacing;
    for (let i = 0; i < count; i++) add(make(i), start + i * spacing, z, span, rotate);
  };

  if (era === 0) {
    addMany((i) => makeShops(i), 5, 130, -17);
    addMany(() => makeBrickFactory(out.smokePuffs), 2, 360, -28, 0, 160);
    addMany(() => makeCrane(), 3, 280, -38, 0, 95);
    add(makePagoda(), 540, -48, 960);
    addMany(() => makeTelephonePole(), 8, 65, -13.0, 0, 18);
  } else if (era === 1) {
    add(makeStadium(), 240, -34, 1100);
    add(makeExpo(), 660, -34, 1100);
    addMany((i) => makeShops(i), 3, 240, -17.5, 0, 90);
    addMany(() => makeCrane(), 2, 420, -48, 0, 150);
  } else if (era === 2) {
    addMany(() => makeViaductWithTrain(out.movers), 4, 240, -28, 0, 90);
    addMany(() => makeCableBridge(), 2, 600, -82, 0, 220);
    addMany(() => makeSwapOrCharging(false, false), 3, 280, -17.5, 0, 120);
  } else if (era === 3) {
    addMany(() => make5GHub(), 5, 190, -20, 0, 75);
    addMany((i) => makeSwapOrCharging(i % 2 === 0, true), 4, 220, -17.5, 0, 135);
  } else {
    addMany(() => makeVertiport(out.spinners, out.hoverers), 3, 360, -21, 0, 130);
    addMany(() => makeWindTurbine(out.spinners), 4, 260, -46, 0, 80);
    addMany(() => makeSolarFarm(), 4, 260, -24, 0, 210);
    addMany(() => makeSwapOrCharging(true, false), 3, 360, -17.5, 0, 280);
  }

  // Roadside Trees (along -Z so they enrich depth without obstructing chase camera)
  out.trees = [];
  for (let i = 0; i < 20; i++) {
    const tr = makeTree(era, i);
    let tx = i * 24 - 70;
    if (tx > -18 && tx < 50) tx += 72;
    tr.position.set(tx, 0, -20.5 - (i % 3) * 2.5);
    scene.add(tr);
    out.trees.push(tr);
  }

  // Trackside Streetlamps (era-matched bulb glow)
  out.poles = [];
  const poleMat = matStd(era >= 3 ? 0x3b4454 : 0x6a7274);
  const lampMat = new MeshStandardMaterial({
    color: th.lampColor,
    emissive: th.lampEmissive,
    emissiveIntensity: th.lampEmissiveI,
  });
  for (let i = 0; i < 14; i++) {
    const g = new Group();
    const pole = new Mesh(new CylinderGeometry(0.08, 0.11, 5.4, 6), poleMat);
    pole.position.y = 2.7;
    const arm = box(0x828a8e, 0.14, 0.14, 1.3, 0, 5.3, -0.55);
    const head = box(0xc9ccd0, 0.45, 0.14, 0.8, 0, 5.3, -1.15);
    const lamp = box(0, 0.38, 0.08, 0.55, 0, 5.20, -1.15, lampMat);
    g.add(pole, arm, head, lamp);
    g.position.set(i * 34 - 60, 0, 12.6);
    scene.add(g);
    out.poles.push(g);
  }
}

export function updateEraScenery(out, dt, nowSec) {
  for (const s of out.spinners || []) s.obj.rotation[s.axis] += dt * s.speed;
  for (const mv of out.movers || []) {
    mv.obj.position[mv.axis] += dt * mv.speed;
    if (mv.obj.position[mv.axis] > mv.max) mv.obj.position[mv.axis] = mv.min;
  }
  for (const puff of out.smokePuffs || []) {
    const u = (nowSec * 0.28 + puff.userData.phase) % 1;
    puff.position.set(
      puff.userData.baseX + u * 4.5,
      puff.userData.baseY + u * 6.5,
      puff.userData.baseZ - u * 1.5
    );
    puff.scale.setScalar(0.75 + u * 1.3);
  }
  for (const hv of out.hoverers || []) {
    hv.obj.position.y = hv.baseY + Math.sin(nowSec * 2.4 + hv.phase) * 0.65;
    hv.obj.rotation.z = Math.sin(nowSec * 1.3 + hv.phase) * 0.05;
  }
}

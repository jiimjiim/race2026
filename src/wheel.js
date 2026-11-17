import { BoxGeometry, CanvasTexture, CylinderGeometry, Group, LatheGeometry, Mesh, MeshStandardMaterial, NearestFilter, RepeatWrapping, SRGBColorSpace, TorusGeometry, Vector2 } from 'three';

const TEX_CACHE = new Map();
const MAT_CACHE = new Map();
const GEO_CACHE = new Map();

function pixelTex(key, w, h, draw, repeatU = 1) {
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
  if (repeatU > 1) {
    t.wrapS = RepeatWrapping;
    t.repeat.set(repeatU, 1);
  }
  TEX_CACHE.set(key, t);
  return t;
}

function getMat(key, opts) {
  if (!MAT_CACHE.has(key)) {
    MAT_CACHE.set(key, new MeshStandardMaterial({ flatShading: true, ...opts }));
  }
  return MAT_CACHE.get(key);
}

function getTireMat(tread = 'sport', stripeColor = null, sidewallText = null) {
  const key = `tire:${tread}:${stripeColor || 'none'}:${sidewallText || 'none'}`;
  if (MAT_CACHE.has(key)) return MAT_CACHE.get(key);
  const tex = pixelTex(key, 64, 64, (ctx, w, h) => {
    // Base dark rubber
    ctx.fillStyle = tread === 'wood' ? '#7a542e' : tread === 'slick' ? '#16171a' : '#1b1d20';
    ctx.fillRect(0, 0, w, h);

    if (tread === 'wood') {
      // Wood grain along circumference + iron band in center
      ctx.fillStyle = '#8e653a';
      for (let y = 0; y < h; y += 6) ctx.fillRect(0, y, w, 2);
      ctx.fillStyle = '#5c3d1e';
      for (let x = 0; x < w; x += 16) ctx.fillRect(x, 0, 2, h);
      // Outer iron tire band across middle tread (y = 22..42)
      ctx.fillStyle = '#33363b';
      ctx.fillRect(0, 20, w, 24);
      ctx.fillStyle = '#555a60';
      for (let x = 4; x < w; x += 16) {
        ctx.fillRect(x, 23, 3, 3);
        ctx.fillRect(x, 38, 3, 3);
      }
      return;
    }

    // Subtle sidewall shading
    ctx.fillStyle = '#22252a';
    ctx.fillRect(0, 12, w, 4);
    ctx.fillRect(0, h - 16, w, 4);

    // Sidewall stripe (e.g. Pirelli yellow/red, Michelin blue, whitewall)
    if (stripeColor) {
      ctx.fillStyle = stripeColor;
      ctx.fillRect(0, 9, w, 3);
      ctx.fillRect(0, h - 12, w, 3);
    }

    // Sidewall block lettering dots (pixel style)
    if (sidewallText) {
      ctx.fillStyle = stripeColor || '#c8ccd0';
      for (let x = 4; x < 24; x += 4) ctx.fillRect(x, 5, 2, 2);
      for (let x = 36; x < 56; x += 4) ctx.fillRect(x, h - 7, 2, 2);
    }

    // Tread region (y = 18..46)
    const tTop = 18, tBot = 46;
    ctx.fillStyle = tread === 'slick' ? '#141518' : '#1e2024';
    ctx.fillRect(0, tTop, w, tBot - tTop);

    if (tread === 'slick') {
      // Very subtle heat-cycled sheen bands
      ctx.fillStyle = '#1b1d22';
      ctx.fillRect(0, 24, w, 16);
      ctx.fillStyle = '#101114';
      ctx.fillRect(0, 22, w, 1);
      ctx.fillRect(0, 41, w, 1);
    } else if (tread === 'semi') {
      // Semi-slick: 2 crisp circumferential grooves + diagonal shoulder sipes
      ctx.fillStyle = '#0d0e10';
      ctx.fillRect(0, 25, w, 2);
      ctx.fillRect(0, 37, w, 2);
      for (let x = 0; x < w; x += 8) {
        ctx.fillRect(x, 19, 3, 4);
        ctx.fillRect((x + 4) % w, 41, 3, 4);
      }
    } else if (tread === 'rain' || tread === 'allterrain') {
      // Directional V-grooves / chunky blocks
      ctx.fillStyle = '#0c0d0f';
      ctx.fillRect(0, 31, w, 2);
      for (let x = 0; x < w; x += 8) {
        ctx.fillRect(x, 19, 4, 5);
        ctx.fillRect((x + 2) % w, 24, 3, 5);
        ctx.fillRect((x + 2) % w, 35, 3, 5);
        ctx.fillRect(x, 40, 4, 5);
      }
    } else if (tread === 'aero_rib') {
      // Aviation multi-rib tire (Senqi aero tire)
      ctx.fillStyle = '#0c0d0f';
      for (const y of [22, 27, 32, 37, 42]) ctx.fillRect(0, y, w, 2);
    } else if (tread === 'graphene') {
      // Hex-pattern dark graphene tread
      ctx.fillStyle = '#262d36';
      ctx.fillRect(0, tTop, w, tBot - tTop);
      ctx.fillStyle = '#0e1116';
      for (let x = 0; x < w; x += 8) {
        ctx.fillRect(x, 22, 4, 3);
        ctx.fillRect((x + 4) % w, 29, 4, 3);
        ctx.fillRect(x, 36, 4, 3);
      }
    } else {
      // Standard sport street tire: 3 circumferential grooves + shoulder sipes
      ctx.fillStyle = '#0e0f11';
      ctx.fillRect(0, 24, w, 2);
      ctx.fillRect(0, 31, w, 2);
      ctx.fillRect(0, 38, w, 2);
      for (let x = 0; x < w; x += 8) {
        ctx.fillRect(x, 19, 2, 4);
        ctx.fillRect((x + 4) % w, 41, 2, 4);
      }
    }
  }, tread === 'slick' ? 2 : 6);

  const m = new MeshStandardMaterial({
    map: tex,
    roughness: tread === 'wood' ? 0.85 : tread === 'slick' ? 0.65 : 0.88,
    metalness: 0.06,
    flatShading: true,
  });
  MAT_CACHE.set(key, m);
  return m;
}

function getTireLatheGeo(radius, width, rimRatio = 0.60) {
  const key = `tlathe:${radius.toFixed(3)}:${width.toFixed(3)}:${rimRatio.toFixed(2)}`;
  if (GEO_CACHE.has(key)) return GEO_CACHE.get(key);
  const rimR = radius * rimRatio;
  const hw = width * 0.5;
  // Lathe revolves around Y; we rotate X by PI/2 afterward so axis is Z.
  const pts = [
    new Vector2(rimR * 0.96, -hw * 0.84),
    new Vector2(rimR * 1.02, -hw * 0.95),
    new Vector2(radius * 0.82, -hw * 1.00),
    new Vector2(radius * 0.95, -hw * 0.93),
    new Vector2(radius * 1.00, -hw * 0.72),
    new Vector2(radius * 1.008, 0),
    new Vector2(radius * 1.00, hw * 0.72),
    new Vector2(radius * 0.95, hw * 0.93),
    new Vector2(radius * 0.82, hw * 1.00),
    new Vector2(rimR * 1.02, hw * 0.95),
    new Vector2(rimR * 0.96, hw * 0.84),
  ];
  const geo = new LatheGeometry(pts, 22);
  geo.rotateX(Math.PI / 2);
  geo.userData.shared = true;
  GEO_CACHE.set(key, geo);
  return geo;
}

function getBarrelGeo(rimR, width) {
  const key = `barrel:${rimR.toFixed(3)}:${width.toFixed(3)}`;
  if (GEO_CACHE.has(key)) return GEO_CACHE.get(key);
  const geo = new CylinderGeometry(rimR * 0.96, rimR * 0.96, width * 0.82, 20, 1);
  geo.rotateX(Math.PI / 2);
  geo.userData.shared = true;
  GEO_CACHE.set(key, geo);
  return geo;
}

function getLipGeo(rimR, tube) {
  const key = `lip:${rimR.toFixed(3)}:${tube.toFixed(3)}`;
  if (GEO_CACHE.has(key)) return GEO_CACHE.get(key);
  const geo = new TorusGeometry(rimR, tube, 6, 22);
  geo.userData.shared = true;
  GEO_CACHE.set(key, geo);
  return geo;
}

const RIM_PALETTE = {
  silver: { color: 0xcfd4d9, roughness: 0.28, metalness: 0.78 },
  chrome: { color: 0xe6eaee, roughness: 0.16, metalness: 0.92 },
  gold: { color: 0xd4a938, roughness: 0.30, metalness: 0.75 },
  bronze: { color: 0x8b6b42, roughness: 0.36, metalness: 0.68 },
  gunmetal: { color: 0x434952, roughness: 0.36, metalness: 0.65 },
  black: { color: 0x1e2024, roughness: 0.42, metalness: 0.45 },
  white: { color: 0xeae7de, roughness: 0.35, metalness: 0.25 },
  carbon: { color: 0x262a2e, roughness: 0.32, metalness: 0.40 },
  wood: { color: 0x9b6e3f, roughness: 0.82, metalness: 0.04 },
};

function rimMaterial(colorKey) {
  const spec = RIM_PALETTE[colorKey] || RIM_PALETTE.silver;
  return getMat(`rim:${colorKey}`, spec);
}

/**
 * Build a proper 3D tire + recessed rim + brake rotor + caliper assembly.
 * Wheel axis is Z (outer face at +Z when mounted on +Z side, symmetric on -Z).
 */
export function buildWheel(opts = {}) {
  const {
    radius = 0.35,
    width = 0.26,
    style = 'yspoke',      // 'yspoke' | '5spoke' | '6spoke' | 'multispoke' | 'aero' | 'steelie' | 'wood' | 'f1'
    rimColor = 'silver',
    lipColor = null,
    tread = 'sport',       // 'sport' | 'semi' | 'slick' | 'rain' | 'allterrain' | 'aero_rib' | 'graphene' | 'wood'
    stripeColor = null,    // e.g. '#ffd038', '#d93829', '#4c8fe0', '#eceae2'
    caliperColor = 0xc01f1a,
    centerLock = false,
    carbonDisc = false,
    sidewallText = false,
  } = opts;

  const g = new Group();
  const rimRatio = style === 'f1' ? 0.54 : style === 'wood' ? 0.76 : style === 'steelie' ? 0.56 : 0.62;
  const rimR = radius * rimRatio;

  const darkMetal = getMat('w:darkmetal', { color: 0x16181b, roughness: 0.65, metalness: 0.4 });
  const rotorMat = carbonDisc
    ? getMat('w:carbonrotor', { color: 0x3b3d42, roughness: 0.5, metalness: 0.45 })
    : getMat('w:steelrotor', { color: 0x9aa2a8, roughness: 0.32, metalness: 0.82 });
  const calMat = getMat(`w:cal:${caliperColor}`, { color: caliperColor, roughness: 0.38, metalness: 0.35 });
  const rimM = rimMaterial(rimColor);
  const lipM = rimMaterial(lipColor || (style === 'wood' ? 'wood' : rimColor === 'black' ? 'silver' : rimColor));
  const chromeM = rimMaterial('chrome');

  // 1. Tire body (for wood wheel, build authentic open wooden felloe + spokes!)
  if (style === 'wood') {
    const felloe = new Mesh(getTireLatheGeo(radius, width, 0.78), getTireMat('wood'));
    g.add(felloe);
    const woodSpokeM = rimMaterial('wood');
    const ironM = getMat('w:iron', { color: 0x2a2d30, roughness: 0.7, metalness: 0.55 });
    const spokeCount = 10;
    const spokeLen = radius * 0.78;
    const spokeGeo = new BoxGeometry(width * 0.22, spokeLen, width * 0.24);
    for (let i = 0; i < spokeCount; i++) {
      const a = (i / spokeCount) * Math.PI * 2;
      const sp = new Mesh(spokeGeo, woodSpokeM);
      sp.position.set(Math.cos(a) * spokeLen * 0.5, Math.sin(a) * spokeLen * 0.5, 0);
      sp.rotation.z = a - Math.PI / 2;
      g.add(sp);
    }
    // Iron hub & outer rim band rivets
    const hub = new Mesh(new CylinderGeometry(radius * 0.20, radius * 0.20, width * 1.05, 12), ironM);
    hub.rotation.x = Math.PI / 2;
    g.add(hub);
    const hubCap = new Mesh(new CylinderGeometry(radius * 0.11, radius * 0.13, width * 1.18, 10), getMat('w:brass', { color: 0xc2983b, roughness: 0.35, metalness: 0.75 }));
    hubCap.rotation.x = Math.PI / 2;
    g.add(hubCap);
    for (const side of [1, -1]) {
      const innerBand = new Mesh(getLipGeo(radius * 0.78, width * 0.06), ironM);
      innerBand.position.z = side * width * 0.42;
      g.add(innerBand);
    }
    return g;
  }

  // Rubber tire with rounded shoulders & pixel tread/sidewall texture
  const tireMesh = new Mesh(getTireLatheGeo(radius, width, rimRatio), getTireMat(tread, stripeColor, sidewallText));
  g.add(tireMesh);

  // 2. Recessed dark barrel + lip rings on both sides
  const barrel = new Mesh(getBarrelGeo(rimR, width), darkMetal);
  g.add(barrel);
  for (const side of [1, -1]) {
    const lip = new Mesh(getLipGeo(rimR * 0.99, Math.max(0.014, radius * 0.048)), lipM);
    lip.position.z = side * (width * 0.42);
    g.add(lip);
  }

  // 3. Brake Rotor + Caliper inside barrel (visible behind spokes!)
  if (style !== 'steelie') {
    const rotorR = rimR * 0.76;
    const rotor = new Mesh(new CylinderGeometry(rotorR, rotorR, width * 0.14, 16), rotorMat);
    rotor.rotation.x = Math.PI / 2;
    g.add(rotor);
    // Caliper mounted at ~2 o'clock
    const cal = new Mesh(
      new BoxGeometry(rotorR * 0.46, rotorR * 0.62, width * 0.34),
      calMat
    );
    cal.position.set(rotorR * 0.58, rotorR * 0.38, 0);
    cal.rotation.z = -0.5;
    g.add(cal);
  }

  // 4. Center Hub & Dish / Spokes (rendered cleanly recessed inside rim)
  const faceZ = width * 0.34;
  const hubR = rimR * 0.25;
  const hub = new Mesh(new CylinderGeometry(hubR, hubR * 1.1, width * 0.24, 12), rimM);
  hub.rotation.x = Math.PI / 2;
  hub.position.z = 0;
  g.add(hub);

  const addSideDetail = (side) => {
    const zFace = side * faceZ;
    if (style === 'steelie') {
      const dish = new Mesh(new CylinderGeometry(rimR * 0.94, rimR * 0.85, width * 0.12, 16), rimM);
      dish.rotation.x = Math.PI / 2;
      dish.position.z = side * width * 0.30;
      g.add(dish);
      // Ventilation holes ring
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const hole = new Mesh(new CylinderGeometry(rimR * 0.08, rimR * 0.08, 0.02, 6), darkMetal);
        hole.rotation.x = Math.PI / 2;
        hole.position.set(Math.cos(a) * rimR * 0.66, Math.sin(a) * rimR * 0.66, side * width * 0.37);
        g.add(hole);
      }
      const cap = new Mesh(new CylinderGeometry(rimR * 0.36, rimR * 0.40, width * 0.09, 12), chromeM);
      cap.rotation.x = Math.PI / 2;
      cap.position.z = side * width * 0.38;
      g.add(cap);
      return;
    }

    if (style === 'aero' || style === 'f1') {
      // Aero wheel cover with turbine slots or F1 rim cover
      const plate = new Mesh(new CylinderGeometry(rimR * 0.93, rimR * 0.93, width * 0.08, 18), rimM);
      plate.rotation.x = Math.PI / 2;
      plate.position.z = side * width * 0.34;
      g.add(plate);
      const bladeCount = style === 'f1' ? 6 : 5;
      for (let i = 0; i < bladeCount; i++) {
        const a = (i / bladeCount) * Math.PI * 2;
        const blade = new Mesh(new BoxGeometry(rimR * 0.16, rimR * 0.68, 0.025), darkMetal);
        blade.position.set(Math.cos(a) * rimR * 0.52, Math.sin(a) * rimR * 0.52, side * (width * 0.39));
        blade.rotation.z = a + 0.35;
        g.add(blade);
      }
      if (style === 'f1') {
        const ring = new Mesh(getLipGeo(rimR * 0.72, 0.015), calMat);
        ring.position.z = side * width * 0.395;
        g.add(ring);
      }
    } else if (style === 'yspoke') {
      // 5 pairs of Y-spokes = 10 crisp spokes
      const pairs = 5;
      const spokeLen = rimR * 0.76;
      const spGeo = new BoxGeometry(rimR * 0.09, spokeLen, Math.max(0.028, width * 0.14));
      for (let i = 0; i < pairs; i++) {
        const base = (i / pairs) * Math.PI * 2;
        for (const spread of [-0.17, 0.17]) {
          const a = base + spread;
          const sp = new Mesh(spGeo, rimM);
          sp.position.set(Math.cos(base) * rimR * 0.24 + Math.cos(a) * spokeLen * 0.42, Math.sin(base) * rimR * 0.24 + Math.sin(a) * spokeLen * 0.42, zFace);
          sp.rotation.z = a - Math.PI / 2;
          g.add(sp);
        }
      }
    } else {
      const count = style === '5spoke' ? 5 : style === '6spoke' ? 6 : 10;
      const thickness = style === 'multispoke' ? 0.08 : style === '6spoke' ? 0.17 : 0.15;
      const spokeLen = rimR * 0.80;
      const spGeo = new BoxGeometry(rimR * thickness, spokeLen, Math.max(0.03, width * 0.16));
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const sp = new Mesh(spGeo, rimM);
        sp.position.set(Math.cos(a) * spokeLen * 0.56, Math.sin(a) * spokeLen * 0.56, zFace);
        sp.rotation.z = a - Math.PI / 2;
        g.add(sp);
      }
    }

    // Center cap + lug nuts / center lock
    const capZ = side * (width * 0.40);
    if (centerLock || style === 'f1') {
      const nut = new Mesh(new CylinderGeometry(hubR * 0.62, hubR * 0.68, width * 0.12, 6), calMat);
      nut.rotation.x = Math.PI / 2;
      nut.position.z = capZ;
      g.add(nut);
    } else {
      const cap = new Mesh(new CylinderGeometry(hubR * 0.52, hubR * 0.52, width * 0.08, 10), darkMetal);
      cap.rotation.x = Math.PI / 2;
      cap.position.z = capZ;
      g.add(cap);
      const lugGeo = new CylinderGeometry(hubR * 0.13, hubR * 0.13, width * 0.07, 6);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const lug = new Mesh(lugGeo, chromeM);
        lug.rotation.x = Math.PI / 2;
        lug.position.set(Math.cos(a) * hubR * 0.85, Math.sin(a) * hubR * 0.85, capZ);
        g.add(lug);
      }
    }
  };

  addSideDetail(1);
  addSideDetail(-1);
  return g;
}

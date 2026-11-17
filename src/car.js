import { BoxGeometry, CanvasTexture, ConeGeometry, CylinderGeometry, DoubleSide, EdgesGeometry, ExtrudeGeometry, Group, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, MeshStandardMaterial, NearestFilter, PlaneGeometry, SRGBColorSpace, Shape, SphereGeometry, TorusGeometry } from 'three';
import { buildWheel } from './wheel.js';
import { CAR_BLUEPRINTS, resolveBlueprintKey } from './car_blueprints.js';

const MAT = {};
function bodyMat(color) {
  const key = 'b:' + color;
  if (!MAT[key]) MAT[key] = new MeshStandardMaterial({ color, roughness: 0.38, metalness: 0.32, flatShading: true });
  return MAT[key];
}
function stdMat(key, opts) {
  if (!MAT[key]) MAT[key] = new MeshStandardMaterial({ flatShading: true, ...opts });
  return MAT[key];
}

const glassMat = stdMat('glass', { color: 0x0f1a22, roughness: 0.14, metalness: 0.55, side: DoubleSide });
const clearGlassMat = new MeshStandardMaterial({ color: 0x9ec4d8, transparent: true, opacity: 0.42, roughness: 0.12, metalness: 0.35, side: DoubleSide });
const darkMat = stdMat('dark', { color: 0x191b1f, roughness: 0.72, metalness: 0.18 });
const trimMat = stdMat('trim', { color: 0x26292e, roughness: 0.65, metalness: 0.25 });
const chromeMat = stdMat('chrome', { color: 0xe0e4e8, roughness: 0.18, metalness: 0.92 });
const aluMat = stdMat('alu', { color: 0xb2b8be, roughness: 0.32, metalness: 0.72 });
const carbonMat = stdMat('carbon', { color: 0x22262b, roughness: 0.38, metalness: 0.38 });
const steelMat = stdMat('steel', { color: 0x868e94, roughness: 0.38, metalness: 0.65 });
const lightMat = stdMat('headlight', { color: 0xfff5d6, emissive: 0xffeaa8, emissiveIntensity: 0.85, roughness: 0.22 });
const drlMat = stdMat('drl', { color: 0xeef8ff, emissive: 0xcbeeff, emissiveIntensity: 0.95, roughness: 0.2 });
const amberMat = stdMat('amber', { color: 0xffa82b, emissive: 0xff7b00, emissiveIntensity: 0.75, roughness: 0.35 });
const tailMat = stdMat('tail', { color: 0xb31915, emissive: 0xff281b, emissiveIntensity: 0.95, roughness: 0.3 });
const tailBrightMat = stdMat('tail_bright', { color: 0xff3b2b, emissive: 0xff3322, emissiveIntensity: 1.15, roughness: 0.25 });
const redAccentMat = stdMat('red_acc', { color: 0xc01f1a, roughness: 0.42, metalness: 0.25 });
const blueGlowMat = stdMat('blue_glow', { color: 0x74e5ff, emissive: 0x35b8ff, emissiveIntensity: 0.9 });

const TEX = {};
function canvasTex(key, w, h, draw) {
  if (TEX[key]) return TEX[key];
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
  TEX[key] = t;
  return t;
}

function plateMat(text = 'RACE') {
  const key = `plate:${text}`;
  if (MAT[key]) return MAT[key];
  MAT[key] = new MeshStandardMaterial({
    map: canvasTex(key, 64, 20, (ctx, w, h) => {
      ctx.fillStyle = '#eceee8'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#1b3f7a'; ctx.fillRect(2, 2, 10, h - 4);
      ctx.strokeStyle = '#26323b'; ctx.lineWidth = 2; ctx.strokeRect(1, 1, w - 2, h - 2);
      ctx.fillStyle = '#182433'; ctx.font = 'bold 11px Consolas, monospace'; ctx.textAlign = 'center';
      ctx.fillText(text, w / 2 + 4, 14);
    }),
    roughness: 0.5,
  });
  return MAT[key];
}

function carbonWeaveMat() {
  if (MAT.carbonWeave) return MAT.carbonWeave;
  MAT.carbonWeave = new MeshStandardMaterial({
    map: canvasTex('carbonWeave', 16, 16, (ctx, w, h) => {
      ctx.fillStyle = '#1d2025'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#2c3138';
      for (let y = 0; y < h; y += 4) {
        for (let x = (y % 8 === 0 ? 0 : 2); x < w; x += 4) ctx.fillRect(x, y, 2, 2);
      }
    }),
    roughness: 0.36,
    metalness: 0.38,
    flatShading: true,
  });
  return MAT.carbonWeave;
}

function addBox(parent, w, h, d, x, y, z, mat, rx = 0, ry = 0, rz = 0) {
  const m = new Mesh(new BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  parent.add(m);
  return m;
}

function addCyl(parent, rT, rB, h, x, y, z, mat, axis = 'y', segs = 12) {
  const m = new Mesh(new CylinderGeometry(rT, rB, h, segs), mat);
  if (axis === 'x') m.rotation.z = Math.PI / 2;
  else if (axis === 'z') m.rotation.x = Math.PI / 2;
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

// Carve clean trapezoidal wheel-arch cutouts into the bottom edge of a side profile.
function profileWithArches(pts, frontX, rearX, wheelR) {
  const archR = wheelR * 1.18;
  const archH = wheelR * 1.98;
  const bottomY = pts[0][1];
  const out = [pts[0]];
  // Bottom edge runs from pts[0] (rear) to pts[pts.length-1] (front), or pts has bottom points at [0] and [last].
  // Insert rear arch & front arch along the bottom edge before closing back to pts[0].
  for (let i = 1; i < pts.length; i++) out.push(pts[i]);
  // pts[pts.length - 1] is front-bottom, pts[0] is rear-bottom.
  // Walk front-to-rear along the bottom edge:
  const fx = frontX, rx = rearX;
  if (fx < 50) {
    out.push([fx + archR, bottomY]);
    out.push([fx + archR * 0.68, archH]);
    out.push([fx - archR * 0.68, archH]);
    out.push([fx - archR, bottomY]);
  }
  if (rx > -50) {
    out.push([rx + archR, bottomY]);
    out.push([rx + archR * 0.68, archH]);
    out.push([rx - archR * 0.68, archH]);
    out.push([rx - archR, bottomY]);
  }
  return out;
}

function extrudeSide(points, depth, bevel = 0.035) {
  const shape = new Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) shape.lineTo(points[i][0], points[i][1]);
  shape.closePath();
  const geo = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.65,
    bevelSegments: 1,
    steps: 1,
  });
  geo.translate(0, 0, -depth / 2);
  geo.computeVertexNormals();
  return geo;
}

// Taper upper vertices of cabin so windshield, side windows, and rear glass slope inward cleanly.
function extrudeTaperedCabin(points, depth, taper = 0.78) {
  const geo = extrudeSide(points, depth, 0.025);
  const pos = geo.attributes.position;
  const ys = points.map((p) => p[1]);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const span = Math.max(0.1, maxY - minY);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const t = Math.max(0, Math.min(1, (y - minY) / span));
    const scaleZ = 1 - (1 - taper) * t;
    pos.setZ(i, pos.getZ(i) * scaleZ);
  }
  geo.computeVertexNormals();
  return geo;
}

function outline(geo, color = 0x111417, opacity = 0.25) {
  const g = new EdgesGeometry(geo, 36);
  const m = new LineBasicMaterial({ color, transparent: true, opacity });
  return new LineSegments(g, m);
}

// ─── Sculpted 3D Grilles & Front Fascia ───
function addFrontFascia(g, bp, spec, L, W, H) {
  const bodyM = bodyMat(spec.color || '#888');
  const frontX = L / 2;
  const noseY = H * 0.44;
  const gStyle = bp.grilleStyle || spec.grille || 'slats_chrome';

  // Lower front bumper apron & carbon/dark splitter
  addBox(g, 0.14, 0.14, W * 0.88, frontX + 0.01, 0.27, 0, darkMat);
  if (['super', 'coupe'].includes(bp.body) || ['ev_splitter', 'zeekr_fr_lip', 'honda_redlip', 'gtr_vmotion'].includes(gStyle)) {
    const splitMat = ['ev_splitter', 'zeekr_fr_lip', 'honda_redlip'].includes(gStyle) ? carbonWeaveMat() : carbonMat;
    addBox(g, 0.30, 0.035, W * 0.96, frontX + 0.03, 0.18, 0, splitMat);
    if (gStyle === 'zeekr_fr_lip' || gStyle === 'honda_redlip') {
      addBox(g, 0.31, 0.018, W * 0.97, frontX + 0.035, 0.195, 0, redAccentMat);
    }
    if (gStyle === 'ev_splitter') {
      for (const s of [1, -1]) addBox(g, 0.22, 0.12, 0.03, frontX + 0.02, 0.25, s * W * 0.48, carbonMat);
    }
  }

  // Lower air dam mesh
  addBox(g, 0.05, 0.12, W * 0.56, frontX + 0.03, 0.28, 0, trimMat);

  // Brand-specific 3D Grilles
  if (gStyle === 'kidney' || gStyle === 'kidney_m' || gStyle === 'kidney_black') {
    const frameM = gStyle === 'kidney_black' ? darkMat : chromeMat;
    for (const s of [1, -1]) {
      addBox(g, 0.06, 0.24, 0.28, frontX + 0.02, noseY + 0.05, s * 0.18, frameM);
      addBox(g, 0.07, 0.19, 0.23, frontX + 0.025, noseY + 0.05, s * 0.18, darkMat);
      for (let i = -2; i <= 2; i++) {
        addBox(g, 0.08, 0.18, 0.016, frontX + 0.028, noseY + 0.05, s * 0.18 + i * 0.04, trimMat);
      }
    }
    if (gStyle === 'kidney_m') {
      // M tri-color vertical grille accents
      const mCols = [0x4c9be8, 0x1c3a7a, 0xd4221e];
      mCols.forEach((c, idx) => addBox(g, 0.085, 0.18, 0.018, frontX + 0.03, noseY + 0.05, 0.12 + idx * 0.022, stdMat(`m:${c}`, { color: c, roughness: 0.4 })));
    }
  } else if (gStyle === 'panamericana') {
    addBox(g, 0.06, 0.28, W * 0.52, frontX + 0.02, noseY - 0.02, 0, darkMat);
    for (let i = -5; i <= 5; i++) {
      addBox(g, 0.075, 0.25, 0.018, frontX + 0.025, noseY - 0.02, i * 0.075, chromeMat);
    }
    addCyl(g, 0.08, 0.08, 0.08, frontX + 0.035, noseY - 0.02, 0, chromeMat, 'x', 12);
  } else if (gStyle === 'merc_singlebar') {
    addBox(g, 0.06, 0.22, W * 0.46, frontX + 0.02, noseY + 0.04, 0, darkMat);
    addBox(g, 0.075, 0.045, W * 0.45, frontX + 0.025, noseY + 0.04, 0, chromeMat);
    addCyl(g, 0.075, 0.075, 0.085, frontX + 0.03, noseY + 0.04, 0, chromeMat, 'x', 12);
  } else if (gStyle === 'audi_singleframe' || gStyle === 'audi_rs_honeycomb') {
    const frameM = gStyle === 'audi_rs_honeycomb' ? darkMat : chromeMat;
    addBox(g, 0.06, 0.34, W * 0.46, frontX + 0.02, noseY - 0.02, 0, frameM);
    addBox(g, 0.07, 0.29, W * 0.41, frontX + 0.025, noseY - 0.02, 0, darkMat);
    if (gStyle === 'audi_singleframe') {
      for (let i = -1; i <= 2; i++) addBox(g, 0.078, 0.018, W * 0.39, frontX + 0.028, noseY - 0.04 + i * 0.065, 0, chromeMat);
    }
    // 4 Audi rings
    for (let i = 0; i < 4; i++) {
      const r = new Mesh(new TorusGeometry(0.034, 0.008, 4, 10), chromeMat);
      r.rotation.y = Math.PI / 2;
      r.position.set(frontX + 0.065, noseY + 0.06, -0.075 + i * 0.05);
      g.add(r);
    }
  } else if (gStyle === 'gti_red_u' || gStyle === 'r32_alu_u') {
    const uMat = gStyle === 'r32_alu_u' ? aluMat : darkMat;
    addBox(g, 0.06, 0.32, W * 0.44, frontX + 0.02, noseY - 0.02, 0, uMat);
    addBox(g, 0.07, 0.26, W * 0.38, frontX + 0.025, noseY - 0.02, 0, trimMat);
    if (gStyle === 'gti_red_u') {
      addBox(g, 0.078, 0.022, W * 0.42, frontX + 0.03, noseY + 0.08, 0, redAccentMat);
      addBox(g, 0.078, 0.022, W * 0.42, frontX + 0.03, noseY - 0.01, 0, redAccentMat);
    }
  } else if (gStyle === 'borui_ripple') {
    addBox(g, 0.055, 0.24, W * 0.48, frontX + 0.02, noseY + 0.03, 0, darkMat);
    for (const sc of [0.95, 0.70, 0.45]) {
      addBox(g, 0.065, 0.22 * sc, W * 0.44 * sc, frontX + 0.024, noseY + 0.03, 0, chromeMat);
      addBox(g, 0.07, 0.18 * sc, W * 0.40 * sc, frontX + 0.026, noseY + 0.03, 0, darkMat);
    }
  } else if (gStyle === 'roewe_waterfall') {
    addBox(g, 0.07, 0.34, 0.34, frontX + 0.02, noseY + 0.02, 0, chromeMat);
    addBox(g, 0.075, 0.28, 0.28, frontX + 0.024, noseY + 0.02, 0, darkMat);
    for (let i = -3; i <= 3; i++) addBox(g, 0.08, 0.26, 0.015, frontX + 0.026, noseY + 0.02, i * 0.036, chromeMat);
  } else if (gStyle === 'zhong_bar') {
    addBox(g, 0.06, 0.24, W * 0.44, frontX + 0.02, noseY + 0.03, 0, chromeMat);
    addBox(g, 0.068, 0.19, W * 0.38, frontX + 0.024, noseY + 0.03, 0, darkMat);
    for (let i = -4; i <= 4; i++) addBox(g, 0.074, 0.18, 0.016, frontX + 0.026, noseY + 0.03, i * 0.065, chromeMat);
  } else if (gStyle === 'dragon_face') {
    // BYD Dragon Face: wide octagonal dragon-scale grille + iconic sweeping chrome dragon-mustache bar + Tang crest
    addBox(g, 0.08, 0.28, W * 0.62, frontX + 0.015, noseY - 0.05, 0, darkMat);
    for (let i = -2; i <= 2; i++) addBox(g, 0.088, 0.024, W * 0.56, frontX + 0.02, noseY - 0.05 + i * 0.052, 0, chromeMat);
    addBox(g, 0.075, 0.055, W * 0.90, frontX + 0.028, noseY + 0.13, 0, chromeMat);
    addBox(g, 0.082, 0.075, 0.14, frontX + 0.032, noseY + 0.13, 0, redAccentMat);
  } else if (gStyle === 'wuling_bars') {
    // Wuling Hongguang twin chrome slats + iconic red five-diamond W-wing badge!
    addBox(g, 0.065, 0.22, W * 0.56, frontX + 0.018, noseY + 0.02, 0, darkMat);
    for (const dy of [-0.04, 0.04]) addBox(g, 0.074, 0.026, W * 0.54, frontX + 0.024, noseY + 0.02 + dy, 0, chromeMat);
    addBox(g, 0.082, 0.06, 0.14, frontX + 0.028, noseY + 0.02, 0, redAccentMat);
    addBox(g, 0.06, 0.14, W * 0.60, frontX + 0.015, noseY - 0.16, 0, darkMat);
  } else if (gStyle === 'model_s_plaid') {
    // Facelifted Model S Plaid: sculpted smooth upper nose + wide lower splitter intake & vertical air curtains
    addBox(g, 0.07, 0.15, W * 0.58, frontX + 0.018, noseY - 0.12, 0, darkMat);
    addBox(g, 0.09, 0.035, W * 0.92, frontX + 0.02, 0.22, 0, carbonMat);
    for (const s of [1, -1]) addBox(g, 0.075, 0.20, 0.12, frontX + 0.018, noseY - 0.06, s * W * 0.39, darkMat);
    addBox(g, 0.06, 0.055, 0.065, frontX + 0.024, noseY + 0.14, 0, chromeMat);
  } else if (gStyle === 'qq_smile' || gStyle === 'benben_mouth') {
    addBox(g, 0.06, 0.14, W * 0.44, frontX + 0.02, noseY - 0.06, 0, darkMat);
    addBox(g, 0.065, 0.03, W * 0.46, frontX + 0.024, noseY - 0.12, 0, chromeMat);
  } else if (gStyle === 'miniev_visor') {
    addBox(g, 0.05, 0.20, W * 0.88, frontX + 0.015, noseY + 0.12, 0, darkMat);
    addBox(g, 0.06, 0.06, 0.08, frontX + 0.025, noseY + 0.12, 0, redAccentMat);
  } else if (gStyle === 'ferrari_twin_intakes') {
    for (const s of [1, -1]) {
      addBox(g, 0.08, 0.16, 0.42, frontX + 0.01, noseY - 0.04, s * 0.42, darkMat);
      addBox(g, 0.09, 0.02, 0.38, frontX + 0.015, noseY - 0.04, s * 0.42, bodyM);
    }
  } else if (gStyle === 'evo_intercooler') {
    // Huge EVO VI open mouth with visible silver intercooler core!
    addBox(g, 0.07, 0.26, W * 0.54, frontX + 0.01, noseY - 0.08, 0, darkMat);
    addBox(g, 0.08, 0.20, W * 0.46, frontX + 0.015, noseY - 0.08, 0, aluMat);
    for (let i = -2; i <= 2; i++) addBox(g, 0.085, 0.015, W * 0.44, frontX + 0.02, noseY - 0.08 + i * 0.04, 0, steelMat);
    addBox(g, 0.06, 0.12, W * 0.36, frontX + 0.02, noseY + 0.10, 0, darkMat);
  } else if (gStyle === 'supra_mouth' || gStyle === 'gtr_vmotion' || gStyle === 'porsche_bumper') {
    addBox(g, 0.07, 0.22, W * 0.52, frontX + 0.015, noseY - 0.06, 0, darkMat);
    for (const s of [1, -1]) addBox(g, 0.07, 0.18, 0.24, frontX + 0.015, noseY - 0.06, s * W * 0.35, darkMat);
    if (gStyle === 'gtr_vmotion') {
      addBox(g, 0.075, 0.24, W * 0.46, frontX + 0.02, noseY - 0.03, 0, trimMat);
      addBox(g, 0.08, 0.03, W * 0.48, frontX + 0.025, noseY + 0.08, 0, chromeMat);
    }
  } else if (gStyle === 'tesla_nose') {
    addBox(g, 0.055, 0.16, W * 0.40, frontX + 0.018, noseY + 0.04, 0, bodyM);
    addBox(g, 0.062, 0.022, W * 0.38, frontX + 0.024, noseY + 0.10, 0, chromeMat);
  } else if (gStyle.startsWith('ev_')) {
    // Sleek closed EV bumper + lower cooling shutter
    addBox(g, 0.06, 0.13, W * 0.54, frontX + 0.02, noseY - 0.10, 0, darkMat);
    if (gStyle === 'ev_aero_ducts') {
      for (const s of [1, -1]) addBox(g, 0.09, 0.20, 0.30, frontX + 0.01, noseY - 0.02, s * W * 0.34, darkMat);
    }
  } else {
    // Generic clean 3D slatted/mesh grille
    const isMesh = gStyle.includes('mesh') || gStyle.includes('honda');
    addBox(g, 0.06, 0.18, W * 0.46, frontX + 0.02, noseY + 0.03, 0, darkMat);
    if (!isMesh) {
      for (let i = -1; i <= 1; i++) addBox(g, 0.07, 0.02, W * 0.42, frontX + 0.025, noseY + 0.03 + i * 0.05, 0, gStyle.includes('black') ? trimMat : chromeMat);
    }
    if (bp.redBadge) addBox(g, 0.08, 0.065, 0.075, frontX + 0.028, noseY + 0.12, 0, redAccentMat);
  }

  // Headlights (sculpted per real car!)
  const hStyle = bp.headlightStyle || 'rect_clean';
  const hlY = bp.body === 'super' ? H * 0.48 : bp.body === 'van' ? H * 0.40 : H * 0.54;
  for (const s of [1, -1]) {
    const zOff = s * W * 0.33;
    if (hStyle === 'bmw_angel' || hStyle === 'bmw_hex') {
      addBox(g, 0.05, 0.15, 0.34, frontX + 0.01, hlY, zOff, darkMat);
      for (const dz of [-0.075, 0.075]) {
        const ring = new Mesh(new TorusGeometry(0.05, 0.013, 5, 12), drlMat);
        ring.rotation.y = Math.PI / 2;
        ring.position.set(frontX + 0.04, hlY, zOff + dz);
        g.add(ring);
        addCyl(g, 0.035, 0.035, 0.03, frontX + 0.032, hlY, zOff + dz, lightMat, 'x', 8);
      }
      addBox(g, 0.045, 0.05, 0.08, frontX + 0.015, hlY, s * W * 0.45, amberMat);
    } else if (hStyle === 'qq_goggle' || hStyle === 'round_eyelid') {
      const pod = addCyl(g, 0.135, 0.145, 0.10, frontX + 0.01, hlY + 0.02, zOff, darkMat, 'x', 14);
      addCyl(g, 0.105, 0.105, 0.115, frontX + 0.015, hlY + 0.02, zOff, lightMat, 'x', 14);
      if (hStyle === 'round_eyelid') addBox(g, 0.12, 0.04, 0.24, frontX + 0.02, hlY + 0.12, zOff, bodyM);
      void pod;
    } else if (hStyle === 'porsche_round' || hStyle === 'porsche_quad') {
      addCyl(g, 0.11, 0.12, 0.12, frontX - 0.12, hlY + 0.13, zOff, bodyM, 'x', 12);
      addCyl(g, 0.09, 0.09, 0.06, frontX - 0.06, hlY + 0.13, zOff, lightMat, 'x', 12);
      if (hStyle === 'porsche_quad') {
        for (const [dy, dz] of [[0.03, 0.03], [0.03, -0.03], [-0.03, 0.03], [-0.03, -0.03]]) {
          addBox(g, 0.03, 0.02, 0.02, frontX - 0.025, hlY + 0.13 + dy, zOff + dz, drlMat);
        }
      }
    } else if (hStyle === 'xpeng_saber') {
      // XPeng P7 iconic full-width X-Bot saber LED + wraparound fender ends & recessed lower pods
      if (s === 1) {
        addBox(g, 0.07, 0.042, W * 0.92, frontX + 0.025, hlY + 0.08, 0, drlMat);
        addBox(g, 0.06, 0.018, W * 0.90, frontX + 0.022, hlY + 0.105, 0, darkMat);
      }
      addBox(g, 0.14, 0.04, 0.05, frontX - 0.05, hlY + 0.08, s * W * 0.455, drlMat);
      addBox(g, 0.06, 0.11, 0.26, frontX + 0.015, hlY - 0.11, s * W * 0.35, darkMat);
      addBox(g, 0.068, 0.06, 0.20, frontX + 0.02, hlY - 0.11, s * W * 0.35, lightMat);
    } else if (hStyle === 'plaid_led') {
      // Model S Plaid sharp triple-element LED + crisp L-eyebrow DRL
      addBox(g, 0.12, 0.11, 0.34, frontX - 0.02, hlY + 0.02, zOff, darkMat);
      addBox(g, 0.13, 0.028, 0.32, frontX - 0.015, hlY + 0.06, zOff, drlMat);
      for (const dz of [-0.08, 0, 0.08]) addBox(g, 0.13, 0.045, 0.055, frontX - 0.015, hlY + 0.01, zOff + dz, lightMat);
    } else if (hStyle === 'nio_doubledash') {
      addBox(g, 0.05, 0.032, 0.26, frontX + 0.02, hlY + 0.08, zOff, drlMat);
      addBox(g, 0.05, 0.032, 0.22, frontX + 0.02, hlY + 0.03, zOff, drlMat);
      addBox(g, 0.05, 0.08, 0.18, frontX + 0.02, hlY - 0.10, s * W * 0.36, lightMat);
    } else if (hStyle === 'zeekr_claws') {
      // Top hood-crest claws + lower headlight band
      addBox(g, 0.28, 0.045, 0.065, frontX - 0.24, hlY + 0.22, s * W * 0.34, drlMat);
      addBox(g, 0.05, 0.08, 0.30, frontX + 0.02, hlY - 0.03, zOff, lightMat);
    } else if (hStyle === 'u9_c_gate') {
      // Massive U9 Time-Gate C-wrap DRL extending onto front fenders + stacked projectors
      addBox(g, 0.28, 0.05, 0.32, frontX - 0.10, hlY + 0.12, s * W * 0.36, drlMat);
      addBox(g, 0.07, 0.24, 0.06, frontX + 0.025, hlY + 0.01, s * W * 0.455, drlMat);
      addBox(g, 0.18, 0.05, 0.26, frontX - 0.04, hlY - 0.09, s * W * 0.37, drlMat);
      addBox(g, 0.12, 0.12, 0.18, frontX - 0.01, hlY + 0.01, s * W * 0.34, darkMat);
      addBox(g, 0.13, 0.06, 0.12, frontX, hlY + 0.01, s * W * 0.34, lightMat);
      if (bp.canards) {
        addBox(g, 0.24, 0.025, 0.14, frontX - 0.06, 0.28, s * W * 0.50, carbonWeaveMat(), 0, s * 0.22, 0);
      }
    } else if (hStyle === 'xiaomi_waterdrop') {
      addBox(g, 0.14, 0.09, 0.34, frontX - 0.02, hlY + 0.02, zOff, darkMat);
      addBox(g, 0.15, 0.025, 0.30, frontX - 0.015, hlY + 0.05, zOff, drlMat);
      addBox(g, 0.15, 0.03, 0.28, frontX - 0.015, hlY + 0.01, zOff, lightMat);
    } else if (hStyle === 'peanut_twin') {
      for (const [dz, r] of [[-0.08, 0.075], [0.08, 0.055]]) {
        addCyl(g, r + 0.02, r + 0.02, 0.06, frontX + 0.01, hlY, zOff + dz, chromeMat, 'x', 10);
        addCyl(g, r, r, 0.07, frontX + 0.015, hlY, zOff + dz, lightMat, 'x', 10);
      }
    } else if (hStyle === 'rect_rally_fogs' || hStyle === 'evo_rally_fogs') {
      addBox(g, 0.055, 0.13, 0.30, frontX + 0.015, hlY + 0.02, zOff, lightMat);
      addBox(g, 0.055, 0.13, 0.07, frontX + 0.015, hlY + 0.02, s * W * 0.44, amberMat);
      // Iconic giant round rally fog lamps in bumper!
      const fogR = hStyle === 'rect_rally_fogs' ? 0.105 : 0.085;
      addCyl(g, fogR + 0.015, fogR + 0.015, 0.06, frontX + 0.02, 0.36, s * W * 0.33, darkMat, 'x', 12);
      addCyl(g, fogR, fogR, 0.07, frontX + 0.025, 0.36, s * W * 0.33, lightMat, 'x', 12);
    } else if (hStyle === 'supra_pods') {
      addBox(g, 0.12, 0.11, 0.34, frontX - 0.02, hlY, zOff, darkMat);
      for (const dz of [-0.08, 0, 0.08]) addCyl(g, 0.035, 0.035, 0.08, frontX + 0.01, hlY, zOff + dz, lightMat, 'x', 8);
    } else if (hStyle === 'celica_triangle') {
      addBox(g, 0.24, 0.09, 0.24, frontX - 0.10, hlY + 0.06, zOff, lightMat, 0, 0, -0.25);
    } else if (hStyle === 'ferrari_swept') {
      addBox(g, 0.32, 0.08, 0.20, frontX - 0.18, hlY + 0.09, s * W * 0.35, lightMat, 0, 0, -0.18);
    } else if (hStyle === 'sleek_blade' || hStyle === 'blade_split' || hStyle === 'razor_slit' || hStyle === 'dragon_led' || hStyle === 'wedge_blade') {
      addBox(g, 0.08, 0.065, 0.34, frontX + 0.01, hlY, zOff, darkMat);
      addBox(g, 0.09, 0.032, 0.30, frontX + 0.015, hlY + 0.01, zOff, drlMat);
      addBox(g, 0.09, 0.028, 0.20, frontX + 0.015, hlY - 0.015, zOff, lightMat);
    } else {
      // Classic rectangular / crisp JDM / square LED
      addBox(g, 0.055, 0.12, 0.30, frontX + 0.01, hlY, zOff, darkMat);
      addBox(g, 0.065, 0.09, 0.26, frontX + 0.015, hlY, zOff, lightMat);
      addBox(g, 0.06, 0.09, 0.07, frontX + 0.015, hlY, s * W * 0.44, amberMat);
    }
  }

  // Front License Plate (offset on Lancer EVO VI!)
  const plateZ = bp.offsetPlate ? W * 0.28 : 0;
  const plate = new Mesh(new PlaneGeometry(0.36, 0.11), plateMat());
  plate.rotation.y = Math.PI / 2;
  plate.position.set(frontX + 0.068, 0.31, plateZ);
  g.add(plate);
}

// ─── Sculpted 3D Rear Fascia, Taillights & Exhausts ───
function addRearFascia(g, bp, spec, L, W, H) {
  const rearX = -L / 2;
  const tlY = bp.body === 'super' ? H * 0.56 : H * 0.58;
  const tStyle = bp.taillightStyle || 'split_led';

  // Rear diffuser
  const diffCols = bp.exhaust === 'diffuser_only' ? 6 : 4;
  addBox(g, 0.18, 0.12, W * 0.86, rearX - 0.02, 0.24, 0, darkMat);
  for (let i = 0; i < diffCols; i++) {
    addBox(g, 0.24, 0.11, 0.03, rearX - 0.04, 0.22, -W * 0.32 + i * (W * 0.64 / (diffCols - 1)), carbonMat);
  }

  // Brand-specific 3D Taillights (what players see 95% of the race!)
  if (tStyle === 'quad_round_gtr' || tStyle === 'quad_round_ferrari' || tStyle === 'quad_round_bar') {
    if (tStyle === 'quad_round_bar') {
      for (const s of [1, -1]) addBox(g, 0.05, 0.16, 0.44, rearX - 0.01, tlY, s * W * 0.30, darkMat);
    }
    for (const s of [1, -1]) {
      for (const [dz, r] of [[0.09, 0.085], [-0.09, tStyle === 'quad_round_gtr' ? 0.065 : 0.085]]) {
        const z = s * W * 0.31 + dz * s;
        addCyl(g, r + 0.015, r + 0.015, 0.05, rearX - 0.01, tlY, z, darkMat, 'x', 12);
        addCyl(g, r, r, 0.06, rearX - 0.015, tlY, z, tailBrightMat, 'x', 12);
        if (tStyle === 'quad_round_gtr') {
          addCyl(g, r * 0.45, r * 0.45, 0.065, rearX - 0.018, tlY, z, darkMat, 'x', 10);
        }
      }
    }
  } else if (tStyle === 'saturn_halo') {
    // Xiaomi SU7 Ultra iconic full-width Saturn-ring halo taillight!
    addBox(g, 0.045, 0.14, W * 0.88, rearX - 0.01, tlY, 0, darkMat);
    addBox(g, 0.055, 0.025, W * 0.84, rearX - 0.015, tlY + 0.04, 0, tailBrightMat);
    addBox(g, 0.055, 0.025, W * 0.84, rearX - 0.015, tlY - 0.04, 0, tailBrightMat);
    for (const s of [1, -1]) addBox(g, 0.055, 0.10, 0.04, rearX - 0.015, tlY, s * W * 0.41, tailBrightMat);
  } else if (tStyle === 'xpeng_saber_rear') {
    addBox(g, 0.05, 0.08, W * 0.90, rearX - 0.01, tlY + 0.02, 0, darkMat);
    addBox(g, 0.06, 0.036, W * 0.88, rearX - 0.015, tlY + 0.025, 0, tailBrightMat);
    for (const s of [1, -1]) addBox(g, 0.06, 0.075, 0.14, rearX - 0.015, tlY - 0.02, s * W * 0.38, tailBrightMat);
  } else if (tStyle === 'plaid_rear') {
    // Blacked-out Plaid trunk trim linking sharp C-shaped LED lamps
    addBox(g, 0.05, 0.055, W * 0.56, rearX - 0.01, tlY + 0.01, 0, darkMat);
    for (const s of [1, -1]) {
      addBox(g, 0.055, 0.13, 0.34, rearX - 0.012, tlY, s * W * 0.33, darkMat);
      addBox(g, 0.06, 0.09, 0.30, rearX - 0.016, tlY, s * W * 0.33, tailBrightMat);
      addBox(g, 0.062, 0.035, 0.16, rearX - 0.018, tlY, s * W * 0.28, lightMat);
    }
  } else if (tStyle === 'lightbar_thin' || tStyle === 'lightbar_knot' || tStyle === 'lightbar_segmented' || tStyle === 'lightbar_crystal') {
    addBox(g, 0.045, 0.09, W * 0.88, rearX - 0.01, tlY, 0, darkMat);
    if (tStyle === 'lightbar_segmented' || tStyle === 'lightbar_crystal') {
      for (let i = -5; i <= 5; i++) addBox(g, 0.055, 0.05, 0.09, rearX - 0.015, tlY, i * (W * 0.075), tailBrightMat);
    } else if (tStyle === 'lightbar_knot') {
      // BYD Tang illuminated woven Chinese-Knot rear lightbar!
      addBox(g, 0.055, 0.03, W * 0.86, rearX - 0.015, tlY + 0.018, 0, tailBrightMat);
      addBox(g, 0.055, 0.03, W * 0.86, rearX - 0.015, tlY - 0.018, 0, tailBrightMat);
      for (let i = -4; i <= 4; i++) addBox(g, 0.06, 0.075, 0.035, rearX - 0.018, tlY, i * (W * 0.09), tailBrightMat);
    } else {
      addBox(g, 0.055, 0.04, W * 0.84, rearX - 0.015, tlY, 0, tailBrightMat);
    }
  } else if (tStyle === 'bmw_l') {
    for (const s of [1, -1]) {
      addBox(g, 0.05, 0.14, 0.36, rearX - 0.01, tlY, s * W * 0.30, darkMat);
      addBox(g, 0.055, 0.05, 0.34, rearX - 0.015, tlY - 0.03, s * W * 0.30, tailBrightMat);
      addBox(g, 0.055, 0.12, 0.12, rearX - 0.015, tlY + 0.01, s * W * 0.40, tailMat);
      addBox(g, 0.055, 0.035, 0.14, rearX - 0.015, tlY + 0.04, s * W * 0.25, lightMat);
    }
  } else if (tStyle === 'fk_boomerang') {
    for (const s of [1, -1]) {
      addBox(g, 0.05, 0.22, 0.08, rearX - 0.01, tlY + 0.02, s * W * 0.40, tailBrightMat);
      addBox(g, 0.05, 0.06, 0.24, rearX - 0.01, tlY + 0.10, s * W * 0.31, tailBrightMat);
    }
  } else if (tStyle === 'vertical_van' || tStyle === 'vertical_suv' || tStyle === 'vertical_hatch') {
    for (const s of [1, -1]) {
      addBox(g, 0.05, 0.36, 0.12, rearX - 0.01, tlY + 0.08, s * W * 0.42, tailBrightMat);
      addBox(g, 0.055, 0.08, 0.10, rearX - 0.015, tlY + 0.16, s * W * 0.42, amberMat);
    }
  } else if (tStyle === 'round_cute') {
    for (const s of [1, -1]) {
      addCyl(g, 0.10, 0.10, 0.05, rearX - 0.01, tlY, s * W * 0.34, chromeMat, 'x', 12);
      addCyl(g, 0.075, 0.075, 0.06, rearX - 0.015, tlY, s * W * 0.34, tailBrightMat, 'x', 12);
    }
  } else if (tStyle === 'wide_90s' || tStyle === 'f3_bar') {
    for (const s of [1, -1]) {
      addBox(g, 0.05, 0.15, 0.36, rearX - 0.01, tlY, s * W * 0.30, tailMat);
      addBox(g, 0.055, 0.05, 0.18, rearX - 0.015, tlY + 0.03, s * W * 0.34, amberMat);
    }
    if (tStyle === 'f3_bar') addBox(g, 0.05, 0.035, W * 0.46, rearX - 0.01, tlY + 0.02, 0, chromeMat);
  } else {
    for (const s of [1, -1]) {
      addBox(g, 0.05, 0.11, 0.34, rearX - 0.01, tlY, s * W * 0.31, darkMat);
      addBox(g, 0.055, 0.07, 0.30, rearX - 0.015, tlY, s * W * 0.31, tailBrightMat);
    }
  }

  // Rear spare tire for Chery Tiggo (ruihu)
  if (bp.rearSpareTire) {
    const spare = buildWheel({ radius: 0.33, width: 0.22, style: '5spoke', rimColor: 'silver', tread: 'allterrain' });
    spare.rotation.y = Math.PI / 2;
    spare.position.set(rearX - 0.12, H * 0.50, 0);
    g.add(spare);
    addCyl(g, 0.24, 0.24, 0.06, rearX - 0.23, H * 0.50, 0, bodyMat(spec.color || '#b8bcc0'), 'x', 12);
  }

  // Exhausts
  const ex = bp.exhaust || 'dual_split';
  if (ex === 'top_pipes') {
    // Porsche 918 Spyder iconic top-mounted exhausts behind cockpit!
    for (const s of [-0.14, 0.14]) {
      addCyl(g, 0.055, 0.055, 0.18, -0.78, 0.88, s, chromeMat, 'y', 10);
      addCyl(g, 0.038, 0.038, 0.19, -0.78, 0.89, s, darkMat, 'y', 8);
    }
  } else if (ex === 'triple_center') {
    for (const [z, r] of [[-0.11, 0.052], [0, 0.04], [0.11, 0.052]]) {
      addCyl(g, r, r, 0.20, rearX - 0.05, 0.24, z, chromeMat, 'x', 10);
    }
  } else if (ex === 'dual_center') {
    for (const z of [-0.08, 0.08]) addCyl(g, 0.052, 0.052, 0.20, rearX - 0.05, 0.24, z, chromeMat, 'x', 10);
  } else if (ex === 'dual_oval_rs') {
    for (const s of [1, -1]) {
      const tip = addCyl(g, 0.07, 0.07, 0.20, rearX - 0.05, 0.24, s * W * 0.30, chromeMat, 'x', 12);
      tip.scale.z = 1.45;
    }
  } else if (ex === 'quad_m' || ex === 'quad_split') {
    for (const s of [1, -1]) {
      for (const dz of [-0.075, 0.075]) addCyl(g, 0.048, 0.048, 0.20, rearX - 0.05, 0.24, s * W * 0.28 + dz, chromeMat, 'x', 10);
    }
  } else if (ex === 'quad_amg') {
    for (const s of [1, -1]) {
      for (const dz of [-0.085, 0.085]) addBox(g, 0.18, 0.065, 0.10, rearX - 0.05, 0.24, s * W * 0.28 + dz, chromeMat);
    }
  } else if (ex === 'cold_thrusters') {
    for (const s of [1, -1]) {
      addCyl(g, 0.08, 0.06, 0.16, rearX - 0.03, 0.36, s * 0.38, darkMat, 'x', 10);
      addCyl(g, 0.05, 0.05, 0.03, rearX - 0.11, 0.36, s * 0.38, blueGlowMat, 'x', 10);
    }
  } else if (ex === 'dual_split') {
    for (const s of [1, -1]) addCyl(g, 0.052, 0.052, 0.18, rearX - 0.05, 0.25, s * W * 0.31, chromeMat, 'x', 10);
  } else if (ex === 'dual_left' || ex === 'dual_left_big') {
    const r = ex === 'dual_left_big' ? 0.065 : 0.045;
    for (const dz of [-0.06, 0.06]) addCyl(g, r, r, 0.18, rearX - 0.05, 0.25, W * 0.28 + dz, chromeMat, 'x', 10);
  } else if (ex === 'single_left' || ex === 'single_left_big' || ex === 'single_right' || ex === 'single_right_big') {
    const side = ex.includes('right') ? -1 : 1;
    const r = ex.includes('big') ? 0.072 : 0.045;
    addCyl(g, r, r, 0.18, rearX - 0.05, 0.25, side * W * 0.30, chromeMat, 'x', 10);
  }

  // Rear License Plate
  if (!bp.rearSpareTire) {
    const plate = new Mesh(new PlaneGeometry(0.36, 0.11), plateMat());
    plate.rotation.y = -Math.PI / 2;
    plate.position.set(rearX - 0.055, tlY - 0.16, 0);
    g.add(plate);
  }
}

// ─── Sculpted Wings & Aero ───
function addCarWing(g, bp, spec, L, W, roofY) {
  const wStyle = bp.wingStyle || (spec.wing ? 'gt_body' : bp.lipWing ? 'lip' : null);
  if (!wStyle) return;
  const bodyM = bodyMat(spec.color || '#888');
  const accM = bodyMat(spec.accent || '#ddd');
  const rearX = -L / 2 + 0.26;
  const deckY = bp.body === 'super' ? 0.76 : 0.88;

  if (wStyle === 'lip' || wStyle === 'lip_active' || wStyle === 'lip_carbon') {
    addBox(g, 0.16, 0.05, W * 0.86, rearX, deckY + 0.02, 0, wStyle === 'lip' ? bodyM : carbonWeaveMat());
    return;
  }
  if (wStyle === 'hatch_roof' || wStyle === 'roof_carbon') {
    const m = wStyle === 'roof_carbon' ? carbonWeaveMat() : bodyM;
    addBox(g, 0.34, 0.06, W * 0.84, rearX + 0.18, roofY + 0.03, 0, m, 0, 0, 0.12);
    return;
  }
  if (wStyle === 'supra_hoop') {
    // Classic A80 arched hoop wing
    addBox(g, 0.32, 0.07, W * 0.90, rearX, deckY + 0.28, 0, bodyM);
    for (const s of [1, -1]) addBox(g, 0.32, 0.30, 0.12, rearX, deckY + 0.14, s * W * 0.40, bodyM, 0.15 * s, 0, 0);
    return;
  }
  if (wStyle === 'hoop_low') {
    addBox(g, 0.28, 0.06, W * 0.88, rearX, deckY + 0.20, 0, bodyM);
    for (const s of [1, -1]) addBox(g, 0.26, 0.20, 0.08, rearX, deckY + 0.10, s * W * 0.40, bodyM);
    return;
  }
  if (wStyle === 'wrc_biplane') {
    const wy = deckY + 0.34;
    addBox(g, 0.38, 0.05, W * 0.90, rearX, wy, 0, bodyM);
    addBox(g, 0.28, 0.04, W * 0.86, rearX + 0.02, wy - 0.15, 0, darkMat);
    for (const s of [1, -1]) {
      addBox(g, 0.42, 0.38, 0.05, rearX, deckY + 0.18, s * W * 0.44, bodyM);
    }
    return;
  }
  if (wStyle === 'swan_neck' || wStyle === 'gt_carbon' || wStyle === 'fk_gt' || wStyle === 'u9x_gt') {
    const wy = wStyle === 'fk_gt' ? roofY + 0.08 : wStyle === 'u9x_gt' ? deckY + 0.42 : deckY + 0.36;
    const mat = wStyle === 'fk_gt' ? bodyM : carbonWeaveMat();
    const span = wStyle === 'u9x_gt' ? W * 1.04 : W * 0.98;
    addBox(g, wStyle === 'u9x_gt' ? 0.50 : 0.44, 0.045, span, rearX - 0.04, wy, 0, mat, 0, 0, 0.10);
    for (const s of [1, -1]) {
      const endM = wStyle === 'u9x_gt' ? amberMat : wStyle === 'swan_neck' ? carbonMat : accM;
      addBox(g, 0.48, 0.22, 0.04, rearX - 0.04, wy + 0.02, s * span * 0.50, endM);
      addBox(g, 0.08, Math.max(0.24, wy - deckY + 0.04), 0.05, rearX + 0.04, deckY + (wy - deckY) * 0.5, s * W * 0.28, darkMat);
    }
    return;
  }
  // gt_body
  const wy = deckY + 0.24;
  addBox(g, 0.36, 0.05, W * 0.90, rearX, wy, 0, bodyM, 0, 0, 0.08);
  for (const s of [1, -1]) {
    addBox(g, 0.36, 0.14, 0.04, rearX, wy, s * W * 0.45, accM);
    addBox(g, 0.06, 0.24, 0.05, rearX, deckY + 0.12, s * W * 0.30, darkMat);
  }
}

// ─── Sculpted Standard Car Assembly ───
function buildSculptedCar(spec, bp) {
  const g = new Group();
  const d = bp.dims;
  const L = d.L, W = d.W, H = d.H;
  const color = spec.color || '#888';
  const accent = spec.accent || '#ddd';
  const bodyM = bodyMat(color);
  const accM = bodyMat(accent);

  // 1. Main body with real wheel-arch cutouts!
  const pts = profileWithArches(bp.profile, d.front, d.rear, d.wheel);
  const bodyGeo = extrudeSide(pts, W * 0.96, 0.04);
  const body = new Mesh(bodyGeo, bodyM);
  g.add(body);
  g.add(outline(bodyGeo, 0x0c0e11, 0.22));

  // Dark inner wheel-well liners + floor pan
  addBox(g, L * 0.88, 0.08, W * 0.82, 0, 0.22, 0, darkMat);
  for (const wx of [d.front, d.rear]) {
    for (const s of [1, -1]) {
      addCyl(g, d.wheel * 1.12, d.wheel * 1.12, 0.30, wx, d.wheel, s * (W * 0.38), darkMat, 'z', 14);
    }
  }

  // Side sills / rockers
  for (const s of [1, -1]) {
    addBox(g, (d.front - d.rear) - d.wheel * 2.15, 0.10, 0.07, (d.front + d.rear) * 0.5, 0.24, s * (W * 0.49), bp.cladding ? trimMat : bodyM);
    addBox(g, (d.front - d.rear) - d.wheel * 2.15, 0.04, 0.08, (d.front + d.rear) * 0.5, 0.20, s * (W * 0.50), darkMat);
  }

  // Sculpted wheel-arch flares
  const flareW = 0.045 + (bp.wideFenders || 0);
  for (const wx of [d.front, d.rear]) {
    for (const s of [1, -1]) {
      const arch = new Mesh(new TorusGeometry(d.wheel + 0.08, flareW, 5, 14, Math.PI), bp.cladding ? trimMat : bodyM);
      arch.position.set(wx, d.wheel, s * (W * 0.49));
      g.add(arch);
    }
  }

  // Porsche raised frog-eye front fenders!
  if (bp.frogFenders) {
    for (const s of [1, -1]) {
      const pod = new Mesh(new BoxGeometry(0.95, 0.15, 0.34), bodyM);
      pod.position.set(d.front + 0.15, H * 0.53, s * W * 0.33);
      pod.rotation.z = -0.22;
      g.add(pod);
    }
  }

  // 2. Tapered 3D Greenhouse / Cabin
  const cabGeo = extrudeTaperedCabin(bp.cabin, W * 0.88, bp.cabinTaper || 0.78);
  const cabMesh = new Mesh(cabGeo, glassMat);
  g.add(cabMesh);

  const roofY = Math.max(...bp.cabin.map((p) => p[1]));
  const cabMinX = Math.min(...bp.cabin.map((p) => p[0]));
  const cabMaxX = Math.max(...bp.cabin.map((p) => p[0]));
  const roofTopPts = bp.cabin.filter((p) => p[1] >= roofY - 0.05);
  const rLeft = Math.min(...roofTopPts.map((p) => p[0]));
  const rRight = Math.max(...roofTopPts.map((p) => p[0]));
  const roofW = W * 0.88 * (bp.cabinTaper || 0.78);
  const roofMat = bp.carbonRoof ? carbonWeaveMat() : bp.glassRoof ? glassMat : bp.twoToneRoof ? bodyMat(bp.twoToneRoof) : bodyM;
  addBox(g, Math.max(0.5, rRight - rLeft + 0.06), 0.055, roofW + 0.04, (rLeft + rRight) * 0.5, roofY + 0.015, 0, roofMat);

  // Body-colored A / B / C pillars so windows look framed instead of one black block!
  const pMat = bp.twoToneRoof ? bodyMat(bp.twoToneRoof) : bodyM;
  const frontTopX = rRight, frontBotX = cabMaxX;
  const rearTopX = rLeft, rearBotX = cabMinX;
  const cabBaseY = Math.min(...bp.cabin.map((p) => p[1]));
  const midY = (cabBaseY + roofY) * 0.5;
  const cabH = roofY - cabBaseY;
  const zTop = roofW * 0.5;
  const zBot = W * 0.44;
  for (const s of [1, -1]) {
    // A-pillar
    if (!bp.blackAPillar && !bp.floatingPillar) {
      const dx = frontBotX - frontTopX;
      const aLen = Math.hypot(dx, cabH);
      const aP = addBox(g, 0.065, aLen, 0.04, (frontTopX + frontBotX) * 0.5, midY, s * ((zTop + zBot) * 0.5), pMat);
      aP.rotation.z = Math.atan2(dx, cabH);
      aP.rotation.x = -s * Math.atan2(zBot - zTop, cabH);
    }
    // B-pillar
    const bP = addBox(g, 0.09, cabH * 0.94, 0.035, (rLeft + rRight) * 0.5, midY, s * ((zTop + zBot) * 0.5), trimMat);
    bP.rotation.x = -s * Math.atan2(zBot - zTop, cabH);
    // C-pillar
    if (!bp.floatingPillar) {
      const dxC = rearTopX - rearBotX;
      const cLen = Math.hypot(dxC, cabH);
      const cP = addBox(g, bp.hofmeister ? 0.18 : 0.14, cLen, 0.04, (rearTopX + rearBotX) * 0.5, midY, s * ((zTop + zBot) * 0.5), pMat);
      cP.rotation.z = -Math.atan2(dxC, cabH);
      cP.rotation.x = -s * Math.atan2(zBot - zTop, cabH);
    }
  }

  // LiDAR watchtower on roof (NIO ET9 / ES8 / Xiaomi SU7 Ultra)
  if (bp.lidarPod) {
    addBox(g, 0.16, 0.065, 0.28, rRight - 0.06, roofY + 0.06, 0, darkMat);
    addBox(g, 0.04, 0.03, 0.18, rRight + 0.02, roofY + 0.06, 0, glassMat);
  }
  if (bp.sharkFin) {
    addBox(g, 0.55, 0.18, 0.04, rLeft - 0.18, roofY + 0.08, 0, carbonMat);
  }
  if (bp.roofRails) {
    for (const s of [1, -1]) addBox(g, (rRight - rLeft) * 0.92, 0.045, 0.05, (rLeft + rRight) * 0.5, roofY + 0.055, s * roofW * 0.42, aluMat);
  }

  // Ferrari 360 Modena clear glass engine bay showing red V8 valve covers inside!
  if (bp.glassEngineBay) {
    addBox(g, 0.82, 0.04, W * 0.52, -1.42, 0.85, 0, darkMat);
    for (const s of [-0.15, 0.15]) addBox(g, 0.62, 0.07, 0.13, -1.42, 0.83, s, redAccentMat);
    addBox(g, 0.80, 0.02, W * 0.48, -1.42, 0.88, 0, clearGlassMat);
  }
  if (bp.rearLouvers) {
    for (let i = 0; i < 4; i++) addBox(g, 0.06, 0.02, W * 0.52, -1.55 - i * 0.12, 0.83 - i * 0.02, 0, darkMat);
  }

  // 3. Hood & Body Details
  const hoodX = (cabMaxX + L * 0.5) * 0.5;
  const hoodY = bp.body === 'super' ? H * 0.63 : H * 0.60;
  if (bp.hoodStyle === 'powerdome' || bp.hoodStyle === 'vented_dome') {
    addBox(g, 0.90, 0.055, W * 0.36, hoodX - 0.08, hoodY, 0, bodyM);
    if (bp.hoodStyle === 'vented_dome') {
      for (const s of [1, -1]) addBox(g, 0.24, 0.025, 0.14, hoodX - 0.28, hoodY + 0.03, s * 0.18, darkMat);
    }
  } else if (bp.hoodStyle === 'twin_domes') {
    for (const s of [1, -1]) addBox(g, 0.92, 0.045, 0.16, hoodX - 0.05, hoodY, s * 0.26, bodyM);
  } else if (bp.hoodStyle === 'dual_vents') {
    for (const s of [1, -1]) addBox(g, 0.34, 0.03, 0.22, hoodX + 0.08, hoodY - 0.02, s * 0.24, carbonMat);
  } else if (bp.hoodStyle === 'scoop' || bp.hoodStyle === 'scoop_vents') {
    addBox(g, 0.42, 0.085, 0.40, hoodX - 0.06, hoodY + 0.02, 0, bodyM);
    addBox(g, 0.06, 0.06, 0.34, hoodX + 0.14, hoodY + 0.02, 0, darkMat);
    if (bp.hoodStyle === 'scoop_vents') {
      for (const s of [1, -1]) addBox(g, 0.26, 0.025, 0.16, hoodX - 0.12, hoodY + 0.01, s * 0.34, darkMat);
    }
  } else if (bp.hoodStyle === 'evo_vent') {
    addBox(g, 0.44, 0.035, 0.56, hoodX, hoodY, 0, darkMat);
  } else if (bp.hoodStyle === 'u9_extractor') {
    addBox(g, 0.56, 0.035, W * 0.42, hoodX - 0.05, hoodY - 0.02, 0, carbonWeaveMat());
    for (const s of [1, -1]) addBox(g, 0.26, 0.04, 0.18, hoodX + 0.05, hoodY - 0.01, s * 0.22, darkMat);
  }

  if (bp.racingStripes) {
    for (const s of [-0.14, 0.14]) {
      addBox(g, L * 0.88, 0.018, 0.11, 0, hoodY + 0.01, s, accM);
      addBox(g, rRight - rLeft, 0.018, 0.11, (rLeft + rRight) * 0.5, roofY + 0.046, s, accM);
    }
  }
  if (bp.hoodOrnament) {
    addCyl(g, 0.018, 0.022, 0.09, L / 2 - 0.14, hoodY + 0.04, 0, chromeMat, 'y', 8);
  }

  // Side doors, mirrors, scoops, gills
  const doorXs = ['coupe', 'super'].includes(bp.body) ? [0.22] : [0.55, -0.45];
  for (const s of [1, -1]) {
    for (const dx of doorXs) {
      addBox(g, 0.018, H * 0.34, 0.018, dx, H * 0.42, s * (W * 0.486), darkMat);
      addBox(g, 0.16, 0.032, 0.028, dx - 0.14, H * 0.52, s * (W * 0.494), chromeMat);
    }
    if (bp.chromeBelt) addBox(g, L * 0.62, 0.024, 0.02, -0.05, H * 0.55, s * (W * 0.49), chromeMat);
    if (bp.rubStrips) addBox(g, L * 0.58, 0.055, 0.024, 0, H * 0.36, s * (W * 0.492), darkMat);
    if (bp.sideStripe) addBox(g, L * 0.72, 0.065, 0.022, 0, H * 0.28, s * (W * 0.49), bodyMat(bp.sideStripe));
    if (bp.sideGills) addBox(g, 0.20, 0.08, 0.025, d.front - 0.52, H * 0.45, s * (W * 0.495), darkMat);
    if (bp.fenderLouvers) {
      for (let i = 0; i < 3; i++) addBox(g, 0.035, 0.02, 0.16, d.front - 0.15 + i * 0.09, H * 0.56, s * W * 0.44, darkMat);
    }
    if (bp.suvCladding) {
      addBox(g, 1.35, 0.08, 0.05, 0, 0.27, s * (W * 0.49), darkMat);
      for (const wx of [d.front, d.rear]) {
        addBox(g, d.wheel * 2.15, 0.07, 0.06, wx, d.wheel + 0.42, s * (W * 0.495), darkMat);
      }
    }
    if (bp.sideScoops) {
      addBox(g, 0.50, 0.24, 0.08, -0.58, H * 0.44, s * (W * 0.495), carbonMat);
    }

    // Side mirrors
    const mx = cabMaxX - 0.15;
    const my = cabBaseY + 0.06;
    addBox(g, 0.05, 0.035, 0.14, mx, my, s * (W * 0.49), darkMat);
    addBox(g, 0.16, 0.09, 0.11, mx - 0.03, my + 0.01, s * (W * 0.56), bp.carbonRoof ? carbonMat : bodyM);
  }

  // 4. Front & Rear Fascia + Wing
  addFrontFascia(g, bp, spec, L, W, H);
  addRearFascia(g, bp, spec, L, W, H);
  addCarWing(g, bp, spec, L, W, roofY);

  // 5. Rebuilt 3D Wheels tucked neatly inside wheel arches!
  const wheels = [];
  const wheelZ = W * 0.462;
  for (const [wx, s] of [[d.front, 1], [d.front, -1], [d.rear, 1], [d.rear, -1]]) {
    const wh = buildWheel({
      radius: d.wheel,
      width: bp.body === 'super' ? 0.30 : bp.body === 'micro' ? 0.20 : 0.26,
      style: bp.wheelStyle || 'yspoke',
      rimColor: bp.rimColor || 'silver',
      caliperColor: bp.caliperColor || 0xc01f1a,
      centerLock: !!bp.centerLock,
      tread: bp.body === 'suv' ? 'allterrain' : bp.body === 'super' ? 'semi' : 'sport',
    });
    wh.position.set(wx, d.wheel, s * wheelZ);
    g.add(wh);
    wheels.push(wh);
  }
  g.userData.wheels = wheels;
  g.userData.dims = d;
  return g;
}

// ─── Upgraded Special / Exotic Bodies ───
function buildSpecialCar(spec) {
  const g = new Group();
  const color = spec.color || '#888';
  const accent = spec.accent || '#ddd';
  const bodyM = bodyMat(color);
  const accM = bodyMat(accent);

  if (spec.body === 'truck') {
    const W = 2.1, wheelR = 0.42;
    const d = { L: 6.4, W, H: 2.5, wheel: wheelR, front: 2.1, rear: -2.0 };
    // Sculpted beveled cab
    const cabPts = profileWithArches([[0.8, 0.34], [0.8, 2.05], [2.2, 2.05], [2.75, 1.88], [2.98, 1.15], [2.98, 0.34]], 2.05, 99, wheelR);
    g.add(new Mesh(extrudeSide(cabPts, W * 0.96, 0.05), bodyM));
    // Cargo box with ribbed sides
    addBox(g, 3.85, 2.22, W, -1.25, 1.48, 0, accM);
    addBox(g, 5.9, 0.24, W * 0.9, 0, 0.45, 0, darkMat);
    // Windshield & side windows
    addBox(g, 0.08, 0.62, W * 0.84, 2.80, 1.56, 0, glassMat, 0, 0, -0.22);
    for (const s of [1, -1]) {
      addBox(g, 0.88, 0.54, 0.03, 1.98, 1.56, s * (W * 0.49), glassMat);
      addBox(g, 3.4, 0.36, 0.03, -1.25, 1.35, s * (W * 0.51), bodyM);
      for (let i = 0; i < 6; i++) addBox(g, 0.04, 2.1, 0.04, -2.9 + i * 0.68, 1.48, s * (W * 0.51), trimMat);
      addCyl(g, 0.11, 0.11, 0.06, 2.98, 0.88, s * W * 0.34, lightMat, 'x', 10);
      addBox(g, 0.05, 0.22, 0.22, -3.18, 0.86, s * W * 0.34, tailBrightMat);
    }
    // Chrome grille & stack
    addBox(g, 0.08, 0.52, W * 0.54, 2.99, 0.86, 0, darkMat);
    for (let i = -2; i <= 2; i++) addBox(g, 0.09, 0.03, W * 0.50, 3.00, 0.86 + i * 0.08, 0, chromeMat);
    addCyl(g, 0.06, 0.065, 1.8, 0.82, 1.95, W / 2 + 0.14, chromeMat, 'y', 8);
    const wheels = [];
    for (const [wx, s] of [[2.05, 1], [2.05, -1], [-1.2, 1], [-1.2, -1], [-2.35, 1], [-2.35, -1]]) {
      const wh = buildWheel({ radius: wheelR, width: 0.30, style: 'steelie', rimColor: 'silver', tread: 'allterrain' });
      wh.position.set(wx, wheelR, s * (W * 0.46));
      g.add(wh); wheels.push(wh);
    }
    g.userData.wheels = wheels;
    g.userData.dims = d;
    return g;
  }

  if (spec.body === 'truckcab') {
    const W = 2.2, wheelR = 0.44;
    const d = { L: 5.3, W, H: 2.75, wheel: wheelR, front: 1.78, rear: -1.32 };
    // Carve clean front wheel arch into the cab nose so front wheels never clip bodywork!
    const cabPts = profileWithArches([[-0.22, 0.56], [-0.22, 2.55], [1.85, 2.55], [2.42, 2.25], [2.56, 1.25], [2.56, 0.56]], 1.78, -99, wheelR);
    g.add(new Mesh(extrudeSide(cabPts, W * 0.94, 0.05), bodyM));
    addBox(g, 1.25, 1.98, W * 0.90, -0.84, 1.56, 0, accM); // sleeper cab behind driver
    // Narrow central chassis frame rail (leaves ample clearance for rear tandem duals!)
    addBox(g, 4.7, 0.24, W * 0.48, -0.25, 0.56, 0, darkMat);
    addBox(g, 0.08, 0.68, W * 0.80, 2.46, 1.82, 0, glassMat, 0, 0, -0.2);
    addBox(g, 0.08, 0.60, W * 0.54, 2.57, 1.02, 0, darkMat);
    for (let i = -3; i <= 3; i++) addBox(g, 0.09, 0.03, W * 0.50, 2.58, 1.02 + i * 0.075, 0, chromeMat);
    for (const s of [1, -1]) {
      // Side cab window & clear step sill
      addBox(g, 0.72, 0.54, 0.03, 1.38, 1.82, s * (W * 0.475), glassMat);
      // Chrome exhaust stacks tucked cleanly behind sleeper
      addCyl(g, 0.072, 0.078, 2.25, -0.18, 2.15, s * (W * 0.46), chromeMat, 'y', 8);
      // Short chrome fuel saddle tanks strictly between front (1.78) and rear (-1.32) wheel wells!
      addCyl(g, 0.19, 0.19, 0.82, 0.28, 0.62, s * (W * 0.44), chromeMat, 'x', 10);
      addCyl(g, 0.12, 0.12, 0.06, 2.58, 1.04, s * W * 0.34, lightMat, 'x', 10);
      addBox(g, 0.05, 0.20, 0.24, -2.62, 0.66, s * W * 0.24, tailBrightMat);
    }
    // Fifth wheel coupler plate cleanly above chassis between rear tandem axles
    addCyl(g, 0.58, 0.58, 0.10, -1.78, 0.74, 0, darkMat, 'y', 14);
    const wheels = [];
    for (const [wx, s] of [[1.78, 1], [1.78, -1], [-1.32, 1], [-1.32, -1], [-2.22, 1], [-2.22, -1]]) {
      const wh = buildWheel({ radius: wheelR, width: 0.30, style: 'steelie', rimColor: 'chrome', tread: 'allterrain' });
      wh.position.set(wx, wheelR, s * (W * 0.46));
      g.add(wh); wheels.push(wh);
    }
    g.userData.wheels = wheels;
    g.userData.dims = d;
    return g;
  }

  if (spec.body === 'icecream') {
    const W = 2.05, wheelR = 0.36;
    const d = { L: 5.8, W, H: 2.55, wheel: wheelR, front: 2.0, rear: -1.8 };
    addBox(g, 5.2, 0.26, W * 0.92, -0.1, 0.44, 0, darkMat);
    addBox(g, 3.5, 1.98, W, -0.75, 1.48, 0, bodyM);
    addBox(g, 1.9, 1.52, W * 0.96, 2.0, 1.22, 0, accM);
    addBox(g, 0.08, 0.62, W * 0.78, 2.94, 1.56, 0, glassMat, 0, 0, -0.12);
    // Angled rooftop giant ice-cream cone mounted solidly in a roof cradle + twin slender support struts!
    const roofY = 2.47;
    addBox(g, 0.88, 0.06, 0.64, -0.72, roofY + 0.03, 0, chromeMat);
    for (const sz of [-0.22, 0.22]) {
      addCyl(g, 0.028, 0.028, 0.62, -0.92, roofY + 0.30, sz, chromeMat, 'y', 8);
      addCyl(g, 0.025, 0.025, 0.74, -0.50, roofY + 0.34, sz, chromeMat, 'y', 8);
    }
    const coneGroup = new Group();
    coneGroup.position.set(-0.74, roofY + 0.46, 0);
    coneGroup.rotation.z = -0.52; // tilted backwards at ~30 deg!
    const cone = new Mesh(new ConeGeometry(0.38, 0.92, 12), bodyMat('#e8b86b'));
    cone.rotation.z = Math.PI;
    coneGroup.add(cone);
    const scoop = new Mesh(new SphereGeometry(0.35, 12, 8), bodyMat('#f1a7b5'));
    scoop.position.set(0, 0.44, 0);
    coneGroup.add(scoop);
    const mintScoop = new Mesh(new SphereGeometry(0.25, 10, 8), bodyMat('#8ce5c0'));
    mintScoop.position.set(0.06, 0.74, 0);
    coneGroup.add(mintScoop);
    const cradle = new Mesh(new TorusGeometry(0.26, 0.03, 6, 14), chromeMat);
    cradle.rotation.x = Math.PI / 2;
    cradle.position.y = -0.12;
    coneGroup.add(cradle);
    g.add(coneGroup);
    for (const s of [1, -1]) {
      addBox(g, 2.4, 0.64, 0.03, -0.9, 1.72, s * (W / 2 + 0.015), clearGlassMat);
      addBox(g, 2.6, 0.08, 0.42, -0.9, 2.08, s * (W / 2 + 0.20), accM);
      addBox(g, 2.5, 0.08, 0.28, -0.9, 1.32, s * (W / 2 + 0.14), chromeMat);
      addCyl(g, 0.12, 0.12, 0.06, 2.96, 0.96, s * W * 0.34, lightMat, 'x', 10);
      addBox(g, 0.04, 0.22, 0.14, -2.52, 0.92, s * W * 0.34, tailBrightMat);
    }
    const wheels = [];
    for (const [wx, s] of [[2.0, 1], [2.0, -1], [-1.45, 1], [-1.45, -1]]) {
      const wh = buildWheel({ radius: wheelR, width: 0.28, style: 'steelie', rimColor: 'white', stripeColor: '#f6f2e4' });
      wh.position.set(wx, wheelR, s * (W * 0.46));
      g.add(wh); wheels.push(wh);
    }
    g.userData.wheels = wheels;
    g.userData.dims = d;
    return g;
  }

  if (spec.body === 'bus') {
    const W = 2.15, wheelR = 0.40;
    const d = { L: 7.0, W, H: 3.15, wheel: wheelR, front: 2.3, rear: -2.1 };
    const busPts = profileWithArches([[-3.25, 0.28], [-3.25, 3.10], [2.95, 3.10], [3.15, 2.52], [3.15, 0.28]], 2.3, -2.0, wheelR);
    g.add(new Mesh(extrudeSide(busPts, W * 0.96, 0.05), bodyM));
    addBox(g, 6.0, 0.16, W * 0.92, -0.1, 3.16, 0, accM);
    const winFrame = stdMat('busWin', { color: 0x6292b8, transparent: true, opacity: 0.46, roughness: 0.14, metalness: 0.4 });
    const deckGlow = stdMat('busGlow', { color: 0xedd79a, emissive: 0xab8838, emissiveIntensity: 0.55, roughness: 0.55 });
    // Prominent cream/white horizontal mid-deck floor belt dividing Lower & Upper stories!
    addBox(g, 6.46, 0.14, W * 1.025, -0.05, 1.82, 0, accM);
    addBox(g, 0.06, 0.22, 1.15, 3.04, 1.80, 0, darkMat); // Front destination LED box
    addBox(g, 0.07, 0.12, 0.96, 3.05, 1.80, 0, amberMat);
    for (const s of [1, -1]) {
      // Lower & upper deck clear framed side windows (6 bays per deck!)
      for (let i = 0; i < 6; i++) {
        const bx = -2.42 + i * 0.95;
        // Upper deck bay (recessed warm cabin backing + sky-tinted glass + mullion border)
        addBox(g, 0.84, 0.72, 0.03, bx, 2.46, s * (W * 0.502), darkMat);
        addBox(g, 0.76, 0.62, 0.035, bx, 2.46, s * (W * 0.505), deckGlow);
        addBox(g, 0.76, 0.62, 0.04, bx, 2.46, s * (W * 0.508), winFrame);
        // Lower deck bay
        addBox(g, 0.84, 0.64, 0.03, bx, 1.24, s * (W * 0.502), darkMat);
        addBox(g, 0.76, 0.54, 0.035, bx, 1.24, s * (W * 0.505), deckGlow);
        addBox(g, 0.76, 0.54, 0.04, bx, 1.24, s * (W * 0.508), winFrame);
      }
      addBox(g, 0.06, 0.18, 0.24, 3.18, 0.88, s * W * 0.34, lightMat);
      addBox(g, 0.06, 0.30, 0.18, -3.28, 0.92, s * W * 0.34, tailBrightMat);
    }
    addBox(g, 0.06, 0.80, W * 0.86, 3.08, 2.46, 0, winFrame);
    addBox(g, 0.06, 0.68, W * 0.86, 3.18, 1.32, 0, winFrame);
    addBox(g, 0.05, 0.72, W * 0.76, -3.26, 2.44, 0, winFrame);
    const wheels = [];
    for (const [wx, s] of [[2.3, 1], [2.3, -1], [-2.0, 1], [-2.0, -1]]) {
      const wh = buildWheel({ radius: wheelR, width: 0.30, style: 'steelie', rimColor: 'silver' });
      wh.position.set(wx, wheelR, s * (W * 0.46));
      g.add(wh); wheels.push(wh);
    }
    g.userData.wheels = wheels;
    g.userData.dims = d;
    return g;
  }

  if (spec.body === 'hover') {
    // Dedicated Cross-Channel Air-Cushion Hovercraft (distinct from Back-to-2001 Maglev!)
    const W = 2.34;
    const d = { L: 5.5, W, H: 1.75, wheel: 0.26, front: 1.5, rear: -1.5 };
    const navyTrim = stdMat('hoverNavy', { color: 0x1e437d, roughness: 0.42, metalness: 0.25 });
    // Inflated segmented black rubber air-cushion plenum skirt!
    addBox(g, 5.30, 0.40, W * 1.02, 0, 0.24, 0, darkMat);
    for (let i = -5; i <= 5; i++) {
      addBox(g, 0.22, 0.36, W * 1.05, i * 0.46, 0.22, 0, trimMat);
    }
    // Marine beveled bow & deck hull
    const hullPts = [[-2.55, 0.44], [-2.55, 0.82], [1.75, 0.82], [2.80, 0.68], [2.85, 0.44]];
    g.add(new Mesh(extrudeSide(hullPts, W * 0.94, 0.05), bodyM));
    addBox(g, 5.15, 0.08, W * 0.98, 0.08, 0.48, 0, navyTrim);
    // Forward marine bridge cabin + wrap-around windows
    addBox(g, 1.95, 0.56, W * 0.64, 0.62, 1.08, 0, accM);
    addBox(g, 1.78, 0.32, W * 0.67, 0.66, 1.12, 0, glassMat);
    addCyl(g, 0.03, 0.03, 0.46, 0.20, 1.54, 0, chromeMat, 'y', 8); // Radar mast
    addBox(g, 0.14, 0.05, 0.56, 0.20, 1.75, 0, chromeMat);
    // Twin huge rear shrouded ducted air propellers + vertical rudders (each centered on its own shroud!)
    const propellers = [];
    for (const s of [1, -1]) {
      const sz = s * 0.62;
      const duct = new Mesh(new TorusGeometry(0.44, 0.075, 8, 18), navyTrim);
      duct.rotation.y = Math.PI / 2;
      duct.position.set(-2.02, 1.24, sz);
      g.add(duct);
      addBox(g, 0.46, 0.86, 0.06, -2.28, 1.24, sz, accM); // twin rudders
      addCyl(g, 0.08, 0.08, 0.36, -2.02, 1.24, sz, chromeMat, 'x', 10);
      const fanGroup = new Group();
      for (let i = 0; i < 3; i++) {
        const b = addBox(fanGroup, 0.035, 0.72, 0.08, 0, 0, 0, chromeMat);
        b.rotation.x = (i * Math.PI) / 3;
      }
      fanGroup.position.set(-2.02, 1.24, sz);
      g.add(fanGroup);
      propellers.push(fanGroup);
    }
    g.userData.propellers = propellers;
    g.userData.wheels = [];
    g.userData.dims = d;
    return g;
  }

  if (spec.body === 'maglev') {
    // "Back to 2001" MaizeSoft Time-Capsule Superconducting Maglev Craft!
    const W = 2.18;
    const d = { L: 5.5, W, H: 1.38, wheel: 0.24, front: 1.5, rear: -1.5 };
    const silverBody = stdMat('hoverSilver', { color: 0xcfd6de, roughness: 0.26, metalness: 0.72 });
    const cyanCoil = stdMat('hoverCyan', { color: 0x38e8ff, emissive: 0x169dff, emissiveIntensity: 0.95, roughness: 0.2 });
    const amberFlux = stdMat('hoverAmber', { color: 0xffb830, emissive: 0xe67e10, emissiveIntensity: 0.85, roughness: 0.25 });
    const timePlaqueMat = new MeshStandardMaterial({
      map: canvasTex('back2001', 128, 40, (ctx, w, h) => {
        ctx.fillStyle = '#0e141c'; ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#38e8ff'; ctx.lineWidth = 2; ctx.strokeRect(2, 2, w - 4, h - 4);
        ctx.fillStyle = '#ff9824'; ctx.font = 'bold 13px Consolas, monospace'; ctx.textAlign = 'center';
        ctx.fillText('BACK TO 2001', w / 2, 16);
        ctx.fillStyle = '#48ff8c'; ctx.font = 'bold 11px Consolas, monospace';
        ctx.fillText('MAIZE 1999-2027', w / 2, 31);
      }),
      roughness: 0.35,
    });

    // Underbody dark superconducting chassis + glowing cyan levitation rails
    addBox(g, 4.95, 0.20, W * 0.94, 0.05, 0.26, 0, darkMat);
    for (const s of [1, -1]) {
      addBox(g, 4.75, 0.07, 0.12, 0.05, 0.16, s * (W * 0.44), cyanCoil);
      for (let mx = -1.6; mx <= 1.6; mx += 1.6) {
        addCyl(g, 0.22, 0.22, 0.08, mx, 0.14, s * (W * 0.32), cyanCoil, 'y', 14);
      }
    }

    // DeLorean-inspired sleek wedge hull + pearl aero cladding
    const hullPts = [[-2.55, 0.34], [-2.58, 0.82], [-1.35, 0.88], [1.10, 0.80], [2.68, 0.48], [2.72, 0.34]];
    g.add(new Mesh(extrudeSide(hullPts, W * 0.90, 0.05), bodyM));
    addBox(g, 5.20, 0.14, W * 0.94, 0.06, 0.40, 0, silverBody);

    // Front cyan lightblade + splitter
    addBox(g, 0.08, 0.09, W * 0.84, 2.71, 0.46, 0, cyanCoil);
    addBox(g, 0.34, 0.06, W * 0.94, 2.58, 0.30, 0, darkMat);

    // Tapered futuristic glass gullwing canopy
    const cabPts = [[-1.15, 0.86], [-0.45, 1.34], [0.55, 1.32], [1.18, 0.80]];
    g.add(new Mesh(extrudeTaperedCabin(cabPts, W * 0.72, 0.78), glassMat));
    addBox(g, 0.98, 0.05, W * 0.58, 0.05, 1.34, 0, silverBody);

    // Rear louver slats (DeLorean tribute!) + glowing Y-Flux Capacitor Core
    for (let i = 0; i < 4; i++) {
      addBox(g, 0.24, 0.06, W * 0.62, -1.30 - i * 0.26, 0.94 - i * 0.03, 0, darkMat, 0, 0, -0.15);
    }
    addBox(g, 0.36, 0.34, 0.46, -1.62, 1.06, 0, darkMat);
    addBox(g, 0.04, 0.24, 0.05, -1.62, 1.04, 0, amberFlux);
    addBox(g, 0.04, 0.16, 0.05, -1.62, 1.12, 0.10, cyanCoil, 0.55, 0, 0);
    addBox(g, 0.04, 0.16, 0.05, -1.62, 1.12, -0.10, cyanCoil, -0.55, 0, 0);

    // Side & rear "BACK TO 2001 / MAIZE 1999-2027" digital time-circuit plaques
    addBox(g, 0.03, 0.34, 1.08, -2.59, 0.60, 0, timePlaqueMat);
    for (const s of [1, -1]) {
      addBox(g, 1.24, 0.30, 0.03, -0.45, 0.64, s * (W * 0.465), timePlaqueMat);
      addBox(g, 1.05, 0.38, 0.06, -1.95, 0.98, s * (W * 0.43), accM);
      // Twin rear cryo-plasma flux nozzles
      addCyl(g, 0.22, 0.26, 0.38, -2.52, 0.68, s * 0.56, darkMat, 'x', 14);
      addCyl(g, 0.16, 0.16, 0.04, -2.72, 0.68, s * 0.56, cyanCoil, 'x', 14);
    }

    // Center spinning flux turbine rotor (`propeller` rotates automatically in animateCar)
    const fanGroup = new Group();
    addCyl(g, 0.24, 0.24, 0.22, -2.35, 1.02, 0, silverBody, 'x', 14);
    for (let i = 0; i < 3; i++) {
      const b = addBox(fanGroup, 0.04, 0.42, 0.08, 0, 0, 0, cyanCoil);
      b.rotation.x = (i * Math.PI) / 3;
    }
    fanGroup.position.set(-2.48, 1.02, 0);
    g.add(fanGroup);
    g.userData.propeller = fanGroup;
    g.userData.wheels = [];
    g.userData.dims = d;
    return g;
  }

  if (spec.body === 'rocket') {
    const W = 1.6, wheelR = 0.28;
    const d = { L: 6.0, W, H: 1.1, wheel: wheelR, front: 1.9, rear: -1.8 };
    addCyl(g, 0.58, 0.66, 4.7, 0.2, 0.82, 0, bodyM, 'x', 16);
    const nose = new Mesh(new ConeGeometry(0.58, 1.35, 16), accM);
    nose.rotation.z = -Math.PI / 2; nose.position.set(3.2, 0.82, 0); g.add(nose);
    addBox(g, 1.3, 0.34, 0.52, 0.55, 1.24, 0, glassMat);
    addCyl(g, 0.46, 0.60, 0.55, -2.42, 0.82, 0, chromeMat, 'x', 14);
    addCyl(g, 0.38, 0.38, 0.04, -2.72, 0.82, 0, amberMat, 'x', 14);
    for (const s of [1, -1]) {
      addBox(g, 1.3, 0.76, 0.06, -1.65, 0.88, s * 0.78, accM);
    }
    const wheels = [];
    for (const [wx, s] of [[1.8, 1], [1.8, -1], [-1.8, 1], [-1.8, -1]]) {
      const wh = buildWheel({ radius: wheelR, width: 0.20, style: 'f1', rimColor: 'black', tread: 'slick', caliperColor: 0xc01f1a });
      wh.position.set(wx, wheelR, s * (W * 0.50));
      g.add(wh); wheels.push(wh);
    }
    g.userData.wheels = wheels;
    g.userData.dims = d;
    return g;
  }

  // Plane & XPENG AeroHT X2 style sleek quad-rotor eVTOL
  const isEvtol = /evtol|旅航者|亿航|飞车|ae200/i.test(`${spec.key || ''} ${spec.name || ''}`);
  if (isEvtol) {
    const d = { L: 5.0, W: 3.1, H: 1.45, wheel: 0.16, front: 1.35, rear: -1.35 };
    const podBlack = darkMat;
    const redLed = stdMat('led_red', { color: 0xff4030, emissive: 0xff2218, emissiveIntensity: 1.2 });
    const greenLed = stdMat('led_green', { color: 0x3dff74, emissive: 0x1ee055, emissiveIntensity: 1.2 });
    const frontWhiteLed = stdMat('led_white', { color: 0xffffff, emissive: 0xdff6ff, emissiveIntensity: 1.0 });

    // Streamlined teardrop pearlescent-white fuselage
    const hull = new Mesh(
      extrudeSide(
        [[-2.15, 0.60], [-2.25, 0.88], [-1.50, 1.18], [-0.20, 1.34], [1.15, 1.16], [2.12, 0.82], [2.28, 0.56], [1.75, 0.42], [-1.75, 0.42]],
        1.32,
        0.04
      ),
      bodyM
    );
    g.add(hull);
    // Dark aero nose cowl & slim white chin DRL bar (like X2 nose seam!)
    addBox(g, 0.48, 0.24, 1.16, 1.98, 0.58, 0, carbonMat, 0, 0, -0.22);
    addBox(g, 0.08, 0.04, 1.06, 2.24, 0.68, 0, frontWhiteLed);
    addBox(g, 0.30, 0.04, 0.04, 2.02, 0.48, 0, frontWhiteLed);

    // Swept panoramic dark cockpit glass canopy
    const canopy = new Mesh(
      extrudeTaperedCabin(
        [[-1.30, 0.96], [-0.65, 1.44], [0.45, 1.42], [1.45, 1.02], [1.62, 0.92], [-1.35, 0.92]],
        1.04,
        0.74
      ),
      glassMat
    );
    g.add(canopy);

    // Twin sleek curved carbon landing skids underneath belly
    for (const s of [-1, 1]) {
      const sz = s * 0.52;
      addBox(g, 2.55, 0.06, 0.07, 0.05, 0.05, sz, podBlack);
      addBox(g, 0.34, 0.06, 0.07, 1.44, 0.14, sz, podBlack, 0, 0, 0.52);
      addBox(g, 0.06, 0.42, 0.06, 0.82, 0.24, sz * 0.92, aluMat, s * -0.18, 0, 0.12);
      addBox(g, 0.06, 0.42, 0.06, -0.78, 0.24, sz * 0.92, aluMat, s * -0.18, 0, -0.12);
    }

    // 4 Diagonal Carbon Outrigger Arms + Coaxial Motor Pods + Red/Green Nav Rings + Twin Blades
    const rotors = [];
    const arms = [
      [1.22, 1.28, redLed],
      [1.22, -1.28, greenLed],
      [-1.18, 1.24, redLed],
      [-1.18, -1.24, greenLed],
    ];
    for (const [ax, az, ledM] of arms) {
      const len = Math.hypot(ax * 0.72, az * 0.78);
      const ang = Math.atan2(az * 0.78, ax * 0.72);
      const arm = addBox(g, len, 0.08, 0.11, ax * 0.58, 0.76, az * 0.58, carbonMat, 0, -ang, 0);
      void arm;
      // Vertical coaxial motor nacelle at arm tip
      addCyl(g, 0.11, 0.12, 0.52, ax, 0.82, az, podBlack, 'y', 12);
      // Glowing red / green LED ring band on motor pod (matches photo!)
      addCyl(g, 0.122, 0.122, 0.05, ax, 0.94, az, ledM, 'y', 12);
      // Upper + Lower coaxial spinning rotors
      for (const ry of [1.12, 0.52]) {
        const rotor = new Group();
        rotor.position.set(ax, ry, az);
        addCyl(rotor, 0.06, 0.08, 0.07, 0, 0, 0, chromeMat, 'y', 8);
        for (let b = 0; b < 2; b++) {
          const blade = addBox(rotor, 1.18, 0.018, 0.075, 0, 0, 0, carbonMat);
          blade.rotation.y = b * Math.PI * 0.5 + (ry < 0.8 ? 0.6 : 0);
        }
        g.add(rotor);
        rotors.push(rotor);
      }
    }
    g.userData.rotors = rotors;
    g.userData.wheels = [];
    g.userData.dims = d;
    return g;
  }

  const d = { L: 5.6, W: 1.5, H: 1.1, wheel: 0.22, front: 1.4, rear: -1.3 };
  addCyl(g, 0.44, 0.52, 4.5, 0.1, 0.68, 0, bodyM, 'x', 14);
  const nose = new Mesh(new ConeGeometry(0.44, 1.1, 14), accM);
  nose.rotation.z = -Math.PI / 2; nose.position.set(2.9, 0.68, 0); g.add(nose);
  const canopy = new Mesh(new SphereGeometry(0.46, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), glassMat);
  canopy.scale.set(1.4, 0.72, 0.88); canopy.position.set(0.7, 1.02, 0); g.add(canopy);
  addBox(g, 1.05, 0.07, 3.4, 0.15, 0.74, 0, bodyM);
  addBox(g, 0.55, 0.06, 1.6, -1.95, 0.76, 0, bodyM);
  addBox(g, 0.68, 0.78, 0.06, -1.95, 1.12, 0, accM);

  const prop = new Group();
  addCyl(prop, 0.10, 0.12, 0.18, 0, 0, 0, chromeMat, 'x', 10);
  for (let i = 0; i < 3; i++) {
    const a = i * Math.PI * 2 / 3;
    const blade = addBox(prop, 0.04, 0.64, 0.11, 0, Math.cos(a) * 0.30, Math.sin(a) * 0.30, darkMat);
    blade.rotation.x = a;
  }
  prop.position.set(3.48, 0.68, 0);
  g.add(prop);
  g.userData.propeller = prop;

  const pw = [];
  for (const [wx, wz] of [[1.4, 0.62], [1.4, -0.62], [-1.3, 0]]) {
    addBox(g, 0.07, 0.42, 0.07, wx, 0.36, wz, darkMat);
    const wh = buildWheel({ radius: 0.22, width: 0.12, style: '5spoke', rimColor: 'silver', tread: 'aero_rib' });
    wh.position.set(wx, 0.22, wz);
    g.add(wh); pw.push(wh);
  }
  g.userData.wheels = pw;
  g.userData.dims = d;
  return g;
}

const FALLBACK_BY_BODY = {
  sedan: 'bmw_e46',
  coupe: 'supra_a80',
  hatch: 'vw_gti_mk5',
  micro: 'chery_qq',
  suv: 'byd_tang',
  super: 'ferrari_360',
  wagon: 'audi_rs6',
  van: 'wuling_hongguang',
};

export function buildCar(spec) {
  let g;
  if (['truck', 'truckcab', 'icecream', 'hover', 'maglev', 'rocket', 'bus', 'plane'].includes(spec.body)) {
    g = buildSpecialCar(spec);
  } else {
    const bpKey = resolveBlueprintKey(spec) || FALLBACK_BY_BODY[spec.body] || 'bmw_e46';
    const bp = CAR_BLUEPRINTS[bpKey];
    g = buildSculptedCar(spec, bp);
  }

  const d = g.userData.dims;
  const shadowTex = canvasTex('car_shadow', 64, 32, (ctx, w, h) => {
    const grd = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
    grd.addColorStop(0, 'rgba(0,0,0,0.58)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
  });
  const shadow = new Mesh(
    new PlaneGeometry(d.L * 1.08, spec.body === 'plane' ? 3.6 : d.W * 1.38),
    new MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  g.add(shadow);
  return g;
}

export function makeCrowdTexture(colorA = '#252c32', colorB = '#38424a') {
  return canvasTex(`crowd:${colorA}:${colorB}`, 64, 32, (ctx, w, h) => {
    ctx.fillStyle = colorA; ctx.fillRect(0, 0, w, h);
    const cols = ['#e8c56a', '#ece9df', '#c4463b', '#4a7ab8', '#6aa56a', '#f2a640', '#d9d5c9'];
    for (let y = 4; y < h; y += 5) {
      ctx.fillStyle = colorB; ctx.fillRect(0, y + 3, w, 1);
      for (let x = 2 + (y % 10 ? 2 : 0); x < w; x += 4) {
        ctx.fillStyle = cols[(x * 7 + y * 3) % cols.length];
        ctx.fillRect(x, y, 2, 3);
      }
    }
  });
}

export function makeAsphaltTexture() {
  return canvasTex('asphalt_v2', 128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#3d4248'; ctx.fillRect(0, 0, w, h);
    // Subtle rubbered-in lane tracks
    ctx.fillStyle = '#363a40';
    for (const y of [12, 38, 64, 90, 116]) ctx.fillRect(0, y - 5, w, 10);
    // Pixel grain
    for (let i = 0; i < 1100; i++) {
      const x = (i * 37) % w, y = (i * 61) % h;
      const v = 52 + ((i * 13) % 24);
      ctx.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
      ctx.fillRect(x, y, 2, 2);
    }
  });
}

export function disposeTree(obj) {
  obj.traverse((o) => {
    if (o.geometry && !o.geometry.userData?.shared) o.geometry.dispose();
    if (o.isSprite && o.material) {
      if (o.material.map) o.material.map.dispose();
      o.material.dispose();
    }
  });
}

import {
  AdditiveBlending, BoxGeometry, CanvasTexture, Clock, Color, ConeGeometry, CylinderGeometry, DirectionalLight, DoubleSide, Fog, Group, HemisphereLight, Mesh, MeshBasicMaterial, MeshStandardMaterial, NearestFilter, PerspectiveCamera, PlaneGeometry, RepeatWrapping, SRGBColorSpace, Scene, SphereGeometry, Sprite, SpriteMaterial, TorusGeometry, Vector3, WebGLRenderer
} from 'three';
import { buildCar, disposeTree, makeAsphaltTexture, makeCrowdTexture } from './car.js';
import { audio } from './audio.js';
import { ABILITIES } from './data.js';
import { eraOf, ERA_THEMES, ERA_ADS, adTexture, populateEraScenery, updateEraScenery } from './scenery.js';

const darkMat = new MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.7 });
const chromeMat = new MeshStandardMaterial({ color: 0xd8dade, roughness: 0.25, metalness: 0.9 });
const LANES = [7.6, 3.8, 0, -3.8, -7.6];
const PLAYER_LANE = 2;
const IS_TOUCH = matchMedia('(pointer: coarse)').matches;
const TOUCH_HINT = window.innerHeight > window.innerWidth
  ? '建议横屏 · 绿灯亮起后按住右下角「加速」'
  : '绿灯亮起后按住右下角「加速」按钮';

function canvasTexture(w, h, draw) {
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
  return t;
}

function curbTexture() {
  return canvasTexture(64, 16, (ctx, w, h) => {
    ctx.fillStyle = '#d42c24';
    ctx.fillRect(0, 0, 32, h);
    ctx.fillStyle = '#ece9df';
    ctx.fillRect(32, 0, 32, h);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(0, h - 3, w, 3);
  });
}

function armcoTexture() {
  return canvasTexture(64, 32, (ctx, w, h) => {
    ctx.fillStyle = '#b4bcc2';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#7e868e';
    ctx.fillRect(0, 9, w, 5);
    ctx.fillRect(0, 20, w, 4);
    ctx.fillStyle = '#d9dfe4';
    ctx.fillRect(0, 5, w, 3);
    ctx.fillRect(0, 15, w, 3);
    ctx.fillStyle = '#d82820';
    ctx.fillRect(4, 12, 8, 6);
    ctx.fillStyle = '#f2efe4';
    ctx.fillRect(36, 12, 8, 6);
  });
}

function box(color, w, h, d, x = 0, y = 0, z = 0, mat) {
  const m = new Mesh(
    new BoxGeometry(w, h, d),
    mat || new MeshStandardMaterial({ color, roughness: 0.8 })
  );
  m.position.set(x, y, z);
  return m;
}

function hazardTexture() {
  return canvasTexture(128, 32, (ctx, w, h) => {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e5c227';
    for (let x = -h; x < w + h; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, h); ctx.lineTo(x + 16, h); ctx.lineTo(x + 16 + h, 0); ctx.lineTo(x + h, 0);
      ctx.closePath(); ctx.fill();
    }
  });
}

function shadowTexture() {
  return canvasTexture(64, 64, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(0,0,0,0.6)');
    g.addColorStop(0.6, 'rgba(0,0,0,0.3)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

function noteTexture(color) {
  return canvasTexture(48, 48, (ctx) => {
    ctx.font = 'bold 38px Zpix, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 5;
    ctx.strokeText('♪', 24, 26);
    ctx.fillStyle = color;
    ctx.fillText('♪', 24, 26);
  });
}

function checkerTexture() {
  return canvasTexture(128, 32, (ctx, w, h) => {
    const s = 16;
    for (let y = 0; y < h; y += s) {
      for (let x = 0; x < w; x += s) {
        ctx.fillStyle = ((x / s + y / s) % 2) ? '#111' : '#eee';
        ctx.fillRect(x, y, s, s);
      }
    }
  });
}

function makeDistanceMarker(meters) {
  const g = new Group();
  const post = new Mesh(new BoxGeometry(0.14, 1.5, 0.14), darkMat);
  post.position.y = 0.75;
  g.add(post);
  const tex = canvasTexture(64, 48, (ctx, w, h) => {
    ctx.fillStyle = '#f2efe4'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#c01f1a'; ctx.fillRect(0, 0, w, 9);
    ctx.fillStyle = '#15181b'; ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`${meters}m`, w / 2, 29);
  });
  const board = new Mesh(new BoxGeometry(0.1, 0.95, 1.35), new MeshStandardMaterial({ map: tex, roughness: 0.7 }));
  board.position.y = 1.65;
  g.add(board);
  return g;
}

export class Race {
  constructor(container, opts) {
    this.container = container;
    this.season = opts.season;
    this.seasonIndex = opts.seasonIndex;
    this.raceIdx = opts.raceIdx;
    this.cup = opts.cup || null;
    this.teamName = opts.teamName || '默认车队';
    this.aiTarget = opts.aiTarget || null;
    this.equipped = opts.equipped || null;
    this.build = opts.build;
    this.rivals = opts.rivals;
    this.onFinish = opts.onFinish;
    this.onWarp2001 = opts.onWarp2001 || null;
    this.awardFn = opts.award;
    this.warping = null;
    this.fast = new URLSearchParams(location.search).has('fast');
    this.dist = this.fast ? 300 : (opts.dist || 600);
    this.position = 5;
    this.shake = 0;

    this.phase = 'intro';
    this.t = 0;
    this.raceTime = 0;
    this.falseStarts = 0;
    this.dq = false;
    this.throttle = false;
    this.running = false;
    this.danceDone = false;
    this.danceBonus = false;
    this.prizeBonusFrac = 0;
    this.finished = false;
    this.result = null;
    this.msgTimer = 0;

    this.ability = this.build.ability ? { ...this.build.ability, left: this.build.ability.uses, cd: 0, active: null } : null;

    this.setupDom();
    this.setupThree();
    this.setupCars();
    this.setupEnv();
    this.bindInput();
    if (new URLSearchParams(location.search).has('qa')) window.__race = this;

    this.clock = new Clock();
    this.last = performance.now();
    this.raf = null;
    this.startSequence();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  // ---------------- DOM ----------------
  setupDom() {
    this.container.innerHTML = '';
    this.wrap = document.createElement('div');
    this.wrap.className = 'race-wrap';
    this.wrap.innerHTML = `
      <div class="race-hud">
        <div class="hud-top">
          <div class="hud-left-col">
            <div style="display:flex; gap:10px; align-items:flex-start">
              <div class="lights-panel" id="lights">
                ${'<span class="light"></span>'.repeat(5)}
              </div>
              <div class="go-badge" id="goBadge">GO</div>
            </div>
            <div class="hud-feed" id="rivalFeed"></div>
          </div>
          <div class="hud-mid">
            <div class="race-title">${this.cup ? `${this.cup.name}（${this.dist}m 可选杯赛）` : `${this.season.years} · ${this.season.name} · 第 ${this.raceIdx + 1} / 6 场（${this.dist}m）`}</div>
            <div class="pos">名次 <b id="pos">5</b> / 5</div>
          </div>
          <div class="hud-ability" id="abilityBox">
            <div class="name"><span id="abName">—</span></div>
            <div class="desc" id="abDesc">本车没有特殊功能</div>
            <div class="uses" id="abUses"></div>
          </div>
        </div>
        <div class="hud-msg" id="msg"></div>
        <div class="hud-bottom">
          <div class="speedo">
            <span class="num" id="speed">0</span>
            <span class="unit">公里/小时</span>
            <span class="gear" id="gear">N</span>
          </div>
          <div class="progress-box">
            <div class="progress-labels"><span>起点</span><span id="distLabel">0 / ${this.dist} m</span><span>终点</span></div>
            <div class="progress-track" id="track">
              <div class="progress-fill" id="fill"></div>
              <div class="progress-car" id="pcar" style="left:0%"></div>
              ${'<div class="progress-rival"></div>'.repeat(4)}
            </div>
          </div>
          <div style="width:170px"></div>
        </div>
        <div class="start-banner" id="banner">
          <div class="big">START YOUR ENGINE!!!</div>
          <div class="small">${IS_TOUCH ? TOUCH_HINT : '绿灯亮起后按住 ↑ 键加速'}</div>
        </div>
        <button class="touch-throttle" id="touchThrottle">加速</button>
        <div class="race-dialog" id="raceDialog">
          <div class="modal-box">
            <div class="titlebar"><span class="title">抢跑</span></div>
            <div class="modal-body" id="dialogBody"></div>
            <div class="modal-actions"><button class="btn ok" id="dialogBtn">重新发车</button></div>
          </div>
        </div>
        <div class="results" id="results"></div>
      </div>`;
    this.container.appendChild(this.wrap);

    this.$lights = [...this.wrap.querySelectorAll('.light')];
    this.$go = this.wrap.querySelector('#goBadge');
    this.$pos = this.wrap.querySelector('#pos');
    this.$speed = this.wrap.querySelector('#speed');
    this.$gear = this.wrap.querySelector('#gear');
    this.$fill = this.wrap.querySelector('#fill');
    this.$pcar = this.wrap.querySelector('#pcar');
    this.$rivals = [...this.wrap.querySelectorAll('.progress-rival')];
    this.$dist = this.wrap.querySelector('#distLabel');
    this.$msg = this.wrap.querySelector('#msg');
    this.$feed = this.wrap.querySelector('#rivalFeed');
    this.$banner = this.wrap.querySelector('#banner');
    this.$results = this.wrap.querySelector('#results');
    this.$dialog = this.wrap.querySelector('#raceDialog');
    this.$dialogBody = this.wrap.querySelector('#dialogBody');
    this.$dialogBtn = this.wrap.querySelector('#dialogBtn');
    this.$abName = this.wrap.querySelector('#abName');
    this.$abDesc = this.wrap.querySelector('#abDesc');
    this.$abUses = this.wrap.querySelector('#abUses');
    this.$abBox = this.wrap.querySelector('#abilityBox');

    if (this.ability) {
      this.$abName.textContent = this.ability.name;
      this.$abDesc.textContent = this.ability.desc;
    }
    this.renderAbility();
  }

  // ---------------- THREE ----------------
  setupThree() {
    const era = eraOf(this.seasonIndex);
    const th = ERA_THEMES[era];
    this.era = era;
    this.renderer = new WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(1);
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.setClearColor(th.sky);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.wrap.insertBefore(this.renderer.domElement, this.wrap.firstChild);

    this.scene = new Scene();
    this.scene.background = new Color(th.sky);
    this.scene.fog = new Fog(th.fog, th.fogNear, th.fogFar);

    this.camera = new PerspectiveCamera(38, 16 / 9, 0.1, 500);
    this.camera.position.set(-21.0, 4.6, 6.8);
    this.lookTarget = new Vector3(2.0, 2.7, -0.3);
    this.camera.lookAt(this.lookTarget);

    const hemi = new HemisphereLight(th.hemiSky, th.hemiGround, th.hemiI);
    this.scene.add(hemi);
    const sun = new DirectionalLight(th.sun, th.sunI);
    sun.position.set(40, 60, 30);
    this.scene.add(sun);
    const rim = new DirectionalLight(th.rim, 1.0);
    rim.position.set(-30, 20, -20);
    this.scene.add(rim);
    const fill = new DirectionalLight(0xdfefff, era === 3 ? 0.55 : 0.85);
    fill.position.set(20, 12, 40);
    this.scene.add(fill);

    this.resize = this.resize.bind(this);
    this.ro = new ResizeObserver(this.resize);
    this.ro.observe(this.wrap);
    this.resize();
  }

  resize() {
    const w = this.wrap.clientWidth || 800;
    const h = this.wrap.clientHeight || 450;
    const scale = Math.min(1, 900 / w);
    this.renderer.setSize(Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale)), false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  // ---------------- CARS ----------------
  setupCars() {
    const shell = this.build.shell;
    this.player = {
      idx: 4, lane: LANES[PLAYER_LANE], x: 0, v: 0, top: this.build.top, accel: this.build.accel,
      group: buildCar(shell), finished: false, finishTime: null, isPlayer: true, jumping: 0,
    };
    this.player.group.position.set(0, 0, this.player.lane);
    this.scene.add(this.player.group);

    this.playerShadow = new Mesh(
      new PlaneGeometry(5.4, shell.body === 'plane' ? 3.7 : 2.8),
      new MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: 0.42 })
    );
    this.playerShadow.rotation.x = -Math.PI / 2;
    this.playerShadow.position.set(0, 0.035, this.player.lane);
    this.scene.add(this.playerShadow);

    this.thrusters = [];
    const flameGeo = new ConeGeometry(0.24, 1.9, 8);
    for (const z of [-0.5, 0.5]) {
      const f = new Mesh(flameGeo, new MeshBasicMaterial({
        color: 0x9fe8ff, transparent: true, opacity: 0.95, blending: AdditiveBlending, depthWrite: false,
      }));
      f.rotation.z = Math.PI / 2;
      f.position.set(-2.75, 0.45, z);
      f.visible = false;
      this.player.group.add(f);
      this.thrusters.push(f);
    }

    // Side & underbody RCS cold-gas attitude thrusters (for Roadster 2 SpaceX roll & hover stabilization!)
    this.rcsJets = [];
    const rcsGeo = new ConeGeometry(0.11, 0.95, 7);
    const rcsMat = new MeshBasicMaterial({
      color: 0xdff7ff, transparent: true, opacity: 0.9, blending: AdditiveBlending, depthWrite: false,
    });
    // Lateral roll jets: [x, y, z, rx, role] (role: 'rollUp' fires on one flank during roll, 'down' fires underbody)
    const rcsSpecs = [
      [1.05, 0.34, 1.04, -Math.PI / 2, 'sideR'],
      [-1.05, 0.34, 1.04, -Math.PI / 2, 'sideR'],
      [1.05, 0.34, -1.04, Math.PI / 2, 'sideL'],
      [-1.05, 0.34, -1.04, Math.PI / 2, 'sideL'],
      [1.15, 0.14, 0.55, Math.PI, 'down'],
      [1.15, 0.14, -0.55, Math.PI, 'down'],
      [-1.15, 0.14, 0.55, Math.PI, 'down'],
      [-1.15, 0.14, -0.55, Math.PI, 'down'],
    ];
    const attachRcs = (group) => {
      const list = [];
      for (const [rx, ry, rz, rotX, role] of rcsSpecs) {
        const j = new Mesh(rcsGeo, rcsMat);
        j.position.set(rx, ry, rz);
        j.rotation.x = rotX;
        j.visible = false;
        j.userData.role = role;
        group.add(j);
        list.push(j);
      }
      return list;
    };
    this.rcsJets = attachRcs(this.player.group);
    this.player.rcsJets = this.rcsJets;

    const attachNotes = (group) => {
      const list = [];
      ['#ffd85e', '#ff8fbf', '#7fe6ff', '#9dff8a'].forEach((col, i) => {
        const sp = new Sprite(new SpriteMaterial({ map: noteTexture(col), transparent: true, depthTest: false }));
        sp.scale.set(0.8, 0.8, 1);
        sp.visible = false;
        sp.userData.i = i;
        group.add(sp);
        list.push(sp);
      });
      return list;
    };
    this.danceNotes = (this.build.ability && this.build.ability.type === 'dance') ? attachNotes(this.player.group) : [];
    this.player.danceNotes = this.danceNotes;

    // Hovercraft side bow wake & spray plumes (乘风破浪)
    this.waveSprays = [];
    if (shell.body === 'hover' || this.build.ability?.type === 'wave') {
      const sprayGeo = new ConeGeometry(0.18, 0.95, 6);
      const sprayMat = new MeshBasicMaterial({
        color: 0xdff8ff, transparent: true, opacity: 0.78, depthWrite: false,
      });
      for (const s of [1, -1]) {
        for (let k = 0; k < 6; k++) {
          const sp = new Mesh(sprayGeo, sprayMat);
          const bx = 2.1 - k * 0.72;
          sp.position.set(bx, 0.24 + (k % 2) * 0.08, s * 1.32);
          sp.rotation.z = 0.55;
          sp.rotation.x = s * 0.58;
          sp.visible = false;
          sp.userData = { bx, s, k };
          this.player.group.add(sp);
          this.waveSprays.push(sp);
        }
      }
    }

    // Xiaomi Track Aero Kit continuous roof + underbody wind streamlines!
    const attachAero = (group) => {
      const streamGeo = new BoxGeometry(1.15, 0.028, 0.045);
      const streamMat = new MeshBasicMaterial({
        color: 0x7ae8ff, transparent: true, opacity: 0.82, blending: AdditiveBlending, depthWrite: false,
      });
      const lanes = [
        { y: 1.48, z: -0.45, phase: 0.0 },
        { y: 1.52, z: 0.0, phase: 0.35 },
        { y: 1.48, z: 0.45, phase: 0.70 },
        { y: 0.95, z: -0.78, phase: 0.20 },
        { y: 0.95, z: 0.78, phase: 0.55 },
        { y: 0.14, z: -0.52, phase: 0.15 },
        { y: 0.14, z: 0.0, phase: 0.48 },
        { y: 0.14, z: 0.52, phase: 0.82 },
        { y: 0.52, z: -1.08, phase: 0.30 },
        { y: 0.52, z: 1.08, phase: 0.65 },
      ];
      return lanes.map((cfg) => {
        const ribbon = new Mesh(streamGeo, streamMat);
        ribbon.position.set(2.2, cfg.y, cfg.z);
        ribbon.visible = false;
        ribbon.userData = cfg;
        group.add(ribbon);
        return ribbon;
      });
    };
    this.aeroStreams = this.build.xiaomiAero ? attachAero(this.player.group) : [];
    this.player.aeroStreams = this.aeroStreams;

    const ranked = [...this.rivals].sort((a, b) => b.top - a.top);
    const rankMap = new Map(ranked.map((r, rank) => [r, rank]));
    const SPREAD = [0.95, 0.915, 0.88, 0.845];
    const KEEP_SIG = new Set(['glide', 'chill', 'autumn', 'fly', 'rocket', 'dance', 'tank', 'dm', 'swap', 'wave', 'plaid']);
    const DIST_POOL = this.dist <= 550
      ? ['launch', 'quattro', 'boost', 'vtec']
      : this.dist >= 1100
        ? ['drs', 'overboost', 'range', 'vtec']
        : ['boost', 'drs', 'vtec', 'overboost', 'launch', 'quattro'];

    this.rivalsData = this.rivals.map((r, i) => {
      const rank = rankMap.get(r) ?? i;
      const factor = SPREAD[rank] ?? 0.86;
      const jitter = 1 + (((this.raceIdx * 7 + i * 13) % 7) - 3) * 0.005;
      let top, accel;
      if (this.aiTarget) {
        top = this.aiTarget.top * factor * jitter;
        accel = this.aiTarget.accel * (factor * 0.98) * (0.98 + ((i + this.raceIdx) % 3) * 0.015);
      } else {
        const maxRivalTop = Math.max(...this.rivals.map((x) => x.top));
        const relative = r.top / maxRivalTop;
        top = Math.min(r.top * 1.12, this.build.top * (0.76 + 0.05 * relative + 0.01 * this.seasonIndex)) * jitter;
        accel = this.build.accel * (0.80 + 0.05 * relative + 0.005 * this.seasonIndex);
      }
      const spec = { body: r.body, grille: r.grille, color: r.color, accent: '#e8e6df', wing: true, key: `${r.team}:${r.model}`, name: r.model };
      const group = buildCar(spec);
      const lane = LANES[[0, 1, 3, 4][i]];
      group.position.set(0, 0, lane);
      this.scene.add(group);
      const noMods = this.cup ? !!this.cup.rule?.noMods : !!this.season.rules?.noMods;
      let chosenKey = r.ability;
      if (!KEEP_SIG.has(chosenKey) && !this.cup?.rivals && ((this.raceIdx + i) % 2 === 1)) {
        chosenKey = DIST_POOL[(this.seasonIndex * 3 + this.raceIdx + i * 2) % DIST_POOL.length];
      }
      const baseAbility = !noMods && ABILITIES[chosenKey] ? ABILITIES[chosenKey] : null;
      const strategies = ['holeshot', 'surge', 'counter', 'finisher'];
      const strategy = (baseAbility?.type === 'launch' || baseAbility?.type === 'swap')
        ? ((i + this.raceIdx) % 3 === 0 ? 'surge' : 'holeshot')
        : strategies[(this.raceIdx + i * 3 + Math.floor(Math.random() * 4)) % strategies.length];
      const aiAbility = baseAbility ? {
        ...baseAbility,
        left: 1,
        used: false,
        active: null,
        strategy,
        triggerFrac: strategy === 'holeshot'
          ? 0.02 + Math.random() * 0.04
          : strategy === 'surge'
            ? 0.28 + Math.random() * 0.16
            : strategy === 'finisher'
              ? 0.60 + Math.random() * 0.16
              : 0.64,
        triggerDelay: 0.22 + i * 0.09 + Math.random() * 0.25,
      } : null;
      const c = {
        idx: i, lane, x: 0, v: 0, top, accel, group,
        finished: false, finishTime: null, isPlayer: false,
        delay: 0,
        name: r.team, model: r.model, aiAbility,
        aiCombo: (r.model.includes('Roadster') && chosenKey === 'fly') ? 'roadsterFlip'
          : (r.body === 'plane' && chosenKey === 'glide') ? 'evtolCruise'
            : (r.body === 'maglev' && chosenKey === 'glide') ? 'maglevDash'
              : (r.model.includes('U9X') && chosenKey === 'dance') ? 'u9xJump'
                : ((r.model.includes('Vision') || r.model.includes('SU7')) && chosenKey === 'drs') ? 'xiaomiAero'
                  : null,
        rcsJets: (r.model.includes('Roadster') && chosenKey === 'fly') ? attachRcs(group) : null,
        aeroStreams: ((r.model.includes('Vision') || r.model.includes('SU7')) && chosenKey === 'drs') ? attachAero(group) : null,
        danceNotes: chosenKey === 'dance' ? attachNotes(group) : null,
      };
      return c;
    });
    this.cars = [this.player, ...this.rivalsData];
  }


  // ---------------- ENV ----------------
  setupEnv() {
    const era = eraOf(this.seasonIndex);
    this.era = era;

    const asphalt = makeAsphaltTexture();
    asphalt.wrapS = asphalt.wrapT = RepeatWrapping;
    asphalt.repeat.set(700, 4);
    const road = new Mesh(
      new PlaneGeometry(14000, 22.0),
      new MeshStandardMaterial({ map: asphalt, roughness: 0.95 })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0;
    this.scene.add(road);
    this.asphalt = asphalt;

    // Track edge solid white lines + recycled FIA red/white curbs
    const lineMat = new MeshStandardMaterial({ color: 0xeae6d8, roughness: 0.8 });
    for (const z of [-10.0, 10.0]) {
      const edgeLine = new Mesh(new PlaneGeometry(14000, 0.24), lineMat);
      edgeLine.rotation.x = -Math.PI / 2;
      edgeLine.position.set(0, 0.012, z);
      this.scene.add(edgeLine);
    }

    const curbTex = curbTexture();
    curbTex.wrapS = RepeatWrapping;
    curbTex.repeat.set(6, 1);
    const curbMat = new MeshStandardMaterial({ map: curbTex, roughness: 0.85 });
    const curbGeo = new BoxGeometry(24, 0.07, 0.95);
    this.curbs = [];
    for (const z of [-10.72, 10.72]) {
      for (let i = 0; i < 16; i++) {
        const cm = new Mesh(curbGeo, curbMat);
        cm.position.set(i * 24 - 60, 0.035, z);
        this.scene.add(cm);
        this.curbs.push(cm);
      }
    }

    // Starting grid painted slots + start line
    const gridMat = new MeshStandardMaterial({ color: 0xf2efe4, roughness: 0.8 });
    for (const lz of LANES) {
      const gFront = new Mesh(new BoxGeometry(0.16, 0.016, 2.3), gridMat);
      gFront.position.set(2.55, 0.01, lz);
      this.scene.add(gFront);
      for (const sz of [-1.1, 1.1]) {
        const gSide = new Mesh(new BoxGeometry(1.1, 0.016, 0.16), gridMat);
        gSide.position.set(2.0, 0.01, lz + sz);
        this.scene.add(gSide);
      }
    }

    // 车道虚线
    this.dashes = [];
    const dashGeo = new BoxGeometry(4.2, 0.02, 0.18);
    const dashMat = new MeshStandardMaterial({ color: 0xe6e3d4, roughness: 0.8 });
    for (const z of [-5.7, -1.9, 1.9, 5.7]) {
      for (let i = 0; i < 26; i++) {
        const m = new Mesh(dashGeo, dashMat);
        m.position.set(i * 16 - 80, 0.02, z);
        this.scene.add(m);
        this.dashes.push({ mesh: m, laneZ: z });
      }
    }

    // Segmented W-beam Armco Barriers & Posts (replaces infinitely long horizon-piercing bar)
    const armco = armcoTexture();
    armco.wrapS = RepeatWrapping;
    armco.repeat.set(7, 1);
    const haz = hazardTexture();
    haz.wrapS = RepeatWrapping;
    haz.repeat.set(8, 1);
    this.hazTex = haz;
    const armcoMat = new MeshStandardMaterial({ map: armco, roughness: 0.55, metalness: 0.4 });
    const postMat = new MeshStandardMaterial({ color: 0x626970, roughness: 0.65, metalness: 0.5 });
    const plinthMat = new MeshStandardMaterial({ color: 0x7a8086, roughness: 0.9 });
    const railTopMat = new MeshStandardMaterial({ color: 0xc2c8ce, roughness: 0.4, metalness: 0.65 });
    this.armcos = [];
    for (const z of [11.65, -11.65]) {
      for (let i = 0; i < 14; i++) {
        const seg = new Group();
        seg.add(box(0, 28, 0.24, 0.52, 0, 0.12, 0, plinthMat));
        seg.add(box(0, 28, 0.36, 0.18, 0, 0.62, z > 0 ? -0.14 : 0.14, armcoMat));
        seg.add(box(0, 28, 0.08, 0.10, 0, 0.92, 0, railTopMat));
        for (let px = -10.5; px <= 10.5; px += 7) {
          seg.add(box(0, 0.18, 0.96, 0.20, px, 0.48, 0, postMat));
        }
        seg.position.set(i * 28 - 56, 0, z);
        this.scene.add(seg);
        this.armcos.push(seg);
      }
    }

    // Distance markers along track
    for (let m = 100; m < this.dist; m += 100) {
      const dm = makeDistanceMarker(m);
      dm.position.set(m, 0, -12.3);
      this.scene.add(dm);
    }

    // 起点/终点门架
    this.gantryLights = [];
    this.gantry(0, 'START', '第 ' + (this.raceIdx + 1) + ' 场', true);
    this.gantry(this.dist, 'FINISH', this.season.years, false);
    const line = new Mesh(
      new PlaneGeometry(2.8, 22.0),
      new MeshStandardMaterial({ map: checkerTexture(), roughness: 0.8 })
    );
    line.rotation.x = -Math.PI / 2;
    line.position.set(this.dist, 0.015, 0);
    this.scene.add(line);

    // 广告牌（按年代换文案，带灯架）
    this.billboards = [];
    const ads = ERA_ADS[era];
    for (let i = 0; i < 7; i++) {
      const [a, b, bg, fg] = ads[(i + this.seasonIndex) % ads.length];
      const tex = adTexture(a, b, bg, fg);
      const g = new Group();
      const frame = box(0, 6.7, 3.5, 0.2, 0, 3.2, -0.12, postMat);
      const panel = new Mesh(new PlaneGeometry(6.4, 3.2), new MeshStandardMaterial({ map: tex, roughness: 0.75 }));
      panel.position.y = 3.2;
      const legL = box(0, 0.22, 3.2, 0.22, -2.5, 1.6, -0.1, postMat);
      const legR = box(0, 0.22, 3.2, 0.22, 2.5, 1.6, -0.1, postMat);
      g.add(frame, panel, legL, legR);
      g.position.set(i * 70 - 40, 0, -13.4);
      g.rotation.y = 0.35;
      this.scene.add(g);
      this.billboards.push(g);
    }

    // 三层台阶看台 + 顶棚桁架
    const crowd = makeCrowdTexture();
    crowd.wrapS = RepeatWrapping;
    crowd.repeat.set(16, 1);
    const crowdMat = new MeshStandardMaterial({ map: crowd, roughness: 0.95 });
    const concreteStand = new MeshStandardMaterial({ color: 0x6f757a, roughness: 0.9 });
    const roofStandMat = new MeshStandardMaterial({ color: 0xb6bdc2, roughness: 0.65 });
    const standGroup = new Group();
    for (let tier = 0; tier < 3; tier++) {
      const y = 0.85 + tier * 1.15;
      const z = -15.6 - tier * 1.45;
      standGroup.add(box(0, 48, 1.1, 1.4, 0, y, z, concreteStand));
      const cStrip = new Mesh(new BoxGeometry(47.2, 0.9, 0.25), crowdMat);
      cStrip.position.set(0, y + 0.65, z + 0.55);
      standGroup.add(cStrip);
    }
    standGroup.add(box(0, 48, 4.4, 0.4, 0, 2.2, -19.5, concreteStand));
    for (let px = -22; px <= 22; px += 11) {
      standGroup.add(box(0, 0.35, 5.6, 0.35, px, 2.8, -19.2, postMat));
    }
    const canopy = box(0, 50, 0.3, 6.2, 0, 5.7, -17.2, roofStandMat);
    canopy.rotation.x = 0.14;
    standGroup.add(canopy);
    standGroup.position.set(16, 0, 0);
    this.scene.add(standGroup);

    // 终点前的地标拱门
    const arch = new Mesh(
      new TorusGeometry(4.4, 0.34, 6, 18, Math.PI),
      new MeshStandardMaterial({ color: era === 3 ? 0x42e8ff : 0xc9a227, roughness: 0.5 })
    );
    arch.position.set(this.dist - 35, 0, -14.2);
    this.scene.add(arch);

    populateEraScenery(this.scene, era, this);

    this.cameraBase = { y: 6.8, z: 26.5, back: 17.5 };
  }

  gantry(x, title, sub, isStart = false) {
    const g = new Group();
    const steelMat = new MeshStandardMaterial({ color: 0x565e66, roughness: 0.6, metalness: 0.45 });
    const yellowMat = new MeshStandardMaterial({ color: 0xe5c227, roughness: 0.55 });
    // Twin truss column legs
    for (const z of [-11.5, 11.5]) {
      for (const ox of [-0.45, 0.45]) {
        g.add(box(0, 0.24, 7.4, 0.24, ox, 3.7, z, steelMat));
      }
      for (let h = 1.2; h <= 7.0; h += 1.5) {
        g.add(box(0, 1.0, 0.16, 0.36, 0, h, z, steelMat));
      }
    }
    // Overhead 3D steel box-truss bridge
    for (const oy of [6.1, 7.1]) {
      for (const ox of [-0.45, 0.45]) {
        g.add(box(0, 0.22, 0.22, 23.6, ox, oy, 0, steelMat));
      }
    }
    for (let z = -10.5; z <= 10.5; z += 2.1) {
      g.add(box(0, 1.05, 1.05, 0.18, 0, 6.6, z, steelMat));
    }
    g.add(box(0, 0.3, 0.22, 23.2, -0.58, 7.1, 0, yellowMat));

    const tex = canvasTexture(512, 128, (ctx, w, h) => {
      ctx.fillStyle = '#15181b'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#e5c227'; ctx.lineWidth = 6; ctx.strokeRect(4, 4, w - 8, h - 8);
      ctx.fillStyle = '#f2efe4'; ctx.textAlign = 'center';
      ctx.font = 'bold 54px Zpix, SimSun, monospace';
      ctx.fillText(title, w / 2, 66);
      ctx.fillStyle = '#e5c227'; ctx.font = '24px Zpix, SimSun, monospace';
      ctx.fillText(sub, w / 2, 102);
    });
    const banner = new Mesh(new BoxGeometry(0.18, 2.05, 8.8), new MeshStandardMaterial({ map: tex, roughness: 0.6 }));
    banner.position.set(-0.70, 6.55, 0);
    g.add(banner);

    // 5-Pod 3D F1 Starting Light Bridge mounted on Start Gantry!
    if (isStart) {
      g.add(box(0, 0.36, 0.72, 6.2, -0.55, 5.05, 0, darkMat));
      for (let i = 0; i < 5; i++) {
        const lz = -2.0 + i * 1.0;
        g.add(box(0, 0.42, 0.85, 0.62, -0.60, 4.95, lz, darkMat));
        const lampMat = new MeshStandardMaterial({
          color: 0x331414,
          emissive: 0x000000,
          emissiveIntensity: 1.4,
          roughness: 0.3,
        });
        const lens = new Mesh(new CylinderGeometry(0.20, 0.20, 0.14, 10), lampMat);
        lens.rotation.z = Math.PI / 2;
        lens.position.set(-0.78, 4.85, lz);
        g.add(lens);
        this.gantryLights.push(lampMat);
      }
    }

    g.position.x = x;
    this.scene.add(g);
  }

  // ---------------- 发车 ----------------
  startSequence() {
    audio.play('start', 0.9);
    audio.startEngine();
    setTimeout(() => {
      if (this.phase !== 'intro') return;
      this.throttle = false;
      this.phase = 'lights';
      this.$banner.classList.remove('show');
      this.wrap.classList.remove('intro');
      this.lightIndex = 0;
      this.lightTimer = 0;
      this.greenDelay = this.fast ? 0.05 : 0.2 + Math.random() * 0.6;
    }, 2600);
    this.$banner.classList.add('show');
    this.wrap.classList.add('intro');
  }

  bindInput() {
    this.onKeyDown = (e) => {
      if (e.code === 'ArrowUp') {
        e.preventDefault();
        if (this.phase === 'falsestart' || this.phase === 'finished') return;
        if (this.phase === 'lights' && !e.repeat) {
          this.triggerFalseStart();
          return;
        }
        this.throttle = true;
      }
    };
    this.onKeyUp = (e) => {
      if (e.code === 'ArrowUp') this.throttle = false;
    };
    this.onBlur = () => {
      this.throttle = false;
    };
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);

    this.$throttle = this.wrap.querySelector('#touchThrottle');
    if (this.$throttle) {
      const el = this.$throttle;
      const press = (e) => {
        e.preventDefault();
        el.setPointerCapture?.(e.pointerId);
        el.classList.add('pressed');
        if (this.phase === 'falsestart' || this.phase === 'finished') return;
        if (this.phase === 'lights') {
          this.triggerFalseStart();
          return;
        }
        this.throttle = true;
      };
      const release = () => {
        el.classList.remove('pressed');
        this.throttle = false;
      };
      el.addEventListener('pointerdown', press);
      el.addEventListener('pointerup', release);
      el.addEventListener('pointercancel', release);
      el.addEventListener('lostpointercapture', release);
      el.addEventListener('contextmenu', (e) => e.preventDefault());
    }
  }

  triggerFalseStart() {
    this.falseStarts++;
    this.throttle = false;
    this.phase = 'falsestart';
    audio.blip(220, 0.18, 'square', 0.08);
    this.showFalseStart();
  }

  showFalseStart() {
    const last = this.falseStarts >= 3;
    this.$dialogBody.innerHTML = last
      ? `<p>第三次抢跑，强制退出本场比赛，罚款 800 元。</p>`
      : `<p>抢跑！第 <b>${this.falseStarts}</b> / 3 次。</p>
         <p class="hint">点击确认后重新发车，红灯倒计时将会重置。第 3 次抢跑强制退出。</p>`;
    this.$dialogBtn.textContent = last ? '退出比赛' : '重新发车';
    this.$dialog.classList.add('show');
    this.$dialogBtn.onclick = () => {
      this.$dialog.classList.remove('show');
      if (last) this.disqualify();
      else this.resetStart();
    };
    setTimeout(() => this.$dialogBtn.focus(), 50);
  }

  resetStart() {
    this.throttle = false;
    this.raceTime = 0;
    this.player.v = 0;
    this.player.x = 0;
    this.player.group.position.x = 0;
    for (const c of this.rivalsData) {
      c.v = 0;
      c.x = 0;
      c.finished = false;
      c.finishTime = null;
      c.group.position.x = 0;
      if (c.aiAbility) {
        c.aiAbility.used = false;
        c.aiAbility.active = null;
      }
    }
    this.lightIndex = 0;
    this.lightTimer = 0;
    this.greenDelay = this.fast ? 0.05 : 0.2 + Math.random() * 0.6;
    this.$lights.forEach((l) => l.classList.remove('on', 'go'));
    if (this.gantryLights) this.gantryLights.forEach((m) => { m.color.setHex(0x331414); m.emissive.setHex(0x000000); });
    this.$go.classList.remove('show');
    this.setMsg('重新发车，等绿灯', 1.4);
    this.phase = 'lights';
  }

  // ---------------- 技能（全被动自动触发） ----------------
  checkPassiveAbility() {
    const a = this.ability;
    if (!a || a.left <= 0 || a.active || this.phase !== 'running' || this.player?.finished) return;
    const baseV = this.player.top / 3.6;
    const mode = a.mode || (a.type === 'dance' ? 'dance' : a.type === 'fly' ? 'fly' : 'accel');
    let ready = false;
    if (mode === 'dance') {
      ready = this.raceTime >= 0.05;
    } else if (mode === 'accel' || mode === 'econ_accel') {
      ready = this.raceTime >= 0.05 && (this.throttle || this.player.v > 0.5);
    } else if (mode === 'fly') {
      ready = (this.build.evtolCruise || this.build.maglevDash || this.build.backTo2001)
        ? (this.raceTime >= 0.15 && (this.throttle || this.player.v > 0.5))
        : (this.player.v >= baseV * 0.72 || this.raceTime >= 1.2);
    } else if (mode === 'top' || mode === 'econ_top') {
      ready = this.player.v >= baseV * 0.96;
    }
    if (ready) this.useAbility();
  }

  useAbility() {
    if (!this.ability || (this.phase !== 'go' && this.phase !== 'running') || this.player?.finished) return;
    if (this.ability.left <= 0 || this.ability.cd > 0) return;
    const a = this.ability;
    const now = this.raceTime;
    const jump = a.jumpFrac || 0;
    if (a.type === 'launch') {
      this.player.v = Math.min(this.player.top / 3.6 * 0.98, this.player.v + this.player.top / 3.6 * (jump || 0.12));
      this.setMsg('弹射起步！', 1.2);
      audio.sweep(180, 520, 0.35, 0.07);
    } else if (a.type === 'swap') {
      a.active = { type: 'swap', until: now + (a.dur || 2.6), topMul: a.topMul, accelMul: 1.0 };
      this.setMsg('蔚来换电 · 极速再冲！', 1.5);
      audio.sweep(300, 900, 0.3, 0.06);
    } else if (a.type === 'plaid') {
      a.active = { type: 'plaid', until: now + (a.dur || 2.8), topMul: a.topMul, accelMul: 1.0 };
      this.setMsg('Plaid 模式激活 · 极速上限突破！', 1.6);
      audio.sweep(240, 860, 0.4, 0.07);
    } else if (a.type === 'wave') {
      a.active = { type: 'wave', until: now + (a.dur || 2.8), topMul: 1.0, accelMul: a.accelMul || 1.40 };
      this.setMsg('乘风破浪 · 气垫破水加速！', 1.6);
      audio.sweep(160, 620, 0.45, 0.07);
    } else if (a.type === 'dance') {
      a.active = { type: 'dance', until: now + (a.dur || 2.0), topMul: 0.35, accelMul: 1 };
      this.danceBonus = true;
      const frac = this.build.u9xJump ? 0.80 : (a.prizeBonus || 0.6);
      this.prizeBonusFrac = Math.max(this.prizeBonusFrac, frac);
      this.setMsg(`DiSus-X 原地起舞！2s 后爆射出发 · 奖金 +${Math.round(frac * 100)}%`, 2.0);
      audio.blip(660, 0.1, 'square', 0.06);
      setTimeout(() => audio.blip(880, 0.1, 'square', 0.06), 160);
      setTimeout(() => audio.blip(740, 0.12, 'square', 0.06), 320);
    } else if (a.type === 'fly') {
      const full = !!this.build.evtolCruise;
      const mag = !!(this.build.maglevDash || this.build.backTo2001);
      const flip = !!this.build.roadsterFlip;
      const dur = (full || mag) ? 999 : flip ? 3.4 : (a.dur || 2.2);
      a.active = {
        type: 'fly', start: now, until: now + dur, fullCruise: full, maglev: mag,
        topMul: mag ? 1.25 : full ? 1.22 : flip ? 1.32 : a.topMul,
        accelMul: flip ? 1.15 : 1.0,
      };
      this.setMsg(
        flip ? 'SpaceX 冷气推进 · 空中翻滚！'
          : full ? '小鹏汇天eVTOL 垂直拉起 · 全程高空巡航！'
            : this.build.backTo2001 ? '回到 2001 时空胶囊 · 突破 1000 km/h 触发光速跃迁！'
              : mag ? '超导磁浮突进 · 全程贴地飞行！'
                : `${a.name} · 腾空突破极速！`,
        1.8
      );
      audio.sweep(120, 800, 0.5, 0.08);
    } else if (a.type === 'auto') {
      a.active = { type: 'auto', until: now + (a.dur || 3.2), topMul: a.topMul, accelMul: 1.0 };
      this.setMsg('智驾巡航 · 极速提升', 1.5);
      audio.blip(980, 0.08, 'sine', 0.05);
    } else if (a.type === 'drs' && this.build.xiaomiAero) {
      a.active = { type: 'drs', until: now + 4.5, topMul: 1.22, accelMul: 1.0 };
      this.setMsg('小米赛道气动 · 全车风洞流线加压！', 1.8);
      audio.sweep(200, 740, 0.45, 0.07);
    } else {
      a.active = { type: a.type, until: now + (a.dur || 2.8), topMul: a.topMul ?? 1.0, accelMul: a.accelMul ?? 1.0 };
      if (a.prizeBonus) {
        this.prizeBonusFrac = Math.max(this.prizeBonusFrac, a.prizeBonus);
        this.setMsg(`${a.name}！（奖金 +${Math.round(a.prizeBonus * 100)}%）`, 1.5);
      } else {
        this.setMsg(`${a.name}！`, 1.2);
      }
      audio.sweep(180, 520, 0.4, 0.06);
    }
    a.left--;
    a.cd = 1.0;
    this.renderAbility();
  }

  renderAbility() {
    if (!this.ability) {
      this.$abBox.classList.remove('ready');
      this.$abUses.textContent = '';
      return;
    }
    const a = this.ability;
    this.$abUses.textContent = a.left > 0 ? '待触发' : (a.active ? '生效中' : '已触发');
    this.$abBox.classList.toggle('ready', a.left > 0 || !!a.active);
    this.$abDesc.textContent = a.desc;
  }

  // ---------------- 主循环 ----------------
  loop() {
    this.raf = requestAnimationFrame(this.loop);
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.t += dt;

    if (this.phase !== 'finished') this.update(dt);
    this.updateCamera(dt);
    this.updateWorld(dt);
    this.updateHud();
    this.renderer.render(this.scene, this.camera);
  }

  update(dt) {
    // 灯
    if (this.phase === 'lights') {
      if (this.lightIndex < 5) {
        this.lightTimer += dt;
        if (this.lightTimer >= 0.4) {
          this.lightTimer = 0;
          this.$lights[this.lightIndex].classList.add('on');
          if (this.gantryLights?.[this.lightIndex]) {
            this.gantryLights[this.lightIndex].color.setHex(0xff3828);
            this.gantryLights[this.lightIndex].emissive.setHex(0xff2210);
          }
          this.lightIndex++;
          audio.blip(440, 0.05, 'square', 0.04);
        }
      } else {
        this.greenDelay -= dt;
        if (this.greenDelay <= 0) {
          this.phase = 'go';
          this.raceTime = 0;
          this.$go.classList.add('show');
          this.$lights.forEach((l) => { l.classList.remove('on'); l.classList.add('go'); });
          if (this.gantryLights) this.gantryLights.forEach((m) => { m.color.setHex(0x38ff68); m.emissive.setHex(0x18e048); });
          this.setMsg(IS_TOUCH ? 'GO！按住右下角「加速」全油冲刺！' : 'GO！按住 ↑ 键全油冲刺！', 1.5);
          audio.blip(880, 0.25, 'square', 0.08);
          setTimeout(() => this.$go.classList.remove('show'), 2600);
          this.phase = 'running';
        }
      }
    }

    if (this.phase === 'running') this.raceTime += dt;
    this.checkPassiveAbility();

    if (this.warping) {
      const wdt = (performance.now() - this.warping.start) / 1000;
      const prog = Math.min(1, wdt / 4.2);
      this.shake = 0.4 + prog * 1.6;
      this.player.x += this.player.v * dt * (1 + prog * 3.8);
      this.player.group.position.x = this.player.x;
      this.player.group.position.y = 0.65 + prog * 0.45 + Math.sin(wdt * 26) * 0.06;
      this.camera.fov = Math.min(92, 38 + prog * 54);
      this.camera.updateProjectionMatrix();
      this.animateCar(this.player, dt);
      if (this.warping.rings) {
        this.warping.rings.forEach((ring, ri) => {
          const cycle = (wdt * 1.8 + ri * 0.33) % 1;
          ring.position.set(this.player.x - cycle * 8, this.player.group.position.y, this.player.lane);
          const sc = 0.9 + cycle * 4.5;
          ring.scale.set(sc, sc, sc);
          ring.material.opacity = (1 - cycle) * (0.45 + prog * 0.45);
        });
      }
      this.drawWarpCanvas(wdt, prog);
      if (wdt >= 4.2 && !this.warping.done) {
        this.warping.done = true;
        this.phase = 'finished';
        audio.stopEngine();
        const cb = this.onWarp2001;
        this.dispose();
        if (cb) cb();
      }
      return;
    }

    const topMul = this.abilityTopMul();
    const accMul = this.abilityAccelMul();
    const dance = this.ability && this.ability.active && this.ability.active.type === 'dance' && this.raceTime < this.ability.active.until;
    const u9xAuto = this.danceDone && (this.build.shell?.id === 's7_u9x' || this.build.u9xJump);
    const throttle = this.phase === 'running' && (this.throttle || u9xAuto);

    // 玩家
    const p = this.player;
    const vmax = p.top / 3.6 * topMul;
    if (p.finished) {
      p.v = Math.max(0, p.v - 55 * dt);
      p.x = Math.min(this.dist + 8, p.x + p.v * dt);
    } else if (this.phase === 'running' && !dance) {
      if (throttle && p.v < vmax) p.v = Math.min(vmax, p.v + p.accel * accMul * dt);
      else if (!throttle) p.v -= 3.2 * dt;
      else p.v = Math.max(vmax, p.v - 9 * dt);
      if (p.v < 0) p.v = 0;
      p.x += p.v * dt;
      if (!this.cup && this.build.backTo2001 && this.onWarp2001 && p.v * 3.6 >= 1000) {
        this.startWarpSequence();
        return;
      }
    } else if (this.phase === 'lights') {
      p.v = 0;
    } else if (dance) {
      p.v = Math.max(0, p.v - 55 * dt);
    }
    p.group.position.x = p.x;
    if (this.playerShadow) {
      const lift = p.group.position.y;
      const k = Math.max(0.55, 1 - lift * 0.2);
      this.playerShadow.position.x = p.x + 0.2;
      this.playerShadow.scale.set(k, k, 1);
      this.playerShadow.material.opacity = Math.max(0.08, 0.42 - lift * 0.15);
    }
    if (this.phase === 'running' || this.phase === 'finished') this.animateCar(p, dt);

    // 对手
    for (const c of this.rivalsData) {
      if (this.phase !== 'running') break;
      if (c.finished) {
        if (c.wasAirborne || c.group.position.y > 0.02) this.animateCar(c, dt);
        continue;
      }
      this.useAiAbility(c);
      const aiDancing = c.aiAbility?.active?.type === 'dance' && this.raceTime < c.aiAbility.active.until;
      if (aiDancing) {
        c.v = Math.max(0, c.v - 55 * dt);
      } else {
        const cvmax = c.top / 3.6 * this.aiAbilityTopMul(c);
        c.v += c.accel * dt * this.aiAbilityAccelMul(c) * (c.v < cvmax * 0.92 ? 1 : 0.35);
        if (c.v > cvmax) c.v = cvmax;
        c.x += c.v * dt;
      }
      c.group.position.x = c.x;
      this.animateCar(c, dt);
      if (c.x >= this.dist) {
        c.finished = true;
        c.finishTime = this.raceTime;
        c.v = 0;
      }
    }

    if (this.phase === 'running') {
      if (p.x >= this.dist && !p.finished) {
        p.finished = true;
        p.finishTime = this.raceTime;
        audio.stopEngine();
        const doneCount = 1 + this.rivalsData.filter((c) => c.finished).length;
        if (doneCount < 5) {
          this.setMsg(`已冲线（暂列第 ${doneCount} 名），等待其余车辆完赛…`, 3.5);
        }
      }
      if (this.cars.every((c) => c.finished)) {
        this.finish();
      }
    }

    // 技能计时
    if (this.ability) {
      this.ability.cd = Math.max(0, this.ability.cd - dt);
      if (this.ability.active && this.raceTime > this.ability.active.until) {
        if (this.ability.active.type === 'dance' && !this.danceDone) {
          this.danceDone = true;
          const jump = this.build.u9xJump ? 0.65 : (this.ability.launchJumpFrac || 0.45);
          const vmax = p.top / 3.6 * (this.build.u9xJump ? 1.24 : (this.ability.postTopMul || 1.12));
          p.v = Math.min(vmax * 0.96, p.v + (p.top / 3.6) * jump);
          this.danceSurgeUntil = this.raceTime + (this.build.u9xJump ? 4.5 : (this.ability.postDur || 3.0));
          if (this.build.u9xJump) {
            p.group.position.y = 0.72;
            p.wasAirborne = true;
            this.shake = Math.max(this.shake, 0.4);
          }
          audio.sweep(200, 920, 0.45, 0.08);
          this.setMsg(this.build.u9xJump ? '云辇飞跃 · 极速弹射！' : '起舞结束 · 爆射弹射！', 1.6);
        }
        this.ability.active = null;
        this.renderAbility();
      }
    }

    // AI 技能计时
    for (const c of this.rivalsData) {
      if (c.aiAbility?.active && this.raceTime > c.aiAbility.active.until) {
        if (c.aiAbility.active.type === 'dance' && !c.aiDanceDone) {
          c.aiDanceDone = true;
          c.v = (c.top / 3.6) * 0.65;
          c.aiSurgeUntil = this.raceTime + 4.0;
          c.group.position.y = 0.68;
          c.wasAirborne = true;
        }
        c.aiAbility.active = null;
      }
    }

    // 位置
    if (this.phase === 'running' || this.phase === 'finished') {
      let pos = 1;
      for (const c of this.cars) {
        if (c === p) continue;
        if (c.finished) { if (c.finishTime < (p.finished ? p.finishTime : this.raceTime)) pos++; }
        else if (c.x > p.x) pos++;
      }
      this.position = pos;
    }

    if (!p.finished) audio.updateEngine(p.v * 3.6, throttle);
  }

  pushFeed(text) {
    if (!this.$feed) return;
    for (const row of this.$feed.querySelectorAll('.hud-feed-row.latest')) row.classList.remove('latest');
    const el = document.createElement('div');
    el.className = 'hud-feed-row latest';
    const stamp = this.raceTime.toFixed(1) + 's';
    el.innerHTML = `<span class="t">${stamp}</span><span class="txt">${text}</span>`;
    this.$feed.appendChild(el);
    while (this.$feed.children.length > 4) this.$feed.firstChild.remove();
  }

  shouldTriggerAiAbility(c) {
    const a = c.aiAbility;
    if (!a || a.used) return false;
    const prog = c.x / this.dist;
    const mode = a.mode || (a.type === 'dance' ? 'dance' : a.type === 'fly' ? 'fly' : 'accel');
    if (mode === 'dance') return this.raceTime >= 0.05;
    if (mode === 'accel' || mode === 'econ_accel') return this.raceTime >= (a.triggerDelay || 0.15);
    if (mode === 'fly') {
      if (c.aiCombo === 'evtolCruise' || c.aiCombo === 'maglevDash') return this.raceTime >= 0.15;
      return c.v >= (c.top / 3.6) * 0.72 || prog >= 0.45;
    }
    if (mode === 'top' || mode === 'econ_top') return c.v >= (c.top / 3.6) * 0.94 || prog >= 0.65;
    return prog >= a.triggerFrac;
  }

  useAiAbility(c) {
    const a = c.aiAbility;
    if (!this.shouldTriggerAiAbility(c)) return;
    a.used = true;
    a.left = 0;
    const baseV = c.top / 3.6;
    const dampT = 1 + ((a.topMul ?? 1.0) - 1) * 0.35;
    const dampA = 1 + ((a.accelMul ?? 1.0) - 1) * 0.35;
    if (a.type === 'launch') {
      c.v = Math.min(baseV * 0.98, c.v + baseV * 0.05);
    } else if (a.type === 'dance') {
      a.active = { type: 'dance', start: this.raceTime, until: this.raceTime + 2.0, topMul: 0.35, accelMul: 1 };
    } else if (a.type === 'fly') {
      const full = c.aiCombo === 'evtolCruise';
      const mag = c.aiCombo === 'maglevDash';
      const flip = c.aiCombo === 'roadsterFlip';
      const dur = (full || mag) ? 999 : flip ? 3.4 : (a.dur || 2.2);
      a.active = { type: 'fly', start: this.raceTime, until: this.raceTime + dur, fullCruise: full, maglev: mag, topMul: dampT, accelMul: dampA };
    } else {
      a.active = { type: a.type, start: this.raceTime, until: this.raceTime + (a.dur || 2.8), topMul: dampT, accelMul: dampA };
    }
    this.pushFeed(`${c.name} · ${a.name}`);
  }

  aiAbilityTopMul(c) {
    let m = 1;
    const a = c.aiAbility?.active;
    if (a && this.raceTime <= a.until) m *= (a.topMul || 1);
    if (c.aiDanceDone && c.aiSurgeUntil && this.raceTime < c.aiSurgeUntil) m *= 1.18;
    return m;
  }

  aiAbilityAccelMul(c) {
    let m = 1;
    const a = c.aiAbility?.active;
    if (a && this.raceTime <= a.until) m *= (a.accelMul || 1);
    if (c.aiDanceDone && c.aiSurgeUntil && this.raceTime < c.aiSurgeUntil) m *= 1.65;
    return m;
  }

  abilityTopMul() {
    let m = this.build.topMul || 1;
    const a = this.ability && this.ability.active;
    if (a) {
      const left = Math.max(0, a.until - this.raceTime);
      if (left > 0) {
        if (a.type === 'dance') m *= 0.35;
        else m *= (a.topMul ?? this.ability.topMul ?? 1.08);
      }
    }
    if (this.danceDone && this.danceSurgeUntil && this.raceTime < this.danceSurgeUntil) {
      m *= (this.build.u9xJump ? 1.24 : (this.ability?.postTopMul || 1.12));
    }
    return m;
  }

  abilityAccelMul() {
    const a = this.ability && this.ability.active;
    let m = this.build.accelMul || 1;
    if (a && this.raceTime <= a.until) {
      m *= (a.accelMul ?? this.ability.accelMul ?? 1.35);
    }
    if (this.danceDone && this.danceSurgeUntil && this.raceTime < this.danceSurgeUntil) {
      m *= (this.build.u9xJump ? 1.75 : (this.ability?.postAccelMul || 1.48));
    }
    return m;
  }

  animateCar(car, dt) {
    const wheels = car.group.userData.wheels;
    const wr = car.group.userData.dims?.wheel || 0.35;
    if (wheels) for (const w of wheels) w.rotation.z -= (car.v / wr) * dt;
    const prop = car.group.userData.propeller;
    if (prop) prop.rotation.x += dt * (8 + car.v * 2.2);
    const props = car.group.userData.propellers;
    if (props) for (const pr of props) pr.rotation.x += dt * (10 + car.v * 2.4);
    const rotors = car.group.userData.rotors;
    const act = car === this.player ? this.ability?.active : car.aiAbility?.active;
    const fly = !!(act && act.type === 'fly' && this.raceTime <= act.until && !car.finished);
    const t = performance.now() * 0.001;
    if (rotors) for (const r of rotors) r.rotation.y += dt * (fly ? 58 : 34);
    if (car === this.player && this.waveSprays) {
      const waveOn = !!(act && act.type === 'wave' && this.raceTime <= act.until && !car.finished);
      this.waveSprays.forEach((sp) => {
        sp.visible = waveOn;
        if (waveOn) {
          const { bx, s, k } = sp.userData;
          const cy = (t * 6.5 + k * 0.25) % 1;
          sp.position.set(bx - cy * 1.1, 0.22 + Math.sin(cy * Math.PI) * 0.55, s * (1.28 + cy * 0.52));
          sp.scale.setScalar(0.65 + Math.sin(cy * Math.PI) * 0.75);
        }
      });
    }
    const aeroTarget = car.aeroStreams || (car === this.player ? this.aeroStreams : null);
    if (aeroTarget && aeroTarget.length) {
      const aeroOn = !!((car === this.player ? this.build.xiaomiAero : car.aiCombo === 'xiaomiAero') && act && act.type === 'drs' && this.raceTime <= act.until && !car.finished);
      aeroTarget.forEach((r) => {
        r.visible = aeroOn;
        if (aeroOn) {
          const { y, z, phase } = r.userData;
          const u = (t * 2.8 + phase) % 1;
          r.position.set(2.5 - u * 5.6, y, z);
          r.scale.set(0.8 + Math.sin(u * Math.PI) * 0.6, 1, 1);
        }
      });
    }
    const notes = car.danceNotes || (car === this.player ? this.danceNotes : null) || [];
    const rcs = car.rcsJets || (car === this.player ? this.rcsJets : null);
    const dance = !!(act && act.type === 'dance' && this.raceTime <= act.until);
    if (dance) {
      car.group.position.y = 0.4 + Math.abs(Math.sin(t * 7)) * 0.7;
      car.group.rotation.z = Math.sin(t * 6) * 0.22;
      car.group.rotation.y = Math.sin(t * 4) * 0.32;
      car.group.rotation.x = 0;
      for (const sp of notes) {
        const i = sp.userData.i;
        const ang = t * 3.5 + i * Math.PI / 2;
        sp.visible = true;
        sp.position.set(Math.cos(ang) * 1.9, 1.9 + Math.sin(t * 5 + i) * 0.4, Math.sin(ang) * 1.7);
        sp.scale.setScalar(0.7 + Math.sin(t * 6 + i) * 0.12);
      }
    } else if (fly) {
      car.wasAirborne = true;
      car.landTimer = 0;
      const start = act.start ?? (act.until - 2.2);
      const u = Math.max(0, Math.min(1, (this.raceTime - start) / Math.max(0.2, act.until - start)));
      const doFlip = (car === this.player && this.build.roadsterFlip) || car.aiCombo === 'roadsterFlip';
      const fullCruise = !!act.fullCruise;
      const isMaglev = !!act.maglev;
      const peakY = isMaglev ? 0.58 : fullCruise ? 3.8 : doFlip ? 3.5 : 2.6;
      let targetY = peakY;
      let targetPitch = isMaglev ? 0.02 : 0.12;
      if (fullCruise) {
        // eVTOL Vertical Take-off right from launch pad, steady cruise till FINISH
        const climbU = Math.min(1, (this.raceTime - start) / 0.55);
        targetY = peakY * (1 - (1 - climbU) * (1 - climbU));
        targetPitch = climbU < 1 ? 0.16 : 0.05;
      } else if (isMaglev) {
        // Full-race continuous superconducting hover till FINISH
        const liftU = Math.min(1, (this.raceTime - start) / 0.25);
        targetY = peakY * (1 - (1 - liftU) * (1 - liftU)) + Math.sin(t * 5.2) * 0.04;
        targetPitch = 0.02;
      } else if (u < 0.24) {
        const k = u / 0.24;
        targetY = peakY * (1 - (1 - k) * (1 - k));
        targetPitch = 0.24;
      } else if (u > 0.78) {
        const k = (u - 0.78) / 0.22;
        targetY = peakY * (1 - k * k * 0.88);
        targetPitch = -0.09 * Math.sin(k * Math.PI);
      }
      car.group.position.y += (targetY - car.group.position.y) * Math.min(1, dt * 8);
      car.group.rotation.z += (targetPitch - car.group.rotation.z) * Math.min(1, dt * 8);
      car.group.rotation.y += (0 - car.group.rotation.y) * Math.min(1, dt * 6);
      if (doFlip && u >= 0.18 && u <= 0.76) {
        const ru = (u - 0.18) / 0.58;
        const smooth = ru * ru * (3 - 2 * ru);
        car.group.rotation.x = smooth * Math.PI * 2;
      } else {
        // After completing 360° (2π ≡ 0), snap directly to 0 so it NEVER unwinds backwards!
        if (car.group.rotation.x >= Math.PI * 1.85) car.group.rotation.x = 0;
        else car.group.rotation.x += (0 - car.group.rotation.x) * Math.min(1, dt * 12);
      }
      for (const sp of notes) sp.visible = false;
      if (car === this.player) {
        this.thrusters.forEach((f, i) => {
          f.visible = true;
          f.scale.set(1 + Math.sin(t * 45 + i) * 0.25, 0.8 + Math.sin(t * 40 + i * 2) * 0.35, 1);
        });
      }
      if (rcs) {
        rcs.forEach((j, idx) => {
          if (!doFlip) { j.visible = false; return; }
          const role = j.userData.role;
          if (role === 'down') {
            j.visible = u < 0.30 || u > 0.70;
          } else if (role === 'sideR') {
            j.visible = u >= 0.14 && u <= 0.56;
          } else {
            j.visible = u >= 0.48 && u <= 0.86;
          }
          if (j.visible) {
            const pulse = 0.75 + Math.sin(t * 55 + idx * 1.7) * 0.35;
            j.scale.set(pulse, 0.8 + Math.sin(t * 62 + idx) * 0.4, pulse);
          }
        });
      }
    } else if (car.wasAirborne) {
      // Smooth touchdown + suspension squat bounce on asphalt landing
      car.group.rotation.x += (0 - car.group.rotation.x) * Math.min(1, dt * 12);
      if (car.group.position.y > 0.04) {
        car.flyVy = (car.flyVy || 4) + 18 * dt;
        car.group.position.y = Math.max(0, car.group.position.y - car.flyVy * dt);
        car.group.rotation.z += (-0.09 - car.group.rotation.z) * Math.min(1, dt * 8);
      } else {
        if (!car.landed) {
          car.landed = true;
          car.landTimer = 0.42;
          if (car === this.player) {
            this.shake = Math.max(this.shake, 0.35);
            audio.blip(130, 0.09, 'triangle', 0.06);
            this.setMsg(this.build.roadsterFlip ? '翻滚完成 · 稳稳着陆！' : '平稳着陆！', 1.0);
          }
        }
        car.landTimer = Math.max(0, (car.landTimer || 0) - dt);
        const bp = 1 - car.landTimer / 0.42;
        if (car.landTimer > 0) {
          car.group.position.y = Math.max(-0.08, -Math.sin(bp * Math.PI * 2.2) * 0.14 * Math.exp(-bp * 3.5));
          car.group.rotation.z = Math.sin(bp * Math.PI * 2) * 0.06 * Math.exp(-bp * 3);
        } else {
          car.group.position.y = 0;
          car.group.rotation.z = 0;
          car.wasAirborne = false;
          car.landed = false;
          car.flyVy = 0;
        }
      }
      for (const sp of notes) sp.visible = false;
      if (rcs) for (const j of rcs) j.visible = false;
      if (car === this.player) {
        for (const f of this.thrusters) f.visible = false;
      }
    } else {
      const isWave = !!(act && act.type === 'wave' && this.raceTime <= act.until && !car.finished);
      const bob = isWave ? (0.08 + Math.sin(t * 14) * 0.03) : Math.sin(t * 30) * 0.002;
      car.group.position.y += (bob - car.group.position.y) * Math.min(1, dt * 8);
      car.group.rotation.z += ((isWave ? 0.03 : 0) - car.group.rotation.z) * Math.min(1, dt * 6);
      car.group.rotation.y += (0 - car.group.rotation.y) * Math.min(1, dt * 6);
      car.group.rotation.x += (0 - car.group.rotation.x) * Math.min(1, dt * 8);
      for (const sp of notes) sp.visible = false;
      if (rcs) for (const j of rcs) j.visible = false;
      if (car === this.player) {
        for (const f of this.thrusters) f.visible = false;
      }
    }
  }

  updateCamera(dt) {
    const p = this.player;
    const startMode = this.phase === 'intro' || this.phase === 'lights' || this.phase === 'falsestart';
    const flying = this.ability && this.ability.active && this.ability.active.type === 'fly' && !p.finished;
    const chaseY = this.cameraBase.y + p.group.position.y * (flying ? 0.06 : 0.55);
    const chaseLookY = 1.0 + p.group.position.y * (flying ? 0.04 : 0.5);
    const wantPos = startMode
      ? new Vector3(-21.0, 4.6, 6.8)
      : new Vector3(p.x - this.cameraBase.back, chaseY, this.cameraBase.z);
    const wantLook = startMode
      ? new Vector3(2.0, 2.7, -0.3)
      : new Vector3(p.x, chaseLookY, 0);
    if (startMode) {
      this.camera.position.lerp(wantPos, Math.min(1, dt * 4.5));
      this.lookTarget.lerp(wantLook, Math.min(1, dt * 4.5));
    } else {
      // 横向严格跟随玩家，否则高速时相机会被甩在弯后，车会贴到画面右侧。
      this.camera.position.x = wantPos.x;
      this.camera.position.y += (wantPos.y - this.camera.position.y) * Math.min(1, dt * 6);
      this.camera.position.z += (wantPos.z - this.camera.position.z) * Math.min(1, dt * 6);
      this.lookTarget.x = wantLook.x;
      this.lookTarget.y += (wantLook.y - this.lookTarget.y) * Math.min(1, dt * 7);
      this.lookTarget.z += (wantLook.z - this.lookTarget.z) * Math.min(1, dt * 7);
    }
    this.camera.lookAt(this.lookTarget);
    if (this.shake > 0) {
      this.shake -= dt * 2;
      this.camera.position.y += Math.sin(performance.now() * 0.08) * this.shake * 0.06;
    }
  }

  updateWorld(dt) {
    const p = this.player;
    // 路面纹理滚动
    this.asphalt.offset.x = -p.x / 15;
    this.hazTex.offset.x = -p.x / 6;
    // 虚线、路肩、防撞护栏回收
    for (const d of this.dashes) {
      while (d.mesh.position.x < p.x - 90) d.mesh.position.x += 26 * 16;
    }
    if (this.curbs) {
      for (const c of this.curbs) {
        while (c.position.x < p.x - 80) c.position.x += 16 * 24;
      }
    }
    if (this.armcos) {
      for (const a of this.armcos) {
        while (a.position.x < p.x - 80) a.position.x += 14 * 28;
      }
    }
    if (this.trees) {
      for (const tr of this.trees) {
        while (tr.position.x < p.x - 80) tr.position.x += 20 * 24;
      }
    }
    if (this.hills) {
      for (const h of this.hills) {
        while (h.position.x < p.x - 160) h.position.x += 16 * 42;
      }
    }
    // 广告牌/路灯/建筑回收
    for (const b of this.billboards) {
      while (b.position.x < p.x - 80) b.position.x += 7 * 70;
    }
    for (const pl of this.poles) {
      while (pl.position.x < p.x - 70) pl.position.x += 14 * 34;
    }
    for (const b of this.buildings) {
      while (b.position.x < p.x - 160) b.position.x += 18 * 28;
    }
    for (const prop of this.eraProps) {
      while (prop.group.position.x < p.x - 110) prop.group.position.x += prop.span;
    }
    updateEraScenery(this, dt, this.t);
  }

  startWarpSequence() {
    this.throttle = false;
    audio.sweep(220, 1100, 1.8, 0.09);
    setTimeout(() => audio.sweep(550, 2600, 2.1, 0.11), 1600);
    // 3D expanding cyan sonic/spacetime shockwave rings
    const rings = [];
    for (let i = 0; i < 3; i++) {
      const m = new Mesh(
        new TorusGeometry(1.8, 0.08, 6, 24),
        new MeshBasicMaterial({ color: 0x7ff2ff, transparent: true, opacity: 0.85, blending: AdditiveBlending, depthWrite: false })
      );
      m.rotation.y = Math.PI / 2;
      this.scene.add(m);
      rings.push(m);
    }
    const canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 540;
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:20;';
    const banner = document.createElement('div');
    banner.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:21;display:grid;place-items:center;text-align:center;color:#fff;text-shadow:0 0 20px #39d8ff;';
    banner.innerHTML = '<div><div id="warpTitle" style="font-size:32px;letter-spacing:3px;color:#9ef6ff;">突破 1000 km/h</div><div id="warpSub" style="font-size:18px;margin-top:8px;color:#ffffff;">时空曲率引擎充能中…</div><div id="warpYear" style="font-size:48px;margin-top:12px;color:#ffe66b;display:none;font-weight:bold;">2027</div></div>';
    this.wrap.appendChild(canvas);
    this.wrap.appendChild(banner);
    const stars = Array.from({ length: 78 }, (_, k) => ({
      ang: (k / 78) * Math.PI * 2 + Math.random() * 0.2,
      dist: Math.random(),
      spd: 0.7 + Math.random() * 1.4,
      hue: k % 3 === 0 ? '#ffffff' : k % 3 === 1 ? '#64eeff' : '#ffd86b',
    }));
    this.warping = {
      start: performance.now(),
      done: false,
      rings,
      canvas,
      ctx: canvas.getContext('2d'),
      stars,
      $title: banner.querySelector('#warpTitle'),
      $sub: banner.querySelector('#warpSub'),
      $year: banner.querySelector('#warpYear'),
    };
  }

  drawWarpCanvas(wdt, prog) {
    const w = this.warping;
    const ctx = w.ctx;
    const W = w.canvas.width;
    const H = w.canvas.height;
    ctx.clearRect(0, 0, W, H);
    const cx = W * 0.5;
    const cy = H * 0.54;

    // 径向星空与时空隧道光束
    for (const s of w.stars) {
      const r0 = ((s.dist + wdt * s.spd * (0.4 + prog * 1.8)) % 1);
      const r1 = Math.min(1.15, r0 + 0.05 + prog * 0.22);
      const radMax = W * 0.65;
      ctx.strokeStyle = s.hue;
      ctx.globalAlpha = Math.min(0.95, 0.25 + prog * 0.75);
      ctx.lineWidth = 1.5 + prog * 2.5;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(s.ang) * r0 * radMax, cy + Math.sin(s.ang) * r0 * radMax);
      ctx.lineTo(cx + Math.cos(s.ang) * r1 * radMax, cy + Math.sin(s.ang) * r1 * radMax);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // 外圈隧道虹光 + 末端高能白光闪变
    if (prog > 0.35) {
      const g = ctx.createRadialGradient(cx, cy, W * 0.08, cx, cy, W * 0.62);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.65, `rgba(40,180,255,${((prog - 0.35) * 0.45).toFixed(2)})`);
      g.addColorStop(1, `rgba(180,245,255,${((prog - 0.35) * 0.85).toFixed(2)})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    if (wdt >= 3.35) {
      const flash = Math.min(1, (wdt - 3.35) / 0.75);
      ctx.fillStyle = `rgba(235, 252, 255, ${flash.toFixed(2)})`;
      ctx.fillRect(0, 0, W, H);
    }

    if (wdt < 2.15) {
      w.$title.textContent = '突破 1000 km/h';
      w.$sub.textContent = '持续加速 · 正在逼近光速 c…';
    } else if (wdt < 3.25) {
      w.$title.textContent = 'LIGHT SPEED · 299,792 km/s';
      w.$sub.textContent = '到达光速 c！时空虫洞正在打开…';
      w.$year.style.display = 'block';
      const yrs = [2027, 2024, 2021, 2016, 2012, 2008, 2004, 2001];
      const idx = Math.min(yrs.length - 1, Math.floor(((wdt - 2.15) / 1.1) * yrs.length));
      w.$year.textContent = String(yrs[idx]);
    } else {
      w.$title.textContent = 'BACK TO 2001';
      w.$sub.textContent = '时空折叠完成 · 欢迎回到玉米公司汽车赛 II！';
      w.$year.style.display = 'block';
      w.$year.textContent = '2001';
    }
  }

  updateHud() {
    const p = this.player;
    if (this.warping) {
      const wdt = (performance.now() - this.warping.start) / 1000;
      const unitEl = this.wrap.querySelector('.speedo .unit');
      // Strictly monotonic ramp from 1,000 km/h to 1,079,252,849 km/h (= 299,792 km/s, c) with zero backward jumps
      const frac = Math.min(1, wdt / 2.25);
      const kmh = Math.min(1079252849, Math.round(1000 * Math.pow(1079252.849, frac)));
      this.$speed.style.fontSize = kmh >= 10000000 ? '24px' : kmh >= 100000 ? '32px' : '';
      this.$speed.textContent = kmh.toLocaleString();
      unitEl.textContent = frac >= 1 ? 'km/h · 光速 c!' : '公里/小时';
    } else {
      this.$speed.textContent = Math.round(p.v * 3.6);
    }
    const gear = p.v < 0.2 ? 'N' : String(Math.min(6, 1 + Math.floor(p.v * 3.6 / 55)));
    this.$gear.textContent = (this.phase === 'running' && !p.finished) ? gear : 'N';
    const pct = Math.max(0, Math.min(100, (p.x / this.dist) * 100));
    this.$fill.style.width = pct + '%';
    this.$pcar.style.left = pct + '%';
    this.$dist.textContent = `${Math.round(Math.min(p.x, this.dist))} / ${this.dist} m`;
    this.$pos.textContent = this.position || 5;
    this.rivalsData.forEach((c, i) => {
      if (this.$rivals[i]) this.$rivals[i].style.left = Math.max(0, Math.min(100, (c.x / this.dist) * 100)) + '%';
    });
    if (this.ability) {
      this.$abUses.textContent = this.ability.left > 0 ? '待触发' : (this.ability.active ? '生效中' : '已触发');
      this.$abBox.classList.toggle('ready', this.ability.left > 0 || !!this.ability.active);
    }
    if (this.msgTimer > 0) {
      this.msgTimer -= 1 / 60;
      if (this.msgTimer <= 0) this.$msg.classList.remove('show');
    }
  }

  setMsg(text, seconds = 1.2) {
    this.$msg.textContent = text;
    this.$msg.classList.add('show');
    this.msgTimer = seconds;
  }

  disqualify() {
    this.dq = true;
    this.finish(true);
  }

  finish(dq = false) {
    if (this.phase === 'finished') return;
    this.phase = 'finished';
    this.throttle = false;
    audio.stopEngine();
    const p = this.player;
    const time = p.finishTime ?? this.raceTime;
    const rows = this.cars.map((c) => {
      let ft = c.finishTime;
      if (!c.finished) {
        const remain = Math.max(0, this.dist - c.x);
        const vv = Math.max(5, c.v || (c.top / 3.6) * 0.8);
        ft = time + remain / vv;
        if (c === p) ft = time;
      }
      return { car: c, name: c.isPlayer ? this.teamName : c.name, model: c.isPlayer ? (this.build.shell.name) : c.model, time: ft };
    });
    rows.sort((a, b) => a.time - b.time);
    const myRow = rows.findIndex((r) => r.car === p);
    const place = dq ? 5 : myRow + 1;
    const result = {
      place, dq, time, falseStarts: this.falseStarts, danceBonus: this.danceBonus, prizeBonusFrac: this.prizeBonusFrac || 0,
      rows, dist: this.dist, cup: this.cup, equipped: this.equipped,
    };
    this.result = result;
    setTimeout(() => this.showResults(result), dq ? 600 : 450);
  }

  showResults(result) {
    const fmt = (t) => {
      const m = Math.floor(t / 60);
      const s = (t % 60).toFixed(2).padStart(5, '0');
      return m > 0 ? `${m}:${s}` : `${s} s`;
    };
    const flavor = result.dq
      ? '<p style="color:#a21d16">您抢跑三次，强制退出本场比赛，罚款 800 元！（原版忠告：资金太少就不要抢跑）</p>'
      : result.place === 5
        ? '<p style="color:#8e3b16">Bad Luck！你得了第 5 名，下次一定要努力！</p>'
        : result.place === 1
          ? '<p style="color:#1b6e35">祝贺你！你得了第 1 名！</p>'
          : '';
    this.$results.innerHTML = `
      <div class="modal-box">
        <div class="titlebar"><span class="title">${this.cup ? `${this.cup.name}` : `比赛结果 — ${this.season.years} 第 ${this.raceIdx + 1} 场`}</span></div>
        <div class="modal-body">
          ${flavor}
          <table>
            <thead><tr><th>名次</th><th>车队</th><th>车型</th><th>成绩</th><th>${this.cup ? '杯赛' : '积分'}</th></tr></thead>
            <tbody>
              ${result.rows.map((r, i) => `
                <tr class="${r.car.isPlayer ? 'me' : ''}">
                  <td>${i + 1}</td>
                  <td>${r.car.isPlayer ? this.teamName : r.name}</td>
                  <td>${r.model}</td>
                  <td>${fmt(r.time)}</td>
                  <td>${this.cup ? (i === 0 ? '冠军' : '—') : ([10, 6, 4, 0, 0][i] ?? 0)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
          <p class="prize" id="prizeLine"></p>
        </div>
        <div class="modal-actions">
          <button class="btn ok" id="backBtn" disabled>返回车队</button>
        </div>
      </div>`;
    this.$results.classList.add('show');
    const prizeLine = this.$results.querySelector('#prizeLine');
    if (prizeLine && this.awardFn) {
      const aw = this.awardFn(result);
      prizeLine.textContent = this.cup
        ? (this.cup.unlimited
            ? `${aw.note || '挑战结束'}${aw.fine ? `（抢跑罚金 -${aw.fine}）` : ''}`
            : aw.pending
              ? `暂列最佳第 ${aw.bestPlace} 名（剩 ${aw.triesLeft} 次）· 暂不发奖`
              : `杯赛结算 +${aw.prize} 元${aw.fine ? `（含罚金 -${aw.fine}）` : ''}${aw.note ? `（${aw.note}）` : ''} · 不计积分`)
        : result.dq
          ? `罚款 ${aw.fine} 元 · 积分 +0`
          : `奖金 +${aw.prize} 元${aw.note ? `（${aw.note}）` : ''} · 积分 +${aw.points}`;
    }
    const back = this.$results.querySelector('#backBtn');
    back.disabled = false;
    setTimeout(() => { back.disabled = false; }, 400);
    back.onclick = () => {
      if (this.done) return;
      this.done = true;
      this.onFinish(result);
    };
    this.$results.addEventListener('keydown', (e) => { if (e.key === 'Enter') back.click(); });
    // 自动聚焦，回车继续
    setTimeout(() => back.focus(), 50);
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.ro.disconnect();
    audio.stopEngine();
    for (const c of this.cars || []) disposeTree(c.group);
    this.renderer.dispose();
    this.wrap.remove();
  }
}

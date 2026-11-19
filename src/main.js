import './style.css';
import {
  SEASONS, ENDGAME_CUPS, ABILITIES, FUEL_LABEL, LINE_LABEL, techLine, EXOTIC_BODIES, SET_COMBOS, matchSetCombo, comboProgress, itemCombos,
  BMW_PAINTS, cupRuleText, cupRuleError, partCupError, MAIN_DIST, POINTS, PRIZES, RACES_PER_SEASON, START_MONEY, MAX_CUP_TRIES,
} from './data.js';
import { audio } from './audio.js';
import { Garage } from './garage.js';
import { Race } from './race.js';
import { Retro2001Race } from './retro2001.js';

const SAVE_KEY = 'race2026_save_v1';
const SAVE_VERSION = 6;
const SLOT_OF = { shells: 'shell', engines: 'engine', fuels: 'fuel', tires: 'tire', accs: 'acc' };
const $ = (sel) => document.querySelector(sel);

const IS_TOUCH = matchMedia('(pointer: coarse)').matches;
const IS_MOBILE = IS_TOUCH && (window.innerWidth <= 1024 || window.innerHeight <= 600);
const HOLD_HINT = IS_MOBILE ? '按住右下角「加速」按钮' : '按住 ↑ 键';

const defaultState = () => ({
  saveVersion: SAVE_VERSION,
  money: START_MONEY,
  seasonIndex: 0,
  raceInSeason: 0,
  racesDone: 0,
  teamName: '默认车队',
  standings: {},
  inventory: { shells: [], engines: [], fuels: [], tires: [], accs: [] },
  equipped: { shell: null, engine: null, fuel: null, tire: null, acc: null },
  cupStatus: {},
  championships: 0,
  history: [],
  freePlay: false,
  chinaRaces: 0,
  bmwPaint: 'black',
  bmwPaints: ['black'],
  lockedCombo: null,
});

let state = load() || defaultState();
let view = 'info';
let shopCat = 'shells';
let shopSel = null;
let lastShopClick = { id: null, cat: null, at: 0 };
const openStockGroups = new Set();
let garage = null;
let race = null;
let tabButtons = [...document.querySelectorAll('#tabs button')];

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || typeof s.money !== 'number') return null;
    if (s.saveVersion !== SAVE_VERSION || s.seasonIndex >= SEASONS.length || s.racesDone > SEASONS.length * RACES_PER_SEASON) {
      return { ...defaultState(), teamName: s.teamName || defaultState().teamName };
    }
    const d = defaultState();
    const eq = { ...d.equipped, ...(s.equipped || {}) };
    for (const [cat, slot] of Object.entries(SLOT_OF)) {
      if (!eq[slot] && eq[cat]) eq[slot] = eq[cat];
      delete eq[cat];
    }
    const inv = { ...d.inventory, ...(s.inventory || {}) };
    for (const [cat, slot] of Object.entries(SLOT_OF)) {
      if (Array.isArray(inv[cat])) inv[cat] = inv[cat].filter((id) => SEASONS.some((ss) => listOf(ss, cat).some((x) => x.id === id)));
      if (eq[slot] && !SEASONS.some((ss) => listOf(ss, cat).some((x) => x.id === eq[slot]))) eq[slot] = null;
    }
    return {
      ...d, ...s,
      inventory: inv,
      equipped: eq,
      standings: s.standings || {},
      cupStatus: (s.cupStatus && typeof s.cupStatus === 'object') ? s.cupStatus : {},
    };
  } catch (e) { return null; }
}
function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* noop */ }
}

const season = () => SEASONS[Math.min(state.seasonIndex, SEASONS.length - 1)];

function listOf(s, cat) {
  return cat === 'shells' ? s.shells : cat === 'engines' ? s.engines : cat === 'fuels' ? s.fuels : cat === 'tires' ? s.tires : s.accs;
}

function find(cat, id) {
  const pool = cat === 'shells' ? season().shells : cat === 'engines' ? season().engines : cat === 'fuels' ? season().fuels : cat === 'tires' ? season().tires : season().accs;
  for (const s of SEASONS) {
    const list = cat === 'shells' ? s.shells : cat === 'engines' ? s.engines : cat === 'fuels' ? s.fuels : cat === 'tires' ? s.tires : s.accs;
    const hit = list.find((x) => x.id === id);
    if (hit) return hit;
  }
  return pool.find((x) => x.id === id) || null;
}

// ---------- 数值 ----------
function buildStats(e = state.equipped) {
  const shell = e.shell ? find('shells', e.shell) : null;
  const engine = e.engine ? find('engines', e.engine) : null;
  const fuel = e.fuel ? find('fuels', e.fuel) : null;
  const tire = e.tire ? find('tires', e.tire) : null;
  const acc = e.acc ? find('accs', e.acc) : null;
  if (!shell || !engine || !fuel || !tire) return { shell, engine, fuel, tire, acc, top: 0, accel: 0, ok: false };
  const eff = engine.fuelEff ?? 1;
  const topBonus = (fuel.topBonus || 0) * eff + (acc?.topBonus || 0);
  const accelBonus = (fuel.accelBonus || 0) * eff + (tire.accelBonus || 0) + (acc?.accelBonus || 0);
  const top = engine.top * (1 - shell.drag) * (1 + topBonus);
  const accel = (engine.accel * (1 + accelBonus)) / Math.max(0.85, shell.weight);
  return { shell, engine, fuel, tire, acc, top, accel, ok: true };
}

function seasonRuleText(s = season()) {
  const r = s.rules;
  if (!r) return '';
  if (r.maxDisp != null) return `环保限排 ≤ ${r.maxDisp.toFixed(1)}L${r.evExempt ? '（电驱豁免）' : ''}`;
  if (r.chinaRaces) return `中石化冠名：至少 ${r.chinaRaces} 场使用国产/合资引擎`;
  if (r.noMods) return '改装禁令：禁奇趣车壳，全技能失效';
  if (r.powertrains) return `限${r.powertrains.map((f) => (f === 'hybrid' ? '混动' : (FUEL_LABEL[f] || f))).join('/')}动力（混动加汽油）`;
  return '';
}

function engineRuleError(e) {
  if (!e) return '';
  const r = season().rules;
  if (!r) return '';
  if (r.maxDisp != null && e.disp != null && e.disp > r.maxDisp + 0.001) {
    return `本赛季环保限排 ${r.maxDisp.toFixed(1)}L，${e.name} 排量 ${e.disp.toFixed(1)}L，禁止使用。`;
  }
  if (r.powertrains) {
    const ok = r.powertrains.includes(e.fuel) || (r.powertrains.includes('hybrid') && e.isHybrid);
    if (!ok) {
      return `本赛季只允许${r.powertrains.map((f) => (f === 'hybrid' ? '混动' : (FUEL_LABEL[f] || f))).join('/')}动力，${e.name} 不符合。`;
    }
  }
  return '';
}

function shellRuleError(sh) {
  if (!sh) return '';
  if (season().rules?.noMods && EXOTIC_BODIES.has(sh.body)) {
    return `本赛季改装禁令：不能使用${sh.name}。`;
  }
  return '';
}

function fuelRuleError(f) {
  if (!f) return '';
  const r = season().rules;
  if (r?.powertrains) {
    const ok = r.powertrains.includes(f.type) || (r.powertrains.includes('hybrid') && f.type === 'gas');
    if (!ok) {
      return `本赛季只允许${r.powertrains.map((x) => (x === 'hybrid' ? '混动(汽油)' : (FUEL_LABEL[x] || x))).join('/')}动力，${f.name}不符合。`;
    }
  }
  return '';
}

function partRuleError(cat, it) {
  if (cat === 'engines') return engineRuleError(it);
  if (cat === 'shells') return shellRuleError(it);
  if (cat === 'fuels') return fuelRuleError(it);
  return '';
}

function validate() {
  const e = state.equipped;
  if (!e.shell || !e.engine || !e.fuel || !e.tire) return { ok: false, msg: '没有装配必要的设备' };
  const engine = find('engines', e.engine);
  const fuel = find('fuels', e.fuel);
  const shell = find('shells', e.shell);
  if (!engine || !fuel || !shell) return { ok: false, msg: '有配件已经不在当前车库里，请重新装配。' };
  const engineErr = engineRuleError(engine);
  if (engineErr) return { ok: false, msg: engineErr };
  const shellErr = shellRuleError(shell);
  if (shellErr) return { ok: false, msg: shellErr };
  if (engine.fuel !== fuel.type) {
    return { ok: false, msg: `发动机与燃料的类型不匹配：${engine.name} 需要${FUEL_LABEL[engine.fuel] || engine.fuel}，当前装的是${FUEL_LABEL[fuel.type] || fuel.type}。` };
  }
  return { ok: true };
}

// ---------- 商店库存 ----------
function inventoryOf(cat) {
  return state.inventory[cat] || [];
}

function partKey(cat, it) {
  if (!it) return '';
  if (cat === 'engines') return `${it.name}|${it.fuel}|${it.top}|${it.accel}`;
  if (cat === 'fuels') return `${it.name}|${it.type}|${it.topBonus}|${it.accelBonus || 0}`;
  if (cat === 'tires') return `${it.name}|${it.accelBonus}`;
  if (cat === 'accs') return `${it.name}|${it.accelBonus}|${it.topBonus}`;
  return `${it.name}|${it.body}|${it.weight}|${it.drag}|${it.ability || ''}`;
}

function inventoryItems(cat) {
  return inventoryOf(cat).map((id) => find(cat, id)).filter(Boolean);
}

function ownedKeys(cat) {
  return new Set(inventoryItems(cat).map((it) => partKey(cat, it)));
}

function entrySeason(cat, it) {
  if (!it) return -1;
  if (it.fromSeason != null) return it.fromSeason;
  for (let si = 0; si < SEASONS.length; si++) {
    if (listOf(SEASONS[si], cat).some((x) => x.id === it.id)) return si;
  }
  return -1;
}

function hasNameConflict(cat, it) {
  if (!it) return false;
  return SEASONS.filter((s) => listOf(s, cat).some((x) => x.name === it.name)).length > 1;
}

function itemLabel(cat, it) {
  if (!it) return '';
  if (!hasNameConflict(cat, it)) return it.name;
  const si = entrySeason(cat, it);
  return si >= 0 ? `${it.name}（${SEASONS[si].years}）` : it.name;
}

function pastStockGroups(cat) {
  const seen = new Set(seasonPool(cat).map((it) => it.name));
  const groups = [];
  for (let si = state.seasonIndex - 1; si >= 0; si--) {
    const items = [];
    for (const it of listOf(SEASONS[si], cat)) {
      if (seen.has(it.name)) continue;
      seen.add(it.name);
      items.push({ ...it, past: true, fromSeason: si });
    }
    if (items.length) {
      groups.push({ si, years: SEASONS[si].years, name: SEASONS[si].name, items });
    }
  }
  return groups;
}

function activeBmwPaint() {
  return BMW_PAINTS.find((p) => p.id === state.bmwPaint) || BMW_PAINTS[0];
}

function shellSpec(shell) {
  if (!shell) return { body: 'sedan', grille: 'kidney', color: '#1c1e22', accent: '#c9ccd2', wing: false, key: 'default' };
  const color = shell.id === 's0_bmw_black' ? activeBmwPaint().color : shell.color;
  return { body: shell.body, grille: shell.grille, color, accent: shell.accent, wing: shell.wing, key: shell.id, name: shell.name };
}

function renderBmwPaintBox() {
  const owned = new Set(state.bmwPaints || ['black']);
  const cur = activeBmwPaint();
  return `
    <div class="paint-box">
      <div class="paint-head">原厂喷漆改装：<b>${cur.name}</b></div>
      <div class="paint-row">
        ${BMW_PAINTS.map((p) => {
          const isOwned = owned.has(p.id);
          const isActive = p.id === cur.id;
          return `<button class="paint-btn ${isActive ? 'active' : ''}" data-paint="${p.id}" title="${escapeHtml(p.name)}：${escapeHtml(p.desc)}">
            <span class="swatch" style="background:${p.color}"></span>
            <span>${p.name}</span>
            <span class="p-cost">${isOwned ? (isActive ? '当前' : '已购') : `${p.price}元`}</span>
          </button>`;
        }).join('')}
      </div>
      <div class="hint" id="paintDesc">${escapeHtml(cur.desc)}</div>
    </div>`;
}

function bindBmwPaint(onUpdated) {
  document.querySelectorAll('.paint-btn').forEach((btn) => {
    btn.onclick = () => {
      const p = BMW_PAINTS.find((x) => x.id === btn.dataset.paint);
      if (!p) return;
      if (!Array.isArray(state.bmwPaints)) state.bmwPaints = ['black'];
      if (!state.bmwPaints.includes(p.id)) {
        if (state.money < p.price) {
          showModal({ title: '喷漆师傅', body: '<p style="color:#a21d16">20 块钱都没有？</p>' });
          audio.blip(180, 0.15, 'square', 0.05);
          return;
        }
        state.money -= p.price;
        state.bmwPaints.push(p.id);
        audio.play('money', 0.75);
      } else {
        audio.blip(880, 0.04);
      }
      state.bmwPaint = p.id;
      save();
      updateChrome();
      onUpdated();
    };
  });
}

// ---------- 通用 UI ----------
function moneyText(n) { return `${Math.round(n)} 元`; }
function updateChrome() {
  const moneyEl = $('#money');
  moneyEl.textContent = Math.round(state.money);
  moneyEl.classList.toggle('low', state.money <= 100);
  $('#seasonLabel').textContent = `${season().years} ${season().name}`;
  $('#raceCounter').textContent = `比赛场次: ${state.racesDone} / ${SEASONS.length * RACES_PER_SEASON}`;
  const newsIdx = state.raceInSeason % season().news.length;
  $('#newsText').textContent = season().news[newsIdx];
  tabButtons.forEach((b) => {
    b.classList.toggle('active', b.dataset.tab === view);
    b.disabled = !!race;
  });
}
function destroyGarage() {
  if (garage) { garage.dispose(); garage = null; }
}
function showModal({ title = '提示', body = '', actions = [{ label: '确定' }] }) {
  const m = $('#modal');
  m.innerHTML = `
    <div class="modal-box">
      <div class="titlebar"><span class="title">${title}</span><span class="winbtns"><b class="close">✕</b></span></div>
      <div class="modal-body">${body}</div>
      <div class="modal-actions">${actions.map((a, i) => `<button class="btn ok" data-i="${i}">${a.label}</button>`).join('')}</div>
    </div>`;
  m.classList.remove('hidden');
  return new Promise((resolve) => {
    m.querySelectorAll('.btn').forEach((b) => {
      b.onclick = () => {
        const i = Number(b.dataset.i);
        m.classList.add('hidden');
        m.innerHTML = '';
        resolve(i);
      };
    });
    m.querySelector('.close').onclick = () => {
      m.classList.add('hidden'); m.innerHTML = ''; resolve(-1);
    };
  });
}

function setStatusBanner(equipped = state.equipped) {
  const active = matchSetCombo(equipped);
  if (active && !active.secret) {
    const p = comboProgress(active, equipped);
    return `<div class="combo-line">套装激活：<b>${active.name}（${p.equippedCount}/${p.total}）</b> — <span class="hint">${active.desc}</span></div>`;
  }
  const partials = SET_COMBOS.filter((c) => !c.secret).map((c) => comboProgress(c, equipped)).filter((p) => p.equippedCount > 0);
  if (!partials.length) return '';
  return partials.map((p) => {
    const miss = p.pieces.filter((x) => !x.done).map((x) => x.label).join(' + ');
    return `<div class="combo-partial">套装进度：<b>${p.combo.short}（${p.equippedCount}/${p.total}）</b> · 还差：${escapeHtml(miss)}</div>`;
  }).join('');
}

// ---------- 信息页 ----------
function renderInfo() {
  destroyGarage();
  const s = season();
  const st = buildStats();
  const teams = standingsTable();
  const nextRace = state.raceInSeason + 1;
  const rule = seasonRuleText();
  const chinaNeed = s.rules?.chinaRaces;
  const noMods = !!s.rules?.noMods;
  const v = validate();
  const champBonus = s.champBonus ?? Math.round(2000 * s.prizeMult);
  const cups = s.cups || [];
  const cupStatus = state.cupStatus || {};
  const lowMoney = state.money <= 100;
  const dist = s.mainDist || MAIN_DIST;
  $('#view').innerHTML = `
    <div class="info-grid">
      <div class="info-left">
        <div class="panel" style="flex:1; overflow:auto">
          <h3><span class="ico">▣</span>比赛信息</h3>
          <div class="team-row">车队名称: <input id="teamName" value="${escapeHtml(state.teamName)}" maxlength="10" /></div>
          <p class="money-line">总资产: <b class="${lowMoney ? 'low' : ''}">$${Math.round(state.money)}</b>${lowMoney ? ' <span class="low-warn">（告急 ≤100）</span>' : ''}</p>
          <p class="hint">${escapeHtml(s.story).replace(/\n/g, '<br>')}</p>
          ${rule ? `<p class="season-rule"><b>规则</b>：${rule}${chinaNeed ? ` <span class="rule-progress">(${state.chinaRaces || 0}/${chinaNeed}场)</span>` : ''}</p>` : ''}
          <ol class="rules">
            <li>绿灯亮起后${HOLD_HINT}手动加速</li>
            <li>抢跑 3 次罚出（-800 元），资产 ≤ 0 淘汰</li>
            <li>本季主线 ${dist}m 前三名计分（10/6/4）</li>
          </ol>
          <p class="hint">配置：${st.shell ? st.shell.name : '无壳'} · ${st.engine ? st.engine.name : '无引擎'} · ${st.fuel ? st.fuel.name : '无油'} · ${st.tire ? st.tire.name : '无胎'}${st.acc ? ' · ' + st.acc.name : ''}</p>
          <p class="hint">极速 <b>${st.ok ? Math.round(st.top) + ' km/h' : '—'}</b> ｜ 0-100 <b>${st.ok ? (27.8 / st.accel).toFixed(1) + 's' : '—'}</b> ｜ 技能 <b>${noMods ? '禁用' : st.shell && st.shell.ability ? ABILITIES[st.shell.ability].name : '无'}</b></p>
          ${setStatusBanner(state.equipped)}
          ${!v.ok ? `<p class="rule-warn">主线受阻：${v.msg}</p>` : ''}
        </div>
        <div class="start-wrap">
          <div class="next-race">第 ${nextRace}/6 场 · ${s.years}（${dist}m）<br><span class="hint">季 ${state.seasonIndex + 1}/${SEASONS.length} · 冠军奖 ${champBonus} 元${hasNewStock() ? ' · <b style="color:var(--amber)">有新货</b>' : ''}</span></div>
          <button class="start-btn" id="startRace">开始主线赛 &gt;&gt;</button>
        </div>
      </div>
      <div class="panel" style="display:flex;flex-direction:column;min-height:0;overflow:auto">
        <h3><span class="ico">▤</span>${s.years} 积分表</h3>
        <table class="standings">
          <thead><tr><th>车队名称</th><th class="num">积分</th></tr></thead>
          <tbody>${teams.map((t) => `<tr class="${t.me ? 'me' : ''}"><td>${escapeHtml(t.name)}</td><td class="num">${t.points}</td></tr>`).join('')}</tbody>
        </table>
        ${state.freePlay ? `
          <div class="cups-box">
            <div class="cups-title">终极主题杯赛</div>
            ${ENDGAME_CUPS.map((c) => {
              const cs = cupStatus[c.id] || { tries: 0, bestPlace: null };
              const won = cs.bestPlace === 1;
              const badge = won ? '<span class="cup-won">已征服</span>' : cs.bestPlace ? `<span class="cup-done">最佳 第${cs.bestPlace}名</span>` : '';
              return `
                <div class="cup-item ${won ? 'won' : ''}">
                  <div class="cup-main">
                    <div class="cup-name">${escapeHtml(c.name)} <span class="cup-dist">${c.dist}m</span> ${badge}</div>
                    <div class="cup-meta">${cupRuleText(c)}</div>
                  </div>
                  <button class="btn cup-btn" data-cup="${c.id}">选配挑战</button>
                </div>`;
            }).join('')}
          </div>` : ''}
        ${cups.length ? `
          <div class="cups-box">
            <div class="cups-title">可选杯赛 <span class="hint">（不计积分 · 限 2 次）</span></div>
            ${cups.map((c) => {
              const cs = cupStatus[c.id] || { tries: 0, bestPlace: null, paid: false };
              const done = !!cs.paid || cs.tries >= MAX_CUP_TRIES;
              const won = cs.bestPlace === 1;
              const left = Math.max(0, MAX_CUP_TRIES - cs.tries);
              const badge = won ? '<span class="cup-won">已夺冠</span>' : done ? `<span class="cup-done">已结算 第${cs.bestPlace || '-'}名</span>` : '';
              return `
                <div class="cup-item ${won ? 'won' : done ? 'settled' : ''}">
                  <div class="cup-main">
                    <div class="cup-name">${escapeHtml(c.name)} <span class="cup-dist">${c.dist}m</span> ${badge}</div>
                    <div class="cup-meta">${cupRuleText(c)} ｜ 奖 <b>${c.prize}</b> 元 ｜ ${done ? '已结清' : cs.tries === 1 ? `最佳第${cs.bestPlace}名 · 剩${left}次` : `限 ${MAX_CUP_TRIES} 次`}</div>
                  </div>
                  <button class="btn cup-btn" data-cup="${c.id}" ${done ? 'disabled' : ''}>${done ? '已结束' : '选配开赛'}</button>
                </div>`;
            }).join('')}
          </div>` : ''}
        <div class="preview-stage" id="infoStage" style="flex:none;height:170px;margin-top:8px">
        </div>
        <p class="hint" style="margin-top:6px">进度 ${state.raceInSeason}/${RACES_PER_SEASON} ｜ 总冠军 ${state.championships} 次 ｜ ${HOLD_HINT}加速 · 被动技能</p>
      </div>
    </div>`;

  $('#teamName').addEventListener('change', (e) => {
    const oldName = state.teamName;
    const newName = e.target.value.trim() || '默认车队';
    if (newName !== oldName) {
      if (state.standings[oldName] != null) {
        state.standings[newName] = state.standings[oldName];
        delete state.standings[oldName];
      }
      state.teamName = newName;
    }
    save(); updateChrome(); renderInfo();
  });
  $('#startRace').onclick = () => tryStartRace(null);
  const allCups = [...cups, ...(state.freePlay ? ENDGAME_CUPS : [])];
  document.querySelectorAll('.cup-btn').forEach((btn) => {
    btn.onclick = () => {
      const cup = allCups.find((c) => c.id === btn.dataset.cup);
      if (cup) openCupSetupModal(cup);
    };
  });

  garage = new Garage($('#infoStage'));
  garage.setSpec(shellSpec(st.shell));
}

// ---------- 商店 ----------
function seasonPool(cat) {
  const s = season();
  return cat === 'shells' ? s.shells : cat === 'engines' ? s.engines : cat === 'fuels' ? s.fuels : cat === 'tires' ? s.tires : s.accs;
}
function catLabel(cat) {
  return { shells: '汽车车壳', engines: '发动机', fuels: '燃料', tires: '轮胎', accs: '附加设备' }[cat];
}
function partType(cat, it) {
  if (!it) return '';
  if (cat === 'engines') {
    const base = FUEL_LABEL[it.fuel] || it.fuel;
    if (it.isHybrid) return `${base}·混动`;
    if (it.isAero) return `${base}·航发`;
    return base;
  }
  if (cat === 'fuels') return FUEL_LABEL[it.type] || it.type;
  return '';
}
function itemLocked(it) {
  return !state.freePlay && !it.past && (it.unlock || 0) > state.raceInSeason;
}
function hasNewStock() {
  if (state.freePlay || state.raceInSeason <= 0) return false;
  return ['engines', 'fuels', 'tires', 'accs', 'shells'].some((cat) => season()[cat].some((it) => it.unlock === state.raceInSeason));
}
function renderShop() {
  destroyGarage();
  if (!seasonPool(shopCat).length) shopCat = 'shells';
  const ownedSet = ownedKeys(shopCat);
  const invIds = inventoryOf(shopCat);
  const isItemOwned = (it) => invIds.includes(it.id) || ownedSet.has(partKey(shopCat, it));
  const items = seasonPool(shopCat).filter((it) => !it.secret && !isItemOwned(it));
  const groups = pastStockGroups(shopCat)
    .map((g) => ({ ...g, items: g.items.filter((it) => !it.secret && !isItemOwned(it)) }))
    .filter((g) => g.items.length > 0);
  const all = [...items, ...groups.flatMap((g) => g.items)];
  if (!shopSel || !all.find((i) => i.id === shopSel)) shopSel = items[0]?.id || all[0]?.id || null;
  const sel = all.find((i) => i.id === shopSel) || null;
  const eqId = state.equipped[SLOT_OF[shopCat]];
  const eqItem = eqId ? find(shopCat, eqId) : null;
  const selKey = partKey(shopCat, sel);
  const owned = !!sel && (invIds.includes(sel.id) || ownedSet.has(selKey));
  const equipped = !!sel && (eqId === sel.id || (eqItem && partKey(shopCat, eqItem) === selKey));
  const locked = sel ? itemLocked(sel) : false;
  const type = partType(shopCat, sel);
  const ability = shopCat === 'shells' && sel && sel.ability ? ABILITIES[sel.ability] : null;
  const line = sel && (shopCat === 'engines' || shopCat === 'shells') ? techLine(sel) : null;
  const ruleErr = sel ? partRuleError(shopCat, sel) : '';
  const rule = seasonRuleText();
  const selSeason = sel ? entrySeason(shopCat, sel) : -1;
  const verTag = sel && selSeason >= 0 && (sel.past || hasNameConflict(shopCat, sel))
    ? `<span class="tag ver-tag">${SEASONS[selSeason].years}</span>` : '';
  const noMods = !!season().rules?.noMods;

  const row = (it, past) => {
    const isOwned = inventoryOf(shopCat).includes(it.id) || ownedSet.has(partKey(shopCat, it));
    const isEquipped = eqId === it.id || (eqItem && partKey(shopCat, eqItem) === partKey(shopCat, it));
    const isLocked = !past && itemLocked(it);
    const itType = partType(shopCat, it);
    const itLine = shopCat === 'engines' || shopCat === 'shells'
      ? `<span class="line-tag line-${techLine(it)}">${LINE_LABEL[techLine(it)]}</span>` : '';
    const itRule = partRuleError(shopCat, it) ? '<span class="rule-tag">本赛季禁用</span>' : '';
    const isNew = !past && !isLocked && it.unlock === state.raceInSeason && state.raceInSeason > 0;
    const itSeason = entrySeason(shopCat, it);
    const ver = itSeason >= 0 && (past || hasNameConflict(shopCat, it))
      ? `<span class="ver-tag">${SEASONS[itSeason].years}</span>` : '';
    const itSets = itemCombos(shopCat, it.id, state.equipped);
    const setTag = itSets.map((cp) => `<span class="set-tag ${cp.active ? 'done' : ''}">${cp.combo.short}（${cp.equippedCount}/${cp.total}）</span>`).join('');
    return `<div class="item ${it.id === shopSel ? 'active' : ''} ${isLocked ? 'locked' : ''}" data-id="${it.id}">
      ${escapeHtml(it.name)}${itType ? `<span class="type-tag">${itType}</span>` : ''}${setTag}${itLine}${itRule}${ver}${isEquipped ? '<span class="sold-tag">已装备</span>' : isOwned ? '<span class="sold-tag">已购买</span>' : isLocked ? `<span class="lock-tag">第 ${it.unlock + 1} 场到货</span>` : isNew ? '<span class="new-tag">新到货</span>' : ''}
    </div>`;
  };

  $('#view').innerHTML = `
    <div class="shop-grid">
      <div class="cat-col">
        <div class="panel-title">汽车配件</div>
        ${['shells', 'engines', 'fuels', 'tires', 'accs'].map((c) => `<button class="cat-btn ${c === shopCat ? 'active' : ''}" data-cat="${c}">${catLabel(c)}</button>`).join('')}
        <div class="tech-legend">
          <span><i class="line-dot domestic"></i>国产/合资</span>
          <span><i class="line-dot imported"></i>进口</span>
          <span><i class="line-dot exotic"></i>神奇科技</span>
        </div>
        <div class="hint" style="margin-top:auto">${season().years}<br>${state.freePlay ? '自由比赛 · 全部配件已上架' : `已跑 ${state.raceInSeason} / ${RACES_PER_SEASON} 场，新货随比赛到店。往季库存保留在下方。`}</div>
      </div>
      <div class="item-list" id="itemList">
        ${rule ? `<div class="shop-rule">${rule}${season().rules?.chinaRaces ? `<br><b>赞助进度：${state.chinaRaces || 0} / ${season().rules.chinaRaces} 场</b>` : ''}</div>` : ''}
        ${items.length ? `<div class="stock-head">本赛季新货</div>${items.map((it) => row(it, false)).join('')}` : ''}
        ${groups.length ? `<div class="stock-head past-head">往季库存</div>` + groups.map((g) => {
          const key = `${shopCat}:${g.si}`;
          return `<details class="stock-group" data-group="${key}" ${openStockGroups.has(key) ? 'open' : ''}>
            <summary>${g.years} ${g.name}<span class="stock-count">${g.items.length}</span></summary>
            ${g.items.map((it) => row(it, true)).join('')}
          </details>`;
        }).join('') : ''}
        ${!items.length && !groups.length ? '<div class="hint" style="padding:14px">本分类商品已全部购入，去工厂装配或到别的分类逛逛。</div>' : ''}
      </div>
      <div class="preview">
        <div class="preview-stage" id="shopStage"></div>
        <div class="preview-body">
          <div class="preview-name" id="pname">${sel ? escapeHtml(sel.name) : '—'} ${line ? `<span class="tag line-${line}">${LINE_LABEL[line]}</span>` : ''} ${type ? `<span class="tag">${type}</span>` : ''} ${verTag}</div>
          <div class="price-line">价格: <b>${sel ? Math.round(sel.price) : 0}</b> 元 ${locked ? `<span class="lock-tag">第 ${sel.unlock + 1} 场后到货</span>` : ''}</div>
          <div class="desc" id="pdesc">${sel && shopCat === 'shells' && sel.id === 's0_bmw_black' ? escapeHtml(activeBmwPaint().desc) : sel ? escapeHtml(sel.desc || '') : '选择一件配件看看。'}</div>
          ${shopCat === 'shells' && sel && sel.id === 's0_bmw_black' && (owned || equipped) ? renderBmwPaintBox() : ''}
          ${shopCat === 'engines' && sel ? `
            <div class="shell-spec">
              <span>科技线 <b>${LINE_LABEL[line]}</b></span>
              <span>燃料 <b>${type || '—'}</b></span>
              <span>排量 <b>${sel.disp == null ? '—' : (sel.disp === 0 ? (sel.fuel === 'electric' ? '电驱' : '—') : sel.disp.toFixed(1) + ' L')}</b></span>
              <span>极速 <b>${sel.top}</b> km/h</span>
              <span>加速 <b>${sel.accel}</b></span>
              ${sel.fuelEff && sel.fuelEff < 1 ? `<span>燃油效率 <b>${Math.round(sel.fuelEff * 100)}%</b></span>` : ''}
            </div>` : ''}
          ${shopCat === 'fuels' && sel ? `
            <div class="shell-spec">
              <span>燃料类型 <b>${type || '—'}</b></span>
              <span>极速 <b>+${Math.round((sel.topBonus || 0) * 100)}%</b></span>
              <span>加速 <b>+${Math.round((sel.accelBonus || 0) * 100)}%</b></span>
              ${sel.cRate ? `<span>倍率 <b>${sel.cRate}C</b></span>` : ''}
              ${sel.voltage ? `<span>电压 <b>${sel.voltage}V</b></span>` : ''}
              ${sel.ecoBonus ? `<span>环保补贴 <b>+${sel.ecoBonus}元</b></span>` : ''}
            </div>` : ''}
          ${shopCat === 'shells' && sel ? `
            <div class="shell-spec">
              <span>科技线 <b>${LINE_LABEL[line]}</b></span>
              <span>重量 <b>${sel.weight.toFixed(2)}</b></span>
              <span>风阻系数 <b>${sel.drag.toFixed(2)}</b></span>
              <span>技能 <b>${noMods ? '禁用（改装禁令）' : ability ? ability.name : '无'}</b></span>
            </div>
            ${noMods ? '<div class="hint">本赛季改装禁令生效，车壳技能无法使用。</div>' : ability ? `<div class="hint">${ability.desc}</div>` : ''}` : ''}
          ${sel ? (() => {
            const selSets = itemCombos(shopCat, sel.id, state.equipped);
            if (!selSets.length) return '';
            return selSets.map((cp) => `<div class="set-box ${cp.active ? 'done' : ''}">
              <div class="set-head">套装件：<b>${cp.combo.name}（${cp.equippedCount}/${cp.total}）</b></div>
              <div class="set-pieces">${cp.pieces.map((p) => `<span class="${p.done ? 'ok' : ''}">${p.done ? '✓' : '○'} ${escapeHtml(p.label)}</span>`).join('')}</div>
              <div class="hint">${escapeHtml(cp.combo.desc)}</div>
            </div>`).join('');
          })() : ''}
          ${ruleErr ? `<div class="rule-warn">${ruleErr} 仍可买下留到以后，但本赛季不能参赛。</div>` : ''}
        </div>
        <div class="buy-row">
          <button class="btn buy" id="buyBtn" ${!sel || owned || equipped || locked ? 'disabled' : ''}>
            <span class="check"></span>${locked ? '未到货' : owned || equipped ? '已购买' : '购买'}
          </button>
          <span class="owned-note" id="ownedNote">${equipped ? '当前已装备' : '双击左侧列表可直接购买'}</span>
        </div>
      </div>
    </div>`;

  document.querySelectorAll('.cat-btn').forEach((b) => {
    b.onclick = () => { shopCat = b.dataset.cat; shopSel = null; lastShopClick = { id: null, cat: null, at: 0 }; audio.blip(700, 0.04); renderShop(); };
  });
  document.querySelectorAll('.item').forEach((el) => {
    el.onclick = () => {
      const id = el.dataset.id;
      const now = performance.now();
      const isDouble = lastShopClick.id === id && lastShopClick.cat === shopCat && now - lastShopClick.at < 650;
      if (isDouble) {
        lastShopClick = { id: null, cat: null, at: 0 };
        const target = all.find((i) => i.id === id);
        if (target) buy(target, shopCat);
        return;
      }
      shopSel = id;
      audio.blip(800, 0.03);
      renderShop();
      lastShopClick = { id, cat: shopCat, at: performance.now() };
    };
    el.ondblclick = () => {
      lastShopClick = { id: null, cat: null, at: 0 };
      const target = all.find((i) => i.id === el.dataset.id);
      if (target) buy(target, shopCat);
    };
  });
  document.querySelectorAll('.stock-group').forEach((d) => {
    d.addEventListener('toggle', () => {
      if (d.open) openStockGroups.add(d.dataset.group);
      else openStockGroups.delete(d.dataset.group);
    });
  });

  const stage = $('#shopStage');
  garage = new Garage(stage);
  if (shopCat === 'shells' && sel) garage.setSpec(shellSpec(sel));
  else if (sel) garage.setPart(shopCat, sel);
  else {
    const st = buildStats();
    garage.setSpec(shellSpec(st.shell));
  }

  const buyBtn = $('#buyBtn');
  if (buyBtn) buyBtn.onclick = () => buy(sel, shopCat);
  bindBmwPaint(renderShop);
}

function buy(item, cat) {
  if (!item) return;
  if (inventoryOf(cat).includes(item.id)) return;
  if (ownedKeys(cat).has(partKey(cat, item))) {
    showModal({ title: '商店老板', body: '<p>你已经有一件完全相同的商品了，别重复买。</p>' });
    audio.blip(180, 0.15, 'square', 0.05);
    return;
  }
  if (itemLocked(item)) {
    showModal({ title: '商店老板', body: `<p>这批货还没到。</p><p class="hint">再跑 ${item.unlock - state.raceInSeason} 场，第 ${item.unlock + 1} 场开赛前到货。</p>` });
    audio.blip(180, 0.15, 'square', 0.05);
    return;
  }
  if (state.money < item.price) {
    showModal({
      title: '商店老板',
      body: '<p style="color:#a21d16;font-size:18px">没钱就赶快滚！</p><p class="hint">商店老板拍着柜台说道。先去跑几场主线赛或本季可选杯赛挣点现金吧。</p>',
    });
    audio.blip(180, 0.15, 'square', 0.05);
    return;
  }
  state.money -= item.price;
  inventoryOf(cat).push(item.id);
  const slot = SLOT_OF[cat];
  if (!state.equipped[slot]) state.equipped[slot] = item.id;
  audio.play('money', 0.75);
  save();
  updateChrome();
  renderShop();
}

function ownedSetCombos() {
  const slots = ['shell', 'engine', 'fuel', 'tire', 'acc'];
  const s2c = { shell: 'shells', engine: 'engines', fuel: 'fuels', tire: 'tires', acc: 'accs' };
  return SET_COMBOS.filter((c) => !c.secret && slots.every((sl) => {
    if (!c[sl] && !c[sl + 's']) return true;
    const inv = inventoryOf(s2c[sl]);
    const ids = c[sl + 's'] || [c[sl]];
    return ids.some((id) => inv.includes(id));
  }));
}

function bestCompatibleFuel(engId) {
  const eng = engId ? find('engines', engId) : null;
  if (!eng) return null;
  const fuels = inventoryOf('fuels')
    .map((id) => find('fuels', id))
    .filter((f) => f && f.type === eng.fuel && !fuelRuleError(f))
    .sort((a, b) => (b.price || 0) - (a.price || 0));
  return fuels[0]?.id || null;
}

// ---------- 工厂 ----------
function renderFactory() {
  destroyGarage();
  const st = buildStats();
  const ownedCombos = ownedSetCombos();
  let lockedC = state.lockedCombo ? ownedCombos.find((c) => c.id === state.lockedCombo) : null;
  if (lockedC && matchSetCombo(state.equipped)?.id !== lockedC.id) {
    state.lockedCombo = null;
    lockedC = null;
  }
  const lockedSlots = new Set();
  if (lockedC) {
    for (const sl of ['shell', 'engine', 'fuel', 'tire', 'acc']) {
      if (lockedC[sl] || lockedC[sl + 's']) lockedSlots.add(sl);
    }
  }
  const slots = [
    ['engines', 'engine', '发动机'],
    ['tires', 'tire', '轮胎'],
    ['fuels', 'fuel', '燃料'],
    ['accs', 'acc', '附加设备'],
  ];
  const icon = (slot) => {
    const svg = {
      engine: '<svg width="30" height="30" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="3" y="5" width="8" height="6" fill="#6b7278"/><rect x="4" y="3" width="4" height="2" fill="#9aa0a6"/><rect x="11" y="6" width="3" height="4" fill="#4a5054"/><rect x="1" y="6" width="2" height="4" fill="#8d9499"/><rect x="4" y="11" width="2" height="2" fill="#3a4044"/><rect x="8" y="11" width="2" height="2" fill="#3a4044"/></svg>',
      tire: '<svg width="30" height="30" viewBox="0 0 16 16" shape-rendering="crispEdges"><circle cx="8" cy="8" r="6" fill="#1c1c1c"/><circle cx="8" cy="8" r="3" fill="#8d9499"/><circle cx="8" cy="8" r="1" fill="#2b2b2b"/></svg>',
      fuel: '<svg width="30" height="30" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="4" y="3" width="7" height="10" fill="#c9a227"/><rect x="6" y="1" width="3" height="2" fill="#8d6e1a"/><rect x="11" y="5" width="2" height="6" fill="#8d9499"/><rect x="5" y="5" width="5" height="2" fill="#e8e6df"/></svg>',
      acc: '<svg width="30" height="30" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="6" y="2" width="4" height="3" fill="#9aa0a6"/><rect x="5" y="5" width="6" height="7" fill="#6b7278"/><rect x="6" y="7" width="4" height="1" fill="#2b2b2b"/><rect x="6" y="9" width="4" height="1" fill="#2b2b2b"/></svg>',
      shell: '<svg width="30" height="30" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect x="2" y="6" width="12" height="4" fill="#2b5cb0"/><rect x="4" y="3" width="7" height="3" fill="#3d6cc4"/><rect x="3" y="10" width="2" height="2" fill="#1c1c1c"/><rect x="11" y="10" width="2" height="2" fill="#1c1c1c"/></svg>',
    };
    return svg[slot];
  };
  const rule = seasonRuleText();
  const chinaNeed = season().rules?.chinaRaces;
  const noMods = !!season().rules?.noMods;
  const curEng = state.equipped.engine ? find('engines', state.equipped.engine) : null;
  const options = (cat, cur, slot) => {
    let owned = inventoryOf(cat).map((id) => find(cat, id)).filter(Boolean);
    const cmpNewest = (a, b) => entrySeason(cat, b) - entrySeason(cat, a)
      || (b.unlock || 0) - (a.unlock || 0)
      || (b.price || 0) - (a.price || 0);
    if (cat === 'fuels' && curEng) {
      const rank = (f) => {
        if (f.type !== curEng.fuel) return 2;
        return partRuleError(cat, f) ? 1 : 0;
      };
      owned = [...owned].sort((a, b) => rank(a) - rank(b) || cmpNewest(a, b));
    } else {
      owned = [...owned].sort(cmpNewest);
    }
    return `<option value="">(无)</option>` + owned.map((it) => {
      const t = partType(cat, it);
      const ln = cat === 'engines' || cat === 'shells' ? ` · ${LINE_LABEL[techLine(it)]}` : '';
      const bad = partRuleError(cat, it);
      const incompat = cat === 'fuels' && curEng && it.type !== curEng.fuel;
      const cs = itemCombos(cat, it.id, state.equipped);
      const setTxt = cs.length ? ` [${cs.map((c) => `${c.combo.short} ${c.equippedCount}/${c.total}`).join('/')}]` : '';
      const tag = incompat ? ' · 不兼容(不可用)' : bad ? ' · 本赛季禁用' : '';
      const dis = incompat ? 'disabled style="color:#9a9484;background:#efece2"' : '';
      return `<option value="${it.id}" ${cur === it.id ? 'selected' : ''} ${dis}>${escapeHtml(itemLabel(cat, it))}${t ? `（${t}）` : ''}${setTxt}${ln}${tag}</option>`;
    }).join('');
  };

  $('#view').innerHTML = `
    <div class="factory-grid">
      <div class="factory-left">
        <div class="panel">
          <h3><span class="ico">▧</span>装配工厂</h3>
          ${rule ? `<div class="season-rule">${rule}${chinaNeed ? `<br><span class="rule-progress">赞助进度：国产/合资发动机 ${state.chinaRaces || 0} / ${chinaNeed} 场</span>` : ''}</div>` : ''}
          ${ownedCombos.length ? `
            <div class="set-picker-row">
              <label>一键套装:</label>
              <select id="sel_combo">
                <option value="">自由搭配（未锁定）</option>
                ${ownedCombos.map((c) => {
                  const p = comboProgress(c, state.equipped);
                  return `<option value="${c.id}" ${lockedC?.id === c.id ? 'selected' : ''}>${escapeHtml(c.name)}（${p.total}/${p.total}）</option>`;
                }).join('')}
              </select>
            </div>` : ''}
          <div class="part-grid">
            ${slots.map(([cat, slot, label]) => `
              <div class="part-cell">
                <div class="pico">${icon(slot)}</div>
                <div style="flex:1">
                  <label>${label}${lockedSlots.has(slot) ? ' <span class="lock-pill">套装锁定</span>' : ''}</label>
                  <select id="sel_${slot}" ${lockedSlots.has(slot) ? 'disabled' : ''}>${options(cat, state.equipped[slot], slot)}</select>
                </div>
              </div>`).join('')}
          </div>
          <div class="shell-row" style="margin-top:12px">
            <div class="pico" style="width:46px;height:46px;display:grid;place-items:center;background:#cfcabc;border:1px solid var(--line)">${icon('shell')}</div>
            <label>更换车壳:${lockedSlots.has('shell') ? '<br><span class="lock-pill">套装锁定</span>' : ''}</label>
            <select id="sel_shell" ${lockedSlots.has('shell') ? 'disabled' : ''}>${options('shells', state.equipped.shell, 'shell')}</select>
          </div>
          <div class="warn-line" id="warnLine"></div>
          <div class="stat-strip" style="margin-top:6px">
            <span>极速 <b>${st.ok ? Math.round(st.top) : '—'}</b> km/h</span>
            <span>0-100 <b>${st.ok ? (27.8 / st.accel).toFixed(1) : '—'}</b> s</span>
            <span>技能 <b>${noMods ? '禁用（改装禁令）' : st.shell && st.shell.ability ? ABILITIES[st.shell.ability].name : '无'}</b></span>
          </div>
          ${setStatusBanner(state.equipped)}
          ${st.shell?.id === 's0_bmw_black' ? renderBmwPaintBox() : ''}
          <p class="hint" style="margin-top:8px">选发动机自动适配燃料，绿灯亮起后${HOLD_HINT}加速</p>
          <div style="display:flex;gap:10px;margin-top:10px">
            <button class="btn" id="goShop">去商店</button>
            <button class="btn primary" id="goRace">开始比赛</button>
          </div>
        </div>
      </div>
      <div class="preview">
        <div class="preview-stage" id="factoryStage"></div>
        <div class="preview-name">${st.shell ? st.shell.name : '还没有车壳'}</div>
        <div class="desc">${st.shell ? (st.shell.id === 's0_bmw_black' ? escapeHtml(activeBmwPaint().desc) : st.shell.desc) : '去商店买一个车壳装上去。'}</div>
      </div>
    </div>`;

  const comboSel = $('#sel_combo');
  if (comboSel) {
    comboSel.addEventListener('change', (e) => {
      const cid = e.target.value || null;
      if (!cid) {
        state.lockedCombo = null;
        audio.blip(700, 0.04);
        save(); renderFactory();
        return;
      }
      const c = SET_COMBOS.find((x) => x.id === cid);
      if (!c) return;
      const s2c = { shell: 'shells', engine: 'engines', fuel: 'fuels', tire: 'tires', acc: 'accs' };
      for (const sl of ['shell', 'engine', 'fuel', 'tire', 'acc']) {
        if (!c[sl] && !c[sl + 's']) continue;
        const inv = inventoryOf(s2c[sl]);
        const ids = c[sl + 's'] || [c[sl]];
        const hit = ids.find((id) => inv.includes(id));
        if (hit) state.equipped[sl] = hit;
      }
      // Ensure equipped fuel matches combo engine automatically
      const engObj = state.equipped.engine ? find('engines', state.equipped.engine) : null;
      const fuelObj = state.equipped.fuel ? find('fuels', state.equipped.fuel) : null;
      if (engObj && (!fuelObj || fuelObj.type !== engObj.fuel)) {
        const bestFuel = bestCompatibleFuel(engObj.id);
        if (bestFuel) state.equipped.fuel = bestFuel;
      }
      state.lockedCombo = cid;
      audio.blip(980, 0.06);
      save(); renderFactory();
    });
  }

  for (const [cat, slot] of slots.concat([['shells', 'shell']])) {
    $(`#sel_${slot}`).addEventListener('change', (e) => {
      if (lockedSlots.has(slot)) return;
      state.equipped[slot] = e.target.value || null;
      if (slot === 'engine' && state.equipped.engine) {
        const engObj = find('engines', state.equipped.engine);
        const fuelObj = state.equipped.fuel ? find('fuels', state.equipped.fuel) : null;
        if (engObj && (!fuelObj || fuelObj.type !== engObj.fuel)) {
          const bestFuel = bestCompatibleFuel(engObj.id);
          if (bestFuel) state.equipped.fuel = bestFuel;
        }
      }
      save(); renderFactory();
    });
  }
  bindBmwPaint(renderFactory);
  $('#warnLine').textContent = validate().ok ? '' : validate().msg;
  $('#goShop').onclick = () => switchTab('shop');
  $('#goRace').onclick = () => tryStartRace(null);

  garage = new Garage($('#factoryStage'));
  garage.setSpec(shellSpec(st.shell));
}

// ---------- 存档迁移 ----------
const MOVED_IDS = { s7_maize_nuclear: 's8_maize_nuclear', s7_uranium: 's8_fusion' };
function normalizeStateIds() {
  let changed = false;
  for (const cat of Object.keys(SLOT_OF)) {
    const valid = new Set(SEASONS.flatMap((s) => listOf(s, cat).map((x) => x.id)));
    const cur = state.inventory[cat] || [];
    const mapped = [];
    for (const raw of cur) {
      const id = MOVED_IDS[raw] || raw;
      if (id !== raw) changed = true;
      if (valid.has(id)) mapped.push(id);
      else changed = true;
    }
    const seen = new Set();
    const next = [];
    for (const id of mapped) {
      const key = partKey(cat, find(cat, id));
      if (seen.has(key)) { changed = true; continue; }
      seen.add(key);
      next.push(id);
    }
    if (next.length !== cur.length) changed = true;
    state.inventory[cat] = next;
  }
  for (const [cat, slot] of Object.entries(SLOT_OF)) {
    const raw = state.equipped[slot];
    if (!raw) continue;
    const id = MOVED_IDS[raw] || raw;
    const inv = state.inventory[cat] || [];
    if (!inv.includes(id)) {
      const oldItem = find(cat, id);
      const alt = inv.map((x) => find(cat, x)).find((it) => it && partKey(cat, it) === partKey(cat, oldItem));
      state.equipped[slot] = alt ? alt.id : null;
      changed = true;
    } else if (id !== raw) {
      state.equipped[slot] = id;
      changed = true;
    }
  }
  if (changed) save();
}

// ---------- 关于 ----------
function renderAbout() {
  destroyGarage();
  $('#view').innerHTML = `
    <div class="about">
      <div class="cols">
        <div>
          <h2>汽车赛·世纪 <span class="dim" style="font-size:15px">RACE 2026</span></h2>
          <p>原版《汽车赛 II》V2.11 由玉米公司于 2001 年 3 月 11 日发布</p>
          <p>本作是它的非商业同人重置</p>
          <p class="dim">原版素材版权归原作者所有，仅作个人怀旧用途。</p>
          <hr />
          <p>操作：<br>绿灯亮起后${HOLD_HINT}全油加速<br>所有车壳技能自动按条件触发<br>抢跑 3 次 = 罚出 + 罚款 800 元</p>
          <p>进度会自动保存在浏览器 localStorage。</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px">
            <button class="btn" id="muteBtn">${audio.muted ? '打开声音' : '关闭声音'}</button>
            <button class="btn" id="resetBtn">重置存档</button>
          </div>
        </div>
        <div>
          <h2>制作与技术</h2>
          <p>three.js · Vite 8 · WebAudio · Zpix字体</p>
          <p>3D 车模由代码参数生成：车身剖面挤出 + 品牌前脸 Canvas 贴图。</p>
          <p>9 个赛季 × 6 场 = 54 场主线 + 每季 2 场可选杯赛 + 5 场终极主题杯赛</p>
          <hr />
          <p class="dim" id="secretCredit">原版下载：maizesoft.com/cms/race/</p>
        </div>
      </div>
    </div>`;
  $('#muteBtn').onclick = () => {
    audio.setMuted(!audio.muted);
    renderAbout();
  };
  let tapCount = 0;
  let tapTimer = 0;
  const secretEl = $('#secretCredit');
  if (secretEl) secretEl.onclick = () => {
    const now = performance.now();
    tapCount = (now - tapTimer < 1200) ? tapCount + 1 : 1;
    tapTimer = now;
    if (tapCount >= 7) {
      tapCount = 0;
      audio.blip(1040, 0.08);
      openDevConsole();
    }
  };
  $('#resetBtn').onclick = async () => {
    const i = await showModal({
      title: '重置存档',
      body: '<p>确定要清空所有进度，从 2001 年重新开始吗？</p>',
      actions: [{ label: '取消' }, { label: '确定重置' }],
    });
    if (i === 1) {
      localStorage.removeItem(SAVE_KEY);
      state = defaultState();
      initStandings();
      save(); updateChrome(); switchTab('info');
    }
  };
}

function openDevConsole() {
  const m = $('#modal');
  const unlockThrough = (maxSi, includeSecret = false) => {
    for (let si = 0; si <= maxSi && si < SEASONS.length; si++) {
      for (const cat of Object.keys(SLOT_OF)) {
        for (const it of listOf(SEASONS[si], cat)) {
          if (it.secret && !includeSecret) continue;
          if (!inventoryOf(cat).includes(it.id)) inventoryOf(cat).push(it.id);
        }
      }
    }
  };
  const render = () => {
    const cur = season();
    m.innerHTML = `
      <div class="modal-box" style="width:min(520px,94%)">
        <div class="titlebar">
          <span class="title">玉米测试控制台</span>
          <span class="winbtns"><b class="close">✕</b></span>
        </div>
        <div class="modal-body" style="font-size:14px;line-height:1.7;">
          <p style="margin-top:0">当前：<b>S${state.seasonIndex + 1}（${cur.years} ${cur.name}）</b> · 第 <b>${state.raceInSeason + 1}/${RACES_PER_SEASON}</b> 场 · 资产 <b>${Math.round(state.money)}</b> 元${state.freePlay ? ' · <b style="color:#1b6e35">自由探索已解锁</b>' : ''}</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0;">
            <button class="btn" id="devM1">+10,000 元</button>
            <button class="btn" id="devM2">+100,000 元</button>
            <button class="btn" id="devSkip">跳过本场（第 1 名）</button>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:10px 0;">
            <span>跳转赛季：</span>
            <select id="devSeasonSel" style="font-family:var(--mono);font-size:14px;padding:4px 6px;">
              ${SEASONS.map((s, i) => `<option value="${i}" ${i === state.seasonIndex ? 'selected' : ''}>S${i + 1} · ${s.years} ${s.name}</option>`).join('')}
            </select>
            <button class="btn" id="devJump">确认跳转</button>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0;">
            <button class="btn" id="devGearCur">解锁截至本季全配件</button>
            <button class="btn" id="devGearAll">解锁全部常规配件</button>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0;">
            <button class="btn" id="devFreePlay">开启 54 场自由探索（终极杯赛）</button>
            <button class="btn primary" id="devUlt">征服 5 终极杯 + 解锁核动力 II</button>
          </div>
        </div>
        <div class="modal-actions"><button class="btn ok" id="devClose">关闭</button></div>
      </div>`;
    const refresh = () => { save(); updateChrome(); render(); };
    m.querySelector('.close').onclick = m.querySelector('#devClose').onclick = () => {
      m.classList.add('hidden'); m.innerHTML = ''; switchTab(view);
    };
    m.querySelector('#devM1').onclick = () => { state.money += 10000; audio.play('money', 0.6); refresh(); };
    m.querySelector('#devM2').onclick = () => { state.money += 100000; audio.play('money', 0.6); refresh(); };
    m.querySelector('#devSkip').onclick = () => {
      m.classList.add('hidden'); m.innerHTML = '';
      const rows = [
        { car: { isPlayer: true }, name: state.teamName, model: '测试跳过', time: 0.01 },
        ...season().rivals.map((r) => ({ car: { isPlayer: false }, name: r.team, model: r.model, time: 0 })),
      ];
      finishRace({ place: 1, dq: false, time: 0.01, falseStarts: 0, danceBonus: false, rows, debug: true });
    };
    m.querySelector('#devJump').onclick = () => {
      const si = Number(m.querySelector('#devSeasonSel').value) || 0;
      state.seasonIndex = si;
      state.raceInSeason = 0;
      state.racesDone = si * RACES_PER_SEASON;
      state.freePlay = false;
      state.chinaRaces = 0;
      initStandings();
      audio.blip(780, 0.05);
      refresh();
    };
    m.querySelector('#devGearCur').onclick = () => { unlockThrough(state.seasonIndex, false); audio.blip(880, 0.06); refresh(); };
    m.querySelector('#devGearAll').onclick = () => { unlockThrough(SEASONS.length - 1, false); audio.blip(880, 0.06); refresh(); };
    m.querySelector('#devFreePlay').onclick = () => {
      state.seasonIndex = SEASONS.length - 1;
      state.raceInSeason = 0;
      state.racesDone = SEASONS.length * RACES_PER_SEASON;
      state.freePlay = true;
      initStandings();
      audio.blip(940, 0.07);
      refresh();
    };
    m.querySelector('#devUlt').onclick = () => {
      state.seasonIndex = SEASONS.length - 1;
      state.raceInSeason = 0;
      state.racesDone = SEASONS.length * RACES_PER_SEASON;
      state.freePlay = true;
      if (!state.cupStatus) state.cupStatus = {};
      for (const c of ENDGAME_CUPS) state.cupStatus[c.id] = { tries: 1, bestPlace: 1 };
      unlockThrough(SEASONS.length - 1, true);
      initStandings();
      audio.play('money', 0.8);
      refresh();
    };
  };
  m.classList.remove('hidden');
  render();
}

// ---------- 积分 ----------
function initStandings() {
  state.standings = {};
  state.standings[state.teamName] = 0;
  for (const r of season().rivals) state.standings[r.team] = 0;
}
function standingsTable() {
  const names = [state.teamName, ...season().rivals.map((r) => r.team)];
  return names.map((n) => ({ name: n, points: state.standings[n] ?? 0, me: n === state.teamName }))
    .sort((a, b) => b.points - a.points || (a.me ? -1 : 1));
}

// ---------- 杯赛赛前选配弹窗 ----------
function openCupSetupModal(cup) {
  if (race) return;
  const cs = state.cupStatus?.[cup.id] || { tries: 0, bestPlace: null, paid: false };
  if (!cup.unlimited && (cs.paid || cs.tries >= MAX_CUP_TRIES)) return;

  const legalList = (cat) => inventoryItems(cat).filter((it) => !partCupError(cup, cat, it));
  const shells = legalList('shells');
  const engines = legalList('engines');
  const tires = inventoryItems('tires');
  const accs = inventoryItems('accs');

  const pickInit = (list, curId) => (list.some((x) => x.id === curId) ? curId : (list[0]?.id || ''));
  const sel = {
    shell: pickInit(shells, state.equipped.shell),
    engine: pickInit(engines, state.equipped.engine),
    fuel: '',
    tire: pickInit(tires, state.equipped.tire),
    acc: pickInit(accs, state.equipped.acc),
  };

  const fuelsFor = (engId) => {
    const eng = engId ? find('engines', engId) : null;
    return legalList('fuels').filter((f) => !eng || f.type === eng.fuel);
  };
  sel.fuel = pickInit(fuelsFor(sel.engine), state.equipped.fuel);

  const m = $('#modal');
  const renderModal = () => {
    const curFuels = fuelsFor(sel.engine);
    if (!curFuels.some((f) => f.id === sel.fuel)) sel.fuel = curFuels[0]?.id || '';
    const st = buildStats(sel);
    const parts = { shell: st.shell, engine: st.engine, fuel: st.fuel, tire: st.tire };
    const err = cupRuleError(cup, parts);
    const noMods = !!cup.rule?.noMods;
    const abName = noMods ? '禁用' : st.shell?.ability ? ABILITIES[st.shell.ability].name : '无';

    const optHtml = (list, curId, emptyMsg) =>
      list.length
        ? list.map((it) => `<option value="${it.id}" ${it.id === curId ? 'selected' : ''}>${escapeHtml(it.name)}</option>`).join('')
        : `<option value="">${emptyMsg}</option>`;

    m.innerHTML = `
      <div class="modal-box" style="width:min(500px,92%)">
        <div class="titlebar">
          <span class="title">${escapeHtml(cup.name)}（${cup.dist}m · ${cup.unlimited ? `第 ${cs.tries + 1} 次挑战` : `第 ${cs.tries + 1}/${MAX_CUP_TRIES} 次`}）</span>
          <span class="winbtns"><b class="close">✕</b></span>
        </div>
        <div class="modal-body cup-modal-body">
          <p class="hint" style="margin-top:0">${cupRuleText(cup)}${cup.unlimited ? '' : ` ｜ 冠军奖 <b>${cup.prize}</b> 元`}${cs.bestPlace ? ` ｜ 历史最佳：第 ${cs.bestPlace} 名` : ''}</p>
          <div class="cup-sel-grid">
            <label>车壳</label><select id="cm_shell">${optHtml(shells, sel.shell, '(无可用车壳)')}</select>
            <label>引擎</label><select id="cm_engine">${optHtml(engines, sel.engine, '(无可用引擎)')}</select>
            <label>燃料</label><select id="cm_fuel">${optHtml(curFuels, sel.fuel, '(无匹配燃料)')}</select>
            <label>轮胎</label><select id="cm_tire">${optHtml(tires, sel.tire, '(无可用轮胎)')}</select>
            <label>配件</label><select id="cm_acc"><option value="">(无)</option>${accs.map((it) => `<option value="${it.id}" ${it.id === sel.acc ? 'selected' : ''}>${escapeHtml(it.name)}</option>`).join('')}</select>
          </div>
          <div class="stat-strip" style="margin:8px 0 4px">
            <span>极速 <b>${st.ok ? Math.round(st.top) : '—'}</b> km/h</span>
            <span>0-100 <b>${st.ok ? (27.8 / st.accel).toFixed(1) : '—'}</b> s</span>
            <span>技能 <b>${abName}</b></span>
          </div>
          ${err ? `<p class="rule-warn" style="margin:4px 0">${err}（请先去商店购买合乎规则的配件）</p>` : '<p class="hint" style="margin:4px 0">仅显示满足杯赛规则的已购库存 · 本次选配不影响主线装配。</p>'}
        </div>
        <div class="modal-actions">
          <button class="btn" id="cmCancel">取消</button>
          <button class="btn primary ok" id="cmGo" ${err ? 'disabled' : ''}>确认发车 &gt;&gt;</button>
        </div>
      </div>`;

    const bind = (id, key) => {
      m.querySelector(id).onchange = (e) => {
        sel[key] = e.target.value || '';
        audio.blip(750, 0.03);
        renderModal();
      };
    };
    bind('#cm_shell', 'shell');
    bind('#cm_engine', 'engine');
    bind('#cm_fuel', 'fuel');
    bind('#cm_tire', 'tire');
    bind('#cm_acc', 'acc');

    const closeModal = () => { m.classList.add('hidden'); m.innerHTML = ''; };
    m.querySelector('.close').onclick = closeModal;
    m.querySelector('#cmCancel').onclick = closeModal;
    m.querySelector('#cmGo').onclick = () => {
      if (err) return;
      closeModal();
      tryStartRace(cup, { ...sel });
    };
  };

  m.classList.remove('hidden');
  renderModal();
}

// ---------- 开始比赛 ----------
async function tryStartRace(cup = null, customEquipped = null) {
  if (race) return;
  const useEq = customEquipped || state.equipped;
  if (cup) {
    const cs = state.cupStatus?.[cup.id] || { tries: 0, paid: false };
    if (!cup.unlimited && (cs.paid || cs.tries >= MAX_CUP_TRIES)) return;
    const shell = useEq.shell ? find('shells', useEq.shell) : null;
    const engine = useEq.engine ? find('engines', useEq.engine) : null;
    const fuel = useEq.fuel ? find('fuels', useEq.fuel) : null;
    const tire = useEq.tire ? find('tires', useEq.tire) : null;
    const cupErr = cupRuleError(cup, { shell, engine, fuel, tire });
    if (cupErr) {
      await showModal({ title: '杯赛门槛', body: `<p>${cupErr}</p>` });
      return;
    }
  } else {
    const v = validate();
    if (!v.ok) {
      await showModal({ title: '工厂', body: `<p>${v.msg}</p><p class="hint">去商店买配件，然后在工厂装配。</p>` });
      return;
    }
  }
  const st = buildStats(useEq);
  await audio.init();
  audio.resume();
  if (Object.keys(state.standings).length === 0) initStandings();
  if (state.standings[state.teamName] == null) state.standings[state.teamName] = 0;

  const noMods = cup ? !!cup.rule?.noMods : !!season().rules?.noMods;
  const combo = matchSetCombo(useEq);
  const baseAbility = st.shell.ability && !noMods ? { ...ABILITIES[st.shell.ability] } : null;
  if (baseAbility && combo) {
    if (combo.hudName) baseAbility.name = combo.hudName;
    if (combo.hudDesc) baseAbility.desc = combo.hudDesc;
  }
  const build = {
    shell: st.shell.id === 's0_bmw_black' ? { ...st.shell, color: activeBmwPaint().color } : st.shell,
    top: st.top,
    accel: st.accel,
    comboId: combo?.id || null,
    comboName: combo?.name || null,
    roadsterFlip: combo?.id === 'roadsterFlip',
    u9xJump: combo?.id === 'u9xJump',
    evtolCruise: combo?.id === 'evtolCruise',
    xiaomiAero: combo?.id === 'xiaomiAero',
    maglevDash: combo?.id === 'maglevDash',
    backTo2001: combo?.id === 'backTo2001',
    ability: baseAbility,
  };
  switchTab('info');
  tabButtons.forEach((b) => (b.disabled = true));
  $('#startRace')?.classList.add('hidden');
  document.body.classList.add('racing');

  const raceIdx = state.raceInSeason;
  const aiTarget = cup ? cup.ai : (season().aiTargets?.[raceIdx] || null);
  race = new Race($('#view'), {
    season: season(),
    seasonIndex: state.seasonIndex,
    raceIdx,
    cup,
    equipped: { ...useEq },
    teamName: state.teamName,
    dist: cup ? cup.dist : (season().mainDist || MAIN_DIST),
    aiTarget,
    build,
    rivals: cup?.rivals || season().rivals,
    award: (result) => awardFor(result),
    onFinish: (result) => finishRace(result),
    onWarp2001: () => launchBackTo2001(),
  });
  audio.stopBgm();
}

function awardFor(result) {
  const eq = result.equipped || state.equipped;
  const fuelPart = eq.fuel ? find('fuels', eq.fuel) : null;
  const ecoBonus = !result.dq && fuelPart?.ecoBonus ? fuelPart.ecoBonus : 0;
  const bonusFrac = result.prizeBonusFrac || (result.danceBonus ? 0.6 : 0);

  if (result.cup) {
    const cup = result.cup;
    const prev = state.cupStatus?.[cup.id] || { tries: 0, bestPlace: null, paid: false, bonusFrac: 0, ecoBonus: 0 };
    const nextTries = prev.tries + 1;
    const fine = result.dq ? 800 : 0;
    const bestPlace = result.dq
      ? prev.bestPlace
      : (prev.bestPlace ? Math.min(prev.bestPlace, result.place) : result.place);
    if (cup.unlimited) {
      return {
        prize: 0, points: 0, fine, ecoBonus: 0, bonus: 0,
        pending: false, settled: false, bestPlace: bestPlace || result.place, triesLeft: null,
        note: result.dq
          ? '抢跑三次：罚款 800 元（无限挑战可随时再战）'
          : result.place === 1
            ? '终极杯赛通关！'
            : `第 ${result.place} 名，再来一次！`,
      };
    }
    const bestBonusFrac = Math.max(prev.bonusFrac || 0, bonusFrac);
    const bestEco = Math.max(prev.ecoBonus || 0, ecoBonus);
    const settled = bestPlace === 1 || nextTries >= MAX_CUP_TRIES;

    if (!settled) {
      return {
        prize: 0, points: 0, fine, ecoBonus: 0, bonus: 0,
        pending: true, settled: false, bestPlace, triesLeft: MAX_CUP_TRIES - nextTries,
        note: result.dq
          ? `抢跑罚金 800 元，剩 ${MAX_CUP_TRIES - nextTries} 次机会`
          : `暂列最佳第 ${bestPlace} 名，夺冠或用完 2 次机会后统一发奖`,
      };
    }
    const base = bestPlace === 1
      ? cup.prize
      : bestPlace === 2
        ? Math.round(cup.prize * 0.35 / 10) * 10
        : bestPlace === 3
          ? Math.round(cup.prize * 0.18 / 10) * 10
          : 0;
    const skillBonus = bestBonusFrac && base > 0 ? Math.round(base * bestBonusFrac / 10) * 10 : 0;
    const cupEco = base > 0 ? bestEco : 0;
    const total = base + skillBonus + cupEco;
    const tag = bestPlace === 1 ? '冠军结清' : bestPlace ? `最终第 ${bestPlace} 名结清` : '未进前三';
    const partsNote = [
      tag,
      skillBonus ? `技能 +${skillBonus}` : '',
      cupEco ? `环保补贴 +${cupEco}` : '',
    ].filter(Boolean).join(' · ');
    return {
      prize: total, points: 0, fine, ecoBonus: cupEco, bonus: skillBonus,
      pending: false, settled: true, bestPlace: bestPlace || result.place, triesLeft: 0,
      nextBestBonusFrac: bestBonusFrac, nextBestEco: bestEco,
      note: partsNote,
    };
  }

  if (result.dq) return { prize: 0, points: 0, fine: 800, ecoBonus: 0, bonus: 0, note: '抢跑三次：罚款 800 元' };
  const place = result.place;
  const prize = Math.round((PRIZES[place - 1] || 0) * season().prizeMult / 10) * 10;
  const bonus = bonusFrac && prize > 0 ? Math.round(prize * bonusFrac / 10) * 10 : 0;
  const points = POINTS[place - 1] || 0;
  const partsNote = [
    bonus ? `技能 +${bonus}` : '',
    ecoBonus ? `环保补贴 +${ecoBonus}` : '',
  ].filter(Boolean).join(' · ');
  return { prize: prize + bonus + ecoBonus, points, bonus, ecoBonus, note: partsNote };
}

function finishRace(result) {
  document.body.classList.remove('racing');
  const award = awardFor(result);
  state.money += award.prize - (award.fine || 0);

  if (result.cup) {
    if (!state.cupStatus || typeof state.cupStatus !== 'object') state.cupStatus = {};
    const prev = state.cupStatus[result.cup.id] || { tries: 0, bestPlace: null, paid: false, bonusFrac: 0, ecoBonus: 0 };
    const eq = result.equipped || state.equipped;
    const fuelPart = eq.fuel ? find('fuels', eq.fuel) : null;
    const runEco = !result.dq && fuelPart?.ecoBonus ? fuelPart.ecoBonus : 0;
    const runBonus = result.prizeBonusFrac || (result.danceBonus ? 0.6 : 0);
    state.cupStatus[result.cup.id] = {
      tries: prev.tries + 1,
      bestPlace: result.dq ? prev.bestPlace : (prev.bestPlace ? Math.min(prev.bestPlace, result.place) : result.place),
      paid: !!award.settled,
      bonusFrac: Math.max(prev.bonusFrac || 0, runBonus),
      ecoBonus: Math.max(prev.ecoBonus || 0, runEco),
    };
  } else {
    state.standings[state.teamName] = (state.standings[state.teamName] || 0) + award.points;
    result.rows.forEach((row, i) => {
      if (row.car.isPlayer) return;
      state.standings[row.name] = (state.standings[row.name] || 0) + (POINTS[i] || 0);
    });
    state.history.push({ season: state.seasonIndex, race: state.raceInSeason, place: result.place, dq: result.dq });
    const chinaNeed = season().rules?.chinaRaces || 0;
    if (chinaNeed && !result.dq && (state.chinaRaces || 0) < chinaNeed) {
      const eng = find('engines', state.equipped.engine);
      if (eng && techLine(eng) === 'domestic') state.chinaRaces = (state.chinaRaces || 0) + 1;
    }
    state.racesDone++;
    state.raceInSeason++;
  }

  const r = race;
  race = null;
  if (r) r.dispose();
  save();

  if (state.money <= 0) {
    updateChrome();
    audio.startBgm();
    showModal({
      title: 'GAME OVER',
      body: `<p style="color:#a21d16">您的总资产已耗尽，强制退出游戏 (GAME OVER)</p><p class="hint">规则第 4 条：总资产 ≤ 0 时车队解散。从 2001 年重头再来吧！</p>`,
      actions: [{ label: '从 2001 年重来' }],
    }).then(() => {
      localStorage.removeItem(SAVE_KEY);
      state = defaultState();
      initStandings();
      save();
      switchTab('info');
    });
    return;
  }

  if (result.cup) {
    let unlockedNuclear2 = false;
    if (result.cup.ultimate && allUltimateConquered() && !inventoryOf('engines').includes('s8_maize_nuclear2')) {
      inventoryOf('engines').push('s8_maize_nuclear2');
      unlockedNuclear2 = true;
      save();
    }
    updateChrome();
    switchTab('info');
    showRaceAward(result, award).then(() => {
      if (unlockedNuclear2) {
        showModal({
          title: '终极引擎解锁！',
          body: `<p style="color:#1b6e35"><b>五大终极主题杯赛全部征服！</b></p>
            <p><b>「玉米公司核动力 II」</b>已加入你的工厂库存！</p>
            <p class="hint">将它装入磁浮时空胶囊或许会有意想不到的事发生</p>`,
          actions: [{ label: '去工厂装配！' }],
        });
      }
    });
    return;
  }

  if (state.freePlay) {
    state.raceInSeason = 0;
    save();
    updateChrome();
    switchTab('info');
    showRaceAward(result, award);
    return;
  }

  if (state.raceInSeason >= RACES_PER_SEASON) {
    endSeason();
    return;
  }
  if (state.racesDone >= SEASONS.length * RACES_PER_SEASON) {
    ending();
    return;
  }
  updateChrome();
  switchTab('info');
  showRaceAward(result, award);
}

function allUltimateConquered() {
  return ENDGAME_CUPS.every((c) => state.cupStatus?.[c.id]?.bestPlace === 1);
}

function launchBackTo2001() {
  tabButtons.forEach((b) => (b.disabled = true));
  $('#startRace')?.classList.add('hidden');
  document.body.classList.add('racing');
  race = new Retro2001Race($('#desktop'), {
    teamName: state.teamName,
    money: state.money,
    onComplete: async (res) => {
      race = null;
      document.body.classList.remove('racing');
      updateChrome();
      switchTab('info');
      audio.startBgm();
      if (res.aborted) return;
      if (res.won) {
        state.trueEnding = true;
        save();
        await showModal({
          title: '完全通关 — BACK TO 2001',
          body: `<p style="color:#1f7a34;font-size:17px"><b>你用时空胶囊在 2001 赛场跑出 ${res.time.toFixed(2)} s，超越原版 1.74 s 神话！</b></p>
            <p>从 2001 年的 4G63 出发，经历 9 个赛季 54 场正赛与五场终极主题杯赛，你终于带着「玉米公司核动力 II」跨越光速回到最初的原点并拿下冠军！</p>
            <p>总资产：<b>${Math.round(state.money)}</b> 元 ｜ 年度总冠军：<b>${state.championships}</b> 次</p>
            <p class="dim">《汽车赛·世纪 RACE 2026》完全通关！<br>以此致敬 1999–2001 年玉米公司原版《汽车赛 II》。</p>`,
          actions: [{ label: '载入史册' }],
        });
      } else {
        await showModal({
          title: '时空回溯中断 — 返回 2027',
          body: `<p style="color:#a21d16">${res.dq ? '2001 赛场抢跑三次，你被甩回了 2027 车库。' : `第 ${res.place} 名（${res.time.toFixed(2)} s）`}</p>
            <p class="hint">随时再次点击「开始主线赛 >>」并加速突破 1000 km/h，即可重新触发时空跃迁回到 2001 决战！</p>`,
          actions: [{ label: '回到车库再战' }],
        });
      }
    },
  });
}

function showRaceAward(result, award) {
  const placeText = result.dq ? '罚出' : `第 ${result.place} 名`;
  const timeText = result.debug ? '调试跳过' : `${result.time.toFixed(2)} 秒`;
  const chinaNeed = season().rules?.chinaRaces || 0;
  const moodLine = result.dq
    ? ''
    : result.place === 5
      ? '<p style="color:#8e3b16">Bad Luck！你得了第 5 名，下次一定要努力！</p>'
      : result.place === 1
        ? '<p style="color:#1b6e35">祝贺你！你得了第 1 名！</p>'
        : '';
  return showModal({
    title: result.cup ? `🏆 ${result.cup.name}` : '赛后结算',
    body: `${moodLine}
      <p>本场：<b>${placeText}</b>${result.dq ? '' : ` · ${timeText}`}</p>
      <p>${result.cup && award.pending
        ? `暂不发奖：<span class="hint">${award.note}</span>`
        : `奖金：<b>${award.prize}</b> 元${award.note ? ` <span class="hint">(${award.note})</span>` : ''}`}</p>
      <p>${result.cup ? '杯赛不计积分' : `积分：<b>${award.points}</b> 分`}</p>
      <p>总资产：<b class="${state.money <= 100 ? 'low' : ''}">${Math.round(state.money)}</b> 元</p>
      ${!result.cup && chinaNeed ? `<p>赞助进度：<b>${state.chinaRaces || 0} / ${chinaNeed}</b> 场自主发动机</p>` : ''}`,
    actions: [{ label: '继续' }],
  });
}

function endSeason() {
  const table = standingsTable();
  const champion = table[0];
  const isMe = champion.me;
  const chinaNeed = season().rules?.chinaRaces || 0;
  const chinaMiss = chinaNeed > 0 && (state.chinaRaces || 0) < chinaNeed;
  let bonus = 0;
  if (isMe) {
    state.championships++;
    if (!chinaMiss) {
      bonus = season().champBonus ?? Math.round(2000 * season().prizeMult / 10) * 10;
      state.money += bonus;
    }
  }
  const rows = table.map((t, i) => `<tr class="${t.me ? 'me' : ''}"><td>${i + 1}</td><td>${escapeHtml(t.name)}</td><td class="num">${t.points}</td></tr>`).join('');
  const lastSeason = state.seasonIndex >= SEASONS.length - 1;
  showModal({
    title: `${season().years} 赛季结束`,
    body: `<p>年度总冠军：<b>${escapeHtml(champion.name)}</b>${isMe ? (chinaMiss ? '　冠军奖金被赞助商取消' : `　车队奖金 +${bonus} 元`) : ''}</p>
      <table class="standings"><thead><tr><th>名次</th><th>车队</th><th class="num">积分</th></tr></thead><tbody>${rows}</tbody></table>
      ${chinaMiss ? `<p class="rule-warn">中石化赞助未达标：本赛季只有 ${state.chinaRaces || 0} / ${chinaNeed} 场使用国产/合资发动机，年度冠军奖金取消。</p>` : ''}
      ${isMe ? '<p class="hint">恭喜！下个赛季会有全新的配件与对手。</p>' : '<p class="hint">下个赛季再来。</p>'}`,
    actions: [{ label: lastSeason ? '进入终章' : '进入下一赛季' }],
  }).then(() => {
    if (lastSeason) {
      ending();
      return;
    }
    state.seasonIndex++;
    state.raceInSeason = 0;
    state.freePlay = false;
    state.chinaRaces = 0;
    initStandings();
    save(); updateChrome(); switchTab('info');
    const nextRule = seasonRuleText();
    showModal({
      title: `${season().years} ${season().name}`,
      body: `<p>${escapeHtml(season().story).replace(/\n/g, '<br>')}</p>${nextRule ? `<p class="season-rule"><b>本赛季特殊规则</b><br>${nextRule}</p>` : ''}<p class="hint">商店已上架本赛季的新配件，往季库存仍然保留。</p>`,
      actions: [{ label: '去看看' }],
    });
  });
}

function ending() {
  state.freePlay = true;
  state.chinaRaces = 0;
  save();
  showModal({
    title: '汽车赛·世纪 — 完',
    body: `<p>${SEASONS.length} 个赛季、${SEASONS.length * RACES_PER_SEASON} 场比赛。从 4G63 到磁浮聚变，从化油器到核动力 II，你带着车队走完了 27 年。</p>
      <p>总资产：<b>${Math.round(state.money)}</b> 元 ｜ 年度总冠军：<b>${state.championships}</b> 次</p>
      <p class="hint">自由比赛与 5 场「终极主题杯赛」已解锁：无限次零门槛冲榜（无奖金），须完美配装 + 0.5s 内起跑反应！</p>
      <p class="dim">感谢游玩。</p>`,
    actions: [{ label: '继续自由比赛' }],
  }).then(() => {
    state.raceInSeason = 0;
    state.seasonIndex = SEASONS.length - 1;
    initStandings();
    save(); updateChrome(); switchTab('info');
  });
}

// ---------- Tab ----------
function switchTab(tab) {
  if (race) return;
  view = tab;
  destroyGarage();
  if (tab === 'info') renderInfo();
  else if (tab === 'shop') renderShop();
  else if (tab === 'factory') renderFactory();
  else renderAbout();
  updateChrome();
  audio.startBgm();
}
tabButtons.forEach((b) => (b.onclick = () => { audio.blip(620, 0.03); switchTab(b.dataset.tab); }));

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const IS_DESKTOP_APP = location.hostname === 'race2026.app';
if (IS_DESKTOP_APP) {
  document.body.classList.add('desktop-app');
  const winCmd = (cmd) => fetch(`https://race2026.app/__win/${cmd}`, { cache: 'no-store' }).catch(() => {});
  const tb = document.querySelector('#app > .titlebar');
  const btns = tb?.querySelectorAll('.winbtns b');
  if (btns && btns.length >= 3) {
    btns[0].title = '最小化';
    btns[1].title = '最大化 / 还原';
    btns[2].title = '关闭';
    btns[0].onclick = () => winCmd('minimize');
    btns[1].onclick = () => winCmd('maximize');
    btns[2].onclick = () => winCmd('close');
  }
  if (tb) {
    let dragging = false;
    let moveInFlight = false;
    tb.addEventListener('dblclick', (e) => {
      if (e.target.closest('.winbtns')) return;
      winCmd('maximize');
    });
    tb.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('.winbtns')) return;
      dragging = true;
      tb.setPointerCapture(e.pointerId);
      winCmd('dragStart');
    });
    tb.addEventListener('pointermove', () => {
      if (!dragging || moveInFlight) return;
      moveInFlight = true;
      winCmd('dragMove').finally(() => { moveInFlight = false; });
    });
    const stopDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      if (tb.hasPointerCapture(e.pointerId)) tb.releasePointerCapture(e.pointerId);
      winCmd('dragEnd');
    };
    tb.addEventListener('pointerup', stopDrag);
    tb.addEventListener('pointercancel', stopDrag);
  }
}

// 窗口等比缩放
function scaleWin() {
  const el = document.querySelector('.win');
  if (!el) return;
  if (IS_MOBILE) {
    el.style.transform = 'none';
    return;
  }
  const s = IS_DESKTOP_APP
    ? Math.min(window.innerWidth / 1180, window.innerHeight / 780)
    : Math.min(window.innerWidth / 1204, window.innerHeight / 804, 1);
  el.style.transform = `translate(-50%, -50%) scale(${s})`;
}
if (IS_TOUCH) document.body.classList.add('touch');
if (IS_MOBILE) document.body.classList.add('mobile');
window.addEventListener('resize', scaleWin);
scaleWin();

// 首次交互初始化音频
const initAudioOnce = async () => {
  await audio.init();
  audio.resume();
  if (!audio.muted) audio.startBgm();
  window.removeEventListener('pointerdown', initAudioOnce);
  window.removeEventListener('keydown', initAudioOnce);
};
window.addEventListener('pointerdown', initAudioOnce);
window.addEventListener('keydown', initAudioOnce);

normalizeStateIds();
if (Object.keys(state.standings).length === 0) initStandings();
save();
updateChrome();
switchTab(view);

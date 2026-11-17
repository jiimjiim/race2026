// 汽车赛·世纪 — 数据层
// 2001-2024，三年一季共 8 季：每季 6 场 600m 主线 + 2 场可选杯赛（每场限报 2 次，完赛统一发奖，不计积分）。

export const MAIN_DIST = 600;
export const POINTS = [10, 6, 4, 0, 0];
export const PRIZES = [680, 480, 320, 180, 80];
export const RACES_PER_SEASON = 6;
export const START_MONEY = 1800;
export const MAX_CUP_TRIES = 2;

export const ABILITIES = {
  // 加速流（开局自动触发，不叠加极速）
  launch:    { name: '弹射起步',   type: 'launch',     mode: 'accel',      uses: 1, jumpFrac: 0.12,                                                  desc: '起步瞬间初速 +12%' },
  quattro:   { name: 'quattro 四驱', type: 'traction', mode: 'accel',      uses: 1, dur: 2.2, topMul: 1.0, accelMul: 1.48,                         desc: '2.2s 加速 +48%' },
  vtec:      { name: 'VTEC 高转',  type: 'highrpm',    mode: 'accel',      uses: 1, dur: 2.5, topMul: 1.0, accelMul: 1.36,                         desc: '2.5s 加速 +36%' },
  overboost: { name: '超增压',     type: 'overboost',  mode: 'accel',      uses: 1, dur: 2.5, topMul: 1.0, accelMul: 1.34,                         desc: '2.5s 加速 +34%' },
  tank:      { name: '四电机矢量', type: 'tank',       mode: 'accel',      uses: 1, dur: 2.4, topMul: 1.0, accelMul: 1.44,                         desc: '2.4s 加速 +44%' },
  dm:        { name: '混动直驱',   type: 'dm',         mode: 'accel',      uses: 1, dur: 2.5, topMul: 1.0, accelMul: 1.42,                         desc: '2.5s 加速 +42%' },
  wave:      { name: '乘风破浪',   type: 'wave',       mode: 'accel',      uses: 1, dur: 2.8, topMul: 1.0, accelMul: 1.40,                         desc: '2.8s 破浪加速 +40%' },
  // 挂机起舞（开局自动触发，2s 舞后爆射 + 奖金）
  dance:     { name: '云辇起舞',   type: 'dance',      mode: 'dance',      uses: 1, dur: 2.0, launchJumpFrac: 0.45, postTopMul: 1.10, postAccelMul: 1.48, postDur: 3.0, prizeBonus: 0.60, desc: '原地跳舞 2s 再爆射弹射！奖金 +60%' },
  // 极速流（达到极速上限后自动触发，不叠加加速）
  boost:     { name: '氮气加速',   type: 'boost',      mode: 'top',        uses: 1, dur: 2.6, topMul: 1.09, accelMul: 1.0,                         desc: '2.6s 极速上限 +9%' },
  drs:       { name: 'DRS 尾翼',   type: 'drs',        mode: 'top',        uses: 1, dur: 2.6, topMul: 1.09, accelMul: 1.0,                         desc: '2.6s 极速上限 +9%' },
  swap:      { name: '换电',       type: 'swap',       mode: 'top',        uses: 1, dur: 2.6, topMul: 1.09, accelMul: 1.0,                         desc: '极速换电 2.6s 上限 +9%' },
  auto:      { name: '智驾辅助',   type: 'auto',       mode: 'top',        uses: 1, dur: 2.6, topMul: 1.08, accelMul: 1.0,                         desc: '2.6s 智驾巡航极速 +8%' },
  blade:     { name: '刀片稳态',   type: 'blade',      mode: 'top',        uses: 1, dur: 2.6, topMul: 1.08, accelMul: 1.0,                         desc: '2.6s 极速上限 +8%' },
  ludicrous: { name: '狂暴模式',   type: 'blade',      mode: 'top',        uses: 1, dur: 2.6, topMul: 1.08, accelMul: 1.0,                         desc: '2.6s 极速上限 +8%' },
  plaid:     { name: 'Plaid 模式', type: 'plaid',      mode: 'top',        uses: 1, dur: 2.8, topMul: 1.10, accelMul: 1.0,                         desc: '2.8s Plaid 极速上限 +10%' },
  range:     { name: '增程直驱',   type: 'range',      mode: 'top',        uses: 1, dur: 2.8, topMul: 1.08, accelMul: 1.0,                         desc: '2.8s 极速上限 +8%' },
  // 起飞 / 磁浮（空中突破极速）
  fly:       { name: '冷气推进',   type: 'fly',        mode: 'fly',        uses: 1, dur: 2.2, topMul: 1.12, accelMul: 1.0,                         desc: '2.2s 腾空突破极速 +12%' },
  rocket:    { name: '火箭推进',   type: 'fly',        mode: 'fly',        uses: 1, dur: 2.2, topMul: 1.12, accelMul: 1.0,                         desc: '2.2s 腾空突破极速 +12%' },
  glide:     { name: '低空飞行',   type: 'fly',        mode: 'fly',        uses: 1, dur: 2.6, topMul: 1.14, accelMul: 1.0,                         desc: '低空巡航极速 +14%' },
  // 经济惩罚技能（真实降加速/降极速换取奖金，彻底杜绝白嫖）
  autumn:    { name: '顺路拉货',   type: 'cargo',      mode: 'econ_accel', uses: 1, dur: 3.5, topMul: 1.0, accelMul: 0.65, prizeBonus: 0.40,         desc: '3.5s 载货慢起步（加速 -35%），奖金 +40%' },
  chill:     { name: '沿街叫卖',   type: 'chill',      mode: 'econ_top',   uses: 1, dur: 3.2, topMul: 0.78, accelMul: 1.0, prizeBonus: 0.50,         desc: '3.2s 降速叫卖（极速 -22%），奖金 +50%' },
};

export const FUEL_LABEL = {
  diesel: '柴油', gas: '汽油', electric: '电池', nuclear: '核燃料',
};

export const SET_COMBOS = [
  {
    id: 'roadsterFlip',
    short: 'Roadster',
    name: 'Roadster 空中滚转套装',
    shell: 's7_roadster26',
    engine: 's7_roadster26',
    acc: 's7_coldgas',
    desc: '特斯拉 Roadster 2 + Roadster 电动推进器 + 冷气推进外挂：起飞完成 360° 空中翻滚，全段推进爆发极速 +32%！',
    hudName: '冷气推进',
    hudDesc: '3.4s 空中 360° 滚转极速 +32%·加速 +15%',
  },
  {
    id: 'u9xJump',
    short: '仰望U9X',
    name: '仰望云辇跃起弹射套装',
    shell: 's7_u9x',
    engine: 's7_yisifang',
    acc: 's7_vector',
    desc: '开局跳舞 2s 后自动全油驾驶并飞跃爆射（初速 +65%，奖金 +80%）！',
    hudName: '云辇起舞',
    hudDesc: '跳舞 2s 后自动弹射巡航，极速 +24%、奖金 +80%',
  },
  {
    id: 'evtolCruise',
    short: '小鹏汇天eVTOL',
    name: '小鹏汇天eVTOL 垂直巡航套装',
    shell: 's7_evtol',
    engine: 's7_xpeng_emotor',
    acc: 's7_vector',
    desc: '开局垂直拉起并全程高空巡航！',
    hudName: '垂直巡航',
    hudDesc: '全程高空巡航直至冲线，极速 +22%',
  },
  {
    id: 'xiaomiAero',
    short: '小米',
    name: '小米赛道气动套装',
    shells: ['s8_xiaomi_vision', 's7_su7ultra'],
    engine: 's7_xiaomi_v8s',
    acc: 's8_xiaomi_track',
    desc: '达极速后全车气动气流加压！',
    hudName: '赛道气动',
    hudDesc: '4.5s 车顶车底气流加压，极速 +22%',
  },
  {
    id: 'maglevDash',
    short: '磁悬浮',
    name: '超导磁浮突进套装',
    shell: 's8_maglev',
    engine: 's8_maize_nuclear',
    tire: 's8_magpad',
    acc: 's8_magchassis',
    desc: '开局起浮全程贴地飞行！',
    hudName: '超导磁浮',
    hudDesc: '全程磁浮贴地飞行，极速 +25%',
  },
  {
    id: 'backTo2001',
    secret: true,
    short: '回到2001',
    name: '回到 2001 时空套装',
    shell: 's8_maglev',
    engine: 's8_maize_nuclear2',
    tire: 's8_magpad',
    acc: 's8_magchassis',
    desc: '突破 1000 km/h 触发光速跃迁，重返 2001！',
    hudName: '时空跃迁',
    hudDesc: '加速突破 1000 km/h 将发生未知异象…',
  },
];

const COMBO_SLOTS = ['shell', 'engine', 'fuel', 'tire', 'acc'];
const SLOT_TO_CAT = { shell: 'shells', engine: 'engines', fuel: 'fuels', tire: 'tires', acc: 'accs' };
const CAT_TO_SLOT = { shells: 'shell', engines: 'engine', fuels: 'fuel', tires: 'tire', accs: 'acc' };

function comboMatchSlot(combo, slot, val) {
  if (!val) return false;
  const list = combo[slot + 's'];
  return list ? list.includes(val) : combo[slot] === val;
}

export function matchSetCombo(e) {
  if (!e) return null;
  return SET_COMBOS.find((c) => COMBO_SLOTS.every((sl) => (!c[sl] && !c[sl + 's']) || comboMatchSlot(c, sl, e[sl]))) || null;
}

export function comboProgress(combo, equipped = {}) {
  const slots = COMBO_SLOTS.filter((sl) => combo[sl] || combo[sl + 's']);
  const pieces = slots.map((sl) => {
    const ids = combo[sl + 's'] || [combo[sl]];
    const cat = SLOT_TO_CAT[sl];
    const items = ids.map((id) => {
      for (const s of SEASONS) {
        const hit = s[cat].find((x) => `s${SEASONS.indexOf(s)}_${x.id}` === id || x.id === id);
        if (hit) return hit.name;
      }
      return id;
    });
    const done = comboMatchSlot(combo, sl, equipped[sl]);
    return { slot: sl, label: items.join(' / '), done };
  });
  const equippedCount = pieces.filter((p) => p.done).length;
  return { combo, equippedCount, total: slots.length, active: equippedCount === slots.length, pieces };
}

export function itemCombos(cat, itemId, equipped = {}) {
  const slot = CAT_TO_SLOT[cat];
  if (!slot) return [];
  return SET_COMBOS
    .filter((c) => !c.secret && comboMatchSlot(c, slot, itemId))
    .map((c) => comboProgress(c, equipped));
}

export const EXOTIC_BODIES = new Set(['plane', 'truck', 'truckcab', 'icecream', 'hover', 'maglev', 'rocket', 'bus']);
export const LINE_LABEL = { domestic: '国产/合资', imported: '进口', exotic: '神奇科技' };

export const BMW_PAINTS = [
  { id: 'black',  name: '黑色',   color: '#1c1e22', price: 0,  desc: '宝马公司新作，黑色象征着富贵。' },
  { id: 'blue',   name: '蓝色',   color: '#1f4e9c', price: 20, desc: '只是换了一种颜色。' },
  { id: 'green',  name: '绿色',   color: '#2d6e3f', price: 20, desc: '绿色给人大自然的感觉。' },
  { id: 'orange', name: '橙黄色', color: '#e87a1c', price: 20, desc: '橙黄色接近黄色。' },
  { id: 'purple', name: '紫色',   color: '#6a329f', price: 20, desc: '紫色象征着豪华。' },
  { id: 'white',  name: '白色',   color: '#ecebe3', price: 20, desc: '车壳只是好看，没有其它用处。' },
  { id: 'yellow', name: '黄色',   color: '#e2c62f', price: 20, desc: '希望不会招来蚊虫。' },
  { id: 'red',    name: '红色',   color: '#c01f1a', price: 20, desc: '红色只是为了看起来更像超跑。' },
];

const eng = (id, name, fuel, top, accel, price, line, unlock, disp, desc, opts = {}) => ({
  id, name, fuel, top, accel, price, line, unlock, disp, desc, ...opts,
});
const fuel = (id, name, type, topBonus, accelBonus, price, unlock, desc, opts = {}) => ({
  id, name, type, topBonus, accelBonus, price, unlock, desc, ...opts,
});
const tire = (id, name, accelBonus, price, unlock, desc) => ({
  id, name, accelBonus, price, unlock, desc,
});
const acc = (id, name, accelBonus, topBonus, price, unlock, desc) => ({
  id, name, accelBonus, topBonus, price, unlock, desc,
});
const shell = (id, name, price, line, body, grille, color, accent, weight, drag, ability, unlock, desc, wing = false) => ({
  id, name, price, line, body, grille, color, accent, weight, drag, ability, unlock, desc, wing,
});
const rival = (team, model, body, grille, color, top, accel, ability = 'boost') => ({
  team, model, body, grille, color, top, accel, ability,
});

const DOMESTIC_KEYS = ['三菱', '航天三菱', '东安', '华晨', '奇瑞', '吉利', '比亚迪', '长城', '上汽', '广汽', '长安', '蔚来', '小鹏', '理想', '极氪', '小米', '仰望', '五菱', '云内', '领克', '荣威', '大众', '通用', '别克'];
const EXOTIC_FUELS = new Set(['nuclear']);

export function techLine(item) {
  if (!item) return 'imported';
  if (item.line) return item.line;
  if (item.fuel && EXOTIC_FUELS.has(item.fuel)) return 'exotic';
  if (item.type && EXOTIC_FUELS.has(item.type)) return 'exotic';
  if (EXOTIC_BODIES.has(item.body)) return 'exotic';
  if (/核动力|铀|飞机|eVTOL|冷气|航发|冰淇淋|气垫|巴士|卡车/.test(item.name || '')) return 'exotic';
  if (DOMESTIC_KEYS.some((k) => (item.name || '').includes(k))) return 'domestic';
  return 'imported';
}

export function cupRuleText(cup) {
  const r = cup?.rule;
  if (!r) return '无限制';
  const parts = [];
  if (r.line === 'domestic') parts.push('国产/合资引擎');
  if (r.shellLine === 'domestic') parts.push('国产车壳');
  if (r.fuel) parts.push(`限${FUEL_LABEL[r.fuel] || r.fuel}`);
  if (r.hybridOnly) parts.push('限混动引擎');
  if (r.noHybrid) parts.push('禁混动');
  if (r.aero) parts.push('限航空发动机');
  if (r.canFly) parts.push('需具备起飞能力');
  if (r.maxDisp != null) parts.push(`≤${r.maxDisp.toFixed(1)}L`);
  if (r.noEV) parts.push('禁纯电');
  if (r.onlyExotic) parts.push('奇趣载具');
  if (r.heavyFun) parts.push('巴士/SUV/货车/奇趣');
  if (r.noMods) parts.push('禁技能');
  return parts.join('·') || '无限制';
}

export function partCupError(cup, cat, it) {
  const r = cup?.rule;
  if (!r || !it) return '';
  if (cat === 'engines') {
    if (r.line && techLine(it) !== r.line) return `需${LINE_LABEL[r.line]}引擎`;
    if (r.fuel && it.fuel !== r.fuel) return `仅限${FUEL_LABEL[r.fuel]}`;
    if (r.hybridOnly && !it.isHybrid) return '仅限混动引擎';
    if (r.noHybrid && it.isHybrid) return '禁止混动引擎';
    if (r.aero && !it.isAero) return '仅限航空发动机';
    if (r.noEV && it.fuel === 'electric') return '禁止纯电';
    if (r.maxDisp != null && it.disp != null && it.disp > r.maxDisp + 0.001) return `限排 ${r.maxDisp.toFixed(1)}L`;
  } else if (cat === 'shells') {
    if (r.shellLine && techLine(it) !== r.shellLine) return `需${LINE_LABEL[r.shellLine]}车壳`;
    if (r.onlyExotic && !EXOTIC_BODIES.has(it.body)) return '仅限奇趣载具';
    if (r.canFly && (!it.ability || ABILITIES[it.ability]?.mode !== 'fly')) return '需能起飞/飞行车壳';
    if (r.heavyFun && !['bus', 'suv', 'truck', 'truckcab', 'icecream', 'hover', 'micro'].includes(it.body)) return '需巴士/SUV/货车';
  } else if (cat === 'fuels') {
    if (r.fuel && it.type !== r.fuel) return `仅限${FUEL_LABEL[r.fuel]}`;
    if (r.noEV && it.type === 'electric') return '禁止纯电';
  }
  return '';
}

export function cupRuleError(cup, parts) {
  const r = cup?.rule;
  const { shell: sh, engine: engPart, fuel: fuelPart, tire: tirePart } = parts;
  if (!sh || !engPart || !fuelPart || !tirePart) return '先选齐车壳、引擎、燃料和轮胎';
  if (engPart.fuel !== fuelPart.type) {
    return `${engPart.name}需搭配${FUEL_LABEL[engPart.fuel] || engPart.fuel}`;
  }
  if (!r) return '';
  return partCupError(cup, 'engines', engPart)
    || partCupError(cup, 'shells', sh)
    || partCupError(cup, 'fuels', fuelPart);
}

export const SEASONS = [
  // ───────────────────────── 0: 2001-2003 ─────────────────────────
  {
    years: '2001-2003', name: '草创年代', mainDist: 350, prizeMult: 1.0, champBonus: 1100,
    story: '合资车横扫街头的年代，你的草台班子刚凑齐四个轮子准备出发。',
    rules: null,
    news: [
      '科学家总结出真理：汽车没有轮胎不能行驶。',
      '沈阳航天三菱 4G63，养活了半个中国自主品牌。',
      '玉米公司宣布：只要总资产高于 0 元，绝不赶你走！',
      '宝马新作上市，黑色依然象征着富贵。',
      '商店老板友情提示：没钱就赶快滚，先去跑比赛！',
      '赛会宣布：本赛季起采用五灯发车制。',
    ],
    aiTargets: [
      { top: 175, accel: 4.3 },
      { top: 186, accel: 4.8 },
      { top: 196, accel: 5.3 },
      { top: 208, accel: 5.8 },
      { top: 218, accel: 6.2 },
      { top: 226, accel: 6.6 },
    ],
    engines: [
      eng('yunnei4100', '云内 4100QB 柴油', 'diesel', 152, 3.8, 180, 'domestic', 0, 3.6, '拖拉机同款低扭，便宜耐操。'),
      eng('4g63',       '航天三菱 4G63 2.0','gas',    174, 4.3, 280, 'domestic', 0, 2.0, '初代自主品牌共用心脏。'),
      eng('huachen18',  '华晨/三菱 1.8',    'gas',    188, 5.0, 420, 'domestic', 1, 1.8, '合资授权技术，起步很冲。'),
      eng('m54',        '宝马 M54B30',      'gas',    212, 4.7, 760, 'imported', 3, 3.0, '进口直六，双肾格栅的底气。'),
    ],
    fuels: [
      fuel('diesel', '普通柴油',  'diesel', 0.00, 0.08, 120, 0, '便宜大碗，拖拉机都喝得惯。'),
      fuel('gas90',  '90 号汽油', 'gas',    0.05, 0.04, 190, 0, '早期标准无铅汽油。'),
      fuel('gas93',  '93 号汽油', 'gas',    0.08, 0.07, 250, 1, '高辛烷值街车最爱。'),
    ],
    tires: [
      tire('wood',   '木头车轮',   0.00, 100, 0, '科学家说有轮就能跑，就是硌得慌。'),
      tire('rubber', '橡胶光面胎', 0.08, 180, 0, '终于像个现代汽车的轮子了。'),
      tire('radial', '子午线轮胎', 0.14, 260, 2, '钢丝帘线结构，性价比之选。'),
    ],
    accs: [
      acc('oil',   '原厂润滑油', 0.05, 0.02, 180, 0, '顺便消掉一点发动机异响。'),
      acc('water', '水箱降温扇', 0.03, 0.04, 250, 2, '后半段不至于开锅。'),
    ],
    shells: [
      shell('bmw_black', '宝马黑色车壳',     160, 'imported', 'sedan',    'kidney', '#1c1e22', '#c9ccd2', 1.00, 0.032, null,     0, '宝马公司新作，黑色象征着富贵。', false),
      shell('fengyun',   '奇瑞风云车壳',     210, 'domestic', 'sedan',    'slats',  '#3a5e8c', '#d8d8d0', 0.98, 0.028, null,     0, '国民第一辆三厢家轿。', false),
      shell('truck',     '福特重型卡车头',   270, 'exotic',   'truckcab', 'mesh',   '#24479a', '#e8e6df', 1.16, 0.065, 'autumn', 2, '六个轮子，有点像擎天柱。', false),
      shell('supra',     '丰田 Supra 车壳',  340, 'imported', 'coupe',    'oval',   '#b3221d', '#f0efe9', 0.94, 0.015, 'boost',  3, '经典东瀛日系原装进口跑车。', true),
    ],
    rivals: [
      rival('丰田车队', 'Supra A80',     'coupe', 'oval', '#b3221d', 200, 5.0, 'launch'),
      rival('富士车队', 'Impreza 22B',   'sedan', 'oval', '#24479a', 195, 4.8, 'drs'),
      rival('三菱车队', 'Lancer EVO VI', 'sedan', 'mesh', '#e8e6df', 205, 5.2, 'boost'),
      rival('法拉利车队', '360 Modena',  'super', 'oval', '#c01f1a', 235, 6.4, 'overboost'),
    ],
    cups: [
      {
        id: 'c0_dom', name: '国产动力挑战杯', dist: 450, rule: { line: 'domestic' }, prize: 800,
        ai: { top: 205, accel: 5.5 },
        rivals: [
          rival('奇瑞车队', '风云',     'sedan', 'slats', '#3a5e8c', 188, 4.9, 'boost'),
          rival('哈飞车队', '赛马',     'wagon', 'slats', '#b8bcc0', 182, 4.7, 'drs'),
          rival('一汽夏利', '夏利2000', 'sedan', 'oval',  '#b3221d', 178, 4.6, 'auto'),
          rival('东南车队', '菱帅',     'sedan', 'mesh',  '#ecebe3', 194, 5.2, 'launch'),
        ],
      },
      { id: 'c0_hi', name: '京广直道耐力杯', dist: 1400, rule: null, prize: 900, ai: { top: 230, accel: 5.4 } },
    ],
  },

  // ───────────────────────── 1: 2004-2006 ─────────────────────────
  {
    years: '2004-2006', name: '家轿时代', mainDist: 420, prizeMult: 1.15, champBonus: 1400,
    story: '奇瑞 QQ 拉低了有车门槛。\n中石化赞助：至少两场使用国产/合资引擎。',
    rules: { chinaRaces: 2 },
    news: [
      '有传闻说一边看《还珠格格》一边开车一定会拿第一。',
      '油价飞涨，有人往油箱里倒了瓶贵州茅台。',
      '华晨中华聘乔治亚罗操刀，自主涡轮首秀。',
      '环保专家提示：乙醇汽油热量略低，好在能领补贴。',
      '中石化冠名：至少两场请支持自主发动机！',
      '夏天真热，冰激淋车也来凑热闹了。',
    ],
    aiTargets: [
      { top: 232, accel: 6.8 },
      { top: 242, accel: 7.4 },
      { top: 252, accel: 8.0 },
      { top: 262, accel: 8.6 },
      { top: 270, accel: 9.2 },
      { top: 280, accel: 9.8 },
    ],
    engines: [
      eng('qr480', '奇瑞 QR480 1.6',  'gas', 198, 5.4, 500,  'domestic', 0, 1.6, '皮实自主机，轻松过赞助。'),
      eng('bl18t', '华晨 BL18T 1.8T', 'gas', 222, 6.1, 740,  'domestic', 1, 1.8, '首批自主涡轮，前段很稳。'),
      eng('s54',   '宝马 S54B32',     'gas', 244, 6.0, 1180, 'imported', 3, 3.2, '万转直六，耐力杯利器。'),
    ],
    fuels: [
      fuel('ethanol', '乙醇汽油 E10', 'gas', 0.05, 0.07, 300, 0, '热值略低更环保；正赛补贴 +60 元。', { eco: true, ecoBonus: 60 }),
      fuel('gas95',   '95 号汽油',    'gas', 0.08, 0.09, 360, 0, '纯正高标号无铅汽油。'),
      fuel('maotai',  '贵州茅台',     'gas', 0.11, 0.11, 460, 3, '好笑吗？油价飞涨，只能用这个了。'),
    ],
    tires: [
      tire('anti',      '防滑全天候胎', 0.19, 340, 0, '加宽排水纹，雨雪不愁。'),
      tire('semislick', '国产半热熔胎', 0.23, 430, 1, '自主性能胎性价比极高。'),
      tire('pilot',     '米其林 Pilot', 0.26, 540, 3, '进口抓地标杆。'),
    ],
    accs: [
      acc('intercooler', '高流量中冷器', 0.09, 0.03, 360, 0, '进气降温，加速更有劲。'),
      acc('spark',       '铱金火花塞',   0.05, 0.06, 440, 2, '高转点火干脆利落。'),
    ],
    shells: [
      shell('qq',       '奇瑞 QQ 车壳',     260, 'domestic', 'micro',    'oval', '#d9b626', '#1c1e22', 0.90, 0.048, 'autumn', 0, '街霸微车，短程灵活。', false),
      shell('zhonghua', '华晨中华 车壳',    420, 'domestic', 'sedan',    'slats','#b8bcc0', '#2b5cb0', 0.98, 0.022, 'launch', 1, '国民中级车，弹射顺滑。', false),
      shell('integra',  '本田 Integra DC2', 580, 'imported', 'coupe',    'oval', '#ecebe3', '#b3221d', 0.91, 0.014, 'vtec',   2, '9000 转红头高转区爆发！', true),
      shell('a6',       '进口奥迪 A6 车壳', 660, 'imported', 'sedan',    'slats','#2a2f36', '#d8dce2', 1.00, 0.017, 'quattro',3, '高规进口四驱，起步狠。', false),
      shell('icecream', '冰激淋花车',       490, 'exotic',   'icecream', 'none', '#f2b6c6', '#8de0ff', 1.14, 0.058, 'chill',  2, '夏天真热，来一车冰激淋吧。', false),
    ],
    rivals: [
      rival('丰田车队', 'Celica',         'coupe', 'oval',   '#c9a227', 215, 5.4, 'boost'),
      rival('本田车队', 'Integra Type R', 'coupe', 'oval',   '#ecebe3', 220, 5.6, 'vtec'),
      rival('大众车队', 'Bora R',         'sedan', 'slats',  '#2b4d8a', 210, 5.2, 'drs'),
      rival('宝马车队', 'M3 E46',         'coupe', 'kidney', '#1c1e22', 240, 6.4, 'launch'),
    ],
    cups: [
      {
        id: 'c1_micro', name: '国民家轿 400m 短冲杯', dist: 400, rule: { shellLine: 'domestic' }, prize: 1050,
        ai: { top: 244, accel: 7.7 },
        rivals: [
          rival('奇瑞车队', 'QQ 运动版', 'micro', 'oval',  '#d9b626', 235, 7.5, 'autumn'),
          rival('华晨车队', '中华尊驰',  'sedan', 'slats', '#b8bcc0', 244, 7.7, 'launch'),
          rival('吉利车队', '美人豹',    'coupe', 'oval',  '#b3221d', 238, 7.4, 'boost'),
          rival('比亚迪队', 'F3',        'sedan', 'slats', '#e8e6df', 230, 7.2, 'auto'),
        ],
      },
      { id: 'c1_m', name: '环海公路 1500m 挑战杯', dist: 1500, rule: null, prize: 1150, ai: { top: 270, accel: 7.5 } },
    ],
  },

  // ───────────────────────── 2: 2007-2009 ─────────────────────────
  {
    years: '2007-2009', name: '涡轮前夜', mainDist: 500, prizeMult: 1.3, champBonus: 1750,
    story: '涡轮直喷悄然兴起。\n环保限排：只能使用 2.0L 及以下排量。',
    rules: { maxDisp: 2.0 },
    news: [
      '有人投诉现在的新闻越来越搞笑了；记得换胎。',
      '奇瑞 ACTECO 下线，自主发动机制造告别“拿来主义”。',
      'EA888 开启大众 2.0T 涡轮直喷时代。',
      '几顿饭饿着挤出来的金龙鱼色拉油，今天竟成了硬通货。',
      '环保红头通知：全赛季排量严格限制 ≤ 2.0L！',
      '2.0L 禁限公开杯解除排量封锁，大排量准备出山！',
    ],
    aiTargets: [
      { top: 266, accel: 9.2 },
      { top: 276, accel: 9.9 },
      { top: 286, accel: 10.6 },
      { top: 294, accel: 11.2 },
      { top: 302, accel: 11.8 },
      { top: 310, accel: 12.2 },
    ],
    engines: [
      eng('acteco18', '奇瑞 ACTECO 1.8',    'gas',    216, 6.2, 680,  'domestic', 0, 1.8, '100% 自主研发 1.8L 自吸。'),
      eng('gw20tc',   '长城 GW2.0TCI 柴油', 'diesel', 226, 7.1, 860,  'domestic', 0, 2.0, '限排内的柴油低扭怪物。'),
      eng('ea888',    '大众 EA888 2.0T',    'gas',    254, 7.2, 1280, 'domestic', 2, 2.0, '2.0L 限排下全能霸主。'),
      eng('n54',      '宝马 N54B30 双涡轮', 'gas',    278, 7.3, 1950, 'imported', 3, 3.0, '换上了双涡轮，性能更强但排量更低！'),
    ],
    fuels: [
      fuel('diesel3',   '国 III 清洁柴油', 'diesel', 0.05, 0.12, 420, 0, '清洁柴油；正赛环保补贴 +80 元。', { eco: true, ecoBonus: 80 }),
      fuel('jinlongyu', '金龙鱼大豆色拉油', 'diesel', 0.09, 0.19, 620, 2, '几顿饭饿着挤出来的，省着点用。'),
      fuel('m15',       'M15 甲醇汽油',    'gas',    0.09, 0.14, 540, 0, '甲醇混合燃料；正赛补贴 +80 元。', { eco: true, ecoBonus: 80 }),
      fuel('race100',   '100 号赛道汽油',  'gas',    0.13, 0.13, 720, 2, '纯净赛用高辛烷值汽油，热值最高。'),
    ],
    tires: [
      tire('street',  '街道运动胎',     0.26, 520, 0, '高刚性胎壁扛住涡轮扭矩。'),
      tire('direzza', '邓禄普 Direzza', 0.30, 680, 1, '街车刷圈名胎。'),
      tire('slick2',  '光头赛道胎',     0.33, 880, 3, '干地极佳抓地力。'),
    ],
    accs: [
      acc('turbo', '高增压涡轮套件', 0.12, 0.05, 620, 0, '中段推力瞬间填满。'),
      acc('wing',  '碳纤维大尾翼',   0.04, 0.08, 800, 2, '长直道高速稳得住。'),
    ],
    shells: [
      shell('f3',     '比亚迪 F3 车壳', 450,  'domestic', 'sedan', 'slats', '#dce0e2', '#1c1e22', 0.99, 0.025, null,        0, '皮实省钱国民家轿。', false),
      shell('ruihu',  '奇瑞瑞虎 SUV',   560,  'domestic', 'suv',   'slats', '#7a8288', '#d4d8dc', 1.08, 0.036, 'autumn',    1, '中国早期城市 SUV，顺路能拉货。', false),
      shell('zunchi', '华晨尊驰 车壳',  680,  'domestic', 'sedan', 'slats', '#2b323b', '#c9ccd2', 0.95, 0.019, 'overboost', 2, '看似商务，实则超增压。', false),
      shell('p911',   '保时捷 911 车壳',1050, 'imported', 'coupe', 'oval',  '#c01f1a', '#ecebe3', 0.89, 0.011, 'drs',       3, '经典蛙眼，风阻极低。', true),
    ],
    rivals: [
      rival('本田车队', 'Civic Type R EP3', 'hatch', 'mesh',   '#ecebe3', 240, 6.2, 'vtec'),
      rival('大众车队', 'Golf GTI MK5',     'hatch', 'slats',  '#b3221d', 230, 5.8, 'boost'),
      rival('宝马车队', 'M3 E46 CSL',       'coupe', 'kidney', '#3a3f45', 255, 6.8, 'launch'),
      rival('奇瑞车队', '瑞虎',             'suv',   'slats',  '#b8bcc0', 215, 5.6, 'drs'),
    ],
    cups: [
      {
        id: 'c2_diesel', name: '西部越野柴油杯', dist: 500, rule: { fuel: 'diesel' }, prize: 1700,
        ai: { top: 268, accel: 10.9 },
        rivals: [
          rival('长城越野', '哈弗 H3 柴油', 'suv',      'slats', '#7a8288', 256, 10.6, 'autumn'),
          rival('福特重卡', '擎天卡车头',   'truckcab', 'mesh',  '#24479a', 268, 10.9, 'overboost'),
          rival('江铃车队', '域虎皮卡',     'suv',      'slats', '#b3221d', 248, 10.1, 'boost'),
          rival('云内动力', '工程拉货车',   'truckcab', 'slats', '#4c6b38', 240, 9.8,  'range'),
        ],
      },
      { id: 'c2_open', name: '无限制 1600m 公开杯', dist: 1600, rule: null, prize: 1950, ai: { top: 316, accel: 10.8 } },
    ],
  },

  // ───────────────────────── 3: 2010-2012 ─────────────────────────
  {
    years: '2010-2012', name: '黄金十年', mainDist: 600, prizeMult: 1.5, champBonus: 2200,
    story: '超跑与战神正面对决！\n改装禁令：特殊车壳与全部技能失效。',
    rules: { noMods: true },
    news: [
      '新闻提供部门总罢工，今日停止播发新闻。',
      '今日没有新闻。',
      '车壳市场越来越不知道自己在干什么了。',
      '东瀛战神 GT-R R35 与 458 正面交锋。',
      '改装禁令：车壳技能暂锁，纯粹拼硬实力！',
      '奇葩载具整活杯专治各种正经超跑。',
    ],
    aiTargets: [
      { top: 294, accel: 11.9 },
      { top: 304, accel: 12.6 },
      { top: 314, accel: 13.4 },
      { top: 324, accel: 14.0 },
      { top: 334, accel: 14.7 },
      { top: 342, accel: 15.1 },
    ],
    engines: [
      eng('ecotec20', '通用 ECOTEC 2.0T',     'gas', 254, 7.8, 1450, 'domestic', 0, 2.0, '高性价比合资涡轮。'),
      eng('vr38',     '日产 VR38DETT 双涡轮', 'gas', 274, 8.8, 2500, 'imported', 2, 3.8, '战神，前段加速怪物！'),
      eng('f136',     '法拉利 F136 4.5 V8',   'gas', 302, 8.2, 3300, 'imported', 3, 4.5, '自然吸气极速王者（实测约 340 km/h）。'),
    ],
    fuels: [
      fuel('e85',    'E85 生物乙醇', 'gas', 0.10, 0.14, 860,  0, '生物乙醇；热值略低但正赛环保补贴 +120 元。', { eco: true, ecoBonus: 120 }),
      fuel('raceR1', '赛道燃油 R1',  'gas', 0.14, 0.17, 1080, 2, '纯正赛用高辛烷值铁桶油。'),
    ],
    tires: [
      tire('potenza',     '普利司通 Potenza', 0.35, 1250, 0, '超跑原配半热熔胎。'),
      tire('carbonwheel', '锻造碳纤轮毂',     0.41, 1650, 2, '轻量化簧下质量神器。'),
    ],
    accs: [
      acc('dct',    '双离合变速箱', 0.15, 0.05, 1050, 0, '毫秒换挡，几乎零动力中断。'),
      acc('ground', '地面效应套件', 0.06, 0.09, 1300, 2, '贴地文丘里效应，后段快人一截。'),
    ],
    shells: [
      shell('roewe750', '荣威 750 车壳', 480,  'domestic', 'sedan', 'slats',  '#3a424d', '#d8d0b8', 1.00, 0.024, null,     0, '雪茄车身国产落地。', false),
      shell('m3e92',    '宝马 M3 E92',   860,  'imported', 'coupe', 'kidney', '#ecebe3', '#1c1e22', 0.94, 0.015, 'launch', 1, '唯一自然吸气 V8 的 M3。', true),
      shell('gtr35',    '日产 GT-R R35', 1250, 'imported', 'coupe', 'mesh',   '#7a8086', '#c01f1a', 0.96, 0.012, 'quattro',2, '战神四驱，底盘硬功夫了得！', true),
      shell('hover',    '跨海气垫船壳',  1400, 'exotic',   'hover', 'none',   '#d9e2e6', '#2b5cb0', 1.05, 0.036, 'wave',   3, '一起乘风破浪。', false),
    ],
    rivals: [
      rival('大众车队', 'Golf R32', 'hatch', 'slats',  '#2b4d8a', 245, 6.0, 'launch'),
      rival('宝马车队', 'M3 E92',   'coupe', 'kidney', '#ecebe3', 270, 7.0, 'boost'),
      rival('奔驰车队', 'C63 AMG',  'sedan', 'slats',  '#1c1e22', 265, 6.8, 'drs'),
      rival('奥迪车队', 'RS6 C6',   'wagon', 'slats',  '#b8bcc0', 250, 6.2, 'overboost'),
    ],
    cups: [
      {
        id: 'c3_exotic', name: '奇葩载具整活杯', dist: 800, rule: { onlyExotic: true }, prize: 2600,
        ai: { top: 300, accel: 12.0 },
        rivals: [
          rival('水上竞速', '跨海气垫船',   'hover',    'none', '#d9e2e6', 298, 12.0, 'wave'),
          rival('消暑战队', '冰激淋花车',   'icecream', 'none', '#f2b6c6', 272, 11.2, 'chill'),
          rival('擎天重卡', '福特重型卡车', 'truckcab', 'mesh', '#24479a', 284, 11.4, 'autumn'),
          rival('巴士观光', '双层大巴',     'bus',      'none', '#c01f1a', 265, 10.6, 'boost'),
        ],
      },
      { id: 'c3_speed', name: 'F1 赛道 1800m 极速杯', dist: 1800, rule: null, prize: 3000, ai: { top: 344, accel: 14.5 } },
    ],
  },

  // ───────────────────────── 4: 2013-2015 ─────────────────────────
  {
    years: '2013-2015', name: '混动破局', mainDist: 700, prizeMult: 1.75, champBonus: 3000,
    story: '新能源补贴落地！\n本季只允许混动与纯电，老 V8 请留着打怀旧杯。',
    rules: { powertrains: ['electric', 'hybrid'] },
    news: [
      '车壳市场越来越不知道自己在干什么了，五菱都能飘移。',
      '比亚迪“秦”直接加常规汽油就能飙赢钢炮。',
      'Model S 悄悄进驻商店，没有排气管也让裁判看呆。',
      '如果您的资金太少，就不要抢跑；罚款 800 很肉疼！',
      '主线禁纯油车：只允许混动与纯电参赛（混动加汽油即可）。',
      '经典燃油怀旧杯开战：上季买的 V8 别浪费！',
    ],
    aiTargets: [
      { top: 316, accel: 14.6 },
      { top: 328, accel: 16.0 },
      { top: 340, accel: 17.4 },
      { top: 352, accel: 18.8 },
      { top: 365, accel: 20.2 },
      { top: 378, accel: 21.5 },
    ],
    engines: [
      eng('qin_dm', '比亚迪 秦 双模',    'gas',      260, 8.8,  1550, 'domestic', 0, 1.5, '插混引擎，百公里3L！吸金神器。', { isHybrid: true }),
      eng('i8',     '宝马 i8 混动',      'gas',      278, 9.4,  2300, 'imported', 1, 1.5, '近400匹的混动三缸机，中段很强！', { isHybrid: true }),
      eng('models', '特斯拉 Model S 电机','electric', 302, 10.5, 3600, 'imported', 3, 0,   '纯电单档零延迟推背感！'),
    ],
    fuels: [
      fuel('gas98',  '98 号直喷汽油',    'gas',      0.13, 0.21, 980,  0, '混动与燃油共用的高抗爆汽油。'),
      fuel('ev400a', '400V 3C 磷酸铁锂', 'electric', 0.12, 0.24, 1180, 1, '皮实耐充，正赛生态补贴 +120 元。', { eco: true, ecoBonus: 120 }),
      fuel('ev400b', '400V 5C 电容脉冲', 'electric', 0.14, 0.29, 1480, 3, '瞬时高倍率加速爆表！'),
    ],
    tires: [
      tire('domestic4', '国产高性能半热熔', 0.42, 1420, 0, '专门抗电车高扭矩。'),
      tire('pzero4',    '倍耐力 P Zero',    0.47, 1880, 2, '超跑同源街道半热熔。'),
    ],
    accs: [
      acc('bms4',      'BMS 温控套件', 0.13, 0.08, 1300, 0, '防止电池过热降频。'),
      acc('launchctl', '电控弹射程序', 0.20, 0.05, 1650, 2, '电车零延迟抓地弹射。'),
    ],
    shells: [
      shell('wuling', '五菱宏光神车壳', 320,  'domestic', 'micro', 'slats',  '#dce0e2', '#1c1e22', 0.94, 0.044, 'autumn', 0, '秋名山神车，顺路拉货挣外快。', false),
      shell('borui',  '吉利博瑞 车壳',  820,  'domestic', 'sedan', 'ripple', '#263038', '#d8d2be', 0.98, 0.017, 'range',  1, '水滴涟漪中网，持续加速稳。', false),
      shell('tang',   '比亚迪唐 车壳',  1150, 'domestic', 'suv',   'slats',  '#1c1e22', '#c01f1a', 1.02, 0.025, 'dm',     2, '插电混动四驱 SUV，混动直驱加速迅猛。', false),
      shell('p918',   '保时捷 918 车壳',2100, 'imported', 'super', 'oval',   '#c8ccd0', '#70e040', 0.89, 0.008, 'drs',    3, '混动神车，风阻极低。', true),
    ],
    rivals: [
      rival('宝马车队',  'i8',           'coupe', 'kidney', '#e2c62f', 290, 9.2, 'boost'),
      rival('奥迪车队',  'A3 e-tron',    'hatch', 'slats',  '#5a6068', 282, 8.9, 'drs'),
      rival('比亚迪车队','唐',           'suv',   'slats',  '#1c1e22', 288, 9.0, 'launch'),
      rival('特斯拉车队','Model S P85D', 'sedan', 'closed', '#c01f1a', 305, 9.8, 'range'),
    ],
    cups: [
      {
        id: 'c4_dom', name: '插混国货专场杯', dist: 600, rule: { line: 'domestic', shellLine: 'domestic', hybridOnly: true }, prize: 2800,
        ai: { top: 308, accel: 14.2 },
        rivals: [
          rival('比亚迪秦队', '秦 DM',    'sedan', 'slats',  '#1c1e22', 304, 14.0, 'launch'),
          rival('比亚迪唐队', '唐 DM',    'suv',   'slats',  '#c01f1a', 308, 14.2, 'dm'),
          rival('吉利车队',   '博瑞 PHEV','sedan', 'ripple', '#263038', 298, 13.5, 'range'),
          rival('上汽荣威',   'e550',     'sedan', 'slats',  '#3a5e8c', 292, 13.0, 'boost'),
        ],
      },
      {
        id: 'c4_v8', name: '经典燃油怀旧 1200m 杯', dist: 1200, rule: { fuel: 'gas', noHybrid: true }, prize: 3100,
        ai: { top: 338, accel: 14.5 },
        rivals: [
          rival('法拉利车队', '458 Italia', 'super', 'oval',   '#c01f1a', 340, 14.5, 'overboost'),
          rival('日产战神队', 'GT-R R35',   'coupe', 'mesh',   '#7a8086', 325, 14.8, 'quattro'),
          rival('宝马 M 系',  'M3 E92',     'coupe', 'kidney', '#ecebe3', 318, 13.8, 'launch'),
          rival('奔驰 AMG',   'C63 AMG',    'sedan', 'slats',  '#1c1e22', 315, 13.6, 'drs'),
        ],
      },
    ],
  },

  // ───────────────────────── 5: 2016-2018 ─────────────────────────
  {
    years: '2016-2018', name: '新势力', mainDist: 800, prizeMult: 2.0, champBonus: 3600,
    story: '新势力崛起，EP9 纽北刷圈。\n中石化赞助加码：至少三场用国产/合资引擎。',
    rules: { chinaRaces: 3 },
    news: [
      '蔚来 EP9 纽北刷圈，换电技术正式走上舞台。',
      '长安蓝鲸 2.0T 上线，自主高功率燃油终于成器。',
      '保安犹豫三分钟，还是放实验火箭车进了商店。',
      '中石化赞助要求加码：本季需跑满 3 场自主引擎！',
      '有人投诉现在的新闻越来越搞笑了，主编表示继续。',
      '纽北 1800m 长直道挑战赛即将开跑！',
    ],
    aiTargets: [
      { top: 330, accel: 16.8 },
      { top: 342, accel: 17.8 },
      { top: 354, accel: 18.8 },
      { top: 366, accel: 19.6 },
      { top: 376, accel: 20.4 },
      { top: 386, accel: 21.0 },
    ],
    engines: [
      eng('acteco20',    '奇瑞 ACTECO 2.0TGDI', 'gas', 278, 9.5,  2200, 'domestic', 0, 2.0, '国产涡轮机，完成赞助好帮手。'),
      eng('bluewhale20', '长安蓝鲸 2.0T',       'gas', 298, 10.2, 3100, 'domestic', 1, 2.0, '自主 2.0T 门面，兼顾赞助与加速。'),
      eng('m178',        '奔驰 M178 4.0T V8',   'gas', 326, 10.6, 4800, 'imported', 3, 4.0, 'Hot-V V8，纽北之星。'),
    ],
    fuels: [
      fuel('gas98e', '赛用 98 号清洁汽油', 'gas',      0.13, 0.21, 1300, 0, '清洁高抗爆油桶；正赛补贴 +150 元。', { eco: true, ecoBonus: 150 }),
      fuel('gas102', '102 号高辛烷值燃油', 'gas',      0.17, 0.25, 1750, 2, '纯粹赛用配方，压榨 V8 极速。'),
      fuel('ev500',  '500V 高压三元锂',    'electric', 0.16, 0.30, 1900, 1, '给上季留下的纯电方案续命。'),
    ],
    tires: [
      tire('linglong5', '玲珑半热熔胎',   0.48, 1750, 0, '国产胎性价比反超，省钱神胎。'),
      tire('trofeo',    '倍耐力 Trofeo R', 0.54, 2400, 2, '赛道日指定顶级半热熔。'),
    ],
    accs: [
      acc('carbon5', '碳纤维轻量化组件', 0.18, 0.06, 1700, 0, '减重最立竿见影。'),
      acc('actwing', '主动可调尾翼',     0.07, 0.11, 2200, 2, '高速切开空气，长直道神装。'),
    ],
    shells: [
      shell('fk2',    '思域 Type R FK2', 1100, 'imported', 'hatch',  'mesh',      '#ecebe3', '#c01f1a', 0.93, 0.015, 'vtec',  0, '前驱高转钢炮传奇。', true),
      shell('amggt',  '奔驰 AMG GT',     2000, 'imported', 'coupe',  'waterfall', '#5a6068', '#c01f1a', 0.92, 0.009, 'drs',   1, '长车头 V8 GT，直道极稳。', true),
      shell('ep9',    '蔚来 EP9 车壳',   2600, 'domestic', 'super',  'closed',    '#1f4e9c', '#e8e6df', 0.92, 0.008, 'swap',  2, '纯正中国电动超跑，三分钟换电。', true),
      shell('rocket', '实验火箭助推车',  2900, 'exotic',   'rocket', 'none',      '#ecebe3', '#d93829', 1.12, 0.040, 'rocket', 3, '又重风阻又大，好在真的能飞。', true),
    ],
    rivals: [
      rival('奔驰车队',  'AMG GT',        'coupe', 'waterfall', '#5a6068', 320, 8.8, 'drs'),
      rival('宝马车队',  'M4 GTS',        'coupe', 'kidney',    '#e8e6df', 315, 8.6, 'boost'),
      rival('特斯拉车队','Model S P100D', 'sedan', 'closed',    '#1c1e22', 325, 9.2, 'launch'),
      rival('蔚来车队',  'EP9',           'super', 'closed',    '#1f4e9c', 310, 8.8, 'swap'),
    ],
    cups: [
      {
        id: 'c5_sinopec', name: '中石化国产引擎杯', dist: 600, rule: { line: 'domestic' }, prize: 4200,
        ai: { top: 348, accel: 18.2 },
        rivals: [
          rival('蔚来超跑', 'EP9',       'super', 'closed', '#1f4e9c', 348, 18.2, 'swap'),
          rival('长安蓝鲸', 'CS95 蓝鲸', 'suv',   'slats',  '#3a424d', 332, 17.0, 'overboost'),
          rival('奇瑞性能', '艾瑞泽 GX', 'sedan', 'mesh',   '#b3221d', 325, 16.5, 'boost'),
          rival('领克车队', '领克 03',   'sedan', 'closed', '#e2c62f', 338, 17.6, 'drs'),
        ],
      },
      { id: 'c5_nur', name: '纽北长直道 1800m 杯', dist: 1800, rule: null, prize: 4600, ai: { top: 386, accel: 19.0 } },
    ],
  },

  // ───────────────────────── 6: 2019-2021 ─────────────────────────
  {
    years: '2019-2021', name: '电动浪潮', mainDist: 950, prizeMult: 2.3, champBonus: 5600,
    story: '小排量环保限排 ≤ 1.6L（纯电豁免）。\n双层巴士竟也通过了风洞初审。',
    rules: { maxDisp: 1.6, evExempt: true },
    news: [
      '车壳市场彻底放飞：双层巴士居然也办了赛照。',
      'DM-i 骁云彻底改写混动市场格局（照加常规汽油）。',
      '800V 刀片电池进驻商店。',
      '科学家预计：下赛季核动力驱动汽车将成为可能。',
      '主线环保限排 ≤ 1.6L，但纯电免检。',
      '1.6L 混动节油杯禁止纯电空降！',
    ],
    aiTargets: [
      { top: 354, accel: 19.6 },
      { top: 368, accel: 20.8 },
      { top: 382, accel: 22.0 },
      { top: 396, accel: 23.2 },
      { top: 408, accel: 24.4 },
      { top: 418, accel: 25.2 },
    ],
    engines: [
      eng('ne15',     '长安蓝鲸 NE 1.5T', 'gas',      296, 10.6, 2800, 'domestic', 0, 1.5, '小排量限排里的合算油机。'),
      eng('xiaoyun',  '比亚迪 骁云 1.5TI', 'gas',      322, 11.4, 4200, 'domestic', 1, 1.5, 'DM-i 高效混动机。', { isHybrid: true }),
      eng('tesla100', '特斯拉 P100D 电机', 'electric', 348, 12.2, 6200, 'imported', 3, 0,   '狂暴 800V 直推，身价也是两倍。'),
    ],
    fuels: [
      fuel('gas15',  '直喷高能汽油', 'gas',      0.16, 0.25, 1600, 0, '专为小排量高转与混动打造。'),
      fuel('e20',    '生物乙醇 E20 汽油', 'gas',      0.14, 0.22, 2000, 1, '低碳低热值汽油；正赛补贴 +200 元。', { eco: true, ecoBonus: 200 }),
      fuel('ev800a', '800V 8C 刀片电池',  'electric', 0.18, 0.34, 2500, 2, '高压高倍率刀片阵列，电驱最猛口粮。'),
    ],
    tires: [
      tire('senqi',    '森麒麟航空级胎', 0.54, 2200, 0, '国产航空胎技术下放，耐高速。'),
      tire('pilotcup', '米其林 Cup 2 R', 0.60, 3000, 2, '直线与赛道刷圈利器。'),
    ],
    accs: [
      acc('regen',    '动能回收加强包', 0.14, 0.08, 2200, 0, '混动/纯电全段加速补强。'),
      acc('supercap', '800V 超级电容组',0.21, 0.07, 2900, 2, '起跑电流瞬间打满！'),
    ],
    shells: [
      shell('bus',    '伦敦双层巴士壳',  950,  'exotic',   'bus',   'none',   '#c01f1a', '#e8e6df', 1.24, 0.085, 'autumn', 0, '可载 80 名乘客，还能顺路拉货。', false),
      shell('p7',     '小鹏 P7 车壳',    1950, 'domestic', 'sedan', 'closed', '#c01f1a', '#8ce8ff', 0.96, 0.014, 'auto',   1, '贯穿灯带，开启智驾加速！', false),
      shell('rs6',    '奥迪 RS6 Avant',  2800, 'imported', 'wagon', 'slats',  '#3a4046', '#c01f1a', 0.95, 0.013, 'quattro',2, '地表最强瓦罐，四驱起步凶。', false),
      shell('models', '特斯拉 Model S',  3200, 'imported', 'sedan', 'closed', '#b3221d', '#1c1e22', 0.93, 0.009, 'plaid',  3, 'Plaid 极速模式加持的极简低阻轿跑。', false),
    ],
    rivals: [
      rival('特斯拉车队','Model S P100D',  'sedan', 'closed', '#1c1e22', 340, 9.8, 'ludicrous'),
      rival('蔚来车队',  'ES8',            'suv',   'closed', '#1f4e9c', 325, 9.2, 'range'),
      rival('比亚迪车队','唐 DM',          'suv',   'slats',  '#1c1e22', 330, 9.4, 'blade'),
      rival('保时捷车队','Panamera Turbo', 'sedan', 'oval',   '#5a6068', 345, 9.9, 'boost'),
    ],
    cups: [
      {
        id: 'c6_hybrid', name: '1.6L 混动节油杯', dist: 600, rule: { maxDisp: 1.6, noEV: true }, prize: 5400,
        ai: { top: 378, accel: 22.0 },
        rivals: [
          rival('比亚迪车队', '汉 DM-i 1.5',  'sedan', 'slats', '#1c1e22', 376, 21.8, 'blade'),
          rival('长安蓝鲸',   'UNI-V 1.5T',   'sedan', 'mesh',  '#3a424d', 362, 20.8, 'boost'),
          rival('本田车队',   'Civic 1.5T',   'hatch', 'mesh',  '#ecebe3', 358, 20.5, 'vtec'),
          rival('吉利雷神',   '星瑞混动 1.5', 'sedan', 'ripple','#263038', 368, 21.2, 'range'),
        ],
      },
      {
        id: 'c6_bus', name: '街头奇葩车斗技杯', dist: 500, rule: { heavyFun: true }, prize: 5800,
        ai: { top: 320, accel: 17.6 },
        rivals: [
          rival('伦敦公交', '双层大巴',     'bus',      'none',  '#c01f1a', 316, 17.4, 'autumn'),
          rival('五菱之光', '五菱宏光神车', 'micro',    'slats', '#dce0e2', 320, 17.8, 'boost'),
          rival('奇瑞车队', '瑞虎 SUV',     'suv',      'slats', '#7a8288', 308, 16.8, 'drs'),
          rival('消暑战队', '冰激淋花车',   'icecream', 'none',  '#f2b6c6', 300, 16.2, 'chill'),
        ],
      },
    ],
  },

  // ───────────────────────── 7: 2022-2024 ─────────────────────────
  {
    years: '2022-2024', name: '破壁年代', mainDist: 1100, prizeMult: 3.0, champBonus: 7800,
    story: '电驱巅峰争鸣，仰望 U9X 突破 500 极速壁垒！',
    rules: null,
    news: [
      '仰望 U9X 成为人类首款真正在赛道突破 500 km/h 大关的量产超跑！',
      '四电机矢量控制与冷气推进外挂组正式列装高端车库！',
      '原厂工程师确认：本季四大电驱各有所长，全系皆可登顶！',
      '集齐 Roadster / 仰望U9X / 小鹏汇天eVTOL 专属三件套可激活特技！',
      '今日没有新闻，裁判去天上测飞行汽车了。',
      '双杯赛：国产电驱旗舰杯 & 低空飞行竞速杯！',
    ],
    aiTargets: [
      { top: 492, accel: 30.5 },
      { top: 506, accel: 32.0 },
      { top: 520, accel: 33.4 },
      { top: 534, accel: 34.8 },
      { top: 548, accel: 36.2 },
      { top: 560, accel: 37.5 },
    ],
    engines: [
      eng('yisifang',      '比亚迪 易四方 四电机',     'electric', 400, 13.6, 8600, 'domestic', 0, 0, '四电机独立控扭！配 U9X 套装即刻云辇起舞。'),
      eng('xpeng_emotor',  '小鹏汇天 碳化硅航空电驱',  'electric', 406, 13.0, 8400, 'domestic', 1, 0, '小鹏自研航空高功电驱，配小鹏汇天eVTOL 全程垂直巡航！'),
      eng('xiaomi_v8s',    '小米 超级电机 V8s',        'electric', 406, 13.5, 8800, 'domestic', 2, 0, '27,200 转极速电驱巅峰！配赛道套件激活气动狂飙。'),
      eng('roadster26',    'Roadster 电动推进器',      'electric', 402, 13.8, 9000, 'imported', 2, 0, '零延迟电驱加速怪！'),
    ],
    fuels: [
      fuel('ev1000',  '8C / 1000V 半固态',  'electric', 0.16, 0.30, 2600, 0, '千伏高压能量密度流。'),
      fuel('solid',   '10C / 1000V 全固态', 'electric', 0.15, 0.35, 3400, 2, '高安全全固态；正赛生态补贴 +240 元。', { eco: true, ecoBonus: 240 }),
    ],
    tires: [
      tire('carbonceramic', '碳陶轻量化轮毂', 0.60, 2800, 0, '轻到没有朋友。'),
      tire('f1s',           'F1 红标软胎',    0.64, 3300, 2, '只快第一圈。'),
      tire('graphene',      '石墨烯纳米胎',   0.68, 3800, 3, '500 km/h 专属抓地配方。'),
    ],
    accs: [
      acc('vector',  '四电机矢量控制', 0.22, 0.08, 3200, 1, '新时代电驱核心配件！'),
      acc('coldgas', '冷气推进外挂组', 0.18, 0.11, 4000, 3, '来自星舰的科技！'),
    ],
    shells: [
      shell('miniev',     '五菱宏光 MINI EV', 450,  'domestic', 'micro', 'closed', '#e08aa0', '#e8e6df', 0.86, 0.052, 'autumn', 0, '人民代步车也上高阶赛，顺路拉货挣外快。', false),
      shell('et9',        '蔚来 ET9 旗舰',    2400, 'domestic', 'sedan', 'closed', '#1c1e22', '#c9ccd2', 0.99, 0.015, 'swap',   1, '行政旗舰。', false),
      shell('su7ultra',   '小米 SU7 Ultra',   3400, 'domestic', 'sedan', 'closed', '#e2c62f', '#1c1e22', 0.90, 0.007, 'drs',    2, '碳纤四门超跑。', true),
      shell('u9x',        '仰望 U9X',         3800, 'domestic', 'super', 'closed', '#a6171f', '#ffd028', 0.89, 0.005, 'dance',  2, '实测突破 500km。', true),
      shell('roadster26', '特斯拉 Roadster 2',4400, 'imported', 'super', 'closed', '#c01f1a', '#1c1e22', 0.88, 0.005, 'fly',    3, 'elonmusk的火星车。', true),
      shell('evtol',      '小鹏汇天eVTOL',    4000, 'exotic',   'plane', 'none',   '#ecebe3', '#2b5cb0', 0.98, 0.012, 'glide',  2, '四旋翼飞行汽车。', false),
    ],
    rivals: [
      rival('仰望车队',  'U9X',        'super', 'vertical', '#a6171f', 460, 13.0, 'dance'),
      rival('小米车队',  'SU7 Ultra',  'sedan', 'closed',   '#e2c62f', 450, 13.2, 'drs'),
      rival('极氪车队',  '001 FR',     'wagon', 'closed',   '#1c1e22', 440, 12.8, 'blade'),
      rival('特斯拉车队','Roadster 2', 'super', 'closed',   '#c01f1a', 465, 13.5, 'overboost'),
    ],
    cups: [
      {
        id: 'c7_cn', name: '国产电驱旗舰杯', dist: 1100, rule: { line: 'domestic' }, prize: 9000,
        ai: { top: 492, accel: 31.6 },
        rivals: [
          rival('仰望车队', 'U9X',       'super', 'vertical', '#a6171f', 490, 31.4, 'dance'),
          rival('小米车队', 'SU7 Ultra', 'sedan', 'closed',   '#e2c62f', 488, 31.2, 'drs'),
          rival('极氪车队', '001 FR',    'wagon', 'closed',   '#1c1e22', 470, 30.0, 'blade'),
          rival('蔚来车队', 'ET9 赛道版', 'sedan','closed',   '#1f4e9c', 452, 28.8, 'swap'),
        ],
      },
      {
        id: 'c7_space', name: '低空飞行竞速杯', dist: 1800, rule: { canFly: true }, prize: 9000,
        ai: { top: 482, accel: 28.5 },
        rivals: [
          rival('小鹏汇天', '旅航者 X2', 'plane', 'none', '#ecebe3', 482, 28.4, 'glide'),
          rival('特斯拉',   'Roadster 2', 'super', 'closed', '#c01f1a', 478, 28.2, 'fly'),
          rival('亿航智能', 'EH216-S',   'plane', 'none', '#2b5cb0', 464, 27.2, 'glide'),
          rival('沃飞长空', 'AE200 电动', 'plane','none', '#e2c62f', 456, 26.8, 'fly'),
        ],
      },
    ],
  },

  // ───────────────────────── 8: 2025-2027 ─────────────────────────
  {
    years: '2025-2027', name: '智驾聚变', mainDist: 1300, prizeMult: 3.6, champBonus: 10000,
    story: '端到端智驾与可控微型核聚变下放民用！\n直道向 600 km/h 终极天花板进发。',
    rules: null,
    news: [
      '科学家再度修订教科书：超导磁悬浮已可无轮胎贴地 600 km/h 行驶。',
      '2001 原版“玉米公司核动力”重磅觉醒，搭载氘氚托卡马克聚变芯！',
      '蔚来 ET9 概念版与小米 Vision GT 展开未来概念竞速。',
      '大模型智驾接管直道微操！',
      '今日没有新闻，全部编辑都在围观磁悬浮实验胶囊突破 600 km/h。',
      '终章挑战：纯电智能耐力杯 & 2027 无限动力大满贯！',
    ],
    aiTargets: [
      { top: 582, accel: 39.0 },
      { top: 594, accel: 40.2 },
      { top: 606, accel: 41.3 },
      { top: 618, accel: 42.4 },
      { top: 630, accel: 43.5 },
      { top: 640, accel: 44.5 },
    ],
    engines: [
      eng('tourbillon_v16', '布加迪 Tourbillon V16 混动', 'gas',      448, 14.5, 11000, 'imported', 0, 8.3, '8.3L V16 万转自吸+三电机混动（直加汽油），终极内燃机！', { isHybrid: true }),
      eng('nio900',         '蔚来神玑 900V 三电机',        'electric', 454, 14.8, 11400, 'domestic', 0, 0,   '900V 碳化硅高压电驱，起跑零滑移。'),
      eng('byd30k',         '比亚迪 3万转电机', 'electric', 460, 14.6, 11800, 'domestic', 2, 0,   '30,511 转量产极限电驱！中后段狂暴平推。'),
      eng('maize_nuclear',  '玉米公司核动力',       'nuclear',  468, 15.0, 13200, 'exotic',   2, 0,   '来自2001！'),
      eng('maize_nuclear2', '玉米公司核动力 II',    'nuclear',  745, 28.0, 0,     'exotic',   99, 0,  '回到2001！', { secret: true }),
    ],
    fuels: [
      fuel('qcell',    '固态锂金属量子电池', 'electric', 0.20, 0.38, 4200, 0, '高安全低内阻量子固态；正赛补贴 +320 元。', { eco: true, ecoBonus: 320 }),
      fuel('megawatt', '1500V 架构超级电池组',   'electric', 0.22, 0.42, 4600, 2, '兆瓦瞬时大电流输出，极限加速最强！'),
      fuel('fusion',   '氘氚微型聚变芯',     'nuclear',  0.25, 0.44, 5200, 2, '核动力专属。'),
    ],
    tires: [
      tire('airless', '米其林 Uptis 免充气胎', 0.72, 4200, 0, '蜂窝免充气超弹结构，零爆胎风险。'),
      tire('magpad',  '超导磁悬浮滑靴',       0.78, 5000, 2, '彻底抛弃橡胶摩擦的科幻接触件。'),
    ],
    accs: [
      acc('xiaomi_track', '小米赛道套件',   0.24, 0.14, 4600, 0, '碳纤前铲+文丘里扩散器+大尾翼！'),
      acc('magchassis',   '磁悬浮主动底盘', 0.26, 0.16, 5400, 2, '超导磁浮，贴地飞行！'),
    ],
    shells: [
      shell('et9_s8',        '蔚来 ET9 概念版',     5200, 'domestic', 'sedan', 'closed', '#c8ccd2', '#1c1e22', 0.95, 0.010, 'swap',  0, '全域 900V 主动悬架旗舰。', false),
      shell('xiaomi_vision', '小米 Vision GT 概念', 6200, 'domestic', 'super', 'closed', '#1c2430', '#39d8ff', 0.87, 0.004, 'drs',   1, '0.004 极限风洞超跑。', true),
      shell('maglev',        '玉米磁浮时空胶囊',   6800, 'exotic',   'maglev', 'none', '#dceeff', '#39d8ff', 0.90, 0.006, 'glide', 2, 'Back-to-2001。', false),
    ],
    rivals: [
      rival('蔚来车队', 'ET9 概念版',     'sedan',  'closed',   '#c8ccd2', 525, 14.5, 'swap'),
      rival('小米概念', 'Vision GT',      'super',  'closed',   '#1c2430', 555, 14.8, 'drs'),
      rival('仰望纪念', 'U9X 典藏版',      'super',  'vertical', '#a6171f', 540, 14.6, 'dance'),
      rival('玉米实验', '磁浮时空胶囊',   'maglev', 'none',     '#dceeff', 575, 15.2, 'glide'),
    ],
    cups: [
      {
        id: 'c8_ai', name: '智驾纯电耐力杯', dist: 1600, rule: { fuel: 'electric' }, prize: 11000,
        ai: { top: 566, accel: 38.4 },
        rivals: [
          rival('蔚来换电队', 'ET9 概念版',   'sedan', 'closed',   '#c8ccd2', 554, 37.6, 'swap'),
          rival('小米概念队', 'Vision GT EV', 'super', 'closed',   '#1c2430', 566, 38.5, 'drs'),
          rival('仰望纪念队', 'U9X',          'super', 'vertical', '#a6171f', 560, 38.0, 'tank'),
          rival('比亚迪队',   '兆瓦原型车',   'sedan', 'closed',   '#5a1614', 548, 37.0, 'boost'),
        ],
      },
      {
        id: 'c8_nuclear', name: '2027 无限动力大满贯', dist: 2000, rule: null, prize: 12000,
        ai: { top: 572, accel: 38.8 },
        rivals: [
          rival('玉米聚变队', '磁浮胶囊 II',      'maglev', 'none',   '#dceeff', 572, 38.8, 'glide'),
          rival('小米概念队', 'Vision GT',        'super', 'closed', '#1c2430', 564, 38.2, 'drs'),
          rival('小鹏空天队', '超音速小鹏汇天eVTOL', 'plane', 'none', '#ecebe3', 556, 37.4, 'fly'),
          rival('特斯拉未来', 'Roadster X',       'super', 'closed', '#c01f1a', 560, 37.8, 'overboost'),
        ],
      },
    ],
  },
];

export const ENDGAME_CUPS = [
  {
    id: 'ult_gas', name: '终极·纯粹内燃机杯', dist: 1100, rule: { fuel: 'gas' }, prize: 0,
    ultimate: true, unlimited: true,
    ai: { top: 594, accel: 41.8 },
    rivals: [
      rival('内燃巅峰队', 'Vision V16 GT',    'super', 'closed', '#1c2430', 594, 41.8, 'drs'),
      rival('莫尔赛姆厂', 'Tourbillon 原型',  'super', 'closed', '#1f2b3a', 584, 40.8, 'boost'),
      rival('马拉内罗厂', 'V12 Le Mans',     'super', 'closed', '#b81d18', 572, 39.8, 'vtec'),
      rival('魏萨赫厂队', '911 GT1 Evo',     'super', 'closed', '#e5e2d8', 562, 38.8, 'launch'),
    ],
  },
  {
    id: 'ult_ev', name: '终极·极电狂飙杯', dist: 1200, rule: { fuel: 'electric' }, prize: 0,
    ultimate: true, unlimited: true,
    ai: { top: 632, accel: 45.8 },
    rivals: [
      rival('兆瓦极电队', 'Vision EV 三万转', 'super', 'closed', '#1c2430', 632, 45.8, 'plaid'),
      rival('帕洛阿尔托', 'Model S Plaid II', 'super', 'closed', '#c01f1a', 620, 44.6, 'plaid'),
      rival('蔚来科研队', 'ET9 900V 极速',    'sedan', 'closed', '#c8ccd2', 610, 43.6, 'swap'),
      rival('比亚迪工程', 'U9X 电驱试验',     'super', 'closed', '#a6171f', 602, 43.0, 'tank'),
    ],
  },
  {
    id: 'ult_nuclear', name: '终极·核聚变纪元杯', dist: 1300, rule: { fuel: 'nuclear' }, prize: 0,
    ultimate: true, unlimited: true,
    ai: { top: 692, accel: 50.4 },
    rivals: [
      rival('玉米聚变厂', '磁浮时空胶囊',    'maglev', 'none', '#dceeff', 692, 50.4, 'glide'),
      rival('超导实验室', 'Vision 聚变原型',  'super',  'closed', '#1c2430', 680, 49.2, 'drs'),
      rival('聚变推进队', 'Roadster 核改',   'super',  'closed', '#c01f1a', 670, 48.2, 'overboost'),
      rival('重水反应堆', 'ET9 核能概念',    'sedan',  'closed', '#3a4a5e', 660, 47.2, 'swap'),
    ],
  },
  {
    id: 'ult_fly', name: '终极·电动御风飞行杯', dist: 1200, rule: { canFly: true, fuel: 'electric' }, prize: 0,
    ultimate: true, unlimited: true,
    ai: { top: 598, accel: 42.8 },
    rivals: [
      rival('星舰电动队', 'Roadster 3万转',  'super',  'closed', '#c01f1a', 598, 42.8, 'fly'),
      rival('汇天领航队', '旅航者 X3',       'plane',  'none',   '#ecebe3', 588, 41.8, 'glide'),
      rival('低空竞速队', '磁浮电驱胶囊',    'maglev', 'none',   '#dceeff', 580, 41.0, 'glide'),
      rival('高空试验队', 'eVTOL 特调版',    'plane',  'none',   '#2c3442', 570, 40.2, 'fly'),
    ],
  },
  {
    id: 'ult_exotic', name: '终极·奇趣怪兽全明星', dist: 1200, rule: { onlyExotic: true }, prize: 0,
    ultimate: true, unlimited: true,
    ai: { top: 680, accel: 49.4 },
    rivals: [
      rival('玉米全明星', 'Back-to-2001',   'maglev', 'none',   '#dceeff', 680, 49.4, 'glide'),
      rival('破浪重工队', '聚变跨海气垫船',  'hover',  'none',   '#d96b27', 670, 48.4, 'wave'),
      rival('土星五号队', '聚变轨道火箭车',  'rocket', 'none',   '#f0efe8', 660, 47.4, 'rocket'),
      rival('低空母舰队', '汇天核能飞行器',  'plane',  'none',   '#ecebe3', 650, 46.6, 'glide'),
    ],
  },
];

const PART_CATS = ['engines', 'fuels', 'tires', 'accs', 'shells'];

SEASONS.forEach((s, si) => {
  const types = new Set(s.engines.map((e) => e.fuel));
  // 保留当季可用燃料（如 S7 Rotax 用往季汽油，这里不剔除汽油/电池等，只要当季有相应类型即可）
  s.fuels = s.fuels.filter((f) => types.has(f.type));

  for (const cat of PART_CATS) {
    s[cat] = s[cat].map((x) => ({ ...x, id: `s${si}_${x.id}` }));
  }
  for (const e of s.engines) {
    if (e.disp === undefined) e.disp = 0;
    e.line = techLine(e);
  }
  for (const sh of s.shells) sh.line = techLine(sh);
});

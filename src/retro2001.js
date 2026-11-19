import { audio } from './audio.js';
import { ORIG_ASSETS } from './orig2001_assets.js';

const IS_TOUCH = new URLSearchParams(location.search).has('android') || matchMedia('(pointer: coarse)').matches;
const RACE_HINT = IS_TOUCH ? '按住右下角「加速」冲线' : '按 ← 键向左侧冲线';

const RIVAL_DEFS = [
  { name: '法拉利车队', model: '2001 原版顶配', car: 'car1', targetTime: 1.74 },
  { name: '宝马车队',   model: '2001 原版顶配', car: 'car2', targetTime: 1.82 },
  { name: '三菱车队',   model: '2001 原版顶配', car: 'car5', targetTime: 1.90 },
  { name: '丰田车队',   model: '2001 原版顶配', car: 'car6', targetTime: 1.98 },
];

const NEWS_LINES = [
  '时刻注意你的财政状况是很重要的。',
  '著名车手舒马赫说：一场比赛的起跑往往非常重要。',
  '玉米公司进入汽车市场，其第一款发动机就引起世界轰动。',
  '科学家的真理（汽车没有轮胎不能行驶）被神秘磁悬浮推翻了。',
  '今日有一款宝马车壳上市，黑色象征着富贵。',
  '洛克希德马丁公司将其航空发动机推进汽车发动机市场，引起一片骚乱。',
];

const CATALOG_2001 = {
  shells: [
    { id: 's8_maglev',    name: '磁浮时空胶囊',   price: 0,    sprite: 'capsule', desc: '来自 2027 年的超导磁悬浮穿越胶囊，时空褶皱已锁定。' },
    { id: 'c_bmw_black',  name: '黑色宝马车壳',   price: 20,   sprite: 'car1',    desc: '宝马公司的新作，黑色象征着富贵。' },
    { id: 'c_bmw_blue',   name: '蓝色宝马车壳',   price: 20,   sprite: 'car2',    desc: '只是换了一种颜色。' },
    { id: 'c_bmw_green',  name: '绿色宝马车壳',   price: 20,   sprite: 'car3',    desc: '绿色给人大自然的感觉。' },
    { id: 'c_bmw_orange', name: '橙黄色宝马车壳', price: 20,   sprite: 'car4',    desc: '橙黄色接近黄色。' },
    { id: 'c_bmw_purple', name: '紫色宝马车壳',   price: 20,   sprite: 'car5',    desc: '紫色象征着豪华。' },
    { id: 'c_bmw_white',  name: '白色宝马车壳',   price: 20,   sprite: 'car6',    desc: '车壳只是好看，没有其它用处。' },
    { id: 'c_bmw_yellow', name: '黄色宝马车壳',   price: 20,   sprite: 'car7',    desc: '希望不会招来蚊虫' },
    { id: 'c_icecream',   name: '玉米冰激凌车',   price: 260,  sprite: 'car11',   desc: '车壳市场越来越不知道自己在干什么了。' },
    { id: 'c_ford_truck', name: '福特重型卡车头', price: 300,  sprite: 'car12',   desc: '车壳市场近日闹出笑话：福特竟然推出了卡车外型的车壳。' },
    { id: 'c_hover',      name: '2001 概念气垫船', price: 680, sprite: 'car15',   desc: '玉米公司早年测试用的复古原型车壳。' },
  ],
  engines: [
    { id: 's8_maize_nuclear2', name: '玉米公司核动力 II', fuel: 'nuclear', power: 1.00, topKmh: 1080, price: 0,     desc: '终极聚变核心。' },
    { id: 'e_diesel',          name: '普通柴油发动机',    fuel: 'diesel',  power: 0.24, topKmh: 85,   price: 200,   desc: '这种发动机加速快但速度较低。' },
    { id: 'e_gas',             name: '普通汽油发动机',    fuel: 'gas',     power: 0.27, topKmh: 90,   price: 300,   desc: '加速度较低，但最高时速可达到90公里/小时。' },
    { id: 'e_p911',            name: '保时捷911发动机',   fuel: 'gas',     power: 0.45, topKmh: 280,  price: 1800,  desc: '在跑车市场占有一席之地的保时捷公司推出了其著名的911发动机。' },
    { id: 'e_f50',             name: '法拉利F50发动机',   fuel: 'gas',     power: 0.62, topKmh: 360,  price: 3600,  desc: '跑车之王法拉利推出的经典旗舰发动机。' },
    { id: 'e_f119',            name: 'F119航空发动机',    fuel: 'gas',     power: 0.78, topKmh: 580,  price: 6800,  desc: '洛克希德马丁公司将航空发动机推入汽车市场！' },
    { id: 'e_cz',              name: '长征火箭发动机',    fuel: 'rocket',  power: 0.86, topKmh: 760,  price: 9600,  desc: '航天级推力，需要配套火箭专用肼燃料。' },
    { id: 'e_nuc1',            name: '玉米公司核动力',    fuel: 'nuclear', power: 0.90, topKmh: 880,  price: 12000, desc: '玉米公司 2000 年底推出的第一代核动力发动机。' },
  ],
  fuels: [
    { id: 's8_fusion', name: '氘氚微型聚变芯', type: 'nuclear', mult: 1.00, price: 0,    desc: '2027 年自带聚变燃料芯，释放全部超越时代推力。' },
    { id: 'f_diesel',  name: '普通柴油',         type: 'diesel',  mult: 0.72, price: 80,   desc: '适用于普通柴油发动机。' },
    { id: 'f_gas',     name: '普通汽油',         type: 'gas',     mult: 0.78, price: 120,  desc: '标准汽油燃料，可驱动常见汽油与航发引擎。' },
    { id: 'f_gas98',   name: '98号高标汽油',     type: 'gas',     mult: 0.90, price: 260,  desc: '高辛烷值赛车用油，微幅提升极速。' },
    { id: 'f_hydrazine', name: '肼燃料',         type: 'rocket',  mult: 0.96, price: 900,  desc: '火箭发动机的燃料。提高最高时速。' },
    { id: 'f_u235',    name: '铀235核燃料',      type: 'nuclear', mult: 0.96, price: 1500, desc: '适用于核动力发动机。提高最高时速。' },
  ],
  tires: [
    { id: 's8_magpad', name: '超导磁悬浮滑靴', mult: 1.00, price: 0,    desc: '摆脱路面摩擦，完全无轮悬浮贴地冲刺。' },
    { id: 't_wood',    name: '木制轮胎',       mult: 0.68, price: 80,   desc: '科学家证明：有轮胎就能跑。' },
    { id: 't_rubber',  name: '橡胶轮胎',       mult: 0.78, price: 150,  desc: '结实耐用的基础橡胶轮胎。' },
    { id: 't_hi',      name: '高强度橡胶轮胎', mult: 0.85, price: 320,  desc: '抓地力更好的合成加强胎。' },
    { id: 't_f1',      name: 'F1专用轮胎',     mult: 0.94, price: 1200, desc: '热熔光头竞赛胎，对起步加速帮助极大。' },
    { id: 't_nano',    name: '纳米涂层轮胎',   mult: 0.97, price: 2400, desc: '2001 商店终极轮胎配件。' },
  ],
  accs: [
    { id: 's8_magchassis', name: '磁悬浮主动底盘', mult: 1.00, price: 0,   desc: '与核动力 II、磁浮滑靴协同锁死时空的终极外挂。' },
    { id: 'a_shell_oil',   name: '壳牌润滑油',     mult: 0.85, price: 50,  desc: '对赛车加速有帮助。' },
    { id: 'a_water',       name: '发动机水冷系统', mult: 0.90, price: 180, desc: '防止高转过热，稳住后程加速。' },
    { id: 'a_add',         name: '燃料添加剂',     mult: 0.94, price: 380, desc: '增强燃料的功效。' },
    { id: 'a_turbo',       name: '涡轮增压器',     mult: 0.97, price: 850, desc: '强力进气增压，显著强化前段爆发。' },
  ],
};

function makeTimeCapsuleSprite() {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  x.fillStyle = 'rgba(0,0,0,0.45)';
  x.fillRect(5, 25, 22, 2);
  x.fillStyle = '#000';
  x.fillRect(6, 12, 20, 1);
  x.fillRect(4, 13, 2, 1);
  x.fillRect(26, 13, 2, 1);
  x.fillRect(3, 14, 1, 7);
  x.fillRect(28, 14, 1, 7);
  x.fillRect(4, 21, 24, 1);
  x.fillStyle = '#1cd8ff';
  x.fillRect(4, 15, 24, 6);
  x.fillStyle = '#aaf4ff';
  x.fillRect(6, 13, 20, 2);
  x.fillRect(7, 14, 18, 2);
  x.fillStyle = '#113a66';
  x.fillRect(7, 15, 6, 3);
  x.fillRect(14, 15, 11, 2);
  x.fillStyle = '#ffffff';
  x.fillRect(8, 15, 2, 1);
  x.fillStyle = '#ffe55c';
  x.fillRect(4, 18, 2, 2);
  x.fillStyle = '#ff6a22';
  x.fillRect(26, 17, 2, 2);
  x.fillStyle = '#0c789c';
  x.fillRect(5, 20, 22, 1);
  x.fillStyle = '#7bf5ff';
  x.fillRect(6, 22, 6, 2);
  x.fillRect(20, 22, 6, 2);
  return c;
}

let CAPSULE_SPRITE_URL = null;
function getCapsuleUrl() {
  if (!CAPSULE_SPRITE_URL) CAPSULE_SPRITE_URL = makeTimeCapsuleSprite().toDataURL();
  return CAPSULE_SPRITE_URL;
}

export class Retro2001Race {
  constructor(desktopEl, { teamName = '默认车队', money = 2000, onComplete }) {
    this.desktop = desktopEl;
    this.teamName = teamName || '默认车队';
    this.money = Math.max(0, Math.round(money));
    this.onComplete = onComplete;
    this.disposed = false;
    this.tab = 'info';
    this.shopCat = 'shells';
    this.shopSel = CATALOG_2001.shells[1].id;
    this.newsIdx = 0;
    this.racesPlayed = 0;
    this.points = { [this.teamName]: 0, 法拉利车队: 0, 宝马车队: 0, 三菱车队: 0, 丰田车队: 0 };

    this.inventory = {
      shells: ['s8_maglev', 'c_bmw_black'],
      engines: ['s8_maize_nuclear2'],
      fuels: ['s8_fusion'],
      tires: ['s8_magpad'],
      accs: ['s8_magchassis'],
    };
    this.equipped = {
      shell: 's8_maglev',
      engine: 's8_maize_nuclear2',
      fuel: 's8_fusion',
      tire: 's8_magpad',
      acc: 's8_magchassis',
    };

    // Hide modern 2026 shell so ONLY one 2001 window is visible
    this.modernWin = this.desktop.querySelector('.win');
    if (this.modernWin) this.modernWin.style.display = 'none';

    this.sprites = {};
    this.capsuleSprite = makeTimeCapsuleSprite();
    this.preloadSprites();

    // Race state
    this.inRace = false;
    this.raf = null;
    this.throttle = false;
    this.racePhase = 'idle';

    this.mount();
    this.onResize = () => this.fitScale();
    window.addEventListener('resize', this.onResize);
    this.fitScale();
  }

  preloadSprites() {
    for (const k of ['car1', 'car2', 'car3', 'car4', 'car5', 'car6', 'car7', 'car11', 'car12', 'car15']) {
      const im = new Image();
      im.src = ORIG_ASSETS[k];
      this.sprites[k] = im;
    }
  }

  fitScale() {
    if (!this.win) return;
    // Native 548x371 client + 26px titlebar = 552x401 outer box
    const s = Math.min((window.innerWidth - 28) / 552, (window.innerHeight - 28) / 401, 1.85);
    this.win.style.transform = `translate(-50%, -50%) scale(${s.toFixed(3)})`;
  }

  mount() {
    const win = document.createElement('div');
    win.id = 'retro2001Win';
    win.style.cssText = `
      position:absolute; left:50%; top:50%; width:552px; height:401px;
      transform:translate(-50%, -50%); transform-origin:center center;
      border:2px solid #000; background:#c0c0c0;
      box-shadow:6px 6px 0 rgba(0,0,0,.45);
      display:flex; flex-direction:column;
      font-family:"SimSun","宋体","Zpix",sans-serif; font-size:12px; color:#000;
      user-select:none; image-rendering:pixelated; z-index:40;
    `;
    win.innerHTML = `
      <div style="height:26px;flex:none;background:linear-gradient(90deg,#000080,#1084d0);color:#fff;padding:0 4px 0 6px;display:flex;align-items:center;gap:6px;font-size:13px;border-bottom:1px solid #000;">
        <img src="${ORIG_ASSETS.aboutCar}" style="width:18px;height:18px;object-fit:contain;">
        <span style="font-weight:bold;letter-spacing:.3px;">玉米公司-汽车赛II</span>
        <button id="r2WinClose" title="返回2027" style="margin-left:auto;width:18px;height:18px;background:#c0c0c0;border:1px outset #fff;color:#000;font-size:11px;line-height:14px;cursor:pointer;padding:0;font-weight:bold;">✕</button>
      </div>
      <div id="r2Client" style="position:relative;width:548px;height:371px;flex:none;overflow:hidden;
        background-image:url('${ORIG_ASSETS.bgFull}');background-size:548px 371px;background-repeat:no-repeat;">
        <div id="r2Header" style="padding:10px 14px 4px;display:flex;gap:12px;align-items:flex-start;">
          <img src="${ORIG_ASSETS.logo}" style="width:152px;height:58px;border:2px solid #000;box-shadow:inset 1px 1px 0 #fff;background:#b8b8b8;display:block;flex:none;">
          <div style="flex:1;padding-top:1px;">
            <div id="r2Tabs" style="display:flex;gap:0;border-left:1px solid #000;">
              ${[['info','信息'],['factory','工厂'],['shop','商店'],['about','关于']].map(([id, label]) =>
                `<button data-r2tab="${id}" style="flex:1;height:28px;font-family:inherit;font-size:13px;cursor:pointer;border:1px solid #000;border-left:none;">${label}</button>`
              ).join('')}
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 8px 0 0;font-size:13px;">
              <span>总资产: <b id="r2HeadMoney" style="font-weight:normal;">${this.money}</b></span>
              <span>2001年度</span>
            </div>
          </div>
        </div>
        <div style="margin:2px 14px 0;border-bottom:2px solid #000;"></div>
        <div id="r2Body" style="position:relative;height:291px;padding:8px 14px;"></div>
        <div id="r2Overlay" style="position:absolute;inset:0;display:none;place-items:center;background:rgba(0,0,0,0.34);z-index:20;">
          <div style="width:392px;background:#c0c0c0;border:2px outset #fff;box-shadow:4px 4px 0 rgba(0,0,0,.55);">
            <div style="background:linear-gradient(90deg,#000080,#1084d0);color:#fff;padding:3px 8px;font-size:13px;font-weight:bold;display:flex;align-items:center;gap:6px;">
              <img id="r2ModalIco" src="${ORIG_ASSETS.warn}" style="width:16px;height:16px;display:none;">
              <span id="r2ModalTitle">提示</span>
            </div>
            <div id="r2ModalBody" style="padding:14px 16px;font-size:13px;line-height:1.55;"></div>
            <div style="padding:0 16px 12px;text-align:center;">
              <button id="r2ModalBtn" style="padding:4px 20px;font-family:inherit;font-size:13px;background:#c0c0c0;border:2px outset #fff;cursor:pointer;">确定</button>
            </div>
          </div>
        </div>
      </div>
    `;
    this.desktop.appendChild(win);
    this.win = win;
    this.$body = win.querySelector('#r2Body');
    this.$headMoney = win.querySelector('#r2HeadMoney');
    this.$overlay = win.querySelector('#r2Overlay');
    this.$modalTitle = win.querySelector('#r2ModalTitle');
    this.$modalBody = win.querySelector('#r2ModalBody');
    this.$modalBtn = win.querySelector('#r2ModalBtn');
    this.$modalIco = win.querySelector('#r2ModalIco');

    win.querySelector('#r2WinClose').onclick = () => this.finishAll({ won: false, aborted: true, dq: false, time: 0, place: 5 });
    win.querySelectorAll('#r2Tabs button').forEach((b) => {
      b.onclick = () => {
        if (this.inRace) return;
        audio.blip(720, 0.03);
        this.tab = b.dataset.r2tab;
        this.renderView();
      };
    });

    this.onKeyDown = (e) => {
      if (!this.inRace) return;
      if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (this.$overlay.style.display !== 'none') return;
        if (this.racePhase === 'countdown') {
          this.handleFalseStart();
          return;
        }
        if (this.racePhase === 'running') this.throttle = true;
      }
    };
    this.onKeyUp = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') this.throttle = false;
    };
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    this.renderView();
  }

  refreshTabs() {
    this.$headMoney.textContent = String(this.money);
    const active = this.inRace ? 'info' : this.tab;
    this.win.querySelectorAll('#r2Tabs button').forEach((b) => {
      const isAct = b.dataset.r2tab === active;
      b.style.background = isAct ? '#ececec' : '#c0c0c0';
      b.style.borderBottom = isAct ? '1px solid #ececec' : '1px solid #000';
      b.style.fontWeight = isAct ? 'bold' : 'normal';
      b.disabled = this.inRace;
    });
  }

  showDlg({ title, html, btnLabel = '确定', warnIcon = false, onOk = null }) {
    this.$modalTitle.textContent = title;
    this.$modalBody.innerHTML = html;
    this.$modalBtn.textContent = btnLabel;
    this.$modalIco.style.display = warnIcon ? 'inline-block' : 'none';
    this.$overlay.style.display = 'grid';
    this.$modalBtn.onclick = () => {
      this.$overlay.style.display = 'none';
      if (onOk) onOk();
    };
  }

  renderView() {
    this.refreshTabs();
    if (this.tab === 'info') this.renderInfo();
    else if (this.tab === 'factory') this.renderFactory();
    else if (this.tab === 'shop') this.renderShop();
    else this.renderAbout();
  }

  // ---------- TAB 1: 信息 (首页) ----------
  renderInfo() {
    const rows = Object.entries(this.points).sort((a, b) => b[1] - a[1]);
    const news = NEWS_LINES[this.newsIdx % NEWS_LINES.length];
    this.$body.innerHTML = `
      <div style="display:flex;gap:22px;padding:6px 10px 0;">
        <div style="width:244px;font-size:13px;line-height:1.68;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;padding-left:14px;">
            <img src="${ORIG_ASSETS.iconInfo}" style="width:28px;height:28px;display:block;">
            <span style="font-size:14px;">比赛信息</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
            <span style="width:66px;flex:none;">车队名称:</span>
            <input id="r2TeamInp" value="${this.esc(this.teamName)}" maxlength="10" style="width:128px;font-family:inherit;font-size:13px;padding:2px 4px;border:2px inset #fff;background:#fff;">
          </div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
            <span style="width:66px;flex:none;">总资产:</span>
            <span>$${this.money}</span>
          </div>
          <div style="margin-bottom:2px;">比赛规则:</div>
          <div style="line-height:1.6;">
            1.按左光标键起跑<br>
            2.不得抢跑，抢跑3次罚款<br>
            3.前三名有奖金和积分<br>
            4.总资产为0时退出游戏
          </div>
        </div>
        <div style="flex:1;font-size:13px;display:flex;flex-direction:column;">
          <div style="text-align:center;margin-bottom:4px;">2001年度积分表</div>
          <div style="border-top:2px solid #000;border-bottom:2px solid #000;padding:4px 10px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span>车队名称</span><span>积分</span></div>
            ${rows.map(([name, pts]) => {
              const isMe = name === this.teamName;
              return `<div style="display:flex;justify-content:space-between;line-height:1.6;color:${isMe ? '#0000ff' : '#000'};"><span>${this.esc(name)}</span><span>${pts}</span></div>`;
            }).join('')}
          </div>
          <div style="text-align:center;padding:12px 0 10px;">比赛场次: ${this.racesPlayed}/15</div>
          <div style="display:flex;justify-content:center;">
            <button id="r2StartBtn" style="padding:7px 20px;font-family:inherit;font-size:13px;background:#c0c0c0;border:2px outset #fff;box-shadow:1px 1px 0 #000;cursor:pointer;">开始下一场比赛>></button>
          </div>
        </div>
      </div>
      <div style="position:absolute;left:16px;right:16px;bottom:10px;font-size:13px;">
        新闻: <span style="color:#d40000;">${this.esc(news)}</span>
      </div>
    `;
    const inp = this.$body.querySelector('#r2TeamInp');
    inp.onchange = () => {
      const next = inp.value.trim() || '默认车队';
      if (next !== this.teamName) {
        const curPts = this.points[this.teamName] || 0;
        delete this.points[this.teamName];
        this.teamName = next;
        this.points[this.teamName] = curPts;
        this.renderInfo();
      }
    };
    this.$body.querySelector('#r2StartBtn').onclick = () => this.tryBeginRace();
  }

  // ---------- TAB 2: 工厂 ----------
  renderFactory() {
    const shObj = CATALOG_2001.shells.find((x) => x.id === this.equipped.shell) || CATALOG_2001.shells[0];
    const spriteSrc = shObj.sprite === 'capsule' ? getCapsuleUrl() : ORIG_ASSETS[shObj.sprite];
    const opts = (cat, cur) => {
      const owned = this.inventory[cat].map((id) => CATALOG_2001[cat].find((x) => x.id === id)).filter(Boolean);
      return `<option value="">(无)</option>` + owned.map((it) =>
        `<option value="${it.id}" ${cur === it.id ? 'selected' : ''}>${this.esc(it.name)}</option>`
      ).join('');
    };
    this.$body.innerHTML = `
      <div style="padding:6px 10px;">
        <div style="position:relative;display:flex;align-items:center;gap:12px;height:36px;margin-bottom:18px;">
          <img src="${ORIG_ASSETS.iconFactory}" style="width:32px;height:32px;display:block;">
          <span style="font-size:14px;">装配工厂</span>
          <img src="${spriteSrc}" style="position:absolute;left:50%;transform:translateX(-50%);width:36px;height:36px;image-rendering:pixelated;">
          <button id="r2ResetCap" style="margin-left:auto;padding:3px 9px;font-family:inherit;font-size:12px;background:#c0c0c0;border:2px outset #fff;box-shadow:1px 1px 0 #000;cursor:pointer;">回满未来配置</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:22px 24px;align-items:center;margin-bottom:24px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="width:44px;height:44px;display:grid;place-items:center;flex:none;"><img src="${ORIG_ASSETS.iconEngine}" style="max-width:44px;max-height:44px;object-fit:contain;"></span>
            <select id="r2FacEngine" style="width:176px;font-family:inherit;font-size:13px;padding:3px 4px;border:2px inset #fff;background:#fff;">${opts('engines', this.equipped.engine)}</select>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="width:44px;height:44px;display:grid;place-items:center;flex:none;"><img src="${ORIG_ASSETS.iconTire}" style="max-width:40px;max-height:40px;object-fit:contain;"></span>
            <select id="r2FacTire" style="width:176px;font-family:inherit;font-size:13px;padding:3px 4px;border:2px inset #fff;background:#fff;">${opts('tires', this.equipped.tire)}</select>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="width:44px;height:44px;display:grid;place-items:center;flex:none;"><img src="${ORIG_ASSETS.iconFuel}" style="max-width:36px;max-height:36px;object-fit:contain;"></span>
            <select id="r2FacFuel" style="width:176px;font-family:inherit;font-size:13px;padding:3px 4px;border:2px inset #fff;background:#fff;">${opts('fuels', this.equipped.fuel)}</select>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="width:44px;height:44px;display:grid;place-items:center;flex:none;"><img src="${ORIG_ASSETS.iconAcc}" style="max-width:40px;max-height:40px;object-fit:contain;"></span>
            <select id="r2FacAcc" style="width:176px;font-family:inherit;font-size:13px;padding:3px 4px;border:2px inset #fff;background:#fff;">${opts('accs', this.equipped.acc)}</select>
          </div>
        </div>
        <div style="border-top:1px solid #666;padding-top:20px;display:flex;align-items:center;gap:12px;">
          <span style="font-size:14px;width:72px;flex:none;">更换车壳:</span>
          <select id="r2FacShell" style="width:270px;font-family:inherit;font-size:13px;padding:3px 4px;border:2px inset #fff;background:#fff;">${opts('shells', this.equipped.shell)}</select>
        </div>
      </div>
    `;
    const bindSel = (selId, slot) => {
      this.$body.querySelector(selId).onchange = (e) => {
        this.equipped[slot] = e.target.value || null;
        audio.blip(780, 0.04);
        this.renderFactory();
      };
    };
    bindSel('#r2FacEngine', 'engine');
    bindSel('#r2FacTire', 'tire');
    bindSel('#r2FacFuel', 'fuel');
    bindSel('#r2FacAcc', 'acc');
    bindSel('#r2FacShell', 'shell');
    this.$body.querySelector('#r2ResetCap').onclick = () => {
      this.equipped = {
        shell: 's8_maglev',
        engine: 's8_maize_nuclear2',
        fuel: 's8_fusion',
        tire: 's8_magpad',
        acc: 's8_magchassis',
      };
      audio.blip(940, 0.05);
      this.renderFactory();
    };
  }

  // ---------- TAB 3: 商店 ----------
  renderShop() {
    const cats = [
      ['shells', '汽车车壳'],
      ['engines', '发动机'],
      ['fuels', '燃料'],
      ['tires', '轮胎'],
      ['accs', '附加设备'],
    ];
    const items = CATALOG_2001[this.shopCat].filter((it) => it.price > 0);
    let sel = items.find((x) => x.id === this.shopSel) || items[0];
    this.shopSel = sel?.id || null;
    const owned = sel && this.inventory[this.shopCat].includes(sel.id);
    const previewImg = this.shopCat === 'shells'
      ? (sel?.sprite ? ORIG_ASSETS[sel.sprite] : ORIG_ASSETS.shopCar)
      : ({ engines: ORIG_ASSETS.iconEngine, fuels: ORIG_ASSETS.iconFuel, tires: ORIG_ASSETS.iconTire, accs: ORIG_ASSETS.iconAcc }[this.shopCat]);

    this.$body.innerHTML = `
      <div style="display:flex;gap:16px;height:100%;padding:4px 10px;">
        <div style="width:120px;display:flex;flex-direction:column;">
          <div style="display:flex;align-items:center;gap:8px;height:36px;margin-bottom:8px;">
            <img src="${ORIG_ASSETS.iconShop}" style="width:30px;height:30px;">
            <span style="font-size:13px;">汽车配件</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:0;border:1px solid #000;margin-bottom:16px;">
            ${cats.map(([cid, label]) => `
              <button data-sc="${cid}" style="height:26px;font-family:inherit;font-size:13px;cursor:pointer;
                background:${this.shopCat === cid ? '#dfdfdf' : '#c0c0c0'};border:1px outset #fff;
                font-weight:${this.shopCat === cid ? 'bold' : 'normal'};">${label}</button>
            `).join('')}
          </div>
          <button id="r2BuyBtn" style="margin-top:auto;margin-bottom:8px;height:52px;font-family:inherit;font-size:13px;background:#c0c0c0;border:2px outset #fff;box-shadow:1px 1px 0 #000;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;">
            <img src="${ORIG_ASSETS.iconCheck}" style="width:22px;height:22px;">
            <span>${owned ? '已拥有' : '购买'}</span>
          </button>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;">
          <div style="height:36px;margin-bottom:8px;display:flex;justify-content:center;align-items:center;">
            <img src="${previewImg}" style="max-height:36px;object-fit:contain;">
          </div>
          <div id="r2ShopList" style="height:152px;background:#fff;border:2px inset #fff;overflow-y:auto;padding:2px 0;">
            ${items.map((it) => {
              const isSel = it.id === this.shopSel;
              const isOwn = this.inventory[this.shopCat].includes(it.id);
              return `<div data-sid="${it.id}" style="padding:2px 8px;font-size:13px;cursor:pointer;display:flex;justify-content:space-between;
                background:${isSel ? '#0a64ad' : 'transparent'};color:${isSel ? '#fff' : '#000'};">
                <span>${this.esc(it.name)}</span>
                <span>${isOwn ? '[已买]' : ''}</span>
              </div>`;
            }).join('')}
          </div>
          <div style="padding:10px 2px 0;font-size:13px;line-height:1.55;">
            <div>价格: ${sel ? sel.price : 0}</div>
            <div>简介: ${sel ? this.esc(sel.desc) : ''}</div>
          </div>
        </div>
      </div>
    `;
    this.$body.querySelectorAll('[data-sc]').forEach((b) => {
      b.onclick = () => {
        this.shopCat = b.dataset.sc;
        const first = CATALOG_2001[this.shopCat].find((it) => it.price > 0);
        this.shopSel = first?.id || null;
        audio.blip(700, 0.03);
        this.renderShop();
      };
    });
    this.$body.querySelectorAll('[data-sid]').forEach((row) => {
      row.onclick = () => {
        this.shopSel = row.dataset.sid;
        audio.blip(800, 0.03);
        this.renderShop();
      };
    });
    this.$body.querySelector('#r2BuyBtn').onclick = () => {
      if (!sel) return;
      if (this.inventory[this.shopCat].includes(sel.id)) {
        this.showDlg({ title: '商店提示', html: `<p>你已经购买过「${this.esc(sel.name)}」了。</p>` });
        return;
      }
      if (this.money < sel.price) {
        audio.play('none', 0.7);
        this.showDlg({ title: '商店提示', html: `<p>总资产不足（需 ${sel.price} 元），快去跑比赛赚钱吧！</p>`, warnIcon: true });
        return;
      }
      this.money -= sel.price;
      this.inventory[this.shopCat].push(sel.id);
      this.equipped[{ shells: 'shell', engines: 'engine', fuels: 'fuel', tires: 'tire', accs: 'acc' }[this.shopCat]] = sel.id;
      audio.play('money', 0.8);
      this.renderShop();
    };
  }

  // ---------- TAB 4: 关于 ----------
  renderAbout() {
    this.$body.innerHTML = `
      <div style="padding:6px 14px;font-size:12.5px;line-height:1.68;">
        <div style="display:flex;align-items:center;gap:20px;margin:2px 0 8px 20px;">
          <img src="${ORIG_ASSETS.aboutCar}" style="width:54px;height:44px;object-fit:contain;">
          <div style="font-size:13px;">
            <div>玉米公司 汽车赛II V2.11</div>
            <div>2001年3月11日 玉米公司出品</div>
          </div>
        </div>
        <div style="border-top:2px solid #168f8f;margin:8px 0 10px;"></div>
        <div style="padding:0 12px;">
          <div>作者地址：陕西省咸阳市西北轻工业学院附中</div>
          <div>作者信箱：<span style="text-decoration:underline;">cx331@263.net</span></div>
          <div>警告：本软件为免费软件，可以任意传播，但不能任意修改程序或将其用于商业目的。</div>
        </div>
        <div style="margin:10px auto;width:308px;background:#fff;border:1px solid #000;text-align:center;padding:3px 0;font-size:14px;letter-spacing:.6px;">HTTP://MAIZESOFT.YEAH.NET/</div>
        <div style="position:relative;display:flex;align-items:center;justify-content:center;margin:10px 0 6px;">
          <div style="position:absolute;left:0;right:0;border-top:2px solid #168f8f;"></div>
          <img src="${ORIG_ASSETS.maize}" style="position:relative;z-index:1;height:19px;">
        </div>
        <div style="text-align:center;line-height:1.5;font-size:13px;">
          版权所有(C)1995-2001 玉米公司<br>保留所有权利
        </div>
        <button id="r2BackModern" style="position:absolute;right:14px;bottom:10px;padding:2px 8px;font-family:inherit;font-size:11px;background:#c0c0c0;border:2px outset #fff;box-shadow:1px 1px 0 #000;cursor:pointer;">返回 2027 现代车库</button>
      </div>
    `;
    this.$body.querySelector('#r2BackModern').onclick = () => {
      this.finishAll({ won: false, aborted: true, dq: false, time: 0, place: 5 });
    };
  }

  // ---------- 校验后发车进入 2001 赛道 ----------
  tryBeginRace() {
    const sh = CATALOG_2001.shells.find((x) => x.id === this.equipped.shell);
    const eng = CATALOG_2001.engines.find((x) => x.id === this.equipped.engine);
    const fu = CATALOG_2001.fuels.find((x) => x.id === this.equipped.fuel);
    const ti = CATALOG_2001.tires.find((x) => x.id === this.equipped.tire);
    const ac = CATALOG_2001.accs.find((x) => x.id === this.equipped.acc);
    if (!sh || !eng || !fu || !ti) {
      audio.play('none', 0.7);
      this.showDlg({ title: '装配错误', html: '<p>没有装配必要的设备！请在「工厂」选齐车壳、发动机、燃料与轮胎。</p>', warnIcon: true });
      return;
    }
    if (eng.fuel !== fu.type) {
      audio.play('none', 0.7);
      this.showDlg({ title: '燃料错误', html: `<p>「${this.esc(eng.name)}」与「${this.esc(fu.name)}」的类型不匹配！</p>`, warnIcon: true });
      return;
    }
    this.startTrack({ sh, eng, fu, ti, ac });
  }

  computeBuildFinishTime({ eng, fu, ti, ac }) {
    const isCapsuleFull = this.equipped.shell === 's8_maglev'
      && this.equipped.engine === 's8_maize_nuclear2'
      && this.equipped.fuel === 's8_fusion'
      && this.equipped.tire === 's8_magpad'
      && this.equipped.acc === 's8_magchassis';
    if (isCapsuleFull) return { targetTime: 1.18, topDisplayKmh: 1280, label: '磁浮时空胶囊' };

    const score = eng.power * (fu.mult || 0.85) * (ti.mult || 0.85) * (ac ? ac.mult : 0.78);
    // score ~ 0.12 (diesel) -> 10.5s ; ~0.78 (nuc1) -> 1.85s
    const targetTime = Math.max(1.80, Math.min(12.5, 1.48 / Math.max(0.11, score)));
    return {
      targetTime,
      topDisplayKmh: Math.round(eng.topKmh * (fu.mult || 0.85)),
      label: this.esc(CATALOG_2001.shells.find((x) => x.id === this.equipped.shell)?.name || '赛车'),
    };
  }

  stopCountdownAudio() {
    for (const s of [this.startSrc, this.s11Src]) {
      if (s) {
        try { s.stop(); } catch (e) { /* already stopped */ }
      }
    }
    this.startSrc = null;
    this.s11Src = null;
  }

  resetStartSequence() {
    this.stopCountdownAudio();
    this.throttle = false;
    this.racePhase = 'countdown';
    this.countdownElapsed = 0;
    this.s11Started = false;
    // Play full 2.844s start.wav ("Start your engines!"), then s11.wav engine revving for ~2.0-3.2s before green GO
    this.greenWait = 4.85 + Math.random() * 1.25;
    this.raceTime = 0;
    this.finishOrder = [];
    for (const c of this.cars) {
      c.prog = 0;
      c.speed = 0;
      c.finished = false;
      c.time = 0;
      c.rank = null;
    }
    this.$lamp.src = ORIG_ASSETS.redLight;
    delete this.$lamp.dataset.go;
    this.$spd.textContent = '0';
    this.$clock.textContent = RACE_HINT;
    this.lastTs = performance.now();
    this.startSrc = audio.play('start', 0.9);
    this.drawTrack();
  }

  startTrack(parts) {
    this.inRace = true;
    this.refreshTabs();
    const spec = this.computeBuildFinishTime(parts);

    this.$body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:flex-end;gap:28px;padding:4px 20px 2px;">
        <div style="text-align:center;">
          <img src="${ORIG_ASSETS.arrowLeft}" style="width:24px;height:18px;display:block;margin:0 auto 2px;">
          <div style="font-size:12px;">2001年度最终决战</div>
        </div>
        <img id="r2Lamp" src="${ORIG_ASSETS.redLight}" style="width:28px;height:28px;display:block;">
      </div>
      <canvas id="r2Canvas" width="520" height="202" style="display:block;margin:0 auto;"></canvas>
      <div style="display:flex;align-items:center;justify-content:center;gap:14px;padding-top:6px;font-size:13px;">
        <img src="${ORIG_ASSETS.kmh}" style="width:28px;height:28px;">
        <span><b id="r2Spd" style="font-weight:normal;">0</b> &nbsp;公里/小时</span>
        <span id="r2Clock" style="margin-left:16px;color:#222;">${RACE_HINT}</span>
      </div>
      ${IS_TOUCH ? '<button id="r2Throttle" class="r2-touch">加速</button>' : ''}
    `;

    this.$lamp = this.$body.querySelector('#r2Lamp');
    this.$spd = this.$body.querySelector('#r2Spd');
    this.$clock = this.$body.querySelector('#r2Clock');
    this.$canvas = this.$body.querySelector('#r2Canvas');
    this.ctx = this.$canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    this.hazardImg = new Image();
    this.hazardImg.src = ORIG_ASSETS.hazard;

    const laneRows = [
      { isPlayer: false, name: RIVAL_DEFS[0].name, model: RIVAL_DEFS[0].model, sprite: RIVAL_DEFS[0].car, targetTime: RIVAL_DEFS[0].targetTime, prog: 0, finished: false, time: 0, rank: null },
      { isPlayer: false, name: RIVAL_DEFS[1].name, model: RIVAL_DEFS[1].model, sprite: RIVAL_DEFS[1].car, targetTime: RIVAL_DEFS[1].targetTime, prog: 0, finished: false, time: 0, rank: null },
      { isPlayer: true,  name: this.teamName, model: spec.label, sprite: parts.sh.sprite, targetTime: spec.targetTime, topDisplayKmh: spec.topDisplayKmh, prog: 0, speed: 0, finished: false, time: 0, rank: null },
      { isPlayer: false, name: RIVAL_DEFS[2].name, model: RIVAL_DEFS[2].model, sprite: RIVAL_DEFS[2].car, targetTime: RIVAL_DEFS[2].targetTime, prog: 0, finished: false, time: 0, rank: null },
      { isPlayer: false, name: RIVAL_DEFS[3].name, model: RIVAL_DEFS[3].model, sprite: RIVAL_DEFS[3].car, targetTime: RIVAL_DEFS[3].targetTime, prog: 0, finished: false, time: 0, rank: null },
    ];
    this.cars = laneRows;
    this.playerCar = laneRows[2];
    this.falseStarts = 0;

    const touchBtn = this.$body.querySelector('#r2Throttle');
    if (touchBtn) {
      const press = (e) => {
        e.preventDefault();
        touchBtn.setPointerCapture?.(e.pointerId);
        touchBtn.classList.add('pressed');
        if (this.$overlay.style.display !== 'none') return;
        if (this.racePhase === 'countdown') {
          this.handleFalseStart();
          return;
        }
        if (this.racePhase === 'running') this.throttle = true;
      };
      const release = () => {
        touchBtn.classList.remove('pressed');
        this.throttle = false;
      };
      touchBtn.addEventListener('pointerdown', press);
      touchBtn.addEventListener('pointerup', release);
      touchBtn.addEventListener('pointercancel', release);
      touchBtn.addEventListener('lostpointercapture', release);
      touchBtn.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    this.resetStartSequence();
    this.loop = (now) => {
      if (this.disposed || !this.inRace) return;
      this.raf = requestAnimationFrame(this.loop);
      const dt = Math.min(0.05, (now - this.lastTs) / 1000);
      this.lastTs = now;
      this.stepRace(dt);
    };
    this.raf = requestAnimationFrame(this.loop);
  }

  handleFalseStart() {
    this.stopCountdownAudio();
    this.falseStarts++;
    this.throttle = false;
    audio.play('none', 0.85);
    if (this.falseStarts >= 3) {
      this.racePhase = 'ended';
      this.showDlg({
        title: '强制退出本场',
        html: '<p style="color:#b00000;">你抢跑三次，被罚出比赛并返回 2027 车库！</p>',
        warnIcon: true,
        btnLabel: '返回 2027',
        onOk: () => this.finishAll({ won: false, dq: true, time: 0, place: 5 }),
      });
    } else {
      this.showDlg({
        title: '抢跑警告',
        html: `<p style="color:#b00000;">抢跑！第 ${this.falseStarts} / 3 次。点击「重新发车」后再等油门声结束、变绿 GO 起步！</p>`,
        warnIcon: true,
        btnLabel: '重新发车',
        onOk: () => this.resetStartSequence(),
      });
    }
  }

  stepRace(dt) {
    if (this.$overlay.style.display !== 'none') return;

    if (this.racePhase === 'countdown') {
      this.countdownElapsed += dt;
      if (this.countdownElapsed >= 2.832 && !this.s11Started) {
        this.s11Started = true;
        this.s11Src = audio.play('s11', 0.8);
      }
      if (this.countdownElapsed >= this.greenWait) {
        this.racePhase = 'running';
        this.raceTime = 0;
        this.$lamp.src = ORIG_ASSETS.greenGo;
        this.$lamp.dataset.go = '1';
        audio.blip(920, 0.18, 'square', 0.08);
      }
      this.drawTrack();
      return;
    }

    if (this.racePhase === 'running') {
      this.raceTime += dt;
      for (const c of this.cars) {
        if (c.finished) continue;
        if (c.isPlayer) {
          if (this.throttle) {
            c.speed = Math.min(1.0, c.speed + dt * 5.6);
          } else {
            c.speed = Math.max(0, c.speed - dt * 1.6);
          }
          c.prog += (c.speed / c.targetTime) * 1.07 * dt;
          const kmh = Math.round(c.speed * (c.topDisplayKmh || 1280));
          this.$spd.textContent = String(kmh);
        } else {
          const ramp = Math.min(1, this.raceTime / 0.22);
          c.prog += ((0.55 + 0.45 * ramp) / (c.targetTime * 0.968)) * dt;
        }
        if (c.prog >= 1) {
          c.prog = 1;
          c.finished = true;
          c.time = this.raceTime;
          this.finishOrder.push(c);
          c.rank = this.finishOrder.length;
        }
      }
      this.$clock.textContent = `计时: ${this.raceTime.toFixed(2)} s`;
      this.drawTrack();
      if (this.cars.every((c) => c.finished)) {
        this.stopCountdownAudio();
        this.racePhase = 'ended';
        this.throttle = false;
        this.racesPlayed++;
        const ptsAdd = [10, 6, 4, 0, 0];
        this.finishOrder.forEach((c, idx) => { this.points[c.name] = (this.points[c.name] || 0) + (ptsAdd[idx] || 0); });
        const won = this.playerCar.rank === 1;
        if (won) audio.play('money', 0.85);
        this.newsIdx++;
        const tableRows = this.finishOrder.map((c, idx) => `
          <tr style="${c.isPlayer ? 'color:#0000cc;font-weight:bold;' : ''}">
            <td style="padding:2px 8px;">${idx + 1}</td>
            <td style="padding:2px 8px;">${this.esc(c.name)}</td>
            <td style="padding:2px 8px;">${c.model}</td>
            <td style="padding:2px 8px;text-align:right;">${c.time.toFixed(2)} 秒</td>
          </tr>`).join('');
        this.showDlg({
          title: won ? '🏁 2001 原版赛场夺冠！' : '比赛结束 — 差之毫厘',
          html: `
            <p style="margin:0 0 8px;color:${won ? '#167028' : '#a01d16'};">
              ${won
                ? '祝贺你！你得了第 1 名！（成功超越原版 1.74 秒最强配置！）'
                : `你得了第 ${this.playerCar.rank} 名（${this.playerCar.time.toFixed(2)} 秒），未能击败 1.74 秒原版冠军！`}
            </p>
            <table style="width:100%;border-collapse:collapse;font-size:12px;">
              <thead><tr style="border-bottom:1px solid #666;"><th>名次</th><th>车队</th><th>车型</th><th style="text-align:right;">成绩</th></tr></thead>
              <tbody>${tableRows}</tbody>
            </table>`,
          btnLabel: won ? '完全通关 >>' : '返回 2027 再战',
          onOk: () => this.finishAll({ won, dq: false, time: this.playerCar.time, place: this.playerCar.rank }),
        });
      }
    }
  }

  drawTrack() {
    const ctx = this.ctx;
    const W = this.$canvas.width;
    const H = this.$canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Top & bottom original hazard stripes
    const finishX = 72;
    const startX = W - 56;
    const hazX = finishX + 18;
    const hazW = startX - finishX - 42;
    if (this.hazardImg.complete && this.hazardImg.naturalWidth > 0) {
      ctx.drawImage(this.hazardImg, hazX, 4, hazW, 10);
      ctx.drawImage(this.hazardImg, hazX, H - 14, hazW, 10);
    }

    const travel = startX - finishX;

    // Vertical start & finish lines
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(finishX, 20);
    ctx.lineTo(finishX, H - 20);
    ctx.moveTo(startX, 20);
    ctx.lineTo(startX, H - 20);
    ctx.stroke();

    // 4 dashed white lane separators
    const topY = 22;
    const laneH = (H - 44) / 5;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    for (let i = 1; i <= 4; i++) {
      const y = Math.round(topY + i * laneH);
      for (let x = finishX + 10; x < startX - 18; x += 48) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(Math.min(x + 26, startX - 10), y);
        ctx.stroke();
      }
    }

    // 5 cars (right -> left, parked just right of start line matching original)
    this.cars.forEach((c, idx) => {
      const cy = Math.round(topY + (idx + 0.5) * laneH - 16);
      const drawX = Math.round(startX + 4 - c.prog * (travel + 44));
      const img = c.sprite === 'capsule' ? this.capsuleSprite : this.sprites[c.sprite];
      if (img && (c.sprite === 'capsule' || img.complete)) {
        ctx.drawImage(img, drawX, cy, 32, 32);
      }
      if (c.rank != null) {
        ctx.fillStyle = c.isPlayer ? '#0000cc' : '#000000';
        ctx.font = 'bold 15px SimSun, monospace';
        ctx.fillText(String(c.rank), finishX + 10, cy + 21);
      }
    });
  }

  esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  finishAll(res) {
    this.dispose();
    if (this.onComplete) this.onComplete(res);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.inRace = false;
    this.stopCountdownAudio();
    if (this.raf) cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.win?.remove();
    if (this.modernWin) this.modernWin.style.display = '';
  }
}

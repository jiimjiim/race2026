# 汽车赛·世纪 RACE 2026

一个业余时间用 Three.js 写的《汽车赛 II》同人重制。原版《汽车赛 II》是玉米公司 2001 年的作品，这个项目只是凭兴趣和回忆做的非官方版本，难免粗糙，请多包涵。

玩法很简单：从 2001 年开始经营车队，买车壳、引擎、燃油、轮胎和配件，跑完 9 个赛季 54 场比赛和几届杯赛。比赛是手动加速的，绿灯亮起后按住加速键，抢跑会被罚款。

![主界面](screenshots/main.jpg)

## 运行

Windows 用户直接到 [Releases](https://github.com/jiimjiim/race2026/releases) 下载 `Race2026.exe`，双击即玩。它依赖系统的 WebView2 运行时，Win10/11 一般已自带。

从源码运行：

```
npm install
npm run dev
```

也可以双击 `play.bat`，会自动安装依赖、构建并打开浏览器。

## 操作

- 比赛：绿灯亮起后按住 `↑` 加速（复古模式用 `←` 或 `↑`）
- 界面：鼠标点击

## 构建 exe

```
npm run build:exe
```

产物是 `game/Race2026.exe`，单文件，用系统自带的 .NET Framework 编译器打包。

## 说明

- 复古模式「BACK TO 2001」的界面图与原版音效没有包含在仓库中，公开版本使用自绘 SVG 占位图和合成音效，该模式仍可正常游玩。
- 字体为 [Zpix 最像素](https://github.com/SolidZORO/zpix-pixel-font)，授权见 `public/fonts/ZPIX-LICENSE.txt`。
- 车名与商标归各自权利人。本项目仅供学习交流，不用于商业用途。
- 存档保存在浏览器 localStorage，换浏览器或清理缓存会丢失。

![复古模式](screenshots/retro.jpg)

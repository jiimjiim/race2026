import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { execFileSync } from 'child_process';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const outDir = path.join(root, 'game');
const tmpDir = path.join(outDir, '.tmp');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.wav': 'audio/wav',
  '.svg': 'image/svg+xml',
};

function collectFiles(dir, prefix = '') {
  const entries = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    const rel = `${prefix}/${ent.name}`;
    if (ent.isDirectory()) {
      entries.push(...collectFiles(full, rel));
    } else {
      if (rel.startsWith('/fonts/')) continue;
      let buf = fs.readFileSync(full);
      const ext = path.extname(ent.name).toLowerCase();
      if (ext === '.css') {
        const cleaned = buf.toString('utf8').replace(/@font-face\s*\{[^}]*\}\s*/g, '');
        buf = Buffer.from(cleaned, 'utf8');
      }
      const route = rel === '/index.html' ? '/' : rel;
      entries.push({ route, mime: MIME[ext] || 'application/octet-stream', buf });
    }
  }
  return entries;
}

// Generate a tiny 32x32 32bpp pixel-art racing icon (.ico) with checkered flag + red car motif
function makeIconIco() {
  const w = 32, h = 32;
  const px = Buffer.alloc(w * h * 4);
  const set = (x, y, r, g, b, a = 255) => {
    // BMP inside ICO is bottom-up
    const row = h - 1 - y;
    const o = (row * w + x) * 4;
    px[o] = b; px[o + 1] = g; px[o + 2] = r; px[o + 3] = a;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Win98 teal frame + dark inner badge
      const border = x < 2 || x >= 30 || y < 2 || y >= 30;
      if (border) { set(x, y, 224, 220, 206); continue; }
      const chk = ((x >> 2) + (y >> 2)) & 1;
      if (y < 14) {
        if (chk) set(x, y, 240, 236, 224); else set(x, y, 30, 34, 42);
      } else {
        set(x, y, 18, 60, 122);
      }
      // Red racing car silhouette at y=16..27
      if (y >= 17 && y <= 24 && x >= 5 && x <= 26) {
        if (y >= 17 && y <= 19 && (x < 9 || x > 21)) continue;
        if (y === 18 && x >= 11 && x <= 19) { set(x, y, 140, 225, 255); continue; }
        set(x, y, 204, 34, 28);
      }
      // Wheels
      for (const wx of [9, 22]) {
        if ((x - wx) * (x - wx) + (y - 25) * (y - 25) <= 6) set(x, y, 24, 24, 28);
        if ((x - wx) * (x - wx) + (y - 25) * (y - 25) <= 1) set(x, y, 215, 218, 224);
      }
    }
  }
  const bmpInfo = Buffer.alloc(40);
  bmpInfo.writeUInt32LE(40, 0);
  bmpInfo.writeInt32LE(w, 4);
  bmpInfo.writeInt32LE(h * 2, 8);
  bmpInfo.writeUInt16LE(1, 12);
  bmpInfo.writeUInt16LE(32, 14);
  const andMask = Buffer.alloc((w / 8) * h, 0);
  const imgData = Buffer.concat([bmpInfo, px, andMask]);
  const icoDir = Buffer.alloc(22);
  icoDir.writeUInt16LE(0, 0);
  icoDir.writeUInt16LE(1, 2);
  icoDir.writeUInt16LE(1, 4);
  icoDir[6] = w; icoDir[7] = h;
  icoDir.writeUInt16LE(1, 10);
  icoDir.writeUInt16LE(32, 12);
  icoDir.writeUInt32LE(imgData.length, 14);
  icoDir.writeUInt32LE(22, 18);
  return Buffer.concat([icoDir, imgData]);
}

if (!fs.existsSync(distDir)) {
  throw new Error('dist/ not found. Run "npm run build" first.');
}

fs.mkdirSync(tmpDir, { recursive: true });
const entries = collectFiles(distDir);

const chunks = [];
const head = Buffer.alloc(2);
head.writeUInt16LE(entries.length, 0);
chunks.push(head);
for (const e of entries) {
  const rBuf = Buffer.from(e.route, 'utf8');
  const mBuf = Buffer.from(e.mime, 'utf8');
  const hdr = Buffer.alloc(8 + rBuf.length + mBuf.length);
  hdr.writeUInt16LE(rBuf.length, 0);
  rBuf.copy(hdr, 2);
  hdr.writeUInt16LE(mBuf.length, 2 + rBuf.length);
  mBuf.copy(hdr, 4 + rBuf.length);
  hdr.writeUInt32LE(e.buf.length, 4 + rBuf.length + mBuf.length);
  chunks.push(hdr, e.buf);
}

const gzPack = zlib.gzipSync(Buffer.concat(chunks), { level: 9 });
const packPath = path.join(tmpDir, 'pack.gz');
fs.writeFileSync(packPath, gzPack);

const staticIco = path.join(root, 'scripts', 'race2026.ico');
const icoPath = fs.existsSync(staticIco) ? staticIco : path.join(tmpDir, 'race.ico');
if (icoPath !== staticIco) fs.writeFileSync(icoPath, makeIconIco());

const csSource = `using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Runtime.InteropServices.ComTypes;
using System.Text;
using System.Windows.Forms;
using Microsoft.Win32;

namespace Race2026 {
  [StructLayout(LayoutKind.Sequential)]
  struct RECT { public int left, top, right, bottom; }

  [ComImport, Guid("4e8a3389-c9d8-4bd2-b6b5-124fee6cc14d"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface IEnvCompletedHandler {
    [PreserveSig] int Invoke(int result, [MarshalAs(UnmanagedType.Interface)] ICoreWebView2Environment env);
  }

  [ComImport, Guid("6c4819f3-c9b7-4260-8127-c9f5bde7f68c"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface ICtrlCompletedHandler {
    [PreserveSig] int Invoke(int result, [MarshalAs(UnmanagedType.Interface)] ICoreWebView2Controller ctrl);
  }

  [ComImport, Guid("ab00b74c-15f1-4646-80e8-e76341d25d71"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface IWebResourceRequestedHandler {
    [PreserveSig] int Invoke([MarshalAs(UnmanagedType.Interface)] ICoreWebView2 sender, [MarshalAs(UnmanagedType.Interface)] ICoreWebView2WebResourceRequestedEventArgs args);
  }

  [ComImport, Guid("b96d755e-0319-4e92-a296-23436f46a1fc"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface ICoreWebView2Environment {
    void CreateCoreWebView2Controller(IntPtr parentWindow, [MarshalAs(UnmanagedType.Interface)] ICtrlCompletedHandler handler);
    [return: MarshalAs(UnmanagedType.Interface)]
    object CreateWebResourceResponse(IStream content, int statusCode, [MarshalAs(UnmanagedType.LPWStr)] string reasonPhrase, [MarshalAs(UnmanagedType.LPWStr)] string headers);
    void _getBrowserVersion();
    void _addNewBrowserVersion();
    void _remNewBrowserVersion();
  }

  [ComImport, Guid("4d00c0d1-9434-4eb6-8078-8697a560334f"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface ICoreWebView2Controller {
    int get_IsVisible();
    void set_IsVisible(int visible);
    RECT get_Bounds();
    void set_Bounds(RECT bounds);
    double get_ZoomFactor();
    void set_ZoomFactor(double zoomFactor);
    void _09(); void _10(); void _11(); void _12(); void _13(); void _14(); void _15();
    void _16(); void _17(); void _18(); void _19(); void _20(); void _21(); void _22();
    void NotifyParentWindowPositionChanged();
    void Close();
    [return: MarshalAs(UnmanagedType.Interface)]
    ICoreWebView2 get_CoreWebView2();
  }

  [ComImport, Guid("e562e4f0-d7fa-43ac-8d71-c05150499f00"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface ICoreWebView2Settings {
    int get_IsScriptEnabled(); void set_IsScriptEnabled(int v);
    int get_IsWebMessageEnabled(); void set_IsWebMessageEnabled(int v);
    int get_AreDefaultScriptDialogsEnabled(); void set_AreDefaultScriptDialogsEnabled(int v);
    int get_IsStatusBarEnabled(); void set_IsStatusBarEnabled(int v);
    int get_AreDevToolsEnabled(); void set_AreDevToolsEnabled(int v);
    int get_AreDefaultContextMenusEnabled(); void set_AreDefaultContextMenusEnabled(int v);
    int get_AreHostObjectsAllowed(); void set_AreHostObjectsAllowed(int v);
    int get_IsZoomControlEnabled(); void set_IsZoomControlEnabled(int v);
    int get_IsBuiltInErrorPageEnabled(); void set_IsBuiltInErrorPageEnabled(int v);
  }

  [ComImport, Guid("97055cd4-512c-4264-8b5f-e3f446cea6a5"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface ICoreWebView2WebResourceRequest {
    [return: MarshalAs(UnmanagedType.LPWStr)]
    string get_uri();
  }

  [ComImport, Guid("453e667f-12c7-49d4-be6d-ddbe7956f57a"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface ICoreWebView2WebResourceRequestedEventArgs {
    [return: MarshalAs(UnmanagedType.Interface)]
    ICoreWebView2WebResourceRequest get_Request();
    [return: MarshalAs(UnmanagedType.Interface)]
    object get_Response();
    void set_Response([MarshalAs(UnmanagedType.Interface)] object response);
  }

  [ComImport, Guid("76eceacb-0462-4d94-ac83-423a6793775e"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  interface ICoreWebView2 {
    [return: MarshalAs(UnmanagedType.Interface)]
    ICoreWebView2Settings get_Settings();
    [return: MarshalAs(UnmanagedType.LPWStr)]
    string get_Source();
    void Navigate([MarshalAs(UnmanagedType.LPWStr)] string uri);
    void NavigateToString([MarshalAs(UnmanagedType.LPWStr)] string htmlContent);
    void _07(); void _08(); void _09(); void _10(); void _11(); void _12();
    void _13(); void _14(); void _15(); void _16(); void _17(); void _18();
    void _19(); void _20(); void _21(); void _22(); void _23(); void _24();
    void _25(); void _26(); void _27(); void _28(); void _29(); void _30();
    void _31(); void _32(); void _33(); void _34(); void _35(); void _36();
    void _37(); void _38(); void _39(); void _40(); void _41(); void _42();
    void _43(); void _44(); void _45(); void _46(); void _47(); void _48();
    void _49(); void _50(); void _51(); void _52(); void _53(); void _54();
    void add_WebResourceRequested([MarshalAs(UnmanagedType.Interface)] IWebResourceRequestedHandler handler, out long token);
    void remove_WebResourceRequested(long token);
    void AddWebResourceRequestedFilter([MarshalAs(UnmanagedType.LPWStr)] string uri, int resourceContext);
  }

  class GameForm : Form, IEnvCompletedHandler, ICtrlCompletedHandler, IWebResourceRequestedHandler {
    [DllImport("user32.dll")] static extern bool SetProcessDPIAware();
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode)] static extern IntPtr LoadLibrary(string path);
    [DllImport("kernel32.dll", CharSet = CharSet.Ansi)] static extern IntPtr GetProcAddress(IntPtr mod, string name);
    [DllImport("shlwapi.dll")] [return: MarshalAs(UnmanagedType.Interface)] static extern IStream SHCreateMemStream(byte[] pInit, uint cbInit);

    [UnmanagedFunctionPointer(CallingConvention.StdCall)]
    delegate int CreateEnvFn(
      [MarshalAs(UnmanagedType.Bool)] bool check,
      int runtimeType,
      [MarshalAs(UnmanagedType.LPWStr)] string userDataFolder,
      IntPtr options,
      [MarshalAs(UnmanagedType.Interface)] IEnvCompletedHandler handler);

    struct Asset { public string Mime; public byte[] Data; }
    readonly Dictionary<string, Asset> assets = new Dictionary<string, Asset>(StringComparer.Ordinal);
    ICoreWebView2Environment env;
    ICoreWebView2Controller ctrl;
    ICoreWebView2 webview;
    long reqToken;
    bool isDragging;
    Point dragMouseStart;
    Point dragFormStart;

    protected override CreateParams CreateParams {
      get {
        var cp = base.CreateParams;
        cp.ClassStyle |= 0x00020000; // CS_DROPSHADOW
        return cp;
      }
    }

    GameForm() {
      Text = "汽车赛·世纪 — RACE 2026";
      FormBorderStyle = FormBorderStyle.None;
      BackColor = Color.FromArgb(217, 213, 201);
      var wa = Screen.PrimaryScreen.WorkingArea;
      double scale = Math.Min(1.0, Math.Min((wa.Width - 32) / 1180.0, (wa.Height - 48) / 780.0));
      int w = Math.Max(720, (int)Math.Round(1180 * scale));
      int h = Math.Max(476, (int)Math.Round(780 * scale));
      ClientSize = new Size(w, h);
      MinimumSize = new Size(720, 476);
      StartPosition = FormStartPosition.CenterScreen;
      Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
      LoadPack();
      Shown += (s, e) => InitWebView();
      Resize += (s, e) => FitBounds();
      FormClosing += (s, e) => { if (ctrl != null) try { ctrl.Close(); } catch { } };
    }

    void LoadPack() {
      using (var res = Assembly.GetExecutingAssembly().GetManifestResourceStream("pack.gz"))
      using (var gz = new GZipStream(res, CompressionMode.Decompress))
      using (var br = new BinaryReader(gz, Encoding.UTF8)) {
        int count = br.ReadUInt16();
        for (int i = 0; i < count; i++) {
          string route = Encoding.UTF8.GetString(br.ReadBytes(br.ReadUInt16()));
          string mime = Encoding.UTF8.GetString(br.ReadBytes(br.ReadUInt16()));
          byte[] data = br.ReadBytes(br.ReadInt32());
          assets[route] = new Asset { Mime = mime, Data = data };
        }
      }
    }

    static string FindRuntimeDll() {
      string arch = IntPtr.Size == 8 ? "x64" : "x86";
      string[] roots = {
        (string)Registry.GetValue(@"HKEY_LOCAL_MACHINE\\SOFTWARE\\WOW6432Node\\Microsoft\\EdgeUpdate\\Clients\\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}", "location", null),
        (string)Registry.GetValue(@"HKEY_CURRENT_USER\\Software\\Microsoft\\EdgeUpdate\\Clients\\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}", "location", null),
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\\EdgeWebView\\Application"),
      };
      foreach (string r in roots) {
        if (string.IsNullOrEmpty(r) || !Directory.Exists(r)) continue;
        foreach (string dir in Directory.GetDirectories(r)) {
          string p = Path.Combine(dir, @"EBWebView\\" + arch + @"\\EmbeddedBrowserWebView.dll");
          if (File.Exists(p)) return p;
        }
      }
      return null;
    }

    void InitWebView() {
      string dll = FindRuntimeDll();
      if (dll == null) {
        MessageBox.Show("未检测到 Microsoft Edge WebView2 运行时，请先安装后重试。", "Race 2026", MessageBoxButtons.OK, MessageBoxIcon.Warning);
        Close();
        return;
      }
      IntPtr mod = LoadLibrary(dll);
      IntPtr fnPtr = mod != IntPtr.Zero ? GetProcAddress(mod, "CreateWebViewEnvironmentWithOptionsInternal") : IntPtr.Zero;
      if (fnPtr == IntPtr.Zero) {
        MessageBox.Show("无法初始化桌面渲染组件 (WebView2)。", "Race 2026", MessageBoxButtons.OK, MessageBoxIcon.Error);
        Close();
        return;
      }
      string udata = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Race2026\\WebView2");
      Directory.CreateDirectory(udata);
      var fn = (CreateEnvFn)Marshal.GetDelegateForFunctionPointer(fnPtr, typeof(CreateEnvFn));
      int hr = fn(false, 0, udata, IntPtr.Zero, this);
      if (hr != 0) {
        MessageBox.Show("启动窗口失败 (0x" + hr.ToString("X8") + ")。", "Race 2026", MessageBoxButtons.OK, MessageBoxIcon.Error);
        Close();
      }
    }

    public int Invoke(int result, ICoreWebView2Environment createdEnv) {
      if (result != 0 || createdEnv == null) return 0;
      env = createdEnv;
      env.CreateCoreWebView2Controller(Handle, this);
      return 0;
    }

    public int Invoke(int result, ICoreWebView2Controller createdCtrl) {
      if (result != 0 || createdCtrl == null) return 0;
      ctrl = createdCtrl;
      webview = ctrl.get_CoreWebView2();
      var st = webview.get_Settings();
      st.set_AreDevToolsEnabled(0);
      st.set_IsStatusBarEnabled(0);
      st.set_AreDefaultContextMenusEnabled(0);
      st.set_IsZoomControlEnabled(0);
      webview.AddWebResourceRequestedFilter("https://race2026.app/*", 0);
      webview.add_WebResourceRequested(this, out reqToken);
      FitBounds();
      ctrl.set_IsVisible(1);
      webview.Navigate("https://race2026.app/");
      return 0;
    }

    public int Invoke(ICoreWebView2 sender, ICoreWebView2WebResourceRequestedEventArgs args) {
      try {
        string uri = args.get_Request().get_uri();
        var u = new Uri(uri);
        string p = u.AbsolutePath;
        if (p.StartsWith("/__win/", StringComparison.Ordinal)) {
          string cmd = p.Substring(7);
          if (cmd == "dragStart") {
            BeginInvoke((Action)(() => {
              isDragging = (WindowState == FormWindowState.Normal);
              if (isDragging) {
                dragMouseStart = Cursor.Position;
                dragFormStart = Location;
              }
            }));
          } else if (cmd == "dragMove") {
            BeginInvoke((Action)(() => {
              if (isDragging && WindowState == FormWindowState.Normal) {
                var cur = Cursor.Position;
                Location = new Point(dragFormStart.X + (cur.X - dragMouseStart.X), dragFormStart.Y + (cur.Y - dragMouseStart.Y));
              }
            }));
          } else if (cmd == "dragEnd") {
            BeginInvoke((Action)(() => { isDragging = false; }));
          } else if (cmd == "minimize") {
            BeginInvoke((Action)(() => { WindowState = FormWindowState.Minimized; }));
          } else if (cmd == "maximize") {
            BeginInvoke((Action)(() => {
              var scr = Screen.FromControl(this);
              var wa = scr.WorkingArea;
              MaximizedBounds = new Rectangle(wa.X - scr.Bounds.X, wa.Y - scr.Bounds.Y, wa.Width, wa.Height);
              WindowState = (WindowState == FormWindowState.Maximized) ? FormWindowState.Normal : FormWindowState.Maximized;
            }));
          } else if (cmd == "close") {
            BeginInvoke((Action)(() => Close()));
          }
          IStream emptyOk = SHCreateMemStream(new byte[0], 0);
          args.set_Response(env.CreateWebResourceResponse(emptyOk, 200, "OK", "Content-Type: text/plain\\r\\nCache-Control: no-store"));
          return 0;
        }
        if (p == "/index.html") p = "/";
        Asset asset;
        if (assets.TryGetValue(p, out asset)) {
          IStream stream = SHCreateMemStream(asset.Data, (uint)asset.Data.Length);
          object resp = env.CreateWebResourceResponse(stream, 200, "OK", "Content-Type: " + asset.Mime + "\\r\\nCache-Control: no-cache");
          args.set_Response(resp);
        } else {
          IStream empty = SHCreateMemStream(new byte[0], 0);
          args.set_Response(env.CreateWebResourceResponse(empty, 404, "Not Found", ""));
        }
      } catch { }
      return 0;
    }

    void FitBounds() {
      if (ctrl == null) return;
      var c = ClientSize;
      ctrl.set_Bounds(new RECT { left = 0, top = 0, right = c.Width, bottom = c.Height });
    }

    [STAThread]
    static void Main() {
      SetProcessDPIAware();
      Application.EnableVisualStyles();
      Application.SetCompatibleTextRenderingDefault(false);
      Application.Run(new GameForm());
    }
  }
}
`;

const csPath = path.join(tmpDir, 'RaceApp.cs');
fs.writeFileSync(csPath, csSource, 'utf8');

const csc = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';
if (!fs.existsSync(csc)) {
  throw new Error('C# compiler not found at ' + csc);
}
const exeOut = path.join(outDir, 'Race2026.exe');
execFileSync(csc, [
  '/nologo',
  '/platform:x64',
  '/target:winexe',
  '/optimize+',
  `/win32icon:${icoPath}`,
  `/out:${exeOut}`,
  `/resource:${packPath},pack.gz`,
  csPath,
], { stdio: 'inherit' });

fs.rmSync(tmpDir, { recursive: true, force: true });

const exeSize = fs.statSync(exeOut).size;
console.log(`Built ${path.relative(root, exeOut)}: ${(exeSize / 1024).toFixed(1)} KB (${exeSize} bytes) from ${entries.length} packed assets.`);

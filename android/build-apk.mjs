import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const androidDir = path.join(root, 'android');
const buildDir = path.join(androidDir, 'build');
const outDir = path.join(root, 'game');

function findSdk() {
  const candidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk'),
  ].filter(Boolean);
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('未找到 Android SDK，请设置 ANDROID_HOME');
}

function pickVersion(parent, prefix) {
  const items = fs.readdirSync(parent).filter((n) => n.startsWith(prefix));
  if (!items.length) throw new Error(`未在 ${parent} 找到 ${prefix}*`);
  const ver = (s) => s.replace(prefix, '').split(/[.-]/).map((x) => parseInt(x, 10) || 0);
  items.sort((a, b) => {
    const va = ver(a), vb = ver(b);
    for (let i = 0; i < Math.max(va.length, vb.length); i++) {
      if ((va[i] || 0) !== (vb[i] || 0)) return (va[i] || 0) - (vb[i] || 0);
    }
    return 0;
  });
  return items[items.length - 1];
}

function findJava() {
  if (process.env.JAVA_HOME && fs.existsSync(path.join(process.env.JAVA_HOME, 'bin', 'java.exe'))) {
    return process.env.JAVA_HOME;
  }
  try {
    const out = execFileSync('where', ['java'], { encoding: 'utf8' }).split(/\r?\n/)[0].trim();
    if (out) return path.dirname(path.dirname(out));
  } catch { /* ignore */ }
  throw new Error('未找到 JDK 17+，请设置 JAVA_HOME');
}

function run(cmd, args, opts = {}) {
  execFileSync(cmd, args, { stdio: 'inherit', cwd: root, ...opts });
}

if (!fs.existsSync(distDir)) throw new Error('dist/ 不存在，请先运行 npm run build');

const sdk = findSdk();
const javaHome = findJava();
const buildTools = path.join(sdk, 'build-tools', pickVersion(path.join(sdk, 'build-tools'), ''));
const platformName = pickVersion(path.join(sdk, 'platforms'), 'android-');
const androidJar = path.join(sdk, 'platforms', platformName, 'android.jar');
const aapt2 = path.join(buildTools, 'aapt2.exe');
const zipalign = path.join(buildTools, 'zipalign.exe');
const d8Jar = path.join(buildTools, 'lib', 'd8.jar');
const apksignerJar = path.join(buildTools, 'lib', 'apksigner.jar');
const java = path.join(javaHome, 'bin', 'java.exe');
const javac = path.join(javaHome, 'bin', 'javac.exe');
const jar = path.join(javaHome, 'bin', 'jar.exe');

for (const p of [aapt2, zipalign, d8Jar, apksignerJar, androidJar]) {
  if (!fs.existsSync(p)) throw new Error('缺少构建组件: ' + p);
}

const keystore = process.env.RACE2026_KEYSTORE || path.join(os.homedir(), '.android', 'debug.keystore');
if (!fs.existsSync(keystore)) {
  throw new Error('未找到签名证书: ' + keystore + '（可设置 RACE2026_KEYSTORE）');
}

fs.rmSync(buildDir, { recursive: true, force: true });
const assetsDir = path.join(buildDir, 'assets');
const wwwDir = path.join(assetsDir, 'www');
const classesDir = path.join(buildDir, 'classes');
const dexDir = path.join(buildDir, 'dex');
fs.mkdirSync(wwwDir, { recursive: true });
fs.cpSync(distDir, wwwDir, { recursive: true });

const resZip = path.join(buildDir, 'res.zip');
run(aapt2, ['compile', '--dir', path.join(androidDir, 'res'), '-o', resZip]);

const baseApk = path.join(buildDir, 'base.apk');
run(aapt2, [
  'link', '-o', baseApk,
  '-I', androidJar,
  '--manifest', path.join(androidDir, 'AndroidManifest.xml'),
  '-A', assetsDir,
  resZip,
]);

const javaFiles = [];
const javaRoot = path.join(androidDir, 'java');
(function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full);
    else if (ent.name.endsWith('.java')) javaFiles.push(full);
  }
})(javaRoot);

run(javac, ['--release', '8', '-encoding', 'UTF-8', '-classpath', androidJar, '-d', classesDir, ...javaFiles]);

const classFiles = [];
(function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full);
    else if (ent.name.endsWith('.class')) classFiles.push(full);
  }
})(classesDir);

fs.mkdirSync(dexDir, { recursive: true });
run(java, ['-cp', d8Jar, 'com.android.tools.r8.D8', '--lib', androidJar, '--min-api', '23', '--output', dexDir, ...classFiles]);

run(jar, ['--update', '--file', baseApk, '-C', dexDir, 'classes.dex']);

const aligned = path.join(buildDir, 'aligned.apk');
run(zipalign, ['-f', '4', baseApk, aligned]);

fs.mkdirSync(outDir, { recursive: true });
const outApk = path.join(outDir, 'Race2026.apk');
run(java, [
  '-jar', apksignerJar, 'sign',
  '--ks', keystore,
  '--ks-pass', 'pass:android',
  '--key-pass', 'pass:android',
  '--ks-key-alias', 'androiddebugkey',
  '--out', outApk,
  aligned,
]);
run(java, ['-jar', apksignerJar, 'verify', '--print-certs', outApk]);

const size = fs.statSync(outApk).size;
console.log(`Built ${path.relative(root, outApk)}: ${(size / 1024 / 1024).toFixed(1)} MB`);

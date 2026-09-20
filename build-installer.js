const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('=== Building Orbit Launcher Installer ===');

try {
  execSync('taskkill /F /IM OrbitLauncher.exe /T', { stdio: 'ignore' });
} catch (e) {}

console.log('[1/4] Packaging Electron application...');
execSync('npm run build', { stdio: 'inherit', cwd: __dirname });

console.log('[2/4] Copying bundled assets into dist...');
const distDir = path.join(__dirname, '..', 'dist', 'OrbitLauncher-win32-x64');
const iconIco = path.join(__dirname, 'icon.ico');
if (fs.existsSync(iconIco)) {
  fs.copyFileSync(iconIco, path.join(distDir, 'icon.ico'));
}
const iconPng = path.join(__dirname, 'icon.png');
if (fs.existsSync(iconPng)) {
  fs.copyFileSync(iconPng, path.join(distDir, 'icon.png'));
}
const runtimeSrc = path.join(__dirname, 'runtime');
if (fs.existsSync(runtimeSrc)) {
  const runtimeDst = path.join(distDir, 'runtime');
  fs.cpSync(runtimeSrc, runtimeDst, { recursive: true });
}
const assetsSrc = path.join(__dirname, 'assets');
if (fs.existsSync(assetsSrc)) {
  const assetsDst = path.join(distDir, 'assets');
  fs.cpSync(assetsSrc, assetsDst, { recursive: true });
}

console.log('[3/4] Compiling Windows setup with Inno Setup 6...');
const isccPaths = [
  'C:\\Users\\Atuka\\AppData\\Local\\Programs\\Inno Setup 6\\ISCC.exe',
  'C:\\Program Files (x86)\\Inno Setup 6\\ISCC.exe',
  'C:\\Program Files\\Inno Setup 6\\ISCC.exe'
];
let isccExe = isccPaths.find(p => fs.existsSync(p)) || 'iscc';
const issFile = path.join(__dirname, 'installer.iss');
execSync(`"${isccExe}" "${issFile}"`, { stdio: 'inherit' });

const setupExe = path.join(__dirname, '..', 'OrbitLauncher-Setup.exe');
if (fs.existsSync(setupExe)) {
  const stats = fs.statSync(setupExe);
  console.log(`[4/4] SUCCESS! Installer built at: ${setupExe}`);
  console.log(`Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
} else {
  console.error('[!] Warning: Setup exe not found at expected location.');
}

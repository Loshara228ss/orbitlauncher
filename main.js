const { app, BrowserWindow, ipcMain, shell, dialog, clipboard, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const net = require('net');
const crypto = require('crypto');
const { spawn, execSync, spawnSync } = require('child_process');
const AdmZip = require('adm-zip');
const { Client } = require('minecraft-launcher-core');

function getOfflinePlayerUUID(username) {
  const cleanName = (username || 'Player').trim();
  const hash = crypto.createHash('md5').update('OfflinePlayer:' + cleanName).digest();
  hash[6] = (hash[6] & 0x0f) | 0x30; // UUID version 3
  hash[8] = (hash[8] & 0x3f) | 0x80; // IETF variant
  const hex = hash.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function getConfigFile() {
  const userDir = app.getPath('userData');
  if (!fs.existsSync(userDir)) {
    try { fs.mkdirSync(userDir, { recursive: true }); } catch (e) {}
  }
  return path.join(userDir, 'config.json');
}

function findFpsBoosterJar() {
  const candidates = [
    path.join(__dirname, 'assets', 'fpsbooster-1.0.0.jar'),
    path.join(__dirname, 'fpsbooster-1.0.0.jar'),
    path.join(__dirname, '..', 'fpsbooster-1.0.0.jar'),
    path.join(process.resourcesPath || '', 'fpsbooster-1.0.0.jar'),
    path.join(path.dirname(process.execPath), 'fpsbooster-1.0.0.jar'),
    path.join(path.dirname(process.execPath), 'resources', 'fpsbooster-1.0.0.jar'),
    path.join(__dirname, '..', 'fpsbooster', 'build', 'libs', 'fpsbooster-1.0.0.jar'),
    path.join(path.dirname(process.execPath), '..', 'fpsbooster', 'build', 'libs', 'fpsbooster-1.0.0.jar'),
    path.join(path.dirname(process.execPath), 'fpsbooster', 'build', 'libs', 'fpsbooster-1.0.0.jar'),
    'C:\\Users\\Atuka\\Desktop\\Idk\\fpsbooster\\build\\libs\\fpsbooster-1.0.0.jar'
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  return null;
}

function detectDefaultGameDir() {
  const tlDir = path.join(process.env.APPDATA || '', '.tlauncher', 'legacy', 'Minecraft', 'game');
  if (fs.existsSync(tlDir)) return tlDir;
  const mcDir = path.join(process.env.APPDATA || '', '.minecraft');
  if (!fs.existsSync(mcDir)) {
    try { fs.mkdirSync(mcDir, { recursive: true }); } catch (e) {}
  }
  return mcDir;
}

function getJavaMajor(exePath) {
  if (!exePath) return 0;
  try {
    const { spawnSync } = require('child_process');
    const res = spawnSync(exePath, ['-version'], { encoding: 'utf8' });
    const out = (res.stderr || '') + (res.stdout || '');
    const m = out.match(/version "([^"]+)"/);
    if (m) {
      const v = m[1];
      return v.startsWith('1.') ? parseInt(v.split('.')[1], 10) : parseInt(v.split('.')[0], 10);
    }
  } catch (e) {}
  return 0;
}

function detectDefaultJavaPath() {
  // 1. Check bundled runtime in launcher folder
  const bundledCandidates = [
    path.join(path.dirname(process.execPath), 'runtime', 'java-21', 'bin', 'javaw.exe'),
    path.join(process.resourcesPath || '', 'runtime', 'java-21', 'bin', 'javaw.exe'),
    path.join(__dirname, 'runtime', 'java-21', 'bin', 'javaw.exe'),
    path.join(__dirname, '..', 'runtime', 'java-21', 'bin', 'javaw.exe'),
    path.join(app.getPath('userData'), 'runtime', 'java-21', 'bin', 'javaw.exe')
  ];
  for (const b of bundledCandidates) {
    if (b && fs.existsSync(b) && getJavaMajor(b) >= 21) return b;
  }

  const tlJava = path.join(
    process.env.APPDATA || '',
    '.tlauncher', 'legacy', 'Minecraft', 'jre', 'java-runtime-delta', 'windows-x64', 'java-runtime-delta', 'bin', 'javaw.exe'
  );
  if (fs.existsSync(tlJava) && getJavaMajor(tlJava) >= 21) return tlJava;

  const mojangDelta = path.join(process.env.APPDATA || '', '.minecraft', 'runtime', 'java-runtime-delta', 'windows-x64', 'java-runtime-delta', 'bin', 'javaw.exe');
  if (fs.existsSync(mojangDelta) && getJavaMajor(mojangDelta) >= 21) return mojangDelta;

  const mojangGamma = path.join(process.env.APPDATA || '', '.minecraft', 'runtime', 'java-runtime-gamma', 'windows-x64', 'java-runtime-gamma', 'bin', 'javaw.exe');
  if (fs.existsSync(mojangGamma)) return mojangGamma;

  const searchRoots = [
    'C:\\Program Files\\Java',
    'C:\\Program Files\\Eclipse Adoptium',
    'C:\\Program Files\\Microsoft',
    'C:\\Program Files\\BellSoft',
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Eclipse Adoptium')
  ];

  for (const root of searchRoots) {
    try {
      if (fs.existsSync(root)) {
        const dirs = fs.readdirSync(root);
        for (const dir of dirs) {
          const candidate = path.join(root, dir, 'bin', 'javaw.exe');
          if (fs.existsSync(candidate) && getJavaMajor(candidate) >= 21) return candidate;
        }
      }
    } catch (e) {}
  }

  for (const root of searchRoots) {
    try {
      if (fs.existsSync(root)) {
        const dirs = fs.readdirSync(root);
        for (const dir of dirs) {
          const candidate = path.join(root, dir, 'bin', 'javaw.exe');
          if (fs.existsSync(candidate)) return candidate;
        }
      }
    } catch (e) {}
  }

  return 'javaw';
}

const DEFAULT_CONFIG = {
  username: 'Player',
  selectedVersion: 'Fabric 1.21.4',
  ramGb: 4,
  gameDir: detectDefaultGameDir(),
  javaPath: detectDefaultJavaPath(),
  autoCloseOnLaunch: false,
  gpuOptimized: true
};

function loadConfig() {
  const configFile = getConfigFile();
  const baseConfig = { ...DEFAULT_CONFIG };
  try {
    // If userData config does not exist, check if legacy config exists to migrate once
    if (!fs.existsSync(configFile)) {
      const legacyCandidates = [
        path.join(path.dirname(process.execPath), 'config.json'),
        path.join(__dirname, 'config.json')
      ];
      for (const leg of legacyCandidates) {
        if (fs.existsSync(leg)) {
          try {
            const raw = fs.readFileSync(leg, 'utf8');
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
              fs.writeFileSync(configFile, JSON.stringify({ ...baseConfig, ...parsed }, null, 2), 'utf8');
              break;
            }
          } catch (e) {}
        }
      }
    }

    if (fs.existsSync(configFile)) {
      const data = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      if (data.gameDir && !fs.existsSync(data.gameDir)) {
        data.gameDir = detectDefaultGameDir();
      }
      return { ...baseConfig, ...data };
    }
  } catch (err) {
    console.error('Failed to read config:', err);
  }
  return { ...baseConfig };
}

function saveConfig(config) {
  const configFile = getConfigFile();
  try {
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Failed to save config:', err);
    return false;
  }
}

function patchMclcNativePath() {
  try {
    const handlerFile = path.join(__dirname, 'node_modules', 'minecraft-launcher-core', 'components', 'handler.js');
    if (fs.existsSync(handlerFile)) {
      let content = fs.readFileSync(handlerFile, 'utf8');
      const buggy = "const name = native.path.split('/').pop()";
      const fixed = "const name = native.path ? native.path.split('/').pop() : (native.url ? native.url.split('/').pop() : 'native.jar')";
      if (content.includes(buggy)) {
        content = content.replace(buggy, fixed);
        fs.writeFileSync(handlerFile, content, 'utf8');
        console.log('[MCLC Patcher]: Patched legacy native path handler.');
      }
    }
  } catch (err) {
    console.error('[MCLC Patcher Error]:', err);
  }
}
patchMclcNativePath();

const ALL_OFFICIAL_RELEASES = [
  '26.3', '26.2', '26.1.2', '26.1.1', '26.1',
  '1.21.11', '1.21.10', '1.21.9', '1.21.8', '1.21.7', '1.21.6', '1.21.5', '1.21.4', '1.21.3', '1.21.2', '1.21.1', '1.21',
  '1.20.6', '1.20.5', '1.20.4', '1.20.3', '1.20.2', '1.20.1', '1.20',
  '1.19.4', '1.19.3', '1.19.2', '1.19.1', '1.19',
  '1.18.2', '1.18.1', '1.18',
  '1.17.1', '1.17',
  '1.16.5', '1.16.4', '1.16.3', '1.16.2', '1.16.1', '1.16',
  '1.15.2', '1.15.1', '1.15',
  '1.14.4', '1.14.3', '1.14.2', '1.14.1', '1.14',
  '1.13.2', '1.13.1', '1.13',
  '1.12.2', '1.12.1', '1.12',
  '1.11.2', '1.11.1', '1.11',
  '1.10.2', '1.10.1', '1.10',
  '1.9.4', '1.9.3', '1.9.2', '1.9.1', '1.9',
  '1.8.9', '1.8.8', '1.8.7', '1.8.6', '1.8.5', '1.8.4', '1.8.3', '1.8.2', '1.8.1', '1.8',
  '1.7.10', '1.7.9', '1.7.8', '1.7.7', '1.7.6', '1.7.5', '1.7.4', '1.7.3', '1.7.2',
  '1.6.4', '1.6.2', '1.6.1',
  '1.5.2', '1.5.1',
  '1.4.7', '1.4.6', '1.4.5', '1.4.4', '1.4.2',
  '1.3.2', '1.3.1',
  '1.2.5', '1.2.4', '1.2.3', '1.2.2', '1.2.1',
  '1.1', '1.0'
];

const POPULAR_OPTIFINE_RELEASES = ALL_OFFICIAL_RELEASES
  .filter(v => {
    const p = v.split('.');
    return v.startsWith('26.') || (p[0] === '1' && parseInt(p[1], 10) >= 5);
  })
  .map(v => `OptiFine ${v}`);

const POPULAR_FORGE_RELEASES = ALL_OFFICIAL_RELEASES
  .filter(v => {
    const p = v.split('.');
    return v.startsWith('26.') || (p[0] === '1' && parseInt(p[1], 10) >= 5);
  })
  .map(v => `Forge ${v}`);

const POPULAR_NEOFORGE_RELEASES = [
  'NeoForge 1.21.4',
  'NeoForge 1.21.3',
  'NeoForge 1.21.1',
  'NeoForge 1.21',
  'NeoForge 1.20.6',
  'NeoForge 1.20.4',
  'NeoForge 1.20.2'
];

const FALLBACK_FABRIC_RELEASES = ALL_OFFICIAL_RELEASES
  .filter(v => {
    const p = v.split('.');
    return v.startsWith('26.') || (p[0] === '1' && parseInt(p[1], 10) >= 14);
  })
  .map(v => `Fabric ${v}`);

const FALLBACK_MOJANG_RELEASES = [...ALL_OFFICIAL_RELEASES];

function sanitizeVersionJson(gameDir, versionName) {
  try {
    const jsonPath = path.join(gameDir, 'versions', versionName, `${versionName}.json`);
    if (!fs.existsSync(jsonPath)) return;
    const raw = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(raw);
    let modified = false;

    if (Array.isArray(data.libraries)) {
      // 1. If Fabric/Knot, remove conflicting duplicate ASM (keep 9.10.1, remove 9.6)
      const isFabric = (versionName && versionName.toLowerCase().includes('fabric')) ||
                       (data.mainClass && data.mainClass.includes('knot'));
      if (isFabric) {
        const asmCoreLibs = data.libraries.filter(l => l && l.name && l.name.startsWith('org.ow2.asm:asm:'));
        if (asmCoreLibs.length > 1) {
          data.libraries = data.libraries.filter(l => !(l && l.name && l.name.startsWith('org.ow2.asm:asm:9.6')));
          modified = true;
        }
      }

      // 2. Fix missing native path in classifiers to avoid legacy extraction crash
      for (const lib of data.libraries) {
        if (lib && lib.downloads && lib.downloads.classifiers) {
          for (const key of Object.keys(lib.downloads.classifiers)) {
            const classifier = lib.downloads.classifiers[key];
            if (classifier && !classifier.path && classifier.url) {
              const urlParts = classifier.url.split('/');
              classifier.path = urlParts[urlParts.length - 1];
              modified = true;
            }
          }
        }
      }
    }

    if (modified) {
      fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`[Sanitizer]: Cleaned up and verified ${versionName}.json`);
    }
  } catch (err) {
    console.error(`[Sanitizer Error] on ${versionName}:`, err);
  }
}

async function ensureFabricProfile(gameDir, selectedVersion) {
  const targetDir = path.join(gameDir, 'versions', selectedVersion);
  const targetJson = path.join(targetDir, `${selectedVersion}.json`);
  if (fs.existsSync(targetJson)) {
    sanitizeVersionJson(gameDir, selectedVersion);
    return true;
  }

  const match = selectedVersion.match(/(\d+\.\d+(\.\d+)?)/);
  if (!match) return false;
  const mcVer = match[1];

  try {
    let loaderVer = '0.19.5';
    try {
      const lRes = await fetch(`https://meta.fabricmc.net/v2/versions/loader/${mcVer}`);
      if (lRes.ok) {
        const loaders = await lRes.json();
        if (loaders && loaders[0] && loaders[0].loader && loaders[0].loader.version) {
          loaderVer = loaders[0].loader.version;
        }
      }
    } catch (e) {}

    const profileUrl = `https://meta.fabricmc.net/v2/versions/loader/${mcVer}/${loaderVer}/profile/json`;
    const pRes = await fetch(profileUrl);
    if (!pRes.ok) throw new Error(`Fabric profile fetch failed: HTTP ${pRes.status}`);

    const profileJson = await pRes.json();
    profileJson.id = selectedVersion;

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.writeFileSync(targetJson, JSON.stringify(profileJson, null, 2), 'utf8');
    sanitizeVersionJson(gameDir, selectedVersion);
    return true;
  } catch (err) {
    console.error(`Failed to auto-generate Fabric profile for ${selectedVersion}:`, err);
    return false;
  }
}

async function downloadWithProgressAndFallback(urls, label, sendStatus) {
  let lastErr = null;
  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'OrbitLauncher/1.0.7' }
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const totalBytes = parseInt(res.headers.get('content-length') || '0', 10);
      const reader = res.body.getReader();
      const chunks = [];
      let receivedBytes = 0;
      let lastReportTime = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        receivedBytes += value.length;

        const now = Date.now();
        if (now - lastReportTime > 300 || done) {
          lastReportTime = now;
          if (sendStatus) {
            const dlMb = (receivedBytes / (1024 * 1024)).toFixed(1);
            if (totalBytes > 0) {
              const totMb = (totalBytes / (1024 * 1024)).toFixed(1);
              const pct = Math.min(100, Math.round((receivedBytes / totalBytes) * 100));
              sendStatus(`${label} (${dlMb} / ${totMb} MB - ${pct}%)...`, 'info');
            } else {
              sendStatus(`${label} (${dlMb} MB)...`, 'info');
            }
          }
        }
      }

      return Buffer.concat(chunks.map(c => Buffer.from(c)));
    } catch (err) {
      console.warn(`[Download] Mirror failed (${url}):`, err.message);
      lastErr = err;
    }
  }
  throw lastErr || new Error('All download mirrors failed');
}

async function ensureBaseMinecraftJar(gameDir, mcVer, sendStatus) {
  const vDir = path.join(gameDir, 'versions', mcVer);
  const vJar = path.join(vDir, `${mcVer}.jar`);
  const vJson = path.join(vDir, `${mcVer}.json`);
  if (fs.existsSync(vJar) && fs.existsSync(vJson)) {
    return true;
  }
  if (!fs.existsSync(vDir)) fs.mkdirSync(vDir, { recursive: true });

  if (sendStatus) sendStatus(`Downloading base Minecraft ${mcVer} files...`, 'info');
  try {
    const mfRes = await fetch('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json');
    if (!mfRes.ok) throw new Error(`Manifest HTTP ${mfRes.status}`);
    const mf = await mfRes.json();
    const verEntry = (mf.versions || []).find(v => v.id === mcVer);
    if (!verEntry || !verEntry.url) throw new Error(`Version ${mcVer} not found in Mojang manifest`);

    const verRes = await fetch(verEntry.url);
    if (!verRes.ok) throw new Error(`Version metadata HTTP ${verRes.status}`);
    const verDetails = await verRes.json();
    fs.writeFileSync(vJson, JSON.stringify(verDetails, null, 2), 'utf8');

    if (verDetails.downloads && verDetails.downloads.client && verDetails.downloads.client.url) {
      const clientUrl = verDetails.downloads.client.url;
      const buf = await downloadWithProgressAndFallback(
        [clientUrl],
        `Downloading Minecraft ${mcVer} client jar`,
        sendStatus
      );
      fs.writeFileSync(vJar, buf);
    }
    return true;
  } catch (err) {
    console.error(`Failed to download base Minecraft ${mcVer}:`, err);
    return false;
  }
}

function ensureLauncherProfilesJson(gameDir) {
  const profilePath = path.join(gameDir, 'launcher_profiles.json');
  if (!fs.existsSync(profilePath)) {
    try {
      if (!fs.existsSync(gameDir)) fs.mkdirSync(gameDir, { recursive: true });
      fs.writeFileSync(profilePath, JSON.stringify({ profiles: {} }, null, 2), 'utf8');
      console.log('[Installer Helper]: Created missing launcher_profiles.json');
    } catch (e) {
      console.warn('Could not create launcher_profiles.json:', e);
    }
  }
}

function runInstallerClient(javaExe, installerJarPath, gameDir, sendStatus) {
  return new Promise((resolve, reject) => {
    ensureLauncherProfilesJson(gameDir);
    if (sendStatus) sendStatus('Preparing client libraries with loader installer...', 'info');

    let exec = javaExe || 'java';
    if (exec && exec.toLowerCase().endsWith('javaw.exe')) {
      const candidateJava = exec.slice(0, -9) + 'java.exe';
      if (fs.existsSync(candidateJava)) {
        exec = candidateJava;
      }
    }

    const child = spawn(exec, ['-jar', installerJarPath, '--installClient', gameDir], {
      windowsHide: true
    });
    let output = '';
    child.stdout.on('data', (d) => {
      const text = d.toString();
      output += text;
      const lastLine = text.trim().split('\n').pop();
      if (lastLine && sendStatus && (lastLine.includes('Extracting') || lastLine.includes('Downloading') || lastLine.includes('Patching') || lastLine.includes('Splitting') || lastLine.includes('Processor') || lastLine.includes('Task'))) {
        sendStatus(lastLine.trim(), 'debug');
      }
    });
    child.stderr.on('data', (d) => {
      output += d.toString();
    });
    child.on('close', (code) => {
      if (code === 0) {
        if (sendStatus) sendStatus('Client libraries successfully patched and installed!', 'success');
        resolve(true);
      } else {
        console.error('Installer exited with code', code, output);
        reject(new Error(`Installer failed with exit code ${code}`));
      }
    });
    child.on('error', (err) => {
      reject(err);
    });
  });
}

async function ensureForgeProfile(gameDir, selectedVersion, sendStatus) {
  const targetDir = path.join(gameDir, 'versions', selectedVersion);
  const targetJson = path.join(targetDir, `${selectedVersion}.json`);

  const match = selectedVersion.match(/(\d+\.\d+(\.\d+)?)/);
  if (!match) return false;
  const mcVer = match[1];

  const intSub = parseInt(mcVer.split('.')[1] || '0', 10);
  const isModernForge = intSub >= 17;

  ensureLauncherProfilesJson(gameDir);

  try {
    const res = await fetch(`https://bmclapi2.bangbang93.com/forge/minecraft/${mcVer}`);
    if (!res.ok) throw new Error(`Forge list HTTP ${res.status}`);
    const list = await res.json();
    if (!Array.isArray(list) || list.length === 0) throw new Error('No Forge versions found for ' + mcVer);

    const latest = list[list.length - 1] || list[0];
    const forgeVer = latest.version;
    const installersDir = path.join(gameDir, 'installers');
    if (!fs.existsSync(installersDir)) fs.mkdirSync(installersDir, { recursive: true });
    const installerFile = path.join(installersDir, `forge-${mcVer}-${forgeVer}-installer.jar`);

    const clientJar = path.join(gameDir, 'libraries', 'net', 'minecraftforge', 'forge', `${mcVer}-${forgeVer}`, `forge-${mcVer}-${forgeVer}-client.jar`);
    const isAlreadyInstalled = fs.existsSync(targetJson) && (!isModernForge || fs.existsSync(clientJar));
    if (isAlreadyInstalled) {
      sanitizeVersionJson(gameDir, selectedVersion);
      return true;
    }

    await ensureBaseMinecraftJar(gameDir, mcVer, sendStatus);

    if (!fs.existsSync(installerFile)) {
      const dlUrls = [
        `https://maven.minecraftforge.net/net/minecraftforge/forge/${mcVer}-${forgeVer}/forge-${mcVer}-${forgeVer}-installer.jar`,
        `https://bmclapi2.bangbang93.com/forge/download?mcversion=${mcVer}&version=${forgeVer}&category=installer&format=jar`
      ];

      const installerBuffer = await downloadWithProgressAndFallback(
        dlUrls,
        `Downloading Forge ${forgeVer} installer`,
        sendStatus
      );
      fs.writeFileSync(installerFile, installerBuffer);
    }

    // Extract version JSON immediately so the profile directory and JSON exist
    if (fs.existsSync(installerFile)) {
      try {
        const zip = new AdmZip(installerFile);
        const vEntry = zip.getEntry('version.json');
        if (vEntry) {
          const vJson = JSON.parse(vEntry.getData().toString('utf8'));
          vJson.id = selectedVersion;
          if (!vJson.inheritsFrom) vJson.inheritsFrom = mcVer;
          if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
          fs.writeFileSync(targetJson, JSON.stringify(vJson, null, 2), 'utf8');
        }
      } catch (e) {}
    }

    if (isModernForge && !fs.existsSync(clientJar)) {
      const optimalJava = await getOptimalJavaPath(selectedVersion, null, sendStatus);
      const javaExe = optimalJava && optimalJava !== 'javaw' ? optimalJava : 'java';
      await runInstallerClient(javaExe, installerFile, gameDir, sendStatus);
    }

    // Sync any generated profile json from installer
    const installerVersionJson = path.join(gameDir, 'versions', `${mcVer}-forge-${forgeVer}`, `${mcVer}-forge-${forgeVer}.json`);
    if (fs.existsSync(installerVersionJson)) {
      const vJson = JSON.parse(fs.readFileSync(installerVersionJson, 'utf8'));
      vJson.id = selectedVersion;
      if (!vJson.inheritsFrom) vJson.inheritsFrom = mcVer;
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(targetJson, JSON.stringify(vJson, null, 2), 'utf8');
    }

    sanitizeVersionJson(gameDir, selectedVersion);
    if (sendStatus) sendStatus(`Forge ${forgeVer} profile configured successfully!`, 'success');
    return true;
  } catch (err) {
    console.error(`Failed to auto-setup Forge for ${selectedVersion}:`, err);
    if (sendStatus) sendStatus(`Failed to configure Forge profile: ${err.message}`, 'error');
    return false;
  }
}

async function ensureNeoForgeProfile(gameDir, selectedVersion, sendStatus) {
  const targetDir = path.join(gameDir, 'versions', selectedVersion);
  const targetJson = path.join(targetDir, `${selectedVersion}.json`);

  const match = selectedVersion.match(/(\d+\.\d+(\.\d+)?)/);
  if (!match) return false;
  const mcVer = match[1];

  ensureLauncherProfilesJson(gameDir);

  try {
    const res = await fetch(`https://bmclapi2.bangbang93.com/neoforge/list/${mcVer}`);
    if (!res.ok) throw new Error(`NeoForge list HTTP ${res.status}`);
    const list = await res.json();
    if (!Array.isArray(list) || list.length === 0) throw new Error('No NeoForge versions found for ' + mcVer);

    const latest = list[list.length - 1] || list[0];
    const neoVer = latest.version;
    const installersDir = path.join(gameDir, 'installers');
    if (!fs.existsSync(installersDir)) fs.mkdirSync(installersDir, { recursive: true });
    const installerFile = path.join(installersDir, `neoforge-${neoVer}-installer.jar`);

    const clientJar = path.join(gameDir, 'libraries', 'net', 'neoforged', 'neoforge', neoVer, `neoforge-${neoVer}-client.jar`);
    if (fs.existsSync(targetJson) && fs.existsSync(clientJar)) {
      sanitizeVersionJson(gameDir, selectedVersion);
      return true;
    }

    await ensureBaseMinecraftJar(gameDir, mcVer, sendStatus);

    if (!fs.existsSync(installerFile)) {
      const dlUrls = [
        `https://maven.neoforged.net/releases/net/neoforged/neoforge/${neoVer}/neoforge-${neoVer}-installer.jar`,
        `https://bmclapi2.bangbang93.com/maven/net/neoforged/neoforge/${neoVer}/neoforge-${neoVer}-installer.jar`
      ];

      const installerBuffer = await downloadWithProgressAndFallback(
        dlUrls,
        `Downloading NeoForge ${neoVer} installer`,
        sendStatus
      );
      fs.writeFileSync(installerFile, installerBuffer);
    }

    // Extract version JSON immediately so the profile directory and JSON exist
    if (fs.existsSync(installerFile)) {
      try {
        const zip = new AdmZip(installerFile);
        const vEntry = zip.getEntry('version.json');
        if (vEntry) {
          const vJson = JSON.parse(vEntry.getData().toString('utf8'));
          vJson.id = selectedVersion;
          if (!vJson.inheritsFrom) vJson.inheritsFrom = mcVer;
          if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
          fs.writeFileSync(targetJson, JSON.stringify(vJson, null, 2), 'utf8');
        }
      } catch (e) {}
    }

    if (!fs.existsSync(clientJar)) {
      const optimalJava = await getOptimalJavaPath(selectedVersion, null, sendStatus);
      const javaExe = optimalJava && optimalJava !== 'javaw' ? optimalJava : 'java';
      await runInstallerClient(javaExe, installerFile, gameDir, sendStatus);
    }

    // Sync any generated profile json from installer
    const installerVersionJson = path.join(gameDir, 'versions', `neoforge-${neoVer}`, `neoforge-${neoVer}.json`);
    if (fs.existsSync(installerVersionJson)) {
      const vJson = JSON.parse(fs.readFileSync(installerVersionJson, 'utf8'));
      vJson.id = selectedVersion;
      if (!vJson.inheritsFrom) vJson.inheritsFrom = mcVer;
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(targetJson, JSON.stringify(vJson, null, 2), 'utf8');
    }

    sanitizeVersionJson(gameDir, selectedVersion);
    if (sendStatus) sendStatus(`NeoForge ${neoVer} profile configured successfully!`, 'success');
    return true;
  } catch (err) {
    console.error(`Failed to auto-setup NeoForge for ${selectedVersion}:`, err);
    if (sendStatus) sendStatus(`Failed to configure NeoForge profile: ${err.message}`, 'error');
    return false;
  }
}

async function downloadJava21(sendStatus) {
  try {
    const userDir = app.getPath('userData');
    const targetBase = path.join(userDir, 'runtime', 'java-21');
    const targetJavaw = path.join(targetBase, 'bin', 'javaw.exe');
    if (fs.existsSync(targetJavaw) && getJavaMajor(targetJavaw) >= 21) {
      return targetJavaw;
    }

    if (sendStatus) sendStatus('Minecraft 1.21.4 requires Java 21. Downloading portable Java 21 runtime...', 'info');

    const metaRes = await fetch('https://api.adoptium.net/v3/assets/latest/21/hotspot?architecture=x64&image_type=jre&os=windows', {
      headers: { 'User-Agent': 'OrbitLauncher' }
    });
    if (!metaRes.ok) throw new Error(`Adoptium API HTTP ${metaRes.status}`);
    const metaData = await metaRes.json();
    if (!Array.isArray(metaData) || !metaData[0] || !metaData[0].binary || !metaData[0].binary.package) {
      throw new Error('No JRE found in Adoptium API');
    }

    const downloadUrl = metaData[0].binary.package.link;
    if (sendStatus) sendStatus('Downloading Java 21 (~46 MB)...', 'info');

    const zipRes = await fetch(downloadUrl);
    if (!zipRes.ok) throw new Error(`Download HTTP ${zipRes.status}`);
    const arrayBuffer = await zipRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (sendStatus) sendStatus('Extracting Java 21...', 'info');
    const zip = new AdmZip(buffer);
    const tempExtract = path.join(userDir, 'runtime', 'temp_jre');
    if (fs.existsSync(tempExtract)) {
      try { fs.rmSync(tempExtract, { recursive: true, force: true }); } catch (e) {}
    }
    zip.extractAllTo(tempExtract, true);

    let foundDir = tempExtract;
    const entries = fs.readdirSync(tempExtract, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && fs.existsSync(path.join(tempExtract, entry.name, 'bin', 'javaw.exe'))) {
        foundDir = path.join(tempExtract, entry.name);
        break;
      }
    }

    if (fs.existsSync(targetBase)) {
      try { fs.rmSync(targetBase, { recursive: true, force: true }); } catch (e) {}
    }
    fs.mkdirSync(path.dirname(targetBase), { recursive: true });
    fs.renameSync(foundDir, targetBase);
    try { fs.rmSync(tempExtract, { recursive: true, force: true }); } catch (e) {}

    if (fs.existsSync(targetJavaw)) {
      if (sendStatus) sendStatus('Java 21 runtime ready!', 'success');
      return targetJavaw;
    }
  } catch (err) {
    console.error('Failed to auto-download Java 21:', err);
    if (sendStatus) sendStatus(`Could not auto-download Java 21: ${err.message}`, 'error');
  }
  return null;
}

async function downloadJava8(sendStatus) {
  try {
    const userDir = app.getPath('userData');
    const targetBase = path.join(userDir, 'runtime', 'java-8');
    const targetJavaw = path.join(targetBase, 'bin', 'javaw.exe');
    if (fs.existsSync(targetJavaw) && getJavaMajor(targetJavaw) === 8) {
      return targetJavaw;
    }

    if (sendStatus) sendStatus('Legacy Minecraft requires Java 8. Downloading portable Java 8 runtime...', 'info');

    const metaRes = await fetch('https://api.adoptium.net/v3/assets/latest/8/hotspot?architecture=x64&image_type=jre&os=windows', {
      headers: { 'User-Agent': 'OrbitLauncher' }
    });
    if (!metaRes.ok) throw new Error(`Adoptium API HTTP ${metaRes.status}`);
    const metaData = await metaRes.json();
    if (!Array.isArray(metaData) || !metaData[0] || !metaData[0].binary || !metaData[0].binary.package) {
      throw new Error('No JRE found in Adoptium API');
    }

    const downloadUrl = metaData[0].binary.package.link;
    if (sendStatus) sendStatus('Downloading Java 8 (~38 MB)...', 'info');

    const zipRes = await fetch(downloadUrl);
    if (!zipRes.ok) throw new Error(`Download HTTP ${zipRes.status}`);
    const arrayBuffer = await zipRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (sendStatus) sendStatus('Extracting Java 8...', 'info');
    const zip = new AdmZip(buffer);
    const tempExtract = path.join(userDir, 'runtime', 'temp_jre8');
    if (fs.existsSync(tempExtract)) {
      try { fs.rmSync(tempExtract, { recursive: true, force: true }); } catch (e) {}
    }
    zip.extractAllTo(tempExtract, true);

    let foundDir = tempExtract;
    const entries = fs.readdirSync(tempExtract, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && fs.existsSync(path.join(tempExtract, entry.name, 'bin', 'javaw.exe'))) {
        foundDir = path.join(tempExtract, entry.name);
        break;
      }
    }

    if (fs.existsSync(targetBase)) {
      try { fs.rmSync(targetBase, { recursive: true, force: true }); } catch (e) {}
    }
    fs.mkdirSync(path.dirname(targetBase), { recursive: true });
    fs.renameSync(foundDir, targetBase);
    try { fs.rmSync(tempExtract, { recursive: true, force: true }); } catch (e) {}

    if (fs.existsSync(targetJavaw)) {
      if (sendStatus) sendStatus('Java 8 runtime ready!', 'success');
      return targetJavaw;
    }
  } catch (err) {
    console.error('Failed to auto-download Java 8:', err);
    if (sendStatus) sendStatus(`Could not auto-download Java 8: ${err.message}`, 'error');
  }
  return null;
}

function getPackFormat(versionStr) {
  const m = (versionStr || '').match(/(\d+)\.(\d+)/);
  if (!m) return 46;
  const major = parseInt(m[1], 10);
  const minor = parseInt(m[2], 10);
  if (major === 1) {
    if (minor <= 8) return 1;
    if (minor <= 10) return 2;
    if (minor <= 12) return 3;
    if (minor <= 14) return 4;
    if (minor <= 16) return 6;
    if (minor === 17) return 7;
    if (minor === 18) return 8;
    if (minor === 19) return 9;
    if (minor === 20) return 15;
    if (minor >= 21) return 46;
  }
  return 46;
}

async function getOptimalJavaPath(selectedVersion, userJavaPath, sendStatus) {
  const mcMatch = (selectedVersion || '').match(/(\d+)\.(\d+)/);
  const major = mcMatch ? parseInt(mcMatch[1], 10) : 1;
  const minor = mcMatch ? parseInt(mcMatch[2], 10) : 21;

  const tlBase = path.join(process.env.APPDATA || '', '.tlauncher', 'legacy', 'Minecraft', 'jre');
  const tlLegacy = path.join(tlBase, 'jre-legacy', 'windows-x64', 'jre-legacy', 'bin', 'javaw.exe');
  const tlEpsilon = path.join(tlBase, 'java-runtime-epsilon', 'windows-x64', 'java-runtime-epsilon', 'bin', 'javaw.exe');
  const tlDelta = path.join(tlBase, 'java-runtime-delta', 'windows-x64', 'java-runtime-delta', 'bin', 'javaw.exe');

  const mcRuntime = path.join(process.env.APPDATA || '', '.minecraft', 'runtime');
  const mcLegacy = path.join(mcRuntime, 'jre-legacy', 'windows-x64', 'jre-legacy', 'bin', 'javaw.exe');
  const mcAlpha = path.join(mcRuntime, 'java-runtime-alpha', 'windows-x64', 'java-runtime-alpha', 'bin', 'javaw.exe');
  const mcGamma = path.join(mcRuntime, 'java-runtime-gamma', 'windows-x64', 'java-runtime-gamma', 'bin', 'javaw.exe');
  const mcDelta = path.join(mcRuntime, 'java-runtime-delta', 'windows-x64', 'java-runtime-delta', 'bin', 'javaw.exe');

  const bundledCandidates = [
    path.join(path.dirname(process.execPath), 'runtime', 'java-21', 'bin', 'javaw.exe'),
    path.join(process.resourcesPath || '', 'runtime', 'java-21', 'bin', 'javaw.exe'),
    path.join(__dirname, 'runtime', 'java-21', 'bin', 'javaw.exe'),
    path.join(__dirname, '..', 'runtime', 'java-21', 'bin', 'javaw.exe'),
    path.join(app.getPath('userData'), 'runtime', 'java-21', 'bin', 'javaw.exe')
  ];
  const bundledJava = bundledCandidates.find(p => p && fs.existsSync(p));

  // Legacy Minecraft (1.16.5, 1.12.2, 1.8.9, 1.7.10) requires Java 8
  if (major === 1 && minor <= 16) {
    // 1. User specified Java 8
    if (userJavaPath && fs.existsSync(userJavaPath) && getJavaMajor(userJavaPath) === 8) return userJavaPath;
    // 2. TLauncher & Official Minecraft legacy runtimes
    if (fs.existsSync(tlLegacy)) return tlLegacy;
    if (fs.existsSync(mcLegacy)) return mcLegacy;
    if (fs.existsSync(mcAlpha)) return mcAlpha;

    // 3. Locally cached Java 8 in userData
    const localJava8 = path.join(app.getPath('userData'), 'runtime', 'java-8', 'bin', 'javaw.exe');
    if (fs.existsSync(localJava8) && getJavaMajor(localJava8) === 8) return localJava8;

    // 4. Check common program files Java 8 locations
    const searchRoots = [
      'C:\\Program Files\\Java',
      'C:\\Program Files (x86)\\Java',
      'C:\\Program Files\\Eclipse Adoptium',
      'C:\\Program Files\\BellSoft',
      'C:\\Program Files\\Amazon Corretto',
      'C:\\Program Files\\Zulu'
    ];
    for (const root of searchRoots) {
      try {
        if (fs.existsSync(root)) {
          const dirs = fs.readdirSync(root);
          for (const dir of dirs) {
            const candidate = path.join(root, dir, 'bin', 'javaw.exe');
            if (fs.existsSync(candidate) && getJavaMajor(candidate) === 8) return candidate;
          }
        }
      } catch (e) {}
    }

    // 5. Default PATH javaw if it is Java 8
    if (getJavaMajor('javaw') === 8) return 'javaw';

    // 6. Auto-download portable Adoptium OpenJDK 8
    const downloaded8 = await downloadJava8(sendStatus);
    if (downloaded8) return downloaded8;

    return 'javaw';
  } else if (major === 1 && minor < 20) {
    // 1.17 to 1.19.4 can use Java 17 or Java 21
    if (userJavaPath && fs.existsSync(userJavaPath) && getJavaMajor(userJavaPath) >= 17) return userJavaPath;
    if (fs.existsSync(tlEpsilon)) return tlEpsilon;
    if (fs.existsSync(mcGamma)) return mcGamma;
    if (bundledJava) return bundledJava;
    if (fs.existsSync(tlDelta)) return tlDelta;
    if (fs.existsSync(mcDelta)) return mcDelta;
  }

  // Modern (1.20.5+, 1.21.x, 26.x) STRICTLY REQUIRES Java 21+
  // 1. Check bundled runtime
  if (bundledJava && getJavaMajor(bundledJava) >= 21) {
    return bundledJava;
  }

  // 2. Check local delta runtimes
  if (fs.existsSync(tlDelta) && getJavaMajor(tlDelta) >= 21) return tlDelta;
  if (fs.existsSync(mcDelta) && getJavaMajor(mcDelta) >= 21) return mcDelta;

  // 3. Check user-configured Java path if valid and >= 21
  if (userJavaPath && fs.existsSync(userJavaPath) && getJavaMajor(userJavaPath) >= 21) {
    return userJavaPath;
  }

  // 4. Check system Java installations
  const autoJava = detectDefaultJavaPath();
  if (autoJava && autoJava !== 'javaw' && getJavaMajor(autoJava) >= 21) {
    return autoJava;
  }

  // 5. If global PATH 'javaw' is Java 21+
  if (getJavaMajor('javaw') >= 21) {
    return 'javaw';
  }

  // 6. If no Java 21 found, auto-download portable Adoptium OpenJDK 21!
  const downloaded = await downloadJava21(sendStatus);
  if (downloaded) return downloaded;

  if (bundledJava) return bundledJava;
  return 'javaw';
}

// --- SKIN SYNCHRONIZATION SYSTEM ---
function getSkinStorageDir() {
  const userDir = app.getPath('userData');
  const skinsDir = path.join(userDir, 'skins');
  if (!fs.existsSync(skinsDir)) {
    try { fs.mkdirSync(skinsDir, { recursive: true }); } catch (e) {}
  }
  return skinsDir;
}

function getCapeStorageDir() {
  const userDir = app.getPath('userData');
  const capesDir = path.join(userDir, 'capes');
  if (!fs.existsSync(capesDir)) {
    try { fs.mkdirSync(capesDir, { recursive: true }); } catch (e) {}
  }
  return capesDir;
}

function findCustomSkinLoaderJar() {
  const candidates = [
    path.join(__dirname, 'assets', 'CustomSkinLoader_Universal-15.0.1.jar'),
    path.join(__dirname, '..', 'assets', 'CustomSkinLoader_Universal-15.0.1.jar'),
    path.join(process.resourcesPath || '', 'assets', 'CustomSkinLoader_Universal-15.0.1.jar'),
    path.join(path.dirname(process.execPath), 'assets', 'CustomSkinLoader_Universal-15.0.1.jar'),
    'C:\\Users\\Atuka\\Desktop\\Idk\\launcher-electron\\assets\\CustomSkinLoader_Universal-15.0.1.jar'
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  return null;
}

function findAssetModJar(filename) {
  const candidates = [
    path.join(__dirname, 'assets', filename),
    path.join(__dirname, '..', 'assets', filename),
    path.join(process.resourcesPath || '', 'assets', filename),
    path.join(path.dirname(process.execPath), 'assets', filename),
    path.join('C:\\game\\Orbit Launcher\\assets', filename)
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  return null;
}

function ensureMultiplayerFixes(gameDir, selectedVersion) {
  if (!gameDir || !fs.existsSync(gameDir)) return;
  try {
    const modsDir = path.join(gameDir, 'mods');
    if (!fs.existsSync(modsDir)) {
      fs.mkdirSync(modsDir, { recursive: true });
    }

    const lower = (selectedVersion || '').toLowerCase();
    let modJar = null;
    let targetName = null;

    if (lower.includes('neoforge')) {
      modJar = findAssetModJar('lanserverproperties-neoforge.jar');
      targetName = 'lanserverproperties-neoforge.jar';
    } else if (lower.includes('forge')) {
      modJar = findAssetModJar('lanserverproperties-forge.jar');
      targetName = 'lanserverproperties-forge.jar';
    } else if (lower.includes('fabric')) {
      modJar = findAssetModJar('offlinelan-fabric.jar');
      targetName = 'offlinelan-fabric.jar';
    }

    if (modJar && targetName) {
      const dest = path.join(modsDir, targetName);
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(modJar, dest);
        console.log(`[Multiplayer Fix]: Installed ${targetName} to mods.`);
      }
    }

    // Configure LSP onlineMode to false automatically
    if (lower.includes('neoforge') || lower.includes('forge')) {
      const configDir = path.join(gameDir, 'config');
      if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
      const lspConfigPath = path.join(configDir, 'lsp.json');
      const lspDefaults = {
        enablePreference: true,
        gameMode: 'SURVIVAL',
        allowCheat: true,
        defaultPort: 0,
        onlineMode: false,
        fixUUID: true,
        allowPVP: true,
        maxPlayer: 8,
        playersAlwaysOffline: []
      };
      if (!fs.existsSync(lspConfigPath)) {
        fs.writeFileSync(lspConfigPath, JSON.stringify(lspDefaults, null, 2), 'utf8');
        console.log('[Multiplayer Fix]: Configured lsp.json (onlineMode: false).');
      } else {
        try {
          const cur = JSON.parse(fs.readFileSync(lspConfigPath, 'utf8'));
          if (cur.onlineMode !== false) {
            cur.onlineMode = false;
            fs.writeFileSync(lspConfigPath, JSON.stringify(cur, null, 2), 'utf8');
            console.log('[Multiplayer Fix]: Updated lsp.json (onlineMode: false).');
          }
        } catch (e) {}
      }
    }
  } catch (err) {
    console.warn('[Multiplayer Fix Warning]:', err.message);
  }
}

async function syncSkinToGame(gameDir, username, selectedVersion, customDataUrl, armModel) {
  if (!gameDir || !fs.existsSync(gameDir)) return false;
  const safeName = (username || 'Player').trim();
  const skinsDir = getSkinStorageDir();

  let pngBuffer = null;

  // 1. If dataUrl provided, decode
  if (customDataUrl && customDataUrl.startsWith('data:image/png;base64,')) {
    const base64 = customDataUrl.replace(/^data:image\/png;base64,/, '');
    pngBuffer = Buffer.from(base64, 'base64');
  }

  // 2. If no buffer, check saved skin on disk
  if (!pngBuffer) {
    const userSkinFile = path.join(skinsDir, `${safeName}.png`);
    const currentSkinFile = path.join(skinsDir, 'current_skin.png');
    if (fs.existsSync(userSkinFile)) {
      try { pngBuffer = fs.readFileSync(userSkinFile); } catch (e) {}
    } else if (fs.existsSync(currentSkinFile)) {
      try { pngBuffer = fs.readFileSync(currentSkinFile); } catch (e) {}
    }
  }

  // 3. If still no buffer, fetch skin for nickname from mc-heads.net
  if (!pngBuffer) {
    try {
      const res = await fetch(`https://mc-heads.net/skin/${encodeURIComponent(safeName)}`);
      if (res.ok) {
        const ab = await res.arrayBuffer();
        if (ab.byteLength > 200) {
          pngBuffer = Buffer.from(ab);
        }
      }
    } catch (e) {
      console.warn('[Skin Sync]: Could not fetch online skin for', safeName, e.message);
    }
  }

  if (!pngBuffer) {
    console.log('[Skin Sync]: No custom or online skin available for', safeName);
    return false;
  }

  // Save to persistent skinsDir
  try {
    fs.writeFileSync(path.join(skinsDir, `${safeName}.png`), pngBuffer);
    fs.writeFileSync(path.join(skinsDir, 'current_skin.png'), pngBuffer);
    fs.writeFileSync(path.join(skinsDir, 'skin_meta.json'), JSON.stringify({
      username: safeName,
      model: armModel || 'default',
      updatedAt: Date.now()
    }, null, 2), 'utf8');
  } catch (e) {
    console.warn('[Skin Sync]: Error caching skin:', e.message);
  }

  // A) LocalSkin for CustomSkinLoader
  try {
    const cslDir = path.join(gameDir, 'CustomSkinLoader');
    const localSkinsDir = path.join(cslDir, 'LocalSkin', 'skins');
    fs.mkdirSync(localSkinsDir, { recursive: true });

    // Clean up stale generic Player.png so other LAN players named "Player" don't get your skin
    if (safeName.toLowerCase() !== 'player') {
      const g1 = path.join(localSkinsDir, 'Player.png');
      const g2 = path.join(localSkinsDir, 'player.png');
      if (fs.existsSync(g1)) try { fs.unlinkSync(g1); } catch (e) {}
      if (fs.existsSync(g2)) try { fs.unlinkSync(g2); } catch (e) {}
    }

    // Save strictly for this specific player's nickname
    fs.writeFileSync(path.join(localSkinsDir, `${safeName}.png`), pngBuffer);
    fs.writeFileSync(path.join(localSkinsDir, `${safeName.toLowerCase()}.png`), pngBuffer);

    const cslConfig = {
      version: "15.0",
      loadlist: [
        {
          name: "LocalSkin",
          type: "Legacy",
          checkPNG: false,
          skin: "LocalSkin/skins/{USERNAME}.png",
          model: armModel === 'slim' ? 'slim' : 'auto',
          cape: "LocalSkin/capes/{USERNAME}.png",
          elytra: "LocalSkin/elytras/{USERNAME}.png"
        },
        {
          name: "Mojang",
          type: "Mojang"
        },
        {
          name: "Ely.by",
          type: "CustomSkinAPI",
          root: "https://skin.ely.by/skins/"
        }
      ]
    };
    fs.writeFileSync(path.join(cslDir, 'CustomSkinLoader.json'), JSON.stringify(cslConfig, null, 2), 'utf8');

    // Sync active Cape to CustomSkinLoader
    try {
      const capesDir = getCapeStorageDir();
      const localCapesDir = path.join(cslDir, 'LocalSkin', 'capes');
      fs.mkdirSync(localCapesDir, { recursive: true });
      const userCape = path.join(capesDir, `${safeName}.png`);
      const curCape = path.join(capesDir, 'current_cape.png');
      const activeCape = fs.existsSync(userCape) ? userCape : (fs.existsSync(curCape) ? curCape : null);
      if (activeCape) {
        const capeBuf = fs.readFileSync(activeCape);
        fs.writeFileSync(path.join(localCapesDir, `${safeName}.png`), capeBuf);
        fs.writeFileSync(path.join(localCapesDir, `${safeName.toLowerCase()}.png`), capeBuf);
      } else {
        const c1 = path.join(localCapesDir, `${safeName}.png`);
        const c2 = path.join(localCapesDir, `${safeName.toLowerCase()}.png`);
        if (fs.existsSync(c1)) try { fs.unlinkSync(c1); } catch (e) {}
        if (fs.existsSync(c2)) try { fs.unlinkSync(c2); } catch (e) {}
      }
    } catch (e) {
      console.warn('[Skin Sync]: Cape sync error:', e.message);
    }
  } catch (err) {
    console.error('[Skin Sync Error]: CustomSkinLoader setup failed:', err);
  }

  const isModded = (selectedVersion || '').toLowerCase().match(/fabric|forge|quilt|neoforge/);

  if (isModded) {
    // For Fabric / Forge: CustomSkinLoader handles skins per nickname without modifying global textures
    try {
      const modsDir = path.join(gameDir, 'mods');
      if (!fs.existsSync(modsDir)) fs.mkdirSync(modsDir, { recursive: true });
      const cslJarSrc = findCustomSkinLoaderJar();
      if (cslJarSrc) {
        const cslJarDst = path.join(modsDir, 'CustomSkinLoader_Universal-15.0.1.jar');
        if (!fs.existsSync(cslJarDst)) {
          fs.copyFileSync(cslJarSrc, cslJarDst);
          console.log('[Skin Sync]: Deployed CustomSkinLoader to mods.');
        }
      }

      // CRITICAL FIX FOR MULTIPLAYER / RADMIN VPN:
      // Remove OrbitSkinPack in modded clients so other players are NOT rendered with your steve.png/alex.png!
      const packDir = path.join(gameDir, 'resourcepacks', 'OrbitSkinPack');
      if (fs.existsSync(packDir)) {
        try { fs.rmSync(packDir, { recursive: true, force: true }); } catch (e) {}
      }
      const optionsPath = path.join(gameDir, 'options.txt');
      if (fs.existsSync(optionsPath)) {
        let optContent = fs.readFileSync(optionsPath, 'utf8');
        if (optContent.includes('file/OrbitSkinPack')) {
          optContent = optContent.replace(/,?"file\/OrbitSkinPack"/g, '').replace(/\[,"/, '["');
          fs.writeFileSync(optionsPath, optContent, 'utf8');
        }
      }
    } catch (err) {
      console.warn('[Skin Sync]: Modded skin cleanup error:', err.message);
    }
  } else {
    // Pure Vanilla (Unmodded): Fallback resource pack for singleplayer
    try {
      const packDir = path.join(gameDir, 'resourcepacks', 'OrbitSkinPack');
      const texturesDir = path.join(packDir, 'assets', 'minecraft', 'textures', 'entity');
      const playerWideDir = path.join(texturesDir, 'player', 'wide');
      const playerSlimDir = path.join(texturesDir, 'player', 'slim');

      fs.mkdirSync(playerWideDir, { recursive: true });
      fs.mkdirSync(playerSlimDir, { recursive: true });

      const targetPackFormat = getPackFormat(selectedVersion);
      const packMeta = {
        pack: {
          pack_format: targetPackFormat,
          supported_formats: [1, 99],
          description: "Orbit Launcher Custom Player Skin"
        }
      };
      fs.writeFileSync(path.join(packDir, 'pack.mcmeta'), JSON.stringify(packMeta, null, 2), 'utf8');

      fs.writeFileSync(path.join(playerWideDir, 'steve.png'), pngBuffer);
      fs.writeFileSync(path.join(playerSlimDir, 'alex.png'), pngBuffer);
      fs.writeFileSync(path.join(texturesDir, 'steve.png'), pngBuffer);
      fs.writeFileSync(path.join(texturesDir, 'alex.png'), pngBuffer);

      const optionsPath = path.join(gameDir, 'options.txt');
      if (fs.existsSync(optionsPath)) {
        let optContent = fs.readFileSync(optionsPath, 'utf8');
        if (!optContent.includes('file/OrbitSkinPack')) {
          if (optContent.includes('resourcePacks:[')) {
            optContent = optContent.replace(/resourcePacks:\[(.*?)\]/, (m, p1) => {
              const list = p1.trim() ? p1.split(',').map(s => s.trim()) : ['"vanilla"'];
              if (!list.includes('"file/OrbitSkinPack"')) {
                list.push('"file/OrbitSkinPack"');
              }
              return `resourcePacks:[${list.join(',')}]`;
            });
          } else {
            optContent += '\nresourcePacks:["vanilla","file/OrbitSkinPack"]\n';
          }
          fs.writeFileSync(optionsPath, optContent, 'utf8');
        }
      }
    } catch (err) {
      console.error('[Skin Sync Error]: Resource pack generation failed:', err);
    }
  }

  console.log('[Skin Sync]: Skin successfully applied to game files for', safeName);
  return true;
}

async function getAllVersions(gameDir) {
  let activeDir = gameDir;
  if (!activeDir || typeof activeDir !== 'string') {
    const cfg = loadConfig();
    activeDir = (cfg && cfg.gameDir) || DEFAULT_CONFIG.gameDir;
  }
  let installed = [];
  const versionsDir = path.join(activeDir, 'versions');
  if (fs.existsSync(versionsDir)) {
    try {
      const entries = fs.readdirSync(versionsDir, { withFileTypes: true });
      installed = entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
      
      installed.sort((a, b) => {
        if (a.includes('Fabric') && !b.includes('Fabric')) return -1;
        if (!a.includes('Fabric') && b.includes('Fabric')) return 1;
        return b.localeCompare(a);
      });
    } catch (e) {
      console.error('Error scanning local versions:', e);
    }
  }
  if (installed.length === 0) {
    installed = ['Fabric 1.21.4'];
  }

  // 1. Online Mojang Releases (Vanilla) & Snapshots
  let mojang = [...FALLBACK_MOJANG_RELEASES];
  let snapshots = [];
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.versions)) {
        const onlineReleases = data.versions
          .filter(v => v.type === 'release')
          .map(v => v.id);
        if (onlineReleases.length > 0) {
          mojang = onlineReleases;
        }
        snapshots = data.versions
          .filter(v => v.type === 'snapshot')
          .map(v => v.id);
      }
    }
  } catch (err) {
    console.log('Using fallback Mojang versions list:', err.message);
  }

  // 2. Online Fabric Releases & Fabric Snapshots
  let fabric = [...FALLBACK_FABRIC_RELEASES];
  let fabricSnapshots = [];
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://meta.fabricmc.net/v2/versions/game', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const stables = data
          .filter(x => x && x.stable && /^\d+\.\d+(\.\d+)?$/.test(x.version))
          .map(x => `Fabric ${x.version}`);
        if (stables.length > 0) {
          fabric = stables;
        }
        fabricSnapshots = data
          .filter(x => x && (!x.stable || !/^\d+\.\d+(\.\d+)?$/.test(x.version)))
          .slice(0, 100)
          .map(x => `Fabric ${x.version}`);
      }
    }
  } catch (err) {
    console.log('Using fallback Fabric versions list:', err.message);
  }

  // 3. Forge, NeoForge & OptiFine Catalogs
  const forge = [...POPULAR_FORGE_RELEASES];
  const neoforge = [...POPULAR_NEOFORGE_RELEASES];
  const optifine = [...POPULAR_OPTIFINE_RELEASES];

  return { installed, mojang, snapshots, fabric, fabricSnapshots, forge, neoforge, optifine };
}

function syncFpsBoosterMod(gameDir) {
  const modsDir = path.join(gameDir, 'mods');
  if (!fs.existsSync(modsDir)) {
    fs.mkdirSync(modsDir, { recursive: true });
  }
  const destJar = path.join(modsDir, 'fpsbooster-1.0.0.jar');

  const sourceJar = findFpsBoosterJar();
  if (sourceJar && fs.existsSync(sourceJar)) {
    try {
      fs.copyFileSync(sourceJar, destJar);
      return { success: true, message: 'FPS Booster mod v1.0.0 synchronized' };
    } catch (e) {
      console.error('Failed to copy mod jar:', e);
      return { success: false, message: `Failed to copy mod jar: ${e.message}` };
    }
  } else if (fs.existsSync(destJar)) {
    return { success: true, message: 'FPS Booster mod found in mods folder' };
  }
  return { success: false, message: 'FPS Booster jar not found' };
}

function applyGpuOptionsPreset(gameDir) {
  const optionsPath = path.join(gameDir, 'options.txt');
  try {
    if (!fs.existsSync(optionsPath)) {
      return { success: false, message: 'options.txt not yet created' };
    }
    let content = fs.readFileSync(optionsPath, 'utf8');
    
    const updates = {
      'maxFps': '80',
      'renderDistance': '8',
      'simulationDistance': '6',
      'enableVsync': 'false',
      'graphicsMode': '0',
      'mipmapLevels': '2'
    };

    for (const [key, val] of Object.entries(updates)) {
      const regex = new RegExp(`^${key}:.*$`, 'm');
      if (regex.test(content)) {
        content = content.replace(regex, `${key}:${val}`);
      } else {
        content += `\n${key}:${val}`;
      }
    }

    fs.writeFileSync(optionsPath, content, 'utf8');
    return { success: true, message: 'Optimal GPU parameters written to options.txt' };
  } catch (err) {
    return { success: false, message: `Error: ${err.message}` };
  }
}

let mainWindow = null;
let currentChildProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1040,
    height: 680,
    minWidth: 920,
    minHeight: 600,
    frame: false,
    transparent: false,
    backgroundColor: '#06070a',
    titleBarStyle: 'hidden',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ==========================================================================
// DISCORD RICH PRESENCE (RPC) VIA NATIVE NAMED PIPE
// ==========================================================================
let discordSocket = null;
let discordConnected = false;
const DISCORD_CLIENT_ID = '121800000000000000';
let discordReconnectTimer = null;
let currentDiscordActivity = null;

function sendDiscordFrame(opcode, data) {
  if (!discordSocket || discordSocket.destroyed) return;
  try {
    const payload = Buffer.from(JSON.stringify(data), 'utf8');
    const header = Buffer.alloc(8);
    header.writeInt32LE(opcode, 0);
    header.writeInt32LE(payload.length, 4);
    discordSocket.write(Buffer.concat([header, payload]));
  } catch (e) {
    // Graceful ignore
  }
}

function updateDiscordPresence(activity) {
  currentDiscordActivity = activity;
  if (!discordConnected) return;
  sendDiscordFrame(1, {
    cmd: 'SET_ACTIVITY',
    args: {
      pid: process.pid,
      activity: {
        state: activity.state || 'Orbit Client',
        details: activity.details || 'Orbit Launcher Red Edition',
        timestamps: activity.startTimestamp ? { start: activity.startTimestamp } : undefined,
        assets: {
          large_image: activity.largeImageKey || 'orbit_icon',
          large_text: activity.largeImageText || 'Orbit Launcher',
          small_image: activity.smallImageKey,
          small_text: activity.smallImageText
        }
      }
    },
    nonce: crypto.randomUUID()
  });
}

function connectDiscordRpc() {
  if (discordSocket) {
    try { discordSocket.destroy(); } catch (e) {}
    discordSocket = null;
  }
  discordConnected = false;

  const pipePath = '\\\\?\\pipe\\discord-rpc-0';
  const socket = net.connect(pipePath, () => {
    discordSocket = socket;
    sendDiscordFrame(0, { v: 1, client_id: DISCORD_CLIENT_ID });
  });

  socket.on('data', (data) => {
    try {
      if (data.length >= 8) {
        const opcode = data.readInt32LE(0);
        const length = data.readInt32LE(4);
        if (data.length >= 8 + length) {
          const body = JSON.parse(data.toString('utf8', 8, 8 + length));
          if (body.cmd === 'DISPATCH' && body.evt === 'READY') {
            discordConnected = true;
            if (currentDiscordActivity) {
              updateDiscordPresence(currentDiscordActivity);
            }
          }
        }
      }
    } catch (e) {}
  });

  socket.on('error', () => {
    discordConnected = false;
  });

  socket.on('close', () => {
    discordConnected = false;
    discordSocket = null;
    if (!discordReconnectTimer) {
      discordReconnectTimer = setTimeout(() => {
        discordReconnectTimer = null;
        connectDiscordRpc();
      }, 20000);
    }
  });
}

// ==========================================================================
// MINECRAFT SERVER STATUS PING (TCP VarInt Protocol)
// ==========================================================================
function writeVarInt(value) {
  const bytes = [];
  let val = value;
  while (true) {
    if ((val & 0xFFFFFF80) === 0) {
      bytes.push(val);
      return Buffer.from(bytes);
    }
    bytes.push((val & 0x7F) | 0x80);
    val >>>= 7;
  }
}

function readVarInt(buffer, offset = 0) {
  let result = 0;
  let numRead = 0;
  let currentByte = 0;
  let pos = offset;
  do {
    if (pos >= buffer.length) throw new Error('VarInt offset out of bounds');
    currentByte = buffer[pos++];
    result |= (currentByte & 0x7F) << (7 * numRead);
    numRead++;
    if (numRead > 5) throw new Error('VarInt is too big');
  } while ((currentByte & 0x80) !== 0);
  return { value: result, bytesRead: numRead };
}

function pingMinecraftServer(host, port = 25565, timeout = 3500) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const socket = new net.Socket();
    let isResolved = false;

    const cleanup = () => {
      if (!socket.destroyed) socket.destroy();
    };

    socket.setTimeout(timeout);

    socket.on('timeout', () => {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        resolve({ online: false, ping: -1, error: 'Connection timed out' });
      }
    });

    socket.on('error', (err) => {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        resolve({ online: false, ping: -1, error: err.message });
      }
    });

    socket.connect(port, host, () => {
      try {
        const hostBuf = Buffer.from(host, 'utf8');
        const portBuf = Buffer.alloc(2);
        portBuf.writeUInt16BE(port, 0);

        const protoBuf = writeVarInt(47);
        const hostLenBuf = writeVarInt(hostBuf.length);
        const nextStateBuf = writeVarInt(1);
        const handshakePayload = Buffer.concat([Buffer.from([0x00]), protoBuf, hostLenBuf, hostBuf, portBuf, nextStateBuf]);
        const handshakePacket = Buffer.concat([writeVarInt(handshakePayload.length), handshakePayload]);

        const statusPayload = Buffer.from([0x00]);
        const statusPacket = Buffer.concat([writeVarInt(statusPayload.length), statusPayload]);

        socket.write(Buffer.concat([handshakePacket, statusPacket]));
      } catch (e) {
        if (!isResolved) {
          isResolved = true;
          cleanup();
          resolve({ online: false, ping: -1, error: e.message });
        }
      }
    });

    let receivedData = Buffer.alloc(0);
    socket.on('data', (data) => {
      receivedData = Buffer.concat([receivedData, data]);
      try {
        let offset = 0;
        const packetLen = readVarInt(receivedData, offset);
        offset += packetLen.bytesRead;
        const packetId = readVarInt(receivedData, offset);
        offset += packetId.bytesRead;

        const stringLen = readVarInt(receivedData, offset);
        offset += stringLen.bytesRead;

        if (receivedData.length >= offset + stringLen.value) {
          const jsonStr = receivedData.toString('utf8', offset, offset + stringLen.value);
          const parsed = JSON.parse(jsonStr);
          const latency = Date.now() - startTime;
          isResolved = true;
          cleanup();
          resolve({
            online: true,
            ping: latency,
            version: parsed.version ? (parsed.version.name || 'Minecraft') : 'Minecraft',
            players: parsed.players ? { online: parsed.players.online || 0, max: parsed.players.max || 0 } : { online: 0, max: 0 },
            description: typeof parsed.description === 'string' ? parsed.description : (parsed.description && (parsed.description.text || parsed.description.extra?.map(x => x.text).join('')) || 'Online Minecraft Server'),
            favicon: parsed.favicon || null
          });
        }
      } catch (e) {
        // Wait for more packet chunks
      }
    });
  });
}

function getServersFile() {
  const userDir = app.getPath('userData');
  return path.join(userDir, 'servers.json');
}

function loadServers() {
  const sFile = getServersFile();
  if (fs.existsSync(sFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(sFile, 'utf8'));
      if (Array.isArray(data) && data.length > 0) return data;
    } catch (e) {}
  }
  const defaultServers = [
    {
      id: 'hypixel',
      name: 'Hypixel Network',
      host: 'mc.hypixel.net',
      port: 25565,
      type: 'official',
      desc: 'The largest Minecraft minigame network'
    },
    {
      id: 'pika',
      name: 'PikaNetwork',
      host: 'play.pika-network.net',
      port: 25565,
      type: 'cracked',
      desc: 'Cracked & offline multiplayer friendly'
    },
    {
      id: 'jartex',
      name: 'JartexNetwork',
      host: 'play.jartexnetwork.com',
      port: 25565,
      type: 'cracked',
      desc: 'BedWars, SkyWars, and Survival'
    },
    {
      id: 'radmin_sample',
      name: 'Radmin VPN LAN World',
      host: '26.0.0.1',
      port: 25565,
      type: 'radmin',
      desc: 'Connect with friends over Radmin VPN / LAN'
    }
  ];
  try {
    fs.writeFileSync(sFile, JSON.stringify(defaultServers, null, 2), 'utf8');
  } catch (e) {}
  return defaultServers;
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    connectDiscordRpc();
    try {
      const cfg = loadConfig();
      const initialName = (cfg && cfg.username) || 'Player';
      updateDiscordPresence({
        state: 'In Launcher',
        details: `Profile: ${initialName}`,
        startTimestamp: Date.now()
      });
    } catch (e) {}

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}

// Window controls
ipcMain.on('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window:close', () => {
  if (mainWindow) mainWindow.close();
});

// Config & Environment
ipcMain.handle('config:load', () => {
  return loadConfig();
});

ipcMain.handle('config:save', (_event, newConfig) => {
  return saveConfig(newConfig);
});

ipcMain.handle('versions:get', async (_event, gameDir) => {
  return await getAllVersions(gameDir);
});

ipcMain.handle('shell:openPath', async (_event, targetPath) => {
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }
  return shell.openPath(targetPath);
});

// Skin IPC Handlers
ipcMain.handle('skin:save', async (_event, { username, dataUrl, model, gameDir }) => {
  try {
    const skinsDir = getSkinStorageDir();
    const safeName = (username || 'Player').trim();
    if (dataUrl && dataUrl.startsWith('data:image/png;base64,')) {
      const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
      const buf = Buffer.from(base64, 'base64');
      fs.writeFileSync(path.join(skinsDir, `${safeName}.png`), buf);
      fs.writeFileSync(path.join(skinsDir, 'current_skin.png'), buf);
    }
    fs.writeFileSync(path.join(skinsDir, 'skin_meta.json'), JSON.stringify({
      username: safeName,
      model: model || 'default',
      updatedAt: Date.now()
    }, null, 2), 'utf8');

    if (gameDir && fs.existsSync(gameDir)) {
      await syncSkinToGame(gameDir, safeName, 'Fabric 1.21.4', dataUrl, model);
    }
    return { success: true };
  } catch (err) {
    console.error('Failed to save skin:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('skin:get', async (_event, username) => {
  try {
    const skinsDir = getSkinStorageDir();
    const safeName = (username || 'Player').trim();
    const targetFile = fs.existsSync(path.join(skinsDir, `${safeName}.png`))
      ? path.join(skinsDir, `${safeName}.png`)
      : (fs.existsSync(path.join(skinsDir, 'current_skin.png')) ? path.join(skinsDir, 'current_skin.png') : null);

    if (targetFile) {
      const buf = fs.readFileSync(targetFile);
      const dataUrl = `data:image/png;base64,${buf.toString('base64')}`;
      let meta = { model: 'default' };
      const metaFile = path.join(skinsDir, 'skin_meta.json');
      if (fs.existsSync(metaFile)) {
        try { meta = JSON.parse(fs.readFileSync(metaFile, 'utf8')); } catch (e) {}
      }
      return { success: true, dataUrl, model: meta.model || 'default' };
    }
    return { success: false };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('skin:delete', async (_event, { username, gameDir }) => {
  try {
    const skinsDir = getSkinStorageDir();
    const safeName = (username || 'Player').trim();
    const f1 = path.join(skinsDir, `${safeName}.png`);
    const f2 = path.join(skinsDir, 'current_skin.png');
    if (fs.existsSync(f1)) try { fs.unlinkSync(f1); } catch (e) {}
    if (fs.existsSync(f2)) try { fs.unlinkSync(f2); } catch (e) {}

    if (gameDir && fs.existsSync(gameDir)) {
      const cslSkin = path.join(gameDir, 'CustomSkinLoader', 'LocalSkin', 'skins', `${safeName}.png`);
      if (fs.existsSync(cslSkin)) try { fs.unlinkSync(cslSkin); } catch (e) {}
      const packDir = path.join(gameDir, 'resourcepacks', 'OrbitSkinPack');
      if (fs.existsSync(packDir)) try { fs.rmSync(packDir, { recursive: true, force: true }); } catch (e) {}
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('optimizer:syncMod', (_event, gameDir) => {
  return syncFpsBoosterMod(gameDir);
});

ipcMain.handle('optimizer:applyGpuPreset', (_event, gameDir) => {
  return applyGpuOptionsPreset(gameDir);
});

// ==========================================================================
// ORBIT FPS BOOSTER MOD MANAGEMENT
// ==========================================================================
ipcMain.handle('fpsbooster:getStatus', (_event, gameDir) => {
  let targetDir = gameDir;
  if (!targetDir || typeof targetDir !== 'string') {
    const cfg = loadConfig();
    targetDir = (cfg && cfg.gameDir) || DEFAULT_CONFIG.gameDir;
  }
  const modFile = path.join(targetDir, 'mods', 'fpsbooster-1.0.0.jar');
  return {
    installed: fs.existsSync(modFile),
    filename: 'fpsbooster-1.0.0.jar',
    version: '1.0.0'
  };
});

ipcMain.handle('fpsbooster:install', (_event, gameDir) => {
  let targetDir = gameDir;
  if (!targetDir || typeof targetDir !== 'string') {
    const cfg = loadConfig();
    targetDir = (cfg && cfg.gameDir) || DEFAULT_CONFIG.gameDir;
  }
  const modsDir = path.join(targetDir, 'mods');
  if (!fs.existsSync(modsDir)) {
    fs.mkdirSync(modsDir, { recursive: true });
  }
  const src = findFpsBoosterJar();
  if (!src || !fs.existsSync(src)) {
    return { success: false, error: 'Source fpsbooster-1.0.0.jar not found.' };
  }
  const dest = path.join(modsDir, 'fpsbooster-1.0.0.jar');
  try {
    fs.copyFileSync(src, dest);
    return { success: true, installed: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('fpsbooster:uninstall', (_event, gameDir) => {
  let targetDir = gameDir;
  if (!targetDir || typeof targetDir !== 'string') {
    const cfg = loadConfig();
    targetDir = (cfg && cfg.gameDir) || DEFAULT_CONFIG.gameDir;
  }
  const dest = path.join(targetDir, 'mods', 'fpsbooster-1.0.0.jar');
  try {
    if (fs.existsSync(dest)) fs.unlinkSync(dest);
    return { success: true, installed: false };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// ==========================================================================
// CAPES SYSTEM IPC HANDLERS
// ==========================================================================
ipcMain.handle('cape:listPresets', () => {
  const capesDir = path.join(__dirname, 'assets', 'capes');
  const presetsMeta = [
    { id: 'orbit_crimson', name: 'Orbit Crimson', file: 'orbit_crimson.png', desc: 'Official Red & Obsidian client cloak' },
    { id: 'minecon_2011', name: 'MINECON 2011', file: 'minecon_2011.png', desc: 'Classic red Creeper cloak' },
    { id: 'minecon_2012', name: 'MINECON 2012', file: 'minecon_2012.png', desc: 'Golden Pickaxe dark blue cloak' },
    { id: 'minecon_2013', name: 'MINECON 2013', file: 'minecon_2013.png', desc: 'Piston badge dark cloak' },
    { id: 'minecon_2015', name: 'MINECON 2015', file: 'minecon_2015.png', desc: 'Iron Golem face cyan cloak' },
    { id: 'minecon_2016', name: 'MINECON 2016', file: 'minecon_2016.png', desc: 'Enderman face purple cloak' },
    { id: 'mojang_classic', name: 'Mojang Classic', file: 'mojang_classic.png', desc: 'Vintage Mojang ruby cloak' },
    { id: 'optifine_classic', name: 'OptiFine Classic', file: 'optifine_classic.png', desc: 'White OF logo on dark slate' }
  ];

  return presetsMeta.map(p => {
    let dataUrl = null;
    const filePath = path.join(capesDir, p.file);
    if (fs.existsSync(filePath)) {
      try {
        const buf = fs.readFileSync(filePath);
        dataUrl = `data:image/png;base64,${buf.toString('base64')}`;
      } catch (e) {}
    }
    return { ...p, dataUrl };
  });
});

ipcMain.handle('cape:save', async (_event, { username, dataUrl, gameDir }) => {
  try {
    const safeName = (username || 'Player').trim();
    const capesDir = getCapeStorageDir();
    const targetFile = path.join(capesDir, `${safeName}.png`);
    const currentFile = path.join(capesDir, 'current_cape.png');

    let base64Data = dataUrl;
    if (base64Data && base64Data.startsWith('data:image/png;base64,')) {
      base64Data = base64Data.replace(/^data:image\/png;base64,/, '');
    }
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(targetFile, buffer);
    fs.writeFileSync(currentFile, buffer);

    if (gameDir && fs.existsSync(gameDir)) {
      const cslCapeDir = path.join(gameDir, 'CustomSkinLoader', 'LocalSkin', 'capes');
      if (!fs.existsSync(cslCapeDir)) fs.mkdirSync(cslCapeDir, { recursive: true });
      fs.writeFileSync(path.join(cslCapeDir, `${safeName}.png`), buffer);
      fs.writeFileSync(path.join(cslCapeDir, `${safeName.toLowerCase()}.png`), buffer);
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('cape:get', async (_event, username) => {
  try {
    const safeName = (username || 'Player').trim();
    const capesDir = getCapeStorageDir();
    const targetFile = path.join(capesDir, `${safeName}.png`);
    const currentFile = path.join(capesDir, 'current_cape.png');
    let f = null;
    if (fs.existsSync(targetFile)) f = targetFile;
    else if (fs.existsSync(currentFile)) f = currentFile;

    if (f) {
      const buf = fs.readFileSync(f);
      return { success: true, dataUrl: `data:image/png;base64,${buf.toString('base64')}` };
    }
    return { success: false, dataUrl: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('cape:delete', async (_event, { username, gameDir }) => {
  try {
    const safeName = (username || 'Player').trim();
    const capesDir = getCapeStorageDir();
    const targetFile = path.join(capesDir, `${safeName}.png`);
    const currentFile = path.join(capesDir, 'current_cape.png');
    if (fs.existsSync(targetFile)) try { fs.unlinkSync(targetFile); } catch (e) {}
    if (fs.existsSync(currentFile)) try { fs.unlinkSync(currentFile); } catch (e) {}
    if (gameDir && fs.existsSync(gameDir)) {
      const c1 = path.join(gameDir, 'CustomSkinLoader', 'LocalSkin', 'capes', `${safeName}.png`);
      const c2 = path.join(gameDir, 'CustomSkinLoader', 'LocalSkin', 'capes', `${safeName.toLowerCase()}.png`);
      if (fs.existsSync(c1)) try { fs.unlinkSync(c1); } catch (e) {}
      if (fs.existsSync(c2)) try { fs.unlinkSync(c2); } catch (e) {}
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ==========================================================================
// MODPACK EXPORT & IMPORT (.orbit ZIP)
// ==========================================================================
ipcMain.handle('modpack:export', async (_event, gameDir) => {
  let targetDir = gameDir;
  if (!targetDir || typeof targetDir !== 'string') {
    const cfg = loadConfig();
    targetDir = (cfg && cfg.gameDir) || DEFAULT_CONFIG.gameDir;
  }
  const modsDir = path.join(targetDir, 'mods');
  if (!fs.existsSync(modsDir)) {
    return { success: false, error: 'Mods directory is empty or does not exist.' };
  }
  const modFiles = fs.readdirSync(modsDir).filter(f => f.toLowerCase().endsWith('.jar'));
  if (modFiles.length === 0) {
    return { success: false, error: 'No .jar mods found in mods folder to export.' };
  }

  const saveRes = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Orbit Modpack (.orbit)',
    defaultPath: 'OrbitModpack.orbit',
    filters: [
      { name: 'Orbit Modpack (*.orbit)', extensions: ['orbit'] },
      { name: 'Zip Archive (*.zip)', extensions: ['zip'] }
    ]
  });

  if (saveRes.canceled || !saveRes.filePath) {
    return { canceled: true };
  }

  try {
    const zip = new AdmZip();
    const manifest = {
      name: path.basename(saveRes.filePath).replace(/\.(orbit|zip)$/i, ''),
      format: 'orbit-modpack-v1',
      createdAt: new Date().toISOString(),
      launcher: 'Orbit Launcher Red Edition',
      modCount: modFiles.length,
      mods: []
    };

    for (const f of modFiles) {
      const fullPath = path.join(modsDir, f);
      const stat = fs.statSync(fullPath);
      zip.addLocalFile(fullPath, 'mods');
      manifest.mods.push({ name: f, size: stat.size });
    }

    const configDir = path.join(targetDir, 'config');
    if (fs.existsSync(configDir)) {
      try {
        zip.addLocalFolder(configDir, 'config');
      } catch (e) {}
    }

    zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2), 'utf8'));
    zip.writeZip(saveRes.filePath);

    return {
      success: true,
      filePath: saveRes.filePath,
      modCount: modFiles.length,
      name: manifest.name
    };
  } catch (err) {
    console.error('Failed to export modpack:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('modpack:import', async (_event, gameDir) => {
  let targetDir = gameDir;
  if (!targetDir || typeof targetDir !== 'string') {
    const cfg = loadConfig();
    targetDir = (cfg && cfg.gameDir) || DEFAULT_CONFIG.gameDir;
  }
  const modsDir = path.join(targetDir, 'mods');
  if (!fs.existsSync(modsDir)) {
    fs.mkdirSync(modsDir, { recursive: true });
  }

  const openRes = await dialog.showOpenDialog(mainWindow, {
    title: 'Import Orbit Modpack (.orbit / .zip)',
    filters: [
      { name: 'Orbit Modpack (*.orbit, *.zip)', extensions: ['orbit', 'zip'] }
    ],
    properties: ['openFile']
  });

  if (openRes.canceled || !openRes.filePaths || openRes.filePaths.length === 0) {
    return { canceled: true };
  }

  const packPath = openRes.filePaths[0];
  try {
    const zip = new AdmZip(packPath);
    const entries = zip.getEntries();
    let importedMods = 0;
    let manifestData = null;

    const manifestEntry = entries.find(e => e.entryName.toLowerCase() === 'manifest.json');
    if (manifestEntry) {
      try {
        manifestData = JSON.parse(manifestEntry.getData().toString('utf8'));
      } catch (e) {}
    }

    for (const entry of entries) {
      if (entry.isDirectory) continue;
      const norm = entry.entryName.replace(/\\/g, '/');
      if (norm.toLowerCase().endsWith('.jar')) {
        const jarName = path.basename(norm);
        fs.writeFileSync(path.join(modsDir, jarName), entry.getData());
        importedMods++;
      } else if (norm.startsWith('config/')) {
        const rel = norm.replace(/^config\//i, '');
        const dest = path.join(targetDir, 'config', rel);
        const parent = path.dirname(dest);
        if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
        fs.writeFileSync(dest, entry.getData());
      }
    }

    return {
      success: true,
      importedCount: importedMods,
      manifest: manifestData,
      packName: manifestData?.name || path.basename(packPath)
    };
  } catch (err) {
    console.error('Failed to import modpack:', err);
    return { success: false, error: err.message };
  }
});

// ==========================================================================
// ASSET MANAGEMENT (MODS, SHADERS, RESOURCE PACKS)
// ==========================================================================
ipcMain.handle('assets:list', async (_event, gameDir, type = 'mods') => {
  let targetDir = gameDir;
  if (!targetDir || typeof targetDir !== 'string') {
    const cfg = loadConfig();
    targetDir = (cfg && cfg.gameDir) || DEFAULT_CONFIG.gameDir;
  }
  let sub = 'mods';
  if (type === 'shader' || type === 'shaders' || type === 'shaderpacks') sub = 'shaderpacks';
  else if (type === 'resourcepack' || type === 'resourcepacks') sub = 'resourcepacks';

  const destDir = path.join(targetDir, sub);
  if (!fs.existsSync(destDir)) return [];
  try {
    const files = fs.readdirSync(destDir);
    return files
      .filter(f => !f.startsWith('.') && (f.endsWith('.jar') || f.endsWith('.zip') || fs.statSync(path.join(destDir, f)).isDirectory()))
      .map(f => {
        const fullPath = path.join(destDir, f);
        const stat = fs.statSync(fullPath);
        return {
          name: f,
          size: Math.round(stat.size / 1024) + ' KB',
          date: stat.mtime
        };
      });
  } catch (e) {
    return [];
  }
});

ipcMain.handle('assets:delete', async (_event, gameDir, type, filename) => {
  let targetDir = gameDir;
  if (!targetDir || typeof targetDir !== 'string') {
    const cfg = loadConfig();
    targetDir = (cfg && cfg.gameDir) || DEFAULT_CONFIG.gameDir;
  }
  let sub = 'mods';
  if (type === 'shader' || type === 'shaders' || type === 'shaderpacks') sub = 'shaderpacks';
  else if (type === 'resourcepack' || type === 'resourcepacks') sub = 'resourcepacks';

  const cleanName = path.basename(filename);
  const targetFile = path.join(targetDir, sub, cleanName);
  try {
    if (fs.existsSync(targetFile)) {
      if (fs.statSync(targetFile).isDirectory()) {
        fs.rmSync(targetFile, { recursive: true, force: true });
      } else {
        fs.unlinkSync(targetFile);
      }
      return { success: true };
    }
    return { success: false, error: 'File not found' };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// ==========================================================================
// SERVER MONITOR & DIRECT CONNECT IPC
// ==========================================================================
ipcMain.handle('server:list', () => {
  return loadServers();
});

ipcMain.handle('server:save', (_event, servers) => {
  try {
    fs.writeFileSync(getServersFile(), JSON.stringify(servers, null, 2), 'utf8');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('server:ping', async (_event, { host, port = 25565 }) => {
  return await pingMinecraftServer(host, parseInt(port, 10) || 25565);
});

ipcMain.handle('server:fixProperties', async () => {
  try {
    const res = await dialog.showOpenDialog(mainWindow, {
      title: 'Select server.properties or your Server Folder',
      properties: ['openFile', 'openDirectory'],
      filters: [
        { name: 'Server Properties / All Files', extensions: ['properties', '*'] }
      ]
    });
    if (res.canceled || !res.filePaths || res.filePaths.length === 0) {
      return { success: false, canceled: true };
    }
    let target = res.filePaths[0];
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
      target = path.join(target, 'server.properties');
    }
    if (!fs.existsSync(target)) {
      return { success: false, error: 'server.properties was not found in the selected folder.' };
    }
    let content = fs.readFileSync(target, 'utf8');
    content = content.replace(/online-mode\s*=\s*true/g, 'online-mode=false');
    if (!content.includes('online-mode=')) {
      content += '\nonline-mode=false\n';
    }
    content = content.replace(/enforce-secure-profile\s*=\s*true/g, 'enforce-secure-profile=false');
    if (!content.includes('enforce-secure-profile=')) {
      content += '\nenforce-secure-profile=false\n';
    }
    fs.writeFileSync(target, content, 'utf8');
    return { success: true, path: target };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ==========================================================================
// SCREENSHOTS GALLERY IPC
// ==========================================================================
ipcMain.handle('screenshots:list', async (_event, gameDir) => {
  let targetDir = gameDir;
  if (!targetDir || typeof targetDir !== 'string') {
    const cfg = loadConfig();
    targetDir = (cfg && cfg.gameDir) || DEFAULT_CONFIG.gameDir;
  }
  const sDir = path.join(targetDir, 'screenshots');
  if (!fs.existsSync(sDir)) return [];
  try {
    const files = fs.readdirSync(sDir);
    const pngs = files.filter(f => f.toLowerCase().endsWith('.png'));
    const results = [];
    for (const f of pngs) {
      const fullPath = path.join(sDir, f);
      const stat = fs.statSync(fullPath);
      const buf = fs.readFileSync(fullPath);
      results.push({
        name: f,
        path: fullPath,
        size: (stat.size / (1024 * 1024)).toFixed(2) + ' MB',
        date: stat.mtime.toLocaleDateString() + ' ' + stat.mtime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: stat.mtimeMs,
        dataUrl: `data:image/png;base64,${buf.toString('base64')}`
      });
    }
    results.sort((a, b) => b.timestamp - a.timestamp);
    return results;
  } catch (e) {
    console.error('Failed to list screenshots:', e);
    return [];
  }
});

ipcMain.handle('screenshots:copy', async (_event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) return { success: false, error: 'File does not exist' };
    const img = nativeImage.createFromPath(filePath);
    clipboard.writeImage(img);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('screenshots:open', async (_event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) return { success: false, error: 'File does not exist' };
    shell.showItemInFolder(filePath);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('screenshots:delete', async (_event, filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return { success: true };
    }
    return { success: false, error: 'File not found' };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// Legacy mods:list compatibility
ipcMain.handle('mods:list', (_event, gameDir) => {
  let targetDir = gameDir;
  if (!targetDir || typeof targetDir !== 'string') {
    const cfg = loadConfig();
    targetDir = (cfg && cfg.gameDir) || DEFAULT_CONFIG.gameDir;
  }
  const modsDir = path.join(targetDir, 'mods');
  if (!fs.existsSync(modsDir)) return [];
  try {
    const files = fs.readdirSync(modsDir);
    return files.filter(f => f.toLowerCase().endsWith('.jar')).map(f => {
      const stat = fs.statSync(path.join(modsDir, f));
      return {
        name: f,
        size: Math.round(stat.size / 1024) + ' KB'
      };
    });
  } catch (e) {
    return [];
  }
});

// Helper for extracting maps into game/saves
function installMapFromZipBuffer(zipBuffer, savesDir, mapName) {
  try {
    const zip = new AdmZip(zipBuffer);
    const zipEntries = zip.getEntries();

    // Find where level.dat is located
    const levelDatEntry = zipEntries.find(e => e.entryName.replace(/\\/g, '/').toLowerCase().endsWith('level.dat'));

    // Clean map folder name
    const cleanMapName = (mapName || 'Custom_Map').replace(/[\\/:*?"<>|]/g, '_').trim();
    let targetFolder = path.join(savesDir, cleanMapName);
    let counter = 1;
    while (fs.existsSync(targetFolder)) {
      targetFolder = path.join(savesDir, `${cleanMapName}_${counter++}`);
    }
    fs.mkdirSync(targetFolder, { recursive: true });

    if (levelDatEntry) {
      const levelDatPath = levelDatEntry.entryName.replace(/\\/g, '/');
      const rootPrefix = levelDatPath.includes('/') ? levelDatPath.substring(0, levelDatPath.lastIndexOf('/') + 1) : '';

      zipEntries.forEach(entry => {
        const normalized = entry.entryName.replace(/\\/g, '/');
        if (rootPrefix && !normalized.startsWith(rootPrefix)) return;

        const relativePath = rootPrefix ? normalized.substring(rootPrefix.length) : normalized;
        if (!relativePath) return;

        const destPath = path.join(targetFolder, relativePath);
        if (entry.isDirectory) {
          fs.mkdirSync(destPath, { recursive: true });
        } else {
          const destDir = path.dirname(destPath);
          if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
          fs.writeFileSync(destPath, entry.getData());
        }
      });
    } else {
      zip.extractAllTo(targetFolder, true);
    }

    return { success: true, folderName: path.basename(targetFolder) };
  } catch (err) {
    console.error('Error extracting map zip:', err);
    return { success: false, error: err.message };
  }
}

// Mod Center IPC Handlers (Modrinth API)
ipcMain.handle('mods:search', async (_event, params = {}) => {
  const { query = '', loader, gameVersion, category, limit = 24, offset = 0, projectType = 'mod' } = params;
  try {
    const validTypes = ['mod', 'shader', 'resourcepack'];
    const pType = validTypes.includes(projectType) ? projectType : 'mod';
    const facets = [[`project_type:${pType}`]];
    if (pType === 'mod' && loader && loader !== 'all') {
      facets.push([`categories:${loader.toLowerCase()}`]);
    }
    if (gameVersion && gameVersion !== 'all') {
      facets.push([`versions:${gameVersion}`]);
    }
    if (category && category !== 'all') {
      facets.push([`categories:${category.toLowerCase()}`]);
    }

    const url = new URL('https://api.modrinth.com/v2/search');
    if (query) url.searchParams.set('query', query);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('offset', String(offset));
    url.searchParams.set('facets', JSON.stringify(facets));

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'OrbitLauncher/1.0 (contact@orbitlauncher.local)' }
    });
    if (!res.ok) throw new Error(`Modrinth search error: HTTP ${res.status}`);
    const data = await res.json();
    return {
      total: data.total_hits || 0,
      hits: (data.hits || []).map(h => ({
        id: h.project_id,
        slug: h.slug,
        title: h.title,
        description: h.description,
        categories: h.categories || [],
        clientSide: h.client_side,
        serverSide: h.server_side,
        iconUrl: h.icon_url,
        downloads: h.downloads,
        follows: h.follows,
        author: h.author
      }))
    };
  } catch (err) {
    console.error('Failed to search Modrinth:', err);
    return { total: 0, hits: [], error: err.message };
  }
});

ipcMain.handle('mods:install', async (_event, params = {}) => {
  const { slugOrId, gameVersion, loader, gameDir, projectType = 'mod' } = params;
  let activeDir = gameDir;
  if (!activeDir || typeof activeDir !== 'string') {
    const cfg = loadConfig();
    activeDir = (cfg && cfg.gameDir) || DEFAULT_CONFIG.gameDir;
  }
  let subDir = 'mods';
  if (projectType === 'shader' || projectType === 'shaders') subDir = 'shaderpacks';
  else if (projectType === 'resourcepack' || projectType === 'resourcepacks') subDir = 'resourcepacks';

  const destDir = path.join(activeDir, subDir);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  try {
    const vUrl = `https://api.modrinth.com/v2/project/${slugOrId}/version`;
    const vRes = await fetch(vUrl, {
      headers: { 'User-Agent': 'OrbitLauncher/1.0 (contact@orbitlauncher.local)' }
    });
    if (!vRes.ok) throw new Error(`Could not fetch versions for ${slugOrId}`);
    const versions = await vRes.json();
    if (!Array.isArray(versions) || versions.length === 0) {
      throw new Error('No compatible versions found for this mod');
    }

    let chosenVersion = null;
    const cleanGameVer = (gameVersion || '').replace(/Fabric|OptiFine|Forge|Minecraft/gi, '').trim();
    const cleanLoader = (loader || '').toLowerCase();

    if (cleanGameVer && cleanLoader) {
      chosenVersion = versions.find(v => 
        v.game_versions.includes(cleanGameVer) && 
        v.loaders.some(l => l.toLowerCase() === cleanLoader)
      );
    }
    if (!chosenVersion && cleanLoader) {
      chosenVersion = versions.find(v => v.loaders.some(l => l.toLowerCase() === cleanLoader));
    }
    if (!chosenVersion && cleanGameVer) {
      chosenVersion = versions.find(v => v.game_versions.includes(cleanGameVer));
    }
    if (!chosenVersion) {
      chosenVersion = versions[0];
    }

    const primaryFile = chosenVersion.files.find(f => f.primary) || chosenVersion.files[0];
    if (!primaryFile || !primaryFile.url) {
      throw new Error('No downloadable file found for this mod version');
    }

    const fileRes = await fetch(primaryFile.url);
    if (!fileRes.ok) throw new Error(`Download failed: HTTP ${fileRes.status}`);
    const buffer = Buffer.from(await fileRes.arrayBuffer());

    const destPath = path.join(destDir, primaryFile.filename);
    fs.writeFileSync(destPath, buffer);

    return {
      success: true,
      filename: primaryFile.filename,
      versionNumber: chosenVersion.version_number,
      size: Math.round(buffer.length / 1024) + ' KB'
    };
  } catch (err) {
    console.error('Failed to install mod:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('mods:delete', async (_event, filename, gameDir) => {
  let activeDir = gameDir;
  if (!activeDir || typeof activeDir !== 'string') {
    const cfg = loadConfig();
    activeDir = (cfg && cfg.gameDir) || DEFAULT_CONFIG.gameDir;
  }
  try {
    const cleanName = path.basename(filename);
    const targetFile = path.join(activeDir, 'mods', cleanName);
    if (fs.existsSync(targetFile)) {
      fs.unlinkSync(targetFile);
      return { success: true };
    }
    return { success: false, error: 'File not found' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('mods:getDetails', async (_event, slugOrId) => {
  try {
    const cleanId = encodeURIComponent(slugOrId);
    const [pRes, vRes] = await Promise.all([
      fetch(`https://api.modrinth.com/v2/project/${cleanId}`, {
        headers: { 'User-Agent': 'OrbitLauncher/1.0 (contact@orbitlauncher.local)' }
      }),
      fetch(`https://api.modrinth.com/v2/project/${cleanId}/version`, {
        headers: { 'User-Agent': 'OrbitLauncher/1.0 (contact@orbitlauncher.local)' }
      })
    ]);

    if (!pRes.ok) throw new Error(`Modrinth project error: HTTP ${pRes.status}`);
    const project = await pRes.json();
    const versions = vRes.ok ? await vRes.json() : [];

    return {
      success: true,
      project: {
        id: project.id,
        slug: project.slug,
        title: project.title,
        description: project.description,
        body: project.body || '',
        iconUrl: project.icon_url,
        categories: project.categories || [],
        clientSide: project.client_side,
        serverSide: project.server_side,
        downloads: project.downloads,
        followers: project.followers,
        sourceUrl: project.source_url,
        issuesUrl: project.issues_url,
        wikiUrl: project.wiki_url,
        discordUrl: project.discord_url,
        gallery: (project.gallery || []).map(g => ({
          url: g.url || g.raw_url,
          rawUrl: g.raw_url || g.url,
          title: g.title || '',
          description: g.description || ''
        }))
      },
      versions: (versions || []).map(v => ({
        id: v.id,
        name: v.name,
        versionNumber: v.version_number,
        gameVersions: v.game_versions || [],
        loaders: v.loaders || [],
        datePublished: v.date_published,
        downloads: v.downloads,
        files: (v.files || []).map(f => ({
          url: f.url,
          filename: f.filename,
          size: f.size,
          primary: !!f.primary
        }))
      }))
    };
  } catch (err) {
    console.error('Failed to get mod details:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('mods:installFile', async (_event, params = {}) => {
  const { fileUrl, filename, gameDir, projectType = 'mod' } = params;
  if (!fileUrl || !filename) {
    return { success: false, error: 'Missing download URL or filename' };
  }
  let activeDir = gameDir;
  if (!activeDir || typeof activeDir !== 'string') {
    const cfg = loadConfig();
    activeDir = (cfg && cfg.gameDir) || DEFAULT_CONFIG.gameDir;
  }
  let subDir = 'mods';
  if (projectType === 'shader' || projectType === 'shaders') subDir = 'shaderpacks';
  else if (projectType === 'resourcepack' || projectType === 'resourcepacks') subDir = 'resourcepacks';

  const destDir = path.join(activeDir, subDir);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  try {
    const fileRes = await fetch(fileUrl, {
      headers: { 'User-Agent': 'OrbitLauncher/1.0 (contact@orbitlauncher.local)' }
    });
    if (!fileRes.ok) throw new Error(`Download failed: HTTP ${fileRes.status}`);
    const buffer = Buffer.from(await fileRes.arrayBuffer());

    const cleanFilename = path.basename(filename);
    const destPath = path.join(destDir, cleanFilename);
    fs.writeFileSync(destPath, buffer);

    return {
      success: true,
      filename: cleanFilename,
      size: Math.round(buffer.length / 1024) + ' KB'
    };
  } catch (err) {
    console.error('Failed to install mod file:', err);
    return { success: false, error: err.message };
  }
});

// Maps & Worlds Hub IPC Handlers
ipcMain.handle('maps:list', async (_event, gameDir) => {
  let activeDir = gameDir;
  if (!activeDir || typeof activeDir !== 'string') {
    const cfg = loadConfig();
    activeDir = (cfg && cfg.gameDir) || DEFAULT_CONFIG.gameDir;
  }
  const savesDir = path.join(activeDir, 'saves');
  if (!fs.existsSync(savesDir)) return [];

  try {
    const entries = fs.readdirSync(savesDir, { withFileTypes: true });
    const worlds = [];
    for (const ent of entries) {
      if (ent.isDirectory()) {
        const fullDir = path.join(savesDir, ent.name);
        const levelDat = path.join(fullDir, 'level.dat');
        if (fs.existsSync(levelDat)) {
          const stat = fs.statSync(levelDat);
          worlds.push({
            name: ent.name,
            folderName: ent.name,
            lastPlayed: stat.mtimeMs,
            formattedDate: new Date(stat.mtimeMs).toLocaleDateString('en-US', {
              year: 'numeric', month: 'short', day: 'numeric'
            })
          });
        }
      }
    }
    worlds.sort((a, b) => b.lastPlayed - a.lastPlayed);
    return worlds;
  } catch (err) {
    console.error('Failed to list maps:', err);
    return [];
  }
});

ipcMain.handle('maps:install', async (_event, params = {}) => {
  const { mapUrl, mapName, gameDir } = params;
  let activeDir = gameDir;
  if (!activeDir || typeof activeDir !== 'string') {
    const cfg = loadConfig();
    activeDir = (cfg && cfg.gameDir) || DEFAULT_CONFIG.gameDir;
  }
  const savesDir = path.join(activeDir, 'saves');
  if (!fs.existsSync(savesDir)) {
    fs.mkdirSync(savesDir, { recursive: true });
  }

  try {
    let buffer;
    if (mapUrl.startsWith('http://') || mapUrl.startsWith('https://')) {
      const res = await fetch(mapUrl);
      if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
      buffer = Buffer.from(await res.arrayBuffer());
    } else {
      const localPath = path.isAbsolute(mapUrl) ? mapUrl : path.join(__dirname, mapUrl);
      if (!fs.existsSync(localPath)) throw new Error(`Local map file not found: ${localPath}`);
      buffer = fs.readFileSync(localPath);
    }
    return installMapFromZipBuffer(buffer, savesDir, mapName);
  } catch (err) {
    console.error('Failed to install map:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('maps:importZip', async (_event, gameDir) => {
  let activeDir = gameDir;
  if (!activeDir || typeof activeDir !== 'string') {
    const cfg = loadConfig();
    activeDir = (cfg && cfg.gameDir) || DEFAULT_CONFIG.gameDir;
  }
  const savesDir = path.join(activeDir, 'saves');
  if (!fs.existsSync(savesDir)) {
    fs.mkdirSync(savesDir, { recursive: true });
  }

  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Minecraft World (.zip)',
      filters: [{ name: 'Minecraft Map Archive', extensions: ['zip'] }],
      properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const zipPath = result.filePaths[0];
    const buffer = fs.readFileSync(zipPath);
    const defaultName = path.basename(zipPath, path.extname(zipPath));
    return installMapFromZipBuffer(buffer, savesDir, defaultName);
  } catch (err) {
    console.error('Failed to import map zip:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('maps:delete', async (_event, folderName, gameDir) => {
  let activeDir = gameDir;
  if (!activeDir || typeof activeDir !== 'string') {
    const cfg = loadConfig();
    activeDir = (cfg && cfg.gameDir) || DEFAULT_CONFIG.gameDir;
  }
  try {
    const cleanName = path.basename(folderName);
    const targetDir = path.join(activeDir, 'saves', cleanName);
    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
      return { success: true };
    }
    return { success: false, error: 'World folder not found' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Game Launch Engine
ipcMain.handle('game:launch', async (event, launchConfig) => {
  const { username, selectedVersion, ramGb, gameDir, javaPath } = launchConfig;
  
  const sendStatus = (text, type = 'info') => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('game:status', { text, type });
    }
  };

  try {
    sendStatus('Verifying game files and environment...', 'info');

    // 0. Synchronize custom skin and cape to game client (CustomSkinLoader)
    sendStatus('Synchronizing player skin and cosmetics...', 'info');
    await syncSkinToGame(gameDir, username, selectedVersion, launchConfig.customSkinDataUrl, launchConfig.currentArmModel);

    // 0.5 Deploy multiplayer LAN fix for seamless Radmin VPN / Open to LAN support
    ensureMultiplayerFixes(gameDir, selectedVersion);

    // 1. Sanitize any existing version json (remove duplicate ASM, fix native paths)
    sanitizeVersionJson(gameDir, selectedVersion);

    // 2. Profile preparation (Fabric, NeoForge, Forge)
    const lowerVer = selectedVersion.toLowerCase();
    if (lowerVer.includes('fabric')) {
      const hasLocalJson = fs.existsSync(path.join(gameDir, 'versions', selectedVersion, `${selectedVersion}.json`));
      if (!hasLocalJson) {
        sendStatus(`Fetching Fabric loader profile for ${selectedVersion}...`, 'info');
        const ok = await ensureFabricProfile(gameDir, selectedVersion);
        if (!ok) {
          throw new Error(`Failed to configure Fabric profile for ${selectedVersion}.`);
        }
      }
    } else if (lowerVer.includes('neoforge')) {
      sendStatus(`Verifying NeoForge profile and libraries for ${selectedVersion}...`, 'info');
      const ok = await ensureNeoForgeProfile(gameDir, selectedVersion, sendStatus);
      if (!ok) {
        throw new Error(`Failed to configure NeoForge profile for ${selectedVersion}.`);
      }
    } else if (lowerVer.includes('forge')) {
      sendStatus(`Verifying Forge profile and libraries for ${selectedVersion}...`, 'info');
      const ok = await ensureForgeProfile(gameDir, selectedVersion, sendStatus);
      if (!ok) {
        throw new Error(`Failed to configure Forge profile for ${selectedVersion}.`);
      }
    }

    sendStatus(`Preparing ${selectedVersion} launch...`, 'info');

    const launcher = new Client();

    // Determine version descriptor safely without hard crash
    const hasCustomJson = fs.existsSync(path.join(gameDir, 'versions', selectedVersion, `${selectedVersion}.json`));
    const match = selectedVersion.match(/(\d+\.\d+(\.\d+)?)/);
    const mcNum = match ? match[1] : '1.21.4';

    let versionObj = {
      number: mcNum,
      type: 'release'
    };

    if (hasCustomJson) {
      versionObj.custom = selectedVersion;
    } else if (lowerVer.includes('fabric') || lowerVer.includes('neoforge') || lowerVer.includes('forge') || lowerVer.includes('optifine')) {
      throw new Error(`Profile configuration for ${selectedVersion} was not found. Please restart the launcher and try again.`);
    } else {
      versionObj = {
        number: selectedVersion,
        type: 'release'
      };
      if (hasCustomJson && isNaN(Number(selectedVersion[0]))) {
        versionObj.custom = selectedVersion;
      }
    }

    const mcMatch = selectedVersion.match(/(\d+)\.(\d+)/);
    const isLegacy = mcMatch && parseInt(mcMatch[1], 10) === 1 && parseInt(mcMatch[2], 10) <= 16;
    let customArgs = isLegacy ? [
      '-XX:+UseG1GC',
      '-XX:MaxGCPauseMillis=50'
    ] : [
      '-XX:+UseG1GC',
      '-XX:+ParallelRefProcEnabled',
      '-XX:MaxGCPauseMillis=200',
      '-XX:+UnlockExperimentalVMOptions',
      '-XX:+DisableExplicitGC',
      '-XX:+AlwaysPreTouch',
      '-XX:G1NewSizePercent=30',
      '-XX:G1MaxNewSizePercent=40',
      '-XX:G1ReservePercent=20',
      '-XX:G1HeapWastePercent=5',
      '-XX:G1MixedGCCountTarget=4',
      '-XX:InitiatingHeapOccupancyPercent=15',
      '-XX:G1MixedGCLiveThresholdPercent=90',
      '-XX:G1RSetUpdatingPauseTimePercent=5',
      '-XX:SurvivorRatio=32',
      '-XX:+PerfDisableSharedMem',
      '-XX:MaxTenuringThreshold=1'
    ];

    // Check if the version profile defines arguments.jvm (e.g. NeoForge / Forge)
    const verJsonPath = path.join(gameDir, 'versions', selectedVersion, `${selectedVersion}.json`);
    const jvmArgsFromProfile = [];
    if (fs.existsSync(verJsonPath)) {
      try {
        const vData = JSON.parse(fs.readFileSync(verJsonPath, 'utf8'));
        if (vData.arguments && Array.isArray(vData.arguments.jvm)) {
          const libDir = path.join(gameDir, 'libraries').replace(/\\/g, '/');
          const sep = process.platform === 'win32' ? ';' : ':';
          const mcVerStr = match ? match[1] : '';

          for (const rawArg of vData.arguments.jvm) {
            if (typeof rawArg === 'string') {
              let resolved = rawArg
                .replaceAll('${library_directory}', libDir)
                .replaceAll('${classpath_separator}', sep)
                .replaceAll('${version_name}', selectedVersion);

              if (resolved.startsWith('-DignoreList=')) {
                // Ensure duplicate module scanning of version jar is prevented
                const extraIgnores = [
                  'client-extra',
                  `${selectedVersion}.jar`,
                  `${selectedVersion.replace(/\s+/g, '-')}.jar`,
                  `${selectedVersion.toLowerCase().replace(/\s+/g, '-')}.jar`,
                  mcVerStr ? `${mcVerStr}.jar` : '',
                  'client.jar'
                ].filter(Boolean);
                resolved = `-DignoreList=${Array.from(new Set(extraIgnores)).join(',')}`;
              }
              jvmArgsFromProfile.push(resolved);
            }
          }
        }
      } catch (e) {
        console.warn('Failed to parse arguments.jvm from version profile:', e);
      }
    }

    const optimalJava = await getOptimalJavaPath(selectedVersion, javaPath, sendStatus);

    const isModern = !mcMatch || (parseInt(mcMatch[1], 10) === 1 && parseInt(mcMatch[2], 10) >= 20);
    const resolvedMajor = getJavaMajor(optimalJava === 'javaw' ? 'javaw' : optimalJava);
    if (isModern && resolvedMajor > 0 && resolvedMajor < 21) {
      const errMsg = `Minecraft ${selectedVersion} requires Java 21 or later! Found Java ${resolvedMajor}. Please install Java 21 or use the bundled runtime.`;
      sendStatus(errMsg, 'error');
      return { success: false, error: errMsg };
    }

    if (resolvedMajor >= 17) {
      const moduleOpens = [
        '--add-opens=java.base/java.lang.invoke=ALL-UNNAMED',
        '--add-opens=java.base/java.util.jar=ALL-UNNAMED',
        '--add-opens=java.base/java.lang=ALL-UNNAMED',
        '--add-opens=java.base/java.util=ALL-UNNAMED',
        '--add-opens=java.base/sun.security.util=ALL-UNNAMED',
        '--add-opens=java.base/java.io=ALL-UNNAMED',
        '--add-opens=java.base/java.nio.file=ALL-UNNAMED',
        '--add-opens=java.base/java.lang.reflect=ALL-UNNAMED',
        '--add-exports=jdk.naming.dns/com.sun.jndi.dns=java.naming'
      ];
      for (const open of moduleOpens) {
        if (!jvmArgsFromProfile.includes(open)) {
          jvmArgsFromProfile.push(open);
        }
      }
    }

    customArgs = [...customArgs, ...jvmArgsFromProfile];

    const safePlayerName = (username && username.trim()) ? username.trim() : 'Player';
    const playerUuid = getOfflinePlayerUUID(safePlayerName);
    const authObj = {
      access_token: playerUuid,
      client_token: playerUuid,
      uuid: playerUuid,
      name: safePlayerName,
      user_properties: '{}',
      meta: { type: 'mojang' }
    };

    const launchOptions = {
      authorization: authObj,
      root: gameDir,
      version: versionObj,
      memory: {
        max: `${ramGb}G`,
        min: `${Math.min(2, ramGb)}G`
      },
      customArgs: customArgs
    };

    if (optimalJava && optimalJava !== 'javaw') {
      launchOptions.javaPath = optimalJava;
    }

    // Direct Connect / Quick Join support (Radmin VPN & multiplayer servers)
    if (launchConfig.quickJoinServer && launchConfig.quickJoinServer.host) {
      const qHost = String(launchConfig.quickJoinServer.host).trim();
      const qPort = String(launchConfig.quickJoinServer.port || 25565).trim();
      launchOptions.customLaunchArgs = ['--server', qHost, '--port', qPort];
      launchOptions.quickPlay = {
        type: 'multiplayer',
        identifier: `${qHost}:${qPort}`
      };
      console.log(`[Launcher]: Direct Connect Quick Play configured for ${qHost}:${qPort}`);
    }

    let lastMclcError = null;

    launcher.on('debug', (e) => {
      console.log('[MCLC DEBUG]:', e);
      if (typeof e === 'string') {
        if (e.includes('Failed to start due to')) {
          lastMclcError = e;
          sendStatus(e, 'error');
        } else if (e.includes('Downloading') || e.includes('Extracting') || e.includes('Launching')) {
          sendStatus(e, 'debug');
        }
      }
    });

    launcher.on('progress', (e) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('game:progress', e);
      }
    });

    launcher.on('data', (e) => {
      console.log('[MC STDOUT]:', e);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('game:status', { text: String(e).trim(), type: 'sys' });
      }
    });

    sendStatus('Starting Minecraft JVM process...', 'info');

    const proc = await launcher.launch(launchOptions);

    if (proc) {
      currentChildProcess = proc;
      sendStatus(`Minecraft started successfully! (PID: ${proc.pid})`, 'success');

      try {
        updateDiscordPresence({
          state: `Playing as ${safePlayerName}`,
          details: `Minecraft ${selectedVersion}`,
          startTimestamp: Date.now()
        });
      } catch (e) {}

      if (proc.stdout) {
        proc.stdout.on('data', (d) => {
          const str = d.toString().trim();
          if (str && mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('game:status', { text: str, type: 'sys' });
          }
        });
      }

      if (proc.stderr) {
        proc.stderr.on('data', (d) => {
          const str = d.toString().trim();
          if (str && mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('game:status', { text: str, type: 'warn' });
          }
        });
      }

      proc.on('close', (code) => {
        currentChildProcess = null;
        if (code === 0) {
          sendStatus('Minecraft closed normally.', 'info');
        } else {
          sendStatus(`Minecraft process exited (code: ${code})`, 'info');
        }
        try {
          updateDiscordPresence({
            state: 'In Launcher',
            details: `Profile: ${safePlayerName}`,
            startTimestamp: Date.now()
          });
        } catch (e) {}

        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('game:closed', code);
        }
      });

      return { success: true, pid: proc.pid };
    } else {
      const errMsg = lastMclcError || 'Failed to start Minecraft process. Check launch logs.';
      sendStatus(errMsg, 'error');
      return { success: false, error: errMsg };
    }

  } catch (err) {
    console.error('Launch Error:', err);
    sendStatus(`Critical launch error: ${err.message}`, 'error');
    return { success: false, error: err.message };
  }
});

// ==========================================================================
// GITHUB RELEASES AUTO-UPDATER SYSTEM (Loshara228ss/orbitlauncher)
// ==========================================================================
const GITHUB_REPO = 'Loshara228ss/orbitlauncher';

function compareSemver(v1, v2) {
  const parse = (v) => String(v || '0').replace(/^v/i, '').split('.').map(x => parseInt(x, 10) || 0);
  const p1 = parse(v1);
  const p2 = parse(v2);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

ipcMain.handle('app:getVersion', () => {
  return app.getVersion() || '1.0.7';
});

ipcMain.handle('updater:check', async () => {
  const currentVersion = app.getVersion() || '1.0.7';
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: {
        'User-Agent': 'OrbitLauncher-Updater',
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (res.status === 404) {
      return {
        updateAvailable: false,
        currentVersion,
        message: 'You have the latest version installed.'
      };
    }

    if (!res.ok) {
      throw new Error(`GitHub API HTTP ${res.status}`);
    }

    const release = await res.json();
    const remoteTag = release.tag_name || release.name || '';
    const isNewer = compareSemver(remoteTag, currentVersion) > 0;

    let asset = null;
    if (Array.isArray(release.assets)) {
      asset = release.assets.find(a => a.name && a.name.toLowerCase().endsWith('.exe'));
      if (!asset && release.assets.length > 0) asset = release.assets[0];
    }

    return {
      updateAvailable: isNewer,
      currentVersion,
      newVersion: remoteTag,
      title: release.name || remoteTag,
      notes: release.body || 'New update available for Orbit Launcher.',
      publishedAt: release.published_at,
      downloadUrl: asset ? asset.browser_download_url : release.html_url,
      fileName: asset ? asset.name : 'OrbitLauncher-Setup.exe',
      fileSize: asset && asset.size ? (asset.size / (1024 * 1024)).toFixed(1) + ' MB' : null
    };
  } catch (err) {
    console.warn('[Updater]: Update check warning:', err.message);
    return {
      updateAvailable: false,
      currentVersion,
      error: err.message
    };
  }
});

let activeDownloadController = null;

ipcMain.handle('updater:download', async (event, downloadUrl) => {
  if (!downloadUrl) return { success: false, error: 'No download URL provided' };
  try {
    const tempDir = app.getPath('temp');
    const targetFile = path.join(tempDir, 'OrbitLauncher-Setup-Update.exe');

    activeDownloadController = new AbortController();
    const res = await fetch(downloadUrl, {
      signal: activeDownloadController.signal,
      headers: { 'User-Agent': 'OrbitLauncher-Updater' }
    });

    if (!res.ok) throw new Error(`Download HTTP ${res.status}`);
    const totalBytes = parseInt(res.headers.get('content-length') || '0', 10);

    const fileStream = fs.createWriteStream(targetFile);
    const reader = res.body.getReader();
    let receivedBytes = 0;
    const startTime = Date.now();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      receivedBytes += value.length;
      fileStream.write(Buffer.from(value));

      if (totalBytes > 0 && mainWindow && !mainWindow.isDestroyed()) {
        const percent = Math.min(100, Math.round((receivedBytes / totalBytes) * 100));
        const elapsedSec = (Date.now() - startTime) / 1000;
        const speedMb = elapsedSec > 0 ? (receivedBytes / (1024 * 1024 * elapsedSec)).toFixed(2) : '0';
        mainWindow.webContents.send('updater:progress', {
          percent,
          downloadedMb: (receivedBytes / (1024 * 1024)).toFixed(1),
          totalMb: (totalBytes / (1024 * 1024)).toFixed(1),
          speed: speedMb
        });
      }
    }

    fileStream.end();
    await new Promise((resolve, reject) => {
      fileStream.on('finish', resolve);
      fileStream.on('error', reject);
    });

    return { success: true, filePath: targetFile };
  } catch (err) {
    console.error('[Updater]: Download error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('updater:install', async (event, filePath) => {
  try {
    const installerPath = filePath || path.join(app.getPath('temp'), 'OrbitLauncher-Setup-Update.exe');
    if (!fs.existsSync(installerPath)) {
      return { success: false, error: 'Installer file not found on disk' };
    }

    const { spawn } = require('child_process');
    spawn(installerPath, ['/SILENT'], {
      detached: true,
      stdio: 'ignore'
    }).unref();

    setTimeout(() => {
      app.quit();
    }, 600);

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

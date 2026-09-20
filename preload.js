const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),

  // Config & System
  loadConfig: () => ipcRenderer.invoke('config:load'),
  saveConfig: (config) => ipcRenderer.invoke('config:save', config),
  getVersions: (gameDir) => ipcRenderer.invoke('versions:get', gameDir),
  openPath: (targetPath) => ipcRenderer.invoke('shell:openPath', targetPath),

  // Orbit FPS Booster Mod
  getFpsBoosterStatus: (gameDir) => ipcRenderer.invoke('fpsbooster:getStatus', gameDir),
  installFpsBooster: (gameDir) => ipcRenderer.invoke('fpsbooster:install', gameDir),
  uninstallFpsBooster: (gameDir) => ipcRenderer.invoke('fpsbooster:uninstall', gameDir),

  // Modpack Export & Import (.orbit)
  exportModpack: (gameDir) => ipcRenderer.invoke('modpack:export', gameDir),
  importModpack: (gameDir) => ipcRenderer.invoke('modpack:import', gameDir),

  // Mod & Optimizer
  syncMod: (gameDir) => ipcRenderer.invoke('optimizer:syncMod', gameDir),
  applyGpuPreset: (gameDir) => ipcRenderer.invoke('optimizer:applyGpuPreset', gameDir),
  getMods: (gameDir) => ipcRenderer.invoke('mods:list', gameDir),
  searchMods: (params) => ipcRenderer.invoke('mods:search', params),
  getModDetails: (slugOrId) => ipcRenderer.invoke('mods:getDetails', slugOrId),
  installMod: (params) => ipcRenderer.invoke('mods:install', params),
  installModFile: (params) => ipcRenderer.invoke('mods:installFile', params),
  deleteMod: (filename, gameDir) => ipcRenderer.invoke('mods:delete', filename, gameDir),

  // Assets (Mods, Shaders, Resource Packs)
  listAssets: (gameDir, type) => ipcRenderer.invoke('assets:list', gameDir, type),
  deleteAsset: (gameDir, type, filename) => ipcRenderer.invoke('assets:delete', gameDir, type, filename),

  // Maps & Worlds
  listMaps: (gameDir) => ipcRenderer.invoke('maps:list', gameDir),
  installMap: (params) => ipcRenderer.invoke('maps:install', params),
  importMapZip: (gameDir) => ipcRenderer.invoke('maps:importZip', gameDir),
  deleteMap: (folderName, gameDir) => ipcRenderer.invoke('maps:delete', folderName, gameDir),

  // Skins & Cosmetics
  saveSkin: (data) => ipcRenderer.invoke('skin:save', data),
  getSkin: (username) => ipcRenderer.invoke('skin:get', username),
  deleteSkin: (params) => ipcRenderer.invoke('skin:delete', params),

  // Capes System
  listCapePresets: () => ipcRenderer.invoke('cape:listPresets'),
  saveCape: (data) => ipcRenderer.invoke('cape:save', data),
  getCape: (username) => ipcRenderer.invoke('cape:get', username),
  deleteCape: (params) => ipcRenderer.invoke('cape:delete', params),

  // Server Monitor & Ping
  getServers: () => ipcRenderer.invoke('server:list'),
  saveServers: (servers) => ipcRenderer.invoke('server:save', servers),
  pingServer: (params) => ipcRenderer.invoke('server:ping', params),
  fixServerProperties: () => ipcRenderer.invoke('server:fixProperties'),

  // Screenshots Gallery
  listScreenshots: (gameDir) => ipcRenderer.invoke('screenshots:list', gameDir),
  copyScreenshot: (filePath) => ipcRenderer.invoke('screenshots:copy', filePath),
  openScreenshot: (filePath) => ipcRenderer.invoke('screenshots:open', filePath),
  deleteScreenshot: (filePath) => ipcRenderer.invoke('screenshots:delete', filePath),

  // Launcher
  launchGame: (launchConfig) => ipcRenderer.invoke('game:launch', launchConfig),
  onGameStatus: (callback) => {
    const subscription = (_event, value) => callback(value);
    ipcRenderer.on('game:status', subscription);
    return () => ipcRenderer.removeListener('game:status', subscription);
  },
  onGameProgress: (callback) => {
    const subscription = (_event, value) => callback(value);
    ipcRenderer.on('game:progress', subscription);
    return () => ipcRenderer.removeListener('game:progress', subscription);
  },
  onGameClosed: (callback) => {
    const subscription = (_event, value) => callback(value);
    ipcRenderer.on('game:closed', subscription);
    return () => ipcRenderer.removeListener('game:closed', subscription);
  },

  // Auto-Updater (GitHub Releases)
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  downloadUpdate: (downloadUrl) => ipcRenderer.invoke('updater:download', downloadUrl),
  installUpdate: (filePath) => ipcRenderer.invoke('updater:install', filePath),
  onUpdateProgress: (callback) => {
    const subscription = (_event, value) => callback(value);
    ipcRenderer.on('updater:progress', subscription);
    return () => ipcRenderer.removeListener('updater:progress', subscription);
  }
});

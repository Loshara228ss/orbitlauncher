// ==========================================================================
// ORBIT LAUNCHER — RENDERER CONTROLLER (RED & BLACK, ZERO EMOJIS, PURE SVGS)
// ==========================================================================

let appConfig = {
  username: 'Player',
  selectedVersion: 'Fabric 1.21.4',
  ramGb: 4,
  gameDir: '',
  javaPath: '',
  autoCloseOnLaunch: false,
  gpuOptimized: true
};

let localInstalledSet = new Set();
let avatarDebounceTimer = null;
let isLaunching = false;
let skinViewer = null;

// Custom Skin State
let customSkinDataUrl = null;
let currentArmModel = 'default'; // 'default' (Classic 4px) or 'slim' (Alex 3px)

// Window Controls
const btnMinimize = document.getElementById('btn-minimize');
const btnMaximize = document.getElementById('btn-maximize');
const btnClose = document.getElementById('btn-close');

// Navigation Tabs & Panes
const navButtons = document.querySelectorAll('.nav-button');
const stagePanes = document.querySelectorAll('.stage-pane');

// Profile & 3D Skin
const playerAvatar = document.getElementById('player-avatar');
const usernameInput = document.getElementById('username-input');
const heroAvatarImg = document.getElementById('hero-avatar-img');
const heroProfileName = document.getElementById('hero-profile-name');
const profileBigAvatar = document.getElementById('profile-big-avatar');
const profileUsernameInput = document.getElementById('profile-username-input');
const skinModelBadge = document.getElementById('skin-model-badge');
const skinSourceText = document.getElementById('skin-source-text');
const skinSourceDot = document.getElementById('skin-source-dot');
const skinDropzone = document.getElementById('skin-dropzone');
const skinFileInput = document.getElementById('skin-file-input');
const btnResetSkinFile = document.getElementById('btn-reset-skin-file');
const modelToggleBtns = document.querySelectorAll('.model-toggle-btn');

// Launch Controls & Displays
const displayVersionTitle = document.getElementById('display-version-title');
const hudEngineVal = document.getElementById('hud-engine-val');
const versionSelect = document.getElementById('version-select');
const btnLaunch = document.getElementById('btn-launch');
const btnLaunchText = document.getElementById('btn-launch-text');

// Custom Version Dropdown Elements
const customVersionDropdown = document.getElementById('custom-version-dropdown');
const versionDropdownTrigger = document.getElementById('version-dropdown-trigger');
const triggerBadgeCat = document.getElementById('trigger-badge-cat');
const triggerVersionName = document.getElementById('trigger-version-name');
const triggerStatusChip = document.getElementById('trigger-status-chip');
const versionDropdownMenu = document.getElementById('version-dropdown-menu');
const versionSearchInput = document.getElementById('version-search-input');
const catFilterBtns = document.querySelectorAll('.cat-filter-btn');
const btnToggleSnapshots = document.getElementById('btn-toggle-snapshots');
const versionOptionsList = document.getElementById('version-options-list');

// RAM UI Elements
const hudRamVal = document.getElementById('hud-ram-val');
const ramValueBadge = document.getElementById('ram-value-badge');
const ramSlider = document.getElementById('ram-slider');
const ramSegmentBtns = document.querySelectorAll('.ram-segment-btn');
const notchChips = document.querySelectorAll('.notch-chip');

// Settings Fields
const inputGameDir = document.getElementById('input-gamedir');
const inputJavaPath = document.getElementById('input-javapath');
const toggleAutoClose = document.getElementById('toggle-autoclose');

// Quick Actions & Folders
const btnOpenMods = document.getElementById('btn-open-mods');
const btnOpenGame = document.getElementById('btn-open-game');
const btnBrowseGameDir = document.getElementById('btn-browse-gamedir');
const btnBrowseJavaPath = document.getElementById('btn-browse-javapath');
const btnSaveSettings = document.getElementById('btn-save-settings');

// Mod Center Elements
const btnRefreshMods = document.getElementById('btn-refresh-mods');
const btnOpenModsTab = document.getElementById('btn-open-mods-tab');
const btnSubtabModstore = document.getElementById('btn-subtab-modstore');
const btnSubtabInstalledmods = document.getElementById('btn-subtab-installedmods');
const subpaneModstore = document.getElementById('subpane-modstore');
const subpaneInstalledmods = document.getElementById('subpane-installedmods');
const modstoreSearchInput = document.getElementById('modstore-search-input');
const btnClearModSearch = document.getElementById('btn-clear-mod-search');
const modCategoryChips = document.querySelectorAll('.hub-filter-chip[data-modcat]');
const modstoreCardsGrid = document.getElementById('modstore-cards-grid');
const modstorePillTotal = document.getElementById('modstore-pill-total');
const installedModsCounter = document.getElementById('installed-mods-counter');
const modsItemsList = document.getElementById('mods-items-list');
const sidebarModsCount = document.getElementById('sidebar-mods-count');
const tileModsStatus = document.getElementById('tile-mods-status');

// Mod Details Modal Elements
const modDetailsModal = document.getElementById('mod-details-modal');
const btnDetailsBack = document.getElementById('btn-details-back');
const btnDetailsClose = document.getElementById('btn-details-close');
const detailsLoaderState = document.getElementById('details-loader-state');
const detailsMainBody = document.getElementById('details-main-body');
const detailsModIcon = document.getElementById('details-mod-icon');
const detailsModTitle = document.getElementById('details-mod-title');
const detailsModSummary = document.getElementById('details-mod-summary');
const detailsCategoriesList = document.getElementById('details-categories-list');
const detailsDownloadsCount = document.getElementById('details-downloads-count');
const detailsFollowersCount = document.getElementById('details-followers-count');
const detailsClientServerTag = document.getElementById('details-client-server-tag');
const btnDetailsQuickInstall = document.getElementById('btn-details-quick-install');
const detailsQuickInstallText = document.getElementById('details-quick-install-text');
const detailsQuickTargetLabel = document.getElementById('details-quick-target-label');
const btnDetailsTabOverview = document.getElementById('btn-details-tab-overview');
const btnDetailsTabVersions = document.getElementById('btn-details-tab-versions');
const detailsContentOverview = document.getElementById('details-content-overview');
const detailsContentVersions = document.getElementById('details-content-versions');
const detailsVersionsTotalBadge = document.getElementById('details-versions-total-badge');
const detailsGallerySection = document.getElementById('details-gallery-section');
const galleryCounterTag = document.getElementById('gallery-counter-tag');
const galleryMainImg = document.getElementById('gallery-main-img');
const galleryCaptionOverlay = document.getElementById('gallery-caption-overlay');
const galleryCaptionTitle = document.getElementById('gallery-caption-title');
const galleryCaptionSub = document.getElementById('gallery-caption-sub');
const galleryThumbnailsStrip = document.getElementById('gallery-thumbnails-strip');
const modMarkdownBody = document.getElementById('mod-markdown-body');
const detailsFilterGameVersion = document.getElementById('details-filter-game-version');
const detailsLoaderPills = document.querySelectorAll('.vloader-pill');
const detailsVersionSearch = document.getElementById('details-version-search');
const detailsVersionsRows = document.getElementById('details-versions-rows');

// Progress Bar & Console Output
const consoleStatusText = document.getElementById('console-status-text');
const progressBarFill = document.getElementById('progress-bar-fill');
const xpLevelBadge = document.getElementById('xp-level-badge');
const btnToggleConsole = document.getElementById('btn-toggle-console');
const collapsibleConsole = document.getElementById('collapsible-console');
const consoleLogs = document.getElementById('console-logs');

// Account Switcher Elements
const btnAccountSwitcher = document.getElementById('btn-account-switcher');
const accountMenuPopover = document.getElementById('account-menu-popover');
const accountMenuList = document.getElementById('account-menu-list');
const inputNewAccount = document.getElementById('input-new-account');
const btnAddAccount = document.getElementById('btn-add-account');
const topbarUsername = document.getElementById('topbar-username');
const topbarAvatar = document.getElementById('topbar-avatar');

// Capes Studio Elements
const capesPresetsGrid = document.getElementById('capes-presets-grid');
const btnUploadCape = document.getElementById('btn-upload-cape');
const capeFileInput = document.getElementById('cape-file-input');
const btnClearCape = document.getElementById('btn-clear-cape');

// Orbit FPS Booster Elements
const fpsboosterExclusiveCard = document.getElementById('fpsbooster-exclusive-card');
const fpsboosterStatusChip = document.getElementById('fpsbooster-status-chip');
const btnToggleFpsbooster = document.getElementById('btn-toggle-fpsbooster');

// Modpack Elements
const btnExportModpack = document.getElementById('btn-export-modpack');
const btnImportModpack = document.getElementById('btn-import-modpack');

// Content Type Switcher Elements
const btnTypeMods = document.getElementById('btn-type-mods');
const btnTypeShaders = document.getElementById('btn-type-shaders');
const btnTypeResourcepacks = document.getElementById('btn-type-resourcepacks');

// Servers Hub Elements
const btnAddServerToggle = document.getElementById('btn-add-server-toggle');
const btnRefreshServers = document.getElementById('btn-refresh-servers');
const addServerCard = document.getElementById('add-server-card');
const btnCancelAddServer = document.getElementById('btn-cancel-add-server');
const btnSaveNewServer = document.getElementById('btn-save-new-server');
const newServerName = document.getElementById('new-server-name');
const newServerHost = document.getElementById('new-server-host');
const newServerPort = document.getElementById('new-server-port');
const serversCardsGrid = document.getElementById('servers-cards-grid');

// Screenshots Gallery Elements
const btnOpenScreenshotsFolder = document.getElementById('btn-open-screenshots-folder');
const btnRefreshScreenshots = document.getElementById('btn-refresh-screenshots');
const screenshotsGridContainer = document.getElementById('screenshots-grid-container');
const screenshotLightboxModal = document.getElementById('screenshot-lightbox-modal');
const lightboxBackdrop = document.getElementById('lightbox-backdrop');
const lightboxFilename = document.getElementById('lightbox-filename');
const lightboxImg = document.getElementById('lightbox-img');
const btnLightboxCopy = document.getElementById('btn-lightbox-copy');
const btnLightboxOpen = document.getElementById('btn-lightbox-open');
const btnLightboxClose = document.getElementById('btn-lightbox-close');

// ==========================================================================
// WINDOW CONTROL BINDINGS
// ==========================================================================
if (btnMinimize) btnMinimize.addEventListener('click', () => window.electronAPI.minimize());
if (btnMaximize) btnMaximize.addEventListener('click', () => window.electronAPI.maximize());
if (btnClose) btnClose.addEventListener('click', () => window.electronAPI.close());

// ==========================================================================
// TAB NAVIGATION & PROFILE JUMP
// ==========================================================================
function switchTab(targetId) {
  navButtons.forEach(b => {
    if (b.getAttribute('data-tab') === targetId) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });

  stagePanes.forEach(p => {
    if (p.id === targetId) {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });

  if (targetId === 'tab-mods') {
    initModCenter();
    checkFpsBoosterStatus();
  }
  if (targetId === 'tab-profile') {
    if (skinViewer) {
      skinViewer.zoom = 0.70;
      if (skinViewer.playerObject) {
        skinViewer.playerObject.position.y = 4;
      }
      skinViewer.adjustCameraDistance();
    }
    loadCapesStudio();
  }
  if (targetId === 'tab-servers') {
    loadServersHub();
  }
  if (targetId === 'tab-screenshots') {
    loadScreenshotsGallery();
  }
}

navButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.getAttribute('data-tab');
    switchTab(targetId);
  });
});

const sidebarPlayerCard = document.getElementById('sidebar-player-card');
if (sidebarPlayerCard) {
  sidebarPlayerCard.addEventListener('click', (e) => {
    if (e.target === usernameInput) return;
    switchTab('tab-profile');
  });
}

const heroProfileCard = document.getElementById('hero-profile-card');
if (heroProfileCard) {
  heroProfileCard.addEventListener('click', () => switchTab('tab-profile'));
}

// ==========================================================================
// CONSOLE LOGGING & TOGGLE
// ==========================================================================
if (btnToggleConsole && collapsibleConsole) {
  btnToggleConsole.addEventListener('click', () => {
    const isHidden = collapsibleConsole.style.display === 'none';
    collapsibleConsole.style.display = isHidden ? 'block' : 'none';
    const textSpan = btnToggleConsole.querySelector('span');
    if (textSpan) {
      textSpan.textContent = isHidden ? 'HIDE LOGS' : 'LAUNCH LOGS';
    }
  });
}

function appendLog(message, type = 'sys') {
  if (!consoleLogs) return;
  const line = document.createElement('div');
  line.className = `log-entry log-${type}`;
  const time = new Date().toLocaleTimeString('en-US', { hour12: false });
  line.textContent = `[${time}] ${message}`;
  consoleLogs.appendChild(line);
  consoleLogs.scrollTop = consoleLogs.scrollHeight;
}

function updateStatus(text, type = 'info') {
  if (consoleStatusText) consoleStatusText.textContent = text;
  if (type === 'error') appendLog(text, 'err');
  else if (type === 'success') appendLog(text, 'ok');
  else if (type === 'warning') appendLog(text, 'warn');
  else appendLog(text, 'sys');
}

// ==========================================================================
// 3D ROTATING SKIN VIEWER & PROFILE STUDIO
// ==========================================================================
function update3DSkin(name, force = false) {
  if (customSkinDataUrl && !force) {
    loadSkinIntoViewer(customSkinDataUrl, currentArmModel);
    return;
  }

  const cleanName = (name || 'Player').trim();
  const safeName = encodeURIComponent(cleanName);
  const cacheBuster = force ? `?t=${Date.now()}` : '';
  const skinUrl = `https://mc-heads.net/skin/${safeName}${cacheBuster}`;
  const avatarUrl = `https://mc-heads.net/avatar/${safeName}/64${cacheBuster}`;

  if (playerAvatar) playerAvatar.src = avatarUrl;
  if (heroAvatarImg) heroAvatarImg.src = avatarUrl;
  if (profileBigAvatar) profileBigAvatar.src = avatarUrl;
  if (heroProfileName) heroProfileName.textContent = cleanName;

  if (usernameInput && usernameInput.value !== cleanName) {
    usernameInput.value = cleanName;
  }
  if (profileUsernameInput && profileUsernameInput.value !== cleanName) {
    profileUsernameInput.value = cleanName;
  }

  if (skinSourceText) skinSourceText.textContent = 'Source: Mojang Online Sync';
  if (skinSourceDot) skinSourceDot.style.background = '#ef4444';

  loadSkinIntoViewer(skinUrl, currentArmModel);
}

function loadSkinIntoViewer(sourceUrl, modelType = 'default') {
  const canvas = document.getElementById('skin-canvas');
  if (!canvas) return;

  try {
    if (window.skinview3d) {
      if (!skinViewer) {
        skinViewer = new skinview3d.SkinViewer({
          canvas: canvas,
          width: 300,
          height: 320,
          skin: sourceUrl,
          model: modelType
        });
        skinViewer.zoom = 0.70;
        skinViewer.autoRotate = true;
        skinViewer.autoRotateSpeed = 0.7;
        if (skinViewer.playerObject) {
          skinViewer.playerObject.position.y = 4;
        }
        if (skinview3d.IdleAnimation) {
          skinViewer.animation = new skinview3d.IdleAnimation();
        }
      } else {
        skinViewer.loadSkin(sourceUrl, { model: modelType });
      }

      if (activeCapeDataUrl) {
        skinViewer.loadCape(activeCapeDataUrl);
      }

      if (skinModelBadge) {
        skinModelBadge.textContent = modelType === 'slim' ? 'MODEL: SLIM ALEX (3PX)' : 'MODEL: CLASSIC (4PX)';
      }
    }
  } catch (err) {
    console.error('Skin viewer error:', err);
  }
}

function generateAvatarFromCustomSkin(dataUrl) {
  const img = new Image();
  img.onload = () => {
    try {
      const offscreen = document.createElement('canvas');
      offscreen.width = 64;
      offscreen.height = 64;
      const ctx = offscreen.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      ctx.drawImage(img, 8, 8, 8, 8, 0, 0, 64, 64);
      ctx.drawImage(img, 40, 8, 8, 8, 0, 0, 64, 64);

      const avatarData = offscreen.toDataURL('image/png');
      if (playerAvatar) playerAvatar.src = avatarData;
      if (heroAvatarImg) heroAvatarImg.src = avatarData;
      if (profileBigAvatar) profileBigAvatar.src = avatarData;
    } catch (e) {
      console.warn('Offscreen avatar generation warning:', e);
    }
  };
  img.src = dataUrl;
}

function handleCustomSkinFile(file) {
  if (!file) return;
  if (!file.type.includes('png') && !file.name.toLowerCase().endsWith('.png')) {
    appendLog('Skin file must be a .png image', 'warn');
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    customSkinDataUrl = e.target.result;
    loadSkinIntoViewer(customSkinDataUrl, currentArmModel);
    generateAvatarFromCustomSkin(customSkinDataUrl);

    if (skinSourceText) {
      skinSourceText.textContent = `Source: ${file.name}`;
    }
    if (skinSourceDot) {
      skinSourceDot.style.background = '#22c55e';
    }

    try {
      await window.electronAPI.saveSkin({
        username: appConfig.username || 'Player',
        dataUrl: customSkinDataUrl,
        model: currentArmModel,
        gameDir: appConfig.gameDir
      });
      appendLog(`Custom skin synchronized & applied to game: ${file.name}`, 'ok');
    } catch (err) {
      console.warn('Skin sync warning:', err);
    }
  };
  reader.readAsDataURL(file);
}

if (skinDropzone) {
  skinDropzone.addEventListener('click', () => {
    if (skinFileInput) skinFileInput.click();
  });

  skinDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    skinDropzone.classList.add('dragover');
  });

  skinDropzone.addEventListener('dragleave', () => {
    skinDropzone.classList.remove('dragover');
  });

  skinDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    skinDropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleCustomSkinFile(e.dataTransfer.files[0]);
    }
  });
}

if (skinFileInput) {
  skinFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleCustomSkinFile(e.target.files[0]);
    }
  });
}

modelToggleBtns.forEach(btn => {
  btn.addEventListener('click', async () => {
    modelToggleBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentArmModel = btn.getAttribute('data-model') || 'default';

    const source = customSkinDataUrl || `https://mc-heads.net/skin/${encodeURIComponent(appConfig.username)}`;
    loadSkinIntoViewer(source, currentArmModel);
    if (customSkinDataUrl) {
      try {
        await window.electronAPI.saveSkin({
          username: appConfig.username || 'Player',
          dataUrl: customSkinDataUrl,
          model: currentArmModel,
          gameDir: appConfig.gameDir
        });
      } catch (e) {}
    }
    appendLog(`Arm model set to: ${currentArmModel === 'slim' ? 'Slim Alex (3px)' : 'Classic (4px)'}`, 'sys');
  });
});

if (btnResetSkinFile) {
  btnResetSkinFile.addEventListener('click', async () => {
    customSkinDataUrl = null;
    try {
      await window.electronAPI.deleteSkin({
        username: appConfig.username || 'Player',
        gameDir: appConfig.gameDir
      });
    } catch (e) {}
    update3DSkin(appConfig.username, true);
    appendLog('Reverted to default / Mojang online skin sync', 'sys');
  });
}

if (usernameInput) {
  usernameInput.addEventListener('input', (e) => {
    const val = e.target.value;
    appConfig.username = val;
    if (profileUsernameInput) profileUsernameInput.value = val;
    clearTimeout(avatarDebounceTimer);
    avatarDebounceTimer = setTimeout(async () => {
      try {
        const savedSkin = await window.electronAPI.getSkin(val);
        if (savedSkin && savedSkin.success && savedSkin.dataUrl) {
          customSkinDataUrl = savedSkin.dataUrl;
          currentArmModel = savedSkin.model || 'default';
          modelToggleBtns.forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-model') === currentArmModel);
          });
          loadSkinIntoViewer(customSkinDataUrl, currentArmModel);
          generateAvatarFromCustomSkin(customSkinDataUrl);
          if (skinSourceText) skinSourceText.textContent = 'Source: Custom Skin (Saved)';
          if (skinSourceDot) skinSourceDot.style.background = '#22c55e';
        } else if (!customSkinDataUrl) {
          update3DSkin(val);
        }
      } catch (err) {
        if (!customSkinDataUrl) update3DSkin(val);
      }
      saveCurrentConfig();
    }, 400);
  });
}

const btnApplyProfileName = document.getElementById('btn-apply-profile-name');
if (btnApplyProfileName && profileUsernameInput) {
  btnApplyProfileName.addEventListener('click', async () => {
    const val = profileUsernameInput.value.trim() || 'Player';
    appConfig.username = val;
    if (usernameInput) usernameInput.value = val;
    try {
      const savedSkin = await window.electronAPI.getSkin(val);
      if (savedSkin && savedSkin.success && savedSkin.dataUrl) {
        customSkinDataUrl = savedSkin.dataUrl;
        currentArmModel = savedSkin.model || 'default';
        modelToggleBtns.forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-model') === currentArmModel);
        });
        loadSkinIntoViewer(customSkinDataUrl, currentArmModel);
        generateAvatarFromCustomSkin(customSkinDataUrl);
        if (skinSourceText) skinSourceText.textContent = 'Source: Custom Skin (Saved)';
        if (skinSourceDot) skinSourceDot.style.background = '#22c55e';
      } else if (!customSkinDataUrl) {
        update3DSkin(val);
      }
    } catch (err) {
      if (!customSkinDataUrl) update3DSkin(val);
    }
    saveCurrentConfig();
    appendLog(`Nickname changed to "${val}"`, 'sys');
  });

  profileUsernameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      btnApplyProfileName.click();
    }
  });
}

const presetChips = document.querySelectorAll('.preset-chip');
presetChips.forEach(chip => {
  chip.addEventListener('click', () => {
    const nick = chip.getAttribute('data-nick');
    if (nick) {
      customSkinDataUrl = null;
      appConfig.username = nick;
      if (usernameInput) usernameInput.value = nick;
      if (profileUsernameInput) profileUsernameInput.value = nick;
      update3DSkin(nick);
      saveCurrentConfig();
      appendLog(`Applied preset skin: ${nick}`, 'sys');
    }
  });
});

const animPillBtns = document.querySelectorAll('.anim-pill-btn');
animPillBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    animPillBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const animType = btn.getAttribute('data-anim');
    if (!skinViewer || !window.skinview3d) return;

    if (animType === 'idle' && skinview3d.IdleAnimation) {
      skinViewer.animation = new skinview3d.IdleAnimation();
    } else if (animType === 'walk' && skinview3d.WalkingAnimation) {
      skinViewer.animation = new skinview3d.WalkingAnimation();
    } else if (animType === 'run' && skinview3d.RunningAnimation) {
      skinViewer.animation = new skinview3d.RunningAnimation();
    } else if (animType === 'fly' && skinview3d.FlyingAnimation) {
      skinViewer.animation = new skinview3d.FlyingAnimation();
    }
  });
});

const btnToggleRotate = document.getElementById('btn-toggle-rotate');
const rotateIcon = document.getElementById('rotate-icon');
const rotateText = document.getElementById('rotate-text');
if (btnToggleRotate) {
  btnToggleRotate.addEventListener('click', () => {
    if (!skinViewer) return;
    skinViewer.autoRotate = !skinViewer.autoRotate;
    if (skinViewer.autoRotate) {
      btnToggleRotate.classList.add('active');
      if (rotateIcon) {
        rotateIcon.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
      }
      if (rotateText) rotateText.textContent = 'Auto-Rotate: ON';
    } else {
      btnToggleRotate.classList.remove('active');
      if (rotateIcon) {
        rotateIcon.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>`;
      }
      if (rotateText) rotateText.textContent = 'Auto-Rotate: OFF';
    }
  });
}

const btnResetPose = document.getElementById('btn-reset-pose');
if (btnResetPose) {
  btnResetPose.addEventListener('click', () => {
    if (skinViewer) {
      skinViewer.resetCameraPose();
      skinViewer.zoom = 0.70;
      if (skinViewer.playerObject) {
        skinViewer.playerObject.position.y = 4;
      }
    }
  });
}

const btnRefreshSkin = document.getElementById('btn-refresh-skin');
if (btnRefreshSkin) {
  btnRefreshSkin.addEventListener('click', () => {
    if (customSkinDataUrl) {
      loadSkinIntoViewer(customSkinDataUrl, currentArmModel);
    } else {
      update3DSkin(appConfig.username, true);
    }
    appendLog('Skin texture reloaded', 'sys');
  });
}

// ==========================================================================
// RAM ALLOCATION (SLIDER, NOTCHES & SEGMENTS - 100% ALIGNED)
// ==========================================================================
function setRam(val) {
  const ram = parseInt(val, 10) || 4;
  appConfig.ramGb = ram;

  if (ramSlider) ramSlider.value = ram;
  if (ramValueBadge) ramValueBadge.textContent = `${ram} GB`;
  if (hudRamVal) hudRamVal.textContent = `${ram}.0 GB`;

  ramSegmentBtns.forEach(btn => {
    const btnRam = parseInt(btn.getAttribute('data-ram'), 10);
    if (btnRam === ram) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  notchChips.forEach(chip => {
    const chipRam = parseInt(chip.getAttribute('data-ram'), 10);
    if (chipRam === ram) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });
}

if (ramSlider) {
  ramSlider.addEventListener('input', (e) => setRam(e.target.value));
  ramSlider.addEventListener('change', () => {
    saveCurrentConfig();
    appendLog(`Memory saved: ${appConfig.ramGb} GB RAM`, 'sys');
  });
}

ramSegmentBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const ram = btn.getAttribute('data-ram');
    setRam(ram);
    saveCurrentConfig();
    appendLog(`Memory set: ${appConfig.ramGb} GB RAM`, 'sys');
  });
});

notchChips.forEach(chip => {
  chip.addEventListener('click', () => {
    const ram = chip.getAttribute('data-ram');
    setRam(ram);
    saveCurrentConfig();
    appendLog(`Memory set: ${appConfig.ramGb} GB RAM`, 'sys');
  });
});

// ==========================================================================
// ALL VERSIONS & CUSTOM ANIMATED CATEGORY DROPDOWN (100+ BUILDS + SNAPSHOTS)
// ==========================================================================
let allVersionItems = [];
let cachedVersionsRaw = null;
let currentCategoryFilter = 'all';
let showSnapshots = false;

function getVersionCategory(verName) {
  const lower = (verName || '').toLowerCase();
  if (lower.includes('fabric')) return 'fabric';
  if (lower.includes('optifine')) return 'optifine';
  if (lower.includes('forge') || lower.includes('neoforge')) return 'forge';
  if (lower.includes('snapshot') || lower.includes('pre-release') || lower.includes('rc') || /^\d\dw\d\d[a-z]$/.test(verName)) {
    return 'snapshots';
  }
  return 'vanilla';
}

const CATEGORY_ORDER = ['fabric', 'forge', 'optifine', 'vanilla', 'snapshots'];
const CATEGORY_META = {
  fabric: {
    id: 'fabric',
    label: 'Fabric',
    badgeClass: 'cat-badge-fabric',
    iconSvg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>`
  },
  forge: {
    id: 'forge',
    label: 'Forge',
    badgeClass: 'cat-badge-forge',
    iconSvg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`
  },
  optifine: {
    id: 'optifine',
    label: 'OptiFine',
    badgeClass: 'cat-badge-optifine',
    iconSvg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path></svg>`
  },
  vanilla: {
    id: 'vanilla',
    label: 'Vanilla',
    badgeClass: 'cat-badge-vanilla',
    iconSvg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="3"></rect><path d="M3 9h18M9 21V9"></path></svg>`
  },
  snapshots: {
    id: 'snapshots',
    label: 'Snapshots',
    badgeClass: 'cat-badge-vanilla',
    iconSvg: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>`
  }
};

function updateButtonState(selectedVer) {
  const isDownloaded = localInstalledSet.has(selectedVer);

  if (displayVersionTitle) {
    displayVersionTitle.textContent = isDownloaded
      ? `${selectedVer.toUpperCase()} (INSTALLED)`
      : `${selectedVer.toUpperCase()}`;
  }

  if (hudEngineVal) {
    hudEngineVal.textContent = selectedVer;
  }

  if (xpLevelBadge) {
    const shortVer = selectedVer.replace(/Fabric|OptiFine|Forge|Minecraft/gi, '').trim();
    xpLevelBadge.textContent = shortVer || selectedVer;
  }

  if (!btnLaunchText) return;

  if (isDownloaded) {
    btnLaunchText.textContent = 'PLAY';
  } else {
    btnLaunchText.textContent = 'DOWNLOAD & PLAY';
  }
}

function selectVersion(verName, category) {
  const cat = category || getVersionCategory(verName);
  const isInstalled = localInstalledSet.has(verName);

  appConfig.selectedVersion = verName;
  if (versionSelect) versionSelect.value = verName;

  if (triggerBadgeCat) {
    triggerBadgeCat.textContent = cat.toUpperCase();
    triggerBadgeCat.className = `trigger-badge-cat cat-badge-${cat === 'snapshots' ? 'vanilla' : cat}`;
  }
  if (triggerVersionName) {
    triggerVersionName.textContent = verName;
  }
  if (triggerStatusChip) {
    triggerStatusChip.textContent = isInstalled ? 'READY' : 'DOWNLOAD';
    triggerStatusChip.className = `trigger-status-chip ${isInstalled ? 'ready' : ''}`;
  }

  updateButtonState(verName);

  if (versionOptionsList) {
    const items = versionOptionsList.querySelectorAll('.version-option-item');
    items.forEach(el => {
      if (el.getAttribute('data-value') === verName) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
  }

  closeVersionDropdown();
  saveCurrentConfig();
  appendLog(`Selected version: ${verName}`, 'sys');
}

function renderVersionDropdown(items, activeVer) {
  if (!versionOptionsList) return;
  versionOptionsList.innerHTML = '';

  const groups = {
    fabric: [],
    forge: [],
    optifine: [],
    vanilla: [],
    snapshots: []
  };

  items.forEach(item => {
    if (groups[item.category]) {
      groups[item.category].push(item);
    }
  });

  CATEGORY_ORDER.forEach(catKey => {
    const groupItems = groups[catKey];
    if (!groupItems || groupItems.length === 0) return;

    groupItems.sort((a, b) => {
      if (a.installed && !b.installed) return -1;
      if (!a.installed && b.installed) return 1;
      return 0;
    });

    const meta = CATEGORY_META[catKey];
    const groupDiv = document.createElement('div');
    groupDiv.className = 'category-group';
    groupDiv.setAttribute('data-category', catKey);

    const header = document.createElement('div');
    header.className = 'category-group-header';
    header.innerHTML = `
      <div class="group-badge">
        ${meta.iconSvg}
        <span>${meta.label}</span>
      </div>
      <span class="group-count">${groupItems.length} builds</span>
    `;
    groupDiv.appendChild(header);

    groupItems.forEach(ver => {
      const isSelected = ver.name === activeVer;
      const optEl = document.createElement('div');
      optEl.className = `version-option-item ${ver.installed ? 'installed' : ''} ${isSelected ? 'selected' : ''}`;
      optEl.setAttribute('data-value', ver.name);
      optEl.setAttribute('data-category', catKey);

      const statusTagHtml = ver.installed
        ? `<span class="option-status-tag tag-ready">READY</span>`
        : `<span class="option-status-tag tag-download">DOWNLOAD</span>`;

      optEl.innerHTML = `
        <div class="option-left">
          <span class="option-dot"></span>
          <span class="option-title">${ver.name}</span>
        </div>
        ${statusTagHtml}
      `;

      optEl.addEventListener('click', (e) => {
        e.stopPropagation();
        selectVersion(ver.name, catKey);
      });

      groupDiv.appendChild(optEl);
    });

    versionOptionsList.appendChild(groupDiv);
  });
}

function openVersionDropdown() {
  if (!customVersionDropdown) return;
  customVersionDropdown.classList.add('is-open');
  if (versionDropdownTrigger) versionDropdownTrigger.setAttribute('aria-expanded', 'true');
  if (versionSearchInput) {
    versionSearchInput.value = '';
    filterDropdownOptions('', currentCategoryFilter);
    setTimeout(() => versionSearchInput.focus(), 60);
  }
}

function closeVersionDropdown() {
  if (!customVersionDropdown) return;
  customVersionDropdown.classList.remove('is-open');
  if (versionDropdownTrigger) versionDropdownTrigger.setAttribute('aria-expanded', 'false');
}

function toggleVersionDropdown() {
  if (!customVersionDropdown) return;
  if (customVersionDropdown.classList.contains('is-open')) {
    closeVersionDropdown();
  } else {
    openVersionDropdown();
  }
}

function filterDropdownOptions(query = '', categoryFilter = 'all') {
  const q = (query || '').trim().toLowerCase();
  const groups = versionOptionsList ? versionOptionsList.querySelectorAll('.category-group') : [];
  let totalVisible = 0;

  groups.forEach(grp => {
    const grpCat = grp.getAttribute('data-category');
    const catMatches = categoryFilter === 'all' || grpCat === categoryFilter;

    if (!catMatches) {
      grp.classList.add('is-hidden');
      return;
    }

    const items = grp.querySelectorAll('.version-option-item');
    let groupVisibleCount = 0;

    items.forEach(item => {
      const val = (item.getAttribute('data-value') || '').toLowerCase();
      const textMatches = !q || val.includes(q);
      if (textMatches) {
        item.style.display = 'flex';
        groupVisibleCount++;
      } else {
        item.style.display = 'none';
      }
    });

    if (groupVisibleCount > 0) {
      grp.classList.remove('is-hidden');
      totalVisible += groupVisibleCount;
    } else {
      grp.classList.add('is-hidden');
    }
  });

  const existingNoRes = versionOptionsList ? versionOptionsList.querySelector('.version-no-results') : null;
  if (totalVisible === 0) {
    if (!existingNoRes && versionOptionsList) {
      const noRes = document.createElement('div');
      noRes.className = 'version-no-results';
      noRes.textContent = 'No matching versions found';
      versionOptionsList.appendChild(noRes);
    }
  } else if (existingNoRes) {
    existingNoRes.remove();
  }
}

if (versionDropdownTrigger) {
  versionDropdownTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleVersionDropdown();
  });
}

document.addEventListener('click', (e) => {
  if (customVersionDropdown && !customVersionDropdown.contains(e.target)) {
    closeVersionDropdown();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && customVersionDropdown && customVersionDropdown.classList.contains('is-open')) {
    closeVersionDropdown();
  }
});

catFilterBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (btn === btnToggleSnapshots) return;
    catFilterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCategoryFilter = btn.getAttribute('data-filter') || 'all';
    filterDropdownOptions(versionSearchInput ? versionSearchInput.value : '', currentCategoryFilter);
  });
});

if (btnToggleSnapshots) {
  btnToggleSnapshots.addEventListener('click', (e) => {
    e.stopPropagation();
    showSnapshots = !showSnapshots;
    btnToggleSnapshots.classList.toggle('active', showSnapshots);
    
    if (cachedVersionsRaw) {
      processVersions(cachedVersionsRaw);
      filterDropdownOptions(versionSearchInput ? versionSearchInput.value : '', currentCategoryFilter);
    }
    appendLog(`Snapshots ${showSnapshots ? 'enabled (750+ builds added)' : 'hidden'}`, 'sys');
  });
}

if (versionSearchInput) {
  versionSearchInput.addEventListener('input', (e) => {
    filterDropdownOptions(e.target.value, currentCategoryFilter);
  });
  versionSearchInput.addEventListener('click', (e) => e.stopPropagation());
}

function processVersions(data) {
  localInstalledSet.clear();
  allVersionItems = [];

  const installed = data.installed || [];
  const mojang = data.mojang || [];
  const fabric = data.fabric || [];
  const forge = data.forge || [];
  const optifine = data.optifine || [];
  const snapshots = data.snapshots || [];
  const fabricSnapshots = data.fabricSnapshots || [];

  installed.forEach(v => localInstalledSet.add(v));

  // 1. Installed
  installed.forEach(v => {
    allVersionItems.push({
      name: v,
      category: getVersionCategory(v),
      installed: true
    });
  });

  // 2. Fabric
  fabric.forEach(v => {
    const exists = allVersionItems.some(i => i.category === 'fabric' && (i.name === v || i.name.toLowerCase() === v.toLowerCase()));
    if (!exists) {
      allVersionItems.push({ name: v, category: 'fabric', installed: false });
    }
  });

  // 3. Forge
  forge.forEach(v => {
    const exists = allVersionItems.some(i => i.category === 'forge' && (i.name === v || i.name.toLowerCase() === v.toLowerCase()));
    if (!exists) {
      allVersionItems.push({ name: v, category: 'forge', installed: false });
    }
  });

  // 4. OptiFine
  optifine.forEach(v => {
    const exists = allVersionItems.some(i => i.category === 'optifine' && (i.name === v || i.name.toLowerCase() === v.toLowerCase()));
    if (!exists) {
      allVersionItems.push({ name: v, category: 'optifine', installed: false });
    }
  });

  // 5. Vanilla Releases
  mojang.forEach(v => {
    const exists = allVersionItems.some(i => i.category === 'vanilla' && (i.name === v || i.name === `Minecraft ${v}`));
    if (!exists) {
      allVersionItems.push({ name: v, category: 'vanilla', installed: false });
    }
  });

  // 6. Snapshots (if enabled)
  if (showSnapshots) {
    snapshots.forEach(v => {
      const exists = allVersionItems.some(i => i.name === v);
      if (!exists) {
        allVersionItems.push({ name: v, category: 'snapshots', installed: false });
      }
    });

    fabricSnapshots.forEach(v => {
      const exists = allVersionItems.some(i => i.name === v);
      if (!exists) {
        allVersionItems.push({ name: v, category: 'fabric', installed: false });
      }
    });
  }

  let activeVer = appConfig.selectedVersion;
  if (!activeVer || !allVersionItems.some(i => i.name === activeVer)) {
    const fabricVer = allVersionItems.find(i => i.category === 'fabric' && i.installed);
    activeVer = fabricVer ? fabricVer.name : (allVersionItems[0] ? allVersionItems[0].name : 'Fabric 1.21.4');
  }

  renderVersionDropdown(allVersionItems, activeVer);
  selectVersion(activeVer, getVersionCategory(activeVer));
}

async function loadAllVersions() {
  try {
    const data = await window.electronAPI.getVersions(appConfig.gameDir);
    cachedVersionsRaw = data;
    processVersions(data);
  } catch (err) {
    console.error('Error loading versions:', err);
    appendLog(`Failed to load versions: ${err.message}`, 'err');
  }
}

// ==========================================================================
// MODS & ADDONS CENTER (PREMIUM MODRINTH STORE & LOCAL MANAGER)
// ==========================================================================
let currentModCategory = 'all';
let currentModSearchQuery = '';
let currentModOffset = 0;
const MODS_PAGE_SIZE = 36;
let isLoadingMoreMods = false;
let hasMoreMods = true;
let modSearchDebounceTimer = null;
let installedModsCache = [];
const loadedModSlugs = new Set();
let infiniteScrollScheduled = false;

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function switchModSubtab(targetSubtab) {
  if (btnSubtabModstore) {
    btnSubtabModstore.classList.toggle('active', targetSubtab === 'modstore');
  }
  if (btnSubtabInstalledmods) {
    btnSubtabInstalledmods.classList.toggle('active', targetSubtab === 'installedmods');
  }

  if (subpaneModstore) {
    subpaneModstore.classList.toggle('active', targetSubtab === 'modstore');
    subpaneModstore.style.display = targetSubtab === 'modstore' ? 'flex' : 'none';
  }
  if (subpaneInstalledmods) {
    subpaneInstalledmods.classList.toggle('active', targetSubtab === 'installedmods');
    subpaneInstalledmods.style.display = targetSubtab === 'installedmods' ? 'flex' : 'none';
  }

  if (targetSubtab === 'installedmods') {
    loadInstalledModsList();
  }
}

if (btnSubtabModstore) {
  btnSubtabModstore.addEventListener('click', () => switchModSubtab('modstore'));
}
if (btnSubtabInstalledmods) {
  btnSubtabInstalledmods.addEventListener('click', () => switchModSubtab('installedmods'));
}

function formatDownloadsCount(num) {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
  return String(num);
}

function isModInstalled(slug, title) {
  const cleanSlug = (slug || '').toLowerCase();
  const cleanTitle = (title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return installedModsCache.some(m => {
    const name = m.name.toLowerCase();
    return name.includes(cleanSlug) || (cleanTitle && name.includes(cleanTitle));
  });
}

function createModCardElement(mod) {
  const card = document.createElement('div');
  card.className = 'mod-card';

  const iconHtml = mod.iconUrl
    ? `<img src="${mod.iconUrl}" alt="${escapeHtml(mod.title)}" class="mod-card-icon" onerror="this.outerHTML='<div class=\\'mod-card-icon\\' style=\\'display:flex;align-items:center;justify-content:center;color:#ef4444;\\'><svg width=\\'22\\' height=\\'22\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'2\\'><path d=\\'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z\\'/></svg></div>'">`
    : `<div class="mod-card-icon" style="display:flex;align-items:center;justify-content:center;color:#ef4444;">
         <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
       </div>`;

  const tagsHtml = (mod.categories || []).slice(0, 2).map(cat => 
    `<span class="mod-tag-chip">${escapeHtml(cat)}</span>`
  ).join('');

  const dlHtml = `
    <span class="mod-tag-chip tag-downloads">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
      <span>${formatDownloadsCount(mod.downloads)}</span>
    </span>
  `;

  const alreadyInstalled = isModInstalled(mod.slug, mod.title);

  const installBtnHtml = alreadyInstalled
    ? `<button class="btn-card-install is-installed" disabled>
         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
         <span>INSTALLED</span>
       </button>`
    : `<button class="btn-card-install" data-slug="${escapeHtml(mod.slug)}">
         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
         <span>INSTALL</span>
       </button>`;

  card.innerHTML = `
    <div class="mod-card-top">
      ${iconHtml}
      <div class="mod-card-meta">
        <h4 class="mod-card-title" title="${escapeHtml(mod.title)}">${escapeHtml(mod.title)}</h4>
        <span class="mod-card-author">by ${escapeHtml(mod.author || 'Modder')}</span>
      </div>
    </div>
    <p class="mod-card-desc">${escapeHtml(mod.description || 'No description provided.')}</p>
    <div class="mod-card-footer">
      <div class="mod-card-tags">
        ${tagsHtml}
        ${dlHtml}
      </div>
      ${installBtnHtml}
    </div>
  `;

  const btnInstall = card.querySelector('.btn-card-install');
  if (btnInstall && !alreadyInstalled) {
    btnInstall.addEventListener('click', async (e) => {
      e.stopPropagation();
      await executeInstallMod(mod, btnInstall);
    });
  }

  card.style.cursor = 'pointer';
  card.addEventListener('click', (e) => {
    if (e.target.closest('.btn-card-install')) return;
    openModDetails(mod.slug);
  });

  return card;
}

async function searchAndRenderMods(query = '', category = 'all') {
  if (!modstoreCardsGrid) return;

  currentModSearchQuery = query;
  currentModCategory = category;
  currentModOffset = 0;
  hasMoreMods = true;
  isLoadingMoreMods = false;
  loadedModSlugs.clear();

  modstoreCardsGrid.innerHTML = `
    <div class="hub-loading-state">
      <div class="hub-spinner"></div>
      <span>Searching 150,000+ Minecraft mods on Modrinth...</span>
    </div>
  `;

  try {
    const selectedCat = getVersionCategory(appConfig.selectedVersion);
    const cleanLoader = selectedCat === 'fabric' ? 'fabric' : (selectedCat === 'forge' ? 'forge' : '');

    const params = {
      query: query.trim(),
      category: category === 'all' ? '' : category,
      loader: cleanLoader,
      limit: MODS_PAGE_SIZE,
      offset: 0,
      projectType: currentProjectType
    };

    const res = await window.electronAPI.searchMods(params);

    if (modstorePillTotal) {
      const totalNum = res.total ? res.total.toLocaleString() : (res.hits ? res.hits.length : 0);
      modstorePillTotal.textContent = `${totalNum} Available`;
    }

    if (!res.hits || res.hits.length === 0) {
      const typeLabel = currentProjectType === 'shader' ? 'shaders' : (currentProjectType === 'resourcepack' ? 'resource packs' : 'mods');
      modstoreCardsGrid.innerHTML = `
        <div class="hub-loading-state">
          <span>No ${typeLabel} found matching your query. Try another keyword.</span>
        </div>
      `;
      hasMoreMods = false;
      return;
    }

    modstoreCardsGrid.innerHTML = '';

    res.hits.forEach(mod => {
      if (mod.slug && loadedModSlugs.has(mod.slug)) return;
      if (mod.slug) loadedModSlugs.add(mod.slug);
      const card = createModCardElement(mod);
      modstoreCardsGrid.appendChild(card);
    });

    currentModOffset = res.hits.length;

    if (res.hits.length < MODS_PAGE_SIZE || (res.total && currentModOffset >= res.total)) {
      hasMoreMods = false;
    }

    setTimeout(() => {
      if (hasMoreMods && !isLoadingMoreMods && modstoreCardsGrid.scrollHeight <= modstoreCardsGrid.clientHeight + 60) {
        loadMoreMods();
      }
    }, 250);

  } catch (err) {
    console.error('Error searching mods:', err);
    modstoreCardsGrid.innerHTML = `<div class="hub-loading-state"><span>Failed to connect to Modrinth API: ${escapeHtml(err.message)}</span></div>`;
  }
}

async function loadMoreMods() {
  if (isLoadingMoreMods || !hasMoreMods) return;
  if (!modstoreCardsGrid) return;

  isLoadingMoreMods = true;

  const oldLoader = document.getElementById('modstore-infinite-loader');
  if (oldLoader) oldLoader.remove();
  const oldRetry = document.getElementById('modstore-retry-box');
  if (oldRetry) oldRetry.remove();

  const loaderEl = document.createElement('div');
  loaderEl.className = 'modstore-infinite-loader';
  loaderEl.id = 'modstore-infinite-loader';
  loaderEl.innerHTML = `
    <div class="hub-spinner" style="width: 20px; height: 20px; border-width: 2.2px;"></div>
    <span>Loading more...</span>
  `;
  modstoreCardsGrid.appendChild(loaderEl);

  try {
    const selectedCat = getVersionCategory(appConfig.selectedVersion);
    const cleanLoader = selectedCat === 'fabric' ? 'fabric' : (selectedCat === 'forge' ? 'forge' : '');

    const params = {
      query: currentModSearchQuery.trim(),
      category: currentModCategory === 'all' ? '' : currentModCategory,
      loader: cleanLoader,
      limit: MODS_PAGE_SIZE,
      offset: currentModOffset,
      projectType: currentProjectType
    };

    const res = await window.electronAPI.searchMods(params);

    const activeLoader = document.getElementById('modstore-infinite-loader');
    if (activeLoader) activeLoader.remove();

    if (!res.hits || res.hits.length === 0) {
      hasMoreMods = false;
      showEndBanner();
      isLoadingMoreMods = false;
      return;
    }

    res.hits.forEach(mod => {
      if (mod.slug && loadedModSlugs.has(mod.slug)) return;
      if (mod.slug) loadedModSlugs.add(mod.slug);
      const card = createModCardElement(mod);
      modstoreCardsGrid.appendChild(card);
    });

    currentModOffset += res.hits.length;

    if (res.hits.length < MODS_PAGE_SIZE || (res.total && currentModOffset >= res.total)) {
      hasMoreMods = false;
      showEndBanner();
    } else {
      setTimeout(() => {
        if (hasMoreMods && !isLoadingMoreMods && modstoreCardsGrid.scrollHeight <= modstoreCardsGrid.clientHeight + 60) {
          loadMoreMods();
        }
      }, 250);
    }

  } catch (err) {
    console.error('Error loading more mods:', err);
    const activeLoader = document.getElementById('modstore-infinite-loader');
    if (activeLoader) activeLoader.remove();

    const retryEl = document.createElement('div');
    retryEl.className = 'modstore-retry-box';
    retryEl.id = 'modstore-retry-box';
    retryEl.innerHTML = `
      <span>Failed to load next page: ${escapeHtml(err.message)}</span>
      <button type="button" class="btn-mods-action" id="btn-retry-infinite">Retry</button>
    `;
    modstoreCardsGrid.appendChild(retryEl);
    const btnRetry = document.getElementById('btn-retry-infinite');
    if (btnRetry) {
      btnRetry.addEventListener('click', () => {
        retryEl.remove();
        loadMoreMods();
      });
    }
  } finally {
    isLoadingMoreMods = false;
  }
}

function showEndBanner() {
  if (document.getElementById('modstore-end-pill')) return;
  const endPill = document.createElement('div');
  endPill.className = 'modstore-end-pill';
  endPill.id = 'modstore-end-pill';
  endPill.innerHTML = `<span>End of Catalog • ${currentModOffset} items loaded</span>`;
  modstoreCardsGrid.appendChild(endPill);
}

async function executeInstallMod(mod, buttonEl) {
  buttonEl.disabled = true;
  buttonEl.innerHTML = `
    <div class="hub-spinner" style="width:12px;height:12px;border-width:2px;"></div>
    <span>INSTALLING...</span>
  `;
  buttonEl.classList.add('is-loading');

  try {
    const selectedCat = getVersionCategory(appConfig.selectedVersion);
    const cleanLoader = selectedCat === 'fabric' ? 'fabric' : (selectedCat === 'forge' ? 'forge' : '');

    const res = await window.electronAPI.installMod({
      slugOrId: mod.slug,
      gameVersion: appConfig.selectedVersion,
      loader: cleanLoader,
      gameDir: appConfig.gameDir,
      projectType: currentProjectType
    });

    if (res.success) {
      buttonEl.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span>INSTALLED</span>
      `;
      buttonEl.classList.remove('is-loading');
      buttonEl.classList.add('is-installed');
      appendLog(`Installed: ${res.filename} (${res.size})`, 'ok');
      await loadInstalledModsList();
    } else {
      buttonEl.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        <span>RETRY</span>
      `;
      buttonEl.disabled = false;
      buttonEl.classList.remove('is-loading');
      appendLog(`Failed to install ${mod.title}: ${res.error}`, 'err');
    }
  } catch (err) {
    buttonEl.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
      <span>RETRY</span>
    `;
    buttonEl.disabled = false;
    buttonEl.classList.remove('is-loading');
    appendLog(`Installation error: ${err.message}`, 'err');
  }
}

async function loadInstalledModsList() {
  try {
    const assets = await window.electronAPI.listAssets(appConfig.gameDir, currentProjectType);
    installedModsCache = assets || [];

    if (sidebarModsCount && currentProjectType === 'mod') sidebarModsCount.textContent = installedModsCache.length;
    if (installedModsCounter) installedModsCounter.textContent = installedModsCache.length;
    if (tileModsStatus && currentProjectType === 'mod') tileModsStatus.textContent = `${installedModsCache.length} MODS`;

    if (!modsItemsList) return;
    modsItemsList.innerHTML = '';

    if (installedModsCache.length === 0) {
      const typeLabel = currentProjectType === 'shader' ? 'shaders' : (currentProjectType === 'resourcepack' ? 'resource packs' : 'mods');
      modsItemsList.innerHTML = `<div class="mods-empty-placeholder">No ${typeLabel} installed yet. Download from the store.</div>`;
      return;
    }

    installedModsCache.forEach(m => {
      const item = document.createElement('div');
      item.className = 'mod-item-row';
      item.innerHTML = `
        <div class="mod-left">
          <span class="mod-icon-svg">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
          </span>
          <span class="mod-file-name">${m.name}</span>
        </div>
        <span class="mod-file-size">${m.size}</span>
        <button class="btn-delete-item" title="Delete file">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      `;

      const delBtn = item.querySelector('.btn-delete-item');
      if (delBtn) {
        delBtn.addEventListener('click', async () => {
          delBtn.disabled = true;
          const res = await window.electronAPI.deleteAsset(appConfig.gameDir, currentProjectType, m.name);
          if (res.success) {
            appendLog(`Deleted: ${m.name}`, 'sys');
            await loadInstalledModsList();
          } else {
            appendLog(`Could not delete: ${res.error}`, 'err');
          }
        });
      }

      modsItemsList.appendChild(item);
    });

  } catch (err) {
    console.error('Error loading installed assets:', err);
  }
}

function initModCenter() {
  loadInstalledModsList().then(() => {
    searchAndRenderMods(modstoreSearchInput ? modstoreSearchInput.value : '', currentModCategory);
  });
}

if (modstoreSearchInput) {
  modstoreSearchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    if (btnClearModSearch) btnClearModSearch.style.display = val ? 'block' : 'none';
    clearTimeout(modSearchDebounceTimer);
    modSearchDebounceTimer = setTimeout(() => {
      searchAndRenderMods(val, currentModCategory);
    }, 350);
  });
}

if (btnClearModSearch) {
  btnClearModSearch.addEventListener('click', () => {
    if (modstoreSearchInput) {
      modstoreSearchInput.value = '';
      btnClearModSearch.style.display = 'none';
      searchAndRenderMods('', currentModCategory);
    }
  });
}

modCategoryChips.forEach(chip => {
  chip.addEventListener('click', () => {
    modCategoryChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentModCategory = chip.getAttribute('data-modcat') || 'all';
    searchAndRenderMods(modstoreSearchInput ? modstoreSearchInput.value : '', currentModCategory);
  });
});

if (btnRefreshMods) {
  btnRefreshMods.addEventListener('click', () => {
    loadInstalledModsList();
    searchAndRenderMods(modstoreSearchInput ? modstoreSearchInput.value : '', currentModCategory);
    appendLog('Mod Center refreshed', 'sys');
  });
}

if (btnOpenModsTab) {
  btnOpenModsTab.addEventListener('click', () => {
    const p = `${appConfig.gameDir}\\mods`;
    window.electronAPI.openPath(p);
  });
}

// Infinite Scrolling Scroll Listeners
function handleInfiniteScroll() {
  if (infiniteScrollScheduled) return;
  infiniteScrollScheduled = true;
  requestAnimationFrame(() => {
    infiniteScrollScheduled = false;
    if (isLoadingMoreMods || !hasMoreMods) return;
    if (modDetailsModal && modDetailsModal.style.display !== 'none') return;
    const tabMods = document.getElementById('tab-mods');
    if (!tabMods || !tabMods.classList.contains('active')) return;
    if (subpaneModstore && subpaneModstore.style.display === 'none') return;

    if (modstoreCardsGrid) {
      const { scrollTop, scrollHeight, clientHeight } = modstoreCardsGrid;
      if (scrollHeight - scrollTop - clientHeight < 450) {
        loadMoreMods();
        return;
      }
    }

    const orbitStage = document.querySelector('.orbit-stage');
    if (orbitStage) {
      const { scrollTop, scrollHeight, clientHeight } = orbitStage;
      if (scrollHeight - scrollTop - clientHeight < 450) {
        loadMoreMods();
      }
    }
  });
}

if (modstoreCardsGrid) {
  modstoreCardsGrid.addEventListener('scroll', handleInfiniteScroll, { passive: true });
}

const orbitStage = document.querySelector('.orbit-stage');
if (orbitStage) {
  orbitStage.addEventListener('scroll', handleInfiniteScroll, { passive: true });
}

const tileModsBox = document.getElementById('tile-mods-status')?.closest('.feature-tile');
if (tileModsBox) {
  tileModsBox.style.cursor = 'pointer';
  tileModsBox.addEventListener('click', () => switchTab('tab-mods'));
}

// ==========================================================================
// MOD DETAILS MODAL (GALLERY, MARKDOWN & VERSIONS)
// ==========================================================================
let currentModDetails = null;
let currentGalleryIndex = 0;
let currentVLoaderFilter = 'all';
let currentVGameFilter = 'all';
let currentVSearchText = '';

function renderMarkdownToHtml(md) {
  if (!md) return '';
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Fenced code blocks
  html = html.replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/gi, (_match, _lang, code) => {
    return '<pre><code>' + code.trim() + '</code></pre>';
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" onerror="this.style.display=\'none\'">');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  // Bold & Italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Blockquotes
  html = html.replace(/^&gt; (.*$)/gim, '<blockquote>$1</blockquote>');

  // Lists
  html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>');

  // Line breaks & paragraphs
  html = html.replace(/\n\n+/g, '</p><p>');
  html = '<p>' + html + '</p>';
  html = html.replace(/<p>\s*<\/p>/g, '');
  return html;
}

function switchDetailsSubtab(tabName) {
  if (btnDetailsTabOverview) {
    btnDetailsTabOverview.classList.toggle('active', tabName === 'overview');
  }
  if (btnDetailsTabVersions) {
    btnDetailsTabVersions.classList.toggle('active', tabName === 'versions');
  }

  if (detailsContentOverview) {
    detailsContentOverview.style.display = tabName === 'overview' ? 'block' : 'none';
  }
  if (detailsContentVersions) {
    detailsContentVersions.style.display = tabName === 'versions' ? 'block' : 'none';
  }

  if (tabName === 'versions') {
    renderVersionsTable();
  }
}

async function openModDetails(slugOrId) {
  if (!modDetailsModal) return;

  modDetailsModal.style.display = 'flex';
  if (detailsLoaderState) {
    detailsLoaderState.style.display = 'flex';
    detailsLoaderState.innerHTML = `
      <div class="hub-spinner"></div>
      <span>Loading mod details from Modrinth...</span>
    `;
  }
  if (detailsMainBody) detailsMainBody.style.display = 'none';
  switchDetailsSubtab('overview');

  try {
    const res = await window.electronAPI.getModDetails(slugOrId);
    if (!res.success || !res.project) {
      if (detailsLoaderState) {
        detailsLoaderState.innerHTML = `
          <span>Failed to load mod details: ${escapeHtml(res.error || 'Unknown error')}</span>
          <button type="button" class="btn-mods-action" id="btn-retry-details">Retry</button>
        `;
        const btnR = document.getElementById('btn-retry-details');
        if (btnR) btnR.addEventListener('click', () => openModDetails(slugOrId));
      }
      return;
    }

    currentModDetails = res;
    currentGalleryIndex = 0;
    currentVLoaderFilter = 'all';
    currentVGameFilter = 'all';
    currentVSearchText = '';

    const p = res.project;
    const versions = res.versions || [];

    if (detailsModTitle) detailsModTitle.textContent = p.title;
    if (detailsModSummary) detailsModSummary.textContent = p.description || 'No description provided.';
    if (detailsDownloadsCount) detailsDownloadsCount.textContent = formatDownloadsCount(p.downloads);
    if (detailsFollowersCount) detailsFollowersCount.textContent = formatDownloadsCount(p.followers);

    if (detailsModIcon) {
      if (p.iconUrl) {
        detailsModIcon.src = p.iconUrl;
        detailsModIcon.style.display = 'block';
      } else {
        detailsModIcon.style.display = 'none';
      }
    }

    if (detailsClientServerTag) {
      if (p.clientSide === 'required' && p.serverSide === 'required') {
        detailsClientServerTag.textContent = 'CLIENT & SERVER';
      } else if (p.clientSide === 'required') {
        detailsClientServerTag.textContent = 'CLIENT ONLY';
      } else if (p.serverSide === 'required') {
        detailsClientServerTag.textContent = 'SERVER ONLY';
      } else {
        detailsClientServerTag.textContent = 'CLIENT SUPPORTED';
      }
    }

    if (detailsCategoriesList) {
      detailsCategoriesList.innerHTML = (p.categories || []).map(cat => 
        `<span class="mod-tag-chip">${escapeHtml(cat)}</span>`
      ).join('');
    }

    updateQuickInstallButton();
    renderGallery(p.gallery || []);

    if (modMarkdownBody) {
      modMarkdownBody.innerHTML = renderMarkdownToHtml(p.body || p.description || 'No detailed documentation provided.');
    }

    populateGameVersionFilter(versions);

    if (detailsVersionsTotalBadge) {
      detailsVersionsTotalBadge.textContent = versions.length;
    }

    if (detailsFilterGameVersion) detailsFilterGameVersion.value = 'all';
    detailsLoaderPills.forEach(pill => {
      pill.classList.toggle('active', pill.getAttribute('data-vloader') === 'all');
    });
    if (detailsVersionSearch) detailsVersionSearch.value = '';

    renderVersionsTable();

    if (detailsLoaderState) detailsLoaderState.style.display = 'none';
    if (detailsMainBody) detailsMainBody.style.display = 'flex';

  } catch (err) {
    console.error('Error opening mod details:', err);
    if (detailsLoaderState) {
      detailsLoaderState.innerHTML = `
        <span>Error loading details: ${escapeHtml(err.message)}</span>
        <button type="button" class="btn-mods-action" id="btn-retry-details">Retry</button>
      `;
      const btnR = document.getElementById('btn-retry-details');
      if (btnR) btnR.addEventListener('click', () => openModDetails(slugOrId));
    }
  }
}

function updateQuickInstallButton() {
  if (!btnDetailsQuickInstall || !currentModDetails) return;
  const p = currentModDetails.project;

  const selectedCat = getVersionCategory(appConfig.selectedVersion);
  const cleanLoader = selectedCat === 'fabric' ? 'fabric' : (selectedCat === 'forge' ? 'forge' : '');
  const cleanGameVer = (appConfig.selectedVersion || '').replace(/Fabric|OptiFine|Forge|Minecraft/gi, '').trim();

  if (detailsQuickTargetLabel) {
    detailsQuickTargetLabel.textContent = `Target: ${cleanLoader ? cleanLoader.toUpperCase() + ' ' : ''}${cleanGameVer || 'Latest'}`;
  }

  const alreadyInstalled = isModInstalled(p.slug, p.title);
  if (alreadyInstalled) {
    btnDetailsQuickInstall.classList.add('is-installed');
    btnDetailsQuickInstall.disabled = true;
    if (detailsQuickInstallText) detailsQuickInstallText.textContent = 'ALREADY INSTALLED';
    return;
  }

  btnDetailsQuickInstall.classList.remove('is-installed');
  btnDetailsQuickInstall.disabled = false;
  if (detailsQuickInstallText) {
    detailsQuickInstallText.textContent = `INSTALL FOR ${cleanLoader ? cleanLoader.toUpperCase() + ' ' : ''}${cleanGameVer || 'ACTIVE'}`;
  }

  btnDetailsQuickInstall.onclick = async () => {
    btnDetailsQuickInstall.disabled = true;
    btnDetailsQuickInstall.classList.add('is-loading');
    if (detailsQuickInstallText) detailsQuickInstallText.textContent = 'INSTALLING...';

    const res = await window.electronAPI.installMod({
      slugOrId: p.slug,
      gameVersion: appConfig.selectedVersion,
      loader: cleanLoader,
      gameDir: appConfig.gameDir
    });

    btnDetailsQuickInstall.classList.remove('is-loading');
    if (res.success) {
      btnDetailsQuickInstall.classList.add('is-installed');
      if (detailsQuickInstallText) detailsQuickInstallText.textContent = 'INSTALLED';
      appendLog(`Installed ${p.title} (${res.filename})`, 'ok');
      await loadInstalledModsList();
      renderVersionsTable();
    } else {
      btnDetailsQuickInstall.disabled = false;
      if (detailsQuickInstallText) detailsQuickInstallText.textContent = 'RETRY INSTALL';
      appendLog(`Failed to install ${p.title}: ${res.error}`, 'err');
    }
  };
}

function renderGallery(gallery) {
  if (!detailsGallerySection) return;
  if (!gallery || gallery.length === 0) {
    detailsGallerySection.style.display = 'none';
    return;
  }

  detailsGallerySection.style.display = 'flex';
  currentGalleryIndex = 0;

  function updateMainImage(idx) {
    currentGalleryIndex = idx;
    const item = gallery[idx];
    if (!item) return;

    if (galleryCounterTag) {
      galleryCounterTag.textContent = `${idx + 1} / ${gallery.length}`;
    }
    if (galleryMainImg) {
      galleryMainImg.src = item.url || item.rawUrl;
      galleryMainImg.alt = item.title || 'Screenshot';
    }
    if (galleryCaptionTitle) {
      galleryCaptionTitle.textContent = item.title || `Screenshot #${idx + 1}`;
    }
    if (galleryCaptionSub) {
      galleryCaptionSub.textContent = item.description || '';
      galleryCaptionSub.style.display = item.description ? 'block' : 'none';
    }

    if (galleryThumbnailsStrip) {
      const thumbs = galleryThumbnailsStrip.querySelectorAll('.gallery-thumb-item');
      thumbs.forEach((t, i) => t.classList.toggle('active', i === idx));
    }
  }

  if (galleryThumbnailsStrip) {
    galleryThumbnailsStrip.innerHTML = '';
    gallery.forEach((item, idx) => {
      const thumb = document.createElement('div');
      thumb.className = `gallery-thumb-item ${idx === 0 ? 'active' : ''}`;
      thumb.innerHTML = `<img src="${escapeHtml(item.url || item.rawUrl)}" alt="${escapeHtml(item.title || '')}">`;
      thumb.addEventListener('click', () => updateMainImage(idx));
      galleryThumbnailsStrip.appendChild(thumb);
    });
  }

  updateMainImage(0);
}

function populateGameVersionFilter(versions) {
  if (!detailsFilterGameVersion) return;

  const versionSet = new Set();
  versions.forEach(v => {
    (v.gameVersions || []).forEach(gv => versionSet.add(gv));
  });

  const sorted = Array.from(versionSet).sort((a, b) => {
    const partsA = a.split('.').map(n => parseInt(n, 10) || 0);
    const partsB = b.split('.').map(n => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const numA = partsA[i] || 0;
      const numB = partsB[i] || 0;
      if (numA !== numB) return numB - numA;
    }
    return b.localeCompare(a);
  });

  detailsFilterGameVersion.innerHTML = '<option value="all">All Minecraft Versions</option>';
  sorted.forEach(ver => {
    const opt = document.createElement('option');
    opt.value = ver;
    opt.textContent = `Minecraft ${ver}`;
    detailsFilterGameVersion.appendChild(opt);
  });
}

function renderVersionsTable() {
  if (!detailsVersionsRows || !currentModDetails) return;
  const versions = currentModDetails.versions || [];
  const p = currentModDetails.project;

  const filtered = versions.filter(v => {
    if (currentVLoaderFilter !== 'all') {
      const matchLoader = (v.loaders || []).some(l => l.toLowerCase() === currentVLoaderFilter.toLowerCase());
      if (!matchLoader) return false;
    }

    if (currentVGameFilter !== 'all') {
      const matchVer = (v.gameVersions || []).includes(currentVGameFilter);
      if (!matchVer) return false;
    }

    if (currentVSearchText) {
      const q = currentVSearchText.toLowerCase();
      const matchName = (v.name || '').toLowerCase().includes(q);
      const matchNum = (v.versionNumber || '').toLowerCase().includes(q);
      const matchFiles = (v.files || []).some(f => (f.filename || '').toLowerCase().includes(q));
      if (!matchName && !matchNum && !matchFiles) return false;
    }

    return true;
  });

  detailsVersionsRows.innerHTML = '';

  if (filtered.length === 0) {
    detailsVersionsRows.innerHTML = `
      <div style="padding: 32px 16px; text-align: center; color: var(--text-muted); font-size: 12.5px;">
        No compatible release versions found matching the selected filters.
      </div>
    `;
    return;
  }

  filtered.forEach(v => {
    const primaryFile = (v.files || []).find(f => f.primary) || (v.files && v.files[0]);
    if (!primaryFile) return;

    const row = document.createElement('div');
    row.className = 'version-row-item';

    const gameVerBadges = (v.gameVersions || []).slice(0, 3).map(gv => 
      `<span class="mod-tag-chip" style="font-size: 10px;">${escapeHtml(gv)}</span>`
    ).join('') + ((v.gameVersions || []).length > 3 ? `<span class="mod-tag-chip" style="font-size: 10px;">+${v.gameVersions.length - 3}</span>` : '');

    const loaderBadges = (v.loaders || []).map(l => 
      `<span class="mod-tag-chip" style="font-size: 10px; text-transform: uppercase; color: var(--red-400);">${escapeHtml(l)}</span>`
    ).join('');

    const formattedDate = v.datePublished ? new Date(v.datePublished).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';

    const isInstalled = isModInstalled(primaryFile.filename.replace('.jar', ''), p.title);

    const btnActionHtml = isInstalled
      ? `<button type="button" class="btn-vrow-install is-installed" disabled>
           <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
           <span>INSTALLED</span>
         </button>`
      : `<button type="button" class="btn-vrow-install" data-url="${escapeHtml(primaryFile.url)}" data-filename="${escapeHtml(primaryFile.filename)}">
           <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
           <span>INSTALL</span>
         </button>`;

    row.innerHTML = `
      <div class="vrow-release-info">
        <span class="vrow-name" title="${escapeHtml(v.name || v.versionNumber)}">${escapeHtml(v.name || v.versionNumber)}</span>
        <span class="vrow-filename" title="${escapeHtml(primaryFile.filename)}">${escapeHtml(primaryFile.filename)} (${Math.round(primaryFile.size / 1024)} KB)</span>
      </div>
      <div class="vrow-gamever">
        ${gameVerBadges}
      </div>
      <div class="vrow-loaders">
        ${loaderBadges}
      </div>
      <div class="vrow-meta">
        <span>${formattedDate}</span>
        <span style="color: var(--text-muted); font-size: 10px;">${formatDownloadsCount(v.downloads)} dl</span>
      </div>
      <div style="text-align: right;">
        ${btnActionHtml}
      </div>
    `;

    const btnInst = row.querySelector('.btn-vrow-install');
    if (btnInst && !isInstalled) {
      btnInst.addEventListener('click', async () => {
        btnInst.disabled = true;
        btnInst.innerHTML = `<div class="hub-spinner" style="width:10px;height:10px;border-width:1.8px;"></div><span>DOWNLOADING...</span>`;

        const res = await window.electronAPI.installModFile({
          fileUrl: primaryFile.url,
          filename: primaryFile.filename,
          gameDir: appConfig.gameDir
        });

        if (res.success) {
          btnInst.className = 'btn-vrow-install is-installed';
          btnInst.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg><span>INSTALLED</span>`;
          appendLog(`Installed file: ${primaryFile.filename}`, 'ok');
          await loadInstalledModsList();
          updateQuickInstallButton();
        } else {
          btnInst.disabled = false;
          btnInst.innerHTML = `<span>RETRY</span>`;
          appendLog(`Error installing ${primaryFile.filename}: ${res.error}`, 'err');
        }
      });
    }

    detailsVersionsRows.appendChild(row);
  });
}

function closeModDetails() {
  if (modDetailsModal) {
    modDetailsModal.style.display = 'none';
  }
  currentModDetails = null;
}

// Bind modal events
if (btnDetailsBack) btnDetailsBack.addEventListener('click', closeModDetails);
if (btnDetailsClose) btnDetailsClose.addEventListener('click', closeModDetails);
if (btnDetailsTabOverview) btnDetailsTabOverview.addEventListener('click', () => switchDetailsSubtab('overview'));
if (btnDetailsTabVersions) btnDetailsTabVersions.addEventListener('click', () => switchDetailsSubtab('versions'));

if (detailsFilterGameVersion) {
  detailsFilterGameVersion.addEventListener('change', (e) => {
    currentVGameFilter = e.target.value;
    renderVersionsTable();
  });
}

detailsLoaderPills.forEach(pill => {
  pill.addEventListener('click', () => {
    detailsLoaderPills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    currentVLoaderFilter = pill.getAttribute('data-vloader') || 'all';
    renderVersionsTable();
  });
});

if (detailsVersionSearch) {
  detailsVersionSearch.addEventListener('input', (e) => {
    currentVSearchText = e.target.value.trim();
    renderVersionsTable();
  });
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modDetailsModal && modDetailsModal.style.display !== 'none') {
    closeModDetails();
  }
});


// ==========================================================================
// CONFIG PERSISTENCE
// ==========================================================================
async function initConfig() {
  try {
    const loaded = await window.electronAPI.loadConfig();
    appConfig = { ...appConfig, ...loaded };

    const loadedName = appConfig.username || 'Player';
    if (usernameInput) usernameInput.value = loadedName;
    if (profileUsernameInput) profileUsernameInput.value = loadedName;
    if (heroProfileName) heroProfileName.textContent = loadedName;

    try {
      const savedSkin = await window.electronAPI.getSkin(loadedName);
      if (savedSkin && savedSkin.success && savedSkin.dataUrl) {
        customSkinDataUrl = savedSkin.dataUrl;
        currentArmModel = savedSkin.model || 'default';
        modelToggleBtns.forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-model') === currentArmModel);
        });
        loadSkinIntoViewer(customSkinDataUrl, currentArmModel);
        generateAvatarFromCustomSkin(customSkinDataUrl);
        if (skinSourceText) skinSourceText.textContent = 'Source: Custom Skin (Saved)';
        if (skinSourceDot) skinSourceDot.style.background = '#22c55e';
      } else {
        update3DSkin(loadedName);
      }
    } catch (e) {
      update3DSkin(loadedName);
    }

    setRam(appConfig.ramGb || 4);

    if (inputGameDir) inputGameDir.value = appConfig.gameDir || '';
    if (inputJavaPath) inputJavaPath.value = appConfig.javaPath || '';
    if (toggleAutoClose) toggleAutoClose.checked = !!appConfig.autoCloseOnLaunch;

    await loadAllVersions();
    await loadInstalledModsList();
    updateAccountTopbar();
    await loadActiveUserCape(loadedName);
    await checkFpsBoosterStatus();
    appendLog('Client initialized and ready to launch', 'sys');
  } catch (err) {
    console.error('Config init error:', err);
  }
}

async function saveCurrentConfig() {
  const activeName = (usernameInput && usernameInput.value.trim()) ||
                     (profileUsernameInput && profileUsernameInput.value.trim()) ||
                     appConfig.username || 'Player';
  appConfig.username = activeName;
  if (versionSelect) appConfig.selectedVersion = versionSelect.value;
  if (ramSlider) appConfig.ramGb = parseInt(ramSlider.value, 10) || 4;
  if (inputGameDir) appConfig.gameDir = inputGameDir.value.trim();
  if (inputJavaPath) appConfig.javaPath = inputJavaPath.value.trim();
  if (toggleAutoClose) appConfig.autoCloseOnLaunch = toggleAutoClose.checked;

  await window.electronAPI.saveConfig(appConfig);
}

if (btnSaveSettings) {
  btnSaveSettings.addEventListener('click', async () => {
    await saveCurrentConfig();
    updateStatus('Settings saved successfully!', 'success');
  });
}

// ==========================================================================
// FOLDER SHORTCUTS & ACTIONS
// ==========================================================================
if (btnOpenMods) {
  btnOpenMods.addEventListener('click', () => {
    const p = `${appConfig.gameDir}\\mods`;
    window.electronAPI.openPath(p);
    appendLog(`Opened mods folder: ${p}`, 'sys');
  });
}

if (btnOpenGame) {
  btnOpenGame.addEventListener('click', () => {
    window.electronAPI.openPath(appConfig.gameDir);
    appendLog(`Opened game directory: ${appConfig.gameDir}`, 'sys');
  });
}

if (btnBrowseGameDir) {
  btnBrowseGameDir.addEventListener('click', () => {
    window.electronAPI.openPath(inputGameDir.value.trim());
  });
}

if (btnBrowseJavaPath) {
  btnBrowseJavaPath.addEventListener('click', () => {
    appendLog(`Current Java path: ${inputJavaPath.value}`, 'sys');
  });
}

// ==========================================================================
// GAME LAUNCH
// ==========================================================================
async function startLaunch(quickJoinServer = null) {
  if (isLaunching) return;

  await saveCurrentConfig();

  isLaunching = true;
  btnLaunch.disabled = true;
  if (btnLaunchText) btnLaunchText.textContent = 'LAUNCHING...';
  if (progressBarFill) progressBarFill.style.width = '20%';

  if (collapsibleConsole) collapsibleConsole.style.display = 'block';
  if (btnToggleConsole) {
    const textSpan = btnToggleConsole.querySelector('span');
    if (textSpan) textSpan.textContent = 'HIDE LOGS';
  }

  const joinInfo = quickJoinServer ? ` [Quick Join: ${quickJoinServer.host}:${quickJoinServer.port || 25565}]` : '';
  updateStatus(`Initializing ${appConfig.selectedVersion}${joinInfo}...`, 'info');

  try {
    const launchData = {
      username: appConfig.username,
      selectedVersion: appConfig.selectedVersion,
      ramGb: appConfig.ramGb,
      gameDir: appConfig.gameDir,
      javaPath: appConfig.javaPath,
      customSkinDataUrl: customSkinDataUrl,
      currentArmModel: currentArmModel,
      quickJoinServer: quickJoinServer
    };

    const res = await window.electronAPI.launchGame(launchData);

    if (res.success) {
      updateStatus(`Minecraft launched successfully! (PID: ${res.pid})`, 'success');
      if (progressBarFill) progressBarFill.style.width = '100%';

      if (appConfig.autoCloseOnLaunch) {
        setTimeout(() => window.electronAPI.close(), 1500);
      }
    } else {
      updateStatus(`Launch error: ${res.error}`, 'error');
      btnLaunch.disabled = false;
      updateButtonState(appConfig.selectedVersion);
      if (progressBarFill) progressBarFill.style.width = '0%';
      isLaunching = false;
    }
  } catch (err) {
    updateStatus(`Launch failed: ${err.message}`, 'error');
    btnLaunch.disabled = false;
    updateButtonState(appConfig.selectedVersion);
    if (progressBarFill) progressBarFill.style.width = '0%';
    isLaunching = false;
  }
}

if (btnLaunch) {
  btnLaunch.addEventListener('click', () => startLaunch(null));
}

window.electronAPI.onGameStatus(({ text, type }) => {
  updateStatus(text, type);
});

window.electronAPI.onGameProgress((progress) => {
  if (progress && progress.total && progressBarFill) {
    const pct = Math.min(100, Math.round((progress.task / progress.total) * 100));
    progressBarFill.style.width = `${pct}%`;
    if (consoleStatusText && progress.type) {
      consoleStatusText.textContent = `Downloading: ${progress.type} (${pct}%)`;
    }
  }
});

window.electronAPI.onGameClosed((code) => {
  updateStatus(`Minecraft exited (code: ${code})`, 'info');
  if (btnLaunch) {
    btnLaunch.disabled = false;
    updateButtonState(appConfig.selectedVersion);
  }
  if (progressBarFill) progressBarFill.style.width = '0%';
  isLaunching = false;
});

// ==========================================================================
// ACCOUNT SWITCHER CONTROLLER
// ==========================================================================
function getAccountList() {
  if (!Array.isArray(appConfig.accounts) || appConfig.accounts.length === 0) {
    appConfig.accounts = [appConfig.username || 'Player'];
  }
  if (!appConfig.accounts.includes(appConfig.username)) {
    appConfig.accounts.unshift(appConfig.username);
  }
  return appConfig.accounts;
}

function updateAccountTopbar() {
  const name = appConfig.username || 'Player';
  if (topbarUsername) topbarUsername.textContent = name;
  if (topbarAvatar) {
    if (customSkinDataUrl) {
      topbarAvatar.src = playerAvatar ? playerAvatar.src : `https://mc-heads.net/avatar/${encodeURIComponent(name)}/24`;
    } else {
      topbarAvatar.src = `https://mc-heads.net/avatar/${encodeURIComponent(name)}/24`;
    }
  }
}

function renderAccountDropdown() {
  if (!accountMenuList) return;
  const accounts = getAccountList();
  accountMenuList.innerHTML = '';

  accounts.forEach(accName => {
    const isCurrent = accName.toLowerCase() === (appConfig.username || '').toLowerCase();
    const item = document.createElement('div');
    item.className = `account-item ${isCurrent ? 'active' : ''}`;
    item.innerHTML = `
      <div class="account-item-left">
        <img class="account-item-avatar" src="https://mc-heads.net/avatar/${encodeURIComponent(accName)}/24" alt="${accName}">
        <span class="account-item-name">${accName}</span>
        ${isCurrent ? '<span class="account-active-badge">ACTIVE</span>' : ''}
      </div>
      <div class="account-item-right">
        ${!isCurrent ? `
          <button type="button" class="btn-account-delete" title="Remove profile">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        ` : ''}
      </div>
    `;

    item.addEventListener('click', (e) => {
      if (e.target.closest('.btn-account-delete')) return;
      selectAccount(accName);
    });

    const btnDel = item.querySelector('.btn-account-delete');
    if (btnDel) {
      btnDel.addEventListener('click', (e) => {
        e.stopPropagation();
        appConfig.accounts = appConfig.accounts.filter(a => a !== accName);
        saveCurrentConfig();
        renderAccountDropdown();
      });
    }

    accountMenuList.appendChild(item);
  });
}

async function selectAccount(name) {
  appConfig.username = name;
  if (usernameInput) usernameInput.value = name;
  if (profileUsernameInput) profileUsernameInput.value = name;
  if (heroProfileName) heroProfileName.textContent = name;
  updateAccountTopbar();

  if (accountMenuPopover) accountMenuPopover.style.display = 'none';

  try {
    const savedSkin = await window.electronAPI.getSkin(name);
    if (savedSkin && savedSkin.success && savedSkin.dataUrl) {
      customSkinDataUrl = savedSkin.dataUrl;
      currentArmModel = savedSkin.model || 'default';
      modelToggleBtns.forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-model') === currentArmModel);
      });
      loadSkinIntoViewer(customSkinDataUrl, currentArmModel);
      generateAvatarFromCustomSkin(customSkinDataUrl);
      if (skinSourceText) skinSourceText.textContent = 'Source: Custom Skin (Saved)';
      if (skinSourceDot) skinSourceDot.style.background = '#22c55e';
    } else {
      customSkinDataUrl = null;
      update3DSkin(name);
      if (skinSourceText) skinSourceText.textContent = 'Source: Mojang Online Sync';
      if (skinSourceDot) skinSourceDot.style.background = '#3b82f6';
    }
  } catch (e) {
    update3DSkin(name);
  }

  await loadActiveUserCape(name);
  await saveCurrentConfig();
  updateStatus(`Switched account to: ${name}`, 'success');
}

if (btnAccountSwitcher) {
  btnAccountSwitcher.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!accountMenuPopover) return;
    const isHidden = accountMenuPopover.style.display === 'none';
    if (isHidden) {
      renderAccountDropdown();
      accountMenuPopover.style.display = 'block';
    } else {
      accountMenuPopover.style.display = 'none';
    }
  });
}

if (btnAddAccount && inputNewAccount) {
  const doAddAccount = () => {
    const newName = inputNewAccount.value.trim();
    if (!newName) return;
    if (!/^[a-zA-Z0-9_]{2,16}$/.test(newName)) {
      updateStatus('Nickname must be 2-16 alphanumeric characters or underscore', 'warn');
      return;
    }
    const accounts = getAccountList();
    if (!accounts.includes(newName)) {
      accounts.push(newName);
    }
    inputNewAccount.value = '';
    selectAccount(newName);
  };

  btnAddAccount.addEventListener('click', doAddAccount);
  inputNewAccount.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doAddAccount();
  });
}

document.addEventListener('click', (e) => {
  if (accountMenuPopover && !e.target.closest('#account-switcher-wrap')) {
    accountMenuPopover.style.display = 'none';
  }
});

// ==========================================================================
// CAPES & CLOAKS STUDIO
// ==========================================================================
let activeCapeDataUrl = null;

async function loadActiveUserCape(username) {
  try {
    const res = await window.electronAPI.getCape(username || appConfig.username);
    if (res && res.success && res.dataUrl) {
      activeCapeDataUrl = res.dataUrl;
      if (skinViewer) {
        skinViewer.loadCape(activeCapeDataUrl);
      }
    } else {
      activeCapeDataUrl = null;
      if (skinViewer && skinViewer.playerObject && skinViewer.playerObject.cape) {
        skinViewer.playerObject.cape.visible = false;
      }
    }
  } catch (e) {
    console.warn('Failed to load user cape:', e);
  }
}

async function loadCapesStudio() {
  if (!capesPresetsGrid) return;
  capesPresetsGrid.innerHTML = `
    <div class="hub-loading-state" style="padding: 16px;">
      <div class="hub-spinner"></div>
      <span>Loading preset capes...</span>
    </div>
  `;

  try {
    const presets = await window.electronAPI.listCapePresets();
    capesPresetsGrid.innerHTML = '';

    presets.forEach(p => {
      const chip = document.createElement('div');
      chip.className = 'cape-preset-chip';
      chip.title = p.desc || p.name;
      chip.innerHTML = `
        <div class="cape-thumb-preview">
          ${p.dataUrl ? `<img src="${p.dataUrl}" alt="${p.name}" class="cape-preview-img">` : '<div class="cape-no-thumb"></div>'}
        </div>
        <span class="cape-chip-title">${p.name}</span>
      `;

      chip.addEventListener('click', async () => {
        if (!p.dataUrl) return;
        activeCapeDataUrl = p.dataUrl;
        if (skinViewer) skinViewer.loadCape(activeCapeDataUrl);
        await window.electronAPI.saveCape({
          username: appConfig.username,
          dataUrl: activeCapeDataUrl,
          gameDir: appConfig.gameDir
        });
        document.querySelectorAll('.cape-preset-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        updateStatus(`Applied cape: ${p.name}`, 'success');
      });

      capesPresetsGrid.appendChild(chip);
    });
  } catch (err) {
    capesPresetsGrid.innerHTML = `<span style="color: #ef4444; font-size: 12px;">Failed to load capes: ${err.message}</span>`;
  }
}

if (btnUploadCape && capeFileInput) {
  btnUploadCape.addEventListener('click', () => capeFileInput.click());

  capeFileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      activeCapeDataUrl = reader.result;
      if (skinViewer) skinViewer.loadCape(activeCapeDataUrl);
      await window.electronAPI.saveCape({
        username: appConfig.username,
        dataUrl: activeCapeDataUrl,
        gameDir: appConfig.gameDir
      });
      document.querySelectorAll('.cape-preset-chip').forEach(c => c.classList.remove('active'));
      updateStatus('Custom cape loaded & synced!', 'success');
    };
    reader.readAsDataURL(file);
    capeFileInput.value = '';
  });
}

if (btnClearCape) {
  btnClearCape.addEventListener('click', async () => {
    activeCapeDataUrl = null;
    if (skinViewer && skinViewer.playerObject && skinViewer.playerObject.cape) {
      skinViewer.playerObject.cape.visible = false;
    }
    await window.electronAPI.deleteCape({ username: appConfig.username, gameDir: appConfig.gameDir });
    document.querySelectorAll('.cape-preset-chip').forEach(c => c.classList.remove('active'));
    updateStatus('Cape removed', 'info');
  });
}

// ==========================================================================
// ORBIT FPS BOOSTER EXCLUSIVE CARD
// ==========================================================================
async function checkFpsBoosterStatus() {
  if (!fpsboosterStatusChip || !btnToggleFpsbooster) return;
  try {
    const status = await window.electronAPI.getFpsBoosterStatus(appConfig.gameDir);
    if (status && status.installed) {
      fpsboosterStatusChip.textContent = 'INSTALLED';
      fpsboosterStatusChip.className = 'banner-status-badge status-installed';
      btnToggleFpsbooster.textContent = 'UNINSTALL';
      btnToggleFpsbooster.className = 'btn-secondary-action';
    } else {
      fpsboosterStatusChip.textContent = 'AVAILABLE';
      fpsboosterStatusChip.className = 'banner-status-badge status-available';
      btnToggleFpsbooster.textContent = 'INSTALL MOD';
      btnToggleFpsbooster.className = 'btn-primary-action';
    }
  } catch (e) {
    console.warn('Failed to check FPS Booster status:', e);
  }
}

if (btnToggleFpsbooster) {
  btnToggleFpsbooster.addEventListener('click', async () => {
    btnToggleFpsbooster.disabled = true;
    try {
      const status = await window.electronAPI.getFpsBoosterStatus(appConfig.gameDir);
      if (status && status.installed) {
        btnToggleFpsbooster.textContent = 'UNINSTALLING...';
        const res = await window.electronAPI.uninstallFpsBooster(appConfig.gameDir);
        if (res.success) {
          updateStatus('Orbit FPS Booster uninstalled', 'info');
        }
      } else {
        btnToggleFpsbooster.textContent = 'INSTALLING...';
        const res = await window.electronAPI.installFpsBooster(appConfig.gameDir);
        if (res.success) {
          updateStatus('Orbit FPS Booster installed successfully!', 'success');
        } else {
          updateStatus(`Install failed: ${res.error}`, 'error');
        }
      }
      await checkFpsBoosterStatus();
      await loadInstalledModsList();
    } catch (err) {
      updateStatus(`Error: ${err.message}`, 'error');
    } finally {
      btnToggleFpsbooster.disabled = false;
    }
  });
}

// ==========================================================================
// MODPACK EXPORT & IMPORT (.orbit)
// ==========================================================================
if (btnExportModpack) {
  btnExportModpack.addEventListener('click', async () => {
    btnExportModpack.disabled = true;
    updateStatus('Exporting modpack package...', 'info');
    try {
      const res = await window.electronAPI.exportModpack(appConfig.gameDir);
      if (res && res.success) {
        updateStatus(`Exported "${res.name}.orbit" (${res.modCount} mods packaged)!`, 'success');
      } else if (res && !res.canceled) {
        updateStatus(`Export failed: ${res.error}`, 'error');
      }
    } catch (e) {
      updateStatus(`Export error: ${e.message}`, 'error');
    } finally {
      btnExportModpack.disabled = false;
    }
  });
}

if (btnImportModpack) {
  btnImportModpack.addEventListener('click', async () => {
    btnImportModpack.disabled = true;
    updateStatus('Importing modpack package...', 'info');
    try {
      const res = await window.electronAPI.importModpack(appConfig.gameDir);
      if (res && res.success) {
        updateStatus(`Imported ${res.importedCount} mods from "${res.packName}"!`, 'success');
        await loadInstalledModsList();
      } else if (res && !res.canceled) {
        updateStatus(`Import failed: ${res.error}`, 'error');
      }
    } catch (e) {
      updateStatus(`Import error: ${e.message}`, 'error');
    } finally {
      btnImportModpack.disabled = false;
    }
  });
}

// ==========================================================================
// CONTENT TYPE SELECTOR (MODS | SHADERS | RESOURCE PACKS)
// ==========================================================================
let currentProjectType = 'mod';

function setContentType(type) {
  currentProjectType = type;
  [btnTypeMods, btnTypeShaders, btnTypeResourcepacks].forEach(b => {
    if (b) b.classList.toggle('active', b.getAttribute('data-type') === type);
  });

  if (fpsboosterExclusiveCard) {
    fpsboosterExclusiveCard.style.display = type === 'mod' ? 'flex' : 'none';
  }

  if (modstoreSearchInput) {
    const placeholders = {
      mod: 'Search mods (e.g. Sodium, Iris, Create, AppleSkin, JourneyMap)...',
      shader: 'Search shaders (e.g. BSL, Complementary, AstraLex, Bliss)...',
      resourcepack: 'Search resource packs (e.g. Faithful, Bare Bones, Fresh Animations)...'
    };
    modstoreSearchInput.placeholder = placeholders[type] || 'Search...';
  }

  searchAndRenderMods(modstoreSearchInput ? modstoreSearchInput.value : '', currentModCategory);
  loadInstalledModsList();
}

if (btnTypeMods) btnTypeMods.addEventListener('click', () => setContentType('mod'));
if (btnTypeShaders) btnTypeShaders.addEventListener('click', () => setContentType('shader'));
if (btnTypeResourcepacks) btnTypeResourcepacks.addEventListener('click', () => setContentType('resourcepack'));

// ==========================================================================
// SERVERS & MULTIPLAYER HUB
// ==========================================================================
let cachedServers = [];

async function loadServersHub() {
  if (!serversCardsGrid) return;
  serversCardsGrid.innerHTML = `
    <div class="hub-loading-state">
      <div class="hub-spinner"></div>
      <span>Loading saved servers and pinging...</span>
    </div>
  `;

  try {
    cachedServers = await window.electronAPI.getServers();
    renderServersGrid();
  } catch (err) {
    serversCardsGrid.innerHTML = `<div class="hub-loading-state"><span>Failed to load servers: ${err.message}</span></div>`;
  }
}

function renderServersGrid() {
  if (!serversCardsGrid) return;
  serversCardsGrid.innerHTML = '';

  if (cachedServers.length === 0) {
    serversCardsGrid.innerHTML = `
      <div class="hub-loading-state">
        <span>No servers found. Click "Add Server" to add your friends LAN or Radmin VPN server!</span>
      </div>
    `;
    return;
  }

  cachedServers.forEach(server => {
    const card = document.createElement('div');
    card.className = 'server-card';
    card.id = `server-card-${server.id}`;
    card.innerHTML = `
      <div class="server-card-top">
        <div class="server-avatar-box">
          <img class="server-icon-img" id="server-icon-${server.id}" src="icon.png" alt="${server.name}">
        </div>
        <div class="server-meta-block">
          <div class="server-title-line">
            <h3 class="server-name">${server.name}</h3>
            <span class="server-ping-pill ping-checking" id="ping-pill-${server.id}">Pinging...</span>
          </div>
          <div class="server-ip-line">
            <span class="server-host-text">${server.host}${server.port && server.port !== 25565 ? `:${server.port}` : ''}</span>
            <button type="button" class="btn-copy-ip" title="Copy server address">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
          </div>
        </div>
      </div>
      <div class="server-card-body">
        <p class="server-motd" id="server-motd-${server.id}">${server.desc || 'Connecting...'}</p>
      </div>
      <div class="server-card-footer">
        <div class="server-players-badge" id="server-players-${server.id}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <span>-- / --</span>
        </div>
        <div class="server-actions-right">
          ${server.type !== 'official' ? `
            <button type="button" class="btn-server-delete" title="Delete server">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          ` : ''}
          <button type="button" class="btn-server-connect" title="Direct Connect into server">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <span>JOIN NOW</span>
          </button>
        </div>
      </div>
    `;

    const btnCopy = card.querySelector('.btn-copy-ip');
    btnCopy.addEventListener('click', (e) => {
      e.stopPropagation();
      const addr = `${server.host}${server.port && server.port !== 25565 ? `:${server.port}` : ''}`;
      navigator.clipboard.writeText(addr);
      updateStatus(`Copied server IP: ${addr}`, 'info');
    });

    const btnDel = card.querySelector('.btn-server-delete');
    if (btnDel) {
      btnDel.addEventListener('click', async (e) => {
        e.stopPropagation();
        cachedServers = cachedServers.filter(s => s.id !== server.id);
        await window.electronAPI.saveServers(cachedServers);
        renderServersGrid();
        updateStatus(`Removed server: ${server.name}`, 'info');
      });
    }

    const btnConnect = card.querySelector('.btn-server-connect');
    btnConnect.addEventListener('click', () => {
      startLaunch({ host: server.host, port: server.port || 25565 });
    });

    serversCardsGrid.appendChild(card);
    pingSingleServer(server);
  });
}

async function pingSingleServer(server) {
  const pill = document.getElementById(`ping-pill-${server.id}`);
  const motd = document.getElementById(`server-motd-${server.id}`);
  const players = document.getElementById(`server-players-${server.id}`);
  const icon = document.getElementById(`server-icon-${server.id}`);

  try {
    const res = await window.electronAPI.pingServer({ host: server.host, port: server.port || 25565 });
    if (res && res.online) {
      if (pill) {
        pill.textContent = `${res.ping}ms`;
        pill.className = `server-ping-pill ${res.ping < 100 ? 'ping-fast' : (res.ping < 200 ? 'ping-med' : 'ping-slow')}`;
      }
      if (motd && res.description) {
        motd.textContent = res.description.replace(/§[0-9a-fk-or]/gi, '').trim();
      }
      if (players && res.players) {
        players.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <span>${res.players.online} / ${res.players.max}</span>
        `;
      }
      if (icon && res.favicon) {
        icon.src = res.favicon;
      }
    } else {
      if (pill) {
        pill.textContent = 'OFFLINE';
        pill.className = 'server-ping-pill ping-offline';
      }
      if (motd) {
        motd.textContent = 'Server is currently offline or unreachable.';
      }
    }
  } catch (e) {
    if (pill) {
      pill.textContent = 'OFFLINE';
      pill.className = 'server-ping-pill ping-offline';
    }
  }
}

if (btnRefreshServers) {
  btnRefreshServers.addEventListener('click', () => {
    cachedServers.forEach(s => pingSingleServer(s));
  });
}

if (btnAddServerToggle && addServerCard) {
  btnAddServerToggle.addEventListener('click', () => {
    addServerCard.style.display = addServerCard.style.display === 'none' ? 'block' : 'none';
  });
}

if (btnCancelAddServer && addServerCard) {
  btnCancelAddServer.addEventListener('click', () => {
    addServerCard.style.display = 'none';
  });
}

if (btnSaveNewServer && newServerName && newServerHost) {
  btnSaveNewServer.addEventListener('click', async () => {
    const sName = newServerName.value.trim() || 'Custom Server';
    const sHost = newServerHost.value.trim();
    const sPort = parseInt(newServerPort.value, 10) || 25565;

    if (!sHost) {
      updateStatus('Please enter server address', 'warn');
      return;
    }

    const newEntry = {
      id: Date.now().toString(),
      name: sName,
      host: sHost,
      port: sPort,
      type: 'custom',
      desc: 'Player added server'
    };

    cachedServers.unshift(newEntry);
    await window.electronAPI.saveServers(cachedServers);
    renderServersGrid();
    addServerCard.style.display = 'none';
    newServerName.value = '';
    newServerHost.value = '';
    newServerPort.value = '25565';
    updateStatus(`Added server: ${sName}`, 'success');
  });
}

// ==========================================================================
// SCREENSHOTS & SNAPS GALLERY
// ==========================================================================
let activeLightboxPath = null;

async function loadScreenshotsGallery() {
  if (!screenshotsGridContainer) return;
  screenshotsGridContainer.innerHTML = `
    <div class="hub-loading-state">
      <div class="hub-spinner"></div>
      <span>Scanning screenshots...</span>
    </div>
  `;

  try {
    const shots = await window.electronAPI.listScreenshots(appConfig.gameDir);
    screenshotsGridContainer.innerHTML = '';

    if (shots.length === 0) {
      screenshotsGridContainer.innerHTML = `
        <div class="hub-loading-state">
          <span>No screenshots captured yet. Press F2 in Minecraft to capture moments!</span>
        </div>
      `;
      return;
    }

    shots.forEach(shot => {
      const card = document.createElement('div');
      card.className = 'screenshot-card';
      card.innerHTML = `
        <div class="screenshot-thumb-wrap">
          <img src="${shot.dataUrl}" alt="${shot.name}" class="screenshot-thumb-img" loading="lazy">
          <div class="screenshot-overlay-actions">
            <button type="button" class="btn-shot-action btn-shot-copy" title="Copy to clipboard (Discord/Telegram)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            <button type="button" class="btn-shot-action btn-shot-reveal" title="Show in folder">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            </button>
            <button type="button" class="btn-shot-action btn-shot-del" title="Delete screenshot">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
        <div class="screenshot-meta-row">
          <span class="screenshot-date">${shot.date}</span>
          <span class="screenshot-size">${shot.size}</span>
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.closest('.screenshot-overlay-actions')) return;
        openLightbox(shot);
      });

      const btnCopy = card.querySelector('.btn-shot-copy');
      btnCopy.addEventListener('click', async (e) => {
        e.stopPropagation();
        await window.electronAPI.copyScreenshot(shot.path);
        updateStatus('Screenshot copied to clipboard! (Ctrl+V in Discord)', 'success');
      });

      const btnReveal = card.querySelector('.btn-shot-reveal');
      btnReveal.addEventListener('click', (e) => {
        e.stopPropagation();
        window.electronAPI.openScreenshot(shot.path);
      });

      const btnDel = card.querySelector('.btn-shot-del');
      btnDel.addEventListener('click', async (e) => {
        e.stopPropagation();
        await window.electronAPI.deleteScreenshot(shot.path);
        card.remove();
        updateStatus(`Deleted ${shot.name}`, 'info');
      });

      screenshotsGridContainer.appendChild(card);
    });
  } catch (err) {
    screenshotsGridContainer.innerHTML = `<div class="hub-loading-state"><span>Failed to load screenshots: ${err.message}</span></div>`;
  }
}

function openLightbox(shot) {
  if (!screenshotLightboxModal) return;
  activeLightboxPath = shot.path;
  if (lightboxFilename) lightboxFilename.textContent = shot.name;
  if (lightboxImg) lightboxImg.src = shot.dataUrl;
  screenshotLightboxModal.style.display = 'flex';
}

function closeLightbox() {
  if (screenshotLightboxModal) screenshotLightboxModal.style.display = 'none';
  activeLightboxPath = null;
}

if (btnLightboxClose) btnLightboxClose.addEventListener('click', closeLightbox);
if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);

if (btnLightboxCopy) {
  btnLightboxCopy.addEventListener('click', async () => {
    if (!activeLightboxPath) return;
    await window.electronAPI.copyScreenshot(activeLightboxPath);
    updateStatus('Screenshot copied to clipboard!', 'success');
  });
}

if (btnLightboxOpen) {
  btnLightboxOpen.addEventListener('click', () => {
    if (!activeLightboxPath) return;
    window.electronAPI.openScreenshot(activeLightboxPath);
  });
}

if (btnOpenScreenshotsFolder) {
  btnOpenScreenshotsFolder.addEventListener('click', () => {
    const sDir = `${appConfig.gameDir}\\screenshots`;
    window.electronAPI.openPath(sDir);
  });
}

if (btnRefreshScreenshots) {
  btnRefreshScreenshots.addEventListener('click', loadScreenshotsGallery);
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (screenshotLightboxModal && screenshotLightboxModal.style.display !== 'none') {
      closeLightbox();
    }
  }
});

// ==========================================================================
// AUTO-UPDATER SYSTEM (GITHUB RELEASES)
// ==========================================================================
const updateModal = document.getElementById('update-modal');
const btnCloseUpdate = document.getElementById('btn-close-update');
const btnCancelUpdate = document.getElementById('btn-cancel-update');
const btnDoUpdate = document.getElementById('btn-do-update');
const btnDoUpdateText = document.getElementById('btn-do-update-text');
const updateVersionSubtitle = document.getElementById('update-version-subtitle');
const updateChipCurrent = document.getElementById('update-chip-current');
const updateChipNew = document.getElementById('update-chip-new');
const updateChipSize = document.getElementById('update-chip-size');
const updateNotesBox = document.getElementById('update-notes-box');
const updateDownloadBox = document.getElementById('update-download-box');
const updateStatusText = document.getElementById('update-status-text');
const updateProgressNum = document.getElementById('update-progress-num');
const updateProgressFill = document.getElementById('update-progress-fill');
const updateSpeedText = document.getElementById('update-speed-text');
const updateDownloadedText = document.getElementById('update-downloaded-text');

const btnCheckUpdatesManual = document.getElementById('btn-check-updates-manual');
const btnCheckUpdatesText = document.getElementById('btn-check-updates-text');
const updateManualStatus = document.getElementById('update-manual-status');

let latestUpdateData = null;
let isUpdating = false;

function showUpdateModal(data) {
  if (!updateModal) return;
  latestUpdateData = data;

  if (updateVersionSubtitle) updateVersionSubtitle.textContent = `Orbit Launcher ${data.newVersion}`;
  if (updateChipCurrent) updateChipCurrent.textContent = `Current: v${data.currentVersion}`;
  if (updateChipNew) updateChipNew.textContent = `New: ${data.newVersion}`;
  if (updateChipSize) updateChipSize.textContent = data.fileSize || 'Setup Binary';
  if (updateNotesBox) updateNotesBox.textContent = data.notes || 'No release notes provided.';

  if (updateDownloadBox) updateDownloadBox.style.display = 'none';
  if (btnDoUpdate) {
    btnDoUpdate.disabled = false;
    if (btnDoUpdateText) btnDoUpdateText.textContent = 'DOWNLOAD & INSTALL';
  }
  if (btnCancelUpdate) btnCancelUpdate.disabled = false;

  updateModal.style.display = 'flex';
}

function closeUpdateModal() {
  if (isUpdating) return;
  if (updateModal) updateModal.style.display = 'none';
}

if (btnCloseUpdate) btnCloseUpdate.addEventListener('click', closeUpdateModal);
if (btnCancelUpdate) btnCancelUpdate.addEventListener('click', closeUpdateModal);

async function checkClientUpdates(isManual = false) {
  if (btnCheckUpdatesManual && isManual) {
    btnCheckUpdatesManual.disabled = true;
    if (btnCheckUpdatesText) btnCheckUpdatesText.textContent = 'CHECKING...';
  }
  if (updateManualStatus && isManual) {
    updateManualStatus.textContent = 'Contacting GitHub releases...';
  }

  try {
    const res = await window.electronAPI.checkForUpdates();
    if (res.updateAvailable) {
      if (updateManualStatus) {
        updateManualStatus.textContent = `Update available: ${res.newVersion}`;
        updateManualStatus.style.color = '#f87171';
      }
      showUpdateModal(res);
    } else {
      if (updateManualStatus && isManual) {
        updateManualStatus.textContent = res.message || 'Orbit Launcher is up to date!';
        updateManualStatus.style.color = '#22c55e';
      }
      if (isManual) {
        appendLog('You are running the latest version of Orbit Launcher', 'ok');
      }
    }
  } catch (err) {
    if (updateManualStatus && isManual) {
      updateManualStatus.textContent = `Check failed: ${err.message}`;
      updateManualStatus.style.color = '#f87171';
    }
  } finally {
    if (btnCheckUpdatesManual && isManual) {
      btnCheckUpdatesManual.disabled = false;
      if (btnCheckUpdatesText) btnCheckUpdatesText.textContent = 'CHECK FOR UPDATES';
    }
  }
}

if (btnCheckUpdatesManual) {
  btnCheckUpdatesManual.addEventListener('click', () => checkClientUpdates(true));
}

if (btnDoUpdate) {
  btnDoUpdate.addEventListener('click', async () => {
    if (!latestUpdateData || !latestUpdateData.downloadUrl) return;
    if (isUpdating) return;

    isUpdating = true;
    btnDoUpdate.disabled = true;
    if (btnCancelUpdate) btnCancelUpdate.disabled = true;
    if (btnDoUpdateText) btnDoUpdateText.textContent = 'DOWNLOADING...';

    if (updateDownloadBox) updateDownloadBox.style.display = 'flex';
    if (updateProgressFill) updateProgressFill.style.width = '0%';
    if (updateStatusText) updateStatusText.textContent = 'Starting download...';

    const res = await window.electronAPI.downloadUpdate(latestUpdateData.downloadUrl);

    if (res.success) {
      if (updateStatusText) updateStatusText.textContent = 'Installing update and restarting...';
      if (btnDoUpdateText) btnDoUpdateText.textContent = 'RESTARTING...';
      await window.electronAPI.installUpdate(res.filePath);
    } else {
      isUpdating = false;
      btnDoUpdate.disabled = false;
      if (btnCancelUpdate) btnCancelUpdate.disabled = false;
      if (btnDoUpdateText) btnDoUpdateText.textContent = 'RETRY';
      if (updateStatusText) updateStatusText.textContent = `Download failed: ${res.error}`;
    }
  });
}

window.electronAPI.onUpdateProgress((prog) => {
  if (!prog) return;
  if (updateProgressFill) updateProgressFill.style.width = `${prog.percent}%`;
  if (updateProgressNum) updateProgressNum.textContent = `${prog.percent}%`;
  if (updateSpeedText) updateSpeedText.textContent = `${prog.speed} MB/s`;
  if (updateDownloadedText) updateDownloadedText.textContent = `${prog.downloadedMb} / ${prog.totalMb} MB`;
  if (updateStatusText) updateStatusText.textContent = `Downloading ${latestUpdateData ? latestUpdateData.fileName : 'update'}...`;
});

document.addEventListener('DOMContentLoaded', () => {
  initConfig();
  setTimeout(() => {
    checkClientUpdates(false);
  }, 3000);
});

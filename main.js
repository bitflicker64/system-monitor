const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  Notification,
  powerMonitor,
  nativeImage,
} = require('electron');
const os = require('os');
const path = require('path');

const POLL_MS = 1000;
const ALERT_COOLDOWN_MS = 60 * 1000;

let win = null;
let tray = null;
let isQuitting = false;
let ramThreshold = 90; // percent, changeable from the UI over IPC
let lastAlertAt = 0;
let prevCpu = readCpuTimes();

// Sum of idle and total CPU ticks across all cores.
function readCpuTimes() {
  let idle = 0;
  let total = 0;
  for (const cpu of os.cpus()) {
    for (const t of Object.values(cpu.times)) total += t;
    idle += cpu.times.idle;
  }
  return { idle, total };
}

// CPU usage since the previous call, as a percentage.
function sampleCpu() {
  const now = readCpuTimes();
  const idleDiff = now.idle - prevCpu.idle;
  const totalDiff = now.total - prevCpu.total;
  prevCpu = now;
  return totalDiff > 0 ? (1 - idleDiff / totalDiff) * 100 : 0;
}

function sampleStats() {
  const total = os.totalmem();
  const used = total - os.freemem();
  return {
    cpu: sampleCpu(),
    ram: { used, total, percent: (used / total) * 100 },
    onBattery: powerMonitor.isOnBatteryPower(),
    uptime: os.uptime(),
    ts: Date.now(),
  };
}

function createWindow() {
  win = new BrowserWindow({
    width: 520,
    height: 640,
    title: 'System Monitor',
    backgroundColor: '#0f1419',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Closing the window hides it to the tray instead of quitting.
  win.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      win.hide();
    }
  });
}

function showWindow() {
  if (!win) return createWindow();
  win.show();
  win.focus();
}

// Draws a small solid square so the tray has an icon on every platform.
function buildTrayIcon() {
  const size = 16;
  const buf = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    buf[i * 4 + 0] = 0xf5; // B
    buf[i * 4 + 1] = 0xb0; // G
    buf[i * 4 + 2] = 0x4a; // R
    buf[i * 4 + 3] = 0xff; // A
  }
  return nativeImage.createFromBitmap(buf, { width: size, height: size });
}

function createTray() {
  tray = new Tray(buildTrayIcon());
  tray.setToolTip('System Monitor');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Show Monitor', click: showWindow },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ])
  );
  tray.on('click', showWindow);
}

function maybeAlert(stats) {
  const now = Date.now();
  if (stats.ram.percent < ramThreshold || now - lastAlertAt < ALERT_COOLDOWN_MS) return;
  if (!Notification.isSupported()) return;
  lastAlertAt = now;
  new Notification({
    title: 'High memory usage',
    body: `RAM is at ${stats.ram.percent.toFixed(0)}% (limit ${ramThreshold}%).`,
  }).show();
}

function startPolling() {
  setInterval(() => {
    const stats = sampleStats();

    // Main -> renderer push.
    if (win && !win.isDestroyed()) win.webContents.send('stats:update', stats);

    if (tray) {
      tray.setToolTip(`CPU ${stats.cpu.toFixed(0)}%  |  RAM ${stats.ram.percent.toFixed(0)}%`);
      if (process.platform === 'darwin') tray.setTitle(`${stats.cpu.toFixed(0)}%`);
    }
    maybeAlert(stats);
  }, POLL_MS);
}

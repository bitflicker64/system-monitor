const {
  BrowserWindow,
  powerMonitor,
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

const {
  powerMonitor,
} = require('electron');
const os = require('os');

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

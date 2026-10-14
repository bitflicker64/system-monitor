const HISTORY_LEN = 60;
const cpuHistory = [];

const $ = (id) => document.getElementById(id);
const gb = (bytes) => (bytes / 1024 ** 3).toFixed(1);

function setBar(el, percent) {
  el.style.width = `${percent.toFixed(0)}%`;
  el.classList.toggle('warn', percent >= 70 && percent < 90);
  el.classList.toggle('danger', percent >= 90);
}

function drawChart() {
  const canvas = $('cpu-chart');
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  ctx.strokeStyle = '#4ab0f5';
  ctx.lineWidth = 2;
  ctx.beginPath();
  cpuHistory.forEach((value, i) => {
    const x = (i / (HISTORY_LEN - 1)) * width;
    const y = height - (value / 100) * height;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function renderStats(stats) {
  $('cpu-value').textContent = `${stats.cpu.toFixed(0)}%`;
  setBar($('cpu-bar'), stats.cpu);

  cpuHistory.push(stats.cpu);
  if (cpuHistory.length > HISTORY_LEN) cpuHistory.shift();
  drawChart();

  $('ram-value').textContent = `${stats.ram.percent.toFixed(0)}%`;
  setBar($('ram-bar'), stats.ram.percent);
  $('ram-detail').textContent = `${gb(stats.ram.used)} GB of ${gb(stats.ram.total)} GB used`;

  $('power-source').textContent = stats.onBattery ? 'Running on battery' : 'Plugged in';
}

let hasEvents = false;

function logEvent({ event, ts }) {
  const list = $('events');
  if (!hasEvents) {
    list.innerHTML = '';
    hasEvents = true;
  }
  const li = document.createElement('li');
  li.textContent = `${new Date(ts).toLocaleTimeString()}  ${event}`;
  list.prepend(li);
}

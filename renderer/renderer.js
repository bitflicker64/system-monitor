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

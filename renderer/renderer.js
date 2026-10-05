const HISTORY_LEN = 60;
const cpuHistory = [];

const $ = (id) => document.getElementById(id);
const gb = (bytes) => (bytes / 1024 ** 3).toFixed(1);

function setBar(el, percent) {
  el.style.width = `${percent.toFixed(0)}%`;
  el.classList.toggle('warn', percent >= 70 && percent < 90);
  el.classList.toggle('danger', percent >= 90);
}

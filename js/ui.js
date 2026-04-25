export function showTab(name, el) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  el.classList.add('active');
}

export function initSpeedControl(callback) {
  document.getElementById('speed-ctrl').oninput = function () {
    const speed = parseInt(this.value);
    document.getElementById('speed-val').textContent = (speed / 1000).toFixed(1) + 's';
    callback(speed);
  };
}
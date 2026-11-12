let timer;
export function toast(message) {
  const el = document.getElementById('ts');
  el.textContent = message;
  el.classList.add('on');
  clearTimeout(timer);
  timer = setTimeout(() => el.classList.remove('on'), 2400);
}
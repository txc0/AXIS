import { esc } from '../lib/dom.js';

const md = document.getElementById('md');
let lastFocus = null;

export function openModal(html) {
  if (!md.classList.contains('on')) lastFocus = document.activeElement;
  md.innerHTML = `<div class="box"><button class="x" data-close aria-label="Close">×</button>${html}</div>`;
  md.classList.add('on');
  const box = md.firstElementChild;
  box.addEventListener('click', e => { if (e.target.closest('[data-close], a[href]')) closeModal(); });
  (box.querySelector('input:not(.hp), select, textarea') || box.querySelector('.x')).focus();
  return box;
}

export function closeModal() {
  if (!md.classList.contains('on')) return;
  md.classList.remove('on');
  md.innerHTML = '';
  lastFocus?.focus?.();
}

md.addEventListener('click', e => { if (e.target === md) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// Hidden spam trap. Every public form should include it.
export const HONEYPOT = '<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">';

const field = f => {
  const attrs = `name="${f.name}" aria-label="${esc(f.label)}" ${f.required === false ? '' : 'required'} ${f.autocomplete ? `autocomplete="${f.autocomplete}"` : ''}`;
  if (f.type === 'textarea') return `<textarea ${attrs} rows="${f.rows || 4}" placeholder="${esc(f.label)}"></textarea>`;
  if (f.type === 'select') {
    return `<select ${attrs}>${f.options.map(o => typeof o === 'object'
      ? `<option value="${esc(o.value)}">${esc(o.label)}</option>`
      : `<option>${esc(o)}</option>`).join('')}</select>`;
  }
  return `<input ${attrs} type="${f.type || 'text'}" placeholder="${esc(f.label)}">`;
};

// Wires up any <form>: required check, loading state, server error display.
export function bindForm(form, { onSubmit, onSuccess = () => {}, errorEl = form.querySelector('.err') }) {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button:not([type=button])');
    const missing = [...form.querySelectorAll('[required]')].find(el => !el.value.trim());
    if (missing) { errorEl.textContent = 'Please fill in every field.'; missing.focus(); return; }
    const values = Object.fromEntries(new FormData(form));
    errorEl.textContent = '';
    if (btn) btn.disabled = true;
    try {
      onSuccess(await onSubmit(values), values);
    } catch (err) {
      errorEl.textContent = err.message;
    } finally {
      if (btn?.isConnected) btn.disabled = false;
    }
  });
}

// A modal containing a form. onSubmit returns the HTML to show on success.
// intro is inserted as HTML, so escape any user data you put in it.
export function formModal({ title, intro = '', fields, submit, onSubmit }) {
  const box = openModal(
    `<h3>${esc(title)}</h3>${intro ? `<p class="intro">${intro}</p>` : ''}
     <form class="f" novalidate>${fields.map(field).join('')}${HONEYPOT}
       <div class="err" role="alert"></div><button class="btn">${esc(submit)}</button></form>`
  );
  bindForm(box.querySelector('form'), { onSubmit, onSuccess: html => html && openModal(html) });
}
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ALWAYS wrap data in esc() before putting it into HTML. It prevents broken pages and XSS.
const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ENTITIES[c]);

export const fmt = n => 'BDT ' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// "pr0" → /images/pr0.jpg, "/uploads/x.jpg" → /uploads/x.jpg
export const imgUrl = key => {
  const value = String(key ?? '');
  if (value.startsWith('/') || /^https?:\/\//i.test(value)) return value;
  return `/images/${encodeURIComponent(value)}${value.includes('.') ? '' : '.jpg'}`;
};
export const bg = key => (key ? `style="background-image:url('${imgUrl(key)}')"` : '');

export const TZ = 'Asia/Dhaka';
export const fmtDate = (iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Date(iso).toLocaleString('en-GB', { timeZone: TZ, ...opts });

export function timeAgo(iso) {
  const s = (Date.now() - new Date(iso)) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  if (s < 7 * 86400) return `${Math.round(s / 86400)}d ago`;
  return fmtDate(iso, { day: 'numeric', month: 'short' });
}
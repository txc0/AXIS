// Browser-side state: the cart and the shop filter.
const get = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const set = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode / full */ } };
export const storage = { get, set };

const listeners = new Set();
const save = items => { set('axis_cart', items); listeners.forEach(fn => fn(items)); };

// Cart lines: { kind: 'product', slug, name, price, image } or { kind: 'custom', config, name, price, image }.
// name/price here are for display only; the server re-prices everything at checkout.
export const cart = {
  items: () => get('axis_cart', []),
  add(line) { save([...cart.items(), line]); },
  remove(index) { const items = cart.items(); items.splice(index, 1); save(items); },
  replace(items) { save(items); },
  clear() { save([]); },
  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};
// Keep several open tabs in sync
addEventListener('storage', e => { if (e.key === 'axis_cart') listeners.forEach(fn => fn(cart.items())); });

export const shopFilter = { cat: 'all', q: '', sort: '' };
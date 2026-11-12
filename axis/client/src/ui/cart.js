import { esc, fmt, bg } from '../lib/dom.js';
import { api } from '../lib/api.js';
import { cart, storage } from '../lib/store.js';
import { formModal, openModal, bindForm } from './modal.js';
import { toast } from './toast.js';

const dr = document.getElementById('dr');
let lastFocus = null;
const payload = items => items.map(({ kind, slug, config }) => (kind === 'product' ? { kind, slug } : { kind, config }));
const STATUS = { new: 'Received', confirmed: 'Confirmed', shipped: 'On its way', delivered: 'Delivered', cancelled: 'Cancelled', unknown: 'Status unavailable' };

export async function openCart() {
  lastFocus = document.activeElement;
  dr.classList.add('on');
  await renderCart();
  dr.querySelector('button')?.focus();
}
export function closeCart() {
  dr.classList.remove('on');
  lastFocus?.focus?.();
}

async function renderCart() {
  const head = '<div class="dr-head"><h3>Cart</h3><button class="sm" data-close-cart>Close</button></div>';
  const items = cart.items();
  if (!items.length) {
    dr.innerHTML = `${head}<p>Your cart is empty.</p><p class="mt"><a class="link" href="/#shop" data-cat="all">Browse the shop</a></p>`;
    return;
  }
  dr.innerHTML = `${head}<p class="muted">Checking prices…</p>`;
  let quote;
  try {
    quote = await api.post('/cart/quote', { items: payload(items) });
  } catch (err) {
    dr.innerHTML = `${head}<p class="err">${esc(err.message)}</p>`;
    return;
  }
  const bad = quote.lines.filter(l => !l.valid).map(l => l.index);
  if (bad.length) {
    cart.replace(items.filter((_, i) => !bad.includes(i)));
    toast('Some items are no longer available and were removed.');
    return renderCart();
  }
  // Keep displayed prices in sync with the server.
  cart.replace(items.map((it, i) => ({ ...it, name: quote.lines[i].name, price: quote.lines[i].price })));
  dr.innerHTML = head + quote.lines.map((l, i) => `
    <div class="ci"><div class="th" ${bg(l.image)}></div>
      <div><b>${esc(l.name)}</b><br><span class="muted">${fmt(l.price)}</span></div>
      <button class="sm" data-rm="${i}" aria-label="Remove ${esc(l.name)}">Remove</button></div>`).join('') +
    `<p class="total"><span>Total</span><b>${fmt(quote.total)}</b></p>
     <p class="muted small">Free delivery in Dhaka. You pay on delivery or by bKash after we call.</p>
     <button class="btn block" data-checkout>Checkout</button>`;
}

dr.addEventListener('click', e => {
  const t = e.target.closest('[data-close-cart], [data-rm], [data-checkout], a[href]');
  if (!t) return;
  if (t.matches('a[href]') || 'closeCart' in t.dataset) return closeCart();
  if ('rm' in t.dataset) { cart.remove(Number(t.dataset.rm)); renderCart(); }
  if ('checkout' in t.dataset) { closeCart(); checkout(); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && dr.classList.contains('on')) closeCart(); });

async function checkout() {
  let payments;
  try { ({ payments } = await api.cached('/catalog')); } catch (err) { return toast(err.message); }
  formModal({
    title: 'Delivery details',
    intro: 'We will call to confirm your order before delivery.',
    submit: 'Place order',
    fields: [
      { name: 'name', label: 'Full name', autocomplete: 'name' },
      { name: 'phone', label: 'Phone', type: 'tel', autocomplete: 'tel' },
      { name: 'address', label: 'Delivery address', autocomplete: 'street-address' },
      { name: 'payment', label: 'Payment method', type: 'select', options: payments },
    ],
    onSubmit: async ({ website, ...customer }) => {
      const order = await api.post('/orders', { customer, items: payload(cart.items()) });
      const mine = storage.get('axis_orders', []);
      storage.set('axis_orders', [{ code: order.code, phone: customer.phone, total: order.total, at: new Date().toISOString() }, ...mine].slice(0, 20));
      cart.clear();
      return `<h3>Order ${esc(order.code)} placed</h3>
        <p>Thank you, ${esc(customer.name)}. We will call ${esc(customer.phone)} to confirm delivery. Your terrarium is grown and packed in 3 to 5 days.</p>
        <p class="muted mt">Total: ${fmt(order.total)} · Keep your order number to check its status under "My orders".</p>`;
    },
  });
}

export async function openOrders() {
  const mine = storage.get('axis_orders', []);
  const row = o => `<p class="order-row"><b>${esc(o.code)}</b> · ${esc(STATUS[o.status] || o.status)} · ${fmt(o.total)}<br>
    <span class="muted small">${new Date(o.created_at || o.at).toLocaleString()}</span></p>`;
  const box = openModal(`<h3>Your orders</h3>
    <div id="ol">${mine.length ? '<p class="muted">Loading…</p>' : '<p class="muted">No orders on this device yet.</p>'}</div>
    <h4 class="sub">Find an order</h4>
    <form class="f" novalidate>
      <input name="code" placeholder="Order number, e.g. AX-1001" aria-label="Order number" required>
      <input name="phone" type="tel" placeholder="Phone used for the order" aria-label="Phone" required>
      <div class="err" role="alert"></div><button class="btn o">Look up</button></form><div id="lk"></div>`);
  const lookup = (code, phone) => api.get(`/orders/${encodeURIComponent(code.trim().toUpperCase())}?phone=${encodeURIComponent(phone)}`);
  bindForm(box.querySelector('form'), {
    onSubmit: v => lookup(v.code, v.phone),
    onSuccess: o => { box.querySelector('#lk').innerHTML = row(o); },
  });
  if (mine.length) {
    const results = await Promise.all(mine.map(o => lookup(o.code, o.phone).catch(() => ({ ...o, status: 'unknown' }))));
    if (box.isConnected) box.querySelector('#ol').innerHTML = results.map(row).join('');
  }
}
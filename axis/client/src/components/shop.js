import { esc, fmt, bg } from '../lib/dom.js';
import { cart, shopFilter } from '../lib/store.js';
import { openModal, closeModal } from '../ui/modal.js';
import { toast } from '../ui/toast.js';

const CATS = [['all', 'All'], ['ready', 'Ready terrariums'], ['plants', 'Plants'], ['custom', 'Custom']];

export const shopHtml = () => `
<section class="sec" id="shop">
  <div class="shead"><div><p class="kick">SHOP</p><h2>Terrariums and plants</h2></div><div class="tools" id="tools"></div></div>
  <div class="grid" id="grid"></div>
</section>`;

export function mountShop(root, products, signal) {
  const tools = root.querySelector('#tools');
  const grid = root.querySelector('#grid');

  const renderTools = () => {
    tools.innerHTML = CATS.map(([k, label]) =>
      `<button class="${shopFilter.cat === k ? 'on' : ''}" data-shopcat="${k}" aria-pressed="${shopFilter.cat === k}">${label}</button>`).join('') +
      `<input id="q" type="search" placeholder="Search" aria-label="Search products" value="${esc(shopFilter.q)}">
       <select id="so" aria-label="Sort"><option value="">Featured</option>
       <option value="low"${shopFilter.sort === 'low' ? ' selected' : ''}>Price: low to high</option>
       <option value="high"${shopFilter.sort === 'high' ? ' selected' : ''}>Price: high to low</option></select>`;
  };

  const renderGrid = () => {
    const q = shopFilter.q.trim().toLowerCase();
    const list = products.filter(p =>
      (shopFilter.cat === 'all' || p.category === shopFilter.cat) &&
      (!q || `${p.name} ${p.description}`.toLowerCase().includes(q)));
    if (shopFilter.sort) list.sort((a, b) => (shopFilter.sort === 'low' ? a.price - b.price : b.price - a.price));
    grid.innerHTML = list.length
      ? list.map(p => `<button class="pd" data-pd="${esc(p.slug)}"><div class="im" ${bg(p.image)}></div>
          <div class="n">${esc(p.name)}</div><div class="p">${p.category === 'custom' ? 'From ' : ''}${fmt(p.price)}</div></button>`).join('')
      : '<p>No products match your search.</p>';
  };

  const openProduct = slug => {
    const p = products.find(x => x.slug === slug);
    if (!p) return;
    const box = openModal(`<div class="pdg"><div class="pimg" ${bg(p.image)}></div><div>
      <h3>${esc(p.name)}</h3><p class="muted mb">${p.category === 'custom' ? 'From ' : ''}${fmt(p.price)}</p>
      <p class="desc">${esc(p.description)}</p>
      ${p.category === 'custom' ? '<a class="btn" href="/#build">Design yours</a>' : '<button class="btn" data-add>Add to cart</button>'}
      <p class="muted small mt">30-day plant guarantee. Free delivery in Dhaka.</p></div></div>`);
    box.querySelector('[data-add]')?.addEventListener('click', () => {
      cart.add({ kind: 'product', slug: p.slug, name: p.name, price: p.price, image: p.image });
      toast(`${p.name} added to cart`);
      closeModal();
    });
  };

  tools.addEventListener('click', e => {
    const b = e.target.closest('[data-shopcat]');
    if (!b) return;
    shopFilter.cat = b.dataset.shopcat;
    renderTools();
    renderGrid();
  }, { signal });
  tools.addEventListener('input', e => { if (e.target.id === 'q') { shopFilter.q = e.target.value; renderGrid(); } }, { signal });
  tools.addEventListener('change', e => { if (e.target.id === 'so') { shopFilter.sort = e.target.value; renderGrid(); } }, { signal });
  grid.addEventListener('click', e => { const b = e.target.closest('[data-pd]'); if (b) openProduct(b.dataset.pd); }, { signal });
  addEventListener('shop:filter', () => { renderTools(); renderGrid(); }, { signal });

  renderTools();
  renderGrid();
}
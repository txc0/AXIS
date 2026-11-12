import { esc, fmt } from '../lib/dom.js';
import { cart } from '../lib/store.js';
import { toast } from '../ui/toast.js';
import { terrariumSvg } from './terrarium.js';

export const builderHtml = () => `
<section class="sec builder" id="build">
  <p class="kick">BUILDER</p><h2 class="mb">Build your own world</h2>
  <div class="bd">
    <div class="pv"><div id="pvs"></div><div class="pvt"><span id="pn"></span><b id="pp"></b></div></div>
    <div class="og">
      <h4>Vessel</h4><div data-grp="vessel"></div>
      <h4>Landscape</h4><div data-grp="land"></div>
      <h4>Plants (up to 3)</h4><div data-grp="plant"></div>
      <h4>Accents</h4><div data-grp="accent"></div>
      <div class="warn" id="wn" role="status"></div>
      <button class="btn" data-b="add">Add to cart</button>
      <button class="btn o" data-b="random">Surprise me</button>
      <button class="btn o" data-consult>Book consultation</button>
    </div>
  </div>
</section>`;

const pick = list => list[Math.floor(Math.random() * list.length)];

export function mountBuilder(root, opts, signal) {
  const el = root.querySelector('#build');
  if (!opts.vessel?.length || !opts.land?.length) { el.hidden = true; return; }
  const index = g => Object.fromEntries((opts[g] || []).map(o => [o.key, o]));
  const O = { vessel: index('vessel'), land: index('land'), plant: index('plant'), accent: index('accent') };
  const state = {
    vessel: opts.vessel[0].key,
    land: opts.land[0].key,
    plants: new Set(opts.plant?.[0] ? [opts.plant[0].key] : []),
    accents: new Set(),
  };

  const total = () => O.vessel[state.vessel].price + O.land[state.land].price
    + [...state.plants].reduce((s, k) => s + O.plant[k].price, 0)
    + [...state.accents].reduce((s, k) => s + O.accent[k].price, 0);
  const isOn = (g, k) => ({ vessel: state.vessel === k, land: state.land === k, plant: state.plants.has(k), accent: state.accents.has(k) })[g];

  function draw() {
    const land = O.land[state.land];
    el.querySelector('#pvs').innerHTML = terrariumSvg(state, land);
    el.querySelector('#pp').textContent = fmt(total());
    el.querySelector('#pn').textContent = `${O.vessel[state.vessel].name} · ${land.name}`;
    el.querySelectorAll('[data-grp]').forEach(box => {
      const g = box.dataset.grp;
      box.innerHTML = (opts[g] || []).map(o =>
        `<button class="po" data-k="${esc(o.key)}" aria-pressed="${isOn(g, o.key)}">${esc(o.name)} · ${o.price}</button>`).join('');
    });
    const unhappy = [...state.plants].filter(k => O.plant[k].wet !== land.wet).map(k => O.plant[k].name);
    let warning = '';
    if (unhappy.length && land.wet) {
      warning = `${unhappy.join(', ')} prefer dry soil. Try ${opts.plant.filter(p => p.wet).map(p => p.name.toLowerCase()).join(' or ')}.`;
    } else if (unhappy.length) {
      warning = `${unhappy.join(', ')} need moisture. Try ${opts.land.filter(l => l.wet).map(l => l.name).join(' or ')}.`;
    }
    el.querySelector('#wn').textContent = warning;
  }

  el.addEventListener('click', e => {
    const b = e.target.closest('[data-k], [data-b]');
    if (!b) return;
    if (b.dataset.k) {
      const g = b.parentElement.dataset.grp, k = b.dataset.k;
      if (g === 'vessel') state.vessel = k;
      else if (g === 'land') state.land = k;
      else if (g === 'plant') {
        if (state.plants.has(k)) state.plants.delete(k);
        else if (state.plants.size < 3) state.plants.add(k);
        else toast('Three plants fit. Remove one first.');
      } else if (state.accents.has(k)) state.accents.delete(k);
      else state.accents.add(k);
      draw();
    } else if (b.dataset.b === 'add') {
      const name = `Custom ${O.vessel[state.vessel].name} terrarium`;
      cart.add({
        kind: 'custom',
        config: { vessel: state.vessel, land: state.land, plants: [...state.plants], accents: [...state.accents] },
        name, price: total(), image: 'cu',
      });
      toast(`${name} added to cart`);
    } else if (b.dataset.b === 'random') {
      state.vessel = pick(opts.vessel).key;
      state.land = pick(opts.land).key;
      const fits = (opts.plant || []).filter(p => p.wet === O.land[state.land].wet).sort(() => Math.random() - 0.5);
      state.plants = new Set(fits.slice(0, 1 + Math.floor(Math.random() * Math.min(3, fits.length))).map(p => p.key));
      state.accents = new Set((opts.accent || []).filter(() => Math.random() > 0.6).map(a => a.key));
      draw();
    }
  }, { signal });

  draw();
}
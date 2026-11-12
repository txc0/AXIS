import { api } from '../lib/api.js';
import { esc, bg, fmtDate } from '../lib/dom.js';
import { head } from '../components/page.js';

const card = a => `<a class="jc" href="/journal/${esc(a.slug)}"><div class="im" ${bg(a.image)}></div>
  <p class="kick">${esc(a.category.toUpperCase())} · ${a.minutes} MIN READ</p><h3>${esc(a.title)}</h3><p>${esc(a.excerpt)}</p></a>`;
const block = s => (s.startsWith('## ') ? `<h3>${esc(s.slice(3))}</h3>` : `<p>${esc(s)}</p>`);

async function articlePage(slug) {
  const { article: a, related } = await api.get(`/articles/${encodeURIComponent(slug)}`);
  return {
    title: a.title,
    html: `<div class="pg">${head([['Journal', '/journal'], [a.category]], `${a.category} · ${fmtDate(a.published_at)} · ${a.minutes} min read`, a.title, a.excerpt)}
      <div class="banner" ${bg(a.image)}></div>
      <article class="prose pt56">${a.body.map(block).join('')}</article>
      ${related.length ? `<section class="sec gray-band"><p class="kick">KEEP READING</p><div class="cols mt">${related.map(card).join('')}</div></section>` : ''}</div>`,
  };
}

export default async function journal([slug]) {
  if (slug) return articlePage(slug);
  const list = await api.cached('/articles');
  if (!list.length) {
    return { title: 'Journal', html: `<div class="pg">${head([['Journal']], 'Journal', 'Notes from the studio', 'New stories are on their way.')}</div>` };
  }
  const featured = list.find(a => a.featured) || list[0];
  const cats = ['All', ...new Set(list.map(a => a.category))];
  const gridHtml = cat => {
    const items = cat === 'All' ? list.filter(a => a !== featured) : list.filter(a => a.category === cat);
    return items.map(card).join('') || '<p>No stories in this category yet.</p>';
  };
  return {
    title: 'Journal',
    html: `<div class="pg">${head([['Journal']], 'Journal', 'Notes from the studio', 'Guides, plant stories and projects from the people who build AXIS.')}
      <section class="sec pt0"><a class="split jf" href="/journal/${esc(featured.slug)}"><div class="im" ${bg(featured.image)}></div>
        <div><p class="kick">FEATURED · ${esc(featured.category.toUpperCase())}</p><h2>${esc(featured.title)}</h2>
        <p class="lead my">${esc(featured.excerpt)}</p><span class="link">Read the story</span></div></a></section>
      <section class="sec pt0"><div class="tools mb" id="jcats">${cats.map((c, i) =>
        `<button data-jcat="${esc(c)}" class="${i ? '' : 'on'}" aria-pressed="${!i}">${esc(c)}</button>`).join('')}</div>
        <div class="cols" id="jgrid">${gridHtml('All')}</div></section></div>`,
    mount(root, signal) {
      const grid = root.querySelector('#jgrid');
      root.querySelector('#jcats').addEventListener('click', e => {
        const b = e.target.closest('[data-jcat]');
        if (!b) return;
        root.querySelectorAll('#jcats button').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
        grid.innerHTML = gridHtml(b.dataset.jcat);
      }, { signal });
    },
  };
}
import { api } from '../lib/api.js';
import { esc } from '../lib/dom.js';
import { CARE } from '../content/site.js';
import { head } from '../components/page.js';
import { formModal } from '../ui/modal.js';

function openClinic() {
  formModal({
    title: 'Ask a grower',
    intro: 'A grower will reply within a day. Free for every AXIS customer and community member.',
    submit: 'Send',
    fields: [
      { name: 'name', label: 'Your name', autocomplete: 'name' },
      { name: 'email', label: 'Email', type: 'email', autocomplete: 'email' },
      { name: 'message', label: 'What do you see? Leaves, soil, glass, smell', type: 'textarea' },
    ],
    onSubmit: v => api.post('/clinic', v).then(() =>
      `<h3>Message received</h3><p>A grower will reply to ${esc(v.email)} within a day.</p>`),
  });
}

export default async function care() {
  return {
    title: 'Care guides',
    html: `<div class="pg">${head([['Care guides']], 'Service', 'Care guides', 'Everything your terrarium needs to stay healthy, plus help from our growers when something goes wrong.')}
      <section class="sec pt0"><div class="cols">${CARE.tips.map(([t, d]) =>
        `<div class="card-t tip"><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join('')}</div></section>
      ${CARE.faq.map(([group, qs]) => `<section class="sec pt0"><h2 class="mb12">${esc(group)}</h2>
        ${qs.map(([q, a]) => `<details class="acc"><summary>${esc(q)}</summary><div class="ans">${esc(a)}</div></details>`).join('')}</section>`).join('')}
      <section class="sec gray-band" id="clinic"><div class="split"><div><p class="kick">PLANT CLINIC</p><h2>Something not right?</h2>
        <p class="lead mt">Describe the problem and a grower will reply within a day. Free for every AXIS customer and community member.</p></div>
        <div><button class="btn" data-clinic>Ask a grower</button></div></div></section>
      <section class="sec" id="refill"><div class="split"><div><p class="kick">REFILL AND REPAIR</p><h2>Give it a second life</h2>
        <p class="lead mt">Cracked glass, overgrown plants or ready for a new look? Bring your terrarium to the studio and we will clean, replant and reseal it, usually within a week.</p></div>
        <div><button class="btn o" data-consult>Book a refill</button></div></div></section></div>`,
    mount(root, signal) {
      root.querySelector('[data-clinic]').addEventListener('click', openClinic, { signal });
    },
  };
}
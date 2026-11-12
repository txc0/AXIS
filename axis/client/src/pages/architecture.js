import { api } from '../lib/api.js';
import { esc } from '../lib/dom.js';
import { SERVICES, STEPS } from '../content/site.js';
import { head, band } from '../components/page.js';
import { archArt } from '../components/arch-art.js';

const cta = band('Have a plot in mind?', 'Tell us about your site and we will arrange a first meeting.', '<button class="btn" data-consult>Start a project</button>');

async function projectPage(slug) {
  const p = await api.get(`/projects/${encodeURIComponent(slug)}`);
  return {
    title: p.name,
    html: `<div class="pg">${head([['Architecture', '/architecture'], [p.name]], p.type, p.name, p.summary)}
      <div class="banner">${archArt(p.art, p.bg)}</div>
      <div class="sec pb0"><div class="facts">
        <div><small>LOCATION</small>${esc(p.location)}</div><div><small>YEAR</small>${esc(p.year)}</div>
        <div><small>AREA</small>${esc(p.area)}</div><div><small>STATUS</small>${esc(p.status)}</div></div></div>
      <article class="prose pt48">${p.body.map(x => `<p>${esc(x)}</p>`).join('')}</article>
      <div class="sec split-links"><a class="link" href="/architecture">All projects</a>
        ${p.next.slug !== p.slug ? `<a class="link" href="/architecture/${esc(p.next.slug)}">Next: ${esc(p.next.name)}</a>` : ''}</div>
      ${cta}</div>`,
  };
}

export default async function architecture([slug]) {
  if (slug) return projectPage(slug);
  const projects = await api.cached('/projects');
  return {
    title: 'Architecture',
    html: `<div class="pg">${head([['Architecture']], 'Architecture', 'Buildings that breathe.',
      'The same ideas that keep a terrarium alive, applied at the scale of a home: shade, airflow, water and plants that do the cooling for you.')}
      <div class="banner">${archArt('tower', '#dadde0')}</div>
      <section class="sec" id="services"><p class="kick">WHAT WE DO</p><div class="cols n4 mt">
        ${SERVICES.map(([t, d], i) => `<div class="card-t"><span class="num">0${i + 1}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join('')}</div></section>
      ${projects.length ? `<section class="sec gray-band"><div class="shead"><div><p class="kick">SELECTED PROJECTS</p><h2>Recent work</h2></div></div>
        <div class="cols n2">${projects.map(p => `<a class="proj" href="/architecture/${esc(p.slug)}"><div class="im">${archArt(p.art, p.bg)}</div>
          <p class="cap left">${esc(p.name)}<span>${esc(p.location)} · ${esc(p.type)}</span></p></a>`).join('')}</div></section>` : ''}
      <section class="sec"><p class="kick">HOW WE WORK</p><ol class="steps cols n4 mt">
        ${STEPS.map(([t, d], i) => `<li class="card-t"><span class="num">${i + 1}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join('')}</ol></section>
      ${cta}</div>`,
  };
}
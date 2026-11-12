import { api } from '../lib/api.js';
import { esc, bg } from '../lib/dom.js';
import { STUDIO, ABOUT, CONTACT_TOPICS } from '../content/site.js';
import { head, stat } from '../components/page.js';
import { bindForm, HONEYPOT } from '../ui/modal.js';

const mapsUrl = query => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
const mapsEmbedUrl = (query, key) => `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${encodeURIComponent(query)}`;

export default async function about() {
  const team = await api.cached('/team').catch(() => []);
  const studioMapsUrl = mapsUrl(STUDIO.mapsQuery);
  const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const studioMap = mapsKey
    ? `<iframe src="${esc(mapsEmbedUrl(STUDIO.mapsQuery, mapsKey))}" title="AXIS studio location on Google Maps" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>`
    : `<div class="map-fallback"><strong>View the studio location</strong><p>Configure a Google Maps Embed API key to show the map here.</p><a class="btn" href="${esc(studioMapsUrl)}" target="_blank" rel="noopener noreferrer">Open in Google Maps</a></div>`;
  return {
    title: 'About',
    html: `<div class="pg">${head([['About AXIS']], 'About AXIS', 'Small worlds, made by hand in Dhaka.', ABOUT.intro)}
      <div class="banner" ${bg('hero')}></div>
      <section class="sec"><div class="cols n4">${ABOUT.stats.map(stat).join('')}</div></section>
      <section class="sec gray-band"><p class="kick">WHAT WE BELIEVE</p><div class="cols mt">
        ${ABOUT.values.map(([t, d]) => `<div class="card-t"><h3>${esc(t)}</h3><p>${esc(d)}</p></div>`).join('')}</div></section>
      ${team.length ? `<section class="sec"><p class="kick">THE PEOPLE</p><h2 class="mb">The studio team</h2><div class="cols n4">
        ${team.map(m => `<div class="card-t"><div class="tm" style="background:${esc(m.color || '#5e6b55')}">${m.image ? `<img src="${esc(m.image)}" alt="${esc(m.name)}">` : esc(m.initials)}</div><h3>${esc(m.name)}</h3><p>${esc(m.role)}</p></div>`).join('')}</div></section>` : ''}
      <section class="sec gray-band" id="visit"><div class="split"><div>
        <p class="kick">VISIT THE STUDIO</p><h2>Come and see it grow</h2>
        <p class="lead my">Walk through the growing room, pick plants for your own build or meet the architecture team.</p>
        <p class="lh">${STUDIO.address.map(esc).join('<br>')}<br><br>${STUDIO.hours.map(esc).join('<br>')}</p></div>
        <div class="map">
          ${studioMap}
          <a class="map-link" href="${esc(studioMapsUrl)}" target="_blank" rel="noopener noreferrer">Open in Google Maps</a>
        </div></div></section>
      <section class="sec" id="contact"><div class="split top"><div>
        <p class="kick">CONTACT</p><h2>Write to us</h2>
        <p class="lead mt"><a href="mailto:${esc(STUDIO.email)}">${esc(STUDIO.email)}</a><br><a href="tel:${esc(STUDIO.phone.replace(/\s/g, ''))}">${esc(STUDIO.phone)}</a></p></div>
        <form id="cf" class="f" novalidate>
          <input name="name" placeholder="Your name" aria-label="Your name" autocomplete="name" required>
          <input name="email" type="email" placeholder="Email" aria-label="Email" autocomplete="email" required>
          <select name="topic" aria-label="Topic">${CONTACT_TOPICS.map(t => `<option>${esc(t)}</option>`).join('')}</select>
          <textarea name="message" rows="4" placeholder="Message" aria-label="Message" required></textarea>
          ${HONEYPOT}<div class="err" role="alert"></div><button class="btn">Send message</button></form></div></section></div>`,
    mount(root) {
      const form = root.querySelector('#cf');
      bindForm(form, {
        onSubmit: v => api.post('/contact', v),
        onSuccess: (_, v) => {
          form.innerHTML = `<h3 class="h3">Thank you, ${esc(v.name)}.</h3><p class="lead mt">We will reply within one working day.</p>`;
        },
      });
    },
  };
}
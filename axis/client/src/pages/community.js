import { api } from '../lib/api.js';
import { esc, bg, timeAgo, fmtDate } from '../lib/dom.js';
import { storage } from '../lib/store.js';
import { COMMUNITY } from '../content/site.js';
import { head, stat } from '../components/page.js';
import { formModal } from '../ui/modal.js';
import { toast } from '../ui/toast.js';

const COLORS = ['#5e6b55', '#4e5a63', '#7a6650', '#6b6358'];
const LIKES_KEY = 'axis_likes';

const buildsHtml = builds => {
  const liked = storage.get(LIKES_KEY, {});
  return builds.map(b => {
    const on = !!liked[b.slug];
    return `<div class="jc"><div class="im" ${bg(b.image)}></div><div class="build-meta">
      <div><h3>${esc(b.title)}</h3><p>${esc(b.author)}</p></div>
      <button class="like${on ? ' on' : ''}" data-like="${esc(b.slug)}" aria-pressed="${on}" aria-label="Like ${esc(b.title)}">&#9829; <span>${b.likes}</span></button></div></div>`;
  }).join('');
};

const eventsHtml = events => (events.length ? events.map(e => {
  const open = e.seats_left > 0;
  return `<div class="ev"><div class="dt"><b>${fmtDate(e.starts_at, { day: '2-digit' })}</b><small>${fmtDate(e.starts_at, { month: 'short' }).toUpperCase()}</small></div>
    <div><h3>${esc(e.title)}</h3><p class="ev-details">${esc(e.details)}</p><small class="muted">${open ? `${e.seats_left} seats left` : 'Fully booked'}</small></div>
    <button class="btn${open ? '' : ' o'}" data-rsvp="${esc(e.slug)}" ${open ? '' : 'disabled'}>${open ? 'Reserve a seat' : 'Fully booked'}</button></div>`;
}).join('') : '<p class="muted">New workshops are announced every month. Join the Greenhouse to hear first.</p>');

const threadsHtml = threads => threads.map((t, i) => `
  <div class="thread"><span class="av" style="background:${COLORS[i % COLORS.length]}">${esc(t.initials)}</span>
  <div><span class="thread-title">${esc(t.title)}</span><br><small class="muted">${esc(t.category)} · ${timeAgo(t.posted_at)}</small></div>
  <small class="muted">${t.replies} replies</small></div>`).join('');

export default async function community() {
  const data = await api.get('/community');
  const now = new Date();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59);
  const daysLeft = Math.max(1, Math.ceil((monthEnd - now) / 864e5));
  const ch = COMMUNITY.challenge;
  const stats = [
    [(COMMUNITY.memberBase + data.members).toLocaleString('en-US'), 'members'],
    [COMMUNITY.buildsShared, 'builds shared'],
    [String(data.events.length), 'upcoming events'],
    [COMMUNITY.districts, 'districts'],
  ];

  return {
    title: 'Community',
    html: `<div class="pg">${head([['Community']], 'Community', 'The Greenhouse',
      'Growers, makers and architects sharing what they build. Free to join, with monthly challenges, a plant clinic and workshops at the studio.')}
      <section class="sec pt0"><div class="cols n4">${stats.map(stat).join('')}</div><button class="btn mt32" data-enroll>Join for free</button></section>
      <section class="sec gray-band"><div class="split"><div class="jf"><div class="im" ${bg(ch.image)}></div></div>
        <div><p class="kick">MONTHLY CHALLENGE · ${daysLeft} DAYS LEFT</p><h2>${esc(ch.title)}</h2>
        <p class="lead my">${esc(ch.text)}</p><button class="btn" data-enroll>Enter the challenge</button></div></div></section>
      ${data.builds.length ? `<section class="sec"><div class="shead"><div><p class="kick">FROM THE MEMBERS</p><h2>Recent builds</h2></div></div>
        <div class="cols" id="builds">${buildsHtml(data.builds)}</div></section>` : ''}
      <section class="sec pt0" id="workshops"><p class="kick">AT THE STUDIO</p><h2 class="mb">Workshops and talks</h2><div id="evs">${eventsHtml(data.events)}</div></section>
      ${data.threads.length ? `<section class="sec pt0"><p class="kick">DISCUSSIONS</p><h2 class="mb">Latest from the forum</h2>${threadsHtml(data.threads)}</section>` : ''}</div>`,

    mount(root, signal) {
      let events = data.events;

      const setLike = (btn, on, n) => {
        btn.classList.toggle('on', on);
        btn.setAttribute('aria-pressed', on);
        btn.querySelector('span').textContent = n;
      };

      async function toggleLike(btn) {
        const slug = btn.dataset.like;
        const liked = storage.get(LIKES_KEY, {});
        const next = !liked[slug];
        const prev = Number(btn.querySelector('span').textContent);
        btn.disabled = true;
        setLike(btn, next, prev + (next ? 1 : -1)); // optimistic update
        try {
          const res = await api.post(`/builds/${encodeURIComponent(slug)}/like`, { liked: next });
          if (next) liked[slug] = true; else delete liked[slug];
          storage.set(LIKES_KEY, liked);
          setLike(btn, next, res.likes);
        } catch (err) {
          setLike(btn, !next, prev);
          toast(err.message);
        } finally {
          btn.disabled = false;
        }
      }

      function book(slug) {
        const ev = events.find(x => x.slug === slug);
        if (!ev) return;
        const when = fmtDate(ev.starts_at, { weekday: 'short', day: 'numeric', month: 'short' });
        const seats = [1, 2, 3].filter(n => n <= ev.seats_left).map(n => ({ value: n, label: `${n} seat${n > 1 ? 's' : ''}` }));
        formModal({
          title: ev.title,
          intro: esc(`${when} · ${ev.details}`),
          submit: 'Confirm booking',
          fields: [
            { name: 'name', label: 'Your name', autocomplete: 'name' },
            { name: 'phone', label: 'Phone', type: 'tel', autocomplete: 'tel' },
            { name: 'seats', label: 'Seats', type: 'select', options: seats },
          ],
          onSubmit: async v => {
            await api.post(`/events/${encodeURIComponent(slug)}/rsvp`, v);
            events = await api.get('/events');
            if (!signal.aborted) root.querySelector('#evs').innerHTML = eventsHtml(events);
            return `<h3>You are booked in</h3><p>${esc(v.seats)} seat(s) for ${esc(ev.title)} on ${esc(when)}. We will send a reminder to ${esc(v.phone)}.</p>`;
          },
        });
      }

      root.addEventListener('click', e => {
        const like = e.target.closest('[data-like]');
        const rsvp = e.target.closest('[data-rsvp]');
        if (like) toggleLike(like);
        else if (rsvp) book(rsvp.dataset.rsvp);
      }, { signal });
    },
  };
}
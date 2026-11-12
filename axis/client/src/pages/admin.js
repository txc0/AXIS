// Studio admin: orders, bookings and messages. Sign in with ADMIN_TOKEN from the server's .env.
import { api } from '../lib/api.js';
import { esc, fmt } from '../lib/dom.js';
import { bindForm } from '../ui/modal.js';
import { toast } from '../ui/toast.js';

const KEY = 'axis_admin_token';
const ORDER_STATUS = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const TABS = [
  { id: 'content', label: 'Website content' },
  { id: 'orders', label: 'Orders', url: '/admin/orders' },
  { id: 'rsvps', label: 'Event bookings', url: '/admin/rsvps' },
  { id: 'consultation', label: 'Consultations', url: '/admin/submissions?type=consultation' },
  { id: 'contact', label: 'Messages', url: '/admin/submissions?type=contact' },
  { id: 'clinic', label: 'Plant clinic', url: '/admin/submissions?type=clinic' },
  { id: 'members', label: 'Members', url: '/admin/members' },
  { id: 'subscribers', label: 'Newsletter', url: '/admin/subscribers' },
];
const CONTENT_COLLECTIONS = ['products', 'projects', 'articles', 'events', 'team', 'builds', 'threads'];

const when = iso => (iso ? new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
const table = (cols, rows) => (rows.length
  ? `<div class="tbl"><table><thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>
     <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
  : '<p class="muted">Nothing here yet.</p>');

const submissions = rows => table(['From', 'Message', 'Received', 'Status'], rows.map(s => [
  `${esc(s.data.name)}<br><small>${esc(s.data.email || s.data.contact || '')}</small>`,
  `${s.data.topic ? `<b>${esc(s.data.topic)}</b><br>` : ''}${esc(s.data.message)}`,
  when(s.created_at),
  `<button class="sm" data-sub="${s.id}" data-next="${s.status === 'done' ? 'new' : 'done'}">${s.status === 'done' ? 'Done ✓' : 'Mark done'}</button>`,
]));

const CONTENT_FIELDS = {
  products: [
    ['slug', 'URL name', 'text', true], ['name', 'Name', 'text', true], ['price', 'Price (BDT)', 'number', true],
    ['image', 'Image', 'text', true], ['category', 'Category', 'select', true, ['plants', 'ready', 'custom']],
    ['description', 'Description', 'textarea', true], ['active', 'Visible on website', 'checkbox'],
  ],
  projects: [
    ['slug', 'URL name', 'text', true], ['name', 'Name', 'text', true], ['location', 'Location', 'text'],
    ['year', 'Year', 'text'], ['type', 'Type', 'text'], ['area', 'Area', 'text'], ['status', 'Status', 'text'],
    ['art', 'Illustration', 'select', true, ['court', 'tower', 'pav', 'roof']], ['bg', 'Background colour', 'color'],
    ['summary', 'Summary', 'textarea'], ['body', 'Story paragraphs', 'textarea'], ['active', 'Visible on website', 'checkbox'],
  ],
  articles: [
    ['slug', 'URL name', 'text', true], ['title', 'Title', 'text', true], ['category', 'Category', 'text', true],
    ['published_at', 'Publication date', 'date', true], ['minutes', 'Reading time (minutes)', 'number'],
    ['image', 'Image', 'text'], ['excerpt', 'Short introduction', 'textarea'], ['body', 'Article paragraphs', 'textarea'],
    ['featured', 'Featured article', 'checkbox'], ['active', 'Visible on website', 'checkbox'],
  ],
  events: [
    ['slug', 'URL name', 'text', true], ['starts_at', 'Start date and time', 'datetime-local', true],
    ['title', 'Title', 'text', true], ['details', 'Details', 'textarea'], ['seats', 'Available seats', 'number', true],
    ['active', 'Visible on website', 'checkbox'],
  ],
  team: [
    ['slug', 'URL name', 'text', true], ['name', 'Name', 'text', true], ['role', 'Role', 'text'],
    ['initials', 'Initials', 'text'], ['color', 'Colour', 'color'], ['image', 'Profile image', 'text'], ['sort', 'Display order', 'number'],
    ['active', 'Visible on website', 'checkbox'],
  ],
  builds: [
    ['slug', 'URL name', 'text', true], ['image', 'Image', 'text'], ['author', 'Author', 'text'],
    ['title', 'Title', 'text', true], ['likes', 'Starting likes', 'number'], ['sort', 'Display order', 'number'],
    ['active', 'Visible on website', 'checkbox'],
  ],
  threads: [
    ['slug', 'URL name', 'text', true], ['initials', 'Initials', 'text'], ['title', 'Title', 'text', true],
    ['category', 'Category', 'text'], ['replies', 'Replies', 'number'], ['posted_at', 'Posted date and time', 'datetime-local'],
    ['active', 'Visible on website', 'checkbox'],
  ],
};

const fieldValue = (field, value) => {
  if (value === undefined || value === null) return '';
  if (field[2] === 'checkbox') return Boolean(value);
  if (field[2] === 'textarea' && Array.isArray(value)) return value.join('\n\n');
  if (field[2] === 'datetime-local' && value) {
    return new Date(value).toLocaleString('sv-SE', { timeZone: 'Asia/Dhaka', hour12: false }).replace(' ', 'T').slice(0, 16);
  }
  return value;
};

const contentForm = (collection, item = {}) => `
  <form class="content-form" data-content-form data-content-key="${esc(item.slug || '')}">
    <div class="shead"><div><p class="kick">${item.slug ? 'EDIT ITEM' : 'NEW ITEM'}</p><h3>${esc(item.name || item.title || 'Website content')}</h3></div>
      <div class="tools"><button type="button" class="o" data-content-cancel>Cancel</button><button class="btn">Save changes</button></div></div>
    <div class="content-fields">${(CONTENT_FIELDS[collection] || []).map(field => {
      const [name, label, type, required, options] = field;
      const value = fieldValue(field, item[name]);
      if (type === 'checkbox') return `<label class="check"><input name="${name}" type="checkbox"${value ? ' checked' : ''}> ${esc(label)}</label>`;
      if (type === 'textarea') return `<label>${esc(label)}<textarea name="${name}" rows="5"${required ? ' required' : ''}>${esc(value)}</textarea></label>`;
      if (type === 'select') return `<label>${esc(label)}<select name="${name}"${required ? ' required' : ''}>${options.map(option => `<option value="${esc(option)}"${value === option ? ' selected' : ''}>${esc(option)}</option>`).join('')}</select></label>`;
      return `<label>${esc(label)}<input name="${name}" type="${type}" value="${esc(value)}"${required ? ' required' : ''}></label>`;
    }).join('')}
      ${CONTENT_FIELDS[collection].some(field => field[0] === 'image') ? '<label>Upload a new image<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" data-content-form-upload></label>' : ''}
    </div>
  </form>`;

const contentList = (rows, collection) => rows.length
  ? `<div class="content-list">${rows.map(row => {
    const key = row.slug || '';
    const title = row.name || row.title || row.slug || 'Untitled';
    return `<article class="card-t content-row"><div><h3>${esc(title)}</h3><p class="muted">${esc(key)}${row.active === 0 ? ' · hidden' : ''}</p></div>
      <div class="tools"><button data-content-edit="${esc(key)}">Edit</button><button class="o" data-content-delete="${esc(key)}">Delete</button></div></article>`;
  }).join('')}</div>`
  : '<p class="muted">Nothing here yet.</p>';

const contentView = (rows, collection) => `
  <div class="shead"><div><p class="kick">EDITABLE CONTENT</p><p class="muted">Changes are live after saving. Deleted items are hidden, not permanently removed.</p></div>
    <div class="tools"><select data-content-collection aria-label="Content collection">${CONTENT_COLLECTIONS.map(name => `<option${name === collection ? ' selected' : ''}>${name}</option>`).join('')}</select>
    <button data-new-content>New item</button></div></div>
  <div class="content-form-host"></div>
  ${contentList(rows, collection)}`;

const VIEWS = {
  orders: rows => table(['Order', 'Customer', 'Items', 'Total', 'Placed', 'Status'], rows.map(o => [
    `<b>${esc(o.code)}</b><br><small>${esc(o.payment)}</small>`,
    `${esc(o.name)}<br><small>${esc(o.phone)}<br>${esc(o.address)}</small>`,
    o.items.map(i => esc(i.name)).join('<br>'),
    fmt(o.total),
    when(o.created_at),
    `<select data-order="${o.id}" aria-label="Status for ${esc(o.code)}">${ORDER_STATUS.map(s => `<option${s === o.status ? ' selected' : ''}>${s}</option>`).join('')}</select>`,
  ])),
  rsvps: rows => table(['Event', 'Name', 'Phone', 'Seats', 'Booked'], rows.map(r => [
    `${esc(r.event)}<br><small>${when(r.starts_at)}</small>`, esc(r.name), esc(r.phone), r.seats, when(r.created_at),
  ])),
  consultation: submissions,
  contact: submissions,
  clinic: submissions,
  members: rows => table(['Name', 'Email', 'Joined'], rows.map(m => [esc(m.name), esc(m.email), when(m.created_at)])),
  subscribers: rows => table(['Email', 'Subscribed'], rows.map(s => [esc(s.email), when(s.created_at)])),
};

export default async function admin() {
  return {
    title: 'Admin',
    html: '<div class="pg admin" id="admin"></div>',
    mount(root, signal) {
      const el = root.querySelector('#admin');
      const auth = () => ({ Authorization: `Bearer ${sessionStorage.getItem(KEY)}` });
      let tab = 'orders';
      let collection = 'products';
      let contentRows = [];

      function login(message = '') {
        el.innerHTML = `<section class="pg-head"><p class="kick">STUDIO ADMIN</p><h1>Sign in</h1>
          <form class="f narrow" novalidate><input name="token" type="password" placeholder="Admin token" aria-label="Admin token" autocomplete="current-password" required>
          <div class="err" role="alert">${esc(message)}</div><button class="btn">Sign in</button></form></section>`;
        bindForm(el.querySelector('form'), {
          onSubmit: async v => { await api.get('/admin/summary', { Authorization: `Bearer ${v.token}` }); return v.token; },
          onSuccess: token => { sessionStorage.setItem(KEY, token); show(); },
        });
      }

      async function show() {
        if (!sessionStorage.getItem(KEY)) return login();
        el.innerHTML = '<section class="sec"><p class="muted">Loading…</p></section>';
        try {
          const current = TABS.find(t => t.id === tab);
          const [summary, rows] = await Promise.all([
            api.get('/admin/summary', auth()),
            api.get(tab === 'content' ? `/admin/content/${collection}` : current.url, auth()),
          ]);
          if (signal.aborted) return;
          if (tab === 'content') contentRows = rows;
          el.innerHTML = `<section class="sec">
            <div class="shead"><div><p class="kick">STUDIO ADMIN</p><h2>${esc(current.label)}</h2></div>
              <div class="tools"><button data-refresh>Refresh</button><button data-logout>Sign out</button></div></div>
            <div class="tools admin-tabs mb">${TABS.map(t => `<button data-tab="${t.id}" class="${t.id === tab ? 'on' : ''}">${esc(t.label)}${summary[t.id] ? ` <span class="badge">${summary[t.id]}</span>` : ''}</button>`).join('')}</div>
            ${tab === 'content' ? contentView(rows, collection) : VIEWS[tab](rows)}</section>`;
        } catch (err) {
          if (err.status === 401) { sessionStorage.removeItem(KEY); return login('Please sign in again.'); }
          el.innerHTML = `<section class="sec"><p class="err">${esc(err.message)}</p><button class="btn o" data-refresh>Try again</button></section>`;
        }
      }

      el.addEventListener('click', async e => {
        const b = e.target.closest('[data-tab], [data-refresh], [data-logout], [data-sub], [data-new-content], [data-content-edit], [data-content-cancel], [data-content-delete]');
        if (!b) return;
        if (b.dataset.tab) { tab = b.dataset.tab; show(); }
        else if ('newContent' in b.dataset) {
          el.querySelector('.content-form-host').innerHTML = contentForm(collection);
          el.querySelector('.content-form-host').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        else if ('contentEdit' in b.dataset) {
          const current = contentRows.find(candidate => candidate.slug === b.dataset.contentEdit);
          if (current) {
            el.querySelector('.content-form-host').innerHTML = contentForm(collection, current);
            el.querySelector('.content-form-host').scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
        else if ('contentCancel' in b.dataset) {
          el.querySelector('.content-form-host').innerHTML = '';
        }
        else if ('refresh' in b.dataset) show();
        else if ('logout' in b.dataset) { sessionStorage.removeItem(KEY); login(); }
        else if (b.dataset.sub) {
          try { await api.patch(`/admin/submissions/${b.dataset.sub}`, { status: b.dataset.next }, auth()); show(); }
          catch (err) { toast(err.message); }
        }
        else if ('contentDelete' in b.dataset) {
          if (!confirm('Hide this content item from the website?')) return;
          try { await api.delete(`/admin/content/${collection}/${encodeURIComponent(b.dataset.contentDelete)}`, auth()); toast('Content hidden'); show(); }
          catch (err) { toast(err.message); }
        }
      }, { signal });

      el.addEventListener('submit', async e => {
        const form = e.target.closest('[data-content-form]');
        if (!form) return;
        e.preventDefault();
        const data = {};
        for (const field of CONTENT_FIELDS[collection] || []) {
          const [name, , type] = field;
          const input = form.elements[name];
          if (!input) continue;
          if (type === 'checkbox') data[name] = input.checked;
          else if (type === 'number') data[name] = input.value === '' ? 0 : Number(input.value);
          else if (type === 'textarea' && name === 'body') data[name] = input.value.split(/\n\s*\n/).map(value => value.trim()).filter(Boolean);
          else if (type === 'datetime-local') data[name] = `${input.value}:00+06:00`;
          else data[name] = input.value.trim();
        }
        try {
          const key = form.dataset.contentKey;
          if (key) await api.patch(`/admin/content/${collection}/${encodeURIComponent(key)}`, { data }, auth());
          else await api.post(`/admin/content/${collection}`, { data }, auth());
          toast('Content saved');
          show();
        } catch (err) { toast(err.message); }
      }, { signal });

      el.addEventListener('change', async e => {
        const sel = e.target.closest('[data-order]');
        if (sel) {
          try { await api.patch(`/admin/orders/${sel.dataset.order}`, { status: sel.value }, auth()); toast('Order updated'); }
          catch (err) { toast(err.message); show(); }
          return;
        }
        const collectionSelect = e.target.closest('[data-content-collection]');
        if (collectionSelect) { collection = collectionSelect.value; show(); return; }
        const upload = e.target.closest('[data-content-form-upload]');
        if (!upload?.files[0]) return;
        const file = upload.files[0];
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const result = await api.post('/admin/uploads', { data: reader.result }, auth());
            const image = el.querySelector('[data-content-form] input[name="image"]');
            if (image) image.value = result.url;
            toast('Image uploaded. Save the item to apply it.');
          } catch (err) { toast(err.message); }
        };
        reader.readAsDataURL(file);
      }, { signal });

      show();
    },
  };
}
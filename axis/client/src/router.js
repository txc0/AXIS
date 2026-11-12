// Tiny client-side router. To add a page: add a line to `routes` and a file in src/pages/.
import { $ } from './lib/dom.js';
import { shopFilter } from './lib/store.js';

const routes = [
  { name: 'home', re: /^\/$/, load: () => import('./pages/home.js') },
  { name: 'architecture', re: /^\/architecture(?:\/([\w-]+))?\/?$/, load: () => import('./pages/architecture.js') },
  { name: 'journal', re: /^\/journal(?:\/([\w-]+))?\/?$/, load: () => import('./pages/journal.js') },
  { name: 'community', re: /^\/community\/?$/, load: () => import('./pages/community.js') },
  { name: 'about', re: /^\/about\/?$/, load: () => import('./pages/about.js') },
  { name: 'care', re: /^\/care\/?$/, load: () => import('./pages/care.js') },
  { name: 'admin', re: /^\/admin\/?$/, load: () => import('./pages/admin.js') },
];

const DEFAULT_TITLE = document.title;
let current = { path: null, ctrl: null, cleanup: null };
let first = true;

function scrollToHash(hash) {
  const el = hash && hash.length > 1 && document.getElementById(decodeURIComponent(hash.slice(1)));
  if (el) requestAnimationFrame(() => el.scrollIntoView());
  return !!el;
}

export async function navigate(href, { replace = false } = {}) {
  const url = new URL(href, location.href);
  const samePage = url.pathname === location.pathname && current.path === url.pathname;
  history[replace ? 'replaceState' : 'pushState'](null, '', url);
  if (samePage) {
    if (!scrollToHash(url.hash)) window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  await render();
}

export async function render() {
  const { pathname, hash } = location;
  const route = routes.find(r => r.re.test(pathname));

  // Tear down the previous page (removes its event listeners, stops 3D, etc.)
  current.ctrl?.abort();
  try { current.cleanup?.(); } catch (err) { console.error(err); }
  const ctrl = new AbortController();
  current = { path: pathname, ctrl, cleanup: null };

  $('#nav').classList.remove('o');
  $('#mb').setAttribute('aria-expanded', 'false');
  document.body.dataset.page = route?.name || 'notfound';
  document.querySelectorAll('.nav > li > a').forEach(a => {
    const p = new URL(a.href).pathname;
    a.classList.toggle('cur', p !== '/' && pathname.startsWith(p));
  });

  const app = $('#app');
  app.setAttribute('aria-busy', 'true');
  let page;
  try {
    const mod = await (route ? route.load() : import('./pages/notfound.js'));
    page = await mod.default(route ? pathname.match(route.re).slice(1) : []);
  } catch (err) {
    const mod = await import('./pages/notfound.js');
    page = err.status === 404 ? await mod.default() : mod.errorPage(err);
  }
  if (ctrl.signal.aborted) return;

  document.title = page.title ? `${page.title} | AXIS` : DEFAULT_TITLE;
  app.innerHTML = page.html;
  app.removeAttribute('aria-busy');
  current.cleanup = page.mount?.(app, ctrl.signal) || null;
  if (!first) app.focus({ preventScroll: true });
  first = false;
  if (!scrollToHash(hash)) window.scrollTo(0, 0);
}

// Turns normal <a href="/..."> clicks into client-side navigation.
export function handleLinkClick(e) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest('a[href]');
  if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
  const url = new URL(a.href);
  if (url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  e.preventDefault();
  const d = a.dataset;
  if ('cat' in d || 'q' in d || 'sort' in d) {
    Object.assign(shopFilter, { cat: d.cat || 'all', q: d.q || '', sort: d.sort || '' });
    window.dispatchEvent(new Event('shop:filter'));
  }
  navigate(url.href);
}

export function startRouter() {
  addEventListener('popstate', () => {
    if (location.pathname === current.path) {
      if (!scrollToHash(location.hash)) window.scrollTo(0, 0);
      return;
    }
    render();
  });
  return render();
}
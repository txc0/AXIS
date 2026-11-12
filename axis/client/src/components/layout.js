// Everything that lives outside the page area: header buttons, newsletter, footer, global actions.
import { $ } from '../lib/dom.js';
import { api } from '../lib/api.js';
import { cart } from '../lib/store.js';
import { navigate, handleLinkClick } from '../router.js';
import { formModal, bindForm } from '../ui/modal.js';
import { openCart, openOrders } from '../ui/cart.js';

export function openConsultation() {
  formModal({
    title: 'Book a consultation',
    submit: 'Request a call',
    fields: [
      { name: 'name', label: 'Your name', autocomplete: 'name' },
      { name: 'contact', label: 'Phone or email' },
      { name: 'message', label: 'Tell us about your space, light or project', type: 'textarea', rows: 3 },
    ],
    onSubmit: v => api.post('/consultations', v).then(() =>
      '<h3>Request received</h3><p>Thank you. A designer will be in touch within a day.</p>'),
  });
}

export function openJoin() {
  formModal({
    title: 'Join the Greenhouse',
    intro: 'Free programmes, monthly build challenges and the plant clinic.',
    submit: 'Join for free',
    fields: [
      { name: 'name', label: 'Your name', autocomplete: 'name' },
      { name: 'email', label: 'Email', type: 'email', autocomplete: 'email' },
    ],
    onSubmit: v => api.post('/members', v).then(() =>
      '<h3>Welcome to the Greenhouse</h3><p>You are in. We will email your first challenge.</p>'),
  });
}

export function initLayout() {
  const updateCount = () => { $('#cn').textContent = cart.items().length; };
  cart.onChange(updateCount);
  updateCount();
  $('#yr').textContent = new Date().getFullYear();

  // One click listener for the whole site: actions first, then link navigation.
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-consult], [data-enroll], [data-orders], #bCart, #bSearch, #mb, #up');
    if (!t) return handleLinkClick(e);
    e.preventDefault();
    if ('consult' in t.dataset) openConsultation();
    else if ('enroll' in t.dataset) openJoin();
    else if ('orders' in t.dataset) openOrders();
    else if (t.id === 'bCart') openCart();
    else if (t.id === 'bSearch') navigate('/#shop').then(() => setTimeout(() => $('#q')?.focus(), 400));
    else if (t.id === 'mb') t.setAttribute('aria-expanded', $('#nav').classList.toggle('o'));
    else if (t.id === 'up') window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  const nf = $('#nf');
  bindForm(nf, {
    errorEl: $('#nm'),
    onSubmit: v => api.post('/subscribe', v),
    onSuccess: () => { nf.reset(); $('#nm').textContent = 'Welcome to AXIS. New worlds are on their way.'; },
  });
}
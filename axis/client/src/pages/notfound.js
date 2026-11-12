import { esc } from '../lib/dom.js';

export default async function notFound() {
  return {
    title: 'Page not found',
    html: `<section class="pg-head"><p class="kick">404</p><h1>This page has not grown yet.</h1>
      <p class="lead">The link may be old, or the page may have moved.</p>
      <p class="mt32"><a class="btn" href="/">Back to home</a></p></section>`,
  };
}

export function errorPage(err) {
  return {
    title: 'Something went wrong',
    html: `<section class="pg-head"><p class="kick">ERROR</p><h1>We could not load this page.</h1>
      <p class="lead">${esc(err.message)} Refresh the page to try again.</p>
      <p class="mt32"><a class="btn" href="/">Back to home</a></p></section>`,
  };
}
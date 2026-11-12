// Small HTML helpers shared by the inner pages.
import { esc } from '../lib/dom.js';

export const crumb = items =>
  `<p class="crumb"><a href="/">Home</a>${items.map(([t, h]) => ' / ' + (h ? `<a href="${esc(h)}">${esc(t)}</a>` : esc(t))).join('')}</p>`;

export const head = (items, kick, title, lead) =>
  `<header class="pg-head">${crumb(items)}<p class="kick">${esc(String(kick).toUpperCase())}</p><h1>${esc(title)}</h1>${lead ? `<p class="lead">${esc(lead)}</p>` : ''}</header>`;

export const band = (title, text, action) =>
  `<section class="band"><div><h2>${esc(title)}</h2><p>${esc(text)}</p></div>${action}</section>`;

export const stat = ([n, label]) =>
  `<div><span class="num">${esc(n)}</span><p class="kick mt6">${esc(String(label).toUpperCase())}</p></div>`;
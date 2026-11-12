import { api } from '../lib/api.js';
import { esc, bg } from '../lib/dom.js';
import { DISCOVER, SERVICES, STEPS } from '../content/site.js';
import { shopHtml, mountShop } from '../components/shop.js';
import { builderHtml, mountBuilder } from '../components/builder.js';
import { initStory } from '../three/story.js';

const storyHtml = `
  <section id="story">
    <div class="stage">
      <canvas id="scene"></canvas>
      <div class="panel"><p class="kicker">AXIS</p><h1>Living architecture, at every scale.</h1><p>Terrariums, gardens and buildings that make room for life.</p></div>
      <div class="panel"><p class="kicker">SMALL WORLDS</p><h2>Start with a world in glass.</h2><p>Closed forests, desert bowls and tiny landscapes made by hand in Dhaka.</p></div>
      <div class="panel"><p class="kicker">BIG IDEAS</p><h2>Then let it grow.</h2><p>Homes, roofs and interiors designed around the living things inside them.</p></div>
      <div class="panel"><p class="kicker">COME IN</p><h2>Find your place to begin.</h2><p><a class="btn" href="#shop">Explore the shop</a></p></div>
      <div class="dots"></div>
      <div class="hint">SCROLL TO EXPLORE</div>
    </div>
  </section>`;

export default async function home() {
  const [{ products, builder }, articles] = await Promise.all([
    api.cached('/catalog'),
    api.cached('/articles'),
  ]);
  const journal = articles.slice(0, 2);

  return {
    html: `${storyHtml}
      <section class="discover"><div class="discover-head"><h3>Discover our worlds</h3></div>
        <div class="row">${DISCOVER.map(([label, category, image]) =>
          `<a class="tile" ${bg(image)} href="/#shop" data-cat="${esc(category)}"><span>${esc(label)}</span></a>`).join('')}</div>
      </section>
      <section class="sec"><p class="kick">WHAT WE DO</p><h2 class="mb">A studio for living things</h2>
        <div class="cols n4">${SERVICES.map(([title, text]) =>
          `<div class="card-t"><h3>${esc(title)}</h3><p>${esc(text)}</p></div>`).join('')}</div>
      </section>
      ${shopHtml()}${builderHtml()}
      <section class="stories"><div><p class="kick">FROM THE JOURNAL</p><h2>Notes from the studio</h2></div>
        ${journal.map(article => `<a href="/journal/${encodeURIComponent(article.slug)}">
          <div class="ph" ${bg(article.image)}></div><p class="cap left">${esc(article.title)}<span>${esc(article.category)}</span></p>
        </a>`).join('')}
      </section>
      <section class="sec gray-band"><p class="kick">HOW IT WORKS</p><div class="cols n4">
        ${STEPS.map(([title, text], i) => `<div class="card-t"><p class="num">0${i + 1}</p><h3>${esc(title)}</h3><p>${esc(text)}</p></div>`).join('')}
      </div></section>`,
    mount(root, signal) {
      const story = root.querySelector('#story');
      let cleanupStory = () => {};
      try {
        cleanupStory = initStory(story);
      } catch {
        story.classList.add('static');
      }
      mountShop(root, products, signal);
      mountBuilder(root, builder, signal);
      return () => cleanupStory();
    },
  };
}

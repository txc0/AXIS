// Draws the builder preview as SVG. Add a drawing here when you add a new vessel or plant key.
const SHAPES = {
  jar: 'M80 70H220Q236 70 236 90V240Q236 262 214 262H86Q64 262 64 240V90Q64 70 80 70Z',
  dome: 'M58 262V160A92 92 0 0 1 242 160V262Z',
  cube: 'M62 84H238V262H62Z',
  globe: 'M150 40C210 100 240 150 240 200A90 70 0 0 1 60 200C60 150 90 100 150 40Z',
};

const PLANTS = {
  fern: (x, y) => `<g transform="translate(${x},${y})" stroke="#5fae5a" stroke-width="3" fill="none" stroke-linecap="round"><path d="M0 0Q-22-30-34-22M0 0Q-10-46-16-52M0 0Q4-50 10-56M0 0Q18-34 32-26"/></g>`,
  succ: (x, y) => `<g transform="translate(${x},${y})" fill="#7fb28a"><ellipse cx="0" cy="-10" rx="7" ry="16" transform="rotate(-35 0 -10)"/><ellipse cx="0" cy="-10" rx="7" ry="16" transform="rotate(35 0 -10)"/><ellipse cx="0" cy="-14" rx="7" ry="18" fill="#97c9a0"/></g>`,
  mush: (x, y) => `<g transform="translate(${x},${y})"><rect x="-3" y="-18" width="6" height="18" fill="#e8dcc0"/><path d="M-14-16Q0-36 14-16Z" fill="#c4583a"/></g>`,
  grass: (x, y) => `<g transform="translate(${x},${y})" stroke="#c9b96a" stroke-width="2.5" fill="none" stroke-linecap="round"><path d="M0 0Q-6-30-22-44M0 0Q0-36 2-52M0 0Q8-30 24-42"/></g>`,
};
const genericPlant = (x, y) => `<g transform="translate(${x},${y})"><rect x="-2" y="-8" width="4" height="8" fill="#4f7a34"/><circle cy="-16" r="11" fill="#6f9e63"/></g>`;

export function terrariumSvg(state, land = {}) {
  const shape = SHAPES[state.vessel] || SHAPES.jar;
  const [soil, top] = land.colors || ['#3a2a1e', '#2f5a34'];
  const b = 210;
  let ground = `<rect x="40" y="${b + 14}" width="220" height="80" fill="${soil}"/><path d="M40 ${b + 14}Q100 ${b - 8} 150 ${b + 6}T260 ${b + 4}V${b + 22}H40Z" fill="${top}"/>`;
  if (land.pattern === 'raked') ground += '<g stroke="#bdb8a8" fill="none"><path d="M70 238Q150 228 230 238M70 248Q150 238 230 248"/></g>';
  let items = [...state.plants].slice(0, 3).map((k, i) => (PLANTS[k] || genericPlant)([105, 150, 195][i], b + 4)).join('');
  if (state.accents.has('stone')) items += `<ellipse cx="78" cy="${b + 12}" rx="16" ry="9" fill="#7d8078"/>`;
  if (state.accents.has('wood')) items += `<path d="M200 ${b + 10}Q215 ${b - 30} 228 ${b - 34}" stroke="#7a5a3a" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  const glow = state.accents.has('led') ? '<circle cx="150" cy="170" r="130" fill="url(#gg)"/>' : '';
  return `<svg viewBox="0 0 300 300" role="img" aria-label="Preview of your terrarium">
    <defs><radialGradient id="gg"><stop offset="0" stop-color="#ffc55a" stop-opacity=".6"/><stop offset="1" stop-color="#ffc55a" stop-opacity="0"/></radialGradient><clipPath id="cc"><path d="${shape}"/></clipPath></defs>
    ${glow}<ellipse cx="150" cy="278" rx="100" ry="8" fill="#000" opacity=".12"/>
    <g clip-path="url(#cc)"><rect x="40" y="30" width="220" height="240" fill="#cfe5dc" opacity=".3"/>${ground}${items}</g>
    <path d="${shape}" fill="#fff" fill-opacity=".2" stroke="#6f8a7a" stroke-width="3"/></svg>`;
}
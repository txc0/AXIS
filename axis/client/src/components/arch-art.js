// Line drawings for architecture projects. Add a new key here to give a project its own art.
import { esc } from '../lib/dom.js';

const W = '#f4f3ef', G = '#5e6b55', G2 = '#7a8a6e', GL = '#cfd8d2';
const st = 'stroke="#1a1a1a" stroke-width="1.2"';

const ART = {
  court: () => `<rect x="60" y="146" width="280" height="12" fill="${G}"/>${[90, 130, 170, 210, 250, 290, 320].map(x => `<circle cx="${x}" cy="144" r="7" fill="${G2}"/>`).join('')}<rect x="70" y="158" width="260" height="94" fill="${W}" ${st}/><rect x="92" y="182" width="44" height="70" fill="${GL}" ${st}/><rect x="156" y="178" width="96" height="44" fill="${GL}" ${st}/><path d="M188 178V222M220 178V222" ${st}/><rect x="272" y="182" width="38" height="40" fill="${GL}" ${st}/><path d="M362 252V206" ${st}/><circle cx="362" cy="194" r="24" fill="${G}"/>`,
  tower: () => {
    let g = `<rect x="150" y="46" width="110" height="206" fill="${W}" ${st}/>`;
    for (let i = 0; i < 6; i++) {
      const y = 60 + i * 32;
      g += `<rect x="166" y="${y}" width="78" height="18" fill="${GL}" ${st}/><path d="M138 ${y + 24}H272" ${st}/><ellipse cx="${150 + (i * 37) % 90}" cy="${y + 20}" rx="16" ry="6" fill="${i % 2 ? G : G2}"/>`;
    }
    return g + `<rect x="146" y="38" width="118" height="8" fill="${G}"/>`;
  },
  pav: () => `<rect x="0" y="252" width="400" height="48" fill="#b9c4c6"/><path d="M40 272H120M200 284H300M280 266H360" stroke="#fff" stroke-width="1.5"/><rect x="60" y="108" width="280" height="10" fill="${G}"/><rect x="66" y="118" width="268" height="10" fill="${W}" ${st}/>${[86, 150, 250, 314].map(x => `<rect x="${x}" y="128" width="6" height="124" fill="${W}" ${st}/>`).join('')}<rect x="118" y="150" width="164" height="102" fill="${GL}" fill-opacity=".6" ${st}/><path d="M172 150V252M228 150V252" ${st}/>`,
  roof: () => {
    let g = `<rect x="60" y="132" width="280" height="120" fill="${W}" ${st}/>`;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) g += `<rect x="${78 + c * 52}" y="${148 + r * 34}" width="36" height="20" fill="${GL}" ${st}/>`;
    g += `<path d="M100 132V96M160 132V96M220 132V96M280 132V96M92 96H300" ${st}/>`;
    return g + [80, 112, 140, 196, 250, 300, 322].map((x, i) => `<circle cx="${x}" cy="${124 - (i % 2) * 4}" r="${9 + (i % 3) * 2}" fill="${i % 2 ? G2 : G}"/>`).join('');
  },
};

export function archArt(key, bg = '#e2e2e0') {
  const art = ART[key] ? ART[key]() : '';
  return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="400" height="300" fill="${esc(bg)}"/>${art}<path d="M0 252H400" ${st}/></svg>`;
}
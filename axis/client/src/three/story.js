// The 3D scroll story on the home page. Loaded on demand, so the shop works even if this fails.
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
const PI = Math.PI; // three.js uses physical light units, so classic intensities are scaled by π

// Camera keyframes, one per text panel
const KEYS = [
  { c: [0, 2.4, 6], l: [-0.5, 0.55, 0], bg: 0xe9e7e2, hemi: 0.75, sun: 0.9 },
  { c: [-0.9, 1.35, 2.3], l: [-0.65, 0.75, 0], bg: 0xdce2d4, hemi: 0.8, sun: 0.85 },
  { c: [1.9, 1.55, 2.5], l: [0.6, 0.6, 0], bg: 0xdadde0, hemi: 0.75, sun: 0.9 },
  { c: [0, 3, 5.2], l: [0, 0.6, 0], bg: 0x1c221d, hemi: 0.12, sun: 0.05 },
];

export function initStory(section) {
  const canvas = section.querySelector('#scene');
  const stage = section.querySelector('.stage');
  const panels = [...section.querySelectorAll('.panel')];
  const dotsEl = section.querySelector('.dots');
  const hint = section.querySelector('.hint');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); // throws if WebGL is unavailable
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 760 ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(KEYS[0].bg);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  const hemi = new THREE.HemisphereLight(0xffffff, 0xb8b2a6, 0.75 * PI);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff6e8, 0.9 * PI);
  sun.position.set(3, 5, 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.radius = 6;
  Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3 });
  sun.shadow.camera.updateProjectionMatrix();
  scene.add(sun);

  const groundMat = new THREE.MeshStandardMaterial({ color: KEYS[0].bg, roughness: 1 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), groundMat);
  ground.rotation.x = -PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
  const add = (parent, geo, m, x, y, z) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  const world = new THREE.Group();
  scene.add(world);
  add(world, new THREE.BoxGeometry(2.8, 0.5, 1.7), mat(0xf4f3ef), 0, 0.25, 0);

  // Terrarium with layered soil
  const T = new THREE.Group();
  T.position.set(-0.65, 0.5, 0);
  world.add(T);
  const layers = [];
  let h0 = 0;
  [[0x8a877f, 0.09], [0x2c2c2a, 0.04], [0x5a3a22, 0.13], [0x5f8a3a, 0.03]].forEach(([c, h], i) => {
    const m = add(T, new THREE.CylinderGeometry(0.5, 0.5, h, 48), mat(c), 0, h0 + h / 2, 0);
    layers.push({ m, base: h0 + h / 2, i });
    h0 += h;
  });
  const plants = new THREE.Group();
  plants.position.y = h0;
  T.add(plants);
  const leaf = mat(0x4f7a34), leaf2 = mat(0x7aa555);
  for (let i = 0; i < 7; i++) {
    const f = add(plants, new THREE.ConeGeometry(0.025, 0.42, 6), leaf, -0.15, 0.18, 0.05);
    f.rotation.z = (i - 3) * 0.22;
    f.rotation.x = i % 2 ? 0.2 : -0.2;
  }
  for (let i = 0; i < 5; i++) {
    const f = add(plants, new THREE.ConeGeometry(0.02, 0.3, 6), leaf2, 0.2, 0.13, -0.12);
    f.rotation.z = (i - 2) * 0.3;
  }
  add(plants, new THREE.SphereGeometry(0.14, 24, 16), leaf2, 0.15, 0, 0.2).scale.y = 0.45;
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, roughness: 0.05, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false });
  const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.53, 0.53, 1.05, 64, 1, true), glass);
  jar.position.y = 0.525;
  T.add(jar);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.53, 64, 24, 0, PI * 2, 0, PI / 2), glass);
  dome.position.y = 1.05;
  T.add(dome);

  // Little planted pavilion
  const P = new THREE.Group();
  P.position.set(0.65, 0.5, 0);
  world.add(P);
  const white = mat(0xf8f7f3, { roughness: 0.6 });
  add(P, new THREE.BoxGeometry(1.05, 0.06, 0.85), white, 0, 0.03, 0);
  [[-0.47, -0.37], [0.47, -0.37], [-0.47, 0.37], [0.47, 0.37]].forEach(([x, z]) => add(P, new THREE.BoxGeometry(0.04, 0.62, 0.04), white, x, 0.37, z));
  add(P, new THREE.BoxGeometry(1.2, 0.06, 1), white, 0, 0.71, 0);
  add(P, new THREE.BoxGeometry(1, 0.05, 0.8), leaf, 0, 0.765, 0);
  for (let i = 0; i < 6; i++) add(P, new THREE.SphereGeometry(0.05, 12, 8), leaf2, -0.4 + i * 0.16, 0.8, i % 2 ? 0.2 : -0.15);
  const windowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, emissive: 0xffb35c, emissiveIntensity: 0, roughness: 0.1 });
  const win = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.56, 0.5), windowMat);
  win.position.set(-0.05, 0.34, 0);
  P.add(win);
  add(P, new THREE.BoxGeometry(0.3, 0.56, 0.04), white, 0.25, 0.34, -0.23);
  add(P, new THREE.SphereGeometry(0.16, 20, 14), leaf, 0.42, 0.28, 0.28);
  add(P, new THREE.CylinderGeometry(0.015, 0.015, 0.2, 8), mat(0x5a3a22), 0.42, 0.1, 0.28);
  const warm = new THREE.PointLight(0xffb35c, 0, 3, 1);
  warm.position.set(0.6, 0.85, 0);
  world.add(warm);
  const cool = new THREE.PointLight(0x9fe1cb, 0, 2, 1);
  cool.position.set(-0.65, 1.2, 0);
  world.add(cool);

  // Navigation dots
  const scrollRange = () => section.offsetHeight - innerHeight;
  dotsEl.innerHTML = '';
  KEYS.forEach((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', `Story part ${i + 1}`);
    b.addEventListener('click', () => window.scrollTo({ top: section.getBoundingClientRect().top + scrollY + (i / (KEYS.length - 1)) * scrollRange(), behavior: 'smooth' }));
    dotsEl.appendChild(b);
  });

  let target = 0, p = 0, t0 = 0, raf = 0, visible = true;
  const st = ScrollTrigger.create({ trigger: section, start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: self => { target = self.progress; } });
  requestAnimationFrame(() => ScrollTrigger.refresh());
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(section);

  const resize = () => {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
  };
  addEventListener('resize', resize);
  resize();

  const v = a => new THREE.Vector3(...a);
  const ease = t => t * t * (3 - 2 * t);
  const look = new THREE.Vector3(), c1 = new THREE.Color(), c2 = new THREE.Color();
  const segments = KEYS.length - 1;

  function frame() {
    raf = requestAnimationFrame(frame);
    if (!visible) return; // don't burn battery when scrolled away
    p += (target - p) * 0.08;
    const s = p * segments;
    const seg = Math.min(segments - 1, Math.floor(s));
    const t = ease(Math.min(1, s - seg));
    const A = KEYS[seg], B = KEYS[seg + 1];
    const zoom = cam.aspect < 1 ? 1.7 : 1;

    look.copy(v(A.l).lerp(v(B.l), t));
    cam.position.copy(v(A.c).lerp(v(B.c), t)).sub(look).multiplyScalar(zoom).add(look);
    cam.lookAt(look);
    c1.set(A.bg); c2.set(B.bg);
    scene.background.copy(c1.lerp(c2, t));
    groundMat.color.copy(scene.background);
    hemi.intensity = (A.hemi + (B.hemi - A.hemi) * t) * PI;
    sun.intensity = (A.sun + (B.sun - A.sun) * t) * PI;

    const night = Math.max(0, Math.min(1, s - (segments - 1)));
    warm.intensity = night * 1.6 * PI;
    cool.intensity = night * 0.8 * PI;
    windowMat.emissiveIntensity = night * 0.9;

    const explode = Math.max(0, 1 - Math.abs(s - 1) * 1.4);
    layers.forEach(o => { o.m.position.y = o.base + o.i * explode * 0.07; });
    plants.position.y = h0 + 3 * explode * 0.07;

    if (!still) { t0 += 0.004; world.rotation.y = -0.3 + Math.sin(t0) * 0.08; }
    panels.forEach((el, i) => {
      el.style.opacity = Math.max(0, 1 - Math.abs(s - i) * 2);
      el.style.transform = `translateY(${(s - i) * -30}px)`;
    });
    [...dotsEl.children].forEach((d, i) => {
      d.classList.toggle('on', Math.round(s) === i);
      d.style.color = s > segments - 0.5 ? '#f2efe6' : '#1a1a1a';
    });
    hint.style.opacity = Math.max(0, 1 - s * 4);
    renderer.render(scene, cam);
  }
  frame();

  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    st.kill();
    removeEventListener('resize', resize);
    scene.traverse(o => {
      o.geometry?.dispose();
      [].concat(o.material || []).forEach(m => m.dispose());
    });
    renderer.dispose();
  };
}
import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const BALL_CENTER = new THREE.Vector3(0, -66.46, 0); // model space (z-up), mm
const BALL_R = 37;
const TUBE_R = 12.7;

function ballTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 512);
  grd.addColorStop(0, '#e3ef4a'); grd.addColorStop(1, '#d2e03a');
  g.fillStyle = grd; g.fillRect(0, 0, 1024, 512);
  g.fillStyle = '#8f9a1e';
  const rows = [-60, -30, 0, 30, 60];
  rows.forEach((lat, i) => {
    const n = lat === 0 ? 8 : Math.abs(lat) === 30 ? 7 : 5;
    const k = 1 / Math.cos(lat * Math.PI / 180);
    for (let j = 0; j < n; j++) {
      const lon = (j / n) * 360 + (i % 2 ? 180 / n : 0);
      const x = (lon / 360) * 1024, y = ((90 - lat) / 180) * 512;
      g.beginPath(); g.ellipse(x, y, 16 * k, 16, 0, 0, Math.PI * 2); g.fill();
      if (x < 40) { g.beginPath(); g.ellipse(x + 1024, y, 16 * k, 16, 0, 0, Math.PI * 2); g.fill(); }
    }
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export async function buildViewer(container, opts = {}) {
  const base = opts.base || '';
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: !!opts.still });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 1, 3000);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xb9b2a0, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(160, 220, 260); scene.add(key);
  const rim = new THREE.DirectionalLight(0xfff3d6, 1.0); rim.position.set(-220, 80, -160); scene.add(rim);

  // model space is z-up; rotate so z becomes three.js y
  const root = new THREE.Group();
  root.rotation.x = -Math.PI / 2;
  scene.add(root);

  const loader = new STLLoader();
  const load = (u) => new Promise((res, rej) => loader.load(base + u, res, undefined, rej));
  const [cupGeo, clampGeo] = await Promise.all([load('assets/models/cup.stl'), load('assets/models/clamp.stl')]);
  [cupGeo, clampGeo].forEach(g => g.computeVertexNormals());

  const cupMat = new THREE.MeshStandardMaterial({ color: 0x2563a8, roughness: 0.55, metalness: 0.0 });
  const clampMat = new THREE.MeshStandardMaterial({ color: 0x3a403c, roughness: 0.55 });
  const cup = new THREE.Mesh(cupGeo, cupMat);
  const clamp = new THREE.Mesh(clampGeo, clampMat);

  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(BALL_R, 96, 64),
    new THREE.MeshStandardMaterial({ map: ballTexture(), roughness: 0.5 })
  );
  ball.rotation.x = Math.PI / 2;
  ball.position.copy(BALL_CENTER);

  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(TUBE_R, TUBE_R, 240, 64, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xc9cdd0, roughness: 0.35, metalness: 0.35 })
  );
  tube.rotation.x = Math.PI / 2; // along model z

  const movers = new THREE.Group(); // cup + ball slide out together
  movers.add(cup, ball);
  root.add(clamp, tube, movers);

  const state = { ball: true, tube: true, explode: false, spin: false, cupOn: true };
  let explodeT = 0;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 140;
  controls.maxDistance = 600;
  controls.target.set(0, 0, 32);
  camera.position.set(230, 90, 250);

  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container);
  resize();

  function apply() {
    ball.visible = state.ball;
    tube.visible = state.tube;
    cup.visible = state.cupOn;
    controls.autoRotate = state.spin;
    controls.autoRotateSpeed = 1.6;
  }
  apply();

  function frame() {
    const target = state.explode ? 1 : 0;
    explodeT += (target - explodeT) * 0.12;
    movers.position.y = -40 * explodeT; // model -y is away from the chair
    controls.update();
    renderer.render(scene, camera);
  }

  if (opts.still) {
    return { scene, camera, controls, renderer, state, apply, movers, render: () => { movers.position.y = opts.offset || 0; controls.update(); renderer.render(scene, camera); } };
  }

  // only draw while visible
  let running = false;
  const loop = () => { if (!running) return; frame(); requestAnimationFrame(loop); };
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !running) { running = true; loop(); }
    else if (!e.isIntersecting) running = false;
  }).observe(container);

  return {
    toggle(name) { state[name] = !state[name]; apply(); return state[name]; }
  };
}

// Auto-start on the main page, lazily
const el = document.getElementById('viewer');
if (el) {
  let started = false;
  const start = async () => {
    if (started) return; started = true;
    try {
      const v = await buildViewer(el);
      el.querySelector('.viewer-loading')?.remove();
      document.querySelectorAll('[data-toggle]').forEach(btn => {
        btn.addEventListener('click', () => {
          const on = v.toggle(btn.dataset.toggle);
          btn.classList.toggle('on', on);
          btn.setAttribute('aria-pressed', String(on));
        });
      });
    } catch (err) {
      console.error(err);
      const l = el.querySelector('.viewer-loading');
      if (l) l.textContent = 'The 3D model could not load here. Try the renders below.';
    }
  };
  new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); start(); } }, { rootMargin: '400px' }).observe(el);
}

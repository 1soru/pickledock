// Mobile menu
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');
toggle.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
});
links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  links.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
}));

// Nav border on scroll
const nav = document.querySelector('.nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Fit guide
const sizes = [...document.querySelectorAll('#sizes li')];
const out = document.getElementById('fit-result');
const input = document.getElementById('fit-val');
const TOL = 0.9; // mm either side that still counts as a fit

function updateFit() {
  const mode = document.querySelector('input[name="mode"]:checked').value;
  const unit = document.querySelector('input[name="unit"]:checked').value;
  input.placeholder = unit === 'mm' ? (mode === 'd' ? 'e.g. 25.4' : 'e.g. 80') : (mode === 'd' ? 'e.g. 1' : 'e.g. 3.14');
  sizes.forEach(li => li.classList.remove('match'));
  out.classList.remove('good');

  let v = parseFloat(input.value);
  if (!v || v <= 0) { out.textContent = 'Enter a measurement to see your size.'; return; }
  if (unit === 'in') v *= 25.4;
  if (mode === 'c') v /= Math.PI;

  let best = null, gap = Infinity;
  sizes.forEach(li => {
    const d = Math.abs(parseFloat(li.dataset.mm) - v);
    if (d < gap) { gap = d; best = li; }
  });

  const dTxt = `${v.toFixed(1)} mm (${(v / 25.4).toFixed(2)} in)`;
  if (gap <= TOL) {
    best.classList.add('match');
    out.classList.add('good');
    const name = best.querySelector('.size-in').textContent;
    out.innerHTML = `Your tube is about ${dTxt}. Use the ${name} clamp. <a href="${best.dataset.file}" download>Download it</a>`;
  } else if (v < 20 || v > 34) {
    out.textContent = `Your tube is about ${dTxt}, which is outside the current clamp range (22 to 32 mm).`;
  } else {
    best.classList.add('match');
    const name = best.querySelector('.size-in').textContent;
    out.innerHTML = `Your tube is about ${dTxt}. That's between sizes. The ${name} clamp is closest, so test the fit before you play. <a href="${best.dataset.file}" download>Download it</a>`;
  }
}
document.querySelectorAll('.fit-form input').forEach(el => el.addEventListener('input', updateFit));
updateFit();

// Lightbox
const lb = document.getElementById('lightbox');
const lbImg = lb.querySelector('img');
document.querySelectorAll('.g-item').forEach(b => b.addEventListener('click', () => {
  lbImg.src = b.dataset.full;
  lbImg.alt = b.querySelector('img').alt;
  lb.hidden = false;
}));
const closeLb = () => { lb.hidden = true; lbImg.src = ''; };
lb.addEventListener('click', e => { if (e.target !== lbImg) closeLb(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !lb.hidden) closeLb(); });

// Gentle reveal on scroll
if ('IntersectionObserver' in window) {
  const els = document.querySelectorAll('.section > *, .hero > *');
  els.forEach(el => el.classList.add('reveal'));
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  els.forEach(el => io.observe(el));
}

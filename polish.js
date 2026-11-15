/* Ishi's Brownies: animation + polish layer (loaded after script.js) */
(() => {
  const q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)];
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* scroll progress bar + back to top */
  const bar = Object.assign(document.createElement('div'), {className:'sp-bar'});
  const top = Object.assign(document.createElement('button'), {className:'to-top', innerHTML:'↑'});
  top.setAttribute('aria-label', 'Back to top');
  top.onclick = () => scrollTo({top:0, behavior: still ? 'auto' : 'smooth'});
  document.body.append(bar, top);

  /* hero headline: split into words that rise in */
  const h1 = q('.hero h1');
  if (h1 && !still) {
    let i = 0; const out = [];
    const word = html => `<span class="w"><span style="--i:${i++}">${html}</span></span>`;
    const nodes = [...h1.childNodes]; let skip = '';
    nodes.forEach((n, k) => {
      if (n.nodeType === 3) { out.push(n.textContent.slice(skip.length).split(/(\s+)/).map(t => t.trim() ? word(t) : t).join('')); skip = ''; }
      else {
        /* keep punctuation that hugs the element (e.g. the comma after "love") on the same word */
        const nx = nodes[k + 1]; skip = nx && nx.nodeType === 3 ? (nx.textContent.match(/^\S+/) || [''])[0] : '';
        out.push(word(n.outerHTML + skip));
      }
    });
    h1.innerHTML = out.join(''); h1.classList.add('split');
  }

  /* stagger reveals among siblings, then clear the delay so hovers stay snappy */
  const stagger = root => {
    const groups = new Map();
    [...root.querySelectorAll('.reveal:not(.in):not([data-st])')].forEach(el => {
      el.dataset.st = 1;
      const p = el.parentElement, n = groups.get(p) || 0; groups.set(p, n + 1);
      el.style.setProperty('--d', Math.min(n, 7) * 90 + 'ms');
      el.addEventListener('transitionend', function done(e) {
        if (e.target !== el || e.propertyName !== 'opacity') return;
        el.style.setProperty('--d', '0ms'); el.removeEventListener('transitionend', done);
      });
    });
  };
  stagger(document);
  if (q('#grid')) new MutationObserver(() => stagger(q('#grid'))).observe(q('#grid'), {childList:true});
  qa('.chip').forEach((c, i) => c.style.setProperty('--i', i));
  qa('.fl').forEach((c, i) => c.style.setProperty('--i', i));

  /* dark panels: glow follows the pointer */
  if (fine) qa('.build,.custom-in').forEach(el => el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', e.clientX - r.left + 'px'); el.style.setProperty('--my', e.clientY - r.top + 'px');
  }));

  /* nav: highlight the section in view */
  const links = qa('#links a'), map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    links.forEach(a => a.classList.remove('active')); map.get(e.target.id)?.classList.add('active');
  }), {rootMargin:'-45% 0px -50% 0px'});
  map.forEach((a, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });

  /* scroll-linked bits */
  const aboutImg = q('.about-img img'), hero = q('.hero');
  let queued = false;
  const paint = () => {
    queued = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty('--sp', max > 0 ? (scrollY / max).toFixed(4) : 0);
    top.classList.toggle('on', scrollY > innerHeight * 1.2);
    if (hero && scrollY < hero.offsetTop + hero.offsetHeight) links.forEach(a => a.classList.remove('active'));
    if (aboutImg && !still) {
      const r = aboutImg.parentElement.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) aboutImg.style.setProperty('--py', (((r.top + r.height / 2) / innerHeight - .5) * -40).toFixed(1) + 'px');
    }
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(paint); } }, {passive:true});
  paint();
})();

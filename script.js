/* Ishi's Brownies sample website: vanilla JS, no libraries */
const WA = '919663819849';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const rupee = n => '₹' + n.toLocaleString('en-IN');

/* ---------- data (from Ishi's Instagram; prices are sample) ---------- */
const PRODUCTS = [
  {id:'box6', name:'Mix Six Brownie Box', cat:'brownie', price:450, img:'https://images.unsplash.com/photo-1636743715220-d8f8dd900b87?auto=format&fit=crop&w=900&q=75', tag:'Bestseller', desc:'Any six flavours, egg or eggless. Build it your way below.'},
  {id:'slab', name:'Brownie Slab with Message', cat:'brownie', price:899, img:'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?auto=format&fit=crop&w=900&q=75', tag:'Free message', gold:true, desc:'One big slab loaded with toppings and your message piped on top.'},
  {id:'tin', name:'Loaded Brownie Tin', cat:'brownie', price:699, img:'https://images.unsplash.com/photo-1515037893149-de7f840978e2?auto=format&fit=crop&w=900&q=75', desc:'A gift tin of gooey brownie topped with chocolate, nuts and Nutella swirls.'},
  {id:'heart', name:'Heart Brownie Cake', cat:'brownie', price:549, img:'https://images.unsplash.com/photo-1707248590553-29531e00bbed?auto=format&fit=crop&w=900&q=75', desc:'Heart-shaped brownie with flowers and your love note.'},
  {id:'couple', name:'Anniversary Couple Slab', cat:'brownie', price:999, img:'https://images.unsplash.com/photo-1628509633348-a39defbc44c4?auto=format&fit=crop&w=900&q=75', tag:'Custom', desc:'Names, roses and a white-chocolate couple on a rich brownie slab.'},
  {id:'cheese', name:'No-Bake Cheesecake', cat:'dessert', price:149, img:'https://images.unsplash.com/photo-1695088957420-c3b97d1f1138?auto=format&fit=crop&w=900&q=75', desc:'Blueberry, Biscoff or Nutella. Creamy, chilled, single serve.'},
  {id:'bowl', name:'Chocolate Cake Bowl', cat:'dessert', price:129, img:'https://images.unsplash.com/photo-1673551494277-92204546b504?auto=format&fit=crop&w=900&q=75', desc:'Layers of chocolate cake and cream with a marbled top.'},
  {id:'cup', name:'Cupcakes (Box of 6)', cat:'dessert', price:420, img:'https://images.unsplash.com/photo-1603532648955-039310d9ed75?auto=format&fit=crop&w=900&q=75', desc:'Soft cupcakes with swirly frosting in your colours.'},
  {id:'pops', name:'Cake Pops (Pack of 8)', cat:'dessert', price:360, img:'https://images.unsplash.com/photo-1767129788040-7224b261ab0d?auto=format&fit=crop&w=900&q=75', desc:'Party favourite, dipped and drizzled, tied with ribbon.'},
  {id:'namebar', name:'Customised Name Chocolate', cat:'choco', price:349, img:'https://images.unsplash.com/photo-1592290321458-49b80f943a26?auto=format&fit=crop&w=900&q=75', desc:'Your name or message in white chocolate on a big bar.'},
  {id:'nutbar', name:'Fruit & Nut Message Bar', cat:'choco', price:399, img:'https://images.unsplash.com/photo-1627647227768-705244233b56?auto=format&fit=crop&w=900&q=75', tag:'New', desc:'Loaded with almonds, cashews and pistachios, plus your wish.'},
  {id:'white', name:'Fruit & Nut White Chocolate', cat:'choco', price:320, img:'https://images.unsplash.com/photo-1770998868042-7ee81050b2ce?auto=format&fit=crop&w=900&q=75', desc:'Creamy white chocolate packed with dry fruits.'},
  {id:'cbox', name:'Chocolate Box', cat:'gift', price:99, img:'https://images.unsplash.com/photo-1687795097254-f019f9d7fd17?auto=format&fit=crop&w=900&q=75', tag:'Return gift', gold:true, desc:'Assorted homemade chocolates in a pretty box. Bulk prices available.'},
  {id:'truffle', name:'Dessert Trio Box', cat:'gift', price:299, img:'https://images.unsplash.com/photo-1763700667398-24ae7f2289fc?auto=format&fit=crop&w=900&q=75', desc:'Three handmade treats in a clear gift box.'},
  {id:'hamper', name:'Hamper Box', cat:'gift', price:999, img:'https://images.unsplash.com/photo-1508899203029-1c9eb493c9bd?auto=format&fit=crop&w=900&q=75', tag:'Festive', desc:'Brownies, chocolates and treats tied with a gold ribbon.'},
  {id:'diwali', name:'Festival Hamper', cat:'gift', price:1499, img:'https://images.unsplash.com/photo-1773450970959-cef81e9b1053?auto=format&fit=crop&w=900&q=75', desc:'Our big celebration hamper for Diwali, Christmas and Eid.'}
];
const FLAVOURS = [
  {n:'Classic Fudge', d:'Dense, gooey, pure dark chocolate', img:'https://images.unsplash.com/photo-1629856428041-6f9721807b05?auto=format&fit=crop&w=900&q=75'},
  {n:'Nutella Swirl', d:'Nutella piped over a fudgy base', img:'https://images.unsplash.com/photo-1611060516311-84aab2454de8?auto=format&fit=crop&w=900&q=75'},
  {n:'Loaded Kinder', d:'Chocolate bars, wafer and hazelnut cream', img:'https://images.unsplash.com/photo-1461009312844-e80697a81cc7?auto=format&fit=crop&w=900&q=75'},
  {n:'Biscoff Crunch', d:'Biscoff spread with biscuit crumb', img:'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&w=900&q=75'},
  {n:'Birthday Special', d:'Cookies, chocolates and a wish on top', img:'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?auto=format&fit=crop&w=900&q=75'},
  {n:'Nutty Delight', d:'Almonds, cashews and pistachios', img:'https://images.unsplash.com/photo-1627647227768-705244233b56?auto=format&fit=crop&w=900&q=75'},
  {n:'Love Note', d:'White-choc message and sugar hearts', img:'https://images.unsplash.com/photo-1606313564573-104197cf8f91?auto=format&fit=crop&w=900&q=75'},
  {n:'Rose & Heart', d:'Fondant roses on a heart brownie', img:'https://images.unsplash.com/photo-1707248590553-29531e00bbed?auto=format&fit=crop&w=900&q=75'}
];
const FAQ = [
  ['Are your brownies available eggless?', 'Yes! Every brownie, slab and tin can be made egg or eggless. Just choose when you order.'],
  ['Where do you deliver?', 'We deliver across Bangalore. Free self pickup is available, and we courier chocolates, chocolate boxes and hampers.'],
  ['How early should I order?', 'Brownie boxes can be ordered 1 day ahead. For slabs with messages, cakes and hampers, 2–3 days ahead is best. Bulk orders: one week.'],
  ['Can you write a name or message?', 'Of course. Slabs, heart brownies and name chocolates come with a free hand-piped message.'],
  ['Do you take bulk and corporate orders?', 'Yes: return gifts (chocolate boxes from ₹99), corporate hampers and dessert stalls. Use the custom order form below.'],
  ['How do I pay?', 'UPI (GPay, PhonePe, Paytm), card, or cash on pickup. You get a confirmation on WhatsApp.']
];

/* ---------- reveal on scroll ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), {threshold:.15});
const watchReveal = () => $$('.reveal:not(.in)').forEach(el => io.observe(el));

/* ---------- nav ---------- */
addEventListener('scroll', () => {
  $('#nav').classList.toggle('scrolled', scrollY > 30);
  $('#stickySum').classList.toggle('on', scrollY > innerHeight * .9 && !inView($('#build')) && !inView($('#breakopen')) && !inView($('#sixbox')));
}, {passive:true});
const inView = el => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };
$('#burger').onclick = () => { $('#links').classList.toggle('open'); $('#burger').classList.toggle('x'); };
$$('#links a').forEach(a => a.onclick = () => { $('#links').classList.remove('open'); $('#burger').classList.remove('x'); });

/* ---------- toast ---------- */
let tt; const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2200); };

/* ---------- shop grid ---------- */
function renderGrid(cat = 'all') {
  $('#grid').innerHTML = PRODUCTS.filter(p => cat === 'all' || p.cat === cat).map(p => `
    <article class="card reveal">
      <div class="ph"><img src="${p.img}" alt="${p.name}" loading="lazy">${p.tag ? `<span class="tag ${p.gold ? 'gold' : ''}">${p.tag}</span>` : ''}</div>
      <div class="bd"><h3>${p.name}</h3><p>${p.desc}</p>
        <div class="row"><span class="pr">${rupee(p.price)}${p.cat === 'dessert' && p.price < 200 ? ' <small>each</small>' : ''}</span>
        <button class="add" data-id="${p.id}">${p.id === 'box6' ? 'Build' : '+ Add'}</button></div></div>
    </article>`).join('');
  watchReveal();
}
$('#tabs').onclick = e => { const b = e.target.closest('button'); if (!b) return; $$('#tabs button').forEach(x => x.classList.toggle('on', x === b)); renderGrid(b.dataset.c); };
$('#grid').onclick = e => {
  const b = e.target.closest('.add'); if (!b) return;
  if (b.dataset.id === 'box6') { $('#build').scrollIntoView({behavior:'smooth'}); return; }
  const p = PRODUCTS.find(x => x.id === b.dataset.id);
  addToBasket({key:p.id, name:p.name, price:p.price, img:p.img}, b.closest('.card').querySelector('img'));
  b.textContent = '✓ Added'; b.classList.add('done'); setTimeout(() => { b.textContent = '+ Add'; b.classList.remove('done'); }, 1400);
};

/* ---------- basket ---------- */
let basket = [];
function addToBasket(item, fromImg) {
  const ex = basket.find(i => i.key === item.key);
  ex ? ex.qty++ : basket.push({...item, qty:1});
  if (fromImg) flyTo(fromImg);
  updateBasket(); toast(`${item.name} added to basket`);
}
function flyTo(img) {
  const r = img.getBoundingClientRect(), t = $('#openBasket').getBoundingClientRect();
  const f = Object.assign(document.createElement('img'), {src:img.src, className:'fly'});
  Object.assign(f.style, {left:r.left + r.width/2 - 30 + 'px', top:r.top + r.height/2 - 30 + 'px'});
  document.body.appendChild(f);
  requestAnimationFrame(() => Object.assign(f.style, {left:t.left + 10 + 'px', top:t.top - 10 + 'px', width:'20px', height:'20px', opacity:.4}));
  setTimeout(() => { f.remove(); $('#openBasket').classList.add('bump'); setTimeout(() => $('#openBasket').classList.remove('bump'), 500); }, 800);
}
function updateBasket() {
  const count = basket.reduce((s, i) => s + i.qty, 0), sub = basket.reduce((s, i) => s + i.qty * i.price, 0);
  $('#bCount').textContent = count;
  $('#dItems').innerHTML = basket.length ? basket.map((i, k) => `
    <div class="di"><img src="${i.img}" alt=""><div><b>${i.name}</b><small>${i.note ? i.note + ' · ' : ''}${rupee(i.price)}</small></div>
    <div class="qty"><button data-k="${k}" data-d="-1">−</button>${i.qty}<button data-k="${k}" data-d="1">+</button></div></div>`).join('')
    : `<div class="d-empty"><b>Your basket is empty</b>Add some brownies, they won't judge 🍫</div>`;
  const del = sub ? +$('#dDel').value : 0;
  $('#dSub').textContent = rupee(sub); $('#dTot').textContent = rupee(sub + del);
}
$('#dItems').onclick = e => { const b = e.target.closest('button[data-k]'); if (!b) return; const i = basket[b.dataset.k]; i.qty += +b.dataset.d; if (i.qty <= 0) basket.splice(b.dataset.k, 1); updateBasket(); };
$('#dDel').onchange = updateBasket;
const openB = () => document.body.classList.add('basket-open'), closeB = () => document.body.classList.remove('basket-open');
$('#openBasket').onclick = openB; $('#closeBasket').onclick = closeB; $('#veil').onclick = closeB;
const minDate = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
$('#dDate').min = minDate; $('#dDate').value = minDate;
function orderText() {
  const lines = basket.map(i => `• ${i.qty} × ${i.name}${i.note ? ' (' + i.note + ')' : ''} = ${rupee(i.qty * i.price)}`);
  return `Hi Ishi's Brownies! I'd like to order:\n${lines.join('\n')}\nDelivery: ${$('#dDel').selectedOptions[0].text}\nDate: ${$('#dDate').value}\nTotal: ${$('#dTot').textContent}`;
}
$('#orderWa').onclick = () => { if (!basket.length) return toast('Your basket is empty'); open(`https://wa.me/${WA}?text=${encodeURIComponent(orderText())}`, '_blank'); };
$('#payUpi').onclick = () => { if (!basket.length) return toast('Your basket is empty'); toast('Demo: UPI checkout (GPay / PhonePe / Paytm) opens here'); };

/* ---------- build a box ---------- */
let bays = Array(6).fill(null), egg = 'Egg';
$('#chips').innerHTML = FLAVOURS.map((f, i) => `<button class="chip" data-i="${i}"><img src="${f.img}" alt="">${f.n}</button>`).join('');
function renderBays() {
  $('#bays').innerHTML = bays.map((f, i) => f ? `<div class="bay filled" data-i="${i}"><img src="${f.top || f.img}" alt="${f.n}"><em>${f.n}</em></div>` : `<div class="bay">${i + 1}</div>`).join('');
  const n = bays.filter(Boolean).length;
  $('#boxStatus').textContent = n === 6 ? `Box full! ${egg} · ready to add` : `${n} of 6 bays filled`;
  $('#boxBar').style.width = (n / 6 * 100) + '%';
  $('#addBox').disabled = n < 6;
}
$('#chips').onclick = e => { const c = e.target.closest('.chip'); if (!c) return; const i = bays.indexOf(null); if (i < 0) return toast('Box is full. Tap a bay to swap'); bays[i] = FLAVOURS[c.dataset.i]; renderBays(); };
$('#bays').onclick = e => { const b = e.target.closest('.bay.filled'); if (!b) return; bays[b.dataset.i] = null; renderBays(); };
$('#fillRest').onclick = () => { bays = bays.map(b => b || FLAVOURS[Math.floor(Math.random() * FLAVOURS.length)]); renderBays(); };
$('#clearBox').onclick = () => { bays = Array(6).fill(null); renderBays(); };
$('#eggToggle').onclick = e => { const b = e.target.closest('button'); if (!b) return; egg = b.dataset.v; $$('#eggToggle button').forEach(x => x.classList.toggle('on', x === b)); renderBays(); };
$('#addBox').onclick = () => {
  const counts = {}; bays.forEach(f => counts[f.n] = (counts[f.n] || 0) + 1);
  const note = egg + ': ' + Object.entries(counts).map(([n, c]) => `${c}× ${n}`).join(', ');
  addToBasket({key:'box-' + note, name:'Mix Six Brownie Box', price:450, img:'https://images.unsplash.com/photo-1636743715220-d8f8dd900b87?auto=format&fit=crop&w=900&q=75', note}, $('#bays img'));
  bays = Array(6).fill(null); renderBays();
};

/* ---------- flavours hover reveal ---------- */
$('#flGrid').innerHTML = FLAVOURS.map(f => `<figure class="fl-item reveal"><div class="fl" tabindex="0"><img src="${f.img}" alt="${f.n} brownie" loading="lazy"><div class="cap"><b>${f.n}</b><span>${f.d}</span></div></div><figcaption>${f.n}</figcaption></figure>`).join('');
$('#flGrid').onclick = e => { const f = e.target.closest('.fl'); if (f) f.classList.toggle('show'); };

/* ---------- drag-to-rotate hero ---------- */
(() => {
  const stage = $('#spinStage'), card = $('#spinCard');
  let rot = -14, tilt = 6, dragging = false, sx = 0, sr = 0, vel = 0, last = 0, idle = true;
  const apply = () => card.style.transform = `rotateY(${rot}deg) rotateX(${tilt}deg)`;
  stage.addEventListener('pointerdown', e => { dragging = true; idle = false; sx = e.clientX; sr = rot; last = e.clientX; stage.setPointerCapture(e.pointerId); });
  stage.addEventListener('pointermove', e => {
    if (!dragging) { const r = stage.getBoundingClientRect(); tilt = ((e.clientY - r.top) / r.height - .5) * -14; apply(); return; }
    rot = sr + (e.clientX - sx) * .6; vel = e.clientX - last; last = e.clientX; apply();
  });
  const end = () => { if (!dragging) return; dragging = false; const glide = () => { if (Math.abs(vel) < .2) return; rot += vel * .6; vel *= .92; apply(); requestAnimationFrame(glide); }; glide(); };
  stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
  let t0 = performance.now();
  const auto = t => { if (idle) { rot = -14 + Math.sin((t - t0) / 1600) * 18; apply(); } requestAnimationFrame(auto); };
  requestAnimationFrame(auto);
})();

/* ---------- break one open: scroll-driven ---------- */
(() => {
  const sec = $('#breakopen'), copies = $$('.bo-copy'), dots = $$('.bo-dots i');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = v => Math.min(1, Math.max(0, v)), ease = t => 1 - Math.pow(1 - t, 3);
  let queued = false;
  const paint = () => {
    queued = false;
    const total = sec.offsetHeight - innerHeight;
    const p = still ? .62 : clamp(-sec.getBoundingClientRect().top / total);
    sec.style.setProperty('--p', p.toFixed(4));
    sec.style.setProperty('--b', ease(clamp((p - .1) / .55)).toFixed(4));
    if (still) return;
    const idx = p < .3 ? 0 : p < .7 ? 1 : 2;
    copies.forEach((c, i) => c.classList.toggle('on', i === idx));
    dots.forEach((d, i) => d.classList.toggle('on', i === idx));
    sec.classList.toggle('started', p > .04);
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(paint); } }, {passive:true});
  addEventListener('resize', paint); paint();
})();

/* ---------- hero parallax on floats ---------- */
addEventListener('scroll', () => {
  const y = scrollY; if (y > innerHeight) return;
  $('.f1').style.translate = `0 ${y * -.12}px`; $('.f2').style.translate = `0 ${y * .08}px`;
}, {passive:true});

/* ---------- FAQ ---------- */
$('#faq').innerHTML = FAQ.map(([q, a]) => `<div class="q reveal"><button>${q}<i>+</i></button><div class="a"><p>${a}</p></div></div>`).join('');
$('#faq').onclick = e => { const b = e.target.closest('button'); if (!b) return; const q = b.parentElement, a = q.querySelector('.a'); const open = q.classList.toggle('open'); a.style.maxHeight = open ? a.scrollHeight + 'px' : 0; };

/* ---------- custom order → WhatsApp ---------- */
$('#customForm').date.min = minDate;
$('#customForm').onsubmit = e => {
  e.preventDefault(); const f = new FormData(e.target);
  const msg = `Hi Ishi's Brownies! Custom order enquiry:\nOccasion: ${f.get('occasion')}\nDate: ${f.get('date')}\nQuantity: ${f.get('qty')}\nDetails: ${f.get('msg') || '-'}`;
  open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, '_blank'); toast('Opening WhatsApp…');
};

/* ---------- init ---------- */
renderGrid(); renderBays(); updateBasket(); watchReveal();

/* ===== Codedtx shop demo engine: storefront + admin (in-memory demo data) ===== */
(function(){
const C = window.SHOP;
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// ---------- theme ----------
const root = document.documentElement;
Object.entries(C.theme).forEach(([k,v]) => root.style.setProperty('--'+k, v));
document.title = C.seo.title;

// ---------- deterministic demo data ----------
let seed = C.seed || 7;
const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
const S = {
  products: C.products.map(p => ({...p, seoTitle: p.seoTitle || '', seoDesc: p.seoDesc || '', active: true})),
  categories: C.categories.map(c => ({...c})),
  cart: [], wish: new Set(), filter: 'all', q: '', sort: 'pop',
  seo: {...C.seo}, settings: {sitemap:true, robots:true, schema:true, ga:true, pixel:false, whatsapp:true, ai:true},
  orders: [], admin: false, range: 30,
};
const names = ['Priya S','Rahul K','Ananya M','Karthik R','Divya P','Arjun V','Sneha T','Vikram N','Meena J','Rohit G','Kavya L','Aditya B'];
const cities = (window.SHOP.orderCities) || ['Chennai','Bengaluru','Hyderabad','Mumbai','Pune','Delhi','Kochi','Coimbatore','Kolkata','Jaipur'];
const statuses = ['Delivered','Delivered','Shipped','Processing','Delivered','New'];
for (let i = 0; i < 14; i++) {
  const p = S.products[Math.floor(rnd()*S.products.length)];
  const q = 1 + Math.floor(rnd()*3);
  S.orders.push({id: 'ORD' + (1048 - i), name: names[i % names.length], city: cities[Math.floor(rnd()*cities.length)],
    items: [{id:p.id, qty:q}], total: p.price*q + (p.price*q >= C.freeShip ? 0 : 49), status: statuses[i % statuses.length],
    pay: ['UPI','UPI','Card','UPI'][i%4], date: new Date(Date.now() - i*86400000*0.7)});
}
// 90 days of visitor analytics
const days = 90, traffic = [];
for (let i = days-1; i >= 0; i--) {
  const d = new Date(Date.now() - i*86400000);
  const base = C.trafficBase * (1 + (days-i)/days*0.6);
  const wk = [0,6].includes(d.getDay()) ? 1.25 : 1;
  const v = Math.round(base * wk * (0.8 + rnd()*0.45));
  traffic.push({d, visitors: v, orders: Math.max(0, Math.round(v * (0.018 + rnd()*0.014)))});
}

// ---------- helpers ----------
const catName = id => (S.categories.find(c => c.id === id) || {}).name || id;
const prod = id => S.products.find(p => p.id === id);
const cartCount = () => S.cart.reduce((a,c) => a + c.qty, 0);
const cartTotal = () => S.cart.reduce((a,c) => a + prod(c.id).price * c.qty, 0);
const stockLbl = p => p.stock <= 0 ? '<span class="stock">Out of stock</span>' : p.stock <= C.lowStock ? `<span class="stock low">Only ${p.stock} left</span>` : '<span class="stock">In stock</span>';
function toast(msg, icon='fa-circle-check'){ const t=$('#toast'); t.innerHTML=`<i class="fa-solid ${icon}"></i>${esc(msg)}`; t.classList.add('on'); clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('on'),2200); }
const off = p => p.mrp && p.mrp > p.price ? Math.round((1-p.price/p.mrp)*100) : 0;

// ======================= STOREFRONT =======================
function storeHTML(){
  const cats = S.categories;
  return `
  <div class="s-bar">${C.bar.map(b=>`<span><i class="${b[0]}"></i>${esc(b[1])}</span>`).join('')}</div>
  <header class="s-head"><div class="s-head-in">
    <a class="logo" href="#top">${esc(C.name)}<small>${esc(C.sub)}</small></a>
    <nav class="s-nav">${C.nav.map(n=>`<a href="${n[1]}">${esc(n[0])}</a>`).join('')}</nav>
    <label class="s-search"><i class="fa-solid fa-magnifying-glass"></i><input id="q" placeholder="Search products…" value="${esc(S.q)}"></label>
    <div class="s-icons">
      <button class="icon-btn" data-act="wishlist" title="Wishlist"><i class="fa-regular fa-heart"></i><span class="dot ${S.wish.size?'':'hidden'}" id="wdot">${S.wish.size}</span></button>
      <button class="icon-btn" data-act="cart" title="Cart"><i class="fa-solid fa-bag-shopping"></i><span class="dot ${cartCount()?'':'hidden'}" id="cdot">${cartCount()}</span></button>
      <a class="admin-link" href="#admin"><i class="fa-solid fa-gauge-high"></i><span>Admin</span></a>
    </div>
  </div></header>

  <section class="hero" id="top">
    <div>
      <span class="tag"><i class="fa-solid fa-wand-magic-sparkles"></i>${esc(C.hero.tag)}</span>
      <h1>${C.hero.title}</h1>
      <p>${esc(C.hero.text)}</p>
      <div class="btns"><a class="btn p" href="#shop"><i class="fa-solid fa-bag-shopping"></i>${esc(C.hero.cta)}</a><a class="btn s" href="${C.hero.cta2[1]}"><i class="${C.hero.cta2[2]}"></i>${esc(C.hero.cta2[0])}</a></div>
      <div class="stats">${C.hero.stats.map(s=>`<div><b>${esc(s[0])}</b><span>${esc(s[1])}</span></div>`).join('')}</div>
    </div>
    <div class="hero-art">
      ${C.hero.imgs.map((im,i)=>`<img class="h${i+1}" src="${im}" alt="${esc(C.name)} product">`).join('')}
      <div class="float-badge"><i class="fa-solid fa-truck-fast"></i><div><b>Free shipping</b><br><span style="color:var(--muted)">on orders above ${inr(C.freeShip)}</span></div></div>
    </div>
  </section>

  <section class="sec" id="cats">
    <div class="sec-h c"><span class="kicker">Categories</span><h2>Shop by category</h2><p>Everything from your Instagram, neatly organised</p></div>
    <div class="cats">${cats.map(c=>{const n=S.products.filter(p=>p.cat===c.id&&p.active).length; return `<div class="cat ${S.filter===c.id?'on':''}" data-cat="${c.id}">${c.img?`<img class="ci" src="${c.img}" alt="">`:`<div class="cic"><i class="${c.icon}"></i></div>`}<b>${esc(c.name)}</b><span>${n} product${n===1?'':'s'}</span></div>`}).join('')}</div>
  </section>

  <section class="sec" id="shop" style="padding-top:10px">
    <div class="sec-h"><div><span class="kicker">Shop</span><h2>${esc(C.shopTitle)}</h2><p>Tap a product to see details · checkout with UPI, no DMs needed</p></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <div class="chips"><button class="chip ${S.filter==='all'?'on':''}" data-cat="all">All</button>${cats.map(c=>`<button class="chip ${S.filter===c.id?'on':''}" data-cat="${c.id}">${esc(c.name)}</button>`).join('')}</div>
        <select class="sort" id="sort"><option value="pop">Popular</option><option value="new">Newest</option><option value="lo">Price: Low → High</option><option value="hi">Price: High → Low</option></select>
      </div>
    </div>
    <div class="grid" id="pgrid">${gridHTML()}</div>
  </section>

  <div class="banner" id="${C.banner.id}">
    <div><span class="kicker" style="color:var(--accent)">${esc(C.banner.kicker)}</span><h2>${C.banner.title}</h2><p>${esc(C.banner.text)}</p>
      <ul>${C.banner.points.map(p=>`<li><i class="${p[0]}"></i>${esc(p[1])}</li>`).join('')}</ul>
      <button class="btn p" data-act="enquiry"><i class="${C.banner.cta[1]}"></i>${esc(C.banner.cta[0])}</button></div>
    <img src="${C.banner.img}" alt="">
  </div>

  <section class="sec" id="how">
    <div class="sec-h c"><span class="kicker">How it works</span><h2>${esc(C.stepsTitle)}</h2></div>
    <div class="steps">${C.steps.map(s=>`<div class="step"><div class="n"><i class="${s[0]}"></i></div><b>${esc(s[1])}</b><p>${esc(s[2])}</p></div>`).join('')}</div>
  </section>

  <section class="sec" style="padding-top:0"><div class="trust">${C.trust.map(t=>`<div class="t"><i class="${t[0]}"></i><b>${esc(t[1])}</b><span>${esc(t[2])}</span></div>`).join('')}</div></section>

  <section class="sec" style="padding-top:0">
    <div class="sec-h c"><span class="kicker">@${esc(C.insta)}</span><h2>Follow us on Instagram</h2><p>New launches drop here first</p></div>
    <div class="insta">${C.instaImgs.map(i=>`<a href="#" data-act="noop"><img src="${i}" alt=""></a>`).join('')}</div>
  </section>

  <section class="sec" id="reviews" style="padding-top:0">
    <div class="sec-h c"><span class="kicker">Reviews</span><h2>Happy customers</h2></div>
    <div class="rev"><i class="fa-solid fa-comment-dots"></i><b>Your real customer reviews go here</b>We'll bring in the reviews from your Instagram highlights. Customers can also rate products after delivery.</div>
  </section>

  <section class="sec" id="faq" style="padding-top:0">
    <div class="sec-h c"><span class="kicker">FAQ</span><h2>Questions? We've got answers</h2></div>
    <div class="faq">${C.faqs.map(f=>`<details><summary>${esc(f[0])}</summary><p>${esc(f[1])}</p></details>`).join('')}</div>
  </section>

  <div class="news"><div><h3><i class="fa-brands fa-whatsapp" style="color:#25d366"></i> Get new launches on WhatsApp</h3><p>Offers and new arrivals, once a week. Only if you sign up.</p></div>
    <form data-act="news"><input type="tel" placeholder="Your WhatsApp number" required><button class="btn p" type="submit">Notify me</button></form></div>

  <footer class="s-foot">
    <div><div class="logo" style="font-size:26px">${esc(C.name)}</div><p style="margin-top:10px;line-height:1.6">${esc(C.about)}</p><div class="pay"><span>UPI</span><span>GPay</span><span>PhonePe</span><span>Paytm</span><span>Cards</span></div></div>
    <div><h4>Shop</h4><ul>${S.categories.map(c=>`<li><i class="${c.icon}"></i>${esc(c.name)}</li>`).join('')}</ul></div>
    <div><h4>Help</h4><ul><li><i class="fa-solid fa-truck"></i>Shipping policy</li><li><i class="fa-solid fa-rotate-left"></i>${esc(C.returnsLbl)}</li><li><i class="fa-solid fa-location-dot"></i>Track order</li><li><i class="fa-solid fa-circle-question"></i>FAQ</li></ul></div>
    <div><h4>Connect</h4><ul><li><i class="fa-brands fa-instagram"></i>@${esc(C.insta)}</li><li><i class="fa-brands fa-whatsapp"></i>WhatsApp orders</li><li><i class="fa-solid fa-envelope"></i>hello@${esc(C.domain)}</li></ul></div>
    <div class="copy">© ${new Date().getFullYear()} ${esc(C.name)} · ${esc(C.domain)} (example domain) · Sample website designed by Codedtx</div>
  </footer>

  <a class="wa-float" href="#" data-act="noop"><i class="fa-brands fa-whatsapp"></i>Order on WhatsApp</a>
  <div class="bot"><div class="bot-box hidden" id="botbox"><header><i class="fa-solid fa-robot"></i>${esc(C.name)} Assistant</header>
    <div class="bot-msgs" id="botmsgs"><div class="m">Hi! 👋 I can help with price, stock, delivery and custom orders. What would you like to know?</div></div>
    <div class="bot-q">${C.bot.map((b,i)=>`<button data-bot="${i}">${esc(b[0])}</button>`).join('')}</div></div>
    <button class="bot-btn" data-act="bot" title="Chat"><i class="fa-solid fa-robot"></i></button></div>

  <div class="overlay" id="ov" data-act="close"></div>
  <aside class="drawer" id="drawer"><header><span><i class="fa-solid fa-bag-shopping"></i> Your cart</span><button data-act="close"><i class="fa-solid fa-xmark"></i></button></header><div class="items" id="citems"></div><footer id="cfoot"></footer></aside>
  <div class="modal" id="modal"><div class="box" id="mbox"></div></div>`;
}

function visibleProducts(){
  let list = S.products.filter(p => p.active && (S.filter === 'all' || p.cat === S.filter));
  if (S.q) { const q = S.q.toLowerCase(); list = list.filter(p => (p.name + ' ' + catName(p.cat) + ' ' + p.desc).toLowerCase().includes(q)); }
  const sorters = {pop:(a,b)=>b.sold-a.sold, new:(a,b)=>(b.isNew?1:0)-(a.isNew?1:0), lo:(a,b)=>a.price-b.price, hi:(a,b)=>b.price-a.price};
  return list.sort(sorters[S.sort]);
}
function gridHTML(){
  const list = visibleProducts();
  if (!list.length) return `<div class="empty"><i class="fa-solid fa-magnifying-glass" style="font-size:28px"></i><p style="margin-top:10px">No products found. Try another search.</p></div>`;
  return list.map(p => `<div class="card">
    <div class="im" data-qv="${p.id}"><img src="${p.img}" alt="${esc(p.name)}" style="object-position:${p.pos||'center'}">
      ${p.stock<=0?'<span class="badge out">SOLD OUT</span>':p.badge?`<span class="badge">${esc(p.badge)}</span>`:''}
      <button class="wish" data-wish="${p.id}"><i class="fa-${S.wish.has(p.id)?'solid':'regular'} fa-heart"></i></button></div>
    <div class="bd"><span class="ct">${esc(catName(p.cat))}</span><h3>${esc(p.name)}</h3>
      <div class="price"><b>${inr(p.price)}</b>${p.mrp>p.price?`<s>${inr(p.mrp)}</s><span class="off">${off(p)}% off</span>`:''}</div>
      <div class="row">${stockLbl(p)}<button class="add" data-add="${p.id}" ${p.stock<=0?'disabled':''}><i class="fa-solid fa-${C.addIcon||'plus'}"></i>${esc(C.addLbl||'Add')}</button></div></div></div>`).join('');
}
function refreshGrid(){ const g=$('#pgrid'); if(g) g.innerHTML = gridHTML(); $$('.chip,.cat').forEach(e=>e.classList.toggle('on', e.dataset.cat===S.filter)); }
function refreshBadges(){ const c=$('#cdot'), w=$('#wdot'); if(c){c.textContent=cartCount(); c.classList.toggle('hidden',!cartCount());} if(w){w.textContent=S.wish.size; w.classList.toggle('hidden',!S.wish.size);} }

function openDrawer(){ renderCart(); $('#drawer').classList.add('on'); $('#ov').classList.add('on'); }
function openModal(html){ $('#mbox').innerHTML = `<button class="x" data-act="close"><i class="fa-solid fa-xmark"></i></button>` + html; $('#modal').classList.add('on'); $('#ov').classList.add('on'); }
function closeAll(){ $$('.drawer,.modal,.overlay').forEach(e=>e.classList.remove('on')); }
function renderCart(){
  const items = $('#citems'), foot = $('#cfoot');
  if (!S.cart.length) { items.innerHTML = `<div class="empty"><i class="fa-solid fa-bag-shopping" style="font-size:30px"></i><p style="margin-top:10px">Your cart is empty</p></div>`; foot.innerHTML = `<a class="btn p" style="width:100%" href="#shop" data-act="close">Start shopping</a>`; return; }
  items.innerHTML = S.cart.map(c => { const p = prod(c.id); return `<div class="ci-row"><img src="${p.img}" alt=""><div><b>${esc(p.name)}</b><span>${inr(p.price)}</span><div class="qty"><button data-q="${p.id}" data-d="-1"><i class="fa-solid fa-minus"></i></button>${c.qty}<button data-q="${p.id}" data-d="1"><i class="fa-solid fa-plus"></i></button></div></div><button data-rm="${p.id}" title="Remove"><i class="fa-solid fa-trash-can" style="color:var(--muted)"></i></button></div>`; }).join('');
  const sub = cartTotal(), ship = sub >= C.freeShip ? 0 : 49;
  foot.innerHTML = `<div style="display:flex;justify-content:space-between;font-size:13.5px;color:var(--muted);margin-bottom:6px"><span>Shipping</span><span>${ship?inr(ship):'FREE'}</span></div>
    ${ship?`<div style="font-size:12px;color:var(--primaryText);margin-bottom:8px">Add ${inr(C.freeShip-sub)} more for free shipping</div>`:''}
    <div class="tot"><span>Total</span><span>${inr(sub+ship)}</span></div><button class="btn p" style="width:100%" data-act="checkout"><i class="fa-solid fa-lock"></i>Checkout · Pay with UPI</button>`;
}
function addToCart(id){ const p=prod(id); if(!p||p.stock<=0) return; const c=S.cart.find(x=>x.id===id); if(c){ if(c.qty<p.stock) c.qty++; } else S.cart.push({id,qty:1}); refreshBadges(); toast(`${p.name} added to cart`); }
function quickView(id){ const p=prod(id); p.views=(p.views||0)+1;
  openModal(`<div class="qv"><img src="${p.img}" alt="" style="object-position:${p.pos||'center'}"><div class="in"><span class="kicker">${esc(catName(p.cat))}</span><h2>${esc(p.name)}</h2>
  <div class="price"><b style="font-size:22px">${inr(p.price)}</b>${p.mrp>p.price?`<s>${inr(p.mrp)}</s><span class="off">${off(p)}% off</span>`:''}</div>
  <p>${esc(p.desc)}</p>${C.customise?`<div class="f" style="margin-bottom:14px"><label>Personalisation (name / date / message)</label><input placeholder="e.g. Happy Birthday Riya ❤️"></div><div class="f" style="margin-bottom:14px"><label>Upload your photo</label><input type="file" accept="image/*"></div>`:''}
  <div style="margin-bottom:16px">${stockLbl(p)}</div><div class="btns"><button class="btn p" data-add="${p.id}" data-close="1" ${p.stock<=0?'disabled':''}><i class="fa-solid fa-bag-shopping"></i>Add to cart</button><button class="btn s" data-wish="${p.id}"><i class="fa-regular fa-heart"></i>Wishlist</button></div>
  <div style="display:grid;gap:8px;margin-top:20px;font-size:13px;color:var(--muted)"><span><i class="fa-solid fa-truck-fast" style="width:20px;color:var(--primaryText)"></i>Dispatch in ${esc(C.dispatch)}</span><span><i class="fa-solid fa-shield-halved" style="width:20px;color:var(--primaryText)"></i>Secure UPI / card payment</span></div></div></div>`); }
function checkout(){
  const sub=cartTotal(), ship=sub>=C.freeShip?0:49;
  openModal(`<form class="form" data-act="place"><h2><i class="fa-solid fa-lock" style="color:var(--primaryText)"></i> Checkout</h2>
  <div style="font-size:13px;color:var(--muted)">${cartCount()} item(s) · Total <b style="color:var(--text)">${inr(sub+ship)}</b></div>
  <div class="f2"><div class="f"><label>Full name</label><input required placeholder="Your name"></div><div class="f"><label>WhatsApp number</label><input required placeholder="10-digit mobile" type="tel"></div></div>
  <div class="f"><label>Delivery address</label><textarea rows="2" required placeholder="House, street, area"></textarea></div>
  <div class="f2"><div class="f"><label>City</label><input required placeholder="City"></div><div class="f"><label>PIN code</label><input required placeholder="6-digit PIN"></div></div>
  <div class="f"><label>Pay with</label><div class="upi"><label><input type="radio" name="pay" checked><span>GPay</span></label><label><input type="radio" name="pay"><span>PhonePe</span></label><label><input type="radio" name="pay"><span>Paytm</span></label><label><input type="radio" name="pay"><span>Card</span></label></div></div>
  <button class="btn p" type="submit"><i class="fa-solid fa-circle-check"></i>Place order (demo)</button>
  <p style="font-size:11.5px;color:var(--muted);text-align:center">Demo checkout: no payment is taken. The order appears in the Admin panel.</p></form>`);
}
function placeOrder(form){
  const name = form.querySelector('input').value || 'Demo customer';
  const city = form.querySelectorAll('input')[2].value || 'Chennai';
  const sub=cartTotal(), ship=sub>=C.freeShip?0:49;
  S.cart.forEach(c=>{ const p=prod(c.id); p.stock=Math.max(0,p.stock-c.qty); p.sold+=c.qty; });
  const id='ORD'+(1049+S.orders.filter(o=>o.isNew).length);
  S.orders.unshift({id, name, city, items:S.cart.map(c=>({...c})), total:sub+ship, status:'New', pay:'UPI', date:new Date(), isNew:true});
  S.cart=[]; refreshBadges(); refreshGrid();
  openModal(`<div class="form" style="text-align:center;padding:40px 28px"><i class="fa-solid fa-circle-check" style="font-size:54px;color:#1a9b52"></i><h2 style="margin-top:14px">Order placed! 🎉</h2><p style="color:var(--muted);margin-top:6px">Order <b>${id}</b> · ${inr(sub+ship)}<br>Confirmation and tracking will be sent on WhatsApp.</p>
  <div class="btns" style="justify-content:center;margin-top:16px"><a class="btn p" href="#admin/orders"><i class="fa-solid fa-gauge-high"></i>See it in Admin</a><button class="btn s" data-act="close">Continue shopping</button></div></div>`);
}

function bindStore(){
  const app=$('#app');
  app.onclick = e => {
    const t = e.target.closest('[data-act],[data-add],[data-qv],[data-cat],[data-wish],[data-q],[data-rm],[data-bot]'); if(!t) return;
    if (t.dataset.add){ e.stopPropagation(); addToCart(t.dataset.add); if(t.dataset.close) closeAll(); return; }
    if (t.dataset.wish){ e.stopPropagation(); const id=t.dataset.wish; S.wish.has(id)?S.wish.delete(id):S.wish.add(id); refreshBadges(); refreshGrid(); toast(S.wish.has(id)?'Saved to wishlist':'Removed from wishlist','fa-heart'); return; }
    if (t.dataset.qv) return quickView(t.dataset.qv);
    if (t.dataset.cat){ S.filter=t.dataset.cat; refreshGrid(); if(t.classList.contains('cat')) $('#shop').scrollIntoView({behavior:'smooth'}); return; }
    if (t.dataset.q){ const c=S.cart.find(x=>x.id===t.dataset.q); c.qty+= +t.dataset.d; if(c.qty<1) S.cart=S.cart.filter(x=>x!==c); if(c.qty>prod(c.id).stock) c.qty=prod(c.id).stock; renderCart(); refreshBadges(); return; }
    if (t.dataset.rm){ S.cart=S.cart.filter(x=>x.id!==t.dataset.rm); renderCart(); refreshBadges(); return; }
    if (t.dataset.bot){ const b=C.bot[+t.dataset.bot], m=$('#botmsgs'); m.insertAdjacentHTML('beforeend',`<div class="m u">${esc(b[0])}</div><div class="m">${esc(b[1])}</div>`); m.scrollTop=m.scrollHeight; return; }
    const a=t.dataset.act;
    if (a==='cart') openDrawer();
    else if (a==='close'){ if(t.tagName==='A') { closeAll(); return; } e.preventDefault(); closeAll(); }
    else if (a==='checkout') checkout();
    else if (a==='bot') $('#botbox').classList.toggle('hidden');
    else if (a==='wishlist'){ S.filter='all'; S.q=''; const ids=[...S.wish]; if(!ids.length){toast('Your wishlist is empty','fa-heart');return;} openModal(`<div class="form"><h2><i class="fa-solid fa-heart" style="color:var(--primary)"></i> Wishlist</h2>${ids.map(id=>{const p=prod(id);return `<div class="ci-row"><img src="${p.img}" alt=""><div><b>${esc(p.name)}</b><span>${inr(p.price)}</span></div><button class="add" data-add="${p.id}">Add</button></div>`}).join('')}</div>`); }
    else if (a==='enquiry') openModal(`<form class="form" data-act="enq"><h2>${esc(C.banner.cta[0])}</h2><p style="color:var(--muted);font-size:13.5px">We'll reply on WhatsApp within a few hours.</p><div class="f2"><div class="f"><label>Name</label><input required></div><div class="f"><label>WhatsApp</label><input required type="tel"></div></div><div class="f"><label>Requirement</label><textarea rows="3" placeholder="${esc(C.banner.placeholder)}"></textarea></div><button class="btn p" type="submit">Send enquiry</button></form>`);
    else if (a==='noop') e.preventDefault();
  };
  app.onsubmit = e => { e.preventDefault(); const a=e.target.dataset.act; if(a==='place') placeOrder(e.target); else if(a==='enq'){ closeAll(); toast('Enquiry sent! We will WhatsApp you soon'); } else if(a==='news'){ e.target.reset(); toast('You are on the list! 🎉'); } };
  $('#q').oninput = e => { S.q=e.target.value; refreshGrid(); };
  $('#sort').value = S.sort; $('#sort').onchange = e => { S.sort=e.target.value; refreshGrid(); };
}

// ======================= ADMIN =======================
const charts = [];
const killCharts = () => { while(charts.length) charts.pop().destroy(); };
const counts = () => { const a=S.products.filter(p=>p.active), all=S.products; return {total:all.length, active:a.length, inStock:a.filter(p=>p.stock>C.lowStock).length, low:a.filter(p=>p.stock>0&&p.stock<=C.lowStock).length, out:a.filter(p=>p.stock<=0).length, hidden:all.filter(p=>!p.active).length, units:a.reduce((s,p)=>s+Math.max(0,p.stock),0), value:a.reduce((s,p)=>s+Math.max(0,p.stock)*p.price,0)}; };
const pages = [['dashboard','fa-solid fa-chart-pie','Dashboard'],['products','fa-solid fa-box','Products'],['categories','fa-solid fa-layer-group','Categories'],['orders','fa-solid fa-receipt','Orders'],['seo','fa-solid fa-magnifying-glass-chart','SEO'],['analytics','fa-solid fa-chart-line','Analytics'],['settings','fa-solid fa-gear','Settings']];
const pillStatus = s => ({New:'p-blue',Processing:'p-amber',Shipped:'p-purple',Delivered:'p-green',Cancelled:'p-red'}[s]||'p-grey');
const stockPill = p => !p.active ? '<span class="pill p-grey"><i class="fa-solid fa-eye-slash"></i>Hidden</span>' : p.stock<=0 ? '<span class="pill p-red">Out of stock</span>' : p.stock<=C.lowStock ? '<span class="pill p-amber">Low stock</span>' : '<span class="pill p-green">In stock</span>';

function adminShell(page, body){
  const k = counts(), newO = S.orders.filter(o=>o.status==='New').length;
  const cnt = {products:k.total, categories:S.categories.length, orders:newO||''};
  return `<div class="adm">
  <aside class="side" id="side"><div class="logo">${esc(C.name)}<small>Admin panel</small></div>
    ${pages.map(p=>`<a class="${page===p[0]?'on':''}" href="#admin/${p[0]}"><i class="${p[1]}"></i>${p[2]}${cnt[p[0]]!==undefined&&cnt[p[0]]!==''?`<span class="cnt">${cnt[p[0]]}</span>`:''}</a>`).join('')}
    <a href="#"><i class="fa-solid fa-store"></i>View store</a>
    <div class="bottom">Demo admin by Codedtx<br>Data shown is sample data.</div></aside>
  <main class="main">
    <div class="mob-top" style="justify-content:space-between;align-items:center;margin-bottom:12px"><button class="abtn" data-a="menu"><i class="fa-solid fa-bars"></i></button><b>${esc(C.name)} Admin</b><a class="abtn" href="#"><i class="fa-solid fa-store"></i></a></div>
    ${body}</main>
  <div class="overlay" id="ov" data-a="close"></div><div class="modal" id="modal"><div class="box" id="mbox" style="max-width:640px"></div></div>
  <div class="toast" id="toast"></div></div>`;
}
const top = (title, sub, right='') => `<div class="topbar"><div><h1>${title}</h1><p>${sub}</p></div><div class="r">${right}<div class="avatar">${esc(C.name[0])}</div></div></div>`;

function pgDashboard(){
  const k=counts(), last=traffic.slice(-30), vis=last.reduce((s,d)=>s+d.visitors,0), newO=S.orders.filter(o=>o.isNew), ord30=last.reduce((s,d)=>s+d.orders,0)+newO.length, rev=last.reduce((s,d)=>s+d.orders,0)*C.aov+newO.reduce((s,o)=>s+o.total,0);
  const lowList=S.products.filter(p=>p.active&&p.stock<=C.lowStock).sort((a,b)=>a.stock-b.stock);
  const top5=[...S.products].sort((a,b)=>b.sold-a.sold).slice(0,5);
  return top('Dashboard', `Welcome back! Here's how ${esc(C.name)} is doing.`, `<a class="abtn" href="#"><i class="fa-solid fa-store"></i>View store</a><button class="abtn p" data-a="addp"><i class="fa-solid fa-plus"></i>Add product</button>`) + `
  <div class="kpis">
    ${kpi('fa-box','c-blue',k.total,'Total products',`${k.active} live on store`)}
    ${kpi('fa-circle-check','c-green',k.inStock,'In stock','')}
    ${kpi('fa-triangle-exclamation','c-amber',k.low,'Low stock',`≤ ${C.lowStock} units`)}
    ${kpi('fa-ban','c-red',k.out,'Out of stock','')}
    ${kpi('fa-layer-group','c-purple',S.categories.length,'Categories','')}
    ${kpi('fa-cubes','c-teal',k.units.toLocaleString('en-IN'),'Units in stock',inr(k.value)+' value')}
  </div>
  <div class="kpis">
    ${kpi('fa-receipt','c-pink',ord30,'Orders (30d)',`<span class="up">▲ 18%</span> vs last month`)}
    ${kpi('fa-indian-rupee-sign','c-green',inr(rev),'Revenue (30d)',`<span class="up">▲ 22%</span> vs last month`)}
    ${kpi('fa-users','c-blue',vis.toLocaleString('en-IN'),'Visitors (30d)',`<span class="up">▲ 31%</span> vs last month`)}
    ${kpi('fa-percent','c-amber',(ord30/vis*100).toFixed(2)+'%','Conversion rate','Visitors who ordered')}
  </div>
  <div class="row2"><div class="panel"><h3>Visitors & orders <small>Last 30 days · demo data</small></h3><div class="chart-box"><canvas id="ch1"></canvas></div></div>
    <div class="panel"><h3>Products by category <a class="abtn" style="padding:6px 10px" href="#admin/categories">Manage</a></h3><div class="bars">${catBars()}</div>
      <h3 style="margin-top:20px">Stock status</h3><div class="chart-box sm" style="height:170px"><canvas id="ch2"></canvas></div></div></div>
  <div class="row3">
    <div class="panel"><h3>Low stock alerts <small>${lowList.length} items</small></h3><div class="list">${lowList.length?lowList.map(p=>`<div class="li"><img src="${p.img}" alt=""><div class="m"><b>${esc(p.name)}</b><span>${p.stock} left</span></div><button class="abtn" style="padding:6px 10px" data-a="restock" data-id="${p.id}">+20</button></div>`).join(''):'<p class="note">All products are well stocked 🎉</p>'}</div></div>
    <div class="panel"><h3>Top selling</h3><div class="list">${top5.map((p,i)=>`<div class="li"><img src="${p.img}" alt=""><div class="m"><b>${i+1}. ${esc(p.name)}</b><span>${p.sold} sold · ${inr(p.price)}</span></div></div>`).join('')}</div></div>
    <div class="panel"><h3>Recent orders <a class="abtn" style="padding:6px 10px" href="#admin/orders">All</a></h3><div class="list">${S.orders.slice(0,5).map(o=>`<div class="li"><div class="avatar" style="width:36px;height:36px;font-size:13px">${o.name[0]}</div><div class="m"><b>${o.id} · ${esc(o.name)}</b><span>${inr(o.total)} · ${esc(o.city)}</span></div><span class="pill ${pillStatus(o.status)}">${o.status}</span></div>`).join('')}</div></div>
  </div>
  <div class="row2e"><div class="panel"><h3>SEO health <a class="abtn" style="padding:6px 10px" href="#admin/seo">Improve</a></h3>${scoreBlock(true)}</div>
    <div class="panel"><h3>Where visitors come from <small>30 days</small></h3><div class="chart-box sm"><canvas id="ch3"></canvas></div></div></div>`;
}
const kpi=(ic,c,v,l,tr)=>`<div class="kpi"><div class="ic ${c}"><i class="fa-solid ${ic}"></i></div><div><b>${v}</b><span>${l}</span>${tr?`<div class="tr" style="color:var(--a-muted)">${tr}</div>`:''}</div></div>`;
function catBars(){ const mx=Math.max(1,...S.categories.map(c=>S.products.filter(p=>p.cat===c.id).length)); return S.categories.map(c=>{const n=S.products.filter(p=>p.cat===c.id).length; return `<div class="bar-r"><span><i class="${c.icon}" style="width:18px;color:var(--a-muted)"></i>${esc(c.name)}</span><div class="tr2"><div style="width:${n/mx*100}%"></div></div><b>${n}</b></div>`}).join(''); }

function pgProducts(){
  const k=counts();
  return top('Products', `${k.total} products · ${k.active} live · ${k.low} low stock · ${k.out} out of stock`, `<button class="abtn p" data-a="addp"><i class="fa-solid fa-plus"></i>Add product</button>`) + `
  <div class="kpis">${kpi('fa-box','c-blue',k.total,'All products','')}${kpi('fa-eye','c-green',k.active,'Live on store','')}${kpi('fa-triangle-exclamation','c-amber',k.low,'Low stock','')}${kpi('fa-ban','c-red',k.out,'Out of stock','')}${kpi('fa-eye-slash','c-purple',k.hidden,'Hidden','')}</div>
  <div class="panel"><div class="tools"><input id="ps" placeholder="Search products…" style="flex:1;min-width:180px"><select id="pc"><option value="all">All categories</option>${S.categories.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select><select id="pst"><option value="all">All stock</option><option value="in">In stock</option><option value="low">Low stock</option><option value="out">Out of stock</option></select></div>
  <div class="tw"><table><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Sold</th><th>SEO</th><th></th></tr></thead><tbody id="ptb">${prodRows()}</tbody></table></div></div>`;
}
function prodRows(q='',cat='all',st='all'){
  let l=S.products.filter(p=>(cat==='all'||p.cat===cat)&&p.name.toLowerCase().includes(q.toLowerCase()));
  if(st==='in') l=l.filter(p=>p.stock>C.lowStock); if(st==='low') l=l.filter(p=>p.stock>0&&p.stock<=C.lowStock); if(st==='out') l=l.filter(p=>p.stock<=0);
  if(!l.length) return `<tr><td colspan="8" style="text-align:center;color:var(--a-muted);padding:30px">No products match</td></tr>`;
  return l.map(p=>{const sc=pSeo(p); return `<tr><td><div style="display:flex;gap:10px;align-items:center"><img class="pimg" src="${p.img}" alt=""><div><b>${esc(p.name)}</b><div style="font-size:11.5px;color:var(--a-muted)">/${slug(p.name)}</div></div></div></td><td>${esc(catName(p.cat))}</td><td><b>${inr(p.price)}</b>${p.mrp>p.price?`<div style="font-size:11.5px;color:var(--a-muted)"><s>${inr(p.mrp)}</s></div>`:''}</td><td>${p.stock}</td><td>${stockPill(p)}</td><td>${p.sold}</td><td><span class="pill ${sc>=80?'p-green':sc>=50?'p-amber':'p-red'}">${sc}</span></td><td><div class="acts"><button title="Edit" data-a="editp" data-id="${p.id}"><i class="fa-solid fa-pen"></i></button><button title="${p.active?'Hide':'Show'}" data-a="togglep" data-id="${p.id}"><i class="fa-solid fa-eye${p.active?'':'-slash'}"></i></button><button title="Delete" data-a="delp" data-id="${p.id}"><i class="fa-solid fa-trash-can"></i></button></div></td></tr>`}).join('');
}
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const pSeo = p => { let s=0; const t=p.seoTitle||'', d=p.seoDesc||''; if(t.length>=30&&t.length<=60)s+=30; else if(t)s+=15; if(d.length>=70&&d.length<=160)s+=30; else if(d)s+=15; if(p.desc&&p.desc.length>60)s+=20; if(p.img)s+=20; return s; };
function productForm(p){
  const n=!p; p=p||{id:'p'+Date.now(),name:'',cat:S.categories[0].id,price:'',mrp:'',stock:10,img:C.products[0].img,desc:'',seoTitle:'',seoDesc:'',badge:''};
  const imgs=[...new Set(C.products.map(x=>x.img))];
  return `<button class="x" data-a="close"><i class="fa-solid fa-xmark"></i></button><form class="form" id="pform" data-id="${p.id}" data-new="${n?1:''}"><h2>${n?'Add product':'Edit product'}</h2>
  <div class="f"><label>Product name</label><input name="name" required value="${esc(p.name)}"></div>
  <div class="f2"><div class="f"><label>Category</label><select name="cat">${S.categories.map(c=>`<option value="${c.id}" ${c.id===p.cat?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div><div class="f"><label>Badge (optional)</label><input name="badge" value="${esc(p.badge||'')}" placeholder="NEW / BESTSELLER"></div></div>
  <div class="f2"><div class="f"><label>Price (₹)</label><input name="price" type="number" min="1" required value="${p.price}"></div><div class="f"><label>MRP (₹, optional)</label><input name="mrp" type="number" value="${p.mrp||''}"></div></div>
  <div class="f"><label>Stock quantity</label><input name="stock" type="number" min="0" required value="${p.stock}"></div>
  <div class="f"><label>Photo</label><div style="display:flex;gap:8px;flex-wrap:wrap">${imgs.map(i=>`<label style="cursor:pointer"><input type="radio" name="img" value="${i}" ${i===p.img?'checked':''} style="display:none"><img src="${i}" style="width:56px;height:56px;border-radius:10px;object-fit:cover;border:3px solid ${i===p.img?'var(--primary)':'transparent'}" class="imgpick"></label>`).join('')}</div></div>
  <div class="f"><label>Description</label><textarea name="desc" rows="3">${esc(p.desc)}</textarea></div>
  <div style="border-top:1px solid var(--a-line);padding-top:12px"><b style="font-size:14px"><i class="fa-solid fa-magnifying-glass-chart" style="color:var(--primary)"></i> SEO for this product</b></div>
  <div class="f"><label>SEO title (30–60 characters)</label><input name="seoTitle" maxlength="70" value="${esc(p.seoTitle)}" placeholder="${esc(p.name)} | ${esc(C.name)}"><div class="cc" data-cc="seoTitle"></div></div>
  <div class="f"><label>Meta description (70–160 characters)</label><textarea name="seoDesc" rows="2" maxlength="180">${esc(p.seoDesc)}</textarea><div class="cc" data-cc="seoDesc"></div></div>
  <button class="abtn" type="button" data-a="autoseo" style="justify-self:start"><i class="fa-solid fa-wand-magic-sparkles"></i>Auto-write SEO with AI</button>
  <div style="display:flex;gap:10px;justify-content:flex-end"><button class="abtn" type="button" data-a="close">Cancel</button><button class="abtn p" type="submit"><i class="fa-solid fa-check"></i>${n?'Add product':'Save changes'}</button></div></form>`;
}
function updCC(){ $$('[data-cc]').forEach(el=>{const f=$(`#pform [name="${el.dataset.cc}"]`), n=f.value.length, [a,b]=el.dataset.cc==='seoTitle'?[30,60]:[70,160]; el.textContent=`${n} characters`+(n&&(n<a||n>b)?` · aim for ${a}–${b}`:''); el.classList.toggle('bad',n>0&&(n<a||n>b));}); }

function pgCategories(){
  return top('Categories', `${S.categories.length} categories · ${S.products.length} products`, `<button class="abtn p" data-a="addc"><i class="fa-solid fa-plus"></i>Add category</button>`) + `
  <div class="row2"><div class="panel"><h3>All categories</h3><div class="tw"><table><thead><tr><th>Category</th><th>Products</th><th>Live</th><th>Stock units</th><th>Sold</th><th>Revenue</th></tr></thead><tbody>
  ${S.categories.map(c=>{const ps=S.products.filter(p=>p.cat===c.id);return `<tr><td><b><i class="${c.icon}" style="color:var(--primary);width:22px"></i>${esc(c.name)}</b></td><td>${ps.length}</td><td>${ps.filter(p=>p.active).length}</td><td>${ps.reduce((s,p)=>s+p.stock,0)}</td><td>${ps.reduce((s,p)=>s+p.sold,0)}</td><td>${inr(ps.reduce((s,p)=>s+p.sold*p.price,0))}</td></tr>`}).join('')}</tbody></table></div></div>
  <div class="panel"><h3>Product count by category</h3><div class="chart-box"><canvas id="chc"></canvas></div></div></div>`;
}

function pgOrders(){
  const st=['New','Processing','Shipped','Delivered','Cancelled'];
  return top('Orders', `${S.orders.length} orders · ${S.orders.filter(o=>o.status==='New').length} new`, '') + `
  <div class="kpis">${st.map((s,i)=>kpi(['fa-bell','fa-gears','fa-truck-fast','fa-circle-check','fa-ban'][i],['c-blue','c-amber','c-purple','c-green','c-red'][i],S.orders.filter(o=>o.status===s).length,s,'')).join('')}</div>
  <div class="panel"><div class="tw"><table><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Date</th><th>Status</th></tr></thead><tbody>
  ${S.orders.map(o=>`<tr><td><b>${o.id}</b>${o.isNew?' <span class="pill p-pink" style="background:#ffe8f1;color:#e8457c">Just now</span>':''}</td><td>${esc(o.name)}<div style="font-size:11.5px;color:var(--a-muted)">${esc(o.city)}</div></td><td>${o.items.map(i=>`${esc((prod(i.id)||{name:'(deleted)'}).name)} × ${i.qty}`).join('<br>')}</td><td><b>${inr(o.total)}</b></td><td>${o.pay}</td><td>${o.date.toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</td><td><select data-a="ostatus" data-id="${o.id}" style="padding:6px 8px;border-radius:9px;border:1px solid var(--a-line)">${st.map(s=>`<option ${s===o.status?'selected':''}>${s}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table></div>
  <p class="note"><i class="fa-brands fa-whatsapp"></i> When status changes, the customer gets an automatic WhatsApp update (in the live version).</p></div>`;
}

function seoChecks(){
  const s=S.seo, ps=S.products.filter(p=>p.active), withMeta=ps.filter(p=>p.seoTitle&&p.seoDesc).length;
  return [
    [s.title.length>=30&&s.title.length<=60, `Homepage title is ${s.title.length} characters`, 'Aim for 30–60 characters', 15],
    [s.desc.length>=70&&s.desc.length<=160, `Meta description is ${s.desc.length} characters`, 'Aim for 70–160 characters', 15],
    [s.keywords.split(',').filter(x=>x.trim()).length>=4, `${s.keywords.split(',').filter(x=>x.trim()).length} focus keywords set`, 'Add at least 4 keywords', 10],
    [withMeta===ps.length, `${withMeta} of ${ps.length} products have SEO title & description`, 'Use "Auto-write SEO" on products', 20],
    [S.settings.sitemap, 'Sitemap.xml submitted to Google', 'Turn on sitemap', 10],
    [S.settings.robots, 'Robots.txt allows Google to crawl', 'Turn on robots.txt', 5],
    [S.settings.schema, 'Product rich results (price & stock in Google)', 'Turn on product schema', 10],
    [true, 'Mobile-friendly & fast (HTTPS, compressed images)', '', 10],
    [!!s.ogImage, 'Share image set for WhatsApp / Instagram links', 'Pick a share image', 5],
  ];
}
function scoreBlock(compact){
  const ch=seoChecks(), sc=ch.reduce((a,c)=>a+(c[0]?c[3]:0),0), col=sc>=80?'#1a9b52':sc>=55?'#e07b00':'#d63a3a';
  return `<div class="score"><div class="ring" style="background:conic-gradient(${col} ${sc*3.6}deg,#eef0f4 0)"><div><b style="color:${col}">${sc}</b><span>/ 100</span></div></div>
  <div class="checks">${(compact?ch.filter(c=>!c[0]).slice(0,4).concat(ch.filter(c=>c[0]).slice(0,Math.max(0,4-ch.filter(c=>!c[0]).length))):ch).map(c=>`<div><i class="fa-solid ${c[0]?'fa-circle-check ok':'fa-circle-xmark bad'}"></i><span>${c[1]}${!c[0]&&c[2]?` <span style="color:var(--a-muted)">— ${c[2]}</span>`:''}</span></div>`).join('')}</div></div>`;
}
function pgSeo(){
  const s=S.seo, ps=S.products;
  return top('SEO', 'Get found on Google when people search for products like yours', `<button class="abtn p" data-a="autoall"><i class="fa-solid fa-wand-magic-sparkles"></i>Auto-fix all products</button>`) + `
  <div class="row2"><div class="panel"><h3>SEO score</h3><div id="scoreb">${scoreBlock(false)}</div></div>
    <div class="panel"><h3>Top Google searches <small>Search Console · demo data</small></h3><div class="tw"><table><thead><tr><th>Keyword</th><th>Clicks</th><th>Rank</th></tr></thead><tbody>${C.keywords.map(k=>`<tr><td>${esc(k[0])}</td><td>${k[1]}</td><td><span class="pill ${k[2]<=5?'p-green':k[2]<=15?'p-amber':'p-grey'}">#${k[2]}</span></td></tr>`).join('')}</tbody></table></div></div></div>
  <div class="row2e"><div class="panel"><h3>Homepage SEO settings</h3><form class="form" style="padding:0" id="seoform">
    <div class="f"><label>Page title</label><input name="title" value="${esc(s.title)}"><div class="cc" data-sc="title"></div></div>
    <div class="f"><label>Meta description</label><textarea name="desc" rows="3">${esc(s.desc)}</textarea><div class="cc" data-sc="desc"></div></div>
    <div class="f"><label>Focus keywords (comma separated)</label><input name="keywords" value="${esc(s.keywords)}"></div>
    <div class="f"><label>Share image (WhatsApp / Instagram link preview)</label><select name="ogImage"><option value="">None</option>${[...new Set(C.products.map(p=>p.img))].map(i=>`<option value="${i}" ${i===s.ogImage?'selected':''}>${i.split('/').pop()}</option>`).join('')}</select></div>
    <button class="abtn p" type="submit" style="justify-self:start"><i class="fa-solid fa-check"></i>Save SEO settings</button></form></div>
    <div class="panel"><h3>Google preview <small>Updates as you type</small></h3><div class="serp" id="serp"></div>
      <h3 style="margin-top:18px">WhatsApp / social link preview</h3><div class="og" id="og"></div></div></div>
  <div class="panel" style="margin-bottom:16px"><h3>Product SEO <small>${ps.filter(p=>p.seoTitle&&p.seoDesc).length}/${ps.length} complete</small></h3><div class="tw"><table><thead><tr><th>Product</th><th>SEO title</th><th>Meta description</th><th>Score</th><th></th></tr></thead><tbody>
  ${ps.map(p=>{const sc=pSeo(p);return `<tr><td><div style="display:flex;gap:10px;align-items:center"><img class="pimg" src="${p.img}" alt=""><b>${esc(p.name)}</b></div></td><td style="max-width:220px;font-size:12.5px">${p.seoTitle?esc(p.seoTitle):'<span style="color:#d63a3a">Missing</span>'}</td><td style="max-width:300px;font-size:12.5px">${p.seoDesc?esc(p.seoDesc):'<span style="color:#d63a3a">Missing</span>'}</td><td><span class="pill ${sc>=80?'p-green':sc>=50?'p-amber':'p-red'}">${sc}</span></td><td><button class="abtn" style="padding:6px 10px" data-a="editp" data-id="${p.id}"><i class="fa-solid fa-pen"></i>Edit</button></td></tr>`}).join('')}</tbody></table></div></div>
  <div class="panel"><h3>Technical SEO</h3>
    ${[['sitemap','Sitemap.xml','Auto-updates when you add products and submits to Google'],['robots','Robots.txt','Lets Google crawl your store pages'],['schema','Product rich results','Shows price, stock and rating right in Google results']].map(t=>`<div class="set-row"><div><b>${t[1]}</b><span>${t[2]}</span></div><div class="toggle ${S.settings[t[0]]?'on':''}" data-a="tog" data-k="${t[0]}"></div></div>`).join('')}
    <div class="set-row"><div><b>Page speed</b><span>Images compressed · HTTPS · mobile-first</span></div><span class="pill p-green">92 / 100</span></div></div>`;
}
function renderSerp(){ const s=S.seo; const e=$('#serp'); if(!e) return; e.innerHTML=`<div class="u"><div class="fav">${esc(C.name[0])}</div><div>${esc(C.name)}<small>https://${esc(C.domain)}</small></div></div><h4>${esc(s.title.slice(0,60))}${s.title.length>60?'…':''}</h4><p>${esc(s.desc.slice(0,160))}${s.desc.length>160?'…':''}</p>`;
  $('#og').innerHTML=`${s.ogImage?`<img src="${s.ogImage}" alt="">`:'<div style="height:120px;background:#eef0f4;display:flex;align-items:center;justify-content:center;color:#999">No share image</div>'}<div><small>${esc(C.domain)}</small><br><b>${esc(s.title)}</b></div>`;
  $$('[data-sc]').forEach(el=>{const n=s[el.dataset.sc].length,[a,b]=el.dataset.sc==='title'?[30,60]:[70,160]; el.textContent=`${n} characters · aim for ${a}–${b}`; el.classList.toggle('bad',n<a||n>b);}); }

function pgAnalytics(){
  const r=S.range, d=traffic.slice(-r), vis=d.reduce((s,x)=>s+x.visitors,0), ord=d.reduce((s,x)=>s+x.orders,0), aov=C.aov, prev=traffic.slice(-2*r,-r).reduce((s,x)=>s+x.visitors,0)||vis;
  const growth=((vis-prev)/prev*100);
  const views=[...S.products].map(p=>({...p,v:Math.round(p.sold*(8+((p.id.charCodeAt(1)||3)%7)))})).sort((a,b)=>b.v-a.v).slice(0,6);
  const atc=Math.round(vis*0.11), co=Math.round(vis*0.045);
  return top('Analytics', 'Know your visitors: where they come from and what they buy', `<div class="seg">${[7,30,90].map(x=>`<button class="${r===x?'on':''}" data-a="range" data-r="${x}">${x} days</button>`).join('')}</div>`) + `
  <div class="kpis">${kpi('fa-users','c-blue',vis.toLocaleString('en-IN'),'Visitors',`<span class="${growth>=0?'up':'dn'}">${growth>=0?'▲':'▼'} ${Math.abs(growth).toFixed(0)}%</span> vs previous`)}
  ${kpi('fa-eye','c-purple',(vis*2.7|0).toLocaleString('en-IN'),'Page views','')}
  ${kpi('fa-receipt','c-pink',ord,'Orders','')}
  ${kpi('fa-indian-rupee-sign','c-green',inr(ord*aov),'Revenue','')}
  ${kpi('fa-percent','c-amber',(ord/vis*100).toFixed(2)+'%','Conversion rate','')}
  ${kpi('fa-cart-shopping','c-teal',inr(aov),'Avg. order value','')}</div>
  <div class="row2"><div class="panel"><h3>Visitors & orders <small>Daily · demo data</small></h3><div class="chart-box"><canvas id="a1"></canvas></div></div>
    <div class="panel"><h3>Traffic sources</h3><div class="chart-box"><canvas id="a2"></canvas></div></div></div>
  <div class="row3"><div class="panel"><h3>Sales funnel</h3><div class="funnel">${[['Visitors',vis],['Viewed a product',Math.round(vis*0.48)],['Added to cart',atc],['Started checkout',co],['Ordered',ord]].map(f=>`<div class="fn"><span>${f[0]}</span><div><div class="b" style="width:${Math.max(6,f[1]/vis*100)}%">${(f[1]/vis*100).toFixed(1)}%</div></div><b style="text-align:right">${f[1].toLocaleString('en-IN')}</b></div>`).join('')}</div><p class="note"><i class="fa-solid fa-robot"></i> AI cart reminders recover ~${Math.round((co-ord)*0.15)} of ${co-ord} abandoned checkouts (customers who shared their WhatsApp number).</p></div>
    <div class="panel"><h3>Devices</h3><div class="chart-box sm"><canvas id="a3"></canvas></div></div>
    <div class="panel"><h3>Top cities</h3><div class="bars">${C.cities.map(c=>`<div class="bar-r"><span>${c[0]}</span><div class="tr2"><div style="width:${c[1]}%"></div></div><b>${c[1]}%</b></div>`).join('')}</div></div></div>
  <div class="row2e"><div class="panel"><h3>Most viewed products</h3><div class="list">${views.map(p=>`<div class="li"><img src="${p.img}" alt=""><div class="m"><b>${esc(p.name)}</b><span>${p.v.toLocaleString('en-IN')} views · ${p.sold} sold · ${(p.sold/p.v*100).toFixed(1)}% conversion</span></div></div>`).join('')}</div></div>
    <div class="panel"><h3>Searches on your store</h3><div class="tw"><table><thead><tr><th>Search term</th><th>Searches</th><th>Found?</th></tr></thead><tbody>${C.siteSearch.map(s=>`<tr><td>${esc(s[0])}</td><td>${s[1]}</td><td>${s[2]?'<span class="pill p-green">Yes</span>':'<span class="pill p-amber">No results → add product?</span>'}</td></tr>`).join('')}</tbody></table></div></div></div>
  <p class="note">All numbers on this page are demo data. In the live store they come from Google Analytics 4 and your real orders.</p>`;
}

function pgSettings(){
  return top('Settings','Store, payments and integrations','') + `<div class="row2e"><div class="panel"><h3>Store details</h3><form class="form" style="padding:0" data-a="saveset"><div class="f"><label>Store name</label><input value="${esc(C.name)}"></div><div class="f"><label>Domain</label><input value="${esc(C.domain)}"></div><div class="f2"><div class="f"><label>Free shipping above (₹)</label><input type="number" value="${C.freeShip}"></div><div class="f"><label>Low stock alert at</label><input type="number" value="${C.lowStock}"></div></div><button class="abtn p" type="submit" style="justify-self:start">Save</button></form></div>
  <div class="panel"><h3>Integrations</h3>${[['ga','Google Analytics 4','Visitor tracking & reports'],['pixel','Meta Pixel','Instagram / Facebook ads tracking'],['whatsapp','WhatsApp order updates','Auto message on order & dispatch'],['ai','AI chat assistant','Answers price, stock & delivery 24/7']].map(t=>`<div class="set-row"><div><b>${t[1]}</b><span>${t[2]}</span></div><div class="toggle ${S.settings[t[0]]?'on':''}" data-a="tog" data-k="${t[0]}"></div></div>`).join('')}
  <div class="set-row"><div><b>Payments</b><span>UPI (GPay, PhonePe, Paytm) & cards via Razorpay</span></div><span class="pill p-green">Connected</span></div></div></div>`;
}

function drawCharts(page){
  killCharts(); if(!window.Chart) return;
  const P=getComputedStyle(root).getPropertyValue('--primary').trim()||'#e8457c';
  Chart.defaults.font.family='Poppins'; Chart.defaults.color='#6b7285';
  const lineData=(n)=>{const d=traffic.slice(-n); return {labels:d.map(x=>x.d.toLocaleDateString('en-IN',{day:'numeric',month:'short'})), datasets:[{label:'Visitors',data:d.map(x=>x.visitors),borderColor:P,backgroundColor:P+'22',fill:true,tension:.35,pointRadius:0,borderWidth:2.5,yAxisID:'y'},{label:'Orders',data:d.map(x=>x.orders),borderColor:'#3b6cf6',backgroundColor:'#3b6cf6',tension:.35,pointRadius:0,borderWidth:2,yAxisID:'y1'}]};};
  const lineOpt={responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'bottom',labels:{boxWidth:10,usePointStyle:true}}},scales:{x:{grid:{display:false},ticks:{maxTicksLimit:8}},y:{grid:{color:'#eef0f4'},beginAtZero:true},y1:{position:'right',grid:{display:false},beginAtZero:true}}};
  const dn=(id,labels,data,colors)=>charts.push(new Chart($(id),{type:'doughnut',data:{labels,datasets:[{data,backgroundColor:colors,borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,cutout:'66%',plugins:{legend:{position:'right',labels:{boxWidth:10,usePointStyle:true}}}}}));
  const src=[['Instagram',46],['Google search',24],['WhatsApp',16],['Direct',9],['Other',5]], srcC=[P,'#3b6cf6','#25d366','#f5b301','#b0b6c6'];
  if(page==='dashboard'){ charts.push(new Chart($('#ch1'),{type:'line',data:lineData(30),options:lineOpt})); const k=counts(); dn('#ch2',['In stock','Low stock','Out of stock'],[k.inStock,k.low,k.out],['#1a9b52','#f5b301','#d63a3a']); dn('#ch3',src.map(s=>s[0]),src.map(s=>s[1]),srcC); }
  if(page==='categories') charts.push(new Chart($('#chc'),{type:'bar',data:{labels:S.categories.map(c=>c.name),datasets:[{label:'Products',data:S.categories.map(c=>S.products.filter(p=>p.cat===c.id).length),backgroundColor:P,borderRadius:8}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false}},y:{beginAtZero:true,ticks:{precision:0}}}}}));
  if(page==='analytics'){ charts.push(new Chart($('#a1'),{type:'line',data:lineData(S.range),options:lineOpt})); dn('#a2',src.map(s=>s[0]),src.map(s=>s[1]),srcC); dn('#a3',['Mobile','Desktop','Tablet'],[78,18,4],[P,'#3b6cf6','#f5b301']); }
}

function autoSeo(p){ p.seoTitle=`${p.name} | ${C.seoSuffix}`.slice(0,60); p.seoDesc=`Buy ${p.name.toLowerCase()} online from ${C.name} at ${inr(p.price)}. ${C.seoPitch}`.slice(0,158); }

function renderAdmin(page){
  if(!S.admin){ $('#app').innerHTML=`<div class="login"><div class="box"><div class="logo">${esc(C.name)}</div><b>Admin panel</b><p>Manage products, orders, SEO and analytics in one place.</p><button class="btn p" style="width:100%" data-a="login"><i class="fa-solid fa-right-to-bracket"></i>Enter demo admin</button><p style="font-size:11.5px;margin-top:14px">Demo only · no password needed · sample data</p><a href="#" style="font-size:13px;color:var(--primary)"><i class="fa-solid fa-arrow-left"></i> Back to store</a></div></div><div class="toast" id="toast"></div>`; return; }
  const body={dashboard:pgDashboard,products:pgProducts,categories:pgCategories,orders:pgOrders,seo:pgSeo,analytics:pgAnalytics,settings:pgSettings}[page]||pgDashboard;
  $('#app').innerHTML=adminShell(page, body()); window.scrollTo(0,0);
  if(page==='seo') renderSerp();
  drawCharts(page);
}
function openAModal(html){ $('#mbox').innerHTML=html; $('#modal').classList.add('on'); $('#ov').classList.add('on'); }
function bindAdmin(page){
  const app=$('#app');
  app.onclick = e => {
    const t=e.target.closest('[data-a]'); if(!t) return; const a=t.dataset.a, id=t.dataset.id;
    if(a==='login'){ S.admin=true; renderAdmin(page); bindAdmin(page); return; }
    if(a==='close'){ $$('.modal,.overlay').forEach(x=>x.classList.remove('on')); return; }
    if(a==='menu'){ $('#side').classList.toggle('on'); return; }
    if(a==='addp'||a==='editp'){ openAModal(productForm(a==='editp'?prod(id):null)); updCC(); return; }
    if(a==='autoseo'){ const f=$('#pform'); const tmp={name:f.name.value||'Product',price:+f.price.value||0}; autoSeo(tmp); f.seoTitle.value=tmp.seoTitle; f.seoDesc.value=tmp.seoDesc; updCC(); toast('SEO written by AI ✨','fa-wand-magic-sparkles'); return; }
    if(a==='togglep'){ const p=prod(id); p.active=!p.active; rerender(); toast(p.active?'Product is live on store':'Product hidden from store'); return; }
    if(a==='delp'){ if(confirm('Delete this product from the demo store?')){ S.products=S.products.filter(p=>p.id!==id); rerender(); toast('Product deleted','fa-trash-can'); } return; }
    if(a==='restock'){ prod(id).stock+=20; rerender(); toast('Stock updated: +20 units'); return; }
    if(a==='addc'){ const n=prompt('New category name'); if(n){ S.categories.push({id:'c'+Date.now(),name:n,icon:'fa-solid fa-tag'}); rerender(); toast('Category added'); } return; }
    if(a==='autoall'){ S.products.forEach(p=>{ if(!p.seoTitle||!p.seoDesc) autoSeo(p); }); S.settings.sitemap=S.settings.schema=S.settings.robots=true; if(!S.seo.ogImage) S.seo.ogImage=C.products[0].img; rerender(); toast('All products optimised for Google ✨','fa-wand-magic-sparkles'); return; }
    if(a==='tog'){ S.settings[t.dataset.k]=!S.settings[t.dataset.k]; t.classList.toggle('on'); if(page==='seo'){ $('#scoreb').innerHTML=scoreBlock(false);} return; }
    if(a==='range'){ S.range=+t.dataset.r; rerender(); return; }
  };
  app.onchange = e => {
    const t=e.target;
    if(t.dataset.a==='ostatus'){ S.orders.find(o=>o.id===t.dataset.id).status=t.value; toast(`Order ${t.dataset.id} → ${t.value}`,'fa-brands fa-whatsapp'); return; }
    if(t.name==='img'){ $$('.imgpick').forEach(i=>i.style.borderColor='transparent'); t.nextElementSibling.style.borderColor='var(--primary)'; }
    if(['ps','pc','pst'].includes(t.id)) $('#ptb').innerHTML=prodRows($('#ps').value,$('#pc').value,$('#pst').value);
    if(t.form&&t.form.id==='seoform'&&t.name==='ogImage'){ S.seo.ogImage=t.value; renderSerp(); $('#scoreb').innerHTML=scoreBlock(false); }
  };
  app.oninput = e => {
    const t=e.target;
    if(t.id==='ps') $('#ptb').innerHTML=prodRows(t.value,$('#pc').value,$('#pst').value);
    if(t.form&&t.form.id==='pform') updCC();
    if(t.form&&t.form.id==='seoform'&&t.name!=='ogImage'){ S.seo[t.name]=t.value; renderSerp(); $('#scoreb').innerHTML=scoreBlock(false); }
  };
  app.onsubmit = e => {
    e.preventDefault(); const f=e.target;
    if(f.id==='pform'){ const d=Object.fromEntries(new FormData(f)); const isNew=!!f.dataset.new;
      const p=isNew?{id:f.dataset.id,sold:0,views:0,active:true,isNew:true}:prod(f.dataset.id);
      Object.assign(p,{name:d.name,cat:d.cat,badge:d.badge,price:+d.price,mrp:+d.mrp||0,stock:+d.stock,img:d.img||p.img,desc:d.desc,seoTitle:d.seoTitle,seoDesc:d.seoDesc});
      if(isNew) S.products.unshift(p); $$('.modal,.overlay').forEach(x=>x.classList.remove('on')); rerender(); toast(isNew?'Product added · live on your store':'Product saved'); return; }
    if(f.id==='seoform'){ $('#scoreb').innerHTML=scoreBlock(false); toast('SEO settings saved'); document.title=S.seo.title; return; }
    toast('Saved');
  };
  function rerender(){ renderAdmin(page); }
}

// ======================= ROUTER =======================
function route(){
  const h=location.hash.replace('#','');
  if(h.startsWith('admin')){ const page=h.split('/')[1]||'dashboard'; renderAdmin(page); bindAdmin(page); }
  else { killCharts(); if(!$('.s-head')){ $('#app').innerHTML=storeHTML()+'<div class="toast" id="toast"></div>'; bindStore(); } else { refreshGrid(); refreshBadges(); }
    if(h && h!=='top'){ const el=document.getElementById(h); if(el) setTimeout(()=>el.scrollIntoView(),30); } }
}
window.addEventListener('hashchange', ()=>{ const h=location.hash; if(!h.startsWith('#admin') && $('.adm,.login')) $('#app').innerHTML=''; route(); });
document.addEventListener('keydown', e=>{ if(e.key==='Escape') $$('.drawer,.modal,.overlay').forEach(x=>x.classList.remove('on')); });
route();
})();

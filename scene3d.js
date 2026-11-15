/* Ishi's Brownies: scroll-driven 3D scenes (three.js, loaded from CDN).
   1) hero       - a plate of brownies you can drag to turn
   2) #sixbox    - a gift box opens and six brownies drop into their bays
   3) #breakopen - a brownie pulls apart to show the fudgy middle
   Brownies are built procedurally: an uneven slab with a crackled glossy crust
   (colour + normal + roughness maps painted in code), porous cut sides and torn faces.
   If WebGL or the CDN is unavailable the page keeps its flat fallbacks. */
(() => {
  const SRC = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';
  const six = document.querySelector('#sixbox'), bo = document.querySelector('#breakopen'), heroR = document.querySelector('.hero-r');
  if (!six && !bo && !heroR) return;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const outCubic = t => 1 - Math.pow(1 - t, 3);
  const inOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const rng = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const progress = sec => { const total = sec.offsetHeight - innerHeight; return total > 0 ? clamp(-sec.getBoundingClientRect().top / total) : 0; };

  /* ---------- noise ---------- */
  const hash2 = (x, y) => { const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return h - Math.floor(h); };
  const vnoise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); return lerp(lerp(hash2(xi, yi), hash2(xi + 1, yi), u), lerp(hash2(xi, yi + 1), hash2(xi + 1, yi + 1), u), v); };
  const fbm = (x, y, o = 4) => { let a = .5, f = 1, s = 0, n = 0; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); n += a; a *= .5; f *= 2.03; } return s / n; };
  const voronoi = (u, v) => { /* returns [F1, F2, cellId] */
    const cx = Math.floor(u), cy = Math.floor(v); let f1 = 9, f2 = 9, id = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const gx = cx + i, gy = cy + j, d = Math.hypot(u - gx - hash2(gx, gy), v - gy - hash2(gy + 17.3, gx + 5.1));
      if (d < f1) { f2 = f1; f1 = d; id = hash2(gx * 1.3 + 2, gy * .7 + 9); } else if (d < f2) f2 = d;
    }
    return [f1, f2, id];
  };

  /* ---------- painted texture sets: colour, height (-> normal), roughness ---------- */
  const S = 512;
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = S; return c; };
  const hex = h => [h >> 16 & 255, h >> 8 & 255, h & 255];
  function normalFrom(hc, str) {
    const src = hc.getContext('2d').getImageData(0, 0, S, S).data, out = mk(), ox = out.getContext('2d'), img = ox.createImageData(S, S), d = img.data;
    const H = (x, y) => src[(((y + S) % S) * S + ((x + S) % S)) * 4];
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const dx = (H(x + 1, y) - H(x - 1, y)) / 255 * str, dy = (H(x, y + 1) - H(x, y - 1)) / 255 * str, l = Math.hypot(dx, dy, 1), i = (y * S + x) * 4;
      d[i] = (-dx / l * .5 + .5) * 255; d[i + 1] = (dy / l * .5 + .5) * 255; d[i + 2] = (1 / l * .5 + .5) * 255; d[i + 3] = 255;
    }
    ox.putImageData(img, 0, 0); return out;
  }
  let crustBase;
  function getCrust() { /* crackled paper-thin crust: plates separated by fissures */
    if (crustBase) return crustBase;
    const crack = new Float32Array(S * S), plate = new Float32Array(S * S), hh = new Float32Array(S * S), lip = new Float32Array(S * S);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const u = x / S * 6.5, v = y / S * 6.5, wu = u + (fbm(u * 1.7 + 3, v * 1.7) - .5) * 1.2, wv = v + (fbm(u * 1.7, v * 1.7 + 7) - .5) * 1.2;
      const [f1, f2, id] = voronoi(wu, wv), e = f2 - f1, wide = .05 + fbm(u * 1.3 + 9, v * 1.3) * .12, i = y * S + x;
      const c = 1 - smooth(0, wide, e), l = smooth(wide, wide + .03, e) * (1 - smooth(wide + .03, wide + .13, e));
      crack[i] = c; plate[i] = id; lip[i] = l;
      hh[i] = (1 - c) * (.55 + id * .25) + l * .12 + fbm(u * 7, v * 7) * .12;
    }
    return crustBase = {crack, plate, hh, lip};
  }
  const PAL = {
    fudge:{a:0x6a3d22, b:0x8e5c38, c:0x22100a}, swirl:{a:0x6a3d22, b:0x8e5c38, c:0x22100a}, kinder:{a:0x7c4b2d, b:0x9a663f, c:0x2c150c},
    biscoff:{a:0xb0763f, b:0xd29c5d, c:0x6a3c1b}, party:{a:0x6a3d22, b:0x8a5835, c:0x22100a}, nutty:{a:0x70432a, b:0x8e5c38, c:0x24110a},
    love:{a:0x6a3d22, b:0x8a5835, c:0x22100a}, rose:{a:0x74452a, b:0x93603b, c:0x26120b}
  };
  const topCache = {};
  function paintTop(kind, seed) {
    if (topCache[kind]) return topCache[kind];
    const {crack, plate, hh, lip} = getCrust(), P = PAL[kind], A = hex(P.a), B = hex(P.b), C = hex(P.c);
    const col = mk(), hgt = mk(), rgh = mk(), cx = col.getContext('2d'), hx = hgt.getContext('2d'), rx = rgh.getContext('2d');
    const ci = cx.createImageData(S, S), hi = hx.createImageData(S, S), ri = rx.createImageData(S, S);
    for (let i = 0; i < S * S; i++) {
      const x = i % S, y = i / S | 0, t = clamp(plate[i] * .75 + fbm(x / 40, y / 40) * .5 - .1), k = crack[i], sp = (hash2(x, y) - .5) * 14, o = i * 4;
      for (let ch = 0; ch < 3; ch++) ci.data[o + ch] = clamp(lerp(lerp(A[ch], B[ch], t) + lip[i] * 34, C[ch], k) + sp, 0, 255);
      const h = hh[i] * 255, r = lerp(.26 + plate[i] * .22, .9, k) * 255;
      hi.data[o] = hi.data[o + 1] = hi.data[o + 2] = h; ri.data[o] = ri.data[o + 1] = ri.data[o + 2] = r; ci.data[o + 3] = hi.data[o + 3] = ri.data[o + 3] = 255;
    }
    cx.putImageData(ci, 0, 0); hx.putImageData(hi, 0, 0); rx.putImageData(ri, 0, 0);
    /* toppings are drawn into all three maps so they sit proud of the crust and catch the light */
    const r = rng(seed), g = v => `rgb(${v},${v},${v})`;
    [cx, hx, rx].forEach(c => { c.lineCap = c.lineJoin = 'round'; });
    const each = (fn, c, h, ro) => { fn(cx, c); fn(hx, g(h)); fn(rx, g(ro * 255 | 0)); };
    const blob = (c, s, h, ro) => { const px = 30 + r() * (S - 60), py = 30 + r() * (S - 60), a = r() * 3, k = .55 + r() * .3; cx.save(); cx.translate(px + 3, py + 5); cx.rotate(a); cx.fillStyle = 'rgba(0,0,0,.35)'; cx.beginPath(); cx.ellipse(0, 0, s, s * k, 0, 0, 7); cx.fill(); cx.restore(); each((x, f) => { x.save(); x.translate(px, py); x.rotate(a); x.fillStyle = f; x.beginPath(); x.ellipse(0, 0, s, s * k, 0, 0, 7); x.fill(); x.restore(); }, c, h, ro); cx.save(); cx.translate(px, py); cx.rotate(a); cx.fillStyle = 'rgba(255,255,255,.2)'; cx.beginPath(); cx.ellipse(-s * .25, -s * .2, s * .4, s * .15, 0, 0, 7); cx.fill(); cx.restore(); };
    const wave = (c, w, n, amp, h, ro) => { for (let i = 0; i < n; i++) { const y0 = S * (i + .5) / n + (r() - .5) * 30, ph = r() * 6, fq = 40 + r() * 16; each((x, f) => { x.beginPath(); for (let px = -20; px <= S + 20; px += 10) x.lineTo(px, y0 + Math.sin(px / fq + ph) * amp); x.strokeStyle = f; x.lineWidth = w; x.stroke(); }, c, h, ro); cx.beginPath(); for (let px = -20; px <= S + 20; px += 10) cx.lineTo(px, y0 - w * .22 + Math.sin(px / fq + ph) * amp); cx.strokeStyle = 'rgba(255,255,255,.22)'; cx.lineWidth = w * .22; cx.stroke(); } };
    if (kind === 'fudge') for (let i = 0; i < 26; i++) { const px = r() * S, py = r() * S; each((x, f) => { x.fillStyle = f; x.fillRect(px, py, 3 + r() * 3, 3 + r() * 3); }, 'rgba(255,250,240,.95)', 235, .3); } /* sea salt */
    if (kind === 'swirl') wave('#a06d3e', 30, 3, 32, 215, .28);
    if (kind === 'kinder') { for (let i = 0; i < 6; i++) { const px = 70 + r() * (S - 140), py = 70 + r() * (S - 140), a = r() * 3; cx.save(); cx.translate(px + 4, py + 6); cx.rotate(a); cx.fillStyle = 'rgba(0,0,0,.35)'; cx.fillRect(-56, -22, 112, 44); cx.restore(); each((x, f) => { x.save(); x.translate(px, py); x.rotate(a); x.fillStyle = f; x.fillRect(-56, -22, 112, 44); x.restore(); }, '#7c4526', 235, .3); each((x, f) => { x.save(); x.translate(px, py); x.rotate(a); x.strokeStyle = f; x.lineWidth = 4; for (let k = -1; k <= 1; k++) { x.beginPath(); x.moveTo(k * 28, -22); x.lineTo(k * 28, 22); x.stroke(); } x.restore(); }, '#3e1e0f', 150, .5); } wave('#f7ecda', 9, 5, 26, 225, .35); }
    if (kind === 'biscoff') { for (let i = 0; i < 240; i++) { const px = r() * S, py = r() * S, s = 3 + r() * 9, c = ['#8a5527', '#e0aa66', '#6e3f1b', '#edc588'][r() * 4 | 0]; each((x, f) => { x.fillStyle = f; x.beginPath(); x.ellipse(px, py, s, s * .7, 0, 0, 7); x.fill(); }, c, 170 + r() * 70 | 0, .8); } wave('#8a5024', 11, 4, 22, 215, .25); }
    if (kind === 'party') { wave('#f7ecda', 7, 4, 20, 220, .35); for (let i = 0; i < 120; i++) { const px = r() * S, py = r() * S, a = r() * 6.3, l = 9 + r() * 7, c = ['#ff8fa3', '#ffd166', '#8ecae6', '#b8e986', '#ffffff', '#c9a0ff'][r() * 6 | 0]; each((x, f) => { x.strokeStyle = f; x.lineWidth = 6; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }, c, 245, .35); } }
    if (kind === 'nutty') for (let i = 0; i < 44; i++) blob(['#e8cb9c', '#d2a56c', '#f1ddb6', '#bd8a4e'][r() * 4 | 0], 12 + r() * 13, 245, .55);
    const glyph = (ch, c, n, size, h, ro) => { for (let i = 0; i < n; i++) { const px = 50 + r() * (S - 100), py = 60 + r() * (S - 100), a = (r() - .5) * .8; each((x, f) => { x.save(); x.translate(px, py); x.rotate(a); x.fillStyle = f; x.font = `${size}px serif`; x.textAlign = 'center'; x.fillText(ch, 0, 0); x.restore(); }, c[i % c.length], h, ro); } };
    if (kind === 'love') { wave('#f7ecda', 6, 3, 18, 220, .35); glyph('♥', ['#e8617a', '#f08ea0', '#d94a66'], 12, 64, 240, .3); }
    if (kind === 'rose') { for (let i = 0; i < 9; i++) blob(['#7fa35a', '#6a8f49'][i % 2], 14 + r() * 8, 215, .6); for (let i = 0; i < 12; i++) blob(['#e79aa8', '#d9778c', '#f3c1c9'][i % 3], 26 + r() * 16, 250, .45); glyph('✿', ['#c75f78', '#b84e69'], 10, 44, 255, .45); }
    return topCache[kind] = {col, nrm:normalFrom(hgt, 5.5), rgh};
  }
  /* flat, pre-lit picture of a brownie top (for the Build-a-box bays and flavour chips) */
  function topPicture(kind) {
    const s = paintTop(kind, SEEDS[kind]), c = s.col.getContext('2d').getImageData(0, 0, S, S), n = s.nrm.getContext('2d').getImageData(0, 0, S, S).data, d = c.data;
    for (let i = 0; i < d.length; i += 4) { const nx = n[i] / 127.5 - 1, ny = n[i + 1] / 127.5 - 1, nz = n[i + 2] / 127.5 - 1, l = clamp(.5 + .75 * (nx * -.45 + ny * .5 + nz * .74), .25, 1.5); d[i] *= l; d[i + 1] *= l; d[i + 2] *= l; }
    const full = mk(); full.getContext('2d').putImageData(c, 0, 0);
    const out = document.createElement('canvas'); out.width = out.height = 256; out.getContext('2d').drawImage(full, 0, 0, 256, 256);
    return out.toDataURL('image/jpeg', .86);
  }
  const SEEDS = {fudge:88, swirl:95, kinder:102, biscoff:109, party:116, nutty:123, love:130, rose:137};
  const FLAVOUR_KIND = {'Classic Fudge':'fudge', 'Nutella Swirl':'swirl', 'Loaded Kinder':'kinder', 'Biscoff Crunch':'biscoff', 'Birthday Special':'party', 'Nutty Delight':'nutty', 'Love Note':'love', 'Rose & Heart':'rose'};
  setTimeout(() => { /* hand the painted tops to the box builder */
    if (typeof FLAVOURS === 'undefined') return;
    FLAVOURS.forEach(f => { const k = FLAVOUR_KIND[f.n]; if (k) f.top = topPicture(k); });
    document.querySelectorAll('#chips .chip').forEach(c => { const f = FLAVOURS[c.dataset.i]; if (f && f.top) c.querySelector('img').src = f.top; });
    if (typeof renderBays === 'function') renderBays();
  }, 60);
  let crumbSet;
  function paintCrumb() { /* the moist, porous inside of a cut brownie; the top edge carries the crust line */
    if (crumbSet) return crumbSet;
    const col = mk(), hgt = mk(), rgh = mk(), cx = col.getContext('2d'), hx = hgt.getContext('2d'), rx = rgh.getContext('2d');
    const ci = cx.createImageData(S, S), hi = hx.createImageData(S, S), ri = rx.createImageData(S, S), A = hex(0x2d140a), B = hex(0x5e321a), K = hex(0x7d4b2b);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const u = x / S, v = y / S, n = fbm(u * 7, v * 7), [f1, , id] = voronoi(u * 34 + (n - .5) * 2, v * 34);
      const pore = id > .4 ? (1 - smooth(.1 + id * .12, .3 + id * .12, f1)) : 0, gloss = smooth(.52, .72, fbm(u * 4 + 11, v * 12 + 3));
      const crust = 1 - smooth(8, 20, y + (fbm(u * 20, 3) - .5) * 10), o = (y * S + x) * 4, sp = (hash2(x, y) - .5) * 12;
      for (let ch = 0; ch < 3; ch++) ci.data[o + ch] = clamp(lerp(lerp(A[ch], B[ch], n) * (1 - pore * .78) + gloss * 16, K[ch], crust) + sp, 0, 255);
      const h = clamp(.45 + (n - .5) * .7 - pore * .6 + crust * .4) * 255, ro = lerp(lerp(.82, .3, gloss), .4, crust) * 255;
      hi.data[o] = hi.data[o + 1] = hi.data[o + 2] = h; ri.data[o] = ri.data[o + 1] = ri.data[o + 2] = ro; ci.data[o + 3] = hi.data[o + 3] = ri.data[o + 3] = 255;
    }
    cx.putImageData(ci, 0, 0); hx.putImageData(hi, 0, 0); rx.putImageData(ri, 0, 0);
    return crumbSet = {col, nrm:normalFrom(hgt, 6), rgh};
  }
  function paintLid() {
    const W = 1024, H = 720, c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d'); x.fillStyle = '#f6eee1'; x.fillRect(0, 0, W, H);
    const r = rng(7); for (let i = 0; i < 500; i++) { x.fillStyle = `rgba(120,90,60,${r() * .035})`; x.fillRect(r() * W, r() * H, 2 + r() * 40, 1); }
    x.textBaseline = 'middle'; x.textAlign = 'left';
    x.font = "600 118px Fraunces, Georgia, serif"; const a = "Ishi's ", wa = x.measureText(a).width;
    x.font = "italic 400 118px Fraunces, Georgia, serif"; const b = 'Brownies', wb = x.measureText(b).width, x0 = (W - wa - wb) / 2;
    x.fillStyle = '#3a2014'; x.font = "600 118px Fraunces, Georgia, serif"; x.fillText(a, x0, H / 2 - 20);
    x.fillStyle = '#b06e30'; x.font = "italic 400 118px Fraunces, Georgia, serif"; x.fillText(b, x0 + wa, H / 2 - 20);
    x.textAlign = 'center'; x.fillStyle = '#8a6a50'; x.font = "500 30px Poppins, system-ui, sans-serif";
    x.fillText('HOMEMADE  ·  BANGALORE'.split('').join('  '), W / 2, H / 2 + 80);
    x.strokeStyle = 'rgba(176,110,48,.55)'; x.lineWidth = 3; x.strokeRect(34, 34, W - 68, H - 68);
    return c;
  }

  import(SRC).then(async THREE => {
    try { await Promise.race([Promise.all([document.fonts.load("600 80px Fraunces"), document.fonts.load("italic 400 80px Fraunces"), document.fonts.load("500 30px Poppins")]), new Promise(r => setTimeout(r, 1500))]); } catch (e) {}
    const scenes = [];
    const tex = (canvas, srgb, repeat) => { const t = new THREE.CanvasTexture(canvas); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };

    function makeStage(canvas, {fov, cam, look, shadow = .22}) {
      const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
      const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(fov, 1, .1, 60);
      /* a tiny studio of soft-boxes, baked into an environment map for glossy highlights */
      const pm = new THREE.PMREMGenerator(renderer), studio = new THREE.Scene();
      studio.add(new THREE.Mesh(new THREE.SphereGeometry(30, 24, 12), new THREE.MeshBasicMaterial({color:0xb9a48f, side:THREE.BackSide})));
      const box = (col, k, w, h, p) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({color:new THREE.Color(col).multiplyScalar(k), side:THREE.DoubleSide, toneMapped:false})); m.position.set(p[0], p[1], p[2]); m.lookAt(0, 0, 0); studio.add(m); };
      box(0xffffff, 9, 12, 12, [7, 12, 6]); box(0xfff0dc, 4, 9, 7, [-12, 6, 3]); box(0xffe2c0, 2.5, 14, 5, [0, 4, -14]); box(0xffffff, 3, 6, 6, [2, 3, 13]);
      scene.environment = pm.fromScene(studio, .04).texture; scene.environmentIntensity = .75; pm.dispose();
      scene.add(new THREE.HemisphereLight(0xfff4e6, 0x8a6a52, .55));
      const sun = new THREE.DirectionalLight(0xfff1dc, 2.6); sun.position.set(3.5, 7, 4.5); sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, {left:-6, right:6, top:6, bottom:-6, near:.5, far:24});
      sun.shadow.bias = -.0004; sun.shadow.normalBias = .02; sun.shadow.radius = 6; scene.add(sun);
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({opacity:shadow}));
      ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
      const fit = () => {
        const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
        renderer.setSize(w, h, false); camera.aspect = w / h;
        const k = Math.max(1, 1.2 / camera.aspect); camera.position.set(cam[0] * k, cam[1] * k, cam[2] * k);
        camera.lookAt(look[0], look[1], look[2]); camera.updateProjectionMatrix();
      };
      new ResizeObserver(fit).observe(canvas); fit();
      /* per-stage material factory (textures are painted once and reused) */
      const mats = {};
      const crumb = () => { if (mats.crumb) return mats.crumb; const s = paintCrumb(), o = {map:tex(s.col, 1, 1), normalMap:tex(s.nrm, 0, 1), roughnessMap:tex(s.rgh, 0, 1), side:THREE.DoubleSide};
        mats.torn = new THREE.MeshStandardMaterial({...o, normalScale:new THREE.Vector2(1.9, 1.9), roughness:.78, color:0xfff0e6});
        return mats.crumb = new THREE.MeshStandardMaterial({...o, normalScale:new THREE.Vector2(1.1, 1.1), roughness:1, color:0xe9d6c8}); };
      const brownieMats = (kind, seed) => { const k = 'top_' + kind; if (!mats[k]) { const s = paintTop(kind, seed); mats[k] = new THREE.MeshStandardMaterial({map:tex(s.col, 1), normalMap:tex(s.nrm), roughnessMap:tex(s.rgh), normalScale:new THREE.Vector2(1.5, 1.5), roughness:1, side:THREE.DoubleSide}); } const c = crumb(); return [mats[k], c, mats.torn]; };
      const choc = new THREE.MeshStandardMaterial({color:0x2a1208, roughness:.27}), crumbBit = new THREE.MeshStandardMaterial({color:0x4a2614, roughness:.85});
      return {renderer, scene, camera, brownieMats, choc, crumbBit};
    }
    const shadowed = m => { m.castShadow = m.receiveShadow = true; return m; };

    /* ---------- brownie slab: uneven top, bellied cut sides, optional torn edge ---------- */
    function slab({w = 1, d = 1, h = .42, cutL, cutR, seg = 40, hs = 10, seed = 1}) {
      const xl = z => cutL ? cutL(z) : -w / 2, xr = z => cutR ? cutR(z) : w / 2;
      const topY = (x, z) => {
        let e = Math.min(z + d / 2, d / 2 - z); if (!cutL) e = Math.min(e, x + w / 2); if (!cutR) e = Math.min(e, w / 2 - x);
        const edge = 1 - smooth(0, .08, e);
        return h / 2 + (fbm(x * 2.6 + seed * 3.1, z * 2.6 + seed) - .5) * .075 + (fbm(x * 11 + seed, z * 11) - .5) * .018 - edge * edge * .04;
      };
      const pos = [], uv = [], idx = [], groups = []; let start = 0;
      const grid = (nu, nv, fn) => {
        const base = pos.length / 3;
        for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const p = fn(i / nu, j / nv); pos.push(p[0], p[1], p[2]); uv.push(p[3], p[4]); }
        for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = base + j * (nu + 1) + i, b = a + 1, c = a + nu + 1; idx.push(a, c, b, b, c, c + 1); }
      };
      const close = m => { if (idx.length > start) groups.push([start, idx.length - start, m]); start = idx.length; };
      grid(seg, seg, (s, t) => { const z = lerp(-d / 2, d / 2, t), x = lerp(xl(z), xr(z), s); return [x, topY(x, z), z, x / w + .5, z / d + .5]; }); close(0);
      const wall = (pt, nx, nz, torn, k) => {
        const L = [0]; for (let i = 1; i <= seg; i++) { const a = pt((i - 1) / seg), b = pt(i / seg); L.push(L[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
        grid(seg, hs, (s, f) => {
          const p = pt(s), y = lerp(-h / 2, topY(p[0], p[1]), f), win = Math.sin(f * Math.PI) * smooth(0, .06, s) * smooth(0, .06, 1 - s);
          const n = torn ? (fbm(s * 9 + seed * 5 + k, f * 5 + seed) - .5) * .12 + (fbm(s * 31 + k, f * 17 + seed) - .5) * .04 : (fbm(s * 7 + seed + k * 3, f * 4) - .5) * .022 + .007;
          return [p[0] + nx * n * win, y, p[1] + nz * n * win, L[Math.round(s * seg)] + seed * .37 + k * .21, 1 - (1 - f) * h];
        });
      };
      const zAt = s => lerp(-d / 2, d / 2, s);
      wall(s => [lerp(xl(-d / 2), xr(-d / 2), s), -d / 2], 0, -1, false, 1); wall(s => [lerp(xl(d / 2), xr(d / 2), s), d / 2], 0, 1, false, 2);
      if (!cutL) wall(s => [xl(zAt(s)), zAt(s)], -1, 0, false, 3); if (!cutR) wall(s => [xr(zAt(s)), zAt(s)], 1, 0, false, 4);
      grid(6, 6, (s, t) => { const z = zAt(t), x = lerp(xl(z), xr(z), s); return [x, -h / 2, z, x + .5, z + .5]; }); close(1);
      if (cutL) wall(s => [xl(zAt(s)), zAt(s)], -1, 0, true, 5); if (cutR) wall(s => [xr(zAt(s)), zAt(s)], 1, 0, true, 6); close(2);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      groups.forEach(q => g.addGroup(q[0], q[1], q[2])); g.computeVertexNormals();
      return {geo:g, topY, xl, xr, h};
    }
    const chunkGeo = seed => { /* a chopped piece of chocolate: faceted and irregular */
      const g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + (hash2(Math.round(x * 40) + seed, Math.round(y * 40) * 3 + Math.round(z * 40) * 7) - .5) * .6; p.setXYZ(i, x * k, y * k * .62, z * k); }
      g.computeVertexNormals(); return g;
    };
    const chunks = [chunkGeo(1), chunkGeo(5), chunkGeo(9)];
    /* a ready-made brownie group: slab + chocolate chunks pressed into the top */
    function brownie(stage, kind, seed, opt = {}) {
      const sl = slab({seed, ...opt}), grp = new THREE.Group(), r = rng(seed * 13 + 3);
      grp.add(shadowed(new THREE.Mesh(sl.geo, stage.brownieMats(kind, seed * 7 + 11))));
      const n = opt.chunks ?? (kind === 'fudge' ? 9 : 0), w = opt.w || 1, d = opt.d || 1;
      for (let i = 0; i < n; i++) {
        const z = (r() - .5) * d * .8, x = lerp(sl.xl(z), sl.xr(z), .12 + r() * .76), s = .035 + r() * .035;
        const m = shadowed(new THREE.Mesh(chunks[i % 3], stage.choc)); m.position.set(x, sl.topY(x, z) + s * .25, z); m.rotation.set(r() * .6, r() * 6, r() * .6); m.scale.setScalar(s * (w + d) / 2); grp.add(m);
      }
      grp.userData.slab = sl; return grp;
    }

    /* ================= 1) hero: a plate of brownies you can turn ================= */
    const heroCanvas = heroR && heroR.querySelector('canvas.gl');
    if (heroCanvas) {
      const stage = makeStage(heroCanvas, {fov:28, cam:[0, 3.6, 8.2], look:[0, .8, 0]}), {renderer, scene, camera} = stage;
      const turn = new THREE.Group(); scene.add(turn);
      const plate = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.12, .1, 96), new THREE.MeshStandardMaterial({color:0xfbf6ee, roughness:.32})));
      plate.position.y = .05; turn.add(plate);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(2.3, .022, 10, 128), new THREE.MeshStandardMaterial({color:0xd9a441, roughness:.25, metalness:.85}));
      rim.rotation.x = Math.PI / 2; rim.position.y = .1; turn.add(rim);
      const K = 1.35, BH = .42 * K, y0 = .1 + BH / 2;
      const put = (kind, seed, x, y, z, rx, ry, rz) => { const m = brownie(stage, kind, seed); m.scale.setScalar(K); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); turn.add(m); return m; };
      put('swirl', 3, -.3, y0, -.25, 0, .25, 0); put('nutty', 5, -.22, y0 + BH * .97, -.3, .02, -.32, -.02); put('fudge', 7, -.34, y0 + BH * 1.94, -.22, -.02, .55, .03);
      put('party', 9, 1.02, y0 + .26, .2, 0, -.5, 1.02); put('biscoff', 11, .35, y0, 1.3, 0, .9, 0);
      const r = rng(77);
      for (let i = 0; i < 16; i++) { const a = r() * 6.28, q = .7 + r() * 1.35, s = .025 + r() * .05; const m = shadowed(new THREE.Mesh(chunks[i % 3], i % 3 ? stage.crumbBit : stage.choc)); m.position.set(Math.cos(a) * q, .1 + s * .5, Math.sin(a) * q); m.rotation.set(r() * 3, r() * 6, r() * 3); m.scale.setScalar(s); turn.add(m); }
      let yaw = -.5, vel = 0, drag = false, lastX = 0, lastT = 0;
      heroCanvas.addEventListener('pointerdown', e => { drag = true; lastX = e.clientX; vel = 0; heroCanvas.setPointerCapture(e.pointerId); heroR.classList.add('dragging'); });
      heroCanvas.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - lastX; lastX = e.clientX; yaw += dx * .008; vel = dx * .008; });
      const up = () => { drag = false; heroR.classList.remove('dragging'); };
      heroCanvas.addEventListener('pointerup', up); heroCanvas.addEventListener('pointercancel', up);
      scenes.push({el:heroR.closest('.hero'), renderer, scene, camera, update(p, time) {
        const dt = Math.min(.05, Math.max(0, time - lastT)); lastT = time;
        if (!drag) { yaw += vel; vel *= .93; if (!still) yaw += dt * .14; }
        turn.rotation.y = yaw; turn.position.y = Math.sin(time * .8) * .03;
      }});
      heroR.classList.add('is-3d');
    }

    /* ================= 2) box fills, one brownie at a time ================= */
    if (six) {
      const canvas = six.querySelector('canvas'), items = [...six.querySelectorAll('.six-list li')];
      const stage = makeStage(canvas, {fov:30, cam:[0, 7.2, 8.4], look:[0, .8, -.55], shadow:.3}), {renderer, scene, camera} = stage;
      const box = new THREE.Group(); scene.add(box);
      const CELL = 1.1, IW = CELL * 3, ID = CELL * 2, T = .07, H = .56, BH = .42 * .92;
      const kraft = new THREE.MeshStandardMaterial({color:0xb98857, roughness:.9}), cream = new THREE.MeshStandardMaterial({color:0xf6eee1, roughness:.85});
      const part = (w, h, d, x, y, z, mats) => { const m = shadowed(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats)); m.position.set(x, y, z); box.add(m); return m; };
      const faces = out => [0, 1, 2, 3, 4, 5].map(i => i === out ? kraft : cream);
      part(IW + T * 2, .05, ID + T * 2, 0, .025, 0, [kraft, kraft, cream, kraft, kraft, kraft]);
      part(IW + T * 2, H, T, 0, H / 2 + .05, ID / 2 + T / 2, faces(4)); part(IW + T * 2, H, T, 0, H / 2 + .05, -ID / 2 - T / 2, faces(5));
      part(T, H, ID, IW / 2 + T / 2, H / 2 + .05, 0, faces(0)); part(T, H, ID, -IW / 2 - T / 2, H / 2 + .05, 0, faces(1));
      part(.03, H * .82, ID, CELL / 2, H * .41 + .05, 0, cream); part(.03, H * .82, ID, -CELL / 2, H * .41 + .05, 0, cream); part(IW, H * .82, .03, 0, H * .41 + .05, 0, cream);
      const hinge = new THREE.Group(); hinge.position.set(0, H + .05, -ID / 2 - T); box.add(hinge);
      const lidTex = tex(paintLid(), 1), lidMat = new THREE.MeshStandardMaterial({map:lidTex, roughness:.85});
      const LW = IW + T * 2 + .05, LD = ID + T * 2 + .05;
      const lid = shadowed(new THREE.Mesh(new THREE.BoxGeometry(LW, .05, LD), [cream, cream, lidMat, lidMat, cream, cream])); lid.position.set(0, .025, LD / 2); hinge.add(lid);
      const lip = shadowed(new THREE.Mesh(new THREE.BoxGeometry(LW, .2, .03), cream)); lip.position.set(0, -.075, LD + .015); hinge.add(lip);
      const KINDS = ['fudge', 'swirl', 'kinder', 'biscoff', 'party', 'nutty'];
      const br = KINDS.map((kind, i) => {
        const m = brownie(stage, kind, 20 + i, {seg:28, hs:7, chunks:kind === 'fudge' ? 7 : 0}); m.scale.setScalar(.92);
        const col = i % 3, row = i < 3 ? 1 : 0; /* front row first so nothing is hidden */
        m.userData.to = new THREE.Vector3((col - 1) * CELL, .05 + BH / 2 + .005, (row - .5) * CELL);
        m.userData.from = new THREE.Vector3(-3.3 + col * .7, 1.9 + (i % 3) * .25, 1.1 + row * .5);
        m.userData.spin = [(i % 2 ? 1 : -1) * 1.4, 1.1 + i * .35, (i % 3 - 1) * .9];
        box.add(m); return m;
      });
      const START = .16, STEP = .118, DUR = .15;
      scenes.push({el:six, renderer, scene, camera, update(p, time) {
        if (still) p = 1;
        hinge.rotation.x = -lerp(0, 1.92, inOut(clamp(p / .13)));
        box.rotation.y = lerp(-.5, -.12, inOut(p)) + Math.sin(time * .5) * .012;
        box.position.y = Math.sin(time * .8) * .02 + .02;
        br.forEach((m, i) => {
          const t = clamp((p - START - i * STEP) / DUR), u = m.userData; m.visible = t > 0;
          if (!m.visible) { items[i]?.classList.remove('on', 'cur'); return; }
          const e = outCubic(t), fall = t * t;
          m.position.set(lerp(u.from.x, u.to.x, e), lerp(u.from.y, u.to.y, fall) + Math.sin(t * Math.PI) * .5, lerp(u.from.z, u.to.z, e));
          const s = 1 - e; m.rotation.set(u.spin[0] * s, u.spin[1] * s, u.spin[2] * s);
          m.scale.setScalar(.92 * lerp(.6, 1, clamp(t * 4)));
          items[i]?.classList.toggle('on', t >= 1); items[i]?.classList.toggle('cur', t < 1);
        });
      }});
      six.classList.add('is-3d');
    }

    /* ================= 3) a brownie breaks open ================= */
    if (bo) {
      const canvas = bo.querySelector('canvas');
      const stage = makeStage(canvas, {fov:30, cam:[0, 3.7, 6.2], look:[0, .85, 0], shadow:.26}), {renderer, scene, camera} = stage;
      const whole = new THREE.Group(); whole.scale.setScalar(2.05); scene.add(whole);
      const cut = z => (fbm(z * 3.6 + 4.2, 1.7) - .5) * .2 + (fbm(z * 15 + 2, 9.1) - .5) * .06;
      const opt = {h:.44, seg:64, hs:16, chunks:8};
      const L = brownie(stage, 'fudge', 41, {...opt, cutR:cut}), R = brownie(stage, 'fudge', 41, {...opt, cutL:cut});
      whole.add(L, R);
      /* chocolate chunks bedded in the torn faces */
      const r = rng(21);
      [[L, 1], [R, -1]].forEach(([g, dir]) => { for (let i = 0; i < 7; i++) { const z = (r() - .5) * .8, s = .03 + r() * .03, m = shadowed(new THREE.Mesh(chunks[i % 3], stage.choc)); m.position.set(cut(z) - dir * s * .2, (r() - .5) * .26, z); m.rotation.set(r() * 6, r() * 6, r() * 6); m.scale.setScalar(s); g.add(m); } });
      const crumbs = Array.from({length:26}, (_, i) => { const m = new THREE.Mesh(chunks[i % 3], i % 4 ? stage.crumbBit : stage.choc); m.castShadow = true; m.userData = {d:[(r() - .5) * .7, .15 + r() * .5, (r() - .5) * 1.2], s:.008 + r() * .022, w:r() * 6, z:(r() - .5) * .8}; whole.add(m); return m; });
      scenes.push({el:bo, renderer, scene, camera, update(p, time) {
        if (still) p = .62;
        const b = outCubic(clamp((p - .1) / .55));
        whole.position.y = .95 + Math.sin(time * .9) * .04;
        whole.rotation.set(.2, lerp(-.5, .28, inOut(p)) + Math.sin(time * .5) * .02, 0);
        L.position.set(-b * .33, Math.sin(b * Math.PI) * .03, 0); L.rotation.set(0, -b * .55, b * .2);
        R.position.set(b * .33, Math.sin(b * Math.PI) * .03, 0); R.rotation.set(0, b * .55, -b * .2);
        crumbs.forEach(m => { const u = m.userData; m.visible = b > .04; m.position.set(cut(u.z) + u.d[0] * b, u.d[1] * b - b * b * .8, u.z + u.d[2] * b * .3); m.rotation.set(b * 5 + u.w, b * 3 + u.w, 0); m.scale.setScalar(u.s * clamp(b * 5)); });
      }});
      bo.classList.add('is-3d');
    }

    /* ---------- one render loop; only scenes on screen are drawn ---------- */
    const seen = new Set();
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)), {rootMargin:'200px'});
    scenes.forEach(s => io.observe(s.el));
    const tick = ms => {
      scenes.forEach(s => { if (!seen.has(s.el)) return; s.update(progress(s.el), still ? 0 : ms / 1000); s.renderer.render(s.scene, s.camera); });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    window.__ib3d = scenes; /* handy for debugging */
    document.documentElement.classList.remove('gl-pending');
  }).catch(err => { document.documentElement.classList.remove('gl-pending'); console.warn('3D scenes unavailable, using flat fallback:', err); });
})();

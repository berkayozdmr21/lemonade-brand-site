/* Limonca — animasyonlar ve form. GSAP + ScrollTrigger + Lenis (CDN) */
(function () {
  'use strict';

  var html = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var animate = hasGsap && !reduced;

  /* ---------- Yardımcılar ---------- */
  function splitChars(el) {
    var text = el.textContent;
    el.textContent = '';
    text.split(' ').forEach(function (w, i, arr) {
      var word = document.createElement('span');
      word.className = 'word';
      w.split('').forEach(function (c) {
        var ch = document.createElement('span');
        ch.className = 'char';
        ch.textContent = c;
        word.appendChild(ch);
      });
      el.appendChild(word);
      if (i < arr.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return $$('.char', el);
  }

  /* ---------- Cam (SVG) ---------- */
  function buildGlass(id) {
    var wavePath = 'M-300 98q37.5-14 75 0t75 0 75 0 75 0 75 0 75 0 75 0 75 0 75 0 75 0V260H-300z';
    return '' +
    '<svg class="glass-svg" viewBox="0 0 300 440" role="img" aria-label="Limonata bardağı">' +
    '<defs>' +
      '<clipPath id="clip-' + id + '"><path d="M46 70L254 70L228 392Q226 408 210 408L90 408Q74 408 72 392Z"/></clipPath>' +
      '<linearGradient id="liq-' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF176"/><stop offset="1" stop-color="#FFD60A"/></linearGradient>' +
    '</defs>' +
    '<ellipse cx="150" cy="422" rx="100" ry="11" fill="rgba(0,0,0,.14)"/>' +
    '<path d="M46 70L254 70L228 392Q226 408 210 408L90 408Q74 408 72 392Z" fill="rgba(255,255,255,.4)"/>' +
    '<g clip-path="url(#clip-' + id + ')"><g class="liquid">' +
      '<g class="wave-g"><path class="wave" d="' + wavePath + '" fill="#FFF59A" opacity=".9"/></g>' +
      '<rect x="0" y="98" width="300" height="340" fill="url(#liq-' + id + ')"/>' +
      '<g class="g-bubbles"></g>' +
      '<g class="ice ice1"><rect x="78" y="112" width="58" height="58" rx="13" fill="#fff" fill-opacity=".38" stroke="#fff" stroke-opacity=".85" stroke-width="2.5"/><path d="M88 124l14 0" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/></g>' +
      '<g class="ice ice2"><rect x="150" y="128" width="52" height="52" rx="12" fill="#fff" fill-opacity=".32" stroke="#fff" stroke-opacity=".8" stroke-width="2.5"/></g>' +
      '<g class="ice ice3"><rect x="112" y="200" width="46" height="46" rx="11" fill="#fff" fill-opacity=".28" stroke="#fff" stroke-opacity=".7" stroke-width="2.5"/></g>' +
    '</g></g>' +
    '<path d="M46 70L254 70L228 392Q226 408 210 408L90 408Q74 408 72 392Z" fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round" opacity=".95"/>' +
    '<path d="M62 92L82 372" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity=".55"/>' +
    '<path d="M236 96L222 200" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".4"/>' +
    '<g transform="rotate(14 190 40)"><rect x="182" y="-30" width="15" height="330" rx="7" fill="#FF5A5F"/>' +
      '<g stroke="#fff" stroke-width="5" opacity=".9"><path d="M182 -10l15 -8M182 14l15 -8M182 38l15 -8M182 62l15 -8"/></g></g>' +
    '<g class="rim-slice"><use href="#slice" x="196" y="22" width="96" height="96" transform="rotate(-16 244 70)"/></g>' +
    '<use class="rim-leaf" href="#leaf" x="26" y="36" width="64" height="38" transform="rotate(-20 58 55)"/>' +
    '</svg>';
  }

  $$('[data-glass]').forEach(function (box) {
    box.innerHTML = buildGlass(box.getAttribute('data-glass'));
  });

  /* kart bardakları */
  var tpl = $('#tpl-card-glass');
  $$('.card').forEach(function (card, i) {
    var art = $('.card-art', card);
    var node = tpl.content.cloneNode(true);
    var clip = $('clipPath', node);
    var cid = 'cgc' + i;
    clip.id = cid;
    $('g[clip-path]', node).setAttribute('clip-path', 'url(#' + cid + ')');
    $('.cg-garnish', node).setAttribute('href', '#' + card.getAttribute('data-garnish'));
    art.appendChild(node);
  });

  /* balonlar (hero arka planı) */
  var bubWrap = $('[data-bubbles]');
  var bubbles = [];
  if (bubWrap) {
    var count = window.innerWidth < 700 ? 12 : 22;
    for (var b = 0; b < count; b++) {
      var d = document.createElement('span');
      var s = 8 + Math.random() * 34;
      d.className = 'bub';
      d.style.width = d.style.height = s + 'px';
      d.style.left = Math.random() * 100 + '%';
      bubWrap.appendChild(d);
      bubbles.push(d);
    }
  }

  /* ---------- Footer yılı ---------- */
  var yil = $('#yil'); if (yil) yil.textContent = new Date().getFullYear();

  /* ---------- Menü ---------- */
  var nav = $('#nav'), burger = $('.burger'), menu = $('#menu');
  function setMenu(open) {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
  }
  burger.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  var lenis = null;
  function goTo(hash) {
    var target = $(hash);
    if (!target) return;
    if (lenis) lenis.scrollTo(hash === '#top' ? 0 : target, { offset: -10, duration: 1.4 });
    else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var h = a.getAttribute('href');
      if (h.length < 2 || !$(h)) return;
      e.preventDefault();
      setMenu(false);
      goTo(h);
    });
  });

  /* nav gizle/göster + gölge */
  var lastY = 0;
  function navScroll(y) {
    nav.classList.toggle('scrolled', y > 40);
    nav.classList.toggle('hide', y > lastY && y > 500 && !menu.classList.contains('open'));
    lastY = y;
  }
  window.addEventListener('scroll', function () { navScroll(window.scrollY); }, { passive: true });

  /* ---------- Form (animasyondan bağımsız çalışır) ---------- */
  initForm();

  /* ---------- Animasyon yoksa: statik son hal ---------- */
  if (!animate) {
    $$('[data-count]').forEach(function (el) { el.textContent = el.getAttribute('data-count') + (el.getAttribute('data-suffix') || ''); });
    // statik cam: balonlar eklenmez, dolu görünür
    $$('.step').forEach(function (s) { s.classList.add('active'); });
    return;
  }

  /* ================== GSAP ================== */
  try {
    html.classList.add('anim');
    gsap.registerPlugin(ScrollTrigger);

    /* Lenis yumuşak kaydırma */
    if (typeof window.Lenis !== 'undefined') {
      lenis = new Lenis({ duration: 1.15, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    /* ilerleme çubuğu */
    gsap.to('.progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.2 } });

    /* ---------- Özel imleç ---------- */
    if (finePointer) {
      html.classList.add('has-cursor');
      var dot = $('.cursor-dot'), ring = $('.cursor-ring');
      var dx = gsap.quickTo(dot, 'x', { duration: 0.05 }), dy = gsap.quickTo(dot, 'y', { duration: 0.05 });
      var rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
      window.addEventListener('pointermove', function (e) { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); });
      $$('a, button, .card, input, textarea, .rv').forEach(function (el) {
        el.addEventListener('pointerenter', function () { ring.classList.add('is-hover'); });
        el.addEventListener('pointerleave', function () { ring.classList.remove('is-hover'); });
      });
    }

    /* ---------- Cam animasyonları ---------- */
    $$('[data-glass]').forEach(function (box) {
      var liquid = $('.liquid', box), wave = $('.wave-g', box);
      gsap.to(wave, { x: 150, duration: 2.6, ease: 'none', repeat: -1 });
      var bg = $('.g-bubbles', box);
      for (var i = 0; i < 14; i++) {
        var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        var r = 2.5 + Math.random() * 5;
        c.setAttribute('r', r);
        c.setAttribute('cx', 84 + Math.random() * 132);
        c.setAttribute('cy', 400);
        c.setAttribute('fill', 'rgba(255,255,255,.55)');
        bg.appendChild(c);
        gsap.fromTo(c, { y: 0, opacity: 0 }, { y: -(260 + Math.random() * 40), opacity: 0.9, duration: 2.4 + Math.random() * 2.6, delay: Math.random() * 4, repeat: -1, ease: 'sine.in', onRepeat: function () { }, keyframes: undefined });
      }
      $$('.ice', box).forEach(function (ice, i) {
        gsap.to(ice, { y: 8 + i * 3, rotation: i % 2 ? 6 : -6, svgOrigin: '150 180', duration: 2 + i * 0.5, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      });
      box._liquid = liquid;
    });
    var heroLiquid = $('[data-glass="hero"] .liquid');
    var stepsLiquid = $('[data-glass="steps"] .liquid');

    /* ---------- Açılış zaman çizelgesi ---------- */
    var heroChars = [];
    $$('.hero h1 .split').forEach(function (el) { heroChars = heroChars.concat(splitChars(el)); });
    gsap.set('.hero h1 .split', { opacity: 1 });
    gsap.set(heroChars, { yPercent: 120, rotate: 12, opacity: 0 });
    gsap.set(heroLiquid, { y: 330 });
    gsap.set('.hero-glass', { y: 80, opacity: 0, scale: 0.85 });
    gsap.set(stepsLiquid, { y: 330 });

    var intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
    intro
      .to('.curtain-lemon', { scale: 1.3, duration: 0.6, ease: 'back.out(2)' }, 0.3)
      .to('.curtain', { yPercent: -100, duration: 1.1, ease: 'power4.inOut' }, 0.9)
      .to('.hero-glass', { y: 0, opacity: 1, scale: 1, duration: 1.2 }, 1.5)
      .to(heroLiquid, { y: 0, duration: 2.2, ease: 'power2.inOut' }, 1.6)
      .to(heroChars, { yPercent: 0, rotate: 0, opacity: 1, duration: 1, stagger: 0.04 }, 1.55)
      .to('[data-hero="in"]', { opacity: 1, y: 0, duration: 0.9, stagger: 0.12, startAt: { y: 24 } }, 2.0)
      .set('.curtain', { display: 'none' });

    /* hero balonları yüzer */
    bubbles.forEach(function (bu) {
      gsap.to(bu, { y: -(window.innerHeight + 140), x: (Math.random() - 0.5) * 80, duration: 6 + Math.random() * 8, delay: Math.random() * 6, repeat: -1, ease: 'none' });
      gsap.fromTo(bu, { opacity: 0 }, { opacity: 1, duration: 1.5, delay: 1.5 + Math.random() });
    });
    /* süzülen limonlar (sonsuz) */
    $$('.hero .float').forEach(function (el, i) {
      gsap.to(el, { y: (i % 2 ? -1 : 1) * (14 + i * 3), rotation: (i % 2 ? -1 : 1) * 14, duration: 3 + i * 0.5, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    });

    /* fare ile cam eğilimi */
    if (finePointer) {
      var hg = $('.hero-glass');
      var qx = gsap.quickTo(hg, 'rotationY', { duration: 0.8, ease: 'power3' });
      var qy = gsap.quickTo(hg, 'rotationX', { duration: 0.8, ease: 'power3' });
      gsap.set(hg, { transformPerspective: 900 });
      $('.hero').addEventListener('pointermove', function (e) {
        qx((e.clientX / window.innerWidth - 0.5) * 18);
        qy(-(e.clientY / window.innerHeight - 0.5) * 14);
      });
    }

    /* ---------- HERO scroll (scrub): parallax ---------- */
    var heroTl = gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.8 } });
    heroTl
      .to('.hero-glass .glass-svg', { yPercent: 18, rotation: 8, scale: 0.88, ease: 'none' }, 0)
      .to('.hero-text', { yPercent: -22, opacity: 0.2, ease: 'none' }, 0)
      .to('.hero .f1', { yPercent: -160, rotation: 120, ease: 'none' }, 0)
      .to('.hero .f2', { yPercent: -90, rotation: -80, ease: 'none' }, 0)
      .to('.hero .f3', { yPercent: -220, ease: 'none' }, 0)
      .to('.hero .f4', { yPercent: -120, xPercent: 60, ease: 'none' }, 0)
      .to('.hero .f5', { yPercent: -140, rotation: 40, ease: 'none' }, 0)
      .to('.hero .b1', { yPercent: 30, ease: 'none' }, 0)
      .to('.hero .scroll-hint', { opacity: 0 }, 0);

    /* ---------- Genel: metin beliriş ---------- */
    $$('[data-reveal]').forEach(function (el) {
      var kind = el.getAttribute('data-reveal');
      var from = { opacity: 0, y: 40 };
      if (kind === 'scale') from = { opacity: 0, y: 50, scale: 0.85 };
      gsap.fromTo(el, from, { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' } });
    });

    /* harf harf başlıklar */
    $$('[data-split]').forEach(function (el) {
      var label = el.textContent;
      var chars = splitChars(el);
      el.setAttribute('aria-label', label);
      $$('.word', el).forEach(function (w) { w.setAttribute('aria-hidden', 'true'); });
      gsap.from(chars, { yPercent: 100, opacity: 0, rotate: 8, duration: 0.9, ease: 'back.out(1.6)', stagger: 0.03, scrollTrigger: { trigger: el, start: 'top 85%' } });
    });

    /* satır satır */
    $$('.reveal-lines').forEach(function (h) {
      gsap.to($$('.line>span', h), { yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.16, scrollTrigger: { trigger: h, start: 'top 82%' } });
    });

    /* ---------- Şerit ---------- */
    var tweens = [];
    $$('.mq-track').forEach(function (track) {
      track.innerHTML += track.innerHTML; // sonsuz döngü için kopya
      var dir = parseInt(track.getAttribute('data-dir'), 10);
      var t = dir > 0
        ? gsap.to(track, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 })
        : gsap.fromTo(track, { xPercent: -50 }, { xPercent: 0, duration: 34, ease: 'none', repeat: -1 });
      tweens.push(t);
    });
    var mqSkew = gsap.quickTo('.mq-track', 'skewX', { duration: 0.4, ease: 'power3' });
    ScrollTrigger.create({
      trigger: '.marquee', start: 'top bottom', end: 'bottom top',
      onUpdate: function (self) {
        var v = Math.min(Math.abs(self.getVelocity()) / 260, 7);
        tweens.forEach(function (t) { gsap.to(t, { timeScale: 1 + v, duration: 0.25, overwrite: true }); });
        mqSkew(Math.max(-12, Math.min(12, -self.getVelocity() / 260)));
        clearTimeout(ScrollTrigger._mq);
        ScrollTrigger._mq = setTimeout(function () {
          tweens.forEach(function (t) { gsap.to(t, { timeScale: 1, duration: 1.2, overwrite: true }); });
          mqSkew(0);
        }, 120);
      }
    });

    /* ---------- Hikâye ---------- */
    gsap.to('.big-slice', { rotation: 220, yPercent: 14, ease: 'none', scrollTrigger: { trigger: '.story', start: 'top bottom', end: 'bottom top', scrub: 1 } });
    gsap.to('.story-lemon.l1', { yPercent: -200, rotation: 150, ease: 'none', scrollTrigger: { trigger: '.story', start: 'top bottom', end: 'bottom top', scrub: 1.2 } });
    gsap.to('.story-lemon.l2', { yPercent: 260, rotation: -200, ease: 'none', scrollTrigger: { trigger: '.story', start: 'top bottom', end: 'bottom top', scrub: 1.4 } });
    gsap.to('.story-leaf', { yPercent: -120, xPercent: 80, rotation: 40, ease: 'none', scrollTrigger: { trigger: '.story', start: 'top bottom', end: 'bottom top', scrub: 1 } });

    $$('[data-count]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count')), suffix = el.getAttribute('data-suffix') || '';
      var o = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: 'top 90%', once: true,
        onEnter: function () {
          gsap.to(o, { v: target, duration: 2, ease: 'power2.out', onUpdate: function () { el.textContent = Math.round(o.v) + suffix; } });
        }
      });
    });

    /* ---------- Kartlar ---------- */
    $$('.card').forEach(function (card, i) {
      gsap.from(card, {
        y: 120, opacity: 0, rotation: i % 2 ? 6 : -6, scale: 0.9, duration: 1.1, ease: 'power4.out',
        scrollTrigger: { trigger: card, start: 'top 90%' }, delay: (i % 2) * 0.12
      });
      gsap.to($('.card-art', card), { yPercent: -10, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: 1 } });
    });
    if (finePointer) {
      $$('.tilt').forEach(function (card) {
        var rX = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3' });
        var rY = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3' });
        gsap.set(card, { transformPerspective: 900 });
        card.addEventListener('pointermove', function (e) {
          var r = card.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
          rY((px - 0.5) * 20); rX(-(py - 0.5) * 20);
          card.style.setProperty('--mx', px * 100 + '%'); card.style.setProperty('--my', py * 100 + '%');
        });
        card.addEventListener('pointerleave', function () { rX(0); rY(0); });
      });
    }

    /* ---------- Faydalar ---------- */
    $$('.benefit').forEach(function (b, i) {
      var circle = $('.ring circle', b);
      gsap.fromTo(circle, { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: b, start: 'top 90%', end: 'top 40%', scrub: 1 } });
      gsap.from($('.ico', b), { rotation: -180, scale: 0.2, duration: 1.2, ease: 'back.out(1.8)', scrollTrigger: { trigger: b, start: 'top 85%' }, delay: i * 0.05 });
    });
    $$('.sl').forEach(function (el, i) {
      gsap.to(el, { rotation: (i % 2 ? -1 : 1) * 360, yPercent: (i % 2 ? 1 : -1) * 90, ease: 'none', scrollTrigger: { trigger: '.benefits', start: 'top bottom', end: 'bottom top', scrub: 1 + i * 0.3 } });
      gsap.to(el, { x: (i % 2 ? -1 : 1) * 24, duration: 3 + i, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    });

    /* ---------- Nasıl yapılır: bardak scroll ile dolar ---------- */
    var steps = $$('.step');
    var stepsEl = $('.steps-list');
    ScrollTrigger.create({
      trigger: '.steps-list ol', start: 'top 70%', end: 'bottom 60%', scrub: 0.6,
      onUpdate: function (self) {
        var p = self.progress;
        gsap.set(stepsLiquid, { y: 330 * (1 - p) });
        var idx = Math.min(steps.length - 1, Math.floor(p * steps.length * 0.999));
        steps.forEach(function (s, i) { s.classList.toggle('active', i <= idx && (i === idx || p > 0)); });
        steps.forEach(function (s, i) { if (i < idx) s.style.opacity = 0.75; else s.style.opacity = ''; });
      }
    });
    // başlangıçta ilk adım pasif; ilerledikçe aktifleşir
    steps.forEach(function (s) { s.classList.remove('active'); });
    gsap.to('.steps-glass', { rotation: 4, ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top bottom', end: 'bottom top', scrub: 1 } });
    // limon dilimi süzülür
    gsap.fromTo('[data-glass="steps"] .rim-slice', { rotation: -30, transformOrigin: '50% 50%' }, { rotation: 25, ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top bottom', end: 'bottom top', scrub: 1 } });

    /* ---------- Yorumlar: yatay kayma (masaüstü) ---------- */
    var mm = gsap.matchMedia();
    mm.add('(min-width: 861px)', function () {
      var track = $('.rv-track');
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      gsap.fromTo(track, { x: 0 }, { x: function () { return -dist(); }, ease: 'none', scrollTrigger: { trigger: '.rv-viewport', start: 'top 85%', end: 'bottom 15%', scrub: 1, invalidateOnRefresh: true } });
      gsap.from('.rv', { y: 80, opacity: 0, rotation: 5, stagger: 0.15, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.rv-viewport', start: 'top 85%' } });
    });
    mm.add('(max-width: 860px)', function () {
      gsap.from('.rv', { y: 60, opacity: 0, stagger: 0.12, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.rv-viewport', start: 'top 90%' } });
    });

    /* ---------- İletişim ---------- */
    gsap.from('.form-card .field', { y: 40, opacity: 0, stagger: 0.1, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.form-card', start: 'top 80%' } });
    gsap.to('.contact-slice', { rotation: 360, xPercent: 60, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom bottom', scrub: 1 } });

    /* ---------- Footer ---------- */
    var fb = $('.foot-big');
    gsap.from($$('.char', fb), { yPercent: 120, rotate: 10, duration: 1.1, stagger: 0.06, ease: 'power4.out', scrollTrigger: { trigger: fb, start: 'top 95%' } });
    gsap.fromTo(fb, { xPercent: -6 }, { xPercent: 6, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: 1 } });

    // yazı tipi yüklenince ölçüleri yenile
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  } catch (err) {
    // animasyon kurulumu bozulursa içeriği görünür bırak
    console.error('Animasyon hatası:', err);
    html.classList.remove('anim');
    $$('.curtain').forEach(function (c) { c.style.display = 'none'; });
    gsap && gsap.set && gsap.set('.hero h1 .split,[data-reveal],[data-hero],.reveal-lines .line>span', { clearProps: 'all' });
  }

  /* ================== FORM ================== */
  function initForm() {
    var form = $('#contactForm'), btn = $('#submitBtn'), msg = $('#formMsg');
    var success = $('#success'), again = $('#againBtn');
    var timers = [];

    function setErr(name, text) {
      var f = form.elements[name].closest('.field');
      f.classList.toggle('invalid', !!text);
      form.elements[name].setAttribute('aria-invalid', text ? 'true' : 'false');
      $('#err-' + name).textContent = text || '';
    }
    function showMsg(text) {
      msg.className = 'form-msg' + (text ? ' show error' : '');
      msg.textContent = text || '';
      if (text && animate) {
        gsap.fromTo(msg, { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(2)' });
        gsap.fromTo(form, { x: -10 }, { x: 0, duration: 0.7, ease: 'elastic.out(1,.25)', clearProps: 'x' });
      }
    }
    function setState(s) { btn.setAttribute('data-state', s); btn.disabled = (s === 'loading'); }

    function validate() {
      var v = {
        ad: form.ad.value.trim(), eposta: form.eposta.value.trim(),
        telefon: form.telefon.value.trim(), mesaj: form.mesaj.value.trim()
      };
      var ok = true;
      var e = {};
      if (v.ad.length < 2 || v.ad.length > 100) e.ad = 'Lütfen adınızı yazın (2–100 karakter).';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.eposta)) e.eposta = 'Geçerli bir e-posta adresi yazın.';
      if (v.telefon && (v.telefon.length < 5 || v.telefon.length > 30)) e.telefon = 'Telefon 5–30 karakter olmalı.';
      if (v.mesaj.length < 5 || v.mesaj.length > 2000) e.mesaj = 'Mesajınız 5–2000 karakter olmalı.';
      ['ad', 'eposta', 'telefon', 'mesaj'].forEach(function (k) { setErr(k, e[k]); if (e[k]) ok = false; });
      if (!ok) {
        var first = form.querySelector('.invalid input,.invalid textarea');
        if (first) first.focus();
      }
      return ok ? v : null;
    }

    ['ad', 'eposta', 'telefon', 'mesaj'].forEach(function (k) {
      form.elements[k].addEventListener('input', function () { if (form.elements[k].closest('.invalid')) setErr(k, ''); });
    });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      showMsg('');
      var v = validate();
      if (!v) { showMsg('Lütfen işaretli alanları düzeltin.'); return; }
      var payload = { ad: v.ad, eposta: v.eposta, mesaj: v.mesaj, website: form.website.value };
      if (v.telefon) payload.telefon = v.telefon;

      setState('loading');
      fetch('/api/iletisim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) { return { res: res, data: data }; });
      }).then(function (r) {
        if (r.res.status === 201 && r.data.ok) { onSuccess(); return; }
        var text = r.data.hata;
        if (!text) text = r.res.status === 429 ? 'Çok fazla deneme yaptınız. Lütfen biraz bekleyip tekrar deneyin.' : 'Mesaj gönderilemedi. Lütfen tekrar deneyin.';
        setState('idle'); showMsg(text);
      }).catch(function () {
        setState('idle');
        showMsg('Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.');
      });
    });

    function onSuccess() {
      setState('success');
      var finish = function () {
        form.hidden = true; success.hidden = false;
        var circle = $('.check circle', success), tick = $('.check path', success);
        if (animate) {
          gsap.fromTo(success, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.8)' });
          gsap.to(circle, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.out' });
          gsap.to(tick, { strokeDashoffset: 0, duration: 0.6, delay: 0.5, ease: 'power2.out' });
          confetti();
        } else {
          circle.style.strokeDashoffset = 0; tick.style.strokeDashoffset = 0;
        }
        success.setAttribute('tabindex', '-1'); success.focus({ preventScroll: true });
      };
      if (animate) gsap.to(form, { opacity: 0, y: -20, duration: 0.5, delay: 0.5, onComplete: function () { finish(); gsap.set(form, { clearProps: 'all' }); } });
      else finish();
    }

    function confetti() {
      var box = $('.burst', success);
      box.innerHTML = '';
      var ids = ['#lemon', '#slice', '#leaf', '#mint'];
      for (var i = 0; i < 18; i++) {
        var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        s.setAttribute('viewBox', '0 0 100 100');
        var u = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        u.setAttribute('href', ids[i % ids.length]);
        s.appendChild(u); box.appendChild(s);
        var a = Math.random() * Math.PI * 2, dist = 90 + Math.random() * 170;
        gsap.fromTo(s, { x: 0, y: 0, scale: 0.2, rotation: 0, opacity: 1 }, {
          x: Math.cos(a) * dist, y: Math.sin(a) * dist - 40, scale: 0.8 + Math.random() * 1.2, rotation: Math.random() * 540 - 270,
          duration: 1.4 + Math.random() * 0.6, ease: 'power3.out'
        });
        gsap.to(s, { opacity: 0, duration: 0.5, delay: 1.3 });
      }
    }

    again.addEventListener('click', function () {
      form.reset(); setState('idle'); showMsg('');
      success.hidden = true; form.hidden = false;
      if (animate) gsap.from(form, { opacity: 0, y: 20, duration: 0.6 });
    });
  }
})();

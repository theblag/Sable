/* Sablé — interactions & motion */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var live = document.querySelector('[data-live]');

  function announce(msg) {
    if (!live) return;
    live.textContent = '';
    window.setTimeout(function () { live.textContent = msg; }, 60);
  }

  /* ---------------- Header: subtle blur once scrolled ---------------- */
  var header = document.querySelector('[data-header]');
  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------- Mobile menu ---------------- */
  var menu = document.querySelector('[data-menu]');
  var openBtn = document.querySelector('[data-menu-open]');
  var closeBtn = document.querySelector('[data-menu-close]');

  function focusables() {
    return menu.querySelectorAll('a[href], button:not([disabled])');
  }
  function openMenu() {
    menu.hidden = false;
    openBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }
  function closeMenu(returnFocus) {
    menu.hidden = true;
    openBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (returnFocus) openBtn.focus();
  }
  openBtn.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', function () { closeMenu(true); });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) closeMenu(false);
  });
  menu.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeMenu(true); return; }
    if (e.key !== 'Tab') return;
    var f = focusables(); var first = f[0]; var last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  window.matchMedia('(min-width: 900px)').addEventListener('change', function (e) {
    if (e.matches && !menu.hidden) closeMenu(false);
  });

  /* ---------------- Cart counter (front-end only) ---------------- */
  var count = 0;
  var badge = document.querySelector('[data-cart-badge]');
  var cartLabel = document.querySelector('[data-cart-label]');

  document.querySelectorAll('[data-add]').forEach(function (btn) {
    var resetTimer;
    btn.addEventListener('click', function () {
      count += 1;
      var name = btn.getAttribute('data-add');
      badge.textContent = String(count);
      badge.hidden = false;
      badge.classList.remove('is-bumped');
      void badge.offsetWidth; // restart animation
      badge.classList.add('is-bumped');
      var cakes = count === 1 ? '1 cake' : count + ' cakes';
      cartLabel.textContent = ', ' + cakes + ' in your order';

      btn.textContent = 'Added';
      btn.classList.add('is-added');
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(function () {
        btn.textContent = 'Add another';
        btn.classList.remove('is-added');
      }, 1400);

      announce(name + ' added. ' + cakes + ' in your order.');
    });
  });

  /* ---------------- Custom order form ---------------- */
  var form = document.querySelector('[data-form]');
  var summary = document.querySelector('[data-form-summary]');
  var success = document.querySelector('[data-form-success]');
  var successDetail = document.querySelector('[data-success-detail]');
  var dateInput = form.elements.date;
  var sizeInput = form.elements.size;
  var dateHint = document.querySelector('[data-date-hint]');

  function isoDate(d) {
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }
  function niceDate(d) {
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long' });
  }
  function noticeDays() { return sizeInput.value === 'tier' ? 7 : 4; }
  function earliest() {
    var d = new Date(); d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + noticeDays());
    return d;
  }
  function syncDateMin() {
    var e = earliest();
    dateInput.min = isoDate(e);
    dateHint.textContent = 'Earliest date: ' + niceDate(e) + ' (' + noticeDays() + ' days’ notice' + (noticeDays() === 7 ? ' for two-tier cakes' : '') + ').';
  }
  syncDateMin();
  sizeInput.addEventListener('change', function () {
    syncDateMin();
    if (dateInput.value) validateField('date');
  });

  var rules = {
    occasion: function (v) { return v ? '' : 'Choose an occasion.'; },
    flavour: function (v) { return v ? '' : 'Choose a flavour, or pick “Not sure yet”.'; },
    size: function (v) { return v ? '' : 'Choose a size.'; },
    date: function (v) {
      if (!v) return 'Pick a collection date.';
      var picked = new Date(v + 'T00:00:00');
      if (isNaN(picked)) return 'Enter the date as day, month and year.';
      var e = earliest();
      if (picked < e) {
        return 'Pick ' + niceDate(e) + ' or later. ' +
          (noticeDays() === 7 ? 'Two-tier cakes need 7 days’ notice.' : 'Custom cakes need 4 days’ notice.');
      }
      return '';
    },
    name: function (v) { return v.trim() ? '' : 'Enter your name so we know who to ask for.'; },
    phone: function (v) {
      var digits = v.replace(/\D/g, '');
      if (!digits) return 'Enter your mobile number so we can send the quote.';
      if (digits.length === 12 && digits.indexOf('91') === 0) digits = digits.slice(2);
      if (digits.length === 11 && digits.charAt(0) === '0') digits = digits.slice(1);
      if (!/^[6-9]\d{9}$/.test(digits)) return 'Enter a 10-digit mobile number, like 98450 12345.';
      return '';
    }
  };
  var labels = { occasion: 'Occasion', flavour: 'Cake flavour', size: 'Size', date: 'Collection date', name: 'Your name', phone: 'Mobile number' };

  function validateField(name) {
    var el = form.elements[name];
    var msg = rules[name](el.value);
    var out = form.querySelector('[data-error-for="' + name + '"]');
    out.textContent = msg;
    if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
    return msg;
  }

  // Errors appear on submit (no layout shift mid-typing), then update live as each field is fixed.
  Object.keys(rules).forEach(function (name) {
    var el = form.elements[name];
    el.addEventListener(el.tagName === 'SELECT' || el.type === 'date' ? 'change' : 'input', function () {
      if (el.getAttribute('aria-invalid') === 'true') validateField(name);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var errors = [];
    Object.keys(rules).forEach(function (name) {
      var msg = validateField(name);
      if (msg) errors.push({ name: name, msg: msg });
    });

    if (errors.length) {
      summary.innerHTML = '';
      var title = document.createElement('p');
      title.textContent = errors.length === 1 ? 'One thing to fix before we can send this:' : errors.length + ' things to fix before we can send this:';
      var list = document.createElement('ul');
      errors.forEach(function (err) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = '#' + form.elements[err.name].id;
        a.textContent = labels[err.name] + ': ' + err.msg;
        a.addEventListener('click', function (ev) { ev.preventDefault(); form.elements[err.name].focus(); });
        li.appendChild(a); list.appendChild(li);
      });
      summary.appendChild(title); summary.appendChild(list);
      summary.hidden = false;
      summary.focus();
      return;
    }

    summary.hidden = true;
    var data = new FormData(form);
    var picked = new Date(data.get('date') + 'T00:00:00');
    successDetail.textContent = 'We’ll message ' + data.get('name').trim().split(' ')[0] + ' on ' +
      data.get('phone').trim() + ' about a ' + sizeInput.options[sizeInput.selectedIndex].text.split(' ·')[0] + ' ' +
      data.get('flavour').replace('Not sure yet', 'cake (flavour to discuss)') + ' for ' + niceDate(picked) + '.';
    form.hidden = true;
    success.hidden = false;
    success.focus();
    announce('Request sent. We’ll reply within 24 hours.');
  });

  document.querySelector('[data-form-reset]').addEventListener('click', function () {
    form.reset();
    form.querySelectorAll('[aria-invalid]').forEach(function (el) { el.removeAttribute('aria-invalid'); });
    form.querySelectorAll('.field__error').forEach(function (el) { el.textContent = ''; });
    syncDateMin();
    success.hidden = true;
    form.hidden = false;
    form.elements.occasion.focus();
  });

  /* ---------------- Motion (GSAP + ScrollTrigger) ---------------- */
  if (!window.gsap || !window.ScrollTrigger) {
    root.classList.remove('js-motion');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  var mm = gsap.matchMedia();
  var q = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------------- Line motifs: lace, rosettes, flowers, zigzags and sprigs ----------------
     Scattered along the sides of each plain section, with a few in open background space.
     Three depth layers per section (far, mid, near) move as layers, so scroll and pointer
     parallax stay cheap. Nothing is placed over text, photos, buttons or form fields;
     the hero and the cut-in section have photo backgrounds and are left alone. */
  var MOTIF_SECTIONS = ['.cakes', '.story', '.custom', '.reviews', '.footer'];
  var MOTIFS = [ // id, aspect (w/h), weight
    ['m-lace', 1, 0.22], ['m-rosette', 1, 0.18], ['m-flower', 1, 0.25], ['m-zigzag', 380 / 70, 0.13], ['m-sprig', 1, 0.22]
  ];
  // At 6–8% opacity the lines can sit behind body copy; keep them off headings, photos and controls.
  var KEEP_CLEAR = 'h1, h2, .btn, button, img, input, select, textarea, .card__media, .story__hero, .story__detail, .deco__motif, [data-acc], .footer__mark';
  var SVGNS = 'http://www.w3.org/2000/svg';

  function motifLayers(section) {
    var box = section.querySelector(':scope > .motifs');
    if (box) return box;
    box = document.createElement('div');
    box.className = 'motifs';
    box.setAttribute('aria-hidden', 'true');
    ['far', 'mid', 'near'].forEach(function (d) {
      var layer = document.createElement('div');
      layer.className = 'motifs__depth motifs__depth--' + d;
      layer.dataset.depth = d;
      var pt = document.createElement('div');
      pt.className = 'motifs__pt';
      layer.appendChild(pt);
      box.appendChild(layer);
    });
    section.insertBefore(box, section.firstChild);
    return box;
  }
  function pickMotif() {
    var r = Math.random(), acc = 0;
    for (var i = 0; i < MOTIFS.length; i++) { acc += MOTIFS[i][2]; if (r <= acc) return MOTIFS[i]; }
    return MOTIFS[0];
  }
  function rand(a, b) { return a + Math.random() * (b - a); }

  function scatterMotifs() {
    var small = window.innerWidth < 768;
    MOTIF_SECTIONS.forEach(function (sel) {
      var section = document.querySelector(sel);
      if (!section) return;
      var box = motifLayers(section);
      var pts = q('.motifs__pt', box);
      pts.forEach(function (p) { p.textContent = ''; });

      var sr = section.getBoundingClientRect();
      var W = sr.width, H = sr.height;
      if (!W || !H) return;
      var avoid = q(KEEP_CLEAR, section).map(function (el) {
        var r = el.getBoundingClientRect();
        return { l: r.left - sr.left - 10, r: r.right - sr.left + 10, t: r.top - sr.top - 24, b: r.bottom - sr.top + 24 };
      }).filter(function (r) { return r.r > r.l && r.b > r.t; });
      var placed = [];
      function fits(x, y, w, h) {
        var b = { l: x - w * 0.34, r: x + w * 0.34, t: y - h * 0.34, b: y + h * 0.34 }; // lines are airy: test the core
        if (b.r < 0 || b.l > W) return false;
        var hit = function (r) { return b.l < r.r && b.r > r.l && b.t < r.b && b.b > r.t; };
        return !avoid.some(hit) && !placed.some(hit);
      }
      function put(x, y, m, w) {
        var h = w / m[1];
        placed.push({ l: x - w / 2, r: x + w / 2, t: y - h / 2, b: y + h / 2 });
        var depth = Math.random();
        var layer = depth < 0.35 ? 0 : depth < 0.75 ? 1 : 2;
        var svg = document.createElementNS(SVGNS, 'svg');
        svg.setAttribute('class', 'motif');
        svg.setAttribute('viewBox', m[1] === 1 ? '0 0 100 100' : '0 0 ' + (100 * m[1]).toFixed(1) + ' 100');
        var use = document.createElementNS(SVGNS, 'use');
        use.setAttribute('href', '#' + m[0]);
        use.setAttribute('width', '100%'); use.setAttribute('height', '100%');
        svg.appendChild(use);
        svg.style.cssText = 'left:' + (x / W * 100).toFixed(2) + '%;top:' + (y / H * 100).toFixed(2) + '%;' +
          '--w:' + Math.round(w) + 'px;aspect-ratio:' + m[1] + ';--r:' + Math.round(rand(-35, 35)) + 'deg;' +
          '--o:' + rand(0.055, 0.085).toFixed(3);
        pts[layer].appendChild(svg);
      }

      // Sides: a motif every ~360px down each edge, partly off the screen.
      var step = small ? 260 : 300;
      ['left', 'right'].forEach(function (side, s) {
        for (var y = rand(40, step) + s * step / 2; y < H - 40; y += rand(step * 0.8, step * 1.25)) {
          var m = pickMotif();
          var w = m[1] > 1 ? rand(small ? 140 : 180, small ? 200 : 280) : rand(small ? 90 : 120, small ? 140 : 210);
          var h = w / m[1];
          // start near the edge and slide outward until it clears the content
          for (var off = 0.32; off >= -0.4; off -= 0.08) {
            var x = side === 'left' ? w * off : W - w * off;
            if (fits(x, y, w, h)) { put(x, y, m, w); break; }
          }
        }
      });

      // Background: a few larger pieces in whatever open space is left.
      var target = small ? 2 : Math.max(2, Math.round((W * H) / 420000));
      for (var n = 0, tries = 0; n < target && tries < 120; tries++) {
        var m2 = pickMotif();
        var w2 = m2[1] > 1 ? rand(220, 340) : rand(160, 280);
        var x2 = rand(W * 0.15, W * 0.85), y2 = rand(60, H - 60);
        if (fits(x2, y2, w2, w2 / m2[1])) { put(x2, y2, m2, w2); n++; }
      }
    });
  }

  scatterMotifs();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(scatterMotifs);
  window.addEventListener('load', scatterMotifs); // photos have their final size now
  var lastScatterW = window.innerWidth, scatterTimer;
  window.addEventListener('resize', function () {
    clearTimeout(scatterTimer);
    scatterTimer = setTimeout(function () {
      if (Math.abs(window.innerWidth - lastScatterW) < 60) return; // ignore mobile toolbar resizes
      lastScatterW = window.innerWidth;
      scatterMotifs();
    }, 250);
  });

  // Split section headings into words for a masked rise (text stays one heading for screen readers).
  function splitWords(el) {
    if (el.dataset.split) return;
    el.dataset.split = '1';
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    var nodes = Array.prototype.slice.call(el.childNodes);
    var frag = document.createDocumentFragment();
    var last = null;
    function word() {
      var w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
      var i = document.createElement('span'); w.appendChild(i); return w;
    }
    nodes.forEach(function (n) {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); last = null; return; }
          last = word(); last.firstChild.textContent = part; frag.appendChild(last);
        });
      } else {
        // e.g. the raspberry full stop: keep it glued to the word before it
        if (last) last.firstChild.appendChild(n); else { last = word(); last.firstChild.appendChild(n); frag.appendChild(last); }
      }
    });
    el.textContent = '';
    el.appendChild(frag);
  }

  mm.add('(prefers-reduced-motion: no-preference)', function () {
    var hero = document.querySelector('.hero');
    var cakeImg = document.querySelector('.hero__cake-tilt img');
    var accHero = q('.hero [data-acc]');

    /* ---- Page load: lines rise, the doily spins in, the cake is set down on it, then the garnish arrives ---- */
    var intro = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
    var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    var imgReady = new Promise(function (r) { if (cakeImg.complete) r(); else { cakeImg.addEventListener('load', r); cakeImg.addEventListener('error', r); } });
    Promise.race([Promise.all([fontsReady, imgReady]), new Promise(function (r) { setTimeout(r, 1200); })]).then(function () { intro.play(); });

    var arrow = q('.hero__note-arrow path');
    arrow.forEach(function (p) { var l = p.getTotalLength(); gsap.set(p, { strokeDasharray: l, strokeDashoffset: l }); });

    intro
      .fromTo('.hero__line > span', { yPercent: 110, y: 0 }, { yPercent: 0, y: 0, duration: 1, stagger: 0.12 }, 0)
      .fromTo('.hero__doily', { opacity: 0, scale: 0.55, rotation: -120 }, { opacity: 1, scale: 1, rotation: 0, duration: 1.4, ease: 'expo.out' }, 0.25)
      // the cake is lowered onto the stand...
      .fromTo(cakeImg, { opacity: 0, y: -90, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.75, ease: 'power2.in' }, 0.45)
      .fromTo('.hero__shadow', { opacity: 0, scaleX: 0.3 }, { opacity: 0.26, scaleX: 1, duration: 0.75, ease: 'power2.in' }, 0.45)
      // ...and settles with a small give
      .to(cakeImg, { scaleY: 0.975, scaleX: 1.018, transformOrigin: '50% 100%', duration: 0.12, ease: 'power1.out' }, 1.2)
      .to(cakeImg, { scaleY: 1, scaleX: 1, duration: 0.7, ease: 'elastic.out(1, 0.5)' }, 1.32)
      .fromTo('[data-hero-foot]', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8 }, 1.05)
      .to('.hero__note', { opacity: 1, duration: 0.4 }, 1.35)
      .to(arrow, { strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut', stagger: 0.25 }, 1.45);

    // Accessories slide in 20–40px from their own edge, after the cake has settled.
    accHero.forEach(function (el, i) {
      var from = el.dataset.from;
      var dist = 24 + (i % 3) * 7;
      var vars = { opacity: 0 };
      vars.x = from === 'left' ? -dist : dist;
      if (el.classList.contains('acc--berries') || el.classList.contains('acc--choc')) vars.y = 14;
      intro.fromTo(el.querySelector('.acc__in'), vars, { opacity: 1, x: 0, y: 0, duration: 1, ease: 'power3.out' }, 1.5 + i * 0.12);
    });

    /* ---- Hero scroll: the cake lifts, the doily turns, accessories drift by depth ---- */
    var heroST = { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 };
    gsap.to('.hero__cake-move', { y: -50, rotation: 2.5, ease: 'none', scrollTrigger: heroST });
    gsap.to('.hero__doily', { rotation: 70, y: 30, ease: 'none', scrollTrigger: heroST });
    gsap.fromTo('.hero__bg img', { y: 0 }, { y: 40, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__line--1', { xPercent: -4, ease: 'none', scrollTrigger: heroST });
    gsap.to('.hero__line--2', { xPercent: 3, ease: 'none', scrollTrigger: heroST });

    // Accessory parallax: near ones travel ~25px, far ones ~10px.
    q('[data-acc]').forEach(function (el) {
      var depth = parseFloat(el.dataset.depth) || 12;
      var inHero = !!el.closest('.hero');
      gsap.fromTo(el, { y: inHero ? 0 : depth / 2 }, {
        y: inHero ? -depth : -depth / 2, ease: 'none',
        scrollTrigger: inHero ? { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
                              : { trigger: el.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    // Fork in custom orders: same slide-in, on first view.
    q('.custom [data-acc]').forEach(function (el) {
      gsap.fromTo(el.querySelector('.acc__in'), { opacity: 0, x: -32 }, {
        opacity: 1, x: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el.closest('section'), start: 'top 70%', once: true }
      });
    });

    /* ---- Background decoration: each piece at its own speed ---- */
    q('.deco [data-speed]').forEach(function (el) {
      var s = parseFloat(el.dataset.speed);
      var isMotif = el.classList.contains('deco__motif');
      gsap.fromTo(el, { y: 60 * s, rotation: isMotif ? -12 * s : 0 }, {
        y: -60 * s, rotation: isMotif ? 18 * s : 0, ease: 'none',
        scrollTrigger: { trigger: el.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    /* ---- Motif layers: far ones barely move, near ones travel furthest ---- */
    var MOTIF_TRAVEL = { far: 25, mid: 55, near: 95 };
    q('.motifs__depth').forEach(function (layer) {
      var section = layer.closest('section, footer');
      var t = MOTIF_TRAVEL[layer.dataset.depth];
      gsap.fromTo(layer, { y: t }, {
        y: -t, ease: 'none',
        scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    /* ---- Ribbon: always running; a scroll gives it a brief push ---- */
    // The track holds the menu twice, so moving it by half its width loops seamlessly.
    var ribbonLoop = gsap.to('[data-ribbon]', { xPercent: -50, duration: 30, ease: 'none', repeat: -1 });
    ScrollTrigger.create({
      trigger: '.ribbon', start: 'top bottom', end: 'bottom top',
      onToggle: function (self) { ribbonLoop.paused(!self.isActive); }, // rests while off-screen
      onUpdate: function (self) {
        var boost = 1 + Math.min(Math.abs(self.getVelocity()) / 350, 5);
        gsap.to(ribbonLoop, {
          timeScale: boost, duration: 0.2, overwrite: true,
          onComplete: function () { gsap.to(ribbonLoop, { timeScale: 1, duration: 1.2, ease: 'power2.out', overwrite: true }); }
        });
      }
    });

    /* ---- Headings: words rise out of a mask ---- */
    q('.h2').forEach(function (h) {
      splitWords(h);
      if (h.hasAttribute('data-reveal')) { h.removeAttribute('data-reveal'); gsap.set(h, { opacity: 1, y: 0 }); }
      gsap.fromTo(q('.w > span', h), { y: 0, yPercent: 105 }, {
        yPercent: 0, duration: 0.9, ease: 'power3.out', stagger: 0.06,
        scrollTrigger: { trigger: h, start: 'top 88%', once: true }
      });
    });

    /* ---- Section reveals, once ---- */
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 88%',
      once: true,
      onEnter: function (els) {
        gsap.to(els, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.08, overwrite: true });
        // product photos open like a box lid, then settle
        els.forEach(function (el, i) {
          var media = el.querySelector('.card__media');
          if (!media) return;
          gsap.fromTo(media, { clipPath: 'inset(18% 8% 0% 8% round 24px)' }, { clipPath: 'inset(0% 0% 0% 0% round 24px)', duration: 1.1, ease: 'power3.out', delay: i * 0.08, clearProps: 'clipPath' });
          var img = media.querySelector('img');
          if (img) gsap.fromTo(img, { scale: 1.18 }, { scale: 1, duration: 1.4, ease: 'power3.out', delay: i * 0.08 });
        });
      }
    });

    /* ---- Story photos: slow drift inside their frames ---- */
    q('.story__hero img, .story__detail img').forEach(function (img) {
      gsap.fromTo(img, { scale: 1.14, yPercent: -5 }, {
        yPercent: 5, ease: 'none',
        scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    /* ---- Footer wordmark: letters rise in ---- */
    var mark = document.querySelector('.footer__mark');
    if (mark && !mark.dataset.split) {
      mark.dataset.split = '1';
      mark.innerHTML = mark.textContent.split('').map(function (ch) { return '<span class="ch">' + ch + '</span>'; }).join('');
    }
    gsap.fromTo('.footer__mark .ch', { yPercent: 70, opacity: 0 }, {
      yPercent: 0, opacity: 1, duration: 1, ease: 'power3.out', stagger: 0.07,
      scrollTrigger: { trigger: '.footer__base', start: 'top 95%', once: true }
    });

    return function () {
      gsap.set('[data-reveal], .hero__note, [data-hero-foot], .hero__cake-tilt img, .hero__doily, .hero__shadow, .acc__in, .w > span', { clearProps: 'all' });
    };
  });

  // Pointer: the whole table responds to the cursor by depth (desktop, fine pointers only).
  // Things nearer the viewer follow the cursor; things further back shift the other way,
  // with the page content as the still plane in between.
  mm.add('(prefers-reduced-motion: no-preference) and (pointer: fine) and (min-width: 768px)', function () {
    var movers = [];
    // amp: [x px, y px, rotation deg], sign gives direction relative to the cursor
    function add(targets, amp, dur) {
      q(targets).forEach(function (el) {
        movers.push({
          amp: amp,
          x: gsap.quickTo(el, 'x', { duration: dur, ease: 'power3.out' }),
          y: gsap.quickTo(el, 'y', { duration: dur, ease: 'power3.out' }),
          r: amp[2] ? gsap.quickTo(el, 'rotation', { duration: dur, ease: 'power3.out' }) : null
        });
      });
    }
    add('.hero__cake-tilt', [18, 10, 2.2], 0.9);
    add('.hero__doily', [-12, -8, 0], 1.2);
    add('.acc--near .acc__img', [16, 10, 2.5], 1);
    add('.acc--far .acc__img', [-8, -6, -1.5], 1.3);
    add('.motifs__depth--near > .motifs__pt', [22, 14, 0], 1.1);
    add('.motifs__depth--mid > .motifs__pt', [8, 5, 0], 1.3);
    add('.motifs__depth--far > .motifs__pt', [-10, -6, 0], 1.5);
    add('.deco', [-10, -6, 0], 1.4); // the hand-placed lace and rosettes, moved as a group

    function set(nx, ny) {
      movers.forEach(function (m) {
        m.x(nx * m.amp[0]); m.y(ny * m.amp[1]);
        if (m.r) m.r(nx * m.amp[2]);
      });
    }
    function move(e) { set(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5); }
    function leave(e) { if (!e.relatedTarget) set(0, 0); }
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerout', leave);
    return function () {
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerout', leave);
      set(0, 0);
    };
  });

  // First cut: pinned + scrubbed on tablet/desktop.
  mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', function () {
    var tl = firstCutTimeline();
    ScrollTrigger.create({
      trigger: '[data-firstcut]',
      start: 'top top',
      end: '+=170%',
      pin: true,
      scrub: 0.6,
      animation: tl,
      anticipatePin: 1
    });
  });

  // First cut on phones: same sequence, no pinning.
  mm.add('(max-width: 767px) and (prefers-reduced-motion: no-preference)', function () {
    var tl = firstCutTimeline();
    ScrollTrigger.create({
      trigger: '[data-firstcut]',
      start: 'top 45%',
      end: 'top -15%',
      scrub: 0.5,
      animation: tl
    });
  });

  function firstCutTimeline() {
    gsap.set('.firstcut__word--whole, .firstcut__cap--whole, .firstcut__hint', { visibility: 'visible' });
    var tl = gsap.timeline({ defaults: { ease: 'none' } });
    // 0 – 0.3: the whole cake, held
    tl.fromTo('.firstcut__doily', { opacity: 0.55, rotation: 0, scale: 1 }, { rotation: 90, duration: 1 }, 0)
      .fromTo('.firstcut__hint-line', { scaleX: 0.3 }, { scaleX: 1, duration: 0.25 }, 0)
      .fromTo('.firstcut__hint', { opacity: 1, x: 0 }, { opacity: 0, x: -16, duration: 0.15 }, 0.3)
      // 0.3 – 0.85: the slice is lifted out
      .fromTo('.firstcut__whole', { opacity: 1, scale: 1 }, { scale: 1.2, duration: 0.7, ease: 'power1.in' }, 0.3)
      .to('.firstcut__doily', { opacity: 0, scale: 1.3, duration: 0.35 }, 0.3)
      .fromTo('.firstcut__whole', { opacity: 1 }, { opacity: 0, duration: 0.35 }, 0.3)
      .fromTo('.firstcut__slice', { opacity: 0, scale: 1.18 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'power1.out' }, 0.3)
      .fromTo('.firstcut__word--whole', { yPercent: 0 }, { yPercent: -110, duration: 0.3, ease: 'power2.in' }, 0.32)
      .fromTo('.firstcut__word--cut', { yPercent: 110 }, { yPercent: 0, duration: 0.3, ease: 'power2.out' }, 0.5)
      .fromTo('.firstcut__cap--whole', { opacity: 1, y: 0 }, { opacity: 0, y: -12, duration: 0.2 }, 0.35)
      .fromTo('.firstcut__cap--cut', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.25 }, 0.55)
      .fromTo('.firstcut__buy', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.25 }, 0.66);
    // background pieces drift while the section is held
    q('.firstcut [data-fc-speed]').forEach(function (el) {
      var s = parseFloat(el.dataset.fcSpeed);
      tl.fromTo(el, { y: 50 * s }, { y: -50 * s, duration: 1 }, 0);
    });
    // the ingredient photo eases in a touch while the section is held
    tl.fromTo('.firstcut__bg img', { scale: 1.06 }, { scale: 1, duration: 1 }, 0);
    tl.to({}, { duration: 0.15 }); // brief hold on the cut before release
    return tl;
  }
})();

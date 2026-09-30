/* The Victorias Hotel and Aquatic Center — site behaviour */
(function () {
  'use strict';

  var header = document.getElementById('siteHeader');
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('navToggle');
  var sections = Array.prototype.slice.call(document.querySelectorAll('section[id]'));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- header state on scroll ---------- */
  function onScroll() {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 40);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- mobile menu ---------- */
  function closeMenu() {
    if (!nav || !toggle) return;
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-open', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    document.body.style.overflow = '';
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 860) closeMenu();
    });
  }

  /* ---------- reveal on scroll ---------- */
  var revealables = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ---------- active nav link ---------- */
  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = '#' + entry.target.id;
        navLinks.forEach(function (link) {
          link.classList.toggle('active', link.getAttribute('href') === id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- booking form -> messenger draft ---------- */
  var form = document.getElementById('bookForm');
  var note = document.getElementById('formNote');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var data = new FormData(form);
      var name = (data.get('name') || '').toString().trim();
      var contact = (data.get('contact') || '').toString().trim();

      if (!name || !contact) {
        if (note) {
          note.textContent = 'Please add your name and a mobile number or email so we can reach you.';
          note.classList.remove('ok');
        }
        var first = form.querySelector('input[required]');
        if (first) first.focus();
        return;
      }

      var lines = [
        'Hello Victorias Hotel! I would like to book.',
        '',
        'Name: ' + name,
        'Contact: ' + contact,
        'Room: ' + (data.get('room') || '-'),
        'Guests: ' + (data.get('guests') || '-'),
        'Arrival: ' + (data.get('arrival') || '-'),
        'Departure: ' + (data.get('departure') || '-')
      ];

      var message = (data.get('message') || '').toString().trim();
      if (message) lines.push('Notes: ' + message);

      if (note) {
        note.textContent = 'Opening Messenger with your details…';
        note.classList.add('ok');
      }

      window.open(
        'https://m.me/61560476636504?text=' + encodeURIComponent(lines.join('\n')),
        '_blank',
        'noopener'
      );
    });
  }

  /* ---------- footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- set sensible default dates ---------- */
  var arrival = document.querySelector('input[name="arrival"]');
  var departure = document.querySelector('input[name="departure"]');
  if (arrival && departure) {
    var today = new Date();
    var tomorrow = new Date(today.getTime() + 86400000);
    var dayAfter = new Date(today.getTime() + 2 * 86400000);
    var iso = function (d) { return d.toISOString().slice(0, 10); };
    arrival.min = iso(today);
    departure.min = iso(tomorrow);
    arrival.value = iso(tomorrow);
    departure.value = iso(dayAfter);
    arrival.addEventListener('change', function () {
      var next = new Date(new Date(arrival.value).getTime() + 86400000);
      departure.min = iso(next);
      if (departure.value <= arrival.value) departure.value = iso(next);
    });
  }
})();

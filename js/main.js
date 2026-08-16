/* ==========================================================================
   MUBARAKMIA — Portfolio interactivity
   All motion-heavy behavior respects prefers-reduced-motion.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* ---------- Loader ---------- */
  var loader = document.getElementById('loader');
  function hideLoader() {
    if (loader) loader.classList.add('hidden');
  }
  window.addEventListener('load', function () {
    // small delay so the loader doesn't just flash on fast connections
    setTimeout(hideLoader, reduceMotion ? 0 : 350);
  });
  // Safety net: never trap a user behind the loader
  setTimeout(hideLoader, 4000);

  /* ---------- Scroll progress bar ---------- */
  var progressBar = document.getElementById('scroll-progress');
  function updateScrollProgress() {
    if (!progressBar) return;
    var doc = document.documentElement;
    var scrollTop = doc.scrollTop || document.body.scrollTop;
    var scrollHeight = (doc.scrollHeight || document.body.scrollHeight) - doc.clientHeight;
    var pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    progressBar.style.width = pct + '%';
  }

  /* ---------- Navbar scrolled state ---------- */
  var navbar = document.getElementById('navbar');
  function updateNavbar() {
    if (!navbar) return;
    if (window.scrollY > 24) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  var scrollTicking = false;
  window.addEventListener('scroll', function () {
    if (!scrollTicking) {
      window.requestAnimationFrame(function () {
        updateScrollProgress();
        updateNavbar();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });
  updateScrollProgress();
  updateNavbar();

  /* ---------- Custom cursor (desktop, pointer devices only) ---------- */
  if (isTouch || reduceMotion) {
    document.body.classList.add('no-custom-cursor');
  } else {
    document.body.classList.add('has-custom-cursor');
    var cursorDot = document.createElement('div');
    cursorDot.className = 'cursor-dot';
    cursorDot.setAttribute('aria-hidden', 'true');
    var cursorRing = document.createElement('div');
    cursorRing.className = 'cursor-ring';
    cursorRing.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cursorDot);
    document.body.appendChild(cursorRing);

    var ringX = 0, ringY = 0, dotX = 0, dotY = 0;
    window.addEventListener('mousemove', function (e) {
      dotX = e.clientX; dotY = e.clientY;
      cursorDot.style.transform = 'translate(' + dotX + 'px, ' + dotY + 'px) translate(-50%, -50%)';
    });

    function animateRing() {
      ringX += (dotX - ringX) * 0.18;
      ringY += (dotY - ringY) * 0.18;
      cursorRing.style.transform = 'translate(' + ringX + 'px, ' + ringY + 'px) translate(-50%, -50%)';
      requestAnimationFrame(animateRing);
    }
    requestAnimationFrame(animateRing);

    var expandTargets = 'a, button, .project-card, .filter-btn, input, textarea, select';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest && e.target.closest(expandTargets)) {
        cursorRing.classList.add('expand');
      }
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest && e.target.closest(expandTargets)) {
        cursorRing.classList.remove('expand');
      }
    });
  }

  /* ---------- Mobile hamburger menu ---------- */
  var hamburger = document.getElementById('hamburger');
  var mobileMenu = document.getElementById('mobileMenu');

  function closeMobileMenu() {
    if (!hamburger || !mobileMenu) return;
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  }
  function openMobileMenu() {
    if (!hamburger || !mobileMenu) return;
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    mobileMenu.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      var isOpen = mobileMenu.classList.contains('open');
      if (isOpen) closeMobileMenu(); else openMobileMenu();
    });
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMobileMenu);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) closeMobileMenu();
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  }

  /* ---------- Project filter ---------- */
  var filterBtns = document.querySelectorAll('.filter-btn');
  var projectCards = document.querySelectorAll('.project-card');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      var filter = btn.getAttribute('data-filter');
      projectCards.forEach(function (card) {
        var cats = (card.getAttribute('data-category') || '').split(' ');
        var show = filter === 'all' || cats.indexOf(filter) !== -1;
        card.hidden = !show;
      });
    });
  });

  /* ---------- Case-study modal ---------- */
  var modalOverlay = document.getElementById('projectModal');
  var modalTitle = document.getElementById('modalTitle');
  var modalCat = document.getElementById('modalCat');
  var modalProblem = document.getElementById('modalProblem');
  var modalApproach = document.getElementById('modalApproach');
  var modalResult = document.getElementById('modalResult');
  var modalLive = document.getElementById('modalLiveLink');
  var lastFocusedEl = null;

  function openModal(card) {
    if (!modalOverlay) return;
    lastFocusedEl = document.activeElement;

    if (modalTitle) modalTitle.textContent = card.getAttribute('data-title') || '';
    if (modalCat) modalCat.textContent = card.getAttribute('data-cat-label') || '';
    if (modalProblem) modalProblem.textContent = card.getAttribute('data-problem') || '';
    if (modalApproach) modalApproach.textContent = card.getAttribute('data-approach') || '';
    if (modalResult) modalResult.textContent = card.getAttribute('data-result') || '';

    var liveUrl = card.getAttribute('data-live-url');
    if (modalLive) {
      if (liveUrl) {
        modalLive.href = liveUrl;
        modalLive.hidden = false;
      } else {
        modalLive.hidden = true;
      }
    }

    modalOverlay.classList.add('open');
    modalOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    var closeBtn = modalOverlay.querySelector('.modal-close');
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('open');
    modalOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocusedEl && lastFocusedEl.focus) lastFocusedEl.focus();
  }

  document.querySelectorAll('[data-open-modal]').forEach(function (card) {
    card.addEventListener('click', function () { openModal(card); });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(card);
      }
    });
  });

  if (modalOverlay) {
    modalOverlay.addEventListener('click', function (e) {
      if (e.target === modalOverlay) closeModal();
    });
    var modalCloseBtn = modalOverlay.querySelector('.modal-close');
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !modalOverlay.classList.contains('open')) return;
      closeModal();
    });

    // Basic focus trap while modal is open
    modalOverlay.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !modalOverlay.classList.contains('open')) return;
      var focusable = modalOverlay.querySelectorAll('a[href], button:not([hidden]), [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    });
  }

  /* ---------- Certificate image deterrents (Certifications section only) ----------
     Casual-copying deterrents only — NOT real security. Screenshots, browser dev
     tools, or disabling JS all bypass this trivially. Scoped to .cert-media.protected
     so it never affects other images (hero photo, football photo, project media). */
  document.querySelectorAll('.cert-media.protected').forEach(function (el) {
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    el.addEventListener('dragstart', function (e) { e.preventDefault(); });
  });

  /* ---------- Contact form ---------- */
  var form = document.getElementById('contactForm');
  if (form) {
    var statusEl = document.getElementById('formStatus');
    var submitBtn = form.querySelector('.submit-btn');

    function setError(fieldName, message) {
      var errorEl = form.querySelector('[data-error-for="' + fieldName + '"]');
      var inputEl = form.elements[fieldName];
      if (errorEl) errorEl.textContent = message || '';
      if (inputEl) inputEl.setAttribute('aria-invalid', message ? 'true' : 'false');
    }

    function isValidEmail(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    function validate() {
      var valid = true;
      var name = form.elements['name'].value.trim();
      var email = form.elements['email'].value.trim();
      var message = form.elements['message'].value.trim();

      if (!name) { setError('name', 'Please enter your name.'); valid = false; }
      else setError('name', '');

      if (!email) { setError('email', 'Please enter your email.'); valid = false; }
      else if (!isValidEmail(email)) { setError('email', 'Enter a valid email address.'); valid = false; }
      else setError('email', '');

      if (!message) { setError('message', 'Please add a short message.'); valid = false; }
      else if (message.length < 10) { setError('message', 'Message should be at least 10 characters.'); valid = false; }
      else setError('message', '');

      return valid;
    }

    ['name', 'email', 'message'].forEach(function (fieldName) {
      var el = form.elements[fieldName];
      if (el) el.addEventListener('blur', validate);
    });

    function showStatus(kind, message) {
      if (!statusEl) return;
      statusEl.textContent = message;
      statusEl.className = 'form-status show ' + kind;
      statusEl.setAttribute('role', 'status');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) {
        showStatus('err', 'Please fix the highlighted fields and try again.');
        return;
      }

      // Netlify's spam honeypot: real users never fill this hidden field.
      // If it's filled, drop the submission silently rather than showing an error.
      var honeypot = form.elements['bot-field'];
      if (honeypot && honeypot.value) return;

      if (submitBtn) {
        submitBtn.setAttribute('aria-busy', 'true');
        submitBtn.disabled = true;
      }

      // Wired for Netlify Forms — Netlify detects the data-netlify="true" form
      // at build/deploy time and creates a real endpoint for it automatically,
      // no account ID or API key needed. This POST only lands somewhere once
      // the site is actually deployed on Netlify; locally it's a harmless no-op
      // 404. If you deploy elsewhere (Vercel/GitHub Pages/Cloudflare Pages),
      // swap this for Formspree or another form backend instead.
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
      })
        .then(function () {
          showStatus('ok', "Thanks — your message was received. I'll reply within 1–2 business days.");
          form.reset();
        })
        .catch(function () {
          showStatus('err', 'Something went wrong sending that. Please email me directly instead.');
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.removeAttribute('aria-busy');
            submitBtn.disabled = false;
          }
        });
    });
  }
})();

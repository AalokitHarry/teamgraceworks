(() => {
  const header = document.getElementById('siteHeader');
  const navToggle = document.getElementById('navToggle');
  const nav = document.getElementById('siteNav');
  const toTop = document.getElementById('toTop');
  const yearEl = document.getElementById('year');
  const form = document.getElementById('contactForm');
  const themeToggle = document.getElementById('themeToggle');

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Theme toggle (light/dark, persisted; defaults to system preference)
  if (themeToggle) {
    const root = document.documentElement;
    const syncPressed = () => {
      themeToggle.setAttribute('aria-pressed', String(root.getAttribute('data-theme') === 'dark'));
    };
    syncPressed();

    themeToggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try {
        localStorage.setItem('tgw-theme', next);
      } catch (e) {}
      syncPressed();
    });
  }

  // Sticky header shadow + back-to-top visibility
  const onScroll = () => {
    const scrolled = window.scrollY > 12;
    header.classList.toggle('is-scrolled', scrolled);
    toTop.classList.toggle('is-visible', window.scrollY > 480);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile nav toggle
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      navToggle.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('is-open');
        navToggle.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Scroll-reveal
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  // Contact form -> mailto (no backend on this static site)
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const service = form.service.value;
      const message = form.message.value.trim();

      const subject = `New enquiry from ${name} — ${service}`;
      const body =
        `Name: ${name}\n` +
        `Email: ${email}\n` +
        `Interested in: ${service}\n\n` +
        `${message}`;

      const mailto = `mailto:project.graceworks@gmail.com?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;

      window.location.href = mailto;
    });
  }

  // Per-role vacancy application forms (Careers page)
  document.querySelectorAll('.vacancy-card__toggle').forEach((btn) => {
    const targetForm = document.getElementById(btn.getAttribute('aria-controls'));
    if (!targetForm) return;

    btn.addEventListener('click', () => {
      const wasHidden = targetForm.hasAttribute('hidden');
      targetForm.toggleAttribute('hidden', !wasHidden);
      btn.setAttribute('aria-expanded', String(wasHidden));
      btn.textContent = wasHidden ? 'Hide application form' : 'Apply for this role';
      if (wasHidden) {
        const firstField = targetForm.querySelector('input, textarea');
        if (firstField) firstField.focus();
      }
    });
  });

  document.querySelectorAll('.vacancy-card__form').forEach((vacForm) => {
    vacForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const role = vacForm.getAttribute('data-role');
      const name = vacForm.name.value.trim();
      const email = vacForm.email.value.trim();
      const phone = vacForm.phone.value.trim();
      const availability = vacForm.availability.value;
      const link = vacForm.link.value.trim();
      const message = vacForm.message.value.trim();

      const subject = `Job application — ${role} — ${name}`;
      const body =
        `Name: ${name}\n` +
        `Email: ${email}\n` +
        `Phone: ${phone}\n` +
        `Availability: ${availability}\n` +
        `Applying for: ${role}\n` +
        `Portfolio/resume link: ${link}\n\n` +
        `${message}`;

      const mailto = `mailto:project.graceworks@gmail.com?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;

      window.location.href = mailto;
    });
  });
})();

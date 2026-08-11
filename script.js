(() => {
  const header = document.getElementById('siteHeader');
  const navToggle = document.getElementById('navToggle');
  const nav = document.getElementById('siteNav');
  const toTop = document.getElementById('toTop');
  const yearEl = document.getElementById('year');
  const form = document.getElementById('contactForm');
  const careerForm = document.getElementById('careerForm');
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

  // "Apply for this role" buttons -> pre-select the matching option in the application form
  const roleSelect = document.getElementById('c-role');
  if (roleSelect) {
    document.querySelectorAll('[data-apply-role]').forEach((btn) => {
      btn.addEventListener('click', () => {
        roleSelect.value = btn.getAttribute('data-apply-role');
      });
    });
  }

  // Career application form -> mailto (no backend on this static site)
  if (careerForm) {
    careerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = careerForm.name.value.trim();
      const email = careerForm.email.value.trim();
      const role = careerForm.role.value;
      const link = careerForm.link.value.trim();
      const message = careerForm.message.value.trim();

      const subject = `Job application — ${role} — ${name}`;
      const body =
        `Name: ${name}\n` +
        `Email: ${email}\n` +
        `Applying for: ${role}\n` +
        `Portfolio/resume link: ${link || '—'}\n\n` +
        `${message}`;

      const mailto = `mailto:project.graceworks@gmail.com?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;

      window.location.href = mailto;
    });
  }
})();

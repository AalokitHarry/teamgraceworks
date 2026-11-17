// The Poshtik Kitchen — franchisee enquiry form.
// Sends name, phone and location to the Google Sheet web app set in the form's data-endpoint.
(function () {
  const form = document.getElementById('enquiryForm');
  if (!form) return;

  const endpoint = (form.dataset.endpoint || '').trim();
  const button = form.querySelector('.pk__submit');
  const status = document.getElementById('formStatus');
  const thanks = document.getElementById('thanks');

  const fields = {
    name: {
      input: form.elements.name,
      check: (v) => (v.length >= 2 ? '' : 'Please enter your name.'),
    },
    phone: {
      input: form.elements.phone,
      check: (v) => {
        const digits = v.replace(/\D/g, '');
        if (!v) return 'Please enter your contact number.';
        if (!/^[0-9+\-\s()]+$/.test(v) || digits.length < 10 || digits.length > 13) {
          return 'Please enter a valid contact number, e.g. 98765 43210.';
        }
        return '';
      },
    },
    location: {
      input: form.elements.location,
      check: (v) => (v.length >= 2 ? '' : 'Please enter your city or town.'),
    },
  };

  function showError(field, message) {
    const err = document.getElementById(field.input.id + 'Error');
    err.textContent = message;
    if (message) field.input.setAttribute('aria-invalid', 'true');
    else field.input.removeAttribute('aria-invalid');
  }

  function validate() {
    let first = null;
    Object.values(fields).forEach((f) => {
      const message = f.check(f.input.value.trim());
      showError(f, message);
      if (message && !first) first = f.input;
    });
    return first;
  }

  // once a field has shown an error, re-check it as the visitor fixes it
  Object.values(fields).forEach((f) => {
    f.input.addEventListener('input', () => {
      if (f.input.getAttribute('aria-invalid') === 'true') {
        showError(f, f.check(f.input.value.trim()));
      }
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = '';

    const invalid = validate();
    if (invalid) {
      invalid.focus();
      return;
    }
    if (!endpoint) {
      status.textContent = 'Enquiries are not connected yet. Please try again later.';
      return;
    }

    const data = new URLSearchParams();
    data.set('name', fields.name.input.value.trim());
    data.set('phone', fields.phone.input.value.trim());
    data.set('location', fields.location.input.value.trim());
    data.set('website', form.elements.website.value);

    button.disabled = true;
    button.textContent = 'Sending…';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch(endpoint, { method: 'POST', body: data, signal: controller.signal });
      const reply = await res.json();
      if (!reply.ok) throw new Error(reply.error || 'not saved');

      document.getElementById('thanksName').textContent = ', ' + data.get('name').split(' ')[0];
      document.getElementById('thanksPhone').textContent = data.get('phone');
      document.getElementById('thanksLocation').textContent = data.get('location');
      form.hidden = true;
      thanks.hidden = false;
      thanks.focus();
    } catch (err) {
      status.textContent = "Sorry, your enquiry didn't go through. Please check your connection and try again.";
      button.disabled = false;
      button.textContent = 'Send enquiry';
    } finally {
      clearTimeout(timer);
    }
  });
})();

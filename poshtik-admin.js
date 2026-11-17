// The Poshtik Kitchen — Franchise Enquiry Desk (admin).
// The password is checked by the Google Apps Script, not here; this page holds no enquiry data until it answers.
(function () {
  var endpoint = (document.body.dataset.endpoint || '').trim();
  var AUTO_LOCK_MS = 30 * 60 * 1000;
  var password = '';
  var data = null;
  var lockTimer = null;
  var $ = function (id) { return document.getElementById(id); };

  function load(onDone) {
    var body = new URLSearchParams();
    body.set('action', 'list');
    body.set('password', password);
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 20000);
    fetch(endpoint, { method: 'POST', body: body, signal: controller.signal })
      .then(function (res) { return res.json(); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.error || 'Could not load enquiries.');
        data = res;
        render();
        onDone(null);
      })
      .catch(function (err) {
        var m = err && err.name === 'AbortError' ? 'The sheet took too long to answer. Try again.'
          : (err && err.message && err.message !== 'Failed to fetch' && err.message.indexOf('JSON') === -1)
            ? err.message : 'Could not reach the sheet. Check your connection and try again.';
        onDone(m);
      })
      .finally(function () { clearTimeout(timer); });
  }

  $('lockForm').addEventListener('submit', function (e) {
    e.preventDefault();
    password = $('pw').value;
    if (!password) return;
    var b = $('openBtn');
    b.disabled = true; b.textContent = 'Opening…';
    $('lockMsg').textContent = '';
    load(function (err) {
      b.disabled = false; b.textContent = 'Open desk';
      if (err) { password = ''; $('lockMsg').textContent = err; $('pw').select(); return; }
      $('pw').value = '';
      $('lock').hidden = true;
      $('desk').hidden = false;
      clearTimeout(lockTimer);
      lockTimer = setTimeout(function () { lock('Locked after 30 minutes. Enter the password to open the desk again.'); }, AUTO_LOCK_MS);
    });
  });

  $('refreshBtn').addEventListener('click', function () {
    var b = $('refreshBtn');
    b.disabled = true; b.textContent = 'Refreshing…';
    load(function (err) {
      b.disabled = false; b.textContent = 'Refresh';
      if (err) lock(err);
    });
  });

  $('lockBtn').addEventListener('click', function () { lock(''); });

  function lock(message) {
    password = ''; data = null;
    clearTimeout(lockTimer);
    $('rows').textContent = '';
    $('q').value = '';
    $('desk').hidden = true;
    $('lock').hidden = false;
    $('lockMsg').textContent = message || '';
    $('pw').focus();
  }

  $('q').addEventListener('input', renderRows);

  function dayKey(d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function render() {
    var today = dayKey(new Date());
    $('sTotal').textContent = data.total;
    $('sWeek').textContent = data.week;
    $('sToday').textContent = data.rows.filter(function (r) { return r.ts && dayKey(new Date(r.ts)) === today; }).length;
    $('updated').textContent = 'Updated ' + new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    renderRows();
  }

  function phoneLinks(phone) {
    var digits = String(phone).replace(/\D/g, '');
    if (digits.length === 10) digits = '91' + digits;
    else if (digits.length === 11 && digits.charAt(0) === '0') digits = '91' + digits.slice(1);
    return { tel: 'tel:+' + digits, wa: 'https://wa.me/' + digits };
  }

  function renderRows() {
    if (!data) return;
    var q = $('q').value.trim().toLowerCase();
    var shown = data.rows.filter(function (r) {
      return !q || (r.name + ' ' + r.phone + ' ' + r.location).toLowerCase().indexOf(q) !== -1;
    });
    $('count').textContent = q ? shown.length + ' of ' + data.total : String(data.total);
    var list = $('rows');
    list.textContent = '';
    var dayAgo = Date.now() - 864e5;
    shown.forEach(function (r) {
      var li = el('li', 'item');

      var top = el('div', 'item__top');
      var name = el('p', 'item__name');
      if (r.ts > dayAgo) {
        var dot = el('i', 'dot');
        dot.title = 'New in the last 24 hours';
        name.appendChild(dot);
      }
      name.appendChild(el('span', '', r.name));
      top.appendChild(name);
      top.appendChild(el('p', 'item__when', r.when));

      var contact = el('div', 'item__contact');
      var p = phoneLinks(r.phone);
      contact.appendChild(el('span', 'item__phone', r.phone));
      var call = el('a', 'item__link', 'Call'); call.href = p.tel;
      var wa = el('a', 'item__link', 'WhatsApp'); wa.href = p.wa; wa.target = '_blank'; wa.rel = 'noopener noreferrer';
      contact.appendChild(call); contact.appendChild(wa);

      li.appendChild(top);
      li.appendChild(el('p', 'item__place', r.location));
      li.appendChild(contact);
      list.appendChild(li);
    });
    var empty = $('empty');
    if (!data.total) { empty.hidden = false; empty.textContent = 'No enquiries yet.'; }
    else if (!shown.length) { empty.hidden = false; empty.textContent = 'No enquiries match “' + $('q').value.trim() + '”.'; }
    else empty.hidden = true;
  }

  $('pw').focus();
})();

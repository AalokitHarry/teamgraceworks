// The Poshtik Kitchen — Enquiry Desk (admin).
// The password is checked by the Google Apps Script, not here; this page holds no enquiry data until it answers.
(function () {
  var endpoint = (document.body.dataset.endpoint || '').trim();
  var AUTO_LOCK_MS = 30 * 60 * 1000;
  var password = '';
  var data = null;
  var lockTimer = null;
  var $ = function (id) { return document.getElementById(id); };
  var NS = 'http://www.w3.org/2000/svg';

  /* ---------- icons (simple line icons, drawn here so the page needs no icon font) ---------- */
  var ICONS = {
    refresh: [['path', 'M21 12a9 9 0 1 1-2.6-6.4L21 8'], ['path', 'M21 3v5h-5']],
    lock: [['rect', { x: 4, y: 11, width: 16, height: 10, rx: 2 }], ['path', 'M8 11V7a4 4 0 0 1 8 0v4']],
    search: [['circle', { cx: 11, cy: 11, r: 7 }], ['path', 'm20 20-3.6-3.6']],
    inbox: [['path', 'M22 12h-6l-2 3h-4l-2-3H2'], ['path', 'M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z']],
    pin: [['path', 'M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z'], ['circle', { cx: 12, cy: 10, r: 2.5 }]],
    phone: [['path', 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z']],
    chat: [['path', 'M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 21l1.9-5.2A8.4 8.4 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5z']],
  };
  function icon(name) {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    (ICONS[name] || []).forEach(function (part) {
      var n = document.createElementNS(NS, part[0]);
      if (typeof part[1] === 'string') n.setAttribute('d', part[1]);
      else Object.keys(part[1]).forEach(function (k) { n.setAttribute(k, part[1][k]); });
      svg.appendChild(n);
    });
    return svg;
  }
  function iconSpan(name) {
    var s = document.createElement('span');
    s.className = 'ico';
    s.appendChild(icon(name));
    return s;
  }
  document.querySelectorAll('[data-icon]').forEach(function (s) { s.appendChild(icon(s.dataset.icon)); });

  /* ---------- loading ---------- */
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
    b.disabled = true; b.textContent = 'Signing in…';
    $('lockMsg').textContent = '';
    load(function (err) {
      b.disabled = false; b.textContent = 'Sign in';
      if (err) { password = ''; $('lockMsg').textContent = err; $('pw').select(); return; }
      $('pw').value = '';
      $('lock').hidden = true;
      $('desk').hidden = false;
      clearTimeout(lockTimer);
      lockTimer = setTimeout(function () { lock('Signed out after 30 minutes. Sign in again to continue.'); }, AUTO_LOCK_MS);
    });
  });

  $('refreshBtn').addEventListener('click', function () {
    var b = $('refreshBtn');
    b.disabled = true;
    load(function (err) {
      b.disabled = false;
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

  /* ---------- rendering ---------- */
  function dayKey(d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function initials(name) {
    var parts = String(name).trim().split(/\s+/).filter(Boolean);
    var s = parts.slice(0, 2).map(function (p) { return p.charAt(0); }).join('');
    return (s || '?').toUpperCase();
  }
  function ago(ts) {
    if (!ts) return '';
    var diff = Date.now() - ts;
    var min = Math.floor(diff / 60000);
    if (min < 1) return 'Just now';
    if (min < 60) return min + ' min ago';
    var h = Math.floor(min / 60);
    if (h < 24 && dayKey(new Date(ts)) === dayKey(new Date())) return h + ' h ago';
    var y = new Date(); y.setDate(y.getDate() - 1);
    if (dayKey(new Date(ts)) === dayKey(y)) return 'Yesterday';
    var d = new Date(ts);
    var opts = { day: 'numeric', month: 'short' };
    if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
    return d.toLocaleDateString(undefined, opts);
  }
  function phoneLinks(phone) {
    var digits = String(phone).replace(/\D/g, '');
    if (digits.length === 10) digits = '91' + digits;
    else if (digits.length === 11 && digits.charAt(0) === '0') digits = '91' + digits.slice(1);
    return { tel: 'tel:+' + digits, wa: 'https://wa.me/' + digits };
  }

  function render() {
    var today = dayKey(new Date());
    $('sTotal').textContent = data.total;
    $('sWeek').textContent = data.week;
    $('sToday').textContent = data.rows.filter(function (r) { return r.ts && dayKey(new Date(r.ts)) === today; }).length;
    $('updated').textContent = 'Updated ' + new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    renderRows();
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
      var card = el('li', 'card');

      var head = el('div', 'card__head');
      head.appendChild(el('span', 'avatar', initials(r.name)));
      var who = el('div', 'card__who');
      who.appendChild(el('p', 'card__name', r.name));
      var place = el('p', 'card__place');
      place.appendChild(iconSpan('pin'));
      place.appendChild(el('span', '', r.location));
      who.appendChild(place);
      head.appendChild(who);
      var meta = el('div', 'card__meta');
      var time = el('span', 'card__time', ago(r.ts));
      time.title = r.when;
      meta.appendChild(time);
      if (r.ts > dayAgo) meta.appendChild(el('span', 'badge', 'New'));
      head.appendChild(meta);

      var foot = el('div', 'card__foot');
      foot.appendChild(el('span', 'card__phone', r.phone));
      var actions = el('div', 'card__actions');
      var p = phoneLinks(r.phone);
      var call = el('a', 'btn act act--call');
      call.href = p.tel;
      call.appendChild(iconSpan('phone'));
      call.appendChild(el('span', '', 'Call'));
      var wa = el('a', 'btn act act--wa');
      wa.href = p.wa; wa.target = '_blank'; wa.rel = 'noopener noreferrer';
      wa.appendChild(iconSpan('chat'));
      wa.appendChild(el('span', '', 'WhatsApp'));
      actions.appendChild(call); actions.appendChild(wa);
      foot.appendChild(actions);

      card.appendChild(head);
      card.appendChild(foot);
      list.appendChild(card);
    });

    var empty = $('empty');
    if (!data.total) { empty.hidden = false; $('emptyText').textContent = 'No enquiries yet. New ones will appear here.'; }
    else if (!shown.length) { empty.hidden = false; $('emptyText').textContent = 'No enquiries match “' + $('q').value.trim() + '”.'; }
    else empty.hidden = true;
  }

  $('pw').focus();
})();

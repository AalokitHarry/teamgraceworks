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
  function city(loc) {
    var c = String(loc || '').split(',')[0].trim().toLowerCase();
    return c.replace(/\b\w/g, function (ch) { return ch.toUpperCase(); });
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function render() {
    var rows = data.rows;
    var today = dayKey(new Date());
    $('sTotal').textContent = data.total;
    $('sWeek').textContent = data.week;
    $('sToday').textContent = rows.filter(function (r) { return r.ts && dayKey(new Date(r.ts)) === today; }).length;

    // where enquiries come from
    var counts = {};
    rows.forEach(function (r) { var c = city(r.location); if (c) counts[c] = (counts[c] || 0) + 1; });
    var places = Object.keys(counts).map(function (k) { return { name: k, n: counts[k] }; })
      .sort(function (a, b) { return b.n - a.n || a.name.localeCompare(b.name); });
    $('sTop').textContent = places.length ? places[0].name : '—';
    $('sTopNote').textContent = places.length ? places[0].n + (places[0].n === 1 ? ' enquiry' : ' enquiries') : '';
    var list = $('places');
    list.textContent = '';
    if (!places.length) list.appendChild(el('li', 'none', 'No locations yet.'));
    places.slice(0, 6).forEach(function (p) {
      var li = el('li');
      var row = el('div', 'place__row');
      row.appendChild(el('span', '', p.name));
      row.appendChild(el('span', '', String(p.n)));
      var track = el('div', 'place__track');
      var fill = el('div', 'place__fill');
      fill.style.width = Math.max(4, Math.round(p.n / places[0].n * 100)) + '%';
      track.appendChild(fill);
      li.appendChild(row); li.appendChild(track);
      list.appendChild(li);
    });

    // enquiries per day, last 30 days
    var days = [], byDay = {};
    rows.forEach(function (r) { if (r.ts) { var k = dayKey(new Date(r.ts)); byDay[k] = (byDay[k] || 0) + 1; } });
    for (var i = 29; i >= 0; i--) {
      var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - i);
      days.push({ d: d, n: byDay[dayKey(d)] || 0 });
    }
    var max = Math.max(1, Math.max.apply(null, days.map(function (x) { return x.n; })));
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 300 90');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Enquiries per day for the last 30 days');
    var base = document.createElementNS(ns, 'line');
    base.setAttribute('x1', 0); base.setAttribute('x2', 300); base.setAttribute('y1', 89.5); base.setAttribute('y2', 89.5);
    base.setAttribute('stroke', '#2c2a22');
    svg.appendChild(base);
    days.forEach(function (x, i) {
      var h = x.n ? Math.max(3, x.n / max * 82) : 0;
      var r = document.createElementNS(ns, 'rect');
      r.setAttribute('x', i * 10 + 1.5); r.setAttribute('width', 7);
      r.setAttribute('y', 89 - h); r.setAttribute('height', h);
      r.setAttribute('rx', 1.5);
      r.setAttribute('fill', i === 29 ? '#ecc66f' : '#d9a93f');
      var t = document.createElementNS(ns, 'title');
      t.textContent = x.d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ': ' + x.n;
      r.appendChild(t);
      svg.appendChild(r);
    });
    var trend = $('trend'); trend.textContent = ''; trend.appendChild(svg);
    $('axisStart').textContent = days[0].d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

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
    $('count').textContent = q ? '(' + shown.length + ' of ' + data.total + ')' : '(' + data.total + ')';
    var body = $('rows');
    body.textContent = '';
    var dayAgo = Date.now() - 864e5;
    shown.forEach(function (r) {
      var tr = el('tr');
      var name = el('td', 'name', r.name);
      if (r.ts > dayAgo) name.appendChild(el('span', 'new', 'New'));
      var links = el('div', 'links');
      var p = phoneLinks(r.phone);
      var call = el('a', 'link', 'Call'); call.href = p.tel;
      var wa = el('a', 'link link--wa', 'WhatsApp'); wa.href = p.wa; wa.target = '_blank'; wa.rel = 'noopener noreferrer';
      links.appendChild(call); links.appendChild(wa);
      var act = el('td'); act.appendChild(links);
      [el('td', 'when', r.when), name, el('td', 'phone', r.phone), el('td', '', r.location), act]
        .forEach(function (td) { tr.appendChild(td); });
      body.appendChild(tr);
    });
    var empty = $('empty');
    if (!data.total) { empty.hidden = false; empty.textContent = 'No enquiries yet.'; }
    else if (!shown.length) { empty.hidden = false; empty.textContent = 'No enquiries match “' + $('q').value.trim() + '”.'; }
    else empty.hidden = true;
  }

  $('pw').focus();
})();

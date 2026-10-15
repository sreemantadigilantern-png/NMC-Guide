/* NMC Advertising Compliance Guide: vanilla JS, no build step.
   Each HTML page sets <body data-page="..." data-base="../"> and contains <main id="main"><div id="app"></div></main>.
   All content is loaded from /data/*.json. */
(() => {
  'use strict';

  const BASE = document.body.dataset.base || '';
  const PAGE = document.body.dataset.page || '';
  const LS = 'nmcguide:v1:';

  /* ---------- helpers ---------- */
  const cache = {};
  const getJSON = (name) => {
    if (!cache[name]) {
      cache[name] = fetch(BASE + 'data/' + name + '.json').then((r) => {
        if (!r.ok) throw new Error('Could not load data/' + name + '.json (' + r.status + ')');
        return r.json();
      });
    }
    return cache[name];
  };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const slug = (id) => 'c-' + String(id).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const store = {
    get(k) { try { return localStorage.getItem(LS + k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(LS + k, v); } catch (e) { /* storage unavailable */ } },
    del(k) { try { localStorage.removeItem(LS + k); } catch (e) { /* ignore */ } }
  };
  const norm = (s) => String(s || '').toLowerCase();
  const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');

  /* bullets: split text into sentences / clauses; arrays pass straight through */
  const ABBR = /\b(No|Expl|Reg|e\.g|i\.e|vs|Dr|approx)\./g;
  const parts = (txt) => String(txt).replace(ABBR, (m) => m.replace('.', '\u0001'))
    .split(/(?<=[.!?])\s+(?=[A-Z“"§(‘])|;\s+/).map((x) => x.replace(/\u0001/g, '.').trim()).filter(Boolean);
  const bl = (txt) => {
    const p = Array.isArray(txt) ? txt : parts(txt);
    return p.length > 1 ? '<ul class="bl">' + p.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '<p>' + esc(p[0] || '') + '</p>';
  };

  /* line icons on a 24px grid (stroke style) */
  const ICONS = {
    website: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M6.5 6.6h.01M9.5 6.6h.01"/>',
    landing: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8"/><path d="M8 12h8"/><rect x="8" y="15" width="8" height="3" rx="1.5"/>',
    'google-ads': '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/><path d="M8 10.5h5"/>',
    'meta-ads': '<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15 9a4 4 0 0 1 0 6"/><path d="M18 6.5a8 8 0 0 1 0 11"/>',
    social: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10.5l5-3v9l-5-3"/>',
    blog: '<path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6"/><path d="M9 13h8M9 17h8"/>',
    'service-content': '<path d="M6 3v6a4 4 0 0 0 8 0V3"/><path d="M10 13v2a5 5 0 0 0 10 0v-1"/><circle cx="20" cy="12" r="2"/>',
    'seo-gbp': '<path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
    other: '<path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>',
    am: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17.5" cy="9" r="2.5"/><path d="M17 14a5 5 0 0 1 4.5 5"/>',
    ppc: '<path d="M4 20V10M10 20V4M16 20v-7M2 20h20"/>',
    seo: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',
    content: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    creative: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10.5l5-3v9l-5-3"/>',
    dev: '<path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/>',
    lead: '<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/><path d="M9 12l2 2 4-4"/>',
    guidelines: '<path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z"/><path d="M8 9h8M8 13h6"/>',
    fix: '<path d="M9 6h12M9 12h12M9 18h12"/><path d="M3 6l1 1 2-2M3 12l1 1 2-2M3 18l1 1 2-2"/>',
    going: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/>',
    grey: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.6 2.6 0 1 1 3.6 2.4c-.7.4-1.1.9-1.1 1.6"/><path d="M12 17h.01"/>',
    reference: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
    shield: '<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/><path d="M9 12l2 2 4-4"/>'
  };
  const icon = (n, cls) => '<svg class="ico ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (ICONS[n] || ICONS.shield) + '</svg>';
  const tile = (n) => '<span class="ico-tile">' + icon(n) + '</span>';

  let META, CLAUSES, CLAUSE_MAP;

  const clauseChips = (ids) => {
    if (!ids || !ids.length) return '';
    return '<span class="clauses">' + ids.map((id) => {
      const c = CLAUSE_MAP[id];
      if (!c) return '<span class="clause" style="border-color:#A12117">?' + esc(id) + '</span>';
      return '<a class="clause" href="' + BASE + 'reference.html#' + slug(id) + '" title="' + esc(c.label + ': ' + c.title) + '">' + esc(c.label) + '</a>';
    }).join('') + '</span>';
  };
  const basisBadge = (b) => b === 'interp'
    ? '<span class="badge b-interp" title="Not stated in the NMC document">Our interpretation</span>'
    : '<span class="badge b-doc" title="Stated in the NMC document">Document says</span>';
  const chName = (id) => id === 'all' ? 'All channels' : ((META.channels.find((c) => c.id === id) || {}).name || id);
  const deptName = (id) => (META.departments.find((d) => d.id === id) || {}).name || id;
  const typeInfo = (id) => META.actionTypes.find((t) => t.id === id) || { id, name: id, help: '' };
  const typeBadge = (id) => '<span class="badge t-' + esc(id) + '" title="' + esc(typeInfo(id).help) + '">' + esc(typeInfo(id).name) + '</span>';
  const interpNote = (txt) => '<div class="interp-note"><b>Our interpretation</b>' + bl(txt) + '</div>';

  /* ---------- shell: header and footer ---------- */
  const NAV = [
    ['guidelines.html', 'The guidelines'],
    ['fix-now.html', 'Fix now'],
    ['channels/index.html', 'Channel playbooks'],
    ['going-forward.html', 'Going forward'],
    ['departments.html', 'By department'],
    ['grey-areas.html', 'Grey areas'],
    ['reference.html', 'Reference']
  ];
  const currentFile = () => {
    const p = location.pathname;
    if (/\/channels\//.test(p)) return 'channels/index.html';
    const f = p.split('/').pop() || 'index.html';
    return f;
  };

  function renderShell() {
    const cur = currentFile();
    const vlabel = META.version + ' · Last updated ' + META.lastUpdatedLabel;
    const header = document.createElement('header');
    header.className = 'site-header';
    header.innerHTML =
      '<div class="wrap nav-row">' +
      '<a class="brand" href="' + BASE + 'index.html" aria-label="' + esc(META.org) + ' · ' + esc(META.siteTitle) + ' home"><img src="' + BASE + 'assets/img/logo.png" alt="' + esc(META.org) + '" height="34"><span>NMC Advertising<br>Compliance Guide</span></a>' +
      '<button class="nav-toggle" aria-expanded="false" aria-controls="navlinks">Menu</button>' +
      '<ul class="nav-links" id="navlinks">' +
      NAV.map(([href, label]) => '<li><a href="' + BASE + href + '"' + (cur === href ? ' aria-current="page"' : '') + '>' + esc(label) + '</a></li>').join('') +
      '<li><span class="vchip" title="Version and last updated date">' + esc(vlabel) + '*</span></li>' +
      '</ul></div>';
    document.body.insertBefore(header, document.body.firstChild);
    const skip = document.createElement('a');
    skip.className = 'skip'; skip.href = '#main'; skip.textContent = 'Skip to content';
    document.body.insertBefore(skip, document.body.firstChild);
    const tog = $('.nav-toggle', header);
    tog.addEventListener('click', () => {
      const open = $('#navlinks').classList.toggle('open');
      tog.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML =
      '<div class="wrap"><div class="foot-grid">' +
      '<div><h4>' + esc(META.siteTitle) + '</h4><p>Internal guide for ' + esc(META.org) + ' teams working with healthcare and wellness clients.</p>' +
      '<p class="vline">' + esc(vlabel) + '*</p></div>' +
      '<div><h4>Pages</h4><ul>' + NAV.map(([href, label]) => '<li><a href="' + BASE + href + '">' + esc(label) + '</a></li>').join('') + '</ul></div>' +
      '<div><h4>Source</h4><ul><li><a href="' + BASE + esc(META.source.file) + '">Original NMC notice (PDF)</a></li>' +
      '<li>' + esc(META.source.ref) + ', ' + esc(META.source.date) + '</li>' +
      '<li><a href="' + BASE + 'index.html#coverage">Coverage and limitations</a></li></ul></div></div>' +
      '<p class="footnote">' + esc(META.footnote) + '</p></div>';
    document.body.appendChild(footer);
  }

  function pageHead(eyebrow, title, intro, crumbs, ico) {
    return '<section class="page-head"><div class="wrap ph"><div class="ph-text">' +
      (crumbs ? '<nav class="crumbs" aria-label="Breadcrumb">' + crumbs + '</nav>' : '') +
      '<span class="eyebrow">' + esc(eyebrow) + '</span><h1>' + title + '</h1>' +
      (intro ? '<p>' + intro + '</p>' : '') + '</div>' +
      (ico ? '<div class="head-art" aria-hidden="true">' + icon(ico) + '</div>' : '') + '</div></section>';
  }

  /* ---------- usage map (for clause index) ---------- */
  function buildUsage(d) {
    const u = {};
    const add = (ids, href, label) => (ids || []).forEach((id) => { (u[id] = u[id] || []).push({ href, label }); });
    d.rules.rules.forEach((r) => add(r.clauses, BASE + 'guidelines.html#rule-' + r.id, 'Guidelines ' + r.id));
    d.actions.actions.forEach((a) => add(a.clauses, BASE + 'fix-now.html?id=' + a.id, 'Fix now ' + a.id));
    d.playbooks.playbooks.forEach((p) => {
      const ids = new Set();
      ['allowed', 'notAllowed', 'disclosure', 'grey'].forEach((k) => p[k].forEach((i) => i.c.forEach((x) => ids.add(x))));
      p.examples.forEach((e) => e.c.forEach((x) => ids.add(x)));
      add(Array.from(ids), BASE + 'channels/' + p.id + '.html', p.name);
    });
    d.departments.departments.forEach((dep) => {
      const ids = new Set();
      ['start', 'stop'].forEach((k) => dep[k].forEach((i) => i.c.forEach((x) => ids.add(x))));
      add(Array.from(ids), BASE + 'departments.html#' + dep.id, dep.name);
    });
    d.grey.items.forEach((g) => add(g.clauses, BASE + 'grey-areas.html#' + g.id, 'Grey area ' + g.id));
    const gf = d.going;
    add(gf.intake.groups.flatMap((g) => g.questions.flatMap((q) => q.c)), BASE + 'going-forward.html#intake', 'Intake questionnaire');
    add(gf.qa.lists.flatMap((l) => l.items.flatMap((i) => i.c)), BASE + 'going-forward.html#qa', 'QA checklists');
    add(gf.workflow.steps.flatMap((s) => s.c), BASE + 'going-forward.html#workflow', 'Approval workflow');
    add(gf.contract.points.flatMap((p) => p.c), BASE + 'going-forward.html#contract', 'Contract points');
    d.glossary.faq.forEach((f, i) => add(f.c, BASE + 'reference.html#faq-' + i, 'FAQ ' + (i + 1)));
    d.glossary.glossary.forEach((g) => add(g.c, BASE + 'reference.html#glossary', 'Glossary'));
    return u;
  }

  /* ---------- pages ---------- */
  function renderHome(d) {
    const rules = d.rules.rules, actions = d.actions.actions;
    const removeStop = actions.filter((a) => a.type === 'remove' || a.type === 'stop').length;
    const cards = [
      ['guidelines.html', 'The guidelines explained', 'What the NMC says, by theme, with clauses.', 'guidelines'],
      ['fix-now.html', 'Fix now', 'What to check and correct in live client work.', 'fix'],
      ['channels/index.html', 'Channel playbooks', 'Allowed, not allowed and rewrites for each channel.', 'meta-ads'],
      ['going-forward.html', 'Going forward', 'Client intake, QA checklists, approvals, contract points.', 'going'],
      ['departments.html', 'By department', 'What changes for each team.', 'am'],
      ['grey-areas.html', 'Grey areas', 'What the document leaves unclear.', 'grey'],
      ['reference.html', 'Glossary, FAQ, clause index', 'Terms, questions, and every clause mapped.', 'reference']
    ];
    const hero =
      '<section class="hero"><div class="wrap hero-grid reveal"><div><span class="eyebrow">Internal guide · Healthcare clients</span>' +
      '<h1>Advertise healthcare, <em class="accent">ethically</em>, in every channel.</h1>' +
      '<p class="lead">What the NMC rules say, what to fix now, and how we work from here.</p>' +
      '<div class="hero-cta"><a class="btn btn-primary" href="#roles">Start here by role</a><a class="btn btn-ghost" href="' + BASE + 'fix-now.html">See what to fix now</a></div></div>' +
      '<img class="hero-art" src="' + BASE + 'assets/img/hero.svg" alt="A clinic web page showing a doctor with registration number, protected by a shield, with testimonials and before-and-after marked as not allowed" width="520" height="440"></div></section>';
    const stats =
      '<div class="wrap"><div class="stats reveal" role="list">' +
      [[rules.length, 'rules explained'], [CLAUSES.length, 'clauses mapped'], [META.channels.length, 'channels covered'], [removeStop, 'remove or stop actions']]
        .map(([n, l]) => '<div class="stat" role="listitem"><b>' + n + '</b><span>' + esc(l) + '</span></div>').join('') +
      '</div></div>';
    const changed =
      '<section class="block"><div class="wrap"><div class="section-head"><span class="eyebrow">What changed</span><h2>The rules in six points</h2></div>' +
      '<ul class="bl big">' + META.whatChanged.map((w) => '<li>' + esc(w.t) + ' ' + clauseChips(w.c) + '</li>').join('') + '</ul>' +
      '<p class="muted">Read the original: <a href="' + BASE + esc(META.source.file) + '">' + esc(META.source.ref) + ' (PDF)</a>.</p></div></section>';
    const hub =
      '<section class="block alt"><div class="wrap"><div class="section-head"><span class="eyebrow">Where to go</span><h2>Seven pages, one purpose each</h2></div><div class="grid cols-3">' +
      cards.map((c, i) => '<a class="card" href="' + BASE + c[0] + '">' + tile(c[3]) + '<span class="num">0' + (i + 1) + ' / ' + esc(['Guidelines', 'Fix now', 'Channels', 'Going forward', 'Departments', 'Grey areas', 'Reference'][i]).toUpperCase() + '</span><h3>' + esc(c[1]) + '</h3><p>' + esc(c[2]) + '</p><span class="go">Open</span></a>').join('') +
      '</div></div></section>';
    const roles =
      '<section class="block" id="roles"><div class="wrap"><div class="section-head"><span class="eyebrow">Start here by role</span><h2>Find your rules in under 30 seconds</h2><p class="muted">Pick your team. You get what changes in your daily work, your playbooks and your fix-now list.</p></div><div class="grid cols-3">' +
      d.departments.departments.map((dep) => {
        const n = actions.filter((a) => a.depts.includes(dep.id)).length;
        return '<a class="card" href="' + BASE + 'departments.html#' + dep.id + '">' + tile(dep.id) + '<span class="num">' + esc(dep.short) + '</span><h3>' + esc(dep.name) + '</h3><p>' + esc(dep.summary.split('. ')[0].replace(/\.$/, '')) + '.</p><p class="muted">' + plural(n, 'fix-now item') + '</p><span class="go">Open your view</span></a>';
      }).join('') + '</div></div></section>';
    const dd =
      '<section class="block alt"><div class="wrap"><div class="section-head"><span class="eyebrow">At a glance</span><h2>Do and don\'t</h2></div><div class="dd">' +
      '<div class="do"><h3>Do</h3><ul>' + META.doDont.do.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul></div>' +
      '<div class="dont"><h3>Don\'t</h3><ul>' + META.doDont.dont.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul></div></div>' +
      '<p style="margin-top:14px"><a href="' + BASE + 'channels/index.html">Do and don\'t for each channel →</a></p></div></section>';
    const cov =
      '<section class="block" id="coverage"><div class="wrap"><div class="section-head"><span class="eyebrow">Coverage and limitations</span><h2>What this guide covers, and what it does not</h2></div><div class="grid cols-2">' +
      '<div class="card"><h3>Covers</h3><ul>' + META.coverage.covers.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul></div>' +
      '<div class="card"><h3>Limits</h3><ul>' + META.coverage.limits.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul></div></div>' +
      '<div class="callout" style="margin-top:16px"><p><b>How to read the labels.</b> <span class="badge b-doc">Document says</span> means the NMC document states it, and the clause is shown. <span class="badge b-interp">Our interpretation</span> means it is our recommended practice.</p></div></div></section>';
    return hero + stats + changed + hub + roles + dd + cov;
  }

  function renderGuidelines(d) {
    const { themes, rules } = d.rules;
    let html = pageHead('The guidelines explained', 'What the NMC document <em class="accent">says</em>, in plain language',
      'Grouped by theme. Every point cites its clause. Our additions are labelled “Our interpretation”.', null, 'guidelines');
    html += '<section class="block"><div class="wrap">' +
      '<div class="callout info"><p><b>Source:</b> ' + esc(META.source.title) + ', ' + esc(META.source.ref) + ', dated ' + esc(META.source.date) + '. <a href="' + BASE + esc(META.source.file) + '">Open the PDF</a>. Clause chips link to the clause index.</p></div>' +
      '<div style="margin:20px 0"><label class="f" for="q">Search the rules</label><input type="search" id="q" placeholder="Try: testimonial, AI, offer, photo, §8.1(iii)"></div>' +
      '<div class="toc" aria-label="Jump to theme">' + themes.map((t) => '<a class="chip" href="#theme-' + t.id + '">' + esc(t.title) + '</a>').join('') + '</div>' +
      '<p class="count" id="count" aria-live="polite"></p><div id="rules"></div></div></section>';
    $('#app').innerHTML = html;

    const draw = () => {
      const q = norm($('#q').value);
      let shown = 0;
      const out = themes.map((t) => {
        const rs = rules.filter((r) => r.theme === t.id).filter((r) => {
          if (!q) return true;
          const hay = norm([r.id, [].concat(r.says).join(' '), r.interp, r.clauses.map((c) => (CLAUSE_MAP[c] || {}).label).join(' '), r.channels.map(chName).join(' ')].join(' '));
          return q.split(/\s+/).every((w) => hay.includes(w));
        });
        shown += rs.length;
        if (!rs.length) return '';
        return '<section class="theme" id="theme-' + t.id + '"><h2>' + esc(t.title) + '</h2><p class="intro">' + esc(t.intro) + '</p>' +
          rs.map((r) =>
            '<article class="rule" id="rule-' + r.id + '"><div class="top"><span class="rid">' + r.id + '</span><span class="badge b-doc">Document says</span>' + clauseChips(r.clauses) + '</div>' +
            bl(r.says) +
            '<p class="muted" style="font-size:.85rem;margin:6px 0 0">Applies to: ' + (r.channels[0] === 'all' ? 'all channels' : r.channels.map((c) => '<a href="' + BASE + 'channels/' + c + '.html">' + esc(chName(c)) + '</a>').join(', ')) + '</p>' +
            (r.interp ? interpNote(r.interp) : '') + '</article>').join('') + '</section>';
      }).join('');
      $('#rules').innerHTML = out || '<div class="noresult">No rules match your search.</div>';
      $('#count').textContent = 'Showing ' + shown + ' of ' + rules.length + ' rules';
    };
    $('#q').addEventListener('input', draw);
    draw();
  }

  function renderFixNow(d) {
    const A = d.actions.actions;
    const order = { stop: 0, remove: 1, rewrite: 2, disclose: 3, verify: 4 };
    const sorted = A.slice().sort((a, b) => (order[a.type] - order[b.type]) || a.id.localeCompare(b.id));
    const opt = (arr, all) => '<option value="">' + all + '</option>' + arr.map((o) => '<option value="' + esc(o.id) + '">' + esc(o.name) + '</option>').join('');
    let html = pageHead('Fix now', 'What to correct in <em class="accent">ongoing</em> client work',
      'Check live work against this register. Filter, then open a row for the steps.', null, 'fix');
    html += '<section class="toolbar"><div class="wrap"><div class="row">' +
      '<div><label class="f" for="q">Search</label><input type="search" id="q" placeholder="Search checks, claims, clauses…"></div>' +
      '<div><label class="f" for="fc">Channel</label><select id="fc">' + opt(META.channels, 'All channels') + '</select></div>' +
      '<div><label class="f" for="ft">Action type</label><select id="ft">' + opt(META.actionTypes, 'All actions') + '</select></div>' +
      '<div><label class="f" for="fd">Department</label><select id="fd">' + opt(META.departments, 'All departments') + '</select></div>' +
      '<div style="display:flex;gap:8px"><button class="btn btn-line btn-sm" id="reset" type="button">Reset</button></div></div></div></section>';
    html += '<section class="block" style="padding-top:20px"><div class="wrap">' +
      '<div class="callout info"><p><b>Action types.</b> ' + META.actionTypes.map((t) => '<span class="badge t-' + t.id + '">' + esc(t.name) + '</span> ' + esc(t.help)).join(' &nbsp; ') + '</p><p>Educational content is not blanket-deleted. “Remove” is used only where the document prohibits the content. Rows marked <span class="badge b-interp">Our interpretation</span> apply the document to cases it does not mention.</p></div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between"><p class="count" id="count" aria-live="polite"></p>' +
      '<div style="display:flex;gap:8px"><button class="btn btn-line btn-sm" id="expand" type="button">Expand all</button><button class="btn btn-line btn-sm" id="csv" type="button">Download CSV</button></div></div>' +
      '<div class="reg" id="reg"></div></div></section>';
    $('#app').innerHTML = html;

    const params = new URLSearchParams(location.search);
    $('#q').value = params.get('q') || '';
    $('#fc').value = params.get('channel') || '';
    $('#ft').value = params.get('type') || '';
    $('#fd').value = params.get('dept') || '';
    const focusId = params.get('id');
    let allOpen = false;
    let current = [];

    const rowHtml = (a) =>
      '<article class="row-card" id="' + a.id + '"><div class="head">' +
      '<div><div class="what">' + esc(a.check) + '</div><p class="muted" style="margin:4px 0 0;font-size:.93rem"><b>What is wrong:</b> ' + esc(a.wrong) + '</p></div>' +
      '<div class="meta">' + typeBadge(a.type) + '<span class="muted" style="font-size:.85rem">' + esc(a.channels.map(chName).join(', ')) + '</span><span style="font-size:.85rem"><b>Owner:</b> ' + esc(a.depts.map(deptName).join(', ')) + '</span></div>' +
      '<div class="meta">' + clauseChips(a.clauses) + basisBadge(a.basis) + '</div></div>' +
      '<div style="padding:0 18px 12px"><button class="toggle" type="button" aria-expanded="false" aria-controls="d-' + a.id + '">Recommended steps ▾</button></div>' +
      '<div class="detail" id="d-' + a.id + '"><dl><div><dt>Recommended steps</dt><dd>' + bl(a.how) + '</dd></div>' +
      (a.keep ? '<div><dt>Note</dt><dd class="keepnote">' + esc(a.keep) + '</dd></div>' : '') +
      (a.basis === 'interp' ? '<div><dd>' + interpNote(['This row applies the document to a case it does not mention directly.']) + '</dd></div>' : '') +
      '<div><dt>Reference</dt><dd class="muted">' + a.id + '</dd></div></dl></div></article>';

    const apply = () => {
      const q = norm($('#q').value).split(/\s+/).filter(Boolean);
      const fc = $('#fc').value, ft = $('#ft').value, fd = $('#fd').value;
      current = sorted.filter((a) => {
        if (fc && !a.channels.includes(fc)) return false;
        if (ft && a.type !== ft) return false;
        if (fd && !a.depts.includes(fd)) return false;
        if (q.length) {
          const hay = norm([a.id, a.check, a.wrong, a.how, a.keep, a.channels.map(chName).join(' '), a.depts.map(deptName).join(' '), a.clauses.map((c) => (CLAUSE_MAP[c] || {}).label).join(' '), typeInfo(a.type).name].join(' '));
          if (!q.every((w) => hay.includes(w))) return false;
        }
        return true;
      });
      $('#reg').innerHTML = current.length ? current.map(rowHtml).join('') : '<div class="noresult">No items match these filters. <button class="btn btn-line btn-sm" type="button" id="reset2">Reset filters</button></div>';
      $('#count').textContent = 'Showing ' + current.length + ' of ' + A.length + ' items';
      const r2 = $('#reset2'); if (r2) r2.addEventListener('click', reset);
      const np = new URLSearchParams();
      if ($('#q').value) np.set('q', $('#q').value);
      if (fc) np.set('channel', fc); if (ft) np.set('type', ft); if (fd) np.set('dept', fd);
      try { history.replaceState(null, '', location.pathname + (np.toString() ? '?' + np : '')); } catch (e) { /* ignore */ }
      if (allOpen) $$('.row-card').forEach((r) => setOpen(r, true));
    };
    const setOpen = (row, open) => {
      row.classList.toggle('open', open);
      const b = $('.toggle', row);
      if (b) { b.setAttribute('aria-expanded', open ? 'true' : 'false'); b.textContent = open ? 'Recommended steps ▴' : 'Recommended steps ▾'; }
    };
    const reset = () => { $('#q').value = ''; $('#fc').value = ''; $('#ft').value = ''; $('#fd').value = ''; apply(); };

    $('#reg').addEventListener('click', (e) => {
      const b = e.target.closest('.toggle');
      if (b) { const row = b.closest('.row-card'); setOpen(row, !row.classList.contains('open')); }
    });
    ['input', 'change'].forEach((ev) => $$('#q,#fc,#ft,#fd').forEach((el) => el.addEventListener(ev, apply)));
    $('#reset').addEventListener('click', reset);
    $('#expand').addEventListener('click', (e) => {
      allOpen = !allOpen;
      $$('.row-card').forEach((r) => setOpen(r, allOpen));
      e.target.textContent = allOpen ? 'Collapse all' : 'Expand all';
    });
    $('#csv').addEventListener('click', () => {
      const q = (s) => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
      const rows = [['ID', 'What to check', 'Channels', 'What is wrong', 'Action type', 'Recommended action', 'Owner departments', 'Clauses', 'Basis']].concat(
        current.map((a) => [a.id, a.check, a.channels.map(chName).join('; '), a.wrong, typeInfo(a.type).name, a.how, a.depts.map(deptName).join('; '), a.clauses.map((c) => (CLAUSE_MAP[c] || {}).label || c).join('; '), a.basis === 'interp' ? 'Our interpretation' : 'Document says']));
      const blob = new Blob(['﻿' + rows.map((r) => r.map(q).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'nmc-fix-now-register.csv';
      document.body.appendChild(a); a.click(); a.remove();
    });
    apply();
    if (focusId) {
      const row = document.getElementById(focusId);
      if (row) { setOpen(row, true); row.scrollIntoView({ block: 'center' }); row.style.outline = '3px solid var(--brand-accent)'; }
    }
  }

  function renderChannelsHub(d) {
    const pbs = d.playbooks.playbooks;
    let html = pageHead('Channel playbooks', 'One playbook for <em class="accent">every</em> channel',
      'Allowed, not allowed, disclosure, grey areas and before → after rewrites.', null, 'meta-ads');
    html += '<section class="block"><div class="wrap"><div class="grid cols-3">' +
      pbs.map((p, i) => {
        const n = d.actions.actions.filter((a) => a.channels.includes(p.channel)).length;
        const num = String(i + 1).padStart(2, '0');
        return '<a class="card" href="' + p.id + '.html">' + tile(p.channel) + '<span class="num">' + num + ' / ' + esc(p.name.split(' ')[0]).toUpperCase() + '</span><h3>' + esc(p.name) + '</h3><p>' + esc((META.channels.find((c) => c.id === p.channel) || {}).blurb || '') + '</p><p class="muted">' + plural(p.notAllowed.length, 'prohibition') + ' · ' + plural(p.examples.length, 'rewrite') + ' · ' + plural(n, 'fix-now item') + '</p><span class="go">Open playbook</span></a>';
      }).join('') + '</div></div></section>';
    $('#app').innerHTML = html;
  }

  function renderChannel(d) {
    const id = document.body.dataset.channel;
    const pbs = d.playbooks.playbooks;
    const p = pbs.find((x) => x.id === id);
    if (!p) { $('#app').innerHTML = '<div class="wrap err">Unknown playbook “' + esc(id) + '”.</div>'; return; }
    const item = (i) => '<li><span>' + esc(i.t) + '</span><span>' + clauseChips(i.c) + ' ' + basisBadge(i.b) + '</span></li>';
    const block = (cls, title, sub, arr, extra) =>
      '<div class="pb ' + cls + '"><h3>' + title + '</h3><p class="muted" style="font-size:.9rem">' + sub + '</p>' + (extra || '') + (arr.length ? '<ul>' + arr.map(item).join('') + '</ul>' : '<p class="muted">Nothing listed.</p>') + '</div>';
    const nFix = d.actions.actions.filter((a) => a.channels.includes(p.channel)).length;
    let html = pageHead('Channel playbook', esc(p.name), esc(p.intro),
      '<a href="' + BASE + 'index.html">Home</a> / <a href="index.html">Channel playbooks</a> / ' + esc(p.name), p.channel);
    html += '<section class="block"><div class="wrap">' +
      '<div class="pb-nav" style="margin-bottom:22px"><a class="btn btn-line btn-sm" href="' + BASE + 'fix-now.html?channel=' + p.channel + '">Fix-now items for this channel (' + nFix + ')</a>' +
      '<a class="btn btn-line btn-sm" href="#examples">Before → after examples</a><a class="btn btn-line btn-sm" href="' + BASE + 'going-forward.html#qa">QA checklist</a></div>' +
      '<div class="pb-grid">' +
      block('allowed', '✓ Allowed', 'Safe to do, with the clause that supports it.', p.allowed) +
      block('notallowed', '✕ Not allowed', 'Do not publish. Remove or rewrite.', p.notAllowed) +
      block('disclosure', 'Needs a disclaimer or disclosure', 'Allowed only with these details shown.', p.disclosure) +
      block('grey', 'Grey areas', 'Unclear in the document. Treat as our interpretation.', p.grey) +
      '</div>' +
      '<div class="section-head" id="examples" style="margin-top:44px"><span class="eyebrow">Rewrite examples</span><h2>Before → after</h2><p class="muted">Generic examples only. No real clients or patients.</p></div>' +
      p.examples.map((e) =>
        '<div class="ba"><div class="before"><span class="lbl">Before</span>' + esc(e.before) + '</div><div class="after"><span class="lbl">After</span>' + esc(e.after) + '</div>' +
        '<div class="why"><b>Why:</b> ' + esc(e.why) + ' ' + clauseChips(e.c) + '</div></div>').join('') +
      '<div class="pb-nav" style="margin-top:28px">' + pbs.filter((x) => x.id !== id).map((x) => '<a class="chip" href="' + x.id + '.html">' + esc(x.name) + '</a>').join('') + '</div>' +
      '</div></section>';
    $('#app').innerHTML = html;
  }

  function checklistHtml(list, idPrefix) {
    return '<ul class="cl" data-list="' + idPrefix + '">' + list.map((i) =>
      '<li data-id="' + i.id + '"><input type="checkbox" id="cb-' + i.id + '" data-key="' + i.id + '"><label for="cb-' + i.id + '"><span class="t">' + esc(i.t) + '</span> ' + clauseChips(i.c) + (i.b ? ' ' + basisBadge(i.b) : '') + '</label></li>').join('') + '</ul>';
  }
  function wireChecklists(root) {
    $$('ul.cl', root).forEach((ul) => {
      const wrap = ul.closest('[data-cl-wrap]') || ul.parentElement;
      const bar = $('.progress > i', wrap), label = $('.pct', wrap);
      const update = () => {
        const boxes = $$('input[type=checkbox]', ul);
        const n = boxes.filter((b) => b.checked).length;
        boxes.forEach((b) => b.closest('li').classList.toggle('done', b.checked));
        if (bar) bar.style.width = (boxes.length ? (100 * n / boxes.length) : 0) + '%';
        if (label) label.textContent = n + ' of ' + boxes.length + ' done';
      };
      $$('input[type=checkbox]', ul).forEach((b) => {
        b.checked = store.get('tick:' + b.dataset.key) === '1';
        b.addEventListener('change', () => { b.checked ? store.set('tick:' + b.dataset.key, '1') : store.del('tick:' + b.dataset.key); update(); });
      });
      const reset = $('.cl-reset', wrap);
      if (reset) reset.addEventListener('click', () => { $$('input[type=checkbox]', ul).forEach((b) => { b.checked = false; store.del('tick:' + b.dataset.key); }); update(); });
      update();
    });
  }
  const clHead = (title) => '<div class="cl-head"><h3 style="margin:0">' + esc(title) + '</h3><div><span class="pct muted" style="margin-right:10px;font-size:.9rem"></span><button class="btn btn-line btn-sm cl-reset" type="button">Clear ticks</button></div></div><div class="progress" aria-hidden="true"><i></i></div>';

  function renderGoing(d) {
    const g = d.going;
    let html = pageHead('Going forward', 'How we work with <em class="accent">new</em> and future clients',
      'Client intake, QA before publishing, who approves what, and contract points.', null, 'going');
    html += '<section class="block"><div class="wrap"><div class="toc"><a class="chip" href="#intake">Client intake</a><a class="chip" href="#qa">QA checklists</a><a class="chip" href="#workflow">Approval workflow</a><a class="chip" href="#contract">Contract points</a></div>' +
      '<div class="callout info"><p>Checklist ticks are saved in <b>this browser only</b>. They are for your own tracking and are not shared.</p></div></div></section>';

    html += '<section class="block alt" id="intake"><div class="wrap"><div class="section-head"><span class="eyebrow">01</span><h2>' + esc(g.intake.title) + '</h2><p class="muted">' + esc(g.intake.intro) + '</p></div>' +
      '<p><button class="btn btn-line btn-sm" id="copyq" type="button">Copy questionnaire as text</button> <span class="muted" id="copied" aria-live="polite"></span></p>' +
      g.intake.groups.map((gr, gi) => '<details class="acc"' + (gi === 0 ? ' open' : '') + '><summary>' + esc(gr.name) + '</summary><div class="body"><ol>' +
        gr.questions.map((q) => '<li style="margin-bottom:12px"><b>' + esc(q.q) + '</b><br><span class="muted">Why: ' + esc(q.why) + '</span> ' + clauseChips(q.c) + '</li>').join('') + '</ol></div></details>').join('') + '</div></section>';

    html += '<section class="block" id="qa"><div class="wrap"><div class="section-head"><span class="eyebrow">02</span><h2>' + esc(g.qa.title) + '</h2><p class="muted">' + esc(g.qa.intro) + '</p></div>' +
      g.qa.lists.map((l) => '<details class="acc" id="' + l.id + '"><summary>' + esc(l.name) + '</summary><div class="body" data-cl-wrap>' + clHead(l.name) + checklistHtml(l.items, l.id) + '</div></details>').join('') + '</div></section>';

    html += '<section class="block alt" id="workflow"><div class="wrap"><div class="section-head"><span class="eyebrow">03</span><h2>' + esc(g.workflow.title) + '</h2><p class="muted">' + esc(g.workflow.intro) + '</p></div><ol class="steps">' +
      g.workflow.steps.map((s) => '<li><b>' + esc(s.who) + '</b><br>' + esc(s.what) + ' ' + clauseChips(s.c) + '</li>').join('') + '</ol></div></section>';

    html += '<section class="block" id="contract"><div class="wrap"><div class="section-head"><span class="eyebrow">04</span><h2>' + esc(g.contract.title) + '</h2><p class="muted">' + esc(g.contract.intro) + '</p></div>' +
      g.contract.points.map((p) => '<div class="rule"><div class="top">' + basisBadge(p.b) + clauseChips(p.c) + '</div><p>' + esc(p.t) + '</p></div>').join('') + '</div></section>';
    $('#app').innerHTML = html;
    wireChecklists($('#app'));
    $('#copyq').addEventListener('click', () => {
      const text = g.intake.title + '\n\n' + g.intake.groups.map((gr) => gr.name.toUpperCase() + '\n' + gr.questions.map((q, i) => (i + 1) + '. ' + q.q).join('\n')).join('\n\n');
      const done = () => { $('#copied').textContent = 'Copied.'; };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => { $('#copied').textContent = 'Copy failed. Select the text manually.'; });
      else $('#copied').textContent = 'Clipboard not available in this browser.';
    });
    openHashDetails();
  }

  function renderDepartments(d) {
    const deps = d.departments.departments;
    let html = pageHead('By department', 'What changes in <em class="accent">your</em> work',
      'Per team: what to start, what to stop, and your fix-now list.', null, 'am');
    html += '<section class="block"><div class="wrap"><div class="toc">' + deps.map((x) => '<a class="chip" href="#' + x.id + '">' + esc(x.name) + '</a>').join('') + '</div>' +
      deps.map((x) => {
        const n = d.actions.actions.filter((a) => a.depts.includes(x.id)).length;
        const li = (i) => '<li><span>' + esc(i.t) + '</span><span>' + clauseChips(i.c) + ' ' + basisBadge(i.b) + '</span></li>';
        return '<section class="theme" id="' + x.id + '"><div class="dept-head"><h2 class="with-ico">' + tile(x.id) + esc(x.name) + '</h2><a class="btn btn-primary btn-sm" href="' + BASE + 'fix-now.html?dept=' + x.id + '">Your fix-now list (' + n + ')</a></div>' +
          '<p class="intro">' + esc(x.summary) + '</p><div class="cols"><div class="pb allowed"><h3>Start doing</h3><ul style="padding:0;list-style:none">' + x.start.map(li).join('') + '</ul></div>' +
          '<div class="pb notallowed"><h3>Stop doing</h3><ul style="padding:0;list-style:none">' + x.stop.map(li).join('') + '</ul></div></div>' +
          '<div class="pb-nav" style="margin-top:14px">' + x.channels.map((c) => '<a class="chip" href="' + BASE + 'channels/' + c + '.html">Playbook: ' + esc(chName(c)) + '</a>').join('') + '<a class="chip" href="' + BASE + 'going-forward.html#qa">QA checklists</a></div></section>';
      }).join('') + '</div></section>';
    $('#app').innerHTML = html;
  }

  function renderGrey(d) {
    const items = d.grey.items;
    let html = pageHead('Grey areas and open questions', 'Where the document is <em class="accent">unclear</em> or silent',
      'What the document says, what it leaves open, and our cautious working view.', null, 'grey');
    html += '<section class="block"><div class="wrap"><div class="callout"><p><b>These are open questions.</b> The NMC document does not settle them, and the working views are ours.</p></div>' +
      '<div style="margin:20px 0;display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))"><div><label class="f" for="q">Search</label><input type="search" id="q" placeholder="Search open questions…"></div>' +
      '<div><label class="f" for="fc">Channel</label><select id="fc"><option value="">All channels</option>' + META.channels.map((c) => '<option value="' + c.id + '">' + esc(c.name) + '</option>').join('') + '</select></div></div>' +
      '<p class="count" id="count" aria-live="polite"></p><div id="list"></div></div></section>';
    $('#app').innerHTML = html;
    const draw = () => {
      const q = norm($('#q').value).split(/\s+/).filter(Boolean), fc = $('#fc').value;
      const f = items.filter((g) => (!fc || g.affects.includes(fc) || g.affects.includes('all')) && q.every((w) => norm([g.id, g.title, g.says, g.unclear, g.workingView].join(' ')).includes(w)));
      $('#list').innerHTML = f.length ? f.map((g) =>
        '<details class="acc" id="' + g.id + '"><summary><span><span class="muted" style="font-size:.8rem">' + g.id + '</span> &nbsp;' + esc(g.title) + '</span></summary><div class="body">' +
        '<dl><dt class="muted" style="font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;font-weight:700">What the document says</dt><dd style="margin:2px 0 12px"><span class="badge b-doc">Document says</span> ' + clauseChips(g.clauses) + bl(g.says) + '</dd>' +
        '<dt class="muted" style="font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;font-weight:700">What is unclear or missing</dt><dd style="margin:2px 0 12px">' + bl(g.unclear) + '</dd>' +
        '<dt class="muted" style="font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;font-weight:700">Our working view</dt><dd style="margin:2px 0 12px"><span class="badge b-interp">Our interpretation</span>' + bl(g.workingView) + '</dd>' +
        '<dt class="muted" style="font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;font-weight:700">Affects</dt><dd style="margin:2px 0 0">' + esc(g.affects.map(chName).join(', ')) + ' · Teams: ' + esc(g.depts.map(deptName).join(', ')) + '</dd></dl></div></details>').join('') : '<div class="noresult">No open questions match.</div>';
      $('#count').textContent = 'Showing ' + f.length + ' of ' + items.length + ' open questions';
      openHashDetails();
    };
    $('#q').addEventListener('input', draw); $('#fc').addEventListener('change', draw);
    draw();
  }

  function renderReference(d) {
    const usage = buildUsage(d);
    const gl = d.glossary.glossary, faq = d.glossary.faq;
    let html = pageHead('Reference', 'Glossary, FAQ and <em class="accent">clause index</em>',
      'Terms, common questions, and every clause mapped to where we use it.', null, 'reference');
    html += '<section class="block"><div class="wrap"><div class="toc"><a class="chip" href="#glossary">Glossary</a><a class="chip" href="#faq">FAQ</a><a class="chip" href="#clauses">Clause index</a></div>' +
      '<div class="section-head" id="glossary"><span class="eyebrow">A–Z</span><h2>Glossary</h2></div><div class="gl">' +
      gl.slice().sort((a, b) => a.term.localeCompare(b.term)).map((g) => '<div><span class="term">' + esc(g.term) + '</span><span>' + esc(g.def) + (g.c ? ' ' + clauseChips(g.c) : '') + '</span></div>').join('') + '</div></div></section>';
    html += '<section class="block alt" id="faq"><div class="wrap"><div class="section-head"><span class="eyebrow">Common questions</span><h2>FAQ</h2></div>' +
      faq.map((f, i) => '<details class="acc" id="faq-' + i + '"><summary>' + esc(f.q) + '</summary><div class="body">' + bl(f.a) + clauseChips(f.c) + '</div></details>').join('') + '</div></section>';
    const unused = CLAUSES.filter((c) => !(usage[c.id] || []).length).length;
    html += '<section class="block" id="clauses"><div class="wrap"><div class="section-head"><span class="eyebrow">Clause index</span><h2>Every clause, and where we use it</h2><p class="muted">' + CLAUSES.length + ' clauses from ' + esc(META.source.ref) + '. “Used on” links are generated automatically from the data files.' + (unused ? ' ' + unused + ' clause(s) are not used on any page yet.' : '') + '</p></div>' +
      '<div style="margin-bottom:14px"><label class="f" for="q">Search clauses</label><input type="search" id="q" placeholder="Search by clause, topic or words…"></div>' +
      '<p class="count" id="count" aria-live="polite"></p><div class="tablewrap"><table class="idx"><thead><tr><th>Clause</th><th>Topic</th><th>What it says (paraphrase)</th><th>Used on</th></tr></thead><tbody id="tb"></tbody></table></div></div></section>';
    $('#app').innerHTML = html;
    const draw = () => {
      const q = norm($('#q').value).split(/\s+/).filter(Boolean);
      const f = CLAUSES.filter((c) => q.every((w) => norm([c.label, c.id, c.title, c.summary].join(' ')).includes(w)));
      $('#tb').innerHTML = f.map((c) => {
        const u = usage[c.id] || [];
        return '<tr id="' + slug(c.id) + '"><td><b>' + esc(c.label) + '</b></td><td>' + esc(c.title) + '</td><td>' + bl(c.summary) + '</td><td class="used">' +
          (u.length ? u.map((x) => '<a href="' + x.href + '">' + esc(x.label) + '</a>').join('') : '<span class="none">Not used yet</span>') + '</td></tr>';
      }).join('');
      $('#count').textContent = 'Showing ' + f.length + ' of ' + CLAUSES.length + ' clauses';
      highlightHash();
    };
    $('#q').addEventListener('input', draw);
    draw();
    openHashDetails();
  }

  /* ---------- hash handling ---------- */
  function openHashDetails() {
    const h = location.hash.slice(1);
    if (!h) return;
    const el = document.getElementById(h);
    if (el && el.tagName === 'DETAILS') { el.open = true; el.scrollIntoView(); }
    else if (el) el.scrollIntoView();
  }
  function highlightHash() {
    const h = location.hash.slice(1);
    const el = h && document.getElementById(h);
    if (el && el.tagName === 'TR') { el.style.background = 'var(--brand-accent-soft)'; el.scrollIntoView({ block: 'center' }); }
  }

  /* ---------- boot ---------- */
  async function boot() {
    const app = $('#app');
    app.innerHTML = '<div class="wrap loading">Loading…</div>';
    try {
      const [meta, clauses, rules, actions, playbooks, departments, grey, going, glossary] = await Promise.all(
        ['meta', 'clauses', 'rules', 'actions', 'playbooks', 'departments', 'grey-areas', 'going-forward', 'glossary'].map(getJSON));
      META = meta; CLAUSES = clauses.clauses; CLAUSE_MAP = {};
      CLAUSES.forEach((c) => { CLAUSE_MAP[c.id] = c; });
      const d = { rules, actions, playbooks, departments, grey, going, glossary };
      renderShell();
      document.title = (document.title || META.siteTitle) + ' · ' + META.siteTitle;
      if (PAGE === 'home') app.innerHTML = renderHome(d);
      else if (PAGE === 'guidelines') renderGuidelines(d);
      else if (PAGE === 'fixnow') renderFixNow(d);
      else if (PAGE === 'channels') renderChannelsHub(d);
      else if (PAGE === 'channel') renderChannel(d);
      else if (PAGE === 'going') renderGoing(d);
      else if (PAGE === 'departments') renderDepartments(d);
      else if (PAGE === 'grey') renderGrey(d);
      else if (PAGE === 'reference') renderReference(d);
      if (PAGE !== 'going' && PAGE !== 'grey' && PAGE !== 'reference' && PAGE !== 'fixnow') {
        const h = location.hash.slice(1);
        if (h) { const el = document.getElementById(h); if (el) el.scrollIntoView(); }
      }
    } catch (err) {
      app.innerHTML = '<div class="wrap err"><p><b>The guide could not load its data.</b></p><p>' + esc(err.message) + '</p><p>If you opened this file directly from your computer, serve the folder with a local web server instead (see README), because browsers block data files on file:// pages.</p></div>';
    }
  }
  boot();
})();

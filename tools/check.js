#!/usr/bin/env node
/* Content checker. Run from the nmc-guide folder:  node tools/check.js
   Fails (exit 1) if any rule, action, playbook item, etc. has no valid clause reference,
   if a data file has an unknown channel/department/action type, if a clause is never used,
   or if an internal link or file reference is broken. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = (f) => JSON.parse(fs.readFileSync(path.join(root, 'data', f + '.json'), 'utf8'));

const meta = read('meta');
const clauses = read('clauses').clauses;
const rules = read('rules');
const actions = read('actions').actions;
const playbooks = read('playbooks').playbooks;
const departments = read('departments').departments;
const grey = read('grey-areas').items;
const going = read('going-forward');
const glossary = read('glossary');

const errors = [];
const err = (m) => errors.push(m);
const clauseIds = new Set(clauses.map((c) => c.id));
const channelIds = new Set(meta.channels.map((c) => c.id).concat(['all']));
const deptIds = new Set(meta.departments.map((d) => d.id));
const typeIds = new Set(meta.actionTypes.map((t) => t.id));
const used = new Set();
const seenIds = new Set();

const needClauses = (where, ids, required = true) => {
  if (required && (!ids || !ids.length)) err(where + ': no clause reference');
  (ids || []).forEach((id) => { if (!clauseIds.has(id)) err(where + ': unknown clause "' + id + '"'); else used.add(id); });
};
const uniq = (id, where) => { if (seenIds.has(id)) err(where + ': duplicate id ' + id); seenIds.add(id); };

clauses.forEach((c) => { uniq('clause:' + c.id, 'clauses'); if (!c.label || !c.title || !c.summary) err('clause ' + c.id + ': missing label/title/summary'); });

const themeIds = new Set(rules.themes.map((t) => t.id));
rules.rules.forEach((r) => {
  uniq(r.id, 'rules');
  needClauses('rule ' + r.id, r.clauses);
  if (!themeIds.has(r.theme)) err('rule ' + r.id + ': unknown theme ' + r.theme);
  if (!r.says) err('rule ' + r.id + ': missing "says"');
  r.channels.forEach((c) => { if (!channelIds.has(c)) err('rule ' + r.id + ': unknown channel ' + c); });
});

actions.forEach((a) => {
  uniq(a.id, 'actions');
  needClauses('action ' + a.id, a.clauses);
  if (!typeIds.has(a.type)) err('action ' + a.id + ': unknown type ' + a.type);
  if (!['doc', 'interp'].includes(a.basis)) err('action ' + a.id + ': basis must be doc or interp');
  a.channels.forEach((c) => { if (!channelIds.has(c)) err('action ' + a.id + ': unknown channel ' + c); });
  a.depts.forEach((d) => { if (!deptIds.has(d)) err('action ' + a.id + ': unknown dept ' + d); });
  ['check', 'wrong', 'how'].forEach((k) => { if (!a[k]) err('action ' + a.id + ': missing ' + k); });
  if ('urgency' in a) err('action ' + a.id + ': urgency field is not used');
});

playbooks.forEach((p) => {
  if (!channelIds.has(p.channel)) err('playbook ' + p.id + ': unknown channel');
  if (!fs.existsSync(path.join(root, 'channels', p.id + '.html'))) err('playbook ' + p.id + ': missing channels/' + p.id + '.html');
  ['allowed', 'notAllowed', 'disclosure', 'grey'].forEach((k) => (p[k] || []).forEach((i, n) => {
    needClauses('playbook ' + p.id + '.' + k + '[' + n + ']', i.c);
    if (!['doc', 'interp'].includes(i.b)) err('playbook ' + p.id + '.' + k + '[' + n + ']: basis must be doc or interp');
  }));
  if (p.examples.length < 3 || p.examples.length > 5) err('playbook ' + p.id + ': needs 3 to 5 examples, has ' + p.examples.length);
  p.examples.forEach((e, n) => needClauses('playbook ' + p.id + '.examples[' + n + ']', e.c));
});
meta.channels.forEach((c) => { if (!playbooks.find((p) => p.id === c.id)) err('channel ' + c.id + ': no playbook'); });

departments.forEach((d) => {
  if (!deptIds.has(d.id)) err('department ' + d.id + ': not in meta.departments');
  ['start', 'stop'].forEach((k) => d[k].forEach((i, n) => needClauses('dept ' + d.id + '.' + k + '[' + n + ']', i.c)));
});
meta.departments.forEach((d) => { if (!departments.find((x) => x.id === d.id)) err('meta department ' + d.id + ': no view'); });

grey.forEach((g) => { uniq(g.id, 'grey'); needClauses('grey ' + g.id, g.clauses); });
going.intake.groups.forEach((g) => g.questions.forEach((q, n) => needClauses('intake ' + g.name + '[' + n + ']', q.c)));
going.qa.lists.forEach((l) => l.items.forEach((i) => { uniq(i.id, 'qa'); needClauses('qa ' + i.id, i.c); }));
going.workflow.steps.forEach((s) => needClauses('workflow step ' + s.n, s.c, false));
going.contract.points.forEach((p, n) => needClauses('contract[' + n + ']', p.c));
glossary.faq.forEach((f, n) => needClauses('faq[' + n + ']', f.c));
glossary.glossary.forEach((g) => needClauses('glossary ' + g.term, g.c, false));
meta.whatChanged.forEach((w, n) => needClauses('whatChanged[' + n + ']', w.c, false));
/* legal-counsel wording belongs only in the page footnote (meta.footnote) */
(function lint(o, path) {
  if (typeof o === 'string') { if (/counsel|legal advice|legal review/i.test(o) && path !== 'meta.footnote') err('legal wording outside the footnote: ' + path + ' -> ' + o.slice(0, 70)); }
  else if (Array.isArray(o)) o.forEach((v, i) => lint(v, path + '[' + i + ']'));
  else if (o && typeof o === 'object') Object.keys(o).forEach((k) => { if (!k.startsWith('_')) lint(o[k], path + (path ? '.' : '') + k); });
})({ meta, rules, actions, playbooks, departments, grey, going, glossary }, '');
meta.doDont.do.concat(meta.doDont.dont).forEach((t) => { if (!/§/.test(t)) err('doDont item has no § reference: ' + t); });

clauses.forEach((c) => { if (!used.has(c.id)) err('clause ' + c.id + ' (' + c.label + ') is not used anywhere'); });

/* internal links and files in HTML + JS */
const htmlFiles = [];
(function walk(d) { fs.readdirSync(d).forEach((f) => { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) { if (!['node_modules', '.git'].includes(f)) walk(p); } else if (f.endsWith('.html')) htmlFiles.push(p); }); })(root);
htmlFiles.forEach((f) => {
  const src = fs.readFileSync(f, 'utf8');
  const re = /(?:href|src)="([^"#?]+)(?:[#?][^"]*)?"/g; let m;
  while ((m = re.exec(src))) {
    const u = m[1];
    if (/^(https?:|mailto:|data:)/.test(u)) continue;
    if (!fs.existsSync(path.join(path.dirname(f), u))) err(path.relative(root, f) + ': broken reference ' + u);
  }
});
if (!fs.existsSync(path.join(root, meta.source.file))) err('source PDF missing: ' + meta.source.file);
NAV_TARGETS = ['guidelines.html', 'fix-now.html', 'channels/index.html', 'going-forward.html', 'departments.html', 'grey-areas.html', 'reference.html', 'index.html'];
NAV_TARGETS.forEach((t) => { if (!fs.existsSync(path.join(root, t))) err('nav target missing: ' + t); });

const n = {
  clauses: clauses.length, rules: rules.rules.length, actions: actions.length, playbooks: playbooks.length,
  examples: playbooks.reduce((s, p) => s + p.examples.length, 0), grey: grey.length
};
console.log('Checked:', JSON.stringify(n));
if (errors.length) { console.error('\n' + errors.length + ' problem(s):\n - ' + errors.join('\n - ')); process.exit(1); }
console.log('OK: every item has a valid clause reference, all clauses are used, all links resolve.');

# NMC Advertising Compliance Guide (internal)

A static website (plain HTML, CSS and vanilla JavaScript, no build step) that explains the NMC notice
**No. R-13014/01/2024-Ethics, dated 06/10/2026** to every Digilantern team: what it says, what to fix now,
how we work with new clients, and Do/Don't rules per channel.

> Internal working guide. Not legal advice. Have legal counsel review it before relying on it.
> Anything labelled **Our interpretation** is not stated in the NMC document.

## Preview locally

Browsers block `fetch()` of local JSON when a page is opened with `file://`, so serve the folder:

```bash
cd nmc-guide
python3 -m http.server 8000      # or: npx serve .
# open http://localhost:8000
```

## Folder structure

```
nmc-guide/
├─ index.html  guidelines.html  fix-now.html  going-forward.html
├─ departments.html  grey-areas.html  reference.html
├─ channels/            index.html + one page per channel (website.html, google-ads.html, ...)
├─ data/                ALL CONTENT LIVES HERE (JSON)
│   ├─ meta.json        version, last-updated date, footnote, channels, departments, action types, home page text
│   ├─ clauses.json     every clause of the NMC notice (the source of truth for clause references)
│   ├─ rules.json       plain-language rules by theme (Guidelines page)
│   ├─ actions.json     Fix-now register rows
│   ├─ playbooks.json   channel playbooks (allowed / not allowed / disclosure / grey / examples)
│   ├─ departments.json team views
│   ├─ going-forward.json  intake questionnaire, QA checklists, workflow, contract points
│   ├─ grey-areas.json  open questions
│   └─ glossary.json    glossary + FAQ
├─ assets/css/brand.css  colours and fonts (CSS variables)
├─ assets/css/style.css  layout and components
├─ assets/js/app.js      renders every page from the JSON
├─ assets/img/logo.svg   placeholder logo
├─ source/               the original NMC PDF
└─ tools/                check.js (content checker), check-contrast.py (WCAG AA)
```

## Editing content

All text is in `data/*.json`. You never need to touch the HTML, CSS or JS to change content.

- **Version and date:** edit `version`, `lastUpdated`, `lastUpdatedLabel` in `data/meta.json`. They appear on every page footer.
- **Footnote:** edit `footnote` in `data/meta.json` (shown at the bottom of every page, marked with `*`).
- **Add a Fix-now row:** copy an object in `data/actions.json`. Fields: `id` (unique), `check`, `channels[]`,
  `wrong`, `type` (`remove|stop|rewrite|disclose|verify`), `how`, `depts[]`, `clauses[]`, `basis`
  (`doc` = the NMC document states the rule; `interp` = our interpretation), optional `keep` note.
- **Add a rule:** `data/rules.json` → `rules[]`. `says` is what the document states. Put anything of ours in `interp`.
- **Cite clauses by ID**, e.g. `"8.1(ix)"`, `"3.2-E5"` (Explanation V to §3.2), `"8.1(ix)-P"` (proviso).
  IDs must exist in `data/clauses.json`. Never invent a clause; if the document is silent, add an entry to `grey-areas.json`.
- **Add a channel:** add it to `channels[]` in `meta.json`, add a playbook in `playbooks.json`, and copy
  `channels/website.html` to `channels/<id>.html` changing `data-channel="<id>"`.
- **Add a department:** add it to `departments[]` in `meta.json` and to `departments.json`.
- The **clause index** ("Used on" links) is generated automatically from the data files.
- When NMC issues clarifications (§12), update `clauses.json` first, then the rules and actions that depend on them, then bump the version.

### Check your edits

```bash
node tools/check.js            # every rule/action/playbook item has a valid clause; all clauses used; links resolve
python3 tools/check-contrast.py   # WCAG AA contrast for the colours in brand.css
```

## Branding

`assets/css/brand.css` holds all colours and fonts as CSS variables.

The palette was **sampled from a screenshot of digilantern.com**: ink `#151346`, purple `#5404B9`, magenta `#F1005F`,
orange `#FF7B00`, and the aqua-to-pink hero gradient. The Elementor global styles could not be fetched when this was built,
so please confirm the exact values in the site's CSS and update `brand.css` if they differ. The heading font is Source Serif 4
(a close stand-in for the site's serif) and the body font is Inter; swap them in `brand.css` and the Google Fonts `<link>` in each HTML file.

`assets/img/logo.png` is a **1x crop from the same screenshot**, so it is low resolution. Replace it with the real logo file
from digilantern.com (keep the name, or change the path in `renderShell` in `assets/js/app.js`). After any colour change run
`python3 tools/check-contrast.py`.

## Checklists

Checklist ticks are stored in the browser's `localStorage` under keys starting `nmcguide:v1:`. They are per browser and not shared.

## Deploy to GitHub Pages

1. Create a repository and push the contents of `nmc-guide/` to the repository root (or keep it in a subfolder and use that path).
2. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, choose `main` and `/ (root)`, then Save.
3. The site is live at `https://<user>.github.io/<repo>/`. All links are relative, so it also works under a sub-path.
4. Pages use `noindex`. If the repository is public, anyone with the link can read the guide. Use a private repository (GitHub Pages access control on paid plans) or another internal host if it should stay internal.

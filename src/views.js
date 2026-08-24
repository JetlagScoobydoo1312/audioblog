// HTML-rendering. Alt server-renderes, så links kan deles og RSS er ægte.
//
// Designet: en bevidst almindelig hvid side — Times, blå understregede links,
// ingen kort, ingen skygger, ingen runde hjørner. Al energien ligger i
// typografien og i at noter og billeder kan bryde ud af spalten.

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export function prose(text) {
  const blocks = String(text ?? '').trim().split(/\n{2,}/)
  return blocks.filter(Boolean).map(b => {
    const withBreaks = esc(b).replace(/\n/g, '<br>')
    const linked = withBreaks.replace(
      /(https?:\/\/[^\s<]+)/g,
      '<a href="$1" rel="noopener noreferrer" target="_blank">$1</a>'
    )
    return `<p>${linked}</p>`
  }).join('')
}

export function fmtDuration(sec) {
  if (!sec && sec !== 0) return ''
  const s = Math.round(sec)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

const MONTHS = ['januar', 'februar', 'marts', 'april', 'maj', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'december']

function parts(iso) {
  const d = new Date(iso)
  return isNaN(d) ? null : { d: d.getUTCDate(), m: d.getUTCMonth(), y: d.getUTCFullYear() }
}

/** "30. august" — eller "30.–31. august" / "30. august – 2. september" */
export function fmtDateRange(startIso, endIso) {
  const a = parts(startIso)
  if (!a) return ''
  const b = endIso ? parts(endIso) : null
  if (!b || (a.d === b.d && a.m === b.m)) return `${a.d}. ${MONTHS[a.m]}`
  if (a.m === b.m) return `${a.d}.–${b.d}. ${MONTHS[a.m]}`
  return `${a.d}. ${MONTHS[a.m]} – ${b.d}. ${MONTHS[b.m]}`
}

export function fmtDate(iso) {
  const a = parts(iso)
  return a ? `${a.d}. ${MONTHS[a.m]}` : ''
}

const SQUIGGLE = `<svg class="squiggle" viewBox="0 0 600 12" preserveAspectRatio="none" aria-hidden="true"><path d="M0 7 C 22 1, 44 11, 66 6 S 110 1, 132 7 S 176 12, 198 5 S 242 2, 264 8 S 308 11, 330 5 S 374 1, 396 7 S 440 12, 462 6 S 506 2, 528 8 S 572 10, 600 5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`

const STYLES = `
:root {
  --paper: #FFFFFF;
  --ink: #000000;
  --link: #0000EE;
  --visited: #551A8B;
  --faint: #6B6B6B;
  --hot: #E8340C;
  --rule: #000000;
  --display: "Bricolage Grotesque", "Arial Black", sans-serif;
  --body: "Times New Roman", Times, serif;
  --type: "Courier Prime", "Courier New", monospace;
}
* { box-sizing: border-box; }
html { background: var(--paper); }
body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--body);
  font-size: 19px;
  line-height: 1.5;
}
.wrap { max-width: 40rem; margin: 0 auto; padding: 2rem 1.25rem 7rem; position: relative; }

/* ---------- stående elementer i marginen ---------- */
.standing { display: flex; flex-direction: column; gap: 1rem; margin: 0 0 2.5rem; }
/* Kortene skal se tegnet ud, ikke sat. Uens hjørneradier giver en
   tuschstreg-agtig kant, og ::after lægger en streg mere lidt ved siden af,
   som om nogen har tegnet kassen to gange. */
.card {
  position: relative;
  padding: 1rem .9rem .85rem;
  font-family: var(--type); font-size: .78rem; line-height: 1.5;
  background: var(--paper);
  border: 2px solid var(--ink);
  border-radius: 255px 14px 225px 15px / 15px 225px 15px 255px;
}
.card::after {
  content: ""; position: absolute; inset: -5px -4px -3px -5px;
  border: 1.5px solid var(--ink); opacity: .4; pointer-events: none;
  border-radius: 14px 225px 15px 255px / 225px 15px 255px 15px;
}
/* tapestrimmel */
.card::before {
  content: ""; position: absolute; top: -.65rem; left: 1.4rem;
  width: 3.2rem; height: 1.15rem;
  background: rgba(0,0,0,.055);
  border-left: 1px dashed rgba(0,0,0,.28);
  border-right: 1px dashed rgba(0,0,0,.28);
  transform: rotate(-3.5deg);
}
.card h4 {
  font-family: var(--type); font-size: .64rem; letter-spacing: .16em;
  text-transform: uppercase; color: var(--ink); margin: 0 0 .5rem; font-weight: 700;
}
.card h4 svg { display: block; width: 100%; height: 6px; margin-top: .15rem; opacity: .55; }
.card p { margin: 0 0 .55rem; }
.card p:last-child { margin: 0; }
.card.notepad { background: #FFFCE0; }
.card.notepad::before { left: auto; right: 1.2rem; transform: rotate(4deg); }
.card.portrait img {
  width: 100%; height: auto; display: block;
  border: 2px solid var(--ink); margin: 0 0 .55rem;
  filter: grayscale(1) contrast(1.1);
  transform: rotate(-1.4deg);
  border-radius: 12px 3px 10px 4px / 4px 10px 3px 12px;
}
.card.portrait b { font-size: .88rem; }
.card .ny {
  display: inline-block; background: var(--hot); color: var(--paper);
  font-size: .58rem; letter-spacing: .14em; padding: 0 .3rem; margin-left: .35rem;
  animation: blink 1.1s step-end infinite; vertical-align: .12em;
}
@keyframes blink { 0%, 60% { opacity: 1 } 61%, 100% { opacity: 0 } }
@media (prefers-reduced-motion: reduce) { .card .ny { animation: none } }
@media (min-width: 74rem) {
  .standing { position: absolute; top: 12rem; width: 14.5rem; margin: 0; }
  .standing.left  { left: -17rem; }
  .standing.right { right: -17rem; }
  .card.notepad  { transform: rotate(-1.6deg); }
  .card.portrait { transform: rotate(1.1deg); }
}

/* nuværende lokation i hovedet */
.here { font-family: var(--type); font-size: .78rem; margin: .35rem 0 0; }
.here .dot {
  display: inline-block; width: .5rem; height: .5rem; background: var(--hot);
  border-radius: 50%; margin-right: .35rem; vertical-align: .02em;
  animation: pulse 2.4s ease-in-out infinite; cursor: pointer;
}
@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: .25 } }
@media (prefers-reduced-motion: reduce) { .here .dot { animation: none } }
.here .days { color: var(--faint); }

/* påskeæg: typografisk kaos */
@keyframes wobble {
  0%,100% { font-variation-settings: "wdth" 100, "opsz" 96 }
  25%     { font-variation-settings: "wdth" 75,  "opsz" 12 }
  50%     { font-variation-settings: "wdth" 100, "opsz" 40 }
  75%     { font-variation-settings: "wdth" 80,  "opsz" 96 }
}
body.chaos .masthead h1, body.chaos article h2, body.chaos .blk-heading {
  animation: wobble 1.1s ease-in-out 4;
}
@media (prefers-reduced-motion: reduce) { body.chaos .masthead h1 { animation: none } }
.squiggle { cursor: crosshair; }

a { color: var(--link); }
a:visited { color: var(--visited); }
a:hover { background: #FFF6A8; }

.squiggle { display: block; width: 100%; height: 12px; color: var(--ink); }
.sep { margin: 3.2rem 0; }

/* ---------- hoved ---------- */
.masthead { margin-bottom: 2.5rem; }
.masthead h1 {
  font-family: var(--display);
  font-variation-settings: "wdth" 100, "opsz" 96;
  font-weight: 800;
  font-size: clamp(2.3rem, 9vw, 4rem);
  line-height: .92;
  letter-spacing: -.03em;
  margin: 0;
  text-transform: uppercase;
}
.masthead h1 a { color: var(--ink); text-decoration: none; }
.masthead h1 a:hover { background: var(--hot); color: var(--paper); }
.masthead .tagline {
  font-family: var(--type);
  font-size: .78rem;
  margin: .7rem 0 0;
  letter-spacing: .02em;
}
.masthead .subscribe { font-family: var(--type); font-size: .78rem; margin: .35rem 0 0; }

/* ---------- indslag ---------- */
article { position: relative; }
.stamp {
  font-family: var(--type);
  font-size: .74rem;
  text-transform: uppercase;
  letter-spacing: .1em;
  color: var(--faint);
  margin-bottom: .5rem;
}
.stamp b { color: var(--ink); font-weight: 400; }
.stamp .num {
  display: inline-block;
  background: var(--ink);
  color: var(--paper);
  padding: 0 .35rem;
  margin-right: .4rem;
}
article h2 {
  font-family: var(--display);
  font-variation-settings: "wdth" 92, "opsz" 40;
  font-weight: 700;
  font-size: clamp(1.7rem, 5.5vw, 2.5rem);
  line-height: 1.02;
  letter-spacing: -.02em;
  margin: 0 0 1rem;
  text-wrap: balance;
}
article h2 a { color: var(--ink); text-decoration: none; }
article h2 a:hover { background: #FFF6A8; }
article.note-post h2 {
  font-variation-settings: "wdth" 75, "opsz" 14;
  font-size: 1.35rem;
  font-weight: 600;
}
p { margin: 0 0 1rem; }

/* ---------- afspiller: firkantet, uden pynt ---------- */
.player {
  border: 1.5px solid var(--ink);
  display: flex;
  align-items: stretch;
  margin: 0 0 1.5rem;
  background: var(--paper);
}
.pbtn {
  border: 0; border-right: 1.5px solid var(--ink);
  background: var(--hot); color: var(--paper);
  width: 3.2rem; cursor: pointer; padding: 0;
  display: grid; place-items: center; flex: 0 0 auto;
}
.pbtn:hover { background: var(--ink); }
.pbtn svg { width: 1rem; height: 1rem; fill: currentColor; }
.pbtn .ico-pause { display: none; }
.player.playing .ico-play { display: none; }
.player.playing .ico-pause { display: block; }
.ptrack { flex: 1 1 auto; display: flex; flex-direction: column; justify-content: center; gap: .3rem; padding: .55rem .7rem; min-width: 0; }
.scrub {
  -webkit-appearance: none; appearance: none; width: 100%; height: 6px;
  background: repeating-linear-gradient(90deg, var(--ink) 0 1px, transparent 1px 5px);
  cursor: pointer; margin: 0;
}
.scrub::-webkit-slider-thumb {
  -webkit-appearance: none; width: 10px; height: 16px; background: var(--ink); cursor: pointer; border: 0;
}
.scrub::-moz-range-thumb { width: 10px; height: 16px; background: var(--ink); cursor: pointer; border: 0; border-radius: 0; }
.ptimes {
  font-family: var(--type); font-size: .7rem; color: var(--faint);
  display: flex; justify-content: space-between; font-variant-numeric: tabular-nums;
}
.pskip {
  border: 0; border-left: 1.5px solid var(--ink); background: var(--paper);
  font-family: var(--type); font-size: .68rem; cursor: pointer;
  padding: 0 .55rem; color: var(--ink); flex: 0 0 auto;
}
.pskip:hover { background: #FFF6A8; }

/* ---------- blokke ---------- */
.blk { margin: 0 0 1.2rem; }
.blk-heading {
  font-family: var(--display);
  font-variation-settings: "wdth" 80, "opsz" 20;
  font-weight: 700; font-size: 1.25rem; line-height: 1.15;
  margin: 2rem 0 .7rem; text-transform: uppercase; letter-spacing: -.01em;
}
.blk-quote {
  font-family: var(--display);
  font-variation-settings: "wdth" 100, "opsz" 32;
  font-weight: 500; font-size: 1.5rem; line-height: 1.15;
  margin: 1.8rem 0; padding-left: 1rem; border-left: 4px solid var(--ink);
  text-wrap: balance;
  /* Egen blokkontekst, så stregen følger teksten når en note flyder ved siden af */
  display: flow-root;
}
.blk-heading { display: flow-root; }
.blk-image img { display: block; width: 100%; height: auto; border: 1.5px solid var(--ink); }
.blk-image figcaption, .cap {
  font-family: var(--type); font-size: .72rem; color: var(--faint); margin-top: .3rem;
}
.blk-image figure { margin: 0; }

/* Noter bryder ud i marginen — det er dem, der spreder tingene på siden */
.blk-note {
  font-family: var(--type);
  font-size: .8rem;
  line-height: 1.45;
  border: 1.5px solid var(--ink);
  background: #FFFDEB;
  padding: .7rem .8rem;
  margin: 1.4rem 0;
}
.blk-note p { margin: 0 0 .5rem; }
.blk-note p:last-child { margin: 0; }
@media (min-width: 60rem) {
  .blk-note { width: 15rem; }
  .blk-note.left  { float: left;  margin: .3rem 1.4rem .9rem -8rem; transform: rotate(-1.1deg); }
  .blk-note.right { float: right; margin: .3rem -8rem .9rem 1.4rem; transform: rotate(.9deg); }
  .blk-image.wide img { width: calc(100% + 6rem); max-width: none; margin-left: -3rem; }
}
article::after { content: ""; display: block; clear: both; }

/* ---------- kommentarer ---------- */
.comments { margin-top: 2.5rem; }
.comments h3 {
  font-family: var(--type); font-size: .74rem; text-transform: uppercase;
  letter-spacing: .1em; font-weight: 400; margin: 0 0 .8rem; color: var(--faint);
}
.cmt { border-top: 1px solid var(--ink); padding: .7rem 0; }
.cmt-head { font-family: var(--type); font-size: .74rem; }
.cmt-head b { font-weight: 700; }
.cmt-head time { color: var(--faint); margin-left: .5rem; }
.cmt p { margin: .3rem 0 0; font-size: .95rem; }
.cmt audio { width: 100%; margin-top: .4rem; }

form.cform { margin-top: 1.2rem; display: flex; flex-direction: column; gap: .5rem; max-width: 26rem; }
form.cform input, form.cform textarea {
  font-family: var(--type); font-size: .85rem; padding: .5rem;
  border: 1.5px solid var(--ink); border-radius: 0; background: var(--paper); color: var(--ink); width: 100%;
}
form.cform textarea { min-height: 5rem; resize: vertical; }
form.cform button {
  font-family: var(--type); font-size: .8rem; text-transform: uppercase; letter-spacing: .08em;
  background: var(--ink); color: var(--paper); border: 0; padding: .55rem 1rem;
  cursor: pointer; align-self: flex-start;
}
form.cform button:hover { background: var(--hot); }
form.cform button:disabled { opacity: .4; cursor: default; }
.hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
.formnote { font-family: var(--type); font-size: .74rem; color: var(--faint); margin: 0; }
.formnote.err { color: var(--hot); }

:focus-visible { outline: 2px solid var(--hot); outline-offset: 2px; }
.empty { font-family: var(--type); font-size: .85rem; padding: 2rem 0; }
.applist { display: flex; flex-direction: column; gap: .5rem; margin: .8rem 0 2rem; }
.appbtn {
  display: block; border: 1.5px solid var(--ink); padding: .7rem .9rem;
  font-family: var(--type); font-size: .9rem; text-decoration: none;
  color: var(--ink); background: var(--paper);
}
.appbtn:hover { background: var(--hot); color: var(--paper); }
.appbtn::after { content: " →"; float: right; }
.copybox { display: flex; gap: 0; margin: .8rem 0 1rem; }
.copybox input {
  flex: 1 1 auto; min-width: 0; font-family: var(--type); font-size: .78rem;
  padding: .55rem .6rem; border: 1.5px solid var(--ink); border-right: 0;
  border-radius: 0; background: var(--paper); color: var(--ink);
}
.copybox button {
  flex: 0 0 auto; font-family: var(--type); font-size: .78rem; cursor: pointer;
  background: var(--ink); color: var(--paper); border: 1.5px solid var(--ink);
  padding: 0 .9rem; text-transform: uppercase; letter-spacing: .06em;
}
.copybox button:hover { background: var(--hot); border-color: var(--hot); }
.backlink { font-family: var(--type); font-size: .78rem; margin-top: 2rem; }
footer.site {
  margin-top: 4rem; padding-top: 1rem; border-top: 1.5px solid var(--ink);
  font-family: var(--type); font-size: .74rem;
  display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
}
`

const UNDERSCRIBBLE = `<svg viewBox="0 0 200 6" preserveAspectRatio="none" aria-hidden="true"><path d="M1 4 C 20 1, 38 5, 57 3 S 95 1, 114 4 S 152 5, 171 2 S 195 4, 199 3" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>`

/** Blinkende NY! hvis elementet er ændret inden for tre døgn. */
function freshBadge(iso) {
  if (!iso) return ''
  const age = Date.now() - new Date(iso).getTime()
  return (age >= 0 && age < 3 * 86400000) ? '<span class="ny">NY!</span>' : ''
}

function standingHtml(site) {
  if (!site) return { left: '', right: '' }
  const notepad = site.notepad?.value
  const pName = site.portrait_name?.value
  const pText = site.portrait_text?.value
  const pImg = site.portrait_image?.media_key

  const noteCard = notepad ? `<div class="card notepad">
    <h4>Notesblok${freshBadge(site.notepad?.updated_at)}${UNDERSCRIBBLE}</h4>${prose(notepad)}
  </div>` : ''

  const portraitCard = (pName || pText || pImg) ? `<div class="card portrait">
    <h4>Mødt undervejs${freshBadge(site.portrait_name?.updated_at)}${UNDERSCRIBBLE}</h4>
    ${pImg ? `<img src="/media/${esc(pImg)}" alt="${esc(pName || 'Portræt')}" loading="lazy">` : ''}
    ${pName ? `<p><b>${esc(pName)}</b></p>` : ''}
    ${pText ? prose(pText) : ''}
  </div>` : ''

  return {
    left: portraitCard ? `<div class="standing left">${portraitCard}</div>` : '',
    right: noteCard ? `<div class="standing right">${noteCard}</div>` : ''
  }
}

function hereHtml(site) {
  const where = site?.location?.value
  if (!where) return ''
  const start = site?.trip_start?.value
  let days = ''
  if (start) {
    const d0 = new Date(start), d1 = new Date()
    if (!isNaN(d0)) {
      const n = Math.floor((d1 - d0) / 86400000) + 1
      let label = null
      if (n >= 1 && n < 2000) label = `dag ${n} af rejsen`
      else if (n < 1 && n > -400) {
        const left = 1 - n
        label = left === 1 ? 'afrejse i morgen' : `${left} dage til afrejse`
      }
      if (label) days = `<span class="days" hidden data-days="${esc(label)}"></span>`
    }
  }
  return `<p class="here"><span class="dot" role="button" tabindex="0" aria-label="Vis hvor længe rejsen har varet"></span>Lige nu: ${esc(where)}${days}</p>`
}

export function layout(env, { title, description, body, canonical, ogImage, site }) {
  const siteName = env.SITE_TITLE || 'Audioblog'
  const full = title ? `${title} — ${siteName}` : siteName
  const standing = standingHtml(site)
  return `<!doctype html>
<!--
       .-.
      (o o)    du kigger i kildekoden. respekt.
      | O |    alt herinde er skrevet i hånden. ingen frameworks.
      '~~~'    prøv konami-koden. og klik på bølgestregen.
-->
<html lang="${esc(env.SITE_LANG || 'da')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description || env.SITE_TAGLINE || '')}">
<meta property="og:title" content="${esc(title || siteName)}">
<meta property="og:description" content="${esc(description || env.SITE_TAGLINE || '')}">
<meta property="og:type" content="website">
<meta name="color-scheme" content="light">
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ''}
${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">` : ''}
<link rel="alternate" type="application/rss+xml" title="${esc(siteName)}" href="/feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,400..800&family=Courier+Prime:wght@400;700&display=swap">
<style>${STYLES}</style>
</head>
<body>
<div class="wrap">
  <header class="masthead">
    <h1><a href="/">${esc(siteName)}</a></h1>
    <p class="tagline">${esc(env.SITE_TAGLINE || '')}</p>
    ${hereHtml(site)}
    <p class="subscribe"><a href="/abonner">→ følg med i din podcast-app</a></p>
  </header>
  ${standing.left}${standing.right}
  ${SQUIGGLE}
  ${body}
  <footer class="site">
    <span>${esc(env.SITE_AUTHOR || '')}</span>
    <span><a href="/feed.xml">rss</a></span>
  </footer>
</div>
<script>${PAGE_JS}</script>
</body>
</html>`
}

const PAGE_JS = `
/* --- påskeæg 1: fanetitlen kalder på dig, når du forlader siden --- */
(function () {
  var real = document.title;
  document.addEventListener('visibilitychange', function () {
    document.title = document.hidden ? 'kom tilbage \u2192' : real;
  });
})();

/* --- påskeæg 2: klik på bølgen, og den tegner sig selv om --- */
document.querySelectorAll('.squiggle').forEach(function (svg) {
  svg.addEventListener('click', function () {
    var path = svg.querySelector('path'), d = 'M0 7', y = 7;
    for (var x = 22; x <= 600; x += 22) {
      y = 2 + Math.random() * 8;
      d += ' S ' + (x - 11) + ' ' + (2 + Math.random() * 8) + ', ' + x + ' ' + y.toFixed(1);
    }
    path.setAttribute('d', d);
  });
});

/* --- påskeæg 3: konami-koden slipper typografien løs --- */
(function () {
  var seq = [38,38,40,40,37,39,37,39,66,65], i = 0;
  document.addEventListener('keydown', function (e) {
    i = (e.keyCode === seq[i]) ? i + 1 : 0;
    if (i === seq.length) {
      i = 0;
      document.body.classList.add('chaos');
      setTimeout(function () { document.body.classList.remove('chaos'); }, 5000);
    }
  });
})();

/* --- påskeæg 4: prikken ved lokationen fortæller hvilken dag det er --- */
document.querySelectorAll('.here .dot').forEach(function (dot) {
  var span = dot.parentNode.querySelector('.days');
  if (!span) return;
  function toggle() {
    if (span.hidden) { span.textContent = ' \u2014 ' + span.dataset.days; span.hidden = false; }
    else { span.hidden = true; }
  }
  dot.addEventListener('click', toggle);
  dot.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  });
});

document.querySelectorAll('.player').forEach(function (p) {
  var a = p.querySelector('audio'), btn = p.querySelector('.pbtn'),
      bar = p.querySelector('.scrub'), cur = p.querySelector('.t-cur'),
      tot = p.querySelector('.t-tot'), skip = p.querySelector('.pskip');
  if (!a || !btn) return;
  function fmt(s) {
    if (!isFinite(s)) return '0:00';
    s = Math.floor(s);
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }
  btn.addEventListener('click', function () {
    if (a.paused) {
      document.querySelectorAll('.player audio').forEach(function (o) { if (o !== a) o.pause(); });
      a.play();
    } else { a.pause(); }
  });
  a.addEventListener('play', function () { p.classList.add('playing'); btn.setAttribute('aria-label', 'Pause'); });
  a.addEventListener('pause', function () { p.classList.remove('playing'); btn.setAttribute('aria-label', 'Afspil'); });
  a.addEventListener('loadedmetadata', function () {
    if (isFinite(a.duration)) { bar.max = a.duration; if (tot) tot.textContent = fmt(a.duration); }
  });
  a.addEventListener('timeupdate', function () {
    if (!bar.matches(':active')) bar.value = a.currentTime;
    if (cur) cur.textContent = fmt(a.currentTime);
  });
  bar.addEventListener('input', function () { a.currentTime = Number(bar.value); });
  if (skip) skip.addEventListener('click', function () {
    a.currentTime = Math.min(a.currentTime + 15, a.duration || a.currentTime + 15);
  });
});

document.querySelectorAll('form.cform').forEach(function (f) {
  f.addEventListener('submit', async function (e) {
    e.preventDefault();
    var note = f.querySelector('.formnote'), btn = f.querySelector('button');
    btn.disabled = true; note.className = 'formnote'; note.textContent = 'sender…';
    try {
      var res = await fetch('/api/comments', { method: 'POST', body: new FormData(f) });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Noget gik galt');
      note.textContent = 'tak — din kommentar er på siden.';
      setTimeout(function () { location.reload(); }, 700);
    } catch (err) {
      note.className = 'formnote err'; note.textContent = err.message; btn.disabled = false;
    }
  });
});
`

function playerHtml(ep) {
  if (!ep.audio_key) return ''
  return `<div class="player">
  <audio preload="metadata" src="/media/${esc(ep.audio_key)}"></audio>
  <button class="pbtn" type="button" aria-label="Afspil">
    <svg class="ico-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
    <svg class="ico-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>
  </button>
  <div class="ptrack">
    <input class="scrub" type="range" min="0" max="${ep.duration || 100}" value="0" step="0.1" aria-label="Spol">
    <div class="ptimes"><span class="t-cur">0:00</span><span class="t-tot">${fmtDuration(ep.duration)}</span></div>
  </div>
  <button class="pskip" type="button" title="15 sekunder frem">+15s</button>
</div>`
}

function blockHtml(b, i) {
  switch (b.type) {
    case 'heading':
      return `<h3 class="blk blk-heading">${esc(b.content)}</h3>`
    case 'quote':
      return `<blockquote class="blk blk-quote">${esc(b.content)}</blockquote>`
    case 'note': {
      const side = b.offset_side || (i % 2 ? 'right' : 'left')
      return `<aside class="blk blk-note ${esc(side)}">${prose(b.content)}</aside>`
    }
    case 'image':
      if (!b.media_key) return ''
      return `<figure class="blk blk-image${b.offset_side === 'wide' ? ' wide' : ''}">
        <img src="/media/${esc(b.media_key)}" alt="${esc(b.caption || '')}" loading="lazy"
             ${b.width ? `width="${b.width}"` : ''} ${b.height ? `height="${b.height}"` : ''}>
        ${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ''}
      </figure>`
    default:
      return `<div class="blk blk-text">${prose(b.content)}</div>`
  }
}

function commentsHtml(ep, comments) {
  const list = comments.length
    ? comments.map(c => `<div class="cmt">
        <div class="cmt-head"><b>${esc(c.author)}</b><time datetime="${esc(c.created_at)}">${fmtDate(c.created_at)}</time></div>
        ${c.body ? prose(c.body) : ''}
        ${c.audio_key ? `<audio controls preload="none" src="/media/${esc(c.audio_key)}"></audio>` : ''}
      </div>`).join('')
    : `<p class="formnote">ingen kommentarer endnu.</p>`

  return `<section class="comments">
  <h3>${comments.length} ${comments.length === 1 ? 'kommentar' : 'kommentarer'}</h3>
  ${list}
  <details class="cwrap">
  <summary>Skriv en kommentar</summary>
  <form class="cform" autocomplete="off">
    <input type="hidden" name="episode_id" value="${ep.id}">
    <div class="hp"><label>Lad feltet stå tomt<input type="text" name="website" tabindex="-1"></label></div>
    <input type="text" name="author" placeholder="dit navn" maxlength="60" required>
    <textarea name="body" placeholder="skriv en kommentar…" maxlength="2000" required></textarea>
    <button type="submit">Send</button>
    <p class="formnote"></p>
  </form>
  </details>
</section>`
}

function stampHtml(ep) {
  const bits = []
  if (ep.day_number) bits.push(`<span class="num">${ep.day_number}</span>`)
  bits.push(`<b>${fmtDateRange(ep.published_at, ep.date_end)}</b>`)
  if (ep.place) bits.push(esc(ep.place))
  if (ep.duration) bits.push(fmtDuration(ep.duration))
  return `<div class="stamp">${bits.join(' &nbsp;·&nbsp; ')}</div>`
}

function articleHtml(ep, blocks, comments, { full }) {
  const heading = full
    ? `<h2>${esc(ep.title)}</h2>`
    : `<h2><a href="/dag/${esc(ep.slug)}">${esc(ep.title)}</a></h2>`
  const isNote = ep.kind === 'note'
  const body = blocks.length
    ? blocks.map(blockHtml).join('')
    : prose(ep.body)

  return `<article class="${isNote ? 'note-post' : ''}">
  ${stampHtml(ep)}
  ${heading}
  ${playerHtml(ep)}
  ${body}
  ${full ? commentsHtml(ep, comments) : ''}
</article>`
}

export function indexPage(env, rows, site) {
  if (!rows.length) {
    return layout(env, {
      description: env.SITE_TAGLINE, site,
      body: `<p class="empty">Ikke noget her endnu. Kom tilbage.</p>`
    })
  }
  const body = rows
    .map(r => articleHtml(r.ep, r.blocks, [], { full: false }))
    .join(`<div class="sep">${SQUIGGLE}</div>`)
  return layout(env, { description: env.SITE_TAGLINE, body, site })
}

export function episodePage(env, ep, blocks, comments, origin, site) {
  const firstText = blocks.find(b => b.type === 'text' || b.type === 'note')
  const desc = String(firstText?.content || ep.body || '').replace(/\s+/g, ' ').slice(0, 180)
  const firstImg = blocks.find(b => b.type === 'image' && b.media_key)
  const body = `${articleHtml(ep, blocks, comments, { full: true })}
    <p class="backlink"><a href="/">← alt indhold</a></p>`
  return layout(env, {
    title: ep.title, description: desc,
    canonical: `${origin}/dag/${ep.slug}`,
    ogImage: firstImg ? `${origin}/media/${firstImg.media_key}` : undefined,
    body, site
  })
}

/**
 * Abonnér-siden. Et rå link til feed.xml er ubrugeligt for almindelige
 * mennesker — Safari spørger bare om man vil lede i App Store. Her får man
 * i stedet ét tryk til sin app, og adressen at kopiere hvis den ikke er med.
 */
export function subscribePage(env, origin) {
  const feed = `${origin}/feed.xml`
  const bare = feed.replace(/^https?:\/\//, '')
  const body = `<article>
  <h2>Følg med</h2>
  <p>Du kan bare besøge <a href="/">forsiden</a>, når du har lyst. Men vil du
  have hvert nyt indslag automatisk — som en podcast, med afspilning offline —
  så tilføj den til din podcast-app.</p>

  <div class="applist">
    <a class="appbtn" href="podcast://${esc(bare)}">Åbn i Apple Podcasts</a>
  </div>
  <p class="cap">Virker på iPhone, iPad og Mac, hvis Podcasts-appen er installeret.</p>

  <h3 class="blk-heading">Andre apps</h3>
  <p>Kopiér adressen her og find "Tilføj via URL" eller "Add by URL" i appens
  indstillinger. Det virker i Overcast, Pocket Casts, Castro, AntennaPod og
  stort set alt andet.</p>
  <div class="copybox">
    <input type="text" id="feedurl" readonly value="${esc(feed)}" aria-label="Feedadresse">
    <button type="button" id="copybtn">Kopiér</button>
  </div>

  <aside class="blk blk-note" style="float:none;width:auto;margin:2rem 0;transform:none">
    <p><b>Spotify kan ikke endnu.</b> Spotify lader ikke lyttere tilføje en
    vilkårlig adresse — en podcast skal først indleveres til deres katalog.
    Indtil videre: brug Apple Podcasts, eller besøg bare forsiden.</p>
  </aside>

  <p class="backlink"><a href="/">← tilbage</a></p>
</article>
<script>
document.getElementById('copybtn').addEventListener('click', async function () {
  var inp = document.getElementById('feedurl'), btn = this;
  try {
    await navigator.clipboard.writeText(inp.value);
  } catch (e) {
    inp.select(); inp.setSelectionRange(0, 99999);
    try { document.execCommand('copy'); } catch (e2) {}
  }
  btn.textContent = 'Kopieret';
  setTimeout(function () { btn.textContent = 'Kopiér'; }, 2000);
});
</script>`
  return layout(env, {
    title: 'Følg med',
    description: 'Sådan får du nye indslag automatisk i din podcast-app.',
    body
  })
}

export function notFoundPage(env) {
  return layout(env, {
    title: 'Ikke fundet',
    body: `<p class="empty">Den side findes ikke. <a href="/">Tilbage til forsiden</a></p>`
  })
}

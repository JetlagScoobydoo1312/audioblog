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
.wrap { max-width: 40rem; margin: 0 auto; padding: 2rem 1.25rem 7rem; }

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
.backlink { font-family: var(--type); font-size: .78rem; margin-top: 2rem; }
footer.site {
  margin-top: 4rem; padding-top: 1rem; border-top: 1.5px solid var(--ink);
  font-family: var(--type); font-size: .74rem;
  display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
}
`

export function layout(env, { title, description, body, canonical, ogImage }) {
  const site = env.SITE_TITLE || 'Audioblog'
  const full = title ? `${title} — ${site}` : site
  return `<!doctype html>
<html lang="${esc(env.SITE_LANG || 'da')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description || env.SITE_TAGLINE || '')}">
<meta property="og:title" content="${esc(title || site)}">
<meta property="og:description" content="${esc(description || env.SITE_TAGLINE || '')}">
<meta property="og:type" content="website">
<meta name="color-scheme" content="light">
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ''}
${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">` : ''}
<link rel="alternate" type="application/rss+xml" title="${esc(site)}" href="/feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,400..800&family=Courier+Prime:wght@400;700&display=swap">
<style>${STYLES}</style>
</head>
<body>
<div class="wrap">
  <header class="masthead">
    <h1><a href="/">${esc(site)}</a></h1>
    <p class="tagline">${esc(env.SITE_TAGLINE || '')}</p>
    <p class="subscribe"><a href="/feed.xml">→ abonnér i din podcast-app</a></p>
  </header>
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
  <form class="cform" autocomplete="off">
    <input type="hidden" name="episode_id" value="${ep.id}">
    <div class="hp"><label>Lad feltet stå tomt<input type="text" name="website" tabindex="-1"></label></div>
    <input type="text" name="author" placeholder="dit navn" maxlength="60" required>
    <textarea name="body" placeholder="skriv en kommentar…" maxlength="2000" required></textarea>
    <button type="submit">Send</button>
    <p class="formnote"></p>
  </form>
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

export function indexPage(env, rows) {
  if (!rows.length) {
    return layout(env, {
      description: env.SITE_TAGLINE,
      body: `<p class="empty">Ikke noget her endnu. Kom tilbage.</p>`
    })
  }
  const body = rows
    .map(r => articleHtml(r.ep, r.blocks, [], { full: false }))
    .join(`<div class="sep">${SQUIGGLE}</div>`)
  return layout(env, { description: env.SITE_TAGLINE, body })
}

export function episodePage(env, ep, blocks, comments, origin) {
  const firstText = blocks.find(b => b.type === 'text' || b.type === 'note')
  const desc = String(firstText?.content || ep.body || '').replace(/\s+/g, ' ').slice(0, 180)
  const firstImg = blocks.find(b => b.type === 'image' && b.media_key)
  const body = `${articleHtml(ep, blocks, comments, { full: true })}
    <p class="backlink"><a href="/">← alt indhold</a></p>`
  return layout(env, {
    title: ep.title, description: desc,
    canonical: `${origin}/dag/${ep.slug}`,
    ogImage: firstImg ? `${origin}/media/${firstImg.media_key}` : undefined,
    body
  })
}

export function notFoundPage(env) {
  return layout(env, {
    title: 'Ikke fundet',
    body: `<p class="empty">Den side findes ikke. <a href="/">Tilbage til forsiden</a></p>`
  })
}

// HTML-rendering. Alt server-renderes, så links kan deles og RSS er ægte.

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

/** Plain tekst → afsnit, med links gjort klikbare. */
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
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

const DAYS = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag']
const MONTHS = ['januar', 'februar', 'marts', 'april', 'maj', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'december']

export function fmtDate(iso) {
  const d = new Date(iso)
  if (isNaN(d)) return ''
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()}. ${MONTHS[d.getUTCMonth()]}`
}

const STYLES = `
:root {
  --paper: #FBFBF9;
  --card: #FFFFFF;
  --sunk: #F1F2EE;
  --ink: #16181F;
  --muted: #5F6672;
  --line: #E3E5E0;
  --line-strong: #C9CDC6;
  --accent: #0E6B7C;
  --accent-soft: #DCEDF1;
  --amber: #A8710C;
  --prose: "Newsreader", Georgia, "Times New Roman", serif;
  --ui: "Archivo", "Helvetica Neue", Arial, sans-serif;
  --mono: "IBM Plex Mono", ui-monospace, Menlo, monospace;
}
@media (prefers-color-scheme: dark) {
  :root {
    --paper: #101319;
    --card: #171B23;
    --sunk: #1D222C;
    --ink: #E9EBEC;
    --muted: #98A1AE;
    --line: #262C37;
    --line-strong: #384150;
    --accent: #4FB3C7;
    --accent-soft: #14313A;
    --amber: #DFA94E;
  }
}
* { box-sizing: border-box; }
body {
  margin: 0; background: var(--paper); color: var(--ink);
  font-family: var(--prose); font-size: 18px; line-height: 1.68;
  -webkit-font-smoothing: antialiased;
}
a { color: var(--accent); text-underline-offset: 2px; }
.wrap { max-width: 44rem; margin: 0 auto; padding: 2.5rem 1.25rem 6rem; }

.masthead {
  display: flex; flex-direction: column; gap: .5rem;
  padding-bottom: 1.75rem; margin-bottom: 2.5rem;
  border-bottom: 1px solid var(--line-strong);
}
.masthead h1 {
  font-family: var(--ui); font-weight: 700; letter-spacing: -.028em;
  font-size: clamp(1.9rem, 6vw, 2.7rem); margin: 0; line-height: 1.1;
}
.masthead h1 a { color: inherit; text-decoration: none; }
.tagline { color: var(--muted); font-size: 1.02rem; margin: 0; }
.mast-links { font-family: var(--ui); font-size: .82rem; margin-top: .35rem; display: flex; gap: 1rem; }

.eyebrow {
  font-family: var(--mono); font-size: .7rem; font-weight: 500;
  letter-spacing: .15em; text-transform: uppercase; color: var(--muted);
  display: flex; flex-wrap: wrap; gap: .35rem .7rem; align-items: baseline;
}
.eyebrow .day { color: var(--amber); font-weight: 600; }

.feed { display: flex; flex-direction: column; gap: 2.25rem; }
article.ep {
  background: var(--card); border: 1px solid var(--line);
  border-radius: 3px; padding: 1.6rem 1.5rem 1.75rem;
}
article.ep h2 {
  font-family: var(--ui); font-weight: 600; letter-spacing: -.022em;
  font-size: 1.45rem; line-height: 1.2; margin: .55rem 0 0; text-wrap: balance;
}
article.ep h2 a { color: inherit; text-decoration: none; }
article.ep h2 a:hover { color: var(--accent); }
.ep-body { margin-top: .3rem; }
.ep-body p { margin: .9rem 0 0; }

/* ---- afspiller ---- */
.player {
  margin-top: 1.15rem; background: var(--sunk);
  border: 1px solid var(--line); border-radius: 3px;
  padding: .8rem .9rem; display: flex; align-items: center; gap: .85rem;
}
.pbtn {
  flex: 0 0 auto; width: 2.9rem; height: 2.9rem; border-radius: 50%;
  border: none; background: var(--accent); color: var(--paper);
  cursor: pointer; display: grid; place-items: center; padding: 0;
}
.pbtn:hover { filter: brightness(1.08); }
.pbtn svg { width: 1.1rem; height: 1.1rem; fill: currentColor; }
.pbtn .ico-pause { display: none; }
.player.playing .ico-play { display: none; }
.player.playing .ico-pause { display: block; }
.ptrack { flex: 1 1 auto; display: flex; flex-direction: column; gap: .4rem; min-width: 0; }
.scrub {
  -webkit-appearance: none; appearance: none; width: 100%; height: 4px;
  background: var(--line-strong); border-radius: 2px; cursor: pointer; margin: 0;
}
.scrub::-webkit-slider-thumb {
  -webkit-appearance: none; width: 13px; height: 13px; border-radius: 50%;
  background: var(--accent); cursor: pointer; border: none;
}
.scrub::-moz-range-thumb {
  width: 13px; height: 13px; border-radius: 50%;
  background: var(--accent); cursor: pointer; border: none;
}
.ptimes {
  font-family: var(--mono); font-size: .72rem; color: var(--muted);
  display: flex; justify-content: space-between; font-variant-numeric: tabular-nums;
}
.pskip {
  flex: 0 0 auto; background: none; border: 1px solid var(--line-strong);
  color: var(--muted); font-family: var(--mono); font-size: .68rem;
  border-radius: 999px; padding: .3rem .55rem; cursor: pointer;
}
.pskip:hover { border-color: var(--accent); color: var(--accent); }

/* ---- billeder ---- */
.shots { margin-top: 1.25rem; display: grid; gap: .6rem; }
.shots.n1 { grid-template-columns: 1fr; }
.shots.n2 { grid-template-columns: 1fr 1fr; }
.shots.n3, .shots.nmany { grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); }
.shots figure { margin: 0; }
.shots img {
  width: 100%; height: auto; display: block;
  border-radius: 2px; background: var(--sunk);
}
/* Ét billede: vis hele motivet, men lad det ikke sluge siden */
.shots.n1 img { max-height: 32rem; object-fit: contain; }
/* Flere billeder: ens højde, så rækken står pænt */
.shots.n2 img, .shots.n3 img, .shots.nmany img {
  aspect-ratio: 4 / 3; object-fit: cover; height: auto;
}
.shots figcaption {
  font-family: var(--ui); font-size: .78rem; color: var(--muted); margin-top: .35rem;
}

/* ---- kommentarer ---- */
.comments { margin-top: 1.6rem; padding-top: 1.2rem; border-top: 1px solid var(--line); }
.comments h3 {
  font-family: var(--mono); font-size: .7rem; letter-spacing: .15em;
  text-transform: uppercase; color: var(--muted); font-weight: 500; margin: 0 0 .9rem;
}
.cmt { padding: .8rem 0; border-bottom: 1px solid var(--line); }
.cmt:last-of-type { border-bottom: none; }
.cmt-head {
  font-family: var(--ui); font-size: .85rem; display: flex;
  gap: .6rem; align-items: baseline; flex-wrap: wrap;
}
.cmt-head b { font-weight: 600; }
.cmt-head time { font-family: var(--mono); font-size: .7rem; color: var(--muted); }
.cmt p { margin: .3rem 0 0; font-size: .97rem; }
.cmt audio { width: 100%; margin-top: .5rem; }

form.cform { margin-top: 1rem; display: flex; flex-direction: column; gap: .6rem; }
form.cform input, form.cform textarea, form.cform select {
  font: inherit; font-family: var(--ui); font-size: .95rem;
  padding: .6rem .7rem; border: 1px solid var(--line-strong);
  border-radius: 3px; background: var(--paper); color: var(--ink); width: 100%;
}
form.cform textarea { min-height: 5.5rem; resize: vertical; }
form.cform button {
  font-family: var(--ui); font-weight: 600; font-size: .92rem;
  background: var(--accent); color: var(--paper); border: none;
  border-radius: 3px; padding: .65rem 1.1rem; cursor: pointer; align-self: flex-start;
}
form.cform button:disabled { opacity: .5; cursor: default; }
.hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
.formnote { font-family: var(--ui); font-size: .8rem; color: var(--muted); }
.formnote.err { color: #B3402B; }
@media (prefers-color-scheme: dark) { .formnote.err { color: #E88E77; } }

:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.empty {
  border: 1px dashed var(--line-strong); border-radius: 3px;
  padding: 2.5rem 1.5rem; text-align: center; color: var(--muted);
}
footer.site {
  margin-top: 4rem; padding-top: 1.25rem; border-top: 1px solid var(--line);
  font-family: var(--ui); font-size: .82rem; color: var(--muted);
  display: flex; flex-wrap: wrap; gap: .4rem 1rem; justify-content: space-between;
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
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ''}
${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">` : ''}
<meta name="theme-color" content="#0E6B7C">
<link rel="alternate" type="application/rss+xml" title="${esc(site)}" href="/feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&display=swap">
<style>${STYLES}</style>
</head>
<body>
<div class="wrap">
  <header class="masthead">
    <h1><a href="/">${esc(site)}</a></h1>
    <p class="tagline">${esc(env.SITE_TAGLINE || '')}</p>
    <div class="mast-links"><a href="/feed.xml">Abonnér i din podcast-app</a></div>
  </header>
  ${body}
  <footer class="site">
    <span>${esc(env.SITE_AUTHOR || '')}</span>
    <span><a href="/feed.xml">RSS</a></span>
  </footer>
</div>
<script>${PLAYER_JS}</script>
</body>
</html>`
}

const PLAYER_JS = `
document.querySelectorAll('.player').forEach(function (p) {
  var a = p.querySelector('audio');
  var btn = p.querySelector('.pbtn');
  var bar = p.querySelector('.scrub');
  var cur = p.querySelector('.t-cur');
  var tot = p.querySelector('.t-tot');
  var skip = p.querySelector('.pskip');
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
    var note = f.querySelector('.formnote');
    var btn = f.querySelector('button');
    btn.disabled = true;
    note.className = 'formnote';
    note.textContent = 'Sender…';
    try {
      var res = await fetch('/api/comments', { method: 'POST', body: new FormData(f) });
      var data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Noget gik galt');
      note.textContent = 'Tak — din kommentar er nu på siden.';
      setTimeout(function () { location.reload(); }, 700);
    } catch (err) {
      note.className = 'formnote err';
      note.textContent = err.message;
      btn.disabled = false;
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
  <button class="pskip" type="button" title="Spring 15 sekunder frem">+15s</button>
</div>`
}

function shotsHtml(photos) {
  if (!photos || !photos.length) return ''
  const cls = photos.length === 1 ? 'n1' : photos.length === 2 ? 'n2' : photos.length === 3 ? 'n3' : 'nmany'
  const items = photos.map(p => `<figure>
    <img src="/media/${esc(p.media_key)}" alt="${esc(p.caption || '')}" loading="lazy"
         ${p.width ? `width="${p.width}"` : ''} ${p.height ? `height="${p.height}"` : ''}>
    ${p.caption ? `<figcaption>${esc(p.caption)}</figcaption>` : ''}
  </figure>`).join('')
  return `<div class="shots ${cls}">${items}</div>`
}

function commentsHtml(ep, comments) {
  const list = comments.length
    ? comments.map(c => `<div class="cmt">
        <div class="cmt-head"><b>${esc(c.author)}</b><time datetime="${esc(c.created_at)}">${fmtDate(c.created_at)}</time></div>
        ${c.body ? prose(c.body) : ''}
        ${c.audio_key ? `<audio controls preload="none" src="/media/${esc(c.audio_key)}"></audio>` : ''}
      </div>`).join('')
    : `<p class="formnote">Ingen kommentarer endnu.</p>`

  return `<section class="comments">
  <h3>${comments.length} ${comments.length === 1 ? 'kommentar' : 'kommentarer'}</h3>
  ${list}
  <form class="cform" autocomplete="off">
    <input type="hidden" name="episode_id" value="${ep.id}">
    <div class="hp"><label>Lad dette felt stå tomt<input type="text" name="website" tabindex="-1"></label></div>
    <input type="text" name="author" placeholder="Dit navn" maxlength="60" required>
    <textarea name="body" placeholder="Skriv en kommentar til dagen…" maxlength="2000" required></textarea>
    <button type="submit">Send</button>
    <p class="formnote"></p>
  </form>
</section>`
}

function episodeArticle(ep, photos, comments, { full }) {
  const dayBit = ep.day_number ? `<span class="day">Dag ${ep.day_number}</span>` : ''
  const placeBit = ep.place ? `<span>${esc(ep.place)}</span>` : ''
  const durBit = ep.duration ? `<span>${fmtDuration(ep.duration)}</span>` : ''
  const heading = full
    ? `<h2>${esc(ep.title)}</h2>`
    : `<h2><a href="/dag/${esc(ep.slug)}">${esc(ep.title)}</a></h2>`

  return `<article class="ep">
  <div class="eyebrow">${dayBit}<span>${fmtDate(ep.published_at)}</span>${placeBit}${durBit}</div>
  ${heading}
  ${playerHtml(ep)}
  <div class="ep-body">${prose(ep.body)}</div>
  ${shotsHtml(photos)}
  ${full ? commentsHtml(ep, comments) : ''}
</article>`
}

export function indexPage(env, rows) {
  if (!rows.length) {
    return layout(env, {
      description: env.SITE_TAGLINE,
      body: `<div class="empty">Første episode er ikke lagt op endnu. Kom tilbage snart.</div>`
    })
  }
  const body = `<div class="feed">${rows.map(r =>
    episodeArticle(r.ep, r.photos, [], { full: false })).join('')}</div>`
  return layout(env, { description: env.SITE_TAGLINE, body })
}

export function episodePage(env, ep, photos, comments, origin) {
  const desc = (ep.body || '').replace(/\s+/g, ' ').slice(0, 180)
  const body = `<div class="feed">${episodeArticle(ep, photos, comments, { full: true })}</div>
    <p style="margin-top:1.5rem;font-family:var(--ui);font-size:.9rem"><a href="/">← Alle dage</a></p>`
  return layout(env, {
    title: ep.title, description: desc,
    canonical: `${origin}/dag/${ep.slug}`,
    ogImage: photos[0] ? `${origin}/media/${photos[0].media_key}` : undefined,
    body
  })
}

export function notFoundPage(env) {
  return layout(env, {
    title: 'Ikke fundet',
    body: `<div class="empty">Den side findes ikke. <a href="/">Tilbage til forsiden</a></div>`
  })
}

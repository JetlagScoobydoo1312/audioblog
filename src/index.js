import { indexPage, episodePage, notFoundPage, esc } from './views.js'
import { adminPage } from './admin.js'

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const path = url.pathname.replace(/\/+$/, '') || '/'

    try {
      if (request.method === 'GET' && path === '/') return await handleIndex(env)
      if (request.method === 'GET' && path === '/feed.xml') return await handleFeed(env, url.origin)
      if (request.method === 'GET' && path === '/udgiv') return html(adminPage(env), 200)
      if (request.method === 'GET' && path.startsWith('/dag/')) {
        return await handleEpisode(env, decodeURIComponent(path.slice(5)), url.origin)
      }
      if (request.method === 'GET' && path.startsWith('/media/')) {
        return await handleMedia(env, decodeURIComponent(path.slice(7)), request)
      }
      if (request.method === 'POST' && path === '/api/episodes') return await createEpisode(request, env)
      if (request.method === 'POST' && path === '/api/comments') return await createComment(request, env)
    } catch (err) {
      console.error(err && err.stack || err)
      return json({ error: 'Der skete en serverfejl' }, 500)
    }

    return html(notFoundPage(env), 404)
  }
}

/* ---------- svar-hjælpere ---------- */

const html = (body, status = 200) => new Response(body, {
  status, headers: { 'content-type': 'text/html; charset=utf-8' }
})
const json = (obj, status = 200) => new Response(JSON.stringify(obj), {
  status, headers: { 'content-type': 'application/json; charset=utf-8' }
})

/* ---------- sider ---------- */

async function handleIndex(env) {
  const { results: eps } = await env.DB.prepare(
    `SELECT * FROM episodes ORDER BY published_at DESC, id DESC LIMIT 60`
  ).all()

  const rows = []
  for (const ep of eps) {
    const { results: blocks } = await env.DB.prepare(
      `SELECT * FROM blocks WHERE episode_id = ? ORDER BY position, id`
    ).bind(ep.id).all()
    rows.push({ ep, blocks })
  }
  return html(indexPage(env, rows))
}

async function handleEpisode(env, slug, origin) {
  const ep = await env.DB.prepare(`SELECT * FROM episodes WHERE slug = ?`).bind(slug).first()
  if (!ep) return html(notFoundPage(env), 404)

  const { results: blocks } = await env.DB.prepare(
    `SELECT * FROM blocks WHERE episode_id = ? ORDER BY position, id`
  ).bind(ep.id).all()

  const { results: comments } = await env.DB.prepare(
    `SELECT * FROM comments WHERE episode_id = ? AND hidden = 0 ORDER BY created_at ASC, id ASC`
  ).bind(ep.id).all()

  return html(episodePage(env, ep, blocks, comments, origin))
}

/* ---------- media fra R2, med Range så lyd kan spoles ---------- */

async function handleMedia(env, key, request) {
  if (!key || key.includes('..')) return new Response('Ugyldig sti', { status: 400 })

  const rangeHeader = request.headers.get('range')
  const obj = await env.MEDIA.get(key, rangeHeader ? { range: request.headers } : undefined)
  if (!obj) return new Response('Ikke fundet', { status: 404 })

  const headers = new Headers()
  obj.writeHttpMetadata(headers)
  headers.set('etag', obj.httpEtag)
  headers.set('accept-ranges', 'bytes')
  headers.set('cache-control', 'public, max-age=31536000, immutable')

  if (rangeHeader && obj.range) {
    const size = obj.size
    const r = obj.range
    let start, end
    // Bemærk: R2 kan returnere et objekt hvor nøglerne findes men er undefined,
    // så der skal tjekkes på værdien — ikke med "in".
    if (r.suffix != null) {
      start = Math.max(0, size - r.suffix)
      end = size - 1
    } else {
      start = r.offset != null ? r.offset : 0
      end = r.length != null ? Math.min(start + r.length - 1, size - 1) : size - 1
    }
    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) {
      headers.set('content-length', String(obj.size))
      return new Response(obj.body, { headers })
    }
    headers.set('content-range', `bytes ${start}-${end}/${size}`)
    headers.set('content-length', String(end - start + 1))
    return new Response(obj.body, { status: 206, headers })
  }

  headers.set('content-length', String(obj.size))
  return new Response(obj.body, { headers })
}

/* ---------- RSS: et ægte podcast-feed ---------- */

async function handleFeed(env, origin) {
  const { results: eps } = await env.DB.prepare(
    `SELECT * FROM episodes WHERE audio_key IS NOT NULL
     ORDER BY published_at DESC, id DESC LIMIT 200`
  ).all()

  const title = env.SITE_TITLE || 'Audioblog'
  const desc = env.SITE_TAGLINE || ''
  const author = env.SITE_AUTHOR || ''

  const items = eps.map(ep => {
    const link = `${origin}/dag/${encodeURIComponent(ep.slug)}`
    const summary = [ep.place, ep.body].filter(Boolean).join(' — ')
    return `  <item>
    <title>${esc(ep.title)}</title>
    <link>${esc(link)}</link>
    <guid isPermaLink="true">${esc(link)}</guid>
    <pubDate>${new Date(ep.published_at).toUTCString()}</pubDate>
    <description>${esc(summary)}</description>
    <itunes:summary>${esc(summary)}</itunes:summary>
    ${ep.duration ? `<itunes:duration>${ep.duration}</itunes:duration>` : ''}
    ${ep.day_number ? `<itunes:episode>${ep.day_number}</itunes:episode>` : ''}
    <enclosure url="${esc(origin)}/media/${esc(ep.audio_key)}" length="${ep.audio_bytes || 0}" type="${esc(ep.audio_type || 'audio/mpeg')}"/>
  </item>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${esc(title)}</title>
  <link>${esc(origin)}</link>
  <atom:link href="${esc(origin)}/feed.xml" rel="self" type="application/rss+xml"/>
  <language>${esc(env.SITE_LANG || 'da')}</language>
  <description>${esc(desc)}</description>
  <itunes:author>${esc(author)}</itunes:author>
  <itunes:summary>${esc(desc)}</itunes:summary>
  <itunes:explicit>false</itunes:explicit>
  <itunes:owner><itunes:name>${esc(author)}</itunes:name><itunes:email>${esc(env.SITE_EMAIL || '')}</itunes:email></itunes:owner>
${items}
</channel>
</rss>`

  return new Response(xml, {
    headers: { 'content-type': 'application/rss+xml; charset=utf-8', 'cache-control': 'public, max-age=300' }
  })
}

/* ---------- udgivelse ---------- */

// Returnerer null hvis alt er i orden, ellers en forklarende fejltekst.
// De to tilfælde skal holdes adskilt: "serveren mangler en nøgle" og
// "du skrev den forkerte" kræver vidt forskellige handlinger.
function authFailure(request, env) {
  const want = (env.ADMIN_TOKEN || '').trim()
  if (!want) {
    return 'Serveren har ingen ADMIN_TOKEN. Tilføj den under Settings → Variables and Secrets, og udgiv Worker\'en igen.'
  }
  const given = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()
  if (!given) {
    return 'Ingen adgangsnøgle blev sendt. Tryk "Glem nøglen på denne enhed" og indtast den igen.'
  }
  if (given.length !== want.length) {
    return `Forkert adgangsnøgle. Du sendte ${given.length} tegn, serveren forventer ${want.length}. Tryk "Glem nøglen på denne enhed" og indsæt den igen.`
  }
  let diff = 0
  for (let i = 0; i < want.length; i++) diff |= given.charCodeAt(i) ^ want.charCodeAt(i)
  if (diff !== 0) {
    return 'Forkert adgangsnøgle. Længden passer, men tegnene gør ikke. Tryk "Glem nøglen på denne enhed" og indsæt den igen.'
  }
  return null
}

function slugify(s) {
  return String(s).toLowerCase()
    .replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ä/g, 'a').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'dag'
}

async function uniqueSlug(env, base) {
  let slug = base
  for (let i = 2; i < 100; i++) {
    const hit = await env.DB.prepare(`SELECT 1 FROM episodes WHERE slug = ?`).bind(slug).first()
    if (!hit) return slug
    slug = `${base}-${i}`
  }
  return `${base}-${Date.now()}`
}

// Browsere er uenige om hvad de kalder de samme filtyper. WAV alene har
// mindst fire stavemåder, og rammer man ikke en af dem, får filen forkert
// endelse og kan afvises af afspillere.
const EXTENSIONS = {
  'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/x-mpeg': 'mp3', 'audio/mpeg3': 'mp3',
  'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/aac': 'm4a', 'audio/aacp': 'm4a',
  'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/wave': 'wav', 'audio/vnd.wave': 'wav',
  'audio/x-pn-wav': 'wav',
  'audio/flac': 'flac', 'audio/x-flac': 'flac',
  'audio/ogg': 'ogg', 'audio/vorbis': 'ogg', 'audio/opus': 'opus',
  'audio/webm': 'webm', 'video/webm': 'webm',
  'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png',
  'image/webp': 'webp', 'image/gif': 'gif', 'image/heic': 'heic'
}

function extFor(type, fallback, filename) {
  const hit = EXTENSIONS[String(type || '').toLowerCase().split(';')[0].trim()]
  if (hit) return hit
  // Sidste udvej: læs endelsen af selve filnavnet
  const m = String(filename || '').match(/\.([a-z0-9]{2,5})$/i)
  return m ? m[1].toLowerCase() : fallback
}

async function createEpisode(request, env) {
  const fail = authFailure(request, env)
  if (fail) return json({ error: fail }, 401)

  const form = await request.formData()
  const title = String(form.get('title') || '').trim()
  if (!title) return json({ error: 'Titel mangler' }, 400)

  const isoDay = v => {
    const t = String(v || '').trim()
    return /^\d{4}-\d{2}-\d{2}$/.test(t) ? new Date(`${t}T12:00:00Z`).toISOString() : null
  }
  const publishedAt = isoDay(form.get('date')) || new Date().toISOString()
  const dateEnd = isoDay(form.get('date_end'))

  const kind = form.get('kind') === 'note' ? 'note' : 'episode'
  const dayNumber = parseInt(form.get('day_number'), 10)
  const place = String(form.get('place') || '').trim()
  const duration = parseInt(form.get('duration'), 10)

  const slug = await uniqueSlug(env, slugify(title))

  // Lyd
  let audioKey = null, audioType = null, audioBytes = null
  const audio = form.get('audio')
  if (audio && typeof audio === 'object' && audio.size > 0) {
    audioType = audio.type || 'audio/mpeg'
    audioBytes = audio.size
    audioKey = `audio/${slug}-${crypto.randomUUID().slice(0, 8)}.${extFor(audioType, 'mp3', audio.name)}`
    await env.MEDIA.put(audioKey, audio.stream(), { httpMetadata: { contentType: audioType } })
  }

  const now = new Date().toISOString()
  const res = await env.DB.prepare(
    `INSERT INTO episodes (slug, kind, day_number, title, place, body, audio_key, audio_type,
       audio_bytes, duration, published_at, date_end, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(
    slug, kind, Number.isFinite(dayNumber) ? dayNumber : null, title, place || null, '',
    audioKey, audioType, audioBytes, Number.isFinite(duration) ? duration : null,
    publishedAt, dateEnd, now
  ).run()

  const episodeId = res.meta.last_row_id

  // Blokke: en ordnet liste af tekst, noter, overskrifter, citater og billeder.
  // Filerne kommer separat og henvises til med filIndex.
  let spec = []
  try { spec = JSON.parse(String(form.get('blocks') || '[]')) } catch (e) { spec = [] }
  const blockFiles = form.getAll('blockfile')

  for (let i = 0; i < spec.length; i++) {
    const b = spec[i] || {}
    const type = ['text', 'note', 'heading', 'quote', 'image'].includes(b.type) ? b.type : 'text'
    let mediaKey = null, w = null, h = null

    if (type === 'image') {
      const f = blockFiles[b.fileIndex]
      if (!f || typeof f !== 'object' || !f.size) continue
      const ftype = f.type || 'image/jpeg'
      mediaKey = `photos/${slug}-${i + 1}-${crypto.randomUUID().slice(0, 8)}.${extFor(ftype, 'jpg', f.name)}`
      await env.MEDIA.put(mediaKey, f.stream(), { httpMetadata: { contentType: ftype } })
      w = Number.isFinite(b.width) ? b.width : null
      h = Number.isFinite(b.height) ? b.height : null
    } else if (!String(b.content || '').trim()) {
      continue
    }

    await env.DB.prepare(
      `INSERT INTO blocks (episode_id, position, type, content, media_key, caption, width, height, offset_side)
       VALUES (?,?,?,?,?,?,?,?,?)`
    ).bind(
      episodeId, i, type, String(b.content || '').trim() || null, mediaKey,
      String(b.caption || '').trim() || null, w, h,
      ['left', 'right', 'wide'].includes(b.side) ? b.side : null
    ).run()
  }

  return json({ ok: true, slug, id: episodeId })
}

/* ---------- kommentarer ---------- */

async function createComment(request, env) {
  const form = await request.formData()

  // Honeypot: rigtige mennesker ser ikke feltet
  if (String(form.get('website') || '').trim()) return json({ ok: true })

  const episodeId = parseInt(form.get('episode_id'), 10)
  const author = String(form.get('author') || '').trim().slice(0, 60)
  const body = String(form.get('body') || '').trim().slice(0, 2000)

  if (!Number.isFinite(episodeId)) return json({ error: 'Ukendt dag' }, 400)
  if (!author) return json({ error: 'Skriv dit navn' }, 400)
  if (!body) return json({ error: 'Skriv en kommentar' }, 400)

  // Simpel spamindikator: kommentarer fra venner har sjældent tre links
  const links = (body.match(/https?:\/\//g) || []).length
  if (links > 2) return json({ error: 'For mange links' }, 400)

  const ep = await env.DB.prepare(`SELECT id FROM episodes WHERE id = ?`).bind(episodeId).first()
  if (!ep) return json({ error: 'Ukendt dag' }, 404)

  await env.DB.prepare(
    `INSERT INTO comments (episode_id, author, body, created_at) VALUES (?,?,?,?)`
  ).bind(episodeId, author, body, new Date().toISOString()).run()

  return json({ ok: true })
}

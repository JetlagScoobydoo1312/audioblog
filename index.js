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
    const { results: photos } = await env.DB.prepare(
      `SELECT * FROM photos WHERE episode_id = ? ORDER BY sort_order, id LIMIT 4`
    ).bind(ep.id).all()
    rows.push({ ep, photos })
  }
  return html(indexPage(env, rows))
}

async function handleEpisode(env, slug, origin) {
  const ep = await env.DB.prepare(`SELECT * FROM episodes WHERE slug = ?`).bind(slug).first()
  if (!ep) return html(notFoundPage(env), 404)

  const { results: photos } = await env.DB.prepare(
    `SELECT * FROM photos WHERE episode_id = ? ORDER BY sort_order, id`
  ).bind(ep.id).all()

  const { results: comments } = await env.DB.prepare(
    `SELECT * FROM comments WHERE episode_id = ? AND hidden = 0 ORDER BY created_at ASC, id ASC`
  ).bind(ep.id).all()

  return html(episodePage(env, ep, photos, comments, origin))
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

function authed(request, env) {
  const given = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  const want = env.ADMIN_TOKEN || ''
  if (!want || given.length !== want.length) return false
  let diff = 0
  for (let i = 0; i < want.length; i++) diff |= given.charCodeAt(i) ^ want.charCodeAt(i)
  return diff === 0
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

function extFor(type, fallback) {
  const map = {
    'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a',
    'audio/aac': 'm4a', 'audio/wav': 'wav', 'audio/ogg': 'ogg', 'audio/webm': 'webm',
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp'
  }
  return map[type] || fallback
}

async function createEpisode(request, env) {
  if (!authed(request, env)) return json({ error: 'Forkert adgangsnøgle' }, 401)

  const form = await request.formData()
  const title = String(form.get('title') || '').trim()
  if (!title) return json({ error: 'Titel mangler' }, 400)

  const dateStr = String(form.get('date') || '').trim()
  const publishedAt = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
    ? new Date(`${dateStr}T12:00:00Z`).toISOString()
    : new Date().toISOString()

  const dayNumber = parseInt(form.get('day_number'), 10)
  const place = String(form.get('place') || '').trim()
  const body = String(form.get('body') || '').trim()
  const duration = parseInt(form.get('duration'), 10)

  const base = Number.isFinite(dayNumber) ? `dag-${dayNumber}-${slugify(title)}` : slugify(title)
  const slug = await uniqueSlug(env, base)

  // Lyd
  let audioKey = null, audioType = null, audioBytes = null
  const audio = form.get('audio')
  if (audio && typeof audio === 'object' && audio.size > 0) {
    audioType = audio.type || 'audio/mpeg'
    audioBytes = audio.size
    audioKey = `audio/${slug}-${crypto.randomUUID().slice(0, 8)}.${extFor(audioType, 'mp3')}`
    await env.MEDIA.put(audioKey, audio.stream(), {
      httpMetadata: { contentType: audioType }
    })
  }

  const now = new Date().toISOString()
  const res = await env.DB.prepare(
    `INSERT INTO episodes (slug, day_number, title, place, body, audio_key, audio_type,
       audio_bytes, duration, published_at, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(
    slug, Number.isFinite(dayNumber) ? dayNumber : null, title, place || null, body,
    audioKey, audioType, audioBytes, Number.isFinite(duration) ? duration : null,
    publishedAt, now
  ).run()

  const episodeId = res.meta.last_row_id

  // Billeder (allerede skaleret i browseren)
  const files = form.getAll('photo')
  const captions = form.getAll('caption')
  const dims = form.getAll('dims')
  for (let i = 0; i < files.length; i++) {
    const f = files[i]
    if (!f || typeof f !== 'object' || !f.size) continue
    const type = f.type || 'image/jpeg'
    const key = `photos/${slug}-${i + 1}-${crypto.randomUUID().slice(0, 8)}.${extFor(type, 'jpg')}`
    await env.MEDIA.put(key, f.stream(), { httpMetadata: { contentType: type } })
    const [w, h] = String(dims[i] || '').split('x').map(n => parseInt(n, 10))
    await env.DB.prepare(
      `INSERT INTO photos (episode_id, media_key, caption, width, height, sort_order)
       VALUES (?,?,?,?,?,?)`
    ).bind(
      episodeId, key, String(captions[i] || '').trim() || null,
      Number.isFinite(w) ? w : null, Number.isFinite(h) ? h : null, i
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

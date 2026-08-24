// Udgivelsessiden. Designet til at blive brugt på en telefon, træt, på hostel-wifi.
// Billeder skaleres i browseren før upload, så du ikke brænder mobildata.

import { esc } from './views.js'

export function adminPage(env) {
  return `<!doctype html>
<html lang="da">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Udgiv — ${esc(env.SITE_TITLE || 'Audioblog')}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
:root {
  --paper:#FBFBF9; --card:#fff; --ink:#16181F; --muted:#5F6672;
  --line:#E3E5E0; --line-strong:#C9CDC6; --accent:#0E6B7C; --ok:#1D7A4C; --err:#B3402B;
}
@media (prefers-color-scheme: dark) {
  :root { --paper:#101319; --card:#171B23; --ink:#E9EBEC; --muted:#98A1AE;
          --line:#262C37; --line-strong:#384150; --accent:#4FB3C7; --ok:#54BE8A; --err:#E88E77; }
}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);
  font-family:"Archivo",system-ui,sans-serif;font-size:16px;line-height:1.55}
.wrap{max-width:34rem;margin:0 auto;padding:1.5rem 1rem 5rem}
h1{font-size:1.4rem;font-weight:700;letter-spacing:-.02em;margin:0 0 .25rem}
.sub{color:var(--muted);font-size:.88rem;margin:0 0 1.5rem}
fieldset{border:1px solid var(--line);border-radius:4px;margin:0 0 1rem;padding:1rem;background:var(--card)}
legend{font-family:"IBM Plex Mono",monospace;font-size:.68rem;letter-spacing:.14em;
  text-transform:uppercase;color:var(--muted);padding:0 .4rem}
label{display:block;margin-bottom:.85rem}
label:last-child{margin-bottom:0}
label span{display:block;font-size:.82rem;color:var(--muted);margin-bottom:.25rem}
input,textarea{font:inherit;width:100%;padding:.6rem .7rem;border:1px solid var(--line-strong);
  border-radius:3px;background:var(--paper);color:var(--ink)}
textarea{min-height:7rem;resize:vertical;line-height:1.6}
.row{display:flex;gap:.7rem}
.row label{flex:1}
button{font:inherit;font-weight:600;background:var(--accent);color:var(--paper);border:none;
  border-radius:3px;padding:.8rem 1.2rem;cursor:pointer;width:100%;font-size:1rem}
button:disabled{opacity:.5;cursor:default}
button.ghost{background:none;border:1px solid var(--line-strong);color:var(--muted);
  width:auto;padding:.4rem .8rem;font-size:.82rem;font-weight:500}
#status{margin-top:1rem;font-size:.9rem;min-height:1.4em}
#status.ok{color:var(--ok)} #status.err{color:var(--err)}
.meta{font-family:"IBM Plex Mono",monospace;font-size:.72rem;color:var(--muted);margin-top:.35rem}
.shotlist{display:flex;flex-direction:column;gap:.6rem;margin-top:.6rem}
.shotrow{display:flex;gap:.6rem;align-items:center}
.shotrow img{width:3.2rem;height:3.2rem;object-fit:cover;border-radius:3px;flex:0 0 auto}
.shotrow input{margin:0;font-size:.88rem}
.gate{max-width:22rem}
</style>
</head>
<body>
<div class="wrap">

<div id="gate" class="gate" hidden>
  <h1>Udgiv</h1>
  <p class="sub">Indsæt din adgangsnøgle. Den huskes på denne telefon.</p>
  <label><span>Adgangsnøgle</span><input type="password" id="token" autocomplete="current-password"></label>
  <button type="button" id="unlock">Lås op</button>
</div>

<form id="pub" hidden>
  <h1>Ny episode</h1>
  <p class="sub">Vælg lyd, skriv et par linjer, tryk udgiv. Billeder skaleres automatisk.</p>

  <fieldset>
    <legend>Dagen</legend>
    <div class="row">
      <label style="flex:0 0 6rem"><span>Dag nr.</span><input type="number" name="day_number" min="1" inputmode="numeric"></label>
      <label><span>Dato</span><input type="date" name="date" required></label>
    </div>
    <label><span>Titel</span><input type="text" name="title" maxlength="120" required placeholder="Nattoget over Brenner"></label>
    <label><span>Sted</span><input type="text" name="place" maxlength="80" placeholder="Innsbruck"></label>
  </fieldset>

  <fieldset>
    <legend>Lyd</legend>
    <label><span>Lydfil (mp3 eller m4a)</span><input type="file" id="audio" name="audio" accept="audio/*" required></label>
    <div class="meta" id="ameta"></div>
  </fieldset>

  <fieldset>
    <legend>Tekst</legend>
    <label><span>Et par linjer til dagen</span><textarea name="body" placeholder="Tom bane, tåge i dalen, og en østriger der ville tale om fodbold i tre timer."></textarea></label>
  </fieldset>

  <fieldset>
    <legend>Billeder</legend>
    <label><span>Vælg billeder</span><input type="file" id="photos" accept="image/*" multiple></label>
    <div class="shotlist" id="shotlist"></div>
  </fieldset>

  <button type="submit" id="go">Udgiv dagen</button>
  <div id="status"></div>
  <p style="margin-top:1.5rem"><button type="button" class="ghost" id="forget">Glem nøglen på denne enhed</button></p>
</form>

</div>
<script>
var KEY = 'audioblog_token';
var gate = document.getElementById('gate');
var form = document.getElementById('pub');
var statusEl = document.getElementById('status');
var shots = [];   // { blob, name, caption, width, height }
var audioDuration = null;

function token() { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } }
function show() { if (token()) { gate.hidden = true; form.hidden = false; } else { gate.hidden = false; form.hidden = true; } }
show();

document.getElementById('unlock').addEventListener('click', function () {
  var v = document.getElementById('token').value.trim();
  if (!v) return;
  try { localStorage.setItem(KEY, v); } catch (e) {}
  show();
});
document.getElementById('forget').addEventListener('click', function () {
  try { localStorage.removeItem(KEY); } catch (e) {}
  location.reload();
});

// Dagens dato som standard
var d = new Date();
form.date.value = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

// Læs varigheden ud af lydfilen, så siden kan vise den uden at hente hele filen
document.getElementById('audio').addEventListener('change', function (e) {
  var f = e.target.files[0];
  var meta = document.getElementById('ameta');
  audioDuration = null;
  if (!f) { meta.textContent = ''; return; }
  var mb = (f.size / 1048576).toFixed(1);
  var a = new Audio();
  a.preload = 'metadata';
  a.onloadedmetadata = function () {
    URL.revokeObjectURL(a.src);
    if (isFinite(a.duration)) {
      audioDuration = Math.round(a.duration);
      var m = Math.floor(audioDuration / 60), s = audioDuration % 60;
      meta.textContent = mb + ' MB · ' + m + ':' + String(s).padStart(2, '0');
    } else { meta.textContent = mb + ' MB'; }
  };
  a.onerror = function () { meta.textContent = mb + ' MB'; };
  a.src = URL.createObjectURL(f);
});

// Skalér billeder i browseren: sparer mobildata og gør siden hurtig
function shrink(file, maxSide) {
  return new Promise(function (resolve, reject) {
    var img = new Image();
    img.onload = function () {
      URL.revokeObjectURL(img.src);
      var w = img.naturalWidth, h = img.naturalHeight;
      var scale = Math.min(1, maxSide / Math.max(w, h));
      w = Math.round(w * scale); h = Math.round(h * scale);
      var c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      c.toBlob(function (blob) {
        if (!blob) return reject(new Error('Kunne ikke behandle billedet'));
        resolve({ blob: blob, width: w, height: h });
      }, 'image/jpeg', 0.82);
    };
    img.onerror = function () { reject(new Error('Kunne ikke læse billedet')); };
    img.src = URL.createObjectURL(file);
  });
}

document.getElementById('photos').addEventListener('change', async function (e) {
  var files = Array.from(e.target.files);
  var list = document.getElementById('shotlist');
  for (var i = 0; i < files.length; i++) {
    try {
      var out = await shrink(files[i], 1600);
      var item = { blob: out.blob, name: files[i].name, caption: '', width: out.width, height: out.height };
      shots.push(item);
      var row = document.createElement('div');
      row.className = 'shotrow';
      var thumb = document.createElement('img');
      thumb.src = URL.createObjectURL(out.blob);
      var cap = document.createElement('input');
      cap.type = 'text'; cap.placeholder = 'Billedtekst (valgfri)'; cap.maxLength = 140;
      cap.addEventListener('input', function () { item.caption = this.value; }.bind(cap));
      row.appendChild(thumb); row.appendChild(cap);
      list.appendChild(row);
    } catch (err) { console.error(err); }
  }
  e.target.value = '';
});

form.addEventListener('submit', async function (e) {
  e.preventDefault();
  var btn = document.getElementById('go');
  btn.disabled = true;
  statusEl.className = ''; statusEl.textContent = 'Uploader…';

  var fd = new FormData();
  fd.append('day_number', form.day_number.value);
  fd.append('date', form.date.value);
  fd.append('title', form.title.value);
  fd.append('place', form.place.value);
  fd.append('body', form.body.value);
  if (audioDuration) fd.append('duration', String(audioDuration));
  var af = document.getElementById('audio').files[0];
  if (af) fd.append('audio', af, af.name);
  shots.forEach(function (s, i) {
    fd.append('photo', s.blob, 'foto-' + (i + 1) + '.jpg');
    fd.append('caption', s.caption || '');
    fd.append('dims', s.width + 'x' + s.height);
  });

  try {
    var res = await fetch('/api/episodes', {
      method: 'POST',
      headers: { 'authorization': 'Bearer ' + token() },
      body: fd
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload mislykkedes');
    statusEl.className = 'ok';
    statusEl.innerHTML = 'Udgivet. <a href="/dag/' + data.slug + '">Se dagen</a>';
    form.reset(); shots = []; audioDuration = null;
    document.getElementById('shotlist').innerHTML = '';
    document.getElementById('ameta').textContent = '';
  } catch (err) {
    statusEl.className = 'err';
    statusEl.textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});
</script>
</body>
</html>`
}

// Udgivelsessiden. En episode bygges af blokke, der kan lægges i vilkårlig
// rækkefølge: tekst, noter i marginen, overskrifter, citater og billeder.
// Billeder skaleres i browseren før upload.

import { esc } from './views.js'

export function adminPage(env) {
  return `<!doctype html>
<html lang="da">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<meta name="color-scheme" content="light">
<title>Udgiv — ${esc(env.SITE_TITLE || 'Audioblog')}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,400..800&family=Courier+Prime:wght@400;700&display=swap">
<style>
:root { --paper:#fff; --ink:#000; --faint:#6B6B6B; --hot:#E8340C; --hi:#FFF6A8;
  --display:"Bricolage Grotesque","Arial Black",sans-serif;
  --type:"Courier Prime","Courier New",monospace;
  --body:"Times New Roman",Times,serif; }
*{box-sizing:border-box}
html{background:var(--paper)}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--type);font-size:15px;line-height:1.45}
.wrap{max-width:36rem;margin:0 auto;padding:1.5rem 1rem 6rem}
h1{font-family:var(--display);font-variation-settings:"wdth" 100,"opsz" 48;font-weight:800;
   text-transform:uppercase;font-size:2rem;line-height:.95;letter-spacing:-.03em;margin:0 0 .3rem}
.sub{color:var(--faint);font-size:.78rem;margin:0 0 1.6rem}
fieldset{border:1.5px solid var(--ink);margin:0 0 1rem;padding:.9rem}
legend{font-size:.7rem;text-transform:uppercase;letter-spacing:.12em;padding:0 .35rem}
label{display:block;margin-bottom:.7rem}
label:last-child{margin-bottom:0}
label span{display:block;font-size:.72rem;color:var(--faint);margin-bottom:.2rem;text-transform:uppercase;letter-spacing:.06em}
input,textarea,select{font:inherit;width:100%;padding:.45rem .5rem;border:1.5px solid var(--ink);
  border-radius:0;background:var(--paper);color:var(--ink)}
textarea{min-height:5rem;resize:vertical;font-family:var(--body);font-size:1rem;line-height:1.5}
.row{display:flex;gap:.6rem}.row label{flex:1}
button{font:inherit;background:var(--ink);color:var(--paper);border:1.5px solid var(--ink);
  padding:.45rem .8rem;cursor:pointer;text-transform:uppercase;letter-spacing:.06em;font-size:.75rem}
button:hover{background:var(--hot);border-color:var(--hot)}
button:disabled{opacity:.4;cursor:default}
button.ghost{background:var(--paper);color:var(--ink)}
button.ghost:hover{background:var(--hi);border-color:var(--ink);color:var(--ink)}
button.wide{width:100%;padding:.7rem;font-size:.85rem}
.addbar{display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.8rem}
.addbar button{flex:1 1 auto}
.blk{border:1.5px solid var(--ink);padding:.6rem;margin-bottom:.6rem;background:var(--paper)}
.blk.note{background:#FFFDEB}
.blk-top{display:flex;align-items:center;gap:.4rem;margin-bottom:.4rem}
.blk-kind{font-size:.68rem;text-transform:uppercase;letter-spacing:.12em;flex:1}
.blk-top button{padding:.15rem .4rem;font-size:.7rem;line-height:1}
.blk textarea{min-height:3.5rem}
.blk .side{display:flex;gap:.4rem;align-items:center;margin-top:.4rem;font-size:.7rem;color:var(--faint)}
.blk .side select{width:auto;padding:.2rem .3rem;font-size:.72rem}
.blk img.thumb{width:100%;max-height:9rem;object-fit:contain;border:1.5px solid var(--ink);margin-bottom:.4rem;background:#f4f4f4}
#status{margin-top:.9rem;font-size:.8rem;min-height:1.3em}
#status.err{color:var(--hot)} #status.ok{color:#0A7A3D}
.meta{font-size:.72rem;color:var(--faint);margin-top:.3rem}
.meta.warn{color:var(--hot)}
.gate{max-width:22rem}
.hint{font-size:.72rem;color:var(--faint);margin:.4rem 0 0}
</style>
</head>
<body>
<div class="wrap">

<div id="gate" class="gate" hidden>
  <h1>Udgiv</h1>
  <p class="sub">Indsæt din adgangsnøgle. Den huskes på denne enhed.</p>
  <label><span>Adgangsnøgle</span><input type="password" id="token" autocomplete="current-password"></label>
  <button type="button" id="unlock" class="wide">Lås op</button>
</div>

<form id="pub" hidden>
  <h1>Nyt indslag</h1>
  <p class="sub">Byg det af blokke. Rækkefølgen er den, du ser her.</p>

  <fieldset>
    <legend>Hvad</legend>
    <label><span>Titel</span><input type="text" name="title" maxlength="120" required placeholder="Nattoget over Brenner"></label>
    <div class="row">
      <label><span>Type</span>
        <select name="kind" id="kind">
          <option value="episode">Episode med lyd</option>
          <option value="note">Kort note uden lyd</option>
        </select>
      </label>
      <label style="flex:0 0 6rem"><span>Nr. (valgfrit)</span><input type="number" name="day_number" min="1" inputmode="numeric"></label>
    </div>
    <label><span>Sted (valgfrit)</span><input type="text" name="place" maxlength="80" placeholder="Innsbruck → Verona"></label>
    <div class="row">
      <label><span>Fra dato</span><input type="date" name="date" required></label>
      <label><span>Til dato (valgfrit)</span><input type="date" name="date_end"></label>
    </div>
    <p class="hint">Udfyld begge datoer, hvis indslaget dækker flere dage. Så skriver siden fx "30.–31. august".</p>
  </fieldset>

  <fieldset id="audiofs">
    <legend>Lyd</legend>
    <label><span>Lydfil</span><input type="file" id="audio" accept="audio/*"></label>
    <div class="meta" id="ameta"></div>
  </fieldset>

  <fieldset>
    <legend>Indhold</legend>
    <div class="addbar">
      <button type="button" class="ghost" data-add="text">+ Tekst</button>
      <button type="button" class="ghost" data-add="note">+ Note</button>
      <button type="button" class="ghost" data-add="heading">+ Overskrift</button>
      <button type="button" class="ghost" data-add="quote">+ Citat</button>
      <button type="button" class="ghost" data-add="image">+ Billede</button>
    </div>
    <div id="blocks"></div>
    <p class="hint">Noter lægger sig ud i marginen på store skærme — vælg selv side.</p>
  </fieldset>

  <button type="submit" id="go" class="wide">Udgiv</button>
  <div id="status"></div>
  <p style="margin-top:1.5rem"><button type="button" class="ghost" id="forget">Glem nøglen på denne enhed</button></p>
</form>

</div>
<script>
var KEY = 'audioblog_token';
var gate = document.getElementById('gate');
var form = document.getElementById('pub');
var statusEl = document.getElementById('status');
var listEl = document.getElementById('blocks');
var blocks = [];
var audioDuration = null;

function token(){ try { return localStorage.getItem(KEY) || ''; } catch(e){ return ''; } }
function show(){ if (token()) { gate.hidden = true; form.hidden = false; } else { gate.hidden = false; form.hidden = true; } }
show();

document.getElementById('unlock').addEventListener('click', function(){
  var v = document.getElementById('token').value.trim();
  if (!v) return;
  try { localStorage.setItem(KEY, v); } catch(e){}
  show();
});
document.getElementById('forget').addEventListener('click', function(){
  try { localStorage.removeItem(KEY); } catch(e){}
  location.reload();
});

var d = new Date();
form.date.value = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');

document.getElementById('kind').addEventListener('change', function(){
  document.getElementById('audiofs').style.display = this.value === 'note' ? 'none' : '';
});

/* ---- lyd ---- */
document.getElementById('audio').addEventListener('change', function(e){
  var f = e.target.files[0], meta = document.getElementById('ameta');
  audioDuration = null; meta.className = 'meta';
  if (!f) { meta.textContent = ''; return; }
  var mb = f.size / 1048576;
  var txt = mb.toFixed(1) + ' MB';
  if (mb > 20) {
    meta.className = 'meta warn';
    txt += ' — det er stort. Er det en WAV? Eksportér som MP3 i stedet, så bliver den 10-15 gange mindre.';
  }
  var a = new Audio();
  a.preload = 'metadata';
  a.onloadedmetadata = function(){
    URL.revokeObjectURL(a.src);
    if (isFinite(a.duration)) {
      audioDuration = Math.round(a.duration);
      meta.textContent = txt + ' · ' + Math.floor(audioDuration/60) + ':' + String(audioDuration%60).padStart(2,'0');
    } else { meta.textContent = txt; }
  };
  a.onerror = function(){ meta.textContent = txt; };
  a.src = URL.createObjectURL(f);
});

/* ---- billedskalering ---- */
function shrink(file, maxSide){
  return new Promise(function(resolve, reject){
    var img = new Image();
    img.onload = function(){
      URL.revokeObjectURL(img.src);
      var w = img.naturalWidth, h = img.naturalHeight;
      var s = Math.min(1, maxSide / Math.max(w, h));
      w = Math.round(w*s); h = Math.round(h*s);
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      c.toBlob(function(b){ b ? resolve({blob:b,width:w,height:h}) : reject(new Error('Kunne ikke behandle billedet')); }, 'image/jpeg', 0.82);
    };
    img.onerror = function(){ reject(new Error('Kunne ikke læse billedet')); };
    img.src = URL.createObjectURL(file);
  });
}

/* ---- blokke ---- */
var LABELS = { text:'Tekst', note:'Note', heading:'Overskrift', quote:'Citat', image:'Billede' };

document.querySelectorAll('[data-add]').forEach(function(b){
  b.addEventListener('click', function(){
    blocks.push({ type: b.dataset.add, content:'', caption:'', side:'', file:null, width:null, height:null });
    render();
  });
});

function render(){
  listEl.innerHTML = '';
  blocks.forEach(function(b, i){
    var el = document.createElement('div');
    el.className = 'blk' + (b.type === 'note' ? ' note' : '');

    var top = document.createElement('div');
    top.className = 'blk-top';
    var kind = document.createElement('span');
    kind.className = 'blk-kind'; kind.textContent = LABELS[b.type] || b.type;
    top.appendChild(kind);
    [['↑',-1],['↓',1]].forEach(function(pair){
      var mv = document.createElement('button');
      mv.type = 'button'; mv.className = 'ghost'; mv.textContent = pair[0];
      mv.disabled = (pair[1] < 0 && i === 0) || (pair[1] > 0 && i === blocks.length-1);
      mv.addEventListener('click', function(){
        var j = i + pair[1];
        var t = blocks[i]; blocks[i] = blocks[j]; blocks[j] = t; render();
      });
      top.appendChild(mv);
    });
    var del = document.createElement('button');
    del.type = 'button'; del.className = 'ghost'; del.textContent = '✕';
    del.addEventListener('click', function(){ blocks.splice(i,1); render(); });
    top.appendChild(del);
    el.appendChild(top);

    if (b.type === 'image') {
      if (b.file) {
        var th = document.createElement('img');
        th.className = 'thumb'; th.src = URL.createObjectURL(b.file);
        el.appendChild(th);
      }
      var fin = document.createElement('input');
      fin.type = 'file'; fin.accept = 'image/*';
      fin.addEventListener('change', async function(){
        if (!this.files[0]) return;
        try {
          var out = await shrink(this.files[0], 1600);
          b.file = out.blob; b.width = out.width; b.height = out.height;
          render();
        } catch (err) { alert(err.message); }
      });
      el.appendChild(fin);
      var cap = document.createElement('input');
      cap.type = 'text'; cap.placeholder = 'Billedtekst (valgfri)'; cap.value = b.caption; cap.maxLength = 160;
      cap.style.marginTop = '.4rem';
      cap.addEventListener('input', function(){ b.caption = this.value; });
      el.appendChild(cap);
    } else if (b.type === 'heading' || b.type === 'quote') {
      var inp = document.createElement('input');
      inp.type = 'text'; inp.value = b.content; inp.maxLength = 200;
      inp.placeholder = b.type === 'heading' ? 'Overskrift' : 'Citat';
      inp.addEventListener('input', function(){ b.content = this.value; });
      el.appendChild(inp);
    } else {
      var ta = document.createElement('textarea');
      ta.value = b.content;
      ta.placeholder = b.type === 'note' ? 'En lille note eller idé…' : 'Skriv…';
      ta.addEventListener('input', function(){ b.content = this.value; });
      el.appendChild(ta);
    }

    if (b.type === 'note' || b.type === 'image') {
      var wrap = document.createElement('div');
      wrap.className = 'side';
      var lbl = document.createElement('span'); lbl.textContent = 'Placering:';
      var sel = document.createElement('select');
      var opts = b.type === 'note'
        ? [['','Automatisk'],['left','I venstre margin'],['right','I højre margin']]
        : [['','Normal bredde'],['wide','Bred, ud over spalten']];
      opts.forEach(function(o){
        var op = document.createElement('option'); op.value = o[0]; op.textContent = o[1];
        if (b.side === o[0]) op.selected = true;
        sel.appendChild(op);
      });
      sel.addEventListener('change', function(){ b.side = this.value; });
      wrap.appendChild(lbl); wrap.appendChild(sel);
      el.appendChild(wrap);
    }

    listEl.appendChild(el);
  });
}
render();

/* ---- send ---- */
form.addEventListener('submit', async function(e){
  e.preventDefault();
  var btn = document.getElementById('go');
  var kind = document.getElementById('kind').value;
  var af = document.getElementById('audio').files[0];

  if (kind === 'episode' && !af) {
    statusEl.className = 'err';
    statusEl.textContent = 'Vælg en lydfil, eller skift type til "Kort note uden lyd".';
    return;
  }

  btn.disabled = true; statusEl.className = ''; statusEl.textContent = 'uploader…';

  var fd = new FormData();
  ['title','place','date','date_end','day_number','kind'].forEach(function(n){
    if (form[n]) fd.append(n, form[n].value);
  });
  if (audioDuration) fd.append('duration', String(audioDuration));
  if (kind === 'episode' && af) fd.append('audio', af, af.name);

  var spec = [], fileIndex = 0;
  blocks.forEach(function(b){
    if (b.type === 'image') {
      if (!b.file) return;
      fd.append('blockfile', b.file, 'billede-' + (fileIndex+1) + '.jpg');
      spec.push({ type:'image', caption:b.caption, side:b.side, fileIndex:fileIndex, width:b.width, height:b.height });
      fileIndex++;
    } else if (String(b.content||'').trim()) {
      spec.push({ type:b.type, content:b.content, side:b.side });
    }
  });
  fd.append('blocks', JSON.stringify(spec));

  try {
    var res = await fetch('/api/episodes', {
      method:'POST', headers:{ 'authorization':'Bearer ' + token() }, body: fd
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload mislykkedes');
    statusEl.className = 'ok';
    statusEl.innerHTML = 'Udgivet. <a href="/dag/' + data.slug + '">Se det</a>';
    form.reset(); blocks = []; audioDuration = null; render();
    document.getElementById('ameta').textContent = '';
    form.date.value = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  } catch (err) {
    statusEl.className = 'err'; statusEl.textContent = err.message;
  } finally { btn.disabled = false; }
});
</script>
</body>
</html>`
}

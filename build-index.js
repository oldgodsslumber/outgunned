// build-index.js — regenerates index.html from outgunned.html.
//
// Run with: `node build-index.js`
//
// index.html = outgunned.html + 3 injections:
//   1. Firebase SDK script tags + FIREBASE_CONFIG block (above og-data.js)
//   2. og-mp.js script tag (after og-rules.js)
//   3. og-app-mp.js script tag + boot call (before final </body>)
//
// Re-run this whenever you edit outgunned.html so the multiplayer page picks
// up the same UI. The shared content (og-data.js / og-rules.js) flows to both
// pages automatically and never needs rebuilding.
const fs=require('fs');
const crypto=require('crypto');
let html=fs.readFileSync('outgunned.html','utf8');

html = html.replace('<title>Outgunned</title>','<title>Outgunned — Multiplayer</title>');

// (Cache-busting query strings are appended at the very end so that the
// script-tag injections below match their literal anchors.)
function fileHash(p){
  try{return crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex').slice(0,8);}
  catch(_){return null;}
}

// Carry over the existing FIREBASE_CONFIG from index.html if it has been
// filled in — otherwise rebuilds would wipe the user's project credentials
// every time and the live site would revert to "Multiplayer not configured".
let CONFIG_OVERRIDE = null;
try{
  const prev = fs.readFileSync('index.html','utf8');
  const m = prev.match(/window\.FIREBASE_CONFIG\s*=\s*\{[\s\S]*?\};/);
  if(m && /apiKey:\s*"[^"]+"/.test(m[0])) CONFIG_OVERRIDE = m[0];
}catch(_){ /* no prior index.html — first build, use the empty template */ }

const FIREBASE_BLOCK = [
'<!-- Firebase SDK (compat builds — no bundler needed) -->',
'<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>',
'<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>',
'<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-database-compat.js"></script>',
'<script>',
'// ====================================================================',
'// FIREBASE_CONFIG — paste your project\'s web config from the Firebase',
'// console here. Leave as-is to see setup instructions on first load.',
'// ====================================================================',
'window.FIREBASE_CONFIG = {',
'  apiKey:            "",',
'  authDomain:        "",',
'  databaseURL:       "",',
'  projectId:         "",',
'  storageBucket:     "",',
'  messagingSenderId: "",',
'  appId:             ""',
'};',
'</script>',
].join('\n');
html = html.replace('<script src="og-data.js"></script>', FIREBASE_BLOCK+'\n<script src="og-data.js"></script>');
if(CONFIG_OVERRIDE){
  html = html.replace(/window\.FIREBASE_CONFIG\s*=\s*\{[\s\S]*?\};/, CONFIG_OVERRIDE);
  console.log('Preserved existing FIREBASE_CONFIG values from prior index.html');
}
html = html.replace('<script src="og-rules.js"></script>',
  '<script src="og-rules.js"></script>\n<script src="og-mp.js"></script>');

const BOOT = [
'<script src="og-app-mp.js" defer></script>',
'<script>document.addEventListener(\'DOMContentLoaded\',function(){',
'  if(typeof OG_BOOT_MP===\'function\') OG_BOOT_MP(window.FIREBASE_CONFIG);',
'});</script>',
].join('\n');
// Replace the LAST </body> (the real document end). Earlier matches live inside
// template literals in buildHUDHtml/printCharSheet and must not be touched.
const lastBody = html.lastIndexOf('</body>');
html = html.slice(0,lastBody) + BOOT + '\n' + html.slice(lastBody);

// Cache-bust the external JS we ship from this repo. GitHub Pages + browsers
// cache these aggressively; without a versioned query string a redeploy can
// leave the page running its old code paths even when the HTML itself is
// fresh. We append the first 8 hex chars of each file's SHA-1, so only the
// files that actually changed get a new URL — unchanged scripts keep their
// long-lived cache entry. Firebase CDN scripts (absolute https://) are left
// alone since they're immutable.
['og-data.js','og-rules.js','og-mp.js','og-app-mp.js'].forEach(name=>{
  const v=fileHash(name);if(!v)return;
  const re=new RegExp('<script (?:defer )?src="'+name.replace(/\./g,'\\.')+'"','g');
  html=html.replace(re,m=>m.replace('"'+name+'"','"'+name+'?v='+v+'"'));
});

fs.writeFileSync('index.html', html);
console.log('Wrote index.html ('+fs.statSync('index.html').size+' bytes)');

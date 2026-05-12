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
let html=fs.readFileSync('outgunned.html','utf8');

html = html.replace('<title>Outgunned</title>','<title>Outgunned — Multiplayer</title>');

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

fs.writeFileSync('index.html', html);
console.log('Wrote index.html ('+fs.statSync('index.html').size+' bytes)');

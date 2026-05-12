// ============================================================
// og-rules.js — shared Outgunned helpers
// ============================================================
// Loaded AFTER og-data.js. Provides book-gating, terminology substitution,
// state factories, persistence-key helper, and dice math.
//
// Stateful helpers (getCtx/getCoreBook/getInclude/bookHas/...) reference the
// global identifier `S`, which the host page declares with `let S = defaultState()`
// at top-level script scope. Top-level `let` bindings are visible to subsequent
// scripts via unqualified lookup, so these helpers work without explicit imports.
// ============================================================

// --- Book registry helpers ---
function selectableBooks(){return Object.keys(BOOK_META).filter(b=>BOOK_META[b].selectable);}
function bookBadge(book){return BOOK_META[book]?.badge||'badge-core';}
function bookLabel(book){return BOOK_META[book]?.label||book;}
function bookShort(book){return BOOK_META[book]?.shortCode||(book||'').toUpperCase();}
function bookGame(book){return BOOK_META[book]?.game||book;}
// Legacy: kept for any old callsites; routes through bookHas. `games` arg ignored.
function bookEnabled(book){return bookHas(book,'roles');}

// --- Terminology substitution (per-book overrides) ---
function activeTerms(){return Object.assign({},DEFAULT_TERMS,BOOK_META[getCoreBook()]?.terms||{});}
// Resolve a single mechanic name. Use this for UI labels.
function term(key){
  const t=activeTerms();
  return (t[key]!=null)?t[key]:key;
}
// Apply all terminology swaps from the active core book to a string.
// Word-boundary substitution: 'Adrenaline' swaps but 'Powerless' / 'Power Tier' stay intact.
function termSubst(text){
  if(text==null)return text;
  const t=activeTerms();
  const keys=Object.keys(t);
  if(!keys.length)return text;
  let out=String(text);
  keys.forEach(k=>{
    let esc='';
    for(let i=0;i<k.length;i++){const c=k.charAt(i);esc+=(/[a-zA-Z0-9]/.test(c)?c:'\\'+c);}
    out=out.replace(new RegExp('\\b'+esc+'\\b','g'),t[k]);
  });
  return out;
}
// Legacy alias for the Adrenaline label.
function adrenalineName(){return term('Adrenaline');}

// --- Entry visibility & scope helpers ---
function entryBooks(entry){
  if(!entry)return [];
  if(Array.isArray(entry.books)&&entry.books.length)return entry.books;
  if(entry.book)return [entry.book];
  return [];
}
// Is this entry (feat / enemy feat / SA / etc.) currently available under any
// of the books that contribute the given category? Single source of truth for
// "should this card show up in the picker?"
function entryInScope(entry,category){
  const books=entryBooks(entry);
  if(!books.length)return true;
  return books.some(b=>bookHas(b,category));
}
// Convenience alias
function featInScope(f,category){return entryInScope(f,category||'feats');}
// Render small badges for each of an entry's books except 'core' (which is the default).
// Multi-book feats display all of their non-core tags so players know the feat counts
// against either book's catalog.
function entryBadgesHtml(entry){
  const books=entryBooks(entry).filter(b=>b!=='core');
  if(!books.length)return '';
  return books.map(b=>`<span class="badge ${bookBadge(b)}">${bookLabel(b)}</span>`).join('');
}

// --- Adrenaline-cost detection / chip ---
function hasAdrCost(entry){
  if(!entry)return false;
  if(entry.adr===true)return true;
  const d=entry.desc;if(!d)return false;
  // The rulebook uses several phrasings for an Adrenaline-spending activated ability:
  //   "Spend 1 Adrenaline to …"        — feats with a fixed cost
  //   "Spend Adrenaline equal to …"    — scaled cost (Foresight)
  //   "1 Adrenaline: Effect"           — colon-led shorthand (Mind Powers, Teleportation)
  //   "(1 Adrenaline)"                 — parenthetical inline (Super-Speed In a Flash!)
  // Phrasings deliberately ignored so we don't false-positive on:
  //   "Start with 2 Adrenaline" / "Recover Adrenaline" / "gain 1 Adrenaline" — passive gains
  //   "you don't need to spend Adrenaline" / "without spending Adrenaline" — explicit no-cost
  // The numeric prefix or "equal" qualifier prevents matching generic "spend Adrenaline"
  // phrases which can appear in either positive or negative context.
  return /\bspend(?:s)?\s+\d+\s+adrenaline\b/i.test(d) ||
         /\bspend(?:s)?\s+adrenaline\s+equal\b/i.test(d) ||
         /\b\d+\s+adrenaline\s*:/i.test(d) ||
         /\(\d+\s*adrenaline\)/i.test(d);
}
// Small chip rendered next to a feat/superpower header when it has an activated
// resource cost. The ⚡ glyph stands in for Adrenaline/Power universally.
function adrCostChip(){
  return `<span class="adr-cost">Spends ⚡</span>`;
}

// --- State accessors (reads global `S`) ---
function getCtx(){return S.char||S.creation||{coreBook:'core',include:{}};}
function getCoreBook(){return getCtx().coreBook||'core';}
function getInclude(){return getCtx().include||{};}
function bookHas(book,category){
  // Resolve content book (e.g. 'special') to its game
  const game=BOOK_META[book]?.game||book;
  if(game===getCoreBook())return true;
  return !!(getInclude()[game]?.[category]);
}
function isOSHCore(){return getCoreBook()==='osh';}

// --- Conditions / Include / Creation / State factories ---
function conditionsForBook(book){
  const key=BOOK_META[book]?.conditions;
  if(!key)return [];
  const lookup={WOK_CONDITIONS:typeof WOK_CONDITIONS!=='undefined'?WOK_CONDITIONS:[],
                OSH_CONDITIONS:typeof OSH_CONDITIONS!=='undefined'?OSH_CONDITIONS:[]};
  return lookup[key]||[];
}
// Build the per-character condition flags from every book whose 'roles' content is active.
function buildDefaultConditions(){
  let all=[...CONDITIONS];
  Object.keys(BOOK_META).forEach(b=>{
    if(b===getCoreBook())return; // core conditions come from CONDITIONS itself
    if(bookHas(b,'roles'))all=all.concat(conditionsForBook(b));
  });
  // Also include core book's own conditions if it has any registered (future-proof for non-Outgunned core)
  const coreExtra=conditionsForBook(getCoreBook());
  if(coreExtra.length)all=all.concat(coreExtra);
  // De-dupe by id
  const seen=new Set(),out=[];
  all.forEach(c=>{if(!seen.has(c.id)){seen.add(c.id);out.push(c);}});
  const obj={};out.forEach(c=>obj[c.id]=false);return obj;
}
// Build the per-creation 'include' map from every selectable, non-core book.
function defaultInclude(){
  const r={};
  selectableBooks().forEach(b=>{if(b!=='core')r[b]={roles:false,feats:false,scenes:false};});
  return r;
}
function defaultCreation(){
  return {step:0,name:'',job:'',age:'Adult',catchphrase:'',flaw:'',roleId:null,tropeId:null,tropeAttr:null,freeSkills:{},roleFeatsSelected:[],tropeFeatsSelected:[],
    coreBook:'core',include:defaultInclude(),
    solo:false,soloAttr:null,soloSkills:{},
    originId:null,superpowerVariants:{},powerTier:null,
    tropeId2:null,tropeAttr2:null,tropeFeatsSelected2:[]};
}
function defaultState(){
  return {
    char:null,
    creation:defaultCreation(),
    npcs:[],
    activeEnemies:[],
    chase:{active:false,needMax:12,speed:1,filled:0,round:1,log:[]},
    hunt:{active:false,needMax:10,kill:1,filled:0,turn:1,target:'',log:[]},
    assemble:{active:false,needMax:12,filled:0,teamwork:1,turn:1,countdown:0,powerBoxes:[],log:[]},
    timeout:{active:false,actions:[]},
    shards:{change:'',force:'',mind:'',space:'',spirit:'',time:''},
    dice:null,
    notes:[],
    heat:0,
    villain:{name:'',evilPlan:'',strongSpots:[],weakSpots:'',herald:'',appt6:'',appt9:'',appt12:''}
  };
}

// --- Persistence key ---
function slotKey(n){return 'og_slot_'+n;}

// --- Dice math (pure) ---
function rollN(n){return Array.from({length:n},()=>Math.floor(Math.random()*6)+1);}

function bestMatch(dice){
  const c={};dice.forEach(d=>c[d]=(c[d]||0)+1);
  let bc=0,bf=0;
  for(const[f,ct]of Object.entries(c)){
    if(ct>bc||(ct===bc&&+f>bf)){bc=ct;bf=+f;}
  }
  return{face:bf,count:bc};
}

function successLevel(matchCount){
  if(matchCount>=6)return{level:'JACKPOT!',lvlNum:5,color:'var(--gold)'};
  if(matchCount>=5)return{level:'IMPOSSIBLE',lvlNum:4,color:'var(--purple)'};
  if(matchCount>=4)return{level:'EXTREME',lvlNum:3,color:'var(--red)'};
  if(matchCount>=3)return{level:'CRITICAL',lvlNum:2,color:'var(--accent)'};
  if(matchCount>=2)return{level:'BASIC SUCCESS',lvlNum:1,color:'var(--green)'};
  return{level:'FAILURE',lvlNum:0,color:'var(--muted)'};
}

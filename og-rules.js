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
function getInclude(){
  // Lazily migrate so a saved S.char created before a new include flag (e.g.
  // 'enemies', added 2026-05-16) gets the back-fill from its older sibling
  // flag. Without this, the WoK/OSH enemy roster vanishes for any character
  // that finished creation before the migration shipped.
  const ctx=getCtx();
  if(ctx.include && typeof ensureIncludeShape==='function')ensureIncludeShape(ctx.include);
  return ctx.include||{};
}
function bookHas(book,category){
  // Resolve content book (e.g. 'special') to its game
  const game=BOOK_META[book]?.game||book;
  if(game===getCoreBook())return true;
  return !!(getInclude()[game]?.[category]);
}
function isOSHCore(){return getCoreBook()==='osh';}
// "Is WoK currency (Gold) relevant here?" — true when WoK is the core book, or
// when any WoK content (roles, items, feats, scenes) is included. Gold buys
// WoK gear, so visibility shouldn't be gated on roles alone (a Core game that
// pulls in WoK items still needs the Gold tile).
function isWoKActive(){
  if(getCoreBook()==='wok')return true;
  const inc=getInclude().wok;
  if(!inc)return false;
  return !!(inc.roles||inc.tropes||inc.feats||inc.items||inc.scenes||inc.enemies);
}

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
  selectableBooks().forEach(b=>{if(b!=='core')r[b]={roles:false,tropes:false,feats:false,items:false,scenes:false,enemies:false};});
  return r;
}
// Normalize an include map loaded from storage / MP sync that may pre-date
// newer content-type flags (items, tropes, enemies). Mutates in place and returns it.
function ensureIncludeShape(inc){
  if(!inc)return defaultInclude();
  selectableBooks().forEach(b=>{
    if(b==='core')return;
    if(!inc[b]){inc[b]={roles:false,tropes:false,feats:false,items:false,scenes:false,enemies:false};return;}
    if(!('items' in inc[b]))inc[b].items=false;
    // Tropes used to ride the roles flag. Inherit on first migration so a
    // user who previously enabled "Roles & Tropes" doesn't lose their tropes.
    if(!('tropes' in inc[b]))inc[b].tropes=!!inc[b].roles;
    // Enemies used to ride the feats flag (renderDeployModal gated enemy
    // feats on hero feats). Inherit so prior parties keep their enemy roster.
    if(!('enemies' in inc[b]))inc[b].enemies=!!inc[b].feats;
  });
  return inc;
}
function defaultCreation(){
  return {step:0,name:'',job:'',age:'Adult',catchphrase:'',flaw:'',roleId:null,tropeId:null,tropeAttr:null,freeSkills:{},roleFeatsSelected:[],tropeFeatsSelected:[],
    coreBook:'core',include:defaultInclude(),
    solo:false,soloAttr:null,soloSkills:{},
    originId:null,superpowerVariants:{},powerTier:null,
    tropeId2:null,tropeAttr2:null,tropeFeatsSelected2:[],
    loadout:{items:[],notes:''},gearList:''};
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

// --- Items / Loadout helpers ---
function itemsInScope(){
  if(typeof ITEMS==='undefined')return[];
  return ITEMS.filter(i=>entryInScope(i,'items'));
}
function itemById(id){
  if(typeof ITEMS==='undefined')return null;
  return ITEMS.find(i=>i.id===id)||null;
}
function itemFeat(id){
  if(typeof ITEM_FEATS==='undefined')return null;
  return ITEM_FEATS.find(f=>f.id===id)||null;
}
function itemFeatLabel(id){const f=itemFeat(id);return f?f.name:id;}
function itemFeatTooltip(id){const f=itemFeat(id);return f?termSubst(f.desc):id;}
function isFirearm(item){
  if(!item||item.category!=='gun')return false;
  if(item.feats&&item.feats.indexOf('single_shot')>=0)return false;
  return item.mag!=null||(item.feats&&item.feats.indexOf('firearm')>=0);
}
// Starting cash budget for the catalog. OSH = 4$. Core/WoK = 1$. Solo adds 2$.
// Cash Flow feat adds 2$.
function startingCashBudget(){
  const c=(typeof S!=='undefined'&&S&&S.creation)?S.creation:null;
  const core=c?c.coreBook:'core';
  let budget=(core==='osh')?4:1;
  if(c&&c.solo)budget+=2;
  const picked=[].concat(c&&c.roleFeatsSelected||[], c&&c.tropeFeatsSelected||[], c&&c.tropeFeatsSelected2||[]);
  if(picked.some(n=>typeof n==='string'&&/cash\s*flow/i.test(n)))budget+=2;
  if(typeof FEATS!=='undefined'){
    picked.forEach(n=>{
      const f=FEATS.find(ff=>ff.name===n);
      const bonus=f&&f.creationEffects&&f.creationEffects.gearBudgetBonus;
      if(bonus)budget+=bonus;
    });
  }
  return budget;
}
// Sum of cost*qty across the loadout entries. Granted items (free starting
// gear from a role) are excluded since they don't count toward the budget.
function loadoutSpent(items){
  if(!items||!items.length)return 0;
  return items.reduce((s,e)=>{
    if(e.granted)return s;
    const it=itemById(e.itemId);
    return s+(it?it.cost*(e.qty||1):0);
  },0);
}
// Format a range modifier cell ('X', '+1G', 0, +1, -2…)
function fmtRange(v){
  if(v==null)return'—';
  if(typeof v==='string')return v;
  if(v>0)return'+'+v;
  return String(v);
}
// Look up the structured starting gear for a role id.
function roleStartingGear(roleId){
  if(typeof ROLE_STARTING_GEAR==='undefined')return null;
  return ROLE_STARTING_GEAR[roleId]||null;
}
// Does this item satisfy a role-gear pick slot's match spec?
function itemMatchesSlot(item,match){
  if(!item||!match)return false;
  if(match.kind==='cost'){
    if(item.cost>match.max)return false;
    if(match.category&&item.category!==match.category)return false;
    return true;
  }
  if(match.kind==='category'){
    if(item.category!==match.category)return false;
    if(match.max!=null&&item.cost>match.max)return false;
    return true;
  }
  if(match.kind==='oneOf'){
    return (match.ids||[]).indexOf(item.id)>=0;
  }
  return false;
}
// Display helper for a slot's match constraint (used in the catalog hint).
function describeSlotMatch(match){
  if(!match)return '';
  if(match.kind==='cost')return 'Up to '+match.max+'$'+(match.category?' '+match.category:'');
  if(match.kind==='category')return (match.category||'item')+(match.max!=null?` up to ${match.max}$`:'');
  if(match.kind==='oneOf')return 'One of: '+(match.ids||[]).map(id=>{const it=itemById(id);return it?it.name:id;}).join(', ');
  return '';
}

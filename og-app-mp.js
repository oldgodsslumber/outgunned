// ============================================================
// og-app-mp.js — Multiplayer overlay for the Outgunned app
// ============================================================
// Loaded by index.html AFTER the main inline app script (via defer).
//
// What this file does:
//   1. Boots Firebase via MP.init(FIREBASE_CONFIG) (set in index.html).
//   2. Replaces the offline slot-picker with a Lobby screen.
//   3. When the user joins/creates a party:
//        - subscribes to all party data via MP.bind()
//        - keeps S in sync with the remote state
//        - wraps key mutator functions (save / doRoll / addNote / enemy ops)
//          so local edits flow into Firebase
//        - hides the Enemies *tab* for non-Director players, but renders a
//          read-only enemy strip on the Dice screen for everyone
//        - shows a live roll-feed and attributed notes
//   4. Offline button → falls back to the original offline app behavior.
//
// Anything not wrapped here continues to work exactly as in outgunned.html.
// New expansions added to og-data.js / og-rules.js work in both modes.
// ============================================================

(function(){
  'use strict';

  // ---- Public boot hook ---------------------------------------------------
  // index.html calls window.OG_BOOT_MP(config) once on page load.
  window.OG_BOOT_MP = function(firebaseConfig){
    if(!firebaseConfig || !firebaseConfig.apiKey){
      _showConfigHelp();
      return;
    }
    try{ MP.init(firebaseConfig); }
    catch(e){ alert('Failed to initialize Firebase: '+e.message); return; }
    _hideOfflineEntry();          // suppress the slot modal until lobby decides
    _installCreationStepWrap();   // must wrap before any picker renders
    _installSlotModalWrap();      // adds "Switch to online" inside slot modal in offline mode
    _renderLobbyShell();
    MP.onAuth(_onAuth);
  };

  // ---- Internal state -----------------------------------------------------
  let inParty = false;            // joined a party, syncing
  let offlineMode = false;        // user clicked "Play offline"
  let myCharId = null;            // charId we're using inside the party
  let lastRemote = {              // last seen remote state per subtree
    chars:{}, members:{}, npcs:{}, enemies:{}, notes:{}, meta:null, rolls:[], scenes:null
  };
  let rollFeed = [];              // local cache of last-12 rolls for the dice-page render
  let _lobbyCreationHost = null;  // when set, renderCreationStep paints into this node instead of #hero-creation

  // Renders the offline "Select Your Games" step into the lobby host. Strips
  // the trailing "Continue →" button (the lobby uses its own Create button).
  function _renderLobbyPicker(){
    if(!_lobbyCreationHost) return;
    if(typeof renderStepGames!=='function') return;
    let html = renderStepGames();
    // The Continue button is the last button in the rendered fragment.
    html = html.replace(/<button class="btn btn-primary btn-full"[^>]*>[^<]*Continue[^<]*<\/button>\s*$/,'');
    _lobbyCreationHost.innerHTML = html;
    // Solo Play is a single-player option and shouldn't appear in the MP lobby.
    _lobbyCreationHost.querySelectorAll('[onclick="toggleSolo()"]').forEach(n=>n.remove());
    if(S.creation) S.creation.solo = false;
  }

  // Wraps renderCreationStep so that:
  //  1. When the lobby is showing the picker, re-renders go into the lobby host.
  //  2. When a Player is in a party, step 0 (game selection) is skipped — they
  //     inherit the Director's choices from meta.gameType/meta.books.
  let _rcsWrapped = false;
  function _installCreationStepWrap(){
    if(_rcsWrapped) return;
    const origRCS = window.renderCreationStep;
    if(typeof origRCS!=='function') return;
    _rcsWrapped = true;
    window.renderCreationStep = function(){
      // Self-heal: if the lobby host has been removed from the document but
      // its reference was never cleared (e.g. the lobby was dismissed by a
      // path we didn't anticipate), drop the stale ref so renders flow back
      // to #hero-creation. Without this, every click on the creation page
      // would render into a detached node and the UI would feel frozen.
      if(_lobbyCreationHost && !document.body.contains(_lobbyCreationHost)){
        _lobbyCreationHost = null;
      }
      if(_lobbyCreationHost){ _renderLobbyPicker(); return; }
      if(inParty && !MP.isDirector() && S.creation){
        const m = lastRemote.meta||{};
        if(m.gameType) S.creation.coreBook = m.gameType;
        // Prefer the full include map the Director stored at party creation;
        // fall back to the simple per-book boolean when older parties only have that.
        if(m.include){
          S.creation.include = JSON.parse(JSON.stringify(m.include));
        } else if(m.books){
          S.creation.include = S.creation.include || defaultInclude();
          Object.keys(m.books).forEach(b=>{
            if(b===S.creation.coreBook) return;
            const on = !!m.books[b];
            S.creation.include[b] = {roles:on, tropes:on, feats:on, items:on, scenes:on, enemies:on};
          });
        }
        if(typeof ensureIncludeShape==='function'){
          S.creation.include = ensureIncludeShape(S.creation.include);
        }
        if(m.powerTier) S.creation.powerTier = m.powerTier;
        if(S.creation.step===0) S.creation.step = 1;
      }
      const r = origRCS.apply(this, arguments);
      if(inParty && !MP.isDirector() && S.creation && S.creation.step<=1){
        document.querySelectorAll('#hero-creation button').forEach(b=>{
          if(b.textContent && b.textContent.indexOf('Back')>=0) b.style.display='none';
        });
      }
      return r;
    };
  }

  // Wrap renderSlotModal so the "Switch to online" button is re-injected
  // every time the slot list re-paints (e.g. after delete/select).
  let _rsmWrapped = false;
  function _installSlotModalWrap(){
    if(_rsmWrapped) return;
    const orig = window.renderSlotModal;
    if(typeof orig!=='function') return;
    _rsmWrapped = true;
    window.renderSlotModal = function(){
      const r = orig.apply(this, arguments);
      _injectSwitchToOnlineButton();
      return r;
    };
  }

  // ---- DOM helpers --------------------------------------------------------
  function el(tag, attrs, kids){
    const e = document.createElement(tag);
    if(attrs) for(const k in attrs){
      if(k==='style' && typeof attrs[k]==='object') Object.assign(e.style, attrs[k]);
      else if(k==='onclick') e.onclick = attrs[k];
      else if(k==='html') e.innerHTML = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    (kids||[]).forEach(k=> e.appendChild(typeof k==='string'?document.createTextNode(k):k));
    return e;
  }
  function $(id){return document.getElementById(id);}

  function _hideOfflineEntry(){
    // The offline init IIFE opens the slot modal — close it immediately so the
    // multiplayer lobby gets the first paint. (The slot modal still opens if
    // the user chooses "Play offline" below.)
    const m = $('slot-modal'); if(m) m.classList.remove('open');
  }

  function _showConfigHelp(){
    const root = el('div',{id:'og-mp-lobby',style:{
      position:'fixed', inset:'0', zIndex:'10000', background:'rgba(10,10,15,.96)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:'20px',
      fontFamily:'var(--font-body)', color:'var(--text)'
    }});
    root.appendChild(el('div',{style:{
      maxWidth:'520px', background:'var(--surface)', border:'1px solid var(--border)',
      borderRadius:'var(--radius-card)', padding:'24px'
    },html:`
      <h2 style="margin:0 0 12px 0;color:var(--accent)">Multiplayer not configured</h2>
      <p style="line-height:1.5;color:var(--muted)">To run the multiplayer page you need a Firebase project. Edit
        <code>index.html</code> and paste your Firebase web config into the
        <code>FIREBASE_CONFIG</code> object at the top of the file.</p>
      <p style="line-height:1.5;color:var(--muted);font-size:13px">
        1. Create a project at <em>console.firebase.google.com</em><br>
        2. Enable Authentication → Google provider<br>
        3. Enable Realtime Database (start in test mode, then paste the rules from <code>og-mp.js</code>)<br>
        4. Copy the web SDK config into <code>index.html</code></p>
      <div style="margin-top:18px;display:flex;gap:8px">
        <button class="btn" onclick="window.OG_GO_OFFLINE()">Play offline</button>
        <a class="btn btn-secondary" href="outgunned.html" style="text-decoration:none">Open offline app</a>
      </div>`}));
    document.body.appendChild(root);
  }

  // ---- Lobby --------------------------------------------------------------
  function _renderLobbyShell(){
    // Top bar with sign-in chip — visible at all times in MP mode.
    const bar = el('div',{id:'og-mp-bar',style:{
      position:'fixed', top:'0', right:'0', zIndex:'400', padding:'6px 10px',
      display:'flex', gap:'8px', alignItems:'center',
      background:'var(--surface)', borderLeft:'1px solid var(--border)',
      borderBottom:'1px solid var(--border)', borderBottomLeftRadius:'10px',
      fontSize:'12px'
    }});
    document.body.appendChild(bar);
    _refreshTopBar();

    // Full lobby overlay — only when not in a party and not offline.
    _showLobbyOverlay();
  }
  function _refreshTopBar(){
    const bar = $('og-mp-bar'); if(!bar) return;
    bar.innerHTML='';
    const u = MP.currentUser();
    if(offlineMode){
      // No persistent top-bar in offline mode — it covered the slot-picker.
      // The "Switch to online" affordance lives inside the slot modal instead
      // (see _injectSwitchToOnlineButton, wired to renderSlotModal).
      bar.style.display='none';
      _injectSwitchToOnlineButton();
      return;
    }
    bar.style.display='';
    if(!u){
      bar.appendChild(el('button',{class:'btn btn-primary',style:{padding:'4px 10px',fontSize:'11px'},onclick:()=>MP.signInGoogle().catch(e=>alert(e.message))},['Sign in with Google']));
      return;
    }
    bar.appendChild(el('span',{style:{color:'var(--muted)'}},[u.displayName||u.email||'You']));
    if(inParty){
      const p=MP.currentParty();
      bar.appendChild(el('span',{style:{color:'var(--accent)',fontWeight:'700'}},['#'+p.code]));
      if(MP.isDirector()) bar.appendChild(el('span',{class:'badge',style:{background:'var(--accent)',color:'#000',padding:'2px 6px',borderRadius:'4px',fontWeight:'700',fontSize:'10px'}},['DIRECTOR']));
      bar.appendChild(el('button',{class:'btn btn-secondary',style:{padding:'4px 8px',fontSize:'11px'},onclick:_leaveParty},['Leave']));
    } else {
      bar.appendChild(el('button',{class:'btn btn-secondary',style:{padding:'4px 8px',fontSize:'11px'},onclick:_showLobbyOverlay},['Open lobby']));
    }
    bar.appendChild(el('button',{class:'btn btn-secondary',style:{padding:'4px 8px',fontSize:'11px'},onclick:()=>MP.signOut()},['Sign out']));
  }

  // In offline mode, surface the "Switch to online" affordance INSIDE the
  // slot-modal (where the player is anyway) rather than as a persistent
  // top-right bar that overlapped the slot cards.
  function _injectSwitchToOnlineButton(){
    if(!offlineMode) return;
    const modal = document.getElementById('slot-modal'); if(!modal) return;
    if(modal.querySelector('#og-mp-switch-online-btn')) return;
    const inner = modal.firstElementChild || modal;
    const wrap = el('div',{id:'og-mp-switch-online-btn',style:{
      marginTop:'14px', paddingTop:'12px', borderTop:'1px solid var(--border)',
      display:'flex', alignItems:'center', justifyContent:'space-between', gap:'10px'
    }});
    wrap.appendChild(el('span',{style:{fontSize:'11px',color:'var(--muted)'}},['Currently in offline mode']));
    wrap.appendChild(el('button',{class:'btn btn-secondary',style:{fontSize:'12px',padding:'6px 12px'},onclick:_exitOfflineMode},['Switch to online']));
    inner.appendChild(wrap);
  }

  function _showLobbyOverlay(){
    if($('og-mp-lobby')) return;
    const root = el('div',{id:'og-mp-lobby',style:{
      position:'fixed', inset:'0', zIndex:'9000', background:'rgba(10,10,15,.96)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:'20px',
      fontFamily:'var(--font-body)', color:'var(--text)', overflow:'auto'
    }});
    const card = el('div',{style:{
      maxWidth:'540px', width:'100%', background:'var(--surface)',
      border:'1px solid var(--border)', borderRadius:'var(--radius-card)', padding:'24px'
    }});
    root.appendChild(card);
    document.body.appendChild(root);
    _renderLobbyContent(card);
  }
  function _closeLobbyOverlay(){
    const r = $('og-mp-lobby'); if(r) r.remove();
    // CRITICAL: drop the lobby's creation-host reference. Otherwise the
    // renderCreationStep wrap keeps routing renders to a detached DOM node
    // and #hero-creation never updates — so players land on the stale step 0
    // game-selection screen even after joining a party.
    _lobbyCreationHost = null;
  }

  async function _renderLobbyContent(card){
    card.innerHTML='';
    const u = MP.currentUser();
    card.appendChild(el('h2',{style:{margin:'0 0 6px 0',color:'var(--accent)'}},['OUTGUNNED']));
    card.appendChild(el('div',{style:{color:'var(--muted)',fontSize:'13px',marginBottom:'20px'}},['Multiplayer Table']));

    if(!u){
      card.appendChild(el('p',{style:{lineHeight:'1.5',marginBottom:'18px',color:'var(--muted)'}},
        ['Sign in to create or join a party. Your character library syncs across devices. You can also play solo offline.']));
      const row=el('div',{style:{display:'flex',flexDirection:'column',gap:'10px'}});
      row.appendChild(el('button',{class:'btn btn-primary',style:{padding:'12px'},onclick:()=>MP.signInGoogle().catch(e=>alert(e.message))},['Sign in with Google']));
      row.appendChild(el('button',{class:'btn btn-secondary',onclick:_enterOfflineMode},['Play offline']));
      card.appendChild(row);
      return;
    }

    // Signed-in view: existing parties, plus create/join.
    let parties=[];
    try{ parties = await MP.listMyParties(); }catch(e){ /* network may be down */ }
    // Self-clean orphan entries: if the underlying party has been deleted by
    // its Director, drop our saved-list row silently so we don't try to
    // rejoin a ghost.
    if(parties.length){
      const alive = [];
      await Promise.all(parties.map(async p=>{
        const ok = await MP.partyExists(p.code);
        if(ok) alive.push(p);
        else MP.forgetParty(p.code).catch(()=>{});
      }));
      parties = alive;
    }
    if(parties.length){
      card.appendChild(el('h3',{style:{margin:'18px 0 8px 0',fontSize:'13px',letterSpacing:'2px',color:'var(--muted)',textTransform:'uppercase'}},['Your parties']));
      const list = el('div',{style:{display:'flex',flexDirection:'column',gap:'6px',marginBottom:'14px'}});
      parties.forEach(p=>{
        const isDirector = p.role==='director';
        const wrap = el('div',{style:{display:'flex',gap:'4px'}});
        const row=el('button',{class:'btn btn-secondary',style:{flex:'1',justifyContent:'space-between',display:'flex',padding:'10px 12px',textAlign:'left'},onclick:()=>_joinByCode(p.code)});
        row.appendChild(el('span',{},[p.title||'(untitled)','  ',el('span',{style:{color:'var(--muted)',fontSize:'11px'}},['#'+p.code])]));
        row.appendChild(el('span',{style:{color:'var(--accent)',fontSize:'11px'}},[isDirector?'Director':'Player']));
        wrap.appendChild(row);
        // For Directors, the × button tears down the WHOLE party (affects all
        // players). For Players, × just removes the row from their own list.
        wrap.appendChild(el('button',{
          class:'btn btn-secondary',
          title: isDirector ? 'Delete this party for ALL players' : 'Remove from my list',
          style:{padding:'10px 10px',color:isDirector?'var(--red)':'var(--muted)'},
          onclick:async()=>{
            const prompt = isDirector
              ? 'Delete "'+(p.title||'this party')+'" for EVERYONE?\n\nThis cannot be undone — all players will lose access and the 4-digit code will be released.'
              : 'Remove "'+(p.title||'this party')+'" from your list? You can rejoin with the code.';
            if(!confirm(prompt)) return;
            try{
              if(isDirector) await MP.deleteParty(p.code);
              else           await MP.forgetParty(p.code);
            }catch(e){ alert(e.message); }
            const r = $('og-mp-lobby'); if(r) _renderLobbyContent(r.firstChild);
          }
        },[isDirector?'Delete':'×']));
        list.appendChild(wrap);
      });
      card.appendChild(list);
    }

    // Create new party — collapsible. The book/expansion picker is the SAME
    // renderStepGames() panel used in the offline character-creation flow, so
    // future expansions appear automatically and the layout always matches.
    const newWrap = el('details',{style:{margin:'14px 0',padding:'12px',background:'var(--surface2)',borderRadius:'6px'}});
    newWrap.appendChild(el('summary',{style:{cursor:'pointer',fontWeight:'700'}},['Create a new party (as Director)']));
    const f=el('div',{style:{display:'flex',flexDirection:'column',gap:'8px',marginTop:'10px'}});
    const title=el('input',{type:'text',placeholder:'Party title (e.g. Heist Night)',style:{padding:'8px',background:'var(--surface)',border:'1px solid var(--border)',color:'var(--text)',borderRadius:'4px'}});
    f.appendChild(el('label',{style:{fontSize:'11px',color:'var(--muted)'}},['Party title']));
    f.appendChild(title);

    // Embed the full offline picker. Reset S.creation so this Director's
    // choices start fresh (we are not actually building a hero — we're just
    // borrowing the picker's UI to capture meta.gameType + meta.books).
    S.creation = (typeof defaultCreation==='function')?defaultCreation():S.creation;
    S.creation.step = 0;
    const pickerHost = el('div',{class:'og-mp-picker-host',style:{marginTop:'6px'}});
    f.appendChild(pickerHost);
    _lobbyCreationHost = pickerHost;
    _renderLobbyPicker();

    const go=el('button',{class:'btn btn-primary',style:{marginTop:'10px'},onclick:async()=>{
      // S.creation now holds the Director's full selection: coreBook (the primary
      // game), include (per-book Roles/Feats/Scenes flags), powerTier (OSH only).
      // We mirror those into meta so players auto-inherit them.
      const include = JSON.parse(JSON.stringify(S.creation.include||{}));
      const books = {}; selectableBooks().forEach(b=>{
        if(b===S.creation.coreBook){ books[b]=true; return; }
        const inc = include[b]||{};
        books[b] = !!(inc.roles || inc.tropes || inc.feats || inc.items || inc.scenes || inc.enemies);
      });
      try{
        const code = await MP.createParty({
          title:    title.value.trim()||'Untitled Party',
          gameType: S.creation.coreBook||'core',
          books,
          include,
          powerTier: S.creation.powerTier||null
        });
        _lobbyCreationHost = null;
        await _joinByCode(code);
      }catch(e){alert(e.message);}
    }},['Create party']);
    f.appendChild(go);
    newWrap.appendChild(f);
    card.appendChild(newWrap);
    // Drop the host reference when the lobby is dismissed (close/leave/etc.).
    newWrap.addEventListener('toggle',()=>{ if(!newWrap.open) _lobbyCreationHost=null; else _renderLobbyPicker(); });

    // Join by code
    const joinWrap=el('div',{style:{margin:'10px 0',display:'flex',gap:'8px'}});
    const code=el('input',{type:'text',placeholder:'4-digit code',maxlength:'4',inputmode:'numeric',style:{flex:'1',padding:'10px',background:'var(--surface2)',border:'1px solid var(--border)',color:'var(--text)',borderRadius:'4px',fontSize:'18px',letterSpacing:'4px',textAlign:'center'}});
    const join=el('button',{class:'btn btn-primary',onclick:()=>_joinByCode(code.value.trim())},['Join']);
    joinWrap.appendChild(code); joinWrap.appendChild(join);
    card.appendChild(el('label',{style:{fontSize:'11px',color:'var(--muted)',marginTop:'4px',display:'block'}},['Join with an invite code']));
    card.appendChild(joinWrap);

    // Offline fallback
    card.appendChild(el('hr',{style:{border:'none',borderTop:'1px solid var(--border)',margin:'18px 0'}}));
    card.appendChild(el('button',{class:'btn btn-secondary',style:{width:'100%'},onclick:_enterOfflineMode},['Play offline (local-only)']));

    // Detect ?p=NNNN or #p=NNNN auto-join hint.
    const hashCode = (location.hash.match(/[?#&]p=(\d{4})/)||[])[1] || (location.search.match(/[?&]p=(\d{4})/)||[])[1];
    if(hashCode){ code.value = hashCode; }
  }

  async function _joinByCode(rawCode){
    try{
      const code = String(rawCode||'').padStart(4,'0');
      if(!/^\d{4}$/.test(code)) throw new Error('Codes are 4 digits.');
      await MP.joinParty(code);
      _enterPartyMode(code);
    }catch(e){ alert(e.message); }
  }

  function _enterOfflineMode(){
    offlineMode = true;
    // If a Director clicked "Play offline" without explicitly leaving the
    // party first, drop the in-party flag so the gating helper restores
    // the single-player Hero tab.
    inParty = false;
    _applyDirectorGating();
    _closeLobbyOverlay();
    _refreshTopBar();
    // Trigger the original offline behaviour: open slot modal.
    if(typeof openSlotModal==='function') openSlotModal();
  }
  function _exitOfflineMode(){
    offlineMode = false;
    _refreshTopBar();
    _showLobbyOverlay();
  }
  window.OG_GO_OFFLINE = _enterOfflineMode;

  async function _leaveParty(){
    try{ await MP.leaveParty(); }catch(e){}
    inParty = false; myCharId = null; rollFeed=[]; lastRemote={chars:{},members:{},npcs:{},enemies:{},notes:{},meta:null,rolls:[],scenes:null};
    // Re-show tabs that director-mode had hidden so leaving snaps the UI
    // back to the single-player layout.
    _applyDirectorGating();
    _refreshTopBar();
    _showLobbyOverlay();
  }

  function _onAuth(u){
    _refreshTopBar();
    if(!u){
      // Signed out → drop party and show lobby.
      if(inParty){ MP.unbind(); inParty=false; }
      _applyDirectorGating();
      if(!offlineMode){ _showLobbyOverlay(); }
    } else {
      // Re-render lobby if it's open and we just signed in.
      const r=$('og-mp-lobby');
      if(r){ _renderLobbyContent(r.firstChild); }
    }
  }

  // ---- Party mode entry / wraps ------------------------------------------
  function _enterPartyMode(code){
    inParty = true;
    _closeLobbyOverlay();
    _refreshTopBar();
    _installFunctionWraps();
    // Seed our character: prefer the current S.char if it's named; otherwise empty
    // until the user creates/picks one.
    myCharId = MP.currentUid();
    MP.setMyCharId(myCharId).catch(()=>{});
    if(S.char && S.char.name){ MP.writeChar(myCharId, S.char).catch(console.error); }

    MP.bind(code, {
      meta:   _onMetaChange,
      members:_onMembersChange,
      chars:  _onCharsChange,
      npcs:   _onNpcsChange,
      enemies:_onEnemiesChange,
      rolls:  _onRollsChange,
      notes:  _onNotesChange,
      scenes: _onScenesChange,
    });
    _applyDirectorGating();
    // Force a re-render of whatever's currently on screen so the wraps kick
    // in. In particular, character creation may have been rendered at step 0
    // (Select Your Games) by the offline init before the player even signed
    // in — the wrap skips step 0 for non-Directors but only on the *next*
    // render. Do that render now.
    if(typeof renderHero==='function'){
      try{ renderHero(); }catch(_){}
    }
  }

  function _applyDirectorGating(){
    // Directors run the table — they don't have a hero, so hide the Hero tab and
    // land on the Party view. Non-Directors get the Enemies management tab hidden
    // (they still see the read-only enemy strip on the Dice screen). Once we're
    // OUT of a party (left/kicked/offline) the gating must fully release so the
    // single-player Hero tab comes back.
    const dir = inParty && MP.isDirector();
    const partied = inParty;
    const nbEnemies = $('nb-enemies'); if(nbEnemies) nbEnemies.style.display = (partied && !dir) ? 'none' : '';
    const nbHero    = $('nb-hero');    if(nbHero)    nbHero.style.display    = dir ? 'none' : '';
    if(dir){
      // If we're currently on the Hero page (the default), jump to Party.
      const heroPage = $('page-hero');
      if(heroPage && heroPage.classList.contains('active') && typeof showTab==='function'){
        showTab('party');
      }
    }
  }

  // ---- Remote → local handlers -------------------------------------------
  function _onMetaChange(meta){
    const prevMeta = lastRemote.meta;
    lastRemote.meta = meta;
    _applyDirectorGating();
    _refreshTopBar();
    // First meta delivery — re-render the Hero/creation page so a player who
    // joined before the meta arrived inherits the right coreBook/include now.
    if(!prevMeta && meta && typeof renderHero==='function' && !MP.isDirector() && !S.char){
      try{ renderHero(); }catch(_){}
    }
    // Director deleted the party while we were active — meta goes from
    // existing → null. Drop the row from our own saved list and kick to lobby.
    if(prevMeta && !meta && inParty){
      const code = MP.currentParty().code;
      alert('The Director ended this game.');
      MP.forgetParty(code).catch(()=>{});
      _leaveParty();
    }
  }
  function _onMembersChange(members){
    lastRemote.members = members||{};
    if(typeof renderParty==='function') renderParty();
  }
  function _onCharsChange(chars){
    lastRemote.chars = chars||{};
    if(typeof renderParty==='function') renderParty();
  }
  function _onNpcsChange(npcs){
    // Director-authoritative; mirror into S.npcs for the rest of the UI.
    lastRemote.npcs = npcs||{};
    S.npcs = Object.keys(lastRemote.npcs).map(k=>Object.assign({_id:k}, lastRemote.npcs[k]));
    if(typeof renderParty==='function') renderParty();
  }
  function _onEnemiesChange(enemies){
    lastRemote.enemies = enemies||{};
    S.activeEnemies = Object.keys(lastRemote.enemies).map(k=>Object.assign({_id:k}, lastRemote.enemies[k]));
    if(typeof renderActiveEnemies==='function') renderActiveEnemies();
    if(typeof maybeDicePage==='function') maybeDicePage();
  }
  function _onRollsChange(list){
    rollFeed = list||[];
    _renderRollFeed();
  }
  function _onNotesChange(notes){
    lastRemote.notes = notes||{};
    // Coerce numeric Firebase keys back to numbers so they match the IDs the
    // offline addNote() generated locally (Date.now()) — renderNotes uses ===
    // when comparing noteEditing to note.id.
    const remoteList = Object.keys(lastRemote.notes).map(k=>{
      const id = /^\d+$/.test(k) ? Number(k) : k;
      return Object.assign({id}, lastRemote.notes[k]);
    });
    const remoteIds = new Set(remoteList.map(n=>String(n.id)));
    // A note that exists in S.notes but not in remote is local-only (the user
    // just added it but hasn't saved yet). Keep it.
    const preserved = (S.notes||[]).filter(n=> !remoteIds.has(String(n.id)));
    S.notes = remoteList.concat(preserved).sort((a,b)=>(b.ts||0)-(a.ts||0));
    // Don't re-render if the user is actively typing in a note textarea —
    // innerHTML would destroy the textarea and lose what they typed.
    const ta = document.activeElement;
    const editing = ta && ta.tagName==='TEXTAREA' && /^note-edit-/.test(ta.id||'');
    if(!editing && typeof renderNotes==='function') renderNotes();
  }
  function _onScenesChange(scenes){
    lastRemote.scenes = scenes||{};
    if(scenes){
      if(scenes.chase)    S.chase    = scenes.chase;
      if(scenes.hunt)     S.hunt     = scenes.hunt;
      if(scenes.assemble) S.assemble = scenes.assemble;
      if(scenes.timeout)  S.timeout  = scenes.timeout;
      if(scenes.shards)   S.shards   = scenes.shards;
    }
  }

  // ---- Local → remote wrappers -------------------------------------------
  let wrapsInstalled=false;
  function _installFunctionWraps(){
    if(wrapsInstalled) return; wrapsInstalled=true;

    // save() — debounce a character push, and (for the Director) push the
    // whole enemies + NPCs maps. Every enemy/NPC mutation in the offline app
    // calls save(), so this single hook covers deploy/remove/grit/feat/SA
    // edits without per-function wraps that could race with subscriptions.
    const origSave = window.save;
    let pushT=null;
    function _pushEnemiesNpcs(){
      if(!inParty || !MP.isDirector()) return;
      const code = MP.currentParty().code;
      const eMap={}; (S.activeEnemies||[]).forEach((e,i)=>{
        const key = e._id || (e.id!=null?String(e.id):('e'+i));
        const copy = Object.assign({}, e); delete copy._id;
        eMap[key] = copy;
      });
      firebase.database().ref('parties/'+code+'/enemies').set(eMap).catch(console.error);
      const nMap={}; (S.npcs||[]).forEach((n,i)=>{
        const key = n._id || (n.id!=null?String(n.id):('n'+i));
        const copy = Object.assign({}, n); delete copy._id;
        nMap[key] = copy;
      });
      firebase.database().ref('parties/'+code+'/npcs').set(nMap).catch(console.error);
    }
    window.save = function(){
      origSave.apply(this, arguments);
      if(!inParty) return;
      clearTimeout(pushT);
      pushT = setTimeout(()=>{
        if(S.char) MP.writeChar(myCharId, S.char).catch(console.error);
      }, 300);
      _pushEnemiesNpcs();
    };

    // doRoll() — append to the shared feed after the original runs. Use the
    // CHARACTER's name (not the player's Google display name) so the feed
    // reflects who rolled in fiction.
    const origRoll = window.doRoll;
    if(typeof origRoll==='function'){
      window.doRoll = function(){
        origRoll.apply(this, arguments);
        if(!inParty || !S.dice) return;
        const sel = (typeof diceSel==='function') ? diceSel() : {};
        const heroName = (S.char && S.char.name) || (MP.currentUser()&&MP.currentUser().displayName) || 'Player';
        MP.appendRoll({
          name:   heroName,
          attr:   sel.attr || S.dice.attr,
          skill:  sel.skill|| S.dice.skill,
          mod:    sel.mod || S.dice.mod || 0,
          level:  S.dice.level,
          lvlNum: S.dice.lvlNum,
          matchCount: S.dice.matchCount,
          matchFace:  S.dice.matchFace,
        }).catch(console.error);
      };
    }

    // Notes — let the offline implementation own local state (S.notes,
    // noteEditing, the inline editor). We mirror to Firebase only on save /
    // delete, NOT on add. Pushing on add would trigger a subscription-driven
    // re-render mid-typing and wipe the textarea; deferring the push until
    // save means other clients only see the note once it has content.
    function _notesRef(){ return firebase.database().ref('parties/'+MP.currentParty().code+'/notes'); }
    function _pushNote(note, preserveTs){
      if(!note) return;
      // Reorder uses preserveTs=true so the swapped timestamps reach Firebase
      // verbatim. Normal saves use the server-side timestamp.
      return _notesRef().child(String(note.id)).set({
        type: note.type, text: note.text||'',
        authorUid: note.authorUid || MP.currentUid(),
        authorName: note.authorName || (MP.currentUser()&&MP.currentUser().displayName)||'Player',
        ts: preserveTs ? note.ts : firebase.database.ServerValue.TIMESTAMP
      });
    }
    // Hook called by outgunned.html's moveNote(): two adjacent notes have
    // already had their ts values swapped locally; push both so the new
    // ordering is reflected for other clients.
    window.OG_AFTER_NOTE_MOVE = function(a, b){
      if(!inParty) return;
      if(a) _pushNote(a, true);
      if(b) _pushNote(b, true);
    };

    const origAdd = window.addNote;
    if(typeof origAdd==='function'){
      window.addNote = function(){
        origAdd.apply(this, arguments);
        // origAdd already pushed onto S.notes and set noteEditing/renderNotes.
        // We don't push to Firebase yet (see comment above).
      };
    }
    const origSaveNote = window.saveNoteText;
    if(typeof origSaveNote==='function'){
      window.saveNoteText = function(id){
        origSaveNote.apply(this, arguments);  // commits textarea→S.notes, clears noteEditing
        if(!inParty) return;
        const note = (S.notes||[]).find(n=>String(n.id)===String(id));
        if(note) _pushNote(note).catch(console.error);
      };
    }
    const origCancelEdit = window.cancelNoteEdit;
    if(typeof origCancelEdit==='function'){
      window.cancelNoteEdit = function(id){
        origCancelEdit.apply(this, arguments);
        if(!inParty) return;
        // origCancelEdit deletes the note if it's empty (→ our deleteNote wrap
        // handles the Firebase remove). If non-empty, persist so other clients see it.
        const note = (S.notes||[]).find(n=>String(n.id)===String(id));
        if(note && note.text) _pushNote(note).catch(console.error);
      };
    }
    const origDel = window.deleteNote;
    if(typeof origDel==='function'){
      window.deleteNote = function(id){
        origDel.apply(this, arguments);
        if(!inParty) return;
        _notesRef().child(String(id)).remove().catch(console.error);
      };
    }

    // Enemies + NPCs are pushed by the save() wrap above; no per-function
    // wraps here. The Director's mutations all call save(), which routes
    // through the single _pushEnemiesNpcs() helper. Players' offline writes
    // happen locally but Firebase rules reject the push, so their changes
    // are reverted by the next subscription tick — correct behavior.

    // renderCreationStep is wrapped at boot in _installCreationStepWrap so the
    // lobby's book-picker works before joining any party. We only need the
    // creationBack guard here (it's safe to install once we're in a party).
    const origBack = window.creationBack;
    if(typeof origBack==='function'){
      window.creationBack = function(){
        if(inParty && !MP.isDirector() && S.creation && S.creation.step<=1) return;
        return origBack.apply(this, arguments);
      };
    }

    // Render hooks — context panel at the top of Dice, then the roll feed
    // and enemy strip below. Apply Director gating (Directors don't have a
    // hero, so the attribute/skill picker is hidden for them).
    const origDicePage = window.renderDicePage;
    if(typeof origDicePage==='function'){
      window.renderDicePage = function(){
        origDicePage.apply(this, arguments);
        _renderSceneContext();
        _renderRollFeed();
        _renderEnemyStripOnDice();
        _applyDirectorDiceGating();
      };
    }
    // The notes subscription also triggers a dice-page context refresh so the
    // Scene/Objective row stays current when other players edit notes.
    const origRenderNotes = window.renderNotes;
    if(typeof origRenderNotes==='function'){
      window.renderNotes = function(){
        origRenderNotes.apply(this, arguments);
        _renderSceneContext();
      };
    }
    const origRenderParty = window.renderParty;
    if(typeof origRenderParty==='function'){
      window.renderParty = function(){
        origRenderParty.apply(this, arguments);
        _augmentTeamPanel();
      };
    }
  }

  // ---- Augmentations ------------------------------------------------------
  // Directors have no hero, so hide the attribute/skill picker, the dice
  // result + history, and the Hero-grit card on the Dice screen. Keep the
  // shared bits (enemy strip, NPC strip, roll feed, scene/objective).
  function _applyDirectorDiceGating(){
    if(!inParty) return;
    const dir = MP.isDirector();
    ['dice-picker-card','dice-result-area','dice-action-btns','dice-history','dice-grit']
      .forEach(id=>{ const e = $(id); if(e) e.style.display = dir ? 'none' : ''; });
    // Title and subtitle also become misleading for a Director.
    const titleRow = document.querySelector('#dice-roller-col .pg-title');
    const subRow   = document.querySelector('#dice-roller-col .pg-sub');
    if(dir){
      if(titleRow) titleRow.textContent = 'Director Board';
      if(subRow)   subRow.textContent = 'Live table view — rolls, enemies, and the current scene.';
    }
  }

  // Top-of-dice context: the most recent Scene + Objective notes, so players
  // (and the Director) can see where they are without flipping tabs.
  function _renderSceneContext(){
    const page = $('page-dice'); if(!page) return;
    let panel = $('og-mp-scene-context');
    const notes = S.notes||[];
    // S.notes is sorted newest-first in MP; offline it's insertion order so
    // we re-sort defensively.
    const sorted = [...notes].sort((a,b)=>(b.ts||0)-(a.ts||0));
    const scene = sorted.find(n=>n.type==='scene' && n.text);
    const obj   = sorted.find(n=>n.type==='objective' && n.text);
    if(!scene && !obj){
      if(panel) panel.style.display='none';
      return;
    }
    if(!panel){
      panel = el('div',{id:'og-mp-scene-context',class:'card',style:{marginBottom:'10px',padding:'10px'}});
      page.insertBefore(panel, page.firstChild);
    }
    panel.style.display='';
    panel.innerHTML='';
    panel.appendChild(el('div',{style:{fontSize:'11px',color:'var(--muted)',letterSpacing:'2px',marginBottom:'6px'}},['NOW PLAYING']));
    if(scene){
      const row = el('div',{style:{marginBottom:obj?'6px':'0'}});
      row.appendChild(el('span',{style:{fontWeight:'700',color:'var(--yellow)',fontSize:'12px'}},['📍 SCENE — ']));
      row.appendChild(el('span',{style:{fontSize:'13px'}},[scene.text]));
      panel.appendChild(row);
    }
    if(obj){
      const row = el('div',{});
      row.appendChild(el('span',{style:{fontWeight:'700',color:'var(--accent)',fontSize:'12px'}},['🎯 OBJECTIVE — ']));
      row.appendChild(el('span',{style:{fontSize:'13px'}},[obj.text]));
      panel.appendChild(row);
    }
  }

  function _renderRollFeed(){
    const page = $('page-dice'); if(!page) return;
    let feed = $('og-mp-rollfeed');
    if(!feed){
      feed = el('div',{id:'og-mp-rollfeed',class:'card',style:{marginTop:'10px',padding:'10px'}});
      page.appendChild(feed);
    }
    if(!inParty){ feed.style.display='none'; return; }
    feed.style.display='';
    feed.innerHTML = '<div style="font-size:11px;color:var(--muted);letter-spacing:2px;margin-bottom:6px">RECENT ROLLS</div>';
    if(!rollFeed.length){
      feed.innerHTML += '<div style="color:var(--muted);font-size:12px">No rolls yet — be the first.</div>';
      return;
    }
    rollFeed.slice(-12).reverse().forEach(r=>{
      const row = el('div',{style:{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px dashed var(--border)',fontSize:'12px'}});
      row.appendChild(el('span',{},[r.name||'?',' • ',(r.attr||'')+'+'+(r.skill||'')]));
      row.appendChild(el('span',{style:{color:'var(--accent)',fontWeight:'700'}},[r.level||'']));
      feed.appendChild(row);
    });
  }

  function _renderEnemyStripOnDice(){
    const page = $('page-dice'); if(!page) return;
    let strip = $('og-mp-enemystrip');
    if(!strip){
      strip = el('div',{id:'og-mp-enemystrip',class:'card',style:{marginTop:'10px',padding:'10px'}});
      page.appendChild(strip);
    }
    if(!inParty || !(S.activeEnemies||[]).length){ strip.style.display='none'; return; }
    strip.style.display='';
    strip.innerHTML='<div style="font-size:11px;color:var(--muted);letter-spacing:2px;margin-bottom:6px">ENEMIES ON THE FIELD</div>';
    S.activeEnemies.forEach(e=>{
      const row=el('div',{style:{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px dashed var(--border)',fontSize:'12px'}});
      row.appendChild(el('span',{},[e.name||e.label||'Enemy']));
      row.appendChild(el('span',{style:{color:'var(--muted)'}},['Grit '+(e.grit||0)+'/'+(e.gritMax||0)]));
      strip.appendChild(row);
    });
  }

  function _augmentTeamPanel(){
    const page = $('page-party'); if(!page) return;
    let panel = $('og-mp-team');
    if(!panel){
      panel = el('div',{id:'og-mp-team',class:'card',style:{marginTop:'10px',padding:'10px'}});
      page.insertBefore(panel, page.firstChild);
    }
    if(!inParty){ panel.style.display='none'; return; }
    panel.style.display='';
    panel.innerHTML='';
    const members      = lastRemote.members||{};
    const chars        = lastRemote.chars||{};
    const myUid        = MP.currentUid();
    const directorUid  = (lastRemote.meta && lastRemote.meta.directorUid) || null;
    const iAmDirector  = MP.isDirector();

    // Director header — the Director isn't a hero, so they get a row of
    // their own at the top and are excluded from the PARTY HEROES list below.
    if(directorUid && members[directorUid]){
      const dirRow = el('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'4px 0 8px 0',borderBottom:'1px solid var(--border)',marginBottom:'8px'}});
      dirRow.appendChild(el('span',{style:{fontWeight:'700'}},[(members[directorUid].name||'Director'),directorUid===myUid?' (you)':'']));
      dirRow.appendChild(el('span',{class:'badge',style:{background:'var(--accent)',color:'#000',padding:'2px 6px',borderRadius:'4px',fontWeight:'700',fontSize:'10px'}},['DIRECTOR']));
      panel.appendChild(dirRow);
    }

    panel.appendChild(el('div',{style:{fontSize:'11px',color:'var(--muted)',letterSpacing:'2px',marginBottom:'6px'}},['PARTY HEROES']));
    const heroUids = Object.keys(members).filter(uid=>uid!==directorUid);
    if(!heroUids.length){
      panel.appendChild(el('div',{style:{color:'var(--muted)',fontSize:'12px'}},['No players have joined yet.']));
      return;
    }

    heroUids.forEach(uid=>{
      const m  = members[uid] || {};
      const ch = chars[m.charId] || chars[uid] || null;
      const isMine = uid===myUid;
      // Use a real <details> element so the Director can expand each hero's
      // attributes / skills / feat names without leaving the Party tab.
      const card = document.createElement('details');
      card.className = 'card';
      card.style.cssText = 'margin-bottom:8px;padding:8px 10px';
      if(iAmDirector) card.open = false; // collapsed by default for the Director

      const summary = document.createElement('summary');
      summary.style.cssText = 'cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:8px';
      const role  = ch && ROLES.find(r=>r.id===ch.roleId);
      const trope = ch && TROPES.find(t=>t.id===ch.tropeId);
      const isOSHHero = ch && ch.coreBook==='osh';
      const aliasLabel = isOSHHero ? 'Alias' : 'Job';
      const left = el('div',{style:{flex:'1',minWidth:'0'}});
      left.appendChild(el('div',{style:{fontWeight:'700'}},[
        (m.name||'Player'), isMine?' (you)':''
      ]));
      if(ch){
        const sub = el('div',{style:{fontSize:'11px',color:'var(--muted)',marginTop:'2px'}});
        const bits = [];
        if(ch.name) bits.push(ch.name);
        if(role)    bits.push(role.name);
        if(trope)   bits.push(trope.name);
        sub.textContent = bits.join(' · ');
        left.appendChild(sub);
      } else {
        left.appendChild(el('div',{style:{fontSize:'11px',color:'var(--muted)',fontStyle:'italic',marginTop:'2px'}},['no character yet']));
      }
      summary.appendChild(left);
      // Caret on the right that rotates open. CSS triangle so it works in any theme.
      const caret = el('span',{style:{fontSize:'12px',color:'var(--muted)',transition:'transform .15s'}},['▾']);
      summary.appendChild(caret);
      card.appendChild(summary);

      // Body: detailed fields visible to all players. For the Director the
      // body also includes attributes/skills/feat names so they can plan
      // encounters without asking each player to read their sheet.
      const body = el('div',{style:{marginTop:'8px',fontSize:'12px',lineHeight:'1.5'}});
      if(ch){
        if(ch.job)         body.appendChild(_kv(aliasLabel, ch.job));
        if(role)           body.appendChild(_kv('Role', role.name));
        if(trope)          body.appendChild(_kv('Trope', trope.name));
        if(ch.catchphrase) body.appendChild(_kv('Catchphrase', '"'+ch.catchphrase+'"'));
        if(ch.flaw)        body.appendChild(_kv('Flaw', ch.flaw));

        if(iAmDirector){
          // Compact attributes grid.
          if(ch.attrs){
            const aRow = el('div',{style:{display:'flex',gap:'6px',flexWrap:'wrap',margin:'8px 0 4px 0'}});
            ATTRS.forEach(a=>{
              const v = ch.attrs[a] || 0;
              aRow.appendChild(el('span',{style:{padding:'2px 6px',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:'4px',fontSize:'10px',fontWeight:'700'}},[a+' '+v]));
            });
            body.appendChild(el('div',{style:{fontSize:'10px',color:'var(--muted)',letterSpacing:'1.5px',marginTop:'8px'}},['ATTRIBUTES']));
            body.appendChild(aRow);
          }
          // Skills — only the ones > 1 (default) to keep it compact.
          if(ch.skills){
            const trained = Object.keys(ch.skills).filter(k=>ch.skills[k]>1)
                              .sort((a,b)=>ch.skills[b]-ch.skills[a]);
            if(trained.length){
              body.appendChild(el('div',{style:{fontSize:'10px',color:'var(--muted)',letterSpacing:'1.5px',marginTop:'8px'}},['SKILLS']));
              const sList = el('div',{style:{display:'flex',gap:'4px',flexWrap:'wrap',marginTop:'2px'}});
              trained.forEach(k=>{
                sList.appendChild(el('span',{style:{padding:'2px 6px',background:'var(--surface3)',borderRadius:'3px',fontSize:'10px'}},[k+' '+ch.skills[k]]));
              });
              body.appendChild(sList);
            }
          }
          // Feat names only — descriptions stay on the player's sheet.
          if(ch.feats && ch.feats.length){
            body.appendChild(el('div',{style:{fontSize:'10px',color:'var(--muted)',letterSpacing:'1.5px',marginTop:'8px'}},['FEATS']));
            body.appendChild(el('div',{style:{fontSize:'11px',marginTop:'2px'}},[ch.feats.join(' · ')]));
          }
        }
      } else {
        body.appendChild(el('div',{style:{color:'var(--muted)',fontStyle:'italic'}},['Character creation not yet finished.']));
      }
      card.appendChild(body);
      panel.appendChild(card);
    });
  }
  function _kv(label, value){
    const row = el('div',{style:{margin:'2px 0'}});
    row.appendChild(el('span',{style:{color:'var(--muted)',fontSize:'11px'}},[label+': ']));
    row.appendChild(el('span',{},[String(value)]));
    return row;
  }
})();

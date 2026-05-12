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
      bar.appendChild(el('span',{style:{color:'var(--muted)'}},['Offline']));
      bar.appendChild(el('button',{class:'btn btn-secondary',style:{padding:'4px 8px',fontSize:'11px'},onclick:_exitOfflineMode},['Switch to online']));
      return;
    }
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
    if(parties.length){
      card.appendChild(el('h3',{style:{margin:'18px 0 8px 0',fontSize:'13px',letterSpacing:'2px',color:'var(--muted)',textTransform:'uppercase'}},['Your parties']));
      const list = el('div',{style:{display:'flex',flexDirection:'column',gap:'6px',marginBottom:'14px'}});
      parties.forEach(p=>{
        const row=el('button',{class:'btn btn-secondary',style:{justifyContent:'space-between',display:'flex',padding:'10px 12px',textAlign:'left'},onclick:()=>_joinByCode(p.code)});
        row.appendChild(el('span',{},[p.title||'(untitled)','  ',el('span',{style:{color:'var(--muted)',fontSize:'11px'}},['#'+p.code])]));
        row.appendChild(el('span',{style:{color:'var(--accent)',fontSize:'11px'}},[p.role==='director'?'Director':'Player']));
        list.appendChild(row);
      });
      card.appendChild(list);
    }

    // Create new party — collapsible mini form.
    const newWrap = el('details',{style:{margin:'14px 0',padding:'12px',background:'var(--surface2)',borderRadius:'6px'}});
    newWrap.appendChild(el('summary',{style:{cursor:'pointer',fontWeight:'700'}},['Create a new party (as Director)']));
    const f=el('div',{style:{display:'flex',flexDirection:'column',gap:'8px',marginTop:'10px'}});
    const title=el('input',{type:'text',placeholder:'Party title (e.g. Heist Night)',style:{padding:'8px',background:'var(--surface)',border:'1px solid var(--border)',color:'var(--text)',borderRadius:'4px'}});
    const game=el('select',{style:{padding:'8px',background:'var(--surface)',border:'1px solid var(--border)',color:'var(--text)',borderRadius:'4px'}});
    selectableBooks().forEach(b=>{
      const o=el('option',{value:b},[bookLabel(b)]); game.appendChild(o);
    });
    f.appendChild(el('label',{style:{fontSize:'11px',color:'var(--muted)'}},['Party title']));
    f.appendChild(title);
    f.appendChild(el('label',{style:{fontSize:'11px',color:'var(--muted)',marginTop:'6px'}},['Primary game']));
    f.appendChild(game);
    // Expansion toggles
    const togWrap=el('div',{style:{display:'flex',gap:'8px',flexWrap:'wrap',marginTop:'6px'}});
    const toggles={};
    selectableBooks().forEach(b=>{
      const chk=el('input',{type:'checkbox'});
      const lab=el('label',{style:{display:'inline-flex',gap:'4px',alignItems:'center',fontSize:'12px',color:'var(--muted)'}},[chk,bookShort(b)]);
      togWrap.appendChild(lab); toggles[b]=chk;
    });
    f.appendChild(el('label',{style:{fontSize:'11px',color:'var(--muted)',marginTop:'6px'}},['Enable books']));
    f.appendChild(togWrap);
    const go=el('button',{class:'btn btn-primary',style:{marginTop:'10px'},onclick:async()=>{
      const books={}; selectableBooks().forEach(b=>{books[b]=!!toggles[b].checked;});
      books[game.value]=true;          // primary book always enabled
      try{
        const code=await MP.createParty({title:title.value.trim()||'Untitled Party', gameType:game.value, books});
        await _joinByCode(code);
      }catch(e){alert(e.message);}
    }},['Create party']);
    f.appendChild(go);
    newWrap.appendChild(f);
    card.appendChild(newWrap);

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
    _refreshTopBar();
    _showLobbyOverlay();
  }

  function _onAuth(u){
    _refreshTopBar();
    if(!u){
      // Signed out → drop party and show lobby.
      if(inParty){ MP.unbind(); inParty=false; }
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
  }

  function _applyDirectorGating(){
    // Hide the Enemies nav tab for non-Directors (the dice-page strip stays visible).
    const nb = $('nb-enemies');
    if(nb){ nb.style.display = MP.isDirector() ? '' : 'none'; }
  }

  // ---- Remote → local handlers -------------------------------------------
  function _onMetaChange(meta){
    lastRemote.meta = meta;
    _applyDirectorGating();
    _refreshTopBar();
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
    S.notes = Object.keys(lastRemote.notes)
      .map(k=>Object.assign({id:k}, lastRemote.notes[k]))
      .sort((a,b)=>(b.ts||0)-(a.ts||0));
    if(typeof renderNotes==='function') renderNotes();
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

    // save() — debounce a character push.
    const origSave = window.save;
    let pushT=null;
    window.save = function(){
      origSave.apply(this, arguments);
      if(!inParty) return;
      clearTimeout(pushT);
      pushT = setTimeout(()=>{
        if(S.char) MP.writeChar(myCharId, S.char).catch(console.error);
      }, 300);
    };

    // doRoll() — append to the shared feed after the original runs.
    const origRoll = window.doRoll;
    if(typeof origRoll==='function'){
      window.doRoll = function(){
        origRoll.apply(this, arguments);
        if(!inParty || !S.dice) return;
        const sel = (typeof diceSel==='function') ? diceSel() : {};
        MP.appendRoll({
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

    // Notes — addNote, deleteNote, saveNoteText: route through Firebase.
    const origAdd = window.addNote;
    if(typeof origAdd==='function'){
      window.addNote = function(type){
        if(!inParty) return origAdd.apply(this, arguments);
        MP.appendNote({type:type, text:''}).then(nid=>{
          // openEditor — the original implementation reads S.notes and edits inline.
          // Our subscription will pull the new note into S.notes; the user can then edit.
          if(typeof noteEditing!=='undefined'){ window.noteEditing = nid; }
          if(typeof renderNotes==='function') renderNotes();
        }).catch(e=>alert(e.message));
      };
    }
    const origDel = window.deleteNote;
    if(typeof origDel==='function'){
      window.deleteNote = function(id){
        if(!inParty) return origDel.apply(this, arguments);
        MP.deleteNote(id).catch(e=>alert(e.message));
      };
    }
    const origSaveNote = window.saveNoteText;
    if(typeof origSaveNote==='function'){
      window.saveNoteText = function(id){
        if(!inParty) return origSaveNote.apply(this, arguments);
        const ta = document.querySelector('[data-note-id="'+id+'"] textarea, #note-edit-'+id);
        const text = ta ? ta.value : '';
        MP.updateNote(id,{text:text}).catch(e=>alert(e.message));
        window.noteEditing = null;
        if(typeof renderNotes==='function') renderNotes();
      };
    }

    // Enemies — Director writes go through MP; players' calls are no-ops.
    ['confirmDeploy','removeEnemy','enemyToggleGrit','adjEGrit','clearEGrit','toggleEnemyFeat','toggleEnemySA'].forEach(fn=>{
      const orig = window[fn]; if(typeof orig!=='function') return;
      window[fn] = function(){
        const r = orig.apply(this, arguments);
        if(!inParty) return r;
        if(!MP.isDirector()){ alert('Only the Director can edit enemies.'); return; }
        // Push the entire activeEnemies set (cheap; small array).
        const map={};
        (S.activeEnemies||[]).forEach((e,i)=>{ map[e._id||('e'+i)] = Object.assign({},e); });
        // Wipe + rewrite — keeps remote in sync with local list operations.
        MP.writeMeta({lastEnemyEdit:Date.now()}).catch(()=>{});
        // Direct push:
        const baseRef = firebase.database().ref('parties/'+MP.currentParty().code+'/enemies');
        baseRef.set(map).catch(console.error);
        return r;
      };
    });

    // NPCs — Director only.
    ['saveNPC','deleteNPC','npcToggleGrit','npcClearGrit'].forEach(fn=>{
      const orig = window[fn]; if(typeof orig!=='function') return;
      window[fn] = function(){
        const r = orig.apply(this, arguments);
        if(!inParty) return r;
        if(!MP.isDirector()){ alert('Only the Director can edit NPCs.'); return; }
        const map={};
        (S.npcs||[]).forEach((n,i)=>{ map[n._id||('n'+i)] = Object.assign({},n); });
        firebase.database().ref('parties/'+MP.currentParty().code+'/npcs').set(map).catch(console.error);
        return r;
      };
    });

    // Render hooks — add the roll feed + team-augment + enemy strip.
    const origDicePage = window.renderDicePage;
    if(typeof origDicePage==='function'){
      window.renderDicePage = function(){
        origDicePage.apply(this, arguments);
        _renderRollFeed();
        _renderEnemyStripOnDice();
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
    panel.innerHTML='<div style="font-size:11px;color:var(--muted);letter-spacing:2px;margin-bottom:6px">PARTY HEROES</div>';
    const members = lastRemote.members||{};
    const chars   = lastRemote.chars||{};
    const myUid   = MP.currentUid();
    Object.keys(members).forEach(uid=>{
      const m = members[uid];
      const ch = chars[m.charId] || chars[uid] || null;
      const row = el('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:'1px dashed var(--border)'}});
      const left = el('span',{},[m.name||'Player',uid===myUid?' (you)':'']);
      const right = ch ? el('span',{style:{color:'var(--accent)',fontSize:'12px'}},[ch.name||'(no name)',' — ',ch.roleId||'']) : el('span',{style:{color:'var(--muted)',fontSize:'12px'}},['no character yet']);
      row.appendChild(left); row.appendChild(right);
      panel.appendChild(row);
    });
  }
})();

// ============================================================
// og-mp.js — Multiplayer layer for Outgunned
// ============================================================
// Wraps Firebase Auth (Google) + Realtime Database. The host page is expected
// to load firebase-app-compat.js, firebase-auth-compat.js, and
// firebase-database-compat.js BEFORE this file (see index.html).
//
// All identifiers are exposed on the single global `MP`. The host page calls
// MP.init(cfg) once and then drives the lifecycle through the methods below.
// ============================================================

window.MP = (function(){
  // -----------------------------------------------------------------
  // Firebase config — paste your project's web config below, or call
  // MP.init({...}) at startup. The host index.html exposes a CONFIG
  // block at the top for convenience.
  //
  // Required Realtime Database rules (paste into Firebase console):
  // {
  //   "rules": {
  //     "parties": {
  //       "$code": {
  //         ".read":  "auth != null && data.child('members').child(auth.uid).exists()",
  //         ".write": "auth != null && (
  //                      !data.exists() ||
  //                      data.child('meta/directorUid').val() === auth.uid
  //                    )",
  //         "members": {
  //           "$uid": {
  //             ".write": "auth != null && (auth.uid === $uid ||
  //                          data.parent().parent().child('meta/directorUid').val() === auth.uid)"
  //           }
  //         },
  //         "chars": {
  //           "$charId": {
  //             ".write": "auth != null && (newData.child('ownerUid').val() === auth.uid ||
  //                          data.parent().parent().child('meta/directorUid').val() === auth.uid)"
  //           }
  //         },
  //         "rolls":   { ".write": "auth != null" },
  //         "notes":   { ".write": "auth != null" },
  //         "enemies": { ".write": "auth != null && data.parent().child('meta/directorUid').val() === auth.uid" },
  //         "scenes":  { ".write": "auth != null && data.parent().child('meta/directorUid').val() === auth.uid" }
  //       }
  //     },
  //     "codes":  { ".read": "auth != null", "$code": { ".write": "auth != null" } },
  //     "users":  { "$uid": { ".read": "auth != null && auth.uid === $uid",
  //                            ".write": "auth != null && auth.uid === $uid" } }
  //   }
  // }
  // -----------------------------------------------------------------

  let app=null, auth=null, db=null, user=null;
  let currentCode=null, currentMeta=null;
  let unsub=[];               // active database subscriptions
  let authCbs=[];             // onAuth callbacks
  let inited=false;

  // ---- Init ----------------------------------------------------------------
  function init(cfg){
    if(inited) return;
    if(!window.firebase){throw new Error('Firebase SDK not loaded before og-mp.js');}
    app  = firebase.initializeApp(cfg);
    auth = firebase.auth();
    db   = firebase.database();
    auth.onAuthStateChanged(u=>{
      user = u||null;
      authCbs.slice().forEach(cb=>{try{cb(user);}catch(e){console.error(e);}});
    });
    inited = true;
  }
  function onAuth(cb){authCbs.push(cb); if(inited)cb(user); return ()=>{authCbs=authCbs.filter(x=>x!==cb);};}

  // ---- Auth ----------------------------------------------------------------
  function signInGoogle(){
    const p = new firebase.auth.GoogleAuthProvider();
    return auth.signInWithPopup(p);
  }
  function signOut(){return auth.signOut();}
  function currentUser(){return user;}
  function currentUid(){return user&&user.uid;}

  // ---- Party CRUD ---------------------------------------------------------
  // Code claim: codes/{NNNN} = uid. Transaction succeeds if empty.
  function _randomCode(){return String(Math.floor(Math.random()*10000)).padStart(4,'0');}
  async function _claimCode(uid){
    for(let attempt=0; attempt<25; attempt++){
      const code = _randomCode();
      const ref = db.ref('codes/'+code);
      // Transaction: only claim if not currently held.
      const res = await ref.transaction(v=> v==null ? uid : undefined);
      if(res.committed && res.snapshot.val()===uid) return code;
    }
    throw new Error('Could not allocate a free 4-digit code — try again.');
  }

  async function createParty({title, gameType, books, include, powerTier}){
    if(!user) throw new Error('Sign in first.');
    const code = await _claimCode(user.uid);
    const meta = {
      directorUid: user.uid,
      directorName: user.displayName || 'Director',
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      title: title || 'Untitled Party',
      gameType: gameType || 'core',
      books: books || {core:true,wok:false,osh:false}
    };
    if(include)   meta.include   = include;    // per-book {roles,feats,scenes}
    if(powerTier) meta.powerTier = powerTier;  // OSH only
    await db.ref('parties/'+code+'/meta').set(meta);
    await db.ref('parties/'+code+'/members/'+user.uid).set({
      name: user.displayName||'Player',
      photoURL: user.photoURL||null,
      joinedAt: firebase.database.ServerValue.TIMESTAMP,
      charId: null
    });
    await db.ref('users/'+user.uid+'/parties/'+code).set({
      title: meta.title, role:'director', joinedAt: meta.createdAt
    });
    return code;
  }
  async function joinParty(code){
    if(!user) throw new Error('Sign in first.');
    code = String(code).padStart(4,'0');
    const metaSnap = await db.ref('parties/'+code+'/meta').get();
    if(!metaSnap.exists()) throw new Error('No party with code '+code+'.');
    const meta = metaSnap.val();
    // Determine the saved-list role from meta. A Director rejoining via this
    // path must stay "director" — otherwise the lobby menu mis-labels them
    // after the create→join flow.
    const role = (meta.directorUid===user.uid) ? 'director' : 'player';
    await db.ref('parties/'+code+'/members/'+user.uid).set({
      name: user.displayName||'Player',
      photoURL: user.photoURL||null,
      joinedAt: firebase.database.ServerValue.TIMESTAMP,
      charId: null
    });
    await db.ref('users/'+user.uid+'/parties/'+code).set({
      title: meta.title||'', role:role,
      joinedAt: firebase.database.ServerValue.TIMESTAMP
    });
    return meta;
  }
  // Stop syncing the current party locally. Keeps the user's membership and
  // their `users/{uid}/parties/{code}` entry intact so the party still appears
  // in the lobby's "Your parties" list and can be rejoined with one click.
  async function leaveParty(){
    if(!currentCode) return;
    unbind();
    currentCode = null; currentMeta = null;
  }
  // Explicitly remove yourself from a party and drop it from your saved list.
  // Used by the lobby's "× Forget" action on a party row.
  async function forgetParty(code){
    if(!user) return;
    code = String(code).padStart(4,'0');
    if(currentCode===code){ unbind(); currentCode=null; currentMeta=null; }
    try{ await db.ref('parties/'+code+'/members/'+user.uid).remove(); }catch(_){}
    try{ await db.ref('users/'+user.uid+'/parties/'+code).remove(); }catch(_){}
  }
  async function listMyParties(){
    if(!user) return [];
    const s = await db.ref('users/'+user.uid+'/parties').get();
    if(!s.exists()) return [];
    const v = s.val()||{};
    return Object.keys(v).map(code=>Object.assign({code},v[code]));
  }

  // ---- Bind subscriptions to a party --------------------------------------
  // callbacks: { meta, members, chars, npcs, enemies, rolls, notes, scenes }
  function bind(code, callbacks){
    unbind();
    currentCode = String(code).padStart(4,'0');
    const base = db.ref('parties/'+currentCode);
    const watch = (path, cb)=>{
      const ref = base.child(path);
      const h = ref.on('value', s=>{ try{cb(s.val());}catch(e){console.error(e);} });
      unsub.push(()=>ref.off('value', h));
    };
    if(callbacks.meta)    watch('meta',    v=>{ currentMeta=v; callbacks.meta(v); });
    if(callbacks.members) watch('members', callbacks.members);
    if(callbacks.chars)   watch('chars',   callbacks.chars);
    if(callbacks.npcs)    watch('npcs',    callbacks.npcs);
    if(callbacks.enemies) watch('enemies', callbacks.enemies);
    if(callbacks.scenes)  watch('scenes',  callbacks.scenes);
    if(callbacks.notes)   watch('notes',   callbacks.notes);
    if(callbacks.rolls){
      // Rolls: keep only the most-recent 12 — use limitToLast(12) + onChildAdded.
      const ref = base.child('rolls').orderByChild('ts').limitToLast(12);
      const h = ref.on('value', s=>{
        const v=s.val()||{};
        const list=Object.keys(v).map(k=>Object.assign({_id:k},v[k]))
                     .sort((a,b)=>(a.ts||0)-(b.ts||0));
        try{callbacks.rolls(list);}catch(e){console.error(e);}
      });
      unsub.push(()=>ref.off('value', h));
    }
  }
  function unbind(){ unsub.forEach(fn=>{try{fn();}catch(_){}}); unsub=[]; }

  // ---- Writes (current party) ---------------------------------------------
  function _need(){ if(!currentCode) throw new Error('Not in a party.'); }
  function _ref(suffix){ _need(); return db.ref('parties/'+currentCode+'/'+suffix); }

  function isDirector(){ return !!(user && currentMeta && currentMeta.directorUid===user.uid); }
  function currentParty(){ return {code:currentCode, meta:currentMeta}; }

  async function setMyCharId(charId){
    _need();
    await _ref('members/'+user.uid+'/charId').set(charId||null);
  }
  async function writeChar(charId, char){
    _need();
    // Stamp the owner so the security rules can authorise the write.
    const payload = Object.assign({}, char, {ownerUid:user.uid, updatedAt:firebase.database.ServerValue.TIMESTAMP});
    await _ref('chars/'+charId).set(payload);
  }
  async function deleteChar(charId){ _need(); await _ref('chars/'+charId).remove(); }

  async function writeNpc(npcId, npc){ _need(); await _ref('npcs/'+npcId).set(npc); }
  async function deleteNpc(npcId){ _need(); await _ref('npcs/'+npcId).remove(); }

  async function writeEnemy(eid, enemy){
    if(!isDirector()) throw new Error('Only the Director can edit enemies.');
    await _ref('enemies/'+eid).set(enemy);
  }
  async function deleteEnemy(eid){
    if(!isDirector()) throw new Error('Only the Director can remove enemies.');
    await _ref('enemies/'+eid).remove();
  }

  async function appendRoll(roll){
    _need();
    const ref = _ref('rolls');
    const payload = Object.assign({}, roll, {
      uid: user.uid,
      name: user.displayName || 'Player',
      ts: firebase.database.ServerValue.TIMESTAMP
    });
    await ref.push(payload);
    // Trim: best-effort cap at 50. Server-side enforcement is the security rules' job;
    // this just keeps the live feed light. Only Director performs the trim to avoid races.
    if(isDirector()){
      const snap = await ref.orderByChild('ts').get();
      const v = snap.val()||{};
      const keys = Object.keys(v).sort((a,b)=>(v[a].ts||0)-(v[b].ts||0));
      while(keys.length>50){ await ref.child(keys.shift()).remove(); }
    }
  }

  async function appendNote(note){
    _need();
    const payload = Object.assign({}, note, {
      authorUid: user.uid,
      authorName: user.displayName || 'Player',
      ts: firebase.database.ServerValue.TIMESTAMP
    });
    const ref = await _ref('notes').push(payload);
    return ref.key;
  }
  async function updateNote(nid, patch){
    _need();
    await _ref('notes/'+nid).update(patch);
  }
  async function deleteNote(nid){
    _need();
    await _ref('notes/'+nid).remove();
  }

  async function writeScenes(scenes){
    if(!isDirector()) throw new Error('Only the Director can edit scenes.');
    await _ref('scenes').set(scenes);
  }
  async function writeMeta(patch){
    if(!isDirector()) throw new Error('Only the Director can edit party settings.');
    await _ref('meta').update(patch);
  }

  // ---- Personal character library ----------------------------------------
  async function listMyChars(){
    if(!user) return [];
    const s = await db.ref('users/'+user.uid+'/chars').get();
    if(!s.exists()) return [];
    const v = s.val()||{};
    return Object.keys(v).map(id=>Object.assign({_id:id}, v[id]));
  }
  async function saveMyChar(charId, char){
    if(!user) throw new Error('Sign in first.');
    await db.ref('users/'+user.uid+'/chars/'+charId).set(char);
  }

  return {
    init, onAuth,
    signInGoogle, signOut, currentUser, currentUid,
    createParty, joinParty, leaveParty, forgetParty, listMyParties,
    bind, unbind,
    isDirector, currentParty,
    setMyCharId, writeChar, deleteChar,
    writeNpc, deleteNpc,
    writeEnemy, deleteEnemy,
    appendRoll, appendNote, updateNote, deleteNote,
    writeScenes, writeMeta,
    listMyChars, saveMyChar
  };
})();

# Outgunned Multiplayer — Setup & Verification

This repo now has two playable pages and four shared JS modules:

| File              | What it is                                                          |
| ----------------- | ------------------------------------------------------------------- |
| `outgunned.html`  | The original offline app, refactored to load shared modules.        |
| `index.html`      | The multiplayer page (Firebase + Google Sign-In + party lobby).     |
| `og-data.js`      | All game content (Roles, Tropes, Feats, Enemies, etc.). Add expansions here. |
| `og-rules.js`     | Shared helpers (book gating, terminology, dice math, state factories). |
| `og-mp.js`        | Firebase Auth + Realtime Database wrapper exposed as `MP.*`.        |
| `og-app-mp.js`    | Multiplayer overlay loaded on top of the offline UI in `index.html`. |
| `build-index.js`  | Regenerates `index.html` from `outgunned.html` (run after UI edits). |

**Expansions auto-flow.** Add a new role / feat / book to `og-data.js`, refresh both pages — done.

---

## 1. Firebase setup (one-time)

1. Create a project at <https://console.firebase.google.com>.
2. **Authentication → Sign-in method →** enable **Google**.
3. **Realtime Database → Create Database** (start in *test mode*, then paste the rules below).
4. **Project settings → Your apps → Web (`</>`)** — register a web app, copy the `firebaseConfig` object.
5. Paste it into the `FIREBASE_CONFIG` block at the top of `index.html` (around line 702).
6. Paste these rules into **Realtime Database → Rules**:

```jsonc
{
  "rules": {
    "parties": {
      "$code": {
        ".read":  "auth != null && data.child('members').child(auth.uid).exists()",
        ".write": "auth != null && (!data.exists() || data.child('meta/directorUid').val() === auth.uid)",
        "meta": {
          // Joining a party needs to read meta before the user is a member yet
          // (chicken-and-egg with the parent .read rule), so open meta to any
          // authenticated user. Other subtrees stay member-only.
          ".read": "auth != null"
        },
        "members": {
          "$uid": {
            ".write": "auth != null && (auth.uid === $uid || data.parent().parent().child('meta/directorUid').val() === auth.uid)"
          }
        },
        "chars": {
          "$charId": {
            ".write": "auth != null && (newData.child('ownerUid').val() === auth.uid || data.parent().parent().child('meta/directorUid').val() === auth.uid)"
          }
        },
        "rolls":   { ".write": "auth != null" },
        "notes":   { ".write": "auth != null" },
        "enemies": { ".write": "auth != null && data.parent().child('meta/directorUid').val() === auth.uid" },
        "scenes":  { ".write": "auth != null && data.parent().child('meta/directorUid').val() === auth.uid" }
      }
    },
    "codes":  { ".read": "auth != null", "$code": { ".write": "auth != null" } },
    "users":  { "$uid": { ".read": "auth != null && auth.uid === $uid", ".write": "auth != null && auth.uid === $uid" } }
  }
}
```

7. **Authentication → Settings → Authorised domains:** add wherever you host (`localhost`, GitHub Pages, etc.).

---

## 2. Run locally

The pages are static HTML — open them directly, or serve via any static server:

```sh
# from this folder:
python -m http.server 8080
# then visit http://localhost:8080/index.html
```

Google Sign-In requires a real origin (file:// will not work).

---

## 3. Verification checklist

These map 1:1 to the verification section of the original plan.

### 3.1 Offline-app regression (`outgunned.html`)
- [ ] Open `outgunned.html` — slot picker appears.
- [ ] Pick slot 1, create a character, roll dice, deploy an enemy, add a note, refresh — state persists.
- [ ] Switch to `setTheme('dos')` etc. — themes still work.

### 3.2 Offline mode of the multiplayer page (`index.html`)
- [ ] Open `index.html` (with empty `FIREBASE_CONFIG`) — setup help screen appears.
- [ ] Click *Play offline* — slot picker appears, behaves identically to `outgunned.html`.
- [ ] With a valid `FIREBASE_CONFIG`: open `index.html` — lobby appears with Sign-in and Offline buttons.

### 3.3 Sign-in + create party
- [ ] Click *Sign in with Google* — popup completes, top bar shows your name.
- [ ] Open *Create a new party* form — pick title, primary game (Core/WoK/OSH), toggle expansions.
- [ ] Click *Create party* — top bar shows the 4-digit code and a **DIRECTOR** badge.
- [ ] Confirm in Firebase console: `parties/{CODE}/meta` exists with `directorUid` matching your auth UID.

### 3.4 Two-browser join
- [ ] In an incognito window, open `index.html`, sign in as user B.
- [ ] Lobby → *Join* → paste the 4-digit code.
- [ ] B sees the party loaded; A sees B's character row appear in the **PARTY HEROES** panel within ~1 s.
- [ ] B's *Sign in* token is independent — `users/{uid}/parties/{CODE}` exists for both A and B.

### 3.5 Director gating
- [ ] As B (player): the **Enemies** nav tab is hidden entirely.
- [ ] As A (Director): deploy an enemy — confirm it appears in `parties/{CODE}/enemies` in RTDB.
- [ ] As B: open the Dice screen — *ENEMIES ON THE FIELD* strip lists A's enemies (read-only, no edit controls).
- [ ] As A: adjust the enemy's grit — B's strip updates within ~1 s.

### 3.6 Roll feed
- [ ] As A and B both: roll some dice. Each roll appears in the *RECENT ROLLS* card on the Dice screen of both clients with author + attribute+skill + level.
- [ ] After 12 rolls, the oldest entries scroll off and only the last 12 remain.

### 3.7 Notes attribution
- [ ] As B: add a note (e.g. an Objective). Confirm it appears in B's Notes panel.
- [ ] As A: open Notes panel — the same note appears, stamped with B's display name.
- [ ] Either author or Director can delete the note.

### 3.8 Expansion flow-through
- [ ] Add a temporary entry to `ROLES_OSH` in `og-data.js`:
  ```js
  {id:'tester',name:'Tester',book:'osh',attr:'BRAWN', desc:'Temp.', skills:['Endure','Fight'], feats:[], gear:'Pencil', superpowerId:'kinetic_energy'},
  ```
- [ ] Reload `outgunned.html`: the new role appears in OSH character creation.
- [ ] Reload `index.html`: same role appears.
- [ ] Remove the entry after testing.

### 3.9 Offline parity
- [ ] In `index.html`, click *Play offline* — switching to online mode and back loses no character data (offline state lives in `localStorage`, party state in Firebase).

---

## 4. Architecture notes

### Function-wrapping in `og-app-mp.js`
The multiplayer overlay loads via `<script defer>` AFTER the inline app script, then wraps key mutator functions (`save`, `doRoll`, `addNote`, enemy/NPC ops, render functions). This keeps `outgunned.html` and `index.html` 99% identical: regenerate `index.html` via `node build-index.js` whenever you edit `outgunned.html` — no logic ever lives in only one of them.

### Storage adapter
There is no formal `LocalAdapter` / `FirebaseAdapter` interface — the wrappers fork on the `inParty` flag inside `og-app-mp.js`. Local mutations always go to `localStorage` first (`origSave`), then to Firebase if in party. Subscribed updates merge into `S` and re-render via the same render functions.

### Director-only UI
The `Enemies` nav button is hidden by setting `display:none` on `#nb-enemies` when `MP.isDirector()` is false. The Dice-page strip (`og-mp-enemystrip`) is rendered for everyone, read-only. NPCs are likewise Director-write but readable by all (they appear in the Team panel under PCs as today).

### Invite codes
Codes are 4-digit numeric, drawn from `0000`–`9999`, claimed via `codes/{NNNN}` RTDB transaction. Collisions retry up to 25 times. When the last member leaves a party, the code is *not* yet auto-released — clean-up can be added as a Cloud Function later or done manually. The party-link form is `index.html#p=NNNN` (the lobby auto-fills if present).

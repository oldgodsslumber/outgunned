# CLAUDE.md — Outgunned Rules Reference

Compact extraction from the Outgunned Corebook so future sessions of Claude can answer mechanical questions without guessing. **Verify named entities (skill IDs, item IDs, role IDs, feat names) against `og-data.js` / `og-rules.js` before using them in code** — the data files are canonical for IDs/costs; this doc is canonical for *rules*.

**Books currently in the app**

| Book | Tag | Contents |
|---|---|---|
| Corebook | `core` | This file's content. Roles, Tropes, Feats, Items, Enemies, Rules. |
| World of Killers | `wok` | Adds Conditions, named Italian weapons (Viper/Banshee/Lamia/Siren/Katana), themed feats. |
| Superheroes | `osh` | Adds Origins, Superpowers, energy weapons, Cash budget bump (4$ instead of 1$). |

WoK and OSH are tracked via `book` field on every entity in `og-data.js`.

---

## ⚠ Cross-check before guessing

Pitfalls that have actually happened — do these checks first:

| Don't guess | Check this |
|---|---|
| Skill names | `ATTR_SKILLS` in `og-data.js` (top of file). The 20 skills are listed below. |
| Item / Feat / Role / Trope IDs | Grep `og-data.js` for the visible name first. |
| Condition IDs | `CONDITIONS`, `WOK_CONDITIONS`, `OSH_CONDITIONS` arrays in `og-data.js`. |
| Whether "Crime"/"Brawn"/"Smooth"/etc. is a skill | **No.** Those are *attributes*. The four skills under each attribute are listed below. |
| Whether "Stuff" exists | **No.** Doesn't exist. |
| Whether "Hacking" is a skill | **No.** It maps to the `Know` skill (FOCUS) for computer/IT work, sometimes `Fix` for technical. |
| Hard limits (max adrenaline, max grit, max advancements) | The numbers below. They are not arbitrary. |

---

## Attributes & Skills

5 Attributes × 4 Skills each = 20 Skills. Heroes start with 2 in every attribute and 1 in every skill. Cap is 3 in each. Any skill can be rolled with any attribute (`Smooth+Know` is a valid pool for a witty deduction).

```
BRAWN   physical effort      Endure   Fight    Force    Stunt
NERVES  reflexes / steady    Cool     Drive    Shoot    Survival
SMOOTH  social / artistic    Flirt    Leadership  Speech  Style
FOCUS   notice / recall      Detect   Heal     Fix      Know
CRIME   stealth / threat     Awareness  Dexterity  Stealth  Streetwise
```

Skill summaries (verbatim from corebook):

- **Endure** — Handle pain, keep going despite exhaustion, hold your liquor.
- **Fight** — Fight enemies bare handed or in close quarters.
- **Force** — Hoist, push, pull, or break things.
- **Stunt** — Jump or run recklessly, dodge bullets.
- **Cool** — Keep your cool, hold still, or show courage.
- **Drive** — Drive a car or bike, pilot a plane or helicopter.
- **Shoot** — Shoot with pistols and rifles, throw objects with precision.
- **Survival** — Find your bearings in the wilds, improvise weapons or shelter, hunt your dinner.
- **Flirt** — Seduce someone or use your charm.
- **Leadership** — Inspire, give orders, or intimidate people.
- **Speech** — Persuade or deceive someone, or carry out negotiations.
- **Style** — Show style and elegance, clean up nice, or prove your artistic talent.
- **Detect** — Find clues and intel, notice details, sniff out lies.
- **Heal** — Give first aid or comfort someone.
- **Fix** — Fix a computer or a car, turn off the security system, or hack into a server.
- **Know** — Remember information you learned, recall details and other useful knowledge.
- **Awareness** — Keep your eyes and ears open, notice incoming threats.
- **Dexterity** — Perform sleight of hand, steal something, pick a lock.
- **Stealth** — Hide, sneak, or move quietly.
- **Streetwise** — Interact with criminals, recall information useful for moving in seedy neighborhoods or dealing with organized crime.

Roll = `Attribute + Skill` dice (clamped 2..9). `+1`/`-1` from Adrenaline, Conditions, Gear, Help, circumstance.

---

## Roll Mechanics

### Dice pool

- d6s. Successes = sets of matching faces. Symbol on the die face doesn't matter — it's the value that has to match.
- Pool is `attr + skill + modifiers`, **never less than 2, never more than 9**.

### Success ladder

| Match | Name | What it passes |
|---|---|---|
| 2 of a kind | Basic Success | Basic roll |
| 3 of a kind | Critical Success | Critical roll (most common difficulty) |
| 4 of a kind | Extreme Success | Extreme roll |
| 5 of a kind | Impossible Success | Impossible roll |
| 6+ of a kind | Jackpot | Player narrates the outcome (becomes mini-Director for the turn) |

**`3 small = 1 big` and `1 big = 3 small`.** A Critical can be spent as three Basics (e.g., to take three extra actions, or to do Damage Control). Three Basics combine into one Critical.

### Difficulties

`BASIC / CRITICAL / EXTREME / IMPOSSIBLE`. Most rolls are Critical. The Director may also set **double difficulty** (e.g., `2 Critical`) — one roll, but you need two successes, and a failure has two consequences. Never `2 Impossible`.

### Re-rolls

After scoring at least one success, you may **Re-roll** all dice that weren't part of a success.

- New result is *better* if you got an extra success or upgraded an existing one.
- **If better:** keep the new result.
- **If not better:** you lose one of your previously scored successes (your choice which).

**Free Re-roll** (granted by Feats / certain Items): never risks losing a success, and works even with zero initial successes. Always take a Free Re-roll.

### All In

After a successful Re-roll (or Free Re-roll that improved), you can go **All In**: roll the non-success dice again.

- **If better:** keep the new result.
- **If not better:** lose *all* previous successes.

Recommended cadence: Re-roll often (more than half your rolls). All-In sparingly.

### Action vs Reaction Rolls

- **Action Roll** — player chooses attr+skill, describes action.
- **Reaction Roll** — Director chooses attr+skill, player must roll against it.

### Dangerous Rolls

Marked with ☠ in the rulebook. A failure causes **Grit loss**:

| Difficulty | Grit lost on failure |
|---|---|
| Basic | 1 |
| Critical | 3 |
| Extreme | 9 |
| Impossible | All |

**Damage Control:** with smaller-than-required successes you can avoid Grit loss — 1 Basic Success = avoid 1 Grit; 1 Critical Success = avoid 3 Grit. No Damage Control on Impossible Rolls.

### Gamble

A roll that risks extra Grit. Becomes a Gamble when: handling explosives, driving at top speed, voluntarily taking +1 by going recklessly, or doing something the Director judges over-the-top. **After re-rolls/all-in resolve**, count the `Snake Eyes` (1s) remaining on the table — lose 1 Grit per Snake Eye.

### Help

A piece of gear (or another Hero) helping you:

- **+1 to roll** (significant help)
- **Automatic success without rolling** (decisive help)
- **Requisite to roll at all** (Help is instrumental — no further bonus)

Default when in doubt: +1.

### Extra Actions

Surplus successes beyond what you needed buy extra actions or help allies:

- **Extra Basic** → Quick Action (grab/throw, reload, reach Close Range, partial cover).
- **Extra Critical** → Full Action (break door, total cover, find clue).
- **Extra Extreme** → Cool Action (extraordinary feats, place bug on enemy, jump from explosion unscathed).

Or hand an extra success to a friend who failed.

---

## Hero Resources

### Grit — 12 boxes

| Box | Effect |
|---|---|
| 8 (Bad Box) | Suffer a Condition (Director picks). |
| 12 (Hot Box) | Gain 2 Adrenaline (max 6). |

When you fail Dangerous Rolls, fill in boxes. When *all 12* are filled and you'd lose more, you spin the **Death Roulette**.

**Recovery:** sleeping (full grit), Catching a Break (DM-granted after a rough scene), end of Shot/Session.

### Conditions — `-1` debuffs

Each common Condition is tied to an Attribute and imposes `-1` to all rolls with that Attribute until removed. Listed below with id used in `og-data.js`.

**Core (in `CONDITIONS`):**

| id | Label | Penalty | Notes |
|---|---|---|---|
| `hurt` | Hurt | -1 to all **Brawn** rolls | From beatings / falls. Removed by medical care (`Focus+Heal Critical`; self-care at -1). |
| `nervous` | Nervous | -1 to all **Nerves** rolls | From close calls / stress. Removed during Time-Out via relaxation. |
| `like_fool` | Like a Fool | -1 to all **Smooth** rolls | From losing face / embarrassment. Removed by earning respect (`Smooth+Heal Critical` from a friend). |
| `distracted` | Distracted | -1 to all **Focus** rolls | From foggy thinking. Removed by spending 2 Adrenaline on any Focus roll, OR Time-Out doing nothing. |
| `scared` | Scared | -1 to all **Crime** rolls | From shock / fear. Removed by confronting fear successfully, OR Time-Out confiding (costs another Hero an action). |
| `tired` | Tired | **No direct penalty** but +1 step toward Broken. | From exertion. The Director's default choice when filling the Bad Box. Removed by hot meal + sleep. |
| `broken` | Broken | **-1 to ALL rolls** | Auto-applies when 4th Condition would be suffered. Removed via hospital stay or `Focus+Heal Extreme` Time-Out action by a friend. |

**3-Condition cap:** when you'd suffer a 4th Condition, you become Broken instead. You can't gain more Conditions while Broken — remove one first.

**Other Conditions (rules-text examples, GM may create new ones):**

| id | Label | Penalty |
|---|---|---|
| `disheartened` | Disheartened | -1 to rolls about courage / quick decisions. |
| `confused` | Confused | -1 to **Know** rolls and rolls requiring time/quiet (including Time-Out help). |
| `angry` | Angry | -1 to rolls requiring calm and precision. |

**WoK / OSH** add their own conditions in `WOK_CONDITIONS` / `OSH_CONDITIONS`. Grep when needed.

**Spotlight removal:** you can always spend 1 Spotlight to remove any Condition (including Broken). Max 2 Condition removals per in-game day.

### Adrenaline — 0..6

Start with 1. Spend:
- **1 Adrenaline** → +1 to a roll, **or** activate a Feat marked with the Adrenaline symbol.
- **6 Adrenaline** → exchange for 1 Spotlight.

**Gain Adrenaline** automatically: filling the Hot Box (box 12) = +2.
**Director-granted** for: succeeding against odds; idea that rocks the story; great sacrifice; strong emotion; center of an epic scene; etc.

### Spotlight — 0..3

Start with 1. Each Spotlight can be spent on **one** of:
- **Auto Extreme Success** on any roll (no dice).
- **Save a friend** about to die at Death Roulette (they add a Lethal Bullet).
- **Remove any Condition** (including Broken).
- **Save a ride** about to explode.
- **"Do whatever you want"** — discuss with Director; Spotlight makes the impossible possible.

After spending: **flip a coin**. Tails = refund (regain the Spotlight). Exception: if used to save a friend, tails refunds to the *saved* friend instead.

**Director grants** Spotlight when:
- Hero calls on their Catchphrase in an epic/dramatic moment.
- Hero calls their Flaw into play *against their own interest*.
- Anything that would feel too big for just Adrenaline.

### Death Roulette — up to 6 Lethal Bullets

Start with **1 Lethal Bullet** (Adult Hero). Young Heroes: still 1. **Old Heroes start with 2.**

When you'd lose Grit but already have all 12 boxes filled, you **spin the Roulette**: roll d6.
- **Result > Lethal Bullets:** narrow escape. Add 1 Lethal Bullet to the cylinder. Describe how you cheated death.
- **Result ≤ Lethal Bullets:** Left for Dead — unless an ally spends a Spotlight to save you (you still add a Lethal Bullet).

Lethal Bullets **never decrement** within a campaign. Resets to 1 only at the start of a new Cinematic Campaign.

### Cash — 0..5 max

`1$` = utility items. `2$` = nicer gear. `3$` = luxury / rare. Above 3$ is unbuyable (must be earned via side mission or stolen). **Black Market:** everything costs 1$ less, minimum 1$. **Gear Up scene:** everything costs 1$ until end of scene (Director call, at Turning Point/Showdown).

Starting cash: **1$** (Core/WoK), **4$** (OSH), **+2$** for Solo, **+2$** for Cash Flow feat (also +1$ at start of each session, except imprisoned/wilderness).

### Heat — 0..12 (Director-side tracker)

Starts at = number of Heroes. Rises by 1 for: Turning Point/Showdown begins; a Hero/Supporting Character Left for Dead; Villain wins a beat; Time-Out lingers; Hero misstep.

**Heat thresholds:**

| Heat | Effect |
|---|---|
| 6 | Every Hero adds 1 Lethal Bullet to their Death Roulette. |
| 9 | Every Enemy gains 1 additional Feat Point. |
| 12 | Every Hero gains 1 Adrenaline AND adds 1 Lethal Bullet. |

Locked at the Showdown — stops rising.

### Plan B — 3 group resources per Cinematic Campaign

| Plan B | Effect |
|---|---|
| **Bullet** | Single shot solves the problem — explode something, deflect a missile, take an "impossible" shot. |
| **Backup** | External help swoops in — Supporting Character, cavalry, lucky truck-rams-the-villain. |
| **Bluff** | The trap was the plan all along — escape constraints, fool an enemy, retroactively rewrite a small fact. |

Each used **once per Campaign**, never two in the same Session. Needs group consent — a solo Hero can burn one without consent but then can't activate any more themselves (others still can without their approval).

**Heist mode:** Plan Bs can be used in Flashback ("Actually, our hacker added me to the guest list earlier...").

### Time-Out

Safe-scene downtime. Restores all Grit. Each Hero takes **2 actions** from:
- **Investigating** — phone calls / research / interview.
- **Healing** — remove a Condition (from self or ally).
- **Fixing** — repair gear / restore Ride Armor.
- **Shopping** — buy gear from accessible vendor.
- **Working** — anything that just needs time.

Group consent to **extend** = each Hero gets a 3rd action but **Heat +1**.

### Advancement — 3 max per Hero

After a Turning Point, before the Showdown:

- **+2 Skill Points** (free assign)
- **+1 Feat** (any, not limited to Role/Trope)
- **+1 Adrenaline**

After 3 Advancements you're maxed. From then on, at each Turning Point you may instead:
- Reassign 2 Skill Points, and/or
- Swap a Feat for another, **or**
- Take +1 Adrenaline (no change otherwise).

Between Campaigns: can swap Role *or* Trope (not both), one Feat, Job/Catchphrase/Flaw/Age. Experiences persist forever.

### Experiences

Short sentences earned in-play. Four types:

| Type | Example | Typical effect |
|---|---|---|
| **Achievement** | "I've learned to put my trust in others" | Usually +1 in fitting situations. |
| **Scar** | "I was trapped in the flames" | Usually -1 in fitting situations. |
| **Bond** | "Savar saved my life" | Situational +1 or -1. |
| **Reputation** | "I put a big shot in the slammer" | Situational +1 or -1 (people may have heard). |

Each Experience comes into play ≤ once per Shot. Achievements/Scars can sometimes invert (a Scar can be a benefit in an adjacent context).

Heroes Left for Dead who return always gain a Scar tied to their departure.

---

## Hero Age

- **Young** — only **1 Feat** from Role (not 2). Gains exclusive Feat **Too Young to Die**. Starts with **2 Adrenaline** instead of 1.
- **Adult** — default; no modifiers.
- **Old** — **+1 Feat** (extra pick from Role *or* Trope). Starts with **2 Lethal Bullets** instead of 1. Starts with **1 Experience** of choice.

---

## Roles

Each Role grants: **+1 Attribute Point**, **+1 to 10 specific Skills** (1 each), **pick 2 of 6 Feats**, **starting Gear**.

### Commando
*An elite soldier, S.W.A.T., special forces, mercenary, survivalist.*

- **Attribute:** Brawn
- **Skills (+1 each):** Endure, Fight, Force, Cool, Shoot, Survival, Leadership, Fix, Awareness, Stealth
- **Feats (pick 2):** Hard to Kill, Hunter, Intimidation, Marksman, Military Background, That's All?
- **Gear:** Knife, Telephone OR Radio, Weapon of choice
- **Jobs:** Soldier, Marine, Mercenary

### Fighter
*Martial artist, boxer, brawler, self-defense expert.*

- **Attribute:** Brawn
- **Skills (+1 each):** Endure, Fight, Force, Stunt, Cool, Flirt, Leadership, Style, Heal, Dexterity
- **Feats (pick 2):** Combo, Counter, Flying Kick, Hard to Kill, Martial Arts, Punch Reload
- **Gear:** One 1$ item of choice
- **Jobs:** Martial Arts Teacher, Bodyguard, Bouncer

### Ace
*Race-car driver, motorcycle rider, courier, taxi expert, pilot.*

- **Attribute:** Nerves
- **Skills (+1 each):** Stunt, Cool, Drive, Shoot, Flirt, Style, Fix, Awareness, Dexterity, Streetwise
- **Feats (pick 2):** Car Jump, Crazy Stunt, Full Throttle!, Mechanic, Proven Driver, Spinout
- **Gear:** Ride (Speed 1), Pistol OR Shotgun
- **Aces ignore the -1 penalty for piloting uncommon rides.**
- **Jobs:** Pilot, Courier, Private Driver

### Agent
*Police officer, FBI special agent, firefighter, secret agent, undercover cop.*

- **Attribute:** Nerves
- **Skills (+1 each):** Endure, Fight, Stunt, Cool, Drive, Shoot, Leadership, Detect, Heal, Awareness
- **Feats (pick 2):** Get Down!, Gunslinger, Hard to Kill, Lie to Me, Pep Talk, Selfless
- **Gear:** Pistol, Handcuffs, Badge, Telephone OR Radio
- **Jobs:** Police Officer, Government Agent, Double Agent

### Face
*Cheat, celebrity, influencer, artist, wealthy entrepreneur.*

- **Attribute:** Smooth
- **Skills (+1 each):** Flirt, Leadership, Speech, Style, Detect, Heal, Know, Dexterity, Stealth, Streetwise
- **Feats (pick 2):** Artist, Cash Flow, Heartbreaker, High Culture, Master of Disguise, Silver Tongue
- **Gear:** Elegant Clothes, Precious item of choice (jewelry, golden lighter…)
- **Jobs:** White-collar Worker, Actor, Professional Gambler

### Nobody
*Everyday person, family member, neighbor, retiree, cashier.*

- **Attribute:** Smooth
- **Skills (+1 each):** Fight, Shoot, Survival, Leadership, Speech, Detect, Fix, Heal, Know, Dexterity
- **Feats (pick 2):** I'll Make a Phone Call, Lie to Me, Mechanic, Physician, Proven Driver, Silver Tongue
- **Gear:** 1$ item of choice OR Old ride (Speed 0)
- **Jobs:** Employee, Cashier, Nurse

### Brain
*University professor, scientist, hacker, rebel genius, exceptional student.*

- **Attribute:** Focus
- **Skills (+1 each):** Drive, Leadership, Speech, Style, Detect, Fix, Heal, Know, Dexterity, Stealth
- **Feats (pick 2):** Hacker, High Culture, Intuition, Mastermind, Outsmart, Scientist
- **Gear:** Portable Computer, Notebook, Pencil
- **Jobs:** Researcher, Professor, Hacker

### Sleuth
*Private investigator, homicide detective, investigative reporter, bounty hunter.*

- **Attribute:** Focus
- **Skills (+1 each):** Endure, Stunt, Cool, Drive, Shoot, Detect, Know, Awareness, Stealth, Streetwise
- **Feats (pick 2):** Detective, I'll Make a Phone Call, Intimidation, Marksman, Reporter, Shadow
- **Gear:** 1$ item of choice, Pistol OR Rifle OR Shotgun
- **Jobs:** Detective, Reporter, Private Eye

### Criminal
*Thief, safecracker, ex-con, fence, criminal gang member.*

- **Attribute:** Crime
- **Skills (+1 each):** Force, Stunt, Drive, Shoot, Survival, Speech, Awareness, Dexterity, Stealth, Streetwise
- **Feats (pick 2):** Always Prepared, Gunslinger, I'll Make a Phone Call, Lockpick, Pickpocket, Silver Tongue
- **Gear:** Pistol, Knife OR Lockpicking Set OR Handcuffs
- **Jobs:** Thief, Convict, Informer

### Spy
*Secret services agent, infiltrator, foreign nation spy.*

- **Attribute:** Crime
- **Skills (+1 each):** Endure, Fight, Stunt, Cool, Drive, Shoot, Flirt, Detect, Awareness, Stealth
- **Feats (pick 2):** Gunslinger, Heartbreaker, Martial Arts, Master of Disguise, Parkour, Shadow
- **Gear:** Elegant Clothes, Pistol with Silencer, Item of Choice
- **Jobs:** MI6 Agent, CIA Agent, KGB Spy

---

## Tropes

Each Trope grants: **+1 Attribute Point** (choose between two listed; if Role already gave you that attribute, take the other), **+1 to 8 specific Skills**, **pick 1 of 4 Feats**.

### Bad to the Bone
*Trouble incarnate; might be looking for redemption.*
- Attribute: Nerves OR Crime
- Skills: Force, Stunt, Drive, Shoot, Flirt, Style, Dexterity, Streetwise
- Feats: Knife Thrower, Parkour, Proven Driver, Shadow

### Cheater
*Lies for work, fun, or necessity.*
- Attribute: Smooth OR Crime
- Skills: Stunt, Cool, Shoot, Speech, Style, Dexterity, Stealth, Streetwise
- Feats: Pickpocket, Lockpick, Shadow, Silver Tongue

### Cool but Distressed
*A mess but somehow cool. Brooding cigarette guy.*
- Attribute: Nerves OR Smooth
- Skills: Fight, Cool, Drive, Shoot, Flirt, Detect, Know, Streetwise
- Feats: Detective, Gunslinger, Proven Driver, Silver Tongue

### Diehard
*Wired to take punishment and keep coming.*
- Attribute: Brawn OR Nerves
- Skills: Endure, Force, Fight, Cool, Drive, Shoot, Leadership, Heal
- Feats: Gunslinger, Hard to Kill, Martial Arts, Military Background

### Free Spirit
*Follows their heart, hates orders, prefers improv.*
- Attribute: Brawn OR Crime
- Skills: Fight, Stunt, Drive, Survival, Style, Fix, Stealth, Streetwise
- Feats: Artist, Parkour, Pickpocket, That's All?

### Genius Bruiser
*Muscle + brain. Plays smart but throws hands when needed.*
- Attribute: Brawn OR Focus
- Skills: Endure, Force, Fight, Leadership, Speech, Fix, Know, Heal
- Feats: Bodybuilder, High Culture, Scientist, That's All?

### Good Samaritan
*Helping others is the obvious choice.*
- Attribute: Smooth OR Focus
- Skills: Endure, Cool, Shoot, Speech, Style, Detect, Heal, Know
- Feats: Get Down!, High Culture, Physician, Selfless

### Hot Stuff
*Elegant, sexy, stylish, irresistibly good-looking.*
- Attribute: Smooth OR Crime
- Skills: Fight, Drive, Flirt, Style, Detect, Know, Awareness, Dexterity
- Feats: Artist, Cash Flow, Heartbreaker, I'll Make a Phone Call

### Hunk
*Big, tall, muscular, athletic. Gentle giant or intimidator.*
- Attribute: Brawn OR Smooth
- Skills: Endure, Force, Fight, Stunt, Survival, Flirt, Leadership, Style
- Feats: Bodybuilder, Combo, Intimidation, Selfless

### Jerk with a Heart of Gold
*Impudent, unreasonable, secretly soft.*
- Attribute: Brawn OR Smooth
- Skills: Fight, Survival, Flirt, Speech, Style, Dexterity, Stealth, Streetwise
- Feats: Heartbreaker, Martial Arts, Parkour, Silver Tongue

### Last Boy Scout / Girl Scout
*Old-school morals, naive positive attitude, determined.*
- Attribute: Brawn OR Nerves
- Skills: Endure, Stunt, Cool, Shoot, Survival, Flirt, Fix, Stealth
- Feats: Hard to Kill, Hunter, Military Background, Selfless

### Leader
*On the front line, leads by example.*
- Attribute: Nerves OR Focus
- Skills: Endure, Cool, Shoot, Survival, Leadership, Detect, Heal, Know
- Feats: Always Prepared, Get Down!, Head on a Swivel, Mastermind

### Lone Wolf
*Abrasive to strangers, reliable to friends, lives off-grid.*
- Attribute: Brawn OR Crime
- Skills: Force, Fight, Stunt, Cool, Survival, Flirt, Leadership, Streetwise
- Feats: Archer, Head on a Swivel, Martial Arts, That's All?

### Mentor
*The parent-figure. Knows the right thing to say.*
- Attribute: Smooth OR Focus
- Skills: Endure, Cool, Survival, Leadership, Speech, Heal, Know, Awareness
- Feats: Always Prepared, Mastermind, Pep Talk, Silver Tongue

### Neurotic Geek
*Computers, comics, pop culture. Out of touch but useful.*
- Attribute: Focus OR Crime
- Skills: Drive, Speech, Detect, Fix, Know, Awareness, Dexterity, Stealth
- Feats: Hacker, Intuition, Outsmart, Scientist

### Party Killer
*Cynical, last-word, ruins the moment.*
- Attribute: Nerves OR Crime
- Skills: Force, Stunt, Cool, Shoot, Leadership, Awareness, Stealth, Streetwise
- Feats: Head on a Swivel, Marksman, Mastermind, Pep Talk

### Trusty Sidekick
*Wingman to a specific person they really care about.*
- Attribute: Nerves OR Focus
- Skills: Drive, Shoot, Survival, Speech, Heal, Fix, Dexterity, Stealth
- Feats: Get Down!, Mechanic, Physician, Proven Driver

### Vigilante
*Tired of waiting for the law to fix things. Methods are borderline.*
- Attribute: Brawn OR Focus
- Skills: Fight, Stunt, Leadership, Detect, Fix, Awareness, Stealth, Streetwise
- Feats: Intimidation, Martial Arts, Parkour, Shadow

---

## Feats

47 Feats total. Most are passive Free Re-roll grants. Some are activated:

- **(Adrenaline)** — costs 1 Adrenaline to use.
- **[Quick Action]** — uses your Quick Action.
- **[Full Turn]** — you forgo your roll/action this turn.

Full list with verbatim text:

### Always Prepared
*You always have an ace up your sleeve.*
**[Quick Action]** Take out or retrieve a useful item, info, or a small easy-to-hide weapon.

### Archer
*Modern-day Robin Hood.*
Free Re-roll when using, repairing, evaluating, or handling a bow.

### Artist
*Popular or misunderstood, still an artist.* Choose an art form (dancing, singing, painting, etc.).
Free Re-roll for rolls regarding your chosen art form.

### Bodybuilder
*Big, strong, muscular.*
Free Re-roll when lifting, carrying, or breaking something.

### Car Jump
*Speed up an improvised ramp.*
**[Full Turn]** While driving, jump over something to automatically pass an obstacle, or gain +2 Speed during a Chase. Ride loses 1 Armor on landing. Land or water rides only (not flying).

### Cash Flow
*Old money or rich.*
Start the game with 3 Cash. Gain 1 Cash at the beginning of each Session (unless imprisoned or lost in the middle of nowhere).

### Combo
*One-two!*
After hitting an Enemy, spend 1 Adrenaline to deal 1 additional Grit. Spend more to extend the combo.

### Counter
*Best defense is a good offense.*
React against an Enemy by rolling Brawn+Fight instead of the requested Skill. Ignore all -1s from Conditions and circumstances.

### Crazy Stunt
*"Don't try this at home."*
**[Full Turn]** While driving, attempt an insane maneuver to win the chase. Destroy your ride and flip a coin. Heads: Director fills 1 Need box. Tails: 5 Need boxes. If all Need is full, you won the chase.

### Detective
*The crime scene speaks to you.*
Free Re-roll when looking for clues, following trails, or searching a room.

### Full Throttle!
*Speed junkie.*
When driving a ride, ignore penalties from Nervous Condition and from Top Speed. Once per chase, when you reach Top Speed, gain 1 Adrenaline.

### Flying Kick
*No enemy out of reach.*
Attack an Enemy within Close or Medium Range, gain +1 to the roll. Always attack within Close Range bare-handed without spending Adrenaline.

### Get Down!
*Drag a friend out of danger.*
**[Full Turn]** You and another Hero quickly hide, dodge a hail of bullets, or avoid being run over — no roll needed.

### Gunslinger
*The gun is an extension of your arm.*
Free Re-roll when using, repairing, evaluating, or handling a pistol or revolver.

### Hacker
*Computer wizard. No firewall stops you.*
Free Re-roll for all rolls about computers, to hack a system, or to bypass IT security measures.

### Hard to Kill
*Keep standing back up.*
When you fill in your Bad Box (box 8), gain 1 Adrenaline and +1 to your next roll.

### Head on a Swivel
*Always spotting what's coming.*
Free Re-roll when preempting dangers/ambushes or locating lurking enemies.

### Heartbreaker
*Damn smile.*
Free Re-roll when seducing or making a good impression on others.

### High Culture
*Studied and it shows.*
Free Re-roll for rolls to recall general culture, literature, history, geography.

### Hunter
*Predator instincts in the wilds.*
Free Re-roll for rolls to follow/hunt an animal, find your bearings, or hide while in the wilds.

### Intimidation
*Ice-cold tough guy.*
Free Re-roll when intimidating or interrogating somebody.

### Intuition
*Notices hidden details.*
**[Quick Action]** Ask the Director for a clue or suggestion, or find an Enemy's Weak Spot.

### I'll Make a Phone Call
*A contact, friend, or favor is just a call away.*
**[Full Turn]** Call a contact asking for info, a favor, a ride, or up to 3 Cash. You gain whatever was asked for during the next Time-Out.

### Knife Thrower
*If you can hold it, you can throw it.*
Gain +1 when using a throwing weapon.

### Lie to Me
*Read people at a glance.*
Free Re-roll for rolls to understand intentions or spot lies.

### Lockpick
*Doors, safes, vaults — surgical precision.*
Free Re-roll when picking any lock, door, or closed container.

### Marksman
*Many rifles, but none used like yours.*
Free Re-roll when using, repairing, evaluating, or handling a rifle, shotgun, submachine, or machine gun.

### Martial Arts
*Kung fu / muay thai / boxing / etc.*
Free Re-roll for all Action and Reaction Rolls when fighting unarmed.

### Master of Disguise
*Change appearance, hide identity.*
Free Re-roll for rolls to disguise yourself, go unnoticed, or assume someone else's identity.

### Mastermind
*Brilliant ideas keep you on top.*
Repeat one roll of any kind. Ignore all -1s from Conditions and circumstances.

### Mechanic
*Grew up in a workshop.*
Free Re-roll when building or repairing Rides and other gear.

### Military Background
*Soldier; knows hierarchy and protocol.*
Free Re-roll for rolls about military knowledge, coordinating strategy, or recalling training.

### Outsmart
*Work smart, not hard.*
Make an Action or Reaction Roll of any kind using **Know** instead of the required Skill.

### Parkour
*Free runner / acrobat.*
Free Re-roll when jumping, performing acrobatics, or breaking a fall.

### Pep Talk
*Always knows what to say.*
Free Re-roll when inspiring or coordinating others.

### Physician
*Nurse / doctor / paramedic.*
Free Re-roll for rolls to diagnose, operate, or remove physical Conditions (e.g., Hurt).

### Pickpocket
*Theft artist.*
Free Re-roll when stealing something from somebody.

### Proven Driver
*Engines are your passion.* Choose one type of ride (cars / bikes / flying / etc.).
Free Re-roll when driving, repairing, or evaluating rides of your chosen type.

### Punch Reload
*After a big hit, clench fists and keep fighting.*
**[Quick Action]** Once per combat, after failing a Reaction Roll against an Enemy, stand back up and immediately gain 1 Adrenaline.

### Reporter
*Always on the hunt for truth.*
Free Re-roll for rolls to interview people, gain information, find contacts.

### Scientist
*It could work — and you know exactly how.* Choose a STEM discipline (engineering, chemistry, botany, etc.).
Free Re-roll for rolls regarding your chosen discipline.

### Selfless
*True hero.*
Free Re-roll when defending or saving others, or acting selflessly.

### Shadow
*Quick and quiet.*
Free Re-roll when hiding, sneaking, or tailing someone.

### Silver Tongue
*Words louder than actions.*
Free Re-roll for rolls to lie, persuade, find compromise, or bargain.

### Spinout
*Pull the brake, turn the wheel.*
**[Full Turn]** All Heroes on the ride you're driving skip their Reaction Turn during a Chase. Flip a coin. Heads: -1 Speed. Tails: +1 Speed.

### That's All?
*Hard to persuade, harder to impress.*
Free Re-roll for rolls to show courage, withstand pain, resist threats or interrogations.

### Too Young to Die
*Young and carefree.*
When filling in the Bad Box, you suffer no Condition.
Only available when creating a Young Hero.

---

## Guns

Range columns: Melee / Close / Med / Long. Values are roll modifiers; `X` = can't shoot at that range. Mag of 4 = standard. Two-hand weapons cannot be paired (Guns Akimbo).

| Cost | Name | Feats | Melee | Close | Med | Long | Mag | 2H |
|---|---|---|---|---|---|---|---|---|
| 1$ | Pistol | — | 0 | 0 | 0 | -2 | 4 | |
| 1$ | Revolver | — | 0 | 0 | 0 | -2 | 4 | |
| 2$ | Machine Pistol | Rapid Fire, Short Range | 0 | +1 | 0 | X | 4 | |
| 2$ | Shotgun | Short Range, Slow Reload | +1 | +1 | -2 | X | 4 | |
| 2$ | Rifle | Accurate, Slow Reload | -2 | +1 | +1 | 0 | 4 | ✓ |
| 3$ | Assault Rifle | Accurate, Rapid Fire | 0 | +1 | +1 | +1 | 4 | ✓ |
| 3$ | Precision Rifle | Accurate, Precision Shot, Slow Reload | X | -1 | 0 | +2 | 4 | ✓ |
| 2$ | Sub-machine Gun | Rapid Fire | 0 | +1 | +1 | 0 | 4 | |
| 3$ | Machine Gun | Rapid Fire, Slow Reload | -2 | 0 | +2 | +1 | 4 | ✓ |
| 2$ | Bow | Silent, Single Shot | -1 | 0 | 0 | X | — | ✓ |
| 1$ | Throwing Knives (3) | Silent, Single Shot | -1 | -1 | -2 | X | — | |
| 3$ | Rocket Launcher | Explosive, Single Shot, Slow Reload | +2G | +2G | +3 | +3 | — | ✓ |
| 2$ | Grenade | Explosive, Jam, Single Shot | +1G | +1G | +2 | +2 | — | |
| 1$ | Arrows (6) | Projectiles for bow | | | | | | |
| 2$ | Rocket (1) | Projectile for rocket launcher | | | | | | |
| 1$ | Mags (2) | Mags for a weapon of your choice | | | | | | |

`G` in range cells = using this weapon at that range is a Gamble.

**Each gun purchase comes with one Mag free.**

### Gun Feats

- **Accurate** — Spend 1 turn aiming. Next turn +1 to hit that target.
- **Explosive** — Ignores Bulletproof Vest + Armored Enemy Feats. Using in Melee/Close is always a Gamble. If you lose Grit from the Gamble, *all nearby Heroes* lose that much Grit too.
- **Jam** — Before shooting, roll d6. On Snake Eye (1) the gun jams: roll lost, ammo lost.
- **Precision Shot** — Can shoot Out of Range (0).
- **Rapid Fire** — When laying Covering Fire, also +1 to your next Reaction Roll.
- **Short Range** — Cannot Go Full Auto or lay Covering Fire at Medium or Long Range.
- **Silent** — Doesn't alert enemies or reveal position.
- **Single Shot** — No Mag; track individual munitions in gear.
- **Slow Reload** — Reload is a Full Action (not a Quick Action).

### Range Bands (general)

- **Melee** — within 2 m/yd.
- **Close** — 2–10 m/yd. Reachable with a Quick Action.
- **Medium** — 10–50 m/yd. Reachable in 1 turn or with an extra Full Action.
- **Long** — 50–300 m/yd. Reachable in 2–3 turns.
- **Out of Range** — beyond 300 m/yd. Line of sight only; most weapons can't shoot.

### Mags

3 Mags per gun + 1 in the gun (4 total). You **don't track per-bullet**. A Mag depletes when:
1. **Failure** on a Shoot roll.
2. **Going Full Auto** — voluntary -1 Mag for +1 to the roll.
3. **Covering Fire** — your friends (not you) get +1 to their next Reaction Roll. You use your full turn, no Action Roll.
4. **Bad Luck** — Director-imposed via failure consequence.

Reload = **Quick Action** (Slow Reload guns require Full Action). Same Mag type works across gun family (any pistol mag fits any handgun).

### Cover

- **Partial Cover** — +1 Reaction, -1 Action. Reach via Quick Action (or spend extra Basic).
- **Total Cover** — Auto-success on Reaction, -3 Action. Reach by spending whole turn (or extra Critical).

You can push a friend behind cover with your Quick/Full/Cool action.

### Brawl

A simplified combat type. **All rolls are Action Rolls** — one roll resolves both hitting + being hit. Pass = hit Enemy (cause Grit). Fail = lose Grit. Lower successes can do Damage Control. No Reaction Turns.

Useful when most Heroes are in the same fight and the scene doesn't need fine choreography.

### Friendly Fire

Shooting at an Enemy who's in Melee with an ally turns the action into a Gamble *at your friends' expense* — Snake Eyes hit your allies' Grit, not yours.

### Guns Akimbo

Dual-wielding gives **no roll bonus** but **doubles your Mags** (you can lay Cover AND shoot, or Full Auto twice in one round for +2). Cannot Full Auto + Cover simultaneously.

---

## Other Gear (Tools of the Trade)

All grant `Help` (typically +1) in specific situations.

| Cost | Item | Help |
|---|---|---|
| 3$ | Bulletproof Vest | Help to avoid bullets. |
| 1$ | Camera | Help to shoot photos. |
| 3$ | Elegant Clothes | Help to make a good impression. |
| 2$ | First-aid Kit | Help to treat wounds. |
| 1$ | Grappling Hook | Help to climb and swing. |
| 1$ | Handcuffs | Help to restrain people. |
| 1$ | Heavy Mace | Help to break through doors and smash things. |
| 1$ | Knife/Sword | Help to cut things. |
| 2$ | Lockpicking Set | Help to open locks or safes. |
| 2$ | Night Vision Device | Help to see in the dark. |
| 2$ | Portable Computer | Help to find information and connect to a network. |
| 3$ | Scuba Gear | Help to dive and swim underwater. |
| 2$ | Silencer | Grants the Silent Feat to a pistol, assault rifle, or precision rifle. |
| 2$ | Telescopic Sight | Grants the Precision Shot Feat to a rifle or assault rifle. |
| 1$ | Toolbox | Help to repair Rides and other things. |
| 3$ | Wingsuit | Help to glide. Includes a parachute. |

**Bags & Storage:** Items in a bag travel with you but can be lost if the bag is lost. Items in Storage cannot be lost (except via robbery) but take time to retrieve.

### Two-bit Gear

Old / broken / unreliable. Costs much less:

- **Two-bit car** = 1$ (vs 3$ normal), Speed 0, may start with 1-2 Armor missing.
- **Two-bit gun** = 1$ for **three pieces**. All two-bit guns have the **Jam** feat.

### Black Market

Everything costs 1$ less, minimum 1$. Requires contacts.

### Gear Up Scene

Director-called at Turning Point / Showdown. All gear costs 1$ until end of scene (or 0$ if backed by a wealthy ally / organization).

---

## Rides

5 Types: **bike, car, nautical, flying, armored**. A ride can have multiple types (hovercraft = car + nautical, seaplane = flying + nautical).

### Speed (0..3)

- **0** — junker (two-bit ride).
- **1** — common (subcompact, street bike, boat, tourist plane).
- **2** — fast (hot rod, racing bike, speedboat).
- **3** — exceptional, rare (supercar, fighter jet, competition bike).

### Armor (3 + 3 if Armored)

3 Armor points by default. Armored vehicles get 3 extra. Lose Armor from hits / Car Jump / failures. When all are gone, the ride **smokes** — next Armor loss = it explodes, all on board lose **6 Grit**.

**Repair:** During Time-Out, `Focus+Fix` roll. Critical = +1 Armor. Extreme = +2. Impossible = full restore.

### Uncommon Rides Penalty

Nautical / flying / armored = uncommon. Driving them imposes **-1** unless you have:

- **Proven Driver (matching type)** — ignores penalty for that type.
- **Military Background** — ignores penalty for armored.
- **Ace Role** — ignores penalty for *all* uncommon rides.

### Buying

Common rides (Speed 1) cost **3$**. Faster / rarer / weaponized rides must be earned (side mission, theft).

---

## Combat

### Action Turn
Each Hero takes 1 free **Quick Action** + 1 **Action Roll**. To attack an Enemy: roll vs Enemy Defense; for every appropriate success, Enemy loses 1 Grit.

### Reaction Turn
Director describes Enemy actions; all Heroes roll Reaction Rolls (Dangerous) vs Enemy Attack. Fail = lose Grit.

### Extra Successes
- An extra success ≥ Enemy Defense on a Reaction Roll = **Counter** (Enemy loses 1 Grit on top of your defense).
- Lend extra successes to allies who failed (NOT for Damage Control — must be a full success).

### Initiative

If Heroes attack first or have surprise → starts on an Action Turn. If caught off guard → starts on a Reaction Turn. Coin flip if ambiguous.

---

## Enemies

Single Enemy "card" represents 1+ opponents acting as one unit. Each card has **Grit, Attack, Defense**.

### Types

| Type | Feat Points | Notes |
|---|---|---|
| **Goons** | 1 | Cannon fodder, mostly Basic Attack/Defense. Warm-up fights. |
| **Bad Guys** | 3 | Critical Attack/Defense usually. Main course. |
| **Bosses** | 5 | Extreme Attack/Defense usually. Save for Turning Points and Showdowns. |

Each Type has **5 Templates** numbered 1–5 in order of difficulty.

### Cannon Fodder shortcut

`9 Grit · Attack 2-Basic · Defense Basic · no Feats · no Special Actions`. Spicy version: `Critical/Critical`. Use when in a hurry.

### Templates

**GOONS**
- T1: Basic / Basic (angry citizens, hooligans, night guard).
- T2: 2-Basic / Basic (drunken brawlers, armed citizen, rookie criminals).
- T3: 2-Basic / Basic (cops in bad shape, troublemaker, gang of thugs).
- T4: Critical / Basic (biker gang, large bouncers, medium dog).
- T5: Critical / Basic (henchmen, neighborhood cops, professional batterer).

**BAD GUYS**
- T1: Critical / Critical (armed hooligans, well-trained agents, large guard dog).
- T2: Critical / Critical (soldiers, big burly batterers, expert commando).
- T3: 2-Critical / Critical (team of agents, large veteran, squad of soldiers).
- T4: 2-Critical / Critical (fierce martial artist, armed criminals, mercenaries).
- T5: 2-Critical / Critical (team of ninjas, assassin, big bruisers).

**BOSSES**
- T1: Extreme / Critical (elite soldier team, massive crime boss).
- T2: Extreme / Critical (angry grizzly, mercenary crowd).
- T3: Extreme / Critical (huge gatling guys, 88 katana-wielding lunatics).
- T4: Extreme / Extreme (armored vehicle, special forces squad).
- T5: Extreme / Extreme (helicopter gunship, superhuman strength).

### Enemy Feats (buy with Feat Points)

**1-point Feats:**
- **Automatic Weapons** — Heroes failing to score at least a Basic become Nervous (or lose 1 extra Grit if already Nervous).
- **Bulletproof Vests** — -1 to hit with firearms / ranged.
- **Fighters** — -1 to hit unarmed.
- **Heavy-Handed** — Heroes failing to score at least a Basic become Tired (or +1 Grit if already Tired).
- **Mob** — Heroes always lose +1 Grit when losing any Grit.
- **Sharp Blades** — Heroes failing to score at least a Basic become Hurt (or +1 Grit if already Hurt). Heroes with knives/swords ignore this.
- **Tactics** — Quick-Action repositioning requires a coin flip — Heads = lose your action, range unchanged.
- **Walking Hazard** — Attacking the Enemy requires a Dangerous Action Roll.

**2-point Feats:**
- **Armored** — -1 to hit (stacks with Bulletproof Vests).
- **Hard to Kill** — Reaching Hot Box: +1 Adrenaline, no extra Grit loss past the Hot Box from that attack.
- **Martial Arts** — Heroes without the Martial Arts Feat: -1 in Melee/Close.
- **Medkit** — Losing all Grit grants +1 Grit and back to fighting.
- **One Step Ahead** — No Weak Spot. A Hero who tries to find one loses 1 Grit.
- **Piercing Bullets** — Negates Bulletproof Vests and Partial Cover.
- **Relentless** — Ignore Covering Fire.
- **Shotguns** — Heroes in Melee at end of Action Turn: -1 to next Reaction.

**3-point Feats:**
- **Explosive Weapons** — All Hero Reaction Rolls are Gambles.
- **Flamethrower** — Heroes not scoring ≥ Critical on Reaction lose next Action Turn. After defeat, the flamethrower explodes / breaks.
- **Rage** — Starts combat with 1 Adrenaline.
- **Titan** — Heroes cannot deal more than 1 Grit per attack.

### Special Actions (Enemy Adrenaline)

Bosses (and some Bad Guys) have **Hot Boxes** within their Grit. Filling one grants Director 1 Adrenaline.

**1-Adrenaline:**
- **Counter** — After being hit, Enemy counters; Hero loses equal Grit.
- **Disarm** — Hero fails `Brawn+Dexterity Critical Reaction` → loses weapon.
- **Flashbang!** — Hero fails `Nerves+Awareness Critical Reaction` → Distracted + -1 next roll.
- **Foul Play** — Hero fails `Crime+Awareness Critical Reaction` → loses next Action Turn.
- **Grab and Throw** — Hero fails `Brawn+Endure Critical Reaction` after attacking → on ground, -1 until standing (Quick Action to stand).
- **I Don't Think So!** — Hero attempting to spend Adrenaline on a Feat: action lost, but Feat + Adrenaline preserved.
- **Pile On** — Hero with least Grit loses 2 Grit (or Tired → Hurt → Broken chain if at 0 Grit).
- **Tackle** — Hero fails `Brawn+Force Critical Reaction` → loses footing, -1 next roll.

**2-Adrenaline:**
- **Call for Backup** — Enemies leave, replaced by higher-tier / Template Enemy. Combat resumes.
- **Chaos** — Heroes can no longer spend Adrenaline for +1 to rolls.
- **Clamp Down** — Hero fails `Brawn+Stealth Basic Reaction` → trapped. `Brawn+Force Critical Action` to escape. Trapped Heroes fail all Reactions.
- **Grenade** — All involved Heroes: `Brawn+Stunt Extreme Reaction`. Impossible Success bounces it back and defeats the Enemy.
- **Parry** — Enemy ignores Grit loss from a successful Hero hit.
- **Surround** — From now on, Heroes must sacrifice 1 Grit to access their free Quick Action.
- **Threats** — Hero fails `Nerves+Cool Critical Reaction` → loses 1 Adrenaline (or becomes Scared if at 0 Adrenaline).
- **Weak Spot** — A specific Hero suffers -2 to their next Reaction.

**3-Adrenaline:**
- **Final Move** — Hero fails `Brawn+Fight Extreme Reaction` → Broken.
- **Infamy** — Adrenaline or Spotlight spent: resource lost, no benefit. (Saving a friend with Spotlight: another ally may intervene.)
- **Secret Weapon** — Enemy gains 1 additional Enemy Feat mid-combat.
- **To the End** — Erase 2 Enemy Grit boxes. Then Enemy stops accumulating Adrenaline.

**Final Blow:** Enemies with a **Hot Box as their last Grit box** can spend accumulated Adrenaline *even after defeat*.

---

## Weak Spot (combat)

Discoverable detail that gives an edge against an Enemy. Found via the **Intuition** Feat or a Director-set roll. Exploiting it grants situational +1, automatic success, or a unique narrative move depending on the Spot. (Detailed tables in corebook §FACE THE ENEMY → "Weak Spots 1-2 / 3-4 / 5-6"; not enumerated here.)

---

## Quick-reference cheat sheet

Common questions, quick answers:

| Q | A |
|---|---|
| What's the dice pool cap? | Min 2, max 9. |
| What does the Hot Box give? | 2 Adrenaline. |
| What does the Bad Box give? | A Condition (Director picks; default Tired if scene is unremarkable). |
| Max Adrenaline? | 6. (Exchange 6 → 1 Spotlight.) |
| Max Spotlight? | 3. |
| Max Cash? | 5. |
| Max attribute/skill score? | 3. |
| Lethal Bullet start? | 1 (Old Heroes: 2). |
| Cash Flow starting? | 3 Cash + 1 per Session. |
| Solo starting cash bonus? | +2$. |
| OSH starting cash? | 4$ (vs. 1$ core/wok). |
| How many Advancements per Hero? | 3 max. Then reassign / swap / +1 Adrenaline. |
| Time-Out actions per Hero? | 2 (3 if extended; +1 Heat). |
| Can two Plan Bs fire in one Session? | No. Each Plan B once per Campaign, one per Session max. |
| How is Hacking rolled? | `Focus + Know`. (Or `Focus + Fix` for hardware/tech work.) |
| How is Lockpicking rolled? | `Crime + Dexterity`. (Lockpick Feat gives Free Re-roll.) |
| Driving an uncommon ride without training? | -1, unless Proven Driver/Military Bg/Ace. |
| All-In on a failed Re-roll? | Not possible. All-In is only allowed after a Re-roll *improved* your result. |
| Death Roulette result equal to bullets? | Left for Dead (failure). Roll must be *greater than* bullets to survive. |
| Lethal Bullets reset between Shots? | No — only between **Cinematic Campaigns**. |

---

## File pointers

Locations in this repo that are canonical for IDs, costs, and per-entity data — always grep these before guessing:

- `og-data.js` — top: `ATTRS`, `ATTR_SKILLS`. Then `ROLES`, `TROPES`, `FEATS`, `ITEMS_CORE` / `ITEMS_OSH` / `ITEMS_WOK` (combined into `ITEMS`), `CONDITIONS`, `WOK_CONDITIONS`, `OSH_CONDITIONS`, `ORIGINS`, `SUPERPOWERS`, `ROLE_STARTING_GEAR`.
- `og-rules.js` — `itemFeat`, `itemFeatLabel`, `isFirearm`, `fmtRange`, `startingCashBudget`, `loadoutSpent`, `roleStartingGear`, `itemMatchesSlot`.
- `outgunned.html` — source-of-truth for the app. `index.html` is a build artifact from `node build-index.js`. **Never edit `index.html` directly** — it gets regenerated.

---

# WoK Expansion (World of Killers)

Book tag: `wok`. Adds 6 new Roles (5 + 1 Special), 9 new Tropes, ~21 new Feats ("Killer Feats"), Gold currency (group resource), Trained Dogs system, 3 new Conditions, named Italian weapons + new gear feats (Custom / Traditional / Incendiary), new Enemy Feats and Special Actions, and the **Hunt** mechanic (variant chase for tracking targets).

Existing core Roles and Tropes still work; in fact a corebook character playing in WoK may swap **one of their Feats** for a Killer Feat of choice to fit the setting.

## Killer Roles

### Samurai
*Swordsman following a code, urban ronin, or Yakuza member.*
- **Attribute:** Brawn
- **Skills (+1 each):** Endure, Fight, Stunt, Cool, Leadership, Style, Heal, Awareness, Dexterity, Stealth
- **Feats (pick 2):** Combo, Deflect Bullets, Determination, Feint, Sword Fighter, Whirlwind
- **Gear:** Sword (Katana), One 1$ item of choice
- **Jobs:** Bodyguard, Yakuza, Blacksmith

### Hired Gun
*Lone mercenary, pistol-toting killer, or trigger-happy rebel.*
- **Attribute:** Nerves
- **Skills (+1 each):** Endure, Fight, Force, Stunt, Cool, Drive, Shoot, Leadership, Awareness, Stealth
- **Feats (pick 2):** Bad Name, Endure Pain, Gun Fu, Gunslinger, Hard to Kill, Marksman
- **Gear:** Pistol, Telephone, Weapon of choice
- **Jobs:** Mercenary, Bounty Hunter, Enforcer

### Aristocrat
*Noble scion, wealthy heir, or important criminal family member.*
- **Attribute:** Smooth
- **Skills (+1 each):** Drive, Shoot, Flirt, Leadership, Speech, Style, Detect, Heal, Know, Awareness
- **Feats (pick 2):** Bad Name, Cash Flow, Elegance, Heartbreaker, High Culture, Savoir Faire
- **Gear:** Elegant Clothes, items of choice totaling 5$
- **Jobs:** Family Associate, Heir, Belmont

### Dog Trainer
*Bounty hunter with their four-legged partner, canine-unit agent, hobo with their companion.*
- **Attribute:** Focus
- **Skills (+1 each):** Endure, Fight, Stunt, Cool, Survival, Leadership, Detect, Heal, Awareness, Streetwise
- **Feats (pick 2):** Attack Dog, Beware of the Owner, Catch!, Physician, Rescue, Sniffer
- **Gear:** Trained Dog, Pistol OR Rifle OR Shotgun
- **Jobs:** Bounty Hunter, Unemployed, Canine Unit

### Derelict
*Vagrant, scruffy layabout, or so-called waste of space.*
- **Attribute:** Crime
- **Skills (+1 each):** Endure, Shoot, Survival, Speech, Detect, Know, Awareness, Dexterity, Stealth, Streetwise
- **Feats (pick 2):** Expedient, I'll Make a Phone Call, Live and Learn, Pass the Buck, Pickpocket, Shadow
- **Gear:** Nothing
- **Jobs:** Homeless, Rat, Unemployed

### Assassin (SPECIAL ROLE)
*Assassin living by an ancient code, or a ruthless avenger.*
- **Acts as Role + Trope + Job simultaneously.** Mark in all three sections.
- **Attribute Points (2):** Brawn AND Crime
- **Skills (+1 each, 14 total):** Endure, Fight, Force, Stunt, Cool, Drive, Shoot, Leadership, Detect, Fix, Heal, Awareness, Dexterity, Stealth
- **6 free Skill Points** (instead of the normal 2)
- **Feats (pick 3):** Always Prepared, Ambush, Counter, Expedient, Feint, Knife Thrower, Leap, Parkour, Pickpocket, Shadow, Vanish
- **Gear:** Concealed Blade

## Young/Old in WoK

- **Young Heroes** can't play killers — no place in the world.
- **Old Heroes** start with **3 Lethal Bullets** instead of 2, but gain **+1 Gold** to compensate.

## Killer Tropes

### Battle Butler
*Impeccable servant who also fights brutally.*
- Attribute: Brawn OR Nerves
- Skills: Endure, Fight, Force, Cool, Leadership, Style, Heal, Know
- Feats: Bodybuilder, Elegance, Martial Arts, Selfless

### Gone Rogue
*Honest citizen who broke; now looks after themselves only.*
- Attribute: Nerves OR Crime
- Skills: Fight, Force, Cool, Drive, Survival, Fix, Dexterity, Streetwise
- Feats: Gunslinger, Military Background, Pass the Buck, Proven Driver

### Great Performer
*Body deformed by years of dance / sculpting / singing — practice makes perfect.*
- Attribute: Brawn OR Smooth
- Skills: Endure, Fight, Stunt, Flirt, Style, Heal, Dexterity, Stealth
- Feats: Artist, Knife Thrower, Master of Disguise, Parkour

### Honorable Demon
*Unstoppable fury bound by a strict moral code.*
- Attribute: Brawn OR Crime
- Skills: Endure, Fight, Force, Cool, Leadership, Style, Know, Stealth
- Feats: Determination, Elegance, Knife Thrower, Selfless

### Just Wicked
*Killing came easy. You're the boogieman.*
- Attribute: Brawn OR Nerves
- Skills: Endure, Fight, Stunt, Cool, Shoot, Flirt, Leadership, Stealth
- Feats: Bad Name, Determination, Gun Fu, Shadow

### Magnificent Bastard
*Theoretically detestable, beloved by all.*
- Attribute: Smooth OR Crime
- Skills: Fight, Drive, Flirt, Leadership, Speech, Style, Know, Dexterity
- Feats: Always Prepared, Pass the Buck, Proven Driver, Silver Tongue

### Old Fashioned
*Loves the old-fashioned; born in the wrong year.*
- Attribute: Smooth OR Focus
- Skills: Cool, Drive, Shoot, Flirt, Leadership, Style, Detect, Know
- Feats: Elegance, Military Background, Outsmart, Sword Fighter

### Professional
*Trains, plans, does the job, vanishes without a trace.*
- Attribute: Nerves OR Focus
- Skills: Drive, Shoot, Style, Detect, Fix, Awareness, Dexterity, Stealth
- Feats: Detective, Hacker, Marksman, Scientist

### Saint
*Person of faith with a warrior's spirit underneath.*
- Attribute: Focus OR Smooth
- Skills: Cool, Drive, Shoot, Leadership, Speech, Style, Heal, Know
- Feats: Determination, Gun Fu, Pep Talk, Silver Tongue

## Killer Feats (21 new feats)

### Ambush
*When they notice you, it's already too late.*
Free Re-roll for all Action Rolls made to attack unaware targets with melee weapons or bare hands.

### Attack Dog
*Your dog only bites.*
While fighting side-by-side with your Trained Dog, Free Re-roll for all Action and Reaction Rolls made to fight Enemies in Melee or Close Range.

### Bad Name
*Your reputation precedes you.*
You immediately gain a Reputation, 1 Gold, 1$ and 1 Adrenaline.

### Beware of the Owner
*Don't touch the dog.*
**[Quick Action]** Once per combat or scene, after your Trained Dog has lost 1 Grit, you immediately gain 1 Adrenaline.

### Catch!
*Flick of the hand and the dog leaps.*
**[Quick Action]** Your Trained Dog bites a target within Close Range. The target loses 1 Grit, OR you gain +1 Speed during a chase on foot.

### Deflect Bullets
*Cut bullets in half mid-flight.*
**Requires Sword Fighter.** Using your sword, deflect a hail of bullets without rolling. Flip a coin — Heads: ricochet one bullet back, Enemy loses 1 Grit.

### Determination
*Inner strength cannot be shaken.*
Make a Reaction Roll of any kind using `Endure +1` instead of the required Skill.

### Elegance
*Such class.*
Free Re-roll for all rolls involving high society, refined manners, or etiquette.

### Endure Pain
*No pain!*
Remove one Condition from yourself. Cannot remove Broken.

### Expedient
*Always know how to get by.*
Make an Action or Reaction Roll of any kind using **Streetwise** instead of the required Skill.

### Feint
*Fight with your head, not just your hands.*
Repeat an Action Roll against an Enemy. Ignore all Conditions.

### Gun Fu
*Point-blank gunshots + martial arts.*
When fighting with a loaded pistol or revolver, Free Re-roll for all Action and Reaction Rolls made in Melee or Close Range.

### Leap
*Always land on something soft.*
Jump from any height — land without consequences. When jumping onto Enemies from up high, +1.

### Live and Learn
*Learn from mistakes — especially other people's.*
After another Hero has failed a roll, you automatically succeed in the same roll without rolling the dice.

### Pass the Buck
*To err is human; suckers pay their own consequences.*
A friend suffers the consequences of a failure instead of you.

### Rescue
*The dog swoops in at the last second.*
Your Trained Dog prevents a Hero from suffering Broken, OR saves a Hero who lost their spin on the Death Roulette. The rescued Hero adds a Lethal Bullet as usual.

### Savoir Faire
*Get through hardship with grace.*
Make an Action or Reaction Roll of any kind using **Style** instead of the required Skill.

### Sniffer
*Hyper-trained dog nose.*
Free Re-roll for all rolls made to follow a trail or to locate an enemy ambush while you're with your Trained Dog. As a Quick Action, spend 1 Adrenaline to find an Enemy's Weak Spot.

### Sword Fighter
*In a world of guns, you bring a sword.*
Free Re-roll when using, repairing, evaluating, or handling a sword or other melee weapon.

### Vanish
*Now they see you, now they don't.*
**[Quick Action]** Get out of a dangerous situation, or abandon a chase or combat without rolling the dice. Spend 1 Adrenaline to reappear in another position within Medium Range.

### Whirlwind
*Spin the blades.*
**Requires Sword Fighter.** After striking an Enemy with a Melee weapon, make a second Action Roll with -1. No Free Re-roll on this second roll.

## Gold — Group Currency

Gold is a **group resource** noted on the Mission Sheet. Starts at = number of Heroes.

- **Spend 1 Gold** for: Belmont services / Killer Gear / favors from Killers or Rats. **One unit of Gold buys one thing**, regardless of the thing's normal $ value.
- **Earn 1 Gold** per successful Stone/Belmont/Family mission, or per bounty taken. (Bounty also pays 1–3$ Cash.)
- **Sell 1 Gold for 3$** at any pawn shop (rarely worth it).

Gold cannot be counterfeited (Stone controls the mints).

## Killer Gear (purchased with Gold)

**1 Gold per item** at Belmont establishments.

| Item | Feats / Notes |
|---|---|
| **Viper (Pistol)** | Accurate · Custom · Quiet · Range: 0 / +1 / 0 / -2 |
| **Banshee (Shotgun)** | Custom · Short Range · Range: +1 / +1 / 0 / -2 |
| **Lamia (Assault Rifle)** | Accurate · Custom · Rapid Fire · Range: 0 / +1 / +2 / +1 |
| **Siren (Precision Rifle)** | Accurate · Custom · Precision Shot · Range: X / 0 / 0 / +2 |
| **Perfect Katana** | Traditional · Grants Help to cut |
| **Incendiary Arrows (6)** | Bow projectiles, Incendiary |
| **Incendiary Ammo (2)** | Shotgun mags, Incendiary |
| **Bulletproof Suit** | Custom · Grants Help to make a good impression AND to dodge bullets |
| **Armored Car** | Speed 2 · Type: Car + Armored |
| **Bolide** | Speed 3 · Type: Car OR Bike |
| **Concealed Blade** | Grants Help to hit unaware targets |
| **Exclusive Invite** | Access to an exclusive place or event |

### New Gear Feats

- **Custom** — Tailored to one buyer. Anyone else using it suffers -1.
- **Traditional** — Crafted by ancient technique. If you have a Free-Re-roll Feat for this weapon (e.g., Sword Fighter), also gain +1 to all Action/Reaction Rolls with it.
- **Incendiary** — Ignores Bulletproof Vest and Armored Enemy Feats.

## WoK Conditions

| id | Label | Penalty / Effect |
|---|---|---|
| `drunk` | Drunk | All your rolls become Gambles. At the start of each Action Turn flip a coin — Heads: -1 next roll. Tails: +1. Sleeping it off turns Drunk into Tired. |
| `blinded` | Blinded | -1 to all rolls that involve eyesight. Removed at end of Scene (wash eyes / leave smoke); severe cases require Time-Out medical care. |
| `poisoned` | Poisoned | Start of each Turn: flip a coin. Heads: lose 1 Grit. If at 0 Grit and would lose more from this Condition, become Broken instead of spinning the Roulette. Removed with antidote (`Focus+Heal Critical` Time-Out action; some require a 1-Gold rare antidote). |

## WoK Plan B variants

- **Bullet** AND **Blade** share one Plan B slot. Pick one per Campaign.
- **Backup** is **replaced by Belmont** (call on Belmont services / personnel) — unless you're a Renegade, in which case Backup is gone entirely.

## Trained Dogs (and other animals)

Supporting-Character-style stat block, but **cannot be Left for Dead and cannot be sacrificed.** When the dog would lose Grit beyond 0, the bonded Hero takes the hit and adds a Lethal Bullet to their Death Roulette.

- 3 Grit (lose 1 at a time).
- 3 in every Attribute, +6 free at creation.
- 1 Help feature (e.g., "Guard Dog: prevents ambushes").
- 1 Flaw (e.g., "Drools everywhere").
- Acts on its Hero's Action Turn (the Hero chooses turn-by-turn whether to act themselves or pass the turn to the dog). Reacts when: it had an Action Turn; an Enemy uses a Special Action targeting it / the group; the Director asks.

**Getting a Trained Dog:** Dog Trainer Role starts with one. Director may grant one at a Turning Point. Or buy one for **3 Gold** (rare exception to the 1-Gold rule).

Pattern works for hawks, monkeys, big cats, etc.

## WoK Enemy Additions

### Enemy Feats

**1-point:**
- **Thermal Imagers** — Heroes can't use shadows; -1 to all rolls vs. the Enemy in dark spaces unless they wear Night Vision.
- **Troublemakers** — Heroes failing Reaction (< Basic) become Angry, or lose 1 Grit if already Angry.

**2-point:**
- **Incendiary Bullets** — No bonus from Bulletproof Vests/Suits or Partial Cover; all Reaction Rolls are Gambles.
- **Samurai** — Heroes without Sword Fighter: -1 to Action/Reaction in Melee/Close.

**3-point:**
- **Poisoned Weapons** — Heroes failing Reaction (< Basic) become Poisoned, or lose 1 extra Grit if already Poisoned. Trained Dogs hit by these lose 2 Grit at once.
- **Grapplers** — Hero in Melee trying to move first passes `Brawn+Dexterity Critical Action`. Fail: -1 to next Reaction.

### Stone Resources

Enemies sent directly by the Stone or Belmont (e.g., Pretorians) gain **+1 Feat Point** above their Type's default.

### Special Actions

**1-Adrenaline:**
- **Smoke Bombs** — All Heroes within Medium Range become Blinded until end of combat or until they leave the area / disperse the smoke. Night Vision wearers are immune.
- **Stand in the Way** — When a Hero does something other than attack with their action, the Enemy blocks them; Hero loses the action.

**2-Adrenaline:**
- **Pincer Maneuver** — Next Action Turn: Heroes who don't use Quick Action to move become Surrounded (-1 to next Reaction).
- **Poisoned Strike** — Hero enters Melee, fails `Brawn+Endure Critical Reaction` → becomes Poisoned AND Confused.

**3-Adrenaline:**
- **Combat Drugs** — Enemy recovers 2 Grit, gains 1 Adrenaline, becomes immune to persuasion/intimidation, gains Walking Hazard and Relentless Feats.
- **You're Coming With Me** — After last Grit box fills, Enemy targets the killer (or most-hated Hero). Hero fails Director-set Extreme Reaction → must spin Death Roulette.

## Hunt mechanic (chase variant)

Variant of the Chase rules for *tracking a target* rather than fleeing/pursuing. Replaces Speed with **Kill** track — every Hero who fails a roll decreases Kill by 1. Includes its own Special Actions ("Let There Be Light", "Sea of People", "Suppression Fire", "Unwanted Attention", "A Toast!", "High Tension", "Tapping", "Third Wheel", "Alarm!", "Extraction"). Not enumerated here; if implementing Hunt-mode, read `OG_WoK_ENG.md:2732+`.

---

# OSH Expansion (Outgunned Superheroes)

Book tag: `osh`. The biggest expansion — adds 17 Roles (15 + Marvel + Prodigy), 21 Tropes, 14 named Superpowers + 2 special Superpowers (Specialty, One of a Kind, Invincible), 45 Feats (a **different list** from corebook — some duplicates by name but with new texts), **Power** (replaces Adrenaline conceptually), 4 new Conditions including **Powerless** and **Exhausted**, Origins, super-weapons + super-rides, Power Tiers (Street / World / Cosmic), revised starting Cash (4$ + free items), and the Gadget/Super-Ride feat path for hyper-tech equipment.

> OSH characters use **Power** (`⚡`) in place of Adrenaline mechanically. The two are equivalent at the table — `og-data.js` and the app's UI keep the name "adrenaline" / "Power" interchangeable depending on `coreBook`. The `adrenalineName()` helper in `og-rules.js` returns the right label for the current character.

## Origin

OSH Heroes pick one Origin. Mostly narrative — occasional situational Help / Hindrance.

- **Alien** — alien or alien-parasite-bonded.
- **Arcane** — born / taught / granted mystical powers.
- **Divine** — avatar of a god, or has divine powers.
- **Eternal** — power from the Eternity Shards.
- **Evolved** — naturally developed during puberty.
- **Experiment** — result of a scientific experiment.
- **Mutation** — caused by an accident or creature.
- **Myth** — connected to a legend or folk tradition.
- **Prototype** — experimental tech, or you are a robot.
- **Simple Human** — no innate power. Trades the Role's Superpower for the **Specialty** Superpower (one free extra Feat instead).

## Power Tiers — group decision before play starts

| Tier | Scale | Difficulty shift |
|---|---|---|
| **Street** | City patrol, neighborhood crime. | Default; Section 3 difficulties unchanged. |
| **World** | Protect Earth from world-scale threats. | All "Extreme" → Critical; all "Critical" → Basic; all "Basic" → auto-success. Thugs/goons no longer count as Enemies. |
| **Cosmic** | Inter-planetary; Galaxy / Multiverse stakes. | Routine super-feats need no dice; ordinary enemies trivial. |

The Tier is a group convention about what "Critical Success" *means* in this campaign, rather than a numeric modifier. Don't mix tiers per Hero.

## OSH Roles

All Roles in OSH grant: **+1 Attribute Point** (choose between 2), **+1 to 10 Skills**, **2 Feats from a list of 6**, **1 named Superpower** tied to the Role. No "starting gear" line — see "Starting Cash" below.

### the Armored
- **Origin:** Alien, Prototype, Simple Human
- **Attribute:** Nerves OR Focus
- **Superpower:** Hyper-technological Armor
- **Skills:** Endure, Fight, Stunt, Cool, Drive, Shoot, Speech, Style, Detect, Fix
- **Feats:** Barrier, Bulletproof, Personal A.I., PhD, Unlimited Funds, Unstoppable Force

### the Beast
- **Origin:** Evolved, Mutation, Myth
- **Attribute:** Brawn OR Crime
- **Superpower:** Natural Predator
- **Skills:** Endure, Fight, Stunt, Cool, Survival, Leadership, Detect, Awareness, Stealth, Streetwise
- **Feats:** Jump, Monster, Pint-Sized, Regeneration, Super Senses, Trained Fighter

### the Blaster
- **Origin:** Eternal, Evolved, Prototype
- **Attribute:** Brawn OR Smooth
- **Superpower:** Kinetic Energy
- **Skills:** Endure, Fight, Cool, Shoot, Leadership, Speech, Fix, Heal, Awareness, Stealth
- **Feats:** Barrier, Cyborg, Flight, Hard to Kill, Trained Fighter, Unstoppable Force

### the Champion
- **Origin:** Experiment, Divine, Myth
- **Attribute:** Brawn OR Nerves
- **Superpower:** Enhanced Body
- **Skills:** Endure, Fight, Force, Stunt, Cool, Survival, Flirt, Leadership, Awareness, Dexterity
- **Feats:** Flight, Gadget, Jump, Hard to Kill, Lord of the Seas, Team Leader

### the Elemental
- **Origin:** Evolved, Divine, Mutation
- **Attribute:** Nerves OR Smooth
- **Superpower:** Elemental Control
- **Skills:** Endure, Fight, Shoot, Survival, Flirt, Leadership, Style, Know, Stealth, Streetwise
- **Feats:** Barrier, Bulletproof, Flight, Incorporeal, Lord of the Seas, Unstoppable Force

### the Force Master
- **Origin:** Evolved, Divine, Mutation
- **Attribute:** Nerves OR Focus
- **Superpower:** Force Control
- **Skills:** Endure, Force, Cool, Shoot, Survival, Flirt, Leadership, Fix, Heal, Know
- **Feats:** Barrier, Energy Manipulation, Gadget, Invisible, PhD, Unstoppable Force

### the Maverick
- **Origin:** Alien, Evolved, Simple Human
- **Attribute:** Nerves OR Crime
- **Superpower:** Specialty
- **Skills:** Fight, Stunt, Drive, Shoot, Flirt, Speech, Fix, Dexterity, Stealth, Streetwise
- **Feats:** Bullseye, Energy Manipulation, Gadget, Heartbreaker, Silver Tongue, Super-Ride

### the Psychic
- **Origin:** Alien, Evolved, Arcane
- **Attribute:** Smooth OR Focus
- **Superpower:** Mind Powers
- **Skills:** Endure, Cool, Flirt, Leadership, Speech, Style, Detect, Heal, Know, Awareness
- **Feats:** Detective, Energy Manipulation, Flight, Foresight, Mind Control, Speak with Animals

### the Shadow
- **Origin:** Evolved, Prototype, Simple Human
- **Attribute:** Focus OR Crime
- **Superpower:** Dark Presence
- **Skills:** Fight, Stunt, Cool, Leadership, Detect, Fix, Heal, Awareness, Dexterity, Stealth
- **Feats:** Detective, Gadget, Invisible, Prep Time, Super Senses, Trained Fighter

### the Shapeshifter
- **Origin:** Alien, Evolved, Arcane
- **Attribute:** Smooth OR Crime
- **Superpower:** Shapeshift
- **Skills:** Stunt, Drive, Flirt, Speech, Style, Detect, Know, Dexterity, Stealth, Streetwise
- **Feats:** Heartbreaker, Monster, PhD, Power-Mirror, Regeneration, Speak with Animals

### the Sorcerer
- **Origin:** Divine, Arcane, Myth
- **Attribute:** Smooth OR Focus
- **Superpower:** Arcane Powers
- **Skills:** Cool, Shoot, Flirt, Leadership, Speech, Style, Detect, Know, Dexterity, Stealth
- **Feats:** Barrier, Familiar, Flight, Gadget, Mind Control, Multiple Hero

### the Speedster
- **Origin:** Evolved, Divine, Mutation
- **Attribute:** Brawn OR Smooth
- **Superpower:** Super-Speed
- **Skills:** Fight, Stunt, Flirt, Speech, Style, Detect, Fix, Awareness, Dexterity, Stealth
- **Feats:** Hacker, Incorporeal, Sonic Boom, Super Senses, Trained Fighter, Wall-Climber

### the Tank
- **Origin:** Alien, Experiment, Evolved
- **Attribute:** Brawn OR Smooth
- **Superpower:** Incredible Strength
- **Skills:** Endure, Fight, Force, Stunt, Cool, Survival, Detect, Fix, Heal, Awareness
- **Feats:** Trained Fighter, Lord of the Seas, Jump, Unstoppable Force, Immortality, Bulletproof

### the Teleporter
- **Origin:** Evolved, Arcane, Myth
- **Attribute:** Brawn OR Crime
- **Superpower:** Teleportation
- **Skills:** Stunt, Shoot, Survival, Speech, Detect, Heal, Awareness, Dexterity, Stealth, Streetwise
- **Feats:** Acrobat, Detective, Energy Manipulation, Familiar, Foresight, Hacker

### the Weaponmaster
- **Origin:** Experiment, Mutation, Simple Human
- **Attribute:** Brawn OR Nerves
- **Superpower:** Battleborn
- **Skills:** Fight, Stunt, Drive, Shoot, Speech, Style, Heal, Awareness, Dexterity, Stealth
- **Feats:** Acrobat, Cyborg, Gadget, Jump, Regeneration, Super Senses

### the Marvel (Incredible Role — also acts as Trope)
*Cannot pick a Trope if Marvel is chosen.*
- **Origin:** Alien, Divine, Eternal
- **Attribute Points (2):** Brawn AND Smooth
- **Superpower:** Invincible
- **Skills (+1 each, 12 total):** Endure, Fight, Force, Stunt, Cool, Shoot, Flirt, Leadership, Detect, Know, Awareness, Dexterity
- **Feats (pick 3 of 12):** Bullseye, Detective, Foresight, Jump, Heartbreaker, Hard to Kill, Immortality, Sonic Boom, Super Senses, Regeneration, Team Leader, Unstoppable Force

### the Prodigy (Incredible non-Role)
*The Trope you'd normally pick fills your "Role" slot; pick a 2nd Trope as your normal Trope slot. Examples: "Billionaire Genius Prodigy", "Working-class Hero Prodigy".*
- **Origin:** Eternal, Evolved, Mutation
- **Superpower:** One of a Kind (pick 1 Superpower + 1 Feat, or 2 Feats — anything except Invincible)
- **Attribute, Skills, Feats:** Granted entirely by your two Tropes
- **Gain 2 extra free Skill Points** (4 total).

## OSH Tropes (21)

Each Trope: 1 Attribute Point (choose between 2), 8 Skills, 1 of 4 Feats.

### Anti-hero
- Attribute: Nerves OR Crime
- Skills: Fight, Stunt, Cool, Drive, Shoot, Flirt, Stealth, Streetwise
- Feats: Energy Manipulation, Immortality, Trained Fighter, Unstoppable Force

### Billionaire Genius
- Attribute: Smooth OR Focus
- Skills: Shoot, Flirt, Speech, Style, Detect, Fix, Know, Stealth
- Feats: Heartbreaker, Personal A.I., PhD, Unlimited Funds

### Charming Misfit
- Attribute: Nerves OR Smooth
- Skills: Stunt, Drive, Shoot, Speech, Style, Dexterity, Stealth, Streetwise
- Feats: Gadget, Prep Time, Silver Tongue, Super-Ride

### Chatty Mercenary
- Attribute: Nerves OR Smooth
- Skills: Endure, Fight, Stunt, Drive, Shoot, Speech, Dexterity, Streetwise
- Feats: Bullseye, Monster, Regeneration, Trained Fighter

### Country Boy/Girl
- Attribute: Brawn OR Smooth
- Skills: Fight, Force, Stunt, Survival, Flirt, Speech, Heal, Awareness
- Feats: Bulletproof, Flight, Team Leader, Unstoppable Force

### Cynical Tinkerer
- Attribute: Focus OR Crime
- Skills: Drive, Shoot, Survival, Leadership, Fix, Dexterity, Stealth, Streetwise
- Feats: Cyborg, Hacker, PhD, Pint-Sized

### Dark Knight
- Attribute: Brawn OR Crime
- Skills: Fight, Stunt, Cool, Leadership, Detect, Fix, Awareness, Stealth
- Feats: Gadget, Super-Ride, Trained Fighter, Unlimited Funds

### Deadly Beauty
- Attribute: Smooth OR Crime
- Skills: Fight, Shoot, Flirt, Style, Detect, Know, Dexterity, Stealth
- Feats: Bulletproof, Heartbreaker, Mind Control, Trained Fighter

### Good Advisor
- Attribute: Smooth OR Focus
- Skills: Cool, Leadership, Speech, Detect, Heal, Know, Stealth, Streetwise
- Feats: Barrier, Mind Control, Prep Time, Team Leader

### Hot Mess
- Attribute: Brawn OR Smooth
- Skills: Fight, Stunt, Drive, Shoot, Flirt, Style, Dexterity, Streetwise
- Feats: Energy Manipulation, Heartbreaker, Multiple Hero, Unstoppable Force

### Humorless Grouch
- Attribute: Brawn OR Focus
- Skills: Endure, Fight, Cool, Drive, Shoot, Leadership, Know, Awareness
- Feats: Cyborg, Gadget, Hard to Kill, Team Leader

### Most Dangerous
- Attribute: Nerves OR Focus
- Skills: Endure, Cool, Leadership, Heal, Know, Awareness, Dexterity, Streetwise
- Feats: Energy Manipulation, Familiar, Trained Fighter, Unstoppable Force

### Nosy Four-eyes
- Attribute: Focus OR Crime
- Skills: Speech, Detect, Fix, Heal, Know, Awareness, Dexterity, Stealth
- Feats: Detective, Gadget, Hacker, PhD

### Of Few Words
- Attribute: Brawn OR Crime
- Skills: Endure, Fight, Force, Cool, Survival, Leadership, Heal, Awareness
- Feats: Barrier, Bulletproof, Monster, Unstoppable Force

### Sassy Genius
- Attribute: Nerves OR Focus
- Skills: Stunt, Drive, Shoot, Leadership, Speech, Fix, Heal, Know
- Feats: PhD, Gadget, Pint-Sized, Shrinkage

### Sentimental Rebel
- Attribute: Nerves OR Smooth
- Skills: Endure, Cool, Shoot, Survival, Flirt, Leadership, Know, Streetwise
- Feats: Heartbreaker, Familiar, Flight, Silver Tongue

### Super Soldier
- Attribute: Brawn OR Nerves
- Skills: Endure, Fight, Stunt, Cool, Drive, Shoot, Leadership, Stealth
- Feats: Bulletproof, Gadget, Team Leader, Trained Fighter

### Tough Exterior
- Attribute: Brawn OR Nerves
- Skills: Endure, Fight, Stunt, Cool, Drive, Survival, Leadership, Streetwise
- Feats: Bulletproof, Hard to Kill, Immortality, Regeneration

### Tragic Past
- Attribute: Nerves OR Crime
- Skills: Stunt, Survival, Fix, Heal, Awareness, Dexterity, Stealth, Streetwise
- Feats: Cyborg, Incorporeal, Pint-Sized, Sonic Boom

### Walking Hazard
- Attribute: Focus OR Crime
- Skills: Fight, Cool, Drive, Detect, Heal, Awareness, Stealth, Streetwise
- Feats: PhD, Power Absorption, Sonic Boom, Unstoppable Force

### Working-class Hero
- Attribute: Brawn OR Crime
- Skills: Fight, Stunt, Drive, Shoot, Speech, Fix, Stealth, Streetwise
- Feats: Acrobat, Trained Fighter, Silver Tongue, Super Senses

## Superpowers

A Hero's Superpower is granted by their Role. It's always-on (with passive bonuses + a Free Re-roll on a relevant skill) and may grant **Super Weapons** with their own Gear Feats. Most Superpowers come with one or more **Special Actions** that cost Power (`⚡`) to activate.

When **Powerless**, the Superpower turns off entirely (and Feats connected to it).

### Arcane Powers (Sorcerer)
Start with **2 Power** instead of 1. Powerless = can't use arcane.
- Summon small everyday objects, create illusions, telekinetically move unanchored objects.
- Complex actions: `Smooth+Leadership` (Free Re-roll).
- Super-weapons (pick 1 of 2 made of light): **Magical Weapon** (Melee, Perfect) or **Arcane Missile** (Energy Weapon).
- **Astral Projection [Full Turn]** (1 Power) — projection that floats, sees, hears, speaks, phases through walls; physical body must remain still; dissolves on hit / focus loss.

### Battleborn (Weaponmaster)
Pick one weapon type (bows, guns, melee). Free Re-roll for using/repairing/evaluating that type.
- **Guns:** 2 Guns + 6 Mags free. Once per Turn, reload as a free action. Dual-wielding: +1.
- **Bows:** 1 Bow + 24 arrows free. +1 to shoot arrows. Aim a Turn: +1 more.
- **Melee:** 1 weapon (or pair) of chosen type free with **Perfect**. +1 fighting with chosen weapon; +1 to dodge projectiles when wielding a pair of the same type.

### Dark Presence (Shadow)
Free Re-roll on all Crime rolls + +1 to ambush / strike unaware Enemies.
- **Vanish [Quick Action]** (1 Power) — hide, escape grapple, reach Partial/Total Cover. Same Turn, spend 1 more Power to reappear in a nearby visible position.

### Elemental Control (Elemental)
Pick element: Water / Electricity / Fire / Ice / Storm / Earth / Wind. Immune to your element while not Powerless. Granted super-weapon **Elemental Ray** (Energy Weapon).
- **Elemental Form [Quick Action]** (1 Power) — until end of combat/scene, fly (as Flight feat) and Free Re-roll using element + Elemental Ray.

### Enhanced Body (Champion)
Free Re-roll all Brawn rolls + automatic **Trained Fighter** Feat.
- **I can do this all day** — Once per Scene, when losing >3 Grit at once, gain 1 Power. No Power cost.

### Force Control (Force Master)
Pick: **Cosmic Force** (telekinesis, flying platforms, Quick-Action Partial-Cover shield) OR **Electromagnetic Force** (control ferromagnetic metals).
- Complex actions: `Focus+Cool` (Free Re-roll).

### Hyper-technological Armor (Armored)
Putting on the armor = Full Turn. While worn: Brawn=3 (always), ignore Hurt penalties, **Flight**, breathe underwater & in space.
- Super-weapon **Energy Beam** (Energy Weapon, Maximum Power) in hands or chest. Free Re-roll all attacks with Energy Beam or added ranged weapons.
- **Recall [Quick Action]** (1 Power) — when nearby, summon armor onto your body.

### Incredible Strength (Tank)
+1 all Force/Endure rolls. Ignore all -1 Conditions on Brawn rolls while not Powerless. Always **Help** crashing/lifting/throwing/breaking; always **Hindrance** going unnoticed / squeezing.
- If always-on: gain **Monster**. If reversible: gain **Transformation**.
- **Smash!** — destroy an object/ride OR +2 to a Brawn roll.

### Invincible (Marvel — Role only)
Free Re-roll all Brawn rolls + auto **Flight**, **Energy Manipulation**, **Bulletproof**, **Only Weakness**. +6 extra free Skill Points (8 total).

### Kinetic Energy (Blaster)
Super-weapon **Kinetic Ray** (Energy Weapon, Maximum Power, Impact). +1 and Free Re-roll to shoot Kinetic Ray.
- **Explosive Force** — +1 to attacks with Kinetic Ray; Kinetic Ray temporarily gains **Explosive**.

### Mind Powers (Psychic)
Telepathy, telekinesis, mental illusions. Complex actions: `Focus+Endure` (Free Re-roll). Read thoughts / find someone: `Focus+Detect`.
- **Whisper [Quick Action]** (1 Power) — persuade a non-hostile, OR confuse an Enemy granting +1 to an ally.

### Natural Predator (Beast)
Free Re-roll all Awareness rolls + tracking. Super-weapon **Claws** (Melee Weapon, Sharp, +1).
- Pick a free Feat: **Acrobat**, **Wall-Climber**, or **Bulletproof**.

### One of a Kind (Prodigy — non-Role only)
Pick 1 Superpower + 1 Feat (OR 2 Feats). Cannot pick **Invincible** without group consent. +2 extra free Skill Points (4 total).

### Shapeshift (Shapeshifter)
Pick: **Humanoid** (full appearance/voice change, Full Turn), **Animal** (any animal form, Full Turn), or **Elastic** (rubber body, Help squeezing/catching/dodging, +1 Quick Action per Turn; Full Turn to inflate).
- **Quick-Change [Quick Action]** — transform without spending Full Turn.

### Specialty (Maverick — and any Simple Human)
Pick one extra Feat of any kind — that *is* your Superpower. **Start with 2 Spotlights** instead of 1.
- **Underdog** — repeat any roll, ignoring all Condition penalties except Powerless.

### Super-Speed (Speedster)
Free Re-roll to run; +2 chasing / running away / catching. **+1 Quick Action per Turn.**
- **Be Right Back [Full Turn]** — reach a place you can run to, grab/drop something, come back. No Power cost.
- **In a Flash! [Quick Action]** (1 Power, once per Turn) — pick one: run to a known place to take/leave object/person; abandon combat; change clothes / put on super-suit; auto-pass a Reaction Roll; second Action Roll at -1 with no Free Re-roll.

### Teleportation (Teleporter)
Teleport at will to anywhere you see. Full Turn focus to teleport to any familiar place on the planet. Free Re-roll Reaction Rolls in combat (unless surprised).
- **Round Trip [Quick Action]** (1 Power) — teleport to a known visible spot, grab something, return.
- **Group Teleport** (1 Power) — bring 1 other person with you.

### "Show Off Your Superpower" — any Superpower

When you want to do something extreme that isn't on the list, **spend 1–3 Power** (Director sets the cost based on scale + plot impact):
- **1** — affects one person / one item smaller than you; doesn't change the plot.
- **2** — affects a few people / a car-sized object; can swing a Scene.
- **3** — affects a large group / a building-sized object; serious plot impact.

Director may require a roll. On failure: lose 1 Power, OR partial success at a cost, OR become Powerless for several Turns.

## Power (replaces Adrenaline conceptually for OSH)

OSH's `Power` resource is the equivalent of corebook `Adrenaline`. Range, gain triggers, and most spending options are identical — but with these OSH-specific tweaks:

**Spend:**
- 1 Power = +1 to a roll.
- 1+ Power = activate a Superpower / Feat special action.
- 1+ Power = **Show Off Your Superpower**.
- 6 Power = exchange for a Spotlight.

**Gain (automatic):**
- 1 Power at character creation (2 if Arcane Powers).
- 1 Power on filling the Power Box (was "Hot Box" in core terms — same box 12).
- 1 Power at the start of a Time-Out.
- 1 Power per **Recharge** action during a Time-Out.
- 1 Power via **One Last Effort** (see below).

**One Last Effort** — when you have 0 Power and need it, gain 1 Power to spend *immediately*. After this you become **Exhausted**. If used to activate something that lasts the Scene, you act 3 Turns before becoming Exhausted.

**Lose Power** — Director can strip 1 Power as a consequence of a bad failure or specific Enemy Special Actions.

## OSH Spotlights — small differences from corebook

Same 3-max, same auto-Extreme / save-friend / remove-Condition / save-ride / "do whatever" menu, **PLUS**:
- **Show Off Your Superpower without spending Power.**
- Cannot remove **Powerless** with a Spotlight.

Flip-a-coin refund rule unchanged.

## OSH Conditions

The 5 core attribute Conditions + Tired + Broken work the same as corebook. **Broken cap is bypassed by Powerless only** — you can become Powerless even at 4 Conditions.

New conditions:

| id | Label | Effect |
|---|---|---|
| `powerless` | Powerless | **Cannot spend Power. Cannot use Superpower or connected Feats.** Caused by exposure to Only Weakness, losing the source of powers, or running out of Grit then failing another Dangerous Roll. Removed by retrieving the source / spending a Turn far from weakness; if from Grit-loss, removed by a Time-Out Recharge action. |
| `exhausted` | Exhausted | **Cannot gain or spend Power. Cannot use super-weapons.** From over-exertion or One Last Effort. Removed after 2 Turns rest without losing Grit, OR at the start of a Time-Out. |
| `defeated` | Defeated | -1 to rolls to withstand pain/fear and to encourage others. From losing a crucial challenge or someone being hurt because you failed. Removed by setting an example / via Time-Out `Smooth+Leadership Critical`. |
| `blocked` | Blocked | -1 to all body-movement rolls; **-3 to walk/run**. From imprisonment, mental holds, sticky substances, overwhelming gravity. Removed by getting free from the binding force. |

**Death rule change:** instead of spinning the Death Roulette right away when out of Grit, the first failed Dangerous Roll past 0 Grit imposes **Powerless** first (suit shuts down / transformation drops / etc.). The next failure after that goes to the Roulette.

## OSH Feats (45 — different list from corebook)

> **Shared name, different effect:** some Feats appear in both corebook and OSH but have OSH-specific text. When operating on an OSH character, use the OSH text.

### Acrobat
Free Re-roll to run, jump, balance, and acrobatics.

### Barrier
Stop water/flames/wind, contain small explosions.
**Indestructible Barrier [Full Turn]** (1 Power) — summon Total Cover for yourself + 4 others; lasts while you remain still and focused.

### Bulletproof
Immune to firearms (not energy / explosive). Friends can use you as Partial Cover.

### Bullseye
Free Re-roll to hit a target with a small object or ranged weapon.

### Cyborg
Hyper-technological prosthesis or fully synthetic. Free Re-roll all Fix rolls. **Hurt is removed via `Fix` instead of `Heal`** on you.
**Solid Metal** (1 Power) — repeat a failed Dangerous Reaction Roll.

### Detective
Free Re-roll when looking for clues, following trails, or searching a room.

### Energy Manipulation
Gain super-weapons **Energy Blade** (Melee, Perfect) + **Energy Bolt** (Energy Weapon).
Can be picked twice — second pick gives Energy Bolt the **Maximum Power** feat.

### Familiar
Have a small companion (animal, magical creature, robot, etc.). Familiar makes a Quick Action each Turn, always tries to Help. Shares your Grit; can never be Left for Dead.

### Flight
Fly freely; hover. Stunt skill used for fast/agile flight.

### Foresight
Once per Session, predict a friend's or your own action — choose to let it play out OR rewind and pick differently OR warn friends.
**Read your Opponent** — when an Enemy uses a Special Action, spend Power = Action's level to cancel it.

### Gadget
Pick one Gadget from Section 6 (hyper-tech / magical / legendary weapon or item). Can pick more than once.

### Giant Growth
During a Time-Out: become a giant to barricade / clear rubble / dam.
**Giant Form [Full Turn]** (1 Power) — quickly become a giant. While giant: Brawn=5; lose half rounded-up Grit on hits; auto-fail all Crime rolls; act on every other Action Turn (still react every Reaction Turn). Drop returns you to normal — also makes you Tired (or Broken if already Tired).

### Hacker
Free Re-roll all rolls about computers, hacking, or bypassing IT security.

### Hard to Kill
Filling the Bad Box: gain 1 **Power** (not Adrenaline) and +1 to your next roll.

### Heartbreaker
Free Re-roll when seducing or making a good impression.

### Immortality
Practically immortal. When Left for Dead, once per Turn flip a coin — Tails: return to life, recover 1 Grit, brush off one Condition. Cut to pieces / buried: 2 days to regenerate.

### Incorporeal
Walk through walls with a Full Turn.
**Phase Shift** (1 Power) — instantly become incorporeal (while running/falling), no Turn cost. OR dodge one melee attack without rolling.

### Invisible
Quick Action: full invisibility (or revisible). While invisible: Help avoiding location; if you opt not to attack, Enemy loses you for next Reaction Turn. Visibility breaks on losing 2+ Grit, any Condition, or by choice.

### Jump
Long/high jumps; no Grit from falls.
**Leap Attack** (1 Power) — jump onto distant/flying Enemy as if Melee; +1 and Free Re-roll on this attack.

### Lord of the Seas
In water: Free Re-roll all rolls + Help swimming + breathe underwater. Communicate with sea creatures.
**Call of the Sea [Quick Action]** (1 Power) — summon sea creature Help.

### Mind Control
Free Re-roll to persuade someone to cooperate / help.
**Puppet [Full Turn]** (1 Power) — control a Supporting Character; can't ask them to harm themselves. Control breaks on Grit-loss / Conditions / focus-loss. Enemy version: Action Roll with difficulty = Enemy Defense.

### Monster
Appearance hindrance interacting socially; Help intimidating.

### Multiple Hero
During Time-Outs, make copies of yourself for an extra action.
**Multiplication [Full Turn]** — `Smooth+Endure` roll. 1 copy per Basic, 3 per Critical, 9 per Extreme. Copies act once per Turn (Quick Action only); each counts as 1 extra Grit (sacrifice copies instead of taking Grit). Copies dissolve on hit / distance / Powerless / scene end. Losing all copies = Tired (Broken if already Tired).

### New Powers
Gain a new Superpower (except Invincible / One of a Kind), if story-justified and group-approved.

### Only Weakness
Pick or have-Director-pick a weakness (artifact stolen / space crystal / etc.). Exposure = Powerless. Only pickable at creation; grants an extra Feat in exchange (no extra Feat if from Invincible).

### Personal A.I.
Built into super-suit / accessory. Access database for general knowledge. Tracks/locks enemies. Help analyzing buildings / cities for escape routes.

### PhD
Pick a field (engineering, medicine…). Free Re-roll all rolls in that field.

### Pint-Sized
Half-height or less. Free Re-roll Stealth and dodge-projectiles. Help squeezing / unnoticed.

### Power Absorption
Touching a powered being risks giving them Powerless.
**Stolen Power [Full Turn]** — touch an ally to steal their Superpower + connected Feats until scene end (ally becomes Powerless). Enemy version requires fully disabling them for 1 Turn first.

### Power-Mirror
Time-Out: help a friend's Show Off Your Superpower attempt.
**Borrowed Power [Quick Action]** (1 Power) — touch a powered being; use one of their Special Actions OR temporarily inherit benefits of their Superpower.

### Prep Time
Once per Session: ask Director for info about a location or person.
**Prepared** (1 Power, once per combat) — after Enemy reveals a Feat, pull out an accessory/strategy that nullifies it until scene end.

### Proven Driver
Pick a ride type. Free Re-roll driving/repairing/evaluating that type.

### Regeneration
Losing 3+ Grit at once = lose 1 less.
**Fast Recovery [Quick Action]** (1 Power) — recover 3 Grit OR remove Tired / Hurt.

### Shrinkage
Shrink down to ant-sized at will, without strength loss. Full Turn to shrink. While shrunk: Help squeezing / unnoticed.
**Instant Miniaturization** (1 Power) — shrink on the spot, break free from grapples/restraints, auto-pass a Reaction in combat.
**Instant Enlargement** (1 Power, while shrunk) — return to size; attack Enemy at +1 with Free Re-roll.

### Silver Tongue
Free Re-roll for lying, persuading, compromising, bargaining.

### Sonic Boom
Voice/sonic waves destroy objects and barriers. Super-weapon **Sonic Wave** (Energy Weapon, Impact). Picking it twice adds **Maximum Power**.

### Speak with Animals
Talk with animals.
**Call of the Wild [Quick Action]** (1 Power) — summon nearby animals to Help.

### Super Senses
Free Re-roll all combat Reaction Rolls + rolls sensing danger / preventing ambush / spotting lurkers.
**Attention** (1 Power) — repeat a failed Detect or Awareness roll.

### Super-Ride
You have a hyper-tech / magical / alien ride. Free Re-roll driving it.
**Ride Recall [Quick Action]** (1 Power) — summon the super-ride.

### Team Leader
Free Re-roll inspiring / coordinating + removing Like a Fool & Defeated Conditions. Group speech raises starting Teamwork to 2.

### Trained Fighter
Pick a fighting style or melee weapon. Free Re-roll Action AND Reaction Rolls with that style/weapon.

### Transformation
Two forms — human (no Superpower / connected Feats) and powered (full access + move 1 Attribute Point of choice). Transformation = Full Turn.
**Quick Shift [Quick Action]** (1 Power) — transform with a Quick Action AND recover all Grit.

### Unlimited Funds
At creation, spend **10$** on gear (instead of 4), then start with **5$**. Once per Session: leverage wealth to unlock exclusive services (private jet / exclusive gala ticket / book a whole hotel / etc.).

### Unstoppable Force
Running / throwing at speed = nothing stops you.
**Devastating Attack [Quick Action]** (1 Power) — +1 to next combat Action Roll; if you hit, +1 Grit damage. Can combine with other special actions (Smash!, Explosive Force, etc.).

### Wall-Climber
Climb/hang any horizontal or vertical surface. Free Re-roll all climbing rolls.

## OSH Starting Cash

Heroes spend **4$ at character creation** on weapons / gear / rides. Every **2$ saved** during creation converts to **1$ on the Sheet**. (Or, if completely penniless, trade *all* of it for +1 Power on the Sheet.)

Free extras at creation: up to 3 everyday items that aren't weapons/gear (pendant, phone, mirror); optional Director-granted gear matching your job; a colorful costume.

Gadgets and Super-Rides cannot be bought with Cash — pick the Gadget or Super-Ride Feat instead.

**Unlimited Funds Feat:** 10$ to spend + 5$ on Sheet to start.

## Super-weapon Feats (specific to OSH)

In addition to standard Gun Feats (Accurate / Explosive / Jam / Precision Shot / Rapid Fire / Short Range / Silent / Single Shot / Slow Reload), OSH adds:

- **Maximum Power** — At Long Range, gain +1 instead of suffering -2.
- **Impact** — Successful hit knocks the target away / down.
- **Perfect** — Always wins ties; can deflect projectiles in melee with the Free Re-roll.
- **Sharp** — Ignores Bulletproof Vests.
- **Energy Weapon** — Ignores Bulletproof Vest + Armored Enemy Feats (but not Hyper-tech armor / Bulletproof feat).
- **Melee Weapon** — Used in close combat for Brawn + Fight.

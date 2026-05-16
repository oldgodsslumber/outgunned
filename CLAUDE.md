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

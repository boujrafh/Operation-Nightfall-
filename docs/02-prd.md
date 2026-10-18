# 02 · PRD (Product Requirements Document)

**Status:** Approved

## 1. Product overview

OPERATION NIGHTFALL is a top-down 8-bit stealth action game in the MSX2 style, delivered as an
offline, installable PWA. It runs on desktop browsers (keyboard) and mobile devices (touch).

## 2. Target audience

| Segment                                    | Profile                             | What they want                                             |
| ------------------------------------------ | ----------------------------------- | ---------------------------------------------------------- |
| Primary: retro fans (30–50)                | Grew up on MSX, NES or Amiga        | Nostalgia, a real 8-bit look and sound, a fair challenge   |
| Secondary: indie and casual gamers (16–35) | Short sessions on mobile or browser | Instant play, no install, clear rules                      |
| Tertiary: stealth-genre fans               | Love tension and planning           | Readable patrols, more than one way through, puzzle bosses |

## 3. Problem and solution fit

| Problem                                            | Solution                                              |
| -------------------------------------------------- | ----------------------------------------------------- |
| Classic 8-bit stealth games need emulators or ROMs | A new, original game that runs legally in any browser |
| Modern stealth games are long and heavy            | Short chapters (10–20 min), progress saved per room   |
| Retro games often feel unfair                      | Visible cones, gentle learning curve, clear signals   |
| Mobile ports of retro games have poor controls     | Touch controls designed for this game                 |

## 4. Characters

### Allies

| Character               | Role                               | Gameplay function                                            |
| ----------------------- | ---------------------------------- | ------------------------------------------------------------ |
| **Agent WREN** (player) | Rookie in SPECTRE-9                | Playable hero                                                |
| **Commander HALE**      | Mission commander (codec)          | Tutorial hints; false hints from Ch. 5; secretly the villain |
| **KESTREL**             | Missing veteran agent              | Rescued in Ch. 3, then tactical tips                         |
| **LARK**                | Resistance fighter (codec)         | Map hints; warns that Hale is lying                          |
| **Dr. ILSE VARGA**      | Engineer forced to build GOLIATH-7 | Rescued in Ch. 4; explains weak points                       |
| **MIRA VARGA**          | Ilse's daughter, hostage           | Rescue objective in Ch. 5                                    |
| **BIX**                 | Quartermaster (codec)              | Explains each new item and weapon                            |
| **DR. SATO**            | Medic (codec)                      | Save point: call her to save                                 |

### Regular enemies

| Enemy                | From  | Behaviour                                  |
| -------------------- | ----- | ------------------------------------------ |
| Patrol soldier       | Ch. 0 | Fixed route, vision cone, hears footsteps  |
| Surveillance camera  | Ch. 1 | Rotates, triggers an alert                 |
| Dog handler and dogs | Ch. 2 | Track by smell; the box does not fool them |
| Laser tripwire       | Ch. 3 | Invisible without IR goggles               |
| Heavy trooper        | Ch. 4 | Armoured                                   |
| Sniper               | Ch. 5 | Long, narrow cone                          |
| Attack drone         | Ch. 6 | Flies over obstacles                       |

### Bosses with powers

| Ch. | Boss                       | Power                                         | How to beat them                         |
| --- | -------------------------- | --------------------------------------------- | ---------------------------------------- |
| 2   | Sgt. BRASK "The Wall"      | Riot shield, charges                          | Make him hit a wall, attack from behind  |
| 3   | WARDEN ECHO                | Optical camouflage                            | IR goggles or footsteps on metal         |
| 4   | TWIN HOUNDS (Vex & Rook)   | Linked lives                                  | Defeat both within 10 s                  |
| 4   | CINDER                     | Sets floor tiles on fire                      | Lure him under sprinklers                |
| 5   | The PUPPETEER              | Mind control, hostage shields                 | Shoot the antenna on his back            |
| 5   | STATIC                     | EMP: kills HUD and goggles, reverses controls | Copper room, time attacks between pulses |
| 6   | GOLIATH-7                  | Missiles, flamethrower, stomp                 | C4 on the 4 legs in order, then the core |
| 7   | Commander HALE "Overwatch" | Predicts your position; bullet time           | Change direction after the ghost appears |

## 5. Core features

**MUST (v0.1.0, Chapter 0):** 8-direction movement; patrolling guards with visible cones;
INFILTRATION / ALERT / EVASION; hiding (bushes, crates, box); takedown from behind; 3 connected
rooms; Key Card 1 and a locked door; codec; HUD; localStorage save with error handling; PWA
(manifest, offline service worker, pixel-art icons); touch controls; letterboxed responsive layout;
procedural music and sound effects.

**SHOULD (v0.2):** pistol, rations, cameras, dogs, IR goggles and lasers, Brask and Echo, Kestrel.

**COULD (v0.3+):** SMG, grenades, C4, gas mask, rocket launcher, remaining bosses, the betrayal,
escape countdown, ending.

**WON'T (for now):** multiplayer, leaderboards, in-app purchases, level editor.

## 6. Audio direction

All audio is generated live with the Web Audio API, imitating the MSX sound chip (3 pulse
channels + noise, plus an SCC-style wavetable). No audio files.

| Track                      | When                                                         |
| -------------------------- | ------------------------------------------------------------ |
| Title "Nightfall"          | Title screen                                                 |
| Infiltration "Shadow Step" | Normal stealth — low Dorian ostinato, sparse melody, ~90 BPM |
| Alert "Red Line"           | ALERT — 160 BPM arpeggios and drums                          |
| Evasion "Holding Breath"   | EVASION — heartbeat pulse, slow arpeggio                     |
| Codec                      | Radio calls                                                  |
| Game Over / Victory jingle | Death / chapter end                                          |

Key sound effects: detection "!" sting, suspicion "?", footsteps per surface, takedown, punch,
gunshot, door, denied buzz, pickup, codec ring, klaxon, evasion end, low-health heartbeat.

## 7. Success metrics

| Metric             | Target                                                |
| ------------------ | ----------------------------------------------------- |
| First load         | < 3 s on 4G; < 1 s from cache                         |
| Ch. 0 completion   | > 80 % of players who start                           |
| Detection fairness | < 10 % of testers call a detection unfair             |
| Performance        | 60 FPS on mid-range phones                            |
| Offline            | 100 % playable in airplane mode after the first visit |
| Save reliability   | No lost progress across reloads when storage works    |

# 03 · TRD (Technical Requirements Document)

**Status:** Approved (with amendments: GitHub Projects Kanban, test gate)

## 1. Stack

| Layer                | Choice                                                                  |
| -------------------- | ----------------------------------------------------------------------- |
| Language             | JavaScript ES2022 modules, JSDoc types checked by `tsc --checkJs`       |
| Rendering            | HTML5 Canvas 2D, vanilla (no Phaser)                                    |
| Audio                | Web Audio API, generated in code                                        |
| Bundler              | esbuild + `scripts/build.mjs` inlining JS and CSS into one `index.html` |
| Tests                | Vitest (logic), Playwright (browser)                                    |
| Quality              | ESLint, Prettier                                                        |
| Hosting              | GitHub Pages                                                            |
| Runtime dependencies | **None**                                                                |

The game is one file, `dist/index.html`. Browsers require the PWA files next to it:
`manifest.webmanifest`, `sw.js` and the icons.

## 2. Display

- Internal resolution **256 × 212** (MSX2): play area 16 × 11 tiles of 16 px, HUD 36 px.
- Scaling: a whole-number scale when it fills at least 85 % of the space the exact fit would;
  otherwise the exact fractional fit (so small phones are not wasted). `image-rendering: pixelated`.
- Black letterboxing. Both orientations work on phones: **landscape** puts the touch controls in
  the black side bars; **portrait** splits the screen like a handheld console (game on top, control
  pad below).
- Fixed 16-colour palette (Doc 05). Sprites are text grids or procedural drawings baked at startup.

## 3. Architecture

- Fixed 60 Hz update with catch-up (max 5 steps), render on `requestAnimationFrame`.
- Scene stack: Boot → Press Start → Title → Briefing → Play ⇄ Codec / Pause / Options → Game Over / Chapter End.
- Play: RoomManager, TileMap, entities (Player, Guard, Camera, Pickup, Door), AlertManager,
  guard AI + A*, Vision, Combat, Inventory, CodecSystem, TriggerSystem, HUD.

### Guard states

`PATROL`, `SUSPICIOUS` (noise or brief sighting, "?"), `ALERT_CHASE`, `SEARCH` (during EVASION),
`RETURN`, `DOWN` (knocked out for 30 s).

### Detection rules

- Cone 70°, 5 tiles (ALERT: 100°, 6 tiles). Walls, crates and closed doors block sight; bushes,
  fences and water do not.
- Hidden: inside a bush, or in the box without moving — unless a guard touches you from the front.
- Noise: metal grating footsteps (2.5 tiles), punches (2 tiles).
- ALERT → EVASION after 5 s unseen; EVASION → INFILTRATION after 10 s.
- 0.25 s grace before a patrol guard raises the alarm; the cone flashes.
- Up to 3 reinforcements per room during ALERT; exits sealed for 3 s; up to 2 chasers follow you.

## 4. Audio engine

3 pulse waves (12.5 / 25 / 50 %), noise, 2 SCC-style wavetables. Lookahead scheduler (25 ms tick,
120 ms ahead). Tracker-like text patterns. Crossfades between alert states. Mixer with music, SFX
and mute. Unlocked on the first key press or tap.

## 5. Input

`event.code` mapping (WASD on QWERTY = ZQSD on AZERTY), arrows, Space = action, 1/2 = item/weapon,
Enter = confirm / pause, Esc = pause. Touch: floating stick (15 % dead zone, 8 directions), A, B,
W and pause buttons, multi-touch, 3 sizes. "TOUCH PAD" option: AUTO (shown on touch devices,
hidden once a keyboard is used), ON (always) or OFF. The stick also acts as up/down/left/right
presses, so menus and dialogue choices work by touch. A tap on the screen confirms menus and dialogue. Every quick re-press counts,
even in consecutive frames.

## 6. PWA

Manifest: `display: fullscreen`, `orientation: any`, black theme, icons 192, 512, 512
maskable, apple-touch 180. Service worker: precache all files, cache-first, cache name contains
the build hash, old caches deleted on activate, "UPDATE AVAILABLE → RELOAD" prompt.

## 7. Saving

Keys `nightfall.save.v1` and `nightfall.settings.v1`. Envelope with schema version, checksum
(FNV-1a over canonical JSON). Safe write via a temporary key. Memory fallback when storage fails.
Corrupted saves are quarantined. See Doc 06.

## 8. Budgets

60 FPS; `index.html` ≤ 250 KB (≤ 80 KB gzip); total ≤ 400 KB. Checked by `npm run size`.

## 9. Security

CSP meta tag with SHA-256 hashes for the inline script and style (no `unsafe-inline`, no `eval`),
no network calls, same-origin service worker, save data validated before use.

## 10. Browser support

Chrome / Edge / Samsung Internet (latest 2): full. Firefox: playable, no desktop install.
Safari / iOS 16.4+: playable, Add to Home Screen, standalone instead of fullscreen.

## 11. Repository, CI/CD and GitHub

- `main` protected: PR required, `ci` check required, squash merge, linear history.
- Branches `feat/<n>-<slug>`, `fix/…`, `chore/…`; Conventional Commits.
- **Kanban only in GitHub Projects** ("Nightfall Board"): Backlog → Ready → In Progress →
  In Test (your validation) → In Review → Done. Every task is an issue card; every PR is linked
  (`Closes #n`) and added to the Project.
- **Test gate:** code is written without committing, a playable build is sent for testing, and
  **nothing is committed, pushed or opened as a PR before the product owner says OK.**
- CI (`ci.yml`): lint, format, types, content validation, unit tests, build, size, Playwright.
- CD (`deploy.yml`): build and deploy `dist/` to GitHub Pages on `main`.
- `scripts/bootstrap-github.sh` creates labels, milestones, the Project, issues, Pages and branch
  protection; safe to run again.

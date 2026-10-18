# 07 · Implementation Plan

**Status:** Approved

## Milestones

| Milestone               | Version         | Goal                                                        |
| ----------------------- | --------------- | ----------------------------------------------------------- |
| M0 Foundation           | —               | Repository, tooling, CI/CD, GitHub Project                  |
| M1 Prototype "One Room" | v0.0.1          | 1 screen, 2 guards, detection, ALERT/EVASION, hiding, music |
| M2 "Three Rooms"        | v0.0.2          | Chapter 0 complete                                          |
| M3 "PWA & Mobile"       | **v0.1.0**      | Installable, offline, touch, responsive                     |
| M4 "Outer Heaven Walls" | v0.2.0          | Chapters 1–3, Brask and Echo                                |
| M5 "Nightfall"          | v0.3.0 → v1.0.0 | Chapters 4–7, the full game                                 |

> The first delivery (this repository's initial content) already covers **M0 to M3**:
> Chapter 0 complete, PWA, touch controls and saving.

## GitHub setup (`scripts/bootstrap-github.sh`, idempotent)

Repository · labels (`type:*`, `area:*`, `priority:*`) · milestones M0–M5 · Project
"Nightfall Board" with the Status column Backlog / Ready / In Progress / In Test / In Review / Done
· issues from the backlog, added to the Project · GitHub Pages (Actions) · branch protection on `main`.
Then enable the Project's built-in workflows: item added → Backlog, PR merged → Done, issue closed → Done.

## PR workflow and test gate

```
Card Ready → In Progress   pick issue #n, branch feat/n-slug, code (NOT committed)
                           lint + types + tests + build pass locally
In Progress → In Test      playable build sent to the product owner
                           ← "OK" or bug list (fix and resend)
                           only after OK: commit + push + draft PR "Closes #n"
In Test → In Review        CI runs, review
In Review → Done           squash merge → Pages deploys
```

One issue = one branch = one PR; small PRs; Conventional Commit titles; squash only; a tag per milestone.

## Definition of done

Complete code with no placeholders · unit tests · lint, types, content, size green · idempotency
rules respected · 60 FPS in Chromium · **tested and approved by the product owner before any
commit** · PR linked to its card, CI green, squash merged.

## Backlog

**M0:** repository bootstrap · tooling · single-file build · CI and Pages.
**M1:** core loop and scenes · renderer · keyboard · tilemap and room 0-1 · player · patrols ·
vision cones · alert states and AI · hiding and noise · audio engine · HUD.
**M2:** room transitions · rooms 0-2 / 0-3 and validation · inventory · cardboard box · takedown and
drops · doors and cards · codec · save · menus · remaining audio.
**M3:** manifest and icons · service worker · touch controls · responsive layout (landscape + portrait handheld) ·
accessibility and performance · release v0.1.0.
**M4:** pistol, rations, cameras, dogs, IR goggles and lasers, Ch. 1–3 rooms, Brask, Echo,
Kestrel rescue, boss music.
**M5:** SMG, grenades, C4, gas mask, rocket launcher, Twin Hounds, Cinder, Puppeteer, Static,
GOLIATH-7, Hale, escape countdown, ending.

## File tree

```
operation-nightfall/
├── .github/ (workflows/ci.yml, deploy.yml · ISSUE_TEMPLATE/ · pull_request_template.md · dependabot.yml)
├── docs/ (01–07, STORY.md)
├── public/ (manifest.webmanifest, sw.template.js)
├── scripts/ (bootstrap-github.sh, build.mjs, gen-icons.mjs, png.mjs, serve.mjs, check-size.mjs, validate-content.mjs)
├── src/
│   ├── index.html, main.js, styles.css
│   ├── core/      config, event-bus, loop, math, pool, scene-manager
│   ├── render/    palette, renderer, sprite-sheet, font, dither, scaler, fx
│   ├── input/     input-service, keyboard, touch-controls, device-detect
│   ├── audio/     audio-service, psg, sequencer, sfx
│   ├── world/     tilemap, collision, line-of-sight, pathfinding, room-manager
│   ├── entities/  player, guard, camera, pickup, door
│   ├── systems/   alert-manager, vision, guard-ai, noise, combat, inventory, codec-system, trigger-system
│   ├── state/     game-state, progress-store, save-service, settings-service, storage, checksum, migrations, canonical-json
│   ├── scenes/    boot, press-start, title, briefing, play, codec, pause, options, game-over, chapter-end
│   ├── ui/        hud, codec-window, menu, overlays
│   ├── pwa/       sw-register, install-prompt
│   └── content/   registry, validate, items, characters, chapters, rooms/, dialogue/, music/, sfx/, sprites/
└── tests/ (unit/, e2e/)
```

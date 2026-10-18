# Operation Nightfall

A top-down **8-bit stealth game** in the MSX2 style, playable in the browser and installable as an
offline **PWA**. You are Agent **Wren**, alone inside the IRON VEIL base: avoid the guards' vision
cones, hide in bushes or under a cardboard box, take guards down from behind, find key cards and
listen to your codec… but not every voice on the radio can be trusted.

> v0.1.0 contains **Chapter 0 — Insertion** (3 rooms). See [`docs/STORY.md`](docs/STORY.md) for
> the full story and [`docs/`](docs) for the 7 foundation documents.

## Controls

| Action                                           | Keyboard                              | Touch                           |
| ------------------------------------------------ | ------------------------------------- | ------------------------------- |
| Move                                             | Arrows, WASD (QWERTY) / ZQSD (AZERTY) | Stick (left half of the screen) |
| Action: punch, takedown from behind, open door   | Space                                 | A                               |
| Change item (box, cards)                         | 1                                     | B                               |
| Change weapon                                    | 2                                     | W                               |
| Continue dialogue / confirm                      | Enter or Space                        | Tap the screen or A             |
| Pause (codec calls, options, save with Dr. Sato) | Esc, P or Enter                       | II                              |

On a phone the buttons appear automatically: on the sides when the phone is sideways, and under
the game (like a handheld console) when it is upright. Menus work with the stick. The **TOUCH PAD**
option (AUTO / ON / OFF) forces them on or off.

**Tips:** a guard needs a quarter of a second to raise the alarm — move when the cone flashes.
Stand inside a bush, or stay still inside the box, and guards walk past. Metal grating is noisy.

## Run it locally

```bash
npm install
npm run dev        # builds, then serves dist/ on http://localhost:4173
```

`dist/index.html` is the complete game in a single file (no dependencies). The service worker and
install prompt need `http://localhost` or HTTPS.

## Scripts

| Command                                  | What it does                                                                                        |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `npm run build`                          | Validates content, bundles everything into `dist/index.html`, generates icons and `sw.js`           |
| `npm run check`                          | Lint, type check, content validation, unit tests, build, size budget                                |
| `npm test`                               | Unit tests (Vitest)                                                                                 |
| `npm run e2e`                            | Browser tests (Playwright: boot, gameplay, offline, touch)                                          |
| `npm run size`                           | Checks the size budget                                                                              |
| `scripts/bootstrap-github.sh owner/repo` | Sets up labels, milestones, the Project board, issues, Pages and branch protection (safe to re-run) |

## Workflow

Tasks live on the GitHub Project **Nightfall Board** (Backlog → Ready → In Progress → In Test →
In Review → Done). Every change is tested by the product owner **before** it is committed, then
goes through a pull request linked to its card. See [`docs/07-implementation-plan.md`](docs/07-implementation-plan.md).

## Project layout

```
src/core      loop, scenes, events, config
src/render    palette, font, sprites, scaling, effects
src/input     keyboard, touch controls
src/audio     MSX-style chip sound engine
src/world     tiles, collisions, line of sight, pathfinding, rooms
src/systems   alert states, vision, guard AI, combat, codec, triggers
src/state     progress, saving (checksum, migrations, fallback), settings
src/scenes    title, briefing, play, codec, pause, options, game over, chapter end
src/content   rooms, items, characters, dialogue, music, sound effects, sprites
```

## License

MIT — see [LICENSE](LICENSE). Original work; inspired by the genre, not affiliated with any
existing game or company.

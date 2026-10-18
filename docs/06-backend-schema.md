# 06 · Backend Schema (data layer)

**Status:** Approved

The game has **no server**. "Backend" means: content data (read-only, bundled), save data
(localStorage) and the internal service interfaces.

## 1. Rule: stable string IDs

Every piece of content has a unique, stable ID (`pk_0-2_box`, `door_0-3_lv1`, `g_0-3_card`).
Saves refer to content only by these IDs. Entry IDs (`start`, `west`, …) are local to their room.

## 2. Content models (see `src/content/`)

| Model          | Key fields                                                                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ItemDef`      | `id`, `kind` (`weapon`/`item`/`card`/`consumable`/`ammo`/`story`), `name`, `short` (HUD, ≤ 7 chars), `icon`, `cardLevel`, `maxStack`, `effect`, `codecOnFirstPickup` |
| `RoomDef`      | `id`, `chapter`, `name`, `music`, `dark?`, `tiles` (11 × 16), `entries`, `exits`, `doors`, `guards`, `cameras`, `pickups`, `triggers`                                |
| `ExitDef`      | `id`, `edge` (N/E/S/W), `from`, `to`, `targetRoom`, `targetEntry`                                                                                                    |
| `DoorDef`      | `id`, `x`, `y`, `level` (0–4), `targetRoom?`, `targetEntry?`                                                                                                         |
| `GuardDef`     | `id`, `route` (`x`, `y`, `wait` in seconds, `look?`), `loop` (`cycle`/`pingpong`), `speed` (multiplier), `armed`, `carries?`, `facing`                               |
| `PickupDef`    | `id`, `itemId`, `qty`, `x`, `y`                                                                                                                                      |
| `TriggerDef`   | `id`, `type` (`codec`/`chapterEnd`), `area`, `dialogueId?`, `once` (`false` = fires while inside), `requires?`                                                       |
| `ChapterDef`   | `id`, `title`, `rooms`, `startRoom`, `startEntry`, `briefingDialogue`, `unlocks`                                                                                     |
| `CharacterDef` | `id`, `name`, `freq`, `portrait`, `voice`, `callable`, `requires?`                                                                                                   |
| `DialogueDef`  | `id`, `caller`, `lines[{speaker, text ≤ 120}]`, `choice?`                                                                                                            |
| `TrackDef`     | `id`, `bpm`, `loop`, `channels[{wave, vol, gate?, pattern}]`                                                                                                         |
| `SfxDef`       | `id`, `duck?`, `parts[]`                                                                                                                                             |

### Tile legend

| Char | Tile          | Walk      | Blocks sight | Hides  | Footsteps        |
| ---- | ------------- | --------- | ------------ | ------ | ---------------- |
| `.`  | sand          | ✅        | ❌           |        | soft             |
| `,`  | grass         | ✅        | ❌           |        | soft             |
| `=`  | concrete      | ✅        | ❌           |        | normal           |
| `:`  | metal grating | ✅        | ❌           |        | **loud** (noise) |
| `#`  | wall          | ❌        | ✅           |        |                  |
| `F`  | fence         | ❌        | ❌           |        |                  |
| `~`  | water         | ❌        | ❌           |        |                  |
| `B`  | bush          | ✅        | ❌           | inside | rustle           |
| `C`  | crate         | ❌        | ✅           | behind |                  |
| `D`  | door          | when open | when closed  |        |                  |

## 3. Save data

```json
{
  "schemaVersion": 1,
  "gameVersion": "0.1.0",
  "savedAt": "2026-10-18T14:03:22.000Z",
  "checksum": "a3f09c12",
  "data": {
    "chapter": 0,
    "roomId": "0-2",
    "entryId": "west",
    "player": { "hp": 12, "maxHp": 12 },
    "inventory": {
      "items": ["item_box"],
      "weapons": ["fists"],
      "ammo": {},
      "consumables": {},
      "selectedItem": "item_box",
      "selectedWeapon": "fists"
    },
    "flags": {
      "triggersFired": [],
      "pickupsTaken": ["pk_0-2_box"],
      "doorsOpened": [],
      "bossesDefeated": [],
      "story": []
    },
    "stats": { "alerts": 1, "takedowns": 0, "kills": 0, "continues": 0, "playTimeMs": 412000 }
  }
}
```

Validation on load: unknown room → chapter start; HP clamped; unknown items dropped; `fists` always
present; flags de-duplicated; stats non-negative integers. Settings live in `nightfall.settings.v1`.

## 4. Idempotency rules

| #   | Rule                                                                                     | Where                    |
| --- | ---------------------------------------------------------------------------------------- | ------------------------ |
| I-1 | A save is a full snapshot that replaces the previous one; same state → same stored value | `SaveService.save`       |
| I-2 | Progress changes are set-based: `mark*` adds an ID once                                  | `ProgressStore`          |
| I-3 | Rewards are tied to the pickup ID: collecting twice gives nothing                        | `ProgressStore.collect`  |
| I-4 | Migrations are pure and ordered; a current save is returned unchanged                    | `migrate()`              |
| I-5 | Defaults fill only missing values                                                        | `sanitize()`             |
| I-6 | Corrupted saves are copied to `.corrupt` only if not already identical                   | `SaveService.quarantine` |
| I-7 | Service worker caches are versioned; activation deletes every other cache                | `sw.js`                  |
| I-8 | The GitHub setup script uses create-if-missing / update-in-place                         | `bootstrap-github.sh`    |

### Safe save

1. Canonical JSON (sorted keys) → checksum → envelope.
2. Write `<key>.tmp`, read back and verify the checksum.
3. Write `<key>`, remove `<key>.tmp`.
4. Any failure → memory store for the session + "SAVE UNAVAILABLE" (once). Never throws.

### Load

Main key, else `.tmp` (interrupted write) → parse → checksum → migrate → sanitize. Any failure →
quarantine and start fresh.

## 5. Content validation (build fails on error)

Unique IDs · 11 × 16 rooms with legal characters · every reference exists · every exit has a way
back · exit openings walkable · guard waypoints walkable and connected by A* · start entry reaches
an exit · a card of level N is reachable without passing a level N door (no soft-lock) · dialogue
lines ≤ 120 chars · HUD names ≤ 7 chars.

## 6. Internal services

| Service           | Methods                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| `ContentRegistry` | `getRoom`, `getItem`, `getDialogue`, `getCharacter`, `getTrack`, `getSfx`, `getChapter`, `has*` |
| `SaveService`     | `load`, `save`, `hasSave`, `deleteSave`, `isPersistent`                                         |
| `SettingsService` | `get`, `set`, `reset`, `onChange`                                                               |
| `ProgressStore`   | `markPickup/Trigger/Door/Boss/Story`, `has`, `addItem`, `collect`, `snapshot`, `restore`        |
| `EventBus`        | `on`, `off`, `emit`                                                                             |
| `AudioService`    | `unlock`, `playMusic`, `stopMusic`, `playSfx`, `setVolumes`, `setMuffled`, `setAlarm`           |
| `InputService`    | `isDown`, `justPressed`, `justConfirmed`, `axis`, `menuDelta`                                   |

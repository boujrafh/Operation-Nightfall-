# 04 · AppFlow

**Status:** Approved

## 1. Screens

```
BOOT → PRESS START → TITLE (NEW GAME · CONTINUE · OPTIONS · INSTALL)
                       │
                       ▼
                   BRIEFING (mission card + codec call)
                       │
                       ▼
                     PLAY ⇄ CODEC (calls)
                       │ ⇄ PAUSE (RESUME · CODEC · OPTIONS · QUIT)
                       ├→ GAME OVER (CONTINUE · TITLE)
                       └→ CHAPTER END (results, rank) → TO BE CONTINUED → TITLE
Overlays at any time: UPDATE AVAILABLE · SAVE UNAVAILABLE
```

Auto-pause when the tab is hidden or the window loses focus. Turning the phone switches between
the landscape layout and the portrait (handheld) layout without pausing.

## 2. Alert states

INFILTRATION (green) → seen for 0.25 s → ALERT (red, klaxon, reinforcements, exits sealed 3 s)
→ 5 s unseen → EVASION (amber, countdown 10) → INFILTRATION. Seen during EVASION → ALERT again.

## 3. Chapter 0 journey

| Room           | Teaches                | Contents                                                        | Codec                                          |
| -------------- | ---------------------- | --------------------------------------------------------------- | ---------------------------------------------- |
| 0-1 Beach      | Moving, cones, bushes  | 2 unarmed guards, bushes                                        | Hale (move + bushes), Bix (cones)              |
| 0-2 Fence Line | Crates, box, timing    | 2 guards (one armed), fence gap, **box**, **Kestrel's dog tag** | Bix (box), Hale (dog tag)                      |
| 0-3 Outer Yard | Takedown, cards, noise | Card carrier, armed gate guard, metal grating, **level 1 door** | Hale (takedown), Lark (first call), Bix (card) |

The first time an alert ends, Hale calls once to explain evasion.

## 4. Room transitions

Edge exit → 8-frame dithered fade → next room at the matching entry → fade in. Auto-save on entry
(not during ALERT). Knocked-out guards stay down for the rest of their 30 s; items picked up are
gone for good; dropped items stay where they fell. In ALERT, up to 2 chasers follow you.

## 5. Doors and cards

Touching a locked door (or pressing action in front of it): opens if the **equipped** item is a
card of the required level or higher; otherwise "EQUIP CARD N" (card owned) or "LEVEL N CARD
REQUIRED". Opened doors stay open.

## 6. Inventory

Item slot (1 / B) cycles NONE → owned items. Equipping the **cardboard box** puts it on. Weapon slot
(2 / W) cycles weapons (only FIST in Chapter 0). Action (Space / A): door in front → takedown from
behind → punch (3 punches knock a guard out; a punch from the front alerts him).

## 7. Codec

Trigger → ring and "CALL" on the HUD (0.8 s) → codec screen with portraits, frequency and typed
text → Enter / Space / tap to continue. Calls never ring during ALERT or EVASION; they wait.
Each call plays once (saved). Pause → CODEC lists contacts; **Dr. Sato offers to save**.

## 8. Death

Life 0 → death (1.2 s) → GAME OVER → CONTINUE restarts at the entry of the current room with full
life, the inventory as it was on entry and the alert reset.

## 9. State

One central progress object (saved) and per-scene session state (not saved). Systems talk through
the event bus: `ROOM_ENTER`, `PLAYER_SPOTTED`, `ALERT_CHANGED`, `ITEM_PICKED`, `DOOR_OPENED`,
`GUARD_DOWN`, `PLAYER_DAMAGED`, `PLAYER_DIED`.

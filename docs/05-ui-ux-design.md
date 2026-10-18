# 05 · UI/UX Design

**Status:** Approved

## Principles

Readable first · real 8-bit look · darkness with bright accents · never colour alone (text + sound too).

## Palette — NIGHTFALL-16

| #   | Hex       | Name        | Use                             |
| --- | --------- | ----------- | ------------------------------- |
| 0   | `#000000` | Void        | Background, outlines            |
| 1   | `#1B1B2F` | Night       | Panels, dark areas              |
| 2   | `#33335C` | Steel       | Walls, metal                    |
| 3   | `#5468D9` | Signal Blue | Wren's suit, codec frame        |
| 4   | `#6FD3FF` | Cyan        | Codec text                      |
| 5   | `#1E5631` | Jungle      | Grass, shadows                  |
| 6   | `#3DB54A` | Green       | Bushes, INFILTRATION            |
| 7   | `#B4E35B` | Lime        | Life bar                        |
| 8   | `#6B4428` | Wood        | Sand floor, crates              |
| 9   | `#C9914F` | Cardboard   | Box, crates                     |
| 10  | `#F4DDB0` | Skin        | Faces                           |
| 11  | `#FFD43B` | Yellow      | Vision cones, cards, highlights |
| 12  | `#FF8A1F` | Amber       | EVASION, mid life               |
| 13  | `#E02B2B` | Red         | ALERT, berets, damage           |
| 14  | `#8E8E9A` | Concrete    | Guard uniforms                  |
| 15  | `#FFFFFF` | White       | Text, "!"                       |

## Typography

8 × 8 bitmap font (5 × 7 glyphs drawn bold without closing one-pixel gaps), uppercase only,
30 characters per codec line, 2× and 3× for titles.

## Layout (256 × 212)

Play area 256 × 176 on top; HUD 256 × 36: LIFE bar (12 segments), alert badge
(INFILTRATION / !! ALERT !! / EVASION nn), CALL indicator, WPN and ITEM slots, room label.

## Sprites

16 × 16 humanoids (4 directions × idle + 2 walk; side view mirrored; knocked-out pose):
Wren in blue with a steel bandana, guards in grey with red berets. Cardboard box. "!" and "?"
bubbles. Item icons. 48 × 56 codec portraits (Wren, Hale with headset, Bix with glasses,
Dr. Sato in a white coat, Lark as a hooded silhouette with static).

## Tiles

Sand, grass, concrete, metal grating (loud), wall, fence (see-through), water, bush (hide inside),
crate (hide behind), key card doors (level pips), open door.

## Vision cones

Yellow 50 % dither, clipped by walls; flashing white during the 0.25 s grace; red 75 % in ALERT;
amber during EVASION.

## Codec window

Two portraits (caller left, Wren right), frequency and animated signal bars, a text box with the
speaker's name, typewriter text (slow / normal / fast) with voice blips, ▼ to continue, YES / NO
choices, scan-line opening.

## Touch controls

Floating stick, A (76 px, red ring), B and W (60 px), pause (44 px); S / M / L sizes; short
vibration on press; "TOUCH PAD" option AUTO / ON / OFF.

- **Landscape:** stick on the left, A / B / W on the right, in the black side bars; pause top-left.
- **Portrait:** handheld-console layout — game on top, a Night-coloured control pad below with
  the stick on the left, A / B / W in a diamond on the right and pause at the bottom centre.

## Effects

Dithered 4-step fades between rooms; white flash on "!"; red flash and shake on damage; blinking
while invulnerable; "Reduce flashing" option (also follows `prefers-reduced-motion`).

## App icon

Cardboard box with a red "!" bubble under a crescent moon, 32 × 32 grid scaled without smoothing
(180, 192, 512 and 512 maskable with a 25 % safe margin).

## Accessibility

Alert state as text + colour + sound; reduce flashing; text speed; touch sizes; dialogue waits for input.

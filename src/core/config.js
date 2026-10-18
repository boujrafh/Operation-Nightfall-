/** Global constants shared by every system. */

export const WIDTH = 256;
export const HEIGHT = 212;
export const TILE = 16;
export const COLS = 16;
export const ROWS = 11;
export const PLAY_H = 176;
export const HUD_Y = 176;
export const STEP = 1 / 60;
export const GAME_VERSION = '0.1.0';

const DEG = Math.PI / 180;

export const TIMING = {
  SPOT_GRACE: 0.25,
  ALERT_LOST: 5,
  EVASION: 10,
  SUSPICIOUS: 4,
  KO: 30,
  EXIT_LOCK: 3,
  REINFORCE_INTERVAL: 2,
  FOLLOW_DELAY: 1,
  FADE_FRAMES: 8,
  CODEC_RING: 0.8,
  BANNER: 1.6,
};

export const PLAYER = {
  SPEED: 48,
  BOX_SPEED: 30,
  MAX_HP: 12,
  RADIUS: 5,
  INVULN: 1,
  STEP_INTERVAL: 0.28,
  PUNCH_TIME: 0.22,
  PUNCH_RANGE: 16,
  TAKEDOWN_TIME: 0.45,
  TAKEDOWN_RANGE: 15,
  DEATH_TIME: 1.2,
  PICKUP_RANGE: 10,
};

export const GUARD = {
  SPEED: 34,
  CHASE_SPEED: 50,
  RADIUS: 5,
  FOV: 70 * DEG,
  RANGE: 5 * TILE,
  ALERT_FOV: 100 * DEG,
  ALERT_RANGE: 6 * TILE,
  DARK_RANGE_MULT: 0.6,
  TOUCH_DIST: 14,
  TURN_SPEED: 7,
  MELEE_RANGE: 15,
  MELEE_DAMAGE: 2,
  MELEE_COOLDOWN: 1,
  SHOOT_RANGE: 6 * TILE,
  SHOOT_COOLDOWN: 1.1,
  BULLET_SPEED: 120,
  BULLET_DAMAGE: 1,
  HP: 3,
  REPATH: 0.4,
  SEARCH_RADIUS: 4,
  LOOK_TIME: 1.2,
  BEHIND_ANGLE: 100 * DEG,
};

export const MAX_REINFORCEMENTS = 3;
export const MAX_FOLLOWERS = 2;

export const NOISE = {
  METAL_STEP: 2.5 * TILE,
  PUNCH: 2 * TILE,
};

export const STORAGE_KEYS = {
  SAVE: 'nightfall.save.v1',
  SETTINGS: 'nightfall.settings.v1',
};

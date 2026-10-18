import {
  COLS,
  ROWS,
  TILE,
  PLAY_H,
  WIDTH,
  TIMING,
  PLAYER,
  GUARD,
  NOISE,
  MAX_REINFORCEMENTS,
  MAX_FOLLOWERS,
} from '../core/config.js';
import { Scene } from '../core/scene-manager.js';
import { createRng, dist } from '../core/math.js';
import { C } from '../render/palette.js';
import { makeCanvas } from '../render/sprite-sheet.js';
import { tileSpriteName } from '../content/sprites/tiles.js';
import { Player } from '../entities/player.js';
import { Guard, G } from '../entities/guard.js';
import { RoomManager } from '../world/room-manager.js';
import { AlertManager, ALERT } from '../systems/alert-manager.js';
import { NoiseSystem } from '../systems/noise.js';
import { CodecSystem } from '../systems/codec-system.js';
import { BulletSystem, findPunchTarget, findTakedownTarget, knockOut } from '../systems/combat.js';
import { updateGuard, setState } from '../systems/guard-ai.js';
import { canSeePlayer, visionParams, isConcealed, buildCone } from '../systems/vision.js';
import { checkTriggers } from '../systems/trigger-system.js';
import { cycleItem, cycleWeapon, equippedCardLevel, cardForLevel } from '../systems/inventory.js';
import { drawHud, drawBanner } from '../ui/hud.js';

const center = (t) => t * TILE + TILE / 2;
const CAMERA_FOV = (50 * Math.PI) / 180;
const CAMERA_RANGE = 5 * TILE;

/** The game itself: rooms, stealth, combat and the HUD. */
export class PlayScene extends Scene {
  constructor(game) {
    super(game);
    this.name = 'play';
  }

  enter() {
    const game = this.game;
    this.progress = game.progress;
    this.rooms = new RoomManager(game.registry, this.progress);
    this.alert = new AlertManager(game.bus);
    this.noise = new NoiseSystem();
    this.codec = new CodecSystem();
    this.bullets = new BulletSystem();
    this.rng = createRng(0x5eed);
    this.time = 0;
    this.banner = null;
    this.bannerCooldown = 0;
    this.ring = 0;
    this.transition = null;
    this.pendingFollowers = [];
    this.reinforce = { spawned: 0, timer: 0 };
    this.exitLockTimer = 0;
    this.deathTimer = 0;
    this.heartbeat = 0;
    this.ending = null;
    this.punchFx = null;
    this.coneBuf = [];
    this.bgCache = new Map();
    /** Ignores pause/action presses briefly after a menu or call closes. */
    this.inputGuard = 0.35;
    this.room = null;
    this.player = null;
    this.ai = this.makeAiWorld();
    this.unsubs = [game.bus.on('ALERT_CHANGED', (e) => this.onAlertChanged(e))];
    this.loadRoom(this.progress.data.roomId, this.progress.data.entryId, { followers: 0 });
    game.audio.playMusic(this.room.def.music, { fadeMs: 400 });
  }

  exit() {
    for (const u of this.unsubs) u();
    this.game.audio.setAlarm(false);
    this.game.renderer.fx.setFade(0);
  }

  pause() {
    this.game.audio.setAlarm(false);
  }

  /** @param {any} result */
  resume(result) {
    this.inputGuard = 0.35;
    if (result && result.continue) {
      this.continueAfterDeath();
      return;
    }
    if (this.alert.level === ALERT.ALERT) this.game.audio.setAlarm(true);
  }

  // ---------------------------------------------------------------- setup

  makeAiWorld() {
    return {
      dt: 0,
      walk: (x, y) => this.room.tm.isWalkableInside(x, y),
      player: null,
      alert: this.alert,
      canSee: (g) => {
        const v = visionParams(this.alert.level, !!this.room.def.dark);
        return canSeePlayer(this.room.tm, g.x, g.y, g.dir, v.fov, v.range, this.player);
      },
      noises: [],
      onSpotted: (g) => this.onSpotted(g),
      onMelee: () => this.damagePlayer(GUARD.MELEE_DAMAGE),
      onShoot: (g, angle) => {
        this.bullets.spawn(g.x, g.y, angle);
        this.game.audio.playSfx('sfx_shot');
      },
      onSuspicious: () => this.game.audio.playSfx('sfx_suspect'),
      rng: this.rng,
    };
  }

  /**
   * @param {string} roomId @param {string} entryId
   * @param {{ followers: number, armedFollowers?: boolean }} opts
   */
  loadRoom(roomId, entryId, opts) {
    if (this.room) this.rooms.remember(this.room, this.time);
    this.room = this.rooms.build(roomId, this.time);
    const def = this.room.def;
    const entry = def.entries.find((e) => e.id === entryId) || def.entries[0];
    this.entry = entry;
    this.player = new Player(center(entry.x), center(entry.y), entry.facing);
    this.player.boxOn = this.progress.data.inventory.selectedItem === 'item_box';
    this.ai.player = this.player;
    this.bullets.clear();
    this.punchFx = null;
    this.reinforce = { spawned: 0, timer: TIMING.REINFORCE_INTERVAL };
    this.room.tm.exitsLocked = this.exitLockTimer > 0;
    this.progress.data.roomId = roomId;
    this.progress.data.entryId = entry.id;
    this.roomSnapshot = this.progress.snapshot();
    this.pendingFollowers = [];
    for (let i = 0; i < opts.followers; i++) {
      this.pendingFollowers.push({
        delay: TIMING.FOLLOW_DELAY + i * 0.6,
        armed: !!opts.armedFollowers,
      });
    }
    if (this.alert.level === ALERT.ALERT)
      this.alert.lastKnown = { x: this.player.x, y: this.player.y };
    if (this.alert.level === ALERT.INFILTRATION) this.autoSave();
    this.game.bus.emit('ROOM_ENTER', { roomId, entryId: entry.id });
  }

  autoSave() {
    const res = this.game.save.save(this.progress.snapshot());
    if (!res.persisted) this.game.overlays.saveUnavailable();
    return res;
  }

  /** Bakes the static tiles of a room (two water frames). */
  background(frame) {
    const key = `${this.room.id}:${frame}`;
    let c = this.bgCache.get(key);
    if (c) return c;
    c = makeCanvas(WIDTH, PLAY_H);
    const ctx = c.getContext('2d');
    const sheet = this.game.renderer.sprites;
    for (let ty = 0; ty < ROWS; ty++) {
      for (let tx = 0; tx < COLS; tx++) {
        const ch = this.room.def.tiles[ty][tx];
        if (ch === 'D') continue;
        ctx.drawImage(sheet.get(tileSpriteName(ch, tx, ty, frame)), tx * TILE, ty * TILE);
      }
    }
    this.bgCache.set(key, c);
    return c;
  }

  // ---------------------------------------------------------------- events

  onSpotted(g) {
    if (this.player.dead) return;
    g.showBubble('!', 1.5);
    this.game.audio.playSfx('sfx_alert');
    this.game.renderer.fx.flash(2);
    this.alert.spotted(this.player.x, this.player.y);
    this.game.bus.emit('PLAYER_SPOTTED', { byId: g.id, x: this.player.x, y: this.player.y });
  }

  onAlertChanged({ to }) {
    const audio = this.game.audio;
    if (to === ALERT.ALERT) {
      this.progress.bump('alerts');
      audio.playMusic('trk_alert', { fadeMs: 150 });
      audio.setAlarm(true);
      this.exitLockTimer = TIMING.EXIT_LOCK;
      this.room.tm.exitsLocked = true;
      this.reinforce.timer = TIMING.REINFORCE_INTERVAL;
      this.ring = 0;
    } else if (to === ALERT.EVASION) {
      audio.setAlarm(false);
      audio.playMusic('trk_evasion', { fadeMs: 400 });
    } else {
      audio.setAlarm(false);
      audio.playSfx('sfx_evasion_end');
      audio.playMusic(this.room.def.music, { fadeMs: 800 });
      if (this.progress.markTrigger('tut_first_alert')) this.codec.request('dlg_hale_first_alert');
    }
  }

  /** @param {string} text */
  showBanner(text, time = TIMING.BANNER) {
    this.banner = { text, t: time };
  }

  /** Banner with a cooldown, for repeated hints (locked doors, exits). */
  hint(text, sfx) {
    if (this.bannerCooldown > 0) return;
    this.bannerCooldown = 1;
    this.showBanner(text);
    if (sfx) this.game.audio.playSfx(sfx);
  }

  damagePlayer(amount) {
    const p = this.player;
    if (p.dead || p.invuln > 0) return;
    const pd = this.progress.data.player;
    pd.hp = Math.max(0, pd.hp - amount);
    p.invuln = PLAYER.INVULN;
    this.game.audio.playSfx('sfx_hit');
    this.game.renderer.fx.flash(2, C.RED);
    this.game.renderer.fx.shake(6, 2);
    this.game.bus.emit('PLAYER_DAMAGED', { hp: pd.hp });
    if (pd.hp <= 0) this.die();
  }

  die() {
    const p = this.player;
    p.dead = true;
    p.startAction('dead', PLAYER.DEATH_TIME);
    this.deathTimer = PLAYER.DEATH_TIME + 0.4;
    this.game.audio.setAlarm(false);
    this.game.audio.stopMusic(200);
    this.game.audio.playSfx('sfx_death');
    this.game.bus.emit('PLAYER_DIED', { hp: 0 });
  }

  continueAfterDeath() {
    this.progress.restore(this.roomSnapshot);
    this.progress.data.player.hp = this.progress.data.player.maxHp;
    this.progress.bump('continues');
    this.alert.reset();
    this.exitLockTimer = 0;
    this.codec.clear();
    this.ring = 0;
    this.rooms.reset();
    this.room = null;
    this.loadRoom(this.progress.data.roomId, this.progress.data.entryId, { followers: 0 });
    this.game.audio.playMusic(this.room.def.music, { fadeMs: 400 });
  }

  // ---------------------------------------------------------------- actions

  /** Tile in front of the player (where they push or act). */
  frontTile() {
    const p = this.player;
    const fx = p.x + p.dirX * (PLAYER.RADIUS + 3);
    const fy = p.y + p.dirY * (PLAYER.RADIUS + 3);
    return { tx: Math.floor(fx / TILE), ty: Math.floor(fy / TILE) };
  }

  doorInFront() {
    const { tx, ty } = this.frontTile();
    return this.room.doors.find((d) => d.tx === tx && d.ty === ty && !d.open) || null;
  }

  /** @param {any} door */
  attemptDoor(door) {
    const inv = this.progress.data.inventory;
    const getItem = this.game.registry.getItem;
    if (door.level === 0 || equippedCardLevel(inv, getItem) >= door.level) {
      door.open = true;
      this.room.tm.doorAt(door.tx, door.ty).open = true;
      this.progress.markDoor(door.id);
      this.game.audio.playSfx('sfx_door');
      this.game.bus.emit('DOOR_OPENED', { doorId: door.id });
      return;
    }
    const card = cardForLevel(inv, getItem, door.level);
    if (card) this.hint(`EQUIP ${card.short}`, 'sfx_denied');
    else this.hint(`LEVEL ${door.level} CARD REQUIRED`, 'sfx_denied');
  }

  doAction() {
    const p = this.player;
    const audio = this.game.audio;
    const door = this.doorInFront();
    if (door) {
      this.attemptDoor(door);
      return;
    }
    if (p.boxOn) {
      this.hint('UNEQUIP THE BOX FIRST', 'sfx_denied');
      return;
    }
    const guards = this.room.guards;
    const target = findTakedownTarget(p, guards);
    if (target) {
      p.startAction('takedown', PLAYER.TAKEDOWN_TIME);
      knockOut(target);
      this.progress.bump('takedowns');
      audio.playSfx('sfx_takedown');
      this.game.renderer.fx.shake(6, 2);
      this.punchFx = { x: target.x, y: target.y - 6, t: 0.25 };
      this.game.bus.emit('GUARD_DOWN', { guardId: target.id, lethal: false });
      this.dropFrom(target);
      return;
    }
    p.startAction('punch', PLAYER.PUNCH_TIME);
    audio.playSfx('sfx_punch');
    this.noise.emit(p.x, p.y, NOISE.PUNCH);
    this.punchFx = { x: p.x + p.dirX * 10, y: p.y + p.dirY * 10 - 2, t: 0.15 };
    const hit = findPunchTarget(p, guards);
    if (!hit) return;
    hit.hp -= 1;
    hit.hitFlash = 0.25;
    if (hit.hp <= 0) {
      knockOut(hit);
      this.progress.bump('takedowns');
      this.game.bus.emit('GUARD_DOWN', { guardId: hit.id, lethal: false });
      this.dropFrom(hit);
    } else if (this.alert.level !== ALERT.ALERT) {
      hit.dir = Math.atan2(p.y - hit.y, p.x - hit.x);
      this.onSpotted(hit);
    }
  }

  dropFrom(g) {
    const p = this.rooms.dropCarried(this.room, g);
    if (p) this.game.audio.playSfx('sfx_menu_select');
  }

  // ---------------------------------------------------------------- update

  update(dt) {
    const game = this.game;
    const input = game.input;
    this.time += dt;
    this.progress.addPlayTime(dt * 1000);
    if (this.banner) {
      this.banner.t -= dt;
      if (this.banner.t <= 0) this.banner = null;
    }
    if (this.bannerCooldown > 0) this.bannerCooldown -= dt;
    if (this.inputGuard > 0) this.inputGuard -= dt;
    if (this.punchFx) {
      this.punchFx.t -= dt;
      if (this.punchFx.t <= 0) this.punchFx = null;
    }

    if (this.transition) {
      this.updateTransition();
      return;
    }
    if (this.ending) {
      this.updateEnding(dt);
      return;
    }
    if (this.player.dead) {
      this.player.update(dt, { x: 0, y: 0 }, this.room.tm);
      this.updateGuards(dt);
      this.deathTimer -= dt;
      if (this.deathTimer <= 0) game.scenes.push(game.create('gameover'));
      return;
    }

    const guarded = this.inputGuard > 0;
    if (!guarded && (input.justPressed('pause') || input.justPressed('confirm'))) {
      game.scenes.push(game.create('pause'), { play: this });
      return;
    }

    const inv = this.progress.data.inventory;
    if (input.justPressed('item')) {
      const sel = cycleItem(inv);
      game.audio.playSfx(sel === 'item_box' || this.player.boxOn ? 'sfx_box' : 'sfx_menu_move');
      this.showBanner(sel ? game.registry.getItem(sel).name : 'NO ITEM', 1);
    }
    this.player.boxOn = inv.selectedItem === 'item_box';
    if (input.justPressed('weapon')) {
      const before = inv.selectedWeapon;
      const w = cycleWeapon(inv);
      if (w === before) this.showBanner('NO OTHER WEAPON', 1);
      else this.showBanner(game.registry.getItem(w).name, 1);
      game.audio.playSfx('sfx_menu_move');
    }
    if (!guarded && input.justPressed('action') && !this.player.busy) this.doAction();

    const axis = input.axis();
    const stepped = this.player.update(dt, axis, this.room.tm);
    if (stepped) this.footstep();
    if ((axis.x !== 0 || axis.y !== 0) && !this.player.busy) {
      const door = this.doorInFront();
      if (door) this.attemptDoor(door);
    }
    if (this.checkExit(axis)) return;
    this.checkDoorTransition();
    this.collectPickups();
    for (const d of this.room.doors) d.update(dt);
    for (const pk of this.room.pickups) pk.update(dt);

    const seen = this.updateGuards(dt);
    const camSeen = this.updateCameras(dt);
    this.alert.update(dt, seen || camSeen, this.player);
    this.updateReinforcements(dt);

    if (this.exitLockTimer > 0) {
      this.exitLockTimer -= dt;
      if (this.exitLockTimer <= 0) this.room.tm.exitsLocked = false;
    }

    this.bullets.update(
      dt,
      this.room.tm,
      this.player,
      () => this.damagePlayer(GUARD.BULLET_DAMAGE),
      () => game.audio.playSfx('sfx_bullet_wall'),
    );

    const fired = checkTriggers(this.room.triggers, this.player, this.progress, (t) =>
      t.type === 'codec' ? this.alert.level === ALERT.INFILTRATION : true,
    );
    for (const t of fired) {
      if (t.type === 'codec') this.codec.request(t.dialogueId);
      else if (t.type === 'chapterEnd') this.startChapterEnd();
    }

    this.updateCodecRing(dt);

    const pd = this.progress.data.player;
    if (pd.hp <= pd.maxHp * 0.25) {
      this.heartbeat -= dt;
      if (this.heartbeat <= 0) {
        this.heartbeat = 0.9;
        game.audio.playSfx('sfx_heartbeat');
      }
    }
  }

  footstep() {
    const p = this.player;
    const type = this.room.tm.typeAtPx(p.x, p.y);
    if (p.boxOn) this.game.audio.playSfx('sfx_box');
    else if (type.step) this.game.audio.playSfx(`sfx_step_${type.step}`);
    if (type.step === 'loud') this.noise.emit(p.x, p.y, NOISE.METAL_STEP);
  }

  updateGuards(dt) {
    const w = this.ai;
    w.dt = dt;
    w.noises = this.noise.drain();
    let seen = false;
    for (const g of this.room.guards) {
      updateGuard(g, w);
      if (g.seesPlayer && !g.down) seen = true;
      if (!g.moving) g.animTime = 0;
    }
    this.room.guards = this.room.guards.filter((g) => !g.gone);
    return seen;
  }

  updateCameras(dt) {
    let seen = false;
    for (const cam of this.room.cameras) {
      cam.update(dt);
      const range = this.alert.level === ALERT.INFILTRATION ? CAMERA_RANGE : CAMERA_RANGE * 1.2;
      cam.seesPlayer = canSeePlayer(
        this.room.tm,
        cam.x,
        cam.y,
        cam.dir,
        CAMERA_FOV,
        range,
        this.player,
      );
      if (cam.seesPlayer) {
        seen = true;
        cam.spotTimer += dt;
        if (this.alert.level !== ALERT.ALERT && cam.spotTimer >= TIMING.SPOT_GRACE) {
          cam.spotTimer = 0;
          this.game.audio.playSfx('sfx_alert');
          this.alert.spotted(this.player.x, this.player.y);
        }
      } else cam.spotTimer = 0;
    }
    return seen;
  }

  updateReinforcements(dt) {
    const def = this.room.def;
    for (const f of this.pendingFollowers) f.delay -= dt;
    const ready = this.pendingFollowers.filter((f) => f.delay <= 0);
    this.pendingFollowers = this.pendingFollowers.filter((f) => f.delay > 0);
    for (const f of ready) {
      if (this.alert.level === ALERT.INFILTRATION) break;
      this.spawnReinforcement({ x: this.entry.x, y: this.entry.y }, f.armed);
    }
    if (this.alert.level !== ALERT.ALERT) return;
    if (this.reinforce.spawned >= MAX_REINFORCEMENTS) return;
    this.reinforce.timer -= dt;
    if (this.reinforce.timer > 0) return;
    this.reinforce.timer = TIMING.REINFORCE_INTERVAL;
    let best = null;
    let bestD = -1;
    for (const e of def.entries) {
      const d = dist(center(e.x), center(e.y), this.player.x, this.player.y);
      if (d > bestD) {
        bestD = d;
        best = e;
      }
    }
    if (best)
      this.spawnReinforcement(
        best,
        def.guards.some((g) => g.armed),
      );
  }

  spawnReinforcement(tile, armed) {
    this.reinforce.spawned++;
    const n = this.reinforce.spawned;
    const g = new Guard(
      {
        id: `rf_${this.room.id}_${n}_${Math.floor(this.time * 10)}`,
        route: [],
        armed,
        reinforcement: true,
        facing: 'S',
      },
      { x: center(tile.x), y: center(tile.y) },
    );
    g.home = { x: center(tile.x), y: center(tile.y) };
    setState(g, G.CHASE);
    g.showBubble('!', 1);
    this.room.guards.push(g);
  }

  collectPickups() {
    const p = this.player;
    const registry = this.game.registry;
    for (const pk of this.room.pickups) {
      if (pk.taken || dist(p.x, p.y, pk.x, pk.y) > PLAYER.PICKUP_RANGE) continue;
      pk.taken = true;
      const def = registry.getItem(pk.itemId);
      if (!this.progress.collect(pk.id, def, pk.qty)) continue;
      this.game.audio.playSfx('sfx_pickup');
      this.showBanner(def.name);
      this.game.bus.emit('ITEM_PICKED', { pickupId: pk.id, itemId: def.id, qty: pk.qty });
      if (def.codecOnFirstPickup && this.progress.markTrigger(`pickup:${def.id}`)) {
        this.codec.request(def.codecOnFirstPickup);
      }
    }
    this.room.pickups = this.room.pickups.filter((pk) => !pk.taken);
  }

  /** Leaving through an edge exit. */
  checkExit(axis) {
    const p = this.player;
    const tm = this.room.tm;
    if (tm.exitsLocked && (axis.x !== 0 || axis.y !== 0)) {
      const nx = Math.floor((p.x + axis.x * (PLAYER.RADIUS + 2)) / TILE);
      const ny = Math.floor((p.y + axis.y * (PLAYER.RADIUS + 2)) / TILE);
      if (tm.isExitTile(nx, ny)) this.hint('EXITS SEALED!', 'sfx_denied');
    }
    let edge = null;
    if (p.x < 0) edge = 'W';
    else if (p.x > COLS * TILE) edge = 'E';
    else if (p.y < 0) edge = 'N';
    else if (p.y > ROWS * TILE) edge = 'S';
    if (!edge) return false;
    const tx = Math.floor(p.x / TILE);
    const ty = Math.floor(p.y / TILE);
    const ex = this.room.def.exits.find((e) => {
      if (e.edge !== edge) return false;
      const along = edge === 'W' || edge === 'E' ? ty : tx;
      return along >= e.from && along <= e.to;
    });
    if (!ex) return false;
    this.beginTransition(ex.targetRoom, ex.targetEntry);
    return true;
  }

  checkDoorTransition() {
    const p = this.player;
    const tx = Math.floor(p.x / TILE);
    const ty = Math.floor(p.y / TILE);
    const door = this.room.doors.find((d) => d.open && d.tx === tx && d.ty === ty && d.targetRoom);
    if (door) this.beginTransition(door.targetRoom, door.targetEntry);
  }

  beginTransition(roomId, entryId) {
    const chasers = this.room.guards.filter((g) => g.state === G.CHASE && !g.down);
    const followers =
      this.alert.level === ALERT.ALERT ? Math.min(MAX_FOLLOWERS, chasers.length) : 0;
    this.transition = {
      phase: 'out',
      frame: 0,
      roomId,
      entryId,
      followers,
      armed: chasers.some((g) => g.armed),
    };
  }

  updateTransition() {
    const t = this.transition;
    const fx = this.game.renderer.fx;
    const per = TIMING.FADE_FRAMES / 4;
    t.frame++;
    if (t.phase === 'out') {
      fx.setFade(Math.ceil(t.frame / per));
      if (t.frame >= TIMING.FADE_FRAMES) {
        this.loadRoom(t.roomId, t.entryId, { followers: t.followers, armedFollowers: t.armed });
        if (this.alert.level === ALERT.INFILTRATION) this.game.audio.playMusic(this.room.def.music);
        t.phase = 'in';
        t.frame = 0;
      }
    } else {
      fx.setFade(4 - Math.floor(t.frame / per));
      if (t.frame >= TIMING.FADE_FRAMES) {
        fx.setFade(0);
        this.transition = null;
      }
    }
  }

  updateCodecRing(dt) {
    if (this.ring > 0) {
      this.ring -= dt;
      if (this.ring <= 0) {
        this.ring = 0;
        const call = this.codec.next();
        if (call) this.game.scenes.push(this.game.create('codec'), { dialogueId: call.dialogueId });
      }
      return;
    }
    if (this.codec.pending && this.alert.level === ALERT.INFILTRATION && !this.player.busy) {
      this.ring = TIMING.CODEC_RING;
      this.game.audio.playSfx('sfx_codec_ring');
    }
  }

  startChapterEnd() {
    if (this.ending) return;
    this.progress.markStory('ch0_complete');
    const snap = this.progress.snapshot();
    snap.entryId = 'west';
    const res = this.game.save.save(snap);
    if (!res.persisted) this.game.overlays.saveUnavailable();
    this.ending = { t: 0 };
    this.game.audio.setAlarm(false);
    this.game.audio.playMusic('trk_victory', { fadeMs: 100 });
  }

  updateEnding(dt) {
    this.ending.t += dt;
    const fx = this.game.renderer.fx;
    fx.setFade(Math.min(4, Math.floor(this.ending.t * 2.5)));
    if (this.ending.t >= 2.2) {
      fx.setFade(0);
      this.game.scenes.replaceAll(this.game.create('chapterend'), {
        stats: { ...this.progress.data.stats },
      });
    }
  }

  // ---------------------------------------------------------------- render

  render(r) {
    const ctx = r.ctx;
    const off = r.fx.nextShakeOffset();
    ctx.save();
    ctx.translate(off.x, off.y);
    const waterFrame = Math.floor(r.time * 1.5) % 2;
    ctx.drawImage(this.background(waterFrame), 0, 0);
    for (const d of this.room.doors) {
      r.sprite(d.open ? 'tile_door_open' : `tile_door_${d.level}`, d.tx * TILE, d.ty * TILE);
    }
    for (const pk of this.room.pickups) {
      const icon = this.game.registry.getItem(pk.itemId).icon;
      r.sprite(icon, pk.x - 8, pk.y - 9 - pk.bob);
    }
    this.renderCones(r);
    this.renderEntities(r);
    this.bullets.pool.forEachActive((b) => r.sprite('bullet', b.x - 1, b.y - 1));
    if (this.punchFx) r.sprite('fx_punch', this.punchFx.x - 4, this.punchFx.y - 4);
    ctx.restore();

    const data = this.progress.data;
    const registry = this.game.registry;
    const weapon = registry.getItem(data.inventory.selectedWeapon);
    const item = data.inventory.selectedItem ? registry.getItem(data.inventory.selectedItem) : null;
    drawHud(r, {
      hp: data.player.hp,
      maxHp: data.player.maxHp,
      level: this.alert.level,
      evasionSeconds: this.alert.evasionSeconds,
      weapon: { icon: weapon.icon, label: weapon.short },
      item: item ? { icon: item.icon, label: item.short } : null,
      call: this.ring > 0,
      roomLabel: `CH.${data.chapter} ${this.room.id}`,
      reduceFlashing: this.game.settings.get().reduceFlashing,
    });
    if (this.banner) drawBanner(r, this.banner.text);
  }

  renderCones(r) {
    const level = this.alert.level;
    const v = visionParams(level, !!this.room.def.dark);
    const flashOn = Math.floor(r.time * 30) % 2 === 0;
    for (const g of this.room.guards) {
      if (g.down) continue;
      const pts = buildCone(this.room.tm, g.x, g.y, g.dir, v.fov, v.range, 18, this.coneBuf);
      if (level === ALERT.ALERT) r.ditherPolygon(pts, C.RED, 75);
      else if (g.spotTimer > 0) r.ditherPolygon(pts, flashOn ? C.WHITE : C.YELLOW, 50);
      else r.ditherPolygon(pts, level === ALERT.EVASION ? C.AMBER : C.YELLOW, 50);
    }
    for (const cam of this.room.cameras) {
      const pts = buildCone(
        this.room.tm,
        cam.x,
        cam.y,
        cam.dir,
        CAMERA_FOV,
        CAMERA_RANGE,
        14,
        this.coneBuf,
      );
      r.ditherPolygon(pts, level === ALERT.ALERT ? C.RED : C.YELLOW, 25);
    }
  }

  renderEntities(r) {
    const list = [...this.room.guards, this.player];
    list.sort((a, b) => a.y - b.y);
    for (const e of list) {
      if (e === this.player) this.renderPlayer(r);
      else this.renderGuard(r, e);
    }
    for (const cam of this.room.cameras) r.sprite(cam.spriteName(), cam.x - 6, cam.y - 6);
  }

  renderPlayer(r) {
    const p = this.player;
    if (p.invuln > 0 && !p.dead && Math.floor(r.time * 20) % 2 === 0) return;
    if (p.dead) {
      r.sprite('wren_down', p.x - 8, p.y - 8);
      return;
    }
    const bob = p.boxOn && p.moving ? Math.floor(p.animTime * 8) % 2 : 0;
    r.sprite(p.spriteName(), p.x - 8, p.y - 10 - bob);
    if (!p.boxOn && this.room.tm.typeAtPx(p.x, p.y).hide === 'inside') {
      r.dither(p.x - 8, p.y - 4, 16, 10, C.GREEN, 75);
    }
    if (p.boxOn && isConcealed(p, this.room.tm)) {
      const near = this.room.guards.some((g) => !g.down && dist(g.x, g.y, p.x, p.y) < 40);
      if (near) r.sprite('bubble_suspect', p.x - 5, p.y - 24);
    }
  }

  renderGuard(r, g) {
    if (g.down) {
      r.sprite('guard_down', g.x - 8, g.y - 8);
      if (Math.floor(r.time * 2) % 2 === 0) r.sprite('fx_zzz', g.x + 2, g.y - 14);
      return;
    }
    if (g.hitFlash > 0 && Math.floor(r.time * 20) % 2 === 0) return;
    r.sprite(g.spriteName(), g.x - 8, g.y - 10);
    if (g.bubble === '!') r.sprite('bubble_alert', g.x - 5, g.y - 24);
    else if (g.bubble === '?') r.sprite('bubble_suspect', g.x - 5, g.y - 24);
  }
}

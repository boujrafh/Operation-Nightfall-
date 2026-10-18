import { COLS, ROWS } from '../core/config.js';
import { LEGEND } from '../world/tilemap.js';
import { findPath, reachable } from '../world/pathfinding.js';

const OPPOSITE = { N: 'S', S: 'N', E: 'W', W: 'E' };

/**
 * Checks all content (Doc 06 §5). Returns a list of error messages;
 * an empty list means the content is valid.
 * @param {any} content CONTENT object from registry.js
 */
export function validateContent(content) {
  const errors = [];
  const err = (m) => errors.push(m);

  // 1. Global ID uniqueness (entries are room-local names).
  const seen = new Map();
  const claim = (id, where) => {
    if (seen.has(id)) err(`Duplicate id "${id}" in ${where} (already in ${seen.get(id)})`);
    else seen.set(id, where);
  };
  content.items.forEach((x) => claim(x.id, 'items'));
  content.dialogues.forEach((x) => claim(x.id, 'dialogues'));
  content.characters.forEach((x) => claim(x.id, 'characters'));
  content.tracks.forEach((x) => claim(x.id, 'tracks'));
  content.sfx.forEach((x) => claim(x.id, 'sfx'));
  for (const r of content.rooms) {
    claim(`room:${r.id}`, 'rooms');
    for (const list of ['exits', 'doors', 'guards', 'pickups', 'triggers', 'cameras']) {
      (r[list] || []).forEach((x) => claim(x.id, `room ${r.id} ${list}`));
    }
  }

  const items = new Map(content.items.map((i) => [i.id, i]));
  const rooms = new Map(content.rooms.map((r) => [r.id, r]));
  const dialogues = new Set(content.dialogues.map((d) => d.id));
  const tracks = new Set(content.tracks.map((t) => t.id));
  const characters = new Set(content.characters.map((c) => c.id));

  // 2. Items
  for (const it of content.items) {
    if (!it.short || it.short.length > 7) err(`Item ${it.id}: short name must be 1-7 chars`);
    if (it.kind === 'card' && ![1, 2, 3, 4].includes(it.cardLevel))
      err(`Card ${it.id}: cardLevel 1-4`);
    if (it.codecOnFirstPickup && !dialogues.has(it.codecOnFirstPickup))
      err(`Item ${it.id}: unknown dialogue ${it.codecOnFirstPickup}`);
  }

  // 3. Dialogues
  for (const d of content.dialogues) {
    if (!characters.has(d.caller)) err(`Dialogue ${d.id}: unknown caller ${d.caller}`);
    if (!d.lines || !d.lines.length) err(`Dialogue ${d.id}: no lines`);
    for (const l of d.lines || []) {
      if (!characters.has(l.speaker)) err(`Dialogue ${d.id}: unknown speaker ${l.speaker}`);
      if (l.text.length > 120) err(`Dialogue ${d.id}: line longer than 120 chars`);
    }
  }
  for (const [who, call] of Object.entries(content.codecCalls)) {
    if (!characters.has(who)) err(`Codec call: unknown character ${who}`);
    for (const id of [call.default, ...Object.values(call.byRoom)]) {
      if (!dialogues.has(id)) err(`Codec call ${who}: unknown dialogue ${id}`);
    }
  }

  // 4. Rooms
  for (const r of content.rooms) {
    const where = `Room ${r.id}`;
    if (!Array.isArray(r.tiles) || r.tiles.length !== ROWS) {
      err(`${where}: must have ${ROWS} rows`);
      continue;
    }
    r.tiles.forEach((row, y) => {
      if (row.length !== COLS) err(`${where}: row ${y} must have ${COLS} chars`);
      for (const ch of row)
        if (!LEGEND.includes(ch)) err(`${where}: unknown tile "${ch}" in row ${y}`);
    });
    if (!tracks.has(r.music)) err(`${where}: unknown music ${r.music}`);
    if (!r.entries.length) err(`${where}: needs at least one entry`);
    const at = (x, y) => (x >= 0 && y >= 0 && x < COLS && y < ROWS ? r.tiles[y][x] : '#');
    const doorAt = new Map(r.doors.map((d) => [`${d.x},${d.y}`, d]));
    const walk = (x, y, openDoors = false) => {
      const ch = at(x, y);
      if (ch === 'D') return openDoors && doorAt.has(`${x},${y}`);
      return ['.', ',', '=', ':', 'B'].includes(ch);
    };
    for (const e of r.entries) if (!walk(e.x, e.y)) err(`${where}: entry ${e.id} is not walkable`);
    for (const d of r.doors) {
      if (at(d.x, d.y) !== 'D') err(`${where}: door ${d.id} not on a D tile`);
      if (d.targetRoom && !rooms.has(d.targetRoom)) err(`${where}: door ${d.id} unknown room`);
    }
    for (const ex of r.exits) {
      const target = rooms.get(ex.targetRoom);
      if (!target) {
        err(`${where}: exit ${ex.id} unknown room ${ex.targetRoom}`);
        continue;
      }
      if (!target.entries.some((e) => e.id === ex.targetEntry))
        err(`${where}: exit ${ex.id} unknown entry ${ex.targetEntry}`);
      const back = target.exits.some((b) => b.targetRoom === r.id && b.edge === OPPOSITE[ex.edge]);
      if (!back && !ex.oneWay)
        err(`${where}: exit ${ex.id} has no exit back from ${ex.targetRoom}`);
      for (let i = ex.from; i <= ex.to; i++) {
        const [x, y] =
          ex.edge === 'W'
            ? [0, i]
            : ex.edge === 'E'
              ? [COLS - 1, i]
              : ex.edge === 'N'
                ? [i, 0]
                : [i, ROWS - 1];
        if (!walk(x, y)) err(`${where}: exit ${ex.id} opening at ${x},${y} is blocked`);
      }
    }
    for (const p of r.pickups) {
      if (!items.has(p.itemId)) err(`${where}: pickup ${p.id} unknown item ${p.itemId}`);
      if (!walk(p.x, p.y)) err(`${where}: pickup ${p.id} not on a walkable tile`);
    }
    for (const t of r.triggers) {
      if (t.type === 'codec' && !dialogues.has(t.dialogueId))
        err(`${where}: trigger ${t.id} unknown dialogue`);
      for (const req of t.requires || []) {
        if (!r.triggers.some((o) => o.id === req))
          err(`${where}: trigger ${t.id} requires unknown ${req}`);
      }
    }
    for (const g of r.guards) {
      if (g.carries && !items.has(g.carries)) err(`${where}: guard ${g.id} carries unknown item`);
      if (!g.route || !g.route.length) {
        err(`${where}: guard ${g.id} has no route`);
        continue;
      }
      for (const wp of g.route)
        if (!walk(wp.x, wp.y)) err(`${where}: guard ${g.id} waypoint ${wp.x},${wp.y} blocked`);
      const pairs = [];
      for (let i = 0; i + 1 < g.route.length; i++) pairs.push([g.route[i], g.route[i + 1]]);
      if (g.loop === 'cycle' && g.route.length > 2)
        pairs.push([g.route[g.route.length - 1], g.route[0]]);
      for (const [a, b] of pairs) {
        if (!findPath((x, y) => walk(x, y), a, b))
          err(`${where}: guard ${g.id} cannot walk ${a.x},${a.y} -> ${b.x},${b.y}`);
      }
    }
    // the first entry must reach at least one exit or door
    const start = r.entries[0];
    const reach = reachable((x, y) => walk(x, y, true), start);
    const exitTiles = [];
    for (const ex of r.exits) {
      for (let i = ex.from; i <= ex.to; i++) {
        exitTiles.push(
          ex.edge === 'W'
            ? [0, i]
            : ex.edge === 'E'
              ? [COLS - 1, i]
              : ex.edge === 'N'
                ? [i, 0]
                : [i, ROWS - 1],
        );
      }
    }
    for (const d of r.doors) exitTiles.push([d.x, d.y]);
    if (exitTiles.length && !exitTiles.some(([x, y]) => reach.has(`${x},${y}`)))
      err(`${where}: entry ${start.id} cannot reach any exit`);
  }

  // 5. Chapters: rooms exist, start entry exists, cards reachable before doors
  for (const ch of content.chapters) {
    const where = `Chapter ${ch.id}`;
    for (const id of ch.rooms) if (!rooms.has(id)) err(`${where}: unknown room ${id}`);
    const sr = rooms.get(ch.startRoom);
    if (!sr) err(`${where}: unknown start room`);
    else if (!sr.entries.some((e) => e.id === ch.startEntry)) err(`${where}: unknown start entry`);
    if (!dialogues.has(ch.briefingDialogue)) err(`${where}: unknown briefing dialogue`);
    const levels = new Set();
    for (const id of ch.rooms)
      for (const d of rooms.get(id)?.doors || []) if (d.level > 0) levels.add(d.level);
    for (const level of levels) {
      if (!cardObtainable(content, ch, level, rooms, items))
        err(`${where}: no card >= ${level} reachable before its doors`);
    }
  }
  return errors;
}

/**
 * True when a card of `level` or higher can be collected without passing
 * any door of `level` or higher (no soft-lock).
 */
function cardObtainable(content, ch, level, rooms, items) {
  const isCard = (id) => {
    const it = items.get(id);
    return it && it.kind === 'card' && it.cardLevel >= level;
  };
  const visited = new Set();
  const queue = [ch.startRoom];
  while (queue.length) {
    const id = queue.shift();
    if (visited.has(id) || !ch.rooms.includes(id)) continue;
    visited.add(id);
    const r = rooms.get(id);
    const doorOpen = (x, y) => {
      const d = r.doors.find((dd) => dd.x === x && dd.y === y);
      return d && d.level < level;
    };
    const walk = (x, y) => {
      const c = x >= 0 && y >= 0 && x < COLS && y < ROWS ? r.tiles[y][x] : '#';
      if (c === 'D') return doorOpen(x, y);
      return ['.', ',', '=', ':', 'B'].includes(c);
    };
    const reach = new Set();
    for (const e of r.entries) for (const k of reachable(walk, e)) reach.add(k);
    for (const p of r.pickups) if (isCard(p.itemId) && reach.has(`${p.x},${p.y}`)) return true;
    for (const g of r.guards) {
      if (g.carries && isCard(g.carries) && g.route.some((wp) => reach.has(`${wp.x},${wp.y}`)))
        return true;
    }
    for (const ex of r.exits) queue.push(ex.targetRoom);
    for (const d of r.doors) if (d.targetRoom && d.level < level) queue.push(d.targetRoom);
  }
  return false;
}

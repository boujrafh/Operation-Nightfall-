import { ITEMS } from './items.js';
import { CHARACTERS } from './characters.js';
import { CHAPTERS } from './chapters.js';
import { DIALOGUES, CODEC_CALLS } from './dialogue/ch0.js';
import { TRACKS } from './music/tracks.js';
import { SFX } from './sfx/sfx-defs.js';
import room01 from './rooms/room-0-1.js';
import room02 from './rooms/room-0-2.js';
import room03 from './rooms/room-0-3.js';

export const CONTENT = {
  items: ITEMS,
  characters: CHARACTERS,
  chapters: CHAPTERS,
  dialogues: DIALOGUES,
  codecCalls: CODEC_CALLS,
  tracks: TRACKS,
  sfx: SFX,
  rooms: [room01, room02, room03],
};

/** Deep-freezes content so no system can modify it by accident. */
function deepFreeze(o) {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const v of Object.values(o)) deepFreeze(v);
  }
  return o;
}

/**
 * Read-only lookup of all content by stable ID.
 * @param {typeof CONTENT} content
 */
export function createRegistry(content = CONTENT) {
  const byId = (list, kind) => {
    const m = new Map();
    for (const x of list) {
      if (m.has(x.id)) throw new Error(`Duplicate ${kind} id: ${x.id}`);
      m.set(x.id, deepFreeze(x));
    }
    return m;
  };
  const items = byId(content.items, 'item');
  const rooms = byId(content.rooms, 'room');
  const dialogues = byId(content.dialogues, 'dialogue');
  const characters = byId(content.characters, 'character');
  const tracks = byId(content.tracks, 'track');
  const sfx = byId(content.sfx, 'sfx');
  const chapters = new Map(content.chapters.map((c) => [c.id, deepFreeze(c)]));
  const get = (map, kind) => (id) => {
    const v = map.get(id);
    if (!v) throw new Error(`Unknown ${kind}: ${id}`);
    return v;
  };
  return {
    content,
    getItem: get(items, 'item'),
    hasItem: (id) => items.has(id),
    getRoom: get(rooms, 'room'),
    hasRoom: (id) => rooms.has(id),
    getDialogue: get(dialogues, 'dialogue'),
    hasDialogue: (id) => dialogues.has(id),
    getCharacter: get(characters, 'character'),
    listCharacters: () => [...characters.values()],
    getTrack: get(tracks, 'track'),
    hasTrack: (id) => tracks.has(id),
    getSfx: get(sfx, 'sfx'),
    getChapter: (n) => chapters.get(n) || null,
    codecCalls: deepFreeze(content.codecCalls),
  };
}

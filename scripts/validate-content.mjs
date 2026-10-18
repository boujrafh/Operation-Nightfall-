import { validateContent } from '../src/content/validate.js';
import { CONTENT, createRegistry } from '../src/content/registry.js';

const errors = validateContent(CONTENT);
try {
  createRegistry(CONTENT);
} catch (e) {
  errors.push(String(e.message || e));
}
if (errors.length) {
  console.error(`Content validation failed (${errors.length}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `Content OK: ${CONTENT.rooms.length} rooms, ${CONTENT.items.length} items, ${CONTENT.dialogues.length} dialogues, ${CONTENT.tracks.length} tracks`,
);

import { test, expect } from '@playwright/test';
import { nf, skipCodecs, startNewGame, waitScene } from './helpers.js';

test('new game: briefing, then Wren moves on the beach', async ({ page }) => {
  await startNewGame(page);
  const before = await nf(page, 'player');
  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(500);
  await page.keyboard.up('ArrowDown');
  await skipCodecs(page);
  const after = await nf(page, 'player');
  expect(after.y).toBeGreaterThan(before.y);
  expect(await nf(page, 'alert')).toBe('INFILTRATION');
});

test('pause menu opens and closes', async ({ page }) => {
  await startNewGame(page);
  // input is ignored for a short moment after a codec call closes
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await waitScene(page, 'pause');
  await page.keyboard.press('Escape');
  await waitScene(page, 'play');
});

test('progress is saved and CONTINUE is offered after a reload', async ({ page }) => {
  await startNewGame(page);
  await page.reload();
  await waitScene(page, 'pressstart');
  await page.keyboard.press('Enter');
  await waitScene(page, 'title');
  // CONTINUE is pre-selected when a save exists; the save is taken on room
  // entry, so the room's first codec call may ring again
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => ['play', 'codec'].includes(window.__nightfall.scene()));
  await page.waitForTimeout(1200);
  await skipCodecs(page);
  await waitScene(page, 'play');
  const p = await nf(page, 'player');
  expect(p).not.toBeNull();
});

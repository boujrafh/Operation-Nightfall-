import { test, expect } from '@playwright/test';
import { nf, skipCodecs, waitScene } from './helpers.js';

test('touch devices show the virtual stick and buttons', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#touch')).toBeVisible();
  await expect(page.locator('#btn-a')).toBeVisible();
  await expect(page.locator('#btn-b')).toBeVisible();
  await expect(page.locator('#btn-w')).toBeVisible();
});

test('a tap starts the game and the A button confirms menus', async ({ page }) => {
  await page.goto('/');
  await waitScene(page, 'pressstart');
  await page.locator('#screen').tap();
  await waitScene(page, 'title');
  await page.locator('#btn-a').tap();
  await waitScene(page, 'codec');
  await skipCodecs(page);
  await waitScene(page, 'play');
  expect(await nf(page, 'player')).not.toBeNull();
});

test('portrait: the game sits on top and the controls below it', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await page.goto('/');
  await expect(page.locator('body')).toHaveClass(/portrait/);
  const screen = await page.locator('#screen').boundingBox();
  for (const id of ['#btn-a', '#btn-b', '#btn-w', '#btn-pause']) {
    const btn = await page.locator(id).boundingBox();
    expect(btn.y).toBeGreaterThanOrEqual(screen.y + screen.height - 1);
    expect(btn.y + btn.height).toBeLessThanOrEqual(915);
  }
  expect(screen.width).toBeGreaterThan(350);
});

test('the stick moves the menu cursor', async ({ page }) => {
  await page.goto('/');
  await waitScene(page, 'pressstart');
  await page.locator('#screen').tap();
  await waitScene(page, 'title');
  // push the stick down once, then confirm: with no save, CONTINUE is skipped,
  // so OPTIONS is the next line below NEW GAME
  const zone = await page.locator('#stick-zone').boundingBox();
  const cx = zone.x + 120;
  const cy = zone.y + zone.height - 120;
  const client = await page.context().newCDPSession(page);
  const touch = (type, y) =>
    client.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: type === 'touchEnd' ? [] : [{ x: cx, y, id: 1 }],
    });
  for (let i = 0; i < 1; i++) {
    await touch('touchStart', cy);
    await touch('touchMove', cy + 30);
    await touch('touchMove', cy + 60);
    await page.waitForTimeout(80);
    await touch('touchEnd', cy + 60);
    await page.waitForTimeout(80);
  }
  await page.locator('#btn-a').tap();
  await waitScene(page, 'options');
});

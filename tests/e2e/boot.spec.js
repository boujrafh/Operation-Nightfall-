import { test, expect } from '@playwright/test';
import { waitScene } from './helpers.js';

test('boots to PRESS START then the title, without errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('#screen')).toBeVisible();
  await waitScene(page, 'pressstart');
  await page.keyboard.press('Space');
  await waitScene(page, 'title');
  expect(errors).toEqual([]);
});

test('has the PWA meta tags and manifest', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#000000');
  await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute(
    'content',
    'yes',
  );
  const manifest = await (await request.get('/manifest.webmanifest')).json();
  expect(manifest.display).toBe('fullscreen');
  expect(manifest.orientation).toBe('any');
  expect(manifest.icons.map((i) => i.sizes)).toEqual(
    expect.arrayContaining(['192x192', '512x512']),
  );
  for (const icon of manifest.icons) expect((await request.get(`/${icon.src}`)).ok()).toBe(true);
});

test('keeps the game ratio with letterboxing', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 600 });
  await page.goto('/');
  const box = await page.locator('#screen').boundingBox();
  expect(box.width / box.height).toBeCloseTo(256 / 212, 1);
  expect(box.height).toBeLessThanOrEqual(600);
});

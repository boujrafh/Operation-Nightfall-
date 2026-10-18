import { test, expect } from '@playwright/test';
import { waitScene } from './helpers.js';

test('works offline after the first visit', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    return reg.active && reg.active.state;
  });
  // let the service worker take control of the page
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await waitScene(page, 'pressstart');
  await expect(page.locator('#screen')).toBeVisible();
  const iconOk = await page.evaluate(async () => (await fetch('icons/icon-192.png')).ok);
  expect(iconOk).toBe(true);
  await context.setOffline(false);
});

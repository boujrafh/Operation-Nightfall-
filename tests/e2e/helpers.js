/** Reads the test hook exposed by main.js. */
export const nf = (page, key) => page.evaluate((k) => window.__nightfall[k](), key);

/** Waits until the given scene is on top. */
export async function waitScene(page, name, timeout = 8000) {
  await page.waitForFunction((n) => window.__nightfall && window.__nightfall.scene() === n, name, {
    timeout,
  });
}

/** Presses Enter until no codec call is open. */
export async function skipCodecs(page) {
  for (let i = 0; i < 100 && (await nf(page, 'scene')) === 'codec'; i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(40);
  }
}

/** From a fresh page load to controlling Wren on the beach. */
export async function startNewGame(page) {
  await page.goto('/');
  await waitScene(page, 'pressstart');
  await page.keyboard.press('Enter');
  await waitScene(page, 'title');
  await page.keyboard.press('Enter');
  await waitScene(page, 'codec');
  await skipCodecs(page);
  await waitScene(page, 'play');
  // the beach tutorial call rings right away
  await waitScene(page, 'codec');
  await skipCodecs(page);
  await waitScene(page, 'play');
}

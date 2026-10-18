/**
 * The 32x32 app icon (Doc 05 §13): a cardboard box with a red "!" bubble
 * under a yellow crescent moon, on a night background. Pure function, no
 * DOM, so the build script can turn it into PNG files.
 * @returns {number[][]} 32 rows of 32 palette indices
 */
export function buildIconGrid() {
  const N = 32;
  const g = Array.from({ length: N }, () => Array(N).fill(1));
  const rect = (x, y, w, h, c) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i >= 0 && j >= 0 && i < N && j < N) g[j][i] = c;
  };
  const disc = (cx, cy, r, c) => {
    for (let j = 0; j < N; j++)
      for (let i = 0; i < N; i++) if ((i - cx) ** 2 + (j - cy) ** 2 <= r * r) g[j][i] = c;
  };
  // stars
  for (const [x, y] of [
    [26, 3],
    [29, 9],
    [14, 2],
    [21, 6],
    [3, 13],
  ])
    g[y][x] = 15;
  // crescent moon
  disc(7, 7, 5, 11);
  disc(9, 5, 4.2, 1);
  // ground line
  rect(0, 27, 32, 5, 2);
  rect(0, 27, 32, 1, 14);
  // box
  rect(5, 17, 18, 12, 0);
  rect(6, 18, 16, 10, 9);
  rect(6, 20, 16, 1, 8);
  rect(6, 26, 16, 1, 8);
  rect(12, 22, 4, 3, 8);
  rect(6, 18, 16, 1, 10);
  // alert bubble
  rect(19, 5, 10, 11, 0);
  rect(18, 6, 12, 9, 0);
  rect(19, 6, 10, 9, 13);
  rect(23, 7, 2, 5, 15);
  rect(23, 13, 2, 1, 15);
  rect(21, 15, 3, 2, 13);
  rect(20, 16, 2, 1, 0);
  rect(21, 17, 1, 1, 0);
  return g;
}

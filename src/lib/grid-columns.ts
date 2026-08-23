/**
 * How many columns to draw a measured search grid in.
 *
 * ceil(sqrt(n)) is only right when n is a perfect square. A 32-point sweep
 * came back as six columns and a final row holding two cells, which reads
 * as a rendering fault rather than a map — and a client is looking at this
 * while deciding whether we are careful people.
 *
 * So: the divisor of n closest to its square root, preferring the wider
 * side, which gives a full rectangle with no orphan row. 32 becomes 8x4,
 * 30 becomes 6x5, 25 stays 5x5, 49 stays 7x7.
 *
 * A prime has no useful divisor — its only options are 1xn and nx1 — so
 * those fall back to a near-square with a short last row, which is the best
 * available and rare in practice.
 */
export function gridColumns(count: number): number {
  if (count <= 3) return Math.max(1, count);

  const root = Math.sqrt(count);
  const nearSquare = Math.ceil(root);

  let best: number | null = null;
  for (let columns = 2; columns <= count / 2; columns++) {
    if (count % columns !== 0) continue;
    if (columns < root) continue;
    best = columns;
    break;
  }

  // A very wide rectangle (a 2xN strip) is worse than a short last row.
  if (best === null || best > root * 2) return nearSquare;
  return best;
}

/**
 * Deterministic UUID-shaped id factory for tests. Yields
 * `00000000-0000-4000-8000-0000000000NN` in sequence.
 */
export function sequentialIdFactory(): () => string {
  let n = 0;
  return () => {
    n += 1;
    return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
  };
}

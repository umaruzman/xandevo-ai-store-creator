export type PathSegment = string | number;
export type Path = readonly PathSegment[];

/**
 * Immutably set `value` at `path` in `root`, cloning ONLY the nodes along the
 * path. Sibling nodes keep their identity, so `React.memo`'d subtrees that did
 * not change are skipped. Never mutates the input.
 */
export function setAtPath<T>(root: T, path: Path, value: unknown): T {
  if (path.length === 0) return value as T;
  const [head, ...rest] = path;

  if (Array.isArray(root)) {
    const index = Number(head);
    const next = root.slice();
    next[index] = setAtPath(root[index], rest, value);
    return next as unknown as T;
  }

  const obj = root as Record<PathSegment, unknown>;
  return { ...obj, [head as PathSegment]: setAtPath(obj[head as PathSegment], rest, value) } as T;
}

/** Read the value at `path`, or `undefined` if any segment is missing. */
export function getAtPath(root: unknown, path: Path): unknown {
  return path.reduce<unknown>((acc, seg) => {
    if (acc == null) return undefined;
    return (acc as Record<PathSegment, unknown>)[seg];
  }, root);
}

export const pathKey = (path: Path): string => path.join('.');

export type PlanCacheStats = {
  size: number;
  maxEntries: number;
  evictions: number;
};

/**
 * Minimal LRU cache built on the insertion-order guarantee of `Map`.
 *
 * Invariant: iteration order of `entries` is "least recently used first,
 * most recently used last". Therefore:
 * - a hit deletes and re-inserts the key (moves it to the end),
 * - an insert appends at the end,
 * - eviction removes the first key (`keys().next()`), all in O(1).
 *
 * Safety: Node.js runs JavaScript on a single thread per process, so a
 * synchronous get -> compile -> set sequence cannot interleave with another
 * request. Keep that sequence free of `await`. Each process / worker thread
 * has its own cache, which is fine because the cached values are derived data.
 *
 * Values must not be `undefined` (it is used to signal a miss).
 */
export class PlanCache<V> {
  private readonly entries = new Map<string, V>();

  private evictions = 0;

  constructor(private readonly maxEntries: number) {
    if (!Number.isInteger(maxEntries) || maxEntries < 1) {
      throw new RangeError('PlanCache maxEntries must be a positive integer');
    }
  }

  get(key: string): V | undefined {
    const value = this.entries.get(key);

    if (value === undefined) return undefined;

    // Refresh recency: re-inserting moves the key to the end of the order.
    this.entries.delete(key);
    this.entries.set(key, value);

    return value;
  }

  set(key: string, value: V): void {
    if (this.entries.has(key)) {
      // `set` on an existing key would keep its old position, so delete first.
      this.entries.delete(key);
    } else if (this.entries.size >= this.maxEntries) {
      // The first key is the least recently used one.
      const oldest = this.entries.keys().next();
      if (!oldest.done) {
        this.entries.delete(oldest.value);
        this.evictions++;
      }
    }

    this.entries.set(key, value);
  }

  has(key: string): boolean {
    return this.entries.has(key);
  }

  clear(): void {
    this.entries.clear();
    this.evictions = 0;
  }

  get size(): number {
    return this.entries.size;
  }

  stats(): PlanCacheStats {
    return {
      size: this.entries.size,
      maxEntries: this.maxEntries,
      evictions: this.evictions,
    };
  }
}

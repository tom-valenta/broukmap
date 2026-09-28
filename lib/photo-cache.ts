/** Bounded LRU of bytes only. Authorization must happen before every read. */
export class PhotoCache<T> {
  private entries = new Map<string, { value: T; size: number; expires: number }>();
  private pending = new Map<string, Promise<T>>();
  private bytes = 0;
  constructor(private maxBytes: number, private ttlMs: number, private sizeOf: (value: T) => number) {}

  async get(key: string, load: () => Promise<T>): Promise<T> {
    const cached = this.entries.get(key);
    if (cached && cached.expires > Date.now()) {
      this.entries.delete(key); this.entries.set(key, cached);
      return cached.value;
    }
    if (cached) { this.bytes -= cached.size; this.entries.delete(key); }
    const pending = this.pending.get(key);
    if (pending) return pending;
    const request = load().then(value => {
      const size = this.sizeOf(value);
      if (size <= this.maxBytes) {
        while (this.bytes + size > this.maxBytes && this.entries.size) {
          const oldest = this.entries.keys().next().value!;
          this.bytes -= this.entries.get(oldest)!.size; this.entries.delete(oldest);
        }
        this.entries.set(key, { value, size, expires: Date.now() + this.ttlMs }); this.bytes += size;
      }
      return value;
    }).finally(() => { this.pending.delete(key); });
    this.pending.set(key, request);
    return request;
  }
}

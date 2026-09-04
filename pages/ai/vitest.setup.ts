// Vitest setup: provides globals expected by browser-side modules under SSR.
// - `import.meta.glob` is supported natively by Vitest's Vite pipeline.
// - `localStorage` / `fetch` are provided by jsdom.
// - Some non-DOM APIs the production code pokes at are stubbed here so the
//   smoke render does not crash during module evaluation.
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => void store.set(key, String(value)),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
    key: () => null,
    get length() {
      return store.size;
    },
  } as Storage;
}

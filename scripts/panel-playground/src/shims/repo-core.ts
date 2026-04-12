type Listener = (...args: any[]) => void;

const listeners = new Map<string, Set<Listener>>();

export const emitter = {
  emit(event: string, ...args: any[]) {
    listeners.get(event)?.forEach(listener => listener(...args));
  },
  off(event: string, listener: Listener) {
    listeners.get(event)?.delete(listener);
  },
  on(event: string, listener: Listener) {
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    listeners.get(event)?.add(listener);
  },
};

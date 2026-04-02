import { ref } from "vue";

export function useUniStorage<T>(key: string, defaultValue: T) {
  const read = (): T => {
    try {
      const raw = uni.getStorageSync(key);
      return raw !== "" && raw !== null && raw !== undefined
        ? (raw as T)
        : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const data = ref<T>(read()) as { value: T };

  const write = (value: T) => {
    data.value = value;
    try {
      uni.setStorageSync(key, value);
    } catch {
      // storage 不可用时静默失败
    }
  };

  const remove = () => {
    data.value = defaultValue;
    try {
      uni.removeStorageSync(key);
    } catch {
      // ignore
    }
  };

  const refresh = () => {
    data.value = read();
  };

  return { data, write, remove, refresh };
}

/** 简单 key-value 操作（不需要响应式时使用） */
export const uniStorage = {
  get: <T>(key: string, fallback: T): T => {
    try {
      const v = uni.getStorageSync(key);
      return v !== "" && v !== null && v !== undefined ? (v as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set: (key: string, value: unknown) => {
    try {
      uni.setStorageSync(key, value);
    } catch {
      // ignore
    }
  },
  remove: (key: string) => {
    try {
      uni.removeStorageSync(key);
    } catch {
      // ignore
    }
  },
};

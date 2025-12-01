export interface DialogPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface UseLocalStorageOptions {
  storagePrefix: string;
  eventId: string | number;
  enabled?: boolean;
}

export function useLocalStorage(options: UseLocalStorageOptions) {
  const { storagePrefix, eventId, enabled = true } = options;

  // 获取存储key
  const getStorageKey = () => {
    return `${storagePrefix}-${eventId}`;
  };

  // 保存位置到localStorage
  const savePosition = (position: DialogPosition) => {
    if (!enabled) return;

    const data = {
      x: position.x,
      y: position.y,
      width: position.width,
      height: position.height
    };

    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save position to localStorage:", e);
    }
  };

  // 从localStorage加载位置
  const loadPosition = (): DialogPosition | null => {
    if (!enabled) return null;

    try {
      const data = localStorage.getItem(getStorageKey());
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error("Failed to load position from localStorage:", e);
    }

    return null;
  };

  // 清除位置
  const clearPosition = () => {
    if (!enabled) return;

    try {
      localStorage.removeItem(getStorageKey());
    } catch (e) {
      console.error("Failed to clear position from localStorage:", e);
    }
  };

  return {
    savePosition,
    loadPosition,
    clearPosition,
    getStorageKey
  };
}

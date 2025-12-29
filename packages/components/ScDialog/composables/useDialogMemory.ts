/**
 * useDialogMemory - 对话框/抽屉状态持久化 composable
 * 管理对话框或抽屉的 localStorage 持久化
 * @author AI Assistant
 * @version 1.0.0
 * @since 2025-12-29
 */
import { ref, watch, onMounted, onUnmounted, type Ref } from 'vue';

/** 对话框记忆数据 */
export interface DialogMemoryData {
  /** 位置 X */
  x?: number;
  /** 位置 Y */
  y?: number;
  /** 宽度 */
  width?: string;
  /** 高度 */
  height?: string;
  /** 是否最大化 */
  maximized?: boolean;
  /** 最后更新时间 */
  timestamp?: number;
}

/** 抽屉记忆数据 */
export interface DrawerMemoryData {
  /** 宽度（左右抽屉） */
  width?: string;
  /** 高度（上下抽屉） */
  height?: string;
  /** 最后更新时间 */
  timestamp?: number;
}

/** 组件记忆数据联合类型 */
export type ComponentMemoryData = DialogMemoryData | DrawerMemoryData;

/** 记忆配置选项 */
export interface ComponentMemoryOptions {
  /** 组件类型 */
  type: 'dialog' | 'drawer';
  /** 记忆键名 */
  memoryKey: string;
  /** 是否启用记忆 */
  enabled?: boolean;
  /** 记忆过期时间（毫秒），0表示永不过期 */
  expiry?: number;
  /** 存储前缀 */
  storagePrefix?: string;
}

/** 记忆返回值 */
export interface ComponentMemoryReturn<T extends ComponentMemoryData> {
  /** 记忆数据 */
  memoryData: Ref<T | null>;
  /** 是否已加载 */
  isLoaded: Ref<boolean>;
  /** 保存记忆 */
  saveMemory: (data: Partial<T>) => void;
  /** 加载记忆 */
  loadMemory: () => T | null;
  /** 清除记忆 */
  clearMemory: () => void;
  /** 检查记忆是否存在 */
  hasMemory: () => boolean;
  /** 获取完整存储键 */
  getStorageKey: () => string;
  /** 更新部分数据 */
  updateMemory: (data: Partial<T>) => void;
}

/** 存储键前缀 */
const DEFAULT_PREFIX = 'sc-component-memory';

/**
 * 组件记忆 composable
 * @param options 配置选项
 * @returns ComponentMemoryReturn
 */
export function useComponentMemory<T extends ComponentMemoryData>(
  options: ComponentMemoryOptions
): ComponentMemoryReturn<T> {
  const {
    type,
    memoryKey,
    enabled = true,
    expiry = 0,
    storagePrefix = DEFAULT_PREFIX,
  } = options;

  const memoryData = ref<T | null>(null) as Ref<T | null>;
  const isLoaded = ref(false);

  /**
   * 获取完整存储键
   */
  const getStorageKey = (): string => {
    return `${storagePrefix}-${type}-${memoryKey}`;
  };

  /**
   * 检查记忆是否过期
   */
  const isExpired = (data: T): boolean => {
    if (expiry === 0 || !data.timestamp) return false;
    return Date.now() - data.timestamp > expiry;
  };

  /**
   * 加载记忆
   */
  const loadMemory = (): T | null => {
    if (!enabled) return null;

    try {
      const key = getStorageKey();
      const stored = localStorage.getItem(key);
      
      if (!stored) return null;

      const data = JSON.parse(stored) as T;
      
      // 检查是否过期
      if (isExpired(data)) {
        clearMemory();
        return null;
      }

      memoryData.value = data;
      isLoaded.value = true;
      return data;
    } catch (error) {
      console.warn(`[useComponentMemory] Failed to load memory for ${memoryKey}:`, error);
      return null;
    }
  };

  /**
   * 保存记忆
   */
  const saveMemory = (data: Partial<T>): void => {
    if (!enabled) return;

    try {
      const key = getStorageKey();
      const saveData: T = {
        ...data,
        timestamp: Date.now(),
      } as T;

      localStorage.setItem(key, JSON.stringify(saveData));
      memoryData.value = saveData;
    } catch (error) {
      console.warn(`[useComponentMemory] Failed to save memory for ${memoryKey}:`, error);
    }
  };

  /**
   * 更新部分数据
   */
  const updateMemory = (data: Partial<T>): void => {
    if (!enabled) return;

    const current = memoryData.value || ({} as T);
    saveMemory({
      ...current,
      ...data,
    });
  };

  /**
   * 清除记忆
   */
  const clearMemory = (): void => {
    try {
      const key = getStorageKey();
      localStorage.removeItem(key);
      memoryData.value = null;
    } catch (error) {
      console.warn(`[useComponentMemory] Failed to clear memory for ${memoryKey}:`, error);
    }
  };

  /**
   * 检查记忆是否存在
   */
  const hasMemory = (): boolean => {
    if (!enabled) return false;

    try {
      const key = getStorageKey();
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  };

  return {
    memoryData,
    isLoaded,
    saveMemory,
    loadMemory,
    clearMemory,
    hasMemory,
    getStorageKey,
    updateMemory,
  };
}

/**
 * 对话框记忆 composable (便捷包装)
 */
export function useDialogMemory(
  memoryKey: string,
  options: Omit<ComponentMemoryOptions, 'type' | 'memoryKey'> = {}
): ComponentMemoryReturn<DialogMemoryData> {
  return useComponentMemory<DialogMemoryData>({
    ...options,
    type: 'dialog',
    memoryKey,
  });
}

/**
 * 抽屉记忆 composable (便捷包装)
 */
export function useDrawerMemory(
  memoryKey: string,
  options: Omit<ComponentMemoryOptions, 'type' | 'memoryKey'> = {}
): ComponentMemoryReturn<DrawerMemoryData> {
  return useComponentMemory<DrawerMemoryData>({
    ...options,
    type: 'drawer',
    memoryKey,
  });
}

/**
 * 批量清除组件记忆
 * @param type 组件类型
 * @param storagePrefix 存储前缀
 */
export function clearAllComponentMemory(
  type?: 'dialog' | 'drawer',
  storagePrefix = DEFAULT_PREFIX
): void {
  try {
    const keys = Object.keys(localStorage);
    const prefix = type
      ? `${storagePrefix}-${type}-`
      : `${storagePrefix}-`;

    keys.forEach((key) => {
      if (key.startsWith(prefix)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('[clearAllComponentMemory] Failed to clear memories:', error);
  }
}

/**
 * 获取所有组件记忆键
 * @param type 组件类型
 * @param storagePrefix 存储前缀
 */
export function getAllMemoryKeys(
  type?: 'dialog' | 'drawer',
  storagePrefix = DEFAULT_PREFIX
): string[] {
  try {
    const keys = Object.keys(localStorage);
    const prefix = type
      ? `${storagePrefix}-${type}-`
      : `${storagePrefix}-`;

    return keys.filter((key) => key.startsWith(prefix));
  } catch {
    return [];
  }
}

export default useDialogMemory;

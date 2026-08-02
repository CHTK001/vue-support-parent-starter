/**
 * 当前选中的 token composable
 *
 * 在多个面板间共享当前操作的 token，影响：
 * - 聚合 ChatClient 可用的模型范围
 * - 用量统计的归属
 * - 服务面板的模型过滤
 *
 * 数据持久化到 localStorage，刷新页面后自动恢复。
 */
import { ref, watch, onMounted } from 'vue';

const STORAGE_KEY = 'ai-current-token';

export interface CurrentToken {
  id: string;
  name: string;
  provider: string;
  groupId?: string;
}

export function useCurrentToken() {
  const currentToken = ref<CurrentToken | null>(null);

  const load = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) currentToken.value = JSON.parse(raw);
    } catch (e) {
      // 忽略
    }
  };

  const save = () => {
    try {
      if (currentToken.value) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentToken.value));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      // 忽略
    }
  };

  const setToken = (token: CurrentToken | null) => {
    currentToken.value = token;
  };

  watch(currentToken, save, { deep: true });

  onMounted(load);

  return {
    currentToken,
    setToken,
    load,
  };
}

/** 全局单例：所有面板共享同一个 currentToken */
const globalToken = ref<CurrentToken | null>(null);
let initialized = false;

export function useGlobalCurrentToken() {
  if (!initialized) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) globalToken.value = JSON.parse(raw);
    } catch (e) {
      // 忽略
    }
    watch(globalToken, (val) => {
      try {
        if (val) localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
        else localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        // 忽略
      }
    }, { deep: true });
    initialized = true;
  }

  return globalToken;
}
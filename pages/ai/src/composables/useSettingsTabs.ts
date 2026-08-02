/**
 * 设置抽屉 tab 状态管理 composable
 *
 * 通过 id 持久化当前选中的 tab 到 localStorage，
 * 刷新后自动恢复状态。
 */
import { ref, watch, onMounted } from 'vue';

const STORAGE_PREFIX = 're-settings-drawer';

export function useSettingsTabs(id: string, defaultTab: string = 'providers') {
  const storageKey = `${STORAGE_PREFIX}:${id}`;
  const activeTab = ref<string>(defaultTab);

  const loadState = () => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const data = JSON.parse(raw);
        if (typeof data.activeTab === 'string') {
          activeTab.value = data.activeTab;
        }
      }
    } catch (e) {
      // 忽略
    }
  };

  const saveState = () => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ activeTab: activeTab.value })
      );
    } catch (e) {
      // 忽略
    }
  };

  watch(activeTab, () => {
    saveState();
  });

  onMounted(() => {
    loadState();
  });

  return {
    activeTab,
    storageKey,
  };
}
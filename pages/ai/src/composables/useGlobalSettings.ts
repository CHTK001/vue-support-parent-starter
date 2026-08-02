/**
 * 全局设置 composable
 *
 * 从后端加载与保存全局配置，与 ai-starter 全局设置服务对接。
 * 支持本地缓存以加速首次加载。
 */
import { ref, onMounted } from 'vue';
import { globalSettingsApi, type GlobalSettings } from '@/api';

const STORAGE_KEY = 'ai-global-settings-cache';

const defaultSettings: GlobalSettings = {
  chatClientEnabled: true,
  usageIntervalSec: 30,
};

export function useGlobalSettings() {
  const settings = ref<GlobalSettings>({ ...defaultSettings });
  const loading = ref(false);
  const saving = ref(false);

  /** 加载本地缓存（首次快速回显） */
  const loadCache = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        Object.assign(settings.value, JSON.parse(raw));
      }
    } catch (e) {
      // 忽略
    }
  };

  /** 从后端拉取全局配置 */
  const fetchSettings = async () => {
    loading.value = true;
    try {
      const data = await globalSettingsApi.get();
      Object.assign(settings.value, data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value));
    } catch (e) {
      // 离线模式保留缓存
    } finally {
      loading.value = false;
    }
  };

  /** 保存到后端 */
  const saveSettings = async (): Promise<boolean> => {
    saving.value = true;
    try {
      await globalSettingsApi.update(settings.value);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value));
      return true;
    } catch (e) {
      return false;
    } finally {
      saving.value = false;
    }
  };

  onMounted(() => {
    loadCache();
    fetchSettings();
  });

  return {
    settings,
    loading,
    saving,
    fetchSettings,
    saveSettings,
  };
}
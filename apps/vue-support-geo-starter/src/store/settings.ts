/**
 * 全局设置状态（读取后端 /settings）
 */
import { defineStore } from "pinia"
import type { AppSettings } from "@/types"
import { getSettings, saveSettings } from "@/api/sources"

/**
 * 设置状态接口
 * @author CH
 * @since 4.0.0
 */
interface SettingsState {
  settings: AppSettings | null
  loading: boolean
}

export const useSettingsStore = defineStore("geo-settings", {
  state: (): SettingsState => ({
    settings: null,
    loading: false,
  }),
  actions: {
    async loadSettings(): Promise<AppSettings | null> {
      this.loading = true
      try {
        this.settings = await getSettings()
        return this.settings
      } finally {
        this.loading = false
      }
    },
    async saveSettings(patch: AppSettings): Promise<void> {
      await saveSettings(patch)
      this.settings = { ...(this.settings ?? {}), ...patch }
    },
  },
})
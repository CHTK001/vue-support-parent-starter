import { defineStore } from "pinia";
import { store, getConfig, responsiveStorageNameSpace } from "../utils";
import { localStorageProxy } from "@/utils/storage";
export const useEpThemeStore = defineStore({
  id: "pure-epTheme",
  state: () => ({
    epThemeColor: localStorageProxy().getItem<StorageConfigs>(`${responsiveStorageNameSpace()}layout`)?.epThemeColor ?? getConfig().EpThemeColor,
    epTheme: localStorageProxy().getItem<StorageConfigs>(`${responsiveStorageNameSpace()}layout`)?.theme ?? getConfig().Theme
  }),
  getters: {
    getEpThemeColor(state) {
      return state.epThemeColor;
    },
    /** 用于mix导航模式下hamburger-svg的fill属性 */
    fill(state) {
      if (state.epTheme === "light") {
        return "#409eff";
      } else {
        return "#fff";
      }
    }
  },
  actions: {
    setEpThemeColor(newColor: string): void {
      const layout = localStorageProxy().getItem<StorageConfigs>(`${responsiveStorageNameSpace()}layout`);
      this.epTheme = layout?.theme;
      this.epThemeColor = newColor;
      if (!layout) return;
      layout.epThemeColor = newColor;
      localStorageProxy().setItem(`${responsiveStorageNameSpace()}layout`, layout);
    }
  }
});

export function useEpThemeStoreHook() {
  return useEpThemeStore(store);
}

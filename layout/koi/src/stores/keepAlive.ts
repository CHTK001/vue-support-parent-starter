import { defineStore } from "pinia";
import { CACHE_PREFIX } from "../config/index";

const KEY = CACHE_PREFIX + "keepAlive";

export const useKoiKeepAliveStore = defineStore("koi-keepAlive", {
  persist: {
    key: KEY,
    storage: localStorage,
  },
  state: () => ({
    keepAliveName: [] as string[],
  }),
  actions: {
    addKeepAliveName(name: string) {
      if (!this.keepAliveName.includes(name)) {
        this.keepAliveName.push(name);
      }
    },
    removeKeepAliveName(name: string) {
      this.keepAliveName = this.keepAliveName.filter((item) => item !== name);
    },
    setKeepAliveName(keepAliveName: string[]) {
      this.keepAliveName = keepAliveName;
    },
    clear() {
      this.keepAliveName = [];
    },
  },
});
/**
 * keepAlive store（@repo/pinia）—— 页面缓存名称列表
 *
 * 迁移自 koi/stores/modules/keepAlive.ts，通用化供任何主题复用。
 */
import { defineStore } from "pinia";
import { CACHE_PREFIX } from "@repo/config";

const keepAliveStore = defineStore("keepAlive", {
  persist: {
    key: CACHE_PREFIX + "keepAlive",
  },
  state: (): any => {
    return {
      keepAliveName: [] as string[],
    };
  },
  actions: {
    async addKeepAliveName(name: string) {
      if (name && !this.keepAliveName.includes(name)) {
        this.keepAliveName.push(name);
      }
    },
    async removeKeepAliveName(name: string) {
      this.keepAliveName = this.keepAliveName.filter((item: any) => item !== name);
    },
    async setKeepAliveName(keepAliveName: string[] = []) {
      this.keepAliveName = keepAliveName;
    },
  },
  getters: {},
});

export default keepAliveStore;

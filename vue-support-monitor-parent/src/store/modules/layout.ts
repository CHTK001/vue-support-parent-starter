import { defineStore } from "pinia";
import { localStorageProxy } from "@/utils/storage";
import { message } from "@/utils/message";
import { fetchGetUserLayout, fetchUpdateUserLayout } from "@/api/user";
import { getConfig } from "@/config";

const allComps = import.meta.glob("@/views/home/components/*.vue");
export const useLayoutStore = defineStore({
  id: "layout-setting",
  state: () => ({
    storageKey: "user-layout-setting",
    /**当前用户布局 */
    grid: [],
    /**当前用户组件 */
    component: [],
    /**组件胚子 */
    modulesWithProps: {}
  }),
  actions: {
    allCompsList() {
      var allCompsList = [];
      for (var key in allComps) {
        allCompsList.push({
          key: key,
          title: this.modulesWithProps[key].title,
          icon: this.modulesWithProps[key].icon,
          description: this.modulesWithProps[key].description
        });
      }
      var myCopmsList = this.component.reduce(function (a, b) {
        return a.concat(b);
      });
      for (let comp of allCompsList) {
        const _item = myCopmsList.find(item => {
          return item === comp.key;
        });
        if (_item) {
          comp.disabled = true;
        }
      }
      return allCompsList;
    },
    async pushComp(item) {
      if (this.layout.length == 0) {
        message("请先选择布局", { type: "warning" });
        return;
      }
      let target = this.component[0];
      target.push(item.key);
    },
    async removeComp(item) {
      var newCopmsList = this.component;
      newCopmsList.forEach((obj, index) => {
        var newObj = obj.filter(o => o != item);
        newCopmsList[index] = newObj;
      });
    },
    async resetLayout() {
      this.reset();
    },

    getLayout() {
      return this.layout;
    },
    getLayoutString() {
      return this.layout.join(",");
    },
    async setLayout(layout) {
      this.layout = layout;
      this.component.length = 0;
      for (var i = 0; i < layout.length; i++) {
        const item = [];
        this.component.push(item);
      }
      if (layout.join(",") == "24") {
        this.component[0] = [...this?.component[0], ...this?.component[1], ...this?.component[2]];
        this.component[1] = [];
        this.component[2] = [];
        if (this.component.length == 4) {
          this.component.pop();
        }
      }
    },
    async saveLayout() {
      if (!getConfig().remoteLayout) {
        localStorageProxy().setItem(this.storageKey, {
          grid: this.grid,
          layout: this.layout,
          component: this.component
        });
        return false;
      }
      fetchUpdateUserLayout({
        grid: JSON.stringify(this.grid),
        layout: JSON.stringify(this.layout),
        component: JSON.stringify(this.component)
      }).then(() => {
        localStorageProxy().setItem(this.storageKey, {
          grid: this.grid,
          layout: this.layout,
          component: this.component
        });
      });
    },
    hasMyCompsList() {
      return this.myCompsList().length > 0;
    },
    myCompsList() {
      return this.allCompsList().filter(item => {
        return !item.disabled;
      });
    },
    hasNowCompsList() {
      return this.nowCompsList().length > 0;
    },
    nowCompsList() {
      if (this.component.length == 0) {
        return [];
      }
      return this.component.reduce(function (a, b) {
        return a.concat(b);
      });
    },
    async clear() {
      this.close();
    },
    async close() {
      localStorageProxy().removeItem(this.storageKey);
      this.component = [[], [], []];
      this.layout = [];
      this.grid = [];
    },
    async reset() {
      this.close();
      return this.loadModule();
    },
    async loadModule() {
      this.load();
      return Object.keys(allComps).reduce(async (acc, key) => {
        const module: any = await allComps[key](); // 导入模块
        acc[key] = module?.default || {}; // 假设 someProperty 是你想获取的属性
        this.modulesWithProps[key] = acc[key];
        return acc;
      }, {});
    },
    /** 登入 */
    async load() {
      const data = localStorageProxy().getItem(this.storageKey);
      if (!data) {
        if (!getConfig().remoteLayout) {
          this.component = [[], [], []];
          this.layout = [];
          this.grid = [];
          return false;
        }
        return new Promise<void>(async resolve => {
          const { data } = await fetchGetUserLayout();
          const res = data as any;
          this.doRegister(data);
          localStorageProxy().setItem(this.storageKey, {
            grid: res?.grid || [],
            layout: res?.layout || [],
            component: res?.component || [[], [], []]
          });
          resolve(null);
        });
      }

      return new Promise<void>(async resolve => {
        this.doRegister(data);
        resolve(null);
      });
    },
    async doRegister(data) {
      if (!data?.grid) {
        this.grid = [];
      } else if (typeof data.grid == "string") {
        this.grid = JSON.parse(data?.grid || "[]");
      } else {
        this.grid = data?.grid;
      }

      if (!data?.layout) {
        this.layout = [];
      } else if (typeof data.layout == "string") {
        this.layout = JSON.parse(data?.layout || "[]");
      } else {
        this.layout = data?.layout;
      }

      if (!data?.component) {
        this.component = [[], [], []];
      } else if (typeof data.component == "string") {
        this.component = JSON.parse(data?.component || "[[], [], []]");
      } else {
        this.component = data?.component;
      }
    }
  }
});

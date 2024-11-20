import { fetchMineSfc } from "../../api/common/sfc";
import {
  fetchGetUserLayout,
  fetchUpdateUserLayout,
} from "../../api/common/user";
import { getConfig } from "@repo/config";
import { message } from "@repo/utils";
import { localStorageProxy } from "@repo/utils";
import { defineStore } from "pinia";

import { loadSfcModule } from "@repo/utils";
export const useLayoutStore = defineStore({
  id: "layout-setting",
  state: () => ({
    /**布局存储key */
    storageKey: "user-layout-setting",
    /**布局存储key */
    storageSfcKey: "user-layout-sfc-setting",

    /**当前用户布局 */
    grid: [],
    /**当前用户组件 */
    component: [],
    allComps: [],
    /**组件胚子 */
    modulesWithProps: {},
  }),
  actions: {
    loadComponent(key) {
      const sysSfc = this.getComponent(key);
      // return defineAsyncComponent({
      //   // 加载组件时的 loading 组件
      //   loadingComponent: LoadingComponent,
      //   // 异步加载的组件工厂
      //   loader: () => loadSfcModule(sysSfc.sysSfcName + ".vue", sysSfc.sysSfcId),
      //   // 加载超时的时间（可选）
      //   delay: 2000,
      //   // 最大等待时间，超时将显示加载组件（可选）
      //   timeout: 3000
      // });

      return loadSfcModule(sysSfc.sysSfcName + ".vue", sysSfc.sysSfcId);
    },
    getComponent(key) {
      return this.modulesWithProps[key];
    },
    isLoaded(key, loadingCollection) {
      if (loadingCollection[key] === undefined) {
        loadingCollection[key] = true;
      }
      return loadingCollection[key];
    },

    loaded(key, loadingCollection) {
      loadingCollection[key] = false;
      return loadingCollection[key];
    },
    allCompsList() {
      var allCompsList = [];
      this.allComps.forEach((item) => {
        allCompsList.push({
          key: item.sysSfcId,
          title: item.sysSfcChineseName,
          icon: item.sysSfcIcon,
          description: item.sysSfcDesc,
        });
        this.modulesWithProps[item.sysSfcId] = item;
      });
      var myCopmsList = this.component.reduce(function (a, b) {
        return a.concat(b);
      });
      for (let comp of allCompsList) {
        const _item = myCopmsList.find((item) => {
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
        var newObj = obj.filter((o) => o != item);
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
        this.component[0] = [
          ...this?.component[0],
          ...this?.component[1],
          ...this?.component[2],
        ];
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
          component: this.component,
        });
        return false;
      }
      fetchUpdateUserLayout({
        grid: JSON.stringify(this.grid),
        layout: JSON.stringify(this.layout),
        component: JSON.stringify(this.component),
      }).then(() => {
        localStorageProxy().setItem(this.storageKey, {
          grid: this.grid,
          layout: this.layout,
          component: this.component,
        });
      });
    },
    hasMyCompsList() {
      return this.myCompsList().length > 0;
    },
    myCompsList() {
      return this.allCompsList().filter((item) => {
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
      localStorageProxy().removeItem(this.storageSfcKey);
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
    },
    async loadSfc() {
      const data = localStorageProxy().getItem(this.storageSfcKey);
      if (data) {
        this.allComps = data;
        return data;
      }

      const res = await fetchMineSfc({ sysSfcCategory: "HOME" });
      this.allComps = res.data;
      localStorageProxy().setItem(this.storageSfcKey, this.allComps);
    },
    /** 登入 */
    async load() {
      await this.loadSfc();
      const data = localStorageProxy().getItem(this.storageKey);
      if (!data) {
        if (!getConfig().remoteLayout) {
          this.component = [[], [], []];
          this.layout = [];
          this.grid = [];
          return false;
        }
        return new Promise<void>(async (resolve) => {
          const { data } = await fetchGetUserLayout();
          const res = data as any;
          this.doRegister(data);
          localStorageProxy().setItem(this.storageKey, {
            grid: res?.grid || [],
            layout: res?.layout || [],
            component: res?.component || [[], [], []],
          });
          resolve(null);
        });
      }

      return new Promise<void>(async (resolve) => {
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
      this.allCompsList();
    },
  },
});

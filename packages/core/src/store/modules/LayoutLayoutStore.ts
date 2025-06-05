// 导入必要的依赖
import { getConfig } from "@repo/config";
import { fetchGetUserLayout, fetchMineSfc, fetchUpdateUserLayout } from "@repo/core";
import { loadSfcModule, localStorageProxy, toObject } from "@repo/utils";
import { defineStore } from "pinia";
import { defineAsyncComponent } from "vue";
import * as _ from "lodash-es";

// 404 组件的异步加载
const _NOT_FOUND = defineAsyncComponent(() => import("@repo/pages/error/404.vue"));

export const useLayoutLayoutStore = defineStore({
  id: "useLayoutLayoutStore",
  state: () => ({
    /**布局存储key */
    storageKey: "user-layout-setting",
    /**布局存储key */
    storageSfcKey: "user-layout-sfc-setting",

    /**当前用户布局 */
    grid: [],
    remoteComponents: {},
    layout: [],
    /**当前用户组件 */
    component: [],
    shadowDom: {},
    allComps: [],
    gridStackRef: null,
    /**组件 */
    modulesWithProps: {},
  }),
  actions: {
    /**
     * 根据组件key获取组件ID
     * @param key 组件标识
     * @returns 组件ID
     */
    loadComponentKey(key) {
      const sysSfc = this.getComponent(key);
      return sysSfc.sysSfcId;
    },

    /**
     * 加载组件的iframe信息
     * @param key 组件标识
     * @returns iframe相关配置信息
     */
    loadFrameInfo(key) {
      const sysSfc = this.getComponent(key);
      if (!sysSfc) {
        return { frameSrc: "", fullPath: "" };
      }
      return {
        frameSrc: sysSfc.sysSfcPath,
        fullPath: sysSfc.sysSfcPath,

        key: sysSfc.sysSfcId + "#" + new Date().getTime(),
      };
    },
    setVue(vue) {
      this.Vue = vue;
    },
    /**
     * 加载组件实例
     * @param key 组件标识
     * @returns 组件实例或404组件
     */
    loadComponent(key) {
      const sysSfc = this.getComponent(key);
      if (!sysSfc) {
        return _NOT_FOUND;
      }
      if (sysSfc.vue) {
        return loadSfcModule(sysSfc.sysSfcName + ".vue", sysSfc.sysSfcId, sysSfc);
      }
      return loadSfcModule(sysSfc.sysSfcName + ".vue", sysSfc.sysSfcId, sysSfc);
    },

    /**
     * 获取组件配置信息
     * @param key 组件标识
     * @returns 组件配置对象
     */
    getComponent(key) {
      const rs = this.modulesWithProps[key];
      if (!rs) {
        return {
          sysSfcId: key,
          sfcIcon: "ri:image-2-line",
        };
      }
      return rs;
    },

    /**
     * 检查组件是否已加载
     * @param key 组件标识
     * @param loadingCollection 加载状态集合
     */
    isLoaded(key, loadingCollection) {
      if (loadingCollection[key] === undefined) {
        loadingCollection[key] = true;
      }
      return loadingCollection[key];
    },

    /**
     * 标记组件加载完成
     * @param key 组件标识
     * @param loadingCollection 加载状态集合
     */
    loaded(key, loadingCollection) {
      loadingCollection[key] = false;
      return loadingCollection[key];
    },
    /**
     * 加载远程组件
     * @param key 组件标识
     * @param value 组件值
     * @returns 组件加载状态
     */
    loadRemoteComponent(key, value) {
      if (!value) {
        return !!this.remoteComponents[key];
      }
      this.remoteComponents[key] = !!value;
      return value;
    },
    /**
     * 获取所有可用组件列表
     * @returns 组件列表数组
     */
    allCompsList() {
      var allCompsList = [];
      this.allComps.forEach((item) => {
        allCompsList.push({
          key: item.sysSfcId,
          title: item.sysSfcChineseName,
          icon: item.sysSfcIcon,
          type: item.sysSfcType,
          description: item.sysSfcDesc,
        });
        this.modulesWithProps[item.sysSfcId] = item;
      });
      if (Array.isArray(this.component)) {
        for (let comp of allCompsList) {
          const _item = this.component.find((item) => {
            return item === comp.key;
          });
          if (_item) {
            comp.disabled = true;
          }
        }
      }
      // await this.loadGridStack();
      return allCompsList;
    },

    async pushComp(item) {
      this.layout.push({
        x: item.x || 0,
        y: item.y || 0,
        w: item.w || 1,
        h: item.h || 1,
        i: item.key,
        id: item.key,
        static: false,
        type: item.type,
      });
      this.component.push({ id: item.key });
    },
    async removeComp(key) {
      this.component = this.component ? this.component.filter((it) => it.id != key) : [];
      this.layout = this.layout.filter((it) => it.id != key);
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
    loadLayout(elemet) {
      const rs = this.layout.filter((item) => item.id === elemet)[0];
      if (!rs) {
        return {
          x: 0,
          y: 0,
          w: 1,
          h: 1,
          static: false,
        };
      }
      return rs;
    },
    async updateComponent(gridstackNode) {
      this.component.forEach((item) => {
        if (item.id == gridstackNode.id) {
          item.x = gridstackNode.x;
          item.y = gridstackNode.y;
          if (gridstackNode.w > 0) {
            item.w = gridstackNode.w;
          }

          if (gridstackNode.h > 0) {
            item.h = gridstackNode.h;
          }
        }
      });
    },
    async updateLayout(gridstackNode) {
      this.layout.forEach((item) => {
        if (item.id == gridstackNode.id) {
          item.x = gridstackNode.x;
          item.y = gridstackNode.y;
          if (gridstackNode.w > 0) {
            item.w = gridstackNode.w;
          }

          if (gridstackNode.h > 0) {
            item.h = gridstackNode.h;
          }
        }
      });
    },
    async saveLayout() {
      if (!getConfig().RemoteLayoutSave) {
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
        return !item.disabled && (this.component ? this.component.filter((i) => i.id === item.key).length === 0 : true);
      });
    },
    hasSettingCompent() {
      if (!Array.isArray(this.nowCompsList()) || this.nowCompsList().length == 0) {
        return false;
      }

      const _component = [];
      this.nowCompsList()?.forEach((item) => {
        if (_.isArray(item)) {
          _component.push(...item);
          return;
        }
        _component.push(item);
      });
      return _component.length > 0;
    },
    hasNowCompsList() {
      return this.nowCompsList().length > 0;
    },
    nowCompsList() {
      return this.component;
    },
    async clear() {
      this.close();
    },
    async close() {
      localStorageProxy().removeItem(this.storageKey);
      localStorageProxy().removeItem(this.storageSfcKey);
      this.allComps = [];
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

    /**
     * 加载本地组件
     */
    async loadLocationCompent() {
      const localModule = {};
      const _localMapping = {};
      Object.entries(
        //@ts-ignore
        import.meta.glob(["../../../../module/**/*.vue"], {
          eager: true,
        })
      ).map(([key, value]: any) => {
        _localMapping[key] = value.default;
      });
      Object.entries(
        //@ts-ignore
        import.meta.glob(["../../../../module/**/*.json"], {
          eager: true,
          query: "raw",
        })
      ).map(([key, value]: any) => {
        const setting = JSON.parse(value.default);
        setting.vue = _localMapping[key.replace("config.json", "index.vue")];
        if (!setting.vue) {
          return;
        }
        setting.sysSfcType = 1;
        if (!setting.sysSfcIcon) {
          setting.sysSfcIcon = "ri:inbox-2-fill";
        }
        localModule[key.replace("../../..", "@repo").replace("config.json", "index.vue") + ""] = setting;
        this.allComps.push(setting);
      });
    },
    /**
     * 加载远程组件
     */
    async loadRemoteCompent() {
      const res = await fetchMineSfc({ sysSfcCategory: "HOME" });
      this.allComps.push(...(res.data as any));
      localStorageProxy().setItem(this.storageSfcKey, this.allComps);
    },
    async loadSfc() {
      const data = localStorageProxy().getItem(this.storageSfcKey);
      this.allComps = [];
      if (data) {
        this.allComps.push(...(data as any));
        return data;
      }

      if (getConfig().RemoteLayout) {
        this.loadRemoteCompent();
        return;
      }

      if (getConfig().LocationLayout) {
        this.loadLocationCompent();
        return;
      }
    },

    /** 登入 */
    async load() {
      await this.loadSfc();
      const data = localStorageProxy().getItem(this.storageKey);
      if (!data) {
        if (!getConfig().RemoteLayoutSave) {
          this.component = [[], [], []];
          this.layout = [];
          this.grid = [];
          // await this.loadGridStack();
          return false;
        }
        return new Promise<void>(async (resolve) => {
          const { data } = await fetchGetUserLayout();
          const res = data as any;
          this.doRegister(data);
          localStorageProxy().setItem(this.storageKey, {
            grid: toObject(res?.grid) || [],
            layout: toObject(res?.layout) || [],
            component: toObject(res?.component) || [[], [], []],
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
        this.layout = data.layout;
        this.component = data.component;
      }
      await this.allCompsList();
    },
  },
});

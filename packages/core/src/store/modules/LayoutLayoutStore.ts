// 导入必要的依赖
import { getConfig } from "@repo/config";
import {
  fetchGetUserLayout,
  fetchUpdateUserLayout,
} from "../../api/common/user";
import { fetchMineSfc as fetchMineSfcByCategory } from "../../api/common/sfc";
import { localStorageProxy, toObject } from "@repo/utils";
import { defineStore } from "pinia";
import { defineAsyncComponent, markRaw } from "vue";
import { createLazySfcComponent } from "../utils/lazySfc";

// 404 组件的异步加载
const _NOT_FOUND = defineAsyncComponent(
  () => import("@repo/common-pages/error/404.vue"),
);

export const useLayoutLayoutStore = defineStore({
  id: "useLayoutLayoutStore",
  state: () => ({
    /**
     * gridstack 网格元信息
     * - columnCount: 总列数（越大缩放越精细）
     * - cellHeight: 单行高度（像素）
     * - margin: 单元格间距（像素）
     */
    gridMeta: {
      columnCount: 24,
      cellHeight: 60,
      margin: 8,
    },
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
    /** 稳定组件引用缓存，避免首页定时刷新时重复生成组件定义 */
    componentCache: {},
    /** 稳定 frameInfo 缓存，避免同一部件每次渲染都生成新对象 */
    frameInfoCache: {},
  }),
  actions: {
    /**
     * 获取网格元信息
     * @returns 网格元信息
     */
    getGridMeta() {
      return this.gridMeta;
    },
    resetRenderCaches() {
      this.componentCache = {};
      this.frameInfoCache = {};
    },

    /**
     * 兼容旧布局：当存储里没有 gridMeta 或列数与当前不一致时，做一次性迁移。
     * 迁移策略：按列数比例换算 x / w / minW / maxW（y/h 不做换算）。
     * @param rawData 原始存储数据（localStorage/远端拉取后的结构）
     */
    upgradeLayoutIfNeeded(rawData) {
      const defaultMeta = this.gridMeta;
      const rawMeta = rawData?.gridMeta;
      const oldColumnCount = Number(rawMeta?.columnCount || 12);
      const newColumnCount = Number(defaultMeta?.columnCount || 12);

      // 有 gridMeta 且列数一致，不需要迁移
      if (rawMeta && oldColumnCount === newColumnCount) {
        this.gridMeta = { ...defaultMeta, ...rawMeta };
        return;
      }

      // 没有布局数据，不迁移，仅同步 meta
      if (!Array.isArray(this.layout) || this.layout.length === 0) {
        this.gridMeta = { ...defaultMeta, ...(rawMeta || {}) };
        return;
      }

      const ratio = newColumnCount / oldColumnCount;
      if (!Number.isFinite(ratio) || ratio <= 0) {
        this.gridMeta = { ...defaultMeta, ...(rawMeta || {}) };
        return;
      }

      this.layout.forEach((item) => {
        if (!item) {
          return;
        }
        if (Number.isFinite(item.x)) {
          item.x = Math.max(0, Math.round(item.x * ratio));
        }
        if (Number.isFinite(item.w)) {
          item.w = Math.max(1, Math.round(item.w * ratio));
        }
        if (Number.isFinite(item.minW)) {
          item.minW = Math.max(1, Math.round(item.minW * ratio));
        }
        if (Number.isFinite(item.maxW)) {
          item.maxW = Math.max(1, Math.round(item.maxW * ratio));
        }

        if (
          Number.isFinite(item.x) &&
          Number.isFinite(item.w) &&
          item.x + item.w > newColumnCount
        ) {
          item.x = Math.max(0, newColumnCount - item.w);
        }
        if (Number.isFinite(item.maxW)) {
          item.maxW = Math.min(newColumnCount, item.maxW);
        }
      });

      this.gridMeta = {
        ...defaultMeta,
        ...(rawMeta || {}),
        columnCount: newColumnCount,
      };

      // 回写一次，避免重复迁移
      localStorageProxy().setItem(this.storageKey, {
        grid: this.grid,
        layout: this.layout,
        component: this.component,
        gridMeta: this.gridMeta,
      });
    },

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
        return { frameSrc: "", fullPath: "", key };
      }
      const cacheKey = sysSfc.sysSfcId || key;
      const cached = this.frameInfoCache[cacheKey];
      if (
        cached &&
        cached.frameSrc === sysSfc.sysSfcPath &&
        cached.fullPath === sysSfc.sysSfcPath
      ) {
        return cached;
      }
      const nextFrameInfo = {
        frameSrc: sysSfc.sysSfcPath,
        fullPath: sysSfc.sysSfcPath,
        // 使用稳定 key，避免首页定时刷新或父组件重渲染时反复卸载/重建部件
        key: sysSfc.sysSfcId,
      };
      this.frameInfoCache[cacheKey] = nextFrameInfo;
      return nextFrameInfo;
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
      const cacheKey = sysSfc.sysSfcId || key;
      const cached = this.componentCache[cacheKey];
      if (cached) {
        return cached;
      }
      const nextComponent = markRaw(createLazySfcComponent(sysSfc));
      this.componentCache[cacheKey] = nextComponent;
      return nextComponent;
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
    syncModulesWithProps() {
      const nextModulesWithProps = {};
      this.allComps.forEach((item) => {
        if (!item?.sysSfcId) {
          return;
        }
        nextModulesWithProps[item.sysSfcId] = item;
      });
      this.modulesWithProps = nextModulesWithProps;
      this.resetRenderCaches();
    },
    normalizeLayoutState() {
      const columnCount = Number(this.gridMeta?.columnCount || 24);
      const validIds = new Set(
        (this.allComps || []).map((item) => item?.sysSfcId).filter(Boolean),
      );
      const nextLayout = [];
      const layoutIds = new Set<string>();
      const normalizeNumber = (value, fallback) => {
        const num = Number(value);
        return Number.isFinite(num) ? Math.round(num) : fallback;
      };

      (Array.isArray(this.layout) ? this.layout : []).forEach(
        (rawItem, index) => {
          const id = rawItem?.id || rawItem?.i;
          if (!id || layoutIds.has(id)) {
            return;
          }
          if (validIds.size > 0 && !validIds.has(id)) {
            return;
          }

          const w = Math.max(
            1,
            Math.min(columnCount, normalizeNumber(rawItem?.w, 1)),
          );
          const h = Math.max(1, normalizeNumber(rawItem?.h, 1));
          const minW = Math.max(
            1,
            Math.min(columnCount, normalizeNumber(rawItem?.minW, 1)),
          );
          const minH = Math.max(1, normalizeNumber(rawItem?.minH, 1));
          const maxW = Math.max(
            minW,
            Math.min(columnCount, normalizeNumber(rawItem?.maxW, columnCount)),
          );
          const maxHRaw = rawItem?.maxH;
          const maxH =
            maxHRaw === undefined || maxHRaw === null
              ? undefined
              : Math.max(minH, normalizeNumber(maxHRaw, minH));
          const x = Math.max(
            0,
            Math.min(
              Math.max(0, columnCount - w),
              normalizeNumber(rawItem?.x, 0),
            ),
          );
          const y = Math.max(0, normalizeNumber(rawItem?.y, index));
          const compMeta = this.modulesWithProps[id];

          nextLayout.push({
            ...rawItem,
            id,
            i: id,
            x,
            y,
            w,
            h,
            minW,
            minH,
            maxW,
            maxH,
            static: !!rawItem?.static,
            type: rawItem?.type ?? compMeta?.sysSfcType,
          });
          layoutIds.add(id);
        },
      );

      const nextComponent = [];
      const componentIds = new Set<string>();
      const layoutMap = new Map(nextLayout.map((item) => [item.id, item]));

      (Array.isArray(this.component) ? this.component : []).forEach(
        (rawItem) => {
          const id =
            typeof rawItem === "string" ? rawItem : rawItem?.id || rawItem?.i;
          if (!id || componentIds.has(id) || !layoutIds.has(id)) {
            return;
          }
          const layoutItem = layoutMap.get(id);
          nextComponent.push({
            ...(typeof rawItem === "object" ? rawItem : {}),
            id,
            x: layoutItem?.x,
            y: layoutItem?.y,
            w: layoutItem?.w,
            h: layoutItem?.h,
            type: layoutItem?.type,
          });
          componentIds.add(id);
        },
      );

      nextLayout.forEach((layoutItem) => {
        if (componentIds.has(layoutItem.id)) {
          return;
        }
        nextComponent.push({
          id: layoutItem.id,
          x: layoutItem.x,
          y: layoutItem.y,
          w: layoutItem.w,
          h: layoutItem.h,
          type: layoutItem.type,
        });
        componentIds.add(layoutItem.id);
      });

      this.layout = nextLayout;
      this.component = nextComponent;
    },
    getComponentIdSet() {
      const componentIds = new Set<string>();
      const appendComponentId = (item) => {
        const id = typeof item === "string" ? item : item?.id || item?.i;
        if (id) {
          componentIds.add(id);
        }
      };

      (Array.isArray(this.component) ? this.component : []).forEach((item) => {
        if (Array.isArray(item)) {
          item.forEach(appendComponentId);
          return;
        }
        appendComponentId(item);
      });

      return componentIds;
    },
    /**
     * 获取所有可用组件列表
     * @returns 组件列表数组
     */
    allCompsList() {
      const componentIds = this.getComponentIdSet();
      return this.allComps.map((item) => ({
        key: item.sysSfcId,
        title: item.sysSfcChineseName,
        icon: item.sysSfcIcon,
        type: item.sysSfcType,
        description: item.sysSfcDesc,
        disabled: componentIds.has(item.sysSfcId),
      }));
    },

    async pushComp(item) {
      const { columnCount } = this.gridMeta || { columnCount: 12 };
      this.layout.push({
        x: item.x || 0,
        y: item.y || 0,
        w: item.w || 1,
        h: item.h || 1,
        minW: item.minW || 1,
        minH: item.minH || 1,
        maxW: item.maxW || columnCount,
        maxH: item.maxH || undefined,
        i: item.key,
        id: item.key,
        static: false,
        type: item.type,
      });
      this.component.push({ id: item.key });
    },
    async removeComp(key) {
      this.component = this.component
        ? this.component.filter((it) => it.id != key)
        : [];
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
          gridMeta: this.gridMeta,
        });
        return false;
      }

      fetchUpdateUserLayout({
        grid: JSON.stringify(this.grid),
        layout: JSON.stringify(this.layout),
        component: JSON.stringify(this.component),
        gridMeta: JSON.stringify(this.gridMeta),
      }).then(() => {
        localStorageProxy().setItem(this.storageKey, {
          grid: this.grid,
          layout: this.layout,
          component: this.component,
          gridMeta: this.gridMeta,
        });
      });
    },
    hasMyCompsList() {
      return this.myCompsList().length > 0;
    },
    myCompsList() {
      return this.allCompsList().filter((item) => !item.disabled);
    },
    hasSettingCompent() {
      return this.getComponentIdSet().size > 0;
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
      this.resetRenderCaches();
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
        }),
      ).map(([key, value]: any) => {
        _localMapping[key] = value.default;
      });
      Object.entries(
        //@ts-ignore
        import.meta.glob(["../../../../module/**/*.json"], {
          eager: true,
          query: "raw",
        }),
      ).map(([key, value]: any) => {
        const setting = JSON.parse(value.default);
        const vueComp = _localMapping[key.replace("config.json", "index.vue")];
        if (!vueComp) {
          return;
        }
        // 本地模块对应的 Vue 组件标记为非响应式，避免被 Pinia 状态包装为响应式对象后导致 Vue 告警
        setting.vue = markRaw(vueComp);

        // Auto-generate ID from directory name if missing
        if (!setting.sysSfcId) {
          const match = key.match(/module\/(.*?)\/config\.json/);
          if (match && match[1]) {
            setting.sysSfcId = match[1];
          }
        }

        // Map standard fields to sysSfc fields
        setting.sysSfcChineseName = setting.sysSfcChineseName || setting.title;
        setting.sysSfcDesc = setting.sysSfcDesc || setting.description;
        setting.sysSfcIcon = setting.sysSfcIcon || setting.icon;
        setting.w = setting.w || setting.width || 1;
        setting.h = setting.h || setting.height || 1;

        setting.sysSfcType = 1;
        if (!setting.sysSfcIcon) {
          setting.sysSfcIcon = "ri:inbox-2-fill";
        }
        localModule[
          key.replace("../../..", "@repo").replace("config.json", "index.vue") +
            ""
        ] = setting;
        this.allComps.push(setting);
      });
      this.syncModulesWithProps();
    },
    /**
     * 加载远程组件
     */
    async loadRemoteCompent() {
      const res = await fetchMineSfcByCategory({ sysSfcCategory: "HOME" });
      this.allComps.push(...(res.data as any));
      this.syncModulesWithProps();
      localStorageProxy().setItem(this.storageSfcKey, this.allComps);
    },
    async loadSfc() {
      if (getConfig().LocationLayout) {
        this.allComps = [];
        this.loadLocationCompent();
        return;
      }

      const data = localStorageProxy().getItem(this.storageSfcKey);
      this.allComps = [];
      if (data) {
        this.allComps.push(...(data as any));
        this.syncModulesWithProps();
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
            gridMeta: toObject(res?.gridMeta) || this.gridMeta,
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
      }

      // component 可能是字符串（JSON）或数组，独立解析
      if (typeof data?.component === "string") {
        try {
          this.component = JSON.parse(data.component || "[]");
        } catch {
          this.component = [];
        }
      } else {
        this.component = Array.isArray(data?.component) ? data.component : [];
      }

      // gridMeta（兼容 string / object）
      if (data?.gridMeta) {
        if (typeof data.gridMeta === "string") {
          this.gridMeta = {
            ...this.gridMeta,
            ...(JSON.parse(data.gridMeta || "{}") || {}),
          };
        } else {
          this.gridMeta = { ...this.gridMeta, ...(data.gridMeta || {}) };
        }
      }

      this.syncModulesWithProps();
      // 旧布局迁移（会回写缓存）
      this.upgradeLayoutIfNeeded(data);
      this.normalizeLayoutState();
      localStorageProxy().setItem(this.storageKey, {
        grid: this.grid,
        layout: this.layout,
        component: this.component,
        gridMeta: this.gridMeta,
      });
      await this.allCompsList();
    },
  },
});

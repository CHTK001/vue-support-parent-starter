import "gridstack/dist/gridstack.min.css";
import { defineStore } from "pinia";
import "gridstack/dist/gridstack.min.css";
import { GridStack } from "gridstack";
import { fetchGetUserLayout, fetchMineSfc, fetchUpdateUserLayout } from "@repo/core";
import { getConfig } from "@repo/config";
import { h, render } from "vue";
import { loadSfcModule, localStorageProxy, message, toObject } from "@repo/utils";
export const useGridStackStore = defineStore({
  id: "GridStackStore",
  state: () => ({
    /**布局存储key */
    storageKey: "user-layout-setting",
    /**布局存储key */
    storageSfcKey: "user-layout-sfc-setting",

    /**当前用户布局 */
    grid: [],
    layout: [],
    Vue: null,
    /**当前用户组件 */
    component: [],
    shadowDom: {},
    allComps: [],
    gridStackRef: null,
    /**组件 */
    modulesWithProps: {},
  }),
  actions: {
    loadComponentKey(key) {
      const sysSfc = this.getComponent(key);
      return sysSfc.sysSfcId;
    },
    loadFrameInfo(key) {
      const sysSfc = this.getComponent(key);
      return {
        frameSrc: sysSfc.sysSfcPath,
        fullPath: sysSfc.sysSfcPath,

        key: sysSfc.sysSfcId + "#" + new Date().getTime(),
      };
    },
    setVue(vue) {
      this.Vue = vue;
    },
    loadComponent(key) {
      const sysSfc = this.getComponent(key);
      return loadSfcModule(sysSfc.sysSfcName + ".vue", sysSfc.sysSfcId, sysSfc);
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
      var myCopmsList =
        this.component.length == 0
          ? []
          : this.component.reduce(function (a, b) {
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
      // await this.loadGridStack();
      return allCompsList;
    },

    async pushComp(item) {
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
        this.component[0] = [...this?.component[0], ...this?.component[1], ...this?.component[2]];
        this.component[1] = [];
        this.component[2] = [];
        if (this.component.length == 4) {
          this.component.pop();
        }
      }
    },
    async saveLayout() {
      this.layout = this.gridStackRef.save(false, false);
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
    async loadSfc() {
      const data = localStorageProxy().getItem(this.storageSfcKey);
      this.allComps = [];
      if (data) {
        this.allComps.push(...(data as any));
        return data;
      }

      const res = await fetchMineSfc({ sysSfcCategory: "HOME" });
      this.allComps.push(...(res.data as any));
      localStorageProxy().setItem(this.storageSfcKey, this.allComps);
    },
    loadLayout(elemet) {
      return this.layout[elemet];
    },
    loadGridItem(widget) {
      const componentRef = this.loadComponent(widget.value);
      // 找到第九个方块
      let widgetEl = widget.el;
      let content = widgetEl.querySelector(".grid-stack-item-content");
      //@ts-ignore
      let itemDom = document.createElement("div");
      itemDom.setAttribute("id", "card_" + widget._id);
      // 把组件放入方块中
      content.appendChild(itemDom);
      const _this = this;
      const itemVNode = h(componentRef);

      // 调整大小，echarts图resize
      this.gridStackRef.on("resizestop", function (event, gridEl) {
        // 当你缩放暂停，触发条件，重新绘图resize
        debugger;
      });
      render(itemVNode, itemDom);
      return itemVNode.el;
    },
    async loadGridStack() {
      let Options = {
        dragOut: true,
        margin: 5, //网格里面之间的距离
        acceptWidgets: true, //接受从其他网格或外部拖动的小部件
      };
      // let item7 = document.getElementsByClassName('grid-stack-item7')
      this.gridStackRef = GridStack.init(Options);
      // const arr = this.component[0];
      // arr.forEach((element) => {
      //   this.gridStackRef.addWidget({ id: "grid-stack-" + element, value: element });
      // });
      // if (this.gridStackRef.engine) {
      //   this.gridStackRef.engine.nodes.forEach((widget) => {
      //     this.loadGridItem(widget);
      //   });
      // }
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
        this.layout = data?.layout;
      }

      if (!data?.component) {
        this.component = [[], [], []];
      } else if (typeof data.component == "string") {
        this.component = JSON.parse(data?.component || "[[], [], []]");
      } else {
        this.component = data?.component;
      }
      await this.allCompsList();
    },
  },
});

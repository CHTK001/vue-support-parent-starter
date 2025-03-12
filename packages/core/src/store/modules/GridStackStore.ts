import "gridstack/dist/gridstack.min.css";
import { defineStore } from "pinia";
import "gridstack/dist/gridstack.min.css";
import { GridStack } from "gridstack";
import { fetchGetUserLayout, fetchMineSfc, fetchUpdateUserLayout } from "@repo/core";
import { getConfig } from "@repo/config";
import { h, render } from "vue";
import { loadSfcModule, localStorageProxy, message, toObject } from "@repo/utils";
import { layout } from "echarts/types/src/layout/barGrid.js";
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
      for (let comp of allCompsList) {
        const _item = this.component.find((item) => {
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
      let target = this.component;
      target.push({ id: item.key });
      this.customLayout();
    },
    async removeComp(item) {
      this.component = this.component.filter((it) => it.id != item);
      this.customLayout();
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
    async customLayout() {
      this.gridStackRef?.enable();
    },
    async disableLayout() {
      this.gridStackRef?.disable();
    },
    loadLayout(elemet) {
      return this.layout.filter((item) => item.id === elemet)[0];
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
      this.gridStackRef.on("resize", function (event, gridEl) {
        // 当你缩放暂停，触发条件，重新绘图resize
        debugger;
      });
      render(itemVNode, itemDom);
      return itemVNode.el;
    },
    async reloadGridStack() {
      //@ts-ignore
      delete document.getElementsByClassName("grid-stack")[0].gridstack;
      this.loadGridStack();
    },
    async loadGridStack() {
      let options = {
        dragOut: true,
        margin: 5, //网格里面之间的距离
        acceptWidgets: true, //接受从其他网格或外部拖动的小部件
      };
      this.gridStackRef = GridStack.init(options);
      // this.gridStackRef.on("added", (event, items) => {
      //   for (const item of items) {
      //     const itemEl = item.el;
      //     const itemElContent = itemEl.querySelector(".grid-stack-item-content");

      //     const itemId = item.id;
      //     // Use Vue's render function to create the content
      //     // See https://vuejs.org/guide/extras/render-function.html#render-functions-jsx
      //     //      Supports: emit, slots, props, attrs, see onRemove event below
      //     const GridContentComponent = this.loadComponent(itemId);
      //     const itemContentVNode = h(GridContentComponent, {
      //       itemId: itemId,
      //       onRemove: (itemId) => {
      //         this.gridStackRef.removeWidget(itemEl);
      //       },
      //     });

      //     // Render the vue node into the item element
      //     render(itemContentVNode, itemElContent);
      //   }
      // });
      // this.gridStackRef.on("removed", function (event, items) {
      //   for (const item of items) {
      //     const itemEl = item.el;
      //     const itemElContent = itemEl.querySelector(".grid-stack-item-content");
      //     // Unmount the vue node from the item element
      //     // Calling render with null will allow vue to clean up the DOM, and trigger lifecycle hooks
      //     render(null, itemElContent);
      //   }
      // });
      const _this = this;
      // this.gridStackRef.on("resize", function (event, items) {
      //   const old = _this.component;
      //   if (items.gridstackNode) {
      //     _this.updateComponent(items.gridstackNode);
      //     _this.updateLayout(items.gridstackNode);
      //   }
      // });
      this.gridStackRef?.on("dropped", function (event, items) {
        const old = _this.component;
        if (items.gridstackNode) {
          items.gridstackNode.w = -1;
          items.gridstackNode.h = -1;
          _this.updateComponent(items.gridstackNode);
          _this.updateLayout(items.gridstackNode);
        }
      });
      // this.layout.forEach((item) => {
      //   this.component.push(item);
      //   this.gridStackRef.addWidget(item);
      // });
    },

    addObserver() {
      const _this = this;
      //@ts-ignore
      const observer = new MutationObserver(function (mutationsList, observer) {
        for (let mutation of mutationsList) {
          if (mutation.type === "childList") {
            let hasId = false;
            mutation.addedNodes.forEach((node: any) => {
              if (node?.id) {
                hasId = true;
              }
              if (node.gridstackNode) {
                _this.updateComponent(node.gridstackNode);
                _this.updateLayout(node.gridstackNode);
              }
            });

            mutation.removedNodes.forEach((node: any) => {
              if (node?.id) {
                hasId = true;
              }
              if (node.gridstackNode) {
                _this.updateComponent(node.gridstackNode);
                _this.updateLayout(node.gridstackNode);
              }
            });
            if (hasId) {
              _this.reloadGridStack();
            }
          }
        }
      });
      // 观察器的配置（观察子节点的变化）
      const config = { childList: true };

      // 观察目标节点，即父节点
      //@ts-ignore
      const targetNode = document.getElementsByClassName("grid-stack")[0];

      // 传入目标节点和观察选项并开始观察
      try {
        observer.observe(targetNode, config);
      } catch (error) {}
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
      const nodes = this.gridStackRef.engine.nodes;
      this.layout = this.gridStackRef.save(false, false);
      this.layout = [];
      for (let i = 0; i < nodes.length; i++) {
        this.layout.push({
          x: nodes[i].x,
          y: nodes[i].y,
          w: nodes[i].w,
          h: nodes[i].h,
          id: ~~nodes[i].id,
        });
        this.updateComponent(nodes[i]);
      }
      this.disableLayout();
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
        return !item.disabled && this.component.filter((i) => i.id === item.key).length === 0;
      });
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
    async loadSfc() {
      if (!getConfig().remoteLayout) {
        return;
      }
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
        this.component = data?.layout;
      }
      await this.allCompsList();
    },
  },
});

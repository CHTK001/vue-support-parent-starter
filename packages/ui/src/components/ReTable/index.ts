/**
 * ReTable —— 表格组件（el-table 封装）
 *
 * 支持动态数据源（data / url / 函数）与列 schema 渲染。
 *   <ReTable :columns="[{ prop: 'name', label: '名称' }]" url="/api/users" />
 */
import type { App, Plugin } from "vue";
import ReTable from "./ReTable.vue";
import ReTableVirtualView from "./ReTableVirtualView.vue";
import ReTableCardView from "./ReTableCardView.vue";
import ReTableContextMenu from "./ReTableContextMenu.vue";
import ReTableToolbar from "./ReTableToolbar.vue";
import ReTableCanvasView from "./ReTableCanvasView.vue";
import ReTableRadialView from "./ReTableRadialView.vue";

const plugin: Plugin = {
  install(app: App) {
    app.component("ReTable", ReTable);
    app.component("ReTableVirtualView", ReTableVirtualView);
    app.component("ReTableCardView", ReTableCardView);
    app.component("ReTableContextMenu", ReTableContextMenu);
    app.component("ReTableToolbar", ReTableToolbar);
    app.component("ReTableCanvasView", ReTableCanvasView);
    app.component("ReTableRadialView", ReTableRadialView);
  },
};

export { plugin as install };
export default ReTable;
export * from "./types";
export * from "./columnStorage";
export * from "./composables";
/**
 * ReTable —— 表格组件（el-table 封装）
 *
 * 支持两种数据源与列 schema 渲染：
 *   前端分页：<ReTable :columns="cols" :data="rows" />              （组件切片）
 *   后端分页：<ReTable :columns="cols" :loader="fetchUsers" />     （组件只发分页与查询参数）
 */
import { defineAsyncComponent, type App, type Plugin } from "vue";
import ReTable from "./ReTable.vue";

import ReTableToolbar from "./ReTableToolbar.vue";

/** 卡片布局使用面窄，异步加载避免打进主包 */
const ReTableCardView = defineAsyncComponent(() => import("./ReTableCardView.vue"));

const plugin: Plugin = {
  install(app: App) {
    app.component("ReTable", ReTable);
    app.component("ReTableCardView", ReTableCardView);
    app.component("ReTableToolbar", ReTableToolbar);
  },
};

export { plugin as install };
export default ReTable;
export * from "./types";
export * from "./columnStorage";
export * from "./composables";
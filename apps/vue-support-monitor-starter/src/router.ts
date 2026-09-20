/**
 * 监控管理平台路由 —�?对齐 prototype.html 7 �? * / 概览 · /alarms 告警 · /redis Redis · /tshark 抓包 · /assets 资产
 * · /host/:id 主机详情 · /terminal 远控 · /config 监控配置
 */
import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  { path: "/", redirect: "/groups" },
  { path: "/alarms", name: "alarms", component: () => import("./views/AlarmsView.vue"), meta: { title: "告警中心" } },
  { path: "/redis", name: "redis", component: () => import("./views/RedisView.vue"), meta: { title: "Redis 监控" } },
  { path: "/tshark", name: "tshark", component: () => import("@pages/monitor/src/views/tshark/ScTsharkCapture.vue"), meta: { title: "抓包分析" } },
  { path: "/assets", name: "assets", component: () => import("./views/AssetsView.vue"), meta: { title: "主机资产" } },
  { path: "/host/:id", name: "host-detail", component: () => import("./views/HostDetailView.vue"), meta: { title: "主机监控详情" } },
  { path: "/terminal", name: "terminal", component: () => import("./views/TerminalView.vue"), meta: { title: "远程控制" } },
  { path: "/config", name: "config", component: () => import("./views/ConfigView.vue"), meta: { title: "监控配置" } },
  { path: "/system-config", name: "system-config", component: () => import("./views/SystemConfigView.vue"), meta: { title: "系统配置" } },
  { path: "/proxy", name: "proxy", component: () => import("./views/ProxyView.vue"), meta: { title: "代理管理" } },
  { path: "/datasource", name: "datasource", component: () => import("./views/DataSourceView.vue"), meta: { title: "数据源管理" } },
  { path: "/db-manager", name: "db-manager", component: () => import("./views/DatabaseManagerView.vue"), meta: { title: "数据库管理" } },
  { path: "/account", name: "account", component: () => import("./views/IdentityManageView.vue"), meta: { title: "账号管理" } },
  { path: "/filesystem/list", name: "filesystem-list", component: () => import("@pages/filesystem/views/FileManage.vue"), meta: { title: "文件管理" } },
  { path: "/filesystem/group", name: "filesystem-group", component: () => import("@pages/filesystem/views/GroupManage.vue"), meta: { title: "文件分组" } },
  { path: "/filesystem/setting", name: "filesystem-setting", component: () => import("@pages/filesystem/views/SettingManage.vue"), meta: { title: "存储配置" } },
  { path: "/filesystem/filestorage", name: "filesystem-filestorage", component: () => import("@pages/filesystem/views/FileStorageManage.vue"), meta: { title: "文件存储服务" } },
  { path: "/groups", name: "groups", component: () => import("@pages/server/src/views/ScGroupTree.vue"), meta: { title: "分组管理" } },
  { path: "/project", name: "project", component: () => import("@pages/project/src/views/ScProjectList.vue"), meta: { title: "发布项目管理" } },
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

export default createRouter({
  history: createWebHashHistory(),
  routes,
});
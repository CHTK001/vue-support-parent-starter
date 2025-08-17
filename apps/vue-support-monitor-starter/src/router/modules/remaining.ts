import { $t } from "@repo/config";
import type { RouteConfigsTable } from "@repo/core";
import { Account } from "@layout/default";

export default [
  {
    path: "/login",
    name: "Login",
    component: () => import("@repo/pages/login/index.vue"),
    meta: {
      title: $t("menus.pureLogin"),
      showLink: false,
      rank: 101,
    },
  },

  {
    path: "/AccountSettings",
    name: "AccountSettings",
    component: () => {
      return Account;
    },
    meta: {
      title: $t("buttons.accountSetting"),
      showLink: false,
    },
  },
  {
    path: "/data/console/jdbc",
    name: "dataJdbcConsoleFull",
    component: () => import("@/views/data-management/console/jdbc/index.vue"),
    meta: {
      title: "JDBC 控制台",
      showLink: false,
    },
  },
  {
    path: "/data/console/redis",
    name: "dataRedisConsoleFull",
    component: () => import("@/views/data-management/console/redis/index.vue"),
    meta: {
      title: "Redis 控制台",
      showLink: false,
    },
  },
  {
    path: "/data/console/zk",
    name: "dataZookeeperConsoleFull",
    component: () => import("@/views/data-management/console/zk/index.vue"),
    meta: {
      title: "ZooKeeper 控制台",
      showLink: false,
    },
  },
  {
    path: "/node/documentation/:nodeId",
    name: "nodeDocumentation",
    component: () =>
      import("@/views/node-management/module/node-documentation/index.vue"),
    meta: {
      icon: "ri:file-text-line",
      title: "节点API文档",
      showLink: false,
    },
  },
  {
    path: "/file-manager/:serverId",
    name: "fileManager",
    component: () => import("@/views/server/modules/file-management/index.vue"),
    meta: {
      icon: "ri:folder-line",
      title: "文件管理器",
      showLink: false,
    },
  },
  {
    path: "/service/file-storage/preview/:serverId",
    name: "fileStoragePreviewFull",
    component: () =>
      import("@/views/service-management/file-storage/PreviewFull.vue"),
    meta: {
      title: "文件存储预览",
      showLink: false,
    },
  },
] satisfies Array<RouteConfigsTable>;

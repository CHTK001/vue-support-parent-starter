import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";
import { ProjectIndex } from "@pages/project";
import ServerListPage from "./views/ServerListPage.vue";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/project/manage",
  },
  {
    path: "/project",
    redirect: "/project/manage",
  },
  {
    path: "/project/manage",
    name: "ProjectManage",
    component: ProjectIndex,
    meta: {
      title: "项目管理",
    },
  },
  {
    path: "/server/list",
    name: "ServerList",
    component: ServerListPage,
    meta: {
      title: "服务器列表",
    },
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/project/manage",
  },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

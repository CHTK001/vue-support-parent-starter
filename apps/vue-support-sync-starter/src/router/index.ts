import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/sync/tasks",
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("../pages/sync/Login.vue"),
    meta: { requiresAuth: false, title: "登录" },
  },
  {
    path: "/sync",
    name: "Sync",
    redirect: "/sync/tasks",
    children: [
      {
        path: "tasks",
        name: "TaskList",
        component: () => import("../pages/sync/TaskList.vue"),
        meta: { requiresAuth: true, title: "任务列表" },
      },
      {
        path: "design/:taskId?",
        name: "TaskDesign",
        component: () => import("../pages/sync/TaskDesign.vue"),
        meta: { requiresAuth: true, title: "任务设计" },
      },
      {
        path: "monitor",
        name: "TaskMonitor",
        component: () => import("../pages/sync/TaskMonitor.vue"),
        meta: { requiresAuth: true, title: "监控仪表板" },
      },
      {
        path: "logs/:taskId?",
        name: "TaskLog",
        component: () => import("../pages/sync/TaskLog.vue"),
        meta: { requiresAuth: true, title: "任务日志" },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫 - 根据环境变量决定是否启用认证
router.beforeEach((to, _from, next) => {
  const authMode = import.meta.env.VITE_AUTH_MODE || "embedded";
  
  // none模式下跳过认证检查
  if (authMode === "none") {
    next();
    return;
  }
  
  // embedded模式下检查认证
  const isAuthenticated = sessionStorage.getItem("authenticated") === "true";
  const requiresAuth = to.meta.requiresAuth !== false;
  
  if (requiresAuth && !isAuthenticated && to.path !== "/login") {
    next("/login");
  } else if (to.path === "/login" && isAuthenticated) {
    next("/sync/tasks");
  } else {
    next();
  }
});

export default router;

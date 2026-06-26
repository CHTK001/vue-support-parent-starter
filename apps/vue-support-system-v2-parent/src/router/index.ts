import {
  createRouter,
  createWebHashHistory,
  type RouteRecordRaw,
  type App,
} from "vue-router";
import LayoutKoi from "@layout/koi";
import LoginPage from "../pages/Login.vue";
import Dashboard from "../pages/Dashboard.vue";

// system-v2 页面组件
import {
  UserManageV2,
  RoleManageV2,
  MenuManageV2,
  DeptManageV2,
} from "@pages/system-v2";
import { DictTypeV2, DictDataV2 } from "@pages/system-v2";
import {
  PostManageV2,
  NoticeManageV2,
  LoginLogV2,
  OperLogV2,
} from "@pages/system-v2";

export const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "Login",
    component: LoginPage,
    meta: { title: "登录", ignoreAuth: true },
  },
  {
    path: "/",
    component: LayoutKoi,
    redirect: "/dashboard",
    children: [
      {
        path: "dashboard",
        name: "Dashboard",
        component: Dashboard,
        meta: { title: "仪表盘", icon: "ep:odometer" },
      },
      {
        path: "system/user",
        name: "UserManage",
        component: UserManageV2,
        meta: { title: "用户管理", icon: "ep:user" },
      },
      {
        path: "system/role",
        name: "RoleManage",
        component: RoleManageV2,
        meta: { title: "角色管理", icon: "ep:flag" },
      },
      {
        path: "system/menu",
        name: "MenuManage",
        component: MenuManageV2,
        meta: { title: "菜单管理", icon: "ep:menu" },
      },
      {
        path: "system/dept",
        name: "DeptManage",
        component: DeptManageV2,
        meta: { title: "部门管理", icon: "ep:office-building" },
      },
      {
        path: "system/dict",
        name: "DictManage",
        component: DictTypeV2,
        meta: { title: "字典管理", icon: "ep:list" },
      },
      {
        path: "system/dict/:dictId/data",
        name: "DictData",
        component: DictDataV2,
        meta: { title: "字典项", hidden: true },
      },
      {
        path: "system/post",
        name: "PostManage",
        component: PostManageV2,
        meta: { title: "岗位管理", icon: "ep:suitcase" },
      },
      {
        path: "system/notice",
        name: "NoticeManage",
        component: NoticeManageV2,
        meta: { title: "通知公告", icon: "ep:bell" },
      },
      {
        path: "system/loginlog",
        name: "LoginLog",
        component: LoginLogV2,
        meta: { title: "登录日志", icon: "ep:document" },
      },
      {
        path: "system/operlog",
        name: "OperLog",
        component: OperLogV2,
        meta: { title: "操作日志", icon: "ep:document-copy" },
      },
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/dashboard",
  },
];

const TOKEN_KEY = "koi-access-token";
const USER_KEY = "koi-user-info";

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

/** 获取本地 token */
export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** 存储 token */
export function setAccessToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

/** 清除登录态 */
export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// 路由守卫
router.beforeEach((to, _from, next) => {
  const token = getAccessToken();

  if (to.meta?.ignoreAuth) {
    next();
    return;
  }

  if (!token) {
    next("/login");
    return;
  }

  next();
});

export function setupRouter(app: App) {
  app.use(router);
}

export default router;
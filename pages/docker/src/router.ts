import type { RouteRecordRaw } from "vue-router";

const redirectToDocker =
  (tab?: string) =>
  (to: { query: Record<string, unknown> }) => ({
    path: "/docker",
    query: {
      ...to.query,
      ...(tab ? { tab } : {}),
    },
  });

/**
 * Docker 路由定义（ScLayout 路由模式）。
 */
const routes = [
  {
    path: "/",
    name: "DockerLayout",
    component: async () => import("@layout/default"),
    redirect: "/docker",
    meta: {
      title: "Docker 工作台",
      showLink: false,
    },
    children: [
      {
        path: "/docker",
        name: "DockerManagement",
        component: async () => {
          const { DockerManagePage } = await import("./index");
          return DockerManagePage;
        },
        meta: {
          title: "Docker 管理",
          icon: "mdi:docker",
          rank: 8,
        },
      },
      {
        path: "/docker/home",
        redirect: redirectToDocker("overview"),
        meta: {
          title: "Docker 工作台",
          showLink: false,
        },
      },
      {
        path: "/docker/connections",
        redirect: redirectToDocker("overview"),
        meta: {
          title: "连接配置",
          showLink: false,
        },
      },
      {
        path: "/docker/sync",
        redirect: redirectToDocker("overview"),
        meta: {
          title: "同步中心",
          showLink: false,
        },
      },
      {
        path: "/docker/registries",
        redirect: redirectToDocker("images"),
        meta: {
          title: "仓库管理",
          showLink: false,
        },
      },
      {
        path: "/docker/mounts",
        redirect: redirectToDocker("mounts"),
        meta: {
          title: "挂载管理",
          showLink: false,
        },
      },
      {
        path: "/docker/networks",
        redirect: redirectToDocker("networks"),
        meta: {
          title: "网络管理",
          showLink: false,
        },
      },
      {
        path: "/docker/containers",
        redirect: redirectToDocker("containers"),
        meta: {
          title: "容器管理",
          showLink: false,
        },
      },
      {
        path: "/docker/images",
        redirect: redirectToDocker("images"),
        meta: {
          title: "镜像管理",
          showLink: false,
        },
      },
      {
        path: "/docker/install",
        redirect: redirectToDocker("overview"),
        meta: {
          title: "安装向导",
          showLink: false,
        },
      },
    ],
  },
  // ===========================================
  // 三级菜单测试 - 验证垂直导航激活样式
  // ===========================================
  {
    path: "/nav-test",
    name: "NavTest",
    redirect: "/nav-test/section1",
    meta: {
      icon: "ri:layout-grid-line",
      title: "测试导航",
      rank: 99,
    },
    children: [
      {
        path: "/nav-test/section1",
        name: "NavTestSection1",
        meta: { title: "一级菜单" },
        redirect: "/nav-test/section1/child-a",
        children: [
          {
            path: "/nav-test/section1/child-a",
            name: "NavTestChildA",
            component: async () => {
              const { DockerManagePage } = await import("./index");
              return DockerManagePage;
            },
            meta: { title: "二级菜单 A", icon: "ri:file-text-line" },
          },
          {
            path: "/nav-test/section1/child-b",
            name: "NavTestChildB",
            component: async () => {
              const { DockerManagePage } = await import("./index");
              return DockerManagePage;
            },
            meta: { title: "二级菜单 B", icon: "ri:file-text-line" },
          },
        ],
      },
      {
        path: "/nav-test/section2",
        name: "NavTestSection2",
        meta: { title: "独立页面" },
        redirect: "/nav-test/section2/page",
        children: [
          {
            path: "/nav-test/section2/page",
            name: "NavTestSection2Page",
            component: async () => {
              const { DockerManagePage } = await import("./index");
              return DockerManagePage;
            },
            meta: { title: "三级页面", icon: "ri:file-text-line" },
          },
        ],
      },
    ],
  },
] satisfies Array<RouteRecordRaw>;

export default routes;

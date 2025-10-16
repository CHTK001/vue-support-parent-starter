import type { AppRouteRecordRaw } from "@pureadmin/core";

const DockerManageRoutes: AppRouteRecordRaw = {
  path: "/docker",
  name: "DockerManage",
  redirect: "/docker/soft",
  meta: {
    title: "Docker 管理",
    icon: "ri:docker-fill"
  },
  children: [
    {
      path: "registry",
      name: "DockerRegistry",
      meta: { title: "软件仓库", icon: "material-symbols:library-books-rounded" },
      component: () => import("@/views/docker/Registry.vue")
    },
    {
      path: "soft",
      name: "DockerSoft",
      meta: { title: "软件管理", icon: "mdi:application-settings" },
      component: () => import("@/views/docker/Soft.vue")
    },
    {
      path: "image",
      name: "DockerImage",
      meta: { title: "镜像管理", icon: "mdi:Docker" },
      component: () => import("@/views/docker/Image.vue")
    },
    {
      path: "container",
      name: "DockerContainer",
      meta: { title: "容器管理", icon: "mdi:docker" },
      component: () => import("@/views/docker/Container.vue")
    }
  ]
};

export default DockerManageRoutes;

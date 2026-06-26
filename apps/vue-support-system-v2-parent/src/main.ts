import { createStandardApp } from "@repo/core";
import LayoutKoi from "@layout/koi";
import "./styles/index.scss";

createStandardApp({
  appRoutes: [
    {
      path: "/",
      component: LayoutKoi,
      name: "RootLayout",
      redirect: "/dashboard",
      meta: {
        title: "主页",
        showLink: false,
        hiddenTag: true,
        rank: 0,
      },
      children: [
        {
          path: "dashboard",
          name: "Dashboard",
          component: () => import("./pages/Dashboard.vue"),
          meta: {
            title: "仪表盘",
            icon: "ep:odometer",
            showLink: true,
          },
        },
      ],
    },
  ],
  setup: async (app) => {
    app.config.errorHandler = (error, _instance, info) => {
      console.error("[SystemV2Bootstrap] vue-error", info, error);
    };

    // 覆盖内置 /login 路由为自定义登录页
    const { router } = await import("@repo/core/src/router");
    if (router.hasRoute("Login")) {
      router.removeRoute("Login");
    }
    router.addRoute({
      path: "/login",
      name: "Login",
      component: () => import("./pages/Login.vue"),
      meta: {
        title: "登录",
        showLink: false,
        hiddenTag: true,
        rank: 101,
      },
    });
  },
})
  .then((bootstrap) => bootstrap.mount("#app"))
  .catch((error) => {
    console.error("[SystemV2Bootstrap] bootstrap-failed", error);
  });
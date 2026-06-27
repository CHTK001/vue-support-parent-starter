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

    // 覆盖内置 /login 路由为 koi 的 LoginPage（已集成 @repo/core API）
    const { router } = await import("@repo/core/src/router");
    if (router.hasRoute("Login")) {
      router.removeRoute("Login");
    }
    // 使用 koi 的登录页（纯视觉主题，API 来自 @repo/core）
    const LoginPage = (await import("@layout/koi/pages/LoginPage.vue")).default;
    router.addRoute({
      path: "/login",
      name: "Login",
      component: LoginPage,
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
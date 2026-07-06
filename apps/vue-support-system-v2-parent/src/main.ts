import { createStandardApp } from "@repo/core";
import LayoutKoi, { KoiGlobalIcon } from "@layout/koi";
import "./styles/index.scss";

createStandardApp({
  appRoutes: [
    {
      path: "/",
      component: LayoutKoi,
      name: "RootLayout",
      meta: {
        title: "主页",
        showLink: false,
        hiddenTag: true,
        rank: 0,
      },
      children: [],
    },
  ],
  setup: async (app) => {
    app.component("KoiGlobalIcon", KoiGlobalIcon);
    app.config.errorHandler = (error, _instance, info) => {
      console.error("[SystemV2Bootstrap] vue-error", info, error);
    };

    // Override built-in /login with koi-style login page
    const { router } = await import("@repo/core/src/router");
    if (router.hasRoute("Login")) {
      router.removeRoute("Login");
    }
    router.addRoute({
      path: "/login",
      name: "Login",
      component: () => import("./pages/Login.vue"),
      meta: { title: "登录", showLink: false, hiddenTag: true, rank: 101 },
    });
  },
})
  .then((bootstrap) => bootstrap.mount("#app"))
  .catch((error) => {
    console.error("[SystemV2Bootstrap] bootstrap-failed", error);
  });
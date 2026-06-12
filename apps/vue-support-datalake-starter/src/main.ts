import { createStandardApp } from "@repo/core";
import App from "./App.vue";

// 立即设置主题，确保首次渲染就是深色科技风
document.documentElement.setAttribute("data-skin", "tech");
document.documentElement.classList.add("dark");
// 默认使用 darkBlue 主题
localStorage.setItem("tui_theme", "darkBlue");
document.body.style.background =
  "radial-gradient(circle at top, rgba(0, 246, 255, 0.10), transparent 32%), linear-gradient(180deg, #030615 0%, #050814 48%, #02040c 100%)";
document.body.style.color = "#e2e8f0";

// 独立 SciFi 测试页：通过 hash 路由直接独立渲染（不经过 App.vue）
if (window.location.hash.includes("scifi-test")) {
  document.title = "SciFi 组件调试台";
  document.body.style.margin = "0";
  document.body.style.padding = "0";
  Promise.all([
    import("vue"),
    import("@techui/scifi/dist/index.css"),
    import("@techui/themes/lightBlue"),
    import("@techui/themes/darkBlue"),
    import("@techui/themes/darkBlack"),
  ]).then(async ([{ createApp, h }]) => {
    const { default: techuiScifi } = await import("@techui/scifi");
    const ScifiTestPage = (await import("@pages/datalake/views/scifi-test/index.vue")).default;
    const app = createApp({
      render: () => h(ScifiTestPage),
    });
    await techuiScifi({ app });
    app.mount("#app");
  });
} else if (window.location.hash.includes("bigscreen")) {
  // 独立全屏大屏页面
  document.title = "数据中台 · 全景大屏";
  document.body.style.margin = "0";
  document.body.style.padding = "0";
  Promise.all([
    import("vue"),
    import("@techui/scifi/dist/index.css"),
    import("@techui/themes/lightBlue"),
    import("@techui/themes/darkBlue"),
    import("@techui/themes/darkBlack"),
  ]).then(async ([{ createApp, h }]) => {
    const { default: techuiScifi } = await import("@techui/scifi");
    const BigscreenPage = (await import("@pages/datalake/views/bigscreen/index.vue")).default;
    const app = createApp({
      render: () => h(BigscreenPage),
    });
    await techuiScifi({ app });
    app.mount("#app");
  });
} else {
  createStandardApp({
    router: false,
    homeComponent: App,
    enableScComponents: true,
    enableTech: true,
  })
    .then((bootstrap) => bootstrap.mount("#app"))
    .catch((error) => {
      console.error("[DatalakeBootstrap] bootstrap-failed", error);
    });
}

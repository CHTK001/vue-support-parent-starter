import { createStandardApp } from "@repo/core";
import App from "./App.vue";

// 立即设置主题，确保首次渲染就是深色科技风
document.documentElement.setAttribute("data-skin", "tech");
document.documentElement.classList.add("dark");
document.body.style.background = "#050a1f";
document.body.style.color = "#e2e8f0";

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

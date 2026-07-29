import { createStandardApp } from "@repo/core";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";

console.log("[KoiBootstrap] main.ts start");

createStandardApp({
  layout: "koi",
  components: {
    ...Object.fromEntries(
      Object.entries(ElementPlusIconsVue).map(([key, comp]) => [key, comp]),
    ),
  },
})
  .then((bootstrap) => {
    console.log("[KoiBootstrap] resolved, mounting");
    return bootstrap.mount("#app");
  })
  .then(() => console.log("[KoiBootstrap] mounted"))
  .catch((error) => {
    console.error("[KoiBootstrap] bootstrap-failed", error);
    document.body.innerHTML = `<pre style="padding:20px;color:red;">ERR: ${error?.message}\n${error?.stack}</pre>`;
  });

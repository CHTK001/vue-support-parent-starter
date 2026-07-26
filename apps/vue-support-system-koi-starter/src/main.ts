import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import App from "./App.vue";
import { router } from "@layout/koi";
import i18n from "./languages";
import { getConfig } from "@repo/config";

console.log("[KOI-STARTER main.ts] Starting app...");
console.log("[KOI-STARTER main.ts] Config OpenAuth:", getConfig().OpenAuth);
console.log("[KOI-STARTER main.ts] Config RemoteMenu:", getConfig().RemoteMenu);
console.log("[KOI-STARTER main.ts] Config LayoutPackage:", getConfig().LayoutPackage);

try {
  const app = createApp(App);
  console.log("[KOI-STARTER main.ts] App created");
  
  app.use(createPinia());
  console.log("[KOI-STARTER main.ts] Pinia installed");
  
  app.use(ElementPlus, { size: "default" });
  console.log("[KOI-STARTER main.ts] ElementPlus installed");
  
  app.use(router);
  console.log("[KOI-STARTER main.ts] Router installed");
  
  app.use(i18n);
  console.log("[KOI-STARTER main.ts] i18n installed");
  
  console.log("[KOI-STARTER main.ts] Mounting app...");
  app.mount("#app");
  console.log("[KOI-STARTER main.ts] App mounted successfully");
} catch (e) {
  console.error("[KOI-STARTER main.ts] Error:", e);
  document.getElementById('app')!.innerHTML = '<pre style="color:red">' + JSON.stringify(e, null, 2) + '</pre>';
}
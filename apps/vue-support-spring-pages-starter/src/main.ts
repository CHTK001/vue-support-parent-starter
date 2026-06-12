import { createApp } from "vue";
import { createPinia } from "pinia";
import { createRouter, createWebHashHistory } from "vue-router";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "./styles/app.scss";
import App from "./App.vue";

const loadAiHome = () => import("@pages/ai/index.vue");
const loadManufacturer = () => import("@pages/ai/views/ai/manufacturer/index.vue");

const app = createApp(App);
app.use(createPinia());

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", redirect: "/ai" },
    { path: "/ai", redirect: "/ai/home" },
    { path: "/ai/home", name: "AiHome", component: loadAiHome },
    { path: "/ai/manufacturer", name: "AiManufacturer", component: loadManufacturer },
  ],
});
app.use(router);
app.use(ElementPlus);

import { IconifyIconOnline } from "@repo/components/ReIcon";
import ScButtonDefault from "@repo/components/ScButton";
import { ScInput } from "@repo/components/ScInput";
import { ScTag } from "@repo/components/ScTag";
import { ScDialog } from "@repo/components/ScDialog";
import ScOverlayStackDefault from "@repo/components/ScOverlayStack";
import { ScTooltip } from "@repo/components/ScTooltip";
import { ScDrawer } from "@repo/components/ScDrawer";
import { ScScrollbar } from "@repo/components/ScScrollbar";

app.component("IconifyIconOnline", IconifyIconOnline);
app.component("ScButton", ScButtonDefault);
app.component("ScInput", ScInput);
app.component("ScTag", ScTag);
app.component("ScDialog", ScDialog);
app.component("ScOverlayStack", ScOverlayStackDefault);
app.component("ScTooltip", ScTooltip);
app.component("ScDrawer", ScDrawer);
app.component("ScScrollbar", ScScrollbar);

app.mount("#app");

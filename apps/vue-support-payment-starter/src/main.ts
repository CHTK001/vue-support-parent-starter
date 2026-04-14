import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import App from "./App.vue";
import router from "./router";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import ScTable from "@repo/components/ScTable";
import ScTableColumn from "@repo/components/ScTableColumn";
import ScSwitch from "@repo/components/ScSwitch";
import ScButton from "@repo/components/ScButton";
import ScEmpty from "@repo/components/ScEmpty";
import ScTooltip from "@repo/components/ScTooltip";
import ScPopover from "@repo/components/ScPopover";
import ScCard from "@repo/components/ScCard";
import { IconifyIconOnline } from "@repo/components/ReIcon";

import "element-plus/dist/index.css";
import "@repo/assets/styles/base/index.scss";
import "@repo/assets/styles/theme/index.scss";
import "./styles/app.scss";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(ElementPlus);
app.component("ScTable", ScTable);
app.component("ScTableColumn", ScTableColumn);
app.component("ScSwitch", ScSwitch);
app.component("ScButton", ScButton);
app.component("ScEmpty", ScEmpty);
app.component("ScTooltip", ScTooltip);
app.component("ScPopover", ScPopover);
app.component("ScCard", ScCard);
app.component("IconifyIconOnline", IconifyIconOnline);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.mount("#app");

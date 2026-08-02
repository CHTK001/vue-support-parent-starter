import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import App from "./views/RemoteControl.vue";
import router from "./router";
import "./styles/app.scss";

document.documentElement.classList.remove("dark");

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(ElementPlus, { size: "default" });

app.mount("#app");
import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import App from "./App.vue";
import { router } from "./router";
<<<<<<< HEAD

/**
 * 应用启动入口。
=======
import "./styles/index.css";

/**
 * 启动应用。
>>>>>>> fb8e0ce45b19f414510a15383dd507638be205d9
 */
const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(ElementPlus, { size: "default" });

<<<<<<< HEAD
app.mount("#app");
=======
app.mount("#app");
>>>>>>> fb8e0ce45b19f414510a15383dd507638be205d9

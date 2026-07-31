import { createApp } from "vue";
import App from "./App.vue";
import router from "./routers";
import { installKoi } from "./install";

const app = createApp(App);
installKoi(app, { router });
app.mount("#app");

import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/display.css";
import App from "./Preview.vue";
import VueVideoPlayer from "@videojs-player/vue";
import "video.js/dist/video-js.css";

const app = createApp(App);
app.use(ElementPlus).use(VueVideoPlayer);
app.mount("#app");

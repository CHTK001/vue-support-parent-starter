/**
 * 统一文件预览入口（preview.html）挂载脚本。
 *
 * <p>构建产物 preview.html 会被部署为文件服务器 classpath
 * {@code static/preview/index.html}：后端在所有需要「服务端预览 HTML」的
 * 位置（{@code ?preview=true&render=server}、浏览器不能内联的格式等）返回
 * 这份壳页面，并注入 {@code window.__FILE_PREVIEW_BOOT__} 引导参数（短时效
 * 预览令牌直链等）。入口检测到引导参数即进入内嵌态渲染。</p>
 *
 * <p>顶层使用（前后端分离 / 独立访问）：地址栏
 * {@code /preview.html?url=<base64 文件直链>&render=server}——
 * {@code render=server} 时入口内 iframe 服务端通道；缺省时查桶配置，
 * 开启了下载就拉 {@code ?download=true} 二进制本地渲染，没开启退回服务端通道。</p>
 */
import { createApp } from "vue";
import ElementPlus from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import FilePreviewEntry from "@pages/filesystem/views/FilePreviewEntry.vue";

const app = createApp(FilePreviewEntry);
app.use(ElementPlus, { locale: zhCn });
app.mount("#app");

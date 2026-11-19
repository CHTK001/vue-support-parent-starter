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
 *
 * <p>Element Plus 按需化（性能清单 G1）：模板组件与样式由 vite.config.ts 的
 * ElementPlusResolver 编译期按需注入；入口只保留命令式 API 样式基线与
 * el-config-provider（中文 locale），不再全量 app.use(ElementPlus)。</p>
 */
import { createApp, defineComponent, h } from "vue";
import { ElConfigProvider, ElLoadingDirective } from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
// 反馈类命令式 API（ElMessage / ElMessageBox）不经模板编译，样式需显式引入
import "element-plus/es/components/message/style/css";
import "element-plus/es/components/message-box/style/css";
import "element-plus/es/components/loading/style/css";
import "element-plus/theme-chalk/dark/css-vars.css";
import FilePreviewEntry from "@pages/filesystem/views/FilePreviewEntry.vue";

/** 中文 locale + v-loading 指令（替代原全量 app.use(ElementPlus, { locale })） */
const PreviewRoot = defineComponent({
  name: "FilePreviewRoot",
  render: () => h(ElConfigProvider, { locale: zhCn }, { default: () => h(FilePreviewEntry) }),
});

const app = createApp(PreviewRoot);
app.directive("loading", ElLoadingDirective);
app.mount("#app");

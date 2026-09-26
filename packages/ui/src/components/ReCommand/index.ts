/**
 * ReCommand —— 通用命令填写与显示组件
 *
 * 支持内置模板、AI 流式生成（模型按能力过滤）、复制 / 清空，
 * 适用于项目启动 / 停止 / 重启脚本、软件安装命令等场景。
 *   <ReCommand v-model="cmd" os="linux" script-kind="start" :context="ctx" />
 */
import type { App, Plugin } from 'vue';
import ReCommand from './index.vue';

const plugin: Plugin = {
  install(app: App) {
    app.component('ReCommand', ReCommand);
  },
};

export { plugin as install };
export default ReCommand;

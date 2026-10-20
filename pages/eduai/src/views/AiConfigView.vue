<template>
  <!--
    AI 配置（/edu/ai-provider）—— pages/ai 的就地嵌入，替代原先指向独立 AI 控制台的 iframe。
    两个 tab 对应「改什么」与「用哪个」：
      · 厂商与模型：增删改提供商与模型（原 iframe 的 /models/embed）
      · 默认模型与运行参数：决定阅卷/组卷实际调用哪个模型（runtime / models 两个设置分组）
    顶部状态条回显后端真实生效的 provider · model，并提供一次真实的连通性测试 ——
    这是原先完全缺失的一环：配置改完，没有任何地方能确认是否生效。
  -->
  <div class="ai-config">
    <AiModelStatus :show-config-link="false" />

    <el-tabs v-model="tab" class="ai-config__tabs">
      <el-tab-pane label="厂商与模型" name="models">
        <div v-if="tab === 'models'" class="ai-config__pane">
          <ModelsEmbedPage />
        </div>
      </el-tab-pane>
      <el-tab-pane label="默认模型与运行参数" name="defaults">
        <div v-if="tab === 'defaults'" class="ai-config__pane ai-config__pane--scroll">
          <el-alert
            type="info"
            :closable="false"
            show-icon
            class="ai-config__tip"
            title="这一页决定 AI 组卷与 AI 阅卷实际调用哪个模型"
            description="填写提供方、接口地址、密钥与默认模型后保存即可生效，无需重启后端。改完请点上方「测试连通」确认。"
          />
          <DefaultModelSettings />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
/**
 * AI 配置页。
 *
 * <p><b>为什么不再用 iframe。</b>原实现把 AI 控制台的 `/models/embed` 塞进 iframe，
 * 依赖另一个进程/端口（默认 <code>localhost:15689</code>）、跨站 Cookie 与
 * <code>X-Frame-Options</code>；任一条件不满足就是整块白屏且没有任何提示
 * （2026-10-19 实测：15689 未启动，页面空白）。而且 iframe 里的页面与本应用
 * 不同源，主题、语言、登录态都不一致。</p>
 *
 * <p>现在直接渲染 <code>pages/ai</code> 的组件：请求经本应用的 http 管线，
 * 文案走本应用 i18n（由 <code>@pages/ai/embed</code> 合并语言包），
 * 不再有独立进程这一层。</p>
 */
import { ref } from "vue";
import AiModelStatus from "../components/ai/AiModelStatus.vue";
import ModelsEmbedPage from "@pages/ai/components/models/ModelsEmbedPage.vue";
import DefaultModelSettings from "@pages/ai/components/setting/DefaultModelSettings.vue";

/** 当前 tab：默认落在「厂商与模型」，与之前的落地页保持一致 */
const tab = ref<"models" | "defaults">("models");
</script>

<style scoped>
.ai-config {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.ai-config__tabs {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

:deep(.el-tabs__header) {
  flex: 0 0 auto;
  margin-bottom: 10px;
}

:deep(.el-tabs__content) {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.ai-config__pane {
  height: 100%;
  min-height: 0;
}

.ai-config__pane--scroll {
  overflow: auto;
}

/*
 * pages/ai 的组件用 Tailwind 工具类（h-full / flex / flex-col / flex-1 / min-h-0）排版，
 * 而本应用没有引入 Tailwind（引入会带来 preflight 全局重置，影响整站）。
 * 这里只补嵌入页实际用到的那几个布局类，保证内部滚动与高度分配正确；
 * 其余视觉细节由组件自己的 scoped 样式负责。
 */
:deep(.embed-models) {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

:deep(.em-main) {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
}

.ai-config__tip {
  margin-bottom: 12px;
}
</style>

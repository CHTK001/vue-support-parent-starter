<template>
  <!--
    试卷配置面板 —— pages/ai「系统设置 → 试卷配置」tab 的独立复用件。

    复用边界：内部只渲染 paper 分组（DefaultModelSettings :groups="['paper']"），
    试卷识别双管线（OCR / OCR+LLM）的 provider/密钥/地址/模型/阈值等字段由
    ai-starter 的 PaperGlobalSettingProvider 定义、/v2/settings 统一读写。
    宿主（eduai 等）要挂「试卷配置」入口时直接内嵌本组件，不再自建表单。
  -->
  <div class="paper-config-panel">
    <DefaultModelSettings :groups="['paper']" />
  </div>
</template>

<script setup lang="ts">
import DefaultModelSettings from "./DefaultModelSettings.vue";
</script>

<style scoped>
.paper-config-panel {
  display: flex;
  flex-direction: column;
  gap: 4px;
  height: 100%;
  min-height: 0;
  padding: 4px;
}
</style>
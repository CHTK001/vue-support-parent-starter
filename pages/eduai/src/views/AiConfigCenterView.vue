<template>
  <!--
    AI 配置中心（/edu/ai-config-center）—— 试卷识别配置，复用 pages/ai 的配置组件。

    复用边界（2026-10-23 统一）：
      本页不再自建 AI 运行时表单，直接内嵌 pages/ai 的 PaperConfigPanel
      （内部复用 DefaultModelSettings :groups="['paper']"）。试卷识别的
      provider/密钥/地址/模型/阈值等配置由 ai-starter PaperGlobalSettingProvider
      定义，经 /v2/settings 统一读写 sys_ai_global_setting 的 paper 分组，
      与 AI 控制台「系统设置 → 试卷配置」完全同源，避免两套配置口径分叉。
  -->
  <div class="ai-config-center">
    <PaperConfigPanel />
  </div>
</template>

<script setup lang="ts">
import PaperConfigPanel from "@pages/ai/components/setting/PaperConfigPanel.vue";
</script>

<style scoped>
.ai-config-center {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding: 4px;
}
</style>
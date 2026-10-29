<template>
  <!--
    试卷配置面板 —— pages/ai「系统设置 → 试卷配置」与 eduai「AI 配置中心」的共用组件。

    复用边界：内部只渲染三组全局设置
      · paper   （试卷识别）：OCR / OCR+LLM 双管线的 provider/密钥/地址/模型/阈值等；
      · marking （阅卷设置）：判分提示词、匹配模式（严谨/宽松）、识别策略、模型重试；
      · compose （AI 组卷）：默认题量、每题分值、卷面总分，组卷接口实际读取的就是这三项。
    三组都由 GlobalSettingProvider SPI 定义，经 /v2/settings 统一读写
    sys_ai_global_setting，因此「AI 配置中心 → 试卷配置」与「系统设置 → 试卷配置」
    看到的是同一份数据、同一个组件，不再各建一套表单。

    global-save：这两组配置的运行时读取走 GlobalSettingReader#getStrDirect，只读全局层，
    保存必须落全局默认层（管理员）；普通账号仍只写自己的覆盖层。
  -->
  <div class="paper-config-panel">
    <DefaultModelSettings :groups="['paper', 'marking', 'compose']" :global-save="globalSave" />
  </div>
</template>

<script setup lang="ts">
import DefaultModelSettings from "./DefaultModelSettings.vue";

/**
 * 是否走全局层保存（管理员系统配置入口传 true）。
 */
withDefaults(defineProps<{ globalSave?: boolean }>(), { globalSave: true });
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

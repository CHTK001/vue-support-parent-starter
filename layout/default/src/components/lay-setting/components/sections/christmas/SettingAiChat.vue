<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingAiChat.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="christmas"
    section="SettingAiChat"
    kicker="North Pole AI"
    title="圣诞 AI 助手设置"
    description="AI 助手配置面板改成冬日礼盒风格，保证模型、API 和外观设置也属于同一主题壳层。"
    icon="ri:robot-2-line"
    motion="frost"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingAiChat.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="default"
    section="SettingAiChat"
    kicker="Base AI"
    title="默认 AI 助手设置"
    description="AI 助手入口、模型和外观先落在标准面板里，保证所有主题都能复用同一套能力开关。"
    icon="ri:robot-2-line"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

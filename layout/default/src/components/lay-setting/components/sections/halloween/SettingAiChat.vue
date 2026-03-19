<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingAiChat.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="halloween"
    section="SettingAiChat"
    kicker="Spooky AI"
    title="万圣 AI 助手面板"
    description="AI 助手配置也切进万圣夜控制台，让入口、模型和外观卡片都保留节日互动氛围。"
    icon="ri:robot-2-line"
    motion="glitch"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingAiChat.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="8bit"
    section="SettingAiChat"
    kicker="Pixel Sidekick"
    title="像素 AI 副驾"
    description="AI 助手入口换成掌机副驾控制区，保留模型与外观配置，但视觉统一为像素控制台。"
    icon="ri:robot-2-line"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

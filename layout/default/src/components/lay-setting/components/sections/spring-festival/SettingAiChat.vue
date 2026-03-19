<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingAiChat.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="spring-festival"
    section="SettingAiChat"
    kicker="Lucky Assistant"
    title="春节 AI 助手设置"
    description="AI 助手卡片也纳入春节主视觉，入口、模型和外观配置不再跳回普通浅色面板。"
    icon="ri:robot-2-line"
    motion="gold-foil"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingAiChat.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="future-tech"
    section="SettingAiChat"
    kicker="Cyber AI"
    title="未来科技 AI 控制台"
    description="AI 助手的入口、模型和外观配置全部纳入赛博控制台，维持一致的霓虹终端氛围。"
    icon="ri:robot-2-line"
    motion="neon"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

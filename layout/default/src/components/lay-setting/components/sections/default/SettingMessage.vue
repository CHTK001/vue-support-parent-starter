<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingMessage.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="default"
    section="SettingMessage"
    kicker="Base Feedback"
    title="默认消息提示设置"
    description="全局消息、通知和交互反馈保持清晰克制，作为节日与赛博主题的参照系。"
    icon="ri:message-2-line"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

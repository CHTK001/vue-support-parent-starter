<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingMessage.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="halloween"
    section="SettingMessage"
    kicker="Phantom Notice"
    title="万圣消息提示"
    description="消息反馈区保持橙字与暗底的强对比，确保提示清晰，同时延续诡异故障感。"
    icon="ri:message-2-line"
    motion="glitch"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

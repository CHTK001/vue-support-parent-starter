<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingMessage.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="future-tech"
    section="SettingMessage"
    kicker="Signal Feed"
    title="未来科技消息提示"
    description="消息与通知面板保持冷光边界和数字终端感，确保提示层在深色科技主题下依旧清晰。"
    icon="ri:message-2-line"
    motion="neon"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

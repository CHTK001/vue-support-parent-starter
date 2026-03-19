<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingMessage.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="christmas"
    section="SettingMessage"
    kicker="Carol Notice"
    title="圣诞消息提示"
    description="通知和反馈卡片也统一接入冰霜表层与暖金高亮，避免节日主题下提示层单薄。"
    icon="ri:message-2-line"
    motion="frost"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

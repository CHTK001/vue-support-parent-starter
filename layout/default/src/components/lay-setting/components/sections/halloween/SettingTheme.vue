<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingTheme.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="halloween"
    section="SettingTheme"
    kicker="Ghost Channel"
    title="万圣夜换肤总控"
    description="主题入口加入故障字与暗紫橙色氛围，后续节日功能和交互都从这里继续扩展。"
    icon="ri:ghost-2-line"
    motion="glitch"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>


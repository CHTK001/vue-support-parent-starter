<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingDisplay.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="halloween"
    section="SettingDisplay"
    kicker="Moonlit Display"
    title="万圣显示氛围"
    description="显示层把暗夜背景、故障字和高亮边界统一起来，避免局部动效和主体控件割裂。"
    icon="ri:focus-3-line"
    motion="glitch"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

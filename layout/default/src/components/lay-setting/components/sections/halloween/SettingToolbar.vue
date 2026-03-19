<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingToolbar.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="halloween"
    section="SettingToolbar"
    kicker="Spooky Header"
    title="万圣顶部交互"
    description="系统设置按钮会挂入故障字、蜘蛛网和暗夜高亮，顶部时间继续保留节日感但不牺牲可读性。"
    icon="ri:skull-line"
    motion="glitch"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>


<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingTabs.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="halloween"
    section="SettingTabs"
    kicker="Haunted Tabs"
    title="万圣标签栏异化"
    description="标签页开关与样式落在暗夜面板里，让顶部状态保持橙紫对比，并给故障字效果留出空间。"
    icon="ri:price-tag-3-line"
    motion="glitch"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

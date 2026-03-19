<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingTabs.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="future-tech"
    section="SettingTabs"
    kicker="Neon Tabs"
    title="未来科技标签栏"
    description="标签页的显隐、缓存和样式统一纳入霓虹控制台，确保顶部状态和赛博边框同频。"
    icon="ri:price-tag-3-line"
    motion="neon"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingTabs.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="spring-festival"
    section="SettingTabs"
    kicker="Golden Tabs"
    title="春节标签栏样式"
    description="标签页的显隐、缓存和样式继续收紧到红底金字体系，确保顶部状态既喜庆又清楚。"
    icon="ri:price-tag-3-line"
    motion="gold-foil"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

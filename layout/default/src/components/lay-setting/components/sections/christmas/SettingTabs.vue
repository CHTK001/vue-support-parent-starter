<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingTabs.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="christmas"
    section="SettingTabs"
    kicker="Winter Tabs"
    title="圣诞标签栏样式"
    description="标签页切换统一到冬夜红绿和暖金层次里，让顶部状态既有节日感也保留可读性。"
    icon="ri:price-tag-3-line"
    motion="frost"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

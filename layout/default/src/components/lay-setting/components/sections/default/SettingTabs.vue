<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingTabs.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="default"
    section="SettingTabs"
    kicker="Base Tabs"
    title="默认标签栏设置"
    description="标签页形态、缓存和显隐开关继续走标准控制面板，作为其它主题定制的稳定基线。"
    icon="ri:price-tag-3-line"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

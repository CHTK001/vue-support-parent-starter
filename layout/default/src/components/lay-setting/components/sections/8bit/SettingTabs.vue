<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingTabs.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="8bit"
    section="SettingTabs"
    kicker="Pixel Tabs"
    title="像素标签栏调频"
    description="标签页样式切回像素游戏机的面板语言，让切换、缓存和显隐都保留复古节奏。"
    icon="ri:price-tag-3-line"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

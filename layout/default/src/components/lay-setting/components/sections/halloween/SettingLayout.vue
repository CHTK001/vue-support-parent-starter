<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingLayout.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="halloween"
    section="SettingLayout"
    kicker="Haunted Grid"
    title="万圣布局暗舱"
    description="布局切换优先拉开暗紫背景、橙色文字和高亮态，让不同导航模式都保持节日辨识度。"
    icon="ri:layout-masonry-line"
    motion="glitch"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>


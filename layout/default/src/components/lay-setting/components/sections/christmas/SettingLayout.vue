<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingLayout.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="christmas"
    section="SettingLayout"
    kicker="Holiday Layout"
    title="圣诞布局舞台"
    description="导航背景、标题文字和激活状态统一拉开圣诞红绿对比，避免菜单层级发闷。"
    icon="ri:layout-row-line"
    motion="frost"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>


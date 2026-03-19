<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingLayout.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="spring-festival"
    section="SettingLayout"
    kicker="Festival Layout"
    title="春节布局礼序"
    description="垂直、横向、混合和双栏布局统一拉成红底金字，避免导航背景、文字与激活态互相吃色。"
    icon="ri:layout-grid-line"
    motion="gold-foil"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>


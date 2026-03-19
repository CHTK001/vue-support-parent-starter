<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingDisplay.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="spring-festival"
    section="SettingDisplay"
    kicker="Festival Display"
    title="春节显示层氛围"
    description="面包屑、页脚、动画和装饰入口统一落在年味显示层里，避免红金配色只落在局部控件。"
    icon="ri:focus-3-line"
    motion="gold-foil"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

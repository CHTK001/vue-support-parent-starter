<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingDisplay.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="default"
    section="SettingDisplay"
    kicker="Base Display"
    title="默认显示层设置"
    description="页面显隐、面包屑、页脚和动画等展示项集中在标准显示层，方便所有主题共用同一组基础行为。"
    icon="ri:focus-3-line"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

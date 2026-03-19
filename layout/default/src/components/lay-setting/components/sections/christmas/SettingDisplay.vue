<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingDisplay.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="christmas"
    section="SettingDisplay"
    kicker="Snow Display"
    title="圣诞显示层舞台"
    description="显示层延续冰霜字和节日边框，让页面装饰、页脚和动画保持同一套冬日质感。"
    icon="ri:focus-3-line"
    motion="frost"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

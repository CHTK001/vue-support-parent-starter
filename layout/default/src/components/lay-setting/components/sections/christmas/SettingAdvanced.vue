<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingAdvanced.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="christmas"
    section="SettingAdvanced"
    kicker="Sleigh Switch"
    title="圣诞高级开关"
    description="高阶选项收进圣诞控制台，延续冷暖对比和清晰边框，避免重要设置在暗面板里失焦。"
    icon="ri:settings-5-line"
    motion="frost"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

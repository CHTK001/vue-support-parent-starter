<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingAdvanced.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="8bit"
    section="SettingAdvanced"
    kicker="Debug Switch"
    title="像素高级开关"
    description="高级设置做成像素调试台，让不常用配置和重置入口也保持同一套复古机械感。"
    icon="ri:settings-5-line"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

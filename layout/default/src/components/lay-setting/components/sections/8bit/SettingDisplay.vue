<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingDisplay.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="8bit"
    section="SettingDisplay"
    kicker="CRT Display"
    title="像素显示舞台"
    description="显示层采用像素屏幕语境，强调开关状态和轮廓边界，避免复古主题下信息发虚。"
    icon="ri:focus-3-line"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

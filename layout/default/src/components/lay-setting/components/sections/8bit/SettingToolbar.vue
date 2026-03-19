<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingToolbar.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="8bit"
    section="SettingToolbar"
    kicker="Pixel HUD"
    title="像素工具栏"
    description="顶部时间与开关项按像素 HUD 呈现，保证字体、边框和状态符号风格一致。"
    icon="ri:computer-line"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>


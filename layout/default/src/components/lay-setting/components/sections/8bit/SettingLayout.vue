<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingLayout.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="8bit"
    section="SettingLayout"
    kicker="Pixel Grid"
    title="像素布局舱"
    description="布局卡片、尺寸参数与切换态统一改成直角像素块，避免和现代圆角风格混杂。"
    icon="ri:apps-2-line"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>


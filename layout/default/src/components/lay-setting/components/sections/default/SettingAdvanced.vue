<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingAdvanced.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="default"
    section="SettingAdvanced"
    kicker="Base Advanced"
    title="默认高级设置"
    description="高阶开关、重置入口和边界项继续保留在基础控制区，避免主题壳层影响实际行为。"
    icon="ri:settings-5-line"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingAdvanced.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="halloween"
    section="SettingAdvanced"
    kicker="Ritual Switch"
    title="万圣高级仪式台"
    description="高级选项保留暗夜仪式感和清晰边界，防止重要开关埋进低对比装饰里。"
    icon="ri:settings-5-line"
    motion="glitch"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

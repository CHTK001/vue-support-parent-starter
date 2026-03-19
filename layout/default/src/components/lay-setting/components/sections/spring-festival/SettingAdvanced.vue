<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingAdvanced.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="spring-festival"
    section="SettingAdvanced"
    kicker="Festival Switch"
    title="春节高级开关"
    description="不常用的高级项也统一包进红金控制区，避免深色面板与节日主题发生视觉断层。"
    icon="ri:settings-5-line"
    motion="gold-foil"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

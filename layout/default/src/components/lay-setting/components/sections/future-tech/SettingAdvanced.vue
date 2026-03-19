<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingAdvanced.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="future-tech"
    section="SettingAdvanced"
    kicker="Kernel Switch"
    title="未来科技高级设置"
    description="高级开关保留终端级边界和冷光反馈，避免关键设置在主题强化后反而失去辨识度。"
    icon="ri:settings-5-line"
    motion="neon"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

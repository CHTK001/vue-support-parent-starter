<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingDisplay.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="future-tech"
    section="SettingDisplay"
    kicker="Holo Display"
    title="未来科技显示层"
    description="显示层继续收口到全息边框和冷光对比里，避免页面装饰和主控件脱节。"
    icon="ri:focus-3-line"
    motion="neon"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

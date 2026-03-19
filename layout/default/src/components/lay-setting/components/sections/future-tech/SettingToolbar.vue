<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingToolbar.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="future-tech"
    section="SettingToolbar"
    kicker="Cyber HUD"
    title="未来科技顶部 HUD"
    description="时间、设置按钮和工具项统一切到赛博字形、霓虹边框和扫描光效，防止顶部只换色不换气质。"
    icon="ri:dashboard-3-line"
    motion="neon"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>


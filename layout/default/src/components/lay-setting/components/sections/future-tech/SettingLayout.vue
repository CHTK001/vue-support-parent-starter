<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingLayout.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="future-tech"
    section="SettingLayout"
    kicker="Navigation Matrix"
    title="未来科技布局矩阵"
    description="各类导航模式统一收敛到霓虹蓝、暗底与扫描边界，避免混合导航和横向导航看起来不属于同一主题。"
    icon="ri:stack-line"
    motion="neon"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>


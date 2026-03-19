<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingLayout.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="default"
    section="SettingLayout"
    kicker="Layout Matrix"
    title="默认布局矩阵"
    description="保持结构清晰的布局切换与参数调整，方便对照其他主题的风格差异。"
    icon="ri:layout-4-line"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>


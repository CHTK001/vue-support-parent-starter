<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingToolbar.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="spring-festival"
    section="SettingToolbar"
    kicker="Festival Header"
    title="春节顶部仪表"
    description="时间、设置按钮和常用入口统一切到书法感与金边高亮，避免顶部仍停留默认字体。"
    icon="ri:time-line"
    motion="gold-foil"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>


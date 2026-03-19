<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingTheme.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="christmas"
    section="SettingTheme"
    kicker="Holiday Console"
    title="圣诞主题总控"
    description="圣诞红、深松绿和暖金色作为主轴，主题入口优先保证节日层级与发光节奏统一。"
    icon="ri:snowflake-line"
    motion="frost"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>


<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingToolbar.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="christmas"
    section="SettingToolbar"
    kicker="Holiday Header"
    title="圣诞顶部仪表"
    description="顶部时间与系统设置按钮统一切到暖金字与圣诞边框，避免顶部元素像默认主题一样发灰。"
    icon="ri:notification-4-line"
    motion="frost"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>


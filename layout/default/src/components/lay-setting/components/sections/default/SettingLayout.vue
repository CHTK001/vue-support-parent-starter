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
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>


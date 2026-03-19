<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingDisplay.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="christmas"
    section="SettingDisplay"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

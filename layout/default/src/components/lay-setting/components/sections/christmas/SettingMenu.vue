<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingMenu.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="christmas"
    section="SettingMenu"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>


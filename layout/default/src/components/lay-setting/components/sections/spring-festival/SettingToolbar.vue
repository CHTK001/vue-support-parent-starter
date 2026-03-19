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
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>


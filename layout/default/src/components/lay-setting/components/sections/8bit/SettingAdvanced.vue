<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingAdvanced.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="8bit"
    section="SettingAdvanced"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

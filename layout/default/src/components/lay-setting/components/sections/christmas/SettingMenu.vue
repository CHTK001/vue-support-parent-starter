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
    kicker="Holiday Menu"
    title="圣诞菜单状态"
    description="菜单常态、hover 与激活态统一对齐圣诞红绿金配色，避免当前三者对比不够明确。"
    icon="ri:menu-add-line"
    motion="frost"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>


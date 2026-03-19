<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingMenu.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="future-tech"
    section="SettingMenu"
    kicker="Cyber Menu"
    title="未来科技菜单状态"
    description="把菜单背景、文字与激活态统一拉进赛博蓝绿体系，避免 lay-tag 和导航高亮强度不一致。"
    icon="ri:menu-line"
    motion="neon"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>


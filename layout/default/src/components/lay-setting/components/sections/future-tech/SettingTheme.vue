<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingTheme.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="future-tech"
    section="SettingTheme"
    kicker="Neon Kernel"
    title="未来科技换肤核心"
    description="未来科技主题的皮肤、切换动画与视觉入口统一归到霓虹控制台，便于继续扩展赛博交互。"
    icon="ri:radar-line"
    motion="neon"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>


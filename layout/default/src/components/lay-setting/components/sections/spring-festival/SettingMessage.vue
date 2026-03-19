<script setup lang="ts">
import ThemeSectionShell from "../shared/ThemeSectionShell.vue";
import BaseSection from "../../../themes/components/SettingMessage.vue";

defineOptions({ inheritAttrs: false });
const sectionComponent = BaseSection as any;
</script>

<template>
  <ThemeSectionShell
    theme="spring-festival"
    section="SettingMessage"
    kicker="Lucky Notices"
    title="春节消息提示"
    description="消息提示区用更明确的红金层次承接通知和反馈，避免信息状态被节日装饰稀释。"
    icon="ri:message-2-line"
    motion="gold-foil"
  >
    <component :is="sectionComponent" v-bind="$attrs" />
  </ThemeSectionShell>
</template>

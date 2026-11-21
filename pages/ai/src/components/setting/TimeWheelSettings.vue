<template>
  <!--
    时间轮面板 —— 「系统设置 → 时间轮」。

    复用边界：只渲染 timewheel 一个全局设置分组（后端 TimeWheelGlobalSettingProvider
    经 /v2/settings 统一读写 sys_ai_global_setting），由 DefaultModelSettings 的
    通用渲染器出表单（BOOLEAN→开关、NUMBER/STRING→输入框），不另造一套表单。

    global-save：时间轮是**全局层**配置（AiSyncTimeWheelTask 读全局层驱动定时同步），
    保存必须落全局默认层（管理员）；普通账号只写自己的覆盖层也不会被定时链路读到。
  -->
  <div class="timewheel-settings-panel">
    <DefaultModelSettings :groups="['timewheel']" :global-save="true" />
  </div>
</template>

<script setup lang="ts">
import DefaultModelSettings from "./DefaultModelSettings.vue";
</script>

<style scoped>
.timewheel-settings-panel {
  display: flex;
  flex-direction: column;
  gap: 4px;
  height: 100%;
  min-height: 0;
  padding: 4px;
}
</style>

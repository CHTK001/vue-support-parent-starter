<template>
  <!--
    试卷配置独立页 —— AI 模块对外提供的完整页面。

    复用边界（2026-10-29 收敛）：
      本页是 pages/ai 的「试卷配置」独立入口，内部就是 PaperConfigPanel，与
      「设置中心 → 试卷配置」是同一个组件、同一份数据（sys_ai_global_setting 的
      paper / marking / compose 三个分组，均由 ai 模块的 GlobalSettingProvider 定义）。

      此前该页壳（eduai 的 AiConfigCenterView.vue）住在业务侧，只 import 面板 ——
      页面骨架因此多了一份，且「分组定义在 eduai jar、面板在 ai 包」两头分家。
      现在页壳也归 ai 模块，宿主（eduai）只做路由依赖，不再复写页面。

      保存走全局层：paper / marking / compose 的运行时读取是
      GlobalSettingReader#getStrDirect，只读全局层、不读用户覆盖层；
      若保存落到覆盖层会「界面保存了却不生效」。
  -->
  <div class="paper-config-page">
    <PaperConfigPanel :global-save="true" />
  </div>
</template>

<script setup lang="ts">
import PaperConfigPanel from "./PaperConfigPanel.vue";
</script>

<style scoped>
.paper-config-page {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding: 4px;
}
</style>

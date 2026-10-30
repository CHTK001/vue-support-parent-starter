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
    <!--
      滚动容器：本页是整页独立入口（不像「设置中心」有 ScrollContainer 包着），
      页壳必须自己提供滚动。原先这里是 height:100% + overflow:hidden，
      三组卡片合计 1371px 高、容器只有 761px —— 溢出部分被直接裁掉：
      没有滚动条、滚轮不动、第三组 compose 永远够不到（2026-10-30 线上实测）。
      改走模块通用的 ScrollContainer：与「设置中心 → 试卷配置」同一套滚动/滚动条行为。
    -->
    <ScrollContainer class="paper-config-scroll" aria-label="试卷配置">
      <PaperConfigPanel :global-save="true" />
    </ScrollContainer>
  </div>
</template>

<script setup lang="ts">
import PaperConfigPanel from "./PaperConfigPanel.vue";
import ScrollContainer from "../ui/ScrollContainer.vue";
</script>

<style scoped>
.paper-config-page {
  height: 100%;
  min-height: 0;
  padding: 4px;
}

.paper-config-scroll {
  height: 100%;
}
</style>

<template>
  <TechTemplatePage>
    <ScifiHeaderA1 :width="600">@techui/scifi 组件展示</ScifiHeaderA1>

    <TuiGrid class="demo-grid" :gap="40" :rows="2" :cols="3">
      <template #cell-0-0>
        <ScifiPanelA1 title="ScifiPanelA1" :rotate="'y'">
          <div class="panel-body">内容区域 — 支持插槽扩展</div>
        </ScifiPanelA1>
      </template>
      <template #cell-0-1>
        <ScifiPanelA2 title="ScifiPanelA2" backgroundOpacity="0.6">
          <div class="panel-body">左线框风格面板</div>
        </ScifiPanelA2>
      </template>
      <template #cell-0-2>
        <ScifiPanelB1 title="ScifiPanelB1">
          <div class="panel-body">几何边框面板</div>
        </ScifiPanelB1>
      </template>
      <template #cell-1-0>
        <ScifiPanelDV1 title="ScifiPanelDV1">
          <div class="panel-body">数据可视化风格</div>
        </ScifiPanelDV1>
      </template>
      <template #cell-1-1>
        <ScifiPanelReactor title="ScifiPanelReactor" :rotate="'z'">
          <div class="panel-body">反应堆风格面板</div>
        </ScifiPanelReactor>
      </template>
      <template #cell-1-2>
        <div class="button-demo">
          <ScifiPanelTitleA1>按钮集合</ScifiPanelTitleA1>
          <div class="btn-row">
            <ScifiButtonA1>主要</ScifiButtonA1>
            <ScifiButtonA2>次要</ScifiButtonA2>
            <ScifiButtonA3>强调</ScifiButtonA3>
          </div>
          <div class="btn-row">
            <ScifiButtonDash>Dash</ScifiButtonDash>
            <ScifiButtonPod>Pod</ScifiButtonPod>
            <ScifiButtonHex>Hex</ScifiButtonHex>
          </div>
        </div>
      </template>
    </TuiGrid>

    <ScifiDecoA1 class="deco-bar" />
  </TechTemplatePage>
</template>

<script setup lang="ts">
import TechTemplatePage from "../template/index.vue";
defineOptions({ name: "ComponentsDemoPage" });
</script>

<style scoped>
.demo-grid {
  padding: 40px;
  max-width: 1400px;
  margin: 0 auto;
  --tui-grid-w: auto;
  --tui-grid-h: auto;
  --tui-grid-item-pd: 0;
  --tui-grid-item-bg: transparent;
  --tui-grid-item-bd: transparent;
}
.panel-body {
  padding: 32px 24px;
  font-size: 15px;
  line-height: 1.6;
}
.button-demo {
  padding: 16px;
}
.btn-row {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  flex-wrap: wrap;
}
.deco-bar {
  margin-top: 32px;
}
</style>

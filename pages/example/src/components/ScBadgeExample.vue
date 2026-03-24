<template>
  <div class="sc-badge-example">
    <DemoBlock title="数字徽标" :code="codes.number">
      <div class="demo-row">
        <ScBadge :value="3">
          <ScButton type="primary">消息</ScButton>
        </ScBadge>
        <ScBadge :value="99">
          <ScButton>通知</ScButton>
        </ScBadge>
        <ScBadge :value="120" :max="99">
          <ScButton>上限显示</ScButton>
        </ScBadge>
      </div>
    </DemoBlock>

    <DemoBlock title="小红点与状态点" :code="codes.dot">
      <div class="demo-row">
        <ScBadge is-dot>
          <ScButton>小红点</ScButton>
        </ScBadge>
        <ScBadge type="success" is-dot>
          <ScButton>成功</ScButton>
        </ScBadge>
        <ScBadge type="warning" is-dot>
          <ScButton>警告</ScButton>
        </ScBadge>
      </div>
    </DemoBlock>
  </div>
</template>

<script setup lang="ts">
import { ScBadge, ScButton } from "@repo/components";
import DemoBlock from "./DemoBlock.vue";

const codes = {
  number: `<ScBadge :value="3">
  <ScButton type="primary">消息</ScButton>
</ScBadge>
<ScBadge :value="99">
  <ScButton>通知</ScButton>
</ScBadge>
<ScBadge :value="120" :max="99">
  <ScButton>上限显示</ScButton>
</ScBadge>`,
  dot: `<ScBadge is-dot>
  <ScButton>小红点</ScButton>
</ScBadge>
<ScBadge type="success" is-dot>
  <ScButton>成功</ScButton>
</ScBadge>
<ScBadge type="warning" is-dot>
  <ScButton>警告</ScButton>
</ScBadge>`
};
</script>

<style scoped lang="scss">
.sc-badge-example {
  padding: 20px;

  .demo-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
  }
}
</style>



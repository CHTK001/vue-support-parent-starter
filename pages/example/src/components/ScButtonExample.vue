<template>
  <div class="sc-button-example">
    <DemoBlock title="按钮类型" :code="codes.types">
      <div class="demo-row">
        <ScButton type="default">默认按钮</ScButton>
        <ScButton type="primary">主要按钮</ScButton>
        <ScButton type="success">成功按钮</ScButton>
        <ScButton type="warning">警告按钮</ScButton>
        <ScButton type="danger">危险按钮</ScButton>
        <ScButton type="info">信息按钮</ScButton>
      </div>
    </DemoBlock>

    <DemoBlock title="尺寸与禁用" :code="codes.sizes">
      <div class="demo-row">
        <ScButton type="primary" size="small">小号按钮</ScButton>
        <ScButton type="primary">默认按钮</ScButton>
        <ScButton type="primary" size="large">大号按钮</ScButton>
        <ScButton type="primary" disabled>禁用按钮</ScButton>
        <ScButton type="primary" loading>加载中</ScButton>
      </div>
    </DemoBlock>
  </div>
</template>

<script setup lang="ts">
import { ScButton } from "@repo/components";
import DemoBlock from "./DemoBlock.vue";

const codes = {
  types: `<ScButton type="default">默认按钮</ScButton>
<ScButton type="primary">主要按钮</ScButton>
<ScButton type="success">成功按钮</ScButton>
<ScButton type="warning">警告按钮</ScButton>
<ScButton type="danger">危险按钮</ScButton>
<ScButton type="info">信息按钮</ScButton>`,
  sizes: `<ScButton type="primary" size="small">小号按钮</ScButton>
<ScButton type="primary">默认按钮</ScButton>
<ScButton type="primary" size="large">大号按钮</ScButton>
<ScButton type="primary" disabled>禁用按钮</ScButton>
<ScButton type="primary" loading>加载中</ScButton>`
};
</script>

<style scoped lang="scss">
.sc-button-example {
  padding: 20px;

  .demo-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }
}
</style>



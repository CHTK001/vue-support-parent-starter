<template>
  <div class="sc-alert-example">
    <DemoBlock title="基础用法" :code="codes.basic">
      <div class="demo-column">
        <ScAlert title="信息提示" type="info" />
        <ScAlert title="成功提示" type="success" show-icon />
        <ScAlert title="警告提示" type="warning" show-icon />
        <ScAlert title="错误提示" type="error" show-icon />
      </div>
    </DemoBlock>

    <DemoBlock title="自定义内容" :code="codes.custom">
      <div class="demo-column">
        <ScAlert type="success" show-icon>
          <template #title>操作成功</template>
          数据已经成功提交，可以在列表中查看最新结果。
        </ScAlert>
        <ScAlert type="warning" show-icon :closable="false">
          <template #title>注意事项</template>
          提交前请再次确认关键信息，避免产生不可逆修改。
        </ScAlert>
      </div>
    </DemoBlock>
  </div>
</template>

<script setup lang="ts">
import { ScAlert } from "@repo/components";
import DemoBlock from "./DemoBlock.vue";

const codes = {
  basic: `<ScAlert title="信息提示" type="info" />
<ScAlert title="成功提示" type="success" show-icon />
<ScAlert title="警告提示" type="warning" show-icon />
<ScAlert title="错误提示" type="error" show-icon />`,
  custom: `<ScAlert type="success" show-icon>
  <template #title>操作成功</template>
  数据已经成功提交，可以在列表中查看最新结果。
</ScAlert>
<ScAlert type="warning" show-icon :closable="false">
  <template #title>注意事项</template>
  提交前请再次确认关键信息，避免产生不可逆修改。
</ScAlert>`,
};
</script>

<style scoped lang="scss">
.sc-alert-example {
  padding: 20px;

  .demo-column {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}
</style>



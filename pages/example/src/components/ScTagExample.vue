<template>
  <div class="sc-tag-example">
    <DemoBlock title="基础标签" :code="codes.basic">
      <div class="demo-row">
        <ScTag>默认标签</ScTag>
        <ScTag type="primary">主标签</ScTag>
        <ScTag type="success">成功</ScTag>
        <ScTag type="warning">警告</ScTag>
        <ScTag type="danger">危险</ScTag>
        <ScTag type="info">信息</ScTag>
      </div>
    </DemoBlock>

    <DemoBlock title="可关闭与圆角" :code="codes.more">
      <div class="demo-row">
        <ScTag
          v-for="tag in closableTags"
          :key="tag.id"
          :type="tag.type"
          :round="tag.round"
          closable
          @close="handleClose(tag.id)"
        >
          {{ tag.label }}
        </ScTag>
        <ScTag type="success" effect="dark">深色</ScTag>
        <ScTag type="warning" round>圆角</ScTag>
      </div>
    </DemoBlock>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ScTag } from "@repo/components";
import DemoBlock from "./DemoBlock.vue";

const closableTags = ref([
  { id: 1, label: "可关闭" },
  { id: 2, label: "主要", type: "primary" },
  { id: 3, label: "圆角可关闭", type: "danger", round: true }
]);

const codes = {
  basic: `<ScTag>默认标签</ScTag>
<ScTag type="primary">主标签</ScTag>
<ScTag type="success">成功</ScTag>
<ScTag type="warning">警告</ScTag>
<ScTag type="danger">危险</ScTag>
<ScTag type="info">信息</ScTag>`,
  more: `<ScTag
  v-for="tag in closableTags"
  :key="tag.id"
  :type="tag.type"
  :round="tag.round"
  closable
  @close="handleClose(tag.id)"
>
  {{ tag.label }}
</ScTag>
<ScTag type="success" effect="dark">深色</ScTag>
<ScTag type="warning" round>圆角</ScTag>`
};

const handleClose = (id: number) => {
  closableTags.value = closableTags.value.filter(tag => tag.id !== id);
};
</script>

<style scoped lang="scss">
.sc-tag-example {
  padding: 20px;

  .demo-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }
}
</style>



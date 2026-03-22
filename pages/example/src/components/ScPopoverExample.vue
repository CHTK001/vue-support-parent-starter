<template>
  <div class="sc-popover-example">
    <DemoBlock title="基础用法" :code="codes.basic">
      <div class="demo-row">
        <ScPopover title="标题" content="这是弹出框的基础内容">
          <ScButton>点击显示</ScButton>
        </ScPopover>
        <ScPopover content="只有内容，没有标题">
          <ScButton>无标题</ScButton>
        </ScPopover>
        <ScPopover title="标题" content="这是弹出框的内容">
          <ScButton type="primary">主要按钮</ScButton>
        </ScPopover>
      </div>
    </DemoBlock>

    <DemoBlock title="不同位置" :code="codes.placement">
      <div class="demo-row">
        <ScPopover title="顶部" content="弹出框在顶部" placement="top">
          <ScButton>顶部</ScButton>
        </ScPopover>
        <ScPopover title="底部" content="弹出框在底部" placement="bottom">
          <ScButton>底部</ScButton>
        </ScPopover>
        <ScPopover title="左侧" content="弹出框在左侧" placement="left">
          <ScButton>左侧</ScButton>
        </ScPopover>
        <ScPopover title="右侧" content="弹出框在右侧" placement="right">
          <ScButton>右侧</ScButton>
        </ScPopover>
        <ScPopover title="左上" content="弹出框在左上" placement="top-start">
          <ScButton>左上</ScButton>
        </ScPopover>
        <ScPopover title="右上" content="弹出框在右上" placement="top-end">
          <ScButton>右上</ScButton>
        </ScPopover>
        <ScPopover title="左下" content="弹出框在左下" placement="bottom-start">
          <ScButton>左下</ScButton>
        </ScPopover>
        <ScPopover title="右下" content="弹出框在右下" placement="bottom-end">
          <ScButton>右下</ScButton>
        </ScPopover>
      </div>
    </DemoBlock>

    <DemoBlock title="触发方式" :code="codes.trigger">
      <div class="demo-row">
        <ScPopover
          title="点击触发"
          content="点击按钮显示弹出框"
          trigger="click"
        >
          <ScButton>点击触发</ScButton>
        </ScPopover>
        <ScPopover
          title="悬停触发"
          content="鼠标悬停显示弹出框"
          trigger="hover"
        >
          <ScButton>悬停触发</ScButton>
        </ScPopover>
        <ScPopover
          title="聚焦触发"
          content="聚焦输入框显示弹出框"
          trigger="focus"
        >
          <ScInput placeholder="聚焦触发" />
        </ScPopover>
        <ScPopover
          title="右键触发"
          content="右键点击显示弹出框"
          trigger="contextmenu"
        >
          <ScButton>右键触发</ScButton>
        </ScPopover>
      </div>
    </DemoBlock>

    <DemoBlock title="自定义内容" :code="codes.custom">
      <div class="demo-row">
        <ScPopover title="自定义内容" width="300">
          <template #content>
            <div class="custom-content">
              <p style="margin: 0 0 8px 0">这是一个自定义内容的弹出框</p>
              <ul style="margin: 0; padding-left: 20px">
                <li>支持 HTML 内容</li>
                <li>支持插槽自定义</li>
                <li>可以包含复杂结构</li>
              </ul>
            </div>
          </template>
          <ScButton>自定义内容</ScButton>
        </ScPopover>
        <ScPopover width="250">
          <template #content>
            <div class="custom-content">
              <div
                style="
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  margin-bottom: 8px;
                "
              >
                <IconifyIconOnline
                  icon="ri:information-line"
                  style="font-size: 18px; color: #409eff"
                />
                <strong>提示信息</strong>
              </div>
              <p style="margin: 0; font-size: 14px; color: #606266">
                这是一个带图标的自定义弹出框
              </p>
            </div>
          </template>
          <ScButton>带图标内容</ScButton>
        </ScPopover>
        <ScPopover title="操作按钮" width="200">
          <template #content>
            <div class="custom-content">
              <p style="margin: 0 0 12px 0">确认要执行此操作吗？</p>
              <div style="display: flex; gap: 8px; justify-content: flex-end">
                <ScButton size="small" @click="handleCancel">取消</ScButton>
                <ScButton type="primary" size="small" @click="handleConfirm"
                  >确认</ScButton
                >
              </div>
            </div>
          </template>
          <ScButton type="danger">删除操作</ScButton>
        </ScPopover>
      </div>
    </DemoBlock>

    <DemoBlock title="受控模式" :code="codes.controlled">
      <div class="demo-row">
        <ScPopover
          v-model:visible="visible1"
          title="受控弹出框"
          content="通过 v-model:visible 控制显示/隐藏"
        >
          <ScButton @click="visible1 = !visible1">
            {{ visible1 ? "隐藏" : "显示" }}
          </ScButton>
        </ScPopover>
        <ScPopover
          v-model:visible="visible2"
          title="程序控制"
          content="点击外部按钮控制弹出框"
        >
          <ScButton>弹出框</ScButton>
        </ScPopover>
        <ScButton @click="visible2 = !visible2">
          {{ visible2 ? "关闭弹出框" : "打开弹出框" }}
        </ScButton>
      </div>
    </DemoBlock>

    <DemoBlock title="样式配置" :code="codes.style">
      <div class="demo-row">
        <ScPopover
          title="自定义宽度"
          content="这个弹出框宽度为 300px"
          :width="300"
        >
          <ScButton>宽度 300px</ScButton>
        </ScPopover>
        <ScPopover
          title="无箭头"
          content="这个弹出框没有箭头"
          :show-arrow="false"
        >
          <ScButton>无箭头</ScButton>
        </ScPopover>
        <ScPopover
          title="自定义样式"
          content="这个弹出框有自定义类名"
          popper-class="custom-popover"
        >
          <ScButton>自定义样式</ScButton>
        </ScPopover>
        <ScPopover title="禁用状态" content="这个弹出框已禁用" :disabled="true">
          <ScButton>已禁用</ScButton>
        </ScPopover>
      </div>
    </DemoBlock>

    <DemoBlock title="延迟与自动关闭" :code="codes.timing">
      <div class="demo-row">
        <ScPopover
          title="延迟显示"
          content="延迟 500ms 后显示弹出框"
          :show-after="500"
        >
          <ScButton>延迟显示</ScButton>
        </ScPopover>
        <ScPopover
          title="延迟隐藏"
          content="鼠标离开后延迟 1000ms 隐藏"
          trigger="hover"
          :hide-after="1000"
        >
          <ScButton>延迟隐藏</ScButton>
        </ScPopover>
        <ScPopover title="自动关闭" content="3 秒后自动关闭" :auto-close="3000">
          <ScButton>自动关闭</ScButton>
        </ScPopover>
      </div>
    </DemoBlock>

    <DemoBlock title="不同元素" :code="codes.elements">
      <div class="demo-row">
        <ScPopover title="按钮" content="按钮上的弹出框">
          <ScButton type="primary">按钮</ScButton>
        </ScPopover>
        <ScPopover title="文本" content="文本上的弹出框">
          <span class="demo-text">文本内容</span>
        </ScPopover>
        <ScPopover title="图标" content="图标上的弹出框">
          <IconifyIconOnline icon="ri:question-line" class="demo-icon" />
        </ScPopover>
        <ScPopover title="图片" content="图片上的弹出框">
          <img
            src="https://via.placeholder.com/60"
            alt="示例"
            class="demo-image"
          />
        </ScPopover>
      </div>
    </DemoBlock>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ScPopover } from "@repo/components/ScPopover"
import { ScButton } from "@repo/components/ScButton"
import { ScInput } from "@repo/components/ScInput";
import { ScPopover } from "@repo/components/ScPopover"
import { ScButton } from "@repo/components/ScButton"
import { ScInput } from "@repo/components/ScInput";
import DemoBlock from "./DemoBlock.vue";

const visible1 = ref(false);
const visible2 = ref(false);

const codes = {
  basic: `<ScPopover title="标题" content="这是弹出框的基础内容">
  <ScButton>点击显示</ScButton>
</ScPopover>
<ScPopover content="只有内容，没有标题">
  <ScButton>无标题</ScButton>
</ScPopover>
<ScPopover title="标题" content="这是弹出框的内容">
  <ScButton type="primary">主要按钮</ScButton>
</ScPopover>`,
  placement: `<ScPopover title="顶部" content="弹出框在顶部" placement="top">
  <ScButton>顶部</ScButton>
</ScPopover>
<ScPopover title="底部" content="弹出框在底部" placement="bottom">
  <ScButton>底部</ScButton>
</ScPopover>
<ScPopover title="左侧" content="弹出框在左侧" placement="left">
  <ScButton>左侧</ScButton>
</ScPopover>
<ScPopover title="右侧" content="弹出框在右侧" placement="right">
  <ScButton>右侧</ScButton>
</ScPopover>`,
  trigger: `<ScPopover title="点击触发" content="点击按钮显示弹出框" trigger="click">
  <ScButton>点击触发</ScButton>
</ScPopover>
<ScPopover title="悬停触发" content="鼠标悬停显示弹出框" trigger="hover">
  <ScButton>悬停触发</ScButton>
</ScPopover>
<ScPopover title="聚焦触发" content="聚焦输入框显示弹出框" trigger="focus">
  <ScInput placeholder="聚焦触发" />
</ScPopover>
<ScPopover title="右键触发" content="右键点击显示弹出框" trigger="contextmenu">
  <ScButton>右键触发</ScButton>
</ScPopover>`,
  custom: `<ScPopover title="自定义内容" width="300">
  <template #content>
    <div>
      <p style="margin: 0 0 8px 0;">这是一个自定义内容的弹出框</p>
      <ul style="margin: 0; padding-left: 20px;">
        <li>支持 HTML 内容</li>
        <li>支持插槽自定义</li>
        <li>可以包含复杂结构</li>
      </ul>
    </div>
  </template>
  <ScButton>自定义内容</ScButton>
</ScPopover>`,
  controlled: `<ScPopover
  v-model:visible="visible"
  title="受控弹出框"
  content="通过 v-model:visible 控制显示/隐藏"
>
  <ScButton @click="visible = !visible">
    {{ visible ? "隐藏" : "显示" }}
  </ScButton>
</ScPopover>`,
  style: `<ScPopover title="自定义宽度" content="这个弹出框宽度为 300px" :width="300">
  <ScButton>宽度 300px</ScButton>
</ScPopover>
<ScPopover title="无箭头" content="这个弹出框没有箭头" :show-arrow="false">
  <ScButton>无箭头</ScButton>
</ScPopover>
<ScPopover title="禁用状态" content="这个弹出框已禁用" :disabled="true">
  <ScButton>已禁用</ScButton>
</ScPopover>`,
  timing: `<ScPopover
  title="延迟显示"
  content="延迟 500ms 后显示弹出框"
  :show-after="500"
>
  <ScButton>延迟显示</ScButton>
</ScPopover>
<ScPopover
  title="延迟隐藏"
  content="鼠标离开后延迟 1000ms 隐藏"
  trigger="hover"
  :hide-after="1000"
>
  <ScButton>延迟隐藏</ScButton>
</ScPopover>
<ScPopover
  title="自动关闭"
  content="3 秒后自动关闭"
  :auto-close="3000"
>
  <ScButton>自动关闭</ScButton>
</ScPopover>`,
  elements: `<ScPopover title="按钮" content="按钮上的弹出框">
  <ScButton type="primary">按钮</ScButton>
</ScPopover>
<ScPopover title="文本" content="文本上的弹出框">
  <span>文本内容</span>
</ScPopover>
<ScPopover title="图标" content="图标上的弹出框">
  <IconifyIconOnline icon="ri:question-line" />
</ScPopover>
<ScPopover title="图片" content="图片上的弹出框">
  <img src="https://via.placeholder.com/60" alt="示例" />
</ScPopover>`,
};

const handleCancel = () => {
  console.log("取消操作");
};

const handleConfirm = () => {
  console.log("确认操作");
};
</script>

<style scoped lang="scss">
.sc-popover-example {
  padding: 20px;

  .demo-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    height: 100px;
    align-items: center;
  }

  .custom-content {
    font-size: 14px;
    line-height: 1.5;
  }

  .demo-text {
    padding: 8px 16px;
    background: #f0f0f0;
    border-radius: 4px;
    cursor: pointer;
    user-select: none;
  }

  .demo-icon {
    font-size: 24px;
    color: #6366f1;
    cursor: pointer;
  }

  .demo-image {
    width: 60px;
    height: 60px;
    border-radius: 4px;
    cursor: pointer;
    object-fit: cover;
  }
}

:deep(.custom-popover) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;

  .el-popover__title {
    color: white;
  }
}
</style>

<template>
  <div class="sc-tooltip-example">
    <DemoBlock title="基础用法" :code="codes.basic">
      <div class="demo-row">
        <ScTooltip content="这是顶部提示">
          <ScButton>顶部</ScButton>
        </ScTooltip>
        <ScTooltip content="这是底部提示" placement="bottom">
          <ScButton>底部</ScButton>
        </ScTooltip>
        <ScTooltip content="这是左侧提示" placement="left">
          <ScButton>左侧</ScButton>
        </ScTooltip>
        <ScTooltip content="这是右侧提示" placement="right">
          <ScButton>右侧</ScButton>
        </ScTooltip>
      </div>
    </DemoBlock>

    <DemoBlock title="主题样式" :code="codes.theme">
      <div class="demo-row">
        <ScTooltip content="深色主题提示" effect="dark">
          <ScButton>深色主题</ScButton>
        </ScTooltip>
        <ScTooltip content="浅色主题提示" effect="light">
          <ScButton>浅色主题</ScButton>
        </ScTooltip>
      </div>
    </DemoBlock>

    <DemoBlock title="触发方式" :code="codes.trigger">
      <div class="demo-row">
        <ScTooltip content="鼠标悬停显示" trigger="hover">
          <ScButton>悬停触发</ScButton>
        </ScTooltip>
        <ScTooltip content="点击显示" trigger="click">
          <ScButton>点击触发</ScButton>
        </ScTooltip>
        <ScTooltip content="聚焦显示" trigger="focus">
          <ScInput placeholder="聚焦触发" />
        </ScTooltip>
        <ScTooltip content="右键菜单显示" trigger="contextmenu">
          <ScButton>右键触发</ScButton>
        </ScTooltip>
      </div>
    </DemoBlock>

    <DemoBlock title="自定义内容" :code="codes.custom">
      <div class="demo-row">
        <ScTooltip>
          <template #content>
            <div>
              <strong>自定义内容</strong>
              <p style="margin: 4px 0 0 0; font-size: 12px">支持 HTML 和插槽</p>
            </div>
          </template>
          <ScButton>自定义内容</ScButton>
        </ScTooltip>
        <ScTooltip content="禁用箭头" :show-arrow="false">
          <ScButton>无箭头</ScButton>
        </ScTooltip>
        <ScTooltip content="禁用提示" :disabled="true">
          <ScButton>已禁用</ScButton>
        </ScTooltip>
      </div>
    </DemoBlock>

    <DemoBlock title="延迟显示" :code="codes.delay">
      <div class="demo-row">
        <ScTooltip content="延迟 500ms 显示" :show-after="500">
          <ScButton>延迟显示</ScButton>
        </ScTooltip>
        <ScTooltip content="鼠标离开后延迟隐藏" :hide-after="1000">
          <ScButton>延迟隐藏</ScButton>
        </ScTooltip>
      </div>
    </DemoBlock>

    <DemoBlock title="不同元素" :code="codes.elements">
      <div class="demo-row">
        <ScTooltip content="按钮提示">
          <ScButton type="primary">按钮</ScButton>
        </ScTooltip>
        <ScTooltip content="文本提示">
          <span class="demo-text">文本内容</span>
        </ScTooltip>
        <ScTooltip content="图标提示">
          <IconifyIconOnline icon="ri:information-line" class="demo-icon" />
        </ScTooltip>
        <ScTooltip content="图片提示">
          <img
            src="https://via.placeholder.com/60"
            alt="示例"
            class="demo-image"
          />
        </ScTooltip>
      </div>
    </DemoBlock>
  </div>
</template>

<script setup lang="ts">
import { ScTooltip, ScButton, ScInput } from "@repo/components";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import DemoBlock from "./DemoBlock.vue";

const codes = {
  basic: `<ScTooltip content="这是顶部提示">
  <ScButton>顶部</ScButton>
</ScTooltip>
<ScTooltip content="这是底部提示" placement="bottom">
  <ScButton>底部</ScButton>
</ScTooltip>
<ScTooltip content="这是左侧提示" placement="left">
  <ScButton>左侧</ScButton>
</ScTooltip>
<ScTooltip content="这是右侧提示" placement="right">
  <ScButton>右侧</ScButton>
</ScTooltip>`,
  theme: `<ScTooltip content="深色主题提示" effect="dark">
  <ScButton>深色主题</ScButton>
</ScTooltip>
<ScTooltip content="浅色主题提示" effect="light">
  <ScButton>浅色主题</ScButton>
</ScTooltip>`,
  trigger: `<ScTooltip content="鼠标悬停显示" trigger="hover">
  <ScButton>悬停触发</ScButton>
</ScTooltip>
<ScTooltip content="点击显示" trigger="click">
  <ScButton>点击触发</ScButton>
</ScTooltip>
<ScTooltip content="聚焦显示" trigger="focus">
  <ScInput placeholder="聚焦触发" />
</ScTooltip>
<ScTooltip content="右键菜单显示" trigger="contextmenu">
  <ScButton>右键触发</ScButton>
</ScTooltip>`,
  custom: `<ScTooltip>
  <template #content>
    <div>
      <strong>自定义内容</strong>
      <p style="margin: 4px 0 0 0; font-size: 12px;">支持 HTML 和插槽</p>
    </div>
  </template>
  <ScButton>自定义内容</ScButton>
</ScTooltip>
<ScTooltip content="禁用箭头" :show-arrow="false">
  <ScButton>无箭头</ScButton>
</ScTooltip>
<ScTooltip content="禁用提示" :disabled="true">
  <ScButton>已禁用</ScButton>
</ScTooltip>`,
  delay: `<ScTooltip content="延迟 500ms 显示" :show-after="500">
  <ScButton>延迟显示</ScButton>
</ScTooltip>
<ScTooltip content="鼠标离开后延迟隐藏" :hide-after="1000">
  <ScButton>延迟隐藏</ScButton>
</ScTooltip>`,
  elements: `<ScTooltip content="按钮提示">
  <ScButton type="primary">按钮</ScButton>
</ScTooltip>
<ScTooltip content="文本提示">
  <span>文本内容</span>
</ScTooltip>
<ScTooltip content="图标提示">
  <IconifyIconOnline icon="ri:information-line" />
</ScTooltip>
<ScTooltip content="图片提示">
  <img src="https://via.placeholder.com/60" alt="示例" />
</ScTooltip>`,
};
</script>

<style scoped lang="scss">
.sc-tooltip-example {
  padding: 20px;

  .demo-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
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
</style>

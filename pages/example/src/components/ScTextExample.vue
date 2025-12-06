<!--
 * ScText 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-05
-->
<template>
  <div class="sc-text-demo">
    <!-- 基础用法 -->
    <DemoBlock title="基础用法" :code="codes.basic">
      <div class="demo-row">
        <ScText text="默认文本" />
        <ScText text="主要文本" type="primary" />
        <ScText text="成功文本" type="success" />
        <ScText text="警告文本" type="warning" />
        <ScText text="危险文本" type="danger" />
        <ScText text="信息文本" type="info" />
      </div>
    </DemoBlock>

    <!-- 大小 -->
    <DemoBlock title="文本大小" :code="codes.size">
      <div class="demo-row">
        <ScText text="大号文本" size="large" />
        <ScText text="默认大小" size="default" />
        <ScText text="小号文本" size="small" />
      </div>
    </DemoBlock>

    <!-- 副文本 -->
    <DemoBlock title="副文本" :code="codes.subtext">
      <div class="demo-row">
        <ScText
          text="主标题"
          subtext="副标题在底部"
          subtext-position="bottom"
        />
        <ScText text="主标题" subtext="副标题在右侧" subtext-position="right" />
        <ScText
          text="价格"
          subtext="¥99.00"
          subtext-position="right"
          type="primary"
        />
      </div>
    </DemoBlock>

    <!-- 提示功能 -->
    <DemoBlock title="提示功能" :code="codes.tooltip">
      <div class="demo-row">
        <ScText text="鼠标悬停显示提示" tooltip="这是提示内容" />
        <ScText
          text="这是一段很长的文本内容，超出部分会被截断显示省略号"
          truncated
          :tooltip-only-truncated="true"
          tooltip="完整内容：这是一段很长的文本内容，超出部分会被截断显示省略号"
          style="max-width: 200px"
        />
      </div>
    </DemoBlock>

    <!-- 可编辑 -->
    <DemoBlock title="可编辑" :code="codes.editable">
      <div class="demo-row">
        <ScText
          v-model:text="editableText"
          editable
          edit-placeholder="请输入内容"
          @edit="handleEdit"
        />
        <span class="demo-label">当前值: {{ editableText }}</span>
      </div>
    </DemoBlock>

    <!-- 可复制 -->
    <DemoBlock title="可复制" :code="codes.copyable">
      <div class="demo-row">
        <ScText
          text="点击右侧图标复制这段文字"
          copyable
          copy-success-text="已复制到剪贴板"
        />
        <ScText
          text="自定义复制内容"
          copyable
          copy-text="实际复制的是这段内容"
        />
      </div>
    </DemoBlock>

    <!-- 文本装饰 -->
    <DemoBlock title="文本装饰" :code="codes.decoration">
      <div class="demo-row">
        <ScText text="加粗文本" bold />
        <ScText text="斜体文本" italic />
        <ScText text="下划线文本" underline />
        <ScText text="删除线文本" delete />
        <ScText text="标记/高亮" mark />
        <ScText text="代码样式" code />
        <ScText text="Ctrl+C" keyboard />
      </div>
    </DemoBlock>

    <!-- 特效 -->
    <DemoBlock title="文本特效" :code="codes.effect">
      <div class="demo-row">
        <ScText
          text="渐变文字"
          effect="gradient"
          :gradient-colors="['#667eea', '#764ba2']"
          gradient-direction="to-right"
        />
        <ScText text="打字机效果..." effect="typing" :typing-speed="100" />
        <ScText text="发光效果" effect="glow" type="primary" />
        <ScText text="阴影效果" effect="shadow" />
      </div>
    </DemoBlock>

    <!-- TypeIt 打字机 -->
    <DemoBlock title="TypeIt 打字机效果" :code="codes.typeit">
      <div class="demo-row">
        <ScText
          use-type-it
          :type-it-strings="[
            'Hello World!',
            '你好，世界！',
            'Welcome to ScText!',
          ]"
          :type-it-options="{ speed: 80, loop: true, cursor: true }"
        />
      </div>
    </DemoBlock>

    <!-- 远程调用 -->
    <DemoBlock title="远程调用" :code="codes.fetch">
      <div class="demo-row">
        <ScText
          :fetch-text="fetchRemoteText"
          @fetch-success="handleFetchSuccess"
        />
        <el-button size="small" @click="refreshText">刷新</el-button>
      </div>
    </DemoBlock>

    <!-- 高亮关键词 -->
    <DemoBlock title="高亮关键词" :code="codes.highlight">
      <div class="demo-row">
        <ScText
          text="在这段文本中搜索关键词并高亮显示"
          highlight="关键词"
          highlight-color="#ffc069"
        />
        <ScText
          text="Vue 和 React 都是流行的前端框架"
          :highlight="['Vue', 'React']"
          highlight-color="#95de64"
        />
      </div>
    </DemoBlock>

    <!-- 前后缀 -->
    <DemoBlock title="前后缀" :code="codes.affix">
      <div class="demo-row">
        <ScText text="用户名" prefix-icon="ep:user" />
        <ScText text="100" suffix="元" type="primary" />
        <ScText
          text="邮箱地址"
          prefix-icon="ep:message"
          suffix-icon="ep:check"
          type="success"
        />
      </div>
    </DemoBlock>

    <!-- 链接模式 -->
    <DemoBlock title="链接模式" :code="codes.link">
      <div class="demo-row">
        <ScText
          text="访问官网"
          href="https://element-plus.org"
          target="_blank"
          type="primary"
        />
        <ScText
          text="查看文档"
          href="https://vuejs.org"
          target="_blank"
          prefix-icon="ep:document"
        />
      </div>
    </DemoBlock>

    <!-- 徽章 -->
    <DemoBlock title="徽章" :code="codes.badge">
      <div class="demo-row">
        <ScText text="消息" :badge="99" badge-type="danger" />
        <ScText text="通知" :badge="5" badge-type="primary" />
        <ScText text="在线" badge-dot badge-type="success" />
      </div>
    </DemoBlock>

    <!-- 加载状态 -->
    <DemoBlock title="加载状态" :code="codes.loading">
      <div class="demo-row">
        <ScText loading :loading-width="150" />
        <ScText loading :loading-width="100" />
        <ScText loading :loading-width="80" />
      </div>
    </DemoBlock>

    <!-- 截断 -->
    <DemoBlock title="文本截断" :code="codes.truncate">
      <div
        class="demo-row"
        style="flex-direction: column; align-items: flex-start"
      >
        <div style="width: 300px; margin-bottom: 12px">
          <ScText
            text="这是一段很长的文本内容，当文本超出容器宽度时会自动截断并显示省略号"
            truncated
          />
        </div>
        <div style="width: 300px">
          <ScText
            text="这是一段很长的文本内容，支持多行截断。当文本超出指定行数时会自动截断并显示省略号。这是一段很长的文本内容，支持多行截断。"
            :line-clamp="2"
          />
        </div>
      </div>
    </DemoBlock>

    <!-- 自定义字体 -->
    <DemoBlock title="自定义字体" :code="codes.font">
      <div class="demo-row">
        <ScText text="自定义字体" font-family="Georgia, serif" />
        <ScText text="大字体" :font-size="24" />
        <ScText text="粗体" :font-weight="700" />
        <ScText text="彩色文字" color="#ff6600" />
      </div>
    </DemoBlock>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ScText } from "@repo/components/ScText";
import DemoBlock from "./DemoBlock.vue";

const editableText = ref("点击编辑这段文字");
const textRef = ref();

/**
 * 编辑完成回调
 */
function handleEdit(value: string): void {
  console.log("编辑完成:", value);
}

/**
 * 模拟远程获取文本
 */
async function fetchRemoteText(): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`服务器时间: ${new Date().toLocaleString()}`);
    }, 1000);
  });
}

/**
 * 远程获取成功回调
 */
function handleFetchSuccess(value: string): void {
  console.log("获取成功:", value);
}

/**
 * 刷新文本
 */
function refreshText(): void {
  textRef.value?.refresh();
}

// 代码模板
const codes = {
  basic: `<ScText text="默认文本" />
<ScText text="主要文本" type="primary" />
<ScText text="成功文本" type="success" />
<ScText text="警告文本" type="warning" />
<ScText text="危险文本" type="danger" />
<ScText text="信息文本" type="info" />`,

  size: `<ScText text="大号文本" size="large" />
<ScText text="默认大小" size="default" />
<ScText text="小号文本" size="small" />`,

  subtext: `<ScText text="主标题" subtext="副标题在底部" subtext-position="bottom" />
<ScText text="主标题" subtext="副标题在右侧" subtext-position="right" />
<ScText text="价格" subtext="¥99.00" subtext-position="right" type="primary" />`,

  tooltip: `<ScText text="鼠标悬停显示提示" tooltip="这是提示内容" />
<ScText
  text="这是一段很长的文本内容，超出部分会被截断显示省略号"
  truncated
  :tooltip-only-truncated="true"
  tooltip="完整内容"
  style="max-width: 200px"
/>`,

  editable: `<ScText
  v-model:text="editableText"
  editable
  edit-placeholder="请输入内容"
  @edit="handleEdit"
/>

<script setup>
import { ref } from "vue";
const editableText = ref("点击编辑这段文字");

function handleEdit(value) {
  console.log("编辑完成:", value);
}
<\/script>`,

  copyable: `<ScText
  text="点击右侧图标复制这段文字"
  copyable
  copy-success-text="已复制到剪贴板"
/>
<ScText
  text="自定义复制内容"
  copyable
  copy-text="实际复制的是这段内容"
/>`,

  decoration: `<ScText text="加粗文本" bold />
<ScText text="斜体文本" italic />
<ScText text="下划线文本" underline />
<ScText text="删除线文本" delete />
<ScText text="标记/高亮" mark />
<ScText text="代码样式" code />
<ScText text="Ctrl+C" keyboard />`,

  effect: `<ScText
  text="渐变文字"
  effect="gradient"
  :gradient-colors="['#667eea', '#764ba2']"
  gradient-direction="to-right"
/>
<ScText text="打字机效果..." effect="typing" :typing-speed="100" />
<ScText text="发光效果" effect="glow" type="primary" />
<ScText text="阴影效果" effect="shadow" />`,

  typeit: `<ScText
  use-type-it
  :type-it-strings="[
    'Hello World!',
    '你好，世界！',
    'Welcome to ScText!',
  ]"
  :type-it-options="{ speed: 80, loop: true, cursor: true }"
/>`,

  fetch: `<ScText
  :fetch-text="fetchRemoteText"
  @fetch-success="handleFetchSuccess"
/>

<script setup>
async function fetchRemoteText() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(\`服务器时间: \${new Date().toLocaleString()}\`);
    }, 1000);
  });
}

function handleFetchSuccess(value) {
  console.log("获取成功:", value);
}
<\/script>`,

  highlight: `<ScText
  text="在这段文本中搜索关键词并高亮显示"
  highlight="关键词"
  highlight-color="#ffc069"
/>
<ScText
  text="Vue 和 React 都是流行的前端框架"
  :highlight="['Vue', 'React']"
  highlight-color="#95de64"
/>`,

  affix: `<ScText text="用户名" prefix-icon="ep:user" />
<ScText text="100" suffix="元" type="primary" />
<ScText
  text="邮箱地址"
  prefix-icon="ep:message"
  suffix-icon="ep:check"
  type="success"
/>`,

  link: `<ScText
  text="访问官网"
  href="https://element-plus.org"
  target="_blank"
  type="primary"
/>
<ScText
  text="查看文档"
  href="https://vuejs.org"
  target="_blank"
  prefix-icon="ep:document"
/>`,

  badge: `<ScText text="消息" :badge="99" badge-type="danger" />
<ScText text="通知" :badge="5" badge-type="primary" />
<ScText text="在线" badge-dot badge-type="success" />`,

  loading: `<ScText loading :loading-width="150" />
<ScText loading :loading-width="100" />
<ScText loading :loading-width="80" />`,

  truncate: `<!-- 单行截断 -->
<div style="width: 300px">
  <ScText
    text="这是一段很长的文本内容，当文本超出容器宽度时会自动截断并显示省略号"
    truncated
  />
</div>

<!-- 多行截断 -->
<div style="width: 300px">
  <ScText
    text="这是一段很长的文本内容，支持多行截断。当文本超出指定行数时会自动截断并显示省略号。"
    :line-clamp="2"
  />
</div>`,

  font: `<ScText text="自定义字体" font-family="Georgia, serif" />
<ScText text="大字体" :font-size="24" />
<ScText text="粗体" :font-weight="700" />
<ScText text="彩色文字" color="#ff6600" />`
};
</script>

<style lang="scss" scoped>
.sc-text-demo {
  padding: 20px;

  .demo-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
  }

  .demo-label {
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }
}
</style>

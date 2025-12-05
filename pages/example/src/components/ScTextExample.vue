<!--
 * ScText 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-05
-->
<template>
  <div class="sc-text-demo">
    <!-- 基础用法 -->
    <div class="demo-section">
      <h3 class="section-title">基础用法</h3>
      <div class="demo-row">
        <ScText text="默认文本" />
        <ScText text="主要文本" type="primary" />
        <ScText text="成功文本" type="success" />
        <ScText text="警告文本" type="warning" />
        <ScText text="危险文本" type="danger" />
        <ScText text="信息文本" type="info" />
      </div>
    </div>

    <!-- 大小 -->
    <div class="demo-section">
      <h3 class="section-title">文本大小</h3>
      <div class="demo-row">
        <ScText text="大号文本" size="large" />
        <ScText text="默认大小" size="default" />
        <ScText text="小号文本" size="small" />
      </div>
    </div>

    <!-- 副文本 -->
    <div class="demo-section">
      <h3 class="section-title">副文本</h3>
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
    </div>

    <!-- 提示功能 -->
    <div class="demo-section">
      <h3 class="section-title">提示功能</h3>
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
    </div>

    <!-- 可编辑 -->
    <div class="demo-section">
      <h3 class="section-title">可编辑</h3>
      <div class="demo-row">
        <ScText
          v-model:text="editableText"
          editable
          edit-placeholder="请输入内容"
          @edit="handleEdit"
        />
        <span class="demo-label">当前值: {{ editableText }}</span>
      </div>
    </div>

    <!-- 可复制 -->
    <div class="demo-section">
      <h3 class="section-title">可复制</h3>
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
    </div>

    <!-- 文本装饰 -->
    <div class="demo-section">
      <h3 class="section-title">文本装饰</h3>
      <div class="demo-row">
        <ScText text="加粗文本" bold />
        <ScText text="斜体文本" italic />
        <ScText text="下划线文本" underline />
        <ScText text="删除线文本" delete />
        <ScText text="标记/高亮" mark />
        <ScText text="代码样式" code />
        <ScText text="Ctrl+C" keyboard />
      </div>
    </div>

    <!-- 特效 -->
    <div class="demo-section">
      <h3 class="section-title">文本特效</h3>
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
    </div>

    <!-- TypeIt 打字机 -->
    <div class="demo-section">
      <h3 class="section-title">TypeIt 打字机效果</h3>
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
    </div>

    <!-- 远程调用 -->
    <div class="demo-section">
      <h3 class="section-title">远程调用</h3>
      <div class="demo-row">
        <ScText
          :fetch-text="fetchRemoteText"
          @fetch-success="handleFetchSuccess"
        />
        <el-button size="small" @click="refreshText">刷新</el-button>
      </div>
    </div>

    <!-- 高亮关键词 -->
    <div class="demo-section">
      <h3 class="section-title">高亮关键词</h3>
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
    </div>

    <!-- 前后缀 -->
    <div class="demo-section">
      <h3 class="section-title">前后缀</h3>
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
    </div>

    <!-- 链接模式 -->
    <div class="demo-section">
      <h3 class="section-title">链接模式</h3>
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
    </div>

    <!-- 徽章 -->
    <div class="demo-section">
      <h3 class="section-title">徽章</h3>
      <div class="demo-row">
        <ScText text="消息" :badge="99" badge-type="danger" />
        <ScText text="通知" :badge="5" badge-type="primary" />
        <ScText text="在线" badge-dot badge-type="success" />
      </div>
    </div>

    <!-- 加载状态 -->
    <div class="demo-section">
      <h3 class="section-title">加载状态</h3>
      <div class="demo-row">
        <ScText loading :loading-width="150" />
        <ScText loading :loading-width="100" />
        <ScText loading :loading-width="80" />
      </div>
    </div>

    <!-- 截断 -->
    <div class="demo-section">
      <h3 class="section-title">文本截断</h3>
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
    </div>

    <!-- 自定义字体 -->
    <div class="demo-section">
      <h3 class="section-title">自定义字体</h3>
      <div class="demo-row">
        <ScText text="自定义字体" font-family="Georgia, serif" />
        <ScText text="大字体" :font-size="24" />
        <ScText text="粗体" :font-weight="700" />
        <ScText text="彩色文字" color="#ff6600" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

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
</script>

<style lang="scss" scoped>
.sc-text-demo {
  padding: 20px;

  .demo-section {
    margin-bottom: 32px;
    padding: 20px;
    background: var(--el-bg-color);
    border-radius: 8px;
    border: 1px solid var(--el-border-color-lighter);
  }

  .section-title {
    margin: 0 0 16px;
    padding-bottom: 12px;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

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

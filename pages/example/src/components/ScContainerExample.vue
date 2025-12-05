<template>
  <div class="sc-container-example">
    <!-- 基础面板 -->
    <div class="demo-section">
      <h4>基础面板</h4>
      <div class="demo-row">
        <ScPanel title="基础面板" icon="ep:document" :width="300" :height="200">
          <p>这是一个基础面板，带有标题和图标。</p>
        </ScPanel>

        <ScPanel
          title="无边框"
          icon="ep:setting"
          :width="300"
          :height="200"
          :border="false"
        >
          <p>无边框的面板样式。</p>
        </ScPanel>

        <ScPanel
          title="无阴影"
          icon="ep:info-filled"
          :width="300"
          :height="200"
          :shadow="false"
        >
          <p>无阴影的面板样式。</p>
        </ScPanel>
      </div>
    </div>

    <!-- 面板类型 -->
    <div class="demo-section">
      <h4>面板类型</h4>
      <div class="demo-row">
        <ScPanel title="Primary" type="primary" :width="180" :height="100">
          <p>主要</p>
        </ScPanel>
        <ScPanel title="Success" type="success" :width="180" :height="100">
          <p>成功</p>
        </ScPanel>
        <ScPanel title="Warning" type="warning" :width="180" :height="100">
          <p>警告</p>
        </ScPanel>
        <ScPanel title="Danger" type="danger" :width="180" :height="100">
          <p>危险</p>
        </ScPanel>
        <ScPanel title="Info" type="info" :width="180" :height="100">
          <p>信息</p>
        </ScPanel>
      </div>
    </div>

    <!-- 折叠功能 -->
    <div class="demo-section">
      <h4>折叠功能</h4>
      <div class="demo-row">
        <ScPanel
          v-model:collapsed="collapsed1"
          title="可折叠面板"
          icon="ep:folder"
          collapsible
          :width="350"
        >
          <p>点击左侧箭头可以折叠/展开此面板。</p>
          <p>当前状态：{{ collapsed1 ? "已折叠" : "已展开" }}</p>
        </ScPanel>

        <ScPanel
          title="默认折叠"
          icon="ep:folder-opened"
          collapsible
          :collapsed="true"
          :width="350"
        >
          <p>这个面板默认是折叠状态。</p>
        </ScPanel>
      </div>
    </div>

    <!-- 最大化功能 -->
    <div class="demo-section">
      <h4>最大化功能</h4>
      <div class="demo-row">
        <ScPanel
          v-model:maximized="maximized1"
          title="可最大化面板"
          icon="ep:full-screen"
          maximizable
          :width="400"
          :height="200"
        >
          <p>点击右上角按钮可以最大化此面板。</p>
          <p>当前状态：{{ maximized1 ? "已最大化" : "正常" }}</p>
        </ScPanel>
      </div>
    </div>

    <!-- 拖拽功能 -->
    <div class="demo-section">
      <h4>拖拽功能</h4>
      <div class="demo-drag-container">
        <ScPanel
          title="可拖拽面板"
          icon="ep:rank"
          draggable
          maximizable
          :width="280"
          :height="180"
          :x="30"
          :y="30"
        >
          <p>拖拽头部移动面板</p>
          <p>双击头部最大化</p>
        </ScPanel>

        <ScPanel
          title="拖拽+调整大小"
          icon="ep:resize"
          draggable
          resizable
          :width="280"
          :height="180"
          :x="350"
          :y="30"
          :min-width="200"
          :min-height="150"
        >
          <p>可拖拽移动</p>
          <p>可调整大小</p>
        </ScPanel>
      </div>
    </div>

    <!-- 可调整大小 -->
    <div class="demo-section">
      <h4>可调整大小</h4>
      <div class="demo-row">
        <ScPanel
          title="可调整大小"
          icon="ep:resize"
          resizable
          :width="400"
          :height="220"
          :min-width="300"
          :min-height="150"
          :max-width="600"
          :max-height="400"
        >
          <p>拖拽右侧、底部或右下角调整大小</p>
          <p>最小：300x150，最大：600x400</p>
        </ScPanel>
      </div>
    </div>

    <!-- 组合使用 -->
    <div class="demo-section">
      <h4>组合使用</h4>
      <div class="demo-row">
        <ScPanel
          title="完整功能面板"
          icon="ep:setting"
          type="primary"
          collapsible
          maximizable
          closable
          resizable
          :width="450"
          :height="280"
          :min-width="300"
          :min-height="200"
        >
          <template #actions>
            <el-button size="small" type="primary" link>
              <IconifyIconOnline icon="ep:refresh" />
            </el-button>
          </template>
          <p>这个面板集成了所有功能：</p>
          <ul>
            <li>可折叠</li>
            <li>可最大化</li>
            <li>可关闭</li>
            <li>可调整大小</li>
          </ul>
          <template #footer>
            <el-text type="info" size="small">面板底部区域</el-text>
          </template>
        </ScPanel>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * ScContainer/ScPanel 容器布局示例
 * @author CH
 * @version 2.0.0
 * @since 2025-12-04
 * @since 2025-12-05 更新为 ScPanel 新功能示例
 */
import { ref } from "vue";
import { ScPanel } from "@repo/components/ScContainer";

const collapsed1 = ref(false);
const maximized1 = ref(false);
</script>

<style scoped>
.sc-container-example {
  padding: 20px;
}

.demo-section {
  margin-bottom: 32px;
  padding: 20px;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.demo-section h4 {
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
  align-items: flex-start;
}

.demo-drag-container {
  position: relative;
  height: 300px;
  background: var(--el-fill-color-lighter);
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
}
</style>

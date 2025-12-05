<template>
  <div class="sc-container-example">
    <!-- 基础布局 -->
    <div class="demo-section">
      <h4>基础布局（Header + Aside + Main + Footer）</h4>
      <div class="demo-container">
        <ScContainer :height="400" border rounded>
          <template #header>
            <div class="demo-header">Header 头部区域</div>
          </template>
          <template #aside>
            <div class="demo-aside">Aside 侧边栏</div>
          </template>
          <div class="demo-main">Main 主内容区域</div>
          <template #footer>
            <div class="demo-footer">Footer 底部区域</div>
          </template>
        </ScContainer>
      </div>
    </div>

    <!-- 仅头部和主内容 -->
    <div class="demo-section">
      <h4>仅头部和主内容</h4>
      <div class="demo-container">
        <ScContainer :height="280" border>
          <template #header>
            <div class="demo-header">Header</div>
          </template>
          <div class="demo-main">Main Content Area</div>
        </ScContainer>
      </div>
    </div>

    <!-- 双侧边栏布局 -->
    <div class="demo-section">
      <h4>双侧边栏布局</h4>
      <div class="demo-container">
        <ScContainer
          :height="350"
          border
          shadow
          rounded
          aside-width="180px"
          right-width="180px"
        >
          <template #header>
            <div class="demo-header">Header</div>
          </template>
          <template #aside>
            <div class="demo-aside">Left Aside</div>
          </template>
          <div class="demo-main">Main Content</div>
          <template #right>
            <div class="demo-right">Right Aside</div>
          </template>
          <template #footer>
            <div class="demo-footer">Footer</div>
          </template>
        </ScContainer>
      </div>
    </div>

    <!-- 无头部无底部 -->
    <div class="demo-section">
      <h4>仅侧边栏和主内容</h4>
      <div class="demo-container">
        <ScContainer :height="280" border rounded>
          <template #aside>
            <div class="demo-aside">Aside Menu</div>
          </template>
          <div class="demo-main">Content Area</div>
        </ScContainer>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * ScContainer 布局容器示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-05
 */
import { ScContainer } from "@repo/components/ScContainer";
</script>

<style scoped>
.sc-container-example {
  padding: 20px;
}

.demo-section {
  margin-bottom: 32px;
}

.demo-section h4 {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.demo-container {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
}

.demo-header,
.demo-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 500;
}

.demo-aside,
.demo-right {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
}

.demo-main {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  font-size: 16px;
}
</style>

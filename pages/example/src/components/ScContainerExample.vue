<template>
  <div class="sc-container-example">
    <div class="example-content">
      <!-- 基础示例 -->
      <div class="demo-section">
        <h4>基础布局</h4>
        <p class="demo-desc">
          包含 Header、Aside、Main、Footer 四个区域，支持拖拽调整大小
        </p>
        <div class="demo-container">
          <ScContainer
            :header-height="60"
            :aside-width="200"
            :footer-height="50"
            :resizable="resizable"
            @resize="handleResize"
          >
            <template #header>
              <div class="demo-header">
                <IconifyIconOnline icon="ri:layout-top-line" />
                <span>Header 区域 (拖拽底部边缘调整高度)</span>
              </div>
            </template>
            <template #aside>
              <div class="demo-aside">
                <IconifyIconOnline icon="ri:layout-left-line" />
                <span>Aside 侧边栏</span>
                <p class="aside-tip">拖拽右侧边缘调整宽度</p>
              </div>
            </template>
            <div class="demo-main">
              <IconifyIconOnline
                icon="ri:layout-masonry-line"
                class="main-icon"
              />
              <span>Main 主内容区</span>
              <p class="main-tip">自适应剩余空间</p>
            </div>
            <template #footer>
              <div class="demo-footer">
                <IconifyIconOnline icon="ri:layout-bottom-line" />
                <span>Footer 区域 (拖拽顶部边缘调整高度)</span>
              </div>
            </template>
          </ScContainer>
        </div>
      </div>

      <!-- 无侧边栏示例 -->
      <div class="demo-section">
        <h4>无侧边栏布局</h4>
        <p class="demo-desc">只包含 Header、Main、Footer 的简洁布局</p>
        <div class="demo-container demo-container--small">
          <ScContainer
            :header-height="50"
            :footer-height="40"
            :resizable="resizable"
          >
            <template #header>
              <div class="demo-header demo-header--simple">
                <span>页面标题</span>
              </div>
            </template>
            <div class="demo-main demo-main--simple">
              <p>主要内容区域</p>
            </div>
            <template #footer>
              <div class="demo-footer demo-footer--simple">
                <span>© 2025 版权所有</span>
              </div>
            </template>
          </ScContainer>
        </div>
      </div>

      <!-- 配置面板 -->
      <div class="config-panel">
        <h4>配置选项</h4>
        <el-form label-position="top" size="default">
          <el-form-item label="启用拖拽调整">
            <el-switch v-model="resizable" />
          </el-form-item>

          <el-form-item label="调整事件日志">
            <div class="resize-log">
              <div
                v-for="(log, index) in resizeLogs"
                :key="index"
                class="log-item"
              >
                <el-tag size="small" :type="log.type">{{ log.area }}</el-tag>
                <span>{{ log.size }}px</span>
              </div>
              <div v-if="resizeLogs.length === 0" class="log-empty">
                暂无调整记录，拖拽分隔线试试
              </div>
            </div>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 代码示例 -->
    <CodePreview
      :tabs="[
        {
          key: 'template',
          label: '模板',
          icon: 'ri:code-s-slash-line',
          language: 'vue',
          code: codeExample,
        },
      ]"
      class="mt-4"
    />
  </div>
</template>

<script setup>
/**
 * ScContainer 容器布局示例
 * @author CH
 * @date 2025-12-04
 */
import ScContainer from "@repo/components/ScContainer";
import { ref, computed } from "vue";
import CodePreview from "./CodePreview.vue";

// 配置选项
const resizable = ref(true);
const resizeLogs = ref([]);

// 处理调整事件
const handleResize = (area, size) => {
  const typeMap = {
    header: "primary",
    aside: "success",
    footer: "warning",
  };

  resizeLogs.value.unshift({
    area,
    size: Math.round(size),
    type: typeMap[area] || "info",
  });

  // 只保留最近5条记录
  if (resizeLogs.value.length > 5) {
    resizeLogs.value.pop();
  }
};

// 代码示例
const codeExample = computed(() => {
  return `<template>
  <ScContainer
    :header-height="60"
    :aside-width="200"
    :footer-height="50"
    :resizable="${resizable.value}"
    @resize="handleResize"
  >
    <template #header>
      <div class="header">Header 区域</div>
    </template>
    <template #aside>
      <div class="aside">Aside 侧边栏</div>
    </template>
    <div class="main">Main 主内容区</div>
    <template #footer>
      <div class="footer">Footer 区域</div>
    </template>
  </ScContainer>
</template>

<script setup>
import ScContainer from "@repo/components/ScContainer";

const handleResize = (area, size) => {
  console.log(\`\${area} 调整为 \${size}px\`);
};
<\/script>`;
});
</script>

<style scoped>
.sc-container-example {
  padding: 20px 0;
}

.example-content {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 20px;
}

.demo-section {
  flex: 1;
  min-width: 300px;
}

.demo-section h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.demo-desc {
  margin: 0 0 16px 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.demo-container {
  height: 400px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
}

.demo-container--small {
  height: 250px;
}

.demo-header,
.demo-aside,
.demo-main,
.demo-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.demo-header {
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-9) 0%,
    var(--el-color-primary-light-8) 100%
  );
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.demo-aside {
  flex-direction: column;
  background: var(--el-fill-color-lighter);
  border-right: 1px solid var(--el-border-color-lighter);
}

.aside-tip {
  margin: 8px 0 0;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.demo-main {
  flex-direction: column;
  background: var(--el-bg-color);
}

.main-icon {
  font-size: 32px;
  color: var(--el-color-primary-light-5);
  margin-bottom: 8px;
}

.main-tip {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.demo-footer {
  background: var(--el-fill-color-light);
  border-top: 1px solid var(--el-border-color-lighter);
}

.demo-header--simple,
.demo-footer--simple {
  font-size: 13px;
}

.demo-main--simple {
  font-size: 14px;
}

.config-panel {
  width: 280px;
  flex-shrink: 0;
}

.config-panel h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.resize-log {
  max-height: 200px;
  overflow-y: auto;
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px dashed var(--el-border-color-lighter);
}

.log-item:last-child {
  border-bottom: none;
}

.log-empty {
  text-align: center;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  padding: 16px 0;
}

.mt-4 {
  margin-top: 16px;
}

@media screen and (max-width: 768px) {
  .example-content {
    flex-direction: column;
  }

  .config-panel {
    width: 100%;
  }
}
</style>

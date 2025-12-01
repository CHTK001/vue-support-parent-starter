<template>
  <div class="example-container thin-scroller">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <div class="header-icon">
            <IconifyIconOnline icon="ri:apps-2-line" />
          </div>
          <div class="header-text">
            <h1 class="page-title">组件库示例</h1>
            <p class="page-subtitle">探索丰富的 UI 组件，快速构建现代化应用</p>
          </div>
        </div>
        <div class="header-right">
          <div class="search-wrapper">
            <IconifyIconOnline icon="ri:search-line" class="search-icon" />
            <el-input
              v-model="searchText"
              placeholder="搜索组件..."
              clearable
              class="search-input"
            />
          </div>
          <div class="stats-badge">
            <IconifyIconOnline icon="ri:stack-line" />
            <span>{{ componentList.length }} 个组件</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 组件网格 -->
    <div class="components-grid">
      <TransitionGroup name="card-list">
        <div
          v-for="(item, index) in componentList"
          :key="item.name"
          class="component-card"
          :style="{ '--delay': index * 0.05 + 's' }"
          @click="openComponentExample(item)"
        >
          <!-- 装饰背景 -->
          <div class="card-bg"></div>
          <div class="card-glow"></div>

          <!-- 标签 -->
          <div class="card-badge">
            <IconifyIconOnline icon="ri:code-box-line" />
            <span>组件</span>
          </div>

          <!-- 图标区域 -->
          <div class="card-icon-wrapper">
            <div class="card-icon">
              <IconifyIconOnline :icon="item.icon" />
            </div>
            <div class="icon-ring"></div>
          </div>

          <!-- 内容区域 -->
          <div class="card-content">
            <h3 class="card-title">{{ item.name }}</h3>
            <p class="card-desc">{{ item.description }}</p>
          </div>

          <!-- 底部操作 -->
          <div class="card-footer">
            <span class="view-btn">
              <IconifyIconOnline icon="ri:eye-line" />
              查看示例
            </span>
            <IconifyIconOnline icon="ri:arrow-right-line" class="arrow-icon" />
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- 空状态 -->
    <div v-if="componentList.length === 0" class="empty-state">
      <IconifyIconOnline icon="ri:search-eye-line" class="empty-icon" />
      <h3>未找到匹配的组件</h3>
      <p>尝试使用其他关键词搜索</p>
    </div>

    <!-- 组件详情对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="currentComponent?.name + ' 组件示例'"
      width="90%"
      destroy-on-close
      fullscreen
      class="example-dialog"
    >
      <template #header>
        <div class="dialog-header">
          <div class="dialog-icon">
            <IconifyIconOnline
              :icon="currentComponent?.icon || 'ri:code-box-line'"
            />
          </div>
          <div class="dialog-title-wrapper">
            <h2 class="dialog-title">{{ currentComponent?.name }}</h2>
            <p class="dialog-subtitle">{{ currentComponent?.description }}</p>
          </div>
        </div>
      </template>
      <component
        :is="currentComponent?.component"
        v-if="currentComponent"
      ></component>
    </el-dialog>
  </div>
</template>

<script setup>
import { message } from "@repo/utils";
import { computed, defineAsyncComponent, ref, shallowRef } from "vue";

// 搜索文本
const searchText = ref("");

// 对话框控制
const dialogVisible = ref(false);
const currentComponent = shallowRef(null);

/**
 * 打开组件示例
 * @param {Object} component 组件信息
 */
const openComponentExample = (component) => {
  try {
    // 显示加载中消息
    message("正在加载组件示例...", { type: "info", duration: 1000 });

    // 设置当前组件并显示对话框
    currentComponent.value = component;
    dialogVisible.value = true;

    // 组件加载成功后的处理
    setTimeout(() => {
      if (dialogVisible.value) {
        message(`${component.name} 组件示例加载成功`, {
          type: "success",
          duration: 1500,
        });
      }
    }, 500);
  } catch (error) {
    message(
      `加载 ${component.name} 组件示例失败: ${error.message || "未知错误"}`,
      { type: "error" }
    );
    console.error("组件加载错误:", error);
    // 重置状态
    currentComponent.value = null;
    dialogVisible.value = false;
  }
};

// 定义异步组件加载配置
const asyncComponentOptions = {
  // 加载失败时显示的组件
  errorComponent: {
    template: `
      <div class="error-component">
        <el-alert
          title="组件加载失败"
          type="error"
          description="无法加载组件，请检查组件文件是否存在或者是否有错误"
          show-icon
          :closable="false"
        />
        <div class="error-details" v-if="error">
          <p><strong>错误信息:</strong> {{ error }}</p>
        </div>
      </div>
    `,
    props: ["error"],
  },
  // 加载中显示的组件
  loadingComponent: {
    template: `
      <div class="loading-component">
        <el-skeleton :rows="10" animated />
      </div>
    `,
  },
  // 延迟显示加载组件的时间
  delay: 200,
  // 超时时间
  timeout: 10000,
  // 加载失败时的回调
  onError: (error, retry, fail, attempts) => {
    console.log(console.trace());
    if (attempts <= 3) {
      console.warn(`组件加载失败，正在重试 (${attempts}/3)...`, error);
      retry();
    } else {
      console.error(`组件加载失败，已达到最大重试次数:`, error);
      fail();
    }
  },
};

// 创建异步组件加载函数
const resolveComponent = (path) => {
  return defineAsyncComponent({
    ...asyncComponentOptions,
    loader: () => /* @vite-ignore */ import(path),
  });
};

// 组件列表
const components = [
  {
    name: "ScTable",
    icon: "carbon:table",
    description:
      "表格组件，基于 Element Plus 的表格组件封装，提供了更强大的表格功能",
    component: resolveComponent("./components/ScTableExample.vue"),
  },
  {
    name: "ScDialog",
    icon: "carbon:popup",
    description:
      "对话框组件，基于 Element Plus 的对话框组件封装，提供了更丰富的对话框功能和样式",
    component: resolveComponent("./components/ScDialogExample.vue"),
  },
  {
    name: "ScSwitch",
    icon: "carbon:toggle-switch",
    description: "开关组件，支持多种布局样式，包括默认、卡片和滑块等布局",
    component: resolveComponent("./components/ScSwitchExample.vue"),
  },
  {
    name: "ScCard",
    icon: "ri:card-line",
    description: "卡片组件，支持多种布局样式，包括默认、卡片和滑块等布局",
    component: resolveComponent("./components/ScCardExample.vue"),
  },
  {
    name: "ScInput",
    icon: "carbon:text-input",
    description:
      "输入组件，支持多种输入类型，如文本、文本域、数字、密码、颜色等",
    component: resolveComponent("./components/ScInputExample.vue"),
  },
  {
    name: "ScSelect",
    icon: "carbon:progress-bar",
    description: "选择组件，提供多种加载动画和进度显示，支持自定义布局和样式",
    component: resolveComponent("./components/ScSelectExample.vue"),
  },
  {
    name: "ScTree",
    icon: "carbon:tree-view-alt",
    description:
      "树形控件，基于 Element Plus 的树形组件封装，提供了更便捷的树形数据展示能力",
    component: resolveComponent("./components/ScTreeExample.vue"),
  },

  {
    name: "ScLoading",
    icon: "carbon:progress-bar",
    description: "加载组件，提供多种加载动画和进度显示，支持自定义布局和样式",
    component: resolveComponent("./components/ScLoadExample.vue"),
  },
  {
    name: "ScWorkflow",
    icon: "carbon:progress-bar",
    description: "工作流组件",
    component: resolveComponent("./components/ScWorkflowExample.vue"),
  },
  {
    name: "ScMap",
    icon: "ri:map-pin-range-line",
    description: "地图组件",
    component: resolveComponent("./components/ScMapExample.vue"),
  },
  {
    name: "ScLayer",
    icon: "ri:map-2-line",
    description:
      "基于OpenLayers的地图图层组件，提供测距、标记点、形状绘制等功能",
    component: resolveComponent("./components/ScLayerExample.vue"),
  },
  {
    name: "ScCron",
    icon: "carbon:time",
    description: "Cron表达式组件，提供Cron表达式生成和解析功能，支持可视化配置",
    component: resolveComponent("./components/ScCronExample.vue"),
  },
  {
    name: "ReIcon",
    icon: "carbon:face-satisfied",
    description: "图标组件，提供丰富的图标库和使用方式，支持自定义图标和样式",
    component: resolveComponent("./components/ReIconExample.vue"),
  },
  {
    name: "ScSocketEventProcess",
    icon: "ri:progress-4-line",
    description:
      "Socket事件进度条组件，用于监听Socket事件并显示进度，支持进度条和日志两种布局方式",
    component: resolveComponent("./components/ScSocketEventProcessExample.vue"),
  },
  {
    name: "ScRibbon",
    icon: "ri:bookmark-3-line",
    description:
      "徽带/角标组件，支持 badge、corner、diagonal 和 banner 四种样式，支持图标、尺寸与颜色配置",
    component: resolveComponent("./components/ScRibbonExample.vue"),
  },
  {
    name: "ScMessageDialog",
    icon: "ri:message-3-line",
    description:
      "消息对话框组件，用于显示操作进度、消息通知等，支持拖拽、靠边吸附、Grid吸附等功能",
    component: resolveComponent("./components/ScMessageDialogExample.vue"),
  },
  {
    name: "ScSocketMessageDialog",
    icon: "ri:broadcast-line",
    description:
      "Socket消息对话框组件，用于显示实时Socket消息、进度等，支持多种布局模式和靠边吸附功能",
    component: resolveComponent(
      "./components/ScSocketMessageDialogExample.vue"
    ),
  },
];

// 过滤后的组件列表
const componentList = computed(() => {
  if (!searchText.value) {
    return components;
  }

  const keyword = searchText.value.toLowerCase();
  return components.filter(
    (item) =>
      item.name.toLowerCase().includes(keyword) ||
      item.description.toLowerCase().includes(keyword)
  );
});
</script>

<style scoped lang="scss">
.example-container {
  min-height: 100vh;
  max-height: 100vh;
  overflow-y: auto;
  padding: 32px;
  position: relative;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);

  // 滚动条样式
  scrollbar-width: thin;
  scrollbar-color: var(--el-color-primary, #6366f1) transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-color-primary, #6366f1);
    border-radius: 3px;

    &:hover {
      background: var(--el-color-primary-light-3, #8b5cf6);
    }
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 10% 20%,
        rgba(99, 102, 241, 0.15) 0%,
        transparent 40%
      ),
      radial-gradient(
        circle at 90% 80%,
        rgba(168, 85, 247, 0.12) 0%,
        transparent 40%
      ),
      radial-gradient(
        circle at 50% 50%,
        rgba(59, 130, 246, 0.08) 0%,
        transparent 50%
      );
    pointer-events: none;
  }
}

/* 页面头部 */
.page-header {
  position: relative;
  z-index: 10;
  margin-bottom: 32px;
  padding: 28px 32px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.06),
    0 1px 2px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 16px;
  font-size: 28px;
  color: white;
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.35);
}

.header-text {
  .page-title {
    font-size: 28px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 6px 0;
    letter-spacing: -0.5px;
  }

  .page-subtitle {
    font-size: 15px;
    color: #64748b;
    margin: 0;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-wrapper {
  position: relative;

  .search-icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    font-size: 18px;
    z-index: 1;
  }

  .search-input {
    width: 280px;

    :deep(.el-input__wrapper) {
      padding-left: 44px;
      height: 44px;
      background: rgba(241, 245, 249, 0.8);
      border: 1px solid rgba(226, 232, 240, 0.8);
      border-radius: 12px;
      box-shadow: none;
      transition: all 0.3s ease;

      &:hover,
      &.is-focus {
        background: white;
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
      }
    }
  }
}

.stats-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
}

/* 组件网格 */
.components-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  position: relative;
  z-index: 1;
}

/* 卡片样式 */
.component-card {
  position: relative;
  padding: 24px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  cursor: pointer;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: cardFadeIn 0.5s ease forwards;
  animation-delay: var(--delay);
  opacity: 0;
  transform: translateY(20px);

  &:hover {
    transform: translateY(-8px);
    box-shadow:
      0 20px 40px rgba(0, 0, 0, 0.1),
      0 8px 16px rgba(99, 102, 241, 0.15);
    border-color: rgba(99, 102, 241, 0.3);

    .card-bg {
      opacity: 1;
    }

    .card-glow {
      opacity: 0.6;
    }

    .card-icon {
      transform: scale(1.1) rotate(5deg);
    }

    .icon-ring {
      transform: scale(1.2);
      opacity: 0.5;
    }

    .arrow-icon {
      transform: translateX(4px);
      opacity: 1;
    }

    .view-btn {
      color: #6366f1;
    }
  }
}

@keyframes cardFadeIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(99, 102, 241, 0.05) 0%,
    rgba(168, 85, 247, 0.05) 100%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle,
    rgba(99, 102, 241, 0.15) 0%,
    transparent 50%
  );
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.card-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  font-size: 12px;
  font-weight: 600;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  z-index: 2;
}

.card-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.card-icon {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-radius: 20px;
  font-size: 36px;
  color: #6366f1;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;
}

.icon-ring {
  position: absolute;
  width: 88px;
  height: 88px;
  border: 2px dashed rgba(99, 102, 241, 0.3);
  border-radius: 24px;
  transition: all 0.4s ease;
  opacity: 0;
}

.card-content {
  text-align: center;
  margin-bottom: 16px;
  position: relative;
  z-index: 1;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.card-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid rgba(226, 232, 240, 0.8);
  position: relative;
  z-index: 1;
}

.view-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  transition: color 0.3s ease;
}

.arrow-icon {
  font-size: 18px;
  color: #6366f1;
  opacity: 0;
  transform: translateX(0);
  transition: all 0.3s ease;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;

  .empty-icon {
    font-size: 80px;
    color: #cbd5e1;
    margin-bottom: 24px;
  }

  h3 {
    font-size: 20px;
    font-weight: 600;
    color: #475569;
    margin: 0 0 8px 0;
  }

  p {
    font-size: 14px;
    color: #94a3b8;
    margin: 0;
  }
}

/* 列表动画 */
.card-list-enter-active,
.card-list-leave-active {
  transition: all 0.4s ease;
}

.card-list-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
}

.card-list-leave-to {
  opacity: 0;
  transform: translateY(-30px) scale(0.95);
}

.card-list-move {
  transition: transform 0.4s ease;
}

/* 对话框样式 */
.dialog-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.dialog-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 14px;
  font-size: 24px;
  color: white;
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.3);
}

.dialog-title-wrapper {
  .dialog-title {
    font-size: 20px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 4px 0;
  }

  .dialog-subtitle {
    font-size: 13px;
    color: #64748b;
    margin: 0;
  }
}

:deep(.example-dialog) {
  .el-dialog__header {
    padding: 20px 24px;
    border-bottom: 1px solid #e2e8f0;
    margin-right: 0;
  }

  .el-dialog__body {
    padding: 24px;
    background: #f8fafc;
  }

  .el-dialog__headerbtn {
    top: 20px;
    right: 20px;
    width: 36px;
    height: 36px;

    .el-dialog__close {
      font-size: 18px;
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .example-container {
    padding: 16px;
  }

  .page-header {
    padding: 20px;
  }

  .header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .header-left {
    justify-content: center;
  }

  .header-right {
    flex-direction: column;
  }

  .search-wrapper .search-input {
    width: 100%;
  }

  .stats-badge {
    justify-content: center;
  }

  .components-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .header-icon {
    width: 48px;
    height: 48px;
    font-size: 24px;
  }

  .header-text .page-title {
    font-size: 22px;
  }
}

/* 暗色模式 */
:root.dark {
  .example-container {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);

    &::before {
      background:
        radial-gradient(
          circle at 10% 20%,
          rgba(99, 102, 241, 0.2) 0%,
          transparent 40%
        ),
        radial-gradient(
          circle at 90% 80%,
          rgba(168, 85, 247, 0.15) 0%,
          transparent 40%
        );
    }
  }

  .page-header {
    background: rgba(30, 41, 59, 0.9);
    border-color: rgba(51, 65, 85, 0.5);
  }

  .header-text .page-title {
    color: #f1f5f9;
  }

  .header-text .page-subtitle {
    color: #94a3b8;
  }

  .search-wrapper .search-input :deep(.el-input__wrapper) {
    background: rgba(51, 65, 85, 0.5);
    border-color: rgba(71, 85, 105, 0.5);

    &:hover,
    &.is-focus {
      background: rgba(51, 65, 85, 0.8);
    }
  }

  .component-card {
    background: rgba(30, 41, 59, 0.9);
    border-color: rgba(51, 65, 85, 0.5);
  }

  .card-icon {
    background: linear-gradient(135deg, #334155 0%, #475569 100%);
  }

  .card-title {
    color: #f1f5f9;
  }

  .card-desc {
    color: #94a3b8;
  }

  .card-footer {
    border-top-color: rgba(51, 65, 85, 0.8);
  }
}
</style>

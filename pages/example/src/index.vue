<template>
  <div class="example-container">
    <ScTable layout="card" ref="tableRef" class="h-[600px]" height="600px" :data="componentList" :params="{}" :col-size="3" :row-size="10">
      <template #default="{ row }">
        <div class="component-card" @click="openComponentExample(row)">
          <div class="component-tag">组件</div>
          <div class="component-icon">
            <IconifyIconOnline :icon="row.icon" />
          </div>
          <div class="component-info">
            <h3 class="component-name">{{ row.name }}</h3>
            <p class="component-desc">{{ row.description }}</p>
          </div>
        </div>
      </template>
    </ScTable>

    <el-dialog v-model="dialogVisible" :title="currentComponent?.name + ' 组件示例'" width="80%" destroy-on-close fullscreen>
      <component :is="currentComponent?.component" v-if="currentComponent"></component>
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
        message(`${component.name} 组件示例加载成功`, { type: "success", duration: 1500 });
      }
    }, 500);
  } catch (error) {
    message(`加载 ${component.name} 组件示例失败: ${error.message || "未知错误"}`, { type: "error" });
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
    description: "表格组件，基于 Element Plus 的表格组件封装，提供了更强大的表格功能",
    component: resolveComponent("./components/ScTableExample.vue"),
  },
  {
    name: "ScDialog",
    icon: "carbon:popup",
    description: "对话框组件，基于 Element Plus 的对话框组件封装，提供了更丰富的对话框功能和样式",
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
    description: "输入组件，支持多种输入类型，如文本、文本域、数字、密码、颜色等",
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
    description: "树形控件，基于 Element Plus 的树形组件封装，提供了更便捷的树形数据展示能力",
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
    description: "基于OpenLayers的地图图层组件，提供测距、标记点、形状绘制等功能",
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
    description: "Socket事件进度条组件，用于监听Socket事件并显示进度，支持进度条和日志两种布局方式",
    component: resolveComponent("./components/ScSocketEventProcessExample.vue"),
  },
  {
    name: "ScWindowModal",
    icon: "carbon:application-web",
    description: "窗口模态框组件，支持多窗口管理、拖拽、缩放、最大化、最小化等功能，提供完整的桌面级窗口体验",
    component: resolveComponent("./components/ScWindowModalExample.vue"),
  },
];

// 过滤后的组件列表
const componentList = computed(() => {
  if (!searchText.value) {
    return components;
  }

  const keyword = searchText.value.toLowerCase();
  return components.filter((item) => item.name.toLowerCase().includes(keyword) || item.description.toLowerCase().includes(keyword));
});
</script>

<style scoped>
.example-container {
  min-height: 100vh;
  padding: 24px;
  position: relative;
}

.example-container::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.15) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.example-header {
  margin-bottom: 32px;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.1),
    0 1px 0 rgba(255, 255, 255, 0.5) inset;
  border-radius: 16px;
  position: relative;
  z-index: 1;
}

.example-header::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border-radius: inherit;
  pointer-events: none;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 2;
}

.card-header span {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-box {
  width: 320px;
}

.search-box :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.search-box :deep(.el-input__wrapper:hover) {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(102, 126, 234, 0.3);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.15);
}

.example-description {
  color: #555;
  margin-bottom: 0;
  padding: 16px 20px;
  font-size: 15px;
  line-height: 1.6;
  position: relative;
  z-index: 2;
}

.component-card {
  height: 200px;
  padding: 24px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.1),
    0 1px 0 rgba(255, 255, 255, 0.5) inset;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.component-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.component-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.15),
    0 1px 0 rgba(255, 255, 255, 0.6) inset;
  border-color: rgba(102, 126, 234, 0.3);
}

.component-card:hover::before {
  opacity: 1;
}

.component-card:active {
  transform: translateY(-4px) scale(1.01);
}

.component-icon {
  font-size: 48px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
  position: relative;
  z-index: 2;
}

.component-card:hover .component-icon {
  transform: scale(1.1) rotate(5deg);
  filter: drop-shadow(0 4px 8px rgba(102, 126, 234, 0.3));
}

.component-info {
  text-align: center;
  position: relative;
  z-index: 2;
}

.component-name {
  font-size: 20px;
  margin-bottom: 12px;
  font-weight: 700;
  color: #2c3e50;
  transition: color 0.3s ease;
}

.component-card:hover .component-name {
  color: #667eea;
}

.component-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  transition: color 0.3s ease;
}

.component-card:hover .component-desc {
  color: #555;
}

.component-tag {
  position: absolute;
  top: 12px;
  right: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  z-index: 3;
  transition: all 0.3s ease;
}

.component-card:hover .component-tag {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .example-container {
    padding: 16px;
  }

  .card-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .search-box {
    width: 100%;
  }

  .component-card {
    height: 180px;
    padding: 20px;
  }

  .component-icon {
    font-size: 40px;
    margin-bottom: 16px;
  }

  .component-name {
    font-size: 18px;
  }
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .example-container {
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  }

  .example-header {
    background: rgba(44, 62, 80, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .component-card {
    background: rgba(44, 62, 80, 0.95);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .component-name {
    color: #ecf0f1;
  }

  .component-desc {
    color: #bdc3c7;
  }

  .example-description {
    color: #bdc3c7;
  }
}
</style>

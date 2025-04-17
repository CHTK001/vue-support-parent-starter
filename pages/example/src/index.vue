<template>
  <div class="example-container">
    <el-card class="example-header">
      <template #header>
        <div class="card-header">
          <span>组件示例展示</span>
          <div class="search-box">
            <el-input v-model="searchText" placeholder="搜索组件" clearable>
              <template #prefix>
                <IconifyIconOnline icon="ep:search" />
              </template>
            </el-input>
          </div>
        </div>
      </template>
      <div class="example-description">
        <p>这里展示了系统中所有可用的组件示例，点击卡片查看对应组件的详细用法和示例。每个组件都提供了基础用法、高级用法和API说明。</p>
      </div>
    </el-card>

    <el-card class="example-content">
      <ScTable layout="card" ref="tableRef" :data="componentList" :params="{}" :col-size="3" :row-size="10">
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
    </el-card>

    <el-dialog v-model="dialogVisible" :title="currentComponent?.name + ' 组件示例'" width="80%" destroy-on-close fullscreen>
      <component :is="currentComponent?.component" v-if="currentComponent"></component>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, defineAsyncComponent, shallowRef } from "vue";
import { message } from "@repo/utils";

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
    loader: () => /* @vite-ignore */ import(path)
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
    name: "ScMap",
    icon: "ri:map-pin-range-line",
    description: "地图组件",
    component: resolveComponent("./components/ScMapExample.vue"),
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
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.example-header {
  margin-bottom: 16px;
}

.example-content {
  flex: 1;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span {
  font-size: 18px;
  font-weight: bold;
}

.search-box {
  width: 300px;
}

.example-description {
  color: #666;
  margin-bottom: 8px;
}

.component-card {
  height: 100%;
  padding: 20px;
  border-radius: 12px;
  background-color: var(--el-bg-color);
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  border: 1px solid transparent;
}

.component-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px 0 rgba(0, 0, 0, 0.12);
  border-color: var(--el-color-primary-light-7);
}

.component-card:active {
  transform: translateY(-2px);
  transition: all 0.1s ease;
}

.component-icon {
  font-size: 40px;
  margin-bottom: 16px;
  color: var(--el-color-primary);
  display: flex;
  justify-content: center;
  align-items: center;
}

.component-info {
  text-align: center;
}

.component-name {
  font-size: 18px;
  margin-bottom: 8px;
  font-weight: 600;
}

.component-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.component-tag {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: var(--el-color-primary);
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  opacity: 0.8;
}
</style>

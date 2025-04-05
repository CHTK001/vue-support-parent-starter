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
        <p>这里展示了系统中所有可用的组件示例，点击卡片查看对应组件的详细用法和示例。</p>
      </div>
    </el-card>

    <el-card class="example-content">
      <ScTable layout="card" ref="tableRef" :data="componentList" :params="{}" :col-size="3">
        <template #default="{ row }">
          <div class="component-card" @click="openComponentExample(row)">
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

    <el-dialog v-model="dialogVisible" :title="currentComponent?.name + ' 组件示例'" width="80%" destroy-on-close>
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
    currentComponent.value = component;
    dialogVisible.value = true;
  } catch (error) {
    message("加载组件示例失败", { type: "error" });
    console.error(error);
  }
};

// 组件列表
const components = [
  {
    name: "ScTree",
    icon: "carbon:tree-view-alt",
    description: "树形控件，基于 Element Plus 的树形组件封装，提供了更便捷的树形数据展示能力",
    component: defineAsyncComponent(() => import("./components/ScTreeExample.vue")),
  },
  {
    name: "ScTable",
    icon: "carbon:table",
    description: "表格组件，基于 Element Plus 的表格组件封装，提供了更强大的表格功能",
    component: defineAsyncComponent(() => import("./components/ScTableExample.vue")),
  },
  {
    name: "ScForm",
    icon: "carbon:document",
    description: "表单组件，基于 Element Plus 的表单组件封装，提供了更便捷的表单处理能力",
    component: defineAsyncComponent(() => import("./components/ScFormExample.vue")),
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
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.component-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.15);
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
</style>

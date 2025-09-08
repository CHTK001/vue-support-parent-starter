<template>
  <div class="project-container">
    <el-card class="project-header">
      <template #header>
        <div class="card-header">
          <span>项目管理模块</span>
          <div class="search-box">
            <el-input v-model="searchText" placeholder="搜索功能" clearable>
              <template #prefix>
                <IconifyIconOnline icon="ep:search" />
              </template>
            </el-input>
          </div>
        </div>
      </template>
      <div class="project-description">
        <p>项目管理模块包含项目管理、密钥管理、AI模型管理等核心功能。点击卡片进入对应的功能页面。</p>
      </div>
    </el-card>

    <ScTable layout="card" ref="tableRef" class="h-[600px]" height="600px" :data="moduleList" :params="{}" :col-size="3" :row-size="10">
      <template #default="{ row }">
        <div class="module-card" @click="openModule(row)">
          <div class="module-tag">{{ row.category }}</div>
          <div class="module-icon">
            <IconifyIconOnline :icon="row.icon" />
          </div>
          <div class="module-info">
            <h3 class="module-name">{{ row.name }}</h3>
            <p class="module-desc">{{ row.description }}</p>
          </div>
        </div>
      </template>
    </ScTable>

    <el-dialog v-model="dialogVisible" :title="currentModule?.name" width="90%" destroy-on-close fullscreen>
      <component :is="currentModule?.component" v-if="currentModule"></component>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, ref, shallowRef } from "vue";

// 搜索文本
const searchText = ref("");

// 对话框控制
const dialogVisible = ref(false);
const currentModule = shallowRef(null);

// 模块列表
const modules = [
  {
    name: "项目管理",
    description: "项目信息管理、项目配置、默认设置等",
    icon: "ep:folder",
    category: "管理",
    component: defineAsyncComponent(() => import("./views/project/index.vue")),
  },
  {
    name: "密钥管理",
    description: "系统密钥配置、密钥同步等安全管理",
    icon: "ep:key",
    category: "安全",
    component: defineAsyncComponent(() => import("./views/secret/index.vue")),
  },
  {
    name: "AI模型管理",
    description: "AI模块配置、模型设置、模板管理",
    icon: "ep:cpu",
    category: "AI",
    component: defineAsyncComponent(() => import("./views/ai/module.vue")),
  },
  {
    name: "大语言模型",
    description: "LLM对话、文本生成等功能",
    icon: "ep:chat-dot-round",
    category: "AI",
    component: defineAsyncComponent(() => import("./views/ai/llm-new/index.vue")),
  },
  {
    name: "图像生成",
    description: "Vincent图像生成、模板管理",
    icon: "ep:picture",
    category: "AI",
    component: defineAsyncComponent(() => import("./views/ai/vincent/index.vue")),
  },
  {
    name: "视频生成",
    description: "AI视频生成功能",
    icon: "ep:video-camera",
    category: "AI",
    component: defineAsyncComponent(() => import("./views/ai/video/index.vue")),
  },
  {
    name: "ScSelect测试",
    description: "测试ScSelect组件的shape和dropdown-direction属性",
    icon: "ep:setting",
    category: "测试",
    component: defineAsyncComponent(() => import("./views/test/ScSelectShapeTest.vue")),
  },
];

// 过滤后的模块列表
const moduleList = computed(() => {
  if (!searchText.value) {
    return modules;
  }
  return modules.filter((module) => module.name.includes(searchText.value) || module.description.includes(searchText.value));
});

// 打开模块
const openModule = (module) => {
  currentModule.value = module;
  dialogVisible.value = true;
};
</script>

<style scoped>
.project-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-box {
  width: 300px;
}

.project-description {
  color: #666;
  line-height: 1.6;
}

.module-card {
  position: relative;
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  height: 160px;
  display: flex;
  flex-direction: column;
}

.module-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.module-tag {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #409eff;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.module-icon {
  font-size: 32px;
  color: #409eff;
  margin-bottom: 12px;
}

.module-info {
  flex: 1;
}

.module-name {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.module-desc {
  margin: 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.4;
}
</style>

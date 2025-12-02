<template>
  <div class="example-container">
    <h2 class="example-title">ScPagintion 分页示例</h2>
    <p class="example-desc">分页组件，支持自定义布局、页码跳转等功能</p>

    <el-divider content-position="left">功能演示</el-divider>

    <div class="demo-section">
      <div class="demo-controls">
        <el-button type="primary" @click="goFirst">
          <IconifyIconOnline icon="ri:skip-back-line" class="mr-1" />
          首页
        </el-button>
        <el-button @click="goLast">
          <IconifyIconOnline icon="ri:skip-forward-line" class="mr-1" />
          末页
        </el-button>
      </div>

      <ScPagintion
        :layout="config.layout"
        :total="config.total"
        v-model:currentPage="config.page"
        v-model:pageSize="config.size"
      />

      <div class="page-info">
        当前页：<strong>{{ config.page }}</strong
        >，每页：<strong>{{ config.size }}</strong> 条
      </div>

      <el-divider content-position="left">属性配置</el-divider>

      <el-form label-width="120px" class="config-form">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="总条数">
              <el-input-number
                v-model="config.total"
                :min="1"
                :max="1000"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="每页条数">
              <el-input-number
                v-model="config.size"
                :min="5"
                :max="100"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-divider content-position="left">代码示例</el-divider>

    <CodePreview :tabs="codeTabs" />

    <el-divider content-position="left">属性说明</el-divider>

    <el-table :data="propsData" border stripe class="props-table">
      <el-table-column prop="name" label="属性名" width="180" />
      <el-table-column prop="type" label="类型" width="150" />
      <el-table-column prop="default" label="默认值" width="120" />
      <el-table-column prop="description" label="说明" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from "vue";
import ScPagintion from "@repo/components/ScPagintion/index.vue";
import CodePreview from "./CodePreview.vue";

/**
 * ScPagintion 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */

const config = reactive({
  page: 1,
  size: 10,
  total: 123,
  layout: "prev, pager, next, ->, total",
});

// 属性说明
const propsData = [
  { name: "total", type: "number", default: "0", description: "总条数" },
  {
    name: "currentPage",
    type: "number",
    default: "1",
    description: "当前页码（v-model）",
  },
  {
    name: "pageSize",
    type: "number",
    default: "10",
    description: "每页条数（v-model）",
  },
  {
    name: "layout",
    type: "string",
    default: "'prev, pager, next'",
    description: "分页布局",
  },
];

// 代码示例
const codeTabs = computed(() => [
  {
    key: "template",
    label: "模板",
    icon: "ri:code-s-slash-line",
    language: "vue",
    code: `<ScPagintion
  :total="${config.total}"
  v-model:currentPage="page"
  v-model:pageSize="size"
/>`,
  },
  {
    key: "script",
    label: "脚本",
    icon: "ri:javascript-line",
    language: "ts",
    code: `import { ref } from "vue";
import ScPagintion from "@repo/components/ScPagintion/index.vue";

const page = ref(1);
const size = ref(10);`,
  },
]);

function goFirst() {
  config.page = 1;
}

function goLast() {
  config.page = Math.ceil(config.total / config.size);
}
</script>

<style scoped lang="scss">
.example-container {
  padding: 20px;
}

.example-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
}

.example-desc {
  color: var(--el-text-color-secondary);
  margin-bottom: 20px;
}

.demo-section {
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.demo-controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.page-info {
  margin-top: 16px;
  padding: 12px;
  background: var(--el-bg-color);
  border-radius: 8px;
  color: var(--el-text-color-regular);
}

.config-form {
  margin-top: 16px;
}

.props-table {
  margin-bottom: 20px;
}
</style>

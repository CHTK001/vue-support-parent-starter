<template>
  <div class="example-container">
    <h2 class="example-title">ScSelectFilter 筛选选择器示例</h2>
    <p class="example-desc">筛选选择器组件，支持多选、标签展示等功能</p>

    <el-divider content-position="left">功能演示</el-divider>

    <div class="demo-section">
      <div class="demo-controls">
        <el-button type="primary" @click="selectAll">
          <IconifyIconOnline icon="ri:checkbox-multiple-line" class="mr-1" />
          全选
        </el-button>
        <el-button @click="clearSelection">
          <IconifyIconOnline icon="ri:close-line" class="mr-1" />
          清空
        </el-button>
      </div>

      <ScSelectFilter v-model="config.value" :options="options" />

      <div class="selection-info">
        选择结果：<code>{{
          config.value.length > 0 ? config.value.join(", ") : "(未选择)"
        }}</code>
      </div>
    </div>

    <el-divider content-position="left">代码示例</el-divider>

    <CodePreview :tabs="codeTabs" />

    <el-divider content-position="left">属性说明</el-divider>

    <el-table :data="propsData" border stripe class="props-table">
      <el-table-column prop="name" label="属性名" width="180" />
      <el-table-column prop="type" label="类型" width="200" />
      <el-table-column prop="default" label="默认值" width="120" />
      <el-table-column prop="description" label="说明" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from "vue";
import ScSelectFilter from "@repo/components/ScSelectFilter/index.vue";
import CodePreview from "./CodePreview.vue";

/**
 * ScSelectFilter 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */

const options = [
  { label: "北京", value: "bj" },
  { label: "上海", value: "sh" },
  { label: "广州", value: "gz" },
  { label: "深圳", value: "sz" },
  { label: "杭州", value: "hz" },
];

const config = reactive({
  value: [] as string[],
});

// 属性说明
const propsData = [
  {
    name: "modelValue",
    type: "array",
    default: "[]",
    description: "选中的值数组（v-model）",
  },
  {
    name: "options",
    type: "Array<{label, value}>",
    default: "[]",
    description: "选项列表",
  },
];

// 代码示例
const codeTabs = computed(() => [
  {
    key: "template",
    label: "模板",
    icon: "ri:code-s-slash-line",
    language: "vue",
    code: `<ScSelectFilter v-model="value" :options="options" />`,
  },
  {
    key: "script",
    label: "脚本",
    icon: "ri:javascript-line",
    language: "ts",
    code: `import { ref } from "vue";
import ScSelectFilter from "@repo/components/ScSelectFilter/index.vue";

const value = ref([]);

const options = [
  { label: "北京", value: "bj" },
  { label: "上海", value: "sh" },
  { label: "广州", value: "gz" }
];`,
  },
]);

function selectAll() {
  config.value = options.map((o) => o.value);
}

function clearSelection() {
  config.value = [];
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

.selection-info {
  margin-top: 16px;
  padding: 12px;
  background: var(--el-bg-color);
  border-radius: 8px;
  color: var(--el-text-color-regular);

  code {
    padding: 2px 6px;
    background: var(--el-fill-color);
    border-radius: 4px;
    font-family: monospace;
  }
}

.props-table {
  margin-bottom: 20px;
}
</style>

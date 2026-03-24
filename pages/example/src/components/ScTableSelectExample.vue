<template>
  <div class="example-container">
    <h2 class="example-title">ScTableSelect 表格选择器示例</h2>
    <p class="example-desc">表格选择器组件，支持单选、多选、自定义列等功能</p>

    <ScDivider content-position="left">功能演示</ScDivider>

    <div class="demo-section">
      <div class="demo-controls">
        <ScButton type="primary" @click="addRow">
          <IconifyIconOnline icon="ri:add-line" class="mr-1" />
          添加数据
        </ScButton>
        <ScButton @click="clearSelection">
          <IconifyIconOnline icon="ri:close-line" class="mr-1" />
          清空选择
        </ScButton>
      </div>

      <ScTableSelect
        v-model="config.selected"
        :columns="columns"
        :data="rows"
      />

      <div class="selection-info">
        当前选择：<code>{{
          config.selected.length > 0
            ? JSON.stringify(config.selected)
            : "(未选择)"
        }}</code>
      </div>
    </div>

    <ScDivider content-position="left">代码示例</ScDivider>

    <CodePreview :tabs="codeTabs" />

    <ScDivider content-position="left">属性说明</ScDivider>

    <ScTable :data="propsData" border stripe class="props-table">
      <ScTableColumn prop="name" label="属性名" width="180" />
      <ScTableColumn prop="type" label="类型" width="200" />
      <ScTableColumn prop="default" label="默认值" width="120" />
      <ScTableColumn prop="description" label="说明" />
    </ScTable>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import ScTableSelect from "@repo/components/ScTableSelect/index.vue";
import CodePreview from "./CodePreview.vue";

/**
 * ScTableSelect 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */

const columns = [
  { prop: "id", label: "ID", width: 80 },
  { prop: "name", label: "姓名" },
  { prop: "age", label: "年龄", width: 100 },
];

const rows = ref([
  { id: 1, name: "张三", age: 28 },
  { id: 2, name: "李四", age: 25 },
  { id: 3, name: "王五", age: 30 },
]);

let nextId = 4;

const config = reactive({
  selected: [] as any[],
});

// 属性说明
const propsData = [
  {
    name: "modelValue",
    type: "array",
    default: "[]",
    description: "选中的行数据（v-model）",
  },
  {
    name: "columns",
    type: "Array<{prop, label}>",
    default: "[]",
    description: "列配置",
  },
  { name: "data", type: "array", default: "[]", description: "表格数据" },
];

// 代码示例
const codeTabs = computed(() => [
  {
    key: "template",
    label: "模板",
    icon: "ri:code-s-slash-line",
    language: "vue",
    code: `<ScTableSelect v-model="selected" :columns="columns" :data="rows" />`,
  },
  {
    key: "script",
    label: "脚本",
    icon: "ri:javascript-line",
    language: "ts",
    code: `import { ref } from "vue";
import ScTableSelect from "@repo/components/ScTableSelect/index.vue";

const selected = ref([]);

const columns = [
  { prop: "id", label: "ID", width: 80 },
  { prop: "name", label: "姓名" },
  { prop: "age", label: "年龄", width: 100 }
];

const rows = ref([
  { id: 1, name: "张三", age: 28 },
  { id: 2, name: "李四", age: 25 }
]);`,
  },
]);

function addRow() {
  rows.value.push({
    id: nextId++,
    name: `用户${nextId}`,
    age: Math.floor(Math.random() * 20) + 20,
  });
}

function clearSelection() {
  config.selected = [];
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
  overflow-x: auto;

  code {
    padding: 2px 6px;
    background: var(--el-fill-color);
    border-radius: 4px;
    font-family: monospace;
    word-break: break-all;
  }
}

.props-table {
  margin-bottom: 20px;
}
</style>

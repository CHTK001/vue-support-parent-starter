<template>
  <div class="example-container">
    <h2 class="example-title">ScFormTable 表单表格示例</h2>
    <p class="example-desc">可编辑表格组件，支持拖拽排序、动态增删行等功能</p>

    <el-divider content-position="left">功能演示</el-divider>

    <div class="demo-section">
      <div class="demo-controls">
        <el-button type="primary" @click="addRow">
          <IconifyIconOnline icon="ri:add-line" class="mr-1" />
          添加行
        </el-button>
        <el-button @click="clearRows">
          <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
          清空
        </el-button>
      </div>

      <ScFormTable
        v-model="rows"
        :addTemplate="{ key: '', value: '' }"
        :dragSort="config.dragSort"
        :height="280"
      >
        <el-table-column prop="key" label="键">
          <template #default="{ row }">
            <el-input v-model="row.key" placeholder="键" />
          </template>
        </el-table-column>
        <el-table-column prop="value" label="值">
          <template #default="{ row }">
            <el-input v-model="row.value" placeholder="值" />
          </template>
        </el-table-column>
      </ScFormTable>

      <el-divider content-position="left">属性配置</el-divider>

      <el-form label-width="120px" class="config-form">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="拖拽排序">
              <el-switch v-model="config.dragSort" />
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
import { ref, reactive, computed } from "vue";
import ScFormTable from "@repo/components/ScFormTable/index.vue";
import CodePreview from "./CodePreview.vue";

/**
 * ScFormTable 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */

const rows = ref([{ key: "name", value: "demo" }]);

const config = reactive({
  dragSort: true,
});

// 属性说明
const propsData = [
  {
    name: "modelValue",
    type: "array",
    default: "[]",
    description: "表格数据（v-model）",
  },
  {
    name: "addTemplate",
    type: "object",
    default: "{}",
    description: "新增行的模板数据",
  },
  {
    name: "dragSort",
    type: "boolean",
    default: "false",
    description: "是否启用拖拽排序",
  },
  { name: "height", type: "number", default: "-", description: "表格高度" },
];

// 代码示例
const codeTabs = computed(() => [
  {
    key: "template",
    label: "模板",
    icon: "ri:code-s-slash-line",
    language: "vue",
    code: `<ScFormTable v-model="rows" :addTemplate="{ key: '', value: '' }" :dragSort="${config.dragSort}">
  <el-table-column prop="key" label="键">
    <template #default="{ row }">
      <el-input v-model="row.key" placeholder="键" />
    </template>
  </el-table-column>
  <el-table-column prop="value" label="值">
    <template #default="{ row }">
      <el-input v-model="row.value" placeholder="值" />
    </template>
  </el-table-column>
</ScFormTable>`,
  },
  {
    key: "script",
    label: "脚本",
    icon: "ri:javascript-line",
    language: "ts",
    code: `import { ref } from "vue";
import ScFormTable from "@repo/components/ScFormTable/index.vue";

const rows = ref([{ key: "name", value: "demo" }]);`,
  },
]);

function addRow() {
  rows.value.push({ key: "", value: "" });
}

function clearRows() {
  rows.value = [];
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

.config-form {
  margin-top: 16px;
}

.props-table {
  margin-bottom: 20px;
}
</style>

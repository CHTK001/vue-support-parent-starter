<template>
  <div class="example-container">
    <h2 class="example-title">ScCron Cron表达式示例</h2>
    <p class="example-desc">Cron 表达式编辑器，支持可视化配置和快捷选项</p>

    <el-divider content-position="left">功能演示</el-divider>

    <div class="demo-section">
      <div class="demo-controls">
        <el-button type="primary" @click="resetCron">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          重置
        </el-button>
      </div>

      <el-form label-width="120px" class="config-form">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="当前表达式">
              <el-input v-model="config.cron" readonly />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="快捷项">
              <el-select
                v-model="config.shortcut"
                placeholder="选择快捷表达式"
                @change="applyShortcut"
                style="width: 100%"
              >
                <el-option
                  v-for="it in shortcuts"
                  :key="it.value"
                  :label="it.text"
                  :value="it.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <el-divider content-position="left">Cron 编辑器</el-divider>

      <ScCron v-model="config.cron" :shortcuts="shortcuts" />
    </div>

    <el-divider content-position="left">代码示例</el-divider>

    <CodePreview :tabs="codeTabs" />

    <el-divider content-position="left">属性说明</el-divider>

    <el-table :data="propsData" border stripe class="props-table">
      <el-table-column prop="name" label="属性名" width="180" />
      <el-table-column prop="type" label="类型" width="200" />
      <el-table-column prop="default" label="默认值" width="150" />
      <el-table-column prop="description" label="说明" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from "vue";
import ScCron from "@repo/components/ScCron/index.vue";
import CodePreview from "./CodePreview.vue";

/**
 * ScCron 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */

const shortcuts = [
  { text: "每分钟", value: "0 * * * * ?" },
  { text: "每小时", value: "0 0 * * * ?" },
  { text: "每天零点", value: "0 0 0 * * ?" },
  { text: "每周一零点", value: "0 0 0 ? * MON" },
  { text: "每月1号零点", value: "0 0 0 1 * ?" },
];

const config = reactive({
  cron: "0 0 0 * * ?",
  shortcut: "",
});

// 属性说明
const propsData = [
  {
    name: "modelValue",
    type: "string",
    default: "'0 0 0 * * ?'",
    description: "Cron 表达式（v-model）",
  },
  {
    name: "shortcuts",
    type: "Array<{text, value}>",
    default: "[]",
    description: "快捷选项列表",
  },
];

// 代码示例
const codeTabs = computed(() => [
  {
    key: "template",
    label: "模板",
    icon: "ri:code-s-slash-line",
    language: "vue",
    code: `<ScCron v-model="cron" :shortcuts="shortcuts" />`,
  },
  {
    key: "script",
    label: "脚本",
    icon: "ri:javascript-line",
    language: "ts",
    code: `import { ref } from "vue";
import ScCron from "@repo/components/ScCron/index.vue";

const cron = ref("${config.cron}");

const shortcuts = [
  { text: "每分钟", value: "0 * * * * ?" },
  { text: "每小时", value: "0 0 * * * ?" },
  { text: "每天零点", value: "0 0 0 * * ?" }
];`,
  },
]);

function applyShortcut(v: string) {
  config.cron = v;
}

function resetCron() {
  config.cron = "0 0 0 * * ?";
  config.shortcut = "";
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

<template>
  <div class="example-container">
    <h2 class="example-title">ScPromQL PromQL编辑器示例</h2>
    <p class="example-desc">
      PromQL 表达式编辑器，用于 Prometheus 查询语句编辑
    </p>

    <el-divider content-position="left">功能演示</el-divider>

    <div class="demo-section">
      <div class="demo-controls">
        <el-button type="primary" @click="setExample('up')">
          <IconifyIconOnline icon="ri:pulse-line" class="mr-1" />
          服务状态
        </el-button>
        <el-button @click="setExample('cpu')">
          <IconifyIconOnline icon="ri:cpu-line" class="mr-1" />
          CPU使用率
        </el-button>
        <el-button @click="setExample('memory')">
          <IconifyIconOnline icon="ri:database-2-line" class="mr-1" />
          内存使用
        </el-button>
      </div>

      <ScPromQL v-model="config.expr" />

      <div class="expr-info">
        当前表达式：<code>{{ config.expr }}</code>
      </div>
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
import ScPromQL from "@repo/components/ScPromQL/index.vue";
import CodePreview from "./CodePreview.vue";

/**
 * ScPromQL 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */

const config = reactive({
  expr: "up{job='node'}",
});

// 属性说明
const propsData = [
  {
    name: "modelValue",
    type: "string",
    default: "''",
    description: "PromQL 表达式（v-model）",
  },
  {
    name: "placeholder",
    type: "string",
    default: "'输入 PromQL'",
    description: "占位文本",
  },
];

// 代码示例
const codeTabs = computed(() => [
  {
    key: "template",
    label: "模板",
    icon: "ri:code-s-slash-line",
    language: "vue",
    code: `<ScPromQL v-model="expr" />`,
  },
  {
    key: "script",
    label: "脚本",
    icon: "ri:javascript-line",
    language: "ts",
    code: `import { ref } from "vue";
import ScPromQL from "@repo/components/ScPromQL/index.vue";

const expr = ref("${config.expr}");`,
  },
]);

function setExample(type: string) {
  const examples: Record<string, string> = {
    up: "up{job='node'}",
    cpu: "100 - (avg by(instance) (rate(node_cpu_seconds_total{mode='idle'}[5m])) * 100)",
    memory: "node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes",
  };
  config.expr = examples[type] || "";
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

.expr-info {
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

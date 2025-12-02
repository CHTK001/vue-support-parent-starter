<template>
  <div class="example-container">
    <h2 class="example-title">ScRegion 地区选择器示例</h2>
    <p class="example-desc">省市区三级联动选择器组件</p>

    <el-divider content-position="left">功能演示</el-divider>

    <div class="demo-section">
      <div class="demo-controls">
        <el-button type="primary" @click="setBeijing">
          <IconifyIconOnline icon="ri:map-pin-line" class="mr-1" />
          设置北京
        </el-button>
        <el-button @click="clearRegion">
          <IconifyIconOnline icon="ri:close-line" class="mr-1" />
          清空
        </el-button>
      </div>

      <ScRegion v-model="config.region" />

      <div class="region-info">
        选择结果：<code>{{ config.region || "(未选择)" }}</code>
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
import ScRegion from "@repo/components/ScRegion/src/index.vue";
import CodePreview from "./CodePreview.vue";

/**
 * ScRegion 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */

const config = reactive({
  region: "",
});

// 属性说明
const propsData = [
  {
    name: "modelValue",
    type: "string",
    default: "''",
    description: "选中的地区编码（v-model）",
  },
  {
    name: "level",
    type: "number",
    default: "3",
    description: "选择层级（1省、2市、3区）",
  },
  {
    name: "placeholder",
    type: "string",
    default: "'请选择'",
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
    code: `<ScRegion v-model="region" />`,
  },
  {
    key: "script",
    label: "脚本",
    icon: "ri:javascript-line",
    language: "ts",
    code: `import { ref } from "vue";
import ScRegion from "@repo/components/ScRegion/src/index.vue";

const region = ref("");`,
  },
]);

function setBeijing() {
  config.region = "110000";
}

function clearRegion() {
  config.region = "";
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

.region-info {
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

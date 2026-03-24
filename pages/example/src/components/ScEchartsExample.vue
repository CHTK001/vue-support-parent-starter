<template>
  <div class="example-container">
    <h2 class="example-title">ScEcharts 图表示例</h2>
    <p class="example-desc">
      基于 ECharts 的图表组件，支持多种图表类型和自适应大小
    </p>

    <ScDivider content-position="left">功能演示</ScDivider>

    <div class="demo-section">
      <div class="demo-controls">
        <ScButton type="primary" @click="changeChartType('line')">
          <IconifyIconOnline icon="ri:line-chart-line" class="mr-1" />
          折线图
        </ScButton>
        <ScButton @click="changeChartType('bar')">
          <IconifyIconOnline icon="ri:bar-chart-line" class="mr-1" />
          柱状图
        </ScButton>
        <ScButton @click="refreshData">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新数据
        </ScButton>
      </div>

      <ScEcharts :option="chartOption" :height="config.height" />

      <ScDivider content-position="left">属性配置</ScDivider>

      <ScForm label-width="120px" class="config-form">
        <ScRow :gutter="20">
          <ScCol :span="8">
            <ScFormItem label="图表高度">
              <ScInput v-model="config.height" placeholder="如 360px" />
            </ScFormItem>
          </ScCol>
          <ScCol :span="8">
            <ScFormItem label="图表类型">
              <ScSelect v-model="config.type" style="width: 100%">
                <ScOption label="折线图" value="line" />
                <ScOption label="柱状图" value="bar" />
              </ScSelect>
            </ScFormItem>
          </ScCol>
        </ScRow>
      </ScForm>
    </div>

    <ScDivider content-position="left">代码示例</ScDivider>

    <CodePreview :tabs="codeTabs" />

    <ScDivider content-position="left">属性说明</ScDivider>

    <ScTable :data="propsData" border stripe class="props-table">
      <ScTableColumn prop="name" label="属性名" width="180" />
      <ScTableColumn prop="type" label="类型" width="150" />
      <ScTableColumn prop="default" label="默认值" width="120" />
      <ScTableColumn prop="description" label="说明" />
    </ScTable>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from "vue";
import ScEcharts from "@repo/components/ScEcharts/index.vue";
import CodePreview from "./CodePreview.vue";

/**
 * ScEcharts 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */

const config = reactive({
  height: "360px",
  type: "line" as "line" | "bar",
  data: [150, 230, 224, 218, 135, 147, 260],
});

const chartOption = computed(() => ({
  xAxis: {
    type: "category",
    data: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
  },
  yAxis: { type: "value" },
  series: [{ data: config.data, type: config.type, smooth: true }],
  tooltip: { trigger: "axis" },
}));

// 属性说明
const propsData = [
  {
    name: "option",
    type: "object",
    default: "{}",
    description: "ECharts 配置项",
  },
  {
    name: "height",
    type: "string",
    default: "'400px'",
    description: "图表高度",
  },
  { name: "width", type: "string", default: "'100%'", description: "图表宽度" },
  {
    name: "autoResize",
    type: "boolean",
    default: "true",
    description: "是否自动调整大小",
  },
];

// 代码示例
const codeTabs = computed(() => [
  {
    key: "template",
    label: "模板",
    icon: "ri:code-s-slash-line",
    language: "vue",
    code: `<ScEcharts :option="chartOption" height="${config.height}" />`,
  },
  {
    key: "script",
    label: "脚本",
    icon: "ri:javascript-line",
    language: "ts",
    code: `import ScEcharts from "@repo/components/ScEcharts/index.vue";

const chartOption = {
  xAxis: { type: "category", data: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"] },
  yAxis: { type: "value" },
  series: [{ data: [150, 230, 224, 218, 135, 147, 260], type: "${config.type}" }],
  tooltip: { trigger: "axis" }
};`,
  },
]);

function changeChartType(type: "line" | "bar") {
  config.type = type;
}

function refreshData() {
  config.data = Array.from(
    { length: 7 },
    () => Math.floor(Math.random() * 300) + 50
  );
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

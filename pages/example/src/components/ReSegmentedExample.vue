<template>
  <div class="example-container">
    <h2 class="example-title">ReSegmented 分段控制器示例</h2>
    <p class="example-desc">分段控制器组件，支持图标、多种尺寸等功能</p>

    <ScDivider content-position="left">功能演示</ScDivider>

    <div class="demo-section">
      <ReSegmented
        v-model="config.index"
        :options="options"
        :size="config.size"
      />

      <div class="segment-info">
        当前选择：<strong>{{ options[config.index]?.label }}</strong
        >（索引：{{ config.index }}）
      </div>

      <ScDivider content-position="left">属性配置</ScDivider>

      <ScForm label-width="120px" class="config-form">
        <ScRow :gutter="20">
          <ScCol :span="8">
            <ScFormItem label="尺寸">
              <ScSelect v-model="config.size" style="width: 100%">
                <ScOption label="小" value="small" />
                <ScOption label="默认" value="default" />
                <ScOption label="大" value="large" />
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
      <ScTableColumn prop="type" label="类型" width="200" />
      <ScTableColumn prop="default" label="默认值" width="120" />
      <ScTableColumn prop="description" label="说明" />
    </ScTable>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from "vue";
import ReSegmented from "@repo/components/ReSegmented/src/index.tsx";
import CodePreview from "./CodePreview.vue";

/**
 * ReSegmented 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */

const options = [
  { label: "表格", icon: "ep:grid" },
  { label: "列表", icon: "ep:list" },
  { label: "卡片", icon: "ep:menu" },
];

const config = reactive({
  index: 0,
  size: "default" as "small" | "default" | "large",
});

// 属性说明
const propsData = [
  {
    name: "modelValue",
    type: "number",
    default: "0",
    description: "选中项索引（v-model）",
  },
  {
    name: "options",
    type: "Array<{label, icon}>",
    default: "[]",
    description: "选项列表",
  },
  {
    name: "size",
    type: "string",
    default: "'default'",
    description: "尺寸（small/default/large）",
  },
];

// 代码示例
const codeTabs = computed(() => [
  {
    key: "template",
    label: "模板",
    icon: "ri:code-s-slash-line",
    language: "vue",
    code: `<ReSegmented v-model="index" :options="options" size="${config.size}" />`,
  },
  {
    key: "script",
    label: "脚本",
    icon: "ri:javascript-line",
    language: "ts",
    code: `import { ref } from "vue";
import ReSegmented from "@repo/components/ReSegmented/src/index.tsx";

const index = ref(0);

const options = [
  { label: "表格", icon: "ep:grid" },
  { label: "列表", icon: "ep:list" },
  { label: "卡片", icon: "ep:menu" }
];`,
  },
]);
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

.segment-info {
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

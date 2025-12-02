<template>
  <div class="example-container">
    <h2 class="example-title">ReSplitPane 分割面板示例</h2>
    <p class="example-desc">可拖拽分割面板组件，支持水平和垂直分割</p>

    <el-divider content-position="left">功能演示</el-divider>

    <div class="demo-section">
      <div class="split-wrapper">
        <ReSplitPane :splitSet="splitConfig">
          <template #paneL>
            <div class="pane-content pane-left">
              <IconifyIconOnline icon="ri:layout-left-line" class="pane-icon" />
              <span>左侧面板</span>
            </div>
          </template>
          <template #paneR>
            <div class="pane-content pane-right">
              <IconifyIconOnline
                icon="ri:layout-right-line"
                class="pane-icon"
              />
              <span>右侧面板</span>
            </div>
          </template>
        </ReSplitPane>
      </div>

      <el-divider content-position="left">属性配置</el-divider>

      <el-form label-width="120px" class="config-form">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="分割方向">
              <el-select v-model="config.split" style="width: 100%">
                <el-option label="垂直" value="vertical" />
                <el-option label="水平" value="horizontal" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="默认比例">
              <el-input-number
                v-model="config.defaultPercent"
                :min="10"
                :max="90"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="最小比例">
              <el-input-number
                v-model="config.minPercent"
                :min="5"
                :max="50"
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
      <el-table-column prop="name" label="属性名" width="200" />
      <el-table-column prop="type" label="类型" width="150" />
      <el-table-column prop="default" label="默认值" width="120" />
      <el-table-column prop="description" label="说明" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from "vue";
import ReSplitPane from "@repo/components/ReSplitPane/index.tsx";
import CodePreview from "./CodePreview.vue";

/**
 * ReSplitPane 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */

const config = reactive({
  split: "vertical" as "vertical" | "horizontal",
  defaultPercent: 40,
  minPercent: 10,
});

const splitConfig = computed(() => ({
  split: config.split,
  defaultPercent: config.defaultPercent,
  minPercent: config.minPercent,
}));

// 属性说明
const propsData = [
  {
    name: "splitSet.split",
    type: "string",
    default: "'vertical'",
    description: "分割方向（vertical/horizontal）",
  },
  {
    name: "splitSet.defaultPercent",
    type: "number",
    default: "50",
    description: "默认分割比例",
  },
  {
    name: "splitSet.minPercent",
    type: "number",
    default: "10",
    description: "最小分割比例",
  },
];

// 代码示例
const codeTabs = computed(() => [
  {
    key: "template",
    label: "模板",
    icon: "ri:code-s-slash-line",
    language: "vue",
    code: `<ReSplitPane :splitSet="{ split: '${config.split}', defaultPercent: ${config.defaultPercent}, minPercent: ${config.minPercent} }">
  <template #paneL>左侧内容</template>
  <template #paneR>右侧内容</template>
</ReSplitPane>`,
  },
  {
    key: "script",
    label: "脚本",
    icon: "ri:javascript-line",
    language: "ts",
    code: `import ReSplitPane from "@repo/components/ReSplitPane/index.tsx";`,
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

.split-wrapper {
  height: 300px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
}

.pane-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;
}

.pane-left {
  background: var(--el-color-primary-light-9);
}

.pane-right {
  background: var(--el-bg-color);
}

.pane-icon {
  font-size: 32px;
  color: var(--el-color-primary);
}

.config-form {
  margin-top: 16px;
}

.props-table {
  margin-bottom: 20px;
}
</style>

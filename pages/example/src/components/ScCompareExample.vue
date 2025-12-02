<template>
  <div class="example-container">
    <h2 class="example-title">ScCompare 图片对比示例</h2>
    <p class="example-desc">用于对比两张图片，支持滑动对比、左右标签等功能</p>

    <el-divider content-position="left">功能演示</el-divider>

    <div class="demo-section">
      <div class="demo-controls">
        <el-button type="primary" @click="swapImages">
          <IconifyIconOnline icon="ri:swap-line" class="mr-1" />
          交换图片
        </el-button>
        <el-button @click="resetImages">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          重置
        </el-button>
      </div>

      <ScCompare
        :leftImage="config.leftImage"
        :rightImage="config.rightImage"
        :leftImageLabel="config.leftLabel"
        :rightImageLabel="config.rightLabel"
      />

      <el-divider content-position="left">属性配置</el-divider>

      <el-form label-width="120px" class="config-form">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="左侧标签">
              <el-input v-model="config.leftLabel" placeholder="左侧图片标签" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="右侧标签">
              <el-input
                v-model="config.rightLabel"
                placeholder="右侧图片标签"
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
import ScCompare from "@repo/components/ScCompare/index.vue";
import CodePreview from "./CodePreview.vue";

/**
 * ScCompare 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */

const defaultLeft =
  "https://via.placeholder.com/600x300/3b82f6/ffffff?text=Before";
const defaultRight =
  "https://via.placeholder.com/600x300/10b981/ffffff?text=After";

const config = reactive({
  leftImage: defaultLeft,
  rightImage: defaultRight,
  leftLabel: "原图",
  rightLabel: "处理后",
});

// 属性说明
const propsData = [
  {
    name: "leftImage",
    type: "string",
    default: "-",
    description: "左侧图片地址",
  },
  {
    name: "rightImage",
    type: "string",
    default: "-",
    description: "右侧图片地址",
  },
  {
    name: "leftImageLabel",
    type: "string",
    default: "''",
    description: "左侧图片标签",
  },
  {
    name: "rightImageLabel",
    type: "string",
    default: "''",
    description: "右侧图片标签",
  },
];

// 代码示例
const codeTabs = computed(() => [
  {
    key: "template",
    label: "模板",
    icon: "ri:code-s-slash-line",
    language: "vue",
    code: `<ScCompare
  :leftImage="leftImage"
  :rightImage="rightImage"
  leftImageLabel="${config.leftLabel}"
  rightImageLabel="${config.rightLabel}"
/>`,
  },
  {
    key: "script",
    label: "脚本",
    icon: "ri:javascript-line",
    language: "ts",
    code: `import ScCompare from "@repo/components/ScCompare/index.vue";

const leftImage = "${config.leftImage}";
const rightImage = "${config.rightImage}";`,
  },
]);

function swapImages() {
  const temp = config.leftImage;
  config.leftImage = config.rightImage;
  config.rightImage = temp;
}

function resetImages() {
  config.leftImage = defaultLeft;
  config.rightImage = defaultRight;
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

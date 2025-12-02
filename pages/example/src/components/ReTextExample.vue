<template>
  <div class="example-container">
    <h2 class="example-title">ReText 文本省略示例</h2>
    <p class="example-desc">文本省略组件，支持多行省略、悬浮提示等功能</p>

    <el-divider content-position="left">功能演示</el-divider>

    <div class="demo-section">
      <div class="text-wrapper">
        <ReText :lineClamp="config.lineClamp">
          {{ config.text }}
        </ReText>
      </div>

      <el-divider content-position="left">属性配置</el-divider>

      <el-form label-width="120px" class="config-form">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="省略行数">
              <el-input-number
                v-model="config.lineClamp"
                :min="1"
                :max="10"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="16">
            <el-form-item label="文本内容">
              <el-input v-model="config.text" type="textarea" :rows="2" />
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
import ReText from "@repo/components/ReText/src/index.vue";
import CodePreview from "./CodePreview.vue";

/**
 * ReText 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */

const config = reactive({
  lineClamp: 2,
  text: "这是一段很长很长的文本，用于演示多行省略显示效果。鼠标悬停将通过 tippy 显示完整内容。这个组件非常适合用于列表项、卡片描述等需要限制文本行数的场景。",
});

// 属性说明
const propsData = [
  {
    name: "lineClamp",
    type: "number",
    default: "1",
    description: "最大显示行数",
  },
  {
    name: "showTooltip",
    type: "boolean",
    default: "true",
    description: "是否显示悬浮提示",
  },
];

// 代码示例
const codeTabs = computed(() => [
  {
    key: "template",
    label: "模板",
    icon: "ri:code-s-slash-line",
    language: "vue",
    code: `<ReText :lineClamp="${config.lineClamp}">
  长文本内容...
</ReText>`,
  },
  {
    key: "script",
    label: "脚本",
    icon: "ri:javascript-line",
    language: "ts",
    code: `import ReText from "@repo/components/ReText/src/index.vue";`,
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

.text-wrapper {
  max-width: 400px;
  padding: 16px;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.config-form {
  margin-top: 16px;
}

.props-table {
  margin-bottom: 20px;
}
</style>

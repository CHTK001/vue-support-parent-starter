<template>
  <div class="example-container">
    <h2 class="example-title">ScPanel 面板示例</h2>
    <p class="example-desc">通用面板组件，支持标题、图标、折叠等功能</p>

    <el-divider content-position="left">功能演示</el-divider>

    <div class="demo-section">
      <ScPanel
        :title="config.title"
        :icon="config.icon"
        :collapsible="config.collapsible"
      >
        <template #default>
          <p>这是面板的内容区域，可以放置任意内容。</p>
          <p>支持自定义标题、图标和折叠功能。</p>
        </template>
      </ScPanel>

      <el-divider content-position="left">属性配置</el-divider>

      <el-form label-width="120px" class="config-form">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="标题">
              <el-input v-model="config.title" placeholder="面板标题" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="图标">
              <el-input v-model="config.icon" placeholder="如 ep:document" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="可折叠">
              <el-switch v-model="config.collapsible" />
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
import ScPanel from "@repo/components/ScPanel/index.vue";
import CodePreview from "./CodePreview.vue";

/**
 * ScPanel 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */

const config = reactive({
  title: "面板标题",
  icon: "",
  collapsible: false,
});

// 属性说明
const propsData = [
  { name: "title", type: "string", default: "''", description: "面板标题" },
  { name: "icon", type: "string", default: "''", description: "标题图标" },
  {
    name: "collapsible",
    type: "boolean",
    default: "false",
    description: "是否可折叠",
  },
];

// 代码示例
const codeTabs = computed(() => [
  {
    key: "template",
    label: "模板",
    icon: "ri:code-s-slash-line",
    language: "vue",
    code: `<ScPanel title="${config.title}"${config.collapsible ? " collapsible" : ""}>
  <template #default>
    面板内容区
  </template>
</ScPanel>`,
  },
  {
    key: "script",
    label: "脚本",
    icon: "ri:javascript-line",
    language: "ts",
    code: `import ScPanel from "@repo/components/ScPanel/index.vue";`,
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

.config-form {
  margin-top: 16px;
}

.props-table {
  margin-bottom: 20px;
}
</style>

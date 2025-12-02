<template>
  <div class="example-container">
    <h2 class="example-title">ScElFormItem 表单项示例</h2>
    <p class="example-desc">增强型表单项组件，支持提示信息、必填标记等功能</p>

    <el-divider content-position="left">功能演示</el-divider>

    <div class="demo-section">
      <el-form label-width="120px">
        <ScElFormItem
          :label="config.label"
          :tips="config.tips"
          :required="config.required"
        >
          <el-input v-model="config.value" placeholder="请输入内容" />
        </ScElFormItem>
      </el-form>

      <el-divider content-position="left">属性配置</el-divider>

      <el-form label-width="120px" class="config-form">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="标签文本">
              <el-input v-model="config.label" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="提示信息">
              <el-input v-model="config.tips" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="必填">
              <el-switch v-model="config.required" />
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
import ScElFormItem from "@repo/components/ScElFormItem/index.vue";
import CodePreview from "./CodePreview.vue";

/**
 * ScElFormItem 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */

const config = reactive({
  label: "用户名",
  tips: "请输入系统登录用户名",
  required: false,
  value: "",
});

// 属性说明
const propsData = [
  { name: "label", type: "string", default: "''", description: "标签文本" },
  { name: "tips", type: "string", default: "''", description: "提示信息" },
  {
    name: "required",
    type: "boolean",
    default: "false",
    description: "是否必填",
  },
];

// 代码示例
const codeTabs = computed(() => [
  {
    key: "template",
    label: "模板",
    icon: "ri:code-s-slash-line",
    language: "vue",
    code: `<el-form label-width="120px">
  <ScElFormItem label="${config.label}" tips="${config.tips}"${config.required ? " required" : ""}>
    <el-input v-model="value" />
  </ScElFormItem>
</el-form>`,
  },
  {
    key: "script",
    label: "脚本",
    icon: "ri:javascript-line",
    language: "ts",
    code: `import { ref } from "vue";
import ScElFormItem from "@repo/components/ScElFormItem/index.vue";

const value = ref("");`,
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

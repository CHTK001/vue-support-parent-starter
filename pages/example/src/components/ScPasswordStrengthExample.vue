<template>
  <div class="example-container">
    <h2 class="example-title">ScPasswordStrength 密码强度示例</h2>
    <p class="example-desc">密码输入组件，带有密码强度指示器</p>

    <el-divider content-position="left">功能演示</el-divider>

    <div class="demo-section">
      <div class="demo-controls">
        <el-button type="primary" @click="generatePassword">
          <IconifyIconOnline icon="ri:key-line" class="mr-1" />
          生成随机密码
        </el-button>
        <el-button @click="clearPassword">
          <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
          清空
        </el-button>
      </div>

      <div class="password-demo">
        <ScPasswordStrength v-model="config.password" />
      </div>

      <div class="password-info">
        当前密码：<code>{{ config.password || "(空)" }}</code>
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
import ScPasswordStrength from "@repo/components/ScPasswordStrength/index.vue";
import CodePreview from "./CodePreview.vue";

/**
 * ScPasswordStrength 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */

const config = reactive({
  password: "",
});

// 属性说明
const propsData = [
  {
    name: "modelValue",
    type: "string",
    default: "''",
    description: "密码值（v-model）",
  },
  {
    name: "placeholder",
    type: "string",
    default: "'请输入密码'",
    description: "占位文本",
  },
  {
    name: "disabled",
    type: "boolean",
    default: "false",
    description: "是否禁用",
  },
];

// 代码示例
const codeTabs = computed(() => [
  {
    key: "template",
    label: "模板",
    icon: "ri:code-s-slash-line",
    language: "vue",
    code: `<ScPasswordStrength v-model="password" />`,
  },
  {
    key: "script",
    label: "脚本",
    icon: "ri:javascript-line",
    language: "ts",
    code: `import { ref } from "vue";
import ScPasswordStrength from "@repo/components/ScPasswordStrength/index.vue";

const password = ref("");`,
  },
]);

function generatePassword() {
  const chars = "ABCDEFGHJKMNPQRSTWXYZabcdefghjkmnpqrstwxyz23456789!@#$%";
  let pwd = "";
  for (let i = 0; i < 12; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  config.password = pwd;
}

function clearPassword() {
  config.password = "";
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

.password-demo {
  max-width: 400px;
}

.password-info {
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

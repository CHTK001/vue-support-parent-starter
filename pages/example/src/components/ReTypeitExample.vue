<template>
  <div class="example-container">
    <h2 class="example-title">ReTypeit 打字机效果示例</h2>
    <p class="example-desc">打字机效果组件，支持多文本循环、自定义速度等功能</p>

    <el-divider content-position="left">功能演示</el-divider>

    <div class="demo-section">
      <div class="typeit-wrapper">
        <ReTypeit :options="typeOptions" :key="optionsKey">
          <span class="type-it"></span>
        </ReTypeit>
      </div>

      <el-divider content-position="left">属性配置</el-divider>

      <el-form label-width="120px" class="config-form">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="打字速度">
              <el-input-number
                v-model="config.speed"
                :min="50"
                :max="500"
                :step="50"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="循环播放">
              <el-switch v-model="config.loop" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="">
              <el-button type="primary" @click="refreshTypeit">
                <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
                重新播放
              </el-button>
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
      <el-table-column prop="type" label="类型" width="200" />
      <el-table-column prop="default" label="默认值" width="120" />
      <el-table-column prop="description" label="说明" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import ReTypeit from "@repo/components/ReTypeit/src/index.tsx";
import CodePreview from "./CodePreview.vue";

/**
 * ReTypeit 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */

const optionsKey = ref(0);

const config = reactive({
  speed: 100,
  loop: true,
  strings: ["Hello World", "你好，世界", "Welcome!"],
});

const typeOptions = computed(() => ({
  strings: config.strings,
  speed: config.speed,
  loop: config.loop,
}));

// 属性说明
const propsData = [
  {
    name: "options.strings",
    type: "string[]",
    default: "[]",
    description: "要显示的文本数组",
  },
  {
    name: "options.speed",
    type: "number",
    default: "100",
    description: "打字速度（毫秒）",
  },
  {
    name: "options.loop",
    type: "boolean",
    default: "false",
    description: "是否循环播放",
  },
];

// 代码示例
const codeTabs = computed(() => [
  {
    key: "template",
    label: "模板",
    icon: "ri:code-s-slash-line",
    language: "vue",
    code: `<ReTypeit :options="typeOptions">
  <span class="type-it"></span>
</ReTypeit>`,
  },
  {
    key: "script",
    label: "脚本",
    icon: "ri:javascript-line",
    language: "ts",
    code: `import ReTypeit from "@repo/components/ReTypeit/src/index.tsx";

const typeOptions = {
  strings: ["Hello", "你好"],
  speed: ${config.speed},
  loop: ${config.loop}
};`,
  },
]);

function refreshTypeit() {
  optionsKey.value++;
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

.typeit-wrapper {
  display: flex;
  justify-content: center;
  padding: 32px;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  font-size: 24px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.config-form {
  margin-top: 16px;
}

.props-table {
  margin-bottom: 20px;
}
</style>

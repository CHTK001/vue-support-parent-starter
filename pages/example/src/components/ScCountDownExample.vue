<template>
  <div class="example-container">
    <h2 class="example-title">ScCountDown 倒计时示例</h2>
    <p class="example-desc">倒计时组件，支持自定义格式、循环倒计时等功能</p>

    <el-divider content-position="left">功能演示</el-divider>

    <div class="demo-section">
      <div class="demo-controls">
        <el-button type="primary" @click="resetCountdown">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          重置
        </el-button>
        <el-button @click="addTime">
          <IconifyIconOnline icon="ri:add-line" class="mr-1" />
          +30秒
        </el-button>
      </div>

      <div class="countdown-display">
        <ScCountDown v-model="config.seconds" :loop="config.loop">
          <template #default="{ row }">
            <span class="countdown-text">
              {{ row.minutes.toString().padStart(2, "0") }}:{{
                row.seconds.toString().padStart(2, "0")
              }}
            </span>
          </template>
        </ScCountDown>
      </div>

      <el-divider content-position="left">属性配置</el-divider>

      <el-form label-width="120px" class="config-form">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="倒计时(秒)">
              <el-input-number
                v-model="config.seconds"
                :min="1"
                :max="600"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="循环">
              <el-switch v-model="config.loop" />
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
import ScCountDown from "@repo/components/ScCountDown/index.vue";
import CodePreview from "./CodePreview.vue";

/**
 * ScCountDown 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */

const config = reactive({
  seconds: 90,
  loop: false,
});

// 属性说明
const propsData = [
  {
    name: "modelValue",
    type: "number",
    default: "0",
    description: "倒计时秒数（v-model）",
  },
  {
    name: "loop",
    type: "boolean",
    default: "false",
    description: "是否循环倒计时",
  },
  {
    name: "autoStart",
    type: "boolean",
    default: "true",
    description: "是否自动开始",
  },
];

// 代码示例
const codeTabs = computed(() => [
  {
    key: "template",
    label: "模板",
    icon: "ri:code-s-slash-line",
    language: "vue",
    code: `<ScCountDown v-model="seconds" :loop="${config.loop}">
  <template #default="{ row }">
    <span>{{ row.minutes.toString().padStart(2, "0") }}:{{ row.seconds.toString().padStart(2, "0") }}</span>
  </template>
</ScCountDown>`,
  },
  {
    key: "script",
    label: "脚本",
    icon: "ri:javascript-line",
    language: "ts",
    code: `import { ref } from "vue";
import ScCountDown from "@repo/components/ScCountDown/index.vue";

const seconds = ref(${config.seconds});`,
  },
]);

function resetCountdown() {
  config.seconds = 90;
}

function addTime() {
  config.seconds += 30;
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

.countdown-display {
  display: flex;
  justify-content: center;
  padding: 32px;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.countdown-text {
  font-size: 48px;
  font-weight: 700;
  font-family: monospace;
  color: var(--el-color-primary);
}

.config-form {
  margin-top: 16px;
}

.props-table {
  margin-bottom: 20px;
}
</style>

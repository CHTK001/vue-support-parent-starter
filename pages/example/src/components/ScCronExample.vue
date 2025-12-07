<template>
  <div class="sc-cron-example">
    <div class="example-container">
      <!-- 左侧：属性配置面板 -->
      <div class="config-panel">
        <h3 class="panel-title">
          <IconifyIconOnline icon="ri:settings-3-line" />
          属性配置
        </h3>

        <el-form label-position="top" size="small">
          <el-form-item label="shortcuts 快捷选项">
            <el-select
              v-model="config.shortcut"
              placeholder="选择快捷表达式"
              @change="applyShortcut"
              style="width: 100%"
            >
              <el-option
                v-for="it in shortcuts"
                :key="it.value"
                :label="it.text"
                :value="it.value"
              />
            </el-select>
          </el-form-item>

          <el-divider />

          <div class="action-buttons">
            <el-button type="primary" size="small" @click="resetCron">
              <IconifyIconOnline icon="ri:refresh-line" />
              重置
            </el-button>
          </div>
        </el-form>
      </div>

      <!-- 右侧：预览和结果 -->
      <div class="preview-panel">
        <h3 class="panel-title">
          <IconifyIconOnline icon="ri:eye-line" />
          效果预览
        </h3>

        <div class="preview-area">
          <ScCron v-model="config.cron" :shortcuts="shortcuts" />
        </div>

        <div class="result-area">
          <h4 class="result-title">
            <IconifyIconOnline icon="ri:terminal-box-line" />
            当前表达式
          </h4>
          <pre class="result-content">{{ config.cron }}</pre>
        </div>

        <div class="code-area">
          <h4 class="code-title">
            <IconifyIconOnline icon="ri:code-s-slash-line" />
            示例代码
          </h4>
          <pre class="code-content"><code>{{ generatedCode }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from "vue";
import ScCron from "@repo/components/ScCron/index.vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

const shortcuts = [
  { text: "每分钟", value: "0 * * * * ?" },
  { text: "每小时", value: "0 0 * * * ?" },
  { text: "每天零点", value: "0 0 0 * * ?" },
  { text: "每周一零点", value: "0 0 0 ? * MON" },
  { text: "每月1号零点", value: "0 0 0 1 * ?" },
];

const config = reactive({
  cron: "0 0 0 * * ?",
  shortcut: "",
});

// 生成示例代码
const generatedCode = computed(() => {
  return `<ScCron
  v-model="cron"
  :shortcuts="shortcuts"
/>

<script setup>
import { ref } from "vue";
const cron = ref("${config.cron}");
const shortcuts = [
  { text: "每分钟", value: "0 * * * * ?" },
  { text: "每小时", value: "0 0 * * * ?" }
];
<\/script>`;
});

function applyShortcut(v: string) {
  config.cron = v;
}

function resetCron() {
  config.cron = "0 0 0 * * ?";
  config.shortcut = "";
}
</script>

<style scoped lang="scss">
.sc-cron-example { padding: 20px; }
.example-container { display: flex; gap: 24px; @media (max-width: 900px) { flex-direction: column; } }
.config-panel { width: 320px; flex-shrink: 0; background: var(--el-bg-color); border: 1px solid var(--el-border-color-lighter); border-radius: 8px; padding: 20px; @media (max-width: 900px) { width: 100%; } }
.preview-panel { flex: 1; min-width: 0; background: var(--el-bg-color); border: 1px solid var(--el-border-color-lighter); border-radius: 8px; padding: 20px; }
.panel-title { display: flex; align-items: center; gap: 8px; margin: 0 0 20px; font-size: 16px; font-weight: 600; color: var(--el-text-color-primary); .iconify { color: var(--el-color-primary); } }
.action-buttons { display: flex; gap: 8px; }
.preview-area { padding: 20px; background: var(--el-fill-color-lighter); border-radius: 8px; }
.result-area, .code-area { margin-top: 20px; }
.result-title, .code-title { display: flex; align-items: center; gap: 6px; margin: 0 0 12px; font-size: 14px; font-weight: 500; color: var(--el-text-color-primary); .iconify { color: var(--el-color-primary); } }
.result-content { margin: 0; padding: 12px 16px; background: var(--el-fill-color-lighter); border-radius: 6px; font-size: 13px; font-family: "SF Mono", "Monaco", "Consolas", monospace; color: var(--el-text-color-regular); }
.code-content { margin: 0; padding: 16px; background: #1e1e1e; border-radius: 6px; overflow-x: auto; code { font-size: 13px; font-family: "SF Mono", "Monaco", "Consolas", monospace; color: #d4d4d4; line-height: 1.6; } }
:deep(.el-form-item) { margin-bottom: 16px; }
:deep(.el-divider) { margin: 16px 0; }
</style>

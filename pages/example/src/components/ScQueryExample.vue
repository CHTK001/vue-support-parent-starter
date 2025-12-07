<template>
  <div class="sc-query-example">
    <div class="example-container">
      <!-- 左侧：属性配置面板 -->
      <div class="config-panel">
        <h3 class="panel-title">
          <IconifyIconOnline icon="ri:settings-3-line" />
          属性配置
        </h3>

        <el-form label-position="top" size="small">
          <el-form-item label="placeholder 占位文本">
            <el-input v-model="config.placeholder" />
          </el-form-item>

          <el-form-item label="debounce 防抖延迟 (ms)">
            <el-input-number v-model="config.debounce" :min="0" :max="2000" :step="100" style="width: 100%" />
          </el-form-item>

          <el-divider />

          <div class="action-buttons">
            <el-button type="primary" size="small" @click="search">
              <IconifyIconOnline icon="ri:search-line" />
              搜索
            </el-button>
            <el-button size="small" @click="clearQuery">
              <IconifyIconOnline icon="ri:close-line" />
              清空
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
          <ScQuery v-model="config.query" :placeholder="config.placeholder" :debounce="config.debounce" />
        </div>

        <div class="result-area">
          <h4 class="result-title">
            <IconifyIconOnline icon="ri:terminal-box-line" />
            当前值
          </h4>
          <pre class="result-content">{{ config.query || "(空)" }}</pre>
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
import { ElMessage } from "element-plus";
import ScQuery from "@repo/components/ScQuery/index.vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

const config = reactive({
  query: "",
  placeholder: "请输入关键词",
  debounce: 300
});

// 生成示例代码
const generatedCode = computed(() => {
  const props: string[] = [];
  props.push(`v-model="query"`);
  if (config.placeholder !== "请输入") props.push(`placeholder="${config.placeholder}"`);
  if (config.debounce !== 300) props.push(`:debounce="${config.debounce}"`);
  return `<ScQuery\n  ${props.join("\n  ")}\n/>`;
});

function search() {
  ElMessage.success(`搜索: ${config.query || "(空)"}`);
}

function clearQuery() {
  config.query = "";
}
</script>

<style scoped lang="scss">
.sc-query-example { padding: 20px; }
.example-container { display: flex; gap: 24px; @media (max-width: 900px) { flex-direction: column; } }
.config-panel { width: 320px; flex-shrink: 0; background: var(--el-bg-color); border: 1px solid var(--el-border-color-lighter); border-radius: 8px; padding: 20px; @media (max-width: 900px) { width: 100%; } }
.preview-panel { flex: 1; min-width: 0; background: var(--el-bg-color); border: 1px solid var(--el-border-color-lighter); border-radius: 8px; padding: 20px; }
.panel-title { display: flex; align-items: center; gap: 8px; margin: 0 0 20px; font-size: 16px; font-weight: 600; color: var(--el-text-color-primary); .iconify { color: var(--el-color-primary); } }
.action-buttons { display: flex; gap: 8px; }
.preview-area { padding: 40px; background: var(--el-fill-color-lighter); border-radius: 8px; display: flex; justify-content: center; }
.result-area, .code-area { margin-top: 20px; }
.result-title, .code-title { display: flex; align-items: center; gap: 6px; margin: 0 0 12px; font-size: 14px; font-weight: 500; color: var(--el-text-color-primary); .iconify { color: var(--el-color-primary); } }
.result-content { margin: 0; padding: 12px 16px; background: var(--el-fill-color-lighter); border-radius: 6px; font-size: 13px; font-family: "SF Mono", "Monaco", "Consolas", monospace; color: var(--el-text-color-regular); }
.code-content { margin: 0; padding: 16px; background: #1e1e1e; border-radius: 6px; overflow-x: auto; code { font-size: 13px; font-family: "SF Mono", "Monaco", "Consolas", monospace; color: #d4d4d4; line-height: 1.6; } }
:deep(.el-form-item) { margin-bottom: 16px; }
:deep(.el-divider) { margin: 16px 0; }
</style>

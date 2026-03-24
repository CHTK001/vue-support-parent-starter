<template>
  <div class="sc-pagination-example">
    <div class="example-container">
      <!-- 左侧：属性配置面板 -->
      <div class="config-panel">
        <h3 class="panel-title">
          <IconifyIconOnline icon="ri:settings-3-line" />
          属性配置
        </h3>

        <ScForm label-position="top" size="small">
          <ScFormItem label="total 总条数">
            <ScInputNumber v-model="config.total" :min="1" :max="1000" style="width: 100%" />
          </ScFormItem>

          <ScFormItem label="pageSize 每页条数">
            <ScInputNumber v-model="config.size" :min="5" :max="100" style="width: 100%" />
          </ScFormItem>

          <ScDivider />

          <div class="action-buttons">
            <ScButton type="primary" size="small" @click="goFirst">
              <IconifyIconOnline icon="ri:skip-back-line" />
              首页
            </ScButton>
            <ScButton size="small" @click="goLast">
              <IconifyIconOnline icon="ri:skip-forward-line" />
              末页
            </ScButton>
          </div>
        </ScForm>
      </div>

      <!-- 右侧：预览和结果 -->
      <div class="preview-panel">
        <h3 class="panel-title">
          <IconifyIconOnline icon="ri:eye-line" />
          效果预览
        </h3>

        <div class="preview-area">
          <ScPagintion
            :total="config.total"
            v-model:currentPage="config.page"
            v-model:pageSize="config.size"
          />
        </div>

        <div class="result-area">
          <h4 class="result-title">
            <IconifyIconOnline icon="ri:terminal-box-line" />
            当前状态
          </h4>
          <pre class="result-content">当前页: {{ config.page }}, 每页: {{ config.size }} 条, 共 {{ config.total }} 条</pre>
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
import ScPagintion from "@repo/components/ScPagintion/index.vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

const config = reactive({
  page: 1,
  size: 10,
  total: 123,
});

// 生成示例代码
const generatedCode = computed(() => {
  return `<ScPagintion
  :total="${config.total}"
  v-model:currentPage="page"
  v-model:pageSize="size"
/>

<script setup>
import { ref } from "vue";
const page = ref(${config.page});
const size = ref(${config.size});
<\/script>`;
});

function goFirst() {
  config.page = 1;
}

function goLast() {
  config.page = Math.ceil(config.total / config.size);
}
</script>

<style scoped lang="scss">
.sc-pagination-example { padding: 20px; }
.example-container { display: flex; gap: 24px; @media (max-width: 900px) { flex-direction: column; } }
.config-panel { width: 320px; flex-shrink: 0; background: var(--el-bg-color); border: 1px solid var(--el-border-color-lighter); border-radius: 8px; padding: 20px; @media (max-width: 900px) { width: 100%; } }
.preview-panel { flex: 1; min-width: 0; background: var(--el-bg-color); border: 1px solid var(--el-border-color-lighter); border-radius: 8px; padding: 20px; }
.panel-title { display: flex; align-items: center; gap: 8px; margin: 0 0 20px; font-size: 16px; font-weight: 600; color: var(--el-text-color-primary); .iconify { color: var(--el-color-primary); } }
.action-buttons { display: flex; gap: 8px; }
.preview-area { padding: 20px; background: var(--el-fill-color-lighter); border-radius: 8px; display: flex; justify-content: center; }
.result-area, .code-area { margin-top: 20px; }
.result-title, .code-title { display: flex; align-items: center; gap: 6px; margin: 0 0 12px; font-size: 14px; font-weight: 500; color: var(--el-text-color-primary); .iconify { color: var(--el-color-primary); } }
.result-content { margin: 0; padding: 12px 16px; background: var(--el-fill-color-lighter); border-radius: 6px; font-size: 13px; font-family: "SF Mono", "Monaco", "Consolas", monospace; color: var(--el-text-color-regular); }
.code-content { margin: 0; padding: 16px; background: #1e1e1e; border-radius: 6px; overflow-x: auto; code { font-size: 13px; font-family: "SF Mono", "Monaco", "Consolas", monospace; color: #d4d4d4; line-height: 1.6; } }
:deep(.el-form-item) { margin-bottom: 16px; }
:deep(.el-divider) { margin: 16px 0; }
</style>

<template>
  <div class="sc-search-example">
    <div class="example-container">
      <!-- 左侧：属性配置面板 -->
      <div class="config-panel">
        <h3 class="panel-title">
          <IconifyIconOnline icon="ri:settings-3-line" />
          属性配置
        </h3>

        <el-form label-position="top" size="small">
          <el-form-item label="placeholder 占位文本">
            <el-input v-model="config.placeholder" placeholder="请输入占位文本" />
          </el-form-item>

          <el-divider />

          <div class="switch-group">
            <div class="switch-item">
              <el-tooltip content="是否可清空" placement="left">
                <span>clearable 可清空</span>
              </el-tooltip>
              <el-switch v-model="config.clearable" />
            </div>
          </div>

          <el-divider />

          <div class="action-buttons">
            <el-button type="primary" size="small" @click="doSearch">
              <IconifyIconOnline icon="ri:search-line" />
              搜索
            </el-button>
            <el-button size="small" @click="clearKeyword">
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
          <ScSearch
            v-model="config.keyword"
            :placeholder="config.placeholder"
            :clearable="config.clearable"
            @search="handleSearch"
          />
        </div>

        <div class="result-area">
          <h4 class="result-title">
            <IconifyIconOnline icon="ri:terminal-box-line" />
            当前值
          </h4>
          <pre class="result-content">{{ config.keyword || "(空)" }}</pre>
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
import ScSearch from "@repo/components/ScSearch/index.vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

const config = reactive({
  keyword: "",
  placeholder: "搜索关键字",
  clearable: true
});

// 生成示例代码
const generatedCode = computed(() => {
  const props: string[] = [];

  props.push(`v-model="keyword"`);
  if (config.placeholder !== "搜索") {
    props.push(`placeholder="${config.placeholder}"`);
  }
  if (!config.clearable) {
    props.push(`:clearable="false"`);
  }

  const propsStr = props.join("\n  ");
  return `<ScSearch\n  ${propsStr}\n/>`;
});

function doSearch() {
  ElMessage.success(`搜索: ${config.keyword || "(空)"}`);
}

function handleSearch(keyword: string) {
  ElMessage.info(`触发搜索: ${keyword}`);
}

function clearKeyword() {
  config.keyword = "";
}
</script>

<style scoped lang="scss">
.sc-search-example {
  padding: 20px;
}

.example-container {
  display: flex;
  gap: 24px;

  @media (max-width: 900px) {
    flex-direction: column;
  }
}

.config-panel {
  width: 320px;
  flex-shrink: 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 20px;

  @media (max-width: 900px) {
    width: 100%;
  }
}

.preview-panel {
  flex: 1;
  min-width: 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 20px;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 20px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);

  .iconify {
    color: var(--el-color-primary);
  }
}

.switch-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.switch-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--el-text-color-regular);

  span {
    cursor: help;
    border-bottom: 1px dashed var(--el-border-color);
  }
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.preview-area {
  padding: 40px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.result-area,
.code-area {
  margin-top: 20px;
}

.result-title,
.code-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);

  .iconify {
    color: var(--el-color-primary);
  }
}

.result-content {
  margin: 0;
  padding: 12px 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
  font-size: 13px;
  font-family: "SF Mono", "Monaco", "Consolas", monospace;
  color: var(--el-text-color-regular);
}

.code-content {
  margin: 0;
  padding: 16px;
  background: #1e1e1e;
  border-radius: 6px;
  overflow-x: auto;

  code {
    font-size: 13px;
    font-family: "SF Mono", "Monaco", "Consolas", monospace;
    color: #d4d4d4;
    line-height: 1.6;
  }
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-divider) {
  margin: 16px 0;
}
</style>

<script setup>
import { reactive, ref, computed } from "vue";
import { message } from "@repo/utils";
import { useI18n } from "vue-i18n";
import ScSwitch from "@repo/components/ScSwitch/index.vue";
import hljs from "highlight.js/lib/core";
import json from "highlight.js/lib/languages/json";
import "highlight.js/styles/github.css";

// 注册 JSON 语言
hljs.registerLanguage("json", json);

// 国际化
const { t } = useI18n();

// 环境变量
const env = reactive({
  loading: false,
  inputJson: "",
  outputJson: "",
  errorMessage: "",
  indentSize: 2,
  compactOutput: false,
  sortKeys: false,
  showLineNumbers: true,
  theme: "light",
});

// 格式化后的 JSON 带语法高亮
const highlightedJson = computed(() => {
  if (!env.outputJson) return "";

  const highlighted = hljs.highlight(env.outputJson, {
    language: "json",
  }).value;

  if (env.showLineNumbers) {
    const lines = highlighted.split("\n");
    const numberedLines = lines.map(
      (line, index) =>
        `<span class="json-tool__line-number">${index + 1}</span><span class="json-tool__line-content">${line}</span>`
    );
    return numberedLines.join("\n");
  }

  return highlighted;
});

// 格式化 JSON
const formatJson = () => {
  if (!env.inputJson.trim()) {
    message(t("message.emptyInput") || "请输入 JSON 内容", { type: "warning" });
    return;
  }

  env.loading = true;
  env.errorMessage = "";

  try {
    // 解析 JSON
    const parsedJson = JSON.parse(env.inputJson);

    // 根据选项处理
    let result = parsedJson;

    // 排序键
    if (env.sortKeys) {
      result = sortObjectKeys(result);
    }

    // 格式化输出
    env.outputJson = JSON.stringify(
      result,
      null,
      env.compactOutput ? 0 : env.indentSize
    );

    message(t("message.formatSuccess") || "JSON 格式化成功", {
      type: "success",
    });
  } catch (error) {
    env.errorMessage = error.message;
    message(t("message.formatError") || "JSON 格式错误: " + error.message, {
      type: "error",
    });
  } finally {
    env.loading = false;
  }
};

// 排序对象键
const sortObjectKeys = (obj) => {
  // 如果不是对象或是数组，直接返回
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map((item) => sortObjectKeys(item));
  }

  // 处理对象
  const sortedObj = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sortedObj[key] = sortObjectKeys(obj[key]);
    });

  return sortedObj;
};

// 压缩 JSON
const compactJson = () => {
  env.compactOutput = true;
  formatJson();
};

// 美化 JSON
const beautifyJson = () => {
  env.compactOutput = false;
  formatJson();
};

// 复制到剪贴板
const copyToClipboard = (text) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      message(t("message.copySuccess") || "复制成功", { type: "success" });
    })
    .catch(() => {
      message(t("message.copyError") || "复制失败", { type: "error" });
    });
};

// 清空输入
const clearInput = () => {
  env.inputJson = "";
  env.outputJson = "";
  env.errorMessage = "";
};

// 加载示例
const loadExample = () => {
  env.inputJson = `{
  "name": "JSON 格式化工具",
  "version": "1.0.0",
  "features": ["格式化", "验证", "压缩", "排序键"],
  "isAwesome": true,
  "stats": {
    "users": 1000,
    "rating": 4.9
  }
}`;
};

// 下载 JSON 文件
const downloadJson = () => {
  if (!env.outputJson) {
    message(t("message.noDataToDownload") || "没有数据可下载", {
      type: "warning",
    });
    return;
  }

  const blob = new Blob([env.outputJson], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "formatted.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  message(t("message.downloadSuccess") || "下载成功", { type: "success" });
};

// 上传 JSON 文件
const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    env.inputJson = e.target.result;
    message(t("message.fileLoadSuccess") || "文件加载成功", {
      type: "success",
    });
  };
  reader.onerror = () => {
    message(t("message.fileLoadError") || "文件加载失败", { type: "error" });
  };
  reader.readAsText(file);
};
</script>

<template>
  <div class="json-tool">
    <div class="json-tool__content">
      <!-- 顶部区域：标题和说明 -->
      <div class="json-tool__header-container">
        <div class="json-tool__header">
          <div class="json-tool__header-inner">
            <div class="json-tool__header-title">JSON 格式化工具</div>
            <div class="json-tool__header-subtitle">
              格式化、验证、压缩和排序 JSON 数据
            </div>
          </div>
          <div class="json-tool__header-decoration">
            <div class="json-tool__header-circle"></div>
            <div class="json-tool__header-circle"></div>
            <div class="json-tool__header-circle"></div>
          </div>
        </div>
      </div>

      <ScRow :gutter="24">
        <!-- 输入区域 -->
        <ScCol :xs="24" :sm="24" :md="12" :lg="12">
          <ScCard class="json-tool__input-card" shadow="hover">
            <template #header>
              <div class="json-tool__card-header">
                <IconifyIconOnline
                  icon="ri:input-method-line"
                  class="json-tool__card-icon"
                />
                <span>输入 JSON</span>
              </div>
            </template>

            <div class="json-tool__actions-top">
              <ScButton type="primary" @click="loadExample" size="small">
                <IconifyIconOnline icon="ri:file-list-line" />
                <span>加载示例</span>
              </ScButton>

              <ScButton @click="clearInput" size="small">
                <IconifyIconOnline icon="ri:delete-bin-line" />
                <span>清空</span>
              </ScButton>

              <ScUpload 
                action=""
                :auto-upload="false"
                :show-file-list="false"
                accept=".json"
                @change="handleFileUpload"
              >
                <ScButton size="small">
                  <IconifyIconOnline icon="ri:upload-2-line" />
                  <span>上传文件</span>
                </ScButton>
              </ScUpload>
            </div>

            <ScInput 
              v-model="env.inputJson"
              type="textarea"
              :rows="12"
              placeholder="请输入 JSON 内容..."
              class="json-tool__textarea"
            />

            <div class="json-tool__options">
              <ScForm :inline="true" size="small">
                <ScFormItem label="缩进大小">
                  <ScInputNumber 
                    v-model="env.indentSize"
                    :min="0"
                    :max="8"
                    size="small"
                  />
                </ScFormItem>

                <ScFormItem label="排序键">
                  <ScSwitch v-model="env.sortKeys" layout="modern" />
                </ScFormItem>
              </ScForm>
            </div>

            <div class="json-tool__actions">
              <ScButton 
                type="primary"
                :loading="env.loading"
                class="json-tool__format-btn"
                @click="formatJson"
              >
                <IconifyIconOnline icon="ri:braces-line" />
                <span>格式化</span>
              </ScButton>

              <ScButton 
                type="success"
                class="json-tool__beautify-btn"
                @click="beautifyJson"
              >
                <IconifyIconOnline icon="ri:layout-line" />
                <span>美化</span>
              </ScButton>

              <ScButton 
                type="warning"
                class="json-tool__compact-btn"
                @click="compactJson"
              >
                <IconifyIconOnline icon="ri:compress-line" />
                <span>压缩</span>
              </ScButton>
            </div>
          </ScCard>
        </ScCol>

        <!-- 结果区域 -->
        <ScCol :xs="24" :sm="24" :md="12" :lg="12">
          <ScCard class="json-tool__result-card" shadow="hover">
            <template #header>
              <div class="json-tool__card-header">
                <IconifyIconOnline
                  icon="ri:braces-fill"
                  class="json-tool__card-icon"
                />
                <span>格式化结果</span>
              </div>
            </template>

            <ScEmpty 
              v-if="!env.outputJson && !env.errorMessage"
              description="请先输入并格式化 JSON"
              class="json-tool__empty"
            >
              <template #image>
                <IconifyIconOnline
                  icon="ri:braces-line"
                  class="json-tool__empty-icon"
                />
              </template>
            </ScEmpty>

            <div v-else-if="env.errorMessage" class="json-tool__error">
              <IconifyIconOnline
                icon="ri:error-warning-line"
                class="json-tool__error-icon"
              />
              <div class="json-tool__error-message">{{ env.errorMessage }}</div>
            </div>

            <div v-else class="json-tool__result">
              <div class="json-tool__result-actions">
                <ScButton 
                  type="primary"
                  link
                  size="small"
                  class="json-tool__copy-btn"
                  @click="copyToClipboard(env.outputJson)"
                >
                  <IconifyIconOnline icon="ri:file-copy-line" />
                  <span>复制</span>
                </ScButton>

                <ScButton 
                  type="success"
                  link
                  size="small"
                  class="json-tool__download-btn"
                  @click="downloadJson"
                >
                  <IconifyIconOnline icon="ri:download-line" />
                  <span>下载</span>
                </ScButton>

                <ScSwitch
                  v-model="env.showLineNumbers"
                  active-text="显示行号"
                  inactive-text="隐藏行号"
                  size="small"
                  layout="modern"
                  style="margin-left: 10px"
                />
              </div>

              <pre
                class="json-tool__output"
                :class="{
                  'json-tool__output--with-line-numbers': env.showLineNumbers,
                }"
              ><code v-html="highlightedJson"></code></pre>
            </div>
          </ScCard>
        </ScCol>
      </ScRow>

      <!-- 使用说明 -->
      <ScCard class="json-tool__tips-card" shadow="hover">
        <template #header>
          <div class="json-tool__card-header">
            <IconifyIconOnline
              icon="ri:information-line"
              class="json-tool__card-icon"
            />
            <span>使用说明</span>
          </div>
        </template>
        <div class="json-tool__tips-content">
          <div class="json-tool__tip-item">
            <div class="json-tool__tip-number">1</div>
            <div class="json-tool__tip-text">
              在左侧输入框中粘贴或输入 JSON
              内容，或者点击"加载示例"按钮加载示例数据
            </div>
          </div>
          <div class="json-tool__tip-item">
            <div class="json-tool__tip-number">2</div>
            <div class="json-tool__tip-text">
              点击"格式化"按钮将 JSON 格式化为易读的格式，或者点击"压缩"按钮将
              JSON 压缩为单行
            </div>
          </div>
          <div class="json-tool__tip-item">
            <div class="json-tool__tip-number">3</div>
            <div class="json-tool__tip-text">
              可以调整缩进大小和是否按键名排序等选项
            </div>
          </div>
          <div class="json-tool__tip-item">
            <div class="json-tool__tip-number">4</div>
            <div class="json-tool__tip-text">
              格式化后的 JSON 可以复制到剪贴板或下载为文件
            </div>
          </div>
          <div class="json-tool__tip-item json-tool__tip-item--warning">
            <IconifyIconOnline
              icon="ri:alert-line"
              class="json-tool__tip-icon"
            />
            <div class="json-tool__tip-text">
              注意：处理大型 JSON 文件可能会导致浏览器性能下降
            </div>
          </div>
        </div>
      </ScCard>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.json-tool {
  /* 头部样式 */
  &__content {
    padding: 0 20px 20px;
  }

  &__header-container {
    margin-bottom: 24px;
  }

  &__header {
    background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
    border-radius: 16px;
    padding: 32px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 8px 24px color-mix(in srgb, var(--el-color-primary) 30%, transparent);
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
      box-shadow: 0 12px 32px color-mix(in srgb, var(--el-color-primary) 40%, transparent);
      transform: translateY(-2px);
    }

    &-inner {
      position: relative;
      z-index: 2;
    }

    &-title {
      font-size: 28px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 10px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    &-subtitle {
      font-size: 16px;
      color: rgba(255, 255, 255, 0.9);
    }

    &-decoration {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    &-circle {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);

      &:nth-child(1) {
        width: 200px;
        height: 200px;
        top: -100px;
        right: -50px;
        animation: float 15s infinite ease-in-out;
      }

      &:nth-child(2) {
        width: 150px;
        height: 150px;
        bottom: -50px;
        left: -30px;
        animation: float 12s infinite ease-in-out reverse;
      }

      &:nth-child(3) {
        width: 100px;
        height: 100px;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        animation: pulse 8s infinite ease-in-out;
      }
    }
  }

  /* 卡片样式 */
  &__card-header {
    display: flex;
    align-items: center;
    font-size: 18px;
    font-weight: 600;

    .json-tool__card-icon {
      margin-right: 10px;
      font-size: 20px;
      color: var(--el-color-primary);
    }
  }

  /* 输入区域样式 */
  &__input-card {
    margin-bottom: 24px;
    transition: all 0.3s ease;
    
    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    }
  }

  &__actions-top {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
    
    :deep(.el-button) {
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
      }
    }
  }

  &__textarea {
    font-family: "Courier New", monospace;
    margin-bottom: 16px;
    
    :deep(.el-textarea__inner) {
      border-radius: 8px;
      transition: all 0.3s ease;
      
      &:focus {
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-primary) 20%, transparent);
      }
    }
  }

  &__options {
    margin-bottom: 16px;
    padding: 16px;
    background: var(--el-bg-color-overlay);
    border-radius: 8px;
    border: 1px solid var(--el-border-color-lighter);
  }

  &__actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    
    :deep(.el-button) {
      border-radius: 8px;
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px color-mix(in srgb, var(--el-color-primary) 30%, transparent);
      }
    }
  }

  /* 结果区域样式 */
  &__result-card {
    margin-bottom: 24px;
    transition: all 0.3s ease;
    
    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    }
  }

  &__empty {
    padding: 60px 20px;

    &-icon {
      font-size: 64px;
      color: var(--el-text-color-placeholder);
      opacity: 0.5;
    }
  }

  &__error {
    padding: 20px;
    background: color-mix(in srgb, var(--el-color-danger) 10%, var(--el-bg-color));
    border-radius: 8px;
    border: 1px solid color-mix(in srgb, var(--el-color-danger) 30%, transparent);
    display: flex;
    align-items: flex-start;
    gap: 12px;
    transition: all 0.3s ease;

    &-icon {
      font-size: 24px;
      color: var(--el-color-danger);
      flex-shrink: 0;
    }

    &-message {
      font-family: "Courier New", monospace;
      color: var(--el-color-danger);
      word-break: break-all;
      line-height: 1.6;
    }
  }

  &__result {
    position: relative;
  }

  &__result-actions {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    gap: 8px;
    padding: 8px;
    background: color-mix(in srgb, var(--el-bg-color) 95%, transparent);
    backdrop-filter: blur(8px);
    border-radius: 8px;
    border: 1px solid var(--el-border-color-lighter);
    z-index: 1;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    
    :deep(.el-button) {
      transition: all 0.3s ease;
      
      &:hover {
        transform: scale(1.1);
      }
    }
  }

  &__output {
    font-family: "Courier New", monospace;
    background: var(--el-bg-color-page);
    padding: 16px;
    border-radius: 8px;
    border: 1px solid var(--el-border-color-lighter);
    overflow: auto;
    max-height: 400px;
    white-space: pre-wrap;
    word-break: break-all;
    transition: all 0.3s ease;
    
    &--with-line-numbers {
      .json-tool__line-number {
        display: inline-block;
        width: 40px;
        color: var(--el-text-color-placeholder);
        text-align: right;
        margin-right: 12px;
        user-select: none;
      }
    }
  }

  /* 使用说明样式 */
  &__tips-card {
    margin-bottom: 24px;
    transition: all 0.3s ease;
    
    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    }
  }

  &__tips-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__tip-item {
    display: flex;
    align-items: flex-start;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateX(4px);
    }

    &--warning {
      margin-top: 12px;
      padding: 16px;
      background: color-mix(in srgb, var(--el-color-warning) 10%, var(--el-bg-color));
      border-radius: 8px;
      border-left: 4px solid var(--el-color-warning);
    }
  }

  &__tip-number {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 14px;
    margin-right: 12px;
    flex-shrink: 0;
    box-shadow: 0 2px 8px color-mix(in srgb, var(--el-color-primary) 30%, transparent);
  }

  &__tip-icon {
    font-size: 24px;
    color: var(--el-color-warning);
    margin-right: 12px;
    flex-shrink: 0;
  }

  &__tip-text {
    flex: 1;
    line-height: 1.8;
    color: var(--el-text-color-regular);
  }
}

/* 动画效果 */
@keyframes pulse {
  0%,
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.8;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1);
    opacity: 1;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(10deg);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .json-tool {
    &__actions {
      flex-direction: column;
    }

    &__result-card {
      margin-top: 20px;
    }
  }
}
</style>

<template>
  <div class="api-response-viewer">
    <div v-if="!response" class="no-result">
      <ScEmpty description="暂无执行结果" :image-size="100" />
    </div>
    <div v-else class="response-container">
      <!-- 响应状态 -->
      <div class="response-status">
        <div class="status-info">
          <span class="status-code" :class="statusClass">
            {{ response.status }}
          </span>
          <span class="status-text">{{ statusText }}</span>
        </div>
        <div class="response-time">
          <i class="ri-time-line"></i>
          {{ response.duration }}ms
        </div>
      </div>

      <!-- 响应头 -->
      <div class="response-headers">
        <div class="section-header" @click="toggleHeadersCollapse">
          <h4>
            <i class="ri-file-list-3-line"></i>
            响应头
            <span v-if="headerCount > 0" class="header-count">
              ({{ headerCount }})
            </span>
          </h4>
          <div class="header-actions">
            <ScButton 
              size="small"
              text
              @click.stop="copyHeaders"
              v-if="headerCount > 0"
            >
              <i class="ri-file-copy-line"></i>
              复制
            </ScButton>
            <ScButton 
              size="small"
              text
              @click.stop="toggleHeadersCollapse"
              class="collapse-btn"
            >
              <i
                :class="
                  headersCollapsed
                    ? 'ri-arrow-down-s-line'
                    : 'ri-arrow-up-s-line'
                "
              ></i>
            </ScButton>
          </div>
        </div>
        <el-collapse-transition>
          <div v-show="!headersCollapsed" class="headers-content">
            <div v-if="headerCount === 0" class="empty-state">
              <i class="ri-inbox-line"></i>
              <span>无响应头信息</span>
            </div>
            <div v-else class="headers-table">
              <div
                v-for="(value, key) in response.headers"
                :key="key"
                class="header-row"
              >
                <div class="header-key">{{ key }}</div>
                <div class="header-value">{{ value }}</div>
              </div>
            </div>
          </div>
        </el-collapse-transition>
      </div>

      <!-- 响应体 -->
      <div class="response-body">
        <div class="section-header">
          <h4>
            <i class="ri-code-box-line"></i>
            响应体
            <span v-if="contentType" class="content-type-badge">
              {{ contentType }}
            </span>
          </h4>
          <div class="body-actions">
            <ScButton size="small" text @click="copyResponseBody" v-if="response.data">
              <i class="ri-file-copy-line"></i>
              复制
            </ScButton>
            <ScButton size="small" text @click="downloadResponse" v-if="response.data">
              <i class="ri-download-line"></i>
              下载
            </ScButton>
          </div>
        </div>
        <div class="body-content">
          <div v-if="!response.data" class="empty-state">
            <i class="ri-inbox-line"></i>
            <span>无响应体内容</span>
          </div>
          <!-- JSON 内容 -->
          <div v-else-if="isJson" class="json-viewer">
            <codemirror-editor-vue3
              v-model:value="formattedResponseData"
              :options="jsonEditorOptions"
              :height="editorHeight"
              :read-only="true"
            />
          </div>
          <!-- 图片内容 -->
          <div v-else-if="isImage" class="image-viewer">
            <img
              :src="imageSrc"
              alt="响应图片"
              class="response-image"
              @error="handleImageError"
            />
          </div>
          <!-- HTML 内容 -->
          <div v-else-if="isHtml" class="html-viewer">
            <codemirror-editor-vue3
              :value="String(response.data)"
              :options="htmlEditorOptions"
              :height="editorHeight"
              :read-only="true"
            />
          </div>
          <!-- XML 内容 -->
          <div v-else-if="isXml" class="xml-viewer">
            <codemirror-editor-vue3
              v-model:value="formattedXmlData"
              :options="xmlEditorOptions"
              :height="editorHeight"
              :read-only="true"
            />
          </div>
          <!-- 纯文本内容 -->
          <div v-else class="text-viewer">
            <codemirror-editor-vue3
              :value="String(response.data)"
              :options="textEditorOptions"
              :height="editorHeight"
              :read-only="true"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import CodemirrorEditorVue3 from "codemirror-editor-vue3";
import type { ApiResponse } from "../types";
import {
  getStatusClass,
  getStatusText,
  extractContentType,
  isJsonContentType,
  isImageContentType,
  isHtmlContentType,
  isXmlContentType,
  formatJson,
  formatXml,
  editorConfigs,
} from "../utils";

const props = withDefaults(
  defineProps<{
    /** 响应数据 */
    response: ApiResponse | null;
    /** 编辑器高度 */
    editorHeight?: string;
  }>(),
  {
    editorHeight: "400px",
  }
);

const emit = defineEmits<{
  (e: "copy"): void;
  (e: "download"): void;
}>();

// 内部状态
const headersCollapsed = ref(true);

// 编辑器配置
const jsonEditorOptions = editorConfigs.json;
const htmlEditorOptions = editorConfigs.html;
const xmlEditorOptions = editorConfigs.xml;
const textEditorOptions = editorConfigs.text;

// 计算属性
const statusClass = computed(() => {
  return props.response ? getStatusClass(props.response.status) : "";
});

const statusText = computed(() => {
  return props.response ? getStatusText(props.response.status) : "";
});

const contentType = computed(() => {
  return props.response?.headers
    ? extractContentType(props.response.headers)
    : "";
});

const headerCount = computed(() => {
  return props.response?.headers
    ? Object.keys(props.response.headers).length
    : 0;
});

const isJson = computed(() => {
  return (
    isJsonContentType(contentType.value) ||
    typeof props.response?.data === "object"
  );
});

const isImage = computed(() => {
  return isImageContentType(contentType.value);
});

const isHtml = computed(() => {
  return isHtmlContentType(contentType.value);
});

const isXml = computed(() => {
  return isXmlContentType(contentType.value);
});

const formattedResponseData = computed(() => {
  if (!props.response?.data) return "";
  return formatJson(props.response.data);
});

const formattedXmlData = computed(() => {
  if (!props.response?.data) return "";
  return formatXml(String(props.response.data));
});

const imageSrc = computed(() => {
  if (!props.response?.data) return "";
  if (
    typeof props.response.data === "string" &&
    props.response.data.startsWith("data:")
  ) {
    return props.response.data;
  }
  return "";
});

// 方法
const toggleHeadersCollapse = () => {
  headersCollapsed.value = !headersCollapsed.value;
};

const copyHeaders = () => {
  if (!props.response?.headers) return;

  const headersText = Object.entries(props.response.headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  navigator.clipboard.writeText(headersText).then(() => {
    // 可以添加提示
  });
};

const copyResponseBody = () => {
  if (!props.response?.data) return;

  let content = "";
  if (typeof props.response.data === "string") {
    content = props.response.data;
  } else {
    content = JSON.stringify(props.response.data, null, 2);
  }

  navigator.clipboard.writeText(content).then(() => {
    emit("copy");
  });
};

const downloadResponse = () => {
  if (!props.response?.data) return;

  let content = "";
  let filename = "response";
  let mimeType = "text/plain";

  if (isJson.value) {
    content = formattedResponseData.value;
    filename = "response.json";
    mimeType = "application/json";
  } else if (isXml.value) {
    content = formattedXmlData.value;
    filename = "response.xml";
    mimeType = "application/xml";
  } else if (isHtml.value) {
    content = String(props.response.data);
    filename = "response.html";
    mimeType = "text/html";
  } else {
    content = String(props.response.data);
    filename = "response.txt";
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  emit("download");
};

const handleImageError = () => {
  console.error("图片加载失败");
};
</script>

<style lang="scss" scoped>
.api-response-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;

  .no-result {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .response-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow-y: auto;

    .response-status {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: #f9fafb;
      border-radius: 8px;
      margin-bottom: 16px;

      .status-info {
        display: flex;
        align-items: center;
        gap: 12px;

        .status-code {
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 700;

          &.success {
            background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
            color: #166534;
          }
          &.warning {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            color: #92400e;
          }
          &.error {
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
            color: #dc2626;
          }
          &.danger {
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
            color: #991b1b;
          }
          &.info {
            background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
            color: #3730a3;
          }
        }

        .status-text {
          font-size: 14px;
          color: #6b7280;
        }
      }

      .response-time {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 14px;
        color: #6b7280;

        i {
          color: #9ca3af;
        }
      }
    }

    .response-headers {
      margin-bottom: 16px;

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: #f9fafb;
        border-radius: 8px 8px 0 0;
        cursor: pointer;

        h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #374151;

          i {
            color: #6b7280;
          }

          .header-count {
            font-weight: 400;
            color: #9ca3af;
          }
        }

        .header-actions {
          display: flex;
          gap: 4px;
        }
      }

      .headers-content {
        border: 1px solid #e5e7eb;
        border-top: none;
        border-radius: 0 0 8px 8px;
        padding: 12px 16px;

        .empty-state {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #9ca3af;
          font-size: 14px;
        }

        .headers-table {
          .header-row {
            display: flex;
            padding: 8px 0;
            border-bottom: 1px solid #f3f4f6;

            &:last-child {
              border-bottom: none;
            }

            .header-key {
              width: 200px;
              font-weight: 500;
              color: #374151;
              font-size: 13px;
            }

            .header-value {
              flex: 1;
              color: #6b7280;
              font-size: 13px;
              word-break: break-all;
            }
          }
        }
      }
    }

    .response-body {
      flex: 1;
      display: flex;
      flex-direction: column;

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: #f9fafb;
        border-radius: 8px 8px 0 0;

        h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #374151;

          i {
            color: #6b7280;
          }

          .content-type-badge {
            padding: 2px 8px;
            background: #e0e7ff;
            color: #3730a3;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
          }
        }

        .body-actions {
          display: flex;
          gap: 4px;
        }
      }

      .body-content {
        flex: 1;
        border: 1px solid #e5e7eb;
        border-top: none;
        border-radius: 0 0 8px 8px;
        overflow: hidden;

        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #9ca3af;
          font-size: 14px;
          padding: 40px;
        }

        .json-viewer,
        .html-viewer,
        .xml-viewer,
        .text-viewer {
          height: 100%;
        }

        .image-viewer {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;

          .response-image {
            max-width: 100%;
            max-height: 400px;
            border-radius: 8px;
          }
        }
      }
    }
  }
}
</style>

<template>
  <div class="api-params-editor">
    <div v-if="!api" class="no-selection">
      <ScEmpty description="请选择一个API接口" :image-size="120" />
    </div>
    <div v-else class="api-details">
      <!-- API 基本信息 -->
      <div class="api-header">
        <div class="api-title">
          <span class="method-badge" :class="api.method.toLowerCase()">
            {{ api.method }}
          </span>
          <span class="api-path">{{ api.path }}</span>
        </div>
        <div class="api-summary">{{ api.summary || "无描述" }}</div>

        <!-- 参数控制按钮 -->
        <div class="param-controls">
          <el-button-group size="small">
            <ScButton 
              :type="showOnlyRequired ? 'primary' : ''"
              @click="showOnlyRequired = !showOnlyRequired"
            >
              <i class="ri-star-line"></i>
              {{ showOnlyRequired ? "显示全部" : "仅必填" }}
            </ScButton>
            <ScButton @click="clearAllParams">
              <i class="ri-delete-bin-line"></i>
              清空参数
            </ScButton>
          </el-button-group>
        </div>
      </div>

      <!-- 参数表单 -->
      <div class="params-section">
        <ScTabs v-model="activeParamTab" class="params-tabs">
          <!-- 路径参数 -->
          <ScTabPane 
            v-if="filteredPathParams.length"
            label="路径参数"
            name="path"
          >
            <div class="param-list">
              <div
                v-for="param in filteredPathParams"
                :key="param.name"
                class="param-item"
              >
                <label class="param-label">
                  {{ param.name }}
                  <span v-if="param.required" class="required">*</span>
                  <ScTag 
                    v-if="param.required"
                    type="danger"
                    size="small"
                    class="required-tag"
                  >
                    必填
                  </ScTag>
                </label>
                <ScInput 
                  v-model="internalParamValues.path[param.name]"
                  :placeholder="param.description || `请输入${param.name}`"
                  size="small"
                  @input="emitParamChange"
                />
                <div class="param-desc">{{ param.description }}</div>
              </div>
            </div>
          </ScTabPane>

          <!-- 查询参数 -->
          <ScTabPane 
            v-if="filteredQueryParams.length"
            label="查询参数"
            name="query"
          >
            <div class="param-list">
              <div
                v-for="param in filteredQueryParams"
                :key="param.name"
                class="param-item"
              >
                <label class="param-label">
                  {{ param.name }}
                  <span v-if="param.required" class="required">*</span>
                  <ScTag 
                    v-if="param.required"
                    type="danger"
                    size="small"
                    class="required-tag"
                  >
                    必填
                  </ScTag>
                </label>
                <ScInput 
                  v-model="internalParamValues.query[param.name]"
                  :placeholder="param.description || `请输入${param.name}`"
                  size="small"
                  @input="emitParamChange"
                />
                <div class="param-desc">{{ param.description }}</div>
              </div>
            </div>
          </ScTabPane>

          <!-- 请求体 -->
          <ScTabPane v-if="hasRequestBody" label="请求体" name="body">
            <div class="body-editor">
              <codemirror-editor-vue3
                v-model:value="internalRequestBody"
                :options="requestBodyEditorOptions"
                :height="editorHeight"
                placeholder="请输入JSON格式的请求体"
                @change="emitBodyChange"
              />
            </div>
          </ScTabPane>
        </ScTabs>

        <!-- 请求配置 -->
        <div class="request-config">
          <div class="config-item">
            <span class="config-label">超时时间:</span>
            <ScInputNumber 
              v-model="requestTimeout"
              :min="1000"
              :max="300000"
              :step="1000"
              size="small"
              style="width: 140px"
            />
            <span class="config-unit">ms</span>
          </div>
          <div class="config-item">
            <span class="config-label">重试次数:</span>
            <ScInputNumber 
              v-model="retryCount"
              :min="0"
              :max="5"
              size="small"
              style="width: 100px"
            />
          </div>
        </div>

        <!-- 执行按钮 -->
        <div class="execute-section">
          <ScButton 
            type="primary"
            @click="executeApi"
            :loading="executing"
            size="large"
          >
            <i class="ri-play-line"></i>
            执行请求
          </ScButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

import ScTabPane from "@repo/components/ScTabs";
import { computed, ref, watch, reactive } from "vue";
import CodemirrorEditorVue3 from "codemirror-editor-vue3";
import type { ApiInfo, ParamValues } from "../types";
import { generateExampleRequestBody, editorConfigs } from "../utils";

const props = withDefaults(
  defineProps<{
    /** 选中的 API */
    api: ApiInfo | null;
    /** 参数值 */
    paramValues?: ParamValues;
    /** 请求体 */
    requestBody?: string;
    /** 是否正在执行 */
    executing?: boolean;
    /** 编辑器高度 */
    editorHeight?: string;
  }>(),
  {
    executing: false,
    editorHeight: "300px",
  }
);

const emit = defineEmits<{
  (e: "execute", options: { timeout: number; retryCount: number }): void;
  (e: "update:paramValues", values: ParamValues): void;
  (e: "update:requestBody", body: string): void;
}>();

// 内部状态
const showOnlyRequired = ref(false);
const activeParamTab = ref("path");
const requestTimeout = ref(30000); // 默认 30 秒
const retryCount = ref(0); // 默认不重试

// 内部参数值
const internalParamValues = reactive<ParamValues>({
  path: {},
  query: {},
});

// 内部请求体
const internalRequestBody = ref("");

// 编辑器配置
const requestBodyEditorOptions = editorConfigs.requestBody;

// 计算属性：路径参数
const pathParams = computed(() => {
  return props.api?.parameters?.filter((p) => p.in === "path") || [];
});

// 计算属性：查询参数
const queryParams = computed(() => {
  return props.api?.parameters?.filter((p) => p.in === "query") || [];
});

// 计算属性：过滤后的路径参数
const filteredPathParams = computed(() => {
  return showOnlyRequired.value
    ? pathParams.value.filter((p) => p.required)
    : pathParams.value;
});

// 计算属性：过滤后的查询参数
const filteredQueryParams = computed(() => {
  return showOnlyRequired.value
    ? queryParams.value.filter((p) => p.required)
    : queryParams.value;
});

// 计算属性：是否有请求体
const hasRequestBody = computed(() => {
  if (!props.api) return false;
  const method = props.api.method.toUpperCase();
  return ["POST", "PUT", "PATCH"].includes(method);
});

// 清空所有参数
const clearAllParams = () => {
  internalParamValues.path = {};
  internalParamValues.query = {};
  internalRequestBody.value = "";
  emitParamChange();
  emitBodyChange();
};

// 执行 API
const executeApi = () => {
  emit("execute", {
    timeout: requestTimeout.value,
    retryCount: retryCount.value,
  });
};

// 发送参数变更事件
const emitParamChange = () => {
  emit("update:paramValues", { ...internalParamValues });
};

// 发送请求体变更事件
const emitBodyChange = () => {
  emit("update:requestBody", internalRequestBody.value);
};

// 监听 API 变化，重置参数
watch(
  () => props.api,
  (newApi) => {
    if (newApi) {
      internalParamValues.path = {};
      internalParamValues.query = {};

      // 为 POST/PUT/PATCH 请求设置示例请求体
      if (hasRequestBody.value) {
        internalRequestBody.value = generateExampleRequestBody(newApi);
      } else {
        internalRequestBody.value = "";
      }

      // 设置默认参数标签页
      if (pathParams.value.length > 0) {
        activeParamTab.value = "path";
      } else if (queryParams.value.length > 0) {
        activeParamTab.value = "query";
      } else if (hasRequestBody.value) {
        activeParamTab.value = "body";
      }

      emitParamChange();
      emitBodyChange();
    }
  },
  { immediate: true }
);

// 监听外部参数值变化
watch(
  () => props.paramValues,
  (newValues) => {
    if (newValues) {
      internalParamValues.path = { ...newValues.path };
      internalParamValues.query = { ...newValues.query };
    }
  },
  { deep: true }
);

// 监听外部请求体变化
watch(
  () => props.requestBody,
  (newBody) => {
    if (newBody !== undefined) {
      internalRequestBody.value = newBody;
    }
  }
);
</script>

<style lang="scss" scoped>
.api-params-editor {
  height: 100%;
  display: flex;
  flex-direction: column;

  .no-selection {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .api-details {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 20px;

    .api-header {
      margin-bottom: 20px;

      .api-title {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;

        .method-badge {
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;

          &.get {
            background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
            color: #166534;
          }
          &.post {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            color: #1d4ed8;
          }
          &.put {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            color: #92400e;
          }
          &.delete {
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
            color: #dc2626;
          }
          &.patch {
            background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
            color: #7c3aed;
          }
        }

        .api-path {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
          word-break: break-all;
        }
      }

      .api-summary {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 12px;
      }

      .param-controls {
        display: flex;
        gap: 8px;
      }
    }

    .params-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      .params-tabs {
        flex: 1;
        display: flex;
        flex-direction: column;

        :deep(.el-tabs__content) {
          flex: 1;
          overflow-y: auto;
        }
      }

      .param-list {
        .param-item {
          margin-bottom: 16px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 8px;

          .param-label {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 14px;
            font-weight: 500;
            color: #374151;
            margin-bottom: 8px;

            .required {
              color: #ef4444;
            }

            .required-tag {
              font-size: 10px;
            }
          }

          .param-desc {
            font-size: 12px;
            color: #9ca3af;
            margin-top: 6px;
          }
        }
      }

      .body-editor {
        height: 100%;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
      }

      .request-config {
        display: flex;
        gap: 20px;
        padding: 12px;
        background: #f0f9ff;
        border-radius: 8px;
        margin-top: 12px;

        .config-item {
          display: flex;
          align-items: center;
          gap: 8px;

          .config-label {
            font-size: 13px;
            color: #374151;
            white-space: nowrap;
          }

          .config-unit {
            font-size: 12px;
            color: #6b7280;
          }
        }
      }

      .execute-section {
        padding: 16px 0;
        border-top: 1px solid #e5e7eb;
        margin-top: 16px;

        .el-button {
          width: 100%;
        }
      }
    }
  }
}
</style>

<template>
  <div class="global-headers-manager">
    <!-- 预览区域 -->
    <div class="headers-preview">
      <div class="preview-header">
        <label class="label">全局请求头:</label>
        <el-button @click="showDialog = true" size="small" type="primary" plain>
          <i class="ri-settings-3-line"></i>
          设置
        </el-button>
      </div>
      <div class="preview-content" v-if="headerCount > 0">
        <div
          v-for="(value, key) in headers"
          :key="key"
          class="header-item"
        >
          <span class="header-key">{{ key }}:</span>
          <span class="header-value">{{ maskValue(String(value)) }}</span>
        </div>
      </div>
      <div v-else class="no-headers">
        <span class="placeholder-text">未设置全局请求头</span>
      </div>
    </div>

    <!-- 设置对话框 -->
    <el-dialog
      v-model="showDialog"
      title="全局请求头设置"
      width="600px"
      :before-close="handleDialogClose"
    >
      <div class="header-dialog-content">
        <div class="dialog-description">
          <p>设置的全局请求头将应用于所有API请求</p>
        </div>

        <div class="header-list">
          <div
            v-for="(header, index) in tempHeaders"
            :key="index"
            class="header-row"
          >
            <el-input
              v-model="header.key"
              placeholder="请求头名称"
              size="small"
              style="flex: 1"
            />
            <el-input
              v-model="header.value"
              placeholder="请求头值"
              size="small"
              style="flex: 2; margin-left: 8px"
            />
            <el-button
              @click="removeHeader(index)"
              size="small"
              type="danger"
              plain
              style="margin-left: 8px"
            >
              <i class="ri-delete-bin-line"></i>
            </el-button>
          </div>
        </div>

        <div class="header-actions">
          <el-button @click="addHeader" size="small" type="primary" plain>
            <i class="ri-add-line"></i>
            添加请求头
          </el-button>
          <el-button @click="addCommonHeaders" size="small" type="success" plain>
            <i class="ri-magic-line"></i>
            添加常用请求头
          </el-button>
        </div>

        <div class="common-headers-tips">
          <el-collapse>
            <el-collapse-item title="常用请求头示例" name="examples">
              <div class="examples-list">
                <div class="example-item">
                  <strong>Authorization:</strong> Bearer your-token-here
                </div>
                <div class="example-item">
                  <strong>Content-Type:</strong> application/json
                </div>
                <div class="example-item">
                  <strong>Accept:</strong> application/json
                </div>
                <div class="example-item">
                  <strong>X-API-Key:</strong> your-api-key
                </div>
                <div class="example-item">
                  <strong>User-Agent:</strong> ApiDocumentation/1.0
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="resetHeaders" size="small">
            <i class="ri-refresh-line"></i>
            重置
          </el-button>
          <el-button @click="showDialog = false" size="small"> 取消 </el-button>
          <el-button @click="saveHeaders" type="primary" size="small">
            <i class="ri-save-line"></i>
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from "vue";
import type { HeaderConfig } from "../types";
import { COMMON_HEADERS } from "../utils";

const props = withDefaults(
  defineProps<{
    /** 当前请求头 */
    headers?: Record<string, string>;
    /** 存储键名 */
    storageKey?: string;
    /** 是否显示值掩码（用于敏感信息） */
    maskSensitiveValues?: boolean;
  }>(),
  {
    headers: () => ({}),
    storageKey: "apiDocGlobalHeaders",
    maskSensitiveValues: true,
  }
);

const emit = defineEmits<{
  (e: "update:headers", headers: Record<string, string>): void;
  (e: "save", headers: Record<string, string>): void;
}>();

// 内部状态
const showDialog = ref(false);
const tempHeaders = ref<HeaderConfig[]>([]);

// 计算属性
const headerCount = computed(() => {
  return Object.keys(props.headers).length;
});

// 敏感值掩码
const maskValue = (value: string): string => {
  if (!props.maskSensitiveValues) return value;
  
  // 对可能包含敏感信息的值进行掩码处理
  if (value.length > 8) {
    return value.substring(0, 4) + "****" + value.substring(value.length - 4);
  }
  return value;
};

// 添加请求头
const addHeader = () => {
  tempHeaders.value.push({ key: "", value: "" });
};

// 移除请求头
const removeHeader = (index: number) => {
  tempHeaders.value.splice(index, 1);
};

// 添加常用请求头
const addCommonHeaders = () => {
  COMMON_HEADERS.forEach((header) => {
    const exists = tempHeaders.value.some((h) => h.key === header.key);
    if (!exists) {
      tempHeaders.value.push({ ...header });
    }
  });
};

// 重置请求头
const resetHeaders = () => {
  tempHeaders.value = [];
  emit("update:headers", {});
};

// 保存请求头
const saveHeaders = () => {
  const validHeaders: Record<string, string> = {};
  tempHeaders.value.forEach((header) => {
    if (header.key.trim() && header.value.trim()) {
      validHeaders[header.key.trim()] = header.value.trim();
    }
  });

  emit("update:headers", validHeaders);
  emit("save", validHeaders);

  // 保存到本地存储
  if (props.storageKey) {
    try {
      localStorage.setItem(props.storageKey, JSON.stringify(validHeaders));
    } catch (error) {
      console.error("保存请求头到本地存储失败:", error);
    }
  }

  showDialog.value = false;
};

// 处理对话框关闭
const handleDialogClose = () => {
  // 恢复临时数据
  tempHeaders.value = Object.entries(props.headers).map(([key, value]) => ({
    key,
    value,
  }));
  showDialog.value = false;
};

// 从本地存储加载
const loadFromStorage = () => {
  if (!props.storageKey) return;

  try {
    const saved = localStorage.getItem(props.storageKey);
    if (saved) {
      const headers = JSON.parse(saved);
      emit("update:headers", headers);
    }
  } catch (error) {
    console.error("从本地存储加载请求头失败:", error);
  }
};

// 监听对话框打开
watch(showDialog, (newValue) => {
  if (newValue) {
    tempHeaders.value = Object.entries(props.headers).map(([key, value]) => ({
      key,
      value,
    }));
    if (tempHeaders.value.length === 0) {
      tempHeaders.value.push({ key: "", value: "" });
    }
  }
});

// 组件挂载时加载本地存储
onMounted(() => {
  loadFromStorage();
});
</script>

<style lang="scss" scoped>
.global-headers-manager {
  .headers-preview {
    padding: 12px;
    background: #f9fafb;
    border-radius: 8px;
    border: 1px solid #e5e7eb;

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .label {
        font-size: 13px;
        font-weight: 500;
        color: #374151;
      }
    }

    .preview-content {
      .header-item {
        display: flex;
        margin-bottom: 4px;
        font-size: 12px;

        .header-key {
          font-weight: 500;
          color: #6b7280;
          margin-right: 4px;
        }

        .header-value {
          color: #374151;
          word-break: break-all;
          flex: 1;
        }
      }
    }

    .no-headers {
      .placeholder-text {
        font-size: 12px;
        color: #9ca3af;
        font-style: italic;
      }
    }
  }

  .header-dialog-content {
    .dialog-description {
      margin-bottom: 16px;

      p {
        font-size: 14px;
        color: #6b7280;
        margin: 0;
      }
    }

    .header-list {
      max-height: 300px;
      overflow-y: auto;

      .header-row {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
      }
    }

    .header-actions {
      margin-top: 16px;
      display: flex;
      gap: 8px;
    }

    .common-headers-tips {
      margin-top: 16px;

      .examples-list {
        .example-item {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 8px;

          strong {
            color: #374151;
          }
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}
</style>

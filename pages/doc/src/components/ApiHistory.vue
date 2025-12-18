<template>
  <div class="api-history">
    <!-- 头部 -->
    <div class="history-header">
      <div class="header-title">
        <i class="ri-history-line"></i>
        <span>请求历史</span>
        <el-badge :value="historyList.length" :max="99" type="info" />
      </div>
      <div class="header-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索..."
          size="small"
          clearable
          class="search-input"
        >
          <template #prefix>
            <i class="ri-search-line"></i>
          </template>
        </el-input>
        <el-button size="small" @click="loadHistory">
          <i class="ri-refresh-line"></i>
        </el-button>
        <el-popconfirm
          title="确定要清空所有历史记录吗？"
          @confirm="handleClearAll"
        >
          <template #reference>
            <el-button size="small" type="danger" :disabled="historyList.length === 0">
              <i class="ri-delete-bin-line"></i>
              清空
            </el-button>
          </template>
        </el-popconfirm>
      </div>
    </div>

    <!-- 历史列表 -->
    <div class="history-list" v-loading="loading">
      <el-scrollbar height="100%">
        <div v-if="filteredList.length === 0" class="empty-state">
          <i class="ri-inbox-line"></i>
          <span>暂无历史记录</span>
        </div>
        <div
          v-else
          v-for="item in filteredList"
          :key="item.id"
          class="history-item"
          :class="{ active: selectedId === item.id }"
          @click="handleSelect(item)"
        >
          <div class="item-header">
            <el-tag
              :type="getMethodTagType(item.method)"
              size="small"
              class="method-tag"
            >
              {{ item.method }}
            </el-tag>
            <span class="item-path" :title="item.path">{{ item.path }}</span>
            <el-tag
              v-if="item.statusCode"
              :type="getStatusTagType(item.statusCode)"
              size="small"
              class="status-tag"
            >
              {{ item.statusCode }}
            </el-tag>
          </div>
          <div class="item-footer">
            <span class="item-time">
              <i class="ri-time-line"></i>
              {{ formatTime(item.createdAt) }}
            </span>
            <span v-if="item.duration" class="item-duration">
              {{ item.duration }}ms
            </span>
            <el-button
              class="delete-btn"
              size="small"
              text
              type="danger"
              @click.stop="handleDelete(item)"
            >
              <i class="ri-delete-bin-line"></i>
            </el-button>
          </div>
        </div>
      </el-scrollbar>
    </div>

    <!-- 详情对话框 -->
    <el-drawer
      v-model="detailVisible"
      title="请求详情"
      direction="rtl"
      size="50%"
    >
      <template v-if="selectedItem">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="请求方法">
            <el-tag :type="getMethodTagType(selectedItem.method)" size="small">
              {{ selectedItem.method }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="请求路径">
            {{ selectedItem.path }}
          </el-descriptions-item>
          <el-descriptions-item label="完整URL">
            <el-link type="primary" :href="selectedItem.url" target="_blank">
              {{ selectedItem.url }}
            </el-link>
          </el-descriptions-item>
          <el-descriptions-item label="状态码">
            <el-tag :type="getStatusTagType(selectedItem.statusCode || 0)" size="small">
              {{ selectedItem.statusCode || '-' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="耗时">
            {{ selectedItem.duration ? selectedItem.duration + 'ms' : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="请求时间">
            {{ formatTime(selectedItem.createdAt, true) }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">请求头</el-divider>
        <div class="json-block">
          <pre>{{ formatJson(selectedItem.headers) }}</pre>
        </div>

        <el-divider content-position="left">请求参数</el-divider>
        <div class="json-block">
          <pre>{{ formatJson(selectedItem.params) }}</pre>
        </div>

        <el-divider v-if="selectedItem.requestBody" content-position="left">请求体</el-divider>
        <div v-if="selectedItem.requestBody" class="json-block">
          <pre>{{ formatJson(selectedItem.requestBody) }}</pre>
        </div>

        <el-divider content-position="left">响应数据</el-divider>
        <div class="json-block response-block">
          <pre>{{ formatJson(selectedItem.responseData) }}</pre>
        </div>
      </template>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleReplay">
          <i class="ri-repeat-line"></i>
          重新请求
        </el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { DocStorage, type ApiHistoryRecord } from "../storage";

const emit = defineEmits<{
  (e: "select", item: ApiHistoryRecord): void;
  (e: "replay", item: ApiHistoryRecord): void;
}>();

// 状态
const loading = ref(false);
const searchKeyword = ref("");
const historyList = ref<ApiHistoryRecord[]>([]);
const selectedId = ref<number | null>(null);
const selectedItem = ref<ApiHistoryRecord | null>(null);
const detailVisible = ref(false);

// 过滤后的列表
const filteredList = computed(() => {
  if (!searchKeyword.value) return historyList.value;
  const keyword = searchKeyword.value.toLowerCase();
  return historyList.value.filter(
    (item) =>
      item.path.toLowerCase().includes(keyword) ||
      item.method.toLowerCase().includes(keyword) ||
      item.url.toLowerCase().includes(keyword)
  );
});

// 方法类型颜色
const getMethodTagType = (method: string): string => {
  const types: Record<string, string> = {
    GET: "success",
    POST: "primary",
    PUT: "warning",
    DELETE: "danger",
    PATCH: "info",
  };
  return types[method.toUpperCase()] || "info";
};

// 状态码颜色
const getStatusTagType = (status: number): string => {
  if (status >= 200 && status < 300) return "success";
  if (status >= 300 && status < 400) return "warning";
  if (status >= 400) return "danger";
  return "info";
};

// 格式化时间
const formatTime = (timestamp: number, full = false): string => {
  const date = new Date(timestamp);
  if (full) {
    return date.toLocaleString();
  }
  const now = new Date();
  const diff = now.getTime() - timestamp;

  if (diff < 60000) return "刚刚";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;

  return date.toLocaleDateString();
};

// 格式化 JSON
const formatJson = (data: any): string => {
  if (!data) return "-";
  if (typeof data === "string") {
    try {
      return JSON.stringify(JSON.parse(data), null, 2);
    } catch {
      return data;
    }
  }
  return JSON.stringify(data, null, 2);
};

// 加载历史记录
const loadHistory = async () => {
  loading.value = true;
  try {
    historyList.value = await DocStorage.getHistoryList(200);
  } catch (error) {
    console.error("Failed to load history:", error);
    ElMessage.error("加载历史记录失败");
  } finally {
    loading.value = false;
  }
};

// 选择历史记录
const handleSelect = (item: ApiHistoryRecord) => {
  selectedId.value = item.id!;
  selectedItem.value = item;
  detailVisible.value = true;
  emit("select", item);
};

// 删除历史记录
const handleDelete = async (item: ApiHistoryRecord) => {
  try {
    await DocStorage.deleteHistory(item.id!);
    historyList.value = historyList.value.filter((h) => h.id !== item.id);
    ElMessage.success("删除成功");
  } catch (error) {
    console.error("Failed to delete history:", error);
    ElMessage.error("删除失败");
  }
};

// 清空所有
const handleClearAll = async () => {
  try {
    await DocStorage.clearHistory();
    historyList.value = [];
    ElMessage.success("已清空所有历史记录");
  } catch (error) {
    console.error("Failed to clear history:", error);
    ElMessage.error("清空失败");
  }
};

// 重新请求
const handleReplay = () => {
  if (selectedItem.value) {
    emit("replay", selectedItem.value);
    detailVisible.value = false;
  }
};

// 添加历史记录（供外部调用）
const addHistory = async (record: Omit<ApiHistoryRecord, "id">) => {
  try {
    await DocStorage.addHistory(record);
    await loadHistory();
  } catch (error) {
    console.error("Failed to add history:", error);
  }
};

// 生命周期
onMounted(() => {
  loadHistory();
});

// 暴露方法
defineExpose({
  loadHistory,
  addHistory,
});
</script>

<style lang="scss" scoped>
.api-history {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border-radius: 8px;

  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .header-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      i {
        font-size: 18px;
        color: var(--el-color-primary);
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;

      .search-input {
        width: 150px;
      }
    }
  }

  .history-list {
    flex: 1;
    overflow: hidden;
    padding: 8px;

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: var(--el-text-color-placeholder);

      i {
        font-size: 48px;
        margin-bottom: 12px;
      }
    }

    .history-item {
      padding: 10px 12px;
      margin-bottom: 6px;
      border-radius: 8px;
      background: var(--el-fill-color-lighter);
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: var(--el-fill-color);
      }

      &.active {
        background: var(--el-color-primary-light-9);
        border: 1px solid var(--el-color-primary-light-5);
      }

      .item-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;

        .method-tag {
          font-weight: 600;
          font-size: 10px;
        }

        .item-path {
          flex: 1;
          font-size: 13px;
          color: var(--el-text-color-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .status-tag {
          font-size: 10px;
        }
      }

      .item-footer {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 12px;
        color: var(--el-text-color-secondary);

        .item-time {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .item-duration {
          color: var(--el-color-success);
        }

        .delete-btn {
          margin-left: auto;
          opacity: 0;
          transition: opacity 0.2s;
        }
      }

      &:hover .delete-btn {
        opacity: 1;
      }
    }
  }
}

.json-block {
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  padding: 12px;
  max-height: 200px;
  overflow: auto;

  pre {
    margin: 0;
    font-family: "Fira Code", monospace;
    font-size: 12px;
    white-space: pre-wrap;
    word-break: break-all;
  }

  &.response-block {
    max-height: 400px;
  }
}
</style>

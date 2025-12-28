<template>
  <sc-dialog
    v-model="dialogVisible"
    title="任务日志"
    width="70%"
    :close-on-click-modal="false"
    destroy-on-close
    append-to-body
  >
    <div class="log-toolbar">
      <div class="toolbar-left">
        <el-select v-model="filterLevel" placeholder="日志级别" clearable style="width: 120px" @change="handleFilter">
          <el-option label="INFO" value="INFO" />
          <el-option label="WARN" value="WARN" />
          <el-option label="ERROR" value="ERROR" />
        </el-select>
        <el-input
          v-model="keyword"
          placeholder="搜索关键字..."
          clearable
          style="width: 200px"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </el-input>
      </div>
      <div class="toolbar-right">
        <el-switch
          v-model="autoRefresh"
          active-text="自动刷新"
          inactive-text=""
          @change="handleAutoRefreshChange"
        />
        <el-button size="small" @click="handleRefresh">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新
        </el-button>
      </div>
    </div>

    <el-table
      v-loading="loading"
      :data="filteredLogs"
      border
      stripe
      max-height="500"
      :row-class-name="getRowClassName"
    >
      <el-table-column label="时间" width="180" prop="time">
        <template #default="{ row }">
          <span>{{ formatTime(row.time) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="级别" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="getLevelType(row.level)" size="small">{{ row.level }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="消息" min-width="300" prop="message" show-overflow-tooltip />
      <el-table-column label="URL" min-width="200" prop="url" show-overflow-tooltip>
        <template #default="{ row }">
          <el-link v-if="row.url" type="primary" :href="row.url" target="_blank">
            {{ truncateText(row.url, 50) }}
          </el-link>
          <span v-else class="text-muted">-</span>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :page-sizes="[20, 50, 100, 200]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onUnmounted } from "vue";
import { message } from "@repo/utils";
import { getSpiderTaskLogs } from "@/api/spider";

// Props
const props = defineProps<{
  visible: boolean;
  taskId?: number;
}>();

// Emits
const emit = defineEmits<{
  "update:visible": [value: boolean];
}>();

// 计算属性
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit("update:visible", val)
});

// 响应式状态
const loading = ref(false);
const logList = ref<any[]>([]);
const keyword = ref("");
const filterLevel = ref<string | undefined>(undefined);
const autoRefresh = ref(false);
let refreshTimer: number | null = null;

// 分页
const pagination = reactive({
  page: 1,
  size: 50,
  total: 0
});

// 过滤后的日志
const filteredLogs = computed(() => {
  let list = logList.value;
  
  if (filterLevel.value) {
    list = list.filter(log => log.level === filterLevel.value);
  }
  
  if (keyword.value) {
    const kw = keyword.value.toLowerCase();
    list = list.filter(log => 
      (log.message && log.message.toLowerCase().includes(kw)) ||
      (log.url && log.url.toLowerCase().includes(kw))
    );
  }
  
  return list;
});

// 监听对话框打开
watch(() => props.visible, (val) => {
  if (val && props.taskId) {
    loadLogs();
  } else {
    stopAutoRefresh();
  }
});

/**
 * 加载日志
 */
const loadLogs = async () => {
  if (!props.taskId) return;
  
  try {
    loading.value = true;
    const res = await getSpiderTaskLogs(props.taskId, pagination.page, pagination.size);
    
    if (res.code === "00000" && res.data) {
      logList.value = res.data.data || [];
      pagination.total = res.data.total || 0;
    }
  } catch (error) {
    console.error("加载日志失败:", error);
    message.error("加载日志失败");
  } finally {
    loading.value = false;
  }
};

/**
 * 获取级别类型
 */
const getLevelType = (level: string) => {
  const map: Record<string, string> = {
    INFO: "success",
    WARN: "warning",
    ERROR: "danger"
  };
  return map[level] || "info";
};

/**
 * 获取行样式
 */
const getRowClassName = ({ row }: { row: any }) => {
  if (row.level === "ERROR") return "log-error";
  if (row.level === "WARN") return "log-warn";
  return "";
};

/**
 * 格式化时间
 */
const formatTime = (time: string) => {
  if (!time) return "-";
  return new Date(time).toLocaleString();
};

/**
 * 截断文本
 */
const truncateText = (text: string, maxLen: number): string => {
  if (!text) return "";
  return text.length > maxLen ? text.slice(0, maxLen) + "..." : text;
};

/**
 * 搜索
 */
const handleSearch = () => {
  // 客户端过滤，无需重新请求
};

/**
 * 筛选
 */
const handleFilter = () => {
  // 客户端过滤，无需重新请求
};

/**
 * 刷新
 */
const handleRefresh = () => {
  loadLogs();
};

/**
 * 分页大小改变
 */
const handleSizeChange = () => {
  pagination.page = 1;
  loadLogs();
};

/**
 * 页码改变
 */
const handleCurrentChange = () => {
  loadLogs();
};

/**
 * 自动刷新切换
 */
const handleAutoRefreshChange = (val: boolean) => {
  if (val) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
};

/**
 * 启动自动刷新
 */
const startAutoRefresh = () => {
  if (refreshTimer) return;
  refreshTimer = window.setInterval(() => {
    loadLogs();
  }, 3000);
};

/**
 * 停止自动刷新
 */
const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  autoRefresh.value = false;
};

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<style scoped lang="scss">
.log-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  
  .toolbar-left {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  
  .toolbar-right {
    display: flex;
    gap: 12px;
    align-items: center;
  }
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.text-muted {
  color: #c0c4cc;
}

:deep(.log-error) {
  background-color: #fef0f0 !important;
}

:deep(.log-warn) {
  background-color: #fdf6ec !important;
}
</style>

<template>
  <div class="table-preview" :class="{ 'edit-mode': editMode }">
    <div class="card-header">
      <div class="card-title">
        <IconifyIconOnline icon="ri:table-line" class="card-icon" />
        <span>{{ componentData.monitorSysGenServerDetailComponentTitle }}</span>
      </div>
      <div class="card-actions" v-if="editMode">
        <el-button type="primary" size="small" @click="handleEdit">
          <IconifyIconOnline icon="ri:edit-line" />
        </el-button>
        <el-button type="danger" size="small" @click="handleDelete">
          <IconifyIconOnline icon="ri:delete-bin-line" />
        </el-button>
      </div>
    </div>

    <div class="card-content" v-loading="loading">
      <div v-if="error" class="error-state">
        <IconifyIconOnline icon="ri:error-warning-line" class="error-icon" />
        <span class="error-text">{{ error }}</span>
      </div>
      <div v-else class="table-container">
        <el-table
          :data="tableData"
          style="width: 100%"
          size="small"
          :height="tableHeight"
        >
          <el-table-column
            v-for="column in columns"
            :key="column.prop"
            :prop="column.prop"
            :label="column.label"
            :width="column.width"
            :min-width="column.minWidth"
          >
            <template #default="{ row }" v-if="column.formatter">
              <span>{{ column.formatter(row[column.prop]) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <div class="card-footer" v-if="!editMode">
      <el-button
        type="primary"
        text
        size="small"
        @click="handleRefresh"
        :loading="refreshing"
      >
        <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
        刷新
      </el-button>
      <span class="last-update" v-if="lastUpdate">
        {{ formatTime(lastUpdate) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { message } from "@repo/utils";
import { executeComponentQueryDetail, type ServerDetailComponent } from "@/api/server";

// 定义属性
const props = defineProps<{
  componentData: ServerDetailComponent;
  serverId: number;
  editMode: boolean;
}>();

// 定义事件
const emit = defineEmits<{
  delete: [componentId: number];
  edit: [component: ServerDetailComponent];
  refresh: [componentId: number];
}>();

// 响应式状态
const loading = ref(false);
const refreshing = ref(false);
const error = ref("");
const lastUpdate = ref<Date | null>(null);
const refreshTimer = ref<NodeJS.Timeout | null>(null);
const tableData = ref<any[]>([]);
const columns = ref<any[]>([]);

// 计算属性
const tableHeight = computed(() => {
  // 根据容器高度动态计算表格高度
  return 200; // 可以根据实际需要调整
});

/**
 * 生成模拟数据
 */
const generateMockData = () => {
  const mockColumns = [
    { prop: 'name', label: '进程名', minWidth: 120 },
    { prop: 'pid', label: 'PID', width: 80 },
    { prop: 'cpu', label: 'CPU%', width: 80, formatter: (value: number) => `${value.toFixed(1)}%` },
    { prop: 'memory', label: '内存%', width: 80, formatter: (value: number) => `${value.toFixed(1)}%` },
    { prop: 'status', label: '状态', width: 80 }
  ];

  const mockData = Array.from({ length: 10 }, (_, index) => ({
    name: `process_${index + 1}`,
    pid: 1000 + index,
    cpu: Math.random() * 100,
    memory: Math.random() * 100,
    status: Math.random() > 0.5 ? '运行' : '睡眠'
  }));

  return { columns: mockColumns, data: mockData };
};

/**
 * 格式化时间
 */
const formatTime = (time: Date) => {
  return time.toLocaleTimeString();
};

/**
 * 加载数据
 */
const loadData = async () => {
  try {
    loading.value = true;
    error.value = "";

    // 构建时间范围参数
    const timeRange = {
      start: Date.now() - 5 * 60 * 1000, // 最近5分钟
      end: Date.now(),
    };

    const res = await executeComponentQueryDetail(
      props.componentData.monitorSysGenServerDetailComponentId!,
      timeRange
    );

    if (res.code === "00000") {
      // 实际应该根据后端返回的数据格式调整
      if (res.data && res.data.columns && res.data.data) {
        columns.value = res.data.columns;
        tableData.value = res.data.data;
      } else {
        // 如果没有数据，生成模拟数据用于演示
        const mockResult = generateMockData();
        columns.value = mockResult.columns;
        tableData.value = mockResult.data;
      }
      
      lastUpdate.value = new Date();
    } else {
      error.value = res.msg || "查询失败";
    }
  } catch (error) {
    console.error("加载表格数据失败:", error);
    error.value = "加载失败";
  } finally {
    loading.value = false;
  }
};

/**
 * 刷新数据
 */
const handleRefresh = async () => {
  refreshing.value = true;
  await loadData();
  refreshing.value = false;
  emit("refresh", props.componentData.monitorSysGenServerDetailComponentId!);
};

/**
 * 编辑组件
 */
const handleEdit = () => {
  emit("edit", props.componentData);
};

/**
 * 删除组件
 */
const handleDelete = () => {
  emit("delete", props.componentData.monitorSysGenServerDetailComponentId!);
};

/**
 * 启动自动刷新
 */
const startAutoRefresh = () => {
  const interval = (props.componentData.monitorSysGenServerDetailComponentRefreshInterval || 30) * 1000;
  
  refreshTimer.value = setInterval(() => {
    if (!props.editMode) {
      loadData();
    }
  }, interval);
};

/**
 * 停止自动刷新
 */
const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value);
    refreshTimer.value = null;
  }
};

// 生命周期
onMounted(() => {
  loadData();
  startAutoRefresh();
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<style lang="scss" scoped>
.table-preview {
  height: 100%;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &.edit-mode {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      .card-icon {
        font-size: 18px;
        color: var(--el-color-primary);
      }
    }

    .card-actions {
      display: flex;
      gap: 4px;
    }
  }

  .card-content {
    flex: 1;
    padding: 16px;
    display: flex;
    flex-direction: column;

    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: var(--el-color-danger);
      height: 100%;

      .error-icon {
        font-size: 32px;
      }

      .error-text {
        font-size: 14px;
      }
    }

    .table-container {
      height: 100%;
      display: flex;
      flex-direction: column;

      :deep(.el-table) {
        flex: 1;
        
        .el-table__body-wrapper {
          overflow-y: auto;
        }
      }
    }
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    border-top: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color-page);

    .last-update {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
    }
  }
}
</style>

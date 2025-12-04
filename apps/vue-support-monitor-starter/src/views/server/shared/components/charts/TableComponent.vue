<template>
  <div class="table-component">
    <div class="table-header">
      <div class="table-title">
        <IconifyIconOnline icon="ri:table-line" class="table-icon" />
        <span>{{ componentData.monitorSysGenServerDetailComponentTitle }}</span>
      </div>
      <div class="table-actions" v-if="editMode">
        <el-button type="primary" text size="small" @click="handleEdit">
          <IconifyIconOnline icon="ri:edit-line" />
        </el-button>
        <el-button type="danger" text size="small" @click="handleDelete">
          <IconifyIconOnline icon="ri:delete-bin-line" />
        </el-button>
      </div>
    </div>
    
    <div class="table-content" v-loading="loading">
      <el-table :data="tableData" style="width: 100%" size="small" stripe>
        <el-table-column
          v-for="column in columns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
        />
      </el-table>
    </div>

    <div class="table-footer" v-if="!editMode">
      <el-button type="primary" text size="small" @click="handleRefresh" :loading="refreshing">
        <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
        刷新
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { type ServerDetailComponent } from "@/api/monitor/gen/server";

const props = defineProps<{
  componentData: ServerDetailComponent;
  serverId: number;
  editMode: boolean;
}>();

const emit = defineEmits<{
  delete: [componentId: number];
  edit: [component: ServerDetailComponent];
  refresh: [componentId: number];
}>();

const loading = ref(false);
const refreshing = ref(false);

// 示例数据
const tableData = ref([
  { name: 'CPU使用�?, value: '45%', status: '正常' },
  { name: '内存使用�?, value: '68%', status: '正常' },
  { name: '磁盘使用�?, value: '82%', status: '警告' },
  { name: '网络IO', value: '1.2MB/s', status: '正常' },
]);

const columns = computed(() => [
  { prop: 'name', label: '指标名称', width: '120' },
  { prop: 'value', label: '当前�?, width: '100' },
  { prop: 'status', label: '状�?, width: '80' },
]);

const handleRefresh = () => {
  refreshing.value = true;
  setTimeout(() => {
    refreshing.value = false;
    emit("refresh", props.componentData.monitorSysGenServerDetailComponentId!);
  }, 1000);
};

const handleEdit = () => emit("edit", props.componentData);
const handleDelete = () => emit("delete", props.componentData.monitorSysGenServerDetailComponentId!);
</script>

<style lang="scss" scoped>
.table-component {
  height: 100%;
  background: var(--el-bg-color-overlay);
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--el-color-primary-light-7);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--el-border-color-extra-light);

  .table-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);

    .table-icon {
      font-size: 16px;
      color: var(--el-color-primary);
    }
  }

  .table-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover .table-actions {
    opacity: 1;
  }
}

.table-content {
  flex: 1;
  padding: 16px;
  overflow: auto;
}

.table-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--el-border-color-extra-light);
  display: flex;
  justify-content: center;
}
</style>

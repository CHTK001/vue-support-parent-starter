<template>
  <div class="table-component system-container modern-bg">
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
import { type ServerDetailComponent } from "@/api/server";

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
  { name: 'CPU使用率', value: '45%', status: '正常' },
  { name: '内存使用率', value: '68%', status: '正常' },
  { name: '磁盘使用率', value: '82%', status: '警告' },
  { name: '网络IO', value: '1.2MB/s', status: '正常' },
]);

const columns = computed(() => [
  { prop: 'name', label: '指标名称', width: '120' },
  { prop: 'value', label: '当前值', width: '100' },
  { prop: 'status', label: '状态', width: '80' },
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
@use "@/styles/mixins.scss" as *;
@use "@/styles/variables.scss" as *;

.modern-bg {
  position: relative;
  overflow: hidden;

  // 渐变背景
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    @include gradient-bg;
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}

.table-component {
  height: 100%;
  @include glass-effect(0.9, 16px);
  border-radius: $radius-lg;
  border: 1px solid $border-light;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all $duration-normal $ease-standard;
  position: relative;
  box-shadow: $shadow-md;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: $gradient-line-top;
    opacity: 0;
    transition: opacity $duration-normal ease;
  }

  &:hover {
    border-color: $border-primary;
    box-shadow: $shadow-hover-md;
    transform: translateY(-2px);

    &::before {
      opacity: 1;
    }
  }

  &:active {
    transform: translateY(0);
  }
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg $spacing-xl $spacing-md;
  border-bottom: 1px solid $border-light;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: $spacing-xl;
    right: $spacing-xl;
    height: 1px;
    background: $gradient-line;
    opacity: 0.5;
  }

  .table-title {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    font-size: $font-md;
    font-weight: $font-weight-semibold;
    color: var(--el-text-color-primary);
    transition: all $duration-fast ease;

    .table-icon {
      font-size: $icon-lg;
      color: var(--el-color-primary);
      transition: transform $duration-normal $ease-standard;
    }

    &:hover .table-icon {
      transform: scale(1.1) rotate(5deg);
    }
  }

  .table-actions {
    display: flex;
    gap: $spacing-xs;
    opacity: 0;
    transition: opacity $duration-normal $ease-standard;

    .el-button {
      border-radius: $radius-sm;
      transition: all $duration-fast ease;

      &:hover {
        transform: scale(1.1);
      }
    }
  }

  &:hover .table-actions {
    opacity: 1;
  }
}

.table-content {
  flex: 1;
  padding: $spacing-lg;
  overflow: auto;
  @include custom-scrollbar;

  :deep(.el-table) {
    border-radius: $radius-md;
    overflow: hidden;

    .el-table__header {
      th {
        background: rgba(0, 0, 0, 0.02);
        font-weight: $font-weight-semibold;
        color: var(--el-text-color-primary);
      }
    }

    .el-table__body {
      tr {
        transition: all $duration-fast ease;

        &:hover {
          background: rgba(0, 0, 0, 0.02);
          transform: scale(1.01);
        }
      }
    }
  }
}

.table-footer {
  padding: $spacing-md $spacing-xl;
  border-top: 1px solid $border-light;
  display: flex;
  justify-content: center;
  position: relative;
  background: rgba(0, 0, 0, 0.02);

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: $spacing-xl;
    right: $spacing-xl;
    height: 1px;
    background: $gradient-line;
    opacity: 0.5;
  }

  .el-button {
    border-radius: $radius-md;
    transition: all $duration-fast ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: $shadow-hover-sm;
    }
  }
}

// 响应式设计
@include respond-to(lg) {
  .table-content {
    padding: $spacing-md;
  }
}

@include respond-to(sm) {
  .table-header,
  .table-footer {
    padding: $spacing-md $spacing-lg;
  }

  .table-content {
    padding: $spacing-md;
  }
}

@include respond-to(xs) {
  .table-content {
    padding: $spacing-sm;
  }
}
</style>

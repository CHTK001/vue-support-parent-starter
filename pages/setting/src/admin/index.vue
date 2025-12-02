<script setup lang="ts">
import {
  defineExpose,
  nextTick,
  defineAsyncComponent,
  reactive,
  ref,
} from "vue";
import { fetchSettingPage } from "../api";
import { $t } from "@repo/config";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
const ItemSave = defineAsyncComponent(() => import("./save.vue"));
const ScTable = defineAsyncComponent(
  () => import("@repo/components/ScTable/index.vue")
);
const config = reactive({
  visible: false,
  itemSaveStatus: false,
  title: $t("title.setting"),
});

const emit = defineEmits(["close"]);
const itemSaveRef = ref();
const open = () => {
  config.visible = true;
};

const handleClose = () => {
  config.visible = false;
  emit("close");
};

const handleUpdate = async (row, mode) => {
  nextTick(() => {
    itemSaveRef.value?.setData(row);
    itemSaveRef.value?.open(mode);
  });
};
defineExpose({
  open,
});
</script>

<template>
  <div>
    <el-drawer
      v-model="config.visible"
      size="80%"
      :title="config.title"
      draggable
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :destroy-on-close="true"
      @close="handleClose"
    >
      <el-header class="flex !justify-end">
        <el-button
          :icon="useRenderIcon('ep:plus')"
          @click="handleUpdate({}, 'add')"
          class="text-btn"
        />
      </el-header>
      <el-main class="setting-content">
        <ScTable border :url="fetchSettingPage">
          <el-table-column prop="sysSettingGroup" label="数据分组">
            <template #default="scope">
              <el-tag>{{ scope.row.sysSettingGroup }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="sysSettingName" label="字段" />
          <el-table-column prop="sysSettingValue" label="当前值" />
          <el-table-column prop="sysSettingRemark" label="描述" />
          <el-table-column prop="sysSettingValueType" label="数据类型" />
          <el-table-column prop="sysSettingSort" label="数据优先级" />
          <el-table-column prop="sysSettingInSystem" label="系统配置">
            <template #default="scope">
              <el-tag>{{ scope.row.sysSettingInSystem ? "是" : "否" }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="sysSettingConfig" label="设置">
            <template #default="{ row }">
              <el-button
                :icon="useRenderIcon('ep:setting')"
                plain
                circle
                @click="handleUpdate(row, 'edit')"
              />
            </template>
          </el-table-column>
        </ScTable>
      </el-main>
    </el-drawer>
    <ItemSave ref="itemSaveRef" @close="config.itemSaveStatus = false" />
  </div>
</template>

<style scoped lang="scss">
:deep(.el-drawer) {
  .el-drawer__header {
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-9) 0%,
      var(--el-bg-color-overlay) 100%
    );
    border-bottom: 1px solid var(--el-border-color-lighter);
    margin-bottom: 0;
    padding: 16px 20px;
  }

  .el-drawer__body {
    padding: 0;
    display: flex;
    flex-direction: column;
  }
}

:deep(.el-header) {
  padding: 16px 24px;
  background-color: var(--el-bg-color-overlay);
  border-bottom: 1px solid var(--el-border-color-lighter);
  height: auto !important;
}

.setting-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 20px;
  background-color: var(--el-bg-color);

  :deep(.sc-table-wrapper) {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  :deep(.el-table) {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border-radius: 8px;

    th {
      background-color: var(--el-fill-color-light) !important;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .el-table__row {
      transition: all 0.2s ease;

      &:hover {
        background-color: var(--el-color-primary-light-9) !important;
      }
    }

    .el-table__header-wrapper {
      flex-shrink: 0;
    }

    .el-table__body-wrapper {
      flex: 1;
      overflow-y: auto;
    }
  }
}

:deep(.el-tag) {
  border-radius: 6px;
  font-weight: 500;
}

:deep(.el-button) {
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }
}
</style>

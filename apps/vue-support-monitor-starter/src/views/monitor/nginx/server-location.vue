<template>
  <div class="server-location">
    <!-- 主抽屉组件 -->
    <el-drawer v-model="visible" direction="ltr" :append-to-body="true" draggable :title="env.title" :close-on-click-modal="false" size="70%" class="server-location__drawer" @close="handleClose">
      <!-- 服务器配置区域 -->
      <div class="server-location__content">
        <!-- 服务器配置表单 -->
        <div class="server-location__card">
          <div class="server-location__card-header">
            <div class="server-location__card-title">
              <IconifyIconOnline icon="ri:server-line" class="server-location__card-icon" />
              <span>服务器配置</span>
            </div>
          </div>
          <div class="server-location__card-body">
            <ServerSaveItem ref="serverSaveRef" v-model="form" />

            <div class="server-location__actions">
              <el-button class="server-location__save-btn" type="primary" @click="handleSaveOrUpdate">
                <IconifyIconOnline icon="ri:save-3-line" />
                <span>保存配置</span>
              </el-button>
            </div>
          </div>
        </div>

        <!-- Location配置区域 -->
        <div class="server-location__card">
          <div class="server-location__card-header">
            <div class="server-location__card-title">
              <IconifyIconOnline icon="ri:route-line" class="server-location__card-icon" />
              <span>Location配置</span>
            </div>
          </div>
          <div class="server-location__card-body">
            <!-- 搜索和操作工具栏 -->
            <div class="server-location__toolbar">
              <div class="server-location__search">
                <el-form :inline="true">
                  <el-form-item label="名称">
                    <el-input v-model="env.params.monitorNginxHttpServerLocationName" placeholder="输入搜索关键字" class="server-location__search-input" />
                  </el-form-item>
                </el-form>
                <el-button type="primary" class="server-location__toolbar-btn" @click="handleSearch">
                  <IconifyIconOnline icon="ep:search" />
                  <span>搜索</span>
                </el-button>
              </div>

              <div class="server-location__actions-group">
                <el-tooltip content="添加新Location" placement="top">
                  <el-button class="server-location__toolbar-btn" type="success" plain @click="handleNewLocationSave">
                    <IconifyIconOnline icon="ep:plus" />
                    <span>添加</span>
                  </el-button>
                </el-tooltip>

                <el-tooltip content="导入Location" placement="top">
                  <el-button class="server-location__toolbar-btn" type="warning" plain @click="handleNewLocationImport">
                    <IconifyIconOnline icon="ri:import-line" />
                    <span>导入</span>
                  </el-button>
                </el-tooltip>
              </div>
            </div>

            <!-- Location表格 -->
            <div class="server-location__table">
              <ScTable ref="tableRef" border :url="fetchPageNginxHttpServerLocationConfig" :params="env.params" :columns="env.httpColumns" :search="false">
                <el-table-column>
                  <template #default="{ row }">
                    <div class="flex">
                      <el-button type="primary" plain size="small" class="server-location__table-btn" @click="handleNewLocationSave(row)">
                        <IconifyIconOnline icon="ep:edit" />
                        <span>编辑</span>
                      </el-button>
                      <el-button type="danger" plain size="small" class="server-location__table-btn" @click="handleNewLocationDelete(row)">
                        <IconifyIconOnline icon="ep:delete" />
                        <span>删除</span>
                      </el-button>
                    </div>
                  </template>
                </el-table-column>
              </ScTable>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- 子组件引用 -->
    <ServerSaveLocation ref="serverSaveLocationRef" @success="handleRefresh" />
    <ServerSaveLocationImport ref="serverSaveLocationImportRef" @selectionSelected="handleSelectionChange" @success="handleRefresh" />
  </div>
</template>

<script setup>
import { fetchDeleteNginxHttpServerLocationConfig, fetchSaveOrUpdateBatchNginxHttpServerLocaltionConfig, fetchPageNginxHttpServerLocationConfig } from "@/api/monitor/nginx-http-server-location";
import { fetchSaveOrUpdateNginxHttpServerConfig } from "@/api/monitor/nginx-http-server";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { defineAsyncComponent, defineEmits, defineExpose, nextTick, reactive, ref } from "vue";
import { message } from "@repo/utils";
import { useI18n } from "vue-i18n";

// 国际化
const { t } = useI18n();

// 异步加载组件
const ServerSaveItem = defineAsyncComponent(() => import("./save/server-save-item.vue"));
const ServerSaveLocation = defineAsyncComponent(() => import("./save/server-save-location.vue"));
const ServerSaveLocationImport = defineAsyncComponent(() => import("./save/server-save-location-import.vue"));

// 定义事件
const emit = defineEmits(["update:modelValue", "success"]);

// 组件引用
const tableRef = ref();
const serverSaveLocationImportRef = ref();
const serverSaveLocationRef = ref();
const serverSaveRef = ref();

// 表单数据
const form = reactive({});

// 数据对象
const data = reactive({
  nginxHttpData: {}
});

// 抽屉可见性
const visible = ref(false);

// 环境配置
const env = reactive({
  params: {
    monitorNginxHttpServerLocationName: null
  },
  httpColumns: [
    {
      label: "路径",
      prop: "monitorNginxHttpServerLocationName",
      align: "left"
    },
    {
      label: "代理",
      prop: "monitorNginxHttpServerLocationAlias",
      align: "left",
      formatter: row => {
        return row.monitorNginxHttpServerLocationAlias || row.monitorNginxHttpServerLocationProxyPass || "-";
      }
    }
  ]
});

/**
 * 处理选择变更
 * @param {Array} rows - 选中的行数据
 * @param {Array} ids - 选中的ID数组
 */
const handleSelectionChange = async (rows, ids) => {
  // 为每个选中项添加服务器ID并删除原有的位置ID
  rows.forEach(element => {
    element.monitorNginxHttpServerId = form.monitorNginxHttpServerId;
    delete element.monitorNginxHttpServerLocationId;
  });

  // 批量保存或更新位置配置
  fetchSaveOrUpdateBatchNginxHttpServerLocaltionConfig(rows).then(res => {
    if (res.code === "00000") {
      message(t("message.updateSuccess"), { type: "success" });
      emit("success");
      handleRefresh();
      serverSaveLocationImportRef.value.handleClose();
      return;
    }
    message(res.msg, { type: "error" });
  });
};

/**
 * 保存或更新服务器配置
 */
const handleSaveOrUpdate = async () => {
  fetchSaveOrUpdateNginxHttpServerConfig(serverSaveRef.value.getValue()).then(res => {
    if (res.code === "00000") {
      message(t("message.updateSuccess"), { type: "success" });
      emit("success");
      return;
    }
    message(res.msg, { type: "error" });
  });
};

/**
 * 删除位置配置
 * @param {Object} row - 行数据
 */
const handleNewLocationDelete = async row => {
  fetchDeleteNginxHttpServerLocationConfig({ id: row.monitorNginxHttpServerLocationId }).then(res => {
    if (res.code === "00000") {
      message("删除成功", { type: "success" });
      tableRef.value.reload(env.params);
      return;
    }
    message(res.msg, { type: "error" });
  });
};

/**
 * 刷新表格数据
 */
const handleRefresh = async () => {
  tableRef.value.reload(env.params);
};

/**
 * 加载HTTP服务器位置配置
 */
const handleNginxConfigHttpServerLocation = async () => {
  setTimeout(async () => {
    env.params = { monitorNginxHttpServerId: form.monitorNginxHttpServerId };
    tableRef.value.reload(env.params);
  }, 100);
};

/**
 * 打开位置保存对话框
 * @param {Object} row - 行数据（可选）
 */
const handleNewLocationSave = async row => {
  serverSaveLocationRef.value.handleOpen(row, form);
};

/**
 * 执行搜索
 */
const handleSearch = async () => {
  tableRef.value.reload(env.params);
};

/**
 * 打开位置导入对话框
 */
const handleNewLocationImport = async () => {
  serverSaveLocationImportRef.value.handleOpen(form);
};

/**
 * 关闭抽屉
 */
const handleClose = async () => {
  visible.value = false;
};

/**
 * 打开抽屉
 * @param {string} mode - 模式
 * @param {Object} data - 数据
 */
const handleOpen = async (mode, data) => {
  visible.value = true;
  env.title = data.monitorNginxHttpServerName;
  Object.assign(form, data);

  // 使用requestIdleCallback在浏览器空闲时加载数据
  requestIdleCallback(() => {
    handleNginxConfigHttpServerLocation();
  });
};

// 暴露方法
defineExpose({
  handleOpen
});
</script>

<style lang="scss" scoped>
.server-location {
  /* 抽屉样式 */
  &__drawer {
    :deep(.el-drawer__header) {
      margin-bottom: 0;
      padding: 16px 20px;
      border-bottom: 1px solid var(--el-border-color-lighter);
      background: linear-gradient(to right, var(--el-color-primary-light-9), var(--el-bg-color));
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

      .el-drawer__title {
        font-size: 18px;
        font-weight: 600;
        color: var(--el-color-primary);
      }

      .el-drawer__close-btn {
        color: var(--el-color-primary);
        transition: transform 0.3s ease;

        &:hover {
          transform: rotate(90deg);
          color: var(--el-color-primary-dark-2);
        }
      }
    }

    :deep(.el-drawer__body) {
      padding: 0;
      overflow: auto;
      background-color: var(--el-bg-color-page);
    }
  }

  /* 内容区域样式 */
  &__content {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* 卡片样式 */
  &__card {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    border: 1px solid var(--el-border-color-lighter);
    transition: all 0.3s ease;
    background-color: var(--el-bg-color);

    &:hover {
      box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
      border-color: var(--el-color-primary-light-7);
      transform: translateY(-2px);
    }
  }

  /* 卡片头部样式 */
  &__card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: linear-gradient(to right, var(--el-color-primary-light-9), var(--el-bg-color));
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  /* 卡片标题样式 */
  &__card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  /* 卡片图标样式 */
  &__card-icon {
    font-size: 20px;
    color: var(--el-color-primary);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }

  /* 卡片内容样式 */
  &__card-body {
    padding: 16px;
    background-color: var(--el-bg-color);
  }

  /* 工具栏样式 */
  &__toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding: 12px;
    background-color: var(--el-fill-color-light);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transform: translateY(-2px);
    }
  }

  /* 搜索区域样式 */
  &__search {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* 搜索输入框样式 */
  &__search-input {
    transition: all 0.3s ease;

    &:focus {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
  }

  /* 操作按钮组样式 */
  &__actions-group {
    display: flex;
    gap: 8px;
  }

  /* 工具栏按钮样式 */
  &__toolbar-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.3s ease;
    border-radius: 6px;
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      background-color: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      transition:
        width 0.4s ease,
        height 0.4s ease;
      z-index: 0;
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);

      &::before {
        width: 150%;
        height: 150%;
      }
    }

    &:active {
      transform: translateY(0);
    }

    span,
    i {
      position: relative;
      z-index: 1;
    }
  }

  /* 表格区域样式 */
  &__table {
    :deep(.el-table) {
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

      .el-table__header-wrapper {
        th {
          background-color: var(--el-fill-color-light);
          color: var(--el-text-color-primary);
          font-weight: 600;
          padding: 12px 0;

          .cell {
            padding: 0 12px;
          }
        }
      }

      .el-table__row {
        transition: all 0.3s ease;

        td {
          padding: 8px 0;

          .cell {
            padding: 0 12px;
          }
        }

        &:hover {
          background-color: var(--el-fill-color-lighter) !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
          z-index: 1;
        }

        &:nth-child(even) {
          background-color: var(--el-fill-color-light);
        }
      }
    }
  }

  /* 表格按钮样式 */
  &__table-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    margin: 0 4px;
    transition: all 0.3s ease;
    border-radius: 4px;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }

    &:active {
      transform: translateY(0);
    }
  }

  /* 操作区域样式 */
  &__actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px dashed var(--el-border-color-lighter);
  }

  /* 保存按钮样式 */
  &__save-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.3s ease;
    border-radius: 6px;
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      background-color: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      transition:
        width 0.4s ease,
        height 0.4s ease;
      z-index: 0;
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

      &::before {
        width: 150%;
        height: 150%;
      }
    }

    &:active {
      transform: translateY(0);
    }

    span,
    i {
      position: relative;
      z-index: 1;
    }
  }
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes float {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
  100% {
    transform: translateY(0);
  }
}
</style>

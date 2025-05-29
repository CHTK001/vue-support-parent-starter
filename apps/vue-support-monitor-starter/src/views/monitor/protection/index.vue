<script setup>
import { fetchProtectionDelete, fetchProtectionPageList } from "@/api/monitor/protection";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { defineAsyncComponent, shallowRef, reactive, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { message } from "@repo/utils";

// 国际化
const { t } = useI18n();

// 异步加载组件
const SaveDialog = defineAsyncComponent(() => import("./save.vue"));
const ScTable = defineAsyncComponent(() => import("@repo/components/ScTable/index.vue"));

// 组件引用
const saveDialogRef = shallowRef(null);
const tableRef = shallowRef(null);

// 搜索表单
const form = reactive({});

/**
 * 编辑或新增记录
 * @param {Object} row - 行数据
 * @param {String} mode - 操作模式：save-新增，edit-编辑
 */
const handleEdit = async (row, mode) => {
  saveDialogRef.value.handleOpen(row, mode);
};

/**
 * 删除记录
 * @param {Object} row - 行数据
 */
const handleDelete = async row => {
  // 确认删除
  ElMessageBox.confirm("确定要删除该防护配置吗？", "删除确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      fetchProtectionDelete(row).then(res => {
        message(t("message.updateSuccess"), { type: "success" });
        loadData();
      });
    })
    .catch(() => {});
};

/**
 * 加载表格数据
 */
const loadData = () => {
  tableRef.value?.reload(form);
};

/**
 * 重置搜索条件
 */
const resetSearch = () => {
  Object.keys(form).forEach(key => {
    form[key] = "";
  });
  loadData();
};

// 页面加载时自动加载数据
onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="protection-index">
    <!-- 保存对话框 -->
    <SaveDialog ref="saveDialogRef" @success="loadData" />

    <!-- 搜索区域 -->
    <div class="protection-index__search-card">
      <div class="protection-index__card-header">
        <div class="protection-index__card-title">
          <IconifyIconOnline icon="ri:filter-line" class="protection-index__card-icon" />
          <span>搜索条件</span>
        </div>
      </div>
      <div class="protection-index__card-body">
        <el-form :model="form" class="protection-index__search-form">
          <el-row :gutter="20">
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="状态" class="protection-index__form-item">
                <el-select v-model="form.monitorProtectionStatus" clearable placeholder="请选择状态" class="protection-index__select">
                  <el-option label="全部" value="" />
                  <el-option label="启用" :value="0" />
                  <el-option label="禁用" :value="1" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8" :lg="6">
              <el-form-item label="名称" class="protection-index__form-item">
                <el-input v-model="form.monitorProtectionName" clearable placeholder="请输入名称" class="protection-index__input" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="24" :md="8" :lg="12">
              <div class="protection-index__search-buttons">
                <el-button type="primary" class="protection-index__search-btn" @click="loadData">
                  <IconifyIconOnline icon="ri:search-line" />
                  <span>搜索</span>
                </el-button>
                <el-button class="protection-index__reset-btn" @click="resetSearch">
                  <IconifyIconOnline icon="ri:refresh-line" />
                  <span>重置</span>
                </el-button>
                <el-button type="success" class="protection-index__add-btn" @click="handleEdit({}, 'save')">
                  <IconifyIconOnline icon="ri:add-line" />
                  <span>新增</span>
                </el-button>
              </div>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="protection-index__table-card">
      <div class="protection-index__card-header">
        <div class="protection-index__card-title">
          <IconifyIconOnline icon="ri:shield-line" class="protection-index__card-icon" />
          <span>防护配置列表</span>
        </div>
      </div>
      <div class="protection-index__card-body h-full">
        <ScTable ref="tableRef" :url="fetchProtectionPageList" :params="form" class="protection-index__table">
          <el-table-column label="名称" prop="monitorProtectionName" min-width="120" />
          <el-table-column label="状态" prop="monitorProtectionStatus" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.monitorProtectionStatus === 0 ? 'success' : 'danger'" effect="light" class="protection-index__status-tag">
                {{ row.monitorProtectionStatus === 0 ? "启用" : "禁用" }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="监听端口" prop="monitorProtectionPid" min-width="100" align="center" />
          <el-table-column label="启动脚本" prop="monitorProtectionShell" min-width="180" show-overflow-tooltip />
          <el-table-column label="备注" prop="monitorProtectionRemark" min-width="150" show-overflow-tooltip />
          <el-table-column label="操作" width="150" fixed="right" align="center">
            <template #default="{ row }">
              <el-button type="primary" link class="protection-index__action-btn" @click="handleEdit(row, 'edit')">
                <IconifyIconOnline icon="ri:edit-line" />
                <span>编辑</span>
              </el-button>
              <el-button type="danger" link class="protection-index__action-btn" @click="handleDelete(row)">
                <IconifyIconOnline icon="ri:delete-bin-line" />
                <span>删除</span>
              </el-button>
            </template>
          </el-table-column>
        </ScTable>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.protection-index {
  padding: 16px;

  /* 卡片通用样式 */
  &__search-card,
  &__table-card {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    border: 1px solid var(--el-border-color-lighter);
    transition: all 0.3s ease;
    background-color: var(--el-bg-color);
    margin-bottom: 20px;

    &:hover {
      box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
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

  /* 卡片内容区域样式 */
  &__card-body {
    padding: 16px;
  }

  /* 搜索表单样式 */
  &__search-form {
    width: 100%;
  }

  /* 表单项样式 */
  &__form-item {
    margin-bottom: 16px;

    :deep(.el-form-item__label) {
      font-weight: 500;
      color: var(--el-text-color-primary);
    }
  }

  /* 输入框样式 */
  &__input {
    transition: all 0.3s ease;

    &:hover {
      :deep(.el-input__wrapper) {
        box-shadow: 0 0 0 1px var(--el-color-primary-light-5) inset;
      }
    }

    &:focus {
      transform: translateY(-2px);
    }
  }

  /* 选择器样式 */
  &__select {
    width: 100%;
    transition: all 0.3s ease;

    &:hover {
      :deep(.el-input__wrapper) {
        box-shadow: 0 0 0 1px var(--el-color-primary-light-5) inset;
      }
    }
  }

  /* 搜索按钮区域样式 */
  &__search-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-bottom: 16px;
  }

  /* 按钮通用样式 */
  &__search-btn,
  &__reset-btn,
  &__add-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }

    &:active {
      transform: translateY(0);
    }
  }

  /* 表格样式 */
  &__table {
    :deep(.el-table) {
      border-radius: 4px;
      overflow: hidden;

      .el-table__header-wrapper {
        th {
          background-color: var(--el-fill-color-light);
          color: var(--el-text-color-primary);
          font-weight: 600;
        }
      }

      .el-table__row {
        transition: all 0.3s ease;

        &:hover {
          background-color: var(--el-fill-color-lighter) !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
        }
      }
    }
  }

  /* 状态标签样式 */
  &__status-tag {
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.05);
    }
  }

  /* 操作按钮样式 */
  &__action-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
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
</style>

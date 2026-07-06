<script setup lang="ts">
import { useRenderIcon, IconifyIconOnline } from "@repo/components/ReIcon";

import { computed, nextTick, reactive, ref } from "vue";

import {
  fetchDeleteRole,
  fetchPageRole,
  fetchUpdateRole,
} from "@/api/manage/role";
import { debounce } from "@pureadmin/utils";
import { message } from "@repo/utils";
import { useI18n } from "vue-i18n";
import { BoardCardList } from "./hook";
import SaveDialog from "./save.vue";
import RoleDialog from "./role.vue";
import SystemStatsCards from "../components/SystemStatsCards.vue";
import type { SystemStatsCardItem } from "../components/SystemStatsCards.vue";

// 统计数据
const stats = reactive({
  total: 0,
  system: 0,
  custom: 0,
  enabled: 0,
});

// 数据加载完成回调
const onDataLoaded = (data: any[], total: number) => {
  stats.total = total || 0;
  stats.system = data?.filter((item) => item.sysRoleInSystem)?.length || 0;
  stats.custom = data?.filter((item) => !item.sysRoleInSystem)?.length || 0;
  stats.enabled = data?.filter((item) => item.sysRoleStatus === 1)?.length || 0;
};

const { t } = useI18n();
const i18nLabel = (key: string, fallback: string) => {
  const translated = t(key);
  return !translated || translated === key ? fallback : translated;
};
const roleDialogRef = ref<any>(null);
const form = reactive({
  sysRoleName: "",
  sysRoleCode: "",
  sysRoleStatus: null,
  sysRoleInSystem: null,
});

const visible = reactive({
  save: false,
  role: false,
});

const loading = reactive({
  query: false,
  menu: false,
});
const formRef = ref<any>(null);
const table = ref<any>(null);
const saveDialog = ref<any>(null);
const resetForm = async (formRef) => {
  formRef?.resetFields?.();
  form.sysRoleStatus = null;
  form.sysRoleInSystem = null;
  onSearch();
};
const onSearch = debounce(async () => {
  table.value.reload(form);
}, 1000);

const saveDialogParams = reactive({
  mode: "save",
});

const onDelete = async (row, index) => {
  try {
    const { code } = await fetchDeleteRole(row.sysRoleId);
    if (code == "00000") {
      table.value.reload();
      message(t("message.deleteSuccess"), { type: "success" });
      return;
    }
  } catch (error) {}
};

const dialogOpen = async (item, mode) => {
  saveDialogParams.mode = mode;
  await nextTick();
  if (!saveDialog.value) {
    await nextTick();
  }
  if (!saveDialog.value) {
    message("角色弹窗加载失败，请刷新后重试", { type: "error" });
    return;
  }
  saveDialog.value.setData({ ...item });
  saveDialog.value.open(mode);
};

const dialogClose = async () => {
  visible.save = false;
};

const handleOpenRole = async (row) => {
  roleDialogRef.value?.handleOpen?.(row);
};

const getBoardCardLabel = (value) => {
  return BoardCardList.filter((item) => item.value == value)?.[0]?.label;
};

const statsCards = computed<SystemStatsCardItem[]>(() => [
  {
    key: "total",
    label: i18nLabel("system.role.total", "全部角色"),
    value: stats.total,
    icon: "ri:shield-user-line",
    theme: "primary",
    active: form.sysRoleStatus === null && form.sysRoleInSystem === null,
  },
  {
    key: "system",
    label: i18nLabel("system.role.system", "系统角色"),
    value: stats.system,
    icon: "ri:shield-keyhole-line",
    theme: "warning",
    active: form.sysRoleInSystem === 1,
  },
  {
    key: "custom",
    label: i18nLabel("system.role.custom", "自定义角色"),
    value: stats.custom,
    icon: "ri:shield-star-line",
    theme: "info",
    active: form.sysRoleInSystem === 0,
  },
  {
    key: "enabled",
    label: i18nLabel("system.role.enabled", "已启用"),
    value: stats.enabled,
    icon: "ri:shield-check-line",
    theme: "success",
    active: form.sysRoleStatus === 1,
  },
]);

const handleStatsSelect = (item) => {
  if (!item?.key) {
    return;
  }

  form.sysRoleStatus = null;
  form.sysRoleInSystem = null;

  if (item.key === "system") {
    form.sysRoleInSystem = 1;
  } else if (item.key === "custom") {
    form.sysRoleInSystem = 0;
  } else if (item.key === "enabled") {
    form.sysRoleStatus = 1;
  }

  onSearch();
};

const contentRef = ref();
</script>

<template>
  <div class="system-container role-container">
    <SaveDialog
      ref="saveDialog"
      :mode="saveDialogParams.mode"
      @success="onSearch"
      @close="dialogClose"
    />
    <RoleDialog ref="roleDialogRef" />
    <div class="role-wrapper">
      <ScContainer>
        <div class="stats-section">
          <SystemStatsCards :items="statsCards" @select="handleStatsSelect" />
        </div>
        <ScHeader class="toolbar-section role-header">
          <div class="toolbar-left left-panel">
            <ScForm
              ref="formRef"
              :inline="true"
              :model="form"
              class="modern-form search-form bg-bg_color pl-6 pt-[10px] overflow-auto"
            >
              <ScFormItem
                :label="i18nLabel('system.role.name', '角色名称')"
                prop="sysRoleName"
              >
                <ScInput
                  v-model="form.sysRoleName"
                  :placeholder="
                    i18nLabel('system.role.namePlaceholder', '请输入角色名称')
                  "
                  clearable
                  class="!w-[180px]"
                />
              </ScFormItem>
              <ScFormItem
                :label="i18nLabel('system.role.code', '角色编码')"
                prop="sysRoleCode"
              >
                <ScInput
                  v-model="form.sysRoleCode"
                  :placeholder="
                    i18nLabel('system.role.codePlaceholder', '请输入角色编码')
                  "
                  clearable
                  class="!w-[180px]"
                />
              </ScFormItem>
            </ScForm>
          </div>
          <div class="toolbar-right right-panel">
            <div class="right-panel-search">
              <ScButton
                type="primary"
                :icon="useRenderIcon('ri:search-line')"
                :loading="loading.query"
                title="搜索角色"
                aria-label="搜索角色"
                @click="onSearch"
              />
              <ScButton
                :icon="useRenderIcon('ep:refresh')"
                title="重置角色筛选"
                aria-label="重置角色筛选"
                @click="resetForm(formRef)"
              />
              <ScButton
                :icon="useRenderIcon('ep:plus')"
                title="新增角色"
                aria-label="新增角色"
                @click="dialogOpen({}, 'save')"
              />
            </div>
          </div>
        </ScHeader>
        <ScMain class="role-main nopadding page-table-fill">
          <div ref="contentRef" class="table-wrapper">
            <div :class="visible.role ? 'h-full !w-[380vw]' : 'h-full w-full'">
              <ScTable
                ref="table"
                :url="fetchPageRole"
                height="100%"
                class="modern-table table-fill"
                @data-loaded="onDataLoaded"
              >
                <ScTableColumn type="index" label="序号" width="120px">
                  <template #default="scope">
                    <ScTag type="primary" size="small">{{
                      scope.$index + 1
                    }}</ScTag>
                  </template>
                </ScTableColumn>
                <ScTableColumn
                  label="角色信息"
                  prop="sysRoleName"
                  min-width="200"
                >
                  <template #default="{ row }">
                    <div class="role-info-cell">
                      <div
                        class="role-icon"
                        :class="row.sysRoleInSystem ? 'system' : 'custom'"
                      >
                        <IconifyIconOnline
                          :icon="
                            row.sysRoleInSystem
                              ? 'ri:shield-keyhole-fill'
                              : 'ri:shield-star-fill'
                          "
                          :size="20"
                        />
                      </div>
                      <div class="role-details">
                        <div class="role-name">
                          <span>{{ row.sysRoleName }}</span>
                          <ScTag
                            v-if="row.sysRoleInSystem"
                            type="warning"
                            size="small"
                            class="ml-1"
                            >系统</ScTag
                          >
                        </div>
                        <div class="role-code">{{ row.sysRoleCode }}</div>
                      </div>
                    </div>
                  </template>
                </ScTableColumn>
                <ScTableColumn
                  label="可看面板类型"
                  min-width="120"
                  align="center"
                >
                  <template #default="{ row }">
                    <ScTag type="info" effect="light">
                      {{ getBoardCardLabel(row.sysRoleBoardCard || 1) }}
                    </ScTag>
                  </template>
                </ScTableColumn>
                <ScTableColumn
                  label="优先级"
                  prop="sysRoleSort"
                  width="80"
                  align="center"
                >
                  <template #default="{ row }">
                    <ScTag type="primary" effect="light" size="small">{{
                      row.sysRoleSort
                    }}</ScTag>
                  </template>
                </ScTableColumn>
                <ScTableColumn
                  label="备注"
                  prop="sysRoleRemark"
                  min-width="150"
                  show-overflow-tooltip
                >
                  <template #default="{ row }">
                    <span v-if="row.sysRoleRemark">{{
                      row.sysRoleRemark
                    }}</span>
                    <span v-else class="text-gray">-</span>
                  </template>
                </ScTableColumn>
                <ScTableColumn
                  label="状态"
                  prop="sysRoleStatus"
                  width="100"
                  align="center"
                >
                  <template #default="{ row }">
                    <ScSwitch
                      v-model="row.sysRoleStatus"
                      class="h-fit"
                      :active-value="1"
                      :inactive-value="0"
                      :title="row.sysRoleStatus === 1 ? '禁用角色' : '启用角色'"
                      @change="fetchUpdateRole(row)"
                    />
                  </template>
                </ScTableColumn>
                <ScTableColumn
                  label="操作"
                  fixed="right"
                  width="160"
                  align="center"
                >
                  <template #default="{ row, $index }">
                    <ScTooltip content="编辑" placement="top">
                      <ScButton
                        class="btn-text"
                        type="primary"
                        link
                        title="编辑角色"
                        aria-label="编辑角色"
                        @click="dialogOpen(row, 'edit')"
                      >
                        <IconifyIconOnline icon="ri:edit-line" />
                      </ScButton>
                    </ScTooltip>
                    <ScTooltip content="权限配置" placement="top">
                      <ScButton
                        class="btn-text"
                        type="success"
                        link
                        title="配置角色权限"
                        aria-label="配置角色权限"
                        @click="handleOpenRole(row)"
                      >
                        <IconifyIconOnline icon="ri:settings-3-line" />
                      </ScButton>
                    </ScTooltip>
                    <ScPopconfirm
                      v-if="!row.sysRoleInSystem"
                      :title="$t('message.confimDelete')"
                      @confirm="onDelete(row, $index)"
                    >
                      <template #reference>
                        <ScButton
                          class="btn-text"
                          type="danger"
                          link
                          title="删除角色"
                          aria-label="删除角色"
                        >
                          <IconifyIconOnline icon="ri:delete-bin-line" />
                        </ScButton>
                      </template>
                    </ScPopconfirm>
                  </template>
                </ScTableColumn>
              </ScTable>
            </div>
            <div
              v-if="visible.role"
              class="!h-full !min-w-[calc(100vw-60vw-668px)] w-full mt-2 px-2 pb-2 bg-bg_color ml-2 overflow-auto"
              style="margin: 0; margin-left: 10px; border: 1px solid #eee"
            />
          </div>
        </ScMain>
      </ScContainer>
    </div>
  </div>
</template>

<style scoped lang="scss">
// 响应式适配
@media (width <= 1200px) {
  .role-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (width <= 768px) {
  .role-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 12px;

    .stat-item {
      padding: 12px;

      .stat-icon {
        width: 40px;
        height: 40px;
      }

      .stat-info .stat-value {
        font-size: 18px;
      }
    }
  }
}

.role-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border-radius: var(--el-border-radius-base);
  box-shadow: none;

  :deep(.sc-container) {
    display: flex;
    flex: 1;
    flex-direction: column;
  }
}

.stats-section {
  padding: 16px 20px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.page-table-fill {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

// 统计面板样式
.role-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 12px 16px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);

  .stat-item {
    display: flex;
    gap: 14px;
    align-items: center;
    min-height: 74px;
    padding: 12px 16px;
    background: var(--el-fill-color-lighter);
    border-radius: 10px;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 6px 20px rgb(0 0 0 / 8%);
      transform: translateY(-2px);
    }

    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      color: #fff;
      border-radius: 10px;

      &.total {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      &.system {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }

      &.custom {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      }

      &.enabled {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      }
    }

    .stat-info {
      display: flex;
      flex-direction: column;

      .stat-value {
        font-size: 22px;
        font-weight: 700;
        line-height: 1.2;
        color: var(--el-text-color-primary);
      }

      .stat-label {
        margin-top: 2px;
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

// 页头样式
.role-header {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  height: auto !important;
  padding: 12px 16px;
  background-color: var(--el-bg-color);
  background-image: linear-gradient(
    135deg,
    var(--el-bg-color) 0%,
    var(--el-bg-color-page) 100%
  );
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.left-panel {
  flex: 1;
}

.right-panel {
  display: flex;
  gap: 8px;
  align-items: center;

  .right-panel-search {
    display: flex;
    gap: 8px;
  }
}

.search-form {
  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-input) {
    transition: all 0.3s ease;

    &:focus-within {
      transform: translateY(-1px);
    }
  }
}

// 主体区域
.role-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 10px 0 !important;
}

// 表格容器
.table-wrapper {
  display: flex;
  flex: 1;
  height: 100%;
  min-height: 0;
  padding: 0 2px 2px;

  > div {
    display: flex;
    flex: 1;
    flex-direction: column;
    overflow: hidden;
    background-color: var(--el-bg-color);
    border-radius: var(--el-border-radius-base);
    box-shadow: none;
  }
}

:deep(.table-wrapper .el-table) {
  height: 100%;
}

:deep(.table-fill .sc-table-container),
:deep(.table-fill .sc-table-wrapper),
:deep(.table-fill .sc-table-content-wrapper) {
  flex: 1;
  min-height: 0;
}

// 角色信息单元格
.role-info-cell {
  display: flex;
  gap: 12px;
  align-items: center;

  .role-icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    color: #fff;
    border-radius: 8px;

    &.system {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    &.custom {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }
  }

  .role-details {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .role-name {
      display: flex;
      align-items: center;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    .role-code {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
}

// 文本灰色
.text-gray {
  color: var(--el-text-color-placeholder);
}

// 表格美化
:deep(.el-table) {
  .el-table__header {
    th {
      font-weight: 600;
      color: var(--el-text-color-primary);
      background-color: var(--el-fill-color-light) !important;
    }
  }

  .el-table__row {
    transition: background-color 0.2s ease;

    &:hover {
      background-color: var(--el-fill-color-light) !important;
    }

    &:nth-child(even) {
      background-color: var(--el-fill-color-lighter);
    }
  }
}

// 按钮悬浮效果
:deep(.el-button) {
  transition: all 0.3s ease;

  &:hover:not([link]) {
    box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
    transform: translateY(-2px);
  }
}

// 标签美化
:deep(.el-tag) {
  font-weight: 500;
  border-radius: 4px;
}

// 开关美化
.h-fit {
  height: fit-content !important;
}

:deep(.el-switch) {
  --el-switch-on-color: #13ce66;
  --el-switch-off-color: #ff4949;
}

// 操作按钮美化
.btn-text {
  font-size: 16px;
  border-radius: 10px;
  transition: background-color 0.2s ease;

  &:hover {
    background: rgba(var(--el-color-primary-rgb), 0.08);
  }
}

// 暗色主题适配
:root[data-theme="dark"] {
  .role-wrapper {
    box-shadow: none;
  }

  .role-stats {
    background: var(--el-bg-color-overlay);

    .stat-item {
      background: var(--el-fill-color);
    }
  }

  .role-header {
    background-color: var(--el-bg-color-overlay);
    background-image: linear-gradient(
      135deg,
      var(--el-bg-color-overlay) 0%,
      var(--el-bg-color) 100%
    );
  }

  .table-wrapper {
    > div {
      box-shadow: none;
    }
  }

  :deep(.el-table) {
    .el-table__header {
      th {
        background-color: var(--el-fill-color) !important;
      }
    }

    .el-table__row {
      &:nth-child(even) {
        background-color: var(--el-fill-color);
      }
    }
  }
} // 角色管理页面美化样式
</style>

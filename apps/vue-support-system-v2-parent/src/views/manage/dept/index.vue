<script setup>
// 导入部门管理相关的API请求函数
import {
  fetchDeleteDept,
  fetchListDept,
  fetchUpdateDept,
} from "@/api/manage/dept";
// 导入时间处理工具函数
import { getTimeAgo } from "@repo/utils";
// 导入渲染图标的钩子函数
import { useRenderIcon, IconifyIconOnline } from "@repo/components/ReIcon";

// 导入路由实例
import { router } from "@repo/core";
// 导入Base64编码库
import { Base64 } from "js-base64";
// 导入Vue的响应式和生命周期相关API
import {
  computed,
  defineAsyncComponent,
  onMounted,
  reactive,
  ref,
  shallowRef,
  toRaw,
} from "vue";
import { message } from "@repo/utils";
// 导入获取权限标签的钩子函数
import { getPermissionLabel } from "./hook";
import SystemStatsCards from "../components/SystemStatsCards.vue";

// 异步加载保存部门信息的对话框组件
const SaveDialog = defineAsyncComponent(() => import("./save.vue"));
// 异步加载权限设置的对话框组件
const PermissionDialog = defineAsyncComponent(() => import("./permission.vue"));

/**
 * 定义一个响应式对象，用于存储页面的环境状态
 * @property {boolean} loading - 表示数据加载状态，true为正在加载，false为加载完成
 */
const env = reactive({
  loading: false,
});

// 统计数据
const stats = reactive({
  total: 0,
  enabled: 0,
  disabled: 0,
  members: 0,
});

/**
 * 计算部门统计数据
 */
const calcStats = (data) => {
  let total = 0;
  let enabled = 0;
  let disabled = 0;
  let members = 0;

  const countDepts = (items) => {
    items.forEach((item) => {
      total++;
      if (item.sysDeptStatus === 0) enabled++;
      else disabled++;
      members += Number(item.memberCount || 0);
      if (item.children?.length) {
        countDepts(item.children);
      }
    });
  };

  countDepts(data);
  stats.total = total;
  stats.enabled = enabled;
  stats.disabled = disabled;
  stats.members = members;
};

// 浅引用，用于存储表格数据
const tableData = shallowRef([]);
// 浅引用，用于存储权限对话框的引用
const permissionDialogRef = shallowRef(null);
// 浅引用，用于存储保存对话框的引用
const saveDialogRef = shallowRef(null);
const deptNameInputRef = ref(null);
// 响应式对象，用于存储搜索表单的数据
const form = reactive({
  sysDeptName: null,
  sysDeptStatus: null,
});

const formatTimeAgo = (value) => {
  return value ? getTimeAgo(value) : "-";
};

const syncDeptKeyword = (value) => {
  form.sysDeptName = value?.trim?.() || "";
  return form.sysDeptName;
};

const syncDeptKeywordFromInput = () => {
  const inputElement = deptNameInputRef.value?.$el?.querySelector?.("input");
  return inputElement
    ? syncDeptKeyword(inputElement.value)
    : syncDeptKeyword(form.sysDeptName);
};

const cloneDialogPayload = (value) => {
  if (value === null || value === undefined) {
    return value;
  }
  return JSON.parse(JSON.stringify(toRaw(value)));
};

/**
 * 加载部门列表数据
 * 该函数会触发API请求获取部门列表，并更新表格数据
 */
const loadData = async () => {
  // 设置加载状态为true
  env.loading = true;
  try {
    // 发起获取部门列表的API请求
    const res = await fetchListDept(form);
    // 将获取到的数据赋值给表格数据
    tableData.value = res.data;
    // 计算统计数据
    calcStats(res.data);
  } catch (error) {
    // 处理请求错误
    message("获取部门列表数据失败", { type: "error" });
  } finally {
    // 无论请求成功还是失败，都将加载状态设置为false
    env.loading = false;
  }
};

const handleSearch = async () => {
  syncDeptKeywordFromInput();
  loadData();
};

const statsCards = computed(() => [
  {
    key: "total",
    label: "全部部门",
    value: stats.total,
    icon: "ri:building-line",
    theme: "primary",
    active: form.sysDeptStatus === null || form.sysDeptStatus === undefined,
  },
  {
    key: "enabled",
    label: "已启用",
    value: stats.enabled,
    icon: "ri:checkbox-circle-line",
    theme: "success",
    active: form.sysDeptStatus === 0,
  },
  {
    key: "disabled",
    label: "已禁用",
    value: stats.disabled,
    icon: "ri:close-circle-line",
    theme: "warning",
    active: form.sysDeptStatus === 1,
  },
  {
    key: "members",
    label: "部门人数",
    value: stats.members,
    icon: "ri:team-line",
    theme: "info",
    clickable: false,
  },
]);

const handleStatsSelect = async (item) => {
  if (!item?.key) {
    return;
  }
  form.sysDeptStatus = null;
  if (item.key === "enabled") {
    form.sysDeptStatus = 0;
  } else if (item.key === "disabled") {
    form.sysDeptStatus = 1;
  }
  await loadData();
};

/**
 * 处理编辑部门信息的操作
 * @param {Object} row - 当前要编辑的部门数据行
 * @param {string} mode - 编辑模式，如 'save' 或 'edit'
 */
const handleEdit = async (row, mode) => {
  const dialog = saveDialogRef.value;
  if (!dialog) {
    return;
  }

  dialog.setTableData(cloneDialogPayload(tableData.value));
  dialog.setData(cloneDialogPayload(row));
  dialog.open(mode);
};

const handleCreate = async () => {
  handleEdit({}, "save");
};

const handleCreateChild = (row) => {
  handleEdit(
    {
      sysDeptPid: row?.sysDeptId ?? "",
      parentDeptId: row?.sysDeptId ?? "",
      parentDeptName: row?.sysDeptName ?? "",
    },
    "save",
  );
};

/**
 * 处理删除部门的操作
 * @param {Object} row - 当前要删除的部门数据行
 */
const handleDelete = async (row) => {
  try {
    // 发起删除部门的API请求
    await fetchDeleteDept(row.sysDeptId);
    // 重新加载部门列表数据
    loadData();
  } catch (error) {
    // 处理删除请求错误
    message("删除部门数据失败", { type: "error" });
  }
};

/**
 * 处理打开权限设置对话框的操作
 * @param {Object} row - 当前要设置权限的部门数据行
 */
const handleOpenPermission = async (row) => {
  // 设置权限对话框的部门列表数据
  permissionDialogRef.value.setDeptList(tableData.value);
  // 打开权限对话框
  permissionDialogRef.value.handleOpen(row);
};

/**
 * 处理搜索用户的操作
 * @param {Object} row - 当前部门数据行，用于获取部门ID
 */
const handleSearchUser = async (row) => {
  // 跳转到用户页面，并将部门ID进行Base64编码后作为查询参数传递
  router.push({
    path: "/manage/user",
    query: {
      data: Base64.encode(
        JSON.stringify({
          sysDeptId: row.sysDeptId,
        }),
      ),
    },
  });
};

/**
 * 处理打开部门详情的操作
 * @param {Object} row - 当前部门数据行
 * @param {Object} column - 当前点击的表格列信息
 * @param {Event} event - 点击事件对象
 */
const handleOpenDetail = async (row, column, event) => {
  // 如果当前部门有子部门且点击的列不是操作列
  if (row.children && column?.label != "操作") {
    // 查找展开图标元素
    const expandIcon = event.currentTarget.querySelector(
      ".el-table__expand-icon",
    );
    if (expandIcon) {
      // 模拟点击展开图标
      expandIcon.click();
    }
  }
};

/**
 * 处理更新部门信息的操作
 * @param {Object} row - 当前要更新的部门数据行
 */
const handleUpdate = async (row) => {
  if (!row?.sysDeptId) {
    return;
  }

  try {
    // 发起更新部门信息的API请求
    await fetchUpdateDept(row);
    // 重新加载部门列表数据
    loadData();
  } catch (error) {
    // 处理更新请求错误
    message("更新部门数据失败", { type: "error" });
  }
};

// 组件挂载完成后，自动加载部门列表数据
onMounted(async () => {
  loadData();
});
</script>

<template>
  <div class="system-container dept-page">
    <!-- 权限对话框组件 -->
    <PermissionDialog ref="permissionDialogRef" />
    <!-- 骨架屏组件，在数据加载时显示 -->
    <ScSkeleton :loading="env.loading" animated>
      <template #default>
        <div class="dept-wrapper">
          <div class="stats-section">
            <SystemStatsCards :items="statsCards" @select="handleStatsSelect" />
          </div>
          <!-- 页面头部 -->
          <ScHeader class="toolbar-section dept-header">
            <div class="toolbar-left left-panel">
              <ScForm
                :model="form"
                :inline="true"
                class="modern-form search-form"
              >
                <ScFormItem label="机构名称">
                  <ScInput
                    ref="deptNameInputRef"
                    v-model="form.sysDeptName"
                    placeholder="机构名称"
                    clearable
                    class="!w-[180px]"
                    @input="syncDeptKeyword"
                    @change="syncDeptKeyword"
                  />
                </ScFormItem>
              </ScForm>
            </div>
            <div class="toolbar-right right-panel">
              <div class="right-panel-search">
                <!-- 搜索按钮，点击后调用加载数据函数，并进行防抖处理 -->
                <ScButton
                  type="primary"
                  title="搜索机构"
                  aria-label="搜索机构"
                  :icon="useRenderIcon('ri:search-line')"
                  @click="handleSearch"
                />
                <ScButton
                  title="刷新机构列表"
                  aria-label="刷新机构列表"
                  :icon="useRenderIcon('ep:refresh')"
                  @click="loadData"
                />
                <!-- 新增部门按钮，点击后打开保存对话框 -->
                <ScButton
                  title="新增机构"
                  aria-label="新增机构"
                  :icon="useRenderIcon('ep:plus')"
                  @click="handleCreate"
                />
              </div>
            </div>
          </ScHeader>
          <!-- 表格组件，显示部门列表数据 -->
          <div class="table-container">
            <ScTable
              ref="tableRef"
              :data="tableData"
              row-key="sysDeptId"
              height="auto"
              class="modern-table"
              @row-click="handleOpenDetail"
            >
              <!-- 表格列，显示部门ID -->
              <ScTableColumn label="" prop="sysDeptIds" width="60" />
              <!-- 表格列，显示部门名称 -->
              <ScTableColumn
                label="机构名称"
                prop="sysDeptName"
                min-width="280"
              >
                <template #default="{ row }">
                  <div class="dept-name-cell">
                    <div
                      class="dept-icon"
                      :class="
                        row.children?.length > 0 ? 'has-children' : 'leaf'
                      "
                    >
                      <IconifyIconOnline
                        :icon="
                          row.sysDeptIcon ||
                          (row.children?.length > 0
                            ? 'ri:folder-3-fill'
                            : 'ri:building-fill')
                        "
                      />
                    </div>
                    <div class="dept-info">
                      <div class="dept-title">
                        <span class="dept-name">{{ row.sysDeptName }}</span>
                        <ScTag
                          v-if="row.sysDeptSort"
                          size="small"
                          type="info"
                          effect="light"
                          class="ml-2"
                          >排序: {{ row.sysDeptSort }}</ScTag
                        >
                      </div>
                      <div class="dept-code">{{ row.sysDeptCode }}</div>
                    </div>
                  </div>
                </template>
              </ScTableColumn>
              <!-- 表格列，显示部门权限 -->
              <ScTableColumn
                label="数据权限"
                prop="sysDeptPermission"
                width="150"
                align="center"
              >
                <template #default="{ row }">
                  <ScTag
                    :type="row.sysDeptDataPermission ? 'success' : 'info'"
                    effect="light"
                  >
                    {{
                      !row.sysDeptDataPermission
                        ? "未设置"
                        : getPermissionLabel(row.sysDeptDataPermission)
                    }}
                  </ScTag>
                </template>
              </ScTableColumn>
              <!-- 表格列，显示部门路径 -->
              <ScTableColumn
                label="路径"
                prop="sysDeptTreeId"
                min-width="120"
                show-overflow-tooltip
              />
              <ScTableColumn
                label="部门人数"
                prop="memberCount"
                width="110"
                align="center"
              >
                <template #default="{ row }">
                  <ScTag type="primary" effect="light">
                    {{ row.memberCount ?? 0 }}
                  </ScTag>
                </template>
              </ScTableColumn>
              <ScTableColumn
                label="负责人"
                prop="principalUserNames"
                min-width="180"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  <span>{{
                    row.principalUserNames?.length
                      ? row.principalUserNames.join("、")
                      : row.sysDeptPrincipal || "-"
                  }}</span>
                </template>
              </ScTableColumn>
              <!-- 表格列，显示部门状态 -->
              <ScTableColumn
                label="状态"
                prop="sysDeptStatus"
                width="100"
                align="center"
              >
                <template #default="{ row }">
                  <ScSwitch
                    v-model="row.sysDeptStatus"
                    :active-value="0"
                    :inactive-value="1"
                    style="
                      --el-switch-on-color: #13ce66;
                      --el-switch-off-color: #ff4949;
                    "
                    @change="handleUpdate(row)"
                  />
                </template>
              </ScTableColumn>
              <!-- 表格列，显示部门创建时间 -->
              <ScTableColumn label="创建时间" prop="createTime" width="180">
                <template #default="{ row }">
                  <div class="time-cell">
                    <span class="time-ago">{{
                      formatTimeAgo(row.createTime)
                    }}</span>
                    <span class="time-exact">{{ row.createTime || "-" }}</span>
                  </div>
                </template>
              </ScTableColumn>
              <!-- 表格列，显示部门备注 -->
              <ScTableColumn
                label="备注"
                prop="sysDeptRemark"
                min-width="120"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  <span v-if="row.sysDeptRemark">{{ row.sysDeptRemark }}</span>
                  <span v-else class="text-placeholder">-</span>
                </template>
              </ScTableColumn>
              <!-- 表格列，显示操作按钮 -->
              <ScTableColumn
                label="操作"
                width="200"
                fixed="right"
                align="center"
              >
                <template #default="{ row }">
                  <div class="action-buttons">
                    <!-- 编辑按钮 -->
                    <ScTooltip content="编辑" placement="top">
                      <ScButton
                        type="primary"
                        link
                        title="编辑部门"
                        aria-label="编辑部门"
                        @click.stop="handleEdit(row, 'edit')"
                      >
                        <IconifyIconOnline icon="ri:edit-line" />
                      </ScButton>
                    </ScTooltip>
                    <!-- 新增子部门按钮 -->
                    <ScTooltip content="添加子部门" placement="top">
                      <ScButton
                        type="success"
                        link
                        title="新增子部门"
                        aria-label="新增子部门"
                        @click.stop="handleCreateChild(row)"
                      >
                        <IconifyIconOnline icon="ri:add-line" />
                      </ScButton>
                    </ScTooltip>
                    <!-- 查看用户按钮 -->
                    <ScTooltip content="查看部门用户" placement="top">
                      <ScButton
                        type="warning"
                        link
                        title="查看部门用户"
                        aria-label="查看部门用户"
                        @click.stop="handleSearchUser(row)"
                      >
                        <IconifyIconOnline icon="ri:user-line" />
                      </ScButton>
                    </ScTooltip>
                    <!-- 权限设置按钮 -->
                    <ScTooltip content="数据权限" placement="top">
                      <ScButton
                        type="info"
                        link
                        title="设置数据权限"
                        aria-label="设置数据权限"
                        @click.stop="handleOpenPermission(row)"
                      >
                        <IconifyIconOnline icon="ri:shield-user-line" />
                      </ScButton>
                    </ScTooltip>
                    <!-- 删除确认弹窗 -->
                    <ScPopconfirm
                      :title="$t('message.confimDelete')"
                      @confirm="handleDelete(row)"
                    >
                      <template #reference>
                        <ScButton
                          type="danger"
                          link
                          title="删除"
                          aria-label="删除"
                        >
                          <IconifyIconOnline icon="ri:delete-bin-line" />
                        </ScButton>
                      </template>
                    </ScPopconfirm>
                  </div>
                </template>
              </ScTableColumn>
            </ScTable>
          </div>
        </div>
      </template>
    </ScSkeleton>
    <!-- 保存对话框组件 -->
    <SaveDialog ref="saveDialogRef" @success="loadData" />
  </div>
</template>

<style scoped lang="scss">
// 响应式适配
@media (width <= 1200px) {
  .dept-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (width <= 768px) {
  .dept-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 12px;

    .stat-item {
      padding: 12px;

      .stat-icon {
        width: 44px;
        height: 44px;
      }

      .stat-info .stat-value {
        font-size: 20px;
      }
    }
  }
}

.dept-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  box-shadow: var(--el-box-shadow-light);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: var(--el-box-shadow);
  }
}

.stats-section {
  padding: 20px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

// 统计面板
.dept-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 20px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);

  .stat-item {
    display: flex;
    gap: 14px;
    align-items: center;
    padding: 16px 18px;
    background: var(--el-fill-color-lighter);
    border-radius: 12px;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 6px 20px rgb(0 0 0 / 8%);
      transform: translateY(-2px);
    }

    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      color: #fff;
      border-radius: 12px;

      &.total {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      &.top {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }

      &.sub {
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
        font-size: 24px;
        font-weight: 700;
        line-height: 1.2;
        color: var(--el-text-color-primary);
      }

      .stat-label {
        margin-top: 4px;
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

// 页头样式
.dept-header {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  height: auto !important;
  padding: 16px 20px !important;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.left-panel {
  flex: 1;
}

.search-form {
  :deep(.el-form-item) {
    margin-bottom: 0;
  }
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

// 表格容器
.table-container {
  flex: 1;
  padding: 16px;
  overflow: hidden;
}

// 部门名称单元格
.dept-name-cell {
  display: flex;
  gap: 12px;
  align-items: center;

  .dept-icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    font-size: 20px;
    color: #fff;
    border-radius: 10px;

    &.has-children {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    &.leaf {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }
  }

  .dept-info {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .dept-title {
      display: flex;
      align-items: center;
    }

    .dept-name {
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    .dept-code {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
}

// 时间单元格
.time-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;

  .time-ago {
    font-size: 13px;
    color: var(--el-text-color-primary);
  }

  .time-exact {
    font-size: 11px;
    color: var(--el-text-color-secondary);
  }
}

// 操作按钮
.action-buttons {
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;

  .el-button {
    font-size: 16px;
    transition: all 0.3s;

    &:hover {
      transform: scale(1.15);
    }
  }
}

// 占位符文本
.text-placeholder {
  color: var(--el-text-color-placeholder);
}

// 表格美化
:deep(.el-table) {
  background-color: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);

  .el-table__header {
    th {
      font-weight: 600;
      color: var(--el-text-color-primary);
      background-color: var(--el-fill-color-light) !important;
    }
  }

  .el-table__row {
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background-color: var(--el-fill-color-light) !important;
    }

    &:nth-child(even) {
      background-color: var(--el-fill-color-lighter);
    }
  }
}

// 按钮悬浮效果
:deep(.el-button:not(.is-link)) {
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
    transform: translateY(-2px);
  }
}

// 标签美化
:deep(.el-tag) {
  font-weight: 500;
  border-radius: 4px;
}

// 暗色主题适配
:root[data-theme="dark"] {
  .dept-wrapper {
    box-shadow: 0 2px 12px rgb(0 0 0 / 20%);
  }

  .dept-stats {
    background: var(--el-bg-color-overlay);

    .stat-item {
      background: var(--el-fill-color);
    }
  }

  .dept-header {
    background-color: var(--el-bg-color-overlay);
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
} // 部门管理页面美化样式
</style>

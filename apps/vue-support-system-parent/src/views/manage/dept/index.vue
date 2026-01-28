<script setup>
// 导入部门管理相关的API请求函数
import { fetchDeleteDept, fetchListDept, fetchUpdateDept } from "@/api/manage/dept";
// 导入防抖工具函数
import { debounce } from "@pureadmin/utils";
// 导入时间处理工具函数
import { getTimeAgo } from "@repo/utils";
// 导入渲染图标的钩子函数
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { IconifyIconOnline } from "@repo/components/ReIcon";
// 导入路由实例
import { router } from "@repo/core";
// 导入Base64编码库
import { Base64 } from "js-base64";
// 导入Vue的响应式和生命周期相关API
import { defineAsyncComponent, onMounted, reactive, shallowRef, computed } from "vue";
// 导入获取权限标签的钩子函数
import { getPermissionLabel } from "./hook";

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
  topLevel: 0,
  subLevel: 0,
  enabled: 0,
});

/**
 * 计算部门统计数据
 */
const calcStats = (data) => {
  let total = 0;
  let topLevel = 0;
  let subLevel = 0;
  let enabled = 0;

  const countDepts = (items, isTop = true) => {
    items.forEach(item => {
      total++;
      if (isTop) topLevel++;
      else subLevel++;
      if (item.sysDeptStatus === 0) enabled++;
      if (item.children?.length) {
        countDepts(item.children, false);
      }
    });
  };

  countDepts(data);
  stats.total = total;
  stats.topLevel = topLevel;
  stats.subLevel = subLevel;
  stats.enabled = enabled;
};

// 浅引用，用于存储表格数据
const tableData = shallowRef([]);
// 浅引用，用于存储权限对话框的引用
const permissionDialogRef = shallowRef(null);
// 浅引用，用于存储保存对话框的引用
const saveDialogRef = shallowRef(null);
// 响应式对象，用于存储搜索表单的数据
const form = reactive({
  sysDeptName: null,
});

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
    console.error("获取部门列表数据失败:", error);
  } finally {
    // 无论请求成功还是失败，都将加载状态设置为false
    env.loading = false;
  }
};

/**
 * 处理编辑部门信息的操作
 * @param {Object} row - 当前要编辑的部门数据行
 * @param {string} mode - 编辑模式，如 'save' 或 'edit'
 */
const handleEdit = async (row, mode) => {
  // 调用保存对话框的方法设置数据、表格数据并打开对话框
  saveDialogRef.value.setData(row).setTableData(tableData.value).open(mode);
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
    console.error("删除部门数据失败:", error);
  }
};

/**
 * 处理打开权限设置对话框的操作
 * @param {Object} row - 当前要设置权限的部门数据行
 */
const handleOpenPermission = async (row) => {
  // 设置权限对话框的部门列表数据
  permissionDialogRef.value.setDeptList(tableData);
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
    name: "user",
    query: {
      data: Base64.encode(
        JSON.stringify({
          sysDeptId: row.sysDeptId,
        })
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
    const expandIcon = event.currentTarget.querySelector(".el-table__expand-icon");
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
  try {
    // 发起更新部门信息的API请求
    await fetchUpdateDept(row);
    // 重新加载部门列表数据
    loadData();
  } catch (error) {
    // 处理更新请求错误
    console.error("更新部门数据失败:", error);
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
    <PermissionDialog ref="permissionDialogRef"></PermissionDialog>
    <!-- 骨架屏组件，在数据加载时显示 -->
    <el-skeleton :loading="env.loading" animated>
      <template #default>
        <div class="dept-wrapper">
          <!-- 统计面板 -->
          <div class="dept-stats">
            <div class="stat-item">
              <div class="stat-icon total">
                <IconifyIconOnline icon="ri:building-line" :size="28" />
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ stats.total }}</span>
                <span class="stat-label">全部部门</span>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon top">
                <IconifyIconOnline icon="ri:building-2-line" :size="28" />
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ stats.topLevel }}</span>
                <span class="stat-label">一级部门</span>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon sub">
                <IconifyIconOnline icon="ri:building-4-line" :size="28" />
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ stats.subLevel }}</span>
                <span class="stat-label">子部门</span>
              </div>
            </div>
            <div class="stat-item">
              <div class="stat-icon enabled">
                <IconifyIconOnline icon="ri:checkbox-circle-line" :size="28" />
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ stats.enabled }}</span>
                <span class="stat-label">已启用</span>
              </div>
            </div>
          </div>
          <!-- 页面头部 -->
          <el-header class="toolbar-section dept-header">
            <div class="toolbar-left left-panel">
              <el-form :model="form" :inline="true" class="modern-form search-form">
                <el-form-item label="机构名称">
                  <el-input v-model="form.sysDeptName" placeholder="机构名称" clearable class="!w-[180px]" />
                </el-form-item>
              </el-form>
            </div>
            <div class="toolbar-right right-panel">
              <div class="right-panel-search">
                <!-- 搜索按钮，点击后调用加载数据函数，并进行防抖处理 -->
                <el-button type="primary" :icon="useRenderIcon('ri:search-line')" @click="debounce(loadData, 1000, true)" />
                <el-button :icon="useRenderIcon('ep:refresh')" @click="loadData" />
                <!-- 新增部门按钮，点击后打开保存对话框 -->
                <el-button :icon="useRenderIcon('ep:plus')" @click="handleEdit({}, 'save')" />
              </div>
            </div>
          </el-header>
          <!-- 表格组件，显示部门列表数据 -->
          <div class="table-container">
            <ScTable ref="tableRef" :data="tableData" row-key="sysDeptId" @row-click="handleOpenDetail" height="auto" class="modern-table">
              <!-- 表格列，显示部门ID -->
              <el-table-column label="" prop="sysDeptIds" width="60"></el-table-column>
              <!-- 表格列，显示部门名称 -->
              <el-table-column label="机构名称" prop="sysDeptName" min-width="280">
                <template #default="{ row }">
                  <div class="dept-name-cell">
                    <div class="dept-icon" :class="row.children?.length > 0 ? 'has-children' : 'leaf'">
                      <IconifyIconOnline :icon="row.sysDeptIcon || (row.children?.length > 0 ? 'ri:folder-3-fill' : 'ri:building-fill')" />
                    </div>
                    <div class="dept-info">
                      <div class="dept-title">
                        <span class="dept-name">{{ row.sysDeptName }}</span>
                        <el-tag v-if="row.sysDeptSort" size="small" type="info" effect="light" class="ml-2">排序: {{ row.sysDeptSort }}</el-tag>
                      </div>
                      <div class="dept-code">{{ row.sysDeptCode }}</div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <!-- 表格列，显示部门权限 -->
              <el-table-column label="数据权限" prop="sysDeptPermission" width="150" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.sysDeptDataPermission ? 'success' : 'info'" effect="light">
                    {{ !row.sysDeptDataPermission ? "未设置" : getPermissionLabel(row.sysDeptDataPermission) }}
                  </el-tag>
                </template>
              </el-table-column>
              <!-- 表格列，显示部门路径 -->
              <el-table-column label="路径" prop="sysDeptTreeId" min-width="120" show-overflow-tooltip></el-table-column>
              <!-- 表格列，显示部门状态 -->
              <el-table-column label="状态" prop="sysDeptStatus" width="100" align="center">
                <template #default="{ row }">
                  <el-switch
                    v-model="row.sysDeptStatus"
                    :active-value="0"
                    :inactive-value="1"
                    @change="handleUpdate(row)"
                    style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
                  />
                </template>
              </el-table-column>
              <!-- 表格列，显示部门创建时间 -->
              <el-table-column label="创建时间" prop="createTime" width="180">
                <template #default="{ row }">
                  <div class="time-cell">
                    <span class="time-ago">{{ getTimeAgo(row.createTime) }}</span>
                    <span class="time-exact">{{ row.createTime }}</span>
                  </div>
                </template>
              </el-table-column>
              <!-- 表格列，显示部门备注 -->
              <el-table-column label="备注" prop="sysDeptRemark" min-width="120" show-overflow-tooltip>
                <template #default="{ row }">
                  <span v-if="row.sysDeptRemark">{{ row.sysDeptRemark }}</span>
                  <span v-else class="text-placeholder">-</span>
                </template>
              </el-table-column>
              <!-- 表格列，显示操作按钮 -->
              <el-table-column label="操作" width="200" fixed="right" align="center">
                <template #default="{ row }">
                  <div class="action-buttons">
                    <!-- 编辑按钮 -->
                    <el-tooltip content="编辑" placement="top">
                      <el-button type="primary" link @click.stop="handleEdit(row, 'edit')">
                        <IconifyIconOnline icon="ri:edit-line" />
                      </el-button>
                    </el-tooltip>
                    <!-- 新增子部门按钮 -->
                    <el-tooltip content="添加子部门" placement="top">
                      <el-button type="success" link @click.stop="handleEdit({ sysDeptPid: row.sysDeptId }, 'save')">
                        <IconifyIconOnline icon="ri:add-line" />
                      </el-button>
                    </el-tooltip>
                    <!-- 查看用户按钮 -->
                    <el-tooltip content="查看部门用户" placement="top">
                      <el-button type="warning" link @click.stop="handleSearchUser(row)">
                        <IconifyIconOnline icon="ri:user-line" />
                      </el-button>
                    </el-tooltip>
                    <!-- 权限设置按钮 -->
                    <el-tooltip content="数据权限" placement="top">
                      <el-button type="info" link @click.stop="handleOpenPermission(row)">
                        <IconifyIconOnline icon="ri:shield-user-line" />
                      </el-button>
                    </el-tooltip>
                    <!-- 删除确认弹窗 -->
                    <el-popconfirm :title="$t('message.confimDelete')" @confirm="handleDelete(row)">
                      <template #reference>
                        <el-tooltip content="删除" placement="top">
                          <el-button type="danger" link @click.stop>
                            <IconifyIconOnline icon="ri:delete-bin-line" />
                          </el-button>
                        </el-tooltip>
                      </template>
                    </el-popconfirm>
                  </div>
                </template>
              </el-table-column>
            </ScTable>
          </div>
        </div>
      </template>
    </el-skeleton>
    <!-- 保存对话框组件 -->
    <SaveDialog ref="saveDialogRef" @success="loadData"></SaveDialog>
  </div>
</template>

<style scoped lang="scss">
// 部门管理页面美化样式
.dept-page {
  height: 100%;
  padding: 8px;
  background-color: var(--el-bg-color-page);
}

.dept-wrapper {
  height: 100%;
  background-color: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  box-shadow: var(--el-box-shadow-light);
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;

  &:hover {
    box-shadow: var(--el-box-shadow);
  }
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
    align-items: center;
    gap: 14px;
    padding: 16px 18px;
    background: var(--el-fill-color-lighter);
    border-radius: 12px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
    }

    .stat-icon {
      width: 52px;
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      color: #fff;

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
        color: var(--el-text-color-primary);
        line-height: 1.2;
      }

      .stat-label {
        font-size: 13px;
        color: var(--el-text-color-secondary);
        margin-top: 4px;
      }
    }
  }
}

// 页头样式
.dept-header {
  padding: 16px 20px !important;
  height: auto !important;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
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
  align-items: center;
  gap: 8px;

  .right-panel-search {
    display: flex;
    gap: 8px;
  }
}

// 表格容器
.table-container {
  flex: 1;
  overflow: hidden;
  padding: 16px;
}

// 部门名称单元格
.dept-name-cell {
  display: flex;
  align-items: center;
  gap: 12px;

  .dept-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 20px;
    flex-shrink: 0;

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
  align-items: center;
  justify-content: center;
  gap: 4px;

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
      background-color: var(--el-fill-color-light) !important;
      font-weight: 600;
      color: var(--el-text-color-primary);
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
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

// 标签美化
:deep(.el-tag) {
  border-radius: 4px;
  font-weight: 500;
}

// 响应式适配
@media (max-width: 1200px) {
  .dept-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .dept-stats {
    grid-template-columns: repeat(2, 1fr);
    padding: 12px;
    gap: 12px;

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

// 暗色主题适配
:root[data-theme='dark'] {
  .dept-wrapper {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
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
}
</style>

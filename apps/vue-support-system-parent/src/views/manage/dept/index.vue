<script setup>
// 导入部门管理相关的API请求函数
import { fetchDeleteDept, fetchListDept, fetchUpdateDept } from "@/api/manage/dept";
// 导入防抖工具函数
import { debounce } from "@pureadmin/utils";
// 导入时间处理工具函数
import { getTimeAgo } from "@repo/utils";
// 导入渲染图标的钩子函数
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
// 导入路由实例
import { router } from "@repo/core";
// 导入Base64编码库
import { Base64 } from "js-base64";
// 导入Vue的响应式和生命周期相关API
import { defineAsyncComponent, onMounted, reactive, shallowRef } from "vue";
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
  <div class="fullscreen p-1 overflow-hidden">
    <!-- 权限对话框组件 -->
    <PermissionDialog ref="permissionDialogRef"></PermissionDialog>
    <!-- 骨架屏组件，在数据加载时显示 -->
    <el-skeleton :loading="env.loading" animated>
      <template #default>
        <!-- 页面头部 -->
        <el-header>
          <div class="left-panel">
            <!-- 搜索表单，暂时注释掉 -->
            <!-- <el-form :model="form" :inline="true">
              <el-form-item label="机构名称">
                <el-input v-model="form.sysDeptName" placeholder="机构名称" clearable></el-input>
              </el-form-item>
            </el-form> -->
          </div>
          <div class="right-panel">
            <div class="right-panel-search">
              <!-- 搜索按钮，点击后调用加载数据函数，并进行防抖处理 -->
              <el-button type="primary" :icon="useRenderIcon('ep:search')" @click="debounce(loadData, 1000, true)" />
              <!-- 新增部门按钮，点击后打开保存对话框 -->
              <el-button :icon="useRenderIcon('ep:plus')" @click="handleEdit({}, 'save')" />
            </div>
          </div>
        </el-header>
        <!-- 表格组件，显示部门列表数据 -->
        <ScTable class="overflow-auto" ref="tableRef" :data="tableData" row-key="sysDeptId" @row-click="handleOpenDetail">
          <!-- 表格列，显示部门ID -->
          <el-table-column label="" prop="sysDeptIds"></el-table-column>
          <!-- 表格列，显示部门名称 -->
          <el-table-column label="机构名称" prop="sysDeptName" width="300px">
            <template #default="{ row }">
              <div class="flex justify-between items-start">
                <p>
                  <!-- 显示部门名称 -->
                  {{ row.sysDeptName }}
                  <!-- 显示部门排序，若无则显示0 -->
                  <el-tag size="small" class="ml-1">{{ row.sysDeptSort || 0 }}</el-tag>
                </p>
                <div class="el-form-item-msg">
                  <!-- 显示部门代码 -->
                  <span>{{ row.sysDeptCode }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <!-- 表格列，显示部门权限 -->
          <el-table-column label="权限" prop="sysDeptPermission" width="180px">
            <template #default="{ row }">
              <!-- 若未设置权限则显示提示信息，否则显示权限标签 -->
              <el-tag>{{ !row.sysDeptDataPermission ? "未设置权限" : getPermissionLabel(row.sysDeptDataPermission) }}</el-tag>
            </template>
          </el-table-column>
          <!-- 表格列，显示部门路径 -->
          <el-table-column label="路径" prop="sysDeptTreeId"></el-table-column>
          <!-- 表格列，显示部门是否禁用状态 -->
          <el-table-column label="是否禁用" prop="sysDeptStatus" width="220px">
            <template #default="{ row }">
              <!-- 分段选择器，用于切换部门启用或禁用状态 -->
              <el-segmented
                @change="handleUpdate(row)"
                v-model="row.sysDeptStatus"
                :options="[
                  {
                    label: '启用',
                    value: 0,
                  },
                  {
                    label: '禁用',
                    value: 1,
                  },
                ]"
              >
              </el-segmented>
            </template>
          </el-table-column>
          <!-- 表格列，显示部门创建时间 -->
          <el-table-column label="创建时间" prop="createTime" width="220px">
            <template #default="{ row }">
              <div>
                <!-- 显示相对时间 -->
                <span>{{ getTimeAgo(row.createTime) }}</span>
                <br />
                <!-- 显示具体时间 -->
                <span class="text-gray-400">{{ row.createTime }}</span>
              </div>
            </template>
          </el-table-column>
          <!-- 表格列，显示部门更新时间 -->
          <el-table-column label="更新时间" prop="updateTime" width="220px">
            <template #default="{ row }">
              <div>
                <!-- 显示相对时间 -->
                <span>{{ getTimeAgo(row.updateTime) }}</span>
                <br />
                <!-- 显示具体时间 -->
                <span class="text-gray-400">{{ row.updateTime }}</span>
              </div>
            </template>
          </el-table-column>
          <!-- 表格列，显示部门备注 -->
          <el-table-column label="备注" prop="sysDeptRemark" show-overflow-tooltip />
          <!-- 表格列，显示操作按钮 -->
          <el-table-column label="操作" width="280px" fixed="right">
            <template #default="{ row }">
              <!-- 编辑按钮，点击后打开编辑对话框 -->
              <el-button class="btn-text" :icon="useRenderIcon('ep:edit-pen')" @click="handleEdit(row, 'edit')"></el-button>
              <!-- 新增子部门按钮，点击后打开保存对话框 -->
              <el-button
                class="btn-text"
                :icon="useRenderIcon('line-md:plus')"
                @click="
                  handleEdit(
                    {
                      sysDeptPid: row.sysDeptId,
                    },
                    'save'
                  )
                "
              ></el-button>
              <!-- 搜索用户按钮，点击后跳转到用户页面 -->
              <el-button class="btn-text" :icon="useRenderIcon('line-md:account')" @click="handleSearchUser(row)"></el-button>
              <!-- 打开权限设置对话框按钮 -->
              <el-button class="btn-text" type="primary" :icon="useRenderIcon('ep:menu')" @click="handleOpenPermission(row)"></el-button>
              <!-- 删除确认弹窗，确认后删除部门 -->
              <el-popconfirm :title="$t('message.confimDelete')" @confirm="handleDelete(row)">
                <template #reference>
                  <!-- 删除按钮 -->
                  <el-button class="btn-text" type="danger" :icon="useRenderIcon('ep:delete')"></el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </ScTable>
      </template>
    </el-skeleton>
    <!-- 保存对话框组件 -->
    <SaveDialog ref="saveDialogRef" @success="loadData"></SaveDialog>
  </div>
</template>

<style scoped lang="scss">
// 部门管理页面美化样式
.fullscreen {
  height: 100%;
  background-color: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  box-shadow: var(--el-box-shadow-light);
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: var(--el-box-shadow);
  }
}

// 页头样式
:deep(.el-header) {
  padding: 16px 20px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  background-image: linear-gradient(135deg, var(--el-bg-color) 0%, var(--el-bg-color-page) 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.left-panel {
  flex: 1;
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
      transform: translateY(-1px);
    }

    &:nth-child(even) {
      background-color: var(--el-fill-color-lighter);
    }
  }
}

// 按钮悬浮效果
:deep(.el-button) {
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
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

// 分段选择器美化
:deep(.el-segmented) {
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

// 操作按钮美化
.btn-text {
  transition: all 0.3s;

  &:hover {
    transform: scale(1.1);
  }
}

// 时间显示美化
.text-gray-400 {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

// 部门代码样式
.el-form-item-msg {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background-color: var(--el-fill-color-lighter);
  padding: 2px 6px;
  border-radius: 4px;
}

// 暗色主题适配
:root[data-theme='dark'] {
  .fullscreen {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  }

  :deep(.el-header) {
    background-color: var(--el-bg-color-overlay);
    background-image: linear-gradient(135deg, var(--el-bg-color-overlay) 0%, var(--el-bg-color) 100%);
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

  .el-form-item-msg {
    background-color: var(--el-fill-color);
  }
}
</style>

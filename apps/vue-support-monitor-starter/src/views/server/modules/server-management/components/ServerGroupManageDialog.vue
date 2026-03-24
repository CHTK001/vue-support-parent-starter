<template>
  <sc-dialog
    v-model="visible"
    title="服务器组管理"
    width="900px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    class="group-manage-dialog"
    append-to-body
  >
    <div class="dialog-content">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button type="primary" @click="handleAdd" :icon="Plus">
            新增分组
          </el-button>
          <el-button @click="handleRefresh" :icon="Refresh" :loading="loading">
            刷新
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索分组名称"
            clearable
            style="width: 200px"
            :prefix-icon="Search"
            @input="handleSearch"
          />
        </div>
      </div>

      <!-- 分组列表 -->
      <div class="group-list" v-loading="loading">
        <el-empty
          v-if="filteredGroups.length === 0"
          description="暂无分组数据"
        />
        <div v-else class="group-grid">
          <div
            v-for="group in filteredGroups"
            :key="group.monitorSysGenServerGroupId"
            class="group-card"
            :class="{
              'is-default': group.monitorSysGenServerGroupIsDefault === 1,
            }"
          >
            <div class="card-header">
              <div class="group-info">
                <IconifyIconOnline
                  :icon="group.monitorSysGenServerGroupIcon || 'ri:folder-line'"
                  :style="{
                    color: group.monitorSysGenServerGroupColor || '#409eff',
                  }"
                  class="group-icon"
                />
                <div class="group-details">
                  <div class="group-name">
                    {{ group.monitorSysGenServerGroupName }}
                  </div>
                  <div class="group-desc">
                    {{ group.monitorSysGenServerGroupDesc || "暂无描述" }}
                  </div>
                </div>
              </div>
              <div class="group-actions">
                <el-tag
                  v-if="group.monitorSysGenServerGroupIsDefault === 1"
                  type="primary"
                  size="small"
                  effect="light"
                >
                  默认
                </el-tag>
                <el-tag
                  :type="
                    group.monitorSysGenServerGroupStatus === 1
                      ? 'success'
                      : 'danger'
                  "
                  size="small"
                  effect="light"
                >
                  {{
                    group.monitorSysGenServerGroupStatus === 1 ? "启用" : "禁用"
                  }}
                </el-tag>
              </div>
            </div>

            <div class="card-content">
              <div class="group-stats">
                <div class="stat-item">
                  <span class="stat-label">服务器数量:</span>
                  <span class="stat-value">{{ group.serverCount || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">排序:</span>
                  <span class="stat-value">{{
                    group.monitorSysGenServerGroupSort || 0
                  }}</span>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <el-button-group>
                <el-button size="small" @click="handleEdit(group)" :icon="Edit">
                  编辑
                </el-button>
                <el-button
                  v-if="group.monitorSysGenServerGroupIsDefault !== 1"
                  size="small"
                  type="primary"
                  @click="handleSetDefault(group)"
                  :icon="Star"
                >
                  设为默认
                </el-button>
                <el-button
                  size="small"
                  :type="
                    group.monitorSysGenServerGroupStatus === 1
                      ? 'warning'
                      : 'success'
                  "
                  @click="handleToggleStatus(group)"
                  :icon="
                    group.monitorSysGenServerGroupStatus === 1
                      ? 'el-icon-close'
                      : 'el-icon-check'
                  "
                >
                  {{
                    group.monitorSysGenServerGroupStatus === 1 ? "禁用" : "启用"
                  }}
                </el-button>
                <el-button
                  v-if="
                    group.monitorSysGenServerGroupIsDefault !== 1 &&
                    (group.serverCount || 0) === 0
                  "
                  size="small"
                  type="danger"
                  @click="handleDelete(group)"
                  :icon="Delete"
                >
                  删除
                </el-button>
              </el-button-group>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">关闭</el-button>
      </div>
    </template>
  </sc-dialog>

  <!-- 分组编辑对话框 -->
  <ServerGroupEditDialog ref="editDialogRef" @success="handleRefresh" />
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { message } from "@repo/utils";
import {
  Plus,
  Refresh,
  Search,
  Edit,
  Star,
  Delete,
} from "@element-plus/icons-vue";
import {
  type ServerGroup,
  getAllServerGroups,
  setDefaultGroup,
  toggleGroupStatus,
  deleteServerGroup,
  getGroupServerCount,
} from "@/api/server/group";
import ServerGroupEditDialog from "../../server-group/components/ServerGroupEditDialog.vue";

// 响应式状态
const visible = ref(false);
const loading = ref(false);
const searchKeyword = ref("");
const groups = ref<ServerGroup[]>([]);
const editDialogRef = ref();

// 计算属性
const filteredGroups = computed(() => {
  if (!searchKeyword.value) return groups.value;
  return groups.value.filter((group) =>
    group.monitorSysGenServerGroupName
      ?.toLowerCase()
      .includes(searchKeyword.value.toLowerCase())
  );
});

/**
 * 打开对话框
 */
const open = () => {
  visible.value = true;
  loadGroups();
};

/**
 * 加载分组列表
 */
const loadGroups = async () => {
  try {
    loading.value = true;
    const result = await getAllServerGroups();
    if (result.success && result.data) {
      groups.value = result.data;

      // 加载每个分组的服务器数量
      for (const group of groups.value) {
        if (group.monitorSysGenServerGroupId) {
          try {
            const countResult = await getGroupServerCount(
              group.monitorSysGenServerGroupId
            );
            if (countResult.success) {
              group.serverCount = countResult.data;
            }
          } catch (error) {
            console.error("获取分组服务器数量失败:", error);
          }
        }
      }
    }
  } catch (error) {
    console.error("加载分组列表失败:", error);
    message.error("加载分组列表失败");
  } finally {
    loading.value = false;
  }
};

/**
 * 刷新列表
 */
const handleRefresh = () => {
  loadGroups();
};

/**
 * 搜索
 */
const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
};

/**
 * 新增分组
 */
const handleAdd = () => {
  editDialogRef.value?.open("add");
};

/**
 * 编辑分组
 */
const handleEdit = (group: ServerGroup) => {
  editDialogRef.value?.open("edit", group);
};

/**
 * 设为默认分组
 */
const handleSetDefault = async (group: ServerGroup) => {
  try {
    if (!group.monitorSysGenServerGroupId) return;

    const result = await setDefaultGroup(group.monitorSysGenServerGroupId);
    if (result.success) {
      message.success("设置默认分组成功");
      loadGroups();
    } else {
      message.error(result.message || "设置默认分组失败");
    }
  } catch (error) {
    console.error("设置默认分组失败:", error);
    message.error("设置默认分组失败");
  }
};

/**
 * 切换分组状态
 */
const handleToggleStatus = async (group: ServerGroup) => {
  try {
    if (!group.monitorSysGenServerGroupId) return;

    const newStatus = group.monitorSysGenServerGroupStatus === 1 ? 0 : 1;
    const result = await toggleGroupStatus(
      group.monitorSysGenServerGroupId,
      newStatus
    );
    if (result.success) {
      message.success(`${newStatus === 1 ? "启用" : "禁用"}分组成功`);
      loadGroups();
    } else {
      message.error(result.message || "操作失败");
    }
  } catch (error) {
    console.error("切换分组状态失败:", error);
    message.error("操作失败");
  }
};

/**
 * 删除分组
 */
const handleDelete = async (group: ServerGroup) => {
  try {
    if (!group.monitorSysGenServerGroupId) return;

    await ElMessageBox.confirm(
      `确定要删除分组 "${group.monitorSysGenServerGroupName}" 吗？`,
      "确认删除",
      {
        type: "warning",
        confirmButtonText: "确定",
        cancelButtonText: "取消",
      }
    );

    const result = await deleteServerGroup(group.monitorSysGenServerGroupId);
    if (result.success) {
      message.success("删除分组成功");
      loadGroups();
    } else {
      message.error(result.message || "删除分组失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除分组失败:", error);
      message.error("删除分组失败");
    }
  }
};

// 暴露方法
defineExpose({
  open,
});
</script>

<style lang="scss" scoped>
.group-manage-dialog {
  :deep(.el-dialog__body) {
    padding: 20px;
  }
}

.dialog-content {
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--el-border-color-light);

    .toolbar-left {
      display: flex;
      gap: 12px;
    }
  }

  .group-list {
    min-height: 400px;
    max-height: 600px;
    overflow-y: auto;
  }

  .group-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 16px;
  }

  .group-card {
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    padding: 16px;
    background: var(--el-bg-color-overlay);
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--el-color-primary);
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
    }

    &.is-default {
      border-color: var(--el-color-primary);
      background: linear-gradient(
        135deg,
        rgba(64, 158, 255, 0.05) 0%,
        rgba(64, 158, 255, 0.02) 100%
      );
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;

      .group-info {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;

        .group-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .group-details {
          flex: 1;
          min-width: 0;

          .group-name {
            font-size: 16px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            margin-bottom: 4px;
            word-break: break-all;
          }

          .group-desc {
            font-size: 12px;
            color: var(--el-text-color-secondary);
            word-break: break-all;
          }
        }
      }

      .group-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
      }
    }

    .card-content {
      margin-bottom: 16px;

      .group-stats {
        display: flex;
        gap: 16px;

        .stat-item {
          display: flex;
          align-items: center;
          gap: 4px;

          .stat-label {
            font-size: 12px;
            color: var(--el-text-color-secondary);
          }

          .stat-value {
            font-size: 14px;
            font-weight: 600;
            color: var(--el-color-primary);
          }
        }
      }
    }

    .card-footer {
      border-top: 1px solid var(--el-border-color-lighter);
      padding-top: 12px;

      :deep(.el-button-group) {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .el-button {
          margin: 0;
          flex: 1;
          min-width: 80px;
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}


// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>

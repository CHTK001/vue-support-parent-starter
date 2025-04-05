<template>
  <div class="maintenance-container">
    <div class="maintenance-header">
      <div class="header-title">
        <IconifyIconOnline icon="ri:server-line" />
        <span>维护组管理</span>
      </div>
      <div class="header-actions">
        <el-button plain @click="fetchGroups">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新
        </el-button>
        <el-button type="primary" @click="openCreateDialog">
          <IconifyIconOnline icon="ri:add-line" class="mr-1" />
          新增维护组
        </el-button>
      </div>
    </div>

    <!-- 维护组卡片列表 -->
    <div class="maintenance-content">
      <el-row :gutter="16">
        <el-col v-for="group in groupList" :key="group.maintenanceGroupId" :xs="24" :sm="12" :md="8" :lg="6">
          <div class="maintenance-card" @click="openGroupDetail(group)" @dragover.prevent @drop="handleDrop($event, group)">
            <div class="card-header" :class="{ disabled: !group.maintenanceGroupStatus }">
              <span class="group-name">{{ group.maintenanceGroupName }}</span>
              <div class="actions">
                <el-dropdown @command="handleCommand($event, group)" @click.stop>
                  <IconifyIconOnline icon="ri:more-2-fill" class="more-icon" />
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="edit">
                        <IconifyIconOnline icon="ri:edit-line" />
                        编辑
                      </el-dropdown-item>
                      <el-dropdown-item command="status">
                        <IconifyIconOnline :icon="group.maintenanceGroupStatus ? 'ri:forbid-line' : 'ri:check-line'" />
                        {{ group.maintenanceGroupStatus ? "禁用" : "启用" }}
                      </el-dropdown-item>
                      <el-dropdown-item command="delete" divided>
                        <IconifyIconOnline icon="ri:delete-bin-line" class="text-danger" />
                        删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
            <div class="card-content">
              <div class="info-item">
                <span class="info-label">状态：</span>
                <el-tag :type="group.maintenanceGroupEnabled ? 'success' : 'danger'" size="small">
                  {{ group.maintenanceGroupEnabled ? "启用" : "禁用" }}
                </el-tag>
              </div>
              <div class="info-item">
                <span class="info-label">描述：</span>
                <span class="info-value">{{ group.maintenanceGroupDesc || "暂无描述" }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">创建时间：</span>
                <span class="info-value">{{ formatDate(group.createTime) }}</span>
              </div>
            </div>
            <div class="card-footer">
              <div class="stats">
                <div class="stat-item">
                  <IconifyIconOnline icon="ri:computer-line" />
                  <span>{{ group.hostCount || 0 }}台主机</span>
                </div>
                <div class="stat-item">
                  <IconifyIconOnline icon="ri:file-code-line" />
                  <span>{{ group.scriptCount || 0 }}个脚本</span>
                </div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 空状态展示 -->
      <el-empty v-if="groupList.length === 0" description="暂无维护组" :image-size="200" />
    </div>

    <!-- 维护组表单对话框 -->
    <group-form-dialog ref="groupFormDialogRef" @submit="handleGroupFormSubmit" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, defineAsyncComponent } from "vue";
import { message } from "@repo/utils";
import { fetchMaintenanceGroups, createMaintenanceGroup, updateMaintenanceGroup, deleteMaintenanceGroup, enableMaintenanceGroup, uploadFileToGroup } from "@/api/monitor/maintenance";
import { useRouter } from "vue-router";

// 引入组件
const GroupFormDialog = defineAsyncComponent(() => import("./components/dialogs/GroupFormDialog.vue"));

// 维护组列表数据
const groupList = ref([]);
const loading = ref(false);

// 表单对话框相关
const groupFormDialogRef = ref(null);

// 使用路由
const router = useRouter();

// 获取维护组列表
const fetchGroups = () => {
  loading.value = true;
  fetchMaintenanceGroups()
    .then(res => {
      groupList.value = res.data || [];
      loading.value = false;
    })
    .catch(error => {
      console.error("获取维护组列表失败:", error);
      message("获取维护组列表失败", { type: "error" });
      loading.value = false;
    });
};

// 打开创建对话框
const openCreateDialog = () => {
  groupFormDialogRef.value?.openAdd();
};

// 打开编辑对话框
const openEditDialog = group => {
  groupFormDialogRef.value?.openEdit(group);
};

// 处理表单提交
const handleGroupFormSubmit = (formData, isCreate) => {
  if (isCreate) {
    createMaintenanceGroup(formData)
      .then(() => {
        message("创建维护组成功", { type: "success" });
        fetchGroups();
        groupFormDialogRef.value.close();
        groupFormDialogRef.value.submitting = false;
      })
      .catch(error => {
        console.error("创建维护组失败:", error);
        message("创建维护组失败", { type: "error" });
        groupFormDialogRef.value.submitting = false;
      });
  } else {
    updateMaintenanceGroup(formData)
      .then(() => {
        message("更新维护组成功", { type: "success" });
        fetchGroups();
        groupFormDialogRef.value.close();
        groupFormDialogRef.value.submitting = false;
      })
      .catch(error => {
        console.error("更新维护组失败:", error);
        message("更新维护组失败", { type: "error" });
        groupFormDialogRef.value.submitting = false;
      });
  }
};

// 删除维护组
const deleteGroup = group => {
  deleteMaintenanceGroup(group.maintenanceGroupId)
    .then(() => {
      message("删除维护组成功", { type: "success" });
      fetchGroups();
    })
    .catch(error => {
      console.error("删除维护组失败:", error);
      message("删除维护组失败", { type: "error" });
    });
};

// 更新维护组状态
const updateGroupStatus = group => {
  const newStatus = group.maintenanceGroupEnabled === true ? 0 : 1;
  enableMaintenanceGroup(group.maintenanceGroupId, newStatus)
    .then(() => {
      message(`${newStatus === 1 ? "启用" : "禁用"}维护组成功`, { type: "success" });
      fetchGroups();
    })
    .catch(error => {
      console.error("更新维护组状态失败:", error);
      message("更新维护组状态失败", { type: "error" });
    });
};

// 处理下拉菜单命令
const handleCommand = (command, group) => {
  switch (command) {
    case "edit":
      openEditDialog(group);
      break;
    case "status":
      updateGroupStatus(group);
      break;
    case "delete":
      ElMessageBox.confirm("确定要删除该维护组吗？删除后无法恢复。", "删除确认", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          deleteGroup(group);
        })
        .catch(() => {});
      break;
  }
};

// 打开维护组详情
const openGroupDetail = group => {
  // 使用路由导航到详情页
  router.push(`/maintenance/detail/${group.maintenanceGroupId}`);
};

// 处理文件拖拽上传
const handleDrop = (event, group) => {
  event.preventDefault();
  const files = event.dataTransfer.files;
  if (files.length === 0) return;

  // 创建确认对话框
  ElMessageBox.confirm(`确定要将${files.length}个文件上传到维护组 ${group.maintenanceGroupName} 吗？`, "上传确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "info"
  })
    .then(() => {
      const formData = new FormData();
      formData.append("maintenanceGroupId", group.maintenanceGroupId);
      formData.append("isOverride", 1); // 默认覆盖

      // 添加所有文件到表单
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      uploadFileToGroup(formData)
        .then(() => {
          message("文件上传成功", { type: "success" });
        })
        .catch(error => {
          console.error("文件上传失败:", error);
          message("文件上传失败", { type: "error" });
        });
    })
    .catch(() => {
      // 用户取消上传，不做处理
    });
};

// 格式化日期
const formatDate = dateString => {
  if (!dateString) return "未知";
  return new Date(dateString).toLocaleString();
};

// 组件挂载时获取数据
onMounted(() => {
  fetchGroups();
});
</script>

<style lang="scss" scoped>
.maintenance-container {
  height: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
  overflow: hidden;
  max-height: 100vh;
  box-sizing: border-box;

  .maintenance-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    position: relative;
    padding-bottom: 12px;

    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 1px;
      background: linear-gradient(90deg, var(--el-color-primary-light-7), transparent);
    }

    .header-title {
      display: flex;
      align-items: center;
      font-size: 20px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      .iconify {
        margin-right: 10px;
        font-size: 26px;
        color: var(--el-color-primary);
      }
    }

    .header-actions {
      .el-button {
        border-radius: 8px;
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
        }
      }
    }
  }

  .maintenance-content {
    flex: 1;
    overflow: auto;
    padding-right: 4px;
    margin-bottom: 0;

    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--el-color-primary-light-8);
      border-radius: 10px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }

  .maintenance-card {
    margin-bottom: 18px;
    border-radius: 12px;
    box-shadow:
      0 6px 16px -8px rgba(0, 0, 0, 0.08),
      0 9px 28px 0 rgba(0, 0, 0, 0.05),
      0 12px 48px 16px rgba(0, 0, 0, 0.03);
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    background: var(--el-bg-color-overlay);
    overflow: hidden;
    position: relative;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 0;
      background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.1), transparent);
      transition: height 0.35s ease;
      z-index: 0;
    }

    &:hover {
      transform: translateY(-6px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);

      &::before {
        height: 100%;
      }
    }

    .card-header {
      padding: 16px 18px;
      background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-dark-2));
      color: white;
      border-radius: 12px 12px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      overflow: hidden;

      &::after {
        content: "";
        position: absolute;
        bottom: 0;
        right: 0;
        width: 40%;
        height: 50%;
        background: radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.1), transparent);
        pointer-events: none;
      }

      &.disabled {
        background: linear-gradient(135deg, var(--el-color-info), var(--el-color-info-dark-2));
      }

      .group-name {
        font-weight: 600;
        font-size: 17px;
        letter-spacing: 0.3px;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }

      .actions {
        z-index: 10;

        .more-icon {
          cursor: pointer;
          font-size: 22px;
          transition: transform 0.3s ease;

          &:hover {
            transform: rotate(90deg);
          }
        }
      }
    }

    .card-content {
      padding: 18px;
      background-color: var(--el-bg-color-overlay);
      position: relative;
      z-index: 1;

      .info-item {
        margin-bottom: 10px;
        display: flex;

        &:last-child {
          margin-bottom: 0;
        }

        .info-label {
          font-weight: 500;
          color: var(--el-text-color-secondary);
          min-width: 70px;
        }

        .info-value {
          flex: 1;
          word-break: break-all;
          color: var(--el-text-color-primary);
        }
      }
    }

    .card-footer {
      padding: 14px 18px;
      border-top: 1px solid var(--el-border-color-lighter);
      background-color: var(--el-fill-color-light);
      border-radius: 0 0 12px 12px;

      .stats {
        display: flex;
        justify-content: space-around;

        .stat-item {
          display: flex;
          align-items: center;
          background-color: var(--el-fill-color);
          padding: 6px 12px;
          border-radius: 20px;
          transition: all 0.3s ease;

          &:hover {
            background-color: var(--el-color-primary-light-9);
            transform: translateY(-2px);
          }

          .iconify {
            margin-right: 6px;
            color: var(--el-color-primary);
            font-size: 16px;
          }
        }
      }
    }
  }
}

.text-danger {
  color: var(--el-color-danger);
}

.mr-1 {
  margin-right: 4px;
}

// 拖拽区域样式
[draggable="true"] {
  cursor: move;
}

.el-row {
  margin-bottom: 0 !important;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--el-color-primary-rgb), 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(var(--el-color-primary-rgb), 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(var(--el-color-primary-rgb), 0);
  }
}

// 响应式设计优化
@media (max-width: 768px) {
  .maintenance-container {
    padding: 12px;

    .maintenance-header {
      flex-direction: column;
      align-items: flex-start;

      .header-actions {
        width: 100%;
        margin-top: 12px;
        display: flex;
        justify-content: flex-end;
      }
    }
  }
}
</style>

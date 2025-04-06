<template>
  <div class="maintenance-container">
    <div class="maintenance-header">
      <div class="header-title">
        <IconifyIconOnline icon="ri:server-line" class="header-icon" />
        <span>维护组管理</span>
      </div>
      <div class="header-actions">
        <el-button plain class="refresh-btn" @click="fetchGroups">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新
        </el-button>
        <el-button type="primary" class="create-btn" @click="openCreateDialog">
          <IconifyIconOnline icon="ri:add-line" class="mr-1" />
          新增维护组
        </el-button>
      </div>
    </div>

    <!-- 维护组卡片列表 -->
    <div class="maintenance-content">
      <el-row :gutter="16">
        <el-col v-for="group in groupList" :key="group.maintenanceGroupId" :xs="24" :sm="12" :md="8" :lg="6">
          <div class="maintenance-card" :class="{ 'card-disabled': !group.maintenanceGroupEnabled }" @click="openGroupDetail(group)" @dragover.prevent @drop="handleDrop($event, group)">
            <div class="card-header" :class="{ disabled: !group.maintenanceGroupEnabled }">
              <div class="header-content">
                <IconifyIconOnline icon="ri:folder-shield-2-line" class="card-icon" />
                <span class="group-name">{{ group.maintenanceGroupName }}</span>
              </div>
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
                        <IconifyIconOnline :icon="group.maintenanceGroupEnabled ? 'ri:forbid-line' : 'ri:check-line'" />
                        {{ group.maintenanceGroupEnabled ? "禁用" : "启用" }}
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
              <div class="info-item status-item">
                <span class="info-label">状态：</span>
                <el-tag :type="group.maintenanceGroupEnabled ? 'success' : 'danger'" :effect="group.maintenanceGroupEnabled ? 'light' : 'plain'" size="small" class="status-tag">
                  <IconifyIconOnline :icon="group.maintenanceGroupEnabled ? 'ri:checkbox-circle-fill' : 'ri:forbid-2-fill'" class="status-icon" />
                  {{ group.maintenanceGroupEnabled ? "启用" : "禁用" }}
                </el-tag>
              </div>
              <div class="info-item">
                <span class="info-label">描述：</span>
                <span class="info-value description">{{ group.maintenanceGroupDesc || "暂无描述" }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">创建时间：</span>
                <span class="info-value">
                  <IconifyIconOnline icon="ri:time-line" class="time-icon" />
                  {{ formatDate(group.createTime) }}
                </span>
              </div>
            </div>
            <div class="card-footer">
              <div class="stats">
                <div class="stat-item">
                  <IconifyIconOnline icon="ri:computer-line" class="stat-icon" />
                  <span>
                    {{ group.hostCount || 0 }}
                    <small>台主机</small>
                  </span>
                </div>
                <div class="stat-item">
                  <IconifyIconOnline icon="ri:file-code-line" class="stat-icon" />
                  <span>
                    {{ group.scriptCount || 0 }}
                    <small>个脚本</small>
                  </span>
                </div>
              </div>
              <div class="card-actions">
                <el-tooltip content="查看详情" placement="top" :show-after="300">
                  <div class="action-btn view-btn">
                    <IconifyIconOnline icon="ri:eye-line" />
                  </div>
                </el-tooltip>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 空状态展示 -->
      <div v-if="groupList.length === 0" class="empty-state">
        <el-empty description="暂无维护组" :image-size="200">
          <template #description>
            <p class="empty-text">暂无维护组</p>
          </template>
          <el-button type="primary" class="empty-action" @click="openCreateDialog">
            <IconifyIconOnline icon="ri:add-line" class="mr-1" />
            创建第一个维护组
          </el-button>
        </el-empty>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="3" animated />
        <el-skeleton style="margin-top: 20px" :rows="3" animated />
      </div>
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
  // 移除所有卡片的拖拽悬停状态
  document.querySelectorAll(".maintenance-card").forEach(card => {
    card.classList.remove("drag-over");
  });

  const files = event.dataTransfer.files;
  if (files.length === 0) return;

  // 创建确认对话框
  ElMessageBox.confirm(
    `<div style="text-align: center;">
      <i class="el-icon" style="font-size: 24px; color: var(--el-color-primary); margin-bottom: 10px;">
        <IconifyIconOnline icon="ri:upload-cloud-2-line" />
      </i>
      <div style="margin-bottom: 10px; font-weight: 500;">文件上传确认</div>
      <div>确定要将 <b style="color: var(--el-color-primary);">${files.length}</b> 个文件上传到维护组 <b style="color: var(--el-color-primary);">${group.maintenanceGroupName}</b> 吗？</div>
    </div>`,
    {
      confirmButtonText: "确定上传",
      cancelButtonText: "取消",
      type: "info",
      dangerouslyUseHTMLString: true,
      customClass: "upload-confirm-dialog"
    }
  )
    .then(() => {
      const formData = new FormData();
      formData.append("maintenanceGroupId", group.maintenanceGroupId);
      formData.append("isOverride", 1); // 默认覆盖

      // 添加所有文件到表单
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      // 显示上传中的消息
      const loadingMessage = ElMessage({
        type: "info",
        message: `<div style="display: flex; align-items: center; gap: 8px;">
                  <i class="el-icon"><IconifyIconOnline icon="ri:loader-4-line" class="rotating-icon" /></i>
                  <span>正在上传文件到 ${group.maintenanceGroupName}...</span>
                </div>`,
        dangerouslyUseHTMLString: true,
        duration: 0
      });

      uploadFileToGroup(formData)
        .then(() => {
          // 关闭上传中消息
          loadingMessage.close();
          message("文件上传成功", { type: "success" });
          // 刷新维护组列表以更新文件计数
          fetchGroups();
        })
        .catch(error => {
          // 关闭上传中消息
          loadingMessage.close();
          console.error("文件上传失败:", error);
          message("文件上传失败", { type: "error" });
        });
    })
    .catch(() => {
      // 用户取消上传，不做处理
    });
};

// 处理拖拽进入事件
const handleDragOver = (event, group) => {
  event.preventDefault();
  // 添加拖拽悬停状态
  event.currentTarget.classList.add("drag-over");
};

// 处理拖拽离开事件
const handleDragLeave = event => {
  event.preventDefault();
  // 移除拖拽悬停状态
  event.currentTarget.classList.remove("drag-over");
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
  background-image:
    radial-gradient(circle at 10% 10%, rgba(var(--el-color-primary-rgb), 0.05), transparent 40%), radial-gradient(circle at 90% 90%, rgba(var(--el-color-primary-rgb), 0.05), transparent 40%),
    radial-gradient(circle at 50% 50%, rgba(var(--el-color-primary-rgb), 0.02), transparent 70%);
  overflow: hidden;
  max-height: 100vh;
  box-sizing: border-box;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle at center, rgba(var(--el-color-primary-rgb), 0.01), transparent 60%);
    opacity: 0.8;
    animation: rotate 60s linear infinite;
    pointer-events: none;
    z-index: 0;
  }

  .maintenance-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    position: relative;
    padding-bottom: 16px;
    animation: fadeIn 0.5s ease-in-out;
    backdrop-filter: blur(8px);
    border-radius: 20px;
    padding: 18px 24px;
    box-shadow:
      0 4px 20px rgba(0, 0, 0, 0.06),
      0 1px 3px rgba(0, 0, 0, 0.03),
      0 0 0 1px rgba(var(--el-color-primary-rgb), 0.05);
    z-index: 1;
    background-color: rgba(var(--el-bg-color-rgb), 0.7);

    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-primary-light-8), transparent);
      border-radius: 2px;
    }

    .header-title {
      display: flex;
      align-items: center;
      font-size: 22px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      position: relative;

      .header-icon {
        margin-right: 12px;
        font-size: 28px;
        color: var(--el-color-primary);
        filter: drop-shadow(0 2px 4px rgba(var(--el-color-primary-rgb), 0.3));
        animation: pulse 2s infinite;
        transform-origin: center;
        transition: transform 0.3s ease;

        &:hover {
          transform: rotate(15deg) scale(1.1);
        }
      }

      span {
        background: linear-gradient(to right, var(--el-color-primary), var(--el-color-primary-light-3));
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        position: relative;
        padding-bottom: 2px;

        &::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(to right, var(--el-color-primary), var(--el-color-primary-light-3));
          transition: width 0.3s ease;
        }

        &:hover::after {
          width: 100%;
        }
      }
    }

    .header-actions {
      display: flex;
      gap: 12px;

      .el-button {
        border-radius: 10px;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        padding: 10px 16px;
        font-weight: 500;

        &:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 15px rgba(var(--el-color-primary-rgb), 0.25);
        }

        &:active {
          transform: translateY(-1px);
        }
      }

      .refresh-btn {
        &:hover {
          .iconify {
            animation: spin 1s ease;
          }
        }
      }

      .create-btn {
        position: relative;
        overflow: hidden;
        z-index: 1;

        &::before {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
          transition: left 0.7s ease;
          z-index: -1;
        }

        &:hover::before {
          left: 100%;
        }
      }
    }
  }

  .maintenance-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 6px;
    margin-bottom: 0;
    animation: fadeInUp 0.6s ease-out;

    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--el-color-primary-light-7);
      border-radius: 10px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }

  .maintenance-card {
    margin-bottom: 20px;
    border-radius: 20px;
    box-shadow:
      0 10px 25px -8px rgba(0, 0, 0, 0.09),
      0 12px 28px 0 rgba(0, 0, 0, 0.06),
      0 15px 48px 16px rgba(0, 0, 0, 0.03),
      0 0 0 1px rgba(var(--el-color-primary-rgb), 0.05);
    transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    cursor: pointer;
    background: var(--el-bg-color-overlay);
    overflow: hidden;
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(var(--el-color-primary-rgb), 0.08);
    animation: fadeInUp 0.5s ease-out;
    animation-fill-mode: both;
    backdrop-filter: blur(8px);
    animation-delay: calc(0.08s * var(--el-col-span, 0));
    transform-origin: center;
    will-change: transform, box-shadow;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 0;
      background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.08), transparent);
      transition: height 0.4s ease;
      z-index: 0;
    }

    &:hover {
      transform: translateY(-10px) scale(1.03);
      box-shadow:
        0 20px 35px rgba(0, 0, 0, 0.15),
        0 0 0 1px rgba(var(--el-color-primary-rgb), 0.15),
        0 0 30px rgba(var(--el-color-primary-rgb), 0.15);

      &::before {
        height: 100%;
        opacity: 0.8;
      }

      .card-header::after {
        opacity: 1;
      }

      .card-icon {
        transform: rotate(10deg) scale(1.2);
      }
    }

    &.card-disabled {
      opacity: 0.75;
      background: linear-gradient(to bottom, var(--el-fill-color-light), var(--el-fill-color-lighter));
      border: 1px dashed var(--el-border-color);

      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.03);
        pointer-events: none;
        z-index: 1;
      }

      .group-name {
        text-decoration: line-through;
        color: var(--el-text-color-secondary);
      }

      .card-header {
        &.disabled {
          background-color: var(--el-fill-color-darker);
          border-bottom: 1px dashed var(--el-border-color);
        }
      }
    }

    .card-header {
      padding: 20px 22px;
      background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-dark-2));
      color: white;
      border-radius: 20px 20px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 15px -5px rgba(var(--el-color-primary-rgb), 0.5);
      transition: all 0.4s ease;

      &::after {
        content: "";
        position: absolute;
        top: 0;
        right: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.2), transparent 70%);
        pointer-events: none;
        opacity: 0.7;
        transition: opacity 0.3s ease;
      }

      &.disabled {
        background: linear-gradient(135deg, var(--el-color-info), var(--el-color-info-dark-2));
      }

      .header-content {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .card-icon {
        font-size: 24px;
        color: white;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        transform-origin: center;
        margin-right: 2px;
      }

      .group-name {
        font-weight: 600;
        font-size: 18px;
        letter-spacing: 0.4px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 180px;
        position: relative;
        padding-bottom: 2px;

        &::after {
          content: "";
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 2px;
          background: rgba(255, 255, 255, 0.7);
          transition: width 0.3s ease;
          border-radius: 2px;
        }

        .maintenance-card:hover &::after {
          width: 100%;
        }
      }

      .actions {
        z-index: 10;

        .more-icon {
          cursor: pointer;
          font-size: 22px;
          transition: transform 0.3s ease;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));

          &:hover {
            transform: rotate(90deg);
          }
        }
      }
    }

    .card-content {
      padding: 20px 22px;
      background-color: var(--el-bg-color-overlay);
      position: relative;
      z-index: 1;
      flex: 1;
      transition: all 0.3s ease;
      border-left: 1px solid rgba(var(--el-color-primary-rgb), 0.08);
      border-right: 1px solid rgba(var(--el-color-primary-rgb), 0.08);
      background-image: radial-gradient(circle at 90% 10%, rgba(var(--el-color-primary-rgb), 0.03), transparent 70%);

      .info-item {
        margin-bottom: 12px;
        display: flex;
        align-items: flex-start;
        transition: transform 0.3s ease;

        &:hover {
          transform: translateX(3px);
        }

        &:last-child {
          margin-bottom: 0;
        }

        &.status-item {
          .status-tag {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 0 10px;
            height: 24px;
            border-radius: 12px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;

            &::before {
              content: "";
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0));
              transition: left 0.7s ease;
              z-index: 1;
            }

            &:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);

              &::before {
                left: 100%;
              }
            }

            .status-icon {
              font-size: 14px;
              animation: pulse 2s infinite;
            }
          }
        }

        .info-label {
          font-weight: 500;
          color: var(--el-text-color-secondary);
          min-width: 70px;
          position: relative;
          transition: all 0.3s ease;
          padding-left: 2px;

          &::before {
            content: "";
            position: absolute;
            left: -5px;
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
            height: 0;
            background: var(--el-color-primary);
            border-radius: 3px;
            transition: height 0.3s ease;
            opacity: 0;
          }

          .info-item:hover &::before {
            height: 80%;
            opacity: 1;
          }
        }

        .info-value {
          flex: 1;
          word-break: break-all;
          color: var(--el-text-color-primary);
          line-height: 1.5;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.3s ease;
          position: relative;
          padding: 2px 0;
          border-radius: 4px;

          .info-item:hover & {
            background-color: rgba(var(--el-color-primary-rgb), 0.05);
            padding-left: 6px;
          }

          &.description {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
            max-height: 3em;
            position: relative;
            padding-left: 0;

            &::after {
              content: "";
              position: absolute;
              bottom: -2px;
              left: 0;
              width: 0;
              height: 1px;
              background: linear-gradient(to right, var(--el-color-primary-light-5), transparent);
              transition: width 0.3s ease;
            }

            .info-item:hover &::after {
              width: 100%;
            }
          }

          .time-icon {
            color: var(--el-color-info);
            font-size: 14px;
            transition: transform 0.3s ease;

            .info-item:hover & {
              transform: rotate(360deg);
              color: var(--el-color-primary);
            }
          }
        }
      }
    }

    .card-footer {
      padding: 16px 22px;
      border-top: 1px solid var(--el-border-color-lighter);
      background-color: var(--el-fill-color-light);
      border-radius: 0 0 20px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
      background-image: linear-gradient(to right, rgba(var(--el-color-primary-rgb), 0.02), transparent);

      &::before {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 3px;
        background: linear-gradient(to right, var(--el-color-primary-light-5), transparent);
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 0.5s ease;
      }

      .maintenance-card:hover &::before {
        transform: scaleX(1);
      }

      .stats {
        display: flex;
        gap: 12px;

        .stat-item {
          display: flex;
          align-items: center;
          background-color: var(--el-fill-color);
          padding: 6px 12px;
          border-radius: 20px;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
          position: relative;
          overflow: hidden;

          &::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.1), transparent);
            opacity: 0;
            transition: opacity 0.3s ease;
          }

          &:hover {
            background-color: var(--el-color-primary-light-9);
            transform: translateY(-2px) scale(1.05);
            box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);

            &::before {
              opacity: 1;
            }
          }

          .stat-icon {
            margin-right: 6px;
            color: var(--el-color-primary);
            font-size: 16px;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            filter: drop-shadow(0 1px 2px rgba(var(--el-color-primary-rgb), 0.3));

            .stat-item:hover & {
              transform: rotate(15deg) scale(1.2);
              color: var(--el-color-primary-dark-2);
            }
          }

          span {
            font-weight: 600;
            color: var(--el-color-primary-dark-2);
            transition: all 0.3s ease;
            position: relative;

            .stat-item:hover & {
              color: var(--el-color-primary);
            }

            small {
              font-weight: normal;
              opacity: 0.8;
              margin-left: 2px;
              transition: all 0.3s ease;

              .stat-item:hover & {
                opacity: 1;
                letter-spacing: 0.3px;
              }
            }
          }
        }
      }

      .card-actions {
        display: flex;
        gap: 8px;

        .action-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--el-color-primary-light-9);
          color: var(--el-color-primary);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          cursor: pointer;
          position: relative;
          overflow: hidden;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);

          &::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle at center, rgba(255, 255, 255, 0.8), transparent 70%);
            opacity: 0;
            transition: opacity 0.3s ease;
          }

          &:hover {
            background-color: var(--el-color-primary);
            color: white;
            transform: scale(1.15) rotate(5deg);
            box-shadow: 0 4px 10px rgba(var(--el-color-primary-rgb), 0.3);

            &::before {
              opacity: 0.3;
              animation: pulse 1.5s infinite;
            }
          }

          &.view-btn {
            background-color: var(--el-color-primary-light-8);

            &:hover {
              background-color: var(--el-color-primary);
            }
          }
        }
      }
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 300px;
    animation: fadeIn 0.8s ease-out;
    background: radial-gradient(circle at center, rgba(var(--el-color-primary-rgb), 0.04), transparent 70%), linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.02), transparent);
    border-radius: 28px;
    padding: 50px;
    box-shadow: inset 0 0 20px rgba(var(--el-color-primary-rgb), 0.03);
    border: 1px solid rgba(var(--el-color-primary-rgb), 0.05);

    .empty-text {
      font-size: 16px;
      color: var(--el-text-color-secondary);
      margin: 16px 0;
      letter-spacing: 0.5px;
      font-weight: 500;
      background: linear-gradient(to right, var(--el-color-info), var(--el-color-info-dark-2));
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    .empty-action {
      margin-top: 20px;
      padding: 14px 28px;
      border-radius: 16px;
      transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
      overflow: hidden;
      font-weight: 500;
      letter-spacing: 0.6px;
      box-shadow: 0 4px 15px rgba(var(--el-color-primary-rgb), 0.2);

      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
        transition: left 0.7s ease;
        z-index: 1;
      }

      &:hover {
        transform: translateY(-3px) scale(1.05);
        box-shadow:
          0 6px 15px rgba(var(--el-color-primary-rgb), 0.2),
          0 0 0 1px rgba(var(--el-color-primary-rgb), 0.1);

        &::before {
          left: 100%;
        }
      }
    }
  }

  .loading-container {
    padding: 20px;
    animation: fadeIn 0.5s ease-out;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(var(--el-color-primary-rgb), 0.02), transparent);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: -100%;
      width: 50%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(var(--el-color-primary-rgb), 0.05), transparent);
      animation: shimmer 2s infinite;
    }

    .el-skeleton {
      position: relative;
      z-index: 1;
    }

    .loading-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      position: relative;

      &::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 2px;
        background: linear-gradient(90deg, var(--el-color-primary-light-8), var(--el-color-primary-light-9), transparent);
        border-radius: 2px;
      }

      .loading-title {
        display: flex;
        align-items: center;
      }
    }

    .loading-card {
      margin-bottom: 20px;
      border-radius: 16px;
      box-shadow: 0 10px 20px -8px rgba(0, 0, 0, 0.08);
      overflow: hidden;
      height: 100%;
      display: flex;
      flex-direction: column;
      border: 1px solid rgba(var(--el-color-primary-rgb), 0.05);
      animation:
        pulse 2s infinite,
        fadeInUp 0.5s ease-out;
      animation-delay: calc(0.1s * var(--el-col-span, 0));

      .loading-card-header {
        padding: 18px 20px;
        background: linear-gradient(135deg, var(--el-color-primary-light-8), var(--el-color-primary-light-9));
        border-radius: 16px 16px 0 0;
      }

      .loading-card-content {
        padding: 18px 20px;
        background-color: var(--el-bg-color-overlay);
        flex: 1;
      }

      .loading-card-footer {
        padding: 14px 20px;
        border-top: 1px solid var(--el-border-color-lighter);
        background-color: var(--el-fill-color-light);
        border-radius: 0 0 16px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
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

// 拖拽提示样式
.maintenance-card.drag-over {
  box-shadow:
    0 0 0 2px var(--el-color-primary),
    0 15px 30px rgba(0, 0, 0, 0.15);
  transform: translateY(-5px) scale(1.03);
  animation: glow 1.5s infinite;
}

.el-row {
  margin-bottom: 0 !important;
}

// 动画定义
@keyframes pulse {
  0% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.7;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
    filter: blur(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes glow {
  0% {
    box-shadow: 0 0 8px rgba(var(--el-color-primary-rgb), 0.6);
    filter: brightness(1);
  }
  50% {
    box-shadow: 0 0 25px rgba(var(--el-color-primary-rgb), 0.9);
    filter: brightness(1.25);
  }
  100% {
    box-shadow: 0 0 8px rgba(var(--el-color-primary-rgb), 0.6);
    filter: brightness(1);
  }
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
}

// 响应式设计优化
@media (max-width: 768px) {
  .maintenance-container {
    padding: 12px;

    .maintenance-header {
      flex-direction: column;
      align-items: flex-start;
      margin-bottom: 16px;

      .header-title {
        margin-bottom: 12px;

        .header-icon {
          font-size: 24px;
        }

        span {
          font-size: 20px;
        }
      }

      .header-actions {
        width: 100%;
        margin-top: 12px;
        display: flex;
        justify-content: space-between;

        .el-button {
          flex: 1;
          margin-right: 8px;
          padding: 8px 12px;

          &:last-child {
            margin-right: 0;
          }
        }
      }
    }

    .maintenance-content {
      .maintenance-card {
        .card-header {
          padding: 16px;

          .group-name {
            font-size: 16px;
            max-width: 140px;
          }
        }

        .card-content {
          padding: 16px;
        }

        .card-footer {
          padding: 12px 16px;

          .stats {
            flex-wrap: wrap;

            .stat-item {
              padding: 4px 10px;
              font-size: 13px;
            }
          }

          .card-actions {
            .action-btn {
              width: 28px;
              height: 28px;
            }
          }
        }
      }
    }
  }

  .el-col {
    animation-delay: calc(0.1s * var(--el-loop-index, 0));
  }
}
</style>

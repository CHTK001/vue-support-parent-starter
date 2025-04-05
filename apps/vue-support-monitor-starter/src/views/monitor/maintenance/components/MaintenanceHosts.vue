<template>
  <div class="hosts-container">
    <div class="hosts-header">
      <el-button type="primary" class="action-button" @click="openCreateDialog">
        <IconifyIconOnline icon="ri:add-line" class="mr-1" />
        添加主机
      </el-button>
      <el-input v-model="searchKeyword" placeholder="搜索主机地址/名称" prefix-icon="Search" clearable style="width: 220px" class="search-input" />
    </div>

    <!-- 主机卡片列表 -->
    <div class="hosts-content">
      <el-row :gutter="16">
        <el-col v-for="host in filteredHosts" :key="host.maintenanceHostId" :xs="24" :sm="12" :md="8" :lg="6">
          <div class="host-card" :class="{ disabled: !host.maintenanceHostEnabled }">
            <div class="card-header">
              <div class="host-info">
                <IconifyIconOnline icon="ri:computer-line" class="host-icon" />
                <span class="host-address">{{ host.maintenanceHostAddress }}</span>
              </div>
              <div class="actions">
                <el-dropdown trigger="click" @command="handleCommand($event, host)">
                  <IconifyIconOnline icon="ri:more-2-fill" class="more-icon" />
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="test">
                        <IconifyIconOnline icon="ri:link" />
                        测试连接
                      </el-dropdown-item>
                      <el-dropdown-item command="edit">
                        <IconifyIconOnline icon="ri:edit-line" />
                        编辑
                      </el-dropdown-item>
                      <el-dropdown-item command="status">
                        <IconifyIconOnline :icon="host.maintenanceHostEnabled == true ? 'ri:forbid-line' : 'ri:check-line'" />
                        {{ host.maintenanceHostEnabled == true ? "禁用" : "启用" }}
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
                <el-tag :type="host.maintenanceHostEnabled ? 'success' : 'danger'" size="small" class="status-tag">
                  {{ host.maintenanceHostEnabled ? "启用" : "禁用" }}
                </el-tag>
              </div>
              <div class="info-item">
                <span class="info-label">IP地址：</span>
                <span class="info-value">{{ host.maintenanceHostAddress }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">端口：</span>
                <span class="info-value">{{ host.maintenanceHostPort || 22 }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">用户名：</span>
                <span class="info-value">{{ host.maintenanceHostUsername }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">密码：</span>
                <div class="password-wrapper">
                  <span v-if="!host.showPassword" class="info-value password-hidden">••••••••</span>
                  <span v-else class="info-value">{{ host.maintenanceHostPassword }}</span>
                  <el-button size="small" type="text" @click="togglePasswordVisibility(host)">
                    <IconifyIconOnline :icon="host.showPassword ? 'ri:eye-off-line' : 'ri:eye-line'" />
                  </el-button>
                </div>
              </div>
            </div>
            <div class="card-footer">
              <el-button size="small" type="success" class="test-btn" @click.stop="testConnection(host)">
                <IconifyIconOnline icon="ri:link" class="mr-1" />
                测试连接
              </el-button>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 空状态展示 -->
      <el-empty v-if="filteredHosts.length === 0" description="暂无主机" :image-size="200" class="empty-hosts" />
    </div>

    <!-- 使用主机表单对话框组件 -->
    <host-form-dialog ref="hostFormDialogRef" @submit="handleHostSubmit" />
  </div>
</template>

<script setup>
import { createMaintenanceHost, deleteMaintenanceHost, enableMaintenanceHost, fetchMaintenanceHosts, testHostConnection, updateMaintenanceHost } from "@/api/monitor/maintenance";
import { crypto, message } from "@repo/utils";
import { computed, defineAsyncComponent, onMounted, ref, watch } from "vue";

// 对话框组件
const HostFormDialog = defineAsyncComponent(() => import("./dialogs/HostFormDialog.vue"));

// 定义props
const props = defineProps({
  groupId: {
    type: [Number, String],
    required: true
  }
});

// 主机列表数据
const hostList = ref([]);
const loading = ref(false);
const searchKeyword = ref("");

// 对话框引用
const hostFormDialogRef = ref(null);

// 根据关键字过滤主机列表
const filteredHosts = computed(() => {
  if (!searchKeyword.value) return hostList.value;

  const keyword = searchKeyword.value.toLowerCase();
  return hostList.value.filter(host => host.maintenanceHostAddress.toLowerCase().includes(keyword) || (host.maintenanceHostUsername && host.maintenanceHostUsername.toLowerCase().includes(keyword)));
});

// 获取维护主机列表
const fetchHosts = () => {
  loading.value = true;
  fetchMaintenanceHosts({ maintenanceGroupId: props.groupId })
    .then(res => {
      // 对从后端获取的主机数据进行处理，解密密码
      const hosts = res.data || [];
      hosts.forEach(host => {
        if (host.maintenanceHostPassword) {
          try {
            // 使用AES解密密码
            host.maintenanceHostPassword = crypto.default.AES.decrypt(host.maintenanceHostPassword, "1234567890Oil#@1");
          } catch (error) {
            console.error("密码解密失败:", error);
            // 解密失败时不显示密码
            host.maintenanceHostPassword = "";
          }
        }
        // 添加密码显示控制属性
        host.showPassword = false;
      });
      hostList.value = hosts;
      loading.value = false;
    })
    .catch(error => {
      console.error("获取维护主机列表失败:", error);
      message("获取维护主机列表失败", { type: "error" });
      loading.value = false;
    });
};

// 打开创建对话框
const openCreateDialog = () => {
  hostFormDialogRef.value?.openAdd(props.groupId);
};

// 打开编辑对话框
const openEditDialog = host => {
  hostFormDialogRef.value?.openEdit(host);
};

// 处理主机表单提交
const handleHostSubmit = (formData, isCreate) => {
  if (isCreate) {
    createMaintenanceHost(formData)
      .then(() => {
        message("添加主机成功", { type: "success" });
        fetchHosts();
        hostFormDialogRef.value.close();
        hostFormDialogRef.value.submitting = false;
      })
      .catch(error => {
        console.error("添加主机失败:", error);
        message("添加主机失败", { type: "error" });
        hostFormDialogRef.value.submitting = false;
      });
  } else {
    updateMaintenanceHost(formData)
      .then(() => {
        message("更新主机成功", { type: "success" });
        fetchHosts();
        hostFormDialogRef.value.close();
        hostFormDialogRef.value.submitting = false;
      })
      .catch(error => {
        console.error("更新主机失败:", error);
        message("更新主机失败", { type: "error" });
        hostFormDialogRef.value.submitting = false;
      });
  }
};

// 删除主机
const deleteHost = host => {
  deleteMaintenanceHost(host.maintenanceHostId)
    .then(() => {
      message("删除主机成功", { type: "success" });
      fetchHosts();
    })
    .catch(error => {
      console.error("删除主机失败:", error);
      message("删除主机失败", { type: "error" });
    });
};

// 更新主机状态
const updateHostStatus = host => {
  const newStatus = !host.maintenanceHostEnabled;
  enableMaintenanceHost(host.maintenanceHostId, newStatus)
    .then(() => {
      message(`${newStatus ? "启用" : "禁用"}主机成功`, { type: "success" });
      fetchHosts();
    })
    .catch(error => {
      console.error("更新主机状态失败:", error);
      message("更新主机状态失败", { type: "error" });
    });
};

// 测试主机连接
const testConnection = host => {
  testHostConnection(host.maintenanceHostId)
    .then(res => {
      if (res.data) {
        message("连接测试成功", { type: "success" });
      } else {
        message("连接测试失败", { type: "error" });
      }
    })
    .catch(error => {
      console.error("连接测试失败:", error);
      message("连接测试失败: " + (error.msg || "未知错误"), { type: "error" });
    });
};

// 处理下拉菜单命令
const handleCommand = (command, host) => {
  switch (command) {
    case "test":
      testConnection(host);
      break;
    case "edit":
      openEditDialog(host);
      break;
    case "status":
      updateHostStatus(host);
      break;
    case "delete":
      ElMessageBox.confirm("确定要删除该主机吗？删除后无法恢复。", "删除确认", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          deleteHost(host);
        })
        .catch(() => {});
      break;
  }
};

// 切换密码显示/隐藏
const togglePasswordVisibility = host => {
  host.showPassword = !host.showPassword;
};

// 监听groupId变化
watch(
  () => props.groupId,
  newVal => {
    if (newVal) {
      fetchHosts();
    }
  }
);

// 组件挂载时获取数据
onMounted(() => {
  if (props.groupId) {
    fetchHosts();
  }
});

// 导出公开方法
defineExpose({
  fetchHosts
});
</script>

<style lang="scss" scoped>
.hosts-container {
  height: 100%;
  display: flex;
  flex-direction: column;

  .hosts-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;

    .action-button {
      border-radius: 8px;
      transition: all 0.3s ease;
      font-weight: 500;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
      }
    }

    .search-input {
      :deep(.el-input__wrapper) {
        border-radius: 8px;
        transition: all 0.3s ease;

        &:focus-within {
          box-shadow:
            0 0 0 1px var(--el-color-primary) inset,
            0 4px 10px rgba(var(--el-color-primary-rgb), 0.1);
        }
      }

      :deep(.el-input__prefix-inner) {
        color: var(--el-text-color-secondary);
      }
    }
  }

  .hosts-content {
    flex: 1;
    overflow-y: auto;
    padding-right: 4px;

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

    .empty-hosts {
      margin-top: 60px;

      :deep(.el-empty__image) {
        filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
      }

      :deep(.el-empty__description) {
        color: var(--el-text-color-secondary);
        font-size: 15px;
      }
    }
  }

  .host-card {
    margin-bottom: 18px;
    border-radius: 12px;
    box-shadow:
      0 6px 16px -8px rgba(0, 0, 0, 0.08),
      0 9px 28px 0 rgba(0, 0, 0, 0.05),
      0 12px 48px 16px rgba(0, 0, 0, 0.03);
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    background-color: var(--el-bg-color-overlay);
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
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

      &::before {
        height: 100%;
      }
    }

    &.disabled {
      opacity: 0.7;

      &:hover {
        transform: translateY(-3px);
      }
    }

    .card-header {
      padding: 16px 18px;
      background: linear-gradient(135deg, var(--el-color-success), var(--el-color-success-dark-2));
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

      .host-info {
        display: flex;
        align-items: center;
        z-index: 1;

        .host-icon {
          margin-right: 10px;
          font-size: 20px;
          filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.1));
        }

        .host-address {
          font-weight: 600;
          font-size: 16px;
          letter-spacing: 0.3px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }
      }

      .actions {
        z-index: 1;

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

        .password-wrapper {
          display: flex;
          align-items: center;
          flex: 1;

          .password-hidden {
            letter-spacing: 2px;
            font-weight: bold;
          }
        }

        .status-tag {
          padding: 0 10px;
          border-radius: 12px;
          font-weight: 500;
        }
      }
    }

    .card-footer {
      padding: 14px 18px;
      border-top: 1px solid var(--el-border-color-lighter);
      background-color: var(--el-fill-color-light);
      display: flex;
      justify-content: flex-end;
      position: relative;
      z-index: 1;

      .test-btn {
        border-radius: 20px;
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(var(--el-color-success-rgb), 0.2);
        }
      }
    }
  }
}

.mr-1 {
  margin-right: 4px;
}

.text-danger {
  color: var(--el-color-danger);
}

@media (max-width: 768px) {
  .hosts-container {
    .hosts-header {
      flex-direction: column;
      gap: 12px;

      .search-input {
        width: 100% !important;
      }
    }
  }
}
</style>

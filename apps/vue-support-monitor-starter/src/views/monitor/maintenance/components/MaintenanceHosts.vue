<template>
  <div class="hosts-container">
    <div class="hosts-header">
      <el-button type="primary" @click="openCreateDialog">
        <IconifyIconOnline icon="ri:add-line" class="mr-1" />
        添加主机
      </el-button>
      <el-input v-model="searchKeyword" placeholder="搜索主机地址/名称" prefix-icon="Search" clearable style="width: 220px" />
    </div>

    <!-- 主机卡片列表 -->
    <div class="hosts-content">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="host in filteredHosts" :key="host.maintenanceHostId">
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
                        <IconifyIconOnline :icon="host.maintenanceHostEnabled ? 'ri:forbid-line' : 'ri:check-line'" />
                        {{ host.maintenanceHostEnabled ? "禁用" : "启用" }}
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
                <el-tag :type="host.maintenanceHostEnabled ? 'success' : 'danger'" size="small">
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
            </div>
            <div class="card-footer">
              <el-button size="small" type="success" @click.stop="testConnection(host)">
                <IconifyIconOnline icon="ri:link" class="mr-1" />
                测试连接
              </el-button>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 空状态展示 -->
      <el-empty v-if="filteredHosts.length === 0" description="暂无主机" :image-size="200" />
    </div>

    <!-- 创建/编辑主机对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogType === 'create' ? '添加主机' : '编辑主机'" width="500px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="主机地址" prop="maintenanceHostAddress">
          <el-input v-model="form.maintenanceHostAddress" placeholder="请输入主机IP地址" />
        </el-form-item>
        <el-form-item label="端口" prop="maintenanceHostPort">
          <el-input-number v-model="form.maintenanceHostPort" :min="1" :max="65535" placeholder="请输入端口号" />
        </el-form-item>
        <el-form-item label="用户名" prop="maintenanceHostUsername">
          <el-input v-model="form.maintenanceHostUsername" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="maintenanceHostPassword">
          <el-input v-model="form.maintenanceHostPassword" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="状态" prop="maintenanceHostEnabled">
          <el-switch v-model="form.maintenanceHostEnabled" :active-value="true" :inactive-value="false" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import { message } from "@repo/utils";
import { fetchMaintenanceHosts, createMaintenanceHost, updateMaintenanceHost, deleteMaintenanceHost, enableMaintenanceHost, testHostConnection } from "@/api/monitor/maintenance";

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

// 对话框相关
const dialogVisible = ref(false);
const dialogType = ref("create"); // 'create' 或 'edit'
const formRef = ref(null);
const submitting = ref(false);

// 表单数据
const form = reactive({
  maintenanceHostId: null,
  maintenanceGroupId: null,
  maintenanceHostAddress: "",
  maintenanceHostPort: 22,
  maintenanceHostUsername: "",
  maintenanceHostPassword: "",
  maintenanceHostEnabled: true
});

// 表单验证规则
const rules = {
  maintenanceHostAddress: [{ required: true, message: "请输入主机地址", trigger: "blur" }],
  maintenanceHostPort: [{ required: true, message: "请输入端口号", trigger: "blur" }],
  maintenanceHostUsername: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  maintenanceHostPassword: [{ required: true, message: "请输入密码", trigger: "blur" }]
};

// 根据关键字过滤主机列表
const filteredHosts = computed(() => {
  if (!searchKeyword.value) return hostList.value;

  const keyword = searchKeyword.value.toLowerCase();
  return hostList.value.filter(host => host.maintenanceHostAddress.toLowerCase().includes(keyword) || (host.maintenanceHostUsername && host.maintenanceHostUsername.toLowerCase().includes(keyword)));
});

// 获取维护主机列表
const fetchHosts = async () => {
  loading.value = true;
  try {
    const res = await fetchMaintenanceHosts(props.groupId);
    hostList.value = res.data || [];
  } catch (error) {
    console.error("获取维护主机列表失败:", error);
    message("获取维护主机列表失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

// 打开创建对话框
const openCreateDialog = () => {
  dialogType.value = "create";
  resetForm();
  form.maintenanceGroupId = props.groupId;
  dialogVisible.value = true;
};

// 打开编辑对话框
const openEditDialog = host => {
  dialogType.value = "edit";
  resetForm();
  Object.assign(form, host);
  dialogVisible.value = true;
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  form.maintenanceHostId = null;
  form.maintenanceGroupId = props.groupId;
  form.maintenanceHostAddress = "";
  form.maintenanceHostPort = 22;
  form.maintenanceHostUsername = "";
  form.maintenanceHostPassword = "";
  form.maintenanceHostEnabled = true;
};

// 提交表单
const submitForm = async () => {
  if (formRef.value) {
    await formRef.value.validate(async valid => {
      if (valid) {
        submitting.value = true;
        try {
          if (dialogType.value === "create") {
            await createMaintenanceHost(form);
            message("添加主机成功", { type: "success" });
          } else {
            await updateMaintenanceHost(form);
            message("更新主机成功", { type: "success" });
          }
          dialogVisible.value = false;
          fetchHosts();
        } catch (error) {
          console.error(dialogType.value === "create" ? "添加主机失败:" : "更新主机失败:", error);
          message(dialogType.value === "create" ? "添加主机失败" : "更新主机失败", { type: "error" });
        } finally {
          submitting.value = false;
        }
      }
    });
  }
};

// 删除主机
const deleteHost = async host => {
  try {
    await deleteMaintenanceHost(host.maintenanceHostId);
    message("删除主机成功", { type: "success" });
    fetchHosts();
  } catch (error) {
    console.error("删除主机失败:", error);
    message("删除主机失败", { type: "error" });
  }
};

// 更新主机状态
const updateHostStatus = async host => {
  const newStatus = !host.maintenanceHostEnabled;
  try {
    await enableMaintenanceHost(host.maintenanceHostId, newStatus);
    message(`${newStatus ? "启用" : "禁用"}主机成功`, { type: "success" });
    fetchHosts();
  } catch (error) {
    console.error("更新主机状态失败:", error);
    message("更新主机状态失败", { type: "error" });
  }
};

// 测试主机连接
const testConnection = async host => {
  try {
    const res = await testHostConnection(host.maintenanceHostId);
    if (res.data) {
      message("连接测试成功", { type: "success" });
    } else {
      message("连接测试失败", { type: "error" });
    }
  } catch (error) {
    console.error("连接测试失败:", error);
    message("连接测试失败: " + (error.msg || "未知错误"), { type: "error" });
  }
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
    margin-bottom: 16px;
  }

  .hosts-content {
    flex: 1;
    overflow-y: auto;
  }

  .host-card {
    margin-bottom: 16px;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    overflow: hidden;

    &.disabled {
      opacity: 0.7;
    }

    .card-header {
      padding: 12px 16px;
      background-color: var(--el-color-primary-light-5);
      color: var(--el-color-primary-dark-2);
      display: flex;
      justify-content: space-between;
      align-items: center;

      .host-info {
        display: flex;
        align-items: center;

        .host-icon {
          margin-right: 8px;
          font-size: 18px;
        }

        .host-address {
          font-weight: 500;
          font-size: 14px;
        }
      }

      .actions {
        .more-icon {
          cursor: pointer;
          font-size: 20px;

          &:hover {
            opacity: 0.8;
          }
        }
      }
    }

    .card-content {
      padding: 16px;

      .info-item {
        margin-bottom: 8px;
        display: flex;

        &:last-child {
          margin-bottom: 0;
        }

        .info-label {
          font-weight: 500;
          color: var(--el-text-color-secondary);
          min-width: 60px;
        }

        .info-value {
          flex: 1;
          word-break: break-all;
        }
      }
    }

    .card-footer {
      padding: 12px 16px;
      border-top: 1px solid var(--el-border-color-lighter);
      background-color: var(--el-fill-color-lighter);
      display: flex;
      justify-content: flex-end;
    }
  }
}

.mr-1 {
  margin-right: 4px;
}

.text-danger {
  color: var(--el-color-danger);
}
</style>

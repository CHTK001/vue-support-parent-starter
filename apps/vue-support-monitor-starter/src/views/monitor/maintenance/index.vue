<template>
  <div class="maintenance-container">
    <div class="maintenance-header">
      <div class="header-title">
        <IconifyIconOnline icon="ri:server-line" />
        <span>维护组管理</span>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="openCreateDialog">
          <IconifyIconOnline icon="ri:add-line" class="mr-1" />
          新增维护组
        </el-button>
      </div>
    </div>

    <!-- 维护组卡片列表 -->
    <div class="maintenance-content">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="group in groupList" :key="group.maintenanceGroupId">
          <div class="maintenance-card" @click="openGroupDetail(group)" @dragover.prevent @drop="handleDrop($event, group)">
            <div class="card-header" :class="{ disabled: !group.maintenanceGroupStatus }">
              <span class="group-name">{{ group.maintenanceGroupName }}</span>
              <div class="actions">
                <el-dropdown trigger="click" @command="handleCommand($event, group)" @click.stop>
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
                <el-tag :type="group.maintenanceGroupStatus ? 'success' : 'danger'" size="small">
                  {{ group.maintenanceGroupStatus ? "启用" : "禁用" }}
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

    <!-- 创建/编辑维护组对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogType === 'create' ? '新增维护组' : '编辑维护组'" width="500px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="maintenanceGroupName">
          <el-input v-model="form.maintenanceGroupName" placeholder="请输入维护组名称" />
        </el-form-item>
        <el-form-item label="描述" prop="maintenanceGroupDesc">
          <el-input v-model="form.maintenanceGroupDesc" type="textarea" rows="3" placeholder="请输入维护组描述" />
        </el-form-item>
        <el-form-item label="状态" prop="maintenanceGroupStatus">
          <el-switch v-model="form.maintenanceGroupStatus" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 维护组详情抽屉 -->
    <group-detail-drawer v-if="detailVisible" ref="detailRef" :group-id="currentGroupId" @refresh="fetchGroups" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, defineAsyncComponent } from "vue";
import { message } from "@repo/utils";
import { fetchMaintenanceGroups, createMaintenanceGroup, updateMaintenanceGroup, deleteMaintenanceGroup, enableMaintenanceGroup, uploadFileToGroup } from "@/api/monitor/maintenance";

// 引入维护组详情抽屉组件
const GroupDetailDrawer = defineAsyncComponent(() => import("./components/GroupDetailDrawer.vue"));

// 维护组列表数据
const groupList = ref([]);
const loading = ref(false);

// 对话框相关
const dialogVisible = ref(false);
const dialogType = ref("create"); // 'create' 或 'edit'
const formRef = ref(null);
const submitting = ref(false);

// 表单数据
const form = reactive({
  maintenanceGroupId: null,
  maintenanceGroupName: "",
  maintenanceGroupDesc: "",
  maintenanceGroupStatus: 1
});

// 表单验证规则
const rules = {
  maintenanceGroupName: [
    { required: true, message: "请输入维护组名称", trigger: "blur" },
    { min: 2, max: 50, message: "长度在 2 到 50 个字符", trigger: "blur" }
  ]
};

// 详情抽屉相关
const detailVisible = ref(false);
const detailRef = ref(null);
const currentGroupId = ref(null);

// 获取维护组列表
const fetchGroups = async () => {
  loading.value = true;
  try {
    const res = await fetchMaintenanceGroups();
    groupList.value = res.data || [];
  } catch (error) {
    console.error("获取维护组列表失败:", error);
    message("获取维护组列表失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

// 打开创建对话框
const openCreateDialog = () => {
  dialogType.value = "create";
  resetForm();
  dialogVisible.value = true;
};

// 打开编辑对话框
const openEditDialog = group => {
  dialogType.value = "edit";
  resetForm();
  Object.assign(form, group);
  dialogVisible.value = true;
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  form.maintenanceGroupId = null;
  form.maintenanceGroupName = "";
  form.maintenanceGroupDesc = "";
  form.maintenanceGroupStatus = 1;
};

// 提交表单
const submitForm = async () => {
  if (formRef.value) {
    await formRef.value.validate(async valid => {
      if (valid) {
        submitting.value = true;
        try {
          if (dialogType.value === "create") {
            await createMaintenanceGroup(form);
            message("创建维护组成功", { type: "success" });
          } else {
            await updateMaintenanceGroup(form);
            message("更新维护组成功", { type: "success" });
          }
          dialogVisible.value = false;
          fetchGroups();
        } catch (error) {
          console.error(dialogType.value === "create" ? "创建维护组失败:" : "更新维护组失败:", error);
          message(dialogType.value === "create" ? "创建维护组失败" : "更新维护组失败", { type: "error" });
        } finally {
          submitting.value = false;
        }
      }
    });
  }
};

// 删除维护组
const deleteGroup = async group => {
  try {
    await deleteMaintenanceGroup(group.maintenanceGroupId);
    message("删除维护组成功", { type: "success" });
    fetchGroups();
  } catch (error) {
    console.error("删除维护组失败:", error);
    message("删除维护组失败", { type: "error" });
  }
};

// 更新维护组状态
const updateGroupStatus = async group => {
  const newStatus = group.maintenanceGroupStatus === 1 ? 0 : 1;
  try {
    await enableMaintenanceGroup(group.maintenanceGroupId, newStatus);
    message(`${newStatus === 1 ? "启用" : "禁用"}维护组成功`, { type: "success" });
    fetchGroups();
  } catch (error) {
    console.error("更新维护组状态失败:", error);
    message("更新维护组状态失败", { type: "error" });
  }
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
  currentGroupId.value = group.maintenanceGroupId;
  detailVisible.value = true;
  setTimeout(() => {
    detailRef.value?.open(group);
  }, 0);
};

// 处理文件拖拽上传
const handleDrop = async (event, group) => {
  event.preventDefault();
  const files = event.dataTransfer.files;
  if (files.length === 0) return;

  // 创建确认对话框
  ElMessageBox.confirm(`确定要将${files.length}个文件上传到维护组 ${group.maintenanceGroupName} 吗？`, "上传确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "info"
  })
    .then(async () => {
      const formData = new FormData();
      formData.append("maintenanceGroupId", group.maintenanceGroupId);
      formData.append("isOverride", 1); // 默认覆盖

      // 添加所有文件到表单
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      try {
        await uploadFileToGroup(formData);
        message("文件上传成功", { type: "success" });
      } catch (error) {
        console.error("文件上传失败:", error);
        message("文件上传失败", { type: "error" });
      }
    })
    .catch(() => {});
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
  padding: 16px;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);

  .maintenance-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .header-title {
      display: flex;
      align-items: center;
      font-size: 18px;
      font-weight: 500;

      .iconify {
        margin-right: 8px;
        font-size: 24px;
      }
    }
  }

  .maintenance-content {
    flex: 1;
    overflow-y: auto;
  }

  .maintenance-card {
    margin-bottom: 16px;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    transition: all 0.3s;
    cursor: pointer;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
    }

    .card-header {
      padding: 14px 16px;
      background-color: var(--el-color-primary);
      color: white;
      border-radius: 8px 8px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;

      &.disabled {
        background-color: var(--el-color-info);
      }

      .group-name {
        font-weight: 500;
        font-size: 16px;
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
      background-color: var(--el-bg-color-overlay);

      .info-item {
        margin-bottom: 8px;
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
        }
      }
    }

    .card-footer {
      padding: 12px 16px;
      border-top: 1px solid var(--el-border-color-lighter);
      background-color: var(--el-fill-color-lighter);
      border-radius: 0 0 8px 8px;

      .stats {
        display: flex;
        justify-content: space-around;

        .stat-item {
          display: flex;
          align-items: center;

          .iconify {
            margin-right: 4px;
            color: var(--el-color-primary);
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
</style>

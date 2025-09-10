<script setup lang="ts">
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { ElMessage, ElMessageBox } from "element-plus";
import { onMounted, reactive, ref } from "vue";
import { fetchDeleteForGroup, fetchListForGroup, fetchSaveOrUpdateForGroup, type SysSettingGroup } from "../api/group";

// 响应式数据
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const groupList = ref<SysSettingGroup[]>([]);

// 表单数据
const formData = reactive<SysSettingGroup>({
  sysSettingGroupName: "",
  sysSettingGroupCode: "",
  sysSettingGroupIcon: "",
  sysSettingGroupEnable: true,
  sysSettingGroupRemark: "",
});

// 表单验证规则
const formRules = {
  sysSettingGroupName: [{ required: true, message: "请输入组名称", trigger: "blur" }],
  sysSettingGroupCode: [{ required: true, message: "请输入组编码", trigger: "blur" }],
};

const formRef = ref();

/**
 * 获取组列表
 */
const getGroupList = async () => {
  try {
    loading.value = true;
    const { data } = await fetchListForGroup({});
    groupList.value = data || [];
  } catch (error) {
    console.error("获取组列表失败:", error);
    ElMessage.error("获取组列表失败");
  } finally {
    loading.value = false;
  }
};

/**
 * 打开新增对话框
 */
const handleAdd = () => {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
};

/**
 * 打开编辑对话框
 */
const handleEdit = (row: SysSettingGroup) => {
  isEdit.value = true;
  Object.assign(formData, row);
  dialogVisible.value = true;
};

/**
 * 删除组
 */
const handleDelete = async (row: SysSettingGroup) => {
  try {
    await ElMessageBox.confirm(`确定要删除组 "${row.sysSettingGroupName}" 吗？`, "确认删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    const { data } = await fetchDeleteForGroup({
      sysSettingGroupId: row.sysSettingGroupId!,
    });

    if (data) {
      ElMessage.success("删除成功");
      await getGroupList();
    } else {
      ElMessage.error(data?.msg || "删除失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除失败:", error);
      ElMessage.error("删除失败");
    }
  }
};

/**
 * 保存组
 */
const handleSave = async () => {
  try {
    await formRef.value?.validate();

    const { data } = await fetchSaveOrUpdateForGroup(formData);

    if (data && data.success) {
      ElMessage.success(isEdit.value ? "更新成功" : "创建成功");
      dialogVisible.value = false;
      await getGroupList();
    } else {
      ElMessage.error(data?.message || "保存失败");
    }
  } catch (error) {
    console.error("保存失败:", error);
    ElMessage.error("保存失败");
  }
};

/**
 * 重置表单
 */
const resetForm = () => {
  Object.assign(formData, {
    sysSettingGroupId: undefined,
    sysSettingGroupName: "",
    sysSettingGroupCode: "",
    sysSettingGroupIcon: "",
    sysSettingGroupEnable: true,
    sysSettingGroupRemark: "",
  });
  formRef.value?.clearValidate();
};

/**
 * 关闭对话框
 */
const handleClose = () => {
  dialogVisible.value = false;
  resetForm();
};

// 组件挂载时获取数据
onMounted(() => {
  getGroupList();
});
</script>

<template>
  <div class="group-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>配置组管理</h2>
      <p>管理系统配置分组，用于组织和分类各种系统设置</p>
    </div>

    <!-- 操作栏 -->
    <div class="toolbar">
      <el-button type="primary" :icon="useRenderIcon('ri:add-line')" @click="handleAdd"> 新增配置组 </el-button>
      <el-button :icon="useRenderIcon('ri:refresh-line')" @click="getGroupList"> 刷新 </el-button>
    </div>

    <!-- 数据表格 -->
    <el-table v-loading="loading" :data="groupList" stripe border class="group-table">
      <el-table-column prop="sysSettingGroupName" label="组名称" min-width="120" />
      <el-table-column prop="sysSettingGroupCode" label="组编码" min-width="20" />
      <el-table-column label="图标" width="80" align="center">
        <template #default="{ row }">
          <el-icon v-if="row.sysSettingGroupIcon" size="20">
            <component :is="useRenderIcon(row.sysSettingGroupIcon)" />
          </el-icon>
          <span v-else class="text-gray-400">-</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-switch v-model="row.sysSettingGroupEnable" active-text="启用" inactive-text="禁用" />
        </template>
      </el-table-column>
      <el-table-column prop="sysSettingGroupRemark" label="描述" min-width="150" show-overflow-tooltip />
      <el-table-column label="操作" width="150" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" :icon="useRenderIcon('ri:edit-line')" @click="handleEdit(row)"> 编辑 </el-button>
          <el-button type="danger" link size="small" :icon="useRenderIcon('ri:delete-bin-line')" @click="handleDelete(row)"> 删除 </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑配置组' : '新增配置组'" width="500px" @close="handleClose">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="组名称" prop="sysSettingGroupName">
          <el-input v-model="formData.sysSettingGroupName" placeholder="请输入组名称" clearable />
        </el-form-item>
        <el-form-item label="组编码" prop="sysSettingGroupCode">
          <el-input v-model="formData.sysSettingGroupCode" placeholder="请输入组编码（唯一标识）" clearable />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="formData.sysSettingGroupIcon" placeholder="请输入图标名称，如：ri:settings-line" clearable>
            <template #append>
              <el-icon v-if="formData.sysSettingGroupIcon">
                <component :is="useRenderIcon(formData.sysSettingGroupIcon)" />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="formData.sysSettingGroupEnable" active-text="启用" inactive-text="禁用" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.sysSettingGroupRemark" type="textarea" :rows="3" placeholder="请输入组描述" clearable />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" @click="handleSave">
            {{ isEdit ? "更新" : "创建" }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.group-management {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.page-header p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.toolbar {
  margin-bottom: 20px;
  padding: 16px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 12px;
}

.group-table {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-table) {
  border-radius: 8px;
}

:deep(.el-table__header) {
  background-color: #f8f9fa;
}

:deep(.el-table th) {
  background-color: #f8f9fa !important;
  color: #303133;
  font-weight: 600;
}

:deep(.el-table td) {
  padding: 12px 0;
}

:deep(.el-switch) {
  --el-switch-on-color: #67c23a;
  --el-switch-off-color: #dcdfe6;
}

:deep(.el-button--small) {
  padding: 4px 8px;
}
</style>

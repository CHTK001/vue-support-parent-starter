<script setup lang="ts">
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { ElMessage, ElMessageBox } from "element-plus";
import draggable from "vuedraggable";
import { nextTick, onMounted, reactive, ref } from "vue";
import { fetchBatchUpdateForGroup, fetchDeleteForGroup, fetchListForGroup, fetchSaveOrUpdateForGroup, type SysSettingGroup } from "../api/group";

// 响应式数据
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const groupList = ref<SysSettingGroup[]>([]);
const cardContainer = ref();

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
    // 数据加载完成后自动触发排序更新
    await nextTick();
  } catch (error) {
    console.error("获取组列表失败:", error);
    ElMessage.error("获取组列表失败");
  } finally {
    loading.value = false;
  }
};

/**
 * 拖拽结束处理
 */
const handleDragEnd = async () => {
  try {
    // 更新排序字段
    const updatedList = groupList.value.map((item, index) => ({
      ...item,
      sysSettingGroupSort: index + 1,
    }));

    // 批量更新到服务器
    await handleBatchUpdate(updatedList);
  } catch (error) {
    console.error("拖拽排序失败:", error);
    ElMessage.error("拖拽排序失败");
    // 重新获取数据恢复原状态
    await getGroupList();
  }
};

/**
 * 批量更新排序
 */
const handleBatchUpdate = async (updatedList: SysSettingGroup[]) => {
  try {
    await fetchBatchUpdateForGroup(updatedList);
    ElMessage.success("排序更新成功");
  } catch (error) {
    console.error("批量更新失败:", error);
    ElMessage.error("排序更新失败");
    // 重新获取数据恢复原状态
    await getGroupList();
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

    if (data) {
      ElMessage.success(isEdit.value ? "更新成功" : "创建成功");
      dialogVisible.value = false;
      await getGroupList();
    } else {
      ElMessage.error(data?.msg || "保存失败");
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
onMounted(async () => {
  await getGroupList();
});
</script>

<script lang="ts">
import { defineComponent } from "vue";
import draggable from "vuedraggable";

export default defineComponent({
  components: {
    draggable
  }
});
</script>

<template>
  <div class="group-management">
    <!-- 操作栏 -->
    <div class="toolbar">
      <el-button type="primary" :icon="useRenderIcon('ri:add-line')" @click="handleAdd"> 新增配置组 </el-button>
      <el-button :icon="useRenderIcon('ri:refresh-line')" @click="getGroupList"> 刷新 </el-button>
    </div>

    <!-- 卡片容器 -->
    <div v-loading="loading" class="card-container">
      <draggable 
        v-model="groupList" 
        item-key="sysSettingGroupId" 
        handle=".drag-handle" 
        animation="150" 
        ghost-class="sortable-ghost" 
        chosen-class="sortable-chosen" 
        drag-class="sortable-drag" 
        @end="handleDragEnd"
        class="draggable-container"
      >
        <template #item="{ element: item, index }">
          <div class="group-card">
        <div class="card-header">
          <div class="card-title">
            <el-icon v-if="item.sysSettingGroupIcon" class="card-icon">
              <component :is="useRenderIcon(item.sysSettingGroupIcon)" />
            </el-icon>
            <span class="group-name">{{ item.sysSettingGroupName }}</span>
            <el-tag size="small" class="group-code">{{ item.sysSettingGroupCode }}</el-tag>
          </div>
          <div class="card-actions">
            <el-switch v-model="item.sysSettingGroupEnable" active-text="启用" inactive-text="禁用" size="small" />
          </div>
        </div>

        <div class="card-content">
          <p class="group-description">{{ item.sysSettingGroupRemark || "暂无描述" }}</p>
        </div>

        <div class="card-footer">
          <div class="drag-handle">
            <el-icon><component :is="useRenderIcon('ri:drag-move-line')" /></el-icon>
            <span class="sort-text">拖拽排序</span>
          </div>
          <div class="action-buttons">
            <el-button type="primary" link size="small" :icon="useRenderIcon('ri:edit-line')" @click="handleEdit(item)"> 编辑 </el-button>
            <el-button type="danger" link size="small" :icon="useRenderIcon('ri:delete-bin-line')" @click="handleDelete(item)"> 删除 </el-button>
          </div>
        </div>
          </div>
        </template>
      </draggable>

      <!-- 空状态 -->
      <div v-if="!loading && groupList.length === 0" class="empty-state">
        <el-empty description="暂无配置组数据">
          <el-button type="primary" @click="handleAdd">创建第一个配置组</el-button>
        </el-empty>
      </div>
    </div>

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

.card-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  min-height: 200px;
}

.group-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;
  cursor: move;
  overflow: hidden;
}

.group-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.card-icon {
  font-size: 20px;
  color: #409eff;
}

.group-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.group-code {
  background: #f0f9ff;
  color: #0369a1;
  border: 1px solid #bae6fd;
}

.card-actions {
  display: flex;
  align-items: center;
}

.card-content {
  padding: 16px 20px;
}

.group-description {
  margin: 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  min-height: 21px;
}

.card-footer {
  padding: 12px 20px;
  background: #fafafa;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.drag-handle {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #909399;
  font-size: 12px;
  cursor: move;
}

.drag-handle:hover {
  color: #409eff;
}

.sort-text {
  user-select: none;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 拖拽排序样式 */
.draggable-container {
  display: contents;
}

.sortable-ghost {
  opacity: 0.5;
  background: #f0f9ff;
  border: 2px dashed #409eff;
}

.sortable-chosen {
  transform: rotate(5deg);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.sortable-drag {
  transform: rotate(5deg);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

:deep(.el-switch) {
  --el-switch-on-color: #67c23a;
  --el-switch-off-color: #dcdfe6;
}

:deep(.el-button--small) {
  padding: 4px 8px;
}

:deep(.el-loading-mask) {
  border-radius: 8px;
}
</style>

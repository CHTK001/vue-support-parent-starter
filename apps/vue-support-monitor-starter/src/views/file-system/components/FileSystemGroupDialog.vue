<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑分组' : '新建分组'"
    width="600px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    class="group-dialog"
    append-to-body
  >
    <div class="dialog-content">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
        label-position="left"
        class="group-form"
      >
        <el-form-item label="分组名称" prop="fileSystemGroupName">
          <el-input
            v-model="formData.fileSystemGroupName"
            placeholder="请输入分组名�?
            clearable
            maxlength="100"
            show-word-limit
          >
            <template #prefix>
              <IconifyIconOnline icon="ri:folder-line" />
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="分组路径" prop="fileSystemGroupPath">
          <el-input
            v-model="formData.fileSystemGroupPath"
            placeholder="请输入分组路径（英文，用于存储目录）"
            clearable
            maxlength="100"
            show-word-limit
          >
            <template #prefix>
              <IconifyIconOnline icon="ri:folder-open-line" />
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="父级分组" prop="fileSystemGroupParentId">
          <el-tree-select
            v-model="formData.fileSystemGroupParentId"
            :data="parentGroupOptions"
            :props="treeSelectProps"
            placeholder="请选择父级分组（可选）"
            clearable
            check-strictly
            :render-after-expand="false"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="分组描述" prop="fileSystemGroupDescription">
          <el-input
            v-model="formData.fileSystemGroupDescription"
            type="textarea"
            :rows="3"
            placeholder="请输入分组描述（可选）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="分组图标" prop="fileSystemGroupIcon">
          <div class="icon-selector">
            <el-input
              v-model="formData.fileSystemGroupIcon"
              placeholder="请输入图标名�?
              clearable
            >
              <template #prefix>
                <IconifyIconOnline
                  :icon="formData.fileSystemGroupIcon || 'ri:folder-line'"
                  :style="{ color: formData.fileSystemGroupColor || '#409EFF' }"
                />
              </template>
            </el-input>
            <div class="icon-presets">
              <el-button
                v-for="icon in iconPresets"
                :key="icon"
                size="small"
                text
                @click="formData.fileSystemGroupIcon = icon"
                :class="{ 'is-active': formData.fileSystemGroupIcon === icon }"
              >
                <IconifyIconOnline :icon="icon" />
              </el-button>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="分组颜色" prop="fileSystemGroupColor">
          <el-color-picker
            v-model="formData.fileSystemGroupColor"
            :predefine="colorPresets"
            show-alpha
          />
        </el-form-item>

        <el-form-item label="排序" prop="fileSystemGroupSort">
          <el-input-number
            v-model="formData.fileSystemGroupSort"
            :min="0"
            :max="999"
            placeholder="排序�?
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="状�? prop="fileSystemGroupStatus">
          <el-switch
            v-model="formData.fileSystemGroupStatus"
            :active-value="1"
            :inactive-value="0"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import {
  createGroup,
  updateGroup,
  getGroupTree,
  type FileSystemGroup,
} from "@/api/monitor/filesystem-group";

// Props & Emits
const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  success: [];
}>();

// 响应式数�?
const visible = ref(false);
const isEdit = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();
const parentGroupOptions = ref<FileSystemGroup[]>([]);

// 表单数据
const formData = reactive<FileSystemGroup>({
  fileSystemGroupName: "",
  fileSystemGroupPath: "",
  fileSystemGroupParentId: undefined,
  fileSystemGroupDescription: "",
  fileSystemGroupIcon: "ri:folder-line",
  fileSystemGroupColor: "#409EFF",
  fileSystemGroupSort: 0,
  fileSystemGroupStatus: 1,
});

// 图标预设
const iconPresets = [
  "ri:folder-line",
  "ri:folder-2-line",
  "ri:folder-3-line",
  "ri:image-line",
  "ri:video-line",
  "ri:file-text-line",
  "ri:file-music-line",
  "ri:archive-line",
  "ri:code-line",
  "ri:database-line",
];

// 颜色预设
const colorPresets = [
  "#409EFF",
  "#67C23A",
  "#E6A23C",
  "#F56C6C",
  "#909399",
  "#36CFC9",
  "#722ED1",
  "#EB2F96",
  "#FA8C16",
  "#52C41A",
];

// 树选择器配�?
const treeSelectProps = {
  value: "fileSystemGroupId",
  label: "fileSystemGroupName",
  children: "children",
};

// 表单验证规则
const rules: FormRules = {
  fileSystemGroupName: [
    { required: true, message: "请输入分组名�?, trigger: "blur" },
    { min: 1, max: 100, message: "分组名称长度�?-100个字�?, trigger: "blur" },
  ],
  fileSystemGroupPath: [
    { required: true, message: "请输入分组路�?, trigger: "blur" },
    { min: 1, max: 100, message: "分组路径长度�?-100个字�?, trigger: "blur" },
    {
      pattern: /^[a-zA-Z0-9_-]+$/,
      message: "分组路径只能包含字母、数字、下划线和横�?,
      trigger: "blur",
    },
  ],
  fileSystemGroupSort: [
    { type: "number", min: 0, max: 999, message: "排序值范围为0-999", trigger: "blur" },
  ],
};

// 计算属�?
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

// 监听对话框显示状�?
watch(
  () => props.modelValue,
  (newVal) => {
    visible.value = newVal;
    if (newVal) {
      loadParentGroups();
    }
  },
  { immediate: true }
);

watch(visible, (newVal) => {
  if (!newVal) {
    emit("update:modelValue", false);
  }
});

// 加载父级分组选项
const loadParentGroups = async () => {
  try {
    const res = await getGroupTree();
    if (res.code === "00000" || res.code === 0) {
      parentGroupOptions.value = res.data || [];
    }
  } catch (error) {
    console.error("加载父级分组失败:", error);
  }
};

// 打开新建对话�?
const openCreate = () => {
  isEdit.value = false;
  resetForm();
  visible.value = true;
};

// 打开编辑对话�?
const openEdit = (group: FileSystemGroup) => {
  isEdit.value = true;
  resetForm();
  Object.assign(formData, group);
  visible.value = true;
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  Object.assign(formData, {
    fileSystemGroupId: undefined,
    fileSystemGroupName: "",
    fileSystemGroupPath: "",
    fileSystemGroupParentId: undefined,
    fileSystemGroupDescription: "",
    fileSystemGroupIcon: "ri:folder-line",
    fileSystemGroupColor: "#409EFF",
    fileSystemGroupSort: 0,
    fileSystemGroupStatus: 1,
  });
};

// 处理提交
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    const valid = await formRef.value.validate();
    if (!valid) return;

    submitting.value = true;

    const apiCall = isEdit.value ? updateGroup : createGroup;
    const res = await apiCall(formData);

    if (res.code === "00000" || res.code === 0) {
      ElMessage.success(isEdit.value ? "更新分组成功" : "创建分组成功");
      handleClose();
      emit("success");
    } else {
      ElMessage.error(res.msg || "操作失败");
    }
  } catch (error) {
    console.error("提交失败:", error);
    ElMessage.error("操作失败");
  } finally {
    submitting.value = false;
  }
};

// 处理关闭
const handleClose = () => {
  visible.value = false;
  resetForm();
};

// 暴露方法
defineExpose({
  openCreate,
  openEdit,
});
</script>

<style scoped>
.group-dialog :deep(.el-dialog__body) {
  padding: 20px;
}

.dialog-content {
  max-height: 60vh;
  overflow-y: auto;
}

.group-form {
  padding-right: 20px;
}

.icon-selector {
  width: 100%;
}

.icon-presets {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.icon-presets .el-button {
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 4px;
}

.icon-presets .el-button.is-active {
  background-color: var(--el-color-primary);
  color: var(--el-text-color-primary);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>

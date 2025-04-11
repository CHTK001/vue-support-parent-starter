<template>
  <el-dialog draggable v-model="visible" :title="type === 'add' ? '新增配置' : '编辑配置'" width="650px" @close="handleClose" destroy-on-close class="sync-config-dialog">
    <div class="dialog-content">
      <div class="dialog-header">
        <div class="dialog-icon">
          <IconifyIconOnline icon="ri:database-2-line" />
        </div>
        <div class="dialog-title-info">
          <h3>{{ type === "add" ? "创建新的数据同步配置" : "编辑数据同步配置" }}</h3>
          <p>配置数据同步任务的详细信息</p>
        </div>
      </div>

      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" class="config-form">
        <el-form-item label="配置名称" prop="schoolSyncConfigName">
          <el-input v-model="formData.schoolSyncConfigName" placeholder="请输入配置名称" :prefix-icon="useRenderIcon(' ri:file-list-line')" />
        </el-form-item>

        <el-form-item label="实现方式" prop="schoolSyncConfigType">
          <el-select v-model="formData.schoolSyncConfigType" placeholder="请选择同步类型" class="full-width">
            <el-option label="高考数据" value="GAOKAO">
              <div class="select-option">
                <IconifyIconOnline icon="ri:graduation-cap-line" class="option-icon" />
                <span>高考数据</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="同步类型" prop="schoolSyncConfigSyncType">
          <el-select v-model="formData.schoolSyncConfigSyncType" placeholder="请选择同步类型" class="full-width">
            <el-option label="全量数据" value="ALL"> </el-option>
            <el-option label="增量数据" value="NEW"> </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="同步地址" prop="schoolSyncConfigUrl">
          <el-input v-model="formData.schoolSyncConfigUrl" placeholder="请输入同步地址" prefix-icon="ri:link" />
        </el-form-item>

        <el-form-item label="同步Cookie" prop="schoolSyncConfigCookie">
          <el-input v-model="formData.schoolSyncConfigCookie" type="textarea" placeholder="请输入同步Cookie" :rows="4" class="params-textarea" />
        </el-form-item>

        <el-form-item label="状态" prop="schoolSyncConfigEnabled">
          <div class="status-switch">
            <el-switch v-model="formData.schoolSyncConfigEnabled" :active-value="true" :inactive-value="false" active-text="启用" inactive-text="停用" inline-prompt />
            <span class="status-text">{{ formData.schoolSyncConfigEnabled ? "配置将被启用" : "配置将被停用" }}</span>
          </div>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel" plain>取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ type === "add" ? "创建配置" : "保存修改" }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { ref, watch } from "vue";
import type { FormInstance } from "element-plus";
import type { SchoolSyncConfig } from "@/api/school-sync";
import { IconifyIconOnline } from "@repo/components/ReIcon";

const props = defineProps<{
  modelValue: boolean;
  type: "add" | "edit";
  data?: SchoolSyncConfig;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "submit", data: SchoolSyncConfig): void;
}>();

const visible = ref(props.modelValue);
const formRef = ref<FormInstance>();
const submitting = ref(false);
const formData = ref<SchoolSyncConfig>({
  schoolSyncConfigName: "",
  schoolSyncConfigUrl: "",
  schoolSyncConfigParams: "",
  schoolSyncConfigSchedule: "",
  schoolSyncConfigStatus: 1,
  schoolSyncConfigCookie: "",
  schoolSyncConfigEnabled: true,
  schoolSyncConfigType: "",
});

// 表单校验规则
const formRules = {
  schoolSyncConfigName: [{ required: true, message: "请输入配置名称", trigger: "blur" }],
  schoolSyncConfigType: [{ required: true, message: "请选择实现方式", trigger: "change" }],
  schoolSyncConfigSyncType: [{ required: true, message: "请选择同步类型", trigger: "change" }],
};

// 监听弹框显示状态
watch(
  () => props.modelValue,
  (val) => {
    visible.value = val;
  }
);

watch(
  () => visible.value,
  (val) => {
    emit("update:modelValue", val);
  }
);

// 监听数据变化
watch(
  () => props.data,
  (val) => {
    if (val) {
      // 将后端数据转换为表单数据格式
      formData.value = {
        ...val,
      };
    } else {
      // 重置表单数据
      formData.value = {
        schoolSyncConfigName: "",
        schoolSyncConfigType: "",
        schoolSyncConfigUrl: "",
        schoolSyncConfigParams: "",
        schoolSyncConfigSchedule: "",
        schoolSyncConfigStatus: 1,
        schoolSyncConfigCookie: "",
        schoolSyncConfigEnabled: true,
        schoolSyncConfigSyncType: "",
      };
    }
  },
  { immediate: true }
);

// 处理取消
const handleCancel = () => {
  visible.value = false;
};

// 处理关闭
const handleClose = () => {
  formRef.value?.resetFields();
};

// 处理提交
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    submitting.value = true;
    const valid = await formRef.value.validate();

    if (valid) {
      // 将表单数据转换为API需要的格式
      const submitData = {
        ...formData.value,
      };

      emit("submit", submitData);
    }
  } catch (error) {
    console.error("表单验证失败:", error);
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.sync-config-dialog :deep(.el-dialog__header) {
  margin-right: 0;
  padding: 0;
}

.sync-config-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.dialog-content {
  padding: 0 0 20px 0;
}

.dialog-header {
  display: flex;
  align-items: center;
  padding: 20px 20px 30px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 20px;
}

.dialog-icon {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f7ff;
  border-radius: 8px;
  margin-right: 15px;
  color: #409eff;
  font-size: 24px;
}

.dialog-title-info h3 {
  margin: 0 0 8px;
  font-size: 18px;
  color: #333;
}

.dialog-title-info p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.config-form {
  padding: 0 20px;
}

.full-width {
  width: 100%;
}

.params-textarea {
  font-family: monospace;
}

.status-switch {
  display: flex;
  align-items: center;
}

.status-text {
  margin-left: 10px;
  font-size: 13px;
  color: #666;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.select-option {
  display: flex;
  align-items: center;
}

.option-icon {
  margin-right: 8px;
  font-size: 16px;
}
</style>

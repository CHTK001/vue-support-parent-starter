<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑 Pipeline' : '创建 Pipeline'"
    width="520px"
    destroy-on-close
    teleported="false"
    class="dl-dialog"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="dl-form">
      <el-form-item label="Pipeline ID" prop="id">
        <el-input v-model="form.id" :disabled="isEdit" placeholder="留空自动生成，不支持中文" class="dl-input" />
      </el-form-item>
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name" placeholder="Pipeline 名称" class="dl-input" />
      </el-form-item>
      <el-form-item label="版本">
        <el-input v-model="form.version" placeholder="1.0.0" class="dl-input" />
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.description" type="textarea" :rows="3" placeholder="可选描述" class="dl-input" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <button class="btn-ghost" @click="visible = false">取消</button>
        <button class="btn-primary" :class="{ loading }" :disabled="loading" @click="handleSubmit">{{ loading ? '提交中...' : '确定' }}</button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { ElMessage } from "element-plus";
import { fetchCreatePipeline, fetchUpdatePipeline } from "../../api/pipeline";
import type { ScGraph } from "../../types";

defineOptions({ name: "PipelineSaveDialog" });

const visible = ref(false);
const loading = ref(false);
const isEdit = ref(false);
const formRef = ref();

const form = reactive<Partial<ScGraph>>({
  id: "",
  name: "",
  version: "1.0.0",
  description: "",
});

const rules = {
  id: [
    {
      pattern: /^[a-zA-Z0-9_-]*$/,
      message: "ID 不支持中文及特殊字符",
      trigger: "blur",
    },
  ],
  name: [{ required: true, message: "请输入名称", trigger: "blur" }],
};

const open = (row?: ScGraph) => {
  visible.value = true;
  isEdit.value = !!row;
  if (row) {
    Object.assign(form, {
      id: row.id,
      name: row.name,
      version: row.version,
      description: row.description,
    });
  } else {
    Object.assign(form, {
      id: "",
      name: "",
      version: "1.0.0",
      description: "",
    });
  }
};

const handleSubmit = async () => {
  await formRef.value?.validate();
  loading.value = true;
  try {
    const data = { ...form, nodes: [] };
    if (isEdit.value) {
      await fetchUpdatePipeline(data);
      ElMessage.success("更新成功");
    } else {
      await fetchCreatePipeline(data);
      ElMessage.success("创建成功");
    }
    visible.value = false;
    emit("success");
  } catch (e: any) {
    ElMessage.error(e?.msg || "操作失败");
  } finally {
    loading.value = false;
  }
};

const emit = defineEmits<{ success: [] }>();
defineExpose({ open });
</script>

<style scoped>
.dl-dialog {
  font-family: "Space Mono", "Courier New", monospace;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* ===== 按钮 ===== */
.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: transparent;
  border: 1px solid rgba(0, 180, 255, 0.1);
  border-radius: 6px;
  padding: 7px 16px;
  font-size: 12px;
  color: #94a3b8;
  cursor: pointer;
  font-family: "Space Mono", monospace;
  transition: all 0.2s;
}
.btn-ghost:hover {
  border-color: rgba(0, 180, 255, 0.25);
  color: #38bdf8;
}
.btn-ghost:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 6px;
  padding: 7px 16px;
  font-size: 12px;
  color: #38bdf8;
  cursor: pointer;
  font-family: "Space Mono", monospace;
  transition: all 0.2s;
}
.btn-primary:hover {
  background: rgba(56, 189, 248, 0.18);
  border-color: rgba(56, 189, 248, 0.35);
}
.btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-primary.loading svg {
  animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ===== :deep() 覆盖 ElPlus 组件 ===== */
:deep(.el-dialog) {
  --el-dialog-bg-color: #0b1020;
  --el-dialog-border-radius: 8px;
  border: 1px solid rgba(0, 180, 255, 0.2);
  box-shadow: 0 0 40px rgba(0, 180, 255, 0.08);
}
:deep(.el-dialog__header) {
  border-bottom: 1px solid rgba(0, 180, 255, 0.06);
  padding: 14px 18px;
  margin: 0;
}
:deep(.el-dialog__title) {
  color: #e2e8f0;
  font-size: 14px;
  font-weight: 600;
  font-family: "Space Mono", monospace;
}
:deep(.el-dialog__headerbtn) {
  top: 14px;
  right: 14px;
}
:deep(.el-dialog__headerbtn .el-dialog__close) {
  color: #5a6478;
}
:deep(.el-dialog__headerbtn:hover .el-dialog__close) {
  color: #ef4444;
}
:deep(.el-dialog__body) {
  padding: 20px 18px;
}
:deep(.el-dialog__footer) {
  border-top: 1px solid rgba(0, 180, 255, 0.06);
  padding: 12px 18px;
}

:deep(.el-form-item__label) {
  color: #5a6478 !important;
  font-size: 11px;
  font-family: "Space Mono", monospace;
}

:deep(.el-input__wrapper) {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 180, 255, 0.1);
  border-radius: 6px;
  box-shadow: none !important;
  padding: 0 12px;
}
:deep(.el-input__wrapper:hover) {
  border-color: rgba(0, 180, 255, 0.25);
}
:deep(.el-input__wrapper.is-focus) {
  border-color: rgba(0, 180, 255, 0.35);
}
:deep(.el-input__inner) {
  color: #e2e8f0;
  font-size: 12px;
  font-family: "Space Mono", monospace;
  background: transparent;
}
:deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.15);
}
:deep(.el-input.is-disabled .el-input__wrapper) {
  opacity: 0.5;
}
:deep(.el-input.is-disabled .el-input__inner) {
  color: #5a6478;
}

:deep(.el-textarea__inner) {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 180, 255, 0.1);
  border-radius: 6px;
  box-shadow: none !important;
  color: #e2e8f0;
  font-size: 12px;
  font-family: "Space Mono", monospace;
}
:deep(.el-textarea__inner:hover) {
  border-color: rgba(0, 180, 255, 0.25);
}
:deep(.el-textarea__inner::placeholder) {
  color: rgba(255, 255, 255, 0.15);
}
</style>

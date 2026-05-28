<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑 Pipeline' : '创建 Pipeline'"
    width="520px"
    destroy-on-close
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="Pipeline ID" prop="id">
        <el-input v-model="form.id" :disabled="isEdit" placeholder="留空自动生成，不支持中文" />
      </el-form-item>
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name" placeholder="Pipeline 名称" />
      </el-form-item>
      <el-form-item label="版本">
        <el-input v-model="form.version" placeholder="1.0.0" />
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.description" type="textarea" :rows="3" placeholder="可选描述" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">确定</el-button>
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

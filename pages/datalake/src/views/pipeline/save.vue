<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑 Pipeline' : '创建 Pipeline'"
    width="700px"
    destroy-on-close
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="Pipeline ID" prop="id">
        <el-input v-model="form.id" :disabled="isEdit" placeholder="如: pipeline-temp-sensor" />
      </el-form-item>
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name" placeholder="Pipeline 名称" />
      </el-form-item>
      <el-form-item label="版本">
        <el-input v-model="form.version" placeholder="1.0.0" />
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="form.description" type="textarea" :rows="2" placeholder="可选描述" />
      </el-form-item>
      <el-form-item label="节点定义">
        <el-input
          v-model="nodesJson"
          type="textarea"
          :rows="8"
          placeholder='JSON DSL, 如: [{"type":"filter","spi":"null-filter","config":{}}]'
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import { ElMessage } from "element-plus";
import { fetchCreatePipeline, fetchUpdatePipeline } from "../../api/pipeline";
import type { ScGraph, ScGraphNode } from "../../types";

defineOptions({ name: "PipelineSaveDialog" });

const visible = ref(false);
const loading = ref(false);
const isEdit = ref(false);
const formRef = ref();
const nodesJson = ref("[]");

const form = reactive<Partial<ScGraph>>({
  id: "",
  name: "",
  version: "1.0.0",
  description: "",
});

const rules = {
  id: [{ required: true, message: "请输入 Pipeline ID", trigger: "blur" }],
  name: [{ required: true, message: "请输入名称", trigger: "blur" }],
};

const open = (row?: ScGraph) => {
  visible.value = true;
  isEdit.value = !!row;
  if (row) {
    Object.assign(form, { id: row.id, name: row.name, version: row.version, description: row.description });
    nodesJson.value = JSON.stringify(row.nodes || [], null, 2);
  } else {
    Object.assign(form, { id: "", name: "", version: "1.0.0", description: "" });
    nodesJson.value = "[]";
  }
};

const handleSubmit = async () => {
  await formRef.value?.validate();
  loading.value = true;
  try {
    let nodes: ScGraphNode[] = [];
    try {
      nodes = JSON.parse(nodesJson.value);
    } catch {
      ElMessage.error("节点定义 JSON 格式错误");
      return;
    }
    const data = { ...form, nodes };
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

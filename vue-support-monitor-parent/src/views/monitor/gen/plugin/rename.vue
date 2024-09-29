<template>
  <div>
    <el-dialog v-model="visible" title="修改名称" draggable width="400px">
      <el-form :model="form">
        <el-form-item prop="旧名称">
          <el-input v-model="form.tableName" readonly disabled />
        </el-form-item>
        <el-form-item prop="新名称">
          <el-input v-model="form.newTableName" placeholder="新表名" />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="visible = false">取消</el-button>
          <el-button type="primary" :loading="loading.isSave" @click="handleSubmit">提交</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { fetchGenSessionRenameTable } from "@/api/monitor/gen/session";
import { root } from "postcss";
import { reactive, ref, defineExpose, defineEmits } from "vue";
const visible = ref(false);
const nodeValue = ref(null);

const loading = reactive({
  isSave: false
});
const form = reactive({
  genId: "",
  tableName: "",
  newTableName: ""
});

const emit = defineEmits(["success"]);

const handleSubmit = async () => {
  loading.isSave = true;
  fetchGenSessionRenameTable(form)
    .then(res => {
      if (res.code == "00000") {
        emit("success", nodeValue.value);
        visible.value = false;
        return;
      }
    })
    .finally(() => {
      loading.isSave = false;
    });
};

const setRoot = async root => {
  form.genId = root.genId;
  return this;
};
const setData = async data => {
  form.tableName = data.nodeName;
  return this;
};
const setNode = async node => {
  nodeValue.value = node;
  return this;
};

const open = () => {
  visible.value = true;
};

defineExpose({
  open,
  setRoot,
  setNode,
  setData
});
</script>

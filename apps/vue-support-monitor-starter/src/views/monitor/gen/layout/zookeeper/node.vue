<template>
  <div>
    <el-dialog v-model="visible" :title="config.mode == 'add' ? '新增节点' : '修改节点'" draggable width="450px">
      <el-form :model="form" label-width="70px">
        <el-form-item label="父节点">
          <el-input v-model="form.oldContent" />
        </el-form-item>
        <el-form-item v-if="config.mode == 'edit'" label="新名称">
          <el-input v-model="form.content" placeholder="请输入新名称" />
        </el-form-item>
        <el-form-item v-if="config.mode == 'add'" label="节点名称">
          <el-input v-model="form.content" placeholder="请输入节点名称" />
        </el-form-item>
        <el-form-item label="数据">
          <el-input v-model="form.data" placeholder="请输入数据" type="textarea" />
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
import { fetchGenSessionRenameTable, fetchGenSessionSave, fetchGenSessionUpdate } from "@/api/monitor/gen/session";
import { reactive, ref, defineExpose, defineEmits, onUnmounted } from "vue";
import { message } from "@repo/utils";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
const visible = ref(false);
const nodeValue = ref(null);

const props = defineProps({
  data: Object,
});

const config = reactive({
  mode: "add",
});

const loading = reactive({
  isSave: false,
});
const form = reactive({});

const emit = defineEmits(["success"]);

const handleClose = () => {
  visible.value = false;
};
const handleSubmit = async () => {
  if (!form.content) {
    message("请输入新名称", { type: "warning" });
    return false;
  }
  if (form.oldContent == form.content) {
    message(t("message.updateSuccess"), { type: "success" });
    return false;
  }
  loading.isSave = true;
  const newForm = {};
  Object.assign(newForm, form);
  newForm.type = "NODE";
  newForm.genId = props.data.genId;
  newForm.content = form.oldContent + "/" + form.content;
  if (config.mode == "add") {
    newForm.oldContent = null;
    fetchGenSessionSave(newForm)
      .then((res) => {
        if (res.code == "00000") {
          message(t("message.updateSuccess"), { type: "success" });
          handleClose();
          emit("success", nodeValue.value);
        }
      })
      .finally(() => {
        loading.isSave = false;
      });
  } else {
    newForm.oldContent = form.nodeId;
    fetchGenSessionUpdate(newForm)
      .then((res) => {
        if (res.code == "00000") {
          message(t("message.updateSuccess"), { type: "success" });
          handleClose();
          emit("success", nodeValue.value);
        }
      })
      .finally(() => {
        loading.isSave = false;
      });
  }
};

const setRoot = async (root) => {
  form.genId = root.genId;
  return this;
};
const setData = async (data) => {
  form.tableName = data.nodeName;
  form.nodeId = data.nodeId;
  form.oldContent = data.nodeId;
  return this;
};
const setNode = async (node) => {
  nodeValue.value = node;
  return this;
};

const open = (mode) => {
  visible.value = true;
  config.mode = mode;
  if (mode == "edit") {
    form.content = form.tableName;
  }
};

onUnmounted(async () => {
  handleClose();
});
defineExpose({
  open,
  setRoot,
  setNode,
  setData,
});
</script>

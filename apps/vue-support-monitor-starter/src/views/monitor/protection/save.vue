<script setup>
import { fetchProtectionSave, fetchProtectionUpdate } from "@/api/monitor/protection";
import { message } from "@repo/utils";
import { defineExpose, defineEmits, shallowRef, reactive } from "vue";

import { useI18n } from "vue-i18n";
const { t } = useI18n();
const formRef = shallowRef();
const emit = defineEmits(["close"]);
const env = reactive({
  visible: false,
  title: "",
  params: {},
  data: {},
  loading: false,
  mode: "save",
});

const rules = {
  monitorProtectionName: [{ required: true, message: "请输入名称", trigger: "blur" }],
  monitorProtectionPid: [{ required: true, message: "请输入监听的PID", trigger: "blur" }],
  monitorProtectionShell: [{ required: true, message: "请输入脚本", trigger: "blur" }],
  monitorProtectionStatus: [{ required: true, message: "请输入状态", trigger: "blur" }],
};
const handleClose = async () => {
  env.visible = false;
  env.form = {};
};

const handleUpdate = async () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      env.loading = true;
      if (env.mode === "edit") {
        return fetchProtectionUpdate(env.form)
          .then((res) => {
            message(t("message.updateSuccess"), { type: "success" });
            handleClose();
          })
          .finally(() => {
            env.loading = false;
          });
      }
      return fetchProtectionSave(env.form)
        .then((res) => {
          message(t("message.updateSuccess"), { type: "success" });
          handleClose();
        })
        .finally(() => {
          env.loading = false;
        });
    }
  });
};

const handleOpen = async (item, mode) => {
  env.form = item;
  env.mode = mode;
  env.visible = true;
  if (mode == "save") {
    env.title = "新增";
    env.form.sysServiceModuleSort = 1;
    return;
  }
  env.title = "更新 - " + item.monitorProtectionName;
};

defineExpose({
  handleOpen,
  handleClose,
});
</script>
<template>
  <div>
    <el-dialog v-model="env.visible" :title="env.title" draggable :close-on-click-modal="false">
      <el-form :model="env.form" ref="formRef" :rules="rules" label-width="120px">
        <el-form-item label="名称" prop="monitorProtectionName">
          <el-input v-model="env.form.monitorProtectionName" placeholder="请输入名称" />
        </el-form-item>

        <el-form-item label="PID" prop="monitorProtectionPid">
          <el-input-number v-model="env.form.monitorProtectionPid" placeholder="请输入监听的PID" />
        </el-form-item>

        <el-form-item label="启动脚本" prop="monitorProtectionShell">
          <el-input type="textarea" :rows="3" v-model="env.form.monitorProtectionShell" placeholder="请输入脚本" />
        </el-form-item>

        <el-form-item label="状态" prop="monitorProtectionStatus">
          <el-select v-model="env.form.monitorProtectionStatus" clearable clear-icon class="!w-[150px]">
            <el-option label="全部" value=""></el-option>
            <el-option label="启用" :value="0"></el-option>
            <el-option label="禁用" :value="1"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="备注" prop="monitorProtectionRemark">
          <el-input type="textarea" :rows="3" v-model="env.form.monitorProtectionRemark" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleClose">{{ $t("buttons.cancel") }}</el-button>
        <el-button type="primary" :loading="env.loading" @click="handleUpdate">{{ $t("buttons.confirm") }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

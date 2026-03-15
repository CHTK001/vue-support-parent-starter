<script setup>
import { message } from "@repo/utils";
import { defineExpose, shallowRef, reactive } from "vue";

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

const rules = {};
const handleClose = async () => {
  env.visible = false;
  env.form = {};
};

const handleUpdate = async () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      env.loading = true;
      if (env.mode === "edit") {
        return fetchUpdateServiceModule(env.form)
          .then((res) => {
            message(t("message.updateSuccess"), { type: "success" });
            handleClose();
          })
          .finally(() => {
            env.loading = false;
          });
      }
      return fetchSaveServiceModule(env.form)
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
  env.title = "模块 - " + item.sysServiceModuleName;
};

defineExpose({
  handleOpen,
  handleClose,
});
</script>
<template>
  <div>
    <sc-dialog v-model="env.visible" :title="env.title" draggable :close-on-click-modal="false">
      <ScForm :model="env.form" ref="formRef" :rules="rules" label-width="120px">
        <ScFormItem label="名称" prop="sysServiceModuleName">
          <ScInput v-model="env.form.sysServiceModuleName" placeholder="请输入名称" />
        </ScFormItem>
      </ScForm>
      <template #footer>
        <ScButton @click="handleClose">{{ $t("buttons.cancel") }}</ScButton>
        <ScButton type="primary" :loading="env.loading" @click="handleUpdate">{{ $t("buttons.confirm") }}</ScButton>
      </template>
    </sc-dialog>
  </div>
</template>

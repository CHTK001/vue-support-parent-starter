<script setup>
import { fetchListMenu } from "@/api/manage/menu";
import { fetchSaveServiceModule, fetchUpdateServiceModule } from "@/api/service/module";
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
  sysServiceModuleName: [{ required: true, message: "请输入名称", trigger: "blur" }],
  sysServiceModuleCode: [{ required: true, message: "请输入编码", trigger: "blur" }],
  sysServiceModuleType: [{ required: true, message: "请选择类型", trigger: "blur" }],
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
  loadMenuList();
  env.form = item;
  env.mode = mode;
  env.visible = true;
  if (mode == "save") {
    env.title = "新增模块";
    env.form.sysServiceModuleSort = 1;
    return;
  }
  env.title = "模块更新 - " + item.sysServiceModuleName;
};

const loadMenuList = async () => {
  fetchListMenu({}).then((res) => {
    env.menuList = res.data;
  });
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
        <el-form-item label="名称" prop="sysServiceModuleName">
          <el-input v-model="env.form.sysServiceModuleName" placeholder="请输入名称" />
        </el-form-item>

        <el-form-item label="编码" prop="sysServiceModuleCode">
          <el-input v-model="env.form.sysServiceModuleCode" placeholder="请输入编码" />
        </el-form-item>

        <el-form-item label="类型" prop="sysServiceModuleType">
          <el-select v-model="env.form.sysServiceModuleType" placeholder="请选择类型">
            <el-option label="接口" value="API" />
            <el-option label="服务" value="SERVICE" />
          </el-select>
        </el-form-item>

        <el-form-item label="优先级" prop="sysServiceModuleSort">
          <el-input-number v-model="env.form.sysServiceModuleSort" placeholder="请输入编码" />
        </el-form-item>

        <el-form-item label="版本" prop="sysServiceModuleVersion">
          <el-input v-model="env.form.sysServiceModuleVersion" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="选中菜单" prop="sysServiceModuleMenuTags" v-if="env.form.sysServiceModuleType == 'SERVICE'">
          <el-tree-select v-model="env.sysServiceModuleMenuTagsList" :data="env.menuList" multiple :render-after-expand="false" />
        </el-form-item>

        <el-form-item label="描述" prop="sysServiceModuleRemark">
          <el-input v-model="env.form.sysServiceModuleRemark" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleClose">{{ $t("buttons.cancel") }}</el-button>
        <el-button type="primary" :loading="env.loading" @click="handleUpdate">{{ $t("buttons.confirm") }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

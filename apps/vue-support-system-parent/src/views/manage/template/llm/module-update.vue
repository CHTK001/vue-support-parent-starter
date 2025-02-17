<template>
  <div>
    <el-dialog v-model="env.visible" :title="env.title" draggable :close-on-click-modal="false" @close="handleClose">
      <el-form :model="form" ref="formRef" :rules="rules" label-width="100px">
        <el-form-item label="模块名称" prop="sysAiModuleName">
          <el-input v-model="form.sysAiModuleName" placeholder="请输入模块名称"></el-input>
        </el-form-item>

        <el-form-item label="模块标识" prop="sysAiModuleCode">
          <el-input v-model="form.sysAiModuleCode" placeholder="请输入模块标识"></el-input>
        </el-form-item>

        <el-form-item label="模块厂家" prop="sysApiModuleManufacturers">
          <el-select v-model="form.sysApiModuleManufacturers" placeholder="请选择模块类型">
            <el-option v-for="item in manufacturers" :key="item.sysDictItemId" :label="item.sysDictItemName" :value="item.sysDictItemId" />
          </el-select>
        </el-form-item>

        <el-form-item label="优先级" prop="sysApiModuleSort">
          <el-input-number v-model="form.sysApiModuleSort" placeholder="请输入模块优先级"></el-input-number>
        </el-form-item>

        <el-form-item label="版本" prop="sysAiModuleVersion">
          <el-input v-model="form.sysAiModuleVersion" placeholder="请输入版本"></el-input>
        </el-form-item>

        <el-form-item label="模块描述" prop="sysAiModuleRemark">
          <el-input v-model="form.sysAiModuleDesc" placeholder="请输入模块描述" type="textarea"></el-input>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="env.visible = false">取 消</el-button>
        <el-button type="primary" @click="debounce(handleUpdate(), 1000, true)">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { fetchListDictItem } from "@repo/core";
import { defineEmits, defineExpose, reactive, shallowRef } from "vue";
import { debounce } from "@pureadmin/utils";
import { fetchSaveProjectForAiModule, fetchUpdateProjectForAiModule } from "@/api/manage/project-ai-module";
import { message } from "@repo/utils";

const emit = defineEmits();
const rules = {
  sysAiModuleCode: [
    { required: true, message: "请输入模块标识", trigger: "blur" },
    { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" },
  ],
  sysAiModuleName: [
    { required: true, message: "请输入模块名称", trigger: "blur" },
    { min: 2, max: 20, message: "长度在 2 到 20个字符", trigger: "blur" },
  ],
  sysApiModuleManufacturers: [{ required: true, message: "请选择模块厂家", trigger: "blur" }],
};
const formRef = shallowRef();
const form = shallowRef({});
const env = reactive({
  visible: false,
  mode: "edit",
  title: "模块更新",
});

const manufacturers = shallowRef([]);
const handleUpdate = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      if (env.mode === "edit") {
        fetchUpdateProjectForAiModule(form.value).then((res) => {
          if (res.code == "00000") {
            message("修改成功", { type: "success" });
            handleClose();
          }
        });
        return;
      }
      if (env.mode === "add") {
        fetchSaveProjectForAiModule(form.value).then((res) => {
          if (res.code == "00000") {
            message("修改成功", { type: "success" });
            handleClose();
            emit("success", res?.data);
          }
        });
      }
    }
  });
};
const initialManufacturers = async () => {
  fetchListDictItem({
    sysDictId: 1,
  }).then((res) => {
    manufacturers.value = res?.data;
  });
};

const handleClose = () => {
  env.visible = false;
  form.value = {};
};

const handleOpen = async (item, mode) => {
  env.visible = true;
  env.title = "模块更新 - " + item.sysProjectName || item.sysAiModuleName;
  env.mode = mode;
  form.value = item;
  initialManufacturers();
  if (mode == "add") {
    form.value.sysApiModuleSort = 1;
  }
};

defineExpose({
  handleOpen,
  handleClose,
});
</script>

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

        <el-form-item label="模型类型" prop="sysAiModuleType">
          <el-select v-model="form.sysAiModuleType" placeholder="请选择模块类型">
            <el-option v-for="item in moduleType" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="模块厂家" prop="sysAiModuleManufacturers">
          <el-select v-model="form.sysAiModuleManufacturers" placeholder="请选择模块类型">
            <el-option v-for="item in manufacturers" :key="item.sysDictItemId" :label="item.sysDictItemName" :value="item.sysDictItemId" />
          </el-select>
        </el-form-item>

        <el-form-item label="vlm模型" prop="sysAiModuleVlm">
          <el-segmented
            v-model="form.sysAiModuleVlm"
            :options="[
              { label: '是', value: 1 },
              { label: '否', value: 0 },
            ]"
          ></el-segmented>
        </el-form-item>
        <el-form-item label="模型地址" prop="sysAiModuleUrl">
          <el-input v-model="form.sysAiModuleUrl" placeholder="请输入模型地址"></el-input>
        </el-form-item>

        <el-form-item label="优先级" prop="sysAiModuleSort">
          <el-input-number v-model="form.sysAiModuleSort" placeholder="请输入模块优先级"></el-input-number>
        </el-form-item>

        <el-form-item label="版本" prop="sysAiModuleVersion">
          <el-input v-model="form.sysAiModuleVersion" placeholder="请输入版本"></el-input>
        </el-form-item>

        <el-form-item label="模块描述" prop="sysAiModuleRemark">
          <el-input v-model="form.sysAiModuleRemark" placeholder="请输入模块描述" type="textarea"></el-input>
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
import { debounce } from "@pureadmin/utils";
import { fetchListDictItem } from "@repo/core";
import { message } from "@repo/utils";
import { defineExpose, reactive, ref, shallowRef } from "vue";
import { fetchSaveProjectForAiModule, fetchUpdateProjectForAiModule } from "../../api/manage/project-ai-module";

const emit = defineEmits();
const rules = {
  sysAiModuleCode: [
    { required: true, message: "请输入模块标识", trigger: "blur" },
    { min: 2, max: 200, message: "长度在 2 到 200 个字符", trigger: "blur" },
  ],
  sysAiModuleName: [
    { required: true, message: "请输入模块名称", trigger: "blur" },
    { min: 2, max: 200, message: "长度在 2 到 200个字符", trigger: "blur" },
  ],
  sysApiModuleManufacturers: [{ required: true, message: "请选择模块厂家", trigger: "blur" }],
  sysApiModuleType: [{ required: true, message: "请选择模块类型", trigger: "blur" }],
  sysAiModuleVlm: [{ required: true, message: "请选择是否vlm模型", trigger: "blur" }],
};
const formRef = ref();
const form = ref({});
const moduleType = shallowRef([
  {
    label: "大语言",
    value: "LLM",
  },
  {
    label: "文生图",
    value: "VINCENT",
  },
  {
    label: "文生视频",
    value: "VIDEO",
  },
  {
    label: "超分辨率",
    value: "RESOLUTION",
  },
  {
    label: "图像上色",
    value: "COLORIZATION",
  },
]);
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
      if (env.mode === "add" || env.mode === "save") {
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
};

const handleOpen = async (item, mode) => {
  env.visible = true;
  env.title = mode == "add" || mode == "save" ? "模块新增" : "模块更新" + " - " + (item.sysProjectName || item.sysAiModuleName);
  env.mode = mode;
  form.value = item;
  initialManufacturers();
  if (mode == "add" || mode == "save") {
    form.value.sysApiModuleSort = 1;
  }
};

defineExpose({
  handleOpen,
  handleClose,
});
</script>

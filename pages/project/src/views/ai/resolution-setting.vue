<template>
  <div>
    <el-dialog v-model="env.visible" :title="env.title" draggable :close-on-click-modal="false" @close="handleClose">
      <el-skeleton animated :loading="loadingConfig.loading">
        <template #default>
          <el-form :model="form" ref="formRef" :rules="rules" label-width="100px">
            <el-form-item label="模块名称" prop="sysAiModuleName">
              <el-text>{{ form.sysAiModuleName }}</el-text>
            </el-form-item>

            <el-form-item label="放大倍数" prop="sysAiVincentSupportedSizeList">
              <el-select multiple v-model="form.sysAiVincentSupportedSizeList" placeholder="请选择模块类型" clearable filterable allow-create>
                <el-option v-for="item in env.sysAiVincentSupportedSize" :key="item" :label="`${item}倍`" :value="item" />
              </el-select>
            </el-form-item>
            <el-form-item label="最大尺寸" prop="sysAiVincentSupportedMaxSize">
              <el-input-number v-model="form.sysAiVincentSupportedMaxSize" placeholder="请输入最大尺寸" clearable> </el-input-number>
            </el-form-item>
          </el-form>
        </template>
      </el-skeleton>

      <template #footer>
        <el-button @click="env.visible = false">取 消</el-button>
        <el-button type="primary" @click="debounce(handleUpdate(), 1000, true)">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { debounce } from "@pureadmin/utils";
import { message } from "@repo/utils";
import { defineEmits, defineExpose, reactive, shallowRef } from "vue";
import { fetchGetForModelSetting, fetchUpdateForModelSetting } from "../../api/ai/vincent-setting";

const emit = defineEmits();
const rules = {
  sysAiVincentSupportedSizeList: [{ required: true, message: "请选择支持尺寸", trigger: "blur" }],
  sysAiVincentSupportedNumber: [{ required: true, message: "请输入支持输出张数", trigger: "blur" }],
  sysAiVincentSupportAsync: [{ required: true, message: "请选择是否支持异步", trigger: "blur" }],
  sysAiVincentSupportedMaxSize: [{ required: true, message: "请输入最大尺寸", trigger: "blur" }],
};
const loadingConfig = reactive({
  loading: false,
});
const formRef = shallowRef();
let form = reactive({
  sysAiVincentSupportedSizeList: [],
  sysAiVincentSupportedStyleList: [],
  sysAiVincentSupportedMaxSize: 2048,
});
const env = reactive({
  visible: false,
  mode: "edit",
  title: "模块更新",
  sysAiVincentSupportedSize: new Set(["2", "4"]),
  sysAiVincentSupportedStyle: new Set([]),
});

const handleUpdate = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      if (form.sysAiVincentSupportedSizeList) {
        form.sysAiVincentSupportedSize = form.sysAiVincentSupportedSizeList.join(",");
      }
      if (form.sysAiVincentSupportedStyleList) {
        form.sysAiVincentSupportedStyle = form.sysAiVincentSupportedStyleList.join(",");
      }
      fetchUpdateForModelSetting(form).then((res) => {
        if (res.code == "00000") {
          message("修改成功", { type: "success" });
          emit("success", res?.data);
          handleClose();
        }
      });
      return;
    }
  });
};

const loadConfig = async () => {
  const row = env.item;
  loadingConfig.loading = true;
  try {
    const { data } = await fetchGetForModelSetting({
      sysAiModuleId: row.sysAiModuleId,
    });
    Object.assign(form, data);
  } catch (error) {}
  loadingConfig.loading = false;
  form.sysAiModuleName = row.sysAiModuleName;
  form.sysAiModuleId = row.sysAiModuleId;
  if (env.mode == "add") {
    form.sysApiModuleSort = 1;
  }
  if (form.sysAiVincentSupportedSize) {
    form.sysAiVincentSupportedSizeList = form.sysAiVincentSupportedSize.split(",");
    form.sysAiVincentSupportedSizeList.forEach((it) => {
      env.sysAiVincentSupportedSize.add(it);
    });
  }
  form.sysAiVincentSupportedStyleList = form.styles;
  form.sysAiVincentSupportedStyleList.forEach((it) => {
    env.sysAiVincentSupportedStyle.add(it);
  });
};
const handleClose = () => {
  env.visible = false;
  form = reactive({});
};

const handleOpen = async (item, mode) => {
  env.visible = true;
  env.item = item;
  env.title = "模块配置更新 - " + item.sysAiModuleName;
  env.mode = mode;
  loadConfig();
};

defineExpose({
  handleOpen,
  handleClose,
});
</script>

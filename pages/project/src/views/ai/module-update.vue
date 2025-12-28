<template>
  <div>
    <sc-dialog
      v-model="env.visible"
      :title="env.title"
      draggable
      :close-on-click-modal="false"
      @close="handleClose"
    >
      <el-form :model="form" ref="formRef" :rules="rules" label-width="100px">
        <el-form-item label="模块名称" prop="sysAiModuleName">
          <el-input
            v-model="form.sysAiModuleName"
            placeholder="请输入模块名称"
          ></el-input>
        </el-form-item>

        <el-form-item label="模块标识" prop="sysAiModuleCode">
          <el-input
            v-model="form.sysAiModuleCode"
            placeholder="请输入模块标识"
          ></el-input>
        </el-form-item>

        <el-form-item label="模型类型" prop="sysAiModuleType">
          <el-select
            v-model="form.sysAiModuleType"
            placeholder="请选择模块类型"
          >
            <el-option
              v-for="item in moduleType"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="模块厂家" prop="sysAiModuleManufacturers">
          <el-select
            v-model="form.sysAiModuleManufacturers"
            placeholder="请选择模块类型"
          >
            <el-option
              v-for="item in manufacturers"
              :key="item.sysDictItemId"
              :label="item.sysDictItemName"
              :value="item.sysDictItemId"
            />
          </el-select>
        </el-form-item>

        <el-form-item
          label="vlm模型"
          prop="sysAiModuleVlm"
          v-if="form.sysAiModuleType == 'LLM'"
        >
          <el-segmented
            v-model="form.sysAiModuleVlm"
            :options="[
              { label: '是', value: 1 },
              { label: '否', value: 0 },
            ]"
          ></el-segmented>
        </el-form-item>

        <el-form-item label="本地模型" prop="sysAiModuleLocation">
          <ScSelect
            :options="[
              { label: '本地', value: 1, icon: 'ep:folder' },
              { label: '远程', value: 0, icon: 'ri:link' },
            ]"
            v-model="form.sysAiModuleLocation"
          ></ScSelect>
        </el-form-item>

        <el-form-item
          label="模型地址"
          prop="sysAiModuleUrl"
          v-if="form.sysAiModuleLocation == 1"
        >
          <DirectorySelector v-model="form.sysAiModuleUrl" />
          <span class="el-form-item-msg">模型的本地地址</span>
        </el-form-item>

        <el-form-item label="模型地址" prop="sysAiModuleUrl" v-else>
          <el-input
            v-model="form.sysAiModuleUrl"
            placeholder="请输入模型地址"
          ></el-input>
        </el-form-item>

        <el-form-item label="优先级" prop="sysAiModuleSort">
          <el-input-number
            v-model="form.sysAiModuleSort"
            placeholder="请输入模块优先级"
          ></el-input-number>
        </el-form-item>

        <el-form-item label="版本" prop="sysAiModuleVersion">
          <el-input
            v-model="form.sysAiModuleVersion"
            placeholder="请输入版本"
          ></el-input>
        </el-form-item>

        <el-form-item label="模块描述" prop="sysAiModuleRemark">
          <el-input
            v-model="form.sysAiModuleRemark"
            placeholder="请输入模块描述"
            type="textarea"
          ></el-input>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="env.visible = false">取 消</el-button>
        <el-button type="primary" @click="debounce(handleUpdate(), 1000, true)"
          >确 定</el-button
        >
      </template>
    </sc-dialog>
  </div>
</template>
<script setup>
import { debounce } from "@pureadmin/utils";
import ScSelect from "@repo/components/ScSelect/index.vue";
import { fetchListDictItem } from "@repo/core";
import { message } from "@repo/utils";
import { defineExpose, reactive, ref, shallowRef } from "vue";
import {
  fetchSaveProjectForAiModule,
  fetchUpdateProjectForAiModule,
} from "../../api/manage/project-ai-module";
import DirectorySelector from "./DirectorySelector.vue";
import { DEFAULT_MODULE_TYPE } from "./hook";
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
  sysAiModuleLocation: [
    { required: true, message: "请选择是否本地模型", trigger: "blur" },
  ],
  sysApiModuleManufacturers: [
    { required: true, message: "请选择模块厂家", trigger: "change" },
  ],
  sysApiModuleType: [
    { required: true, message: "请选择模块类型", trigger: "change" },
  ],
  sysAiModuleVlm: [
    { required: true, message: "请选择是否vlm模型", trigger: "change" },
  ],
};
const formRef = ref();
const form = ref({});
const moduleType = DEFAULT_MODULE_TYPE;
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
  env.title =
    mode == "add" || mode == "save"
      ? "模块新增"
      : "模块更新" + " - " + (item.sysProjectName || item.sysAiModuleName);
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

<style scoped lang="scss">
:deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);

  .el-dialog__header {
    padding: 20px 24px;
    margin: 0;
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-9) 0%,
      var(--el-bg-color-overlay) 100%
    );
    border-bottom: 1px solid var(--el-border-color-lighter);

    .el-dialog__title {
      font-size: 18px;
      font-weight: 700;
      color: var(--el-text-color-primary);
    }
  }

  .el-dialog__body {
    padding: 28px;
    background: var(--el-bg-color);
  }

  .el-dialog__footer {
    padding: 16px 24px;
    border-top: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color-overlay);
  }
}

:deep(.el-form-item) {
  margin-bottom: 20px;

  .el-form-item__label {
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

:deep(.el-input__wrapper),
:deep(.el-select__wrapper),
:deep(.el-textarea__inner) {
  border-radius: 10px;
  transition: all 0.3s ease;

  &:hover,
  &:focus-within {
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.12);
  }
}

:deep(.el-segmented) {
  border-radius: 10px;

  .el-segmented__item {
    border-radius: 8px;
    transition: all 0.3s ease;
    font-weight: 500;

    &.is-selected {
      background: linear-gradient(
        135deg,
        var(--el-color-primary) 0%,
        var(--el-color-primary-light-3) 100%
      );
      box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.3);
    }
  }
}

:deep(.el-button) {
  border-radius: 10px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
  }

  &.el-button--primary:hover {
    box-shadow: 0 6px 20px rgba(var(--el-color-primary-rgb), 0.35);
  }
}

.el-form-item-msg {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
</style>

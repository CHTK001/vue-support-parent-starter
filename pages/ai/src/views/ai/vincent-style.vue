<template>
  <div>
    <sc-dialog
      v-model="env.visible"
      :title="env.title"
      width="70%"
      class="max-h-[90vh]"
      top="10px"
      draggable
      :close-on-click-modal="false"
      @close="handleClose"
    >
      <ScRow class="justify-end mb-2">
        <ScButton 
          class="btn-text"
          :icon="useRenderIcon('ep:plus')"
          @click="handleSaveForm"
        ></ScButton>
        <ScButton 
          class="btn-text"
          :icon="useRenderIcon('ri:save-2-line')"
          type="primary"
          @click="handleUpdate"
        ></ScButton>
      </ScRow>
      <ScRow class="h-[65vh]">
        <ScCol :span="12" class="h-full overflow-auto">
          <el-skeleton animated :loading="loadingConfig.loading">
            <template #default>
              <ScEmpty v-if="listData.length == 0"></ScEmpty>
              <ScRow v-else>
                <ScCol 
                  :span="7"
                  v-for="item in listData"
                  @click="handleSetForm(item)"
                  class="m-2 cursor-pointer z-0"
                >
                  <div class="relative">
                    <ScTag class="!absolute top-0 left-0 z-[10]">
                      {{ item.sysAiVincentStyleName }}
                    </ScTag>
                    <ScButton 
                      type="default"
                      size="small"
                      plain
                      text
                      :icon="useRenderIcon('ep:close')"
                      class="!absolute top-0 right-0 z-[10] text-white"
                      @click="handleDelete(item)"
                    >
                    </ScButton>
                  </div>
                  <div class="template-item z-1">
                    <ScImage :src="item.sysAiVincentStyleImage" :z-index="2">
                    </ScImage>
                  </div>
                </ScCol>
              </ScRow>
            </template>
          </el-skeleton>
        </ScCol>
        <ScCol :span="12" class="h-full overflow-auto">
          <ScEmpty v-if="!form.sysAiModuleId"></ScEmpty>
          <ScForm 
            :model="form"
            ref="formRef"
            :rules="rules"
            label-width="100px"
            v-else
          >
            <ScFormItem label="所属模块" prop="sysAiModuleName">
              <el-text
                >{{ form.sysAiModuleName }}({{ form.sysAiModuleId }})</el-text>
            </ScFormItem>

            <ScFormItem label="风格名称" prop="sysAiVincentStyleName">
              <ScInput 
                v-model="form.sysAiVincentStyleName"
                placeholder="请输入风格名称"
                clearable
              ></ScInput>
            </ScFormItem>
            <ScFormItem label="风格编码" prop="sysAiVincentStyleCode">
              <ScInput 
                v-model="form.sysAiVincentStyleCode"
                placeholder="请输入风格编码"
                clearable
              ></ScInput>
            </ScFormItem>

            <ScFormItem label="风格图片" prop="sysAiVincentStyleImage">
              <div class="flex justify-between gap-1 h-[50px] w-full">
                <ScImage 
                  class="!h-[50px] !w-[50px]"
                  fit="cover"
                  v-if="form.sysAiVincentStyleImage"
                  :src="form.sysAiVincentStyleImage"
                ></ScImage>
                <ScInput 
                  type="textarea"
                  class="w-full"
                  v-model="form.sysAiVincentStyleImage"
                  placeholder="请输入风格名称"
                  clearable
                ></ScInput>
              </div>
            </ScFormItem>
          </ScForm>
        </ScCol>
      </ScRow>
    </sc-dialog>
  </div>
</template>
<script setup>
import { ScCol } from "@repo/components/ScCol";
import { ScEmpty } from "@repo/components/ScEmpty";
import { ScImage } from "@repo/components/ScImage";
import { ScRow } from "@repo/components/ScRow";
import {  useRenderIcon  } from "@repo/components/ReIcon";
import { clearObject, message } from "@repo/utils";
import { defineExpose, reactive, shallowRef } from "vue";
import { useI18n } from "vue-i18n";
import {
  fetchDeleteForModelStyle,
  fetchListForModelStyle,
  fetchSaveForModelStyle,
  fetchUpdateForModelStyle,
} from "../../api/ai/vincent-style";
const { t } = useI18n();
const emit = defineEmits();

const rules = {
  sysAiVincentStyleName: [
    { required: true, message: "请输入风格名称", trigger: "blur" },
    { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" },
  ],
  sysAiVincentStyleCode: [
    { required: true, message: "请输入风格编码", trigger: "blur" },
    { min: 2, max: 255, message: "长度在 2 到 255 个字符", trigger: "blur" },
  ],
};
const loadingConfig = reactive({
  loading: false,
});
const formRef = shallowRef();
const form = reactive({});
const listData = shallowRef([]);
const env = reactive({
  visible: false,
  mode: "edit",
  item: {},
  title: "模块更新",
  sysAiVincentSupportedSize: new Set([
    "1024*1024",
    "720*1280",
    "768*1152",
    "1280*720",
    "512*1024",
    "576*1024",
    "1024*576",
  ]),
  sysAiVincentSupportedStyle: new Set([
    "<auto>",
    "<photography>",
    "<portrait>",
    "<3d cartoon>",
    "<anime>",
    "<oil painting>",
    "<watercolor>",
    "<sketch>",
    "<chinese painting>",
    "<flat illustration>",
  ]),
});

const handleSaveForm = async () => {
  form.sysAiModuleId = env.item.sysAiModuleId;
  form.sysAiModuleName = env.item.sysAiModuleName;
  env.mode = "add";
};

const handleDelete = async (item) => {
  fetchDeleteForModelStyle({
    sysAiVincentStyleId: item.sysAiVincentStyleId,
  }).then((res) => {
    message(t("message.deleteSuccess"), { type: "success" });
    loadConfig(env.item);
  });
};

const handleSetForm = async (item) => {
  env.mode = "edit";
  clearObject(form);
  Object.assign(form, item);
};
const handleUpdate = async () => {
  if (!formRef.value) {
    message("请先选择或新增一条风格记录", { type: "warning" });
    return;
  }
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) {
    message("请先完善必填项后再保存", { type: "warning" });
    return;
  }
  try {
    const res =
      env.mode == "add"
        ? await fetchSaveForModelStyle(form)
        : await fetchUpdateForModelStyle(form);
    if (res.code == "00000") {
      message("修改成功", { type: "success" });
      emit("success", res?.data);
      await loadConfig(env.item);
      return;
    }
    message(res?.msg || "保存失败，请稍后重试", { type: "error" });
  } catch (error) {
    message("保存失败，请检查网络或稍后重试", { type: "error" });
  }
};

const loadConfig = async (row) => {
  loadingConfig.loading = true;
  try {
    const { data } = await fetchListForModelStyle({
      sysAiModuleId: row.sysAiModuleId,
    });
    listData.value = data;
    if (env.mode !== "add" && listData.value.length > 0) {
      handleSetForm(listData.value[0]);
    }
  } catch (error) {}
  loadingConfig.loading = false;
};
const handleClose = () => {
  env.visible = false;
  listData.value.length = 0;
};

const handleOpen = async (item, mode) => {
  env.visible = true;
  env.item = item;
  env.title = "模块[风格]更新 - " + item.sysAiModuleName;
  env.mode = mode;
  clearObject(form);
  loadConfig(item);
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
    background: var(--el-bg-color-overlay);
    border-bottom: 1px solid var(--el-border-color-lighter);

    .el-dialog__title {
      font-size: 18px;
      font-weight: 700;
      color: var(--el-text-color-primary);
    }
  }

  .el-dialog__body {
    padding: 24px;
    background: var(--el-bg-color);
  }
}

.template-item {
  border-radius: 14px;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.12),
    0 4px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;

  &:hover {
    transform: translateY(-6px) scale(1.02);
    box-shadow:
      0 16px 40px rgba(var(--el-color-primary-rgb), 0.2),
      0 8px 16px rgba(0, 0, 0, 0.1);
  }
}

:deep(.el-image__inner) {
  border-radius: 14px;
  transition: transform 0.4s ease;
}

:deep(.el-tag) {
  border-radius: 8px;
  font-weight: 600;
  background: var(--el-color-primary);
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
</style>

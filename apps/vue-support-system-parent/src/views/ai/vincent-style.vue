<template>
  <div>
    <el-dialog v-model="env.visible" :title="env.title" width="70%" class="max-h-[90vh]" top="10px" draggable :close-on-click-modal="false" @close="handleClose">
      <el-row class="justify-end mb-2">
        <el-button class="btn-text" :icon="useRenderIcon('ep:plus')" @click="handleSaveForm"></el-button>
        <el-button class="btn-text" :icon="useRenderIcon('ri:save-2-line')" type="primary" @click="handleUpdate"></el-button>
      </el-row>
      <el-row class="h-[65vh]">
        <el-col :span="12" class="h-full overflow-auto">
          <el-skeleton animated :loading="loadingConfig.loading">
            <template #default>
              <el-empty v-if="listData.length == 0"></el-empty>
              <el-row v-else>
                <el-col :span="7" v-for="item in listData" @click="handleSetForm(item)" class="m-2 cursor-pointer z-0">
                  <div class="relative">
                    <el-tag class="!absolute top-0 left-0 z-[10]">
                      {{ item.sysAiVincentStyleName }}
                    </el-tag>
                    <el-button type="default" size="small" plain text :icon="useRenderIcon('ep:close')" class="!absolute top-0 right-0 z-[10] text-white" @click="handleDelete(item)"> </el-button>
                  </div>
                  <div class="template-item z-1">
                    <el-image :src="item.sysAiVincentStyleImage" :z-index="2"> </el-image>
                  </div>
                </el-col>
              </el-row>
            </template>
          </el-skeleton>
        </el-col>
        <el-col :span="12" class="h-full overflow-auto">
          <el-empty v-if="!form.sysAiModuleId"></el-empty>
          <el-form :model="form" ref="formRef" :rules="rules" label-width="100px" v-else>
            <el-form-item label="所属模块" prop="sysAiModuleName">
              <el-text>{{ form.sysAiModuleName }}({{ form.sysAiModuleId }})</el-text>
            </el-form-item>

            <el-form-item label="风格名称" prop="sysAiVincentStyleName">
              <el-input v-model="form.sysAiVincentStyleName" placeholder="请输入风格名称" clearable></el-input>
            </el-form-item>
            <el-form-item label="风格编码" prop="sysAiVincentStyleCode">
              <el-input v-model="form.sysAiVincentStyleCode" placeholder="请输入风格编码" clearable></el-input>
            </el-form-item>

            <el-form-item label="风格图片" prop="sysAiVincentStyleImage">
              <div class="flex justify-between gap-1 h-[50px] w-full">
                <el-image class="!h-[50px] !w-[50px]" fit="cover" v-if="form.sysAiVincentStyleImage" :src="form.sysAiVincentStyleImage"></el-image>
                <el-input type="textarea" class="w-full" v-model="form.sysAiVincentStyleImage" placeholder="请输入风格名称" clearable></el-input>
              </div>
            </el-form-item>
          </el-form>
        </el-col>
      </el-row>
    </el-dialog>
  </div>
</template>
<script setup>
import { fetchDeleteForModelStyle, fetchListForModelStyle, fetchSaveForModelStyle, fetchUpdateForModelStyle } from "@/api/ai/vincent-style";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { clearObject, message } from "@repo/utils";
import { defineEmits, defineExpose, reactive, shallowRef } from "vue";
import { useI18n } from "vue-i18n";
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
  sysAiVincentSupportedSize: new Set(["1024*1024", "720*1280", "768*1152", "1280*720", "512*1024", "576*1024", "1024*576"]),
  sysAiVincentSupportedStyle: new Set(["<auto>", "<photography>", "<portrait>", "<3d cartoon>", "<anime>", "<oil painting>", "<watercolor>", "<sketch>", "<chinese painting>", "<flat illustration>"]),
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
const handleUpdate = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      if (env.mode == "add") {
        fetchSaveForModelStyle(form).then((res) => {
          if (res.code == "00000") {
            message("修改成功", { type: "success" });
            emit("success", res?.data);
            loadConfig(env.item);
          }
        });
        return;
      }
      fetchUpdateForModelStyle(form).then((res) => {
        if (res.code == "00000") {
          message("修改成功", { type: "success" });
          emit("success", res?.data);
          loadConfig(env.item);
        }
      });
      return;
    }
  });
};

const loadConfig = async (row) => {
  loadingConfig.loading = true;
  try {
    const { data } = await fetchListForModelStyle({
      sysAiModuleId: row.sysAiModuleId,
    });
    listData.value = data;
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
  loadConfig(item);
};

defineExpose({
  handleOpen,
  handleClose,
});
</script>
<style scoped lang="scss">
.template-item {
  border-radius: 10px;
  box-shadow:
    0px 2px 4px 0px rgba(0, 0, 0, 0.4),
    0px 7px 13px -3px rgba(0, 0, 0, 0.3),
    0px -3px 0px 0px rgba(0, 0, 0, 0.2) inset;
}
:deep(.el-image__inner) {
  border-radius: 10px;
}
</style>

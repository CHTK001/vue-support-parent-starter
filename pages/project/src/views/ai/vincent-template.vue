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
                      {{ item.sysAiVincentTemplateName }}
                    </el-tag>
                    <el-button type="default" size="small" plain text :icon="useRenderIcon('ep:close')" class="!absolute top-0 right-0 z-[10] text-white" @click="handleDelete(item)"> </el-button>
                  </div>
                  <div class="template-item z-1">
                    <el-image :src="item.sysAiVincentTemplateAddress" :z-index="2"> </el-image>
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

            <el-form-item label="模板名称" prop="sysAiVincentTemplateName">
              <el-input v-model="form.sysAiVincentTemplateName" placeholder="请输入模板名称" clearable></el-input>
            </el-form-item>

            <el-form-item label="模板图片" prop="sysAiVincentTemplateAddress">
              <div class="flex justify-between gap-1 h-[50px] w-full">
                <el-image class="!h-[50px] !w-[50px]" fit="cover" v-if="form.sysAiVincentTemplateAddress" :src="form.sysAiVincentTemplateAddress"></el-image>
                <el-input type="textarea" class="w-full" v-model="form.sysAiVincentTemplateAddress" placeholder="请输入模板名称" clearable></el-input>
              </div>
            </el-form-item>

            <el-form-item label="分类" prop="sysAiVincentTemplateCategory">
              <el-select v-model="form.sysAiVincentTemplateCategory" clearable filterable allow-create>
                <el-option v-for="item in CATEGORY_TEMPLATE" :key="item.value" :label="item.label" :value="item.value"></el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="分辨率" prop="sysAiVincentTemplateResolutions">
              <el-select multiple v-model="form.sysAiVincentTemplateResolutionsList" clearable filterable allow-create>
                <el-option v-for="item in DEFAULT_TEMPLATE_RESOLUTION" :key="item" :label="item" :value="item"></el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="分辨率" prop="sysAiVincentTemplateRecommendPrompt">
              <el-select multiple v-model="form.sysAiVincentTemplateRecommendPromptList" clearable filterable allow-create>
                <el-option v-for="item in DEFAULT_TEMPLATE_PROMPT" :key="item" :label="item" :value="item"></el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="关键词" prop="sysAiVincentTemplateWord">
              <el-input v-model="form.sysAiVincentTemplateWord" placeholder="请输入关键词" clearable></el-input>
            </el-form-item>

            <el-form-item label="模板模型ID" prop="sysAiVincentTemplateModelId">
              <el-input v-model="form.sysAiVincentTemplateModelId" placeholder="请输入模型ID" clearable></el-input>
            </el-form-item>

            <el-form-item label="模板模型名称" prop="sysAiVincentTemplateModelName">
              <el-input v-model="form.sysAiVincentTemplateModelName" placeholder="请输入模板模型名称" clearable></el-input>
            </el-form-item>

            <el-form-item label="训练模型名称" prop="sysAiVincentTemplateTrainModel">
              <el-input v-model="form.sysAiVincentTemplateTrainModel" placeholder="请输入训练模型名称" clearable></el-input>
            </el-form-item>

            <el-form-item label="优先级" prop="sysAiVincentTemplateSort">
              <el-input-number v-model="form.sysAiVincentTemplateSort" placeholder="请输入优先级"></el-input-number>
            </el-form-item>

            <el-form-item label="备注" prop="sysAiVincentTemplateRemark">
              <el-input type="textarea" v-model="form.sysAiVincentTemplateRemark" placeholder="请输入备注"></el-input>
            </el-form-item> </el-form
        ></el-col>
      </el-row>
    </el-dialog>
  </div>
</template>
<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { clearObject, message } from "@repo/utils";
import { defineExpose, reactive, shallowRef } from "vue";
import { useI18n } from "vue-i18n";
import { fetchDeleteForModelTemplate, fetchListForModelTemplate, fetchSaveForModelTemplate, fetchUpdateForModelTemplate } from "../../api/ai/vincent-template";
import { CATEGORY_TEMPLATE, DEFAULT_TEMPLATE_PROMPT, DEFAULT_TEMPLATE_RESOLUTION } from "./vincent/hook";
const { t } = useI18n();
const emit = defineEmits();

const rules = {
  sysAiVincentTemplateName: [
    { required: true, message: "请输入模板名称", trigger: "blur" },
    { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" },
  ],
  sysAiVincentTemplateAddress: [
    { required: true, message: "请输入模板图片", trigger: "blur" },
    { min: 2, max: 255, message: "长度在 2 到 255 个字符", trigger: "blur" },
  ],
  sysAiVincentTemplateCategory: [
    { required: true, message: "请输入分类", trigger: "blur" },
    { min: 2, max: 255, message: "长度在 2 到 255 个字符", trigger: "blur" },
  ],
  sysAiVincentTemplateWord: [
    { required: true, message: "请输入关键词", trigger: "blur" },
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
  fetchDeleteForModelTemplate({
    sysAiVincentTemplateId: item.sysAiVincentTemplateId,
  }).then((res) => {
    message(t("message.deleteSuccess"), { type: "success" });
    loadConfig(env.item);
  });
};

const handleSetForm = async (item) => {
  env.mode = "edit";
  clearObject(form);
  Object.assign(form, item);
  if (form.sysAiVincentTemplateRecommendPrompt) {
    form.sysAiVincentTemplateRecommendPromptList = form.sysAiVincentTemplateRecommendPrompt.split(",");
  }
  if (form.sysAiVincentTemplateResolutions) {
    form.sysAiVincentTemplateResolutionsList = form.sysAiVincentTemplateResolutions.split(",");
  }
};
const handleUpdate = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      if (form.sysAiVincentTemplateRecommendPromptList) {
        form.sysAiVincentTemplateRecommendPrompt = form.sysAiVincentTemplateRecommendPromptList.join(",");
      }
      if (form.sysAiVincentTemplateResolutionsList) {
        form.sysAiVincentTemplateResolutions = form.sysAiVincentTemplateResolutionsList.join(",");
      }
      if (env.mode == "add") {
        fetchSaveForModelTemplate(form).then((res) => {
          if (res.code == "00000") {
            message("修改成功", { type: "success" });
            emit("success", res?.data);
            loadConfig(env.item);
          }
        });
        return;
      }
      fetchUpdateForModelTemplate(form).then((res) => {
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
    const { data } = await fetchListForModelTemplate({
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
  env.title = "模块[模板]更新 - " + item.sysAiModuleName;
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

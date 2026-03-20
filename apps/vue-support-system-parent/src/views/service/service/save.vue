<script setup>
import { fetchUploadFile } from "@/api/manage/upload";
import {
  fetchBindService,
  fetchSaveService,
  fetchUpdateService,
} from "@/api/service/service";
import { getRandomIntBelow, message } from "@repo/utils";
import { defineExpose, shallowRef, reactive } from "vue";

import { useI18n } from "vue-i18n";
const { t } = useI18n();
const formRef = shallowRef();
const emit = defineEmits(["close"]);
const env = reactive({
  visible: false,
  title: "",
  params: {},
  form: {},
  data: {},
  loading: false,
  mode: "save",
  moduleList: [],
});
const upload = reactive({
  params: {
    fileBucket: "image",
  },
});
const rules = {
  sysServiceName: [
    { required: true, message: "请输入服务名称", trigger: "blur" },
  ],
  sysServiceCode: [
    { required: true, message: "请输入服务编码", trigger: "blur" },
  ],
  sysServiceType: [{ required: true, message: "请选择类型", trigger: "blur" }],
  sysServiceTags: [{ required: true, message: "请选择模块", trigger: "blur" }],
  sysServiceValidTime: [
    { required: true, message: "请选择到期时间", trigger: "blur" },
  ],
};

const handleClose = async () => {
  env.visible = false;
  env.form = {};
};

const handleUpdateModule = async (row) => {
  if (!row.sysServiceTags) {
    return;
  }
  fetchBindService({
    sysServiceId: row.sysServiceId,
    sysServiceModuleIds: row.sysServiceTags,
  }).then((res) => {});
};
const handleUpdate = async () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      env.loading = true;
      env.form.sysServiceCategory = 1;
      if (env.mode === "edit") {
        return fetchUpdateService(env.form)
          .then((res) => {
            handleUpdateModule(env.form);
            message(t("message.updateSuccess"), { type: "success" });
            emit("success");
            handleClose();
          })
          .finally(() => {
            env.loading = false;
          });
      }
      return fetchSaveService(env.form)
        .then((res) => {
          handleUpdateModule(res.data);
          message(t("message.updateSuccess"), { type: "success" });
          emit("success");
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
    env.title = "新增服务";
    env.form.sysServiceSort = 1;
    return;
  }
  env.title = "服务更新 - " + item.sysServiceName;
};

const loadModule = async (moduleList) => {
  env.moduleList = moduleList;
};

const handleChangeImageType = async (_val) => {
  if (_val == "ONLINE") {
    env.form.sysServiceImage = `https://picsum.photos/id/${getRandomIntBelow(1084)}/300/200`;
  }
};
defineExpose({
  handleOpen,
  loadModule,
  handleClose,
});
</script>
<template>
  <div>
    <sc-dialog
      v-model="env.visible"
      :title="env.title"
      draggable
      :close-on-click-modal="false"
    >
      <ScRow>
        <ScCol :span="env.form.sysServiceImageUploadType == 'URL' ? 0 : 4">
          <div class="flex justify-center items-start h-full">
            <ScUpload
              v-model="env.form.sysServiceImage"
              :cropper="true"
              height="100%"
              :apiObj="fetchUploadFile"
              :data="upload.params"
              @url="
                (it) => {
                  env.form.sysServiceImage = it;
                }
              "
            />
          </div>
        </ScCol>
        <ScCol :span="env.form.sysServiceImageUploadType == 'URL' ? 24 : 20">
          <ScForm
            ref="formRef"
            :model="env.form"
            :rules="rules"
            label-width="120px"
            class="modern-form"
          >
            <ScFormItem label="服务名称" prop="sysServiceName">
              <ScInput
                v-model="env.form.sysServiceName"
                placeholder="请输入服务名称"
                :maxlength="50"
                show-word-limit
              />
            </ScFormItem>

            <ScFormItem label="服务编码" prop="sysServiceCode">
              <ScInput
                v-model="env.form.sysServiceCode"
                placeholder="请输入服务编码"
                :maxlength="50"
                show-word-limit
              />
            </ScFormItem>

            <ScFormItem label="选中模块" prop="sysServiceTags">
              <ScSelect
                v-model="env.form.sysServiceTags"
                :data="env.menuList"
                multiple
              >
                <ScOption
                  v-for="item in env.moduleList"
                  :key="item.sysMenuId"
                  :label="item.sysServiceModuleName"
                  :value="item.sysServiceModuleId"
                >
                  <span style="float: left">{{
                    item.sysServiceModuleName
                  }}</span>
                  <span style="float: right; font-size: 13px; color: #8492a6">{{
                    item.sysServiceModuleCode
                  }}</span>
                </ScOption>
              </ScSelect>
            </ScFormItem>

            <ScFormItem label="到期时间" prop="sysServiceValidTime">
              <ScDatePicker
                v-model="env.form.sysServiceValidTime"
                placeholder="请选择到期时间"
              />
            </ScFormItem>

            <ScFormItem label="是否启用" prop="sysServiceStatus">
              <el-segmented
                v-model="env.form.sysServiceStatus"
                :options="[
                  {
                    label: '启用',
                    value: 0,
                  },
                  {
                    label: '禁用',
                    value: 1,
                  },
                ]"
              />
            </ScFormItem>

            <ScFormItem label="优先级" prop="sysServiceSort">
              <ScInputNumber
                v-model="env.form.sysServiceSort"
                placeholder="请输入编码"
              />
            </ScFormItem>

            <ScFormItem label="封面" prop="sysServiceImage">
              <ScSelect
                v-model="env.form.sysServiceImageUploadType"
                placeholder="请选择上传方式"
                @change="handleChangeImageType"
              >
                <ScOption value="URL" label="远程地址" />
                <ScOption value="UPLOAD" label="上传图片" />
                <ScOption value="ONLINE" label="在线图片" />
              </ScSelect>
            </ScFormItem>

            <ScFormItem
              v-if="env.form.sysServiceImageUploadType == 'URL'"
              label="远程图片"
              prop="sysServiceImage"
            >
              <ScInput
                v-model="env.form.sysServiceImage"
                placeholder="请输入远程图片"
                :maxlength="255"
                show-word-limit
              />
            </ScFormItem>
            <ScFormItem label="版本" prop="sysServiceVersion">
              <ScInput
                v-model="env.form.sysServiceVersion"
                placeholder="请输入版本"
                :maxlength="50"
                show-word-limit
              />
            </ScFormItem>

            <ScFormItem label="描述" prop="sysServiceRemark">
              <ScInput
                v-model="env.form.sysServiceRemark"
                placeholder="请输入描述"
                type="textarea"
                :maxlength="255"
                show-word-limit
              />
            </ScFormItem>
          </ScForm>
        </ScCol>
      </ScRow>
      <template #footer>
        <ScButton @click="handleClose">{{ $t("buttons.cancel") }}</ScButton>
        <ScButton
          type="primary"
          :loading="env.loading"
          @click="handleUpdate"
          >{{ $t("buttons.confirm") }}</el-button
        >
      </template>
    </sc-dialog>
  </div>
</template>

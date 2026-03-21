<script setup>
import { fetchSaveTenant, fetchUpdateTenant } from "@/api/service/tenant";
import { dateFormat, message } from "@repo/utils";
import { defineExpose, shallowRef, reactive, ref } from "vue";

import { useI18n } from "vue-i18n";
const { t } = useI18n();
const formRef = shallowRef();
const serviceFormRef = shallowRef();
const emit = defineEmits(["close"]);
const env = reactive({
  visible: false,
  title: "",
  params: {},
  data: {},
  form: {
    serviceIds: [],
  },
  loading: false,
  mode: "save",
  props: {
    label: "sysMenuTitle",
    value: "sysMenuId",
  },
});
let serviceForm = reactive({});
const rules = {
  sysTenantName: [{ required: true, message: "请输入名称", trigger: "blur" }],
  sysTenantCode: [{ required: true, message: "请输入编码", trigger: "blur" }],
  sysTenantType: [{ required: true, message: "请选择类型", trigger: "blur" }],
  sysTenantUsername: [
    { required: true, message: "请输入用户名", trigger: "blur" },
  ],
  sysTenantPassword: [
    { required: true, message: "请输入密码", trigger: "blur" },
  ],
  sysTenantPhone: [
    { required: true, message: "请输入手机号", trigger: "blur" },
  ],
  sysTenantStatus: [{ required: true, message: "请选择状态", trigger: "blur" }],
  serviceIds: [{ required: true, message: "请选择服务", trigger: "blur" }],
  sysTenantMenuTagsList: [
    { required: true, message: "请选择菜单", trigger: "blur" },
  ],
};
const handleClose = async () => {
  env.visible = false;
  env.form = {};
};

const handleItem = async () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      env.loading = true;
      if (env.form.sysTenantMenuTagsList) {
        env.form.sysTenantMenuTags = env.form.sysTenantMenuTagsList.join(",");
      }
      env.form.sysTenantService = Object.keys(serviceForm).map((it) => {
        return {
          sysServiceId: it,
          sysTenantServiceValidTime: serviceForm[it],
        };
      });
      if (env.mode === "edit") {
        return fetchUpdateTenant(env.form)
          .then((res) => {
            message(t("message.updateSuccess"), { type: "success" });
            emit("success");
            handleClose();
          })
          .finally(() => {
            env.loading = false;
          });
      }
      return fetchSaveTenant(env.form)
        .then((res) => {
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
const handleUpdate = async () => {
  if (serviceFormRef.value) {
    handleItem();
    return;
  }
  handleItem();
};

const handleOpen = async (item, mode) => {
  env.form = item;
  env.mode = mode;
  env.visible = true;
  if (mode == "save") {
    env.title = "新增模块";
    env.form.sysTenantSort = 1;
    env.form.sysTenantMenuTagsList = [];
    return;
  }
  env.title = "模块更新 - " + item.sysTenantName;
  if (env.form.sysTenantService) {
    env.form?.sysTenantService?.forEach((it) => {
      serviceForm[it.sysServiceId] = it.sysTenantServiceValidTime
        ? dateFormat(it.sysTenantServiceValidTime, "yyyy-MM-dd")
        : null;
    });
  }
};

const handleLoadMenuList = async (data) => {
  env.serviceList = data;
};

const getServiceName = (value) => {
  return env.serviceList.filter((it) => it.sysServiceId == ~~value)?.[0]
    ?.sysServiceName;
};

let serviceRules = {};
const handleChangeServiceId = async (val) => {
  serviceRules = {};
  const newValue = {};
  val.forEach((it) => {
    newValue[it] = serviceForm[it];
  });
  serviceForm = reactive({});
  Object.assign(serviceForm, newValue);
  val.forEach((element) => {
    serviceRules["service" + element] = [
      {
        required: true,
        message: `请选择${getServiceName(element)}服务到期时间`,
        trigger: "blur",
      },
    ];
  });
};
defineExpose({
  handleOpen,
  handleLoadMenuList,
  handleClose,
});
</script>
<template>
  <div>
    <sc-dialog
      v-model="env.visible"
      top="10px"
      :title="env.title"
      draggable
      :close-on-click-modal="false"
    >
      <ScRow>
        <ScForm
          ref="formRef"
          :model="env.form"
          :rules="rules"
          label-width="120px"
          class="modern-form"
        >
          <ScRow>
            <ScCol :span="12">
              <ScFormItem label="租户名称" prop="sysTenantName">
                <ScInput
                  v-model="env.form.sysTenantName"
                  placeholder="请输入名称"
                  :maxlength="150"
                  show-word-limit
                />
              </ScFormItem>
            </ScCol>

            <ScCol :span="12">
              <ScFormItem label="租户编码" prop="sysTenantCode">
                <ScInput
                  v-model="env.form.sysTenantCode"
                  placeholder="请输入编码"
                  :maxlength="50"
                  show-word-limit
                />
              </ScFormItem>
            </ScCol>

            <ScCol :span="12">
              <ScFormItem label="负责人账号" prop="sysTenantUsername">
                <ScInput
                  v-model="env.form.sysTenantUsername"
                  placeholder="请输入负责人账号"
                  :maxlength="50"
                  show-word-limit
                />
              </ScFormItem>
            </ScCol>

            <ScCol :span="12">
              <ScFormItem label="负责人密码" prop="sysTenantPassword">
                <ScInput
                  v-model="env.form.sysTenantPassword"
                  placeholder="请输入负责人密码"
                  :maxlength="50"
                  show-word-limit
                  show-password
                  type="password"
                />
              </ScFormItem>
            </ScCol>

            <ScCol :span="24">
              <ScFormItem label="是否启用" prop="sysTenantStatus">
                <el-segmented
                  v-model="env.form.sysTenantStatus"
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
            </ScCol>

            <ScCol :span="24">
              <ScFormItem label="服务" prop="serviceIds">
                <ScSelect
                  v-model="env.form.serviceIds"
                  multiple
                  placeholder="请选择服务"
                  @change="handleChangeServiceId"
                >
                  <ScOption
                    v-for="item in env.serviceList"
                    :key="item.sysServiceId"
                    :disabled="item.sysServiceStatus !== 0"
                    :label="item.sysServiceName"
                    :value="item.sysServiceId"
                  />
                </ScSelect>
              </ScFormItem>

              <ScFormItem v-if="env.form?.serviceIds?.length > 0">
                <ScForm ref="serviceFormRef">
                  <ScFormItem
                    v-for="(item, index) in env.form?.serviceIds"
                    :key="item"
                    :class="{ 'mt-4': index > 0 }"
                    :rules="{
                      required: true,
                      message: '请选择服务',
                      trigger: 'change',
                    }"
                    :prop="'service' + item"
                    :label="getServiceName(item)"
                  >
                    <ScDatePicker
                      v-model="serviceForm[item]"
                      value-format="YYYY-MM-DD"
                      format="YYYY-MM-DD"
                      :placeholder="`请选择${getServiceName(item)}服务时间`"
                    />
                  </ScFormItem>
                </ScForm>
              </ScFormItem>
            </ScCol>

            <ScCol :span="12">
              <ScFormItem label="手机号" prop="sysTenantPhone">
                <ScInput
                  v-model="env.form.sysTenantPhone"
                  placeholder="请输入手机号"
                  :maxlength="150"
                  show-word-limit
                />
              </ScFormItem>
            </ScCol>

            <!-- <ScCol :span="12">
              <ScFormItem label="邮箱" prop="sysTenantEmail">
                <ScInput v-model="env.form.sysTenantEmail" placeholder="请输入邮箱" :maxlength="150" show-word-limit />
              </ScFormItem>
            </ScCol> -->

            <ScCol :span="12">
              <ScFormItem label="公司名称" prop="sysTenantCorporation">
                <ScInput
                  v-model="env.form.sysTenantCorporation"
                  placeholder="请输入公司名称"
                  :maxlength="150"
                  show-word-limit
                />
              </ScFormItem>
            </ScCol>

            <!-- <ScCol :span="12">
              <ScFormItem label="签名" prop="sysTenantSign">
                <ScInput v-model="env.form.sysTenantSign" placeholder="请输入签名" :maxlength="150" show-word-limit />
              </ScFormItem>
            </ScCol> -->

            <ScCol v-if="env.form.sysTenantCorporation" :span="24">
              <ScFormItem label="具体地址" prop="sysTenantAddress">
                <ScInput
                  v-model="env.form.sysTenantAddress"
                  placeholder="具体地址"
                  :maxlength="250"
                  show-word-limit
                  type="textarea"
                  :rows="3"
                />
              </ScFormItem>
            </ScCol>

            <ScCol :span="24">
              <ScFormItem label="优先级" prop="sysTenantSort">
                <ScInputNumber
                  v-model="env.form.sysTenantSort"
                  placeholder="请输入编码"
                />
              </ScFormItem>
            </ScCol>

            <ScCol :span="24">
              <ScFormItem label="系统地址" prop="sysTenantHomeUrl">
                <ScInput
                  v-model="env.form.sysTenantHomeUrl"
                  placeholder="请输入系统地址"
                  :maxlength="250"
                  show-word-limit
                  type="textarea"
                  :rows="3"
                />
              </ScFormItem>
            </ScCol>
            <ScCol :span="24">
              <ScFormItem label="描述" prop="sysTenantRemark">
                <ScInput
                  v-model="env.form.sysTenantRemark"
                  placeholder="请输入描述"
                  :maxlength="250"
                  show-word-limit
                  type="textarea"
                  :rows="3"
                />
              </ScFormItem>
            </ScCol>
          </ScRow>
        </ScForm>
      </ScRow>
      <template #footer>
        <ScButton @click="handleClose">{{ $t("buttons.cancel") }}</ScButton>
        <ScButton
          type="primary"
          :loading="env.loading"
          @click="handleUpdate"
          >{{ $t("buttons.confirm") }}</ScButton
        >
      </template>
    </sc-dialog>
  </div>
</template>
<style scoped>
/* :deep(.el-dialog__body) {
  height: 600px;
  overflow: auto;
} */
</style>

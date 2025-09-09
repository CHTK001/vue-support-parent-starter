<template>
  <div class="fullscreen">
    <el-row v-if="hasAuth">
      <el-col :span="16">
        <el-form :model="form" label-width="200px" class="h-full">
          <el-form-item label="项目" prop="sysProjectId">
            <ScTableSelect
              class="w-full"
              v-model="form.sysProjectId"
              :url="fetchPageProject"
              :columns="env.columns"
              :keywords="{
                label: 'sysProjectName',
                value: 'sysProjectId',
              }"
              :params="params"
              @selectionChange="selectionChange"
              @failure="handleFailure"
            ></ScTableSelect>
          </el-form-item>

          <el-form-item label="smtp主机" prop="sysProjectSmtpHost" placeholder="smtp.163.com">
            <el-input v-model="form.sysProjectSmtpHost" placeholder="请输入smtp主机" />
          </el-form-item>
          <el-form-item label="smtp端口" prop="sysProjectSmtpPort" placeholder="25">
            <el-input v-model="form.sysProjectSmtpPort" placeholder="请输入smtp端口" />
          </el-form-item>
          <el-form-item label="smtp密码" prop="sysProjectSmtpPassword">
            <el-input v-model="form.sysProjectSmtpPassword" placeholder="请输入smtp密码" type="password" show-password />
          </el-form-item>
          <el-form-item label="主体账号" prop="sysProjectSmtpFrom">
            <el-autocomplete v-model="form.sysProjectSmtpFrom" :fetch-suggestions="queryEmail" :trigger-on-focus="false" placeholder="请输入主体账号邮箱" clearable class="w-full" />
          </el-form-item>

          <el-form-item class="justify-start custom-button">
            <el-button class="ml-1" :icon="useRenderIcon('ri:save-2-fill')" type="primary" @click="handleSubmit">
              {{ $t("buttons.update") }}
            </el-button>
          </el-form-item>
        </el-form>
      </el-col>
    </el-row>
    <el-empty v-else></el-empty>
  </div>
</template>
<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { fetchDefaultNameProject, fetchDefaultProject, fetchPageProject, fetchUpdateProject } from "@repo/core";
import { message, queryEmail } from "@repo/utils";
import { defineAsyncComponent,  onMounted, reactive, shallowRef } from "vue";
const ScTableSelect = defineAsyncComponent(() => import("@repo/components/ScTableSelect/index.vue"));
const form = reactive({});
const hasAuth = shallowRef(true);
const type = "YOU_JIAN";
const params = {
  sysProjectDictItemCode: type,
};
const prop = defineProps({
  data: {
    type: Object,
    default: () => {},
  },
});
const env = reactive({
  columns: [
    {
      label: "名称",
      prop: "sysProjectName",
    },
    {
      label: "编码",
      prop: "sysProjectCode",
    },
    {
      label: "AppId",
      prop: "sysProjectAppId",
    },
    {
      label: "密钥",
      prop: "sysProjectAppSecret",
    },
    {
      label: "签名",
      prop: "sysProjectSign",
    },
  ],
});
const handleFailure = async (e) => {
  if ((e.status = 403)) {
    hasAuth.value = false;
  }
};
const initialDefault = async () => {
  const res = await fetchDefaultProject({
    typeName: type,
  });
  Object.assign(form, res.data);
};

const selectionChange = async (value, ids) => {
  Object.assign(form, value);
};
const handleAfterPropertiesSet = async () => {
  initialDefault();
};

const handleSubmit = async () => {
  fetchUpdateProject(form);

  fetchDefaultNameProject({
    sysProjectId: form.sysProjectId,
    sysProjectDefaultTypeName: type,
    sysSetDefault: 1,
  }).then((res) => {
    if (res.code === "00000") {
      message("设置成功", { type: "success" });
    }
  });
};

onMounted(async () => {
  await handleAfterPropertiesSet();
});
</script>
<style lang="scss" scoped>
.setting {
  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 3px 0;
    font-size: 14px;
  }
}
:deep(.custom-button .el-form-item__content) {
  justify-content: end;
}
</style>

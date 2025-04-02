<template>
  <div class="fullscreen">
    <el-row v-if="hasAuth">
      <el-col :span="12">
        <el-form :model="form" label-width="200px" class="h-full">
          <el-form-item label="项目" prop="sysProjectId">
            <ScTableSelect
              class="w-full"
              v-model="form.sysProjectId"
              :url="fetchPageProject"
              :columns="env.columns"
              :params="params"
              :keywords="{
                label: 'sysProjectName',
                value: 'sysProjectId',
              }"
              ref="scTableSelectRef"
              @selectionChange="selectionChange"
              @failure="handleFailure"
            ></ScTableSelect>
          </el-form-item>

          <el-form-item v-if="form.sysProjectId" label="名称" prop="sysProjectName">
            <el-input v-model="form.sysProjectName" readonly disabled></el-input>
          </el-form-item>
          <el-form-item v-if="form.sysProjectId" label="AppId" prop="sysProjectAppId">
            <el-input v-model="form.sysProjectAppId"></el-input>
          </el-form-item>
          <el-form-item v-if="form.sysProjectId" label="密钥" prop="sysProjectAppSecret">
            <el-input type="password" show-password v-model="form.sysProjectAppSecret"> </el-input>
          </el-form-item>
          <el-form-item v-if="form.sysProjectId" label="签名" prop="sysProjectSign">
            <el-input type="password" show-password v-model="form.sysProjectSign"> </el-input>
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
import { message } from "@repo/utils";
import { defineAsyncComponent, defineProps, onMounted, reactive, ref, shallowRef } from "vue";
const ScTableSelect = defineAsyncComponent(() => import("@repo/components/ScTableSelect/index.vue"));
const form = reactive({});
const hasAuth = shallowRef(true);
const type = "DUAN_XIN";
const params = {
  sysProjectDictItemCode: type,
};
const scTableSelectRef = ref(null);
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

const initialDefault = async () => {
  const res = await fetchDefaultProject({
    typeName: type,
  });
  Object.assign(form, res.data);
  scTableSelectRef.value.setValue([form.sysProjectId]);
};

const handleFailure = async (e) => {
  if ((e.status = 403)) {
    hasAuth.value = false;
  }
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

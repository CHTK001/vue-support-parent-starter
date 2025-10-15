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
              ref="scTableSelectRef"
              @selectionChange="selectionChange"
              @failure="handleFailure"
            ></ScTableSelect>
          </el-form-item>

          <el-form-item label="appId" prop="sysProjectAppId">
            <el-input v-model="form.sysProjectAppId" placeholder="请输入appId" />
          </el-form-item>
          <el-form-item label="appSecret" prop="sysProjectAppSecret">
            <el-input v-model="form.sysProjectAppSecret" placeholder="请输入appSecret" type="password" show-password />
          </el-form-item>
          <el-form-item label="token" prop="sysProjectToken">
            <el-input v-model="form.sysProjectToken" placeholder="请输入token" type="password" show-password />
          </el-form-item>
          <el-form-item label="aesKey" prop="sysProjectAesKey">
            <el-input v-model="form.sysProjectAesKey" placeholder="请输入aesKey" type="password" show-password />
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
import { defineAsyncComponent, nextTick, onMounted, reactive, ref, shallowRef, watch } from "vue"; // 添加nextTick和watch
const ScTableSelect = defineAsyncComponent(() => import("@repo/components/ScTableSelect/index.vue"));
const form = reactive({});
const hasAuth = shallowRef(true);
const type = "WEI_XIN";
const params = {
  sysProjectDictItemCode: type,
};
const scTableSelectRef = ref(null); // 添加ref引用
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
      label: "Token",
      prop: "sysProjectToken",
    },
    {
      label: "AesKey",
      prop: "sysProjectAesKey",
    },
  ],
});

// 监听form.sysProjectId的变化，确保在组件加载后设置值
watch(() => form.sysProjectId, (newVal) => {
  if (newVal && scTableSelectRef.value) {
    // 等待下一个tick确保组件已更新
    nextTick(() => {
      // 检查组件是否已加载并具有setValue方法
      if (scTableSelectRef.value && typeof scTableSelectRef.value.setValue === 'function') {
        scTableSelectRef.value.setValue([newVal]);
      }
    });
  }
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
  
  // 等待组件加载完成后再设置值
  if (scTableSelectRef.value) {
    // 使用nextTick确保DOM更新完成
    await nextTick();
    // 检查组件是否已加载并具有setValue方法
    if (scTableSelectRef.value && typeof scTableSelectRef.value.setValue === 'function') {
      scTableSelectRef.value.setValue([form.sysProjectId]);
    }
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
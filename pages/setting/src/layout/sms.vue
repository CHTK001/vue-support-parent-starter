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

          <el-form-item
            v-if="form.sysProjectId"
            label="名称"
            prop="sysProjectName"
          >
            <el-input
              v-model="form.sysProjectName"
              readonly
              disabled
            ></el-input>
          </el-form-item>
          <el-form-item
            v-if="form.sysProjectId"
            label="AppId"
            prop="sysProjectAppId"
          >
            <el-input v-model="form.sysProjectAppId"></el-input>
          </el-form-item>
          <el-form-item
            v-if="form.sysProjectId"
            label="密钥"
            prop="sysProjectAppSecret"
          >
            <el-input
              type="password"
              show-password
              v-model="form.sysProjectAppSecret"
            >
            </el-input>
          </el-form-item>
          <el-form-item
            v-if="form.sysProjectId"
            label="签名"
            prop="sysProjectSign"
          >
            <el-input
              type="password"
              show-password
              v-model="form.sysProjectSign"
            >
            </el-input>
          </el-form-item>

          <el-form-item class="justify-start custom-button">
            <el-button
              class="ml-1"
              :icon="useRenderIcon('ri:save-2-fill')"
              type="primary"
              @click="handleSubmit"
            >
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
import {
  fetchDefaultNameProject,
  fetchDefaultProject,
  fetchPageProject,
  fetchUpdateProject,
} from "@repo/core";
import { message } from "@repo/utils";
import {
  defineAsyncComponent,
  nextTick,
  onMounted,
  reactive,
  ref,
  shallowRef,
  watch,
} from "vue"; // 添加nextTick和watch
const ScTableSelect = defineAsyncComponent(
  () => import("@repo/components/ScTableSelect/index.vue")
);
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

// 监听form.sysProjectId的变化，确保在组件加载后设置值
watch(
  () => form.sysProjectId,
  (newVal) => {
    if (newVal && scTableSelectRef.value) {
      // 等待下一个tick确保组件已更新
      nextTick(() => {
        // 检查组件是否已加载并具有setValue方法
        if (
          scTableSelectRef.value &&
          typeof scTableSelectRef.value.setValue === "function"
        ) {
          scTableSelectRef.value.setValue([newVal]);
        }
      });
    }
  }
);

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
    if (
      scTableSelectRef.value &&
      typeof scTableSelectRef.value.setValue === "function"
    ) {
      scTableSelectRef.value.setValue([form.sysProjectId]);
    }
  }
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
.fullscreen {
  padding: 24px;
  background: linear-gradient(
    135deg,
    var(--el-bg-color) 0%,
    var(--el-fill-color-lighter) 100%
  );
  min-height: 100%;
  border-radius: 12px;
}

:deep(.el-form) {
  padding: 24px;
  background: var(--el-bg-color-overlay);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--el-border-color-lighter);
}

:deep(.el-form-item) {
  margin-bottom: 24px;
  padding: 16px 20px;
  background: var(--el-bg-color);
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 4px 16px rgba(var(--el-color-primary-rgb), 0.1);
    transform: translateY(-2px);
  }

  .el-form-item__label {
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

:deep(.el-input__wrapper),
:deep(.el-select__wrapper) {
  border-radius: 10px;
  transition: all 0.3s ease;

  &:hover,
  &:focus-within {
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.12);
  }
}

.setting {
  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    font-size: 14px;
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      background: var(--el-fill-color-light);
    }
  }
}

:deep(.custom-button) {
  margin-top: 16px;
  padding: 0 !important;
  background: transparent !important;
  border: none !important;

  .el-form-item__content {
    justify-content: end;
  }

  .el-button {
    border-radius: 10px;
    padding: 12px 28px;
    font-weight: 600;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(var(--el-color-primary-rgb), 0.35);
    }
  }
}

:deep(.el-empty) {
  padding: 80px 0;
}
</style>

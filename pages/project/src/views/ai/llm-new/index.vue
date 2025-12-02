<template>
  <div class="llm-container">
    <!-- 保持原有结构，添加新的类名 -->
    <ModuleUpdateDialog
      ref="moduleUpdateDialogRef"
      @success="handleRefreshEnvironment"
    ></ModuleUpdateDialog>
    <ModuleDialog
      ref="moduleDialogRef"
      @success="handleRefreshEnvironment"
    ></ModuleDialog>
    <el-button
      @click="handleOpenModuleManager"
      class="settings-btn"
      circle
      size="large"
      type="primary"
    >
      <IconifyIconOnline icon="ep:setting" />
    </el-button>
    <div class="llm-main-container">
      <div class="chat-main">
        <ChatComponent
          :form="form"
          :env="env"
          :model-list="modelList"
          ref="chatComponentRef"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.llm-container {
  --primary: var(--el-color-primary);
  --primary-dark: var(--el-color-primary-dark-2);
  --primary-light: var(--el-color-primary-light-9);
  --primary-50: rgba(var(--el-color-primary-rgb), 0.05);
  --primary-rgb: var(--el-color-primary-rgb);
  --transition: cubic-bezier(0.4, 0, 0.2, 1);

  @apply h-full relative;
  background: linear-gradient(
    135deg,
    var(--el-bg-color) 0%,
    var(--el-fill-color-lighter) 100%
  );

  .settings-btn {
    @apply fixed right-6 top-1/2 z-[99];
    background: var(--el-color-primary);
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
    transition: all 0.5s var(--transition);
    animation: float 3s ease-in-out infinite;

    &:hover {
      transform: scale(1.1) rotate(15deg);
      background: var(--el-color-primary-dark-2);
      box-shadow: 0 8px 20px rgba(var(--el-color-primary-rgb), 0.3);
      animation: none;
    }
  }

  .llm-main-container {
    @apply h-full;
  }

  .chat-main {
    @apply p-0 relative h-full;
    transition: all 0.4s var(--transition);

    .chat-placeholder {
      @apply flex flex-col items-center justify-center h-full;

      h2 {
        @apply text-2xl font-bold text-gray-700 mb-4;
      }

      p {
        @apply text-gray-500;
      }
    }
  }
}

.dark {
  .llm-container {
    background: linear-gradient(
      135deg,
      var(--el-bg-color) 0%,
      var(--el-fill-color-darker) 100%
    );

    .settings-btn {
      background: var(--el-color-primary);
      box-shadow: 0 4px 20px rgba(var(--el-color-primary-rgb), 0.4);

      &:hover {
        background: var(--el-color-primary-dark-2);
        box-shadow: 0 8px 30px rgba(var(--el-color-primary-rgb), 0.5);
      }
    }

    .chat-main {
      .chat-placeholder {
        h2 {
          @apply text-gray-300;
        }

        p {
          @apply text-gray-400;
        }
      }
    }

    /* 暗色主题样式已移至ControlPanel组件内部 */
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-10px);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--el-color-primary-rgb), 0.4);
  }

  70% {
    box-shadow: 0 0 0 10px rgba(var(--el-color-primary-rgb), 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(var(--el-color-primary-rgb), 0);
  }
}
</style>

<script setup>
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { useUserStoreHook } from "@repo/core";
import { getRandomInt, localStorageProxy } from "@repo/utils";
import {
  computed,
  defineAsyncComponent,
  onMounted,
  reactive,
  shallowRef,
} from "vue";
import { useRoute } from "vue-router";
import { fetchListProjectForAiModule } from "../../../api/manage/project-ai-module";

// 导入新的ChatComponent组件
const ChatComponent = defineAsyncComponent(
  () => import("./module/ChatComponent.vue")
);
const ModuleUpdateDialog = defineAsyncComponent(
  () => import("../module-update.vue")
);
const ModuleDialog = defineAsyncComponent(() => import("../module.vue"));

const form = reactive({
  tokens: 2048,
  topK: 4,
  topP: 0.8,
  seed: 1,
  temperature: 0.5,
  sysAiModuleType: "LLM",
});
const chatComponentRef = shallowRef();
const moduleUpdateDialogRef = shallowRef();
const moduleDialogRef = shallowRef();
const modelList = shallowRef([]);
const env = {};
const rules = {
  model: [{ required: true, message: "请选择模型", trigger: "change" }],
  tokens: [{ required: true, message: "请输入tokens", trigger: "change" }],
  topK: [{ required: true, message: "请输入topK", trigger: "change" }],
  topP: [{ required: true, message: "请输入topP", trigger: "change" }],
  temperature: [
    { required: true, message: "请输入temperature", trigger: "change" },
  ],
};
const route = useRoute();

const handleClickSeed = async () => {
  form.seed = getRandomInt(0, 9999999999);
};

const handleChangeModule = async (value) => {
  const _item = modelList.value.find((it) => it.sysAiModuleCode === value);
  env.sysProjectId = _item.sysProjectId;
  env.sysProjectName = _item.sysProjectName;
  form.sysProjectId = _item.sysProjectId;
  form.sysProjectName = _item.sysProjectName;
  form.sysAiModuleVlm = _item.sysAiModuleVlm;
  localStorageProxy().setItem("ai-chat-selected", value);
};

const handleModule = async (data) => {
  const one = modelList.value.filter((it) => (it.sysAiModuleId = data));
  form.model = one.sysAiModuleCode;
};
const modelSelectLabel = computed(() => {
  return modelList.value.find((it) => it.sysAiModuleCode === form.model);
});
const onAfterProperieSet = () => {
  const _selectedModel = localStorageProxy().getItem("ai-chat-selected");
  form.model = _selectedModel;
  const query = route.query;
  env.sysProjectId = query.sysProjectId;
  env.showEdit = !useUserStoreHook().tenantId;
  env.sysProjectName = query.sysProjectName;
  form.sysProjectId = env.sysProjectId;
  form.sysProjectName = env.sysProjectName;
};

const handleOpenModule = async () => {
  moduleUpdateDialogRef.value.handleOpen(form, "add");
};
const handleOpenModuleManager = async () => {
  moduleDialogRef.value.handleOpen(form, "add");
};
const handleRefreshEnvironment = async () => {
  await initialModuleList();
};

const loadModule = async () => {
  handleRefreshEnvironment();
};
const initialModuleList = async () => {
  const { data } = await fetchListProjectForAiModule(form);
  modelList.value = data;
  if (modelList.value.length == 1) {
    form.model = modelList.value[0].sysAiModuleCode;
  }
  handleChangeModule(form.model);
};

onMounted(async () => {
  onAfterProperieSet();
  initialModuleList();
});
</script>

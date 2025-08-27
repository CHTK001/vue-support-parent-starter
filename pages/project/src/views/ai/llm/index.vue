<template>
  <div class="llm-container">
    <!-- 保持原有结构，添加新的类名 -->
    <ModuleUpdateDialog ref="moduleUpdateDialogRef" @success="handleRefreshEnvironment"></ModuleUpdateDialog>
    <ModuleDialog ref="moduleDialogRef" @success="handleRefreshEnvironment"></ModuleDialog>
    <el-button :icon="useRenderIcon('ep:setting')" @click="handleOpenModuleManager" class="settings-btn" circle
      size="large" type="primary"></el-button>
    <el-container class="llm-main-container">
      <el-main class="chat-main">
        <chat :form="form" :env="env"></chat>
      </el-main>
      <el-aside class="control-panel !h-full" id="aside">
        <div class="panel-header">
          <el-icon :size="35" @click="loadModule" class="action-icon" v-if="settingOpen">
            <component :is="useRenderIcon('mdi:refresh')" />
          </el-icon>
          <el-icon :size="35" @click="handleTrigger" class="action-icon left-[16px]">
            <component :is="useRenderIcon(settingOpen ? 'mdi:menu-open' : 'mdi:menu-close')" />
          </el-icon>
        </div>
        <el-form :model="form" :rules="rules" v-if="settingOpen" class="overflow-auto h-[80%]">
          <el-form-item label="模型" prop="model">
            <div class="flex justify-start w-full">
              <el-select filterable v-model="form.model" placeholder="请选择模型" clearable @change="handleChangeModule">
                <el-option v-for="item in modelList" class="!h-[60px]" :key="item" :label="item.sysAiModuleName"
                  :value="item.sysAiModuleCode">
                  <template #default>
                    <el-tooltip placement="right" :raw-content="true"
                      :content="`<div style='max-width: 300px'>${item.sysAiModuleRemark || item.sysAiModuleName}</div>`">
                      <span class="flex justify-between py-2">
                        <el-image :src="item.sysProjectIcon" fit="scale-down" class="!h-[50px] !w-[50px] option-item">
                          <template #error>
                            <img :src="Error" />
                          </template>
                        </el-image>
                        <span class="justify-start content-center pl-1">{{ item.sysAiModuleName }}</span>
                        <span class="el-form-item-msg content-center">{{ item.sysProjectName }}</span>
                      </span>
                    </el-tooltip>
                  </template>
                </el-option>
                <template #label="{ label }">
                  <div class="flex justify-start">
                    <el-image class="!h-[24px] !w-[24px]" :src="modelSelectLabel?.sysProjectIcon" />
                    <span class="pl-2">{{ label }}</span>
                  </div>
                </template>
              </el-select>
              <el-button v-if="env.showEdit" circle class="ml-1 btn-text" :icon="useRenderIcon('ep:plus')"
                @click="handleOpenModule"></el-button>
            </div>
          </el-form-item>
          <el-form-item label="角色设定" prop="system" v-if="showRoleSetting">
            <el-input :rows="10" type="textarea" placeholder="此处需要填写的是大模型的角色属性，示例：你是一个专业的商业文案专家"
              v-model="form.system"></el-input>
          </el-form-item>

          <el-form-item prop="tokens">
            <div>max_tokens（回复长度限制）</div>
            <div class="flex justify-start w-full">
              <el-slider :min="1" :max="8192" v-model="form.tokens"></el-slider>
              <el-input-number :min="1" :max="8192" v-model="form.tokens"></el-input-number>
            </div>
            <span class="el-form-item-msg">单位为tokens，1tokens 约等于1.5个中文汉字或者 0.8个英文单词</span>
          </el-form-item>

          <el-form-item prop="topK">
            <div>top-k（灵活度）</div>
            <div class="flex justify-start w-full">
              <el-slider :min="1" :max="16" v-model="form.topK"></el-slider>
              <el-input-number :min="1" :max="16" v-model="form.topK"></el-input-number>
            </div>
            <span class="el-form-item-msg">平衡生成文本的质量和多样性，较小的 k 值会减少随机性，使得输出更加稳定；而较大的 k 值会增加随机性，产生更多新颖的输出。取值范围[1,
              6]，默认为4</span>
          </el-form-item>

          <el-form-item prop="temperature">
            <div>temperature（随机性）</div>
            <div class="flex justify-start w-full">
              <el-slider :min="0.1" :max="1" v-model="form.temperature" :step="0.1"></el-slider>
              <el-input-number :min="0.1" :max="1" v-model="form.temperature" :step="0.1"></el-input-number>
            </div>
            <span class="el-form-item-msg">核采样阈值，用于决定结果随机性，取值越高随机性越强，即相同的问题得到的不同答案的可能性越高。取值范围 (0，1]，默认为0.5</span>
          </el-form-item>

          <el-form-item prop="temperature">
            <div>
              seed <span class="el-form-item-msg">{{ form.seed }}</span>
            </div>
            <div class="flex justify-start w-full gap-1">
              <el-button circle :icon="useRenderIcon('ep:refresh')" @click="handleClickSeed"></el-button>
            </div>
          </el-form-item>

          <el-form-item prop="topP">
            <div>top-p（选择数量）</div>
            <div class="flex justify-start w-full">
              <el-slider :min="0.1" :max="1" :step="0.1" v-model="form.topP"></el-slider>
              <el-input-number :min="0.1" :step="0.1" :max="1" v-model="form.topP"></el-input-number>
            </div>
            <span class="el-form-item-msg">top_p用于根据累积概率动态调整每个预测标记的选择数量。</span>
          </el-form-item>
        </el-form>
      </el-aside>
    </el-container>
  </div>
</template>

<style scoped lang="scss">
.llm-container {
  --primary: #7c3aed;
  --primary-dark: #6d28d9;
  --primary-light: #ede9fe;
  --primary-50: rgba(124, 58, 237, 0.05);
  --primary-rgb: 124, 58, 237;
  --transition: cubic-bezier(0.4, 0, 0.2, 1);

  @apply h-full relative;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);

  .settings-btn {
    @apply fixed right-6 top-1/2 z-[99];
    background: var(--primary);
    box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);
    transition: all 0.5s var(--transition);
    animation: float 3s ease-in-out infinite;

    &:hover {
      transform: scale(1.1) rotate(15deg);
      background: var(--primary-dark);
      box-shadow: 0 8px 20px rgba(124, 58, 237, 0.3);
      animation: none;
    }
  }

  .chat-main {
    @apply p-0 relative;
    transition: all 0.4s var(--transition);
  }

  .control-panel {
    @apply bg-white/90 backdrop-blur-xl p-6 overflow-hidden;
    border-left: 1px solid rgba(0, 0, 0, 0.05);
    width: var(--aside-width);
    transition: all 0.5s var(--transition);
    box-shadow: -4px 0 20px rgba(0, 0, 0, 0.03);

    &:hover {
      @apply bg-white/95;
    }

    .panel-header {
      @apply flex justify-end items-center gap-3 mb-6;

      .action-icon {
        @apply cursor-pointer p-2 rounded-full hover:bg-gray-100;
        transition: all 0.3s var(--transition);

        &:hover {
          @apply text-primary;
          transform: scale(1.1);
        }
      }
    }

    :deep(.el-form) {
      @apply overflow-y-auto pr-2;
      max-height: calc(100vh - 240px);

      /* 隐藏滚动条但保留功能 */
      scrollbar-width: none;
      -ms-overflow-style: none;

      &::-webkit-scrollbar {
        width: 0;
        display: none;
      }

      .el-form-item {
        @apply mb-8;
        animation: fadeIn 0.5s ease-out;
        animation-fill-mode: both;

        @for $i from 1 through 10 {
          &:nth-child(#{$i}) {
            animation-delay: #{$i * 0.05}s;
          }
        }

        .el-form-item__label {
          @apply font-medium text-gray-700 mb-2;
          transition: color 0.3s ease;
        }

        .el-select {
          .el-input__wrapper {
            @apply rounded-xl border border-gray-200 bg-white/50;
            backdrop-filter: blur(8px);
            box-shadow: none !important;
            transition: all 0.3s var(--transition);

            &:hover,
            &.is-focus {
              @apply border-primary bg-white;
              transform: translateY(-2px);
              box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.1) !important;
            }
          }
        }

        .el-input__wrapper {
          @apply rounded-xl bg-white/50;
          backdrop-filter: blur(8px);
          box-shadow: none !important;
          transition: all 0.3s var(--transition);

          &:hover,
          &:focus-within {
            @apply bg-white;
            transform: translateY(-2px);
            box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.1) !important;
          }
        }

        .el-slider {
          @apply flex-1 mr-4 px-3;

          :deep(.el-slider__runway) {
            @apply bg-gray-200;
            height: 6px;
            border-radius: 6px;
          }

          :deep(.el-slider__bar) {
            height: 6px;
            border-radius: 6px;
            background: linear-gradient(90deg, var(--primary-light), var(--primary));
          }

          :deep(.el-slider__button) {
            @apply border-2 bg-white;
            border-color: var(--primary);
            box-shadow: 0 2px 8px rgba(124, 58, 237, 0.2);
            transition: all 0.2s var(--transition);

            &:hover {
              transform: scale(1.2);
              box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
            }
          }
        }

        .el-input-number {
          .el-input__wrapper {
            @apply rounded-xl;
          }

          :deep(.el-input-number__decrease),
          :deep(.el-input-number__increase) {
            @apply bg-transparent border-0;
            transition: all 0.2s var(--transition);

            &:hover {
              @apply text-primary;
              transform: scale(1.1);
            }
          }
        }

        .option-item {
          @apply rounded-xl shadow-sm;
          transition: all 0.3s var(--transition);

          &:hover {
            transform: scale(1.02) translateX(4px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          }
        }

        .btn-text {
          @apply bg-primary text-white rounded-xl;
          transition: all 0.3s var(--transition);

          &:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2);
          }
        }
      }

      .el-form-item-msg {
        @apply text-gray-500 text-sm mt-2 leading-relaxed;
        transition: all 0.3s ease;
      }
    }
  }
}

.dark {
  .llm-container {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);

    .settings-btn {
      @apply bg-indigo-500;
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);

      &:hover {
        @apply bg-indigo-600;
        box-shadow: 0 8px 30px rgba(99, 102, 241, 0.5);
      }
    }

    .control-panel {
      @apply bg-gray-900/70 border-gray-700/50;
      backdrop-filter: blur(20px);
      box-shadow: -4px 0 30px rgba(0, 0, 0, 0.2);

      &:hover {
        @apply bg-gray-900/80;
      }

      .panel-header .action-icon {
        @apply text-gray-400 hover:bg-gray-800/80;

        &:hover {
          @apply text-indigo-400;
        }
      }

      :deep(.el-form) {
        .el-form-item {
          .el-form-item__label {
            @apply text-gray-300;
          }

          .el-select .el-input__wrapper,
          .el-input__wrapper {
            @apply bg-gray-800/50 border-gray-700 text-gray-200;

            &:hover,
            &:focus-within {
              @apply bg-gray-800 border-indigo-400;
              box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15) !important;
            }
          }

          .el-slider {
            :deep(.el-slider__runway) {
              @apply bg-gray-700;
            }

            :deep(.el-slider__bar) {
              background: linear-gradient(90deg, #4f46e5, #7c3aed);
            }

            :deep(.el-slider__button) {
              @apply bg-gray-800 border-indigo-400;
              box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);

              &:hover {
                @apply bg-gray-900;
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
              }
            }
          }

          .el-input-number {

            :deep(.el-input-number__decrease),
            :deep(.el-input-number__increase) {
              @apply text-gray-400;

              &:hover {
                @apply text-indigo-400;
              }
            }
          }

          .option-item {
            @apply bg-gray-800/80 shadow-lg;

            &:hover {
              @apply bg-gray-800;
              box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
            }
          }

          .btn-text {
            @apply bg-indigo-600 hover:bg-indigo-700;

            &:hover {
              box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
            }
          }
        }

        .el-form-item-msg {
          @apply text-gray-400;
        }
      }
    }
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
    box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.4);
  }

  70% {
    box-shadow: 0 0 0 10px rgba(124, 58, 237, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(124, 58, 237, 0);
  }
}
</style>
<script setup>
import { fetchListProjectForAiModule } from "@/api/manage/project-ai-module";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { useUserStoreHook } from "@repo/core";
import { getRandomInt, localStorageProxy } from "@repo/utils";
import { reactive, nextTick, defineAsyncComponent, onMounted, shallowRef, computed } from "vue";
import { useRoute } from "vue-router";
import Error from "@repo/assets/images/error.png";

const chat = defineAsyncComponent(() => import("./chat.vue"));
const ModuleUpdateDialog = defineAsyncComponent(() => import("../module-update.vue"));
const ModuleDialog = defineAsyncComponent(() => import("../module.vue"));
const settingOpen = shallowRef(false);
const form = reactive({
  tokens: 2048,
  topK: 4,
  seed: 1,
  temperature: 0.5,
  sysAiModuleType: "LLM",
});
const moduleUpdateDialogRef = shallowRef();
const moduleDialogRef = shallowRef();
const modelList = shallowRef([]);
const env = {};
const rules = {
  model: [{ required: true, message: "请选择模型", trigger: "change" }],
  tokens: [{ required: true, message: "请输入tokens", trigger: "change" }],
  topK: [{ required: true, message: "请输入topK", trigger: "change" }],
  temperature: [{ required: true, message: "请输入temperature", trigger: "change" }],
};
const route = useRoute();

const handleClickSeed = async () => {
  form.seed = getRandomInt(0, 9999999999);
};
const showRoleSetting = computed(() => {
  const item = modelList.value.filter((it) => (it.sysAiModuleId = form.model));
  return item ? item?.[0]?.sysAiModuleRoleSetting : 0;
});

const handleChangeModule = async (value) => {
  const _item = modelList.value.find((it) => it.sysAiModuleCode === value);
  env.sysProjectId = _item.sysProjectId;
  env.sysProjectName = _item.sysProjectName;
  form.sysProjectId = _item.sysProjectId;
  form.sysProjectName = _item.sysProjectName;
  form.sysAiModuleVlm = _item.sysAiModuleVlm;
  localStorageProxy().setItem("ai-chat-selected", value);
};
const handleTrigger = async () => {
  settingOpen.value = !settingOpen.value;
  window.aside.style.setProperty("--aside-width", settingOpen.value ? "400px" : "55px");
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
  handleTrigger();
});
</script>

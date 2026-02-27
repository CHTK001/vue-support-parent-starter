<template>
  <div class="w-96 max-h-[80vh] rounded-lg shadow-lg border  overflow-hidden ">
    <div class="flex items-center justify-between p-4 bg-gradient-to-r">
      <div class="flex items-center gap-2">
        <IconifyIconOnline icon="mdi:tune-variant" class="text-lg" />
        <span class="font-semibold">模型配置</span>
      </div>
    </div>

    <div class="max-h-[calc(80vh-64px)] p-4 overflow-y-auto">
      <ScForm :model="form" :rules="rules" class="space-y-6">
        <!-- 模型选择 -->
        <div class="mb-6">
          <div class="flex items-center gap-2 mb-3 text-gray-700 font-medium dark:text-gray-300">
            <IconifyIconOnline icon="mdi:robot" class="text-purple-500" />
            <span>AI 模型</span>
          </div>
          <ScFormItem prop="model">
            <div class="flex gap-2">
              <ScSelect filterable v-model="form.model" placeholder="选择 AI 模型" clearable @change="$emit('change-module', $event)" class="flex-1">
                <ScOption v-for="item in modelList" class="" :key="item.sysAiModuleCode" :label="item.sysAiModuleName" :value="item.sysAiModuleCode">
                  <template #default>
                    <ScTooltip placement="right" :raw-content="true" :content="`<div style='max-width: 300px'>${item.sysAiModuleRemark || item.sysAiModuleName}</div>`">
                      <div class="flex items-center gap-3 p-2">
                        <div class="w-8 h-8 rounded-full overflow-hidden">
                          <ScImage :src="item.sysProjectIcon" fit="cover" class="w-full h-full">
                            <template #error>
                              <div class="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                <IconifyIconOnline icon="mdi:robot" />
                              </div>
                            </template>
                          </ScImage>
                        </div>
                        <div class="flex-1">
                          <div class="font-medium text-gray-900 dark:text-gray-100">{{ item.sysAiModuleName }}</div>
                          <div class="text-sm text-gray-500 dark:text-gray-400">{{ item.sysProjectName }}</div>
                        </div>
                      </div>
                    </ScTooltip>
                  </template>
                </ScOption>
                <template #label="{ label }">
                  <div class="flex items-center gap-2">
                    <ScImage class="w-5 h-5 rounded-full" :src="modelSelectLabel?.sysProjectIcon" fit="cover">
                      <template #error>
                        <IconifyIconOnline icon="mdi:robot" />
                      </template>
                    </ScImage>
                    <span>{{ label }}</span>
                  </div>
                </template>
              </ScSelect>
              <ScButton v-if="env.showEdit" circle class="bg-purple-500 hover:bg-purple-600" @click="$emit('open-module')" type="primary">
                <IconifyIconOnline icon="ep:plus" />
              </ScButton>
            </div>
          </ScFormItem>
        </div>

        <!-- 角色设定 -->
        <div class="mb-6" v-if="showRoleSetting">
          <div class="flex items-center gap-2 mb-3 text-gray-700 font-medium dark:text-gray-300">
            <IconifyIconOnline icon="mdi:account-tie" class="text-purple-500" />
            <span>角色设定</span>
          </div>
          <ScFormItem prop="system">
            <ScInput :rows="6" type="textarea" placeholder="定义 AI 的角色和行为特征，例如：你是一个专业的商业文案专家，擅长创作吸引人的营销内容..." v-model="form.system" class="" />
          </ScFormItem>
        </div>

        <!-- 参数配置 -->
        <div class="mb-6">
          <div class="flex items-center gap-2 mb-3 text-gray-700 font-medium dark:text-gray-300">
            <IconifyIconOnline icon="mdi:tune" class="text-purple-500" />
            <span>参数调优</span>
          </div>

          <!-- Max Tokens -->
          <div class="mb-4" v-if="form.tokens">
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium text-gray-700 dark:text-gray-300">回复长度</span>
              <span class="text-purple-600 font-mono">{{ form?.tokens }}</span>
            </div>
            <div class="flex items-center gap-3">
              <ScSlider :min="1" :max="8192" v-model="form.tokens" class="flex-1" />
              <ScInputNumber :min="1" :max="8192" v-model="form.tokens" class="w-20" :controls="false" />
            </div>
            <div class="text-sm text-gray-500 mt-1 dark:text-gray-400">控制 AI 回复的最大长度，1 token ≈ 1.5 个中文字符</div>
          </div>

          <!-- Temperature -->
          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium text-gray-700 dark:text-gray-300">创造性</span>
              <span class="text-purple-600 font-mono">{{ form.temperature }}</span>
            </div>
            <div class="flex items-center gap-3">
              <ScSlider :min="0.1" :max="1" v-model="form.temperature" :step="0.1" class="flex-1" />
              <ScInputNumber :min="0.1" :max="1" v-model="form.temperature" :step="0.1" class="w-20" :controls="false" />
            </div>
            <div class="text-sm text-gray-500 mt-1 dark:text-gray-400">值越高回复越有创意，值越低回复越稳定</div>
          </div>

          <!-- Top-K -->
          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium text-gray-700 dark:text-gray-300">多样性</span>
              <span class="text-purple-600 font-mono">{{ form.topK }}</span>
            </div>
            <div class="flex items-center gap-3">
              <ScSlider :min="1" :max="16" v-model="form.topK" class="flex-1" />
              <ScInputNumber :min="1" :max="16" v-model="form.topK" class="w-20" :controls="false" />
            </div>
            <div class="text-sm text-gray-500 mt-1 dark:text-gray-400">控制词汇选择的多样性，影响回复的丰富程度</div>
          </div>

          <!-- Top-P -->
          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium text-gray-700 dark:text-gray-300">核心采样</span>
              <span class="text-purple-600 font-mono">{{ form.topP }}</span>
            </div>
            <div class="flex items-center gap-3">
              <ScSlider :min="0.1" :max="1" :step="0.1" v-model="form.topP" class="flex-1" />
              <ScInputNumber :min="0.1" :step="0.1" :max="1" v-model="form.topP" class="w-20" :controls="false" />
            </div>
            <div class="text-sm text-gray-500 mt-1 dark:text-gray-400">动态调整词汇选择范围，平衡质量与多样性</div>
          </div>

          <!-- Seed -->
          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium text-gray-700 dark:text-gray-300">随机种子</span>
              <span class="text-purple-600 font-mono text-xs">{{ form.seed }}</span>
            </div>
            <div class="flex flex-col items-start gap-2">
              <ScButton circle @click="$emit('click-seed')" class="bg-purple-500 hover:bg-purple-600" type="primary">
                <IconifyIconOnline icon="ep:refresh" />
              </ScButton>
              <div class="text-sm text-gray-500 dark:text-gray-400">点击生成新的随机种子</div>
            </div>
          </div>
        </div>
      </ScForm>
    </div>
  </div>
</template>

<script setup>
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { computed } from "vue";
import { ScSlider } from "@repo/components";

// Props
const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
  rules: {
    type: Object,
    required: true,
  },
  modelList: {
    type: Array,
    default: () => [],
  },
  env: {
    type: Object,
    default: () => ({}),
  },
  showRoleSetting: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(["refresh", "change-module", "open-module", "click-seed", "close"]);

// Computed
const modelSelectLabel = computed(() => {
  return props.modelList.find((item) => item.sysAiModuleCode === props.form.model);
});
</script>

<style scoped lang="scss">
.model-config-panel {
  width: 600px;
  max-height: 80vh;
}

.panel-content {
  max-height: calc(80vh - 64px);
}

.modern-select {
  :deep(.el-select__wrapper) {
    border-color: var(--el-border-color);
    border-radius: 0.5rem;
  }
}

.modern-textarea {
  :deep(.el-textarea__inner) {
    border-color: var(--el-border-color);
    border-radius: 0.5rem;
  }
}

.modern-slider {
  :deep(.el-slider__runway) {
    background: var(--el-bg-color-overlay);
  }

  :deep(.el-slider__bar) {
    background-color: #8b5cf6;
  }

  :deep(.el-slider__button) {
    border-color: #8b5cf6;
  }
}

.modern-number {
  :deep(.el-input__wrapper) {
    border-color: var(--el-border-color);
    border-radius: 0.25rem;
  }
}

.dark {
  .modern-select {
    :deep(.el-select__wrapper) {
      border-color: var(--el-border-color);
      background: var(--el-bg-color-overlay);
    }
  }

  .modern-textarea {
    :deep(.el-textarea__inner) {
      border-color: var(--el-border-color);
      background: var(--el-bg-color-overlay);
      color: var(--el-text-color-primary);
    }
  }

  .modern-slider {
    :deep(.el-slider__runway) {
      background: var(--el-bg-color-overlay);
    }
  }

  .modern-number {
    :deep(.el-input__wrapper) {
      border-color: var(--el-border-color);
      background: var(--el-bg-color-overlay);
    }
  }
}
</style>

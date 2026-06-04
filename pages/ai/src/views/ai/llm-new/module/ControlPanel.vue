<template>
  <div class="control-panel-wrapper">
    <div class="panel-header">
      <div class="header-title" v-if="settingOpen">
        <IconifyIconOnline icon="mdi:tune-variant" class="title-icon" />
        <span class="title-text">模型配置</span>
      </div>
      <div class="header-actions">
        <IconifyIconOnline
          @click="$emit('refresh')"
          class="cursor-pointer"
          v-if="settingOpen"
          icon="mdi:refresh"
        />
        <IconifyIconOnline
          @click="handleToggle"
          class="cursor-pointer"
          :icon="settingOpen ? 'ep:d-arrow-right' : 'ep:d-arrow-left'"
        />
      </div>
    </div>

    <div class="panel-content" v-show="settingOpen">
      <ScForm :model="form" :rules="rules" class="modern-form">
        <!-- 模型选择 -->
        <div class="form-section">
          <div class="section-title">
            <IconifyIconOnline icon="mdi:robot" class="section-icon" />
            <span>AI 模型</span>
          </div>
          <ScFormItem prop="model">
            <div class="model-selector">
              <ScSelect
                v-model="form.model"
                :options="modelOptions"
                layout="list"
                :list-borde="true"
                :list-select-button="true"
                list-select-icon="ri:cpu-line"
                :list-select-show-value="true"
                list-height="430px"
                :list-show-search="false"
                :list-show-batch-actions="false"
                @change="$emit('change-module', $event)"
                class="modern-select model-select-list-sc"
              </ScSelect>
              <ScButton
                v-if="env.showEdit"
                circle
                class="add-model-btn"
                @click="$emit('open-module')"
                type="primary"
              >
                <IconifyIconOnline icon="ep:plus" />
              </ScButton>
            </div>
          </ScFormItem>
        </div>

        <!-- 角色设定 -->
        <div class="form-section" v-if="showRoleSetting">
          <div class="section-title">
            <IconifyIconOnline icon="mdi:account-tie" class="section-icon" />
            <span>角色设定</span>
          </div>
          <ScFormItem prop="system">
            <ScInput
              :rows="6"
              type="textarea"
              placeholder="定义 AI 的角色和行为特征，例如：你是一个专业的商业文案专家，擅长创作吸引人的营销内容..."
              v-model="form.system"
              class="modern-textarea"
            />
          </ScFormItem>
        </div>

        <!-- 参数配置 -->
        <div class="form-section">
          <div class="section-title">
            <IconifyIconOnline icon="mdi:tune" class="section-icon" />
            <span>参数调优</span>
          </div>

          <!-- Max Tokens -->
          <div class="param-item">
            <div class="param-header">
              <span class="param-name">回复长度</span>
              <span class="param-value">{{ form.tokens }}</span>
            </div>
            <div class="param-control">
              <ScSlider
                :min="1"
                :max="8192"
                v-model="form.tokens"
                class="modern-slider"
              />
              <ScInputNumber
                :min="1"
                :max="8192"
                v-model="form.tokens"
                class="modern-number"
                :controls="false"
              />
            </div>
            <div class="param-desc">
              控制 AI 回复的最大长度，1 token ≈ 1.5 个中文字符
            </div>
          </div>

          <!-- Temperature -->
          <div class="param-item">
            <div class="param-header">
              <span class="param-name">创造性</span>
              <span class="param-value">{{ form.temperature }}</span>
            </div>
            <div class="param-control">
              <ScSlider
                :min="0.1"
                :max="1"
                v-model="form.temperature"
                :step="0.1"
                class="modern-slider"
              />
              <ScInputNumber
                :min="0.1"
                :max="1"
                v-model="form.temperature"
                :step="0.1"
                class="modern-number"
                :controls="false"
              />
            </div>
            <div class="param-desc">值越高回复越有创意，值越低回复越稳定</div>
          </div>

          <!-- Top-K -->
          <div class="param-item">
            <div class="param-header">
              <span class="param-name">多样性</span>
              <span class="param-value">{{ form.topK }}</span>
            </div>
            <div class="param-control">
              <ScSlider
                :min="1"
                :max="16"
                v-model="form.topK"
                class="modern-slider"
              />
              <ScInputNumber
                :min="1"
                :max="16"
                v-model="form.topK"
                class="modern-number"
                :controls="false"
              />
            </div>
            <div class="param-desc">
              控制词汇选择的多样性，影响回复的丰富程度
            </div>
          </div>

          <!-- Top-P -->
          <div class="param-item">
            <div class="param-header">
              <span class="param-name">核心采样</span>
              <span class="param-value">{{ form.topP }}</span>
            </div>
            <div class="param-control">
              <ScSlider
                :min="0.1"
                :max="1"
                :step="0.1"
                v-model="form.topP"
                class="modern-slider"
              />
              <ScInputNumber
                :min="0.1"
                :step="0.1"
                :max="1"
                v-model="form.topP"
                class="modern-number"
                :controls="false"
              />
            </div>
            <div class="param-desc">动态调整词汇选择范围，平衡质量与多样性</div>
          </div>

          <!-- Seed -->
          <div class="param-item">
            <div class="param-header">
              <span class="param-name">随机种子</span>
              <span class="param-value seed-value">{{ form.seed }}</span>
            </div>
            <div class="param-control seed-control">
              <ScButton
                circle
                @click="$emit('click-seed')"
                class="seed-refresh-btn"
                type="primary"
              >
                <IconifyIconOnline icon="ep:refresh" />
              </ScButton>
              <div class="seed-desc">点击生成新的随机种子</div>
            </div>
          </div>
        </div>
      </ScForm>
    </div>
  </div>
</template>

<script setup>
import { ScButton } from "@repo/components/ScButton";
import { ScForm } from "@repo/components/ScForm";
import { ScFormItem } from "@repo/components/ScFormItem";
import { ScInput } from "@repo/components/ScInput";
import { ScInputNumber } from "@repo/components/ScInputNumber";
import { ScSelect } from "@repo/components/ScSelect";
import { ScSlider } from "@repo/components/ScSlider";
import { computed, ref, watch } from "vue";

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
  isOpen: {
    type: Boolean,
    default: true,
  },
});

// Emits
const emit = defineEmits([
  "refresh",
  "change-module",
  "open-module",
  "click-seed",
  "toggle",
]);

// State
const settingOpen = ref(props.isOpen);

// Watch for prop changes
watch(
  () => props.isOpen,
  (newValue) => {
    settingOpen.value = newValue;
  },
);

// Computed
const modelSelectLabel = computed(() => {
  return props.modelList.find(
    (item) => item.sysAiModuleCode === props.form.model,
  );
});

const modelOptions = computed(() => {
  return (props.modelList || []).map((item) => ({
    label: item.sysAiModuleName,
    value: item.sysAiModuleCode,
    icon: item.sysProjectIcon,
    description: item.sysAiModuleRemark || "暂无说明",
  }));
});

// Methods
const handleToggle = () => {
  settingOpen.value = !settingOpen.value;
  emit("toggle", settingOpen.value);
};
</script>

<style scoped lang="scss">
.control-panel-wrapper {
  --transition: cubic-bezier(0.4, 0, 0.2, 1);

  height: 100%;
  background-color: var(--el-bg-color);
  overflow: hidden;
  border-left: 1px solid var(--el-border-color-light);
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.06);
  transition: all 0.4s var(--transition);

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
    border-bottom: 1px solid var(--el-border-color-light);
    background-color: var(--el-bg-color-overlay);

    .header-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .title-icon {
        font-size: 1.5rem;
        line-height: 2rem;
        color: var(--el-color-primary);
      }

      .title-text {
        font-size: 1.125rem;
        line-height: 1.75rem;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .action-icon {
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 0.75rem;
        transition: all 0.3s ease;
        background: var(--el-bg-color-overlay);
        border: 1px solid var(--el-border-color);

        &:hover {
          color: var(--el-color-primary);
          transform: scale(1.1) translateY(-2px);
          background: var(--el-bg-color);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        &.refresh-icon:hover {
          animation: spin 0.6s ease-in-out;
        }
      }
    }
  }

  .panel-content {
    flex: 1;
    overflow: hidden;

    .modern-form {
      height: 100%;
      overflow-y: auto;
      padding: 1.5rem;
      & > * + * {
        margin-top: 2rem;
      }

      /* 自定义滚动条 */
      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-track {
        background-color: var(--el-border-color-extra-light);
        border-radius: 9999px;
      }

      &::-webkit-scrollbar-thumb {
        background-color: var(--el-border-color);
        border-radius: 9999px;
        transition: background-color 0.3s ease;

        &:hover {
          background-color: var(--el-text-color-secondary);
        }
      }
    }
  }

  .form-section {
    & > * + * {
      margin-top: 1rem;
    }
    animation: slideInUp 0.6s ease-out;

    .section-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.5rem;

      .section-icon {
        font-size: 1.25rem;
        line-height: 1.75rem;
        color: var(--el-color-primary);
      }

      span {
        font-size: 1rem;
        line-height: 1.5rem;
        font-weight: 600;
        color: var(--el-text-color-primary);
        position: relative;

        &::after {
          content: "";
          position: absolute;
          bottom: -0.25rem;
          left: 0;
          width: 0;
          height: 0.125rem;
          background-color: var(--el-color-primary);
          transition: width 0.3s ease;
        }
      }
    }

    &:hover .section-title span::after {
      width: 100%;
    }
  }

  .model-selector {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .modern-select {
      flex: 1;

      :deep(.el-input__wrapper) {
        border-radius: 1rem;
        border: 2px solid var(--el-border-color);
        background-color: var(--el-bg-color);
        transition: all 0.3s var(--transition);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

        &:hover {
          border-color: var(--el-color-primary);
          background-color: var(--el-bg-color-overlay);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        }

        &.is-focus {
          border-color: var(--el-color-primary);
          background-color: var(--el-bg-color-overlay);
          box-shadow:
            0 0 0 4px rgba(0, 0, 0, 0.06),
            0 8px 24px rgba(0, 0, 0, 0.08);
        }
      }
    }

    .add-model-btn {
      border-radius: 1rem;
      background-color: var(--el-color-primary);
      transition: all 0.3s var(--transition);
    }
  }

  .option-content {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;

    .option-avatar {
      position: relative;

      .avatar-image {
        width: 3rem;
        height: 3rem;
        border-radius: 0.75rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
      }

      .avatar-fallback {
        width: 3rem;
        height: 3rem;
        border-radius: 0.75rem;
        background-color: var(--el-color-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--el-text-color-primary);
        font-size: 1.25rem;
        line-height: 1.75rem;
      }
    }

    .option-info {
      flex: 1;

      .option-name {
        font-weight: 500;
        color: var(--el-text-color-primary);
        font-size: 0.875rem;
        line-height: 1.25rem;
      }

      .option-project {
        font-size: 0.75rem;
        line-height: 1rem;
        color: var(--el-text-color-secondary);
        margin-top: 0.25rem;
      }
    }

    &:hover {
      .avatar-image {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
    }
  }

  .selected-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .label-avatar {
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 0.5rem;
    }

    .label-text {
      font-weight: 500;
    }
  }

  .modern-textarea {
    :deep(.el-textarea__inner) {
      border-radius: 1rem;
      border: 2px solid var(--el-border-color);
      background-color: var(--el-bg-color);
      resize: none;
      transition: all 0.3s var(--transition);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

      &:hover {
        border-color: var(--el-color-primary);
        background-color: var(--el-bg-color-overlay);
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      }

      &:focus {
        border-color: var(--el-color-primary);
        background-color: var(--el-bg-color-overlay);
        box-shadow:
          0 0 0 4px rgba(0, 0, 0, 0.06),
          0 8px 24px rgba(0, 0, 0, 0.08);
      }
    }
  }

  .param-item {
    padding: 1.25rem;
    border-radius: 1rem;
    background-color: var(--el-bg-color-overlay);
    border: 1px solid var(--el-border-color-light);
    transition: all 0.3s var(--transition);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      border-color: var(--el-color-primary);
    }

    .param-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;

      .param-name {
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .param-value {
        padding: 0.25rem 0.75rem;
        border-radius: 0.75rem;
        background-color: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
        font-family:
          ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono",
          Menlo, monospace;
        font-size: 0.875rem;
        line-height: 1.25rem;

        &.seed-value {
          font-family:
            ui-monospace, SFMono-Regular, "SF Mono", Consolas,
            "Liberation Mono", Menlo, monospace;
          font-size: 0.75rem;
          line-height: 1rem;
        }
      }
    }

    .param-control {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.75rem;

      &.seed-control {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }

      .modern-slider {
        flex: 1;

        :deep(.el-slider__runway) {
          background-color: var(--el-border-color);
          height: 0.5rem;
          border-radius: 9999px;
        }

        :deep(.el-slider__bar) {
          height: 0.5rem;
          border-radius: 9999px;
          background-color: var(--el-color-primary);
        }

        :deep(.el-slider__button) {
          border: 2px solid;
          background-color: var(--el-bg-color-overlay);
          width: 1.25rem;
          height: 1.25rem;
          border-color: var(--el-color-primary);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
          transition: all 0.2s var(--transition);

          &:hover {
            transform: scale(1.2);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.16);
          }
        }
      }

      .modern-number {
        width: 5rem;

        :deep(.el-input__wrapper) {
          border-radius: 0.75rem;
          border: 2px solid var(--el-border-color);
          background-color: var(--el-bg-color);
          transition: all 0.3s var(--transition);

          &:hover,
          &:focus-within {
            border-color: var(--el-color-primary);
            box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.06);
          }
        }
      }

      .seed-refresh-btn {
        border-radius: 0.75rem;
        background-color: var(--el-color-primary);
        transition: all 0.3s var(--transition);
      }

      .seed-desc {
        font-size: 0.875rem;
        line-height: 1.25rem;
        color: var(--el-text-color-secondary);
      }
    }

    .param-desc {
      font-size: 0.875rem;
      line-height: 1.25rem;
      color: var(--el-text-color-secondary);
      line-height: 1.625;
    }
  }
}

/* 暗色主题 */
.dark .control-panel-wrapper {
  background-color: var(--el-bg-color);
  border-color: var(--el-border-color);
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.3);

  .panel-header {
    border-color: var(--el-border-color);
    background-color: var(--el-bg-color-overlay);

    .header-title {
      .title-text {
        color: var(--el-text-color-primary);
      }
    }

    .header-actions .action-icon {
      background-color: var(--el-bg-color-overlay);
      border-color: var(--el-border-color);
      color: var(--el-text-color-secondary);

      &:hover {
        background-color: var(--el-bg-color);
        color: var(--el-color-primary);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }
    }
  }

  .form-section .section-title span {
    color: var(--el-text-color-primary);
  }

  .modern-select :deep(.el-input__wrapper),
  .modern-textarea :deep(.el-textarea__inner),
  .modern-number :deep(.el-input__wrapper) {
    background-color: var(--el-bg-color-overlay);
    border-color: var(--el-border-color);
    color: var(--el-text-color-primary);

    &:hover,
    &:focus-within {
      background-color: var(--el-bg-color);
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.15);
    }
  }

  .param-item {
    background-color: var(--el-bg-color-overlay);
    border-color: var(--el-border-color);

    .param-header {
      .param-name {
        color: var(--el-text-color-primary);
      }

      .param-value {
        background-color: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
      }
    }

    .param-desc {
      color: var(--el-text-color-secondary);
    }

    .modern-slider {
      :deep(.el-slider__runway) {
        background-color: var(--el-border-color);
      }

      :deep(.el-slider__bar) {
        background-color: var(--el-color-primary);
      }

      :deep(.el-slider__button) {
        background-color: var(--el-bg-color);
        border-color: var(--el-color-primary);
      }
    }
  }

  .option-content {
    .option-info {
      .option-name {
        color: var(--el-text-color-primary);
      }

      .option-project {
        color: var(--el-text-color-secondary);
      }
    }
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>

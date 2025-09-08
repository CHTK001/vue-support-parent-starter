<template>
  <div class="control-panel-wrapper">
    <div class="panel-header">
      <div class="header-title" v-if="settingOpen">
        <IconifyIconOnline icon="mdi:tune-variant" class="title-icon" />
        <span class="title-text">模型配置</span>
      </div>
      <div class="header-actions">
        <IconifyIconOnline @click="$emit('refresh')" class="cursor-pointer" v-if="settingOpen" icon="mdi:refresh" />
        <IconifyIconOnline @click="handleToggle" class="cursor-pointer" :icon="settingOpen ? 'ep:d-arrow-right' : 'ep:d-arrow-left'" />
      </div>
    </div>

    <div class="panel-content" v-show="settingOpen">
      <el-form :model="form" :rules="rules" class="modern-form">
        <!-- 模型选择 -->
        <div class="form-section">
          <div class="section-title">
            <IconifyIconOnline icon="mdi:robot" class="section-icon" />
            <span>AI 模型</span>
          </div>
          <el-form-item prop="model">
            <div class="model-selector">
              <el-select filterable v-model="form.model" placeholder="选择 AI 模型" clearable @change="$emit('change-module', $event)" class="modern-select">
                <el-option v-for="item in modelList" class="model-option" :key="item.sysAiModuleCode" :label="item.sysAiModuleName" :value="item.sysAiModuleCode">
                  <template #default>
                    <el-tooltip placement="right" :raw-content="true" :content="`<div style='max-width: 300px'>${item.sysAiModuleRemark || item.sysAiModuleName}</div>`">
                      <div class="option-content">
                        <div class="option-avatar">
                          <el-image :src="item.sysProjectIcon" fit="cover" class="avatar-image">
                            <template #error>
                              <div class="avatar-fallback">
                                <IconifyIconOnline icon="mdi:robot" />
                              </div>
                            </template>
                          </el-image>
                        </div>
                        <div class="option-info">
                          <div class="option-name">{{ item.sysAiModuleName }}</div>
                          <div class="option-project">{{ item.sysProjectName }}</div>
                        </div>
                      </div>
                    </el-tooltip>
                  </template>
                </el-option>
                <template #label="{ label }">
                  <div class="selected-label">
                    <el-image class="label-avatar" :src="modelSelectLabel?.sysProjectIcon" fit="cover">
                      <template #error>
                        <IconifyIconOnline icon="mdi:robot" />
                      </template>
                    </el-image>
                    <span class="label-text">{{ label }}</span>
                  </div>
                </template>
              </el-select>
              <el-button v-if="env.showEdit" circle class="add-model-btn" @click="$emit('open-module')" type="primary">
                <IconifyIconOnline icon="ep:plus" />
              </el-button>
            </div>
          </el-form-item>
        </div>

        <!-- 角色设定 -->
        <div class="form-section" v-if="showRoleSetting">
          <div class="section-title">
            <IconifyIconOnline icon="mdi:account-tie" class="section-icon" />
            <span>角色设定</span>
          </div>
          <el-form-item prop="system">
            <el-input :rows="6" type="textarea" placeholder="定义 AI 的角色和行为特征，例如：你是一个专业的商业文案专家，擅长创作吸引人的营销内容..." v-model="form.system" class="modern-textarea" />
          </el-form-item>
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
              <el-slider :min="1" :max="8192" v-model="form.tokens" class="modern-slider" />
              <el-input-number :min="1" :max="8192" v-model="form.tokens" class="modern-number" :controls="false" />
            </div>
            <div class="param-desc">控制 AI 回复的最大长度，1 token ≈ 1.5 个中文字符</div>
          </div>

          <!-- Temperature -->
          <div class="param-item">
            <div class="param-header">
              <span class="param-name">创造性</span>
              <span class="param-value">{{ form.temperature }}</span>
            </div>
            <div class="param-control">
              <el-slider :min="0.1" :max="1" v-model="form.temperature" :step="0.1" class="modern-slider" />
              <el-input-number :min="0.1" :max="1" v-model="form.temperature" :step="0.1" class="modern-number" :controls="false" />
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
              <el-slider :min="1" :max="16" v-model="form.topK" class="modern-slider" />
              <el-input-number :min="1" :max="16" v-model="form.topK" class="modern-number" :controls="false" />
            </div>
            <div class="param-desc">控制词汇选择的多样性，影响回复的丰富程度</div>
          </div>

          <!-- Top-P -->
          <div class="param-item">
            <div class="param-header">
              <span class="param-name">核心采样</span>
              <span class="param-value">{{ form.topP }}</span>
            </div>
            <div class="param-control">
              <el-slider :min="0.1" :max="1" :step="0.1" v-model="form.topP" class="modern-slider" />
              <el-input-number :min="0.1" :step="0.1" :max="1" v-model="form.topP" class="modern-number" :controls="false" />
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
              <el-button circle @click="$emit('click-seed')" class="seed-refresh-btn" type="primary">
                <IconifyIconOnline icon="ep:refresh" />
              </el-button>
              <div class="seed-desc">点击生成新的随机种子</div>
            </div>
          </div>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
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
const emit = defineEmits(["refresh", "change-module", "open-module", "click-seed", "toggle"]);

// State
const settingOpen = ref(props.isOpen);

// Watch for prop changes
watch(
  () => props.isOpen,
  (newValue) => {
    settingOpen.value = newValue;
  }
);

// Computed
const modelSelectLabel = computed(() => {
  return props.modelList.find((item) => item.sysAiModuleCode === props.form.model);
});

// Methods
const handleToggle = () => {
  settingOpen.value = !settingOpen.value;
  emit("toggle", settingOpen.value);
};
</script>

<style scoped lang="scss">
.control-panel-wrapper {
  --primary: #7c3aed;
  --primary-dark: #6d28d9;
  --primary-light: #ede9fe;
  --primary-50: rgba(124, 58, 237, 0.05);
  --primary-rgb: 124, 58, 237;
  --gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --glass: rgba(255, 255, 255, 0.1);
  --transition: cubic-bezier(0.4, 0, 0.2, 1);

  height: 100%;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  overflow: hidden;
  border-left: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.06);
  transition: all 0.4s var(--transition);

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
    border-bottom: 1px solid rgba(243, 244, 246, 0.8);
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);

    .header-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .title-icon {
        font-size: 1.5rem;
        line-height: 2rem;
        color: var(--primary);
        filter: drop-shadow(0 2px 4px rgba(124, 58, 237, 0.2));
      }

      .title-text {
        font-size: 1.125rem;
        line-height: 1.75rem;
        font-weight: 600;
        color: #1f2937;
        background: linear-gradient(135deg, #374151, #6b7280);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
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
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(0, 0, 0, 0.05);

        &:hover {
          color: var(--primary);
          transform: scale(1.1);
          background: rgba(255, 255, 255, 1);
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.15);
          transform: scale(1.1) translateY(-2px);
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
        background-color: #f3f4f6;
        border-radius: 9999px;
      }

      &::-webkit-scrollbar-thumb {
        background-color: #d1d5db;
        border-radius: 9999px;
        transition: background-color 0.3s ease;

        &:hover {
          background-color: #9ca3af;
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
        color: var(--primary);
        filter: drop-shadow(0 2px 4px rgba(124, 58, 237, 0.2));
      }

      span {
        font-size: 1rem;
        line-height: 1.5rem;
        font-weight: 600;
        color: #374151;
        position: relative;

        &::after {
          content: "";
          content: "";
          position: absolute;
          bottom: -0.25rem;
          left: 0;
          width: 0;
          height: 0.125rem;
          background: linear-gradient(to right, var(--primary), #7c3aed);
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
        border: 2px solid #e5e7eb;
        background-color: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(12px);
        transition: all 0.3s var(--transition);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

        &:hover {
          border-color: rgba(124, 58, 237, 0.5);
          background-color: white;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(124, 58, 237, 0.12);
        }

        &.is-focus {
          border-color: var(--primary);
          background-color: white;
          box-shadow:
            0 0 0 4px rgba(124, 58, 237, 0.1),
            0 8px 24px rgba(124, 58, 237, 0.12);
        }
      }
    }

    .add-model-btn {
      border-radius: 1rem;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
      transition: all 0.3s var(--transition);

      &:hover {
        transform: scale(1.05) translateY(-2px);
        box-shadow: 0 8px 20px rgba(124, 58, 237, 0.4);
      }
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
        background: linear-gradient(to bottom right, var(--primary), #7c3aed);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1.25rem;
        line-height: 1.75rem;
      }
    }

    .option-info {
      flex: 1;

      .option-name {
        font-weight: 500;
        color: #1f2937;
        font-size: 0.875rem;
        line-height: 1.25rem;
      }

      .option-project {
        font-size: 0.75rem;
        line-height: 1rem;
        color: #6b7280;
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
      border: 2px solid #e5e7eb;
      background-color: rgba(255, 255, 255, 0.8);
      resize: none;
      backdrop-filter: blur(12px);
      transition: all 0.3s var(--transition);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

      &:hover {
        border-color: rgba(124, 58, 237, 0.5);
        background-color: white;
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(124, 58, 237, 0.12);
      }

      &:focus {
        border-color: var(--primary);
        background-color: white;
        box-shadow:
          0 0 0 4px rgba(124, 58, 237, 0.1),
          0 8px 24px rgba(124, 58, 237, 0.12);
      }
    }
  }

  .param-item {
    padding: 1.25rem;
    border-radius: 1rem;
    background: linear-gradient(to bottom right, white, rgba(249, 250, 251, 0.5));
    border: 1px solid #f3f4f6;
    backdrop-filter: blur(8px);
    transition: all 0.3s var(--transition);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      border-color: rgba(124, 58, 237, 0.2);
    }

    .param-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;

      .param-name {
        font-weight: 600;
        color: #374151;
      }

      .param-value {
        padding: 0.25rem 0.75rem;
        border-radius: 0.75rem;
        background-color: rgba(124, 58, 237, 0.1);
        color: var(--primary);
        font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
        font-size: 0.875rem;
        line-height: 1.25rem;

        &.seed-value {
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
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
          background-color: #e5e7eb;
          height: 0.5rem;
          border-radius: 9999px;
        }

        :deep(.el-slider__bar) {
          height: 0.5rem;
          border-radius: 9999px;
          background: linear-gradient(90deg, var(--primary-light), var(--primary));
        }

        :deep(.el-slider__button) {
          border: 2px solid;
          background-color: white;
          width: 1.25rem;
          height: 1.25rem;
          border-color: var(--primary);
          box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
          transition: all 0.2s var(--transition);

          &:hover {
            transform: scale(1.2);
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
          }
        }
      }

      .modern-number {
        width: 5rem;

        :deep(.el-input__wrapper) {
          border-radius: 0.75rem;
          border: 2px solid #e5e7eb;
          background-color: rgba(255, 255, 255, 0.8);
          transition: all 0.3s var(--transition);

          &:hover,
          &:focus-within {
            border-color: rgba(124, 58, 237, 0.5);
            box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
          }
        }
      }

      .seed-refresh-btn {
        border-radius: 0.75rem;
        background: linear-gradient(135deg, var(--primary), var(--primary-dark));
        box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
        transition: all 0.3s var(--transition);

        &:hover {
          transform: scale(1.05) rotate(180deg);
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
        }
      }

      .seed-desc {
        font-size: 0.875rem;
        line-height: 1.25rem;
        color: #6b7280;
      }
    }

    .param-desc {
      font-size: 0.875rem;
      line-height: 1.25rem;
      color: #6b7280;
      line-height: 1.625;
    }
  }
}

/* 暗色主题 */
.dark .control-panel-wrapper {
  background-color: rgba(17, 24, 39, 0.95);
  border-color: rgba(55, 65, 81, 0.5);
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.3);

  .panel-header {
    border-color: rgba(55, 65, 81, 0.5);
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);

    .header-title {
      .title-text {
        color: #e5e7eb;
        background: linear-gradient(135deg, #e5e7eb, #9ca3af);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }

    .header-actions .action-icon {
      background-color: rgba(31, 41, 55, 0.8);
      border-color: #374151;
      color: #9ca3af;

      &:hover {
        background-color: #1f2937;
        color: #818cf8;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
      }
    }
  }

  .form-section .section-title span {
    color: #d1d5db;
  }

  .modern-select :deep(.el-input__wrapper),
  .modern-textarea :deep(.el-textarea__inner),
  .modern-number :deep(.el-input__wrapper) {
    background-color: rgba(31, 41, 55, 0.8);
    border-color: #374151;
    color: #e5e7eb;

    &:hover,
    &:focus-within {
      background-color: #1f2937;
      border-color: #818cf8;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }
  }

  .param-item {
    background: linear-gradient(to bottom right, rgba(31, 41, 55, 0.5), rgba(17, 24, 39, 0.5));
    border-color: rgba(55, 65, 81, 0.5);

    .param-header {
      .param-name {
        color: #d1d5db;
      }

      .param-value {
        background-color: rgba(99, 102, 241, 0.2);
        color: #818cf8;
      }
    }

    .param-desc {
      color: #9ca3af;
    }

    .modern-slider {
      :deep(.el-slider__runway) {
        background-color: #374151;
      }

      :deep(.el-slider__bar) {
        background: linear-gradient(90deg, #4f46e5, #7c3aed);
      }

      :deep(.el-slider__button) {
        background-color: #1f2937;
        border-color: #818cf8;
      }
    }
  }

  .option-content {
    .option-info {
      .option-name {
        color: #e5e7eb;
      }

      .option-project {
        color: #9ca3af;
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

<template>
  <div v-if="visible" class="save-dialog-overlay" @click.self="$emit('close')">
    <div class="save-dialog">
      <div class="save-dialog__header">
        <span class="save-dialog__title">保存项目</span>
        <button class="save-dialog__close" @click="$emit('close')">
          <IconifyIconOffline icon="ep:close" />
        </button>
      </div>

      <div class="save-dialog__body">
        <div class="save-name-field">
          <label class="save-name-label">配置名称</label>
          <input
            v-model="name"
            type="text"
            class="config-input"
            placeholder="请输入配置名称"
            @input="nameError = ''"
          />
          <span v-if="nameError" class="save-name-error">{{ nameError }}</span>
        </div>

        <div v-if="showRemote" class="save-remote-option">
          <label class="save-checkbox">
            <input v-model="saveRemote" type="checkbox" />
            <span>同时保存到远程服务器</span>
          </label>
        </div>

        <div v-if="saveResult !== null" class="save-result" :class="saveResult ? 'save-result--success' : 'save-result--error'">
          {{ saveResult ? '✅ 保存成功' : '❌ 保存失败' }}
        </div>
      </div>

      <div class="save-dialog__footer">
        <button class="dlg-btn dlg-btn--cancel" @click="$emit('close')">取消</button>
        <button class="dlg-btn dlg-btn--confirm" :disabled="saving" @click="onSave">
          {{ saving ? '保存中...' : '确认保存' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

interface Props {
  visible: boolean;
  /** 当前配置名称（预填） */
  configName: string;
  /** 远程 API 地址，为空时不显示远程选项 */
  remoteUrl?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  save: [payload: { name: string; saveRemote: boolean }];
}>();

const name = ref(props.configName);
const saveRemote = ref(false);
const saving = ref(false);
const saveResult = ref<boolean | null>(null);
const nameError = ref("");

const showRemote = computed(() => !!props.remoteUrl);

async function onSave() {
  const trimmed = name.value.trim();
  if (!trimmed) {
    nameError.value = "请输入配置名称";
    return;
  }

  saving.value = true;
  saveResult.value = null;

  try {
    emit("save", { name: trimmed, saveRemote: saveRemote.value });
    // 给父组件一个 tick 处理
    await new Promise((r) => setTimeout(r, 50));
    saveResult.value = true;
  } catch {
    saveResult.value = false;
  } finally {
    saving.value = false;
  }
}
</script>

<style lang="scss" scoped>
.save-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.save-dialog {
  width: 420px;
  background: rgba(10, 22, 40, 0.98);
  border: 1px solid rgba(0, 246, 255, 0.2);
  border-radius: 8px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border-bottom: 1px solid rgba(0, 246, 255, 0.1);
  }

  &__title {
    color: rgba(0, 246, 255, 0.8);
    font-size: 14px;
    font-weight: 600;
  }

  &__close {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.4);
    cursor: pointer;
    font-size: 16px;
    padding: 4px;

    &:hover {
      color: rgba(255, 255, 255, 0.8);
    }
  }

  &__body {
    padding: 16px 18px;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 18px;
    border-top: 1px solid rgba(0, 246, 255, 0.1);
  }
}

.save-name-field {
  margin-bottom: 12px;
}

.save-name-label {
  display: block;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 6px;
}

.save-name-error {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: #ff6b6b;
}

.config-input {
  width: 100%;
  padding: 8px 10px;
  background: rgba(0, 20, 40, 0.6);
  border: 1px solid rgba(0, 246, 255, 0.12);
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: rgba(0, 246, 255, 0.3);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.2);
  }
}

.save-remote-option {
  margin-bottom: 8px;
}

.save-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;

  input {
    accent-color: #00f6ff;
  }
}

.save-result {
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;

  &--success {
    background: rgba(0, 200, 100, 0.1);
    border: 1px solid rgba(0, 200, 100, 0.3);
    color: #4cdf8b;
  }

  &--error {
    background: rgba(255, 50, 50, 0.1);
    border: 1px solid rgba(255, 50, 50, 0.3);
    color: #ff6b6b;
  }
}

.dlg-btn {
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.12s;

  &--cancel {
    background: transparent;
    border: 1px solid rgba(0, 246, 255, 0.2);
    color: rgba(255, 255, 255, 0.6);

    &:hover {
      border-color: rgba(0, 246, 255, 0.4);
      color: rgba(255, 255, 255, 0.9);
    }
  }

  &--confirm {
    background: rgba(0, 246, 255, 0.15);
    border: 1px solid rgba(0, 246, 255, 0.4);
    color: #00f6ff;

    &:hover:not(:disabled) {
      background: rgba(0, 246, 255, 0.25);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}
</style>

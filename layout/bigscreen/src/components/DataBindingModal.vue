<template>
  <Teleport to="body">
    <div v-if="widget" class="data-binding-overlay" @mousedown.self="close">
      <div class="data-binding-modal">
        <div class="data-binding-modal__header">
          <span class="data-binding-modal__title">数据绑定配置</span>
          <span class="data-binding-modal__widget">{{ widget.title || widget.type }}</span>
          <button class="data-binding-modal__close" @click="close">
            <IconifyIconOffline icon="ep:close" />
          </button>
        </div>

        <div class="data-binding-modal__body">
          <!-- API 配置 -->
          <section class="db-section">
            <h4 class="db-section__title">API 接口</h4>
            <div class="db-field">
              <label>请求地址</label>
              <input
                type="text"
                :value="binding.apiUrl || ''"
                placeholder="https://api.example.com/data"
                @input="update('apiUrl', ($event.target as HTMLInputElement).value)"
              />
            </div>
            <div class="db-row">
              <div class="db-field">
                <label>请求方法</label>
                <select
                  :value="binding.method || 'GET'"
                  @change="update('method', ($event.target as HTMLSelectElement).value)"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>
              </div>
              <div class="db-field">
                <label>刷新间隔 (ms)</label>
                <input
                  type="number"
                  :value="binding.refreshInterval || 0"
                  min="0"
                  step="1000"
                  placeholder="0 = 不轮询"
                  @input="update('refreshInterval', Number(($event.target as HTMLInputElement).value))"
                />
              </div>
            </div>
          </section>

          <!-- 请求头 -->
          <section class="db-section">
            <h4 class="db-section__title">请求头 (Headers)</h4>
            <div class="db-field">
              <textarea
                :value="headersText"
                rows="3"
                placeholder='{"Authorization": "Bearer xxx", "Content-Type": "application/json"}'
                @input="updateHeaders(($event.target as HTMLTextAreaElement).value)"
              />
            </div>
          </section>

          <!-- POST Body -->
          <section v-if="binding.method === 'POST'" class="db-section">
            <h4 class="db-section__title">请求体 (Body)</h4>
            <div class="db-field">
              <textarea
                :value="binding.body || ''"
                rows="3"
                placeholder='{"key": "value"}'
                @input="update('body', ($event.target as HTMLTextAreaElement).value)"
              />
            </div>
          </section>

          <!-- 数据路径 -->
          <section class="db-section">
            <h4 class="db-section__title">数据提取</h4>
            <div class="db-field">
              <label>JSONPath 路径</label>
              <input
                type="text"
                :value="binding.dataPath || ''"
                placeholder="data.list (提取响应中的 data.list 字段)"
                @input="update('dataPath', ($event.target as HTMLInputElement).value)"
              />
            </div>
          </section>
        </div>

        <div class="data-binding-modal__footer">
          <button class="db-btn db-btn--cancel" @click="close">取消</button>
          <button class="db-btn db-btn--save" @click="save">保存</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { WidgetConfig, DataBindingConfig } from "../types/widget";

const props = defineProps<{
  widget: WidgetConfig | null;
}>();

const emit = defineEmits<{
  close: [];
  update: [id: string, patch: Partial<WidgetConfig>];
}>();

const binding = ref<DataBindingConfig>({
  apiUrl: "",
  method: "GET",
  refreshInterval: 0,
  headers: {},
  body: "",
  dataPath: "",
});

watch(
  () => props.widget,
  (w) => {
    if (w?.dataBinding) {
      binding.value = { ...w.dataBinding };
    } else {
      binding.value = {
        apiUrl: "",
        method: "GET",
        refreshInterval: 0,
        headers: {},
        body: "",
        dataPath: "",
      };
    }
  },
  { immediate: true }
);

const headersText = computed(() =>
  binding.value.headers ? JSON.stringify(binding.value.headers, null, 2) : ""
);

function update(key: string, value: unknown) {
  (binding.value as Record<string, unknown>)[key] = value;
}

function updateHeaders(text: string) {
  try {
    binding.value.headers = text ? JSON.parse(text) : {};
  } catch {
    // 保持原值，等用户修正
  }
}

function save() {
  if (!props.widget) return;
  emit("update", props.widget.id, { dataBinding: { ...binding.value } });
  close();
}

function close() {
  emit("close");
}
</script>

<style lang="scss" scoped>
.data-binding-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.data-binding-modal {
  width: 520px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  background: rgba(8, 20, 40, 0.98);
  border: 1px solid rgba(0, 246, 255, 0.3);
  border-radius: 8px;
  box-shadow: 0 0 40px rgba(0, 246, 255, 0.15);

  &__header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 18px;
    border-bottom: 1px solid rgba(0, 246, 255, 0.15);
  }

  &__title {
    font-size: 15px;
    font-weight: 600;
    color: rgba(0, 246, 255, 0.9);
  }

  &__widget {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.4);
    background: rgba(0, 246, 255, 0.08);
    padding: 2px 8px;
    border-radius: 4px;
  }

  &__close {
    margin-left: auto;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 4px;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: all 0.15s;
    font-size: 16px;
    padding: 0;

    &:hover {
      background: rgba(255, 50, 50, 0.3);
      border-color: rgba(255, 50, 50, 0.6);
      color: #fff;
    }
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: 16px 18px;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 12px 18px;
    border-top: 1px solid rgba(0, 246, 255, 0.1);
  }
}

.db-section {
  margin-bottom: 18px;

  &__title {
    margin: 0 0 10px;
    font-size: 11px;
    font-weight: 600;
    color: rgba(0, 246, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 1px;
  }
}

.db-field {
  margin-bottom: 10px;

  label {
    display: block;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 4px;
  }

  input[type="text"],
  input[type="number"],
  select,
  textarea {
    width: 100%;
    padding: 6px 10px;
    background: rgba(0, 20, 40, 0.6);
    border: 1px solid rgba(0, 246, 255, 0.15);
    border-radius: 4px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 12px;
    font-family: "JetBrains Mono", monospace;
    outline: none;
    transition: border-color 0.15s;

    &:focus {
      border-color: rgba(0, 246, 255, 0.4);
    }

    &::placeholder {
      color: rgba(255, 255, 255, 0.25);
    }
  }

  textarea {
    resize: vertical;
    min-height: 60px;
  }
}

.db-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.db-btn {
  padding: 6px 20px;
  border: 1px solid rgba(0, 246, 255, 0.3);
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;

  &--cancel {
    background: transparent;
    color: rgba(255, 255, 255, 0.6);

    &:hover {
      background: rgba(255, 255, 255, 0.05);
    }
  }

  &--save {
    background: rgba(0, 246, 255, 0.2);
    border-color: rgba(0, 246, 255, 0.5);
    color: #00f6ff;

    &:hover {
      background: rgba(0, 246, 255, 0.35);
    }
  }
}
</style>

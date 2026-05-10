<template>
  <div class="workspace-card form-card">
    <div class="card-head">
      <h2>JDBC 连接</h2>
      <span>支持直连 JDBC URL 或 host/port 组合</span>
    </div>
    <div class="form-grid">
      <label>
        <span>连接名</span>
        <input
          :value="modelValue.connectionName"
          type="text"
          @input="
            updateField(
              'connectionName',
              $event.target.value
            )
          "
        />
      </label>
      <label>
        <span>主机</span>
        <input
          :value="modelValue.host"
          type="text"
          @input="
            updateField('host', $event.target.value)
          "
        />
      </label>
      <label>
        <span>端口</span>
        <input
          :value="modelValue.port"
          type="number"
          @input="
            updateField(
              'port',
              Number($event.target.value)
            )
          "
        />
      </label>
      <label>
        <span>数据库</span>
        <input
          :value="modelValue.databaseName"
          type="text"
          @input="
            updateField(
              'databaseName',
              $event.target.value
            )
          "
        />
      </label>
      <label>
        <span>JDBC URL</span>
        <input
          :value="modelValue.protocol"
          type="text"
          placeholder="jdbc:mysql://127.0.0.1:3306/your_db?useUnicode=true&characterEncoding=UTF-8&useSSL=false"
          @input="
            updateField('protocol', $event.target.value)
          "
        />
      </label>
      <label>
        <span>用户名</span>
        <input
          :value="modelValue.username"
          type="text"
          @input="
            updateField('username', $event.target.value)
          "
        />
      </label>
      <label>
        <span>密码</span>
        <input
          :value="modelValue.password"
          type="password"
          @input="
            updateField('password', $event.target.value)
          "
        />
      </label>
    </div>
    <div class="form-actions">
      <button type="button" :disabled="submitting" @click="$emit('open')">
        {{ submitting ? "处理中..." : "打开连接" }}
      </button>
      <button type="button" class="secondary" @click="$emit('refresh')">
        刷新目录
      </button>
    </div>

    <div v-if="cachedConnections.length" class="connection-cache">
      <div class="cache-head">缓存连接</div>
      <div
        v-for="item in cachedConnections"
        :key="item.connectionId"
        class="cache-row"
      >
        <button
          type="button"
          class="cache-item"
          :class="{ active: item.connectionId === activeConnectionId }"
          @click="$emit('switch-connection', item.connectionId)"
        >
          <span>{{ item.connectionName || item.connectionId }}</span>
          <span class="cache-meta">
            <small>{{ item.connectionType }}</small>
            <small>{{ formatTime(item.lastAccessTime) }}</small>
          </span>
        </button>
        <button
          type="button"
          class="cache-close"
          @click="$emit('close-connection', item.connectionId)"
        >
          关闭
        </button>
      </div>
    </div>

    <p v-if="activeConnectionId" class="connection-tip">
      当前连接 ID：{{ activeConnectionId }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { PanelConnectionDescriptor } from "../api";
import type { JdbcConnectionForm } from "../panel";

const props = defineProps<{
  activeConnectionId: string;
  cachedConnections: PanelConnectionDescriptor[];
  modelValue: JdbcConnectionForm;
  submitting: boolean;
}>();

const emit = defineEmits<{
  (e: "close-connection", connectionId: string): void;
  (e: "open"): void;
  (e: "refresh"): void;
  (e: "switch-connection", connectionId: string): void;
  (e: "update:modelValue", value: JdbcConnectionForm): void;
}>();

const formatTime = (value?: string) => {
  if (!value) {
    return "最近未访问";
  }
  return value.replace("T", " ").slice(0, 19);
};

const updateField = <K extends keyof JdbcConnectionForm>(
  field: K,
  value: JdbcConnectionForm[K]
) => {
  emit("update:modelValue", {
    ...props.modelValue,
    [field]: value,
  });
};
</script>

<style scoped lang="scss">
.workspace-card {
  border: 1px solid rgba(123, 142, 154, 0.12);
  border-radius: 20px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.94),
    rgba(243, 247, 250, 0.9)
  );
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.03);
  padding: 22px 24px;
  animation: card-enter 0.45s ease-out;

  @keyframes card-enter {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
}

.card-head {
  margin-bottom: 18px;
  display: grid;
  gap: 4px;

  h2 {
    margin: 0;
    font-size: 17px;
    font-weight: 700;
    color: #0f1a2e;
    letter-spacing: -0.01em;
  }

  span {
    font-size: 13px;
    color: #5b7283;
  }
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;

  label {
    display: grid;
    gap: 6px;
  }

  label span {
    font-size: 12px;
    font-weight: 600;
    color: #3d5568;
    letter-spacing: 0.02em;
  }

  input {
    height: 38px;
    padding: 0 12px;
    border: 1px solid rgba(123, 142, 154, 0.18);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.8);
    color: #152b3d;
    font-size: 13px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    outline: none;

    &:focus {
      border-color: rgba(99, 102, 241, 0.35);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
    }

    &::placeholder {
      color: #94a3b8;
    }
  }
}

.form-actions {
  display: flex;
  gap: 10px;

  button {
    height: 36px;
    padding: 0 20px;
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 10px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      box-shadow: 0 4px 16px rgba(99, 102, 241, 0.25);
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &.secondary {
      border-color: rgba(123, 142, 154, 0.18);
      background: rgba(255, 255, 255, 0.8);
      color: #4f6778;

      &:hover {
        border-color: rgba(123, 142, 154, 0.3);
        background: rgba(255, 255, 255, 0.95);
        box-shadow: none;
        transform: translateY(-1px);
      }
    }
  }
}

.connection-tip {
  margin: 14px 0 0;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(59, 130, 246, 0.14);
  background: rgba(59, 130, 246, 0.04);
  color: #375b76;
  font-size: 12px;
}

.connection-cache {
  margin-top: 18px;
  display: grid;
  gap: 8px;
  border-top: 1px solid rgba(123, 142, 154, 0.1);
  padding-top: 16px;
}

.cache-head {
  font-size: 12px;
  font-weight: 600;
  color: #5b7283;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.cache-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}

.cache-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border: 1px solid rgba(123, 142, 154, 0.1);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.7);
  padding: 10px 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(99, 102, 241, 0.2);
    background: rgba(255, 255, 255, 0.9);
  }

  &.active {
    border-color: rgba(16, 185, 129, 0.3);
    background: rgba(209, 250, 229, 0.5);
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.08);
  }

  small {
    color: #6a8192;
    font-size: 11px;
  }
}

.cache-meta {
  display: grid;
  justify-items: end;
  gap: 2px;
}

.cache-close {
  border: 1px solid rgba(123, 142, 154, 0.12);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.7);
  padding: 10px 14px;
  cursor: pointer;
  color: #dc2626;
  font-size: 12px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(254, 202, 202, 0.5);
    border-color: rgba(220, 38, 38, 0.2);
  }
}

/* ── Dark Mode ── */
:global(html.dark) {
  .workspace-card {
    background: linear-gradient(
      180deg,
      rgba(15, 23, 42, 0.88),
      rgba(20, 30, 48, 0.84)
    );
    border-color: rgba(148, 163, 184, 0.08);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  }

  .card-head {
    h2 { color: #e2e8f0; }
    span { color: #94a3b8; }
  }

  .form-grid {
    label span { color: #94a3b8; }

    input {
      background: rgba(15, 23, 42, 0.7);
      border-color: rgba(148, 163, 184, 0.12);
      color: #e2e8f0;

      &:focus {
        border-color: rgba(99, 102, 241, 0.35);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
      }

      &::placeholder {
        color: #64748b;
      }
    }
  }

  .form-actions {
    button {
      &.secondary {
        background: rgba(15, 23, 42, 0.7);
        border-color: rgba(148, 163, 184, 0.12);
        color: #94a3b8;

        &:hover {
          background: rgba(15, 23, 42, 0.85);
          border-color: rgba(148, 163, 184, 0.2);
        }
      }
    }
  }

  .connection-tip {
    border-color: rgba(59, 130, 246, 0.15);
    background: rgba(30, 58, 138, 0.2);
    color: #93c5fd;
  }

  .connection-cache {
    border-top-color: rgba(148, 163, 184, 0.08);
  }

  .cache-head { color: #8899a8; }

  .cache-item {
    background: rgba(15, 23, 42, 0.6);
    border-color: rgba(148, 163, 184, 0.06);

    &:hover {
      border-color: rgba(99, 102, 241, 0.2);
      background: rgba(15, 23, 42, 0.75);
    }

    &.active {
      border-color: rgba(16, 185, 129, 0.3);
      background: rgba(6, 78, 59, 0.3);
    }

    small { color: #8899a8; }
  }

  .cache-close {
    background: rgba(15, 23, 42, 0.6);
    border-color: rgba(148, 163, 184, 0.08);
    color: #fca5a5;

    &:hover {
      background: rgba(127, 29, 29, 0.4);
      border-color: rgba(220, 38, 38, 0.2);
    }
  }
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>

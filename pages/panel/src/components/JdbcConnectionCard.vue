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
          @input="updateField('connectionName', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <label>
        <span>主机</span>
        <input
          :value="modelValue.host"
          type="text"
          @input="updateField('host', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <label>
        <span>端口</span>
        <input
          :value="modelValue.port"
          type="number"
          @input="updateField('port', Number(($event.target as HTMLInputElement).value))"
        />
      </label>
      <label>
        <span>数据库</span>
        <input
          :value="modelValue.databaseName"
          type="text"
          @input="updateField('databaseName', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <label>
        <span>JDBC URL</span>
        <input
          :value="modelValue.protocol"
          type="text"
          placeholder="jdbc:h2:mem:panel_case;MODE=MySQL"
          @input="updateField('protocol', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <label>
        <span>用户名</span>
        <input
          :value="modelValue.username"
          type="text"
          @input="updateField('username', ($event.target as HTMLInputElement).value)"
        />
      </label>
      <label>
        <span>密码</span>
        <input
          :value="modelValue.password"
          type="password"
          @input="updateField('password', ($event.target as HTMLInputElement).value)"
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
  value: JdbcConnectionForm[K],
) => {
  emit("update:modelValue", {
    ...props.modelValue,
    [field]: value,
  });
};
</script>

<style scoped lang="scss">
.connection-cache {
  margin-top: 16px;
  display: grid;
  gap: 8px;
}

.cache-head {
  font-size: 12px;
  color: #5b6474;
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
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.72);
  padding: 10px 12px;
  cursor: pointer;
}

.cache-item.active {
  border-color: rgba(20, 83, 45, 0.35);
  background: rgba(209, 250, 229, 0.7);
}

.cache-close {
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.72);
  padding: 10px 12px;
  cursor: pointer;
  color: #7f1d1d;
}

.cache-item small {
  color: #5b6474;
}

.cache-meta {
  display: grid;
  justify-items: end;
  gap: 2px;
}
</style>

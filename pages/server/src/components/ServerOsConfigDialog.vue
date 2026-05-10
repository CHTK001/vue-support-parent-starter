<template>
  <ScDialog
    :model-value="modelValue"
    :title="`操作系统配置 - ${hostName}`"
    width="960px"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="server-os-config">
      <!-- Windows 不支持提示 -->
      <div v-if="allUnsupported" class="server-os-config__warning">
        <div class="server-os-config__warning-icon">&#9888;</div>
        <div class="server-os-config__warning-content">
          <strong>当前服务器为 Windows</strong>
          <p>操作系统配置功能主要针对 Linux 系统。Windows 服务器暂不支持大多数内核参数调优。</p>
        </div>
      </div>

      <div v-loading="loading" class="server-os-config__content">
        <template v-for="group in configGroups" :key="group.category">
          <div v-if="group.items.length > 0" class="server-os-config__group">
            <div class="server-os-config__group-header">
              <span class="server-os-config__group-icon">{{ group.icon }}</span>
              <span class="server-os-config__group-title">{{ group.label }}</span>
              <span class="server-os-config__group-count">{{ group.items.length }} 项</span>
            </div>

            <div class="server-os-config__items">
              <div
                v-for="item in group.items"
                :key="item.key"
                class="server-os-config__item"
                :class="{ 'server-os-config__item--unsupported': !item.supported }"
              >
                <div class="server-os-config__item-header">
                  <div class="server-os-config__item-info">
                    <span class="server-os-config__item-name">{{ item.name }}</span>
                    <el-tooltip
                      :content="item.tooltip"
                      placement="right"
                      popper-class="server-os-config__tooltip-popper"
                      :show-after="200"
                    >
                      <span class="server-os-config__item-tip">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                      </span>
                    </el-tooltip>
                  </div>
                  <span v-if="!item.supported" class="server-os-config__item-unsupported-badge">不支持</span>
                </div>
                <div class="server-os-config__item-body">
                  <div class="server-os-config__item-description">{{ item.description }}</div>
                  <div class="server-os-config__item-controls">
                    <div class="server-os-config__item-current">
                      <span class="server-os-config__current-label">当前值</span>
                      <code class="server-os-config__current-value">{{ item.currentValue || '-' }}</code>
                    </div>
                    <div class="server-os-config__item-actions">
                      <template v-if="isNumericConfig(item.key)">
                        <ScInput
                          v-model="editValues[item.key]"
                          type="number"
                          size="small"
                          class="server-os-config__number-input"
                          :min="numericMin(item.key)"
                          :max="numericMax(item.key)"
                          :disabled="!item.supported || applyingKeys[item.key]"
                        />
                      </template>
                      <el-select
                        v-else-if="item.possibleValues && item.possibleValues.length > 0"
                        v-model="editValues[item.key]"
                        :placeholder="item.currentValue"
                        size="small"
                        class="server-os-config__select"
                        :disabled="!item.supported || applyingKeys[item.key]"
                      >
                        <el-option
                          v-for="opt in item.possibleValues"
                          :key="opt"
                          :label="opt"
                          :value="opt"
                        />
                      </el-select>
                      <ScButton
                        size="small"
                        type="primary"
                        :disabled="!item.supported || editValues[item.key] == null || editValues[item.key] === '' || String(editValues[item.key]) === item.currentValue"
                        :loading="!!applyingKeys[item.key]"
                        @click="handleApply(item)"
                      >
                        应用
                      </ScButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <el-empty v-if="!loading && configGroups.every(g => g.items.length === 0)" description="暂无可用配置" />
      </div>
    </div>

    <template #footer>
      <div class="server-os-config__footer">
        <ScButton @click="handleRefresh" :loading="loading">刷新</ScButton>
        <ScButton @click="emit('update:modelValue', false)">关闭</ScButton>
      </div>
    </template>
  </ScDialog>
</template>

<script setup lang="ts">
import { ScDialog } from "@repo/components/ScDialog";
import { ScInput } from "@repo/components/ScInput";
import { ScButton } from "@repo/components/ScButton";
import { ref, reactive, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import { listOsConfigs, applyOsConfig } from "../api";
import type { ServerOsConfigItem } from "../api/types";

defineOptions({ name: "ServerOsConfigDialog" });

const props = defineProps<{
  modelValue: boolean;
  hostId: number;
  hostName: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const loading = ref(false);
const configItems = ref<ServerOsConfigItem[]>([]);
const editValues = reactive<Record<string, string | number>>({});
const applyingKeys = reactive<Record<string, boolean>>({});

interface ConfigGroup {
  category: string;
  label: string;
  icon: string;
  items: ServerOsConfigItem[];
}

const categoryMeta: Record<string, { label: string; icon: string }> = {
  RESOURCE: { label: "资源限制", icon: "⚡" },
  SECURITY: { label: "安全配置", icon: "🛡️" },
  NETWORK: { label: "网络优化", icon: "🌐" },
  KERNEL: { label: "内核参数", icon: "⚙️" },
  OTHER: { label: "其他", icon: "📋" },
};

const configGroups = computed<ConfigGroup[]>(() => {
  const groups: Record<string, ConfigGroup> = {};
  for (const item of configItems.value) {
    const cat = item.category || "OTHER";
    if (!groups[cat]) {
      const meta = categoryMeta[cat] || { label: cat, icon: "📋" };
      groups[cat] = { category: cat, label: meta.label, icon: meta.icon, items: [] };
    }
    groups[cat].items.push(item);
  }
  return Object.values(groups);
});

const allUnsupported = computed(() => {
  return configItems.value.length > 0 && configItems.value.every((i) => !i.supported);
});

// ── 数值型配置判断 ──────────────────────────────
const NUMERIC_KEYS = new Set([
  "ulimit_open_files", "vm_swappiness", "fs_file_max",
  "kernel_pid_max", "net_somaxconn", "vm_max_map_count", "tcp_max_tw_buckets",
]);

const isNumericConfig = (key: string): boolean => NUMERIC_KEYS.has(key);

const numericMin = (key: string): number => {
  const limits: Record<string, number> = {
    ulimit_open_files: 1024, vm_swappiness: 0, fs_file_max: 65535,
    kernel_pid_max: 32768, net_somaxconn: 128, vm_max_map_count: 65530, tcp_max_tw_buckets: 0,
  };
  return limits[key] ?? 0;
};

const numericMax = (key: string): number => {
  const limits: Record<string, number> = {
    ulimit_open_files: 1048576, vm_swappiness: 200, fs_file_max: 999999999,
    kernel_pid_max: 4194304, net_somaxconn: 65535, vm_max_map_count: 10000000, tcp_max_tw_buckets: 2000000,
  };
  return limits[key] ?? 999999;
};

// ── 加载配置 ────────────────────────────────────────
const loadConfigs = async () => {
  loading.value = true;
  try {
    const res = await listOsConfigs(props.hostId);
    configItems.value = res.data || [];
    // 初始化编辑值为当前值
    for (const item of configItems.value) {
      if (item.currentValue != null && editValues[item.key] == null) {
        editValues[item.key] = isNumericConfig(item.key)
          ? Number(item.currentValue)
          : item.currentValue;
      }
    }
  } catch {
    ElMessage.error("获取 OS 配置失败");
  } finally {
    loading.value = false;
  }
};

// ── 应用配置 ────────────────────────────────────────
const handleApply = async (item: ServerOsConfigItem) => {
  const value = editValues[item.key];
  const strValue = String(value ?? "");
  if (!strValue || strValue === item.currentValue) {
    return;
  }

  applyingKeys[item.key] = true;
  try {
    const res = await applyOsConfig(props.hostId, item.key, strValue);
    if (res.data?.success) {
      ElMessage.success(`"${item.name}" 已应用`);
      item.currentValue = res.data.newValue || value;
      // 重新加载以同步所有值
      await loadConfigs();
    } else {
      ElMessage.warning(res.data?.message || "应用失败");
    }
  } catch {
    ElMessage.error(`"${item.name}" 应用失败`);
  } finally {
    applyingKeys[item.key] = false;
  }
};

// ── 刷新 ────────────────────────────────────────────
const handleRefresh = () => {
  loadConfigs();
};

// ── 打开时初始化 ────────────────────────────────────
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      configItems.value = [];
      for (const key of Object.keys(editValues)) {
        delete editValues[key];
      }
      loadConfigs();
    }
  },
);
</script>

<style scoped lang="scss">
.server-os-config {
  display: grid;
  gap: 16px;
}

:deep(.el-dialog) {
  border-radius: 26px;
  overflow: hidden;
}

:deep(.el-dialog__header) {
  padding-bottom: 4px;
}

// ── 警告横幅 ──────────────────────────────────────
.server-os-config__warning {
  display: flex;
  gap: 12px;
  padding: 14px 18px;
  border-radius: 20px;
  background: rgba(251, 191, 36, 0.12);
  border: 1px solid rgba(251, 191, 36, 0.3);

  .server-os-config__warning-icon {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(251, 191, 36, 0.2);
    color: #b45309;
    font-size: 18px;
    font-weight: 700;
  }

  .server-os-config__warning-content {
    display: grid;
    gap: 4px;

    strong {
      color: #92400e;
      font-size: 14px;
    }

    p {
      margin: 0;
      color: #a16207;
      font-size: 13px;
      line-height: 1.6;
    }
  }
}

// ── 分组 ──────────────────────────────────────────
.server-os-config__group {
  display: grid;
  gap: 12px;
}

.server-os-config__group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 4px;

  .server-os-config__group-icon {
    font-size: 16px;
  }

  .server-os-config__group-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    letter-spacing: 0.3px;
  }

  .server-os-config__group-count {
    margin-left: auto;
    font-size: 11px;
    color: var(--el-text-color-secondary);
    background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
    padding: 2px 10px;
    border-radius: 10px;
  }
}

// ── 配置项卡片 ────────────────────────────────────
.server-os-config__items {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, 1fr);
}

.server-os-config__item {
  padding: 16px 18px;
  border-radius: 18px;
  background:
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.04), transparent 24%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.88));
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 6%, rgba(148, 163, 184, 0.14));
  box-shadow:
    0 4px 12px rgba(15, 23, 42, 0.03),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  display: grid;
  gap: 10px;

  &--unsupported {
    opacity: 0.55;
    filter: grayscale(0.3);
  }
}

.server-os-config__item-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.server-os-config__item-info {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.server-os-config__item-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.server-os-config__item-tip {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  color: var(--el-text-color-secondary);
  cursor: help;
  transition: all 0.2s;

  &:hover {
    color: var(--el-color-primary);
    background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  }
}

.server-os-config__item-unsupported-badge {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--el-color-warning) 12%, transparent);
  color: var(--el-color-warning);
  font-weight: 500;
  flex-shrink: 0;
}

// ── 配置项内容 ────────────────────────────────────
.server-os-config__item-body {
  display: grid;
  gap: 10px;
}

.server-os-config__item-description {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.server-os-config__item-controls {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.server-os-config__item-current {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.server-os-config__current-label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.server-os-config__current-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
  padding: 2px 10px;
  border-radius: 6px;
  font-family: "Cascadia Code", "Fira Code", monospace;
}

.server-os-config__item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.server-os-config__select {
  width: 130px;
}

.server-os-config__number-input {
  width: 130px;
}

@media (max-width: 1100px) {
  .server-os-config__items {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 720px) {
  .server-os-config__items {
    grid-template-columns: 1fr;
  }
}

// ── 底部 ──────────────────────────────────────────
.server-os-config__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>

<style>
/* 全局 tooltip 样式（popper-class 需要全局样式） */
.server-os-config__tooltip-popper {
  max-width: 420px;
  line-height: 1.7;
  font-size: 12px;
  white-space: pre-line;
}

.server-os-config__tooltip-popper strong {
  display: block;
  margin-top: 6px;
  font-size: 12px;
}

.server-os-config__tooltip-popper strong:first-child {
  margin-top: 0;
}
</style>

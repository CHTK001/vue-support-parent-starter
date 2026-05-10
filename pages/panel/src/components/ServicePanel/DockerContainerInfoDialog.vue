<template>
  <ElDialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="容器信息"
    width="680px"
    @close="handleClose"
  >
    <template #header>
      <div class="ci-header">
        <span class="ci-header__title">容器信息</span>
        <span v-if="binding" class="ci-header__subtitle">
          {{ binding.softwareName }} v{{ binding.softwareVersion }}
        </span>
      </div>
    </template>

    <div v-if="loading" class="ci-loading">
      <ElIcon class="is-loading" :size="24"><Loading /></ElIcon>
      <span>正在获取容器信息...</span>
    </div>

    <div v-else-if="error" class="ci-error">
      <IconifyIconOnline icon="ep:warning-filled" style="font-size: 24px; color: var(--el-color-danger)" />
      <span>{{ error }}</span>
      <ElButton size="small" @click="fetchInfo">重试</ElButton>
    </div>

    <template v-else>
      <!-- Basic info cards -->
      <div class="ci-basic">
        <div class="ci-basic__item">
          <span class="ci-basic__label">容器名</span>
          <span class="ci-basic__value">{{ info.containerName || serviceName || '-' }}</span>
        </div>
        <div class="ci-basic__item">
          <span class="ci-basic__label">镜像</span>
          <span class="ci-basic__value mono">{{ info.image || binding?.softwareCode || '-' }}</span>
        </div>
        <div class="ci-basic__item">
          <span class="ci-basic__label">状态</span>
          <ElTag :type="statusTagType" size="small">{{ statusLabel }}</ElTag>
        </div>
        <div v-if="info.createdAt" class="ci-basic__item">
          <span class="ci-basic__label">创建时间</span>
          <span class="ci-basic__value">{{ info.createdAt }}</span>
        </div>
      </div>

      <!-- Tabs -->
      <ElTabs v-model="activeTab" class="ci-tabs">
        <!-- Port mappings -->
        <ElTabPane label="端口映射" name="ports">
          <div v-if="portList.length === 0" class="ci-empty-tab">暂无端口映射</div>
          <ElTable v-else :data="portList" size="small" stripe>
            <ElTableColumn label="宿主机端口" prop="hostPort" width="140" />
            <ElTableColumn label="容器端口" prop="containerPort" width="140" />
            <ElTableColumn label="协议" prop="protocol" width="100" />
            <ElTableColumn label="映射关系">
              <template #default="{ row }">
                <code class="ci-mono">{{ row.hostPort }} → {{ row.containerPort }}/{{ row.protocol }}</code>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElTabPane>

        <!-- Volume mappings -->
        <ElTabPane label="卷挂载" name="volumes">
          <div v-if="volumeList.length === 0" class="ci-empty-tab">暂无卷挂载</div>
          <ElTable v-else :data="volumeList" size="small" stripe>
            <ElTableColumn label="宿主机路径" prop="hostPath" min-width="200" show-overflow-tooltip />
            <ElTableColumn label="容器路径" prop="containerPath" min-width="200" show-overflow-tooltip />
            <ElTableColumn label="模式" prop="mode" width="80" />
          </ElTable>
        </ElTabPane>

        <!-- Environment variables -->
        <ElTabPane label="环境变量" name="env">
          <div v-if="envList.length === 0" class="ci-empty-tab">暂无环境变量</div>
          <ElTable v-else :data="envList" size="small" stripe>
            <ElTableColumn label="变量名" prop="key" width="240">
              <template #default="{ row }">
                <code class="ci-mono">{{ row.key }}</code>
              </template>
            </ElTableColumn>
            <ElTableColumn label="值" prop="value">
              <template #default="{ row }">
                <span v-if="isSensitiveKey(row.key)" class="ci-sensitive">{{ row.masked }}</span>
                <code v-else class="ci-mono">{{ row.value }}</code>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElTabPane>

        <!-- Raw JSON -->
        <ElTabPane label="原始数据" name="raw">
          <div class="ci-raw-wrapper">
            <ElButton size="small" class="ci-raw-copy" @click="copyRaw">复制</ElButton>
            <pre class="ci-raw">{{ rawJson }}</pre>
          </div>
        </ElTabPane>
      </ElTabs>
    </template>

    <template #footer>
      <ElButton size="small" @click="fetchInfo" :loading="loading">刷新</ElButton>
      <ElButton @click="$emit('update:visible', false)">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import {
  ElButton,
  ElDialog,
  ElIcon,
  ElMessage,
  ElTabPane,
  ElTable,
  ElTableColumn,
  ElTabs,
  ElTag,
} from "element-plus";
import { Loading } from "@element-plus/icons-vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { http } from "@repo/utils";
import type { ReturnResult } from "@repo/utils";
import type { SoftwareBinding } from "../../api/software";
import { parseSoftwarePresetRemark } from "../../api/software";

const props = defineProps<{
  visible: boolean;
  binding: SoftwareBinding | null;
  containerName?: string;
}>();

defineEmits<{
  "update:visible": [val: boolean];
}>();

// ─── State ──────────────────────────────────────────────

const loading = ref(false);
const error = ref<string | null>(null);
const activeTab = ref("ports");

interface ContainerInfo {
  containerName: string;
  image: string;
  status: string;
  createdAt: string;
  ports: Record<string, any>;
  mounts: any[];
  env: string[];
  raw: any;
}

const info = ref<ContainerInfo>({
  containerName: "",
  image: "",
  status: "",
  createdAt: "",
  ports: {},
  mounts: [],
  env: [],
  raw: null,
});

// ─── Computed ───────────────────────────────────────────

const serviceName = computed(() => {
  if (props.containerName) return props.containerName;
  if (props.binding?.serviceName) return props.binding.serviceName;
  const remark = parseSoftwarePresetRemark(props.binding?.bindingRemark);
  return (remark as any).serviceName || "";
});

const statusTagType = computed(() => {
  const s = info.value.status.toLowerCase();
  if (s.includes("running")) return "success";
  if (s.includes("exited") || s.includes("dead")) return "danger";
  if (s.includes("paused")) return "warning";
  return "info";
});

const statusLabel = computed(() => {
  const s = info.value.status.toLowerCase();
  if (s.includes("running")) return "运行中";
  if (s.includes("exited")) return "已退出";
  if (s.includes("paused")) return "已暂停";
  if (s.includes("restarting")) return "重启中";
  return info.value.status || "未知";
});

interface PortEntry { hostPort: string; containerPort: string; protocol: string }
const portList = computed<PortEntry[]>(() => {
  const ports = info.value.ports;
  if (!ports || typeof ports !== "object") return [];
  const entries: PortEntry[] = [];
  for (const [containerKey, bindings] of Object.entries(ports)) {
    const match = containerKey.match(/^(\d+)\/(tcp|udp)$/);
    const containerPort = match ? match[1] : containerKey;
    const protocol = match ? match[2] : "tcp";
    if (Array.isArray(bindings)) {
      for (const b of bindings) {
        entries.push({
          hostPort: b.HostPort || "-",
          containerPort,
          protocol,
        });
      }
    } else if (bindings === null) {
      entries.push({ hostPort: "-", containerPort, protocol });
    }
  }
  return entries;
});

interface VolumeEntry { hostPath: string; containerPath: string; mode: string }
const volumeList = computed<VolumeEntry[]>(() => {
  const mounts = info.value.mounts;
  if (!Array.isArray(mounts)) return [];
  return mounts.map((m: any) => ({
    hostPath: m.Source || m.source || "-",
    containerPath: m.Destination || m.destination || "-",
    mode: m.Mode || m.mode || "rw",
  }));
});

interface EnvEntry { key: string; value: string; masked: string }
const envList = computed<EnvEntry[]>(() => {
  const env = info.value.env;
  if (!Array.isArray(env)) return [];
  return env.map((e: string) => {
    const idx = e.indexOf("=");
    const key = idx >= 0 ? e.slice(0, idx) : e;
    const value = idx >= 0 ? e.slice(idx + 1) : "";
    return { key, value, masked: "******" };
  });
});

const rawJson = computed(() => {
  if (!info.value.raw) return "{}";
  return JSON.stringify(info.value.raw, null, 2);
});

// ─── Sensitive key detection ────────────────────────────

const SENSITIVE_PATTERNS = /password|secret|token|key|credential|auth/i;
const isSensitiveKey = (key: string) => SENSITIVE_PATTERNS.test(key);

// ─── Fetch ──────────────────────────────────────────────

const fetchInfo = async () => {
  if (!props.binding) return;
  const bindingId = props.binding.sysProjectContainerSoftwareBindingId;
  if (!bindingId) return;

  loading.value = true;
  error.value = null;

  try {
    // Try backend API first
    const res = await http.request<ReturnResult<any>>("get", "/v2/project/container/software/binding/container-info", {
      params: { bindingId },
      showLoading: false,
    });

    if (res.code === "00000" && res.data) {
      const d = res.data;
      info.value = {
        containerName: d.containerName || serviceName.value || "",
        image: d.image || "",
        status: d.status || "",
        createdAt: d.createdAt || "",
        ports: d.ports || {},
        mounts: d.mounts || [],
        env: d.env || [],
        raw: d.raw || d,
      };
    } else {
      // Fallback: populate from bindingRemark
      populateFromRemark();
    }
  } catch {
    // Fallback: populate from bindingRemark
    populateFromRemark();
  } finally {
    loading.value = false;
  }
};

const populateFromRemark = () => {
  if (!props.binding) return;
  const remark = parseSoftwarePresetRemark(props.binding.bindingRemark);
  const docker = (remark as any).dockerDefaults || {};
  const envVars: string[] = [];
  if (docker.env) {
    for (const [k, v] of Object.entries(docker.env)) {
      envVars.push(`${k}=${v}`);
    }
  }

  info.value = {
    containerName: serviceName.value,
    image: docker.image || props.binding.softwareCode || "",
    status: props.binding.runtimeStatus || "UNKNOWN",
    createdAt: props.binding.createTime || "",
    ports: {},
    mounts: (docker.volumeMappings || []).map((v: any) => ({
      Source: v.hostPath,
      Destination: v.containerPath,
      Mode: v.readOnly ? "ro" : "rw",
    })),
    env: envVars,
    raw: { source: "bindingRemark", remark: remark },
  };
};

// ─── Copy raw ───────────────────────────────────────────

const copyRaw = () => {
  navigator.clipboard.writeText(rawJson.value).then(() => {
    ElMessage.success("已复制到剪贴板");
  });
};

// ─── Lifecycle ──────────────────────────────────────────

watch(
  () => props.visible,
  (val) => {
    if (val) fetchInfo();
  },
  { immediate: true },
);

const handleClose = () => {
  // Reset on close
  error.value = null;
};
</script>

<style scoped>
.ci-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ci-header__title {
  font-size: 15px;
  font-weight: 600;
}
.ci-header__subtitle {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.ci-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  padding: 60px 0;
  color: var(--el-text-color-secondary);
}

.ci-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 0;
  color: var(--el-text-color-secondary);
}

.ci-basic {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--dt-glass-bg-light);
  border-radius: var(--dt-radius-lg);
  border: 1px solid var(--dt-glass-border-light);
}
html.dark .ci-basic {
  background: var(--dt-glass-bg-dark);
}
.ci-basic__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ci-basic__label {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  font-weight: 500;
}
.ci-basic__value {
  font-size: 13px;
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.ci-tabs {
  margin-top: 4px;
}

.ci-empty-tab {
  text-align: center;
  padding: 40px 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.ci-mono {
  font-family: "Cascadia Code", "Fira Code", monospace;
  font-size: 12px;
  background: var(--el-fill-color-light);
  padding: 1px 6px;
  border-radius: 4px;
}

.ci-sensitive {
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  letter-spacing: 2px;
}

.ci-raw-wrapper {
  position: relative;
}
.ci-raw-copy {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
}
.ci-raw {
  background: #1e1e2e;
  color: #cdd6f4;
  padding: 16px;
  border-radius: var(--dt-radius-lg);
  font-family: "Cascadia Code", "Fira Code", monospace;
  font-size: 12px;
  line-height: 1.5;
  max-height: 400px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>

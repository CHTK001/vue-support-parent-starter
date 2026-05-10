<template>
  <ScDrawer
    v-model="visible"
    size="70%"
    destroy-on-close
    append-to-body
    :title="hostName ? `${hostName} · 系统日志` : '系统日志'"
    @open="onOpen"
    @close="onClose"
  >
    <ScScrollbar v-loading="loading" class="syslog-drawer__scroll">
      <template v-if="hostId > 0">
        <section class="syslog-drawer__hero">
          <div>
            <p class="syslog-drawer__eyebrow">System Logs</p>
            <h3>实时查看远程服务器系统日志，支持多源筛选与关键字检索</h3>
            <p class="syslog-drawer__hint">
              选择日志来源和日志级别，按关键字搜索定位问题，开启自动刷新持续追踪。
            </p>
          </div>
          <div class="server-chip-group">
            <el-tag class="server-inline-tag" effect="plain" round size="small">
              {{ hostName }}
            </el-tag>
            <el-tag class="server-inline-tag" effect="plain" round size="small">
              共 {{ logs.length }} 条
            </el-tag>
            <el-tag class="server-inline-tag" effect="plain" round size="small">
              来源 {{ sources.length }}
            </el-tag>
          </div>
        </section>

        <div class="syslog-drawer__toolbar">
          <div class="syslog-drawer__toolbar-row">
            <div class="syslog-drawer__filter-group">
              <el-select
                v-model="selectedSource"
                placeholder="日志来源"
                size="small"
                clearable
                class="syslog-drawer__filter-item"
                @change="loadLogs"
              >
                <el-option
                  v-for="src in sources"
                  :key="src.name"
                  :label="src.label"
                  :value="src.name"
                >
                  <span>{{ src.label }}</span>
                  <span class="syslog-drawer__source-desc">{{ src.description }}</span>
                </el-option>
              </el-select>

              <el-select
                v-model="levelFilter"
                placeholder="日志级别"
                size="small"
                class="syslog-drawer__filter-item"
                style="width: 130px"
                @change="loadLogs"
              >
                <el-option label="ALL" value="ALL" />
                <el-option label="INFO" value="INFO" />
                <el-option label="WARN" value="WARN" />
                <el-option label="ERROR" value="ERROR" />
                <el-option label="DEBUG" value="DEBUG" />
              </el-select>

              <el-input
                v-model="keyword"
                placeholder="搜索关键字"
                size="small"
                clearable
                class="syslog-drawer__filter-item"
                style="width: 200px"
                @keyup.enter="loadLogs"
              >
                <template #prefix>
                  <IconifyIconOnline icon="ri:search-line" />
                </template>
              </el-input>

              <ScButton size="small" plain @click="loadLogs">
                <IconifyIconOnline icon="ri:search-line" />
                <span>搜索</span>
              </ScButton>
            </div>

            <div class="syslog-drawer__action-group">
              <el-switch
                v-model="autoRefresh"
                size="small"
                active-text="自动刷新"
                inactive-text="自动刷新"
                @change="toggleAutoRefresh"
              />
              <ScButton size="small" plain :loading="loading" @click="loadLogs">
                <IconifyIconOnline icon="ri:refresh-line" />
                <span>刷新</span>
              </ScButton>
            </div>
          </div>
        </div>

        <div class="syslog-drawer__table-wrapper">
          <el-table
            :data="logs"
            style="width: 100%"
            size="small"
            stripe
            empty-text=""
            row-class-name="syslog-drawer__row"
            highlight-current-row
          >
            <el-table-column label="时间" prop="timestamp" width="180" min-width="140">
              <template #default="{ row }">
                <span class="syslog-drawer__timestamp">{{ row.timestamp || "-" }}</span>
              </template>
            </el-table-column>

            <el-table-column label="级别" width="100" min-width="80">
              <template #default="{ row }">
                <el-tag
                  class="server-inline-tag"
                  :type="levelTagType(row.level)"
                  effect="plain"
                  round
                  size="small"
                >
                  {{ row.level || "UNKNOWN" }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="来源" prop="source" width="140" min-width="100">
              <template #default="{ row }">
                <span class="syslog-drawer__source">{{ row.source || "-" }}</span>
              </template>
            </el-table-column>

            <el-table-column label="消息" prop="message" min-width="240">
              <template #default="{ row }">
                <span class="syslog-drawer__message">{{ row.message || "-" }}</span>
              </template>
            </el-table-column>
          </el-table>

          <el-empty
            v-if="!loading && logs.length === 0"
            description="暂无系统日志"
          />
        </div>
      </template>
      <el-empty v-else description="请选择服务器后再查看系统日志" />
    </ScScrollbar>
  </ScDrawer>
</template>

<script setup lang="ts">
import { ScButton } from "@repo/components/ScButton";
import { computed, ref } from "vue";
import { ScDrawer } from "@repo/components/ScDrawer";
import ScScrollbar from "@repo/components/ScScrollbar/src/index.vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { listHostSystemLogs, listHostLogSources } from "../api";
import type { SystemLogEntry, SystemLogSource } from "../api";

const props = defineProps<{
  modelValue: boolean;
  hostId: number;
  hostName: string;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

const loading = ref(false);
const logs = ref<SystemLogEntry[]>([]);
const sources = ref<SystemLogSource[]>([]);
const selectedSource = ref("");
const levelFilter = ref("ALL");
const keyword = ref("");
const autoRefresh = ref(false);
let timerHandle: ReturnType<typeof setInterval> | null = null;

const levelTagType = (level?: string): "primary" | "warning" | "danger" | "info" => {
  switch (level) {
    case "INFO":
      return "primary";
    case "WARN":
      return "warning";
    case "ERROR":
      return "danger";
    case "DEBUG":
      return "info";
    default:
      return "info";
  }
};

const loadSources = async () => {
  if (!props.hostId) {
    return;
  }
  try {
    const res = await listHostLogSources(props.hostId);
    sources.value = res.data ?? [];
  } catch {
    sources.value = [];
  }
};

const loadLogs = async () => {
  if (!props.hostId) {
    return;
  }
  loading.value = true;
  try {
    const query: Record<string, unknown> = {
      hostId: props.hostId,
    };
    if (selectedSource.value) {
      query.source = selectedSource.value;
    }
    if (levelFilter.value && levelFilter.value !== "ALL") {
      query.level = levelFilter.value;
    }
    if (keyword.value) {
      query.keyword = keyword.value;
    }
    query.limit = 200;

    const res = await listHostSystemLogs(query as any);
    logs.value = res.data ?? [];
  } catch {
    logs.value = [];
  } finally {
    loading.value = false;
  }
};

const startAutoRefresh = () => {
  stopAutoRefresh();
  timerHandle = setInterval(() => {
    loadLogs();
  }, 10000);
};

const stopAutoRefresh = () => {
  if (timerHandle !== null) {
    clearInterval(timerHandle);
    timerHandle = null;
  }
};

const toggleAutoRefresh = (val: boolean) => {
  if (val) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
};

const onOpen = () => {
  loadSources();
  loadLogs();
};

const onClose = () => {
  selectedSource.value = "";
  levelFilter.value = "ALL";
  keyword.value = "";
  autoRefresh.value = false;
  stopAutoRefresh();
  logs.value = [];
  sources.value = [];
};
</script>

<style scoped lang="scss">
.syslog-drawer__scroll {
  display: grid;
  gap: 14px;
  max-height: calc(100vh - 120px);
}

.syslog-drawer__hero {
  display: grid;
  gap: 12px;
  padding: 20px 22px;
  border-radius: 28px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background:
    radial-gradient(circle at top right, rgba(245, 158, 11, 0.08), transparent 24%),
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.14), transparent 34%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.92));
  box-shadow:
    0 18px 34px rgba(15, 23, 42, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.syslog-drawer__eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #2563eb;
}

.syslog-drawer__hero h3 {
  margin: 0;
  color: #0f172a;
}

.syslog-drawer__hint {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.7;
}

.syslog-drawer__toolbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 14px 16px;
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, rgba(96, 165, 250, 0.12), transparent 24%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.9));
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow:
    0 18px 30px rgba(15, 23, 42, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.82);
}

.syslog-drawer__toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  flex-wrap: wrap;
}

.syslog-drawer__filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.syslog-drawer__action-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.syslog-drawer__filter-item {
  :deep(.el-input__wrapper) {
    border-radius: 20px;
  }
}

.syslog-drawer__source-desc {
  float: right;
  color: #94a3b8;
  font-size: 11px;
  margin-left: 12px;
}

.syslog-drawer__table-wrapper {
  padding: 4px;
  border-radius: 26px;
  background:
    radial-gradient(circle at top right, rgba(245, 158, 11, 0.08), transparent 22%),
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.08), transparent 32%),
    rgba(248, 250, 252, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow:
    0 20px 36px rgba(15, 23, 42, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.78);
  overflow: hidden;

  :deep(.el-table) {
    --el-table-border-color: transparent;
    --el-table-header-bg-color: rgba(248, 250, 252, 0.8);
    --el-table-row-hover-bg-color: rgba(14, 165, 233, 0.06);
    --el-table-striped-row-bg-color: rgba(248, 250, 252, 0.5);
    border-radius: 22px;
  }

  :deep(.el-table__header-wrapper) {
    border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  }

  :deep(.el-table__body-wrapper) {
    &::-webkit-scrollbar {
      width: 5px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(148, 163, 184, 0.3);
      border-radius: 4px;
    }
  }
}

.syslog-drawer__timestamp {
  color: #64748b;
  font-size: 12px;
  font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace;
}

.syslog-drawer__source {
  color: #475569;
  font-size: 12px;
}

.syslog-drawer__message {
  color: #0f172a;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-all;
}

/* Shared chip/tag styles matching codebase */
.server-chip-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.server-inline-tag {
  --el-tag-border-color: rgba(148, 163, 184, 0.18);
  --el-tag-bg-color: rgba(255, 255, 255, 0.82);
  --el-tag-text-color: #475569;
  font-weight: 500;
}
</style>

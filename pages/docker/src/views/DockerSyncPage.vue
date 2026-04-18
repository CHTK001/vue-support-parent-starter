<template>
  <section class="docker-page-shell">
    <header class="page-hero">
      <div>
        <small>DOCKER / SYNC</small>
        <h1>同步中心</h1>
        <p>管理镜像和容器同步模式，支持手动、定时、禁用三种状态。</p>
      </div>
      <el-button :loading="loading" @click="loadSchedules">刷新</el-button>
    </header>

    <article class="panel-card">
      <header class="panel-card__header">
        <div>
          <strong>目标服务器</strong>
          <p>手动同步时会透传当前服务器筛选。</p>
        </div>
      </header>
      <el-select
        v-model="selectedServerIds"
        multiple
        clearable
        filterable
        style="width: 100%"
        placeholder="手动同步时可选服务器"
      >
        <el-option
          v-for="item in mergedOptions"
          :key="item.serverId"
          :label="`${item.serverName} (${item.host || '-'})`"
          :value="item.serverId"
        />
      </el-select>
    </article>

    <div class="sync-grid">
      <article v-for="scope in scopes" :key="scope.scope" class="panel-card">
        <header class="panel-card__header">
          <div>
            <strong>{{ scope.title }}</strong>
            <p>{{ scope.description }}</p>
          </div>
          <el-button :loading="scope.running" @click="runSync(scope.scope)">手动同步</el-button>
        </header>

        <el-form label-width="100px">
          <el-form-item label="同步模式">
            <el-select v-model="scope.form.syncMode" style="width: 100%">
              <el-option label="仅手动" value="manual" />
              <el-option label="定时同步" value="scheduled" />
              <el-option label="禁用同步" value="disabled" />
            </el-select>
          </el-form-item>
          <el-form-item label="调度类型">
            <el-select v-model="scope.form.scheduleType" style="width: 100%">
              <el-option label="Cron" value="cron" />
              <el-option label="Fixed" value="fixed" />
              <el-option label="Delay" value="delay" />
              <el-option label="None" value="none" />
            </el-select>
          </el-form-item>
          <el-form-item label="调度时间">
            <el-input v-model="scope.form.scheduleTime" placeholder="如 0 0/15 * * * ?" />
          </el-form-item>
          <el-form-item label="说明">
            <el-input v-model="scope.form.description" />
          </el-form-item>
        </el-form>

        <div class="sync-meta">
          <span>当前模式：{{ scope.view?.syncMode || "-" }}</span>
          <span>最近触发：{{ formatTime(scope.view?.lastTriggerAt) }}</span>
          <span>下次触发：{{ formatTime(scope.view?.nextTriggerAt) }}</span>
        </div>

        <div class="sync-actions">
          <el-switch
            :model-value="scope.form.syncMode === 'scheduled'"
            active-text="启用定时"
            inactive-text="非定时"
            @change="handleScheduleToggle(scope, $event)"
          />
          <el-button type="primary" :loading="scope.saving" @click="saveScope(scope.scope)">保存配置</el-button>
        </div>

        <div v-if="scope.result" class="sync-result">
          <strong>最近一次手动同步</strong>
          <p>
            服务器 {{ scope.result.serverCount }} 台，新增 {{ scope.result.createdCount }}，
            更新 {{ scope.result.updatedCount }}，删除 {{ scope.result.deletedCount }}，
            失败 {{ scope.result.failedCount }}，耗时 {{ scope.result.durationMs || 0 }} ms
          </p>
          <ul>
            <li v-for="item in scope.result.serverResults" :key="`${scope.scope}-${item.serverId}`">
              server={{ item.serverId }} / {{ item.message }}
              <template v-if="item.errorDetail"> / {{ item.errorDetail }}</template>
            </li>
          </ul>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { message } from "@repo/utils";
import {
  getDockerSyncSchedule,
  runDockerSync,
  updateDockerSyncSchedule,
} from "../api";
import type {
  DockerSyncResult,
  DockerSyncScheduleUpdateRequest,
  DockerSyncScheduleView,
} from "../types";
import { useDockerServerSelection } from "../composables/useDockerServerSelection";

type ScopeState = {
  scope: "images" | "containers";
  title: string;
  description: string;
  saving: boolean;
  running: boolean;
  view: DockerSyncScheduleView | null;
  result: DockerSyncResult | null;
  form: DockerSyncScheduleUpdateRequest;
};

const loading = ref(false);
const selectedServerIds = ref<number[]>([]);
const { mergedOptions, loadServers } = useDockerServerSelection();

const scopes = reactive<ScopeState[]>([
  {
    scope: "images",
    title: "镜像同步",
    description: "把远端 Docker 镜像同步到本地数据库。",
    saving: false,
    running: false,
    view: null,
    result: null,
    form: { syncMode: "manual", scheduleType: "cron", scheduleTime: "0 0/15 * * * ?" },
  },
  {
    scope: "containers",
    title: "容器同步",
    description: "把远端 Docker 容器同步到本地数据库。",
    saving: false,
    running: false,
    view: null,
    result: null,
    form: { syncMode: "manual", scheduleType: "cron", scheduleTime: "0 0/5 * * * ?" },
  },
]);

const loadScope = async (scopeState: ScopeState) => {
  const result = await getDockerSyncSchedule(scopeState.scope);
  scopeState.view = result.data || null;
  Object.assign(scopeState.form, {
    syncMode: result.data?.syncMode || "manual",
    scheduleType: result.data?.scheduleType || "cron",
    scheduleTime: result.data?.scheduleTime || "",
    description: result.data?.description || "",
  });
};

const loadSchedules = async () => {
  loading.value = true;
  try {
    await Promise.all([loadServers(), ...scopes.map(loadScope)]);
  } catch (error: any) {
    message(error?.message || error?.msg || "加载同步配置失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

const saveScope = async (scope: ScopeState["scope"]) => {
  const target = scopes.find((item) => item.scope === scope);
  if (!target) {
    return;
  }
  target.saving = true;
  try {
    const result = await updateDockerSyncSchedule(scope, { ...target.form });
    target.view = result.data || null;
    message(`${target.title}配置已保存`, { type: "success" });
  } catch (error: any) {
    message(error?.message || error?.msg || `${target.title}配置保存失败`, { type: "error" });
  } finally {
    target.saving = false;
  }
};

const runSync = async (scope: ScopeState["scope"]) => {
  const target = scopes.find((item) => item.scope === scope);
  if (!target) {
    return;
  }
  target.running = true;
  try {
    const result = await runDockerSync(scope, {
      serverIds: selectedServerIds.value.length ? selectedServerIds.value : undefined,
      deleteAbsent: true,
    });
    target.result = result.data || null;
    message(`${target.title}执行完成`, { type: "success" });
    await loadScope(target);
  } catch (error: any) {
    message(error?.message || error?.msg || `${target.title}执行失败`, { type: "error" });
  } finally {
    target.running = false;
  }
};

const handleScheduleToggle = (scopeState: ScopeState, enabled: boolean | string | number) => {
  scopeState.form.syncMode = enabled ? "scheduled" : "manual";
};

const formatTime = (value?: number) => {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString();
};

onMounted(loadSchedules);
</script>

<style scoped lang="scss">
.docker-page-shell {
  display: grid;
  gap: 18px;
}

.page-hero,
.panel-card {
  padding: 18px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(241, 245, 249, 0.88));
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.06);
}

.page-hero,
.panel-card__header,
.sync-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.sync-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.sync-meta {
  display: grid;
  gap: 8px;
  color: #64748b;
  font-size: 13px;
}

.sync-result {
  padding: 14px;
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.sync-result strong {
  color: #0f172a;
}

.sync-result p,
.sync-result li,
.page-hero small,
.panel-card__header p {
  color: #64748b;
}

.sync-result ul {
  margin: 10px 0 0;
  padding-left: 18px;
}

@media (max-width: 960px) {
  .sync-grid {
    grid-template-columns: 1fr;
  }
}
</style>

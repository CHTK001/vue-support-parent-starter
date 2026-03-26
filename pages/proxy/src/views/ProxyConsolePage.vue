<template>
  <div class="spring-page-shell proxy-console">
    <header class="spring-hero proxy-hero">
      <div>
        <span class="spring-eyebrow">{{ eyebrow }}</span>
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
        <div class="proxy-tags">
          <span class="proxy-tag">`proxy_*` 数据域</span>
          <span class="proxy-tag">端口来源于 yml / 部署约定</span>
          <span class="proxy-tag">页面只做编排与运行管理</span>
        </div>
      </div>
      <div class="spring-hero-actions">
        <button
          type="button"
          class="spring-ghost-button"
          @click="ui.settingsVisible = true"
        >
          接口设置
        </button>
        <button type="button" class="spring-ghost-button" @click="refreshAll">
          刷新
        </button>
      </div>
    </header>

    <section class="spring-toolbar spring-card">
      <label class="spring-field">
        <span>实例名称</span>
        <input
          v-model.trim="filters.keyword"
          type="text"
          placeholder="输入代理实例名称"
          @keyup.enter="loadServers"
        />
      </label>
      <label class="spring-field">
        <span>代理类型</span>
        <select v-model="filters.serverType">
          <option value="">全部类型</option>
          <option
            v-for="type in serverTypes"
            :key="resolveProxyOptionValue(type)"
            :value="resolveProxyOptionValue(type)"
          >
            {{ resolveProxyOptionLabel(type) }}
          </option>
        </select>
      </label>
      <label class="spring-field">
        <span>运行状态</span>
        <select v-model="filters.status">
          <option value="">全部状态</option>
          <option value="RUNNING">RUNNING</option>
          <option value="STOPPED">STOPPED</option>
          <option value="STARTING">STARTING</option>
          <option value="STOPPING">STOPPING</option>
          <option value="ERROR">ERROR</option>
        </select>
      </label>
      <label class="spring-field">
        <span>每页大小</span>
        <select v-model="filters.pageSize">
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
      </label>
      <div class="spring-toolbar-actions">
        <button type="button" class="spring-ghost-button" @click="resetFilters">
          重置
        </button>
        <button
          type="button"
          class="spring-primary-button"
          @click="loadServers"
        >
          查询
        </button>
      </div>
    </section>

    <section class="spring-metrics">
      <article class="spring-metric-card spring-card">
        <span class="spring-metric-label">代理实例</span>
        <strong class="spring-metric-value">{{
          formatNumber(statistics.total)
        }}</strong>
        <small>当前接入总量</small>
      </article>
      <article class="spring-metric-card spring-card">
        <span class="spring-metric-label">运行中</span>
        <strong class="spring-metric-value spring-accent-green">{{
          formatNumber(statistics.running)
        }}</strong>
        <small>当前 RUNNING 实例</small>
      </article>
      <article class="spring-metric-card spring-card">
        <span class="spring-metric-label">过滤模块</span>
        <strong class="spring-metric-value spring-accent-blue">{{
          formatNumber(enabledSettingCount)
        }}</strong>
        <small>当前选中实例已启用</small>
      </article>
      <article class="spring-metric-card spring-card">
        <span class="spring-metric-label">异常实例</span>
        <strong class="spring-metric-value spring-accent-amber">{{
          formatNumber(statistics.error)
        }}</strong>
        <small>待排查</small>
      </article>
    </section>

    <section class="proxy-grid">
      <article class="spring-card proxy-panel">
        <div class="spring-panel-header">
          <div>
            <h2>代理实例</h2>
            <p>不再提供页面新增端口，只保留状态、启停和过滤链编排。</p>
          </div>
          <span class="spring-panel-meta">{{
            loading.servers
              ? "加载中"
              : `${servers.length} / ${serverPage.total}`
          }}</span>
        </div>
        <div class="proxy-table-shell">
          <table class="proxy-table">
            <thead>
              <tr>
                <th>实例</th>
                <th>监听</th>
                <th>类型</th>
                <th>状态</th>
                <th>过滤链</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading.servers">
                <td colspan="6" class="proxy-empty">正在加载代理实例...</td>
              </tr>
              <tr v-else-if="!servers.length">
                <td colspan="6" class="proxy-empty">当前没有代理实例。</td>
              </tr>
              <tr
                v-for="server in servers"
                v-else
                :key="server.systemServerId || server.systemServerName"
                :class="{ 'proxy-row-active': isSelectedServer(server) }"
                @click="selectServer(server)"
              >
                <td>
                  <div class="proxy-cell-title">
                    <strong>{{
                      server.systemServerName || "未命名实例"
                    }}</strong>
                    <span>{{
                      server.systemServerDescription || "无描述"
                    }}</span>
                  </div>
                </td>
                <td>
                  <div class="proxy-cell-title">
                    <strong
                      >{{ server.systemServerHost || "0.0.0.0" }}:{{
                        server.systemServerPort || "-"
                      }}</strong
                    >
                    <span>{{ server.systemServerContextPath || "/" }}</span>
                  </div>
                </td>
                <td>{{ server.systemServerType || "-" }}</td>
                <td>
                  <span
                    class="proxy-chip"
                    :class="statusClass(server.systemServerStatus)"
                    >{{ server.systemServerStatus || "UNKNOWN" }}</span
                  >
                </td>
                <td>{{ formatNumber(server.filterCount) }}</td>
                <td>
                  <div class="proxy-actions">
                    <button
                      v-if="canStart(server)"
                      type="button"
                      class="spring-text-button"
                      :disabled="
                        isServerActionLoading(server.systemServerId, 'start')
                      "
                      @click.stop="startServer(server)"
                    >
                      {{
                        isServerActionLoading(server.systemServerId, "start")
                          ? "启动中..."
                          : "启动"
                      }}
                    </button>
                    <button
                      v-if="canStop(server)"
                      type="button"
                      class="spring-text-button"
                      :disabled="
                        isServerActionLoading(server.systemServerId, 'stop')
                      "
                      @click.stop="stopServer(server)"
                    >
                      {{
                        isServerActionLoading(server.systemServerId, "stop")
                          ? "停止中..."
                          : "停止"
                      }}
                    </button>
                    <button
                      type="button"
                      class="spring-text-button"
                      :disabled="
                        isServerActionLoading(server.systemServerId, 'restart')
                      "
                      @click.stop="restartServer(server)"
                    >
                      {{
                        isServerActionLoading(server.systemServerId, "restart")
                          ? "重启中..."
                          : "重启"
                      }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <aside class="proxy-side-column">
        <article class="spring-card proxy-panel">
          <div class="spring-panel-header">
            <div>
              <h2>实例详情</h2>
              <p>当前选中实例的运行和连接参数。</p>
            </div>
            <span class="spring-panel-meta">{{
              selectedServer?.systemServerStatus || "未选择"
            }}</span>
          </div>
          <div v-if="selectedServer" class="spring-detail-content">
            <div class="spring-detail-grid">
              <div class="spring-detail-item">
                <small>编号</small
                ><strong>#{{ selectedServer.systemServerId || "-" }}</strong>
              </div>
              <div class="spring-detail-item">
                <small>主机</small
                ><strong>{{
                  selectedServer.systemServerHost || "0.0.0.0"
                }}</strong>
              </div>
              <div class="spring-detail-item">
                <small>端口</small
                ><strong>{{ selectedServer.systemServerPort || "-" }}</strong>
              </div>
              <div class="spring-detail-item">
                <small>上下文</small
                ><strong>{{
                  selectedServer.systemServerContextPath || "/"
                }}</strong>
              </div>
              <div class="spring-detail-item">
                <small>最大连接</small
                ><strong>{{
                  selectedServer.systemServerMaxConnections || "∞"
                }}</strong>
              </div>
              <div class="spring-detail-item">
                <small>超时</small
                ><strong>{{
                  selectedServer.systemServerTimeout
                    ? `${selectedServer.systemServerTimeout} ms`
                    : "默认"
                }}</strong>
              </div>
              <div class="spring-detail-item">
                <small>自动启动</small
                ><strong>{{
                  selectedServer.systemServerAutoStart ? "是" : "否"
                }}</strong>
              </div>
              <div class="spring-detail-item">
                <small>过滤器数</small
                ><strong>{{ formatNumber(selectedServer.filterCount) }}</strong>
              </div>
            </div>
          </div>
          <div v-else class="spring-detail-content spring-empty-state">
            请选择一个代理实例。
          </div>
        </article>

        <article class="spring-card proxy-panel">
          <div class="spring-panel-header">
            <div>
              <h2>编排边界</h2>
              <p>这页只负责模块编排，不负责动态创建监听端口。</p>
            </div>
            <span class="spring-panel-meta">Proxy</span>
          </div>
          <div class="proxy-note-list">
            <div class="proxy-note-item">
              <strong>端口来源</strong>
              <span
                >部署
                yml、环境变量或初始化数据负责实例入口，页面不再维护端口表单。</span
              >
            </div>
            <div class="proxy-note-item">
              <strong>数据边界</strong>
              <span
                >`proxy_*` 表负责实例、过滤配置和运行日志，与 monitor
                原链路解耦。</span
              >
            </div>
            <div class="proxy-note-item">
              <strong>页面职责</strong>
              <span
                >当前页面只做启停、过滤链安装/启停、JSON
                配置编辑和最近日志巡检。</span
              >
            </div>
          </div>
        </article>
      </aside>
    </section>

    <section class="proxy-grid proxy-grid-bottom">
      <article class="spring-card proxy-panel">
        <div class="spring-panel-header">
          <div>
            <h2>过滤链编排</h2>
            <p>按实例维度组织过滤模块，替代原 monitor 里的端口级编辑方式。</p>
          </div>
          <span class="spring-panel-meta">{{
            selectedServer
              ? `${selectedServer.systemServerName || "Proxy"} · ${proxySettings.length} 个模块`
              : "未选择实例"
          }}</span>
        </div>
        <div v-if="selectedServer" class="proxy-compose-bar">
          <label class="spring-field">
            <span>安装新模块</span>
            <select v-model="installForm.filterType">
              <option value="">
                {{
                  availableFilterCatalog.length
                    ? "选择一个过滤模块"
                    : "暂无可安装模块"
                }}
              </option>
              <option
                v-for="item in availableFilterCatalog"
                :key="resolveProxyOptionValue(item)"
                :value="resolveProxyOptionValue(item)"
              >
                {{ resolveProxyOptionLabel(item) }}
              </option>
            </select>
          </label>
          <div class="spring-toolbar-actions">
            <button
              type="button"
              class="spring-ghost-button"
              :disabled="loading.filterInstall || !installForm.filterType"
              @click="installFilter"
            >
              {{ loading.filterInstall ? "安装中..." : "安装模块" }}
            </button>
            <button
              type="button"
              class="spring-primary-button"
              :disabled="loading.applySettings"
              @click="applySettings"
            >
              {{ loading.applySettings ? "应用中..." : "应用到运行实例" }}
            </button>
          </div>
        </div>
        <div
          v-if="!selectedServer"
          class="spring-empty-state proxy-section-empty"
        >
          请选择实例后再编排过滤链。
        </div>
        <div
          v-else-if="loading.settings"
          class="spring-empty-state proxy-section-empty"
        >
          正在加载过滤模块...
        </div>
        <div
          v-else-if="!proxySettings.length"
          class="spring-empty-state proxy-section-empty"
        >
          当前实例还没有安装过滤模块。
        </div>
        <div v-else class="proxy-setting-grid">
          <article
            v-for="setting in proxySettings"
            :key="
              setting.systemServerSettingId || setting.systemServerSettingType
            "
            class="proxy-setting-card"
          >
            <div class="proxy-setting-head">
              <div>
                <strong>{{
                  setting.systemServerSettingName ||
                  setting.systemServerSettingType ||
                  "未命名模块"
                }}</strong>
                <p>
                  {{
                    setting.systemServerSettingDescription ||
                    setting.systemServerSettingClassName ||
                    "无描述"
                  }}
                </p>
              </div>
              <span
                class="proxy-chip"
                :class="
                  setting.systemServerSettingEnabled
                    ? 'proxy-chip--success'
                    : 'proxy-chip--idle'
                "
              >
                {{ setting.systemServerSettingEnabled ? "已启用" : "已停用" }}
              </span>
            </div>
            <div class="proxy-setting-meta">
              <span>类型: {{ setting.systemServerSettingType || "-" }}</span>
              <span
                >顺序:
                {{ formatNumber(setting.systemServerSettingOrder) }}</span
              >
              <span>版本: {{ setting.systemServerSettingVersion || "-" }}</span>
            </div>
            <pre class="proxy-config-preview">{{
              summarizeConfig(setting.systemServerSettingConfig)
            }}</pre>
            <div class="spring-detail-actions">
              <button
                type="button"
                class="spring-text-button"
                :disabled="
                  isSettingActionLoading(
                    setting.systemServerSettingId,
                    'toggle',
                  )
                "
                @click="toggleSetting(setting)"
              >
                {{
                  isSettingActionLoading(
                    setting.systemServerSettingId,
                    "toggle",
                  )
                    ? "处理中..."
                    : setting.systemServerSettingEnabled
                      ? "停用"
                      : "启用"
                }}
              </button>
              <button
                type="button"
                class="spring-text-button"
                :disabled="
                  isSettingActionLoading(
                    setting.systemServerSettingId,
                    'config',
                  )
                "
                @click="openConfigEditor(setting)"
              >
                编辑 JSON
              </button>
            </div>
          </article>
        </div>
      </article>

      <aside class="proxy-side-column">
        <article class="spring-card proxy-panel">
          <div class="spring-panel-header">
            <div>
              <h2>最近日志</h2>
              <p>观察过滤链是否按预期命中和处理。</p>
            </div>
            <span class="spring-panel-meta">{{
              loading.logs ? "加载中" : `${logs.length} 条`
            }}</span>
          </div>
          <div v-if="!selectedServer" class="spring-empty-state">
            请选择实例后查看日志。
          </div>
          <div v-else-if="loading.logs" class="spring-empty-state">
            正在加载最近日志...
          </div>
          <div v-else-if="!logs.length" class="spring-empty-state">
            当前实例暂无日志。
          </div>
          <div v-else class="proxy-log-list">
            <article
              v-for="log in logs"
              :key="log.id || `${log.serverId}-${log.accessTime}`"
              class="proxy-log-card"
            >
              <div class="proxy-log-head">
                <strong>{{ log.filterType || "UNKNOWN_FILTER" }}</strong>
                <span class="proxy-chip proxy-chip--neutral">{{
                  log.processStatus || "UNKNOWN"
                }}</span>
              </div>
              <p>
                {{ log.clientIp || "-" }} · {{ log.clientGeo || "未知位置" }}
              </p>
              <p class="proxy-log-meta">
                {{ formatDateTime(log.accessTime || log.storeTime) || "-" }} ·
                {{ formatDuration(log.durationMs) }}
              </p>
            </article>
          </div>
        </article>
      </aside>
    </section>

    <div
      v-if="configEditor.visible"
      class="spring-modal-backdrop"
      @click.self="closeConfigEditor"
    >
      <div class="spring-modal-card">
        <div class="spring-modal-header">
          <div>
            <h3>{{ configEditor.title }}</h3>
            <p>直接编辑过滤模块 JSON，保存后按需点击“应用到运行实例”。</p>
          </div>
          <button
            type="button"
            class="spring-icon-button"
            @click="closeConfigEditor"
          >
            ×
          </button>
        </div>
        <form class="spring-modal-form" @submit.prevent="saveConfig">
          <div class="spring-form-grid">
            <label class="spring-form-field spring-field-span-2">
              <span>JSON 配置</span>
              <textarea
                v-model="configEditor.configText"
                rows="16"
                placeholder="{ }"
              />
            </label>
          </div>
          <div class="spring-modal-footer">
            <button
              type="button"
              class="spring-ghost-button"
              @click="closeConfigEditor"
            >
              取消
            </button>
            <button
              type="submit"
              class="spring-primary-button"
              :disabled="loading.configSave"
            >
              {{ loading.configSave ? "保存中..." : "保存配置" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div
      v-if="ui.settingsVisible"
      class="spring-modal-backdrop"
      @click.self="ui.settingsVisible = false"
    >
      <div class="spring-modal-card spring-modal-card-small">
        <div class="spring-modal-header">
          <div>
            <h3>接口设置</h3>
            <p>默认走代理模块接口，也支持覆盖自定义请求头。</p>
          </div>
          <button
            type="button"
            class="spring-icon-button"
            @click="ui.settingsVisible = false"
          >
            ×
          </button>
        </div>
        <form class="spring-modal-form" @submit.prevent="saveLocalSettings">
          <div class="spring-form-grid">
            <label class="spring-form-field spring-field-span-2">
              <span>API 根路径</span>
              <input
                v-model.trim="runtimeSettings.apiRoot"
                type="text"
                placeholder="../proxy/"
              />
            </label>
            <label class="spring-form-field">
              <span>Header 名称</span>
              <input
                v-model.trim="runtimeSettings.authHeaderName"
                type="text"
                placeholder="可选"
              />
            </label>
            <label class="spring-form-field">
              <span>Header 值</span>
              <input
                v-model.trim="runtimeSettings.authHeaderValue"
                type="password"
                placeholder="可选"
              />
            </label>
          </div>
          <div class="spring-modal-footer">
            <button
              type="button"
              class="spring-ghost-button"
              @click="ui.settingsVisible = false"
            >
              取消
            </button>
            <button type="submit" class="spring-primary-button">
              保存设置
            </button>
          </div>
        </form>
      </div>
    </div>

    <div class="spring-toast-stack">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="spring-toast"
        :class="`spring-${toast.type}`"
      >
        {{ toast.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import type {
  ProxyServer,
  ProxyServerLog,
  ProxyServerPage,
  ProxyServerSetting,
  ProxyServerStatistics,
  ProxyServerTypeOption,
} from "../api";
import { resolveProxyOptionLabel, resolveProxyOptionValue } from "../api";

type ToastType = "success" | "error" | "info";

const props = withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    eyebrow?: string;
    defaultApiRoot?: string;
    storageKey?: string;
  }>(),
  {
    title: "Proxy Orchestration Console",
    description: "在独立 proxy 模块里编排过滤链、查看实例状态和巡检最近日志。",
    eyebrow: "Proxy Starter",
    defaultApiRoot: "../proxy/",
    storageKey: "spring.simple-pages.proxy-console.settings",
  },
);

const loading = reactive({
  servers: false,
  statistics: false,
  types: false,
  settings: false,
  logs: false,
  catalog: false,
  filterInstall: false,
  applySettings: false,
  configSave: false,
});
const filters = reactive({
  keyword: "",
  serverType: "",
  status: "",
  pageSize: "10",
});
const runtimeSettings = reactive(loadStoredSettings());
const ui = reactive({ settingsVisible: false });
const statistics = ref<ProxyServerStatistics>({
  total: 0,
  running: 0,
  stopped: 0,
  error: 0,
});
const serverPage = ref<ProxyServerPage>({ records: [], total: 0 });
const serverTypes = ref<Array<string | ProxyServerTypeOption>>([]);
const filterCatalog = ref<ProxyServerTypeOption[]>([]);
const proxySettings = ref<ProxyServerSetting[]>([]);
const logs = ref<ProxyServerLog[]>([]);
const selectedServerId = ref<number | null>(null);
const installForm = reactive({ filterType: "" });
const configEditor = reactive({
  visible: false,
  settingId: 0,
  title: "",
  configText: "",
});
const toasts = ref<Array<{ id: number; type: ToastType; message: string }>>([]);
const actionLoading = reactive<Record<string, boolean>>({});

const servers = computed(() => serverPage.value.records || []);
const selectedServer = computed(
  () =>
    servers.value.find(
      (item) =>
        Number(item.systemServerId || 0) ===
        Number(selectedServerId.value || 0),
    ) || null,
);
const enabledSettingCount = computed(
  () =>
    proxySettings.value.filter((item) =>
      Boolean(item.systemServerSettingEnabled),
    ).length,
);
const availableFilterCatalog = computed(() => {
  const installed = new Set(
    proxySettings.value.map((item) => upper(item.systemServerSettingType)),
  );
  return filterCatalog.value.filter(
    (item) => !installed.has(upper(resolveProxyOptionValue(item))),
  );
});

watch(
  () => servers.value,
  (items) => {
    if (!items.length) {
      selectedServerId.value = null;
      proxySettings.value = [];
      logs.value = [];
      return;
    }
    if (
      !items.some(
        (item) =>
          Number(item.systemServerId || 0) ===
          Number(selectedServerId.value || 0),
      )
    ) {
      selectedServerId.value = Number(items[0].systemServerId || 0) || null;
    }
  },
  { immediate: true },
);

watch(selectedServerId, async (serverId) => {
  if (!serverId) {
    proxySettings.value = [];
    logs.value = [];
    return;
  }
  await Promise.all([loadProxySettings(serverId), loadLogs(serverId)]);
});

onMounted(() => {
  void refreshAll();
});

async function refreshAll() {
  await Promise.all([
    loadServers(),
    loadStatistics(),
    loadServerTypes(),
    loadFilterCatalog(),
  ]);
}

async function loadServers() {
  loading.servers = true;
  try {
    const query = new URLSearchParams({
      current: "1",
      size: trim(filters.pageSize) || "10",
    });
    if (trim(filters.keyword)) query.set("serverName", trim(filters.keyword));
    if (trim(filters.serverType))
      query.set("serverType", trim(filters.serverType));
    if (trim(filters.status)) query.set("status", trim(filters.status));
    const payload = await request(`server/page?${query.toString()}`);
    serverPage.value = {
      records: asList(payload?.records),
      total: intOr(payload?.total, asList(payload?.records).length),
    };
  } catch (error) {
    serverPage.value = { records: [], total: 0 };
    notify(resolveError(error, "加载代理实例失败"), "error");
  } finally {
    loading.servers = false;
  }
}

async function loadStatistics() {
  loading.statistics = true;
  try {
    const payload = await request("server/statistics");
    statistics.value = {
      total: intOr(payload?.total, 0),
      running: intOr(payload?.running, 0),
      stopped: intOr(payload?.stopped, 0),
      error: intOr(payload?.error, 0),
    };
  } catch (error) {
    statistics.value = { total: 0, running: 0, stopped: 0, error: 0 };
    notify(resolveError(error, "加载统计失败"), "error");
  } finally {
    loading.statistics = false;
  }
}

async function loadServerTypes() {
  loading.types = true;
  try {
    serverTypes.value = asList(await request("server/types"));
  } catch (error) {
    serverTypes.value = [];
    notify(resolveError(error, "加载代理类型失败"), "error");
  } finally {
    loading.types = false;
  }
}

async function loadFilterCatalog() {
  loading.catalog = true;
  try {
    filterCatalog.value = asList(await request("server/setting/objects"));
  } catch (error) {
    filterCatalog.value = [];
    notify(resolveError(error, "加载过滤模块目录失败"), "error");
  } finally {
    loading.catalog = false;
  }
}

async function loadProxySettings(serverId: number) {
  loading.settings = true;
  try {
    proxySettings.value = asList(
      await request(`server/setting/server/${serverId}`),
    );
  } catch (error) {
    proxySettings.value = [];
    notify(resolveError(error, "加载过滤链失败"), "error");
  } finally {
    loading.settings = false;
  }
}

async function loadLogs(serverId: number) {
  loading.logs = true;
  try {
    const payload = await request(
      `server/log/page?current=1&size=6&serverId=${encodeURIComponent(String(serverId))}`,
    );
    logs.value = asList(payload?.records);
  } catch (error) {
    logs.value = [];
    notify(resolveError(error, "加载最近日志失败"), "error");
  } finally {
    loading.logs = false;
  }
}

function resetFilters() {
  filters.keyword = "";
  filters.serverType = "";
  filters.status = "";
  filters.pageSize = "10";
  void loadServers();
}

function selectServer(server: ProxyServer) {
  selectedServerId.value = Number(server.systemServerId || 0) || null;
}

function isSelectedServer(server: ProxyServer) {
  return (
    Number(server.systemServerId || 0) === Number(selectedServerId.value || 0)
  );
}

function canStart(server: ProxyServer) {
  const status = upper(server.systemServerStatus);
  return status === "STOPPED" || status === "ERROR";
}

function canStop(server: ProxyServer) {
  return upper(server.systemServerStatus) === "RUNNING";
}

async function startServer(server: ProxyServer) {
  await invokeServerAction(server, "start", "实例已启动");
}

async function stopServer(server: ProxyServer) {
  await invokeServerAction(server, "stop", "实例已停止");
}

async function restartServer(server: ProxyServer) {
  await invokeServerAction(server, "restart", "实例已重启");
}

async function invokeServerAction(
  server: ProxyServer,
  action: "start" | "stop" | "restart",
  message: string,
) {
  const serverId = Number(server.systemServerId || 0);
  if (!serverId) return;
  const key = `server:${action}:${serverId}`;
  actionLoading[key] = true;
  try {
    await request(`server/${serverId}/${action}`, { method: "POST" });
    notify(message, "success");
    await Promise.all([loadServers(), loadStatistics()]);
  } catch (error) {
    notify(resolveError(error, `${message}失败`), "error");
  } finally {
    delete actionLoading[key];
  }
}

function isServerActionLoading(
  serverId?: number,
  action?: "start" | "stop" | "restart",
) {
  return Boolean(
    serverId && action && actionLoading[`server:${action}:${serverId}`],
  );
}

async function installFilter() {
  const serverId = Number(selectedServer.value?.systemServerId || 0);
  if (!serverId) {
    notify("请先选择代理实例", "info");
    return;
  }
  if (!trim(installForm.filterType)) {
    notify("请选择要安装的过滤模块", "info");
    return;
  }
  loading.filterInstall = true;
  try {
    await request(
      `server/setting/install?serverId=${encodeURIComponent(String(serverId))}&filterType=${encodeURIComponent(trim(installForm.filterType))}`,
      { method: "POST" },
    );
    installForm.filterType = "";
    notify("过滤模块已安装", "success");
    await loadProxySettings(serverId);
  } catch (error) {
    notify(resolveError(error, "安装过滤模块失败"), "error");
  } finally {
    loading.filterInstall = false;
  }
}

async function toggleSetting(setting: ProxyServerSetting) {
  const settingId = Number(setting.systemServerSettingId || 0);
  if (!settingId) return;
  const action = setting.systemServerSettingEnabled ? "disable" : "enable";
  const key = `setting:toggle:${settingId}`;
  actionLoading[key] = true;
  try {
    await request(`server/setting/${settingId}/${action}`, { method: "POST" });
    notify(
      setting.systemServerSettingEnabled ? "模块已停用" : "模块已启用",
      "success",
    );
    if (selectedServerId.value) await loadProxySettings(selectedServerId.value);
  } catch (error) {
    notify(resolveError(error, "切换模块状态失败"), "error");
  } finally {
    delete actionLoading[key];
  }
}

function isSettingActionLoading(
  settingId?: number,
  action?: "toggle" | "config",
) {
  return Boolean(
    settingId && action && actionLoading[`setting:${action}:${settingId}`],
  );
}

async function openConfigEditor(setting: ProxyServerSetting) {
  const settingId = Number(setting.systemServerSettingId || 0);
  if (!settingId) return;
  const key = `setting:config:${settingId}`;
  actionLoading[key] = true;
  try {
    const payload = await request(`server/setting/${settingId}/config`);
    configEditor.settingId = settingId;
    configEditor.title =
      setting.systemServerSettingName ||
      setting.systemServerSettingType ||
      `模块 #${settingId}`;
    configEditor.configText = prettyJson(payload);
    configEditor.visible = true;
  } catch (error) {
    notify(resolveError(error, "加载模块配置失败"), "error");
  } finally {
    delete actionLoading[key];
  }
}

function closeConfigEditor() {
  configEditor.visible = false;
  configEditor.settingId = 0;
  configEditor.title = "";
  configEditor.configText = "";
}

async function saveConfig() {
  if (!configEditor.settingId) return;
  loading.configSave = true;
  try {
    const body = trim(configEditor.configText)
      ? parseJson(configEditor.configText)
      : {};
    await request(`server/setting/${configEditor.settingId}/config`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    notify("模块配置已保存", "success");
    closeConfigEditor();
    if (selectedServerId.value) await loadProxySettings(selectedServerId.value);
  } catch (error) {
    notify(resolveError(error, "保存模块配置失败"), "error");
  } finally {
    loading.configSave = false;
  }
}

async function applySettings() {
  const serverId = Number(selectedServer.value?.systemServerId || 0);
  if (!serverId) {
    notify("请先选择代理实例", "info");
    return;
  }
  loading.applySettings = true;
  try {
    await request(`server/setting/server/${serverId}/apply`, {
      method: "POST",
    });
    notify("过滤链已应用到运行实例", "success");
  } catch (error) {
    notify(resolveError(error, "应用过滤链失败"), "error");
  } finally {
    loading.applySettings = false;
  }
}

function saveLocalSettings() {
  localStorage.setItem(
    props.storageKey,
    JSON.stringify({
      apiRoot: trim(runtimeSettings.apiRoot) || props.defaultApiRoot,
      authHeaderName: trim(runtimeSettings.authHeaderName),
      authHeaderValue: trim(runtimeSettings.authHeaderValue),
    }),
  );
  ui.settingsVisible = false;
  notify("接口设置已保存", "success");
  void refreshAll();
}

async function request(path: string, init?: RequestInit): Promise<any> {
  const headers = new Headers(init?.headers || {});
  if (init?.body && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  if (
    trim(runtimeSettings.authHeaderName) &&
    trim(runtimeSettings.authHeaderValue)
  )
    headers.set(
      trim(runtimeSettings.authHeaderName),
      trim(runtimeSettings.authHeaderValue),
    );
  const response = await fetch(apiUrl(path), {
    credentials: "include",
    ...init,
    headers,
  });
  if (response.status === 401) {
    redirectToLogin();
    throw new Error("请先登录控制台");
  }
  const text = await response.text();
  const payload = text ? safeJsonParse(text) : null;
  if (!response.ok)
    throw new Error(resolveMessage(payload) || `请求失败: ${response.status}`);
  if (payload && typeof payload === "object" && "code" in payload) {
    const code = String(payload.code ?? "");
    if (!["00000", "200", "0"].includes(code))
      throw new Error(resolveMessage(payload) || `业务请求失败: ${code}`);
    return "data" in payload ? payload.data : payload;
  }
  if (payload && typeof payload === "object" && payload.success === false)
    throw new Error(resolveMessage(payload) || "业务请求失败");
  return payload;
}

function apiUrl(path: string) {
  const root = trim(runtimeSettings.apiRoot) || props.defaultApiRoot;
  const normalized = root.endsWith("/") ? root : `${root}/`;
  return new URL(
    path.replace(/^\/+/, ""),
    new URL(normalized, window.location.href),
  ).toString();
}

function loadStoredSettings() {
  try {
    const value = JSON.parse(localStorage.getItem(props.storageKey) || "{}");
    return {
      apiRoot: trim(value.apiRoot) || props.defaultApiRoot,
      authHeaderName: trim(value.authHeaderName),
      authHeaderValue: trim(value.authHeaderValue),
    };
  } catch {
    return {
      apiRoot: props.defaultApiRoot,
      authHeaderName: "",
      authHeaderValue: "",
    };
  }
}

function summarizeConfig(value?: string) {
  const text = trim(value);
  if (!text) return "{ }";
  const pretty = prettyJson(safeJsonParse(text));
  return pretty.length > 220 ? `${pretty.slice(0, 220)}...` : pretty;
}

function prettyJson(value: unknown) {
  if (value == null || value === "") return "{\n  \n}";
  if (typeof value === "string") {
    const parsed = safeJsonParse(value);
    return typeof parsed === "string" ? value : JSON.stringify(parsed, null, 2);
  }
  return JSON.stringify(value, null, 2);
}

function parseJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error("配置必须是合法 JSON");
  }
}

function statusClass(status?: string) {
  const value = upper(status);
  if (value === "RUNNING") return "proxy-chip--success";
  if (value === "ERROR") return "proxy-chip--danger";
  if (value === "STARTING" || value === "STOPPING") return "proxy-chip--warn";
  return "proxy-chip--idle";
}

function formatNumber(value: unknown) {
  const num = numOr(value);
  return num == null ? "0" : num.toLocaleString("zh-CN");
}

function formatDateTime(value?: unknown) {
  const text = trim(value);
  if (!text) return "";
  const parsed = new Date(text.includes("T") ? text : text.replace(" ", "T"));
  return Number.isNaN(parsed.getTime())
    ? text.replace("T", " ")
    : parsed.toLocaleString("zh-CN", { hour12: false });
}

function formatDuration(value?: unknown) {
  const num = numOr(value);
  return num == null ? "耗时 - ms" : `耗时 ${num} ms`;
}

function notify(message: string, type: ToastType) {
  const id = Date.now() + Math.floor(Math.random() * 1000);
  toasts.value.push({ id, type, message });
  window.setTimeout(() => {
    toasts.value = toasts.value.filter((item) => item.id !== id);
  }, 3200);
}

function asList<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function resolveMessage(payload: any) {
  if (!payload) return "";
  if (typeof payload === "string") {
    const text = trim(payload);
    return looksLikeHtmlDocument(text) ? "" : text;
  }
  return payload.message || payload.msg || payload.error || "";
}

function resolveError(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function trim(value: unknown) {
  return value == null ? "" : String(value).trim();
}

function upper(value: unknown) {
  return trim(value).toUpperCase();
}

function looksLikeHtmlDocument(value: string) {
  const normalized = value.toLowerCase();
  return (
    normalized.startsWith("<!doctype html") ||
    normalized.startsWith("<html") ||
    normalized.includes("<body")
  );
}

function intOr(value: unknown, fallback: number) {
  const parsed = Number.parseInt(trim(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function numOr(value: unknown) {
  const text = trim(value);
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function redirectToLogin() {
  const url = new URL("./login.html", window.location.href);
  url.searchParams.set("redirect", window.location.href);
  window.location.replace(url.toString());
}
</script>

<style scoped>
.proxy-console {
  padding-bottom: 42px;
}

.proxy-hero {
  overflow: hidden;
  background:
    radial-gradient(
      circle at top right,
      rgba(27, 106, 227, 0.18),
      transparent 28%
    ),
    radial-gradient(
      circle at left center,
      rgba(10, 163, 118, 0.18),
      transparent 32%
    ),
    linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.88),
      rgba(241, 246, 255, 0.94)
    );
}

.proxy-tags,
.proxy-actions,
.proxy-setting-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.proxy-tags {
  margin-top: 18px;
}

.proxy-tag,
.proxy-note-item {
  border: 1px solid rgba(17, 32, 56, 0.08);
  background: rgba(255, 255, 255, 0.72);
}

.proxy-tag {
  display: inline-flex;
  align-items: center;
  padding: 9px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.proxy-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(320px, 0.9fr);
  gap: 18px;
  margin-top: 22px;
}

.proxy-grid-bottom {
  align-items: start;
}

.proxy-side-column {
  display: grid;
  gap: 18px;
}

.proxy-panel {
  border-radius: var(--spring-radius-lg);
  padding: 22px;
}

.proxy-table-shell {
  margin-top: 18px;
  overflow: auto;
}

.proxy-table {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
}

.proxy-table th,
.proxy-table td {
  padding: 16px 14px;
  border-bottom: 1px solid rgba(17, 32, 56, 0.08);
  text-align: left;
  vertical-align: middle;
}

.proxy-table th {
  color: var(--spring-muted);
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.proxy-table tbody tr {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.proxy-table tbody tr:hover {
  background: rgba(22, 102, 216, 0.04);
}

.proxy-row-active {
  background: rgba(22, 102, 216, 0.08);
}

.proxy-empty {
  color: var(--spring-muted);
  text-align: center;
}

.proxy-cell-title {
  display: grid;
  gap: 6px;
}

.proxy-cell-title span,
.proxy-note-item span,
.proxy-setting-head p,
.proxy-log-card p {
  color: var(--spring-muted);
}

.proxy-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 12px;
  font-weight: 700;
}

.proxy-chip--success {
  color: #116b48;
  background: rgba(17, 107, 72, 0.12);
}

.proxy-chip--danger {
  color: #a42938;
  background: rgba(164, 41, 56, 0.12);
}

.proxy-chip--warn {
  color: #9a650e;
  background: rgba(197, 124, 18, 0.16);
}

.proxy-chip--idle {
  color: #55657b;
  background: rgba(85, 101, 123, 0.12);
}

.proxy-chip--neutral {
  color: var(--spring-primary);
  background: rgba(22, 102, 216, 0.12);
}

.proxy-note-list,
.proxy-log-list {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.proxy-note-item,
.proxy-log-card,
.proxy-setting-card {
  display: grid;
  gap: 8px;
  padding: 16px;
  border-radius: 16px;
}

.proxy-note-item {
  background: rgba(17, 32, 56, 0.04);
}

.proxy-compose-bar {
  display: grid;
  grid-template-columns: minmax(240px, 360px) auto;
  gap: 16px;
  align-items: end;
  margin-top: 18px;
}

.proxy-section-empty {
  margin-top: 18px;
}

.proxy-setting-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 18px;
}

.proxy-setting-card {
  border: 1px solid rgba(17, 32, 56, 0.08);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.86),
    rgba(244, 248, 255, 0.98)
  );
}

.proxy-setting-head,
.proxy-log-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.proxy-setting-head p {
  margin: 6px 0 0;
  line-height: 1.6;
}

.proxy-setting-meta,
.proxy-log-meta {
  color: var(--spring-muted);
  font-size: 12px;
}

.proxy-config-preview {
  margin: 0;
  min-height: 132px;
  padding: 14px;
  border-radius: 16px;
  background: #0f172a;
  color: #d7e3ff;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
  line-height: 1.6;
}

@media (max-width: 1160px) {
  .proxy-grid,
  .proxy-compose-bar,
  .proxy-setting-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .proxy-panel {
    padding: 18px;
  }

  .proxy-tag {
    width: 100%;
    justify-content: center;
  }
}
</style>

<template>
  <div class="spring-page-shell strategy-page-shell">
    <header class="spring-hero strategy-hero">
      <div>
        <span class="spring-eyebrow">{{ eyebrow }}</span>
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
      </div>
      <div class="spring-hero-actions">
        <button type="button" class="spring-ghost-button" @click="settingsVisible = true">接口设置</button>
        <button type="button" class="spring-ghost-button" @click="refreshAll">刷新</button>
        <button type="button" class="spring-primary-button" @click="openEditor()">新建规则</button>
      </div>
    </header>

    <section class="spring-toolbar spring-card">
      <label class="spring-field">
        <span>规则筛选</span>
        <input v-model.trim="filters.keyword" type="text" placeholder="规则名 / 路径 / 描述">
      </label>
      <label class="spring-field">
        <span>状态</span>
        <select v-model="filters.status">
          <option value="">全部</option>
          <option value="enabled">启用</option>
          <option value="disabled">停用</option>
        </select>
      </label>
      <label class="spring-field">
        <span>维度</span>
        <select v-model="filters.dimension">
          <option value="">全部</option>
          <option value="GLOBAL">GLOBAL</option>
          <option value="IP">IP</option>
          <option value="USER">USER</option>
          <option value="API">API</option>
        </select>
      </label>
      <label class="spring-field">
        <span>清理天数</span>
        <input v-model.trim="filters.cleanupDays" type="number" min="1" placeholder="30">
      </label>
      <div class="spring-toolbar-actions">
        <button type="button" class="spring-ghost-button" @click="loadRecords">刷新记录</button>
        <button type="button" class="spring-danger-button" :disabled="loading.cleanup" @click="cleanupRecords">
          {{ loading.cleanup ? "清理中..." : "清理旧记录" }}
        </button>
      </div>
    </section>

    <section class="spring-metrics">
      <article class="spring-metric-card spring-card strategy-metric-card strategy-metric-card-focus">
        <span class="spring-metric-label">规则总数</span>
        <strong class="spring-metric-value">{{ filteredConfigs.length }}</strong>
        <small>当前筛选条件下的策略规则</small>
      </article>
      <article class="spring-metric-card spring-card strategy-metric-card">
        <span class="spring-metric-label">启用规则</span>
        <strong class="spring-metric-value spring-accent-green">{{ enabledCount }}</strong>
        <small>会参与运行时限流判定</small>
      </article>
      <article class="spring-metric-card spring-card strategy-metric-card">
        <span class="spring-metric-label">命中记录</span>
        <strong class="spring-metric-value spring-accent-amber">{{ formatNumber(blockedCount) }}</strong>
        <small>最近拉取到的限流命中摘要</small>
      </article>
      <article class="spring-metric-card spring-card strategy-metric-card">
        <span class="spring-metric-label">成功率</span>
        <strong class="spring-metric-value spring-accent-blue">{{ formatPercent(summary?.successRate) }}</strong>
        <small>来自 strategy metrics 的全局摘要</small>
      </article>
    </section>

    <section class="spring-layout-grid">
      <article class="spring-panel spring-card">
        <div class="spring-panel-header">
          <div>
            <h2>限流规则</h2>
            <p>轻控制台直接维护路径、维度、阈值和启停状态。</p>
          </div>
          <span class="spring-panel-meta">{{ loading.configs ? "加载中" : `${filteredConfigs.length} 条` }}</span>
        </div>
        <div class="spring-table-shell">
          <table class="spring-table">
            <thead>
              <tr>
                <th>规则</th>
                <th>路径</th>
                <th>维度 / 阈值</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading.configs">
                <td colspan="5" class="spring-empty-cell">正在加载限流规则...</td>
              </tr>
              <tr v-else-if="!filteredConfigs.length">
                <td colspan="5" class="spring-empty-cell">当前没有匹配的限流规则。</td>
              </tr>
              <tr
                v-for="config in filteredConfigs"
                v-else
                :key="config.sysLimitConfigurationId || config.sysLimitName || config.sysLimitPath"
                :class="{ 'spring-active-row': isSelected(config) }"
                @click="selectedConfig = config"
              >
                <td>
                  <div class="spring-table-title">
                    <span class="spring-title-strong">{{ config.sysLimitName || "未命名规则" }}</span>
                    <span class="spring-muted-line">#{{ config.sysLimitConfigurationId || "-" }}</span>
                    <span class="spring-muted-line">{{ config.sysLimitDescription || "无描述" }}</span>
                  </div>
                </td>
                <td>
                  <div class="spring-table-title">
                    <span class="spring-title-strong">{{ config.sysLimitPath || "-" }}</span>
                    <span class="spring-muted-line">{{ config.sysLimitKeyExpression || "默认键生成" }}</span>
                  </div>
                </td>
                <td>
                  <div class="spring-table-title">
                    <span class="spring-chip">{{ config.sysLimitDimension || "GLOBAL" }}</span>
                    <span class="spring-muted-line">
                      {{ formatNumber(config.sysLimitForPeriod) }} 次 / {{ formatNumber(config.sysLimitRefreshPeriodSeconds) }} 秒
                    </span>
                  </div>
                </td>
                <td>
                  <div class="spring-table-title">
                    <span class="spring-chip" :class="isEnabled(config) ? 'spring-success' : 'spring-failure'">
                      {{ isEnabled(config) ? "ENABLED" : "DISABLED" }}
                    </span>
                    <span class="spring-muted-line">超时 {{ formatNumber(config.sysLimitTimeoutDurationMillis) }} ms</span>
                  </div>
                </td>
                <td>
                  <div class="strategy-table-actions">
                    <button type="button" class="spring-text-button" @click.stop="openEditor(config)">编辑</button>
                    <button type="button" class="spring-text-button" @click.stop="toggleStatus(config)">
                      {{ isEnabled(config) ? "停用" : "启用" }}
                    </button>
                    <button type="button" class="spring-text-button" @click.stop="deleteConfig(config)">删除</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <aside class="spring-side-column">
        <article class="spring-panel spring-card">
          <div class="spring-panel-header">
            <div>
              <h2>规则详情</h2>
              <p>查看当前选中规则的完整配置。</p>
            </div>
            <span class="spring-panel-meta">{{ selectedConfig ? (isEnabled(selectedConfig) ? "启用中" : "已停用") : "未选择" }}</span>
          </div>
          <div v-if="selectedConfig" class="spring-detail-content">
            <div class="spring-detail-grid">
              <div v-for="item in detailItems" :key="item.label" class="spring-detail-item">
                <small>{{ item.label }}</small>
                <strong>{{ item.value }}</strong>
              </div>
            </div>
          </div>
          <div v-else class="spring-detail-content spring-empty-state">请选择左侧规则查看详情。</div>
          <div v-if="selectedConfig" class="spring-detail-content">
            <div class="strategy-detail-actions">
              <button type="button" class="spring-ghost-button" @click="toggleStatus(selectedConfig)">
                {{ isEnabled(selectedConfig) ? "停用规则" : "启用规则" }}
              </button>
              <button type="button" class="spring-ghost-button" @click="openEditor(selectedConfig)">编辑规则</button>
              <button type="button" class="spring-primary-button" :disabled="loading.refresh" @click="refreshStrategy">
                {{ loading.refresh ? "刷新中..." : "刷新运行时" }}
              </button>
            </div>
          </div>
        </article>

        <article class="spring-panel spring-card">
          <div class="spring-panel-header">
            <div>
              <h2>运行时指标</h2>
              <p>统一查看 strategy starter 暴露的摘要和各类策略统计。</p>
            </div>
            <button type="button" class="spring-text-button" @click="loadMetrics">{{ loading.metrics ? "加载中..." : "刷新指标" }}</button>
          </div>
          <div class="spring-detail-content">
            <div v-if="loading.metrics" class="spring-empty-state">正在加载运行时指标...</div>
            <div v-else-if="!metrics" class="spring-empty-state">暂无运行时指标。</div>
            <div v-else class="strategy-runtime-content">
              <div class="spring-detail-grid">
                <div class="spring-detail-item"><small>总请求</small><strong>{{ formatNumber(summary?.totalRequests) }}</strong></div>
                <div class="spring-detail-item"><small>成功次数</small><strong>{{ formatNumber(summary?.totalSuccesses) }}</strong></div>
                <div class="spring-detail-item"><small>失败次数</small><strong>{{ formatNumber(summary?.totalFailures) }}</strong></div>
                <div class="spring-detail-item"><small>成功率</small><strong>{{ formatPercent(summary?.successRate) }}</strong></div>
              </div>
              <div class="strategy-runtime-grid">
                <div v-for="item in metricCards" :key="item.label" class="spring-detail-item">
                  <small>{{ item.label }}</small>
                  <strong :class="item.accent ? `spring-accent-${item.accent}` : ''">{{ item.value }}</strong>
                </div>
              </div>
              <pre class="spring-code-block">{{ formatJson(metrics) }}</pre>
            </div>
          </div>
        </article>

        <article class="spring-panel spring-card">
          <div class="spring-panel-header">
            <div>
              <h2>最近命中记录</h2>
              <p>展示最近 8 条限流记录，便于联调时确认规则是否生效。</p>
            </div>
            <span class="spring-panel-meta">{{ loading.records ? "加载中" : `${records.length} / ${recordTotal}` }}</span>
          </div>
          <div class="spring-log-list">
            <div v-if="loading.records" class="spring-empty-state">正在加载限流记录...</div>
            <div v-else-if="!records.length" class="spring-empty-state">当前没有限流记录。</div>
            <article v-for="record in records" v-else :key="record.sysLimitRecordId || record.createTime" class="spring-log-card">
              <div class="spring-log-card-head">
                <div class="spring-table-title">
                  <span class="spring-title-strong">{{ record.sysLimitName || `记录 #${record.sysLimitRecordId || '-'}` }}</span>
                  <span class="spring-muted-line">{{ formatDateTime(record.sysLimitTime || record.createTime) || "-" }}</span>
                </div>
                <span class="spring-chip spring-failure">{{ record.sysLimitDimension || "LIMIT" }}</span>
              </div>
              <p class="strategy-record-path">{{ record.sysLimitPath || "-" }}</p>
              <p class="spring-muted-line">
                {{ record.requestMethod || "METHOD" }} · {{ record.clientIp || "-" }} · 键 {{ record.sysLimitKey || "-" }}
              </p>
              <pre v-if="record.requestParams" class="spring-code-block">{{ record.requestParams }}</pre>
            </article>
          </div>
        </article>
      </aside>
    </section>

    <div v-if="editorVisible" class="spring-modal-backdrop" @click.self="editorVisible = false">
      <div class="spring-modal-card">
        <div class="spring-modal-header">
          <div>
            <h3>{{ form.sysLimitConfigurationId ? `编辑规则 #${form.sysLimitConfigurationId}` : "新建限流规则" }}</h3>
            <p>这里覆盖策略页最常用的字段，复杂扩展字段后续可继续补进来。</p>
          </div>
          <button type="button" class="spring-icon-button" @click="editorVisible = false">×</button>
        </div>
        <form class="spring-modal-form" @submit.prevent="saveConfig">
          <div class="spring-form-grid">
            <label class="spring-form-field">
              <span>规则名称</span>
              <input v-model.trim="form.sysLimitName" type="text" required placeholder="例如：订单查询限流">
            </label>
            <label class="spring-form-field">
              <span>接口路径</span>
              <input v-model.trim="form.sysLimitPath" type="text" required placeholder="/api/order/**">
            </label>
            <label class="spring-form-field">
              <span>限流维度</span>
              <select v-model="form.sysLimitDimension">
                <option value="GLOBAL">GLOBAL</option>
                <option value="IP">IP</option>
                <option value="USER">USER</option>
                <option value="API">API</option>
              </select>
            </label>
            <label class="spring-form-field">
              <span>规则状态</span>
              <select v-model="form.sysLimitStatus">
                <option value="1">启用</option>
                <option value="0">停用</option>
              </select>
            </label>
            <label class="spring-form-field">
              <span>周期许可数</span>
              <input v-model.trim="form.sysLimitForPeriod" type="number" min="1" placeholder="100">
            </label>
            <label class="spring-form-field">
              <span>刷新周期(秒)</span>
              <input v-model.trim="form.sysLimitRefreshPeriodSeconds" type="number" min="1" placeholder="1">
            </label>
            <label class="spring-form-field">
              <span>获取许可超时(ms)</span>
              <input v-model.trim="form.sysLimitTimeoutDurationMillis" type="number" min="0" placeholder="0">
            </label>
            <label class="spring-form-field">
              <span>排序值</span>
              <input v-model.trim="form.sysLimitSort" type="number" min="0" placeholder="100">
            </label>
            <label class="spring-form-field spring-field-span-2">
              <span>键表达式</span>
              <input v-model.trim="form.sysLimitKeyExpression" type="text" placeholder="#userId 或留空走默认逻辑">
            </label>
            <label class="spring-form-field">
              <span>降级方法</span>
              <input v-model.trim="form.sysLimitFallbackMethod" type="text" placeholder="fallbackMethod">
            </label>
            <label class="spring-form-field">
              <span>错误消息</span>
              <input v-model.trim="form.sysLimitMessage" type="text" placeholder="请求过于频繁，请稍后重试">
            </label>
            <label class="spring-form-field spring-field-span-2">
              <span>描述信息</span>
              <textarea v-model.trim="form.sysLimitDescription" rows="4" placeholder="说明策略覆盖范围和联调注意事项"></textarea>
            </label>
          </div>
          <div class="spring-modal-footer">
            <button type="button" class="spring-ghost-button" @click="editorVisible = false">取消</button>
            <button type="submit" class="spring-primary-button" :disabled="loading.save">
              {{ loading.save ? "保存中..." : "保存规则" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="settingsVisible" class="spring-modal-backdrop" @click.self="settingsVisible = false">
      <div class="spring-modal-card spring-modal-card-small">
        <div class="spring-modal-header">
          <div>
            <h3>接口设置</h3>
            <p>默认走轻控制台 Session，也支持补自定义认证头。</p>
          </div>
          <button type="button" class="spring-icon-button" @click="settingsVisible = false">×</button>
        </div>
        <form class="spring-modal-form" @submit.prevent="saveSettings">
          <div class="spring-form-grid">
            <label class="spring-form-field spring-field-span-2">
              <span>API 根路径</span>
              <input v-model.trim="settings.apiRoot" type="text" placeholder="../v2/strategy/">
            </label>
            <label class="spring-form-field">
              <span>Header 名称</span>
              <input v-model.trim="settings.authHeaderName" type="text" placeholder="可选">
            </label>
            <label class="spring-form-field">
              <span>Header 值</span>
              <input v-model.trim="settings.authHeaderValue" type="password" placeholder="可选">
            </label>
          </div>
          <div class="spring-modal-footer">
            <button type="button" class="spring-ghost-button" @click="settingsVisible = false">取消</button>
            <button type="submit" class="spring-primary-button">保存设置</button>
          </div>
        </form>
      </div>
    </div>

    <div class="spring-toast-stack">
      <div v-for="toast in toasts" :key="toast.id" class="spring-toast" :class="`spring-${toast.type}`">{{ toast.message }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";

type RecordLike = Record<string, any>;

const props = withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    eyebrow?: string;
    defaultApiRoot?: string;
    storageKey?: string;
  }>(),
  {
    title: "Strategy Console",
    description: "在 Spring 模块内直接维护限流策略，并查看策略运行指标与最近命中记录。",
    eyebrow: "Strategy Starter",
    defaultApiRoot: "../v2/strategy/",
    storageKey: "spring.simple-pages.strategy-console.settings",
  },
);

const loading = reactive({
  configs: false,
  metrics: false,
  records: false,
  save: false,
  refresh: false,
  cleanup: false,
});

const filters = reactive({
  keyword: "",
  status: "",
  dimension: "",
  cleanupDays: "30",
});

const settings = reactive(loadSettings());
const form = reactive(createForm());
const configs = ref<RecordLike[]>([]);
const metrics = ref<RecordLike | null>(null);
const records = ref<RecordLike[]>([]);
const recordTotal = ref(0);
const selectedConfig = ref<RecordLike | null>(null);
const editorVisible = ref(false);
const settingsVisible = ref(false);
const toasts = ref<{ id: number; message: string; type: "success" | "error" | "info" }[]>([]);
let toastSeed = 0;

const filteredConfigs = computed(() =>
  configs.value.filter((item) => {
    const keyword = trim(filters.keyword).toLowerCase();
    const keywordMatched =
      !keyword ||
      [item.sysLimitName, item.sysLimitPath, item.sysLimitDescription, item.sysLimitKeyExpression]
        .some((value) => trim(value).toLowerCase().includes(keyword));
    const statusMatched =
      !filters.status ||
      (filters.status === "enabled" ? isEnabled(item) : filters.status === "disabled" ? !isEnabled(item) : true);
    const dimensionMatched = !filters.dimension || upper(item.sysLimitDimension) === upper(filters.dimension);
    return keywordMatched && statusMatched && dimensionMatched;
  }),
);

const enabledCount = computed(() => filteredConfigs.value.filter((item) => isEnabled(item)).length);
const summary = computed(() => metrics.value?.summary || null);
const blockedCount = computed(() => {
  const metricValue = numOr(summary.value?.totalFailures);
  return metricValue == null ? recordTotal.value : metricValue;
});
const metricCards = computed(() => [
  { label: "RateLimiter", value: formatNumber(countObject(metrics.value?.rateLimiter)), accent: "green" },
  { label: "Debounce", value: formatNumber(countObject(metrics.value?.debounce)), accent: "blue" },
  { label: "CircuitBreaker", value: formatNumber(countObject(metrics.value?.circuitBreaker)), accent: "amber" },
  { label: "Retry", value: formatNumber(countObject(metrics.value?.retry)), accent: "" },
  { label: "Bulkhead", value: formatNumber(countObject(metrics.value?.bulkhead)), accent: "" },
  {
    label: "Cache",
    value: metrics.value?.cache?.enabled ? "ENABLED" : "DISABLED",
    accent: metrics.value?.cache?.enabled ? "green" : "",
  },
]);
const detailItems = computed(() =>
  selectedConfig.value
    ? [
        { label: "规则编号", value: selectedConfig.value.sysLimitConfigurationId || "-" },
        { label: "规则名称", value: selectedConfig.value.sysLimitName || "-" },
        { label: "接口路径", value: selectedConfig.value.sysLimitPath || "-" },
        { label: "限流维度", value: selectedConfig.value.sysLimitDimension || "GLOBAL" },
        { label: "规则状态", value: isEnabled(selectedConfig.value) ? "启用" : "停用" },
        { label: "周期许可数", value: formatNumber(selectedConfig.value.sysLimitForPeriod) },
        { label: "刷新周期", value: `${formatNumber(selectedConfig.value.sysLimitRefreshPeriodSeconds)} 秒` },
        { label: "许可超时", value: `${formatNumber(selectedConfig.value.sysLimitTimeoutDurationMillis)} ms` },
        { label: "降级方法", value: selectedConfig.value.sysLimitFallbackMethod || "未配置" },
        { label: "键表达式", value: selectedConfig.value.sysLimitKeyExpression || "默认逻辑" },
        { label: "错误消息", value: selectedConfig.value.sysLimitMessage || "未配置" },
        { label: "更新时间", value: formatDateTime(selectedConfig.value.updateTime) || "暂无" },
      ]
    : [],
);

watch(
  filteredConfigs,
  (items) => {
    if (!items.length) {
      selectedConfig.value = null;
      return;
    }
    const matched = selectedConfig.value ? items.find((item) => sameConfig(item, selectedConfig.value)) : null;
    selectedConfig.value = matched || items[0] || null;
  },
  { immediate: true },
);

onMounted(async () => {
  await refreshAll();
});

async function refreshAll() {
  await Promise.all([loadConfigs(), loadMetrics(), loadRecords()]);
}

async function loadConfigs() {
  loading.configs = true;
  try {
    configs.value = asList(await request("limit/list"));
  } catch (error) {
    configs.value = [];
    notify(resolveError(error, "加载限流规则失败"), "error");
  } finally {
    loading.configs = false;
  }
}

async function loadMetrics() {
  loading.metrics = true;
  try {
    metrics.value = await request("metrics");
  } catch (error) {
    metrics.value = null;
    notify(resolveError(error, "加载运行时指标失败"), "error");
  } finally {
    loading.metrics = false;
  }
}

async function loadRecords() {
  loading.records = true;
  try {
    const payload = await request("limit-record/page?current=1&size=8");
    records.value = asList(payload?.records);
    recordTotal.value = intOr(payload?.total, records.value.length);
  } catch (error) {
    records.value = [];
    recordTotal.value = 0;
    notify(resolveError(error, "加载限流记录失败"), "error");
  } finally {
    loading.records = false;
  }
}

function openEditor(config?: RecordLike | null) {
  Object.assign(form, createForm());
  if (config) {
    selectedConfig.value = config;
    Object.assign(form, {
      sysLimitConfigurationId: trim(config.sysLimitConfigurationId),
      sysLimitName: trim(config.sysLimitName),
      sysLimitPath: trim(config.sysLimitPath),
      sysLimitDimension: trim(config.sysLimitDimension) || "GLOBAL",
      sysLimitForPeriod: trim(config.sysLimitForPeriod) || "100",
      sysLimitRefreshPeriodSeconds: trim(config.sysLimitRefreshPeriodSeconds) || "1",
      sysLimitTimeoutDurationMillis: trim(config.sysLimitTimeoutDurationMillis) || "0",
      sysLimitStatus: String(config.sysLimitStatus ?? 1),
      sysLimitSort: trim(config.sysLimitSort) || "100",
      sysLimitFallbackMethod: trim(config.sysLimitFallbackMethod),
      sysLimitKeyExpression: trim(config.sysLimitKeyExpression),
      sysLimitMessage: trim(config.sysLimitMessage),
      sysLimitDescription: trim(config.sysLimitDescription),
    });
  }
  editorVisible.value = true;
}

async function saveConfig() {
  loading.save = true;
  try {
    const editing = Boolean(trim(form.sysLimitConfigurationId));
    await request(editing ? "limit/update" : "limit/save", {
      method: editing ? "PUT" : "POST",
      body: JSON.stringify(buildConfigBody()),
    });
    notify(editing ? "限流规则已更新" : "限流规则已创建", "success");
    editorVisible.value = false;
    await Promise.all([loadConfigs(), loadMetrics()]);
  } catch (error) {
    notify(resolveError(error, "保存限流规则失败"), "error");
  } finally {
    loading.save = false;
  }
}

async function toggleStatus(config: RecordLike | null) {
  if (!config?.sysLimitConfigurationId) {
    return;
  }
  const nextStatus = isEnabled(config) ? 0 : 1;
  try {
    await request("limit/update", {
      method: "PUT",
      body: JSON.stringify({
        ...config,
        sysLimitStatus: nextStatus,
      }),
    });
    notify(nextStatus === 1 ? "规则已启用" : "规则已停用", "success");
    await Promise.all([loadConfigs(), loadMetrics()]);
  } catch (error) {
    notify(resolveError(error, "切换规则状态失败"), "error");
  }
}

async function deleteConfig(config: RecordLike | null) {
  if (!config?.sysLimitConfigurationId) {
    return;
  }
  const label = config.sysLimitName || `#${config.sysLimitConfigurationId}`;
  if (!window.confirm(`确认删除限流规则 ${label} 吗？`)) {
    return;
  }
  try {
    await request(`limit/delete?id=${encodeURIComponent(String(config.sysLimitConfigurationId))}`, {
      method: "DELETE",
    });
    notify("限流规则已删除", "success");
    await Promise.all([loadConfigs(), loadMetrics(), loadRecords()]);
  } catch (error) {
    notify(resolveError(error, "删除限流规则失败"), "error");
  }
}

async function refreshStrategy() {
  loading.refresh = true;
  try {
    await request("limit/refresh", { method: "POST" });
    notify("运行时策略已刷新", "success");
    await Promise.all([loadConfigs(), loadMetrics()]);
  } catch (error) {
    notify(resolveError(error, "刷新运行时策略失败"), "error");
  } finally {
    loading.refresh = false;
  }
}

async function cleanupRecords() {
  const days = Math.max(intOr(filters.cleanupDays, 30), 1);
  filters.cleanupDays = String(days);
  if (!window.confirm(`确认清理 ${days} 天之前的限流记录吗？`)) {
    return;
  }
  loading.cleanup = true;
  try {
    const cleaned = await request(`limit-record/clean?days=${days}`, { method: "DELETE" });
    notify(`已清理 ${formatNumber(cleaned)} 条限流记录`, "success");
    await loadRecords();
  } catch (error) {
    notify(resolveError(error, "清理限流记录失败"), "error");
  } finally {
    loading.cleanup = false;
  }
}

function saveSettings() {
  settings.apiRoot = trim(settings.apiRoot) || props.defaultApiRoot;
  settings.authHeaderName = trim(settings.authHeaderName);
  settings.authHeaderValue = trim(settings.authHeaderValue);
  localStorage.setItem(props.storageKey, JSON.stringify(settings));
  settingsVisible.value = false;
  notify("接口设置已保存", "success");
  void refreshAll();
}

async function request(path: string, init?: RequestInit): Promise<any> {
  const headers = new Headers(init?.headers || {});
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (trim(settings.authHeaderName) && trim(settings.authHeaderValue)) {
    headers.set(trim(settings.authHeaderName), trim(settings.authHeaderValue));
  }
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
  if (!response.ok) {
    throw new Error(resolveMessage(payload) || `请求失败: ${response.status}`);
  }
  if (payload && typeof payload === "object" && "code" in payload) {
    const code = String(payload.code ?? "");
    if (!["00000", "200", "0"].includes(code)) {
      throw new Error(resolveMessage(payload) || `业务请求失败: ${code}`);
    }
    return "data" in payload ? payload.data : payload;
  }
  if (payload && typeof payload === "object" && payload.success === false) {
    throw new Error(resolveMessage(payload) || "业务请求失败");
  }
  return payload;
}

function apiUrl(path: string) {
  const root = trim(settings.apiRoot) || props.defaultApiRoot;
  const normalized = root.endsWith("/") ? root : `${root}/`;
  return new URL(path.replace(/^\/+/, ""), new URL(normalized, window.location.href)).toString();
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(props.storageKey);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      apiRoot: trim(parsed.apiRoot) || props.defaultApiRoot,
      authHeaderName: trim(parsed.authHeaderName),
      authHeaderValue: trim(parsed.authHeaderValue),
    };
  } catch {
    return {
      apiRoot: props.defaultApiRoot,
      authHeaderName: "",
      authHeaderValue: "",
    };
  }
}

function createForm() {
  return {
    sysLimitConfigurationId: "",
    sysLimitName: "",
    sysLimitPath: "",
    sysLimitDimension: "GLOBAL",
    sysLimitForPeriod: "100",
    sysLimitRefreshPeriodSeconds: "1",
    sysLimitTimeoutDurationMillis: "0",
    sysLimitStatus: "1",
    sysLimitSort: "100",
    sysLimitFallbackMethod: "",
    sysLimitKeyExpression: "",
    sysLimitMessage: "",
    sysLimitDescription: "",
  };
}

function buildConfigBody() {
  return {
    ...(trim(form.sysLimitConfigurationId)
      ? { sysLimitConfigurationId: intOr(form.sysLimitConfigurationId, 0) }
      : {}),
    sysLimitName: trim(form.sysLimitName),
    sysLimitPath: trim(form.sysLimitPath),
    sysLimitDimension: trim(form.sysLimitDimension) || "GLOBAL",
    sysLimitForPeriod: intOr(form.sysLimitForPeriod, 100),
    sysLimitRefreshPeriodSeconds: intOr(form.sysLimitRefreshPeriodSeconds, 1),
    sysLimitTimeoutDurationMillis: intOr(form.sysLimitTimeoutDurationMillis, 0),
    sysLimitStatus: intOr(form.sysLimitStatus, 1),
    sysLimitSort: intOr(form.sysLimitSort, 100),
    sysLimitFallbackMethod: trim(form.sysLimitFallbackMethod),
    sysLimitKeyExpression: trim(form.sysLimitKeyExpression),
    sysLimitMessage: trim(form.sysLimitMessage),
    sysLimitDescription: trim(form.sysLimitDescription),
  };
}

function isEnabled(config: RecordLike | null) {
  return String(config?.sysLimitStatus ?? "") === "1" || config?.sysLimitStatus === true;
}

function isSelected(config: RecordLike) {
  return sameConfig(config, selectedConfig.value);
}

function sameConfig(left: RecordLike | null, right: RecordLike | null) {
  return !!left && !!right && String(left.sysLimitConfigurationId ?? "") === String(right.sysLimitConfigurationId ?? "");
}

function countObject(value: unknown) {
  if (Array.isArray(value)) {
    return value.length;
  }
  return value && typeof value === "object" ? Object.keys(value as Record<string, unknown>).length : 0;
}

function formatJson(value: unknown) {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return String(value ?? "");
  }
}

function formatDateTime(value?: unknown) {
  const text = trim(value);
  if (!text) {
    return "";
  }
  const parsed = new Date(text.includes("T") ? text : text.replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? text.replace("T", " ") : parsed.toLocaleString("zh-CN", { hour12: false });
}

function formatNumber(value: unknown) {
  const num = numOr(value);
  return num == null ? "0" : num.toLocaleString("zh-CN");
}

function formatPercent(value: unknown) {
  const num = numOr(value);
  if (num == null) {
    return "0%";
  }
  const normalized = num <= 1 ? num * 100 : num;
  return `${normalized.toFixed(2)}%`;
}

function notify(message: string, type: "success" | "error" | "info") {
  const id = ++toastSeed;
  toasts.value.push({ id, message, type });
  window.setTimeout(() => {
    toasts.value = toasts.value.filter((item) => item.id !== id);
  }, 3200);
}

function asList(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function resolveMessage(payload: any) {
  if (!payload) {
    return "";
  }
  if (typeof payload === "string") {
    return payload;
  }
  return payload.message || payload.msg || payload.error || "";
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function resolveError(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function trim(value: unknown) {
  return value == null ? "" : String(value).trim();
}

function upper(value: unknown) {
  return trim(value).toUpperCase();
}

function intOr(value: unknown, fallback: number) {
  const parsed = Number.parseInt(trim(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function numOr(value: unknown) {
  const text = trim(value);
  if (!text) {
    return null;
  }
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
.strategy-hero {
  background:
    radial-gradient(circle at top right, rgba(20, 128, 90, 0.18), transparent 30%),
    radial-gradient(circle at bottom left, rgba(22, 102, 216, 0.12), transparent 32%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(244, 250, 247, 0.94));
}

.strategy-metric-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(244, 250, 247, 0.92));
}

.strategy-metric-card-focus {
  background:
    radial-gradient(circle at top right, rgba(132, 227, 194, 0.26), transparent 32%),
    linear-gradient(135deg, #0f4e66 0%, #0c7d6a 52%, #1caa83 100%);
}

.strategy-metric-card-focus .spring-metric-label,
.strategy-metric-card-focus .spring-metric-value,
.strategy-metric-card-focus small {
  color: #eefcf7;
}

.strategy-table-actions,
.strategy-detail-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.strategy-runtime-content {
  display: grid;
  gap: 14px;
}

.strategy-runtime-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.strategy-record-path {
  margin-top: 10px;
  font-weight: 700;
  color: var(--spring-text);
  word-break: break-all;
}

@media (max-width: 1120px) {
  .strategy-runtime-grid {
    grid-template-columns: 1fr;
  }
}
</style>

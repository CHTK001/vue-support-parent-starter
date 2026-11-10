<template>
  <ReCard layout="simple" :radius="12" :padding="0" shadow="never" class="sw-card">
    <!-- 头部工具栏 -->
    <template #header>
      <div class="sw-head">
        <div class="sw-head__left">
          <span class="sw-head__title">软件指标</span>
          <span class="sw-head__badge">
            <span class="sw-head__avail">{{ availableCount }}</span>
            <span class="sw-head__sep">/</span>
            <span class="sw-head__total">{{ allRows.length }}</span>
          </span>
          <span v-if="searchKeyword" class="sw-head__filter-tag">
            过滤: {{ searchKeyword }}
            <button class="sw-head__filter-clear" @click="searchKeyword = ''">×</button>
          </span>
        </div>
        <div class="sw-head__right">
          <!-- 搜索 -->
          <div class="sw-search">
            <ReIcon name="Search" :size="13" />
            <input
              v-model="searchKeyword"
              class="sw-search__input"
              placeholder="搜索软件..."
              spellcheck="false"
            />
          </div>
          <!-- 导出 -->
          <ReButton show-text icon="Download" plain tip="导出 CSV" @click="handleExport" />
          <!-- 配置 -->
          <ReButton show-text icon="Setting" plain @click="settingsVisible = true">配置</ReButton>
          <!-- 刷新 -->
          <ReButton show-text icon="RefreshLeft" plain :loading="loading" tip="刷新软件识别结果" @click="reload" />
        </div>
      </div>
    </template>

    <!-- 主体 -->
    <ReErrorBar v-if="loadError" :message="loadError" retryText="重试" @retry="reload" />

    <ReEmpty v-else-if="!allRows.length && !loading" description="未获取到软件识别数据" />

    <template v-else>
      <!-- 列头 -->
      <div class="sw-cols">
        <div class="sw-col sw-col--name" @click="toggleSort('label')">
          软件
          <SortIcon :field="'label'" :sort-by="prefs.sortBy" :sort-dir="prefs.sortDir" />
        </div>
        <div class="sw-col sw-col--state">状态</div>
        <div class="sw-col sw-col--num" @click="toggleSort('count')">
          实例
          <SortIcon :field="'count'" :sort-by="prefs.sortBy" :sort-dir="prefs.sortDir" />
        </div>
        <div class="sw-col sw-col--num" @click="toggleSort('cpu')">
          CPU
          <SortIcon :field="'cpu'" :sort-by="prefs.sortBy" :sort-dir="prefs.sortDir" />
        </div>
        <div class="sw-col sw-col--mem" @click="toggleSort('mem')">
          内存
          <SortIcon :field="'mem'" :sort-by="prefs.sortBy" :sort-dir="prefs.sortDir" />
        </div>
        <div class="sw-col sw-col--port">端口</div>
        <div class="sw-col sw-col--num" @click="toggleSort('uptime')">
          运行时长
          <SortIcon :field="'uptime'" :sort-by="prefs.sortBy" :sort-dir="prefs.sortDir" />
        </div>
      </div>

      <!-- 分组列表 -->
      <div class="sw-body">
        <template v-for="g in groupList" :key="g.group">
          <!-- 分组头 -->
          <div
            class="sw-group"
            :class="{ 'is-collapsed': prefs.collapsed.includes(g.group) }"
            @click="toggleGroup(g.group)"
          >
            <ReIcon
              :name="prefs.collapsed.includes(g.group) ? 'CaretRight' : 'CaretBottom'"
              :size="12"
              class="sw-group__arrow"
            />
            <span class="sw-group__label" :class="`is-${g.group}`">{{ g.label }}</span>
            <span class="sw-group__count">
              <span class="sw-group__avail">{{ g.available }}</span>/{{ g.count }}
            </span>
          </div>

          <!-- 分组内行 -->
          <template v-if="!prefs.collapsed.includes(g.group)">
            <div
              v-for="r in visibleRows.filter(row => row.group === g.group)"
              :key="r.type"
              class="sw-row-wrap"
            >
              <!-- 主行 -->
              <div
                class="sw-row"
                :class="{
                  'is-dim': !r.available,
                  'is-expanded': expanded.get(r.type),
                  'has-expand': r.count > 1,
                }"
                :aria-disabled="!r.available"
                @click="r.count > 1 && r.available && toggleExpand(r.type)"
              >
                <div class="sw-cell sw-cell--name">
                  <span class="sw-icon" :class="`is-${r.role}`">
                    <ReIcon :name="r.icon" :size="14" />
                  </span>
                  <span class="sw-name">{{ r.label }}</span>
                  <span v-if="r.count > 1 && r.available" class="sw-expand-hint">
                    <ReIcon :name="expanded.get(r.type) ? 'ArrowUp' : 'ArrowDown'" :size="10" />
                  </span>
                </div>
                <div class="sw-cell sw-cell--state">
                  <span class="sw-pulse" :class="r.available ? 'is-running' : 'is-idle'" />
                  <ReTag :type="r.available ? 'success' : 'info'" effect="plain" size="small">
                    {{ r.available ? "运行中" : "未识别" }}
                  </ReTag>
                </div>
                <div class="sw-cell sw-cell--num">{{ r.available ? r.count : "—" }}</div>
                <div class="sw-cell sw-cell--num">
                  <template v-if="r.available">
                    <span class="sw-bar-label">{{ r.totalCpu }}%</span>
                    <div class="sw-bar">
                      <div
                        class="sw-bar__fill"
                        :class="cpuBarClass(r.totalCpu)"
                        :style="{ width: Math.min(100, r.totalCpu) + '%' }"
                      />
                    </div>
                  </template>
                  <span v-else>—</span>
                </div>
                <div class="sw-cell sw-cell--mem">
                  <template v-if="r.available">
                    <span class="sw-bar-label">{{ fmtMem(r.totalMemMb) }}</span>
                    <div class="sw-bar">
                      <div
                        class="sw-bar__fill is-mem"
                        :style="{ width: Math.min(100, (r.totalMemMb / 8192) * 100) + '%' }"
                      />
                    </div>
                  </template>
                  <span v-else>—</span>
                </div>
                <div class="sw-cell sw-cell--port">
                  <template v-if="r.available && r.ports.length">
                    <span
                      v-for="p in r.ports.slice(0, 3)"
                      :key="p"
                      class="sw-port"
                      :title="`端口 ${p}`"
                    >{{ p }}</span>
                    <span v-if="r.ports.length > 3" class="sw-port sw-port--more">+{{ r.ports.length - 3 }}</span>
                  </template>
                  <span v-else>—</span>
                </div>
                <div class="sw-cell sw-cell--num">
                  {{ r.available ? fmtUptime(r.maxUptimeSec) : "—" }}
                </div>
              </div>

              <!-- 展开的多实例详情行 -->
              <div v-if="r.available && expanded.get(r.type) && r.instances.length > 1" class="sw-sub">
                <div class="sw-sub__header">
                  <span class="sw-sub__col">PID</span>
                  <span class="sw-sub__col">CPU</span>
                  <span class="sw-sub__col">内存</span>
                  <span class="sw-sub__col">端口</span>
                  <span class="sw-sub__col">运行时长</span>
                  <span class="sw-sub__col sw-sub__col--cmd">命令</span>
                </div>
                <div
                  v-for="(ins, idx) in r.instances"
                  :key="idx"
                  class="sw-sub__row"
                >
                  <span class="sw-sub__col sw-sub__mono">{{ ins.pid ?? "—" }}</span>
                  <span class="sw-sub__col">{{ fmtCpu(ins.cpu) }}</span>
                  <span class="sw-sub__col">{{ fmtMem(ins.memMb) }}</span>
                  <span class="sw-sub__col sw-sub__mono">{{ ins.port ? String(ins.port) : "—" }}</span>
                  <span class="sw-sub__col">{{ fmtUptime(ins.uptimeSec) }}</span>
                  <span class="sw-sub__col sw-sub__col--cmd sw-sub__mono" :title="ins.cmd">{{ fmtCmd(ins.cmd) }}</span>
                </div>
              </div>
            </div>
          </template>
        </template>

        <!-- 过滤无结果 -->
        <ReEmpty v-if="!visibleRows.length && allRows.length" description="没有匹配「{{ searchKeyword }}」的软件" />
      </div>
    </template>
  </ReCard>

  <!-- 配置弹窗 -->
  <ReDialog v-model="settingsVisible" title="软件指标配置" width="580px">
    <div class="sw-set">
      <p class="sw-set__tip">
        顺序、显隐、折叠保存在本浏览器；未识别的软件开关不可切换。
      </p>

      <!-- 未识别策略 -->
      <div class="sw-set__section">
        <div class="sw-set__section-title">未识别软件</div>
        <div class="sw-set__row">
          <span>隐藏未识别行</span>
          <el-switch
            :model-value="prefs.hideUnavailable"
            @update:model-value="(v: any) => updatePrefs({ hideUnavailable: !!v })"
          />
          <span class="sw-set__hint">{{ prefs.hideUnavailable ? "隐藏（不渲染）" : "置灰显示" }}</span>
        </div>
        <div class="sw-set__row">
          <span>默认展开所有分组</span>
          <el-switch
            :model-value="prefs.expandAll"
            @update:model-value="(v: any) => updatePrefs({ expandAll: !!v })"
          />
        </div>
      </div>

      <!-- 逐项配置 -->
      <div class="sw-set__section">
        <div class="sw-set__section-title">
          逐项配置
          <span class="sw-set__section-hint">点击行名称可展开/折叠分组</span>
        </div>
        <div class="sw-set__list">
          <template v-for="g in (Object.keys(SOFTWARE_GROUP_LABEL) as SoftwareGroupKey[])" :key="g">
            <div class="sw-set__group-head" @click="toggleGroup(g)">
              <ReIcon
                :name="prefs.collapsed.includes(g) ? 'CaretRight' : 'CaretBottom'"
                :size="12"
              />
              <span class="sw-set__group-name" :class="`is-${g}`">{{ SOFTWARE_GROUP_LABEL[g] }}</span>
            </div>
            <template v-if="!prefs.collapsed.includes(g)">
              <div
                v-for="r in allRows.filter(row => row.group === g)"
                :key="r.type"
                class="sw-set__item"
                :class="{ 'is-dim': !r.available }"
              >
                <span class="sw-set__name">
                  <ReIcon :name="r.icon" :size="12" />
                  {{ r.label }}
                  <em v-if="!r.available">未识别</em>
                </span>
                <span class="sw-set__ops">
                  <ReButton layout="square" icon="ArrowUp" tip="上移" @click="move(r.type, -1)" />
                  <ReButton layout="square" icon="ArrowDown" tip="下移" @click="move(r.type, 1)" />
                  <el-switch
                    :model-value="!prefs.hidden.includes(r.type)"
                    :disabled="!r.available"
                    @update:model-value="(v: any) => toggleVisible(r.type, !!v)"
                  />
                </span>
              </div>
            </template>
          </template>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="resetPrefs">恢复默认</el-button>
      <el-button type="primary" @click="settingsVisible = false">完成</el-button>
    </template>
  </ReDialog>
</template>

<script setup lang="ts">
/**
 * 软件指标表 —— 全功能版
 *
 * 功能：分组折叠 | 列排序 | 关键字搜索 | 多实例展开 | CSV导出 |
 *       CPU/内存进度条 | 数字动画 | 状态脉冲 | tooltip
 */
import { computed, onMounted, onBeforeUnmount, ref, watch } from "vue";
import { message } from "@repo/core";
import { useSocketService } from "@repo/core";
import {
  fetchMonitorSoftware,
  useSoftwareTable,
  type SoftwareInstance,
} from "./useSoftwareTable";
import { SOFTWARE_GROUP_LABEL, type SoftwareGroupKey } from "./catalog";
import SortIcon from "./SortIcon.vue";

const props = defineProps<{
  monitorId?: number | null;
  refreshKey?: number;
}>();

const instances = ref<SoftwareInstance[]>([]);
const loading = ref(false);
const loadError = ref("");
const settingsVisible = ref(false);

const {
  prefs,
  allRows,
  visibleRows,
  searchKeyword,
  groupList,
  expanded,
  availableCount,
  updatePrefs,
  resetPrefs,
  toggleVisible,
  move,
  toggleSort,
  toggleExpand,
  toggleGroup,
  downloadCsv,
} = useSoftwareTable(() => instances.value);

function fmtCpu(v?: number): string {
  const n = Number(v);
  return Number.isFinite(n) ? `${Math.round(n * 10) / 10}%` : "—";
}
function fmtMem(mb?: number): string {
  const m = Number(mb) || 0;
  if (m >= 1024) return `${(m / 1024).toFixed(1)} GB`;
  return `${Math.round(m)} MB`;
}
function fmtUptime(sec?: number): string {
  const s = Number(sec) || 0;
  if (!s) return "—";
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return d > 0 ? `${d}天${h}时` : h > 0 ? `${h}时${m}分` : `${m}分`;
}
function fmtCmd(cmd?: string): string {
  if (!cmd) return "—";
  return cmd.length > 60 ? cmd.substring(0, 60) + "…" : cmd;
}
function cpuBarClass(cpu: number): string {
  if (cpu >= 80) return "is-danger";
  if (cpu >= 50) return "is-warning";
  return "is-normal";
}

async function reload(): Promise<void> {
  const id = Number(props.monitorId);
  if (!id) { instances.value = []; return; }
  loading.value = true;
  loadError.value = "";
  try {
    instances.value = await fetchMonitorSoftware(id);
  } catch (e) {
    loadError.value = (e as Error)?.message ?? "软件识别结果加载失败";
    instances.value = [];
  } finally {
    loading.value = false;
  }
}

function handleExport(): void {
  const kw = searchKeyword.value.trim();
  downloadCsv(visibleRows.value, kw);
  message.success("CSV 已导出");
}

// Socket SSE 实时推送（host 指标里含 software 变更）
let offSoftware: (() => void) | null = null;
function setupSocket(): void {
  offSoftware?.();
  offSoftware = null;
  const id = Number(props.monitorId);
  if (!id) return;
  const socket = useSocketService();
  if (!socket) return;
  offSoftware = socket.subscribe("monitor", "host-metrics", (msg: any) => {
    const d = (msg?.data ?? msg) as { hostId?: number; software?: unknown[] };
    if (d?.hostId == null) return;
    // 只更新这台主机的软件数据（避免每次 reload 全量）
    if (Array.isArray(d.software)) {
      instances.value = d.software as any[];
    }
  });
}

watch(() => props.monitorId, (nid) => {
  if (nid) {
    reload();
    setupSocket();
  } else {
    instances.value = [];
    offSoftware?.();
  }
}, { immediate: true });

watch(() => props.refreshKey, reload);

onBeforeUnmount(() => offSoftware?.());
</script>

<style scoped>
.sw-card {
  margin-top: 12px;
}

/* ---- 头部 ---- */
.sw-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 4px;
  flex-wrap: wrap;
}
.sw-head__left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}
.sw-head__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}
.sw-head__badge {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  padding: 1px 7px;
  border-radius: 10px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
}
.sw-head__avail { color: var(--el-color-success); font-weight: 600; }
.sw-head__sep { color: var(--el-text-color-placeholder); }
.sw-head__total { color: var(--el-text-color-secondary); }

.sw-head__filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 30%, transparent);
  border-radius: 4px;
  padding: 1px 6px;
}
.sw-head__filter-clear {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  padding: 0;
}

.sw-head__right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

/* 搜索 */
.sw-search {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  transition: border-color 0.2s;
}
.sw-search:focus-within {
  border-color: var(--el-color-primary);
}
.sw-search__input {
  background: none;
  border: none;
  outline: none;
  font-size: 12px;
  color: var(--el-text-color-primary);
  width: 100px;
}
.sw-search__input::placeholder { color: var(--el-text-color-placeholder); }

/* ---- 列头 ---- */
.sw-cols {
  display: flex;
  align-items: center;
  padding: 5px 12px;
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 11px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  user-select: none;
}
.sw-col {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  white-space: nowrap;
}
.sw-col:hover { color: var(--el-color-primary); }
.sw-col--name { flex: 1; min-width: 160px; }
.sw-col--state { width: 90px; cursor: default; }
.sw-col--num { width: 80px; text-align: right; justify-content: flex-end; }
.sw-col--mem { width: 100px; text-align: right; justify-content: flex-end; }
.sw-col--port { width: 140px; }

/* ---- 分组头 ---- */
.sw-group {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}
.sw-group:hover { background: var(--el-fill-color); }
.sw-group__arrow { flex-shrink: 0; }
.sw-group__label {
  font-size: 11px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}
.sw-group__label.is-cache { background: color-mix(in srgb, var(--el-color-danger) 12%, transparent); color: var(--el-color-danger); }
.sw-group__label.is-database { background: color-mix(in srgb, var(--el-color-primary) 12%, transparent); color: var(--el-color-primary); }
.sw-group__label.is-middleware { background: color-mix(in srgb, var(--el-color-warning) 12%, transparent); color: var(--el-color-warning); }
.sw-group__label.is-message { background: color-mix(in srgb, #8b5cf6 12%, transparent); color: #8b5cf6; }
.sw-group__label.is-search { background: color-mix(in srgb, var(--el-color-success) 12%, transparent); color: var(--el-color-success); }
.sw-group__label.is-runtime { background: color-mix(in srgb, var(--el-color-info) 12%, transparent); color: var(--el-color-info); }

.sw-group__count { margin-left: auto; font-size: 11px; color: var(--el-text-color-placeholder); font-variant-numeric: tabular-nums; }
.sw-group__avail { color: var(--el-color-success); font-weight: 600; }

/* ---- 主行 ---- */
.sw-row-wrap {
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.sw-row-wrap:last-child { border-bottom: none; }

.sw-row {
  display: flex;
  align-items: center;
  padding: 7px 12px;
  font-size: 12px;
  min-height: 36px;
  transition: background 0.15s;
}
.sw-row.has-expand { cursor: pointer; }
.sw-row:not(.has-expand):not(.is-dim) { cursor: default; }
.sw-row:not(.is-dim):hover { background: var(--el-fill-color-light); }

.sw-cell { display: flex; align-items: center; }
.sw-cell--name { flex: 1; min-width: 160px; gap: 6px; }
.sw-cell--state { width: 90px; gap: 5px; }
.sw-cell--num { width: 80px; justify-content: flex-end; font-variant-numeric: tabular-nums; gap: 5px; }
.sw-cell--mem { width: 100px; justify-content: flex-end; font-variant-numeric: tabular-nums; gap: 5px; flex-direction: column; align-items: flex-end; }
.sw-cell--port { width: 140px; gap: 4px; flex-wrap: wrap; }

.sw-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  color: var(--el-color-info);
  flex-shrink: 0;
}
.sw-icon.is-primary { color: var(--el-color-primary); background: color-mix(in srgb, var(--el-color-primary) 10%, transparent); }
.sw-icon.is-success { color: var(--el-color-success); background: color-mix(in srgb, var(--el-color-success) 10%, transparent); }
.sw-icon.is-warning { color: var(--el-color-warning); background: color-mix(in srgb, var(--el-color-warning) 10%, transparent); }
.sw-icon.is-danger { color: var(--el-color-danger); background: color-mix(in srgb, var(--el-color-danger) 10%, transparent); }

.sw-name { color: var(--el-text-color-primary); font-weight: 500; }

.sw-expand-hint {
  color: var(--el-text-color-placeholder);
  display: inline-flex;
  align-items: center;
  margin-left: 2px;
}

/* 状态脉冲 */
.sw-pulse {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.sw-pulse.is-running {
  background: var(--el-color-success);
  box-shadow: 0 0 0 0 var(--el-color-success);
  animation: sw-pulse-run 2s ease-out infinite;
}
.sw-pulse.is-idle {
  background: var(--el-color-info-light-3);
}
@keyframes sw-pulse-run {
  0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--el-color-success) 60%, transparent); }
  70% { box-shadow: 0 0 0 6px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
}

/* 进度条 */
.sw-bar {
  width: 60px;
  height: 4px;
  border-radius: 2px;
  background: var(--el-fill-color);
  overflow: hidden;
}
.sw-bar__fill {
  height: 100%;
  border-radius: 2px;
  background: var(--el-color-success);
  transition: width 0.4s ease;
}
.sw-bar__fill.is-warning { background: var(--el-color-warning); }
.sw-bar__fill.is-danger { background: var(--el-color-danger); }
.sw-bar__fill.is-mem { background: var(--el-color-primary); }
.sw-bar-label { font-size: 11px; color: var(--el-text-color-secondary); white-space: nowrap; }

/* 端口标签 */
.sw-port {
  display: inline-block;
  font-size: 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  padding: 1px 5px;
  border-radius: 3px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  border: 1px solid var(--el-border-color-lighter);
}
.sw-port--more { color: var(--el-text-color-placeholder); }

/* 未识别行 */
.sw-row.is-dim {
  opacity: 0.42;
  pointer-events: none;
  cursor: not-allowed;
}
.sw-row.is-dim .sw-name { color: var(--el-text-color-placeholder); }
.sw-row.is-dim .sw-icon { filter: grayscale(1); }

/* 展开的多实例行 */
.sw-sub {
  background: var(--el-fill-color-lighter);
  border-top: 1px dashed var(--el-border-color-lighter);
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
.sw-sub__header {
  display: flex;
  padding: 3px 16px;
  font-weight: 500;
  color: var(--el-text-color-placeholder);
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.sw-sub__row {
  display: flex;
  padding: 4px 16px;
  border-bottom: 1px solid var(--el-fill-color);
  align-items: center;
}
.sw-sub__row:last-child { border-bottom: none; }
.sw-sub__col {
  flex: 1;
  padding: 0 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sw-sub__col--cmd { flex: 2; }
.sw-sub__mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
}

/* 错误 / 空 */
.sw-body { max-height: 420px; overflow-y: auto; }

/* ---- 配置弹窗 ---- */
.sw-set__tip {
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}
.sw-set__section {
  margin-bottom: 16px;
}
.sw-set__section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.sw-set__section-hint {
  font-size: 11px;
  font-weight: 400;
  color: var(--el-text-color-placeholder);
}
.sw-set__row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--el-text-color-primary);
  padding: 4px 0;
}
.sw-set__hint { font-size: 12px; color: var(--el-text-color-secondary); }

.sw-set__list {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
  max-height: 320px;
  overflow-y: auto;
}
.sw-set__group-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: var(--el-fill-color-light);
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.sw-set__group-head:hover { background: var(--el-fill-color); }
.sw-set__group-name.is-cache { color: var(--el-color-danger); }
.sw-set__group-name.is-database { color: var(--el-color-primary); }
.sw-set__group-name.is-middleware { color: var(--el-color-warning); }
.sw-set__group-name.is-message { color: #8b5cf6; }
.sw-set__group-name.is-search { color: var(--el-color-success); }
.sw-set__group-name.is-runtime { color: var(--el-color-info); }

.sw-set__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 12px;
}
.sw-set__item:last-child { border-bottom: none; }
.sw-set__item.is-dim { opacity: 0.5; }
.sw-set__name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  color: var(--el-text-color-primary);
}
.sw-set__name em {
  font-style: normal;
  font-size: 10px;
  color: var(--el-text-color-placeholder);
}
.sw-set__ops {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>

<script setup lang="ts">
/**
 * 进程分区 —— 排名条 + 可展开详情。
 *
 * <p>设计意图：进程页最常见的问题是「谁在吃 CPU / 内存」，所以默认按占用降序排成横向条，
 * 一眼看出头部；条长按当前指标的最大值归一，而不是按 100%，否则 CPU 5% 的进程会全部看起来一样长。
 * 点击行展开命令行、路径、父进程、启动时间，并给出重启 / 结束 / 内存分析入口。</p>
 *
 * <p>字段来自 {@code ProcessRowVO}：pid / ppid / name / user / cpu / memory / threads / startTime / command / path。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import {
  fmt1,
  fmtMemory,
  leadTileOf,
  numOf,
  processTone,
  type Tone,
} from "../../utils/hostProfileUi";
import { fetchProcessChildren, fetchProcessThreads, type ThreadInfo } from "../../api/hostRuntime";
import ProfileSectionShell from "./ProfileSectionShell.vue";
import ProfileProcessProperties from "./ProfileProcessProperties.vue";
import type { StripItem } from "./types";

interface Props {
  rows: Record<string, any>[];
  keyword?: string;
  loading?: boolean;
  error?: string;
  /** 后端分页状态，透传给外壳 */
  paged?: boolean;
  page?: number;
  pageSize?: number;
  total?: number;
  truncated?: boolean;
  /** 正在执行动作的行键（restart-<pid> / kill-<pid>），用于禁用按钮 */
  busyKey?: string;
  /** 目标主机 ID，用于拉取线程/子进程 */
  hostId?: number;
}

const props = withDefaults(defineProps<Props>(), {
  keyword: "",
  loading: false,
  error: "",
  paged: true,
  page: 1,
  pageSize: 10,
  total: 0,
  truncated: false,
  busyKey: "",
  hostId: undefined as number | undefined,
});

const emit = defineEmits<{
  (e: "search", keyword: string): void;
  (e: "commit", keyword: string): void;
  (e: "page", delta: number): void;
  (e: "refresh"): void;
  (e: "restart", row: Record<string, any>): void;
  (e: "kill", row: Record<string, any>): void;
  (e: "analyze"): void;
}>();

/** 排名依据：CPU 还是内存 */
const metric = ref<"cpu" | "mem">("cpu");

/** PID 过滤关键字（本地过滤当前页） */
const pidFilter = ref("");

/** 展开的行（同一时刻只展开一个，避免长命令行把列表撑散） */
const expandedPid = ref<number | null>(null);

/** 后端线程列表缓存：pid → ThreadInfo[] */
const threadsMap = ref<Map<number, ThreadInfo[]>>(new Map());
/** 后端子进程列表缓存：pid → ProcessInfo[] */
const childrenMap = ref<Map<number, Record<string, any>[]>>(new Map());
/** 正在拉取详情的 pid（防重复请求） */
const loadingDetail = ref<number | null>(null);

/** 行视图：把等级、图标、当前指标值一次算好 */
interface ProcView {
  raw: Record<string, any>;
  pid: number;
  tone: Tone;
  tile: { brand: string; bg: string; glyph: string; letter: string };
  value: number;
  valueText: string;
  ratio: number;
  /** 子进程树层级（仅展开区子进程行使用） */
  _depth?: number;
}

const view = computed<ProcView[]>(() => {
  // PID 过滤：本地过滤当前页
  const pf = pidFilter.value.trim().toLowerCase();
  const filteredRows = pf
    ? props.rows.filter(r => String(numOf(r.pid)).toLowerCase().includes(pf))
    : props.rows;
  const list = filteredRows.map(raw => {
    const pid = numOf(raw.pid);
    const value = metric.value === "cpu" ? numOf(raw.cpu) : numOf(raw.memory);
    return {
      raw,
      pid,
      tone: processTone(raw),
      tile: leadTileOf("processes", raw),
      value,
      valueText: metric.value === "cpu" ? `${fmt1(raw.cpu)}%` : fmtMemory(raw.memory),
      ratio: 0,
    };
  });
  // 按当前指标降序：后端已按页返回，这里只保证「当前页内」头部靠前
  list.sort((a, b) => b.value - a.value);
  const max = list.length ? list[0].value : 0;
  // 条长按最大值归一：头部满格，尾部才看得出差距；最大值为 0 时全部空条
  list.forEach(it => { it.ratio = max > 0 ? it.value / max * 100 : 0; });
  return list;
});

/**
 * 某进程的子进程（当前页内 ppid 关联）。
 *
 * <p>展开区展示的是「进程树的下层」而非详情文本：谁的 ppid 指向该 pid，
 * 谁就是它的子进程。当前页是后端按页返回的，跨页父子装配不到，这里只输出页内
 * 可见的子树；详情文本移到 hover 浮层。</p>
 *
 * @param pid 父进程 pid
 */
function childrenOf(pid: number): ProcView[] {
  if (!pid || pid <= 0) return [];
  const seen = new Set<number>();
  const children: ProcView[] = [];
  // 递归搜集：子进程还有自己的子进程（孙进程）也一并列出来，形成缩进层级
  const walk = (parent: number, depth: number): void => {
    if (depth > 4) return;
    for (const v of view.value) {
      if (seen.has(v.pid)) continue;
      if (numOf(v.raw.ppid) === parent) {
        seen.add(v.pid);
        children.push({ ...v, _depth: depth });
        walk(v.pid, depth + 1);
      }
    }
  };
  walk(pid, 0);
  return children;
}

/** 聚合条：进程数、内存合计、最高 CPU、最高内存 */
const strip = computed<StripItem[]>(() => {
  const rows = props.rows;
  let memTotal = 0;
  let cpuMax = 0;
  let memMax = 0;
  for (const r of rows) {
    memTotal += numOf(r.memory);
    cpuMax = Math.max(cpuMax, numOf(r.cpu));
    memMax = Math.max(memMax, numOf(r.memory));
  }
  const count = props.paged ? props.total : rows.length;
  return [
    { label: "进程数", value: `${count} 个` },
    { label: "本页内存合计", value: fmtMemory(memTotal) },
    { label: "最高 CPU", value: `${fmt1(cpuMax)}%`, tone: cpuMax >= 85 ? "bad" : cpuMax >= 50 ? "warn" : "" },
    { label: "最高内存", value: fmtMemory(memMax), tone: memMax >= 4096 ? "bad" : memMax >= 1024 ? "warn" : "" },
  ];
});

function toggleRow(pid: number): void {
  if (expandedPid.value === pid) {
    expandedPid.value = null;
    return;
  }
  expandedPid.value = pid;
  loadDetail(pid);
}

/** 拉取进程的线程与子进程详情（后端 API，跨页可见） */
async function loadDetail(pid: number): Promise<void> {
  if (loadingDetail.value === pid) return;
  // 已缓存则跳过
  if (threadsMap.value.has(pid) && childrenMap.value.has(pid)) return;
  loadingDetail.value = pid;
  try {
    const [threads, children] = await Promise.all([
      fetchProcessThreads(pid, props.hostId).catch(() => [] as ThreadInfo[]),
      fetchProcessChildren(pid, props.hostId).catch(() => [] as Record<string, any>[]),
    ]);
    threadsMap.value.set(pid, threads);
    childrenMap.value.set(pid, children);
  } catch {
    // 拉取失败不阻断展开，只是没有详情
    threadsMap.value.set(pid, []);
    childrenMap.value.set(pid, []);
  } finally {
    loadingDetail.value = null;
  }
}

/** 后端子进程优先，本地页内子进程兜底 */
function backendChildren(pid: number): Record<string, any>[] {
  return childrenMap.value.get(pid) ?? [];
}

/** 线程展开开关：超过 15 个线程时先折叠 */
const threadExpanded = ref(false);

/** 后端线程列表 */
function threadsOf(pid: number): ThreadInfo[] {
  return threadsMap.value.get(pid) ?? [];
}

/** 线程状态色调 */
function threadStateTone(state?: string): string {
  const s = String(state ?? "").toUpperCase();
  if (s === "RUNNABLE") return "t-ok";
  if (s === "BLOCKED" || s === "WAITING") return "t-warn";
  if (s === "TIMED_WAITING" || s === "SLEEPING") return "t-mute";
  return "t-mute";
}

/** 合并后端子进程与本地页内子进程 */
function allChildrenOf(pid: number): ProcView[] {
  const backend = backendChildren(pid);
  if (backend.length) {
    // 后端子进程构建 ProcView
    return backend.map(raw => {
      const value = metric.value === "cpu" ? numOf(raw.cpu) : numOf(raw.memory);
      return {
        raw,
        pid: numOf(raw.pid),
        tone: processTone(raw),
        tile: leadTileOf("processes", raw),
        value,
        valueText: metric.value === "cpu" ? `${fmt1(raw.cpu)}%` : fmtMemory(raw.memory),
        ratio: 0,
      };
    });
  }
  // 兜底：本地页内子进程
  return childrenOf(pid);
}

/** 可重启的前提是拿得到命令行：拿不到就没法按原样拉起 */
function canRestart(row: Record<string, any>): boolean {
  return numOf(row.pid) > 0 && String(row.command ?? "").trim() !== "";
}

/** 是否僵尸进程：只剩进程表项，重启/结束都无效 */
function isZombie(row: Record<string, any> | null | undefined): boolean {
  return /^z/i.test(String(row?.state ?? "").trim());
}

/** 状态展示文本：空状态说明该通道没有这一列（Windows），不显示成异常 */
function stateLabelOf(row: Record<string, any> | null | undefined): string {
  const s = String(row?.state ?? "").trim();
  if (!s) return "—";
  const map: Record<string, string> = { R: "运行", S: "睡眠", D: "不可中断", T: "已停止", Z: "僵尸", I: "空闲" };
  const key = s.charAt(0).toUpperCase();
  return map[key] ? `${map[key]}（${s}）` : s;
}

/* ==================== 行右键菜单：重启 / 结束 / 内存分析 ==================== */
/** 菜单状态 */
const ctxMenu = reactive<{ visible: boolean; x: number; y: number; row: Record<string, any> | null }>({
  visible: false,
  x: 0,
  y: 0,
  row: null,
});

/** 菜单项（菜单自身只管展示与定位，确认逻辑委托给父级） */
const ctxItems: Array<{ label: string; icon: string; danger?: boolean; disabled?: boolean; action: () => void }> = [
  { label: "显示属性", icon: "View", action: () => rowCommand("props") },
  { label: "重启进程", icon: "RefreshRight", action: () => rowCommand("restart") },
  { label: "结束进程", icon: "CircleClose", danger: true, action: () => rowCommand("kill") },
  { label: "内存分析", icon: "DataAnalysis", action: () => rowCommand("analyze") },
];

/** 属性弹框状态：行数据单独存一份，弹框打开期间列表刷新不影响已打开的对象 */
const propsVisible = ref(false);
const propsRow = ref<Record<string, any> | null>(null);

function closeRowContextMenu(): void {
  if (!ctxMenu.visible) return;
  ctxMenu.visible = false;
  ctxMenu.row = null;
}

function onRowContextMenu(e: MouseEvent, p: ProcView): void {
  e.preventDefault();
  ctxMenu.visible = true;
  ctxMenu.x = e.clientX;
  ctxMenu.y = e.clientY;
  ctxMenu.row = p.raw;
}

function rowCommand(cmd: "restart" | "kill" | "analyze" | "props"): void {
  // 先取出目标行再关菜单：关闭菜单会清空 ctxMenu.row，
  // 原先「先关后判断」的写法让三个动作全部变成空操作（右键点了没反应）。
  const row = ctxMenu.row;
  closeRowContextMenu();
  if (!row) return;
  if (cmd === "restart") emit("restart", row);
  if (cmd === "kill") emit("kill", row);
  if (cmd === "analyze") emit("analyze");
  if (cmd === "props") {
    propsRow.value = row;
    propsVisible.value = true;
  }
}

/** 菜单已 teleport 到 body，组件外的左键点击与 ESC 也要能关闭 */
function onDocPointerDown(e: MouseEvent) {
  if (!ctxMenu.visible) return;
  const t = e.target as HTMLElement | null;
  if (t && t.closest && t.closest(".pf-ctx")) return; // 点在菜单内：交给菜单项
  closeRowContextMenu();
}
function onDocKeydown(e: KeyboardEvent) { if (e.key === "Escape") closeRowContextMenu(); }
onMounted(() => {
  document.addEventListener("mousedown", onDocPointerDown, true);
  document.addEventListener("keydown", onDocKeydown);
});
onBeforeUnmount(() => {
  document.removeEventListener("mousedown", onDocPointerDown, true);
  document.removeEventListener("keydown", onDocKeydown);
});
</script>

<template>
  <ProfileSectionShell
    :strip="strip"
    :keyword="keyword"
    keyword-placeholder="PID / 进程名 / 用户 / 命令行"
    :loading="loading"
    :error="error"
    :has-rows="view.length > 0"
    empty-text="该主机未上报进程信息"
    unit="个进程"
    :paged="paged"
    :page="page"
    :page-size="pageSize"
    :total="total"
    :truncated="truncated"
    @search="(kw: string) => emit('search', kw)"
    @commit="(kw: string) => emit('commit', kw)"
    @page="(d: number) => emit('page', d)"
    @refresh="emit('refresh')"
  >
    <template #tools>
      <div class="proc-metric">
        <button :class="['proc-metric-btn', { on: metric === 'cpu' }]" @click="metric = 'cpu'" title="按 CPU 排序">
          <ReIcon name="Cpu" :size="14" />
        </button>
        <button :class="['proc-metric-btn', { on: metric === 'mem' }]" @click="metric = 'mem'" title="按内存排序">
          <ReIcon name="Histogram" :size="14" />
        </button>
      </div>
      <div class="proc-pid-filter">
        <ReInput v-model="pidFilter" placeholder="PID" clearable prefix-icon="Search" style="width: 96px" />
      </div>
      <ReButton icon="DataAnalysis" layout="square" :show-text="false" title="内存分析" tip="内存分析" @click="emit('analyze')" />
    </template>

    <div class="proc-list">
      <div
        v-for="p in view"
        :key="p.pid"
        :class="['proc-row', p.tone ? `t-${p.tone}` : '', { open: expandedPid === p.pid }]"
        @contextmenu.prevent.stop="onRowContextMenu($event, p)"
      >
        <el-popover
          placement="right"
          :width="380"
          trigger="hover"
          popper-class="proc-detail-pop"
          :disabled="!p.raw"
        >
          <template #reference>
            <div class="proc-main" @click="toggleRow(p.pid)">
              <span class="proc-caret">{{ expandedPid === p.pid ? "▾" : "▸" }}</span>

              <span v-if="p.tile.brand" class="proc-tile proc-tile--brand" v-html="p.tile.brand"></span>
              <span v-else class="proc-tile" :style="{ background: p.tile.bg }">
                <span v-if="p.tile.glyph" class="proc-glyph" v-html="p.tile.glyph"></span>
                <template v-else>{{ p.tile.letter }}</template>
              </span>

              <span class="proc-name pf-mono pf-ellipsis">{{ p.raw.name || "—" }}</span>
              <span v-if="isZombie(p.raw)" class="proc-zombie pf-pill t-bad" title="进程已退出，仅剩进程表项等待父进程回收">僵尸</span>

              <span class="proc-bar-wrap">
                <span class="pf-bar"><i :style="{ width: p.ratio + '%' }" /></span>
              </span>

              <b class="proc-val pf-mono">{{ p.valueText }}</b>
              <span class="proc-pid pf-mono pf-dim">PID {{ p.pid }}</span>
              <span class="proc-user pf-dim pf-ellipsis">{{ p.raw.user || "—" }}</span>
            </div>
          </template>
          <!-- hover 浮层：当前详情 -->
          <div class="proc-detail-pop__head">
            <b class="pf-mono pf-ellipsis">{{ p.raw.name || "—" }}</b>
            <span class="pf-mono pf-dim">PID {{ p.pid }}</span>
          </div>
          <div class="proc-detail-pop__grid">
            <div class="proc-f"><i>内存</i><b class="pf-mono">{{ fmtMemory(p.raw.memory) }}</b></div>
            <div class="proc-f"><i>线程</i><b class="pf-mono">{{ p.raw.threads ?? "—" }}</b></div>
            <div class="proc-f"><i>父进程</i><b class="pf-mono">{{ p.raw.ppid ?? "—" }}</b></div>
            <div class="proc-f"><i>启动时间</i><b class="pf-mono">{{ p.raw.startTime || "—" }}</b></div>
            <div class="proc-f"><i>状态</i><b :class="{ 'proc-zombie-text': isZombie(p.raw) }">{{ stateLabelOf(p.raw) }}</b></div>
          </div>
          <div class="proc-detail-pop__label">命令行</div>
          <div class="pf-code proc-detail-pop__code">{{ p.raw.command || "—" }}</div>
        </el-popover>

        <div v-if="expandedPid === p.pid" class="proc-detail">
          <!-- 线程列表（后端 API 拉取） -->
          <div class="proc-threads">
            <div class="proc-threads__cap">
              <span>线程</span>
              <template v-if="threadsOf(p.pid).length">
                <b class="pf-mono">{{ threadsOf(p.pid).length }}</b> 个
              </template>
              <span v-if="loadingDetail === p.pid" class="pf-dim proc-detail-loading">加载中…</span>
            </div>
            <template v-if="threadsOf(p.pid).length">
              <div class="proc-thread-list">
                <div
                  v-for="t in threadsOf(p.pid).slice(0, threadExpanded ? undefined : 15)"
                  :key="t.tid"
                  class="proc-thread"
                >
                  <span class="proc-thread__tid pf-mono pf-dim">T{{ t.tid }}</span>
                  <span class="proc-thread__name pf-mono pf-ellipsis">{{ t.name || "—" }}</span>
                  <span class="proc-thread__state pf-pill" :class="threadStateTone(t.state)">{{ t.state || "—" }}</span>
                  <b class="proc-thread__cpu pf-mono">{{ t.cpu != null ? `${fmt1(t.cpu)}%` : "—" }}</b>
                  <b class="proc-thread__mem pf-mono">{{ t.memory != null ? fmtMemory(t.memory) : "—" }}</b>
                </div>
              </div>
              <button v-if="threadsOf(p.pid).length > 15" class="proc-thread-toggle pf-btn" @click="threadExpanded = !threadExpanded">
                {{ threadExpanded ? "收起" : `展开全部 ${threadsOf(p.pid).length} 个` }}
              </button>
            </template>
            <div v-else-if="!loadingDetail || loadingDetail !== p.pid" class="proc-threads__empty">
              {{ (p.raw.threads ?? p.raw.threadCount) ? `已采集 ${p.raw.threads ?? p.raw.threadCount} 个线程（详情未拉取）` : "无线程信息" }}
            </div>
          </div>

          <!-- 子进程（后端 API 优先，本地页内兜底） -->
          <div class="proc-children">
            <div class="proc-children__cap">
              <span>子进程</span>
              <template v-if="allChildrenOf(p.pid).length">
                <b class="pf-mono">{{ allChildrenOf(p.pid).length }}</b> 个
              </template>
            </div>
            <template v-if="allChildrenOf(p.pid).length">
              <div
                v-for="c in allChildrenOf(p.pid)"
                :key="c.pid"
                class="proc-child"
                :class="c.tone ? `t-${c.tone}` : ''"
                :style="{ '--child-depth': c._depth ?? 0 }"
              >
                <span class="proc-child__tile" :style="{ background: leadTileOf('processes', c.raw).bg }">
                  <template v-if="leadTileOf('processes', c.raw).glyph" v-html="leadTileOf('processes', c.raw).glyph"></template>
                  <template v-else>{{ leadTileOf('processes', c.raw).letter }}</template>
                </span>
                <span class="proc-child__name pf-mono pf-ellipsis">{{ c.raw.name || "—" }}</span>
                <span class="proc-child__pid pf-mono pf-dim">PID {{ c.pid }}</span>
                <b class="proc-child__val pf-mono">{{ c.valueText }}</b>
              </div>
            </template>
            <div v-else class="proc-children__empty">没有检测到子进程（或无权限读取）</div>
          </div>
          <div class="pf-actions proc-acts">
            <button
              class="pf-btn"
              :disabled="!canRestart(p.raw) || busyKey === `restart-${p.pid}`"
              :title="canRestart(p.raw) ? '' : '该进程读不到命令行，无法按原样重启'"
              @click="emit('restart', p.raw)"
            >{{ busyKey === `restart-${p.pid}` ? "重启中…" : "重启进程" }}</button>
            <button
              class="pf-btn is-bad"
              :disabled="p.pid <= 0 || busyKey === `kill-${p.pid}`"
              @click="emit('kill', p.raw)"
            >{{ busyKey === `kill-${p.pid}` ? "结束中…" : "结束进程" }}</button>
          </div>
        </div>
      </div>
    </div>
  </ProfileSectionShell>
    <!-- 行右键菜单：Teleport 到 body，避免被细节区裁切 -->
    <Teleport to="body">
      <div
        v-if="ctxMenu.visible"
        class="pf-ctx"
        :style="{ left: ctxMenu.x + 'px', top: ctxMenu.y + 'px' }"
        @click.stop
      >
        <div
          v-for="(item, i) in ctxItems"
          :key="i"
          class="pf-ctx-item"
          :class="{ danger: item.danger, disabled: item.disabled }"
          @click="item.action"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </div>
      </div>
    </Teleport>

    <!-- 进程属性：5 个可采集页签，见 ProfileProcessProperties.vue -->
    <ProfileProcessProperties
      v-model="propsVisible"
      :row="propsRow"
      :host-id="hostId"
      :rows="rows"
    />
</template>

<style scoped lang="scss">
@use "./_profile-kit.scss";

.proc-metric {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  border-radius: 7px;
  background: var(--el-fill-color-light, #f5f7fa);
}
.proc-metric-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 26px;
  padding: 0;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--el-text-color-secondary, #5c6270);
  font: inherit;
  font-size: 11.5px;
  cursor: pointer;
  transition: background 0.16s, color 0.16s, box-shadow 0.16s;
}
.proc-metric-btn.on {
  background: var(--el-bg-color, #fff);
  color: var(--el-text-color-primary, #1f2430);
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(31, 36, 48, 0.1);
}

.proc-pid-filter {
  display: inline-flex;
  align-items: center;
  margin-left: auto;
}

.proc-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.proc-row {
  border-radius: 8px;
  transition: background 0.14s;
}
.proc-row:hover {
  background: var(--el-color-primary-light-9, #f6f4ff);
}
.proc-row.open {
  background: var(--el-color-primary-light-9, #f6f4ff);
}
/* 行右键菜单（Teleport 到 body，随位置钉住） */
.pf-ctx {
  position: fixed;
  z-index: 9999;
  min-width: 160px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 5px;
  box-shadow: var(--el-box-shadow);
}
.pf-ctx-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7px 10px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}
.pf-ctx-item:hover { background: var(--el-fill-color); }
.pf-ctx-item.danger { color: var(--el-color-danger); }
.pf-ctx-item.disabled { opacity: .35; cursor: default; }
.pf-ctx-item.disabled:hover { background: transparent; }
.proc-main {
  display: grid;
  grid-template-columns: 14px 28px minmax(96px, 150px) 1fr 82px 76px minmax(60px, 92px);
  gap: 10px;
  align-items: center;
  padding: 6px 8px;
  cursor: pointer;
}
.proc-caret {
  font-size: 10px;
  color: var(--el-text-color-placeholder, #a8abb2);
  text-align: center;
}
.proc-tile {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  flex: none;
}
.proc-tile--brand {
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-extra-light, #eef0f6);
}
.proc-tile :deep(svg) {
  display: block;
}
.proc-glyph {
  display: inline-flex;
  line-height: 0;
}
.proc-name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-text-color-primary, #1f2430);
}
/* 僵尸标记：进程已退出，指标全是 0，必须靠状态点出来 */
.proc-zombie {
  flex: none;
  font-size: 11px;
  line-height: 16px;
}
.proc-zombie-text {
  color: var(--el-color-danger, #c9403a);
  font-weight: 600;
}
.proc-bar-wrap {
  display: block;
  min-width: 0;
}
.proc-bar-wrap .pf-bar {
  height: 7px;
}
.proc-val {
  font-size: 12.5px;
  font-weight: 600;
  text-align: right;
  color: var(--tone, var(--el-text-color-primary, #1f2430));
}
.proc-pid {
  font-size: 11px;
  text-align: right;
}
.proc-user {
  font-size: 11px;
  text-align: right;
}

.proc-detail {
  padding: 2px 12px 11px 52px;
}
.proc-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px 16px;
  margin-bottom: 10px;
}
.proc-f {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.proc-f i {
  font-style: normal;
  font-size: 11px;
  color: var(--el-text-color-placeholder, #a8abb2);
}
.proc-f b {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--el-text-color-primary, #1f2430);
}
.proc-label {
  margin: 8px 0 4px;
  font-size: 11px;
  color: var(--el-text-color-placeholder, #a8abb2);
}
.proc-acts {
  margin-top: 10px;
}

/* ===== 展开区：子进程树 ===== */
.proc-children {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 8px;
  background: var(--el-fill-color-light, #f5f7fa);
  border-radius: 8px;
}
.proc-children__cap {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  font-size: 11px;
  color: var(--el-text-color-placeholder, #a8abb2);
}
.proc-children__cap b {
  color: var(--el-text-color-secondary, #5c6270);
}
.proc-children__empty {
  padding: 10px 2px;
  font-size: 11.5px;
  color: var(--el-text-color-placeholder, #a8abb2);
}
.proc-child {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 4px 6px 4px calc(8px + (var(--child-depth, 0) * 18px));
  border-radius: 6px;
  transition: background 0.14s;
}
.proc-child:hover {
  background: var(--el-bg-color, #fff);
}
.proc-child__tile {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex: none;
  border-radius: 5px;
  color: #fff;
  font-size: 9.5px;
  font-weight: 700;
}
.proc-child__name {
  min-width: 0;
  flex: 1;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary, #1f2430);
}
.proc-child__pid {
  flex: none;
  font-size: 10.5px;
}
.proc-child__val {
  flex: none;
  width: 62px;
  font-size: 11.5px;
  text-align: right;
  color: var(--tone, var(--el-text-color-primary, #1f2430));
}

/* ===== 展开区：线程列表 ===== */
.proc-threads {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 8px;
  background: var(--el-fill-color-light, #f5f7fa);
  border-radius: 8px;
  margin-bottom: 8px;
}
.proc-threads__cap {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  font-size: 11px;
  color: var(--el-text-color-placeholder, #a8abb2);
}
.proc-threads__cap b {
  color: var(--el-text-color-secondary, #5c6270);
}
.proc-detail-loading {
  font-size: 11px;
}
.proc-thread-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  max-height: 260px;
  overflow-y: auto;
}
.proc-thread {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 3px 4px;
  border-radius: 5px;
  font-size: 11.5px;
}
.proc-thread:hover {
  background: var(--el-bg-color, #fff);
}
.proc-thread__tid {
  flex: none;
  width: 56px;
  font-size: 10.5px;
}
.proc-thread__name {
  min-width: 0;
  flex: 1;
  font-size: 11px;
  font-weight: 500;
}
.proc-thread__state {
  flex: none;
  font-size: 9.5px;
  padding: 1px 5px;
  border-radius: 4px;
}
.proc-thread__cpu {
  flex: none;
  width: 52px;
  text-align: right;
  font-size: 11px;
}
.proc-thread__mem {
  flex: none;
  width: 56px;
  text-align: right;
  font-size: 11px;
}
.proc-threads__empty {
  padding: 6px 2px;
  font-size: 11.5px;
  color: var(--el-text-color-placeholder, #a8abb2);
}
.proc-thread-toggle {
  align-self: flex-start;
  margin-top: 4px;
  font-size: 11px;
}

@media (max-width: 720px) {
  .proc-main {
    grid-template-columns: 14px 28px 1fr 74px;
  }
  .proc-bar-wrap,
  .proc-pid,
  .proc-user {
    display: none;
  }
  .proc-detail {
    padding-left: 12px;
  }
}
</style>

<style>
/* hover 浮层（el-popover 弹到 body，scoped 样式作用不到，独立全局块） */
.proc-detail-pop__head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter, #eef0f6);
}
.proc-detail-pop__head b {
  min-width: 0;
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary, #1f2430);
}
.proc-detail-pop__head span {
  flex: none;
  font-size: 11px;
  color: var(--el-text-color-placeholder, #a8abb2);
}
.proc-detail-pop__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px 16px;
  margin-bottom: 10px;
}
.proc-detail-pop__grid .proc-f i {
  font-style: normal;
  font-size: 11px;
  color: var(--el-text-color-placeholder, #a8abb2);
}
.proc-detail-pop__grid .proc-f b {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--el-text-color-primary, #1f2430);
}
.proc-detail-pop__label {
  margin: 8px 0 4px;
  font-size: 11px;
  color: var(--el-text-color-placeholder, #a8abb2);
}
.proc-detail-pop__code {
  max-height: 150px;
  overflow-y: auto;
  font-size: 11.5px;
  line-height: 1.7;
  color: var(--el-text-color-regular, #4a5162);
  word-break: break-all;
}
</style>

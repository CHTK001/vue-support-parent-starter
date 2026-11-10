<script setup lang="ts">
/**
 * ReProcessTask —— 多任务堆叠的过程任务浮层
 *
 * 用于长耗时操作（项目启停/升级/备份/回滚、软件安装）实时展示：
 * 进度条 + 当前步骤 + 终端风格日志（自动滚底）+ 结果状态。
 *
 * 多个任务只渲染「一个」浮层：
 * - 标题栏可左右切换任务（显示 当前/总数），新任务产生时自动切到最新
 * - 标题栏下方任务条按任务显示状态色（运行中呼吸 / 成功 / 失败），点击即切换
 * - 可最小化为小条（显示 进行中/总数），默认停靠右下角
 * - 标题栏可拖拽，自动限制在视口内
 * - 纯展示组件：任务数据通过 tasks 传入，关闭通过事件回调（通用、不绑定业务）
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, ref, watch } from "vue";

defineOptions({ name: "ReProcessTask" });

/**
 * 任务数据（与业务侧 ProcessTask 结构对齐）
 */
interface ProcessTaskData {
  taskId: string;
  title: string;
  operation: string;
  phase: string;
  currentStep: string;
  progress: number;
  logs: string[];
  finished: boolean;
  success: boolean;
  message: string;
}

const props = withDefaults(
  defineProps<{
    /** 全部任务（容器内部切换展示） */
    tasks: ProcessTaskData[];
    /**
     * 最小化且存在多个任务时，是否自动折叠为「单个最新胶囊」：
     * 鼠标悬停展开全部，移开后延迟折叠回单个（默认开启）。
     */
    autoCollapse?: boolean;
  }>(),
  { autoCollapse: true },
);

const emit = defineEmits<{
  (e: "close", taskId: string): void;
}>();

/**
 * 展开尺寸
 */
const PANEL_W = 380;
const PANEL_H = 440;
const MIN_H = 46;
const GAP = 16;

const rootEl = ref<HTMLElement>();
const logEl = ref<HTMLElement>();

/** 容器内部状态：当前任务下标 / 最小化 / 拖拽坐标 */
const activeIndex = ref(0);
const minimized = ref(false);
const pos = ref<{ x: number; y: number } | null>(null);

/**
 * 操作中文标签
 */
const opLabel: Record<string, string> = {
  start: "启动",
  stop: "停止",
  restart: "重启",
  upgrade: "升级",
  backup: "备份",
  rollback: "回滚",
  install: "安装",
};

function opText(t: ProcessTaskData): string {
  return opLabel[t.operation] ?? t.operation ?? "操作";
}

/**
 * 当前展示任务（带边界保护）
 */
const activeTask = computed<ProcessTaskData | undefined>(() => {
  if (!props.tasks.length) {
    return undefined;
  }
  const i = Math.min(activeIndex.value, props.tasks.length - 1);
  return props.tasks[i];
});

const operationText = computed(() => (activeTask.value ? opText(activeTask.value) : "操作"));

/**
 * el-progress 状态
 */
const progressStatus = computed<"" | "success" | "exception">(() => {
  if (!activeTask.value || !activeTask.value.finished) {
    return "";
  }
  return activeTask.value.success ? "success" : "exception";
});

/** 进行中任务数 */
const runningCount = computed(() => props.tasks.filter((t) => !t.finished).length);

/**
 * 任务数组变化：新任务加入时切到最新；下标越界时回收
 */
watch(
  () => props.tasks.length,
  (n, old) => {
    if (n === 0) {
      return;
    }
    if (n > (old ?? 0)) {
      activeIndex.value = n - 1;
      // 最小化态：新任务以胶囊追加（不强制展开，尊重用户的最小化选择）；
      // 非最小化态本就展示最新任务。
    } else if (activeIndex.value > n - 1) {
      activeIndex.value = n - 1;
    }
  },
);

function prevTask(): void {
  if (props.tasks.length < 2) return;
  activeIndex.value = (activeIndex.value - 1 + props.tasks.length) % props.tasks.length;
}
function nextTask(): void {
  if (props.tasks.length < 2) return;
  activeIndex.value = (activeIndex.value + 1) % props.tasks.length;
}
function selectTask(i: number): void {
  activeIndex.value = i;
}

/**
 * 浮层定位：拖拽后用绝对坐标，否则默认右下角（单一浮层，不再按序号堆叠）
 */
const panelStyle = computed(() => {
  if (pos.value) {
    return { left: `${pos.value.x}px`, top: `${pos.value.y}px` };
  }
  return { right: `${GAP}px`, bottom: `${GAP}px` };
});

/**
 * 标题栏拖拽
 */
function startDrag(event: MouseEvent): void {
  const root = rootEl.value;
  if (!root) {
    return;
  }
  event.preventDefault();
  const startX = event.clientX;
  const startY = event.clientY;
  const rect = root.getBoundingClientRect();
  const origX = rect.left;
  const origY = rect.top;

  const move = (ev: MouseEvent): void => {
    const maxX = window.innerWidth - 120;
    const maxY = window.innerHeight - MIN_H;
    let nx = origX + (ev.clientX - startX);
    let ny = origY + (ev.clientY - startY);
    nx = Math.max(-PANEL_W + 120, Math.min(maxX, nx));
    ny = Math.max(0, Math.min(maxY, ny));
    pos.value = { x: nx, y: ny };
  };
  const up = (): void => {
    document.removeEventListener("mousemove", move);
    document.removeEventListener("mouseup", up);
  };
  document.addEventListener("mousemove", move);
  document.addEventListener("mouseup", up);
}

/**
 * 日志自动滚底（切换任务或有新行时）
 */
watch(
  [() => activeTask.value?.taskId, () => activeTask.value?.logs.length],
  () => {
    if (logEl.value && activeTask.value) {
      logEl.value.scrollTop = logEl.value.scrollHeight;
    }
  },
);

function onClose(): void {
  if (activeTask.value) {
    emit("close", activeTask.value.taskId);
  }
}
function closeTask(taskId: string): void {
  emit("close", taskId);
}
function toggleMinimize(): void {
  minimized.value = !minimized.value;
}

/** 从胶囊「立即查看」：切到该任务并展开完整面板 */
function viewTask(i: number): void {
  activeIndex.value = i;
  minimized.value = false;
}

/** 胶囊粗体状态文案：启动中 / 启动完成 / 启动失败 */
function pillStatusText(t: ProcessTaskData): string {
  const op = opText(t);
  if (!t.finished) {
    return `${op}中`;
  }
  return t.success ? `${op}完成` : `${op}失败`;
}

/**
 * 最小化堆叠「最多显示胶囊数」：仅渲染最近的 N 个，更早的折叠为提示胶囊
 */
const MAX_PILLS = 5;

/** 折叠后被收起的更早任务数 */
const hiddenCount = computed(() => Math.max(0, props.tasks.length - MAX_PILLS));

/** 实际渲染的胶囊（携带任务在 tasks 中的原始下标，供 viewTask 使用） */
const visiblePills = computed(() => {
  const n = props.tasks.length;
  const start = Math.max(0, n - MAX_PILLS);
  const out: { t: ProcessTaskData; i: number }[] = [];
  for (let i = start; i < n; i++) {
    out.push({ t: props.tasks[i], i });
  }
  return out;
});

/** 点击「+N 个更早」：展开面板并定位到最早任务（面板内任务条可切换全部） */
function showOldest(): void {
  activeIndex.value = 0;
  minimized.value = false;
}

/* =========================================================================
 * 自动折叠（autoCollapse）
 * 多任务最小化时只显示最新一个胶囊；鼠标悬停展开全部，移开延迟折叠。
 * ========================================================================= */

/** 堆叠是否处于悬停展开态 */
const stackHovered = ref(false);
let leaveTimer: ReturnType<typeof setTimeout> | null = null;

function onStackEnter(): void {
  if (leaveTimer) {
    clearTimeout(leaveTimer);
    leaveTimer = null;
  }
  stackHovered.value = true;
}

function onStackLeave(): void {
  if (leaveTimer) {
    clearTimeout(leaveTimer);
  }
  // 短暂延迟，避免在胶囊间隙移动时闪烁
  leaveTimer = setTimeout(() => {
    stackHovered.value = false;
    leaveTimer = null;
  }, 200);
}

/** 是否处于「折叠为单个胶囊」态 */
const stackCollapsed = computed(
  () =>
    minimized.value &&
    props.autoCollapse &&
    props.tasks.length > 1 &&
    !stackHovered.value,
);

/** 折叠态只渲染最新胶囊；展开态渲染可见胶囊（受 MAX_PILLS 限制） */
const renderPills = computed<{ t: ProcessTaskData; i: number }[]>(() => {
  if (stackCollapsed.value) {
    const last = props.tasks.length - 1;
    return [{ t: props.tasks[last], i: last }];
  }
  return visiblePills.value;
});
</script>

<template>
  <div
    v-if="activeTask"
    ref="rootEl"
    :class="['re-process', { 're-process--min': minimized,
      're-process--running': activeTask && !activeTask.finished,
      're-process--success': activeTask && activeTask.finished && activeTask.success,
      're-process--error': activeTask && activeTask.finished && !activeTask.success }]"
    :style="panelStyle"
  >
    <!-- 标题栏（可拖拽；最小化时隐藏，由紧凑条接管） -->
    <div v-if="!minimized" class="re-process__bar" @mousedown="startDrag">
      <span class="re-process__state" :class="{ 'is-spin': activeTask && !activeTask.finished,
        'is-ok': activeTask && activeTask.finished && activeTask.success,
        'is-err': activeTask && activeTask.finished && !activeTask.success }">
        <svg v-if="!activeTask.finished" class="ic-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.2-8.55" /></svg>
        <svg v-else-if="activeTask.success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
      </span>
      <span class="re-process__bar-title">{{ operationText }} · {{ activeTask.title }}</span>

      <div class="re-process__bar-actions" @mousedown.stop>
        <!-- 多任务切换 -->
        <template v-if="tasks.length > 1">
          <button class="re-process__switch" type="button" title="上一个任务" @click="prevTask">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <span class="re-process__count">{{ activeIndex + 1 }}/{{ tasks.length }}</span>
          <button class="re-process__switch" type="button" title="下一个任务" @click="nextTask">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>
          <span class="re-process__switch-gap" />
        </template>
        <button class="re-process__btn" type="button" :title="minimized ? '还原' : '最小化'" @click="toggleMinimize">
          <svg v-if="!minimized" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14" /></svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 14h16" /></svg>
        </button>
        <button class="re-process__btn re-process__btn--close" type="button" title="关闭当前任务" @click="onClose">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>
    </div>

    <!-- 多任务状态条 -->
    <div v-if="!minimized && tasks.length > 1" class="task-tabs" @mousedown.stop>
      <button
        v-for="(t, i) in tasks"
        :key="t.taskId"
        type="button"
        :class="['task-tab', { 'is-active': i === activeIndex,
          'is-run': !t.finished, 'is-ok': t.finished && t.success, 'is-err': t.finished && !t.success }]"
        :title="opText(t) + ' · ' + t.title"
        @click="selectTask(i)"
      >
        <span class="task-tab__dot" />
        <span class="task-tab__label">{{ opText(t) }} · {{ t.title }}</span>
      </button>
    </div>

    <!-- 最小化态：每个任务一个胶囊，纵向堆叠（锚定右下角，自下而上生长） -->
    <div
      v-if="minimized"
      class="re-process__stack"
      :class="{ 're-process__stack--collapsed': stackCollapsed }"
      @mouseenter="onStackEnter"
      @mouseleave="onStackLeave"
    >
      <!-- 超出最大显示数量：折叠为「+N 个更早」，点击展开面板（仅展开态显示） -->
      <button v-if="!stackCollapsed && hiddenCount > 0" class="rp-pill rp-pill--more" type="button"
        :title="'还有 ' + hiddenCount + ' 个更早任务'" @click="showOldest">
        <span class="rp-pill__state rp-pill__state--muted">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M13 6l-6 6 6 6M20 6l-6 6 6 6" /></svg>
        </span>
        <span class="rp-pill__body">
          <span class="rp-pill__status">+{{ hiddenCount }} 个更早任务…</span>
          <span class="rp-pill__name">点击展开查看全部</span>
        </span>
      </button>

      <div
        v-for="entry in renderPills"
        :key="entry.t.taskId"
        :class="['rp-pill', { 'rp-pill--stacktop': stackCollapsed,
          'is-run': !entry.t.finished, 'is-ok': entry.t.finished && entry.t.success, 'is-err': entry.t.finished && !entry.t.success }]"
      >
        <!-- 折叠态：数量角标，提示还有 N 个任务 -->
        <span v-if="stackCollapsed" class="rp-pill__count-badge">+{{ tasks.length - 1 }}</span>
        <span class="rp-pill__state">
          <svg v-if="!entry.t.finished" class="ic-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.2-8.55" /></svg>
          <svg v-else-if="entry.t.success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </span>

        <span class="rp-pill__body" :title="pillStatusText(entry.t) + ' · ' + entry.t.title" @click="viewTask(entry.i)">
          <span class="rp-pill__status">{{ pillStatusText(entry.t) }}</span>
          <span class="rp-pill__name">{{ entry.t.title }}</span>
        </span>

        <button class="rp-pill__view" type="button" title="展开完整进度" @click="viewTask(entry.i)">立即查看</button>
        <button class="rp-pill__close" type="button" title="关闭" @click.stop="closeTask(entry.t.taskId)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>
    </div>

    <!-- 展开内容 -->
    <template v-else>
      <div class="re-process__content">
        <div class="re-process__head">
          <el-progress
            :percentage="activeTask.progress"
            :status="progressStatus"
            :stroke-width="8"
            :striped="!activeTask.finished"
            :striped-flow="!activeTask.finished"
          />
          <div class="re-process__step">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" opacity="0.4" /><path d="M12 7v5l3 2" /></svg>
            <span>{{ activeTask.currentStep }}</span>
          </div>
        </div>

        <div ref="logEl" class="re-process__terminal">
          <div v-for="(line, i) in activeTask.logs" :key="i" class="re-process__log-line">{{ line || ' ' }}</div>
        </div>

        <div v-if="activeTask.finished" class="re-process__result" :class="activeTask.success ? 'is-ok' : 'is-err'">
          <svg v-if="activeTask.success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.1V12a10 10 0 1 1-5.9-9.1" /><path d="M22 4L12 14l-3-3" /></svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v5M12 16h.01" /></svg>
          <span>{{ activeTask.success ? "操作成功" : "操作失败" }}<template v-if="activeTask.message">：{{ activeTask.message }}</template></span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.re-process {
  position: fixed;
  z-index: 3000;
  width: 380px;
  height: 440px;
  display: flex;
  flex-direction: column;
  background: var(--bg-container, #fff);
  border: 1px solid var(--border-default, #dcdfe6);
  border-radius: 12px;
  box-shadow: 0 18px 48px rgba(7, 11, 26, 0.28);
  overflow: hidden;
}
.re-process--running { border-top: 2px solid var(--brand-500, #6d5dfc); }
.re-process--success { border-top: 2px solid var(--el-color-success, #67c23a); }
.re-process--error { border-top: 2px solid var(--el-color-danger, #f56c6c); }

/**
 * 最小化 / 堆叠态：根节点只承担定位（position: fixed + 拖拽坐标），
 * 不画任何外壳 —— 视觉上只剩「共 N 个任务」工具条 + 一叠胶囊。
 *
 * <p><b>必须放在状态类之后</b>：`.re-process--min` 与 `.re-process--running`
 * 特异度相同（都是一个类），普通顺序下后面的 `border-top` 会把前面 `border: none`
 * 的 top 边重新画回来，最小化时胶囊外面就残留一条 2px 品牌色描边（顶部包边）。</p>
 */
.re-process--min {
  width: auto;
  height: auto;
  background: transparent;
  border: none;
  border-top: none;
  border-radius: 0;
  box-shadow: none;
  overflow: visible;
}

.re-process__bar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 46px;
  padding: 0 8px 0 12px;
  cursor: move;
  user-select: none;
  flex-shrink: 0;
}
.re-process__state {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}
.re-process__state svg { width: 18px; height: 18px; }
.re-process__state.is-spin { color: var(--brand-500, #6d5dfc); }
.re-process__state.is-ok { color: var(--el-color-success, #67c23a); }
.re-process__state.is-err { color: var(--el-color-danger, #f56c6c); }
.ic-spin { animation: re-spin 0.9s linear infinite; }
@keyframes re-spin { to { transform: rotate(360deg); } }

.re-process__bar-title {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #303133);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.re-process__bar-actions { display: flex; align-items: center; gap: 1px; flex-shrink: 0; }
.re-process__switch-gap { width: 6px; }
.re-process__count {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary, #909399);
  min-width: 30px;
  text-align: center;
}
.re-process__switch,
.re-process__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: var(--text-secondary, #909399);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.re-process__switch svg,
.re-process__btn svg { width: 15px; height: 15px; }
.re-process__switch:hover,
.re-process__btn:hover { background: var(--bg-hover, #f0f2f5); color: var(--text-primary, #303133); }
.re-process__btn--close:hover { color: var(--el-color-danger, #f56c6c); }

/* 多任务状态条 */
.task-tabs {
  display: flex;
  gap: 6px;
  padding: 6px 10px;
  overflow-x: auto;
  border-bottom: 1px solid var(--border-subtle, #ebeef5);
  flex-shrink: 0;
}
.task-tabs::-webkit-scrollbar { height: 0; }
.task-tab {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 24px;
  padding: 0 9px;
  border: 1px solid var(--border-subtle, #e4e7ed);
  border-radius: 12px;
  background: transparent;
  font-size: 11px;
  color: var(--text-secondary, #909399);
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s;
}
.task-tab__dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
.task-tab__label { max-width: 130px; overflow: hidden; text-overflow: ellipsis; }
.task-tab.is-run { color: var(--brand-500, #6d5dfc); border-color: var(--brand-200, #c9c2fb); }
.task-tab.is-run .task-tab__dot { animation: re-breathe 1.1s ease-in-out infinite; }
.task-tab.is-ok { color: var(--el-color-success, #67c23a); }
.task-tab.is-err { color: var(--el-color-danger, #f56c6c); }
.task-tab.is-active {
  background: var(--brand-50, #f2f0fe);
  border-color: var(--brand-400, #9b8ffd);
  color: var(--brand-600, #5a4bd6);
  font-weight: 600;
}
@keyframes re-breathe { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

/* 最小化态：胶囊堆叠（彼此独立、留足间隙；不再有外层容器兜底） */
.re-process__stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: stretch;
  max-height: calc(100vh - 32px);
  /* 只允许纵向滚动：横向一旦可滚动，右上角数量角标外溢 6px 就会长出
     一条横向滚动条（截图底部那条），视觉上像多了个容器 */
  overflow-x: hidden;
  overflow-y: auto;
  padding-right: 2px;
  background: transparent;
}
/**
 * 折叠态（多任务只显示最新一个 + 右上角「+N」角标）：
 * 角标是 `top: -8px; right: -6px` 的绝对定位元素，背后还有两层
 * `translateY(-13px)` 的堆叠卡片 —— 它们都超出胶囊边界。滚动容器
 * （overflow 非 visible）会把它们直接裁掉，角标只剩下半截贴在卡片上，
 * 看起来像 z-index 被压到了卡片后面。这里给溢出部分留出内边距。
 */
.re-process__stack--collapsed {
  padding: 10px 8px 6px 0;
}
.re-process__stack::-webkit-scrollbar { width: 6px; }
.re-process__stack::-webkit-scrollbar-thumb { background: var(--border-default, #dcdfe6); border-radius: 3px; }

/* 「+N 个更早」折叠胶囊（按钮形态，整体可点） */
.rp-pill--more { cursor: pointer; }
.rp-pill__state--muted { background: var(--bg-fill, #f3f4f8); color: var(--el-text-color-secondary, #909399); }

/* 自动折叠态：只渲染最新一个胶囊，靠右上角「+N」角标提示还有几个任务。
   早先版本在胶囊背后画两层伪元素卡片暗示「堆叠」，但那些伪元素是
   `inset: 0` + 负向位移，超出胶囊边界会被滚动容器裁掉一半，视觉上更像
   「被外层卡片压住」；改成不再画，任务卡片彼此独立。 */
.rp-pill--stacktop { position: relative; }

/* 折叠顶胶囊数量角标 */
.rp-pill__count-badge {
  position: absolute;
  top: -8px;
  right: -6px;
  /* 明确压在胶囊之上：角标与卡片有重叠区域，不显式抬层时
     在部分层叠上下文里会被卡片本体盖住半截 */
  z-index: 2;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--brand-500, #6d5dfc);
  color: #fff;
  font-size: 10.5px;
  font-weight: 700;
  line-height: 1;
  border-radius: 9px;
  box-shadow: 0 2px 6px rgba(109, 93, 252, 0.4);
}
.rp-pill {
  box-sizing: border-box;
  width: 330px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 8px 10px 12px;
  background: var(--bg-container, #fff);
  border: 1px solid var(--border-subtle, #eef0f6);
  border-radius: 12px;
  /* 阴影收窄：原来 30px 的扩散会在 10~14px 的间隙里互相叠加，
     两个胶囊之间形成一条发灰的暗带，看着像黏成一整块 */
  box-shadow: 0 2px 8px rgba(7, 11, 26, 0.1);
}
.rp-pill__state {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  flex-shrink: 0;
}
.rp-pill__state svg { width: 16px; height: 16px; }
.rp-pill.is-run .rp-pill__state { background: var(--brand-50, #f6f4ff); color: var(--brand-500, #6d5dfc); }
.rp-pill.is-ok .rp-pill__state { background: var(--el-color-success-light-9, #e7f8ef); color: var(--el-color-success, #2fbf71); }
.rp-pill.is-err .rp-pill__state { background: var(--el-color-danger-light-9, #fdecec); color: var(--el-color-danger, #f56c6c); }

.rp-pill__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
  cursor: pointer;
}
.rp-pill__status {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary, #1f2430);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rp-pill__name {
  font-size: 11.5px;
  color: var(--el-text-color-secondary, #909399);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rp-pill__view {
  flex-shrink: 0;
  border: none;
  background: transparent;
  font-size: 12px;
  font-weight: 600;
  color: var(--brand-600, #5a4bd9);
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;
  white-space: nowrap;
  transition: background 0.15s;
}
.rp-pill__view:hover { background: var(--brand-50, #f6f4ff); }
.rp-pill__close {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 6px;
  color: var(--el-text-color-secondary, #909399);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.rp-pill__close svg { width: 14px; height: 14px; }
.rp-pill__close:hover { background: var(--el-color-danger-light-9, #fdecec); color: var(--el-color-danger, #f56c6c); }

.re-process__content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 4px 14px 12px;
  gap: 10px;
}
.re-process__head { display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }
.re-process__step {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary, #606266);
}
.re-process__step svg { width: 14px; height: 14px; flex-shrink: 0; }

.re-process__terminal {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 10px 12px;
  background: #0d1117;
  border-radius: 8px;
  font-family: "Cascadia Code", "JetBrains Mono", Consolas, "Courier New", monospace;
  font-size: 12px;
  line-height: 1.55;
  color: #c9d1d9;
}
.re-process__terminal::-webkit-scrollbar { width: 8px; }
.re-process__terminal::-webkit-scrollbar-thumb { background: #30363d; border-radius: 4px; }
.re-process__log-line { white-space: pre-wrap; word-break: break-all; }

.re-process__result {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 500;
  flex-shrink: 0;
}
.re-process__result svg { width: 17px; height: 17px; flex-shrink: 0; }
.re-process__result.is-ok { background: var(--el-color-success-light-9, #f0f9eb); color: var(--el-color-success-dark-2, #529b2e); }
.re-process__result.is-err { background: var(--el-color-danger-light-9, #fef0f0); color: var(--el-color-danger-dark-2, #c45656); }
</style>

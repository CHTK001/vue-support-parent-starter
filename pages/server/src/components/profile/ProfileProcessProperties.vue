<script setup lang="ts">
/**
 * 进程属性弹框 —— 对齐 Windows 任务管理器「属性」的形式与信息密度。
 *
 * <p>只保留后端真能采集的五个页签：常规 / 性能 / 网络 / 线程 / 环境。
 * 采不到的 Windows 专属页签（.NET 程序集、GPU、Disk、Token、Modules、Handles、Job）
 * 一律不出现——摆一个永远空着的壳比没有更糟。</p>
 *
 * <p>数据来源：常规与性能取进程行本身；网络取 {@code /ms/system/netproc} 按 pid 过滤；
 * 线程取 {@code /process/{pid}/threads}；环境与工作目录取新增的两个端点
 * （POSIX 读 {@code /proc/<pid>}，Windows 无调试权限时返回空表，页面如实说明）。</p>
 *
 * @author CH
 * @since 4.0.0.51
 */
import { computed, reactive, ref, watch } from "vue";
import ReDialog from "@repo/ui/re-dialog";
import {
  fetchNetProcesses,
  fetchProcessCwd,
  fetchProcessEnv,
  fetchProcessThreads,
  type NetProcessInfo,
  type ThreadInfo,
} from "../../api/hostRuntime";
import { fmt1, fmtMemory, numOf } from "../../utils/hostProfileUi";

interface Props {
  /** 是否显示 */
  modelValue: boolean;
  /** 目标进程行（ProcessRowVO 归一后的结构） */
  row: Record<string, any> | null;
  /** 目标主机 ID，缺省为管控机本机 */
  hostId?: number;
  /** 当前页进程行，用于「同类最大占用」对比 */
  rows?: Record<string, any>[];
}

const props = withDefaults(defineProps<Props>(), {
  row: null,
  hostId: undefined as number | undefined,
  rows: () => [],
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

/** 页签标识 */
type TabKey = "general" | "perf" | "net" | "thread" | "env";

/** 页签定义：顺序与 Windows 属性框一致的常用项对齐，只列可采集的 */
const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "general", label: "常规" },
  { key: "perf", label: "性能" },
  { key: "net", label: "网络" },
  { key: "thread", label: "线程" },
  { key: "env", label: "环境" },
];

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit("update:modelValue", v),
});

const tab = ref<TabKey>("general");

/** 后端数据 */
const threads = ref<ThreadInfo[]>([]);
const netRows = ref<NetProcessInfo[]>([]);
const envRows = ref<Array<{ name: string; value: string }>>([]);
const cwd = ref("");

/** 每个页签的加载/完成状态，切回已加载页签不重复请求 */
const loading = reactive<Record<TabKey, boolean>>({
  general: false,
  perf: false,
  net: false,
  thread: false,
  env: false,
});
const loaded = reactive<Record<TabKey, boolean>>({
  general: true,
  perf: true,
  net: false,
  thread: false,
  env: false,
});
const loadError = ref("");

/** 目标进程号 */
const pid = computed(() => numOf(props.row?.pid));

/** 状态字母（POSIX 的 stat 或 OSHI 枚举名归一后的单字母） */
const stateText = computed(() => String(props.row?.state ?? "").trim());

/** 是否僵尸：只剩进程表项，重启/结束都不会产生实际效果 */
const zombie = computed(() => /^z/i.test(stateText.value));

/** 状态展示：有空状态就显示，Windows 通道确实没有这一列 */
const stateLabel = computed(() => {
  if (!stateText.value) return "未采集";
  const map: Record<string, string> = {
    R: "运行",
    S: "睡眠",
    D: "不可中断",
    T: "已停止",
    Z: "僵尸",
    I: "空闲",
  };
  const key = stateText.value.charAt(0).toUpperCase();
  return map[key] ? `${map[key]}（${stateText.value}）` : stateText.value;
});

/** 同页最大占用，用于性能页的对比条 */
const pageMax = computed(() => {
  let cpu = 0;
  let mem = 0;
  for (const r of props.rows) {
    cpu = Math.max(cpu, numOf(r.cpu));
    mem = Math.max(mem, numOf(r.memory));
  }
  return { cpu, mem };
});

/** CPU 条：绝对值按 100%，另一条按同页最大，两个口径都给 */
const cpuPct = computed(() => Math.max(0, Math.min(100, numOf(props.row?.cpu))));
const memMb = computed(() => Math.max(0, numOf(props.row?.memory)));
const threadCount = computed(() => numOf(props.row?.threads ?? props.row?.threadCount));

const cpuVsPage = computed(() => (pageMax.value.cpu > 0 ? (cpuPct.value / pageMax.value.cpu) * 100 : 0));
const memVsPage = computed(() => (pageMax.value.mem > 0 ? (memMb.value / pageMax.value.mem) * 100 : 0));

/** 该进程的端口占用（网络页） */
const myPorts = computed(() => netRows.value.filter(r => numOf(r.pid) === pid.value));

/** 线程状态色：与进程分区里的线程列表保持同一口径 */
function threadTone(state?: string): string {
  const s = String(state ?? "").toUpperCase();
  if (s.startsWith("R")) return "t-ok";
  if (s.startsWith("Z")) return "t-bad";
  if (s.startsWith("D") || s.startsWith("T")) return "t-warn";
  return "t-mute";
}

function close(): void {
  visible.value = false;
}

/** 重置并加载首个页签的懒数据 */
function reset(): void {
  threads.value = [];
  netRows.value = [];
  envRows.value = [];
  cwd.value = "";
  loadError.value = "";
  loaded.net = false;
  loaded.thread = false;
  loaded.env = false;
  tab.value = "general";
}

watch(
  () => props.modelValue,
  v => {
    if (v) {
      reset();
    }
  },
);

watch(tab, key => {
  void loadTab(key);
});

/**
 * 按页签懒加载：只请求当前页签需要的接口。
 *
 * @param key 页签标识
 */
async function loadTab(key: TabKey): Promise<void> {
  if (key === "general" || key === "perf") return;
  if (loaded[key] || loading[key] || pid.value <= 0) return;
  loading[key] = true;
  loadError.value = "";
  try {
    if (key === "thread") {
      threads.value = await fetchProcessThreads(pid.value, props.hostId);
    } else if (key === "net") {
      const all = await fetchNetProcesses(props.hostId);
      netRows.value = all;
    } else if (key === "env") {
      const [dir, env] = await Promise.all([
        fetchProcessCwd(pid.value, props.hostId),
        fetchProcessEnv(pid.value, props.hostId),
      ]);
      cwd.value = dir || "";
      envRows.value = env || [];
    }
    loaded[key] = true;
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : String(e);
  } finally {
    loading[key] = false;
  }
}
</script>

<template>
  <ReDialog
    v-model="visible"
    :title="`${row?.name || '进程'} 的属性`"
    width="760px"
    confirm-text="确定"
    cancel-text="关闭"
    :footer-hidden="false"
    @confirm="close"
    @cancel="close"
  >
    <div class="pp">
      <div class="pp-head">
        <span class="pp-head__tile" aria-hidden="true">{{ String(row?.name || "?").slice(0, 1).toUpperCase() }}</span>
        <div class="pp-head__text">
          <b class="pf-mono">{{ row?.name || "—" }}</b>
          <span class="pf-dim pf-mono">PID {{ pid > 0 ? pid : "—" }}</span>
        </div>
        <span v-if="zombie" class="pp-badge pp-badge--bad">僵尸</span>
      </div>

      <div class="pp-tabs" role="tablist">
        <button
          v-for="t in tabs"
          :key="t.key"
          role="tab"
          :aria-selected="tab === t.key"
          :class="['pp-tab', { on: tab === t.key }]"
          @click="tab = t.key"
        >
          {{ t.label }}
        </button>
      </div>

      <div v-if="loadError" class="pp-error">{{ loadError }}</div>

      <!-- 常规 -->
      <div v-if="tab === 'general'" class="pp-pane">
        <div v-if="zombie" class="pp-note">
          该进程已退出，进程表项还在等父进程回收。重启与结束对它都不会产生实际效果，
          应当处理它的父进程。
        </div>
        <dl class="pp-defs">
          <div class="pp-def"><dt>进程名</dt><dd class="pf-mono">{{ row?.name || "—" }}</dd></div>
          <div class="pp-def"><dt>可执行路径</dt><dd class="pf-mono pf-ellipsis" :title="row?.path || ''">{{ row?.path || "—" }}</dd></div>
          <div class="pp-def"><dt>PID</dt><dd class="pf-mono">{{ pid > 0 ? pid : "—" }}</dd></div>
          <div class="pp-def"><dt>父进程</dt><dd class="pf-mono">{{ numOf(row?.ppid) > 0 ? numOf(row?.ppid) : "—" }}</dd></div>
          <div class="pp-def"><dt>属主</dt><dd>{{ row?.user || "—" }}</dd></div>
          <div class="pp-def"><dt>状态</dt><dd :class="{ 'pp-zombie': zombie }">{{ stateLabel }}</dd></div>
          <div class="pp-def"><dt>启动时间</dt><dd class="pf-mono">{{ row?.startTime || "—" }}</dd></div>
        </dl>
        <div class="pp-label">命令行</div>
        <div class="pf-code pp-code">{{ row?.command || "—" }}</div>
      </div>

      <!-- 性能 -->
      <div v-else-if="tab === 'perf'" class="pp-pane">
        <div class="pp-bar">
          <div class="pp-bar__head">
            <span>CPU</span>
            <b class="pf-mono">{{ fmt1(cpuPct) }}%</b>
          </div>
          <span class="pp-bar__track"><i class="pp-bar__fill" :style="{ width: `${cpuPct}%` }" /></span>
          <span class="pp-bar__hint pf-dim">本页最高 {{ fmt1(pageMax.cpu) }}%，占其比例 {{ fmt1(cpuVsPage) }}%</span>
        </div>

        <div class="pp-bar">
          <div class="pp-bar__head">
            <span>内存</span>
            <b class="pf-mono">{{ fmtMemory(memMb) }}</b>
          </div>
          <span class="pp-bar__track"><i class="pp-bar__fill pp-bar__fill--mem" :style="{ width: `${Math.min(100, memVsPage)}%` }" /></span>
          <span class="pp-bar__hint pf-dim">本页最高 {{ fmtMemory(pageMax.mem) }}</span>
        </div>

        <div class="pp-defs pp-defs--tight">
          <div class="pp-def"><dt>线程数</dt><dd class="pf-mono">{{ threadCount > 0 ? threadCount : "—" }}</dd></div>
          <div class="pp-def"><dt>状态</dt><dd>{{ stateLabel }}</dd></div>
        </div>
      </div>

      <!-- 网络 -->
      <div v-else-if="tab === 'net'" class="pp-pane">
        <div v-if="loading.net" class="pp-empty">正在读取端口占用…</div>
        <div v-else-if="!myPorts.length" class="pp-empty">该进程当前没有监听或已建立的连接。</div>
        <table v-else class="pp-table">
          <thead>
            <tr><th>协议</th><th>本地地址</th><th>远端地址</th><th>状态</th></tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in myPorts" :key="`${r.local || r.localAddr}-${i}`">
              <td class="pf-mono">{{ (r.protocol || r.type || "").toUpperCase() }}</td>
              <td class="pf-mono">{{ r.local || `${r.localAddr || ""}:${r.localPort ?? ""}` }}</td>
              <td class="pf-mono">{{ r.remote || (r.remoteAddr ? `${r.remoteAddr}:${r.remotePort ?? ""}` : "—") }}</td>
              <td class="pf-mono">{{ r.state || "—" }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 线程 -->
      <div v-else-if="tab === 'thread'" class="pp-pane">
        <div v-if="loading.thread" class="pp-empty">正在读取线程…</div>
        <div v-else-if="!threads.length" class="pp-empty">该进程没有可读的线程明细（可能已退出或无权限）。</div>
        <table v-else class="pp-table">
          <thead>
            <tr><th>TID</th><th>名称</th><th>状态</th><th>CPU</th><th>内存</th></tr>
          </thead>
          <tbody>
            <tr v-for="t in threads" :key="t.tid">
              <td class="pf-mono">{{ t.tid }}</td>
              <td class="pf-mono pf-ellipsis">{{ t.name || "—" }}</td>
              <td><span class="pf-pill" :class="threadTone(t.state)">{{ t.state || "—" }}</span></td>
              <td class="pf-mono">{{ t.cpu != null ? `${fmt1(t.cpu)}%` : "—" }}</td>
              <td class="pf-mono">{{ t.memory != null ? fmtMemory(t.memory) : "—" }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 环境 -->
      <div v-else-if="tab === 'env'" class="pp-pane">
        <div class="pp-label">工作目录</div>
        <div class="pf-code pp-code">{{ cwd || "取不到（该平台不提供或权限不足）" }}</div>
        <div class="pp-label">环境变量</div>
        <div v-if="loading.env" class="pp-empty">正在读取环境变量…</div>
        <div v-else-if="!envRows.length" class="pp-empty">
          没有读到环境变量。POSIX 需要读 /proc/&lt;pid&gt;/environ（同用户或 root 才有权限），
          Windows 读取其他进程的环境变量需要调试权限，本系统不伪造数据。
        </div>
        <table v-else class="pp-table">
          <thead><tr><th>变量</th><th>值</th></tr></thead>
          <tbody>
            <tr v-for="e in envRows" :key="e.name">
              <td class="pf-mono">{{ e.name }}</td>
              <td class="pf-mono pp-break">{{ e.value }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </ReDialog>
</template>

<style scoped lang="scss">
@use "./_profile-kit.scss";

.pp {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 62vh;
}

.pp-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-extra-light, #eef0f6);
}

.pp-head__tile {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: var(--el-color-primary-light-9, #f0eefe);
  color: var(--el-color-primary, #6d5dfc);
  font-weight: 700;
}

.pp-head__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1 1 auto;
}

.pp-badge {
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 12px;
  line-height: 18px;
  border: 1px solid transparent;

  &--bad {
    color: var(--el-color-danger, #e5534b);
    background: var(--el-color-danger-light-9, #fdeceb);
    border-color: var(--el-color-danger-light-7, #fabad5);
  }
}

.pp-tabs {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.pp-tab {
  padding: 4px 12px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--el-text-color-regular, #606266);
  cursor: pointer;
  font-size: 13px;

  &.on {
    color: var(--el-color-primary, #6d5dfc);
    background: var(--el-color-primary-light-9, #f0eefe);
    border-color: var(--el-color-primary-light-7, #d3cbfa);
  }
}

.pp-pane {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: auto;
  min-height: 180px;
}

.pp-note {
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--el-color-warning-dark-2, #b88230);
  background: var(--el-color-warning-light-9, #fdf6ec);
  border: 1px solid var(--el-color-warning-light-7, #f5dab1);
}

.pp-error {
  color: var(--el-color-danger, #e5534b);
  font-size: 13px;
}

.pp-defs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 6px 18px;
  margin: 0;

  &--tight {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
}

.pp-def {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 8px;
  align-items: baseline;
  min-width: 0;

  dt {
    color: var(--el-text-color-placeholder, #a8abb2);
    font-size: 12px;
  }

  dd {
    margin: 0;
    min-width: 0;
    word-break: break-all;
  }
}

.pp-zombie {
  color: var(--el-color-danger, #e5534b);
  font-weight: 600;
}

.pp-label {
  color: var(--el-text-color-placeholder, #a8abb2);
  font-size: 12px;
}

.pp-code {
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--el-fill-color-light, #f5f7fa);
  font-size: 12px;
  word-break: break-all;
  white-space: pre-wrap;
  max-height: 120px;
  overflow: auto;
}

.pp-bar {
  display: flex;
  flex-direction: column;
  gap: 4px;

  &__head {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
  }

  &__track {
    display: block;
    height: 8px;
    border-radius: 999px;
    background: var(--el-fill-color, #f0f2f5);
    overflow: hidden;
  }

  &__fill {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--el-color-primary, #6d5dfc);

    &--mem {
      background: var(--el-color-success, #2fbf71);
    }
  }

  &__hint {
    font-size: 12px;
  }
}

.pp-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;

  th,
  td {
    padding: 6px 8px;
    text-align: left;
    border-bottom: 1px solid var(--el-border-color-extra-light, #eef0f6);
    max-width: 240px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  th {
    color: var(--el-text-color-placeholder, #a8abb2);
    font-weight: 500;
  }
}

.pp-break {
  word-break: break-all;
}

.pp-empty {
  padding: 18px 10px;
  text-align: center;
  color: var(--el-text-color-placeholder, #a8abb2);
  font-size: 13px;
}
</style>

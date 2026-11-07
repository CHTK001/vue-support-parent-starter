<!--
  /**
   * 虚拟桌面 · 系统信息窗口
   *
   * <p>上半部分是台账里已有的这台主机的关键字段（一次详情请求，不额外打接口），
   * 下半部分是若干<b>只读</b>探测：命令都写死在窗口里，没有输入框，
   * 因此不会变成第二个终端，也不会因为手滑改到远端状态。</p>
   *
   * <p>命令按主机 OS 切方言，Windows / Linux 都能直接用；执行结果仍然走
   * 批量执行接口，所以和「命令」窗口一样会落执行日志（审计口径一致）。</p>
   */
  -->
<template>
  <div class="ds">
    <div class="ds__bar">
      <span class="ds__title">{{ host?.serverHostName || hostName || `主机 #${hostId}` }}</span>
      <span class="ds__os">{{ host?.serverHostOsType || osType || "—" }}</span>
      <span class="ds__spacer" />
      <span class="ds__hint">只读探测 · 记入执行日志</span>
      <button type="button" class="ds__btn" :disabled="running" @click="run(activeProbe)">
        <ReIcon name="RefreshRight" :size="12" />
      </button>
    </div>

    <div class="ds__grid">
      <div v-for="c in cards" :key="c.label" class="ds__cell">
        <span class="ds__k">{{ c.label }}</span>
        <span class="ds__v" :class="{ mono: c.mono }" :title="String(c.value)">{{ c.value }}</span>
      </div>
    </div>

    <div class="ds__tabs">
      <button
        v-for="p in probes"
        :key="p.key"
        type="button"
        class="ds__tab"
        :class="{ 'is-on': activeProbe === p.key }"
        @click="run(p.key)"
      >
        {{ p.label }}
      </button>
    </div>

    <div class="ds__out">
      <div class="ds__out-head">
        <span class="ds__cmd">{{ currentProbe?.cmd || "—" }}</span>
        <em v-if="result" class="ds__meta" :class="result.exitCode === 0 ? 'is-ok' : 'is-bad'">
          exit {{ result.exitCode ?? "?" }} · {{ result.costMs }}ms
        </em>
      </div>
      <div v-if="running" class="ds__empty">正在执行…</div>
      <div v-else-if="error" class="ds__err">{{ error }}</div>
      <pre v-else-if="result" class="ds__pre">{{ result.output || result.error || "（无输出）" }}</pre>
      <div v-else class="ds__empty">选择上方一项开始探测</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { getHost, runCommand } from "../../../api";

type ProbeKey = "basic" | "disk" | "memory" | "network" | "boot" | "process";

const props = defineProps<{
  /** 主机标识 */
  hostId: number;
  /** 主机名（父级透传，省一次请求） */
  hostName?: string;
  /** 操作系统类型，用于切换命令方言 */
  osType?: string | null;
  /** 窗口是否激活（父级透传） */
  active?: boolean;
}>();

/** 单次输出上限：探测结果都是短文本，超过就截断，别让 DOM 被一条命令拖死 */
const MAX_OUTPUT = 12000;

const host = ref<any>(null);
const activeProbe = ref<ProbeKey>("basic");
const running = ref(false);
const error = ref("");
const result = ref<{ output: string; error: string; exitCode: number | null; costMs: number } | null>(null);

const isWin = computed(() => /win/i.test(String(host.value?.serverHostOsType ?? props.osType ?? "")));

/** 探测项：命令固定，不接受用户输入 */
const probes = computed<Array<{ key: ProbeKey; label: string; cmd: string }>>(() => {
  if (isWin.value) {
    return [
      { key: "basic", label: "系统信息", cmd: "ver & hostname" },
      { key: "disk", label: "磁盘", cmd: "wmic logicaldisk get caption,size,freespace" },
      { key: "memory", label: "内存", cmd: "wmic OS get TotalVisibleMemorySize,FreePhysicalMemory" },
      { key: "network", label: "网络", cmd: "ipconfig" },
      { key: "boot", label: "启动时间", cmd: "wmic os get lastbootuptime" },
      { key: "process", label: "进程", cmd: "tasklist" },
    ];
  }
  return [
    { key: "basic", label: "系统信息", cmd: "uname -a; uptime" },
    { key: "disk", label: "磁盘", cmd: "df -h" },
    { key: "memory", label: "内存", cmd: "free -m" },
    { key: "network", label: "网络", cmd: "ip -br addr 2>/dev/null || ifconfig" },
    { key: "boot", label: "启动时间", cmd: "uptime -s 2>/dev/null || who -b" },
    { key: "process", label: "进程", cmd: "ps -eo pid,comm,%cpu,%mem --sort=-%cpu 2>/dev/null | head -n 15" },
  ];
});

const currentProbe = computed(() => probes.value.find((p) => p.key === activeProbe.value));

/** 台账关键字段 */
const cards = computed(() => {
  const h = host.value ?? {};
  const online = Number(h.serverHostOnline) === 1;
  const pct = (v?: number | null) => (v == null ? "—" : `${Math.max(0, Math.min(100, Number(v))).toFixed(0)}%`);
  return [
    { label: "IP 地址", value: h.serverHostAddress || "—", mono: true },
    { label: "SSH 端口", value: h.serverHostPort ?? 22, mono: true },
    { label: "操作系统", value: h.serverHostOsType || "—", mono: false },
    { label: "在线", value: online ? "在线" : "离线", mono: false },
    { label: "采集方式", value: h.serverHostCollectMode || "—", mono: false },
    { label: "SSH 开关", value: Number(h.serverHostSshEnabled ?? 1) === 0 ? "已关闭" : "已开启", mono: false },
    { label: "CPU", value: pct(h.serverHostCpuUsage), mono: true },
    { label: "内存", value: pct(h.serverHostMemUsage), mono: true },
    { label: "磁盘", value: pct(h.serverHostDiskUsage), mono: true },
    { label: "内存总量", value: h.serverHostMemoryMb ? `${(Number(h.serverHostMemoryMb) / 1024).toFixed(1)} GB` : "—", mono: true },
    { label: "磁盘容量", value: h.serverHostDiskGb ? `${h.serverHostDiskGb} GB` : "—", mono: true },
    { label: "最近采集", value: h.serverHostLastCollectTime || "—", mono: true },
  ];
});

/**
 * 读取台账。
 */
async function loadHost(): Promise<void> {
  try {
    host.value = await getHost(props.hostId);
  } catch (e) {
    error.value = `主机信息读取失败：${String((e as Error)?.message ?? e)}`;
  }
}

/**
 * 执行一项只读探测。
 *
 * @param key 探测项
 */
async function run(key: ProbeKey): Promise<void> {
  activeProbe.value = key;
  const probe = probes.value.find((p) => p.key === key);
  if (!probe || running.value) return;
  running.value = true;
  error.value = "";
  const started = Date.now();
  try {
    const logs = (await runCommand([props.hostId], probe.cmd, 45)) ?? [];
    const log = logs[0] ?? {};
    const out = String(log.msExecLogOutput ?? "");
    result.value = {
      output: out.length > MAX_OUTPUT ? `${out.slice(0, MAX_OUTPUT)}\n…（输出过长，已截断）` : out,
      error: String(log.msExecLogError ?? ""),
      exitCode: log.msExecLogExitCode ?? null,
      costMs: log.msExecLogCostMs ?? Date.now() - started,
    };
  } catch (e) {
    result.value = null;
    error.value = `执行失败：${String((e as Error)?.message ?? e)}`;
  } finally {
    running.value = false;
  }
}

onMounted(async () => {
  await loadHost();
  void run("basic");
});
</script>

<style scoped>
.ds {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  font-size: 12px;
  color: #d8d3e0;
  background: #16141c;
}

.ds__bar {
  display: flex;
  flex: none;
  gap: 8px;
  align-items: center;
  height: 30px;
  padding: 0 10px;
  background: #1b1922;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.ds__title {
  overflow: hidden;
  font-weight: 600;
  color: #efeaf7;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ds__os {
  font-size: 10.5px;
  color: #8f8a9b;
}

.ds__spacer {
  flex: 1;
}

.ds__hint {
  font-size: 10.5px;
  color: #7e7889;
}

.ds__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 20px;
  color: #cfc9da;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 5px;
}

.ds__btn:not(:disabled):hover {
  color: #fff;
  background: rgba(233, 84, 32, 0.3);
}

.ds__grid {
  display: grid;
  flex: none;
  grid-template-columns: repeat(auto-fill, minmax(158px, 1fr));
  gap: 5px;
  padding: 9px 10px 4px;
}

.ds__cell {
  display: flex;
  gap: 8px;
  align-items: baseline;
  justify-content: space-between;
  padding: 5px 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.ds__k {
  flex: none;
  font-size: 10px;
  color: #8f8a9b;
}

.ds__v {
  overflow: hidden;
  font-size: 11px;
  color: #e6e1ef;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ds__v.mono {
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
}

.ds__tabs {
  display: flex;
  flex: none;
  flex-wrap: wrap;
  gap: 5px;
  padding: 7px 10px 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.ds__tab {
  height: 21px;
  padding: 0 9px;
  font-size: 11px;
  color: #cfc9da;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
}

.ds__tab:hover {
  color: #fff;
  background: rgba(233, 84, 32, 0.24);
}

.ds__tab.is-on {
  color: #fff;
  background: rgba(233, 84, 32, 0.72);
  border-color: transparent;
}

.ds__out {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 0 10px 10px;
}

.ds__out-head {
  display: flex;
  flex: none;
  gap: 8px;
  align-items: center;
  padding: 4px 0;
}

.ds__cmd {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 10.5px;
  color: #9d97ab;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ds__meta {
  flex: none;
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 10.5px;
  font-style: normal;
  color: #8f8a9b;
}

.ds__meta.is-bad {
  color: #ff9a86;
}

.ds__pre {
  flex: 1;
  min-height: 0;
  padding: 8px 9px;
  margin: 0;
  overflow: auto;
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 11px;
  line-height: 1.55;
  color: #c9c4d4;
  white-space: pre-wrap;
  word-break: break-all;
  background: #100e15;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 7px;
}

.ds__empty {
  flex: 1;
  padding: 20px;
  font-size: 11.5px;
  color: #7e7889;
  text-align: center;
  background: #100e15;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 7px;
}

.ds__err {
  flex: none;
  padding: 8px 9px;
  font-size: 11.5px;
  color: #ffb4a2;
  background: rgba(255, 86, 48, 0.12);
  border-radius: 7px;
}
</style>

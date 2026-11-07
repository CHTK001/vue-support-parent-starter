<!--
  /**
   * 虚拟桌面 · 命令窗口
   *
   * <p>复用批量执行接口（单主机），所有命令都会落 {@code ms_exec_log}，
   * 与「批量作业」页看到的是同一份审计记录。快捷命令按主机 OS 切换方言，
   * 所以同一个窗口在 Linux 与 Windows 上都能直接用。</p>
   *
   * <p>输出在浏览器侧再截断一次：远端一条 {@code cat} 就能回几十兆，
   * 不能让 DOM 被一次误操作拖死。</p>
   */
  -->
<template>
  <div class="dc">
    <div class="dc__bar">
      <span class="dc__host">{{ hostName || `主机 #${hostId}` }}</span>
      <span class="dc__os">{{ osType || "未知系统" }}</span>
      <span class="dc__spacer" />
      <span class="dc__hint">命令会记入执行日志</span>
    </div>

    <div class="dc__quick">
      <button
        v-for="q in quickCommands"
        :key="q.label"
        type="button"
        class="dc__chip"
        :disabled="running"
        @click="run(q.cmd)"
      >
        {{ q.label }}
      </button>
    </div>

    <div class="dc__input">
      <span class="dc__prompt">$</span>
      <input
        v-model="command"
        class="dc__cmd"
        type="text"
        spellcheck="false"
        placeholder="输入命令后回车执行"
        :disabled="running"
        @keydown.enter="run(command)"
      />
      <button type="button" class="dc__go" :disabled="running || !command.trim()" @click="run(command)">
        {{ running ? "执行中…" : "执行" }}
      </button>
    </div>

    <div class="dc__out">
      <div v-if="!history.length && !running" class="dc__empty">
        选择上方快捷命令，或直接输入命令回车
      </div>
      <div v-for="(h, i) in history" :key="i" class="dc__block">
        <div class="dc__block-head">
          <span class="dc__block-cmd">{{ h.cmd }}</span>
          <span class="dc__block-meta" :class="h.exitCode === 0 ? 'is-ok' : 'is-bad'">
            exit {{ h.exitCode ?? "?" }} · {{ h.costMs }}ms
          </span>
        </div>
        <pre v-if="h.output" class="dc__pre">{{ h.output }}</pre>
        <pre v-if="h.error" class="dc__pre is-err">{{ h.error }}</pre>
        <div v-if="!h.output && !h.error" class="dc__pre is-dim">（无输出）</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { runCommand } from "../../../api";

const props = defineProps<{
  /** 主机标识 */
  hostId: number;
  /** 主机名（父级透传，省一次详情请求） */
  hostName?: string;
  /** 操作系统类型，用于切换命令方言 */
  osType?: string | null;
  /** 窗口是否激活（父级透传） */
  active?: boolean;
}>();

/** 单次输出上限：超过就截断，避免一条 cat 把 DOM 撑爆 */
const MAX_OUTPUT = 20000;

interface RunRecord {
  cmd: string;
  output: string;
  error: string;
  exitCode: number | null;
  costMs: number;
}

const command = ref("");
const running = ref(false);
const history = ref<RunRecord[]>([]);

const isWindows = computed(() => /win/i.test(props.osType ?? ""));

/** 快捷命令：按 OS 切换方言 */
const quickCommands = computed(() =>
  isWindows.value
    ? [
        { label: "系统信息", cmd: "ver & hostname" },
        { label: "磁盘", cmd: "wmic logicaldisk get caption,size,freespace" },
        { label: "进程", cmd: "tasklist" },
        { label: "服务", cmd: "net start" },
        { label: "网络", cmd: "ipconfig" },
      ]
    : [
        { label: "系统信息", cmd: "uname -a && uptime" },
        { label: "磁盘", cmd: "df -h" },
        { label: "内存", cmd: "free -m" },
        { label: "进程", cmd: "ps aux --sort=-%cpu | head -n 15" },
        { label: "服务", cmd: "systemctl --no-pager --type=service --state=running | head -n 20" },
        { label: "网络", cmd: "ip -br addr 2>/dev/null || ifconfig" },
      ],
);

/**
 * 执行一条命令，结果压进历史（最新在上）。
 *
 * @param raw 命令文本
 */
async function run(raw: string): Promise<void> {
  const cmd = (raw ?? "").trim();
  if (!cmd || running.value) return;
  running.value = true;
  const started = Date.now();
  try {
    const logs = (await runCommand([props.hostId], cmd, 60)) ?? [];
    const log = logs[0] ?? {};
    history.value.unshift({
      cmd,
      output: clip(log.msExecLogOutput ?? ""),
      error: clip(log.msExecLogError ?? ""),
      exitCode: log.msExecLogExitCode ?? null,
      costMs: log.msExecLogCostMs ?? Date.now() - started,
    });
  } catch (e) {
    history.value.unshift({
      cmd,
      output: "",
      error: String((e as Error)?.message ?? e),
      exitCode: -1,
      costMs: Date.now() - started,
    });
  } finally {
    running.value = false;
    if (history.value.length > 12) history.value.length = 12;
  }
}

/**
 * 输出截断。
 *
 * @param s 原文
 */
function clip(s: string): string {
  if (!s) return "";
  return s.length > MAX_OUTPUT ? `${s.slice(0, MAX_OUTPUT)}\n…（输出过长，已截断）` : s;
}
</script>

<style scoped>
.dc {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  font-size: 12px;
  color: #d8d3e0;
  background: #16141c;
}

.dc__bar {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
  height: 30px;
  padding: 0 10px;
  background: #1b1922;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.dc__host {
  font-weight: 600;
  color: #efeaf7;
}

.dc__os {
  font-size: 10.5px;
  color: #8f8a9b;
}

.dc__spacer {
  flex: 1;
}

.dc__hint {
  font-size: 10.5px;
  color: #7e7889;
}

.dc__quick {
  display: flex;
  flex: none;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 10px 6px;
}

.dc__chip {
  height: 22px;
  padding: 0 9px;
  font-size: 11px;
  color: #cfc9da;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
}

.dc__chip:not(:disabled):hover {
  color: #fff;
  background: rgba(233, 84, 32, 0.24);
  border-color: rgba(233, 84, 32, 0.45);
}

.dc__chip:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.dc__input {
  display: flex;
  flex: none;
  gap: 6px;
  align-items: center;
  margin: 0 10px 8px;
  padding: 0 8px;
  background: #100e15;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 7px;
}

.dc__prompt {
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 12px;
  color: #e95420;
}

.dc__cmd {
  flex: 1;
  height: 30px;
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 12px;
  color: #e6e1ef;
  background: transparent;
  border: 0;
  outline: none;
}

.dc__go {
  flex: none;
  height: 22px;
  padding: 0 10px;
  font-size: 11px;
  color: #fff;
  cursor: pointer;
  background: rgba(233, 84, 32, 0.85);
  border: 0;
  border-radius: 5px;
}

.dc__go:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.dc__out {
  flex: 1;
  min-height: 0;
  padding: 0 10px 10px;
  overflow-y: auto;
}

.dc__empty {
  padding: 20px;
  font-size: 11.5px;
  color: #7e7889;
  text-align: center;
}

.dc__block {
  margin-bottom: 8px;
  overflow: hidden;
  background: #100e15;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 7px;
}

.dc__block-head {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 5px 9px;
  background: rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.dc__block-cmd {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 11px;
  color: #cfc9da;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dc__block-meta {
  flex: none;
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 10.5px;
  color: #8f8a9b;
}

.dc__block-meta.is-bad {
  color: #ff9a86;
}

.dc__pre {
  max-height: 260px;
  padding: 8px 9px;
  margin: 0;
  overflow: auto;
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 11px;
  line-height: 1.55;
  color: #c9c4d4;
  white-space: pre-wrap;
  word-break: break-all;
}

.dc__pre.is-err {
  color: #ff9a86;
}

.dc__pre.is-dim {
  color: #7e7889;
}
</style>

<!--
  /**
   * 虚拟桌面 · 网络窗口
   *
   * <p>排障最常用的三件事：能不能 ping 通、某个端口通不通、本机在监听哪些端口。
   * 前两项要用户输入目标，所以输入只接受「主机名 / IPv4 / 端口号」这两类字符，
   * 拼命令前统一校验——这个窗口不能变成任意命令执行。</p>
   *
   * <p>命令按主机 OS 切方言，结果仍然走批量执行接口，会落执行日志。</p>
   */
  -->
<template>
  <div class="dn">
    <div class="dn__bar">
      <span class="dn__host">{{ hostName || `主机 #${hostId}` }}</span>
      <span class="dn__os">{{ osType || "未知系统" }}</span>
      <span class="dn__spacer" />
      <span class="dn__hint">命令会记入执行日志</span>
    </div>

    <div class="dn__tabs">
      <button
        v-for="t in tabs"
        :key="t.key"
        type="button"
        class="dn__tab"
        :class="{ 'is-on': tab === t.key }"
        @click="tab = t.key"
      >
        {{ t.label }}
      </button>
    </div>

    <div class="dn__form">
      <template v-if="tab === 'ping'">
        <input v-model="target" class="dn__input" type="text" spellcheck="false" placeholder="主机名或 IP" @keydown.enter="run" />
        <button type="button" class="dn__go" :disabled="running" @click="run">{{ running ? "执行中…" : "Ping 4 次" }}</button>
      </template>
      <template v-else-if="tab === 'port'">
        <input v-model="target" class="dn__input" type="text" spellcheck="false" placeholder="主机名或 IP" @keydown.enter="run" />
        <input v-model="port" class="dn__input dn__input--port" type="text" spellcheck="false" placeholder="端口" @keydown.enter="run" />
        <button type="button" class="dn__go" :disabled="running" @click="run">{{ running ? "执行中…" : "探测端口" }}</button>
      </template>
      <template v-else>
        <span class="dn__tip">列出这台主机正在监听的端口（TCP）</span>
        <span class="dn__spacer" />
        <button type="button" class="dn__go" :disabled="running" @click="run">{{ running ? "执行中…" : "刷新" }}</button>
      </template>
    </div>

    <div class="dn__out">
      <div class="dn__out-head">
        <span class="dn__cmd">{{ currentCmd || "—" }}</span>
        <em v-if="meta" class="dn__meta" :class="meta.exitCode === 0 ? 'is-ok' : 'is-bad'">
          exit {{ meta.exitCode ?? "?" }} · {{ meta.costMs }}ms
        </em>
      </div>
      <div v-if="error" class="dn__err">{{ error }}</div>
      <pre v-else-if="output" class="dn__pre">{{ output }}</pre>
      <div v-else-if="running" class="dn__empty">正在执行…</div>
      <div v-else class="dn__empty">选择上方一项开始探测</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { runCommand } from "../../../api";

type NetTab = "ping" | "port" | "listen";

const props = defineProps<{
  /** 主机标识 */
  hostId: number;
  /** 主机名（父级透传） */
  hostName?: string;
  /** 操作系统类型，用于切换命令方言 */
  osType?: string | null;
  /** 主机地址，作为默认探测目标 */
  address?: string | null;
  /** 窗口是否激活（父级透传） */
  active?: boolean;
}>();

/** 输出上限：netstat 在连接多的机器上能回几百行 */
const MAX_OUTPUT = 16000;

const tabs: Array<{ key: NetTab; label: string }> = [
  { key: "ping", label: "连通性" },
  { key: "port", label: "端口" },
  { key: "listen", label: "监听端口" },
];

const tab = ref<NetTab>("listen");
const target = ref(props.address ?? "");
const port = ref("22");
const running = ref(false);
const error = ref("");
const output = ref("");
const meta = ref<{ exitCode: number | null; costMs: number } | null>(null);
const currentCmd = ref("");

const isWin = computed(() => /win/i.test(props.osType ?? ""));

/** 主机名 / IPv4 白名单：只允许这些字符，避免拼命令时被注入 */
const HOST_RE = /^[A-Za-z0-9._-]{1,64}$/;

/**
 * 拼出这次要执行的命令。
 *
 * <p>目标与端口先过正则再拼，命令里不带任何用户原文的其他内容。</p>
 *
 * @returns 命令；校验失败时返回空串
 */
function buildCommand(): string {
  if (tab.value === "listen") {
    return isWin.value ? "netstat -ano | findstr LISTENING" : "ss -ltnp 2>/dev/null | head -n 80 || netstat -ltnp";
  }
  const host = target.value.trim();
  if (!HOST_RE.test(host)) return "";
  if (tab.value === "ping") {
    return isWin.value ? `ping -n 4 ${host}` : `ping -c 4 -W 2 ${host}`;
  }
  const p = Number(port.value.trim());
  if (!Number.isInteger(p) || p < 1 || p > 65535) return "";
  return isWin.value
    ? `powershell -NoProfile -Command "Test-NetConnection -ComputerName ${host} -Port ${p} -InformationLevel Quiet"`
    : `timeout 3 bash -c "cat < /dev/null > /dev/tcp/${host}/${p}" && echo OPEN || echo CLOSED`;
}

/**
 * 执行当前这一项。
 */
async function run(): Promise<void> {
  if (running.value) return;
  const cmd = buildCommand();
  if (!cmd) {
    error.value = tab.value === "port" ? "请填写主机名 / IP 和 1-65535 的端口号" : "请填写合法的主机名或 IP";
    return;
  }
  running.value = true;
  error.value = "";
  currentCmd.value = cmd;
  const started = Date.now();
  try {
    const logs = (await runCommand([props.hostId], cmd, 40)) ?? [];
    const log = logs[0] ?? {};
    const out = String(log.msExecLogOutput ?? "");
    const err = String(log.msExecLogError ?? "");
    output.value = out.length > MAX_OUTPUT ? `${out.slice(0, MAX_OUTPUT)}\n…（输出过长，已截断）` : out || err;
    meta.value = {
      exitCode: log.msExecLogExitCode ?? null,
      costMs: log.msExecLogCostMs ?? Date.now() - started,
    };
    if (!output.value) output.value = "（无输出）";
  } catch (e) {
    error.value = `执行失败：${String((e as Error)?.message ?? e)}`;
    meta.value = null;
    output.value = "";
  } finally {
    running.value = false;
  }
}

onMounted(() => {
  void run();
});
</script>

<style scoped>
.dn {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  font-size: 12px;
  color: #d8d3e0;
  background: #16141c;
}

.dn__bar {
  display: flex;
  flex: none;
  gap: 8px;
  align-items: center;
  height: 30px;
  padding: 0 10px;
  background: #1b1922;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.dn__host {
  overflow: hidden;
  font-weight: 600;
  color: #efeaf7;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dn__os {
  flex: none;
  font-size: 10.5px;
  color: #8f8a9b;
}

.dn__spacer {
  flex: 1;
}

.dn__hint {
  flex: none;
  font-size: 10.5px;
  color: #7e7889;
}

.dn__tabs {
  display: flex;
  flex: none;
  flex-wrap: wrap;
  gap: 5px;
  padding: 7px 10px 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.dn__tab {
  height: 21px;
  padding: 0 9px;
  font-size: 11px;
  color: #cfc9da;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
}

.dn__tab:hover {
  color: #fff;
  background: rgba(233, 84, 32, 0.24);
}

.dn__tab.is-on {
  color: #fff;
  background: rgba(233, 84, 32, 0.72);
  border-color: transparent;
}

.dn__form {
  display: flex;
  flex: none;
  gap: 6px;
  align-items: center;
  padding: 2px 10px 8px;
}

.dn__tip {
  font-size: 11px;
  color: #8f8a9b;
}

.dn__input {
  flex: 1;
  height: 24px;
  padding: 0 8px;
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 11.5px;
  color: #e6e1ef;
  background: #100e15;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  outline: none;
}

.dn__input--port {
  flex: none;
  width: 80px;
}

.dn__go {
  flex: none;
  height: 24px;
  padding: 0 11px;
  font-size: 11px;
  color: #fff;
  cursor: pointer;
  background: rgba(233, 84, 32, 0.85);
  border: 0;
  border-radius: 5px;
}

.dn__go:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.dn__out {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 0 10px 10px;
}

.dn__out-head {
  display: flex;
  flex: none;
  gap: 8px;
  align-items: center;
  padding: 2px 0 5px;
}

.dn__cmd {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 10.5px;
  color: #9d97ab;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dn__meta {
  flex: none;
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 10.5px;
  font-style: normal;
  color: #8f8a9b;
}

.dn__meta.is-bad {
  color: #ff9a86;
}

.dn__pre {
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

.dn__empty {
  flex: 1;
  padding: 20px;
  font-size: 11.5px;
  color: #7e7889;
  text-align: center;
  background: #100e15;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 7px;
}

.dn__err {
  flex: none;
  padding: 8px 9px;
  font-size: 11.5px;
  color: #ffb4a2;
  background: rgba(255, 86, 48, 0.12);
  border-radius: 7px;
}
</style>

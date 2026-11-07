<!--
  /**
   * 虚拟桌面 · 进程窗口
   *
   * <p>一次命令拿回进程快照（Windows 走 {@code tasklist}，Linux 走 {@code ps}），
   * 在浏览器侧排序、过滤，再按需结束进程。结束进程是要写远端状态的动作，
   * 所以必须先确认，并且只允许传数字 PID——不给任何拼接命令的机会。</p>
   *
   * <p>命令与「命令」窗口一样走批量执行接口，会落执行日志，审计口径一致。</p>
   */
  -->
<template>
  <div class="dp">
    <div class="dp__bar">
      <span class="dp__host">{{ hostName || `主机 #${hostId}` }}</span>
      <span class="dp__os">{{ osType || "未知系统" }}</span>
      <span class="dp__spacer" />
      <input v-model="keyword" class="dp__search" type="text" spellcheck="false" placeholder="过滤进程名 / PID" />
      <button type="button" class="dp__btn" :disabled="loading" @click="load">
        <ReIcon name="RefreshRight" :size="12" />
      </button>
    </div>

    <div class="dp__tools">
      <span class="dp__sort-label">排序</span>
      <button
        v-for="s in sorts"
        :key="s.key"
        type="button"
        class="dp__chip"
        :class="{ 'is-on': sortBy === s.key }"
        @click="sortBy = s.key"
      >
        {{ s.label }}
      </button>
      <span class="dp__spacer" />
      <span class="dp__count">{{ visible.length }} / {{ rows.length }} 个进程</span>
    </div>

    <div class="dp__table">
      <div class="dp__thead">
        <span class="dp__c-pid">PID</span>
        <span class="dp__c-name">名称</span>
        <span class="dp__c-user">用户</span>
        <span class="dp__c-cpu">CPU</span>
        <span class="dp__c-mem">内存</span>
        <span class="dp__c-act" />
      </div>
      <div v-if="loading && !rows.length" class="dp__empty">正在读取进程列表…</div>
      <div v-else-if="error" class="dp__err">{{ error }}</div>
      <div v-else-if="!visible.length" class="dp__empty">没有匹配的进程</div>
      <div v-else class="dp__tbody">
        <div v-for="p in visible" :key="`${p.pid}-${p.name}`" class="dp__tr" :class="{ 'is-busy': busyPid === p.pid }">
          <span class="dp__c-pid mono">{{ p.pid }}</span>
          <span class="dp__c-name" :title="p.name">{{ p.name }}</span>
          <span class="dp__c-user" :title="p.user">{{ p.user || "—" }}</span>
          <span class="dp__c-cpu mono">{{ p.cpu == null ? "—" : `${p.cpu.toFixed(1)}%` }}</span>
          <span class="dp__c-mem mono">{{ p.mem == null ? "—" : `${p.mem.toFixed(1)} MB` }}</span>
          <span class="dp__c-act">
            <button
              type="button"
              class="dp__kill"
              :disabled="busyPid === p.pid || p.pid <= 0"
              title="结束这个进程"
              @click="kill(p)"
            >
              结束
            </button>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { runCommand } from "../../../api";

const props = defineProps<{
  /** 主机标识 */
  hostId: number;
  /** 主机名（父级透传） */
  hostName?: string;
  /** 操作系统类型，用于切换命令方言 */
  osType?: string | null;
  /** 窗口是否激活（父级透传） */
  active?: boolean;
}>();

/** 一个进程快照 */
interface ProcessRow {
  /** 进程号 */
  pid: number;
  /** 进程名 */
  name: string;
  /** 运行用户 / 会话 */
  user: string;
  /** CPU 占比（Windows 的 tasklist 不提供，为 null） */
  cpu: number | null;
  /** 常驻内存，单位 MB */
  mem: number | null;
}

/** 单行输出上限：进程表最多就是几千行，超出直接截断 */
const MAX_ROWS = 400;

const rows = ref<ProcessRow[]>([]);
const loading = ref(false);
const error = ref("");
const keyword = ref("");
const busyPid = ref(0);

const isWin = computed(() => /win/i.test(props.osType ?? ""));

/** 排序字段：Windows 的 tasklist 不给 CPU，默认按内存排才有意义 */
const sortBy = ref<"cpu" | "mem" | "pid">(isWin.value ? "mem" : "cpu");

const sorts = [
  { key: "cpu", label: "CPU" },
  { key: "mem", label: "内存" },
  { key: "pid", label: "PID" },
] as const;

/** 过滤 + 排序后的行 */
const visible = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  const list = kw ? rows.value.filter((p) => p.name.toLowerCase().includes(kw) || String(p.pid).includes(kw)) : rows.value;
  const by = sortBy.value;
  const sorted = [...list].sort((a, b) => {
    if (by === "pid") return a.pid - b.pid;
    if (by === "mem") return (b.mem ?? -1) - (a.mem ?? -1);
    return (b.cpu ?? -1) - (a.cpu ?? -1);
  });
  return sorted.slice(0, MAX_ROWS);
});

/**
 * 解析 Windows {@code tasklist /fo csv /nh} 的输出。
 *
 * <p>字段是引号包起来的 CSV，内存列形如 {@code "8,432 K"}，所以不能按逗号硬切。</p>
 *
 * @param out 命令输出
 */
function parseWindows(out: string): ProcessRow[] {
  const list: ProcessRow[] = [];
  for (const line of out.split(/\r?\n/)) {
    const text = line.trim();
    if (!text.startsWith('"')) continue;
    const parts = text.replace(/^"|"$/g, "").split('","');
    if (parts.length < 5) continue;
    const pid = Number(parts[1]);
    if (!Number.isFinite(pid)) continue;
    const kb = Number(String(parts[4]).replace(/[^\d]/g, ""));
    list.push({
      pid,
      name: parts[0],
      user: parts[2] ?? "",
      cpu: null,
      mem: Number.isFinite(kb) ? kb / 1024 : null,
    });
  }
  return list;
}

/**
 * 解析 Linux {@code ps -eo pid,user,pcpu,pmem,rss,comm} 的输出。
 *
 * <p>只取前五列，剩下的全部算进程名——进程名里允许出现空格；
 * 内存用 RSS（KB）换成 MB，和 Windows 的 tasklist 口径一致。</p>
 *
 * @param out 命令输出
 */
function parseLinux(out: string): ProcessRow[] {
  const list: ProcessRow[] = [];
  for (const line of out.split(/\r?\n/)) {
    const text = line.trim();
    if (!text) continue;
    const m = text.match(/^(\d+)\s+(\S+)\s+([\d.]+)\s+[\d.]+\s+(\d+)\s+(.+)$/);
    if (!m) continue;
    list.push({
      pid: Number(m[1]),
      user: m[2],
      cpu: Number(m[3]),
      mem: Number(m[4]) / 1024,
      name: m[5],
    });
  }
  return list;
}

/**
 * 读取进程快照。
 */
async function load(): Promise<void> {
  if (loading.value) return;
  loading.value = true;
  error.value = "";
  try {
    const cmd = isWin.value
      ? "tasklist /fo csv /nh"
      : "ps -eo pid,user,pcpu,pmem,rss,comm --sort=-pcpu --no-headers | head -n 400";
    const logs = (await runCommand([props.hostId], cmd, 40)) ?? [];
    const log = logs[0] ?? {};
    const out = String(log.msExecLogOutput ?? "");
    if (!out.trim()) {
      rows.value = [];
      error.value = String(log.msExecLogError ?? "") || "命令没有返回内容";
      return;
    }
    rows.value = (isWin.value ? parseWindows(out) : parseLinux(out)).slice(0, MAX_ROWS);
  } catch (e) {
    error.value = `读取失败：${String((e as Error)?.message ?? e)}`;
  } finally {
    loading.value = false;
  }
}

/**
 * 结束进程。
 *
 * <p>PID 只做数字校验后再拼命令：这个窗口没有自由输入，不能成为命令注入的入口。</p>
 *
 * @param row 进程行
 */
async function kill(row: ProcessRow): Promise<void> {
  if (row.pid <= 0 || busyPid.value) return;
  const ok = await ElMessageBox.confirm(
    `结束进程「${row.name}」（PID ${row.pid}）？未保存的数据会直接丢失。`,
    "结束进程",
    { type: "warning", confirmButtonText: "结束进程", cancelButtonText: "取消" },
  ).catch(() => false);
  if (!ok) return;
  busyPid.value = row.pid;
  try {
    const cmd = isWin.value ? `taskkill /PID ${row.pid} /F` : `kill -9 ${row.pid}`;
    const logs = (await runCommand([props.hostId], cmd, 30)) ?? [];
    const log = logs[0] ?? {};
    const code = log.msExecLogExitCode ?? null;
    if (code === 0) {
      ElMessage.success(`已结束 ${row.name}`);
      await load();
    } else {
      ElMessage.error(String(log.msExecLogError ?? log.msExecLogOutput ?? "结束失败"));
    }
  } catch (e) {
    ElMessage.error(`结束失败：${String((e as Error)?.message ?? e)}`);
  } finally {
    busyPid.value = 0;
  }
}

onMounted(load);
</script>

<style scoped>
.dp {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  font-size: 12px;
  color: #d8d3e0;
  background: #16141c;
}

.dp__bar {
  display: flex;
  flex: none;
  gap: 8px;
  align-items: center;
  height: 30px;
  padding: 0 10px;
  background: #1b1922;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.dp__host {
  overflow: hidden;
  font-weight: 600;
  color: #efeaf7;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dp__os {
  flex: none;
  font-size: 10.5px;
  color: #8f8a9b;
}

.dp__spacer {
  flex: 1;
}

.dp__search {
  flex: none;
  width: 190px;
  height: 21px;
  padding: 0 8px;
  font-size: 11px;
  color: #e6e1ef;
  background: #100e15;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  outline: none;
}

.dp__btn {
  display: inline-flex;
  flex: none;
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

.dp__btn:not(:disabled):hover {
  color: #fff;
  background: rgba(233, 84, 32, 0.3);
}

.dp__tools {
  display: flex;
  flex: none;
  gap: 6px;
  align-items: center;
  padding: 7px 10px 6px;
}

.dp__sort-label,
.dp__count {
  font-size: 10.5px;
  color: #8f8a9b;
}

.dp__chip {
  height: 21px;
  padding: 0 9px;
  font-size: 11px;
  color: #cfc9da;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
}

.dp__chip.is-on {
  color: #fff;
  background: rgba(233, 84, 32, 0.72);
  border-color: transparent;
}

.dp__table {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  margin: 0 10px 10px;
  overflow: hidden;
  background: #100e15;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 7px;
}

.dp__thead,
.dp__tr {
  display: grid;
  grid-template-columns: 62px minmax(120px, 1.4fr) minmax(80px, 1fr) 62px 78px 58px;
  gap: 6px;
  align-items: center;
  padding: 0 9px;
}

.dp__thead {
  flex: none;
  height: 26px;
  font-size: 10px;
  color: #8f8a9b;
  background: rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.dp__tbody {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.dp__tr {
  height: 26px;
  font-size: 11px;
  color: #cfc9da;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.dp__tr:hover {
  background: rgba(255, 255, 255, 0.04);
}

.dp__tr.is-busy {
  opacity: 0.55;
}

.dp__c-pid,
.dp__c-cpu,
.dp__c-mem {
  text-align: right;
}

.mono {
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 10.5px;
}

.dp__c-name,
.dp__c-user {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dp__c-act {
  display: flex;
  justify-content: flex-end;
}

.dp__kill {
  height: 18px;
  padding: 0 7px;
  font-size: 10px;
  color: #ffb4a2;
  cursor: pointer;
  background: rgba(255, 86, 48, 0.14);
  border: 1px solid rgba(255, 86, 48, 0.35);
  border-radius: 4px;
  opacity: 0;
}

.dp__tr:hover .dp__kill {
  opacity: 1;
}

.dp__kill:not(:disabled):hover {
  color: #fff;
  background: rgba(255, 86, 48, 0.5);
}

.dp__kill:disabled {
  cursor: not-allowed;
  opacity: 0.3;
}

.dp__empty {
  flex: 1;
  padding: 26px;
  font-size: 11.5px;
  color: #7e7889;
  text-align: center;
}

.dp__err {
  flex: none;
  padding: 10px;
  font-size: 11.5px;
  color: #ffb4a2;
  background: rgba(255, 86, 48, 0.12);
}
</style>

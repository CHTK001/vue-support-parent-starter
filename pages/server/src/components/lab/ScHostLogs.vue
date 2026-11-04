<script setup lang="ts">
/**
 * 目标主机日志 —— 系统日志 / 登录日志。
 *
 * <p>这两个页签回答的是「<b>这台服务器自己</b>记了什么」，不是平台软件的操作日志：
 * 平台软件的日志在 {@code @pages/system} 的 SysLogManage / UserLogManage 里，
 * 与主机台账无关。这里全部通过主机命令通道
 * （{@code POST /ms/server/exec/command}）在目标机上执行只读命令：</p>
 *
 * <ul>
 *   <li>Linux 系统日志：{@code journalctl}，失败时退回 /var/log/{syslog,messages,system.log}、dmesg</li>
 *   <li>Linux 登录日志：/var/log/auth.log（Debian）/var/log/secure（RHEL），
 *       再按关键字从 journal 筛认证记录，最后用 last 兜底</li>
 *   <li>Windows：{@code wevtutil qe System|Security}（事件查看器同源通道）</li>
 * </ul>
 *
 * <p>页面只读：不写文件、不改服务、不结束进程。删除 / 清空日志这类动作用户自己上远控做。</p>
 *
 * @author CH
 * @since 4.0.0.45
 */
import { computed, onMounted, ref, watch } from "vue";
import ReIcon from "@repo/ui/re-icon";
import { runCommand } from "../../api";

type LogKind = "sys" | "login";

const props = withDefaults(
  defineProps<{
    /** 目标主机 id（命令下发的对象） */
    hostId: number;
    /** 目标主机名（页头展示） */
    hostName?: string;
    /** 主机平台标识（LINUX / WINDOWS） */
    platform?: string;
    /** 日志类型：系统日志 / 登录日志 */
    kind?: LogKind;
  }>(),
  {
    hostName: "",
    platform: "LINUX",
    kind: "sys",
  },
);

/** 是否 Windows：决定命令与是否提示管理员权限 */
const isWindows = computed(() => String(props.platform || "").toUpperCase().includes("WIN"));
/** 是否登录日志 */
const isLogin = computed(() => props.kind === "login");
/** 页签标题 */
const title = computed(() => (isLogin.value ? "登录日志" : "系统日志"));
/** 平台展示名 */
const osLabel = computed(() => {
  const p = String(props.platform || "").toUpperCase();
  if (p.includes("WIN")) return "Windows";
  if (p.includes("MAC") || p.includes("DARWIN")) return "macOS";
  return "Linux";
});
/** Windows 事件通道名 */
const channel = computed(() => (isLogin.value ? "Security" : "System"));

/** 本次读取的行数 */
const count = ref(300);
/** 客户端过滤关键字（不重新下发命令） */
const keyword = ref("");
/** 原始输出 */
const output = ref("");
/** 正在读取 */
const loading = ref(false);
/** 失败原因（成功时为空） */
const error = ref("");
/** 本次实际执行的命令（页脚展示，便于排查） */
const command = ref("");
/** 目标机执行耗时 */
const costMs = ref<number | null>(null);
/** 复制按钮的短暂反馈 */
const copied = ref(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;
/** 请求代次：切主机 / 连点刷新时只认最后一次 */
let seq = 0;

/**
 * 按平台 + 日志类型拼只读命令。
 *
 * <p>Linux 用 {@code ||} 串后备路径：journalctl 没权限 / 没有 systemd 时退出码非 0，
 * 自动落到 /var/log 下的发行版路径，最后用 dmesg 兜底。登录日志再加 last，
 * 容器 / 精简系统没有 auth.log 时仍能看到会话记录。</p>
 *
 * @returns 可在目标机 shell 中直接执行的命令
 */
function buildCommand(): string {
  const n = Math.max(50, Number(count.value) || 300);
  if (isWindows.value) {
    return `wevtutil qe ${channel.value} /c:${n} /rd:true /f:text`;
  }
  if (isLogin.value) {
    return [
      `tail -n ${n} /var/log/auth.log 2>/dev/null`,
      `tail -n ${n} /var/log/secure 2>/dev/null`,
      // sshd 在不同发行版下的进程名不同（sshd / sshd-session），
      // 按关键字从 journal 里筛认证记录，比只认 _COMM=sshd 更可靠
      `journalctl -n 2000 --no-pager -o short-iso 2>/dev/null | grep -Ei 'sshd|pam_|login|session (opened|closed)|failed password|accepted password|sudo' | tail -n ${n}`,
      `last -n ${n} 2>/dev/null`,
    ].join(" || ");
  }
  return [
    `journalctl -n ${n} --no-pager -o short-iso 2>/dev/null`,
    `tail -n ${n} /var/log/syslog 2>/dev/null`,
    `tail -n ${n} /var/log/messages 2>/dev/null`,
    `tail -n ${n} /var/log/system.log 2>/dev/null`,
    `dmesg 2>/dev/null | tail -n ${n}`,
  ].join(" || ");
}

/**
 * 把后端 / 命令通道的错误翻成可执行的下一步。
 *
 * <p>只回一行 {@code Access is denied.} 时，用户第一反应是「主机坏了」，
 * 实际多半是读取安全日志需要管理员身份；这里直接点明要绑什么身份。</p>
 *
 * @param reason 原始错误
 */
function explain(reason: string): string {
  const r = (reason || "读取日志失败").trim();
  const low = r.toLowerCase();
  const denied =
    low.includes("access is denied") ||
    low.includes("permission denied") ||
    low.includes("0x5") ||
    r.includes("拒绝访问") ||
    r.includes("权限不足");
  if (isWindows.value && isLogin.value && denied) {
    return `${r}｜Windows 安全日志默认仅管理员可读：请为该主机绑定管理员身份的登录凭据，或先看「系统日志」确认通道可用。`;
  }
  if (!isWindows.value && denied) {
    return `${r}｜当前身份无权读取系统日志：请绑定 root / 可 sudo 的身份（journalctl 一般还要求加入 systemd-journal 组）。`;
  }
  if (r.includes("未绑定登录身份")) {
    return `${r}。请先在主机详情中绑定 SSH 登录身份后重试。`;
  }
  return r;
}

/** 原始输出按行拆开（去掉空行、行尾空白，以及 journalctl 的空结果提示） */
const rows = computed(() =>
  output.value
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+$/, ""))
    .filter((line) => line.length > 0 && line !== "-- No entries --"),
);

/** 关键字过滤后的行（纯前端过滤，不重复打目标机） */
const shownRows = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  if (!q) return rows.value;
  return rows.value.filter((line) => line.toLowerCase().includes(q));
});

/** 一条结构化登录记录：回答「谁、从哪个 IP、成没成」 */
interface LoginRow {
  /** 登录用户名 */
  user: string;
  /** 来源 IP（本机会话为 "-"） */
  ip: string;
  /** 认证方式 / 会话类型 */
  method: string;
  /** 结果：成功 / 失败 / 在线 / 已退出 */
  result: string;
  /** 原始行，便于核对 */
  raw: string;
}

/** IPv4 / IPv6 粗判：last 输出的第三列不一定是地址 */
const IP_SHAPE = /^(\d{1,3}(?:\.\d{1,3}){3}|[0-9a-f]{0,4}(?::[0-9a-f]{0,4}){2,})$/i;

/**
 * 解析 Linux 的登录 / 认证记录。
 *
 * <p>auth.log、secure、journalctl 里最关键的是 OpenSSH 的两类行：</p>
 * <ul>
 *   <li>{@code Accepted password for root from 10.1.2.3 port 51234 ssh2}</li>
 *   <li>{@code Failed password for invalid user admin from 5.6.7.8 port 40000 ssh2}</li>
 * </ul>
 * <p>{@code session opened for user ...} 这类行没有来源地址，单列会与 Accepted 重复，
 * 因此不单独成行；没有 sshd 记录的容器 / 精简系统由 {@code last} 兜底。</p>
 *
 * @param lines 原始日志行
 * @returns 结构化登录记录（解析不出时为空，模板回落原始行）
 */
function parseLinuxLogin(lines: string[]): LoginRow[] {
  const out: LoginRow[] = [];
  for (const line of lines) {
    const sshd = line.match(/\b(Accepted|Failed)\s+(\S+)\s+for\s+(?:invalid user\s+)?(\S+?)\s+from\s+(\S+)\s+port\s+\d+/i);
    if (sshd) {
      out.push({
        user: sshd[3],
        ip: sshd[4],
        method: sshd[2],
        result: /^accepted$/i.test(sshd[1]) ? "成功" : "失败",
        raw: line,
      });
      continue;
    }
    // last：root  pts/0  10.1.2.3  Mon Nov  3 09:12  still logged in
    const last = line.match(/^(\S+)\s+(\S+)\s+(\S+)\s+(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+\w{3}\s+\d{1,2}\s+\d{2}:\d{2}/);
    if (last && IP_SHAPE.test(last[3])) {
      const u = last[1];
      if (u === "reboot" || u === "wtmp" || u === "shutdown") continue;
      out.push({
        user: u,
        ip: last[3],
        method: last[2],
        result: /still logged in|still running/i.test(line) ? "在线" : "已退出",
        raw: line,
      });
    }
  }
  return out;
}

/**
 * 解析 Windows 安全日志（{@code wevtutil qe Security /f:text}）。
 *
 * <p>一个事件里往往有两组 Account Name（Subject 与 New Logon），前者通常是
 * SYSTEM / 机器账户；取最后一个非系统账户才是真正登录的人。来源地址同理，
 * 取最后一个非 "-" 的值。</p>
 *
 * @param text 原始输出（保留空行，按 Event[n] 分段）
 * @returns 结构化登录记录
 */
function parseWindowsLogin(text: string): LoginRow[] {
  const out: LoginRow[] = [];
  const events = text.replace(/\r\n?/g, "\n").split(/(?=Event\[\d+\]:)/);
  for (const block of events) {
    const users = [...block.matchAll(/Account Name:\s*(.+)/gi)]
      .map((m) => m[1].trim())
      .filter((u) => u && u !== "-" && !/^(SYSTEM|LOCAL SERVICE|NETWORK SERVICE|ANONYMOUS LOGON)$/i.test(u) && !u.endsWith("$"));
    const user = users[users.length - 1] || "";
    if (!user) continue;
    const ips = [...block.matchAll(/Source Network Address:\s*(.+)/gi)]
      .map((m) => m[1].trim())
      .filter((v) => v && v !== "-");
    const ip = ips[ips.length - 1] || "-";
    const id = block.match(/Event ID:\s*(\d+)/i)?.[1] || "";
    const failed = id === "4625" || /Audit Failure|审核失败|登录失败/i.test(block);
    const method =
      id === "4624" ? "交互登录" : id === "4625" ? "密码错误" : id === "4634" ? "注销" : `事件 ${id || "?"}`;
    out.push({ user, ip, method, result: failed ? "失败" : "成功", raw: block.trim() });
  }
  return out;
}

/** 结构化登录记录（仅登录日志解析；解析不出时模板回落原始行） */
const loginRows = computed<LoginRow[]>(() => {
  if (!isLogin.value) return [];
  return isWindows.value ? parseWindowsLogin(output.value) : parseLinuxLogin(rows.value);
});

/** 结构化登录记录的关键字过滤（与原始日志共用同一个输入框） */
const shownLoginRows = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  if (!q) return loginRows.value;
  return loginRows.value.filter((r) =>
    [r.user, r.ip, r.method, r.result].some((v) => String(v).toLowerCase().includes(q)),
  );
});

/**
 * 结果标签配色：失败红、成功/在线绿、已退出保持中性灰。
 *
 * @param result 结构化结果文本
 * @returns 标签的 tone 类名
 */
function resultTone(result: string): string {
  if (result === "失败") return "is-bad";
  if (result === "成功" || result === "在线") return "is-ok";
  return "";
}

/** 页脚统计文案：登录日志按「次登录」计，其余按行计 */
const statText = computed(() => {
  const filtered = keyword.value.trim();
  if (isLogin.value && loginRows.value.length) {
    return `${loginRows.value.length} 次登录${filtered ? ` · 匹配 ${shownLoginRows.value.length}` : ""}`;
  }
  return `${rows.value.length} 行${filtered ? ` · 匹配 ${shownRows.value.length}` : ""}`;
});

/**
 * 行着色：错误 / 告警 / 成功三类一眼可辨。
 *
 * <p>日志是纯文本，没有结构化 level，只能按常见关键字判；
 * 判错只是颜色不准，不影响内容与排序，所以宁可粗一点。</p>
 *
 * @param line 日志原文
 */
function lineTone(line: string): string {
  if (/\b(error|failed|failure|fatal|panic|denied|refused|critical|crit)\b/i.test(line)) return "is-bad";
  if (/\b(warn|warning|notice)\b/i.test(line)) return "is-warn";
  if (/\b(accepted|success|successful)\b/i.test(line)) return "is-ok";
  return "";
}

/** 从目标机读取日志 */
async function load(): Promise<void> {
  if (!props.hostId) {
    output.value = "";
    command.value = "";
    error.value = "未选择主机，无法读取日志。";
    return;
  }
  const mine = ++seq;
  loading.value = true;
  error.value = "";
  copied.value = false;
  command.value = buildCommand();
  try {
    const list = await runCommand([props.hostId], command.value, 30);
    if (mine !== seq) return;
    const row = Array.isArray(list) && list.length ? list[0] : null;
    const text = String(row?.msExecLogOutput ?? "").trim();
    const cost = Number(row?.msExecLogCostMs ?? 0);
    costMs.value = Number.isFinite(cost) && cost > 0 ? Math.round(cost) : null;
    if (!row) {
      output.value = "";
      error.value = "本次执行没有返回结果：请确认主机在线，且已绑定可用的登录身份。";
      return;
    }
    const status = String(row.msExecLogStatus ?? "").toUpperCase();
    if (status !== "SUCCESS") {
      output.value = text;
      error.value = explain(String(row.msExecLogError ?? "").trim() || "读取日志失败");
      return;
    }
    if (!text) {
      output.value = "";
      error.value = isWindows.value
        ? `Windows 的 ${channel.value} 事件通道没有读到内容（通道为空或当前身份无权限）。`
        : "目标机没有可读的日志：已尝试 journalctl 与 /var/log 下的常见路径。";
      return;
    }
    output.value = text;
  } catch (e: any) {
    if (mine !== seq) return;
    output.value = "";
    error.value = explain(String(e?.message ?? e ?? "读取日志失败"));
  } finally {
    if (mine === seq) loading.value = false;
  }
}

/** 复制当前原始输出 */
async function copyAll(): Promise<void> {
  if (!output.value) return;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(output.value);
    } else {
      const ta = document.createElement("textarea");
      ta.value = output.value;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    copied.value = true;
    if (copyTimer) clearTimeout(copyTimer);
    copyTimer = setTimeout(() => (copied.value = false), 1500);
  } catch {
    copied.value = false;
  }
}

onMounted(load);
watch(() => [props.hostId, props.kind, props.platform], () => void load());
</script>

<template>
  <div class="lg">
    <!-- 页头：明确「这是哪台机器的日志」，避免与平台软件日志混淆 -->
    <div class="lb-head lg-head">
      <span class="lb-title">{{ title }}</span>
      <span class="lb-pill lb-pill--plain lg-host">{{ hostName || "未命名主机" }}</span>
      <span class="lb-pill" :class="isWindows ? 'lb-info' : 'lb-ok'">{{ osLabel }}</span>
      <span class="lb-spacer" />
      <span class="lb-dim lg-note">只读 · 读取这台服务器自身的日志，不是平台软件日志</span>
    </div>

    <section class="lb-pane lg-pane">
      <div class="lb-pane__head">
        <ReIcon :name="isLogin ? 'Unlock' : 'Tickets'" :size="12" />
        <span>{{ isLogin ? "认证 / 登录记录" : "系统运行日志" }}</span>
        <span class="lb-spacer" />
        <label class="lg-field">
          <ReIcon name="Search" :size="12" />
          <input
            v-model="keyword"
            class="lg-input"
            type="search"
            :placeholder="isLogin ? '过滤用户 / IP / 结果' : '过滤关键字'"
          />
        </label>
        <select v-model.number="count" class="lg-select" title="读取行数" @change="load">
          <option :value="200">200 行</option>
          <option :value="300">300 行</option>
          <option :value="500">500 行</option>
          <option :value="1000">1000 行</option>
        </select>
        <button type="button" class="lb-btn" :disabled="loading" title="重新从目标机读取" @click="load">
          <ReIcon name="RefreshRight" :size="12" :class="{ 'lg-spin': loading }" />
          <span>{{ loading ? "读取中" : "刷新" }}</span>
        </button>
        <button type="button" class="lb-btn" :disabled="!output" title="复制原始输出" @click="copyAll">
          <ReIcon name="CopyDocument" :size="12" />
          <span>{{ copied ? "已复制" : "复制" }}</span>
        </button>
      </div>

      <div class="lg-body">
        <div v-if="error" class="lg-alert">
          <ReIcon name="WarningFilled" :size="13" />
          <span>{{ error }}</span>
        </div>

        <div v-if="loading && !rows.length" class="lg-state">
          正在从 {{ hostName || "目标主机" }} 读取{{ title }}…
        </div>
        <div v-else-if="!rows.length && !error" class="lg-state">
          {{
            isLogin
              ? "没有读到登录 / 认证记录（已尝试 auth.log、secure、journal 与 last）"
              : "没有读到日志行"
          }}
        </div>

        <!-- 登录日志主表：只回答「谁、从哪个 IP、成没成」，时间不占列 -->
        <template v-if="isLogin && loginRows.length">
          <table class="lg-table">
            <thead>
              <tr>
                <th class="lg-col-user">用户</th>
                <th class="lg-col-ip">来源 IP</th>
                <th class="lg-col-method">方式</th>
                <th class="lg-col-result">结果</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, i) in shownLoginRows" :key="i" :title="r.raw">
                <td class="lg-col-user"><span class="lg-user">{{ r.user }}</span></td>
                <td class="lg-col-ip"><code class="lg-ip">{{ r.ip }}</code></td>
                <td class="lg-col-method">{{ r.method }}</td>
                <td class="lg-col-result">
                  <span class="lg-tag" :class="resultTone(r.result)">{{ r.result }}</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="!shownLoginRows.length" class="lg-state">
            没有匹配「{{ keyword }}」的登录记录
          </div>
          <!-- 原始行留档：sudo / CRON 等非登录记录不强行入表，需要时展开核对 -->
          <details class="lg-raw">
            <summary>原始日志（{{ rows.length }} 行）</summary>
            <ol class="lg-lines">
              <li v-for="(line, i) in shownRows" :key="i" class="lg-line" :class="lineTone(line)">
                <span class="lg-no">{{ i + 1 }}</span>
                <span class="lg-text">{{ line }}</span>
              </li>
            </ol>
          </details>
        </template>

        <template v-else>
          <ol v-if="rows.length" class="lg-lines">
            <li v-for="(line, i) in shownRows" :key="i" class="lg-line" :class="lineTone(line)">
              <span class="lg-no">{{ i + 1 }}</span>
              <span class="lg-text">{{ line }}</span>
            </li>
          </ol>
          <div v-if="rows.length && !shownRows.length" class="lg-state">
            没有匹配「{{ keyword }}」的日志行
          </div>
        </template>
      </div>
    </section>

    <!-- 页脚：命令与统计。命令直接摆出来，用户能判断读的是不是自己要的那份日志 -->
    <div class="lg-foot">
      <span class="lb-dim lg-stat">命令</span>
      <code class="lg-cmd" :title="command">{{ command || "—" }}</code>
      <span class="lb-dim lg-stat">{{ statText }}</span>
      <span v-if="costMs" class="lb-dim lg-stat">{{ costMs }} ms</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "./_lab-kit.scss";

.lg {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: 8px;
  padding: 12px 14px;
  box-sizing: border-box;
}
.lg-head {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.lg-note {
  font-size: 11px;
}
.lg-pane {
  flex: 1;
  min-height: 0;
}
.lg-field {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 7px;
  height: 24px;
  color: var(--el-text-color-placeholder, #a8abb2);
  background: var(--el-fill-color-light, #f5f7fa);
  border: 1px solid var(--el-border-color-extra-light, #eef0f6);
  border-radius: 6px;
}
.lg-input {
  width: 150px;
  min-width: 0;
  padding: 0;
  font: inherit;
  font-size: 11.5px;
  color: var(--el-text-color-regular, #4a5162);
  background: transparent;
  border: none;
  outline: none;
}
.lg-input::-webkit-search-cancel-button {
  cursor: pointer;
}
.lg-select {
  height: 24px;
  padding: 0 4px;
  font: inherit;
  font-size: 11.5px;
  color: var(--el-text-color-regular, #4a5162);
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-light, #e3e6ef);
  border-radius: 6px;
  cursor: pointer;
}
.lg-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  /* 日志阅读用暗底：与工作台里其他终端面板一致，长时间看不刺眼 */
  background: #111111;
  overflow-anchor: none;
}
.lg-alert {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 8px;
  padding: 7px 9px;
  font-size: 11.5px;
  line-height: 1.6;
  color: #ffb4ae;
  background: rgba(229, 83, 75, 0.12);
  border: 1px solid rgba(229, 83, 75, 0.32);
  border-radius: 7px;
}
.lg-state {
  padding: 18px 12px;
  font-size: 12px;
  color: #8a919e;
  text-align: center;
}

/* ==================== 结构化登录表（登录日志专用） ==================== */
/* 表头吸顶：行数多时滚动仍知道每列是什么 */
.lg-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11.5px;
}
.lg-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 7px 12px;
  font-size: 10.5px;
  font-weight: 600;
  text-align: left;
  color: #8a919e;
  white-space: nowrap;
  background: #181818;
  border-bottom: 1px solid #2a2a2a;
}
.lg-table td {
  padding: 5px 12px;
  color: #c9ced8;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.lg-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.045);
}
.lg-col-user {
  width: 24%;
}
.lg-col-ip {
  width: 30%;
}
.lg-col-method {
  width: 26%;
}
.lg-col-result {
  width: 120px;
}
.lg-user {
  font-weight: 600;
  color: #e6e9ef;
}
.lg-ip {
  font-family: var(--el-font-family-mono, ui-monospace, "SF Mono", Consolas, monospace);
  color: #9fd0ff;
}
/* 结果标签：失败红、在线/成功绿、已退出中性灰 */
.lg-tag {
  display: inline-block;
  min-width: 38px;
  padding: 0 7px;
  font-size: 10.5px;
  line-height: 18px;
  text-align: center;
  color: #b9bec8;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 9px;
}
.lg-tag.is-bad {
  color: #ff8b84;
  background: rgba(229, 83, 75, 0.16);
}
.lg-tag.is-ok {
  color: #7fd58f;
  background: rgba(63, 178, 106, 0.16);
}
/* 原始日志留档：默认折叠，展开后自身滚动，避免把主表顶出视口 */
.lg-raw {
  border-top: 1px solid #262626;
}
.lg-raw > summary {
  padding: 7px 12px;
  font-size: 11px;
  color: #8a919e;
  cursor: pointer;
  user-select: none;
}
.lg-raw > summary:hover {
  color: #c9ced8;
  background: rgba(255, 255, 255, 0.04);
}
.lg-raw .lg-lines {
  max-height: 260px;
  overflow: auto;
}
.lg-lines {
  margin: 0;
  padding: 6px 0 10px;
  list-style: none;
}
.lg-line {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr);
  gap: 10px;
  padding: 0 12px 0 6px;
  font-family: var(--el-font-family-mono, ui-monospace, "SF Mono", Consolas, monospace);
  font-size: 11.5px;
  line-height: 1.62;
}
.lg-line:hover {
  background: rgba(255, 255, 255, 0.045);
}
.lg-no {
  font-variant-numeric: tabular-nums;
  text-align: right;
  color: #555c68;
  user-select: none;
}
.lg-text {
  min-width: 0;
  color: #c9ced8;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.lg-line.is-bad .lg-text {
  color: #ff8b84;
}
.lg-line.is-warn .lg-text {
  color: #f0c674;
}
.lg-line.is-ok .lg-text {
  color: #7fd58f;
}
.lg-foot {
  display: flex;
  flex: none;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 10.5px;
}
.lg-stat {
  flex: none;
  white-space: nowrap;
}
.lg-cmd {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--el-font-family-mono, ui-monospace, Consolas, monospace);
  font-size: 10.5px;
  color: var(--el-text-color-secondary, #5c6270);
}
.lg-spin {
  animation: lg-spin 0.9s linear infinite;
}
@keyframes lg-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

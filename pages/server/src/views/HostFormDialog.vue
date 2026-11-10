<script setup lang="ts">
/**
 * 主机新增/编辑弹窗（独立子组件）
 * 从 AssetsView 拆出：弹窗打开/渲染只在自身组件内进行，不再触发 AssetsView 巨型组件全量 diff
 * @author CH
 * @since 4.0.0
 */
import { message } from "@repo/core";
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";

import { http, unwrapResult } from "@repo/utils";
import { ReFormItem } from "@repo/ui/re-kit";
import { getHost, listBoundIdentities, bindIdentity, saveHost, testPrometheusHost, fetchLocalAddress, getIdentities } from "../api";
import { osIconSvg } from "../utils/osIcon";
/** 主机表单结构（与 AssetsView.Host 保持一致——避免跨 .vue 文件的类型导入解析问题） */
// eslint-disable-next-line no-unused-vars -- 保留 import 便于日后与 AssetsView.Host 统一
import type { Host as HostRow } from "./AssetsView.vue";
type Host = HostRow;
interface LegacyHostForm {
  id?: number;
  serverHostName?: string;
  serverHostAddress?: string;
  serverHostPort?: number;
  serverHostOsType?: string;
  serverHostSshEnabled?: number;
  serverHostCollectMode?: string;
  serverHostAgentPort?: number;
  serverHostCollectEnabled?: number;
  serverHostCollectInterval?: number;
  serverHostOnlineEnabled?: number;
  serverHostOnlineInterval?: number;
  /** 延迟检测开关（1 启用） */
  serverHostDelayEnabled?: number;
  /** 延迟检测间隔（秒） */
  serverHostDelayInterval?: number;
  /** 最近一次测得延迟 ms（-1 不可达） */
  serverHostDelayMs?: number | null;
  serverHostLastDelayTime?: string | null;
  serverHostAgentEnabled?: number;
  /** Agent 是否已安装（1 已装） */
  serverHostAgentInstalled?: number | null;
  /** Agent 版本号 */
  serverHostAgentVersion?: string | null;
  serverHostRemoteEnabled?: number;
  msServerGroupId?: number | null;
  serverHostTags?: string | null;
  serverHostDescription?: string | null;
  serverHostCode?: string | null;
  serverHostAccount?: string | null;
  serverHostPassword?: string | null;
  serverHostPrivateKey?: string | null;
  /** 远控协议（空表示按平台推断） */
  serverHostRemoteProtocol?: string | null;
  /** 远控端口（空表示按协议默认） */
  serverHostRemotePort?: number | null;
  /** 远控通道：GUACD 中转 / DIRECT 直连 / NONE 无需通道 */
  serverHostRemoteMode?: string | null;
  /** VNC 口令（落库 AES 加密，详情接口回显明文） */
  serverHostVncPassword?: string | null;
  serverHostLastCollectTime?: string | null;
  serverHostOnlineTime?: string | null;
}

/**
 * 顶部模式：正常输入表单 / 解析 ssh 命令。
 *
 * <p>运维给的通常是一整行 {@code ssh -p 2222 user@host}，手工拆成地址 / 端口 / 账号
 * 既慢又容易把端口填进地址里。所以顶部给一个二选一：要么按表单逐项填，
 * 要么把命令粘进解析页由系统拆。</p>
 */
type HostFormMode = "manual" | "parse";

const props = defineProps<{
  modelValue: boolean;
  isEdit: boolean;
  /** 编辑时的行数据（打开后详情异步回填） */
  host: Host | null;
  identityOptions: { label: string; value: number }[];
  groupOptions: { label: string; value: number | null }[];
  /**
   * 打开时默认停在哪个顶部模式。
   *
   * <p>外部入口如果本来就是「拿一条 ssh 命令来建主机」（从工单 / 剪贴板进来），
   * 传 {@code "parse"} 就直接落在解析页，省得用户再点一次。</p>
   */
  initialMode?: HostFormMode;
}>();
const router = useRouter();
const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "saved"): void;
  (e: "deploy-agent", host: { id: number; serverHostName: string; action: string }): void;
}>();

// ---- 表单状态（从 AssetsView 迁入）----
const formSaving = ref(false);
/** 标签编辑用文本（逗号分隔），提交时写成 serverHostTags */
const tagsText = ref("");
/**
 * 解析一条 ssh 命令，拆出地址 / 端口 / 账号。
 *
 * <p>用户手上通常只有运维给的一行命令（{@code ssh -p 2222 user@host}），
 * 让他自己拆成三个输入框既慢又容易把端口填进地址里。这里做一次宽松解析：
 * 认不出的部分原样忽略，绝不抛错 —— 粘贴的内容可能压根不是 ssh 命令。</p>
 *
 * <p>支持的写法：{@code -p 2222}、{@code -p2222}、{@code ssh://user@host:2222}、
 * 以及末尾的 {@code user@host}。{@code -i} 私钥路径无法内联成私钥内容，不处理。</p>
 *
 * @param raw 粘贴的原始文本
 * @returns 解析出的字段；一个都没认出来时返回 null
 */
function parseSshCommand(raw: string): { address: string; port?: number; account?: string } | null {
  const text = raw.trim();
  if (!text) return null;
  // 只接受以 ssh 开头的命令或 ssh:// 形式，避免把任意文本里的 a@b 当成主机
  if (!/^ssh\s/i.test(text) && !/^ssh:\/\//i.test(text)) return null;

  let rest = text.replace(/^ssh\s+/i, "").replace(/^ssh:\/\//i, "");

  let port: number | undefined;
  // -p 2222 / -p2222
  const pMatch = rest.match(/(?:^|\s)-p\s*(\d{1,5})(?=\s|$)/);
  if (pMatch) {
    const n = Number(pMatch[1]);
    if (n >= 1 && n <= 65535) port = n;
    rest = rest.replace(pMatch[0], " ");
  }

  // 丢掉其余选项及其值（-o Key=Value、-i path、-L 等），只留位置参数
  const tokens = rest
    .split(/\s+/)
    .filter(Boolean)
    .filter(t => !t.startsWith("-"));

  // 末位才是目标：ssh 命令里选项可能带路径参数，目标永远在最后
  const target = tokens[tokens.length - 1];
  if (!target) return null;

  let account: string | undefined;
  let hostPart = target;
  const at = target.lastIndexOf("@");
  if (at > 0) {
    account = target.slice(0, at);
    hostPart = target.slice(at + 1);
  }
  // ssh:// 形式可能带 :port
  const colon = hostPart.lastIndexOf(":");
  if (colon > 0) {
    const maybePort = Number(hostPart.slice(colon + 1));
    if (Number.isInteger(maybePort) && maybePort >= 1 && maybePort <= 65535) {
      port = port ?? maybePort;
      hostPart = hostPart.slice(0, colon);
    }
  }
  if (!hostPart) return null;
  return { address: hostPart, port, account };
}

/** 从 ssh 命令填充表单：地址/端口/账号，命中后提示，未命中不打扰 */
function fillFromSshCommand(): void {
  const parsed = parseSshCommand(sshCommandText.value);
  if (!parsed) {
    message.warning("没能识别，示例：ssh -p 2222 user@example.com");
    return;
  }
  form.value.serverHostAddress = parsed.address;
  if (parsed.port) form.value.serverHostPort = parsed.port;
  if (parsed.account) {
    formAccount.value = parsed.account;
    // 给了账号说明要自己填凭据，切到账号密码比留在「绑定身份」更顺
    if (formAuthMethod.value === "IDENTITY") formAuthMethod.value = "PASSWORD";
  }
  // 主机名留空时用地址兜底，省得用户再想一个名字
  if (!form.value.serverHostName?.trim()) form.value.serverHostName = parsed.address;
  message.success(`已从命令填充：${parsed.address}${parsed.port ? ":" + parsed.port : ""}`);
  // 识别成功即跳回表单页：解析页只有粘贴框，留在这里看不到填了什么
  formMode.value = "manual";
}

const form = ref<Partial<Host>>({ serverHostName: "", serverHostAddress: "", serverHostPort: 22, serverHostOsType: "LINUX", serverHostSshEnabled: 1, serverHostCollectMode: "OPENSSH", serverHostRemoteEnabled: 1, serverHostRemoteProtocol: "SSH", serverHostRemoteMode: "DIRECT", serverHostRemotePort: 22 });

/** 粘贴的 ssh 命令原文（只用于一键填充，不参与提交） */
const sshCommandText = ref("");

/** 顶部模式选项（el-segmented 走全等比较，值用字符串常量） */
const FORM_MODE_OPTIONS: { label: string; value: HostFormMode }[] = [
  { label: "正常输入", value: "manual" },
  { label: "解析", value: "parse" },
];

/** 当前顶部模式：正常输入 / 解析 */
const formMode = ref<HostFormMode>("manual");

/** 平台选项（只表达操作系统；图标统一走 utils/osIcon 的常规单色图标） */
const osOptions = [
  { label: "Linux", value: "LINUX" },
  { label: "Windows", value: "WINDOWS" },
  { label: "macOS", value: "MACOS" },
];
/** 认证方式 */
const formAuthMethod = ref("IDENTITY");
/** 从身份列表选择 */
const formIdentityId = ref<number | null>(null);
const formIdentityChanged = ref(false);
/** 登录凭据（瞬态） */
const formAccount = ref("");
const formPassword = ref("");
const formPrivateKey = ref("");
const hostBoundIdentities = ref<number[]>([]);
/** Prometheus 凭据校验 */
const promVerifying = ref(false);
const promVerified = ref(false);

/** 分组下拉：末尾追加「+ 添加分组」哨兵项（value=-1），点击跳转分组管理页 */
const groupOptionsWithAdd = computed(() => [
  ...props.groupOptions,
  { label: "+ 添加分组", value: -1 },
]);
/** 分组变更：选中「+ 添加分组」时重置并跳转分组管理页 */
function onGroupChange(v: number | null): void {
  if (v === -1) {
    form.value.msServerGroupId = null;
    router.push("/groups");
  }
}
/** Prometheus 凭据校验：调用后端 /metrics 连通性测试 */
async function verifyPrometheus(): Promise<void> {
  if (!form.value.id) {
    message.warning("请先保存主机后再校验 Prometheus");
    return;
  }
  promVerifying.value = true;
  try {
    const msg = await testPrometheusHost(form.value.id);
    promVerified.value = true;
    message.success(msg || "校验成功");
  } catch (e) {
    promVerified.value = false;
    message.error(String((e as Error)?.message ?? e));
  } finally {
    promVerifying.value = false;
  }
}

const authMethods = [
  { label: "默认身份（绑定）", value: "IDENTITY" },
  { label: "账号密码", value: "PASSWORD" },
  { label: "SSH 私钥", value: "PUBLIC_KEY" },
  { label: "免密登录", value: "NONE" },
];
const collectModes = [
  { label: "不采集", value: "NONE" },
  { label: "OpenSSH采集", value: "OPENSSH" },
  { label: "Agent采集", value: "AGENT" },
  { label: "Prometheus采集", value: "PROMETHEUS" },
  { label: "本机自采集(OSHI)", value: "LOCAL" },
];
/** 本机自采集：被管对象就是服务端所在机器，平台由后端按本机操作系统判定 */
const isLocalCollect = computed(() => form.value.serverHostCollectMode === "LOCAL");
/**
 * 平台选择：本机切到 LOCAL 采集（真实平台由后端按本机 OS 覆盖、地址识别物理网卡 IP），
 * 其余为真实操作系统。
 * @param value 平台值
 */
function selectPlatform(value: string): void {
  if (value === "LOCAL") {
    form.value.serverHostCollectMode = "LOCAL";
    void loadLocalAddress();
    return;
  }
  form.value.serverHostOsType = value;
  if (props.isEdit) {
    // 编辑态不动用户已有配置，只跟随平台修正「开启 SSH」默认值；
    // LOCAL 采集只适用于被管对象即服务端自身，必须切走
    form.value.serverHostSshEnabled = (value || "").toUpperCase().includes("WIN") ? 0 : 1;
    if (form.value.serverHostCollectMode === "LOCAL") form.value.serverHostCollectMode = "OPENSSH";
    return;
  }
  // 新建态：切平台即套用该平台的默认采集 / 远控配置
  // （Linux → OpenSSH 采集 + SSH 直连 22；Windows → 不采集、不开远控）
  applyPlatformDefaults(value);
}
/**
 * 平台项是否选中：本机以采集方式判定，其余以操作系统判定。
 * @param value 平台值
 */
function platformActive(value: string): boolean {
  if (value === "LOCAL") {
    return isLocalCollect.value;
  }
  return !isLocalCollect.value && form.value.serverHostOsType === value;
}
/** 远控协议：空值表示按平台推断（Windows→RDP，macOS→VNC，其余 SSH） */
const remoteProtocols = [
  { label: "自动（按平台）", value: "" },
  { label: "SSH", value: "SSH" },
  { label: "Telnet", value: "TELNET" },
  { label: "RDP", value: "RDP" },
  { label: "VNC", value: "VNC" },
];
/**
 * 凭据提示文案：密码字段是「主机登录凭据」，不是 SSH 专用。
 *
 * <p>Windows 主机默认走 RDP / VNC，提示里写「SSH 口令」会把用户带偏
 * （Windows 根本没有 SSH 口令这回事，除非专门装了 OpenSSH Server）。
 * 这里按平台给中性说明，真正的连接通道由「远控协议」决定。</p>
 */
const credentialPlaceholder = computed(() =>
  form.value.serverHostOsType === "WINDOWS" ? "Windows 登录口令" : "登录口令",
);
/** 登录账号提示：Windows 习惯 Administrator，Linux/macOS 习惯 root/ubuntu */
const accountPlaceholder = computed(() =>
  form.value.serverHostOsType === "WINDOWS" ? "如 Administrator" : "如 root / ubuntu",
);
/** 本机采集方式仅「不采集 / 本机自采集」，其余主机显示全部 */
const collectModeOptions = computed(() =>
  isLocalCollect.value
    ? collectModes.filter(m => m.value === "NONE" || m.value === "LOCAL")
    : collectModes,
);
/**
 * 远控协议选项：四种协议对任何主机都可用。
 *
 * <p>早期「本机只给 SSH / VNC」是按「本机已有控制台」的经验限制的，但它挡住了真实场景：
 * 本机上的 Telnet 服务（设备/网络设备模拟）和 RDP 服务（本机多会话/测试环境）都要能直连。
 * 是否可连由目标服务实际监听决定，界面不再按采集方式裁剪协议。</p>
 */
const remoteProtocolOptions = computed(() => remoteProtocols);
/** 识别本机首选网卡 IP（远控不使用回环），写入地址字段 */
async function loadLocalAddress(): Promise<void> {
  try {
    const ip = await fetchLocalAddress();
    if (ip) form.value.serverHostAddress = ip;
  } catch {}
}

/** 打开弹窗时的行数据快照：详情异步回填据此判断用户是否已经改过某个字段 */
let baseForm: Record<string, any> = {};

/**
 * 判断两个表单值是否等价（字段多为标量，对象/数组按序列化比较）。
 *
 * @param a 比较值
 * @param b 比较值
 * @return 等价返回 true
 */
function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a == null && b == null;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

/**
 * 把详情接口的结果合进表单，**用户已经改过的字段保持用户输入**。
 *
 * <p>弹窗打开时先用列表行数据立即渲染，详情接口（getHost / 绑定身份 / 身份列表）
 * 并行返回后再回填。整包 {@code {...form, ...detail}} 会用库里的旧值盖掉用户在
 * 回填到达前改好的字段（地址、端口等），保存后表现为「改了地址保存又还原」。</p>
 *
 * @param current 当前表单值
 * @param detail  详情接口返回的主机
 * @return 合并后的表单值
 */
function mergeDetail(current: Record<string, any>, detail: Record<string, any> | null): Record<string, any> {
  const next: Record<string, any> = { ...current };
  if (!detail) return next;
  for (const [key, value] of Object.entries(detail)) {
    // 当前值已偏离打开时的快照 ⇒ 用户改过，保留用户输入
    if (!sameValue(current[key], baseForm[key])) continue;
    next[key] = value;
  }
  return next;
}

/**
 * 采集方式变更：切到「本机自采集」时用系统识别的网卡 IP 兜底地址。
 *
 * <p>刻意用 change 事件而不是 watch(isLocalCollect)：watch 会在「打开编辑弹窗、
 * 用行数据回填表单」时也触发，把用户已经保存过的本机地址改写成首选网卡 IP，
 * 表现为「改了地址保存又还原」。用 change 后只有用户主动切换才补地址。</p>
 *
 * @param mode 新的采集方式
 */
function onCollectModeChange(mode: string): void {
  if (mode === "LOCAL") void loadLocalAddress();
}
/** 远控通道：GUACD 走 guacd 中转；DIRECT 由平台自身协议客户端直连（SSH/Telnet/VNC/RDP）；NONE 不经平台通道 */
const remoteModes = [
  { label: "Guacd 中转", value: "GUACD" },
  { label: "平台直连", value: "DIRECT" },
  { label: "无需通道", value: "NONE" },
];
/** 生效协议（含按平台推断），决定默认端口与口令字段 */
const effectiveRemoteProtocol = computed(() => {
  const p = (form.value.serverHostRemoteProtocol ?? "").toUpperCase();
  if (p === "SSH" || p === "TELNET" || p === "RDP" || p === "VNC") return p;
  const os = (form.value.serverHostOsType ?? "").toUpperCase();
  if (os.includes("WIN")) return "RDP";
  if (os.includes("MAC")) return "VNC";
  return "SSH";
});
/** 各协议默认端口 */
const REMOTE_DEFAULT_PORT: Record<string, number> = { SSH: 22, TELNET: 23, RDP: 3389, VNC: 5900 };
/** 端口占位提示（留空即按默认端口连接）；SSH 协议下跟随 SSH 端口 */
const remotePortPlaceholder = computed(() => {
  if (effectiveRemoteProtocol.value === "SSH") return "与 SSH 端口一致";
  return `默认 ${REMOTE_DEFAULT_PORT[effectiveRemoteProtocol.value]}`;
});

/**
 * 按平台套用「新增主机」的默认值。
 *
 * <p>口径（用户约定）：</p>
 * <ul>
 *   <li><b>Linux / macOS</b>：采集方式默认 <b>OpenSSH</b>；远控协议 <b>SSH</b>、
 *       通道<b>平台直连</b>、端口 <b>22</b>；开启 SSH；</li>
 *   <li><b>Windows</b>：默认<b>不采集</b>、<b>不开远控</b>（Windows 侧要先启用
 *       OpenSSH / WinRM 才谈得上采集），远控字段预置成 RDP + 平台直连。</li>
 * </ul>
 *
 * <p>只写与「默认」相关的字段，不动主机名称、地址、分组、标签等用户已填内容；
 * 新建与切平台都走这里，避免默认值在多处字面量里各写一遍然后漂移。</p>
 *
 * @param osType 操作系统（LINUX / WINDOWS / MACOS）
 */
function applyPlatformDefaults(osType: string): void {
  const isWindows = (osType || "").toUpperCase().includes("WIN");
  // 开启 SSH：Linux/macOS 默认开，Windows 默认关（需先启用 OpenSSH）
  form.value.serverHostSshEnabled = isWindows ? 0 : 1;
  if (isWindows) {
    form.value.serverHostCollectMode = "NONE";
    form.value.serverHostCollectEnabled = 0;
    form.value.serverHostRemoteEnabled = 0;
    form.value.serverHostRemoteProtocol = "RDP";
    form.value.serverHostRemoteMode = "DIRECT";
    form.value.serverHostRemotePort = REMOTE_DEFAULT_PORT.RDP;
    return;
  }
  form.value.serverHostCollectMode = "OPENSSH";
  form.value.serverHostCollectEnabled = 1;
  form.value.serverHostRemoteEnabled = 1;
  form.value.serverHostRemoteProtocol = "SSH";
  form.value.serverHostRemoteMode = "DIRECT";
  form.value.serverHostRemotePort = REMOTE_DEFAULT_PORT.SSH;
}
/** 平台自研直连通道覆盖 SSH（MINA SSHD）、Telnet（WS↔TCP 透传）、VNC（noVNC RFB）与 RDP（FreeRDP 原生桥）；Guacd 仅作可选的中转方案 */
const DIRECT_SUPPORTED = ["SSH", "TELNET", "RDP", "VNC"];
const directSupported = computed(() => DIRECT_SUPPORTED.includes(effectiveRemoteProtocol.value));
/**
 * 当前协议下可选通道（协议联动）：
 * SSH / Telnet / VNC → 平台直连 / 无需通道；
 * RDP → 平台直连（FreeRDP 原生桥）/ Guacd 中转（兼容存量环境）。
 */
const channelOptions = computed(() => {
  if (!directSupported.value) {
    // 未知协议：只留 GUACD，避免提交后端无法识别的直连组合
    return remoteModes.filter(m => m.value === "GUACD");
  }
  if (effectiveRemoteProtocol.value === "RDP") {
    // RDP 两种都支持：直连是默认，保留中转作为存量兜底
    return remoteModes.filter(m => m.value !== "NONE");
  }
  // SSH / Telnet / VNC：直连 / 无需通道，去掉 guacd 中转
  return remoteModes.filter(m => m.value !== "GUACD");
});

// 协议切换即纠正通道，避免下拉已锁定却仍提交后端会拒绝的组合
watch(effectiveRemoteProtocol, (protocol, prevProtocol) => {
  // 端口跟着协议走：原来端口一直是 null、输入框只剩占位提示，用户以为「没填」，
  // 实际提交的也是 null。这里在「留空」或「仍是上一个协议的默认端口」时直接补成新协议默认值，
  // 用户自己填过的非默认端口不动。
  const prevDefault = prevProtocol ? REMOTE_DEFAULT_PORT[prevProtocol] : undefined;
  const current = form.value.serverHostRemotePort;
  if (current == null || current === prevDefault) {
    form.value.serverHostRemotePort = REMOTE_DEFAULT_PORT[protocol] ?? null;
  }
  if (protocol === "RDP") {
    // RDP 也走平台自研直连（FreeRDP 原生桥）；仅当存量台账显式选了 guacd 时保留
    if (form.value.serverHostRemoteMode !== "GUACD") form.value.serverHostRemoteMode = "DIRECT";
  } else if (form.value.serverHostRemoteMode === "GUACD") {
    // SSH / VNC 不需要远控通道，从 RDP 切过来时回落到平台直连
    form.value.serverHostRemoteMode = "DIRECT";
  } else if (form.value.serverHostRemoteMode === "DIRECT" && !DIRECT_SUPPORTED.includes(protocol)) {
    form.value.serverHostRemoteMode = "GUACD";
  }
});

// Linux SSH 远控：远控端口跟随 SSH 端口，改 SSH 端口即同步
// 用户不需要在两个地方分别填同一个端口
watch(() => form.value.serverHostPort, (port) => {
  if (effectiveRemoteProtocol.value === "SSH" && port != null) {
    form.value.serverHostRemotePort = port;
  }
});

// ---- 凭据校验与 Agent ----
const verifying = ref(false);
const deploying = ref(false);
const credVerified = ref(false);

async function verifyCredentials(): Promise<void> {
  if (!form.value.id) {
    message.warning("请先保存主机后再校验凭据");
    return;
  }
  verifying.value = true;
  try {
    // 真正调用后端探测：建立连接、采集硬件并识别包管理器（无占位）
    // 硬件探测需建立 WinRM/SSH 连接并执行 PowerShell，可能耗时数十秒，单独放宽超时
    const detected = await http()
      .post(`/ms/server/host/${form.value.id}/detect`)
      .timeout(120_000)
      .then((r: any) => unwrapResult<any>(r));
    // 合并探测回写结果（CPU/内存/磁盘 + packageManager 等）
    if (detected && typeof detected === "object") {
      form.value = { ...(form.value as any), ...detected };
    }
    credVerified.value = true;
    message.success("凭据校验成功");
  } catch (e) {
    credVerified.value = false;
    message.error("凭据校验失败：" + String((e as Error)?.message ?? e));
  } finally {
    verifying.value = false;
  }
}

async function testAgentConnection(): Promise<void> {
  try {
    const r = await http().get(`/ms/monitor/host/agent/test/${form.value.id}`).then((r: any) => unwrapResult<any>(r));
    if (r?.available) {
      form.value.serverHostAgentInstalled = 1;
      message.success("Agent 连接成功，已标记为已安装");
    } else {
      message.error("Agent 连接失败：" + (r?.msg || "无法连接"));
    }
  } catch (e) {
    message.error("Agent 连接测试失败");
  }
}

async function deployAgent(): Promise<void> {
  deploying.value = true;
  try {
    // 调用后端部署接口
    const hostId = form.value.id;
    if (!hostId) {
      message.warning("请先保存主机信息");
      return;
    }
    // 关闭编辑弹窗，打开部署弹窗
    emit("update:modelValue", false);
    // 触发部署事件，传递主机信息和操作类型
    emit("deploy-agent", { id: hostId, serverHostName: form.value.serverHostName ?? '', action: 'install' });
    message.success("Agent 部署已启动");
  } catch (e) {
    message.error("Agent 部署失败");
  } finally {
    deploying.value = false;
  }
}

async function resolvePackagePath(configKey: string, fallback: string): Promise<string> {
  try {
    const map = await http().get("/ms/server/config/map").then((r: any) => unwrapResult<Record<string, unknown>>(r));
    const p = map?.[configKey];
    if (typeof p === "string" && p) {
      if (p.startsWith("http://") || p.startsWith("https://")) return p;
      return "/" + p.replace(/^\/+/, "");
    }
  } catch {}
  return "/" + fallback;
}
function downloadAgent(): void {
  resolvePackagePath("agent.package.path", "monitor-agent/monitor-agent.tar.gz").then(url => window.open(url, "_blank"));
}
function downloadPrometheus(): void {
  resolvePackagePath("prometheus.package.path", "prometheus/prometheus.tar.gz").then(url => window.open(url, "_blank"));
}

/**
 * 逗号分隔标签拆分为数组
 * @param tags 标签字符串
 */
function splitTags(tags?: string | null): string[] {
  if (!tags) return [];
  // 同时兼容中英文逗号分隔（后端/手工录入可能用「，」）
  return tags.split(/[,，]/).map(t => t.trim()).filter(Boolean);
}

/**
 * 重置表单
 */
function resetForm(): void {
  form.value = {
    serverHostName: "", serverHostAddress: "", serverHostPort: 22,
    serverHostOsType: "LINUX",
    msServerGroupId: null, serverHostTags: "", serverHostDescription: "",
    serverHostCode: "",
    // 采集间隔与各类开关（开关用 1/0 number，与后端一致）
    serverHostCollectInterval: 15,
    serverHostOnlineEnabled: 1, serverHostOnlineInterval: 60,
    serverHostVncPassword: "",
    serverHostAgentEnabled: 0, serverHostDelayEnabled: 1, serverHostDelayInterval: 60,
  };
  // 平台相关默认值（采集方式 / 远控协议·通道·端口 / 开启 SSH）统一由这里套用，
  // 不再在上面字面量里重复一遍 —— 两处各写一份必然漂移
  applyPlatformDefaults("LINUX");
  // 新建态没有「用户改动前的快照」，清掉上一次编辑的残留
  baseForm = {};
  tagsText.value = "";
  formAuthMethod.value = "IDENTITY";
  formIdentityId.value = null;
  formIdentityChanged.value = false;
  formAccount.value = "";
  formPassword.value = "";
  formPrivateKey.value = "";
  hostBoundIdentities.value = [];
}

/** 编辑弹窗里切换登录身份 */
function onFormIdentityChange(v: number | null): void {
  formIdentityChanged.value = true;
  formIdentityId.value = v;
}

/**
 * 校验表单必填项
 */
function validForm(): boolean {
  if (!form.value.serverHostName?.trim()) { message.warning("请输入主机名"); return false; }
  if (!form.value.serverHostAddress?.trim()) { message.warning("请输入地址"); return false; }
  if (!form.value.serverHostPort) { message.warning("请输入端口"); return false; }
  return true;
}

async function submitForm(): Promise<void> {
  if (!validForm()) return;
  // 标签文本 → 逗号分隔字符串
  form.value.serverHostTags = tagsText.value.split(",").map(t => t.trim()).filter(Boolean).join(",");
  form.value.serverHostCollectEnabled = form.value.serverHostCollectEnabled ? 1 : 0;
  form.value.serverHostOnlineEnabled = form.value.serverHostOnlineEnabled ? 1 : 0;
  form.value.serverHostRemoteEnabled = form.value.serverHostRemoteEnabled ? 1 : 0;
  form.value.serverHostAgentEnabled = form.value.serverHostAgentEnabled ? 1 : 0;
  form.value.serverHostDelayEnabled = form.value.serverHostDelayEnabled ? 1 : 0;
  // 远控配置归一：协议留空=按平台推断，RDP 默认平台直连（FreeRDP 原生桥），非 VNC 不存口令
  const remoteProtocol = (form.value.serverHostRemoteProtocol || "").toUpperCase() || null;
  form.value.serverHostRemoteProtocol = remoteProtocol;
  if (form.value.serverHostRemoteMode === "DIRECT" && !directSupported.value) {
    // 只有协议无法直连时才回落中转
    form.value.serverHostRemoteMode = "GUACD";
  }
  if (!form.value.serverHostRemoteMode) form.value.serverHostRemoteMode = "DIRECT";
  if (remoteProtocol && remoteProtocol !== "VNC") form.value.serverHostVncPassword = null;
  if (form.value.serverHostRemotePort === 0) form.value.serverHostRemotePort = null;
  // 注入认证凭据（瞬态字段，后端不落库，用于 SSH 连接建立）
  if (formAuthMethod.value === "PASSWORD") {
    form.value.serverHostAccount = formAccount.value || null;
    form.value.serverHostPassword = formPassword.value || null;
    form.value.serverHostPrivateKey = null;
    form.value.serverHostAuthType = null;
  } else if (formAuthMethod.value === "PUBLIC_KEY") {
    form.value.serverHostAccount = formAccount.value || null;
    form.value.serverHostPassword = null;
    form.value.serverHostPrivateKey = formPrivateKey.value || null;
    form.value.serverHostAuthType = null;
  } else if (formAuthMethod.value === "NONE") {
    // 免密登录：账号不再从地址推导，本机主机可由后端取平台运行账号，
    // 只提交类型标记，后端创建免密（NONE）身份
    form.value.serverHostAccount = formAccount.value || null;
    form.value.serverHostPassword = null;
    form.value.serverHostPrivateKey = null;
    form.value.serverHostAuthType = "none";
  } else {
    form.value.serverHostAccount = null;
    form.value.serverHostPassword = null;
    form.value.serverHostPrivateKey = null;
    form.value.serverHostAuthType = null;
  }
  formSaving.value = true;
  try {
    const res = await saveHost(props.isEdit ? form.value.id ?? null : null, form.value) as any;
    // 新主机：取回后端返回的 id（res 可能是保存后的实体或 id）
    const savedId = props.isEdit ? form.value.id : (res?.id ?? null);
    let hostId = props.isEdit ? form.value.id! : null;
    if (!hostId && savedId) hostId = Number(savedId);
    // 若表单选了身份，且是显式选择的，则绑定到（新/旧）主机
    if (hostId && formIdentityChanged.value && formIdentityId.value != null) {
      await bindIdentity(hostId, formIdentityId.value);
    }
    message.success(props.isEdit ? "已更新" : "已新增");
    emit("update:modelValue", false);
    emit("saved");
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  } finally {
    formSaving.value = false;
  }
}

// 打开时初始化：编辑 → 行数据立即填充 + 详情异步回填；新增 → 重置表单
watch(() => props.modelValue, (v) => {
  if (!v) return;
  // 每次打开都把顶部模式归位：默认「正常输入」，外部指定解析则直接落在解析页。
  // 顺手清掉上一次残留的命令文本，避免把上一条粘贴内容当成这一次的输入。
  formMode.value = props.initialMode ?? "manual";
  sshCommandText.value = "";
  if (props.isEdit && props.host) {
    form.value = { ...(props.host as any) };
    // 开关字段保持后端 number(1/0)，ReSwitch 用 active-value=1/inactive-value=0 绑定
    if (form.value.serverHostCollectEnabled == null) form.value.serverHostCollectEnabled = 1;
    if (form.value.serverHostOnlineEnabled == null) form.value.serverHostOnlineEnabled = 1;
    if (form.value.serverHostRemoteEnabled == null) form.value.serverHostRemoteEnabled = 1;
    if (form.value.serverHostDelayEnabled == null) form.value.serverHostDelayEnabled = 1;
    if (form.value.serverHostAgentEnabled == null) form.value.serverHostAgentEnabled = 0;
    if (form.value.serverHostSshEnabled == null) {
      form.value.serverHostSshEnabled = (form.value.serverHostOsType || "").toUpperCase() === "WINDOWS" ? 0 : 1;
    }
    if (!form.value.serverHostRemoteMode) form.value.serverHostRemoteMode = "DIRECT";
    if (!form.value.serverHostCollectMode) form.value.serverHostCollectMode = "AGENT";
    tagsText.value = splitTags(form.value.serverHostTags).join(", ");
    formAuthMethod.value = "IDENTITY";
    formAccount.value = "";
    formPassword.value = "";
    formPrivateKey.value = "";
    formIdentityChanged.value = false;
    formIdentityId.value = null;
    hostBoundIdentities.value = [];
    // 行数据 + 默认值填好后再拍快照：详情回填只覆盖用户没动过的字段
    baseForm = { ...(form.value as any) };
    // 并行请求详情 + 已绑定身份 + 全量身份，返回后回填（弹窗已先显示，用户可立即看到基础信息）
    void Promise.all([
      getHost(props.host.id!).catch(() => props.host),
      listBoundIdentities(props.host.id!).catch(() => []),
      getIdentities().catch(() => []),
    ]).then(([full, bound, identities]) => {
      if (!props.modelValue) return; // 弹窗已关闭则丢弃回填
      form.value = mergeDetail(form.value as Record<string, any>, (full as any) ?? null);
      tagsText.value = splitTags(form.value.serverHostTags).join(", ");
      // 历史数据里远控端口常是 null，表单上空着只剩占位提示，看起来像「没填」。
      // 开启远控时补成协议默认端口（SSH 22 / RDP 3389 / VNC 5900）。
      if (form.value.serverHostRemotePort == null && form.value.serverHostRemoteEnabled === 1) {
        form.value.serverHostRemotePort = REMOTE_DEFAULT_PORT[effectiveRemoteProtocol.value] ?? null;
      }
      const bindList = Array.isArray(bound) ? bound : [];
      if (formIdentityId.value == null && bindList.length > 0) {
        formIdentityId.value = bindList[0];
      }
      hostBoundIdentities.value = bindList;
      // 按第一个绑定身份的类型恢复「登录方式」：免密(NONE) → 免密登录 + 回填账号；
      // 口令/私钥身份保持「默认身份（绑定）」即可（登录方式下拉默认值），不强行切换。
      const firstBound = (Array.isArray(identities) ? identities : [])
        .find(i => i.id === bindList[0]);
      if (firstBound && String(firstBound.msServerIdentityAuthType ?? "").toUpperCase() === "NONE") {
        formAuthMethod.value = "NONE";
        formAccount.value = firstBound.msServerIdentityUsername ?? "";
      }
      // 本机：详情回填后仅在地址为空时用系统识别的网卡 IP 兜底。
      // 用户显式保存过的地址必须保留——后端 applyLocalDefaults 也是「仅空值才归一」，
      // 前端无条件覆盖会造成「改了本机地址保存又还原」。
      if (isLocalCollect.value && !form.value.serverHostAddress?.trim()) {
        void loadLocalAddress();
      }
    });
  } else {
    resetForm();
  }
});
</script>

<template>
  <ReDialog
    :model-value="props.modelValue"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
    :title="props.isEdit ? '编辑主机' : '新增主机'"
    width="880px"
    :height="900"
    :close-on-click-modal="false"
  >
    <!-- 顶部模式：正常输入 / 解析。解析页只放粘贴框，识别成功自动跳回表单 -->
    <div class="form-mode">
      <el-segmented v-model="formMode" :options="FORM_MODE_OPTIONS" />
      <span class="form-mode__hint">
        {{ formMode === "parse" ? "粘贴运维给的 ssh 命令，识别后自动填进表单" : "逐项填写主机信息" }}
      </span>
    </div>

    <div v-if="formMode === 'parse'" class="parse-panel">
      <el-input
        v-model="sshCommandText"
        type="textarea"
        :rows="4"
        resize="none"
        placeholder="粘贴 ssh 命令，如 ssh -p 2222 user@ssh.example.com"
        @keyup.ctrl.enter="fillFromSshCommand"
        @keyup.meta.enter="fillFromSshCommand"
      />
      <div class="parse-panel__hint">
        支持 <code>ssh -p 端口 账号@地址</code> 与 <code>ssh://账号@地址:端口</code>；
        识别出的地址 / 端口 / 账号会写进表单，<code>Ctrl + Enter</code> 可直接识别
      </div>
      <div class="parse-panel__actions">
        <ReButton type="primary" :show-text="true" @click="fillFromSshCommand">识别并填入表单</ReButton>
        <ReButton @click="formMode = 'manual'">直接手填</ReButton>
      </div>
    </div>

    <ReForm :model="form" label-position="top" class="form-vertical">
      <div v-show="formMode === 'manual'" class="form-grid">
        <!-- ─── 基本信息 ─── -->
        <div class="form-section full">基本信息</div>
        <ReFormItem label="主机名称" class="col-span-2" required>
          <ReInput v-model="form.serverHostName" placeholder="如 prod-nginx-01" style="width:100%" />
        </ReFormItem>
        <ReFormItem label="主机地址" required>
          <ReInput v-model="form.serverHostAddress" placeholder="IP 或域名" style="width:100%" />
          <div v-if="isLocalCollect" class="addr-hint">本机地址由系统识别（物理网卡 IP），远控不使用回环地址</div>
        </ReFormItem>
        <ReFormItem label="端口">
          <ReInputNumber v-model="form.serverHostPort" :min="1" :max="65535" style="width:100%" />
        </ReFormItem>
        <ReFormItem label="平台" class="col-span-2">
          <div class="os-picker">
            <div
              class="os-picker-item"
              :class="{ active: platformActive('LOCAL') }"
              @click="selectPlatform('LOCAL')"
            >
              <span class="os-picker-ico" v-html="osIconSvg('LOCAL')"></span>
              <span class="os-picker-label">本机</span>
            </div>
            <div
              v-for="opt in osOptions"
              :key="opt.value"
              class="os-picker-item"
              :class="{ active: platformActive(opt.value) }"
              @click="selectPlatform(opt.value)"
            >
              <span class="os-picker-ico" v-html="osIconSvg(opt.value)"></span>
              <span class="os-picker-label">{{ opt.label }}</span>
            </div>
          </div>
        </ReFormItem>
        <ReFormItem label="主机编码" class="col-span-2">
          <ReInput v-model="form.serverHostCode" placeholder="唯一编码（可选）" style="width:100%" />
        </ReFormItem>

        <!-- ─── 认证方式（本机自采集无需凭据）─── -->
        <template v-if="!isLocalCollect">
        <div class="form-section full">认证方式</div>
        <ReFormItem label="登录方式">
          <ReSelect v-model="formAuthMethod" style="width:100%" :options="authMethods" />
        </ReFormItem>
        <ReFormItem v-if="formAuthMethod === 'IDENTITY'" label="绑定身份" class="col-span-2">
          <ReSelect v-model="formIdentityId" placeholder="使用默认凭据" clearable style="width:100%" :options="props.identityOptions" />
        </ReFormItem>
        <template v-if="formAuthMethod === 'PASSWORD'">
          <ReFormItem label="登录账号">
            <ReInput v-model="formAccount" :placeholder="accountPlaceholder" style="width:100%" />
          </ReFormItem>
          <ReFormItem label="登录密码" class="col-span-2">
            <ReInput v-model="formPassword" type="password" show-password :placeholder="credentialPlaceholder" style="width:100%" />
          </ReFormItem>
        </template>
        <template v-if="formAuthMethod === 'PUBLIC_KEY'">
          <ReFormItem label="登录账号">
            <ReInput v-model="formAccount" :placeholder="accountPlaceholder" style="width:100%" />
          </ReFormItem>
          <ReFormItem label="私钥" class="col-span-2">
            <ReInput v-model="formPrivateKey" type="textarea" :rows="3" placeholder="粘贴 PEM 格式私钥内容（OpenSSH 免密登录用）" style="width:100%" />
          </ReFormItem>
        </template>
        <template v-if="formAuthMethod === 'NONE'">
          <ReFormItem label="登录账号">
            <ReInput v-model="formAccount" :placeholder="accountPlaceholder + '；本机可留空用平台运行账号'" style="width:100%" />
          </ReFormItem>
          <ReFormItem label="免密说明" class="col-span-2">
            <ReText type="info">免密登录不需要密码或私钥，但必须填登录账号（本机主机可留空，默认用平台运行账号）。地址字段只写主机，不解析 <code>user@host</code>。</ReText>
          </ReFormItem>
        </template>
        </template>

        <!-- ─── 分组与标签 ─── -->
        <div class="form-section full">分组与标签</div>
        <ReFormItem label="分组">
          <ReSelect v-model="form.msServerGroupId" clearable placeholder="未分组" style="width:100%" :options="groupOptionsWithAdd" @change="onGroupChange" />
        </ReFormItem>
        <ReFormItem label="标签">
          <ReInput v-model="tagsText" placeholder="逗号分隔，如 prod,db,linux" style="width:100%" />
        </ReFormItem>
        <ReFormItem label="描述" class="col-span-2">
          <ReInput v-model="form.serverHostDescription" type="textarea" :rows="1" placeholder="主机用途 / 备注（可选）" style="width:100%" />
        </ReFormItem>

        <!-- ─── 执行通道 ─── -->
        <div class="form-section full">执行通道</div>
        <ReFormItem label="开启 SSH" class="col-span-2">
          <div class="switch-row">
            <ReSwitch layout="square" v-model="form.serverHostSshEnabled" :active-value="1" :inactive-value="0" />
            <span class="switch-extra-label">{{ form.serverHostSshEnabled === 1 ? "发布/命令执行等基于 OpenSSH 的能力可用" : "未开启 SSH（Windows 需先启用 OpenSSH）" }}</span>
          </div>
        </ReFormItem>

        <!-- ─── 采集配置 ─── -->
        <div class="form-section full">采集配置</div>
        <ReFormItem label="采集方式" class="col-span-2">
          <ReSelect v-model="form.serverHostCollectMode" style="width:100%" :options="collectModeOptions" @change="onCollectModeChange" />
        </ReFormItem>
        <ReFormItem v-if="form.serverHostCollectMode !== 'NONE'" label="自动采集" class="col-span-2">
          <div class="switch-row">
            <ReSwitch layout="square" v-model="form.serverHostCollectEnabled" :active-value="1" :inactive-value="0" />
            <div v-if="form.serverHostCollectEnabled === 1" class="switch-extra">
              <span class="switch-extra-label">间隔(秒)</span>
              <ReInputNumber v-model="form.serverHostCollectInterval" :min="5" :max="86400" style="width:180px" />
            </div>
          </div>
        </ReFormItem>
        <ReFormItem label="在线检测" class="col-span-2">
          <div class="switch-row">
            <ReSwitch layout="square" v-model="form.serverHostOnlineEnabled" :active-value="1" :inactive-value="0" />
            <div v-if="form.serverHostOnlineEnabled === 1" class="switch-extra">
              <span class="switch-extra-label">间隔(秒)</span>
              <ReInputNumber v-model="form.serverHostOnlineInterval" :min="5" :max="3600" style="width:180px" />
            </div>
          </div>
        </ReFormItem>
        <ReFormItem label="延迟检测" class="col-span-2">
          <div class="switch-row">
            <ReSwitch layout="square" v-model="form.serverHostDelayEnabled" :active-value="1" :inactive-value="0" />
            <div v-if="form.serverHostDelayEnabled === 1" class="switch-extra">
              <span class="switch-extra-label">间隔(秒)</span>
              <ReInputNumber v-model="form.serverHostDelayInterval" :min="5" :max="3600" style="width:180px" />
            </div>
          </div>
        </ReFormItem>

        <!-- ─── 远控配置（原主机画像中的远控设置，统一在此维护）─── -->
        <div class="form-section full">远控配置</div>
        <ReFormItem label="远程控制" class="col-span-2">
          <div class="switch-row">
            <ReSwitch layout="square" v-model="form.serverHostRemoteEnabled" :active-value="1" :inactive-value="0" />
            <span class="switch-extra-label">{{ form.serverHostRemoteEnabled === 1 ? "允许从资产页发起远控" : "禁止远控" }}</span>
          </div>
        </ReFormItem>
        <template v-if="form.serverHostRemoteEnabled === 1">
          <ReFormItem label="远控协议">
            <ReSelect v-model="form.serverHostRemoteProtocol" style="width:100%" :options="remoteProtocolOptions" />
          </ReFormItem>
          <ReFormItem label="远控通道">
            <ReSelect
              v-model="form.serverHostRemoteMode"
              style="width:100%"
              :options="channelOptions"
            />
          </ReFormItem>
          <ReFormItem label="远控端口">
            <ReInputNumber v-model="form.serverHostRemotePort" :min="1" :max="65535" :placeholder="remotePortPlaceholder" :disabled="effectiveRemoteProtocol === 'SSH'" style="width:100%" />
            <div v-if="effectiveRemoteProtocol === 'SSH'" class="addr-hint">Linux SSH 远控与采集共用同一端口，无需单独配置</div>
          </ReFormItem>
          <ReFormItem v-if="effectiveRemoteProtocol === 'VNC'" label="VNC 密码">
            <ReInput v-model="form.serverHostVncPassword" type="password" show-password placeholder="VNC 服务端口令" style="width:100%" />
          </ReFormItem>
          <ReFormItem class="col-span-2" label=" ">
            <span class="remote-tip">
              通道随协议联动：SSH / Telnet / VNC / RDP 都由平台自研客户端直连
              （SSH 用 MINA SSHD PTY、Telnet 走 WS↔TCP 透传、VNC 用 noVNC RFB、RDP 用 FreeRDP 原生桥），
              不需要 guacd 中转；「Guacd 中转」仅作为存量环境的备选。
              「无需通道」表示平台不做任何中转，只显示本机客户端的连接地址（SSH 用系统终端、VNC 用本机客户端）。
              端口留空按协议默认（SSH 22 / Telnet 23 / RDP 3389 / VNC 5900）。
            </span>
          </ReFormItem>
        </template>

        <!-- ─── 凭据校验与 Agent（仅 Agent 采集模式显示；本机自采集由 monitor 进程直读，无需凭据）─── -->
        <template v-if="form.serverHostCollectMode === 'AGENT'">
          <div class="form-section full">凭据校验与 Agent</div>
          <ReFormItem label="Agent 端口">
            <ReInputNumber v-model="form.serverHostAgentPort" :min="1" :max="65535" style="width:100%" placeholder="默认 19876" />
          </ReFormItem>
          <ReFormItem label="凭据状态">
            <div style="display:flex;gap:8px;align-items:center;">
              <ReButton @click="verifyCredentials" :loading="verifying">校验凭据</ReButton>
              <span v-if="credVerified" style="color:#67c23a;">✓ 校验成功</span>
              <span v-else style="color:#909399;">未校验</span>
            </div>
          </ReFormItem>
          <ReFormItem v-if="credVerified" label="Agent 部署" class="col-span-2">
            <div style="display:flex;gap:8px;">
              <ReButton type="primary" @click="deployAgent" :loading="deploying">自动部署 Agent</ReButton>
              <ReButton @click="downloadAgent">下载 Agent 包</ReButton>
              <ReButton type="success" @click="testAgentConnection">测试 Agent 连接</ReButton>
            </div>
          </ReFormItem>
          <ReFormItem v-else label="Agent 包下载" class="col-span-2">
            <ReButton @click="downloadAgent">下载 Agent 包</ReButton>
          </ReFormItem>
        </template>

        <!-- ─── 凭据校验与 Prometheus（仅 PROMETHEUS 模式显示）─── -->
        <template v-if="form.serverHostCollectMode === 'PROMETHEUS'">
          <div class="form-section full">凭据校验与 Prometheus</div>
          <ReFormItem label="凭据状态" class="col-span-2">
            <div style="display:flex;gap:8px;align-items:center;">
              <ReButton type="primary" :loading="promVerifying" @click="verifyPrometheus">凭据校验</ReButton>
              <span v-if="promVerified" style="color:#67c23a;">✓ 校验成功</span>
              <span v-else style="color:#909399;">未校验</span>
            </div>
          </ReFormItem>
          <ReFormItem label="Prometheus 包" class="col-span-2">
            <div style="display:flex;gap:8px;align-items:center;">
              <ReButton @click="downloadPrometheus">下载 Prometheus 包</ReButton>
            </div>
          </ReFormItem>
        </template>
      </div>
    </ReForm>
    <template #footer>
      <ReButton @click="emit('update:modelValue', false)">取消</ReButton>
      <ReButton type="primary" :loading="formSaving" @click="submitForm" icon="Check" :show-text="true">保存</ReButton>
    </template>
  </ReDialog>
</template>

<style scoped lang="scss">
/* 弹窗表单两列布局（从 AssetsView 迁入，三列改为两列） */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px 24px;
  padding: 8px 8px 8px;
}
/* 上下布局：label 独占一行在上，控件在下 */
.form-vertical {
  :deep(.el-form-item) {
    display: block;
    width: 100%;
    margin-bottom: 14px;
  }
  :deep(.el-form-item__label) {
    display: block;
    height: auto;
    margin-bottom: 6px;
    line-height: 1.4;
    padding: 0;
    font-size: 13px;
    color: var(--text-secondary);
  }
  :deep(.el-form-item__content) {
    margin-left: 0 !important;
  }
  :deep(.el-form-item__content > .re-input),
  :deep(.el-form-item__content > .el-input-number) {
    width: 100%;
  }
}
/* 分节标题：左侧品牌色竖条 + 留白 */
.form-section {
  position: relative;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  padding: 0 0 8px 12px;
  margin-top: 14px;
  border-bottom: 1px solid var(--border-subtle);
}
.form-section::before {
  content: "";
  position: absolute;
  left: 0;
  top: 2px;
  bottom: 10px;
  width: 3px;
  border-radius: 2px;
  background: var(--brand-500, #6d5dfc);
}
.form-section:first-child {
  margin-top: 0;
}
.form-section.full {
  grid-column: 1 / -1;
}
.col-span-2 {
  grid-column: span 2;
}
/* 平台图片选择器 */
.os-locked {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px;
  border: 1px dashed var(--border-subtle, #dcdfe6);
  border-radius: 10px;
  background: var(--fill-light, #f8f9fb);
  width: 100%;
}
.os-locked-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #303133);
}
.os-locked-desc {
  font-size: 12px;
  color: var(--text-secondary, #909399);
}
.os-picker {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.os-picker-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  border: 2px solid var(--border-subtle, #e4e7ed);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--bg-card, #fff);
  min-width: 80px;
}
.os-picker-item:hover {
  border-color: var(--brand-400, #8b7ffb);
  background: var(--brand-50, #f5f3ff);
}
.os-picker-item.active {
  border-color: var(--brand-500, #6d5dfc);
  background: var(--brand-50, #f5f3ff);
  box-shadow: 0 0 0 3px rgba(109, 93, 252, 0.12);
}
.os-picker-ico {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  font-size: 32px;
  line-height: 1;
  color: var(--text-secondary, #909399);
}
.os-picker-item:hover .os-picker-ico,
.os-picker-item.active .os-picker-ico {
  color: var(--brand-500, #6d5dfc);
}
.os-picker-ico :deep(svg) {
  display: block;
}
.os-picker-label {
  font-size: 12px;
  color: var(--text-secondary, #606266);
}
.os-picker-item.active .os-picker-label {
  color: var(--brand-600, #5a4ae0);
  font-weight: 600;
}
/* 开关+间隔同一行：切换时间隔在该行内显示，不影响其他行布局 */
.switch-row {
  display: flex;
  align-items: center;
  gap: 16px;
}
.switch-extra {
  display: flex;
  align-items: center;
  gap: 8px;
}
.switch-extra-label {
  font-size: 13px;
  color: var(--text-secondary, #606266);
  white-space: nowrap;
}
/* 远控配置说明 */
.remote-tip {
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-tertiary, #909399);
}
/* 本机地址提示 */
.addr-hint {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary, #909399);
}

/* ─── 顶部模式切换：正常输入 / 解析 ─── */
.form-mode {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 0 8px 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--border-subtle, #e4e7ed);
}

.form-mode__hint {
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-tertiary, #909399);
}

/* ─── 解析页：粘贴 ssh 命令，识别成功自动跳回表单 ─── */
.parse-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px 8px 16px;
}

.parse-panel__hint {
  font-size: 12px;
  line-height: 1.7;
  color: var(--text-secondary, #909399);
}

.parse-panel__hint code {
  padding: 1px 4px;
  font-family: var(--el-font-family-mono, ui-monospace, monospace);
  font-size: 11.5px;
  background: var(--el-fill-color-light, #f5f7fa);
  border-radius: 3px;
}

.parse-panel__actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>

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
import { getHost, listBoundIdentities, bindIdentity, saveHost, testPrometheusHost, fetchLocalAddress } from "../api";
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
  /** 远控通道：GUACD 中转 / DIRECT 直连 / NONE 无需通道（RDP 强制 GUACD） */
  serverHostRemoteMode?: string | null;
  /** VNC 口令（落库 AES 加密，详情接口回显明文） */
  serverHostVncPassword?: string | null;
  serverHostLastCollectTime?: string | null;
  serverHostOnlineTime?: string | null;
}

const props = defineProps<{
  modelValue: boolean;
  isEdit: boolean;
  /** 编辑时的行数据（打开后详情异步回填） */
  host: Host | null;
  identityOptions: { label: string; value: number }[];
  groupOptions: { label: string; value: number | null }[];
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
}

const form = ref<Partial<Host>>({ serverHostName: "", serverHostAddress: "", serverHostPort: 22, serverHostOsType: "LINUX", serverHostSshEnabled: 1, serverHostCollectMode: "AGENT" });

/** 粘贴的 ssh 命令原文（只用于一键填充，不参与提交） */
const sshCommandText = ref("");

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
    form.value.serverHostRemoteProtocol = "VNC";
    void loadLocalAddress();
    return;
  }
  form.value.serverHostOsType = value;
  // 「开启 SSH」默认值随平台切换：Linux/macOS 默认开，Windows 默认关（可手动覆盖）
  form.value.serverHostSshEnabled = value === "WINDOWS" ? 0 : 1;
  // 离开本机：LOCAL 采集只适用于被管对象即服务端自身，必须切走
  if (form.value.serverHostCollectMode === "LOCAL") {
    form.value.serverHostCollectMode = "AGENT";
  }
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
  { label: "RDP", value: "RDP" },
  { label: "VNC", value: "VNC" },
];
/** 本机采集方式仅「不采集 / 本机自采集」，其余主机显示全部 */
const collectModeOptions = computed(() =>
  isLocalCollect.value
    ? collectModes.filter(m => m.value === "NONE" || m.value === "LOCAL")
    : collectModes,
);
/** 本机远控仅支持 VNC，其余主机显示全部协议 */
const remoteProtocolOptions = computed(() =>
  isLocalCollect.value
    ? [{ label: "VNC", value: "VNC" }]
    : remoteProtocols,
);
/** 识别本机首选网卡 IP（远控不使用回环），写入地址字段 */
async function loadLocalAddress(): Promise<void> {
  try {
    const ip = await fetchLocalAddress();
    if (ip) form.value.serverHostAddress = ip;
  } catch {}
}
// 切到本机：强制远控协议 VNC 并识别本机 IP
watch(isLocalCollect, (local) => {
  if (local) {
    form.value.serverHostRemoteProtocol = "VNC";
    void loadLocalAddress();
  }
});
/** 远控通道：GUACD 走 guacd 中转；DIRECT 由平台自身协议客户端直连（SSH/VNC）；NONE 不经平台通道 */
const remoteModes = [
  { label: "Guacd 中转", value: "GUACD" },
  { label: "平台直连", value: "DIRECT" },
  { label: "无需通道", value: "NONE" },
];
/** 生效协议（含按平台推断），决定默认端口与口令字段 */
const effectiveRemoteProtocol = computed(() => {
  const p = (form.value.serverHostRemoteProtocol ?? "").toUpperCase();
  if (p === "SSH" || p === "RDP" || p === "VNC") return p;
  const os = (form.value.serverHostOsType ?? "").toUpperCase();
  if (os.includes("WIN")) return "RDP";
  if (os.includes("MAC")) return "VNC";
  return "SSH";
});
/** 各协议默认端口 */
const REMOTE_DEFAULT_PORT: Record<string, number> = { SSH: 22, RDP: 3389, VNC: 5900 };
/** 端口占位提示（留空即按默认端口连接） */
const remotePortPlaceholder = computed(() => `默认 ${REMOTE_DEFAULT_PORT[effectiveRemoteProtocol.value]}`);
/** 平台自研直连通道覆盖 SSH（MINA SSHD）与 VNC（RFB）；RDP 必须经 guacd */
const DIRECT_SUPPORTED = ["SSH", "VNC"];
const directSupported = computed(() => DIRECT_SUPPORTED.includes(effectiveRemoteProtocol.value));
/** RDP 只能由 guacd 渲染，通道锁定不可选 */
const channelEditable = computed(() => effectiveRemoteProtocol.value !== "RDP");
/** 当前协议下可选通道 */
const channelOptions = computed(() =>
  remoteModes.filter(m => m.value !== "DIRECT" || directSupported.value),
);

// 协议切换即纠正通道，避免下拉已锁定却仍提交后端会拒绝的组合
watch(effectiveRemoteProtocol, (protocol) => {
  if (protocol === "RDP") {
    form.value.serverHostRemoteMode = "GUACD";
  } else if (form.value.serverHostRemoteMode === "DIRECT" && !DIRECT_SUPPORTED.includes(protocol)) {
    form.value.serverHostRemoteMode = "GUACD";
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
    serverHostOsType: "LINUX", serverHostSshEnabled: 1, serverHostCollectMode: "AGENT",
    msServerGroupId: null, serverHostTags: "", serverHostDescription: "",
    serverHostCode: "",
    // 采集（开关用 1/0 number，与后端一致）
    serverHostCollectEnabled: 1, serverHostCollectInterval: 15,
    serverHostOnlineEnabled: 1, serverHostOnlineInterval: 60,
    // 远控
    serverHostRemoteEnabled: 1, serverHostRemoteProtocol: "", serverHostRemoteMode: "GUACD", serverHostRemotePort: null, serverHostVncPassword: "",
    serverHostAgentEnabled: 0, serverHostDelayEnabled: 1, serverHostDelayInterval: 60,
  };
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
  // 远控配置归一：协议留空=按平台推断，不支持直连的协议回落 guacd，非 VNC 不存口令
  const remoteProtocol = (form.value.serverHostRemoteProtocol || "").toUpperCase() || null;
  form.value.serverHostRemoteProtocol = remoteProtocol;
  if (effectiveRemoteProtocol.value === "RDP"
    || (form.value.serverHostRemoteMode === "DIRECT" && !directSupported.value)) {
    form.value.serverHostRemoteMode = "GUACD";
  }
  if (!form.value.serverHostRemoteMode) form.value.serverHostRemoteMode = "GUACD";
  if (remoteProtocol && remoteProtocol !== "VNC") form.value.serverHostVncPassword = null;
  if (form.value.serverHostRemotePort === 0) form.value.serverHostRemotePort = null;
  // 注入认证凭据（瞬态字段，后端不落库，用于 SSH 连接建立）
  if (formAuthMethod.value === "PASSWORD") {
    form.value.serverHostAccount = formAccount.value || null;
    form.value.serverHostPassword = formPassword.value || null;
    form.value.serverHostPrivateKey = null;
  } else if (formAuthMethod.value === "PUBLIC_KEY") {
    form.value.serverHostAccount = formAccount.value || null;
    form.value.serverHostPassword = null;
    form.value.serverHostPrivateKey = formPrivateKey.value || null;
  } else {
    form.value.serverHostAccount = null;
    form.value.serverHostPassword = null;
    form.value.serverHostPrivateKey = null;
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
    if (!form.value.serverHostRemoteMode) form.value.serverHostRemoteMode = "GUACD";
    if (!form.value.serverHostCollectMode) form.value.serverHostCollectMode = "AGENT";
    tagsText.value = splitTags(form.value.serverHostTags).join(", ");
    formAuthMethod.value = "IDENTITY";
    formAccount.value = "";
    formPassword.value = "";
    formPrivateKey.value = "";
    formIdentityChanged.value = false;
    formIdentityId.value = null;
    hostBoundIdentities.value = [];
    // 并行请求详情 + 已绑定身份，返回后回填（弹窗已先显示，用户可立即看到基础信息）
    void Promise.all([
      getHost(props.host.id!).catch(() => props.host),
      listBoundIdentities(props.host.id!).catch(() => []),
    ]).then(([full, bound]) => {
      if (!props.modelValue) return; // 弹窗已关闭则丢弃回填
      form.value = { ...(form.value as any), ...((full as any) ?? {}) };
      tagsText.value = splitTags(form.value.serverHostTags).join(", ");
      const bindList = Array.isArray(bound) ? bound : [];
      if (formIdentityId.value == null && bindList.length > 0) {
        formIdentityId.value = bindList[0];
      }
      hostBoundIdentities.value = bindList;
      // 本机：详情回填后再次锁定首选网卡 IP（覆盖库中可能残留的回环地址）
      if (isLocalCollect.value) {
        form.value.serverHostRemoteProtocol = "VNC";
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
    <ReForm :model="form" label-position="top" class="form-vertical">
      <div class="form-grid">
        <!-- ─── 基本信息 ─── -->
        <div class="form-section full">基本信息</div>
        <!-- 粘贴 ssh 命令一键拆分：运维给的通常只有一行命令，手工拆地址/端口/账号容易填错 -->
        <ReFormItem label="从 SSH 命令填充" class="col-span-2">
          <div class="ssh-cmd">
            <ReInput
              v-model="sshCommandText"
              class="ssh-cmd__input"
              placeholder="粘贴 ssh 命令，如 ssh -p 2222 user@ssh.example.com"
              clearable
              @keyup.enter="fillFromSshCommand"
            />
            <ReButton type="primary" :show-text="true" @click="fillFromSshCommand">识别</ReButton>
          </div>
          <div class="ssh-cmd__hint">
            支持 <code>ssh -p 端口 账号@地址</code> 与 <code>ssh://账号@地址:端口</code>，识别后自动填下面三项
          </div>
        </ReFormItem>
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
            <ReInput v-model="formAccount" placeholder="如 root / ubuntu" style="width:100%" />
          </ReFormItem>
          <ReFormItem label="登录密码" class="col-span-2">
            <ReInput v-model="formPassword" type="password" show-password placeholder="SSH 口令" style="width:100%" />
          </ReFormItem>
        </template>
        <template v-if="formAuthMethod === 'PUBLIC_KEY'">
          <ReFormItem label="登录账号">
            <ReInput v-model="formAccount" placeholder="如 root / ubuntu" style="width:100%" />
          </ReFormItem>
          <ReFormItem label="SSH 私钥" class="col-span-2">
            <ReInput v-model="formPrivateKey" type="textarea" :rows="3" placeholder="粘贴 PEM 格式私钥内容" style="width:100%" />
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
          <ReSelect v-model="form.serverHostCollectMode" style="width:100%" :options="collectModeOptions" />
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
              :disabled="!channelEditable"
              :options="channelOptions"
            />
          </ReFormItem>
          <ReFormItem label="远控端口">
            <ReInputNumber v-model="form.serverHostRemotePort" :min="1" :max="65535" :placeholder="remotePortPlaceholder" style="width:100%" />
          </ReFormItem>
          <ReFormItem v-if="effectiveRemoteProtocol === 'VNC'" label="VNC 密码">
            <ReInput v-model="form.serverHostVncPassword" type="password" show-password placeholder="VNC 服务端口令" style="width:100%" />
          </ReFormItem>
          <ReFormItem class="col-span-2" label=" ">
            <span class="remote-tip">
              Guacd 中转：网页端经 guacd 渲染；平台直连：由平台自研客户端连接（当前仅 SSH、VNC）；无需通道：平台不做任何中转，网页端只显示本机客户端的连接地址，SSH 用系统终端、VNC 用本机客户端。RDP 必须经 guacd 中转。端口留空按协议默认（SSH 22 / RDP 3389 / VNC 5900）。
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

/* SSH 命令一键填充 */
.ssh-cmd {
  display: flex;
  gap: 8px;
  width: 100%;
}

.ssh-cmd__input {
  flex: 1;
  min-width: 0;
}

.ssh-cmd__hint {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary, #909399);
}

.ssh-cmd__hint code {
  padding: 1px 4px;
  font-family: var(--el-font-family-mono, ui-monospace, monospace);
  font-size: 11.5px;
  background: var(--el-fill-color-light);
  border-radius: 3px;
}
</style>

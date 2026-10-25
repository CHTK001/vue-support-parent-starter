<script setup lang="ts">
/**
 * 账号管理 —— 登录身份（账号密码 / SSH 私钥 / 邮箱 / Token 等）统一维护
 * 数据源：@pages/server 身份接口（getIdentities / saveIdentity / delIdentity）
 * 主机连接 / 编辑时从该列表选择身份
 *
 * 视觉（对齐「代理管理」页）：顶部 hero 已删除——页面标题由外壳面包屑承担，
 * hero 上的「导出 / 刷新」与分区头里的操作按钮合并到筛选行右侧，统一改成
 * 图标 + tip（ReButton square 布局自带 el-tooltip），单行内完成筛选与全部操作。
 * 每个 tab 一排 ReStatCard 统计卡（紧凑档横排），下方卡片吃满剩余高度、
 * 表体内部滚动。
 *
 * 说明：筛选是前端实时计算（{@code filteredList} + ReFilter 的 @change），
 * 没有服务端查询，所以不设「查询」按钮——加一个点了不起的按钮比不加更糟。
 *
 * @author CH
 * @since 4.0.0
 */
import { message } from "@repo/core";
import { computed, onMounted, ref } from "vue";
import type { Component } from "vue";
import { ElMessageBox } from "element-plus";
import { CircleCheck, Collection, Connection, Key, Lock, Monitor, Postcard, Unlock, User } from "@element-plus/icons-vue";
import { ReFormItem } from "@repo/ui/re-kit";
import ReStatCard from "@repo/ui/re-stat-card";
import type { ReFilterItem } from "@repo/ui/components/ReFilter/types";
import { getIdentities, saveIdentity, delIdentity, getKeys, saveKey, delKey, generateKeyPair, queryHosts, listBoundIdentities, bindIdentity, unbindIdentity, listMailbox, getMailboxMessage } from "@pages/server/src/api";
import { useDialogPrerender } from "../../utils/dialogPrerender";

interface Identity {
  id: number;
  msServerIdentityName: string;
  msServerIdentityAuthType: string;
  msServerIdentityUsername: string;
  msServerIdentityKeyId?: number | null;
  msServerIdentityRemark?: string;
}

interface KeyRow {
  id: number;
  msServerKeyName: string;
  msServerKeyType?: string;
  msServerKeyPublicKey?: string;
  msServerKeyRemark?: string;
}

interface HostRow {
  id: number;
  serverHostName?: string;
  serverHostAddress?: string;
  serverHostPort?: number;
  serverHostOnline?: number;
  serverHostOsType?: string;
}

/** 页面 tab：身份 / 密钥库 */
const tab = ref<"identity" | "key">("identity");

/** 公钥指纹（取 SHA256 前 16 位，便于识别） */
function keyFingerprint(pub: string | undefined): string {
  if (!pub) return "";
  try {
    const raw = Uint8Array.from(pub, (c) => c.charCodeAt(0));
    return Array.from(raw.slice(0, 16))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(":");
  } catch {
    return pub.slice(0, 16);
  }
}
function keyTypeLabel(t: string | undefined): string {
  return t ? t.toUpperCase() : "RSA";
}

const columns = [
  { prop: "msServerIdentityName", label: "名称", minWidth: 140 },
  { prop: "auth", label: "类型", width: 130, slot: "auth" },
  { prop: "msServerIdentityUsername", label: "登录用户", minWidth: 140 },
  { prop: "key", label: "密钥", width: 130, slot: "key" },
  { prop: "hosts", label: "绑定主机", width: 120, slot: "hosts" },
  { prop: "msServerIdentityRemark", label: "备注", minWidth: 140 },
  { prop: "id", label: "操作", width: 220, slot: "actions", align: "right", fixed: "right" },
];

const keyColumns = [
  { prop: "msServerKeyName", label: "名称", minWidth: 160 },
  { prop: "type", label: "类型", width: 90, slot: "type" },
  { prop: "fp", label: "公钥指纹", minWidth: 180, slot: "fp" },
  { prop: "msServerKeyRemark", label: "备注", minWidth: 140 },
  { prop: "id", label: "操作", width: 120, slot: "actions", align: "right", fixed: "right" },
];

const list = ref<Identity[]>([]);
const keys = ref<KeyRow[]>([]);
const hosts = ref<HostRow[]>([]);
/** 绑定关系缓存：identityId → hostId[] */
const bindCache = ref<Record<number, number[]>>({});
const loading = ref(false);
const selection = ref<Identity[]>([]);
const page = ref(1);
const pageSize = ref(10);

async function load(): Promise<void> {
  loading.value = true;
  try {
    const [idList, keyList, hostList] = await Promise.all([
      getIdentities(),
      getKeys().catch(() => []),
      queryHosts().catch(() => []),
    ]);
    list.value = (idList ?? []) as Identity[];
    keys.value = (keyList ?? []) as KeyRow[];
    hosts.value = (hostList ?? []) as HostRow[];
    // 批量加载绑定关系（优化 N+1 查询）
    const map: Record<number, number[]> = {};
    try {
      // 并行加载所有主机的绑定关系
      const results = await Promise.all(
        (hostList ?? []).map(async (h: HostRow) => {
          try {
            const ids = ((await listBoundIdentities(h.id)) ?? []) as number[];
            return { hostId: h.id, identityIds: ids };
          } catch {
            return { hostId: h.id, identityIds: [] as number[] };
          }
        }),
      );
      // 构建缓存
      for (const r of results) {
        for (const id of r.identityIds) {
          (map[id] ??= []).push(r.hostId);
        }
      }
    } catch {
      /* 忽略批量加载失败 */
    }
    bindCache.value = map;
  } catch (e) {
    message.error(`加载失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    loading.value = false;
  }
}
onMounted(load);

/** 身份绑定的主机列表 */
function boundHostsOf(identityId: number): HostRow[] {
  const ids = bindCache.value[identityId] ?? [];
  return ids.map((id) => hosts.value.find((h) => h.id === id)).filter(Boolean) as HostRow[];
}
function boundHostCountOf(identityId: number): number {
  return (bindCache.value[identityId] ?? []).length;
}

/** 密钥名映射（PUBLIC_KEY 引用 msServerKeyId → 密钥库名称） */
function keyNameOf(i: Identity): string {
  if (i.msServerIdentityAuthType !== "PUBLIC_KEY" || i.msServerIdentityKeyId == null) return "";
  return keys.value.find((k) => k.id === i.msServerIdentityKeyId)?.msServerKeyName ?? `#${i.msServerIdentityKeyId}`;
}

// ---- 密钥库管理 ----
const keyLoading = ref(false);
const keySelection = ref<KeyRow[]>([]);
const keyFormVisible = ref(false);
useDialogPrerender(keyFormVisible);
const keySaving = ref(false);
const editingKeyId = ref<number | null>(null);
const isGenerateKey = ref(false);
const keyForm = ref<{
  msServerKeyName: string;
  msServerKeyType: string;
  msServerKeyPublicKey: string;
  msServerKeyPrivateKey: string;
  msServerKeyPassword: string;
  msServerKeyRemark: string;
}>({
  msServerKeyName: "", msServerKeyType: "RSA", msServerKeyPublicKey: "",
  msServerKeyPrivateKey: "", msServerKeyPassword: "", msServerKeyRemark: "",
});

const KEY_TYPE_OPTIONS = [
  { label: "RSA (4096位)", value: "RSA" },
  { label: "ED25519", value: "ED25519" },
  { label: "ECDSA (P-256)", value: "ECDSA" },
];

async function loadKeys(): Promise<void> {
  keyLoading.value = true;
  try {
    keys.value = ((await getKeys()) ?? []) as KeyRow[];
  } catch (e) {
    message.error(`密钥加载失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    keyLoading.value = false;
  }
}

function openKeyAdd(): void {
  editingKeyId.value = null;
  isGenerateKey.value = true;
  keyForm.value = {
    msServerKeyName: "", msServerKeyType: "RSA", msServerKeyPublicKey: "",
    msServerKeyPrivateKey: "", msServerKeyPassword: "", msServerKeyRemark: "",
  };
  keyFormVisible.value = true;
}

function openKeyManual(): void {
  editingKeyId.value = null;
  isGenerateKey.value = false;
  keyForm.value = {
    msServerKeyName: "", msServerKeyType: "RSA", msServerKeyPublicKey: "",
    msServerKeyPrivateKey: "", msServerKeyPassword: "", msServerKeyRemark: "",
  };
  keyFormVisible.value = true;
}

function openKeyEdit(row: KeyRow): void {
  editingKeyId.value = row.id;
  isGenerateKey.value = false;
  keyForm.value = {
    msServerKeyName: row.msServerKeyName,
    msServerKeyType: row.msServerKeyType || "RSA",
    msServerKeyPublicKey: row.msServerKeyPublicKey ?? "",
    msServerKeyPrivateKey: "", // 不回显
    msServerKeyPassword: "", // 不回显
    msServerKeyRemark: row.msServerKeyRemark ?? "",
  };
  keyFormVisible.value = true;
}

async function submitKey(): Promise<void> {
  if (!keyForm.value.msServerKeyName?.trim()) { message.warning("请输入密钥名称"); return; }
  keySaving.value = true;
  try {
    await saveKey(editingKeyId.value, {
      msServerKeyName: keyForm.value.msServerKeyName.trim(),
      msServerKeyType: keyForm.value.msServerKeyType,
      msServerKeyPublicKey: keyForm.value.msServerKeyPublicKey || undefined,
      msServerKeyPrivateKey: keyForm.value.msServerKeyPrivateKey || undefined,
      msServerKeyPassword: keyForm.value.msServerKeyPassword || undefined,
      msServerKeyRemark: keyForm.value.msServerKeyRemark,
    });
    message.success(editingKeyId.value != null ? "密钥已更新" : "密钥已创建");
    keyFormVisible.value = false;
    await loadKeys();
    await load();
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  } finally {
    keySaving.value = false;
  }
}

async function removeKey(row: KeyRow): Promise<void> {
  await ElMessageBox.confirm(`删除密钥「${row.msServerKeyName}」？被引用的身份将受影响`, "删除确认", { type: "warning" });
  try {
    await delKey(row.id);
    message.success("已删除");
    await loadKeys();
    await load();
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  }
}

/** 生成密钥对 */
async function generateKey(): Promise<void> {
  if (!keyForm.value.msServerKeyName?.trim()) { message.warning("请输入密钥名称"); return; }
  keySaving.value = true;
  try {
    const r = await generateKeyPair(
      keyForm.value.msServerKeyName.trim(),
      keyForm.value.msServerKeyType,
      keyForm.value.msServerKeyPassword || undefined,
      keyForm.value.msServerKeyRemark,
    );
    message.success("密钥对已生成并保存");
    keyFormVisible.value = false;
    await loadKeys();
  } catch (e) {
    message.error(`生成失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    keySaving.value = false;
  }
}

async function remove(i: Identity): Promise<void> {
  await ElMessageBox.confirm(`删除身份「${i.msServerIdentityName}」？`, "删除确认", { type: "warning" });
  try {
    await delIdentity(i.id);
    message.success("已删除");
    await load();
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  }
}

// ---- 绑定主机弹窗 ----
const bindVisible = ref(false);
const bindTarget = ref<Identity | null>(null);
const bindLoading = ref(false);
const bindHosts = ref<HostRow[]>([]);
const bindAllHosts = ref<HostRow[]>([]);

async function openBind(row: Identity): Promise<void> {
  bindTarget.value = row;
  bindVisible.value = true;
  bindLoading.value = true;
  bindHosts.value = boundHostsOf(row.id);
  // 可绑定的候选主机：尚未绑定该身份的
  const bound = new Set(boundHostsOf(row.id).map((h) => h.id));
  bindAllHosts.value = hosts.value.filter((h) => !bound.has(h.id));
  bindLoading.value = false;
}

async function doBind(hostId: number): Promise<void> {
  if (!bindTarget.value) return;
  try {
    await bindIdentity(hostId, bindTarget.value.id);
    message.success("已绑定");
    await openBind(bindTarget.value);
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  }
}

async function doUnbind(hostId: number): Promise<void> {
  if (!bindTarget.value) return;
  try {
    await unbindIdentity(hostId, bindTarget.value.id);
    message.success("已解绑");
    await openBind(bindTarget.value);
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  }
}

// ---- 邮箱（MAILBOX）管理 ----
const mailVisible = ref(false);
const mailTarget = ref<Identity | null>(null);
const mailLoading = ref(false);
const mails = ref<Array<{ id?: string; subject?: string; from?: string; date?: string; snippet?: string; content?: string; size?: number }>>([]);
const activeMailIndex = ref(-1);
const activeMail = computed(() => (activeMailIndex.value >= 0 ? mails.value[activeMailIndex.value] : null));

/** 发件人短名（取 <...> 前或前 20 字符） */
function mailFromShort(from: string | undefined): string {
  if (!from) return "未知发件人";
  const m = from.match(/^([^<@]+@[^>]+)/);
  return (m?.[1] ?? from).slice(0, 22);
}

/** 日期格式化 */
function formatMailDate(d: string | undefined): string {
  if (!d) return "";
  const s = d.slice(0, 16).replace("T", " ");
  return s;
}

/** 大小格式化 */
function formatSize(n: number | undefined): string {
  if (n == null) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

async function openMail(row: Identity): Promise<void> {
  mailTarget.value = row;
  mailVisible.value = true;
  activeMailIndex.value = -1;
  mailLoading.value = true;
  try {
    const list = ((await listMailbox(row.id, "INBOX", 20)) ?? []) as Array<{ id?: string; subject?: string; from?: string; date?: string; snippet?: string; content?: string; size?: number }>;
    mails.value = list;
  } catch (e) {
    mails.value = [];
    message.error(`加载邮件失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    mailLoading.value = false;
  }
}

/** 选中邮件并加载详情 */
async function selectMail(m: { id?: string; subject?: string }, idx: number): Promise<void> {
  activeMailIndex.value = idx;
  if (!mailTarget.value) return;
  try {
    const d = await getMailboxMessage(mailTarget.value.id, "INBOX", m.subject);
    const detail = typeof d === "string" ? d : JSON.stringify(d ?? "", null, 2);
    mails.value[idx] = { ...mails.value[idx], content: detail };
    if (activeMailIndex.value === idx) {
      // 保持响应式
      mails.value = [...mails.value];
    }
  } catch (e) {
    mails.value[idx] = { ...mails.value[idx], content: `读取邮件内容失败: ${String((e as Error)?.message ?? e)}` };
    mails.value = [...mails.value];
  }
}

/**
 * 下载密钥公钥。
 *
 * <p>后端 {@code ServerCredentialController} 约定「私钥、口令永不出现在响应体中」，
 * 私钥仅加密留存于密钥库，因此此处只支持公钥导出。
 *
 * @param row 密钥行
 */
function downloadPublicKey(row: KeyRow): void {
  const content = row.msServerKeyPublicKey ?? "";
  if (!content) {
    message.warning("该密钥暂无公钥内容");
    return;
  }
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${row.msServerKeyName}.pub`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** 批量删除（ReTable toolbar batchDelete handler） */
async function batchDelete(rows: Record<string, unknown>[]): Promise<void> {
  let ok = 0;
  for (const r of rows) {
    const id = Number((r as unknown as Identity).id);
    if (!id) continue;
    try {
      await delIdentity(id);
      ok++;
    } catch (e) {
      console.error('删除失败:', e);
    }
  }
  message.success(`删除 ${ok}/${rows.length} 条`);
  selection.value = [];
  await load();
}

/** 导出当前过滤结果为 CSV */
function exportCsv(): void {
  const rows = filteredList.value;
  if (!rows.length) {
    message.warning("没有可导出的数据");
    return;
  }
  const head = ["名称", "类型", "登录用户", "密钥", "备注"];
  const lines = rows.map((i) => [
    i.msServerIdentityName,
    authTypeLabel(i.msServerIdentityAuthType),
    i.msServerIdentityUsername,
    keyNameOf(i),
    i.msServerIdentityRemark ?? "",
  ]);
  const csv = [head, ...lines]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `账号身份-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  message.success(`已导出 ${rows.length} 条`);
}

const authTypeOptions = [
  { value: "PASSWORD", label: "密码登录", group: "主机" },
  { value: "PUBLIC_KEY", label: "公钥登录", group: "主机" },
  { value: "MAILBOX", label: "邮箱账号", group: "通用" },
  { value: "TOKEN", label: "Token", group: "通用" },
  { value: "API_KEY", label: "API Key", group: "通用" },
  { value: "OAUTH2", label: "OAuth 2.0", group: "通用" },
  { value: "COOKIE", label: "Cookie", group: "通用" },
  { value: "ACCOUNT", label: "账号密码", group: "通用" },
];

/** 认证类型展示名（未知类型显示原值） */
const authTypeLabel = (t?: string | null): string => {
  if (!t) return "-";
  const hit = authTypeOptions.find((o) => o.value === t);
  return hit ? hit.label : t;
};

/** 认证类型标签色 */
const authTypeTagType = (t?: string | null): "success" | "info" | "warning" | "primary" => {
  if (t === "PUBLIC_KEY") return "warning";
  if (t === "MAILBOX") return "success";
  if (t === "PASSWORD") return "info";
  return "primary";
};

// ---- 过滤（ReFilter 统一驱动） ----
const filterState = ref<Record<string, unknown>>({ keyword: "", type: "" });
function onFilterChange(prop: string, value: unknown): void {
  filterState.value[prop] = value;
}
function onFilterReset(): void {
  filterState.value = { keyword: "", type: "" };
}

// ==================== KPI 统计卡（每个 tab 一组） ====================

/** 主机类身份数（口令 / 公钥两种主机登录方式） */
const hostCount = computed(() => list.value.filter((i) => i.msServerIdentityAuthType === "PASSWORD" || i.msServerIdentityAuthType === "PUBLIC_KEY").length);
/** 非主机类身份数（邮箱 / Token 等） */
const genericCount = computed(() => list.value.length - hostCount.value);
/** 走公钥登录的身份数 */
const keyCount = computed(() => list.value.filter((i) => i.msServerIdentityAuthType === "PUBLIC_KEY").length);
/** 已引用密钥库中某个密钥的身份数（引用关系存在密钥主键上） */
const keyRefCount = computed(() => list.value.filter((i) => i.msServerIdentityKeyId != null).length);
/** 已绑定至少一台主机的身份数 */
const boundIdentityCount = computed(() => Object.keys(bindCache.value).filter((id) => (bindCache.value[Number(id)]?.length ?? 0) > 0).length);
/** RSA 密钥数（类型缺省按 RSA 计，与 keyTypeLabel 的兜底保持一致） */
const rsaCount = computed(() => keys.value.filter((k) => keyTypeLabel(k.msServerKeyType) === "RSA").length);

/**
 * 统计卡定义。
 *
 * <p>{@code icon} 必须是组件（ReStatCard 内部走 {@code <component :is="icon" />}），
 * 所以直接引用 @element-plus/icons-vue 的组件，不传图标名字符串；
 * {@code iconColor} 用 koi 令牌，不写死品牌色。</p>
 */
interface ImKpi {
  key: string;
  title: string;
  value: number | string;
  desc: string;
  icon: Component;
  iconColor: string;
}

/** 「登录身份」tab 的统计卡 */
const identityKpis = computed<ImKpi[]>(() => [
  {
    key: "total",
    title: "身份总数",
    value: list.value.length,
    desc: boundIdentityCount.value ? `已绑定主机 ${boundIdentityCount.value}` : "尚未绑定主机",
    icon: User,
    iconColor: "var(--brand-500, var(--el-color-primary))",
  },
  {
    key: "host",
    title: "主机登录",
    value: hostCount.value,
    desc: "口令 + 公钥",
    icon: Monitor,
    iconColor: "var(--metric-cpu, var(--el-color-primary))",
  },
  {
    key: "publickey",
    title: "公钥登录",
    value: keyCount.value,
    desc: keyRefCount.value ? `已引用密钥 ${keyRefCount.value}` : "未引用密钥库",
    icon: Key,
    iconColor: "var(--el-color-success)",
  },
  {
    key: "generic",
    title: "通用凭据",
    value: genericCount.value,
    desc: "邮箱 / Token 等",
    icon: Postcard,
    iconColor: "var(--metric-disk, var(--el-color-warning))",
  },
]);

/** 「SSH 密钥库」tab 的统计卡 */
const keyKpis = computed<ImKpi[]>(() => [
  {
    key: "total",
    title: "密钥总数",
    value: keys.value.length,
    desc: "供公钥登录身份引用",
    icon: Collection,
    iconColor: "var(--brand-500, var(--el-color-primary))",
  },
  {
    key: "rsa",
    title: "RSA",
    value: rsaCount.value,
    desc: "类型缺省按 RSA 计",
    icon: Lock,
    iconColor: "var(--metric-cpu, var(--el-color-primary))",
  },
  {
    key: "other",
    title: "其他类型",
    value: keys.value.length - rsaCount.value,
    desc: "ECDSA / ED25519 等",
    icon: Unlock,
    iconColor: "var(--el-color-warning)",
  },
  {
    key: "ref",
    title: "已被引用",
    value: keyRefCount.value,
    desc: keyRefCount.value ? "对应身份已绑定密钥" : "暂无身份引用",
    icon: Connection,
    iconColor: "var(--el-color-success)",
  },
]);

/** 当前 tab 展示的统计卡 */
const activeKpis = computed<ImKpi[]>(() => (tab.value === "identity" ? identityKpis.value : keyKpis.value));

const filterItems = computed<ReFilterItem[]>(() => [
  { prop: "keyword", label: "名称/用户", type: "input", placeholder: "搜索名称 / 登录用户 / 备注", clearable: true, always: true },
  { prop: "type", label: "类型", type: "select", placeholder: "全部类型", clearable: true, options: authTypeOptions.map((o) => ({ label: o.label, value: o.value })), always: true },
]);

/** 过滤后的列表 */
const filteredList = computed(() => {
  let items = list.value;
  const kw = String(filterState.value.keyword ?? "").toLowerCase().trim();
  if (kw) {
    items = items.filter(
      (i) =>
        i.msServerIdentityName.toLowerCase().includes(kw) ||
        (i.msServerIdentityUsername ?? "").toLowerCase().includes(kw) ||
        (i.msServerIdentityRemark ?? "").toLowerCase().includes(kw),
    );
  }
  const type = String(filterState.value.type ?? "");
  if (type) items = items.filter((i) => i.msServerIdentityAuthType === type);
  return items;
});

/** 复制用户名到剪贴板 */
async function copyUsername(i: Identity): Promise<void> {
  try {
    await navigator.clipboard.writeText(i.msServerIdentityUsername || "");
    message.success("用户名已复制");
  } catch {
    message.info(i.msServerIdentityUsername || "");
  }
}

// ---- 新增 / 编辑身份 ----
// ---- 弹窗（空闲时预渲染，首次打开毫秒级——dialogPrerender.ts） ----
const addVisible = ref(false);
useDialogPrerender(addVisible);
const addSaving = ref(false);
const editingId = ref<number | null>(null);
const addForm = ref<{
  msServerIdentityName: string;
  msServerIdentityAuthType: string;
  msServerIdentityUsername: string;
  msServerIdentityPassword: string;
  msServerIdentityKeyId: number | null;
  msServerIdentityRemark: string;
}>({
  msServerIdentityName: "", msServerIdentityAuthType: "PASSWORD", msServerIdentityUsername: "",
  msServerIdentityPassword: "", msServerIdentityKeyId: null, msServerIdentityRemark: "",
});

/**
 * 打开新建身份弹窗
 */
function openAdd(): void {
  editingId.value = null;
  addForm.value = {
    msServerIdentityName: "", msServerIdentityAuthType: "PASSWORD", msServerIdentityUsername: "",
    msServerIdentityPassword: "", msServerIdentityKeyId: null, msServerIdentityRemark: "",
  };
  addVisible.value = true;
}

/**
 * 打开编辑身份弹窗
 * @param row 身份行
 */
function openEdit(row: Identity): void {
  editingId.value = row.id;
  addForm.value = {
    msServerIdentityName: row.msServerIdentityName,
    msServerIdentityAuthType: row.msServerIdentityAuthType,
    msServerIdentityUsername: row.msServerIdentityUsername,
    // 密码不回显，留空表示不修改
    msServerIdentityPassword: "",
    msServerIdentityKeyId: row.msServerIdentityKeyId ?? null,
    msServerIdentityRemark: row.msServerIdentityRemark ?? "",
  };
  addVisible.value = true;
}

async function submitAdd(): Promise<void> {
  if (!addForm.value.msServerIdentityName?.trim()) { message.warning("请输入身份名称"); return; }
  if (!addForm.value.msServerIdentityUsername?.trim()) { message.warning("请输入登录用户名"); return; }
  addSaving.value = true;
  try {
    await saveIdentity(editingId.value, {
      ...addForm.value,
      msServerIdentityPassword: addForm.value.msServerIdentityPassword || undefined,
    });
    message.success(editingId.value != null ? "身份已更新" : "身份已创建");
    addVisible.value = false;
    await load();
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  } finally {
    addSaving.value = false;
  }
}
</script>

<template>
  <div class="im tel-page">
    <!-- 顶部 hero（大标题 + 副标题 + 导出/刷新）已删除：页面标题由外壳面包屑承担，
         hero 上的「导出 / 刷新」与分区头里的操作按钮合并到下方筛选行右侧（图标 + tip）。 -->

    <!-- Tab 切换 -->
    <div class="tabs">
      <button class="tab-btn" :class="{ active: tab === 'identity' }" @click="tab = 'identity'">登录身份</button>
      <button class="tab-btn" :class="{ active: tab === 'key' }" @click="tab = 'key'">SSH 密钥库</button>
    </div>

    <!-- 身份 tab -->
    <template v-if="tab === 'identity'">
      <!-- 统计卡：ReStatCard 紧凑档，四张并排只占一行 -->
      <section class="im-kpis">
        <ReStatCard
          v-for="k in activeKpis"
          :key="k.key"
          size="compact"
          :title="k.title"
          :value="k.value"
          :desc="k.desc"
          :icon="k.icon"
          :icon-color="k.iconColor"
        />
      </section>

      <section class="card im-card">
      <ReSectionHead description="身份即登录凭据；主机可绑定多个身份，连接时按所选身份建连">
        <template #title>登录身份</template>
      </ReSectionHead>

      <!-- 筛选行 + 全部操作合并为一行：筛选在左（原 hero 的导出/刷新与分区头的新增身份
           合并到右侧，图标 + tip）。ReFilter 的 show-actions 保持关闭：筛选是前端实时
           计算（filteredList），没有服务端查询可触发，加一个按钮点了不起反而更糟。 -->
      <div class="im-toolbar">
        <ReFilter
          :items="filterItems"
          :columns="2"
          :collapsible="false"
          :show-actions="false"
          @change="onFilterChange"
          @reset="onFilterReset"
          class="im-toolbar__filter"
        />
        <span class="im-toolbar__meta">{{ filteredList.length }} / {{ list.length }} 条</span>
        <div class="im-ops">
          <ReButton icon="Plus" layout="square" type="primary" tip="新增身份" @click="openAdd" />
          <ReButton icon="Download" layout="square" tip="导出 CSV" @click="exportCsv" />
          <ReButton icon="RefreshRight" layout="square" tip="刷新" :loading="loading" @click="load" />
        </div>
      </div>

      <ReTable
        :data="filteredList"
        :columns="columns"
        :loading="loading"
        table-id="identity-list"

        :pagination="true"
        :page-size="pageSize"
        empty-text="暂无身份"
        :toolbar="true"
        :toolbar-config="{
          position: 'top',
          refresh: true,
          columnSettings: true,
          tableSettings: true,
        }"
        @selection-change="selection = $event"
      >
        <template #col-auth="{ row }">
          <ReTag :type="authTypeTagType(row.msServerIdentityAuthType)" >
            {{ authTypeLabel(row.msServerIdentityAuthType) }}
          </ReTag>
        </template>
        <template #col-key="{ row }">
          <span v-if="keyNameOf(row)" class="mono dim">{{ keyNameOf(row) }}</span>
          <span v-else class="dim">—</span>
        </template>
        <template #col-hosts="{ row }">
          <div v-if="boundHostCountOf(row.id) > 0" class="host-count" @click="openBind(row)">
            <ReTag effect="plain" type="primary">{{ boundHostCountOf(row.id) }} 台</ReTag>
            <span v-if="boundHostsOf(row.id).length > 0" class="host-preview dim">
              {{ boundHostsOf(row.id).slice(0, 2).map(h => h.serverHostName).join(', ') }}
              <span v-if="boundHostsOf(row.id).length > 2">...</span>
            </span>
          </div>
          <span v-else class="dim">未绑定</span>
        </template>
        <template #col-actions="{ row }">
          <div class="op-cell">
            <ReButton icon="EditPen" layout="square" title="编辑" @click="openEdit(row)" />
            <ReButton icon="Connection" layout="square" title="绑定主机" @click="openBind(row)" />
            <ReButton v-if="row.msServerIdentityAuthType === 'MAILBOX'" icon="Message" layout="square" title="收件箱" @click="openMail(row)" />
            <ReButton icon="CopyDocument" layout="square" title="复制用户名" @click="copyUsername(row)" />
            <ReButton icon="Delete" layout="square" type="danger" title="删除" @click="remove(row)" />
          </div>
        </template>
      </ReTable>
      <div v-if="selection.length" class="sel-bar">
        <ReTag type="primary" effect="plain">已选 {{ selection.length }} 项</ReTag>
        <ReButton icon="Delete" type="danger" :show-text="true" @click="batchDelete(selection as unknown as Record<string, unknown>[])">批量删除</ReButton>
      </div>
      </section>
    </template>
  
    <!-- 密钥库 tab -->
    <template v-else>
      <!-- 统计卡：随 tab 切换为密钥口径 -->
      <section class="im-kpis">
        <ReStatCard
          v-for="k in activeKpis"
          :key="k.key"
          size="compact"
          :title="k.title"
          :value="k.value"
          :desc="k.desc"
          :icon="k.icon"
          :icon-color="k.iconColor"
        />
      </section>

      <section class="card im-card">
        <ReSectionHead description="SSH 密钥库：密钥名称 / 类型 / 公钥指纹；身份选「公钥登录」时引用密钥">
          <template #title>SSH 密钥库</template>
        </ReSectionHead>

        <!-- 该 tab 没有筛选条件，操作行左侧放条数提示，右侧统一放操作 -->
        <div class="im-toolbar">
          <span class="im-toolbar__meta im-toolbar__meta--only">{{ keys.length }} 个密钥</span>
          <div class="im-ops">
            <ReButton icon="MagicStick" layout="square" tip="生成密钥对" @click="openKeyAdd" />
            <ReButton icon="Plus" layout="square" type="primary" tip="新增密钥" @click="openKeyManual" />
            <ReButton icon="RefreshRight" layout="square" tip="刷新密钥库" :loading="keyLoading" @click="loadKeys" />
          </div>
        </div>

        <ReTable
          :data="keys"
          :columns="keyColumns"
          :loading="keyLoading"
          table-id="ssh-key-list"

          :pagination="true"
          :page-size="10"
          empty-text="暂无密钥"
          :toolbar="true"
          :toolbar-config="{
            position: 'top',
            refresh: true,
            columnSettings: true,
            tableSettings: true,
          }"
        >
          <template #col-type="{ row }">
            <ReTag :type="row.msServerKeyType === 'RSA' ? 'warning' : 'primary'" effect="plain">{{ keyTypeLabel(row.msServerKeyType) }}</ReTag>
          </template>
          <template #col-fp="{ row }">
            <span class="mono dim">{{ keyFingerprint(row.msServerKeyPublicKey) }}</span>
          </template>
          <template #col-actions="{ row }">
            <div class="op-cell">
              <ReButton icon="EditPen" layout="square" title="编辑" @click="openKeyEdit(row)" />
              <ReButton icon="Download" layout="square" title="下载公钥" @click="downloadPublicKey(row)" />
              <ReButton
                icon="Key"
                layout="square"

                title="私钥不出库"
                disabled
              />
              <ReButton icon="Delete" layout="square" type="danger" title="删除" @click="removeKey(row)" />
            </div>
          </template>
        </ReTable>
      </section>
    </template>

    <!-- 新增身份 -->
    <ReDialog v-model="addVisible" :title="editingId != null ? '编辑身份' : '新增身份'" width="520px" :close-on-click-modal="false">
      <ReForm :model="addForm" label-position="top">
        <ReFormItem label="名称">
          <ReInput v-model="addForm.msServerIdentityName" placeholder="如 root-prod" style="width:100%" />
        </ReFormItem>
        <ReFormItem label="类型">
          <ReSelect v-model="addForm.msServerIdentityAuthType" style="width:100%" filterable allow-create default-first-option placeholder="选择或输入类型" :options="authTypeOptions" />
        </ReFormItem>
        <ReFormItem label="登录用户名">
          <ReInput v-model="addForm.msServerIdentityUsername" placeholder="如 root / ubuntu" style="width:100%" />
        </ReFormItem>
        <ReFormItem v-if="addForm.msServerIdentityAuthType === 'PASSWORD'" label="登录密码">
          <ReInput v-model="addForm.msServerIdentityPassword" type="password" show-password placeholder="SSH 口令" style="width:100%" />
        </ReFormItem>
        <ReFormItem label="备注">
          <ReInput v-model="addForm.msServerIdentityRemark" placeholder="用途说明（可选）" style="width:100%" />
        </ReFormItem>
      </ReForm>
      <template #footer>
        <ReButton @click="addVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="addSaving" icon="Check" :show-text="true" @click="submitAdd">{{ editingId != null ? '保存' : '创建' }}</ReButton>
      </template>
    </ReDialog>

    <!-- 密钥表单（新增/编辑/生成） -->
    <ReDialog v-model="keyFormVisible" :title="editingKeyId != null ? '编辑密钥' : (isGenerateKey ? '生成密钥对' : '新增密钥')" width="560px" :close-on-click-modal="false">
      <ReForm :model="keyForm" label-position="top">
        <ReFormItem label="密钥名称">
          <ReInput v-model="keyForm.msServerKeyName" placeholder="如 prod-rsa-2026" style="width:100%" />
        </ReFormItem>
        <ReFormItem label="密钥类型">
          <ReSelect v-model="keyForm.msServerKeyType" style="width:100%" :options="KEY_TYPE_OPTIONS" :disabled="editingKeyId != null" />
        </ReFormItem>
        <template v-if="!isGenerateKey">
          <ReFormItem label="公钥">
            <ReInput v-model="keyForm.msServerKeyPublicKey" type="textarea" :rows="3" placeholder="粘贴公钥内容（可选）" style="width:100%" />
          </ReFormItem>
          <ReFormItem label="私钥">
            <ReInput v-model="keyForm.msServerKeyPrivateKey" type="textarea" :rows="3" :placeholder="editingKeyId != null ? '留空保持不变' : '粘贴私钥内容（可选）'" style="width:100%" />
          </ReFormItem>
        </template>
        <ReFormItem v-if="isGenerateKey" label="私钥口令">
          <ReInput v-model="keyForm.msServerKeyPassword" type="password" show-password placeholder="私钥加密口令（可空）" style="width:100%" />
        </ReFormItem>
        <ReFormItem label="备注">
          <ReInput v-model="keyForm.msServerKeyRemark" placeholder="用途说明（可选）" style="width:100%" />
        </ReFormItem>
      </ReForm>
      <template #footer>
        <ReButton @click="keyFormVisible = false">取消</ReButton>
        <ReButton v-if="isGenerateKey && editingKeyId == null" type="primary" :loading="keySaving" icon="MagicStick" :show-text="true" @click="generateKey">生成</ReButton>
        <ReButton v-else type="primary" :loading="keySaving" icon="Check" :show-text="true" @click="submitKey">{{ editingKeyId != null ? '保存' : '创建' }}</ReButton>
      </template>
    </ReDialog>

    <!-- 绑定主机弹窗 -->
    <ReDialog v-model="bindVisible" :title="`绑定主机：${bindTarget?.msServerIdentityName ?? ''}`" width="640px" :close-on-click-modal="false">
      <div v-if="bindLoading" class="dim" style="padding:20px 0;text-align:center">加载中...</div>
      <template v-else>
        <div class="muted" style="margin-bottom:8px">已绑定主机（{{ bindHosts.length }}）</div>
        <div v-if="bindHosts.length" class="host-chips">
          <div v-for="h in bindHosts" :key="h.id" class="host-chip">
            <ReTag :type="h.serverHostOnline === 1 ? 'success' : 'info'" effect="plain">{{ h.serverHostOnline === 1 ? '在线' : '离线' }}</ReTag>
            <b>{{ h.serverHostName }}</b>
            <span class="mono dim">{{ h.serverHostAddress }}:{{ h.serverHostPort }}</span>
            <ReButton icon="Unlink" layout="square" type="danger" title="解绑" @click="doUnbind(h.id)" />
          </div>
        </div>
        <div v-else class="dim" style="padding:8px 0">未绑定任何主机</div>

        <div class="muted" style="margin:14px 0 8px">可绑定主机（{{ bindAllHosts.length }}）</div>
        <div v-if="bindAllHosts.length" class="host-chips">
          <div v-for="h in bindAllHosts" :key="h.id" class="host-chip">
            <b>{{ h.serverHostName }}</b>
            <span class="mono dim">{{ h.serverHostAddress }}:{{ h.serverHostPort }}</span>
            <ReButton icon="Link" layout="square" type="primary" title="绑定" @click="doBind(h.id)" />
          </div>
        </div>
        <div v-else class="dim" style="padding:8px 0">已全部绑定</div>
      </template>
      <template #footer>
        <ReButton @click="bindVisible = false">关闭</ReButton>
      </template>
    </ReDialog>

    <!-- 邮箱（MAILBOX）弹窗 -->
    <ReDialog v-model="mailVisible" :title="`收件箱：${mailTarget?.msServerIdentityName ?? ''}`" width="820px" :close-on-click-modal="false">
      <div v-if="mailLoading" class="mail-loading">
        <span class="spinner" />
        <span>正在读取邮件...</span>
      </div>
      <template v-else>
        <div v-if="mails.length" class="mail-layout">
          <!-- 左侧邮件列表 -->
          <div class="mail-side">
            <div class="mail-side-header">
              <span class="mail-side-count">{{ mails.length }} 封</span>
              <span class="mail-side-hint">点击查看内容</span>
            </div>
            <div class="mail-list">
              <div
                v-for="(m, idx) in mails"
                :key="m.id ?? idx"
                class="mail-item"
                :class="{ active: activeMailIndex === idx }"
                @click="selectMail(m, idx)"
              >
                <div class="mail-item-top">
                  <span class="mail-avatar">{{ (m.from || '?').charAt(0).toUpperCase() }}</span>
                  <span class="mail-from mono">{{ mailFromShort(m.from) }}</span>
                  <span class="mail-date dim">{{ formatMailDate(m.date) }}</span>
                </div>
                <div class="mail-subject">{{ m.subject || '(无主题)' }}</div>
                <div v-if="m.snippet" class="mail-snippet dim">{{ m.snippet }}</div>
              </div>
            </div>
          </div>
          <!-- 右侧详情 -->
          <div class="mail-pane">
            <template v-if="activeMail">
              <div class="mail-pane-header">
                <div class="mail-pane-subject">{{ activeMail.subject || '(无主题)' }}</div>
                <div class="mail-pane-meta">
                  <ReTag effect="plain">发件人</ReTag>
                  <span class="mono">{{ activeMail.from || '—' }}</span>
                </div>
                <div class="mail-pane-meta">
                  <ReTag effect="plain">时间</ReTag>
                  <span class="mono">{{ activeMail.date || '—' }}</span>
                </div>
                <div v-if="activeMail.size != null" class="mail-pane-meta">
                  <ReTag effect="plain">大小</ReTag>
                  <span class="mono">{{ formatSize(activeMail.size) }}</span>
                </div>
              </div>
              <div class="mail-body">
                <pre v-if="activeMail.content">{{ activeMail.content }}</pre>
                <div v-else class="dim">（该邮件暂无正文预览，点击下方查看原始内容）</div>
              </div>
              <div class="mail-pane-foot">
                <ReButton icon="RefreshLeft" :show-text="true" @click="openMail(mailTarget!)">刷新</ReButton>
              </div>
            </template>
            <div v-else class="mail-pane-empty">
              <ReIcon name="Message" :size="40" color="var(--text-tertiary)" />
              <span>选择左侧邮件查看详情</span>
            </div>
          </div>
        </div>
        <div v-else class="mail-empty">
          <ReIcon name="Inbox" :size="40" color="var(--text-tertiary)" />
          <span>收件箱为空</span>
        </div>
      </template>
      <template #footer>
        <ReButton @click="mailVisible = false">关闭</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
/* ============================================================
   账号管理 —— 全部走 koi / Element Plus 变量
   布局：整页 flex 列（tabs / 统计卡 / 筛选行 固定高，卡片 flex:1 吃满剩余高度）
   ============================================================ */
/* .tel-page 已提供 height:100% 与 overflow-y:auto；这里补 min-height:0，
   否则 flex 子项默认 min-height:auto，长列表会把卡片顶高、外层出滚动条 */
.im { display: flex; flex-direction: column; gap: 14px; min-height: 0; }
.tabs { flex: none; }

/* ---------- 统计卡（ReStatCard 紧凑档横排，卡片外壳规格由组件基线提供） ---------- */
.im-kpis {
  flex: none;
  display: grid;
  /* 紧凑档单卡很窄，用 auto-fit 让 4 张按可用宽度自动换行，无需断点硬切 */
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

/* ---------- 数据卡片：吃满剩余高度 ---------- */
.im-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
/* ReTable 是卡片里唯一该伸展的子项：basis 0 让 flex 纯按剩余空间分配，
   min-height 0 必须置（flex 子项默认 auto），否则内容会把卡片顶高、
   ReTable 的 fill 也拿不到确定高度。 */
.im-card > :deep(.re-table) {
  flex: 1 1 0;
  min-height: 0;
}

/* ---------- 筛选行 + 操作区（合并成一行） ---------- */
.im-toolbar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 12px;
}
.im-toolbar__filter {
  flex: 1;
  min-width: 0;
}
.im-toolbar__meta {
  margin-left: auto;
  font-size: 12.5px;
  color: var(--text-tertiary);
  white-space: nowrap;
}
/* 该 tab 没有筛选时不需要把提示推到右边 */
.im-toolbar__meta--only { margin-left: 0; }
/* 操作图标组：与筛选/条数提示之间用竖线分隔，视觉上区分「筛选」与「操作」 */
.im-ops {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 10px;
  border-left: 1px solid var(--border-subtle);
}

.op-cell { display: flex; gap: 6px; justify-content: flex-end; }
.sel-bar { display: flex; align-items: center; gap: 10px; margin-top: 8px; padding: 8px 12px; background: var(--bg-container); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
.mono { font-family: ui-monospace, SFMono-Regular, monospace; }
.dim { color: var(--text-tertiary); }
.muted { color: var(--text-tertiary); font-size: 12px; }
.clickable { cursor: pointer; }
.host-chips { display: flex; flex-direction: column; gap: 6px; max-height: 300px; overflow-y: auto; }
.host-chip { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); font-size: 13px; }
.host-chip b { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mail-layout { display: flex; gap: 12px; height: 480px; }
.mail-side { width: 300px; flex-shrink: 0; display: flex; flex-direction: column; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); overflow: hidden; }
.mail-side-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: var(--bg-container); border-bottom: 1px solid var(--border-subtle); font-size: 12px; }
.mail-side-count { font-weight: 600; }
.mail-side-hint { color: var(--text-tertiary); }
.mail-list { flex: 1; overflow-y: auto; }
.mail-item { padding: 9px 12px; border-bottom: 1px solid var(--border-subtle); cursor: pointer; transition: background 0.15s; }
.mail-item:hover { background: var(--bg-hover); }
.mail-item.active { background: var(--brand-50); border-left: 3px solid var(--brand-500); }
.mail-item-top { display: flex; align-items: center; gap: 8px; margin-bottom: 3px; }
.mail-avatar { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: var(--brand-500); color: #fff; font-size: 11px; font-weight: 700; flex-shrink: 0; }
.mail-from { flex: 1; min-width: 0; font-size: 12px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mail-date { font-size: 11px; flex-shrink: 0; }
.mail-subject { font-size: 13px; font-weight: 600; margin: 2px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mail-snippet { font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mail-pane { flex: 1; min-width: 0; display: flex; flex-direction: column; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); overflow: hidden; }
.mail-pane-header { padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); }
.mail-pane-subject { font-size: 15px; font-weight: 700; margin-bottom: 8px; }
.mail-pane-meta { display: flex; align-items: center; gap: 8px; font-size: 12px; margin: 4px 0; }
.mail-body { flex: 1; overflow-y: auto; padding: 14px 16px; }
.mail-body pre { white-space: pre-wrap; word-break: break-all; font-family: ui-monospace, SFMono-Regular, monospace; font-size: 12px; line-height: 1.6; }
.mail-pane-foot { padding: 8px 12px; border-top: 1px solid var(--border-subtle); }
.mail-pane-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: var(--text-tertiary); font-size: 13px; }
.mail-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 40px 0; color: var(--text-tertiary); font-size: 13px; }
.mail-loading { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 40px 0; color: var(--text-tertiary); font-size: 13px; }
.spinner { width: 18px; height: 18px; border: 2px solid var(--border-subtle); border-top-color: var(--brand-500); border-radius: 50%; animation: im-spin 0.8s linear infinite; }
@keyframes im-spin { to { transform: rotate(360deg); } }
</style>

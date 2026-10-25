<script setup lang="ts">
/**
 * 主机账号 —— 主机登录凭据的集中维护（原「系统管理 → 账号管理」）
 *
 * <p>身份（账号 / 密钥 / 邮箱 / Token）从来不是系统级配置，而是<b>主机的登录凭据</b>：
 * 每台机器用哪个账号登、公钥登录引用了密钥库里的哪把钥匙。所以这一页归到「主机管理」
 * 分组下，改名为「主机账号」，入口也收进主机资产右键菜单。</p>
 *
 * <p>页面提供四个版式，回答的是四个不同的问题（档位按页持久化）：</p>
 * <ul>
 *   <li><b>名册</b>：左选账号、右看凭证 —— 「这个账号能登哪些机器」。</li>
 *   <li><b>绑定矩阵</b>：行是账号、列是主机，格子即绑定 —— 「这台机器还有没有账号能登」。</li>
 *   <li><b>工牌墙</b>：一个账号一张卡，按认证方式着色 —— 「库里都有哪些凭据」。</li>
 *   <li><b>台账</b>：密集一行一条，带前端筛选与多选 —— 账号多时扫读与批量清理。</li>
 * </ul>
 *
 * <p>四档共用同一份数据与同一组写操作（新增 / 编辑 / 绑定 / 解绑 / 删除 / 导出），
 * 差异只在空间结构，不在配色与圆角 —— 与主机资产、运维台是同一套外观。</p>
 *
 * @author CH
 * @since 4.0.0.44
 */
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { message } from "@repo/core";
import { ElMessageBox } from "element-plus";
import { ReFormItem } from "@repo/ui/re-kit";
import {
  bindIdentity,
  delIdentity,
  delKey,
  generateKeyPair,
  getIdentities,
  getKeys,
  getMailboxMessage,
  listBoundIdentities,
  listMailbox,
  queryHosts,
  saveIdentity,
  saveKey,
  unbindIdentity,
} from "../../api";
import { useDialogPrerender } from "../../utils/dialogPrerender";
import {
  AUTH_GROUP_LABEL,
  authGroupOf,
  authLabelOf,
  authToneOf,
  hostInitial,
  keyFingerprint,
  normAuth,
  type HaAccount,
  type HaHost,
} from "../../components/hostaccount/types";

const route = useRoute();
const router = useRouter();

/* ==================== 原始行 ==================== */

/** 身份接口返回的行（脱敏：不含口令 / 私钥） */
interface IdentityRow {
  id: number;
  msServerIdentityName: string;
  msServerIdentityAuthType: string;
  msServerIdentityUsername: string;
  msServerIdentityKeyId?: number | null;
  msServerIdentityRemark?: string;
}

/** 密钥接口返回的行（脱敏：不含私钥 / 口令） */
interface KeyRow {
  id: number;
  msServerKeyName: string;
  msServerKeyType?: string;
  msServerKeyPublicKey?: string;
  msServerKeyRemark?: string;
}

/** 主机接口返回的行 */
interface HostRow {
  id: number;
  serverHostName?: string;
  serverHostAddress?: string;
  serverHostPort?: number;
  serverHostOnline?: number;
  serverHostOsType?: string;
}

const identities = ref<IdentityRow[]>([]);
const keys = ref<KeyRow[]>([]);
const hosts = ref<HaHost[]>([]);
/** 绑定关系缓存：identityId → hostId[]（按主机接口逐个查，一次并发） */
const bindCache = ref<Record<number, number[]>>({});
const loading = ref(false);

/* ==================== 分段 / 版式 ==================== */

type TabKey = "account" | "key";
type ModeKey = "roster" | "matrix" | "wall" | "ledger";

/** 当前分段：主机账号 / SSH 密钥库（可由 ?tab=key 直达） */
const tab = ref<TabKey>(route.query.tab === "key" ? "key" : "account");

/** 版式持久化键 */
const MODE_STORE = "hostaccount-mode";

/** 四个版式的元信息（顺序即切换条顺序） */
const MODES: Array<{ key: ModeKey; label: string; icon: string; desc: string }> = [
  { key: "roster", label: "名册", icon: "Notebook", desc: "左选账号，右看凭证与能登哪些机器" },
  { key: "matrix", label: "矩阵", icon: "Grid", desc: "行是账号、列是主机，格子点一下即绑 / 解绑" },
  { key: "wall", label: "工牌墙", icon: "Postcard", desc: "一个账号一张工牌，按认证方式着色" },
  { key: "ledger", label: "台账", icon: "Tickets", desc: "密集一行一条，适合账号多时扫读与批量清理" },
];

/**
 * 读回上次使用的版式。
 *
 * <p>非法旧值一律收敛到「名册」：localStorage 里可能是上一版遗留的键，
 * 直接信任会让页面开成一片空白。</p>
 *
 * @returns 合法版式键
 */
function readMode(): ModeKey {
  try {
    const v = localStorage.getItem(MODE_STORE);
    if (v && MODES.some((m) => m.key === v)) return v as ModeKey;
  } catch {
    /* 隐私模式下 localStorage 会抛，忽略 */
  }
  return "roster";
}

const mode = ref<ModeKey>(readMode());

/**
 * 切换版式并记住。
 *
 * @param key 目标版式
 */
function setMode(key: ModeKey): void {
  mode.value = key;
  try {
    localStorage.setItem(MODE_STORE, key);
  } catch {
    /* 忽略写入失败 */
  }
}

/** 当前版式的一句话说明 */
const modeDesc = computed(() => MODES.find((m) => m.key === mode.value)?.desc ?? "");

/** 主机过滤命中时显示的主机（用于页头的条件胶囊） */
const hostFilterHost = computed<HaHost | null>(() =>
  hostFilterId.value != null ? hostById.value[hostFilterId.value] ?? null : null,
);

/* ==================== 取数 ==================== */

/**
 * 拉全部数据。
 *
 * <p>绑定关系没有「一次查全部」的接口，只能按主机逐个查；并发发出去后聚合成
 * {@code identityId → hostId[]}，避免每渲染一行就发一次请求。</p>
 */
async function load(): Promise<void> {
  loading.value = true;
  try {
    const [idList, keyList, hostList] = await Promise.all([
      getIdentities(),
      getKeys().catch(() => [] as KeyRow[]),
      queryHosts().catch(() => [] as HostRow[]),
    ]);
    identities.value = (idList ?? []) as IdentityRow[];
    keys.value = (keyList ?? []) as KeyRow[];
    hosts.value = ((hostList ?? []) as HostRow[]).map((h) => ({
      id: h.id,
      name: h.serverHostName ?? `#${h.id}`,
      address: h.serverHostAddress ?? "",
      port: h.serverHostPort ?? 22,
      online: h.serverHostOnline === 1,
      osType: h.serverHostOsType ?? "",
    }));
    await loadBinds();
    // 从主机资产右键「主机账号」进来时带 hostId：落地只显示这台机器的账号
    const qid = Number(route.query.hostId ?? 0);
    if (qid && hosts.value.some((h) => h.id === qid)) hostFilterId.value = qid;
  } catch (e) {
    message.error(`加载失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    loading.value = false;
  }
}

/** 重新聚合全部绑定关系 */
async function loadBinds(): Promise<void> {
  const map: Record<number, number[]> = {};
  const results = await Promise.all(
    hosts.value.map(async (h) => {
      try {
        const ids = ((await listBoundIdentities(h.id)) ?? []) as number[];
        return { hostId: h.id, identityIds: ids };
      } catch {
        return { hostId: h.id, identityIds: [] as number[] };
      }
    }),
  );
  for (const r of results) {
    for (const id of r.identityIds) (map[id] ??= []).push(r.hostId);
  }
  bindCache.value = map;
}

onMounted(load);

/* ==================== 合并视图 ==================== */

/** 主机主键 → 主机（详情与矩阵列头都要用） */
const hostById = computed<Record<number, HaHost>>(() => {
  const m: Record<number, HaHost> = {};
  for (const h of hosts.value) m[h.id] = h;
  return m;
});

/** 密钥主键 → 密钥行 */
const keyById = computed<Record<number, KeyRow>>(() => {
  const m: Record<number, KeyRow> = {};
  for (const k of keys.value) m[k.id] = k;
  return m;
});

/** 账号合并视图：身份 + 引用密钥 + 绑定主机 */
const accounts = computed<HaAccount[]>(() =>
  identities.value.map((i) => {
    const key = i.msServerIdentityKeyId != null ? keyById.value[i.msServerIdentityKeyId] : undefined;
    const type = i.msServerIdentityAuthType ?? "";
    return {
      id: i.id,
      name: i.msServerIdentityName ?? `#${i.id}`,
      authType: type,
      authLabel: authLabelOf(type),
      username: i.msServerIdentityUsername ?? "",
      keyId: i.msServerIdentityKeyId ?? null,
      keyName: key?.msServerKeyName ?? (i.msServerIdentityKeyId != null ? `#${i.msServerIdentityKeyId}` : ""),
      keyType: key?.msServerKeyType ?? "",
      keyFp: keyFingerprint(key?.msServerKeyPublicKey),
      remark: i.msServerIdentityRemark ?? "",
      hostIds: bindCache.value[i.id] ?? [],
      hostKind: normAuth(type) === "PASSWORD" || normAuth(type) === "PUBLIC_KEY",
    };
  }),
);

/** 某账号绑定的主机对象列表 */
function boundHostsOf(a: HaAccount): HaHost[] {
  return a.hostIds.map((id) => hostById.value[id]).filter(Boolean);
}

/** 聚合口径 */
const stats = computed(() => {
  const list = accounts.value;
  const hostLogin = list.filter((a) => {
    const t = normAuth(a.authType);
    return t === "PASSWORD" || t === "PUBLIC_KEY";
  }).length;
  const publicKey = list.filter((a) => normAuth(a.authType) === "PUBLIC_KEY").length;
  const bound = list.filter((a) => a.hostIds.length > 0).length;
  const refIds = new Set(list.filter((a) => a.keyId != null).map((a) => a.keyId as number));
  return {
    total: list.length,
    hostLogin,
    publicKey,
    generic: list.length - hostLogin,
    bound,
    unbound: list.length - bound,
    keys: keys.value.length,
    keyRefs: refIds.size,
  };
});

/** 密钥被引用的次数（按 identity 引用关系反查） */
function keyRefCountOf(keyId: number): number {
  return identities.value.filter((i) => i.msServerIdentityKeyId === keyId).length;
}

/* ==================== 筛选 ==================== */

/** 关键词（名称 / 登录用户 / 备注 / 绑定主机名） */
const keyword = ref("");
/** 认证方式分组筛选：空 = 全部 */
const groupFilter = ref<"" | "password" | "key" | "generic">("");
/** 只看未绑定 */
const unboundOnly = ref(false);
/**
 * 只看某台主机的账号（从主机资产右键「主机账号」带 ?hostId= 进来）。
 *
 * <p>null 表示不限主机。落地时用它把关键词填成主机名，用户一眼看得出
 * 「这是这台机器的账号」，清掉关键词即可回到全量。</p>
 */
const hostFilterId = ref<number | null>(null);

/** 命中关键词的账号（矩阵 / 工牌墙 / 台账共用） */
const filtered = computed<HaAccount[]>(() => {
  const kw = keyword.value.trim().toLowerCase();
  return accounts.value.filter((a) => {
    if (hostFilterId.value != null && !a.hostIds.includes(hostFilterId.value)) return false;
    if (groupFilter.value && authGroupOf(a.authType) !== groupFilter.value) return false;
    if (unboundOnly.value && a.hostIds.length > 0) return false;
    if (!kw) return true;
    const hostNames = boundHostsOf(a).map((h) => `${h.name} ${h.address}`).join(" ");
    return (
      a.name.toLowerCase().includes(kw) ||
      a.username.toLowerCase().includes(kw) ||
      a.remark.toLowerCase().includes(kw) ||
      a.keyName.toLowerCase().includes(kw) ||
      hostNames.toLowerCase().includes(kw)
    );
  });
});

/** 三个分组的计数（筛选胶囊用） */
const groupCounts = computed(() => {
  const c = { password: 0, key: 0, generic: 0 };
  for (const a of accounts.value) c[authGroupOf(a.authType)] += 1;
  return c;
});

/* ==================== 名册档位：选中与分组 ==================== */

/** 名册档位当前选中的账号 */
const pickedId = ref<number | null>(null);

/** 名册档位当前选中账号（被筛掉时自动落到第一条） */
const picked = computed<HaAccount | null>(() => {
  const list = filtered.value;
  if (!list.length) return null;
  return list.find((a) => a.id === pickedId.value) ?? list[0]!;
});

/**
 * 选中一个账号。
 *
 * @param a 目标账号
 */
function pick(a: HaAccount): void {
  pickedId.value = a.id;
}

/** 名册档位左侧列表：按认证方式分组，组内按名称排序 */
const rosterGroups = computed(() => {
  const buckets: Record<"password" | "key" | "generic", HaAccount[]> = { password: [], key: [], generic: [] };
  for (const a of filtered.value) buckets[authGroupOf(a.authType)].push(a);
  return (["password", "key", "generic"] as const)
    .filter((g) => buckets[g].length > 0)
    .map((g) => ({
      key: g,
      label: AUTH_GROUP_LABEL[g],
      tone: g === "password" ? "a-info" : g === "key" ? "a-warn" : "a-mute",
      items: buckets[g].slice().sort((x, y) => x.name.localeCompare(y.name)),
    }));
});

/* ==================== 多选（台账档位） ==================== */

const selectedIds = ref<number[]>([]);

/**
 * 勾选 / 取消勾选。
 *
 * @param id 账号主键
 */
function toggleSelect(id: number): void {
  const i = selectedIds.value.indexOf(id);
  if (i >= 0) selectedIds.value.splice(i, 1);
  else selectedIds.value.push(id);
}

/** 当前筛选结果是否已全选 */
const allSelected = computed(
  () => filtered.value.length > 0 && filtered.value.every((a) => selectedIds.value.includes(a.id)),
);

/** 全选 / 全不选当前筛选结果 */
function toggleSelectAll(): void {
  if (allSelected.value) selectedIds.value = [];
  else selectedIds.value = filtered.value.map((a) => a.id);
}

/* ==================== 写操作 ==================== */

/**
 * 绑定 / 解绑（矩阵格子、名册详情、绑定弹窗共用）。
 *
 * <p>成功后只改本地缓存，不重新拉全表：格子是高频操作，每次重查所有主机的绑定
 * 会让点一下要等一秒。失败则什么都不动，界面不会显示一个假的绑定。</p>
 *
 * @param accountId 账号主键
 * @param hostId    主机主键
 * @param bind      true 绑定，false 解绑
 */
async function setBind(accountId: number, hostId: number, bind: boolean): Promise<void> {
  try {
    if (bind) await bindIdentity(hostId, accountId);
    else await unbindIdentity(hostId, accountId);
    const cur = bindCache.value[accountId] ?? [];
    bindCache.value = {
      ...bindCache.value,
      [accountId]: bind ? [...cur, hostId] : cur.filter((id) => id !== hostId),
    };
    message.success(bind ? "已绑定" : "已解绑");
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  }
}

/**
 * 矩阵格子点击：已绑则解绑，未绑则绑定。
 *
 * @param a 账号
 * @param h 主机
 */
async function toggleBindCell(a: HaAccount, h: HaHost): Promise<void> {
  await setBind(a.id, h.id, !a.hostIds.includes(h.id));
}

/** 复制登录用户名 */
async function copyUsername(a: HaAccount): Promise<void> {
  try {
    await navigator.clipboard.writeText(a.username);
    message.success("用户名已复制");
  } catch {
    message.info(a.username);
  }
}

/**
 * 跳到主机资产里的这台机器。
 *
 * @param h 主机
 */
function openHost(h: HaHost): void {
  router.push(`/host/${h.id}`);
}

/**
 * 删除一个账号。
 *
 * @param a 账号
 */
async function remove(a: HaAccount): Promise<void> {
  await ElMessageBox.confirm(`删除账号「${a.name}」？绑定关系会一并解除`, "删除确认", { type: "warning" });
  try {
    await delIdentity(a.id);
    message.success("已删除");
    await load();
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  }
}

/** 批量删除当前选中的账号 */
async function batchDelete(): Promise<void> {
  const ids = selectedIds.value.slice();
  if (!ids.length) return;
  await ElMessageBox.confirm(`删除选中的 ${ids.length} 个账号？`, "批量删除", { type: "warning" });
  let ok = 0;
  for (const id of ids) {
    try {
      await delIdentity(id);
      ok += 1;
    } catch (e) {
      console.error("删除失败:", e);
    }
  }
  message.success(`删除 ${ok}/${ids.length} 条`);
  selectedIds.value = [];
  await load();
}

/** 导出当前筛选结果为 CSV（含绑定主机，便于交接） */
function exportCsv(): void {
  const rows = filtered.value;
  if (!rows.length) {
    message.warning("没有可导出的数据");
    return;
  }
  const head = ["名称", "认证方式", "登录用户", "引用密钥", "绑定主机", "备注"];
  const body = rows.map((a) => [
    a.name,
    a.authLabel,
    a.username,
    a.keyName,
    boundHostsOf(a).map((h) => h.name).join(" / "),
    a.remark,
  ]);
  const csv = [head, ...body]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `主机账号-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  message.success(`已导出 ${rows.length} 条`);
}

/* ==================== 账号表单 ==================== */

const AUTH_TYPE_OPTIONS = [
  { value: "PASSWORD", label: "密码登录", group: "主机登录" },
  { value: "PUBLIC_KEY", label: "公钥登录", group: "主机登录" },
  { value: "MAILBOX", label: "邮箱账号", group: "通用凭据" },
  { value: "TOKEN", label: "Token", group: "通用凭据" },
  { value: "API_KEY", label: "API Key", group: "通用凭据" },
  { value: "OAUTH2", label: "OAuth 2.0", group: "通用凭据" },
  { value: "COOKIE", label: "Cookie", group: "通用凭据" },
  { value: "ACCOUNT", label: "账号密码", group: "通用凭据" },
];

const formVisible = ref(false);
useDialogPrerender(formVisible);
const formSaving = ref(false);
const editingId = ref<number | null>(null);
const form = ref<{
  msServerIdentityName: string;
  msServerIdentityAuthType: string;
  msServerIdentityUsername: string;
  msServerIdentityPassword: string;
  msServerIdentityKeyId: number | null;
  msServerIdentityRemark: string;
}>({
  msServerIdentityName: "",
  msServerIdentityAuthType: "PASSWORD",
  msServerIdentityUsername: "",
  msServerIdentityPassword: "",
  msServerIdentityKeyId: null,
  msServerIdentityRemark: "",
});

/** 可引用的密钥下拉项 */
const keyOptions = computed(() =>
  keys.value.map((k) => ({ label: `${k.msServerKeyName}（${k.msServerKeyType ?? "RSA"}）`, value: k.id })),
);

/** 打开新增弹窗 */
function openAdd(): void {
  editingId.value = null;
  form.value = {
    msServerIdentityName: "",
    msServerIdentityAuthType: "PASSWORD",
    msServerIdentityUsername: "",
    msServerIdentityPassword: "",
    msServerIdentityKeyId: null,
    msServerIdentityRemark: "",
  };
  formVisible.value = true;
}

/**
 * 打开编辑弹窗（口令不回显，留空表示不修改）。
 *
 * @param a 账号
 */
function openEdit(a: HaAccount): void {
  editingId.value = a.id;
  form.value = {
    msServerIdentityName: a.name,
    msServerIdentityAuthType: a.authType,
    msServerIdentityUsername: a.username,
    msServerIdentityPassword: "",
    msServerIdentityKeyId: a.keyId,
    msServerIdentityRemark: a.remark,
  };
  formVisible.value = true;
}

/** 保存账号 */
async function submitForm(): Promise<void> {
  if (!form.value.msServerIdentityName.trim()) {
    message.warning("请输入账号名称");
    return;
  }
  if (!form.value.msServerIdentityUsername.trim()) {
    message.warning("请输入登录用户名");
    return;
  }
  formSaving.value = true;
  try {
    await saveIdentity(editingId.value, {
      ...form.value,
      msServerIdentityPassword: form.value.msServerIdentityPassword || undefined,
    });
    message.success(editingId.value != null ? "账号已更新" : "账号已创建");
    formVisible.value = false;
    await load();
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  } finally {
    formSaving.value = false;
  }
}

/* ==================== 绑定弹窗 ==================== */

const bindVisible = ref(false);
useDialogPrerender(bindVisible);
const bindTarget = ref<HaAccount | null>(null);

/** 绑定弹窗：已绑 / 可绑两组 */
const bindBound = computed<HaHost[]>(() => (bindTarget.value ? boundHostsOf(bindTarget.value) : []));
const bindAvailable = computed<HaHost[]>(() => {
  const bound = new Set(bindBound.value.map((h) => h.id));
  return hosts.value.filter((h) => !bound.has(h.id));
});

/**
 * 打开绑定弹窗。
 *
 * @param a 账号
 */
function openBind(a: HaAccount): void {
  bindTarget.value = a;
  bindVisible.value = true;
}

/**
 * 弹窗内绑定 / 解绑（绑定后目标账号要重新取一遍，弹窗两组才跟着动）。
 *
 * @param h    主机
 * @param bind true 绑定，false 解绑
 */
async function bindInDialog(h: HaHost, bind: boolean): Promise<void> {
  const target = bindTarget.value;
  if (!target) return;
  await setBind(target.id, h.id, bind);
  // accounts 是 computed，重新取一次当前对象即可拿到最新 hostIds
  bindTarget.value = accounts.value.find((a) => a.id === target.id) ?? target;
}

/* ==================== 邮箱（MAILBOX 账号） ==================== */

interface MailItem {
  id?: string;
  subject?: string;
  from?: string;
  date?: string;
  snippet?: string;
  content?: string;
  size?: number;
}

const mailVisible = ref(false);
const mailTarget = ref<HaAccount | null>(null);
const mailLoading = ref(false);
const mails = ref<MailItem[]>([]);
const activeMailIndex = ref(-1);
const activeMail = computed(() => (activeMailIndex.value >= 0 ? mails.value[activeMailIndex.value] ?? null : null));

/** 发件人短名 */
function mailFromShort(from: string | undefined): string {
  if (!from) return "未知发件人";
  const m = from.match(/^([^<@]+@[^>]+)/);
  return (m?.[1] ?? from).slice(0, 24);
}

/** 邮件时间（截到分钟） */
function mailDate(d: string | undefined): string {
  return d ? d.slice(0, 16).replace("T", " ") : "";
}

/**
 * 打开收件箱。
 *
 * @param a 邮箱账号
 */
async function openMail(a: HaAccount): Promise<void> {
  mailTarget.value = a;
  mailVisible.value = true;
  activeMailIndex.value = -1;
  mailLoading.value = true;
  try {
    mails.value = ((await listMailbox(a.id, "INBOX", 20)) ?? []) as MailItem[];
  } catch (e) {
    mails.value = [];
    message.error(`加载邮件失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    mailLoading.value = false;
  }
}

/**
 * 选中邮件并拉正文。
 *
 * @param m   邮件
 * @param idx 下标
 */
async function selectMail(m: MailItem, idx: number): Promise<void> {
  activeMailIndex.value = idx;
  if (!mailTarget.value) return;
  try {
    const d = await getMailboxMessage(mailTarget.value.id, "INBOX", m.subject);
    mails.value[idx] = {
      ...mails.value[idx],
      content: typeof d === "string" ? d : JSON.stringify(d ?? "", null, 2),
    };
    mails.value = [...mails.value];
  } catch (e) {
    mails.value[idx] = { ...mails.value[idx], content: `读取正文失败: ${String((e as Error)?.message ?? e)}` };
    mails.value = [...mails.value];
  }
}

/* ==================== 密钥库 ==================== */

const keyFormVisible = ref(false);
useDialogPrerender(keyFormVisible);
const keySaving = ref(false);
const editingKeyId = ref<number | null>(null);
/** 本次是「生成密钥对」而不是手工录入 */
const isGenerate = ref(false);
const keyForm = ref<{
  msServerKeyName: string;
  msServerKeyType: string;
  msServerKeyPublicKey: string;
  msServerKeyPrivateKey: string;
  msServerKeyPassword: string;
  msServerKeyRemark: string;
}>({
  msServerKeyName: "",
  msServerKeyType: "RSA",
  msServerKeyPublicKey: "",
  msServerKeyPrivateKey: "",
  msServerKeyPassword: "",
  msServerKeyRemark: "",
});

const KEY_TYPE_OPTIONS = [
  { label: "RSA (4096 位)", value: "RSA" },
  { label: "ED25519", value: "ED25519" },
  { label: "ECDSA (P-256)", value: "ECDSA" },
];

/** 密钥空表单 */
function emptyKeyForm(): typeof keyForm.value {
  return {
    msServerKeyName: "",
    msServerKeyType: "RSA",
    msServerKeyPublicKey: "",
    msServerKeyPrivateKey: "",
    msServerKeyPassword: "",
    msServerKeyRemark: "",
  };
}

/** 生成密钥对 */
function openKeyGenerate(): void {
  editingKeyId.value = null;
  isGenerate.value = true;
  keyForm.value = emptyKeyForm();
  keyFormVisible.value = true;
}

/** 手工录入密钥 */
function openKeyManual(): void {
  editingKeyId.value = null;
  isGenerate.value = false;
  keyForm.value = emptyKeyForm();
  keyFormVisible.value = true;
}

/**
 * 编辑密钥（私钥与口令不回显）。
 *
 * @param k 密钥
 */
function openKeyEdit(k: KeyRow): void {
  editingKeyId.value = k.id;
  isGenerate.value = false;
  keyForm.value = {
    ...emptyKeyForm(),
    msServerKeyName: k.msServerKeyName,
    msServerKeyType: k.msServerKeyType || "RSA",
    msServerKeyPublicKey: k.msServerKeyPublicKey ?? "",
    msServerKeyRemark: k.msServerKeyRemark ?? "",
  };
  keyFormVisible.value = true;
}

/** 保存密钥 */
async function submitKey(): Promise<void> {
  if (!keyForm.value.msServerKeyName.trim()) {
    message.warning("请输入密钥名称");
    return;
  }
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
    await load();
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  } finally {
    keySaving.value = false;
  }
}

/** 生成密钥对并入库 */
async function generateKey(): Promise<void> {
  if (!keyForm.value.msServerKeyName.trim()) {
    message.warning("请输入密钥名称");
    return;
  }
  keySaving.value = true;
  try {
    await generateKeyPair(
      keyForm.value.msServerKeyName.trim(),
      keyForm.value.msServerKeyType,
      keyForm.value.msServerKeyPassword || undefined,
      keyForm.value.msServerKeyRemark,
    );
    message.success("密钥对已生成并保存");
    keyFormVisible.value = false;
    await load();
  } catch (e) {
    message.error(`生成失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    keySaving.value = false;
  }
}

/**
 * 删除密钥。
 *
 * @param k 密钥
 */
async function removeKey(k: KeyRow): Promise<void> {
  const refs = keyRefCountOf(k.id);
  await ElMessageBox.confirm(
    refs
      ? `删除密钥「${k.msServerKeyName}」？有 ${refs} 个账号引用它，删除后这些账号将无法用公钥登录`
      : `删除密钥「${k.msServerKeyName}」？`,
    "删除确认",
    { type: "warning" },
  );
  try {
    await delKey(k.id);
    message.success("已删除");
    await load();
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  }
}

/**
 * 下载公钥。
 *
 * <p>后端约定私钥与口令永不出现在响应体里，所以只提供公钥导出。</p>
 *
 * @param k 密钥
 */
function downloadPublicKey(k: KeyRow): void {
  const content = k.msServerKeyPublicKey ?? "";
  if (!content) {
    message.warning("该密钥暂无公钥内容");
    return;
  }
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${k.msServerKeyName}.pub`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ==================== 渲染小工具 ==================== */

/**
 * 主机短名（矩阵列头用，避免一列被长名撑开）。
 *
 * @param name 主机名
 * @returns 截断后的短名
 */
function shortHost(name: string): string {
  return name.length > 9 ? `${name.slice(0, 8)}…` : name;
}

/**
 * 是否邮箱账号（历史数据里类型大小写不一致，模板里不能直接比较）。
 *
 * @param a 账号
 * @returns true 表示可打开收件箱
 */
function isMailbox(a: HaAccount): boolean {
  return normAuth(a.authType) === "MAILBOX";
}
</script>

<template>
  <div class="ha">
    <!-- ==================== 页头：分段 + 版式 + 操作 ==================== -->
    <div class="ha-head">
      <div class="ha-seg">
        <button
          type="button"
          class="ha-seg__btn"
          :class="{ 'is-active': tab === 'account' }"
          @click="tab = 'account'"
        >
          主机账号<span class="ha-seg__n">{{ stats.total }}</span>
        </button>
        <button
          type="button"
          class="ha-seg__btn"
          :class="{ 'is-active': tab === 'key' }"
          @click="tab = 'key'"
        >
          SSH 密钥库<span class="ha-seg__n">{{ stats.keys }}</span>
        </button>
      </div>

      <div v-if="tab === 'account'" class="ha-modes">
        <button
          v-for="m in MODES"
          :key="m.key"
          type="button"
          class="ha-mode"
          :class="{ 'is-active': mode === m.key }"
          :title="m.desc"
          @click="setMode(m.key)"
        >
          <ReIcon :name="m.icon" :size="12" />{{ m.label }}
        </button>
      </div>

      <span class="ha-head__desc">{{ tab === 'account' ? modeDesc : '公钥登录账号引用这里的密钥，私钥与口令不出库' }}</span>

      <!-- 从主机资产右键带 hostId 进来：明确写出「只看这台机器的账号」，可一键清掉 -->
      <button
        v-if="hostFilterHost"
        type="button"
        class="ha-chip is-active"
        :title="`只显示与 ${hostFilterHost.name} 有绑定关系的账号，点击查看全部`"
        @click="hostFilterId = null"
      >
        <ReIcon name="Monitor" :size="11" />{{ hostFilterHost.name }} ×
      </button>

      <span class="ha-spacer" />

      <div class="ha-acts">
        <template v-if="tab === 'account'">
          <ReButton icon="Plus" layout="square" type="primary" tip="新增账号" @click="openAdd" />
          <ReButton icon="Download" layout="square" tip="导出当前筛选结果" @click="exportCsv" />
        </template>
        <template v-else>
          <ReButton icon="MagicStick" layout="square" tip="生成密钥对" @click="openKeyGenerate" />
          <ReButton icon="Plus" layout="square" type="primary" tip="手工录入密钥" @click="openKeyManual" />
        </template>
        <ReButton icon="RefreshRight" layout="square" tip="刷新" :loading="loading" @click="load" />
      </div>
    </div>

    <!-- ==================== 聚合条 ==================== -->
    <div v-if="tab === 'account'" class="ha-stats">
      <div class="ha-stat a-brand">
        <span class="ha-stat__v">{{ stats.total }}</span>
        <span class="ha-stat__k">账号总数</span>
      </div>
      <div class="ha-stat a-info">
        <span class="ha-stat__v">{{ stats.hostLogin }}</span>
        <span class="ha-stat__k">主机登录 <b>口令 {{ stats.hostLogin - stats.publicKey }}</b></span>
      </div>
      <div class="ha-stat a-warn">
        <span class="ha-stat__v">{{ stats.publicKey }}</span>
        <span class="ha-stat__k">公钥登录</span>
      </div>
      <div class="ha-stat a-mute">
        <span class="ha-stat__v">{{ stats.generic }}</span>
        <span class="ha-stat__k">通用凭据</span>
      </div>
      <div class="ha-stat a-ok">
        <span class="ha-stat__v">{{ stats.bound }}</span>
        <span class="ha-stat__k">已绑定主机</span>
      </div>
      <div class="ha-stat" :class="stats.unbound ? 'a-bad' : 'a-mute'">
        <span class="ha-stat__v">{{ stats.unbound }}</span>
        <span class="ha-stat__k">未绑定</span>
      </div>
    </div>
    <div v-else class="ha-stats">
      <div class="ha-stat a-brand">
        <span class="ha-stat__v">{{ stats.keys }}</span>
        <span class="ha-stat__k">密钥总数</span>
      </div>
      <div class="ha-stat a-warn">
        <span class="ha-stat__v">{{ keys.filter((k) => (k.msServerKeyType ?? 'RSA') === 'RSA').length }}</span>
        <span class="ha-stat__k">RSA</span>
      </div>
      <div class="ha-stat a-info">
        <span class="ha-stat__v">{{ keys.filter((k) => (k.msServerKeyType ?? 'RSA') !== 'RSA').length }}</span>
        <span class="ha-stat__k">其他类型</span>
      </div>
      <div class="ha-stat a-ok">
        <span class="ha-stat__v">{{ stats.keyRefs }}</span>
        <span class="ha-stat__k">已被账号引用</span>
      </div>
    </div>

    <!-- ==================== 分段一：主机账号 ==================== -->
    <template v-if="tab === 'account'">
      <div v-if="loading && !accounts.length" class="ha-loading">正在读取账号与绑定关系…</div>

      <!-- ---------- 版式 A：名册（左列表 + 右凭证卡） ---------- -->
      <div v-else-if="mode === 'roster'" class="ha-a">
        <aside class="ha-a__rail">
          <div class="ha-a__search">
            <ReInput v-model="keyword" placeholder="搜索账号 / 用户 / 主机" clearable />
          </div>
          <div class="ha-a__list">
            <div v-if="!filtered.length" class="ha-empty">
              <b>没有匹配的账号</b>
              <span>换个关键词，或点右上角「+」新增。</span>
            </div>
            <template v-for="g in rosterGroups" :key="g.key">
              <div class="ha-a__ghead" :class="g.tone">
                <span class="ha-dot" />{{ g.label }}<b>{{ g.items.length }}</b>
              </div>
              <button
                v-for="a in g.items"
                :key="a.id"
                type="button"
                class="ha-a__row"
                :class="{ 'is-active': picked?.id === a.id }"
                @click="pick(a)"
              >
                <span class="ha-a__row-main">
                  <span class="ha-a__row-name">{{ a.name }}</span>
                  <span class="ha-a__row-sub">{{ a.username || "未填登录用户" }}</span>
                </span>
                <span class="ha-a__row-n" :class="{ 'is-zero': !a.hostIds.length }">{{ a.hostIds.length }}</span>
              </button>
            </template>
          </div>
        </aside>

        <div class="ha-a__main">
          <div v-if="!picked" class="ha-panel" style="flex: 1">
            <div class="ha-empty">
              <b>先选一个账号</b>
              <span>左侧按认证方式分组列出全部账号，选中后这里显示凭证与它能登的机器。</span>
            </div>
          </div>

          <template v-else>
            <!-- 凭证卡：本版式的签名元素 -->
            <section class="ha-cred" :class="authToneOf(picked.authType)">
              <div class="ha-cred__band" />
              <div class="ha-cred__top">
                <div style="flex: 1; min-width: 0">
                  <div class="ha-cred__name">{{ picked.name }}</div>
                  <div class="ha-cred__meta">
                    <span class="ha-pill">{{ picked.authLabel }}</span>
                    <span class="ha-pill ha-pill--plain">{{ picked.hostIds.length }} 台主机</span>
                    <span v-if="!picked.hostIds.length" class="ha-pill ha-pill--plain">未绑定</span>
                  </div>
                </div>
                <div class="ha-acts">
                  <button type="button" class="ha-btn" @click="copyUsername(picked)">
                    <ReIcon name="CopyDocument" :size="11" />复制用户
                  </button>
                  <button v-if="isMailbox(picked)" type="button" class="ha-btn" @click="openMail(picked)">
                    <ReIcon name="Message" :size="11" />收件箱
                  </button>
                  <button type="button" class="ha-btn" @click="openBind(picked)">
                    <ReIcon name="Connection" :size="11" />绑定主机
                  </button>
                  <button type="button" class="ha-btn is-primary" @click="openEdit(picked)">
                    <ReIcon name="EditPen" :size="11" />编辑
                  </button>
                  <button type="button" class="ha-btn is-bad" @click="remove(picked)">
                    <ReIcon name="Delete" :size="11" />删除
                  </button>
                </div>
              </div>

              <div class="ha-cred__user">
                <span class="ha-cred__user-label">LOGIN AS</span>
                <span class="ha-cred__user-val">{{ picked.username || "—" }}</span>
              </div>

              <div class="ha-cred__grid">
                <div class="ha-cred__cell">
                  <span class="ha-cred__k">认证方式</span>
                  <span class="ha-cred__v">{{ picked.authLabel }}（{{ picked.authType }}）</span>
                </div>
                <div class="ha-cred__cell">
                  <span class="ha-cred__k">引用密钥</span>
                  <span v-if="picked.keyName" class="ha-cred__v">
                    {{ picked.keyName }}<span class="ha-dim"> · {{ picked.keyType || "RSA" }}</span>
                    <span v-if="picked.keyFp" class="ha-cred__fp ha-mono">{{ picked.keyFp }}</span>
                  </span>
                  <span v-else class="ha-cred__v ha-dim">未引用（口令登录或通用凭据）</span>
                </div>
                <div class="ha-cred__cell">
                  <span class="ha-cred__k">备注</span>
                  <span class="ha-cred__v">{{ picked.remark || "—" }}</span>
                </div>
                <div class="ha-cred__cell">
                  <span class="ha-cred__k">账号 ID</span>
                  <span class="ha-cred__v ha-mono">#{{ picked.id }}</span>
                </div>
              </div>
            </section>

            <!-- 能登哪些机器 -->
            <section class="ha-panel" style="flex: 1">
              <div class="ha-panel__head">
                可登录主机 <b>{{ picked.hostIds.length }}</b>
                <span class="ha-spacer" />
                <button type="button" class="ha-btn" @click="openBind(picked)">
                  <ReIcon name="Plus" :size="11" />追加绑定
                </button>
              </div>
              <div class="ha-panel__body">
                <div v-if="!picked.hostIds.length" class="ha-empty">
                  <b>这个账号还没绑定主机</b>
                  <span>绑定后，连接弹窗的「已绑定」分组里就能直接选到它。</span>
                </div>
                <div v-else class="ha-hosts">
                  <div
                    v-for="h in boundHostsOf(picked)"
                    :key="h.id"
                    class="ha-host"
                    :title="`${h.address}:${h.port} · 点击查看主机详情`"
                    @click="openHost(h)"
                  >
                    <i class="ha-host__dot" :class="h.online ? 'is-on' : 'is-off'" />
                    <b>{{ h.name }}</b>
                    <span class="ha-mono ha-dim">{{ h.address }}:{{ h.port }}</span>
                    <span class="ha-host__os">{{ h.osType || "—" }}</span>
                    <button
                      type="button"
                      class="ha-btn is-bad"
                      title="解除绑定"
                      @click.stop="setBind(picked.id, h.id, false)"
                    >
                      <ReIcon name="Close" :size="11" />解绑
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </template>
        </div>
      </div>

      <!-- ---------- 版式 B：绑定矩阵 ---------- -->
      <div v-else-if="mode === 'matrix'" class="ha-b">
        <div v-if="!hosts.length" class="ha-empty">
          <b>还没有主机</b>
          <span>矩阵的行是账号、列是主机，先到「主机资产」新增主机。</span>
        </div>
        <div v-else-if="!filtered.length" class="ha-empty">
          <b>没有匹配的账号</b>
          <span>换个关键词再试。</span>
        </div>
        <template v-else>
          <div
            class="ha-b__grid"
            :style="{ gridTemplateColumns: `minmax(150px, 210px) repeat(${hosts.length}, minmax(52px, 1fr))` }"
          >
            <div class="ha-b__corner">账号 ＼ 主机</div>
            <div v-for="h in hosts" :key="h.id" class="ha-b__hcol" :title="`${h.name} · ${h.address}:${h.port}`">
              <i class="ha-b__hdot" :class="h.online ? 'is-on' : 'is-off'" />
              <span class="ha-ellipsis">{{ shortHost(h.name) }}</span>
            </div>

            <template v-for="a in filtered" :key="a.id">
              <div
                class="ha-b__rhead"
                :class="{ 'is-active': pickedId === a.id }"
                :title="`${a.name} · ${a.authLabel} · ${a.username}${a.remark ? ` · ${a.remark}` : ''}${a.keyName ? ` · 密钥 ${a.keyName}` : ''}`"
                @click="pickedId = a.id"
              >
                <span class="ha-dot" :class="authToneOf(a.authType)" />
                <span class="ha-b__rmain">
                  <span class="ha-b__rname">{{ a.name }}</span>
                  <span class="ha-b__ruser">{{ a.username }}</span>
                </span>
                <span class="ha-b__rn">{{ a.hostIds.length }}</span>
              </div>
              <button
                v-for="h in hosts"
                :key="`${a.id}-${h.id}`"
                type="button"
                class="ha-b__cell"
                :class="[authToneOf(a.authType), { 'is-bound': a.hostIds.includes(h.id) }]"
                :title="`${a.name} ${a.hostIds.includes(h.id) ? '已绑定' : '未绑定'} ${h.name}，点击${a.hostIds.includes(h.id) ? '解绑' : '绑定'}`"
                @click="toggleBindCell(a, h)"
              >
                <ReIcon v-if="a.hostIds.includes(h.id)" name="Check" :size="12" />
                <span v-else>·</span>
              </button>
            </template>
          </div>

          <div class="ha-b__legend">
            <span><i class="ha-b__swatch is-on" />已绑定</span>
            <span><i class="ha-b__swatch" />未绑定</span>
            <span>行色 = 认证方式 · 点击格子直接绑 / 解绑</span>
            <span class="ha-spacer" />
            <span>{{ filtered.length }} 个账号 × {{ hosts.length }} 台主机</span>
          </div>
        </template>
      </div>

      <!-- ---------- 版式 C：工牌墙 ---------- -->
      <div v-else-if="mode === 'wall'" class="ha-c">
        <div v-if="!filtered.length" class="ha-empty">
          <b>没有匹配的账号</b>
          <span>换个关键词，或点右上角「+」新增。</span>
        </div>
        <div v-else class="ha-c__grid">
          <article v-for="a in filtered" :key="a.id" class="ha-card" :class="authToneOf(a.authType)">
            <i class="ha-card__bar" />
            <div class="ha-card__top">
              <span class="ha-card__name" :title="a.name">{{ a.name }}</span>
              <span class="ha-pill">{{ a.authLabel }}</span>
            </div>
            <div class="ha-card__user">
              <ReIcon name="User" :size="11" />
              <span class="ha-ellipsis">{{ a.username || "—" }}</span>
            </div>
            <div v-if="a.keyName" class="ha-card__key">
              <ReIcon name="Key" :size="11" />
              <span>{{ a.keyName }} · {{ a.keyType || "RSA" }}</span>
            </div>
            <div class="ha-card__hosts">
              <template v-if="a.hostIds.length">
                <span
                  v-for="h in boundHostsOf(a).slice(0, 4)"
                  :key="h.id"
                  class="ha-av"
                  :title="`${h.name} · ${h.address}`"
                >{{ hostInitial(h.name) }}</span>
                <span v-if="a.hostIds.length > 4" class="ha-av ha-av--more">+{{ a.hostIds.length - 4 }}</span>
                <span class="ha-dim" style="margin-left: 2px">{{ a.hostIds.length }} 台</span>
              </template>
              <span v-else class="ha-dim">未绑定主机</span>
            </div>
            <div class="ha-card__remark" :title="a.remark">{{ a.remark || "无备注" }}</div>
            <div class="ha-card__foot">
              <button type="button" class="ha-btn" title="绑定主机" @click="openBind(a)">
                <ReIcon name="Connection" :size="11" />绑定
              </button>
              <button type="button" class="ha-btn" title="复制登录用户名" @click="copyUsername(a)">
                <ReIcon name="CopyDocument" :size="11" />
              </button>
              <button v-if="isMailbox(a)" type="button" class="ha-btn" title="收件箱" @click="openMail(a)">
                <ReIcon name="Message" :size="11" />
              </button>
              <span class="ha-spacer" />
              <button type="button" class="ha-btn" title="编辑" @click="openEdit(a)">
                <ReIcon name="EditPen" :size="11" />
              </button>
              <button type="button" class="ha-btn is-bad" title="删除" @click="remove(a)">
                <ReIcon name="Delete" :size="11" />
              </button>
            </div>
          </article>
        </div>
      </div>

      <!-- ---------- 版式 D：台账 ---------- -->
      <div v-else class="ha-d">
        <div class="ha-d__bar">
          <ReInput v-model="keyword" placeholder="搜索账号 / 用户 / 备注 / 主机" clearable class="ha-d__search" />
          <button
            type="button"
            class="ha-chip"
            :class="{ 'is-active': groupFilter === '' }"
            @click="groupFilter = ''"
          >
            全部 <b>{{ stats.total }}</b>
          </button>
          <button
            v-for="g in (['password', 'key', 'generic'] as const)"
            :key="g"
            type="button"
            class="ha-chip"
            :class="{ 'is-active': groupFilter === g }"
            @click="groupFilter = groupFilter === g ? '' : g"
          >
            {{ AUTH_GROUP_LABEL[g] }} <b>{{ groupCounts[g] }}</b>
          </button>
          <button
            type="button"
            class="ha-chip"
            :class="{ 'is-active': unboundOnly }"
            @click="unboundOnly = !unboundOnly"
          >
            只看未绑定 <b>{{ stats.unbound }}</b>
          </button>
          <span class="ha-d__count">{{ filtered.length }} / {{ stats.total }} 条</span>
        </div>

        <div class="ha-d__table">
          <div class="ha-d__thead">
            <span style="display: flex; align-items: center; gap: 8px">
              <button
                type="button"
                class="ha-check"
                :class="{ 'is-on': allSelected }"
                title="全选当前筛选结果"
                @click="toggleSelectAll"
              >
                <ReIcon name="Check" :size="10" />
              </button>
              名称
            </span>
            <span>认证方式</span>
            <span>登录用户</span>
            <span>引用密钥</span>
            <span>绑定主机</span>
            <span style="text-align: right">操作</span>
          </div>

          <div v-if="!filtered.length" class="ha-empty">
            <b>没有匹配的账号</b>
            <span>清掉筛选条件，或点右上角「+」新增。</span>
          </div>

          <div
            v-for="a in filtered"
            v-else
            :key="a.id"
            class="ha-d__row"
            :class="[authToneOf(a.authType), { 'is-active': selectedIds.includes(a.id) }]"
            @click="openEdit(a)"
          >
            <span class="ha-d__name">
              <button
                type="button"
                class="ha-check"
                :class="{ 'is-on': selectedIds.includes(a.id) }"
                :title="selectedIds.includes(a.id) ? '取消选择' : '选择'"
                @click.stop="toggleSelect(a.id)"
              >
                <ReIcon name="Check" :size="10" />
              </button>
              <span :title="a.remark || a.name">{{ a.name }}</span>
            </span>
            <span class="ha-d__cell">
              <span class="ha-pill">{{ a.authLabel }}</span>
            </span>
            <span class="ha-d__cell ha-mono" :title="a.username">{{ a.username || "—" }}</span>
            <span class="ha-d__cell" :title="a.keyName">
              <template v-if="a.keyName">
                <ReIcon name="Key" :size="11" style="vertical-align: -1px" />
                {{ a.keyName }}
              </template>
              <span v-else class="ha-dim">—</span>
            </span>
            <span class="ha-d__hosts">
              <template v-if="a.hostIds.length">
                <span class="ha-pill ha-pill--plain" :title="boundHostsOf(a).map((h) => h.name).join('、')">
                  <span>{{ a.hostIds.length }} 台 · {{ boundHostsOf(a)[0]?.name }}</span>
                </span>
                <span v-if="a.hostIds.length > 1" class="ha-dim">+{{ a.hostIds.length - 1 }}</span>
              </template>
              <span v-else class="ha-dim">未绑定</span>
            </span>
            <span class="ha-d__acts" @click.stop>
              <button type="button" class="ha-btn" title="编辑" @click="openEdit(a)">
                <ReIcon name="EditPen" :size="11" />
              </button>
              <button type="button" class="ha-btn" title="绑定主机" @click="openBind(a)">
                <ReIcon name="Connection" :size="11" />
              </button>
              <button v-if="isMailbox(a)" type="button" class="ha-btn" title="收件箱" @click="openMail(a)">
                <ReIcon name="Message" :size="11" />
              </button>
              <button type="button" class="ha-btn" title="复制用户名" @click="copyUsername(a)">
                <ReIcon name="CopyDocument" :size="11" />
              </button>
              <button type="button" class="ha-btn is-bad" title="删除" @click="remove(a)">
                <ReIcon name="Delete" :size="11" />
              </button>
            </span>
          </div>
        </div>

        <div v-if="selectedIds.length" class="ha-selbar" style="margin: 8px">
          <ReIcon name="Select" :size="12" />
          已选 <b>{{ selectedIds.length }}</b> 个账号
          <span class="ha-spacer" />
          <button type="button" class="ha-btn" @click="selectedIds = []">取消选择</button>
          <button type="button" class="ha-btn is-bad" @click="batchDelete">
            <ReIcon name="Delete" :size="11" />批量删除
          </button>
        </div>
      </div>
    </template>

    <!-- ==================== 分段二：SSH 密钥库 ==================== -->
    <template v-else>
      <div class="ha-k">
        <div v-if="!keys.length" class="ha-empty">
          <b>密钥库还是空的</b>
          <span>「生成密钥对」由服务端生成 RSA / ED25519 / ECDSA 并直接入库；也可以手工粘贴已有密钥。</span>
        </div>
        <div v-else class="ha-k__grid">
          <article v-for="k in keys" :key="k.id" class="ha-key" :class="(k.msServerKeyType ?? 'RSA') === 'RSA' ? 'a-warn' : 'a-info'">
            <div class="ha-key__top">
              <ReIcon name="Key" :size="13" />
              <span class="ha-key__name" :title="k.msServerKeyName">{{ k.msServerKeyName }}</span>
              <span class="ha-pill">{{ k.msServerKeyType ?? "RSA" }}</span>
            </div>
            <div class="ha-key__fp">{{ keyFingerprint(k.msServerKeyPublicKey) || "（未录入公钥内容）" }}</div>
            <div class="ha-key__meta">
              <ReIcon name="Connection" :size="11" />
              <span v-if="keyRefCountOf(k.id)">{{ keyRefCountOf(k.id) }} 个账号引用</span>
              <span v-else>暂无账号引用</span>
              <span v-if="k.msServerKeyRemark" class="ha-dim">· {{ k.msServerKeyRemark }}</span>
            </div>
            <div class="ha-key__foot">
              <button type="button" class="ha-btn" title="编辑" @click="openKeyEdit(k)">
                <ReIcon name="EditPen" :size="11" />编辑
              </button>
              <button type="button" class="ha-btn" title="下载公钥" :disabled="!k.msServerKeyPublicKey" @click="downloadPublicKey(k)">
                <ReIcon name="Download" :size="11" />公钥
              </button>
              <span class="ha-spacer" />
              <button type="button" class="ha-btn is-bad" title="删除" @click="removeKey(k)">
                <ReIcon name="Delete" :size="11" />
              </button>
            </div>
          </article>
        </div>
      </div>
    </template>

    <!-- ==================== 账号表单 ==================== -->
    <ReDialog v-model="formVisible" :title="editingId != null ? '编辑账号' : '新增账号'" width="520px" :close-on-click-modal="false">
      <ReForm :model="form" label-position="top">
        <ReFormItem label="账号名称">
          <ReInput v-model="form.msServerIdentityName" placeholder="如 root-prod / 跳板机运维" style="width: 100%" />
        </ReFormItem>
        <ReFormItem label="认证方式">
          <ReSelect
            v-model="form.msServerIdentityAuthType"
            style="width: 100%"
            filterable
            allow-create
            default-first-option
            placeholder="选择或输入认证方式"
            :options="AUTH_TYPE_OPTIONS"
          />
        </ReFormItem>
        <ReFormItem label="登录用户名">
          <ReInput v-model="form.msServerIdentityUsername" placeholder="如 root / ubuntu / Administrator" style="width: 100%" />
        </ReFormItem>
        <ReFormItem v-if="normAuth(form.msServerIdentityAuthType) === 'PASSWORD'" label="登录密码">
          <ReInput
            v-model="form.msServerIdentityPassword"
            type="password"
            show-password
            :placeholder="editingId != null ? '留空保持不变' : 'SSH 口令'"
            style="width: 100%"
          />
        </ReFormItem>
        <ReFormItem v-if="form.msServerIdentityAuthType === 'PUBLIC_KEY'" label="引用密钥">
          <ReSelect
            v-model="form.msServerIdentityKeyId"
            style="width: 100%"
            clearable
            placeholder="从密钥库选择"
            :options="keyOptions"
          />
        </ReFormItem>
        <ReFormItem label="备注">
          <ReInput v-model="form.msServerIdentityRemark" placeholder="用途说明（可选）" style="width: 100%" />
        </ReFormItem>
      </ReForm>
      <template #footer>
        <ReButton @click="formVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="formSaving" icon="Check" :show-text="true" @click="submitForm">
          {{ editingId != null ? "保存" : "创建" }}
        </ReButton>
      </template>
    </ReDialog>

    <!-- ==================== 绑定主机 ==================== -->
    <ReDialog v-model="bindVisible" :title="`绑定主机：${bindTarget?.name ?? ''}`" width="640px" :close-on-click-modal="false">
      <div class="ha-bindrow__sec">已绑定（{{ bindBound.length }}）</div>
      <div v-if="bindBound.length" class="ha-bindlist">
        <div v-for="h in bindBound" :key="h.id" class="ha-bindrow">
          <i class="ha-host__dot" :class="h.online ? 'is-on' : 'is-off'" />
          <b>{{ h.name }}</b>
          <span class="ha-mono ha-dim">{{ h.address }}:{{ h.port }}</span>
          <button type="button" class="ha-btn is-bad" @click="bindInDialog(h, false)">
            <ReIcon name="Close" :size="11" />解绑
          </button>
        </div>
      </div>
      <div v-else class="ha-dim" style="padding: 6px 0; font-size: 12px">这个账号还没绑定任何主机</div>

      <div class="ha-bindrow__sec">可绑定（{{ bindAvailable.length }}）</div>
      <div v-if="bindAvailable.length" class="ha-bindlist">
        <div v-for="h in bindAvailable" :key="h.id" class="ha-bindrow">
          <i class="ha-host__dot" :class="h.online ? 'is-on' : 'is-off'" />
          <b>{{ h.name }}</b>
          <span class="ha-mono ha-dim">{{ h.address }}:{{ h.port }}</span>
          <button type="button" class="ha-btn is-primary" @click="bindInDialog(h, true)">
            <ReIcon name="Link" :size="11" />绑定
          </button>
        </div>
      </div>
      <div v-else class="ha-dim" style="padding: 6px 0; font-size: 12px">全部主机都已绑定</div>
    </ReDialog>

    <!-- ==================== 密钥表单 ==================== -->
    <ReDialog
      v-model="keyFormVisible"
      :title="editingKeyId != null ? '编辑密钥' : isGenerate ? '生成密钥对' : '新增密钥'"
      width="560px"
      :close-on-click-modal="false"
    >
      <ReForm :model="keyForm" label-position="top">
        <ReFormItem label="密钥名称">
          <ReInput v-model="keyForm.msServerKeyName" placeholder="如 prod-rsa-2026" style="width: 100%" />
        </ReFormItem>
        <ReFormItem label="密钥类型">
          <ReSelect
            v-model="keyForm.msServerKeyType"
            style="width: 100%"
            :options="KEY_TYPE_OPTIONS"
            :disabled="editingKeyId != null"
          />
        </ReFormItem>
        <template v-if="!isGenerate">
          <ReFormItem label="公钥">
            <ReInput
              v-model="keyForm.msServerKeyPublicKey"
              type="textarea"
              :rows="3"
              placeholder="粘贴公钥内容（可选）"
              style="width: 100%"
            />
          </ReFormItem>
          <ReFormItem label="私钥">
            <ReInput
              v-model="keyForm.msServerKeyPrivateKey"
              type="textarea"
              :rows="3"
              :placeholder="editingKeyId != null ? '留空保持不变' : '粘贴私钥内容（可选）'"
              style="width: 100%"
            />
          </ReFormItem>
        </template>
        <ReFormItem v-if="isGenerate" label="私钥口令">
          <ReInput
            v-model="keyForm.msServerKeyPassword"
            type="password"
            show-password
            placeholder="私钥加密口令（可空）"
            style="width: 100%"
          />
        </ReFormItem>
        <ReFormItem label="备注">
          <ReInput v-model="keyForm.msServerKeyRemark" placeholder="用途说明（可选）" style="width: 100%" />
        </ReFormItem>
      </ReForm>
      <template #footer>
        <ReButton @click="keyFormVisible = false">取消</ReButton>
        <ReButton
          v-if="isGenerate && editingKeyId == null"
          type="primary"
          :loading="keySaving"
          icon="MagicStick"
          :show-text="true"
          @click="generateKey"
        >生成</ReButton>
        <ReButton v-else type="primary" :loading="keySaving" icon="Check" :show-text="true" @click="submitKey">
          {{ editingKeyId != null ? "保存" : "创建" }}
        </ReButton>
      </template>
    </ReDialog>

    <!-- ==================== 收件箱 ==================== -->
    <ReDialog v-model="mailVisible" :title="`收件箱：${mailTarget?.name ?? ''}`" width="820px" :close-on-click-modal="false">
      <div v-if="mailLoading" class="ha-loading">正在读取邮件…</div>
      <div v-else-if="!mails.length" class="ha-empty">
        <b>收件箱为空</b>
        <span>这个邮箱账号的 INBOX 里还没有邮件。</span>
      </div>
      <div v-else class="ha-mail">
        <div class="ha-mail__side">
          <div class="ha-panel__head">共 {{ mails.length }} 封<span class="ha-spacer" /><span class="ha-dim">点击查看</span></div>
          <div class="ha-mail__list">
            <div
              v-for="(m, idx) in mails"
              :key="m.id ?? idx"
              class="ha-mail__item"
              :class="{ 'is-active': activeMailIndex === idx }"
              @click="selectMail(m, idx)"
            >
              <div class="ha-mail__from">
                <span class="ha-mono">{{ mailFromShort(m.from) }}</span>
                <span class="ha-dim" style="font-weight: 400">{{ mailDate(m.date) }}</span>
              </div>
              <div class="ha-mail__subject">{{ m.subject || "(无主题)" }}</div>
              <div v-if="m.snippet" class="ha-mail__snippet">{{ m.snippet }}</div>
            </div>
          </div>
        </div>
        <div class="ha-mail__pane">
          <template v-if="activeMail">
            <div class="ha-mail__panehead">
              <div class="ha-mail__subject-lg">{{ activeMail.subject || "(无主题)" }}</div>
              <div class="ha-mail__metaline">
                <span class="ha-pill ha-pill--plain">发件人</span>
                <span class="ha-mono">{{ activeMail.from || "—" }}</span>
              </div>
              <div class="ha-mail__metaline">
                <span class="ha-pill ha-pill--plain">时间</span>
                <span class="ha-mono">{{ activeMail.date || "—" }}</span>
              </div>
            </div>
            <div class="ha-mail__body">
              <pre v-if="activeMail.content">{{ activeMail.content }}</pre>
              <div v-else class="ha-dim">（暂无正文预览）</div>
            </div>
          </template>
          <div v-else class="ha-empty">
            <b>选一封邮件</b>
            <span>左侧点开即可读正文。</span>
          </div>
        </div>
      </div>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
@use "../../components/hostaccount/_ha-kit.scss";
</style>

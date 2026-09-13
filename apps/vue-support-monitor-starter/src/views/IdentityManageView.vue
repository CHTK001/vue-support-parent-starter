<script setup lang="ts">
/**
 * 账号管理 —— 登录身份（账号密码 / SSH 私钥 / 邮箱 / Token 等）统一维护
 * 数据源：@pages/server 身份接口（getIdentities / saveIdentity / delIdentity）
 * 主机连接 / 编辑时从该列表选择身份
 * @author CH
 * @since 4.0.0
 */
import { computed, onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { ReFormItem } from "@repo/ui/re-kit";
import type { ReFilterItem } from "@repo/ui/components/ReFilter/types";
import { getIdentities, saveIdentity, delIdentity, getKeys, saveKey, delKey, generateKeyPair, queryHosts, listBoundIdentities, bindIdentity, unbindIdentity, listMailbox, getMailboxMessage } from "@pages/server/src/api";
import { useDialogPrerender } from "../utils/dialogPrerender";

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
  { prop: "auth", label: "类型", width: 110, slot: "auth" },
  { prop: "msServerIdentityUsername", label: "登录用户", minWidth: 140 },
  { prop: "key", label: "密钥", width: 130, slot: "key" },
  { prop: "hosts", label: "绑定主机", width: 90, slot: "hosts" },
  { prop: "msServerIdentityRemark", label: "备注", minWidth: 140 },
  { prop: "id", label: "操作", width: 180, slot: "actions" },
];

const keyColumns = [
  { prop: "msServerKeyName", label: "名称", minWidth: 160 },
  { prop: "type", label: "类型", width: 90, slot: "type" },
  { prop: "fp", label: "公钥指纹", minWidth: 180, slot: "fp" },
  { prop: "msServerKeyRemark", label: "备注", minWidth: 140 },
  { prop: "id", label: "操作", width: 120, slot: "actions" },
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
    // 批量加载绑定关系（host → identity）
    const map: Record<number, number[]> = {};
    await Promise.all(
      (hostList ?? []).map(async (h: HostRow) => {
        try {
          const ids = ((await listBoundIdentities(h.id)) ?? []) as number[];
          for (const id of ids) {
            (map[id] ??= []).push(h.id);
          }
        } catch {
          /* 忽略单主机绑定加载失败 */
        }
      }),
    );
    bindCache.value = map;
  } catch (e) {
    ElMessage.error(`加载失败: ${String((e as Error)?.message ?? e)}`);
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
    ElMessage.error(`密钥加载失败: ${String((e as Error)?.message ?? e)}`);
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
  if (!keyForm.value.msServerKeyName?.trim()) { ElMessage.warning("请输入密钥名称"); return; }
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
    ElMessage.success(editingKeyId.value != null ? "密钥已更新" : "密钥已创建");
    keyFormVisible.value = false;
    await loadKeys();
    await load();
  } catch (e) {
    ElMessage.error(String((e as Error)?.message ?? e));
  } finally {
    keySaving.value = false;
  }
}

async function removeKey(row: KeyRow): Promise<void> {
  await ElMessageBox.confirm(`删除密钥「${row.msServerKeyName}」？被引用的身份将受影响`, "删除确认", { type: "warning" });
  try {
    await delKey(row.id);
    ElMessage.success("已删除");
    await loadKeys();
    await load();
  } catch (e) {
    ElMessage.error(String((e as Error)?.message ?? e));
  }
}

/** 生成密钥对 */
async function generateKey(): Promise<void> {
  if (!keyForm.value.msServerKeyName?.trim()) { ElMessage.warning("请输入密钥名称"); return; }
  keySaving.value = true;
  try {
    const r = await generateKeyPair(
      keyForm.value.msServerKeyName.trim(),
      keyForm.value.msServerKeyType,
      keyForm.value.msServerKeyPassword || undefined,
      keyForm.value.msServerKeyRemark,
    );
    ElMessage.success("密钥对已生成并保存");
    keyFormVisible.value = false;
    await loadKeys();
  } catch (e) {
    ElMessage.error(`生成失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    keySaving.value = false;
  }
}

async function remove(i: Identity): Promise<void> {
  await ElMessageBox.confirm(`删除身份「${i.msServerIdentityName}」？`, "删除确认", { type: "warning" });
  try {
    await delIdentity(i.id);
    ElMessage.success("已删除");
    await load();
  } catch (e) {
    ElMessage.error(String((e as Error)?.message ?? e));
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
    ElMessage.success("已绑定");
    await openBind(bindTarget.value);
  } catch (e) {
    ElMessage.error(String((e as Error)?.message ?? e));
  }
}

async function doUnbind(hostId: number): Promise<void> {
  if (!bindTarget.value) return;
  try {
    await unbindIdentity(hostId, bindTarget.value.id);
    ElMessage.success("已解绑");
    await openBind(bindTarget.value);
  } catch (e) {
    ElMessage.error(String((e as Error)?.message ?? e));
  }
}

// ---- 邮箱（MAILBOX）管理 ----
const mailVisible = ref(false);
const mailTarget = ref<Identity | null>(null);
const mailLoading = ref(false);
const mails = ref<Array<{ id: string; subject?: string; from?: string; date?: string; snippet?: string }>>([]);
const mailDetail = ref("");

async function openMail(row: Identity): Promise<void> {
  mailTarget.value = row;
  mailVisible.value = true;
  mailDetail.value = "";
  mailLoading.value = true;
  try {
    const list = ((await listMailbox(row.id, "INBOX", 20)) ?? []) as Array<{ id: string; subject?: string; from?: string; date?: string; snippet?: string }>;
    mails.value = list;
  } catch (e) {
    mails.value = [];
    ElMessage.error(`加载邮件失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    mailLoading.value = false;
  }
}

async function showMailDetail(m: { id?: string; subject?: string }): Promise<void> {
  if (!mailTarget.value) return;
  try {
    const d = await getMailboxMessage(mailTarget.value.id, "INBOX", m.subject);
    mailDetail.value = typeof d === "string" ? d : JSON.stringify(d ?? "", null, 2);
  } catch (e) {
    mailDetail.value = `读取邮件内容失败: ${String((e as Error)?.message ?? e)}`;
  }
}

// ---- 密钥私钥/公钥下载 ----
function downloadKeyMaterial(row: KeyRow, which: "public" | "private"): void {
  if (which === "private" && !row.msServerKeyPrivateKey) {
    ElMessage.warning("私钥内容不可见（出于安全考虑，后端不回显），请用「生成密钥对」重建或查看密钥库");
    return;
  }
  const content = which === "public" ? row.msServerKeyPublicKey ?? "" : (row.msServerKeyPrivateKey ?? "");
  const blob = new Blob([content || "（空）"], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${row.msServerKeyName}.${which === "public" ? "pub" : "key"}`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** 批量删除（ReTable toolbar batchDelete handler） */
async function batchDelete(rows: Record<string, unknown>[]): Promise<void> {
  let ok = 0;
  for (const r of rows) {
    const id = Number(r.id);
    if (!id) continue;
    try {
      await delIdentity(id);
      ok++;
    } catch {
      /* 单条失败继续 */
    }
  }
  ElMessage.success(`删除 ${ok}/${rows.length}`);
  selection.value = [];
  await load();
}

/** 导出当前过滤结果为 CSV */
function exportCsv(): void {
  const rows = filteredList.value;
  if (!rows.length) {
    ElMessage.warning("没有可导出的数据");
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
  ElMessage.success(`已导出 ${rows.length} 条`);
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

/** 类型统计：主机 / 通用 / 未知 */
const hostCount = computed(() => list.value.filter((i) => i.msServerIdentityAuthType === "PASSWORD" || i.msServerIdentityAuthType === "PUBLIC_KEY").length);
const genericCount = computed(() => list.value.length - hostCount.value);
const keyCount = computed(() => list.value.filter((i) => i.msServerIdentityAuthType === "PUBLIC_KEY").length);

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
    ElMessage.success("用户名已复制");
  } catch {
    ElMessage.info(i.msServerIdentityUsername || "");
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
  if (!addForm.value.msServerIdentityName?.trim()) { ElMessage.warning("请输入身份名称"); return; }
  if (!addForm.value.msServerIdentityUsername?.trim()) { ElMessage.warning("请输入登录用户名"); return; }
  addSaving.value = true;
  try {
    await saveIdentity(editingId.value, {
      ...addForm.value,
      msServerIdentityPassword: addForm.value.msServerIdentityPassword || undefined,
    });
    ElMessage.success(editingId.value != null ? "身份已更新" : "身份已创建");
    addVisible.value = false;
    await load();
  } catch (e) {
    ElMessage.error(String((e as Error)?.message ?? e));
  } finally {
    addSaving.value = false;
  }
}
</script>

<template>
  <div class="im tel-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">账号管理</h1>
        <p class="page-desc">{{ tab === 'identity' ? '登录身份（密码 / SSH 私钥 / 邮箱 / Token 等）统一维护 · 共 ' + list.length + ' 条' : 'SSH 密钥库统一维护 · 供身份公钥登录引用' }}</p>
      </div>
      <div class="page-actions">
        <ReButton v-if="tab === 'identity'" icon="Download" :show-text="true" size="small" @click="exportCsv">导出</ReButton>
        <ReButton v-if="tab === 'identity'" icon="RefreshRight" :show-text="true" size="small" :loading="loading" @click="load">刷新</ReButton>
        <ReButton v-else icon="RefreshRight" :show-text="true" size="small" :loading="keyLoading" @click="loadKeys">刷新</ReButton>
      </div>
    </div>

    <!-- Tab 切换 -->
    <div class="tabs">
      <button class="tab-btn" :class="{ active: tab === 'identity' }" @click="tab = 'identity'">登录身份</button>
      <button class="tab-btn" :class="{ active: tab === 'key' }" @click="tab = 'key'">SSH 密钥库</button>
    </div>

    <!-- 身份 tab -->
    <template v-if="tab === 'identity'">
    <!-- KPI 统计 -->
    <section class="kpi-row cols-4">
      <div class="kpi c-brand">
        <div class="kpi-top"><span class="kpi-label">身份总数</span></div>
        <div class="kpi-value">{{ list.length }}</div>
        <div class="kpi-sub">全部登录身份</div>
      </div>
      <div class="kpi c-green">
        <div class="kpi-top"><span class="kpi-label">主机身份</span></div>
        <div class="kpi-value">{{ hostCount }}</div>
        <div class="kpi-sub">密码 / 公钥</div>
      </div>
      <div class="kpi c-blue">
        <div class="kpi-top"><span class="kpi-label">通用账号</span></div>
        <div class="kpi-value">{{ genericCount }}</div>
        <div class="kpi-sub">邮箱 / Token / API Key 等</div>
      </div>
      <div class="kpi c-amber">
        <div class="kpi-top"><span class="kpi-label">密钥引用</span></div>
        <div class="kpi-value">{{ keyCount }}</div>
        <div class="kpi-sub">SSH 私钥登录</div>
      </div>
    </section>

    <div class="card">
      <ReSectionHead description="身份即登录凭据；主机可绑定多个身份，连接时按所选身份建连">
        <template #title>登录身份</template>
        <template #actions>
          <ReButton icon="Plus" :show-text="true" size="small" type="primary" @click="openAdd">新增身份</ReButton>
        </template>
      </ReSectionHead>

      <div class="filter">
        <ReFilter
          :items="filterItems"
          :columns="2"
          :collapsible="false"
          :show-actions="false"
          @change="onFilterChange"
          @reset="onFilterReset"
          style="width:100%"
        />
        <span class="muted" style="margin-left:auto">{{ filteredList.length }} / {{ list.length }}</span>
      </div>

      <ReTable
        :data="filteredList"
        :columns="columns"
        :loading="loading"
        table-id="identity-list"
        size="small"
        :pagination="true"
        :page-size="pageSize"
        empty-text="暂无身份"
        :toolbar="true"
        :toolbar-config="{
          position: 'bottom',
          refresh: true,
          columnSettings: true,
          tableSettings: true,
          batchSelect: { enabled: true, tip: '批量选择' },
          batchDelete: { enabled: true, confirmMessage: '确认批量删除选中的身份？', handler: batchDelete },
        }"
        @selection-change="selection = $event"
      >
        <template #col-auth="{ row }">
          <ReTag :type="authTypeTagType(row.msServerIdentityAuthType)" size="small">
            {{ authTypeLabel(row.msServerIdentityAuthType) }}
          </ReTag>
        </template>
        <template #col-key="{ row }">
          <span v-if="keyNameOf(row)" class="mono dim">{{ keyNameOf(row) }}</span>
          <span v-else class="dim">—</span>
        </template>
        <template #col-hosts="{ row }">
          <ReTag v-if="boundHostCountOf(row.id) > 0" size="small" effect="plain" type="primary" @click="openBind(row)" class="clickable">{{ boundHostCountOf(row.id) }} 台</ReTag>
          <span v-else class="dim">—</span>
        </template>
        <template #col-actions="{ row }">
          <div class="op-cell">
            <ReButton v-if="row.msServerIdentityAuthType === 'MAILBOX'" icon="Message" layout="square" size="small" title="收件箱" @click="openMail(row)" />
            <ReButton icon="Connection" layout="square" size="small" title="绑定主机" @click="openBind(row)" />
            <ReButton icon="CopyDocument" layout="square" size="small" title="复制用户名" @click="copyUsername(row)" />
            <ReButton icon="EditPen" layout="square" size="small" title="编辑" @click="openEdit(row)" />
            <ReButton icon="Delete" layout="square" size="small" type="danger" title="删除" @click="remove(row)" />
          </div>
        </template>
      </ReTable>
      <div v-if="selection.length" class="sel-bar">
        <ReTag type="primary" effect="plain">已选 {{ selection.length }} 项</ReTag>
        <ReButton icon="Delete" size="small" type="danger" :show-text="true" @click="batchDelete(selection as unknown as Record<string, unknown>[])">批量删除</ReButton>
      </div>
    </div>
    </template>

    <!-- 密钥库 tab -->
    <template v-else>
      <div class="card">
        <ReSectionHead description="SSH 密钥库：密钥名称 / 类型 / 公钥指纹；身份选「公钥登录」时引用密钥">
          <template #title>SSH 密钥库</template>
          <template #actions>
            <ReButton icon="MagicStick" :show-text="true" size="small" @click="openKeyAdd">生成密钥对</ReButton>
            <ReButton icon="Plus" :show-text="true" size="small" type="primary" @click="openKeyManual">新增密钥</ReButton>
          </template>
        </ReSectionHead>

        <ReTable
          :data="keys"
          :columns="keyColumns"
          :loading="keyLoading"
          table-id="ssh-key-list"
          size="small"
          :pagination="true"
          :page-size="10"
          empty-text="暂无密钥"
          :toolbar="true"
          :toolbar-config="{
            position: 'bottom',
            refresh: true,
            columnSettings: true,
            tableSettings: true,
            batchSelect: { enabled: true, tip: '批量选择' },
            batchDelete: { enabled: true, confirmMessage: '确认批量删除选中的密钥？' },
          }"
        >
          <template #col-type="{ row }">
            <ReTag :type="row.msServerKeyType === 'RSA' ? 'warning' : 'primary'" size="small" effect="plain">{{ keyTypeLabel(row.msServerKeyType) }}</ReTag>
          </template>
          <template #col-fp="{ row }">
            <span class="mono dim">{{ keyFingerprint(row.msServerKeyPublicKey) }}</span>
          </template>
          <template #col-actions="{ row }">
            <div class="op-cell">
              <ReButton icon="Download" layout="square" size="small" title="下载公钥" @click="downloadKeyMaterial(row, 'public')" />
              <ReButton icon="EditPen" layout="square" size="small" title="编辑" @click="openKeyEdit(row)" />
              <ReButton icon="Delete" layout="square" size="small" type="danger" title="删除" @click="removeKey(row)" />
            </div>
          </template>
        </ReTable>
      </div>
    </template>

    <!-- 新增身份 -->
    <ReDialog v-model="addVisible" :title="editingId != null ? '编辑身份' : '新增身份'" width="520px" :close-on-click-modal="false">
      <ReForm :model="addForm" label-position="top">
        <ReFormItem label="名称">
          <ReInput v-model="addForm.msServerIdentityName" placeholder="如 root-prod" style="width:100%" />
        </ReFormItem>
        <ReFormItem label="类型">
          <ReSelect v-model="addForm.msServerIdentityAuthType" size="small" style="width:100%" filterable allow-create default-first-option placeholder="选择或输入类型" :options="authTypeOptions" />
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
          <ReSelect v-model="keyForm.msServerKeyType" size="small" style="width:100%" :options="KEY_TYPE_OPTIONS" :disabled="editingKeyId != null" />
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
            <ReTag :type="h.serverHostOnline === 1 ? 'success' : 'info'" size="small" effect="plain">{{ h.serverHostOnline === 1 ? '在线' : '离线' }}</ReTag>
            <b>{{ h.serverHostName }}</b>
            <span class="mono dim">{{ h.serverHostAddress }}:{{ h.serverHostPort }}</span>
            <ReButton icon="Unlink" layout="square" size="small" type="danger" title="解绑" @click="doUnbind(h.id)" />
          </div>
        </div>
        <div v-else class="dim" style="padding:8px 0">未绑定任何主机</div>

        <div class="muted" style="margin:14px 0 8px">可绑定主机（{{ bindAllHosts.length }}）</div>
        <div v-if="bindAllHosts.length" class="host-chips">
          <div v-for="h in bindAllHosts" :key="h.id" class="host-chip">
            <b>{{ h.serverHostName }}</b>
            <span class="mono dim">{{ h.serverHostAddress }}:{{ h.serverHostPort }}</span>
            <ReButton icon="Link" layout="square" size="small" type="primary" title="绑定" @click="doBind(h.id)" />
          </div>
        </div>
        <div v-else class="dim" style="padding:8px 0">已全部绑定</div>
      </template>
      <template #footer>
        <ReButton @click="bindVisible = false">关闭</ReButton>
      </template>
    </ReDialog>

    <!-- 邮箱（MAILBOX）弹窗 -->
    <ReDialog v-model="mailVisible" :title="`收件箱：${mailTarget?.msServerIdentityName ?? ''}`" width="700px" :close-on-click-modal="false">
      <div v-if="mailLoading" class="dim" style="padding:20px 0;text-align:center">加载中...</div>
      <template v-else>
        <div v-if="mails.length" class="mail-list">
          <div v-for="m in mails" :key="m.id" class="mail-item" @click="showMailDetail(m)">
            <div class="mail-subject">{{ m.subject || '(无主题)' }}</div>
            <div class="mail-meta mono dim">{{ m.from || '' }} · {{ m.date || '' }}</div>
            <div v-if="m.snippet" class="mail-snippet dim">{{ m.snippet }}</div>
          </div>
        </div>
        <div v-else class="dim" style="padding:20px 0;text-align:center">收件箱为空</div>
        <template v-if="mailDetail">
          <el-divider />
          <div class="mail-detail"><pre>{{ mailDetail }}</pre></div>
        </template>
      </template>
      <template #footer>
        <ReButton @click="mailVisible = false">关闭</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
.im { display: flex; flex-direction: column; gap: 14px; }
.op-cell { display: flex; gap: 6px; }
.sel-bar { display: flex; align-items: center; gap: 10px; margin-top: 8px; padding: 8px 12px; background: var(--bg-container); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
.mono { font-family: ui-monospace, SFMono-Regular, monospace; }
.dim { color: var(--text-tertiary); }
.muted { color: var(--text-tertiary); font-size: 12px; }
.clickable { cursor: pointer; }
.host-chips { display: flex; flex-direction: column; gap: 6px; max-height: 300px; overflow-y: auto; }
.host-chip { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border: 1px solid var(--border-subtle); border-radius: var(--radius-md); font-size: 13px; }
.host-chip b { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mail-list { max-height: 320px; overflow-y: auto; }
.mail-item { padding: 8px 10px; border-bottom: 1px solid var(--border-subtle); cursor: pointer; }
.mail-item:hover { background: var(--bg-hover); }
.mail-subject { font-size: 13px; font-weight: 600; }
.mail-meta { font-size: 11px; margin-top: 2px; }
.mail-snippet { font-size: 12px; margin-top: 2px; }
.mail-detail pre { white-space: pre-wrap; word-break: break-all; font-size: 12px; max-height: 240px; overflow-y: auto; }
</style>

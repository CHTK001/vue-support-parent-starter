<script setup lang="ts">
/**
 * 主机资产 v2 —— 对齐 prototype.html §4.2
 * KPI + FilterBar + 表格 + 完整 CRUD（新增/编辑/删除/启停/批量）+ 行内「连接」直达远控
 */
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { queryHosts, saveHost, delHost, switchHost, getHost, getGroups, getIdentities, listBoundIdentities, bindIdentity, unbindIdentity, saveIdentity, delIdentity } from "@pages/server/src/api";

interface Host {
  id: number;
  serverHostName: string;
  serverHostAddress: string;
  serverHostPort: number;
  serverHostOsType: string;
  serverHostStatus: number;
  serverHostOnline: number;
  serverHostCollectMode: string;
  serverHostAgentEnabled: number;
  serverHostRemoteEnabled: number;
  serverHostOnlineTime?: string;
  /** 分组（后端字段 msServerGroupId） */
  serverGroupId?: number | null;
  /** 标签（后端字段 msServerHostTags，逗号分隔） */
  serverHostTags?: string | null;
  /** 描述/备注（后端字段 msServerHostDescription） */
  serverHostDescription?: string | null;
  /** 编码（后端字段 msServerHostCode） */
  serverHostCode?: string | null;
}

interface Group { id: number; msServerGroupName: string; }
interface Identity { id: number; msServerIdentityName: string; msServerIdentityAuthType: string; msServerIdentityUsername: string; msServerIdentityRemark?: string; }

const router = useRouter();
const hosts = ref<Host[]>([]);
const groups = ref<Group[]>([]);
const identities = ref<Identity[]>([]);
const loading = ref(false);
const loadError = ref("");
const keyword = ref("");
const filterStatus = ref("");
const filterGroup = ref<number | null>(null);
const filterTag = ref("");
const selection = ref<Host[]>([]);

/** 标签集合（用于筛选/展示） */
const allTags = computed(() => {
  const s = new Set<string>();
  for (const h of hosts.value) {
    for (const t of splitTags(h.serverHostTags)) s.add(t);
  }
  return [...s];
});

function splitTags(tags?: string | null): string[] {
  if (!tags || !tags.trim()) return [];
  return tags.split(",").map(t => t.trim()).filter(Boolean);
}
function groupName(id?: number | null): string {
  if (!id) return "未分组";
  return groups.value.find(g => g.id === id)?.msServerGroupName ?? "组#" + id;
}

function normalizeOs(t?: string): string {
  const s = (t ?? "").toUpperCase();
  if (s.includes("WIN")) return "Windows";
  if (s.includes("LINUX")) return "Linux";
  if (s.includes("MAC")) return "macOS";
  return s || "其他";
}
function osIcon(t?: string): string {
  const s = (t ?? "").toUpperCase();
  if (s.includes("WIN")) return "🪟";
  if (s.includes("LINUX")) return "🐧";
  if (s.includes("MAC")) return "🍎";
  return "🖥️";
}
function protocolOf(h: Host): string {
  const s = (h.serverHostOsType ?? "").toUpperCase();
  if (s.includes("WIN")) return "rdp";
  if (s.includes("MAC")) return "vnc";
  return "ssh";
}
function onlineState(h: Host): "online" | "offline" | "unknown" {
  const v = h.serverHostOnline;
  if (v === 1) return "online";
  if (v === 0) return "offline";
  return "unknown";
}
function onlineText(h: Host): string {
  const v = h.serverHostOnline;
  return v === 1 ? "在线" : v === 0 ? "离线" : "未知";
}

const onlineCount = computed(() => hosts.value.filter(h => h.serverHostOnline === 1).length);
const remoteCount = computed(() => hosts.value.filter(h => h.serverHostRemoteEnabled === 1).length);
const offlineCount = computed(() => hosts.value.length - onlineCount.value);

const filtered = computed(() => {
  let list = hosts.value;
  if (filterStatus.value === "online") list = list.filter(h => h.serverHostOnline === 1);
  else if (filterStatus.value === "offline") list = list.filter(h => h.serverHostOnline !== 1);
  else if (filterStatus.value === "remote") list = list.filter(h => h.serverHostRemoteEnabled === 1);
  if (filterGroup.value != null) list = list.filter(h => h.serverGroupId === filterGroup.value);
  if (filterTag.value) list = list.filter(h => splitTags(h.serverHostTags).includes(filterTag.value));
  if (keyword.value) {
    const k = keyword.value.toLowerCase();
    list = list.filter(h => h.serverHostName.toLowerCase().includes(k) || h.serverHostAddress.toLowerCase().includes(k));
  }
  return list;
});

async function fetchAll(): Promise<void> {
  loading.value = true;
  loadError.value = "";
  try {
    const [h, g, i] = await Promise.all([queryHosts(), getGroups(), getIdentities()]);
    hosts.value = (h ?? []).sort((a, b) => (b.serverHostOnline ?? 0) - (a.serverHostOnline ?? 0));
    groups.value = g ?? [];
    identities.value = i ?? [];
  } catch (e) {
    loadError.value = String((e as Error)?.message ?? e);
  } finally {
    loading.value = false;
  }
}

function connect(h: Host): void {
  router.push({ path: "/terminal", query: { hostId: String(h.id), protocol: protocolOf(h) } });
}
function openDetail(h: Host): void {
  router.push(`/host/${h.id}`);
}

// ---- 新增/编辑表单 ----
const formVisible = ref(false);
const formSaving = ref(false);
const formIsEdit = ref(false);
/** 标签编辑用文本（逗号分隔），提交时写成 serverHostTags */
const tagsText = ref("");
const form = ref<Partial<Host>>({ serverHostName: "", serverHostAddress: "", serverHostPort: 22, serverHostOsType: "LINUX", serverHostCollectMode: "SCHEDULED" });
function resetForm(): void {
  form.value = { serverHostName: "", serverHostAddress: "", serverHostPort: 22, serverHostOsType: "LINUX", serverHostCollectMode: "SCHEDULED", serverGroupId: null, serverHostTags: "", serverHostDescription: "" };
  tagsText.value = "";
}

function collectModeLabel(m?: string | null): string {
  const map: Record<string, string> = { SCHEDULED: "定时采集", AGENT: "Agent采集", HTTP: "HTTP采集", PROMETHEUS: "Prometheus采集" };
  return map[m ?? ""] ?? m ?? "—";
}

// ---- 连接时选择身份 ----
const connectVisible = ref(false);
const connectTarget = ref<Host | null>(null);
const connectIdentityId = ref<number | null>(null);
const hostBoundIdentities = ref<{ id: number; msServerIdentityName: string; msServerIdentityUsername: string; }[]>([]);

function openConnect(h: Host): void {
  connectTarget.value = h;
  connectIdentityId.value = null;
  connectVisible.value = true;
  listBoundIdentities(h.id).then((list: any) => {
    hostBoundIdentities.value = (list ?? []).filter(Boolean);
  }).catch(() => { hostBoundIdentities.value = []; });
}
function doConnect(): void {
  const h = connectTarget.value;
  if (!h) return;
  const identityId = connectIdentityId.value;
  router.push({
    path: "/terminal",
    query: { hostId: String(h.id), protocol: protocolOf(h), ...(identityId != null ? { identityId: String(identityId) } : {}) },
  });
  connectVisible.value = false;
}

// ---- 身份管理（账号密码 / 私钥登录）----
const identityVisible = ref(false);
const identitySaving = ref(false);
const identityForm = ref<{ msServerIdentityName: string; msServerIdentityAuthType: string; msServerIdentityUsername: string; msServerIdentityPassword: string; msServerIdentityKeyId: number | null; msServerIdentityRemark: string }>({
  msServerIdentityName: "", msServerIdentityAuthType: "PASSWORD", msServerIdentityUsername: "", msServerIdentityPassword: "", msServerIdentityKeyId: null, msServerIdentityRemark: "",
});
function openIdentityAdd(): void {
  identityForm.value = { msServerIdentityName: "", msServerIdentityAuthType: "PASSWORD", msServerIdentityUsername: "", msServerIdentityPassword: "", msServerIdentityKeyId: null, msServerIdentityRemark: "" };
  identityVisible.value = true;
}
async function submitIdentity(): Promise<void> {
  if (!identityForm.value.msServerIdentityName?.trim()) { ElMessage.warning("请输入身份名称"); return; }
  if (!identityForm.value.msServerIdentityUsername?.trim()) { ElMessage.warning("请输入登录用户名"); return; }
  identitySaving.value = true;
  try {
    await saveIdentity(null, { ...identityForm.value, msServerIdentityPassword: identityForm.value.msServerIdentityPassword || undefined });
    ElMessage.success("身份已创建");
    identityVisible.value = false;
    const list = await getIdentities();
    identities.value = list ?? [];
  } catch (e) { ElMessage.error(String((e as Error)?.message ?? e)); }
  finally { identitySaving.value = false; }
}
async function removeIdentity(id: number): Promise<void> {
  await ElMessageBox.confirm("删除该身份？", "删除确认", { type: "warning" });
  try {
    await delIdentity(id);
    identities.value = identities.value.filter(x => x.id !== id);
  } catch (e) { ElMessage.error(String((e as Error)?.message ?? e)); }
}
/** 在连接弹窗里绑定/解绑身份 */
async function toggleBind(hostId: number, identityId: number, bind: boolean): Promise<void> {
  try {
    if (bind) await bindIdentity(hostId, identityId);
    else await unbindIdentity(hostId, identityId);
    ElMessage.success(bind ? "已绑定该身份" : "已解绑");
    const list = await listBoundIdentities(hostId);
    hostBoundIdentities.value = (list ?? []).filter(Boolean);
  } catch (e) { ElMessage.error(String((e as Error)?.message ?? e)); }
}

function openAdd(): void {
  formIsEdit.value = false;
  resetForm();
  formVisible.value = true;
}
async function openEdit(h: Host): Promise<void> {
  try {
    const full = await getHost(h.id);
    form.value = { ...((full as any) ?? h) };
  } catch {
    form.value = { ...h };
  }
  tagsText.value = splitTags(form.value.serverHostTags).join(", ");
  formIsEdit.value = true;
  formVisible.value = true;
}
function validForm(): boolean {
  if (!form.value.serverHostName?.trim()) { ElMessage.warning("请输入主机名"); return false; }
  if (!form.value.serverHostAddress?.trim()) { ElMessage.warning("请输入地址"); return false; }
  if (!form.value.serverHostPort) { ElMessage.warning("请输入端口"); return false; }
  return true;
}
async function submitForm(): Promise<void> {
  if (!validForm()) return;
  // 标签文本 → 逗号分隔字符串
  form.value.serverHostTags = tagsText.value.split(",").map(t => t.trim()).filter(Boolean).join(",");
  formSaving.value = true;
  try {
    await saveHost(formIsEdit.value ? form.value.id ?? null : null, form.value);
    ElMessage.success(formIsEdit.value ? "已更新" : "已新增");
    formVisible.value = false;
    await fetchAll();
  } catch (e) {
    ElMessage.error(String((e as Error)?.message ?? e));
  } finally {
    formSaving.value = false;
  }
}

// ---- 删除 / 启停 / 批量 ----
async function removeHost(h: Host): Promise<void> {
  await ElMessageBox.confirm(`删除主机「${h.serverHostName}」？`, "删除确认", { type: "warning" });
  try {
    const ok = await delHost(h.id);
    if (ok === false) { ElMessage.warning("删除未生效（可能仍有绑定）"); return; }
    ElMessage.success("已删除");
    await fetchAll();
  } catch (e) {
    ElMessage.error(String((e as Error)?.message ?? e));
  }
}
async function toggleHost(h: Host): Promise<void> {
  try {
    await switchHost(h.id, h.serverHostRemoteEnabled !== 1);
    ElMessage.success("已切换");
    await fetchAll();
  } catch (e) {
    ElMessage.error(String((e as Error)?.message ?? e));
  }
}
async function batchDelete(): Promise<void> {
  if (selection.value.length === 0) return;
  await ElMessageBox.confirm(`批量删除 ${selection.value.length} 台主机？`, "批量删除", { type: "warning" });
  let ok = 0;
  for (const h of selection.value) {
    try { await delHost(h.id); ok++; } catch { /* 单条失败继续 */ }
  }
  ElMessage.success(`删除 ${ok}/${selection.value.length}`);
  selection.value = [];
  await fetchAll();
}

onMounted(fetchAll);
</script>

<template>
  <div class="as">
    <div class="page-header">
      <div>
        <h1 class="page-title">主机资产</h1>
        <p class="page-desc">统一管理可远控目标 · 共 {{ hosts.length }} 台 · 完整增删改查</p>
      </div>
      <div class="page-actions">
        <button class="btn" @click="openIdentityAdd">🔑 账号/密钥</button>
        <button class="btn" @click="fetchAll" :disabled="loading">⟳ 刷新</button>
        <button class="btn btn-primary" @click="openAdd">+ 新增资产</button>
      </div>
    </div>

    <div v-if="loadError" style="padding:10px 14px;margin-bottom:16px;font-size:13px;color:#9b1c2e;background:#fdecef;border:1px solid #fbc0c9;border-radius:8px;display:flex;align-items:center;gap:12px">
      <span>数据加载失败：{{ loadError }}</span>
      <button class="btn btn-primary btn-sm" @click="fetchAll">重试</button>
    </div>

    <!-- KPI -->
    <section class="kpi-row cols-4">
      <div class="kpi c-brand">
        <div class="kpi-top"><span class="kpi-label">资产总数</span></div>
        <div class="kpi-value">{{ hosts.length }}</div>
        <div class="kpi-sub">共注册资产</div>
      </div>
      <div class="kpi c-green">
        <div class="kpi-top"><span class="kpi-label">在线</span></div>
        <div class="kpi-value">{{ onlineCount }}</div>
        <div class="kpi-sub"><b>{{ onlineCount }}</b> / {{ hosts.length }}</div>
      </div>
      <div class="kpi c-gray">
        <div class="kpi-top"><span class="kpi-label">离线</span></div>
        <div class="kpi-value">{{ offlineCount }}</div>
        <div class="kpi-sub">需关注</div>
      </div>
      <div class="kpi c-blue">
        <div class="kpi-top"><span class="kpi-label">远控启用</span></div>
        <div class="kpi-value">{{ remoteCount }}</div>
        <div class="kpi-sub">可远程连接</div>
      </div>
    </section>

    <!-- 表格 -->
    <div class="card">
      <div class="filter">
        <ReInput v-model="keyword" placeholder="搜索名称 / IP" clearable size="small" class="grow" />
        <ReSelect v-model="filterStatus" placeholder="状态" clearable size="small" style="width:110px">
          <el-option label="在线" value="online" />
          <el-option label="离线" value="offline" />
          <el-option label="远控启用" value="remote" />
        </ReSelect>
        <ReSelect v-model="filterGroup" placeholder="分组" clearable size="small" style="width:130px">
          <el-option v-for="g in groups" :key="g.id" :label="g.msServerGroupName" :value="g.id" />
        </ReSelect>
        <!-- 标签快筛 -->
        <span v-if="allTags.length" class="muted" style="margin-left:8px">标签:</span>
        <template v-for="t in allTags" :key="t">
          <button :class="['chip', { active: filterTag === t }]" @click="filterTag = filterTag === t ? '' : t">{{ t }}</button>
        </template>
        <span class="muted" style="margin-left:auto">{{ filtered.length }} / {{ hosts.length }}</span>
        <button v-if="selection.length" class="btn btn-danger btn-sm" @click="batchDelete">批量删除({{ selection.length }})</button>
      </div>
      <el-table :data="filtered" v-loading="loading" size="small" empty-text="暂无主机" border @selection-change="selection = $event">
        <el-table-column type="selection" width="40" />
        <el-table-column label="名称" min-width="140">
          <template #default="{ row }"><span class="h-os">{{ osIcon(row.serverHostOsType) }}</span> <b>{{ row.serverHostName }}</b></template>
        </el-table-column>
        <el-table-column label="地址" width="140"><template #default="{ row }"><span class="mono">{{ row.serverHostAddress }}:{{ row.serverHostPort }}</span></template></el-table-column>
        <el-table-column label="分组" width="90"><template #default="{ row }"><ReTag v-if="row.serverGroupId" size="small" effect="plain">{{ groupName(row.serverGroupId) }}</ReTag><span v-else class="dim">未分组</span></template></el-table-column>
        <el-table-column label="标签" min-width="120">
          <template #default="{ row }">
            <div v-if="splitTags(row.serverHostTags).length" style="display:flex;gap:4px;flex-wrap:wrap">
              <ReTag v-for="t in splitTags(row.serverHostTags)" :key="t" size="small" effect="light">{{ t }}</ReTag>
            </div>
            <span v-else class="dim">—</span>
          </template>
        </el-table-column>
        <el-table-column label="OS" width="80"><template #default="{ row }"><ReTag size="small">{{ normalizeOs(row.serverHostOsType) }}</ReTag></template></el-table-column>
        <el-table-column label="协议" width="70"><template #default="{ row }"><ReTag :type="protocolOf(row) === 'ssh' ? 'primary' : protocolOf(row) === 'rdp' ? 'warning' : 'info'" size="small" effect="plain">{{ protocolOf(row).toUpperCase() }}</ReTag></template></el-table-column>
        <el-table-column label="状态" width="80"><template #default="{ row }">
          <span class="st-cell"><ReStatusIndicator :type="row.serverHostOnline === 1 ? 'success' : 'info'" />{{ onlineText(row) }}</span>
        </template></el-table-column>
        <el-table-column label="采集模式" width="100"><template #default="{ row }"><span class="mono dim">{{ collectModeLabel(row.serverHostCollectMode) }}</span></template></el-table-column>
        <el-table-column label="Agent" width="84"><template #default="{ row }"><ReTag :type="row.serverHostAgentEnabled === 1 ? 'success' : 'info'" size="small">{{ row.serverHostAgentEnabled === 1 ? "已注册" : "未注册" }}</ReTag></template></el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <div class="op-cell">
              <ReButton icon="Connection" layout="square" size="small" type="primary" title="连接（选择身份）" @click="openConnect(row)" />
              <ReButton icon="TrendCharts" layout="square" size="small" title="监控" @click="openDetail(row)" />
              <ReButton icon="EditPen" layout="square" size="small" title="编辑" @click="openEdit(row)" />
              <ReButton icon="Delete" layout="square" size="small" type="danger" title="删除" @click="removeHost(row)" />
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="formVisible" :title="formIsEdit ? '编辑主机' : '新增主机'" width="520px">
      <el-form label-width="90px">
        <el-form-item label="名称"><ReInput v-model="form.serverHostName" placeholder="如 web01" /></el-form-item>
        <el-form-item label="地址"><ReInput v-model="form.serverHostAddress" placeholder="IP 或域名" /></el-form-item>
        <el-form-item label="端口"><ReInputNumber v-model="form.serverHostPort" :min="1" :max="65535" /></el-form-item>
        <el-form-item label="系统">
          <ReSelect v-model="form.serverHostOsType" size="small" style="width: 100%">
            <el-option label="Linux" value="LINUX" />
            <el-option label="Windows" value="WINDOWS" />
            <el-option label="macOS" value="MACOS" />
          </ReSelect>
        </el-form-item>
        <el-form-item label="采集模式">
          <ReSelect v-model="form.serverHostCollectMode" size="small" style="width: 100%">
            <el-option label="SCHEDULED" value="SCHEDULED" />
            <el-option label="AGENT" value="AGENT" />
            <el-option label="HTTP" value="HTTP" />
            <el-option label="PROMETHEUS" value="PROMETHEUS" />
          </ReSelect>
        </el-form-item>
        <el-form-item label="分组">
          <ReSelect v-model="form.serverGroupId" size="small" clearable placeholder="未分组" style="width: 100%">
            <el-option v-for="g in groups" :key="g.id" :label="g.msServerGroupName" :value="g.id" />
          </ReSelect>
        </el-form-item>
        <el-form-item label="标签">
          <ReInput v-model="tagsText" placeholder="逗号分隔，如 prod,db,linux" />
        </el-form-item>
        <el-form-item label="描述">
          <ReInput v-model="form.serverHostDescription" type="textarea" :rows="2" placeholder="主机用途 / 备注（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <ReButton @click="formVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="formSaving" @click="submitForm" icon="Check" :show-text="true">保存</ReButton>
      </template>
    </el-dialog>

    <!-- 连接弹窗（选择登录身份） -->
    <el-dialog v-model="connectVisible" :title="`连接 ${connectTarget?.serverHostName ?? ''}`" width="460px">
      <div v-if="!connectTarget" />
      <template v-else>
        <p class="muted" style="margin-top:0">{{ connectTarget.serverHostAddress }}:{{ connectTarget.serverHostPort }} · {{ protocolOf(connectTarget).toUpperCase() }}</p>
        <div class="muted" style="margin-bottom:8px">登录身份（账号密码 / 私钥）</div>
        <ReSelect v-model="connectIdentityId" placeholder="使用默认凭据" clearable size="small" style="width:100%">
          <el-option-group label="已绑定">
            <el-option v-for="b in hostBoundIdentities" :key="b.id" :label="`${b.msServerIdentityName}（${b.msServerIdentityUsername}）`" :value="b.id" />
          </el-option-group>
          <el-option-group label="全部身份">
            <el-option v-for="i in identities.filter(x => !hostBoundIdentities.some(b => b.id === x.id))" :key="i.id" :label="`${i.msServerIdentityName}（${i.msServerIdentityUsername}）`" :value="i.id" />
          </el-option-group>
        </ReSelect>
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
          <button class="btn btn-sm" @click="openIdentityAdd">+ 新增身份</button>
          <template v-for="b in hostBoundIdentities" :key="b.id">
            <button class="btn btn-sm" :title="`解绑 ${b.msServerIdentityName}`" @click="toggleBind(connectTarget.id, b.id, false)">解绑 {{ b.msServerIdentityName }}</button>
          </template>
        </div>
      </template>
      <template #footer>
        <ReButton @click="connectVisible = false">取消</ReButton>
        <ReButton type="primary" icon="Connection" :show-text="true" @click="doConnect">{{ connectIdentityId ? "以此身份连接" : "默认凭据连接" }}</ReButton>
      </template>
    </el-dialog>

    <!-- 身份管理（账号密码 / 私钥）弹窗 -->
    <el-dialog v-model="identityVisible" title="账号 / 密钥（登录身份）" width="500px">
      <div v-if="identities.length">
        <div class="muted" style="margin-bottom:8px">已有身份</div>
        <div v-for="i in identities" :key="i.id" style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border-subtle)">
          <span class="mono dim" style="flex:none">{{ i.msServerIdentityAuthType === "PASSWORD" ? "🔑 密码" : "🔐 密钥" }}</span>
          <b>{{ i.msServerIdentityName }}</b>
          <span class="muted">{{ i.msServerIdentityUsername }}</span>
          <ReButton icon="Delete" layout="square" size="small" type="danger" style="margin-left:auto" title="删除" @click="removeIdentity(i.id)" />
        </div>
      </div>
      <div style="margin:14px 0 10px"><b>新增身份</b></div>
      <el-form label-width="80px">
        <el-form-item label="名称"><ReInput v-model="identityForm.msServerIdentityName" placeholder="如 root-prod" /></el-form-item>
        <el-form-item label="类型">
          <ReSelect v-model="identityForm.msServerIdentityAuthType" size="small" style="width:100%">
            <el-option label="密码登录 (PASSWORD)" value="PASSWORD" />
            <el-option label="私钥登录 (PUBLIC_KEY)" value="PUBLIC_KEY" />
          </ReSelect>
        </el-form-item>
        <el-form-item label="用户名"><ReInput v-model="identityForm.msServerIdentityUsername" placeholder="如 root / ubuntu" /></el-form-item>
        <el-form-item v-if="identityForm.msServerIdentityAuthType === 'PASSWORD'" label="密码">
          <ReInput v-model="identityForm.msServerIdentityPassword" type="password" show-password placeholder="登录口令" />
        </el-form-item>
        <el-form-item label="备注"><ReInput v-model="identityForm.msServerIdentityRemark" /></el-form-item>
      </el-form>
      <template #footer>
        <ReButton @click="identityVisible = false">取消</ReButton>
        <ReButton type="primary" icon="Check" :show-text="true" :loading="identitySaving" @click="submitIdentity">保存身份</ReButton>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.as-error {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #9b1c2e;
  background: #fdecef;
  border: 1px solid #fbc0c9;
  border-radius: 8px;
}
.h-os { font-size: 14px; }
.st-cell { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; }
.op-cell { display: flex; gap: 4px; }
</style>
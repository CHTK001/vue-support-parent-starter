<script setup lang="ts">
/**
 * 代理管理 —— 免费代理（业务）
 * 后台代理表 ms_proxy（每次获取免费代理时清空重录——自研抓取 databay 源）；
 * 页面免费代理从数据表读取（/ms/server/proxy/list——快）；
 * 获取免费代理走 /ms/server/proxy/free（抓取→清空→录入——较慢）。
 *
 * 视觉：对齐 UI 稿 —— 大标题 + 4 张 KPI 卡（圆形渐变图标）+ 独立筛选条 + 白色表格卡；
 * 样式统一使用 koi/Element Plus 变量（--el-*、--el-radius-*、--metric-*），不写死品牌色。
 *
 * 说明：已移除「当前代理」卡片——当前代理 = 代理表第一条（host:port），
 * 由系统自动管理、无业务消费方（代理仅用于抓取/刷新），页面展示无操作价值；
 * 后端 /ms/server/proxy/current 端点保留（供其他业务方调用）。
 * @author CH
 * @since 4.0.0
 */
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { http, unwrapResult } from "@repo/utils";

const BASE = "/ms/server/proxy";

/** 读取窗口：覆盖一个抓取批次（500 条），超出时页面显式提示被截断 */
const LIST_LIMIT = 100;

/** 协议下拉（与后端白名单一致） */
const PROTOCOL_OPTIONS = [
  { label: "Http", value: "Http" },
  { label: "Https", value: "Https" },
  { label: "Socks4", value: "Socks4" },
  { label: "Socks5", value: "Socks5" },
];

/** 探测状态下拉（值与后端 ProxyService.STATUS_* 对齐；留空 = 全部，走 placeholder） */
const STATUS_OPTIONS = [
  { label: "未检测", value: "unchecked" },
  { label: "可达", value: "reachable" },
  { label: "不可达", value: "unreachable" },
];

interface FreeProxy {
  id: number;
  host: string;
  port: number;
  protocol?: string | null;
  source?: string | null;
  delay?: number | null;
  reachable?: number | null;
  checkTime?: number | null;
}

const freeList = ref<FreeProxy[]>([]);
const fetching = ref(false);
const checking = ref(false);
const loading = ref(false);
const filters = reactive({ protocol: "", status: "", keyword: "" });

const formVisible = ref(false);
const saving = ref(false);
const editingId = ref<number | null>(null);
const form = reactive({ host: "", port: 80, protocol: "Http", source: "" });

// ==================== KPI 汇总（当前读取窗口内） ====================

/** 总代理数 */
const kpiTotal = computed<number>(() => freeList.value.length);

/** Http 家族数量（Http + Https） */
const kpiHttp = computed<number>(
  () => freeList.value.filter(p => (p.protocol ?? "Http").toLowerCase().startsWith("http")).length,
);

/** Socks 家族数量（Socks4 + Socks5） */
const kpiSocks = computed<number>(
  () => freeList.value.filter(p => (p.protocol ?? "").toLowerCase().startsWith("socks")).length,
);

/** 已检测数量（以探测时间为准） */
const checkedCount = computed<number>(() => freeList.value.filter(p => p.checkTime != null).length);

/** 待检测数量（KPI 徽标） */
const uncheckedCount = computed<number>(() => kpiTotal.value - checkedCount.value);

/** 可用率：已检测中可达占比（未检测不参与分母，避免拉取后长期显示 0%） */
const kpiAvailability = computed<string>(() => {
  if (!checkedCount.value) return "0%";
  const ok = freeList.value.filter(p => p.checkTime != null && p.reachable).length;
  return `${Math.round((ok / checkedCount.value) * 100)}%`;
});

/** KPI 卡片定义（tone 映射到 koi 色板，见样式区） */
interface ProxyKpi {
  key: string;
  label: string;
  value: number | string;
  icon: string;
  tone: "violet" | "blue" | "green" | "orange";
  badge?: string;
}

const kpis = computed<ProxyKpi[]>(() => [
  { key: "total", label: "总代理数", value: kpiTotal.value, icon: "Tickets", tone: "violet", badge: `待检 ${uncheckedCount.value}` },
  { key: "http", label: "Http", value: kpiHttp.value, icon: "Postcard", tone: "blue" },
  { key: "socks", label: "Socks5", value: kpiSocks.value, icon: "CircleCheck", tone: "green" },
  { key: "availability", label: "可用率", value: kpiAvailability.value, icon: "DataAnalysis", tone: "orange" },
]);

/**
 * 统一 GET 请求（本页自行提示错误，故关掉全局 toast 以免重复）
 * @param path 子路径
 * @param params 查询参数
 * @param timeout 超时毫秒
 */
async function get<T>(path: string, params?: Record<string, unknown>, timeout?: number): Promise<T> {
  let req = http().get(BASE + path).noToast(true);
  if (params) req = req.query(params);
  if (timeout) req = req.timeout(timeout);
  return unwrapResult<T>(await req);
}

/** 加载代理列表（按当前筛选条件读表） */
async function loadList(): Promise<void> {
  loading.value = true;
  try {
    const list =
      (await get<FreeProxy[]>("/list", {
        protocol: filters.protocol || undefined,
        status: filters.status || undefined,
        keyword: filters.keyword.trim() || undefined,
        limit: LIST_LIMIT,
      })) ?? [];
    // 协议/来源在源里可能缺失，在这里补齐；主键与探测字段必须原样保留，否则行内检测与状态列都会失效
    freeList.value = list.map(p => ({
      ...p,
      protocol: p.protocol || "Http",
      source: p.source || "databay",
    }));
  } catch (e) {
    ElMessage.error(`加载代理列表失败: ${errText(e)}`);
  } finally {
    loading.value = false;
  }
}

/** 获取免费代理（后端抓取→清空表→录入——较慢——加载等待动画） */
async function fetchFree(): Promise<void> {
  fetching.value = true;
  try {
    const fetched = (await get<FreeProxy[]>("/free", undefined, 120000)) ?? [];
    await loadList();
    if (!fetched.length) ElMessage.warning("暂未获取到免费代理（外部代理源可能超时，代理表已保留）");
    else ElMessage.success(`获取到 ${fetched.length} 个免费代理（已录入代理表）`);
  } catch (e) {
    ElMessage.error(`获取失败: ${errText(e)}`);
  } finally {
    fetching.value = false;
  }
}

/** 批量检测（后端并发探测、全部收敛后才返回） */
async function checkAll(): Promise<void> {
  if (!freeList.value.length) {
    ElMessage.warning("代理表为空，请先获取免费代理或手工新增");
    return;
  }
  checking.value = true;
  try {
    const msg = await get<string>("/check", undefined, 300000);
    ElMessage.success(msg || "批量检测完成");
    await loadList();
  } catch (e) {
    ElMessage.error(`批量检测失败: ${errText(e)}`);
  } finally {
    checking.value = false;
  }
}

/**
 * 检测单个代理
 * @param row 代理行
 */
async function checkOne(row: FreeProxy): Promise<void> {
  if (row.id == null) {
    ElMessage.error("该行缺少代理主键，无法检测");
    return;
  }
  try {
    await get<string>(`/check/${row.id}`, undefined, 60000);
    ElMessage.success(`${row.host}:${row.port} 检测完成`);
    loadList();
  } catch (e) {
    ElMessage.error(`检测失败: ${errText(e)}`);
  }
}

/** 打开新增弹窗 */
function openCreate(): void {
  editingId.value = null;
  Object.assign(form, { host: "", port: 80, protocol: "Http", source: "" });
  formVisible.value = true;
}

/**
 * 打开编辑弹窗
 * @param row 代理行
 */
function openEdit(row: FreeProxy): void {
  editingId.value = row.id;
  Object.assign(form, {
    host: row.host,
    port: row.port,
    protocol: row.protocol || "Http",
    source: row.source ?? "",
  });
  formVisible.value = true;
}

/** 保存新增/编辑 */
async function saveForm(): Promise<void> {
  if (!form.host.trim()) {
    ElMessage.warning("请填写代理主机");
    return;
  }
  if (!Number.isInteger(form.port) || form.port < 1 || form.port > 65535) {
    ElMessage.warning("代理端口必须是 1~65535 之间的整数");
    return;
  }
  saving.value = true;
  const body = { host: form.host.trim(), port: form.port, protocol: form.protocol, source: form.source.trim() };
  try {
    const req = editingId.value == null
      ? http().post(BASE).noToast(true).data(body)
      : http().put(`${BASE}/${editingId.value}`).noToast(true).data(body);
    const saved = unwrapResult<FreeProxy>(await req);
    ElMessage.success(editingId.value == null ? "已新增代理" : "已更新代理（探测结果已重置）");
    formVisible.value = false;
    await loadList();
    if (saved) void checkOne(saved);
  } catch (e) {
    ElMessage.error(`保存失败: ${errText(e)}`);
  } finally {
    saving.value = false;
  }
}

/**
 * 删除单条代理
 * @param row 代理行
 */
async function removeOne(row: FreeProxy): Promise<void> {
  try {
    await ElMessageBox.confirm(`删除代理「${row.host}:${row.port}」？`, "删除确认", { type: "warning" });
  } catch {
    return;
  }
  try {
    unwrapResult<void>(await http().delete(`${BASE}/${row.id}`).noToast(true));
    ElMessage.success("已删除");
    loadList();
  } catch (e) {
    ElMessage.error(`删除失败: ${errText(e)}`);
  }
}

/** 清空代理表 */
async function clearAll(): Promise<void> {
  try {
    await ElMessageBox.confirm("清空整张代理表？该操作不可撤销（可重新获取免费代理）", "清空确认", { type: "warning" });
  } catch {
    return;
  }
  try {
    const removed = unwrapResult<number>(await http().delete(BASE).noToast(true));
    ElMessage.success(`已清空 ${removed ?? 0} 条代理`);
    loadList();
  } catch (e) {
    ElMessage.error(`清空失败: ${errText(e)}`);
  }
}

/**
 * 把异常还原成可读文案（拦截器以 {code,msg} 纯对象 reject，业务提示在 msg 上）
 * @param e 异常
 */
function errText(e: unknown): string {
  const err = e as { msg?: string; message?: string };
  return err?.msg || err?.message || String(e);
}

/**
 * 探测状态文案（未检测以探测时间为准，不能拿数据库缺省的 0 当「不可达」）
 * @param row 代理行
 */
function statusText(row: FreeProxy): string {
  if (row.checkTime == null) return "未检测";
  if (!row.reachable) return "不可达";
  return row.delay != null && row.delay > 1000 ? "延迟高" : "可达";
}

/**
 * 探测状态圆点样式（koi 语义色：success / warning / danger / placeholder）
 * @param row 代理行
 */
function statusClass(row: FreeProxy): string {
  const text = statusText(row);
  if (text === "未检测") return "is-unknown";
  if (text === "可达") return "is-ok";
  if (text === "延迟高") return "is-warn";
  return "is-error";
}

/**
 * 协议胶囊样式（Http 家族主色淡底，Socks/其它中性）
 * @param row 代理行
 */
function protocolClass(row: FreeProxy): string {
  const proto = (row.protocol ?? "Http").toLowerCase();
  if (proto.startsWith("http")) return "is-http";
  if (proto.startsWith("socks")) return "is-socks";
  return "is-other";
}

/**
 * 延迟着色（<1s 好 / <3s 偏高 / 其余差）
 * @param row 代理行
 */
function delayClass(row: FreeProxy): string {
  if (row.delay == null) return "";
  if (row.delay < 1000) return "is-good";
  if (row.delay < 3000) return "is-warn";
  return "is-bad";
}

/**
 * 最近检测时间
 * @param row 代理行
 */
function checkTimeText(row: FreeProxy): string {
  if (row.checkTime == null) return "";
  return new Date(row.checkTime).toLocaleString("zh-CN", { hour12: false });
}

onMounted(loadList);
</script>

<template>
  <div class="px">
    <!-- 页头：大标题 + 操作区（对齐 UI 稿） -->
    <header class="px-head">
      <div class="px-head__main">
        <h1 class="px-title">代理管理</h1>
        <p class="px-desc">免费代理获取 · 后台代理每次获取清空重录 · 页面从数据库读取</p>
      </div>
      <div class="px-head__actions">
        <ReButton icon="Plus" :show-text="true" size="large" @click="openCreate">新增代理</ReButton>
        <ReButton icon="MagicStick" :show-text="true" size="large" type="primary" :loading="fetching" @click="fetchFree">获取免费代理</ReButton>
        <ReButton icon="Monitor" :show-text="true" size="large" :loading="checking" @click="checkAll">批量检测</ReButton>
        <ReButton icon="Delete" :show-text="true" size="large" type="danger" :disabled="!freeList.length" @click="clearAll">清空代理表</ReButton>
      </div>
    </header>

    <!-- KPI 卡：总代理数 / Http / Socks5 / 可用率 -->
    <section class="px-kpis">
      <article v-for="k in kpis" :key="k.key" class="px-kpi" :class="`is-${k.tone}`">
        <span class="px-kpi__tile"><ReIcon :name="k.icon" :size="22" /></span>
        <div class="px-kpi__body">
          <div class="px-kpi__label">
            <span>{{ k.label }}</span>
            <span v-if="k.badge" class="px-kpi__badge">{{ k.badge }}</span>
          </div>
          <div class="px-kpi__value">{{ k.value }}</div>
        </div>
      </article>
    </section>

    <!-- 筛选条：关键词 / 协议 / 状态 + 窗口提示 + 查询（字段用包裹层定宽：ReInput 根为 contents、ReSelect 类透传到 el-select） -->
    <section class="px-panel px-filter">
      <div class="px-field px-field--search">
        <ReInput
          v-model="filters.keyword"
          placeholder="搜索代理主机..."
          clearable
          prefix-icon="Search"
          @keyup.enter="loadList"
        />
      </div>
      <div class="px-field">
        <ReSelect
          v-model="filters.protocol"
          placeholder="全部协议"
          clearable
          :options="PROTOCOL_OPTIONS"
          @change="loadList"
        />
      </div>
      <div class="px-field">
        <ReSelect
          v-model="filters.status"
          placeholder="请选择"
          clearable
          :options="STATUS_OPTIONS"
          @change="loadList"
        />
      </div>
      <span class="px-filter__meta">
        {{ freeList.length }} 条<template v-if="freeList.length >= LIST_LIMIT">（已达窗口上限，请缩小筛选）</template>
      </span>
      <ReButton icon="Search" :show-text="true" type="primary" :loading="loading" @click="loadList">查询</ReButton>
    </section>

    <!-- 代理列表（从数据表读取——快） -->
    <section class="px-panel px-table-card">
      <div v-if="fetching" class="px-fetching">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>正在获取免费代理…（抓取外部源较慢，请稍候）</span>
      </div>
      <ReEmpty v-else-if="!freeList.length" description="暂无代理，点击「获取免费代理」拉取代理源或「新增代理」手工录入" :image-size="80" />
      <ReTable
        v-else
        :data="freeList"
        :loading="loading"
        :columns="[
          { prop: 'addr', label: '代理地址', minWidth: 220, slot: 'addr' },
          { prop: 'protocol', label: '协议', width: 130, slot: 'protocol' },
          { prop: 'source', label: '来源', minWidth: 130 },
          { prop: 'delay', label: '延迟', width: 110, slot: 'delay' },
          { prop: 'reachable', label: '状态', width: 140, slot: 'reachable' },
          { prop: 'checkTime', label: '最近检测', width: 190, slot: 'checkTime' },
          { prop: 'actions', label: '操作', width: 170, slot: 'actions' },
        ]"
        size="default"
        :border="false"
        :stripe="false"
        table-id="proxy-list"
        class="proxy-table"
      >
        <template #col-addr="{ row }">
          <span class="px-addr mono">{{ row.host }}:<span class="px-addr__port">{{ row.port }}</span></span>
        </template>
        <template #col-protocol="{ row }">
          <span class="proto-pill" :class="protocolClass(row)">{{ row.protocol || 'Http' }}</span>
        </template>
        <template #col-delay="{ row }">
          <span v-if="row.delay != null && row.reachable" class="px-delay" :class="delayClass(row)">{{ row.delay }}ms</span>
          <span v-else class="px-dash">—</span>
        </template>
        <template #col-reachable="{ row }">
          <span class="px-status">
            <span class="px-status__dot" :class="statusClass(row)"></span>
            <span class="px-status__text">{{ statusText(row) }}</span>
          </span>
        </template>
        <template #col-checkTime="{ row }">
          <span v-if="row.checkTime != null" class="px-time mono">{{ checkTimeText(row) }}</span>
          <span v-else class="px-dash">—</span>
        </template>
        <template #col-actions="{ row }">
          <div class="px-ops">
            <ReButton icon="Connection" layout="square" title="检测" :disabled="row.id == null" class="px-op px-op--check" @click="checkOne(row)" />
            <ReButton icon="EditPen" layout="square" title="编辑" class="px-op px-op--edit" @click="openEdit(row)" />
            <ReButton icon="Delete" layout="square" title="删除" class="px-op px-op--delete" @click="removeOne(row)" />
          </div>
        </template>
      </ReTable>
    </section>

    <!-- 新增/编辑代理 -->
    <ReDialog v-model="formVisible" :title="editingId == null ? '新增代理' : '编辑代理'" width="480px" :close-on-click-modal="false">
      <div class="proxy-form">
        <ReFormItem label="代理主机" required>
          <ReInput v-model="form.host" placeholder="如 127.0.0.1 或 proxy.example.com" />
        </ReFormItem>
        <ReFormItem label="代理端口" required>
          <ReInputNumber v-model="form.port" :min="1" :max="65535" style="width:100%" />
        </ReFormItem>
        <ReFormItem label="协议" required>
          <ReSelect v-model="form.protocol" style="width:100%" :options="PROTOCOL_OPTIONS" />
        </ReFormItem>
        <ReFormItem label="来源">
          <ReInput v-model="form.source" placeholder="留空记为 manual" />
        </ReFormItem>
        <p v-if="editingId != null" class="px-hint">保存后探测结论会重置为未检测，需要时再点击行内「检测」。</p>
      </div>
      <template #footer>
        <ReButton @click="formVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="saving" @click="saveForm">保存</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
/* ============================================================
   代理管理（UI 稿对齐）—— 全部走 koi / Element Plus 变量
   ============================================================ */
.px {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 10px 12px 28px;
  color: var(--el-text-color-primary);
}

/* ---------- 页头 ---------- */
.px-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 6px 4px 0;
}
.px-head__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 12px;
}
.px-title {
  margin: 0;
  font-size: clamp(26px, 2.3vw, 34px);
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--el-text-color-primary);
}
.px-desc {
  margin: 8px 0 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}
@media (max-width: 900px) {
  .px-head { flex-direction: column; }
  .px-head__actions { justify-content: flex-start; }
}

/* ---------- KPI 卡 ---------- */
.px-kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px;
}
@media (max-width: 1280px) {
  .px-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 640px) {
  .px-kpis { grid-template-columns: 1fr; }
}

.px-kpi {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 22px 24px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.px-kpi:hover {
  transform: translateY(-2px);
  box-shadow: var(--el-box-shadow, var(--shadow-2));
  border-color: var(--el-border-color);
}

/* 圆形渐变图标：--tile 为色调令牌（koi 色板），浅深两端由 color-mix 与容器底色混合得出 */
.px-kpi__tile {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  flex: none;
  border-radius: var(--el-radius-full, 9999px);
  color: var(--el-color-white, var(--text-inverse));
  background: linear-gradient(135deg, color-mix(in srgb, var(--tile) 62%, var(--el-bg-color)), var(--tile));
  box-shadow: 0 8px 18px color-mix(in srgb, var(--tile) 32%, transparent);
}
.px-kpi.is-violet .px-kpi__tile { --tile: var(--brand-500, var(--el-color-primary)); }
.px-kpi.is-blue .px-kpi__tile { --tile: var(--metric-cpu, var(--el-color-primary)); }
.px-kpi.is-green .px-kpi__tile { --tile: var(--el-color-success); }
.px-kpi.is-orange .px-kpi__tile { --tile: var(--metric-disk, var(--el-color-warning)); }

.px-kpi__body { min-width: 0; }
.px-kpi__label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-regular);
}
.px-kpi__badge {
  padding: 1px 8px;
  font-size: 11px;
  line-height: 18px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  border-radius: var(--el-radius-full, 9999px);
}
.px-kpi__value {
  margin-top: 4px;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
}

/* ---------- 通用面板（筛选条 / 表格卡） ---------- */
.px-panel {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}

/* 筛选条 */
.px-filter {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 14px 16px;
}
/* 字段包裹层定宽（ReInput 根 display:contents、ReSelect 类落到内部 el-select，故套一层） */
.px-field { width: 160px; }
.px-field--search { width: 280px; }
.px-field :deep(.el-input),
.px-field :deep(.el-select) { width: 100%; }
.px-filter__meta {
  margin-left: auto;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}
@media (max-width: 900px) {
  .px-field,
  .px-field--search { width: 100%; }
  .px-filter__meta { margin-left: 0; }
}

/* 表格卡 */
.px-table-card { padding: 6px 8px 8px; }

.px-fetching {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 48px 24px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* 表格外观对齐 UI 稿：表头无底色、去大写、行距更松 */
.px-table-card :deep(.re-table) {
  padding: 0;
  background: transparent;
}
/* 吸顶表头背景改为卡片底色（全局 pages.css 会把表头底设成浅灰） */
.px-table-card :deep(.el-table) {
  --el-table-header-bg-color: var(--el-bg-color) !important;
}
.px-table-card :deep(.el-table th.el-table__cell) {
  padding: 14px 12px !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-transform: none !important;
  letter-spacing: 0 !important;
  color: var(--el-text-color-secondary);
  background: transparent !important;
}
.px-table-card :deep(.el-table td.el-table__cell) {
  padding: 15px 12px !important;
  font-size: 14px !important;
}

/* 列内容 */
.mono {
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-variant-numeric: tabular-nums;
}
.px-addr { font-size: 13.5px; color: var(--el-text-color-primary); }
.px-addr__port { color: var(--el-text-color-secondary); }
.px-time { font-size: 12.5px; color: var(--el-text-color-regular); }
.px-dash { color: var(--el-text-color-placeholder); }

/* 协议胶囊 */
.proto-pill {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 11px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  border-radius: var(--el-radius-full, 9999px);
  border: 1px solid var(--el-border-color);
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-extra-light);
}
.proto-pill.is-http {
  border-color: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.proto-pill.is-socks {
  border-color: var(--el-border-color);
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-extra-light);
}
.proto-pill.is-other {
  border-color: var(--el-border-color-lighter);
  color: var(--el-text-color-secondary);
  background: transparent;
}

/* 状态圆点 + 文案 */
.px-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.px-status__dot {
  width: 8px;
  height: 8px;
  flex: none;
  border-radius: var(--el-border-radius-circle, 50%);
  background: var(--el-text-color-placeholder);
}
.px-status__dot.is-ok { background: var(--el-color-success); }
.px-status__dot.is-warn { background: var(--el-color-warning); }
.px-status__dot.is-error { background: var(--el-color-danger); }
.px-status__dot.is-unknown { background: var(--el-text-color-placeholder); }

/* 延迟 */
.px-delay {
  font-weight: 600;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}
.px-delay.is-good { color: var(--el-color-success); }
.px-delay.is-warn { color: var(--el-color-warning); }
.px-delay.is-bad { color: var(--el-color-danger); }

/* 行内操作：柔和色块图标按钮 */
.px-ops { display: flex; gap: 8px; }
.px-op {
  border: none !important;
  border-radius: var(--el-radius-md, 8px) !important;
}
.px-op--check {
  background: var(--el-color-primary-light-9) !important;
  color: var(--el-color-primary) !important;
}
.px-op--check:hover {
  background: var(--el-color-primary-light-8) !important;
}
.px-op--edit {
  background: var(--el-fill-color) !important;
  color: var(--el-text-color-regular) !important;
}
.px-op--edit:hover {
  background: var(--el-fill-color-dark, var(--el-fill-color)) !important;
  color: var(--el-text-color-primary) !important;
}
.px-op--delete {
  background: var(--el-color-danger-light-9) !important;
  color: var(--el-color-danger) !important;
}
.px-op--delete:hover {
  background: var(--el-color-danger-light-8) !important;
}

/* 弹窗表单 */
.proxy-form { display: flex; flex-direction: column; gap: 10px; }
.px-hint { margin: 0; font-size: 12px; color: var(--el-text-color-secondary); }
</style>

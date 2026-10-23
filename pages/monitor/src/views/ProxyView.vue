<script setup lang="ts">
/**
 * 代理管理 —— 免费代理（业务）
 * 后台代理表 ms_proxy（每次获取免费代理时清空重录——自研抓取 databay 源）；
 * 页面免费代理从数据表读取（/ms/server/proxy/list——快）；
 * 获取免费代理走 /ms/server/proxy/free（抓取→清空→录入——较慢）。
 *
 * 视觉：4 张 ReStatCard 统计卡（紧凑档横排）+ 筛选/操作合并条 + 吃满剩余高度的表格卡。
 * 顶部原先的大标题 hero 已删除——页面标题由外壳面包屑承担（「监控管理 / 代理管理」），
 * hero 上的 4 个操作按钮已合并到「查询」按钮右侧，改成图标 + tip（ReButton square 布局），
 * 单行内完成筛选与全部操作，不再额外占一整块纵向空间。
 * 样式统一使用 koi/Element Plus 变量（--el-*、--el-radius-*、--metric-*），不写死品牌色。
 *
 * 说明：已移除「当前代理」卡片——当前代理 = 代理表第一条（host:port），
 * 由系统自动管理、无业务消费方（代理仅用于抓取/刷新），页面展示无操作价值；
 * 后端 /ms/server/proxy/current 端点保留（供其他业务方调用）。
 * @author CH
 * @since 4.0.0
 */
import { message } from "@repo/core";
import { computed, onMounted, reactive, ref } from "vue";
import type { Component } from "vue";
import { ElMessageBox } from "element-plus";
import { CircleCheck, DataAnalysis, Postcard, Tickets } from "@element-plus/icons-vue";
import { http, unwrapResult } from "@repo/utils";
import ReStatCard from "@repo/ui/re-stat-card";

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

/** 待检测数量（总代理数卡的描述） */
const uncheckedCount = computed<number>(() => kpiTotal.value - checkedCount.value);

/** 已检测且可达的数量 */
const reachableCount = computed<number>(
  () => freeList.value.filter(p => p.checkTime != null && p.reachable).length,
);

/** 可用率：已检测中可达占比（未检测不参与分母，避免拉取后长期显示 0%） */
const kpiAvailability = computed<string>(() => {
  if (!checkedCount.value) return "0%";
  return `${Math.round((reachableCount.value / checkedCount.value) * 100)}%`;
});

/**
 * KPI 卡片定义。
 *
 * <p>{@code icon} 必须是组件（ReStatCard 内部走 {@code <component :is="icon" />}），
 * 所以这里直接引用 @element-plus/icons-vue 的组件，不再传图标名字符串；
 * {@code iconColor} 沿用原有的 koi 令牌（原先散在样式区的 --tile 值上移到数据里，
 * 不写死品牌色）。</p>
 */
interface ProxyKpi {
  key: string;
  title: string;
  value: number | string;
  desc: string;
  icon: Component;
  iconColor: string;
}

const kpis = computed<ProxyKpi[]>(() => [
  {
    key: "total",
    title: "总代理数",
    value: kpiTotal.value,
    desc: `待检 ${uncheckedCount.value}`,
    icon: Tickets,
    iconColor: "var(--brand-500, var(--el-color-primary))",
  },
  {
    key: "http",
    title: "Http",
    value: kpiHttp.value,
    desc: "Http + Https",
    icon: Postcard,
    iconColor: "var(--metric-cpu, var(--el-color-primary))",
  },
  {
    key: "socks",
    title: "Socks5",
    value: kpiSocks.value,
    desc: "含 Socks4",
    icon: CircleCheck,
    iconColor: "var(--el-color-success)",
  },
  {
    key: "availability",
    title: "可用率",
    value: kpiAvailability.value,
    desc: `可达 ${reachableCount.value} / 已检 ${checkedCount.value}`,
    icon: DataAnalysis,
    iconColor: "var(--metric-disk, var(--el-color-warning))",
  },
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
    message.error(`加载代理列表失败: ${errText(e)}`);
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
    if (!fetched.length) message.warning("暂未获取到免费代理（外部代理源可能超时，代理表已保留）");
    else message.success(`获取到 ${fetched.length} 个免费代理（已录入代理表）`);
  } catch (e) {
    message.error(`获取失败: ${errText(e)}`);
  } finally {
    fetching.value = false;
  }
}

/** 批量检测（后端并发探测、全部收敛后才返回） */
async function checkAll(): Promise<void> {
  if (!freeList.value.length) {
    message.warning("代理表为空，请先获取免费代理或手工新增");
    return;
  }
  checking.value = true;
  try {
    const msg = await get<string>("/check", undefined, 300000);
    message.success(msg || "批量检测完成");
    await loadList();
  } catch (e) {
    message.error(`批量检测失败: ${errText(e)}`);
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
    message.error("该行缺少代理主键，无法检测");
    return;
  }
  try {
    await get<string>(`/check/${row.id}`, undefined, 60000);
    message.success(`${row.host}:${row.port} 检测完成`);
    loadList();
  } catch (e) {
    message.error(`检测失败: ${errText(e)}`);
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
    message.warning("请填写代理主机");
    return;
  }
  if (!Number.isInteger(form.port) || form.port < 1 || form.port > 65535) {
    message.warning("代理端口必须是 1~65535 之间的整数");
    return;
  }
  saving.value = true;
  const body = { host: form.host.trim(), port: form.port, protocol: form.protocol, source: form.source.trim() };
  try {
    const req = editingId.value == null
      ? http().post(BASE).noToast(true).data(body)
      : http().put(`${BASE}/${editingId.value}`).noToast(true).data(body);
    const saved = unwrapResult<FreeProxy>(await req);
    message.success(editingId.value == null ? "已新增代理" : "已更新代理（探测结果已重置）");
    formVisible.value = false;
    await loadList();
    if (saved) void checkOne(saved);
  } catch (e) {
    message.error(`保存失败: ${errText(e)}`);
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
    message.success("已删除");
    loadList();
  } catch (e) {
    message.error(`删除失败: ${errText(e)}`);
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
    message.success(`已清空 ${removed ?? 0} 条代理`);
    loadList();
  } catch (e) {
    message.error(`清空失败: ${errText(e)}`);
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
    <!-- KPI 卡：总代理数 / Http / Socks5 / 可用率
         用 ReStatCard 紧凑档——横排密集概览（图标在左、数值+标题+描述在右），
         四张并排只占一行，把纵向空间让给下面的表格。 -->
    <section class="px-kpis">
      <ReStatCard
        v-for="k in kpis"
        :key="k.key"
        size="compact"
        :title="k.title"
        :value="k.value"
        :desc="k.desc"
        :icon="k.icon"
        :icon-color="k.iconColor"
      />
    </section>

    <!-- 筛选条 + 操作区合并成一行：关键词 / 协议 / 状态 + 窗口提示 + 查询 + 图标操作组。
         原顶部 hero 上的 4 个按钮已全部合并到「查询」右侧，改成图标 + tip
         （ReButton square 布局自带 el-tooltip），不再额外占一整块纵向空间；
         「每次获取清空重录」的副作用说明从 hero 副标题挪到「获取免费代理」的 tip 里。
         字段用包裹层定宽：ReInput 根为 contents、ReSelect 类透传到 el-select。 -->
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
      <div class="px-toolbar-ops">
        <ReButton icon="Plus" layout="square" tip="新增代理" @click="openCreate" />
        <ReButton
          icon="MagicStick"
          layout="square"
          type="primary"
          tip="获取免费代理（抓取外部源并清空重录）"
          :loading="fetching"
          @click="fetchFree"
        />
        <ReButton icon="Monitor" layout="square" tip="批量检测" :loading="checking" @click="checkAll" />
        <ReButton
          icon="Delete"
          layout="square"
          type="danger"
          tip="清空代理表"
          :disabled="!freeList.length"
          @click="clearAll"
        />
      </div>
    </section>

    <!-- 代理列表（从数据表读取——快）。卡片本身是 flex:1 + min-height:0，
         ReTable 的 fill 由此拿到确定高度，表体内部滚动、表头固定，页面不再出现外层滚动条。 -->
    <section class="px-panel px-table-card">
      <div v-if="fetching" class="px-fetching">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>正在获取免费代理…（抓取外部源较慢，请稍候）</span>
      </div>
      <div v-else-if="!freeList.length" class="px-table-empty">
        <ReEmpty description="暂无代理，点击「获取免费代理」拉取代理源或「新增代理」手工录入" :image-size="80" />
      </div>
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
   代理管理 —— 全部走 koi / Element Plus 变量
   布局：整页 flex 列（KPI / 筛选条 固定高，表格卡 flex:1 吃满剩余高度）
   ============================================================ */
.px {
  display: flex;
  flex-direction: column;
  gap: 14px;
  /* 撑满外壳主区（.main 是 grid 项，本身高度确定；未设这两条时百分比高度无基准，
     表格卡的 flex:1 会因为父级是内容高度而拿不到空间）。 */
  height: 100%;
  min-height: 0;
  color: var(--el-text-color-primary);
}

/* ---------- KPI 卡（ReStatCard 紧凑档横排，卡片外壳规格由组件基线提供） ---------- */
.px-kpis {
  flex: none;
  display: grid;
  /* 紧凑档单卡很窄，用 auto-fit 让 4 张按可用宽度自动换行，无需断点硬切 */
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

/* ---------- 通用面板（筛选条 / 表格卡） ---------- */
.px-panel {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}

/* 筛选条 + 操作区合并成一行 */
.px-filter {
  flex: none;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px;
}
/* 操作图标组：与「查询」之间用一条竖线分隔，视觉上区分「筛选」与「操作」。
   注意类名不能叫 px-ops —— 那是表格行内操作按钮的容器（见样式区末尾）。 */
.px-toolbar-ops {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 10px;
  border-left: 1px solid var(--el-border-color-lighter);
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
  /* 换行后竖线分隔不再有意义 */
  .px-toolbar-ops { padding-left: 0; border-left: none; }
}

/* 表格卡：flex:1 + min-height:0 才能吃满剩余高度。
   min-height 默认是 auto，长内容（表格行多时）会把卡片顶高、外层 .main 出现滚动条，
   ReTable 的 fill 也因此拿不到确定高度；置 0 后高度由 flex 精确分配、表体内部滚动。 */
.px-table-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 6px 8px 8px;
}

.px-fetching {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* 空态：占满表格卡剩余高度并居中，避免贴在卡片顶部 */
.px-table-empty {
  flex: 1;
  display: grid;
  place-items: center;
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

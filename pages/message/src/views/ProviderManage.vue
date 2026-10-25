<script setup lang="ts">
/**
 * 消息提供商管理页面（主入口）
 *
 * 顶部展示全部统计概览（提供商 / 模板 / 日志），
 * 提供商列表支持查看该提供商的模板管理与推送日志。
 */
import { message } from "@repo/core";
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { OfficeBuilding, Message, Document, Plus, Search, Refresh, Memo } from "@element-plus/icons-vue";
import { deleteProvider, listChannels, pageForLog, pageForProvider, pageForTemplate, updateProvider } from "../api/messageApi";
import type { MessageProvider } from "../api/types";
import ReProviderFormDialog from "../components/ReProviderFormDialog.vue";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
import ReButton from "@repo/ui/re-button";
import ReInput from "@repo/ui/re-input";
import ReSelect from "@repo/ui/re-select";
import ReEmpty from "@repo/ui/re-empty";
import ReSectionHead from "@repo/ui/re-section-head";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReTag from "@repo/ui/re-tag";

const router = useRouter();

// 查询条件
const query = reactive<{
  page: number;
  pageSize: number;
  sysMessageProviderName?: string;
  sysMessageProviderType?: string;
}>({
  page: 1,
  pageSize: 10,
  sysMessageProviderName: undefined,
  sysMessageProviderType: undefined,
});

// 列表数据
const list = ref<MessageProvider[]>([]);
const total = ref(0);
const loading = ref(false);

// 顶部统计概览
const stats = reactive<{
  providerTotal: number;
  templateTotal: number;
  logTotal: number;
}>({
  providerTotal: 0,
  templateTotal: 0,
  logTotal: 0,
});
const statsLoading = ref(false);

// 弹窗状态
const dialogVisible = ref(false);
const form = reactive<MessageProvider>({});
const saving = ref(false);

/** 提供商表列配置（原模板里的 el-table-column 收敛到数组；带 #default 的列配 slot + #col-<slot>） */
const providerColumns: ReTableColumn[] = [
  { prop: "sysMessageProviderName", label: "提供商", minWidth: 180, slot: "sysMessageProviderName" },
  { prop: "sysMessageProviderType", label: "类型", width: 100, slot: "sysMessageProviderType" },
  { prop: "sysMessageProviderVender", label: "渠道", minWidth: 140, slot: "sysMessageProviderVender" },
  { prop: "sysMessageProviderEndpoint", label: "端点地址", minWidth: 160, showOverflowTooltip: true, slot: "sysMessageProviderEndpoint" },
  { prop: "interval", label: "防抖间隔", width: 110, slot: "interval" },
  { prop: "status", label: "状态", width: 90, slot: "status" },
  { prop: "actions", label: "操作", width: 250, fixed: "right", slot: "actions" },
];

// 渠道标识 → 中文名称映射（来自 SPI 描述，列表展示用）
const channelLabelMap = ref<Record<string, string>>({});

/** 加载渠道信息，构建渠道名称映射 */
async function loadChannels() {
  try {
    const res = await listChannels();
    const map: Record<string, string> = {};
    (res?.data ?? []).forEach((c) => {
      if (c.channel) {
        map[c.channel.toLowerCase()] = c.label || c.channel;
      }
    });
    channelLabelMap.value = map;
  } catch {
    channelLabelMap.value = {};
  }
}

/** 渠道中文名：SPI 键为大写，库里的厂家编码可能是小写，统一按小写比对 */
function channelLabel(vender?: string) {
  if (!vender) return "-";
  return channelLabelMap.value[vender.toLowerCase()] ?? vender;
}

/** 端点展示：后端允许用 Webhook 地址代替端点，列表同样兜底 */
function endpointOf(row: MessageProvider) {
  return row.sysMessageProviderEndpoint || row.sysMessageProviderWebhookUrl || "";
}

const providerTypeOptions = [
  { label: "邮件", value: "EMAIL" },
  { label: "短信", value: "SMS" },
  { label: "微信", value: "WECHAT" },
  { label: "钉钉", value: "DINGDING" },
  { label: "飞书", value: "FEISHU" },
];

// 顶部统计卡片配置
const statCards = computed(() => [
  {
    label: "提供商总数",
    value: stats.providerTotal,
    desc: "点击查看全部渠道",
    icon: OfficeBuilding,
    onClick: loadList,
  },
  {
    label: "消息模板",
    value: stats.templateTotal,
    desc: "点击管理全部模板",
    icon: Message,
    onClick: openAllTemplates,
  },
  {
    label: "推送日志",
    value: stats.logTotal,
    desc: "点击查看全部日志",
    icon: Document,
    onClick: openAllLogs,
  },
]);

/** 查询列表 */
async function loadList() {
  loading.value = true;
  try {
    const res = await pageForProvider(query);
    list.value = res?.data?.data ?? [];
    total.value = res?.data?.total ?? 0;
  } catch (e) {
    message.error((e as Error)?.message ?? "提供商列表加载失败");
  } finally {
    loading.value = false;
  }
}

/** 加载顶部统计概览 */
async function loadStats() {
  statsLoading.value = true;
  try {
    const [providers, templates, logs] = await Promise.all([
      pageForProvider({ page: 1, pageSize: 1 }),
      pageForTemplate({ page: 1, pageSize: 1 }),
      pageForLog({ page: 1, pageSize: 1 }),
    ]);
    stats.providerTotal = providers?.data?.total ?? 0;
    stats.templateTotal = templates?.data?.total ?? 0;
    stats.logTotal = logs?.data?.total ?? 0;
  } catch (e) {
    message.error((e as Error)?.message ?? "统计概览加载失败");
  } finally {
    statsLoading.value = false;
  }
}

/** 重置查询 */
function handleReset() {
  query.sysMessageProviderName = undefined;
  query.sysMessageProviderType = undefined;
  query.page = 1;
  loadList();
}

/** 打开新增弹窗 */
function handleAdd() {
  Object.keys(form).forEach((k) => delete (form as Record<string, unknown>)[k]);
  Object.assign(form, { sysMessageProviderStatus: 1, sysMessageProviderInterval: 1 });
  dialogVisible.value = true;
}

/** 打开编辑弹窗 */
function handleEdit(row: MessageProvider) {
  Object.assign(form, { ...row });
  dialogVisible.value = true;
}

/** 删除 */
async function handleDelete(row: MessageProvider) {
  await ElMessageBox.confirm(`确认删除提供商「${row.sysMessageProviderName}」？`, "提示", {
    type: "warning",
  });
  await deleteProvider(row.sysMessageProviderId!);
  message.success("删除成功");
  loadList();
  loadStats();
}

/** 启停用切换 */
async function handleStatus(row: MessageProvider) {
  await updateProvider({
    ...row,
    sysMessageProviderStatus: row.sysMessageProviderStatus === 1 ? 0 : 1,
  });
  message.success(row.sysMessageProviderStatus === 1 ? "已启用" : "已停用");
  loadList();
}

/** 查看某提供商的模板管理 */
function openTemplates(providerId: number) {
  router.push({ path: "/message/template", query: { providerId } });
}

/** 查看某提供商的日志 */
function openLogs(providerId: number) {
  router.push({ path: "/message/log", query: { providerId } });
}

/** 查看全部模板 / 日志 */
function openAllTemplates() {
  router.push({ path: "/message/template" });
}
function openAllLogs() {
  router.push({ path: "/message/log" });
}

/** 保存回调 */
function handleSaved() {
  loadList();
  loadStats();
}

/** 分页 */
const pagination = computed(() => ({
  total: total.value,
  page: query.page,
  pageSize: query.pageSize,
}));

function handlePageChange(p: number) {
  query.page = p;
  loadList();
}

onMounted(() => {
  loadList();
  loadStats();
  loadChannels();
});
</script>

<!--
  现代化视图：ReSectionHead 页头 + koi 令牌统计概览条 + 筛选卡 + 表格卡片外壳 + ReEmpty 空态。

  ReTable 的列 slot（col-sysMessageProviderName / col-* 等）、分页回调、统计卡 onClick 全部原样保留，
  仅重排外壳与样式；表内启停 el-switch 保持受控（:model-value + @change）不变。
  统计概览改用 koi 令牌的「大数字 + 顶部色条」卡片表达，整卡可点击沿用 statCards 的 onClick。
-->
<template>
  <div class="mp-page">
    <ReSectionHead
      class="mp-head"
      title="消息提供商"
      description="统一管理推送渠道，维护渠道下的消息模板与发送日志"
    >
      <template #actions>
        <ReButton show-text icon="Plus" type="primary" size="small" tip="新增提供商" @click="handleAdd">新增提供商</ReButton>
      </template>
    </ReSectionHead>

    <!-- 统计概览：koi 令牌 + 大数字 + 顶部色条，整卡可点击 -->
    <ReSkeleton :loading="statsLoading" :rows="2" :count="3" animated>
      <div class="stat-grid" role="group" aria-label="消息提供商概览">
        <div
          v-for="(card, i) in statCards"
          :key="card.label"
          class="stat-card"
          role="button"
          tabindex="0"
          @click="card.onClick"
          @keydown.enter="card.onClick"
        >
          <span class="stat-label">{{ card.label }}</span>
          <span class="stat-value">{{ card.value }}</span>
          <span class="stat-trend">{{ card.desc }}</span>
        </div>
      </div>
    </ReSkeleton>

    <!-- 查询区域 -->
    <div class="filter-card">
      <ReInput
        v-model="query.sysMessageProviderName"
        class="filter-field filter-field--search"
        prefix-icon="Search"
        placeholder="提供商名称"
        clearable
        @keyup.enter="loadList"
      />
      <ReSelect
        v-model="query.sysMessageProviderType"
        class="filter-field filter-field--select"
        placeholder="提供商类型"
        clearable
        :data="providerTypeOptions"
      />
      <div class="filter-spacer" />
      <ReButton icon="Search" size="small" type="primary" tip="按条件查询" @click="loadList">查询</ReButton>
      <ReButton icon="Refresh" size="small" tip="重置查询条件" @click="handleReset">重置</ReButton>
    </div>

    <!-- 提供商列表 -->
    <div class="table-card">
      <!-- 表格统一 ReTable（engine="element" 沿用原 el-table 的 DOM）；
           原表没有 border → :settings="{ border: false }"；分页仍由下方 el-pagination 自管。 -->
      <ReTable
        :loading="loading"
        :data="list"
        :columns="providerColumns"
        stripe
        class="w-full"
        engine="element"
        :pagination="false"
        :toolbar="false"
        :layout-table="{ minHeight: 0 }"
        :settings="{ border: false }"
        empty-text="暂无提供商"
      >
        <template #col-sysMessageProviderName="{ row }">
          <div class="provider-name">
            <div class="provider-name__icon">
              <el-icon :size="16" color="var(--brand-500)"><OfficeBuilding /></el-icon>
            </div>
            <div>
              <div class="provider-name__main">{{ row.sysMessageProviderName }}</div>
              <div class="provider-name__sub">{{ row.sysMessageProviderCode }}</div>
            </div>
          </div>
        </template>
        <template #col-sysMessageProviderType="{ row }">
          <ReTag effect="plain" type="info">{{ row.sysMessageProviderType }}</ReTag>
        </template>
        <template #col-sysMessageProviderVender="{ row }">
          <span class="cell-sub">
            {{ channelLabel(row.sysMessageProviderVender) }}
          </span>
        </template>
        <template #col-sysMessageProviderEndpoint="{ row }">
          <span class="cell-sub">{{ endpointOf(row) || "-" }}</span>
        </template>
        <template #col-interval="{ row }">
          <template v-if="row.sysMessageProviderInterval && row.sysMessageProviderInterval > 0">
            <span class="cell-sub">{{ row.sysMessageProviderInterval }} 分钟</span>
          </template>
          <template v-else-if="row.sysMessageProviderInterval === 0">
            <span class="cell-sub cell-sub--small">不限</span>
          </template>
          <template v-else>
            <span class="cell-sub cell-sub--small">默认 1 分钟</span>
          </template>
        </template>
        <template #col-status="{ row }">
          <el-switch
            :model-value="row.sysMessageProviderStatus === 1"
            @change="handleStatus(row)"
          />
        </template>
        <template #col-actions="{ row }">
          <div class="row-actions">
            <ReButton show-text icon="Memo" size="small" type="primary" tip="管理该提供商的模板" @click="openTemplates(row.sysMessageProviderId)">
              模板
            </ReButton>
            <ReButton show-text icon="Document" size="small" type="primary" tip="查看该提供商的推送日志" @click="openLogs(row.sysMessageProviderId)">
              日志
            </ReButton>
            <ReButton show-text size="small" tip="编辑提供商" @click="handleEdit(row)">编辑</ReButton>
            <ReButton show-text size="small" type="danger" tip="删除提供商" @click="handleDelete(row)">删除</ReButton>
          </div>
        </template>
        <!-- 空态走 ReEmpty：表格内的空态换成扁平空态，提示语仍由 empty-text 驱动 -->
        <template #empty="{ description }">
          <ReEmpty v-if="!loading" layout="modern" :description="description">
            <ReButton show-text icon="Plus" type="primary" size="small" @click="handleAdd">新增第一个提供商</ReButton>
          </ReEmpty>
        </template>
      </ReTable>
      <div class="table-card__pager">
        <el-pagination
          :total="pagination.total"
          :current-page="pagination.page"
          :page-size="pagination.pageSize"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <ReProviderFormDialog
      v-model:visible="dialogVisible"
      :model="form"
      @update:model="(val) => Object.assign(form, val)"
      @save="handleSaved"
    />
  </div>
</template>

<style scoped lang="scss">
.mp-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ===== 统计概览条 ===== */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.stat-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
  overflow: hidden;
  padding: 14px 16px;
  cursor: pointer;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s var(--ease-out), transform 0.2s var(--ease-out);
}
.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--accent, var(--brand-500));
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}
.stat-card:nth-child(1) { --accent: var(--brand-500); }
.stat-card:nth-child(2) { --accent: var(--status-info); }
.stat-card:nth-child(3) { --accent: var(--status-warning); }
.stat-label {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--text-secondary);
}
.stat-value {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}
.stat-trend {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== 筛选卡 ===== */
.filter-card {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 12px;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}
.filter-field--search {
  width: 240px;
}
.filter-field--select {
  width: 180px;
}
.filter-spacer {
  flex: 1 1 auto;
}

/* ===== 表格壳 ===== */
.table-card {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}
.table-card > :deep(.re-table) {
  flex: 1 1 auto;
  min-height: 0;
}
.table-card :deep(.rm-empty) {
  box-sizing: border-box;
  width: 100%;
  padding: 8px 0;
}
.table-card__pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

/* ===== 表内单元格 ===== */
.provider-name {
  display: flex;
  align-items: center;
  gap: 10px;
}
.provider-name__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--bg-fill);
  flex-shrink: 0;
}
.provider-name__main {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.3;
}
.provider-name__sub {
  font-size: 12px;
  color: var(--text-tertiary);
}
.cell-sub {
  font-size: 13px;
  color: var(--text-secondary);
}
.cell-sub--small {
  font-size: 12px;
}
.row-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
}

/* ===== 响应式：移动端 2 列概览 + 筛选占满 ===== */
@media (max-width: 768px) {
  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .stat-card:nth-child(3) {
    grid-column: span 2;
  }
  .filter-field--search,
  .filter-field--select {
    width: 100%;
  }
  .filter-spacer {
    flex: none;
    width: 100%;
  }
}

/* ===== 减少动态效果 ===== */
@media (prefers-reduced-motion: reduce) {
  .stat-card {
    transition: none;
  }
  .stat-card:hover {
    transform: none;
  }
}
</style>
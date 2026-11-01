<!--
  模板管理 —— 控制台侧的模板库台账

  职责：
    - 调用 `@pages/template` 的 templateApi 获取模板库分页数据；
    - 展示模板名称 / 来源 / 状态 / 语言 / 类型 / 创建时间；
    - 操作列提供「设计 / 预览」入口（设计器、预览页由 @pages/template 承载，
      本侧只负责加气口和台账）；
    - 提供绘制描述的本地只读渲染（ReDrawer），供监控侧直接查看模板内容。

  接入：侧边栏 `createMonitorRoutes()` 的「模板管理」分组下（path /templates）。

  注意：监控侧不承载 template 路由（由 @pages/template 提供 /template/* 页），
  设计器/预览页的跳转本侧只做入口，未在 monitor 路由注册时向用户说明原因。

  @author CH
  @since 4.0.0.46
-->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { message } from '@repo/core';
import ReTable, { type ReTableColumn, type ReTableLoadParams, type RePageResult } from '@repo/ui/re-table';
import ReDrawer from '@repo/ui/re-drawer';
import ReButton from '@repo/ui/re-button';
import ReIcon from '@repo/ui/re-icon';
import ReInput from '@repo/ui/re-input';
import ReSelect from '@repo/ui/re-select';
// 相对引用：pages/template 是同一工作区的页面包，避免 monitor 侧 node_modules 未 link 该包
import type { TemplateInfo, PageResult, TemplateStatus, TemplateSource, TemplateType, TemplateLanguage } from '../../../../pages/template/src/types/template';
import { templateApi } from '../../../../pages/template/src/api/templateApi';

const router = useRouter();

// ==================== 列表状态（由 loader 驱动） ====================
const loading = ref(false);
const list = ref<TemplateInfo[]>([]);
const total = ref(0);
const keyword = ref('');
const sourceFilter = ref('');

/** 页码 / 每页条数 */
const page = ref(1);
const pageSize = ref(20);

/** 当前选中的后台字段名（开发期 template 后端未注入 monitor 时的 Mock 标识） */
const mockDebug = ref(false);

// ------------------- 字段归一：屏蔽后端 camelCase / 小写两种键名 -------------------
/** 把后端返回的原始行对象对齐到页面的 TS 类型（小写字段） */
function normalizeRow(raw: Record<string, unknown>): TemplateInfo {
  if (!raw) return {
    id: '',
    name: '—',
    subtitle: '',
    language: 'html' as TemplateLanguage,
    type: 'document' as TemplateType,
    status: 'draft' as TemplateStatus,
    source: 'hiprint' as TemplateSource,
    providerId: '',
    sourceId: '',
    sourceProviderId: '',
    creator: '',
    modifier: '',
    createdAt: '',
    updatedAt: '',
    content: '',
    remark: '',
  };
  return {
    id: String(raw.templateInfoId ?? raw.id ?? ''),
    name: String(raw.templateInfoName ?? raw.name ?? '—'),
    subtitle: String(raw.templateInfoSubtitle ?? raw.subtitle ?? ''),
    language: String(raw.templateInfoLanguage ?? raw.language ?? 'html') as TemplateLanguage,
    type: String(raw.templateInfoType ?? raw.type ?? 'document') as TemplateType,
    status: String(raw.templateInfoStatus ?? raw.status ?? 'draft') as TemplateStatus,
    source: String(raw.templateInfoSource ?? raw.source ?? 'hiprint') as TemplateSource,
    providerId: String(raw.templateInfoProvider ?? raw.providerId ?? ''),
    sourceId: String(raw.templateInfoSourceId ?? raw.sourceId ?? ''),
    sourceProviderId: String(raw.templateInfoProvider ?? raw.sourceProviderId ?? ''),
    creator: String(raw.templateInfoCreator ?? raw.creator ?? ''),
    modifier: String(raw.templateInfoModifier ?? raw.modifier ?? ''),
    createdAt: String(raw.templateInfoCreatedAt ?? raw.createdAt ?? ''),
    updatedAt: String(raw.templateInfoUpdatedAt ?? raw.updatedAt ?? ''),
    content: String(raw.templateInfoContent ?? raw.content ?? ''),
    remark: String(raw.templateInfoRemark ?? raw.remark ?? ''),
  };
}

// ------------------- 开发期 Mock 数据（仅 demo） -------------------
/**
 * 开发期 Mock：monitor 后端的 jar 不依赖 `spring-support-template-starter`，
 * 所以 `/api/template/page` 走不到 template 后端——这里用模拟数据把台账 UI 的效果铺开（见 `load`）。
 */
const mockTemplates: TemplateInfo[] = [
  {
    id: 'tpl-printer-001',
    name: '发货单模板（openspecer）',
    subtitle: '标准发货单 / A4 横向',
    language: 'html',
    type: 'document',
    status: 'online',
    source: 'hiprint',
    providerId: '',
    sourceId: '',
    sourceProviderId: '',
    creator: 'admin',
    modifier: 'admin',
    createdAt: '2026-10-28T16:30:00.000Z',
    updatedAt: '2026-10-29T09:15:00.000Z',
    content: '<template><div>demo</div></template>',
    remark: 'dev 示例数据',
  },
  {
    id: 'tpl-printer-002',
    name: '发货单模板（企业版）',
    subtitle: '企业版票据 / A5 纵向',
    language: 'vue',
    type: 'document',
    status: 'draft',
    source: 'hiprint',
    providerId: '',
    sourceId: '',
    sourceProviderId: '',
    creator: 'demo',
    modifier: '',
    createdAt: '2026-10-30T10:00:00.000Z',
    updatedAt: '2026-10-30T10:00:00.000Z',
    content: '<template><div>demo</div></template>',
    remark: 'dev 示例数据',
  },
  {
    id: 'tpl-msg-001',
    name: '营销短信模板',
    subtitle: '阿里云短信 · 营销场景',
    language: 'json',
    type: 'sms',
    status: 'online',
    source: 'message',
    providerId: 'prv-alisvc-001',
    sourceId: 'smsgtpl-001',
    sourceProviderId: 'prv-alisvc-001',
    creator: 'msgadmin',
    modifier: 'msgadmin',
    createdAt: '2026-10-29T08:20:00.000Z',
    updatedAt: '2026-10-30T12:40:00.000Z',
    content: '{"content":"${name}:您有${num}件待办"}',
    remark: 'dev 示例数据',
  },
  {
    id: 'tpl-pap-001',
    name: '高考试卷-模板A',
    subtitle: '试卷头/页眉页脚/纸张规格',
    language: 'html',
    type: 'other',
    status: 'offline',
    source: 'paper',
    providerId: 'prv-edu-001',
    sourceId: 'paptpl-001',
    sourceProviderId: 'prv-edu-001',
    creator: 'teacher',
    modifier: 'teacher',
    createdAt: '2026-10-25T22:00:00.000Z',
    updatedAt: '2026-10-26T11:30:00.000Z',
    content: '<template><div>paper demo</div></template>',
    remark: 'dev 示例数据',
  },
];

/** 时间格式化（展示用） */
function fmtTimeOf(v?: string): string {
  if (!v) return '—';
  try {
    const d = new Date(v);
    if (isNaN(d.getTime())) return v;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return v;
  }
}

/** 时间展示（ReTable formatter） */
function fmtTime(_row: Record<string, unknown>, _col: ReTableColumn, cellValue: unknown): string {
  return fmtTimeOf(cellValue as string | undefined);
}

/** 四色状态标签 */
function statusStyle(row: Record<string, unknown>): string {
  const s = row.templateInfoStatus as string | undefined;
  return {
    online: 'success',
    draft: 'warning',
    offline: 'info',
  }[s ?? ''] ?? '';
}

/** 四色状态文本 */
function statusText(_row: Record<string, unknown>, _col: ReTableColumn, cellValue: unknown): string {
  const s = cellValue as string | undefined;
  return { online: '已上线', draft: '草稿', offline: '已下线' }[s ?? ''] ?? s ?? '—';
}

/** 来源文本 */
function sourceText(_row: Record<string, unknown>, _col: ReTableColumn, cellValue: unknown): string {
  const s = cellValue as string | undefined;
  return { hiprint: 'hiprint', message: '消息', paper: '组卷' }[s ?? ''] ?? s ?? '—';
}

/** 语言文本 */
function languageText(_row: Record<string, unknown>, _col: ReTableColumn, cellValue: unknown): string {
  const s = cellValue as string | undefined;
  return { html: 'HTML', vue: 'Vue', jsx: 'JSX', json: 'JSON' }[s ?? ''] ?? s ?? '—';
}

/** 类型文本 */
function typeText(_row: Record<string, unknown>, _col: ReTableColumn, cellValue: unknown): string {
  const s = cellValue as string | undefined;
  return { document: '单据', sms: '短信', email: '邮件', label: '标签', other: '其他' }[s ?? ''] ?? s ?? '—';
}

// ------------------- 取数（ReTable loader） -------------------
async function load(params: ReTableLoadParams): Promise<RePageResult> {
  loading.value = true;
  try {
    const result = (await templateApi.page({
      keyword: keyword.value,
      source: sourceFilter.value,
      page: params.page,
      size: params.pageSize,
    })) as PageResult<TemplateInfo> | undefined;
    if (!result || !Array.isArray(result.records)) throw new Error('template list payload is empty');
    total.value = result.total ?? 0;
    mockDebug.value = result.total === 0 || result.records.length === 0;
    const records = result.records.map((r: TemplateInfo | Record<string, unknown>) => normalizeRow(r as Record<string, unknown>));
    return {
      records,
      total: total.value,
    };
  } catch (e) {
    // template 后端不在 monitor 侧：开发期用 mock 数据铺开 UI（由 `onMounted` 触发首次加载）
    mockDebug.value = true;
    const { records: m } = splitPage(mockTemplates, params.page, params.pageSize);
    return { records: m, total: mockTemplates.length };
  } finally {
    loading.value = false;
  }
}

/** Mock 分页 */
function splitPage(items: TemplateInfo[], page: number, size: number): { records: TemplateInfo[] } {
  const start = (page - 1) * size;
  return { records: items.slice(start, start + size) };
}

// ------------------- 操作 -------------------
/** 打开设计器（由 @pages/template 页面承载） */
function openDesigner(row: TemplateInfo): void {
  redirectConcept('/template/designer');
  void router.push(`/template/designer/${row.id}`);
}

/** 打开预览（由 @pages/template 页面承载） */
function openPreview(row: TemplateInfo): void {
  redirectConcept('/template/preview');
  void router.push(`/template/preview/${row.id}`);
}

/** 导航到 @pages/template 路由（未注册时在控制台说明原因，避免用户进 404 页） */
function redirectConcept(path: string): void {
  const exists = router.getRoutes().some((r) => r.path === path);
  if (!exists) {
    message.warning(`「${path}」页由 @pages/template 提供，监控侧未注册该路由（侧栏请进入模板应用查看）`);
  }
}

/** 打开详情 drawer */
function onDetail(row: TemplateInfo): void {
  drawerTitle.value = row.name || '未命名模板';
  drawerRow.value = row;
  drawerVisible.value = true;
}

// ------------------- 查询刷新 -------------------
/** 重新查询（关键词 / 来源变化时） */
function refresh(): void {
  page.value = 1;
  void load({ page: 1, pageSize: pageSize.value, params: {} });
}

const columns: ReTableColumn[] = [
  { prop: 'name', label: '模板名称', minWidth: 220, showOverflowTooltip: true },
  { prop: 'source', label: '来源', width: 120, formatter: sourceText },
  { prop: 'status', label: '状态', width: 120, formatter: statusText },
  { prop: 'type', label: '类型', width: 110, formatter: typeText },
  { prop: 'language', label: '语言', width: 100, formatter: languageText },
  { prop: 'createdAt', label: '创建时间', width: 190, formatter: fmtTime },
  { prop: 'actions', label: '操作', width: 160, align: 'center', fixed: 'right' },
];

// ------------------- drawer -------------------
const drawerVisible = ref(false);
const drawerTitle = ref('');
const drawerRow = ref<TemplateInfo | null>(null);

onMounted(() => {
  void load({ page: 1, pageSize: 20, params: {} });
});
</script>

<template>
  <div class="template-manage">
    <!-- 查询区 -->
    <div class="manage__search">
      <ReInput
        v-model="keyword"
        style="width: 220px"
        placeholder="模板名称 / 备注"
        clearable
        @update:model-value="refresh"
      />
      <ReSelect
        v-model="sourceFilter"
        style="width: 150px"
        placeholder="来源"
        :data="[
          { label: '全部', value: '' },
          { label: 'hiprint', value: 'hiprint' },
          { label: '消息', value: 'message' },
          { label: '组卷', value: 'paper' },
        ]"
        @change="refresh"
      />
      <ReButton text @click="refresh">
        重置
      </ReButton>
      <ReButton v-if="mockDebug" text type="primary" @click="refresh" style="margin-left:auto">
        <ReIcon icon="Refresh" /> 重新拉取真实数据
      </ReButton>
    </div>

    <!-- 列表 -->
    <div class="manage__table">
      <ReTable
        row-key="id"
        :loader="load"
        :columns="columns"
        pagination
        @row-click="onDetail"
      />
    </div>

    <!-- 操作列缺省插槽由 ReTable 的 `actions` 列接管（ReButton + 图标） -->
    <div class="manage__footer" v-if="mockDebug">
      <span class="manage__footer__hint">演示数据，模板后端（/api/template）未接入监控侧</span>
    </div>

    <!-- 详情 drawer -->
    <ReDrawer v-model="drawerVisible" :title="drawerTitle" width="600px" :show-window-shell="false" :close-on-click-modal="false" show-close>
      <div class="detail" v-if="drawerRow">
        <div class="detail__row">
          <span class="detail__label">状态</span>
          <span class="detail__value">{{ statusText(drawerRow as Record<string, unknown>, null, drawerRow.status) }}</span>
        </div>
        <div class="detail__row">
          <span class="detail__label">来源</span>
          <span class="detail__value">{{ sourceText(drawerRow as Record<string, unknown>, null, drawerRow.source) }}</span>
        </div>
        <div class="detail__row">
          <span class="detail__label">语言</span>
          <span class="detail__value">{{ drawerRow.language }}</span>
        </div>
        <div class="detail__row">
          <span class="detail__label">类型</span>
          <span class="detail__value">{{ drawerRow.type }}</span>
        </div>
        <div class="detail__row">
          <span class="detail__label">创建时间</span>
          <span class="detail__value">{{ fmtTimeOf(drawerRow.createdAt) }}</span>
        </div>
        <div class="detail__row">
          <span class="detail__label">备注</span>
          <span class="detail__value">{{ drawerRow.remark || '—' }}</span>
        </div>
        <div class="detail__row">
          <span class="detail__label">内容</span>
          <span class="detail__value">{{ drawerRow.content }}</span>
        </div>
      </div>
    </ReDrawer>
  </div>
</template>

<style lang="scss" scoped>
.template-manage {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;
  background: var(--el-bg-color);
}

.manage__search {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.manage__table {
  flex: 1;
  overflow: auto;
}

.manage__footer {
  &__hint {
    display: block;
    text-align: center;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 1.6;
  }
}

.detail {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detail__row {
  display: flex;
  gap: 8px;
  line-height: 1.6;
}

.detail__label {
  color: var(--el-text-color-regular);
  min-width: 72px;
}

.detail__value {
  color: var(--el-text-color-primary);
  word-break: break-all;
}
</style>

<!--
  模板管理 —— 模板库台账（模板列表、预览、设计器入口、状态/来源）

  职责：
    - 从 `@pages/template` 拉取模板库（多来源：hiprint / 消息 / 组卷），
      展示模板信息、状态、来源、创建时间；
    - 操作列提供「设计 / 预览」入口（设计器/预览页由 @pages/template 承载，
      本侧只负责加气口和台账）；
    - 提供一个低风险的本地渲染预览（ReDrawer + print-lock）给监控侧直接
      「第三方的打」。

  接入：在侧边栏 `createMonitorRoutes()` 的「模板管理」分组下。

  @author CH
  @since 4.0.0.45
-->
<script setup lang="ts">
/**
 * 模板管理列表页（监控侧入口）
 *
 * 数据来源：`@pages/template` 的 `templateApi`（模板库 API）。
 */
import { computed, onMounted, ref } from 'vue';
import { message } from '@repo/core';
import ReTable, { type ReTableColumn, type ReTableLoadParams, type RePageResult } from '@repo/ui/re-table';
import ReDrawer from '@repo/ui/re-drawer';
import ReButton from '@repo/ui/re-button';
import ReIcon from '@repo/ui/re-icon';
import ReInput from '@repo/ui/re-input';
import ReSelect from '@repo/ui/re-select';
import type { TemplateInfo } from '@pages/template/src/types/template';
import { templateApi } from '@pages/template/src/api/templateApi';

/** 加载态 */
const loading = ref(false);
/** 列表 */
const list = ref<TemplateInfo[]>([]);
/** 合计条数 */
const total = ref(0);
/** 页码 */
const page = ref(1);
const pageSize = ref(20);
/** 搜索关键词 */
const keyword = ref('');
/** 来源筛选 */
const sourceFilter = ref('');
/** 弹窗 / 底库 */
const drawerVisible = ref(false);
const drawerTitle = ref('');
const drawerRow = ref<TemplateInfo | null>(null);
/** 低风险的本地渲染预览（ReDrawer） */
const previewRow = ref<TemplateInfo | null>(null);

/** 来源名称 */
function sourceName(s?: string): string {
  const names: Record<string, string> = { hiprint: 'hiprint', message: '消息', paper: '组卷' };
  return names[s ?? ''] ?? s ?? '—';
}

/** 模板状态文本 */
function statusName(s?: string): string {
  const names: Record<string, string> = { draft: '草稿', online: '已上线', offline: '已下线' };
  return names[s ?? ''] ?? s ?? '—';
}

/** 格式化时间（展示用） */
function fmtTime(v?: string): string {
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

/** 取数（ReTable loader） */
async function load({ page: p, pageSize: ps }: ReTableLoadParams): Promise<RePageResult> {
  loading.value = true;
  try {
    const result = (await templateApi.page({
      keyword: keyword.value,
      source: sourceFilter.value,
      page: p,
      size: ps,
    })) as PageResult<TemplateInfo> | undefined;
    const records = (result?.records ?? []).map(r => r as TemplateInfo);
    total.value = result?.total ?? 0;
    return { records, total: total.value };
  } catch (e) {
    message.error(`加载模板列表失败：${e}`);
    return { records: [], total: 0 };
  } finally {
    loading.value = false;
  }
}

/** 打开详情 drawer */
function onDetail(row: TemplateInfo): void {
  drawerTitle.value = row.templateInfoName || '未命名模板';
  drawerRow.value = row;
  drawerVisible.value = true;
}

/** 从设计器打开（由 @pages/template 承载） */
function openDesigner(_row: TemplateInfo): void {
  message.info('设计器由页面端承载，跳转链接：/template/designer');
}

/** 从预览页打开（由 @pages/template 承载） */
function openPreview(_row: TemplateInfo): void {
  message.info('预览页由页面端承载，跳转链接：/template/preview');
}

/** 语言展示 */
const langNames: Record<string, string> = { html: 'html', vue: 'vue', jsx: 'jsx', json: 'json' };

/** 列表列定义 */
const columns: ReTableColumn[] = [
  { prop: 'templateInfoName', label: '模板名称', slot: 'name', minWidth: 220 },
  { prop: 'templateInfoStatus', label: '状态', slot: 'status', width: 110 },
  { prop: 'templateInfoSource', label: '来源', slot: 'source', width: 130 },
  { prop: 'templateInfoLanguage', label: '语言', slot: 'language', width: 100 },
  { prop: 'templateInfoCreatedAt', label: '创建时间', slot: 'createdAt', width: 190 },
  { prop: 'action', label: '操作', slot: 'action', width: 180, fixed: 'right' },
];

onMounted(() => {
  void load({ page: 1, pageSize: 20, params: {} });
});
</script>

<template>
  <div class="template-manage">
    <!-- 查询 -->
    <div class="manage__search">
      <ReInput
        v-model="keyword"
        style="width: 220px"
        placeholder="模板名称 / 备注"
        clearable
        @update:model-value="() => { page = 1; void load({ page: page, pageSize: pageSize, params: {} }) }"
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
        @change="() => { page = 1; void load({ page: page, pageSize: pageSize, params: {} }) }"
      />
      <ReButton text @click="() => { keyword = ''; sourceFilter = ''; page = 1; void load({ page: page, pageSize: pageSize, params: {} }) }">
        重置
      </ReButton>
    </div>

    <!-- 列表 -->
    <div class="manage__table">
      <ReTable
        row-key="templateInfoId"
        :loader="load"
        :columns="columns"
        :pagination="{ pageSize, total, showTotal: true, showSizeChanger: true }"
      />
    </div>

    <!-- 详情 drawer -->
    <ReDrawer v-model="drawerVisible" :title="drawerTitle" width="600px" :show-window-shell="false" :close-on-click-modal="false" show-close>
      <div class="detail" v-if="drawerRow">
        <div class="detail__row">
          <span class="detail__label">状态</span>
          <span class="detail__value">{{ statusName(drawerRow.templateInfoStatus) }}</span>
        </div>
        <div class="detail__row">
          <span class="detail__label">来源</span>
          <span class="detail__value">{{ sourceName(drawerRow.templateInfoSource) }}</span>
        </div>
        <div class="detail__row">
          <span class="detail__label">语言</span>
          <span class="detail__value">{{ langNames[drawerRow.templateInfoLanguage] || '—' }}</span>
        </div>
        <div class="detail__row">
          <span class="detail__label">创建时间</span>
          <span class="detail__value">{{ fmtTime(drawerRow.templateInfoCreatedAt) }}</span>
        </div>
        <div class="detail__row">
          <span class="detail__label">备注</span>
          <span class="detail__value">{{ drawerRow.templateInfoRemark || '—' }}</span>
        </div>
        <div class="detail__row">
          <span class="detail__label">内容</span>
          <span class="detail__value">{{ drawerRow.templateInfoContent }}</span>
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
}

.detail__value {
  color: var(--el-text-color-primary);
  word-break: break-all;
}
</style>

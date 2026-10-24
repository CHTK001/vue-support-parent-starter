<script setup lang="ts">
/**
 * 消息模板管理页面
 *
 * 顶部支持切换「全部模板」或指定提供商，查询该提供商的模板列表，
 * 提供模板增删改查、按模板发送、手动同步远端模板能力。
 */
import { message } from "@repo/core";
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { Message, Search, Refresh, Plus } from "@element-plus/icons-vue";
import {
  deleteTemplate,
  listForProvider,
  pageForTemplate,
  syncTemplate,
  updateTemplate,
} from "../api/messageApi";
import type { MessageProvider, MessageTemplate } from "../api/types";
import ReProviderFilterBar from "../components/ReProviderFilterBar.vue";
import ReTemplateFormDialog from "../components/ReTemplateFormDialog.vue";
import ReSendDialog from "../components/ReSendDialog.vue";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
import ReButton from "@repo/ui/re-button";
import ReInput from "@repo/ui/re-input";
import ReEmpty from "@repo/ui/re-empty";
import ReSectionHead from "@repo/ui/re-section-head";
import ReTag from "@repo/ui/re-tag";

const route = useRoute();
const router = useRouter();

// 查询条件
const query = reactive<{
  page: number;
  pageSize: number;
  sysMessageProviderId?: number;
  sysMessageTemplateName?: string;
  sysMessageTemplateType?: string;
}>({
  page: 1,
  pageSize: 10,
  sysMessageProviderId: undefined,
  sysMessageTemplateName: undefined,
  sysMessageTemplateType: undefined,
});

const list = ref<MessageTemplate[]>([]);
const providers = ref<MessageProvider[]>([]);
const total = ref(0);
const loading = ref(false);
const syncLoading = ref(false);

/** 模板表列配置（原模板里的 el-table-column 收敛到数组；带 #default 的列配 slot + #col-<slot>） */
const templateColumns: ReTableColumn[] = [
  { prop: "sysMessageTemplateName", label: "名称", minWidth: 140 },
  { prop: "sysMessageTemplateCode", label: "编码", minWidth: 130 },
  { prop: "sysMessageTemplateType", label: "类型", width: 90, slot: "sysMessageTemplateType" },
  { prop: "status", label: "状态", width: 90, slot: "status" },
  { prop: "content", label: "内容", minWidth: 200, showOverflowTooltip: true, slot: "content" },
  { prop: "createTime", label: "创建时间", width: 170 },
  { prop: "actions", label: "操作", width: 200, fixed: "right", slot: "actions" },
];

/** 当前提供商（用于面包屑/上下文展示） */
const currentProvider = computed(() =>
  providers.value.find(
    (p) => p.sysMessageProviderId === query.sysMessageProviderId,
  ),
);

// 弹窗状态
const dialogVisible = ref(false);
const form = reactive<MessageTemplate>({});

// 发送弹窗
const sendVisible = ref(false);
const currentTemplate = ref<MessageTemplate | null>(null);

/** 查询列表 */
async function loadList() {
  loading.value = true;
  try {
    const res = await pageForTemplate(query);
    list.value = res?.data?.data ?? [];
    total.value = res?.data?.total ?? 0;
  } catch (e) {
    message.error((e as Error)?.message ?? "模板列表加载失败");
  } finally {
    loading.value = false;
  }
}

/** 加载提供商列表 */
async function loadProviders() {
  try {
    const res = await listForProvider();
    providers.value = res?.data ?? [];
  } catch (e) {
    message.error((e as Error)?.message ?? "提供商列表加载失败");
  }
}

/** 切换提供商：更新 query 并刷新列表 */
function handleProviderChange() {
  query.page = 1;
  if (query.sysMessageProviderId) {
    router.replace({
      path: "/message/template",
      query: { providerId: query.sysMessageProviderId },
    });
  } else {
    router.replace({ path: "/message/template" });
  }
  loadList();
}

function handleReset() {
  query.sysMessageTemplateName = undefined;
  query.sysMessageTemplateType = undefined;
  query.page = 1;
  loadList();
}

function handleAdd() {
  Object.keys(form).forEach((k) => delete (form as Record<string, unknown>)[k]);
  // 默认绑定当前提供商
  if (query.sysMessageProviderId) {
    form.sysMessageProviderId = query.sysMessageProviderId;
  }
  dialogVisible.value = true;
}

function handleEdit(row: MessageTemplate) {
  Object.assign(form, { ...row });
  dialogVisible.value = true;
}

/** 保存回调 */
function handleSaved() {
  loadList();
}

async function handleDelete(row: MessageTemplate) {
  await ElMessageBox.confirm(`确认删除模板「${row.sysMessageTemplateName}」？`, "提示", {
    type: "warning",
  });
  await deleteTemplate(row.sysMessageTemplateId!);
  message.success("删除成功");
  loadList();
}

/** 启停用切换 */
async function handleStatus(row: MessageTemplate) {
  await updateTemplate({
    ...row,
    sysMessageTemplateStatus: row.sysMessageTemplateStatus === 1 ? 0 : 1,
  });
  message.success(row.sysMessageTemplateStatus === 1 ? "已启用" : "已停用");
  loadList();
}

/** 手动同步远端模板 */
async function handleSync() {
  if (!query.sysMessageProviderId) {
    message.warning("请先选择提供商");
    return;
  }
  syncLoading.value = true;
  try {
    const res = await syncTemplate(query.sysMessageProviderId);
    message.success(`同步完成，共 ${res?.data ?? 0} 个模板`);
    loadList();
  } finally {
    syncLoading.value = false;
  }
}

/** 打开发送弹窗 */
function handleSend(row: MessageTemplate) {
  currentTemplate.value = row;
  sendVisible.value = true;
}

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
  loadProviders().then(() => {
    // 读取路由参数 providerId
    const pid = route.query.providerId;
    if (pid) {
      query.sysMessageProviderId = Number(pid);
    }
    loadList();
  });
});
</script>

<!--
  现代化视图：ReSectionHead 页头 + koi 令牌筛选卡 + 表格卡片外壳 + ReEmpty 空态。

  顶部「全部 / 提供商上下文切换」复用 ReProviderFilterBar（不动其内部绑定），
  其默认插槽放同步/新增两个紧凑按钮；ReTable 列 slot（col-sysMessageTemplateType / col-status /
  col-content / col-actions）与分页回调全部原样保留，仅重排外壳与样式。
-->
<template>
  <div class="mp-tpl-page">
    <ReSectionHead
      class="mp-tpl-head"
      title="消息模板"
      description="维护各提供商的推送模板，支持按模板发送与远端模板同步"
    />

    <!-- 顶部：全部 / 提供商上下文切换 -->
    <ReProviderFilterBar
      v-model:provider-id="query.sysMessageProviderId"
      title="消息模板"
      :icon="Message"
      :providers="providers"
      :current-provider="currentProvider"
      @change="handleProviderChange"
    >
      <ReButton
        size="small"
        type="warning"
        plain
        :icon="Refresh"
        :loading="syncLoading"
        @click="handleSync"
      >
        同步模板
      </ReButton>
      <ReButton size="small" type="primary" plain :icon="Plus" @click="handleAdd">新增模板</ReButton>
    </ReProviderFilterBar>

    <!-- 列表区域 -->
    <div class="table-card">
      <div class="filter-row">
        <ReInput
          v-model="query.sysMessageTemplateName"
          class="filter-field filter-field--search"
          prefix-icon="Search"
          placeholder="模板名称"
          clearable
          @keyup.enter="handleReset"
        />
        <div class="filter-spacer" />
        <ReButton icon="Search" size="small" type="primary" tip="按条件查询" @click="loadList">查询</ReButton>
        <ReButton icon="Refresh" size="small" tip="重置查询条件" @click="handleReset">重置</ReButton>
      </div>
      <!-- 表格统一 ReTable（engine="element" 沿用原 el-table 的 DOM）；
           原表没有 border → :settings="{ border: false }"；分页仍由下方 el-pagination 自管。 -->
      <ReTable
        :loading="loading"
        :data="list"
        :columns="templateColumns"
        stripe
        class="w-full"
        engine="element"
        :pagination="false"
        :toolbar="false"
        :layout-table="{ minHeight: 0 }"
        :settings="{ border: false }"
        empty-text="暂无模板"
      >
        <template #col-sysMessageTemplateType="{ row }">
          <ReTag effect="plain" type="info">{{ row.sysMessageTemplateType }}</ReTag>
        </template>
        <template #col-status="{ row }">
          <el-switch
            :model-value="row.sysMessageTemplateStatus === 1"
            @change="handleStatus(row)"
          />
        </template>
        <template #col-content="{ row }">
          <span>{{ row.sysMessageTemplateContent || '-' }}</span>
        </template>
        <template #col-actions="{ row }">
          <div class="row-actions">
            <ReButton show-text size="small" type="primary" tip="按此模板发送" @click="handleSend(row)">发送</ReButton>
            <ReButton show-text size="small" tip="编辑模板" @click="handleEdit(row)">编辑</ReButton>
            <ReButton show-text size="small" type="danger" tip="删除模板" @click="handleDelete(row)">删除</ReButton>
          </div>
        </template>
        <!-- 空态走 ReEmpty：表格内的空态换成扁平空态，提示语仍由 empty-text 驱动 -->
        <template #empty="{ description }">
          <ReEmpty v-if="!loading" layout="modern" :description="description">
            <ReButton show-text icon="Plus" size="small" type="primary" @click="handleAdd">新增第一个模板</ReButton>
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
    <ReTemplateFormDialog
      v-model:visible="dialogVisible"
      :model="form"
      @update:model="(val) => Object.assign(form, val)"
      :providers="providers"
      @save="handleSaved"
    />

    <!-- 发送弹窗 -->
    <ReSendDialog
      v-model:visible="sendVisible"
      v-model:model="currentTemplate"
      @success="handleSaved"
    />
  </div>
</template>

<style scoped lang="scss">
.mp-tpl-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ===== 筛选行 ===== */
.filter-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.filter-field--search {
  width: 240px;
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

/* ===== 表内操作区 ===== */
.row-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
}

/* ===== 响应式：移动端搜索框占满 ===== */
@media (max-width: 768px) {
  .filter-field--search {
    width: 100%;
  }
  .filter-spacer {
    flex: none;
    width: 100%;
  }
}
</style>
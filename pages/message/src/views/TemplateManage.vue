<script setup lang="ts">
/**
 * 消息模板管理页面
 *
 * 顶部支持切换「全部模板」或指定提供商，查询该提供商的模板列表，
 * 提供模板增删改查、按模板发送、手动同步远端模板能力。
 */
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
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
    ElMessage.error((e as Error)?.message ?? "模板列表加载失败");
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
    ElMessage.error((e as Error)?.message ?? "提供商列表加载失败");
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
  ElMessage.success("删除成功");
  loadList();
}

/** 启停用切换 */
async function handleStatus(row: MessageTemplate) {
  await updateTemplate({
    ...row,
    sysMessageTemplateStatus: row.sysMessageTemplateStatus === 1 ? 0 : 1,
  });
  ElMessage.success(row.sysMessageTemplateStatus === 1 ? "已启用" : "已停用");
  loadList();
}

/** 手动同步远端模板 */
async function handleSync() {
  if (!query.sysMessageProviderId) {
    ElMessage.warning("请先选择提供商");
    return;
  }
  syncLoading.value = true;
  try {
    const res = await syncTemplate(query.sysMessageProviderId);
    ElMessage.success(`同步完成，共 ${res?.data ?? 0} 个模板`);
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

<template>
  <div class="p-6">
    <!-- 页面头部 -->
    <div class="mb-6">
      <h2 class="text-xl font-semibold tracking-tight text-[--el-text-color-primary]">
        消息模板
      </h2>
      <p class="mt-1 text-sm text-[--el-text-color-secondary]">
        维护各提供商的推送模板，支持按模板发送与远端模板同步
      </p>
    </div>

    <!-- 顶部：全部 / 提供商上下文切换 -->
    <ReProviderFilterBar
      v-model:provider-id="query.sysMessageProviderId"
      title="消息模板"
      :icon="Message"
      :providers="providers"
      :current-provider="currentProvider"
      @change="handleProviderChange"
    >
      <el-button
        type="warning"
        plain
        :icon="Refresh"
        :loading="syncLoading"
        @click="handleSync"
      >
        同步模板
      </el-button>
      <el-button type="primary" plain :icon="Plus" @click="handleAdd">新增模板</el-button>
    </ReProviderFilterBar>

    <!-- 列表区域 -->
    <el-card shadow="never" class="mt-6 rounded-xl border border-solid border-[--el-border-color-lighter]">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <el-input
          v-model="query.sysMessageTemplateName"
          placeholder="模板名称"
          clearable
          class="!w-56"
          @keyup.enter="handleReset"
        />
        <div class="flex-1" />
        <el-button type="primary" :icon="Search" @click="loadList">查询</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </div>
      <el-table v-loading="loading" :data="list" stripe class="w-full">
        <el-table-column prop="sysMessageTemplateName" label="名称" min-width="140" />
        <el-table-column prop="sysMessageTemplateCode" label="编码" min-width="130" />
        <el-table-column prop="sysMessageTemplateType" label="类型" width="90">
          <template #default="{ row }">
            <el-tag effect="plain">{{ row.sysMessageTemplateType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-switch
              :model-value="row.sysMessageTemplateStatus === 1"
              @change="handleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="内容" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.sysMessageTemplateContent || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" />
        <el-table-column label="操作" width="200" fixed="right" align="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleSend(row)">发送</el-button>
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="mt-4 flex justify-end">
        <el-pagination
          :total="pagination.total"
          :current-page="pagination.page"
          :page-size="pagination.pageSize"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

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

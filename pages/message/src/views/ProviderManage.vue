<script setup lang="ts">
/**
 * 消息提供商管理页面（主入口）
 *
 * 顶部展示全部统计概览（提供商 / 模板 / 日志），
 * 提供商列表支持查看该提供商的模板管理与推送日志。
 */
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { OfficeBuilding, Message, Document, Plus, Search, Refresh, Memo } from "@element-plus/icons-vue";
import { deleteProvider, listChannels, pageForLog, pageForProvider, pageForTemplate, updateProvider } from "../api/messageApi";
import type { MessageProvider } from "../api/types";
import ReStatCard from "../components/ReStatCard.vue";
import ReProviderFormDialog from "../components/ReProviderFormDialog.vue";

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
    ElMessage.error((e as Error)?.message ?? "提供商列表加载失败");
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
    ElMessage.error((e as Error)?.message ?? "统计概览加载失败");
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
  ElMessage.success("删除成功");
  loadList();
  loadStats();
}

/** 启停用切换 */
async function handleStatus(row: MessageProvider) {
  await updateProvider({
    ...row,
    sysMessageProviderStatus: row.sysMessageProviderStatus === 1 ? 0 : 1,
  });
  ElMessage.success(row.sysMessageProviderStatus === 1 ? "已启用" : "已停用");
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

<template>
  <div class="p-6">
    <!-- 页面头部 -->
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold tracking-tight text-[--el-text-color-primary]">
          消息提供商
        </h2>
        <p class="mt-1 text-sm text-[--el-text-color-secondary]">
          统一管理推送渠道，维护渠道下的消息模板与发送日志
        </p>
      </div>
      <el-button type="primary" :icon="Plus" @click="handleAdd">新增提供商</el-button>
    </div>

    <!-- 统计概览 -->
    <div v-loading="statsLoading" class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <ReStatCard
        v-for="card in statCards"
        :key="card.label"
        :label="card.label"
        :value="card.value"
        :desc="card.desc"
        :icon="card.icon"
        @click="card.onClick"
      />
    </div>

    <!-- 查询区域 -->
    <el-card shadow="never" class="mt-6 rounded-xl border border-solid border-[--el-border-color-lighter]">
      <div class="flex flex-wrap items-center gap-3">
        <el-input
          v-model="query.sysMessageProviderName"
          placeholder="提供商名称"
          clearable
          class="!w-56"
          @keyup.enter="loadList"
        />
        <el-select
          v-model="query.sysMessageProviderType"
          placeholder="提供商类型"
          clearable
          class="!w-44"
        >
          <el-option
            v-for="opt in providerTypeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <div class="flex-1" />
        <el-button type="primary" :icon="Search" @click="loadList">查询</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </div>
    </el-card>

    <!-- 提供商列表 -->
    <el-card shadow="never" class="mt-6 rounded-xl border border-solid border-[--el-border-color-lighter]">
      <el-table v-loading="loading" :data="list" stripe class="w-full">
        <el-table-column prop="sysMessageProviderName" label="提供商" min-width="180">
          <template #default="{ row }">
            <div class="flex items-center gap-3">
              <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-[--el-fill-color-light]">
                <el-icon :size="16" color="var(--el-color-primary)"><OfficeBuilding /></el-icon>
              </div>
              <div>
                <div class="text-sm font-medium text-[--el-text-color-primary]">
                  {{ row.sysMessageProviderName }}
                </div>
                <div class="text-xs text-[--el-text-color-secondary]">{{ row.sysMessageProviderCode }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="sysMessageProviderType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ row.sysMessageProviderType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sysMessageProviderVender" label="渠道" min-width="140">
          <template #default="{ row }">
            <span class="text-[--el-text-color-secondary]">
              {{ channelLabel(row.sysMessageProviderVender) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="sysMessageProviderEndpoint" label="端点地址" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="text-[--el-text-color-secondary]">{{ endpointOf(row) || "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="防抖间隔" width="110">
          <template #default="{ row }">
            <template v-if="row.sysMessageProviderInterval && row.sysMessageProviderInterval > 0">
              <span class="text-[--el-text-color-secondary]">{{ row.sysMessageProviderInterval }} 分钟</span>
            </template>
            <template v-else-if="row.sysMessageProviderInterval === 0">
              <span class="text-xs text-[--el-text-color-secondary]">不限</span>
            </template>
            <template v-else>
              <span class="text-xs text-[--el-text-color-secondary]">默认 1 分钟</span>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-switch
              :model-value="row.sysMessageProviderStatus === 1"
              @change="handleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openTemplates(row.sysMessageProviderId)">
              <el-icon class="mr-0.5" :size="14"><Memo /></el-icon>模板
            </el-button>
            <el-button link type="primary" @click="openLogs(row.sysMessageProviderId)">
              <el-icon class="mr-0.5" :size="14"><Document /></el-icon>日志
            </el-button>
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
    <ReProviderFormDialog
      v-model:visible="dialogVisible"
      :model="form"
      @update:model="(val) => Object.assign(form, val)"
      @save="handleSaved"
    />
  </div>
</template>

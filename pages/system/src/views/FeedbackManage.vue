<script setup lang="ts">
/**
 * 反馈管理页 —— 用户反馈列表与处理
 *
 * 复用 ReTable（loader 模式：自动分页 / loading / 列设置持久化），
 * 搜索区用 ReSearch 外壳，处理弹窗用 ReDialog（modern 布局）。
 * 顶部统计卡片展示总数/待处理/已处理/今日新增。
 */
import { computed, onMounted, ref } from "vue";
import { ElMessage, ElImageViewer } from "element-plus";
import { Plus, Refresh, ChatLineSquare, Clock, CircleCheck, TrendCharts } from "@element-plus/icons-vue";
import { pageForFeedback, issueFeedback, getFeedbackStatistic } from "../api/systemApi";
import type { FeedbackStatistic, SysFeedback } from "../api/types";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";

/** 查询条件 */
const query = ref<{ page: number; pageSize: number; sysFeedbackType?: string; sysFeedbackPriority?: number }>({
  page: 1,
  pageSize: 10,
});

/** 优先级元数据：0低 1中 2高 3紧急 */
const priorityOptions = [
  { label: "低", value: 0 },
  { label: "中", value: 1 },
  { label: "高", value: 2 },
  { label: "紧急", value: 3 },
];

const searchFilters = computed(() => [
  { key: 'sysFeedbackType', label: '反馈类型', type: 'input' as const, placeholder: '请输入' },
  { key: 'sysFeedbackPriority', label: '优先级', type: 'select' as const, placeholder: '请选择', options: priorityOptions },
]);

function handleReset() {
  query.value = { page: 1, pageSize: 10 };
  tableRef.value?.reload();
}
function priorityMeta(p?: number): { label: string; type: "info" | "primary" | "warning" | "danger" } {
  switch (p) {
    case 1: return { label: "中", type: "primary" };
    case 2: return { label: "高", type: "warning" };
    case 3: return { label: "紧急", type: "danger" };
    default: return { label: "低", type: "info" };
  }
}

/* ================== 统计卡片 ================== */
const statistic = ref<FeedbackStatistic>({});
const statisticLoading = ref(false);

async function loadStatistic() {
  statisticLoading.value = true;
  try {
    const res = await getFeedbackStatistic();
    statistic.value = res?.data ?? {};
  } catch {
    statistic.value = {};
  } finally {
    statisticLoading.value = false;
  }
}

/** 计算今日新增（从趋势统计中取今天的数量） */
function getTodayCount(): number {
  const today = new Date().toISOString().slice(0, 10);
  const todayItem = statistic.value.trendStatistics?.find((t) => t.date === today);
  return todayItem?.count ?? 0;
}

/* ================== 图片预览 ================== */
const imageViewerVisible = ref(false);
const imageList = ref<string[]>([]);
const imageIndex = ref(0);

function parseImages(images?: string): string[] {
  if (!images) return [];
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [images];
  } catch {
    return images.split(",").filter(Boolean);
  }
}

function previewImages(images?: string) {
  const list = parseImages(images);
  if (!list.length) {
    ElMessage.info("暂无图片");
    return;
  }
  imageList.value = list;
  imageIndex.value = 0;
  imageViewerVisible.value = true;
}

/* ================== 反馈详情 ================== */
const detailVisible = ref(false);
const currentFeedback = ref<SysFeedback | null>(null);

function openDetail(row: Record<string, unknown>) {
  currentFeedback.value = row as unknown as SysFeedback;
  detailVisible.value = true;
}

/** 处理对话框 */
const replyDialogVisible = ref(false);
const replyForm = ref<{ sysFeedbackId?: number; sysFeedbackRecoverContent?: string }>({});
const replySaving = ref(false);

/** ReTable loader：远程分页加载 */
async function loadFeedback({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const res = await pageForFeedback({
    page,
    pageSize,
    sysFeedbackType: (params.sysFeedbackType as string) || undefined,
    ...((params.sysFeedbackPriority as number) === undefined
      ? {}
      : { sysFeedbackPriority: params.sysFeedbackPriority as number }),
  } as Parameters<typeof pageForFeedback>[0]);
  return { total: res?.data?.total ?? 0, data: (res?.data?.data ?? []) as Record<string, unknown>[] };
}

/** 打开处理对话框 */
function openReply(row: Record<string, unknown>) {
  replyForm.value = {
    sysFeedbackId: row.sysFeedbackId as number,
    sysFeedbackRecoverContent: (row.sysFeedbackRecoverContent as string) ?? "",
  };
  replyDialogVisible.value = true;
}

/** 提交处理 */
async function submitReply() {
  if (!replyForm.value.sysFeedbackId) return;
  replySaving.value = true;
  try {
    const res = await issueFeedback(replyForm.value);
    if (res?.code === 200) {
      ElMessage.success("处理成功");
      replyDialogVisible.value = false;
      tableRef.value?.reload();
      loadStatistic();
    } else {
      ElMessage.error(res?.msg || "处理失败");
    }
  } finally {
    replySaving.value = false;
  }
}

const tableRef = ref();

/** 列定义 */
const columns: ReTableColumn[] = [
  { prop: "sysFeedbackId", label: "ID", width: 70 },
  { prop: "sysFeedbackType", label: "类型", width: 120 },
  { prop: "sysFeedbackContent", label: "反馈内容", minWidth: 240, slot: "content", showOverflowTooltip: true },
  { prop: "sysFeedbackImages", label: "图片", width: 80, slot: "images", align: "center" },
  { prop: "createName", label: "提交人", width: 120 },
  { prop: "createTime", label: "提交时间", width: 170 },
  { prop: "sysFeedbackPriority", label: "优先级", width: 90, slot: "priority", align: "center" },
  { prop: "sysFeedbackStatus", label: "状态", width: 90, slot: "status" },
  { prop: "action", label: "操作", width: 160, slot: "action", fixed: "right", align: "center" },
];

onMounted(() => {
  loadStatistic();
});
</script>

<template>
  <div class="system-page">
    <!-- 统计卡片 -->
    <div class="stat-cards" v-loading="statisticLoading">
      <div class="stat-card stat-card--total">
        <div class="stat-card__icon"><el-icon><ChatLineSquare /></el-icon></div>
        <div class="stat-card__info">
          <div class="stat-card__num">{{ statistic.total ?? 0 }}</div>
          <div class="stat-card__label">总反馈数</div>
        </div>
      </div>
      <div class="stat-card stat-card--pending">
        <div class="stat-card__icon"><el-icon><Clock /></el-icon></div>
        <div class="stat-card__info">
          <div class="stat-card__num">{{ statistic.pending ?? 0 }}</div>
          <div class="stat-card__label">待处理</div>
        </div>
      </div>
      <div class="stat-card stat-card--resolved">
        <div class="stat-card__icon"><el-icon><CircleCheck /></el-icon></div>
        <div class="stat-card__info">
          <div class="stat-card__num">{{ statistic.resolved ?? 0 }}</div>
          <div class="stat-card__label">已处理</div>
        </div>
      </div>
      <div class="stat-card stat-card--today">
        <div class="stat-card__icon"><el-icon><TrendCharts /></el-icon></div>
        <div class="stat-card__info">
          <div class="stat-card__num">{{ getTodayCount() }}</div>
          <div class="stat-card__label">今日新增</div>
        </div>
      </div>
    </div>

      <ReTable
        ref="tableRef"
        table-id="system-feedback"
        :search="{ filters: searchFilters, title: '搜索', btnMode: 'text' }"
        :search-gap="16"
        v-model:search-model="query"
        @search-reset="handleReset"
        :loader="loadFeedback"
        :columns="columns"
        :pagination="true"
        :params="query"
        row-key="sysFeedbackId"
        v-model:page="query.page"
        v-model:page-size="query.pageSize"
        class="mt-2"
      >
        <template #toolbar>
          <ReButton layout="modern" icon="Refresh" @click="tableRef?.reload(); loadStatistic()">刷新</ReButton>
        </template>
        <template #content="{ row }">
          <span class="cursor-pointer text-[--el-color-primary]" @click="openDetail(row)">{{ row.sysFeedbackContent }}</span>
        </template>
        <template #priority="{ row }">
          <ReTag :type="priorityMeta(Number(row.sysFeedbackPriority)).type" size="small" effect="plain">
            {{ priorityMeta(Number(row.sysFeedbackPriority)).label }}
          </ReTag>
        </template>
        <template #status="{ row }">
          <ReTag
            layout="modern"
            :type="row.sysFeedbackStatus === 1 ? 'success' : 'warning'"
            size="small"
          >
            {{ row.sysFeedbackStatus === 1 ? "已处理" : "待处理" }}
          </ReTag>
        </template>
        <template #images="{ row }">
          <el-button
            v-if="parseImages(row.sysFeedbackImages).length"
            type="primary"
            link
            size="small"
            @click.stop="previewImages(row.sysFeedbackImages)"
          >
            查看({{ parseImages(row.sysFeedbackImages).length }})
          </el-button>
          <span v-else class="text-xs text-[--el-text-color-secondary]">-</span>
        </template>
        <template #action="{ row }">
          <ReButton layout="square" type="info" @click="openDetail(row)">详情</ReButton>
          <ReButton
            layout="square"
            type="primary"
            v-admin
            :disabled="row.sysFeedbackStatus === 1"
            @click="openReply(row)"
          >
            {{ row.sysFeedbackStatus === 1 ? "已处理" : "处理" }}
          </ReButton>
        </template>
      </ReTable>

    <!-- 反馈详情弹窗 -->
    <ReDialog
      v-model="detailVisible"
      title="反馈详情"
      layout="modern"
      width="600"
      :footer-hidden="true"
    >
      <template v-if="currentFeedback">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="反馈ID">{{ currentFeedback.sysFeedbackId }}</el-descriptions-item>
          <el-descriptions-item label="反馈类型">{{ currentFeedback.sysFeedbackType || "-" }}</el-descriptions-item>
          <el-descriptions-item label="优先级">
            <ReTag :type="priorityMeta(Number((currentFeedback as Record<string, unknown>).sysFeedbackPriority)).type" size="small" effect="plain">
              {{ priorityMeta(Number((currentFeedback as Record<string, unknown>).sysFeedbackPriority)).label }}
            </ReTag>
          </el-descriptions-item>
          <el-descriptions-item label="提交人">{{ currentFeedback.createName || "-" }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ currentFeedback.createTime || "-" }}</el-descriptions-item>
          <el-descriptions-item label="平台">{{ currentFeedback.sysFeedbackPlatform || "-" }}</el-descriptions-item>
          <el-descriptions-item label="UA 信息">
            <span class="text-xs break-all">{{ currentFeedback.sysFeedbackUserAgent || "-" }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <ReTag :type="currentFeedback.sysFeedbackStatus === 1 ? 'success' : 'warning'" size="small">
              {{ currentFeedback.sysFeedbackStatus === 1 ? "已处理" : "待处理" }}
            </ReTag>
          </el-descriptions-item>
          <el-descriptions-item label="反馈内容">
            <div class="detail-content">{{ currentFeedback.sysFeedbackContent || "-" }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="反馈图片" v-if="parseImages(currentFeedback.sysFeedbackImages).length">
            <div class="detail-images">
              <el-image
                v-for="(img, idx) in parseImages(currentFeedback.sysFeedbackImages)"
                :key="idx"
                :src="img"
                :preview-src-list="parseImages(currentFeedback.sysFeedbackImages)"
                :initial-index="idx"
                fit="cover"
                class="detail-images__item"
                preview-teleported
              />
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="处理人" v-if="currentFeedback.sysFeedbackDealName">
            {{ currentFeedback.sysFeedbackDealName }}
          </el-descriptions-item>
          <el-descriptions-item label="处理时间" v-if="currentFeedback.sysFeedbackRecoverTime">
            {{ currentFeedback.sysFeedbackRecoverTime }}
          </el-descriptions-item>
          <el-descriptions-item label="处理回复" v-if="currentFeedback.sysFeedbackRecoverContent">
            <div class="detail-content">{{ currentFeedback.sysFeedbackRecoverContent }}</div>
          </el-descriptions-item>
        </el-descriptions>
      </template>
    </ReDialog>

    <ReDialog
      v-model="replyDialogVisible"
      title="处理反馈"
      layout="modern"
      width="520"
      :close-on-click-modal="false"
      compact
      :confirm-loading="replySaving"
      @ok="submitReply"
    >
      <el-form label-width="80px">
        <el-form-item label="处理回复">
          <ReInput
            layout="modern"
            v-model="replyForm.sysFeedbackRecoverContent"
            type="textarea"
            :rows="4"
            placeholder="请输入处理回复"
          />
        </el-form-item>
      </el-form>
    </ReDialog>

    <!-- 图片查看器 -->
    <el-image-viewer
      v-if="imageViewerVisible"
      :url-list="imageList"
      :initial-index="imageIndex"
      @close="imageViewerVisible = false"
      teleported
    />
  </div>
</template>

<style scoped lang="scss">
.system-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  height: 100%;
}
/* 统计卡片 */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  background: white;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    color: white;
  }

  &__num {
    font-size: 28px;
    font-weight: 700;
    line-height: 1.2;
    color: var(--el-text-color-primary);
  }

  &__label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin-top: 2px;
  }

  &--total &__icon {
    background: linear-gradient(135deg, #667eea, #764ba2);
  }

  &--pending &__icon {
    background: linear-gradient(135deg, #f6d365, #fda085);
  }

  &--resolved &__icon {
    background: linear-gradient(135deg, #11998e, #38ef7d);
  }

  &--today &__icon {
    background: linear-gradient(135deg, #2193b0, #6dd5ed);
  }
}

/* 详情 */
.detail-content {
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.6;
}

.detail-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  &__item {
    width: 80px;
    height: 80px;
    border-radius: 6px;
    cursor: pointer;
    border: 1px solid var(--el-border-color-lighter);
  }
}
</style>

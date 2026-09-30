<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import type { EChartsOption } from "echarts";
import {
  ChatDotRound,
  Picture,
  Clock,
  CircleCheckFilled,
  Bell,
  DataAnalysis,
  TrendCharts,
  Platform,
  User,
  Monitor,
  UserFilled,
  CollectionTag,
  ArrowRight,
  ArrowLeft
} from "@element-plus/icons-vue";
import { pageForFeedback, issueFeedback, getFeedbackStatistic } from "../api/systemApi";
import type { SysFeedback, FeedbackStatistic } from "../api/types";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";
import ReTable from "@repo/ui/components/ReTable/ReTable.vue";
import ReButton from "@repo/ui/components/ReButton/ReButton.vue";
import ReTag from "@repo/ui/components/ReTag/ReTag.vue";
import ReDialog from "@repo/ui/components/ReDialog/ReDialog.vue";
import ReInput from "@repo/ui/components/ReInput/ReInput.vue";
import ReTime from "@repo/ui/components/ReTime/ReTime.vue";
import ReEChart from "./components/ReEChart.vue";

defineOptions({ name: "FeedbackManage" });

const tableRef = ref();
const statistic = ref<FeedbackStatistic>({});

const typeOptions = [
  { label: "功能建议", value: "SUGGESTION" },
  { label: "BUG反馈", value: "BUG" },
  { label: "其他问题", value: "OTHER" }
];

const platformOptions = [
  { label: "小程序", value: "小程序" },
  { label: "App", value: "App" },
  { label: "平台", value: "平台" }
];

const priorityOptions = [
  { label: "低", value: 0 },
  { label: "中", value: 1 },
  { label: "高", value: 2 },
  { label: "紧急", value: 3 }
];

type FeedbackTagType = "primary" | "success" | "warning" | "info" | "danger";

interface FeedbackTag {
  type: FeedbackTagType;
  text: string;
}

function getTypeTag(type?: string): FeedbackTag {
  if (type === "SUGGESTION") return { type: "primary", text: "功能建议" };
  if (type === "BUG") return { type: "danger", text: "BUG反馈" };
  return { type: "info", text: "其他问题" };
}

function getPriorityTag(priority?: number): FeedbackTag {
  switch (priority) {
    case 0:
      return { type: "info", text: "低" };
    case 1:
      return { type: "primary", text: "中" };
    case 2:
      return { type: "warning", text: "高" };
    case 3:
      return { type: "danger", text: "紧急" };
    default:
      return { type: "info", text: "中" };
  }
}

function parseImages(images?: string): string[] {
  if (!images) return [];
  try {
    return images.split(",").filter(Boolean);
  } catch {
    return [];
  }
}

/** 处理耗时：提交时间 -> 处理时间 */
function formatDuration(create?: string, recover?: string): string {
  if (!create || !recover) return "-";
  const c = new Date(String(create).replace(/-/g, "/")).getTime();
  const r = new Date(String(recover).replace(/-/g, "/")).getTime();
  let ms = r - c;
  if (!Number.isFinite(ms) || ms < 0) ms = 0;
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "小于1分钟";
  if (mins < 60) return `${mins} 分钟`;
  const h = Math.floor(mins / 60);
  const rm = mins % 60;
  if (h < 24) return rm ? `${h}小时${rm}分` : `${h}小时`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh ? `${d}天${rh}小时` : `${d}天`;
}

/** 行样式：BUG 且未处理 -> 高亮背景 */
function rowClassName({ row }: { row: SysFeedback }): string {
  if (row.sysFeedbackType === "BUG" && row.sysFeedbackStatus === 0) {
    return "feedback-row--bug-pending";
  }
  return "";
}

/* 查询模型（搜索区双向绑定） */
const query = ref({ page: 1, pageSize: 10 });

const searchFilters = computed(() => [
  { key: "sysFeedbackType", label: "反馈类型", type: "select" as const, placeholder: "请选择", options: typeOptions },
  { key: "sysFeedbackPlatform", label: "反馈来源", type: "select" as const, placeholder: "请选择", options: platformOptions },
  { key: "sysFeedbackContent", label: "反馈内容", type: "input" as const, placeholder: "请输入内容关键字" },
  { key: "createTimeRange", label: "提交时间", type: "daterange" as const, placeholder: "开始日期" },
  { key: "recoverTimeRange", label: "处理时间", type: "daterange" as const, placeholder: "开始日期" },
  { key: "sysFeedbackPriority", label: "优先级", type: "select" as const, placeholder: "请选择", options: priorityOptions }
]);

const columns: ReTableColumn[] = [
  { prop: "sysFeedbackId", label: "ID", width: 56, align: "center", slot: "id" },
  { prop: "sysFeedbackType", label: "类型", width: 86, align: "center", slot: "type" },
  { prop: "sysFeedbackPlatform", label: "来源", width: 80, align: "center", slot: "platform" },
  { prop: "sysFeedbackContent", label: "反馈内容", minWidth: 180, slot: "content" },
  { prop: "sysFeedbackImages", label: "图片", width: 68, align: "center", slot: "images" },
  { prop: "createName", label: "提交人", width: 90, align: "center" },
  { prop: "createTime", label: "提交时间", width: 172, align: "center", slot: "createTime" },
  { prop: "sysFeedbackRecoverTime", label: "处理时间", width: 168, align: "center", slot: "recoverTime", sortable: "custom" },
  { prop: "sysFeedbackPriority", label: "优先级", width: 90, align: "center", slot: "priority", sortable: "custom" },
  { prop: "sysFeedbackStatus", label: "状态", width: 90, align: "center", slot: "status" },
  { prop: "action", label: "操作", width: 104, align: "center", fixed: "right", slot: "action" }
];

async function loadFeedback({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const cr = params.createTimeRange as string[] | undefined;
  const rr = params.recoverTimeRange as string[] | undefined;
  const prio = params.sysFeedbackPriority;
  const res = await pageForFeedback({
    page,
    pageSize,
    sysFeedbackType: (params.sysFeedbackType as string) || undefined,
    sysFeedbackPlatform: (params.sysFeedbackPlatform as string) || undefined,
    sysFeedbackContent: (params.sysFeedbackContent as string) || undefined,
    sysFeedbackPriority:
      prio === undefined || prio === null || prio === "" ? undefined : Number(prio),
    ...(Array.isArray(cr) && cr.length === 2
      ? { createTimeStart: cr[0], createTimeEnd: cr[1] }
      : {}),
    ...(Array.isArray(rr) && rr.length === 2
      ? { recoverTimeStart: rr[0], recoverTimeEnd: rr[1] }
      : {}),
    ...(orderState.value
      ? { order: `${orderState.value.prop} ${orderState.value.order}` }
      : {})
  });
  return {
    total: res?.data?.total ?? 0,
    data: (res?.data?.data ?? []) as Record<string, unknown>[]
  };
}

function handleReset() {
  query.value = { page: 1, pageSize: 10 };
  orderState.value = null;
  tableRef.value?.reload();
}

/**
 * 空态「刷新」按钮的纯转发。
 *
 * <p>不复用 handleReset：它会顺手清空筛选与排序，那对「点了刷新却把条件也丢了」
 * 来说是副作用而不是意图。这里只转发表格重载。</p>
 */
function reload() {
  tableRef.value?.reload();
}

/** 表头点击排序（服务端排序） */
const orderState = ref<{ prop: string; order: string } | null>(null);
function onSortChange(payload: { prop: string; order: string | null }) {
  if (!payload.order) {
    orderState.value = null;
  } else {
    orderState.value = {
      prop: payload.prop,
      order: payload.order === "ascending" ? "asc" : "desc",
    };
  }
  query.value.page = 1;
  tableRef.value?.reload();
}

async function loadStatistic() {
  try {
    const res = await getFeedbackStatistic();
    if (res.data) statistic.value = res.data;
  } catch {
    // ignore
  }
}

/* 详情弹窗 */
const detailVisible = ref(false);
const detailData = ref<SysFeedback | null>(null);
const detailHistoryVisible = ref(false);

/** 详情编号：#FB-YYYYMMDD-### */
const detailNo = computed(() => {
  const d = detailData.value;
  if (!d) return "";
  const id = d.sysFeedbackId != null ? String(d.sysFeedbackId).padStart(3, "0") : "---";
  const raw = d.createTime ? String(d.createTime).replace(/-/g, "/") : "";
  const dt = raw ? new Date(raw) : null;
  const day =
    dt && !Number.isNaN(dt.getTime())
      ? `${dt.getFullYear()}${String(dt.getMonth() + 1).padStart(2, "0")}${String(
          dt.getDate()
        ).padStart(2, "0")}`
      : "";
  return day ? `#FB-${day}-${id}` : `#FB-${id}`;
});

/** 来源描述：来自 平台・客户端 */
const detailSource = computed(() => {
  const d = detailData.value;
  if (!d) return "";
  const parts = [d.sysFeedbackPlatform, d.sysFeedbackUserAgent].filter(Boolean);
  return parts.length ? `来自 ${parts.join("・")}` : "";
});

/** 详情中的反馈图片 */
const detailImages = computed(() => parseImages(detailData.value?.sysFeedbackImages));

function showDetail(row: SysFeedback) {
  detailData.value = row;
  detailHistoryVisible.value = false;
  detailVisible.value = true;
}

/** 详情内「开始处理」：关闭详情并打开处理弹窗 */
function handleIssueFromDetail() {
  const row = detailData.value;
  if (!row) return;
  detailVisible.value = false;
  showIssue(row);
}

/* 图片预览 */
const imageViewerVisible = ref(false);
const imageViewerUrls = ref<string[]>([]);

function previewImages(images?: string) {
  const urls = parseImages(images);
  if (urls.length === 0) {
    ElMessage.info("暂无图片");
    return;
  }
  imageViewerUrls.value = urls;
  imageViewerVisible.value = true;
}

/* 处理弹窗 */
const issueVisible = ref(false);
const issueLoading = ref(false);
const issueForm = ref({
  sysFeedbackId: 0,
  sysFeedbackRecoverContent: "",
  sysFeedbackRecoverImages: ""
});

function showIssue(row: SysFeedback) {
  issueForm.value = {
    sysFeedbackId: row.sysFeedbackId ?? 0,
    sysFeedbackRecoverContent: "",
    sysFeedbackRecoverImages: ""
  };
  issueVisible.value = true;
}

async function submitIssue() {
  if (!issueForm.value.sysFeedbackRecoverContent.trim()) {
    ElMessage.warning("请填写处理回复内容");
    return;
  }
  issueLoading.value = true;
  try {
    await issueFeedback({ ...issueForm.value });
    ElMessage.success("反馈处理成功");
    issueVisible.value = false;
    tableRef.value?.reload();
    loadStatistic();
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : "处理失败");
  } finally {
    issueLoading.value = false;
  }
}

/* 图表 option */
const pieOption = computed<EChartsOption>(() => {
  const arr = statistic.value.typeStatistics ?? [];
  return {
    color: ["#5b8ff9", "#5ad8a6", "#5d7092", "#f6bd16", "#e86452", "#6dc8ec", "#945fb9"],
    tooltip: { trigger: "item", formatter: "{b}: {c} 条 ({d}%)" },
    legend: {
      bottom: 0,
      icon: "circle",
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: "#606266", fontSize: 12 }
    },
    series: [
      {
        type: "pie",
        radius: ["46%", "70%"],
        center: ["50%", "44%"],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: "#fff", borderWidth: 2, borderRadius: 4 },
        label: { show: false },
        labelLine: { show: false },
        emphasis: {
          scale: true,
          scaleSize: 6,
          label: { show: true, fontSize: 14, fontWeight: "bold", formatter: "{b}\n{c} 条" }
        },
        data: arr.map((t) => ({ name: t.name || t.type, value: t.value ?? 0 }))
      }
    ]
  };
});

const trendOption = computed<EChartsOption>(() => {
  const arr = statistic.value.trendStatistics ?? [];
  return {
    tooltip: { trigger: "axis", valueFormatter: (v: unknown) => `${v} 条` },
    legend: {
      data: ["未解决", "已解决"],
      top: 0,
      right: 8,
      itemWidth: 12,
      itemHeight: 8,
      textStyle: { fontSize: 11, color: "#606266" }
    },
    grid: { left: 8, right: 16, top: 32, bottom: 0, containLabel: true },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: arr.map((t) => t.date),
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { color: "#606266", fontSize: 11 }
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#606266", fontSize: 11 },
      splitLine: { lineStyle: { type: "dashed", color: "rgba(0,0,0,0.06)" } }
    },
    series: [
      {
        name: "未解决",
        type: "line",
        smooth: true,
        showSymbol: false,
        stack: "total",
        lineStyle: { width: 2, color: "#E6A23C" },
        itemStyle: { color: "#E6A23C" },
        areaStyle: { color: "rgba(230,162,60,0.28)" },
        data: arr.map((t) => t.pendingCount ?? 0)
      },
      {
        name: "已解决",
        type: "line",
        smooth: true,
        showSymbol: false,
        stack: "total",
        lineStyle: { width: 2, color: "#67C23A" },
        itemStyle: { color: "#67C23A" },
        areaStyle: { color: "rgba(103,194,58,0.28)" },
        data: arr.map((t) => t.resolvedCount ?? 0)
      }
    ]
  };
});

function getTodayCount() {
  const d = new Date();
  const mmdd = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return statistic.value.trendStatistics?.find((t) => t.date === mmdd)?.count ?? 0;
}

onMounted(() => {
  loadStatistic();
});
</script>

<template>
  <div class="feedback-page">
    <!-- 统计卡片 -->
    <div class="stat-cards">
      <div class="stat-card stat-card--primary">
        <div class="stat-card__icon"><ChatDotRound /></div>
        <div class="stat-card__info">
          <div class="stat-card__value">{{ statistic.total ?? 0 }}</div>
          <div class="stat-card__label">总反馈</div>
        </div>
      </div>
      <div class="stat-card stat-card--warning">
        <div class="stat-card__icon"><Clock /></div>
        <div class="stat-card__info">
          <div class="stat-card__value">{{ statistic.pending ?? 0 }}</div>
          <div class="stat-card__label">待处理</div>
        </div>
      </div>
      <div class="stat-card stat-card--success">
        <div class="stat-card__icon"><CircleCheckFilled /></div>
        <div class="stat-card__info">
          <div class="stat-card__value">{{ statistic.resolved ?? 0 }}</div>
          <div class="stat-card__label">已处理</div>
        </div>
      </div>
      <div class="stat-card stat-card--info">
        <div class="stat-card__icon"><Bell /></div>
        <div class="stat-card__info">
          <div class="stat-card__value">{{ getTodayCount() }}</div>
          <div class="stat-card__label">今日新增</div>
        </div>
      </div>
    </div>

    <!-- 图表 -->
    <div class="chart-cards">
      <div class="chart-card">
        <div class="chart-card__title">
          <DataAnalysis class="chart-card__icon" />
          <span>反馈类型占比</span>
        </div>
        <ReEChart :option="pieOption" height="272px" />
      </div>
      <div class="chart-card">
        <div class="chart-card__title">
          <TrendCharts class="chart-card__icon" />
          <span>近 30 天反馈趋势</span>
        </div>
        <ReEChart :option="trendOption" height="272px" />
      </div>
    </div>

    <!-- 反馈表格 -->
    <ReTable
      ref="tableRef"
      table-id="system-feedback"
      :columns="columns"
      :loader="loadFeedback"
      :pagination="true"
      :params="{}"
      row-key="sysFeedbackId"
      :row-class-name="rowClassName"
      v-model:page="query.page"
      v-model:page-size="query.pageSize"
      :search="{ filters: searchFilters, title: '搜索', btnMode: 'text' }"
      :search-gap="16"
      v-model:search-model="query"
      @search-reset="handleReset"
      @sort-change="onSortChange"
    >
      <template #id="{ row }">
        <span class="id-cell">#{{ row.sysFeedbackId }}</span>
      </template>

      <!--
        可操作空态：默认的 el-empty 只能看不能做。
        反馈由终端用户提交，管理端造不出来，所以只给一个「刷新」出口；
        语义用 ChatLineSquare（对话气泡），与页面统计卡的 ChatDotRound 同族。
        page-empty 系列样式在 pages/system/src/styles/system-page.css 全局提供，本页不重复定义。
      -->
      <template #empty>
        <div class="page-empty">
          <span class="page-empty__icon"><ReIcon name="ChatLineSquare" :size="22" /></span>
          <span class="page-empty__title">还没有用户反馈</span>
          <span class="page-empty__desc">用户从小程序、App 或平台内提交的功能建议、BUG 与其他问题都会汇总到这里。</span>
          <span class="page-empty__actions">
            <ReButton icon="Refresh" @click="reload">刷新</ReButton>
          </span>
        </div>
      </template>

      <template #createTime="{ row }">
        <div class="time-cell">
          <ReTime :value="row.createTime" format="YYYY-MM-DD HH:mm:ss" relative />
        </div>
      </template>

      <template #type="{ row }">
        <!-- 状态标签统一：plain 底 + 状态点，扫行时靠点识别，不再靠实心色块 -->
        <ReTag :type="getTypeTag(row.sysFeedbackType).type" effect="plain" dot>
          {{ getTypeTag(row.sysFeedbackType).text }}
        </ReTag>
      </template>

      <template #platform="{ row }">
        <span v-if="row.sysFeedbackPlatform">{{ row.sysFeedbackPlatform }}</span>
        <span v-else class="text-muted">-</span>
      </template>

      <template #content="{ row }">
        <el-button link type="primary" class="content-btn" @click="showDetail(row)">
          {{ row.sysFeedbackContent }}
        </el-button>
      </template>

      <template #images="{ row }">
        <el-badge
          :value="parseImages(row.sysFeedbackImages).length"
          :hidden="parseImages(row.sysFeedbackImages).length === 0"
          :max="99"
          class="img-badge"
          type="primary"
        >
          <ReButton
            layout="square"
            icon="Picture"
            :disabled="parseImages(row.sysFeedbackImages).length === 0"
            @click="previewImages(row.sysFeedbackImages)"
          />
        </el-badge>
      </template>

      <template #priority="{ row }">
        <ReTag :type="getPriorityTag(row.sysFeedbackPriority).type" effect="plain" dot>
          {{ getPriorityTag(row.sysFeedbackPriority).text }}
        </ReTag>
      </template>

      <template #recoverTime="{ row }">
        <div v-if="row.sysFeedbackRecoverTime" class="recover-cell">
          <div class="recover-cell__time">{{ row.sysFeedbackRecoverTime }}</div>
          <div class="recover-cell__duration">
            耗时 {{ formatDuration(row.createTime, row.sysFeedbackRecoverTime) }}
          </div>
        </div>
        <span v-else class="text-muted">-</span>
      </template>

      <template #status="{ row }">
        <ReTag :type="row.sysFeedbackStatus === 1 ? 'success' : 'warning'" effect="plain" dot>
          {{ row.sysFeedbackStatus === 1 ? "已处理" : "未处理" }}
        </ReTag>
      </template>

      <template #action="{ row }">
        <ReButton layout="square" type="primary" icon="View" tip="详情" @click="showDetail(row)" />
        <ReButton
          v-admin
          layout="square"
          type="primary"
          icon="EditPen"
          tip="处理"
          :disabled="row.sysFeedbackStatus === 1"
          @click="showIssue(row)"
        />
      </template>
    </ReTable>

    <!-- 详情弹窗 -->
    <ReDialog
      v-model="detailVisible"
      class="fb-detail-dialog"
      width="640px"
      headless
      :show-footer="false"
      :footer-hidden="true"
    >
      <template v-if="detailData">
        <div class="fb-detail">
          <!-- 标题 + 编号 -->
          <header class="fb-detail__header">
            <div class="fb-detail__heading">
              <h3 class="fb-detail__title">反馈详情</h3>
              <span class="fb-detail__no">{{ detailNo }}</span>
            </div>
          </header>

          <!-- 标签 + 提交时间 -->
          <div class="fb-detail__tags">
            <div class="fb-detail__tags-left">
              <ReTag
                round
                
                effect="light"
                class="fb-detail__tag"
                :type="getTypeTag(detailData.sysFeedbackType).type"
              >
                {{ getTypeTag(detailData.sysFeedbackType).text }}
              </ReTag>
              <ReTag
                round
                
                effect="light"
                class="fb-detail__tag"
                :type="getPriorityTag(detailData.sysFeedbackPriority).type"
              >
                {{ getPriorityTag(detailData.sysFeedbackPriority).text }}
              </ReTag>
              <!-- 状态标签统一为 plain + 状态点；类型 / 优先级是「属性」不是「状态」，保留 light + round 以示区分 -->
              <ReTag
                round
                effect="light"
                class="fb-detail__tag"
                :type="detailData.sysFeedbackStatus === 1 ? 'success' : 'warning'"
                dot
              >
                {{ detailData.sysFeedbackStatus === 1 ? "已处理" : "未处理" }}
              </ReTag>
            </div>
            <div class="fb-detail__submitted">
              <el-icon><Clock /></el-icon>
              <ReTime :value="detailData.createTime" relative>
                <template #relativeTime="{ value }">{{ value }}提交</template>
              </ReTime>
              <el-icon class="fb-detail__submitted-chevron"><ArrowRight /></el-icon>
            </div>
          </div>

          <!-- 正文卡片 -->
          <div class="fb-detail__body">
            <div class="fb-detail__body-icon">
              <el-icon><ChatDotRound /></el-icon>
            </div>
            <div class="fb-detail__body-main">
              <p class="fb-detail__content">{{ detailData.sysFeedbackContent || "-" }}</p>
              <p v-if="detailSource" class="fb-detail__source">{{ detailSource }}</p>
            </div>
          </div>

          <!-- 反馈图片 -->
          <div v-if="detailImages.length > 0" class="fb-detail__images">
            <div class="fb-detail__images-title">反馈图片</div>
            <el-image
              v-for="(url, i) in detailImages"
              :key="i"
              :src="url"
              class="fb-detail__image"
              :preview-src-list="detailImages"
              :initial-index="i"
              fit="cover"
            />
          </div>

          <!-- 元信息 -->
          <div class="fb-detail__grid">
            <div class="fb-detail__cell">
              <span class="fb-detail__cell-icon fb-detail__cell-icon--primary">
                <el-icon><Platform /></el-icon>
              </span>
              <div class="fb-detail__cell-body">
                <span class="fb-detail__cell-label">反馈来源</span>
                <span class="fb-detail__cell-value">
                  {{ detailData.sysFeedbackPlatform || "-" }}
                </span>
              </div>
              <span class="fb-detail__cell-aside">→</span>
            </div>
            <div class="fb-detail__cell">
              <span class="fb-detail__cell-icon fb-detail__cell-icon--success">
                <el-icon><User /></el-icon>
              </span>
              <div class="fb-detail__cell-body">
                <span class="fb-detail__cell-label">提交人</span>
                <span class="fb-detail__cell-value">
                  {{ detailData.createName || detailData.createBy || "-" }}
                </span>
              </div>
              <span class="fb-detail__cell-aside">→</span>
            </div>
            <div class="fb-detail__cell">
              <span class="fb-detail__cell-icon fb-detail__cell-icon--warning">
                <el-icon><Monitor /></el-icon>
              </span>
              <div class="fb-detail__cell-body">
                <span class="fb-detail__cell-label">客户端</span>
                <span class="fb-detail__cell-value" :title="detailData.sysFeedbackUserAgent">
                  {{ detailData.sysFeedbackUserAgent || "-" }}
                </span>
              </div>
              <span class="fb-detail__cell-aside">→</span>
            </div>
            <div class="fb-detail__cell">
              <span class="fb-detail__cell-icon fb-detail__cell-icon--primary">
                <el-icon><UserFilled /></el-icon>
              </span>
              <div class="fb-detail__cell-body">
                <span class="fb-detail__cell-label">处理人</span>
                <span class="fb-detail__cell-value">
                  {{ detailData.sysFeedbackDealName || "待分配" }}
                </span>
              </div>
              <span class="fb-detail__cell-aside">→</span>
            </div>
            <div class="fb-detail__cell">
              <span class="fb-detail__cell-icon fb-detail__cell-icon--info">
                <el-icon><Clock /></el-icon>
              </span>
              <div class="fb-detail__cell-body">
                <span class="fb-detail__cell-label">处理时间</span>
                <span class="fb-detail__cell-value">
                  {{ detailData.sysFeedbackRecoverTime || "—" }}
                </span>
              </div>
              <span class="fb-detail__cell-aside">—</span>
            </div>
            <div class="fb-detail__cell">
              <span class="fb-detail__cell-icon fb-detail__cell-icon--danger">
                <el-icon><CollectionTag /></el-icon>
              </span>
              <div class="fb-detail__cell-body">
                <span class="fb-detail__cell-label">反馈类型</span>
                <span class="fb-detail__cell-value">
                  {{ getTypeTag(detailData.sysFeedbackType).text }}
                </span>
              </div>
              <span class="fb-detail__cell-aside">→</span>
            </div>
          </div>

          <!-- 处理历史 -->
          <div v-if="detailHistoryVisible" class="fb-detail__history">
            <div class="fb-detail__history-title">处理历史</div>
            <template v-if="detailData.sysFeedbackRecoverContent">
              <p class="fb-detail__history-text">{{ detailData.sysFeedbackRecoverContent }}</p>
              <p class="fb-detail__history-meta">
                {{ detailData.sysFeedbackDealName || "处理人" }} ·
                {{ detailData.sysFeedbackRecoverTime || "-" }}
                <template v-if="detailData.sysFeedbackRecoverTime">
                  （耗时
                  {{
                    formatDuration(detailData.createTime, detailData.sysFeedbackRecoverTime)
                  }}）
                </template>
              </p>
            </template>
            <p v-else class="fb-detail__history-empty">暂无处理记录</p>
          </div>

          <!-- 底部操作栏 -->
          <footer class="fb-detail__footer">
            <button
              type="button"
              class="fb-detail__history-link"
              @click="detailHistoryVisible = !detailHistoryVisible"
            >
              <el-icon><ArrowLeft /></el-icon>
              <span>查看处理历史</span>
              <span class="fb-detail__history-link-arrow">→</span>
            </button>
            <div class="fb-detail__actions">
              <ReButton
                v-admin
                type="primary"
                class="fb-detail__btn-primary"
                :disabled="detailData.sysFeedbackStatus === 1"
                @click="handleIssueFromDetail"
              >
                {{ detailData.sysFeedbackStatus === 1 ? "已处理" : "去处理" }}
              </ReButton>
            </div>
          </footer>
        </div>
      </template>
    </ReDialog>

    <!-- 处理弹窗 -->
    <ReDialog v-model="issueVisible" title="处理反馈" width="560px">
      <div class="issue-form">
        <ReInput
          v-model="issueForm.sysFeedbackRecoverContent"
          type="textarea"
          :rows="5"
          placeholder="请输入处理回复内容"
          maxlength="500"
          show-word-limit
        />
      </div>
      <template #footer>
        <ReButton @click="issueVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="issueLoading" @click="submitIssue">确认处理</ReButton>
      </template>
    </ReDialog>

    <!-- 图片预览 -->
    <el-image-viewer
      v-if="imageViewerVisible"
      :url-list="imageViewerUrls"
      @close="imageViewerVisible = false"
    />
  </div>
</template>

<style scoped>
.feedback-page {
  padding: 0;
}

/* 统计卡片 */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  /* 原 10px 魔法值 → --el-radius-md（8px 档） */
  border-radius: var(--el-radius-md, 8px);
  /* 原 transition: all 0.2s → 逐项声明，避免 all 连带过渡未预期的属性 */
  transition:
    border-color var(--el-transition-duration-fast, 0.2s) ease,
    transform var(--el-transition-duration-fast, 0.2s) ease,
    box-shadow var(--el-transition-duration-fast, 0.2s) ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--el-box-shadow);
}

.stat-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  /* 原 10px 魔法值 → --el-radius-md（8px 档） */
  border-radius: var(--el-radius-md, 8px);
  font-size: 22px;
}

.stat-card--primary .stat-card__icon {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.stat-card--warning .stat-card__icon {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
}

.stat-card--success .stat-card__icon {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}

.stat-card--info .stat-card__icon {
  background: var(--el-color-info-light-9);
  color: var(--el-color-info);
}

.stat-card__value {
  font-size: 24px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1.2;
}

.stat-card__label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

/* 图表 */
.chart-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.chart-card {
  padding: 16px 16px 8px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  /* 原 10px 魔法值 → --el-radius-md（8px 档） */
  border-radius: var(--el-radius-md, 8px);
}

.chart-card__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.chart-card__icon {
  width: 16px;
  height: 16px;
  flex: none;
  color: var(--el-color-primary);
}

.platform-text {
  color: var(--el-text-color-regular);
}

.text-muted {
  color: var(--el-text-color-placeholder);
}

.content-btn {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  justify-content: flex-start;
}

/* ============ 表格外壳 ============
   ReTable 的边框 / 圆角 / 投影 / focus-within 变色由插件自身提供，
   见 packages/ui ReTable/shared/table-vars.css 与 ReTable.vue 的
   `.re-table` / `.re-table--separated` 规则，本页不再重复声明。 */

/* 反馈图片：el-image 根节点上挂预览点击，但元素本身不可聚焦，
   补光标与焦点环，让「这里能点」和「这里有焦点」两件事都成立。 */
.fb-detail__image {
  cursor: pointer;
  outline: none;
}
.fb-detail__image:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

/* ==================== 反馈详情弹窗（对齐设计稿 · koi/el 变量） ==================== */
.fb-detail {
  padding: 8px 4px 4px;
  font-size: 14px;
  line-height: 1.5;
}

.fb-detail__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding-right: 44px; /* 给右上角关闭 FAB 留位 */
  margin-bottom: 16px;
}

.fb-detail__heading {
  display: flex;
  align-items: baseline;
  gap: 12px;
  min-width: 0;
}

.fb-detail__title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--el-text-color-primary);
}

.fb-detail__no {
  font-size: 14px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

/* 标签行 */
.fb-detail__tags {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.fb-detail__tags-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.fb-detail__tag {
  font-weight: 500;
  border-width: 1.5px;
}

.fb-detail__submitted {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex: none;
  font-size: 13px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
}

.fb-detail__submitted-chevron {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.fb-detail__submitted :deep(.re-time__main) {
  display: none;
}
.fb-detail__submitted :deep(.re-time__relative) {
  margin-top: 0;
  font-size: inherit;
  color: inherit;
}

/* 正文卡片：柔和渐变 + 大圆形图标 */
.fb-detail__body {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 22px 24px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 8%, transparent);
  border-radius: var(--el-radius-xl, 16px);
  background: linear-gradient(
    120deg,
    color-mix(in srgb, var(--el-color-primary) 10%, var(--el-bg-color)),
    color-mix(in srgb, var(--el-color-info) 8%, var(--el-bg-color))
  );
}

.fb-detail__body-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 64px;
  height: 64px;
  font-size: 28px;
  color: var(--el-color-white);
  border-radius: var(--el-radius-full, 9999px);
  background: linear-gradient(
    145deg,
    var(--el-color-primary),
    color-mix(in srgb, var(--el-color-primary) 55%, var(--el-color-info))
  );
  box-shadow: 0 8px 20px color-mix(in srgb, var(--el-color-primary) 28%, transparent);
}

.fb-detail__body-main {
  min-width: 0;
  flex: 1;
}

.fb-detail__content {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.45;
  color: var(--el-text-color-primary);
}

.fb-detail__source {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* 反馈图片 */
.fb-detail__images {
  margin-top: 16px;
}

.fb-detail__images-title {
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.fb-detail__image {
  width: 76px;
  height: 76px;
  margin-right: 8px;
  border-radius: var(--el-radius-md, 8px);
  border: 1px solid var(--el-border-color-lighter);
}

/* 元信息网格：白底卡片 + 图标底 + 右侧箭头 */
.fb-detail__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 18px;
}

.fb-detail__cell {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color);
  min-width: 0;
  transition: border-color var(--el-transition-duration-fast, 0.2s);
}

.fb-detail__cell:hover {
  border-color: color-mix(in srgb, var(--el-color-primary) 28%, var(--el-border-color-lighter));
}

.fb-detail__cell-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 36px;
  height: 36px;
  font-size: 16px;
  border-radius: var(--el-radius-md, 8px);
}

.fb-detail__cell-icon--primary {
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.fb-detail__cell-icon--success {
  color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 12%, transparent);
}
.fb-detail__cell-icon--warning {
  color: var(--el-color-warning);
  background: color-mix(in srgb, var(--el-color-warning) 12%, transparent);
}
.fb-detail__cell-icon--danger {
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 12%, transparent);
}
.fb-detail__cell-icon--info {
  color: var(--el-color-info);
  background: color-mix(in srgb, var(--el-color-info) 12%, transparent);
}

.fb-detail__cell-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.fb-detail__cell-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.3;
}

.fb-detail__cell-value {
  overflow: hidden;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.fb-detail__cell-aside {
  flex: none;
  font-size: 14px;
  color: var(--el-text-color-placeholder);
  padding-right: 2px;
}

/* 处理历史 */
.fb-detail__history {
  margin-top: 16px;
  padding: 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-fill-color-lighter);
}

.fb-detail__history-title {
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.fb-detail__history-text {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.fb-detail__history-meta {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.fb-detail__history-empty {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* 底部操作栏 */
.fb-detail__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.fb-detail__history-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  cursor: pointer;
  outline: none;
  transition: color var(--el-transition-duration-fast, 0.2s);
}

.fb-detail__history-link:hover {
  color: var(--el-color-primary);
}

/* 键盘可达：原生 button 也要显焦点环 */
.fb-detail__history-link:focus-visible {
  border-radius: var(--el-radius-xs, 4px);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.fb-detail__history-link-arrow {
  font-weight: 400;
}

.fb-detail__actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.fb-detail__actions :deep(.fb-detail__btn-ghost) {
  height: 36px;
  padding: 0 22px;
  border-radius: var(--el-radius-full, 9999px);
  font-weight: 600;
}

.fb-detail__actions :deep(.fb-detail__btn-primary) {
  border: none;
  height: 36px;
  padding: 0 22px;
  border-radius: var(--el-radius-full, 9999px);
  font-weight: 600;
  background: linear-gradient(
    135deg,
    var(--el-color-primary),
    color-mix(in srgb, var(--el-color-primary) 55%, var(--el-color-info))
  );
  box-shadow: 0 4px 12px color-mix(in srgb, var(--el-color-primary) 28%, transparent);
}

.fb-detail__actions :deep(.fb-detail__btn-primary:hover) {
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-3),
    var(--el-color-primary)
  );
}

.fb-detail__actions :deep(.fb-detail__btn-primary.is-disabled) {
  background: var(--el-color-primary-light-5);
  box-shadow: none;
  opacity: 0.7;
}

@media (max-width: 640px) {
  .fb-detail__grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .fb-detail__title {
    font-size: 20px;
  }
  .fb-detail__tags {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* BUG 未处理行高亮（背景落在单元格上） */
:deep(.el-table .feedback-row--bug-pending) > td.el-table__cell {
  background-color: var(--el-color-danger-light-9);
}
.img-badge {
  display: inline-flex;
}
.recover-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.recover-cell__time {
  font-size: 12px;
  color: var(--el-text-color-regular);
  line-height: 1.4;
}
.recover-cell__duration {
  font-size: 11px;
  color: var(--el-color-primary);
  line-height: 1.4;
}
.id-cell {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  font-weight: 500;
}
.time-cell {
  display: flex;
  justify-content: center;
}
.issue-form {
  padding: 4px 0;
}

@media (max-width: 1100px) {
  .stat-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  .chart-cards {
    grid-template-columns: 1fr;
  }
}

/* 尊重系统「减少动态效果」偏好：把本页自己的过渡一并关掉
   （ReTable 的过渡由插件自带的同名媒体查询处理） */
@media (prefers-reduced-motion: reduce) {
  .stat-card,
  .fb-detail__cell,
  .fb-detail__history-link {
    transition: none;
  }
}
</style>

<!-- 详情弹窗为 headless（teleport 到 body），弹窗外壳样式需非 scoped -->
<style>
.fb-detail-dialog {
  position: relative;
  overflow: hidden;
  border-radius: var(--el-dialog-border-radius, var(--el-radius-xl, 16px));
}

.fb-detail-dialog::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(
    90deg,
    var(--el-color-primary),
    color-mix(in srgb, var(--el-color-primary) 45%, var(--el-color-info)),
    var(--el-color-info-light-3)
  );
  z-index: 1;
}
</style>

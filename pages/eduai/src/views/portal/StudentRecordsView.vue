<template>
  <div class="mr">
    <header class="mr-head">
      <h2 class="mr-title">我的答题记录</h2>
      <p class="mr-sub">老师批改后的答卷都在这里，可查看每题得分与评语。</p>
    </header>

    <div class="mr-toolbar">
      <el-button size="small" @click="load">刷新</el-button>
      <div class="mr-space" />
      <span class="mr-count">共 {{ tasks.length }} 份</span>
    </div>

    <!--
      窄屏用卡片、宽屏用表格。6 列固定宽度合计 800px（任务号220/类型90/状态100/
      阶段120/时间170/操作100），在 390px 手机上 element-plus 按 fixed 布局把
      表头裁到 334px 宽且不随表体同步 —— 结果是「后 4 列看不见列名、还得左右拖」。
      这是用户投诉 #1「高度无自适应响应式」在列表页上的真实形态。
      两套都渲染、只用 CSS 切换：不引 viewport 状态，就没有 resize 监听和
      首帧闪一下表格的问题。
    -->
    <!-- 表格统一 ReTable（替换裸 el-table）：engine="element" 沿用原 el-table 的 DOM 与
         边框样式（border 走 ReTable 默认 true）；分页/工具栏关闭（原表没有）；
         minHeight:0 关掉 fill 与空态 440px 强撑；v-loading → :loading。下同。 -->
    <ReTable
      :loading="loading"
      class="mr-wide"
      :data="tasks"
      :columns="taskColumns"
      size="small"
      engine="element"
      :pagination="false"
      :toolbar="false"
      :layout-table="{ minHeight: 0 }"
    >
      <template #col-markingTaskMode="{ row }">{{ row.markingTaskMode === "ANY" ? "任意卷" : "自有卷" }}</template>
      <template #col-markingTaskStatus="{ row }">
        <el-tag size="small" :type="statusType(row.markingTaskStatus)">{{ statusLabel(row.markingTaskStatus) }}</el-tag>
      </template>
      <template #col-actions="{ row }">
        <el-button link type="primary" @click.stop="viewResult(row)">查看</el-button>
      </template>
    </ReTable>

    <ul v-loading="loading" class="mr-cards">
      <li v-for="row in tasks" :key="row.markingTaskTaskId" class="mr-card">
        <div class="mr-card__top">
          <span class="mr-card__id">#{{ row.markingTaskTaskId }}</span>
          <el-tag size="small" :type="statusType(row.markingTaskStatus)">{{ statusLabel(row.markingTaskStatus) }}</el-tag>
        </div>
        <dl class="mr-card__meta">
          <dt>类型</dt>
          <dd>{{ row.markingTaskMode === "ANY" ? "任意卷" : "自有卷" }}</dd>
          <dt>阶段</dt>
          <dd>{{ row.markingTaskStage || "—" }}</dd>
          <dt>时间</dt>
          <dd>{{ row.markingTaskStartTime || "—" }}</dd>
        </dl>
        <button type="button" class="mr-card__go" @click="viewResult(row)">查看答卷</button>
      </li>
      <li v-if="!loading && !tasks.length" class="mr-card__empty">还没有答题记录</li>
    </ul>

    <ReDialog v-model="dialogVisible" title="答题详情" width="720px">
      <div v-if="result" class="mr-result">
        <p class="mr-sum">
          得分 <b>{{ result.totalScore }}</b> · 共 {{ result.results.length }} 题 ·
          {{ result.finished ? "已批改" : "批改中" }}
        </p>
        <!-- 表格统一 ReTable（替换裸 el-table）：同上；border 走 ReTable 默认 -->
        <ReTable
          :data="result.results"
          :columns="resultColumns"
          size="small"
          engine="element"
          :pagination="false"
          :toolbar="false"
          :layout-table="{ minHeight: 0 }"
        >
          <template #col-score="{ row }">
            {{ row.teacherScore != null ? row.teacherScore : row.score }}
          </template>
          <template #col-comment="{ row }">{{ row.teacherComment || row.comment || "—" }}</template>
        </ReTable>
      </div>
      <el-empty v-else description="加载中…" />
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * StudentRecordsView —— 学生端「我的答题/阅卷记录」（内嵌于学生门户）。
 *
 * <p>数据走 {@code /v2/edu/student/marking/*}：后端按任务上的学生标识 = 本人学号过滤，
 * 学生只能看到属于自己的答卷与得分。</p>
 */
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { eduaiApi } from "../../api/eduaiApi";
import type { MarkingResultVO, TeacherMarkingTask } from "../../api/types";
import ReDialog from "@repo/ui/re-dialog";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";

const loading = ref(false);
const tasks = ref<TeacherMarkingTask[]>([]);
const dialogVisible = ref(false);
const result = ref<MarkingResultVO | null>(null);

/** 记录表列配置（原模板里的 el-table-column 收敛到数组；带 #default 的列配 slot + #col-<slot>） */
const taskColumns: ReTableColumn[] = [
  { prop: "markingTaskTaskId", label: "任务号", minWidth: 220 },
  { prop: "markingTaskMode", label: "类型", width: 90, slot: "markingTaskMode" },
  { prop: "markingTaskStatus", label: "状态", width: 100, slot: "markingTaskStatus" },
  { prop: "markingTaskStage", label: "阶段", width: 120 },
  { prop: "markingTaskStartTime", label: "时间", minWidth: 170 },
  { prop: "actions", label: "操作", width: 100, slot: "actions" },
];

/** 答题详情表列配置（弹窗里的结果表） */
const resultColumns: ReTableColumn[] = [
  { prop: "questionId", label: "题号", width: 80 },
  { prop: "maxScore", label: "满分", width: 80 },
  { prop: "score", label: "得分", width: 90, slot: "score" },
  { prop: "comment", label: "评语", minWidth: 220, slot: "comment" },
];

const statusLabel = (n?: number) => ({ 0: "待处理", 1: "处理中", 2: "已完成", 3: "失败" })[Number(n ?? 0)] ?? "待处理";
const statusType = (n?: number) => {
  const code = Number(n ?? 0);
  return code === 2 ? "success" : code === 3 ? "danger" : code === 1 ? "warning" : "info";
};

async function load() {
  loading.value = true;
  try {
    tasks.value = await eduaiApi.studentMarkingTasks(50);
  } catch (e) {
    ElMessage.error(`记录加载失败：${e instanceof Error ? e.message : String(e)}`);
  } finally {
    loading.value = false;
  }
}

async function viewResult(row: TeacherMarkingTask) {
  dialogVisible.value = true;
  result.value = null;
  try {
    result.value = await eduaiApi.studentMarkingResult(row.markingTaskTaskId);
  } catch (e) {
    ElMessage.error(`详情加载失败：${e instanceof Error ? e.message : String(e)}`);
  }
}

onMounted(() => {
  void load();
});
</script>

<style scoped>
.mr {
  padding: 18px 20px 28px;
}
.mr-title {
  margin: 0;
  font-size: 22px;
  font-weight: 900;
  color: var(--el-text-color-primary);
}
.mr-sub {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.mr-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 16px 0 14px;
}
.mr-space {
  flex: 1;
}
.mr-count {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.mr-sum {
  margin: 0 0 10px;
  font-size: 14px;
  color: var(--el-text-color-regular);
}
.mr-sum b {
  color: var(--el-color-primary);
  font-size: 18px;
}

/*
 * 宽窄两套列表。断点取 880px，是算出来的不是拍的：
 * 6 列最小宽合计 = 任务号220 + 类型90 + 状态100 + 阶段120 + 时间170 + 操作100
 * = 800px，再加 .mr 两侧 padding 20+20=40px，合计 840px。
 * 断点早先取 760px，834（tablet）和 844（横屏手机）两档仍在用表格，
 * 表格按 fixed 布局把表头裁掉 22px / 12px 且不随表体同步 —— 这两档正是
 * 扫描抓出来的那 2 项 FAIL。880px 留 40px 余量。
 */
.mr-cards {
  display: none;
  margin: 0;
  padding: 0;
  list-style: none;
}
.mr-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
  padding: 12px 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
}
.mr-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.mr-card__id {
  font-size: 15px;
  font-weight: 800;
  color: var(--el-text-color-primary);
}
.mr-card__meta {
  display: grid;
  /* 标签列固定宽，值列吃掉剩余宽度；长的时间戳也不会把卡片撑破 */
  grid-template-columns: auto minmax(0, 1fr);
  gap: 4px 10px;
  margin: 0;
  font-size: 13px;
}
.mr-card__meta dt {
  color: var(--el-text-color-secondary);
}
.mr-card__meta dd {
  margin: 0;
  color: var(--el-text-color-regular);
  /* 时间戳/长文本不换行会溢出卡片，截断加省略号 */
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.mr-card__go {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 18px;
  font-size: 14px;
  font-weight: 700;
  color: var(--el-color-primary);
  cursor: pointer;
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: var(--el-radius-full, 9999px);
}
.mr-card__go:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 1px;
}
.mr-card__empty {
  padding: 28px 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

@media (max-width: 880px) {
  .mr {
    padding: 14px 12px 20px;
  }
  .mr-title {
    font-size: 19px;
  }
  .mr-wide {
    display: none;
  }
  .mr-cards {
    display: grid;
    /* 手机竖屏单列；横屏或平板窄边分两列，避免一张卡占满整屏 */
    grid-template-columns: repeat(auto-fit, minmax(clamp(240px, 100%, 320px), 1fr));
    gap: 10px;
  }
  .mr-card {
    margin-bottom: 0;
  }
  /* 弹窗里的详情表在窄屏同样放不下 80+80+90+220=470px */
  .mr :deep(.el-dialog) {
    width: 94vw !important;
  }
}

/* 横向滚动容器：表格在宽屏本来就该能左右滑，这里只是把滚动条显式出来，
   免得学生以为右侧还有列被「藏起来」了 */
.mr :deep(.el-scrollbar__bar) {
  opacity: 1;
}

/*
 * 表格「操作」列的 link 按钮。element-plus 的 link 型默认高 20px，低于
 * WCAG 2.2 的 2.5.8 Target Size (Minimum, AA) 24x24 硬底线。
 * 窄屏卡片版走 .mr-card__go 已有 44px，这里把宽屏表格版补到同一底线。
 * 同列的 el-tag 同为 20px，但 tag 不是可点目标，2.5.8 不适用，不动。
 */
.mr :deep(.el-table .el-button.is-link) {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 6px;
}
@media (pointer: coarse) {
  .mr :deep(.el-table .el-button.is-link) {
    min-height: 44px;
    padding: 0 14px;
  }
}
</style>

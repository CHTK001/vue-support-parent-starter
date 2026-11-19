<template>
  <div class="sp">
    <div class="sp-head">
      <h2 class="sp-title">我的试卷</h2>
      <p class="sp-sub">老师布置给本班的试卷都在这里，点「开始作答」在线答题，交卷后自动进入 AI 阅卷。</p>
    </div>

    <div v-loading="loading" class="sp-list">
      <article v-for="p in papers" :key="p.assignId" class="sp-card">
        <div class="sp-card__main">
          <div class="sp-card__name">
            {{ p.paperName || "未命名试卷" }}
            <el-tag
              v-if="taskOf(p)"
              size="small"
              class="sp-card__tag"
              :type="statusType(taskOf(p)!.markingTaskStatus)"
            >{{ statusLabel(taskOf(p)!.markingTaskStatus) }}</el-tag>
          </div>
          <div class="sp-card__meta">
            <span class="sp-chip">{{ p.paperSubject || "未设学科" }}</span>
            <span class="sp-chip">{{ p.paperGradeLevel || "—" }}{{ p.paperGrade ? " · " + p.paperGrade : "" }}</span>
            <span class="sp-chip">总分 {{ p.paperTotalScore ?? 0 }}</span>
            <span class="sp-chip">{{ p.paperQuestionCount ?? 0 }} 题</span>
            <span v-if="p.paperDuration" class="sp-chip">{{ p.paperDuration }} 分钟</span>
          </div>
          <div class="sp-card__sub">
            <span>布置时间：{{ p.assignTime || "—" }}</span>
            <span v-if="p.assignRemark" class="sp-card__remark">备注：{{ p.assignRemark }}</span>
          </div>
        </div>
        <div class="sp-card__ops">
          <el-button @click="openPaper(p)">查看试卷</el-button>
          <el-button type="primary" @click="openAnswer(p)">
            {{ taskOf(p) ? "查看结果" : "开始作答" }}
          </el-button>
        </div>
      </article>

      <div v-if="!loading && !papers.length" class="sp-empty">
        老师还没有给本班布置试卷。
      </div>
    </div>

    <!-- 试卷详情（只读） -->
    <ReDialog v-model="detailVisible" :title="detail?.paperName || '试卷'" width="760" append-to-body>
      <div v-loading="detailLoading" class="sp-detail">
        <div v-if="detail" class="sp-detail__meta">
          <span class="sp-chip">{{ detail.paperSubject }}</span>
          <span class="sp-chip">总分 {{ detail.paperTotalScore ?? 0 }}</span>
          <span class="sp-chip">{{ (detail.questions || []).length }} 题</span>
        </div>
        <ol class="sp-qs">
          <li v-for="(q, i) in detail?.questions || []" :key="q.id ?? i" class="sp-q">
            <div class="sp-q__stem">
              <span class="sp-q__no">{{ q.order ?? i + 1 }}.</span>
              <span>{{ q.stem }}</span>
              <span class="sp-q__score">{{ q.score ?? 0 }} 分</span>
            </div>
            <pre v-if="q.options" class="sp-q__options">{{ q.options }}</pre>
          </li>
        </ol>
        <div v-if="detail && !(detail.questions || []).length" class="sp-empty">这份试卷还没有题目。</div>
      </div>
    </ReDialog>

    <!-- 在线作答（全屏覆盖）：已提交过的卷子会直接进入结果态 -->
    <StudentPaperAnswerView
      v-if="answeringPaperId !== null"
      :paper-id="answeringPaperId"
      @close="closeAnswer"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * StudentPapersView —— 学生端「我的试卷」
 *
 * 数据来自 /v2/edu/paper-assign/my-class：**按登录态定位自己的班级**，
 * 不接受客户端传班级 ID，所以看不到别班的卷，也不会越权。
 * 在线作答走学生中心的新端点（/v2/edu/student/papers/{id}/answer|submit），
 * 是否已作答按本人阅卷任务（marking_task_student_id = 登录账号）与试卷交叉匹配。
 */
import { message } from "@repo/core";
import { onMounted, ref } from "vue";

import { eduaiApi } from "../../api/eduaiApi";
import type { Paper, PaperAssignVO, TeacherMarkingTask } from "../../api/types";
import ReDialog from "@repo/ui/re-dialog";
import StudentPaperAnswerView from "./StudentPaperAnswerView.vue";

const loading = ref(false);
const papers = ref<PaperAssignVO[]>([]);
/** 本人的阅卷任务：与试卷按 paperId 交叉匹配出「已作答/阅卷中/已完成」 */
const tasks = ref<TeacherMarkingTask[]>([]);
/** 正在在线作答的试卷；非空时全屏覆盖作答页 */
const answeringPaperId = ref<number | null>(null);

const statusLabel = (n?: number) =>
  ({ 0: "待处理", 1: "阅卷中", 2: "已完成", 3: "阅卷失败" })[Number(n ?? 0)] ?? "待处理";
const statusType = (n?: number) => {
  const code = Number(n ?? 0);
  return code === 2 ? "success" : code === 3 ? "danger" : code === 1 ? "warning" : "info";
};

/** 找某张卷对应的本人阅卷任务（没有 = 还没作答） */
function taskOf(p: PaperAssignVO): TeacherMarkingTask | undefined {
  return tasks.value.find((t) => t.markingTaskPaperId === p.paperId);
}

/** 关闭作答页后刷新：任务状态/成绩要反映最新一次提交 */
function closeAnswer(): void {
  answeringPaperId.value = null;
  void load();
}

/** 打开在线作答（已提交过的卷子在作答页内直接看结果） */
function openAnswer(p: PaperAssignVO): void {
  answeringPaperId.value = p.paperId;
}

const detailVisible = ref(false);
const detailLoading = ref(false);
const detail = ref<Paper | null>(null);

async function load() {
  loading.value = true;
  try {
    papers.value = (await eduaiApi.myClassPapers()) || [];
  } catch (e) {
    message.error(e instanceof Error ? e.message : "加载试卷失败");
  } finally {
    loading.value = false;
  }
  // 阅卷任务拉失败不挡试卷列表：状态匹配不到就都按「未作答」显示
  try {
    tasks.value = (await eduaiApi.studentMarkingTasks(50)) || [];
  } catch {
    tasks.value = [];
  }
}

/**
 * 查看试卷：按需拉一次详情（含题目），不预拉全部。
 *
 * <p>走 {@code myClassPaperDetail}（按「布置给本班」授权），不能用通用
 * {@code getPaper} —— 后者按「试卷归属人」鉴权，学生不是归属人会被 400 拒掉，
 * 表现为点「查看试卷」弹出空对话框（实测 B0500S0001）。</p>
 *
 * @param row 我班的试卷记录
 */
async function openPaper(row: PaperAssignVO) {
  detailVisible.value = true;
  detailLoading.value = true;
  detail.value = null;
  try {
    detail.value = await eduaiApi.myClassPaperDetail(row.paperId);
  } catch (e) {
    message.error(e instanceof Error ? e.message : "加载试卷详情失败");
  } finally {
    detailLoading.value = false;
  }
}

onMounted(() => {
  void load();
});
</script>

<style scoped>
.sp {
  position: relative;
  padding: 4px 2px 16px;
}
.sp-head {
  margin-bottom: 14px;
}
.sp-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.sp-sub {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.sp-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.sp-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color-overlay);
}
.sp-card__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.sp-card__name {
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.sp-card__tag {
  margin-left: 8px;
}
.sp-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.sp-card__sub {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.sp-card__remark {
  color: var(--el-color-warning-dark-2, var(--el-text-color-secondary));
}
.sp-card__ops {
  flex-shrink: 0;
}
.sp-chip {
  padding: 1px 8px;
  border-radius: var(--el-radius-sm, 6px);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.8;
}
.sp-empty {
  padding: 28px 0;
  text-align: center;
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}
.sp-detail__meta {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}
.sp-qs {
  margin: 0;
  padding-left: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.sp-q {
  border-bottom: 1px dashed var(--el-border-color-lighter);
  padding-bottom: 10px;
}
.sp-q__stem {
  display: flex;
  gap: 6px;
  font-size: 14px;
  color: var(--el-text-color-primary);
  line-height: 1.6;
}
.sp-q__no {
  flex-shrink: 0;
  font-weight: 700;
}
.sp-q__score {
  flex-shrink: 0;
  margin-left: auto;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.sp-q__options {
  margin: 6px 0 0 22px;
  font-family: inherit;
  font-size: 13px;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
}

/*
 * 窄屏。这页原来一条 @media 都没有，卡片是 flex row：
 * 卷名/信息在左、按钮在右，390px 下左边被挤到只剩按钮那么宽，
 * 卷名和 chip 全被压成竖排一两个字 —— 就是用户投诉的「风格与响应式不统一」。
 *
 * 收口方式：720px 以下整张卡改竖排（按钮独占一行通栏），480px 以下
 * 收紧内边距，题目分值不再用 margin-left:auto 顶到最右（竖排下会贴错边）。
 */
@media (max-width: 720px) {
  .sp {
    padding: 4px 0 12px;
  }
  .sp-title {
    font-size: 18px;
  }
  .sp-card {
    /* 竖排后 align-items:center 会让主区被压扁，改顶端对齐 */
    align-items: stretch;
    flex-direction: column;
    gap: 12px;
    padding: 13px 14px;
  }
  .sp-card__ops {
    /* 通栏按钮，44px 触摸高度 */
    display: flex;
  }
  .sp-card__ops :deep(.el-button) {
    flex: 1 1 auto;
    min-height: 44px;
    margin-left: 0;
  }
  .sp-q__options {
    margin-left: 0;
  }
}
@media (max-width: 480px) {
  .sp-card {
    padding: 12px 12px;
  }
  .sp-chip {
    font-size: 11px;
  }
  .sp-q__stem {
    /* 题号 + 题干 + 分值 三个盒子在 390px 下必然打架，分值换行独占 */
    flex-wrap: wrap;
  }
  .sp-q__score {
    margin-left: 0;
    width: 100%;
  }
}
/* 矮屏（1280x620 笔记本、平板横屏）：列表别把一屏撑破 */
@media (max-height: 700px) {
  .sp {
    padding-bottom: 8px;
  }
  .sp-head {
    margin-bottom: 10px;
  }
}
</style>

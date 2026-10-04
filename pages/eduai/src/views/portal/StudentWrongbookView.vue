<template>
  <div class="wb">
    <header class="wb-head">
      <h2 class="wb-title">我的错题本</h2>
      <p class="wb-sub">把做错的题收进来，标注掌握度，反复练到会为止。</p>
    </header>

    <div class="wb-toolbar">
      <el-select v-model="filter.masteryLevel" placeholder="全部掌握度" clearable size="default" style="width: 150px">
        <el-option label="未掌握" :value="0" />
        <el-option label="复习中" :value="1" />
        <el-option label="已掌握" :value="2" />
      </el-select>
      <el-input v-model="filter.subject" placeholder="学科（如 数学）" clearable size="default" style="width: 180px" />
      <el-button type="primary" @click="load">查询</el-button>
      <div class="wb-space" />
      <span class="wb-count">共 {{ rows.length }} 题</span>
    </div>

    <div v-loading="loading" class="wb-list">
      <el-empty v-if="!loading && !rows.length" description="还没有错题，继续加油！" />
      <article v-for="row in rows" :key="row.wrongQuestionId" class="wb-card">
        <div class="wb-card__top">
          <el-tag size="small" :type="masteryType(row.masteryLevel)">{{ masteryLabel(row.masteryLevel) }}</el-tag>
          <el-tag v-if="row.questionSubject" size="small" type="info">{{ row.questionSubject }}</el-tag>
          <el-tag v-if="row.questionType" size="small" type="info">{{ row.questionType }}</el-tag>
          <span class="wb-card__meta">错 {{ row.wrongCount ?? 0 }} 次 · 复习 {{ row.reviewCount ?? 0 }} 次</span>
        </div>
        <p class="wb-card__stem">{{ row.questionStem || "（题目正文缺失）" }}</p>
        <ul v-if="optionsOf(row).length" class="wb-card__opts">
          <li v-for="(opt, i) in optionsOf(row)" :key="i">{{ opt }}</li>
        </ul>
        <p v-if="revealed[row.wrongQuestionId]" class="wb-card__ans">
          答案：<b>{{ row.questionAnswer || "—" }}</b>
        </p>
        <div class="wb-card__act">
          <el-button link type="primary" @click="revealed[row.wrongQuestionId] = !revealed[row.wrongQuestionId]">
            {{ revealed[row.wrongQuestionId] ? "收起答案" : "查看答案" }}
          </el-button>
          <el-button link type="warning" @click="setMastery(row, 1)">标记复习中</el-button>
          <el-button link type="success" @click="setMastery(row, 2)">标记已掌握</el-button>
          <el-button v-if="row.masteryLevel !== 0" link @click="setMastery(row, 0)">重置未掌握</el-button>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * StudentWrongbookView —— 学生端错题本（内嵌于学生门户，不做整屏定位）。
 *
 * <p>数据走 {@code /v2/edu/student/wrongbook}：后端按登录态的学号过滤，
 * 学生只能看到自己的错题，且返回题干/选项/答案，便于直接复习。</p>
 */
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { eduaiApi } from "../../api/eduaiApi";
import type { StudentWrongQuestion } from "../../api/types";

const loading = ref(false);
const rows = ref<StudentWrongQuestion[]>([]);
const revealed = reactive<Record<number, boolean>>({});
const filter = reactive<{ subject: string; masteryLevel: number | null }>({ subject: "", masteryLevel: null });

const masteryLabel = (n?: number | null) => ({ 0: "未掌握", 1: "复习中", 2: "已掌握" })[Number(n ?? 0)] ?? "未掌握";
const masteryType = (n?: number | null) => {
  const code = Number(n ?? 0);
  return code === 2 ? "success" : code === 1 ? "warning" : "danger";
};

/**
 * 解析选项 JSON：后端存的是 JSON 文本，兼容「纯字符串数组」与 {A:..} 两种形态。
 *
 * @param row 错题卡
 * @returns 选项文本数组
 */
function optionsOf(row: StudentWrongQuestion): string[] {
  const raw = row.questionOptions;
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((x) => String(x));
    }
    if (parsed && typeof parsed === "object") {
      return Object.entries(parsed).map(([k, v]) => `${k}. ${String(v)}`);
    }
  } catch {
    return [raw];
  }
  return [];
}

async function load() {
  loading.value = true;
  try {
    rows.value = await eduaiApi.studentWrongbook({
      subject: filter.subject.trim() || undefined,
      masteryLevel: filter.masteryLevel ?? undefined,
    });
  } catch (e) {
    ElMessage.error(`错题加载失败：${e instanceof Error ? e.message : String(e)}`);
  } finally {
    loading.value = false;
  }
}

async function setMastery(row: StudentWrongQuestion, level: number) {
  try {
    await eduaiApi.updateStudentWrongMastery(row.wrongQuestionId, level);
    row.masteryLevel = level;
    ElMessage.success(`已标记为「${masteryLabel(level)}」`);
  } catch (e) {
    ElMessage.error(`标记失败：${e instanceof Error ? e.message : String(e)}`);
  }
}

onMounted(() => {
  void load();
});
</script>

<style scoped>
.wb {
  padding: 18px 20px 28px;
}
.wb-title {
  margin: 0;
  font-size: 22px;
  font-weight: 900;
  color: var(--el-text-color-primary);
}
.wb-sub {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.wb-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin: 16px 0 14px;
}
.wb-space {
  flex: 1;
}
.wb-count {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.wb-list {
  min-height: 160px;
}
.wb-card {
  padding: 16px 18px;
  margin-bottom: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  background: var(--el-bg-color);
}
.wb-card__top {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.wb-card__meta {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.wb-card__stem {
  margin: 10px 0 0;
  font-size: 15px;
  line-height: 1.7;
  color: var(--el-text-color-primary);
  white-space: pre-wrap;
}
.wb-card__opts {
  margin: 8px 0 0;
  padding-left: 20px;
  font-size: 14px;
  color: var(--el-text-color-regular);
}
.wb-card__ans {
  margin: 10px 0 0;
  font-size: 14px;
  color: var(--el-color-success);
}
.wb-card__act {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 12px;
}
</style>

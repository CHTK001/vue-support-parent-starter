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

    <el-table v-loading="loading" :data="tasks" size="small" border>
      <el-table-column prop="markingTaskTaskId" label="任务号" min-width="220" />
      <el-table-column label="类型" width="90">
        <template #default="{ row }">{{ row.markingTaskMode === "ANY" ? "任意卷" : "自有卷" }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag size="small" :type="statusType(row.markingTaskStatus)">{{ statusLabel(row.markingTaskStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="markingTaskStage" label="阶段" width="120" />
      <el-table-column prop="markingTaskStartTime" label="时间" min-width="170" />
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button link type="primary" @click.stop="viewResult(row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" title="答题详情" width="720px">
      <div v-if="result" class="mr-result">
        <p class="mr-sum">
          得分 <b>{{ result.totalScore }}</b> · 共 {{ result.results.length }} 题 ·
          {{ result.finished ? "已批改" : "批改中" }}
        </p>
        <el-table :data="result.results" size="small" border>
          <el-table-column prop="questionId" label="题号" width="80" />
          <el-table-column prop="maxScore" label="满分" width="80" />
          <el-table-column label="得分" width="90">
            <template #default="{ row }">
              {{ row.teacherScore != null ? row.teacherScore : row.score }}
            </template>
          </el-table-column>
          <el-table-column label="评语" min-width="220">
            <template #default="{ row }">{{ row.teacherComment || row.comment || "—" }}</template>
          </el-table-column>
        </el-table>
      </div>
      <el-empty v-else description="加载中…" />
    </el-dialog>
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

const loading = ref(false);
const tasks = ref<TeacherMarkingTask[]>([]);
const dialogVisible = ref(false);
const result = ref<MarkingResultVO | null>(null);

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
</style>

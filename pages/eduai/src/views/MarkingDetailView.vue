<script setup lang="ts">
/**
 * MarkingDetailView —— 阅卷详情页（独立路由 /edu/marking/detail?taskId=...）
 *
 * <p>阅卷记录行「查看」的落点：在管理后台顶部标签栏新开一页，
 * 记录列表与检索状态都留在上一页，返回即回到列表。</p>
 *
 * <p>页面本体复用共享的 {@link MarkingResultPanel}（汇总 + 原始试卷 /
 * 版面解析一体），与 MarkingWorkbench 内嵌的详情是同一个组件，
 * 两端（管理端 / 老师端）看到的是同一套版式。</p>
 */
import { message } from '@repo/core';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ReDialog from '@repo/ui/re-dialog';
import ReSelect from '@repo/ui/re-select';
import { eduaiApi } from '../api/eduaiApi';
import { failToast } from '../api/errorText';
import type { MarkingResultVO } from '../api/types';
import MarkingResultPanel from '../components/marking/MarkingResultPanel.vue';

const route = useRoute();
const router = useRouter();

const taskId = computed(() => String(route.query.taskId ?? '').trim());
const loading = ref(false);
const result = ref<MarkingResultVO | null>(null);
/** 结构视图刷新令牌：改分后递增，强制重挂载拿最新结构与分数 */
const refreshKey = ref(0);
/** 结构里的任务元数据：mode 与卷面识别的学生（结果 VO 不带这两个字段） */
const structure = ref<Record<string, any> | null>(null);

const recognized = computed<{ name?: string; no?: string } | null>(() =>
  (structure.value?.recognizedStudent as { name?: string; no?: string } | undefined) ?? null,
);
const studentText = computed(() => {
  const name = recognized.value?.name?.trim();
  const no = recognized.value?.no?.trim();
  if (name && no) return `${name}（${no}）`;
  return name || no || '';
});

/** 顶部 AI 总体评语：优先取结构接口返回的总体评语，旧接口回落单题 AI 评语 */
const overallComment = computed(() => {
  const fromStructure = structure.value?.overallComment;
  if (typeof fromStructure === 'string' && fromStructure.trim()) {
    return fromStructure.trim();
  }
  return result.value?.results?.[0]?.comment?.trim() ?? '';
});

const studentDialogVisible = ref(false);
const studentSaving = ref(false);
const studentForm = reactive({ selection: '', name: '', no: '' });
const studentOptions = ref<Array<{ label: string; value: string; name: string; no: string }>>([]);

const loadStudentOptions = async (params: { keyword?: string } = {}) => {
  let students: any[] = [];
  try {
    students = await eduaiApi.listStudents();
  } catch {
    const classes = await eduaiApi.teacherClasses();
    // 单班学生接口失败不应该拖空整个下拉：一个班挂了，其他班照样可选
    const lists = await Promise.allSettled(
      classes
        .map((item: any) => Number(item?.classId))
        .filter((classId) => Number.isFinite(classId) && classId > 0)
        .map((classId) => eduaiApi.teacherClassStudents(classId)),
    );
    students = lists.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
  }
  const keyword = String(params?.keyword ?? '').trim().toLowerCase();
  const options = students
    .filter((s) => {
      const haystack = `${s.studentName ?? ''}${s.studentNo ?? ''}`.toLowerCase();
      return !keyword || haystack.includes(keyword);
    })
    .map((s) => ({
      label: [s.studentName, s.studentNo ? `（${s.studentNo}）` : ''].filter(Boolean).join(' '),
      value: String(s.studentNo || s.studentId || s.studentName || s.studentAccount || ''),
      name: String(s.studentName ?? ''),
      no: String(s.studentNo ?? ''),
    }));
  studentOptions.value = options;
  return options;
};

const onStudentChange = (value: unknown) => {
  const selected = studentOptions.value.find((o) => o.value === String(value ?? ''));
  studentForm.name = selected?.name ?? '';
  studentForm.no = selected?.no ?? '';
};

const openStudentEdit = () => {
  studentForm.selection = recognized.value?.no ?? '';
  studentForm.name = recognized.value?.name ?? '';
  studentForm.no = recognized.value?.no ?? '';
  studentDialogVisible.value = true;
};

/** 保存人工纠正的学生信息：管理员或任务归属老师都走同一写权限校验 */
const saveStudent = async () => {
  if (!taskId.value) return;
  studentSaving.value = true;
  try {
    await eduaiApi.confirmMarking({
      taskId: taskId.value,
      adjustments: [],
      studentName: studentForm.name.trim(),
      studentNo: studentForm.no.trim(),
    } as any);
    message.success('学生信息已修改');
    studentDialogVisible.value = false;
    await load();
  } catch (e) {
    failToast('保存学生信息失败', e);
  } finally {
    studentSaving.value = false;
  }
};

const load = async () => {
  if (!taskId.value) {
    failToast('缺少任务号', new Error('请从阅卷记录里选择一份试卷查看'));
    return;
  }
  loading.value = true;
  result.value = null;
  try {
    result.value = await eduaiApi.getMarkingResult(taskId.value);
    // 结构与结果分开取：结构带 mode / 卷面识别学生，供头部展示；
    // 失败不影响主流程（MarkingResultPanel 自己会再拉一次结构）
    structure.value = await eduaiApi.getMarkingStructure(taskId.value).catch(() => null);
  } catch (e) {
    failToast('获取阅卷结果失败', e);
  } finally {
    loading.value = false;
  }
};

/** 老师分保存成功：刷新汇总与结构视图 */
const onSaved = () => {
  refreshKey.value += 1;
  void load();
};

const back = () => {
  // 独立标签页打开时（有 opener）直接关掉自己，回到原来的阅卷记录页；
  // 站内兜底打开时才需要路由跳回去。
  if (window.opener) {
    window.close();
    return;
  }
  router.push({ path: '/edu/marking' });
};

onMounted(() => {
  void load();
});
</script>

<template>
  <div class="marking-detail" v-loading="loading">
    <div class="md-bar">
      <el-button icon="Back" @click="back">返回记录</el-button>
      <span class="md-title">阅卷详情</span>
      <span class="md-id" :title="taskId">{{ taskId }}</span>
      <el-tag v-if="structure?.mode" size="small" type="info">
        {{ structure.mode === 'ANY' ? '任意卷' : '自有卷' }}
      </el-tag>
    </div>

    <!-- AI 总体评语只做悬浮 tip：正文可能很长，常驻会把版面视图往下挤，
         而且它只是参考信息，不该占掉一整行。这里不设任何权限判断，拿到就显示。 -->
    <el-tooltip v-if="overallComment" placement="top" :show-after="120">
      <template #content>
        <div class="md-comment-tip">{{ overallComment }}</div>
      </template>
      <span class="md-comment-label">
        <el-icon class="md-comment-icon"><InfoFilled /></el-icon>
        AI 总体评语
      </span>
    </el-tooltip>

    <div class="md-student">
      <span class="md-student-label">学生</span>
      <span class="md-student-text">{{ studentText || '未识别' }}</span>
      <el-button size="small" link type="primary" :disabled="loading" @click="openStudentEdit">
        修改学生
      </el-button>
    </div>

    <MarkingResultPanel :result="result" :refresh-key="refreshKey" @saved="onSaved" @finished="onSaved" />

    <ReDialog v-model="studentDialogVisible" title="修改学生信息" width="420px">
      <div class="md-student-form">
        <ReSelect
          v-model="studentForm.selection"
          :loader="loadStudentOptions"
          filterable
          clearable
          placeholder="从学生档案下拉选择"
          style="width: 100%"
          @change="onStudentChange"
        />
      </div>
      <template #footer>
        <el-button @click="studentDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="studentSaving" @click="saveStudent">保存</el-button>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped>
.marking-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 16px;
  gap: 12px;
  box-sizing: border-box;
  overflow: hidden;
}
.md-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  flex: none;
}
.md-title {
  font-weight: 600;
}
.md-id {
  font-family: monospace;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* 触发区：只有标签 + 提示图标，正文在 tip 里 */
.md-comment-label {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 1px;
  padding: 2px 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 4px;
  cursor: help;
}
.md-comment-icon {
  font-size: 13px;
}
/* tip 内容：默认 tooltip 宽度有限，评语要能整段读完 */
.md-comment-tip {
  max-width: 480px;
  max-height: 320px;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}
.md-student {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
  padding: 0 2px;
}
.md-student-label {
  font-size: 13px;
  font-weight: 600;
}
.md-student-text {
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.md-student-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
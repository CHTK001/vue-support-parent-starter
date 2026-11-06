<script setup lang="ts">
/**
 * MarkingDetailView —— 阅卷详情页（独立路由 /edu/marking/detail?taskId=...）
 *
 * <p>阅卷记录行「查看」的落点：由 MarkingWorkbench 通过 window.open 开新
 * 浏览器标签页。详情页与工作台的状态完全隔离，关详情时只关自己
 * （back() 有 window.opener 分支），不回到工作台；开在其他标签页时
 * 也不会洗掉工作台列表的检索/筛选状态。返回即回到列表。</p>
 *
 * <p>页面本体复用共享的 {@link MarkingResultPanel}（汇总 + 原始试卷 /
 * 版面解析一体），与 MarkingWorkbench 内嵌的详情是同一个组件，
 * 两端（管理端 / 老师端）看到的是同一套版式。</p>
 */
import { message } from '@repo/core';
import { Loading } from '@element-plus/icons-vue';
import { useTabsStore } from '@repo/pinia';
import { computed, onUnmounted, reactive, ref, watch } from 'vue';
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
/**
 * 结构请求本身（不是结果）。
 *
 * <p>结果只决定「整页什么时候能看」，结构只决定「下方表格什么时候有数」，
 * 两者不该互相等。这里把 Promise 直接交给面板：面板挂载后自己 await，
 * 谁先到谁先渲染，首屏不再被 2~3s 的结构数据压着转圈。</p>
 */
const structurePromise = ref<Promise<Record<string, any>> | null>(null);

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
/** 总体评语是否展开（默认收成一行摘要，避免把版面视图挤下去） */
const commentOpen = ref(false);
/** 短评语一行放得下，不给「展开」按钮 */
const commentLong = computed(() => overallComment.value.length > 80);

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

/**
 * 判分进度轮询。
 *
 * <p>扫描任务提交后详情页会立刻被打开，此时后台还在「识别 → 判分」。
 * 页面此前只在挂载时拉一次结果，老师看到的状态会一直停在「判分中」，
 * 必须手动刷新才能看到分数——这正是「无人参与」链路上的一处人为断点。
 * 这里在未判完时每 3 秒刷一次汇总，判完自动重拉结构（逐题分只在判完后才有）。</p>
 */
let pollTimer: ReturnType<typeof setInterval> | null = null;

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
};

const startPolling = () => {
  stopPolling();
  const currentId = taskId.value;
  if (!currentId) return;
  pollTimer = setInterval(async () => {
    // 期间换了任务：本轮的请求已经过期，直接停
    if (taskId.value !== currentId) {
      stopPolling();
      return;
    }
    try {
      const data = await eduaiApi.getMarkingResult(currentId);
      if (taskId.value !== currentId) return;
      result.value = data;
      if (data?.finished || Number(data?.taskStatus) === 3) {
        stopPolling();
        // 判分结束：结构视图里才带逐题分，重拉一次（会短暂显示「正在读取…」）
        void load();
      }
    } catch {
      // 单轮失败不打断页面，下一轮继续
    }
  }, 3000);
};

const load = async (silent = false) => {
  if (!taskId.value) {
    failToast('缺少任务号', new Error('请从阅卷记录里选择一份试卷查看'));
    return;
  }
  // 换任务/重拉前先停掉上一轮轮询，避免两个任务的结果互相覆盖
  stopPolling();
  // 换任务时先清空：否则新数据回来前会短暂显示上一份卷子的分数
  if (!silent) {
    loading.value = true;
    result.value = null;
    structure.value = null;
    structurePromise.value = null;
  }
  const currentId = taskId.value;
  try {
    if (silent) {
      // 只刷汇总：结构视图保存后自己已重载，这里再拉一次会让刚改的行回滚
      result.value = await eduaiApi.getMarkingResult(currentId);
      return;
    }
    // 结构与结果同时发出，但只有结果拦首屏：结果一到就放行整页，
    // 结构（~34KB）和卷面图各自到货各自渲染，总耗时从三者之和降到最慢的那个。
    const sp = eduaiApi.getMarkingStructure(currentId);
    structurePromise.value = sp;
    void sp
      .then((data) => {
        // 期间又换了任务：这份结构已经过期，直接丢掉（避免把上一份卷子贴到新任务上）
        if (taskId.value === currentId) structure.value = data;
      })
      .catch(() => {
        // 结构失败不影响主流程：面板会退回自己拉取并在表格区提示
      });
    result.value = await eduaiApi.getMarkingResult(currentId);
    // 还在判分：交给轮询自动刷新，判完会自己重拉结构
    if (!result.value?.finished && Number(result.value?.taskStatus) !== 3) {
      startPolling();
    }
  } catch (e) {
    failToast('获取阅卷结果失败', e);
  } finally {
    loading.value = false;
  }
};

/**
 * 老师分保存 / 阅卷完成：只刷新汇总，不动结构视图。
 *
 * <p>结构视图自己保存后会重新加载；这里若再递增 refreshKey，
 * 组件会按 key 重挂载、再拉一次结构 —— 网关单次往返 1.4s，等于白等。</p>
 */
const onSaved = () => {
  void load(true);
};

const back = () => {
  // 独立标签页入口（window.open 打开的详情窗口里有 opener）：关掉自己，回到
  // 打开这个窗口前的那个窗口。
  if (window.opener) {
    window.close();
    return;
  }
  // 站内 SPA 入口（从「AI 阅卷」列表 / 标签页打开的详情）：
  // 不关窗、不加锁、也不把标签关到只剩一个时触发「到我的底线了」——
  // 把详情页的标签摘掉（已存在的标签里才摘，避免关闭列表页这个不可关的页面），
  // 退回「AI 阅卷」记录页。
  const tabs = useTabsStore();
  const list = (tabs.tabList || []).filter((item) => typeof item === 'object');
  if (list.length > 1) {
    const detail = list.find((item) => item.path === route.path);
    if (detail) {
      void tabs.removeTab(route.path, true, '/edu/marking');
    }
  }
  // 明确回到阅卷记录页，而不是 tab 列表的下一个标签（可能是菜单里的其他页，
  // 极端时落到 HOME_URL / 登录页）。
  router.push({ path: '/edu/marking' });
};

// 同一路由只改 query.taskId 时组件会被复用（Vue Router 默认行为），
// 只在 onMounted 里加载会让页面一直显示上一份卷子 —— 必须 watch 任务号。
watch(
  taskId,
  () => {
    // 换卷子时评语要收回一行，否则上一份的展开状态会带过来
    commentOpen.value = false;
    void load();
  },
  { immediate: true },
);

// 离开详情页必须停轮询，否则定时器会跟着组件对象一直打接口
onUnmounted(stopPolling);
</script>

<template>
  <!-- 不挂整页 v-loading：详情页的骨架（标题栏/学生行/结构视图）先出来，
       结果、结构、卷面图各自异步填充。整页转圈等于把已经能看的界面挡住。 -->
  <div class="marking-detail">
    <div class="md-bar">
      <el-button icon="Back" @click="back">返回记录</el-button>
      <span class="md-title">阅卷详情</span>
      <span class="md-id" :title="taskId">{{ taskId }}</span>
      <el-tag v-if="structure?.mode" size="small" type="info">
        {{ structure.mode === 'ANY' ? '任意卷' : '自有卷' }}
      </el-tag>
      <span v-if="loading" class="md-loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        正在读取…
      </span>
    </div>

    <!-- AI 总体评语：正文可能很长，默认收成一行摘要（悬浮可看全），
         需要逐句读时点「展开」。这里不设任何权限判断，拿到就显示。 -->
    <div v-if="overallComment" class="md-comment">
      <span class="md-comment-label">
        <el-icon class="md-comment-icon"><InfoFilled /></el-icon>
        AI 总体评语
      </span>
      <el-tooltip placement="top" :show-after="120" :disabled="commentOpen">
        <template #content>
          <div class="md-comment-tip">{{ overallComment }}</div>
        </template>
        <span class="md-comment-text" :class="{ 'is-open': commentOpen }">{{ overallComment }}</span>
      </el-tooltip>
      <el-button
        v-if="commentLong"
        class="md-comment-toggle"
        size="small"
        link
        type="primary"
        @click="commentOpen = !commentOpen"
      >
        {{ commentOpen ? '收起' : '展开' }}
      </el-button>
    </div>

    <div class="md-student">
      <span class="md-student-label">学生</span>
      <span class="md-student-text">{{ structure ? studentText || '未识别' : '读取中…' }}</span>
      <el-button size="small" link type="primary" :disabled="loading" @click="openStudentEdit">
        修改学生
      </el-button>
    </div>

    <MarkingResultPanel
      :task-id="taskId"
      :result="result"
      :structure-promise="structurePromise"
      :refresh-key="refreshKey"
      @saved="onSaved"
      @finished="onSaved"
    />

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
/* 内联加载提示：只占标题栏一行，不遮页面 */
.md-loading {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
/* 评语行：标签 + 一行摘要（可展开），高度只占一行 */
.md-comment {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex: none;
  min-width: 0;
}
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
}
.md-comment-icon {
  font-size: 13px;
}
/* 收起时单行省略，展开时整段可滚：始终可读，不靠悬浮才看得到 */
.md-comment-text {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
  word-break: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
}
.md-comment-text.is-open {
  max-height: 160px;
  overflow-y: auto;
  display: block;
}
.md-comment-toggle {
  flex: none;
  height: 20px;
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
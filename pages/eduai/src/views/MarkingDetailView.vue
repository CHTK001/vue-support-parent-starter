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
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
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
      <span v-if="studentText" class="md-meta">卷面识别：{{ studentText }}</span>
    </div>
    <MarkingResultPanel :result="result" :refresh-key="refreshKey" @saved="onSaved" />
  </div>
</template>

<style scoped>
.marking-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.md-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding-bottom: 10px;
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
.md-meta {
  font-size: 13px;
  color: var(--el-text-color-regular);
}
</style>

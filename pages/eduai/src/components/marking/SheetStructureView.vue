<template>
  <div class="sheet-structure">
    <div class="ss-toolbar">
      <el-radio-group v-if="pageCount > 1" v-model="page" size="small">
        <el-radio-button v-for="p in pageCount" :key="p" :value="p">第 {{ p }} 页</el-radio-button>
      </el-radio-group>
      <!-- 原始试卷 / 版面解析：原卷纯看，版面解析做分数复核（老师分为最终成绩） -->
      <el-radio-group v-model="mode" size="small">
        <el-radio-button value="layout">版面解析</el-radio-button>
        <el-radio-button value="original">原始试卷</el-radio-button>
      </el-radio-group>
      <div v-if="mode === 'layout'" class="ss-legend">
        <span class="ss-dot ss-correct"></span>正确
        <span class="ss-dot ss-partial"></span>部分分
        <span class="ss-dot ss-wrong"></span>错误
        <span class="ss-tip">点击题号标记可定位到右侧题目</span>
      </div>
    </div>

    <div class="ss-body" :class="{ 'ss-body--original': mode === 'original' }">
      <div class="ss-stage-wrap">
        <div class="ss-stage">
          <img v-if="imageUrl" :src="imageUrl" class="ss-image" alt="答卷" />
          <div v-if="imageUrl && mode === 'layout'" class="ss-overlay">
            <div
              v-for="(b, i) in currentLayout"
              :key="'layout-' + i"
              class="ss-layout"
              :class="{ 'ss-layout-active': activeLayout === i }"
              :style="boxStyle(b)"
              @click="activeLayout = activeLayout === i ? -1 : i"
            >
              <span class="ss-layout-label">{{ b.label }}</span>
            </div>
            <div
              v-for="a in currentAnchors"
              :key="'anchor-' + a.no"
              class="ss-anchor"
              :class="anchorClass(a.no)"
              :style="boxStyle(a)"
              @click="selectQuestion(String(a.no))"
            >
              <span class="ss-badge">{{ anchorText(String(a.no)) }}</span>
            </div>
          </div>
          <el-empty v-else-if="!imageUrl" description="未取到答卷图片" :image-size="80" />
        </div>
      </div>

      <div v-if="mode === 'layout'" class="ss-panel">
        <el-table :data="questions" height="100%" @row-click="(row: any) => selectQuestion(String(row.no))">
          <el-table-column label="题号" width="64">
            <template #default="{ row }">
              <span :class="{ 'ss-row-active': String(row.no) === selectedNo }">{{ row.no || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="AI 分" width="76">
            <template #default="{ row }">
              <span class="ss-ai-score">{{ row.score ?? '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="老师分" width="136">
            <template #default="{ row }">
              <el-input-number
                v-model="row.editScore"
                :min="0"
                :max="row.maxScore ?? 100"
                controls-position="right"
                size="small"
                @change="onScoreChange(row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="作答" min-width="110" show-overflow-tooltip>
            <template #default="{ row }">{{ row.studentAnswer || '—' }}</template>
          </el-table-column>
          <el-table-column label="AI 评语" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">{{ row.comment || '—' }}</template>
          </el-table-column>
          <el-table-column label="知识点" min-width="170">
            <template #default="{ row }">
              <template v-if="kpList(row).length">
                <el-tag
                  v-for="kp in kpList(row)"
                  :key="kp.id"
                  size="small"
                  class="ss-kp"
                  @click.stop="openKp(kp)"
                >{{ kp.name }}</el-tag>
              </template>
              <span v-else class="ss-muted">无</span>
            </template>
          </el-table-column>
        </el-table>
        <div class="ss-actions">
          <el-button type="primary" :disabled="!dirty" :loading="saving" @click="save">保存老师分</el-button>
          <span class="ss-hint">AI 分保留不动，老师分为最终成绩</span>
          <span v-if="selectedNo" class="ss-sel">已选中第 {{ selectedNo }} 题</span>
        </div>
      </div>
    </div>

    <el-drawer v-model="kpDrawer" title="知识点详情" size="360px">
      <div v-if="kpLoading" class="ss-muted">加载中…</div>
      <template v-else>
        <div class="ss-kp-key">查询：{{ kpKeyword }}</div>
        <div v-if="kpDetail.length === 0" class="ss-muted">未找到该知识点的详情（知识点库为空或未建立关联）</div>
        <ul v-else class="ss-kp-list">
          <li v-for="k in kpDetail" :key="k.id ?? k.name">
            <div class="ss-kp-name">{{ k.name }}</div>
            <div class="ss-kp-desc">{{ k.description || k.subject || '' }}</div>
          </li>
        </ul>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { computed, onUnmounted, ref, watch } from 'vue';

import { eduaiApi } from '../../api/eduaiApi';
import { failToast } from '../../api/errorText';

const props = defineProps<{ taskId: string }>();
/** 老师分保存成功后广播：父级（阅卷记录详情 / 教师端）据此刷新总分 */
const emit = defineEmits<{ (e: 'saved'): void }>();

const structure = ref<Record<string, any> | null>(null);
const page = ref(1);
/** layout=版面解析（图 + 版面框 + 题目面板），original=原始试卷（纯原图全宽） */
const mode = ref<'layout' | 'original'>('layout');
const imageUrl = ref('');
const activeLayout = ref(-1);
const selectedNo = ref('');
const dirty = ref(false);
const saving = ref(false);
const questions = ref<any[]>([]);

const kpDrawer = ref(false);
const kpKeyword = ref('');
const kpLoading = ref(false);
const kpDetail = ref<any[]>([]);

let objectUrl = '';

/** 逐页结构（pages 下标从 0 开始，页码从 1 开始） */
const pageCount = computed(() => Number(structure.value?.pageCount || 0));
const currentPage = computed(() => (structure.value?.pages || [])[page.value - 1] || { layout: [], blocks: [] });
const currentLayout = computed(() => currentPage.value.layout || []);
const currentAnchors = computed(() =>
  (structure.value?.questionAnchors || []).filter((a: any) => Number(a.page) === page.value),
);

/** 归一化坐标 → 百分比定位；版面区域与题号锚点共用 */
const boxStyle = (b: any) => ({
  left: `${(Number(b.x) || 0) * 100}%`,
  top: `${(Number(b.y) || 0) * 100}%`,
  width: `${(Number(b.width) || 0) * 100}%`,
  height: `${(Number(b.height) || 0) * 100}%`,
});

const questionOf = (no: string) => questions.value.find((q) => String(q.no) === no);
const scoreClass = (row: any) => {
  const s = Number(row.editScore ?? 0);
  const m = Number(row.maxScore ?? 0);
  if (m > 0 && s >= m) return 'ss-score-correct';
  if (s <= 0) return 'ss-score-wrong';
  return 'ss-score-partial';
};
const anchorClass = (no: string) => {
  const q = questionOf(no);
  if (!q) return 'ss-anchor-unknown';
  return scoreClass(q).replace('ss-score-', 'ss-anchor-');
};
const anchorText = (no: string) => {
  const q = questionOf(no);
  return q ? `${q.editScore}` : '?';
};

const kpList = (row: any): Array<{ id: any; name: string; description?: string }> => {
  // 后端已把知识点 id 解析成 {id,name,description}，直接渲染名称、点开即出描述。
  const list = row?.knowledgePoints;
  if (Array.isArray(list) && list.length) return list;
  // 兼容仅返回 id 串的旧结构：退化成显示 id，仍可点击
  const raw = row?.knowledgePointIds;
  if (raw === null || raw === undefined || raw === '') return [];
  const arr = Array.isArray(raw) ? raw : String(raw).split(/[,，\s]+/);
  return arr.filter(Boolean).map((x) => ({ id: x, name: String(x) }));
};

const selectQuestion = (no: string) => {
  selectedNo.value = no;
};

/** 老师分改动即标脏：只有动过的行才进保存载荷（AI 分永远不被覆盖） */
const onScoreChange = (row: any) => {
  row.dirty = Number(row.editScore ?? 0) !== Number(row.origScore ?? 0);
  dirty.value = questions.value.some((q) => q.dirty);
};

const openKp = (kp: any) => {
  // 名称与描述已随结构返回，无需再按 id 反查（按 id 搜关键字搜不到，点开会是空的）
  kpKeyword.value = kp?.name || '';
  kpDetail.value = kp ? [kp] : [];
  kpDrawer.value = true;
  kpLoading.value = false;
};

const loadImage = async (taskId: string, p: number) => {
  try {
    const blob = await eduaiApi.getSheetImageBlob(taskId, p);
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(blob);
    imageUrl.value = objectUrl;
  } catch {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = '';
    }
    imageUrl.value = '';
  }
};

const load = async (taskId: string) => {
  structure.value = null;
  questions.value = [];
  selectedNo.value = '';
  dirty.value = false;
  activeLayout.value = -1;
  page.value = 1;
  if (!taskId) return;
  try {
    const data = await eduaiApi.getMarkingStructure(taskId);
    structure.value = data || null;
    // 老师分初值 = 已有老师分，否则回落 AI 分；origScore 记初值做脏判断
    questions.value = (data?.questions || []).map((q: any) => {
      const initial = Number(q.teacherScore ?? q.score ?? 0);
      return {
        ...q,
        editScore: initial,
        origScore: initial,
        dirty: false,
      };
    });
    await loadImage(taskId, 1);
  } catch (e) {
    failToast('获取结构化解析失败', e);
  }
};

watch(
  () => props.taskId,
  (v) => {
    void load(String(v || ''));
  },
  { immediate: true },
);

watch(page, async (p) => {
  activeLayout.value = -1;
  if (props.taskId) await loadImage(props.taskId, p);
});

const save = async () => {
  if (!props.taskId) return;
  const adjustments = questions.value
    .filter((q) => q.dirty && Number(q.resultId) > 0)
    // 只回传分数、不传 comment：后端「不传评语 = 不改评语」，
    // 避免把 AI 评语或教师已写评语覆盖掉
    .map((q) => ({
      resultId: Number(q.resultId),
      score: Number(q.editScore ?? 0),
    }));
  if (!adjustments.length) {
    message.warning('没有需要保存的老师分改动');
    return;
  }
  saving.value = true;
  try {
    await eduaiApi.confirmMarking({ taskId: props.taskId, adjustments });
    message.success('老师分已保存（AI 分保留）');
    dirty.value = false;
    await load(props.taskId);
    emit('saved');
  } catch (e) {
    failToast('保存失败', e);
  } finally {
    saving.value = false;
  }
};

onUnmounted(() => {
  if (objectUrl) URL.revokeObjectURL(objectUrl);
});
</script>

<style scoped>
.sheet-structure {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 420px;
}
.ss-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 4px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.ss-legend {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.ss-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
.ss-correct { background: var(--el-color-success); }
.ss-partial { background: var(--el-color-warning); }
.ss-wrong { background: var(--el-color-danger); }
.ss-tip { margin-left: 8px; }

.ss-body {
  flex: 1;
  display: flex;
  gap: 12px;
  min-height: 0;
  padding-top: 12px;
}
/* 原始试卷模式：没有右侧题目面板，原图占满整行 */
.ss-body--original .ss-stage-wrap { flex: 1 1 auto; }
.ss-stage-wrap {
  flex: 0 0 46%;
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-base);
  background: var(--el-fill-color-blank);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 8px;
}
.ss-stage {
  position: relative;
  display: inline-block;
  max-width: 100%;
}
.ss-image {
  display: block;
  width: 100%;
  height: auto;
  user-select: none;
}
.ss-overlay {
  position: absolute;
  inset: 0;
}
.ss-layout {
  position: absolute;
  border: 1px solid var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
  opacity: 0.35;
  cursor: pointer;
  transition: opacity 0.15s;
}
.ss-layout-active {
  opacity: 0.75;
  border-color: var(--el-color-primary);
}
.ss-layout-label {
  position: absolute;
  top: -2px;
  left: 0;
  font-size: 10px;
  color: var(--el-color-primary);
  background: var(--el-bg-color);
  padding: 0 2px;
}
.ss-anchor {
  position: absolute;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  min-height: 14px;
}
.ss-anchor .ss-badge {
  font-size: 11px;
  line-height: 1;
  color: #fff;
  border-radius: 3px;
  padding: 1px 4px;
  white-space: nowrap;
}
.ss-anchor-correct { background: color-mix(in srgb, var(--el-color-success) 22%, transparent); border: 1px solid var(--el-color-success); }
.ss-anchor-partial { background: color-mix(in srgb, var(--el-color-warning) 22%, transparent); border: 1px solid var(--el-color-warning); }
.ss-anchor-wrong { background: color-mix(in srgb, var(--el-color-danger) 22%, transparent); border: 1px solid var(--el-color-danger); }
.ss-anchor-unknown { background: color-mix(in srgb, var(--el-text-color-secondary) 18%, transparent); border: 1px dashed var(--el-text-color-secondary); }
.ss-anchor-correct .ss-badge { background: var(--el-color-success); }
.ss-anchor-partial .ss-badge { background: var(--el-color-warning); }
.ss-anchor-wrong .ss-badge { background: var(--el-color-danger); }
.ss-anchor-unknown .ss-badge { background: var(--el-text-color-secondary); }

.ss-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.ss-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 8px;
}
.ss-hint { font-size: 12px; color: var(--el-text-color-secondary); }
.ss-sel { font-size: 12px; color: var(--el-text-color-secondary); }
.ss-ai-score { color: var(--el-text-color-secondary); font-weight: 600; }
.ss-score-correct { color: var(--el-color-success); font-weight: 600; }
.ss-score-partial { color: var(--el-color-warning); font-weight: 600; }
.ss-score-wrong { color: var(--el-color-danger); font-weight: 600; }
.ss-row-active { color: var(--el-color-primary); font-weight: 600; }
.ss-kp { margin-right: 4px; cursor: pointer; }
.ss-muted { color: var(--el-text-color-placeholder); font-size: 12px; }
.ss-kp-key { font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 8px; }
.ss-kp-list { list-style: none; padding: 0; margin: 0; }
.ss-kp-list li { padding: 8px 0; border-bottom: 1px solid var(--el-border-color-lighter); }
.ss-kp-name { font-weight: 600; }
.ss-kp-desc { font-size: 12px; color: var(--el-text-color-secondary); }
</style>

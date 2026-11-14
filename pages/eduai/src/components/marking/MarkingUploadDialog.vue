<script setup lang="ts">
/**
 * MarkingUploadDialog —— 阅卷上传弹窗（拖拽 + 点击）
 *
 * 阅卷系统的共享上传入口（老师端「阅卷」页与管理端阅卷页共用）：
 * - 独立弹窗（此前老师端是行内裸 <input type="file">，不能拖拽、样式破坏布局）；
 * - 支持拖拽图片入弹窗与点击选择两种方式；
 * - 自有卷（按题号取准确分值）/ 任意卷（手动给总分）两种模式。
 *
 * 事件：
 *   start  { mode, paperId, studentId, maxScore, files }
 *          由父组件组装 FormData 调 /v2/edu/marking/scan（两端调用口径一致）。
 */
import { computed, ref, watch } from 'vue';
import { Picture, UploadFilled } from '@element-plus/icons-vue';
import ReDialog from '@repo/ui/re-dialog';
import type { EduStudent, Paper } from '../../api/types';
import { ReRadioGroup, ReRadioButton } from "@repo/ui/re-kit";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    /** 自有卷候选（mode=SELF 时选择） */
    papers: Paper[];
    /** 学生候选（可留空匿名阅卷） */
    students?: EduStudent[];
    /** 提交中（父组件控制按钮 loading） */
    submitting?: boolean;
  }>(),
  { students: () => [], submitting: false },
);

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
  (e: 'start', payload: {
    mode: 'SELF' | 'ANY';
    paperId: number | null;
    studentId: string;
    maxScore: number;
    files: File[];
  }): void;
}>();

const form = ref({
  mode: 'SELF' as 'SELF' | 'ANY',
  paperId: null as number | null,
  studentId: '',
  maxScore: 100,
});
const files = ref<File[]>([]);
const dragging = ref(false);
const hiddenInput = ref<HTMLInputElement | null>(null);

const paperOptions = computed(() =>
  props.papers.map((p) => ({ label: p.paperName, value: p.paperId })),
);
const studentOptions = computed(() =>
  (props.students || []).map((s) => ({
    label: `${s.studentName || ''} ${s.studentNo}`.trim(),
    value: s.studentNo || '',
  })),
);

/** 可提交：至少一张图片；自有卷必须选卷 */
const canStart = computed(
  () => files.value.length > 0 && (form.value.mode === 'ANY' || form.value.paperId != null),
);

function reset(): void {
  form.value = { mode: 'SELF', paperId: null, studentId: '', maxScore: 100 };
  files.value = [];
  dragging.value = false;
}

/** 每次打开都重置表单，避免残留上次选择的卷/学生 */
watch(
  () => props.modelValue,
  (v) => {
    if (v) reset();
  },
);

function close(): void {
  emit('update:modelValue', false);
}

/** 点击投放区 → 唤起系统文件选择 */
function pick(): void {
  hiddenInput.value?.click();
}

function onInputChange(e: Event): void {
  const input = e.target as HTMLInputElement;
  const picked = input.files ? Array.from(input.files) : [];
  if (picked.length) files.value = [...files.value, ...picked];
  input.value = '';
}

/** 拖拽进入/悬停：仅当携带文件时高亮 */
function onDragOver(e: DragEvent): void {
  if (!e.dataTransfer?.types.includes('Files')) return;
  e.preventDefault();
  dragging.value = true;
}

function onDragLeave(): void {
  dragging.value = false;
}

/** 拖拽放下：收文件进列表（多页图片按拖入顺序排列） */
function onDrop(e: DragEvent): void {
  e.preventDefault();
  dragging.value = false;
  const dropped = e.dataTransfer?.files ? Array.from(e.dataTransfer.files) : [];
  if (dropped.length) files.value = [...files.value, ...dropped];
}

function removeAt(i: number): void {
  files.value.splice(i, 1);
}

function start(): void {
  if (!canStart.value) return;
  emit('start', {
    mode: form.value.mode,
    paperId: form.value.paperId,
    studentId: form.value.studentId.trim(),
    maxScore: form.value.maxScore,
    files: [...files.value],
  });
}
</script>

<template>
  <ReDialog
    :model-value="modelValue"
    title="上传答卷阅卷"
    width="640px"
    destroy-on-close
    @update:model-value="(v: boolean) => !v && close()"
  >
    <el-form label-width="88px">
      <el-form-item label="试卷类型">
        <ReRadioGroup v-model="form.mode">
          <ReRadioButton value="SELF">自有卷（题库有记录）</ReRadioButton>
          <ReRadioButton value="ANY">任意卷（外来试卷）</ReRadioButton>
        </ReRadioGroup>
      </el-form-item>
      <el-form-item v-if="form.mode === 'SELF'" label="试卷" required>
        <el-select
          v-model="form.paperId"
          placeholder="选择试卷（按题号取准确分值）"
          filterable
          style="width: 100%"
        >
          <el-option
            v-for="p in paperOptions"
            :key="p.value"
            :label="p.label"
            :value="p.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item v-else label="试卷总分" required>
        <el-input-number
          v-model="form.maxScore"
          :min="1"
          :max="1000"
          controls-position="right"
        />
        <span class="mu-hint">任意卷无题号记录，手动给整卷总分</span>
      </el-form-item>
      <el-form-item label="学生">
        <el-select
          v-model="form.studentId"
          placeholder="可留空，匿名阅卷；也可直接输入学生 ID"
          clearable
          filterable
          allow-create
          default-first-option
          style="width: 100%"
        >
          <el-option
            v-for="s in studentOptions"
            :key="s.value"
            :label="s.label"
            :value="s.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="答卷图片" required>
        <!-- 投放区：拖拽或点击 -->
        <div
          class="mu-drop"
          :class="{ 'mu-drop--active': dragging }"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
          @drop="onDrop"
          @click="pick"
        >
          <el-icon :size="30" class="mu-drop__icon"><UploadFilled /></el-icon>
          <p class="mu-drop__title">拖拽图片到此处，或点击选择</p>
          <p class="mu-drop__sub">支持多页图片，按页序排列</p>
          <input
            ref="hiddenInput"
            type="file"
            accept="image/*"
            multiple
            hidden
            @change="onInputChange"
          />
        </div>
        <!-- 已选列表 -->
        <ul v-if="files.length" class="mu-list">
          <li
            v-for="(f, i) in files"
            :key="`${f.name}-${f.size}-${i}`"
            class="mu-list__item"
          >
            <el-icon><Picture /></el-icon>
            <span class="mu-list__name" :title="f.name">{{ f.name }}</span>
            <span class="mu-list__size">{{ (f.size / 1024).toFixed(0) }}KB</span>
            <el-button link type="danger" @click.stop="removeAt(i)">移除</el-button>
          </li>
        </ul>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button
        type="primary"
        :loading="submitting"
        :disabled="!canStart"
        @click="start"
      >
        开始阅卷
      </el-button>
    </template>
  </ReDialog>
</template>

<style scoped>
.mu-hint {
  margin-left: 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.mu-drop {
  border: 1.5px dashed var(--el-border-color);
  border-radius: 8px;
  padding: 22px 12px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.mu-drop:hover {
  border-color: var(--el-color-primary);
}
.mu-drop--active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.mu-drop__icon {
  color: var(--el-color-primary);
}
.mu-drop__title {
  margin: 6px 0 2px;
  font-size: 14px;
}
.mu-drop__sub {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.mu-list {
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
  max-height: 160px;
  overflow-y: auto;
}
.mu-list__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 2px;
  font-size: 13px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.mu-list__name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mu-list__size {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.mu-empty {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>

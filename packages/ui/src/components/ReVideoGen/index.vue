<template>
  <div class="wan-video-gen">
    <!-- 左侧：历史记录 -->
    <aside class="wan-video-gen__history">
      <div class="wan-video-gen__history-head">
        <span class="wan-video-gen__history-title">创作历史</span>
        <el-button text :loading="historyLoading" @click="loadHistory">
          刷新
        </el-button>
      </div>
      <div class="wan-video-gen__history-body">
        <div v-if="history.length === 0" class="wan-video-gen__history-empty">
          暂无创作记录
        </div>
        <div
          v-for="item in history"
          :key="item.taskId"
          class="wan-video-gen__history-item"
          :class="{ 'is-active': activeTask?.taskId === item.taskId }"
          @click="selectTask(item)"
        >
          <div class="wan-video-gen__history-thumb">
            <video
              v-if="item.status === 'SUCCESS' && item.resultUrl"
              :src="item.resultUrl"
              muted
              preload="metadata"
              class="wan-video-gen__history-video"
            />
            <div v-else-if="item.status === 'PROCESSING'" class="wan-video-gen__thumb-loading">
              <el-icon class="is-loading"><Loading /></el-icon>
            </div>
            <div v-else class="wan-video-gen__thumb-failed">
              <el-icon><VideoCameraFilled /></el-icon>
            </div>
            <el-tag
              :type="statusTagType(item.status)"

              class="wan-video-gen__history-status"
            >
              {{ statusLabel(item.status) }}
            </el-tag>
          </div>
          <div class="wan-video-gen__history-info">
            <div class="wan-video-gen__history-prompt">{{ item.prompt }}</div>
            <div class="wan-video-gen__history-time">{{ formatTime(item.completeTime || item.createTime) }}</div>
          </div>
        </div>
      </div>
    </aside>

    <!-- 中部：画布展示区 -->
    <main class="wan-video-gen__canvas">
      <div v-if="!activeTask" class="wan-video-gen__canvas-empty">
        <el-icon class="wan-video-gen__empty-icon"><VideoCameraFilled /></el-icon>
        <p class="wan-video-gen__empty-title">用一句话描述你想要的视频</p>
        <p class="wan-video-gen__empty-sub">输入提示词并点击生成，AI 将为你创作视频</p>
      </div>

      <div v-else-if="activeTask.status === 'PROCESSING'" class="wan-video-gen__canvas-processing">
        <div class="wan-video-gen__processing-art">
          <div class="wan-video-gen__processing-pulse"></div>
          <el-icon class="is-loading wan-video-gen__processing-icon"><VideoCamera /></el-icon>
        </div>
        <p class="wan-video-gen__processing-title">正在生成视频…</p>
        <p class="wan-video-gen__processing-sub">{{ activeTask.prompt }}</p>
      </div>

      <div v-else-if="activeTask.status === 'FAILED'" class="wan-video-gen__canvas-failed">
        <el-icon class="wan-video-gen__failed-icon"><WarningFilled /></el-icon>
        <p class="wan-video-gen__failed-title">生成失败</p>
        <p class="wan-video-gen__failed-sub">{{ activeTask.errorMessage }}</p>
        <el-button @click="retry(activeTask)">重试</el-button>
      </div>

      <div v-else-if="activeTask.resultUrl" class="wan-video-gen__canvas-result">
        <video :src="activeTask.resultUrl" controls autoplay class="wan-video-gen__result-video" />
        <div class="wan-video-gen__result-actions">
          <el-button @click="download(activeTask.resultUrl)">
            <el-icon><Download /></el-icon>
            下载
          </el-button>
          <el-button @click="reusePrompt(activeTask)">
            <el-icon><VideoCamera /></el-icon>
            再次生成
          </el-button>
        </div>
      </div>
    </main>

    <!-- 右侧：参数 + 输入区 -->
    <aside class="wan-video-gen__panel">
      <div class="wan-video-gen__param-group">
        <div class="wan-video-gen__param-label">模型</div>
        <el-select v-model="model" placeholder="选择模型" size="large">
          <el-option
            v-for="m in modelOptions"
            :key="m.value"
            :value="m.value"
            :label="m.label"
          />
        </el-select>
      </div>

      <div class="wan-video-gen__param-group">
        <div class="wan-video-gen__param-label">比例</div>
        <div class="wan-video-gen__ratio-grid">
          <button
            v-for="r in ratioOptions"
            :key="r.value"
            type="button"
            class="wan-video-gen__ratio-btn"
            :class="{ 'is-active': size === r.value }"
            @click="size = r.value"
          >
            <span class="wan-video-gen__ratio-shape" :style="r.shapeStyle"></span>
            <span class="wan-video-gen__ratio-name">{{ r.label }}</span>
          </button>
        </div>
      </div>

      <div class="wan-video-gen__param-group">
        <div class="wan-video-gen__param-label">时长</div>
        <ReRadioGroup v-model="duration" >
          <ReRadioButton :value="5">5 秒</ReRadioButton>
          <ReRadioButton :value="10">10 秒</ReRadioButton>
        </ReRadioGroup>
      </div>

      <div class="wan-video-gen__composer">
        <div class="wan-video-gen__composer-input">
          <el-input
            v-model="prompt"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            resize="none"
            placeholder="描述你想要的视频，例如：一只柯基犬在草地上奔跑，夕阳西下，慢镜头"
            @keydown="onComposerKeydown"
          />
        </div>
        <div class="wan-video-gen__composer-footer">
          <span class="wan-video-gen__composer-tip">
            <el-icon><Lightning /></el-icon>
            Ctrl + Enter 快速生成
          </span>
          <el-button
            type="primary"
            size="large"
            :loading="generating"
            :disabled="!prompt.trim()"
            @click="handleGenerate"
          >
            <el-icon v-if="!generating"><VideoCamera /></el-icon>
            {{ generating ? '生成中' : '生成' }}
          </el-button>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
/**
 * ReVideoGen —— 文生视频组件（万相风格）
 *
 * 交互模型（异步任务）：
 *   1. 提交 POST /v2/generate/task/video → 返回 taskId
 *   2. 轮询 GET /v2/generate/task/{taskId} → PROCESSING / SUCCESS / FAILED
 *   3. 历史记录 GET /v2/generate/task/list?type=video
 */
import { onBeforeUnmount, ref } from 'vue';
import {http, message} from '@repo/core';
import { ElButton, ElInput, ElIcon, ElSelect, ElOption, ElTag } from 'element-plus';
import { VideoCamera, VideoCameraFilled, Loading, Download, WarningFilled, Lightning } from '@element-plus/icons-vue';
import { ReRadioGroup, ReRadioButton } from '@repo/ui/re-kit';

interface Props {
  baseUrl?: string;
  headers?: Record<string, string>;
}

const props = withDefaults(defineProps<Props>(), {
  baseUrl: '/v2/generate',
});

/** 生成任务（与后端 GenerateTask 对齐） */
interface GenerateTask {
  taskId: string;
  type?: string;
  prompt: string;
  model?: string;
  status: 'PROCESSING' | 'SUCCESS' | 'FAILED';
  resultUrl?: string;
  errorMessage?: string;
  createTime?: string;
  completeTime?: string;
}

const prompt = ref('');
const model = ref('sora');
const size = ref('1280x720');
const duration = ref(5);
const generating = ref(false);
const historyLoading = ref(false);

const modelOptions = [
  { value: 'sora', label: 'Sora' },
  { value: 'gen-2', label: 'Runway Gen-2' },
  { value: 'wan', label: '通义万相 Wan' },
];

const ratioOptions = [
  { value: '1280x720', label: '16:9', shapeStyle: { width: '22px', height: '12px' } },
  { value: '1024x1024', label: '1:1', shapeStyle: { width: '18px', height: '18px' } },
  { value: '720x1280', label: '9:16', shapeStyle: { width: '12px', height: '22px' } },
];

const history = ref<GenerateTask[]>([]);
const activeTask = ref<GenerateTask | null>(null);
const timers = new Map<string, number>();

/** 后端 ReturnResult 成功判定 */
const isSuccess = (data: Record<string, unknown>): boolean => {
  if (data.success === true || data.ok === true) return true;
  if (data.code === undefined) return true;
  const code = String(data.code);
  return code === '00000' || code === '200' || code === '0';
};

const statusLabel = (s: string) => (s === 'SUCCESS' ? '完成' : s === 'FAILED' ? '失败' : '生成中');
const statusTagType = (s: string) => (s === 'SUCCESS' ? 'success' : s === 'FAILED' ? 'danger' : 'info');

function formatTime(t?: string) {
  if (!t) return '';
  return new Date(t).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/** 加载历史记录 */
async function loadHistory() {
  historyLoading.value = true;
  try {
    const { data } = await http().get(`${props.baseUrl}/task/list`).headers({
      Accept: 'application/json',
      ...(props.headers ?? {}),
    }).query({ type: 'video' });
    if (!isSuccess(data)) throw new Error(data.message || data.msg || '历史记录加载失败');
    const list: GenerateTask[] = data.data ?? [];
    history.value = list;
    if (list.length > 0 && !activeTask.value) {
      activeTask.value = list[0];
    }
    list.forEach((t) => {
      if (t.status === 'PROCESSING') startPolling(t.taskId);
    });
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    historyLoading.value = false;
  }
}

/** 提交生成任务 */
async function handleGenerate() {
  const text = prompt.value.trim();
  if (!text || generating.value) return;
  generating.value = true;
  try {
    await submitOne(text);
    await loadHistory();
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    generating.value = false;
  }
}

/** 提交单个任务 */
async function submitOne(text: string): Promise<GenerateTask> {
  const { data } = await http().post(`${props.baseUrl}/task/video`).headers(props.headers ?? {}).data({
    prompt: text,
    model: model.value,
    duration: duration.value,
    size: size.value,
  });
  if (!isSuccess(data)) throw new Error(data.message || data.msg || '生成失败');
  const task: GenerateTask = data.data;
  upsertTask(task);
  if (!activeTask.value) {
    activeTask.value = task;
  }
  startPolling(task.taskId);
  return task;
}

/** 启动轮询 */
function startPolling(taskId: string) {
  if (timers.has(taskId)) return;
  const timer = window.setInterval(async () => {
    try {
      const { data } = await http().get(`${props.baseUrl}/task/${taskId}`).headers(props.headers ?? {});
      if (!isSuccess(data)) throw new Error(data.message || data.msg || '查询失败');
      const task: GenerateTask = data.data;
      upsertTask(task);
      if (task.status !== 'PROCESSING') stopPolling(taskId);
    } catch {
      stopPolling(taskId);
    }
  }, 3000);
  timers.set(taskId, timer);
}

function stopPolling(taskId: string) {
  const timer = timers.get(taskId);
  if (timer) {
    window.clearInterval(timer);
    timers.delete(taskId);
  }
}

/** 更新本地任务快照 */
function upsertTask(task: GenerateTask) {
  const idx = history.value.findIndex((t) => t.taskId === task.taskId);
  if (idx >= 0) {
    history.value[idx] = task;
  } else {
    history.value.unshift(task);
  }
  if (activeTask.value?.taskId === task.taskId) {
    activeTask.value = task;
  }
}

/** 选中历史任务 */
function selectTask(task: GenerateTask) {
  activeTask.value = task;
  if (task.status === 'PROCESSING') startPolling(task.taskId);
}

/** 失败重试 */
function retry(task: GenerateTask) {
  prompt.value = task.prompt;
  if (task.model) model.value = task.model;
  handleGenerate();
}

/** 复用提示词再次生成 */
function reusePrompt(task: GenerateTask) {
  prompt.value = task.prompt;
  if (task.model) model.value = task.model;
}

/** 下载结果 */
function download(url: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = `generated-video-${Date.now()}.mp4`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/** Ctrl + Enter 快速生成 */
function onComposerKeydown(e: Event | KeyboardEvent) {
  if (!(e instanceof KeyboardEvent)) return;
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    handleGenerate();
  }
}

loadHistory();

onBeforeUnmount(() => {
  timers.forEach((t) => window.clearInterval(t));
  timers.clear();
});
</script>

<style scoped>
/* ===== 万相风格布局 ===== */
.wan-video-gen {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr) 280px;
  height: 100%;
  background: var(--el-bg-color);
}

/* ===== 左侧历史栏 ===== */
.wan-video-gen__history {
  border-right: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.wan-video-gen__history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 14px 10px;
  flex-shrink: 0;
}
.wan-video-gen__history-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.wan-video-gen__history-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 10px 12px;
}
.wan-video-gen__history-empty {
  padding: 32px 8px;
  text-align: center;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.wan-video-gen__history-item {
  display: flex;
  gap: 10px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}
.wan-video-gen__history-item:hover {
  background: var(--el-fill-color-light);
}
.wan-video-gen__history-item.is-active {
  background: color-mix(in srgb, var(--el-color-primary) 8%, var(--el-bg-color));
}
.wan-video-gen__history-thumb {
  position: relative;
  width: 64px;
  height: 40px;
  border-radius: 6px;
  overflow: hidden;
  background: var(--el-fill-color-light);
  flex-shrink: 0;
}
.wan-video-gen__history-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.wan-video-gen__thumb-loading,
.wan-video-gen__thumb-failed {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-placeholder);
}
.wan-video-gen__history-status {
  position: absolute;
  right: 3px;
  bottom: 3px;
  transform: scale(0.85);
  transform-origin: bottom right;
}
.wan-video-gen__history-info {
  min-width: 0;
}
.wan-video-gen__history-prompt {
  font-size: 12px;
  color: var(--el-text-color-primary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.wan-video-gen__history-time {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  margin-top: 4px;
}

/* ===== 中部画布 ===== */
.wan-video-gen__canvas {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--el-fill-color-lighter);
  overflow-y: auto;
}
.wan-video-gen__canvas-empty {
  text-align: center;
  color: var(--el-text-color-secondary);
}
.wan-video-gen__empty-icon {
  font-size: 44px;
  color: var(--el-text-color-placeholder);
  margin-bottom: 16px;
}
.wan-video-gen__empty-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 6px;
}
.wan-video-gen__empty-sub {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin: 0;
}

.wan-video-gen__canvas-processing {
  text-align: center;
}
.wan-video-gen__processing-art {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.wan-video-gen__processing-pulse {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid color-mix(in srgb, var(--el-color-primary) 30%, transparent);
  animation: wan-pulse 1.6s ease-out infinite;
}
.wan-video-gen__processing-icon {
  font-size: 32px;
  color: var(--el-color-primary);
}
.wan-video-gen__processing-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 6px;
}
.wan-video-gen__processing-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin: 0;
  max-width: 360px;
}

@keyframes wan-pulse {
  0% { transform: scale(0.6); opacity: 1; }
  100% { transform: scale(1.2); opacity: 0; }
}

.wan-video-gen__canvas-failed {
  text-align: center;
}
.wan-video-gen__failed-icon {
  font-size: 40px;
  color: var(--el-color-danger);
  margin-bottom: 12px;
}
.wan-video-gen__failed-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 6px;
}
.wan-video-gen__failed-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin: 0 0 16px;
  max-width: 320px;
}

.wan-video-gen__canvas-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  max-width: 100%;
}
.wan-video-gen__result-video {
  max-width: 100%;
  max-height: calc(100vh - 220px);
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  background: #000;
}
.wan-video-gen__result-actions {
  display: flex;
  gap: 8px;
}

/* ===== 右侧参数面板 ===== */
.wan-video-gen__panel {
  border-left: 1px solid var(--el-border-color-lighter);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  overflow-y: auto;
}
.wan-video-gen__param-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.wan-video-gen__param-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}
.wan-video-gen__ratio-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.wan-video-gen__ratio-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color);
  cursor: pointer;
  transition: all 0.2s ease;
}
.wan-video-gen__ratio-btn:hover {
  border-color: var(--el-color-primary);
}
.wan-video-gen__ratio-btn.is-active {
  border-color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 6%, var(--el-bg-color));
}
.wan-video-gen__ratio-shape {
  border: 1.5px solid var(--el-text-color-secondary);
  border-radius: 2px;
}
.wan-video-gen__ratio-btn.is-active .wan-video-gen__ratio-shape {
  border-color: var(--el-color-primary);
}
.wan-video-gen__ratio-name {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
.wan-video-gen__ratio-btn.is-active .wan-video-gen__ratio-name {
  color: var(--el-color-primary);
  font-weight: 600;
}

/* ===== 底部输入区 ===== */
.wan-video-gen__composer {
  margin-top: auto;
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.wan-video-gen__composer-input :deep(.el-textarea__inner) {
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.6;
}
.wan-video-gen__composer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.wan-video-gen__composer-tip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}
</style>

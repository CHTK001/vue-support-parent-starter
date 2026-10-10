<template>
  <div class="context-panel" v-if="visible">
    <div class="panel-header">
      <span class="panel-title">
        <el-icon><InfoFilled /></el-icon>
        会话上下文
      </span>
      <el-button link @click="visible = false">
        <el-icon><Close /></el-icon>
      </el-button>
    </div>

    <div class="panel-content">
      <!-- 会话信息 -->
      <div class="info-section">
        <div class="section-title">会话信息</div>
        <div class="info-item">
          <span class="info-label">会话ID</span>
          <span class="info-value session-id">{{ sessionId || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">消息数</span>
          <span class="info-value">{{ messageCount }} 条</span>
        </div>
        <div class="info-item">
          <span class="info-label">当前模型</span>
          <span class="info-value model-name">{{ currentModel || '-' }}</span>
        </div>
      </div>

      <!-- Token使用 -->
      <div class="info-section">
        <div class="section-title">Token 使用</div>
        <div class="token-stats">
          <div class="token-item">
            <div class="token-label">输入</div>
            <div class="token-value input">{{ formatNumber(tokenUsage.input) }}</div>
          </div>
          <div class="token-item">
            <div class="token-label">输出</div>
            <div class="token-value output">{{ formatNumber(tokenUsage.output) }}</div>
          </div>
          <div class="token-item">
            <div class="token-label">总计</div>
            <div class="token-value total">{{ formatNumber(tokenUsage.total) }}</div>
          </div>
        </div>
        <div class="token-progress">
          <div class="progress-label">
            <span>上下文使用</span>
            <span>{{ contextUsagePercent }}% / {{ maxContext }}</span>
          </div>
          <el-progress
            :percentage="contextUsagePercent"
            :color="progressColor"
            :stroke-width="8"
          />
        </div>
      </div>

      <!-- 记忆体 -->
      <div class="info-section">
        <div class="section-head">
          <span class="section-title">{{ t('chat.context.memory') }}</span>
          <span class="section-actions">
            <el-button
              v-if="conversationMemories.length"

              link
              type="danger"
              @click="handleClearConversation"
            >{{ t('chat.context.memoryClearConversation') }}</el-button>
            <el-button link :loading="memoryLoading" @click="loadMemories">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </span>
        </div>
        <div class="memory-stats" v-if="memoryStats">
          {{ t('chat.context.memoryStats', {
            active: memoryStats.active,
            capacity: memoryStats.capacity,
            recallable: memoryStats.recallable
          }) }}
        </div>
        <div class="memory-list" v-loading="memoryLoading">
          <div v-for="item in memories" :key="item.memoryId" class="memory-item">
            <div class="memory-tags">
              <span class="memory-tag scope" :class="item.scope">
                {{ item.scope === 'conversation'
                  ? t('chat.context.memoryScopeConversation')
                  : t('chat.context.memoryScopeGlobal') }}
              </span>
              <span class="memory-tag source">{{ sourceLabel(item.source) }}</span>
              <span class="memory-tag hit">{{ t('chat.context.memoryHit', { n: item.hitCount || 0 }) }}</span>
            </div>
            <div class="memory-row">
              <span class="memory-content" :title="item.content">{{ item.title || item.content }}</span>
              <el-button link type="danger" :title="t('chat.context.memoryDelete')"
                @click="handleDeleteMemory(item)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
          <div v-if="!memoryLoading && memories.length === 0" class="empty-text">
            {{ t('chat.context.memoryEmpty') }}
          </div>
        </div>
      </div>

      <!-- 系统提示词 -->
      <div class="info-section" v-if="systemPrompt">
        <div class="section-title">系统提示词</div>
        <div class="system-prompt">{{ systemPrompt }}</div>
      </div>

      <!-- 消息列表预览 -->
      <div class="info-section">
        <div class="section-title">消息预览</div>
        <div class="message-preview">
          <div
            v-for="(msg, idx) in recentMessages"
            :key="idx"
            class="preview-item"
            :class="msg.role"
          >
            <span class="msg-role">{{ msg.role === 'user' ? '用户' : '助手' }}</span>
            <span class="msg-content">{{ msg.content?.slice(0, 50) || '' }}{{ msg.content?.length > 50 ? '...' : '' }}</span>
          </div>
          <div v-if="recentMessages.length === 0" class="empty-text">暂无消息</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { InfoFilled, Close, Refresh, Delete } from '@element-plus/icons-vue';
import { memoryApi, type AiMemoryItem } from '@/services/javaApi';
import { usePopup } from '@/composables/usePopup';

const { t } = useI18n();
const { confirm, toast } = usePopup();

const props = defineProps<{
  sessionId?: string;
  currentModel?: string;
  messages?: any[];
  systemPrompt?: string;
  maxContext?: number;
}>();

const visible = ref(true);

const memories = ref<AiMemoryItem[]>([]);
const memoryStats = ref<{ active: number; capacity: number; recallable: number } | null>(null);
const memoryLoading = ref(false);

const conversationMemories = computed(() =>
  memories.value.filter((m) => m.scope === 'conversation')
);

const sourceLabel = (source?: string) => {
  const key = (
    { manual: 'memorySourceManual', 'auto-extract': 'memorySourceAuto', tool: 'memorySourceTool', import: 'memorySourceImport' } as Record<string, string>
  )[source || ''];
  return key ? t(`chat.context.${key}`) : source || '-';
};

const loadMemories = async () => {
  if (!props.sessionId) {
    memories.value = [];
    memoryStats.value = null;
    return;
  }
  memoryLoading.value = true;
  try {
    const [listBody, statsBody] = await Promise.all([
      memoryApi.list({ conversation_id: props.sessionId, limit: 50 }),
      memoryApi.stats()
    ]);
    const rows = listBody?.data;
    memories.value = Array.isArray(rows) ? rows : [];
    memoryStats.value = statsBody?.data || null;
  } catch {
    toast.error(t('chat.context.memoryLoadFailed'));
  } finally {
    memoryLoading.value = false;
  }
};

const handleDeleteMemory = async (item: AiMemoryItem) => {
  const ok = await confirm(
    t('chat.context.memoryDeleteTitle'),
    t('chat.context.memoryDeleteDesc')
  );
  if (!ok) return;
  await memoryApi.delete(item.memoryId);
  toast.success(t('chat.context.memoryDeleted'));
  await loadMemories();
};

const handleClearConversation = async () => {
  if (!props.sessionId) return;
  const ok = await confirm(
    t('chat.context.memoryClearTitle'),
    t('chat.context.memoryClearDesc')
  );
  if (!ok) return;
  const body = await memoryApi.clearConversation(props.sessionId);
  toast.success(t('chat.context.memoryCleared', { n: Number(body?.data) || 0 }));
  await loadMemories();
};

onMounted(loadMemories);

const messageCount = computed(() => props.messages?.length || 0);

const recentMessages = computed(() => {
  return (props.messages || []).slice(-5).reverse();
});

const tokenUsage = computed(() => {
  let input = 0;
  let output = 0;
  (props.messages || []).forEach((msg) => {
    const tokens = msg.content?.length || 0;
    if (msg.role === 'user') {
      input += tokens;
    } else {
      output += tokens;
    }
  });
  // 简单估算：1个token ≈ 1.5个字符
  input = Math.round(input / 1.5);
  output = Math.round(output / 1.5);
  return { input, output, total: input + output };
});

const maxContext = computed(() => props.maxContext || 8192);

const contextUsagePercent = computed(() => {
  const percent = Math.round((tokenUsage.value.total / maxContext.value) * 100);
  return Math.min(percent, 100);
});

const progressColor = computed(() => {
  if (contextUsagePercent.value > 80) return '#f56c6c';
  if (contextUsagePercent.value > 50) return '#e6a23c';
  return '#67c23a';
});

const formatNumber = (num: number) => {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
};

watch(() => props.sessionId, () => {
  loadMemories();
});
</script>

<style scoped>
/* ============================================================================
   令牌口径（与本应用其余已改组件统一）：
   1. 颜色一律走 --el-*。本应用 refactor.css 已把 --el-* 映射到 --color-* 主题层
      （--el-bg-color / --el-border-color-lighter / --el-text-color-primary 等），
      public/themes 下 9 套配色换肤时自动跟随。
   2. 原文件里那一串 `var(--color-xxx, #兜底)` 的 hex 兜底是死代码（令牌恒有值），
      本次一并去掉，避免「看起来有兜底、其实跟主题脱节」的错觉。
   3. 面板是容器不是卡片，不加投影；层次靠 1px 分隔线与留白表达。
   4. 圆角、过渡统一取 --el-radius-* / --el-transition-duration-fast 令牌。
   ============================================================================ */

.context-panel {
  width: 280px;
  height: 100%;
  background: var(--el-bg-color);
  border-left: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.info-section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-head .section-title {
  margin-bottom: 8px;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.memory-stats {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.memory-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 240px;
  overflow-y: auto;
}

.memory-item {
  padding: 6px 8px;
  /* 原值 6px → sm 档 */
  border-radius: var(--el-radius-sm, 6px);
  background: var(--el-fill-color-light);
}

.memory-tags {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.memory-tag {
  font-size: 10px;
  line-height: 16px;
  padding: 0 5px;
  /* 原值 3px：比 xs(4px) 还紧一档，视觉上两者无差，取最近的 xs 档 */
  border-radius: var(--el-radius-xs, 4px);
  color: var(--el-text-color-secondary);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
}

/* 作用域标签：全局=主色、会话=成功色。边框用 color-mix 派生同色淡描边，
   换肤时与文字色自动保持同一色相 */
.memory-tag.scope.global {
  color: var(--el-color-primary);
  border-color: color-mix(in srgb, var(--el-color-primary) 35%, transparent);
}
.memory-tag.scope.conversation {
  color: var(--el-color-success);
  border-color: color-mix(in srgb, var(--el-color-success) 35%, transparent);
}

.memory-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 4px;
}

.memory-content {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 13px;
}

.info-label {
  color: var(--el-text-color-secondary);
}

.info-value {
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.session-id {
  font-family: monospace;
  font-size: 11px;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-name {
  font-family: monospace;
  font-size: 12px;
}

.token-stats {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.token-item {
  flex: 1;
  text-align: center;
  padding: 8px 4px;
  background: var(--el-fill-color-light);
  /* 原值 6px → sm 档 */
  border-radius: var(--el-radius-sm, 6px);
}

.token-label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.token-value {
  font-size: 16px;
  font-weight: 700;
}

/* 三格数字用「主色 / 成功 / 警告」区分语义，换肤时随主题走 */
.token-value.input { color: var(--el-color-primary); }
.token-value.output { color: var(--el-color-success); }
.token-value.total { color: var(--el-color-warning); }

.token-progress {
  margin-top: 8px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.system-prompt {
  font-size: 12px;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-light);
  padding: 8px;
  /* 原值 6px → sm 档 */
  border-radius: var(--el-radius-sm, 6px);
  line-height: 1.5;
  max-height: 120px;
  overflow-y: auto;
}

.message-preview {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview-item {
  display: flex;
  gap: 8px;
  padding: 6px 8px;
  /* 原值 4px → xs 档 */
  border-radius: var(--el-radius-xs, 4px);
  font-size: 12px;
}

/* 消息预览的浅底：原 rgba(...,0.1) 改用 color-mix 从语义色派生，
   这样 9 套配色下淡底与角色色始终同色相，不会出现「蓝底配黄角色标」 */
.preview-item.user {
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.preview-item.assistant {
  background: color-mix(in srgb, var(--el-color-success) 12%, transparent);
}

.msg-role {
  font-weight: 600;
  flex-shrink: 0;
  width: 32px;
}

.preview-item.user .msg-role { color: var(--el-color-primary); }
.preview-item.assistant .msg-role { color: var(--el-color-success); }

.msg-content {
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-text {
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  padding: 12px;
}

/* 本文件原本没有任何 transition / animation（面板、条目、进度条全是静态样式），
   故此处只列出「本组件自有、且可能在下一次迭代里被加上动效」的选择器，
   不写 `.context-panel *` 这种通配：通配会把内部 Element Plus 组件
   （el-button / el-progress）的合法动效一并掐掉。 */
@media (prefers-reduced-motion: reduce) {
  .panel-header,
  .panel-content,
  .memory-list,
  .memory-item,
  .message-preview,
  .system-prompt {
    transition: none;
    animation: none;
  }
}
</style>

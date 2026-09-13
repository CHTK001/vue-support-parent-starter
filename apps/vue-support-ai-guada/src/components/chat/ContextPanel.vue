<template>
  <div class="context-panel" v-if="visible">
    <div class="panel-header">
      <span class="panel-title">
        <el-icon><InfoFilled /></el-icon>
        会话上下文
      </span>
      <el-button size="small" link @click="visible = false">
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
import { ref, computed, watch } from 'vue';
import { InfoFilled, Close } from '@element-plus/icons-vue';

const props = defineProps<{
  sessionId?: string;
  currentModel?: string;
  messages?: any[];
  systemPrompt?: string;
  maxContext?: number;
}>();

const visible = ref(true);

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
  // 会话切换时重置
});
</script>

<style scoped>
.context-panel {
  width: 280px;
  height: 100%;
  background: var(--color-bg, #fff);
  border-left: 1px solid var(--color-border, #e4e7ed);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border, #e4e7ed);
  background: var(--color-bg-secondary, #f5f7fa);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text, #303133);
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
  color: var(--color-text-secondary, #909399);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 13px;
}

.info-label {
  color: var(--color-text-secondary, #909399);
}

.info-value {
  color: var(--color-text, #303133);
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
  background: var(--color-bg-secondary, #f5f7fa);
  border-radius: 6px;
}

.token-label {
  font-size: 11px;
  color: var(--color-text-secondary, #909399);
  margin-bottom: 4px;
}

.token-value {
  font-size: 16px;
  font-weight: 700;
}

.token-value.input { color: #409eff; }
.token-value.output { color: #67c23a; }
.token-value.total { color: #e6a23c; }

.token-progress {
  margin-top: 8px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--color-text-secondary, #909399);
  margin-bottom: 4px;
}

.system-prompt {
  font-size: 12px;
  color: var(--color-text, #303133);
  background: var(--color-bg-secondary, #f5f7fa);
  padding: 8px;
  border-radius: 6px;
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
  border-radius: 4px;
  font-size: 12px;
}

.preview-item.user {
  background: rgba(64, 158, 255, 0.1);
}

.preview-item.assistant {
  background: rgba(103, 194, 58, 0.1);
}

.msg-role {
  font-weight: 600;
  flex-shrink: 0;
  width: 32px;
}

.preview-item.user .msg-role { color: #409eff; }
.preview-item.assistant .msg-role { color: #67c23a; }

.msg-content {
  color: var(--color-text, #303133);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-text {
  text-align: center;
  color: var(--color-text-secondary, #909399);
  font-size: 12px;
  padding: 12px;
}
</style>

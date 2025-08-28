<template>
  <div class="email-detail">
    <!-- 邮件详情 -->
    <div v-if="email" class="detail-area">
      <div class="detail-header">
        <div class="detail-subject">{{ email.subject }}</div>
        <div class="detail-actions">
          <el-button size="small" :icon="useRenderIcon('ri:reply-line')" @click="handleReply">回复</el-button>
          <el-button size="small" :icon="useRenderIcon('ri:reply-all-line')" @click="handleReplyAll">全部回复</el-button>
          <el-button size="small" :icon="useRenderIcon('ri:share-forward-line')" @click="handleForward">转发</el-button>
          <el-button size="small" :icon="useRenderIcon('ri:delete-bin-line')" @click="handleDelete">删除</el-button>
        </div>
      </div>
      <div class="detail-info">
        <div class="sender-info">
          <div class="sender-avatar large">
            <IconifyIconOnline icon="ri:user-line" />
          </div>
          <div class="sender-details">
            <div class="sender-name">{{ email.sender }}</div>
            <div class="sender-email">{{ email.senderEmail }}</div>
            <div class="email-time">{{ formatFullTime(email.time) }}</div>
          </div>
        </div>
      </div>
      <!-- 附件区域 -->
      <div v-if="email.hasAttachment" class="detail-attachments">
        <div class="attachments-header">
          <IconifyIconOnline icon="ri:attachment-line" />
          <span>附件</span>
        </div>
        <div class="attachments-list">
          <div class="attachment-item">
            <IconifyIconOnline icon="ri:file-line" />
            <span class="attachment-name">附件文件.pdf</span>
            <span class="attachment-size">(2.3MB)</span>
            <el-button size="small" type="primary" link @click="downloadAttachment">下载</el-button>
          </div>
        </div>
      </div>
      
      <div class="detail-content">
        <div class="email-body" v-html="parseEmailContent(email.content)"></div>
      </div>
    </div>

    <!-- 默认状态 -->
    <div v-else class="welcome-area">
      <div class="welcome-content">
        <IconifyIconOnline icon="ri:mail-open-line" class="welcome-icon" />
        <h3>欢迎使用邮箱控制台</h3>
        <p>选择左侧邮件查看详情，或点击撰写邮件开始写邮件</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";

// 定义接口
interface Email {
  id: number;
  sender: string;
  senderEmail: string;
  subject: string;
  preview: string;
  content: string;
  time: Date;
  read: boolean;
  starred: boolean;
  selected: boolean;
  hasAttachment: boolean;
  folder: string;
  tags: string[];
}

// 定义props
const props = defineProps<{
  email?: Email;
}>();

// 定义事件
const emit = defineEmits<{
  reply: [email: Email];
  'reply-all': [email: Email];
  forward: [email: Email];
  delete: [email: Email];
}>();

// 方法
function handleReply() {
  if (props.email) {
    emit('reply', props.email);
  }
}

function handleReplyAll() {
  if (props.email) {
    emit('reply-all', props.email);
  }
}

function handleForward() {
  if (props.email) {
    emit('forward', props.email);
  }
}

function handleDelete() {
  if (props.email) {
    emit('delete', props.email);
  }
}

function formatFullTime(time: Date) {
  return time.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function parseEmailContent(content: string): string {
  if (!content) return '';
  
  // 如果内容已经是HTML格式，直接返回
  if (content.includes('<') && content.includes('>')) {
    return content;
  }
  
  // 将纯文本转换为HTML格式
  return content
    .replace(/\n/g, '<br>')
    .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
    .replace(/  /g, '&nbsp;&nbsp;');
}

function downloadAttachment() {
  // 这里应该调用下载附件的API
  console.log('下载附件');
}
</script>

<style scoped>
.email-detail {
  flex: 1;
  background: #fff;
  display: flex;
  flex-direction: column;
}

/* 邮件详情区域 */
.detail-area {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e4e7ed;
  background: #fafafa;
}

.detail-subject {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.detail-actions {
  display: flex;
  gap: 8px;
}

.detail-info {
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.sender-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sender-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #909399;
}

.sender-avatar.large {
  width: 48px;
  height: 48px;
  font-size: 20px;
}

.sender-details {
  flex: 1;
}

.sender-details .sender-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.sender-details .sender-email {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.sender-details .email-time {
  font-size: 12px;
  color: #c0c4cc;
}

/* 附件区域 */
.detail-attachments {
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.attachments-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 12px;
}

.attachments-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  font-size: 14px;
}

.attachment-name {
  flex: 1;
  color: #303133;
}

.attachment-size {
  color: #909399;
  font-size: 12px;
}

.detail-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.email-body {
  line-height: 1.6;
  color: #303133;
}

.email-body :deep(p) {
  margin-bottom: 12px;
}

.email-body :deep(ul) {
  margin: 12px 0;
  padding-left: 20px;
}

.email-body :deep(li) {
  margin-bottom: 4px;
}

/* 欢迎区域 */
.welcome-area {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.welcome-content {
  text-align: center;
  color: #909399;
}

.welcome-icon {
  font-size: 64px;
  margin-bottom: 16px;
  color: #ddd;
}

.welcome-content h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #606266;
}

.welcome-content p {
  margin: 0;
  font-size: 14px;
}

/* 滚动条样式 */
.detail-content::-webkit-scrollbar {
  width: 6px;
}

.detail-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.detail-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.detail-content::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>
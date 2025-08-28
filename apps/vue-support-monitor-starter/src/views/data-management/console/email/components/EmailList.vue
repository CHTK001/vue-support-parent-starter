<template>
  <div class="email-list">
    <div class="list-header">
      <div class="list-controls">
        <el-checkbox v-model="selectAll" @change="handleSelectAll" />
        <el-button-group class="action-buttons">
          <el-button size="small" :icon="useRenderIcon('ri:delete-bin-line')" @click="handleDeleteSelected">删除</el-button>
          <el-button size="small" :icon="useRenderIcon('ri:star-line')" @click="handleStarSelected">标星</el-button>
          <el-button size="small" :icon="useRenderIcon('ri:mail-check-line')" @click="handleMarkAsRead">标记已读</el-button>
        </el-button-group>
      </div>
      <div class="list-search">
        <el-input 
          v-model="searchQuery" 
          placeholder="搜索邮件..." 
          :prefix-icon="useRenderIcon('ri:search-line')" 
          clearable 
          @input="handleSearch"
        />
      </div>
    </div>

    <div class="list-content">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <el-skeleton :rows="5" animated />
      </div>
      
      <!-- 邮件列表 -->
      <div
        v-else
        v-for="email in emails"
        :key="email.id"
        :class="[
          'email-item',
          {
            active: selectedEmailId === email.id,
            unread: !email.read,
            starred: email.starred
          }
        ]"
        @click="selectEmail(email)"
      >
        <div class="email-checkbox">
          <el-checkbox v-model="email.selected" @click.stop />
        </div>
        <div class="email-star" @click.stop="toggleStar(email)">
          <IconifyIconOnline 
            :icon="email.starred ? 'ri:star-fill' : 'ri:star-line'" 
            :class="{ starred: email.starred }" 
          />
        </div>
        <div class="email-sender">
          <div class="sender-avatar">
            <IconifyIconOnline icon="ri:user-line" />
          </div>
          <span class="sender-name">{{ email.sender }}</span>
        </div>
        <div class="email-content-preview">
          <div class="email-subject">{{ email.subject }}</div>
          <div class="email-preview">{{ email.preview }}</div>
        </div>
        <div class="email-meta">
          <div class="email-time">{{ formatTime(email.time) }}</div>
          <div v-if="email.hasAttachment" class="email-attachment">
            <IconifyIconOnline icon="ri:attachment-line" />
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && emails.length === 0" class="empty-state">
        <IconifyIconOnline icon="ri:mail-line" class="empty-icon" />
        <p class="empty-text">暂无邮件</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { ElMessage } from "element-plus";

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
  emails: Email[];
  selectedEmailId?: number;
  loading?: boolean;
}>();

// 定义事件
const emit = defineEmits<{
  'email-select': [email: Email];
  'email-star': [email: Email];
  'emails-delete': [emails: Email[]];
  'emails-star': [emails: Email[]];
  'emails-mark-read': [emails: Email[]];
  'search': [query: string];
}>();

// 响应式数据
const selectAll = ref(false);
const searchQuery = ref('');

// 监听全选状态
watch(() => props.emails, () => {
  const selectedCount = props.emails.filter(email => email.selected).length;
  selectAll.value = selectedCount > 0 && selectedCount === props.emails.length;
}, { deep: true });

// 方法
function selectEmail(email: Email) {
  emit('email-select', email);
}

function toggleStar(email: Email) {
  emit('email-star', email);
}

function handleSelectAll() {
  props.emails.forEach(email => {
    email.selected = selectAll.value;
  });
}

function handleDeleteSelected() {
  const selectedEmails = props.emails.filter(email => email.selected);
  if (selectedEmails.length === 0) {
    ElMessage.warning("请先选择要删除的邮件");
    return;
  }
  emit('emails-delete', selectedEmails);
}

function handleStarSelected() {
  const selectedEmails = props.emails.filter(email => email.selected);
  if (selectedEmails.length === 0) {
    ElMessage.warning("请先选择要标星的邮件");
    return;
  }
  emit('emails-star', selectedEmails);
}

function handleMarkAsRead() {
  const selectedEmails = props.emails.filter(email => email.selected);
  if (selectedEmails.length === 0) {
    ElMessage.warning("请先选择要标记的邮件");
    return;
  }
  emit('emails-mark-read', selectedEmails);
}

function handleSearch() {
  emit('search', searchQuery.value);
}

function formatTime(time: Date) {
  const now = new Date();
  const diff = now.getTime() - time.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) {
    return `${minutes}分钟前`;
  } else if (hours < 24) {
    return `${hours}小时前`;
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    return time.toLocaleDateString();
  }
}
</script>

<style scoped>
.email-list {
  width: 400px;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.list-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #fafafa;
}

.list-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.action-buttons {
  margin-left: 8px;
}

.list-search {
  width: 100%;
}

.list-content {
  flex: 1;
  overflow-y: auto;
}

.email-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.email-item:hover {
  background: #f8f9fa;
}

.email-item.active {
  background: #e3f2fd;
  border-left: 3px solid #409eff;
}

.email-item.unread {
  background: #fff;
  font-weight: 600;
}

.email-item.unread::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 4px;
  background: #409eff;
  border-radius: 50%;
}

.email-checkbox {
  margin-right: 8px;
}

.email-star {
  margin-right: 8px;
  font-size: 16px;
  color: #ddd;
  transition: color 0.2s ease;
}

.email-star:hover {
  color: #ffd700;
}

.email-star .starred {
  color: #ffd700;
}

.email-sender {
  display: flex;
  align-items: center;
  width: 120px;
  margin-right: 12px;
}

.sender-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  font-size: 14px;
  color: #909399;
}

.sender-name {
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.email-content-preview {
  flex: 1;
  min-width: 0;
}

.email-subject {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.email-preview {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.email-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.email-time {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}

.email-attachment {
  font-size: 14px;
  color: #909399;
}

.loading-state {
  padding: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #909399;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 14px;
  margin: 0;
}

/* 滚动条样式 */
.list-content::-webkit-scrollbar {
  width: 6px;
}

.list-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.list-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.list-content::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>
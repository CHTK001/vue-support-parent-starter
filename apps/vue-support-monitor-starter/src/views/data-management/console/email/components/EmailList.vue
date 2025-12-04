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
        <el-input v-model="searchQuery" placeholder="搜索邮件..." :prefix-icon="useRenderIcon('ri:search-line')" clearable @input="handleSearch" />
      </div>
    </div>

    <div ref="listContentRef" class="list-content overflow-x-hidden" @scroll="handleScroll">
      <!-- 加载状�?-->
      <div v-if="loading" class="loading-state">
        <el-skeleton :rows="5" animated />
      </div>

      <!-- 邮件列表 -->
      <div
        v-else
        v-for="email in emailData"
        :key="email.messageId"
        :class="[
          'email-item',
          {
            active: mouseClick === email.messageId,
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
          <IconifyIconOnline :icon="email.starred ? 'ri:star-fill' : 'ri:star-line'" :class="{ starred: email.starred }" />
        </div>
        <div class="email-sender">
          <div class="sender-avatar">
            <IconifyIconOnline icon="ri:user-line" />
          </div>
          <span class="sender-name" :title="email.from">{{ email.from }}</span>
        </div>
        <div class="email-content-preview">
          <div class="email-subject" :title="email.subject">{{ email.subject }}</div>
          <div class="email-preview">{{ email.preview }}</div>
        </div>
        <div class="email-meta">
          <div class="email-time">{{ formatTime(email.sentDate) }}</div>
          <div v-if="email.hasAttachment" class="email-attachment">
            <IconifyIconOnline icon="ri:attachment-line" />
          </div>
        </div>
      </div>

      <!-- 加载更多状�?-->
      <div v-if="loadingMore" class="loading-more">
        <el-skeleton :rows="2" animated />
        <div class="loading-more-text">
          <IconifyIconOnline icon="ri:loader-4-line" class="loading-icon" />
          正在加载更多邮件...
        </div>
      </div>

      <!-- 加载更多按钮 -->
      <div v-if="!loading && !loadingMore && hasMore !== false && emailData.length > 0" class="load-more-button">
        <el-button 
          type="primary" 
          :loading="loadingMore" 
          @click="handleLoadMore"
          class="load-more-btn"
        >
          <template #loading>
            <IconifyIconOnline icon="ri:loader-4-line" class="loading-icon" />
          </template>
          {{ loadingMore ? '加载�?..' : '加载更多' }}
        </el-button>
      </div>

      <!-- 没有更多数据提示 -->
      <div v-if="!loading && !loadingMore && hasMore === false && emailData.length > 0" class="no-more-data">
        <div class="no-more-text">已加载全部邮�?/div>
      </div>

      <!-- 空状�?-->
      <div v-if="!loading && emailData.length === 0" class="empty-state">
        <IconifyIconOnline icon="ri:mail-line" class="empty-icon" />
        <p class="empty-text">暂无邮件</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { ElMessage } from "element-plus";
import { ref, watch } from "vue";

// 定义接口
interface Email {
  messageId: number;
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
  loadingMore?: boolean;
  hasMore?: boolean;
}>();

// 定义事件
const emit = defineEmits<{
  "email-select": [email: Email];
  "email-star": [email: Email];
  "emails-delete": [emails: Email[]];
  "emails-star": [emails: Email[]];
  "emails-mark-read": [emails: Email[]];
  search: [query: string];
  "load-more": [];
}>();

// 响应式数�?
const emailData = ref(props.emails as any);
const selectAll = ref(false);
const searchQuery = ref("");
const listContentRef = ref<HTMLElement>();
const isLoadingMore = ref(false);
const mouseClick = ref();
// 监听全选状�?
watch(
  () => props.emails,
  v => {
    emailData.value = v;
    const selectedCount = emailData.value.filter(email => email.selected).length;
    selectAll.value = selectedCount > 0 && selectedCount === emailData.value.length;
  },
  { deep: true, immediate: true }
);

// 方法
function selectEmail(email: Email) {
  mouseClick.value = email.messageId;
  emit("email-select", email);
}

function toggleStar(email: Email) {
  emit("email-star", email);
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
  emit("emails-delete", selectedEmails);
}

function handleStarSelected() {
  const selectedEmails = props.emails.filter(email => email.selected);
  if (selectedEmails.length === 0) {
    ElMessage.warning("请先选择要标星的邮件");
    return;
  }
  emit("emails-star", selectedEmails);
}

function handleMarkAsRead() {
  const selectedEmails = props.emails.filter(email => email.selected);
  if (selectedEmails.length === 0) {
    ElMessage.warning("请先选择要标记的邮件");
    return;
  }
  emit("emails-mark-read", selectedEmails);
}

function handleSearch() {
  emit("search", searchQuery.value);
}

// 手动加载更多
function handleLoadMore() {
  if (props.loading || props.loadingMore || isLoadingMore.value) {
    return;
  }
  
  if (props.hasMore !== false) {
    isLoadingMore.value = true;
    emit("load-more");
    
    // 防抖处理，避免重复触�?
    setTimeout(() => {
      isLoadingMore.value = false;
    }, 1000);
  }
}

// 滚动处理函数
function handleScroll() {
  if (!listContentRef.value || props.loading || props.loadingMore || isLoadingMore.value) {
    return;
  }

  const { scrollTop, scrollHeight, clientHeight } = listContentRef.value;
  const threshold = 50; // 距离底部50px时开始加�?

  if (scrollTop + clientHeight >= scrollHeight - threshold) {
    // 检查是否还有更多数�?
    if (props.hasMore !== false) {
      isLoadingMore.value = true;
      emit("load-more");

      // 防抖处理，避免重复触�?
      setTimeout(() => {
        isLoadingMore.value = false;
      }, 1000);
    }
  }
}

// 重置滚动位置（当切换文件夹时�?
function resetScroll() {
  if (listContentRef.value) {
    listContentRef.value.scrollTop = 0;
  }
}

// 暴露方法给父组件
defineExpose({
  resetScroll
});

function formatTime(time: any) {
  time = new Date(time);
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
  border-bottom: 1px solid var(--el-border-color);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.email-item:hover {
  background: var(--el-bg-color-overlay);
}

.email-item:active {
  border-left: 2px solid #3b82f6;
  transform: scale(0.98);
}

.email-item.active {
  background-color: #ffc7f3 !important;
  border-left: 4px solid #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
  transform: translateX(2px);
}

.email-item.unread {
  background: #f0f9ff;
  font-weight: 600;
}

/* 已读邮件样式 */
.email-item:not(.unread) {
   background: var(--el-bg-color-overlay);
  color: #6b7280;
}

.email-item:not(.unread) .email-subject {
  color: #6b7280;
  font-weight: 400;
}

.email-item:not(.unread) .sender-name {
  color: #9ca3af;
  font-weight: 400;
}

.email-item.unread .email-subject {
  color: #1f2937;
  font-weight: 600;
}

.email-item.unread .sender-name {
  color: #374151;
  font-weight: 500;
}

.email-item.unread::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 4px;
  background: var(--el-bg-color-overlay);
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
  min-width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  font-size: 14px;
   color: var(--el-text-color-primary);
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
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.email-preview {
  font-size: 12px;
   color: var(--el-text-color-primary);
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
   color: var(--el-text-color-primary);
  white-space: nowrap;
}

.email-attachment {
  font-size: 14px;
   color: var(--el-text-color-primary);
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
   color: var(--el-text-color-primary);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 14px;
  margin: 0;
}

/* 加载更多按钮样式 */
.load-more-button {
  padding: 16px;
  text-align: center;
  border-top: 1px solid #f0f0f0;
}

.load-more-btn {
  width: 200px;
  height: 36px;
  border-radius: 18px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.load-more-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

/* 加载更多样式 */
.loading-more {
  padding: 16px;
  text-align: center;
}

.loading-more-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
  font-size: 14px;
   color: var(--el-text-color-primary);
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 没有更多数据样式 */
.no-more-data {
  padding: 16px;
  text-align: center;
}

.no-more-text {
  font-size: 12px;
  color: #c0c4cc;
  position: relative;
}

.no-more-text::before,
.no-more-text::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 60px;
  height: 1px;
  background: #e4e7ed;
}

.no-more-text::before {
  left: -80px;
}

.no-more-text::after {
  right: -80px;
}

/* 滚动条样�?*/
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

<script setup>
import { computed, onMounted, ref } from 'vue';
import {
    deleteEmail,
    fetchEmailAccounts,
    fetchEmailDetail,
    fetchEmailFolders,
    fetchEmailLabels,
    markEmailStatus,
    moveEmailToFolder,
    saveDraft,
    searchEmails,
    sendEmail,
    updateEmailLabels
} from './api';

import EmailComposer from './components/EmailComposer.vue';
import EmailDetail from './components/EmailDetail.vue';
import EmailList from './components/EmailList.vue';
import EmailSidebar from './components/EmailSidebar.vue';

// 状态管理
const accounts = ref([]);
const folders = ref([]);
const labels = ref([]);
const emails = ref([]);
const selectedEmail = ref(null);
const totalEmails = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);

// 选中的过滤条件
const selectedAccountId = ref('');
const selectedFolderId = ref('');
const selectedLabelId = ref('');

// 加载状态
const loadingAccounts = ref(false);
const loadingFolders = ref(false);
const loadingLabels = ref(false);
const loadingEmails = ref(false);
const loadingEmailDetail = ref(false);

// 视图状态
const showComposer = ref(false);
const composerMode = ref('compose');
const originalEmail = ref(null);
const isMobileView = ref(false);
const showEmailDetail = ref(false);

// 监听窗口大小变化
const handleResize = () => {
  isMobileView.value = window.innerWidth < 768;
};

// 初始化
onMounted(async () => {
  window.addEventListener('resize', handleResize);
  handleResize();
  
  await Promise.all([
    loadAccounts(),
    loadFolders(),
    loadLabels()
  ]);
  
  // 默认选择第一个账户和收件箱
  if (accounts.value.length > 0) {
    selectedAccountId.value = accounts.value[0].emailAccountId;
  }
  
  selectedFolderId.value = 'inbox';
  
  // 加载邮件列表
  await loadEmails();
});

// 加载账户列表
const loadAccounts = async () => {
  loadingAccounts.value = true;
  try {
    const response = await fetchEmailAccounts();
    if (response.success) {
      accounts.value = response.data;
    } else {
      ElMessage.error(response.message || '获取邮箱账户失败');
    }
  } catch (error) {
    console.error('加载邮箱账户出错:', error);
    ElMessage.error('获取邮箱账户失败');
  } finally {
    loadingAccounts.value = false;
  }
};

// 加载文件夹列表
const loadFolders = async () => {
  loadingFolders.value = true;
  try {
    const response = await fetchEmailFolders();
    if (response.success) {
      folders.value = response.data;
    } else {
      ElMessage.error(response.message || '获取邮件文件夹失败');
    }
  } catch (error) {
    console.error('加载邮件文件夹出错:', error);
    ElMessage.error('获取邮件文件夹失败');
  } finally {
    loadingFolders.value = false;
  }
};

// 加载标签列表
const loadLabels = async () => {
  loadingLabels.value = true;
  try {
    const response = await fetchEmailLabels();
    if (response.success) {
      labels.value = response.data;
    } else {
      ElMessage.error(response.message || '获取邮件标签失败');
    }
  } catch (error) {
    console.error('加载邮件标签出错:', error);
    ElMessage.error('获取邮件标签失败');
  } finally {
    loadingLabels.value = false;
  }
};

// 加载邮件列表
const loadEmails = async () => {
  loadingEmails.value = true;
  selectedEmail.value = null;
  showEmailDetail.value = false;
  
  try {
    const params = {
      accountId: selectedAccountId.value,
      folderId: selectedFolderId.value,
      labelId: selectedLabelId.value,
      page: currentPage.value,
      pageSize: pageSize.value
    };
    
    const response = await searchEmails(params);
    if (response.success) {
      emails.value = response.data.data;
      totalEmails.value = response.data.total;
    } else {
      ElMessage.error(response.message || '获取邮件列表失败');
    }
  } catch (error) {
    console.error('加载邮件列表出错:', error);
    ElMessage.error('获取邮件列表失败');
  } finally {
    loadingEmails.value = false;
  }
};

// 加载邮件详情
const loadEmailDetail = async (emailId) => {
  if (!emailId) return;
  
  loadingEmailDetail.value = true;
  
  try {
    const response = await fetchEmailDetail(emailId);
    if (response.success) {
      selectedEmail.value = response.data;
      showEmailDetail.value = true;
      
      // 更新邮件列表中的已读状态
      const emailIndex = emails.value.findIndex(email => email.emailId === emailId);
      if (emailIndex !== -1) {
        emails.value[emailIndex].emailIsRead = true;
      }
      
      // 更新文件夹未读计数
      updateFolderUnreadCount(selectedFolderId.value, -1);
    } else {
      ElMessage.error(response.message || '获取邮件详情失败');
    }
  } catch (error) {
    console.error('加载邮件详情出错:', error);
    ElMessage.error('获取邮件详情失败');
  } finally {
    loadingEmailDetail.value = false;
  }
};

// 更新文件夹未读计数
const updateFolderUnreadCount = (folderId, delta) => {
  const folderIndex = folders.value.findIndex(folder => folder.emailFolderId === folderId);
  if (folderIndex !== -1 && folders.value[folderIndex].emailFolderCount > 0) {
    folders.value[folderIndex].emailFolderCount += delta;
  }
};

// 处理选择账户
const handleSelectAccount = (accountId) => {
  selectedAccountId.value = accountId;
  currentPage.value = 1;
  loadEmails();
};

// 处理选择文件夹
const handleSelectFolder = (folderId) => {
  selectedFolderId.value = folderId;
  selectedLabelId.value = '';
  currentPage.value = 1;
  loadEmails();
};

// 处理选择标签
const handleSelectLabel = (labelId) => {
  selectedLabelId.value = labelId;
  selectedFolderId.value = '';
  currentPage.value = 1;
  loadEmails();
};

// 处理选择邮件
const handleSelectEmail = (emailId) => {
  loadEmailDetail(emailId);
};

// 处理星标邮件
const handleStarEmail = async (emailId, isStarred) => {
  try {
    const response = await markEmailStatus(emailId, { isStarred });
    if (response.success) {
      // 更新邮件列表中的星标状态
      const emailIndex = emails.value.findIndex(email => email.emailId === emailId);
      if (emailIndex !== -1) {
        emails.value[emailIndex].emailIsStarred = isStarred;
      }
      
      // 更新选中邮件的星标状态
      if (selectedEmail.value && selectedEmail.value.emailId === emailId) {
        selectedEmail.value.emailIsStarred = isStarred;
      }
      
      ElMessage.success(isStarred ? '已添加星标' : '已取消星标');
    } else {
      ElMessage.error(response.message || '操作失败');
    }
  } catch (error) {
    console.error('标记星标出错:', error);
    ElMessage.error('操作失败');
  }
};

// 处理标记重要
const handleMarkImportant = async (emailId, isImportant) => {
  try {
    const response = await markEmailStatus(emailId, { isImportant });
    if (response.success) {
      // 更新邮件列表中的重要状态
      const emailIndex = emails.value.findIndex(email => email.emailId === emailId);
      if (emailIndex !== -1) {
        emails.value[emailIndex].emailIsImportant = isImportant;
      }
      
      // 更新选中邮件的重要状态
      if (selectedEmail.value && selectedEmail.value.emailId === emailId) {
        selectedEmail.value.emailIsImportant = isImportant;
      }
      
      ElMessage.success(isImportant ? '已标记为重要' : '已取消重要标记');
    } else {
      ElMessage.error(response.message || '操作失败');
    }
  } catch (error) {
    console.error('标记重要出错:', error);
    ElMessage.error('操作失败');
  }
};

// 处理标记已读/未读
const handleMarkRead = async (emailId, isRead) => {
  try {
    const response = await markEmailStatus(emailId, { isRead });
    if (response.success) {
      // 更新邮件列表中的已读状态
      const emailIndex = emails.value.findIndex(email => email.emailId === emailId);
      if (emailIndex !== -1) {
        emails.value[emailIndex].emailIsRead = isRead;
      }
      
      // 更新选中邮件的已读状态
      if (selectedEmail.value && selectedEmail.value.emailId === emailId) {
        selectedEmail.value.emailIsRead = isRead;
      }
      
      // 更新文件夹未读计数
      updateFolderUnreadCount(selectedFolderId.value, isRead ? -1 : 1);
      
      ElMessage.success(isRead ? '已标记为已读' : '已标记为未读');
    } else {
      ElMessage.error(response.message || '操作失败');
    }
  } catch (error) {
    console.error('标记已读/未读出错:', error);
    ElMessage.error('操作失败');
  }
};

// 处理页码变化
const handlePageChange = (page) => {
  currentPage.value = page;
  loadEmails();
};

// 处理刷新邮件列表
const handleRefreshEmails = () => {
  loadEmails();
};

// 处理关闭邮件详情
const handleCloseEmailDetail = () => {
  selectedEmail.value = null;
  showEmailDetail.value = false;
};

// 处理回复邮件
const handleReplyEmail = (email) => {
  originalEmail.value = email;
  composerMode.value = 'reply';
  showComposer.value = true;
};

// 处理回复全部
const handleReplyAllEmail = (email) => {
  originalEmail.value = email;
  composerMode.value = 'replyAll';
  showComposer.value = true;
};

// 处理转发邮件
const handleForwardEmail = (email) => {
  originalEmail.value = email;
  composerMode.value = 'forward';
  showComposer.value = true;
};

// 处理删除邮件
const handleDeleteEmail = async (emailId) => {
  try {
    const response = await deleteEmail(emailId);
    if (response.success) {
      // 从邮件列表中移除
      emails.value = emails.value.filter(email => email.emailId !== emailId);
      
      // 如果是当前选中的邮件，清除选中状态
      if (selectedEmail.value && selectedEmail.value.emailId === emailId) {
        selectedEmail.value = null;
        showEmailDetail.value = false;
      }
      
      ElMessage.success('邮件已删除');
    } else {
      ElMessage.error(response.message || '删除失败');
    }
  } catch (error) {
    console.error('删除邮件出错:', error);
    ElMessage.error('删除失败');
  }
};

// 处理添加标签
const handleAddLabel = async (emailId, labelId) => {
  try {
    const response = await updateEmailLabels(emailId, labelId, 'add');
    if (response.success) {
      // 更新选中邮件的标签
      if (selectedEmail.value && selectedEmail.value.emailId === emailId) {
        if (!selectedEmail.value.emailLabels) {
          selectedEmail.value.emailLabels = [];
        }
        if (!selectedEmail.value.emailLabels.includes(labelId)) {
          selectedEmail.value.emailLabels.push(labelId);
        }
      }
      
      // 更新邮件列表中的标签
      const emailIndex = emails.value.findIndex(email => email.emailId === emailId);
      if (emailIndex !== -1) {
        if (!emails.value[emailIndex].emailLabels) {
          emails.value[emailIndex].emailLabels = [];
        }
        if (!emails.value[emailIndex].emailLabels.includes(labelId)) {
          emails.value[emailIndex].emailLabels.push(labelId);
        }
      }
      
      // 更新标签计数
      const labelIndex = labels.value.findIndex(label => label.emailLabelId === labelId);
      if (labelIndex !== -1) {
        labels.value[labelIndex].emailLabelCount++;
      }
      
      ElMessage.success('已添加标签');
    } else {
      ElMessage.error(response.message || '添加标签失败');
    }
  } catch (error) {
    console.error('添加标签出错:', error);
    ElMessage.error('添加标签失败');
  }
};

// 处理移除标签
const handleRemoveLabel = async (emailId, labelId) => {
  try {
    const response = await updateEmailLabels(emailId, labelId, 'remove');
    if (response.success) {
      // 更新选中邮件的标签
      if (selectedEmail.value && selectedEmail.value.emailId === emailId && selectedEmail.value.emailLabels) {
        selectedEmail.value.emailLabels = selectedEmail.value.emailLabels.filter(id => id !== labelId);
      }
      
      // 更新邮件列表中的标签
      const emailIndex = emails.value.findIndex(email => email.emailId === emailId);
      if (emailIndex !== -1 && emails.value[emailIndex].emailLabels) {
        emails.value[emailIndex].emailLabels = emails.value[emailIndex].emailLabels.filter(id => id !== labelId);
      }
      
      // 更新标签计数
      const labelIndex = labels.value.findIndex(label => label.emailLabelId === labelId);
      if (labelIndex !== -1 && labels.value[labelIndex].emailLabelCount > 0) {
        labels.value[labelIndex].emailLabelCount--;
      }
      
      ElMessage.success('已移除标签');
    } else {
      ElMessage.error(response.message || '移除标签失败');
    }
  } catch (error) {
    console.error('移除标签出错:', error);
    ElMessage.error('移除标签失败');
  }
};

// 处理移动到文件夹
const handleMoveToFolder = async (emailId, folderId) => {
  try {
    const response = await moveEmailToFolder(emailId, folderId);
    if (response.success) {
      // 如果不是当前文件夹，从列表中移除
      if (selectedFolderId.value !== folderId) {
        emails.value = emails.value.filter(email => email.emailId !== emailId);
        
        // 如果是当前选中的邮件，清除选中状态
        if (selectedEmail.value && selectedEmail.value.emailId === emailId) {
          selectedEmail.value = null;
          showEmailDetail.value = false;
        }
      }
      
      // 更新文件夹计数
      const oldFolderIndex = folders.value.findIndex(folder => folder.emailFolderId === selectedFolderId.value);
      if (oldFolderIndex !== -1 && folders.value[oldFolderIndex].emailFolderCount > 0) {
        folders.value[oldFolderIndex].emailFolderCount--;
      }
      
      const newFolderIndex = folders.value.findIndex(folder => folder.emailFolderId === folderId);
      if (newFolderIndex !== -1) {
        folders.value[newFolderIndex].emailFolderCount++;
      }
      
      ElMessage.success('邮件已移动');
    } else {
      ElMessage.error(response.message || '移动失败');
    }
  } catch (error) {
    console.error('移动邮件出错:', error);
    ElMessage.error('移动失败');
  }
};

// 处理写邮件
const handleComposeEmail = () => {
  originalEmail.value = null;
  composerMode.value = 'compose';
  showComposer.value = true;
};

// 处理发送邮件
const handleSendEmail = async (emailData) => {
  try {
    const response = await sendEmail(emailData);
    if (response.success) {
      showComposer.value = false;
      ElMessage.success('邮件已发送');
      
      // 如果当前在已发送文件夹，刷新列表
      if (selectedFolderId.value === 'sent') {
        loadEmails();
      }
    } else {
      ElMessage.error(response.message || '发送失败');
    }
  } catch (error) {
    console.error('发送邮件出错:', error);
    ElMessage.error('发送失败');
  }
};

// 处理保存草稿
const handleSaveDraft = async (emailData) => {
  try {
    const response = await saveDraft(emailData);
    if (response.success) {
      showComposer.value = false;
      ElMessage.success('草稿已保存');
      
      // 如果当前在草稿箱，刷新列表
      if (selectedFolderId.value === 'drafts') {
        loadEmails();
      }
    } else {
      ElMessage.error(response.message || '保存失败');
    }
  } catch (error) {
    console.error('保存草稿出错:', error);
    ElMessage.error('保存失败');
  }
};

// 处理关闭编辑器
const handleCloseComposer = () => {
  showComposer.value = false;
};

// 计算布局类
const layoutClass = computed(() => {
  return {
    'email-app--mobile': isMobileView.value,
    'email-app--detail-open': showEmailDetail.value && isMobileView.value
  };
});
</script>

<template>
  <div class="email-app" :class="layoutClass">
    <!-- 侧边栏 -->
    <div class="email-app__sidebar" v-show="!isMobileView || (!showEmailDetail && !showComposer)">
      <EmailSidebar
        :accounts="accounts"
        :folders="folders"
        :labels="labels"
        :selectedAccountId="selectedAccountId"
        :selectedFolderId="selectedFolderId"
        :selectedLabelId="selectedLabelId"
        @select-account="handleSelectAccount"
        @select-folder="handleSelectFolder"
        @select-label="handleSelectLabel"
        @compose-email="handleComposeEmail"
      />
    </div>
    
    <!-- 邮件列表 -->
    <div class="email-app__list" v-show="!showComposer && (!isMobileView || !showEmailDetail)">
      <EmailList
        :emails="emails"
        :labels="labels"
        :loading="loadingEmails"
        :selectedEmailId="selectedEmail?.emailId"
        :totalEmails="totalEmails"
        :currentPage="currentPage"
        :pageSize="pageSize"
        @select-email="handleSelectEmail"
        @star-email="handleStarEmail"
        @mark-important="handleMarkImportant"
        @mark-read="handleMarkRead"
        @page-change="handlePageChange"
        @refresh="handleRefreshEmails"
      />
    </div>
    
    <!-- 邮件详情 -->
    <div class="email-app__detail" v-show="!showComposer && (showEmailDetail || !isMobileView)">
      <EmailDetail
        :email="selectedEmail"
        :labels="labels"
        :loading="loadingEmailDetail"
        @close="handleCloseEmailDetail"
        @reply="handleReplyEmail"
        @reply-all="handleReplyAllEmail"
        @forward="handleForwardEmail"
        @delete="handleDeleteEmail"
        @star="handleStarEmail"
        @mark-important="handleMarkImportant"
        @add-label="handleAddLabel"
        @remove-label="handleRemoveLabel"
        @move-to-folder="handleMoveToFolder"
      />
    </div>
    
    <!-- 邮件编辑器 -->
    <div class="email-app__composer" v-if="showComposer">
      <EmailComposer
        :accounts="accounts"
        :selectedAccountId="selectedAccountId"
        :mode="composerMode"
        :originalEmail="originalEmail"
        @close="handleCloseComposer"
        @send="handleSendEmail"
        @save-draft="handleSaveDraft"
        @discard="handleCloseComposer"
  </div>
</template>

<style lang="scss" scoped>
.email-app {
  display: grid;
  grid-template-columns: 280px 350px 1fr;
  grid-template-rows: 100%;
  height: 100%;
  background-color: var(--el-bg-color);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  
  &__sidebar {
    grid-column: 1;
    grid-row: 1;
    height: 100%;
    overflow: hidden;
    background-color: var(--el-bg-color-overlay);
    border-right: 1px solid var(--el-border-color-lighter);
  }
  
  &__list {
    grid-column: 2;
    grid-row: 1;
    height: 100%;
    overflow: hidden;
    background-color: var(--el-bg-color);
    border-right: 1px solid var(--el-border-color-lighter);
  }
  
  &__detail {
    grid-column: 3;
    grid-row: 1;
    height: 100%;
    overflow: hidden;
    background-color: var(--el-bg-color);
  }
  
  &__composer {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--el-bg-color);
    z-index: 100;
    overflow: hidden;
  }
  
  // 移动端布局
  &--mobile {
    grid-template-columns: 1fr;
    
    .email-app__sidebar,
    .email-app__list,
    .email-app__detail {
      grid-column: 1;
      grid-row: 1;
    }
  }
  
  // 移动端详情页打开时
  &--detail-open {
    .email-app__list,
    .email-app__sidebar {
      display: none;
    }
  }
}

// 响应式调整
@media (max-width: 1200px) {
  .email-app {
    grid-template-columns: 250px 300px 1fr;
  }
}

@media (max-width: 992px) {
  .email-app {
    grid-template-columns: 220px 280px 1fr;
  }
}
</style>
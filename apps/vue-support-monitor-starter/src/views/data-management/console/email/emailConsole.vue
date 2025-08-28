<template>
  <div class="email-console">
    <!-- 顶部工具栏 -->
    <div class="email-header">
      <div class="header-left">
        <IconifyIconOnline icon="ri:mail-line" class="email-icon" />
        <h2 class="email-title">邮箱控制台</h2>
      </div>
      <div class="header-right">
        <el-button type="primary" :icon="useRenderIcon('ri:add-line')" @click="showCompose = true">
          撰写邮件
        </el-button>
        <el-button :icon="useRenderIcon('ri:refresh-line')" @click="refreshEmails">
          刷新
        </el-button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="email-content">
      <!-- 左侧导航栏 -->
      <div class="email-sidebar">
        <div class="sidebar-section">
          <h3 class="section-title">邮箱</h3>
          <div class="folder-list">
            <div 
              v-for="folder in folders" 
              :key="folder.key"
              :class="['folder-item', { active: activeFolder === folder.key }]"
              @click="selectFolder(folder.key)"
            >
              <IconifyIconOnline :icon="folder.icon" class="folder-icon" />
              <span class="folder-name">{{ folder.name }}</span>
              <span v-if="folder.count > 0" class="folder-count">{{ folder.count }}</span>
            </div>
          </div>
        </div>

        <div class="sidebar-section">
          <h3 class="section-title">标签</h3>
          <div class="tag-list">
            <div 
              v-for="tag in tags" 
              :key="tag.key"
              :class="['tag-item', { active: activeTag === tag.key }]"
              @click="selectTag(tag.key)"
            >
              <div :class="['tag-color', tag.color]"></div>
              <span class="tag-name">{{ tag.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间邮件列表 -->
      <div class="email-list">
        <div class="list-header">
          <div class="list-controls">
            <el-checkbox v-model="selectAll" @change="handleSelectAll" />
            <el-button-group class="action-buttons">
              <el-button size="small" :icon="useRenderIcon('ri:delete-bin-line')" @click="deleteSelected">
                删除
              </el-button>
              <el-button size="small" :icon="useRenderIcon('ri:star-line')" @click="starSelected">
                标星
              </el-button>
              <el-button size="small" :icon="useRenderIcon('ri:mail-check-line')" @click="markAsRead">
                标记已读
              </el-button>
            </el-button-group>
          </div>
          <div class="list-search">
            <el-input 
              v-model="searchQuery" 
              placeholder="搜索邮件..." 
              :prefix-icon="useRenderIcon('ri:search-line')"
              clearable
            />
          </div>
        </div>

        <div class="list-content">
          <div 
            v-for="email in filteredEmails" 
            :key="email.id"
            :class="['email-item', { 
              active: selectedEmail?.id === email.id,
              unread: !email.read,
              starred: email.starred
            }]"
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
          <div v-if="filteredEmails.length === 0" class="empty-state">
            <IconifyIconOnline icon="ri:mail-line" class="empty-icon" />
            <p class="empty-text">暂无邮件</p>
          </div>
        </div>
      </div>

      <!-- 右侧邮件详情/撰写区域 -->
      <div class="email-detail">
        <!-- 撰写邮件 -->
        <div v-if="showCompose" class="compose-area">
          <div class="compose-header">
            <h3>撰写邮件</h3>
            <div class="compose-actions">
              <el-button size="small" @click="saveDraft">保存草稿</el-button>
              <el-button type="primary" size="small" @click="sendEmail">发送</el-button>
              <el-button size="small" @click="showCompose = false">关闭</el-button>
            </div>
          </div>
          <div class="compose-form">
            <div class="form-row">
              <label>收件人：</label>
              <el-input v-model="composeForm.to" placeholder="输入收件人邮箱地址，多个用逗号分隔" />
            </div>
            <div class="form-row">
              <label>抄送：</label>
              <el-input v-model="composeForm.cc" placeholder="抄送邮箱地址" />
            </div>
            <div class="form-row">
              <label>主题：</label>
              <el-input v-model="composeForm.subject" placeholder="邮件主题" />
            </div>
            <div class="form-row full">
              <label>内容：</label>
              <CodeEditor 
                v-model:content="composeForm.content" 
                :height="'300px'" 
                :options="{ mode: 'markdown' }" 
                :showTool="true" 
              />
            </div>
          </div>
        </div>

        <!-- 邮件详情 -->
        <div v-else-if="selectedEmail" class="detail-area">
          <div class="detail-header">
            <div class="detail-subject">{{ selectedEmail.subject }}</div>
            <div class="detail-actions">
              <el-button size="small" :icon="useRenderIcon('ri:reply-line')" @click="replyEmail">
                回复
              </el-button>
              <el-button size="small" :icon="useRenderIcon('ri:reply-all-line')" @click="replyAllEmail">
                全部回复
              </el-button>
              <el-button size="small" :icon="useRenderIcon('ri:share-forward-line')" @click="forwardEmail">
                转发
              </el-button>
              <el-button size="small" :icon="useRenderIcon('ri:delete-bin-line')" @click="deleteEmail">
                删除
              </el-button>
            </div>
          </div>
          <div class="detail-info">
            <div class="sender-info">
              <div class="sender-avatar large">
                <IconifyIconOnline icon="ri:user-line" />
              </div>
              <div class="sender-details">
                <div class="sender-name">{{ selectedEmail.sender }}</div>
                <div class="sender-email">{{ selectedEmail.senderEmail }}</div>
                <div class="email-time">{{ formatFullTime(selectedEmail.time) }}</div>
              </div>
            </div>
          </div>
          <div class="detail-content">
            <div class="email-body" v-html="selectedEmail.content"></div>
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
    </div>

    <!-- 发送状态提示 -->
    <el-alert v-if="status" :title="status" :type="statusType" show-icon class="status-alert" />
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import CodeEditor from "@/components/codeEditor/index.vue";
import { executeConsole } from "@/api/system-data";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";

const props = defineProps<{ id: number }>();

// 界面状态
const showCompose = ref(false);
const activeFolder = ref('inbox');
const activeTag = ref('');
const selectedEmail = ref(null);
const selectAll = ref(false);
const searchQuery = ref('');
const status = ref('');
const statusType = ref('success');

// 撰写邮件表单
const composeForm = ref({
  to: '',
  cc: '',
  subject: '',
  content: ''
});

// 邮箱文件夹
const folders = ref([
  { key: 'inbox', name: '收件箱', icon: 'ri:inbox-line', count: 5 },
  { key: 'sent', name: '已发送', icon: 'ri:send-plane-line', count: 0 },
  { key: 'drafts', name: '草稿箱', icon: 'ri:draft-line', count: 2 },
  { key: 'trash', name: '垃圾箱', icon: 'ri:delete-bin-line', count: 0 },
  { key: 'spam', name: '垃圾邮件', icon: 'ri:spam-line', count: 0 }
]);

// 邮件标签
const tags = ref([
  { key: 'important', name: '重要', color: 'red' },
  { key: 'work', name: '工作', color: 'blue' },
  { key: 'personal', name: '个人', color: 'green' },
  { key: 'finance', name: '财务', color: 'orange' }
]);

// 模拟邮件数据
const emails = ref([
  {
    id: 1,
    sender: '系统管理员',
    senderEmail: 'admin@system.com',
    subject: '系统维护通知',
    preview: '系统将于今晚进行例行维护，预计维护时间为2小时...',
    content: '<p>尊敬的用户：</p><p>系统将于今晚22:00-24:00进行例行维护，期间可能影响部分功能使用。</p><p>感谢您的理解与支持。</p>',
    time: new Date(Date.now() - 1000 * 60 * 30), // 30分钟前
    read: false,
    starred: true,
    selected: false,
    hasAttachment: false,
    folder: 'inbox',
    tags: ['important']
  },
  {
    id: 2,
    sender: '数据库监控',
    senderEmail: 'monitor@db.com',
    subject: '数据库连接异常告警',
    preview: '检测到数据库连接异常，请及时处理...',
    content: '<p>告警详情：</p><ul><li>数据库：MySQL-Production</li><li>异常时间：2024-01-15 14:30:25</li><li>异常类型：连接超时</li></ul>',
    time: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2小时前
    read: true,
    starred: false,
    selected: false,
    hasAttachment: true,
    folder: 'inbox',
    tags: ['work']
  },
  {
    id: 3,
    sender: '备份服务',
    senderEmail: 'backup@service.com',
    subject: '每日备份报告',
    preview: '今日备份任务已完成，备份文件大小：2.3GB...',
    content: '<p>备份报告：</p><p>备份时间：2024-01-15 03:00:00</p><p>备份状态：成功</p><p>备份大小：2.3GB</p>',
    time: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8小时前
    read: true,
    starred: false,
    selected: false,
    hasAttachment: false,
    folder: 'inbox',
    tags: []
  },
  {
    id: 4,
    sender: '安全中心',
    senderEmail: 'security@center.com',
    subject: '登录异常提醒',
    preview: '检测到异常登录行为，IP地址：192.168.1.100...',
    content: '<p>安全提醒：</p><p>检测到来自IP 192.168.1.100的异常登录尝试。</p><p>如非本人操作，请立即修改密码。</p>',
    time: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1天前
    read: false,
    starred: false,
    selected: false,
    hasAttachment: false,
    folder: 'inbox',
    tags: ['important']
  },
  {
    id: 5,
    sender: '性能监控',
    senderEmail: 'performance@monitor.com',
    subject: 'CPU使用率告警',
    preview: '服务器CPU使用率持续超过80%，请关注...',
    content: '<p>性能告警：</p><p>服务器：Web-Server-01</p><p>CPU使用率：85%</p><p>持续时间：15分钟</p>',
    time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2天前
    read: true,
    starred: true,
    selected: false,
    hasAttachment: false,
    folder: 'inbox',
    tags: ['work']
  }
]);

// 过滤邮件
const filteredEmails = computed(() => {
  let result = emails.value.filter(email => {
    // 按文件夹过滤
    if (activeFolder.value && email.folder !== activeFolder.value) {
      return false;
    }
    
    // 按标签过滤
    if (activeTag.value && !email.tags.includes(activeTag.value)) {
      return false;
    }
    
    // 按搜索关键词过滤
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      return email.subject.toLowerCase().includes(query) || 
             email.sender.toLowerCase().includes(query) ||
             email.preview.toLowerCase().includes(query);
    }
    
    return true;
  });
  
  // 按时间排序，最新的在前
  return result.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
});

// 方法
function selectFolder(folderKey: string) {
  activeFolder.value = folderKey;
  activeTag.value = '';
  selectedEmail.value = null;
}

function selectTag(tagKey: string) {
  activeTag.value = activeTag.value === tagKey ? '' : tagKey;
  selectedEmail.value = null;
}

function selectEmail(email: any) {
  selectedEmail.value = email;
  if (!email.read) {
    email.read = true;
    updateFolderCount();
  }
}

function toggleStar(email: any) {
  email.starred = !email.starred;
}

function handleSelectAll() {
  filteredEmails.value.forEach(email => {
    email.selected = selectAll.value;
  });
}

function deleteSelected() {
  const selectedEmails = filteredEmails.value.filter(email => email.selected);
  if (selectedEmails.length === 0) {
    ElMessage.warning('请先选择要删除的邮件');
    return;
  }
  
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedEmails.length} 封邮件吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    selectedEmails.forEach(email => {
      const index = emails.value.findIndex(e => e.id === email.id);
      if (index > -1) {
        emails.value.splice(index, 1);
      }
    });
    selectAll.value = false;
    selectedEmail.value = null;
    ElMessage.success('删除成功');
    updateFolderCount();
  });
}

function starSelected() {
  const selectedEmails = filteredEmails.value.filter(email => email.selected);
  if (selectedEmails.length === 0) {
    ElMessage.warning('请先选择要标星的邮件');
    return;
  }
  
  selectedEmails.forEach(email => {
    email.starred = true;
  });
  ElMessage.success('标星成功');
}

function markAsRead() {
  const selectedEmails = filteredEmails.value.filter(email => email.selected);
  if (selectedEmails.length === 0) {
    ElMessage.warning('请先选择要标记的邮件');
    return;
  }
  
  selectedEmails.forEach(email => {
    email.read = true;
  });
  updateFolderCount();
  ElMessage.success('标记成功');
}

function refreshEmails() {
  ElMessage.success('邮件列表已刷新');
  updateFolderCount();
}

function updateFolderCount() {
  folders.value.forEach(folder => {
    if (folder.key === 'inbox') {
      folder.count = emails.value.filter(email => email.folder === 'inbox' && !email.read).length;
    }
  });
}

function replyEmail() {
  if (!selectedEmail.value) return;
  
  composeForm.value = {
    to: selectedEmail.value.senderEmail,
    cc: '',
    subject: `Re: ${selectedEmail.value.subject}`,
    content: `\n\n--- 原始邮件 ---\n发件人: ${selectedEmail.value.sender}\n时间: ${formatFullTime(selectedEmail.value.time)}\n主题: ${selectedEmail.value.subject}\n\n${selectedEmail.value.content.replace(/<[^>]*>/g, '')}`
  };
  showCompose.value = true;
}

function replyAllEmail() {
  replyEmail(); // 简化实现，实际应该包含所有收件人
}

function forwardEmail() {
  if (!selectedEmail.value) return;
  
  composeForm.value = {
    to: '',
    cc: '',
    subject: `Fwd: ${selectedEmail.value.subject}`,
    content: `\n\n--- 转发邮件 ---\n发件人: ${selectedEmail.value.sender}\n时间: ${formatFullTime(selectedEmail.value.time)}\n主题: ${selectedEmail.value.subject}\n\n${selectedEmail.value.content.replace(/<[^>]*>/g, '')}`
  };
  showCompose.value = true;
}

function deleteEmail() {
  if (!selectedEmail.value) return;
  
  ElMessageBox.confirm(
    '确定要删除这封邮件吗？',
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = emails.value.findIndex(e => e.id === selectedEmail.value.id);
    if (index > -1) {
      emails.value.splice(index, 1);
    }
    selectedEmail.value = null;
    ElMessage.success('删除成功');
    updateFolderCount();
  });
}

async function sendEmail() {
  if (!composeForm.value.to || !composeForm.value.subject) {
    ElMessage.warning('请填写收件人和主题');
    return;
  }
  
  try {
    const cmd = JSON.stringify({
      to: composeForm.value.to,
      cc: composeForm.value.cc,
      subject: composeForm.value.subject,
      content: composeForm.value.content
    });
    
    const res = await executeConsole(props.id, cmd, "email");
    
    if (res?.data?.success) {
      status.value = "邮件发送成功";
      statusType.value = "success";
      showCompose.value = false;
      composeForm.value = { to: '', cc: '', subject: '', content: '' };
      ElMessage.success('邮件发送成功');
    } else {
      status.value = res?.data?.msg || "邮件发送失败";
      statusType.value = "error";
      ElMessage.error(status.value);
    }
  } catch (error) {
    status.value = "邮件发送失败";
    statusType.value = "error";
    ElMessage.error('邮件发送失败');
  }
  
  // 清除状态提示
  setTimeout(() => {
    status.value = '';
  }, 5000);
}

function saveDraft() {
  ElMessage.success('草稿已保存');
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

function formatFullTime(time: Date) {
  return time.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

onMounted(() => {
  updateFolderCount();
});
</script>
<style scoped>
.email-console {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

/* 顶部工具栏 */
.email-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.email-icon {
  font-size: 24px;
  color: #409eff;
}

.email-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.header-right {
  display: flex;
  gap: 12px;
}

/* 主要内容区域 */
.email-content {
  flex: 1;
  display: flex;
  min-height: 0;
}

/* 左侧导航栏 */
.email-sidebar {
  width: 240px;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  padding: 16px 0;
  overflow-y: auto;
}

.sidebar-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  margin: 0 0 12px 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.folder-list, .tag-list {
  padding: 0 8px;
}

.folder-item, .tag-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin: 2px 0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.folder-item:hover, .tag-item:hover {
  background: #f0f9ff;
}

.folder-item.active, .tag-item.active {
  background: #409eff;
  color: #fff;
}

.folder-icon {
  font-size: 16px;
  margin-right: 8px;
  color: #909399;
}

.folder-item.active .folder-icon {
  color: #fff;
}

.folder-name, .tag-name {
  flex: 1;
}

.folder-count {
  background: #f56c6c;
  color: #fff;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.folder-item.active .folder-count {
  background: rgba(255, 255, 255, 0.3);
}

.tag-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
}

.tag-color.red { background: #f56c6c; }
.tag-color.blue { background: #409eff; }
.tag-color.green { background: #67c23a; }
.tag-color.orange { background: #e6a23c; }

/* 中间邮件列表 */
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
  content: '';
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

.sender-avatar.large {
  width: 48px;
  height: 48px;
  font-size: 20px;
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

/* 右侧详情区域 */
.email-detail {
  flex: 1;
  background: #fff;
  display: flex;
  flex-direction: column;
}

/* 撰写邮件区域 */
.compose-area {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.compose-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e4e7ed;
  background: #fafafa;
}

.compose-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.compose-actions {
  display: flex;
  gap: 8px;
}

.compose-form {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.form-row {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.form-row.full {
  flex-direction: column;
  align-items: stretch;
}

.form-row label {
  width: 80px;
  font-size: 14px;
  color: #606266;
  margin-right: 12px;
  flex-shrink: 0;
}

.form-row.full label {
  width: auto;
  margin-bottom: 8px;
  margin-right: 0;
}

.form-row :deep(.el-input) {
  flex: 1;
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

/* 状态提示 */
.status-alert {
  position: fixed;
  top: 80px;
  right: 24px;
  z-index: 1000;
  max-width: 400px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .email-sidebar {
    width: 200px;
  }
  
  .email-list {
    width: 350px;
  }
}

@media (max-width: 768px) {
  .email-content {
    flex-direction: column;
  }
  
  .email-sidebar {
    width: 100%;
    height: 200px;
  }
  
  .email-list {
    width: 100%;
    height: 300px;
  }
  
  .email-detail {
    height: auto;
    min-height: 400px;
  }
}

/* 滚动条样式 */
.email-sidebar::-webkit-scrollbar,
.list-content::-webkit-scrollbar,
.detail-content::-webkit-scrollbar,
.compose-form::-webkit-scrollbar {
  width: 6px;
}

.email-sidebar::-webkit-scrollbar-track,
.list-content::-webkit-scrollbar-track,
.detail-content::-webkit-scrollbar-track,
.compose-form::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.email-sidebar::-webkit-scrollbar-thumb,
.list-content::-webkit-scrollbar-thumb,
.detail-content::-webkit-scrollbar-thumb,
.compose-form::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.email-sidebar::-webkit-scrollbar-thumb:hover,
.list-content::-webkit-scrollbar-thumb:hover,
.detail-content::-webkit-scrollbar-thumb:hover,
.compose-form::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>

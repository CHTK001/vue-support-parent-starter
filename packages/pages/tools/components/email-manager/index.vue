<template>
  <div class="email-manager">
    <!-- 页面头部 -->
    <div class="email-manager__header">
      <div class="email-manager__header-content">
        <h1 class="email-manager__title">邮件管家</h1>
        <p class="email-manager__subtitle">统一管理和发送您的邮件</p>
      </div>
      <div class="email-manager__actions">
        <el-button type="primary" @click="openComposeDialog" :icon="useRenderIcon('ri:mail-add-line')"> 新建邮件 </el-button>
        <el-button @click="openSettingsDialog" :icon="useRenderIcon('ri:settings-3-line')"> 邮箱设置 </el-button>
      </div>
    </div>

    <!-- 主体内容区 -->
    <el-container class="email-manager__container">
      <!-- 左侧边栏 -->
      <el-aside width="220px" class="email-manager__sidebar">
        <email-sidebar :folders="folders" :active-folder="activeFolder" @folder-change="handleFolderChange" />
      </el-aside>

      <!-- 主内容区 -->
      <el-main class="email-manager__main">
        <el-tabs v-model="activeTab" class="email-manager__tabs">
          <el-tab-pane label="邮件列表" name="list">
            <email-list :emails="filteredEmails" :loading="loading.emails" :search-query="searchQuery" @view-email="viewEmail" @delete-email="deleteEmail" @star-email="toggleStarEmail" />
          </el-tab-pane>
          <el-tab-pane label="邮件详情" name="detail" v-if="currentEmail">
            <email-detail :email="currentEmail" @reply="replyEmail" @forward="forwardEmail" @delete="deleteEmail" @back-to-list="activeTab = 'list'" />
          </el-tab-pane>
        </el-tabs>
      </el-main>
    </el-container>

    <!-- 撰写邮件对话框 -->
    <email-compose-dialog v-model:visible="dialogs.compose" :reply-to="replyToEmail" :forward="forwardEmail" @send-success="handleSendSuccess" />

    <!-- 邮箱设置对话框 -->
    <email-settings-dialog v-model:visible="dialogs.settings" @save-success="loadEmailAccounts" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { message } from "@repo/utils";
import { fetchEmailList, deleteEmail as apiDeleteEmail } from "@/api/email";

// 导入组件
import EmailSidebar from "./components/email-manager/EmailSidebar.vue";
import EmailList from "./components/email-manager/EmailList.vue";
import EmailDetail from "./components/email-manager/EmailDetail.vue";
import EmailComposeDialog from "./components/email-manager/EmailComposeDialog.vue";
import EmailSettingsDialog from "./components/email-manager/EmailSettingsDialog.vue";

// 状态管理
const activeTab = ref("list");
const activeFolder = ref("inbox");
const searchQuery = ref("");
const currentEmail = ref(null);
const replyToEmail = ref(null);
const forwardEmailValue = ref(null);
const emails = ref([]);

// 加载状态
const loading = reactive({
  emails: false,
  send: false,
  delete: false,
});

// 对话框状态
const dialogs = reactive({
  compose: false,
  settings: false,
});

// 文件夹列表
const folders = reactive([
  { id: "inbox", name: "收件箱", icon: "ri:inbox-line", count: 0 },
  { id: "sent", name: "已发送", icon: "ri:send-plane-line", count: 0 },
  { id: "drafts", name: "草稿箱", icon: "ri:draft-line", count: 0 },
  { id: "starred", name: "已加星标", icon: "ri:star-line", count: 0 },
  { id: "trash", name: "垃圾箱", icon: "ri:delete-bin-line", count: 0 },
]);

// 过滤后的邮件列表
const filteredEmails = computed(() => {
  let result = emails.value;

  // 根据文件夹过滤
  if (activeFolder.value === "inbox") {
    result = result.filter((email) => !email.deleted && email.folder === "inbox");
  } else if (activeFolder.value === "sent") {
    result = result.filter((email) => !email.deleted && email.folder === "sent");
  } else if (activeFolder.value === "drafts") {
    result = result.filter((email) => !email.deleted && email.draft);
  } else if (activeFolder.value === "starred") {
    result = result.filter((email) => !email.deleted && email.starred);
  } else if (activeFolder.value === "trash") {
    result = result.filter((email) => email.deleted);
  }

  // 根据搜索关键词过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter((email) => email.subject.toLowerCase().includes(query) || email.from.toLowerCase().includes(query) || email.to.toLowerCase().includes(query) || (email.content && email.content.toLowerCase().includes(query)));
  }

  return result;
});

// 更新文件夹计数
const updateFolderCounts = () => {
  folders.forEach((folder) => {
    if (folder.id === "inbox") {
      folder.count = emails.value.filter((e) => !e.deleted && e.folder === "inbox" && !e.read).length;
    } else if (folder.id === "sent") {
      folder.count = emails.value.filter((e) => !e.deleted && e.folder === "sent").length;
    } else if (folder.id === "drafts") {
      folder.count = emails.value.filter((e) => !e.deleted && e.draft).length;
    } else if (folder.id === "starred") {
      folder.count = emails.value.filter((e) => !e.deleted && e.starred).length;
    } else if (folder.id === "trash") {
      folder.count = emails.value.filter((e) => e.deleted).length;
    }
  });
};

// 加载邮件列表
const loadEmails = async () => {
  loading.emails = true;
  try {
    const response = await fetchEmailList();
    if (response.code === "00000") {
      emails.value = response.data || [];
      updateFolderCounts();
    } else {
      message(response.msg || "加载邮件失败", { type: "error" });
    }
  } catch (error) {
    console.error("加载邮件失败:", error);
    message("加载邮件失败: " + (error.message || "未知错误"), { type: "error" });
  } finally {
    loading.emails = false;
  }
};

// 加载邮箱账户
const loadEmailAccounts = async () => {
  // 这里可以加载用户配置的邮箱账户
  // 暂时使用模拟数据
};

// 处理文件夹切换
const handleFolderChange = (folderId) => {
  activeFolder.value = folderId;
  activeTab.value = "list";
  currentEmail.value = null;
};

// 查看邮件详情
const viewEmail = (email) => {
  currentEmail.value = email;
  activeTab.value = "detail";

  // 标记为已读
  if (!email.read) {
    email.read = true;
    updateFolderCounts();
    // 这里可以调用API更新已读状态
  }
};

// 删除邮件
const deleteEmail = async (email) => {
  loading.delete = true;
  try {
    // 调用删除API
    const response = await apiDeleteEmail(email.id);
    if (response.code === "00000") {
      if (activeFolder.value === "trash") {
        // 从垃圾箱删除是永久删除
        emails.value = emails.value.filter((e) => e.id !== email.id);
      } else {
        // 其他文件夹删除是移动到垃圾箱
        const targetEmail = emails.value.find((e) => e.id === email.id);
        if (targetEmail) {
          targetEmail.deleted = true;
        }
      }

      updateFolderCounts();
      message("邮件已删除", { type: "success" });

      // 如果当前正在查看被删除的邮件，返回列表
      if (currentEmail.value && currentEmail.value.id === email.id) {
        activeTab.value = "list";
        currentEmail.value = null;
      }
    } else {
      message(response.msg || "删除邮件失败", { type: "error" });
    }
  } catch (error) {
    console.error("删除邮件失败:", error);
    message("删除邮件失败: " + (error.message || "未知错误"), { type: "error" });
  } finally {
    loading.delete = false;
  }
};

// 切换星标状态
const toggleStarEmail = (email) => {
  email.starred = !email.starred;
  updateFolderCounts();
  // 这里可以调用API更新星标状态
};

// 回复邮件
const replyEmail = (email) => {
  replyToEmail.value = email;
  forwardEmailValue.value = null;
  dialogs.compose = true;
};

// 转发邮件
const forwardEmail = (email) => {
  forwardEmailValue.value = email;
  replyToEmail.value = null;
  dialogs.compose = true;
};

// 打开撰写邮件对话框
const openComposeDialog = () => {
  replyToEmail.value = null;
  forwardEmailValue.value = null;
  dialogs.compose = true;
};

// 打开设置对话框
const openSettingsDialog = () => {
  dialogs.settings = true;
};

// 发送邮件成功处理
const handleSendSuccess = (sentEmail) => {
  // 添加到已发送文件夹
  emails.value.unshift({
    ...sentEmail,
    id: Date.now(),
    folder: "sent",
    read: true,
    starred: false,
    deleted: false,
    draft: false,
    date: new Date().toISOString(),
  });

  updateFolderCounts();
  message("邮件发送成功", { type: "success" });
};

// 初始化
onMounted(() => {
  loadEmails();
  loadEmailAccounts();
});
</script>

<style lang="scss" scoped>
.email-manager {
  display: flex;
  flex-direction: column;
  height: 100%;

  &__header {
    background: linear-gradient(135deg, #4b6cb7 0%, #182848 100%);
    color: white;
    padding: 20px 30px;
    border-radius: 8px;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &__title {
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 5px 0;
  }

  &__subtitle {
    font-size: 14px;
    margin: 0;
    opacity: 0.8;
  }

  &__container {
    flex: 1;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    background-color: white;
  }

  &__sidebar {
    border-right: 1px solid #ebeef5;
    background-color: #f8f9fa;
  }

  &__main {
    padding: 0;
  }

  &__tabs {
    height: 100%;

    :deep(.el-tabs__content) {
      height: calc(100% - 55px);
      padding: 20px;
    }

    :deep(.el-tab-pane) {
      height: 100%;
    }
  }

  &__actions {
    display: flex;
    gap: 10px;
  }
}
</style>

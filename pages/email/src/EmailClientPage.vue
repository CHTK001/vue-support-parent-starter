<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import EmailSidebar from "./components/EmailSidebar.vue";
import EmailList from "./components/EmailList.vue";
import EmailDetail from "./components/EmailDetail.vue";
import EmailComposer from "./components/EmailComposer.vue";
import {
  fetchEmailAccounts,
  fetchEmailFolders,
  fetchEmailLabels,
  searchEmails,
  fetchEmailDetail,
  markEmailStatus,
  moveEmailToFolder,
  updateEmailLabels,
  sendEmail,
  saveDraft,
  deleteEmail,
} from "./api/index";
import type { EmailAccount, EmailFolder, EmailLabel, EmailInfo } from "./types";

// ===== 数据状态 =====
const accounts = ref<EmailAccount[]>([]);
const folders = ref<EmailFolder[]>([]);
const labels = ref<EmailLabel[]>([]);
const emails = ref<EmailInfo[]>([]);
const totalEmails = ref(0);
const currentPage = ref(1);
const pageSize = 20;

const selectedAccountId = ref("");
const selectedFolderId = ref("inbox");
const selectedLabelId = ref("");
const selectedEmailId = ref("");
const selectedEmail = ref<EmailInfo | null>(null);
const emailLoading = ref(false);
const detailLoading = ref(false);
const listLoading = ref(false);

// 写信模式
const composerMode = ref<"compose" | "reply" | "replyAll" | "forward" | null>(null);
const composerOriginalEmail = ref<EmailInfo | null>(null);

// ===== 计算属性 =====
const selectedAccount = computed(() =>
  accounts.value.find((a) => a.emailAccountId === selectedAccountId.value) || null
);

// ===== 初始化 =====
async function loadAccounts() {
  try {
    const res = await fetchEmailAccounts();
    if (res.success && res.data) {
      accounts.value = res.data;
      if (!selectedAccountId.value && accounts.value.length) {
        selectedAccountId.value = accounts.value[0].emailAccountId;
      }
    }
  } catch (e) {
    console.error(e);
  }
}

async function loadFolders() {
  try {
    const res = await fetchEmailFolders();
    if (res.success && res.data) folders.value = res.data;
  } catch (e) {
    console.error(e);
  }
}

async function loadLabels() {
  try {
    const res = await fetchEmailLabels();
    if (res.success && res.data) labels.value = res.data;
  } catch (e) {
    console.error(e);
  }
}

async function loadEmails() {
  listLoading.value = true;
  try {
    const res = await searchEmails({
      accountId: selectedAccountId.value || undefined,
      folderId: selectedFolderId.value || undefined,
      labelId: selectedLabelId.value || undefined,
      page: currentPage.value,
      pageSize,
    });
    if (res.success && res.data) {
      emails.value = res.data.data;
      totalEmails.value = res.data.total;
    }
  } catch (e) {
    console.error(e);
  } finally {
    listLoading.value = false;
  }
}

async function loadEmailDetail(emailId: string) {
  detailLoading.value = true;
  try {
    const res = await fetchEmailDetail(emailId);
    if (res.success && res.data) {
      selectedEmail.value = res.data;
    }
  } catch (e) {
    console.error(e);
  } finally {
    detailLoading.value = false;
  }
}

// ===== 事件处理 =====
function handleSelectAccount(accountId: string) {
  selectedAccountId.value = accountId;
  selectedEmailId.value = "";
  selectedEmail.value = null;
  currentPage.value = 1;
  loadEmails();
}

function handleSelectFolder(folderId: string) {
  selectedFolderId.value = folderId;
  selectedLabelId.value = "";
  selectedEmailId.value = "";
  selectedEmail.value = null;
  currentPage.value = 1;
  loadEmails();
}

function handleSelectLabel(labelId: string) {
  selectedLabelId.value = labelId;
  selectedFolderId.value = "";
  selectedEmailId.value = "";
  selectedEmail.value = null;
  currentPage.value = 1;
  loadEmails();
}

function handleSelectEmail(emailId: string) {
  selectedEmailId.value = emailId;
  composerMode.value = null;
  loadEmailDetail(emailId);
}

async function handleStarEmail(emailId: string, isStarred: boolean) {
  try {
    await markEmailStatus(emailId, { isStarred });
    loadEmails();
    if (selectedEmail.value?.emailId === emailId) {
      selectedEmail.value.emailIsStarred = isStarred;
    }
  } catch (e) {
    console.error(e);
  }
}

async function handleMarkImportant(emailId: string, isImportant: boolean) {
  try {
    await markEmailStatus(emailId, { isImportant });
    loadEmails();
    if (selectedEmail.value?.emailId === emailId) {
      selectedEmail.value.emailIsImportant = isImportant;
    }
  } catch (e) {
    console.error(e);
  }
}

async function handleMarkRead(emailId: string, isRead: boolean) {
  try {
    await markEmailStatus(emailId, { isRead });
    loadEmails();
  } catch (e) {
    console.error(e);
  }
}

function handlePageChange(page: number) {
  currentPage.value = page;
  loadEmails();
}

function handleRefresh() {
  loadEmails();
}

function handleCloseDetail() {
  selectedEmailId.value = "";
  selectedEmail.value = null;
}

function handleReply(email: EmailInfo) {
  composerMode.value = "reply";
  composerOriginalEmail.value = email;
}

function handleReplyAll(email: EmailInfo) {
  composerMode.value = "replyAll";
  composerOriginalEmail.value = email;
}

function handleForward(email: EmailInfo) {
  composerMode.value = "forward";
  composerOriginalEmail.value = email;
}

async function handleDeleteEmail(emailId: string) {
  try {
    await deleteEmail(emailId);
    ElMessage.success("邮件已删除");
    if (selectedEmailId.value === emailId) {
      selectedEmailId.value = "";
      selectedEmail.value = null;
    }
    loadEmails();
  } catch (e) {
    console.error(e);
    ElMessage.error("删除失败");
  }
}

async function handleAddLabel(emailId: string, labelId: string) {
  try {
    await updateEmailLabels(emailId, labelId, "add");
    loadEmails();
    if (selectedEmail.value?.emailId === emailId) {
      if (!selectedEmail.value.emailLabels) selectedEmail.value.emailLabels = [];
      if (!selectedEmail.value.emailLabels.includes(labelId)) {
        selectedEmail.value.emailLabels.push(labelId);
      }
    }
  } catch (e) {
    console.error(e);
  }
}

async function handleRemoveLabel(emailId: string, labelId: string) {
  try {
    await updateEmailLabels(emailId, labelId, "remove");
    loadEmails();
    if (selectedEmail.value?.emailId === emailId && selectedEmail.value.emailLabels) {
      selectedEmail.value.emailLabels = selectedEmail.value.emailLabels.filter((id) => id !== labelId);
    }
  } catch (e) {
    console.error(e);
  }
}

async function handleMoveToFolder(emailId: string, folderId: string) {
  try {
    await moveEmailToFolder(emailId, folderId);
    ElMessage.success("已移动");
    loadEmails();
  } catch (e) {
    console.error(e);
  }
}

function handleComposeEmail() {
  composerMode.value = "compose";
  composerOriginalEmail.value = null;
}

async function handleSendEmail(formData: any) {
  try {
    const res = await sendEmail(formData);
    if (res.success) {
      ElMessage.success("邮件已发送");
      composerMode.value = null;
      loadEmails();
    } else {
      ElMessage.error(res.message || "发送失败");
    }
  } catch (e) {
    console.error(e);
    ElMessage.error("发送失败");
  }
}

async function handleSaveDraft(formData: any) {
  try {
    const res = await saveDraft(formData);
    if (res.success) {
      ElMessage.success("草稿已保存");
      composerMode.value = null;
    } else {
      ElMessage.error(res.message || "保存失败");
    }
  } catch (e) {
    console.error(e);
  }
}

function handleDiscard() {
  composerMode.value = null;
}

function handleCloseComposer() {
  composerMode.value = null;
}

onMounted(async () => {
  await Promise.all([loadAccounts(), loadFolders(), loadLabels()]);
  await loadEmails();
});
</script>

<template>
  <div class="email-client">
    <!-- 侧边栏 -->
    <aside class="email-client__sidebar">
      <EmailSidebar
        :accounts="accounts"
        :folders="folders"
        :labels="labels"
        :selected-account-id="selectedAccountId"
        :selected-folder-id="selectedFolderId"
        :selected-label-id="selectedLabelId"
        @select-account="handleSelectAccount"
        @select-folder="handleSelectFolder"
        @select-label="handleSelectLabel"
        @compose-email="handleComposeEmail"
      />
    </aside>

    <!-- 邮件列表 -->
    <main class="email-client__list">
      <EmailList
        :emails="emails"
        :labels="labels"
        :loading="listLoading"
        :selected-email-id="selectedEmailId"
        :total-emails="totalEmails"
        :current-page="currentPage"
        :page-size="pageSize"
        @select-email="handleSelectEmail"
        @star-email="handleStarEmail"
        @mark-important="handleMarkImportant"
        @mark-read="handleMarkRead"
        @page-change="handlePageChange"
        @refresh="handleRefresh"
      />
    </main>

    <!-- 右侧：详情或写信 -->
    <section class="email-client__detail">
      <EmailDetail
        v-if="!composerMode"
        :email="selectedEmail"
        :labels="labels"
        :loading="detailLoading"
        @close="handleCloseDetail"
        @reply="handleReply"
        @reply-all="handleReplyAll"
        @forward="handleForward"
        @delete="handleDeleteEmail"
        @star="(id, v) => handleStarEmail(id, v)"
        @mark-important="(id, v) => handleMarkImportant(id, v)"
        @add-label="handleAddLabel"
        @remove-label="handleRemoveLabel"
        @move-to-folder="handleMoveToFolder"
      />
      <EmailComposer
        v-else
        :accounts="accounts"
        :selected-account-id="selectedAccountId"
        :mode="composerMode"
        :original-email="composerOriginalEmail"
        @close="handleCloseComposer"
        @send="handleSendEmail"
        @save-draft="handleSaveDraft"
        @discard="handleDiscard"
      />
    </section>
  </div>
</template>

<style scoped>
.email-client {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr) minmax(0, 1.2fr);
  height: calc(100vh - 120px);
  min-height: 600px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, .04);
}

.email-client__sidebar {
  border-right: 1px solid var(--el-border-color-light);
  overflow-y: auto;
}

.email-client__list {
  border-right: 1px solid var(--el-border-color-light);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.email-client__detail {
  overflow-y: auto;
}

@media (max-width: 1200px) {
  .email-client {
    grid-template-columns: 220px minmax(0, 1fr) minmax(0, 1fr);
  }
}

@media (max-width: 900px) {
  .email-client {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
    height: auto;
  }
  .email-client__sidebar {
    border-right: none;
    border-bottom: 1px solid var(--el-border-color-light);
    max-height: 200px;
  }
  .email-client__list {
    border-right: none;
    max-height: 400px;
  }
}
</style>
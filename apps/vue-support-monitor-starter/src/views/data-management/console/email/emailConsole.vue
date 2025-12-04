<template>
  <div class="email-console">
    <!-- 顶部工具�?-->
    <EmailHeader
      :setting-id="props.id"
      @compose="handleCompose"
      @cloud-sync="handleCloudSync"
      @cloud-backup="handleCloudBackup"
      @menu-cleared="handleMenuCleared"
      @cache-cleared="handleCacheCleared"
    />

    <!-- 主要内容区域 -->
    <div class="email-content">
      <!-- 左侧导航�?-->
      <EmailSidebar
        ref="sidebarRef"
        :setting-id="props.id"
        :folders="folders"
        :tags="tags"
        :active-folder="activeFolder"
        :active-tag="activeTag"
        @folder-select="selectFolder"
        @tag-select="selectTag"
        @menu-loaded="handleMenuLoaded"
      />

      <!-- 中间邮件列表 @ts-ignore -->
      <EmailList
        ref="emailListRef"
        :emails="filteredEmails"
        :selected-email-id="selectedEmail?.id"
        :loading="loading"
        :loading-more="loadingMore"
        :has-more="hasMore"
        @email-select="selectEmail"
        @email-star="toggleStar"
        @emails-delete="deleteSelected"
        @emails-star="starSelected"
        @emails-mark-read="markAsRead"
        @search="handleSearch"
        @load-more="loadMoreEmails"
      />

      <!-- 右侧邮件详情/撰写区域 -->
      <div class="email-detail">
        <!-- 撰写邮件 -->
        <EmailCompose
          v-if="showCompose"
          ref="composeRef"
          :initial-form="composeForm"
          @send="sendEmail"
          @save-draft="saveDraft"
          @close="handleComposeClose"
        />

        <!-- 邮件详情 -->
        <EmailDetail
          v-else
          :email="selectedEmail"
          @reply="replyEmail"
          @reply-all="replyAllEmail"
          @forward="forwardEmail"
          @delete="deleteEmail"
        />
      </div>
    </div>

    <!-- 发送状态提�?-->
    <el-alert
      v-if="status"
      :title="status"
      :type="statusType"
      show-icon
      class="status-alert"
    />
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, inject } from "vue";
import CodeEditor from "@/components/codeEditor/index.vue";
import { executeConsole, getConsoleRoot } from "@/api/data-management/system-data";
import { socket } from "@repo/core";
import { getConfig } from "@repo/config";
import { splitToArray } from "@repo/utils";
import {
  fetchEmails,
  getEmailHistory,
  syncEmails,
  updateEmailStatus,
  backupEmail,
  type SystemDataEmailHistory,
  fetchEmailsObject,
} from "@/api/email";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { indexedDBProxy } from "@repo/utils";
import EmailHeader from "./components/EmailHeader.vue";
import EmailSidebar from "./components/EmailSidebar.vue";
import EmailList from "./components/EmailList.vue";
import EmailDetail from "./components/EmailDetail.vue";
import EmailCompose from "./components/EmailCompose.vue";
import { it } from "element-plus/es/locale/index.mjs";

// 缓存相关接口定义
interface EmailCacheData {
  emails: SystemDataEmailHistory[];
  total: number;
  pageNumber: number;
  hasMore: boolean;
  timestamp: number;
  folderKey: string;
  settingId: number;
}

interface EmailCacheKey {
  settingId: number;
  folderKey: string;
  pageNumber: number;
}

// 缓存工具函数
const EMAIL_CACHE_PREFIX = "email_cache";
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5分钟缓存过期时间

// 生成缓存�?
const generateCacheKey = (
  settingId: number,
  folderKey: string,
  pageNumber: number
): string => {
  return `${EMAIL_CACHE_PREFIX}_${settingId}_${folderKey}_${pageNumber}`;
};

// 生成文件夹缓存键（用于存储整个文件夹的邮件列表）
const generateFolderCacheKey = (
  settingId: number,
  folderKey: string
): string => {
  return `${EMAIL_CACHE_PREFIX}_folder_${settingId}_${folderKey}`;
};

// 检查缓存是否过�?
const isCacheExpired = (timestamp: number): boolean => {
  return Date.now() - timestamp > CACHE_EXPIRY_TIME;
};

// 从缓存获取邮件数�?
const getEmailsFromCache = async (
  settingId: number,
  folderKey: string,
  pageNumber: number
): Promise<EmailCacheData | null> => {
  try {
    const cacheKey = generateCacheKey(settingId, folderKey, pageNumber);
    const cachedData: EmailCacheData | null =
      await indexedDBProxy().getItem(cacheKey);

    if (cachedData && !isCacheExpired(cachedData.timestamp)) {
      console.log("[邮件缓存] 从缓存加载邮件数�?, {
        settingId,
        folderKey,
        pageNumber,
        emailsCount: cachedData.emails.length,
        total: cachedData.total,
        cacheTime: new Date(cachedData.timestamp).toISOString(),
      });
      return cachedData;
    }

    return null;
  } catch (error) {
    console.error("[邮件缓存] 读取缓存失败:", error);
    return null;
  }
};

// 保存邮件数据到缓�?
const saveEmailsToCache = async (
  settingId: number,
  folderKey: string,
  pageNumber: number,
  emails: SystemDataEmailHistory[],
  total: number,
  hasMore: boolean
): Promise<void> => {
  try {
    const cacheKey = generateCacheKey(settingId, folderKey, pageNumber);
    const cacheData: EmailCacheData = {
      emails,
      total,
      pageNumber,
      hasMore,
      timestamp: Date.now(),
      folderKey,
      settingId,
    };

    await indexedDBProxy().setItem(cacheKey, cacheData);

    console.log("[邮件缓存] 保存邮件数据到缓�?, {
      settingId,
      folderKey,
      pageNumber,
      emailsCount: emails.length,
      total,
      hasMore,
    });
  } catch (error) {
    console.error("[邮件缓存] 保存缓存失败:", error);
  }
};

// 清理过期缓存
const clearExpiredCache = async (settingId: number): Promise<void> => {
  try {
    // 这里可以实现更复杂的缓存清理逻辑
    // 由于indexedDBProxy没有提供遍历所有键的方法，我们暂时跳过自动清理
    console.log("[邮件缓存] 缓存清理功能待实�?);
  } catch (error) {
    console.error("[邮件缓存] 清理缓存失败:", error);
  }
};

// 清理指定文件夹的所有缓�?
const clearFolderCache = async (
  settingId: number,
  folderKey: string
): Promise<void> => {
  try {
    // 清理前几页的缓存（假设最多缓�?0页）
    const clearPromises = [];
    for (let page = 1; page <= 10; page++) {
      const cacheKey = generateCacheKey(settingId, folderKey, page);
      clearPromises.push(indexedDBProxy().removeItem(cacheKey));
    }

    await Promise.all(clearPromises);

    console.log("[邮件缓存] 清理文件夹缓�?, {
      settingId,
      folderKey,
    });
  } catch (error) {
    console.error("[邮件缓存] 清理文件夹缓存失�?", error);
  }
};

const props = defineProps<{ id: number }>();

// 使用全局Socket.IO或创建独立连�?
const globalSocket = inject<any>("globalSocket");
let socketConnection: any = null;
let unsubscribeHandlers: any[] = [];

// 组件引用
const composeRef = ref(null);
const sidebarRef = ref(null);

// 界面状�?
const selectedFolder = ref(null);
const showCompose = ref(false);
const activeFolder = ref("inbox");
const activeTag = ref("");
const selectedEmail = ref(null);
const selectAll = ref(false);
const searchQuery = ref("");
const status = ref("");
const statusType = ref<String>("success");
const menuKey = `email_menu_${props.id}`;

// 撰写邮件表单
const composeForm = ref({
  to: "",
  cc: "",
  subject: "",
  content: "",
});

interface EmailFolder {
  key: string;
  name: string;
  icon: string;
  count: number;
}

// 邮箱文件�?
const folders = ref<EmailFolder[]>([
  // { key: "inbox", name: "收件�?, icon: "ri:inbox-line", count: 5 },
  // { key: "sent", name: "已发�?, icon: "ri:send-plane-line", count: 0 },
  // { key: "drafts", name: "草稿�?, icon: "ri:draft-line", count: 2 },
  // { key: "trash", name: "垃圾�?, icon: "ri:delete-bin-line", count: 0 },
  // { key: "spam", name: "垃圾邮件", icon: "ri:spam-line", count: 0 }
]);

// 邮件标签
const tags = ref([
  { key: "important", name: "重要", color: "red" },
  { key: "work", name: "工作", color: "blue" },
  { key: "personal", name: "个人", color: "green" },
  { key: "finance", name: "财务", color: "orange" },
]);

// 邮件数据
const emails = ref<SystemDataEmailHistory[]>([]);
const emailsTotal = ref(0);
const emailsPageNumber = ref(1);
const loading = ref(false);
const loadingMore = ref(false);
const hasMore = ref(true);
const pagination = ref({
  current: 1,
  size: 20,
  total: 0,
});

// 组件引用
const emailListRef = ref(null);

// 过滤邮件
const filteredEmails = computed(() => {
  let result = emails.value.filter((email) => {
    // 按标签过�?
    // if (activeTag.value && !email.tags.includes(activeTag.value)) {
    //   return false;
    // }

    // // 按搜索关键词过滤
    // if (searchQuery.value) {
    //   const query = searchQuery.value.toLowerCase();
    //   return (
    //     email.subject.toLowerCase().includes(query) ||
    //     email.sender.toLowerCase().includes(query) ||
    //     email.preview.toLowerCase().includes(query)
    //   );
    // }

    return true;
  });

  // 按时间排序，最新的在前
  return result.sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
  );
});

// 方法
async function selectFolder(folderKey: string) {
  activeFolder.value = folderKey;
  activeTag.value = "";
  selectedEmail.value = null;

  // 重置分页状�?
  emailsPageNumber.value = 1;
  hasMore.value = true;
  loading.value = true;

  // 重置滚动位置
  if (emailListRef.value?.resetScroll) {
    emailListRef.value.resetScroll();
  }

  // 先尝试从缓存加载数据
  const cacheKey = generateCacheKey(
    props.id,
    folderKey,
    emailsPageNumber.value
  );
  const cachedData = await getEmailsFromCache(
    props.id,
    folderKey,
    emailsPageNumber.value
  );
  indexedDBProxy()
    .getItemAsync(cacheKey)
    .then((cachedData) => {
      // 使用缓存数据立即显示
      //@ts-ignore
      emails.value = cachedData.emails;
      //@ts-ignore
      emailsTotal.value = cachedData.total;
      //@ts-ignore
      hasMore.value = cachedData.hasMore;
      loading.value = false;

      console.log("[邮件加载] 使用缓存数据显示邮件列表", {
        folderKey,
        //@ts-ignore
        emailsCount: cachedData.emails.length,
        //@ts-ignore
        total: cachedData.total,
      });
    })
    .catch(async (e) => {
      // 异步获取最新数�?
      try {
        const res = await fetchEmailsObject(props.id, {
          folderName: folderKey,
          command: "list-messages",
          pageNumber: emailsPageNumber.value,
        });
        //@ts-ignore
        const data = res?.data?.record || ({} as any);
        const newEmails = data.data || [];
        const newTotal = data.total || 0;
        const newHasMore = newEmails.length < newTotal;

        // 更新界面数据
        emails.value = newEmails;
        emailsTotal.value = newTotal;
        hasMore.value = newHasMore;
        loading.value = false;

        // 保存到缓�?
        await saveEmailsToCache(
          props.id,
          folderKey,
          emailsPageNumber.value,
          newEmails,
          newTotal,
          newHasMore
        );

        console.log("[邮件加载] 从服务器获取最新数�?, {
          folderKey,
          emailsCount: newEmails.length,
          total: newTotal,
          hasMore: newHasMore,
        });
      } catch (error) {
        console.error("加载邮件失败:", error);

        // 如果没有缓存数据且网络请求失败，显示错误
        if (!cachedData) {
          loading.value = false;
          ElMessage.error("加载邮件失败");
        } else {
          // 有缓存数据时，只显示警告
          ElMessage.warning("无法获取最新邮件，显示缓存数据");
        }
      }
    });
}

// 加载更多邮件
async function loadMoreEmails() {
  if (loadingMore.value || !hasMore.value) {
    return;
  }

  loadingMore.value = true;
  emailsPageNumber.value += 1;

  // 先尝试从缓存加载分页数据
  const cachedData = await getEmailsFromCache(
    props.id,
    activeFolder.value,
    emailsPageNumber.value
  );
  if (cachedData) {
    // 使用缓存数据立即显示
    emails.value = [...emails.value, ...cachedData.emails];
    hasMore.value = cachedData.hasMore;
    loadingMore.value = false;

    console.log("[邮件分页] 使用缓存数据加载更多邮件", {
      folderKey: activeFolder.value,
      pageNumber: emailsPageNumber.value,
      emailsCount: cachedData.emails.length,
      totalEmails: emails.value.length,
    });
  }

  // 异步获取最新分页数�?
  try {
    const res = await fetchEmailsObject(props.id, {
      folderName: activeFolder.value,
      command: "list-messages",
      pageNumber: emailsPageNumber.value,
    });
    //@ts-ignore
    const data = res?.data?.record || ({} as any);
    const newEmails = data.data || [];
    const newHasMore =
      emails.value.length -
        (cachedData ? cachedData.emails.length : 0) +
        newEmails.length <
      emailsTotal.value;
    // 如果有缓存数据，需要替换对应的部分；如果没有缓存，直接追加
    if (cachedData) {
      // 移除之前添加的缓存数据，添加最新数�?
      const emailsWithoutCache = emails.value.slice(
        0,
        emails.value.length - cachedData.emails.length
      );
      emails.value = [...emailsWithoutCache, ...newEmails];
    } else {
      // 直接追加新邮件到现有列表
      emails.value = [...emails.value, ...newEmails];
    }

    // 更新状�?
    hasMore.value = newHasMore;
    loadingMore.value = false;

    // 保存到缓�?
    await saveEmailsToCache(
      props.id,
      activeFolder.value,
      emailsPageNumber.value,
      newEmails.value,
      emailsTotal.value,
      newHasMore
    );

    console.log("[邮件分页] 从服务器获取最新分页数�?, {
      folderKey: activeFolder.value,
      pageNumber: emailsPageNumber.value,
      emailsCount: newEmails.length,
      totalEmails: emails.value.length,
      hasMore: newHasMore,
    });
  } catch (error) {
    console.error("加载更多邮件失败:", error);

    // 如果没有缓存数据且网络请求失败，回退状�?
    if (!cachedData) {
      loadingMore.value = false;
      emailsPageNumber.value -= 1; // 回退页码
      ElMessage.error("加载更多邮件失败");
    } else {
      // 有缓存数据时，只显示警告
      loadingMore.value = false;
      ElMessage.warning("无法获取最新邮件，显示缓存数据");
    }
  }
}

function selectTag(tagKey: string) {
  activeTag.value = activeTag.value === tagKey ? "" : tagKey;
  selectedEmail.value = null;
}

function selectEmail(email: any) {
  selectedEmail.value = email;
  // fetchEmailsObject(props.id, {
  //   folderName: activeFolder.value,
  //   command: "read-message",
  //   pageNumber: email.pageNumber,
  //   messageId: email.messageId
  // }).then(res => {
  // });
  if (!email.read) {
    email.read = true;
    // updateFolderCount();
    fetchMessageRead(email);
  }
}

const fetchMessageRead = async (email: any) => {
  fetchEmailsObject(props.id, {
    folderName: activeFolder.value,
    command: "mark-read",
    pageNumber: email.pageNumber,
    messageId: email.messageId,
  }).then((res) => {});
};

async function toggleStar(email: SystemDataEmailHistory) {
  const newStarred = !email.starred;
  const startTime = Date.now();

  console.log("[邮件操作] 开始更新星标状�?, {
    emailId: email.id,
    subject: email.subject,
    currentStarred: email.starred,
    newStarred: newStarred,
    timestamp: new Date().toISOString(),
  });

  try {
    //@ts-ignore
    await updateEmailStatus(props.id, { id: email.id, starred: newStarred });

    // 更新本地状�?
    //@ts-ignore
    email.starred = newStarred;
    updateFolderCount();

    const duration = Date.now() - startTime;
    console.log("[邮件操作] 星标状态更新成�?, {
      emailId: email.id,
      newStarred: newStarred,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    ElMessage.success(newStarred ? "已添加星�? : "已取消星�?);

    // 更新缓存中的邮件状�?
    await clearFolderCache(props.id, activeFolder.value);
    console.log("[缓存更新] 星标状态更新后清理缓存", {
      folderKey: activeFolder.value,
      emailId: email.id,
      starred: newStarred,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorInfo = {
      emailId: email.id,
      subject: email.subject,
      operation: newStarred ? "添加星标" : "取消星标",
      message: error.message || "未知错误",
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    };

    console.error("[邮件操作] 星标状态更新失�?", errorInfo);
    ElMessage.error(
      `${newStarred ? "添加" : "取消"}星标失败: ${error.message || "未知错误"}`
    );
  }
}

function handleSelectAll() {
  filteredEmails.value.forEach((email) => {
    email.selected = selectAll.value;
  });
}

async function deleteSelected() {
  const selectedEmails = filteredEmails.value.filter((email) => email.selected);
  if (selectedEmails.length === 0) {
    ElMessage.warning("请先选择要删除的邮件");
    return;
  }

  ElMessageBox.confirm(
    `确定要删除选中�?${selectedEmails.length} 封邮件吗？`,
    "确认删除",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    }
  ).then(async () => {
    selectedEmails.forEach((email) => {
      const index = emails.value.findIndex((e) => e.id === email.id);
      if (index > -1) {
        emails.value.splice(index, 1);
      }
    });
    selectAll.value = false;
    selectedEmail.value = null;
    ElMessage.success("删除成功");
    updateFolderCount();

    // 清理相关缓存
    await clearFolderCache(props.id, activeFolder.value);
    console.log("[缓存清理] 批量删除邮件后清理缓�?, {
      folderKey: activeFolder.value,
      deletedCount: selectedEmails.length,
    });
  });
}

function starSelected() {
  const selectedEmails = filteredEmails.value.filter((email) => email.selected);
  if (selectedEmails.length === 0) {
    ElMessage.warning("请先选择要标星的邮件");
    return;
  }

  selectedEmails.forEach((email) => {
    //@ts-ignore
    email.starred = true;
  });
  ElMessage.success("标星成功");
}

async function markAsRead() {
  const unreadEmails = filteredEmails.value.filter(
    (email) => email.selected && !email.read
  );
  if (unreadEmails.length === 0) {
    ElMessage.warning("没有选中未读邮件");
    return;
  }

  const startTime = Date.now();
  console.log("[邮件操作] 开始标记邮件为已读", {
    count: unreadEmails.length,
    emailIds: unreadEmails.map((e) => e.id),
    timestamp: new Date().toISOString(),
  });

  try {
    const updatePromises = unreadEmails.map((email) =>
      updateEmailStatus(props.id, { id: email.id, read: true })
    );

    await Promise.all(updatePromises);

    // 更新本地状�?
    unreadEmails.forEach((email) => {
      email.read = true;
    });

    const duration = Date.now() - startTime;
    console.log("[邮件操作] 标记已读成功", {
      count: unreadEmails.length,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    ElMessage.success(`已标�?${unreadEmails.length} 封邮件为已读`);
    updateFolderCount();

    // 更新缓存中的邮件状�?
    await clearFolderCache(props.id, activeFolder.value);
    console.log("[缓存更新] 标记已读后清理缓�?, {
      folderKey: activeFolder.value,
      count: unreadEmails.length,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorInfo = {
      message: error.message || "未知错误",
      count: unreadEmails.length,
      emailIds: unreadEmails.map((e) => e.id),
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    };

    console.error("[邮件操作] 标记已读失败:", errorInfo);
    ElMessage.error(`标记已读失败: ${error.message || "未知错误"}`);
  }
}

function handleCompose() {
  showCompose.value = true;
  composeForm.value = { to: "", cc: "", subject: "", content: "" };
}

function handleComposeClose() {
  showCompose.value = false;
  composeForm.value = { to: "", cc: "", subject: "", content: "" };
}

function handleSearch(query: string) {
  searchQuery.value = query;
}

async function refreshEmails() {
  if (loading.value) return;

  loading.value = true;
  status.value = "正在同步邮件...";
  statusType.value = "info";

  const startTime = Date.now();
  console.log("[邮件同步] 开始同步邮�?, {
    timestamp: new Date().toISOString(),
    folder: selectedFolder.value,
    pagination: pagination.value,
  });

  try {
    // 首先尝试从邮件服务器同步邮件
    console.log("[邮件拉取] 正在从邮件服务器同步...");
    const syncResult = await fetchEmails(props.id, activeFolder.value);

    if (syncResult.success) {
      status.value = "邮件拉取成功，正在加�?..";
      console.log("[邮件拉取] 服务器同步成�?, syncResult);

      // 同步成功后清理缓存，确保下次加载最新数�?
      await clearFolderCache(props.id, activeFolder.value);
      console.log("[缓存清理] 邮件同步成功后清理缓�?, {
        folderKey: activeFolder.value,
      });
    } else {
      console.warn("[邮件拉取] 服务器同步失败，继续加载本地数据", syncResult);
      status.value = "服务器拉取失败，加载本地数据...";
    }
    updateFolderCount();
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorInfo = {
      message: error.message || "未知错误",
      stack: error.stack,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      folder: selectedFolder.value,
      pagination: pagination.value,
    };

    console.error("[邮件同步] 同步失败:", errorInfo);

    // 根据错误类型提供不同的错误信�?
    let errorMessage = "邮件同步失败";
    if (error.message?.includes("网络")) {
      errorMessage = "网络连接失败，请检查网络设�?;
    } else if (
      error.message?.includes("认证") ||
      error.message?.includes("授权")
    ) {
      errorMessage = "邮箱认证失败，请检查账号密�?;
    } else if (error.message?.includes("超时")) {
      errorMessage = "连接超时，请稍后重试";
    } else if (error.message) {
      errorMessage = `邮件同步失败: ${error.message}`;
    }

    status.value = errorMessage;
    statusType.value = "error";
    ElMessage.error(errorMessage);
  } finally {
    loading.value = false;

    // 清除状态提�?
    setTimeout(() => {
      status.value = "";
    }, 5000);
  }
}

function updateFolderCount() {
  folders.value.forEach((folder) => {
    if (folder.key === "inbox") {
      folder.count = emails.value.filter(
        (email) => email.folder === "inbox" && !email.read
      ).length;
    }
  });
}

function replyEmail() {
  if (!selectedEmail.value) return;

  composeForm.value = {
    to: selectedEmail.value.senderEmail,
    cc: "",
    subject: `Re: ${selectedEmail.value.subject}`,
    content: `\n\n--- 原始邮件 ---\n发件�? ${selectedEmail.value.sender}\n时间: ${formatFullTime(selectedEmail.value.time)}\n主题: ${selectedEmail.value.subject}\n\n${selectedEmail.value.content.replace(/<[^>]*>/g, "")}`,
  };
  showCompose.value = true;
}

function replyAllEmail() {
  replyEmail(); // 简化实现，实际应该包含所有收件人
}

function forwardEmail() {
  if (!selectedEmail.value) return;

  composeForm.value = {
    to: "",
    cc: "",
    subject: `Fwd: ${selectedEmail.value.subject}`,
    content: `\n\n--- 转发邮件 ---\n发件�? ${selectedEmail.value.sender}\n时间: ${formatFullTime(selectedEmail.value.time)}\n主题: ${selectedEmail.value.subject}\n\n${selectedEmail.value.content.replace(/<[^>]*>/g, "")}`,
  };
  showCompose.value = true;
}

async function deleteEmail() {
  if (!selectedEmail.value) return;

  ElMessageBox.confirm("确定要删除这封邮件吗�?, "确认删除", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(async () => {
    const index = emails.value.findIndex(
      (e) => e.id === selectedEmail.value.id
    );
    if (index > -1) {
      emails.value.splice(index, 1);
    }
    selectedEmail.value = null;
    ElMessage.success("删除成功");
    updateFolderCount();

    // 清理相关缓存
    await clearFolderCache(props.id, activeFolder.value);
    console.log("[缓存清理] 删除邮件后清理缓�?, {
      folderKey: activeFolder.value,
    });
  });
}

async function sendEmail() {
  if (!composeForm.value.to || !composeForm.value.subject) {
    ElMessage.warning("请填写收件人和主�?);
    return;
  }

  const startTime = Date.now();
  const emailData = {
    to: composeForm.value.to,
    cc: composeForm.value.cc,
    subject: composeForm.value.subject,
    content: composeForm.value.content,
  };

  console.log("[邮件发送] 开始发送邮�?, {
    to: emailData.to,
    cc: emailData.cc,
    subject: emailData.subject,
    contentLength: emailData.content.length,
    timestamp: new Date().toISOString(),
  });

  try {
    const cmd = JSON.stringify(emailData);
    const res = await executeConsole(props.id, cmd, "email");

    const duration = Date.now() - startTime;

    if (res?.data?.success) {
      console.log("[邮件发送] 邮件发送成�?, {
        to: emailData.to,
        subject: emailData.subject,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });

      status.value = "邮件发送成�?;
      statusType.value = "success";
      showCompose.value = false;
      composeForm.value = { to: "", cc: "", subject: "", content: "" };
      ElMessage.success("邮件发送成�?);

      // 发送成功后刷新邮件列表
      refreshEmails();
    } else {
      const errorMsg = res?.data?.msg || "邮件发送失�?;
      console.error("[邮件发送] 邮件发送失�?, {
        to: emailData.to,
        subject: emailData.subject,
        error: errorMsg,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });

      status.value = errorMsg;
      statusType.value = "error";
      ElMessage.error(errorMsg);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorInfo = {
      to: emailData.to,
      subject: emailData.subject,
      message: error.message || "未知错误",
      stack: error.stack,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    };

    console.error("[邮件发送] 邮件发送异�?", errorInfo);

    const errorMessage = `邮件发送失�? ${error.message || "未知错误"}`;
    status.value = errorMessage;
    statusType.value = "error";
    ElMessage.error(errorMessage);
  }

  // 清除状态提�?
  setTimeout(() => {
    status.value = "";
  }, 5000);
}

function saveDraft() {
  ElMessage.success("草稿已保�?);
}

// 云同步处理函�?
async function handleCloudSync() {
  loading.value = true;
  status.value = "正在进行云同�?..";
  statusType.value = "info";

  try {
    const result = await syncEmails(props.id, activeFolder.value);

    if (result.success) {
      status.value = "云同步成�?;
      statusType.value = "success";
      ElMessage.success("云同步成�?);

      // 同步成功后刷新邮件列�?
      await refreshEmails();
    } else {
      const errorMsg = result.msg || "云同步失�?;
      status.value = errorMsg;
      statusType.value = "error";
      ElMessage.error(errorMsg);
    }
  } catch (error) {
    const errorMessage = `云同步失�? ${error.message || "未知错误"}`;
    status.value = errorMessage;
    statusType.value = "error";
    ElMessage.error(errorMessage);
    console.error("[云同步] 同步失败:", error);
  } finally {
    loading.value = false;

    // 清除状态提�?
    setTimeout(() => {
      status.value = "";
    }, 5000);
  }
}

// 云备份处理函�?
function handleCloudBackup() {
  // 创建文件输入元素
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".eml,.msg,.mbox";
  fileInput.style.display = "none";

  fileInput.onchange = async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    loading.value = true;
    status.value = "正在上传邮件文件...";
    statusType.value = "info";

    try {
      const result = await backupEmail(props.id, file);

      if (result.success) {
        status.value = "邮件备份成功";
        statusType.value = "success";
        ElMessage.success(
          `邮件备份成功: ${result.data?.filename || file.name}`
        );

        // 备份成功后刷新邮件列�?
        await refreshEmails();
      } else {
        const errorMsg = result.msg || "邮件备份失败";
        status.value = errorMsg;
        statusType.value = "error";
        ElMessage.error(errorMsg);
      }
    } catch (error) {
      const errorMessage = `邮件备份失败: ${error.message || "未知错误"}`;
      status.value = errorMessage;
      statusType.value = "error";
      ElMessage.error(errorMessage);
      console.error("[云备份] 备份失败:", error);
    } finally {
      loading.value = false;

      // 清除状态提�?
      setTimeout(() => {
        status.value = "";
      }, 5000);
    }

    // 清理文件输入元素
    document.body.removeChild(fileInput);
  };

  // 添加到DOM并触发点�?
  document.body.appendChild(fileInput);
  fileInput.click();
}

// 处理菜单清空事件
function handleMenuCleared() {
  console.log("[EmailConsole] 菜单数据已清空，将重新加�?);
  loadRoot();
}

// 处理缓存清空事件
function handleCacheCleared() {
  console.log("[EmailConsole] 邮件缓存数据已清�?);
  // 清空当前邮件列表，强制重新加�?
  emails.value = [];
  emailsTotal.value = 0;
  emailsPageNumber.value = 1;
  hasMore.value = true;
  selectedEmail.value = null;

  // 重置EmailList组件的滚动位�?
  if (emailListRef.value?.resetScroll) {
    emailListRef.value.resetScroll();
  }
}

// 处理菜单加载事件
function handleMenuLoaded(menuData: any) {
  console.log("[EmailConsole] 菜单数据已从IndexedDB加载", {
    foldersCount: menuData.folders?.length || 0,
    tagsCount: menuData.tags?.length || 0,
    lastUpdated: new Date(menuData.lastUpdated).toISOString(),
  });

  // 更新本地的folders和tags数据
  if (menuData.folders && menuData.folders.length > 0) {
    folders.value = menuData.folders;
  }
  if (menuData.tags && menuData.tags.length > 0) {
    tags.value = menuData.tags;
  }
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
  return time.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
async function loadRoot() {
  const res = await getConsoleRoot(props.id);
  folders.value = res?.data?.data.map((it) => {
    it.key = it.name;
    return it;
  });

  // 加载成功后保存到 IndexedDB
  if (folders.value && folders.value.length > 0) {
    try {
      const menuData = {
        folders: JSON.parse(JSON.stringify(folders.value)),
        tags: JSON.parse(JSON.stringify(tags.value || [])),
        lastUpdated: Date.now(),
      };
      await indexedDBProxy().setItem(menuKey, menuData);
      console.log("[EmailConsole] 菜单数据已保存到IndexedDB");
    } catch (error) {
      console.error("[EmailConsole] 保存菜单数据到IndexedDB失败:", error);
    }
  }
}

async function loadFromIndexedDB() {
  try {
    indexedDBProxy()
      .getItemAsync(menuKey)
      .then((cachedData) => {
        //@ts-ignore
        if (cachedData && cachedData.folders) {
          console.log("[EmailConsole] 从IndexedDB加载菜单数据");
          //@ts-ignore
          folders.value = cachedData.folders;
          //@ts-ignore
          if (cachedData.tags) {
            //@ts-ignore
            tags.value = cachedData.tags;
          }
          return;
        }
        loadRoot();
      })
      .catch((e) => {
        loadRoot();
      });
  } catch (error) {
    console.error("[EmailConsole] 从IndexedDB加载菜单数据失败:", error);
  }
  return false; // 表示需要从服务器加�?
}

onMounted(async () => {
  // 清理过期缓存
  await clearExpiredCache(props.id);

  // 优先�?IndexedDB 加载数据
  loadFromIndexedDB();

  // 建立Socket.IO连接
  try {
    if (globalSocket) {
      socketConnection = globalSocket;
      await socketConnection.connect?.();
    } else {
      // 如果没有全局Socket.IO，创建独立连�?
      const config = getConfig();
      socketConnection = socket(splitToArray(config.SocketUrl), undefined, {});
    }

    // 监听邮件相关消息
    const emailHandler = async (message: any) => {
      console.log("[EmailConsole] 接收到新邮件消息");
      //设置数量
      folders.value.forEach((it) => {
        if (it.name === "收件�? && message.folder == "INBOX") {
          it.count += 1;
          return;
        }
        if (it.name == message.folder) {
          it.count += 1;
        }
      });
      const cacheKey = generateCacheKey(
        props.id,
        message.folder == "INBOX" ? "收件�? : message.folder,
        emailsPageNumber.value
      );
      let emailBox = [];
      let emailBoxTotal = 0;
      indexedDBProxy()
        .getItemAsync(cacheKey)
        .then(async (cachedData) => {
          //@ts-ignore
          emailBox = cachedData?.emails || [];
          //@ts-ignore
          emailBoxTotal = cachedData?.total || 0;
          emailBoxTotal++;
          emailBox.unshift(message);

          emails.value = emailBox;
          emailsTotal.value = emailBoxTotal;
          // 保存到缓�?
          await saveEmailsToCache(
            props.id,
            message.folder == "INBOX" ? "收件�? : message.folder,
            emailsPageNumber.value,
            emailBox,
            emailBoxTotal,
            hasMore.value
          );
        });
    };

    // 监听system/data/listen主题
    const unsubListen = socketConnection.on?.(
      "system/data/listen/new_message/" + props.id,
      emailHandler
    );
    if (unsubListen) unsubscribeHandlers.push(unsubListen);

    // 监听system/data/log主题
    const unsubLog = socketConnection.on?.(
      "system/data/log",
      (message: any) => {
        const settingId = Number(
          message?.settingId || message?.data?.settingId
        );
        if (settingId === props.id) {
          console.log("[EmailConsole] 日志消息:", message);
        }
      }
    );
    if (unsubLog) unsubscribeHandlers.push(unsubLog);

    console.log("[EmailConsole] Socket.IO连接已建�?);
  } catch (error) {
    console.error("[EmailConsole] Socket.IO连接失败:", error);
  }
});

onBeforeUnmount(() => {
  // 清理Socket.IO连接
  try {
    // 取消所有事件监�?
    unsubscribeHandlers.forEach((unsubscribe) => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    });
    unsubscribeHandlers = [];

    // 如果是独立连接，断开连接
    if (socketConnection && socketConnection !== globalSocket) {
      socketConnection.disconnect?.();
    }

    socketConnection = null;
    console.log("[EmailConsole] Socket.IO连接已清�?);
  } catch (error) {
    console.error("[EmailConsole] 清理Socket.IO连接失败:", error);
  }
});
</script>
<style scoped>
.email-console {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-overlay);
}

/* 顶部工具�?*/
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
  color: var(--el-text-color-primary);
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

/* 左侧导航�?*/
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

.folder-list,
.tag-list {
  padding: 0 8px;
}

.folder-item,
.tag-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin: 2px 0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.folder-item:hover,
.tag-item:hover {
  background: #f0f9ff;
}

.folder-item.active,
.tag-item.active {
  background: var(--el-bg-color-overlay);
  color: #fff;
}

.folder-icon {
  font-size: 16px;
  margin-right: 8px;
  color: var(--el-text-color-primary);
}

.folder-item.active .folder-icon {
  color: #fff;
}

.folder-name,
.tag-name {
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

.tag-color.red {
  background: #f56c6c;
}
.tag-color.blue {
  background: var(--el-bg-color-overlay);
}
.tag-color.green {
  background: #67c23a;
}
.tag-color.orange {
  background: #e6a23c;
}

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
  border-bottom: 1px solid var(--el-border-color);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.email-item:hover {
  background: var(--el-bg-color-overlay);
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
  width: 32px;
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
  color: var(--el-text-color-primary);
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
  color: var(--el-text-color-primary);
}

.detail-actions {
  display: flex;
  gap: 8px;
}

.detail-info {
  padding: 16px 24px;
  border-bottom: 1px solid var(--el-border-color);
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
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.sender-details .sender-email {
  font-size: 14px;
  color: var(--el-text-color-primary);
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
  color: var(--el-text-color-primary);
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
  color: var(--el-text-color-primary);
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

/* 状态提�?*/
.status-alert {
  position: fixed;
  top: 80px;
  right: 24px;
  z-index: 1000;
  max-width: 400px;
}

/* 响应式设�?*/
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

/* 滚动条样�?*/
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

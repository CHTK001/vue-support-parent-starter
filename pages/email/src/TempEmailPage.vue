<script setup lang="ts">
import { onUnmounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  createTempEmail,
  deleteTempEmail,
  getTempEmailMessage,
  getTempEmailMessages,
  type TempEmailMessage,
} from "./api/temp-email";

// 状态
const emailAddress = ref("");
const messages = ref<TempEmailMessage[]>([]);
const selectedMessage = ref<TempEmailMessage | null>(null);
const loading = ref(false);
const creating = ref(false);
const pollingTimer = ref<ReturnType<typeof setInterval> | null>(null);
const error = ref("");
const detailLoading = ref(false);

// 创建临时邮箱
async function handleCreate() {
  creating.value = true;
  error.value = "";
  try {
    const res = await createTempEmail("tempmail");
    if (res.success && res.data?.address) {
      emailAddress.value = res.data.address;
      messages.value = [];
      selectedMessage.value = null;
      ElMessage.success("临时邮箱创建成功");
      startPolling();
    } else {
      error.value = res.message || "创建失败";
    }
  } catch (e: any) {
    error.value = e.message || "创建失败";
  } finally {
    creating.value = false;
  }
}

// 刷新邮件列表
async function refreshMessages() {
  if (!emailAddress.value) return;
  loading.value = true;
  try {
    const res = await getTempEmailMessages(emailAddress.value);
    if (res.success) {
      messages.value = res.data || [];
    }
  } catch (e: any) {
    console.error("刷新邮件失败", e);
  } finally {
    loading.value = false;
  }
}

// 查看邮件详情
async function viewMessage(msg: TempEmailMessage) {
  if (selectedMessage.value?.id === msg.id) {
    selectedMessage.value = null;
    return;
  }
  selectedMessage.value = msg;
  detailLoading.value = true;
  try {
    const res = await getTempEmailMessage(emailAddress.value, msg.id);
    if (res.success && res.data) {
      selectedMessage.value = res.data;
    }
  } catch (e: any) {
    console.error("获取邮件详情失败", e);
  } finally {
    detailLoading.value = false;
  }
}

// 删除临时邮箱
async function handleDelete() {
  if (!emailAddress.value) return;
  try {
    await ElMessageBox.confirm("确定删除当前临时邮箱？删除后邮件将丢失。", "确认", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning",
    });
  } catch {
    return;
  }

  try {
    const res = await deleteTempEmail(emailAddress.value);
    if (res.success) {
      ElMessage.success("临时邮箱已删除");
      stopPolling();
      emailAddress.value = "";
      messages.value = [];
      selectedMessage.value = null;
    }
  } catch (e: any) {
    ElMessage.error("删除失败: " + (e.message || "未知错误"));
  }
}

// 复制地址
function copyAddress() {
  if (!emailAddress.value) return;
  navigator.clipboard.writeText(emailAddress.value).then(
    () => ElMessage.success("地址已复制"),
    () => ElMessage.error("复制失败"),
  );
}

// 轮询
function startPolling() {
  stopPolling();
  refreshMessages();
  pollingTimer.value = setInterval(refreshMessages, 5000);
}

function stopPolling() {
  if (pollingTimer.value) {
    clearInterval(pollingTimer.value);
    pollingTimer.value = null;
  }
}

onUnmounted(() => {
  stopPolling();
});

// 渲染邮件内容（HTML 安全）
function renderContent(content: string): string {
  if (!content) return "";
  return content;
}
</script>

<template>
  <div class="temp-email-page">
    <!-- 头部 -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-800">临时邮箱</h2>
      <div class="flex gap-2">
        <el-button
          type="primary"
          :loading="creating"
          :disabled="!!emailAddress"
          @click="handleCreate"
        >
          创建邮箱
        </el-button>
        <el-button
          :disabled="!emailAddress"
          :loading="loading"
          @click="refreshMessages"
        >
          刷新
        </el-button>
        <el-button
          type="danger"
          :disabled="!emailAddress"
          @click="handleDelete"
        >
          删除
        </el-button>
      </div>
    </div>

    <!-- 错误提示 -->
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      show-icon
      class="mb-4"
      closable
      @close="error = ''"
    />

    <!-- 状态提示 -->
    <el-alert
      v-if="!emailAddress && !error"
      title="点击「创建邮箱」生成一个临时邮箱地址，用于接收邮件"
      type="info"
      show-icon
      class="mb-4"
      :closable="false"
    />

    <!-- 邮箱地址显示 -->
    <div
      v-if="emailAddress"
      class="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">邮箱地址：</span>
        <span class="text-sm font-mono text-gray-800">{{ emailAddress }}</span>
      </div>
      <el-button size="small" @click="copyAddress">复制</el-button>
    </div>

    <!-- 邮件列表 -->
    <div class="border border-gray-200 rounded-lg overflow-hidden">
      <!-- 列表头部 -->
      <div class="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center text-xs text-gray-500">
        <span class="flex-1">主题</span>
        <span class="w-24 text-right">时间</span>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading && messages.length === 0" class="p-8 text-center text-gray-400">
        加载中...
      </div>

      <!-- 空状态 -->
      <div v-else-if="messages.length === 0 && emailAddress" class="p-8 text-center text-gray-400">
        <div class="text-4xl mb-2">📭</div>
        <div>暂无邮件，等待接收中...</div>
        <div class="text-xs mt-1 text-gray-300">每 5 秒自动刷新</div>
      </div>

      <!-- 邮件列表 -->
      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors"
          :class="{ 'bg-blue-50': selectedMessage?.id === msg.id }"
          @click="viewMessage(msg)"
        >
          <div class="flex items-center">
            <span class="flex-1 text-sm truncate">{{ msg.title || "(无主题)" }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 邮件详情 -->
    <div
      v-if="selectedMessage"
      class="mt-4 border border-gray-200 rounded-lg p-4"
    >
      <h3 class="text-base font-medium text-gray-800 mb-3">
        {{ selectedMessage.title || "(无主题)" }}
      </h3>

      <div v-if="detailLoading" class="text-center text-gray-400 py-4">
        加载中...
      </div>

      <div
        v-else
        v-html="renderContent(selectedMessage.content)"
        class="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none"
      />
    </div>
  </div>
</template>

<style scoped>
.temp-email-page {
  max-width: 800px;
  margin: 0 auto;
}

.prose :deep(a) {
  color: #409eff;
  text-decoration: underline;
}

.prose :deep(img) {
  max-width: 100%;
  height: auto;
}

.prose :deep(table) {
  width: 100%;
  border-collapse: collapse;
}

.prose :deep(th),
.prose :deep(td) {
  border: 1px solid #e5e7eb;
  padding: 8px;
  text-align: left;
}
</style>

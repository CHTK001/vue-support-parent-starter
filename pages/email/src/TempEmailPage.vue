<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { ChatLineRound, FolderOpened, Plus, RefreshRight, Delete } from "@element-plus/icons-vue";
import {
  createTempEmail,
  deleteTempEmail,
  getTempEmailMessage,
  getTempEmailMessages,
  listTempEmails,
  type TempEmailMailbox,
  type TempEmailMessage,
} from "./api/temp-email";

const mailboxes = ref<TempEmailMailbox[]>([]);
const selectedEmail = ref("");
const messages = ref<TempEmailMessage[]>([]);
const selectedMessage = ref<TempEmailMessage | null>(null);
const mailboxLoading = ref(false);
const messageLoading = ref(false);
const creating = ref(false);
const pollingTimer = ref<ReturnType<typeof setInterval> | null>(null);
const drawerVisible = ref(false);

const selectedMailbox = computed(() =>
  mailboxes.value.find((item) => item.email === selectedEmail.value) || null,
);

async function loadMailboxes(selectFirst = false) {
  mailboxLoading.value = true;
  try {
    const res = await listTempEmails();
    if (res.success) {
      mailboxes.value = res.data || [];
      if (selectFirst && !selectedEmail.value && mailboxes.value.length) {
        selectedEmail.value = mailboxes.value[0].email;
        await loadMessages();
      }
    } else {
      ElMessage.error(res.message || "加载邮箱列表失败");
    }
  } catch (error) {
    console.error(error);
    ElMessage.error("加载邮箱列表失败");
  } finally {
    mailboxLoading.value = false;
  }
}

async function loadMessages() {
  if (!selectedEmail.value) {
    messages.value = [];
    selectedMessage.value = null;
    return;
  }
  messageLoading.value = true;
  try {
    const res = await getTempEmailMessages(selectedEmail.value);
    if (res.success) {
      messages.value = res.data || [];
      if (selectedMessage.value) {
        const next = messages.value.find((item) => item.id === selectedMessage.value?.id);
        if (!next) {
          selectedMessage.value = null;
        }
      }
    } else {
      ElMessage.error(res.message || "加载邮件失败");
    }
  } catch (error) {
    console.error(error);
    ElMessage.error("加载邮件失败");
  } finally {
    messageLoading.value = false;
  }
}

async function createMailbox() {
  creating.value = true;
  try {
    const res = await createTempEmail("tempmail");
    if (res.success && res.data?.address) {
      selectedEmail.value = res.data.address;
      selectedMessage.value = null;
      drawerVisible.value = true;
      ElMessage.success("临时邮箱已创建");
      await loadMailboxes();
      await loadMessages();
      startPolling();
    } else {
      ElMessage.warning(res.message || "创建失败");
    }
  } catch (error) {
    console.error(error);
    ElMessage.error("创建失败");
  } finally {
    creating.value = false;
  }
}

async function openMailbox(email: string) {
  selectedEmail.value = email;
  drawerVisible.value = true;
  selectedMessage.value = null;
  await loadMessages();
}

async function openLatestMail(row: TempEmailMailbox) {
  if (!row.latestTraceId) {
    await openMailbox(row.email);
    return;
  }
  await openMailbox(row.email);
  const res = await getTempEmailMessage(row.email, row.latestTraceId);
  if (res.success && res.data) {
    selectedMessage.value = res.data;
  }
}

async function openMessage(message: TempEmailMessage) {
  if (!selectedEmail.value) {
    return;
  }
  selectedMessage.value = message;
  const res = await getTempEmailMessage(selectedEmail.value, message.id);
  if (res.success && res.data) {
    selectedMessage.value = res.data;
  }
}

async function removeMailbox(email: string) {
  try {
    await ElMessageBox.confirm(`确认删除临时邮箱 ${email}？`, "删除确认", { type: "warning" });
    const res = await deleteTempEmail(email);
    if (res.success) {
      ElMessage.success("邮箱已删除");
      if (selectedEmail.value === email) {
        selectedEmail.value = "";
        messages.value = [];
        selectedMessage.value = null;
        drawerVisible.value = false;
        stopPolling();
      }
      await loadMailboxes();
    } else {
      ElMessage.error(res.message || "删除失败");
    }
  } catch {
    // noop
  }
}

function startPolling() {
  stopPolling();
  pollingTimer.value = setInterval(() => {
    if (selectedEmail.value) {
      loadMailboxes();
      loadMessages();
    }
  }, 5000);
}

function stopPolling() {
  if (pollingTimer.value) {
    clearInterval(pollingTimer.value);
    pollingTimer.value = null;
  }
}

onMounted(async () => {
  await loadMailboxes(true);
  if (selectedEmail.value) {
    startPolling();
  }
});

onUnmounted(() => {
  stopPolling();
});
</script>

<template>
  <div class="email-page">
    <section class="hero">
      <div>
        <p class="eyebrow">Mailbox workbench</p>
        <h1>邮箱管理</h1>
        <p class="lead">创建临时邮箱，查看最新邮件，进入邮箱收件箱。</p>
      </div>
      <div class="hero-actions">
        <el-button :icon="RefreshRight" @click="loadMailboxes(true)">刷新</el-button>
        <el-button type="primary" :icon="Plus" :loading="creating" @click="createMailbox">
          新增邮箱
        </el-button>
      </div>
    </section>

    <section class="content">
      <div class="panel panel--list">
        <div class="panel-head">
          <div>
            <h2>邮箱列表</h2>
            <p>支持临时邮箱创建与验证码邮件查看。</p>
          </div>
          <el-tag effect="plain" type="info">{{ mailboxes.length }} 个邮箱</el-tag>
        </div>

        <el-table v-loading="mailboxLoading" :data="mailboxes" row-key="email" border class="table">
          <el-table-column label="邮箱" min-width="240">
            <template #default="{ row }">
              <div class="cell-main">
                <strong>{{ row.email }}</strong>
                <span>{{ row.latestTitle || "暂无邮件" }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="邮件数" width="100" align="center">
            <template #default="{ row }">
              <el-tag effect="plain" size="small">{{ row.messageCount }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="最新邮件" min-width="220">
            <template #default="{ row }">
              <span class="preview">{{ row.latestContent || "-" }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="260" fixed="right">
            <template #default="{ row }">
              <el-button text type="primary" :icon="ChatLineRound" @click="openLatestMail(row)">
                打开最新邮件
              </el-button>
              <el-button text :icon="FolderOpened" @click="openMailbox(row.email)">
                进入邮箱
              </el-button>
              <el-button text type="danger" :icon="Delete" @click="removeMailbox(row.email)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <aside class="panel panel--detail">
        <div class="panel-head panel-head--stacked">
          <div>
            <h2>收件箱</h2>
            <p>{{ selectedEmail || "尚未选择邮箱" }}</p>
          </div>
          <el-tag effect="plain" type="info">{{ messages.length }} 封</el-tag>
        </div>

        <div v-if="!selectedEmail" class="empty">
          请选择一个邮箱，或者新建临时邮箱。
        </div>

        <template v-else>
          <div class="toolbar">
            <el-button :icon="RefreshRight" @click="loadMessages">刷新邮件</el-button>
            <el-tag effect="plain" type="success">{{ selectedMailbox?.latestTitle || "无最新邮件" }}</el-tag>
          </div>

          <div class="message-list">
            <button
              v-for="item in messages"
              :key="item.id"
              class="message-item"
              :class="{ active: selectedMessage?.id === item.id }"
              @click="openMessage(item)"
            >
              <strong>{{ item.title || "无主题" }}</strong>
              <span>{{ item.content || "-" }}</span>
            </button>
            <div v-if="messages.length === 0 && !messageLoading" class="empty">
              暂无邮件，等待接收中。
            </div>
          </div>

          <el-drawer v-model="drawerVisible" title="邮件详情" size="42%">
            <div v-if="selectedMessage" class="detail">
              <h3>{{ selectedMessage.title || "无主题" }}</h3>
              <p class="meta">收件人：{{ selectedMessage.to || "-" }}</p>
              <p class="meta">类型：{{ selectedMessage.contentType || "-" }}</p>
              <div class="content-html" v-html="selectedMessage.content || ''" />
            </div>
            <div v-else class="empty">选择一封邮件查看详情。</div>
          </el-drawer>
        </template>
      </aside>
    </section>
  </div>
</template>

<style scoped>
.email-page { display:grid; gap:16px; }
.hero, .panel { border:1px solid rgba(148,163,184,.22); background:rgba(255,255,255,.88); backdrop-filter:blur(10px); box-shadow:0 1px 2px rgba(15,23,42,.04); }
.hero { display:flex; justify-content:space-between; gap:20px; align-items:end; padding:20px 22px; border-radius:18px; }
.eyebrow { margin:0 0 8px; color:#64748b; font-size:12px; text-transform:uppercase; }
.hero h1 { margin:0; font-size:24px; color:#0f172a; }
.lead, .panel-head p { margin:8px 0 0; color:#64748b; line-height:1.7; }
.hero-actions { display:flex; gap:8px; flex-wrap:wrap; }
.content { display:grid; grid-template-columns:minmax(0,1.3fr) minmax(340px,.9fr); gap:16px; align-items:start; }
.panel { border-radius:18px; padding:16px; }
.panel-head { display:flex; justify-content:space-between; gap:16px; align-items:center; margin-bottom:14px; }
.panel-head--stacked { align-items:start; }
.panel-head h2 { margin:0; font-size:18px; color:#0f172a; }
.table :deep(th) { background: rgba(248,250,252,.9); }
.cell-main { display:flex; flex-direction:column; gap:4px; }
.cell-main span, .preview { color:#94a3b8; font-size:12px; }
.full-width { width:100%; }
.panel--detail { display:grid; gap:14px; }
.toolbar { display:flex; justify-content:space-between; gap:10px; align-items:center; }
.message-list { display:grid; gap:10px; max-height:520px; overflow:auto; }
.message-item { text-align:left; padding:12px; border-radius:12px; border:1px solid rgba(148,163,184,.16); background:#fff; cursor:pointer; }
.message-item.active { border-color:#60a5fa; background:#eff6ff; }
.message-item strong { display:block; color:#0f172a; margin-bottom:6px; }
.message-item span { display:block; color:#64748b; font-size:12px; word-break:break-all; }
.empty { padding:18px; border-radius:12px; border:1px dashed rgba(148,163,184,.32); color:#64748b; background:rgba(248,250,252,.7); }
.detail { display:grid; gap:10px; }
.detail h3 { margin:0; color:#0f172a; }
.meta { margin:0; color:#64748b; font-size:13px; }
.content-html { padding:12px; border-radius:12px; border:1px solid rgba(148,163,184,.16); background:#fff; min-height:180px; white-space:normal; word-break:break-word; }
@media (max-width: 1200px) { .content { grid-template-columns:1fr; } }
@media (max-width: 900px) { .hero { flex-direction:column; align-items:start; } .panel-head { flex-direction:column; align-items:start; } }
</style>

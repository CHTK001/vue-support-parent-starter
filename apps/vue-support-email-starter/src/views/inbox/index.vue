<template>
  <el-container class="email-container">
    <el-aside width="200px">
      <el-menu :default-active="activeMenu" @select="handleMenuSelect">
        <el-menu-item index="inbox">
          <el-icon><Inbox /></el-icon>
          <span>收件箱</span>
        </el-menu-item>
        <el-menu-item index="compose">
          <el-icon><Edit /></el-icon>
          <span>写邮件</span>
        </el-menu-item>
        <el-menu-item index="sent">
          <el-icon><Sent /></el-icon>
          <span>已发送</span>
        </el-menu-item>
        <el-menu-item index="drafts">
          <el-icon><Document /></el-icon>
          <span>草稿箱</span>
        </el-menu-item>
        <el-menu-item index="accounts">
          <el-icon><User /></el-icon>
          <span>账户管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-main>
      <div class="toolbar">
        <h2>收件箱</h2>
        <el-button type="primary" @click="refreshEmails">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
      <el-table
        :data="emails"
        style="width: 100%"
        @row-click="viewEmail"
        :row-class-name="tableRowClassName"
      >
        <el-table-column prop="fromAddress" label="发件人" width="200" />
        <el-table-column prop="subject" label="主题" />
        <el-table-column prop="receivedDate" label="日期" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.receivedDate) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="scope">
            <el-button
              size="small"
              type="danger"
              @click.stop="deleteEmail(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { emailApi, type EmailMessage } from "../../api/email";
import { useEmailStore } from "../../stores/email";

const router = useRouter();
const emailStore = useEmailStore();
const activeMenu = ref("inbox");
const emails = ref<EmailMessage[]>([]);

const handleMenuSelect = (index: string) => {
  router.push(`/${index}`);
};

const refreshEmails = async () => {
  try {
    const accountId = emailStore.currentAccount?.id;
    const res = await emailApi.getEmailList({
      accountId,
      folder: "INBOX",
      page: 1,
      size: 50,
    });
    if (res.data.success) {
      emails.value = res.data.data || [];
      emailStore.setEmails(emails.value);
      ElMessage.success("刷新成功");
    }
  } catch (error) {
    ElMessage.error("刷新失败");
  }
};

const viewEmail = (row: EmailMessage) => {
  if (row.id) {
    router.push(`/email/${row.id}`);
  }
};

const deleteEmail = async (row: EmailMessage) => {
  try {
    if (row.id) {
      await emailApi.deleteEmail(row.id);
      ElMessage.success("删除成功");
      refreshEmails();
    }
  } catch (error) {
    ElMessage.error("删除失败");
  }
};

const tableRowClassName = ({ row }: { row: EmailMessage }) => {
  return row.isRead ? "" : "unread-row";
};

const formatDate = (date: Date | undefined) => {
  if (!date) return "";
  return new Date(date).toLocaleString("zh-CN");
};

onMounted(() => {
  refreshEmails();
});
</script>

<style scoped>
.email-container {
  height: 100vh;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

:deep(.unread-row) {
  font-weight: bold;
  background-color: #f0f9ff;
}
</style>

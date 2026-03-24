<template>
  <div class="email-detail">
    <div class="detail-header">
      <el-button @click="goBack" type="text">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <div class="actions">
        <el-button @click="reply">
          <el-icon><Back /></el-icon>
          回复
        </el-button>
        <el-button @click="forward">
          <el-icon><Right /></el-icon>
          转发
        </el-button>
        <el-button type="danger" @click="deleteEmail">
          <el-icon><Delete /></el-icon>
          删除
        </el-button>
      </div>
    </div>

    <el-card v-loading="loading" class="detail-card">
      <template #header>
        <div class="card-header">
          <h2>{{ email.subject }}</h2>
          <el-tag v-if="email.isStarred" type="warning">
            <el-icon><Star /></el-icon>
            星标
          </el-tag>
        </div>
      </template>

      <div class="email-meta">
        <div class="meta-row">
          <span class="label">发件人：</span>
          <span class="value">{{ email.fromAddress }}</span>
        </div>
        <div class="meta-row">
          <span class="label">收件人：</span>
          <span class="value">{{ email.toAddresses?.join(", ") }}</span>
        </div>
        <div v-if="email.ccAddresses?.length" class="meta-row">
          <span class="label">抄送：</span>
          <span class="value">{{ email.ccAddresses.join(", ") }}</span>
        </div>
        <div class="meta-row">
          <span class="label">日期：</span>
          <span class="value">{{ formatDate(email.receivedDate) }}</span>
        </div>
      </div>

      <el-divider />

      <div class="email-content">
        <div
          v-if="email.contentHtml"
          v-html="sanitizeHtml(email.contentHtml)"
        />
        <pre v-else class="text-content">{{ email.contentText }}</pre>
      </div>

      <div v-if="email.hasAttachments" class="attachments">
        <el-divider />
        <h3>
          <el-icon><Paperclip /></el-icon>
          附件 ({{ attachments.length }})
        </h3>
        <div class="attachment-list">
          <el-card
            v-for="(attachment, index) in attachments"
            :key="index"
            class="attachment-item"
            shadow="hover"
          >
            <div class="attachment-info">
              <el-icon class="file-icon"><Document /></el-icon>
              <div class="file-details">
                <div class="file-name">{{ attachment.name }}</div>
                <div class="file-size">
                  {{ formatFileSize(attachment.size) }}
                </div>
              </div>
            </div>
            <el-button size="small" @click="downloadAttachment(attachment)">
              <el-icon><Download /></el-icon>
              下载
            </el-button>
          </el-card>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Delete,
} from "@element-plus/icons-vue";
import { emailApi, type EmailMessage } from "../../api/email";
import DOMPurify from "dompurify";

const router = useRouter();
const route = useRoute();
const loading = ref(false);

const email = ref<EmailMessage>({
});

interface Attachment {
  name: string;
  size: number;
  contentType: string;
  url?: string;
}

const attachments = ref<Attachment[]>([]);

const loadEmailDetail = async () => {
  const emailId = route.params.id as string;
  if (!emailId) {
    ElMessage.error("邮件ID不存在");
    goBack();
    return;
  }

  loading.value = true;
  try {
    const res: any = await emailApi.getEmailDetail(emailId);
    if (res.success) {
      email.value = res.data;
      // 标记为已读
      if (!email.value.isRead) {
        markAsRead(emailId);
      }
      // 加载附件列表
      if (email.value.hasAttachments) {
        loadAttachments(emailId);
      }
    } else {
      ElMessage.error("加载邮件失败");
      goBack();
    }
  } catch (error: any) {
    ElMessage.error(error.message || "加载邮件失败");
    goBack();
  } finally {
    loading.value = false;
  }
};

const markAsRead = async (emailId: string) => {
  try {
    // 调用标记已读API
    // await emailApi.markAsRead(emailId);
  } catch (error) {
    console.error("标记已读失败", error);
  }
};

const loadAttachments = async (emailId: string) => {
  try {
    // 调用获取附件列表API
    // const res: any = await emailApi.getAttachments(emailId);
    // if (res.success) {
    //   attachments.value = res.data;
    // }
    // 模拟数据
    attachments.value = [
      { name: "document.pdf", size: 1024000, contentType: "application/pdf" },
      { name: "image.jpg", size: 512000, contentType: "image/jpeg" },
    ];
  } catch (error) {
    console.error("加载附件失败", error);
  }
};

const sanitizeHtml = (html: string) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "a",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "blockquote",
      "code",
      "pre",
      "div",
      "span",
      "img",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "class", "style"],
  });
};

const formatDate = (date: Date | undefined) => {
  if (!date) return "";
  return new Date(date).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

const goBack = () => {
  router.back();
};

const reply = () => {
  router.push({
    name: "compose",
    query: {
      replyTo: email.value.id,
      to: email.value.fromAddress,
      subject: `Re: ${email.value.subject}`,
    },
  });
};

const forward = () => {
  router.push({
    name: "compose",
    query: {
      forward: email.value.id,
      subject: `Fwd: ${email.value.subject}`,
      content: email.value.contentText,
    },
  });
};

const deleteEmail = async () => {
  try {
    await ElMessageBox.confirm("确定要删除这封邮件吗？", "提示", {
      type: "warning",
      confirmButtonText: "确定",
      cancelButtonText: "取消",
    });

    if (email.value.id) {
      await emailApi.deleteEmail(email.value.id);
      ElMessage.success("删除成功");
      goBack();
    }
  } catch (error) {
    // 用户取消
  }
};

const downloadAttachment = async (attachment: Attachment) => {
  try {
    ElMessage.info(`下载附件: ${attachment.name}`);
    // 实现附件下载逻辑
    // const res = await emailApi.downloadAttachment(email.value.id!, attachment.name);
    // 创建下载链接
    // const url = window.URL.createObjectURL(new Blob([res.data]));
    // const link = document.createElement("a");
    // link.href = url;
    // link.download = attachment.name;
    // link.click();
    // window.URL.revokeObjectURL(url);
  } catch (error: any) {
    ElMessage.error(error.message || "下载失败");
  }
};

onMounted(() => {
  loadEmailDetail();
});
</script>

<style scoped>
.email-detail {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.actions {
  display: flex;
  gap: 10px;
}

.detail-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.email-meta {
  margin-bottom: 20px;
}

.meta-row {
  display: flex;
  margin-bottom: 10px;
  font-size: 14px;
}

.meta-row .label {
  font-weight: bold;
  color: #606266;
  min-width: 80px;
}

.meta-row .value {
  color: #303133;
}

.email-content {
  padding: 20px 0;
  font-size: 14px;
  line-height: 1.8;
  color: #303133;
}

.text-content {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
  margin: 0;
}

.attachments {
  margin-top: 20px;
}

.attachments h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  color: #303133;
  margin-bottom: 15px;
}

.attachment-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.attachment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
}

.attachment-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.file-icon {
  font-size: 32px;
  color: #409eff;
}

.file-details {
  flex: 1;
}

.file-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.file-size {
  font-size: 12px;
  color: #909399;
}

:deep(.el-card__body) {
  padding: 20px;
}
</style>

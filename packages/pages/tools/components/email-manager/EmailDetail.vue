<template>
  <div class="email-detail">
    <div class="email-detail__header">
      <div class="email-detail__actions">
        <el-button :icon="useRenderIcon('ri:arrow-left-line')" @click="$emit('back-to-list')"> 返回 </el-button>
        <div class="email-detail__actions-right">
          <el-button :icon="useRenderIcon('ri:reply-line')" @click="$emit('reply', email)"> 回复 </el-button>
          <el-button :icon="useRenderIcon('ri:share-forward-line')" @click="$emit('forward', email)"> 转发 </el-button>
          <el-button :icon="useRenderIcon('ri:delete-bin-line')" @click="$emit('delete', email)"> 删除 </el-button>
        </div>
      </div>

      <h2 class="email-detail__subject">{{ email.subject }}</h2>

      <div class="email-detail__meta">
        <div class="email-detail__sender">
          <el-avatar :size="40" :src="getSenderAvatar(email.from)">
            {{ getInitials(email.from) }}
          </el-avatar>
          <div class="email-detail__sender-info">
            <div class="email-detail__sender-name">{{ getSenderName(email.from) }}</div>
            <div class="email-detail__sender-email">{{ email.from }}</div>
          </div>
        </div>

        <div class="email-detail__date">
          {{ formatDate(email.date) }}
        </div>
      </div>

      <div class="email-detail__recipients">
        <div class="email-detail__recipients-label">收件人:</div>
        <div class="email-detail__recipients-list">{{ email.to }}</div>
      </div>

      <div v-if="email.cc" class="email-detail__recipients">
        <div class="email-detail__recipients-label">抄送:</div>
        <div class="email-detail__recipients-list">{{ email.cc }}</div>
      </div>
    </div>

    <div class="email-detail__content">
      <div v-if="isHtml" v-html="sanitizeHtml(email.content)"></div>
      <pre v-else>{{ email.content }}</pre>
    </div>

    <div v-if="email.attachments && email.attachments.length > 0" class="email-detail__attachments">
      <h3 class="email-detail__attachments-title">附件 ({{ email.attachments.length }})</h3>
      <div class="email-detail__attachments-list">
        <div v-for="(attachment, index) in email.attachments" :key="index" class="email-detail__attachment">
          <div class="email-detail__attachment-icon">
            <el-icon>
              <IconifyIconOffline :icon="getAttachmentIcon(attachment.type)" />
            </el-icon>
          </div>
          <div class="email-detail__attachment-info">
            <div class="email-detail__attachment-name">{{ attachment.name }}</div>
            <div class="email-detail__attachment-size">{{ formatSize(attachment.size) }}</div>
          </div>
          <div class="email-detail__attachment-actions">
            <el-button type="primary" size="small" @click="downloadAttachment(attachment)"> 下载 </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { IconifyIconOffline } from "@repo/components/ReIcon";

const props = defineProps({
  email: {
    type: Object,
    required: true,
  },
});

defineEmits(["reply", "forward", "delete", "back-to-list"]);

// 判断内容是否为HTML
const isHtml = computed(() => {
  return props.email.content && props.email.content.includes("<");
});

// 获取发件人头像
const getSenderAvatar = (email) => {
  // 这里可以根据邮箱地址获取头像，例如使用Gravatar服务
  // 暂时返回空，使用初始字母头像
  return "";
};

// 获取发件人姓名
const getSenderName = (email) => {
  // 从邮箱地址中提取名称部分
  if (!email) return "";
  const parts = email.split("@");
  if (parts.length > 0) {
    // 将用户名部分格式化为更友好的显示
    const username = parts[0];
    return username.charAt(0).toUpperCase() + username.slice(1).replace(/[._-]/g, " ");
  }
  return email;
};

// 获取姓名首字母（用于头像）
const getInitials = (name) => {
  if (!name) return "";

  // 如果是邮箱地址，先提取用户名部分
  if (name.includes("@")) {
    name = name.split("@")[0];
  }

  // 如果包含空格，取每个单词的首字母
  if (name.includes(" ")) {
    return name
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .substring(0, 2);
  }

  // 否则取前两个字符
  return name.substring(0, 2).toUpperCase();
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };

  return date.toLocaleDateString("zh-CN", options);
};

// 格式化文件大小
const formatSize = (bytes) => {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// 获取附件图标
const getAttachmentIcon = (type) => {
  if (!type) return "ri:file-line";

  type = type.toLowerCase();

  if (type.includes("image") || type.endsWith(".jpg") || type.endsWith(".png") || type.endsWith(".gif")) {
    return "ri:image-line";
  } else if (type.includes("pdf") || type.endsWith(".pdf")) {
    return "ri:file-pdf-line";
  } else if (type.includes("word") || type.endsWith(".doc") || type.endsWith(".docx")) {
    return "ri:file-word-line";
  } else if (type.includes("excel") || type.endsWith(".xls") || type.endsWith(".xlsx")) {
    return "ri:file-excel-line";
  } else if (type.includes("powerpoint") || type.endsWith(".ppt") || type.endsWith(".pptx")) {
    return "ri:file-ppt-line";
  } else if (type.includes("zip") || type.includes("rar") || type.includes("7z") || type.endsWith(".zip") || type.endsWith(".rar") || type.endsWith(".7z")) {
    return "ri:file-zip-line";
  } else if (type.includes("audio") || type.endsWith(".mp3") || type.endsWith(".wav")) {
    return "ri:file-music-line";
  } else if (type.includes("video") || type.endsWith(".mp4") || type.endsWith(".avi")) {
    return "ri:file-video-line";
  } else if (type.includes("text") || type.endsWith(".txt")) {
    return "ri:file-text-line";
  } else if (type.includes("code") || type.endsWith(".js") || type.endsWith(".html") || type.endsWith(".css") || type.endsWith(".py") || type.endsWith(".java")) {
    return "ri:file-code-line";
  }

  return "ri:file-line";
};

// 下载附件
const downloadAttachment = (attachment) => {
  // 实际应用中，这里应该调用API下载附件
  if (attachment.url) {
    window.open(attachment.url, "_blank");
  } else {
    console.warn("附件没有下载链接");
  }
};

// 净化HTML内容，防止XSS攻击
const sanitizeHtml = (html) => {
  // 实际应用中，应该使用专门的HTML净化库，如DOMPurify
  // 这里简单实现，仅作示例
  if (!html) return "";

  // 移除可能的脚本标签和事件处理器
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/g, "")
    .replace(/on\w+='[^']*'/g, "");
};
</script>

<style lang="scss" scoped>
.email-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;

  &__header {
    padding: 20px;
    border-bottom: 1px solid #ebeef5;
  }

  &__actions {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;

    &-right {
      display: flex;
      gap: 10px;
    }
  }

  &__subject {
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 20px 0;
    color: #303133;
  }

  &__meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }

  &__sender {
    display: flex;
    align-items: center;

    &-info {
      margin-left: 12px;
    }

    &-name {
      font-weight: 500;
      font-size: 16px;
      color: #303133;
    }

    &-email {
      font-size: 14px;
      color: #909399;
    }
  }

  &__date {
    font-size: 14px;
    color: #909399;
  }

  &__recipients {
    display: flex;
    margin-bottom: 10px;

    &-label {
      width: 70px;
      color: #606266;
      font-weight: 500;
    }

    &-list {
      flex: 1;
      word-break: break-all;
    }
  }

  &__content {
    flex: 1;
    padding: 20px;
    overflow: auto;
    background-color: #f8f9fa;
    line-height: 1.6;

    pre {
      white-space: pre-wrap;
      font-family: inherit;
      margin: 0;
    }
  }

  &__attachments {
    padding: 20px;
    border-top: 1px solid #ebeef5;

    &-title {
      font-size: 16px;
      font-weight: 500;
      margin: 0 0 15px 0;
      color: #303133;
    }

    &-list {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
    }
  }

  &__attachment {
    display: flex;
    align-items: center;
    padding: 12px;
    border: 1px solid #ebeef5;
    border-radius: 6px;
    background-color: #f8f9fa;
    width: calc(50% - 8px);

    &-icon {
      font-size: 24px;
      color: #409eff;
      margin-right: 12px;
    }

    &-info {
      flex: 1;
      min-width: 0;
    }

    &-name {
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &-size {
      font-size: 12px;
      color: #909399;
    }

    &-actions {
      margin-left: 10px;
    }
  }
}

@media (max-width: 768px) {
  .email-detail {
    &__actions {
      flex-direction: column;
      gap: 10px;

      &-right {
        justify-content: space-between;
      }
    }

    &__meta {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
    }

    &__date {
      align-self: flex-end;
    }

    &__recipients {
      flex-direction: column;

      &-label {
        width: auto;
        margin-bottom: 5px;
      }
    }

    &__attachment {
      width: 100%;
    }
  }
}
</style>

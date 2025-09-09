<script setup>
import { computed } from "vue";
import { IconifyIconOnline } from "@iconify/vue";

const props = defineProps({
  email: {
    type: Object,
    default: null,
  },
  labels: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "reply", "reply-all", "forward", "delete", "star", "mark-important", "add-label", "remove-label", "move-to-folder"]);

// 格式化日期
const formattedDate = computed(() => {
  if (!props.email) return "";

  const date = new Date(props.email.emailDate);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
});

// 获取邮件标签
const emailLabels = computed(() => {
  if (!props.email || !props.email.emailLabels || props.email.emailLabels.length === 0) {
    return [];
  }

  return props.labels.filter((label) => props.email.emailLabels.includes(label.emailLabelId));
});

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes < 1024) {
    return bytes + " B";
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + " KB";
  } else {
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }
};

// 处理关闭
const handleClose = () => {
  emit("close");
};

// 处理回复
const handleReply = () => {
  emit("reply", props.email);
};

// 处理回复全部
const handleReplyAll = () => {
  emit("reply-all", props.email);
};

// 处理转发
const handleForward = () => {
  emit("forward", props.email);
};

// 处理删除
const handleDelete = () => {
  emit("delete", props.email.emailId);
};

// 处理星标
const handleStar = () => {
  emit("star", props.email.emailId, !props.email.emailIsStarred);
};

// 处理标记重要
const handleMarkImportant = () => {
  emit("mark-important", props.email.emailId, !props.email.emailIsImportant);
};

// 处理添加标签
const handleAddLabel = (labelId) => {
  emit("add-label", props.email.emailId, labelId);
};

// 处理移除标签
const handleRemoveLabel = (labelId) => {
  emit("remove-label", props.email.emailId, labelId);
};

// 处理移动到文件夹
const handleMoveToFolder = (folderId) => {
  emit("move-to-folder", props.email.emailId, folderId);
};
</script>

<template>
  <div class="email-detail">
    <!-- 加载中 -->
    <div class="email-detail__loading" v-if="loading">
      <el-skeleton :rows="15" animated />
    </div>

    <!-- 无选中邮件提示 -->
    <div class="email-detail__empty" v-else-if="!email">
      <IconifyIconOnline icon="ri:mail-open-line" class="email-detail__empty-icon" />
      <div class="email-detail__empty-text">请选择一封邮件查看详情</div>
    </div>

    <!-- 邮件详情 -->
    <div class="email-detail__content" v-else>
      <!-- 头部操作栏 -->
      <div class="email-detail__header">
        <div class="email-detail__actions">
          <el-button type="primary" text circle @click="handleClose">
            <IconifyIconOnline icon="ri:arrow-left-line" />
          </el-button>
          <el-button type="primary" text circle @click="handleReply">
            <IconifyIconOnline icon="ri:reply-line" />
          </el-button>
          <el-button type="primary" text circle @click="handleReplyAll">
            <IconifyIconOnline icon="ri:reply-all-line" />
          </el-button>
          <el-button type="primary" text circle @click="handleForward">
            <IconifyIconOnline icon="ri:share-forward-line" />
          </el-button>
          <el-button type="danger" text circle @click="handleDelete">
            <IconifyIconOnline icon="ri:delete-bin-line" />
          </el-button>
        </div>

        <div class="email-detail__status">
          <el-button :type="email.emailIsStarred ? 'warning' : 'default'" text circle @click="handleStar">
            <IconifyIconOnline :icon="email.emailIsStarred ? 'ri:star-fill' : 'ri:star-line'" />
          </el-button>
          <el-button :type="email.emailIsImportant ? 'primary' : 'default'" text circle @click="handleMarkImportant">
            <IconifyIconOnline :icon="email.emailIsImportant ? 'ri:bookmark-fill' : 'ri:bookmark-line'" />
          </el-button>

          <el-dropdown trigger="click">
            <el-button type="primary" text circle>
              <IconifyIconOnline icon="ri:price-tag-3-line" />
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="label in labels" :key="label.emailLabelId">
                  <div class="email-detail__label-item" @click="handleAddLabel(label.emailLabelId)">
                    <div class="email-detail__label-color" :style="{ backgroundColor: label.emailLabelColor }"></div>
                    <span>{{ label.emailLabelName }}</span>
                    <IconifyIconOnline v-if="email.emailLabels && email.emailLabels.includes(label.emailLabelId)" icon="ri:check-line" class="email-detail__label-check" />
                  </div>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 邮件主题 -->
      <div class="email-detail__subject">{{ email.emailSubject }}</div>

      <!-- 邮件标签 -->
      <div class="email-detail__labels" v-if="emailLabels.length > 0">
        <div v-for="label in emailLabels" :key="label.emailLabelId" class="email-detail__label" :style="{ backgroundColor: label.emailLabelColor + '33', color: label.emailLabelColor }">
          {{ label.emailLabelName }}
          <IconifyIconOnline icon="ri:close-line" class="email-detail__label-remove" @click="handleRemoveLabel(label.emailLabelId)" />
        </div>
      </div>

      <!-- 发件人信息 -->
      <div class="email-detail__sender">
        <div class="email-detail__sender-avatar">
          <img :src="email.emailSender.emailAvatar" :alt="email.emailSender.emailName" />
        </div>
        <div class="email-detail__sender-info">
          <div class="email-detail__sender-name">
            {{ email.emailSender.emailName }}
            <span class="email-detail__sender-address">&lt;{{ email.emailSender.emailAddress }}&gt;</span>
          </div>
          <div class="email-detail__date">{{ formattedDate }}</div>
        </div>
      </div>

      <!-- 收件人信息 -->
      <div class="email-detail__recipients">
        <div class="email-detail__recipients-group" v-if="email.emailRecipients.emailTo.length > 0">
          <div class="email-detail__recipients-label">收件人：</div>
          <div class="email-detail__recipients-list">
            <span v-for="(recipient, index) in email.emailRecipients.emailTo" :key="index" class="email-detail__recipient"> {{ recipient.emailName }} &lt;{{ recipient.emailAddress }}&gt;{{ index < email.emailRecipients.emailTo.length - 1 ? "，" : "" }} </span>
          </div>
        </div>

        <div class="email-detail__recipients-group" v-if="email.emailRecipients.emailCc && email.emailRecipients.emailCc.length > 0">
          <div class="email-detail__recipients-label">抄送：</div>
          <div class="email-detail__recipients-list">
            <span v-for="(recipient, index) in email.emailRecipients.emailCc" :key="index" class="email-detail__recipient"> {{ recipient.emailName }} &lt;{{ recipient.emailAddress }}&gt;{{ index < email.emailRecipients.emailCc.length - 1 ? "，" : "" }} </span>
          </div>
        </div>
      </div>

      <!-- 邮件正文 -->
      <div class="email-detail__body" v-html="email.emailContent"></div>

      <!-- 附件 -->
      <div class="email-detail__attachments" v-if="email.emailAttachments && email.emailAttachments.length > 0">
        <div class="email-detail__attachments-title">
          <IconifyIconOnline icon="ri:attachment-2" />
          <span>附件 ({{ email.emailAttachments.length }})</span>
        </div>
        <div class="email-detail__attachments-list">
          <div v-for="attachment in email.emailAttachments" :key="attachment.emailAttachmentId" class="email-detail__attachment">
            <div class="email-detail__attachment-icon">
              <IconifyIconOnline
                :icon="
                  attachment.emailAttachmentType.includes('image')
                    ? 'ri:image-line'
                    : attachment.emailAttachmentType.includes('pdf')
                      ? 'ri:file-pdf-line'
                      : attachment.emailAttachmentType.includes('word')
                        ? 'ri:file-word-line'
                        : attachment.emailAttachmentType.includes('excel') || attachment.emailAttachmentType.includes('sheet')
                          ? 'ri:file-excel-line'
                          : 'ri:file-line'
                "
              />
            </div>
            <div class="email-detail__attachment-info">
              <div class="email-detail__attachment-name">{{ attachment.emailAttachmentName }}</div>
              <div class="email-detail__attachment-size">{{ formatFileSize(attachment.emailAttachmentSize) }}</div>
            </div>
            <div class="email-detail__attachment-actions">
              <el-button type="primary" text size="small" @click="window.open(attachment.emailAttachmentUrl, '_blank')">
                <IconifyIconOnline icon="ri:download-line" />
                <span>下载</span>
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.email-detail {
  height: 100%;
  background-color: var(--el-bg-color);
  overflow-y: auto;

  &__loading {
    padding: 20px;
  }

  &__empty {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px;
  }

  &__empty-icon {
    font-size: 64px;
    color: var(--el-text-color-placeholder);
    margin-bottom: 16px;
  }

  &__empty-text {
    font-size: 16px;
    color: var(--el-text-color-secondary);
  }

  &__content {
    padding: 20px;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  &__actions,
  &__status {
    display: flex;
    gap: 8px;
  }

  &__subject {
    font-size: 24px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 16px;
  }

  &__labels {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }

  &__label {
    display: flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 16px;
    font-size: 12px;

    &-item {
      display: flex;
      align-items: center;
      width: 100%;
    }

    &-color {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-right: 8px;
    }

    &-check {
      margin-left: auto;
      color: var(--el-color-primary);
    }

    &-remove {
      margin-left: 6px;
      cursor: pointer;

      &:hover {
        opacity: 0.8;
      }
    }
  }

  &__sender {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--el-border-color-light);

    &-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      overflow: hidden;
      margin-right: 16px;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    &-info {
      flex: 1;
    }

    &-name {
      font-size: 16px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      margin-bottom: 4px;
    }

    &-address {
      font-weight: normal;
      color: var(--el-text-color-secondary);
      margin-left: 8px;
    }
  }

  &__date {
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }

  &__recipients {
    margin-bottom: 24px;

    &-group {
      display: flex;
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    &-label {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      min-width: 60px;
    }

    &-list {
      flex: 1;
      font-size: 14px;
      color: var(--el-text-color-primary);
    }
  }

  &__body {
    margin-bottom: 24px;
    padding: 16px;
    background-color: var(--el-bg-color-page);
    border-radius: 8px;
    font-size: 14px;
    line-height: 1.6;
    color: var(--el-text-color-primary);

    :deep(p) {
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    :deep(ul),
    :deep(ol) {
      margin-bottom: 16px;
      padding-left: 24px;
    }
  }

  &__attachments {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--el-border-color-light);

    &-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      margin-bottom: 16px;
    }

    &-list {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }
  }

  &__attachment {
    display: flex;
    align-items: center;
    padding: 12px;
    background-color: var(--el-bg-color-page);
    border-radius: 8px;
    width: calc(50% - 8px);

    &-icon {
      font-size: 24px;
      color: var(--el-text-color-secondary);
      margin-right: 12px;
    }

    &-info {
      flex: 1;
      min-width: 0;
    }

    &-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &-size {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    &-actions {
      margin-left: 12px;
    }
  }
}
</style>

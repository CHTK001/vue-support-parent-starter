<script setup>
import { computed } from "vue";
import { IconifyIconOnline } from "@iconify/vue";

const props = defineProps({
  email: {
    type: Object,
    required: true,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
  labels: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["select", "star", "mark-important", "mark-read"]);

// 格式化日期
const formattedDate = computed(() => {
  const date = new Date(props.email.emailDate);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  } else {
    return date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
  }
});

// 获取邮件标签
const emailLabels = computed(() => {
  if (!props.email.emailLabels || props.email.emailLabels.length === 0) {
    return [];
  }

  return props.labels.filter((label) => props.email.emailLabels.includes(label.emailLabelId));
});

// 获取附件数量
const attachmentCount = computed(() => {
  return props.email.emailAttachments?.length || 0;
});

// 处理选择邮件
const handleSelect = () => {
  emit("select", props.email.emailId);
};

// 处理星标
const handleStar = (e) => {
  e.stopPropagation();
  emit("star", props.email.emailId, !props.email.emailIsStarred);
};

// 处理标记重要
const handleImportant = (e) => {
  e.stopPropagation();
  emit("mark-important", props.email.emailId, !props.email.emailIsImportant);
};

// 处理标记已读/未读
const handleRead = (e) => {
  e.stopPropagation();
  emit("mark-read", props.email.emailId, !props.email.emailIsRead);
};
</script>

<template>
  <div
    class="email-list-item"
    :class="{
      'is-selected': isSelected,
      'is-unread': !email.emailIsRead,
    }"
    @click="handleSelect"
  >
    <!-- 左侧操作区 -->
    <div class="email-list-item__actions">
      <div class="email-list-item__action" @click="handleRead">
        <IconifyIconOnline :icon="email.emailIsRead ? 'ri:mail-open-line' : 'ri:mail-line'" :class="{ 'is-active': !email.emailIsRead }" />
      </div>
      <div class="email-list-item__action" @click="handleStar">
        <IconifyIconOnline :icon="email.emailIsStarred ? 'ri:star-fill' : 'ri:star-line'" :class="{ 'is-active': email.emailIsStarred }" />
      </div>
      <div class="email-list-item__action" @click="handleImportant">
        <IconifyIconOnline :icon="email.emailIsImportant ? 'ri:bookmark-fill' : 'ri:bookmark-line'" :class="{ 'is-active': email.emailIsImportant }" />
      </div>
    </div>

    <!-- 发件人头像 -->
    <div class="email-list-item__avatar">
      <img :src="email.emailSender.emailAvatar" :alt="email.emailSender.emailName" />
    </div>

    <!-- 邮件内容预览 -->
    <div class="email-list-item__content">
      <div class="email-list-item__sender">{{ email.emailSender.emailName }}</div>
      <div class="email-list-item__subject">{{ email.emailSubject }}</div>
      <div class="email-list-item__preview" v-html="email.emailContent.replace(/<[^>]*>/g, '').substring(0, 80) + '...'"></div>
    </div>

    <!-- 右侧信息区 -->
    <div class="email-list-item__info">
      <!-- 日期 -->
      <div class="email-list-item__date">{{ formattedDate }}</div>

      <!-- 标签 -->
      <div class="email-list-item__labels" v-if="emailLabels.length > 0">
        <div v-for="label in emailLabels.slice(0, 2)" :key="label.emailLabelId" class="email-list-item__label" :style="{ backgroundColor: label.emailLabelColor + '33', color: label.emailLabelColor }">
          {{ label.emailLabelName }}
        </div>
        <div class="email-list-item__label-more" v-if="emailLabels.length > 2">+{{ emailLabels.length - 2 }}</div>
      </div>

      <!-- 附件图标 -->
      <div class="email-list-item__attachment" v-if="attachmentCount > 0">
        <IconifyIconOnline icon="ri:attachment-2" />
        <span>{{ attachmentCount }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.email-list-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background-color: var(--el-fill-color-light);
  }

  &.is-selected {
    background-color: var(--el-color-primary-light-9);
  }

  &.is-unread {
    background-color: var(--el-bg-color);

    .email-list-item__sender,
    .email-list-item__subject {
      font-weight: 600;
    }

    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background-color: var(--el-color-primary);
      border-radius: 0 2px 2px 0;
    }
  }

  &__actions {
    display: flex;
    gap: 8px;
    margin-right: 12px;
  }

  &__action {
    font-size: 18px;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    transition: all 0.2s ease;

    &:hover {
      background-color: var(--el-fill-color);
      color: var(--el-color-primary);
    }

    .is-active {
      color: var(--el-color-primary);
    }
  }

  &__avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    margin-right: 16px;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__content {
    flex: 1;
    min-width: 0;
    margin-right: 16px;
  }

  &__sender {
    font-size: 14px;
    color: var(--el-text-color-primary);
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__subject {
    font-size: 14px;
    color: var(--el-text-color-primary);
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__preview {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__info {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    min-width: 100px;
  }

  &__date {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 8px;
  }

  &__labels {
    display: flex;
    gap: 4px;
    margin-bottom: 8px;
  }

  &__label {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    white-space: nowrap;
  }

  &__label-more {
    font-size: 10px;
    color: var(--el-text-color-secondary);
    padding: 2px 6px;
  }

  &__attachment {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>

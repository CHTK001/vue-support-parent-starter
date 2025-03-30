<script setup>
import { defineProps, defineEmits, computed } from 'vue';
import { IconifyIconOnline } from '@iconify/vue';

const props = defineProps({
  email: {
    type: Object,
    required: true
  },
  isSelected: {
    type: Boolean,
    default: false
  },
  labels: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['select', 'star', 'mark-important', 'mark-read']);

// 格式化日期
const formattedDate = computed(() => {
  const date = new Date(props.email.emailDate);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
  }
});

// 获取邮件标签
const emailLabels = computed(() => {
  if (!props.email.emailLabels || props.email.emailLabels.length === 0) {
    return [];
  }
  
  return props.labels.filter(label => props.email.emailLabels.includes(label.emailLabelId));
});

// 获取附件数量
const attachmentCount = computed(() => {
  return props.email.emailAttachments?.length || 0;
});

// 处理选择邮件
const handleSelect = () => {
  emit('select', props.email.emailId);
};

// 处理星标
const handleStar = (e) => {
  e.stopPropagation();
  emit('star', props.email.emailId, !props.email.emailIsStarred);
};

// 处理标记重要
const handleImportant = (e) => {
  e.stopPropagation();
  emit('mark-important', props.email.emailId, !props.email.emailIsImportant);
};

// 处理标记已读/未读
const handleRead = (e) => {
  e.stopPropagation();
  emit('mark-read', props.email.emailId, !props.email.emailIsRead);
};
</script>

<template>
  <div 
    class="email-list-item" 
    :class="{ 
      'is-selected': isSelected, 
      'is-unread': !email.emailIsRead 
    }"
    @click="handleSelect"
  >
    <!-- 左侧操作区 -->
    <div class="email-list-item__actions">
      <div class="email-list-item__action" @click="handleRead">
        <IconifyIconOnline 
          :icon="email.emailIsRead ? 'ri:mail-open-line' : 'ri:mail-line'" 
          :class="{ 'is-active': !email.emailIsRead }"
        />
      </div>
      <div class="email-list-item__action" @click="handleStar">
        <IconifyIconOnline 
          :icon="email.emailIsStarred ? 'ri:star-fill' : 'ri:star-line'" 
          :class="{ 'is-active': email.emailIsStarred }"
        />
      </div>
      <div class="email-list-item__action" @click="handleImportant">
        <IconifyIconOnline 
          :icon="email.emailIsImportant ? 'ri:bookmark-fill' : 'ri:bookmark-line'" 
          :class="{ 'is-active': email.emailIsImportant }"
        />
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
    
    <!-- 右
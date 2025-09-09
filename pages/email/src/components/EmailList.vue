<script setup>
import { ref, computed } from "vue";
import { IconifyIconOnline } from "@iconify/vue";
import EmailListItem from "./EmailListItem.vue";

const props = defineProps({
  emails: {
    type: Array,
    required: true,
  },
  labels: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  selectedEmailId: {
    type: String,
    default: "",
  },
  totalEmails: {
    type: Number,
    default: 0,
  },
  currentPage: {
    type: Number,
    default: 1,
  },
  pageSize: {
    type: Number,
    default: 20,
  },
});

const emit = defineEmits(["select-email", "star-email", "mark-important", "mark-read", "page-change", "refresh"]);

// 处理选择邮件
const handleSelectEmail = (emailId) => {
  emit("select-email", emailId);
};

// 处理星标
const handleStarEmail = (emailId, isStarred) => {
  emit("star-email", emailId, isStarred);
};

// 处理标记重要
const handleMarkImportant = (emailId, isImportant) => {
  emit("mark-important", emailId, isImportant);
};

// 处理标记已读/未读
const handleMarkRead = (emailId, isRead) => {
  emit("mark-read", emailId, isRead);
};

// 处理页码变化
const handlePageChange = (page) => {
  emit("page-change", page);
};

// 刷新邮件列表
const handleRefresh = () => {
  emit("refresh");
};
</script>

<template>
  <div class="email-list">
    <!-- 列表头部 -->
    <div class="email-list__header">
      <div class="email-list__title">
        <span>邮件列表</span>
        <span class="email-list__count" v-if="totalEmails > 0">({{ totalEmails }})</span>
      </div>
      <div class="email-list__actions">
        <el-button type="primary" text circle @click="handleRefresh">
          <IconifyIconOnline icon="ri:refresh-line" />
        </el-button>
      </div>
    </div>

    <!-- 加载中 -->
    <div class="email-list__loading" v-if="loading">
      <el-skeleton :rows="10" animated />
    </div>

    <!-- 邮件列表 -->
    <div class="email-list__items" v-else-if="emails.length > 0">
      <EmailListItem v-for="email in emails" :key="email.emailId" :email="email" :is-selected="email.emailId === selectedEmailId" :labels="labels" @select="handleSelectEmail" @star="handleStarEmail" @mark-important="handleMarkImportant" @mark-read="handleMarkRead" />
    </div>

    <!-- 无邮件提示 -->
    <div class="email-list__empty" v-else>
      <IconifyIconOnline icon="ri:inbox-archive-line" class="email-list__empty-icon" />
      <div class="email-list__empty-text">没有邮件</div>
    </div>

    <!-- 分页 -->
    <div class="email-list__pagination" v-if="totalEmails > pageSize">
      <el-pagination v-model:current-page="currentPage" :page-size="pageSize" layout="prev, pager, next" :total="totalEmails" @current-change="handlePageChange" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.email-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-light);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid var(--el-border-color-light);
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    display: flex;
    align-items: center;
  }

  &__count {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin-left: 8px;
    font-weight: normal;
  }

  &__actions {
    display: flex;
    gap: 8px;
  }

  &__items {
    flex: 1;
    overflow-y: auto;
  }

  &__loading {
    padding: 16px;
  }

  &__empty {
    flex: 1;
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

  &__pagination {
    padding: 16px;
    display: flex;
    justify-content: center;
    border-top: 1px solid var(--el-border-color-light);
  }
}
</style>

<script setup>
import { defineEmits } from "vue";
import { IconifyIconOnline } from "@iconify/vue";
import EmailAccountSelector from "./EmailAccountSelector.vue";

const props = defineProps({
  accounts: {
    type: Array,
    required: true,
  },
  folders: {
    type: Array,
    required: true,
  },
  labels: {
    type: Array,
    required: true,
  },
  selectedAccountId: {
    type: String,
    default: "",
  },
  selectedFolderId: {
    type: String,
    default: "",
  },
  selectedLabelId: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["select-account", "select-folder", "select-label", "compose-email"]);

const selectAccount = (accountId) => {
  emit("select-account", accountId);
};

const selectFolder = (folderId) => {
  emit("select-folder", folderId);
};

const selectLabel = (labelId) => {
  emit("select-label", labelId);
};

const composeEmail = () => {
  emit("compose-email");
};
</script>

<template>
  <div class="email-sidebar">
    <!-- 账户选择器 -->
    <div class="email-sidebar__account">
      <EmailAccountSelector :accounts="accounts" :selectedAccountId="selectedAccountId" @select-account="selectAccount" />
    </div>

    <!-- 写邮件按钮 -->
    <div class="email-sidebar__compose">
      <ScButton type="primary" @click="composeEmail" class="email-sidebar__compose-btn">
        <IconifyIconOnline icon="ri:add-line" class="email-sidebar__compose-icon" />
        <span>写邮件</span>
      </ScButton>
    </div>

    <!-- 文件夹列表 -->
    <div class="email-sidebar__section">
      <div class="email-sidebar__section-title">文件夹</div>
      <div class="email-sidebar__folders">
        <div v-for="folder in folders" :key="folder.emailFolderId" class="email-sidebar__folder" :class="{ 'is-active': folder.emailFolderId === selectedFolderId }" @click="selectFolder(folder.emailFolderId)">
          <div class="email-sidebar__folder-icon">
            <IconifyIconOnline :icon="folder.emailFolderIcon" />
          </div>
          <div class="email-sidebar__folder-name">{{ folder.emailFolderName }}</div>
          <div class="email-sidebar__folder-count" v-if="folder.emailFolderCount > 0">
            {{ folder.emailFolderCount }}
          </div>
        </div>
      </div>
    </div>

    <!-- 标签列表 -->
    <div class="email-sidebar__section">
      <div class="email-sidebar__section-title">标签</div>
      <div class="email-sidebar__labels">
        <div v-for="label in labels" :key="label.emailLabelId" class="email-sidebar__label" :class="{ 'is-active': label.emailLabelId === selectedLabelId }" @click="selectLabel(label.emailLabelId)">
          <div class="email-sidebar__label-color" :style="{ backgroundColor: label.emailLabelColor }"></div>
          <div class="email-sidebar__label-name">{{ label.emailLabelName }}</div>
          <div class="email-sidebar__label-count" v-if="label.emailLabelCount > 0">
            {{ label.emailLabelCount }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.email-sidebar {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color-page);
  border-right: 1px solid var(--el-border-color-light);

  &__account {
    padding: 16px;
    border-bottom: 1px solid var(--el-border-color-light);
  }

  &__compose {
    padding: 16px;

    &-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 44px;
      border-radius: 22px;
      font-size: 16px;
    }

    &-icon {
      font-size: 20px;
    }
  }

  &__section {
    padding: 16px;

    &-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-secondary);
      margin-bottom: 12px;
      padding-left: 8px;
    }
  }

  &__folders {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__folder {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background-color: var(--el-fill-color-light);
    }

    &.is-active {
      background-color: var(--el-color-primary-light-9);

      .email-sidebar__folder-icon,
      .email-sidebar__folder-name {
        color: var(--el-color-primary);
      }
    }

    &-icon {
      font-size: 18px;
      color: var(--el-text-color-regular);
      margin-right: 12px;
    }

    &-name {
      flex: 1;
      font-size: 14px;
      color: var(--el-text-color-primary);
    }

    &-count {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      background-color: var(--el-fill-color);
      min-width: 24px;
      height: 24px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 8px;
    }
  }

  &__labels {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__label {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background-color: var(--el-fill-color-light);
    }

    &.is-active {
      background-color: var(--el-color-primary-light-9);

      .email-sidebar__label-name {
        color: var(--el-color-primary);
      }
    }

    &-color {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-right: 12px;
    }

    &-name {
      flex: 1;
      font-size: 14px;
      color: var(--el-text-color-primary);
    }

    &-count {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      background-color: var(--el-fill-color);
      min-width: 24px;
      height: 24px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 8px;
    }
  }
}
</style>

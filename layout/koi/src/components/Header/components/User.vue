<template>
  <div class="user-container">
    <el-popover
      placement="bottom-end"
      :width="240"
      trigger="hover"
      :show-arrow="false"
      :offset="2"
      popper-style="border-radius: 10px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);"
    >
      <template #reference>
        <el-image class="user-avatar" :src="avatar"></el-image>
      </template>

      <div class="user-card-content">
        <div class="user-card-header">
          <el-image class="user-avatar-lg" :src="avatar"></el-image>
          <div class="user-info">
            <div class="user-name">{{ userName }}</div>
            <div class="user-phone">{{ userPhone }}</div>
          </div>
        </div>
        <div class="user-card-menu">
          <div class="user-menu-item" @click="handleCommand('koiMine')">
            <el-icon :size="15"><User /></el-icon>
            <span>Personal Center</span>
          </div>
        </div>
        <div class="user-card-footer">
          <el-button icon="SwitchButton" plain @click="handleCommand('logout')">Logout</el-button>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { User } from "@element-plus/icons-vue";
import { LOGIN_URL } from "../../../config/index";
import { useRouter } from "vue-router";
import { useKoiAuthStore } from "../../../stores/auth";
import { useKoiTabsStore } from "../../../stores/tabs";
import { useKoiKeepAliveStore } from "../../../stores/keepAlive";

const authStore = useKoiAuthStore();
const tabsStore = useKoiTabsStore();
const keepAliveStore = useKoiKeepAliveStore();
const router = useRouter();

const userName = ref("User");
const userPhone = ref("18888888888");
const avatar = ref("https://pic4.zhimg.com/v2-702a23ebb518199355099df77a3cfe07_1440w.webp");

const handleLayout = () => {
  tabsStore.$reset();
  keepAliveStore.$reset();
  authStore.$reset();
  window.location.replace(LOGIN_URL);
};

const handleCommand = (command: string | number) => {
  switch (command) {
    case "koiMine": router.push("/system/personage"); break;
    case "logout": handleLayout(); break;
  }
};
</script>

<style lang="scss" scoped>
.user-container { margin-left: 6px; position: relative; display: flex; align-items: center; }

.user-avatar {
  width: 32px; height: 32px; border-radius: 50%; user-select: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  &:hover { transform: scale(1.05); }
}

.user-avatar-lg {
  width: 36px; height: 36px; border-radius: 50%; user-select: none;
}

.user-card-content { padding: 0px; }

.user-card-header {
  display: flex; align-items: center;
  padding-bottom: 12px; border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 10px;
}

.user-info { margin-left: 12px; flex: 1; }
.user-name {
  font-size: 15px; font-weight: 500; color: var(--el-text-color-primary);
  margin-bottom: 3px; line-height: 1.2;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px;
}
.user-phone {
  font-size: 13px; color: var(--el-text-color-regular); line-height: 1.2;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px;
}

.user-card-menu { display: flex; flex-direction: column; gap: 3px; }
.user-menu-item {
  display: flex; align-items: center; width: auto; height: 36px;
  padding: 8px 10px; font-size: 13px; user-select: none;
  background-color: transparent; border-radius: 6px;
  transition: all 0.3s ease; cursor: pointer; line-height: 1;
  &:hover { color: var(--el-color-primary); background-color: var(--el-color-primary-light-9); }
  .el-icon { margin-right: 8px; font-size: 14px; flex-shrink: 0; }
  span {
    font-size: 13px; white-space: nowrap; overflow: hidden;
    text-overflow: ellipsis; flex: 1; line-height: 1;
  }
}

.user-card-footer {
  display: flex; align-items: center;
  padding-top: 12px; border-top: 1px solid var(--el-border-color-lighter);
  margin-top: 10px;
  .el-button { width: 100%; }
}
</style>

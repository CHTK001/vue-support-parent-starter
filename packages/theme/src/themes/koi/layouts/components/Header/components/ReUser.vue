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
        <div class="user-avatar-ring" :style="{ padding: frameSpill(32) + 'px' }">
          <div class="user-avatar-frame">
            <div v-if="avatarFrameVisible" class="user-avatar-frame-layer" :style="avatarFrameStyle(32)"></div>
            <el-image class="user-avatar" fit="cover" :src="avatar"></el-image>
          </div>
        </div>
      </template>

      <!-- 用户信息卡片内容 -->
      <div class="user-card-content">
        <div class="user-card-header">
          <div class="user-avatar-card-wrap" :style="{ padding: frameSpill(36) + 'px' }">
            <div v-if="avatarFrameVisible" class="user-avatar-card-layer" :style="avatarFrameStyle(36)"></div>
            <el-image class="user-avatar-card" fit="cover" :src="avatar"></el-image>
          </div>
          <div class="user-info">
            <div class="user-name">{{ userName }}</div>
            <div class="user-phone">{{ userPhone }}</div>
          </div>
        </div>
        <div class="user-card-menu">
          <div
            v-if="isLoggedIn && toolbarConfig.userMenu.personalCenter"
            class="user-menu-item"
            @click="handleCommand('koiMine')"
          >
            <el-icon :size="15"><User /></el-icon>
            <span>{{ $t("header.personalCenter") }}</span>
          </div>
          <div
            v-if="isLoggedIn && toolbarConfig.userMenu.lock"
            class="user-menu-item"
            @click="handleCommand('lock')"
          >
            <el-icon :size="15"><Lock /></el-icon>
            <span>锁屏</span>
          </div>
        </div>
        <div class="user-card-footer">
          <el-button icon="SwitchButton" plain @click="handleCommand('logout')">
            {{ $t("header.logout") }}
          </el-button>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { User, Lock } from "@element-plus/icons-vue";
import { clearSessionStorage, resolveUserDisplayInfo, getAccessToken } from "@repo/utils";
import { LOGIN_URL, getConfig } from "@repo/config";
import { defaultAvatarUrl } from "@repo/assets";
import { useRouter } from "vue-router";
import useAuthStore from "@repo/pinia/modules/auth";
import useUserStore from "@repo/pinia/modules/user";
import useTabsStore from "@repo/pinia/modules/tabs";
import useKeepAliveStore from "@repo/pinia/modules/keepAlive";
import KoiLockScreen from "../../LockScreen/index.vue";
import { useWornAvatarFrame } from "@repo/theme/koi/components/useWornAvatarFrame";

const lockScreenRef = ref<InstanceType<typeof KoiLockScreen> | null>(null);

const toolbarConfig = computed(() => getConfig().other.toolbar);

const authStore = useAuthStore();
const userStore = useUserStore();
const tabsStore = useTabsStore();
const keepAliveStore = useKeepAliveStore();
const router = useRouter();

// 用户展示信息：复用 @repo/utils.resolveUserDisplayInfo 统一多数据源合并
const display = computed(() =>
  resolveUserDisplayInfo({
    authLoginUser: authStore.loginUser as Record<string, unknown>,
    userStoreInfo: userStore.userInfo as Record<string, unknown>,
  }),
);

// 用户姓名：优先登录态昵称，其次账号，最后框架 storage 用户信息
const userName = computed(() => {
  const d = display.value;
  return d.username || userStore.nickname || userStore.username || "未知用户";
});
// 手机号码：复用 display.phone
const userPhone = computed(() => display.value.phone);
// 用户头像：登录态头像优先，其次 storage，最后默认占位
const avatar = computed(
  () =>
    authStore.loginUser?.avatar ||
    display.value.avatar ||
    defaultAvatarUrl,
);
// 头像框：开关 + 显示位 + 帧内容三重判断，与侧栏布局 / 个人中心共用同一实现
const {
  visible: avatarFrameVisible,
  layerStyle: avatarFrameStyle,
  spillPx: frameSpill,
} = useWornAvatarFrame();
// 是否已登录：accessToken 存在即视为登录态（应对 token 过期但路由未拦截的边界场景）
const isLoggedIn = computed(() => Boolean(userStore.accessToken || userStore.token || getAccessToken()));

/** 退出登录 */
const handleLayout = async () => {
  // 先通知后端吊销令牌，再清理本地状态，否则旧令牌在服务端仍然可用
  await userStore.logOut();
  // 清除 sessionStorage
  clearSessionStorage();
  // 清除 tabs 数据
  tabsStore.$reset();
  // 清除 keepAlive 缓存
  keepAliveStore.$reset();
  // 清除 auth store 数据[重置为初始状态]
  authStore.$reset();
  // 退出登录，必须使用replace把页面缓存刷掉。
  // 拼接 base 路径，确保跳转到正确的登录页
  const baseUrl = import.meta.env.BASE_URL || "/";
  const loginPath = LOGIN_URL.replace(/^\//, ""); // 去掉开头的 /
  window.location.replace(baseUrl + loginPath);
};

// 下拉折叠
const handleCommand = (command: string | number) => {
  switch (command) {
    case "koiMine":
      router.push("/system/personage");
      break;
    case "lock":
      window.dispatchEvent(new CustomEvent("lock:screen"));
      break;
    case "logout":
      handleLayout();
      break;
  }
};
</script>

<style lang="scss" scoped>
// 用户容器
.user-container {
  margin-left: 6px;
  position: relative;
  display: flex;
  align-items: center;
}

// 头像环形边框占位（预留后续边框样式能力）
// padding 由 frameSpill(32) 内联下发：为头像框的外溢部分留位，避免压到 header 与其它工具项
.user-avatar-ring {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  // ===== 边框占位（默认关闭，预留后续开启）=====
  border: 1px solid transparent;
  transition: border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

// 用户头像
.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;

  &:hover {
    transform: scale(1.05);
  }
}

.user-avatar-frame {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar-frame-layer {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center;
  pointer-events: none;
}

// 卡片内头像
.user-avatar-card {
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  flex-shrink: 0;
}

.user-avatar-card-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-avatar-card-layer {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center;
  pointer-events: none;
}

// 卡片内容容器
.user-card-content {
  padding: 0px;
}

// 卡片头部
.user-card-header {
  display: flex;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 10px;
}

.user-info {
  margin-left: 4px;
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 3px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

.user-phone {
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

// 卡片菜单
.user-card-menu {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.user-menu-item {
  display: flex;
  align-items: center;
  width: auto;
  height: 36px;
  padding: 8px 10px;
  font-size: 13px;
  user-select: none;
  background-color: transparent;
  border-radius: 6px;
  transition: all 0.3s ease;
  cursor: pointer;
  line-height: 1;
  font-display: swap;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  &:hover {
    color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
  }

  .el-icon {
    margin-right: 8px;
    font-size: 14px;
    flex-shrink: 0;
  }

  span {
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    line-height: 1;
    font-display: swap;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

.user-menu-item:hover .el-icon {
  animation: koi-jelly 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

@keyframes koi-jelly {
  0% {
    transform: scale(1, 1) rotate(0deg);
    transform-origin: center;
  }
  15% {
    transform: scale(1.25, 0.8) rotate(0deg);
  }
  30% {
    transform: scale(0.85, 1.1) rotate(-2deg);
  }
  45% {
    transform: scale(1.05, 0.95) rotate(1deg);
  }
  60% {
    transform: scale(0.95, 1.02) rotate(-1deg);
  }
  75% {
    transform: scale(1.02, 0.98) rotate(0.5deg);
  }
  90% {
    transform: scale(0.98, 1.01) rotate(-0.3deg);
  }
  100% {
    transform: scale(1, 1) rotate(0deg);
  }
}

.user-card-footer {
  display: flex;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  margin-top: 10px;
  .el-button {
    width: 100%;
  }
}
</style>

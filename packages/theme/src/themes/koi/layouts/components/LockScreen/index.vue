<template>
  <Teleport to="body">
    <div v-if="locked" class="koi-lockscreen">
      <div class="koi-lockscreen__bg"></div>
      <div class="koi-lockscreen__card">
        <div class="koi-lockscreen__avatar">
          <el-image class="koi-lockscreen__avatar-img" fit="cover" :src="avatar" />
        </div>
        <div class="koi-lockscreen__name">{{ userName }}</div>

        <!-- 首次设置密码 -->
        <template v-if="!hasPassword">
          <div class="koi-lockscreen__hint">首次使用，请设置锁屏密码</div>
          <el-input
            v-model="newPassword"
            type="password"
            placeholder="设置密码"
            size="large"
            show-password
            class="koi-lockscreen__input"
            @keydown.enter="onSetPassword"
          />
          <el-input
            v-model="confirmPassword"
            type="password"
            placeholder="确认密码"
            size="large"
            show-password
            class="koi-lockscreen__input"
            @keydown.enter="onSetPassword"
          />
          <el-button type="primary" size="large" class="koi-lockscreen__btn" @click="onSetPassword">
            确认
          </el-button>
        </template>

        <!-- 输入密码解锁 -->
        <template v-else>
          <div class="koi-lockscreen__hint">已锁屏，请输入密码解锁</div>
          <el-input
            v-model="password"
            type="password"
            placeholder="请输入密码"
            size="large"
            show-password
            class="koi-lockscreen__input"
            @keydown.enter="onUnlock"
          />
          <el-button type="primary" size="large" class="koi-lockscreen__btn" @click="onUnlock">
            解锁
          </el-button>
          <div class="koi-lockscreen__footer">
            <span class="koi-lockscreen__link" @click="onResetPassword">重置密码</span>
            <span class="koi-lockscreen__link" @click="onLogout">退出登录</span>
          </div>
        </template>

        <div v-if="error" class="koi-lockscreen__error">{{ error }}</div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * KoiLockScreen —— 锁屏组件
 *
 * 密码哈希与锁状态由 Web Worker 维护，主线程无法直接篡改。
 * Worker 存活期间，清除 localStorage 无法绕过锁屏。
 */
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { ElInput, ElButton, ElImage, ElMessage } from "element-plus";
import { getUserInfo } from "@repo/utils";
import { getConfig } from "@repo/config";
import useUserStore from "@repo/pinia/modules/user";
import useAuthStore from "@repo/pinia/modules/auth";

const userStore = useUserStore();
const authStore = useAuthStore();

const locked = ref(false);
const hasPassword = ref(false);
const password = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const error = ref("");
let worker: Worker | null = null;

const avatar = computed(() => {
  const info = getUserInfo<Record<string, unknown>>() ?? {};
  return (
    authStore.loginUser?.avatar ||
    (info.avatar as string) ||
    "https://avatars.githubusercontent.com/u/185870639?v=4&size=64"
  );
});

const userName = computed(() => {
  const info = getUserInfo<Record<string, unknown>>() ?? {};
  return (
    userStore.nickname ||
    (info.sysUserNickname as string) ||
    authStore.loginUser?.loginName ||
    userStore.username ||
    "用户"
  );
});

function post(type: string, data?: Record<string, unknown>) {
  worker?.postMessage({ type, ...data });
}

function initWorker() {
  worker = new Worker(new URL("./lock.worker.ts", import.meta.url));
  worker.onmessage = (e: MessageEvent) => {
    const msg = e.data ?? {};
    switch (msg.type) {
      case "state":
        locked.value = msg.locked ?? false;
        hasPassword.value = msg.hasPassword ?? false;
        break;
      case "unlocked":
        if (msg.success) {
          locked.value = false;
          password.value = "";
          error.value = "";
        } else {
          error.value = "密码错误";
        }
        break;
      case "passwordSet":
        if (msg.success) {
          hasPassword.value = true;
          newPassword.value = "";
          confirmPassword.value = "";
          ElMessage.success("密码设置成功");
        }
        break;
      case "passwordReset":
        if (msg.success) {
          hasPassword.value = false;
          newPassword.value = "";
          confirmPassword.value = "";
          password.value = "";
          error.value = "";
          ElMessage.success("密码已重置");
        }
        break;
    }
  };
  post("init");
}

function onSetPassword() {
  error.value = "";
  if (!newPassword.value) { error.value = "请输入密码"; return; }
  if (newPassword.value.length < 4) { error.value = "密码至少 4 位"; return; }
  if (newPassword.value !== confirmPassword.value) { error.value = "两次密码不一致"; return; }
  post("setPassword", { password: newPassword.value });
}

function onUnlock() {
  error.value = "";
  if (!password.value) { error.value = "请输入密码"; return; }
  post("unlock", { password: password.value });
}

function onResetPassword() {
  post("resetPassword");
}

function onLogout() {
  locked.value = false;
  window.location.replace(getConfig().url.login || "/login");
}

onMounted(() => {
  initWorker();
});

onBeforeUnmount(() => {
  worker?.terminate();
  worker = null;
});

defineExpose({
  lock() {
    post("init");
    // 延迟一帧等 worker 返回 state，再发出 lock 指令
    setTimeout(() => post("lock"), 50);
  },
});
</script>

<style lang="scss" scoped>
.koi-lockscreen {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.koi-lockscreen__bg {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.koi-lockscreen__card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 340px;
  padding: 40px 32px 32px;
  background: var(--el-bg-color);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.koi-lockscreen__avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--el-color-primary-light-7);
  margin-bottom: 12px;
}

.koi-lockscreen__avatar-img {
  width: 100%;
  height: 100%;
}

.koi-lockscreen__name {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 20px;
}

.koi-lockscreen__hint {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 16px;
}

.koi-lockscreen__input {
  width: 100%;
  margin-bottom: 12px;
}

.koi-lockscreen__btn {
  width: 100%;
  margin-top: 4px;
}

.koi-lockscreen__footer {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 16px;
}

.koi-lockscreen__link {
  font-size: 12px;
  color: var(--el-color-primary);
  cursor: pointer;
  user-select: none;
}

.koi-lockscreen__link:hover {
  opacity: 0.7;
}

.koi-lockscreen__error {
  margin-top: 12px;
  font-size: 12px;
  color: var(--el-color-danger);
}
</style>
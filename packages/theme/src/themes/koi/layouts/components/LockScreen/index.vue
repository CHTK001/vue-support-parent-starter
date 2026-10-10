<template>
  <Teleport to="body">
    <div v-if="locked" class="koi-lockscreen">
      <div class="koi-lockscreen__bg"></div>
      <div class="koi-lockscreen__card">
        <div v-if="!hasPassword" class="koi-lockscreen__close" title="取消锁屏" @click="onClose">
          <el-icon><Close /></el-icon>
        </div>
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
import { message } from "@repo/core";
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { ElInput, ElButton, ElImage } from "element-plus";
import { Close } from "@element-plus/icons-vue";
import { getUserInfo } from "@repo/utils";
import { getConfig } from "@repo/config";
import { defaultAvatarUrl } from "@repo/assets";
import useUserStore from "@repo/pinia/modules/user";
import useAuthStore from "@repo/pinia/modules/auth";

const userStore = useUserStore();
const authStore = useAuthStore();

const LOCK_HASH_KEY = "lock-screen";
const LOCK_STATE_KEY = "lock-state";

const locked = ref(false);
const hasPassword = ref(false);
const password = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const error = ref("");

function readHash(): string | null {
  try { return localStorage.getItem(LOCK_HASH_KEY); }
  catch { return null; }
}

function writeHash(hash: string): void {
  try { localStorage.setItem(LOCK_HASH_KEY, hash); }
  catch { /* ignore */ }
}

function clearHash(): void {
  try { localStorage.removeItem(LOCK_HASH_KEY); }
  catch { /* ignore */ }
}

function readLocked(): boolean {
  try { return localStorage.getItem(LOCK_STATE_KEY) === "1"; }
  catch { return false; }
}

function writeLocked(v: boolean): void {
  try { localStorage.setItem(LOCK_STATE_KEY, v ? "1" : "0"); }
  catch { /* ignore */ }
}

async function sha256(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function syncState(): void {
  hasPassword.value = !!readHash();
  locked.value = readLocked();
}

const avatar = computed(() => {
  const info = getUserInfo<Record<string, unknown>>() ?? {};
  return authStore.loginUser?.avatar || (info.avatar as string) || defaultAvatarUrl;
});

const userName = computed(() => {
  const info = getUserInfo<Record<string, unknown>>() ?? {};
  return userStore.nickname || (info.sysUserNickname as string) || authStore.loginUser?.loginName || userStore.username || "用户";
});

function onLockScreenEvent() {
  syncState();
  locked.value = true;
  writeLocked(true);
}

function onLockPasswordEvent(e: Event) {
  const detail = (e as CustomEvent).detail;
  if (detail && detail.action === "sync" || detail && detail.action === "lock") {
    syncState();
    if (detail && detail.action === "lock") { locked.value = true; writeLocked(true); }
  }
}

function onClose() {
  locked.value = false;
  writeLocked(false);
  password.value = "";
  newPassword.value = "";
  confirmPassword.value = "";
  error.value = "";
}

function onSetPassword() {
  error.value = "";
  if (!newPassword.value) { error.value = "请输入密码"; return; }
  if (newPassword.value.length < 4) { error.value = "密码至少 4 位"; return; }
  if (newPassword.value !== confirmPassword.value) { error.value = "两次密码不一致"; return; }
  sha256(newPassword.value).then((hash) => {
    writeHash(hash);
    hasPassword.value = true;
    newPassword.value = "";
    confirmPassword.value = "";
    message.success("密码设置成功");
  });
}

function onUnlock() {
  error.value = "";
  if (!password.value) { error.value = "请输入密码"; return; }
  sha256(password.value).then((hash) => {
    const stored = readHash();
    const ok = stored !== null && hash === stored;
    if (ok) {
      locked.value = false;
      writeLocked(false);
      password.value = "";
      error.value = "";
    } else {
      error.value = "密码错误";
    }
  });
}

function onResetPassword() {
  clearHash();
  hasPassword.value = false;
  newPassword.value = "";
  confirmPassword.value = "";
  password.value = "";
  error.value = "";
  message.success("密码已重置");
}

function onLogout() {
  window.location.replace(getConfig().url.login || "/login");
}

onMounted(() => {
  syncState();
  window.addEventListener("lock:screen", onLockScreenEvent);
  window.addEventListener("lock:password", onLockPasswordEvent);
  nextTick(() => {
    if (locked.value) enableDomGuard();
  });
  watch(locked, (v) => {
    nextTick(() => {
      if (v) enableDomGuard();
      else disableDomGuard();
    });
  });
});

onBeforeUnmount(() => {
  window.removeEventListener("lock:screen", onLockScreenEvent);
  window.removeEventListener("lock:password", onLockPasswordEvent);
  disableDomGuard();
});

let domGuard: MutationObserver | null = null;
let domGuardRestores = 0;
const MAX_DOM_GUARD = 500;
const LOCKSCREEN_SELECTOR = ".koi-lockscreen";

function enableDomGuard(): void {
  disableDomGuard();
  if (!locked.value) return;
  domGuardRestores = 0;
  domGuard = new MutationObserver((mutations) => {
    if (!locked.value) return;
    for (const m of mutations) {
      for (const node of m.removedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        const el = node as Element;
        if (el.matches && el.matches(LOCKSCREEN_SELECTOR)) {
          domGuardRestores++;
          if (domGuardRestores < MAX_DOM_GUARD) {
            locked.value = true;
            writeLocked(true);
          }
        }
        if (el.querySelectorAll) {
          for (const child of el.querySelectorAll(LOCKSCREEN_SELECTOR)) {
            domGuardRestores++;
            if (domGuardRestores < MAX_DOM_GUARD) {
              locked.value = true;
              writeLocked(true);
            }
          }
        }
      }
    }
  });
  domGuard.observe(document.body, { childList: true, subtree: true });
}

function disableDomGuard(): void {
  domGuard?.disconnect();
  domGuard = null;
  domGuardRestores = 0;
}

defineExpose({
  lock() { syncState(); locked.value = true; writeLocked(true); },
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

.koi-lockscreen__close {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.koi-lockscreen__close:hover {
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-light);
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
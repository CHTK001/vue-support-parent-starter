<script setup lang="ts">
/**
 * 个人中心页面（/system/personage）
 *
 * 展示当前登录用户信息，支持编辑基本资料与修改登录密码。
 * 资料接口：PUT /v2/user/update（updateUser）
 * 改密接口：PUT /v2/user/updateOwner（updateOwner）
 */
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { User, Lock, Edit, Key, RefreshLeft, Plus } from "@element-plus/icons-vue";
import { updateUser, updateOwner } from "../api/systemApi";
import type { SysUserUpdate } from "../api/types";
import useUserStore from "@repo/pinia/modules/user";
import { setUserInfo } from "@repo/utils";

const userStore = useUserStore();
const userInfo = computed(() => userStore.userInfo || {});

const display = computed(() => {
  const u: Record<string, unknown> = userInfo.value;
  return {
    nickname: (u.nickname as string) || (u.sysUserNickname as string) || "-",
    username: (u.username as string) || (u.sysUserUsername as string) || "-",
    avatar: (u.avatar as string) || (u.sysUserAvatar as string) || "",
    roles: (u.roles as string[]) || [],
    phone: (u.sysUserPhone as string) || "-",
    email: (u.sysUserEmail as string) || "-",
    sex: (u.sysUserSex as number) ?? 0,
    userId: (u.userId as string | number) ?? (u.sysUserId as string | number),
    avatarFrame: (u.sysUserAvatarFrame as number) ?? (u.avatarFrame as number) ?? 0,
  };
});

/** 编辑资料 */
const profileVisible = ref(false);
const savingProfile = ref(false);
const profileForm = reactive<SysUserUpdate>({
  sysUserNickname: "",
  sysUserPhone: "",
  sysUserEmail: "",
  sysUserSex: 0,
});

function openProfile() {
  profileForm.sysUserId = display.value.userId as number | undefined;
  profileForm.sysUserNickname = display.value.nickname === "-" ? "" : display.value.nickname;
  profileForm.sysUserPhone = display.value.phone === "-" ? "" : display.value.phone;
  profileForm.sysUserEmail = display.value.email === "-" ? "" : display.value.email;
  profileForm.sysUserSex = display.value.sex;
  profileVisible.value = true;
}

async function saveProfile() {
  if (!profileForm.sysUserNickname) {
    ElMessage.warning("昵称不能为空");
    return;
  }
  savingProfile.value = true;
  try {
    const res = await updateUser(profileForm);
    if (res.code === "00000") {
      ElMessage.success("资料已更新");
      profileVisible.value = false;
      (userStore.userInfo as Record<string, unknown>).nickname = profileForm.sysUserNickname;
      setUserInfo({ ...userStore.userInfo });
    } else {
      ElMessage.error(res.msg || "更新失败");
    }
  } finally {
    savingProfile.value = false;
  }
}

/** 修改密码 */
const pwdForm = reactive({ oldPassword: "", newPassword: "", confirmPassword: "" });
const savingPwd = ref(false);

async function savePassword() {
  if (!pwdForm.oldPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) {
    ElMessage.warning("请填写完整信息");
    return;
  }
  if (pwdForm.newPassword !== pwdForm.confirmPassword) {
    ElMessage.warning("两次输入的新密码不一致");
    return;
  }
  savingPwd.value = true;
  try {
    const res = await updateOwner({ ...pwdForm });
    if (res.code === "00000") {
      ElMessage.success("密码修改成功");
      pwdForm.oldPassword = "";
      pwdForm.newPassword = "";
      pwdForm.confirmPassword = "";
    } else {
      ElMessage.error(res.msg || "修改失败");
    }
  } finally {
    savingPwd.value = false;
  }
}

/** 锁屏设置 Begin */
const LOCK_KEY = "lock-screen";
const lockHasPassword = ref(false);
const lockSetting = ref(false);
const lockResetting = ref(false);
const lockForm = reactive({ newPassword: "", confirmPassword: "" });

async function sha256(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function readLockHash(): string | null {
  try { return localStorage.getItem(LOCK_KEY); }
  catch { return null; }
}

function initLockState(): void {
  lockHasPassword.value = !!readLockHash();
}

function onLockStorage(e: StorageEvent): void {
  if (e.key === LOCK_KEY) lockHasPassword.value = !!e.newValue;
}

function handleSetLockPwd(): void {
  if (!lockForm.newPassword) { ElMessage.warning("请输入锁屏密码"); return; }
  if (lockForm.newPassword.length < 4) { ElMessage.warning("密码至少 4 位"); return; }
  if (lockForm.newPassword !== lockForm.confirmPassword) { ElMessage.warning("两次密码不一致"); return; }
  lockSetting.value = true;
  sha256(lockForm.newPassword).then((hash) => {
    localStorage.setItem(LOCK_KEY, hash);
    lockHasPassword.value = true;
    lockForm.newPassword = "";
    lockForm.confirmPassword = "";
    ElMessage.success("锁屏密码设置成功");
    lockSetting.value = false;
    window.dispatchEvent(new CustomEvent("lock:password", { detail: { action: "sync" } }));
  });
}

function handleResetLockPwd(): void {
  lockResetting.value = true;
  localStorage.removeItem(LOCK_KEY);
  lockHasPassword.value = false;
  ElMessage.success("锁屏密码已重置");
  lockResetting.value = false;
  window.dispatchEvent(new CustomEvent("lock:password", { detail: { action: "reset" } }));
}

function handleLockNow(): void {
  window.dispatchEvent(new CustomEvent("lock:screen"));
}
/** 锁屏设置 End */

onMounted(() => {
  if (profileForm.sysUserNickname === "") {
    profileForm.sysUserNickname = display.value.nickname === "-" ? "" : display.value.nickname;
  }
  initLockState();
  window.addEventListener("storage", onLockStorage);
});
</script>

<template>
  <div class="personage-page">
    <el-row :gutter="16">
      <!-- 左侧：头像与基础信息 -->
      <el-col :xs="24" :md="8">
        <el-card class="profile-card" shadow="never">
          <div class="avatar-wrap">
            <div class="avatar-frame-box">
              <div v-if="display.avatarFrame === 100" class="avatar-frame-layer" :style="{ backgroundImage: 'url(/assets/avatar-frames/birthday.png)' }"></div>
              <el-avatar :size="88" :src="display.avatar" class="profile-avatar">
                {{ display.nickname.charAt(0) }}
              </el-avatar>
            </div>
            <h3 class="nickname">{{ display.nickname }}</h3>
            <p class="username">@{{ display.username }}</p>
            <div class="roles" v-if="display.roles.length">
              <el-tag
                v-for="r in display.roles"
                :key="r"
                size="small"
                type="primary"
                effect="plain"
                round
              >
                {{ r }}
              </el-tag>
            </div>
          </div>
          <el-divider />
          <el-descriptions :column="1" class="base-info">
            <el-descriptions-item label="手机号">{{ display.phone }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ display.email }}</el-descriptions-item>
            <el-descriptions-item label="性别">
              {{ display.sex === 1 ? "女" : display.sex === 2 ? "保密" : "男" }}
            </el-descriptions-item>
          </el-descriptions>
          <el-button class="edit-btn" type="primary" :icon="Edit" @click="openProfile">
            编辑资料
          </el-button>
        </el-card>
      </el-col>

      <!-- 右侧：修改密码 -->
      <el-col :xs="24" :md="16">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><Key /></el-icon>
              <span>修改密码</span>
            </div>
          </template>
          <el-form :model="pwdForm" label-width="110px" class="pwd-form">
            <el-form-item label="原密码">
              <el-input
                v-model="pwdForm.oldPassword"
                type="password"
                show-password
                placeholder="请输入原密码"
              />
            </el-form-item>
            <el-form-item label="新密码">
              <el-input
                v-model="pwdForm.newPassword"
                type="password"
                show-password
                placeholder="请输入新密码"
              />
            </el-form-item>
            <el-form-item label="确认新密码">
              <el-input
                v-model="pwdForm.confirmPassword"
                type="password"
                show-password
                placeholder="请再次输入新密码"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :icon="Lock"
                :loading="savingPwd"
                @click="savePassword"
              >
                确认修改
              </el-button>
              <el-button :icon="RefreshLeft" @click="pwdForm.oldPassword = pwdForm.newPassword = pwdForm.confirmPassword = ''">
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 锁屏设置 -->
        <el-card shadow="never" class="lock-card">
          <template #header>
            <div class="card-header">
              <el-icon><Lock /></el-icon>
              <span>锁屏设置</span>
            </div>
          </template>
          <div class="lock-body">
            <template v-if="lockHasPassword">
              <el-alert type="success" :closable="false" show-icon class="mb-12">
                当前账号已启用锁屏保护，通过用户菜单「锁屏」可锁定屏幕。
              </el-alert>
              <div class="lock-actions">
                <el-button type="warning" plain :loading="lockResetting" @click="handleResetLockPwd">
                  重置密码
                </el-button>
                <el-button type="primary" plain @click="handleLockNow">
                  立即锁屏
                </el-button>
              </div>
            </template>
            <template v-else>
              <el-alert type="info" :closable="false" show-icon class="mb-12">
                设置锁屏密码后，可通过用户菜单「锁屏」入口锁定屏幕。
              </el-alert>
              <el-form :model="lockForm" label-width="90px" class="lock-form">
                <el-form-item label="锁屏密码">
                  <el-input
                    v-model="lockForm.newPassword"
                    type="password"
                    show-password
                    placeholder="请输入锁屏密码（至少4位）"
                  />
                </el-form-item>
                <el-form-item label="确认密码">
                  <el-input
                    v-model="lockForm.confirmPassword"
                    type="password"
                    show-password
                    placeholder="请再次输入锁屏密码"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" :loading="lockSetting" @click="handleSetLockPwd">
                    设置密码
                  </el-button>
                </el-form-item>
              </el-form>
            </template>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 编辑资料弹窗 -->
    <el-dialog v-model="profileVisible" title="编辑资料" width="480px" append-to-body>
      <el-form :model="profileForm" label-width="80px">
        <el-form-item label="昵称">
          <el-input v-model="profileForm.sysUserNickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="profileForm.sysUserPhone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="profileForm.sysUserEmail" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="profileForm.sysUserSex">
            <el-radio :label="0">男</el-radio>
            <el-radio :label="1">女</el-radio>
            <el-radio :label="2">保密</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="profileVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingProfile" @click="saveProfile">
          <el-icon style="margin-right: 4px"><Plus /></el-icon>保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.personage-page {
  padding: 8px;

  .profile-card {
    text-align: center;

    .avatar-wrap {
      padding: 12px 0 4px;

      .avatar-frame-box {
        position: relative;
        display: inline-flex;
        width: 94px;
        height: 94px;
        align-items: center;
        justify-content: center;

        .avatar-frame-layer {
          position: absolute;
          inset: 0;
          z-index: 1;
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          pointer-events: none;
        }
      }

      .profile-avatar {
        font-size: 34px;
        background: linear-gradient(135deg, #409eff, #66b1ff);
      }

      .nickname {
        margin: 12px 0 2px;
        font-size: 18px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .username {
        margin: 0;
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }

      .roles {
        margin-top: 10px;
        display: flex;
        gap: 6px;
        justify-content: center;
        flex-wrap: wrap;
      }
    }

    .base-info {
      :deep(.el-descriptions__label) {
        width: 70px;
      }
    }

    .edit-btn {
      margin-top: 14px;
      width: 100%;
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
  }

  .pwd-form {
    max-width: 420px;
  }

  .lock-card {
    margin-top: 16px;
  }

  .lock-body {
    max-width: 460px;

    .mb-12 {
      margin-bottom: 12px;
    }

    .lock-actions {
      display: flex;
      gap: 12px;
    }
  }
}
</style>

<script setup lang="ts">
/**
 * 个人中心页面（/system/personage）
 *
 * 展示当前登录用户信息，支持编辑资料、修改密码、锁屏设置、头像框佩戴。
 * 资料接口：PUT /v2/user/update（updateUser）
 * 改密接口：PUT /v2/user/updateOwner（updateOwner）
 * 全部使用 ReXxx modern 组件渲染。
 */
import { computed, onMounted, onBeforeUnmount, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { User, Lock, Edit, Key, RefreshLeft, Plus, Select } from "@element-plus/icons-vue";
import { updateUser, updateOwner, getAvatarFrameList } from "../api/systemApi";
import type { SysUserUpdate, SysAvatarFrame } from "../api/types";
import useUserStore from "@repo/pinia/modules/user";
import useAuthStore from "@repo/pinia/modules/auth";
import { setUserInfo } from "@repo/utils";
import { getConfig } from "@repo/config";
import ReTab, { type ReTabItem } from "@repo/ui/re-tab";
import ReForm, { type ReFormField } from "@repo/ui/re-form";
import ReInput from "@repo/ui/re-input";
import { getGlobalTimer } from "@repo/work/timer";

const userStore = useUserStore();
const authStore = useAuthStore();
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
    avatarFrameShow: (u.sysUserAvatarFrameShow as number) ?? (u.avatarFrameShow as number) ?? 0,
    birthday: (u.sysUserBirthday as string) || (u.birthday as string) || "",
  };
});

const activeTab = ref("frame");

const frameEnabled = computed(() => getConfig()?.other?.avatarFrame?.enable ?? false);

const tabs = computed<ReTabItem[]>(() => {
  const items: ReTabItem[] = [];
  if (frameEnabled.value) {
    items.push({ name: "frame", label: "头像框", icon: "Avatar" });
  }
  items.push({ name: "pwd", label: "修改密码", icon: "Key" });
  items.push({ name: "lock", label: "锁屏设置", icon: "Lock" });
  return items;
});

/** 头像框定义 */
interface AvatarFrameItem {
  id: number;
  name: string;
  color?: string;
  image?: string;
}

const baseFrames: AvatarFrameItem[] = [
  { id: 1, name: "经典", color: "transparent" },
  { id: 2, name: "金色", color: "linear-gradient(135deg, #f6d365, #fda085)" },
  { id: 3, name: "蓝色", color: "linear-gradient(135deg, #667eea, #764ba2)" },
  { id: 4, name: "红色", color: "linear-gradient(135deg, #f093fb, #f5576c)" },
  { id: 5, name: "绿色", color: "linear-gradient(135deg, #4facfe, #00f2fe)" },
  { id: 6, name: "紫色", color: "linear-gradient(135deg, #a18cd1, #fbc2eb)" },
  { id: 7, name: "橙色", color: "linear-gradient(135deg, #fa709a, #fee140)" },
  { id: 8, name: "暗夜", color: "linear-gradient(135deg, #2c3e50, #3498db)" },
  { id: 9, name: "糖果", color: "linear-gradient(135deg, #f6d365, #fda085)" },
  { id: 10, name: "樱粉", color: "linear-gradient(135deg, #ff9a9e, #fecfef)" },
  { id: 11, name: "薄荷", color: "linear-gradient(135deg, #a1c4fd, #c2e9fb)" },
  { id: 12, name: "暮霭", color: "linear-gradient(135deg, #d4a4fc, #ff9a9e)" },
  { id: 13, name: "柠檬", color: "linear-gradient(135deg, #ffdfba, #feedb0)" },
  { id: 14, name: "星空", color: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)" },
  { id: 15, name: "森林", color: "linear-gradient(135deg, #134e5e, #71b280)" },
  { id: 16, name: "熔岩", color: "linear-gradient(135deg, #ff512f, #dd2476)" },
  { id: 17, name: "极光", color: "linear-gradient(135deg, #00c9ff, #92fe9d)" },
  { id: 18, name: "红枫", color: "linear-gradient(135deg, #b31217, #e52d27)" },
  { id: 19, name: "海洋", color: "linear-gradient(135deg, #2193b0, #6dd5ed)" },
  { id: 20, name: "祖母绿", color: "linear-gradient(135deg, #11998e, #38ef7d)" },
  { id: 21, name: "晚霞", color: "linear-gradient(135deg, #ff9966, #ff5e62)" },
  { id: 22, name: "阿凡达", color: "linear-gradient(135deg, #1488cc, #2b32b2)" },
  { id: 23, name: "鎏金", image: "/assets/avatar-frames/frame-gold.png" },
  { id: 24, name: "皇室蓝", image: "/assets/avatar-frames/frame-royal.png" },
  { id: 25, name: "玫瑰金", image: "/assets/avatar-frames/frame-rose.png" },
  { id: 26, name: "焰光", image: "/assets/avatar-frames/frame-flame.apng" },
  { id: 27, name: "晶蓝", image: "/assets/avatar-frames/frame-azure.apng" },
];

const BIRTHDAY_FRAME_ID = 100;
const BIRTHDAY_WINDOW = 3;

const DEFAULT_FRAME_ID = 1;

const avatarFrames = ref<AvatarFrameItem[]>([]);
const selectedFrame = ref(DEFAULT_FRAME_ID);
const savingFrame = ref(false);
let unsubscribeTimer: (() => void) | null = null;

function isBirthdayWindow(birthday: string): boolean {
  if (!birthday) return false;
  const m = birthday.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (!m) return false;
  const birth = new Date(2000, Number(m[2]) - 1, Number(m[3]));
  const now = new Date();
  const today = new Date(2000, now.getMonth(), now.getDate());
  const diff = Math.round((today.getTime() - birth.getTime()) / 86400000);
  return Math.abs(diff) <= BIRTHDAY_WINDOW;
}

/** 初始化头像框列表（优先从服务端加载，失败回退本地内置；生日窗内自动追加生日框） */
async function initFrames(): Promise<void> {
  let frames: AvatarFrameItem[] = [...baseFrames];
  try {
    const res = await getAvatarFrameList();
    const list = res.data;
    if (Array.isArray(list) && list.length) {
      frames = list
        .filter((f) => f.sysAvatarFrameStatus === 1)
        .map((f) => ({
          id: f.sysAvatarFrameId as number,
          name: f.sysAvatarFrameName as string,
          color: f.sysAvatarFrameColor as string | undefined,
          image: f.sysAvatarFrameImage as string | undefined,
        }));
    }
  } catch {
    // 服务端不可用时使用内置列表
  }
  if (isBirthdayWindow(display.value.birthday)) {
    frames.push({
      id: BIRTHDAY_FRAME_ID,
      name: "生日快乐",
      image: "/assets/avatar-frames/birthday.png",
    });
  }
  avatarFrames.value = frames;
  selectedFrame.value =
    avatarFrames.value.some((f) => f.id === display.value.avatarFrame)
      ? display.value.avatarFrame
      : DEFAULT_FRAME_ID;
  frameShow.value = display.value.avatarFrameShow ?? 0;
}

async function activateFrame(id: number): Promise<void> {
  if (savingFrame.value || selectedFrame.value === id) return;
  selectedFrame.value = id;
  savingFrame.value = true;
  try {
    const res = await updateUser({ sysUserAvatarFrame: id } as any);
    if (res.code === 200 || res.code === 0 || res.msg === "操作成功" || res.msg == null) {
      ElMessage.success("已佩戴头像框");
      await authStore.getLoginUserInfo();
    } else {
      ElMessage.error(res.msg || "佩戴失败");
      selectedFrame.value = display.value.avatarFrame ?? 0;
    }
  } catch (e) {
    ElMessage.error("佩戴失败：" + ((e as Error)?.message || "网络异常"));
    selectedFrame.value = display.value.avatarFrame ?? 0;
  } finally {
    savingFrame.value = false;
  }
}

const frameShow = ref(0);
const savingShow = ref(false);

/** 与 ReSwitch 同步的布尔开关（内部仍保存为 0/1） */
const frameShowSwitch = computed<boolean>({
  get: () => frameShow.value === 1,
  set: (v: boolean) => toggleFrameShow(v ? 1 : 0),
});

async function toggleFrameShow(val: number): Promise<void> {
  frameShow.value = val;
  savingShow.value = true;
  try {
    const res = await updateUser({ sysUserAvatarFrameShow: val } as any);
    if (res.code === 200 || res.code === 0 || res.msg === "操作成功" || res.msg == null) {
      await authStore.getLoginUserInfo();
    } else {
      frameShow.value = display.value.avatarFrameShow ?? 0;
    }
  } catch {
    frameShow.value = display.value.avatarFrameShow ?? 0;
  } finally {
    savingShow.value = false;
  }
}

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
    if ((res as any).code === "00000") {
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
    if ((res as any).code === "00000") {
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

function resetPwdForm(): void {
  pwdForm.oldPassword = "";
  pwdForm.newPassword = "";
  pwdForm.confirmPassword = "";
}

/** 锁屏设置 */
const LOCK_KEY = "lock-screen";
const lockHasPassword = ref(false);
const lockSetting = ref(false);
const lockResetting = ref(false);
const lockForm = reactive({ newPassword: "", confirmPassword: "" });

const pwdFields: ReFormField[] = [
  {
    prop: "oldPassword",
    label: "原密码",
    component: ReInput,
    attrs: { layout: "modern", type: "password", "show-password": true, placeholder: "请输入原密码" },
  },
  {
    prop: "newPassword",
    label: "新密码",
    component: ReInput,
    attrs: { layout: "modern", type: "password", "show-password": true, placeholder: "请输入新密码" },
  },
  {
    prop: "confirmPassword",
    label: "确认新密码",
    component: ReInput,
    attrs: { layout: "modern", type: "password", "show-password": true, placeholder: "请再次输入新密码" },
  },
];

const lockFields: ReFormField[] = [
  {
    prop: "newPassword",
    label: "锁屏密码",
    component: ReInput,
    attrs: { layout: "modern", type: "password", "show-password": true, placeholder: "请输入锁屏密码（至少4位）" },
  },
  {
    prop: "confirmPassword",
    label: "确认密码",
    component: ReInput,
    attrs: { layout: "modern", type: "password", "show-password": true, placeholder: "请再次输入锁屏密码" },
  },
];

const profileFields: ReFormField[] = [
  { prop: "sysUserNickname", label: "昵称", component: ReInput, attrs: { layout: "modern", placeholder: "请输入昵称" } },
  { prop: "sysUserPhone", label: "手机号", component: ReInput, attrs: { layout: "modern", placeholder: "请输入手机号" } },
  { prop: "sysUserEmail", label: "邮箱", component: ReInput, attrs: { layout: "modern", placeholder: "请输入邮箱" } },
  {
    prop: "sysUserSex",
    label: "性别",
    component: "radio",
    options: [
      { label: "男", value: 0 },
      { label: "女", value: 1 },
      { label: "保密", value: 2 },
    ],
  },
];

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

onMounted(() => {
  if (profileForm.sysUserNickname === "") {
    profileForm.sysUserNickname = display.value.nickname === "-" ? "" : display.value.nickname;
  }
  initLockState();
  window.addEventListener("storage", onLockStorage);
  if (frameEnabled.value) {
    initFrames();
  } else {
    activeTab.value = "pwd";
  }
  // 集成全局计时器，每分钟重新计算生日窗，确保生日框准时出现/消失
  if (frameEnabled.value) {
    const timer = getGlobalTimer();
    if (timer) {
      let minuteCounter = 0;
      unsubscribeTimer = timer.subscribe(() => {
        minuteCounter++;
        if (minuteCounter >= 60) {
          minuteCounter = 0;
          initFrames();
        }
      });
    }
  }
});

onBeforeUnmount(() => {
  unsubscribeTimer?.();
});
</script>

<template>
  <div class="system-page">
    <div class="system-page__header">
      <div>
        <h2 class="system-page__title">个人中心</h2>
        <p class="system-page__subtitle">管理头像框、密码与锁屏等个人信息</p>
      </div>
    </div>

    <el-row :gutter="16">
      <!-- 左侧：头像与基础信息 -->
      <el-col :xs="24" :md="8">
        <el-card class="profile-card" shadow="never">
          <div class="avatar-wrap">
            <div class="avatar-frame-box">
              <div
                v-if="display.avatarFrameShow === 1 && avatarFrames.find((f) => f.id === selectedFrame)?.image"
                class="avatar-frame-layer"
                :style="{ backgroundImage: `url(${avatarFrames.find((f) => f.id === selectedFrame)?.image})` }"
              ></div>
              <el-avatar :size="88" :src="display.avatar" class="profile-avatar">
                {{ display.nickname.charAt(0) }}
              </el-avatar>
            </div>
            <h3 class="nickname">{{ display.nickname }}</h3>
            <p class="username">@{{ display.username }}</p>
            <div class="roles" v-if="display.roles.length">
              <ReTag
                v-for="r in display.roles"
                :key="r"
                layout="modern"
                type="primary"
                effect="plain"
                round
                size="small"
              >
                {{ r }}
              </ReTag>
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
          <ReButton class="edit-btn" layout="modern" type="primary" :icon="Edit" @click="openProfile">
            编辑资料
          </ReButton>
        </el-card>
      </el-col>

      <!-- 右侧：头像框 / 修改密码 / 锁屏设置 -->
      <el-col :xs="24" :md="16">
        <el-card class="rounded-md" shadow="never" :body-style="{ paddingTop: '6px' }">
          <ReTab :tabs="tabs" v-model="activeTab" variant="capsule">
            <template #frame>
              <div class="frame-section">
                <div class="frame-toggle">
                  <span>显示头像框</span>
                  <ReSwitch layout="modern" v-model="frameShowSwitch" :loading="savingShow" />
                </div>
                <p class="section-desc">
                  点击头像框即可佩戴
                  <span v-if="avatarFrames.some((f) => f.id === BIRTHDAY_FRAME_ID)" class="birthday-tip">
                    🎂 生日快乐！限时 7 天生日专属头像框已解锁。
                  </span>
                </p>
                <div class="frame-grid">
                  <div
                    v-for="frame in avatarFrames"
                    :key="frame.id"
                    class="frame-item"
                    :class="{ 'is-selected': selectedFrame === frame.id, 'is-loading': savingFrame && selectedFrame === frame.id }"
                    @click="activateFrame(frame.id)"
                  >
                    <div class="frame-preview">
                      <div
                        v-if="frame.image"
                        class="frame-img"
                        :style="{ backgroundImage: `url(${frame.image})` }"
                      ></div>
                      <el-avatar :size="56" :src="display.avatar" />
                    </div>
                    <span class="frame-name">{{ frame.name }}</span>
                    <el-icon v-if="selectedFrame === frame.id" class="frame-check"><Select /></el-icon>
                  </div>
                </div>
              </div>
            </template>

            <template #pwd>
              <ReForm v-model="pwdForm" layout="modern" label-width="110px" class="pwd-form" :fields="pwdFields">
                <template #actions>
                  <ReButton layout="modern" type="primary" :icon="Lock" :loading="savingPwd" @click="savePassword">确认修改</ReButton>
                  <ReButton layout="modern" :icon="RefreshLeft" @click="resetPwdForm">重置</ReButton>
                </template>
              </ReForm>
            </template>

            <template #lock>
              <div class="lock-body">
                <template v-if="lockHasPassword">
                  <el-alert type="success" :closable="false" show-icon class="mb-12">
                    当前账号已启用锁屏保护，通过用户菜单「锁屏」可锁定屏幕。
                  </el-alert>
                  <div class="lock-actions">
                    <ReButton layout="modern" type="warning" plain :loading="lockResetting" @click="handleResetLockPwd">重置密码</ReButton>
                    <ReButton layout="modern" type="primary" plain @click="handleLockNow">立即锁屏</ReButton>
                  </div>
                </template>
                <template v-else>
                  <el-alert type="info" :closable="false" show-icon class="mb-12">
                    设置锁屏密码后，可通过用户菜单「锁屏」入口锁定屏幕。
                  </el-alert>
                  <ReForm v-model="lockForm" layout="modern" label-width="90px" class="lock-form" :fields="lockFields">
                    <template #actions>
                      <ReButton layout="modern" type="primary" :loading="lockSetting" @click="handleSetLockPwd">设置密码</ReButton>
                    </template>
                  </ReForm>
                </template>
              </div>
            </template>
          </ReTab>
        </el-card>
      </el-col>
    </el-row>

    <!-- 编辑资料弹窗 -->
    <ReDialog
      v-model="profileVisible"
      title="编辑资料"
      layout="modern"
      width="480"
      :close-on-click-modal="false"
      :confirm-loading="savingProfile"
      ok-text="保存"
      @ok="saveProfile"
    >
      <ReForm v-model="profileForm" layout="modern" label-width="80px" :fields="profileFields" />
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
.system-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  height: 100%;
}

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
    margin-top: 14px !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
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

.frame-section {
  .frame-toggle {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    font-size: 13px;
    color: var(--el-text-color-primary);
  }

  .section-desc {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin: 0 0 16px;

    .birthday-tip {
      color: var(--el-color-warning);
      display: block;
      margin-top: 6px;
    }
  }

  .frame-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 12px;
  }

  .frame-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 12px 8px;
    border-radius: 10px;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;

    &:hover {
      background: var(--el-color-primary-light-9);
    }

    &.is-selected {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }

    &.is-loading {
      opacity: 0.6;
      pointer-events: none;
    }

    .frame-preview {
      position: relative;
      width: 62px;
      height: 62px;
      display: flex;
      align-items: center;
      justify-content: center;

      .frame-img,
      .frame-css {
        position: absolute;
        inset: 0;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        pointer-events: none;
      }

      .frame-css {
        inset: auto;
        top: 1px;
        left: 1px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        padding: 2px;
        background-clip: content-box;
        z-index: 1;
      }

      :deep(.el-avatar) {
        position: relative;
        z-index: 2;
        border: 2px solid rgba(255, 255, 255, 0.85);
      }
    }

    .frame-name {
      font-size: 12px;
      color: var(--el-text-color-regular);
    }

    .frame-check {
      position: absolute;
      top: 4px;
      right: 4px;
      font-size: 16px;
      color: var(--el-color-primary);
    }
  }
}
</style>

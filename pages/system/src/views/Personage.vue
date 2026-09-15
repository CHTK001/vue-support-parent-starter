<script setup lang="ts">
/**
 * 个人中心页面（/system/personage）
 *
 * 展示当前登录用户信息，支持编辑资料、修改密码、锁屏设置、头像框佩戴。
 * 资料接口：PUT /v2/user/update（updateUser）
 * 改密接口：PUT /v2/user/updateOwner（updateOwner）
 * 全部使用 ReXxx modern 组件渲染。
 */
import { computed, onMounted, reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { User, Lock, Edit, Key, Refresh, Monitor } from "@element-plus/icons-vue";
import {
  listOnline,
  kickUser,
  updateUser,
  updateOwner,
  getTotpStatus,
  generateTotpQrcode,
  bindTotp,
  unbindTotp,
} from "../api/systemApi";
import type { OnlineUser, SysUserUpdate } from "../api/types";
import useUserStore from "@repo/pinia/modules/user";
import useAuthStore from "@repo/pinia/modules/auth";
import { setUserInfo, resolveUserDisplayInfo } from "@repo/utils";
import { getConfig } from "@repo/config";
import { BIRTHDAY_FRAME_ID, getAvatarFrameImage } from "@repo/theme/koi/components/avatarFrames";
import AvatarFramePanel from "@repo/theme/koi/components/AvatarFramePanel.vue";
import ReTab, { type ReTabItem } from "@repo/ui/re-tab";
import ReForm, { type ReFormField } from "@repo/ui/re-form";
import ReInput from "@repo/ui/re-input";

const userStore = useUserStore();
const authStore = useAuthStore();

// 复用 @repo/utils 的 resolveUserDisplayInfo 统一数据源：
// authStore.loginUser（getLoginUserInfo 写入） > storage.getUserInfo() > userStore.userInfo
const display = computed(() =>
  resolveUserDisplayInfo({
    authLoginUser: authStore.loginUser as Record<string, unknown>,
    userStoreInfo: userStore.userInfo as Record<string, unknown>,
  }),
);

const activeTab = ref("frame");

/** 当前用户是否只读：兼容 userInfo / authStore.loginUser / localStorage 多种标记来源 */
const isReadonly = computed<boolean>(() => {
  const sources: Record<string, unknown>[] = [
    (userStore.userInfo ?? {}) as Record<string, unknown>,
    (authStore.loginUser ?? {}) as Record<string, unknown>,
    (display.value ?? {}) as unknown as Record<string, unknown>,
  ];
  for (const s of sources) {
    if (Number(s.readonly) === 1 || s.readonly === true) return true;
    if (Number(s.sysUserReadonly) === 1) return true;
  }
  // localStorage 兜底
  try {
    const raw = localStorage.getItem("userInfo");
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (Number(parsed.readonly) === 1 || parsed.readonly === true) return true;
    }
  } catch { /* ignore */ }
  return false;
});

const frameEnabled = computed(() => getConfig()?.other?.avatarFrame?.enable ?? false);

const tabs = computed<ReTabItem[]>(() => {
  const items: ReTabItem[] = [];
  if (frameEnabled.value) {
    items.push({ name: "frame", label: "头像框", icon: "Avatar" });
  }
  items.push({ name: "pwd", label: "修改密码", icon: "Key" });
  items.push({ name: "security", label: "账号安全", icon: "Lock" });
  items.push({ name: "lock", label: "锁屏设置", icon: "Lock" });
  items.push({ name: "devices", label: "登录设备", icon: "Monitor" });
  return items;
});

/** 左侧头像框叠加图片：开关开启时映射位图/APNG 帧（生日框仅生日窗内显示） */
const frameImage = computed(() => {
  const info = display.value;
  if (Number(info.avatarFrameShow) !== 1) return "";
  if (info.avatarFrame === BIRTHDAY_FRAME_ID && info.birthday && isBirthdayWindow(info.birthday)) {
    return "/assets/avatar-frames/birthday.png";
  }
  return getAvatarFrameImage(Number(info.avatarFrame ?? 0));
});

/** 生日窗判断：前后 3 天共 7 天，保证生日框准时出现/消失 */
const BIRTHDAY_WINDOW = 3;
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

/** 头像框面板更新后：刷新 authStore，使左侧头像框叠加与 display 同步 */
async function onFrameUpdated(): Promise<void> {
  try {
    await authStore.getLoginUserInfo();
  } catch {
    /* ignore */
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

/* ================== 登录设备 / 在线会话 ================== */
const devicesLoading = ref(false);
const devices = ref<OnlineUser[]>([]);

/** 当前用户的在线会话（按当前账号过滤） */
async function loadDevices(): Promise<void> {
  devicesLoading.value = true;
  try {
    const res = await listOnline();
    const all = (res?.data ?? []) as OnlineUser[];
    const uname = display.value.username;
    devices.value = all.filter((d) => d.username === uname);
  } catch {
    devices.value = [];
  } finally {
    devicesLoading.value = false;
  }
}

/** 根据登录时间计算在线时长 */
function loginDuration(loginTime?: string): string {
  if (!loginTime) return "-";
  const start = new Date(loginTime.replace(/-/g, "/")).getTime();
  if (Number.isNaN(start)) return "-";
  const diff = Date.now() - start;
  if (diff < 0) return "-";
  const minutes = Math.floor(diff / 60000);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}小时${m}分`;
  if (m > 0) return `${m}分钟`;
  return `${Math.floor(diff / 1000)}秒`;
}

/** 当前设备：按登录时间最新的会话标记为当前设备 */
function isCurrentDevice(d: OnlineUser): boolean {
  if (!devices.value.length) return false;
  const sorted = [...devices.value].sort((a, b) => (b.loginTime ?? "").localeCompare(a.loginTime ?? ""));
  return sorted[0]?.userId === d.userId;
}

/** 远程下线指定会话 */
async function kickDevice(d: OnlineUser): Promise<void> {
  if (!d.userId || isCurrentDevice(d)) return;
  try {
    await ElMessageBox.confirm(`确认下线来自 ${d.os ?? "未知设备"} / ${d.ip ?? ""} 的会话？`, "远程下线", { type: "warning" });
  } catch {
    return;
  }
  try {
    await kickUser(d.userId);
    ElMessage.success("已下线该设备");
    loadDevices();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "下线失败");
  }
}

/** 切换到设备 Tab 时加载会话 */
function onTabChange(name: string): void {
  if (name === "devices") loadDevices();
  if (name === "security") loadTotpStatus();
}

/* ================== 账号安全 / 2FA ================== */
/** 以下 TOTP 接口未在 systemApi 导出，统一走 http 直连 */
const totpEnabled = ref(false);
const totpLoading = ref(false);
const totpDialogVisible = ref(false);
const totpQrcodeUrl = ref("");
const totpCode = ref("");
const totpBinding = ref(false);

async function loadTotpStatus(): Promise<void> {
  totpLoading.value = true;
  try {
    const res = await getTotpStatus();
    totpEnabled.value = !!res?.data?.enabled;
  } catch {
    totpEnabled.value = false;
  } finally {
    totpLoading.value = false;
  }
}

async function openTotpBind(): Promise<void> {
  totpCode.value = "";
  totpDialogVisible.value = true;
  try {
    const blob = await generateTotpQrcode(); // eslint-disable-next-line
    // eslint-disable-next-line
    // eslint-disable-next-line
    // eslint-disable-next-line
    if (totpQrcodeUrl.value) URL.revokeObjectURL(totpQrcodeUrl.value);
    totpQrcodeUrl.value = URL.createObjectURL(blob);
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "获取二维码失败");
    totpDialogVisible.value = false;
  }
}

async function confirmTotpBind(): Promise<void> {
  if (!/^\d{6}$/.test(totpCode.value)) {
    ElMessage.warning("请输入 6 位验证码");
    return;
  }
  totpBinding.value = true;
  try {
    await bindTotp(totpCode.value);
    ElMessage.success("2FA 已启用");
    totpEnabled.value = true;
    totpDialogVisible.value = false;
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "验证码错误，绑定失败");
  } finally {
    totpBinding.value = false;
  }
}

async function disableTotp(): Promise<void> {
  try {
    await ElMessageBox.confirm("确认关闭二次验证（2FA）？关闭后登录将不再需要动态验证码。", "关闭确认", {
      type: "warning",
    });
  } catch {
    return;
  }
  try {
    await unbindTotp();
    ElMessage.success("2FA 已关闭");
    totpEnabled.value = false;
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "关闭失败");
  }
}

watch(activeTab, (name) => onTabChange(name));

onMounted(async () => {
  // 主动拉取 /v2/user/me 刷新 storage + authStore.loginUser，保证头像/手机/邮箱/角色/头像框/生日实时回填
  try {
    await authStore.getLoginUserInfo();
  } catch {
    /* ignore */
  }
  if (profileForm.sysUserNickname === "") {
    profileForm.sysUserNickname = display.value.nickname === "-" ? "" : display.value.nickname;
  }
  initLockState();
  window.addEventListener("storage", onLockStorage);
  if (!frameEnabled.value) {
    activeTab.value = "pwd";
  }
});
</script>

<template>
<div class="system-page">
    <el-card shadow="never" class="system-page__card" :body-style="{ padding: '20px' }">
      <el-row :gutter="16">
        <!-- 左侧：头像与基础信息 -->
        <el-col :xs="24" :md="8">
          <el-card class="profile-card" shadow="never">
          <div class="avatar-wrap">
            <div class="avatar-frame-box">
              <div v-if="frameImage" class="avatar-frame-layer" :style="{ backgroundImage: `url(${frameImage})` }"></div>
              <el-avatar :size="88" :src="display.avatar" class="profile-avatar">
                {{ (display.nickname ?? "").charAt(0) }}
              </el-avatar>
            </div>
            <h3 class="nickname">{{ display.nickname }}</h3>
            <p class="username">@{{ display.username }}</p>
            <div class="roles" v-if="display.roles?.length">
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
          <ReButton class="edit-btn" layout="modern" type="primary" icon="Edit" :disabled="isReadonly" @click="openProfile">
            编辑资料
          </ReButton>
        </el-card>
      </el-col>

      <!-- 右侧：头像框 / 修改密码 / 锁屏设置 -->
      <el-col :xs="24" :md="16">
        <el-card class="rounded-md" shadow="never" :body-style="{ paddingTop: '6px' }">
          <ReTab :tabs="tabs" v-model="activeTab" variant="capsule">
            <template #frame>
              <AvatarFramePanel :avatar="display.avatar" @updated="onFrameUpdated" />
            </template>

            <template #pwd>
              <ReForm v-model="pwdForm" layout="modern" label-width="110px" class="pwd-form" :fields="pwdFields">
                <template #actions>
                  <ReButton layout="modern" type="primary" icon="Lock" :loading="savingPwd" :disabled="isReadonly" @click="savePassword">确认修改</ReButton>
                  <ReButton layout="modern" :icon="Refresh" @click="resetPwdForm">重置</ReButton>
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
                    <ReButton layout="modern" type="warning" plain :loading="lockResetting" :disabled="isReadonly" @click="handleResetLockPwd">重置密码</ReButton>
                    <ReButton layout="modern" type="primary" plain :disabled="isReadonly" @click="handleLockNow">立即锁屏</ReButton>
                  </div>
                </template>
                <template v-else>
                  <el-alert type="info" :closable="false" show-icon class="mb-12">
                    设置锁屏密码后，可通过用户菜单「锁屏」入口锁定屏幕。
                  </el-alert>
                  <ReForm v-model="lockForm" layout="modern" label-width="90px" class="lock-form" :fields="lockFields">
                    <template #actions>
                      <ReButton layout="modern" type="primary" :loading="lockSetting" :disabled="isReadonly" @click="handleSetLockPwd">设置密码</ReButton>
                    </template>
                  </ReForm>
                </template>
              </div>
            </template>

            <template #security>
              <div v-loading="totpLoading" class="security-body">
                <div class="security-card">
                  <div class="security-card__left">
                    <el-icon :size="22" color="var(--el-color-primary)"><Lock /></el-icon>
                    <div>
                      <div class="security-card__title">二次验证（2FA）</div>
                      <div class="security-card__desc">开启后登录需输入 TOTP 动态验证码，显著提升账号安全性</div>
                    </div>
                  </div>
                  <div class="security-card__right">
                    <ReTag v-if="totpEnabled" type="success" effect="plain" size="small">已启用</ReTag>
                    <ReTag v-else type="info" effect="plain" size="small">未启用</ReTag>
                    <ReButton
                      layout="modern"
                      v-if="!totpEnabled"
                      type="primary"
                      :disabled="isReadonly"
                      @click="openTotpBind"
                    >开启</ReButton>
                    <ReButton
                      layout="modern"
                      v-else
                      type="danger"
                      plain
                      :disabled="isReadonly"
                      @click="disableTotp"
                    >关闭</ReButton>
                  </div>
                </div>
                <el-alert
                  v-if="isReadonly"
                  title="当前为只读账号，无法修改安全设置"
                  type="warning"
                  :closable="false"
                  show-icon
                  class="mt-12"
                />
              </div>
            </template>

            <template #devices>
              <div v-loading="devicesLoading" class="devices-body">
                <el-table v-if="devices.length" :data="devices" border stripe size="small">
                  <el-table-column type="index" label="#" width="55" align="center" />
                  <el-table-column prop="os" label="设备/系统" min-width="120">
                    <template #default="{ row }">
                      <div class="flex flex-col">
                        <span>{{ row.os || "-" }}</span>
                        <span v-if="isCurrentDevice(row)">
                          <el-tag type="success" size="small" effect="plain">当前设备</el-tag>
                        </span>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column prop="browser" label="浏览器" min-width="120" show-overflow-tooltip>
                    <template #default="{ row }">{{ row.browser || "-" }}</template>
                  </el-table-column>
                  <el-table-column prop="ip" label="IP 地址" min-width="130">
                    <template #default="{ row }">{{ row.ip || "-" }}</template>
                  </el-table-column>
                  <el-table-column prop="address" label="登录地点" min-width="140" show-overflow-tooltip>
                    <template #default="{ row }">{{ row.address || "-" }}</template>
                  </el-table-column>
                  <el-table-column prop="loginTime" label="登录时间" min-width="160">
                    <template #default="{ row }">{{ row.loginTime || "-" }}</template>
                  </el-table-column>
                  <el-table-column label="在线时长" width="110" align="center">
                    <template #default="{ row }">{{ loginDuration(row.loginTime) }}</template>
                  </el-table-column>
                  <el-table-column prop="lastAccessTime" label="最后活跃" min-width="160">
                    <template #default="{ row }">{{ row.lastAccessTime || "-" }}</template>
                  </el-table-column>
                  <el-table-column label="操作" width="100" align="center" fixed="right">
                    <template #default="{ row }">
                      <el-button
                        v-if="!isCurrentDevice(row)"
                        size="small"
                        type="danger"
                        link
                        @click="kickDevice(row)"
                      >远程下线</el-button>
                      <span v-else class="text-xs text-[--el-text-color-secondary]">-</span>
                    </template>
                  </el-table-column>
                </el-table>
                <el-empty v-else description="暂无在线会话" :image-size="90" />
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

    <!-- 2FA 绑定二维码弹窗 -->
    <ReDialog
      v-model="totpDialogVisible"
      title="开启二次验证"
      layout="modern"
      width="420"
      :close-on-click-modal="false"
      :confirm-loading="totpBinding"
      ok-text="确认绑定"
      @ok="confirmTotpBind"
    >
      <div class="totp-bind">
        <img v-if="totpQrcodeUrl" :src="totpQrcodeUrl" alt="TOTP 二维码" class="totp-bind__qrcode" />
        <p class="totp-bind__tip">使用 Google Authenticator 或其他 TOTP 应用扫描二维码</p>
        <ReInput
          layout="modern"
          v-model="totpCode"
          placeholder="请输入 6 位动态验证码"
          maxlength="6"
          class="w-full"
        />
      </div>
    </ReDialog>
    </el-card>
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

.devices-body {
  min-height: 200px;
}

.security-body {
  max-width: 640px;
  min-height: 160px;
}

.mt-12 { margin-top: 12px; }

.security-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  &__left { display: flex; align-items: center; gap: 12px; }
  &__title { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }
  &__desc { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 2px; }
  &__right { display: flex; align-items: center; gap: 10px; }
}

.totp-bind {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  &__qrcode { width: 200px; height: 200px; border: 1px solid var(--el-border-color); border-radius: 8px; }
  &__tip { font-size: 12px; color: var(--el-text-color-secondary); text-align: center; margin: 0; }
}
</style>

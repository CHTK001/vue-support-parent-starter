<script setup lang="ts">
/**
 * 个人设置页面（/system/settings）
 *
 * 提供界面偏好、通知偏好、安全设置等配置。
 * 优先从云端（/v2/user/preference）加载和保存，localStorage 作为降级缓存。
 * 全部使用 ReXxx modern 组件渲染。
 */
import { message } from "@repo/core";
import { computed, onMounted, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { Monitor, Bell, Lock, Setting, Upload } from "@element-plus/icons-vue";
import ReTab, { type ReTabItem } from "@repo/ui/re-tab";
import ReForm, { type ReFormField } from "@repo/ui/re-form";
import ReSelect from "@repo/ui/re-select";
import ReSwitch from "@repo/ui/re-switch";
import { getFrameworkStorage } from "@repo/utils";
import {
  getUserPreference,
  updateUserPreference,
  getTotpStatus,
  generateTotpQrcode,
  bindTotp,
  unbindTotp,
} from "../api/systemApi";

const activeTab = ref("appearance");

const tabs: ReTabItem[] = [
  { name: "appearance", label: "界面偏好", icon: "Monitor" },
  { name: "notify", label: "通知偏好", icon: "Bell" },
  { name: "security", label: "安全设置", icon: "Lock" },
];

const PREFS_KEY = "personal-settings";

/** 保存状态：idle / saving / saved / failed */
const saveStatus = ref<"idle" | "saving" | "saved" | "failed">("idle");
const loading = ref(false);
/** 云端是否不可用（离线模式） */
const cloudOffline = ref(false);

/** 右上角同步状态：已同步 / 同步中 / 本地模式 */
const syncState = computed<{ text: string; type: "success" | "warning" | "danger" }>(() => {
  if (saveStatus.value === "saving") return { text: "同步中", type: "warning" };
  if (cloudOffline.value) return { text: "本地模式", type: "warning" };
  if (saveStatus.value === "failed") return { text: "同步失败", type: "danger" };
  if (loading.value) return { text: "同步中", type: "warning" };
  return { text: "已同步", type: "success" };
});

function readLocalPrefs(): Record<string, unknown> {
  try {
    return (getFrameworkStorage().get<Record<string, unknown>>(PREFS_KEY)) ?? {};
  } catch {
    return {};
  }
}

function writeLocalPrefs(data: Record<string, unknown>): void {
  getFrameworkStorage().set(PREFS_KEY, data);
}

function applyPrefs(saved: Record<string, unknown>): void {
  interfaceForm.value = {
    theme: (saved.theme as string) || "light",
    language: (saved.language as string) || "zh-CN",
    density: (saved.density as string) || "default",
  };
  notifyForm.value = {
    system: (saved.system as boolean) ?? true,
    message: (saved.message as boolean) ?? true,
    task: (saved.task as boolean) ?? false,
    email: (saved.email as boolean) ?? false,
  };
  securityForm.value = {
    loginRemind: (saved.loginRemind as boolean) ?? false,
    twoFactor: (saved.twoFactor as boolean) ?? false,
  };
}

const interfaceForm = ref({ theme: "light", language: "zh-CN", density: "default" });
const notifyForm = ref({ system: true, message: true, task: false, email: false });
const securityForm = ref({ loginRemind: false, twoFactor: false });

async function loadPrefs(): Promise<void> {
  loading.value = true;
  // 先从本地缓存快速渲染
  applyPrefs(readLocalPrefs());
  try {
    const res = await getUserPreference();
    cloudOffline.value = false;
    const cloudPref = res?.data;
    if (cloudPref) {
      try {
        const parsed = JSON.parse(cloudPref) as Record<string, unknown>;
        applyPrefs(parsed);
        writeLocalPrefs(parsed);
      } catch {
        // 云端数据解析失败，保留本地缓存
      }
    }
  } catch {
    // 云端不可用时使用本地缓存（离线模式）
    cloudOffline.value = true;
    console.warn("[personal-settings] 云端偏好加载失败，使用本地缓存");
  } finally {
    loading.value = false;
  }
}

async function savePrefs(): Promise<void> {
  const data = {
    ...interfaceForm.value,
    ...notifyForm.value,
    ...securityForm.value,
  };
  // 先写本地缓存，保证即时生效
  writeLocalPrefs(data);
  saveStatus.value = "saving";
  try {
    await updateUserPreference(JSON.stringify(data));
    saveStatus.value = "saved";
    message.success("偏好设置已同步到云端");
    setTimeout(() => {
      if (saveStatus.value === "saved") saveStatus.value = "idle";
    }, 2000);
  } catch (e) {
    saveStatus.value = "failed";
    cloudOffline.value = true;
    message.warning((e as Error)?.message ?? "当前为本地模式，设置不会同步到云端");
  }
}

function resetPrefs(): void {
  const defaults = {
    theme: "light",
    language: "zh-CN",
    density: "default",
    system: true,
    message: true,
    task: false,
    email: false,
    loginRemind: false,
    twoFactor: false,
  };
  applyPrefs(defaults);
  writeLocalPrefs(defaults);
  updateUserPreference(JSON.stringify(defaults)).catch(() => {
    /* 忽略云端重置失败 */
  });
  message.success("已恢复默认偏好");
}

const appearanceFields: ReFormField[] = [
  {
    prop: "theme",
    label: "主题氛围",
    component: "radio",
    options: [
      { label: "浅色", value: "light" },
      { label: "深色", value: "dark" },
      { label: "跟随系统", value: "auto" },
    ],
  },
  {
    prop: "language",
    label: "界面语言",
    component: ReSelect,
    attrs: {
      layout: "modern",
      options: [
        { label: "简体中文", value: "zh-CN" },
        { label: "English", value: "en-US" },
      ],
      style: "width: 200px",
    },
  },
  {
    prop: "density",
    label: "面板密度",
    component: "radio",
    options: [
      { label: "舒适", value: "comfortable" },
      { label: "适中", value: "default" },
      { label: "紧凑", value: "compact" },
    ],
  },
];

const notifyFields: ReFormField[] = [
  { prop: "system", label: "系统通知", component: ReSwitch, attrs: { layout: "modern" } },
  { prop: "message", label: "消息提醒", component: ReSwitch, attrs: { layout: "modern" } },
  { prop: "task", label: "任务提醒", component: ReSwitch, attrs: { layout: "modern" } },
  { prop: "email", label: "邮件通知", component: ReSwitch, attrs: { layout: "modern" } },
];

const securityFields: ReFormField[] = [
  {
    prop: "loginRemind",
    label: "登录提醒",
    component: ReSwitch,
    attrs: { layout: "modern" },
    help: "新设备登录时发送提醒",
  },
];

/* ================== 二次验证（2FA / TOTP）真实接口 ================== */
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
    securityForm.value.twoFactor = totpEnabled.value;
  } catch {
    totpEnabled.value = false;
  } finally {
    totpLoading.value = false;
  }
}

/** 打开绑定弹窗并拉取二维码 */
async function openTotpBind(): Promise<void> {
  totpCode.value = "";
  totpDialogVisible.value = true;
  try {
    const blob = await generateTotpQrcode();
    if (totpQrcodeUrl.value) URL.revokeObjectURL(totpQrcodeUrl.value);
    totpQrcodeUrl.value = URL.createObjectURL(blob);
  } catch (e) {
    message.error((e as Error)?.message ?? "获取二维码失败");
    totpDialogVisible.value = false;
  }
}

/** 确认绑定 */
async function confirmTotpBind(): Promise<void> {
  if (!/^\d{6}$/.test(totpCode.value)) {
    message.warning("请输入 6 位验证码");
    return;
  }
  totpBinding.value = true;
  try {
    await bindTotp(totpCode.value);
    message.success("2FA 已启用");
    totpEnabled.value = true;
    securityForm.value.twoFactor = true;
    totpDialogVisible.value = false;
  } catch (e) {
    message.error((e as Error)?.message ?? "验证码错误，绑定失败");
  } finally {
    totpBinding.value = false;
  }
}

/** 关闭二次验证开关 */
async function onTotpSwitchChange(val: boolean): Promise<void> {
  if (val) {
    // 打开：若未启用则走绑定流程
    if (totpEnabled.value) return;
    await openTotpBind();
  } else {
    // 关闭：解绑
    if (!totpEnabled.value) return;
    try {
      await ElMessageBox.confirm("确认关闭二次验证（2FA）？关闭后登录将不再需要动态验证码。", "关闭确认", {
        type: "warning",
      });
    } catch {
      securityForm.value.twoFactor = true;
      return;
    }
    try {
      await unbindTotp();
      message.success("已关闭二次验证");
      totpEnabled.value = false;
      securityForm.value.twoFactor = false;
    } catch (e) {
      message.error((e as Error)?.message ?? "关闭失败");
      securityForm.value.twoFactor = true;
    }
  }
}

onMounted(() => {
  loadPrefs();
  loadTotpStatus();
});
</script>

<template>
  <div class="system-page settings-page">
    <el-card class="system-page__card settings-card" shadow="never" :body-style="{ paddingTop: '6px' }">
      <div class="settings-header">
        <span class="settings-header__title">个人偏好设置</span>
        <el-tag :type="syncState.type" effect="plain" >
          <span class="flex items-center gap-1">
            <span class="sync-dot" :class="syncState.type" />
            {{ syncState.text }}
          </span>
        </el-tag>
      </div>
      <el-alert
        v-if="cloudOffline"
        title="离线模式：当前云端不可用，偏好仅保存到本地浏览器"
        type="warning"
        :closable="false"
        show-icon
        class="mb-2"
      />
      <ReTab :tabs="tabs" v-model="activeTab" variant="capsule">
        <template #appearance>
          <ReForm
            v-model="interfaceForm"
            layout="modern"
            label-width="90px"
            class="settings-form"
            :fields="appearanceFields"
          />
        </template>

        <template #notify>
          <ReForm
            v-model="notifyForm"
            layout="modern"
            label-width="90px"
            class="settings-form"
            :fields="notifyFields"
          />
        </template>

        <template #security>
          <ReForm
            v-model="securityForm"
            layout="modern"
            label-width="90px"
            class="settings-form"
            :fields="securityFields"
          />
          <div class="totp-card" v-loading="totpLoading">
            <div class="totp-card__row">
              <div class="totp-card__info">
                <span class="totp-card__label">二次验证（2FA）</span>
                <span class="totp-card__desc">开启后登录需输入动态验证码，提升账号安全</span>
              </div>
              <el-switch
                :model-value="totpEnabled"
                @change="(v: boolean) => onTotpSwitchChange(v)"
              />
            </div>
            <el-tag v-if="totpEnabled" type="success" effect="plain" >已启用</el-tag>
            <el-tag v-else type="info" effect="plain" >未启用</el-tag>
          </div>
        </template>
      </ReTab>

      <!-- 2FA 绑定二维码弹窗 -->
      <ReDialog
        v-model="totpDialogVisible"
        title="绑定二次验证"
        layout="modern"
        width="420"
        :close-on-click-modal="false"
        compact
        :confirm-loading="totpBinding"
        ok-text="确认绑定"
        :footer-hidden="false" @ok="confirmTotpBind"
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

      <div class="tab-actions">
        <ReButton
          layout="modern"
          type="primary"
          :icon="saveStatus === 'saving' ? Upload : Setting"
          :loading="saveStatus === 'saving'"
          @click="savePrefs"
        >
          {{ saveStatus === "saving" ? "同步中..." : saveStatus === "saved" ? "已同步" : "保存设置" }}
        </ReButton>
        <ReButton layout="modern" @click="resetPrefs">恢复默认</ReButton>
        <span class="sync-hint" v-loading="loading">
          <el-icon><Monitor /></el-icon>
          <span v-if="loading">正在从云端同步...</span>
          <span v-else-if="saveStatus === 'failed'" class="text-[--el-color-warning]">本地缓存模式</span>
          <span v-else class="text-[--el-text-color-secondary]">云端已同步</span>
        </span>
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.system-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0;
  height: 100%;
}
.system-page__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.system-page__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.system-page__subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.system-page__card {
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
}

.settings-page {
  max-width: 760px;

  .settings-card {
    width: 100%;
  }

  .settings-form {
    max-width: 480px;
  }

  .tab-actions {
    margin-top: 16px;
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .settings-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 0 12px;

    &__title {
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .sync-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;

    &.success { background: var(--el-color-success); }
    &.warning { background: var(--el-color-warning); }
    &.danger { background: var(--el-color-danger); }
  }

  .mb-2 { margin-bottom: 8px; }

  .sync-hint {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    margin-left: 8px;
  }

  .totp-card {
    margin-top: 8px;
    max-width: 480px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;

    &__row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    &__label { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); display: block; }
    &__desc { font-size: 12px; color: var(--el-text-color-secondary); }
  }

  .totp-bind {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;

    &__qrcode {
      width: 200px;
      height: 200px;
      border: 1px solid var(--el-border-color);
      border-radius: 8px;
    }
    &__tip { font-size: 12px; color: var(--el-text-color-secondary); text-align: center; margin: 0; }
  }
}
</style>

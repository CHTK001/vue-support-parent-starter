<script setup lang="ts">
/**
 * 个人设置页面（/system/settings）
 *
 * 提供界面偏好、通知偏好、安全设置等本地持久化配置。
 * 全部使用 ReXxx modern 组件渲染。
 */
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { Monitor, Bell, Lock, Setting } from "@element-plus/icons-vue";
import ReTab, { type ReTabItem } from "@repo/ui/re-tab";
import ReForm, { type ReFormField } from "@repo/ui/re-form";
import ReSelect from "@repo/ui/re-select";
import ReSwitch from "@repo/ui/re-switch";

const activeTab = ref("appearance");

const tabs: ReTabItem[] = [
  { name: "appearance", label: "界面偏好", icon: "Monitor" },
  { name: "notify", label: "通知偏好", icon: "Bell" },
  { name: "security", label: "安全设置", icon: "Lock" },
];

const PREFS_KEY = "personal-settings";

function readPrefs(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function writePrefs(data: Record<string, unknown>): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(data));
}

const interfaceForm = ref({ theme: "light", language: "zh-CN", density: "default" });
const notifyForm = ref({ system: true, message: true, task: false, email: false });
const securityForm = ref({ loginRemind: false, twoFactor: false });

function loadPrefs(): void {
  const saved = readPrefs();
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

function savePrefs(): void {
  writePrefs({
    ...interfaceForm.value,
    ...notifyForm.value,
    ...securityForm.value,
  });
  ElMessage.success("偏好设置已保存");
}

function resetPrefs(): void {
  localStorage.removeItem(PREFS_KEY);
  loadPrefs();
  ElMessage.success("已恢复默认偏好");
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
  {
    prop: "twoFactor",
    label: "双重验证",
    component: ReSwitch,
    attrs: { layout: "modern" },
    help: "登录时需额外验证，提升账号安全",
  },
];

onMounted(loadPrefs);
</script>

<template>
  <div class="system-page settings-page">
    <el-card class="system-page__card settings-card" shadow="never" :body-style="{ paddingTop: '6px' }">
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
        </template>
      </ReTab>

      <div class="tab-actions">
        <ReButton layout="modern" type="primary" icon="Setting" @click="savePrefs">保存设置</ReButton>
        <ReButton layout="modern" @click="resetPrefs">恢复默认</ReButton>
      </div>
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
  }
}
</style>

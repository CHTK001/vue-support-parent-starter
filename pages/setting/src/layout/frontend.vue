<script setup lang="ts">
import ScAlert from "@repo/components/ScAlert";
import { computed, reactive } from "vue";
import {
  canManageFrontendSystemConfig,
  getFrontendSystemConfig,
  getInitialConfig,
  resetFrontendSystemConfig,
  saveFrontendSystemConfig,
  type FontEncryptionNoiseLevel,
  type FrontendSystemConfig,
} from "@repo/config";
import { useUserStoreHook, syncFrontendSystemRuntime } from "@repo/core";
import { message } from "@repo/utils";

defineOptions({
  name: "FrontendStaticSetting",
});

const baseConfig = getInitialConfig();
const userStore = useUserStoreHook();
const accessible = computed(() =>
  canManageFrontendSystemConfig(userStore.roles),
);

const createFormState = (config: FrontendSystemConfig): FrontendSystemConfig => ({
  ...config,
});

const form = reactive(createFormState(getFrontendSystemConfig(baseConfig)));
const noiseLevelOptions: Array<{
  label: string;
  value: FontEncryptionNoiseLevel;
}> = [
  { label: "低", value: "low" },
  { label: "中", value: "medium" },
  { label: "高", value: "high" },
];

const applyForm = (config: FrontendSystemConfig) => {
  Object.assign(form, createFormState(config));
  if (form.crashPageOpen) {
    setDebugProtectionMode("crash");
    return;
  }
  if (form.loopDebuggerOpen) {
    setDebugProtectionMode("loop");
    return;
  }
  if (form.debugOverlayOpen) {
    setDebugProtectionMode("overlay");
    return;
  }
  setDebugProtectionMode("none");
};

type ToggleFieldKey =
  | "themeSkinEnabled"
  | "themeManagementEnabled"
  | "loginThemeSwitcherEnabled"
  | "debugProtectionEnabled"
  | "debugBypassEnabled"
  | "storageEncode"
  | "fontEncryptionEnabled"
  | "fontEncryptionApplyGlobal"
  | "fontEncryptionDisableCopy"
  | "fontEncryptionOcrNoise";

type DebugProtectionMode = "crash" | "loop" | "overlay" | "none";

const themeToggleItems: Array<{
  key: ToggleFieldKey;
  title: string;
  description: string;
}> = [
  {
    key: "themeSkinEnabled",
    title: "主题皮肤功能",
    description: "控制主题皮肤能力总开关，dev 环境仍默认展示入口。",
  },
  {
    key: "themeManagementEnabled",
    title: "主题管理页",
    description: "控制 `system/setting` 中主题管理卡片是否显示。",
  },
  {
    key: "loginThemeSwitcherEnabled",
    title: "登录页主题切换器",
    description: "控制登录页右上角主题切换入口是否展示。",
  },
];

const debugToggleItems: Array<{
  key: ToggleFieldKey;
  title: string;
  description: string;
}> = [
  {
    key: "debugProtectionEnabled",
    title: "前端防调试",
    description: "总开关，关闭后所有调试防护策略都会失效。",
  },
  {
    key: "debugBypassEnabled",
    title: "地址栏绕过",
    description: "开启后可通过指定调试参数绕过防调试限制。",
  },
];

const storageToggleItems: Array<{
  key: ToggleFieldKey;
  title: string;
  description: string;
}> = [
  {
    key: "storageEncode",
    title: "本地存储加密",
    description: "建议保持开启，修改后刷新页面可避免旧缓存干扰。",
  },
  {
    key: "fontEncryptionEnabled",
    title: "字体加密",
    description: "将部分系统级保护能力前移到前端静态配置控制。",
  },
  {
    key: "fontEncryptionApplyGlobal",
    title: "全局字体加密",
    description: "开启后对页面内容统一应用字体加密处理。",
  },
  {
    key: "fontEncryptionDisableCopy",
    title: "禁用复制",
    description: "禁用复制与常见右键复制相关行为。",
  },
  {
    key: "fontEncryptionOcrNoise",
    title: "OCR 干扰噪点",
    description: "开启额外噪点层增强 OCR 识别干扰。",
  },
];

const debugModeCards: Array<{
  mode: DebugProtectionMode;
  title: string;
  description: string;
}> = [
  {
    mode: "crash",
    title: "崩溃页模式",
    description: "最高优先级，检测到 DevTools 后直接切换到崩溃页。",
  },
  {
    mode: "loop",
    title: "循环 debugger",
    description: "中优先级，持续触发 debugger，适合更强干预。",
  },
  {
    mode: "overlay",
    title: "弹出遮罩层",
    description: "低优先级，显示遮罩并阻断页面交互。",
  },
  {
    mode: "none",
    title: "不启用策略",
    description: "仅保留总开关，不启用具体调试拦截策略。",
  },
];

const getToggleValue = (key: ToggleFieldKey) => Boolean(form[key]);

const setDebugProtectionMode = (mode: DebugProtectionMode) => {
  form.crashPageOpen = mode === "crash";
  form.loopDebuggerOpen = mode === "loop";
  form.debugOverlayOpen = mode === "overlay";
};

const debugProtectionMode = computed<DebugProtectionMode>({
  get: () => {
    if (form.crashPageOpen) {
      return "crash";
    }
    if (form.loopDebuggerOpen) {
      return "loop";
    }
    if (form.debugOverlayOpen) {
      return "overlay";
    }
    return "none";
  },
  set: (mode) => {
    setDebugProtectionMode(mode);
  },
});

applyForm(form as FrontendSystemConfig);

const currentDebugProtectionDescription = computed(() => {
  const current = debugModeCards.find((item) => item.mode === debugProtectionMode.value);
  return current?.description || "未启用调试策略";
});

type SummaryCardStatus = "success" | "danger" | "info";

const statusMeta: Record<
  SummaryCardStatus,
  { label: string; cardClass: string }
> = {
  success: {
    label: "开启",
    cardClass: "summary-card--success",
  },
  danger: {
    label: "关闭",
    cardClass: "summary-card--danger",
  },
  info: {
    label: "未设置",
    cardClass: "summary-card--info",
  },
};

const resolveEnabledStatus = (value: boolean): SummaryCardStatus =>
  value ? "success" : "danger";

const resolveDebugModeStatus = (
  mode: Exclude<DebugProtectionMode, "none">,
): SummaryCardStatus => {
  if (!form.debugProtectionEnabled) {
    return "danger";
  }

  if (debugProtectionMode.value === "none") {
    return "info";
  }

  return debugProtectionMode.value === mode ? "success" : "danger";
};

const summaryCards = computed(() => {
  return [
    {
      title: "字体加密",
      description: "前端字体保护能力",
      status: resolveEnabledStatus(form.fontEncryptionEnabled),
    },
    {
      title: "存储加密",
      description: "浏览器本地缓存编码",
      status: resolveEnabledStatus(form.storageEncode),
    },
    {
      title: "防调试总开关",
      description: "控制所有调试防护策略",
      status: resolveEnabledStatus(form.debugProtectionEnabled),
    },
    {
      title: "崩溃页策略",
      description: "优先级最高",
      status: resolveDebugModeStatus("crash"),
    },
    {
      title: "循环 debugger",
      description: "中优先级干预",
      status: resolveDebugModeStatus("loop"),
    },
    {
      title: "遮罩层策略",
      description: "低优先级阻断交互",
      status: resolveDebugModeStatus("overlay"),
    },
  ].map((item) => ({
    ...item,
    label: statusMeta[item.status].label,
    cardClass: statusMeta[item.status].cardClass,
  }));
});

const toggleFieldCard = (key: ToggleFieldKey) => {
  form[key] = !form[key];
};

const debugBypassPreview = computed(() => {
  const paramName = form.debugBypassParamName?.trim() || "sk";
  if (!form.debugBypassEnabled) {
    return "已关闭地址栏调试绕过";
  }

  if (!form.debugBypassSecret) {
    return `?${paramName}=1`;
  }

  return `?${paramName}=${form.debugBypassSecret}`;
});

const guardAccess = () => {
  if (accessible.value) {
    return true;
  }

  message("仅 superadmin 或 dev 环境允许修改前端静态配置", {
    type: "error",
  });
  return false;
};

const handleReload = async () => {
  applyForm(getFrontendSystemConfig(baseConfig));
  await syncFrontendSystemRuntime(baseConfig);
  message("已重新读取前端静态配置", { type: "success" });
};

const handleSave = async () => {
  if (!guardAccess()) {
    return;
  }

  const nextConfig = saveFrontendSystemConfig(form, baseConfig);
  applyForm(nextConfig);
  await syncFrontendSystemRuntime(baseConfig);
  message("前端静态配置已保存并生效", { type: "success" });
};

const handleReset = async () => {
  if (!guardAccess()) {
    return;
  }

  const nextConfig = resetFrontendSystemConfig(baseConfig);
  applyForm(nextConfig);
  await syncFrontendSystemRuntime(baseConfig);
  message("已恢复前端静态默认配置", { type: "success" });
};
</script>

<template>
  <div class="frontend-setting system-container modern-bg">
    <ScAlert
      title="前端静态系统配置"
      type="info"
      :closable="false"
      style="margin-bottom: 20px"
    >
      <template #default>
        <p>这里的配置保存在浏览器本地，仅对当前前端环境生效，不依赖后台参数。</p>
        <p>适用于 superadmin 或 dev 环境快速控制主题皮肤、前端防调试、字体加密等系统级前端能力。</p>
      </template>
    </ScAlert>

    <ScAlert
      v-if="!accessible"
      title="当前账号不可修改"
      type="warning"
      :closable="false"
      style="margin-bottom: 20px"
    >
      <template #default>
        <p>仅 `superadmin` 角色或 `dev` 环境允许编辑此页。</p>
      </template>
    </ScAlert>

    <ScCard shadow="never" style="margin-bottom: 20px">
      <template #header>
        <div class="card-header">
          <IconifyIconOnline icon="ri:pulse-line" />
          <span>当前生效状态</span>
        </div>
      </template>

      <div class="summary-card-grid">
        <ScCard
          v-for="item in summaryCards"
          :key="item.title"
          class="summary-card"
          :class="item.cardClass"
          shadow="never"
        >
          <div class="summary-card__head">
            <span class="summary-card__title">{{ item.title }}</span>
            <ScTag
              :type="item.status === 'info' ? 'info' : item.status"
              size="small"
            >
              {{ item.label }}
            </ScTag>
          </div>
          <div class="summary-card__desc">{{ item.description }}</div>
        </ScCard>
      </div>
    </ScCard>

    <ScCard shadow="never" style="margin-bottom: 20px">
      <template #header>
        <div class="card-header">
          <IconifyIconOnline icon="ri:palette-line" />
          <span>主题皮肤</span>
        </div>
      </template>

      <div class="toggle-card-grid">
        <ScCard
          v-for="item in themeToggleItems"
          :key="item.key"
          class="toggle-card"
          :class="{ 'toggle-card--active': getToggleValue(item.key) }"
          :active="getToggleValue(item.key)"
          hoverable
          @click="toggleFieldCard(item.key)"
        >
          <div class="toggle-card__head">
            <span class="toggle-card__title">{{ item.title }}</span>
            <ScTag :type="getToggleValue(item.key) ? 'success' : 'info'" size="small">
              {{ getToggleValue(item.key) ? "已开启" : "已关闭" }}
            </ScTag>
          </div>
          <div class="toggle-card__desc">{{ item.description }}</div>
        </ScCard>
      </div>
      <div class="form-item-tip">dev 环境下默认仍显示主题相关入口，方便调试与验收。</div>
    </ScCard>

    <ScCard shadow="never" style="margin-bottom: 20px">
      <template #header>
        <div class="card-header">
          <IconifyIconOnline icon="ri:shield-flash-line" />
          <span>调试防护</span>
        </div>
      </template>

      <div class="toggle-card-grid">
        <ScCard
          v-for="item in debugToggleItems"
          :key="item.key"
          class="toggle-card"
          :class="{ 'toggle-card--active': getToggleValue(item.key) }"
          :active="getToggleValue(item.key)"
          hoverable
          @click="toggleFieldCard(item.key)"
        >
          <div class="toggle-card__head">
            <span class="toggle-card__title">{{ item.title }}</span>
            <ScTag :type="getToggleValue(item.key) ? 'success' : 'info'" size="small">
              {{ getToggleValue(item.key) ? "已开启" : "已关闭" }}
            </ScTag>
          </div>
          <div class="toggle-card__desc">{{ item.description }}</div>
        </ScCard>
      </div>

      <div class="mode-card-grid">
        <ScCard
          v-for="item in debugModeCards"
          :key="item.mode"
          class="toggle-card"
          :class="{ 'toggle-card--active': debugProtectionMode === item.mode }"
          :active="debugProtectionMode === item.mode"
          hoverable
          @click="debugProtectionMode = item.mode"
        >
          <div class="toggle-card__head">
            <span class="toggle-card__title">{{ item.title }}</span>
            <ScTag :type="debugProtectionMode === item.mode ? 'warning' : 'info'" size="small">
              {{ debugProtectionMode === item.mode ? "当前策略" : "可选" }}
            </ScTag>
          </div>
          <div class="toggle-card__desc">{{ item.description }}</div>
        </ScCard>
      </div>
      <div class="form-item-tip">
        防调试策略按优先级只会启用一个：崩溃页模式 > 循环 debugger > 弹出遮罩层。当前生效说明：{{ currentDebugProtectionDescription }}
      </div>

      <ScForm :model="form" label-width="180px">
        <ScFormItem label="绕过参数名">
          <ScInput v-model="form.debugBypassParamName" placeholder="默认 sk" />
          <div class="form-item-tip">例如 `sk`，则地址栏参数形如 `?sk=xxx`。</div>
        </ScFormItem>

        <ScFormItem label="绕过密钥">
          <ScInput
            v-model="form.debugBypassSecret"
            type="password"
            placeholder="为空时只要带参数即绕过"
            show-password
          />
          <div class="form-item-tip">当前示例：{{ debugBypassPreview }}</div>
        </ScFormItem>
      </ScForm>
    </ScCard>

    <ScCard shadow="never">
      <template #header>
        <div class="card-header">
          <IconifyIconOnline icon="ri:font-size-ai" />
          <span>存储与字体加密</span>
        </div>
      </template>

      <div class="toggle-card-grid">
        <ScCard
          v-for="item in storageToggleItems"
          :key="item.key"
          class="toggle-card"
          :class="{ 'toggle-card--active': getToggleValue(item.key) }"
          :active="getToggleValue(item.key)"
          hoverable
          @click="toggleFieldCard(item.key)"
        >
          <div class="toggle-card__head">
            <span class="toggle-card__title">{{ item.title }}</span>
            <ScTag :type="getToggleValue(item.key) ? 'success' : 'info'" size="small">
              {{ getToggleValue(item.key) ? "已开启" : "已关闭" }}
            </ScTag>
          </div>
          <div class="toggle-card__desc">{{ item.description }}</div>
        </ScCard>
      </div>

      <ScForm :model="form" label-width="180px">
        <ScFormItem label="噪点级别">
          <ScSelect v-model="form.fontEncryptionOcrNoiseLevel" placeholder="请选择级别">
            <ScOption
              v-for="item in noiseLevelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ScSelect>
          <div class="form-item-tip">建议默认使用“低”，高强度只在高敏场景开启。</div>
        </ScFormItem>
      </ScForm>
    </ScCard>

    <div class="action-bar">
      <ScButton @click="handleReload">
        <IconifyIconOnline icon="ri:refresh-line" style="margin-right: 5px" />
        重新读取
      </ScButton>
      <ScButton type="warning" @click="handleReset" :disabled="!accessible">
        <IconifyIconOnline icon="ri:restart-line" style="margin-right: 5px" />
        恢复默认
      </ScButton>
      <ScButton type="primary" @click="handleSave" :disabled="!accessible">
        <IconifyIconOnline icon="ri:save-line" style="margin-right: 5px" />
        保存并生效
      </ScButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.frontend-setting {
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.toggle-card-grid,
.mode-card-grid,
.summary-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.mode-card-grid {
  margin-top: 16px;
}

.summary-card {
  min-height: 114px;
  border: 1px solid var(--el-border-color-lighter);
  background: color-mix(in srgb, var(--el-bg-color) 88%, transparent);

  &--success {
    border-color: rgba(var(--el-color-success-rgb), 0.24);
    background:
      linear-gradient(
        135deg,
        rgba(var(--el-color-success-rgb), 0.08) 0%,
        rgba(var(--el-color-success-rgb), 0.02) 100%
      ),
      var(--stitch-lay-bg-panel);
  }

  &--danger {
    border-color: rgba(var(--el-color-danger-rgb), 0.2);
    background:
      linear-gradient(
        135deg,
        rgba(var(--el-color-danger-rgb), 0.07) 0%,
        rgba(var(--el-color-danger-rgb), 0.02) 100%
      ),
      var(--stitch-lay-bg-panel);
  }

  &--info {
    border-color: rgba(var(--el-color-info-rgb), 0.18);
    background:
      linear-gradient(
        135deg,
        rgba(var(--el-color-info-rgb), 0.07) 0%,
        rgba(var(--el-color-info-rgb), 0.02) 100%
      ),
      var(--stitch-lay-bg-panel);
  }

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }

  &__title {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__desc {
    font-size: 13px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
  }
}

.toggle-card {
  cursor: pointer;
  min-height: 138px;

  &--active {
    border-color: rgba(var(--el-color-primary-rgb), 0.32);
    box-shadow:
      0 18px 32px -26px rgba(var(--el-color-primary-rgb), 0.32),
      inset 0 0 0 1px rgba(var(--el-color-primary-rgb), 0.18);
    background:
      linear-gradient(
        135deg,
        rgba(var(--el-color-primary-rgb), 0.08) 0%,
        rgba(var(--el-color-primary-rgb), 0.02) 100%
      ),
      var(--stitch-lay-bg-panel);
  }

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  &__title {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__desc {
    font-size: 13px;
    line-height: 1.7;
    color: var(--el-text-color-secondary);
  }
}

.form-item-tip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

.action-bar {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>

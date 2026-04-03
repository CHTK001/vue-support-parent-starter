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

const createFormState = (
  config: FrontendSystemConfig,
): FrontendSystemConfig => ({
  ...config,
});

const RANDOM_PARAM_PREFIX = "sk";
const RANDOM_PARAM_ALPHABET = "abcdefghijklmnopqrstuvwxyz";

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

const handleSelectDebugMode = (mode: DebugProtectionMode) => {
  debugProtectionMode.value = mode;
};

applyForm(form as FrontendSystemConfig);

const currentDebugProtectionDescription = computed(() => {
  const current = debugModeCards.find(
    (item) => item.mode === debugProtectionMode.value,
  );
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

const createRandomParamName = () => {
  const getRandomInt = (max: number) => {
    if (
      typeof window !== "undefined" &&
      typeof window.crypto !== "undefined" &&
      typeof window.crypto.getRandomValues === "function"
    ) {
      return window.crypto.getRandomValues(new Uint32Array(1))[0] % max;
    }

    return Math.floor(Math.random() * max);
  };

  const chars = Array.from(
    { length: 6 },
    () => RANDOM_PARAM_ALPHABET[getRandomInt(RANDOM_PARAM_ALPHABET.length)],
  ).join("");

  return `${RANDOM_PARAM_PREFIX}_${chars}`;
};

const handleGenerateRandomParamName = () => {
  form.debugBypassParamName = createRandomParamName();
  message("已生成新的绕过参数名", { type: "success" });
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
  <div class="frontend-setting-shell system-container modern-bg">
    <section class="frontend-hero">
      <div class="frontend-hero__main">
        <span class="frontend-hero__eyebrow">固定组 / 前端静态配置</span>
        <h2 class="frontend-hero__title">本地前端能力控制台</h2>
        <p class="frontend-hero__desc">
          这里的配置保存在浏览器本地，仅影响当前前端环境，不写入远程系统参数。用于快速控制主题皮肤、防调试、存储与字体保护等前端能力。
        </p>
      </div>
      <div class="frontend-hero__meta">
        <div class="frontend-pill">
          <span class="frontend-pill__label">读写范围</span>
          <strong class="frontend-pill__value">浏览器本地</strong>
        </div>
        <div class="frontend-pill">
          <span class="frontend-pill__label">可编辑身份</span>
          <strong class="frontend-pill__value">
            {{ accessible ? "superadmin / dev" : "当前账号只读" }}
          </strong>
        </div>
      </div>
    </section>

    <ScAlert
      v-if="!accessible"
      title="当前账号不可修改"
      type="warning"
      :closable="false"
      class="frontend-notice"
    >
      <template #default>
        <p>仅 `superadmin` 角色或 `dev` 环境允许编辑此页。</p>
      </template>
    </ScAlert>

    <ScCard shadow="never" class="section-card section-card--summary">
      <template #header>
        <div class="section-heading">
          <div>
            <div class="section-heading__eyebrow">二级标题 / 当前状态</div>
            <div class="section-heading__title-row">
              <IconifyIconOnline icon="ri:pulse-line" />
              <span>当前生效状态总览</span>
            </div>
          </div>
          <p class="section-heading__desc">
            用摘要卡快速确认当前启用项，避免在多个分区里来回找状态。
          </p>
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

    <ScCard shadow="never" class="section-card">
      <template #header>
        <div class="section-heading">
          <div>
            <div class="section-heading__eyebrow">二级标题 / 主题能力</div>
            <div class="section-heading__title-row">
              <IconifyIconOnline icon="ri:palette-line" />
              <span>主题皮肤与入口开关</span>
            </div>
          </div>
          <p class="section-heading__desc">
            固定组里的主题管理、登录页主题切换器等能力统一在这里定义。
          </p>
        </div>
      </template>

      <div class="visual-switch-grid">
        <ScSwitch
          v-for="item in themeToggleItems"
          :key="item.key"
          v-model="form[item.key]"
          layout="visual-card"
          wide
          :label="item.title"
          :description="item.description"
          :ribbon-text="getToggleValue(item.key) ? '开启' : '关闭'"
        />
      </div>

      <div class="section-note">
        dev 环境下默认仍显示主题相关入口，便于调试与验收。
      </div>
    </ScCard>

    <ScCard shadow="never" class="section-card">
      <template #header>
        <div class="section-heading">
          <div>
            <div class="section-heading__eyebrow">二级标题 / 调试防护</div>
            <div class="section-heading__title-row">
              <IconifyIconOnline icon="ri:shield-flash-line" />
              <span>防调试总开关与绕过策略</span>
            </div>
          </div>
          <p class="section-heading__desc">
            布尔开关控制能力边界，模式卡决定实际采用的阻断策略。
          </p>
        </div>
      </template>

      <div class="visual-switch-grid">
        <ScSwitch
          v-for="item in debugToggleItems"
          :key="item.key"
          v-model="form[item.key]"
          layout="visual-card"
          wide
          :label="item.title"
          :description="item.description"
          :ribbon-text="getToggleValue(item.key) ? '开启' : '关闭'"
        />
      </div>

      <div class="subsection-panel">
        <div class="subsection-heading">
          <span class="subsection-heading__title">三级标题 / 调试策略模式</span>
          <p class="subsection-heading__desc">
            防调试策略按优先级只会启用一个：崩溃页模式 > 循环 debugger >
            弹出遮罩层。
          </p>
        </div>

        <div class="mode-card-grid">
          <ScCard
            v-for="item in debugModeCards"
            :key="item.mode"
            class="mode-card"
            :class="{ 'mode-card--active': debugProtectionMode === item.mode }"
            shadow="never"
          >
            <div
              class="mode-card__panel"
              role="button"
              tabindex="0"
              @click="handleSelectDebugMode(item.mode)"
              @keydown.enter.prevent="handleSelectDebugMode(item.mode)"
              @keydown.space.prevent="handleSelectDebugMode(item.mode)"
            >
              <div class="mode-card__head">
                <span class="mode-card__title">{{ item.title }}</span>
                <ScTag
                  :type="debugProtectionMode === item.mode ? 'warning' : 'info'"
                  size="small"
                >
                  {{ debugProtectionMode === item.mode ? "当前策略" : "可选" }}
                </ScTag>
              </div>
              <div class="mode-card__desc">{{ item.description }}</div>
            </div>
          </ScCard>
        </div>

        <div class="section-note">
          当前生效说明：{{ currentDebugProtectionDescription }}
        </div>
      </div>

      <div class="editor-panel">
        <div class="subsection-heading">
          <span class="subsection-heading__title"
            >三级标题 / 地址栏绕过参数</span
          >
          <p class="subsection-heading__desc">
            保存后即可通过地址栏参数绕过前端防调试限制。
          </p>
        </div>

        <ScForm :model="form" label-width="140px" class="editor-form">
          <ScFormItem label="绕过参数名">
            <div class="inline-control">
              <ScInput
                v-model="form.debugBypassParamName"
                class="inline-control__input"
                placeholder="默认 sk"
              />
              <ScButton
                type="primary"
                plain
                class="generate-btn"
                @click="handleGenerateRandomParamName"
              >
                随机生成
              </ScButton>
            </div>
            <div class="form-item-tip">
              例如 `sk`，则地址栏参数形如 `?sk=xxx`。
            </div>
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
      </div>
    </ScCard>

    <ScCard shadow="never" class="section-card">
      <template #header>
        <div class="section-heading">
          <div>
            <div class="section-heading__eyebrow">二级标题 / 数据保护</div>
            <div class="section-heading__title-row">
              <IconifyIconOnline icon="ri:font-size-ai" />
              <span>存储与字体加密</span>
            </div>
          </div>
          <p class="section-heading__desc">
            这里用于控制浏览器缓存编码和字体级前端保护能力。
          </p>
        </div>
      </template>

      <div class="visual-switch-grid">
        <ScSwitch
          v-for="item in storageToggleItems"
          :key="item.key"
          v-model="form[item.key]"
          layout="visual-card"
          wide
          :label="item.title"
          :description="item.description"
          :ribbon-text="getToggleValue(item.key) ? '开启' : '关闭'"
        />
      </div>

      <div class="editor-panel">
        <div class="subsection-heading">
          <span class="subsection-heading__title">三级标题 / OCR 干扰强度</span>
          <p class="subsection-heading__desc">
            仅在开启 OCR 干扰噪点后使用，建议默认保持低强度。
          </p>
        </div>

        <ScForm :model="form" label-width="140px" class="editor-form">
          <ScFormItem label="噪点级别">
            <ScSelect
              v-model="form.fontEncryptionOcrNoiseLevel"
              placeholder="请选择级别"
            >
              <ScOption
                v-for="item in noiseLevelOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </ScSelect>
            <div class="form-item-tip">
              建议默认使用“低”，高强度只在高敏场景开启。
            </div>
          </ScFormItem>
        </ScForm>
      </div>
    </ScCard>

    <div class="action-bar">
      <div class="action-bar__summary">
        <span class="action-bar__eyebrow">操作区</span>
        <strong class="action-bar__title">读取、重置、保存完整闭环</strong>
        <p class="action-bar__desc">
          所有修改都先在本地表单回填，再通过保存统一写入浏览器本地配置并即时生效。
        </p>
      </div>
      <div class="action-bar__buttons">
        <ScButton @click="handleReload">
          <IconifyIconOnline icon="ri:refresh-line" style="margin-right: 5px" />
          重新读取
        </ScButton>
        <ScButton type="warning" :disabled="!accessible" @click="handleReset">
          <IconifyIconOnline icon="ri:restart-line" style="margin-right: 5px" />
          恢复默认
        </ScButton>
        <ScButton type="primary" :disabled="!accessible" @click="handleSave">
          <IconifyIconOnline icon="ri:save-line" style="margin-right: 5px" />
          保存并生效
        </ScButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.frontend-setting-shell {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  border-radius: 30px;
  background:
    radial-gradient(
      circle at top left,
      rgba(var(--el-color-primary-rgb), 0.12),
      transparent 28%
    ),
    radial-gradient(
      circle at right center,
      rgba(15, 118, 110, 0.08),
      transparent 26%
    ),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--el-bg-color) 95%, #fff 5%) 0%,
      color-mix(in srgb, var(--el-fill-color-light) 62%, transparent) 100%
    );
}

.frontend-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(280px, 0.9fr);
  gap: 18px;
  padding: 22px 24px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 66%, transparent);
  border-radius: 28px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.96) 0%,
    rgba(248, 250, 252, 0.88) 56%,
    rgba(var(--el-color-primary-rgb), 0.08) 100%
  );
  box-shadow:
    0 24px 44px -34px rgba(15, 23, 42, 0.38),
    inset 0 1px 0 rgba(255, 255, 255, 0.92);
}

.frontend-hero__eyebrow,
.section-heading__eyebrow,
.action-bar__eyebrow {
  display: inline-flex;
  align-items: center;
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--el-color-primary) 72%, #3f4c63 28%);
}

.frontend-hero__title {
  margin: 0;
  font-size: 30px;
  line-height: 1.15;
  color: var(--el-text-color-primary);
}

.frontend-hero__desc,
.section-heading__desc,
.subsection-heading__desc,
.action-bar__desc {
  margin: 0;
  color: var(--el-text-color-secondary);
  line-height: 1.75;
}

.frontend-hero__meta {
  display: grid;
  gap: 14px;
  align-content: start;
}

.frontend-pill {
  padding: 16px 18px;
  border: 1px solid rgba(var(--el-color-primary-rgb), 0.14);
  border-radius: 22px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.92) 0%,
    rgba(var(--el-color-primary-rgb), 0.05) 100%
  );
  box-shadow:
    0 16px 28px -26px rgba(15, 23, 42, 0.44),
    inset 0 1px 0 rgba(255, 255, 255, 0.94);
}

.frontend-pill__label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.frontend-pill__value {
  font-size: 15px;
  color: var(--el-text-color-primary);
}

.frontend-notice {
  margin-bottom: 0;
}

.section-card {
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 68%, transparent);
  border-radius: 26px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--el-bg-color) 98%, #fff 2%) 0%,
    color-mix(in srgb, var(--el-fill-color-light) 74%, transparent) 100%
  );
  box-shadow:
    0 22px 46px -36px rgba(15, 23, 42, 0.32),
    0 1px 0 rgba(255, 255, 255, 0.72) inset;

  :deep(.sc-card-default__header) {
    padding-bottom: 12px;
  }

  :deep(.sc-card-default__body) {
    padding-top: 6px;
  }
}

.section-card--summary {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--el-color-primary) 4%, var(--el-bg-color)) 0%,
    color-mix(in srgb, var(--el-fill-color-light) 82%, transparent) 100%
  );
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.section-heading__title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 22px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.section-heading__desc {
  max-width: 460px;
  padding-top: 22px;
  font-size: 13px;
}

.summary-card-grid,
.mode-card-grid,
.visual-switch-grid {
  display: grid;
  gap: 16px;
}

.summary-card-grid,
.mode-card-grid {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.visual-switch-grid {
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.summary-card {
  min-height: 114px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 70%, transparent);
  border-radius: 20px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.94) 0%,
    rgba(248, 250, 252, 0.92) 100%
  );
  box-shadow:
    0 18px 34px -30px rgba(15, 23, 42, 0.36),
    inset 0 1px 0 rgba(255, 255, 255, 0.92);

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
    border-color: rgba(var(--el-color-danger-rgb), 0.22);
    background:
      linear-gradient(
        135deg,
        rgba(var(--el-color-danger-rgb), 0.08) 0%,
        rgba(var(--el-color-danger-rgb), 0.02) 100%
      ),
      var(--stitch-lay-bg-panel);
  }

  &--info {
    border-color: rgba(var(--el-color-info-rgb), 0.2);
    background:
      linear-gradient(
        135deg,
        rgba(var(--el-color-info-rgb), 0.08) 0%,
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
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  &__desc {
    font-size: 13px;
    line-height: 1.65;
    color: var(--el-text-color-secondary);
  }
}

.subsection-panel,
.editor-panel {
  margin-top: 18px;
  padding: 18px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 72%, transparent);
  border-radius: 22px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--el-bg-color) 99%, #fff 1%) 0%,
    color-mix(in srgb, var(--el-fill-color-light) 74%, transparent) 100%
  );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.92),
    0 14px 30px -28px rgba(15, 23, 42, 0.42);
}

.subsection-heading {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}

.subsection-heading__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.subsection-heading__desc {
  font-size: 13px;
}

.mode-card {
  min-height: 134px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 70%, transparent);
  border-radius: 20px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.94) 0%,
    rgba(248, 250, 252, 0.9) 100%
  );
  box-shadow:
    0 16px 32px -28px rgba(15, 23, 42, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.92);
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    border-color 0.22s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow:
      0 22px 38px -28px rgba(15, 23, 42, 0.42),
      inset 0 1px 0 rgba(255, 255, 255, 0.94);
  }

  &--active {
    border-color: rgba(var(--el-color-primary-rgb), 0.3);
    background:
      linear-gradient(
        135deg,
        rgba(var(--el-color-primary-rgb), 0.1) 0%,
        rgba(var(--el-color-primary-rgb), 0.03) 100%
      ),
      linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.95) 0%,
        rgba(248, 250, 252, 0.92) 100%
      );
    box-shadow:
      0 20px 36px -28px rgba(var(--el-color-primary-rgb), 0.35),
      inset 0 0 0 1px rgba(var(--el-color-primary-rgb), 0.14);
  }
}

.mode-card__panel {
  display: flex;
  flex-direction: column;
  min-height: 134px;
  cursor: pointer;
  outline: none;
}

.mode-card__panel:focus-visible {
  border-radius: 16px;
  box-shadow: 0 0 0 2px rgba(var(--el-color-primary-rgb), 0.22);
}

.mode-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.mode-card__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.mode-card__desc {
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.editor-form {
  :deep(.el-form-item) {
    margin-bottom: 18px;
    padding: 14px 16px;
    border: 1px solid
      color-mix(in srgb, var(--el-border-color) 68%, transparent);
    border-radius: 18px;
    background: color-mix(in srgb, var(--el-bg-color) 95%, #fff 5%);
    box-shadow: 0 10px 24px -26px rgba(15, 23, 42, 0.42);
  }
}

.inline-control {
  display: flex;
  gap: 12px;
  align-items: center;
}

.inline-control__input {
  flex: 1;
}

.generate-btn {
  min-width: 108px;
}

.section-note,
.form-item-tip {
  font-size: 12px;
  line-height: 1.65;
  color: var(--el-text-color-secondary);
}

.section-note {
  margin-top: 14px;
}

.form-item-tip {
  margin-top: 8px;
}

.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 20px 24px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 70%, transparent);
  border-radius: 24px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.96) 0%,
    rgba(248, 250, 252, 0.88) 68%,
    rgba(var(--el-color-primary-rgb), 0.05) 100%
  );
  box-shadow:
    0 22px 40px -34px rgba(15, 23, 42, 0.32),
    inset 0 1px 0 rgba(255, 255, 255, 0.92);
}

.action-bar__summary {
  max-width: 540px;
}

.action-bar__title {
  display: block;
  margin-bottom: 6px;
  font-size: 18px;
  color: var(--el-text-color-primary);
}

.action-bar__buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 960px) {
  .frontend-setting-shell {
    padding: 14px;
    border-radius: 22px;
  }

  .frontend-hero,
  .action-bar,
  .section-heading {
    grid-template-columns: 1fr;
    flex-direction: column;
  }

  .section-heading__desc {
    max-width: none;
    padding-top: 0;
  }

  .summary-card-grid,
  .mode-card-grid,
  .visual-switch-grid {
    grid-template-columns: 1fr;
  }

  .inline-control {
    flex-direction: column;
    align-items: stretch;
  }

  .action-bar__buttons {
    width: 100%;
    justify-content: stretch;

    :deep(.el-button) {
      width: 100%;
    }
  }
}
</style>

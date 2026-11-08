<template>
  <div class="koi-loader-style">
    <div class="koi-loader-style__grid" :class="{ 'is-locked': locked }">
      <button
        v-for="opt in options"
        :key="opt.value"
        type="button"
        class="loader-card"
        :class="{ 'is-active': current === opt.value }"
        :aria-pressed="current === opt.value"
        :disabled="locked"
        :title="opt.description"
        @click="select(opt.value)"
      >
        <span class="loader-card__stage">
          <!-- 缩略预览：与首屏 loader 用同一份 HTML/CSS（animations.ts），不是重画的示意图。
               部署侧锁定时主色也按配置渲染，看到的即是实际会出现的那个。
               像素恐龙用同一个游戏组件跑 demo 模式，预览和实物一致。 -->
          <span class="loader-card__anim" :style="previewStyle">
            <ReLoaderDinoGame v-if="opt.value === 'dino'" mode="demo" :rate="visuals.speed" />
            <span v-else v-html="markup(opt.value)" />
          </span>
        </span>
        <span class="loader-card__label">{{ opt.name }}</span>
      </button>
    </div>

    <p class="koi-loader-style__hint" :class="{ 'is-locked': locked }">
      {{ locked ? t("themeConfig.loaderStyle.lockedHint") : t("themeConfig.loaderStyle.hint") }}
    </p>

    <!-- 观感微调：尺寸两档（首屏）/ 速度倍率 / 主色是否跟随主题。
         部署侧锁定时整片禁用，值与 app.yaml 一致 —— 不让人改了却看不出来。 -->
    <div class="koi-loader-style__tweaks" :class="{ 'is-locked': locked }">
      <div class="tweak-row">
        <span class="tweak-label">{{ t("themeConfig.loaderStyle.size") }}</span>
        <div class="tweak-fields">
          <label class="tweak-field">
            <span class="tweak-field__name">{{ t("themeConfig.loaderStyle.sizeNarrow") }}</span>
            <el-input-number
              :model-value="visuals.size.narrow"
              :min="SIZE_MIN"
              :max="SIZE_MAX"
              :step="4"
              size="small"
              controls-position="right"
              :disabled="locked"
              @update:model-value="(v: number | undefined) => setSize('narrow', v)"
            />
          </label>
          <label class="tweak-field">
            <span class="tweak-field__name">{{ t("themeConfig.loaderStyle.sizeWide") }}</span>
            <el-input-number
              :model-value="visuals.size.wide"
              :min="SIZE_MIN"
              :max="SIZE_MAX"
              :step="4"
              size="small"
              controls-position="right"
              :disabled="locked"
              @update:model-value="(v: number | undefined) => setSize('wide', v)"
            />
          </label>
        </div>
      </div>

      <div class="tweak-row">
        <span class="tweak-label">{{ t("themeConfig.loaderStyle.speed") }}</span>
        <div class="tweak-fields tweak-fields--slider">
          <el-slider
            :model-value="visuals.speed"
            :min="SPEED_MIN"
            :max="SPEED_MAX"
            :step="0.1"
            :disabled="locked"
            :format-tooltip="(v: number) => `${v}x`"
            @update:model-value="(v: number | number[]) => setSpeed(Number(v))"
          />
          <span class="tweak-value">{{ visuals.speed }}x</span>
        </div>
      </div>

      <ReSwitch
        layout="card"
        :title="t('themeConfig.loaderStyle.adaptColor')"
        :sub="t('themeConfig.loaderStyle.adaptColorSub')"
        :tip="t('themeConfig.loaderStyle.adaptColorTip')"
        :model-value="visuals.adaptColor"
        :disabled="locked"
        @update:model-value="setAdaptColor"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 加载动画选择器（设置抽屉 · 外观）。
 *
 * <p>为什么放在主题配置里：加载动画是「整个应用的观感」而非某个页面的局部样式。
 * 用户在这里选一次，三处同时生效：</p>
 * <ul>
 *   <li>首屏 {@code public/loader.js}（读同一个 localStorage 键，下次刷新即生效）；</li>
 *   <li>应用内 {@code ReLoader}（订阅 {@code useLoaderAnimation}，立刻重渲染）；</li>
 *   <li>本面板自己的缩略预览（同一份 HTML/CSS）。</li>
 * </ul>
 *
 * <p>缩略图刻意不做「画得像」的示意图，而是直接渲染真实动画 ——
 * 于是这里看到的深浅、节奏、水位就是用户实际会遇到的那一个，不会出现
 * "预览挺好看、真加载却是另一样"。</p>
 *
 * <p><b>部署侧接管时整片置灰</b>（{@code app.yaml other.loaderConfig.enable: true}）：
 * 动画由部署决定，用户改不动 —— 与其让点击静默无效，不如直接禁用并说明原因。</p>
 */
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import ReSwitch from "@repo/ui/re-switch";
import {
  LOADER_ANIMATION_META,
  LOADER_ANIMATION_NONE,
  LOADER_SIZE_MAX,
  LOADER_SIZE_MIN,
  LOADER_SPEED_MAX,
  LOADER_SPEED_MIN,
  ReLoaderDinoGame,
  ensureLoaderAnimationStyle,
  loaderAnimationMarkup,
  normalizeLoaderSize,
  setLoaderAnimation,
  setLoaderPrefs,
  useLoaderAnimation,
  useLoaderDeployPolicy,
  useLoaderVisuals,
  type LoaderAnimationChoice,
} from "@repo/ui/re-loader";

const { t } = useI18n();

/** 展示顺序：默认款在最前，无动画放最后（它是"关掉"，不是并列的第十款） */
const OPTION_ORDER: LoaderAnimationChoice[] = [
  "dots",
  "rings",
  "dino",
  "ripple",
  "orbit",
  "bars",
  LOADER_ANIMATION_NONE,
];

const current = useLoaderAnimation();

/** 部署侧是否锁定了动画（锁定即禁用点击，改由 app.yaml 决定） */
const deployPolicy = useLoaderDeployPolicy();
const locked = computed(() => deployPolicy.value.locked);

/**
 * 最终生效的观感（部署 > 用户偏好 > 默认）。
 *
 * <p>面板上的尺寸 / 速度 / 主色跟随都读写这里：锁定时显示部署值（只读），
 * 未锁定时显示用户自己的偏好，改完写 localStorage，下次刷新首屏一致。</p>
 */
const visuals = useLoaderVisuals();

/** 尺寸与速度的上下限（与 prefs.ts 同一口径，避免两处写死不同数字） */
const SIZE_MIN = LOADER_SIZE_MIN;
const SIZE_MAX = LOADER_SIZE_MAX;
const SPEED_MIN = LOADER_SPEED_MIN;
const SPEED_MAX = LOADER_SPEED_MAX;

/**
 * 缩略图上的实时变量。
 *
 * <p>速度与主色在卡片里立刻看得出来（换主题色 / 拖速度立即变），
 * 尺寸是**首屏专用**（卡片只有 74px 高，放不下 96px 的动画），所以预览固定 56px。</p>
 */
const previewStyle = computed<Record<string, string>>(() => ({
  "--sla-rate": String(visuals.value.speed),
  "--sla-c": visuals.value.color,
}));

const options = computed(() =>
  OPTION_ORDER.map((value) => ({ value, ...LOADER_ANIMATION_META[value] })),
);

/** 与首屏同一份生成函数，保证面板里看到的就是真实结构 */
function markup(value: LoaderAnimationChoice): string {
  return loaderAnimationMarkup(value);
}

function select(value: LoaderAnimationChoice): void {
  // 一处收口：内存态 + localStorage + 首屏重绘都在 setLoaderAnimation 里
  // （锁定态它自己就会 return，这里再判一次只是为了不产生无意义的调用）
  if (locked.value) return;
  setLoaderAnimation(value);
}

/** 改其中一档尺寸；非法值（清空输入框）按当前值兜底，不会把配置写成 NaN */
function setSize(part: "narrow" | "wide", value: number | undefined): void {
  if (locked.value) return;
  const size = { ...visuals.value.size };
  size[part] = normalizeLoaderSize(value, size[part]);
  setLoaderPrefs({ size });
}

/** 改速度倍率（0.5~3，1 = 原速） */
function setSpeed(value: number): void {
  if (locked.value) return;
  setLoaderPrefs({ speed: value });
}

/** 主色是否跟随主题主色 */
function setAdaptColor(value: boolean | string | number): void {
  if (locked.value) return;
  setLoaderPrefs({ adaptColor: value === true });
}

onMounted(() => {
  // 首次进入设置页时补齐动画样式（正常情况下 ReLoader 已经注入过，这里是幂等的兜底）
  ensureLoaderAnimationStyle();
});
</script>

<style lang="scss" scoped>
.koi-loader-style {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.koi-loader-style__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

/* ── 卡片：与登录页样式选择器同一套观感（白底 + 大圆角 + 轻投影）── */
.loader-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  padding: 10px;
  font: inherit;
  color: inherit;
  text-align: inherit;
  cursor: pointer;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: 0 6px 16px color-mix(in srgb, var(--el-color-primary) 6%, transparent);
  transition:
    transform var(--el-transition-duration, 0.2s) ease,
    border-color var(--el-transition-duration, 0.2s) ease,
    box-shadow var(--el-transition-duration, 0.2s) ease;

  &:hover:not(.is-active) {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 10px 22px color-mix(in srgb, var(--el-color-primary) 14%, transparent);
    transform: translateY(-2px);
  }

  &:active:not(.is-active) {
    transform: translateY(-2px) scale(0.985);
  }

  &:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: 2px;
  }

  /* ── 部署侧接管：整片禁用（点击无效且不显示 hover 反馈） ── */
  &:disabled {
    cursor: not-allowed;
  }

  &:disabled:hover {
    border-color: var(--el-border-color-lighter);
    box-shadow: 0 6px 16px color-mix(in srgb, var(--el-color-primary) 6%, transparent);
    transform: none;
  }

  /* ── 预览区：固定高度，动效在正中 ── */
  &__stage {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 74px;
    overflow: hidden;
    background: var(--el-fill-color-lighter);
    border: 2px solid transparent;
    border-radius: var(--el-radius-lg, 12px);
    transition: border-color var(--el-transition-duration, 0.2s) ease;
  }

  /* 缩略尺寸：--sla-s 就是动画唯一的尺寸入口。
     56px 与 ReLoader 的 md 档一致，卡片里放得下又不显小。 */
  &__anim {
    --sla-s: 56px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 0;
  }

  &__label {
    font-size: 13px;
    font-weight: 600;
    line-height: 1.3;
    color: var(--el-text-color-primary);
    text-align: center;
    transition: color var(--el-transition-duration, 0.2s) ease;
  }

  &.is-active {
    border-color: color-mix(in srgb, var(--el-color-primary) 34%, var(--el-border-color-lighter));

    .loader-card__stage {
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 14%, transparent);
    }

    .loader-card__label {
      color: var(--el-color-primary);
      font-weight: 700;
    }
  }
}

.koi-loader-style__hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);

  /* 锁定提示用强调色：这是「改不动」的原因说明，不该和普通说明一样弱 */
  &.is-locked {
    color: var(--el-color-primary);
  }
}

/* ── 观感微调（尺寸 / 速度 / 主色跟随） ── */
.koi-loader-style__tweaks {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border-radius: var(--el-radius-lg, 12px);

  &.is-locked {
    opacity: 0.72;
  }
}

.tweak-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.tweak-label {
  flex: none;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.tweak-fields {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.tweak-field {
  display: flex;
  align-items: center;
  gap: 4px;

  &__name {
    font-size: 11px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
  }

  /* 两个数字框在窄抽屉里也要放得下 */
  :deep(.el-input-number) {
    width: 92px;
  }
}

.tweak-fields--slider {
  flex: 1;
  min-width: 0;

  :deep(.el-slider) {
    flex: 1;
    min-width: 80px;
  }
}

.tweak-value {
  flex: none;
  min-width: 34px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-secondary);
  text-align: right;
}
</style>

<template>
  <div
    class="re-select-square"
    :class="[
      `re-select-square--${controlSize}`,
      {
        're-select-square--compact': compact,
        're-select-square--text': !iconOnly,
        're-select-square--vertical': vertical,
      },
    ]"
  >
    <div
      v-for="opt in displayOptions"
      :key="String(opt.value)"
      :class="[
        're-select-square__item',
        { 're-select-square__item--active': isSelected(opt) },
      ]"
      :title="opt.label"
      @click="select(opt)"
    >
      <span v-if="vertical && iconFor(opt)" class="re-select-square__icon-badge">
        <StateIcon
          :active="isSelected(opt)"
          :icon="(opt.icon as string) || undefined"
          :active-icon="(opt.activeIcon as string) || props.activeIcon || undefined"
          :inactive-icon="(opt.inactiveIcon as string) || props.inactiveIcon || undefined"
          :preset="(opt.icon || opt.activeIcon || opt.inactiveIcon) ? undefined : preset"
          :size="iconSize"
          :class="['re-select-square__icon', { 're-select-square__icon--active': isSelected(opt) }]"
        />
      </span>
      <StateIcon
        v-else-if="iconFor(opt)"
        :active="isSelected(opt)"
        :icon="(opt.icon as string) || undefined"
        :active-icon="(opt.activeIcon as string) || props.activeIcon || undefined"
        :inactive-icon="(opt.inactiveIcon as string) || props.inactiveIcon || undefined"
        :preset="(opt.icon || opt.activeIcon || opt.inactiveIcon) ? undefined : preset"
        :size="iconSize"
        :class="['re-select-square__icon', { 're-select-square__icon--active': isSelected(opt) }]"
      />
      <span v-if="!vertical && !iconFor(opt)" class="re-select-square__fallback">{{ String(opt.label).charAt(0) }}</span>
      <!-- 竖向档位行两行结构：主标题 + 副说明（参考图的自动刷新频率菜单）；
           横向档（iconOnly=false）仍是单行 label，保持原结构不动。 -->
      <div v-if="vertical" class="re-select-square__body">
        <span class="re-select-square__label">{{ opt.label }}</span>
        <span v-if="opt.description" class="re-select-square__desc">{{ opt.description }}</span>
      </div>
      <span v-else-if="!iconOnly" class="re-select-square__label">{{ opt.label }}</span>
      <span v-if="isSelected(opt)" class="re-select-square__check">
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="2 6 5 9 10 3" />
        </svg>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ReSelect Square 布局
 *
 * 横向排列方形按钮，点击切换选中（互斥单选）。
 * 支持两种显示模式（iconOnly）：
 *   - true（默认）：仅显示图标，隐藏文字
 *   - false：图标 + 文字
 * 支持 compact 紧凑模式（默认开启）：
 *   - 紧凑正方形按钮（iconOnly 时固定小宽高）
 *   - 关闭时为大卡片样式（图标在上、文字在下、留白更足）
 * 支持 vertical 竖向档（vertical=true）：一行一档、整行走菜单感底色，选中态是整行高亮 + 右侧对勾。
 * 选项图标通过 ReIcon 渲染，自动支持：
 *   - element-plus PascalCase
 *   - ep:xxx / ri:xxx / mdi:xxx
 *   - iconfont class / uni / svg
 *   - HTTP URL
 * 没有 icon 的选项：横向档取 label 首字占位，竖向档直接显示 label 文字。
 *
 * 选中态增强（可选）：每项可配 {@code activeIcon} / {@code inactiveIcon}
 * （缺省回退到 {@code icon}）—— 选中显示 activeIcon，未选中显示 inactiveIcon，
 * 视觉上「当前档位」与「其余档位」用不同图标区分；未选中项灰字灰图标。
 */
import { computed } from "vue";
import StateIcon from "../../ReStateIcon/StateIcon.vue";
import type { ReOption, ReSelectSize } from "../types";

const props = withDefaults(
  defineProps<{
    /** 选项列表 */
    options: ReOption[];
    /** 当前模型值（单值或数组） */
    modelValue?: string | number | (string | number)[];
    /** 是否多选 */
    multiple?: boolean;
    /** 图标尺寸 */
    size?: number;
    /**
     * 控件尺寸档位（small / default / large），只影响按钮本身的宽高与字号。
     *
     * 与上面的图标尺寸 size(number) 是两件事，故不复用 size 这个名字。
     */
    controlSize?: ReSelectSize;
    /** 仅显示图标，隐藏文字（默认 true） */
    iconOnly?: boolean;
    /** 紧凑模式（默认 true） */
    compact?: boolean;
    /** 竖向档位列表：一行一档，文字优先、选中态走整行 */
    vertical?: boolean;
    /** 是否禁用 */
    disabled?: boolean;
    /** 选中态图标名：选中项显示该图标（缺省回退到选项自身的 activeIcon / icon） */
    activeIcon?: string;
    /** 未选中态图标名：未选中项显示该图标（缺省回退到选项自身的 inactiveIcon / icon） */
    inactiveIcon?: string;
    /** 内置图标集名（sunmoon / check / star / bell / arrow / anim）；"none" 关闭内置回落 */
    preset?: string;
  }>(),
  {
    modelValue: "",
    multiple: false,
    size: 22,
    iconOnly: true,
    compact: true,
    vertical: false,
    disabled: false,
    controlSize: "default",
    activeIcon: "",
    inactiveIcon: "",
    preset: undefined,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", val: string | number | (string | number)[]): void;
}>();

const displayOptions = computed(() => props.options);

/** 紧凑模式下图标更小，否则用默认图标尺寸 */
const iconSize = computed(() => (props.compact ? Math.max(16, props.size - 8) : props.size));

function isSelected(opt: ReOption): boolean {
  if (props.multiple && Array.isArray(props.modelValue)) {
    return props.modelValue.includes(opt.value);
  }
  return props.modelValue === opt.value;
}

/**
 * 该选项是否配置了图标（选项级 icon / activeIcon / inactiveIcon 或组件级 activeIcon / inactiveIcon）。
 *
 * 两态各自的图标名交给 ReStateIcon 解析：激活态 = activeIcon ?? 内置集.activeIcon ?? icon；
 * 非激活态 = inactiveIcon ?? 内置集.inactiveIcon ?? icon。
 */
function iconFor(opt: ReOption): string {
  return (
    (opt.icon as string | undefined) ||
    (opt.activeIcon as string | undefined) ||
    (opt.inactiveIcon as string | undefined) ||
    props.activeIcon ||
    props.inactiveIcon ||
    props.preset ||
    ""
  );
}

function select(opt: ReOption) {
  if (props.disabled) return;
  if (props.multiple) {
    const arr = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
    const idx = arr.indexOf(opt.value);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(opt.value);
    emit("update:modelValue", arr as (string | number)[]);
  } else {
    emit("update:modelValue", opt.value as string | number);
  }
}
</script>

<style lang="scss" scoped>
.re-select-square {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

/* ===== 紧凑模式（默认开启） ===== */
.re-select-square--compact {
  gap: 8px;
}
.re-select-square--compact .re-select-square__item {
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0;
  min-width: 0;
  width: 40px;
  height: 40px;
  /* 圆角统一走 koi 圆角令牌（--el-radius-*，见 @repo/theme/koi/styles/radius.scss），
     不再用 10px 这类游离值，也不用 --rm-*（那是 Modern 控件族的私有令牌）。 */
  border-radius: var(--el-radius-md, 8px);
}
.re-select-square--compact .re-select-square__check {
  width: 14px;
  height: 14px;
  top: -3px;
  right: -3px;
}
.re-select-square--compact .re-select-square__check svg {
  width: 8px;
  height: 8px;
}

/* ===== 紧凑 + 文字（iconOnly=false）：横向文字按钮，用于搜索区等窄行高场景 =====
   纯图标紧凑档把按钮锁成 40x40 方块，直接塞文字会被裁掉，故这一档另算尺寸 */
.re-select-square--compact.re-select-square--text .re-select-square__item {
  width: auto;
  height: 32px;
  padding: 0 12px;
  border-radius: var(--el-radius-md, 8px);
}
.re-select-square--compact.re-select-square--text .re-select-square__fallback,
.re-select-square--compact.re-select-square--text .re-select-square__check {
  display: none;
}
.re-select-square--compact.re-select-square--text .re-select-square__label {
  font-size: 13px;
}

.re-select-square__item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 14px;
  min-width: 80px;
  border: 1.5px solid var(--el-border-color, #dcdfe6);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color, #fff);
  /* 未选中态就是「灰」：中性边框 + 灰字，主色只留给已选中项表达选中，
     不参与未选中的任何状态（见下方 hover 说明）。 */
  color: var(--el-text-color-secondary, #909399);
  cursor: pointer;
  /* 只过渡会变的视觉属性。原先是 `transition: all`，把 padding / border-width
     也带进来 —— 选中态边框 1.5px→2px、内边距 12/14px→11/13px（为抵消边框增宽
     而反向抵消），会随过渡一起动，整排方块的文字每次都平移一格。这里按需列举。 */
  transition:
    color 0.25s ease,
    background-color 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease;
  user-select: none;

  /* 未选中项 hover：只走灰阶（深灰边 + 深灰字 + 浅灰底），不染主色。
     square 布局本质是单选组 —— 若 hover 就变蓝，鼠标扫过一排时每个都像已选中，
     真正选中的那个反而没有独占的主色信号。 */
  &:hover:not(&--active) {
    border-color: var(--el-border-color-dark, #cdd0d6);
    color: var(--el-text-color-regular, #606266);
    background: var(--el-fill-color-light, #f5f7fa);
  }

  &--active {
    border: 2px solid var(--el-color-primary, #409eff);
    padding: 11px 13px;
    color: var(--el-color-primary, #409eff);
    /* 选中态加强：浅主色底 + 主色描边 + 外侧光环，未选中灰字灰图标与之拉开差距 */
    background: var(--el-color-primary-light-9, #ecf5ff);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary, #409eff) 12%, transparent);

    /* 已选中项 hover：维持主色，仅加深提示可点 */
    &:hover {
      border-color: var(--el-color-primary-light-3, #a0cfff);
      background: var(--el-color-primary-light-8, #d9ecff);
      color: var(--el-color-primary, #409eff);
    }
  }
}

/* 图标随状态分化：未选中灰 + 降饱和，选中主色实心（activeIcon/inactiveIcon 才看得出差别） */
.re-select-square__icon {
  color: inherit;
  opacity: 0.85;
  filter: grayscale(0.6);
}
.re-select-square__icon--active,
.re-select-square__item--active .re-select-square__icon {
  opacity: 1;
  filter: none;
  color: var(--el-color-primary, #409eff);
}

// 紧凑模式下选中态也保持 0 内边距（覆盖上方 &--active 的 padding）
.re-select-square--compact .re-select-square__item--active {
  padding: 0;
  border-width: 1.5px;
  box-shadow: none;
}

/* 文字紧凑档的选中态：留在 32px 胶囊尺寸里，不回落到方块档的 0 内边距 */
.re-select-square--compact.re-select-square--text .re-select-square__item--active {
  padding: 0 12px;
}

.re-select-square__label {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.re-select-square__fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: inherit;
}
.re-select-square--compact .re-select-square__fallback {
  font-size: 16px;
}

.re-select-square__check {
  position: absolute;
  top: -4px;
  right: -4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  /* 与按钮组同一口径：白对勾压主色只有 2.78:1，低于 WCAG 对「非文本图形」的 3:1，
     所以底色同样压深（72% 主色 + 系统黑令牌）。 */
  background: color-mix(in srgb, var(--el-color-primary, #409eff) 72%, var(--el-color-black, #000));
  border-radius: var(--el-border-radius-circle, 50%);
  color: var(--el-color-white, #fff);
  /* 阴影跟着主题主色走：用 color-mix 取主色的低透明度，
     不写死 rgba(64,158,255,…) —— 那是 Element 默认蓝，换主题后阴影会与对勾脱色。 */
  box-shadow: 0 1px 4px color-mix(in srgb, var(--el-color-primary, #409eff) 40%, transparent);
}

.re-select-square__check svg {
  width: 10px;
  height: 10px;
}

/* ===== 竖向档位档（vertical）：一行一档，用于浮层里选间隔 =====
   整行走「无边框 + 底色」的菜单感，不走方块档的描边选中，避免窄浮层里出现一串框。
   行高不写死：两行档位（主标题 + 副说明）用 padding 撑，单行档位由 min-height 兜底。 */
.re-select-square--vertical {
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
  width: 100%;
}
.re-select-square--vertical .re-select-square__item {
  flex-direction: row;
  align-items: center;
  width: 100%;
  min-height: 34px;
  height: auto;
  padding: 5px 10px;
  gap: 10px;
  justify-content: flex-start;
  border: 1px solid transparent;
  /* koi 圆角令牌：xs=4px（--el-radius-base 是失效名，Element 只有
     --el-border-radius-base，写它等于永远走兜底） */
  border-radius: var(--el-radius-xs, 4px);
  background: transparent;
}
.re-select-square--vertical .re-select-square__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}
.re-select-square--vertical .re-select-square__label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-regular, #606266);
}
/* 副说明（参考图每档下方的灰色小字），溢出省略避免长文案把浮层撑破 */
.re-select-square--vertical .re-select-square__desc {
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary, #909399);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* 档位左侧的圆形图标底座：灰底中性色，选中后转主色浅底。
   用一层 badge 包住 ReStateIcon：ReStateIcon 自身有内联宽高（图标尺寸），
   直接拿它当圆形底座会被内联样式压过，故由 badge 决定外圈、StateIcon 决定图标大小。 */
.re-select-square--vertical .re-select-square__item > .re-select-square__icon-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 24px;
  height: 24px;
  border-radius: var(--el-border-radius-circle, 50%);
  background: var(--el-fill-color-light, #f5f7fa);
  color: var(--el-text-color-secondary, #909399);
}
.re-select-square--vertical .re-select-square__item:hover {
  background: var(--el-fill-color-light, #f5f7fa);
  border-color: transparent;
}
.re-select-square--vertical .re-select-square__item--active {
  padding: 5px 10px;
  border: 1px solid transparent;
  background: var(--el-color-primary-light-9, #ecf5ff);
  /* 参考图的选中态：左侧主色竖条（inset 阴影不占布局宽度，不把内容挤偏） */
  box-shadow: inset 3px 0 0 var(--el-color-primary, #409eff);
}
.re-select-square--vertical .re-select-square__item--active .re-select-square__label {
  color: var(--el-color-primary, #409eff);
  font-weight: 600;
}
.re-select-square--vertical .re-select-square__item--active > .re-select-square__icon-badge {
  background: var(--el-color-primary-light-9, #ecf5ff);
  color: var(--el-color-primary, #409eff);
}
/* 选中态用整行右侧的对勾，不飘在方块角上 */
.re-select-square--vertical .re-select-square__check {
  position: static;
  width: auto;
  height: auto;
  margin-left: auto;
  background: transparent;
  color: var(--el-color-primary, #409eff);
  box-shadow: none;
}
.re-select-square--vertical .re-select-square__check svg {
  width: 14px;
  height: 14px;
}

/* ===== 控件尺寸档（controlSize）：28 / 34 / 40px 基线 =====
   放在最后并用「尺寸 + 紧凑」双类选择器，保证能盖过上面 compact/text 档写死的宽高。 */
.re-select-square--mini.re-select-square--compact .re-select-square__item {
  width: 24px;
  height: 24px;
  border-radius: var(--el-radius-xs, 4px);
}
.re-select-square--mini.re-select-square--compact.re-select-square--text .re-select-square__item {
  height: 22px;
  padding: 0 6px;
}
.re-select-square--mini.re-select-square--compact .re-select-square__label {
  font-size: 10px;
}
.re-select-square--mini.re-select-square--compact .re-select-square__check {
  width: 12px;
  height: 12px;
  top: -2px;
  right: -2px;
}
.re-select-square--mini.re-select-square--compact .re-select-square__check svg {
  width: 7px;
  height: 7px;
}

.re-select-square--small.re-select-square--compact .re-select-square__item {
  width: 32px;
  height: 32px;
  /* 统一走 koi 圆角令牌（sm = 6px），与 Modern 族的 --rm-radius 同值但属公共令牌 */
  border-radius: var(--el-radius-sm, 6px);
}
.re-select-square--small.re-select-square--compact.re-select-square--text .re-select-square__item {
  height: 26px;
  padding: 0 8px;
}
.re-select-square--small.re-select-square--compact .re-select-square__label {
  font-size: 11px;
}

.re-select-square--large.re-select-square--compact .re-select-square__item {
  width: 46px;
  height: 46px;
  /* koi 圆角令牌（lg = 12px） */
  border-radius: var(--el-radius-lg, 12px);
}
.re-select-square--large.re-select-square--compact.re-select-square--text .re-select-square__item {
  height: 38px;
  padding: 0 16px;
}
.re-select-square--large.re-select-square--compact .re-select-square__label {
  font-size: 14px;
}

/* 竖向档是「一行一档」菜单，尺寸只调行高，不动通栏宽度 */
.re-select-square--mini.re-select-square--vertical .re-select-square__item {
  height: 24px;
}
.re-select-square--small.re-select-square--vertical .re-select-square__item {
  height: 28px;
}
.re-select-square--large.re-select-square--vertical .re-select-square__item {
  height: 40px;
}
</style>
<script setup lang="ts">
/**
 * ReSwitch —— 卡片式开关组件
 *
 * 封装 el-switch，支持卡片式布局（设置面板常用）：
 *   <ReSwitch title="多标签导航" sub="顶部标签栏" tip="开启后页面顶部生成标签栏" description="标签页平铺内容区顶部" v-model="tabsEnable" />
 *
 * 特性：
 *  - title：左侧主标题
 *  - sub：灰色小标题（介于主标题与副标题之间，字体小、颜色淡）
 *  - tip：标题旁的提示图标（tooltip）
 *  - description：副标题说明（字号小于主标题）
 *  - card：卡片式容器（默认开启，false 为纯行内开关）
 *  - activeBorder：激活时边框加粗（仅卡片模式生效），未激活保持细边框
 *  - hideSwitch：隐藏内部 el-switch（仅展示卡片，状态由父组件控制）
 *  - 透传 el-switch 全部属性（active-text / inactive-text 等）
 */
import { ElSwitch } from "element-plus";
import { computed } from "vue";

defineOptions({ name: "ReSwitch", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    /** 主标题 */
    title?: string;
    /** 灰色小标题（主标题右侧/下方，字号小、颜色淡） */
    sub?: string;
    /** 提示文案（标题旁问号图标） */
    tip?: string;
    /** 卡片式容器（默认 true） */
    card?: boolean;
    /** 卡片描述（副标题，可选） */
    description?: string;
    /** 激活时边框加粗（默认 true，仅 card=true 生效） */
    activeBorder?: boolean;
    /** 隐藏内部 el-switch（仅展示卡片信息，状态由父组件控制） */
    hideSwitch?: boolean;
  }>(),
  {
    // 卡片式容器默认开启；注意 Vue3.5 将未传的可选 Boolean 属性归一化为 false，
    // 仅靠解构默认值(= true)不生效，必须通过 withDefaults 声明运行时默认值
    card: true,
    activeBorder: true,
    hideSwitch: false,
  },
);

const { card, activeBorder, hideSwitch } = props;

const modelValue = defineModel<boolean | string | number>({ default: false });

/** 是否处于「激活」状态（用于边框加粗效果） */
const isActive = computed(() => Boolean(modelValue.value));
</script>

<template>
  <div
    :class="[
      're-switch',
      {
        're-switch--card': card,
        're-switch--active': card && activeBorder && isActive,
        're-switch--hidden-switch': hideSwitch,
      },
    ]"
  >
    <div class="re-switch__body">
      <div v-if="title || tip" class="re-switch__head">
        <span class="re-switch__title">{{ title }}</span>
        <span v-if="sub" class="re-switch__sub">{{ sub }}</span>
        <el-tooltip v-if="tip" :content="tip" placement="top">
          <el-icon class="re-switch__tip"><QuestionFilled /></el-icon>
        </el-tooltip>
      </div>
      <p v-if="description" class="re-switch__desc">{{ description }}</p>
    </div>
    <ElSwitch v-if="!hideSwitch" v-bind="$attrs" v-model="modelValue" />
  </div>
</template>

<style lang="scss" scoped>
.re-switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  box-sizing: border-box;

  /* 左侧文字区：主标题 + 副标题纵向堆叠 */
  &__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  /* 主标题行：文字 + 灰色小标题 + 圆形问号帮助图标 */
  &__head {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    flex-wrap: wrap;
  }

  /* 卡片式：使用 Element Plus CSS 变量，自动适配亮色/暗色主题 */
  &--card {
    position: relative;
    align-items: center;
    padding: 14px 16px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    transition:
      border-color 0.25s ease,
      border-width 0.25s ease,
      box-shadow 0.25s ease,
      background-color 0.25s ease;

    &:hover {
      border-color: var(--el-color-primary-light-5);
      box-shadow: var(--el-box-shadow-light);
    }
  }

  /* 激活状态：主题色边框 + 左侧强调条 + 主色浅底 */
  &--active {
    border: 2px solid var(--el-color-primary);
    padding: 13px 15px; /* 抵消 +1px 边框，避免内容位移 */
    background: var(--el-color-primary-light-9);
    box-shadow:
      0 0 0 3px var(--el-color-primary-light-8),
      var(--el-box-shadow-light);

    /* 左侧主题色强调条（圆角裁剪跟随卡片） */
    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 60%;
      background: var(--el-color-primary);
      border-radius: 0 3px 3px 0;
    }

    &:hover {
      border-color: var(--el-color-primary);
      box-shadow:
        0 0 0 3px var(--el-color-primary-light-7),
        var(--el-box-shadow-light);
    }
  }

  /* 隐藏内部 el-switch 时去掉右侧间距 */
  &--hidden-switch {
    gap: 0;
  }

  /* 主标题：字号大于副标题，信息层级清晰 */
  &__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* 灰色小标题：字号小、颜色淡，介于主标题与副标题之间 */
  &__sub {
    font-size: 11px;
    font-weight: 500;
    color: var(--el-text-color-placeholder);
    letter-spacing: 0.3px;
    padding: 1px 6px;
    background: var(--el-fill-color);
    border-radius: 4px;
    line-height: 1.4;
    align-self: center;
    flex-shrink: 0;
  }

  /* 圆形问号帮助图标 */
  &__tip {
    flex-shrink: 0;
    font-size: 14px;
    color: var(--el-text-color-secondary);
    cursor: help;
    transition: color 0.2s ease;
    align-self: center;

    &:hover {
      color: var(--el-color-primary);
    }
  }

  /* 副标题说明 */
  &__desc {
    margin: 0;
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
    white-space: normal;
  }
}
</style>
<script setup lang="ts">
/**
 * ReSwitch —— 卡片式开关组件
 *
 * 封装 el-switch，支持卡片式布局（设置面板常用）：
 *   <ReSwitch title="多标签导航" tip="页面顶部标签栏，可快速切换" description="标签页平铺内容区顶部，可快速切换页面" v-model="tabsEnable" />
 *
 * 特性：
 *  - title：左侧主标题
 *  - tip：标题右侧圆形问号帮助图标（tooltip）
 *  - description：副标题说明（字号小于主标题）
 *  - card：卡片式容器（默认开启，false 为纯行内开关）
 *  - 透传 el-switch 全部属性（active-text / inactive-text 等）
 */
import { ElSwitch } from "element-plus";

defineOptions({ name: "ReSwitch", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    /** 主标题 */
    title?: string;
    /** 提示文案（标题旁圆形问号图标） */
    tip?: string;
    /** 卡片式容器（默认 true） */
    card?: boolean;
    /** 副标题说明（可选） */
    description?: string;
  }>(),
  {
    // 卡片式容器默认开启；注意 Vue3.5 将未传的可选 Boolean 属性归一化为 false，
    // 仅靠解构默认值(= true)不生效，必须通过 withDefaults 声明运行时默认值
    card: true,
  },
);

// 卡片式容器默认开启（组件注释约定）
const { card } = props;

const modelValue = defineModel<boolean | string | number>({ default: false });
</script>

<template>
  <div :class="['re-switch', { 're-switch--card': card }]">
    <div class="re-switch__body">
      <div v-if="title || tip" class="re-switch__head">
        <span class="re-switch__title">{{ title }}</span>
        <el-tooltip v-if="tip" :content="tip" placement="top">
          <el-icon class="re-switch__tip"><QuestionFilled /></el-icon>
        </el-tooltip>
      </div>
      <p v-if="description" class="re-switch__desc">{{ description }}</p>
    </div>
    <ElSwitch v-bind="$attrs" v-model="modelValue" />
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

  /* 主标题行：文字 + 圆形问号帮助图标 */
  &__head {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  /* 卡片式：浅蓝细圆角边框 + 浅蓝底色圆角矩形，与主题色面板同一套 UI */
  &--card {
    align-items: center;
    padding: 14px 16px;
    background: linear-gradient(135deg, #eaf3ff 0%, #d9eaff 100%);
    border: 1px solid #bfd8ff;
    border-radius: 12px;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;

    &:hover {
      border-color: #2f8bf0;
      box-shadow: 0 4px 14px rgba(47, 139, 240, 0.14);
    }
  }

  /* 主标题：字号大于副标题，信息层级清晰 */
  &__title {
    font-size: 14px;
    font-weight: 700;
    color: #1f2329;
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* 圆形问号帮助图标 */
  &__tip {
    flex-shrink: 0;
    font-size: 14px;
    color: #5b8fd9;
    cursor: help;
    transition: color 0.2s ease;

    &:hover {
      color: #2f8bf0;
    }
  }

  /* 副标题说明 */
  &__desc {
    margin: 0;
    font-size: 12px;
    line-height: 1.5;
    color: #5c6b7a;
    white-space: normal;
  }
}

/* 深色模式：暗蓝底卡片 */
html.dark .re-switch--card {
  background: linear-gradient(135deg, #1a2740 0%, #162138 100%);
  border-color: rgba(95, 140, 220, 0.28);

  &:hover {
    border-color: rgba(95, 140, 220, 0.6);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
  }

  .re-switch__title {
    color: #e5eaf3;
  }

  .re-switch__desc {
    color: #9aa5b5;
  }
}
</style>
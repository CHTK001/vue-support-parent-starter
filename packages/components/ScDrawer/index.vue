<template>
  <component
    :is="currentComponent || ElDrawer"
    v-model="visible"
    :title="layout === 'simple' ? undefined : title"
    :size="size"
    :direction="direction"
    :modal="modal"
    :append-to-body="appendToBody"
    :lock-scroll="lockScroll"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    :show-close="layout === 'simple' ? false : showClose"
    :before-close="handleBeforeClose"
    :with-header="layout === 'simple' ? false : withHeader"
    :modal-class="inMainArea ? 'drawer-in-main-area ' + modalClass : modalClass"
    :z-index="zIndex"
    :destroy-on-close="destroyOnClose"
    :class="['sc-drawer', customClass, { 'sc-drawer--simple': layout === 'simple' }]"
    @open="handleOpen"
    @opened="handleOpened"
    @close="handleClose"
    @closed="handleClosed"
  >
    <!-- 简单布局的右上角关闭按钮 -->
    <template v-if="layout === 'simple' && showClose" #header>
      <button type="button" class="sc-drawer__simple-close" @click="close">
        <IconifyIconOnline icon="ep:close" />
      </button>
    </template>

    <!-- 自定义头部插槽 -->
    <template v-if="$slots.header && layout !== 'simple'" #header>
      <slot name="header" />
    </template>

    <!-- 默认内容插槽 -->
    <div class="sc-drawer__body-wrapper" :class="{ 'sc-drawer__body-wrapper--simple': layout === 'simple' }">
      <button
        v-if="layout === 'simple' && showClose"
        type="button"
        class="sc-drawer__body-close"
        @click="close"
      >
        <IconifyIconOnline icon="ep:close" />
      </button>
      <slot />
    </div>

    <!-- 自定义底部插槽 -->
    <template v-if="$slots.footer || showFooter" #footer>
      <slot name="footer">
        <ScButton v-if="showCancelButton" @click="handleCancel">
          {{ cancelText }}
        </ScButton>
        <ScButton v-if="showConfirmButton" type="primary" :loading="loading" @click="handleConfirm">
          {{ confirmText }}
        </ScButton>
      </slot>
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ScDrawer 抽屉组件
 * 继承 el-drawer 所有功能，并添加记忆功能
 * 支持 data-skin 切换为像素风格
 * @author CH
 * @version 1.0.0
 * @since 2025-12-08
 */
import { ref, computed, watch, onMounted, type PropType } from "vue";
import { ElDrawer } from "element-plus";
import { ScButton } from "../ScButton";
import { useThemeComponent } from "../hooks/useThemeComponent";
import { useDrawerMemory } from "./composables";
import { IconifyIconOnline } from "@repo/components/ReIcon";

/** 抽屉方向类型 */
type DrawerDirection = "ltr" | "rtl" | "ttb" | "btt";

/** 布局模式 */
type DrawerLayout = "default" | "simple";

const props = withDefaults(
  defineProps<{
    /** 是否显示（双向绑定） */
    modelValue?: boolean;
    /** 抽屉标题 */
    title?: string;
    /** 抽屉尺寸（宽度或高度，根据方向决定） */
    size?: string | number;
    /** 抽屉打开方向 */
    direction?: DrawerDirection;
    /** 是否显示遮罩层 */
    modal?: boolean;
    /** 是否将抽屉插入到 body 元素上 */
    appendToBody?: boolean;
    /** 是否锁定滚动 */
    lockScroll?: boolean;
    /** 点击遮罩是否可以关闭 */
    closeOnClickModal?: boolean;
    /** ESC 是否可以关闭 */
    closeOnPressEscape?: boolean;
    /** 是否显示关闭按钮 */
    showClose?: boolean;
    /** 关闭前的回调 */
    beforeClose?: (done: () => void) => void;
    /** 是否显示头部 */
    withHeader?: boolean;
    /** 遮罩层的自定义类名 */
    modalClass?: string;
    /** z-index 层级 */
    zIndex?: number;
    /** 关闭时销毁子元素（默认 true） */
    destroyOnClose?: boolean;
    /** 自定义类名 */
    customClass?: string;
    /** 是否显示底部 */
    showFooter?: boolean;
    /** 是否显示取消按钮 */
    showCancelButton?: boolean;
    /** 是否显示确认按钮 */
    showConfirmButton?: boolean;
    /** 取消按钮文本 */
    cancelText?: string;
    /** 确认按钮文本 */
    confirmText?: string;
    /** 确认按钮加载状态 */
    loading?: boolean;
    /**
     * 记忆功能ID
     * 0 或空字符串：所有 ScDrawer 共享配置
     * 其他值：按 ID 独立存储配置
     * 用于记录上次是否打开，刷新后恢复状态
     */
    memoryId?: string | number;
    /** 是否启用记忆功能 */
    memoryEnabled?: boolean;
    /**
     * 是否在主内容区域内显示（不遮挡顶部导航和侧边栏）
     * 设置为 true 时，drawer 将只在 main-container 区域内显示
     */
    inMainArea?: boolean;
    /** 布局模式：default(标准) / simple(简洁，无头部关闭按钮放右上角) */
    layout?: DrawerLayout;
  }>(),
  {
    modelValue: false,
    title: "",
    size: "30%",
    direction: "rtl",
    modal: true,
    appendToBody: true,
    lockScroll: true,
    closeOnClickModal: true,
    closeOnPressEscape: true,
    showClose: true,
    withHeader: true,
    modalClass: "",
    zIndex: 2000,
    destroyOnClose: true,
    customClass: "",
    showFooter: false,
    showCancelButton: true,
    showConfirmButton: true,
    cancelText: "取消",
    confirmText: "确定",
    loading: false,
    memoryId: 0,
    memoryEnabled: false,
    inMainArea: false,
    layout: "simple"
  }
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  open: [];
  opened: [];
  close: [];
  closed: [];
  cancel: [];
  confirm: [];
}>();

// 内部可见状态
const visible = ref(props.modelValue);

// 使用主题组件系统 V2.0
const { currentComponent } = useThemeComponent("ElDrawer");

// 记忆存储 key（统一走 useDrawerMemory）
const internalMemoryKey = computed(() => {
  const id = props.memoryId;
  if (id === 0 || id === "0" || id === "" || typeof id === "undefined") {
    return "shared";
  }
  return String(id);
});

const { memoryData, loadMemory, updateMemory } = useDrawerMemory(internalMemoryKey.value, {
  enabled: props.memoryEnabled
});

/**
 * 处理关闭前回调
 */
const handleBeforeClose = (done: () => void): void => {
  if (props.beforeClose) {
    props.beforeClose(done);
  } else {
    done();
  }
};

/**
 * 处理打开事件
 */
const handleOpen = (): void => {
  emit("open");
};

/**
 * 处理打开完成事件
 */
const handleOpened = (): void => {
  emit("opened");
};

/**
 * 处理关闭事件
 */
const handleClose = (): void => {
  emit("close");
};

/**
 * 处理关闭完成事件
 */
const handleClosed = (): void => {
  emit("closed");
};

/**
 * 处理取消按钮点击
 */
const handleCancel = (): void => {
  emit("cancel");
  visible.value = false;
};

/**
 * 处理确认按钮点击
 */
const handleConfirm = (): void => {
  emit("confirm");
};

/**
 * 打开抽屉
 */
const open = (): void => {
  visible.value = true;
};

/**
 * 关闭抽屉
 */
const close = (): void => {
  visible.value = false;
};

// 同步外部 modelValue
watch(
  () => props.modelValue,
  val => {
    visible.value = val;
  }
);

// 同步内部状态变化到外部，并保存记忆
watch(visible, val => {
  emit("update:modelValue", val);
  if (props.memoryEnabled) {
    updateMemory({
      isOpen: val
    });
  }
});

// 组件挂载时加载记忆
onMounted(() => {
  if (!props.memoryEnabled) {
    return;
  }
  const memory = loadMemory();
  if (memory && typeof memory.isOpen === "boolean") {
    visible.value = memory.isOpen;
    emit("update:modelValue", memory.isOpen);
  }
});

/**
 * 记录位置
 * @description 由业务侧调用，用于保存滚动位置或自定义位置
 */
const setMemoryPosition = (position: number): void => {
  if (!props.memoryEnabled) {
    return;
  }
  updateMemory({ position });
};

/**
 * 读取已记录的位置
 */
const getMemoryPosition = (): number | undefined => {
  return memoryData.value?.position;
};

// 暴露方法
defineExpose({
  /** 打开抽屉 */
  open,
  /** 关闭抽屉 */
  close,
  /** 获取当前可见状态 */
  isVisible: () => visible.value,
  /** 记录位置（供外部滚动等场景调用） */
  setMemoryPosition,
  /** 读取已记录的位置 */
  getMemoryPosition
});
</script>

<style lang="scss" scoped>
/*
 * 样式已统一迁移至 packages/assets/style/stitch/overrides.scss
 * 以保持全局风格一致 (Glassmorphism + Neon)
 */
.sc-drawer {
  /* 保留一些非视觉的布局样式如果需要，目前留空让全局样式接管 */
}

// Simple 布局：无头部，关闭按钮在右上角
.sc-drawer__body-wrapper {
  position: relative;
  width: 100%;
}

.sc-drawer__body-wrapper--simple {
  padding-top: 40px;
}

.sc-drawer__body-close,
.sc-drawer__simple-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: var(--sc-drawer-close-bg, var(--el-color-white));
  border: none;
  border-radius: var(--sc-drawer-close-radius, 8px);
  cursor: pointer;
  color: var(--sc-drawer-close-color, var(--el-text-color-secondary));
  transition:
    transform 0.2s ease,
    background-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.25s ease;
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(25%, -25%);
  z-index: 10;

  :deep(svg) {
    transition: transform 0.28s ease;
    transform-origin: center;
  }

  &:hover {
    background: var(--sc-drawer-close-hover-bg, var(--el-color-danger-light-9));
    color: var(--sc-drawer-close-hover-color, var(--el-color-danger));
    box-shadow: 0 8px 18px rgba(239, 68, 68, 0.2);
    animation: sc-drawer-close-hover 240ms ease forwards;

    :deep(svg) {
      transform: rotate(180deg);
    }
  }

  &:active {
    transform: translate(25%, -25%) scale(0.92);
  }
}

@keyframes sc-drawer-close-hover {
  0% {
    transform: translate(25%, -25%) scale(1);
  }
  60% {
    transform: translate(25%, -25%) scale(1.08) rotate(6deg);
  }
  100% {
    transform: translate(25%, -25%) scale(1.04);
  }
}

// 深色主题适配
html.dark {
  .sc-drawer__simple-close {
    background: var(--sc-drawer-close-bg, var(--el-fill-color-dark));
    color: var(--el-text-color-secondary);

    &:hover {
      background: var(--el-color-danger-light-9);
      color: var(--el-color-danger);
    }
  }
}

// 修复 simple 布局下 el-drawer 的 header 内部插槽
:deep(.el-drawer__header) {
  margin-bottom: 0;
  padding: 0;
}
</style>

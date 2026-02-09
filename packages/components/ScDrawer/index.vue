<template>
  <el-drawer
    v-model="visible"
    :title="title"
    :size="size"
    :direction="direction"
    :modal="modal"
    :append-to-body="appendToBody"
    :lock-scroll="lockScroll"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    :show-close="showClose"
    :before-close="handleBeforeClose"
    :with-header="withHeader"
    :modal-class="inMainArea ? 'drawer-in-main-area ' + modalClass : modalClass"
    :z-index="zIndex"
    :destroy-on-close="destroyOnClose"
    :class="['sc-drawer', customClass]"
    @open="handleOpen"
    @opened="handleOpened"
    @close="handleClose"
    @closed="handleClosed"
  >
    <!-- 自定义头部插槽 -->
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>

    <!-- 默认内容插槽 -->
    <slot />

    <!-- 自定义底部插槽 -->
    <template v-if="$slots.footer || showFooter" #footer>
      <slot name="footer">
        <el-button v-if="showCancelButton" @click="handleCancel">
          {{ cancelText }}
        </el-button>
        <el-button v-if="showConfirmButton" type="primary" :loading="loading" @click="handleConfirm">
          {{ confirmText }}
        </el-button>
      </slot>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
/**
 * ScDrawer 抽屉组件
 * 继承 el-drawer 所有功能，并添加记忆功能
 * @author CH
 * @version 1.0.0
 * @since 2025-12-08
 */
import { ref, computed, watch, onMounted, type PropType } from "vue";
import { localStorageProxy } from "@repo/utils";

/** 抽屉方向类型 */
type DrawerDirection = "ltr" | "rtl" | "ttb" | "btt";

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
    /** 关闭时销毁子元素 */
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
    destroyOnClose: false,
    customClass: "",
    showFooter: false,
    showCancelButton: true,
    showConfirmButton: true,
    cancelText: "取消",
    confirmText: "确定",
    loading: false,
    memoryId: 0,
    memoryEnabled: false,
    inMainArea: false
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

// 记忆存储 key
const memoryStorageKey = computed(() => {
  const id = props.memoryId;
  // 如果 memoryId 为 0 或空字符串，使用共享 key
  if (id === 0 || id === "0" || id === "") {
    return "sc_drawer_memory_shared";
  }
  return `sc_drawer_memory_${id}`;
});

/**
 * 从 localStorage 加载记忆状态
 */
const loadMemory = (): void => {
  if (!props.memoryEnabled) return;

  try {
    const memory = localStorageProxy().getItem(memoryStorageKey.value);
    if (memory && typeof memory.isOpen === "boolean") {
      visible.value = memory.isOpen;
      emit("update:modelValue", memory.isOpen);
    }
  } catch (error) {
    console.error("加载抽屉记忆失败:", error);
  }
};

/**
 * 保存记忆状态到 localStorage
 */
const saveMemory = (): void => {
  if (!props.memoryEnabled) return;

  try {
    const memory = localStorageProxy().getItem(memoryStorageKey.value) || {};
    memory.isOpen = visible.value;
    memory.timestamp = Date.now();
    localStorageProxy().setItem(memoryStorageKey.value, memory);
  } catch (error) {
    console.error("保存抽屉记忆失败:", error);
  }
};

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
  saveMemory();
});

// 组件挂载时加载记忆
onMounted(() => {
  loadMemory();
});

// 暴露方法
defineExpose({
  /** 打开抽屉 */
  open,
  /** 关闭抽屉 */
  close,
  /** 获取当前可见状态 */
  isVisible: () => visible.value
});
</script>

<style lang="scss" scoped>
/* 
 * 样式已统一迁移至 packages/assets/style/stitch-overrides.scss
 * 以保持全局风格一致 (Glassmorphism + Neon)
 */
.sc-drawer {
  /* 保留一些非视觉的布局样式如果需要，目前留空让全局样式接管 */
}
</style>

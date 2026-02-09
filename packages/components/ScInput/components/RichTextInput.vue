<template>
  <div class="sc-richtext-input-wrapper">
    <div v-if="prefixIcon && showPrefix" class="sc-richtext-input-prefix">
      <IconifyIconOnline :icon="prefixIcon" />
    </div>
    <div class="sc-richtext-input-container">
      <Toolbar class="sc-richtext-toolbar" :editor="editorRef" :defaultConfig="toolbarConfig" :mode="mode" />
      <Editor
        class="sc-richtext-editor"
        :class="{
          'sc-richtext-editor--disabled': disabled,
          'sc-richtext-editor--invalid': validationResult && !validationResult.isValid
        }"
        v-model="currentValue"
        :defaultConfig="editorConfig"
        :mode="mode"
        @onCreated="handleCreated"
        @onChange="handleChange"
        @onFocus="handleFocus"
        @onBlur="handleBlur"
      />
      <div v-if="validationResult && !validationResult.isValid && showValidationMsg" class="sc-richtext-input__error">
        {{ validationResult.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import "@wangeditor/editor/dist/css/style.css";
import "../../ScEditor/style.css";
import { Editor, Toolbar } from "@wangeditor/editor-for-vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { computed, ref, shallowRef, onBeforeUnmount, watch, onMounted } from "vue";
import { validate } from "../validation";
import type { IDomEditor, IEditorConfig, IToolbarConfig } from "@wangeditor/editor";

interface Props {
  /**
   * 绑定值
   */
  modelValue?: string;
  /**
   * 输入框占位文本
   */
  placeholder?: string;
  /**
   * 禁用状态
   */
  disabled?: boolean;
  /**
   * 编辑器高度
   */
  height?: string | number;
  /**
   * 编辑器模式
   */
  mode?: "default" | "simple";
  /**
   * 前缀图标
   */
  prefixIcon?: string;
  /**
   * 是否显示前缀图标
   */
  showPrefix?: boolean;
  /**
   * 验证规则
   */
  rules?: any[];
  /**
   * 是否显示验证消息
   */
  showValidationMsg?: boolean;
  /**
   * 工具栏配置
   */
  toolbarConfig?: Partial<IToolbarConfig>;
  /**
   * 编辑器配置
   */
  editorConfig?: Partial<IEditorConfig>;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  placeholder: "请输入内容...",
  disabled: false,
  height: 300,
  mode: "default",
  prefixIcon: "",
  showPrefix: true,
  rules: () => [],
  showValidationMsg: true,
  toolbarConfig: () => ({}),
  editorConfig: () => ({})
});

const emit = defineEmits(["update:modelValue", "change", "focus", "blur", "created"]);

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef<IDomEditor>();

// 验证结果
const validationResult = ref<any>(null);

// 当前值
const currentValue = computed({
  get: () => props.modelValue,
  set: val => emit("update:modelValue", val)
});

// 工具栏配置
const toolbarConfig = computed(() => ({
  excludeKeys: props.disabled ? ["uploadImage", "uploadVideo"] : [],
  ...props.toolbarConfig
}));

// 编辑器配置
const editorConfig = computed(() => ({
  placeholder: props.placeholder,
  readOnly: props.disabled,
  ...props.editorConfig,
  MENU_CONF: {
    // 上传图片配置
    uploadImage: {
      server: "/api/upload/image",
      fieldName: "file",
      maxFileSize: 5 * 1024 * 1024, // 5M
      allowedFileTypes: ["image/*"],
      ...props.editorConfig?.MENU_CONF?.uploadImage
    },
    // 上传视频配置
    uploadVideo: {
      server: "/api/upload/video",
      fieldName: "file",
      maxFileSize: 100 * 1024 * 1024, // 100M
      allowedFileTypes: ["video/*"],
      ...props.editorConfig?.MENU_CONF?.uploadVideo
    },
    ...props.editorConfig?.MENU_CONF
  }
}));

/**
 * 处理编辑器创建
 */
const handleCreated = (editor: IDomEditor) => {
  editorRef.value = editor;
  emit("created", editor);
};

/**
 * 处理内容变化
 */
const handleChange = (editor: IDomEditor) => {
  const html = editor.getHtml();
  emit("update:modelValue", html);
  emit("change", html, editor);

  // 验证
  if (props.rules && props.rules.length > 0) {
    validationResult.value = validate(html, props.rules);
  }
};

/**
 * 处理焦点事件
 */
const handleFocus = (editor: IDomEditor) => {
  emit("focus", editor);
};

/**
 * 处理失焦事件
 */
const handleBlur = (editor: IDomEditor) => {
  emit("blur", editor);
};

/**
 * 监听值变化
 */
watch(
  () => props.modelValue,
  newVal => {
    if (props.rules && props.rules.length > 0) {
      validationResult.value = validate(newVal, props.rules);
    }
  },
  { immediate: true }
);

/**
 * 组件挂载时验证
 */
onMounted(() => {
  if (props.rules && props.rules.length > 0 && props.modelValue) {
    validationResult.value = validate(props.modelValue, props.rules);
  }
});

/**
 * 组件销毁前，销毁编辑器
 */
onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor == null) return;
  editor.destroy();
});

/**
 * 对外暴露方法
 */
defineExpose({
  getEditor: () => editorRef.value,
  focus: () => editorRef.value?.focus(),
  blur: () => editorRef.value?.blur(),
  clear: () => {
    editorRef.value?.clear();
    emit("update:modelValue", "");
  },
  getHtml: () => editorRef.value?.getHtml(),
  getText: () => editorRef.value?.getText(),
  insertText: (text: string) => editorRef.value?.insertText(text),
  insertHtml: (html: string) => editorRef.value?.dangerouslyInsertHtml(html)
});
</script>

<style lang="scss" scoped>
.sc-richtext-input-wrapper {
  display: flex;
  align-items: flex-start;
  width: 100%;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  // 悬停效果
  &:hover {
    transform: translateY(-1px);

    .sc-richtext-input-container {
      box-shadow: var(--el-box-shadow-light);
    }
  }

  // 聚焦状态
  &:focus-within {
    transform: translateY(-2px);

    .sc-richtext-input-container {
      box-shadow: 0 0 0 4px var(--el-color-primary-light-9), 0 6px 16px var(--el-color-primary-light-8);
    }
  }
}

.sc-richtext-input-prefix {
  display: flex;
  align-items: center;
  color: var(--el-text-color-placeholder);
  margin-right: 12px;
  margin-top: 8px;
  font-size: 16px;
  transition: color 0.3s ease;

  .sc-richtext-input-wrapper:focus-within & {
    color: var(--el-color-primary);
  }
}

.sc-richtext-input-container {
  flex: 1;
  border: 2px solid var(--el-border-color-light);
  border-radius: 12px;
  overflow: hidden;
  background-color: var(--el-bg-color);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--el-box-shadow-lighter);

  &:hover {
    border-color: var(--el-border-color);
  }

  &:focus-within {
    border-color: var(--el-color-primary);
  }
}

.sc-richtext-toolbar {
  border-bottom: 1px solid var(--el-border-color-light);
  background-color: var(--el-fill-color-lighter);

  :deep(.w-e-toolbar) {
    border: none;
    background-color: transparent;
  }
}

.sc-richtext-editor {
  :deep(.w-e-text-container) {
    border: none;
    min-height: v-bind("typeof height === 'number' ? height + 'px' : height");

    .w-e-text-placeholder {
      color: var(--el-text-color-placeholder);
      font-style: normal;
    }

    .w-e-text {
      padding: 16px;
      font-size: 14px;
      line-height: 1.8;
      color: var(--el-text-color-primary);

      blockquote {
        border-left: 4px solid var(--el-color-primary-light-3);
        padding: 12px 16px;
        margin: 16px 0;
        border-radius: 0 8px 8px 0;
      }
    }
  }
}

// 禁用状态
.sc-richtext-editor--disabled {
  :deep(.w-e-text-container) {
    background-color: var(--el-fill-color-light);
    cursor: not-allowed;

    .w-e-text {
      color: var(--el-text-color-disabled);
    }
  }
}

// 验证失败状态
.sc-richtext-editor--invalid {
  .sc-richtext-input-container {
    border-color: var(--el-color-danger);
    animation: shake 0.5s ease-in-out;
  }
}

.sc-richtext-input__error {
  color: var(--el-color-danger);
  font-size: 12px;
  line-height: 1.4;
  padding: 8px 16px;
  background-color: var(--el-color-danger-light-9);
  border-top: 1px solid var(--el-color-danger-light-8);
}

// 动画定义
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .sc-richtext-input-container {
    border-radius: 10px;
  }

  .sc-richtext-toolbar {
    :deep(.w-e-toolbar) {
      .w-e-bar-item {
        margin: 1px;
        padding: 6px;
      }
    }
  }

  .sc-richtext-editor {
    :deep(.w-e-text-container .w-e-text) {
      padding: 12px;
      font-size: 16px; // 防止iOS缩放
    }
  }
}

@media (max-width: 480px) {
  .sc-richtext-input-container {
    border-radius: 8px;
  }

  .sc-richtext-editor {
    :deep(.w-e-text-container .w-e-text) {
      padding: 10px;
    }
  }
}
</style>

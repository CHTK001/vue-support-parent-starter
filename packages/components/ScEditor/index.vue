<template>
  <div class="sc-editor-container" :class="{ 'is-disabled': disabled }">
    <Toolbar class="sc-editor-toolbar" :editor="editorRef" :defaultConfig="toolbarConfig" :mode="mode" />
    <Editor
      v-model="valueHtml"
      class="sc-editor-content"
      :style="{ height: height, overflowY: 'hidden' }"
      :defaultConfig="editorConfig"
      :mode="mode"
      @onCreated="handleCreated"
      @onChange="handleChange"
    />
  </div>
</template>

<script setup lang="ts">
import "@wangeditor/editor/dist/css/style.css";
import "./style.css";

import { Editor, Toolbar } from "@wangeditor/editor-for-vue";
import { onBeforeUnmount, shallowRef, watch, computed, toRefs } from "vue";
import type { IDomEditor, IEditorConfig, IToolbarConfig } from "@wangeditor/editor";

interface Props {
  modelValue?: string;
  placeholder?: string;
  disabled?: boolean;
  height?: string;
  mode?: "default" | "simple";
  toolbarConfig?: Partial<IToolbarConfig>;
  editorConfig?: Partial<IEditorConfig>;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  placeholder: "请输入内容...",
  disabled: false,
  height: "500px",
  mode: "default",
  toolbarConfig: () => ({}),
  editorConfig: () => ({})
});

const emit = defineEmits(["update:modelValue", "change", "created"]);

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef<IDomEditor>();

// 内容 HTML
const valueHtml = shallowRef(props.modelValue);

const { disabled } = toRefs(props);

// 监听 modelValue 变化
watch(
  () => props.modelValue,
  val => {
    // 只有当内容不一致时才更新，避免光标跳动
    if (val !== valueHtml.value) {
      valueHtml.value = val;
    }
  }
);

// 工具栏配置
const toolbarConfig = computed(() => ({
  ...props.toolbarConfig
}));

// 编辑器配置
const editorConfig = computed(() => ({
  placeholder: props.placeholder,
  readOnly: props.disabled,
  ...props.editorConfig
}));

// 组件销毁时，也及时销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor == null) return;
  editor.destroy();
});

const handleCreated = (editor: IDomEditor) => {
  editorRef.value = editor;
  if (props.disabled) {
    editor.disable();
  }
  emit("created", editor);
};

const handleChange = (editor: IDomEditor) => {
  const html = editor.getHtml();
  valueHtml.value = html;
  emit("update:modelValue", html);
  emit("change", editor);
};

// 监听 disabled 变化
watch(disabled, val => {
  const editor = editorRef.value;
  if (editor == null) return;
  val ? editor.disable() : editor.enable();
});
</script>

<style lang="scss" scoped>
@use "@/styles/mixins.scss" as *;
@use "@/styles/variables.scss" as *;

.sc-editor-container {
  border: 1px solid $border-light;
  border-radius: $radius-md;
  overflow: hidden;
  transition: all $duration-normal $ease-standard;
  background-color: var(--el-bg-color);

  &:hover {
    border-color: $border-medium;
  }

  &:focus-within {
    border-color: $primary-color;
    box-shadow: 0 0 0 2px $primary-light;
  }

  &.is-disabled {
    background-color: $bg-glass-light;
    cursor: not-allowed;
    opacity: 0.8;
  }
}

.sc-editor-toolbar {
  border-bottom: 1px solid $border-light;
  background-color: $bg-glass-toolbar;
}
</style>

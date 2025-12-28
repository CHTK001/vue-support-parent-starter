<template>
  <div ref="editorContainer" class="monaco-editor-container" :style="{ height: editorHeight }"></div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import * as monaco from 'monaco-editor';

export default {
  name: 'MonacoEditor',
  props: {
    // 编辑器内容
    modelValue: {
      type: String,
      default: ''
    },
    // 编辑器语言
    language: {
      type: String,
      default: 'javascript'
    },
    // 编辑器主题
    theme: {
      type: String,
      default: 'vs'
    },
    // 编辑器高度
    height: {
      type: [String, Number],
      default: '300px'
    },
    // 编辑器配置项
    options: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['update:modelValue', 'change', 'editor-mounted'],
  setup(props, { emit }) {
    const editorContainer = ref(null);
    const editor = ref(null);
    const editorHeight = ref(typeof props.height === 'number' ? `${props.height}px` : props.height);
    let preventTriggerChangeEvent = false;

    // 初始化编辑器
    const initMonaco = async () => {
      if (!editorContainer.value) return;

      // 合并配置项
      const defaultOptions = {
        value: props.modelValue,
        language: props.language,
        theme: props.theme,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        minimap: { enabled: true },
        scrollbar: {
          useShadows: false,
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10
        }
      };

      const options = Object.assign(defaultOptions, props.options);

      // 创建编辑器实例
      editor.value = monaco.editor.create(editorContainer.value, options);

      // 监听内容变化
      editor.value.onDidChangeModelContent(event => {
        if (preventTriggerChangeEvent) {
          preventTriggerChangeEvent = false;
          return;
        }
        const value = editor.value.getValue();
        if (value !== props.modelValue) {
          emit('update:modelValue', value);
          emit('change', value, event);
        }
      });

      // 通知编辑器已挂载
      emit('editor-mounted', editor.value);
    };

    // 更新编辑器内容
    const updateValue = (value) => {
      if (editor.value && value !== editor.value.getValue()) {
        preventTriggerChangeEvent = true;
        editor.value.setValue(value);
      }
    };

    // 更新编辑器语言
    const updateLanguage = (language) => {
      if (editor.value) {
        const model = editor.value.getModel();
        monaco.editor.setModelLanguage(model, language);
      }
    };

    // 更新编辑器主题
    const updateTheme = (theme) => {
      if (editor.value) {
        monaco.editor.setTheme(theme);
      }
    };

    // 更新编辑器选项
    const updateOptions = (options) => {
      if (editor.value) {
        editor.value.updateOptions(options);
      }
    };

    // 监听属性变化
    watch(() => props.modelValue, updateValue);
    watch(() => props.language, updateLanguage);
    watch(() => props.theme, updateTheme);
    // 使用版本号避免深度监听 options
    const optionsVersion = computed(() => JSON.stringify(props.options));
    watch(optionsVersion, () => updateOptions(props.options));
    watch(() => props.height, (value) => {
      editorHeight.value = typeof value === 'number' ? `${value}px` : value;
      nextTick(() => {
        if (editor.value) {
          editor.value.layout();
        }
      });
    });

    // 组件挂载时初始化编辑器
    onMounted(() => {
      nextTick(() => {
        initMonaco();
      });
    });

    // 组件销毁前销毁编辑器
    onBeforeUnmount(() => {
      if (editor.value) {
        editor.value.dispose();
      }
    });

    return {
      editorContainer,
      editor,
      editorHeight
    };
  }
};
</script>

<style scoped>
.monaco-editor-container {
  width: 100%;
  min-height: 100px;
  border: 1px solid var(--el-border-color-light, #dcdfe6);
  border-radius: 4px;
  overflow: hidden;
}
</style> 
<template>
  <div style="border: 1px solid #ccc">
    <Toolbar style="border-bottom: 1px solid #ccc" :editor="editorRef" :defaultConfig="toolbarConfig" :mode="mode" />
    <Editor v-model="valueHtml" style="height: 500px; overflow-y: hidden" :defaultConfig="editorConfig" :mode="mode" @onCreated="handleCreated" @onChange="handleChange" />
  </div>
</template>
<script>
import "./style.css"; // 引入 css

import { Editor, Toolbar } from "@wangeditor/editor-for-vue";
import { onBeforeUnmount, shallowRef } from "vue";

export default {
  components: { Editor, Toolbar },
  props: {
    value: {
      type: String,
      default: ""
    }
  },
  setup() {
    // 编辑器实例，必须用 shallowRef
    const editorRef = shallowRef();

    // 内容 HTML
    const valueHtml = shallowRef("<p></p>");

    const toolbarConfig = {};
    const editorConfig = { placeholder: "请输入内容..." };

    // 组件销毁时，也及时销毁编辑器
    onBeforeUnmount(() => {
      const editor = editorRef.value;
      if (editor == null) return;
      editor.destroy();
    });

    const handleCreated = editor => {
      editorRef.value = editor; // 记录 editor 实例，重要！
    };

    return {
      editorRef,
      valueHtml,
      mode: "default", // 或 'simple'
      toolbarConfig,
      editorConfig,
      handleCreated
    };
  },
  methods: {
    handleChange(editor) {
      this.$emit("update:value", editor.getHtml());
    }
  }
};
</script>

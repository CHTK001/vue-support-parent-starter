<template>
  <div class="sc-code-editor" :style="{ height: _height }">
    <textarea ref="textarea" v-model="contentValue" />
  </div>
</template>

<script>
import { markRaw } from "vue";
import { CodeMirror } from "codemirror-editor-vue3";
export default {
  props: {
    modelValue: {
      type: String,
      default: ""
    },
    mode: {
      type: String,
      default: "javascript"
    },
    onInput: {
      type: Function,
      default: () => {}
    },
    onCursorActivity: {
      type: Function,
      default: () => {}
    },
    height: {
      type: [String, Number],
      default: 300
    },
    options: {
      type: Object,
      default: () => {}
    },
    theme: {
      type: String,
      default: "idea"
    },
    readOnly: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      contentValue: this.modelValue,
      coder: null,
      opt: {
        autoRefresh: true,
        autofocus: true,
        theme: this.theme, //主题
        autoMatchParens: true,
        styleActiveLine: true, //高亮当前行
        lineNumbers: true, //行号
        lineWrapping: false, //自动换行
        tabSize: 4, //Tab缩进
        indentUnit: 4, //缩进单位
        indentWithTabs: true, //自动缩进
        mode: this.mode, //语言
        readOnly: this.readOnly, //只读
        ...this.options
      }
    };
  },
  computed: {
    _height() {
      return Number(this.height) ? Number(this.height) + "px" : this.height;
    }
  },
  watch: {
    modelValue(val) {
      this.contentValue = val;
      if (val !== this.coder.getValue()) {
        this.coder.setValue(val);
      }
    }
  },
  mounted() {
    this.init();
    //获取挂载的所有modes
    //console.log(CodeMirror.modes)
  },
  methods: {
    refresh() {
      setTimeout(() => {
        this.coder.refresh();
      }, 10);
    },
    init() {
      this.coder = markRaw(CodeMirror.fromTextArea(this.$refs.textarea, this.opt));
      this.coder.on("change", coder => {
        this.contentValue = coder.getValue();
        this.$emit("update:modelValue", this.contentValue);
      });
      if (this.onInput) {
        this.coder.on("keyup", this.onInput);
      }
      if (this.onCursorActivity) {
        this.coder.on("cursorActivity", this.onCursorActivity);
      }
    },
    formatStrInJson(strValue) {
      return JSON.stringify(JSON.parse(strValue), null, 4);
    }
  }
};
</script>

<style scoped>
.sc-code-editor {
  font-size: 14px;
  border: 1px solid #ddd;
  line-height: 150%;
}
.sc-code-editor:deep(.CodeMirror) {
  height: 100%;
}
</style>

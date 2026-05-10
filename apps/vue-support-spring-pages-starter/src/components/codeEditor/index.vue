<template>
  <div class="sc-code-editor" :style="{ height: _height }">
    <textarea ref="textarea" v-model="contentValue" />
  </div>
</template>

<script>
import CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/idea.css";
import "codemirror/theme/darcula.css";
import "codemirror/addon/display/autorefresh";
import "codemirror/addon/selection/active-line";
import "codemirror/addon/hint/show-hint.css";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/hint/sql-hint";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/properties/properties";
import "codemirror/mode/shell/shell";
import "codemirror/mode/sql/sql";
import "codemirror/mode/xml/xml";
import "codemirror/mode/yaml/yaml";

export default {
  name: "CodeEditor",
  props: {
    modelValue: { type: String, default: "" },
    mode: { type: String, default: "sql" },
    height: { type: [String, Number], default: 300 },
    theme: { type: String, default: "idea" },
    readOnly: { type: Boolean, default: false },
  },
  data() {
    return {
      contentValue: this.modelValue,
      coder: null,
      opt: {
        autoRefresh: true, autofocus: true, theme: this.theme,
        styleActiveLine: true, lineNumbers: true, lineWrapping: true,
        tabSize: 4, indentUnit: 4, indentWithTabs: true,
        mode: this.mode, readOnly: this.readOnly,
      },
    };
  },
  computed: {
    _height() { return Number(this.height) ? `${Number(this.height)}px` : this.height; },
  },
  watch: {
    modelValue(val) {
      this.contentValue = val;
      if (this.coder && val !== this.coder.getValue()) this.coder.setValue(val);
    },
  },
  mounted() { this.init(); },
  beforeUnmount() {
    if (this.coder) { this.coder.toTextArea(); this.coder = null; }
  },
  methods: {
    init() {
      this.coder = CodeMirror.fromTextArea(this.$refs.textarea, this.opt);
      this.coder.on("change", () => {
        this.contentValue = this.coder.getValue();
        this.$emit("update:modelValue", this.contentValue);
      });
    },
  },
};
</script>

<style scoped>
.sc-code-editor { font-size: 14px; border: 1px solid #ddd; line-height: 150%; }
.sc-code-editor:deep(.CodeMirror) { height: 100%; }
</style>

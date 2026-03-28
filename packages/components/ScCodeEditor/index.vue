<template>
  <div class="sc-code-editor" :style="{ height: _height }">
    <textarea ref="textarea" v-model="contentValue" />
  </div>
</template>

<script>
import { markRaw } from "vue";
import CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/idea.css";
import "codemirror/theme/darcula.css";
import "codemirror/addon/display/autorefresh";
import "codemirror/addon/selection/active-line";
import "codemirror/addon/hint/show-hint.css";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/hint/sql-hint";

export default {
  name: "ScCodeEditor",
  props: {
    modelValue: {
      type: String,
      default: "",
    },
    mode: {
      type: String,
      default: "sql",
    },
    onInput: {
      type: Function,
      default: () => {},
    },
    onCursorActivity: {
      type: Function,
      default: () => {},
    },
    height: {
      type: [String, Number],
      default: 300,
    },
    options: {
      type: Object,
      default: () => ({}),
    },
    theme: {
      type: String,
      default: "idea",
    },
    readOnly: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      contentValue: this.modelValue,
      coder: null,
      opt: {
        autoRefresh: true,
        autofocus: true,
        theme: this.theme,
        autoMatchParens: true,
        styleActiveLine: true,
        lineNumbers: true,
        lineWrapping: false,
        tabSize: 4,
        indentUnit: 4,
        indentWithTabs: true,
        mode: this.mode,
        readOnly: this.readOnly,
        ...this.options,
      },
    };
  },
  computed: {
    _height() {
      return Number(this.height) ? `${Number(this.height)}px` : this.height;
    },
  },
  watch: {
    modelValue(val) {
      this.contentValue = val;
      if (this.coder && val !== this.coder.getValue()) {
        this.coder.setValue(val);
      }
    },
  },
  mounted() {
    this.init();
  },
  methods: {
    refresh() {
      setTimeout(() => {
        if (this.coder) {
          this.coder.refresh();
        }
      }, 10);
    },
    upgradeHits(hits) {
      if (!this.coder) return;
      this.coder.setOption("hintOptions", {
        tables: hits,
      });
    },
    init() {
      this.coder = markRaw(
        CodeMirror.fromTextArea(this.$refs.textarea, this.opt),
      );
      this.coder.on("change", (coder) => {
        this.contentValue = coder.getValue();
        this.$emit("update:modelValue", this.contentValue);
        this.$emit("updateValue", this.contentValue);
      });

      if (this.onInput) {
        this.coder.on("keyup", (val, e) => {
          this.onInput(val);
          if (e.keyCode === 8 || (e.keyCode >= 37 && e.keyCode <= 40)) {
            return;
          }
          this.coder.showHint();
        });
      }

      if (this.onCursorActivity) {
        this.coder.on("cursorActivity", () => {
          this.onCursorActivity();
        });
      }

      this.coder.setOption("hintOptions", {
        completeSingle: this.options?.completeSingle,
        tables: this.options?.tables,
      });
    },
    formatStrInJson(strValue) {
      return JSON.stringify(JSON.parse(strValue), null, 4);
    },
  },
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

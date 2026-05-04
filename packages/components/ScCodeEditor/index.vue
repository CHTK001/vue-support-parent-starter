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
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/properties/properties";
import "codemirror/mode/shell/shell";
import "codemirror/mode/sql/sql";
import "codemirror/mode/xml/xml";
import "codemirror/mode/yaml/yaml";

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
    keywordHighlights: {
      type: Array,
      default: () => [],
    },
    keywordHighlightCaseSensitive: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      contentValue: this.modelValue,
      coder: null,
      keywordMarkers: [],
      opt: {
        autoRefresh: true,
        autofocus: true,
        theme: this.theme,
        autoMatchParens: true,
        styleActiveLine: true,
        lineNumbers: true,
        lineWrapping: true,
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
        this.refreshKeywordHighlights();
      }
    },
    keywordHighlights: {
      deep: true,
      handler() {
        this.refreshKeywordHighlights();
      },
    },
    keywordHighlightCaseSensitive() {
      this.refreshKeywordHighlights();
    },
    mode(value) {
      if (this.coder) {
        this.coder.setOption("mode", value);
      }
    },
    readOnly(value) {
      if (this.coder) {
        this.coder.setOption("readOnly", value);
      }
    },
  },
  beforeUnmount() {
    this.clearKeywordMarkers();
    if (this.coder) {
      this.coder.toTextArea();
      this.coder = null;
    }
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
        this.refreshKeywordHighlights();
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
      this.refreshKeywordHighlights();
    },
    clearKeywordMarkers() {
      this.keywordMarkers.forEach((marker) => marker.clear());
      this.keywordMarkers = [];
    },
    normalizeKeywordHighlights() {
      return [...new Set(
        (this.keywordHighlights || [])
          .map((item) => String(item || "").trim())
          .filter(Boolean),
      )].slice(0, 40);
    },
    refreshKeywordHighlights() {
      if (!this.coder) return;
      this.clearKeywordMarkers();
      const keywords = this.normalizeKeywordHighlights();
      if (!keywords.length) return;
      const doc = this.coder.getDoc();
      const lastLine = doc.lastLine();
      const caseSensitive = this.keywordHighlightCaseSensitive;
      for (let lineNo = doc.firstLine(); lineNo <= lastLine; lineNo += 1) {
        const line = doc.getLine(lineNo) || "";
        const source = caseSensitive ? line : line.toLowerCase();
        keywords.forEach((keyword) => {
          const term = caseSensitive ? keyword : keyword.toLowerCase();
          let from = 0;
          while (term && from < source.length) {
            const index = source.indexOf(term, from);
            if (index < 0) break;
            this.keywordMarkers.push(
              doc.markText(
                { line: lineNo, ch: index },
                { line: lineNo, ch: index + keyword.length },
                { className: "sc-code-editor__keyword-hit" },
              ),
            );
            from = index + Math.max(keyword.length, 1);
            if (this.keywordMarkers.length > 500) return;
          }
        });
        if (this.keywordMarkers.length > 500) break;
      }
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

.sc-code-editor:deep(.sc-code-editor__keyword-hit) {
  color: #111827;
  background: rgba(250, 204, 21, 0.38);
  border-bottom: 1px solid rgba(202, 138, 4, 0.7);
  border-radius: 2px;
}
</style>

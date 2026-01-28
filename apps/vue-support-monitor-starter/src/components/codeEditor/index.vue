<template>
  <div
    class="code-mirror-div"
    :style="{
      height: height,
    }"
    v-loading="loading"
  >
    <template v-if="!loading">
      <div v-if="showTool" ref="toolBar" class="tool-bar">
        <slot name="tool_before" />

        <div class="tool-bar-end">
          <div class="tool-item">
            <span class="tool-label">{{ $t("i18n_08902526f1") }}</span>
            <el-select
              v-model="cmOptions.theme"
              filterable
              :placeholder="$t('i18n_37b30fc862')"
              style="width: 150px"
              @change="handleSelectTheme"
            >
              <el-option
                v-for="item in themeList"
                :key="item.theme"
                :label="item.name"
                :value="item.theme"
              />
            </el-select>
          </div>
          <div class="tool-item">
            <span class="tool-label">{{ $t("i18n_117a9cbc8d") }}</span>
            <el-select
              v-model="cmOptions.mode"
              filterable
              :placeholder="$t('i18n_773b1a5ef6')"
              style="width: 150px"
              @change="handleSelectMode"
            >
              <el-option value="" :label="$t('i18n_773b1a5ef6')" />
              <el-option
                v-for="item in modeList"
                :key="item.mode"
                :label="item.name"
                :value="item.mode"
              />
            </el-select>
          </div>

          <el-tooltip placement="bottom">
            <template #content>
              <ul class="shortcut-list">
                <li><b>Ctrl-F / Cmd-F</b>&nbsp;{{ $t("i18n_99d3e5c718") }}</li>
                <li><b>Ctrl-G / Cmd-G</b>&nbsp;{{ $t("i18n_6292498392") }}</li>
                <li>
                  <b>Shift-Ctrl-G / Shift-Cmd-G</b>&nbsp;{{
                    $t("i18n_11e88c95ee")
                  }}
                </li>
                <li>
                  <b>Shift-Ctrl-F / Cmd-Option-F</b>&nbsp;{{
                    $t("i18n_d324f8b5c9")
                  }}
                </li>
                <li>
                  <b>Shift-Ctrl-R / Shift-Cmd-Option-F</b>&nbsp;{{
                    $t("i18n_b9c4cf7483")
                  }}
                </li>
                <li><b>Alt-F</b>&nbsp;{{ $t("i18n_9402665a2c") }}</li>
                <li><b>Alt-G</b>&nbsp;{{ $t("i18n_5fc6c33832") }}</li>
              </ul>
            </template>
            <IconifyIconOnline icon="ri:question-line" class="help-icon" />
          </el-tooltip>
        </div>
      </div>
      <div :style="{ height: codeMirrorHeight }">
        <Codemirror
          v-model:value="data"
          :options="cmOptions"
          :placeholder="placeholder"
          @change="onCmCodeChanges"
          @ready="onReady"
        />
      </div>
    </template>
  </div>
</template>
<script>
import Codemirror from "codemirror-editor-vue3";
import "codemirror/lib/codemirror.css";

// language
import "codemirror/mode/javascript/javascript.js";
import "codemirror/mode/css/css.js";
import "codemirror/mode/diff/diff.js";
import "codemirror/mode/dockerfile/dockerfile.js";
import "codemirror/mode/go/go.js";
import "codemirror/mode/groovy/groovy.js";
import "codemirror/mode/http/http.js";
import "codemirror/mode/python/python.js";
import "codemirror/mode/rpm/rpm.js";
import "codemirror/mode/sass/sass.js";
import "codemirror/mode/ruby/ruby.js";
import "codemirror/mode/shell/shell.js";
import "codemirror/mode/vue/vue.js";
import "codemirror/mode/xml/xml.js";
import "codemirror/mode/yaml/yaml.js";
import "codemirror/mode/vb/vb.js";
import "codemirror/mode/sql/sql.js";
import "codemirror/mode/powershell/powershell.js";
import "codemirror/mode/nginx/nginx.js";
import "codemirror/mode/cmake/cmake.js";
import "codemirror/mode/properties/properties.js";
import "codemirror/mode/php/php.js";
import "codemirror/mode/htmlmixed/htmlmixed.js";
import "codemirror/mode/yaml-frontmatter/yaml-frontmatter.js";
const modes = [
  { name: "shell", mode: "shell" },
  { name: "powershell", mode: "powershell" },
  { name: "dockerfile", mode: "dockerfile" },
  { name: "yaml", mode: "yaml" },
  { name: "properties", mode: "properties" },
  { name: "htmlmixed", mode: "htmlmixed" },
  { name: "nginx", mode: "nginx" },
  { name: "python", mode: "python" },
  { name: "go", mode: "go" },
  { name: "php", mode: "php" },
  { name: "rpm", mode: "rpm" },
  { name: "sass", mode: "sass" },
  { name: "vue", mode: "vue" },
  { name: "xml", mode: "xml" },
  { name: "sql", mode: "sql" },
  { name: "javascript", mode: "javascript" },
  { name: "css", mode: "css" },
  { name: "diff", mode: "diff" },
  { name: "vb", mode: "vb" },
  { name: "http", mode: "http" },
  { name: "ruby", mode: "ruby" },
  { name: "groovy", mode: "groovy" },
  { name: "cmake", mode: "cmake" },
];

//

// theme
import "codemirror/theme/3024-day.css";
import "codemirror/theme/3024-night.css";
import "codemirror/theme/abcdef.css";
import "codemirror/theme/ambiance-mobile.css";
import "codemirror/theme/ayu-dark.css";
import "codemirror/theme/ambiance.css";
import "codemirror/theme/ayu-mirage.css";
import "codemirror/theme/abbott.css";
import "codemirror/theme/base16-dark.css";
import "codemirror/theme/base16-light.css";
import "codemirror/theme/bespin.css";
import "codemirror/theme/blackboard.css";
import "codemirror/theme/cobalt.css";
import "codemirror/theme/colorforth.css";
import "codemirror/theme/darcula.css";
import "codemirror/theme/dracula.css";
import "codemirror/theme/duotone-dark.css";
import "codemirror/theme/duotone-light.css";
import "codemirror/theme/eclipse.css";
import "codemirror/theme/elegant.css";
import "codemirror/theme/erlang-dark.css";
import "codemirror/theme/gruvbox-dark.css";
import "codemirror/theme/hopscotch.css";
import "codemirror/theme/icecoder.css";
import "codemirror/theme/idea.css";
import "codemirror/theme/isotope.css";
import "codemirror/theme/juejin.css";
import "codemirror/theme/lesser-dark.css";
import "codemirror/theme/liquibyte.css";
import "codemirror/theme/lucario.css";
import "codemirror/theme/material-darker.css";
import "codemirror/theme/material-palenight.css";
import "codemirror/theme/material-ocean.css";
import "codemirror/theme/material.css";
import "codemirror/theme/mbo.css";
import "codemirror/theme/mdn-like.css";
import "codemirror/theme/midnight.css";
import "codemirror/theme/monokai.css";
import "codemirror/theme/moxer.css";
import "codemirror/theme/neat.css";
import "codemirror/theme/neo.css";
import "codemirror/theme/night.css";
import "codemirror/theme/nord.css";
import "codemirror/theme/oceanic-next.css";
import "codemirror/theme/panda-syntax.css";
import "codemirror/theme/paraiso-dark.css";
import "codemirror/theme/paraiso-light.css";
import "codemirror/theme/pastel-on-dark.css";
import "codemirror/theme/railscasts.css";
import "codemirror/theme/rubyblue.css";
import "codemirror/theme/seti.css";
import "codemirror/theme/shadowfox.css";
import "codemirror/theme/solarized.css";
import "codemirror/theme/ssms.css";
import "codemirror/theme/the-matrix.css";
import "codemirror/theme/tomorrow-night-bright.css";
import "codemirror/theme/tomorrow-night-eighties.css";
import "codemirror/theme/ttcn.css";
import "codemirror/theme/twilight.css";
import "codemirror/theme/vibrant-ink.css";
import "codemirror/theme/xq-dark.css";
import "codemirror/theme/xq-light.css";
import "codemirror/theme/yeti.css";
import "codemirror/theme/yonce.css";
import "codemirror/theme/zenburn.css";

//
//
//
//
//

// placeholder
import "codemirror/addon/display/placeholder.js";

import "codemirror/addon/hint/show-hint.css";
import "codemirror/addon/hint/show-hint.js";
import "codemirror/addon/hint/sql-hint.js";
// import 'codemirror/addon/hint/javascript-hint.js'
// import 'codemirror/addon/hint/xml-hint.js'
// import 'codemirror/addon/hint/css-hint.js'
// import 'codemirror/addon/hint/html-hint.js'
// import 'codemirror/addon/hint/anyword-hint.js'
import CodeMirror from "codemirror";
// 自动提示
// import 'codemirror/addon/lint/lint.css'
// import 'codemirror/addon/lint/lint.js'
// import 'codemirror/addon/lint/json-lint'
// import 'codemirror/addon/lint/javascript-lint.js'
// 代码折叠
import "codemirror/addon/fold/foldcode.js";
import "codemirror/addon/fold/foldgutter.js";
import "codemirror/addon/fold/foldgutter.css";
import "codemirror/addon/fold/brace-fold.js";
import "codemirror/addon/fold/xml-fold.js";
import "codemirror/addon/fold/comment-fold.js";
import "codemirror/addon/fold/markdown-fold.js";
import "codemirror/addon/fold/indent-fold.js";

import "codemirror/addon/edit/closebrackets.js";
import "codemirror/addon/edit/closetag.js";
import "codemirror/addon/edit/matchtags.js";
import "codemirror/addon/edit/matchbrackets.js";
// 当前行高亮
import "codemirror/addon/selection/active-line.js";
import "codemirror/addon/search/jump-to-line.js";
import "codemirror/addon/dialog/dialog.js";
import "codemirror/addon/dialog/dialog.css";
import "codemirror/addon/search/searchcursor.js";
import "codemirror/addon/search/search.js";
import "codemirror/addon/display/autorefresh.js";
import "codemirror/addon/selection/mark-selection.js";
import "codemirror/addon/search/match-highlighter.js";
import { t } from "@repo/config";

// 文件后缀与语言对应表
const fileSuffixToModeMap = {
  html: "htmlmixed",
  css: "css",
  yml: "yaml",
  yaml: "yaml",
  json: "json",
  sh: "shell",
  bat: "powershell",
  vue: "vue",
  xml: "xml",
  sql: "sql",
  py: "python",
  php: "php",
  md: "markdown",
  dockerfile: "dockerfile",
  properties: "properties",
  lua: "lua",
  go: "go",
};
export default {
  components: { Codemirror },
  props: {
    height: {
      type: String,
      default: "100%",
    },
    content: {
      type: String,
      default: "",
    },
    options: {
      type: Object,
      default() {
        return {};
      },
    },
    fileSuffix: {
      type: String,
      default: "",
    },
    showTool: {
      type: Boolean,
      default: false,
    },
    placeholder: {
      type: String,
      default: function () {
        return t("i18n_a11cc7a65b");
      },
    },
    // SQL 自动补全的表名和字段数据
    // 格式: { 表名: [字段名1, 字段名2, ...], ... }
    sqlHintTables: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ["update:content"],
  data() {
    return {
      codeMirrorHeight: "",
      data: "",
      cmOptions: {
        mode: "", // Language mode
        theme: localStorage.getItem("editorTheme") || "idea", // Theme
        // // 是否应滚动或换行以显示长行
        lineWrapping: true,
        lineNumbers: true,
        autofocus: false,
        // 自动缩进，设置是否根据上下文自动缩进（和上一行相同的缩进量）。默认为true
        smartIndent: false,
        autocorrect: true,
        dragDrop: false,
        spellcheck: true,
        // scrollbarStyle: "Addons",
        // 指定当前滚动到视图中的文档部分的上方和下方呈现的行数。默认为10 - [integer]
        // // 有点类似于虚拟滚动显示
        // Infinity - 无限制，始终显示全部内容，但是数据量大的时候会造成页面卡顿
        viewportMargin: 10,
        lint: { esversion: "8" },
        gutters: [
          "CodeMirror-lint-markers",
          "CodeMirror-linenumbers",
          "CodeMirror-foldgutter",
        ],
        // extraKeys: {
        //   'Alt-Q': 'autocomplete',
        //   'Ctrl-Alt-L': () => {
        //     try {
        //       if (this.cmOptions.mode == 'json' && this.editorValue) {
        //         this.editorValue = this.formatStrInJson(this.editorValue)
        //       }
        //     } catch (e) {
        //       $message.error('格式化代码出错：' + e.toString())
        //     }
        //   }
        // },
        foldGutter: true,
        autoCloseBrackets: true,
        autoCloseTags: true,
        matchTags: { bothTags: true },
        matchBrackets: true,
        styleActiveLine: true,
        autoRefresh: true,
        highlightSelectionMatches: {
          minChars: 2,
          style: "matchhighlight",
          showToken: true,
        },
        styleSelectedText: true,
        enableAutoFormatJson: true,
        defaultJsonIndentation: 2,
        // SQL 自动补全配置
        extraKeys: {
          "Ctrl-Space": "autocomplete",
          "Alt-/": "autocomplete",
          Tab: (cm) => {
            // Tab 键触发自动补全或缩进
            if (cm.somethingSelected()) {
              cm.indentSelection("add");
            } else {
              const cursor = cm.getCursor();
              const token = cm.getTokenAt(cursor);
              // 如果当前有输入内容，触发自动补全
              if (token.string && token.string.trim()) {
                cm.execCommand("autocomplete");
              } else {
                cm.replaceSelection("  ");
              }
            }
          },
          ".": (cm) => {
            // 输入点号后触发自动补全（表名.字段名）
            cm.replaceSelection(".");
            if (
              cm.getOption("mode") === "sql" ||
              cm.getOption("mode") === "text/x-sql"
            ) {
              setTimeout(() => cm.execCommand("autocomplete"), 100);
            }
          },
        },
        hintOptions: {
          completeSingle: false,
          tables: {},
          // 自定义提示函数
          hint: (cm, options) => {
            return CodeMirror.hint.sql(cm, options);
          },
        },
      },
      modeList: modes,
      themeList: [
        // { name: '深色', theme: 'dracula' },
        // { name: '浅色', theme: 'eclipse' },
        // { name: '深色2', theme: 'blackboard' },
        // { name: '', theme: 'abbott' },
        // { name: '深白', theme: 'abcdef' },
        // { name: '黑白', theme: 'ambiance' },
        // { name: 'ayu深', theme: 'ayu-dark' },
        // { name: 'ayu深2', theme: 'ayu-mirage' },
        // { name: '浅灰', theme: 'bespin' }

        { name: this.$t("i18n_72eae3107e"), theme: "abbott" },
        { name: this.$t("i18n_96c1c8f4ee"), theme: "abcdef" },
        { name: this.$t("i18n_cad01fe13c"), theme: "ambiance-mobile" },
        { name: this.$t("i18n_1880b85dc5"), theme: "ambiance" },
        { name: this.$t("i18n_50ed14e70b"), theme: "dracula" },
        { name: this.$t("i18n_d937a135b9"), theme: "eclipse" },
        { name: this.$t("i18n_be1956b246"), theme: "blackboard" },
        { name: this.$t("i18n_8cae9cb626"), theme: "idea" },
        { name: "ayu-dark", theme: "ayu-dark" },
        { name: "ayu-mirage", theme: "ayu-mirage" },
        { name: "base16-dark", theme: "base16-dark" },
        { name: "base16-light", theme: "base16-light" },
        { name: "bespin", theme: "bespin" },

        { name: "cobalt", theme: "cobalt" },
        { name: "colorforth", theme: "colorforth" },

        { name: "duotone-dark", theme: "duotone-dark" },
        { name: "duotone-light", theme: "duotone-light" },

        { name: "elegant", theme: "elegant" },
        { name: "erlang-dark", theme: "erlang-dark" },
        { name: "gruvbox-dark", theme: "gruvbox-dark" },
        { name: "hopscotch", theme: "hopscotch" },
        { name: "icecoder", theme: "icecoder" },

        { name: "isotope", theme: "isotope" },
        { name: "juejin", theme: "juejin" },
        { name: "lesser-dark", theme: "lesser-dark" },
        { name: "liquibyte", theme: "liquibyte" },
        { name: "lucario", theme: "lucario" },
        { name: "material-darker", theme: "material-darker" },
        { name: "material-ocean", theme: "material-ocean" },
        { name: "material-palenight", theme: "material-palenight" },
        { name: "material", theme: "material" },
        { name: "mbo", theme: "mbo" },
        { name: "mdn-like", theme: "mdn-like" },
        { name: "midnight", theme: "midnight" },
        { name: "monokai", theme: "monokai" },
        { name: "moxer", theme: "moxer" },
        { name: "neat", theme: "neat" },
        { name: "neo", theme: "neo" },
        { name: "night", theme: "night" },
        { name: "nord", theme: "nord" },
        { name: "oceanic-next", theme: "oceanic-next" },
        { name: "panda-syntax", theme: "panda-syntax" },
        { name: "paraiso-dark", theme: "paraiso-dark" },
        { name: "paraiso-light", theme: "paraiso-light" },
        { name: "pastel-on-dark", theme: "pastel-on-dark" },
        { name: "railscasts", theme: "railscasts" },
        { name: "rubyblue", theme: "rubyblue" },
        { name: "seti", theme: "seti" },
        { name: "shadowfox", theme: "shadowfox" },
        { name: "solarized", theme: "solarized" },
        { name: "ssms", theme: "ssms" },
        { name: "the-matrix", theme: "the-matrix" },
        { name: "tomorrow-night-bright", theme: "tomorrow-night-bright" },
        { name: "tomorrow-night-eighties", theme: "tomorrow-night-eighties" },
        { name: "ttcn", theme: "ttcn" },
        { name: "twilight", theme: "twilight" },
        { name: "vibrant-ink", theme: "vibrant-ink" },
        { name: "xq-dark", theme: "xq-dark" },
        { name: "xq-light", theme: "xq-light" },
        { name: "yeti", theme: "yeti" },
        { name: "yonce", theme: "yonce" },
        { name: "zenburn", theme: "zenburn" },
        { name: "3024-day", theme: "3024-day" },
        { name: "3024-night", theme: "3024-night" },
      ],

      loading: true,
    };
  },
  watch: {
    fileSuffix: {
      handler(v) {
        if (!v) {
          return;
        }
        if (v.indexOf(".") > -1) {
          const textArr = v.split(".");
          const suffix = textArr.length ? textArr[textArr.length - 1] : v;
          const newMode = fileSuffixToModeMap[suffix];
          if (newMode) {
            this.cmOptions = { ...this.cmOptions, mode: newMode };
          }
        } else {
          const v2 = v.toLowerCase();
          for (let key in fileSuffixToModeMap) {
            if (v2.endsWith(key)) {
              const newMode = fileSuffixToModeMap[key];
              if (newMode) {
                this.cmOptions = { ...this.cmOptions, mode: newMode };
              }
              break;
            }
          }
        }
      },
      deep: true,
      immediate: true,
    },
    options: {
      handler(n) {
        if (Object.keys(n).length) {
          const options = JSON.parse(JSON.stringify(n));
          this.cmOptions = { ...this.cmOptions, ...options };
        }
      },
      deep: true,
      immediate: true,
    },
    // 监听 SQL 补全数据变化
    sqlHintTables: {
      handler(tables) {
        if (tables && Object.keys(tables).length) {
          this.cmOptions = {
            ...this.cmOptions,
            hintOptions: {
              ...this.cmOptions.hintOptions,
              tables: tables,
            },
          };
        }
      },
      deep: true,
      immediate: true,
    },
    content: {
      handler(v) {
        this.data = v || "";
        this.codeMirrorHeight = this.showTool ? `calc( 100% -  50px )` : "100%";
      },
      immediate: true,
    },
  },
  mounted() {
    // https://juejin.cn/post/7218032919008624700
    // const modules = import.meta.glob('/node_modules/codemirror/mode/**/*.js', { import: 'setup' })
    // // const requireAll = (requireContext) => requireContext.keys().map(requireContext)
    // // requireAll(modules)
    // for (const path in modules) {
    //   modules[path]().then((mod) => {
    //     const paths = path.split('/')
    //     console.log(path, paths[paths.length - 1].split('.')[0])
    //     // console.log(path, mod)
    //     import(/* @vite-ignore */ path).then(() => {})

    //     this.modeList.push(paths[paths.length - 1].split('.')[0])
    //   })
    // }
    // const themes = import.meta.glob('/node_modules/codemirror/theme/**/*.css', { query: '?inline' })
    // const array = []
    // for (const path in themes) {
    //   themes[path]().then((mod) => {
    //     console.log(`import '${path.replace('/node_modules/', '')}'`)
    //     console.log(path, mod)
    //     import(/* @vite-ignore */ path).then(() => {})
    //     const paths = path.split('/')
    //     array.push({ name: paths[paths.length - 1].split('.')[0], theme: paths[paths.length - 1].split('.')[0] })
    //     this.themeList.push(paths[paths.length - 1].split('.')[0])
    //     console.log(JSON.stringify(array))
    //   })
    // }

    // 延迟渲染，等待资源加载完成
    setTimeout(() => {
      this.loading = false;
    }, 1000);
  },
  methods: {
    onCmCodeChanges(v) {
      this.$emit("update:content", v);
    },
    // 选择语言
    handleSelectMode(v) {
      this.cmOptions = { ...this.cmOptions, mode: v };
    },

    // 选择皮肤
    handleSelectTheme(v) {
      this.cmOptions = { ...this.cmOptions, theme: v };
      localStorage.setItem("editorTheme", v);
    },

    onReady() {
      // console.log(editor)
      // // 绑定其他快捷键, 格式化编辑器代码做示例
      // let autoFormatSelection = () => {
      //   const script_length = editor.getValue().length
      //   const startPos = { line: 0, ch: 0, sticky: null }
      //   const endPos = editor.doc.posFromIndex(script_length)
      //   editor.setSelection(startPos, endPos)
      //   editor.autoFormatRange(startPos, endPos)
      //   editor.commentRange(false, startPos, endPos)
      // }
      // editor.addKeyMap({
      //   'Ctrl-Alt-L': autoFormatSelection
      // })
    },
  },
};
</script>
<style>
.CodeMirror {
  height: 100%;
  min-height: 200px;
  font-size: 14px;
  line-height: 1.5;
}

.CodeMirror-scroll {
  margin: 0;
  padding: 0;
}

.CodeMirror-selected {
  background-color: rgba(59, 130, 246, 0.2) !important;
}

.CodeMirror-selectedtext {
  color: inherit !important;
}

.cm-matchhighlight {
  background-color: rgba(251, 191, 36, 0.3);
}

/* 确保主题样式优先级 */
.CodeMirror.cm-s-idea {
  background: #fff;
  color: #000;
}

.CodeMirror.cm-s-dracula {
  background: #282a36;
  color: #f8f8f2;
}

.CodeMirror.cm-s-monokai {
  background: #272822;
  color: #f8f8f2;
}

.CodeMirror.cm-s-material-darker {
  background: #212121;
  color: #eeffff;
}

/* 代码提示框样式 */
.CodeMirror-hints {
  z-index: 9999 !important;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 4px 0;
  font-family: "Consolas", "Monaco", monospace;
  font-size: 13px;
}

.CodeMirror-hint {
  padding: 4px 12px;
  color: #334155;
  cursor: pointer;
}

.CodeMirror-hint-active {
  background: #3b82f6;
  color: #fff;
}

/* 行号样式 */
.CodeMirror-linenumber {
  padding: 0 8px 0 4px;
  min-width: 32px;
  text-align: right;
  color: #94a3b8;
}

/* 光标样式 */
.CodeMirror-cursor {
  border-left: 2px solid #3b82f6;
}

/* 当前行高亮 */
.CodeMirror-activeline-background {
  background: rgba(59, 130, 246, 0.05);
}

/* 折叠代码标记 */
.CodeMirror-foldmarker {
  color: #3b82f6;
  text-shadow: none;
  font-family: inherit;
  cursor: pointer;
}

/* 搜索匹配高亮 */
.cm-searching {
  background: rgba(251, 191, 36, 0.4);
}
</style>
<style scoped lang="scss">
/* .CodeMirror-hints {
  z-index: 3330 !important;
} */
.code-mirror-div {
  height: 100%;
  line-height: 24px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  overflow: hidden;
  background: var(--el-bg-color-overlay);
}

.tool-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
  gap: 12px;
}

.tool-bar-end {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
}

.tool-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-label {
  font-size: 13px;
  color: #64748b;
  white-space: nowrap;
}

.help-icon {
  font-size: 18px;
  color: #64748b;
  cursor: pointer;
  transition: color 0.2s;
}

.help-icon:hover {
  color: #3b82f6;
}

.shortcut-list {
  margin: 0;
  padding: 0 0 0 16px;
  font-size: 13px;
  line-height: 1.8;
}

.shortcut-list li {
  margin: 4px 0;
}

/* Element Plus Select 样式覆盖 */
:deep(.el-select) {
  min-width: 150px;
}

:deep(.el-select .el-input__wrapper) {
  border-radius: 6px;
  box-shadow: 0 0 0 1px #e5e7eb inset;
}

:deep(.el-select .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #3b82f6 inset;
}

:deep(.el-select .el-input.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 1px #3b82f6 inset;
}
/*
.CodeMirror {
  height: 100%;
  border: 1px solid #ccc;
}
.CodeMirror-selected {
  background-color: blue !important;
}

.CodeMirror-selectedtext {
  color: white !important;
}
.cm-matchhighlight {
  background-color: var(--el-color-danger-light-9);
}
.CodeMirror-scroll {
  margin: 0;
  padding: 0;
}
.vue-codemirror {
  height: 100%;
} */
</style>

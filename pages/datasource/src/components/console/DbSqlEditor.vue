<script setup lang="ts">
/**
 * 查询编辑器（CodeMirror 6 三方组件封装）—— SQL / Flux / Cypher 统一入口。
 *
 * <p>能力全部由三方组件提供：</p>
 * <ul>
 *   <li>sql：{@code @codemirror/lang-sql} 语法高亮 + 关键字/表/字段补全；</li>
 *   <li>flux / cypher：{@code StreamLanguage} 流式高亮 + 关键字补全
 *       （内置管道函数/查询关键字，叠加调用方传入的 bucket、标签等动态候选）；</li>
 *   <li>{@code @codemirror/autocomplete}：补全下拉（输入即弹、Enter/Tab 采纳）；</li>
 *   <li>{@code @codemirror/commands}：历史/默认按键；额外绑定 Ctrl+Enter 执行。</li>
 * </ul>
 * <p>sql 模式表结构按需解析：文档中出现 FROM/JOIN/UPDATE/INTO 的表名时，经
 * {@code columnResolver} 拉取字段并动态 reconfigure schema，实现「表 + 字段」智能提示。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import { Compartment, EditorState } from "@codemirror/state";
import type { Extension } from "@codemirror/state";
import { EditorView, keymap, placeholder as cmPlaceholder } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { autocompletion, completionKeymap } from "@codemirror/autocomplete";
import type { CompletionContext } from "@codemirror/autocomplete";
import { sql } from "@codemirror/lang-sql";
import { defaultHighlightStyle, syntaxHighlighting, StreamLanguage } from "@codemirror/language";
import type { StreamParser } from "@codemirror/language";

const props = defineProps<{
  /** 编辑器文本（v-model） */
  modelValue: string;
  /** 编辑器语言：sql（默认，表/字段补全）| flux | cypher —— 三种查询统一走本组件 */
  language?: "sql" | "flux" | "cypher";
  /** 动态补全候选（flux：bucket/测量名；cypher：标签/关系类型），与内置关键字合并去重 */
  keywords?: string[];
  /** 占位提示，缺省按语言给默认文案 */
  placeholder?: string;
  /** 当前库表名（补全候选，sql 模式） */
  tables?: string[];
  /** 表字段解析器（按需拉取并缓存，sql 模式） */
  columnResolver?: (table: string) => Promise<string[]>;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "execute"): void;
}>();

/** Flux 内置关键字与管道函数（高亮 + 补全共用） */
const FLUX_KEYWORDS = [
  "from", "bucket", "range", "filter", "map", "keep", "drop", "rename", "aggregateWindow",
  "aggregate", "window", "mean", "sum", "count", "min", "max", "last", "first", "distinct",
  "group", "sort", "limit", "offset", "take", "tail", "derivative", "difference",
  "movingAverage", "shift", "spread", "stddev", "variance", "covariance", "corr",
  "histogram", "quantile", "to", "toString", "toInt", "toFloat", "toBool", "toTime",
  "parseCSV", "parseJSON", "parseTimestamp", "parseDuration", "unixNano", "uint",
  "union", "intersect", "except", "pivot", "unpivot", "tableFind", "findColumn",
  "findRecord", "findTable", "schema", "fields", "tags", "exists", "regex", "match",
  "systemTime", "now", "time", "timeInterval", "month", "week", "day", "hour", "minute",
  "second", "millisecond", "date", "dateTruncate", "subDuration", "addDuration",
  "log", "exp", "sqrt", "abs", "round", "floor", "ceil", "pow", "sin", "cos", "tan",
  "random", "haversineDistance", "v1", "experimental", "array", "columns", "rows", "signal",
];

/** Cypher 内置关键字与函数（高亮 + 补全共用） */
const CYPHER_KEYWORDS = [
  "match", "optional", "where", "return", "with", "create", "merge", "set", "delete",
  "detach", "remove", "order", "by", "skip", "limit", "asc", "desc", "union", "explain",
  "profile", "case", "when", "then", "else", "end", "as", "and", "or", "not", "xor",
  "is", "null", "true", "false", "on", "unique", "count", "sum", "avg", "min", "max",
  "collect", "coalesce", "head", "last", "labels", "type", "properties", "relationships",
  "relationship", "nodes", "shortestPath", "range", "exists", "size", "toInteger",
  "toFloat", "toString", "left", "right", "substring", "toUpper", "toLower", "trim",
  "replace", "split", "reverse", "abs", "ceil", "floor", "round", "rand", "timestamp",
  "date", "datetime", "time", "duration", "point", "distance", "area", "bearing",
  "keys", "elementId", "id", "startNode", "endNode",
];

const FLUX_SET = new Set(FLUX_KEYWORDS);
const CYPHER_SET = new Set(CYPHER_KEYWORDS);

/** 编辑器等宽字体栈（为什么需要逐元素设置，见 onMounted 内 theme 的注释） */
const MONO_FONT = "var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace)";

/**
 * 轻量 Flux 流式解析器：管道函数按关键字高亮，覆盖字符串/数字/行注释。
 * token 名沿用 legacy-modes 的通用命名，由 StreamLanguage 映射为高亮样式。
 */
const fluxStreamParser: StreamParser<object> = {
  startState: () => ({}),
  token(stream) {
    if (stream.eatSpace()) return null;
    if (stream.match("//")) {
      stream.skipToEnd();
      return "comment";
    }
    if (stream.match(/^"(?:[^"\\]|\\.)*"/) || stream.match(/^`[^`]*`/)) return "string";
    if (stream.match(/^-?\d+(\.\d+)?([eE][+-]?\d+)?/)) return "number";
    if (stream.match(/^[A-Za-z_][A-Za-z0-9_.]*/)) {
      return FLUX_SET.has(stream.current().toLowerCase()) ? "keyword" : "variableName";
    }
    stream.next();
    return "operator";
  },
  languageData: { commentTokens: { line: "//" } },
};

/** 轻量 Cypher 流式解析器：子句/函数高亮，覆盖注释/字符串/数字 */
const cypherStreamParser: StreamParser<object> = {
  startState: () => ({}),
  token(stream) {
    if (stream.eatSpace()) return null;
    if (stream.match("//")) {
      stream.skipToEnd();
      return "comment";
    }
    if (stream.match(/^\/\*(?:[^*]|\*(?!\/))*\*\//)) return "comment";
    if (stream.match(/^'(?:[^'\\]|\\.)*'/) || stream.match(/^"(?:[^"\\]|\\.)*"/) || stream.match(/^`[^`]*`/)) {
      return "string";
    }
    if (stream.match(/^\d+(\.\d+)?/)) return "number";
    if (stream.match(/^[A-Za-z_][A-Za-z0-9_]*/)) {
      return CYPHER_SET.has(stream.current().toLowerCase()) ? "keyword" : "variableName";
    }
    stream.next();
    return "operator";
  },
  languageData: { commentTokens: { line: "//", block: { open: "/*", close: "*/" } } },
};

const host = ref<HTMLDivElement>();
const view = shallowRef<EditorView>();

/** 语言支持独立舱：语言/表结构/补全词表变化时原地 reconfigure，不重建编辑器 */
const languageCompartment = new Compartment();
/** 已解析的表字段（表名 -> 字段） */
const loadedColumns = new Map<string, string[]>();
let schemaTimer: number | undefined;

/** 组装 lang-sql 的 schema 配置 */
function buildSchema(): Record<string, string[]> {
  const schema: Record<string, string[]> = {};
  for (const table of props.tables ?? []) {
    schema[table] = loadedColumns.get(table) ?? [];
  }
  // 不在当前库列表但已解析过的表也带上，避免语句引用旧表时提示丢失
  for (const [table, columns] of loadedColumns) {
    if (!(table in schema)) schema[table] = columns;
  }
  return schema;
}

/** 按语言组装语言扩展：sql 走 lang-sql（含 schema 补全），flux/cypher 走流式解析器 + 关键字补全 */
function buildLanguageExt(): Extension {
  const lang = props.language ?? "sql";
  if (lang === "flux" || lang === "cypher") {
    return [
      StreamLanguage.define(lang === "flux" ? fluxStreamParser : cypherStreamParser),
      EditorState.languageData.of(() => [{ autocomplete: keywordCompleter() }]),
    ];
  }
  return sql({ schema: buildSchema(), upperCaseKeywords: false });
}

/** flux/cypher 的补全源：内置关键字/函数 ∪ 调用方传入的动态候选（bucket、标签等） */
function keywordCompleter() {
  const lang = props.language ?? "sql";
  const base = lang === "flux" ? FLUX_KEYWORDS : lang === "cypher" ? CYPHER_KEYWORDS : [];
  return (context: CompletionContext) => {
    const word = context.matchBefore(/[\w]*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;
    const baseSet = new Set(base);
    const seen = new Set<string>();
    const options: { label: string; type: string }[] = [];
    for (const w of [...base, ...(props.keywords ?? [])]) {
      if (!w || seen.has(w)) continue;
      seen.add(w);
      options.push({ label: w, type: baseSet.has(w) ? "keyword" : "variable" });
    }
    return { from: word.from, options };
  };
}

/** 按语言给默认占位文案 */
function defaultPlaceholder(): string {
  const lang = props.language ?? "sql";
  if (lang === "flux") {
    return "输入 Flux 查询，例如：from(bucket: \"my-bucket\") |> range(start: -1h)（Ctrl+Enter 执行）";
  }
  if (lang === "cypher") {
    return "输入 Cypher 查询，例如：MATCH (n:Label) RETURN n LIMIT 10（Ctrl+Enter 执行）";
  }
  return "输入 SQL 语句，输入即提示表/字段/关键字（Ctrl+Enter 执行）";
}

/** 重配语言扩展（schema / 语言 / 补全词表变化时调用） */
function reconfigureLanguage(): void {
  view.value?.dispatch({
    effects: languageCompartment.reconfigure(buildLanguageExt()),
  });
}

/** 文档中引用的表名（FROM / JOIN / UPDATE / INTO / TABLE 后） */
function referencedTables(text: string): string[] {
  const found = new Set<string>();
  const re = /\b(?:FROM|JOIN|UPDATE|INTO|TABLE)\s+`?([A-Za-z0-9_$]+)`?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    found.add(m[1]);
  }
  return [...found];
}

/** 按需解析文档引用的表字段并刷新补全 schema */
async function refreshSchemaFromDoc(text: string): Promise<void> {
  if (!props.columnResolver) return;
  let changed = false;
  for (const table of referencedTables(text)) {
    if (loadedColumns.has(table)) continue;
    loadedColumns.set(table, []);
    try {
      loadedColumns.set(table, await props.columnResolver(table));
      changed = true;
    } catch {
      // 解析失败保持空字段，不影响编辑
    }
  }
  if (changed) reconfigureLanguage();
}

/** 提交文本到父级 */
function emitChange(text: string): void {
  emit("update:modelValue", text);
}

onMounted(() => {
  if (!host.value) return;
  const state = EditorState.create({
    doc: props.modelValue ?? "",
    extensions: [
      history(),
      autocompletion(),
      keymap.of([
        { key: "Mod-Enter", run: () => { emit("execute"); return true; } },
        ...completionKeymap,
        ...defaultKeymap,
        ...historyKeymap,
      ]),
      languageCompartment.of(buildLanguageExt()),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      cmPlaceholder(props.placeholder ?? defaultPlaceholder()),
      EditorView.updateListener.of(update => {
        if (!update.docChanged) return;
        emitChange(update.state.doc.toString());
        window.clearTimeout(schemaTimer);
        schemaTimer = window.setTimeout(() => void refreshSchemaFromDoc(update.state.doc.toString()), 300);
      }),
      EditorView.theme({
        "&": {
          fontSize: "12.5px",
          border: "1px solid var(--el-border-color-lighter)",
          borderRadius: "var(--el-radius-lg, 12px)",
          backgroundColor: "var(--el-fill-color-extra-light, var(--el-fill-color-light))",
          overflow: "hidden",
        },
        "&.cm-focused": {
          outline: "none",
          borderColor: "var(--el-color-primary)",
          boxShadow: "0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent)",
        },
        ".cm-scroller": {
          maxHeight: "320px",
          fontFamily: MONO_FONT,
          lineHeight: "1.6",
        },
        ".cm-content": {
          padding: "12px 14px",
          minHeight: "180px",
          color: "var(--el-text-color-primary)",
          fontFamily: MONO_FONT,
        },
        // 主题包有全局 * { font-family: KoiFont… }，直接命中 .cm-line 等元素——
        // 任何直接命中的规则都胜过继承，仅给 .cm-scroller 设字体时代码文本
        // 实际渲染成品牌字体（比例字体在 20px 行高下，下行字母 gjpqy 底部被裁）。
        // 故逐元素钉回等宽字体；注意选择器不可写逗号列表：buildTheme 只给
        // 整段选择器加一次作用域前缀，逗号后的其余选择器会泄漏成全局规则。
        ".cm-line": { fontFamily: MONO_FONT },
        ".cm-gutters": {
          backgroundColor: "transparent",
          border: "none",
          color: "var(--el-text-color-placeholder)",
          fontFamily: MONO_FONT,
        },
        ".cm-gutterElement": { fontFamily: MONO_FONT },
        ".cm-placeholder": { fontFamily: MONO_FONT },
        ".cm-activeLine": { backgroundColor: "transparent" },
        ".cm-activeLineGutter": { backgroundColor: "transparent" },
        ".cm-tooltip": {
          border: "1px solid var(--el-border-color-lighter)",
          backgroundColor: "var(--el-bg-color-overlay, var(--el-bg-color))",
          color: "var(--el-text-color-regular)",
        },
        ".cm-tooltip-autocomplete ul li[aria-selected]": {
          backgroundColor: "var(--el-color-primary-light-9)",
          color: "var(--el-color-primary)",
        },
      }),
    ],
  });
  view.value = new EditorView({ state, parent: host.value });
  void refreshSchemaFromDoc(state.doc.toString());
});

watch(
  () => props.modelValue,
  value => {
    const current = view.value;
    if (!current) return;
    const text = value ?? "";
    if (text !== current.state.doc.toString()) {
      current.dispatch({ changes: { from: 0, to: current.state.doc.length, insert: text } });
    }
  },
);

watch(
  () => props.tables,
  () => reconfigureLanguage(),
  { deep: true },
);

// flux/cypher 的动态补全词（bucket/标签列表异步加载）到位后原地刷新补全表
watch(
  () => props.keywords,
  () => reconfigureLanguage(),
  { deep: true },
);

onBeforeUnmount(() => {
  window.clearTimeout(schemaTimer);
  view.value?.destroy();
  view.value = undefined;
});
</script>

<template>
  <div ref="host" class="cm-sql-editor" />
</template>

<style scoped>
.cm-sql-editor :deep(.cm-editor) {
  max-height: 360px;
}
.cm-sql-editor :deep(.cm-editor.cm-focused) {
  outline: none;
}
</style>

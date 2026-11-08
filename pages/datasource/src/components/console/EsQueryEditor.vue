<script setup lang="ts">
/**
 * ES Query DSL 编辑器（CodeMirror 6 封装）
 *
 * <p>能力：</p>
 * <ul>
 *   <li>ES Query DSL JSON 流式语法高亮（match/term/range/bool/must/filter/aggs 等）</li>
 *   <li>关键字自动补全（内置 + 调用方传入的动态候选：索引名/字段名）</li>
 *   <li>Ctrl+Enter 执行（emit execute 事件）</li>
 *   <li>高度可配置（minHeight/maxHeight）</li>
 * </ul>
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
import { defaultHighlightStyle, syntaxHighlighting, StreamLanguage } from "@codemirror/language";
import type { StreamParser } from "@codemirror/language";

const props = defineProps<{
  /** 编辑器文本（v-model） */
  modelValue: string;
  /** 动态补全候选（索引名、字段名等） */
  keywords?: string[];
  /** 占位提示 */
  placeholder?: string;
  /** 编辑器最小高度 */
  minHeight?: string;
  /** 编辑器最大高度 */
  maxHeight?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "execute"): void;
}>();

/** ES Query DSL 关键字（JSON 高亮 + 补全共用） */
const ES_DSL_KEYWORDS = [
  // ---- 查询上下文 ----
  "query", "match", "match_phrase", "match_phrase_prefix", "multi_match",
  "term", "terms", "terms_set", "range", "exists", "missing", "prefix",
  "wildcard", "regexp", "fuzzy", "ids", "type", "ids",
  // ---- bool 组合 ----
  "bool", "must", "must_not", "should", "filter", "minimum_should_match",
  "boost", "constant_score", "dis_max",
  // ---- 排序/分页 ----
  "sort", "_score", "_doc", "_geo_distance", "order", "asc", "desc",
  "from", "size", "track_total_hits", "timeout", "terminate_after",
  // ---- _source / 字段 ----
  "_source", "includes", "excludes", "script_fields", "docvalue_fields",
  "stored_fields", "fetch_source", "source",
  // ---- 高亮 ----
  "highlight", "fields", "pre_tags", "post_tags", "fragment_size",
  "number_of_fragments", "boundary_scanner", "boundary_chars",
  // ---- 聚合 ----
  "aggs", "aggregations", "avg", "sum", "min", "max", "value_count",
  "stats", "extended_stats", "cardinality", "percentiles", "percentile_ranks",
  "histogram", "date_histogram", "range", "terms", "significant_terms",
  "composite", "filters", "bucket_sort", "bucket_selector", "bucket_script",
  "nested", "reverse_nested", "top_hits", "weighted_tokens",
  "filter", "global", "filter_path",
  // ---- 建议 ----
  "suggest", "completion", "term", "phrase", "direct_generator",
  "highlight",
  // ---- 分析器 / mapping ----
  "analyzer", "search_analyzer", "normalizer", "format", "locale",
  "properties", "type", "enabled", "dynamic", "ignore_above",
  "index", "doc_values", "store", "similarity",
  "keyword", "text", "long", "integer", "short", "byte",
  "double", "float", "half_float", "scaled_float",
  "boolean", "date", "date_nanos", "binary", "object", "nested",
  "ip", "geo_point", "geo_shape", "shape", "murmur3",
  "join", "parent", "children", "routing", "alias",
  // ---- 别名 / 索引 ----
  "aliases", "settings", "mappings", "number_of_shards", "number_of_replicas",
  "refresh_interval", "index_patterns", "template", "index_template",
  "aliases",
  // ---- Bulk / 管道 ----
  "index", "create", "update", "delete", "ingest",
  // ---- 集群 / 节点 ----
  "cluster", "nodes", "shards", "indices", "routing",
  // ---- 特殊字段 ----
  "_id", "_index", "_type", "_uid", "_score", "_routing",
  "_version", "_seq_no", "_primary_term", "_meta",
  "_ignored", "_explanation", "_shard", "_node",
];

const ES_DSL_SET = new Set(ES_DSL_KEYWORDS);

/** ES DSL 流式解析器：关键字/字符串/数字/注释/运算符 */
const esDslStreamParser: StreamParser<object> = {
  startState: () => ({}),
  token(stream) {
    if (stream.eatSpace()) return null;
    // 行注释
    if (stream.match("//")) { stream.skipToEnd(); return "comment"; }
    // 块注释
    if (stream.match(/\/\*(?:[^*]|\*(?!\/))*\*\//)) return "comment";
    // 字符串（JSON 值）
    if (stream.match(/^"(?:[^"\\]|\\.)*"/)) return "string";
    // 数字
    if (stream.match(/^-?\d+(\.\d+)?([eE][+-]?\d+)?/)) return "number";
    // 布尔/空
    if (stream.match(/^(?:true|false|null)\b/)) return "atom";
    // 标识符（含 ES 关键字）
    if (stream.match(/^[A-Za-z_$][A-Za-z0-9_$.]*/)) {
      const w = stream.current();
      if (ES_DSL_SET.has(w)) return "keyword";
      // _field / _xxx 以 _ 开头的内部字段
      if (w.startsWith("_")) return "atom";
      return "variableName";
    }
    // 符号
    if (stream.match(/^[{}\[\]:,]/) || stream.match(/^[+\-*/<>=!]+/)) return "operator";
    stream.next();
    return null;
  },
  languageData: { commentTokens: { line: "//", block: { open: "/*", close: "*/" } } },
};

/** 补全源：内置 ES DSL 关键字 ∪ 动态候选 */
function keywordCompleter() {
  return (context: CompletionContext) => {
    const word = context.matchBefore(/[A-Za-z_$][\w$]*$/);
    if (!word || (word.from === word.to && !context.explicit)) return null;
    const typed = context.state.sliceDoc(word.from, word.to).toLowerCase();
    const baseSet = new Set(ES_DSL_KEYWORDS);
    const seen = new Set<string>();
    const options: { label: string; type: string }[] = [];
    for (const w of [...ES_DSL_KEYWORDS, ...(props.keywords ?? [])]) {
      if (!w || seen.has(w)) continue;
      if (typed && !w.toLowerCase().startsWith(typed)) continue;
      seen.add(w);
      options.push({ label: w, type: baseSet.has(w) ? "keyword" : "variable" });
    }
    if (options.length === 0) return null;
    return { from: word.from, options };
  };
}

const host = ref<HTMLDivElement>();
const view = shallowRef<EditorView>();
const languageCompartment = new Compartment();

const MONO_FONT = "var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace)";

/** 默认占位文案 */
function defaultPlaceholder(): string {
  return '输入 ES Query DSL，例如：{"query":{"match":{"title":"hello"}}, "from":0, "size":10}（Ctrl+Enter 执行）';
}

onMounted(() => {
  if (!host.value) return;
  const minH = props.minHeight ?? "200px";
  const maxH = props.maxHeight ?? "480px";
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
      languageCompartment.of([
        StreamLanguage.define({ ...esDslStreamParser, languageData: { ...esDslStreamParser.languageData, autocomplete: keywordCompleter() } }),
      ]),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      cmPlaceholder(props.placeholder ?? defaultPlaceholder()),
      EditorView.updateListener.of(update => {
        if (!update.docChanged) return;
        emit("update:modelValue", update.state.doc.toString());
      }),
      EditorView.theme({
        "&": {
          fontSize: "12px",
          border: "1px solid var(--el-border-color-lighter)",
          borderRadius: "var(--es-radius-sm, 8px)",
          backgroundColor: "color-mix(in srgb, var(--el-fill-color-light) 50%, color-mix(in srgb, var(--el-color-primary) 3%, #fff))",
          overflow: "hidden",
        },
        "&.cm-focused": {
          outline: "none",
          borderColor: "var(--el-color-primary)",
          boxShadow: "0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent)",
        },
        ".cm-scroller": {
          maxHeight: maxH,
          fontFamily: MONO_FONT,
          lineHeight: "1.6",
        },
        ".cm-content": {
          padding: "12px 14px",
          minHeight: minH,
          color: "var(--el-text-color-primary)",
          fontFamily: MONO_FONT,
        },
        ".cm-line": { fontFamily: MONO_FONT },
        ".cm-gutters": {
          backgroundColor: "transparent",
          border: "none",
          color: "var(--el-text-color-placeholder)",
          fontFamily: MONO_FONT,
        },
        ".cm-gutterElement": { fontFamily: MONO_FONT },
        ".cm-placeholder": { fontFamily: MONO_FONT, color: "var(--el-text-color-placeholder)" },
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
  () => props.keywords,
  () => {
    view.value?.dispatch({
      effects: languageCompartment.reconfigure([
        StreamLanguage.define({ ...esDslStreamParser, languageData: { ...esDslStreamParser.languageData, autocomplete: keywordCompleter() } }),
      ]),
    });
  },
  { deep: true },
);

onBeforeUnmount(() => {
  view.value?.destroy();
  view.value = undefined;
});
</script>

<template>
  <div ref="host" class="cm-es-editor" />
</template>

<style scoped>
.cm-es-editor :deep(.cm-editor) {
  max-height: 480px;
}
.cm-es-editor :deep(.cm-editor.cm-focused) {
  outline: none;
}
</style>

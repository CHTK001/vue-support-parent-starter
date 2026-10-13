<script setup lang="ts">
/**
 * 查询编辑器（CodeMirror 6 三方组件封装）—— SQL / Flux / Cypher / Redis / Mongo Shell 统一入口。
 *
 * <p>能力全部由三方组件提供：</p>
 * <ul>
 *   <li>sql：{@code @codemirror/lang-sql} 语法高亮 + 关键字/表/字段补全；</li>
 *   <li>flux / cypher / redis / mongo：{@code StreamLanguage} 流式高亮 + 关键字补全
 *       （内置管道函数/查询关键字/命令/shell 方法，叠加调用方传入的 bucket、集合名等动态候选）；</li>
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
  /** 编辑器语言：sql（默认，表/字段补全）| flux | cypher | redis | mongo —— 查询统一走本组件 */
  language?: "sql" | "flux" | "cypher" | "redis" | "mongo";
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

/**
 * Redis 内置命令（高亮 + 补全共用，大写）。
 *
 * <p>覆盖核心命令与模块命令（JSON.*、TS.*、GEO*、FT.*），
 * 不含命令控制台后端拒绝的危险命令（FLUSHALL/SHUTDOWN 等）。</p>
 */
const REDIS_KEYWORDS = [
  "PING", "ECHO", "SELECT", "DBSIZE", "INFO", "CLIENT", "CONFIG", "COMMAND",
  "TIME", "LASTSAVE", "MEMORY", "TYPE", "KEYS", "SCAN", "EXISTS", "DEL", "UNLINK",
  "EXPIRE", "PEXPIRE", "EXPIREAT", "TTL", "PTTL", "PERSIST", "RENAME", "RENAMENX",
  "RANDOMKEY", "DUMP", "RESTORE", "OBJECT", "COPY",
  "GET", "SET", "SETNX", "GETSET", "GETDEL", "MGET", "MSET", "MSETNX", "APPEND",
  "STRLEN", "INCR", "DECR", "INCRBY", "DECRBY", "INCRBYFLOAT", "SETRANGE", "GETRANGE",
  "SETEX", "PSETEX", "GETBIT", "SETBIT", "BITCOUNT", "BITOP", "BITPOS", "LCS",
  "HSET", "HGET", "HMSET", "HMGET", "HGETALL", "HDEL", "HKEYS", "HVALS", "HLEN",
  "HEXISTS", "HSCAN", "HINCRBY", "HINCRBYFLOAT", "HSETNX", "HRANDFIELD", "HSTRLEN",
  "RPUSH", "LPUSH", "RPOP", "LPOP", "LLEN", "LRANGE", "LINDEX", "LSET", "LREM",
  "LINSERT", "LTRIM", "RPOPLPUSH", "LMOVE", "BLPOP", "BRPOP", "BLMOVE",
  "SADD", "SREM", "SMEMBERS", "SISMEMBER", "SMISMEMBER", "SCARD", "SPOP",
  "SRANDMEMBER", "SUNION", "SINTER", "SDIFF", "SSCAN", "SMOVE", "SUNIONSTORE",
  "SINTERSTORE", "SDIFFSTORE",
  "ZADD", "ZREM", "ZRANGE", "ZREVRANGE", "ZRANGEBYSCORE", "ZREVRANGEBYSCORE",
  "ZSCORE", "ZMSCORE", "ZCARD", "ZCOUNT", "ZRANK", "ZREVRANK", "ZINCRBY",
  "ZPOPMAX", "ZPOPMIN", "ZRANDMEMBER", "ZUNION", "ZINTER", "ZDIFF", "ZSCAN",
  "ZUNIONSTORE", "ZINTERSTORE", "ZMPOP", "BZPOPMAX", "BZPOPMIN",
  "XADD", "XLEN", "XRANGE", "XREVRANGE", "XREAD", "XREADGROUP", "XINFO", "XDEL",
  "XTRIM", "XGROUP", "XACK", "XCLAIM", "XAUTOCLAIM", "XPENDING",
  "GEOADD", "GEODIST", "GEOPOS", "GEOHASH", "GEORADIUS", "GEORADIUSBYMEMBER",
  "GEOSEARCH", "GEOSEARCHSTORE",
  "JSON.SET", "JSON.GET", "JSON.DEL", "JSON.TYPE", "JSON.NUMINCRBY", "JSON.NUMMULTBY",
  "JSON.ARRAPPEND", "JSON.ARRPOP", "JSON.ARRINDEX", "JSON.ARRINSERT", "JSON.ARRLEN",
  "JSON.ARRTRIM", "JSON.OBJKEYS", "JSON.OBJLEN", "JSON.STRAPPEND", "JSON.STRLEN",
  "JSON.RESP", "JSON.FORGET", "JSON.CLEAR", "JSON.TOGGLE", "JSON.DEBUG",
  "TS.CREATE", "TS.ADD", "TS.DEL", "TS.GET", "TS.RANGE", "TS.REVRANGE", "TS.INFO",
  "TS.ALTER", "TS.MRANGE", "TS.MGET", "TS.INCRBY", "TS.DECRBY", "TS.CREATERULE",
  "TS.DELETERULE", "TS.QUERYINDEX",
  "FT.CREATE", "FT.DROPINDEX", "FT.SEARCH", "FT.AGGREGATE", "FT.INFO", "FT.EXPLAIN",
  "FT.EXPLAINCLI", "FT.SUGADD", "FT.SUGGET", "FT.SUGDEL", "FT.SUGLEN", "FT.ALIASADD",
  "FT.ALIASDEL", "FT.ALIASUPDATE", "FT._LIST", "FT.SYNUPDATE", "FT.SYNDUMP",
  "VADD", "VCARD", "VDIM", "VEMB", "VGETATTR", "VINFO", "VISMEMBER",
  "VLINKS", "VRANDMEMBER", "VREM", "VSETATTR", "VSIM",
];

/**
 * MongoDB Shell 内置关键字（高亮 + 补全共用）。
 *
 * <p>口径与后端 {@code MongoShell} 的只读白名单一致：只列 shell 方法（db、
 * find/findOne/count/countDocuments/aggregate 与链式修饰符）、查询/更新运算符
 * 前缀与类型构造器。写方法（insert、update、delete、drop 等）刻意不入表，
 * 免得补全把后端会拒绝的语句推给用户。</p>
 */
const MONGO_KEYWORDS = [
  "db", "find", "findOne", "count", "countDocuments", "aggregate", "limit", "skip", "sort",
  "$eq", "$ne", "$gt", "$gte", "$lt", "$lte", "$in", "$nin", "$and", "$or", "$not", "$nor",
  "$exists", "$type", "$regex", "$mod", "$all", "$elemMatch", "$size", "$expr",
  "$sum", "$avg", "$min", "$max", "$first", "$last", "$push", "$addToSet", "$group",
  "$match", "$project", "$sort", "$limit", "$skip", "$unwind", "$lookup", "$group",
  "$addFields", "$set", "$unset", "$replaceRoot", "$replaceWith", "$facet", "$count",
  "$sortByCount", "$bucket", "$graphLookup", "$sample", "$mergeObjects", "$dateToString",
  "$year", "$month", "$dayOfMonth", "$concat", "$substr", "$toUpper", "$toLower", "$split",
  "ObjectId", "ISODate", "NumberLong", "NumberInt", "NumberDecimal", "UUID", "BinData",
  "null", "true", "false",
];

const FLUX_SET = new Set(FLUX_KEYWORDS);
const CYPHER_SET = new Set(CYPHER_KEYWORDS);
const REDIS_SET = new Set(REDIS_KEYWORDS);
const MONGO_SET = new Set(MONGO_KEYWORDS);

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

/**
 * 轻量 Redis 流式解析器：命令关键字（含 JSON.*、TS.*、GEO*、FT.* 等模块命令）高亮，
 * 覆盖引号字符串/数字。Redis 无注释语法，不处理注释。
 */
const redisStreamParser: StreamParser<object> = {
  startState: () => ({}),
  token(stream) {
    if (stream.eatSpace()) return null;
    if (stream.match(/^"(?:[^"\\]|\\.)*"/) || stream.match(/^'(?:[^'\\]|\\.)*'/)) return "string";
    if (stream.match(/^-?\d+(\.\d+)?([eE][+-]?\d+)?/)) return "number";
    if (stream.match(/^[A-Za-z_][A-Za-z0-9_.]*/)) {
      return REDIS_SET.has(stream.current().toUpperCase()) ? "keyword" : "variableName";
    }
    stream.next();
    return "operator";
  },
  languageData: {},
};

/**
 * 轻量 Mongo Shell 流式解析器：shell 方法与链式修饰符高亮，{@code ObjectId}/{@code ISODate}
 * 等构造器与 {@code $-}运算符按原子处理，覆盖注释/字符串/数字。
 *
 * <p>大小写敏感：Mongo Shell 的方法名（{@code findOne}、{@code countDocuments}）
 * 与 {@code $-}运算符都区分大小写，与真实 shell 行为一致。</p>
 */
const mongoStreamParser: StreamParser<object> = {
  startState: () => ({}),
  token(stream) {
    if (stream.eatSpace()) return null;
    if (stream.match("//")) {
      stream.skipToEnd();
      return "comment";
    }
    if (stream.match(/^"(?:[^"\\]|\\.)*"/) || stream.match(/^'(?:[^'\\]|\\.)*'/)) return "string";
    if (stream.match(/^-?\d+(\.\d+)?([eE][+-]?\d+)?/)) return "number";
    if (stream.match(/^\$[A-Za-z]+/)) return "atom";
    if (stream.match(/^[A-Za-z_$][A-Za-z0-9_$]*/)) {
      return MONGO_SET.has(stream.current()) ? "keyword" : "variableName";
    }
    stream.next();
    return "operator";
  },
  languageData: { commentTokens: { line: "//" } },
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

/** 按语言组装语言扩展：sql 走 lang-sql（含 schema 补全），flux/cypher/redis/mongo 走流式解析器 + 关键字补全 */
function buildLanguageExt(): Extension {
  const lang = props.language ?? "sql";
  if (lang === "flux" || lang === "cypher" || lang === "redis" || lang === "mongo") {
    const parser = lang === "flux"
      ? fluxStreamParser
      : lang === "cypher"
        ? cypherStreamParser
        : lang === "redis"
          ? redisStreamParser
          : mongoStreamParser;
    // 补全源必须随**语言本身**提供：StreamLanguage 会用自己的 languageData 覆盖
    // 另挂在顶层的 EditorState.languageData.of(...)，autocompletion() 因此取不到源，
    // 表现为「输入任何内容都不弹提示」（实测 DOM 里连 .cm-tooltip 都没有，
    // 连内置关键字 fi 也弹不出）。
    const parserWithAc = {
      ...parser,
      languageData: { ...(parser.languageData ?? {}), autocomplete: keywordCompleter() },
    };
    return [
      StreamLanguage.define(parserWithAc),
    ];
  }
  return sql({ schema: buildSchema(), upperCaseKeywords: false });
}

/** flux/cypher/redis/mongo 的补全源：内置关键字/命令 ∪ 调用方传入的动态候选（bucket、集合名等） */
function keywordCompleter() {
  const lang = props.language ?? "sql";
  const base = lang === "flux"
    ? FLUX_KEYWORDS
    : lang === "cypher"
      ? CYPHER_KEYWORDS
      : lang === "redis"
        ? REDIS_KEYWORDS
        : lang === "mongo"
          ? MONGO_KEYWORDS
          : [];
  return (context: CompletionContext) => {
    // 光标前的 token 要按「点分路径的最后一段」取，而不是整段 db.xxx_or：
    // Mongo Shell 里写的是 db.<集合>.find()，用户在 db.ngxacc_o 后面继续输入时，
    // 若拿整段（含 db. 前缀）去匹配集合名，候选一个都命中不了，补全就永远弹不出来。
    // 同理不能只取 \w+（会拿到 or），要取到路径最后一段的起点。
    const word = context.matchBefore(/[A-Za-z_$][\w$]*$/);
    if (!word || (word.from === word.to && !context.explicit)) return null;
    const typed = context.state.sliceDoc(word.from, word.to).toLowerCase();
    const baseSet = new Set(base);
    const seen = new Set<string>();
    const options: { label: string; type: string }[] = [];
    for (const w of [...base, ...(props.keywords ?? [])]) {
      if (!w || seen.has(w)) continue;
      // 只有以已输入片段开头的候选才有意义，否则 CodeMirror 会把它们全过滤掉、
      // 表现为「补全完全弹不出来」
      if (typed && !w.toLowerCase().startsWith(typed)) continue;
      seen.add(w);
      options.push({ label: w, type: baseSet.has(w) ? "keyword" : "variable" });
    }
    if (options.length === 0) return null;
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
  if (lang === "redis") {
    return "输入 Redis 命令，例如：HGETALL mykey / JSON.GET doc:1（Ctrl+Enter 执行）";
  }
  if (lang === "mongo") {
    return "输入 Mongo Shell 查询，例如：db.orders.find({status: \"PAID\"}).limit(20)（Ctrl+Enter 执行）";
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

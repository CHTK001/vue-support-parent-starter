<script setup lang="ts">
/**
 * SQL 编辑器（CodeMirror 6 三方组件封装）
 *
 * <p>能力全部由三方组件提供：
 * <ul>
 *   <li>{@code @codemirror/lang-sql}：SQL 语法高亮 + 关键字/表/字段补全；</li>
 *   <li>{@code @codemirror/autocomplete}：补全下拉（输入即弹、Enter/Tab 采纳）；</li>
 *   <li>{@code @codemirror/commands}：历史/默认按键；额外绑定 Ctrl+Enter 执行。</li>
 * </ul>
 * 表结构按需解析：文档中出现 FROM/JOIN/UPDATE/INTO 的表名时，经 {@code columnResolver}
 * 拉取字段并动态 reconfigure schema，实现「表名 + 字段」智能提示。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView, keymap, placeholder as cmPlaceholder } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { autocompletion, completionKeymap } from "@codemirror/autocomplete";
import { sql } from "@codemirror/lang-sql";
import { defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language";

const props = defineProps<{
  /** SQL 文本（v-model） */
  modelValue: string;
  /** 当前库表名（补全候选） */
  tables?: string[];
  /** 表字段解析器（按需拉取并缓存） */
  columnResolver?: (table: string) => Promise<string[]>;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "execute"): void;
}>();

const host = ref<HTMLDivElement>();
const view = shallowRef<EditorView>();

/** SQL 语言支持独立舱：schema 变化时原地 reconfigure，不重建编辑器 */
const schemaCompartment = new Compartment();
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

/** 重配 SQL 扩展（含 schema 补全） */
function reconfigureSql(): void {
  view.value?.dispatch({
    effects: schemaCompartment.reconfigure(sql({ schema: buildSchema(), upperCaseKeywords: false })),
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
  if (changed) reconfigureSql();
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
      schemaCompartment.of(sql({ schema: buildSchema(), upperCaseKeywords: false })),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      cmPlaceholder("输入 SQL 语句，输入即提示表/字段/关键字（Ctrl+Enter 执行）"),
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
          fontFamily: "var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace)",
          lineHeight: "1.6",
        },
        ".cm-content": { padding: "12px 14px", minHeight: "180px", color: "var(--el-text-color-primary)" },
        ".cm-gutters": {
          backgroundColor: "transparent",
          border: "none",
          color: "var(--el-text-color-placeholder)",
        },
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
  () => reconfigureSql(),
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

<!--
  抽取字段编辑器（仅 extract 节点，meta.fieldEditor=true 时出现）。

  对应 CollectExtractFieldDTO：name/parserType/expression/attribute/attrName/group/defaultValue。
  attribute 只在 CSS/JSON 解析下有意义，group 只在 REGEX 下有意义，按此收敛表单项。
  2026-09-29：parserType 增补 JSONPATH / XPATH（后端 CollectExtractExecutor 已支持）。
  XPATH 也收敛掉「取值方式」—— 属性要写在 XPath 表达式里（如 //a/@href），右侧那一列对它无效。
-->
<script setup lang="ts">
import { computed, ref } from "vue";
import ReButton from "@repo/ui/re-button";
import ReElementPicker from "@repo/ui/re-element-picker";
import ReInput from "@repo/ui/re-input";
import ReInputNumber from "@repo/ui/re-input-number";
import RePlaceholderPicker from "@repo/ui/re-placeholder-picker";
import ReSelect from "@repo/ui/re-select";
import type { CollectExtractField } from "../types/collect";
// 预览抓取载荷用 paramContext 的 PreviewPayload，而不是 api 层的
// CollectPreviewPayload：后者是「接口返回什么」，前者是「元素拾取器能吃什么」。
// 两个层次曾各写一份，导致本组件与 extractForm 对同一个 loadPreview 给出互不兼容的
// 签名，vue-tsc 报 TS2322（两类型互不赋值）。详见 paramContext.ts 的说明。
import type { PlaceholderGroup, PreviewPayload } from "./nodes/paramContext";

const props = defineProps<{
  modelValue: CollectExtractField[];
  /** 预览抓取的预填地址（一般是上游抓取节点的 URL）；不给则「选取」入口不出现 */
  previewUrl?: string;
  /** 预览抓取的加载器；不给则「选取」入口不出现（组件自身不发 HTTP） */
  loadPreview?: (url: string) => Promise<PreviewPayload>;
  /**
   * 可用于插入的占位字段分组（上游节点出参、全局变量、函数等）。
   *
   * <p>抽取表达式正是最需要它的地方：用户看到的往往是 {@code ${projects}} 这种
   * 上游约定的变量名，没有入口就只能靠猜或者去翻上一个节点。留空则不显示插入入口。</p>
   */
  placeholderGroups?: PlaceholderGroup[];
}>();
const emit = defineEmits<{ (event: "update:modelValue", value: CollectExtractField[]): void }>();

/** 正在拾取的字段下标；null 表示弹窗关闭 */
const pickingIndex = ref<number | null>(null);

/**
 * 该行能否用元素拾取器。
 *
 * <p>只有 CSS / XPATH 两种解析器的值是「页面里的定位表达式」，拾取器生成的就是它们；
 * 正则、JSON 路径、纯文本都没有对应的 DOM 元素，给按钮只会误导。</p>
 *
 * @param field 字段行
 * @returns 可用时返回 true
 */
function canPick(field: CollectExtractField): boolean {
  if (!props.loadPreview) {
    return false;
  }
  const type = (field.parserType || "CSS").toUpperCase();
  return type === "CSS" || type === "XPATH";
}

/**
 * 把拾取结果写回该行：表达式与解析器类型一起改。
 *
 * <p>一起改是刻意的 —— 拾取器给出的是 CSS 还是 XPath，用户从界面上是看不出来的，
 * 只回填表达式而不改类型，会让「用 XPath 插入」的路径被当成 CSS 去解析。</p>
 *
 * @param payload 拾取结果
 */
function applyPicked(payload: { expression: string; parserType: string }): void {
  const index = pickingIndex.value;
  if (index == null) {
    return;
  }
  patch(index, { expression: payload.expression, parserType: payload.parserType });
  pickingIndex.value = null;
}

/**
 * 把占位字段追加到该行的表达式末尾。
 *
 * <p>追加而不是替换：表达式常常是「已有一段」再补一个变量（如 {@code ${prefix}-${id}}），
 * 覆盖会把用户正在写的内容弄丢。与 ParamField 的插入行为保持一致。</p>
 *
 * @param index 字段行下标
 * @param value 形如 ${name} 的占位串
 */
function appendToExpression(index: number, value: string): void {
  const current = fields.value[index]?.expression ?? "";
  patch(index, { expression: `${current}${value}` });
}

const PARSER_TYPES = ["CSS", "REGEX", "JSON", "JSONPATH", "XPATH", "TEXT", "HTML"].map(item => ({ value: item, label: item }));
const PARSER_HINTS: Record<string, string> = {
  CSS: "按 CSS 选择器命中元素，再取右侧的文本 / 属性 / HTML",
  REGEX: "正则匹配标记文本（元素取 outerHTML、纯文本取原文、响应取 JSON），不是页面可见文本",
  JSON: "按 JSON 路径取值，如 data.items[0].title",
  // 切片示例的左方括号写成 \x5b 而不是真的方括号，原因如下（注意：本注释自身
  // 也不能出现「方括号 + 冒号 + 数字 + 花括号」的连续字面量，见下）：
  // 应用的 UnoCSS 开了 presetAttributify，它的 group 语法本身就是「[属性]{声明}」，
  // 而提取器是对源文件原始文本做正则、**连注释一起扫**。于是说明文字里若出现
  // 「方括号 0:2」这种连续片段，会被当成一条 group 规则，生成出「类名 + 声明 0:2」
  // 的非法 CSS。开发模式不压缩 CSS，看不出来；一旦 pnpm build 走到 lightningcss
  // 压缩这步就整包失败，报 [lightningcss minify] Unexpected token Semicolon
  // （2026-09-29 实测，system-starter 与其它应用同时中招）。
  // \x5b 在运行时就是左方括号，界面显示与改之前逐字节相同，只有源码字面量变了。
  JSONPATH: "同 JSON，JSONPATH 只是显式写法（都走同一套点号路径）。支持 $.a.b / a.b[0] / a.b[0][1]；不支持通配 [*]、递归下降 ..、过滤器 [?(...)]、切片 \x5b0:2]",
  XPATH: "按 XPath 取字符串，如 //a/@href、//h1/text()。属性请写在表达式里，右侧「取值方式」对它无效",
  TEXT: "取来源可见文本；来源是纯文本且不含标记时原样返回",
  HTML: "取来源标记文本",
};
const ATTRIBUTES = [
  { value: "text", label: "文本 text" },
  { value: "attr", label: "属性 attr" },
  { value: "html", label: "内层 HTML" },
  { value: "outer", label: "外层 HTML" },
];

const fields = computed(() => props.modelValue ?? []);

function patch(index: number, changes: Partial<CollectExtractField>): void {
  emit(
    "update:modelValue",
    fields.value.map((field, i) => (i === index ? { ...field, ...changes } : field)),
  );
}

function remove(index: number): void {
  emit(
    "update:modelValue",
    fields.value.filter((_, i) => i !== index),
  );
}

function addField(): void {
  emit("update:modelValue", [
    ...fields.value,
    { name: "", parserType: "CSS", expression: "", attribute: "text", attrName: "", group: 1, defaultValue: "" },
  ]);
}
</script>

<template>
  <div class="collect-fields">
    <div v-for="(field, index) in fields" :key="index" class="collect-field-card">
      <div class="card-head">
        <ReInput

          placeholder="字段名"
          :model-value="field.name"
          @update:model-value="(value: unknown) => patch(index, { name: String(value ?? '') })"
        />
        <ReSelect

          class="head-parser"
          :model-value="field.parserType || 'CSS'"
          :options="PARSER_TYPES"
          @update:model-value="(value: string | number | (string | number)[] | null) => patch(index, { parserType: String(value ?? 'CSS') })"
        />
        <ReButton text type="danger" icon="Delete" @click="remove(index)">删</ReButton>
      </div>
      <div class="expr-row">
        <ReInput

          placeholder="表达式：CSS 选择器 / 正则 / JSON 路径"
          :model-value="field.expression"
          @update:model-value="(value: unknown) => patch(index, { expression: String(value ?? '') })"
        />
        <!-- 占位插入入口放在写表达式的地方：上游节点出参、全局变量、函数都在这里可选，
             不用去猜 ${projects} 是哪个节点产出的 -->
        <RePlaceholderPicker
          v-if="(placeholderGroups?.length ?? 0) > 0"
          class="expr-picker"
          :groups="placeholderGroups"
          mode="icon"
          @pick="(value: string) => appendToExpression(index, value)"
        />
      </div>
      <div v-if="canPick(field)" class="card-pick">
        <ReButton text icon="Pointer" @click="pickingIndex = index">选取页面元素</ReButton>
      </div>
      <div v-if="PARSER_HINTS[field.parserType || 'CSS']" class="card-hint">
        {{ PARSER_HINTS[field.parserType || "CSS"] }}
      </div>
      <div class="card-row">
        <ReSelect
          v-if="field.parserType !== 'REGEX' && field.parserType !== 'XPATH'"

          class="head-attr"
          :model-value="field.attribute || 'text'"
          :options="ATTRIBUTES"
          @update:model-value="(value: string | number | (string | number)[] | null) => patch(index, { attribute: String(value ?? 'text') })"
        />
        <ReInput
          v-if="field.attribute === 'attr'"

          class="cell-grow"
          placeholder="属性名"
          :model-value="field.attrName"
          @update:model-value="(value: unknown) => patch(index, { attrName: String(value ?? '') })"
        />
        <ReInputNumber
          v-if="field.parserType === 'REGEX'"

          class="cell-group"
          :min="0"
          :controls="false"
          placeholder="组号"
          :model-value="field.group ?? 1"
          @update:model-value="(value: number | undefined) => patch(index, { group: Number(value ?? 1) })"
        />
        <ReInput

          class="cell-grow"
          placeholder="空值默认"
          :model-value="field.defaultValue"
          @update:model-value="(value: unknown) => patch(index, { defaultValue: String(value ?? '') })"
        />
      </div>
    </div>
    <ReButton plain icon="Plus" @click="addField">添加字段</ReButton>
  </div>

  <!--
    元素拾取器：url 预填上游抓取节点的地址，用户可在弹窗里改；
    loader 由宿主注入 —— 本组件与拾取器都不直接发 HTTP。
  -->
  <ReElementPicker
    v-if="pickingIndex != null && loadPreview"
    :visible="true"
    :url="previewUrl || ''"
    :parser-type="fields[pickingIndex]?.parserType || 'CSS'"
    :loader="loadPreview"
    @update:visible="(v: boolean) => { if (!v) pickingIndex = null; }"
    @pick="applyPicked"
  />
</template>

<style scoped>
.collect-field-card {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 7px 8px;
  margin-bottom: 6px;
  /* 原为写死的 #fbfcfe → #f6f8fb 亮色渐变，暗色模式下会是刺眼白块；
     改用「页面底色 → 更浅一档填充色」令牌渐变，保留原有的微渐变质感又能跟随主题 */
  background: linear-gradient(180deg, var(--el-bg-color), var(--el-fill-color-lighter));
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  transition:
    border-color var(--el-transition-duration-fast, 0.2s) ease,
    box-shadow var(--el-transition-duration-fast, 0.2s) ease;
}

/* 允许的两处投影之一：悬浮抬升反馈；静止态不加投影，边界由边框承载 */
.collect-field-card:hover {
  border-color: var(--el-color-primary-light-7);
  box-shadow: var(--el-box-shadow-light);
}

.card-head,
.card-row {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* 表达式行：输入框占满，右侧留出占位插入图标 */
.expr-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.expr-row > :first-child {
  flex: 1;
  min-width: 0;
}

.expr-picker {
  flex: none;
}

.head-parser {
  flex: 0 0 96px;
}

.card-hint {
  font-size: 11px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.head-attr {
  flex: 0 0 112px;
}

.cell-group {
  flex: 0 0 78px;
}

.cell-grow {
  flex: 1 1 auto;
  min-width: 0;
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .collect-field-card {
    transition: none;
  }
}
</style>

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

/**
 * 下拉里提供的解析器类型。
 *
 * <p>只保留采集实际在用的四种：CSS（页面元素）、XPATH（页面/XML）、JSONPATH（接口 JSON）、
 * REGEX（正则）。JSON 与 JSONPATH 在后端是同一套点号路径（JSONPATH 只是显式写法），
 * TEXT / HTML 属于「整页文本/标记」的小众取法，需求上已明确去掉，避免下拉里塞七项让人挑不动。</p>
 *
 * <p><b>后端仍支持被移除的类型</b>，且存量流程里若有 JSON/TEXT/HTML，下面的 optionsOf 会把
 * 当前值补成一项（禁用）显示出来 —— 否则下拉会渲染成空，用户以为类型丢了而误改。</p>
 */
const PARSER_TYPES = ["CSS", "XPATH", "JSONPATH", "REGEX"].map(item => ({ value: item, label: item }));
const PARSER_HINTS: Record<string, string> = {
  CSS: "按 CSS 选择器命中元素，再取右侧的文本 / 属性 / HTML",
  REGEX: "正则匹配标记文本（元素取 outerHTML、纯文本取原文、响应取 JSON），不是页面可见文本",
  JSON: "按 JSON 路径取值，如 data.items[0].title；建议改用 JSONPATH（同一套点号路径，写法更明确）",
  // 切片示例的左方括号写成 \x5b 而不是真的方括号，原因如下（注意：本注释自身
  // 也不能出现「方括号 + 冒号 + 数字 + 花括号」的连续字面量，见下）：
  // 应用的 UnoCSS 开了 presetAttributify，它的 group 语法本身就是「[属性]{声明}」，
  // 而提取器是对源文件原始文本做正则、**连注释一起扫**。于是说明文字里若出现
  // 「方括号 0:2」这种连续片段，会被当成一条 group 规则，生成出「类名 + 声明 0:2」
  // 的非法 CSS。开发模式不压缩 CSS，看不出来；一旦 pnpm build 走到 lightningcss
  // 压缩这步就整包失败，报 [lightningcss minify] Unexpected token Semicolon
  // （2026-09-29 实测，system-starter 与其它应用同时中招）。
  // \x5b 在运行时就是左方括号，界面显示与改之前逐字节相同，只有源码字面量变了。
  JSONPATH: "按 JSON 点号路径取值（与 JSON 同一套）。支持 $.a.b / a.b[0]；不支持通配 [*]、递归下降 ..、过滤器 [?(...)]、切片 \x5b0:2]",
  XPATH: "按 XPath 取字符串，如 //a/@href、//h1/text()。属性请写在表达式里，右侧「取值方式」对它无效",
  TEXT: "取来源可见文本；来源是纯文本且不含标记时原样返回（已从下拉移除，存量字段照常运行）",
  HTML: "取来源标记文本（已从下拉移除，存量字段照常运行）",
};

/**
 * 该行解析器下拉的选项：标准类型 + 当前值（若已不在标准清单里则补一项并禁用）。
 *
 * <p>与字段映射里「失效列以禁用项显示」是同一套思路：只读展示原值，不允许再选回去，
 * 更不允许因为选不到而渲染成空。</p>
 *
 * @param current 该行当前的 parserType
 * @returns 供下拉使用的选项列表
 */
function optionsOf(current: string): { value: string; label: string; disabled?: boolean }[] {
  const type = String(current || "").toUpperCase();
  if (!type || PARSER_TYPES.some(item => item.value === type)) {
    return PARSER_TYPES;
  }
  return [...PARSER_TYPES, { value: type, label: `${type}（旧类型）`, disabled: true }];
}
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
    <!--
      列头：与每张卡片共用同一套列宽，让「字段名 / 解析器 / 表达式 / 取值方式 / 空值默认」
      上下对齐。窄面板（属性面板内联渲染本组件时）由容器查询隐藏，改在各单元格显示小标签。
    -->
    <div v-if="fields.length" class="collect-field-head">
      <span>字段名</span>
      <span>解析器</span>
      <span>表达式</span>
      <span>取值方式</span>
      <span>空值默认</span>
      <span class="head-ops">操作</span>
    </div>

    <div v-for="(field, index) in fields" :key="index" class="collect-field-card">
      <div class="cell cell-name" data-label="字段名">
        <ReInput
          placeholder="字段名"
          :model-value="field.name"
          @update:model-value="(value: unknown) => patch(index, { name: String(value ?? '') })"
        />
      </div>

      <div class="cell cell-parser" data-label="解析器">
        <ReSelect
          class="cell-fill"
          :model-value="field.parserType || 'CSS'"
          :options="optionsOf(field.parserType || 'CSS')"
          @update:model-value="(value: string | number | (string | number)[] | null) => patch(index, { parserType: String(value ?? 'CSS') })"
        />
      </div>

      <div class="cell cell-expr" data-label="表达式">
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
      </div>

      <div class="cell cell-attr" data-label="取值方式">
        <!-- CSS / JSON / TEXT / HTML：取文本、属性还是 HTML -->
        <ReSelect
          v-if="field.parserType !== 'REGEX' && field.parserType !== 'XPATH'"
          class="cell-fill"
          :model-value="field.attribute || 'text'"
          :options="ATTRIBUTES"
          @update:model-value="(value: string | number | (string | number)[] | null) => patch(index, { attribute: String(value ?? 'text') })"
        />
        <!-- REGEX：正则捕获组序号（0 表示整个匹配） -->
        <ReInputNumber
          v-if="field.parserType === 'REGEX'"
          class="cell-fill"
          :min="0"
          :controls="false"
          placeholder="组号"
          :model-value="field.group ?? 1"
          @update:model-value="(value: number | undefined) => patch(index, { group: Number(value ?? 1) })"
        />
        <!-- 只有选了「属性 attr」才有属性名 -->
        <ReInput
          v-if="field.attribute === 'attr'"
          class="cell-fill"
          placeholder="属性名，如 href"
          :model-value="field.attrName"
          @update:model-value="(value: unknown) => patch(index, { attrName: String(value ?? '') })"
        />
        <!-- XPATH：属性要写在表达式里，这一列对它无效 -->
        <span
          v-if="field.parserType === 'XPATH'"
          class="cell-note"
          title="XPath 的属性请写在表达式里，如 //a/@href"
        >见表达式</span>
      </div>

      <div class="cell cell-default" data-label="空值默认">
        <ReInput
          placeholder="空值默认"
          :model-value="field.defaultValue"
          @update:model-value="(value: unknown) => patch(index, { defaultValue: String(value ?? '') })"
        />
      </div>

      <div class="cell cell-ops" data-label="操作">
        <ReButton
          v-if="canPick(field)"
          text
          icon="Pointer"
          @click="pickingIndex = index"
        >选取页面元素</ReButton>
        <ReButton
          text
          type="danger"
          icon="Delete"
          :show-text="false"
          :icon-size="28"
          tip="删除这个字段"
          @click="remove(index)"
        />
      </div>

      <div v-if="PARSER_HINTS[field.parserType || 'CSS']" class="cell cell-hint">
        {{ PARSER_HINTS[field.parserType || "CSS"] }}
      </div>
    </div>

    <!-- 空态：给出下一步动作，而不是只写「暂无数据」 -->
    <div v-if="!fields.length" class="collect-empty">
      <div class="collect-empty-title">还没有抽取字段</div>
      <div class="collect-empty-tip">
        点下面的「添加字段」新建一行；把该行解析器设为 CSS 后，可点「选取页面元素」从页面上直接点选要抽取的内容。
        例：字段名 title、表达式 h1.title、取值方式 文本 text。
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
/* 字段表整体：字段之间统一 8px 竖向节奏（契约 §2 间距阶梯） */
.collect-fields {
  display: flex;
  flex-direction: column;
  gap: 8px;
  /* 建立容器查询上下文：窄面板（属性面板内联渲染 FieldTable 时）下换行折叠 */
  container-type: inline-size;
}

/* 列头与卡片共用同一套列宽 —— 这是「每行控件上下对齐」的关键。
   两处模板一旦拆分必须同步修改列定义，否则列会错位。 */
.collect-field-head,
.collect-field-card {
  display: grid;
  grid-template-columns: minmax(96px, 1fr) 122px minmax(160px, 1.6fr) 104px 100px 176px;
  gap: 8px;
  align-items: start;
}

.collect-field-head {
  padding: 0 10px;
}

.collect-field-head > span {
  font-size: 11px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}

.collect-field-head .head-ops {
  text-align: right;
}

.collect-field-card {
  padding: 10px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  /* 只过渡会变的属性：hover 仅改边框 / 底色，不加装饰投影（契约 §2） */
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.collect-field-card:hover {
  border-color: var(--el-color-primary-light-7);
  background: var(--el-fill-color-light);
}

.cell {
  min-width: 0;
}

/* 表达式行：输入框占满，右侧留出占位插入图标 */
.expr-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ReInput 根节点是 display:contents，宽度必须落在内层 el-input 上 */
.expr-row :deep(.el-input) {
  flex: 1 1 auto;
  min-width: 0;
}

.expr-picker {
  flex: none;
}

/* 取值方式：不同解析器控件不同，纵向排布，不破坏与其它列的横向对齐 */
.cell-attr {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cell-fill {
  width: 100%;
}

.cell-note {
  font-size: 11px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}

/* 操作列：选取页面元素 + 删除，统一右对齐 */
.cell-ops {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}

/* 解析器说明：整行铺开，用来解释「这一列怎么填」 */
.cell-hint {
  grid-column: 1 / -1;
  font-size: 11px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}

/* 空态：给出下一步动作，而不是只写「暂无数据」 */
.collect-empty {
  padding: 16px;
  text-align: center;
  background: var(--el-fill-color-lighter);
  border: 1px dashed var(--el-border-color);
  border-radius: var(--el-radius-md, 8px);
}

.collect-empty-title {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.collect-empty-tip {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}

/* 窄面板：隐藏列头（宽度放不下），卡片叠成两列，并逐格补出小标签 */
@container (max-width: 820px) {
  .collect-field-head {
    display: none;
  }

  .collect-field-card {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }

  .cell-name {
    grid-column: 1 / 2;
  }

  .cell-parser {
    grid-column: 2 / 3;
  }

  .cell-expr {
    grid-column: 1 / -1;
  }

  .cell-attr {
    grid-column: 1 / 2;
  }

  .cell-default {
    grid-column: 2 / 3;
  }

  .cell-ops {
    grid-column: 1 / -1;
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  .cell-ops::before {
    flex: 0 0 100%;
  }

  .cell-hint {
    grid-column: 1 / -1;
  }

  .cell::before {
    display: block;
    margin-bottom: 3px;
    font-size: 11px;
    line-height: 1.45;
    color: var(--el-text-color-secondary);
    content: attr(data-label);
  }

  .cell-hint::before {
    display: none;
  }
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .collect-field-card {
    transition: none;
  }
}
</style>

<!--
  抓取节点表单（Postman 风格）：请求方法 + URL 置顶，其余参数分组，高级项默认折叠。

  分组与顺序：
  1. 第一行：请求方法（窄）+ URL（宽）+ 响应预览按钮，用边框与底色强调为整张表单的主入口；
  2. 「请求头 / Cookie」：header:名称、cookie:名称，两个 pairs 控件必须同组相邻；
  3. 「请求体」：body（textarea，整行）与 contentType；
  4. 「高级」：超时 / 重试 / 代理 / 抓取器 / 出参变量等低频项，默认收起；
  5. 「循环」与「其它」：paramContext 追加的循环四参数与后端后续新增项，兜底渲染避免漏项。

  参数名是前后端契约，一个都不能改；分组只改展示位置，写回仍走 set-param / set-pairs。
-->
<script setup lang="ts">
import { computed, ref } from "vue";
import { ElDialog } from "element-plus";
import ReButton from "@repo/ui/re-button";
import ParamField from "./ParamField.vue";
import { LOOP_PARAM_NAMES, useShapeFieldList } from "./paramContext";
import type { NodeForm, NodeFormContext, PreviewPayload } from "./paramContext";
import type { ParamPair } from "../../utils/dsl";
import type { CollectParamMeta, CollectShapeMeta } from "../../types/collect";

const props = defineProps<{
  /** 当前节点的表单镜像 */
  node: NodeForm;
  /** 该 shape 的参数元数据 */
  meta: CollectShapeMeta;
  /** 表单共享上下文 */
  ctx: NodeFormContext;
}>();

const emit = defineEmits<{
  (e: "set-param", param: CollectParamMeta, value: unknown): void;
  (e: "set-pairs", param: CollectParamMeta, pairs: ParamPair[]): void;
}>();

/** 抓取节点专属参数，按后端 meta 的下发顺序排列（url 置顶） */
const { fields, valueOf, pairsOfParam } = useShapeFieldList(
  () => props.node,
  () => props.meta,
  [
    "url",
    "method",
    "body",
    "contentType",
    "timeout",
    "retry",
    "retryInterval",
    "proxy",
    "userAgent",
    "fetcher",
    "outputVariable",
    "saveDocument",
    "header:名称",
    "cookie:名称",
  ],
);

/** 第一行固定「方法在前、URL 在后」，与 names 的取值顺序无关，只决定这一行的左右排布 */
const PRIMARY_NAMES = ["method", "url"];
/** 请求头 / Cookie 组：两个 pairs 参数必须同组相邻 */
const HEADER_NAMES = ["header:名称", "cookie:名称"];
/** 请求体组 */
const BODY_NAMES = ["body", "contentType"];
/** 高级组：低频配置，默认折叠。
 *
 * <p>多收了 saveDocument（保留文档对象）——后端在 meta 里确实下发了这个参数，
 * 任务给的高级清单里没列它，但它是关闭后会影响下游 CSS 抽取的行为开关，语义上属高级，
 * 并入本组而不是另起一组。</p>
 *
 * <p>「出参变量名」在本节点实际上只有一个候选（resp），常显一个单选项没有意义 ——
 * 与数据库节点的数据源同一处理：只在候选多于一个时才显示。</p>
 */
const ADVANCED_NAMES = [
  "timeout",
  "retry",
  "retryInterval",
  "proxy",
  "userAgent",
  "fetcher",
  "outputVariable",
  "saveDocument",
];

/** 出参变量名是否只有一个候选（后端 meta 的 options 只有一个值） */
const outputVarIsSingleOption = computed(() => {
  const meta = (props.meta.params ?? []).find(item => item.name === "outputVariable");
  return (meta?.options?.length ?? 0) <= 1;
});

/**
 * 按给定顺序取参数，缺项自动跳过。
 *
 * <p>只用于第一行这种「左右位置有语义」的场景（方法必须在左、URL 必须在右），
 * 其余分组一律用 fieldsBySet 沿用 paramContext 的必填前置顺序。</p>
 *
 * @param names 期望的展示顺序
 * @returns 按该顺序过滤后的参数元数据
 */
function fieldsByOrder(names: string[]): CollectParamMeta[] {
  const byName = new Map(fields.value.map((param) => [param.name, param] as const));
  return names
    .map((name) => byName.get(name))
    .filter((param): param is CollectParamMeta => Boolean(param));
}

/**
 * 按名字集合取参数，顺序沿用 paramContext 排好的 fields。
 *
 * @param names 允许出现的参数名集合
 * @returns 集合内的参数元数据（保持 fields 顺序）
 */
function fieldsBySet(names: string[]): CollectParamMeta[] {
  const wanted = new Set(names);
  return fields.value.filter((param) => wanted.has(param.name));
}

const primaryFields = computed(() => fieldsByOrder(PRIMARY_NAMES));
const headerFields = computed(() => fieldsBySet(HEADER_NAMES));
const bodyFields = computed(() => fieldsBySet(BODY_NAMES));
const advancedFields = computed(() =>
  fieldsBySet(ADVANCED_NAMES).filter(
    param => !(param.name === "outputVariable" && outputVarIsSingleOption.value),
  ),
);
/** 循环四参数由 paramContext 统一追加，单独成组 */
const loopFields = computed(() => fieldsBySet(LOOP_PARAM_NAMES));
/** 兜底组：不属于上面任何分组的后端新增参数，避免后端加了参数前端却不显示 */
const otherFields = computed(() => {
  const used = new Set([
    ...PRIMARY_NAMES,
    ...HEADER_NAMES,
    ...BODY_NAMES,
    ...ADVANCED_NAMES,
    ...LOOP_PARAM_NAMES,
  ]);
  return fields.value.filter((param) => !used.has(param.name));
});

/** 高级分组展开态：false=折叠 */
const advancedOpen = ref(false);

/* --------------------------------- 响应预览 -------------------------------- */

/** 预览弹框开关、加载态与结果 / 错误，三者互斥展示 */
const previewOpen = ref(false);
const previewLoading = ref(false);
const previewError = ref("");
const previewResult = ref<PreviewPayload | null>(null);

/** 当前 URL：用 computed 包住 valueOf，节点参数一变按钮禁用态立即跟着更新 */
const urlValue = computed(() => valueOf("url"));
/** URL 含 ${} 占位时设计期解析不出真实地址，预览没有意义 */
const urlHasPlaceholder = computed(() => urlValue.value.includes("${"));
/** 无 URL 或含占位时禁用预览按钮 */
const previewDisabled = computed(() => !urlValue.value.trim() || urlHasPlaceholder.value);

/** 正文最多渲染的行数，避免超长页面把弹框撑成无底洞 */
const PREVIEW_MAX_LINES = 20;
const previewLines = computed(() => (previewResult.value?.html ?? "").split(/\r?\n/));
const previewText = computed(() => previewLines.value.slice(0, PREVIEW_MAX_LINES).join("\n"));
const previewTruncated = computed(() => previewLines.value.length > PREVIEW_MAX_LINES);

/**
 * 拉取并展示预览：先开弹框显示加载态，成功填结果、失败把可读原因留在弹框里。
 *
 * <p>失败不能静默——设计期最常见的失败就是 URL 写错或后端拒绝内网地址，
 * 把错误原文显示出来用户才知道下一步改什么。</p>
 */
async function openPreview(): Promise<void> {
  const loader = props.ctx.loadPreview;
  const target = urlValue.value.trim();
  if (!loader || !target || urlHasPlaceholder.value) {
    return;
  }
  previewOpen.value = true;
  previewLoading.value = true;
  previewError.value = "";
  previewResult.value = null;
  try {
    previewResult.value = await loader(target);
  } catch (error) {
    previewError.value = error instanceof Error ? error.message : String(error);
  } finally {
    previewLoading.value = false;
  }
}

/**
 * 状态码着色：2xx 按成功，其余（含 3xx / 4xx / 5xx）按异常提示。
 *
 * @param status HTTP 状态码
 * @returns 对应的样式类名
 */
function statusClass(status: number): string {
  return status >= 200 && status < 300 ? "status-ok" : "status-bad";
}
</script>

<template>
  <div class="request-form">
    <div class="node-intro">
      抓取节点：按 URL 取回页面或接口响应，交给下游节点解析。下面先填请求方法与地址，
      需要时点「预览响应」看服务端实际取到什么；请求头、请求体、超时重试等都在对应分组里。
    </div>
    <!-- 第一行：方法 + URL + 预览，置顶并用边框 / 底色强调为整张表单的主入口 -->
    <div class="request-primary">
      <ParamField
        v-for="param in primaryFields"
        :key="param.name"
        :class="`primary-${param.name}`"
        :param="param"
        :value="valueOf(param.name)"
        :pairs="pairsOfParam(param.name)"
        :node-id="node.id"
        :ctx="ctx"
        @update="(value: unknown) => emit('set-param', param, value)"
        @pairs="(value: ParamPair[]) => emit('set-pairs', param, value)"
      />
      <div v-if="ctx.loadPreview" class="field preview-cell">
        <div class="field-label">响应预览</div>
        <ReButton
          text
          type="primary"
          :disabled="previewDisabled"
          :loading="previewLoading"
          :aria-expanded="previewOpen ? 'true' : 'false'"
          @click="openPreview"
        >
          {{ previewLoading ? "正在预览…" : "预览响应" }}
        </ReButton>
        <div v-if="urlHasPlaceholder" class="field-tip">
          URL 含 ${变量}，设计期无法解析，运行期才能取到实际地址
        </div>
        <div v-else-if="!urlValue.trim()" class="field-tip">先填写 URL，再预览响应</div>
      </div>
    </div>

    <!-- 请求头 / Cookie：两个 pairs 控件同组相邻 -->
    <div v-if="headerFields.length" class="request-group">
      <div class="group-title">请求头 / Cookie</div>
      <div class="group-grid">
        <ParamField
          v-for="param in headerFields"
          :key="param.name"
          :param="param"
          :value="valueOf(param.name)"
          :pairs="pairsOfParam(param.name)"
          :node-id="node.id"
          :ctx="ctx"
          @update="(value: unknown) => emit('set-param', param, value)"
          @pairs="(value: ParamPair[]) => emit('set-pairs', param, value)"
        />
      </div>
    </div>

    <!-- 请求体：body 是 textarea 会占满整行，contentType 紧随其后 -->
    <div v-if="bodyFields.length" class="request-group">
      <div class="group-title">请求体</div>
      <div class="group-hint">
        GET 请求可留空；POST 表单填请求体类型 application/x-www-form-urlencoded，发 JSON 填 application/json。
      </div>
      <div class="group-grid">
        <ParamField
          v-for="param in bodyFields"
          :key="param.name"
          :param="param"
          :value="valueOf(param.name)"
          :pairs="pairsOfParam(param.name)"
          :node-id="node.id"
          :ctx="ctx"
          @update="(value: unknown) => emit('set-param', param, value)"
          @pairs="(value: ParamPair[]) => emit('set-pairs', param, value)"
        />
      </div>
    </div>

    <!-- 高级：默认折叠，展开后才是超时 / 重试 / 代理等字段 -->
    <div v-if="advancedFields.length" class="request-group">
      <div class="advanced-head">
        <ReButton
          text
          type="primary"
          :aria-expanded="advancedOpen ? 'true' : 'false'"
          @click="advancedOpen = !advancedOpen"
        >
          {{ advancedOpen ? "收起高级选项" : "显示高级选项" }}
        </ReButton>
        <span class="advanced-hint">超时、重试、代理、抓取器、出参变量、保留文档对象</span>
      </div>
      <div v-show="advancedOpen" class="group-grid">
        <ParamField
          v-for="param in advancedFields"
          :key="param.name"
          :param="param"
          :value="valueOf(param.name)"
          :pairs="pairsOfParam(param.name)"
          :node-id="node.id"
          :ctx="ctx"
          @update="(value: unknown) => emit('set-param', param, value)"
          @pairs="(value: ParamPair[]) => emit('set-pairs', param, value)"
        />
      </div>
    </div>

    <!-- 循环四参数：paramContext 统一追加，固定排在专属参数之后 -->
    <div v-if="loopFields.length" class="request-group">
      <div class="group-title">循环</div>
      <div class="group-grid">
        <ParamField
          v-for="param in loopFields"
          :key="param.name"
          :param="param"
          :value="valueOf(param.name)"
          :pairs="pairsOfParam(param.name)"
          :node-id="node.id"
          :ctx="ctx"
          @update="(value: unknown) => emit('set-param', param, value)"
          @pairs="(value: ParamPair[]) => emit('set-pairs', param, value)"
        />
      </div>
    </div>

    <!-- 兜底组：后端新增但未纳入上面分组的参数，避免静默丢失 -->
    <div v-if="otherFields.length" class="request-group">
      <div class="group-title">其它</div>
      <div class="group-grid">
        <ParamField
          v-for="param in otherFields"
          :key="param.name"
          :param="param"
          :value="valueOf(param.name)"
          :pairs="pairsOfParam(param.name)"
          :node-id="node.id"
          :ctx="ctx"
          @update="(value: unknown) => emit('set-param', param, value)"
          @pairs="(value: ParamPair[]) => emit('set-pairs', param, value)"
        />
      </div>
    </div>

    <!-- append-to-body：属性面板自身可能有 overflow / transform，弹框留在面板内会被裁掉 -->
    <ElDialog v-model="previewOpen" title="响应预览" width="760px" append-to-body>
      <div v-if="previewLoading" class="preview-state">正在请求 {{ urlValue }} …</div>
      <div v-else-if="previewError" class="preview-state preview-error">
        预览失败：{{ previewError }}
      </div>
      <template v-else-if="previewResult">
        <div class="preview-meta">
          <span class="meta-item">
            <em>状态</em>
            <b :class="statusClass(previewResult.status)">{{ previewResult.status }}</b>
          </span>
          <span class="meta-item">
            <em>Content-Type</em>
            <span>{{ previewResult.contentType || "未返回" }}</span>
          </span>
          <span class="meta-item">
            <em>正文字符数</em>
            <span>{{ previewResult.length ?? previewResult.html.length }}</span>
          </span>
        </div>
        <pre class="preview-body">{{ previewText || "（正文为空）" }}</pre>
        <div v-if="previewTruncated" class="preview-hint">
          仅显示前 20 行，共 {{ previewLines.length }} 行；完整内容请把 URL 复制到浏览器查看。
        </div>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
/* 表单根：作为整行网格项撑满属性面板，内部再按组纵向排布 */
.request-form {
  display: flex;
  flex-direction: column;
  grid-column: 1 / -1;
  gap: 12px;
  min-width: 0;
}

/* 节点级说明：与其它节点表单同一形态（左侧 2px 主色竖条 + 浅底） */
.node-intro {
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-left: 2px solid var(--el-color-primary);
  border-radius: var(--el-radius-md, 8px);
  transition: border-color 200ms, background-color 200ms;
}

/* 第一行：方法窄、URL 宽、预览按钮贴右；用边框 + 底色强调为整张表单的主入口 */
.request-primary {
  display: flex;
  /* 关键：允许换行。原先不换行 —— 面板一窄，方法列(116px) 与预览列把 URL 挤成一条线，
     输入框窄到看不见内容，这就是「样式被挤压变形」的成因。 */
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
}

/* 方法列固定宽，URL 吃掉剩余宽度；class 由父级透传到 ParamField 根节点 */
.request-primary :deep(.primary-method) {
  flex: 0 0 116px;
}

/* URL 给一个保底宽度：放不下时它自己换到下一行，而不是被压成几十像素 */
.request-primary :deep(.primary-url) {
  flex: 1 1 260px;
  min-width: 0;
}

/* 预览列：宽面板里贴右；换行后自成一行（靠右对齐） */
.preview-cell {
  flex: 0 0 auto;
  margin-left: auto;
}

/* 字段容器样式与 ParamField 保持一致（本组件内的 .field 只用于预览列） */
.field {
  min-width: 0;
}

.field-label {
  margin-bottom: 3px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.field-tip {
  margin-top: 3px;
  font-size: 11px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}

/* 分组：标题与字段之间 6px，组与组之间由根容器 gap 的 12px 负责 */
.request-group {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.group-title {
  margin: 0 0 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.group-hint {
  margin: 0 0 6px;
  font-size: 11px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}

/* 组内字段网格：与属性面板一致的自适应列，竖向 8px、横向 14px。
   列最小宽从 230px 收到 200px：窄面板下 230px 会让字段整体溢出、被裁掉右边缘。 */
.group-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px 14px;
  align-content: start;
}

/* 高级分组头：一个可展开的开关 + 一句清单说明 */
.advanced-head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: baseline;
  margin-bottom: 6px;
}

.advanced-hint {
  font-size: 11px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}

/* ------------------------------ 响应预览弹框 ------------------------------ */
.preview-state {
  padding: 24px 4px;
  overflow-wrap: anywhere;
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.preview-error {
  color: var(--el-color-danger);
}

.preview-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
}

.meta-item {
  display: inline-flex;
  gap: 6px;
  align-items: baseline;
}

.meta-item em {
  font-style: normal;
  color: var(--el-text-color-secondary);
}

.status-ok {
  color: var(--el-color-success);
}

.status-bad {
  color: var(--el-color-danger);
}

/* 等宽正文：固定高度 + 双向滚动，长行不换行以免破坏「行」的含义 */
.preview-body {
  max-height: 360px;
  margin: 12px 0 0;
  padding: 12px;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
  white-space: pre;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
}

.preview-hint {
  margin-top: 8px;
  font-size: 11px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}
</style>

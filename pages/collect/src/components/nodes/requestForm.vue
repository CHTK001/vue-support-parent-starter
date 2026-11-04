<!--
  抓取节点表单（Postman 图稿形态）：卡片头 + 发送条 + 分区页签 + 响应状态条。

  对照 UI 图稿的映射：
    · 卡片头＝橙色圆形图标 + 节点名 + 右侧等宽徽标（图稿「图标 + 标题 + N2 · Postman」）；
    · 发送条＝方法徽章（GET 绿等按方法着色）+ URL 输入 + 占位插入 + 橙色「发送」按钮
      （图稿的地址栏 + 发送键；「发送」在设计期语义＝实际取回一次并在弹窗预览，不改流程数据）；
    · 分区页签＝图稿的 Params / Headers / Body / Tests 行，替换原先纵向堆叠的分组：
      请求头 / 请求体 / 其它，页签即分区，缺项的页签不渲染；超时重试归外层「高级配置」、
      出参变量归外层「输出参数」、循环四参数归外层「循环」——同一份参数只留一个入口；
    · 响应弹窗＝图稿底部：状态码胶囊（200 OK / 非 2xx 红）+ 耗时 + 正文体积，正文带行号。

  颜色全走 koi 体系的 --el-* 令牌（语义映射：图稿绿→success、橙→warning、青→primary），
  不写死色值，亮暗主题自动跟随；圆角按 koi 统一口径（外卡 12px/lg、内块 8px/md、小件 4px/sm）。

  红线：参数名是前后端契约一个都不能改，分组/页签只改展示位置，
  写回仍走 set-param / set-pairs；宽控件（textarea / pairs / mapping / table）
  在页签网格里由 .field-wide 占满整行。
-->
<script setup lang="ts">
import { computed, ref } from "vue";
import ReDialog from "@repo/ui/re-dialog";
import RePlaceholderPicker from "@repo/ui/re-placeholder-picker";
import NodeAlert from "./NodeAlert.vue";
import NodeParamForm from "./NodeParamForm.vue";
import ParamField from "./ParamField.vue";
import { isInputParam, useShapeFieldList } from "./paramContext";
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
  /** 分区渲染：input / output / loop / advanced；缺省按 input 处理（本组件只负责输入参数页签） */
  section?: "all" | "input" | "output" | "loop" | "advanced";
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

/** 发送条固定「方法在前、URL 在后」，与 names 的取值顺序无关，只决定这一行的左右排布 */
const PRIMARY_NAMES = ["method", "url"];
/** 请求头 / Cookie 组：两个 pairs 参数必须同组相邻 */
const HEADER_NAMES = ["header:名称", "cookie:名称"];
/** 请求体组 */
const BODY_NAMES = ["body", "contentType"];

/**
 * 按给定顺序取参数，缺项自动跳过。
 *
 * <p>只用于发送条这种「左右位置有语义」的场景（方法必须在左、URL 必须在右），
 * 其余分区一律用 fieldsBySet 沿用 paramContext 的必填前置顺序。</p>
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

/** 输入参数页签里的全部参数（出参变量名 / 超时重试等已按 paramContext 的口径摘到别的页签） */
const inputFields = computed(() => fields.value.filter(isInputParam));

/** 兜底分区：不属于发送条 / 请求头 / 请求体的输入参数，避免后端加了参数前端却不显示 */
const otherFields = computed(() => {
  const used = new Set([...PRIMARY_NAMES, ...HEADER_NAMES, ...BODY_NAMES]);
  return inputFields.value.filter((param) => !used.has(param.name));
});

/* --------------------------------- 分区页签 --------------------------------- */

/**
 * 分区页签（图稿 Params / Headers / Body / Tests 行的对应物）。
 *
 * <p>只留「请求头 / 请求体 / 其它」三片：超时重试与出参变量已经由外层页签外壳的
 * 「高级配置」「输出参数」承担，循环四参数由「循环」页签承担 —— 内层再复制一套
 * 同一份参数会出现两个入口写同一个值，用户改完不知道哪一处生效。</p>
 */
type ReqTab = "headers" | "body" | "other";

/** 页签文案：短标签优先，与图稿的单词页签同一节奏 */
const TAB_LABELS: Record<ReqTab, string> = {
  headers: "请求头",
  body: "请求体",
  other: "其它",
};

/** 实际渲染的页签序列：没有内容的分区不出页签，避免点开一片空白 */
const tabs = computed<ReqTab[]>(() => {
  const list: ReqTab[] = [];
  if (headerFields.value.length) list.push("headers");
  if (bodyFields.value.length) list.push("body");
  if (otherFields.value.length) list.push("other");
  return list;
});

/** 用户点选的页签（原始值） */
const activeTab = ref<ReqTab>("headers");

/** 当前页签：分区因数据变化消失时兜底落到第一个，防止停在不存在的页签上 */
const currentTab = computed<ReqTab>(
  () => (tabs.value.includes(activeTab.value) ? activeTab.value : (tabs.value[0] ?? "headers")),
);

/**
 * 页签计数徽标：只给「请求头」统计键值条目数（图稿页签数字位）。
 *
 * @param tab 页签键
 * @returns 需要展示的数字，0 表示不渲染徽标
 */
function tabCount(tab: ReqTab): number {
  if (tab !== "headers") return 0;
  return headerFields.value.reduce(
    (sum, param) => sum + pairsOfParam(param.name).length,
    0,
  );
}

/* --------------------------------- 发送条 --------------------------------- */

/** 方法徽章着色用的规范值（GET 绿 / 写方法主色 / DELETE 红，见 send-bar[data-method] 样式） */
const methodValue = computed(() => valueOf("method").toUpperCase());

/** 当前 URL：用 computed 包住 valueOf，节点参数一变按钮禁用态立即跟着更新 */
const urlValue = computed(() => valueOf("url"));
/** URL 含 ${} 占位时设计期解析不出真实地址，发送没有意义 */
const urlHasPlaceholder = computed(() => urlValue.value.includes("${"));
/** 无 URL 或含占位时禁用发送按钮 */
const previewDisabled = computed(() => !urlValue.value.trim() || urlHasPlaceholder.value);

/** url 参数元数据：占位插入的写回目标 */
const urlParam = computed<CollectParamMeta | undefined>(() =>
  fields.value.find((param: CollectParamMeta) => param.name === "url"),
);

/** 占位插入入口是否可用（发送条里 URL 的 label 被隐藏，插入按钮挪到条内） */
const showUrlPicker = computed(() => (props.ctx.placeholderGroups?.length ?? 0) > 0);

/**
 * 往 URL 末尾追加一个占位：追加而不是替换 —— 用户往往是在「前缀已有文字」时补 ${}。
 *
 * @param mark 形如 `${name}` 的占位串（RePlaceholderPicker 原样给出）
 */
function appendUrlPlaceholder(mark: string): void {
  const param = urlParam.value;
  if (!param) return;
  emit("set-param", param, `${valueOf("url")}${mark}`);
}

/* --------------------------------- 响应预览 -------------------------------- */

/** 预览弹框开关、加载态与结果 / 错误，三者互斥展示 */
const previewOpen = ref(false);
const previewLoading = ref(false);
const previewError = ref("");
const previewResult = ref<PreviewPayload | null>(null);
/** 本次「发送」的往返耗时（毫秒，客户端实测）——图稿底部 342 ms 位 */
const previewMs = ref<number | null>(null);

/** 正文最多渲染的行数，避免超长页面把弹框撑成无底洞 */
const PREVIEW_MAX_LINES = 20;
/** 正文按行拆分（行号栏渲染源） */
const previewLines = computed(() => (previewResult.value?.html ?? "").split(/\r?\n/));
/** 实际渲染的行（前 N 行） */
const codeLines = computed(() => previewLines.value.slice(0, PREVIEW_MAX_LINES));
/** 是否有被截断的行 */
const previewTruncated = computed(() => previewLines.value.length > PREVIEW_MAX_LINES);

/** 正文体积：图稿底部 12.4 KB 位，按 KB 一位小数、不足 1KB 显示 B */
const previewSize = computed(() => {
  const result = previewResult.value;
  if (!result) return "";
  const chars = result.length ?? result.html.length;
  return chars >= 1024 ? `${(chars / 1024).toFixed(1)} KB` : `${chars} B`;
});

/** 常见状态短语：图稿的「200 OK」形态；没收录的只显示码 */
const STATUS_PHRASES: Record<number, string> = {
  200: "OK",
  201: "Created",
  204: "No Content",
  301: "Moved Permanently",
  302: "Found",
  304: "Not Modified",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  408: "Request Timeout",
  429: "Too Many Requests",
  500: "Internal Server Error",
  502: "Bad Gateway",
  503: "Service Unavailable",
};

/** 状态胶囊文案：`200 OK` 这样的「码 + 短语」 */
const statusText = computed(() => {
  const code = previewResult.value?.status;
  if (!code) return "";
  const phrase = STATUS_PHRASES[code];
  return phrase ? `${code} ${phrase}` : String(code);
});

/**
 * 拉取并展示响应：先开弹框显示加载态，成功填结果、失败把可读原因留在弹框里。
 *
 * <p>失败不能静默——设计期最常见的失败就是 URL 写错或后端拒绝内网地址，
 * 把错误原文显示出来用户才知道下一步改什么。耗时在客户端掐表，覆盖不到后端排队部分。</p>
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
  previewMs.value = null;
  const t0 = performance.now();
  try {
    previewResult.value = await loader(target);
    previewMs.value = Math.round(performance.now() - t0);
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
  return status >= 200 && status < 300 ? "resp-ok" : "resp-bad";
}
</script>

<template>
  <!-- 节点级说明：与外层页签外壳同口径，每个页签顶部都显示一次 -->
  <NodeAlert kind="intro">
    按 URL 取回页面或接口响应，交给下游节点解析。先填方法与地址，点「发送」在设计期实际取回一次、
    弹窗看状态与正文；请求头与请求体在下方页面片里，超时重试在「高级配置」页签。
  </NodeAlert>

  <!-- 出参变量名 / 超时重试 / 循环 / 高级配置：统一交给 NodeParamForm 的分区渲染 -->
  <NodeParamForm
    v-if="section && section !== 'input'"
    :node="node"
    :meta="meta"
    :ctx="ctx"
    :section="section"
    :own-param-names="[
      'url',
      'method',
      'body',
      'contentType',
      'timeout',
      'retry',
      'retryInterval',
      'proxy',
      'userAgent',
      'fetcher',
      'outputVariable',
      'saveDocument',
      'header:名称',
      'cookie:名称',
    ]"
    @set-param="(param: CollectParamMeta, value: unknown) => emit('set-param', param, value)"
    @set-pairs="(param: CollectParamMeta, pairs: ParamPair[]) => emit('set-pairs', param, pairs)"
  />

  <div v-else class="request-form">
    <!-- 卡片头：图稿的「圆形图标 + 标题 + 等宽徽标」 -->
    <div class="form-head">
      <span class="form-head__icon" aria-hidden="true">
        <el-icon><Right /></el-icon>
      </span>
      <span class="form-head__title">{{ node.name || "抓取节点" }}</span>
      <span class="form-head__badge">{{ meta.shape }}</span>
    </div>

    <!-- 发送条：图稿的地址栏（方法徽章 + URL + 占位插入 + 发送键） -->
    <div class="send-bar" :data-method="methodValue">
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
      <RePlaceholderPicker
        v-if="showUrlPicker"
        class="send-picker"
        :groups="ctx.placeholderGroups"
        mode="icon"
        @pick="appendUrlPlaceholder"
      />
      <button
        v-if="ctx.loadPreview"
        type="button"
        class="send-btn"
        :disabled="previewDisabled"
        :aria-expanded="previewOpen ? 'true' : 'false'"
        :title="urlHasPlaceholder ? 'URL 含 ${变量}，设计期无法发送' : '实际请求一次并预览响应'"
        @click="openPreview"
      >
        <el-icon v-if="previewLoading" class="send-btn__spin"><Loading /></el-icon>
        <el-icon v-else><Promotion /></el-icon>
        {{ previewLoading ? "发送中…" : "发送" }}
      </button>
    </div>

    <!-- 发送条下方的状态提示：按当前 URL 状态给出下一步动作 -->
    <div v-if="!ctx.loadPreview" class="send-hint">
      当前环境未启用设计期预览，点「运行」查看实际响应。
    </div>
    <div v-else-if="urlHasPlaceholder" class="send-hint">
      URL 含 ${变量}，设计期解析不出实际地址，「发送」暂不可用 —— 运行期才会取到真实地址。
    </div>
    <div v-else-if="!urlValue.trim()" class="send-hint">
      先填写 URL，再点「发送」取回一次响应。
    </div>
    <div v-else class="send-hint">
      「发送」＝设计期实际请求一次，弹窗预览状态与正文，不改动流程数据。
    </div>

    <!-- 分区页签：图稿的 Params / Headers / Body 行 -->
    <div class="req-tabs" role="tablist" aria-label="请求配置分区">
      <button
        v-for="tab in tabs"
        :key="tab"
        type="button"
        role="tab"
        class="req-tab"
        :class="{ 'is-active': currentTab === tab }"
        :aria-selected="currentTab === tab"
        @click="activeTab = tab"
      >
        {{ TAB_LABELS[tab] }}
        <em v-if="tabCount(tab)" class="req-tab__count">{{ tabCount(tab) }}</em>
      </button>
    </div>

    <!-- 页签内容：页签即分区；宽控件由 .field-wide 在本网格里占满整行 -->
    <div class="req-pane" role="tabpanel">
      <template v-if="currentTab === 'headers'">
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
      </template>

      <template v-else-if="currentTab === 'body'">
        <div class="pane-hint">
          GET 请求可留空；POST 表单填请求体类型 application/x-www-form-urlencoded，发 JSON 填
          application/json。
        </div>
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
      </template>

      <template v-else-if="currentTab === 'other'">
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
      </template>
    </div>

    <!-- 响应弹窗：图稿底部形态（状态胶囊 + 耗时 + 体积 + 行号正文）。
         append-to-body：属性面板自身可能有 overflow / transform，弹框留在面板内会被裁掉 -->
    <ReDialog v-model="previewOpen" title="响应预览" width="760px" append-to-body>
      <div v-if="previewLoading" class="resp-state">正在发送 {{ urlValue }} …</div>
      <div v-else-if="previewError" class="resp-state resp-error">
        发送失败：{{ previewError }}
      </div>
      <template v-else-if="previewResult">
        <div class="resp-bar">
          <span class="resp-pill" :class="statusClass(previewResult.status)">
            <el-icon>
              <SuccessFilled v-if="previewResult.status >= 200 && previewResult.status < 300" />
              <CircleCloseFilled v-else />
            </el-icon>
            {{ statusText }}
          </span>
          <span class="resp-meta">
            <em>类型</em>{{ previewResult.contentType || "未返回" }}
          </span>
          <span class="resp-meta">
            <em>耗时</em>{{ previewMs ?? "—" }}<template v-if="previewMs !== null"> ms</template>
          </span>
          <span class="resp-meta">
            <em>正文</em>{{ previewSize }}
          </span>
        </div>
        <div class="resp-code">
          <div
            v-for="(line, index) in codeLines"
            :key="index"
            class="resp-row"
          >
            <span class="resp-ln">{{ index + 1 }}</span>
            <span class="resp-lc">{{ line || " " }}</span>
          </div>
          <div v-if="!codeLines.length" class="resp-row">
            <span class="resp-ln">1</span>
            <span class="resp-lc resp-lc--empty">（正文为空）</span>
          </div>
        </div>
        <div v-if="previewTruncated" class="resp-hint">
          仅显示前 {{ PREVIEW_MAX_LINES }} 行，共 {{ previewLines.length }} 行；完整内容请把 URL
          复制到浏览器查看。
        </div>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped>
/* ------------------------------- 表单卡片外壳 ------------------------------- */

/* 表单根：作为整行网格项撑满属性面板，图稿的白底描边卡片形态。
   外卡圆角 12px(lg)，与 GlueTypeCards 同一 koi 口径 */
.request-form {
  display: flex;
  flex-direction: column;
  grid-column: 1 / -1;
  gap: 10px;
  min-width: 0;
  padding: 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}

/* --------------------------------- 卡片头 --------------------------------- */

.form-head {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.form-head__icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--el-color-warning);
  color: var(--el-color-white);
  font-size: 14px;
}

.form-head__title {
  min-width: 0;
  overflow: hidden;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.form-head__badge {
  flex: none;
  margin-left: auto;
  padding: 1px 7px;
  font-family: ui-monospace, "Cascadia Mono", "Consolas", monospace;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-sm, 4px);
}

/* --------------------------------- 发送条 --------------------------------- */

.send-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 5px 6px 5px 8px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-md, 8px);
  transition: border-color 0.2s, box-shadow 0.2s;
}

/* URL 获焦：整条输入栏亮起主色描边（图稿地址栏聚焦态的口径） */
.send-bar:focus-within {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 3px var(--el-color-primary-light-8);
}

/* 方法徽章固定宽；class 由父级透传到 ParamField 根节点 */
.send-bar :deep(.primary-method) {
  flex: 0 0 116px;
}

/* URL 吃掉剩余宽度；放不下时自己换行，而不是被压成几十像素 */
.send-bar :deep(.primary-url) {
  flex: 1 1 260px;
  min-width: 0;
}

/* 发送条内隐藏字段标签 / 说明行：Postman 地址栏是单行，标签语义由占位与下方提示承担。
   !important 压过 ParamField 作用域内同特异度的 display 声明 */
.send-bar :deep(.field-label),
.send-bar :deep(.field-tip) {
  display: none !important;
}

/* 方法徽章：去掉 ReSelect 的盒子底色，整格融进发送条，颜色交给 data-method 语义着色 */
.send-bar .primary-method :deep(.el-select__wrapper) {
  min-height: 30px;
  background: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

.send-bar .primary-method :deep(.el-select__selected-item) {
  font-weight: 700;
}

/* URL 输入融进发送条：透明底、去描边、等宽字体（图稿地址栏正文的口径） */
.send-bar .primary-url :deep(.el-input__wrapper) {
  min-height: 30px;
  padding: 0 4px;
  background: transparent !important;
  box-shadow: none !important;
}

.send-bar .primary-url :deep(.el-input__inner) {
  font-family: ui-monospace, "Cascadia Mono", "Consolas", monospace;
  font-size: 13px;
}

/* 方法徽章按方法着色：图稿 GET 绿；写方法用主色；DELETE 红。全走语义令牌，不写死色值 */
.send-bar[data-method="GET"] .primary-method :deep(.el-select__wrapper),
.send-bar[data-method="HEAD"] .primary-method :deep(.el-select__wrapper),
.send-bar[data-method="OPTIONS"] .primary-method :deep(.el-select__wrapper) {
  background: var(--el-color-success-light-9) !important;
  border-color: var(--el-color-success-light-5) !important;
}

.send-bar[data-method="GET"] .primary-method :deep(.el-select__selected-item),
.send-bar[data-method="HEAD"] .primary-method :deep(.el-select__selected-item),
.send-bar[data-method="OPTIONS"] .primary-method :deep(.el-select__selected-item) {
  color: var(--el-color-success);
}

.send-bar[data-method="POST"] .primary-method :deep(.el-select__wrapper),
.send-bar[data-method="PUT"] .primary-method :deep(.el-select__wrapper),
.send-bar[data-method="PATCH"] .primary-method :deep(.el-select__wrapper) {
  background: var(--el-color-primary-light-9) !important;
  border-color: var(--el-color-primary-light-5) !important;
}

.send-bar[data-method="POST"] .primary-method :deep(.el-select__selected-item),
.send-bar[data-method="PUT"] .primary-method :deep(.el-select__selected-item),
.send-bar[data-method="PATCH"] .primary-method :deep(.el-select__selected-item) {
  color: var(--el-color-primary);
}

.send-bar[data-method="DELETE"] .primary-method :deep(.el-select__wrapper) {
  background: var(--el-color-danger-light-9) !important;
  border-color: var(--el-color-danger-light-5) !important;
}

.send-bar[data-method="DELETE"] .primary-method :deep(.el-select__selected-item) {
  color: var(--el-color-danger);
}

/* 占位插入按钮：贴着 URL 右侧，图标钮形态 */
.send-picker {
  flex: none;
}

/* 发送键：图稿橙色主键，全走 warning 语义令牌 */
.send-btn {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 18px;
  border: 0;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-color-warning);
  color: var(--el-color-white);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: var(--el-color-warning-dark-2);
}

.send-btn:disabled {
  cursor: not-allowed;
  background: var(--el-fill-color);
  color: var(--el-text-color-placeholder);
}

.send-btn__spin {
  animation: send-spin 1s linear infinite;
}

@keyframes send-spin {
  to {
    transform: rotate(360deg);
  }
}

/* 发送条下的状态提示：一句、跟随主题的次要文字 */
.send-hint {
  margin-top: -4px;
  font-size: 11px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}

/* -------------------------------- 分区页签 -------------------------------- */

.req-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.req-tab {
  position: relative;
  padding: 7px 12px 8px;
  border: 0;
  background: transparent;
  color: var(--el-text-color-secondary);
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  border-radius: var(--el-radius-sm, 4px) var(--el-radius-sm, 4px) 0 0;
  transition: color 0.15s, background-color 0.15s;
}

.req-tab:hover {
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-light);
}

.req-tab.is-active {
  color: var(--el-color-primary);
  font-weight: 600;
}

/* 激活下划线（图稿绿色下划线的令牌化对应：主色） */
.req-tab.is-active::after {
  content: "";
  position: absolute;
  right: 10px;
  bottom: -1px;
  left: 10px;
  height: 2px;
  background: var(--el-color-primary);
  border-radius: 2px;
}

.req-tab__count {
  margin-left: 4px;
  padding: 0 5px;
  font-style: normal;
  font-size: 10px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  border-radius: 8px;
}

.req-tab.is-active .req-tab__count {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-8);
}

/* -------------------------------- 页签内容 -------------------------------- */

/* 页签网格：与属性面板同规格的自适应列，窄面板下字段不溢出 */
.req-pane {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px 14px;
  align-content: start;
  min-height: 48px;
}

/* 分区内的整行提示（请求体 / 高级的口径说明） */
.pane-hint {
  grid-column: 1 / -1;
  margin: 0;
  font-size: 11px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}

/* ------------------------------ 响应预览弹框 ------------------------------ */

.resp-state {
  padding: 24px 4px;
  overflow-wrap: anywhere;
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.resp-error {
  color: var(--el-color-danger);
}

/* 状态条：图稿底部「200 OK · 342 ms · 12.4 KB」的口径 */
.resp-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  padding: 8px 10px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
}

.resp-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 10px;
  font-family: ui-monospace, "Cascadia Mono", "Consolas", monospace;
  font-weight: 600;
  border-radius: 999px;
}

.resp-pill.resp-ok {
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
  border: 1px solid var(--el-color-success-light-5);
}

.resp-pill.resp-bad {
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-5);
}

.resp-meta em {
  margin-right: 4px;
  font-style: normal;
  color: var(--el-text-color-secondary);
}

/* 正文：行号栏 + 等宽正文，固定高度双向滚动（图稿的代码区形态） */
.resp-code {
  max-height: 340px;
  margin-top: 10px;
  overflow: auto;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
}

.resp-row {
  display: flex;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre;
}

.resp-row:hover {
  background: var(--el-fill-color);
}

.resp-ln {
  flex: 0 0 40px;
  padding: 0 8px;
  color: var(--el-text-color-placeholder);
  text-align: right;
  background: var(--el-fill-color);
  border-right: 1px solid var(--el-border-color-lighter);
  user-select: none;
}

.resp-lc {
  flex: 1 1 auto;
  min-width: 0;
  padding: 0 10px;
  color: var(--el-text-color-regular);
}

.resp-lc--empty {
  color: var(--el-text-color-secondary);
}

.resp-hint {
  margin-top: 8px;
  font-size: 11px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}
</style>

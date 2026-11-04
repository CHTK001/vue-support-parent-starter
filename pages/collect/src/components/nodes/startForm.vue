<!--
  开始节点表单：流程入口，声明种子 URL。

  开始节点是流程的入口：每行一个种子 URL，流程会以列表里的每个地址各自跑一遍下游。

  属性面板改为页签外壳后（components/NodeFormTabs.vue），本组件只负责**输入参数**页签；
  出参变量名在「输出参数」页签、超时/超时策略在「高级配置」页签，统一由 NodeParamForm 渲染。
  开始节点不是可迭代单元（NON_LOOP_SHAPES），所以没有「循环」页签。

  UI 稿形态（颜色全走 koi 体系令牌，不写死色值）：
    · 三个分段按钮（种子 URL 列表 / 定时触发 / Webhook 回调）
    · 种子 URL 收在一张描边卡片里，卡片头带「必填」与实时行数，正文用等宽字体
    · 底部「输出变量」区用虚线框，把下游可引用的 ${data} / ${url} 摆出来

  三个分段里只有「种子 URL 列表」有后端参数支撑（/designer/metas 的 start 只下发
  urls + outputVariable）。另两段是占位：选中后如实说明「后端尚未下发该触发方式的参数」，
  而不是画一个能点却什么都不做的按钮。
-->
<script setup lang="ts">
import { computed, ref } from "vue";
import NodeAlert from "./NodeAlert.vue";
import NodeParamForm from "./NodeParamForm.vue";
import ParamField from "./ParamField.vue";
import { isInputParam, useShapeFieldList } from "./paramContext";
import type { NodeForm, NodeFormContext } from "./paramContext";
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

/** 节点级说明：页签外壳每个页签都显示一次 */
const INTRO =
  "流程入口：定义种子 URL 列表（每行一个），流程会以列表里的每个地址各自跑一遍下游；"
  + "结果写入 data（同 url，种子 URL 列表），供后续节点引用。";

/** 开始节点专属参数：种子 URL；其余后端参数由 orderedParams 的兜底段带出 */
const { fields, valueOf, pairsOfParam } = useShapeFieldList(
  () => props.node,
  () => props.meta,
  ["urls"],
);

/** 当前分段：种子 URL / 定时触发 / Webhook 回调 */
type Channel = "urls" | "cron" | "webhook";
const channel = ref<Channel>("urls");

const CHANNELS: { key: Channel; label: string }[] = [
  { key: "urls", label: "种子 URL 列表" },
  { key: "cron", label: "定时触发" },
  { key: "webhook", label: "Webhook 回调" },
];

/** 后端是否为当前分段下发了参数：没有就别画可点的分段，直接说明缺什么 */
const CHANNEL_SUPPORTED: Record<Channel, boolean> = {
  urls: true,
  cron: false,
  webhook: false,
};

/** 种子 URL 的非空行数：与后端「空行自动忽略」的口径一致 */
const urlRowCount = computed(() =>
  String(valueOf("urls") ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean).length,
);

/** 种子 URL 参数元数据：必填星号与行数都挂在它身上 */
const urlsParam = computed<CollectParamMeta | undefined>(() =>
  fields.value.find((item: CollectParamMeta) => item.name === "urls"),
);

/** 输入参数页签里除种子 URL 之外的参数（后端新增的输入参数走这里，不致漏渲染） */
const restInputFields = computed(() =>
  fields.value.filter((param) => isInputParam(param) && param.name !== "urls"),
);

/** 前端补充的参数说明。
 *
 * <p>后端 meta 的 tip 对 textarea 只当占位符（输入后即消失），有的参数又没有 tip，
 * 这里按参数名补一句「这是什么 / 怎么用 / 例子」，只作用于本表单，不改后端。</p>
 */
const EXTRA_TIPS: Record<string, string> = {
  urls: "每行一个种子 URL，支持 ${变量} 拼接（如 ?page=${page}）；空行会被自动忽略。",
};

/**
 * 取某参数的补充说明。
 *
 * @param name 参数名
 * @returns 补充说明；没有则返回空串
 */
function extraTip(name: string): string {
  return EXTRA_TIPS[name] ?? "";
}

/** 输出变量：集合名 + 种子 URL 列表别名，供下游 ${} 引用 */
const outputs = computed(() => {
  const raw = String(valueOf("outputVariable") ?? "").trim();
  const list = raw || "data";
  return [
    { name: list, type: "array", hint: "种子 URL 列表；${url[0]} 取首条" },
    { name: "url", type: "array", hint: "同输出名，始终写入" },
  ];
});
</script>

<template>
  <NodeAlert kind="intro">{{ INTRO }}</NodeAlert>

  <!-- 出参变量名 / 超时策略：统一交给 NodeParamForm 的分区渲染 -->
  <NodeParamForm
    v-if="section && section !== 'input'"
    :node="node"
    :meta="meta"
    :ctx="ctx"
    :section="section"
    :own-param-names="['urls']"
    @set-param="(param: CollectParamMeta, value: unknown) => emit('set-param', param, value)"
    @set-pairs="(param: CollectParamMeta, pairs: ParamPair[]) => emit('set-pairs', param, pairs)"
  />

  <template v-else>
    <!-- 开始配置：分段切换。UI 稿的三个入口 -->
    <div class="field field-wide">
      <div class="channel-row" role="tablist" aria-label="开始配置方式">
        <button
          v-for="item in CHANNELS"
          :key="item.key"
          type="button"
          role="tab"
          class="channel"
          :class="{ 'is-active': channel === item.key }"
          :aria-selected="channel === item.key"
          @click="channel = item.key"
        >
          {{ item.label }}
        </button>
      </div>
    </div>

    <!-- 未被后端支撑的分段：说明原因，不给一个点了没反应的面板 -->
    <div v-if="!CHANNEL_SUPPORTED[channel]" class="field field-wide channel-empty">
      <span>
        后端尚未为开始节点下发「{{ CHANNELS.find(i => i.key === channel)?.label }}」的参数，
        该触发方式暂不可配置。
      </span>
    </div>

    <template v-else>
      <!--
        种子 URL：独立成一张描边卡片。
        ParamField 负责真正的输入控件与表达式插入器，这里只提供卡片外壳
        （标题行 + 必填星号 + 实时行数 + 等宽正文），避免两处各写一套 label。
      -->
      <div v-if="urlsParam" class="field field-wide url-card">
        <div class="url-card__head">
          <span class="url-card__title">
            {{ urlsParam.label }}<span v-if="urlsParam.required" class="req">*</span>
          </span>
          <span class="url-card__count">{{ urlRowCount }} 行</span>
        </div>
        <ParamField
          :param="urlsParam"
          :hint="extraTip('urls')"
          :value="valueOf('urls')"
          :pairs="pairsOfParam('urls')"
          :node-id="node.id"
          :ctx="ctx"
          @update="(value: unknown) => urlsParam && emit('set-param', urlsParam, value)"
          @pairs="(value: ParamPair[]) => urlsParam && emit('set-pairs', urlsParam, value)"
        />
      </div>

      <!-- 其余后端输入参数（兜底段带出来的），维持原有字段流 -->
      <ParamField
        v-for="param in restInputFields"
        :key="param.name"
        :param="param"
        :hint="extraTip(param.name)"
        :value="valueOf(param.name)"
        :pairs="pairsOfParam(param.name)"
        :node-id="node.id"
        :ctx="ctx"
        @update="(value: unknown) => emit('set-param', param, value)"
        @pairs="(value: ParamPair[]) => emit('set-pairs', param, value)"
      />
    </template>

    <!-- 输出变量：虚线框，告诉下游能引用什么 -->
    <div class="field field-wide output-box">
      <span class="output-box__label">输出变量</span>
      <div class="output-box__items">
        <span v-for="out in outputs" :key="out.name" class="output-chip">
          <code class="output-chip__name">{{ out.name }}</code>
          <span class="output-chip__type">{{ out.type }}</span>
          <em v-if="out.hint" class="output-chip__hint">{{ out.hint }}</em>
        </span>
      </div>
      <span class="output-box__note">
        供下游节点通过 ${ {{ outputs[0].name }} }、${ url } 引用
      </span>
    </div>
  </template>
</template>

<style scoped>
/* 参数容器：与 ParamField / NodeParamForm 的字段样式保持一致 */
.field {
  min-width: 0;
}

.field-wide {
  grid-column: 1 / -1;
}

/* 前端补充的参数说明由 ParamField 的 hint 承载，这里只留分段与卡片样式 */
.req {
  margin-left: 2px;
  color: var(--el-color-danger);
}

/* ---- 开始配置：分段切换 ---- */

.channel-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md);
  background: var(--el-fill-color-light);
}

.channel {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 0;
  height: 34px;
  padding: 0 10px;
  border: 0;
  border-radius: var(--el-radius-sm);
  background: transparent;
  color: var(--el-text-color-regular);
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
}

.channel:hover {
  color: var(--el-color-primary);
}

.channel.is-active {
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  font-weight: 600;
  box-shadow: var(--el-box-shadow-light);
}

/* 未支撑的分段：把「为什么不能选」说清，而不是留一个能点却空转的面板 */
.channel-empty {
  padding: 12px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border: 1px dashed var(--el-border-color);
  border-radius: var(--el-radius-md);
}

/* ---- 种子 URL 卡片 ---- */

.url-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-md);
  background: var(--el-bg-color);
}

.url-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.url-card__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* 行数实时跟着输入走：URL 是逐行语义，用户需要立刻看到"现在算几条" */
.url-card__count {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

/* URL 正文用等宽：多行 URL 的对齐与可读性都靠它，普通比例字体会显得散 */
.url-card :deep(.el-textarea__inner) {
  font-family: ui-monospace, "Cascadia Mono", "Consolas", monospace;
  font-size: 12px;
  line-height: 1.7;
}

/* ---- 输出变量 ---- */

.output-box {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px dashed var(--el-border-color);
  border-radius: var(--el-radius-md);
}

.output-box__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.output-box__items {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.output-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 1px 7px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-sm);
  background: var(--el-fill-color-light);
}

.output-chip__name {
  font-family: ui-monospace, "Cascadia Mono", "Consolas", monospace;
  font-size: 12px;
  color: var(--el-color-primary);
}

.output-chip__type {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.output-chip__hint {
  font-style: normal;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.output-box__note {
  flex-basis: 100%;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
</style>

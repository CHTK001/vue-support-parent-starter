<!--
  数据库节点表单：来源集合、目标数据源 / 表、写入方式、字段映射、主键列与每批行数。
  参数顺序由 paramContext 统一决定（必填置顶、循环四参数在末尾）。
  表单额外补两块说明：来源集合与每批行数的真实语义、主键列必须先在字段映射里声明。
-->
<script setup lang="ts">
import { computed, ref } from "vue";
import { CreateTableDialog } from "@pages/datasource";
import ReButton from "@repo/ui/re-button";
import ParamField from "./ParamField.vue";
import { LOOP_PARAM_NAMES, useShapeFieldList } from "./paramContext";
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
}>();

const emit = defineEmits<{
  (e: "set-param", param: CollectParamMeta, value: unknown): void;
  (e: "set-pairs", param: CollectParamMeta, pairs: ParamPair[]): void;
}>();

/** 数据库节点专属参数，按后端 meta 的下发顺序排列 */
const { fields, valueOf, pairsOfParam } = useShapeFieldList(
  () => props.node,
  () => props.meta,
  ["source", "datasource", "table", "mode", "column:目标列", "key:主键列", "batchSize"],
);

/** 循环四参数名集合，用于给「循环」分段定位 */
const loopNames = new Set(LOOP_PARAM_NAMES);

/**
 * 实际渲染的参数：**数据源只有一个可选项、且当前值就是它时收起**。
 *
 * <p>台账为空时下拉里只有「本系统（当前应用库）」一项，常显一个单选项没有意义；但只要有第二个
 * 数据源、或这条流程指向的别的数据源，它就必须出现 —— 所以判据是「唯一项 且 当前值就是它（或还没填）」，
 * 而不是「选项数 == 1」。</p>
 */
const visibleFields = computed(() => {
  const options = props.ctx.datasourceOptions ?? [];
  const only = options.length === 1 ? String(options[0].value) : "";
  return fields.value.filter(param => {
    if (param.name !== "datasource" || !only) {
      return true;
    }
    const current = valueOf("datasource").trim();
    return current !== "" && current !== only;
  });
});

/* ---------------------------- 建表 / 补列（B9-3） ---------------------------- */

/** 弹窗可见性；预览 / 执行 / 列类型补齐都在共享组件里，这里只管「按什么建」 */
const ddlOpen = ref(false);

/** 已映射的目标列（字段映射左侧的列名，去掉空行） */
const ddlColumns = computed(() =>
  pairsOfParam("column:目标列").map(pair => String(pair.key ?? "").trim()).filter(Boolean),
);

/** 主键列：只保留同时出现在字段映射里的（后端就是这么校验的，缺了会在动表前报错） */
const ddlKeys = computed(() => {
  const mapped = new Set(ddlColumns.value);
  return pairsOfParam("key:主键列")
    .map(pair => String(pair.key ?? "").trim())
    .filter(name => Boolean(name) && mapped.has(name));
});

/**
 * 「建表 / 补列」按钮文案：由前端对表存在性（ctx.tableExists 三态）的判断决定。
 *
 * <p>用户诉求（2026-10-08）：入口不再看「是否已映射列」这类门槛，常驻在字段映射下方，
 * 点了就要出设计表对话框；该建表还是该补列由前端按表清单判断、对话框预览再兜底确认。
 * false=确认不存在 →「建表…」；true=已存在 →「补列…」；null=表清单还没读到 → 两者都给，不猜。</p>
 */
const ddlLabel = computed(() => {
  if (props.ctx.tableExists === false) return "建表…";
  if (props.ctx.tableExists === true) return "补列…";
  return "建表 / 补列…";
});

/**
 * 打开建表 / 补列。
 *
 * <p>数据源 / 表 / 列 / 主键都以 props 交给共享组件，这样组件自己就能补类型并预览，
 * 宿主不再需要为了「建个表」先拼一份请求、再实现一遍预览与执行。</p>
 */
function openDdl(): void {
  ddlOpen.value = true;
}

/**
 * 参数是否整行展示。
 *
 * <p>与 ParamField 内的宽控件判定保持一致（textarea / pairs / mapping / table）。
 * 外层属性面板是网格布局，字段被容器包一层后，宽控件必须由容器来占满整行。</p>
 *
 * @param param 参数元数据
 * @returns 是则返回 true
 */
function isWide(param: CollectParamMeta): boolean {
  return (
    param.type === "textarea" ||
    param.type === "pairs" ||
    param.type === "mapping" ||
    param.type === "table"
  );
}

/**
 * 判断某个字段是不是「循环」分段的第一个参数。
 *
 * <p>循环四参数由 orderedParams 统一追加在末尾，位置固定；命中它时插一条分段标题，
 * 把节点自身参数与循环配置分开，避免用户把循环参数当成节点必填项。</p>
 *
 * @param index 字段在 fields 里的下标
 * @returns 是分段首项返回 true
 */
function startsLoopSegment(index: number): boolean {
  // 必须与模板渲染的是同一个数组：参数被收起后下标会移动，用未过滤的 fields 会判错段首
  const list = visibleFields.value;
  const current = list[index];
  const previous = list[index - 1];
  return (
    index > 0 &&
    current !== undefined &&
    previous !== undefined &&
    loopNames.has(current.name) &&
    !loopNames.has(previous.name)
  );
}

/**
 * 前端补充的参数说明。
 *
 * <p>后端 meta 的 tip 对 textarea 只当占位符（输入后即消失），「每批行数」的 tip 又容易被
 * 误解成总量上限，主键列的校验时机也没说清；这里逐条补一句，只作用于本表单，不改后端。</p>
 */
const EXTRA_TIPS: Record<string, string> = {
  source: "填集合表达式，例 ${rows}；也接受单条映射（按一行处理）。抽取、SQL、链接节点的出参可直接喂进来。",
  mode: "追加 = 只插入；覆盖 = 先清空整表再插入（不需要主键）；按主键更新 = 先按主键查、再改或插（必须先声明 key: 主键列）。三者的写入语义不同，不是同一件事。",
  batchSize:
    "写入批次大小，默认 500：把结果集合按这个大小切片、每片一次数据库批提交。它不是总量上限 —— 抓了 400 行、这里填 200，就是分 2 批写两次；值全部走预编译绑定，按主键更新时每批一个事务。",
  "key:主键列":
    "只在「按主键更新」时生效：这里填的列必须先在「字段映射」里声明为某个目标列，否则会在建表 / 写数之前直接报错；联合主键填多条，右侧值留空。选「覆盖」时这一项会被忽略。",
};

/**
 * 写入方式的中文标签 —— 暂时保留为「待接线」，不要直接改这里的映射。
 *
 * <p>后端的 {@code CollectParamMeta.options} 类型是 {@code string[]}，label 与值共用同一个字符串，
 * 所以前端无法表达「值=update、显示=按主键更新」。要让下拉显示中文，必须先做二选一：</p>
 * <ul>
 *   <li>前端：把 {@code CollectParamMeta.options} 放宽为 {@code (string | { value; label })[]}，
 *       并让 ParamField 的 select 分支兼容两种形态（改 types/collect.ts + ParamField）；</li>
 *   <li>后端：给 metas 增加可带 label 的选项形态，让「写入方式」下发中文标签（需重新构建发布）。</li>
 * </ul>
 */
const MODE_LABELS: Record<string, string> = {
  append: "追加（只插入）",
  replace: "覆盖（先清空整表）",
  update: "按主键更新（改或插）",
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
</script>

<template>
  <div class="field field-wide node-intro">
    批量入库：把上游产出的集合整批写进目标表。表不存在会自动建、缺列会自动补，列类型按这一批
    实际取值推断；本节点不产采集记录，写入行数看节点摘要。
  </div>

  <template v-for="(param, index) in visibleFields" :key="param.name">
    <div v-if="startsLoopSegment(index)" class="field field-wide group-title">循环</div>

    <div class="field" :class="{ 'field-wide': isWide(param) }">
      <ParamField
        :param="param"
        :value="valueOf(param.name)"
        :pairs="pairsOfParam(param.name)"
        :node-id="node.id"
        :ctx="ctx"
        @update="(value: unknown) => emit('set-param', param, value)"
        @pairs="(value: ParamPair[]) => emit('set-pairs', param, value)"
      />
      <div v-if="extraTip(param.name)" class="field-tip">{{ extraTip(param.name) }}</div>
      <!-- 建表 / 补列：常驻入口（不要求已映射列，也不管表存不存在），点开即设计表；
           建表还是补列由前端按表清单判断（按钮文案），对话框预览再兜底确认 -->
      <div v-if="param.name === 'column:目标列'" class="ddl-actions">
        <ReButton text type="primary" @click="openDdl">{{ ddlLabel }}</ReButton>
        <span class="ddl-hint">
          打开设计表对话框：按上方映射的目标列建表或补缺失列（列类型 TEXT，与运行期自动建表同一套规则）；建完自动刷新左侧列候选。
        </span>
      </div>
    </div>
  </template>

  <!-- 共享建表对话框：预览 / 执行 / 类型补齐一份实现，建完刷新左侧列候选 -->
  <CreateTableDialog
    v-model="ddlOpen"
    :datasource="valueOf('datasource').trim()"
    :table="valueOf('table').trim()"
    :columns="ddlColumns"
    :primary-key="ddlKeys"
    @executed="ctx.refreshColumns()"
  />
</template>

<style scoped>
/* 参数容器：与 ParamField / genericForm 的字段样式保持一致，宽控件由容器占满整行 */
.field {
  min-width: 0;
}

.field-wide {
  grid-column: 1 / -1;
}

/* 节点级说明：一眼看清这个节点在流程里扮演什么角色 */
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

/* 分组标题：把节点自身参数与末尾的循环四参数分开（契约 §3.2） */
.group-title {
  margin: 12px 0 6px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

/* 前端补充的参数说明：后端 meta 没给 tip，或 tip 只当占位符时补一句「是什么 / 怎么用」 */
.field-tip {
  margin-top: 3px;
  font-size: 11px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}
/* 建表 / 补列入口：与「字段映射」贴在一起 */
.ddl-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  align-items: baseline;
  margin-top: 4px;
}

.ddl-hint {
  flex: 1 1 260px;
  min-width: 0;
  font-size: 11px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}
</style>

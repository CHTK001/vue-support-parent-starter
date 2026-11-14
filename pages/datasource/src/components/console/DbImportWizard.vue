<template>
  <!-- 弹窗态：横向步骤条 + 固定底部操作条 -->
  <ReDialog
    v-if="variant === 'dialog'"
    v-model="visible"
    :title="ctx.title"
    :subtitle="ctx.subtitle"
    :icon="Upload"
    width="980px"
    :close-on-click-modal="false"
    :close-on-press-escape="!ctx.running"
  >
    <WizardSteps :steps="stepItems" :current="ctx.step" direction="horizontal" />
    <div class="iw-body">
      <component :is="STEP_COMPONENTS[ctx.step]" :ctx="ctx" />
    </div>
    <template #footer>
      <ImportFooter :ctx="ctx" @close="close" />
    </template>
  </ReDialog>

  <!-- 页面态：同一套步骤体，竖向步骤轨可回点已完成步骤 -->
  <div v-else class="iw-page">
    <header class="iw-page-head">
      <div class="iw-page-title">
        <h3>导入数据</h3>
        <p>{{ ctx.subtitle }}</p>
      </div>
      <ReButton :disabled="ctx.running" @click="close">返回</ReButton>
    </header>
    <div class="iw-page-body">
      <aside class="iw-page-rail">
        <WizardSteps
          :steps="stepItems"
          :current="ctx.step"
          direction="vertical"
          clickable
          @select="ctx.goTo($event)"
        />
      </aside>
      <div class="iw-page-main">
        <component :is="STEP_COMPONENTS[ctx.step]" :ctx="ctx" />
      </div>
    </div>
    <div class="iw-page-foot">
      <ImportFooter :ctx="ctx" close-text="返回" @close="close" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 导入向导外壳。
 *
 * <p>七步流程（类型 → 文件 → 附加选项 → 目标表 → 字段映射 → 导入模式 → 执行）
 * 的状态与请求都在 {@code useImportWizard} 里，步骤体各自住在 {@code import/Step*.vue}。
 * 这一层只做三件事：选容器（弹窗 / 页面）、串步骤轨、挂底部操作条。</p>
 *
 * <p><b>为什么两种容器共用一份实现</b>：弹窗里配好的映射和页面里配好的映射
 * 必须是同一份状态，否则同样的操作在两种入口下行为不同 —— 这类分叉最难查。</p>
 */
import { computed, reactive, watch, type Component } from "vue";
import { Upload } from "@element-plus/icons-vue";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import WizardSteps from "./wizard/WizardSteps.vue";
import ImportFooter from "./import/ImportFooter.vue";
import StepType from "./import/StepType.vue";
import StepFile from "./import/StepFile.vue";
import StepOptions from "./import/StepOptions.vue";
import StepTarget from "./import/StepTarget.vue";
import StepMapping from "./import/StepMapping.vue";
import StepMode from "./import/StepMode.vue";
import StepRun from "./import/StepRun.vue";
import { useImportWizard, type ImportWizardCtx } from "./import/useImportWizard";

defineOptions({ name: "DbImportWizard" });

const visible = defineModel<boolean>({ default: false });

const props = defineProps<{
  /** 数据源 ID */
  datasourceId?: number;
  /** 初始库（从某张表右键进来时带上） */
  database?: string;
  /** 初始目标表 */
  tableName?: string;
  /** 容器：弹窗（默认）或整页 */
  variant?: "dialog" | "page";
}>();

const emit = defineEmits<{
  /** 导入成功后通知父级刷新表数据 */
  (e: "done", payload: { table: string; database: string }): void;
}>();

/** 步骤体组件，下标与步骤定义一一对应 */
const STEP_COMPONENTS: Component[] = [
  StepType,
  StepFile,
  StepOptions,
  StepTarget,
  StepMapping,
  StepMode,
  StepRun,
];

const variant = computed(() => props.variant ?? "dialog");

/**
 * 控制器。
 *
 * <p>必须包 {@code reactive}：composable 返回的是一堆 ref，包一层才会在模板里
 * 自动解包，写法就是普通的 {@code ctx.targetRows} 与 {@code v-model="ctx.mode"}。</p>
 */
const ctx = reactive(useImportWizard(props, emit)) as ImportWizardCtx;

/** 步骤轨的展示数据：标题 + 未走到的说明 + 已完成的摘要 */
const stepItems = computed(() =>
  ctx.steps.map((item, index) => ({
    title: item.title,
    desc: item.desc,
    summary: ctx.summaryOf(index),
  })),
);

/** 关闭：运行中先中断连接，否则后台循环会一直挂着 */
function close(): void {
  ctx.interrupt();
  visible.value = false;
}

/** 每次打开都重置：上一次的文件名、映射、日志都不该留在新向导里 */
watch(visible, open => {
  if (open) {
    ctx.reset();
  }
});
</script>

<style scoped>
/*
  正文按内容撑高，只兜一个下限：早前写死 380px，第 1 步（两张类型卡）
  下面会空出一大片。长步骤（预览表、映射表、日志）本来就有 max-height
  滚动，不需要固定高度来「保证」空间。
*/
.iw-body {
  min-height: 240px;
  max-height: 58vh;
  overflow-y: auto;
  padding: 16px 2px 6px;
}

/* ---------- 页面态 ---------- */
.iw-page {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md);
  background: var(--el-bg-color-page);
  overflow: hidden;
}
.iw-page-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.iw-page-title {
  flex: 1;
  min-width: 0;
}
.iw-page-title h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.iw-page-title p {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.iw-page-body {
  display: flex;
  gap: 12px;
  padding: 12px;
  align-items: flex-start;
}
.iw-page-rail {
  flex: none;
  width: 152px;
  padding: 12px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md);
  background: var(--el-bg-color);
}
.iw-page-main {
  flex: 1;
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md);
  background: var(--el-bg-color);
}
.iw-page-foot {
  padding: 10px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

@media (max-width: 860px) {
  .iw-page-rail {
    display: none;
  }
  .iw-body {
    max-height: 62vh;
  }
}
</style>

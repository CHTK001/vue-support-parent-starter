<!--
   采集器属性快速编辑弹窗：采集管理列表里点「编辑」打开。

   与「流程设计」的分工：设计器承载画布（节点 / 连线 / 参数），本弹窗只改
   dsl 之外的实体属性（名称 / 编码 / 分类 / 调度 / 并发 / 线程 / 备注）。
   函数库 / 变量 / 通知三张表都有「编辑」入口，采集管理此前只有「流程设计」，
   改个名字或 cron 要开整屏设计器再点齿轮，这里补上列表侧的等价入口。

   dsl 原样回传：CollectFlowSave 必填 dsl，所以打开时先取 /flow/detail，
   保存时把取回来的 dsl 原样拼回去 —— 画布内容零改动，只更新实体字段。
   detail 拿不到 dsl（脏数据）时直接拒绝保存，不把用户的流程内容覆盖成空。
-->
<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { msgError, msgSuccess, msgWarning } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReCron from "@repo/ui/re-cron";
import ReDialog from "@repo/ui/re-dialog";
import ReInput from "@repo/ui/re-input";
import ReInputNumber from "@repo/ui/re-input-number";
import ReSelect from "@repo/ui/re-select";
import type { ReOption } from "@repo/ui/re-select";
import { fetchCategoryOptions, getFlow, updateFlow } from "../api/collectApi";
import { errText } from "../composables/useCollectView";
import type { CollectDsl, CollectFlow, CollectOption } from "../types/collect";

const props = defineProps<{
  modelValue: boolean;
  /** 要编辑的采集器 ID；null 表示没有可编辑的行（弹窗不会打开） */
  flowId?: number | null;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "saved", flowId: number): void;
}>();

const loading = ref(false);
const saving = ref(false);

/** ReCron 回报非法（且表达式非空）时拦截保存：留空是「不定时调度」，不算错 */
const cronBroken = ref(false);

const categoryOptions = ref<CollectOption[]>([]);

/** detail 取回的原样 dsl：保存时原样拼回，画布零改动 */
const detailDsl = ref<CollectDsl | null>(null);

const form = reactive({
  name: "",
  code: "",
  categoryId: 0,
  cron: "",
  concurrency: 1,
  threadCount: 4,
  remark: "",
});

const categorySelectOptions = computed<ReOption[]>(() => [
  { label: "未分类", value: 0 },
  ...categoryOptions.value.map((item) => ({ label: item.label, value: Number(item.value) })),
]);

/** 打开即取详情与分类选项；两次请求并行，互不依赖 */
watch(
  () => [props.modelValue, props.flowId] as const,
  async ([visible, flowId]) => {
    if (!visible || !flowId) {
      return;
    }
    cronBroken.value = false;
    loading.value = true;
    try {
      const [flow, options] = await Promise.all([
        getFlow(flowId),
        fetchCategoryOptions(),
      ]);
      categoryOptions.value = options ?? [];
      if (!flow) {
        msgError("没有取到这个采集器，可能已被删除");
        emit("update:modelValue", false);
        return;
      }
      applyFlow(flow);
    } catch (error) {
      msgError(errText(error));
    } finally {
      loading.value = false;
    }
  },
  { immediate: true },
);

function applyFlow(flow: CollectFlow): void {
  detailDsl.value = flow.dsl;
  form.name = flow.collectFlowName ?? "";
  form.code = flow.collectFlowCode ?? "";
  form.categoryId = flow.collectFlowCategoryId ?? 0;
  form.cron = flow.collectFlowCron ?? "";
  form.concurrency = flow.collectFlowConcurrency || 1;
  form.threadCount = flow.collectFlowThreadCount || 4;
  form.remark = flow.collectFlowRemark ?? "";
}

/** ReCron 回报合法性：留空是「不定时调度」，不算错 */
function onCronChange(expression: string, valid: boolean): void {
  cronBroken.value = !valid && Boolean(expression.trim());
}

async function save(): Promise<void> {
  if (!form.name.trim()) {
    msgWarning("请填写采集器名称");
    return;
  }
  if (cronBroken.value) {
    msgWarning("cron 表达式不合法，请修正后再保存");
    return;
  }
  if (!detailDsl.value) {
    msgError("这个采集器的流程数据缺失（可能是脏数据），请改用「流程设计」打开保存一次");
    return;
  }
  saving.value = true;
  try {
    const saved = await updateFlow({
      collectFlowId: props.flowId,
      collectFlowName: form.name.trim(),
      collectFlowCategoryId: form.categoryId || 0,
      collectFlowCode: form.code.trim() || null,
      collectFlowCron: form.cron.trim() || null,
      collectFlowConcurrency: form.concurrency,
      collectFlowThreadCount: form.threadCount,
      collectFlowRemark: form.remark || null,
      dsl: detailDsl.value,
    });
    emit("saved", saved.collectFlowId);
    msgSuccess(`已保存（ID ${saved.collectFlowId}）`);
    emit("update:modelValue", false);
  } catch (error) {
    msgError(errText(error));
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <ReDialog
    :model-value="modelValue"
    title="编辑采集器"
    :width="620"
    :close-on-click-modal="false"
    v-loading="loading"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="collect-form">
      <div class="collect-form__item">
        <span class="collect-form__label"><i class="req">*</i>采集器名称</span>
        <ReInput v-model="form.name" maxlength="128" placeholder="必填，不超过 128 字" />
      </div>
      <div class="collect-form__item">
        <span class="collect-form__label">采集器编码</span>
        <ReInput v-model="form.code" maxlength="64" placeholder="留空保持不变" />
      </div>
      <div class="collect-form__item">
        <span class="collect-form__label">分类</span>
        <ReSelect v-model="form.categoryId" style="width: 100%" :options="categorySelectOptions" />
      </div>
      <div class="collect-form__item collect-form__item--stack">
        <span class="collect-form__label">自动调度</span>
        <ReCron
          v-model="form.cron"
          :preview-count="5"
          placeholder="6 段表达式，留空表示不定时调度"
          @change="onCronChange"
        />
      </div>
      <div class="collect-form__item">
        <span class="collect-form__label">并发数</span>
        <ReInputNumber v-model="form.concurrency" :min="1" :max="32" controls-position="right" />
        <span class="collect-hint collect-hint--muted">同一流程在途任务上限，超出时本次触发跳过</span>
      </div>
      <div class="collect-form__item">
        <span class="collect-form__label">线程数</span>
        <ReInputNumber v-model="form.threadCount" :min="1" :max="64" controls-position="right" />
        <span class="collect-hint collect-hint--muted">流程内节点并行执行线程数</span>
      </div>
      <div class="collect-form__item collect-form__item--stack">
        <span class="collect-form__label">备注</span>
        <ReInput v-model="form.remark" type="textarea" :rows="2" />
      </div>
    </div>
    <template #footer="{ cancel }">
      <ReButton @click="cancel">关闭</ReButton>
      <ReButton type="primary" :loading="saving" @click="save">保存</ReButton>
    </template>
  </ReDialog>
</template>

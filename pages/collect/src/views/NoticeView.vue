<!--
  执行通知配置。

  后端语义必须在界面上体现：
  1. 渠道清单来自 /notice/channels（Spring Bean + SPI 注册表），前端不写死渠道，
     接收目标输入框的提示直接取渠道自带的 targetHint；
  2. collectNoticeFlowId=0 表示对全部流程生效，命中时全局与本流程的配置都会发送；
  3. 触发时机只有 SUCCESS/FAILURE/ALWAYS，STOPPED/SKIPPED 仅 ALWAYS 会发；
  4. 投递在后台线程串行执行，失败只写进「最近结果」，不改变任务终态；
  5. 试运行（TEST 触发）不发通知，所以配好渠道后用「试发」按钮验证。
-->
<script setup lang="ts">
import { computed, onActivated, reactive, ref } from "vue";
import { msgError, msgInfo, msgSuccess, msgWarning } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReInput from "@repo/ui/re-input";
import ReSelect from "@repo/ui/re-select";
import ReSwitch from "@repo/ui/re-switch";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import type { ReOption } from "@repo/ui/re-select";
import type { ReTableColumn, ReTableSearchConfig } from "@repo/ui/re-table";
import {
  deleteNotice,
  fetchNoticeChannels,
  listFlows,
  listNotices,
  saveNotice,
  testNotice,
  updateNotice,
} from "../api/collectApi";
import { confirmAction, errText, useCollectView } from "../composables/useCollectView";
import type { CollectNotice, CollectNotifyChannel, CollectNotifyResult } from "../types/collect";

defineOptions({ name: "CollectNotice" });

/** keep-alive 命中后挂载只跑一次，重进页面靠激活钩子取新数据 */
let firstActivation = true;
onActivated(() => {
  if (firstActivation) {
    firstActivation = false;
    return;
  }
  void reload();
});

/** 全部流程的约定值，与后端 CollectNoticeServiceImpl.ALL_FLOWS 一致 */
const ALL_FLOWS = 0;

/** 触发时机，与后端 CollectNotifyTiming 一致 */
const TIMINGS: { value: string; label: string; tag: "success" | "danger" | "warning" }[] = [
  { value: "SUCCESS", label: "仅成功", tag: "success" },
  { value: "FAILURE", label: "仅失败", tag: "danger" },
  { value: "ALWAYS", label: "每次执行后", tag: "warning" },
];

/** 标题与正文里可用的模板变量 */
const TEMPLATE_VARS = "${flowName} ${flowId} ${taskId} ${taskNo} ${status} ${statusText} ${trigger} "
  + "${cost} ${nodeCount} ${requestCount} ${recordCount} ${error} ${beginTime} ${endTime} ${executorId}";

const rows = ref<CollectNotice[]>([]);
const channels = ref<CollectNotifyChannel[]>([]);
const flows = ref<ReOption[]>([]);
/** 内置搜索区的草稿值：collectNoticeFlowId 为 "" 表示不加流程条件 */
const searchModel = ref<Record<string, unknown>>({ collectNoticeFlowId: "" });
const visible = ref(false);
const saving = ref(false);
const testingId = ref<number | null>(null);
const form = reactive({
  collectNoticeId: null as number | null,
  collectNoticeName: "",
  collectNoticeFlowId: ALL_FLOWS as number,
  collectNoticeChannel: "",
  collectNoticeTarget: "",
  collectNoticeTiming: "FAILURE",
  collectNoticeSubject: "",
  collectNoticeContent: "",
  collectNoticeEnabled: 1,
});

/** 渠道标识到显示名 */
const channelLabels = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {};
  for (const channel of channels.value) {
    map[channel.value] = channel.label;
  }
  return map;
});

/** 渠道下拉，label 用后端注册表的显示名 */
const channelOptions = computed<ReOption[]>(() => channels.value.map(c => ({ label: c.label, value: c.value })));

/** 时机下拉 */
const timingOptions = computed<ReOption[]>(() => TIMINGS.map(t => ({ label: t.label, value: t.value })));

/** 流程下拉：0 = 全部流程，与后端约定一致 */
const flowOptions = computed<ReOption[]>(() => [
  { label: "全部流程", value: ALL_FLOWS },
  ...flows.value.map(f => ({ label: f.label, value: Number(f.value) })),
]);

/**
 * 筛选下拉。后端 /notice/list 的 flowId 是严格等值过滤，
 * 所以「不选」才是不限流程，选 0 只看全局配置，两者不能混为一谈。
 */
const filterOptions = computed<ReOption[]>(() => [
  { label: "全局配置（适用所有流程）", value: ALL_FLOWS },
  ...flows.value.map(f => ({ label: f.label, value: Number(f.value) })),
]);

/** 内置搜索区：必须是 computed，流程下拉的选项要跟着流程列表刷新 */
const SEARCH = computed<ReTableSearchConfig>(() => ({
  title: "搜索通知配置",
  showRefreshBtn: false,
  filters: [
    {
      key: "collectNoticeFlowId",
      label: "适用流程",
      type: "select",
      placeholder: "不限流程",
      options: filterOptions.value,
      attrs: { filterable: true },
    },
  ],
}));

/** 搜索区选出来的流程：空=不限流程，0=只看全局配置（后端是严格等值过滤） */
function pickedFlowId(): number | undefined {
  const picked = searchModel.value.collectNoticeFlowId;
  return picked === "" || picked === undefined || picked === null ? undefined : Number(picked);
}

/** 当前所选渠道的目标填写提示，未选渠道时给通用说明 */
const targetHint = computed<string>(() => {
  const matched = channels.value.find(c => c.value === form.collectNoticeChannel);
  return matched?.targetHint || "接收目标";
});

const columns = computed<ReTableColumn[]>(() => [
  { prop: "collectNoticeName", label: "名称", minWidth: 140, showOverflowTooltip: true },
  { prop: "collectNoticeFlowId", label: "适用流程", minWidth: 140, slot: "flow", showOverflowTooltip: true },
  { prop: "collectNoticeChannel", label: "渠道", width: 100, slot: "channel" },
  { prop: "collectNoticeTarget", label: "接收目标", minWidth: 200, showOverflowTooltip: true },
  { prop: "collectNoticeTiming", label: "时机", width: 110, slot: "timing", align: "center" },
  { prop: "collectNoticeEnabled", label: "启用", width: 76, slot: "enabled", align: "center" },
  { prop: "collectNoticeLastResult", label: "最近结果", minWidth: 220, slot: "last" },
  { prop: "collectNoticeLastTime", label: "最近发送", width: 176 },
  { prop: "action", label: "操作", width: 140, slot: "action", fixed: "right" },
]);

const { loading, reload } = useCollectView(async () => {
  const [notices, registered, flowList] = await Promise.all([
    listNotices(pickedFlowId()),
    fetchNoticeChannels(),
    listFlows(),
  ]);
  rows.value = notices ?? [];
  channels.value = registered ?? [];
  flows.value = (flowList ?? []).map(f => ({
    value: String(f.collectFlowId),
    label: f.collectFlowName ?? String(f.collectFlowId),
  }));
  if (!form.collectNoticeChannel && channels.value.length) {
    form.collectNoticeChannel = channels.value[0].value;
  }
});

/** 查询/重置：本页是前端整表加载，ReTable 不会替我们回源，必须重拉一次清单 */
function applySearch(): void {
  void reload();
}

function flowLabel(flowId?: number | null): string {
  if (flowId === null || flowId === undefined || flowId === ALL_FLOWS) {
    return "全部流程";
  }
  return flows.value.find(f => Number(f.value) === flowId)?.label ?? `流程#${flowId}`;
}

function timingLabel(timing?: string | null): string {
  return TIMINGS.find(t => t.value === timing)?.label ?? (timing || "—");
}

function timingTag(timing?: string | null): "success" | "danger" | "warning" | "info" {
  return TIMINGS.find(t => t.value === timing)?.tag ?? "info";
}

function openCreate(): void {
  form.collectNoticeId = null;
  form.collectNoticeName = "";
  form.collectNoticeFlowId = ALL_FLOWS;
  form.collectNoticeChannel = channels.value[0]?.value ?? "";
  form.collectNoticeTarget = "";
  form.collectNoticeTiming = "FAILURE";
  form.collectNoticeSubject = "";
  form.collectNoticeContent = "";
  form.collectNoticeEnabled = 1;
  visible.value = true;
}

function openEdit(input: Record<string, unknown>): void {
  const row = input as unknown as CollectNotice;
  form.collectNoticeId = row.collectNoticeId ?? null;
  form.collectNoticeName = row.collectNoticeName ?? "";
  form.collectNoticeFlowId = row.collectNoticeFlowId ?? ALL_FLOWS;
  form.collectNoticeChannel = row.collectNoticeChannel ?? "";
  form.collectNoticeTarget = row.collectNoticeTarget ?? "";
  form.collectNoticeTiming = row.collectNoticeTiming ?? "FAILURE";
  form.collectNoticeSubject = row.collectNoticeSubject ?? "";
  form.collectNoticeContent = row.collectNoticeContent ?? "";
  form.collectNoticeEnabled = row.collectNoticeEnabled ?? 1;
  visible.value = true;
}

async function save(): Promise<void> {
  if (!form.collectNoticeName.trim()) {
    msgWarning("请填写通知名称");
    return;
  }
  if (!form.collectNoticeChannel) {
    msgWarning("请选择渠道");
    return;
  }
  if (!form.collectNoticeTarget.trim()) {
    msgWarning(targetHint.value);
    return;
  }
  saving.value = true;
  try {
    const dto: CollectNotice = {
      collectNoticeId: form.collectNoticeId,
      collectNoticeFlowId: form.collectNoticeFlowId,
      collectNoticeName: form.collectNoticeName.trim(),
      collectNoticeChannel: form.collectNoticeChannel,
      collectNoticeTarget: form.collectNoticeTarget.trim(),
      collectNoticeTiming: form.collectNoticeTiming,
      collectNoticeSubject: form.collectNoticeSubject,
      collectNoticeContent: form.collectNoticeContent,
      collectNoticeEnabled: form.collectNoticeEnabled,
    };
    if (form.collectNoticeId) {
      await updateNotice(dto);
      msgSuccess("通知配置已更新");
    } else {
      await saveNotice(dto);
      msgSuccess("通知配置已创建");
    }
    visible.value = false;
    await reload();
  } catch (error) {
    msgError(errText(error));
  } finally {
    saving.value = false;
  }
}

async function toggleEnabled(input: Record<string, unknown>, enabled: unknown): Promise<void> {
  const row = input as unknown as CollectNotice;
  if (!row.collectNoticeId) {
    return;
  }
  try {
    await updateNotice({ ...row, collectNoticeEnabled: Number(enabled) });
    msgSuccess(Number(enabled) === 1 ? "已启用" : "已停用");
  } catch (error) {
    msgError(errText(error));
  } finally {
    await reload();
  }
}

async function test(input: Record<string, unknown>): Promise<void> {
  const row = input as unknown as CollectNotice;
  if (!row.collectNoticeId) {
    return;
  }
  testingId.value = row.collectNoticeId;
  try {
    const result: CollectNotifyResult | null = await testNotice(row.collectNoticeId);
    if (result?.success) {
      msgSuccess(`试发成功${result.messageId ? ` · ${result.messageId}` : ""}（${result.durationMillis ?? 0}ms）`);
    } else {
      msgError(`试发失败：${result?.errorMessage ?? "渠道无响应"}`);
    }
    await reload();
  } catch (error) {
    msgError(errText(error));
  } finally {
    testingId.value = null;
  }
}

async function remove(input: Record<string, unknown>): Promise<void> {
  const row = input as unknown as CollectNotice;
  if (!row.collectNoticeId || !(await confirmAction(`确认删除通知「${row.collectNoticeName}」？`, "删除通知"))) {
    return;
  }
  try {
    await deleteNotice(row.collectNoticeId);
    msgSuccess("通知已删除");
    await reload();
  } catch (error) {
    msgError(errText(error));
  }
}

function showHelp(): void {
  msgInfo(`标题与正文留空即用平台默认模板。可用变量：${TEMPLATE_VARS}`);
}
</script>

<template>
  <div class="collect-page">
    <ReTable
      class="collect-card"
      table-id="collect-notice"
      :loading="loading"
      :data="rows"
      :columns="columns"
      :pagination="false"
      row-key="collectNoticeId"
      v-model:search-model="searchModel"
      :search="SEARCH"
      empty-text="暂无通知配置"
      stripe
      @search="applySearch"
      @search-reset="applySearch"
      @refresh="reload"
    >
      <template #toolbar>
        <ReButton icon="QuestionFilled" title="查看标题与正文可用的模板变量" @click="showHelp">查看标题与正文可用的模板变量</ReButton>
        <ReButton icon="Plus" type="primary" title="新建通知" @click="openCreate">新建通知</ReButton>
        <span class="collect-hint">任务进入终态后按命中时机异步投递，投递失败只记在「最近结果」，不改任务终态</span>
      </template>

      <template #flow="{ row }">{{ flowLabel(row.collectNoticeFlowId as number | undefined) }}</template>
      <template #channel="{ row }">
        <ReTag size="small" effect="plain">{{ channelLabels[row.collectNoticeChannel as string] ?? row.collectNoticeChannel }}</ReTag>
      </template>
      <template #timing="{ row }">
        <ReTag size="small" :type="timingTag(row.collectNoticeTiming as string | undefined)">
          {{ timingLabel(row.collectNoticeTiming as string | undefined) }}
        </ReTag>
      </template>
      <template #enabled="{ row }">
        <ReSwitch
          size="small"
          :model-value="row.collectNoticeEnabled"
          :active-value="1"
          :inactive-value="0"
          @update:model-value="(v: unknown) => toggleEnabled(row, v)"
        />
      </template>
      <template #last="{ row }">
        <span
          class="collect-cell-ellipsis"
          :title="`${row.collectNoticeLastResult ?? ''}\n${row.collectNoticeLastTime ?? ''}`"
        >
          {{ row.collectNoticeLastResult || "—" }}
        </span>
      </template>
      <template #action="{ row }">
        <ReButton layout="square" icon="Edit" type="primary" tip="编辑这条通知配置" @click="openEdit(row)"/>
        <ReButton
          layout="square"
          icon="Promotion"
          type="warning"
          :loading="testingId === row.collectNoticeId"
          tip="按这条配置试发一次（试运行不发通知，只能用这里验证渠道）"
          @click="test(row)"
        />
        <ReButton layout="square" icon="Delete" type="danger" tip="删除这条通知配置" @click="remove(row)"/>
      </template>
    </ReTable>

    <ReDialog
      v-model="visible"
      :title="form.collectNoticeId ? '编辑通知' : '新建通知'"
      :width="640"
      :close-on-click-modal="false"
    >
      <div class="collect-form">
        <div class="collect-form__item">
          <span class="collect-form__label"><i class="req">*</i>名称</span>
          <ReInput v-model="form.collectNoticeName" size="small" maxlength="64" placeholder="如 生产失败告警"/>
        </div>
        <div class="collect-form__item">
          <span class="collect-form__label">适用流程</span>
          <ReSelect v-model="form.collectNoticeFlowId" size="small" style="width: 100%" :options="flowOptions"/>
          <span class="collect-hint collect-hint--muted">选「全部流程」时对所有流程生效，且与单流程配置同时发送</span>
        </div>
        <div class="collect-form__item">
          <span class="collect-form__label"><i class="req">*</i>渠道</span>
          <ReSelect
            v-model="form.collectNoticeChannel"
            size="small"
            style="width: 100%"
            :options="channelOptions"
            placeholder="选择已注册的渠道"
          />
        </div>
        <div class="collect-form__item">
          <span class="collect-form__label"><i class="req">*</i>接收目标</span>
          <ReInput v-model="form.collectNoticeTarget" size="small" :placeholder="targetHint"/>
        </div>
        <div class="collect-form__item">
          <span class="collect-form__label">触发时机</span>
          <ReSelect v-model="form.collectNoticeTiming" size="small" style="width: 100%" :options="timingOptions"/>
          <span class="collect-hint collect-hint--muted">手动停止与跳过的任务只有「每次执行后」会发</span>
        </div>
        <div class="collect-form__item">
          <span class="collect-form__label">标题模板</span>
          <ReInput v-model="form.collectNoticeSubject" size="small" placeholder="留空用默认：【数据采集】${flowName} ${statusText}"/>
        </div>
        <div class="collect-form__item collect-form__item--stack">
          <span class="collect-form__label">正文模板</span>
          <ReInput
            v-model="form.collectNoticeContent"
            class="content-input"
            type="textarea"
            :rows="4"
            placeholder="留空用平台默认正文，支持 ${} 变量"
          />
          <span class="collect-hint collect-hint--muted collect-vars">{{ TEMPLATE_VARS }}</span>
        </div>
        <div class="collect-form__item">
          <span class="collect-form__label">启用</span>
          <ReSwitch v-model="form.collectNoticeEnabled" :active-value="1" :inactive-value="0"/>
        </div>
      </div>
      <template #footer="{ cancel }">
        <ReButton size="small" @click="cancel">取消</ReButton>
        <ReButton size="small" type="primary" :loading="saving" @click="save">保存</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped>
.content-input :deep(textarea) {
  font-family: var(--el-font-family-mono, monospace);
  font-size: 12px;
}

.collect-vars {
  font-family: var(--el-font-family-mono, monospace);
  word-break: break-all;
}
</style>

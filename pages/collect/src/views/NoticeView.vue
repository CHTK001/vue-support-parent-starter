<!--
  执行通知配置（全局）。

  通知是平台级配置，不再按采集器 / 流程隔离：所有采集器共用这一份清单，
  触发时按「时机」投递。所以这里没有「适用流程」列，也没有流程筛选 ——
  后端表里已经没有流程列，界面上更不该留一个改不动的影子字段。

  后端语义必须在界面上体现：
  1. 渠道清单来自 /notice/channels（Spring Bean + SPI 注册表），前端不写死渠道，
     接收目标输入框的提示直接取渠道自带的 targetHint；
  2. 触发时机只有 SUCCESS/FAILURE/ALWAYS，STOPPED/SKIPPED 仅 ALWAYS 会发；
  3. 投递在后台线程串行执行，失败只写进「最近结果」，不改变任务终态；
  4. 试运行（TEST 触发）不发通知，所以配好渠道后用「试发」按钮验证。
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
import { formatDuration } from "@repo/ui/re-time";
import { costMs } from "@repo/utils";
import type { ReOption } from "@repo/ui/re-select";
import type { ReTableColumn } from "@repo/ui/re-table";
import {
  deleteNotice,
  fetchNoticeChannels,
  listNotices,
  saveNotice,
  testNotice,
  updateNotice,
} from "../api/collectApi";
import { COLLECT_ACTIONS } from "../constants/actionColumns";
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
const visible = ref(false);
const saving = ref(false);
const testingId = ref<number | null>(null);
const form = reactive({
  collectNoticeId: null as number | null,
  collectNoticeName: "",
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

const columns = computed<ReTableColumn[]>(() => [
  { prop: "collectNoticeName", label: "名称", minWidth: 140, showOverflowTooltip: true },
  { prop: "collectNoticeChannel", label: "渠道", width: 100, slot: "channel" },
  { prop: "collectNoticeTarget", label: "接收目标", minWidth: 200, showOverflowTooltip: true },
  { prop: "collectNoticeTiming", label: "时机", width: 110, slot: "timing", align: "center" },
  { prop: "collectNoticeEnabled", label: "启用", width: 76, slot: "enabled", align: "center" },
  { prop: "collectNoticeLastResult", label: "最近结果", minWidth: 220, slot: "last" },
  { prop: "collectNoticeLastTime", label: "最近发送", width: 176 },
  { prop: "action", label: "操作", width: 140, slot: "action", fixed: "right" },
]);

const { loading, reload } = useCollectView(async () => {
  const [notices, registered] = await Promise.all([listNotices(), fetchNoticeChannels()]);
  rows.value = notices ?? [];
  channels.value = registered ?? [];
  if (!form.collectNoticeChannel && channels.value.length) {
    form.collectNoticeChannel = channels.value[0].value;
  }
});

/** 当前所选渠道的目标填写提示，未选渠道时给通用说明 */
const targetHint = computed<string>(() => {
  const matched = channels.value.find(c => c.value === form.collectNoticeChannel);
  return matched?.targetHint || "接收目标";
});

function timingLabel(timing?: string | null): string {
  return TIMINGS.find(t => t.value === timing)?.label ?? (timing || "—");
}

function timingTag(timing?: string | null): "success" | "danger" | "warning" | "info" {
  return TIMINGS.find(t => t.value === timing)?.tag ?? "info";
}

function openCreate(): void {
  form.collectNoticeId = null;
  form.collectNoticeName = "";
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
      // 耗时走 ReTime 同一份格式化，空值不编造 0
      const cost = costMs(result.durationMillis);
      const costText = cost != null ? `（${formatDuration(cost)}）` : "";
      msgSuccess(`试发成功${result.messageId ? ` · ${result.messageId}` : ""}${costText}`);
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
      empty-text="暂无通知配置"
      stripe
      @refresh="reload"
    >
      <template #toolbar>
        <ReButton icon="QuestionFilled" title="查看标题与正文可用的模板变量" @click="showHelp">查看标题与正文可用的模板变量</ReButton>
        <ReButton icon="Plus" type="primary" title="新建通知" @click="openCreate">新建通知</ReButton>
        <span class="collect-hint">这份清单对所有采集器生效；任务进入终态后按命中时机异步投递，投递失败只记在「最近结果」，不改任务终态</span>
      </template>

      <template #channel="{ row }">
        <ReTag  effect="plain">{{ channelLabels[row.collectNoticeChannel as string] ?? row.collectNoticeChannel }}</ReTag>
      </template>
      <template #timing="{ row }">
        <ReTag  :type="timingTag(row.collectNoticeTiming as string | undefined)">
          {{ timingLabel(row.collectNoticeTiming as string | undefined) }}
        </ReTag>
      </template>
      <template #enabled="{ row }">
        <ReSwitch
          
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
        <ReButton v-bind="COLLECT_ACTIONS.editNotice" layout="square" @click="openEdit(row)"/>
        <ReButton
          v-bind="COLLECT_ACTIONS.testNotice"
          layout="square"
          :loading="testingId === row.collectNoticeId"
          @click="test(row)"
        />
        <ReButton v-bind="COLLECT_ACTIONS.deleteNotice" layout="square" @click="remove(row)"/>
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
          <ReInput v-model="form.collectNoticeName"  maxlength="64" placeholder="如 生产失败告警"/>
        </div>
        <div class="collect-form__item">
          <span class="collect-form__label"><i class="req">*</i>渠道</span>
          <ReSelect
            v-model="form.collectNoticeChannel"
            
            style="width: 100%"
            :options="channelOptions"
            placeholder="选择已注册的渠道"
          />
        </div>
        <div class="collect-form__item">
          <span class="collect-form__label"><i class="req">*</i>接收目标</span>
          <ReInput v-model="form.collectNoticeTarget"  :placeholder="targetHint"/>
        </div>
        <div class="collect-form__item">
          <span class="collect-form__label">触发时机</span>
          <ReSelect v-model="form.collectNoticeTiming"  style="width: 100%" :options="timingOptions"/>
          <span class="collect-hint collect-hint--muted">手动停止与跳过的任务只有「每次执行后」会发</span>
        </div>
        <div class="collect-form__item">
          <span class="collect-form__label">标题模板</span>
          <ReInput v-model="form.collectNoticeSubject"  placeholder="留空用默认：【数据采集】${flowName} ${statusText}"/>
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
        <ReButton  @click="cancel">取消</ReButton>
        <ReButton  type="primary" :loading="saving" @click="save">保存</ReButton>
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

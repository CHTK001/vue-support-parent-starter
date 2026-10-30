<script setup lang="ts">
/**
 * 主机调度信息页（右键菜单：规则展示 / 增 / 改 / 查）
 *
 * <p>按主机维度管理计划任务：规则名、执行表达式（cron）、目标平台（win / linux / mac，
 * 空 = 全部）、平台命令、备注。增删改走后端 SPI（{@code /ms/server/host/{id}/schedule}），
 * 各平台的命令执行器由后端按 platform 字段展开。</p>
 *
 * @author CH
 * @since 4.0.0.44
 */
import { computed, onMounted, ref } from "vue";
import { message } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReIcon from "@repo/ui/re-icon";
import ReInput from "@repo/ui/re-input";
import {
  listSchedules,
  saveSchedule,
  updateSchedule,
  delSchedule,
  type ScheduleDraft,
  type ScheduleItem,
  type SchedulePayload,
} from "../api";

const props = withDefaults(
  defineProps<{
    /** 主机 id（右键菜单的命中主机） */
    hostId: number;
    /** 主机名（展示用） */
    hostName: string;
  }>(),
  { hostId: 0, hostName: "" },
);

/** 列表与加载态 */
const rows = ref<ScheduleItem[]>([]);
const loading = ref(false);
const keyword = ref("");

/** 平台选项（all = 空平台，全部主机） */
const platformOptions = ["win", "linux", "mac", "all"] as const;

/** 主机的调度列表（hostId 变空时停止拉取） */
const hostId4 = computed(() => props.hostId);

/** 平台展示 */
function platformLabel(p?: string): string {
  return p === "win" ? "Windows" : p === "linux" ? "Linux" : p === "mac" ? "macOS" : "全部";
}
const filtered = computed(() => {
  const k = keyword.value.trim().toLowerCase();
  if (!k) return rows.value;
  return rows.value.filter(
    (r: ScheduleItem) =>
      (r.msScheduleName ?? "").toLowerCase().includes(k) ||
      (r.command ?? "").toLowerCase().includes(k) ||
      (r.remark ?? "").toLowerCase().includes(k),
  );
});

/** 行变表单 */
function toPayload(): SchedulePayload {
  return {
    msScheduleName: draft.value?.name ?? "",
    expression: draft.value?.expression ?? "",
    platform: draft.value?.platform,
    command: draft.value?.command ?? "",
    remark: draft.value?.remark ?? "",
  };
}

onMounted(load);

async function load(): Promise<void> {
  if (!hostId4.value) return;
  loading.value = true;
  try {
    rows.value = await listSchedules(hostId4.value, {});
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    loading.value = false;
  }
}

/** 新增/编辑回调：根据主键是否存在判断 */
async function save(payload: SchedulePayload): Promise<void> {
  if (!payload.msScheduleName || !payload.expression || !payload.command) {
    message.warning("请补全：规则名 / 表达式 / 执行命令");
    return;
  }
  try {
    if (draft.value?.id) {
      await updateSchedule(props.hostId, draft.value.id, payload);
      message.success("已修改");
    } else {
      await saveSchedule(props.hostId, payload);
      message.success("已新增");
    }
    await load();
    dialogOpen.value = false;
  } catch (e) {
    message.error((e as Error).message);
  }
}

/** 删除前确认 */
async function remove(item: ScheduleItem): Promise<void> {
  try {
    await message.confirm(`确认删除调度「${item.msScheduleName}」？`);
    await delSchedule(props.hostId, item.id);
    message.success("已删除");
    await load();
  } catch (e) {
    message.error((e as Error).message);
  }
}

/** 编辑态 */
const draft = ref<ScheduleDraft | null>(null);
const dialogOpen = ref(false);

/** 打开编辑（没有主键时为新增） */
function openDraft(item?: ScheduleItem): void {
  draft.value = item
    ? {
        id: item.id,
        hostId: item.hostId,
        msScheduleName: item.msScheduleName,
        name: item.msScheduleName,
        expression: item.expression,
        platform: item.platform ?? "linux",
        command: item.command ?? "",
        remark: item.remark ?? "",
        status: item.status,
        createdAt: item.createdAt,
      }
    : {
        id: 0,
        msScheduleName: "",
        name: "",
        expression: "",
        platform: "linux",
        command: "",
        remark: "",
      };
  dialogOpen.value = true;
}
</script>

<template>
  <div class="sched">
    <div class="sched__head">
      <ReIcon name="Clock" :size="12" />
      <span class="sched__head-title">{{ hostName }} · 调度信息</span>
      <span class="lb-spacer" />
      <ReInput v-model="keyword" placeholder="按规则名 / 命令 / 备注搜索" clearable class="sched__search" />
      <ReButton @click.stop="() => openDraft()">新增</ReButton>
    </div>

    <div class="sched__table">
      <div class="sched__row sched__row--head">
        <div class="sched__cell sched__cell--1">规则名</div>
        <div class="sched__cell sched__cell--2">表达式</div>
        <div class="sched__cell sched__cell--3">平台</div>
        <div class="sched__cell sched__cell--4">命令</div>
        <div class="sched__cell sched__cell--5">备注</div>
        <div class="sched__cell sched__cell--6">操作</div>
      </div>
      <div v-if="loading" class="sched__empty">加载中…</div>
      <div v-else-if="!rows.length" class="sched__empty">暂无调度规则</div>
      <div v-for="r in rows" :key="r.id" class="sched__row">
        <div class="sched__cell sched__cell--1">{{ r.msScheduleName }}</div>
        <div class="sched__cell sched__cell--2 mono">{{ r.expression }}</div>
        <div class="sched__cell sched__cell--3">
          <span class="lb-pill sched__pill" :class="`sched__pill--${r.platform ?? 'all'}`">
            {{ platformLabel(r.platform) }}
          </span>
        </div>
        <div class="sched__cell sched__cell--4 mono">{{ r.command }}</div>
        <div class="sched__cell sched__cell--5">{{ r.remark }}</div>
        <div class="sched__cell sched__cell--6">
          <button type="button" class="lb-btn" @click.stop="() => openDraft(r)">编辑</button>
          <button type="button" class="lb-btn lb-btn--danger" @click.stop="() => remove(r)">删除</button>
        </div>
      </div>
    </div>

    <ReDialog v-model="dialogOpen" :title="draft?.id ? '编辑调度规则' : '新增调度规则'" width="560px" destroy-on-close>
      <div class="sched__form">
        <label class="sched__field"><span>规则名</span><ReInput v-model="draft!.name" placeholder="如 每天巡检" /></label>
        <label class="sched__field"><span>表达式</span><ReInput v-model="draft!.expression" placeholder="0 2 * * *（cron）或 now/every" /></label>
        <label class="sched__field"><span>平台</span>
          <div class="lb-seg">
            <button v-for="p in platformOptions" :key="p" type="button" class="lb-seg__btn"
              :class="{ 'is-active': draft?.platform === p }" @click="draft!.platform = p">
              {{ platformLabel(p) }}
            </button>
          </div>
        </label>
        <label class="sched__field"><span>执行命令</span><ReInput v-model="draft!.command" placeholder="在目标平台执行的命令" /></label>
        <label class="sched__field"><span>备注</span><ReInput v-model="draft!.remark" placeholder="可选" /></label>
      </div>
      <template #footer>
        <ReButton @click="dialogOpen = false">取消</ReButton>
        <ReButton type="primary" @click="save(toPayload())">确定</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
@use "../../components/lab/_lab-kit.scss";

.sched {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.sched__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 12px 8px;
  flex: none;
}
.sched__head-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #111);
}
.sched__search {
  width: 200px;
}
.sched__table {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: var(--el-fill-color-light, #f9fafb);
  border-radius: 10px;
  border: 1px solid var(--el-border-color-extra-light, #eef0f6);
  border: 1px solid var(--border-subtle, rgba(0, 0, 0, .06));
  & > .sched__row,
  & > .sched__row--head {
    display: grid;
    grid-template-columns: 130px 130px 90px 1fr 160px 120px;
    gap: 0;
  }
  &--head {
    background: var(--bg-card, #fff);
    font-size: 11.5px;
    font-weight: 600;
    color: var(--text-secondary, #5c6270);
  }
}
.sched__row {
  background: var(--bg-container, #fff);
  border-top: 1px solid var(--border-subtle, rgba(0, 0, 0, .04));
  &:hover { background: var(--brand-50, #f5f3ff); }
  &--head > .sched__cell {
    font-weight: 600;
  }
}
.sched__cell {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  font-size: 12px;
  color: var(--text-primary, #111);
  border-right: 1px solid var(--border-subtle, rgba(0, 0, 0, .04));
  > * { flex: 1; min-width: 0; }
  &--1 { grid-column: 1; }
  &--2 { grid-column: 2; }
  &--3 { grid-column: 3; }
  &--4 { grid-column: 4; }
  &--5 { grid-column: 5; }
  &--6 { grid-column: 6; gap: 4px; justify-content: flex-end; }
  .mono { font-family: var(--el-font-family-mono, ui-monospace, Consolas, monospace); }
}
.sched__pill {
  font-size: 11px;
  &--win { color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
  &--linux { color: var(--el-color-success); background: var(--el-color-success-light-9); }
  &--mac { color: var(--el-color-warning); background: var(--el-color-warning-light-9); }
  &--all { color: var(--el-color-info); background: var(--el-color-info-light-9); }
}
.sched__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 0;
}
.sched__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-secondary, #5c6270);
  > *:not(:first-child) { width: 100%; }
  > :first-child { font-size: 11.5px; }
}
.sched__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  font-size: 12px;
  color: var(--text-tertiary, #909399);
}
</style>

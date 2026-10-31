<script setup lang="ts">
/**
 * 主机调度信息页（右键菜单：规则展示 / 增 / 改 / 查）
 *
 * <p>按主机维度展示计划任务：规则名、cron 表达式、执行命令、备注、启停状态。
 * 后端没有独立的调度表，规则实际存放在批量计划任务 {@code ms_exec_job} 中
 * （见 {@code api/index.ts} 的映射），因此这里的增删改会同步反映到
 * 「运维台 / 批量作业」，同一任务命中多台主机时删除只会摘掉当前主机。</p>
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
  toggleSchedule,
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

/** 主机的调度列表（hostId 变空时停止拉取） */
const hostId4 = computed(() => props.hostId);

/** 关键字过滤：规则名 / 命令 / 备注 */
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

onMounted(load);

async function load(): Promise<void> {
  if (!hostId4.value) return;
  loading.value = true;
  try {
    rows.value = await listSchedules(hostId4.value);
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    loading.value = false;
  }
}

/** 行变表单 */
function toPayload(): SchedulePayload {
  return {
    msScheduleName: draft.value?.name ?? "",
    expression: draft.value?.expression ?? "",
    command: draft.value?.command ?? "",
    remark: draft.value?.remark ?? "",
  };
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
    await message.confirm(`确认从当前主机移除调度「${item.msScheduleName}」？`);
    await delSchedule(props.hostId, item.id);
    message.success("已移除");
    await load();
  } catch (e) {
    message.error((e as Error).message);
  }
}

/** 启停：直接复用计划任务的开关键 */
async function toggle(item: ScheduleItem): Promise<void> {
  const next = item.status === 0;
  try {
    await toggleSchedule(props.hostId, item.id, next);
    message.success(next ? "已启用" : "已停用");
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
        <div class="sched__cell sched__cell--3">命令</div>
        <div class="sched__cell sched__cell--4">备注</div>
        <div class="sched__cell sched__cell--5">状态</div>
        <div class="sched__cell sched__cell--6">操作</div>
      </div>
      <div v-if="loading" class="sched__empty">加载中…</div>
      <div v-else-if="!filtered.length" class="sched__empty">
        {{ rows.length ? "没有匹配的调度规则" : "暂无调度规则" }}
      </div>
      <div v-for="r in filtered" :key="r.id" class="sched__row">
        <div class="sched__cell sched__cell--1" :title="r.msScheduleName">{{ r.msScheduleName }}</div>
        <div class="sched__cell sched__cell--2 mono" :title="r.expression">{{ r.expression }}</div>
        <div class="sched__cell sched__cell--3 mono" :title="r.command">{{ r.command }}</div>
        <div class="sched__cell sched__cell--4" :title="r.remark">{{ r.remark }}</div>
        <div class="sched__cell sched__cell--5">
          <button
            type="button"
            class="lb-btn sched__status"
            :class="{ 'is-off': r.status === 0 }"
            :title="r.status === 0 ? '点击启用' : '点击停用'"
            @click.stop="toggle(r)"
          >
            {{ r.status === 0 ? "已停用" : "启用中" }}
          </button>
        </div>
        <div class="sched__cell sched__cell--6">
          <button type="button" class="lb-btn" @click.stop="() => openDraft(r)">编辑</button>
          <button type="button" class="lb-btn lb-btn--danger" @click.stop="remove(r)">删除</button>
        </div>
      </div>
    </div>

    <ReDialog v-model="dialogOpen" :title="draft?.id ? '编辑调度规则' : '新增调度规则'" width="560px" destroy-on-close>
      <div class="sched__form">
        <label class="sched__field"><span>规则名</span><ReInput v-model="draft!.name" placeholder="如 每天巡检" /></label>
        <label class="sched__field"><span>表达式</span><ReInput v-model="draft!.expression" placeholder="0 2 * * * ?（cron）" /></label>
        <label class="sched__field"><span>执行命令</span><ReInput v-model="draft!.command" placeholder="在目标主机上执行的命令" /></label>
        <label class="sched__field"><span>备注</span><ReInput v-model="draft!.remark" placeholder="可选" /></label>
        <p class="sched__hint">
          规则以计划任务形式保存，命中主机为「{{ hostName }}」；同一任务可被多台主机共用，
          删除时只会移除当前主机。
        </p>
      </div>
      <template #footer>
        <ReButton @click="dialogOpen = false">取消</ReButton>
        <ReButton type="primary" @click="save(toPayload())">确定</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
@use "../components/lab/_lab-kit.scss";

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
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #111);
}
.sched__search {
  flex: 1 1 140px;
  width: 200px;
  min-width: 90px;
  max-width: 220px;
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
    /* 六列按可用宽度分配；最窄处仍保留可读下限，再窄由外层横向滚动兜底 */
    grid-template-columns: minmax(110px, 1.2fr) minmax(120px, 1fr) minmax(150px, 1.6fr) minmax(100px, 1fr) 64px 108px;
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
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  > * { flex: 1; min-width: 0; }
  &--1 { grid-column: 1; }
  &--2 { grid-column: 2; }
  &--3 { grid-column: 3; }
  &--4 { grid-column: 4; }
  &--5 { grid-column: 5; justify-content: center; }
  &--6 { grid-column: 6; gap: 4px; justify-content: flex-end; overflow: visible; }
  .mono { font-family: var(--el-font-family-mono, ui-monospace, Consolas, monospace); }
}
.sched__status {
  flex: none;
  padding: 2px 8px;
  font-size: 11px;
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
  border-radius: 999px;
  &.is-off {
    color: var(--el-text-color-placeholder, #a8abb2);
    background: var(--el-fill-color-light, #f3f4f6);
  }
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
.sched__hint {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--text-tertiary, #909399);
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

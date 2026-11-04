<template>
  <CardBody :state="res.state.value" :error="res.error.value" @retry="res.reload()">
    <div class="act-sched">
      <CardKpi :items="kpis" />
      <CardList :rows="rows" empty="没有注册定时任务" />
      <p class="act-sched__foot">读取 /actuator/scheduledtasks · 不含运行历史</p>
    </div>
  </CardBody>
</template>

<script setup lang="ts" name="ActuatorScheduledTasksCard">
/**
 * Actuator 定时任务卡片（{@code /actuator/scheduledtasks}）
 *
 * <p>响应把任务按触发方式分成三组：{@code cron} / {@code fixedDelay} / {@code fixedRate}。
 * 卡片按组统计并列出具体表达式 —— 「这个应用到底跑了哪些定时任务」是新接手
 * 一个服务时最先要弄清的事，而它恰好不在任何一张业务表里。</p>
 *
 * <p>要<b>改</b> cron / 启停 / 手动触发，走 Actuator 弹窗的「定时任务」页
 * （那里接的是后端的动态调度注册中心，可写）。</p>
 */
import { computed, watch } from "vue";
import CardBody from "./CardBody.vue";
import CardKpi from "./parts/CardKpi.vue";
import CardList from "./parts/CardList.vue";
import { useActuatorResource } from "./useCardResource";
import type { MonitorCardItem } from "@pages/system";

const props = defineProps<{ card: MonitorCardItem; refreshKey?: number }>();

const intervalSec = computed(() => props.card.config?.intervalSec ?? 120);
const res = useActuatorResource(() => "scheduledtasks", () => intervalSec.value);

watch(
  () => props.refreshKey,
  () => void res.reload(true),
);

interface ScheduledTask {
  runnable?: { target?: string };
  expression?: string;
  initialDelay?: number;
  interval?: number;
}

interface ScheduledGroup {
  cron?: ScheduledTask[];
  fixedDelay?: ScheduledTask[];
  fixedRate?: ScheduledTask[];
  custom?: ScheduledTask[];
}

/** 取唯一 application context 的 scheduledtasks */
const group = computed<ScheduledGroup>(() => {
  const contexts = (res.data.value as { contexts?: Record<string, { scheduledtasks?: ScheduledGroup }> } | null)?.contexts;
  const first = contexts ? Object.values(contexts)[0] : undefined;
  return first?.scheduledtasks ?? {};
});

/** 三个分组压成统一列表 */
const tasks = computed(() => {
  const out: { kind: string; target: string; expr: string }[] = [];
  const push = (kind: string, list?: ScheduledTask[]) => {
    for (const t of list ?? []) {
      out.push({
        kind,
        target: shortTarget(t?.runnable?.target),
        expr: t?.expression ?? (t?.interval != null ? `${t.interval}ms` : t?.initialDelay != null ? `delay ${t.initialDelay}ms` : "—"),
      });
    }
  };
  push("cron", group.value.cron);
  push("fixedDelay", group.value.fixedDelay);
  push("fixedRate", group.value.fixedRate);
  push("custom", group.value.custom);
  return out;
});

/** 方法全名太长：只留「类名#方法名」 */
function shortTarget(target?: string): string {
  if (!target) return "未命名任务";
  const clean = target.replace(/^.*!/, "").replace(/^class\s+/, "");
  const parts = clean.split(".");
  return parts.length > 2 ? parts.slice(-2).join(".") : clean;
}

const kpis = computed(() => [
  { label: "任务总数", value: String(tasks.value.length) },
  { label: "cron", value: String(group.value.cron?.length ?? 0) },
  { label: "fixedDelay", value: String(group.value.fixedDelay?.length ?? 0) },
  { label: "fixedRate", value: String(group.value.fixedRate?.length ?? 0) },
]);

const rows = computed(() => {
  const limit = props.card.config?.limit ?? 20;
  return tasks.value.slice(0, limit).map((t) => ({
    key: t.target,
    value: `${t.kind} · ${t.expr}`,
  }));
});
</script>

<style lang="scss" scoped>
.act-sched {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
}

.act-sched__foot {
  margin: auto 0 0;
  font-size: 10.5px;
  color: var(--el-text-color-placeholder);
}
</style>

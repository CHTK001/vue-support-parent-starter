<!--
  告警分析 —— Alarms 是「事件流水」，本页是「这些事件说明了什么」。

  为什么分成两页而不是合并：
    · 告警页回答「刚刚响了什么」（按时间倒序的事件流，运维值班在看）；
    · 本页回答「哪个实体最常亮红灯」（按实体 / 作用域聚合 + 时间分布，复盘在看）。
  两者的排序、分组、默认时间窗口完全不同，塞进一页会让两个角色互相干扰。

  数据与 /alarms 同源，走 /alerts 分支以便后端按 CAP_ALERTS 判能力。

  为什么按「实体」而不是「规则」聚合：SkyWalking 的 AlarmMessage 只暴露
  name（实体名）、message、scope、events、tags，**不暴露 ruleName** ——
  规则名只存在于存储层，仅供 queryAlarms 的 ruleNames 过滤使用。按规则聚合
  在这套协议下做不到，硬凑只会把实体名当成规则名。

  实体名也不总是有：AlarmMessage.name 是 10.2.0 才加进 schema 的，更早的 OAP
  只能从事件来源（Event.source.service）反推服务名。两者都没有时，引擎返回空串，
  由本页回落成「（未命名实体）」，而不是拿规则名或作用域冒充。

  告警没有「已读 / 处理」状态：SkyWalking 的 alarm 表就是规则触发记录的集合，
  工作流是各家自己加的，本系统不臆造（见 Alarms.vue 的说明）。
-->
<template>
  <ApmGate v-slot="{ status }">
    <div class="apm-bar apm-toolbar">
      <ReSelect
        v-model="service"
        :options="serviceOptions"
        placeholder="全部服务"
        clearable
        filterable
        style="width: 220px"
        @change="load"
      />
      <ReInput v-model="keyword" placeholder="按告警内容过滤" clearable style="width: 260px" @keyup.enter="load" />
      <span v-if="entity" class="apm-bar" style="gap: 6px">
        <ReTag type="danger" round closable @close="entity = ''">实体：{{ entity }}</ReTag>
      </span>
      <ReSelect v-model="minutes" :options="windowOptions" style="width: 150px" @change="load" />
      <ReButton icon="Search" type="primary" :loading="loading" @click="load">查询</ReButton>
      <span class="apm-bar__spacer" />
      <span class="apm-count">{{ scopedAlarms.length }} 条告警 · {{ byEntity.length }} 个实体 · {{ byScope.length }} 类作用域</span>
      <ReButton icon="Refresh" :loading="loading" title="刷新" @click="load" />
    </div>

    <ReSkeleton v-if="loading && !alarms.length" :rows="6" animated />

    <div v-else-if="!scopedAlarms.length" class="apm-empty-card">
      <div class="apm-empty-card__title">没有告警事件</div>
      <p class="apm-empty-card__desc">
        {{
          entity
            ? `该窗口内没有「${entity}」的告警，可撤掉实体筛选看全部。`
            : "该时间窗口内规则未触发，因此没有可聚合的实体与作用域；如果确认应有告警，请检查 OAP 的 alarm 规则配置。"
        }}
      </p>
    </div>

    <template v-else>
      <!-- 趋势：告警是不是在集中爆发 -->
      <ReCard :radius="12" shadow="never">
        <template #header>
          <div class="apm-card-head">
            <span class="apm-card-h">触发趋势</span>
            <span class="apm-muted">按 {{ bucketMinutes }} 分钟聚合</span>
          </div>
        </template>
        <ReChart type="custom" engine="echarts" :option="trendOption" height="220px" />
      </ReCard>

      <div class="apm-grid apm-grid--chart">
        <!-- 实体排行 -->
        <ReCard :radius="12" shadow="never">
          <template #header>
            <div class="apm-card-head">
              <span class="apm-card-h">实体排行</span>
              <span class="apm-muted">哪个服务 / 实例 / 端点最吵 · 点一行看它的事件</span>
            </div>
          </template>
          <div class="alert-rank">
            <button
              v-for="item in byEntity"
              :key="item.name"
              type="button"
              class="alert-rank__row is-clickable"
              :title="`在告警页只看「${item.name}」`"
              @click="openAlarmsOf(item.name)"
            >
              <span class="alert-rank__name apm-mono" :title="item.name">{{ item.name }}</span>
              <div class="alert-rank__track">
                <div class="alert-rank__bar" :style="{ width: `${item.percent}%` }" />
              </div>
              <span class="alert-rank__count apm-mono">{{ item.count }}</span>
            </button>
          </div>
        </ReCard>

        <!-- 作用域排行 -->
        <ReCard :radius="12" shadow="never">
          <template #header>
            <div class="apm-card-head">
              <span class="apm-card-h">作用域排行</span>
              <span class="apm-muted">哪类对象受影响最多</span>
            </div>
          </template>
          <div class="alert-rank">
            <div v-for="item in byScope" :key="item.name" class="alert-rank__row">
              <span class="alert-rank__name apm-mono" :title="item.name">{{ item.name }}</span>
              <div class="alert-rank__track">
                <div class="alert-rank__bar is-service" :style="{ width: `${item.percent}%` }" />
              </div>
              <span class="alert-rank__count apm-mono">{{ item.count }}</span>
            </div>
          </div>
        </ReCard>
      </div>

      <!-- 明细：按实体分组 -->
      <ReCard :radius="12" shadow="never">
        <template #header>
          <div class="apm-card-head">
            <span class="apm-card-h">按实体分组的明细</span>
            <span class="apm-muted">点开看该实体命中的规则，×N 为窗口内触发次数</span>
          </div>
        </template>

        <div class="alert-groups">
          <div v-for="group in grouped" :key="group.entity" class="alert-group">
            <button type="button" class="alert-group__head" @click="toggle(group.entity)">
              <ReTag type="danger" round>{{ group.entity }}</ReTag>
              <span class="apm-muted">{{ group.items.length }} 次 · {{ group.rules.length }} 条规则</span>
              <span class="apm-bar__spacer" />
              <span class="apm-muted">最近 {{ fmtAgo(group.latest) }}</span>
              <ReIcon :name="expanded.includes(group.entity) ? 'ArrowUp' : 'ArrowDown'" />
            </button>

            <!-- 同一实体的同一条规则会逐分钟触发，原样列就是 6 块几乎一样的文字。
                 按「作用域 + 正文」并成一条，次数和首末时间挂在抬头上。 -->
            <div v-if="expanded.includes(group.entity)" class="alert-group__body">
              <div v-for="rule in group.rules" :key="rule.key" class="alert-item">
                <div class="alert-item__head">
                  <span class="apm-mono">{{ rule.scope }}</span>
                  <span v-if="rule.count > 1" class="alert-item__count">×{{ rule.count }} 次</span>
                  <span class="apm-bar__spacer" />
                  <span class="apm-muted">
                    {{ rule.count > 1 ? `${fmtTime(rule.earliest)} ~ ${fmtTime(rule.latest)}` : fmtTime(rule.latest) }}
                  </span>
                </div>
                <p class="alert-item__msg">{{ rule.message || "（无描述）" }}</p>
                <div v-if="rule.events.length" class="apm-kv alert-events">
                  <div v-for="(event, index) in rule.events" :key="index" class="apm-kv__row alert-event">
                    <span v-if="event.count > 1" class="alert-event__count">×{{ event.count }}</span>
                    <span class="alert-event__text">{{ event.text }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ReCard>
    </template>

    <div v-if="!status.capabilities.includes('alerts')" class="apm-muted">
      引擎 {{ status.name }} 不支持告警分析。
    </div>
  </ApmGate>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { EChartsOption } from "echarts";
import { message } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReCard from "@repo/ui/re-card";
import ReChart from "@repo/ui/re-chart";
import ReIcon from "@repo/ui/re-icon";
import ReInput from "@repo/ui/re-input";
import ReSelect from "@repo/ui/re-select";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReTag from "@repo/ui/re-tag";
import ApmGate from "../components/ApmGate.vue";
import { listAlerts, listServices } from "../api/apmApi";
import type { ApmAlarm } from "../api/apmApi";
import { useApmPalette } from "../composables/useApmPalette";
import { useApmStatus } from "../composables/useApmStatus";
import { consumeApmTabContext, openApmTab } from "../tabs";
import { WINDOW_OPTIONS, fmtAgo, fmtAxisClock, fmtTime } from "../utils/format";

const { present, ensure } = useApmStatus();
/** canvas 里 var(--el-*) 是无效值，颜色必须取计算后的实色（见 useApmPalette） */
const palette = useApmPalette();

const alarms = ref<ApmAlarm[]>([]);
const services = ref<string[]>([]);
const service = ref("");
const keyword = ref("");
/** 实体筛选（从总览 / 告警页下钻过来时带上的名字） */
const entity = ref("");
const minutes = ref(180);
const loading = ref(false);
const expanded = ref<string[]>([]);
const windowOptions = WINDOW_OPTIONS;

const serviceOptions = computed(() => services.value.map((s) => ({ label: s, value: s })));

/** 折叠某条规则 */
function toggle(rule: string) {
  const index = expanded.value.indexOf(rule);
  if (index >= 0) {
    expanded.value.splice(index, 1);
  } else {
    expanded.value.push(rule);
  }
}

/**
 * 排行榜一行 → 告警页只看这个实体。
 *
 * <p>排行的用处就是「谁最吵」，看到名字之后的下一步是翻它的事件流水，
 * 而那一屏在告警页。带实体名过去，落地页直接过滤，不用再照着名字打一遍。</p>
 *
 * @param entity 实体名（服务 / 「实例 of 服务」/「端点 in 服务」）
 */
function openAlarmsOf(entity: string): void {
  openApmTab("alarms", { entity, minutes: minutes.value });
}

/**
 * 事件按正文去重并计数。
 *
 * OAP 对同一条规则会在窗口内逐分钟推一次事件，正文完全一样。原样列出来就是
 * 八行「Alarm: Percentile response time of service …」压满屏幕，既看不出有几条
 * 规则在响，也把真正不同的那条淹掉。这里只保留不同的正文，重复的次数标成 ×N；
 * 与上方 message 相同的那条也不再重复一遍。
 */
function rollupEvents(alarm: ApmAlarm): { text: string; count: number }[] {
  const message = (alarm.message || "").trim();
  const map = new Map<string, { text: string; count: number }>();
  for (const raw of alarm.events || []) {
    const text = raw.replace(/^Alarm:\s*/, "").trim();
    if (!text || text === message) {
      continue;
    }
    const hit = map.get(text);
    if (hit) {
      hit.count += 1;
    } else {
      map.set(text, { text, count: 1 });
    }
  }
  return [...map.values()];
}

/** 时间桶粒度：窗口越长桶越粗，否则柱子数上千根读不出形状 */
const bucketMinutes = computed(() => {
  if (minutes.value <= 60) {
    return 5;
  }
  if (minutes.value <= 360) {
    return 15;
  }
  return 60;
});

/** 排行项：name + count + 相对最大值的百分比 */
interface RankItem {
  name: string;
  count: number;
  percent: number;
}

function rank(list: ApmAlarm[], pick: (alarm: ApmAlarm) => string): RankItem[] {
  const counter = new Map<string, number>();
  for (const alarm of list) {
    const key = pick(alarm) || "（未命名）";
    counter.set(key, (counter.get(key) ?? 0) + 1);
  }
  const entries = [...counter.entries()].sort((a, b) => b[1] - a[1]);
  const max = entries[0]?.[1] ?? 1;
  return entries.map(([name, count]) => ({ name, count, percent: (count / max) * 100 }));
}

/**
 * 按实体过滤后的告警。
 *
 * <p>聚合视图的所有读数（趋势 / 排行 / 分组）都以它为准，筛掉实体时三块要一起变，
 * 否则「实体排行」只剩一个实体、趋势线却还是全部事件的，读起来自相矛盾。</p>
 */
const scopedAlarms = computed(() => {
  const target = entity.value.trim();
  if (!target) {
    return alarms.value;
  }
  return alarms.value.filter((alarm) => {
    const name = (alarm.name || alarm.serviceName || "").trim();
    return name === target || name.includes(target);
  });
});

const byEntity = computed(() => rank(scopedAlarms.value, (a) => a.name || a.serviceName || ""));
const byScope = computed(() => rank(scopedAlarms.value, (a) => a.scope || ""));

/** 一条规则在一个实体下的聚合：次数、首末时间、去重后的事件 */
interface RuleBucket {
  key: string;
  scope: string;
  message: string;
  count: number;
  earliest: number;
  latest: number;
  events: { text: string; count: number }[];
}

/** 把多条告警的事件并成一张「正文 → 次数」表 */
function mergeEvents(list: ApmAlarm[]): { text: string; count: number }[] {
  const map = new Map<string, { text: string; count: number }>();
  for (const alarm of list) {
    for (const item of rollupEvents(alarm)) {
      const hit = map.get(item.text);
      if (hit) {
        hit.count += item.count;
      } else {
        map.set(item.text, { ...item });
      }
    }
  }
  return [...map.values()];
}

/** 按实体分组（组内再按规则聚合、按最近触发倒序），供折叠面板展开 */
const grouped = computed(() => {
  const map = new Map<string, ApmAlarm[]>();
  for (const alarm of scopedAlarms.value) {
    const key = alarm.name || alarm.serviceName || "（未命名实体）";
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(alarm);
  }
  return [...map.entries()]
    .map(([groupEntity, items]) => {
      const sorted = [...items].sort((a, b) => b.startTime - a.startTime);
      const buckets = new Map<string, ApmAlarm[]>();
      for (const alarm of sorted) {
        const key = `${alarm.scope || ""}|${(alarm.message || "").trim()}`;
        if (!buckets.has(key)) {
          buckets.set(key, []);
        }
        buckets.get(key)!.push(alarm);
      }
      const rules: RuleBucket[] = [...buckets.entries()].map(([key, list]) => {
        const times = list.map((a) => a.startTime).filter((t) => t > 0);
        return {
          key,
          scope: list[0]?.scope || "—",
          message: (list[0]?.message || "").trim(),
          count: list.length,
          earliest: times.length ? Math.min(...times) : 0,
          latest: times.length ? Math.max(...times) : 0,
          events: mergeEvents(list),
        };
      });
      rules.sort((a, b) => b.latest - a.latest);
      return { entity: groupEntity, items: sorted, rules, latest: sorted[0]?.startTime ?? 0 };
    })
    .sort((a, b) => b.items.length - a.items.length);
});

/** 趋势：按固定桶宽聚合成柱状图（用 category 轴而不是 time 轴，避免空桶被自动压缩） */
const trendOption = computed<EChartsOption>(() => {
  const bucketMs = bucketMinutes.value * 60_000;
  const end = Date.now();
  const start = Math.min(...scopedAlarms.value.map((a) => a.startTime), end);
  const from = Math.floor((start || end - minutes.value * 60_000) / bucketMs) * bucketMs;

  const buckets = new Map<number, number>();
  for (const alarm of scopedAlarms.value) {
    if (alarm.startTime <= 0) {
      continue;
    }
    const key = Math.floor(alarm.startTime / bucketMs) * bucketMs;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const labels: string[] = [];
  const values: number[] = [];
  for (let time = from; time <= end; time += bucketMs) {
    labels.push(fmtAxisClock(time, bucketMs));
    values.push(buckets.get(time) ?? 0);
  }

  return {
    tooltip: { trigger: "axis" },
    grid: { left: 8, right: 12, top: 20, bottom: 6, containLabel: true },
    xAxis: {
      type: "category",
      data: labels,
      axisLine: { lineStyle: { color: palette.value.line } },
      axisTick: { show: false },
      axisLabel: { fontSize: 11, hideOverlap: true, color: palette.value.faint },
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { fontSize: 11, color: palette.value.faint },
      splitLine: { lineStyle: { type: "dashed", color: palette.value.line } },
    },
    series: [
      {
        type: "bar",
        data: values,
        barMaxWidth: 22,
        // 告警条数用「危险」语义色：这里出现的就是坏消息
        itemStyle: { color: palette.value.bad, opacity: 0.85, borderRadius: [4, 4, 0, 0] },
        emphasis: { itemStyle: { opacity: 1 } },
      },
    ],
  };
});

async function load() {
  await ensure();
  if (!present.value) {
    return;
  }
  loading.value = true;
  try {
    const list =
      (await listAlerts({
        service: service.value || undefined,
        keyword: keyword.value || undefined,
        minutes: minutes.value,
      })) || [];
    alarms.value = list;
    // 默认展开命中次数最多的那个实体
    expanded.value = grouped.value.length ? [grouped.value[0].entity] : [];
  } catch (e) {
    alarms.value = [];
    message.error(`加载告警失败：${(e as Error)?.message ?? e}`);
  } finally {
    loading.value = false;
  }
}

async function loadServices() {
  try {
    services.value = ((await listServices({})) || []).map((s) => s.name);
  } catch {
    services.value = [];
  }
}

onMounted(async () => {
  // 从告警页 / 总览点某个实体过来时带着名字：直接按它筛，省一次回填
  const context = consumeApmTabContext();
  if (context?.entity) {
    entity.value = context.entity;
  }
  if (context?.minutes) {
    minutes.value = context.minutes;
  }
  await loadServices();
  load();
});
</script>

<style scoped>
.alert-rank {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 事件逐条成行：摊成 5 列只剩一串「Alarm: …」的截断 */
.alert-events {
  grid-template-columns: minmax(0, 1fr);
  margin-top: 6px;
  color: var(--el-text-color-secondary);
}

/* 一行一条正文，允许折行（.apm-kv__row 默认 nowrap + ellipsis，长文案会被切掉） */
.alert-event {
  display: flex;
  align-items: baseline;
  gap: 8px;
  overflow: visible;
  text-overflow: clip;
  white-space: normal;
  overflow-wrap: anywhere;
  line-height: 1.55;
}

.alert-event__text {
  flex: 1 1 auto;
  min-width: 0;
}

/* 重复次数：小胶囊，比再排一行同样的文字好读得多 */
.alert-event__count {
  flex: none;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  line-height: 18px;
}

.alert-rank__row {
  display: grid;
  grid-template-columns: minmax(120px, 42%) 1fr 48px;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}

/* 排行行可点：按钮形态要清掉浏览器默认外观，只保留行本身 */
.alert-rank__row.is-clickable {
  width: 100%;
  padding: 2px 4px;
  margin: 0 -4px;
  border: 0;
  border-radius: 5px;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.alert-rank__row.is-clickable:hover {
  background: var(--bg-hover, var(--el-fill-color-light));
}

.alert-rank__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alert-rank__track {
  height: 10px;
  border-radius: 3px;
  background: var(--bg-fill-secondary, var(--el-fill-color));
  overflow: hidden;
}

.alert-rank__bar {
  height: 100%;
  border-radius: 3px;
  background: var(--el-color-danger);
}

.alert-rank__bar.is-service {
  background: var(--el-color-warning);
}

.alert-rank__count {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.alert-groups {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.alert-group {
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter));
  border-radius: 8px;
  overflow: hidden;
}

.alert-group__head {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: var(--bg-fill, var(--el-fill-color-lighter));
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.alert-group__head:hover {
  background: var(--bg-hover, var(--el-fill-color-light));
}

.alert-group__body {
  padding: 4px 12px 10px;
}

.alert-item {
  padding: 8px 0;
  border-top: 1px dashed var(--border-subtle, var(--el-border-color-lighter));
}

.alert-item:first-child {
  border-top: none;
}

.alert-item__head {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}

.alert-item__count {
  padding: 0 6px;
  border-radius: 999px;
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
  font-variant-numeric: tabular-nums;
  line-height: 18px;
}

.alert-item__msg {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-secondary, var(--el-text-color-regular));
  white-space: pre-wrap;
}
</style>

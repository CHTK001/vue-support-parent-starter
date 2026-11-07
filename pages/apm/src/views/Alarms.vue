<!--
  告警 —— 对齐 SkyWalking 的 Alarm 页面。

  SkyWalking 的告警是「规则触发后写进 alarm 表」的事件，没有「已读 / 处理」这种
  状态机（那是各家自己做的工作流）。因此本页只做展示与筛选，不编造「标记已处理」的按钮 ——
  点了也不会被后端记住，反而让人以为处理过了。
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
      <!-- 从总览 / 告警分析点某个实体过来时，把「只看这个实体」明写成可撤掉的标签：
           否则列表突然变短，看不出是被过滤了，会以为告警丢了。 -->
      <ReTag v-if="entity" type="danger" round closable @close="clearEntity">
        实体：{{ entity }}
      </ReTag>
      <ReSelect v-model="minutes" :options="windowOptions" style="width: 150px" @change="load" />
      <ReButton icon="Search" type="primary" :loading="loading" @click="load">查询</ReButton>
      <span class="apm-bar__spacer" />
      <span class="apm-count">{{ visibleAlarms.length }} 条告警</span>
      <ReButton icon="Refresh" :loading="loading" title="刷新" @click="load" />
    </div>

    <ReSkeleton v-if="loading && !alarms.length" :rows="6" animated />

    <template v-else>
      <div v-if="!visibleAlarms.length" class="apm-empty-card">
        <div class="apm-empty-card__title">没有告警事件</div>
        <p class="apm-empty-card__desc">
          {{
            entity
              ? `该窗口内没有「${entity}」的告警，可撤掉实体筛选看全部。`
              : "该时间窗口内规则未触发；如果确认应有告警，请检查 OAP 的 alarm 规则配置。"
          }}
        </p>
      </div>

      <template v-else>
        <ReCard v-for="alarm in visibleAlarms" :key="alarm.id" :radius="12" shadow="never" class="alarm-card">
          <div class="alarm-head">
            <!-- 标签是「作用域」而不是规则名：OAP 的 AlarmMessage 不暴露 ruleName，
                 硬塞实体会让人以为那是规则名。 -->
            <ReTag type="danger" round>{{ alarm.scope || "告警" }}</ReTag>
            <!-- 实体就是某个已观测服务时，名字直接点进服务详情：
                 看到「哪个服务在响」的下一步一定是看它到底慢在哪。 -->
            <button
              v-if="isKnownService(alarm.name)"
              type="button"
              class="apm-link alarm-service apm-mono"
              :title="`看服务「${alarm.name}」的详情`"
              @click="openService(alarm.name)"
            >
              {{ alarm.name }}
            </button>
            <span v-else class="alarm-service apm-mono">{{ alarm.name || "—" }}</span>
            <span class="apm-bar__spacer" />
            <span class="apm-muted">{{ fmtTime(alarm.startTime) }} · {{ fmtAgo(alarm.startTime) }}</span>
          </div>
          <p class="alarm-msg">{{ alarm.message || "（无描述）" }}</p>
          <div v-if="otherEvents(alarm).length" class="apm-kv alarm-events">
            <div v-for="(event, i) in otherEvents(alarm).slice(0, 2)" :key="i" class="apm-kv__row">{{ event }}</div>
            <div v-if="otherEvents(alarm).length > 2" class="apm-kv__more">另有 {{ otherEvents(alarm).length - 2 }} 条同类事件</div>
          </div>
          <div v-if="alarm.tags?.length" class="apm-kv alarm-tags">
            <div v-for="tag in alarm.tags" :key="tag.key" class="apm-kv__row">
              <span class="apm-kv__key">{{ tag.key }}</span>{{ tag.value }}
            </div>
          </div>
        </ReCard>
      </template>
    </template>

    <div v-if="!status.capabilities.includes('alarms')" class="apm-muted">
      引擎 {{ status.name }} 不支持告警查询。
    </div>
  </ApmGate>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { message } from "@repo/core";
import { Search } from "@element-plus/icons-vue";
import ReButton from "@repo/ui/re-button";
import ReCard from "@repo/ui/re-card";
import ReInput from "@repo/ui/re-input";
import ReSelect from "@repo/ui/re-select";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReTag from "@repo/ui/re-tag";
import ApmGate from "../components/ApmGate.vue";
import { listAlarms, listServices } from "../api/apmApi";
import type { ApmAlarm } from "../api/apmApi";
import { useApmStatus } from "../composables/useApmStatus";
import { ROUTE_PREFIX } from "../config";
import { consumeApmTabContext } from "../tabs";
import { WINDOW_OPTIONS, fmtAgo, fmtTime } from "../utils/format";

const router = useRouter();
const { present, ensure } = useApmStatus();

const alarms = ref<ApmAlarm[]>([]);
const services = ref<string[]>([]);
const service = ref("");
const keyword = ref("");
/** 实体筛选（来自总览 / 告警分析的下钻）：OAP 没有按实体名查询的参数，只能本地过滤 */
const entity = ref("");
const minutes = ref(60);
const loading = ref(false);
const windowOptions = WINDOW_OPTIONS;

const serviceOptions = computed(() => services.value.map((s) => ({ label: s, value: s })));

/**
 * 按实体过滤后的告警。
 *
 * <p>实体名是 {@code alarm.name}（服务名 / 「实例 of 服务」/「端点 in 服务」），
 * 不是告警正文，`keyword` 那条查询参数搜的是 message，按实体名搜不到。
 * 所以这里在拿到结果后本地筛：精确命中优先，包含匹配兜住「端点 in 服务」这种长名字。</p>
 */
const visibleAlarms = computed(() => {
  const target = entity.value.trim();
  if (!target) {
    return alarms.value;
  }
  return alarms.value.filter((alarm) => {
    const name = (alarm.name || alarm.serviceName || "").trim();
    return name === target || name.includes(target);
  });
});

/** 撤掉实体筛选，回到这一屏的全部告警 */
function clearEntity(): void {
  entity.value = "";
}

/** 实体是不是一个已观测的服务 —— 只有这种名字点进去才有服务详情可看 */
function isKnownService(name?: string | null): boolean {
  return !!name && services.value.includes(name);
}

/** 打开服务详情（独立路由，跨路由本来就会重建，用 URL 带参数） */
function openService(name: string): void {
  router.push({ path: `${ROUTE_PREFIX}/services/detail`, query: { service: name } });
}

/**
 * 事件里通常把告警本身的描述又重复一遍（只多一个 `Alarm: ` 前缀），
 * 原样列出来就是同一句话贴两遍 —— 同义的剔掉，剩下的才是「同时命中的其它规则」。
 */
function otherEvents(alarm: ApmAlarm): string[] {
  const message = (alarm.message || "").trim();
  const seen = new Set<string>();
  const out: string[] = [];
  for (const event of alarm.events || []) {
    // OAP 会把同一条规则在多分钟内的事件各推一遍，正文完全一样，只留一条
    const key = event.replace(/^Alarm:\s*/, "").trim();
    if (!key || key === message || seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(event);
  }
  return out;
}

async function load() {
  await ensure();
  if (!present.value) {
    return;
  }
  loading.value = true;
  try {
    alarms.value =
      (await listAlarms({
        service: service.value || undefined,
        keyword: keyword.value || undefined,
        minutes: minutes.value,
      })) || [];
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
  // 从总览点「某条告警」、或从告警分析点「某个实体」过来时带着实体名：
  // 直接按它过滤，省掉「跳过来再想起来是哪条 → 再打一遍字」。
  const context = consumeApmTabContext();
  if (context?.entity) {
    entity.value = context.entity;
  }
  await loadServices();
  load();
});
</script>

<style scoped>
.alarm-card {
  border-left: 3px solid var(--el-color-danger);
}

.alarm-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.alarm-service {
  color: var(--text-primary, var(--el-text-color-primary));
}

/* 可点的服务名要看起来像链接：文字链接的紫色盖住上面那条常色，
   否则和被筛选的普通文本一模一样，没人会去点 */
.alarm-service.apm-link {
  color: var(--apm-accent, var(--el-color-primary));
  font-weight: 500;
}

.alarm-service.apm-link:hover {
  text-decoration: underline;
}

.alarm-msg {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-secondary, var(--el-text-color-regular));
  white-space: pre-wrap;
}

/* 事件列表按行读，不要摊成 5 列的短截断 */
.alarm-events {
  grid-template-columns: minmax(0, 1fr);
  margin-top: 8px;
  color: var(--el-text-color-secondary);
}

.alarm-events .apm-kv__row {
  overflow: visible;
  text-overflow: clip;
  white-space: normal;
  overflow-wrap: anywhere;
  line-height: 1.55;
}

.apm-kv__more {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.alarm-tags {
  margin-top: 8px;
}
</style>

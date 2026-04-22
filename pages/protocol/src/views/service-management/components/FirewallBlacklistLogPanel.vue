<template>
  <div class="fbl">
    <div class="fbl__toolbar">
      <div class="fbl__filters">
        <ScInput
          v-model="filters.clientIp"
          class="fbl__field"
          clearable
          placeholder="源 IP"
          @keyup.enter="noop"
        />
        <ScInput
          v-model="filters.domain"
          class="fbl__field"
          clearable
          placeholder="域名"
          @keyup.enter="noop"
        />
      <ScInput
        v-model="filters.port"
        class="fbl__field fbl__field--narrow"
        clearable
        placeholder="端口"
        @keyup.enter="noop"
      />
        <ScInput
          v-model="filters.startTime"
          class="fbl__field"
          clearable
          placeholder="开始时间 yyyy-MM-dd HH:mm:ss"
          @keyup.enter="noop"
        />
        <ScInput
          v-model="filters.endTime"
          class="fbl__field"
          clearable
          placeholder="结束时间 yyyy-MM-dd HH:mm:ss"
          @keyup.enter="noop"
        />
      </div>

      <ScButton class="fbl__refresh" @click="handleRefresh">
        刷新
      </ScButton>
    </div>

    <div class="fbl__table">
      <ScTable
        :data="tableRows"
        row-key="id"
        size="small"
        empty-text="暂无拦截记录"
      >
        <ScTableColumn label="源 IP" min-width="190">
          <template #default="{ row }">
            <div class="fbl__ip-block">
              <div class="fbl__ip">{{ row.clientIp || "—" }}</div>
              <div class="fbl__geo">{{ row.clientGeo || "—" }}</div>
            </div>
          </template>
        </ScTableColumn>
        <ScTableColumn label="应用" min-width="320" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="fbl__app" :title="row.application">{{ row.application }}</span>
          </template>
        </ScTableColumn>
        <ScTableColumn label="命中次数" width="120" align="center">
          <template #default="{ row }">
            <span class="fbl__hit">{{ row.hitCount }}</span>
          </template>
        </ScTableColumn>
        <ScTableColumn label="持续时间" width="150" align="center">
          <template #default="{ row }">
            <span class="fbl__duration">{{ row.durationLabel }}</span>
          </template>
        </ScTableColumn>
        <ScTableColumn label="开始时间" width="210">
          <template #default="{ row }">
            <div class="fbl__time">
              <div>{{ row.startDate }}</div>
              <div class="fbl__time-sub">{{ row.startClock }}</div>
            </div>
          </template>
        </ScTableColumn>
      </ScTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { getFirewallEvents, type FirewallEventRecord } from "@/api/system-server";

const props = defineProps<{
  serverId: number;
}>();

const emit = defineEmits<{
  (e: "refresh"): void;
}>();

const filters = reactive({
  clientIp: "",
  domain: "",
  port: "",
  startTime: "",
  endTime: "",
});

type AggRow = {
  id: string;
  clientIp: string;
  clientGeo: string;
  application: string;
  hitCount: number;
  durationLabel: string;
  startDate: string;
  startClock: string;
};

const rawRows = ref<FirewallEventRecord[]>([]);

function parseTime(r: FirewallEventRecord): number | null {
  const text = r.eventTime;
  if (!text) return null;
  const d = new Date(text.replace(/-/g, "/"));
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

function splitDateTime(s: string): { date: string; time: string } {
  const parts = s.trim().split(/\s+/);
  if (parts.length >= 2) return { date: parts[0]!, time: parts[1]! };
  return { date: s || "—", time: "" };
}

function resolveHost(r: FirewallEventRecord): string {
  return (r.host || "").trim();
}

function resolveApplication(r: FirewallEventRecord): string {
  const path = (r.path || "").trim() || "/";
  const host = resolveHost(r);
  if (/^https?:\/\//i.test(path)) return path;
  if (host) return `https://${host}${path.startsWith("/") ? path : `/${path}`}`;
  return path;
}

function isBlocked(r: FirewallEventRecord): boolean {
  const action = (r.action || "").toUpperCase();
  const reason = (r.reason || "").toUpperCase();
  return action === "DENY" || action === "RATE_LIMIT" || reason.includes("BLACKLIST") || reason.includes("BLOCK");
}

function parseDateInput(value: string): number | null {
  const text = value.trim();
  if (!text) return null;
  const parsed = new Date(text.replace(/-/g, "/")).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function inTimeRange(timestamp: number | null): boolean {
  if (timestamp == null) return true;
  const start = parseDateInput(filters.startTime);
  const end = parseDateInput(filters.endTime);
  if (start != null && timestamp < start) return false;
  if (end != null && timestamp > end) return false;
  return true;
}

const tableRows = computed<AggRow[]>(() => {
  const groups = new Map<string, FirewallEventRecord[]>();

  for (const row of rawRows.value) {
    if (!isBlocked(row)) continue;
    const timestamp = parseTime(row);
    if (!inTimeRange(timestamp)) continue;
    const application = resolveApplication(row);
    const clientIp = (row.clientIp || "").trim() || "—";
    const key = `${clientIp}@@${application}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const ipFilter = filters.clientIp.trim();
  const domainFilter = filters.domain.trim().toLowerCase();
  const portFilter = filters.port.trim();

  return [...groups.entries()]
    .map(([key, items]) => {
      const sorted = [...items]
        .map((item) => ({ item, time: parseTime(item) }))
        .sort((a, b) => (a.time ?? 0) - (b.time ?? 0));
      const first = sorted[0]?.item ?? items[0]!;
      const firstTime = sorted[0]?.time ?? null;
      const lastTime = sorted[sorted.length - 1]?.time ?? firstTime;
      const diffMin = firstTime == null || lastTime == null ? 0 : Math.max(0, Math.round((lastTime - firstTime) / 60000));
      const eventTime = first.eventTime || "—";
      const startRaw = eventTime;
      const { date, time } = splitDateTime(startRaw);
      return {
        id: key,
        clientIp: (first.clientIp || "").trim() || "—",
        clientGeo: (first.clientGeo || "").trim() || "江苏 · 徐州",
        application: resolveApplication(first),
        hitCount: items.length,
        durationLabel: `${diffMin} 分钟`,
        startDate: date,
        startClock: time,
      };
    })
    .filter((row) => {
      if (ipFilter && !row.clientIp.includes(ipFilter)) return false;
      if (domainFilter && !row.application.toLowerCase().includes(domainFilter)) return false;
      if (portFilter && !row.application.includes(`:${portFilter}`) && !row.application.endsWith(portFilter)) return false;
      return true;
    })
    .sort((a, b) => b.hitCount - a.hitCount);
});

const noop = () => {};

const handleRefresh = async () => {
  emit("refresh");
  await load();
};

const load = async () => {
  if (!props.serverId) {
    rawRows.value = [];
    return;
  }
  const response = await getFirewallEvents({
    serverId: props.serverId,
    clientIp: filters.clientIp.trim() || undefined,
    startTime: filters.startTime.trim() || undefined,
    endTime: filters.endTime.trim() || undefined,
    limit: 5000,
  });
  rawRows.value = response?.data || [];
};

watch(
  () => props.serverId,
  () => {
    void load();
  },
  { immediate: true },
);

onMounted(() => {
  void load();
});
</script>

<style scoped lang="scss">
.fbl {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  color: #1f466d;
  background: linear-gradient(180deg, #f8fbff 0%, #f3f8ff 100%);
}

.fbl__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.fbl__filters {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
  flex: 1;
}

.fbl__field,
.fbl__range {
  width: 100%;
}

.fbl__field--narrow {
  min-width: 0;
}

.fbl__refresh {
  flex-shrink: 0;
  min-width: 92px;
}

.fbl__table {
  flex: 1;
  min-height: 0;
  border-radius: 16px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid rgba(127, 158, 193, 0.26);
  box-shadow: 0 8px 24px rgba(25, 64, 108, 0.08);
}

.fbl__ip-block {
  line-height: 1.4;
}

.fbl__ip {
  font-size: 15px;
  font-weight: 700;
  color: #173f66;
}

.fbl__geo {
  margin-top: 4px;
  font-size: 12px;
  color: #768ba3;
}

.fbl__app {
  color: #21507c;
  font-size: 15px;
}

.fbl__hit {
  display: inline-flex;
  min-width: 2.4em;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid #f14e4e;
  color: #ff6666;
  font-weight: 700;
  background: #fff4f4;
}

.fbl__duration {
  color: #1f466d;
  font-weight: 700;
}

.fbl__time {
  color: #24496f;
  font-weight: 700;
  line-height: 1.45;
}

.fbl__time-sub {
  color: #6f85a0;
}

.fbl :deep(.el-input__wrapper),
.fbl :deep(.el-input-number__wrapper),
.fbl :deep(.el-range-editor.el-input__wrapper) {
  border-radius: 8px;
  background: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(127, 158, 193, 0.28);
}

.fbl :deep(.el-input__inner),
.fbl :deep(.el-range-input) {
  color: #24496f;
}

.fbl :deep(.el-input__inner::placeholder),
.fbl :deep(.el-range-input::placeholder) {
  color: #90a0b2;
}

.fbl :deep(.el-button) {
  border-radius: 8px;
  background: #ffffff;
  border-color: rgba(127, 158, 193, 0.38);
  color: #24496f;
}

.fbl :deep(.el-table) {
  --el-table-bg-color: #ffffff;
  --el-table-tr-bg-color: #ffffff;
  --el-table-row-hover-bg-color: #f6faff;
  --el-table-header-bg-color: #eef5ff;
  --el-table-header-text-color: #1f466d;
  --el-table-text-color: #274e74;
  --el-table-border-color: rgba(127, 158, 193, 0.12);
}

.fbl :deep(.el-table th.el-table__cell) {
  background: #eef5ff;
  color: #1f466d;
  font-weight: 700;
}

.fbl :deep(.el-table td.el-table__cell) {
  background: #ffffff;
}

@media (max-width: 1280px) {
  .fbl__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .fbl__filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .fbl {
    padding: 14px;
  }

  .fbl__filters {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>

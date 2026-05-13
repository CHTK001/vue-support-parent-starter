<template>
  <div class="fal">
    <div class="fal__bar">
      <el-segmented v-model="viewMode" class="fal__seg" :options="viewOptions" />
      <span class="fal__hint">{{ viewMode === "summary" ? "按源 IP + 路径聚合拦截记录" : "完整日志行，支持查看详情" }}</span>
    </div>

    <!-- 汇总：参考 WAF 攻击汇总表 -->
    <div v-show="viewMode === 'summary'" class="fal__table-wrap">
      <ScTable :data="summaryRows" row-key="id" size="small" empty-text="暂无拦截记录，可切换到「明细」查看全部">
        <ScTableColumn label="源 IP" min-width="200">
          <template #default="{ row }">
            <div class="fal__ip-cell">
              <el-dropdown trigger="hover" @command="(c: string) => onIpMenu(c, row.clientIp)">
                <span class="fal__ip-main">{{ row.clientIp || "—" }}</span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="group">加入 IP 组</el-dropdown-item>
                    <el-dropdown-item command="profile">查看 IP 画像</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <div class="fal__ip-sub">{{ row.clientGeo || "—" }}</div>
            </div>
          </template>
        </ScTableColumn>
        <ScTableColumn label="应用" min-width="280" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="fal__app">{{ row.application }}</span>
          </template>
        </ScTableColumn>
        <ScTableColumn label="攻击次数" width="120" align="center">
          <template #default="{ row }">
            <span class="fal__hit">{{ row.hitCount }}</span>
          </template>
        </ScTableColumn>
        <ScTableColumn label="持续时间" width="110" align="center">
          <template #default="{ row }">
            {{ row.durationLabel }}
          </template>
        </ScTableColumn>
        <ScTableColumn label="开始时间" width="130">
          <template #default="{ row }">
            <div class="fal__time-stack">
              <div>{{ row.startDate }}</div>
              <div class="fal__time-sub">{{ row.startClock }}</div>
            </div>
          </template>
        </ScTableColumn>
      </ScTable>
    </div>

    <!-- 明细：参考 WAF 日志明细表 -->
    <div v-show="viewMode === 'detail'" class="fal__table-wrap">
      <ScTable :data="detailRows" row-key="detailKey" size="small" empty-text="暂无日志">
        <ScTableColumn label="动作" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.actionTag" size="small" effect="light">{{ row.actionLabel }}</el-tag>
          </template>
        </ScTableColumn>
        <ScTableColumn label="攻击地址" min-width="280" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="fal__addr">{{ row.attackAddress }}</span>
          </template>
        </ScTableColumn>
        <ScTableColumn label="攻击类型" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.attackType }}
          </template>
        </ScTableColumn>
        <ScTableColumn label="源 IP" min-width="180">
          <template #default="{ row }">
            <div class="fal__ip-cell">
              <el-dropdown trigger="hover" @command="(c: string) => onIpMenu(c, row.clientIp)">
                <span class="fal__ip-main">{{ row.clientIp || "—" }}</span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="group">加入 IP 组</el-dropdown-item>
                    <el-dropdown-item command="profile">查看 IP 画像</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <div class="fal__ip-sub">{{ row.clientGeo || "—" }}</div>
            </div>
          </template>
        </ScTableColumn>
        <ScTableColumn label="时间" width="168">
          <template #default="{ row }">
            <ScTimeText :model-value="row.timeDisplay" />
          </template>
        </ScTableColumn>
        <ScTableColumn label="" width="72" align="center" fixed="right">
          <template #default="{ row }">
            <ScButton text type="primary" @click="openDetail(row.raw)">详情</ScButton>
          </template>
        </ScTableColumn>
      </ScTable>
    </div>

    <el-drawer v-model="drawerVisible" title="日志详情" size="420px" destroy-on-close>
      <dl v-if="drawerRow" class="fal__drawer">
        <template v-for="([k, v], i) in drawerPairs" :key="i">
          <dt>{{ k }}</dt>
          <dd>{{ v || "—" }}</dd>
        </template>
      </dl>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { SystemServerFilterLogRecord } from "@/api/system-server";
import { message } from "@repo/utils";
import { ScTimeText } from "@repo/components/ScTimeText";
import { ScButton } from "@repo/components/ScButton";
import ScTable from "@repo/components/ScTable";
import { ScTableColumn } from "@repo/components/ScTableColumn";

const props = defineProps<{ rows: SystemServerFilterLogRecord[] }>();

const viewMode = ref<"summary" | "detail">("summary");
const viewOptions = [
  { label: "汇总（拦截）", value: "summary" },
  { label: "明细", value: "detail" },
];

const drawerVisible = ref(false);
const drawerRow = ref<SystemServerFilterLogRecord | null>(null);

function isDeny(r: SystemServerFilterLogRecord): boolean {
  return (r.actionStatus || "").toUpperCase() === "DENY";
}

function parseTime(r: SystemServerFilterLogRecord): number | null {
  const t = r.storeTime || r.accessTime;
  if (!t) return null;
  const d = new Date(t.replace(/-/g, "/"));
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

function appUrl(r: SystemServerFilterLogRecord): string {
  const path = (r.path || "").trim() || "—";
  if (/^https?:\/\//i.test(path)) return path;
  return path;
}

function splitDateTime(s: string): { date: string; time: string } {
  const parts = s.trim().split(/\s+/);
  if (parts.length >= 2) return { date: parts[0]!, time: parts[1]! };
  return { date: s || "—", time: "" };
}

type SummaryRow = {
  id: string;
  clientIp: string;
  clientGeo: string;
  application: string;
  hitCount: number;
  durationLabel: string;
  startDate: string;
  startClock: string;
};

const summaryRows = computed<SummaryRow[]>(() => {
  const list = (props.rows || []).filter(isDeny);
  const g = new Map<string, SystemServerFilterLogRecord[]>();
  for (const r of list) {
    const ip = (r.clientIp || "").trim() || "—";
    const path = (r.path || "").trim() || "—";
    const key = `${ip}@@${path}`;
    if (!g.has(key)) g.set(key, []);
    g.get(key)!.push(r);
  }

  const out: SummaryRow[] = [];
  for (const [key, items] of g) {
    const withTime = items
      .map((r) => ({ r, t: parseTime(r) }))
      .filter((x) => x.t != null) as { r: SystemServerFilterLogRecord; t: number }[];
    if (!withTime.length) {
      const first = items[0]!;
      const st = first.storeTime || first.accessTime || "—";
      const { date, time } = splitDateTime(st);
      out.push({
        id: key,
        clientIp: (first.clientIp || "").trim() || "—",
        clientGeo: (first.clientGeo || "").trim() || "—",
        application: appUrl(first),
        hitCount: items.length,
        durationLabel: "—",
        startDate: date,
        startClock: time,
      });
      continue;
    }
    withTime.sort((a, b) => a.t - b.t);
    const first = withTime[0]!.r;
    const tMin = withTime[0]!.t;
    const tMax = withTime[withTime.length - 1]!.t;
    const diffMin = Math.max(0, Math.round((tMax - tMin) / 60000));
    const durationLabel = diffMin === 0 ? "0 分钟" : `${diffMin} 分钟`;
    const st = withTime[0]!.r.storeTime || withTime[0]!.r.accessTime || "—";
    const { date, time } = splitDateTime(st);
    out.push({
      id: key,
      clientIp: (first.clientIp || "").trim() || "—",
      clientGeo: (first.clientGeo || "").trim() || "—",
      application: appUrl(first),
      hitCount: items.length,
      durationLabel,
      startDate: date,
      startClock: time,
    });
  }
  return out.sort((a, b) => b.hitCount - a.hitCount);
});

type DetailVm = {
  detailKey: string;
  raw: SystemServerFilterLogRecord;
  actionLabel: string;
  actionTag: "danger" | "success" | "info";
  attackAddress: string;
  attackType: string;
  clientIp: string;
  clientGeo: string;
  timeDisplay: string;
};

const detailRows = computed<DetailVm[]>(() =>
  (props.rows || []).map((r, idx) => {
    const deny = isDeny(r);
    const pass = (r.actionStatus || "").toUpperCase() === "PASS";
    const st = r.storeTime || r.accessTime || "—";
    return {
      detailKey: `${r.id ?? idx}-${st}`,
      raw: r,
      actionLabel: deny ? "已拦截" : pass ? "已放行" : (r.actionStatus || "未知"),
      actionTag: deny ? "danger" : pass ? "success" : "info",
      attackAddress: appUrl(r),
      attackType: [r.ruleCategory, r.processStatus].filter(Boolean).join(" / ") || "—",
      clientIp: (r.clientIp || "").trim() || "—",
      clientGeo: (r.clientGeo || "").trim() || "—",
      timeDisplay: st,
    };
  }),
);

const drawerPairs = computed(() => {
  const r = drawerRow.value;
  if (!r) return [] as [string, string][];
  return [
    ["时间", r.storeTime || r.accessTime || ""],
    ["动作", r.actionStatus || ""],
    ["分类", r.ruleCategory || ""],
    ["命中规则", r.processStatus || ""],
    ["方法", r.method || ""],
    ["路径", r.path || ""],
    ["请求 ID", r.requestId || ""],
    ["源 IP", r.clientIp || ""],
    ["地域", r.clientGeo || ""],
    ["UA", r.userAgent || ""],
    ["原因", r.decisionReason || ""],
    ["耗时(ms)", r.durationMs != null ? String(r.durationMs) : ""],
  ] as [string, string][];
});

function onIpMenu(cmd: string, ip: string) {
  if (cmd === "group") {
    message(`可将 ${ip} 在「访问控制 → 黑名单」中维护（当前为快捷入口提示）`, { type: "info" });
    return;
  }
  if (cmd === "profile") {
    message("IP 画像能力建设中，可先在明细中查看完整请求字段。", { type: "info" });
  }
}

function openDetail(r: SystemServerFilterLogRecord) {
  drawerRow.value = r;
  drawerVisible.value = true;
}
</script>

<style scoped lang="scss">
.fal {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  flex: 1;
  color: #1d436a;
}

.fal__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 16px;
}

.fal__seg {
  max-width: 360px;
}

.fal__hint {
  font-size: 12px;
  color: #5d7692;
}

.fal__table-wrap {
  flex: 1;
  min-height: 280px;
  border: 1px solid rgba(126, 153, 183, 0.28);
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

.fal__ip-cell {
  line-height: 1.35;
}

.fal__ip-main {
  font-weight: 700;
  color: #143f67;
  cursor: pointer;
  border-bottom: 1px dashed rgba(32, 79, 124, 0.35);
}

.fal__ip-sub {
  font-size: 12px;
  color: #5d7692;
  margin-top: 2px;
}

.fal__app,
.fal__addr {
  font-size: 12px;
  color: #204f7c;
}

.fal__hit {
  display: inline-flex;
  min-width: 2em;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  font-weight: 700;
  font-size: 13px;
  color: #b42318;
  border: 1px solid #ef4444;
  border-radius: 4px;
  background: #fff5f5;
  font-variant-numeric: tabular-nums;
}

.fal__time-stack {
  font-size: 12px;
  line-height: 1.35;
  color: #204f7c;
}

.fal__time-sub {
  color: #5d7692;
  font-variant-numeric: tabular-nums;
}

.fal__drawer {
  margin: 0;
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 8px 12px;
  font-size: 13px;
}

.fal__drawer dt {
  margin: 0;
  color: #5d7692;
  font-weight: 600;
}

.fal__drawer dd {
  margin: 0;
  color: #143f67;
  word-break: break-word;
}
</style>

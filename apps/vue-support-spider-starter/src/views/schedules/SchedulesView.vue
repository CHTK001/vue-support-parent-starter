<template>
  <div class="page-container">
    <el-card shadow="never" class="toolbar">
      <div class="flex items-center justify-between">
        <span class="text-sm text-el-text-secondary">
          共 {{ definitions.length }} 条定时任务，下次触发时间已按本地时区计算
        </span>
        <el-tooltip content="刷新" placement="top">
          <el-button :icon="Refresh" circle @click="load" />
        </el-tooltip>
      </div>
    </el-card>

    <el-card shadow="never" class="mt-3">
      <el-table v-loading="loading" :data="rows" stripe empty-text="暂无定时任务">
        <el-table-column prop="spiderCode" label="爬虫编码" min-width="140" />
        <el-table-column prop="spiderName" label="名称" min-width="180" />
        <el-table-column prop="spiderScheduleCron" label="Cron 表达式" width="200" />
        <el-table-column label="下次触发" width="200">
          <template #default="{ row }">
            {{ formatNext(row.nextAt) }}
          </template>
        </el-table-column>
        <el-table-column label="距离" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.countdownMs < 60_000 ? 'danger' : 'info'"
              size="small"
            >
              {{ row.countdownText }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.spiderStatus === 1 ? 'success' : 'info'"
              size="small"
            >
              {{ row.spiderStatus === 1 ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              :type="row.spiderScheduleEnable === 1 ? 'warning' : 'success'"
              size="small"
              @click="toggleSchedule(row)"
            >
              {{ row.spiderScheduleEnable === 1 ? "禁用" : "启用" }}
            </el-button>
            <el-button
              link
              type="primary"
              size="small"
              @click="runNow(row)"
            >
              执行一次
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Refresh } from "@element-plus/icons-vue";
import { definitionApi, executionApi } from "@/api";
import type { SpiderDefinition, PageResult } from "@/types/spider";
import { CronExpression } from "@/utils/cron";

interface ScheduleRow {
  spiderCode: string;
  spiderName: string;
  spiderScheduleCron: string;
  spiderStatus: number;
  spiderScheduleEnable: number;
  nextAt: Date | null;
  countdownMs: number;
  countdownText: string;
}

const definitions = ref<SpiderDefinition[]>([]);
const rows = ref<ScheduleRow[]>([]);
const loading = ref(false);

/**
 * 加载所有启用定时的爬虫，计算下次触发时间。
 */
async function load(): Promise<void> {
  loading.value = true;
  try {
    const page = (await definitionApi.page(1, 1000)) as PageResult<SpiderDefinition>;
    definitions.value = page.records ?? [];
    const now = new Date();
    rows.value = (page.records ?? [])
      .filter((d) => d.spiderScheduleEnable === 1 && d.spiderScheduleCron)
      .map((d) => buildRow(d, now))
      .sort((a, b) => a.nextAt!.getTime() - b.nextAt!.getTime());
  } finally {
    loading.value = false;
  }
}

/**
 * 构造调度行（含下次触发时间 + 倒计时）。
 */
function buildRow(d: SpiderDefinition, now: Date): ScheduleRow {
  let nextAt: Date | null = null;
  let countdownMs = Number.MAX_SAFE_INTEGER;
  let countdownText = "未解析";
  try {
    const cron = new CronExpression(d.spiderScheduleCron!);
    nextAt = cron.nextAfter(now);
    if (nextAt) {
      countdownMs = nextAt.getTime() - now.getTime();
      countdownText = formatCountdown(countdownMs);
    }
  } catch {
    countdownText = "表达式无效";
  }
  return {
    spiderCode: d.spiderCode!,
    spiderName: d.spiderName!,
    spiderScheduleCron: d.spiderScheduleCron!,
    spiderStatus: d.spiderStatus ?? 0,
    spiderScheduleEnable: d.spiderScheduleEnable ?? 0,
    nextAt,
    countdownMs,
    countdownText,
  };
}

/**
 * 格式化倒计时文案。
 */
function formatCountdown(ms: number): string {
  if (ms < 0) return "已过期";
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec} 秒`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} 分钟`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时`;
  const day = Math.floor(hr / 24);
  return `${day} 天`;
}

/**
 * 格式化为本地时间字符串。
 */
function formatNext(d: Date | null): string {
  if (!d) return "—";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

/**
 * 启用/禁用定时（通过修改 spiderScheduleEnable 字段）。
 */
async function toggleSchedule(row: ScheduleRow): Promise<void> {
  const next = row.spiderScheduleEnable === 1 ? 0 : 1;
  const def = definitions.value.find((d) => d.spiderCode === row.spiderCode);
  if (!def) return;
  try {
    await definitionApi.save({
      ...def,
      spiderScheduleEnable: next,
    });
    ElMessage.success(next === 1 ? "定时已启用" : "定时已禁用");
    await load();
  } catch (e) {
    ElMessage.error("操作失败: " + (e instanceof Error ? e.message : String(e)));
  }
}

/**
 * 立即执行一次（触发后端 /run，不影响定时）。
 */
async function runNow(row: ScheduleRow): Promise<void> {
  try {
    await executionApi.run(row.spiderCode);
    ElMessage.success(`已触发 ${row.spiderCode} 执行`);
  } catch (e) {
    ElMessage.error("触发失败: " + (e instanceof Error ? e.message : String(e)));
  }
}

onMounted(load);
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.toolbar :deep(.el-card__body) {
  padding: 12px 16px;
}
.flex {
  display: flex;
}
.items-center {
  align-items: center;
}
.justify-between {
  justify-content: space-between;
}
.text-sm {
  font-size: 13px;
}
.text-el-text-secondary {
  color: var(--el-text-color-secondary);
}
.mt-3 {
  margin-top: 12px;
}
</style>

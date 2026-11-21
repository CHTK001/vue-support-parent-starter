<script setup lang="ts">
/**
 * 日志检索：条件表单 + /v2/logger/events cursor 分页表格 + 行展开详情 + 空态。
 *
 * cursor 分页与 ReTable 的 page 分页映射：
 *   - cursorByPage[page] = 取第 page 页要带的 cursor（第 1 页为空串）；
 *   - 每次响应把 next cursor 记到 cursorByPage[page + 1]；
 *   - 后端 cursor 为空串 = 没有更多（total 用「已见条数 + 是否还有下一页」合成，
 *     让分页器在 cursor 耗尽前始终认为还有下一页）；
 *   - 每次搜索/重置清空游标链并用 :key 重挂表格，从第 1 页重新拉取。
 */
import { onMounted, reactive, ref } from "vue";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn, ReTableLoader } from "@repo/ui/re-table";
import { LOG_LEVELS, fetchApps, fetchEvents, type LoggerAppInfo } from "../api/logger";
import { formatTs } from "../utils/format";
import LevelTag from "../components/LevelTag.vue";

interface SearchQuery {
  app: string;
  levels: string[];
  keyword: string;
  range: [number, number] | null;
}

const form = reactive<SearchQuery>({ app: "", levels: [], keyword: "", range: null });
/** 已提交的查询快照：点搜索/重置才更新（loader 闭包读取） */
const submitted = ref<SearchQuery>({ app: "", levels: [], keyword: "", range: null });
const searchSeq = ref(0);
const apps = ref<LoggerAppInfo[]>([]);

const cursorByPage = new Map<number, string>();

const columns: ReTableColumn[] = [
  { prop: "ts", label: "时间", width: 170 },
  { prop: "level", label: "级别", width: 96 },
  { prop: "app", label: "应用", width: 150, showOverflowTooltip: true },
  { prop: "instance", label: "实例", width: 150, showOverflowTooltip: true },
  { prop: "logger", label: "Logger", minWidth: 200, showOverflowTooltip: true },
  { prop: "message", label: "消息", minWidth: 320, showOverflowTooltip: true },
];

const loader: ReTableLoader = async ({ page, pageSize }) => {
  const query = submitted.value;
  const resp = await fetchEvents({
    cursor: cursorByPage.get(page) ?? "",
    limit: pageSize,
    app: query.app || undefined,
    level: query.levels,
    keyword: query.keyword || undefined,
    startTs: query.range?.[0],
    endTs: query.range?.[1],
  });
  cursorByPage.set(page + 1, resp.cursor ?? "");
  const items = resp.items ?? [];
  const seen = (page - 1) * pageSize + items.length;
  // cursor 分页没有总数：还有下一页时把 total 抬高一页，驱动分页器继续
  const total = resp.cursor ? seen + 1 : seen;
  return { total, items };
};

function snapshot(): void {
  submitted.value = {
    app: form.app,
    levels: [...form.levels],
    keyword: form.keyword,
    range: form.range ? ([...form.range] as [number, number]) : null,
  };
  cursorByPage.clear();
  searchSeq.value += 1;
}

function doSearch(): void {
  snapshot();
}

function resetSearch(): void {
  form.app = "";
  form.levels = [];
  form.keyword = "";
  form.range = null;
  snapshot();
}

onMounted(async () => {
  try {
    apps.value = (await fetchApps()) ?? [];
  } catch {
    // 错误提示由 http 层统一弹出
  }
});
</script>

<template>
  <div class="search-view logger-scope">
    <!-- 条件表单 -->
    <div class="logger-card">
      <el-form inline @submit.prevent>
        <el-form-item label="应用">
          <el-select v-model="form.app" clearable filterable placeholder="全部应用" style="width: 180px">
            <el-option v-for="item in apps" :key="item.app" :label="item.app" :value="item.app ?? ''" />
          </el-select>
        </el-form-item>
        <el-form-item label="级别">
          <el-select
            v-model="form.levels"
            multiple
            collapse-tags
            collapse-tags-tooltip
            clearable
            placeholder="全部级别"
            style="width: 220px"
          >
            <el-option v-for="lv in LOG_LEVELS" :key="lv" :label="lv" :value="lv" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键字">
          <el-input v-model="form.keyword" clearable placeholder="消息 / Logger" style="width: 220px" @keyup.enter="doSearch" />
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="form.range"
            type="datetimerange"
            value-format="x"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 340px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="doSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 结果表格（cursor 分页 + 行展开） -->
    <div class="logger-card search-table">
      <ReTable :key="searchSeq" :columns="columns" :loader="loader" expandable>
        <template #col-ts="{ row }">{{ formatTs(row.ts, true) }}</template>
        <template #col-level="{ row }">
          <LevelTag :level="row.level" />
        </template>
        <template #expand="{ row }">
          <div class="expand-detail">
            <div class="detail-grid">
              <div class="detail-cell"><label>时间</label><span>{{ formatTs(row.ts, true) }}</span></div>
              <div class="detail-cell"><label>级别</label><span>{{ row.level || "-" }}</span></div>
              <div class="detail-cell"><label>应用</label><span>{{ row.app || "-" }}</span></div>
              <div class="detail-cell"><label>实例</label><span>{{ row.instance || "-" }}</span></div>
              <div class="detail-cell"><label>线程</label><span>{{ row.thread || "-" }}</span></div>
              <div class="detail-cell"><label>Logger</label><span>{{ row.logger || "-" }}</span></div>
            </div>
            <div class="detail-block">
              <label>消息</label>
              <pre>{{ row.message || "-" }}</pre>
            </div>
            <div v-if="row.stacktrace" class="detail-block">
              <label>堆栈</label>
              <pre class="detail-stack">{{ row.stacktrace }}</pre>
            </div>
            <div v-if="row.mdc && Object.keys(row.mdc).length > 0" class="detail-block">
              <label>MDC</label>
              <pre>{{ JSON.stringify(row.mdc, null, 2) }}</pre>
            </div>
          </div>
        </template>
      </ReTable>
    </div>
  </div>
</template>

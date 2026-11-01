<script setup lang="ts">
/**
 * ReTable 能力验收台（隐藏路由，showLink:false）
 *
 * <p>专门验证「远程数据异步化 + 按钮动画」这一组改动：</p>
 * <ul>
 *   <li>大页数据（默认 500 行）刷新时，刷新按钮的 loading 动画是否**一直在转**、
 *       界面是否**不卡死**（长任务被切碎，浏览器能出帧、能响应输入）；</li>
 *   <li>刷新按钮 / 列设置 / 表格设置是否渲染成动画图标（anim: 前缀）；</li>
 *   <li>刷新时是否先出 loading 再取数（点击后立刻有反馈，而不是「按下去没反应」）。</li>
 * </ul>
 *
 * <p>配套浏览器验收脚本 `scripts/re-table-lab-acceptance.mjs`。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, ref } from "vue";

import ReDialog from "@repo/ui/re-dialog";
import ReDrawer from "@repo/ui/re-drawer";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";

defineOptions({ name: "ReTableLab" });

/** 一页多少行 —— 调大能更明显地暴露「同步处理卡死」 */
const pageSize = ref(500);
/** 模拟的接口耗时（ms） */
const latency = ref(600);
/** 最近一次刷新的时间戳（ms） */
const lastLoadedAt = ref(0);
/** loader 被调用的次数 —— 用来验证「恢复页码不会多打一次接口」 */
const loadCount = ref(0);
/** 自定义刷新按钮命中次数 —— 验证 toolbar 按钮的 handler 覆盖了内置刷新 */
const customRefreshCount = ref(0);
/** 批量删除命中次数 —— 验证只配 batchDelete 也会出现复选框与批量按钮 */
const batchDeletedCount = ref(0);
/** 记录刷新期间主线程是否被长任务阻塞 */
const longTasks = ref<Array<{ start: number; duration: number }>>([]);

/** 采集长任务：PerformanceObserver 的 longtask 条目 */
function observeLongTasks() {
  if (typeof PerformanceObserver === "undefined") return;
  if (!PerformanceObserver.supportedEntryTypes?.includes("longtask")) return;
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      longTasks.value.push({ start: Math.round(entry.startTime), duration: Math.round(entry.duration) });
    }
  });
  observer.observe({ entryTypes: ["longtask"] });
}
observeLongTasks();

/** 造一批数据 */
function makeRows(page: number, size: number) {
  const rows: Array<Record<string, unknown>> = [];
  const base = (page - 1) * size;
  for (let i = 0; i < size; i++) {
    const n = base + i + 1;
    rows.push({
      id: n,
      name: `节点-${n}`,
      host: `host-${n}.example.com`,
      status: n % 3 === 0 ? "running" : n % 3 === 1 ? "stopped" : "error",
      cpu: Math.round(Math.random() * 100),
      mem: Math.round(Math.random() * 100),
      desc: `第 ${n} 条记录的说明文本，用于让单元格渲染有真实负载`,
    });
  }
  return rows;
}

/** 远程 loader：模拟后端分页 + 网络耗时 */
async function loader(params: ReTableLoadParams): Promise<RePageResult> {
  const size = params.pageSize ?? 50;
  const page = params.page ?? 1;
  loadCount.value += 1;
  await new Promise((resolve) => setTimeout(resolve, latency.value));
  const records = makeRows(page, size);
  return { records, total: 100000 };
}

const columns: ReTableColumn[] = [
  { prop: "id", label: "ID", width: 80 },
  { prop: "name", label: "名称", width: 160 },
  { prop: "host", label: "主机", width: 220 },
  { prop: "status", label: "状态", width: 110 },
  { prop: "cpu", label: "CPU %", width: 90 },
  { prop: "mem", label: "内存 %", width: 90 },
  { prop: "desc", label: "说明", minWidth: 260, showOverflowTooltip: true },
];

/**
 * 第二张表的分组配置（新 API 验收）：
 *  - pagination：分组分页（pageSize=20 + 记住页码）
 *  - toolbar.refresh：**自定义 handler** —— 点击只计数，不触发内置 reload
 *  - toolbar.batchDelete：**只配它、不配 batchSelect** —— 用来验证勾选框会自动出现
 */
const groupedConfig = computed(() => ({
  pagination: { pageSize: 20, remember: true },
  // 搜索组：enable + filters（旧 search 的全部字段照样可用）
  search: {
    enable: true,
    title: "搜索（分组配置）",
    filters: [
      { key: "name", label: "名称", type: "input" as const, placeholder: "按名称搜索" },
    ],
  },
  // 选择组：常驻勾选列（与批量的勾选列共用一列，不会重复）
  selection: { enable: true },
  toolbar: {
    refresh: {
      tip: "自定义刷新",
      handler: () => {
        customRefreshCount.value += 1;
      },
    },
    batchDelete: {
      tip: "批量删除",
      confirmMessage: "确认删除选中的行？",
      handler: (rows: Record<string, unknown>[]) => {
        batchDeletedCount.value += rows.length;
      },
    },
  },
}));

/** 统计信息 */
const stats = computed(() => ({
  longTaskCount: longTasks.value.length,
  maxLongTask: longTasks.value.reduce((max, t) => Math.max(max, t.duration), 0),
}));

/** 弹窗浮层验收：显隐开关 + closed 回调计数（证明过渡走完、节点已销毁） */
const dialogVisible = ref(false);
const closedCount = ref(0);

/** 最小化浮标验收：多一个打开开关 + closed 计数（验证浮标从 v-if 走向合盘） */
const minDialogVisible = ref(false);
const minClosedCount = ref(0);

/** 抽屉浮层验收：关闭后 drawer DOM 整块销毁，关闭前最小化浮标进 body 再出来 */
const drawerVisible = ref(false);
const drawerClosedCount = ref(0);
</script>

<template>
  <div class="re-table-lab">
    <header class="lab-head">
      <h2>ReTable 验收台 · 远程数据异步化</h2>
      <div class="lab-controls">
        <label>每页行数 <input v-model.number="pageSize" type="number" min="10" max="2000" step="10" /></label>
        <label>接口耗时(ms) <input v-model.number="latency" type="number" min="0" max="5000" step="100" /></label>
        <button type="button" @click="longTasks = []">清空长任务记录</button>
      </div>
      <div class="lab-stats">
        长任务数 <b>{{ stats.longTaskCount }}</b> · 最长 <b>{{ stats.maxLongTask }}ms</b>
        · 最近加载 {{ lastLoadedAt ? new Date(lastLoadedAt).toLocaleTimeString() : "-" }}
        · <b data-testid="load-count">加载次数 {{ loadCount }}</b>
        · <b data-testid="custom-refresh">自定义刷新 {{ customRefreshCount }}</b>
        · <b data-testid="batch-delete">批量删除 {{ batchDeletedCount }}</b>
      </div>
    </header>

    <!-- 第一张表：**旧 props 写法**（验证分组 API 的向后兼容） -->
    <div class="lab-table">
      <ReTable
        :columns="columns"
        :loader="loader"
        :page-size="pageSize"
        table-id="lab-legacy-props"
        row-key="id"
        height="420px"
        stripe
        border
        virtual-scroll
        :virtual-scroll-gt="50"
        @load="lastLoadedAt = Date.now()"
      />
    </div>

    <!-- 第二张表：**分组 API 写法**（config.pagination + config.toolbar），
         同时验证一页两表互不干扰，以及「配了批量删除 handler 就自动出复选框」 -->
    <div class="lab-table">
      <ReTable
        :columns="columns"
        :loader="loader"
        :config="groupedConfig"
        table-id="lab-grouped-config"
        row-key="id"
        height="320px"
        stripe
        border
        @load="lastLoadedAt = Date.now()"
      />
    </div>

    <!-- 最小化浮标 DOM 验收：最小化时浮标进入 body（Teleport），关闭后必须从 body 消失；
         不是 display:none 常驻 —— v-if 而非 v-show。 -->
    <div class="lab-table">
      <button type="button" data-testid="open-min-dialog" @click="minDialogVisible = true">打开最小化弹窗</button>
      <ReDialog v-model="minDialogVisible" title="最小化浮标验收" width="420px" :show-minimize="true" @closed="minClosedCount++">
        <div class="lab-min-dialog-body">最小化后浮标应在 body 出现，关闭后消失</div>
        <template #footer>
          <el-button data-testid="min-dialog-close" @click="minDialogVisible = false">关闭</el-button>
        </template>
      </ReDialog>
      <span data-testid="min-dialog-closed-count">{{ minClosedCount }}</span>
    </div>

    <!-- 第三块：弹窗浮层 DOM 验收 —— 关闭后 overlay 应当整块销毁，
         而不是留一个 display:none 的 <div class="el-overlay"> 常驻 body -->
    <div class="lab-table">
      <button type="button" data-testid="open-dialog" @click="dialogVisible = true">打开弹窗</button>
      <ReDialog v-model="dialogVisible" title="浮层销毁验收" width="420px" @closed="closedCount++">
        <div class="lab-dialog-body">关闭后本浮层应被销毁</div>
        <template #footer>
          <el-button data-testid="dialog-cancel" @click="dialogVisible = false">关闭</el-button>
        </template>
      </ReDialog>
      <span data-testid="dialog-closed-count">{{ closedCount }}</span>
    </div>

    <!-- 第四块：抽屉浮层 DOM 验收 —— 关闭后 drawer DOM 整块销毁（destroyOnClose）；
         抽屉最小化走的是直接 visible 绑定，浮标进 body 后不退场。 -->
    <div class="lab-table">
      <button type="button" data-testid="open-drawer" @click="drawerVisible = true">打开抽屉</button>
      <ReDrawer v-model="drawerVisible" title="最小化浮标验收（抽屉）" size="420px" :show-minimize="true" @closed="drawerClosedCount++">
        <div class="lab-drawer-body">最小化后浮标应在 body 出现</div>
        <template #footer>
          <el-button data-testid="drawer-close" @click="drawerVisible = false">关闭</el-button>
        </template>
      </ReDrawer>
      <span data-testid="drawer-closed-count">{{ drawerClosedCount }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.re-table-lab {
  padding: 16px;
}

.lab-head {
  margin-bottom: 12px;

  h2 {
    margin: 0 0 8px;
    font-size: 16px;
  }
}

.lab-controls {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 8px;

  label {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    font-size: 13px;
  }

  input {
    width: 90px;
    padding: 4px 6px;
  }
}

.lab-stats {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.lab-table {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
}
</style>

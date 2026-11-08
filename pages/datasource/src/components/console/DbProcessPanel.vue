<script setup lang="ts">
/**
 * 会话进程面板（可内嵌于页签或弹窗）。
 *
 * <p>把「显示进程」的能力从数据源中心的弹窗里抽出来，控制台（{@code #/db-manager/full}）
 * 与数据源中心共用一份：列表 / 单条关闭 / 批量关闭 / 刷新都在这一个组件里。</p>
 *
 * <p>后端 {@code /ms/monitor/db/processes} 区分两种「没数据」：{@code supported=false}
 * 是内核根本没有 {@code ProcessManager} SPI 实现（入口本不该出现），
 * {@code supported=true} + {@code message} 是有实现但取不到（如缺 {@code PROCESS} 权限）。
 * 前者显示不可用提示，后者显示错误原因，两者视觉上要能分清。</p>
 *
 * @author CH
 * @since 4.0.0.44
 */
import { message } from "@repo/core";
import { onMounted, ref, watch } from "vue";
import { ElCheckbox, ElMessageBox } from "element-plus";
import ReButton from "@repo/ui/re-button";
import ReIcon from "@repo/ui/re-icon";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
import { fetchDbProcesses, killDbProcess, killDbProcesses, type DbProcessRow } from "../../api";

const props = withDefaults(
  defineProps<{
    /**
     * 数据源 ID。
     *
     * <p>{@code 0} 是<b>合法值</b>：后端把 0 解析为「默认主数据源」，本页其它接口也都这么传。
     * 只有 {@code undefined}（宿主没给）才算缺少 ID —— 早先用 {@code !props.datasourceId}
     * 判断，导致默认主数据源下永远显示「缺少数据源 ID，无法查看会话」。</p>
     */
    datasourceId?: number;
    /**
     * 表格高度。
     *
     * <p>给具体值（如 {@code 380px}）时表格是定高的，用于弹窗；
     * 传空串时不给 {@code layout-table}，由 ReTable 自适应填满父容器剩余高度，
     * 用于控制台页签（父链已有确定高度，见 {@code .dbm-panel-view}）。</p>
     */
    tableHeight?: string;
  }>(),
  { datasourceId: undefined, tableHeight: "380px" },
);

/** 是否支持会话管理（后端 SPI 判定） */
const supported = ref(true);
/** 不支持 / 取数失败的原因 */
const messageText = ref("");
const loading = ref(false);
const rows = ref<DbProcessRow[]>([]);
/** 选中待关闭的进程 ID */
const selection = ref<Set<string>>(new Set());
/** 正在关闭的进程 ID（单条加载态） */
const killing = ref<Set<string>>(new Set());
const killAllLoading = ref(false);

/** 进程列定义（列宽合计控制在 960px 内，避免操作列被横向滚动挡掉） */
const columns: ReTableColumn[] = [
  { prop: "_sel", label: "", width: 40, slot: "col-sel", align: "center" },
  { prop: "pid", label: "PID", width: 72 },
  { prop: "user", label: "用户", minWidth: 82 },
  { prop: "host", label: "客户端", minWidth: 150 },
  { prop: "db", label: "库", minWidth: 90 },
  { prop: "command", label: "命令/状态", minWidth: 100 },
  { prop: "time", label: "时长(s)", width: 72, align: "right" },
  { prop: "info", label: "正在执行", minWidth: 170 },
  { prop: "_op", label: "操作", width: 72, slot: "col-op", align: "center" },
];

/** 加载会话列表 */
const load = async () => {
  if (props.datasourceId === undefined) {
    supported.value = false;
    messageText.value = "缺少数据源 ID，无法查看会话";
    rows.value = [];
    return;
  }
  loading.value = true;
  try {
    const result = await fetchDbProcesses(props.datasourceId);
    supported.value = !!result.supported;
    messageText.value = result.message ?? "";
    rows.value = result.processes ?? [];
    selection.value = new Set();
  } catch (e) {
    // 请求本身失败（网络 / 500）与「内核不支持」是两件事，都当作不支持并给出原因
    supported.value = false;
    messageText.value = String((e as Error)?.message ?? e);
    rows.value = [];
  } finally {
    loading.value = false;
  }
};

/** 切换单条选中 */
const toggleSelect = (pid: string) => {
  const next = new Set(selection.value);
  if (next.has(pid)) {
    next.delete(pid);
  } else {
    next.add(pid);
  }
  selection.value = next;
};

/** 全选 / 取消全选 */
const toggleSelectAll = () => {
  const pids = rows.value.map(r => r.pid);
  selection.value = selection.value.size === pids.length ? new Set() : new Set(pids);
};

/** 关闭单个进程 */
const killOne = async (pid: string) => {
  const datasourceId = props.datasourceId;
  if (datasourceId === undefined) {
    return;
  }
  killing.value = new Set([...killing.value, pid]);
  try {
    const result = await killDbProcess(datasourceId, pid);
    if (result.failCount > 0) {
      message.warning(result.message || `关闭 ${pid} 失败`);
    } else {
      message.success(`已关闭进程 ${pid}`);
    }
    await load();
  } catch (e) {
    message.error(`关闭失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    killing.value = new Set([...killing.value].filter(p => p !== pid));
  }
};

/** 批量关闭选中进程 */
const killSelected = async () => {
  const pids = [...selection.value];
  if (!pids.length) return;
  const datasourceId = props.datasourceId;
  if (datasourceId === undefined) {
    return;
  }
  // 批量是破坏性操作：原数据源中心弹窗有二次确认，抽成共享面板后必须保留
  try {
    await ElMessageBox.confirm(`确认关闭选中的 ${pids.length} 个进程？`, "批量关闭进程", {
      type: "warning",
      confirmButtonText: "关闭",
      cancelButtonText: "取消",
    });
  } catch {
    return;
  }
  killAllLoading.value = true;
  try {
    const result = await killDbProcesses(datasourceId, pids);
    if (result.failCount > 0) {
      message.warning(result.message || `成功 ${result.successCount} 个、失败 ${result.failCount} 个`);
    } else {
      message.success(result.message || `已关闭 ${result.successCount} 个进程`);
    }
    await load();
  } catch (e) {
    message.error(`批量关闭失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    killAllLoading.value = false;
  }
};

onMounted(load);
watch(() => props.datasourceId, () => void load());

defineExpose({ reload: load });
</script>

<template>
  <div class="dbp">
    <div class="dbp-bar">
      <ReButton
        layout="square"
        icon="Refresh"
        tip="刷新"
        data-testid="dbp-refresh"
        :loading="loading"
        @click="load"
      />
      <span class="dbp-count">共 {{ rows.length }} 个进程</span>
      <span class="dbp-spacer" />
      <ReButton
        layout="square"
        icon="Select"
        tip="全选 / 取消全选"
        :disabled="!rows.length"
        data-testid="dbp-selectall"
        @click="toggleSelectAll"
      />
      <ReButton
        :type="selection.size ? 'danger' : ''"
        :loading="killAllLoading"
        :disabled="selection.size === 0"
        data-testid="dbp-batch-kill"
        @click="killSelected"
      >
        <template #icon><ReIcon name="Delete" :size="13" /></template>
        关闭选中 ({{ selection.size }})
      </ReButton>
    </div>

    <p v-if="!supported" class="dbp-error">
      {{ messageText || "该数据库内核不支持会话管理" }}
    </p>
    <template v-else>
      <p v-if="messageText" class="dbp-warn">{{ messageText }}</p>
      <ReTable
        :data="rows"
        :columns="columns"
        :loading="loading"
        row-key="pid"
        size="mini"
        stripe
        border
        :layout-table="tableHeight ? { height: tableHeight } : undefined"
      >
        <template #col-sel="{ row }">
          <ElCheckbox :model-value="selection.has(row.pid)" @change="toggleSelect(row.pid)" />
        </template>
        <template #col-op="{ row }">
          <ReButton
            layout="square"
            size="small"
            type="danger"
            icon="Delete"
            tip="关闭该进程"
            data-testid="dbp-kill"
            :loading="killing.has(row.pid)"
            @click="killOne(row.pid)"
          />
        </template>
      </ReTable>
    </template>
  </div>
</template>

<style scoped>
.dbp {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  /* 弹窗里父级没有确定高度 → 100% 退化为 auto，不影响定高表格；
     页签里父级（.dbm-panel-view）有确定高度 → 这里吃满，表格随之下探。 */
  height: 100%;
}

/* tableHeight 传空串时表格自适应：剩余高度全部给表格，body 内部滚动 */
.dbp > .re-table {
  flex: 1 1 auto;
  min-height: 0;
}

.dbp-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.dbp-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.dbp-spacer {
  flex: 1 1 auto;
}

.dbp-error {
  margin: 0;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}

.dbp-warn {
  margin: 0;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-color-warning-dark-2);
  background: var(--el-color-warning-light-9);
}
</style>

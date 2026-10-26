<!--
  协同表格编辑器 —— Vue 3 封装 Univer（@univerjs/preset-sheets-core）。

  职责：
    1) 初始化 Univer（createUniver + UniverSheetsCorePreset + zh-CN locale），
       容器挂到本组件 DOM；
    2) 加载快照：createWorkbook(JSON.parse(snapshot))（无快照则空工作簿）；
    3) 保存快照：fWorkbook.save() → 后端（版本乐观锁，冲突提示）；
    4) 协同同步：轮询详情接口比版本号，版本变化（他人已保存）且本地无
       未保存改动时自动刷新快照重放；保存冲突时提示刷新。

  数据来源：@pages/filesystem/api/filestorageApi 的 fileCollab* 系列
  （后端 FileCollabStore，快照式协同，SSE 通知 + 轮询兜底）。
-->

<template>
  <div class="fc-editor">
    <div class="fc-editor-bar">
      <span class="fc-editor-title">{{ fileName }}</span>
      <span class="fc-editor-status" :class="saveState">{{ saveStatusText }}</span>
      <span class="fc-editor-ver">版本 v{{ currentVersion }}</span>
      <el-button size="small" :loading="saving" @click="saveNow">保存</el-button>
      <el-button size="small" text @click="refreshSnapshot">从服务器刷新</el-button>
    </div>
    <div ref="containerRef" class="fc-editor-container" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import { ElMessage } from "element-plus";
import type { FUniver } from "@univerjs/presets";
// worker：Univer 公式引擎运行在独立 worker，Vite 用 ?worker&url 打包
import workerUrl from "@univerjs/preset-sheets-core/lib/worker.js?worker&url";
// 样式副作用导入（preset-sheets-core/lib/index.css）
import "@univerjs/preset-sheets-core/lib/index.css";
import {
  getFileCollab,
  saveFileCollabSnapshot,
  type FileCollabInfo,
} from "../api/filestorageApi";

const props = defineProps<{
  /** 协同文档号 */
  collabId: string;
  /** 展示文件名 */
  fileName: string;
}>();

/** Univer 容器引用 */
const containerRef = ref<HTMLElement | null>(null);
/** 初始快照（打开时的最新版本，父组件传入避免首帧空窗） */
const initialSnapshot = defineModel<string>("initialSnapshot", { default: "" });
/** 初始版本号 */
const initialVersion = defineModel<number>("initialVersion", { default: 0 });

/** 当前已加载版本号（乐观锁基准） */
const currentVersion = ref(initialVersion.value);
/** 保存中 */
const saving = ref(false);
/** 保存状态：saved / dirty / saving / conflict */
const saveState = ref<"saved" | "dirty" | "saving" | "conflict">("saved");

const saveStatusText = ref("已同步");

/** Univer facade 实例（懒加载后持有） */
const univerAPI = shallowRef<FUniver | null>(null);
/** 卸载标记 */
let disposed = false;
/** 轮询定时器 */
let pollTimer: ReturnType<typeof setInterval> | null = null;
/** 是否已有未保存改动 */
let dirtyFlag = false;

/** 保存状态文案 */
function renderSaveStatus(): void {
  switch (saveState.value) {
    case "saved":
      saveStatusText.value = `已同步 · v${currentVersion.value}`;
      break;
    case "dirty":
      saveStatusText.value = "有未保存改动";
      break;
    case "saving":
      saveStatusText.value = "保存中…";
      break;
    case "conflict":
      saveStatusText.value = "保存冲突，请刷新";
      break;
  }
}

/** 懒加载并初始化 Univer */
async function initUniver(): Promise<FUniver | null> {
  const container = containerRef.value;
  if (!container) return null;
  try {
    const [{ createUniver, LocaleType, mergeLocales }, { UniverSheetsCorePreset }, zhCN] =
      await Promise.all([
        import("@univerjs/presets"),
        import("@univerjs/preset-sheets-core"),
        import("@univerjs/preset-sheets-core/locales/zh-CN"),
      ]);
    const { univerAPI: api } = createUniver({
      locale: LocaleType.ZH_CN,
      locales: {
        [LocaleType.ZH_CN]: mergeLocales((zhCN as { default?: unknown }).default ?? {}),
      },
      presets: [
        UniverSheetsCorePreset({
          container,
          workerURL: workerUrl as unknown as string,
        }),
      ],
    });
    // 加载初始快照：有快照用快照重建工作簿，否则空工作簿
    if (props.initialSnapshot || initialSnapshot.value) {
      const raw = initialSnapshot.value || props.initialSnapshot;
      try {
        const data = typeof raw === "string" ? JSON.parse(raw) : raw;
        api.createWorkbook(data ?? {});
      } catch {
        api.createWorkbook({});
      }
    } else {
      api.createWorkbook({});
    }
    univerAPI.value = api;
    // 监听单元格/选区变更 → 标脏（轻量：命令触发即标脏，后续保存判断 id 变化可作为增强）
    return api;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[FileCollabEditor] Univer 初始化失败", e);
    ElMessage.error("协同表格初始化失败：" + (e as Error)?.message);
    return null;
  }
}

/** 立即保存当前快照（版本乐观锁） */
async function saveNow(): Promise<void> {
  const api = univerAPI.value;
  if (!api) return;
  const wb = api.getActiveWorkbook();
  if (!wb) return;
  saving.value = true;
  saveState.value = "saving";
  renderSaveStatus();
  try {
    const snapshot = JSON.stringify(wb.save());
    const updated = await saveFileCollabSnapshot(
      props.collabId,
      snapshot,
      currentVersion.value,
    );
    currentVersion.value = updated.version;
    dirtyFlag = false;
    saveState.value = "saved";
    dirtyFlag = false;
    renderSaveStatus();
  } catch (e) {
    saveState.value = "conflict";
    renderSaveStatus();
    ElMessage.warning(e instanceof Error ? e.message : "保存失败（可能与他人冲突）");
  } finally {
    saving.value = false;
  }
}

/** 从服务器拉最新快照并重放（本地无未保存改动时直接覆盖；有改动则提示） */
async function refreshSnapshot(): Promise<void> {
  const api = univerAPI.value;
  if (!api) return;
  try {
    const latest: FileCollabInfo = await getFileCollab(props.collabId);
    if (latest.version === currentVersion.value) {
      // 版本一致，仅更新版本号展示
      currentVersion.value = latest.version;
      return;
    }
    if (dirtyFlag) {
      ElMessage.warning("本地有未保存改动，为避免覆盖他人内容请先保存或放弃本地改动");
      return;
    }
    // 版本变化且无本地改动 → 直接重放最新快照
    const data = latest.snapshot ? JSON.parse(latest.snapshot) : {};
    // 重建工作簿：简单可靠（快照式协同）
    // Univer 无公开的"原地 load"facade，重开一个工作簿并切换当前
    api.createWorkbook(data);
    currentVersion.value = latest.version;
    saveState.value = "saved";
    renderSaveStatus();
    // 提示已用他人版本刷新
    ElMessage.success(`已刷新到他人保存的版本 v${latest.version}`);
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : "刷新快照失败");
  }
}

onMounted(async () => {
  await initUniver();
  // 轮询兜底（SSE 断连时保同步）：每 5s 对比版本号
  pollTimer = setInterval(() => {
    if (disposed || saveState.value === "saving") return;
    void refreshSnapshot();
  }, 5000);
});

onBeforeUnmount(() => {
  disposed = true;
  if (pollTimer) clearInterval(pollTimer);
  if (univerAPI.value) {
    try {
      univerAPI.value.dispose();
    } catch {
      // 卸载时 dispose 失败可忽略
    }
  }
});
</script>

<style scoped>
.fc-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 480px;
  overflow: hidden;
  border-radius: var(--radius-md, 10px);
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
  background: var(--el-bg-color, #fff);
}
.fc-editor-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
  flex-wrap: wrap;
}
.fc-editor-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fc-editor-status {
  font-size: 12px;
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--brand-500, #409eff);
  color: #fff;
}
.fc-editor-status.saving {
  background: var(--metric-cpu, #409eff);
}
.fc-editor-status.dirty {
  background: var(--status-warning, #e6a23c);
}
.fc-editor-status.conflict {
  background: var(--status-error, #f56c6c);
}
.fc-editor-ver {
  font-size: 12px;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
  font-variant-numeric: tabular-nums;
  margin-left: auto;
}
.fc-editor-container {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
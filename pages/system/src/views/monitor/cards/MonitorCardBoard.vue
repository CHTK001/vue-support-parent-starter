<template>
  <section class="mc-board" :class="{ 'is-editing': editing }">
    <!--
      工具条<b>只在编辑态</b>出现。
      浏览态不需要任何按钮：「自定义 / 保存」与「恢复默认」都在页头 —— 页头是唯一固定
      不动的那一条，操作入口放那儿才不会随长页面滚走。这里只留「组件目录」：
      目录面板收起后需要它重新打开。
    -->
    <div v-if="editing" class="mc-board__bar">
      <div class="mc-board__actions">
        <button v-if="!libraryOpen" class="mc-board__btn" @click="libraryOpen = true">
          <el-icon :size="13"><Grid /></el-icon>
          组件目录
        </button>
      </div>
    </div>

    <!-- 编辑态：画布 + 右侧常驻「组件目录」（与首页自定义布局同一套布局） -->
    <div class="mc-board__editor">
      <div class="mc-board__canvas">
        <MonitorCardCanvas
          :cards="cards"
          :grid="grid"
          :editable="editing"
          @update:grid="onGridChange"
          @remove="onRemoveFromCanvas"
          @settings="openSettings"
        >
          <template #default="{ card, editable }">
            <MonitorCardHost
              :card="card!"
              :refresh-key="refreshKey"
              :editable="editable"
              @remove="onRemove"
              @settings="openSettings"
              @patch="onPatch"
            />
          </template>

          <!-- 页面原生区块：正文由页面（ServerMonitor.vue）渲染 -->
          <template #block="{ card, editable }">
            <slot name="block" :card="card!" :editable="editable" />
          </template>
        </MonitorCardCanvas>
      </div>

      <MonitorCardLibrary
        v-if="editing && libraryOpen"
        class="mc-board__library"
        :cards="cards"
        @add="onAdd"
        @close="libraryOpen = false"
      />
    </div>

    <!-- 设置弹窗（标题 / 数据源；尺寸请直接拖拽） -->
    <MonitorCardSettings
      v-model="settingsVisible"
      :card="editingCard"
      :editable-source="editingEditableSource"
      @save="onSaveSettings"
    />
  </section>
</template>

<script setup lang="ts" name="MonitorCardBoard">
/**
 * 页面布局看板（页头以下整页）
 *
 * <p>页面本体只挂这一个组件：<b>整页的区块清单、布局、增删都在这里</b>。区块分两类：</p>
 * <ul>
 *   <li><b>页面原生区块</b>（KPI / 趋势 / 磁盘…，{@code page:} 前缀）—— 正文由页面通过
 *       {@code #block} 插槽渲染，复用页面里现成的实时数据；</li>
 *   <li><b>外围卡片</b>（Actuator / OTel / 自定义）—— 由注册表 {@code registry.ts} 决定，
 *       想加一种新卡片，写一个 .vue + 一条注册项即可，不用回来改这个文件。</li>
 * </ul>
 *
 * <p><b>交互与首页自定义布局一致</b>（{@code packages/theme/src/themes/koi/views/home}）：</p>
 * <ul>
 *   <li>浏览态只读；页头「自定义」进入编辑态（同一个按钮变成「保存」）；</li>
 *   <li>编辑态下画布可拖拽 / 缩放，右侧常驻「组件目录」，区块上浮出「删除 / 设置」；</li>
 *   <li>页头在编辑态额外露出「恢复默认」：把布局退回<b>进编辑前</b>那一版。</li>
 * </ul>
 *
 * <p><b>改动即时落盘</b>（拖动结束就写本地 + 上报用户配置接口），所以「后悔」不能靠内存草稿，
 * 而是靠进入编辑时拍下的快照 —— 见 {@link restorePreEdit}。</p>
 *
 * <p>{@code refreshKey} 是卡片配置变更后的重取信号：卡片各自持有自己的轮询，
 * 用 prop 变化触发它们重取一次，而不是把所有请求都收敛到本组件（那会让本组件
 * 变成所有卡片的数据中心，任何一张卡片改数据源都得改这里）。</p>
 */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { Grid } from "@element-plus/icons-vue";
import { message } from "@repo/core";
import { ElMessageBox } from "element-plus";
// 内置卡片 / 页面区块自注册（副作用导入）：放在「挂载看板」而不是应用入口，
// 这样任何地方 import 本组件即拥有全部内置卡片；其他模块贡献的卡片仍走
// main.ts 里的 registerMonitorCards()。
import "./builtin";
import "./pageBlocks";
import MonitorCardCanvas from "./MonitorCardCanvas.vue";
import MonitorCardHost from "./MonitorCardHost.vue";
import MonitorCardLibrary from "./MonitorCardLibrary.vue";
import MonitorCardSettings from "./MonitorCardSettings.vue";
import { useMonitorCards } from "./useMonitorCards";
import { flushMonitorLayout } from "./useMonitorLayoutSync";
import { getMonitorCardRegistration } from "./registry";
import type { MonitorCardItem, MonitorCardType, MonitorGridItem, MonitorLayoutState } from "./types";

const { cards, grid, add, remove, patch, updateGrid, restore, snapshot, load } = useMonitorCards();

/** 卡片配置变更后的重取信号 */
const refreshKey = ref(0);
/** 编辑态（拖拽 / 缩放 / 目录面板） */
const editing = ref(false);
/** 编辑态右侧目录是否展开 */
const libraryOpen = ref(true);
const settingsVisible = ref(false);
/** 正在编辑的卡片 */
const editingCard = ref<MonitorCardItem | null>(null);
/** 进入编辑时拍下的布局快照（「恢复默认」= 退回到它） */
const beforeEdit = ref<MonitorLayoutState | null>(null);

/** 正在编辑的卡片是否允许改数据源 */
const editingEditableSource = computed(() => {
  const type = editingCard.value?.type;
  if (!type) return false;
  return Boolean(getMonitorCardRegistration(type)?.editableSource);
});

onMounted(() => {
  // 本地存档已在 useMonitorCards 初始化时生效；这里补一次远端（跨设备同步），
  // 接口不可用时静默降级为纯本地。
  void load();
});

onBeforeUnmount(() => {
  // 离页前把去抖窗口里还没发出的那一笔改动冲刷掉，否则「刚拖完就切页」= 白摆
  flushMonitorLayout();
});

/**
 * 进入编辑态：先给当前布局拍一张快照。
 *
 * <p>快照只在<b>这一次编辑</b>内有效：重复进入（比如中途保存后又点自定义）会重新拍，
 * 否则「恢复默认」会退回到上一次编辑开始时的样子，而不是这次。</p>
 */
function enterEdit(): void {
  if (editing.value) return;
  beforeEdit.value = snapshot();
  editing.value = true;
  libraryOpen.value = true;
}

/** 退出编辑态 = 保存（布局在每次改动时就已落盘） */
function exitEdit(): void {
  if (!editing.value) return;
  editing.value = false;
  beforeEdit.value = null;
  message.success("布局已保存");
}

/** 供页头按钮调用（{@code defineExpose}）：编辑态 ↔ 浏览态 */
function toggleEdit(): boolean {
  if (editing.value) {
    exitEdit();
  } else {
    enterEdit();
  }
  return editing.value;
}

/**
 * 「恢复默认」：把布局退回<b>进入编辑前</b>的那一版。
 *
 * <p>这是本页唯一能撤销的操作 —— 改动是即时落盘的，不给一个退回入口的话，
 * 手一抖把 KPI 拖到角落就只能自己再摆回去。</p>
 *
 * @returns 是否真的恢复（用户取消 / 没有快照时为 {@code false}）
 */
async function restorePreEdit(): Promise<boolean> {
  const snap = beforeEdit.value;
  if (!snap) return false;
  try {
    await ElMessageBox.confirm(
      "确定恢复到进入编辑前的布局吗？本次的拖动、缩放与增删都会被撤销。",
      "恢复默认布局",
      { type: "warning", confirmButtonText: "恢复", cancelButtonText: "取消" },
    );
  } catch {
    return false; // 用户取消
  }
  restore(snap);
  beforeEdit.value = snapshot();
  message.success("已恢复为编辑前的布局");
  return true;
}

defineExpose({ enterEdit, exitEdit, toggleEdit, restorePreEdit, editing });

/** 从注册表新增一张卡片（标题 / 尺寸 / 默认配置都取自注册项） */
function onAdd(type: MonitorCardType): void {
  const reg = getMonitorCardRegistration(type);
  if (!reg) {
    message.error(`卡片类型「${type}」未注册`);
    return;
  }
  const added = add(type, {
    title: reg.title,
    size: reg.defaultSize,
    source: reg.source,
    config: reg.defaultConfig ? { ...reg.defaultConfig } : undefined,
  });
  // 自定义卡片建好后直接打开设置：它没有默认数据源，不配就是一张空卡片。
  if (added && reg.editableSource) {
    openSettings(added);
  }
}

/** 拖拽 / 缩放后的网格坐标 */
function onGridChange(next: MonitorGridItem[]): void {
  updateGrid(next);
}

/**
 * 编辑态删除：不弹确认。
 *
 * <p>编辑态里删错了，右侧目录点一下就能加回来；每删一张都弹窗确认会让「清空重摆」
 * 变成一串机械点击。浏览态（{@link onRemove}）相反 —— 那是日常使用，误点代价高，仍要确认。</p>
 */
function onRemoveFromCanvas(id: string): void {
  remove(id);
}

async function onRemove(id: string): Promise<void> {
  const card = cards.value.find((c) => c.id === id);
  if (!card) return;
  try {
    await ElMessageBox.confirm(`确定移除「${card.title}」吗？可从「自定义 → 组件目录」加回来。`, "移除区块", {
      type: "warning",
      confirmButtonText: "移除",
      cancelButtonText: "取消",
    });
  } catch {
    return; // 用户取消
  }
  remove(id);
}

/** 卡片组件把自改的配置交回来（如线程卡片改了刷新间隔） */
function onPatch(id: string, partial: Partial<MonitorCardItem>): void {
  patch(id, partial);
}

function openSettings(card: MonitorCardItem): void {
  editingCard.value = card;
  settingsVisible.value = true;
}

function onSaveSettings(id: string, partial: Partial<MonitorCardItem>): void {
  patch(id, partial);
  // 数据源变了，让该卡片立刻按新配置重取一次
  refreshKey.value += 1;
}
</script>

<style lang="scss" scoped>
.mc-board {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.mc-board__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.mc-board__heading {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
  flex-wrap: wrap;
}

.mc-board__title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.mc-board__hint {
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
}

.mc-board__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.mc-board__btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  font-size: 12px;
  cursor: pointer;
}

.mc-board__btn:hover:not(:disabled) {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-7);
  background: var(--el-color-primary-light-9);
}

.mc-board__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mc-board__btn--primary {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary);
  color: #fff;
}

.mc-board__btn--primary:hover:not(:disabled) {
  color: #fff;
  filter: brightness(1.08);
  border-color: var(--el-color-primary);
  background: var(--el-color-primary);
}

.mc-board__btn--ghost {
  border-style: dashed;
  color: var(--el-text-color-secondary);
}

/* 画布 + 右侧目录：与首页自定义布局同一套横向布局 */
.mc-board__editor {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}

.mc-board__canvas {
  flex: 1 1 auto;
  min-width: 0;
}

.mc-board__library {
  flex: none;
  width: 296px;
  position: sticky;
  top: 12px;
  max-height: calc(100vh - 160px);
}

@media (max-width: 1024px) {
  .mc-board__editor {
    flex-direction: column;
  }

  .mc-board__library {
    width: 100%;
    position: static;
    max-height: 360px;
  }
}
</style>

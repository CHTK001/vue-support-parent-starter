<!--
  ReTreeLab —— ReTree「弹窗编辑路径」的对照组页。

  <p><b>为什么必须单独开一页，而不是并进 {@code /lab/re-controls}：</b>
  ReTree 的「添加根节点 / 添加 / 编辑 / 删除」都会打开<b>模态弹窗</b>
  （{@code .el-overlay}）。验收第 4 节「逐个点」是遍历 `.lab` 里每一颗控件，
  而模态一开就会<b>盖住整页</b> —— 后续点击全被遮罩吞掉，判决会变成一大批
  「死按钮」假阳性。所以这页与那页隔离，由脚本用一个<b>编排式</b>小节单独跑。
  「弹窗会遮挡点击」是这一页的结构性特征，不能靠调参数绕过去。</p>

  <p><b>为什么需要这一页（覆盖缺口）：</b>
  本次改动把弹窗里「名称」输入框的绑定从
  {@code v-model="(formData[labelKey] as string)"}（用 `as` 糊类型）
  换成了可写 computed {@code labelInput}。而弹窗要靠 {@code showToolbar} /
  {@code enableAdd} / {@code enableEdit} 才出现 —— 演示站
  （路由 {@code /debug/ReTree} 与 {@code reTreeMeta}）压根没打开这些开关，
  静态普查也点不到它们。也就是说：<b>改过的那条路径在别处永远测不到</b>。</p>

  <p><b>断言怎么钉死改动本身：</b>
  {@code confirmDialog} 是用 {@code { ...formData.value, children: [] }} 落地的，
  而 {@code formData} 正是靠 {@code labelInput} 这个可写 computed 写入的 ——
  所以「输入的名称必须原样出现在新节点上」这条断言，恰好能测出
  setter 写错位置（新节点会变空标签）；「编辑弹窗必须预填当前名称」
  恰好能测出 getter 分支。</p>
-->
<template>
  <div class="re-tree-lab">
    <header class="re-tree-lab__head">
      <h1 class="re-tree-lab__title">ReTree · 弹窗编辑路径对照组</h1>
      <p class="re-tree-lab__sub">
        供「弹窗输入绑定」验收使用。用组件库本体（<code>@repo/ui/re-tree</code>），不做样式覆盖。
      </p>
    </header>

    <section class="re-tree-lab__block" aria-labelledby="re-tree-lab-h">
      <h2 id="re-tree-lab-h" class="re-tree-lab__h2">
        树（工具栏 + 节点增删改）
      </h2>

      <div class="re-tree-lab__slot" data-lab="tree-demo">
        <ReTree
          v-model:data="treeData"
          show-toolbar
          editable
          enable-add
          enable-edit
          enable-remove
          default-expand-all
          :node-key="'id'"
          :props="{ label: 'label', children: 'children' }"
          @re-add="onAdd"
          @re-edit="onEdit"
          @re-remove="onRemove"
        >
          <!--
            工具栏额外槽位：放一颗**故意不做任何事**的按钮。
            它的存在只为证伪「变更计数增加」这条判据本身 ——
            点它计数必须**不变**，否则说明判据被写成了恒真（静音）。
          -->
          <template #toolbar-extra>
            <button type="button" class="re-tree-lab__noop" @click="noopClicks++">
              对照组·无副作用按钮
            </button>
          </template>
        </ReTree>
      </div>

      <!-- 人类复核用的只读回显：不放任何可点元素 -->
      <p class="re-tree-lab__readout">
        当前节点（<span data-lab-tree-count>{{ labels.length }}</span> 个）：
        <span data-lab-tree-labels>{{ labels.join(" | ") }}</span>
      </p>
      <p class="re-tree-lab__tally">
        变更计数：<span data-lab-tally>{{ log.length }}</span>
        <span class="re-tree-lab__tally-note">（验收的「点了有响应」判据读它）</span>
      </p>
      <p class="re-tree-lab__readout">
        无副作用按钮已被点 <span data-lab-noop-clicks>{{ noopClicks }}</span> 次
        <span class="re-tree-lab__tally-note">（刻意不明文提示期望值；验收读它来证伪判据）</span>
      </p>
    </section>

    <!--
      变更日志：与 /lab/re-controls 同口径 —— 验收读的是**渲染出来的文本**，
      不是内部变量，这样内部实现换了也不会让断言失真。刻意不放可点元素。
    -->
    <section class="re-tree-lab__block" aria-labelledby="re-tree-lab-log-h">
      <h2 id="re-tree-lab-log-h" class="re-tree-lab__h2">变更日志</h2>
      <ol class="re-tree-lab__log" data-lab-log>
        <li v-for="(row, i) in log" :key="i" class="re-tree-lab__log-row">
          <code>{{ row.key }}</code>
          <span class="re-tree-lab__log-arrow">→</span>
          <strong>{{ row.value }}</strong>
        </li>
      </ol>
      <p v-if="!log.length" class="re-tree-lab__log-empty">尚未发生任何变更（点上面任意控件）</p>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * 弹窗对照组页面脚本。
 *
 * <p>三个变更事件（{@code re-add} / {@code re-edit} / {@code re-remove}）都落进
 * {@link log}，让「点了有响应」有可观测的副作用信号。刻意**不**在弹窗的
 * 「取消」上记日志 —— 取消本来就不该改数据，记了反而会把「取消没落地」测没。</p>
 */
import { computed, ref } from "vue";
import ReTree from "@repo/ui/re-tree";
import type { ReTreeItem, ReTreeEmitParams } from "@repo/ui/components/ReTree/types";

interface LogRow {
  key: string;
  value: string;
}

const log = ref<LogRow[]>([]);

/** 追加一条变更记录（倒序，最新在上，便于人眼复核） */
function record(key: string, value: string): void {
  log.value.unshift({ key, value });
  /* 上限保护：验收会连点几十次，不封顶会让日志长到把控件顶出视口 */
  if (log.value.length > 40) log.value.length = 40;
}

const onAdd = (p: ReTreeEmitParams) => record("新增", String(p.item?.label ?? ""));
const onEdit = (p: ReTreeEmitParams) => record("编辑", String(p.item?.label ?? ""));
const onRemove = (p: ReTreeEmitParams) => record("删除", String(p.item?.label ?? ""));

/** 工具栏那颗「无副作用」按钮的点击次数（只用于证伪判据，不进变更计数） */
const noopClicks = ref(0);

/**
 * 树数据。
 *
 * <p>种子数据里**故意留一个二级节点**：只有展开的子节点才渲染出它自己的
 * 「添加 / 编辑 / 删除」，而验收要点的正是「编辑」那颗。</p>
 */
const treeData = ref<ReTreeItem[]>([
  {
    id: 1,
    label: "一级 1",
    children: [
      { id: 11, label: "二级 1-1" },
      { id: 12, label: "二级 1-2" },
    ],
  },
  { id: 2, label: "一级 2" },
]);

/** 递归收集标签，供只读回显与人工复核 */
function collect(nodes: ReTreeItem[]): string[] {
  const out: string[] = [];
  for (const n of nodes) {
    out.push(String(n.label ?? ""));
    if (Array.isArray(n.children)) out.push(...collect(n.children as ReTreeItem[]));
  }
  return out;
}
const labels = computed(() => collect(treeData.value));
</script>

<style lang="scss" scoped>
/*
 * 本页只做排版，**不覆盖被测组件的任何视觉**。
 * 色值一律走 koi / Element 令牌（--el-*），与仓库其余页面同口径。
 */
.re-tree-lab {
  padding: 16px 20px 24px;
  max-width: 1120px;
  margin: 0 auto;
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.re-tree-lab__head {
  margin-bottom: 16px;
}

.re-tree-lab__title {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 600;
}

.re-tree-lab__sub {
  margin: 0;
  color: var(--el-text-color-secondary);
}

.re-tree-lab__block {
  margin-bottom: 16px;
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  background-color: var(--el-bg-color);
}

.re-tree-lab__h2 {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
}

.re-tree-lab__slot {
  max-width: 520px;
}

.re-tree-lab__noop {
  margin-left: 8px;
  padding: 4px 10px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  background-color: var(--el-fill-color-blank);
  color: var(--el-text-color-regular);
  cursor: pointer;
}

.re-tree-lab__readout,
.re-tree-lab__tally {
  margin: 10px 0 0;
  color: var(--el-text-color-secondary);
  word-break: break-all;
}

.re-tree-lab__tally-note {
  margin-left: 6px;
  color: var(--el-text-color-placeholder);
}

.re-tree-lab__log {
  margin: 0;
  padding-left: 20px;
  max-height: 200px;
  overflow: auto;
}

.re-tree-lab__log-row {
  margin-bottom: 4px;
}

.re-tree-lab__log-arrow {
  margin: 0 6px;
  color: var(--el-text-color-placeholder);
}

.re-tree-lab__log-empty {
  margin: 0;
  color: var(--el-text-color-placeholder);
}
</style>

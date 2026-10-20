<!--
  ReControlsLab —— **按钮组 / square 图标选择器**的对照组页面。

  <p>为什么需要它：验收「每个可点按钮都有名字 / 非塌陷 / 图标真画出来 / 点得到 /
  点了有响应」需要一个<b>状态确定、控件密集、无后端依赖</b>的宿主页。演示站
  {@code /debug/ReSelect} 的参数面板每次进页面状态都不同，且没有按钮组；
  而 monitor 那套真实页面要登录、要后端台账，离线跑不起来。
  这一页把两个组件<b>所有形态都摆出来</b>，让普查一次性覆盖完整矩阵。</p>

  <p>页面自身也是被测对象的一部分：它<b>不允许出现"点了没反应"的控件</b>。
  任何一次模型变更都会写进底部「点击日志」，日志既给普查提供可观测副作用信号，
  也让人工复核能一眼看出哪一颗没生效。</p>

  <p>组 / 选择器都用 {@code Re*} 组件本体，不做样式覆盖 —— 覆盖了样式就没法
  验收组件库本身的视觉契约。</p>
-->
<template>
  <div class="lab">
    <header class="lab__head">
      <h1 class="lab__title">Re 按钮组 / square 图标选择器 · 对照组</h1>
      <p class="lab__sub">
        供按钮/图标普查与配色契约验收使用。所有控件均为组件库本体，无样式覆盖。
      </p>
    </header>

    <section class="lab__block" aria-labelledby="lab-grp-h">
      <h2 id="lab-grp-h" class="lab__h2">① 按钮组（ReRadioGroup）</h2>

      <!-- 1. 状态筛选 + 计数：交付图里的形态（实心主色块 + 白字 + 灰未选中） -->
      <div class="lab__row">
        <span class="lab__row-label">状态筛选（胶囊 · default 档）</span>
        <div class="lab__slot">
          <ReRadioGroup v-model="status" data-lab="grp-status">
            <ReRadioButton v-for="o in STATUS_OPTIONS" :key="o.value" :value="o.value">
              <span class="lab__opt">
                <span class="lab__opt-label">{{ o.label }}</span>
                <span class="lab__opt-count" data-lab-count>{{ o.count }}</span>
              </span>
            </ReRadioButton>
          </ReRadioGroup>
        </div>
      </div>

      <!-- 2. 非胶囊（圆角矩形） -->
      <div class="lab__row">
        <span class="lab__row-label">形态开关（非胶囊）</span>
        <div class="lab__slot">
          <ReRadioGroup v-model="shape" :capsule="false" data-lab="grp-shape">
            <ReRadioButton value="capsule">胶囊</ReRadioButton>
            <ReRadioButton value="rounded">圆角矩形</ReRadioButton>
            <ReRadioButton value="square">方形</ReRadioButton>
          </ReRadioGroup>
        </div>
      </div>

      <!-- 3. 尺寸三档 -->
      <div class="lab__row">
        <span class="lab__row-label">尺寸三档</span>
        <div class="lab__slot lab__slot--sizes">
          <ReRadioGroup v-model="sizeSmall" size="small" data-lab="grp-size-sm">
            <ReRadioButton value="a">小</ReRadioButton>
            <ReRadioButton value="b">档</ReRadioButton>
          </ReRadioGroup>
          <ReRadioGroup v-model="sizeDefault" data-lab="grp-size-default">
            <ReRadioButton value="a">默认</ReRadioButton>
            <ReRadioButton value="b">档</ReRadioButton>
          </ReRadioGroup>
          <ReRadioGroup v-model="sizeLarge" size="large" data-lab="grp-size-lg">
            <ReRadioButton value="a">大</ReRadioButton>
            <ReRadioButton value="b">档</ReRadioButton>
          </ReRadioGroup>
        </div>
      </div>

      <!-- 4. 含禁用项：禁用态按契约不点，但仍要合「有名字 / 非塌陷 / 图标画出来」 -->
      <div class="lab__row">
        <span class="lab__row-label">含禁用项</span>
        <div class="lab__slot">
          <ReRadioGroup v-model="withDisabled" :disabled="false" data-lab="grp-disabled">
            <ReRadioButton value="on">启用</ReRadioButton>
            <ReRadioButton value="mid">另一个</ReRadioButton>
            <ReRadioButton value="off" disabled>禁用项</ReRadioButton>
          </ReRadioGroup>
        </div>
      </div>
    </section>

    <section class="lab__block" aria-labelledby="lab-sq-h">
      <h2 id="lab-sq-h" class="lab__h2">② square 图标选择器（ReSelect layout="square"）</h2>

      <!-- 1. 纯图标（默认紧凑档） -->
      <div class="lab__row">
        <span class="lab__row-label">纯图标（默认）</span>
        <div class="lab__slot">
          <ReSelect
            v-model="sqIcon"
            layout="square"
            :data="SQ_ICONS"
            data-lab="sq-icon"
          />
        </div>
      </div>

      <!-- 2. 图标 + 文字 -->
      <div class="lab__row">
        <span class="lab__row-label">图标 + 文字（icon-only=false）</span>
        <div class="lab__slot">
          <ReSelect
            v-model="sqText"
            layout="square"
            :icon-only="false"
            :data="SQ_ICONS"
            data-lab="sq-text"
          />
        </div>
      </div>

      <!-- 3. 竖向档位（一行一档） -->
      <div class="lab__row">
        <span class="lab__row-label">竖向档位（vertical）</span>
        <div class="lab__slot lab__slot--vertical">
          <ReSelect
            v-model="sqVertical"
            layout="square"
            vertical
            :data="SQ_VERTICAL"
            data-lab="sq-vertical"
          />
        </div>
      </div>

      <!-- 4. 大 / 小 档 -->
      <div class="lab__row">
        <span class="lab__row-label">尺寸档</span>
        <div class="lab__slot">
          <ReSelect v-model="sqLarge" layout="square" type="large" :data="SQ_ICONS" data-lab="sq-large" />
          <ReSelect v-model="sqSmall" layout="square" type="small" :data="SQ_ICONS" data-lab="sq-small" />
        </div>
      </div>
    </section>

    <!--
      点击日志：普查的「点了有响应」判据靠它提供可观测副作用。
      刻意不放任何可点元素在里面 —— 否则它自己会被普查扫一遍，
      徒增噪声。data-lab-log 上的字符数直接进判据。
    -->
    <section class="lab__block lab__block--log" aria-labelledby="lab-log-h">
      <h2 id="lab-log-h" class="lab__h2">③ 点击日志（变更计数：<span data-lab-tally>{{ log.length }}</span>）</h2>
      <ol class="lab__log" data-lab-log>
        <li v-for="(row, i) in log" :key="i" class="lab__log-row">
          <code>{{ row.key }}</code>
          <span class="lab__log-arrow">→</span>
          <strong>{{ row.value }}</strong>
        </li>
      </ol>
      <p v-if="!log.length" class="lab__log-empty">尚未发生任何变更（点上面任意控件）</p>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * 对照组页面脚本。
 *
 * <p>每个受控值都用 watch 落进 {@link log}，而不是只在点击回调里写 ——
 * ReSelect 的 square 布局、按钮组的胶囊/多选都可能从组件内部改值，
 * 只认点击回调会把「值确实变了」漏记成「没响应」。</p>
 */
import { ref, watch } from "vue";
import ReSelect from "@repo/ui/re-select";
import { ReRadioGroup, ReRadioButton } from "@repo/ui/re-kit";
/* 类型从组件目录直取：`@repo/ui` 的 exports 只给了 `./re-select`，
   `@repo/ui/re-select/types` 会被通配 `./* -> ./src/*` 解析成
   `src/re-select/types`（不存在）。`components/...` 是本仓已在用的子路径写法。 */
import type { ReOption } from "@repo/ui/components/ReSelect/types";

/* ── 控件数据 ───────────────────────────────────────────── */

/** 状态筛选：带计数，对应交付图里的「全部 1 / 运行中 0 / 成功 0 / 失败 1」 */
const STATUS_OPTIONS = [
  { label: "全部", value: "all", count: 1 },
  { label: "运行中", value: "running", count: 0 },
  { label: "成功", value: "success", count: 0 },
  { label: "失败", value: "failed", count: 1 },
];

/** 纯图标档用的图标选项（四个都有 Element 图标，覆盖 svg 渲染路径） */
const SQ_ICONS: ReOption[] = [
  { label: "列表", value: "list", icon: "List" },
  { label: "网格", value: "grid", icon: "Grid" },
  { label: "看板", value: "kanban", icon: "Menu" },
  { label: "日历", value: "calendar", icon: "Calendar" },
];

/** 竖向档位：带副说明，对应「一行一档 + 主标题 + 副说明」形态 */
const SQ_VERTICAL: ReOption[] = [
  { label: "实时", value: "realtime", icon: "VideoPlay", description: "毫秒级，代价最高" },
  { label: "分钟", value: "minute", icon: "Clock", description: "按分钟对齐" },
  { label: "小时", value: "hour", icon: "Timer", description: "按小时对齐" },
  { label: "每天", value: "day", icon: "Calendar", description: "零点触发" },
];

/* ── 受控值：默认值刻意都 ≠ 第一项 ───────────────────────────
   否则首项天然是激活态，普查要跳过的「已选中项」会偏少，
   覆盖矩阵就不完整。 */
const status = ref("running");
const shape = ref("rounded");
const sizeSmall = ref("b");
const sizeDefault = ref("a");
const sizeLarge = ref("b");
const withDisabled = ref("mid");

const sqIcon = ref("grid");
const sqText = ref("list");
const sqVertical = ref("minute");
const sqLarge = ref("kanban");
const sqSmall = ref("calendar");

/* ── 点击日志 ───────────────────────────────────────────── */

interface LogRow {
  key: string;
  value: string;
}

const log = ref<LogRow[]>([]);

/** 把一次变更追加到日志（倒序，最新在上，便于人眼复核） */
function record(key: string, value: unknown): void {
  log.value.unshift({ key, value: String(value) });
  /* 上限保护：普查会连点几十次，不封顶会让日志长到把控件顶出视口 */
  if (log.value.length > 40) log.value.length = 40;
}

/**
 * 统一挂 watch。
 *
 * <p>逐个手写 watch 容易漏项，而「漏挂一个」的表现恰好是那颗控件被判成死按钮 ——
 * 与真实缺陷无法区分。所以这里用一张表驱动 {@link WATCHED}，
 * 验收侧另有「每个分组的可点元素都真的出现过」的分组覆盖断言兜底：
 * 表里漏挂的控件点下去不改值，会立刻作为死按钮暴露出来。</p>
 */
const WATCHED: Array<[string, () => unknown]> = [
  ["按钮组·状态筛选", () => status.value],
  ["按钮组·形态开关", () => shape.value],
  ["按钮组·尺寸小", () => sizeSmall.value],
  ["按钮组·尺寸默认", () => sizeDefault.value],
  ["按钮组·尺寸大", () => sizeLarge.value],
  ["按钮组·含禁用项", () => withDisabled.value],
  ["square·纯图标", () => sqIcon.value],
  ["square·图标文字", () => sqText.value],
  ["square·竖向档位", () => sqVertical.value],
  ["square·大档", () => sqLarge.value],
  ["square·小档", () => sqSmall.value],
];

for (const [key, get] of WATCHED) {
  watch(get, v => record(key, v), { flush: "post" });
}

/**
 * 变更计数对外可读：`[data-lab-tally]` 的文本就是它。
 *
 * <p>普查脚本读的是**渲染出来的文本**而不是内部变量 —— 这样断言落在用户
 * 真正能看到的东西上，内部实现换了也不会让验收失真。</p>
 */
</script>

<style lang="scss" scoped>
/*
 * 本页只做排版，**不覆盖被测组件的任何视觉**。
 * 色值与圆角一律走 koi / Element 令牌（--el-*），与仓库其余页面同口径。
 */
.lab {
  padding: 16px 20px 24px;
  max-width: 1560px;
  margin: 0 auto;
  font-size: 13px;
}

.lab__head {
  margin-bottom: 12px;
}

.lab__title {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.lab__sub {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.lab__block {
  margin-bottom: 14px;
  padding: 12px 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
}

.lab__h2 {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.lab__row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 6px 0;

  & + & {
    border-top: 1px dashed var(--el-border-color-lighter);
  }
}

.lab__row-label {
  flex: none;
  width: 190px;
  padding-top: 5px;
  color: var(--el-text-color-secondary);
}

.lab__slot {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

/* 竖向档位自带一行一档，给固定宽度避免挤到日志区 */
.lab__slot--vertical {
  width: 320px;
}

.lab__opt {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.lab__opt-count {
  font-variant-numeric: tabular-nums;
  opacity: 0.75;
}

.lab__block--log {
  /* 日志区不参与命中测试的干扰：固定高度 + 自身滚动 */
  max-height: 220px;
  overflow: auto;
}

.lab__log {
  margin: 0;
  padding-left: 20px;
  font-size: 12px;
  line-height: 1.7;
}

.lab__log-row code {
  color: var(--el-text-color-secondary);
  font-family: ui-monospace, "Cascadia Mono", Consolas, monospace;
}

.lab__log-arrow {
  margin: 0 6px;
  color: var(--el-text-color-placeholder);
}

.lab__log-row strong {
  color: var(--el-color-primary);
}

.lab__log-empty {
  margin: 0;
  color: var(--el-text-color-placeholder);
}
</style>
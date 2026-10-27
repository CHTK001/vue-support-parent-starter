<!--
  ReIconStateLab —— 状态图标（两态动画切换）+ 美化后的 ReTable / ReSelect / ReSwitch / ReRadio。

  <p>这一页把本次改动的**全部新能力**摆出来，供人工验收：</p>
  <ul>
    <li><b>ReStateIcon</b>：内置多套图标集（bulb / sunmoon / check / star / bell / arrow / anim），
        激活 / 非激活各一套，切换时做交叉过渡（fade / scale / slide / rotate）。</li>
    <li><b>ReSwitch</b>：square 布局两态图标 + 预设；popover 触发器同样支持。</li>
    <li><b>ReSelect</b>：square 布局按选项 / 组件级配置两态图标；只传 preset 时用内置集。</li>
    <li><b>ReRadio</b>：按钮 / 单选两态图标，激活态图标弹入。</li>
    <li><b>ReTable</b>：布局切换滑块、视图行选中竖条、hover 抬升等视觉打磨。</li>
  </ul>

  <p>页面本身不含后端，数据全部本地 mock。</p>
-->
<template>
  <div class="state-lab">
    <header class="state-lab__head">
      <h1 class="state-lab__title">状态图标 · 两态动画切换</h1>
      <p class="state-lab__sub">
        ReStateIcon 内置多套图标集，激活 / 非激活各一套并做动画切换；
        ReSwitch / ReSelect / ReRadio 通过 <code>active-icon</code> / <code>inactive-icon</code> / <code>preset</code> 配置。
      </p>
    </header>

    <!-- ============ 1. ReStateIcon 原语 ============ -->
    <section class="state-lab__block" aria-labelledby="h-primitive">
      <h2 id="h-primitive" class="state-lab__h2">① ReStateIcon · 内置图标集</h2>
      <p class="state-lab__hint">点击任意图标切换激活态，观察两态切换动画。预设名见下方表格。</p>

      <div class="state-lab__grid">
        <div v-for="p in presetList" :key="p.key" class="state-lab__card">
          <button
            type="button"
            class="state-lab__card-head"
            :aria-pressed="primitiveActive[p.key]"
            @click="primitiveActive[p.key] = !primitiveActive[p.key]"
          >
            <StateIcon :active="primitiveActive[p.key]" :preset="p.key" :size="26" />
            <span class="state-lab__card-name">{{ p.key }}</span>
          </button>
          <p class="state-lab__card-desc">{{ p.desc }}</p>
        </div>
      </div>

      <div class="state-lab__row">
        <span class="state-lab__row-label">切换动画方式（mode）</span>
        <div class="state-lab__slot">
          <button
            v-for="m in modeList"
            :key="m.key"
            type="button"
            class="state-lab__mode"
            :aria-pressed="modeActive[m.key]"
            @click="modeActive[m.key] = !modeActive[m.key]"
          >
            <StateIcon :active="modeActive[m.key]" preset="sunmoon" :mode="m.key" :size="24" />
            <span>{{ m.label }}</span>
          </button>
        </div>
      </div>

      <div class="state-lab__row">
        <span class="state-lab__row-label">完全自定义（props）</span>
        <div class="state-lab__slot">
          <button type="button" class="state-lab__icon-btn" :aria-pressed="customActive" @click="customActive = !customActive">
            <StateIcon :active="customActive" active-icon="StarFilled" inactive-icon="Star" :size="22" />
          </button>
          <button type="button" class="state-lab__icon-btn" :aria-pressed="customActive" @click="customActive = !customActive">
            <StateIcon :active="customActive" active-icon="BellFilled" inactive-icon="Bell" :size="22" />
          </button>
          <button type="button" class="state-lab__icon-btn" :aria-pressed="customActive" @click="customActive = !customActive">
            <StateIcon :active="customActive" icon="ep:star" :size="22" />
          </button>
          <button type="button" class="state-lab__icon-btn" :aria-pressed="customActive" @click="customActive = !customActive">
            <StateIcon :active="customActive" active-icon="anim:tabler:sun" inactive-icon="anim:tabler:moon" :size="26" />
          </button>
        </div>
      </div>
    </section>

    <!-- ============ 2. ReSwitch ============ -->
    <section class="state-lab__block" aria-labelledby="h-switch">
      <h2 id="h-switch" class="state-lab__h2">② ReSwitch · square 两态图标</h2>
      <div class="state-lab__row">
        <span class="state-lab__row-label">内置预设</span>
        <div class="state-lab__slot">
          <ReSwitch v-for="p in presetList" :key="p.key" v-model="switchState[p.key]" layout="square" :preset="p.key" :title="`预设 ${p.key}`" />
        </div>
      </div>
      <div class="state-lab__row">
        <span class="state-lab__row-label">显式双图标</span>
        <div class="state-lab__slot">
          <ReSwitch v-model="switchCustom" layout="square" active-icon="Sunny" inactive-icon="Moon" title="日/夜" />
          <ReSwitch v-model="switchCustom" layout="square" active-icon="BellFilled" inactive-icon="Bell" title="通知" />
          <ReSwitch v-model="switchCustom" layout="square" active-icon="StarFilled" inactive-icon="Star" title="收藏" />
        </div>
      </div>
      <div class="state-lab__row">
        <span class="state-lab__row-label">尺寸三档</span>
        <div class="state-lab__slot">
          <ReSwitch v-model="switchCustom" layout="square" size="small" preset="check" title="小" />
          <ReSwitch v-model="switchCustom" layout="square" preset="check" title="默认" />
          <ReSwitch v-model="switchCustom" layout="square" size="large" preset="check" title="大" />
        </div>
      </div>
    </section>

    <!-- ============ 3. ReSelect square ============ -->
    <section class="state-lab__block" aria-labelledby="h-select">
      <h2 id="h-select" class="state-lab__h2">③ ReSelect · square 图标选择器</h2>
      <div class="state-lab__row">
        <span class="state-lab__row-label">组件级预设（两态）</span>
        <div class="state-lab__slot">
          <ReSelect v-model="selectState.star" layout="square" preset="star" :data="STAR_OPTIONS" />
          <ReSelect v-model="selectState.bell" layout="square" preset="bell" :data="BELL_OPTIONS" />
        </div>
      </div>
      <div class="state-lab__row">
        <span class="state-lab__row-label">选项级双图标</span>
        <div class="state-lab__slot">
          <ReSelect v-model="selectState.weather" layout="square" :data="WEATHER_OPTIONS" />
        </div>
      </div>
      <div class="state-lab__row">
        <span class="state-lab__row-label">竖向档位（带副说明）</span>
        <div class="state-lab__slot state-lab__slot--vertical">
          <ReSelect v-model="selectState.interval" layout="square" vertical preset="check" :data="INTERVAL_OPTIONS" />
        </div>
      </div>
    </section>

    <!-- ============ 3b. ReSelect card ============ -->
    <section class="state-lab__block" aria-labelledby="h-card">
      <h2 id="h-card" class="state-lab__h2">③′ ReSelect · card 卡片布局</h2>
      <p class="state-lab__hint">
        卡片面板：图标位 / 标签 / 描述 / 消耗 / 选中对勾；premium 高亮描边；多选带全选反选与已选计数。
      </p>
      <div class="state-lab__row">
        <span class="state-lab__row-label">单选 · 两态图标</span>
        <div class="state-lab__slot">
          <ReSelect v-model="cardState.single" layout="card" title="模型" :data="CARD_SINGLE_OPTIONS" />
        </div>
      </div>
      <div class="state-lab__row">
        <span class="state-lab__row-label">多选 · 全选 / 反选</span>
        <div class="state-lab__slot">
          <ReSelect
            v-model="cardState.multi"
            layout="card"
            title="选择模型"
            multiple
            bulk-actions
            :data="CARD_MULTI_OPTIONS"
          />
        </div>
      </div>
      <div class="state-lab__row">
        <span class="state-lab__row-label">分组 + premium + 消耗</span>
        <div class="state-lab__slot state-lab__slot--card">
          <ReSelect v-model="cardState.grouped" layout="card" title="模型" :data="CARD_GROUPED_OPTIONS" />
        </div>
      </div>
    </section>

    <!-- ============ 4. ReRadio ============ -->
    <section class="state-lab__block" aria-labelledby="h-radio">
      <h2 id="h-radio" class="state-lab__h2">④ ReRadio · 按钮组两态图标</h2>
      <div class="state-lab__row">
        <span class="state-lab__row-label">内置预设</span>
        <div class="state-lab__slot">
          <ReRadioGroup v-model="radioState.preset">
            <ReRadioButton v-for="p in presetList" :key="p.key" :value="p.key" :preset="p.key">{{ p.key }}</ReRadioButton>
          </ReRadioGroup>
        </div>
      </div>
      <div class="state-lab__row">
        <span class="state-lab__row-label">显式双图标</span>
        <div class="state-lab__slot">
          <ReRadioGroup v-model="radioState.icon">
            <ReRadioButton value="on" active-icon="Sunny" inactive-icon="Moon">白天</ReRadioButton>
            <ReRadioButton value="off" active-icon="Moon" inactive-icon="Sunny">夜间</ReRadioButton>
          </ReRadioGroup>
        </div>
      </div>
      <div class="state-lab__row">
        <span class="state-lab__row-label">纯文字（不传图标）</span>
        <div class="state-lab__slot">
          <ReRadioGroup v-model="radioState.plain">
            <ReRadioButton value="a">选项 A</ReRadioButton>
            <ReRadioButton value="b">选项 B</ReRadioButton>
            <ReRadioButton value="c" disabled>禁用</ReRadioButton>
          </ReRadioGroup>
        </div>
      </div>
    </section>

    <!-- ============ 5. ReTable ============ -->
    <section class="state-lab__block" aria-labelledby="h-table">
      <h2 id="h-table" class="state-lab__h2">⑤ ReTable · 视觉打磨</h2>
      <p class="state-lab__hint">布局切换滑块（表格 / 视图 / 卡片）带渐变滑块与顶部高光；视图行选中有左侧主色竖条。</p>
      <ReTable
        :data="tableData"
        :columns="tableColumns"
        :pagination="true"
        :page-size="5"
        :page-sizes="[5, 10, 20]"
        :layout-switch="true"
        row-key="id"
        :toolbar="true"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * 状态图标 / 组件美化对照页。
 *
 * 所有数据本地 mock；组件全部来自 @repo/ui，无样式覆盖 —— 覆盖了样式就没法
 * 验收组件库本身的视觉契约。
 */
import { ref } from "vue";
import StateIcon from "@repo/ui/re-state-icon";
import ReSwitch from "@repo/ui/re-switch";
import ReSelect from "@repo/ui/re-select";
import { ReRadioGroup, ReRadioButton } from "@repo/ui/re-kit";
import ReTable, { type ReTableColumn } from "@repo/ui/re-table";
import type { ReOption } from "@repo/ui/components/ReSelect/types";

/* ── 内置预设清单 ────────────────────────────────────────── */
const presetList = [
  { key: "bulb", desc: "亮 / 灭灯泡 · 开关默认" },
  { key: "sunmoon", desc: "日光 / 月光 · 通用开关" },
  { key: "check", desc: "对勾 / 叉 · 选中语义" },
  { key: "star", desc: "实心 / 空心 · 收藏" },
  { key: "bell", desc: "实心 / 空心 · 通知" },
  { key: "arrow", desc: "上 / 下 · 展开排序" },
  { key: "anim", desc: "上游动画图标 · 体积更大" },
] as const;

const modeList = [
  { key: "fade" as const, label: "fade" },
  { key: "scale" as const, label: "scale" },
  { key: "slide" as const, label: "slide" },
  { key: "rotate" as const, label: "rotate" },
];

/* ── 受控状态（默认值刻意避开首项，让「已选中」与「未选中」都能被看到） ──── */
const primitiveActive = ref<Record<string, boolean>>({ bulb: true, sunmoon: false, check: true, star: false, bell: true, arrow: false, anim: true });
const modeActive = ref<Record<string, boolean>>({ fade: false, scale: true, slide: false, rotate: true });
const customActive = ref(true);

const switchState = ref<Record<string, boolean>>({ bulb: true, sunmoon: true, check: false, star: true, bell: false, arrow: true, anim: false });
const switchCustom = ref(true);

const selectState = ref<Record<string, string>>({ star: "fav", bell: "on", weather: "sunny", interval: "5s" });
const radioState = ref<Record<string, string>>({ preset: "star", icon: "on", plain: "a" });
const cardState = ref<Record<string, string | string[]>>({ single: "gpt4o", multi: ["m1"], grouped: "gpt4o" });

/* ── 选项数据 ────────────────────────────────────────────── */
const STAR_OPTIONS: ReOption[] = [
  { label: "收藏", value: "fav" },
  { label: "点赞", value: "like" },
  { label: "关注", value: "follow" },
];

const BELL_OPTIONS: ReOption[] = [
  { label: "通知", value: "on" },
  { label: "静音", value: "off" },
];

const WEATHER_OPTIONS: ReOption[] = [
  { label: "晴", value: "sunny", activeIcon: "Sunny", inactiveIcon: "Moon" },
  { label: "阴", value: "cloudy", activeIcon: "Cloudy", inactiveIcon: "Cloudy" },
  { label: "雨", value: "rainy", activeIcon: "Umbrella", inactiveIcon: "Umbrella" },
];

const INTERVAL_OPTIONS: ReOption[] = [
  { label: "实时", value: "1s", description: "毫秒级，代价最高" },
  { label: "5 秒", value: "5s", description: "常用档位" },
  { label: "30 秒", value: "30s", description: "按分钟对齐前一档" },
  { label: "1 分钟", value: "60s", description: "零点触发" },
];

/** 卡片布局：两态图标 + 标签 + 描述 + 消耗 */
const CARD_SINGLE_OPTIONS: ReOption[] = [
  { label: "Seedream 4.5", value: "sd45", description: "旗舰出图", tag: "升级", premium: true, consumption: "专业出图・4 倍消耗" },
  { label: "GPT-4o", value: "gpt4o", description: "通用推理", activeIcon: "Sunny", inactiveIcon: "Moon" },
  { label: "GPT-3.5", value: "gpt35", description: "轻量快速" },
];

/** 卡片布局：多选 + 分组 */
const CARD_MULTI_OPTIONS: ReOption[] = [
  { label: "云端模型", value: "m1", description: "按量计费", group: "云端" },
  { label: "本地模型", value: "m2", description: "离线部署", group: "本地" },
  { label: "微调模型", value: "m3", description: "自定义训练", group: "微调" },
  { label: "兼容模型", value: "m4", description: "OpenAI 兼容", group: "兼容" },
];

/** 卡片布局：分组 + premium + 消耗 */
const CARD_GROUPED_OPTIONS: ReOption[] = [
  { label: "Claude 3.5 Sonnet", value: "claude", description: "长上下文推理", tag: "Pro", premium: true, group: "Anthropic" },
  { label: "Claude 3 Opus", value: "opus", description: "最强推理", premium: true, group: "Anthropic" },
  { label: "GPT-4o", value: "gpt4o", description: "通用多模态", group: "OpenAI" },
];


/* ── ReTable 数据 ─────────────────────────────────────────── */
interface Row {
  id: number;
  name: string;
  role: string;
  status: string;
  updated: string;
  [key: string]: unknown;
}

const tableData: Row[] = [
  { id: 1, name: "状态图标组件", role: "基础控件", status: "已发布", updated: "2026-10-24 09:12" },
  { id: 2, name: "ReStateIcon 预设", role: "基础控件", status: "已发布", updated: "2026-10-24 09:12" },
  { id: 3, name: "ReSwitch 两态图标", role: "开关", status: "进行中", updated: "2026-10-24 08:40" },
  { id: 4, name: "ReRadio 按钮组图标", role: "选择", status: "进行中", updated: "2026-10-24 08:40" },
  { id: 5, name: "ReTable 视觉打磨", role: "表格", status: "待验收", updated: "2026-10-23 21:05" },
  { id: 6, name: "ReSelect square 动画", role: "选择", status: "待验收", updated: "2026-10-23 21:05" },
];

const tableColumns: ReTableColumn[] = [
  { prop: "id", label: "#", width: 64, align: "center" },
  { prop: "name", label: "名称", minWidth: 200 },
  { prop: "role", label: "分组", width: 120 },
  { prop: "status", label: "状态", width: 120 },
  { prop: "updated", label: "更新时间", width: 180 },
];
</script>

<style lang="scss" scoped>
.state-lab {
  padding: 18px 20px 32px;
  max-width: 1560px;
  margin: 0 auto;
  font-size: 13px;
}

.state-lab__head {
  margin-bottom: 14px;
}

.state-lab__title {
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  letter-spacing: 0.2px;
}

.state-lab__sub {
  margin-top: 6px;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.state-lab__sub code {
  padding: 1px 6px;
  border-radius: 4px;
  font-family: ui-monospace, "Cascadia Mono", Consolas, monospace;
  font-size: 12px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.state-lab__block {
  margin-bottom: 16px;
  padding: 16px 18px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
}

.state-lab__h2 {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.state-lab__hint {
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.state-lab__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.state-lab__card {
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-lighter);
}

.state-lab__card-head {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 6px 10px;
  border: 1px solid transparent;
  border-radius: var(--el-radius-sm, 6px);
  background: transparent;
  font: inherit;
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition:
    background-color var(--el-transition-duration-fast, 0.2s) ease,
    border-color var(--el-transition-duration-fast, 0.2s) ease,
    transform 0.12s cubic-bezier(0.22, 1, 0.36, 1);

  &:hover {
    background: var(--el-fill-color-light);
    border-color: var(--el-border-color-light);
  }

  &:active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 16%, transparent);
  }
}

.state-lab__card-name {
  font-size: 12px;
  font-weight: 600;
  font-family: ui-monospace, "Cascadia Mono", Consolas, monospace;
  color: var(--el-text-color-regular);
}

.state-lab__card-desc {
  margin: 8px 0 0;
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.state-lab__row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 7px 0;

  & + & {
    border-top: 1px dashed var(--el-border-color-lighter);
  }
}

.state-lab__row-label {
  flex: none;
  width: 170px;
  padding-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12.5px;
}

.state-lab__slot {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}

.state-lab__slot--vertical {
  width: 320px;
}

/* 卡片布局面板较宽，给固定宽度避免占满整行 */
.state-lab__slot--card {
  width: 340px;
}

.state-lab__mode {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-bg-color);
  font: inherit;
  font-size: 12.5px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition:
    background-color var(--el-transition-duration-fast, 0.2s) ease,
    border-color var(--el-transition-duration-fast, 0.2s) ease,
    color var(--el-transition-duration-fast, 0.2s) ease,
    transform 0.12s cubic-bezier(0.22, 1, 0.36, 1);

  &:hover {
    border-color: var(--el-color-primary-light-3);
    color: var(--el-color-primary);
  }

  &:active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 16%, transparent);
  }

  &[aria-pressed="true"] {
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}

.state-lab__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition:
    background-color var(--el-transition-duration-fast, 0.2s) ease,
    border-color var(--el-transition-duration-fast, 0.2s) ease,
    color var(--el-transition-duration-fast, 0.2s) ease,
    transform 0.12s cubic-bezier(0.22, 1, 0.36, 1);

  &:hover {
    border-color: var(--el-color-primary-light-3);
    color: var(--el-color-primary);
  }

  &:active {
    transform: scale(0.96);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 16%, transparent);
  }

  &[aria-pressed="true"] {
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}

@media (prefers-reduced-motion: reduce) {
  .state-lab__card-head,
  .state-lab__mode,
  .state-lab__icon-btn {
    transition: none;
  }
  .state-lab__card-head:active,
  .state-lab__mode:active,
  .state-lab__icon-btn:active {
    transform: none;
  }
}
</style>

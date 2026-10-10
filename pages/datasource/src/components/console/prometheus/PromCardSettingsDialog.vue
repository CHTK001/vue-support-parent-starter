<template>
  <ReDialog
    :model-value="modelValue"
    :title="`卡片设置 · ${headLabel}`"
    width="720px"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
  >
    <div class="pcs">
      <!-- 模式切换：默认表单；自定义模式直接编辑 JSON -->
      <div class="pcs-mode">
        <div class="dsm-seg" role="group" aria-label="配置模式">
          <button type="button" :class="{ 'is-active': mode === 'form' }" data-testid="pcs-mode-form" @click="switchMode('form')">表单</button>
          <button type="button" :class="{ 'is-active': mode === 'custom' }" data-testid="pcs-mode-custom" @click="switchMode('custom')">自定义 JSON</button>
        </div>
        <span class="pcs-mode-hint">{{ mode === "form" ? "表单配置（默认）" : "直接编辑完整 JSON，适合高级参数" }}</span>
      </div>

      <!-- 表单模式 -->
      <template v-if="mode === 'form'">
        <div class="pcs-row">
          <label class="pcs-label">标题</label>
          <ReInput v-model="form.title" data-testid="pcs-input-title" placeholder="卡片标题" />
        </div>

        <div class="pcs-row">
          <label class="pcs-label">刷新间隔</label>
          <div class="pcs-inline">
            <ReInput v-model="form.refreshSeconds" data-testid="pcs-input-refresh" type="number" placeholder="秒，0 表示不自动刷新" />
            <span class="pcs-suffix">秒</span>
          </div>
        </div>

        <template v-if="kind !== 'prom-script'">
          <div class="pcs-row">
            <label class="pcs-label">数据模式</label>
            <ReSelect v-model="form.mode">
              <ReOption value="instant" label="即时查询（instant）" />
              <ReOption value="range" label="范围查询（range）" />
            </ReSelect>
          </div>

          <div class="pcs-row">
            <label class="pcs-label">PromQL</label>
            <textarea
              v-model="form.promql"
              class="pcs-textarea"
              data-testid="pcs-textarea-promql"
              rows="3"
              spellcheck="false"
              placeholder='如 up 或 rate(prometheus_http_requests_total[5m])'
            ></textarea>
          </div>

          <template v-if="form.mode === 'range' || kind === 'prom-chart'">
            <div class="pcs-row">
              <label class="pcs-label">回看时长</label>
              <div class="pcs-inline">
                <ReInput v-model="form.durationMinutes" type="number" placeholder="分钟" />
                <span class="pcs-suffix">分钟</span>
              </div>
            </div>
            <div class="pcs-row">
              <label class="pcs-label">步长</label>
              <ReInput v-model="form.step" placeholder="空 = 按跨度自动（如 30s / 1m）" />
            </div>
          </template>
        </template>

        <template v-if="kind === 'prom-chart'">
          <div class="pcs-row">
            <label class="pcs-label">图表类型</label>
            <ReSelect v-model="form.chartType">
              <ReOption value="line" label="折线" />
              <ReOption value="bar" label="柱状" />
              <ReOption value="area" label="面积" />
            </ReSelect>
          </div>
          <div class="pcs-row">
            <label class="pcs-label">ECharts 参数</label>
            <textarea
              v-model="form.echarts"
              class="pcs-textarea pcs-textarea--mono"
              data-testid="pcs-textarea-echarts"
              rows="4"
              spellcheck="false"
              placeholder='JSON，深合并到自动生成的 option，如 {"yAxis":{"max":100}}'
            ></textarea>
          </div>
        </template>

        <template v-if="kind === 'prom-script'">
          <div class="pcs-row">
            <label class="pcs-label">采集脚本</label>
            <textarea
              v-model="form.script"
              class="pcs-textarea pcs-textarea--mono"
              data-testid="pcs-textarea-script"
              rows="8"
              spellcheck="false"
              placeholder="JS 函数体，可用 ctx.query / ctx.queryRange 取数，return 文本或对象"
            ></textarea>
          </div>
        </template>

        <template v-if="kind === 'prom-stat' || kind === 'prom-table'">
          <div class="pcs-row">
            <label class="pcs-label">单位 / 小数位</label>
            <div class="pcs-inline">
              <ReInput v-model="form.unit" placeholder="单位（如 % / req/s）" />
              <ReInput v-model="form.decimals" type="number" placeholder="小数位" class="pcs-num" />
            </div>
          </div>
        </template>

        <div class="pcs-divider">外观</div>

        <div class="pcs-row">
          <label class="pcs-label">背景色</label>
          <div class="pcs-inline">
            <input v-model="form.background" class="pcs-color-text" data-testid="pcs-input-background" placeholder="空 = 跟随主题（支持任意 CSS 颜色）" />
            <input :value="colorPick" type="color" class="pcs-color" data-testid="pcs-input-color" @input="onPickColor" />
            <ReButton data-testid="pcs-btn-clear-bg" @click="form.background = ''">清除</ReButton>
          </div>
        </div>
        <div class="pcs-row">
          <label class="pcs-label">预设</label>
          <div class="pcs-swatches">
            <button
              v-for="c in PRESET_COLORS"
              :key="c.value"
              type="button"
              class="pcs-swatch"
              :style="{ background: c.value }"
              :title="c.label"
              @click="form.background = c.value"
            />
          </div>
        </div>

        <div class="pcs-row">
          <label class="pcs-label">文字色</label>
          <div class="pcs-inline">
            <input v-model="form.textColor" class="pcs-color-text" data-testid="pcs-input-textcolor" placeholder="空 = 跟随主题" />
            <ReButton data-testid="pcs-btn-clear-textcolor" @click="form.textColor = ''">清除</ReButton>
          </div>
        </div>

        <div class="pcs-row">
          <label class="pcs-label">自定义 CSS</label>
          <textarea
            v-model="form.css"
            class="pcs-textarea pcs-textarea--mono"
            data-testid="pcs-textarea-css"
            rows="4"
            spellcheck="false"
            placeholder="作用于卡片根元素的 CSS 声明，如 background: linear-gradient(...); border-radius: 12px;"
          ></textarea>
        </div>
      </template>

      <!-- 自定义模式 -->
      <template v-else>
        <div class="pcs-custom-hint">
          完整卡片 JSON（title + prom 配置）。字段与表单模式一一对应；保存前会做 JSON 校验。
        </div>
        <textarea v-model="customText" class="pcs-textarea pcs-textarea--mono pcs-custom-json" data-testid="pcs-custom-json" rows="18" spellcheck="false"></textarea>
        <div v-if="customError" class="pcs-error">{{ customError }}</div>
      </template>
    </div>

    <template #footer>
      <ReButton data-testid="pcs-btn-cancel" @click="emit('update:modelValue', false)">取消</ReButton>
      <ReButton data-testid="pcs-btn-validate" @click="validateCustom" v-if="mode === 'custom'">校验 JSON</ReButton>
      <ReButton type="primary" data-testid="pcs-btn-save" @click="save">保存</ReButton>
    </template>
  </ReDialog>
</template>

<script setup lang="ts" name="PromCardSettingsDialog">
/**
 * 卡片设置弹窗（表单 / 自定义 JSON 双模式，默认表单）。
 *
 * <p>两种模式编辑的是同一份卡片模型：切到自定义时把当前表单序列化为 JSON，
 * 切回表单时解析 JSON 回填。保存时输出新的 widget 条目（父组件负责替换进布局并触发实时保存）。</p>
 */
import { message } from "@repo/core";
import { computed, reactive, ref, watch } from "vue";

import ReButton from "@repo/ui/re-button";
import ReInput from "@repo/ui/re-input";
import ReSelect from "@repo/ui/re-select";
import ReDialog from "@repo/ui/re-dialog";
import { ReOption } from "@repo/ui/re-kit";
import { PROM_CARD_META } from "./promTypes";
import type { PromCardConfig, PromCardKind, PromWidgetItem } from "./promTypes";

const props = defineProps<{
  modelValue: boolean;
  widget: PromWidgetItem | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "save", payload: { widget: PromWidgetItem }): void;
}>();

const PRESET_COLORS = [
  { label: "白", value: "#ffffff" },
  { label: "浅灰", value: "#f5f7fa" },
  { label: "浅蓝", value: "#eef4ff" },
  { label: "浅绿", value: "#eefaf1" },
  { label: "浅黄", value: "#fdf6e3" },
  { label: "浅红", value: "#fdeef0" },
  { label: "深蓝", value: "#1e293b" },
  { label: "深灰", value: "#334155" },
];

const mode = ref<"form" | "custom">("form");
const customText = ref("");
const customError = ref("");

interface FormState extends PromCardConfig {
  title: string;
}

const form = reactive<FormState>({ title: "" });

const kind = computed<PromCardKind>(() => (props.widget?.type || "prom-stat") as PromCardKind);
const headLabel = computed(() => props.widget?.title || PROM_CARD_META[kind.value]?.label || "卡片");

/** 背景色选择器的显示值：表单里存的是任意 CSS 颜色文本，input[type=color] 只认 #rrggbb */
const colorPick = computed(
  () => (/^#[0-9a-fA-F]{6}$/.test(form.background || "") ? (form.background as string) : "#ffffff")
);

/** 打开弹窗时把 widget 配置灌进表单 */
watch(
  () => [props.modelValue, props.widget] as const,
  () => {
    if (!props.modelValue || !props.widget) {
      return;
    }
    mode.value = "form";
    customError.value = "";
    const prom = props.widget.prom ?? {};
    Object.keys(form).forEach(key => {
      // 清掉上一张卡片残留的字段，避免串配置
      if (!(key in prom) && key !== "title") {
        (form as Record<string, unknown>)[key] = undefined;
      }
    });
    Object.assign(form, prom);
    form.title = props.widget.title || "";
    form.mode = (prom.mode ?? (props.widget.type === "prom-chart" ? "range" : "instant")) as "instant" | "range";
    form.refreshSeconds = prom.refreshSeconds ?? 30;
  },
  { immediate: true }
);

/** 原生色块选择器：从事件目标读值写入背景色（不能读 colorPick——它是由背景色派生出来的） */
function onPickColor(e: Event): void {
  const value = (e.target as HTMLInputElement).value;
  if (/^#[0-9a-fA-F]{6}$/.test(value)) {
    form.background = value;
  }
}

/** 切模式：表单 → JSON 序列化；JSON → 解析回填（解析失败留在自定义模式并报错） */
function switchMode(next: "form" | "custom"): void {
  if (next === mode.value) {
    return;
  }
  if (next === "custom") {
    customText.value = JSON.stringify(buildPayload(), null, 2);
    customError.value = "";
    mode.value = "custom";
    return;
  }
  if (!customText.value.trim()) {
    mode.value = "form";
    return;
  }
  try {
    const parsed = JSON.parse(customText.value);
    applyCustom(parsed);
    customError.value = "";
    mode.value = "form";
  } catch (e) {
    customError.value = `JSON 解析失败：${(e as Error)?.message ?? e}`;
  }
}

/** 组装要保存的 widget 条目 */
function buildPayload(): { title: string; prom: PromCardConfig } {
  const { title, ...prom } = form;
  return { title: (title || "").trim(), prom: cleanProm(prom) };
}

/** 去掉空值字段，保持持久化 JSON 干净 */
function cleanProm(prom: PromCardConfig): PromCardConfig {
  const out: Record<string, unknown> = {};
  Object.entries(prom).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") {
      return;
    }
    out[k] = v;
  });
  return out as PromCardConfig;
}

/** 自定义 JSON → 表单回填 */
function applyCustom(parsed: any): void {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("卡片 JSON 必须是对象");
  }
  const prom = parsed.prom && typeof parsed.prom === "object" ? parsed.prom : {};
  Object.keys(form).forEach(key => {
    if (key === "title") {
      return;
    }
    if (!(key in prom)) {
      (form as Record<string, unknown>)[key] = undefined;
    }
  });
  Object.assign(form, prom);
  form.title = typeof parsed.title === "string" ? parsed.title : "";
}

/** 自定义模式的 JSON 校验 */
function validateCustom(): boolean {
  try {
    applyCustom(JSON.parse(customText.value));
    customError.value = "";
    message.success("JSON 合法");
    return true;
  } catch (e) {
    customError.value = `JSON 解析失败：${(e as Error)?.message ?? e}`;
    return false;
  }
}

/** 保存：表单模式直接组装；自定义模式先解析再组装 */
function save(): void {
  if (!props.widget) {
    return;
  }
  let title = form.title;
  let prom: PromCardConfig;
  if (mode.value === "custom") {
    try {
      const parsed = JSON.parse(customText.value);
      applyCustom(parsed);
    } catch (e) {
      customError.value = `JSON 解析失败：${(e as Error)?.message ?? e}`;
      message.error("自定义 JSON 不合法，无法保存");
      return;
    }
  }
  const payload = buildPayload();
  title = payload.title;
  prom = payload.prom;
  const next: PromWidgetItem = { ...props.widget, title: title || headLabel.value, prom };
  emit("save", { widget: next });
  emit("update:modelValue", false);
}
</script>

<style scoped lang="scss">
.pcs {
  max-height: 62vh;
  overflow: auto;
  padding-right: 2px;
}

.pcs-mode {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.dsm-seg {
  display: inline-flex;
  border: 1px solid var(--border-default);
  border-radius: 6px;
  overflow: hidden;
  background: var(--bg-elevated);
}

.dsm-seg button {
  padding: 4px 12px;
  border: 0;
  font-size: 12px;
  color: var(--text-secondary);
  background: transparent;
  cursor: pointer;

  &.is-active {
    background: var(--brand-500);
    color: #fff;
  }
}

.pcs-mode-hint {
  font-size: 12px;
  color: var(--text-tertiary);
}

.pcs-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
}

.pcs-label {
  width: 84px;
  flex-shrink: 0;
  padding-top: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  text-align: right;
}

.pcs-row > :not(.pcs-label) {
  flex: 1;
  min-width: 0;
}

.pcs-inline {
  display: flex;
  align-items: center;
  gap: 8px;

  > :first-child {
    flex: 1;
    min-width: 0;
  }
}

.pcs-num {
  max-width: 110px;
}

.pcs-suffix {
  font-size: 12px;
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.pcs-textarea {
  width: 100%;
  resize: vertical;
  border: 1px solid var(--border-default);
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-primary);
  background: var(--bg-elevated);
  outline: none;

  &:focus {
    border-color: var(--brand-500);
  }
}

.pcs-textarea--mono {
  font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
}

.pcs-custom-json {
  min-height: 260px;
}

.pcs-divider {
  margin: 14px 0 10px;
  padding-top: 8px;
  border-top: 1px dashed var(--border-subtle);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
}

.pcs-color-text {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--border-default);
  border-radius: 6px;
  padding: 5px 8px;
  font-size: 12px;
  color: var(--text-primary);
  background: var(--bg-elevated);
  outline: none;
}

.pcs-color {
  width: 34px;
  height: 30px;
  padding: 0;
  border: 1px solid var(--border-default);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
}

.pcs-swatches {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  flex: 1;
}

.pcs-swatch {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 1px solid var(--border-default);
  cursor: pointer;
  padding: 0;

  &:hover {
    outline: 2px solid var(--brand-300, var(--brand-500));
  }
}

.pcs-custom-hint {
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.pcs-error {
  margin-top: 6px;
  font-size: 12px;
  color: var(--status-error);
}
</style>

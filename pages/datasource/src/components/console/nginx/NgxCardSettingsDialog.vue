<template>
  <ReDialog
    :model-value="modelValue"
    :title="`卡片设置 · ${headLabel}`"
    width="720px"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
  >
    <div class="ngs">
      <!-- 模式切换：默认表单；自定义模式直接编辑 JSON -->
      <div class="ngs-mode">
        <div class="dsm-seg" role="group" aria-label="配置模式">
          <button type="button" :class="{ 'is-active': mode === 'form' }" data-testid="ngs-mode-form" @click="switchMode('form')">表单</button>
          <button type="button" :class="{ 'is-active': mode === 'custom' }" data-testid="ngs-mode-custom" @click="switchMode('custom')">自定义 JSON</button>
        </div>
        <span class="ngs-mode-hint">{{ mode === "form" ? "表单配置（默认）" : "直接编辑完整 JSON，适合高级参数" }}</span>
      </div>

      <!-- 表单模式 -->
      <template v-if="mode === 'form'">
        <div class="ngs-row">
          <label class="ngs-label">标题</label>
          <ReInput v-model="form.title" data-testid="ngs-input-title" placeholder="卡片标题" />
        </div>

        <div class="ngs-row">
          <label class="ngs-label">刷新间隔</label>
          <div class="ngs-inline">
            <ReInput v-model="form.refreshSeconds" data-testid="ngs-input-refresh" type="number" placeholder="秒，0 表示不自动刷新" />
            <span class="ngs-suffix">秒</span>
          </div>
        </div>

        <template v-if="kind === 'ngx-stat'">
          <div class="ngs-row">
            <label class="ngs-label">指标</label>
            <ReSelect v-model="form.metric">
              <ReOption v-for="m in STAT_METRICS" :key="m.value" :value="m.value" :label="m.label" />
            </ReSelect>
          </div>
          <div class="ngs-row">
            <label class="ngs-label">单位 / 小数位</label>
            <div class="ngs-inline">
              <ReInput v-model="form.unit" placeholder="单位（如 conn / req）" />
              <ReInput v-model="form.decimals" type="number" placeholder="小数位" class="ngs-num" />
            </div>
          </div>
        </template>

        <template v-if="kind === 'ngx-chart'">
          <div class="ngs-row">
            <label class="ngs-label">指标</label>
            <div class="ngs-metrics">
              <label v-for="m in TREND_METRICS" :key="m.value" class="ngs-metric-item">
                <input
                  type="checkbox"
                  :checked="selectedMetrics.includes(m.value)"
                  data-testid="ngs-check-metric"
                  :value="m.value"
                  @change="toggleMetric(m.value)"
                />
                <span>{{ m.label }}</span>
              </label>
            </div>
          </div>
          <div class="ngs-row">
            <label class="ngs-label">图表类型</label>
            <ReSelect v-model="form.chartType">
              <ReOption value="line" label="折线" />
              <ReOption value="bar" label="柱状" />
              <ReOption value="area" label="面积" />
            </ReSelect>
          </div>
          <div class="ngs-row">
            <label class="ngs-label">回看 / 间隔</label>
            <div class="ngs-inline">
              <ReInput v-model="form.hours" type="number" placeholder="小时" class="ngs-num" />
              <span class="ngs-suffix">小时</span>
              <ReInput v-model="form.interval" type="number" placeholder="分钟（空=自动）" class="ngs-num" />
              <span class="ngs-suffix">分钟</span>
            </div>
          </div>
          <div class="ngs-row">
            <label class="ngs-label">ECharts 参数</label>
            <textarea
              v-model="form.echarts"
              class="ngs-textarea ngs-textarea--mono"
              data-testid="ngs-textarea-echarts"
              rows="4"
              spellcheck="false"
              placeholder='JSON，深合并到自动生成的 option，如 {"yAxis":{"max":100}}'
            ></textarea>
          </div>
        </template>

        <template v-if="kind === 'ngx-table'">
          <div class="ngs-row">
            <label class="ngs-label">维度</label>
            <ReSelect v-model="form.dimension">
              <ReOption v-for="d in TABLE_DIMENSIONS" :key="d.value" :value="d.value" :label="d.label" />
            </ReSelect>
          </div>
          <div class="ngs-row">
            <label class="ngs-label">Top N</label>
            <div class="ngs-inline">
              <ReInput v-model="form.topN" type="number" placeholder="条数" class="ngs-num" />
              <span class="ngs-suffix">条</span>
            </div>
          </div>
          <div class="ngs-row">
            <label class="ngs-label">扫描 / 窗口</label>
            <div class="ngs-inline">
              <ReInput v-model="form.lines" type="number" placeholder="尾部行数（空=默认）" class="ngs-num" />
              <span class="ngs-suffix">行</span>
              <ReInput v-model="form.minutes" type="number" placeholder="分钟（空=不限）" class="ngs-num" />
              <span class="ngs-suffix">分钟</span>
            </div>
          </div>
        </template>

        <template v-if="kind === 'ngx-script'">
          <div class="ngs-row">
            <label class="ngs-label">采集脚本</label>
            <textarea
              v-model="form.script"
              class="ngs-textarea ngs-textarea--mono"
              data-testid="ngs-textarea-script"
              rows="8"
              spellcheck="false"
              placeholder="JS 函数体，可用 ctx.status / ctx.trend / ctx.accessTop / ctx.urlTrend 取数，return 文本或对象"
            ></textarea>
          </div>
        </template>

        <div class="ngs-divider">外观</div>

        <div class="ngs-row">
          <label class="ngs-label">背景色</label>
          <div class="ngs-inline">
            <input v-model="form.background" class="ngs-color-text" data-testid="ngs-input-background" placeholder="空 = 跟随主题（支持任意 CSS 颜色）" />
            <input :value="colorPick" type="color" class="ngs-color" data-testid="ngs-input-color" @input="onPickColor" />
            <ReButton data-testid="ngs-btn-clear-bg" @click="form.background = ''">清除</ReButton>
          </div>
        </div>
        <div class="ngs-row">
          <label class="ngs-label">预设</label>
          <div class="ngs-swatches">
            <button
              v-for="c in PRESET_COLORS"
              :key="c.value"
              type="button"
              class="ngs-swatch"
              :style="{ background: c.value }"
              :title="c.label"
              @click="form.background = c.value"
            />
          </div>
        </div>

        <div class="ngs-row">
          <label class="ngs-label">文字色</label>
          <div class="ngs-inline">
            <input v-model="form.textColor" class="ngs-color-text" data-testid="ngs-input-textcolor" placeholder="空 = 跟随主题" />
            <ReButton data-testid="ngs-btn-clear-textcolor" @click="form.textColor = ''">清除</ReButton>
          </div>
        </div>

        <div class="ngs-row">
          <label class="ngs-label">自定义 CSS</label>
          <textarea
            v-model="form.css"
            class="ngs-textarea ngs-textarea--mono"
            data-testid="ngs-textarea-css"
            rows="4"
            spellcheck="false"
            placeholder="作用于卡片根元素的 CSS 声明，如 background: linear-gradient(...); border-radius: 12px;"
          ></textarea>
        </div>
      </template>

      <!-- 自定义模式 -->
      <template v-else>
        <div class="ngs-custom-hint">
          完整卡片 JSON（title + ngx 配置）。字段与表单模式一一对应；保存前会做 JSON 校验。
        </div>
        <textarea v-model="customText" class="ngs-textarea ngs-textarea--mono ngs-custom-json" data-testid="ngs-custom-json" rows="18" spellcheck="false"></textarea>
        <div v-if="customError" class="ngs-error">{{ customError }}</div>
      </template>
    </div>

    <template #footer>
      <ReButton data-testid="ngs-btn-cancel" @click="emit('update:modelValue', false)">取消</ReButton>
      <ReButton data-testid="ngs-btn-validate" @click="validateCustom" v-if="mode === 'custom'">校验 JSON</ReButton>
      <ReButton type="primary" data-testid="ngs-btn-save" @click="save">保存</ReButton>
    </template>
  </ReDialog>
</template>

<script setup lang="ts" name="NgxCardSettingsDialog">
/**
 * Nginx 看板卡片设置弹窗（表单 / 自定义 JSON 双模式，默认表单）。
 *
 * <p>两种模式编辑的是同一份卡片模型：切到自定义时把当前表单序列化为 JSON，
 * 切回表单时解析 JSON 回填。保存时输出新的 widget 条目（父组件负责替换进布局并触发实时保存）。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import ReButton from "@repo/ui/re-button";
import ReInput from "@repo/ui/re-input";
import ReSelect from "@repo/ui/re-select";
import ReDialog from "@repo/ui/re-dialog";
import { ReOption } from "@repo/ui/re-kit";
import { NGX_CARD_META, STAT_METRICS, TABLE_DIMENSIONS, TREND_METRICS } from "./ngxTypes";
import type { NgxCardConfig, NgxCardKind, NgxWidgetItem } from "./ngxTypes";

const props = defineProps<{
  modelValue: boolean;
  widget: NgxWidgetItem | null;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "save", payload: { widget: NgxWidgetItem }): void;
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

interface FormState extends NgxCardConfig {
  title: string;
}

const form = reactive<FormState>({ title: "" });

const kind = computed<NgxCardKind>(() => (props.widget?.type || "ngx-stat") as NgxCardKind);
const headLabel = computed(() => props.widget?.title || NGX_CARD_META[kind.value]?.label || "卡片");

/** 背景色选择器的显示值：表单里存的是任意 CSS 颜色文本，input[type=color] 只认 #rrggbb */
const colorPick = computed(
  () => (/^#[0-9a-fA-F]{6}$/.test(form.background || "") ? (form.background as string) : "#ffffff")
);

/** 当前选中的图表指标集合（表单里是 checkbox 集合） */
const selectedMetrics = computed<string[]>(() => form.metrics ?? []);

function toggleMetric(value: string): void {
  const current = form.metrics ? [...form.metrics] : [];
  const idx = current.indexOf(value);
  if (idx >= 0) {
    current.splice(idx, 1);
  } else {
    current.push(value);
  }
  form.metrics = current;
}

/** 打开弹窗时把 widget 配置灌进表单 */
watch(
  () => [props.modelValue, props.widget] as const,
  () => {
    if (!props.modelValue || !props.widget) {
      return;
    }
    mode.value = "form";
    customError.value = "";
    const ngx = props.widget.ngx ?? {};
    Object.keys(form).forEach(key => {
      // 清掉上一张卡片残留的字段，避免串配置
      if (!(key in ngx) && key !== "title") {
        (form as Record<string, unknown>)[key] = undefined;
      }
    });
    Object.assign(form, ngx);
    form.title = props.widget.title || "";
    form.refreshSeconds = ngx.refreshSeconds ?? 30;
    if (kind.value === "ngx-stat" && !form.metric) {
      form.metric = "activeConnections";
    }
    if (kind.value === "ngx-chart") {
      form.metrics = ngx.metrics?.length ? ngx.metrics : ["active", "requests"];
      form.chartType = (ngx.chartType ?? "line") as "line" | "bar" | "area";
      form.hours = ngx.hours ?? 6;
    }
    if (kind.value === "ngx-table") {
      form.dimension = (ngx.dimension ?? "paths") as "paths" | "ips" | "statuses";
      form.topN = ngx.topN ?? 10;
    }
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
function buildPayload(): { title: string; ngx: NgxCardConfig } {
  const { title, ...ngx } = form;
  return { title: (title || "").trim(), ngx: cleanNgx(ngx) };
}

/** 去掉空值字段，保持持久化 JSON 干净 */
function cleanNgx(ngx: NgxCardConfig): NgxCardConfig {
  const out: Record<string, unknown> = {};
  Object.entries(ngx).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) {
      return;
    }
    out[k] = v;
  });
  return out as NgxCardConfig;
}

/** 自定义 JSON → 表单回填 */
function applyCustom(parsed: any): void {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("卡片 JSON 必须是对象");
  }
  const ngx = parsed.ngx && typeof parsed.ngx === "object" ? parsed.ngx : {};
  Object.keys(form).forEach(key => {
    if (key === "title") {
      return;
    }
    if (!(key in ngx)) {
      (form as Record<string, unknown>)[key] = undefined;
    }
  });
  Object.assign(form, ngx);
  form.title = typeof parsed.title === "string" ? parsed.title : "";
}

/** 自定义模式的 JSON 校验 */
function validateCustom(): boolean {
  try {
    applyCustom(JSON.parse(customText.value));
    customError.value = "";
    ElMessage.success("JSON 合法");
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
  if (mode.value === "custom") {
    try {
      const parsed = JSON.parse(customText.value);
      applyCustom(parsed);
    } catch (e) {
      customError.value = `JSON 解析失败：${(e as Error)?.message ?? e}`;
      ElMessage.error("自定义 JSON 不合法，无法保存");
      return;
    }
  }
  const payload = buildPayload();
  const next: NgxWidgetItem = { ...props.widget, title: payload.title || headLabel.value, ngx: payload.ngx };
  emit("save", { widget: next });
  emit("update:modelValue", false);
}
</script>

<style scoped lang="scss">
.ngs {
  max-height: 62vh;
  overflow: auto;
  padding-right: 2px;
}

.ngs-mode {
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

.ngs-mode-hint {
  font-size: 12px;
  color: var(--text-tertiary);
}

.ngs-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
}

.ngs-label {
  width: 84px;
  flex-shrink: 0;
  padding-top: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  text-align: right;
}

.ngs-row > :not(.ngs-label) {
  flex: 1;
  min-width: 0;
}

.ngs-inline {
  display: flex;
  align-items: center;
  gap: 8px;

  > :first-child {
    flex: 1;
    min-width: 0;
  }
}

.ngs-num {
  max-width: 110px;
}

.ngs-suffix {
  font-size: 12px;
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.ngs-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  padding: 6px 0;
}

.ngs-metric-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;

  input {
    margin: 0;
    cursor: pointer;
  }
}

.ngs-textarea {
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

.ngs-textarea--mono {
  font-family: ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
}

.ngs-custom-json {
  min-height: 260px;
}

.ngs-divider {
  margin: 14px 0 10px;
  padding-top: 8px;
  border-top: 1px dashed var(--border-subtle);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
}

.ngs-color-text {
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

.ngs-color {
  width: 34px;
  height: 30px;
  padding: 0;
  border: 1px solid var(--border-default);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
}

.ngs-swatches {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  flex: 1;
}

.ngs-swatch {
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

.ngs-custom-hint {
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.ngs-error {
  margin-top: 6px;
  font-size: 12px;
  color: var(--status-error);
}
</style>

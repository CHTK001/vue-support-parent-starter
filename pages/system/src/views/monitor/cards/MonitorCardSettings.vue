<template>
  <ReDialog v-model="visible" title="卡片设置" width="620px" top="10vh" :show-footer="false">
    <div v-if="ready" class="mc-set">
      <!-- 标题 -->
      <label class="mc-row">
        <span class="mc-row__label">标题</span>
        <input v-model="form.title" class="mc-input" type="text" maxlength="40" placeholder="卡片标题" />
      </label>

      <!--
        尺寸（宽 / 高）刻意不放在这里：卡片大小直接拖网格右下角改，所见即所得。
        在弹窗里输像素和在画布上拖是两套尺寸来源 —— 只会互相覆盖，让人对不上账。
      -->
      <p class="mc-tip">
        卡片大小直接在画布上拖右下角调整：宽按 12 列栅格吸附，高按行高吸附。
      </p>

      <!-- 数据源：仅 editableSource 的卡片（自定义卡片 / 可指向外部端点的高阶卡片） -->
      <template v-if="editableSource">
        <div class="mc-set__split">
          <span class="mc-set__title">数据源</span>
          <span class="mc-set__hint">Actuator 端点走同源代理（带登录态）；绝对 URL 需对方允许跨域</span>
        </div>

        <div class="mc-row">
          <span class="mc-row__label">类型</span>
          <div class="mc-seg">
            <button class="mc-seg__btn" :class="{ 'is-active': config.kind === 'actuator' }" @click="config.kind = 'actuator'">
              Actuator 端点
            </button>
            <button class="mc-seg__btn" :class="{ 'is-active': config.kind === 'url' }" @click="config.kind = 'url'">
              绝对 URL
            </button>
            <button class="mc-seg__btn" :class="{ 'is-active': config.kind === 'iframe' }" @click="config.kind = 'iframe'">
              嵌入页面
            </button>
          </div>
        </div>

        <label class="mc-row">
          <span class="mc-row__label">{{ config.kind === "actuator" ? "端点路径" : "地址" }}</span>
          <input v-model="config.path" class="mc-input" type="text" :placeholder="pathPlaceholder" />
        </label>

        <template v-if="config.kind !== 'iframe'">
          <div class="mc-row">
            <span class="mc-row__label">刷新间隔</span>
            <div class="mc-row__field">
              <input v-model.number="config.intervalSec" class="mc-input mc-input--num" type="number" min="0" max="3600" step="5" />
              <span class="mc-row__unit">秒（0 = 不自动刷新）</span>
            </div>
          </div>

          <div class="mc-row">
            <span class="mc-row__label">展示方式</span>
            <div class="mc-seg">
              <button class="mc-seg__btn" :class="{ 'is-active': config.render === 'kv' }" @click="config.render = 'kv'">键值</button>
              <button class="mc-seg__btn" :class="{ 'is-active': config.render === 'table' }" @click="config.render = 'table'">表格</button>
              <button class="mc-seg__btn" :class="{ 'is-active': config.render === 'value' }" @click="config.render = 'value'">单值</button>
              <button class="mc-seg__btn" :class="{ 'is-active': config.render === 'json' }" @click="config.render = 'json'">JSON</button>
            </div>
          </div>

          <label v-if="config.render === 'value'" class="mc-row">
            <span class="mc-row__label">取值路径</span>
            <input v-model="config.valuePath" class="mc-input" type="text" placeholder="如 measurements.0.value" />
          </label>

          <div v-if="config.render === 'value'" class="mc-row">
            <span class="mc-row__label">单位</span>
            <input v-model="config.unit" class="mc-input mc-input--num" type="text" maxlength="10" placeholder="如 ms / %" />
          </div>

          <div v-if="config.render === 'kv' || config.render === 'table'" class="mc-row">
            <span class="mc-row__label">最多条数</span>
            <input v-model.number="config.limit" class="mc-input mc-input--num" type="number" min="1" max="500" step="5" placeholder="不填为不限" />
          </div>
        </template>
      </template>

      <div class="mc-set__actions">
        <button class="mc-btn" @click="visible = false">取消</button>
        <button class="mc-btn mc-btn--primary" @click="onSave">保存</button>
      </div>
    </div>
  </ReDialog>
</template>

<script setup lang="ts" name="MonitorCardSettings">
/**
 * 卡片设置弹窗
 *
 * <p>所有卡片都能改标题；标了 {@code editableSource} 的卡片
 * （自定义卡片、可指向外部 Prometheus 端点的卡片）还能改数据源与展示方式 ——
 * 这正是「自己定制一张卡片」的入口。</p>
 *
 * <p><b>尺寸不在这里改</b>：宽 / 高由画布上的拖拽与缩放决定（见 {@code MonitorCardCanvas}），
 * 弹窗再放一份像素输入框只会变成第二套尺寸来源。</p>
 *
 * <p>保存时通过 {@code save} 事件把草稿交回页面层，由 {@code useMonitorCards().patch()}
 * 统一校验并落盘；本组件不直接写 storage，避免「弹窗改了但没落盘」的静默丢失。</p>
 */
import { computed, reactive, ref, watch } from "vue";
import ReDialog from "@repo/ui/components/ReDialog/ReDialog.vue";
import type { MonitorCardItem, MonitorCardSourceConfig } from "./types";

const props = defineProps<{
  modelValue: boolean;
  /** 正在编辑的卡片（null = 未选中） */
  card: MonitorCardItem | null;
  /** 是否暴露数据源配置（来自注册项 editableSource） */
  editableSource: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "save", id: string, partial: Partial<MonitorCardItem>): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit("update:modelValue", v),
});

/** 草稿：标题（尺寸由画布拖拽决定，不在此处） */
const form = reactive<{ id: string; title: string }>({
  id: "",
  title: "",
});

/** 草稿：数据源配置 */
const config = reactive<MonitorCardSourceConfig>({ kind: "actuator", path: "", intervalSec: 15, render: "kv" });

/** 是否有可编辑的草稿（没选中卡片时弹窗内容为空，不留半张空白表单） */
const ready = ref(false);

/** 路径输入框占位文案 */
const pathPlaceholder = computed(() => {
  const kind = config.kind ?? "actuator";
  if (kind === "iframe") return "要嵌入的页面完整地址，如 http://127.0.0.1:8848/";
  if (kind === "url") return "完整地址，如 http://host:8888/metrics";
  return "actuator 路径，如 health / metrics/jvm.memory.used / prometheus";
});

/** 每次打开都重新拷一份卡片（避免上次编辑的残留） */
watch(
  () => [props.modelValue, props.card] as const,
  ([open, card]) => {
    if (!open || !card) {
      ready.value = false;
      return;
    }
    form.id = card.id;
    form.title = card.title;
    Object.assign(config, {
      kind: "actuator",
      path: "",
      intervalSec: 15,
      render: "kv",
      valuePath: undefined,
      unit: undefined,
      limit: undefined,
      ...(card.config ?? {}),
    });
    ready.value = true;
  },
  { immediate: true },
);

function onSave(): void {
  if (!ready.value) return;
  emit("save", form.id, {
    title: form.title,
    config: props.editableSource ? { ...config } : undefined,
  });
  visible.value = false;
}
</script>

<style lang="scss" scoped>
.mc-set {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 70vh;
  overflow: auto;
  padding: 2px;
}

.mc-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.mc-tip {
  margin: 0;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 11.5px;
  line-height: 1.7;
}

.mc-row__label {
  flex: none;
  width: 68px;
  font-size: 12.5px;
  color: var(--el-text-color-regular);
}

.mc-row__field {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}

.mc-row__unit {
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
}

.mc-input {
  flex: 1;
  min-width: 0;
  height: 30px;
  padding: 0 10px;
  border-radius: 7px;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  font-size: 12.5px;
  outline: none;
  box-sizing: border-box;
}

.mc-input:focus {
  border-color: var(--el-color-primary);
}

.mc-input--num {
  flex: none;
  width: 96px;
}

.mc-seg {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 2px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
}

.mc-seg__btn {
  height: 26px;
  padding: 0 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 12px;
  cursor: pointer;
}

.mc-seg__btn.is-active {
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  font-weight: 600;
  box-shadow: 0 1px 3px rgb(0 0 0 / 8%);
}

.mc-set__split {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 4px;
  padding-top: 10px;
  border-top: 1px dashed var(--el-border-color-lighter);
}

.mc-set__title {
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.mc-set__hint {
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
}

.mc-set__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

.mc-btn {
  height: 30px;
  padding: 0 16px;
  border-radius: 7px;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  font-size: 12.5px;
  cursor: pointer;
}

.mc-btn--primary {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary);
  color: #fff;
}
</style>

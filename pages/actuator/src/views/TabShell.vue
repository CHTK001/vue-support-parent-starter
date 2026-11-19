<!--
  页签面板的统一外壳：过滤框 + 计数 + 刷新 + 错误提示 + 内容区。

  为什么要有这层：11 个页签的数据形态各不相同，但「工具条长什么样、报错怎么显示、
  内容区怎么滚」必须完全一致 —— 每个页签各写一遍，过两周就会有一个页签的刷新按钮
  跑到左边、另一个页签的报错是一行裸红字。
-->
<template>
  <div ref="rootRef" class="act">
    <div class="act__bar">
      <ReInput
        v-if="searchable"
        v-model="keyword"
        layout="modern"
        :placeholder="placeholder"
        clearable
        class="act__search"
      />
      <span class="act__count">{{ countText }}</span>
      <div class="act__bar-right">
        <slot name="tools" />
        <div v-if="autoRefresh" class="act-seg" role="group" aria-label="自动刷新">
          <button
            type="button"
            class="act-seg__btn"
            :class="{ 'is-active': refreshInterval === 0 }"
            :aria-pressed="refreshInterval === 0"
            @click="setRefreshInterval(0)"
          >
            关
          </button>
          <button
            type="button"
            class="act-seg__btn"
            :class="{ 'is-active': refreshInterval === 10 }"
            :aria-pressed="refreshInterval === 10"
            @click="setRefreshInterval(10)"
          >
            10s
          </button>
          <button
            type="button"
            class="act-seg__btn"
            :class="{ 'is-active': refreshInterval === 30 }"
            :aria-pressed="refreshInterval === 30"
            @click="setRefreshInterval(30)"
          >
            30s
          </button>
        </div>
        <span v-if="autoRefresh && updatedAgo" class="act__ago">{{ updatedAgo }}</span>
        <div v-if="density" class="act-seg" role="group" aria-label="表格密度">
          <button
            type="button"
            class="act-seg__btn"
            :class="{ 'is-active': actuatorDensity === 'compact' }"
            :aria-pressed="actuatorDensity === 'compact'"
            @click="setDensity('compact')"
          >
            紧凑
          </button>
          <button
            type="button"
            class="act-seg__btn"
            :class="{ 'is-active': actuatorDensity === 'comfortable' }"
            :aria-pressed="actuatorDensity === 'comfortable'"
            @click="setDensity('comfortable')"
          >
            舒适
          </button>
        </div>
        <ReButton layout="modern" icon="Refresh" :loading="loading" @click="emit('refresh')">刷新</ReButton>
      </div>
    </div>

    <div v-if="error" class="act__empty is-error">
      <span class="act__err-line">
        <span class="act__err-badge" :class="errorKind === 'unavailable' ? 'is-unavailable' : 'is-retriable'">
          {{ errorKind === "unavailable" ? "未暴露" : "后端异常" }}
        </span>
        <span class="act__err-text">{{ error }}</span>
      </span>
      <ReButton v-if="errorKind === 'retriable'" size="small" class="act__err-retry" @click="emit('refresh')">
        重试
      </ReButton>
    </div>
    <div v-else class="act__body">
      <slot />
    </div>

    <p class="act__hint">Base: /actuator · {{ ACTUATOR_ENDPOINTS.length }} 个端点</p>
  </div>
</template>

<script setup lang="ts" name="ActuatorTabShell">
/**
 * 页签外壳。
 *
 * <p>关键字用 {@code v-model} 双向绑定到页签自己的 composable —— 过滤是纯前端行为，
 * 不需要也不应该再发一次请求。</p>
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import ReInput from "@repo/ui/re-input";
import ReButton from "@repo/ui/re-button";
import { ACTUATOR_ENDPOINTS } from "../endpoints";
import { actuatorDensity, setActuatorDensity, type ActuatorDensity } from "./useActuatorTable";

const props = withDefaults(
  defineProps<{
    /** 是否显示关键字输入框（health / info / metrics / scheduledtasks 不需要） */
    searchable?: boolean;
    /** 输入框占位文案 */
    placeholder?: string;
    /** 右上角统计文案（如「共 12 项」） */
    countText?: string;
    /** 是否正在加载（刷新按钮转圈） */
    loading?: boolean;
    /** 错误文案；非空时内容区换成提示 */
    error?: string;
    /**
     * 错误分型："unavailable" = 端点未暴露（重试无意义，只给接入指引）；
     * "retriable" = 网络 / 后端故障（错误框里带「重试」按钮）。
     */
    errorKind?: string;
    /**
     * 是否显示「紧凑 / 舒适」密度切换。
     *
     * <p>只有表格页需要：卡片页与主从页没有行高可切，摆上去只会让人点了没反应。</p>
     */
    density?: boolean;
    /**
     * 是否提供「自动刷新」（关 / 10s / 30s）。
     *
     * <p>只给只读页签开：loggers（改级别）、scheduledtasks（改 cron / 启停）是写操作页，
     * 轮询会打断正在进行的编辑，不开。</p>
     */
    autoRefresh?: boolean;
    /** 最近一次成功拉取的时间戳（ms），用于「x 秒前更新」；0 表示还没拉到 */
    updatedAt?: number;
  }>(),
  {
    searchable: true,
    placeholder: "过滤…",
    countText: "",
    loading: false,
    error: "",
    errorKind: "",
    density: false,
    autoRefresh: false,
    updatedAt: 0,
  },
);

/** 过滤词（页签自己的 ref） */
const keyword = defineModel<string>({ default: "" });

/** 密度切换：写模块级单例，6 个表格页共用同一档 */
function setDensity(value: ActuatorDensity): void {
  setActuatorDensity(value);
}

const emit = defineEmits<{
  /**
   * 请求刷新。
   *
   * @param silent 手动点击时不传（闪一下加载态，给用户「确实在刷」的反馈）；
   *               自动刷新定时器传 {@code true}：静默重取，瞬时失败不清空已有数据
   */
  (e: "refresh", silent?: boolean): void;
}>();

/* ---------- 键盘动线：`/` 聚焦过滤框，Esc 清空过滤词 ---------- */

/** 根节点：既用来判断本面板是否可见（ReTabs 面板 v-show 常驻），也用来找过滤框 */
const rootRef = ref<HTMLElement | null>(null);

/**
 * 键盘动线：`/` 把焦点送进过滤框；Esc 清空过滤词（页签 watch 关键字后自己复位分页）。
 *
 * <p>监听挂在 window 上：焦点可能停在面板里任意控件上。多个页签的面板同时常驻，
 * 隐藏面板（offsetParent 为 null）必须让位，否则一次按键会被多个壳同时处理。</p>
 */
function onKeydown(e: KeyboardEvent): void {
  const root = rootRef.value;
  if (!root || root.offsetParent === null) return;
  const target = e.target as HTMLElement | null;
  const tag = target?.tagName?.toLowerCase() ?? "";
  const typing = tag === "input" || tag === "textarea" || target?.isContentEditable === true;
  const searchInput = root.querySelector<HTMLInputElement>(".act__search input");
  if (e.key === "/" && !typing) {
    e.preventDefault();
    searchInput?.focus();
    return;
  }
  if (e.key === "Escape") {
    const inSearch = target != null && searchInput != null && (target === searchInput || searchInput.contains(target));
    // 过滤框里按 Esc = 清空；其它非输入场景（如刚点完按钮）也清空；输入型控件（如下拉框）的 Esc 不抢
    if ((inSearch || !typing) && keyword.value) {
      e.preventDefault();
      keyword.value = "";
      searchInput?.blur();
    }
  }
}

onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));

/* ---------- 自动刷新（只读页签）：关 / 10s / 30s，隐藏面板不白跑 ---------- */

/** 自动刷新间隔（秒）；0 = 关 */
const refreshInterval = ref(0);

/** 1s 心跳：驱动「x 秒前更新」的相对时间（只在面板可见时走表） */
const nowTick = ref(Date.now());

let refreshTimer: number | null = null;
let tickTimer: number | null = null;

/** 面板是否可见（ReTabs 面板 v-show 常驻，隐藏面板不刷新、不走表） */
function panelVisible(): boolean {
  const root = rootRef.value;
  return !!root && root.offsetParent !== null;
}

function stopTimers(): void {
  if (refreshTimer !== null) window.clearInterval(refreshTimer);
  if (tickTimer !== null) window.clearInterval(tickTimer);
  refreshTimer = null;
  tickTimer = null;
}

function setupTimers(): void {
  stopTimers();
  if (!props.autoRefresh) return;
  if (refreshInterval.value > 0) {
    refreshTimer = window.setInterval(() => {
      // 静默刷新：失败保留旧数据，成功后 updatedAt 前移，「x 秒前更新」随之走表
      if (panelVisible()) emit("refresh", true);
    }, refreshInterval.value * 1000);
  }
  tickTimer = window.setInterval(() => {
    if (panelVisible()) nowTick.value = Date.now();
  }, 1000);
}

function setRefreshInterval(seconds: number): void {
  refreshInterval.value = seconds;
}

watch(refreshInterval, setupTimers);
watch(() => props.autoRefresh, setupTimers);
onMounted(setupTimers);
onBeforeUnmount(stopTimers);

/** 「x 秒前更新」：自动刷新与手动刷新共用同一个 updatedAt */
const updatedAgo = computed<string>(() => {
  if (!props.updatedAt) return "";
  const seconds = Math.max(0, Math.floor((nowTick.value - props.updatedAt) / 1000));
  if (seconds < 5) return "刚刚更新";
  if (seconds < 60) return `${seconds} 秒前更新`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} 分钟前更新`;
  return `${Math.floor(minutes / 60)} 小时前更新`;
});
</script>

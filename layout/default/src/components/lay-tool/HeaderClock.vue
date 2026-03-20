<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useGlobal } from "@pureadmin/utils";
import { getConfig } from "@repo/config";
import { emitter } from "@repo/core";
import { ScText, ScTooltip } from "@repo/components";

const primaryTime = ref<string>("");
const primaryWeekday = ref<string>("");
const primaryFull = ref<string>("");

const secondEnabled = ref<boolean>(false);
const secondTimezone = ref<string>("Europe/London");
const secondaryTime = ref<string>("");
const secondaryWeekday = ref<string>("");
const secondaryFull = ref<string>("");

const primaryTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const { $storage } = useGlobal<GlobalPropertiesApi>();
const currentTheme = ref<string>($storage.configure?.systemTheme || "default");

const textMotion = computed(() => {
  switch (currentTheme.value) {
    case "spring-festival":
      return "gold-foil";
    case "christmas":
      return "gold-foil";
    default:
      return "none";
  }
});

function initSecondConfig(): void {
  const pageBehavior = getConfig().PageBehavior ?? {};
  secondEnabled.value =
    $storage.configure?.headerClockSecondEnabled ??
    pageBehavior.headerClockSecondEnabled ??
    false;
  secondTimezone.value =
    $storage.configure?.headerClockSecondTimezone ??
    pageBehavior.headerClockSecondTimezone ??
    "Europe/London";
}

function formatWithZone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("zh-CN", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes): string => {
    const part = parts.find((p) => p.type === type);
    return part?.value ?? "";
  };

  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hour = get("hour");
  const minute = get("minute");
  const second = get("second");
  const weekday = get("weekday");

  return {
    time: `${hour}:${minute}:${second}`,
    weekday,
    full: `${year}-${month}-${day} ${hour}:${minute}:${second} ${weekday}`,
  };
}

/** Web Worker 计时器，避免主线程繁忙时漂移 */
let clockWorker: Worker | null = null;

function updateClock(now: number): void {
  const date = new Date(now);
  const primary = formatWithZone(date, primaryTimezone);
  primaryTime.value = primary.time;
  primaryWeekday.value = primary.weekday;
  primaryFull.value = primary.full;

  if (secondEnabled.value && secondTimezone.value) {
    try {
      const secondary = formatWithZone(date, secondTimezone.value);
      secondaryTime.value = secondary.time;
      secondaryWeekday.value = secondary.weekday;
      secondaryFull.value = secondary.full;
    } catch {
      secondaryTime.value = "";
      secondaryWeekday.value = "";
      secondaryFull.value = "";
    }
  } else {
    secondaryTime.value = "";
    secondaryWeekday.value = "";
    secondaryFull.value = "";
  }
}

function startClock(): void {
  if (clockWorker) return;
  clockWorker = new Worker(
    new URL("./clock.worker.ts", import.meta.url),
    { type: "module" },
  );
  clockWorker.onmessage = (e: MessageEvent<{ now: number }>) => {
    updateClock(e.data.now);
  };
}

const secondTimezoneLabel = computed<string>(() => {
  const mapping: Record<string, string> = {
    "Asia/Shanghai": "北京时间",
    "America/New_York": "纽约时间",
    "Europe/London": "伦敦时间",
    "Asia/Tokyo": "东京时间",
    "Australia/Sydney": "悉尼时间",
    UTC: "世界协调时",
  };
  return mapping[secondTimezone.value] ?? secondTimezone.value;
});

const tooltipContent = computed<string>(() => {
  if (!primaryFull.value) {
    return "";
  }
  if (!secondEnabled.value || !secondaryFull.value) {
    return `本地时间：${primaryFull.value}`;
  }
  return `本地时间：${primaryFull.value}<br/>${secondTimezoneLabel.value}：${secondaryFull.value}`;
});

emitter.on("headerClockSecondEnabledChange", (val: boolean) => {
  secondEnabled.value = val;
  updateClock(Date.now());
});

emitter.on("headerClockSecondTimezoneChange", (val: string) => {
  secondTimezone.value = val;
  updateClock(Date.now());
});

emitter.on("systemThemeChange", (themeKey: string) => {
  currentTheme.value = themeKey || "default";
});

onMounted(() => {
  initSecondConfig();
  startClock();
});

onBeforeUnmount(() => {
  emitter.off("headerClockSecondEnabledChange");
  emitter.off("headerClockSecondTimezoneChange");
  emitter.off("systemThemeChange");
  if (clockWorker) {
    clockWorker.terminate();
    clockWorker = null;
  }
});
</script>

<template>
  <ScTooltip
    :raw-content="true"
    :content="tooltipContent"
    placement="bottom"
    :show-after="300"
    :hide-after="150"
    effect="dark"
    popper-class="header-clock-tooltip"
  >
    <div class="header-clock-inner">
      <span class="header-clock-icon" aria-hidden="true">🕒</span>
      <div class="header-clock-content">
        <!-- 主时间 -->
        <div class="header-clock-row">
          <ScText :theme-motion="textMotion" class="header-clock-time">{{ primaryTime }}</ScText>
          <ScText :theme-motion="textMotion" class="header-clock-weekday">{{ primaryWeekday }}</ScText>
        </div>
        <!-- 第二时间：启用时渲染，默认隐藏，hover 时展开 -->
        <div v-if="secondEnabled && secondaryTime" class="header-clock-row header-clock-secondary">
          <ScText :theme-motion="textMotion" class="header-clock-time header-clock-time--secondary">{{ secondaryTime }}</ScText>
          <ScText :theme-motion="textMotion" class="header-clock-weekday header-clock-weekday--secondary">{{ secondaryWeekday }}</ScText>
        </div>
      </div>
    </div>
  </ScTooltip>
</template>

<style scoped lang="scss">
.header-clock-inner {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-clock-icon {
  font-size: 16px;
}

.header-clock-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* 每行：时间 + 星期横向排列 */
.header-clock-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

/* 第二时间行：字号略小，颜色更淡，默认隐藏，hover 时展开 */
.header-clock-secondary {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
  transition: opacity 0.2s ease, max-height 0.2s ease;
}

.header-clock-inner:hover .header-clock-secondary {
  opacity: 0.75;
  max-height: 24px;
}

.header-clock-time--secondary {
  font-size: 12px;
  font-weight: 500;
}

.header-clock-weekday--secondary {
  font-size: 11px;
}

.header-clock-time {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-clock-weekday {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.header-clock-separator {
  font-size: 12px;
  color: var(--el-text-color-disabled);
}
</style>

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
const secondTimezone = ref<string>("UTC");
const secondaryTime = ref<string>("");
const secondaryWeekday = ref<string>("");
const secondaryFull = ref<string>("");

const primaryTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const { $storage } = useGlobal<GlobalPropertiesApi>();

function initSecondConfig(): void {
  const pageBehavior = getConfig().PageBehavior ?? {};
  secondEnabled.value =
    $storage.configure?.headerClockSecondEnabled ??
    pageBehavior.headerClockSecondEnabled ??
    false;
  secondTimezone.value =
    $storage.configure?.headerClockSecondTimezone ??
    pageBehavior.headerClockSecondTimezone ??
    "UTC";
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

let headerClockTimer: ReturnType<typeof setInterval> | null = null;

function updateClock(): void {
  const now = new Date();
  const primary = formatWithZone(now, primaryTimezone);
  primaryTime.value = primary.time;
  primaryWeekday.value = primary.weekday;
  primaryFull.value = primary.full;

  if (secondEnabled.value && secondTimezone.value) {
    try {
      const secondary = formatWithZone(now, secondTimezone.value);
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
  if (headerClockTimer) {
    return;
  }
  updateClock();
  headerClockTimer = setInterval(updateClock, 1000);
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
  return `本地时间：${primaryFull.value}\n${secondTimezoneLabel.value}：${secondaryFull.value}`;
});

emitter.on("headerClockSecondEnabledChange", (val: boolean) => {
  secondEnabled.value = val;
  updateClock();
});

emitter.on("headerClockSecondTimezoneChange", (val: string) => {
  secondTimezone.value = val;
  updateClock();
});

onMounted(() => {
  initSecondConfig();
  startClock();
});

onBeforeUnmount(() => {
  emitter.off("headerClockSecondEnabledChange");
  emitter.off("headerClockSecondTimezoneChange");
  if (headerClockTimer) {
    clearInterval(headerClockTimer);
    headerClockTimer = null;
  }
});
</script>

<template>
  <ScTooltip
    :content="tooltipContent"
    placement="bottom"
    :show-after="300"
    :hide-after="150"
    effect="dark"
  >
    <div class="header-clock-inner">
      <span class="header-clock-icon" aria-hidden="true">🕒</span>
      <div class="header-clock-content">
        <ScText class="header-clock-time">{{ primaryTime }}</ScText>
        <ScText class="header-clock-weekday">{{ primaryWeekday }}</ScText>
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
  align-items: baseline;
  gap: 6px;
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

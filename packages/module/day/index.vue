<script setup>
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { getConfig } from "@repo/config";
import { useWeatherStore } from "@repo/core";
import { dateFormat } from "@repo/utils";
import { computed, onMounted, onUnmounted, reactive } from "vue";
let timeId = null;
onMounted(() => {
  useWeatherStore.actions.load();
  showTime();
  // 每秒更新时间
  timeId = setInterval(() => {
    showTime();
  }, 1000);

  // 每30分钟重新获取天气数据
  const weatherTimer = setInterval(
    () => {
      useWeatherStore.actions.load();
    },
    30 * 60 * 1000
  );
});

// 组件卸载时清除定时器
onUnmounted(() => {
  clearInterval(timeId);
  clearInterval(weatherTimer);
});

const icon = reactive({
  qing: "meteocons:clear-day-fill",
  yun: "meteocons:partly-cloudy-day-fill",
  yin: "meteocons:overcast-day-fill",
  yu: "meteocons:rain-fill",
});
const info = reactive({
  time: "",
  day: "",
});

const weekDays = {
  "zh-CN": ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
  "en-US": ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"],
};
// 从配置中获取当前语言
const currentLocale = computed(() => {
  return getConfig().Locale || "zh-CN";
});

const formatDateToWeekDay = (date) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const weekDay = weekDays[currentLocale.value][date.getDay()];
  return `${weekDay} ${month}-${day}`;
};

const formatDateToWeek = (date) => {
  const weekDay = weekDays[currentLocale.value][date.getDay()];
  return `${weekDay}`;
};

const showTime = async () => {
  info.time = dateFormat(new Date(), "hh:mm");
  info.day = dateFormat(new Date(), "yyyy年MM月dd日");
  info.weekDay = formatDateToWeekDay(new Date());
  info.week = formatDateToWeek(new Date());
  info.currentWeek = formatDateToWeek(new Date());
};

// 添加时间段判断
const getTimePhase = computed(() => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10) return "morning";
  if (hour >= 10 && hour < 16) return "noon";
  if (hour >= 16 && hour < 19) return "dusk";
  return "morning";
});
</script>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 180px;
  width: 100%;
  border-radius: 25px;
  background: lightgrey;
  overflow: hidden;
  transition: 100ms ease;
  box-shadow: rgba(0, 0, 0, 0.15) 2px 3px 4px;
}

/* ---------- Info section ---------- */

.info-section {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 75%;
  color: white;
}

.left-side {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  height: 100%;
  z-index: 1;
  padding-left: 18px;
}

button {
  display: block;
  border: none;
  background: transparent;
}

.weather {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 5px;
}

.weather div {
  display: flex;
  align-items: center;
}

.weather div:nth-child(1) {
  width: 50%; /* 调整顶部天气图标容器宽度 */
  height: auto;
  font-size: 48px; /* 增加图标大小 */
}

.temperature {
  font-size: 34pt;
  font-weight: 500;
  line-height: 8%;
}

.right-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-around;
  height: 100%;
  padding-right: 18px;
  z-index: 1;
}

.right-side > div {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.hour {
  font-size: 19pt;
  line-height: 1em;
}

.date {
  font-size: 15px;
}

/* ---------- Background ---------- */
.background-design {
  position: absolute;
  height: 100%;
  width: 100%;
  transition: all 0.3s ease;
  overflow: hidden;
}

/* 早晨样式 */
.background-design.morning {
  background: linear-gradient(to right, #ff9966, #ff5e62);
}
.background-design.morning .circle {
  background-color: #ffd700;
}

/* 中午样式 */
.background-design.noon {
  background: linear-gradient(to right, #4facfe, #00f2fe);
}
.background-design.noon .circle {
  background-color: #ffffff;
  opacity: 0.8;
}
.noon.info-section {
  color: #333;
}
.noon ~ .days-section .day {
  color: #333;
}

/* 黄昏样式 */
.background-design.dusk {
  background-color: #ec7263;
}
.background-design.dusk .circle {
  background-color: #efc745;
}

/* 夜晚样式 */
.background-design.night {
  background: linear-gradient(to right, #2c3e50, #3498db);
}
.background-design.night .circle {
  background-color: #ffffff;
  opacity: 0.2;
}
.circle {
  background-color: #efc745;
}

.circle:nth-child(1) {
  position: absolute;
  top: -80%;
  right: -50%;
  width: 300px;
  height: 300px;
  opacity: 0.4;
  border-radius: 50%;
}

.circle:nth-child(2) {
  position: absolute;
  top: -70%;
  right: -30%;
  width: 210px;
  height: 210px;
  opacity: 0.4;
  border-radius: 50%;
}

.circle:nth-child(3) {
  position: absolute;
  top: -35%;
  right: -8%;
  width: 100px;
  height: 100px;
  opacity: 1;
  border-radius: 50%;
}

/* ---------- Days section ---------- */
.days-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 25%;
  gap: 2px;
  transition: all 0.3s ease;
}

/* 早晨样式 */
.morning ~ .days-section {
  background-color: #ff7e5f;
  box-shadow: inset 0px 2px 5px rgba(0, 0, 0, 0.1);
}
.morning ~ .days-section button {
  background-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
}

/* 中午样式 */
.noon ~ .days-section {
  background-color: #4facfe;
  box-shadow: inset 0px 2px 5px rgba(0, 0, 0, 0.1);
}
.noon ~ .days-section button {
  background-color: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(5px);
}

/* 黄昏样式 */
.dusk ~ .days-section {
  background-color: #974859;
  box-shadow: inset 0px 2px 5px rgba(0, 0, 0, 0.1);
}
.dusk ~ .days-section button {
  background-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
}

/* 夜晚样式 */
.night ~ .days-section {
  background-color: #2c3e50;
  box-shadow: inset 0px 2px 5px rgba(0, 0, 0, 0.1);
}
.night ~ .days-section button {
  background-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
}

/* 按钮悬停效果 */
.days-section button:hover {
  scale: 0.95;
  border-radius: 10px;
  background-color: rgba(255, 255, 255, 0.2);
}
.days-section button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  cursor: pointer;
  transition: 100ms ease;
  gap: 5px;
  border: none;
}

.days-section button:hover {
  scale: 0.9;
  border-radius: 10px;
}

.days-section .day {
  font-size: 10pt;
  font-weight: 500;
  color: white;
  opacity: 0.7;
}

.icon-weather-day {
  display: flex;
  align-items: center;
  width: 24px; /* 调整底部预报图标宽度 */
  font-size: 42px; /* 增加底部图标大小 */
  height: 100%;
}
</style>

<template>
  <div class="card">
    <section class="info-section" :class="[getTimePhase]">
      <div :class="['background-design', getTimePhase]">
        <div class="circle"></div>
        <div class="circle"></div>
        <div class="circle"></div>
      </div>
      <div class="left-side">
        <div class="weather">
          <div>
            <IconifyIconOnline :icon="icon[useWeatherStore.origin?.day?.[0]?.weatherIcon]" />
          </div>
          <div>{{ useWeatherStore.current?.weatherDay }}</div>
        </div>
        <div class="temperature">{{ useWeatherStore.origin?.temperature }}°</div>
        <div class="range">{{ useWeatherStore.current?.minLowTemp }}°/{{ useWeatherStore.current?.maxHighTemp }}°</div>
      </div>
      <div class="right-side">
        <div>
          <div class="hour">{{ info.time }}</div>
          <div class="date">{{ info.weekDay }}</div>
        </div>
        <div class="city">{{ useWeatherStore.origin?.cityName }}</div>
      </div>
    </section>
    <section class="days-section">
      <button>
        <span class="day">{{ info.currentWeek }}</span>
        <span class="icon-weather-day">
          <IconifyIconOnline :icon="icon[useWeatherStore.origin?.day?.[0]?.weatherIcon]" />
        </span>
      </button>
      <button>
        <span class="day">{{ formatDateToWeek(new Date(Date.now() + 24 * 60 * 60 * 1000)) }}</span>
        <span class="icon-weather-day">
          <IconifyIconOnline :icon="icon[useWeatherStore.origin?.day?.[1]?.weatherIcon]" />
        </span>
      </button>
      <button>
        <span class="day">{{ formatDateToWeek(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)) }}</span>
        <span class="icon-weather-day">
          <IconifyIconOnline :icon="icon[useWeatherStore.origin?.day?.[2]?.weatherIcon]" />
        </span>
      </button>
      <button>
        <span class="day">{{ formatDateToWeek(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)) }}</span>
        <span class="icon-weather-day">
          <IconifyIconOnline :icon="icon[useWeatherStore.origin?.day?.[3]?.weatherIcon]" />
        </span>
      </button>
    </section>
  </div>
</template>

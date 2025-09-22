<script setup>
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { getConfig } from "@repo/config";
import { useWeatherStore } from "@repo/core";
import { dateFormat } from "@repo/utils";
import { computed, onMounted, onUnmounted, reactive } from "vue";
let timeId = null;
let weatherTimer = null;
onMounted(() => {
  useWeatherStore.actions.load();
  showTime();
  // 尝试使用地理位置获取天气
  fetchWeather().catch(error => {
    console.error('获取天气失败，使用默认数据:', error);
    // 如果获取失败，回退到默认方法
    useWeatherStore.actions.load();
  });
  
  // 每秒更新时间
  timeId = setInterval(() => {
    showTime();
  }, 1000);

  // 每30分钟重新获取天气数据
  weatherTimer = setInterval(
    () => {
      fetchWeather().catch(() => useWeatherStore.actions.load());
    },
    30 * 60 * 1000
  );
});

const fetchWeather = async () => {
  try {
    // 首先获取用户地理位置
    const position = await new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('您的浏览器不支持地理位置功能'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    });
    
    const { latitude, longitude } = position.coords;
    
    // 使用经纬度获取天气数据
    const weatherResponse = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=YOUR_API_KEY&q=${latitude},${longitude}&days=5&lang=${currentLocale.value === 'zh-CN' ? 'zh' : 'en'}`
    );
    
    if (!weatherResponse.ok) {
      throw new Error('天气数据获取失败');
    }
    
    const weatherData = await weatherResponse.json();
    
    // 将获取到的数据传递给 weather store
    useWeatherStore.actions.updateWeather({
      cityName: weatherData.location.name,
      temperature: weatherData.current.temp_c,
      day: weatherData.forecast.forecastday.map(day => ({
        date: day.date,
        weatherIcon: mapWeatherCodeToIcon(day.day.condition.code),
        highTemp: day.day.maxtemp_c,
        lowTemp: day.day.mintemp_c
      })),
      weatherDay: weatherData.current.condition.text
    });
    
    return weatherData;
  } catch (error) {
    console.error('获取天气信息失败:', error);
    // 如果获取失败，使用默认数据或者之前的数据
    return null;
  }
};

// 将天气代码映射到我们的图标
const mapWeatherCodeToIcon = (code) => {
  // 晴天
  if ([1000].includes(code)) {
    return 'qing';
  }
  // 多云
  else if ([1003, 1006, 1009].includes(code)) {
    return 'yun';
  }
  // 阴天
  else if ([1030, 1135, 1147].includes(code)) {
    return 'yin';
  }
  // 雨天
  else if ([1063, 1069, 1072, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 1240, 1243, 1246].includes(code)) {
    return 'yu';
  }
  // 默认返回多云
  return 'yun';
};

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
  color: var(--el-text-color-primary);
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
  color: var(--el-text-color-primary);
}
.noon ~ .days-section .day {
  color: var(--el-text-color-primary);
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
  color: var(--el-text-color-primary);
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

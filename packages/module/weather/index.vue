<script setup>
/**
 * 天气部件
 * @author CH
 * @date 2024-12-10
 * @version 1.0.1
 */
import { ref, onMounted, computed } from "vue";
import { useWeatherStore } from "@repo/core";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import scEcharts from "@repo/components/ScEcharts/index.vue";
import ScDialog from "@repo/components/ScDialog/src/index.vue";

const weatherStore = useWeatherStore;
const loading = ref(true);
const dialogVisible = ref(false);

const iconMap = {
  qing: "meteocons:clear-day-fill",
  yun: "meteocons:partly-cloudy-day-fill",
  yin: "meteocons:overcast-day-fill",
  yu: "meteocons:rain-fill",
  lei: "meteocons:thunderstorms-fill",
  xue: "meteocons:snow-fill",
  wu: "meteocons:fog-fill",
  bing: "meteocons:hail-fill",
  shachen: "meteocons:dust-fill",
};

const getWeatherIcon = (iconName) => {
  return iconMap[iconName] || "meteocons:clear-day-fill";
};

onMounted(async () => {
  try {
    await weatherStore.actions.load();
  } catch (e) {
    console.error("Failed to load weather:", e);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="weather-card" @click="dialogVisible = true">
    <el-skeleton :loading="loading" animated class="h-full">
      <template #template>
        <div class="skeleton-content">
          <el-skeleton-item variant="circle" style="width: 60px; height: 60px" />
          <div class="skeleton-text">
            <el-skeleton-item variant="text" style="width: 50%" />
            <el-skeleton-item variant="text" style="width: 80%" />
          </div>
        </div>
      </template>
      <template #default>
        <div v-if="!weatherStore.weather?.data?.cityName" class="empty-state">
          <el-empty description="暂无天气数据" :image-size="60" />
        </div>
        <div v-else class="weather-content">
          <div class="weather-main">
            <div class="weather-icon">
              <IconifyIconOnline
                :icon="getWeatherIcon(weatherStore.current?.weatherIcon)"
                style="font-size: 48px"
              />
            </div>
            <div class="weather-info">
              <div class="temperature">
                {{ weatherStore.weather?.data?.temperature }}<span class="unit">℃</span>
              </div>
              <div class="location-weather">
                <span class="city">{{ weatherStore.weather?.data?.cityName }}</span>
                <span class="divider">|</span>
                <span class="desc">{{ weatherStore.current?.weatherDay }}</span>
              </div>
            </div>
          </div>
          
          <div class="weather-details">
            <div class="detail-item">
              <span class="label">湿度</span>
              <span class="value">{{ weatherStore.weather?.data?.shidu || '--' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">空气</span>
              <span class="value">{{ weatherStore.weather?.data?.quality || '--' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">风向</span>
              <span class="value">{{ weatherStore.current?.windDirection || '--' }}</span>
            </div>
          </div>
        </div>
      </template>
    </el-skeleton>

    <sc-dialog v-model="dialogVisible" title="24小时天气趋势" width="600px" draggable append-to-body>
      <div class="chart-container">
        <scEcharts height="300px" width="100%" :option="weatherStore.options" />
      </div>
    </sc-dialog>
  </div>
</template>

<style scoped lang="scss">
.weather-card {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--el-bg-color) 0%, var(--el-fill-color-light) 100%);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
  flex-direction: column;
  padding: 16px;
  box-sizing: border-box;
  border: 1px solid var(--el-border-color-lighter);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
    border-color: var(--el-color-primary-light-7);
    
    .weather-icon {
      transform: scale(1.15) rotate(5deg);
    }
  }
}

.skeleton-content {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 100%;
  
  .skeleton-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
}

.weather-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.weather-main {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 4px;
  
  .weather-icon {
    color: var(--el-color-primary);
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    filter: drop-shadow(0 4px 8px rgba(var(--el-color-primary-rgb), 0.3));
  }
  
  .weather-info {
    display: flex;
    flex-direction: column;
    
    .temperature {
      font-size: 36px;
      font-weight: 700;
      line-height: 1;
      background: linear-gradient(45deg, var(--el-text-color-primary), var(--el-color-primary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      
      .unit {
        font-size: 18px;
        margin-left: 2px;
        font-weight: normal;
        -webkit-text-fill-color: var(--el-text-color-secondary);
      }
    }
    
    .location-weather {
      margin-top: 6px;
      font-size: 13px;
      color: var(--el-text-color-secondary);
      display: flex;
      align-items: center;
      gap: 8px;
      
      .city {
        font-weight: 500;
        color: var(--el-text-color-regular);
      }

      .divider {
        opacity: 0.3;
        font-size: 10px;
        transform: scaleY(0.8);
      }
    }
  }
}

.weather-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px dashed var(--el-border-color-lighter);
  
  .detail-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    
    .label {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
    }
    
    .value {
      font-size: 13px;
      font-weight: 600;
      color: var(--el-text-color-regular);
    }
  }
}

.chart-container {
  padding: 10px;
  background: var(--el-bg-color);
  border-radius: 8px;
}
</style>

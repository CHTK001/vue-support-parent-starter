<script setup>
/**
 * 时间工具部件
 * @author CH
 * @date 2024-12-10
 * @version 1.0.1
 */
import { reactive, onMounted, onUnmounted, ref } from "vue";
import { message, dateFormat } from "@repo/utils";
import { useI18n } from "vue-i18n";
import ScDialog from "@repo/components/ScDialog/src/index.vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

const { t } = useI18n();
const dialogVisible = ref(false);

const env = reactive({
  loading: false,
  currentTime: new Date(),
  inputType: "datetime",
  inputValue: "",
  outputResults: [],
  timezones: ["Asia/Shanghai", "America/New_York", "Europe/London", "Asia/Tokyo", "Australia/Sydney", "UTC"],
});

let clockTimer = null;

const updateCurrentTime = () => {
  env.currentTime = new Date();
};

const parseTime = () => {
  if (!env.inputValue) return;
  env.loading = true;
  env.outputResults = [];
  try {
    let parsedDate;
    if (env.inputType === "timestamp-s") {
      parsedDate = new Date(parseInt(env.inputValue) * 1000);
    } else if (env.inputType === "timestamp-ms") {
      parsedDate = new Date(parseInt(env.inputValue));
    } else {
      parsedDate = new Date(env.inputValue);
    }

    if (isNaN(parsedDate.getTime())) {
      message("无效的时间格式", { type: "error" });
      env.loading = false;
      return;
    }

    env.outputResults = [
      { label: "标准日期时间", value: dateFormat(parsedDate, "yyyy-MM-dd hh:mm:ss") },
      { label: "日期", value: dateFormat(parsedDate, "yyyy-MM-dd") },
      { label: "时间", value: dateFormat(parsedDate, "hh:mm:ss") },
      { label: "Unix 时间戳(秒)", value: Math.floor(parsedDate.getTime() / 1000).toString() },
      { label: "Unix 时间戳(毫秒)", value: parsedDate.getTime().toString() },
    ];
    
    env.timezones.forEach((timezone) => {
      try {
        const timeInZone = new Intl.DateTimeFormat("zh-CN", {
          timeZone: timezone,
          year: "numeric", month: "2-digit", day: "2-digit",
          hour: "2-digit", minute: "2-digit", second: "2-digit",
          hour12: false
        }).format(parsedDate);
        env.outputResults.push({ label: `${timezone}`, value: timeInZone });
      } catch (e) {}
    });
    
    message("解析成功", { type: "success" });
  } catch (error) {
    message("解析失败", { type: "error" });
  } finally {
    env.loading = false;
  }
};

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => message("复制成功", { type: "success" }));
};

onMounted(() => {
  updateCurrentTime();
  clockTimer = setInterval(updateCurrentTime, 1000);
});

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer);
});
</script>

<template>
  <div class="time-widget" @click="dialogVisible = true">
    <div class="clock-display">
      <div class="time">{{ dateFormat(env.currentTime, "hh:mm:ss") }}</div>
      <div class="date">
        {{ dateFormat(env.currentTime, "yyyy年MM月dd日") }}
        <span class="week">{{ ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][env.currentTime.getDay()] }}</span>
      </div>
    </div>
    <div class="decoration-circle c1"></div>
    <div class="decoration-circle c2"></div>
    
    <sc-dialog v-model="dialogVisible" title="时间转换工具" width="600px" draggable append-to-body>
      <div class="tool-container">
        <div class="input-section">
          <el-input v-model="env.inputValue" placeholder="输入时间或时间戳" class="input-with-select">
            <template #prepend>
              <el-select v-model="env.inputType" style="width: 110px">
                <el-option label="日期时间" value="datetime" />
                <el-option label="时间戳(秒)" value="timestamp-s" />
                <el-option label="时间戳(毫秒)" value="timestamp-ms" />
              </el-select>
            </template>
            <template #append>
              <el-button @click="parseTime">解析</el-button>
            </template>
          </el-input>
        </div>
        
        <div v-if="env.outputResults.length > 0" class="results-section">
          <div v-for="(item, index) in env.outputResults" :key="index" class="result-item" @click="copyToClipboard(item.value)">
            <span class="label">{{ item.label }}</span>
            <span class="value">{{ item.value }}</span>
            <el-icon class="copy-icon"><component :is="useRenderIcon('ep:copy-document')" /></el-icon>
          </div>
        </div>
      </div>
    </sc-dialog>
  </div>
</template>

<style scoped lang="scss">
.time-widget {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-dark-2) 100%);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(var(--el-color-primary-rgb), 0.5);
    
    .decoration-circle {
      transform: scale(1.1);
    }
  }
}

.clock-display {
  text-align: center;
  z-index: 2;
  
  .time {
    font-size: 34px;
    font-weight: 700;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    line-height: 1.1;
    text-shadow: 0 4px 8px rgba(0,0,0,0.2);
    letter-spacing: 1px;
  }
  
  .date {
    font-size: 14px;
    opacity: 0.9;
    margin-top: 8px;
    font-weight: 500;
    background: rgba(0, 0, 0, 0.1);
    padding: 4px 12px;
    border-radius: 20px;
    backdrop-filter: blur(4px);
    
    .week {
      margin-left: 8px;
      padding-left: 8px;
      border-left: 1px solid rgba(255, 255, 255, 0.3);
    }
  }
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%);
  pointer-events: none;
  transition: transform 0.8s ease;
  
  &.c1 {
    width: 200px;
    height: 200px;
    top: -80px;
    right: -60px;
  }
  
  &.c2 {
    width: 140px;
    height: 140px;
    bottom: -40px;
    left: -30px;
  }
}

.tool-container {
  padding: 10px;
  
  .input-section {
    margin-bottom: 20px;
  }
  
  .results-section {
    display: grid;
    gap: 10px;
  }
  
  .result-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: var(--el-fill-color-light);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;
    
    &:hover {
      background: var(--el-fill-color);
      border-color: var(--el-color-primary-light-7);
      
      .copy-icon {
        opacity: 1;
        color: var(--el-color-primary);
      }
    }
    
    .label {
      color: var(--el-text-color-secondary);
      font-size: 13px;
    }
    
    .value {
      font-weight: 600;
      color: var(--el-text-color-primary);
      font-family: monospace;
    }
    
    .copy-icon {
      opacity: 0;
      transition: all 0.2s;
    }
  }
}
</style>

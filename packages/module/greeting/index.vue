<script setup>
/**
 * 问候语部件（支持本地+在线随机文案）
 * @author CH
 * @date 2024-12-10
 * @version 1.1.0
 */
import { reactive, onMounted, computed, onUnmounted, ref } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { useUserStoreHook } from "@repo/core";
import { dateFormat } from "@repo/utils";

const env = reactive({
  currentTime: new Date(),
  username: "",
});

let timer = null;
const tipFromApi = ref("");
const loadingTip = ref(false);
const useOnlineTip = ref(true);
const apiError = ref(false);

const greeting = computed(() => {
  const hour = env.currentTime.getHours();
  if (hour >= 5 && hour < 9) return "早上好";
  if (hour >= 9 && hour < 12) return "上午好";
  if (hour >= 12 && hour < 14) return "中午好";
  if (hour >= 14 && hour < 18) return "下午好";
  if (hour >= 18 && hour < 22) return "晚上好";
  return "夜深了";
});

const timeIcon = computed(() => {
  const hour = env.currentTime.getHours();
  if (hour >= 5 && hour < 9) return "meteocons:sunrise-fill";
  if (hour >= 9 && hour < 18) return "meteocons:clear-day-fill";
  if (hour >= 18 && hour < 22) return "meteocons:sunset-fill";
  return "meteocons:clear-night-fill";
});

const localTipMessage = computed(() => {
  const hour = env.currentTime.getHours();
  if (hour >= 5 && hour < 9) return "新的一天开始了，元气满满！";
  if (hour >= 9 && hour < 12) return "上午是最佳工作时间，加油！";
  if (hour >= 12 && hour < 14) return "记得吃午饭，休息一下！";
  if (hour >= 14 && hour < 18) return "下午茶时间，补充能量~";
  if (hour >= 18 && hour < 22) return "辛苦一天了，放松一下！";
  return "夜深了，注意休息哦~";
});

const tipMessage = computed(() => {
  if (useOnlineTip.value && tipFromApi.value) {
    return tipFromApi.value;
  }
  return localTipMessage.value;
});

const bgGradient = computed(() => {
  const hour = env.currentTime.getHours();
  if (hour >= 5 && hour < 9) return "linear-gradient(135deg, #ff9966, #ff5e62)";
  if (hour >= 9 && hour < 12) return "linear-gradient(135deg, #56CCF2, #2F80ED)";
  if (hour >= 12 && hour < 14) return "linear-gradient(135deg, #F2994A, #F2C94C)";
  if (hour >= 14 && hour < 18) return "linear-gradient(135deg, #11998e, #38ef7d)";
  if (hour >= 18 && hour < 22) return "linear-gradient(135deg, #ee9ca7, #ffdde1)";
  return "linear-gradient(135deg, #2c3e50, #4ca1af)";
});

const formattedTime = computed(() => dateFormat(env.currentTime, "HH:mm:ss"));
const weekDay = computed(() => ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"][env.currentTime.getDay()]);

/**
 * 从公开API获取随机问候/短句
 * 这里选用简单JSON接口，失败时自动回退到本地文案
 */
const fetchOnlineGreeting = async () => {
  try {
    loadingTip.value = true;
    apiError.value = false;
    // 使用一个常见的中文每日一句API，保持JSON返回，避免HTML解析
    const res = await fetch("https://v1.hitokoto.cn/?c=i&encode=json");
    if (!res.ok) {
      throw new Error("请求失败");
    }
    const data = await res.json();
    if (data?.hitokoto) {
      tipFromApi.value = data.hitokoto;
    } else {
      apiError.value = true;
    }
  } catch (e) {
    apiError.value = true;
  } finally {
    loadingTip.value = false;
  }
};

onMounted(() => {
  try {
    const userStore = useUserStoreHook();
    env.username = userStore?.username || userStore?.nickname || "用户";
  } catch (e) {
    env.username = "用户";
  }
  
  timer = setInterval(() => {
    env.currentTime = new Date();
  }, 1000);

  // 初次加载在线问候
  fetchOnlineGreeting();
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div class="greeting-card" :style="{ background: bgGradient }">
    <div class="glass-effect">
      <div class="content-left">
        <div class="greeting-header">
          <div class="icon-wrapper">
            <IconifyIconOnline :icon="timeIcon" class="time-icon" />
          </div>
          <div class="text-info">
            <h2 class="greeting-text">{{ greeting }}，{{ env.username }}</h2>
            <p class="tip-text">
              <span v-if="loadingTip">加载今日问候中...</span>
              <span v-else>{{ tipMessage }}</span>
            </p>
            <div class="tip-source">
              <span v-if="useOnlineTip && !apiError">在线问候 · 单击刷新</span>
              <span v-else>本地提示 · 单击刷新</span>
            </div>
          </div>
        </div>
      </div>

      <div class="content-right" @click="fetchOnlineGreeting" title="刷新问候语">
        <div class="time-display">{{ formattedTime }}</div>
        <div class="date-display">{{ weekDay }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.greeting-card {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  color: white;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  }
}

.glass-effect {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.greeting-header {
  display: flex;
  align-items: center;
  gap: 16px;
  
  .icon-wrapper {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .time-icon {
      font-size: 32px;
    }
  }
  
  .text-info {
    .greeting-text {
      font-size: 20px;
      font-weight: 600;
      margin: 0;
      line-height: 1.2;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .tip-text {
      font-size: 13px;
      margin: 4px 0 0;
      opacity: 0.9;
      min-height: 20px;
    }
  }
}

.tip-source {
  margin-top: 6px;
  font-size: 11px;
  opacity: 0.8;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  background-color: rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(6px);
}

.content-right {
  text-align: right;
  
  .time-display {
    font-size: 28px;
    font-weight: bold;
    font-family: monospace;
    line-height: 1;
    margin-bottom: 4px;
    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .date-display {
    font-size: 12px;
    opacity: 0.9;
  }
}
</style>

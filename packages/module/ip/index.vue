<script setup>
import { reactive, ref, onMounted, onBeforeUnmount } from "vue";
import { message } from "@repo/utils";
import { useI18n } from "vue-i18n";
import { isPrivateIP, checkPublicNetwork } from "@repo/utils";

// 国际化
const { t } = useI18n();

// 环境变量
const env = reactive({
  loading: false,
  currentIP: "",
  ipDetails: {
    country: "",
    region: "",
    city: "",
    isp: "",
    asn: "",
    timezone: "",
  },
  networkStatus: {
    isOnline: true,
    isPublic: false,
    lastChecked: new Date(),
  },
  refreshInterval: 5 * 60 * 1000, // 5分钟刷新一次
});

// 刷新定时器
let refreshTimer = null;

/**
 * 获取当前 IP 地址
 */
const getCurrentIP = async () => {
  env.loading = true;
  try {
    // 检查网络连接
    const isOnline = await checkPublicNetwork();
    env.networkStatus.isOnline = isOnline;
    
    if (!isOnline) {
      env.currentIP = "离线状态";
      env.loading = false;
      return;
    }
    
    // 获取公网IP
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    env.currentIP = data.ip;
    
    // 检查是否为公网IP
    env.networkStatus.isPublic = !isPrivateIP(env.currentIP);
    
    // 获取IP地理位置信息（模拟数据，实际应用中可调用地理位置API）
    await getIPDetails(env.currentIP);
    
    env.networkStatus.lastChecked = new Date();
  } catch (error) {
    console.error("获取 IP 地址失败:", error);
    env.currentIP = "获取失败";
  } finally {
    env.loading = false;
  }
};

/**
 * 获取IP详细信息
 * @param {string} ip - IP地址
 */
const getIPDetails = async (ip) => {
  // 实际应用中应调用IP地理位置API
  // 这里使用模拟数据
  env.ipDetails = {
    country: "中国",
    region: "北京市",
    city: "北京",
    isp: "联通",
    asn: "AS4837",
    timezone: "Asia/Shanghai",
  };
};

/**
 * 复制IP地址到剪贴板
 */
const copyIPToClipboard = () => {
  if (!env.currentIP || env.currentIP === "离线状态" || env.currentIP === "获取失败") {
    message(t("message.noValidIP") || "没有有效的IP地址可复制", { type: "warning" });
    return;
  }
  
  navigator.clipboard
    .writeText(env.currentIP)
    .then(() => {
      message(t("message.copySuccess") || "复制成功", { type: "success" });
    })
    .catch((err) => {
      console.error("复制失败:", err);
      message(t("message.copyError") || "复制失败", { type: "error" });
    });
};

/**
 * 手动刷新IP信息
 */
const refreshIP = () => {
  getCurrentIP();
};

// 组件挂载时获取IP信息并设置定时刷新
onMounted(() => {
  getCurrentIP();
  refreshTimer = setInterval(getCurrentIP, env.refreshInterval);
});

// 组件卸载前清除定时器
onBeforeUnmount(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});
</script>

<template>
  <div class="ip-module">
    <div class="ip-module__content">
      <!-- IP信息显示 -->
      <div class="ip-module__container">
        <div class="ip-module__card">
          <div class="ip-module__card-inner">
            <div class="ip-module__status">
              <div class="ip-module__status-indicator" :class="{ 'is-online': env.networkStatus.isOnline, 'is-public': env.networkStatus.isPublic }"></div>
              <div class="ip-module__status-text">
                {{ env.networkStatus.isOnline ? (env.networkStatus.isPublic ? '公网连接' : '局域网') : '离线' }}
              </div>
            </div>
            
            <div class="ip-module__ip">
              <div class="ip-module__ip-label">公网 IP</div>
              <div class="ip-module__ip-value">
                <span>{{ env.loading ? '加载中...' : env.currentIP }}</span>
                <el-button 
                  v-if="env.currentIP && env.currentIP !== '离线状态' && env.currentIP !== '获取失败'" 
                  type="primary" 
                  link 
                  size="small" 
                  @click="copyIPToClipboard"
                >
                  <IconifyIconOnline icon="ri:file-copy-line" />
                </el-button>
              </div>
            </div>
            
            <div class="ip-module__location" v-if="env.currentIP && env.currentIP !== '离线状态' && env.currentIP !== '获取失败'">
              <div class="ip-module__location-item">
                <IconifyIconOnline icon="ri:map-pin-line" class="ip-module__location-icon" />
                <span>{{ env.ipDetails.country }} {{ env.ipDetails.region }} {{ env.ipDetails.city }}</span>
              </div>
              <div class="ip-module__location-item">
                <IconifyIconOnline icon="ri:global-line" class="ip-module__location-icon" />
                <span>{{ env.ipDetails.isp }} {{ env.ipDetails.asn }}</span>
              </div>
            </div>
          </div>
          
          <div class="ip-module__card-decoration">
            <div class="ip-module__card-circle"></div>
            <div class="ip-module__card-circle"></div>
            <div class="ip-module__card-circle"></div>
          </div>
          
          <div class="ip-module__refresh">
            <el-button 
              type="primary" 
              link 
              size="small" 
              :loading="env.loading" 
              @click="refreshIP"
            >
              <IconifyIconOnline icon="ri:refresh-line" />
              <span>刷新</span>
            </el-button>
            <div class="ip-module__last-checked">
              上次检查: {{ new Date(env.networkStatus.lastChecked).toLocaleTimeString() }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ip-module {
  /* 内容区域样式 */
  &__content {
    border-radius: 12px;
  }

  /* IP容器 */
  &__container {
    margin-bottom: 30px;
    perspective: 1000px;
  }

  /* IP卡片样式 */
  &__card {
    background: linear-gradient(135deg, var(--el-color-primary-dark-2), var(--el-color-primary));
    border-radius: 12px;
    padding: 30px;
    text-align: center;
    box-shadow: 0 10px 30px rgba(var(--el-color-primary-rgb), 0.3);
    position: relative;
    overflow: hidden;
    transform-style: preserve-3d;
    transform: rotateX(5deg);
    transition: transform 0.5s ease;

    &:hover {
      transform: rotateX(0deg) scale(1.02);
    }

    &-inner {
      position: relative;
      z-index: 2;
    }

    &-decoration {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    &-circle {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);

      &:nth-child(1) {
        width: 200px;
        height: 200px;
        top: -100px;
        right: -50px;
        animation: float 15s infinite ease-in-out;
      }

      &:nth-child(2) {
        width: 150px;
        height: 150px;
        bottom: -50px;
        left: -30px;
        animation: float 12s infinite ease-in-out reverse;
      }

      &:nth-child(3) {
        width: 100px;
        height: 100px;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        animation: pulse 8s infinite ease-in-out;
      }
    }
  }

  /* 状态指示器 */
  &__status {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 15px;
    
    &-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background-color: var(--el-color-danger);
      margin-right: 8px;
      position: relative;
      
      &::after {
        content: '';
        position: absolute;
        top: -4px;
        left: -4px;
        right: -4px;
        bottom: -4px;
        border-radius: 50%;
        background-color: rgba(var(--el-color-danger-rgb), 0.3);
        animation: pulse 2s infinite;
      }
      
      &.is-online {
        background-color: var(--el-color-warning);
        
        &::after {
          background-color: rgba(var(--el-color-warning-rgb), 0.3);
        }
      }
      
      &.is-online.is-public {
        background-color: var(--el-color-success);
        
        &::after {
          background-color: rgba(var(--el-color-success-rgb), 0.3);
        }
      }
    }
    
    &-text {
      font-size: 16px;
      font-weight: 500;
      color: var(--el-color-white);
    }
  }

  /* IP信息 */
  &__ip {
    margin-bottom: 20px;
    
    &-label {
      font-size: 16px;
      color: var(--el-color-white);
      opacity: 0.9;
      margin-bottom: 8px;
    }
    
    &-value {
      font-size: 32px;
      font-weight: 700;
      color: var(--el-color-white);
      text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      letter-spacing: 1px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
  }

  /* 位置信息 */
  &__location {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 15px;
    
    &-item {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--el-color-white);
      opacity: 0.9;
      font-size: 15px;
    }
    
    &-icon {
      margin-right: 8px;
      font-size: 18px;
    }
  }

  /* 刷新区域 */
  &__refresh {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    z-index: 2;
  }
  
  &__last-checked {
    font-size: 12px;
    color: var(--el-color-white);
    opacity: 0.7;
    margin-top: 5px;
  }
}

/* 动画效果 */
@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(10deg);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .ip-module {
    &__ip-value {
      font-size: 24px;
    }
    
    &__location {
      flex-direction: column;
      
      &-item {
        margin-bottom: 5px;
      }
    }
  }
}
</style>
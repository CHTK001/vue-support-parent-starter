<script setup>
/**
 * IP信息部件
 * @author CH
 * @date 2024-12-10
 * @version 1.0.1
 */
import { reactive, onMounted } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { getCurrentIP, message } from "@repo/utils";

const env = reactive({
  loading: false,
  currentIP: "0.0.0.0",
  details: {
    country: "未知",
    region: "未知",
    city: "未知",
    isp: "未知",
  },
});

const refreshIP = async () => {
  env.loading = true;
  try {
    const ipInfo = await getCurrentIP();
    env.currentIP = ipInfo.ip;
    if (ipInfo.details) {
      env.details = {
        country: ipInfo.details.country || "未知",
        region: ipInfo.details.region || "未知",
        city: ipInfo.details.city || "未知",
        isp: ipInfo.details.isp || "未知",
      };
    }
  } catch (error) {
    console.error("刷新IP信息失败:", error);
  } finally {
    env.loading = false;
  }
};

const copyIP = () => {
  navigator.clipboard.writeText(env.currentIP).then(() => {
    message("IP已复制", { type: "success" });
  });
};

onMounted(() => {
  refreshIP();
});
</script>

<template>
  <div class="ip-card" @click="refreshIP">
    <div class="ip-header">
      <div class="header-left">
        <IconifyIconOnline icon="ri:global-line" class="header-icon" />
        <span>网络信息</span>
      </div>
      <div class="refresh-icon" :class="{ 'is-loading': env.loading }">
        <IconifyIconOnline icon="ri:refresh-line" />
      </div>
    </div>
    
    <div class="ip-body">
      <div class="ip-value-box">
        <div class="ip-value">{{ env.currentIP }}</div>
        <div class="copy-btn" @click.stop="copyIP">
          <IconifyIconOnline icon="ri:file-copy-line" />
        </div>
      </div>
      <div class="ip-location">
        <IconifyIconOnline icon="ri:map-pin-2-line" />
        <span>{{ env.details.country }} · {{ env.details.region }} · {{ env.details.city }}</span>
      </div>
      <div class="ip-isp">
        <IconifyIconOnline icon="ri:broadcast-line" />
        <span>{{ env.details.isp }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.ip-card {
  width: 100%;
  height: 100%;
  background: var(--el-bg-color);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  
  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
}

.ip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 4px;
    
    .header-icon {
      font-size: 16px;
      color: var(--el-color-primary);
    }
  }
}

.refresh-icon {
  &.is-loading {
    animation: rotate 1s linear infinite;
  }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.ip-body {
  margin-top: 8px;
}

.ip-value-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--el-fill-color-lighter);
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 10px;
  
  .ip-value {
    font-size: 18px;
    font-weight: bold;
    color: var(--el-text-color-primary);
    font-family: monospace;
  }
  
  .copy-btn {
    color: var(--el-text-color-secondary);
    transition: color 0.2s;
    &:hover { color: var(--el-color-primary); }
  }
}

.ip-location, .ip-isp {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
  
  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>

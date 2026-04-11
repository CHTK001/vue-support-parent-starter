<script setup>
import { reactive, onMounted } from "vue";
import { IconifyIconOnline } from "@repo/components/IconifyIconOnline";
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
    message("IP 已复制", { type: "success" });
  });
};

onMounted(() => {
  refreshIP();
});
</script>

<template>
  <div class="ip-card">
    <div class="ip-card__header">
      <div class="left">
        <IconifyIconOnline icon="ri:global-line" />
        <span>网络信息</span>
      </div>
      <div class="right" @click="refreshIP">
        <IconifyIconOnline icon="ri:refresh-line" :class="{ spin: env.loading }" />
      </div>
    </div>

    <div class="ip-card__body">
      <div class="ip-item" @click.stop="copyIP">
        <span class="ip">{{ env.currentIP }}</span>
        <IconifyIconOnline icon="ri:file-copy-line" class="copy" />
      </div>

      <div class="info-item">
        <IconifyIconOnline icon="ri:map-pin-2-line" />
        <span>{{ env.details.country }} · {{ env.details.region }} · {{ env.details.city }}</span>
      </div>

      <div class="info-item">
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
  border-radius: 10px;
  padding: 18px;
  box-sizing: border-box;
  border: 1px solid var(--el-border-color-light);
}

.ip-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .left {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: var(--el-text-color-primary);
    font-weight: 500;

    svg {
      font-size: 16px;
      color: var(--el-color-primary);
    }
  }

  .right {
    cursor: pointer;
    color: var(--el-text-color-regular);

    &:hover {
      color: var(--el-color-primary);
    }

    .spin {
      animation: rotate 0.8s linear infinite;
    }
  }
}

.ip-card__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ip-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  padding: 12px 14px;
  cursor: pointer;

  .ip {
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    font-family: monospace;
  }

  .copy {
    color: var(--el-text-color-regular);

    &:hover {
      color: var(--el-color-primary);
    }
  }
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);

  svg {
    font-size: 16px;
    color: var(--el-text-color-secondary);
  }
}

@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
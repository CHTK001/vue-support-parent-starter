<template>
  <div v-if="deviceInfo" class="monitor-item device-info-item">
    <div class="item-content">
      <span class="value">{{ deviceInfo.platform }}</span>
      <span class="label">设备</span>
    </div>
    <div v-if="mode === 'detailed'" class="device-details">
      <span class="detail-text">{{ deviceInfo.type }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

defineProps({
  mode: { type: String, required: true }
});

interface DeviceInfo {
  platform: string;
  type: string;
}

const deviceInfo = ref<DeviceInfo | null>(null);

const detectDevice = () => {
  const ua = navigator.userAgent;
  let platform = 'Unknown';
  let type = 'Desktop';

  // 检测平台
  if (ua.includes('Windows')) {
    platform = 'Windows';
  } else if (ua.includes('Mac')) {
    platform = 'macOS';
  } else if (ua.includes('Linux')) {
    platform = 'Linux';
  } else if (ua.includes('Android')) {
    platform = 'Android';
  } else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
    platform = 'iOS';
  }

  // 检测设备类型
  if (/Mobile|Android|iPhone|iPad/.test(ua)) {
    type = 'Mobile';
  } else if (/Tablet|iPad/.test(ua)) {
    type = 'Tablet';
  } else {
    type = 'Desktop';
  }

  deviceInfo.value = { platform, type };
};

onMounted(() => {
  detectDevice();
});
</script>

<style scoped>
.monitor-item {
  display: flex;
  flex-direction: column;
  color: #fff;
  font-family: monospace;
  transition: all 0.3s ease;
}

.item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  line-height: 1.2;
  padding: 2px 0;
}

.value {
  font-weight: bold;
  font-size: 14px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.label {
  font-size: 10px;
  opacity: 0.8;
  margin-left: 8px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.device-details {
  margin-top: 4px;
}

.detail-text {
  font-size: 9px;
  opacity: 0.7;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}
</style>


<template>
  <div class="server-quick-setting system-container modern-bg">
    <el-popover
      placement="bottom-start"
      :width="300"
      trigger="click"
      :visible="visible"
      @update:visible="handleVisibleChange"
    >
      <template #reference>
        <el-button
          :type="isMonitorEnabled ? 'success' : 'info'"
          size="small"
          :loading="loading"
          plain
        >
          <IconifyIconOnline 
            :icon="isMonitorEnabled ? 'ri:eye-line' : 'ri:eye-off-line'" 
            class="mr-1" 
          />
          {{ isMonitorEnabled ? '监控中' : '未监控' }}
        </el-button>
      </template>

      <div class="quick-setting-content">
        <div class="setting-header">
          <h4>快速设置</h4>
          <span class="server-name">{{ serverName }}</span>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <span>启用监控</span>
            <el-tooltip content="开启后将定期收集服务器指标数据" placement="top">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
          <el-switch
            v-model="localSettings.monitorEnabled"
            :active-value="1"
            :inactive-value="0"
            @change="handleMonitorChange"
          />
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <span>启用上报</span>
            <el-tooltip content="开启后将向监控中心上报数据" placement="top">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
          <el-switch
            v-model="localSettings.reportEnabled"
            :active-value="1"
            :inactive-value="0"
            @change="handleReportChange"
          />
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <span>启用告警</span>
            <el-tooltip content="开启后将在指标异常时发送告警通知" placement="top">
              <IconifyIconOnline icon="ri:question-line" class="help-icon" />
            </el-tooltip>
          </div>
          <el-switch
            v-model="localSettings.alertEnabled"
            :active-value="1"
            :inactive-value="0"
            @change="handleAlertChange"
          />
        </div>

        <div class="setting-actions">
          <el-button size="small" @click="handleOpenFullSetting">
            <IconifyIconOnline icon="ri:settings-3-line" class="mr-1" />
            完整设置
          </el-button>
          <el-button 
            type="primary" 
            size="small" 
            :loading="saveLoading"
            @click="handleSave"
          >
            保存
          </el-button>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { message } from "@repo/utils";
import {
  type ServerSetting,
  getOrCreateServerSetting,
  saveOrUpdateServerSetting
} from "@/api/server/setting";

// 定义属性
interface Props {
  serverId: number;
  serverName: string;
}

const props = defineProps<Props>();

// 定义事件
const emit = defineEmits<{
  openFullSetting: [serverId: number];
  settingChanged: [serverId: number];
}>();

// 响应式状态
const visible = ref(false);
const loading = ref(false);
const saveLoading = ref(false);
const serverSetting = ref<ServerSetting | null>(null);

// 本地设置状态
const localSettings = reactive({
  monitorEnabled: 0,
  reportEnabled: 0,
  alertEnabled: 0,
});

// 计算属性
const isMonitorEnabled = computed(() => localSettings.monitorEnabled === 1);

// 监听服务器ID变化
watch(() => props.serverId, (newServerId) => {
  if (newServerId) {
    loadServerSetting();
  }
}, { immediate: true });

/**
 * 处理可见性变化
 */
const handleVisibleChange = (newVisible: boolean) => {
  visible.value = newVisible;
  if (newVisible) {
    loadServerSetting();
  }
};

/**
 * 加载服务器设置
 */
const loadServerSetting = async () => {
  if (!props.serverId) return;
  
  try {
    loading.value = true;
    const result = await getOrCreateServerSetting(props.serverId);
    if (result.code === "00000" && result.data) {
      serverSetting.value = result.data;
      // 更新本地设置
      localSettings.monitorEnabled = result.data.monitorSysGenServerSettingMonitorEnabled || 0;
      localSettings.reportEnabled = result.data.monitorSysGenServerSettingReportEnabled || 0;
      localSettings.alertEnabled = result.data.monitorSysGenServerSettingAlertEnabled || 0;
    }
  } catch (error) {
    console.error('加载服务器设置失败:', error);
  } finally {
    loading.value = false;
  }
};

/**
 * 处理监控状态变化
 */
const handleMonitorChange = (value: number) => {
  // 如果关闭监控，同时关闭上报和告警
  if (value === 0) {
    localSettings.reportEnabled = 0;
    localSettings.alertEnabled = 0;
  }
};

/**
 * 处理上报状态变化
 */
const handleReportChange = (value: number) => {
  // 如果开启上报，需要先开启监控
  if (value === 1 && localSettings.monitorEnabled === 0) {
    localSettings.monitorEnabled = 1;
  }
};

/**
 * 处理告警状态变化
 */
const handleAlertChange = (value: number) => {
  // 如果开启告警，需要先开启监控
  if (value === 1 && localSettings.monitorEnabled === 0) {
    localSettings.monitorEnabled = 1;
  }
};

/**
 * 保存设置
 */
const handleSave = async () => {
  try {
    saveLoading.value = true;
    
    const submitData = {
      ...serverSetting.value,
      monitorSysGenServerId: props.serverId,
      monitorSysGenServerSettingMonitorEnabled: localSettings.monitorEnabled,
      monitorSysGenServerSettingReportEnabled: localSettings.reportEnabled,
      monitorSysGenServerSettingAlertEnabled: localSettings.alertEnabled,
    };

    const result = await saveOrUpdateServerSetting(submitData);
    if (result.code === "00000") {
      message.success("设置保存成功");
      visible.value = false;
      emit("settingChanged", props.serverId);
    } else {
      message.error(result.msg || "保存失败");
    }
  } catch (error) {
    console.error("保存设置失败:", error);
    message.error("保存失败");
  } finally {
    saveLoading.value = false;
  }
};

/**
 * 打开完整设置
 */
const handleOpenFullSetting = () => {
  visible.value = false;
  emit("openFullSetting", props.serverId);
};
</script>

<style scoped lang="scss">

.modern-bg {
  position: relative;
  overflow: hidden;

  /* 渐变背景 */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(99, 102, 241, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(168, 85, 247, 0.06) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}


.server-quick-setting {
  display: inline-block;
}

.quick-setting-content {
  padding: 8px 0;
}

.setting-header {
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.setting-header h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.server-name {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.help-icon {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  cursor: help;
}

.setting-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-light);
}


/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>

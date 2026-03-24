<template>
  <div class="config-actions">
    <!-- 快速操作 -->
    <div class="quick-actions">
      <ScButton v-if="config.videoSyncConfigStatus === 0" type="success" size="small" circle @click="handleAction('enable')" title="启用配置">
        <IconifyIconOnline icon="ep:video-play" />
      </ScButton>
      <ScButton v-else type="warning" size="small" circle @click="handleAction('disable')" title="禁用配置">
        <IconifyIconOnline icon="ep:video-pause" />
      </ScButton>
      <ScButton type="primary" size="small" circle :loading="(config as any).syncing" @click="handleAction('sync')" title="执行同步">
        <IconifyIconOnline icon="ep:refresh" />
      </ScButton>
    </div>

    <!-- 主要操作 -->
    <div class="primary-actions">
      <ScButton type="primary" size="small" @click="handleAction('edit')">
        <IconifyIconOnline icon="ep:edit" class="mr-1" />
        编辑
      </ScButton>
      <ScButton type="info" size="small" @click="handleAction('test')">
        <IconifyIconOnline icon="ep:connection" class="mr-1" />
        测试
      </ScButton>
    </div>

    <!-- 次要操作 -->
    <div class="secondary-actions">
      <ScButton type="danger" size="small" text @click="handleAction('delete')">
        <IconifyIconOnline icon="ep:delete" class="mr-1" />
        删除
      </ScButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VideoSyncConfig } from "../../../api/types";

/**
 * 配置操作组件
 * @author CH
 * @version 1.0.0
 * @since 2024-12-19
 */

// 定义props
interface Props {
  config: VideoSyncConfig;
}

const props = defineProps<Props>();

// 定义emits
interface Emits {
  action: [action: string, config: VideoSyncConfig];
}

const emit = defineEmits<Emits>();

/**
 * 处理操作
 * @param action 操作类型
 */
const handleAction = (action: string) => {
  emit("action", action, props.config);
};
</script>

<style scoped lang="scss">
.config-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-7) 100%);
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
}

.quick-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.primary-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.secondary-actions {
  display: flex;
  justify-content: flex-end;
}

.config-actions .el-button {
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.config-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.config-actions .el-button--primary {
  box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.2);
}

.config-actions .el-button--primary:hover {
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
}
</style>

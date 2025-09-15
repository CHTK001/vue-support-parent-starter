<template>
  <div class="config-actions">
    <!-- 快速操作 -->
    <div class="quick-actions">
      <el-button v-if="config.videoSyncConfigStatus === 0" type="success" size="small" circle @click="handleAction('enable')" title="启用配置">
        <IconifyIconOnline icon="ep:video-play" />
      </el-button>
      <el-button v-else type="warning" size="small" circle @click="handleAction('disable')" title="禁用配置">
        <IconifyIconOnline icon="ep:video-pause" />
      </el-button>
      <el-button type="primary" size="small" circle :loading="(config as any).syncing" @click="handleAction('sync')" title="执行同步">
        <IconifyIconOnline icon="ep:refresh" />
      </el-button>
    </div>

    <!-- 主要操作 -->
    <div class="primary-actions">
      <el-button type="primary" size="small" @click="handleAction('edit')">
        <IconifyIconOnline icon="ep:edit" class="mr-1" />
        编辑
      </el-button>
      <el-button type="info" size="small" @click="handleAction('test')">
        <IconifyIconOnline icon="ep:connection" class="mr-1" />
        测试
      </el-button>
    </div>

    <!-- 次要操作 -->
    <div class="secondary-actions">
      <el-button type="danger" size="small" text @click="handleAction('delete')">
        <IconifyIconOnline icon="ep:delete" class="mr-1" />
        删除
      </el-button>
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

<style scoped>
.config-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quick-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.primary-actions {
  display: flex;
  gap: 8px;
}

.secondary-actions {
  display: flex;
  justify-content: flex-end;
}

.config-actions .el-button {
  transition: all 0.3s ease;
}

.config-actions .el-button:hover {
  transform: translateY(-1px);
}
</style>

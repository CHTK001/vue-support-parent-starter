<template>
  <div class="app-wrapper">
    <div class="media-content">
      <div class="app-logo">
        <el-image :src="software.softServiceLogo" fit="contain" :alt="software.softServiceName">
          <template #error>
            <div class="app-logo-fallback">
              <IconifyIconOnline icon="ep:picture" />
            </div>
          </template>
        </el-image>
      </div>

      <div class="app-content">
        <div class="app-header">
          <h3 class="app-title">{{ software.softServiceName }}</h3>
          <div class="app-servers">
            <template v-if="software.installedServers && software.installedServers.length > 0">
              <el-dropdown trigger="hover" @command="handleDeviceCommand">
                <div class="server-count flex items-center">
                  <IconifyIconOnline icon="ep:monitor" />
                  <span>{{ software.installedServers.length }}</span>
                  <IconifyIconOnline icon="ep:arrow-down" class="ml-1" />
                </div>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-for="device in software.installedServers" :key="device.installId" :command="device">
                      <div class="device-item">
                        <span class="device-name">{{ device.sshName || device.serverName || "未命名设备" }}</span>
                        <el-tag size="small" :type="getDeviceStatusType(device.installStatus)">
                          {{ getDeviceStatusText(device.installStatus) }}
                        </el-tag>
                      </div>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
            <el-button type="primary" link class="ml-2" @click="handleManageDevices" title="设备管理">
              <IconifyIconOnline icon="ep:setting" />
            </el-button>
          </div>
        </div>
        <div class="app-tags">
          <el-tag size="small" type="success">v{{ software.softServiceVersion }}</el-tag>
          <el-tag size="small" type="primary" class="ml-2">{{ getCategoryName(software.softServiceCategory) }}</el-tag>
          <el-tag size="small" type="info" class="ml-2">{{ software.softServiceOs || "通用" }}</el-tag>
        </div>

        <div class="app-desc">{{ software.softServiceRemark || "无" }}</div>

        <div class="app-footer">
          <div class="app-stats">
            <span class="app-stat-item">
              <IconifyIconOnline icon="ep:download" class="mr-1" />
              <span>{{ software.installCount || 0 }}</span>
            </span>
            <span class="app-stat-item" @click.stop="handleFavorite">
              <IconifyIconOnline icon="ep:star" class="mr-1" />
              <span>{{ software.favoriteCount || 0 }}</span>
            </span>
          </div>
          <div class="app-actions">
            <el-button size="small" type="primary" class="install-btn" @click.stop="handleInstall">
              <IconifyIconOnline icon="ep:download" class="mr-1" />安装
            </el-button>
            <el-dropdown trigger="click" @command="handleCommand">
              <el-button size="small" class="more-btn">
                <IconifyIconOnline icon="ep:more-filled" />
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="detail">
                    <IconifyIconOnline icon="ri:info-card-line" class="mr-1" />详情
                  </el-dropdown-item>
                  <el-dropdown-item command="edit">
                    <IconifyIconOnline icon="ep:edit" class="mr-1" />编辑
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <IconifyIconOnline icon="ep:delete" class="mr-1" />删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import type { SoftService } from '@/api/soft';

const props = defineProps({
  software: {
    type: Object as () => SoftService,
    required: true
  }
});

const emit = defineEmits(['install', 'favorite', 'command', 'device-command', 'manage-devices']);

// 软件分类
const categories = [
  { label: "全部", value: "all" },
  { label: "数据库", value: "database" },
  { label: "Web服务器", value: "web_server" },
  { label: "开发工具", value: "development" },
  { label: "监控工具", value: "monitoring" },
  { label: "容器", value: "container" },
  { label: "其他", value: "other" },
];

// 获取分类名称
const getCategoryName = (category: string) => {
  if (!category) return "未分类";
  const found = categories.find((item) => item.value === category);
  return found ? found.label : "未知";
};

// 获取设备状态类型
const getDeviceStatusType = (status: number | string | undefined) => {
  if (status === undefined) return "info";

  // 转换为数字
  const statusNum = typeof status === "string" ? parseInt(status, 10) : status;

  switch (statusNum) {
    case 0:
      return "info"; // 未安装
    case 1:
      return "warning"; // 安装中
    case 2:
      return "success"; // 已安装
    case 3:
      return "danger"; // 安装失败
    default:
      return "info";
  }
};

// 获取设备状态文本
const getDeviceStatusText = (status: number | string | undefined) => {
  if (status === undefined) return "未安装";

  // 转换为数字
  const statusNum = typeof status === "string" ? parseInt(status, 10) : status;

  switch (statusNum) {
    case 0:
      return "未安装";
    case 1:
      return "安装中";
    case 2:
      return "已安装";
    case 3:
      return "安装失败";
    default:
      return "未知";
  }
};

// 处理安装
const handleInstall = () => {
  emit('install', props.software);
};

// 处理收藏
const handleFavorite = () => {
  emit('favorite', props.software);
};

// 处理命令
const handleCommand = (command: string) => {
  emit('command', command, props.software);
};

// 处理设备命令
const handleDeviceCommand = (device: any) => {
  emit('device-command', device, props.software);
};

// 处理设备管理
const handleManageDevices = () => {
  emit('manage-devices', props.software);
};
</script>

<style lang="scss" scoped>
.app-wrapper {
  height: 200px;
  border-radius: 8px;
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  overflow: hidden;
  transition: all 0.3s;
  position: relative;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    border-color: var(--el-color-primary);

    &::before {
      height: 4px;
    }
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 0;
    background-color: var(--el-color-primary);
    transition: height 0.3s ease;
    z-index: 1;
  }

  .media-content {
    display: flex;
    height: 100%;
  }

  .app-logo {
    width: 120px;
    height: 120px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin: 20px;
    flex-shrink: 0;

    .el-image {
      width: 100%;
      height: 100%;
      border-radius: 8px;
      overflow: hidden;
    }
  }

  .app-content {
    flex: 1;
    padding: 20px 20px 20px 0;
    display: flex;
    flex-direction: column;
  }

  .app-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
  }

  .app-servers {
    display: flex;
    align-items: center;

    .server-count {
      display: flex;
      align-items: center;
      padding: 2px 6px;
      background-color: #f5f7fa;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;

      &:hover {
        background-color: #e4e7ed;
      }
    }
  }

  .device-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;

    .device-name {
      margin-right: 8px;
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .app-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .app-desc {
    margin: 12px 0;
    font-size: 14px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
    flex: 1;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }

  .app-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;

    .app-stats {
      display: flex;
      gap: 16px;

      .app-stat-item {
        display: flex;
        align-items: center;
        color: var(--el-text-color-secondary);
        font-size: 13px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all 0.2s;

        &:hover {
          background-color: var(--el-fill-color-light);
          color: var(--el-color-primary);
        }
      }
    }

    .app-actions {
      display: flex;
      gap: 8px;

      .el-button {
        border-radius: 6px;
      }

      .install-btn {
        padding: 8px 16px;
        transition: all 0.3s;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
        }
      }

      .more-btn {
        padding: 8px;
        transition: all 0.3s;

        &:hover {
          background-color: var(--el-fill-color);
          color: var(--el-color-primary);
        }
      }
    }
  }
}

.app-logo-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  border-radius: 8px;

  .iconify {
    font-size: 24px;
  }
}
</style> 
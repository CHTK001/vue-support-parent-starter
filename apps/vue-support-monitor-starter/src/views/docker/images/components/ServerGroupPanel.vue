<template>
  <div class="server-group-panel">
    <!-- 左侧服务器卡片 -->
    <div class="server-sidebar">
      <div class="sidebar-header">
        <h3 class="sidebar-title">
          <IconifyIconOnline icon="ri:server-line" class="mr-2" />
          服务器列表
        </h3>
        <el-tooltip content="上一个">
          <el-button size="small" circle :disabled="!canScrollUp" @click="scrollUp">
            <IconifyIconOnline icon="ri:arrow-up-s-line" />
          </el-button>
        </el-tooltip>
        <el-tooltip content="下一个">
          <el-button size="small" circle :disabled="!canScrollDown" @click="scrollDown">
            <IconifyIconOnline icon="ri:arrow-down-s-line" />
          </el-button>
        </el-tooltip>
      </div>
      
      <div ref="serverListRef" class="server-list" @scroll="handleScroll">
        <div
          v-for="server in servers"
          :key="server.id"
          class="server-card"
          :class="{ active: selectedServerId === server.id }"
          @click="selectServer(server.id)"
        >
          <div class="server-card-header">
            <IconifyIconOnline icon="ri:server-fill" class="server-icon" />
            <div class="server-info">
              <div class="server-name">{{ server.name }}</div>
              <div class="server-meta">{{ server.ip }}</div>
            </div>
          </div>
          <div class="server-card-footer">
            <el-tag size="small" type="info">
              {{ server.imageCount || 0 }} 个镜像
            </el-tag>
            <el-tag
              size="small"
              :type="server.status === 'online' ? 'success' : 'danger'"
            >
              {{ server.status === 'online' ? '在线' : '离线' }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧镜像列表 -->
    <div class="image-content">
      <div class="content-header">
        <div class="header-left">
          <h3 class="content-title">
            <IconifyIconOnline icon="ri:image-line" class="mr-2" />
            {{ currentServer?.name || '选择服务器' }}
          </h3>
          <el-tag v-if="currentServer" size="small" type="info" class="ml-2">
            {{ filteredImages.length }} 个镜像
          </el-tag>
        </div>
        <div class="header-right">
          <el-input
            v-model="filterKeyword"
            placeholder="搜索镜像..."
            clearable
            class="filter-input"
            @input="handleFilter"
          >
            <template #prefix>
              <IconifyIconOnline icon="ri:search-line" />
            </template>
          </el-input>
          <el-select
            v-model="filterStatus"
            placeholder="状态"
            clearable
            class="filter-select"
            @change="handleFilter"
          >
            <el-option label="全部" :value="undefined" />
            <el-option label="可用" value="AVAILABLE" />
            <el-option label="拉取中" value="PULLING" />
            <el-option label="错误" value="PULL_FAILED" />
          </el-select>
        </div>
      </div>

      <el-scrollbar class="image-scroll">
        <div v-if="!selectedServerId" class="empty-state">
          <IconifyIconOnline icon="ri:server-line" class="empty-icon" />
          <p class="empty-text">请选择一个服务器查看镜像</p>
        </div>
        
        <div v-else-if="filteredImages.length === 0" class="empty-state">
          <IconifyIconOnline icon="ri:image-line" class="empty-icon" />
          <p class="empty-text">{{ filterKeyword || filterStatus ? '没有符合条件的镜像' : '该服务器暂无镜像' }}</p>
        </div>

        <div v-else class="image-grid">
          <div
            v-for="image in filteredImages"
            :key="image.systemSoftImageId"
            class="image-card"
          >
            <div class="image-card-header">
              <div class="image-name-tag">
                <div class="image-name">{{ image.systemSoftImageName }}</div>
                <el-tag size="small" type="primary" effect="plain">
                  {{ image.systemSoftImageTag }}
                </el-tag>
              </div>
              <el-tag :type="getStatusTagType(image.systemSoftImageStatus)" size="small">
                {{ getStatusText(image.systemSoftImageStatus) }}
              </el-tag>
            </div>
            
            <div class="image-card-body">
              <div class="image-meta">
                <span class="meta-label">大小：</span>
                <span>{{ formatSize(image.systemSoftImageSize) }}</span>
              </div>
              <div class="image-meta">
                <span class="meta-label">ID：</span>
                <span class="image-id">{{ (image.systemSoftImageImageId || '').substring(0, 12) }}</span>
              </div>
              <div class="image-meta">
                <span class="meta-label">拉取时间：</span>
                <span>{{ formatDate(image.systemSoftImageLastPulled) }}</span>
              </div>
            </div>

            <div class="image-card-footer">
              <el-button
                size="small"
                type="primary"
                @click="emit('install', image)"
              >
                <IconifyIconOnline icon="ri:play-circle-line" class="mr-1" />
                安装容器
              </el-button>
              <el-button
                size="small"
                @click="emit('viewHistory', image)"
              >
                <IconifyIconOnline icon="ri:history-line" class="mr-1" />
                历史记录
              </el-button>
              <el-dropdown trigger="click" @command="(cmd) => handleAction(cmd, image)">
                <el-button size="small">
                  <IconifyIconOnline icon="ri:more-2-fill" />
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="export">
                      <IconifyIconOnline icon="ri:download-2-line" class="mr-1" />
                      导出镜像
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided>
                      <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1" />
                      删除镜像
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import type { SystemSoftImage } from '@/api/docker-management';

interface Server {
  id: number;
  name: string;
  ip: string;
  status: 'online' | 'offline';
  imageCount?: number;
}

interface Props {
  servers: Server[];
  images: SystemSoftImage[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  install: [image: SystemSoftImage];
  viewHistory: [image: SystemSoftImage];
  export: [image: SystemSoftImage];
  delete: [image: SystemSoftImage];
}>();

const serverListRef = ref<HTMLElement>();
const selectedServerId = ref<number>();
const filterKeyword = ref('');
const filterStatus = ref<string>();

const canScrollUp = ref(false);
const canScrollDown = ref(false);

// 当前选中的服务器
const currentServer = computed(() => {
  return props.servers.find(s => s.id === selectedServerId.value);
});

// 当前服务器的镜像
const currentServerImages = computed(() => {
  if (!selectedServerId.value) return [];
  return props.images.filter(img => img.systemSoftImageServerId === selectedServerId.value);
});

// 过滤后的镜像
const filteredImages = computed(() => {
  let result = currentServerImages.value;
  
  if (filterKeyword.value) {
    const keyword = filterKeyword.value.toLowerCase();
    result = result.filter(img =>
      img.systemSoftImageName?.toLowerCase().includes(keyword) ||
      img.systemSoftImageTag?.toLowerCase().includes(keyword)
    );
  }
  
  if (filterStatus.value) {
    result = result.filter(img => img.systemSoftImageStatus === filterStatus.value);
  }
  
  return result;
});

// 选择服务器
function selectServer(serverId: number) {
  selectedServerId.value = serverId;
  // 清空过滤条件
  filterKeyword.value = '';
  filterStatus.value = undefined;
}

// 处理滚动
function handleScroll() {
  if (!serverListRef.value) return;
  
  const el = serverListRef.value;
  canScrollUp.value = el.scrollTop > 0;
  canScrollDown.value = el.scrollTop < el.scrollHeight - el.clientHeight - 1;
}

// 向上滚动
function scrollUp() {
  if (!serverListRef.value) return;
  serverListRef.value.scrollBy({ top: -200, behavior: 'smooth' });
}

// 向下滚动
function scrollDown() {
  if (!serverListRef.value) return;
  serverListRef.value.scrollBy({ top: 200, behavior: 'smooth' });
}

// 处理操作
function handleAction(command: string, image: SystemSoftImage) {
  if (command === 'export') {
    emit('export', image);
  } else if (command === 'delete') {
    emit('delete', image);
  }
}

// 过滤处理
function handleFilter() {
  // 过滤逻辑已在computed中处理
}

// 格式化大小
function formatSize(bytes: number | undefined): string {
  if (!bytes) return '-';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// 格式化日期
function formatDate(date: string | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 获取状态标签类型
function getStatusTagType(status: string | undefined): 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'AVAILABLE': return 'success';
    case 'PULLING': return 'warning';
    case 'PULL_FAILED': return 'danger';
    default: return 'info';
  }
}

// 获取状态文本
function getStatusText(status: string | undefined): string {
  switch (status) {
    case 'AVAILABLE': return '可用';
    case 'PULLING': return '拉取中';
    case 'PULL_FAILED': return '拉取失败';
    default: return '未知';
  }
}

// 监听服务器列表变化，初始化滚动状态
watch(() => props.servers, () => {
  nextTick(() => {
    handleScroll();
  });
}, { immediate: true });
</script>

<style scoped>
.server-group-panel {
  display: flex;
  gap: 16px;
  height: calc(100vh - 240px);
  min-height: 600px;
}

/* 左侧服务器边栏 */
.server-sidebar {
  width: 280px;
  flex-shrink: 0;
  background: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: var(--el-box-shadow-light);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  gap: 8px;
}

.sidebar-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  flex: 1;
}

.server-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.server-card {
  padding: 12px;
  border: 2px solid var(--el-border-color-lighter);
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.server-card:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.server-card.active {
  border-color: var(--el-color-primary);
  background: linear-gradient(135deg, rgba(99,102,241,0.05), rgba(14,165,233,0.05));
}

.server-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.server-icon {
  font-size: 24px;
  color: var(--el-color-primary);
}

.server-info {
  flex: 1;
}

.server-name {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 2px;
}

.server-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.server-card-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-start;
}

/* 右侧内容区域 */
.image-content {
  flex: 1;
  background: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: var(--el-box-shadow-light);
  display: flex;
  flex-direction: column;
}

.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.header-left {
  display: flex;
  align-items: center;
}

.content-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.header-right {
  display: flex;
  gap: 8px;
}

.filter-input {
  width: 200px;
}

.filter-select {
  width: 120px;
}

.image-scroll {
  flex: 1;
  height: 100%;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-secondary);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  padding: 16px;
}

.image-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 12px;
  transition: all 0.2s;
  background: var(--el-bg-color);
}

.image-card:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.image-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.image-name-tag {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.image-name {
  font-weight: 600;
  font-size: 14px;
  word-break: break-all;
}

.image-card-body {
  margin-bottom: 12px;
}

.image-meta {
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin-bottom: 4px;
}

.meta-label {
  color: var(--el-text-color-secondary);
}

.image-id {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
}

.image-card-footer {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>


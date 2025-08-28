<template>
  <div class="email-sidebar">
    <div class="sidebar-section">
      <h3 class="section-title">邮箱</h3>
      <div class="folder-list">
        <div 
          v-for="folder in folders" 
          :key="folder.key" 
          :class="['folder-item', { active: activeFolder === folder.key }]" 
          @click="selectFolder(folder.key)"
        >
          <IconifyIconOnline :icon="folder.icon" class="folder-icon" />
          <span class="folder-name">{{ folder.name }}</span>
          <span v-if="folder.count > 0" class="folder-count">{{ folder.count }}</span>
        </div>
      </div>
    </div>

    <div class="sidebar-section">
      <h3 class="section-title">标签</h3>
      <div class="tag-list">
        <div 
          v-for="tag in tags" 
          :key="tag.key" 
          :class="['tag-item', { active: activeTag === tag.key }]" 
          @click="selectTag(tag.key)"
        >
          <div :class="['tag-color', tag.color]"></div>
          <span class="tag-name">{{ tag.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// 定义接口
interface Folder {
  key: string;
  name: string;
  icon: string;
  count: number;
}

interface Tag {
  key: string;
  name: string;
  color: string;
}

// 定义props
const props = defineProps<{
  folders: Folder[];
  tags: Tag[];
  activeFolder: string;
  activeTag: string;
}>();

// 定义事件
const emit = defineEmits<{
  'folder-select': [folderKey: string];
  'tag-select': [tagKey: string];
}>();

// 方法
function selectFolder(folderKey: string) {
  emit('folder-select', folderKey);
}

function selectTag(tagKey: string) {
  emit('tag-select', tagKey);
}
</script>

<style scoped>
.email-sidebar {
  width: 240px;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  padding: 16px 0;
  overflow-y: auto;
}

.sidebar-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  margin: 0 0 12px 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.folder-list,
.tag-list {
  padding: 0 8px;
}

.folder-item,
.tag-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin: 2px 0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.folder-item:hover,
.tag-item:hover {
  background: #f0f9ff;
}

.folder-item.active,
.tag-item.active {
  background: #409eff;
  color: #fff;
}

.folder-icon {
  font-size: 16px;
  margin-right: 8px;
  color: #909399;
}

.folder-item.active .folder-icon {
  color: #fff;
}

.folder-name,
.tag-name {
  flex: 1;
}

.folder-count {
  background: #f56c6c;
  color: #fff;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.folder-item.active .folder-count {
  background: rgba(255, 255, 255, 0.3);
}

.tag-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
}

.tag-color.red {
  background: #f56c6c;
}
.tag-color.blue {
  background: #409eff;
}
.tag-color.green {
  background: #67c23a;
}
.tag-color.orange {
  background: #e6a23c;
}

/* 滚动条样式 */
.email-sidebar::-webkit-scrollbar {
  width: 6px;
}

.email-sidebar::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.email-sidebar::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.email-sidebar::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>
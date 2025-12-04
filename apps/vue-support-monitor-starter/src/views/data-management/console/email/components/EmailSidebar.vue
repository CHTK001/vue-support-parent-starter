<template>
  <div class="email-sidebar">
    <div class="sidebar-section">
      <h3 class="section-title">邮箱</h3>
      <div class="folder-list">
        <div v-if="isLoading" class="loading-placeholder">
          <el-skeleton :rows="3" animated />
        </div>
        <div 
          v-else
          v-for="folder in localFolders" 
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
        <div v-if="isLoading" class="loading-placeholder">
          <el-skeleton :rows="2" animated />
        </div>
        <div 
          v-else
          v-for="tag in localTags" 
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
import { ref, onMounted, watch } from 'vue';
import { indexedDBProxy } from '@repo/utils';

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

interface MenuData {
  folders: Folder[];
  tags: Tag[];
  lastUpdated: number;
}

// 定义props
const props = defineProps<{
  folders: Folder[];
  tags: Tag[];
  activeFolder: string;
  activeTag: string;
  settingId: number;
}>();

// 定义事件
const emit = defineEmits<{
  'folder-select': [folderKey: string];
  'tag-select': [tagKey: string];
  'menu-loaded': [menuData: MenuData];
}>();

// 本地状�?
const localFolders = ref<Folder[]>([]);
const localTags = ref<Tag[]>([]);
const isLoading = ref(true);

// IndexedDB存储�?
const getMenuKey = (settingId: number) => `email_menu_${settingId}`;

// 从IndexedDB加载菜单数据
async function loadMenuFromDB() {
  try {
    const menuKey = getMenuKey(props.settingId);
    const cachedMenu: MenuData | null = await indexedDBProxy().getItem(menuKey);
    
    if (cachedMenu && cachedMenu.folders && cachedMenu.tags) {
      console.log('[EmailSidebar] 从IndexedDB加载菜单数据', {
        settingId: props.settingId,
        foldersCount: cachedMenu.folders.length,
        tagsCount: cachedMenu.tags.length,
        lastUpdated: new Date(cachedMenu.lastUpdated).toISOString()
      });
      
      localFolders.value = cachedMenu.folders;
      localTags.value = cachedMenu.tags;
      
      // 通知父组件菜单已加载
      emit('menu-loaded', cachedMenu);
      return true;
    }
  } catch (error) {
    console.error('[EmailSidebar] 从IndexedDB加载菜单数据失败:', error);
  }
  return false;
}

// 保存菜单数据到IndexedDB
async function saveMenuToDB(folders: Folder[], tags: Tag[]) {
  try {
    const menuKey = getMenuKey(props.settingId);
    // 深度克隆数据，确保移除Vue响应式代�?
    const menuData: MenuData = {
      folders: JSON.parse(JSON.stringify(folders)),
      tags: JSON.parse(JSON.stringify(tags)),
      lastUpdated: Date.now()
    };
    
    await indexedDBProxy().setItem(menuKey, menuData);
    console.log('[EmailSidebar] 菜单数据已保存到IndexedDB', {
      settingId: props.settingId,
      foldersCount: folders.length,
      tagsCount: tags.length
    });
  } catch (error) {
    console.error('[EmailSidebar] 保存菜单数据到IndexedDB失败:', error);
  }
}

// 清空IndexedDB中的菜单数据
async function clearMenuFromDB(settingId: number) {
  try {
    const menuKey = getMenuKey(settingId);
    await indexedDBProxy().removeItem(menuKey);
    console.log('[EmailSidebar] 已清空IndexedDB中的菜单数据', { settingId });
  } catch (error) {
    console.error('[EmailSidebar] 清空IndexedDB菜单数据失败:', error);
  }
}

// 监听props变化，更新本地数据并保存到IndexedDB
watch(
  () => [props.folders, props.tags],
  ([newFolders, newTags]) => {
    if (newFolders && newFolders.length > 0) {
      localFolders.value = newFolders;
      saveMenuToDB(newFolders, newTags || []);
    }
    if (newTags && newTags.length > 0) {
      localTags.value = newTags;
      saveMenuToDB(localFolders.value, newTags);
    }
  },
  { deep: true }
);

// 组件挂载时加载数�?
onMounted(async () => {
  isLoading.value = true;
  
  // 先尝试从IndexedDB加载
  const loaded = await loadMenuFromDB();
  
  // 如果IndexedDB中没有数据，使用props中的数据
  if (!loaded) {
    localFolders.value = props.folders || [];
    localTags.value = props.tags || [];
    
    // 如果props有数据，保存到IndexedDB
    if (props.folders && props.folders.length > 0) {
      await saveMenuToDB(props.folders, props.tags || []);
    }
  }
  
  isLoading.value = false;
});

// 方法
function selectFolder(folderKey: string) {
  emit('folder-select', folderKey);
}

function selectTag(tagKey: string) {
  emit('tag-select', tagKey);
}

// 暴露清空方法给父组件
defineExpose({
  clearMenuFromDB: () => clearMenuFromDB(props.settingId)
});
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
  background: var(--el-bg-color-overlay);
  color: #fff;
}

.folder-icon {
  font-size: 16px;
  margin-right: 8px;
   color: var(--el-text-color);
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
  background: var(--el-bg-color-overlay);
}
.tag-color.green {
  background: #67c23a;
}
.tag-color.orange {
  background: #e6a23c;
}

/* 滚动条样�?*/
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

/* 加载占位符样�?*/
.loading-placeholder {
  padding: 8px 12px;
  margin: 2px 0;
}
</style>
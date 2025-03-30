<template>
  <div class="email-sidebar">
    <div class="email-sidebar__search">
      <el-input
        v-model="searchQuery"
        placeholder="搜索邮件..."
        prefix-icon="el-icon-search"
        clearable
        @input="$emit('search', searchQuery)"
      />
    </div>
    
    <div class="email-sidebar__folders">
      <div
        v-for="folder in folders"
        :key="folder.id"
        class="email-sidebar__folder"
        :class="{ 'email-sidebar__folder--active': activeFolder === folder.id }"
        @click="$emit('folder-change', folder.id)"
      >
        <div class="email-sidebar__folder-icon">
          <el-icon>
            <IconifyIconOffline :icon="folder.icon" />
          </el-icon>
        </div>
        <div class="email-sidebar__folder-name">{{ folder.name }}</div>
        <div v-if="folder.count > 0" class="email-sidebar__folder-count">
          {{ folder.count }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { IconifyIconOffline } from '@repo/components/ReIcon';

defineProps({
  folders: {
    type: Array,
    required: true
  },
  activeFolder: {
    type: String,
    required: true
  }
});

defineEmits(['folder-change', 'search']);

const searchQuery = ref('');
</script>

<style lang="scss" scoped>
.email-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  &__search {
    padding: 16px;
    border-bottom: 1px solid #ebeef5;
  }
  
  &__folders {
    flex: 1;
    overflow-y: auto;
    padding: 10px 0;
  }
  
  &__folder {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    cursor: pointer;
    transition: background-color 0.3s;
    border-radius: 4px;
    margin: 0 8px 4px 8px;
    
    &:hover {
      background-color: #f0f2f5;
    }
    
    &--active {
      background-color: #ecf5ff;
      color: var(--el-color-primary);
      font-weight: 500;
    }
    
    &-icon {
      margin-right: 12px;
      font-size: 18px;
      display: flex;
      align-items: center;
    }
    
    &-name {
      flex: 1;
    }
    
    &-count {
      background-color: var(--el-color-primary);
      color: white;
      border-radius: 10px;
      padding: 0 8px;
      font-size: 12px;
      min-width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}
</style>
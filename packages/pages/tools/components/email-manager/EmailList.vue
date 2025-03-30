<template>
  <div class="email-list">
    <div class="email-list__toolbar">
      <div class="email-list__search">
        <el-input
          v-model="localSearchQuery"
          placeholder="搜索邮件..."
          prefix-icon="el-icon-search"
          clearable
          @input="$emit('update:searchQuery', localSearchQuery)"
        />
      </div>
      <div class="email-list__actions">
        <el-button-group>
          <el-button :icon="useRenderIcon('ri:refresh-line')" @click="$emit('refresh')" title="刷新" />
          <el-button :icon="useRenderIcon('ri:delete-bin-line')" @click="$emit('delete-selected')" title="删除" :disabled="!hasSelected" />
        </el-button-group>
      </div>
    </div>
    
    <el-table
      v-loading="loading"
      :data="emails"
      style="width: 100%"
      @row-click="handleRowClick"
      row-key="id"
      :row-class-name="getRowClass"
    >
      <el-table-column type="selection" width="55" />
      
      <el-table-column width="40">
        <template #default="{ row }">
          <el-button
            type="text"
            :icon="useRenderIcon(row.starred ? 'ri:star-fill' : 'ri:star-line')"
            @click.stop="$emit('star-email', row)"
            :style="{ color: row.starred ? '#f7ba2a' : '' }"
          />
        </template>
      </el-table-column>
      
      <el-table-column label="发件人" min-width="180">
        <template #default="{ row }">
          <div class="email-list__sender">
            <span :class="{ 'email-list__sender--unread': !row.read }">{{ row.from }}</span>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column label="主题" min-width="300">
        <template #default="{ row }">
          <div class="email-list__subject">
            <span :class="{ 'email-list__subject--unread': !row.read }">{{ row.subject }}</span>
            <div class="email-list__preview">{{ getPreview(row.content) }}</div>
          </div>
        </template>
      </el-table-column>
      
      <el-table-column label="日期" width="160">
        <template #default="{ row }">
          <span>{{ formatDate(row.date) }}</span>
        </template>
      </el-table-column>
      
      <el-table-column width="100">
        <template #default="{ row }">
          <div class="email-list__actions">
            <el-button
              type="text"
              :icon="useRenderIcon('ri:delete-bin-line')"
              @click.stop="$emit('delete-email', row)"
              title="删除"
            />
            <el-button
              type="text"
              :icon="useRenderIcon('ri:mail-open-line')"
              @click.stop="$emit('view-email', row)"
              title="查看"
            />
          </div>
        </template>
      </el-table-column>
    </el-table>
    
    <div v-if="emails.length === 0 && !loading" class="email-list__empty">
      <el-empty description="没有邮件" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";

const props = defineProps({
  emails: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  searchQuery: {
    type: String,
    default: ''
  }
});

const emit = defineEmits([
  'view-email',
  'delete-email',
  'star-email',
  'refresh',
  'delete-selected',
  'update:searchQuery'
]);

const localSearchQuery = ref(props.searchQuery);

const hasSelected = computed(() => false); // 这里需要实现选择逻辑

// 处理行点击
const handleRowClick = (row) => {
  emit('view-email', row);
};

// 获取行的类名
const getRowClass = ({ row }) => {
  return {
    'email-list__row--unread': !row.read,
    'email-list__row--starred': row.starred
  };
};

// 获取邮件预览内容
const getPreview = (content) => {
  if (!content) return '';
  // 移除HTML标签
  const plainText = content.replace(/<[^>]*>/g, '');
  return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
};

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  
  // 今天的邮件显示时间
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  
  // 今年的邮件显示月日
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  }
  
  // 往年的邮件显示年月日
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
};
</script>

<style lang="scss" scoped>
.email-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  &__toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  
  &__search {
    width: 300px;
  }
  
  &__sender, &__subject {
    &--unread {
      font-weight: 600;
    }
  }
  
  &__preview {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  &__actions {
    display: flex;
    justify-content: flex-end;
  }
  
  &__empty {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 300px;
  }
  
  :deep(.el-table) {
    flex: 1;
    
    .email-list__row--unread {
      background-color: #f8f9fa;
    }
    
    .email-list__row--starred {
      td {
        border-left: 3px solid #f7ba2a;
      }
    }
    
    .el-table__row {
      cursor: pointer;
      
      &:hover {
        background-color: #f5f7fa;
      }
    }
  }
}
</style>
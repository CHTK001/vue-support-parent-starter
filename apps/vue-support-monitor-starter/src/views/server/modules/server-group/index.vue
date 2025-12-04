<template>
  <div class="server-group-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">
          <IconifyIconOnline icon="ri:folder-line" class="mr-2" />
          服务器组管理
          <el-tooltip
            :content="`当前共有 ${totalCount} 个分组`"
            placement="bottom"
            :show-after="500"
          >
            <el-tag type="info" effect="plain" class="group-count">
              �?
              <span class="count-num">{{ totalCount }}</span>
              �?
            </el-tag>
          </el-tooltip>
        </h2>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleAdd" :icon="Plus">
          新增分组
        </el-button>
        <el-button @click="handleRefresh" :icon="Refresh" :loading="loading">
          刷新
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛�?-->
    <div class="filter-bar">
      <div class="filter-left">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索分组名称"
          clearable
          style="width: 300px"
          :prefix-icon="Search"
          @input="handleSearch"
        />
      </div>
      <div class="filter-right">
        <el-select
          v-model="filterStatus"
          placeholder="状态筛�?
          clearable
          style="width: 120px"
          @change="handleFilter"
        >
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </div>
    </div>

    <!-- 分组列表 -->
    <div class="group-content" v-loading="loading">
      <el-empty v-if="filteredGroups.length === 0" description="暂无分组数据" />
      <div v-else class="group-grid">
        <div
          v-for="group in filteredGroups"
          :key="group.monitorSysGenServerGroupId"
          class="group-card"
          :class="{ 'is-default': group.monitorSysGenServerGroupIsDefault === 1 }"
        >
          <div class="card-header">
            <div class="group-info">
              <IconifyIconOnline
                :icon="group.monitorSysGenServerGroupIcon || 'ri:folder-line'"
                :style="{ color: group.monitorSysGenServerGroupColor || '#409eff' }"
                class="group-icon"
              />
              <div class="group-details">
                <div class="group-name">{{ group.monitorSysGenServerGroupName }}</div>
                <div class="group-desc">{{ group.monitorSysGenServerGroupDesc || '暂无描述' }}</div>
              </div>
            </div>
            <div class="group-badges">
              <el-tag
                v-if="group.monitorSysGenServerGroupIsDefault === 1"
                type="primary"
                size="small"
                effect="light"
                class="default-badge"
              >
                <IconifyIconOnline icon="ri:star-fill" class="mr-1" />
                默认
              </el-tag>
              <el-tag
                :type="group.monitorSysGenServerGroupStatus === 1 ? 'success' : 'danger'"
                size="small"
                effect="light"
              >
                {{ group.monitorSysGenServerGroupStatus === 1 ? '启用' : '禁用' }}
              </el-tag>
            </div>
          </div>
          
          <div class="card-content">
            <div class="group-stats">
              <div class="stat-item">
                <IconifyIconOnline icon="ri:server-line" class="stat-icon" />
                <span class="stat-label">服务�?</span>
                <span class="stat-value">{{ group.serverCount || 0 }}</span>
              </div>
              <div class="stat-item">
                <IconifyIconOnline icon="ri:sort-asc" class="stat-icon" />
                <span class="stat-label">排序:</span>
                <span class="stat-value">{{ group.monitorSysGenServerGroupSort || 0 }}</span>
              </div>
              <div class="stat-item">
                <IconifyIconOnline icon="ri:time-line" class="stat-icon" />
                <span class="stat-label">创建:</span>
                <span class="stat-value">{{ formatTime(group.createTime) }}</span>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <el-button-group class="action-group">
              <el-button size="small" @click="handleEdit(group)" :icon="Edit">
                编辑
              </el-button>
              <el-button
                v-if="group.monitorSysGenServerGroupIsDefault !== 1"
                size="small"
                type="primary"
                @click="handleSetDefault(group)"
                :icon="Star"
              >
                设为默认
              </el-button>
              <el-button
                size="small"
                :type="group.monitorSysGenServerGroupStatus === 1 ? 'warning' : 'success'"
                @click="handleToggleStatus(group)"
              >
                <IconifyIconOnline 
                  :icon="group.monitorSysGenServerGroupStatus === 1 ? 'ri:eye-off-line' : 'ri:eye-line'" 
                  class="mr-1" 
                />
                {{ group.monitorSysGenServerGroupStatus === 1 ? '禁用' : '启用' }}
              </el-button>
              <el-button
                v-if="group.monitorSysGenServerGroupIsDefault !== 1 && (group.serverCount || 0) === 0"
                size="small"
                type="danger"
                @click="handleDelete(group)"
                :icon="Delete"
              >
                删除
              </el-button>
            </el-button-group>
          </div>
        </div>
      </div>
    </div>

    <!-- 分组编辑对话�?-->
    <ServerGroupEditDialog ref="editDialogRef" @success="handleRefresh" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { message } from '@repo/utils';
import { Plus, Refresh, Search, Edit, Star, Delete } from '@element-plus/icons-vue';
import {
  type ServerGroup,
  getAllServerGroups,
  setDefaultGroup,
  toggleGroupStatus,
  deleteServerGroup,
  getGroupServerCount
} from '@/api/server/group';
import ServerGroupEditDialog from './components/ServerGroupEditDialog.vue';

// 响应式状�?
const loading = ref(false);
const searchKeyword = ref('');
const filterStatus = ref<number | undefined>();
const groups = ref<ServerGroup[]>([]);
const editDialogRef = ref();

// 计算属�?
const totalCount = computed(() => groups.value.length);

const filteredGroups = computed(() => {
  let result = groups.value;
  
  // 按名称搜�?
  if (searchKeyword.value) {
    result = result.filter(group =>
      group.monitorSysGenServerGroupName?.toLowerCase().includes(searchKeyword.value.toLowerCase())
    );
  }
  
  // 按状态筛�?
  if (filterStatus.value !== undefined) {
    result = result.filter(group => group.monitorSysGenServerGroupStatus === filterStatus.value);
  }
  
  // 按排序号和创建时间排�?
  return result.sort((a, b) => {
    const sortA = a.monitorSysGenServerGroupSort || 0;
    const sortB = b.monitorSysGenServerGroupSort || 0;
    if (sortA !== sortB) {
      return sortA - sortB;
    }
    return new Date(b.createTime || '').getTime() - new Date(a.createTime || '').getTime();
  });
});

/**
 * 加载分组列表
 */
const loadGroups = async () => {
  try {
    loading.value = true;
    const result = await getAllServerGroups();
    if (result.success && result.data) {
      groups.value = result.data;
      
      // 加载每个分组的服务器数量
      for (const group of groups.value) {
        if (group.monitorSysGenServerGroupId) {
          try {
            const countResult = await getGroupServerCount(group.monitorSysGenServerGroupId);
            if (countResult.success) {
              group.serverCount = countResult.data;
            }
          } catch (error) {
            console.error('获取分组服务器数量失�?', error);
          }
        }
      }
    }
  } catch (error) {
    console.error('加载分组列表失败:', error);
    message.error('加载分组列表失败');
  } finally {
    loading.value = false;
  }
};

/**
 * 刷新列表
 */
const handleRefresh = () => {
  loadGroups();
};

/**
 * 搜索
 */
const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
};

/**
 * 筛�?
 */
const handleFilter = () => {
  // 筛选逻辑已在计算属性中处理
};

/**
 * 新增分组
 */
const handleAdd = () => {
  editDialogRef.value?.open('add');
};

/**
 * 编辑分组
 */
const handleEdit = (group: ServerGroup) => {
  editDialogRef.value?.open('edit', group);
};

/**
 * 设为默认分组
 */
const handleSetDefault = async (group: ServerGroup) => {
  try {
    if (!group.monitorSysGenServerGroupId) return;
    
    const result = await setDefaultGroup(group.monitorSysGenServerGroupId);
    if (result.success) {
      message.success('设置默认分组成功');
      loadGroups();
    } else {
      message.error(result.message || '设置默认分组失败');
    }
  } catch (error) {
    console.error('设置默认分组失败:', error);
    message.error('设置默认分组失败');
  }
};

/**
 * 切换分组状�?
 */
const handleToggleStatus = async (group: ServerGroup) => {
  try {
    if (!group.monitorSysGenServerGroupId) return;
    
    const newStatus = group.monitorSysGenServerGroupStatus === 1 ? 0 : 1;
    const result = await toggleGroupStatus(group.monitorSysGenServerGroupId, newStatus);
    if (result.success) {
      message.success(`${newStatus === 1 ? '启用' : '禁用'}分组成功`);
      loadGroups();
    } else {
      message.error(result.message || '操作失败');
    }
  } catch (error) {
    console.error('切换分组状态失�?', error);
    message.error('操作失败');
  }
};

/**
 * 删除分组
 */
const handleDelete = async (group: ServerGroup) => {
  try {
    if (!group.monitorSysGenServerGroupId) return;
    
    await ElMessageBox.confirm(
      `确定要删除分�?"${group.monitorSysGenServerGroupName}" 吗？`,
      '确认删除',
      {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }
    );
    
    const result = await deleteServerGroup(group.monitorSysGenServerGroupId);
    if (result.success) {
      message.success('删除分组成功');
      loadGroups();
    } else {
      message.error(result.message || '删除分组失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除分组失败:', error);
      message.error('删除分组失败');
    }
  }
};

/**
 * 格式化时�?
 */
const formatTime = (time: string | undefined) => {
  if (!time) return '-';
  return new Date(time).toLocaleDateString('zh-CN');
};

// 生命周期
onMounted(() => {
  loadGroups();
});
</script>

<style lang="scss" scoped>
.server-group-container {
  padding: 20px;
  background: var(--el-bg-color-page);
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px;
  background: var(--el-bg-color-overlay);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .header-left {
    .page-title {
      display: flex;
      align-items: center;
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: var(--el-text-color-primary);

      .group-count {
        margin-left: 16px;
        font-size: 14px;
        font-weight: 500;

        .count-num {
          font-weight: 700;
          color: var(--el-color-primary);
        }
      }
    }
  }

  .header-right {
    display: flex;
    gap: 12px;
  }
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 20px;
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);

  .filter-right {
    display: flex;
    gap: 12px;
  }
}

.group-content {
  min-height: 400px;
}

.group-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.group-card {
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    border-color: var(--el-color-primary);
    box-shadow: 0 8px 24px rgba(64, 158, 255, 0.15);
    transform: translateY(-2px);
  }

  &.is-default {
    border-color: var(--el-color-primary);
    background: linear-gradient(135deg, rgba(64, 158, 255, 0.05) 0%, rgba(64, 158, 255, 0.02) 100%);

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;

    .group-info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-width: 0;

      .group-icon {
        font-size: 28px;
        flex-shrink: 0;
      }

      .group-details {
        flex: 1;
        min-width: 0;

        .group-name {
          font-size: 18px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          margin-bottom: 4px;
          word-break: break-all;
        }

        .group-desc {
          font-size: 13px;
          color: var(--el-text-color-secondary);
          word-break: break-all;
          line-height: 1.4;
        }
      }
    }

    .group-badges {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex-shrink: 0;

      .default-badge {
        background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
        border: none;
        color: var(--el-text-color-primary);
      }
    }
  }

  .card-content {
    margin-bottom: 20px;

    .group-stats {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 0;

        .stat-icon {
          font-size: 14px;
          color: var(--el-color-primary);
          width: 16px;
        }

        .stat-label {
          font-size: 13px;
          color: var(--el-text-color-secondary);
          min-width: 40px;
        }

        .stat-value {
          font-size: 13px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }
      }
    }
  }

  .card-footer {
    border-top: 1px solid var(--el-border-color-lighter);
    padding-top: 16px;

    .action-group {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      width: 100%;

      :deep(.el-button) {
        margin: 0;
        flex: 1;
        min-width: 80px;
        font-size: 12px;
      }
    }
  }
}
</style>

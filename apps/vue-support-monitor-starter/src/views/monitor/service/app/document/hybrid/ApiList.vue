<template>
  <div class="api-list-column" :class="{ 'minimized': isMinimized }">
    <div class="column-header">
      <div class="header-top">
        <h3 class="column-title">API 接口列表</h3>
        <div class="minimize-button" @click="toggleMinimize" title="最小化/展开">
          <IconifyIconOnline :icon="isMinimized ? 'mdi:chevron-right' : 'mdi:chevron-left'" />
        </div>
      </div>
      <div class="search-wrapper">
        <el-input v-model="searchQuery" placeholder="搜索 API..." clearable prefix-icon="Search"
          @input="handleSearchChange" />
      </div>
      <div class="api-list-settings">
        <el-tooltip content="是否单展开分类" placement="top">
          <el-switch v-model="singleExpand" @change="saveSettings" size="small" active-text="单展开" inactive-text=""
            style="margin-right: 16px;" />
        </el-tooltip>
        <el-tooltip content="是否显示接口" placement="top">
          <el-switch v-model="showApiDescription" @change="saveSettings" size="small" active-text="显示接口"
            inactive-text="" />
        </el-tooltip>
      </div>
    </div>
    <div class="api-list-container">
      <!-- 空状态提示 -->
      <div v-if="!filteredCategories || filteredCategories.length === 0" class="empty-api-state">
        <el-empty description="暂无API数据" :image-size="80">
          <template #description>
            <p>暂未找到API接口数据</p>
            <p class="empty-tip">请检查服务连接或选择其他服务</p>
          </template>
        </el-empty>
      </div>

      <!-- 显示分类标题 -->
      <div v-else v-for="category in filteredCategories" :key="category.id" class="api-category">
        <div class="category-header" @click="toggleCategory(category.id)">
          <span class="category-name">
            <span class="toggle-icon">
              <IconifyIconOnline :icon="expandedCategories[category.id] ? 'mdi:chevron-down' : 'mdi:chevron-right'" />
            </span>
            {{ category.name }}
          </span>
          <el-tag size="small" type="success" effect="plain" class="category-count">
            {{ category.apis?.length || 0 }}
          </el-tag>
        </div>

        <!-- 显示分类下的API列表 -->
        <div v-if="expandedCategories[category.id]" class="api-items">
          <div v-for="api in category.apis" :key="api.id" class="api-item" :class="{ active: selectedApiId === api.id }"
            @click="handleApiClick(api)">
            <div class="api-item-content">
              <div class="api-item-header">
                <span class="api-method" :class="api.method.toLowerCase()">{{ api.method }}</span>
                <span class="api-name">{{ api.description }}</span>
              </div>
              <div v-if="api.description && showApiDescription" class="api-description">{{ api.name }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 最小化状态下的提示 -->
    <el-tooltip v-if="isMinimized" content="点击展开API列表" placement="right" :effect="isDark ? 'dark' : 'light'" :enterable="false">
      <div class="minimized-overlay" @click="toggleMinimize"></div>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps<{
  categories: any[];
  selectedApiId: string | null;
}>();

const emit = defineEmits(['api-selected', 'search-change']);

// 本地状态
const searchQuery = ref('');
const expandedCategories = ref<Record<string, boolean>>({});
const singleExpand = ref(false);
const showApiDescription = ref(true);
const isMinimized = ref(false);
const isDark = ref(false); // 是否暗黑模式

// 检测暗黑模式
const detectDarkMode = () => {
  isDark.value = document.documentElement.getAttribute('data-theme') === 'dark';
};

// 存储设置相关的键名
const SETTINGS_KEY = 'hybrid-doc-settings';

// 保存设置到 localStorage
const saveSettings = () => {
  try {
    const settings = {
      singleExpand: singleExpand.value,
      showApiDescription: showApiDescription.value,
      isMinimized: isMinimized.value
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('保存设置到本地存储时出错:', error);
  }
};

// 从 localStorage 加载设置
const loadSettings = () => {
  try {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      singleExpand.value = settings.singleExpand !== undefined ? settings.singleExpand : false;
      showApiDescription.value = settings.showApiDescription !== undefined ? settings.showApiDescription : true;
      isMinimized.value = settings.isMinimized !== undefined ? settings.isMinimized : false;
    }
  } catch (error) {
    console.error('从本地存储加载设置时出错:', error);
  }
};

// 方法：切换分类的展开/折叠状态
const toggleCategory = (categoryId: string) => {
  if (singleExpand.value) {
    // 单展开模式：先将所有分类设为折叠状态
    const newExpandedState: Record<string, boolean> = {};
    Object.keys(expandedCategories.value).forEach(id => {
      newExpandedState[id] = false;
    });
    // 然后设置当前分类的状态为之前状态的反转
    newExpandedState[categoryId] = !expandedCategories.value[categoryId];
    expandedCategories.value = newExpandedState;
  } else {
    // 多展开模式：仅切换当前分类的状态
    expandedCategories.value = {
      ...expandedCategories.value,
      [categoryId]: !expandedCategories.value[categoryId]
    };
  }
};

// 方法：处理API点击
const handleApiClick = (api: any) => {
  emit('api-selected', api);
};

// 方法：处理搜索变化
const handleSearchChange = () => {
  emit('search-change', searchQuery.value);
};

// 方法：切换最小化/展开状态
const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value;
  saveSettings();
};

// 计算属性：过滤后的分类
const filteredCategories = computed(() => {
  console.log('ApiList接收到的categories:', props.categories);
  
  if (!props.categories || !Array.isArray(props.categories) || props.categories.length === 0) {
    console.log('ApiList: 没有可用的分类数据');
    return [];
  }
  
  // 处理搜索关键词过滤
  if (searchQuery.value.trim()) {
    const keyword = searchQuery.value.toLowerCase().trim();
    
    return props.categories.filter(category => {
      // 匹配分类名称
      if (category.name && category.name.toLowerCase().includes(keyword)) {
        return true;
      }
      
      // 匹配分类下的API
      if (category.apis && Array.isArray(category.apis)) {
        const matchedApis = category.apis.filter(api => 
          (api.name && api.name.toLowerCase().includes(keyword)) ||
          (api.description && api.description.toLowerCase().includes(keyword)) ||
          (api.path && api.path.toLowerCase().includes(keyword))
        );
        
        // 如果有匹配的API，创建一个新的分类对象，只包含匹配的API
        if (matchedApis.length > 0) {
          return {
            ...category,
            apis: matchedApis
          };
        }
      }
      
      return false;
    });
  }
  
  return props.categories;
});

// 在组件挂载时初始化
onMounted(() => {
  // 加载用户设置
  loadSettings();
  
  // 初始化展开状态
  if (props.categories && props.categories.length > 0) {
    props.categories.forEach(category => {
      // 默认只展开第一个分类
      expandedCategories.value[category.id] = category === props.categories[0];
    });
  }
  
  // 检测当前主题模式
  detectDarkMode();
  
  // 监听主题变化
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.attributeName === 'data-theme') {
        detectDarkMode();
      }
    });
  });
  
  observer.observe(document.documentElement, { attributes: true });
  
  // 组件卸载时移除监听器
  onBeforeUnmount(() => {
    observer.disconnect();
  });
});

// 暴露组件属性给父组件
defineExpose({
  isMinimized
});

// 监听分类变化，更新展开状态
watch(() => props.categories, (newCategories) => {
  if (newCategories && newCategories.length > 0) {
    // 对于新的分类，设置展开状态
    newCategories.forEach(category => {
      if (expandedCategories.value[category.id] === undefined) {
        expandedCategories.value[category.id] = false;
      }
    });
  }
}, { deep: true });
</script>

<style scoped lang="scss">
.api-list-column {
  width: 280px;
  min-width: 250px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border-right: 1px solid var(--el-border-color-light);
  transition: width 0.3s ease, min-width 0.3s ease;
  position: relative;
  
  // 最小化状态
  &.minimized {
    width: 42px;
    min-width: 42px;
    
    .column-header {
      padding: 8px;
      
      .header-top {
        flex-direction: column;
        
        .column-title {
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          white-space: nowrap;
          margin-bottom: 16px;
          font-size: 14px;
        }
      }
      
      .search-wrapper,
      .api-list-settings {
        display: none;
      }
    }
    
    .api-list-container {
      display: none;
    }
    
    // 最小化状态下的覆盖层
    .minimized-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      cursor: pointer;
      z-index: 5;
      background-color: transparent;
      
      &:hover {
        background-color: rgba(var(--el-color-primary-rgb), 0.1);
      }
    }
  }

  .column-header {
    padding: 16px;
    border-bottom: 1px solid var(--el-border-color-light);
    background-color: var(--el-bg-color-overlay);
    z-index: 1;

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .column-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .minimize-button {
        cursor: pointer;
        transition: transform 0.2s;
        font-size: 18px;
        line-height: 1;

        &:hover {
          transform: scale(1.2);
        }
      }
    }
    
    .search-wrapper {
      margin-bottom: 8px;
    }
    
    .api-list-settings {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      padding-top: 4px;
      border-top: 1px dashed var(--el-border-color-light);
    }
  }

  .api-list-container {
    flex: 1;
    overflow-y: auto;
    padding: 0;

    // 空状态样式
    .empty-api-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 20px;
      
      .el-empty {
        padding: 20px 0;
      }
      
      .empty-tip {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        margin-top: 8px;
      }
    }

    .api-category {
      border-bottom: 1px solid var(--el-border-color-lighter);

      .category-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        cursor: pointer;
        background-color: var(--el-fill-color-light);
        transition: background-color 0.2s;

        &:hover {
          background-color: var(--el-color-primary-light-9);
        }

        .category-name {
          display: flex;
          align-items: center;
          font-weight: 500;
          color: var(--el-text-color-regular);

          .toggle-icon {
            margin-right: 6px;
            transition: transform 0.2s;
            font-size: 18px;
            line-height: 1;
          }
        }

        .category-count {
          font-size: 12px;
        }
      }

      .api-items {
        background-color: var(--el-bg-color);

        .api-item {
          display: flex;
          padding: 10px 16px 10px 36px;
          cursor: pointer;
          border-bottom: 1px solid var(--el-border-color-lighter);
          transition: background-color 0.2s;

          &:last-child {
            border-bottom: none;
          }

          &:hover {
            background-color: var(--el-color-primary-light-9);
          }

          &.active {
            background-color: var(--el-color-primary-light-8);
          }

          .api-item-content {
            width: 100%;
            
            .api-item-header {
              display: flex;
              align-items: center;
            }

            .api-method {
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 600;
              text-align: center;
              min-width: 50px;
              margin-right: 8px;

              &.get {
                background-color: #e1f5fe;
                color: #0288d1;
              }

              &.post {
                background-color: #e8f5e9;
                color: #388e3c;
              }

              &.put {
                background-color: #fff8e1;
                color: #ffa000;
              }

              &.delete {
                background-color: #ffebee;
                color: #d32f2f;
              }
            }

            .api-name {
              flex: 1;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              color: var(--el-text-color-regular);
            }
            
            .api-description {
              margin-top: 4px;
              margin-left: 64px;
              font-size: 12px;
              color: var(--el-text-color-secondary);
              overflow: hidden;
              text-overflow: ellipsis;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
            }
          }
        }
      }
    }
  }
}

// 响应式适配
@media (max-width: 1200px) {
  .api-list-column {
    width: 100%;
    min-width: 100%;
    height: auto;
    max-height: 300px;
    border-right: none;
    border-bottom: 1px solid var(--el-border-color-light);
  }
}
</style> 
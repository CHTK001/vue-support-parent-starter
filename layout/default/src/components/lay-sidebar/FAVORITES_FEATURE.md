# 悬停导航收藏功能

## 功能概述

为悬停导航添加了完整的收藏功能，用户可以收藏常用的菜单项，并通过"我的收藏"菜单快速访问。所有收藏数据存储在 IndexedDB 中，支持离线使用。

## 🌟 核心功能

### 1. 菜单收藏
- **悬停显示**: 鼠标悬停在菜单项上时显示收藏按钮
- **一键收藏**: 点击星标按钮即可收藏/取消收藏
- **状态反馈**: 实时显示收藏状态（空心星/实心星）
- **动画效果**: 平滑的显示/隐藏动画

### 2. 我的收藏菜单
- **固定位置**: 位于一级菜单的第一个位置
- **收藏列表**: 显示所有已收藏的菜单项
- **时间显示**: 显示收藏的相对时间
- **快速访问**: 点击即可跳转到对应页面

### 3. 数据持久化
- **IndexedDB 存储**: 使用浏览器本地数据库存储
- **离线可用**: 无网络时仍可查看收藏
- **数据同步**: 自动保存和加载收藏数据

## 🔧 技术实现

### 数据结构

#### 收藏项数据格式
```typescript
interface FavoriteItem {
  path: string;        // 菜单路径
  title: string;       // 菜单标题
  icon?: string;       // 菜单图标
  addTime: string;     // 添加时间 (ISO字符串)
}
```

#### 存储键名
- **存储位置**: IndexedDB
- **键名**: `favoriteMenus`
- **数据类型**: `FavoriteItem[]`

### 核心方法

#### 1. 收藏管理
```typescript
// 加载收藏数据
async function loadFavorites() {
  try {
    const favorites = await indexedDBProxy().getItem('favoriteMenus');
    favoriteMenus.value = Array.isArray(favorites) ? favorites : [];
  } catch (error) {
    console.error('加载收藏菜单失败:', error);
    favoriteMenus.value = [];
  }
}

// 保存收藏数据
async function saveFavorites() {
  try {
    await indexedDBProxy().setItem('favoriteMenus', favoriteMenus.value);
  } catch (error) {
    console.error('保存收藏菜单失败:', error);
  }
}

// 切换收藏状态
async function toggleFavorite(menu: any, event?: Event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  const isFavorited = isMenuFavorited(menu);
  
  if (isFavorited) {
    // 移除收藏
    favoriteMenus.value = favoriteMenus.value.filter(fav => fav.path !== menu.path);
  } else {
    // 添加收藏
    const favoriteItem = {
      path: menu.path,
      title: menu.meta?.title || menu.name,
      icon: menu.meta?.icon,
      addTime: new Date().toISOString()
    };
    favoriteMenus.value.push(favoriteItem);
  }
  
  await saveFavorites();
}
```

#### 2. 状态检查
```typescript
// 检查菜单是否已收藏
function isMenuFavorited(menu: any): boolean {
  return favoriteMenus.value.some(fav => fav.path === menu.path);
}
```

#### 3. 时间格式化
```typescript
// 格式化添加时间
function formatAddTime(timeStr: string): string {
  const date = new Date(timeStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  
  return date.toLocaleDateString();
}
```

### UI 组件结构

#### 1. 菜单项包装器
```vue
<div
  class="menu-item-wrapper"
  @mouseenter="handleMenuItemHover(menu)"
  @mouseleave="handleMenuItemLeave"
>
  <!-- 菜单项链接 -->
  <router-link :to="menu.path" class="menu-item">
    <IconifyIconOnline :icon="menu.meta?.icon" />
    <span>{{ menu.meta?.title }}</span>
  </router-link>
  
  <!-- 收藏按钮 -->
  <button
    v-if="hoveredMenuItem?.path === menu.path"
    class="favorite-btn"
    :class="{ 'is-favorited': isMenuFavorited(menu) }"
    @click="toggleFavorite(menu, $event)"
  >
    <IconifyIconOnline 
      :icon="isMenuFavorited(menu) ? 'ep:star-filled' : 'ep:star'" 
    />
  </button>
</div>
```

#### 2. 我的收藏菜单
```vue
<div v-if="hoveredMenu?.path === '/favorites'" class="favorites-content">
  <!-- 空状态 -->
  <div v-if="favoriteMenus.length === 0" class="empty-favorites">
    <IconifyIconOnline icon="ep:star" class="empty-icon" />
    <p>暂无收藏菜单</p>
    <span>鼠标悬停在菜单项上点击星标即可收藏</span>
  </div>
  
  <!-- 收藏列表 -->
  <div v-else class="favorite-items">
    <div v-for="favorite in favoriteMenus" :key="favorite.path">
      <router-link :to="favorite.path" class="favorite-menu-item">
        <IconifyIconOnline :icon="favorite.icon" />
        <span>{{ favorite.title }}</span>
        <span class="add-time">{{ formatAddTime(favorite.addTime) }}</span>
      </router-link>
      <button class="remove-favorite" @click="toggleFavorite(favorite, $event)">
        <IconifyIconOnline icon="ep:delete" />
      </button>
    </div>
  </div>
</div>
```

## 🎨 样式设计

### 1. 收藏按钮样式
```scss
.favorite-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(var(--el-color-primary-rgb), 0.1);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  transform: translateY(-50%) scale(0.8);
  
  &:hover {
    background: rgba(var(--el-color-primary-rgb), 0.2);
    transform: translateY(-50%) scale(1.1);
  }
  
  &.is-favorited {
    background: var(--el-color-warning-light-7);
    
    .favorite-icon {
      color: var(--el-color-warning);
    }
  }
}
```

### 2. 悬停动画
```scss
.menu-item-wrapper {
  &:hover {
    .favorite-btn {
      opacity: 1;
      transform: translateY(-50%) scale(1);
    }
    
    .menu-item {
      padding-right: 45px; // 为收藏按钮留出空间
    }
  }
}
```

### 3. 收藏菜单样式
```scss
.favorite-menu-item {
  background: linear-gradient(135deg, transparent, rgba(var(--el-color-warning-rgb), 0.02));
  
  &:hover {
    background: linear-gradient(135deg, var(--el-color-warning-light-9), var(--el-color-warning-light-8));
    color: var(--el-color-warning-dark-2);
    transform: translateX(6px) translateY(-1px);
    box-shadow: 
      0 4px 12px rgba(var(--el-color-warning-rgb), 0.15),
      0 2px 4px rgba(var(--el-color-warning-rgb), 0.1);
  }
  
  .add-time {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
    opacity: 0.7;
  }
}
```

## 🎯 用户体验

### 1. 交互流程
1. **发现**: 鼠标悬停在菜单项上
2. **收藏**: 点击出现的星标按钮
3. **反馈**: 按钮状态立即更新
4. **访问**: 通过"我的收藏"菜单快速访问

### 2. 视觉反馈
- **按钮出现**: 淡入 + 缩放动画
- **状态切换**: 图标颜色和背景变化
- **悬停效果**: 缩放和颜色变化
- **时间显示**: 相对时间格式

### 3. 空状态设计
- **引导图标**: 大号星标图标
- **说明文字**: 清晰的操作指引
- **友好提示**: 温馨的使用说明

## 🔍 使用场景

### 1. 常用功能快速访问
- 收藏经常使用的管理页面
- 快速跳转到工作台
- 收藏重要的配置页面

### 2. 个性化导航
- 根据工作习惯定制菜单
- 减少多层级菜单的点击
- 提升工作效率

### 3. 临时收藏
- 收藏当前项目相关页面
- 临时标记重要功能
- 项目完成后可随时清理

## 📊 数据统计

### 可扩展的统计功能
- 收藏次数统计
- 使用频率分析
- 热门菜单排行
- 用户行为分析

## 🚀 未来扩展

1. **收藏分组**: 支持创建收藏夹分组
2. **导入导出**: 支持收藏数据的导入导出
3. **云端同步**: 支持多设备收藏同步
4. **智能推荐**: 基于使用习惯推荐菜单
5. **快捷键**: 支持键盘快捷键操作

这个收藏功能为悬停导航增加了个性化和效率提升的能力，让用户可以根据自己的使用习惯定制导航体验。

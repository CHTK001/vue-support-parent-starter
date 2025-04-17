<template>
  <Teleport to="body">
    <div v-if="visible" class="sc-context-menu" 
      :class="className"
      :style="{ top: `${top}px`, left: `${left}px` }"
      @click.stop
      @contextmenu.prevent>
      <ul class="sc-context-menu__list">
        <template v-for="(item, index) in menuItems" :key="index">
          <!-- 分割线 -->
          <li v-if="item.type === 'LINE'" class="sc-context-menu__divider"></li>
          
          <!-- 菜单项 -->
          <li v-else class="sc-context-menu__item" 
              :class="{ 
                'sc-context-menu__item--disabled': item.disabled,
                'sc-context-menu__item--with-children': item.children && item.children.length
              }"
              @click="handleMenuItemClick(item)"
              @mouseenter="handleMenuItemHover(item, $event)"
              @mouseleave="handleMenuItemLeave(item, $event)"
              @mousedown.prevent>
            <!-- 图标 -->
            <div class="sc-context-menu__item-icon">
              <IconifyIconOnline v-if="item.icon" :icon="item.icon" />
            </div>
            
            <!-- 标题 -->
            <div class="sc-context-menu__item-title">
              {{ item.name }}
            </div>
            
            <!-- 子菜单指示 -->
            <div v-if="item.children && item.children.length" class="sc-context-menu__item-arrow">
              <IconifyIconOnline icon="ep:arrow-right" />
            </div>
          </li>
        </template>
      </ul>
      
      <!-- 子菜单 -->
      <div v-if="subMenuVisible" class="sc-context-menu sc-context-menu--submenu"
           :class="className"
           :style="{ top: `${subMenuTop}px`, left: `${subMenuLeft}px` }">
        <ul class="sc-context-menu__list">
          <template v-for="(item, index) in subMenuItems" :key="index">
            <!-- 分割线 -->
            <li v-if="item.type === 'LINE'" class="sc-context-menu__divider"></li>
            
            <!-- 子菜单项 -->
            <li v-else class="sc-context-menu__item" 
                :class="{ 'sc-context-menu__item--disabled': item.disabled }"
                @click="handleSubMenuItemClick(item)"
                @mousedown.prevent>
              <!-- 图标 -->
              <div class="sc-context-menu__item-icon">
                <IconifyIconOnline v-if="item.icon" :icon="item.icon" />
              </div>
              
              <!-- 标题 -->
              <div class="sc-context-menu__item-title">
                {{ item.name }}
              </div>
            </li>
          </template>
        </ul>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import IconifyIconOnline from '@repo/components/ReIcon/src/iconifyIconOnline';

// 定义属性
const props = defineProps({
  menuItems: {
    type: Array,
    default: () => []
  },
  rowData: {
    type: Object,
    default: () => ({})
  },
  className: {
    type: String,
    default: ''
  }
});

// 定义事件
const emit = defineEmits(['menu-action']);

// 响应式状态
const visible = ref(false);
const top = ref(0);
const left = ref(0);
const subMenuVisible = ref(false);
const subMenuItems = ref([]);
const subMenuTop = ref(0);
const subMenuLeft = ref(0);
const activeParentItem = ref(null);
const subMenuHoverTimer = ref(null);
const subMenuLeaveTimer = ref(null);

// 处理菜单项悬停
const handleMenuItemHover = (item, event) => {
  if (item.disabled) return;
  
  // 清除定时器
  if (subMenuLeaveTimer.value) {
    clearTimeout(subMenuLeaveTimer.value);
    subMenuLeaveTimer.value = null;
  }
  
  // 如果有子菜单，显示子菜单
  if (item.children && item.children.length) {
    // 设置延迟，避免频繁显示
    subMenuHoverTimer.value = setTimeout(() => {
      activeParentItem.value = item;
      subMenuItems.value = item.children;
      
      // 计算子菜单位置
      const menuItemEl = event.currentTarget;
      const rect = menuItemEl.getBoundingClientRect();
      
      subMenuLeft.value = rect.right + 5;
      subMenuTop.value = rect.top;
      
      // 检查是否超出视口右侧
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      
      // 估算子菜单宽度
      const subMenuWidth = 160;
      
      if (subMenuLeft.value + subMenuWidth > viewport.width) {
        // 如果右侧没有足够空间，将子菜单放在左侧
        subMenuLeft.value = rect.left - subMenuWidth - 5;
      }
      
      // 显示子菜单
      subMenuVisible.value = true;
    }, 100);
  } else {
    // 如果没有子菜单，隐藏当前子菜单
    hideSubMenu();
  }
};

// 处理菜单项鼠标离开
const handleMenuItemLeave = (item, event) => {
  // 清除悬停定时器
  if (subMenuHoverTimer.value) {
    clearTimeout(subMenuHoverTimer.value);
    subMenuHoverTimer.value = null;
  }
  
  // 设置延迟，避免移动到子菜单过程中隐藏子菜单
  subMenuLeaveTimer.value = setTimeout(() => {
    // 检查鼠标是否移动到子菜单区域
    if (subMenuVisible.value) {
      const subMenuEl = document.querySelector('.sc-context-menu--submenu');
      if (subMenuEl) {
        const subMenuRect = subMenuEl.getBoundingClientRect();
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        
        // 检查鼠标是否在子菜单元素上或旁边的过渡区域
        const padding = 10; // 过渡区域的大小
        if (
          mouseX >= subMenuRect.left - padding &&
          mouseX <= subMenuRect.right &&
          mouseY >= subMenuRect.top - padding &&
          mouseY <= subMenuRect.bottom + padding
        ) {
          // 鼠标正在移动到子菜单，不隐藏
          return;
        }
      }
    }
    
    // 隐藏子菜单
    hideSubMenu();
  }, 100);
};

// 隐藏子菜单
const hideSubMenu = () => {
  subMenuVisible.value = false;
  subMenuItems.value = [];
  activeParentItem.value = null;
};

// 点击子菜单项处理
const handleSubMenuItemClick = (item) => {
  if (item.disabled) return;
  
  // 关闭所有菜单
  close();
  
  // 如果有处理函数，直接调用
  if (typeof item.handle === 'function') {
    item.handle(props.rowData);
    return;
  }
  
  // 向父组件发出事件
  emit('menu-action', {
    action: item.name,
    item,
    parentItem: activeParentItem.value,
    rowData: props.rowData
  });
};

// 点击菜单项处理
const handleMenuItemClick = (item) => {
  if (item.disabled) return;
  
  // 如果有子菜单，不触发点击事件
  if (item.children && item.children.length) {
    return;
  }
  
  // 关闭菜单
  close();
  
  // 如果有处理函数，直接调用
  if (typeof item.handle === 'function') {
    item.handle(props.rowData);
    return;
  }
  
  // 向父组件发出事件
  emit('menu-action', {
    action: item.name,
    item,
    rowData: props.rowData
  });
};

// 打开菜单
const open = (event, rowData) => {
  // 阻止默认右键菜单
  event.preventDefault();
  event.stopPropagation();
  
  // 更新位置
  updatePosition(event);
  
  // 显示菜单
  visible.value = true;
  
  // 在下一个事件循环添加点击事件监听器，以避免立即关闭
  setTimeout(() => {
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('contextmenu', handleDocumentClick);
  }, 10);
};

// 关闭菜单
const close = () => {
  visible.value = false;
  subMenuVisible.value = false;
  
  // 移除事件监听器
  document.removeEventListener('click', handleDocumentClick);
  document.removeEventListener('contextmenu', handleDocumentClick);
  
  // 清除定时器
  if (subMenuHoverTimer.value) {
    clearTimeout(subMenuHoverTimer.value);
    subMenuHoverTimer.value = null;
  }
  
  if (subMenuLeaveTimer.value) {
    clearTimeout(subMenuLeaveTimer.value);
    subMenuLeaveTimer.value = null;
  }
};

// 处理全局点击事件，关闭菜单
const handleDocumentClick = (event) => {
  // 检查点击是否发生在主菜单或子菜单元素内部
  const mainMenu = document.querySelector('.sc-context-menu:not(.sc-context-menu--submenu)');
  const subMenu = document.querySelector('.sc-context-menu--submenu');
  
  if (
    (mainMenu && mainMenu.contains(event.target)) || 
    (subMenu && subMenu.contains(event.target))
  ) {
    // 如果点击发生在菜单内部，不关闭菜单
    return;
  }
  
  // 否则关闭菜单
  close();
};

// 计算菜单的最佳位置
const updatePosition = (event) => {
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  };
  
  // 设置初始位置为鼠标位置，添加少量偏移使鼠标不直接指向第一个菜单项
  let x = event.clientX + 2;
  let y = event.clientY + 2;
  
  // 估计菜单尺寸
  const menuWidth = 160; // 与CSS中设置的min-width一致
  const itemHeight = 32; // 与CSS中设置的item高度一致
  const padding = 8; // 上下padding总和
  const estimatedHeight = (props.menuItems.length * itemHeight) + padding;
  
  // 检查右侧空间
  if (x + menuWidth > viewport.width) {
    // 如果右侧空间不足，将菜单显示在鼠标左侧
    x = event.clientX - menuWidth - 5;
    
    // 如果左侧也没有足够空间，则将菜单放在视口右边缘
    if (x < 0) {
      x = Math.max(0, viewport.width - menuWidth - 5);
    }
  }
  
  // 检查底部空间
  if (y + estimatedHeight > viewport.height) {
    // 如果底部空间不足，将菜单向上显示
    y = Math.max(5, viewport.height - estimatedHeight - 5);
    
    // 如果菜单高度超过视口，则将菜单放在视口顶部
    if (y < 0) {
      y = 5;
    }
  }
  
  // 设置位置
  left.value = x;
  top.value = y;
};

// 组件卸载时清理
onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick);
  document.removeEventListener('contextmenu', handleDocumentClick);
  
  // 清除定时器
  if (subMenuHoverTimer.value) {
    clearTimeout(subMenuHoverTimer.value);
  }
  
  if (subMenuLeaveTimer.value) {
    clearTimeout(subMenuLeaveTimer.value);
  }
});

// 暴露方法给父组件
defineExpose({
  open,
  close
});
</script>

<style scoped>
.sc-context-menu {
  position: fixed;
  z-index: 9999;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  background-color: #fff;
  padding: 5px 0;
  overflow: hidden;
  font-size: 14px;
  animation: fadeIn 0.15s ease-out;
}

.sc-context-menu--submenu {
  z-index: 10000; /* 确保子菜单在父菜单之上 */
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.sc-context-menu__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.sc-context-menu__item {
  display: flex;
  align-items: center;
  padding: 3px 16px;
  cursor: pointer;
  white-space: nowrap;
  color: #333;
  transition: all 0.2s;
  position: relative;
}

.sc-context-menu__item:hover {
  background-color: #f5f7fa;
  color: var(--el-color-primary);
}

.sc-context-menu__item:active {
  background-color: #ecf5ff;
}

.sc-context-menu__item--disabled {
  color: #c0c4cc;
  cursor: not-allowed;
  pointer-events: none;
  background-color: transparent;
}

.sc-context-menu__item--with-children {
  padding-right: 24px;
}

.sc-context-menu__item-icon {
  display: flex;
  align-items: center;
  margin-right: 8px;
  font-size: 16px;
}

.sc-context-menu__item-title {
  flex: 1;
}

.sc-context-menu__item-arrow {
  margin-left: 8px;
  font-size: 14px;
}

.sc-context-menu__divider {
  height: 1px;
  margin: 5px 0;
  background-color: #e4e7ed;
}
</style> 
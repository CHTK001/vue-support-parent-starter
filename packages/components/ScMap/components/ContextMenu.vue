<template>
  <Teleport to="body">
    <div 
      v-if="visible" 
      class="sc-context-menu" 
      :style="menuStyle" 
      @click.stop
      @contextmenu.prevent.stop
      @mousedown.prevent.stop
      @mouseup.prevent.stop
    >
      <ul class="sc-context-menu__list">
        <template v-for="(item, index) in items" :key="index">
          <!-- 分割线 -->
          <li v-if="item.separator" class="sc-context-menu__divider"></li>
          
          <!-- 菜单项 -->
          <li v-else class="sc-context-menu__item" 
              :class="{ 
                'sc-context-menu__item--disabled': item.disabled,
                'sc-context-menu__item--danger': item.danger
              }"
              @click.stop="handleItemClick(item)"
              @mousedown.prevent>
            <!-- 图标 -->
            <div class="sc-context-menu__item-icon" v-if="item.icon">
              <span v-html="item.icon"></span>
            </div>
            
            <!-- 标题 -->
            <div class="sc-context-menu__item-title">
              {{ item.text }}
            </div>
          </li>
        </template>
      </ul>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { MenuItemClickParams } from '../types';

// 定义菜单项的接口
interface MenuItemConfig {
  text: string;            // 菜单项文字
  action: string;          // 菜单项动作标识
  icon?: string;           // 菜单项图标 (SVG)
  disabled?: boolean;      // 是否禁用
  danger?: boolean;        // 是否危险操作
  separator?: boolean;     // 是否是分隔符
  condition?: (data: any) => boolean; // 条件函数，决定是否显示此菜单项
  click?: (item: MenuItemConfig, data?: any, params?: MenuItemClickParams) => void; // 点击事件处理函数
}

// 定义组件的props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  position: {
    type: Array as unknown as () => [number, number],
    default: () => [0, 0]
  },
  title: {
    type: String,
    default: ''
  },
  items: {
    type: Array as () => MenuItemConfig[],
    default: () => []
  }
});

// 定义组件的emit事件
const emit = defineEmits([
  'close',
  'item-click'
]);

// 计算菜单的最佳位置
const menuStyle = computed(() => {
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  };
  
  // 向左偏移10px
  let x = props.position[0] - 10;
  let y = props.position[1];
  
  // 估计菜单尺寸
  const menuWidth = 160; // 减小菜单宽度
  const itemHeight = 30; // 减小菜单项高度
  const padding = 8; // 减小内边距
  const itemCount = props.items.filter(item => !item.separator).length;
  const dividerCount = props.items.filter(item => item.separator).length;
  
  // 如果没有菜单项，设置最小高度
  const estimatedHeight = itemCount > 0 
    ? (itemCount * itemHeight) + (dividerCount * 1) + padding 
    : 0;
  
  // 检查右侧空间
  if (x + menuWidth > viewport.width) {
    x = Math.max(0, viewport.width - menuWidth - 5);
  }
  
  // 检查底部空间
  if (y + estimatedHeight > viewport.height) {
    y = Math.max(5, viewport.height - estimatedHeight - 5);
  }
  
  // 防止左侧超出
  if (x < 0) {
    x = 5;
  }
  
  // 创建基本样式对象
  const styleObj: Record<string, string> = {
    top: `${y}px`,
    left: `${x}px`,
  };
  
  // 只有在有菜单项时才设置最小高度
  if (itemCount > 0) {
    styleObj.minHeight = `${estimatedHeight}px`;
  }
  
  return styleObj;
});

// 处理菜单项点击
const handleItemClick = (item: MenuItemConfig) => {
  if (item.disabled) {
    return;
  }
  
  // 如果有自定义点击处理函数，直接调用
  if (typeof item.click === 'function') {
    try {
      // 只调用菜单项的click函数，不需要传递额外参数
      // 菜单项的click函数应该包含所有必要的处理逻辑
      item.click(item);
    } catch (error) {
      console.error('菜单项点击回调执行失败:', error);
    }
  }
  
  // 关闭菜单
  emit('close');
};

// 在组件挂载时添加全局点击事件
onMounted(() => {
  // 在document上添加一个点击事件监听器
  document.addEventListener('click', handleDocumentClick);
});

// 在组件卸载时移除全局点击事件
onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick);
  document.removeEventListener('contextmenu', handleGlobalEvents, true);
  document.removeEventListener('mousedown', handleGlobalEvents, true);
});

// 处理document上的点击事件
const handleDocumentClick = (event: MouseEvent) => {
  if (!props.visible) return;
  
  // 检查点击是否在菜单外部
  const contextMenuEl = document.querySelector('.sc-context-menu');
  if (contextMenuEl && !contextMenuEl.contains(event.target as Node)) {
    emit('close');
  }
};

// 全局右键和mousedown事件监听（用于捕获阶段）
const handleGlobalEvents = (event: Event) => {
  // 如果事件源是菜单本身或其子元素，不关闭菜单
  const contextMenuEl = document.querySelector('.sc-context-menu');
  if (contextMenuEl && (contextMenuEl === event.target || contextMenuEl.contains(event.target as Node))) {
    return;
  }
  
  emit('close');
};

// 监听visible属性的变化
watch(() => props.visible, (newValue) => {
  if (newValue) {
    // 菜单显示时，添加右键和mousedown事件监听器（捕获阶段）
    nextTick(() => {
      setTimeout(() => {
        document.addEventListener('contextmenu', handleGlobalEvents, { capture: true });
        document.addEventListener('mousedown', handleGlobalEvents, { capture: true });
      }, 10);
    });
  } else {
    // 菜单隐藏时，移除捕获阶段的事件监听器
    document.removeEventListener('contextmenu', handleGlobalEvents, true);
    document.removeEventListener('mousedown', handleGlobalEvents, true);
  }
});
</script>

<style scoped>
.sc-context-menu {
  position: fixed;
  z-index: 9999;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  background-color: #fff;
  overflow: hidden;
  font-size: 13px;
  user-select: none;
  animation: fadeIn 0.15s ease-out;
  border: 1px solid rgba(0, 0, 0, 0.08);
  min-width: 160px;
  max-width: 240px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px) translateX(-5px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) translateX(0) scale(1);
  }
}

.sc-context-menu__list {
  margin: 0;
  padding: 4px 0;
  list-style: none;
}

.sc-context-menu__item {
  display: flex;
  align-items: center;
  padding: 5px 12px;
  cursor: pointer;
  white-space: nowrap;
  color: #333;
  transition: all 0.2s;
  height: 30px;
  box-sizing: border-box;
}

.sc-context-menu__item:hover {
  background-color: #f5f7fa;
  color: var(--el-color-primary, #409EFF);
}

.sc-context-menu__item:active {
  background-color: #ecf5ff;
}

.sc-context-menu__item--disabled {
  color: #c0c4cc;
  cursor: not-allowed;
  opacity: 0.7;
}

.sc-context-menu__item--disabled:hover {
  background-color: transparent;
  color: #c0c4cc;
}

.sc-context-menu__item--danger {
  color: #f56c6c;
}

.sc-context-menu__item--danger:hover {
  background-color: #fef0f0;
  color: #f56c6c;
}

.sc-context-menu__item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  width: 16px;
  height: 16px;
  font-size: 16px;
}

.sc-context-menu__item-title {
  flex: 1;
  font-size: 13px;
}

.sc-context-menu__divider {
  height: 1px;
  margin: 4px 0;
  background-color: #e4e7ed;
  padding: 0;
}
</style> 
<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { localStorageProxy } from "@repo/utils";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";

const STORAGE_KEY = "widget-quick-todo";

const todos = ref([]);
const newTodo = ref("");

// 加载保存的待办
onMounted(() => {
  const saved = localStorageProxy().getItem(STORAGE_KEY);
  if (saved && Array.isArray(saved)) {
    todos.value = saved;
  }
});

// 保存待办
const saveTodos = () => {
  localStorageProxy().setItem(STORAGE_KEY, todos.value);
};

// 添加待办
const addTodo = () => {
  if (!newTodo.value.trim()) return;
  todos.value.unshift({
    id: Date.now(),
    text: newTodo.value.trim(),
    done: false
  });
  newTodo.value = "";
  saveTodos();
};

// 切换完成状态
const toggleTodo = (todo) => {
  todo.done = !todo.done;
  saveTodos();
};

// 删除待办
const removeTodo = (id) => {
  todos.value = todos.value.filter(t => t.id !== id);
  saveTodos();
};

// 统计
const stats = computed(() => {
  const total = todos.value.length;
  const done = todos.value.filter(t => t.done).length;
  return { total, done, pending: total - done };
});
</script>

<template>
  <div class="quick-todo">
    <div class="todo-header">
      <div class="header-left">
        <el-icon :size="18" class="mr-1"><component :is="useRenderIcon('ri:list-check')" /></el-icon>
        <span class="header-title">待办清单</span>
      </div>
      <span class="header-stats" v-if="stats.total > 0">
        {{ stats.done }}/{{ stats.total }}
      </span>
    </div>
    
    <div class="todo-input-wrapper">
      <el-input
        v-model="newTodo"
        placeholder="添加新待办..."
        class="todo-input"
        @keyup.enter="addTodo"
      >
        <template #prefix>
          <el-icon><component :is="useRenderIcon('ep:plus')" /></el-icon>
        </template>
      </el-input>
    </div>
    
    <div class="todo-list">
      <div v-if="todos.length === 0" class="todo-empty">
        <div class="empty-icon-bg">
          <el-icon :size="24" color="var(--el-color-primary)">
            <component :is="useRenderIcon('ri:checkbox-circle-line')" />
          </el-icon>
        </div>
        <span>暂无待办事项</span>
      </div>
      <transition-group name="list">
        <div
          v-for="todo in todos"
          :key="todo.id"
          class="todo-item"
          :class="{ 'is-done': todo.done }"
        >
          <div class="todo-checkbox" @click="toggleTodo(todo)">
            <div class="checkbox-inner">
              <el-icon v-if="todo.done" :size="12"><component :is="useRenderIcon('ep:check')" /></el-icon>
            </div>
          </div>
          <span class="todo-text" @click="toggleTodo(todo)">{{ todo.text }}</span>
          <div class="todo-actions">
            <div class="delete-btn" @click.stop="removeTodo(todo.id)">
              <el-icon><component :is="useRenderIcon('ep:close')" /></el-icon>
            </div>
          </div>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<style scoped lang="scss">
.quick-todo {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  padding: 16px;
  overflow: hidden;
  position: relative;
}

.todo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-shrink: 0;
  
  .header-left {
    display: flex;
    align-items: center;
    color: var(--el-color-primary);
    
    .el-icon {
      filter: drop-shadow(0 2px 4px rgba(var(--el-color-primary-rgb), 0.3));
    }
  }
  
  .header-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
  
  .header-stats {
    font-size: 12px;
    padding: 2px 8px;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    border-radius: 10px;
    font-weight: 500;
  }
}

.todo-input-wrapper {
  margin-bottom: 16px;
  flex-shrink: 0;
  
  :deep(.el-input__wrapper) {
    border-radius: 8px;
    box-shadow: 0 0 0 1px var(--el-border-color-lighter) inset;
    background: var(--el-fill-color-lighter);
    transition: all 0.3s;
    
    &.is-focus {
      background: var(--el-bg-color);
      box-shadow: 0 0 0 1px var(--el-color-primary) inset;
    }
  }
}

.todo-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding-right: 4px;
  
  /* Custom Scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--el-border-color-lighter);
    border-radius: 3px;
    transition: background-color 0.3s;
    
    &:hover {
      background-color: var(--el-border-color-darker);
    }
  }
}

.todo-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-placeholder);
  font-size: 13px;
  padding: 20px 0;
  
  .empty-icon-bg {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--el-color-primary-light-9);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
    transition: transform 0.3s ease;
  }

  &:hover .empty-icon-bg {
    transform: scale(1.1);
  }
}

.todo-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  margin-bottom: 8px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid transparent;
  
  &:hover {
    background: var(--el-bg-color);
    border-color: var(--el-border-color-lighter);
    transform: translateX(2px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    
    .delete-btn {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  &.is-done {
    opacity: 0.6;
    background: var(--el-fill-color-lighter);
    
    .todo-text {
      text-decoration: line-through;
      color: var(--el-text-color-secondary);
    }
  }
}

.todo-checkbox {
  margin-right: 10px;
  flex-shrink: 0;
  
  .checkbox-inner {
    width: 18px;
    height: 18px;
    border: 2px solid var(--el-border-color);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    color: white;
    
    .el-icon {
      font-weight: bold;
    }
  }
  
  .todo-item.is-done & .checkbox-inner {
    background: var(--el-color-primary);
    border-color: var(--el-color-primary);
  }
}

.todo-text {
  flex: 1;
  font-size: 14px;
  color: var(--el-text-color-regular);
  line-height: 1.4;
  word-break: break-all;
  transition: color 0.2s;
}

.todo-actions {
  margin-left: 8px;
  
  .delete-btn {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    color: var(--el-text-color-secondary);
    transition: all 0.2s;
    opacity: 0;
    transform: scale(0.8);
    
    &:hover {
      background: var(--el-fill-color-darker);
      color: var(--el-color-danger);
    }
  }
}

/* List Transitions */
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.list-leave-active {
  position: absolute;
  width: 100%;
}
</style>
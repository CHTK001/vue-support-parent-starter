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
      <span class="header-title">待办事项</span>
      <span class="header-stats" v-if="stats.total > 0">
        {{ stats.done }}/{{ stats.total }}
      </span>
    </div>
    
    <div class="todo-input">
      <el-input
        v-model="newTodo"
        placeholder="添加新待办..."
        size="small"
        @keyup.enter="addTodo"
      >
        <template #append>
          <el-button @click="addTodo" :disabled="!newTodo.trim()">
            <el-icon><component :is="useRenderIcon('ep:plus')" /></el-icon>
          </el-button>
        </template>
      </el-input>
    </div>
    
    <div class="todo-list">
      <div v-if="todos.length === 0" class="todo-empty">
        <el-icon :size="32" color="var(--el-text-color-placeholder)">
          <component :is="useRenderIcon('ri:checkbox-circle-line')" />
        </el-icon>
        <span>暂无待办事项</span>
      </div>
      <div
        v-for="todo in todos"
        :key="todo.id"
        class="todo-item"
        :class="{ 'is-done': todo.done }"
      >
        <el-checkbox v-model="todo.done" @change="saveTodos" />
        <span class="todo-text">{{ todo.text }}</span>
        <el-button type="danger" link size="small" @click="removeTodo(todo.id)">
          <el-icon><component :is="useRenderIcon('ep:delete')" /></el-icon>
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.quick-todo {
  height: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.todo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  
  .header-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
  
  .header-stats {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color);
    padding: 2px 8px;
    border-radius: 10px;
  }
}

.todo-input {
  margin-bottom: 12px;
  
  :deep(.el-input-group__append) {
    padding: 0 12px;
  }
}

.todo-list {
  flex: 1;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color);
    border-radius: 2px;
  }
}

.todo-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}

.todo-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  margin-bottom: 6px;
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
  gap: 8px;
  
  &.is-done {
    opacity: 0.6;
    
    .todo-text {
      text-decoration: line-through;
      color: var(--el-text-color-placeholder);
    }
  }
  
  .todo-text {
    flex: 1;
    font-size: 13px;
    color: var(--el-text-color-regular);
    word-break: break-all;
  }
  
  :deep(.el-checkbox) {
    margin-right: 0;
  }
}
</style>

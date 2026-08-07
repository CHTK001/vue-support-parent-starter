<template>
  <div class="home">
    <div class="home__toolbar">
      <el-input
        v-model="keyword"
        placeholder="搜索组件名 / 描述"
        clearable
        size="default"
        class="home__search"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <div class="home__stats">
        <span class="home__stat">共 <b>0</b> 个组件</span>
      </div>
    </div>

    <div class="home__scroll home__scroll--empty">
      <div class="home__placeholder">
        <el-icon :size="48" class="home__placeholder-icon"><DocumentRemove /></el-icon>
        <div class="home__placeholder-title">暂无内容</div>
        <div class="home__placeholder-desc">底部假数据已移除，等待真实组件列表接入</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Search, DocumentRemove } from "@element-plus/icons-vue";

const keyword = ref("");
</script>

<style lang="scss" scoped>
.home {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.home__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 24px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

.home__search {
  width: 320px;
}

.home__stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);

  .home__stat b {
    color: var(--el-text-color-primary);
    font-weight: 700;
    margin: 0 2px;
  }
}

.home__scroll {
  flex: 1;
  min-height: 0;
  padding: 16px 24px 24px;
  overflow-y: auto;
}

.home__scroll--empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.home__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 32px;
  color: var(--el-text-color-secondary);
}

.home__placeholder-icon {
  color: var(--el-text-color-placeholder);
}

.home__placeholder-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.home__placeholder-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>
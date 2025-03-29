<template>
  <div class="redis-hash h-full">
    <div class="redis-hash__toolbar">
      <div class="redis-hash__info">
        <IconifyIconOnline icon="ri:hashtag" class="redis-hash__icon" />
        <span class="redis-hash__title">哈希表数据</span>
        <el-tag size="small" type="info" class="redis-hash__count">{{ newData.length }} 条记录</el-tag>
      </div>

      <div class="redis-hash__actions">
        <el-input v-model="searchText" placeholder="搜索字段或值" clearable size="small" class="redis-hash__search">
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </el-input>
      </div>
    </div>

    <div class="redis-hash__content">
      <el-table :data="filteredData" border stripe highlight-current-row class="redis-hash__table">
        <el-table-column type="index" label="序号" width="80" align="center" />
        <el-table-column prop="name" label="字段" min-width="200">
          <template #default="{ row }">
            <div class="redis-hash__field">
              <el-tag size="small" type="success" class="redis-hash__field-tag">
                {{ row.name }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="value" label="值" min-width="300" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="redis-hash__value">
              {{ row.value }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-tooltip content="复制值" placement="top">
              <el-button type="primary" link @click="copyValue(row.value)">
                <IconifyIconOnline icon="ri:clipboard-line" />
              </el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="filteredData.length === 0" description="没有找到匹配的数据" class="redis-hash__empty" />
    </div>
  </div>
</template>

<script setup>
import { defineProps, reactive, ref, computed } from "vue";
import { ElMessage } from "element-plus";

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
});

/**
 * 将对象数据转换为数组格式
 */
const newData = Object.keys(props.data || {}).map(it => {
  return props.data[it];
});

// 搜索文本
const searchText = ref("");

/**
 * 计算属性：过滤后的数据
 * 根据搜索文本过滤字段和值
 */
const filteredData = computed(() => {
  if (!searchText.value) return newData;

  const searchLower = searchText.value.toLowerCase();
  return newData.filter(item => {
    return String(item.name).toLowerCase().includes(searchLower) || String(item.value).toLowerCase().includes(searchLower);
  });
});

/**
 * 复制值到剪贴板
 * @param {String} value - 要复制的值
 */
const copyValue = value => {
  navigator.clipboard
    .writeText(value)
    .then(() => {
      ElMessage.success("值已复制到剪贴板");
    })
    .catch(() => {
      ElMessage.error("复制失败，请手动复制");
    });
};
</script>

<style lang="scss" scoped>
.redis-hash {
  display: flex;
  flex-direction: column;
  height: 100%;

  &__toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    background-color: var(--el-bg-color-overlay);
    border-radius: var(--el-border-radius-base);
    margin-bottom: 16px;
  }

  &__info {
    display: flex;
    align-items: center;
  }

  &__icon {
    font-size: 18px;
    color: var(--el-color-primary);
    margin-right: 8px;
  }

  &__title {
    font-weight: 500;
    margin-right: 8px;
    color: var(--el-text-color-primary);
  }

  &__count {
    margin-left: 8px;
  }

  &__search {
    width: 240px;
  }

  &__content {
    flex: 1;
    overflow: hidden;
    position: relative;
  }

  &__table {
    height: 100%;

    :deep(.el-table__body-wrapper) {
      overflow-y: auto;
    }

    :deep(.el-table__row) {
      transition: background-color 0.2s;

      &:hover {
        background-color: var(--el-color-primary-light-9) !important;
      }
    }
  }

  &__field {
    display: flex;
    align-items: center;

    &-tag {
      font-family: "Consolas", "Monaco", monospace;
    }
  }

  &__value {
    font-family: "Consolas", "Monaco", monospace;
    color: var(--el-text-color-regular);
    word-break: break-all;
  }

  &__empty {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
}
</style>

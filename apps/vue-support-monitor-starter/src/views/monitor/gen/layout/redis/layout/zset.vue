<template>
  <div class="redis-zset h-full">
    <div class="redis-zset__toolbar">
      <div class="redis-zset__info">
        <IconifyIconOnline icon="ri:bar-chart-2-line" class="redis-zset__icon" />
        <span class="redis-zset__title">有序集合数据</span>
        <el-tag size="small" type="info" class="redis-zset__count">{{ newData.length }} 条记录</el-tag>
      </div>

      <div class="redis-zset__actions">
        <el-input v-model="searchText" placeholder="搜索成员或分数" clearable size="small" class="redis-zset__search">
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </el-input>

        <el-select v-model="sortOrder" size="small" class="redis-zset__sort">
          <el-option label="分数升序" value="asc" />
          <el-option label="分数降序" value="desc" />
        </el-select>
      </div>
    </div>

    <div class="redis-zset__content">
      <el-table :data="sortedData" border stripe highlight-current-row class="redis-zset__table">
        <el-table-column type="index" label="序号" width="80" align="center" />
        <el-table-column prop="name" label="成员" min-width="250" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="redis-zset__member">
              {{ row.name }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="value" label="分数" width="150" align="center">
          <template #default="{ row }">
            <el-tag :type="getScoreTagType(row.value)" size="small" class="redis-zset__score">
              {{ row.value }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-tooltip content="复制成员" placement="top">
              <el-button type="primary" link @click="copyValue(row.name)">
                <IconifyIconOnline icon="ri:clipboard-line" />
              </el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="sortedData.length === 0" description="没有找到匹配的数据" class="redis-zset__empty" />
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

// 排序方式
const sortOrder = ref("asc");

/**
 * 计算属性：过滤后的数据
 * 根据搜索文本过滤成员和分数
 */
const filteredData = computed(() => {
  if (!searchText.value) return newData;

  const searchLower = searchText.value.toLowerCase();
  return newData.filter(item => {
    return String(item.name).toLowerCase().includes(searchLower) || String(item.value).toLowerCase().includes(searchLower);
  });
});

/**
 * 计算属性：排序后的数据
 * 根据分数进行排序
 */
const sortedData = computed(() => {
  return [...filteredData.value].sort((a, b) => {
    const scoreA = parseFloat(a.value);
    const scoreB = parseFloat(b.value);

    return sortOrder.value === "asc" ? scoreA - scoreB : scoreB - scoreA;
  });
});

/**
 * 获取分数标签类型
 * 根据分数值返回不同的标签类型
 * @param {String|Number} score - 分数值
 * @returns {String} 标签类型
 */
const getScoreTagType = score => {
  const numScore = parseFloat(score);
  if (numScore > 0) return "success";
  if (numScore < 0) return "danger";
  return "info";
};

/**
 * 复制值到剪贴板
 * @param {String} value - 要复制的值
 */
const copyValue = value => {
  navigator.clipboard
    .writeText(value)
    .then(() => {
      ElMessage.success("成员已复制到剪贴板");
    })
    .catch(() => {
      ElMessage.error("复制失败，请手动复制");
    });
};
</script>

<style lang="scss" scoped>
.redis-zset {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;

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

  &__actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__search {
    width: 200px;
  }

  &__sort {
    width: 120px;
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

  &__member {
    font-family: "Consolas", "Monaco", monospace;
    color: var(--el-text-color-regular);
    word-break: break-all;
  }

  &__score {
    min-width: 60px;
    display: inline-flex;
    justify-content: center;
    font-family: "Consolas", "Monaco", monospace;
  }

  &__empty {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
}
</style>

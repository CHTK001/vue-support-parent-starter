<!--
 * TimelineView 时间线布局视图
 * @author CH
 * @version 1.0.0
 * @since 2025-12-05
-->
<template>
  <div class="sc-table-timeline" :style="{ height: height }">
    <!-- 时间线容器 -->
    <el-timeline v-if="tableData.length > 0">
      <el-timeline-item
        v-for="(item, index) in tableData"
        :key="item[rowKey] || index"
        :timestamp="getTimestamp(item)"
        :type="getTimelineType(item, index)"
        :color="getTimelineColor(item, index)"
        :size="timelineSize"
        :hollow="timelineHollow"
        :placement="timelinePlacement"
        @click="handleRowClick(item, index)"
      >
        <!-- 自定义内容 -->
        <slot :row="item" :index="index">
          <div class="timeline-content">
            <!-- 序号徽章 -->
            <div v-if="showIndex" class="timeline-index-badge">{{ index + 1 }}</div>
            <!-- 默认渲染所有列 -->
            <div v-for="col in visibleColumns" :key="col.prop" class="timeline-field">
              <span class="timeline-field-label">{{ col.label }}：</span>
              <span class="timeline-field-value">{{ item[col.prop] }}</span>
            </div>
          </div>
        </slot>

        <!-- 自定义时间戳 -->
        <template v-if="$slots.timestamp" #timestamp>
          <slot name="timestamp" :row="item" :index="index" />
        </template>

        <!-- 自定义圆点 -->
        <template v-if="$slots.dot" #dot>
          <slot name="dot" :row="item" :index="index" />
        </template>
      </el-timeline-item>
    </el-timeline>

    <!-- 空状态 -->
    <div v-else class="timeline-empty">
      <slot name="empty">
        <el-empty :description="emptyText" :image-size="100" />
      </slot>
    </div>

    <!-- 加载更多 -->
    <div v-if="paginationType === 'scroll' && tableData.length > 0" class="timeline-load-more">
      <el-button v-if="hasMore" :loading="loading" type="primary" link @click="$emit('load-more')">加载更多</el-button>
      <span v-else class="no-more">没有更多了</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

defineOptions({
  name: "TimelineView"
});

const props = defineProps({
  tableData: { type: Array, default: () => [] },
  userColumn: { type: Array, default: () => [] },
  rowKey: { type: String, default: "id" },
  height: { type: [String, Number], default: "auto" },
  emptyText: { type: String, default: "暂无数据" },
  loading: { type: Boolean, default: false },
  total: { type: Number, default: 0 },
  currentPage: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  paginationType: { type: String, default: "default" },
  // 时间线特有配置
  timestampField: { type: String, default: "createTime" },
  timelineSize: { type: String, default: "normal" },
  timelineHollow: { type: Boolean, default: false },
  timelinePlacement: { type: String, default: "bottom" },
  timelineTypeField: { type: String, default: "type" },
  timelineColorField: { type: String, default: "color" },
  showIndex: { type: Boolean, default: false }
});

const emit = defineEmits(["row-click", "load-more"]);

/**
 * 可见列
 */
const visibleColumns = computed(() => {
  return props.userColumn.filter((col: any) => !col.hide && col.prop !== props.timestampField);
});

/**
 * 是否有更多数据
 */
const hasMore = computed(() => {
  return props.tableData.length < props.total;
});

/**
 * 获取时间戳
 */
function getTimestamp(item: Record<string, any>): string {
  return item[props.timestampField] || "";
}

/**
 * 获取时间线类型
 */
function getTimelineType(item: Record<string, any>, index: number): string {
  if (item[props.timelineTypeField]) {
    return item[props.timelineTypeField];
  }
  // 默认按顺序循环
  const types = ["primary", "success", "warning", "danger", "info"];
  return types[index % types.length];
}

/**
 * 获取时间线颜色
 */
function getTimelineColor(item: Record<string, any>, index: number): string | undefined {
  return item[props.timelineColorField];
}

/**
 * 处理行点击
 */
function handleRowClick(row: Record<string, any>, index: number): void {
  emit("row-click", row, index);
}
</script>

<style lang="scss" scoped>
.sc-table-timeline {
  padding: 16px;
  overflow: auto;

  .timeline-content {
    position: relative;
    padding: 12px 16px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: var(--el-fill-color);
      transform: translateX(4px);
    }

    .timeline-index-badge {
      position: absolute;
      top: -8px;
      left: -8px;
      min-width: 22px;
      height: 22px;
      padding: 0 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 11px;
      background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
      color: #fff;
      font-size: 11px;
      font-weight: 600;
      box-shadow: 0 2px 6px var(--el-color-primary-light-5);
    }
  }

  .timeline-field {
    display: flex;
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }

    &-label {
      color: var(--el-text-color-secondary);
      font-size: 13px;
      min-width: 80px;
    }

    &-value {
      color: var(--el-text-color-primary);
      font-size: 13px;
      flex: 1;
    }
  }

  .timeline-empty {
    padding: 40px;
    text-align: center;
  }

  .timeline-load-more {
    text-align: center;
    padding: 16px;

    .no-more {
      color: var(--el-text-color-secondary);
      font-size: 13px;
    }
  }
}
</style>

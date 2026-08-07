<script setup lang="ts" name="WidgetRenderer">
/**
 * Widget 渲染器
 *
 * 根据 widget.type 渲染对应的占位卡片。
 * 真实业务可在 widgets.ts 扩展类型并在此注册渲染器。
 */
import { computed } from "vue";
import type { WidgetItem } from "./types";

const props = defineProps<{ widget: WidgetItem }>();

const cardBody = computed(() => {
  switch (props.widget.type) {
    case "stats":
      return {
        primary: "1,234",
        primaryLabel: "今日访问",
        secondary: [
          { label: "新增用户", value: "128" },
          { label: "活跃任务", value: "32" },
          { label: "完成率", value: "96%" },
        ],
      };
    case "welcome-extra":
      return {
        primary: "Hi，今天也要元气满满 ✨",
        primaryLabel: "今日心情",
        secondary: [],
      };
    case "weather":
      return {
        primary: "24°",
        primaryLabel: "北京·晴",
        secondary: [
          { label: "湿度", value: "42%" },
          { label: "风速", value: "3 级" },
          { label: "空气质量", value: "良" },
        ],
      };
    case "todo":
      return {
        primary: "5/8",
        primaryLabel: "今日完成",
        secondary: [
          { label: "需求评审", value: "已完成" },
          { label: "联调测试", value: "进行中" },
          { label: "上线发布", value: "待开始" },
        ],
      };
    case "announcement":
      return {
        primary: "2 条新公告",
        primaryLabel: "未读",
        secondary: [
          { label: "v2.4.0 上线说明", value: "新" },
          { label: "周末维护通知", value: "" },
          { label: "安全升级提醒", value: "重要" },
        ],
      };
    case "system-info":
      return {
        primary: "正常运行",
        primaryLabel: "当前环境",
        secondary: [
          { label: "浏览器", value: "Chrome" },
          { label: "屏幕", value: "1920×1080" },
          { label: "在线时长", value: "3h 24m" },
        ],
      };
    case "chart":
      return {
        primary: "↑ 12.4%",
        primaryLabel: "近 7 日访问",
        secondary: [
          { label: "周一", value: "82" },
          { label: "周二", value: "94" },
          { label: "周三", value: "76" },
          { label: "周四", value: "108" },
          { label: "周五", value: "121" },
          { label: "周六", value: "65" },
          { label: "周日", value: "73" },
        ],
      };
    default:
      return {
        primary: "—",
        primaryLabel: props.widget.title,
        secondary: [],
      };
  }
});
</script>

<template>
  <div class="widget-card">
    <div class="widget-card__header">
      <span class="widget-card__title">{{ widget.title }}</span>
      <span class="widget-card__handle" aria-hidden="true">⋮⋮</span>
    </div>
    <div class="widget-card__body">
      <div class="widget-card__primary-num">{{ cardBody.primary }}</div>
      <div class="widget-card__primary-label">{{ cardBody.primaryLabel }}</div>
      <ul v-if="cardBody.secondary.length" class="widget-card__list">
        <li v-for="(item, idx) in cardBody.secondary" :key="idx">
          <span class="widget-card__list-label">{{ item.label }}</span>
          <span class="widget-card__list-value">{{ item.value }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.widget-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px 14px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  box-sizing: border-box;
  user-select: none;
  overflow: hidden;
}

.widget-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.widget-card__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.widget-card__handle {
  cursor: grab;
  color: var(--el-text-color-placeholder);
  font-size: 14px;
  letter-spacing: -2px;
  &:active {
    cursor: grabbing;
  }
}

.widget-card__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.widget-card__primary-num {
  font-size: 24px;
  font-weight: 700;
  color: var(--el-color-primary);
  line-height: 1.2;
}

.widget-card__primary-label {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.widget-card__list {
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
  flex: 1;
  overflow: auto;

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 0;
    border-bottom: 1px dashed var(--el-border-color-lighter);
    font-size: 12px;

    &:last-child {
      border-bottom: none;
    }
  }
}

.widget-card__list-label {
  color: var(--el-text-color-regular);
}

.widget-card__list-value {
  color: var(--el-text-color-primary);
  font-weight: 500;
}
</style>

<script setup>
/**
 * 每日一句部件
 * @author CH
 * @date 2024-12-10
 * @version 1.0.1
 */
import { reactive, onMounted } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

const env = reactive({
  date: new Date(),
  day: "",
  month: "",
  week: "",
});

const updateDate = () => {
  const now = new Date();
  env.date = now;
  env.day = now.getDate();
  env.month = now.getMonth() + 1;
  const weeks = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  env.week = weeks[now.getDay()];
};

onMounted(() => {
  updateDate();
});
</script>

<template>
  <div class="day-card">
    <div class="calendar-top">
      <span class="month-text">{{ env.month }}月</span>
    </div>
    <div class="calendar-body">
      <div class="day-number">{{ env.day }}</div>
      <div class="week-text">{{ env.week }}</div>
    </div>
    <div class="decoration"></div>
  </div>
</template>

<style scoped lang="scss">
.day-card {
  width: 100%;
  height: 100%;
  background: var(--el-bg-color);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--el-border-color-lighter);
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-2px);
  }
}

.calendar-top {
  background: #f56c6c;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 13px;
}

.calendar-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px;
  
  .day-number {
    font-size: 42px;
    font-weight: 800;
    color: var(--el-text-color-primary);
    line-height: 1;
  }
  
  .week-text {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
    font-weight: 500;
  }
}

.decoration {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 4px;
  height: 4px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  box-shadow: 140px 0 0 rgba(255, 255, 255, 0.5);
}
</style>

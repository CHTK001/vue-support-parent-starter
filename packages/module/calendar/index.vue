<script setup>
import { ref, computed } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

const currentDate = ref(new Date());

const calendarValue = computed({
  get: () => currentDate.value,
  set: (val) => {
    currentDate.value = val;
  }
});
</script>

<template>
  <div class="calendar-card">
    <div class="card-header">
      <div class="header-left">
        <IconifyIconOnline icon="ri:calendar-line" class="header-icon" />
        <span class="title">日历</span>
      </div>
      <div class="header-right">
        <span class="current-ym">{{ currentDate.getFullYear() }}年{{ currentDate.getMonth() + 1 }}月</span>
      </div>
    </div>
    
    <div class="card-content">
      <el-calendar v-model="calendarValue">
        <template #header="{ date }">
          <!-- Hide default header to save space or customize it -->
          <div style="display: none"></div>
        </template>
        <template #date-cell="{ data }">
          <div class="custom-date-cell" :class="{ 'is-selected': data.isSelected, 'is-today': data.day === new Date().toISOString().split('T')[0] }">
            <span class="day-number">{{ data.day.split('-').slice(2).join('') }}</span>
            <div class="day-content"></div>
          </div>
        </template>
      </el-calendar>
    </div>
  </div>
</template>

<style scoped lang="scss">
.calendar-card {
  width: 100%;
  height: 100%;
  background: var(--el-bg-color);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.card-header {
  height: 48px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color-overlay);
  flex-shrink: 0;

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .header-icon {
      font-size: 18px;
      color: var(--el-color-primary);
    }
    
    .title {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }
  
  .header-right {
    .current-ym {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-regular);
    }
  }
}

.card-content {
  flex: 1;
  overflow: hidden;
  padding: 0;
  
  :deep(.el-calendar) {
    --el-calendar-cell-width: 30px;
    background-color: transparent;
  }

  :deep(.el-calendar__header) {
    display: none;
  }

  :deep(.el-calendar__body) {
    padding: 10px;
    height: 100%;
  }

  :deep(.el-calendar-table) {
    height: 100%;
    
    thead th {
      padding: 6px 0;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
    
    td {
      border: none;
      padding: 2px;
    }
    
    .el-calendar-day {
      height: 100%;
      padding: 0;
      min-height: 32px;
      
      &:hover {
        background-color: transparent;
      }
    }
  }
}

.custom-date-cell {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: var(--el-fill-color);
  }
  
  &.is-selected {
    background-color: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-weight: bold;
  }
  
  &.is-today {
    .day-number {
      background-color: var(--el-color-primary);
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
  
  .day-number {
    font-size: 13px;
  }
}
</style>

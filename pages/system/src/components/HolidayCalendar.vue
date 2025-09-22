<script setup lang="ts">
import { ref, watch } from "vue";
import type { SysHoliday } from "../api/holiday";
import { Solar, Lunar, Holiday } from "lunisolar";

/**
 * 节假日日历组件
 * @author CH
 * @since 2025/1/20
 * @version 1.0.0
 */

// 组件属性
interface Props {
  /** 节假日数据 */
  holidayData: SysHoliday[];
  /** 当前年份 */
  currentYear: number;
}

const props = withDefaults(defineProps<Props>(), {
  holidayData: () => [],
  currentYear: new Date().getFullYear(),
});

// 组件事件
const emit = defineEmits<{
  yearChange: [year: number];
}>();

// 响应式数据
const selectedDate = ref(new Date());
const calendarData = ref<SysHoliday[]>([]);

/**
 * 监听年份变化
 */
watch(
  () => props.currentYear,
  (newYear) => {
    selectedDate.value = new Date(newYear, selectedDate.value.getMonth(), selectedDate.value.getDate());
  }
);

/**
 * 监听节假日数据变化
 */
watch(
  () => props.holidayData,
  (newData) => {
    calendarData.value = newData;
  },
  { immediate: true }
);

/**
 * 日历日期变化处理
 * @param date 选中的日期
 */
const handleDateChange = (date: Date) => {
  selectedDate.value = date;
  emit("yearChange", date.getFullYear());
};

/**
 * 获取日期的节假日信息
 * @param date 日期
 */
const getHolidayInfo = (date: Date) => {
  const dateString = date.toISOString().split("T")[0];
  return calendarData.value.find((h) => h.sysHolidayDate === dateString);
};

/**
 * 获取农历信息
 * @param date 日期
 */
const getLunarInfo = (date: Date) => {
  try {
    const solar = Solar.fromDate(date);
    const lunar = solar.getLunar();
    const ganzhi = lunar.getGanZhiYear() + lunar.getGanZhiMonth() + lunar.getGanZhiDay();
    
    // 获取节气
    const jq = solar.getJieQi();
    
    // 获取传统节日
    const festival = lunar.getDayPei() === "初一" ? lunar.getMonthInChinese() + "月" : "";
    
    return {
      ganzhi,
      lunarDate: lunar.getDayInChinese(),
      month: lunar.getMonthInChinese(),
      jq,
      festival
    };
  } catch (error) {
    console.error("获取农历信息失败:", error);
    return null;
  }
};

/**
 * 自定义日期单元格内容
 * @param date 日期
 */
const customDateCell = (date: Date) => {
  const holiday = getHolidayInfo(date);
  const lunarInfo = getLunarInfo(date);
  
  return {
    holiday,
    isHoliday: holiday?.sysHolidayIsHoliday || false,
    isWorkday: holiday && !holiday.sysHolidayIsHoliday,
    holidayName: holiday?.sysHolidayName || "",
    lunarInfo
  };
};

/**
 * 获取节假日信息显示文本
 * @param holiday 节假日信息
 */
const getHolidayText = (holiday: SysHoliday | null) => {
  if (!holiday) return "";

  // 如果名称过长，进行截取
  const name = holiday.sysHolidayName;
  return name.length > 4 ? name.substring(0, 4) + "..." : name;
};

/**
 * 获取农历信息显示文本
 * @param lunarInfo 农历信息
 */
const getLunarText = (lunarInfo: any) => {
  if (!lunarInfo) return "";
  
  // 如果是节气，显示节气
  if (lunarInfo.jq) {
    return lunarInfo.jq;
  }
  
  // 如果是初一，显示月份
  if (lunarInfo.lunarDate === "初一") {
    return lunarInfo.month + "月";
  }
  
  // 显示农历日期
  return lunarInfo.lunarDate;
};

/**
 * 更新节假日数据（供父组件调用）
 * @param data 节假日数据
 */
const updateHolidayData = (data: SysHoliday[]) => {
  calendarData.value = data;
};

// 暴露方法给父组件
defineExpose({
  updateHolidayData,
});
</script>

<template>
  <div class="holiday-calendar">
    <!-- Element Plus 日历组件 -->
    <el-calendar v-model="selectedDate" @input="handleDateChange">
      <!-- 自定义日期单元格 -->
      <template #date-cell="{ data }">
        <div
          class="custom-date-cell"
          :class="{
            'is-holiday': customDateCell(data.date).isHoliday,
            'is-workday': customDateCell(data.date).isWorkday,
          }"
        >
          <!-- 日期数字 -->
          <div class="date-number">
            {{ data.date.getDate() }}
          </div>

          <!-- 农历信息 -->
          <div class="lunar-info">
            {{ getLunarText(customDateCell(data.date).lunarInfo) }}
          </div>

          <!-- 节假日信息 -->
          <div v-if="customDateCell(data.date).holiday" class="holiday-info">
            <div class="holiday-name">
              {{ getHolidayText(customDateCell(data.date).holiday) }}
            </div>
          </div>
        </div>
      </template>
    </el-calendar>

    <!-- 图例 -->
    <div class="calendar-legend">
      <div class="legend-title">图例说明</div>
      <div class="legend-items">
        <div class="legend-item">
          <div class="legend-color holiday"></div>
          <span>节假日</span>
        </div>
        <div class="legend-item">
          <div class="legend-color workday"></div>
          <span>调休工作日</span>
        </div>
        <div class="legend-item">
          <div class="legend-color today"></div>
          <span>今天</span>
        </div>
        <div class="legend-item">
          <div class="legend-color lunar"></div>
          <span>农历/节气</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.holiday-calendar {
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  // Element Plus 日历组件样式覆盖
  :deep(.el-calendar) {
    .el-calendar__body {
      .el-calendar-table {
        .el-calendar-day {
          padding: 0;

          .custom-date-cell {
            min-height: 80px;
            padding: 8px;
            display: flex;
            flex-direction: column;
            position: relative;
            transition: all 0.3s ease;

            &.is-holiday {
              background: var(--el-color-danger-light-9);
              border-radius: 4px;

              .holiday-info {
                .holiday-name {
                  background: var(--el-color-danger);
                  color: var(--el-text-color-primary);
                }
              }
            }

            &.is-workday {
              background: var(--el-color-warning-light-9);
              border-radius: 4px;

              .holiday-info {
                .holiday-name {
                  background: var(--el-color-warning);
                  color: var(--el-text-color-primary);
                }
              }
            }

            .date-number {
              font-size: 16px;
              font-weight: 500;
              color: var(--el-text-color-primary);
              margin-bottom: 4px;
            }

            .lunar-info {
              font-size: 10px;
              color: var(--el-text-color-secondary);
              margin-bottom: 2px;
              height: 14px;
            }

            .holiday-info {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;

              .holiday-name {
                font-size: 10px;
                padding: 2px 4px;
                border-radius: 2px;
                text-align: center;
                line-height: 1.2;
                word-break: break-all;
              }
            }
          }
        }
      }
    }
  }

  .calendar-legend {
    margin-top: 20px;
    padding: 16px;
    background: var(--el-fill-color-extra-light);
    border-radius: 6px;

    .legend-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin-bottom: 12px;
    }

    .legend-items {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;

      .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--el-text-color-regular);

        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 3px;
          border: 1px solid var(--el-border-color);

          &.holiday {
            background: var(--el-color-danger-light-9);
            border-color: var(--el-color-danger-light-5);
          }

          &.workday {
            background: var(--el-color-warning-light-9);
            border-color: var(--el-color-warning-light-5);
          }

          &.today {
            background: var(--el-color-primary-light-9);
            border-color: var(--el-color-primary);
          }

          &.lunar {
            background: var(--el-color-success-light-9);
            border-color: var(--el-color-success-light-5);
          }
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .holiday-calendar {
    padding: 16px;

    :deep(.el-calendar) {
      .el-calendar__body {
        .el-calendar-table {
          .el-calendar-day {
            .custom-date-cell {
              min-height: 60px;
              padding: 4px;

              .date-number {
                font-size: 14px;
              }

              .lunar-info {
                font-size: 9px;
                height: 12px;
              }

              .holiday-info {
                .holiday-name {
                  font-size: 9px;
                }
              }
            }
          }
        }
      }
    }

    .calendar-legend {
      .legend-items {
        gap: 12px;

        .legend-item {
          font-size: 11px;

          .legend-color {
            width: 14px;
            height: 14px;
          }
        }
      }
    }
  }
}
</style>
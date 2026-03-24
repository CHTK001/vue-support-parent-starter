<script setup lang="ts">
import Calendar from "@iconify-icons/ep/calendar";
import Refresh from "@iconify-icons/line-md/backup-restore";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import ScFilterBar from "@repo/components/ScFilterBar/index.vue";
import { message } from "@repo/utils";
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onMounted,
  reactive,
  ref,
} from "vue";
import {
  fetchHolidayList,
  syncHolidayData,
  type SysHoliday,
} from "../api/holiday";
/**
 * 节假日管理主页面
 * @author CH
 * @since 2025/1/20
 * @version 1.0.0
 */

// 异步加载组件
const HolidayCalendar = defineAsyncComponent(
  () => import("./HolidayCalendar.vue")
);

// 响应式数据
const tableRef = ref(null);
const calendarRef = ref(null);
const loading = ref(false);
const syncLoading = ref(false);
const currentYear = ref(new Date().getFullYear());
const viewMode = ref<"table" | "calendar">("table");
const posterMode = ref(true);
// 海报模式开关
const showHolidayCountdown = ref(true);
const showWorkCountdown = ref(true);

// 查询参数
const params = reactive({
  year: currentYear.value,
});

// 节假日数据
const holidayData = ref<SysHoliday[]>([]);

/**
 * 计算距离今天的天数
 * @param dateStr 日期字符串
 * @returns 天数差（正数为未来，负数为过去）
 */
const getDaysFromToday = (dateStr: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(dateStr);
  targetDate.setHours(0, 0, 0, 0);
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * 排序后的节假日数据（倒序）
 */
const sortedHolidayData = computed(() => {
  return [...holidayData.value].sort((a, b) => {
    return (
      new Date(b.sysHolidayDate).getTime() -
      new Date(a.sysHolidayDate).getTime()
    );
  });
});

/**
 * 最近的未来节假日
 */
const nearestFutureHoliday = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const futureHolidays = holidayData.value
    .filter((h) => new Date(h.sysHolidayDate) >= today)
    .sort(
      (a, b) =>
        new Date(a.sysHolidayDate).getTime() -
        new Date(b.sysHolidayDate).getTime()
    );
  return futureHolidays.length > 0 ? futureHolidays[0] : null;
});

/**
 * 判断是否为最近的未来节假日
 */
const isNearestFuture = (row: SysHoliday): boolean => {
  return nearestFutureHoliday.value?.sysHolidayDate === row.sysHolidayDate;
};

/**
 * 判断是否为未来日期
 */
const isFutureDate = (dateStr: string): boolean => {
  return getDaysFromToday(dateStr) > 0;
};

// 搜索列配置（ScFilterBar格式）
const filterOptions = reactive<any>([
  {
    label: "年份",
    value: "year",
    placeholder: "请选择年份",
    type: "select",
    extend: {
      data: Array.from({ length: 50 }, (_, i) => ({
        label: (currentYear.value - 5 + i).toString(),
        value: currentYear.value - 5 + i,
      })),
    },
  },
]);

/**
 * 搜索节假日数据
 * @param query 查询参数
 * @author CH
 * @since 2025/1/20
 */
const onSearch = async (query?: any) => {
  try {
    loading.value = true;
    const searchParams = { ...params, ...query };

    const { data, code } = await fetchHolidayList(searchParams);

    if (code === "00000" && data) {
      holidayData.value = data;

      // 如果是日历视图，更新日历数据
      if (viewMode.value === "calendar" && calendarRef.value) {
        calendarRef.value.updateHolidayData(data);
      }

      message("查询成功", { type: "success" });
    } else {
      message("查询失败", { type: "error" });
    }
  } catch (error) {
    console.error("查询节假日失败:", error);
    message("查询节假日失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

/**
 * 同步节假日数据
 * @author CH
 * @since 2025/1/20
 */
const handleSync = async () => {
  try {
    syncLoading.value = true;

    const { data, code } = await syncHolidayData();

    if (code === "00000" && data) {
      message("同步成功", { type: "success" });
      // 同步成功后重新查询数据
      await onSearch();
    } else {
      message("同步失败", { type: "error" });
    }
  } catch (error) {
    console.error("同步节假日失败:", error);
    message("同步节假日失败", { type: "error" });
  } finally {
    syncLoading.value = false;
  }
};

/**
 * 切换视图模式
 * @param mode 视图模式
 * @author CH
 * @since 2025/1/20
 */
const switchViewMode = (mode: "table" | "calendar") => {
  viewMode.value = mode;

  if (mode === "calendar") {
    nextTick(() => {
      if (calendarRef.value) {
        calendarRef.value.updateHolidayData(holidayData.value);
      }
    });
  }
};

/**
 * 格式化日期显示
 * @param date 日期字符串
 * @returns 格式化后的日期
 * @author CH
 * @since 2025/1/20
 */
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("zh-CN");
};

/**
 * 获取节假日类型标签
 * @param isHoliday 是否为节假日
 * @returns 标签类型
 * @author CH
 * @since 2025/1/20
 */
const getHolidayTagType = (isHoliday: boolean) => {
  return isHoliday ? "danger" : "success";
};

/**
 * 获取节假日类型文本
 * @param isHoliday 是否为节假日
 * @returns 类型文本
 * @author CH
 * @since 2025/1/20
 */
const getHolidayText = (isHoliday: boolean) => {
  return isHoliday ? "节假日" : "工作日";
};

// 组件挂载时初始化数据
onMounted(() => {
  onSearch();
});
</script>

<template>
  <div class="h-full holiday-container system-container modern-bg">
    <el-container>
      <el-main class="nopadding">
        <el-container>
          <!-- 头部搜索区域 -->
          <el-header class="h-[70px]">
            <div class="flex justify-between items-center h-full">
              <!-- 操作按钮区域 -->
              <div class="flex items-center gap-2 ml-4">
                <!-- 视图切换按钮 -->
                <el-button-group>
                  <ScButton 
                    :type="viewMode === 'table' ? 'primary' : 'default'"
                    @click="switchViewMode('table')"
                  >
                    <ScIcon><ep-list /></ScIcon>
                    列表
                  </ScButton>
                  <ScButton 
                    :type="viewMode === 'calendar' ? 'primary' : 'default'"
                    @click="switchViewMode('calendar')"
                  >
                    <ScIcon 
                      ><component :is="useRenderIcon(Calendar)"
                    /></ScIcon>
                    日历
                  </ScButton>
                </el-button-group>

                <!-- 海报模式切换 -->
                <ScButton 
                  v-if="viewMode === 'calendar'"
                  :type="posterMode ? 'success' : 'default'"
                  @click="posterMode = !posterMode"
                >
                  <IconifyIconOnline icon="mdi:image-frame" />
                  海报
                </ScButton>

                <!-- 海报模式开关 -->
                <ScPopover 
                  v-if="viewMode === 'calendar' && posterMode"
                  placement="bottom"
                  :width="200"
                  trigger="click"
                >
                  <template #reference>
                    <ScButton>
                      <IconifyIconOnline icon="ep:setting" />
                    </ScButton>
                  </template>
                  <div class="poster-settings">
                    <div class="setting-item">
                      <span>放假倒计时</span>
                      <ScSwitch v-model="showHolidayCountdown" size="small" />
                    </div>
                    <div class="setting-item">
                      <span>下班倒计时</span>
                      <ScSwitch v-model="showWorkCountdown" size="small" />
                    </div>
                  </div>
                </ScPopover>

                <!-- 同步按钮 -->
                <ScButton 
                  v-auth="'holiday:sync'"
                  type="primary"
                  :loading="syncLoading"
                  @click="handleSync"
                >
                  <ScIcon><component :is="useRenderIcon(Refresh)" /></ScIcon>
                </ScButton>
              </div>

              <div class="flex-1 flex items-center">
                <div class="w-full flex items-center flex-1">
                  <ScFilterBar
                    :options="filterOptions"
                    :show-number="4"
                    @search="onSearch"
                  />
                </div>
              </div>
            </div>
          </el-header>

          <!-- 主内容区域 -->
          <el-main class="thin-scroller">
            <!-- 表格视图 -->
            <div
              v-if="viewMode === 'table'"
              v-loading="loading"
              class="thin-scroller"
            >
              <ScTable 
                :data="sortedHolidayData"
                border
                stripe
                style="width: 100%"
                empty-text="暂无节假日数据"
                :row-class-name="
                  ({ row }) =>
                    isNearestFuture(row) ? 'nearest-future-row' : ''
                "
              >
                <ScTableColumn 
                  label="序号"
                  type="index"
                  align="center"
                  width="60px"
                />

                <ScTableColumn 
                  prop="sysHolidayYear"
                  label="年份"
                  align="center"
                  width="100px"
                />

                <ScTableColumn 
                  prop="sysHolidayDate"
                  label="日期"
                  align="center"
                  width="180px"
                >
                  <template #default="{ row }">
                    <div class="date-cell">
                      <span>{{ formatDate(row.sysHolidayDate) }}</span>
                      <ScTag 
                        v-if="isNearestFuture(row)"
                        type="success"
                        size="small"
                        effect="dark"
                        class="countdown-tag"
                      >
                        还剩 {{ getDaysFromToday(row.sysHolidayDate) }} 天
                      </ScTag>
                    </div>
                  </template>
                </ScTableColumn>

                <ScTableColumn 
                  prop="sysHolidayName"
                  label="节假日名称"
                  align="center"
                  min-width="150px"
                >
                  <template #default="{ row }">
                    <ScTag 
                      :type="getHolidayTagType(row.sysHolidayIsHoliday)"
                      effect="dark"
                      size="small"
                    >
                      {{ row.sysHolidayName }}
                    </ScTag>
                  </template>
                </ScTableColumn>

                <ScTableColumn 
                  prop="sysHolidayIsHoliday"
                  label="类型"
                  align="center"
                  width="100px"
                >
                  <template #default="{ row }">
                    <ScTag 
                      :type="getHolidayTagType(row.sysHolidayIsHoliday)"
                      effect="plain"
                      size="small"
                    >
                      {{ getHolidayText(row.sysHolidayIsHoliday) }}
                    </ScTag>
                  </template>
                </ScTableColumn>
              </ScTable>
            </div>

            <!-- 日历视图 -->
            <div
              v-else-if="viewMode === 'calendar'"
              v-loading="loading"
              :class="{ 'poster-container': posterMode }"
            >
              <HolidayCalendar
                ref="calendarRef"
                :holiday-data="holidayData"
                :current-year="params.year"
                :poster-mode="posterMode"
                :show-holiday-countdown="showHolidayCountdown"
                :show-work-countdown="showWorkCountdown"
                @year-change="
                  (year) => {
                    params.year = year;
                    onSearch();
                  }
                "
              />
            </div>
          </el-main>
        </el-container>
      </el-main>
    </el-container>
  </div>
</template>

<style scoped lang="scss">
.holiday-container {
  height: 100%;
  background-color: var(--el-bg-color);
  border-radius: 12px;
  overflow: hidden;

  .el-header {
    border-bottom: 1px solid var(--el-border-color-lighter);
    padding: 16px 24px;
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-9) 0%,
      var(--el-bg-color-overlay) 100%
    );
    height: auto !important;
  }

  .nopadding {
    padding: 0;
  }
}

:deep(.el-main) {
  padding: 24px;
  background-color: var(--el-bg-color);
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;

  .el-table__header {
    th {
      background-color: var(--el-fill-color-light) !important;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .el-table__row {
    transition: all 0.2s ease;

    &:hover {
      background-color: var(--el-color-primary-light-9) !important;
    }
  }
}

:deep(.el-tag) {
  border-radius: 6px;
  font-weight: 500;
}

:deep(.el-button-group) {
  .el-button {
    border-radius: 0;
    transition: all 0.2s ease;

    &:first-child {
      border-top-left-radius: 8px;
      border-bottom-left-radius: 8px;
    }

    &:last-child {
      border-top-right-radius: 8px;
      border-bottom-right-radius: 8px;
    }

    &:hover {
      transform: translateY(-1px);
    }
  }
}

:deep(.el-input) {
  .el-input__wrapper {
    border-radius: 8px;
  }
}

:deep(.el-select) {
  .el-select__wrapper {
    border-radius: 8px;
  }
}

// 最近未来节假日行高亮
:deep(.nearest-future-row) {
  background: rgba(var(--el-color-success-rgb), 0.1) !important;

  td {
    border-color: rgba(var(--el-color-success-rgb), 0.2) !important;
  }
}

.date-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.countdown-tag {
  font-size: 11px;
  padding: 2px 6px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

// 海报模式容器
.poster-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: calc(100vh - 150px);
  border-radius: 16px;
}

// 海报设置弹窗
.poster-settings {
  .setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;

    &:not(:last-child) {
      border-bottom: 1px solid var(--el-border-color-lighter);
    }

    span {
      font-size: 14px;
      color: var(--el-text-color-primary);
    }
  }
}
</style>

<script setup lang="ts">
import Calendar from "@iconify-icons/ep/calendar";
import Refresh from "@iconify-icons/line-md/backup-restore";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import ScSearch from "@repo/components/ScSearch/index.vue";
import { message } from "@repo/utils";
import { defineAsyncComponent, nextTick, onMounted, reactive, ref } from "vue";
import { fetchHolidayList, syncHolidayData, type SysHoliday } from "../api/holiday";
/**
 * 节假日管理主页面
 * @author CH
 * @since 2025/1/20
 * @version 1.0.0
 */

// 异步加载组件
const HolidayCalendar = defineAsyncComponent(() => import("./HolidayCalendar.vue"));

// 响应式数据
const tableRef = ref(null);
const calendarRef = ref(null);
const loading = ref(false);
const syncLoading = ref(false);
const currentYear = ref(new Date().getFullYear());
const viewMode = ref<"table" | "calendar">("table");

// 查询参数
const params = reactive({
  year: currentYear.value,
});

// 节假日数据
const holidayData = ref<SysHoliday[]>([]);

// 搜索列配置
const columns = reactive<any>([
  {
    label: "年份",
    prop: "year",
    placeholder: "请选择年份",
    width: "200px",
    type: "select",
    children: [
      ...Array.from({ length: 50 }, (_, i) => ({
        label: (currentYear.value - 5 + i).toString(),
        value: currentYear.value - 5 + i,
      })),
    ],
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
  <div class="h-full holiday-container">
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
                  <el-button :type="viewMode === 'table' ? 'primary' : 'default'" @click="switchViewMode('table')">
                    <el-icon><ep-list /></el-icon>
                    列表视图
                  </el-button>
                  <el-button :type="viewMode === 'calendar' ? 'primary' : 'default'" @click="switchViewMode('calendar')">
                    <el-icon><component :is="useRenderIcon(Calendar)" /></el-icon>
                    日历视图
                  </el-button>
                </el-button-group>

                <!-- 同步按钮 -->
                <el-button type="primary" :loading="syncLoading" @click="handleSync">
                  <el-icon><component :is="useRenderIcon(Refresh)" /></el-icon>
                </el-button>
              </div>

              <div class="flex-1 flex items-center">
                <div class="w-full flex items-center flex-1">
                  <ScSearch :columns="columns" :onSearch="onSearch" :show-number="4" :loading="loading" />
                </div>
              </div>
            </div>
          </el-header>

          <!-- 主内容区域 -->
          <el-main>
            <!-- 表格视图 -->
            <div v-if="viewMode === 'table'" v-loading="loading">
              <el-table :data="holidayData" border stripe style="width: 100%" empty-text="暂无节假日数据">
                <el-table-column label="序号" type="index" align="center" width="60px" />

                <el-table-column prop="sysHolidayYear" label="年份" align="center" width="100px" />

                <el-table-column prop="sysHolidayDate" label="日期" align="center" width="120px">
                  <template #default="{ row }">
                    {{ formatDate(row.sysHolidayDate) }}
                  </template>
                </el-table-column>

                <el-table-column prop="sysHolidayName" label="节假日名称" align="center" min-width="150px">
                  <template #default="{ row }">
                    <el-tag :type="getHolidayTagType(row.sysHolidayIsHoliday)" effect="dark" size="small">
                      {{ row.sysHolidayName }}
                    </el-tag>
                  </template>
                </el-table-column>

                <el-table-column prop="sysHolidayIsHoliday" label="类型" align="center" width="100px">
                  <template #default="{ row }">
                    <el-tag :type="getHolidayTagType(row.sysHolidayIsHoliday)" effect="plain" size="small">
                      {{ getHolidayText(row.sysHolidayIsHoliday) }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <!-- 日历视图 -->
            <div v-else-if="viewMode === 'calendar'" v-loading="loading">
              <HolidayCalendar
                ref="calendarRef"
                :holiday-data="holidayData"
                :current-year="params.year"
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
  .el-header {
    border-bottom: 1px solid var(--el-border-color);
    padding: 0 20px;
  }

  .el-main {
    padding: 20px;
  }

  .nopadding {
    padding: 0;
  }
}

:deep(.el-table) {
  .el-table__header {
    th {
      background-color: var(--el-fill-color-light);
    }
  }
}

:deep(.el-button-group) {
  .el-button {
    border-radius: 0;

    &:first-child {
      border-top-left-radius: 4px;
      border-bottom-left-radius: 4px;
    }

    &:last-child {
      border-top-right-radius: 4px;
      border-bottom-right-radius: 4px;
    }
  }
}
</style>

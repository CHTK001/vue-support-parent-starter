<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";
import type { SysHoliday } from "../api/holiday";
// @ts-ignore
import lunisolar from "lunisolar";
import { dayjs } from "element-plus";
// @ts-ignore
dayjs.en.weekStart = 1;
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
const isDarkMode = ref(false);

// 节气图片映射（使用更具体的关键词来获取相关图片）
const solarTermImages = {
  "立春": "https://source.unsplash.com/400x300/?spring,festival,flowers,china",
  "雨水": "https://mmbiz.qpic.cn/mmbiz_png/oq1PymRl9D720iccCopSWQBe0OTMU4nz8yOslfuUgibbKXoGdJXf04Ur9AsheoIdTzicURqeG0AV37BMvUcd7WogQ/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1#imgIndex=4",
  "惊蛰": "https://mmbiz.qpic.cn/mmbiz_png/oq1PymRl9D720iccCopSWQBe0OTMU4nz8KuOEwSG6Zrf9Bh02icnJDsnjr5G7wqkqJAn6ULQ6MahETP81dwMkfdA/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1#imgIndex=6",
  "春分": "https://mmbiz.qpic.cn/mmbiz_png/oq1PymRl9D720iccCopSWQBe0OTMU4nz8KuOEwSG6Zrf9Bh02icnJDsnjr5G7wqkqJAn6ULQ6MahETP81dwMkfdA/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1#imgIndex=6",
  "清明": "https://source.unsplash.com/400x300/?tomb-sweeping,clear,bright,spring,memorial",
  "谷雨": "https://source.unsplash.com/400x300/?grain,rain,agriculture,spring,crops",
  "立夏": "https://source.unsplash.com/400x300/?summer,beginning,hot,china",
  "小满": "https://source.unsplash.com/400x300/?grain,filling,summer,crops",
  "芒种": "https://source.unsplash.com/400x300/?wheat,planting,summer,agriculture",
  "夏至": "https://source.unsplash.com/400x300/?summer,solstice,longest-day,sun",
  "小暑": "https://source.unsplash.com/400x300/?heat,summer,hot,temperature",
  "大暑": "https://source.unsplash.com/400x300/?great-heat,summer,hot,temperature",
  "立秋": "https://source.unsplash.com/400x300/?autumn,beginning,fall,leaves",
  "处暑": "https://source.unsplash.com/400x300/?end-heat,autumn,cooling,transition",
  "白露": "https://source.unsplash.com/400x300/?white-dew,dew,autumn,morning",
  "秋分": "https://source.unsplash.com/400x300/?autumn,equinox,balance,fall,leaves",
  "寒露": "https://pics3.baidu.com/feed/8ad4b31c8701a18b4d3fc01058299a052938feaa.jpeg",
  "霜降": "https://source.unsplash.com/400x300/?frost,autumn,falling,ice",
  "立冬": "https://source.unsplash.com/400x300/?winter,beginning,cold,snow",
  "小雪": "https://source.unsplash.com/400x300/?light-snow,winter,snowflake,soft",
  "大雪": "https://source.unsplash.com/400x300/?heavy-snow,winter,snow,blizzard",
  "冬至": "https://source.unsplash.com/400x300/?winter,solstice,shortest-day,sun",
  "小寒": "https://source.unsplash.com/400x300/?slight-cold,winter,chilly,temperature",
  "大寒": "https://source.unsplash.com/400x300/?severe-cold,winter,freezing,temperature"
};

// 节气背景映射（后备颜色）
const solarTermBackgrounds = {
  "立春": "linear-gradient(135deg, var(--solar-term-lc, #ff9a9e) 0%, var(--solar-term-lc-light, #fad0c4) 100%)",
  "雨水": "linear-gradient(135deg, var(--solar-term-ys, #a1c4fd) 0%, var(--solar-term-ys-light, #c2e9fb) 100%)",
  "惊蛰": "linear-gradient(135deg, var(--solar-term-jz, #d4fc79) 0%, var(--solar-term-jz-light, #96e6a1) 100%)",
  "春分": "linear-gradient(135deg, var(--solar-term-cf, #f6d365) 0%, var(--solar-term-cf-light, #fda085) 100%)",
  "清明": "linear-gradient(135deg, var(--solar-term-qm, #84fab0) 0%, var(--solar-term-qm-light, #8fd3f4) 100%)",
  "谷雨": "linear-gradient(135deg, var(--solar-term-gy, #cfd9df) 0%, var(--solar-term-gy-light, #e2ebf0) 100%)",
  "立夏": "linear-gradient(135deg, var(--solar-term-lx, #ffecd2) 0%, var(--solar-term-lx-light, #fcb69f) 100%)",
  "小满": "linear-gradient(135deg, var(--solar-term-xm, #ff9a9e) 0%, var(--solar-term-xm-light, #fecfef) 100%)",
  "芒种": "linear-gradient(135deg, var(--solar-term-mz, #fad0c4) 0%, var(--solar-term-mz-light, #ffd1ff) 100%)",
  "夏至": "linear-gradient(135deg, var(--solar-term-xz, #a1c4fd) 0%, var(--solar-term-xz-light, #c2e9fb) 100%)",
  "小暑": "linear-gradient(135deg, var(--solar-term-xs, #d299c2) 0%, var(--solar-term-xs-light, #fef9d7) 100%)",
  "大暑": "linear-gradient(135deg, var(--solar-term-ds, #e0c3fc) 0%, var(--solar-term-ds-light, #8ec5fc) 100%)",
  "立秋": "linear-gradient(135deg, var(--solar-term-lq, #f093fb) 0%, var(--solar-term-lq-light, #f5576c) 100%)",
  "处暑": "linear-gradient(135deg, var(--solar-term-cs, #5ee7df) 0%, var(--solar-term-cs-light, #b490ca) 100%)",
  "白露": "linear-gradient(135deg, var(--solar-term-bl, #d4fc79) 0%, var(--solar-term-bl-light, #96e6a1) 100%)",
  "秋分": "linear-gradient(135deg, var(--solar-term-qf, #f6d365) 0%, var(--solar-term-qf-light, #fda085) 100%)",
  "寒露": "linear-gradient(135deg, var(--solar-term-hl, #a8edea) 0%, var(--solar-term-hl-light, #fed6e3) 100%)",
  "霜降": "linear-gradient(135deg, var(--solar-term-sj, #ffecd2) 0%, var(--solar-term-sj-light, #fcb69f) 100%)",
  "立冬": "linear-gradient(135deg, var(--solar-term-ld, #a1c4fd) 0%, var(--solar-term-ld-light, #c2e9fb) 100%)",
  "小雪": "linear-gradient(135deg, var(--solar-term-xx, #84fab0) 0%, var(--solar-term-xx-light, #8fd3f4) 100%)",
  "大雪": "linear-gradient(135deg, var(--solar-term-dx, #cfd9df) 0%, var(--solar-term-dx-light, #e2ebf0) 100%)",
  "冬至": "linear-gradient(135deg, var(--solar-term-dz, #d299c2) 0%, var(--solar-term-dz-light, #fef9d7) 100%)",
  "小寒": "linear-gradient(135deg, var(--solar-term-xh, #e0c3fc) 0%, var(--solar-term-xh-light, #8ec5fc) 100%)",
  "大寒": "linear-gradient(135deg, var(--solar-term-dh, #f093fb) 0%, var(--solar-term-dh-light, #f5576c) 100%)"
};

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
 * 检查是否为深色模式
 */
const checkDarkMode = () => {
  isDarkMode.value = document.documentElement.classList.contains('dark');
};

/**
 * 主题变化监听
 */
const handleThemeChange = () => {
  checkDarkMode();
};

onMounted(() => {
  checkDarkMode();
  // 监听主题变化
  const observer = new MutationObserver(handleThemeChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });
});

onUnmounted(() => {
  // 清理监听器
});

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
    const ls = lunisolar(date);
    const lunar = ls.lunar;
    
    // 获取节气
    const solarTerm = ls.solarTerm ? ls.solarTerm.toString() : null;
    
    // 获取农历日期
    const lunarDate = lunar.getDayName();
    
    // 获取月份信息
    const month = lunar.getMonthName();
    
    // 如果是初一，显示月份
    if (lunarDate === "初一") {
      return {
        text: month,
        isMonthFirst: true,
        isSolarTerm: false,
        solarTerm: solarTerm
      };
    }
    
    // 如果是节气日，显示节气
    if (solarTerm) {
      return {
        text: solarTerm,
        isMonthFirst: false,
        isSolarTerm: true,
        solarTerm: solarTerm
      };
    }
    
    // 普通农历日期
    return {
      text: lunarDate,
      isMonthFirst: false,
      isSolarTerm: false,
      solarTerm: solarTerm
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
  
  // 判断是否为今天
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  
  // 判断是否为下个月的日期
  const currentMonth = selectedDate.value.getMonth();
  const isNextMonth = date.getMonth() !== currentMonth;
  
  // 获取节气背景
  let solarTermBackground = "";
  let solarTermImage = "";
  if (lunarInfo?.isSolarTerm && lunarInfo?.solarTerm) {
    // 获取节气图片
    solarTermImage = solarTermImages[lunarInfo.solarTerm] || "";
    
    // 获取后备背景色
    solarTermBackground = solarTermBackgrounds[lunarInfo.solarTerm] || "";
  }
  
  return {
    holiday,
    isHoliday: holiday?.sysHolidayIsHoliday || false,
    isWorkday: holiday && !holiday.sysHolidayIsHoliday,
    holidayName: holiday?.sysHolidayName || "",
    lunarInfo,
    isToday,
    isNextMonth,
    solarTermBackground,
    solarTermImage
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
  return lunarInfo.text;
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
    <el-calendar v-model="selectedDate" @input="handleDateChange" :first-day-of-week="1" :show-week-number="true">
      <!-- 自定义日期单元格 -->
      <template #date-cell="{ data }">
        <div
          class="custom-date-cell"
          :class="{
            'is-holiday': customDateCell(data.date).isHoliday,
            'is-workday': customDateCell(data.date).isWorkday,
            'is-today': customDateCell(data.date).isToday,
            'is-next-month': customDateCell(data.date).isNextMonth,
            'is-solar-term': customDateCell(data.date).lunarInfo?.isSolarTerm,
            'dark-mode': isDarkMode
          }"
          :style="customDateCell(data.date).lunarInfo?.isSolarTerm ? { 
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1)), url(${customDateCell(data.date).solarTermImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          } : {}"
        >
          <!-- 日期数字 -->
          <div class="date-number">
            {{ data.date.getDate() }}
          </div>

          <!-- 农历信息 -->
          <div 
            class="lunar-info"
            :class="{
              'is-solar-term': customDateCell(data.date).lunarInfo?.isSolarTerm,
              'is-month-first': customDateCell(data.date).lunarInfo?.isMonthFirst
            }"
          >
            {{ getLunarText(customDateCell(data.date).lunarInfo) }}
          </div>

          <!-- 节假日信息 -->
          <div v-if="customDateCell(data.date).holiday" class="holiday-info">
            <div class="holiday-name">
              {{ getHolidayText(customDateCell(data.date).holiday) }}
            </div>
          </div>
          
          <!-- 今天的标识 -->
          <div v-if="customDateCell(data.date).isToday" class="today-indicator">
            今
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
          <span>农历日期</span>
        </div>
        <div class="legend-item">
          <div class="legend-color solar-term"></div>
          <span>节气</span>
        </div>
        <div class="legend-item">
          <div class="legend-color next-month"></div>
          <span>下月日期</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.holiday-calendar {
  background: linear-gradient(145deg, var(--el-bg-color-page), var(--el-bg-color-overlay));
  border-radius: 20px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  backdrop-filter: blur(10px);
  border: 1px solid var(--el-border-color-light);

  // Element Plus 日历组件样式覆盖
  :deep(.el-calendar) {
    .el-calendar__header {
      padding: 0 0 25px 0;
      
      .el-calendar__title {
        font-size: 28px;
        font-weight: 700;
        color: var(--el-text-color-primary);
        text-align: center;
        letter-spacing: 1px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .el-calendar__button-group {
        display: flex;
        justify-content: center;
        gap: 15px;
        margin-top: 20px;
        
        .el-button {
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          background: linear-gradient(to right, var(--el-bg-color-overlay), var(--el-bg-color-page));
          border: 1px solid var(--el-border-color);
          color: var(--el-text-color-primary);
          font-weight: 500;
          padding: 10px 20px;
          
          &:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
            background: linear-gradient(to right, var(--el-bg-color-page), var(--el-bg-color-overlay));
          }
          
          &:active {
            transform: translateY(-1px);
          }
        }
      }
    }
    
    .el-calendar__body {
      .el-calendar-table {
        thead {
          th {
            padding: 15px 0;
            font-weight: 600;
            color: var(--el-text-color-primary);
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 1px;
            background: var(--el-fill-color-light);
            border-radius: 10px;
            margin: 5px;
          }
        }
        
        .el-calendar-day {
          padding: 0;
          
          .custom-date-cell {
            min-height: 100px;
            padding: 12px;
            display: flex;
            flex-direction: column;
            position: relative;
            transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
            border-radius: 15px;
            margin: 4px;
            background: linear-gradient(145deg, var(--el-bg-color-overlay), var(--el-bg-color-page));
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05);
            overflow: hidden;
            border: 1px solid var(--el-border-color-light);
            
            &::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0));
              z-index: 1;
              border-radius: 15px;
            }
            
            &:hover {
              transform: translateY(-5px) scale(1.02);
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
              z-index: 2;
              
              &::before {
                background: linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.1));
              }
            }
            
            &.is-holiday {
              background: linear-gradient(135deg, var(--el-color-danger-light-9), var(--el-color-danger-light-8));
              border: 1px solid var(--el-color-danger-light-5);
              
              .holiday-info {
                .holiday-name {
                  background: linear-gradient(135deg, var(--el-color-danger), var(--el-color-danger-light-3));
                  color: var(--el-color-white);
                  box-shadow: 0 3px 8px rgba(245, 108, 108, 0.4);
                  border-radius: 6px;
                }
              }
              
              &:hover {
                background: linear-gradient(135deg, var(--el-color-danger-light-8), var(--el-color-danger-light-7));
                box-shadow: 0 10px 25px rgba(245, 108, 108, 0.3);
              }
            }
            
            &.is-workday {
              background: linear-gradient(135deg, var(--el-color-warning-light-9), var(--el-color-warning-light-8));
              border: 1px solid var(--el-color-warning-light-5);
              
              .holiday-info {
                .holiday-name {
                  background: linear-gradient(135deg, var(--el-color-warning), var(--el-color-warning-light-3));
                  color: var(--el-text-color-primary);
                  box-shadow: 0 3px 8px rgba(230, 162, 60, 0.4);
                  border-radius: 6px;
                }
              }
              
              &:hover {
                background: linear-gradient(135deg, var(--el-color-warning-light-8), var(--el-color-warning-light-7));
                box-shadow: 0 10px 25px rgba(230, 162, 60, 0.3);
              }
            }
            
            &.is-today {
              background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-color-primary-light-8));
              border: 2px solid var(--el-color-primary);
              box-shadow: 0 0 0 3px var(--el-color-primary-light-3);
              
              .date-number {
                color: var(--el-color-primary);
                font-weight: 800;
                font-size: 20px;
                text-shadow: 0 2px 4px rgba(64, 158, 255, 0.2);
              }
              
              &:hover {
                background: linear-gradient(135deg, var(--el-color-primary-light-8), var(--el-color-primary-light-7));
                box-shadow: 0 0 0 3px var(--el-color-primary-light-5), 0 10px 25px rgba(64, 158, 255, 0.3);
              }
            }
            
            // 节气日期的样式
            &.is-solar-term {
              border: 2px solid var(--el-color-success-light-3);
              box-shadow: 0 0 0 2px var(--el-color-success-light-7);
              
              .lunar-info.is-solar-term {
                color: var(--el-color-success);
                font-weight: 700;
                text-shadow: 0 1px 3px rgba(103, 194, 58, 0.3);
                font-size: 13px;
              }
              
              &:hover {
                transform: translateY(-5px) scale(1.03);
                box-shadow: 0 10px 25px rgba(103, 194, 58, 0.3);
              }
            }
            
            // 下个月日期的样式
            &.is-next-month {
              background: linear-gradient(145deg, var(--el-bg-color-overlay), var(--el-bg-color-page));
              opacity: 0.6;
              
              .date-number {
                color: var(--el-text-color-placeholder);
              }
              
              .lunar-info {
                color: var(--el-text-color-placeholder);
              }
              
              &:hover {
                opacity: 0.8;
                background: linear-gradient(145deg, var(--el-bg-color-overlay), var(--el-bg-color-page));
              }
            }
            
            .date-number {
              font-size: 20px;
              font-weight: 600;
              color: var(--el-text-color-primary);
              margin-bottom: 8px;
              align-self: flex-end;
              z-index: 2;
              text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            }
            
            .lunar-info {
              font-size: 12px;
              color: var(--el-text-color-secondary);
              margin-bottom: 6px;
              height: 18px;
              flex: 1;
              display: flex;
              align-items: center;
              z-index: 2;
              
              &.is-solar-term {
                color: var(--el-color-success);
                font-weight: 700;
                text-shadow: 0 1px 2px rgba(103, 194, 58, 0.2);
              }
              
              &.is-month-first {
                color: var(--el-color-primary);
                font-weight: 700;
                text-shadow: 0 1px 2px rgba(64, 158, 255, 0.2);
              }
            }
            
            .holiday-info {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
              z-index: 2;
              
              .holiday-name {
                font-size: 12px;
                padding: 4px 8px;
                border-radius: 8px;
                text-align: center;
                line-height: 1.4;
                word-break: break-all;
                font-weight: 600;
                transition: all 0.2s ease;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
                
                &:hover {
                  transform: scale(1.05);
                  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
                }
              }
            }
            
            .today-indicator {
              position: absolute;
              top: 6px;
              left: 6px;
              width: 22px;
              height: 22px;
              background: linear-gradient(135deg, var(--el-color-primary-light-3), var(--el-color-primary));
              color: var(--el-color-white);
              border-radius: 50%;
              font-size: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
              z-index: 3;
              border: 2px solid var(--el-color-white);
            }
          }
        }
      }
    }
  }
  
  .calendar-legend {
    margin-top: 30px;
    padding: 25px;
    background: linear-gradient(145deg, var(--el-bg-color-overlay), var(--el-bg-color-page));
    border-radius: 16px;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
    border: 1px solid var(--el-border-color-light);
    
    .legend-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--el-text-color-primary);
      margin-bottom: 20px;
      text-align: center;
      letter-spacing: 1px;
    }
    
    .legend-items {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 25px;
      
      .legend-item {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        color: var(--el-text-color-primary);
        padding: 10px 16px;
        border-radius: 12px;
        transition: all 0.3s ease;
        background: var(--el-fill-color-light);
        backdrop-filter: blur(5px);
        
        &:hover {
          background: var(--el-fill-color);
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        
        .legend-color {
          width: 24px;
          height: 24px;
          border-radius: 8px;
          border: 2px solid var(--el-border-color);
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          
          &.holiday {
            background: linear-gradient(135deg, var(--el-color-danger-light-9), var(--el-color-danger-light-5));
            border-color: var(--el-color-danger-light-3);
          }
          
          &.workday {
            background: linear-gradient(135deg, var(--el-color-warning-light-9), var(--el-color-warning-light-5));
            border-color: var(--el-color-warning-light-3);
          }
          
          &.today {
            background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-color-primary-light-5));
            border-color: var(--el-color-primary-light-3);
          }
          
          &.lunar {
            background: linear-gradient(135deg, var(--el-color-success-light-9), var(--el-color-success-light-5));
            border-color: var(--el-color-success-light-3);
          }
          
          &.solar-term {
            background: linear-gradient(135deg, var(--el-color-success-light-9), var(--el-color-success-light-5));
            border-color: var(--el-color-success-light-3);
          }
          
          &.next-month {
            background: linear-gradient(145deg, var(--el-bg-color-overlay), var(--el-bg-color-page));
            border-color: var(--el-text-color-placeholder);
            opacity: 0.6;
          }
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 992px) {
  .holiday-calendar {
    padding: 24px;
    
    :deep(.el-calendar) {
      .el-calendar__header {
        .el-calendar__title {
          font-size: 24px;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .holiday-calendar {
    padding: 20px;
    border-radius: 16px;
    
    :deep(.el-calendar) {
      .el-calendar__header {
        .el-calendar__title {
          font-size: 22px;
        }
        
        .el-calendar__button-group {
          gap: 10px;
          flex-wrap: wrap;
          
          .el-button {
            padding: 8px 16px;
            font-size: 13px;
            border-radius: 10px;
          }
        }
      }
      
      .el-calendar__body {
        .el-calendar-table {
          thead {
            th {
              font-size: 14px;
              padding: 12px 0;
            }
          }
          
          .el-calendar-day {
            .custom-date-cell {
              min-height: 80px;
              padding: 8px;
              margin: 2px;
              border-radius: 12px;
              
              .date-number {
                font-size: 18px;
              }
              
              .lunar-info {
                font-size: 10px;
                height: 16px;
              }
              
              .holiday-info {
                .holiday-name {
                  font-size: 10px;
                  padding: 3px 6px;
                  border-radius: 6px;
                }
              }
              
              .today-indicator {
                width: 20px;
                height: 20px;
                font-size: 11px;
                top: 5px;
                left: 5px;
              }
            }
          }
        }
      }
    }
    
    .calendar-legend {
      padding: 20px;
      margin-top: 20px;
      border-radius: 14px;
      
      .legend-title {
        font-size: 18px;
        margin-bottom: 16px;
      }
      
      .legend-items {
        gap: 16px;
        
        .legend-item {
          font-size: 12px;
          padding: 8px 12px;
          border-radius: 10px;
          
          .legend-color {
            width: 20px;
            height: 20px;
          }
        }
      }
    }
  }
}

// 小屏幕适配
@media (max-width: 576px) {
  .holiday-calendar {
    padding: 16px;
    
    :deep(.el-calendar) {
      .el-calendar__header {
        .el-calendar__title {
          font-size: 20px;
        }
        
        .el-calendar__button-group {
          .el-button {
            padding: 6px 12px;
            font-size: 12px;
          }
        }
      }
      
      .el-calendar__body {
        .el-calendar-table {
          thead {
            th {
              font-size: 12px;
              padding: 10px 0;
            }
          }
          
          .el-calendar-day {
            .custom-date-cell {
              min-height: 70px;
              padding: 6px;
              
              .date-number {
                font-size: 16px;
              }
              
              .lunar-info {
                font-size: 9px;
                height: 14px;
              }
              
              .holiday-info {
                .holiday-name {
                  font-size: 9px;
                  padding: 2px 4px;
                }
              }
              
              .today-indicator {
                width: 18px;
                height: 18px;
                font-size: 10px;
              }
            }
          }
        }
      }
    }
    
    .calendar-legend {
      padding: 16px;
      margin-top: 16px;
      
      .legend-title {
        font-size: 16px;
        margin-bottom: 14px;
      }
      
      .legend-items {
        gap: 12px;
        flex-direction: column;
        
        .legend-item {
          font-size: 11px;
          padding: 6px 10px;
          width: 100%;
          justify-content: center;
          
          .legend-color {
            width: 18px;
            height: 18px;
          }
        }
      }
    }
  }
}

// 超小屏幕适配
@media (max-width: 400px) {
  .holiday-calendar {
    padding: 12px;
    
    :deep(.el-calendar) {
      .el-calendar__header {
        .el-calendar__title {
          font-size: 18px;
        }
        
        .el-calendar__button-group {
          .el-button {
            padding: 5px 10px;
            font-size: 11px;
          }
        }
      }
      
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
                font-size: 8px;
                height: 12px;
              }
              
              .holiday-info {
                .holiday-name {
                  font-size: 8px;
                  padding: 1px 3px;
                }
              }
              
              .today-indicator {
                width: 16px;
                height: 16px;
                font-size: 9px;
              }
            }
          }
        }
      }
    }
    
    .calendar-legend {
      padding: 12px;
      margin-top: 12px;
      
      .legend-title {
        font-size: 14px;
        margin-bottom: 12px;
      }
      
      .legend-items {
        gap: 8px;
        
        .legend-item {
          font-size: 10px;
          padding: 4px 8px;
          
          .legend-color {
            width: 16px;
            height: 16px;
          }
        }
      }
    }
  }
}
</style>
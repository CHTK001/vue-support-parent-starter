<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from "vue";
import type { SysHoliday } from "../api/holiday";
import ScRibbon from "@repo/components/ScRibbon/index.vue";
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
 * @since 2025/12/04 添加海报模式和图片缓存
 */

// 组件属性
interface Props {
  /** 节假日数据 */
  holidayData: SysHoliday[];
  /** 当前年份 */
  currentYear: number;
  /** 是否海报模式 */
  posterMode?: boolean;
  /** 显示放假倒计时 */
  showHolidayCountdown?: boolean;
  /** 显示下班倒计时 */
  showWorkCountdown?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  holidayData: () => [],
  currentYear: new Date().getFullYear(),
  posterMode: false,
  showHolidayCountdown: true,
  showWorkCountdown: true,
});

// 组件事件
const emit = defineEmits<{
  yearChange: [year: number];
}>();

// 图片缓存Map
const imageCache = new Map<string, string>();

/**
 * 预加载并缓存图片
 * @param url 图片URL
 * @returns 缓存的图片URL或原始URL
 */
const preloadImage = (url: string): Promise<string> => {
  if (imageCache.has(url)) {
    return Promise.resolve(imageCache.get(url)!);
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageCache.set(url, url);
      resolve(url);
    };
    img.onerror = () => {
      resolve(url);
    };
    img.src = url;
  });
};

/**
 * 获取缓存的图片URL
 * @param solarTerm 节气名称
 * @returns 图片URL
 */
const getCachedImage = (solarTerm: string): string => {
  const url = solarTermImages[solarTerm];
  if (url && !imageCache.has(url)) {
    preloadImage(url);
  }
  return url || "";
};

// 响应式数据
const selectedDate = ref(new Date());
const calendarData = ref<SysHoliday[]>([]);
const isDarkMode = ref(false);

// 节气图片映射（使用固定ID的Unsplash高质量图片）
const solarTermImages: Record<string, string> = {
  // 春季节气
  立春: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=200&h=150&fit=crop", // 粉色花朵
  雨水: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=200&h=150&fit=crop", // 雨滴
  惊蛰: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=150&fit=crop", // 春雷惊醒
  春分: "https://images.unsplash.com/photo-1462275646964-a0e3571f4f82?w=200&h=150&fit=crop", // 樱花
  清明: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=200&h=150&fit=crop", // 绿色田野
  谷雨: "https://images.unsplash.com/photo-1501973801540-537f08ccae7b?w=200&h=150&fit=crop", // 春雨润物
  // 夏季节气
  立夏: "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=200&h=150&fit=crop", // 阳光海滩
  小满: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=200&h=150&fit=crop", // 金色麦田
  芒种: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=200&h=150&fit=crop", // 水稻田
  夏至: "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=200&h=150&fit=crop", // 灿烂阳光
  小暑: "https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=200&h=150&fit=crop", // 夏日荷花
  大暑: "https://images.unsplash.com/photo-1503803548695-c2a7b4a5b875?w=200&h=150&fit=crop", // 炎热太阳
  // 秋季节气
  立秋: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=150&fit=crop", // 金色落叶
  处暑: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=200&h=150&fit=crop", // 田园风光
  白露: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=200&h=150&fit=crop", // 晨露草叶
  秋分: "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=200&h=150&fit=crop", // 红枫叶
  寒露: "https://images.unsplash.com/photo-1477601263568-180e2c6d046e?w=200&h=150&fit=crop", // 露珠草地
  霜降: "https://images.unsplash.com/photo-1510784722466-f2aa9c52fff6?w=200&h=150&fit=crop", // 霜冻叶子
  // 冬季节气
  立冬: "https://images.unsplash.com/photo-1483664852095-d6cc6870702d?w=200&h=150&fit=crop", // 初冬树林
  小雪: "https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=200&h=150&fit=crop", // 轻雪飘落
  大雪: "https://images.unsplash.com/photo-1478265409131-1f65c88f965c?w=200&h=150&fit=crop", // 大雪纷飞
  冬至: "https://images.unsplash.com/photo-1457269449834-928af64c684d?w=200&h=150&fit=crop", // 冬日雪景
  小寒: "https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=200&h=150&fit=crop", // 冰雪世界
  大寒: "https://images.unsplash.com/photo-1418985991508-e47386d96a71?w=200&h=150&fit=crop", // 极寒冰霜
};

// 节气背景映射（后备颜色）
const solarTermBackgrounds = {
  立春: "linear-gradient(135deg, var(--solar-term-lc, #ff9a9e) 0%, var(--solar-term-lc-light, #fad0c4) 100%)",
  雨水: "linear-gradient(135deg, var(--solar-term-ys, #a1c4fd) 0%, var(--solar-term-ys-light, #c2e9fb) 100%)",
  惊蛰: "linear-gradient(135deg, var(--solar-term-jz, #d4fc79) 0%, var(--solar-term-jz-light, #96e6a1) 100%)",
  春分: "linear-gradient(135deg, var(--solar-term-cf, #f6d365) 0%, var(--solar-term-cf-light, #fda085) 100%)",
  清明: "linear-gradient(135deg, var(--solar-term-qm, #84fab0) 0%, var(--solar-term-qm-light, #8fd3f4) 100%)",
  谷雨: "linear-gradient(135deg, var(--solar-term-gy, #cfd9df) 0%, var(--solar-term-gy-light, #e2ebf0) 100%)",
  立夏: "linear-gradient(135deg, var(--solar-term-lx, #ffecd2) 0%, var(--solar-term-lx-light, #fcb69f) 100%)",
  小满: "linear-gradient(135deg, var(--solar-term-xm, #ff9a9e) 0%, var(--solar-term-xm-light, #fecfef) 100%)",
  芒种: "linear-gradient(135deg, var(--solar-term-mz, #fad0c4) 0%, var(--solar-term-mz-light, #ffd1ff) 100%)",
  夏至: "linear-gradient(135deg, var(--solar-term-xz, #a1c4fd) 0%, var(--solar-term-xz-light, #c2e9fb) 100%)",
  小暑: "linear-gradient(135deg, var(--solar-term-xs, #d299c2) 0%, var(--solar-term-xs-light, #fef9d7) 100%)",
  大暑: "linear-gradient(135deg, var(--solar-term-ds, #e0c3fc) 0%, var(--solar-term-ds-light, #8ec5fc) 100%)",
  立秋: "linear-gradient(135deg, var(--solar-term-lq, #f093fb) 0%, var(--solar-term-lq-light, #f5576c) 100%)",
  处暑: "linear-gradient(135deg, var(--solar-term-cs, #5ee7df) 0%, var(--solar-term-cs-light, #b490ca) 100%)",
  白露: "linear-gradient(135deg, var(--solar-term-bl, #d4fc79) 0%, var(--solar-term-bl-light, #96e6a1) 100%)",
  秋分: "linear-gradient(135deg, var(--solar-term-qf, #f6d365) 0%, var(--solar-term-qf-light, #fda085) 100%)",
  寒露: "linear-gradient(135deg, var(--solar-term-hl, #a8edea) 0%, var(--solar-term-hl-light, #fed6e3) 100%)",
  霜降: "linear-gradient(135deg, var(--solar-term-sj, #ffecd2) 0%, var(--solar-term-sj-light, #fcb69f) 100%)",
  立冬: "linear-gradient(135deg, var(--solar-term-ld, #a1c4fd) 0%, var(--solar-term-ld-light, #c2e9fb) 100%)",
  小雪: "linear-gradient(135deg, var(--solar-term-xx, #84fab0) 0%, var(--solar-term-xx-light, #8fd3f4) 100%)",
  大雪: "linear-gradient(135deg, var(--solar-term-dx, #cfd9df) 0%, var(--solar-term-dx-light, #e2ebf0) 100%)",
  冬至: "linear-gradient(135deg, var(--solar-term-dz, #d299c2) 0%, var(--solar-term-dz-light, #fef9d7) 100%)",
  小寒: "linear-gradient(135deg, var(--solar-term-xh, #e0c3fc) 0%, var(--solar-term-xh-light, #8ec5fc) 100%)",
  大寒: "linear-gradient(135deg, var(--solar-term-dh, #f093fb) 0%, var(--solar-term-dh-light, #f5576c) 100%)",
};

/**
 * 监听年份变化
 */
watch(
  () => props.currentYear,
  (newYear) => {
    selectedDate.value = new Date(
      newYear,
      selectedDate.value.getMonth(),
      selectedDate.value.getDate()
    );
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
  isDarkMode.value = document.documentElement.classList.contains("dark");
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
    attributeFilter: ["class"],
  });

  // 预加载所有节气图片
  Object.values(solarTermImages).forEach((url) => {
    if (url) preloadImage(url);
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
        solarTerm: solarTerm,
      };
    }

    // 如果是节气日，显示节气
    if (solarTerm) {
      return {
        text: solarTerm,
        isMonthFirst: false,
        isSolarTerm: true,
        solarTerm: solarTerm,
      };
    }

    // 普通农历日期
    return {
      text: lunarDate,
      isMonthFirst: false,
      isSolarTerm: false,
      solarTerm: solarTerm,
    };
  } catch (error) {
    console.error("获取农历信息失败:", error);
    return null;
  }
};

/**
 * 计算距离今天的天数
 * @param date 日期
 * @returns 天数差（正数为未来，负数为过去）
 */
const getDaysFromToday = (date: Date): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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

  // 计算距今天数
  const daysFromToday = getDaysFromToday(date);
  const isFuture = daysFromToday > 0;

  // 获取节气背景
  let solarTermBackground = "";
  let solarTermImage = "";
  if (lunarInfo?.isSolarTerm && lunarInfo?.solarTerm) {
    solarTermImage = solarTermImages[lunarInfo.solarTerm] || "";
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
    solarTermImage,
    daysFromToday,
    isFuture,
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
 * 获取下一个节气信息
 * @returns 下一个节气的名称和天数
 */
const getNextSolarTerm = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 搜索未来60天内的节气
  for (let i = 1; i <= 60; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() + i);
    const lunarInfo = getLunarInfo(checkDate);
    if (lunarInfo?.isSolarTerm) {
      return {
        name: lunarInfo.solarTerm,
        days: i,
      };
    }
  }
  return null;
};

/**
 * 获取下一个节假日信息
 * @returns 下一个节假日的名称和天数
 */
const getNextHoliday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const futureHolidays = calendarData.value
    .filter((h) => {
      const holidayDate = new Date(h.sysHolidayDate);
      holidayDate.setHours(0, 0, 0, 0);
      return holidayDate > today && h.sysHolidayIsHoliday;
    })
    .sort(
      (a, b) =>
        new Date(a.sysHolidayDate).getTime() -
        new Date(b.sysHolidayDate).getTime()
    );

  if (futureHolidays.length > 0) {
    const nextHoliday = futureHolidays[0];
    const holidayDate = new Date(nextHoliday.sysHolidayDate);
    const days = Math.ceil(
      (holidayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return {
      name: nextHoliday.sysHolidayName,
      days,
    };
  }
  return null;
};

/**
 * 根据天数获取进度条颜色
 * 距离越近越红（紧迫），距离越远越蓝（宽裕）
 * @param days 天数
 * @param maxDays 最大天数
 * @returns 颜色
 */
const getProgressColor = (days: number, maxDays: number = 30) => {
  const ratio = Math.min(days / maxDays, 1);
  if (ratio <= 0.15) return "#f56c6c"; // 红色 - 很近很紧迫
  if (ratio <= 0.3) return "#e6a23c"; // 橙色
  if (ratio <= 0.5) return "#909399"; // 灰色
  if (ratio <= 0.7) return "#79bbff"; // 浅蓝
  return "#409eff"; // 蓝色 - 很远很宽裕
};

/**
 * 根据天数获取进度条宽度
 * 距离越近条越短，距离越远条越长
 * @param days 天数
 * @param maxDays 最大天数
 * @returns 宽度百分比
 */
const getProgressWidth = (days: number, maxDays: number = 30) => {
  const ratio = Math.min(days / maxDays, 1);
  return Math.max(ratio * 100, 10) + "%";
};

/**
 * 获取节气动画类名
 * @param solarTerm 节气名称
 * @returns 动画类名
 */
const getSolarTermAnimation = (solarTerm: string) => {
  const animations: Record<string, string> = {
    立春: "spring-bloom",
    雨水: "rain-drops",
    惊蛰: "thunder-wake",
    春分: "spring-breeze",
    清明: "clear-bright",
    谷雨: "grain-rain",
    立夏: "summer-heat",
    小满: "grain-filling",
    芒种: "wheat-wave",
    夏至: "sun-peak",
    小暑: "heat-wave",
    大暑: "intense-heat",
    立秋: "autumn-leaf",
    处暑: "heat-fade",
    白露: "dew-drops",
    秋分: "autumn-breeze",
    寒露: "cold-dew",
    霜降: "frost-fall",
    立冬: "winter-start",
    小雪: "light-snow",
    大雪: "heavy-snow",
    冬至: "winter-solstice",
    小寒: "slight-cold",
    大寒: "severe-cold",
  };
  return animations[solarTerm] || "default-pulse";
};

/**
 * 更新节假日数据（供父组件调用）
 * @param data 节假日数据
 */
const updateHolidayData = (data: SysHoliday[]) => {
  calendarData.value = data;
};

/**
 * 获取下一个真正的放假日（排除调休工作日）
 * @returns 放假信息
 */
const getNextRealHoliday = computed(() => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 查找未来的放假日（sysHolidayIsHoliday 为真值）
  const futureHolidays = calendarData.value
    .filter((h) => {
      const holidayDate = new Date(h.sysHolidayDate);
      holidayDate.setHours(0, 0, 0, 0);
      // 必须是放假日（不是调休工作日）
      return holidayDate > today && h.sysHolidayIsHoliday;
    })
    .sort(
      (a, b) =>
        new Date(a.sysHolidayDate).getTime() -
        new Date(b.sysHolidayDate).getTime()
    );

  if (futureHolidays.length === 0) return null;

  const nextHoliday = futureHolidays[0];
  const holidayDate = new Date(nextHoliday.sysHolidayDate);
  holidayDate.setHours(0, 0, 0, 0);

  const diffMs = holidayDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // 1天内显示倒计时
  if (diffDays <= 1 && diffMs > 0) {
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    return {
      name: nextHoliday.sysHolidayName,
      days: diffDays,
      isCountdown: true,
      countdown: `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
    };
  }

  return {
    name: nextHoliday.sysHolidayName,
    days: diffDays,
    isCountdown: false,
    countdown: "",
  };
});

// 下班时间设置（默认18:00）
const workEndHour = 18;
const workEndMinute = 0;

// 下班倒计时
const workCountdown = ref("");
const isAfterWork = ref(false);
let workTimer: ReturnType<typeof setInterval> | null = null;

/**
 * 更新下班倒计时
 */
const updateWorkCountdown = () => {
  const now = new Date();
  const workEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    workEndHour,
    workEndMinute,
    0
  );

  const diffMs = workEnd.getTime() - now.getTime();

  if (diffMs <= 0) {
    isAfterWork.value = true;
    workCountdown.value = "已下班";
    return;
  }

  isAfterWork.value = false;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  workCountdown.value = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

// 海报模式倒计时刷新
const holidayCountdownDisplay = ref("");
let holidayTimer: ReturnType<typeof setInterval> | null = null;

/**
 * 更新放假倒计时显示
 */
const updateHolidayCountdown = () => {
  const info = getNextRealHoliday.value;
  if (info?.isCountdown) {
    // 重新计算
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const futureHolidays = calendarData.value
      .filter((h) => {
        const holidayDate = new Date(h.sysHolidayDate);
        holidayDate.setHours(0, 0, 0, 0);
        return holidayDate >= today && h.sysHolidayIsHoliday === true;
      })
      .sort(
        (a, b) =>
          new Date(a.sysHolidayDate).getTime() -
          new Date(b.sysHolidayDate).getTime()
      );

    if (futureHolidays.length > 0) {
      const nextHoliday = futureHolidays[0];
      const holidayDate = new Date(nextHoliday.sysHolidayDate);
      holidayDate.setHours(0, 0, 0, 0);
      const diffMs = holidayDate.getTime() - now.getTime();

      if (diffMs > 0) {
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        holidayCountdownDisplay.value = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      }
    }
  }
};

/**
 * 启动海报模式定时器
 */
const startPosterTimers = () => {
  if (props.posterMode) {
    if (props.showWorkCountdown && !workTimer) {
      updateWorkCountdown();
      workTimer = setInterval(updateWorkCountdown, 1000);
    }
    if (props.showHolidayCountdown && !holidayTimer) {
      updateHolidayCountdown();
      holidayTimer = setInterval(updateHolidayCountdown, 1000);
    }
  }
};

/**
 * 停止海报模式定时器
 */
const stopPosterTimers = () => {
  if (workTimer) {
    clearInterval(workTimer);
    workTimer = null;
  }
  if (holidayTimer) {
    clearInterval(holidayTimer);
    holidayTimer = null;
  }
};

// 监听海报模式变化
watch(
  () => props.posterMode,
  (newVal) => {
    if (newVal) {
      startPosterTimers();
    } else {
      stopPosterTimers();
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  stopPosterTimers();
});

// 暴露方法给父组件
defineExpose({
  updateHolidayData,
});
</script>

<template>
  <div
    class="holiday-calendar thin-scroller"
    :class="{ 'poster-mode': posterMode }"
  >
    <!-- Element Plus 日历组件 -->
    <el-calendar
      v-model="selectedDate"
      @input="handleDateChange"
      :first-day-of-week="1"
      :show-week-number="true"
    >
      <!-- 自定义日期单元格 -->
      <template #date-cell="{ data }">
        <div
          class="custom-date-cell"
          :class="[
            {
              'is-holiday': customDateCell(data.date).isHoliday,
              'is-workday': customDateCell(data.date).isWorkday,
              'is-today': customDateCell(data.date).isToday,
              'is-next-month': customDateCell(data.date).isNextMonth,
              'is-solar-term': customDateCell(data.date).lunarInfo?.isSolarTerm,
              'is-future':
                customDateCell(data.date).isFuture &&
                (customDateCell(data.date).holiday ||
                  customDateCell(data.date).lunarInfo?.isSolarTerm),
              'is-past':
                !customDateCell(data.date).isFuture &&
                !customDateCell(data.date).isToday,
            },
            customDateCell(data.date).lunarInfo?.isSolarTerm
              ? getSolarTermAnimation(
                  customDateCell(data.date).lunarInfo?.solarTerm
                )
              : '',
          ]"
        >
          <!-- SVG 背景装饰 -->
          <svg
            v-if="customDateCell(data.date).isHoliday"
            class="cell-bg-svg holiday-svg"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <pattern
                id="holidayPattern"
                patternUnits="userSpaceOnUse"
                width="20"
                height="20"
              >
                <circle
                  cx="10"
                  cy="10"
                  r="1.5"
                  fill="rgba(245, 108, 108, 0.15)"
                />
                <path
                  d="M5,5 L15,15 M15,5 L5,15"
                  stroke="rgba(245, 108, 108, 0.08)"
                  stroke-width="0.5"
                />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#holidayPattern)" />
            <circle cx="85" cy="15" r="8" fill="rgba(245, 108, 108, 0.1)" />
            <path
              d="M0,80 Q30,60 60,75 T100,70 L100,100 L0,100 Z"
              fill="rgba(245, 108, 108, 0.06)"
            />
          </svg>
          <svg
            v-else-if="customDateCell(data.date).isWorkday"
            class="cell-bg-svg workday-svg"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <pattern
                id="workdayPattern"
                patternUnits="userSpaceOnUse"
                width="15"
                height="15"
              >
                <rect
                  x="0"
                  y="0"
                  width="7"
                  height="7"
                  fill="rgba(230, 162, 60, 0.08)"
                />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#workdayPattern)" />
            <path
              d="M0,90 L30,70 L60,85 L100,65 L100,100 L0,100 Z"
              fill="rgba(230, 162, 60, 0.08)"
            />
          </svg>
          <!-- 节气图片背景 -->
          <div
            v-else-if="customDateCell(data.date).lunarInfo?.isSolarTerm"
            class="cell-bg-image solar-term-bg"
            :style="{
              backgroundImage: `url(${customDateCell(data.date).solarTermImage})`,
            }"
          >
            <div class="solar-term-overlay"></div>
          </div>

          <!-- Ribbon 标记 - 调整位置到右下角 -->
          <ScRibbon
            v-if="customDateCell(data.date).isHoliday"
            variant="corner"
            position="rb"
            size="sm"
            color="#f56c6c"
            text="假"
          />
          <ScRibbon
            v-else-if="customDateCell(data.date).isWorkday"
            variant="corner"
            position="rb"
            size="sm"
            color="#e6a23c"
            text="班"
          />
          <ScRibbon
            v-else-if="customDateCell(data.date).lunarInfo?.isSolarTerm"
            variant="corner"
            position="rb"
            size="sm"
            color="#67c23a"
            text="节"
          />

          <!-- 日期数字 -->
          <div class="date-number">
            {{ data.date.getDate() }}
          </div>

          <!-- 农历信息 -->
          <div
            class="lunar-info"
            :class="{
              'is-solar-term': customDateCell(data.date).lunarInfo?.isSolarTerm,
              'is-month-first': customDateCell(data.date).lunarInfo
                ?.isMonthFirst,
            }"
          >
            {{ getLunarText(customDateCell(data.date).lunarInfo) }}
          </div>

          <!-- 节假日信息 + 进度条倒计时 -->
          <div
            v-if="
              customDateCell(data.date).holiday &&
              customDateCell(data.date).isFuture
            "
            class="countdown-progress"
          >
            <div class="progress-label">
              <span class="holiday-name">{{
                getHolidayText(customDateCell(data.date).holiday)
              }}</span>
              <span class="days-text"
                >{{ customDateCell(data.date).daysFromToday }}天</span
              >
            </div>
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{
                  width: getProgressWidth(
                    customDateCell(data.date).daysFromToday
                  ),
                  background: getProgressColor(
                    customDateCell(data.date).daysFromToday
                  ),
                }"
              ></div>
            </div>
          </div>
          <div
            v-else-if="customDateCell(data.date).holiday"
            class="holiday-info"
          >
            <div class="holiday-name">
              {{ getHolidayText(customDateCell(data.date).holiday) }}
            </div>
          </div>

          <!-- 节气进度条倒计时 -->
          <div
            v-if="
              customDateCell(data.date).lunarInfo?.isSolarTerm &&
              customDateCell(data.date).isFuture &&
              !customDateCell(data.date).holiday
            "
            class="countdown-progress solar"
          >
            <div class="progress-label">
              <span class="days-text"
                >{{ customDateCell(data.date).daysFromToday }}天</span
              >
            </div>
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{
                  width: getProgressWidth(
                    customDateCell(data.date).daysFromToday,
                    20
                  ),
                  background: '#67c23a',
                }"
              ></div>
            </div>
          </div>

          <!-- 今天特殊显示 -->
          <div v-if="customDateCell(data.date).isToday" class="today-panel">
            <div class="today-badge">今天</div>

            <!-- 海报模式：下班倒计时 -->
            <div
              v-if="posterMode && showWorkCountdown"
              class="next-info work-countdown"
            >
              <div class="next-label">
                <span class="next-name">{{
                  isAfterWork ? "已下班" : "下班"
                }}</span>
                <span class="next-days countdown-timer">{{
                  workCountdown
                }}</span>
              </div>
            </div>

            <!-- 海报模式：放假倒计时 -->
            <div
              v-if="posterMode && showHolidayCountdown && getNextHoliday()"
              class="next-info holiday-next"
            >
              <div class="next-label">
                <span class="next-name">{{ getNextHoliday()?.name }}</span>
                <span class="next-days">{{ getNextHoliday()?.days }}天</span>
              </div>
            </div>

            <!-- 非海报模式：下个节假日 -->
            <div
              v-if="!posterMode && getNextHoliday()"
              class="next-info holiday-next"
            >
              <div class="next-label">
                <span class="next-name">{{ getNextHoliday()?.name }}</span>
                <span class="next-days">{{ getNextHoliday()?.days }}天</span>
              </div>
              <div class="mini-progress">
                <div
                  class="mini-fill"
                  :style="{
                    width: getProgressWidth(getNextHoliday()?.days || 0),
                    background: getProgressColor(getNextHoliday()?.days || 0),
                  }"
                ></div>
              </div>
            </div>

            <!-- 下个节气 -->
            <div v-if="getNextSolarTerm()" class="next-info solar-next">
              <div class="next-label">
                <span class="next-name">{{ getNextSolarTerm()?.name }}</span>
                <span class="next-days">{{ getNextSolarTerm()?.days }}天</span>
              </div>
              <!-- 非海报模式显示进度条 -->
              <div v-if="!posterMode" class="mini-progress">
                <div
                  class="mini-fill"
                  :style="{
                    width: getProgressWidth(getNextSolarTerm()?.days || 0, 20),
                    background: '#67c23a',
                  }"
                ></div>
              </div>
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
          <ScRibbon variant="corner" size="sm" color="#f56c6c" text="假" />
          <span>节假日</span>
        </div>
        <div class="legend-item">
          <ScRibbon variant="corner" size="sm" color="#e6a23c" text="班" />
          <span>调休工作日</span>
        </div>
        <div class="legend-item">
          <ScRibbon variant="corner" size="sm" color="#67c23a" text="节" />
          <span>节气</span>
        </div>
        <div class="legend-item">
          <div class="legend-color today"></div>
          <span>今天</span>
        </div>
        <div class="legend-item">
          <div class="legend-badge holiday-badge">5天</div>
          <span>节假日倒计时</span>
        </div>
        <div class="legend-item">
          <div class="legend-badge solar-badge">3天</div>
          <span>节气倒计时</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.holiday-calendar {
  background: linear-gradient(
    180deg,
    var(--el-bg-color) 0%,
    var(--el-fill-color-lighter) 100%
  );
  border-radius: 20px;
  padding: 24px;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.06),
    0 1px 3px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);

  // 海报模式 - 每个日期格子高度变高
  &.poster-mode {
    :deep(.el-calendar) {
      .el-calendar__body .el-calendar-table .el-calendar-day .custom-date-cell {
        height: 180px;
        min-height: 180px;

        // 今天卡片需要更多空间显示倒计时
        &.is-today .today-panel {
          padding: 8px;

          .today-badge {
            padding: 2px 8px;
            font-size: 11px;
          }

          .next-info {
            margin-top: 4px;
            padding: 4px 6px;

            &:first-of-type {
              margin-top: auto;
            }

            .next-label {
              font-size: 11px;
              margin-bottom: 0;
            }
          }
        }
      }
    }
  }

  :deep(.el-calendar) {
    background: transparent;
    border: none;

    .el-calendar__header {
      padding: 0 0 24px 0;
      border: none;
      background: linear-gradient(
        90deg,
        rgba(var(--el-color-primary-rgb), 0.05),
        transparent
      );
      border-radius: 12px;
      margin-bottom: 8px;
      padding: 16px;

      .el-calendar__title {
        font-size: 24px;
        font-weight: 800;
        background: linear-gradient(
          135deg,
          var(--el-color-primary),
          var(--el-color-primary-light-3)
        );
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .el-calendar__button-group {
        .el-button-group {
          display: flex;
          gap: 6px;

          .el-button {
            border-radius: 10px;
            padding: 10px 20px;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
          }
        }
      }
    }

    .el-calendar__body {
      padding: 0;

      .el-calendar-table {
        border-collapse: separate;
        border-spacing: 8px;

        thead th {
          padding: 14px 0;
          font-weight: 700;
          font-size: 14px;
          color: var(--el-text-color-primary);
          background: linear-gradient(
            180deg,
            var(--el-fill-color-light),
            var(--el-fill-color-lighter)
          );
          border-radius: 10px;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
        }

        td {
          border: none;
        }

        .el-calendar-day {
          padding: 0;
          height: auto;

          .custom-date-cell {
            min-height: 100px;
            padding: 12px;
            display: flex;
            flex-direction: column;
            position: relative;
            border-radius: 14px;
            background: linear-gradient(
              145deg,
              var(--el-bg-color-overlay),
              var(--el-fill-color-blank)
            );
            border: 2px solid transparent;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            box-shadow:
              0 2px 8px rgba(0, 0, 0, 0.04),
              inset 0 1px 0 rgba(255, 255, 255, 0.8);
            overflow: hidden;

            &:hover {
              transform: translateY(-4px) scale(1.02);
              box-shadow:
                0 8px 24px rgba(0, 0, 0, 0.12),
                inset 0 1px 0 rgba(255, 255, 255, 0.9);
              border-color: var(--el-color-primary-light-5);
            }

            // 过去的日期
            &.is-past {
              opacity: 0.5;
              filter: grayscale(0.3);

              &:hover {
                opacity: 0.7;
                filter: grayscale(0);
              }
            }

            // 未来高亮
            &.is-future {
              box-shadow:
                0 4px 16px rgba(var(--el-color-success-rgb), 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.8);
              border-color: rgba(var(--el-color-success-rgb), 0.4);

              &.is-holiday {
                box-shadow: 0 4px 16px rgba(var(--el-color-danger-rgb), 0.25);
                border-color: rgba(var(--el-color-danger-rgb), 0.5);
              }

              &.is-workday {
                box-shadow: 0 4px 16px rgba(var(--el-color-warning-rgb), 0.25);
                border-color: rgba(var(--el-color-warning-rgb), 0.5);
              }
            }

            // 节假日
            &.is-holiday {
              background: linear-gradient(
                145deg,
                rgba(var(--el-color-danger-rgb), 0.15),
                rgba(var(--el-color-danger-rgb), 0.05)
              );
              border-color: rgba(var(--el-color-danger-rgb), 0.4);

              .date-number {
                color: var(--el-color-danger);
                font-weight: 700;
                text-shadow: 0 1px 2px rgba(var(--el-color-danger-rgb), 0.2);
              }

              .holiday-info .holiday-name {
                background: linear-gradient(
                  135deg,
                  var(--el-color-danger),
                  var(--el-color-danger-light-3)
                );
                color: #fff;
              }

              &:hover {
                background: linear-gradient(
                  135deg,
                  rgba(var(--el-color-danger-rgb), 0.12),
                  rgba(var(--el-color-danger-rgb), 0.06)
                );
              }
            }

            // 调休工作日
            &.is-workday {
              background: linear-gradient(
                135deg,
                rgba(var(--el-color-warning-rgb), 0.08),
                rgba(var(--el-color-warning-rgb), 0.04)
              );
              border-color: rgba(var(--el-color-warning-rgb), 0.25);

              .holiday-info .holiday-name {
                background: linear-gradient(
                  135deg,
                  var(--el-color-warning),
                  var(--el-color-warning-light-3)
                );
                color: #fff;
              }

              &:hover {
                background: linear-gradient(
                  135deg,
                  rgba(var(--el-color-warning-rgb), 0.12),
                  rgba(var(--el-color-warning-rgb), 0.06)
                );
              }
            }

            // 今天
            &.is-today {
              background: linear-gradient(
                135deg,
                rgba(var(--el-color-primary-rgb), 0.1),
                rgba(var(--el-color-primary-rgb), 0.05)
              );
              border: 2px solid var(--el-color-primary);
              box-shadow: 0 0 0 3px rgba(var(--el-color-primary-rgb), 0.1);

              .date-number {
                color: var(--el-color-primary);
                font-weight: 700;
                font-size: 18px;
              }
            }

            // 节气
            &.is-solar-term {
              background: linear-gradient(
                135deg,
                rgba(var(--el-color-success-rgb), 0.08),
                rgba(var(--el-color-success-rgb), 0.03)
              );
              border-color: rgba(var(--el-color-success-rgb), 0.25);

              .lunar-info {
                color: var(--el-color-success);
                font-weight: 600;
              }
            }

            // 非当月日期
            &.is-next-month {
              opacity: 0.35;
              background: var(--el-fill-color-lighter);

              &:hover {
                opacity: 0.5;
              }
            }

            .date-number {
              font-size: 18px;
              font-weight: 700;
              color: var(--el-text-color-primary);
              text-align: right;
              line-height: 1;
              text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
            }

            .lunar-info {
              font-size: 12px;
              color: var(--el-text-color-regular);
              margin-top: 6px;
              line-height: 1.3;
              font-weight: 500;

              &.is-month-first {
                color: var(--el-color-primary);
                font-weight: 700;
              }

              &.is-solar-term {
                color: #1a5c1a;
                font-weight: 700;
                text-shadow: 0 1px 2px rgba(255, 255, 255, 0.9);
              }
            }

            // SVG 背景
            .cell-bg-svg {
              position: absolute;
              inset: 0;
              width: 100%;
              height: 100%;
              border-radius: 14px;
              pointer-events: none;
              z-index: 0;
            }

            // 节气图片背景
            .cell-bg-image {
              position: absolute;
              inset: 0;
              width: 100%;
              height: 100%;
              border-radius: 14px;
              pointer-events: none;
              z-index: 0;
              background-size: cover;
              background-position: center;
              background-repeat: no-repeat;

              &.solar-term-bg {
                .solar-term-overlay {
                  position: absolute;
                  inset: 0;
                  border-radius: 14px;
                  // 更深的遮罩让文字更清晰
                  background: linear-gradient(
                    145deg,
                    rgba(255, 255, 255, 0.85) 0%,
                    rgba(255, 255, 255, 0.4) 100%
                  );
                  border-radius: 12px;
                }
              }
            }

            // 深色模式下调整图片遮罩
            :global(.dark) & .cell-bg-image.solar-term-bg .solar-term-overlay {
              background: linear-gradient(
                135deg,
                rgba(0, 0, 0, 0.5) 0%,
                rgba(0, 0, 0, 0.3) 100%
              );
            }

            .holiday-info {
              margin-top: auto;
              padding-top: 6px;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 4px;
              z-index: 1;

              .holiday-name {
                font-size: 11px;
                padding: 4px 10px;
                border-radius: 6px;
                text-align: center;
                font-weight: 700;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 100%;
                background: linear-gradient(135deg, #e53935, #d32f2f);
                color: #fff;
                box-shadow: 0 2px 6px rgba(229, 57, 53, 0.35);
              }
            }

            // 进度条倒计时
            .countdown-progress {
              margin-top: auto;
              width: 100%;
              z-index: 1;
              background: rgba(255, 255, 255, 0.6);
              padding: 6px 8px;
              border-radius: 8px;
              backdrop-filter: blur(4px);

              .progress-label {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 10px;
                margin-bottom: 4px;

                .holiday-name {
                  color: #c62828;
                  font-weight: 700;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                  max-width: 55%;
                }

                .days-text {
                  color: #333;
                  font-weight: 700;
                }
              }

              .progress-bar {
                height: 6px;
                background: rgba(0, 0, 0, 0.1);
                border-radius: 3px;
                overflow: hidden;
                box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);

                .progress-fill {
                  height: 100%;
                  border-radius: 3px;
                  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
                }
              }

              &.solar .progress-label .days-text {
                color: var(--el-color-success);
              }
            }

            // 今天面板
            .today-panel {
              position: absolute;
              inset: 0;
              display: flex;
              flex-direction: column;
              padding: 10px;
              z-index: 2;
              background: linear-gradient(
                145deg,
                rgba(var(--el-color-primary-rgb), 0.08),
                rgba(var(--el-color-primary-rgb), 0.02)
              );
              border-radius: 14px;

              .today-badge {
                align-self: flex-start;
                font-size: 12px;
                padding: 4px 12px;
                background: linear-gradient(135deg, #1976d2, #42a5f5);
                color: #fff;
                border-radius: 12px;
                font-weight: 800;
                box-shadow: 0 3px 8px rgba(25, 118, 210, 0.4);
                letter-spacing: 1px;
              }

              .next-info {
                margin-top: auto;
                padding: 6px 8px;
                background: rgba(255, 255, 255, 0.7);
                border-radius: 8px;
                backdrop-filter: blur(4px);

                & + .next-info {
                  margin-top: 4px;
                }

                .next-label {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  font-size: 10px;
                  margin-bottom: 4px;

                  .next-name {
                    font-weight: 700;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    max-width: 60%;
                  }

                  .next-days {
                    font-weight: 800;
                    font-size: 11px;
                  }
                }

                .mini-progress {
                  height: 4px;
                  background: rgba(0, 0, 0, 0.1);
                  border-radius: 2px;
                  overflow: hidden;

                  .mini-fill {
                    height: 100%;
                    border-radius: 2px;
                    transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                  }
                }

                &.holiday-next .next-label {
                  .next-name {
                    color: #c62828;
                  }
                  .next-days {
                    color: #c62828;
                  }
                }

                &.solar-next .next-label {
                  .next-name {
                    color: #2e7d32;
                  }
                  .next-days {
                    color: #2e7d32;
                  }
                }

                &.work-countdown .next-label {
                  .next-name {
                    color: #1976d2;
                  }
                  .next-days {
                    color: #1976d2;
                  }
                }

                .countdown-timer {
                  font-family: "Courier New", monospace;
                  letter-spacing: 1px;
                }
              }
            }

            // 日期数字和农历信息需要提升层级
            .date-number,
            .lunar-info {
              z-index: 1;
              position: relative;
            }
          }
        }
      }
    }
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(0.95);
    }
  }

  // 节气动画 - 春季
  @keyframes spring-bloom-anim {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.02);
    }
  }
  @keyframes rain-drops-anim {
    0%,
    100% {
      background-position: 0 0;
    }
    50% {
      background-position: 0 5px;
    }
  }
  @keyframes thunder-wake-anim {
    0%,
    90%,
    100% {
      opacity: 1;
    }
    92%,
    96% {
      opacity: 0.7;
    }
  }
  @keyframes spring-breeze-anim {
    0%,
    100% {
      transform: translateX(0);
    }
    50% {
      transform: translateX(2px);
    }
  }
  @keyframes clear-bright-anim {
    0%,
    100% {
      filter: brightness(1);
    }
    50% {
      filter: brightness(1.05);
    }
  }
  @keyframes grain-rain-anim {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.9;
    }
  }

  // 节气动画 - 夏季
  @keyframes summer-heat-anim {
    0%,
    100% {
      box-shadow: 0 0 0 0 rgba(255, 165, 0, 0.2);
    }
    50% {
      box-shadow: 0 0 10px 2px rgba(255, 165, 0, 0.15);
    }
  }
  @keyframes sun-peak-anim {
    0%,
    100% {
      filter: brightness(1);
    }
    50% {
      filter: brightness(1.1);
    }
  }
  @keyframes heat-wave-anim {
    0%,
    100% {
      transform: translateY(0);
    }
    25% {
      transform: translateY(-1px);
    }
    75% {
      transform: translateY(1px);
    }
  }
  @keyframes intense-heat-anim {
    0%,
    100% {
      background-color: rgba(255, 100, 0, 0.05);
    }
    50% {
      background-color: rgba(255, 100, 0, 0.1);
    }
  }

  // 节气动画 - 秋季
  @keyframes autumn-leaf-anim {
    0%,
    100% {
      transform: rotate(0deg);
    }
    25% {
      transform: rotate(-2deg);
    }
    75% {
      transform: rotate(2deg);
    }
  }
  @keyframes dew-drops-anim {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.85;
    }
  }
  @keyframes autumn-breeze-anim {
    0%,
    100% {
      transform: translateX(0) rotate(0);
    }
    50% {
      transform: translateX(1px) rotate(1deg);
    }
  }
  @keyframes frost-fall-anim {
    0%,
    100% {
      filter: brightness(1) contrast(1);
    }
    50% {
      filter: brightness(1.05) contrast(0.95);
    }
  }

  // 节气动画 - 冬季
  @keyframes light-snow-anim {
    0% {
      background-position:
        0 0,
        10px 10px;
    }
    100% {
      background-position:
        10px 20px,
        20px 30px;
    }
  }
  @keyframes heavy-snow-anim {
    0% {
      background-position:
        0 0,
        5px 5px,
        10px 10px;
    }
    100% {
      background-position:
        5px 15px,
        10px 25px,
        15px 35px;
    }
  }
  @keyframes winter-solstice-anim {
    0%,
    100% {
      filter: brightness(0.95);
    }
    50% {
      filter: brightness(1);
    }
  }
  @keyframes slight-cold-anim {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(0.99);
    }
  }
  @keyframes severe-cold-anim {
    0%,
    100% {
      filter: hue-rotate(0deg);
    }
    50% {
      filter: hue-rotate(5deg);
    }
  }

  // 节气动画类
  :deep(.custom-date-cell) {
    &.spring-bloom {
      animation: spring-bloom-anim 3s ease-in-out infinite;
    }
    &.rain-drops {
      animation: rain-drops-anim 2s ease-in-out infinite;
    }
    &.thunder-wake {
      animation: thunder-wake-anim 4s ease-in-out infinite;
    }
    &.spring-breeze {
      animation: spring-breeze-anim 4s ease-in-out infinite;
    }
    &.clear-bright {
      animation: clear-bright-anim 3s ease-in-out infinite;
    }
    &.grain-rain {
      animation: grain-rain-anim 2.5s ease-in-out infinite;
    }
    &.summer-heat,
    &.grain-filling,
    &.wheat-wave {
      animation: summer-heat-anim 3s ease-in-out infinite;
    }
    &.sun-peak {
      animation: sun-peak-anim 4s ease-in-out infinite;
    }
    &.heat-wave,
    &.heat-fade {
      animation: heat-wave-anim 2s ease-in-out infinite;
    }
    &.intense-heat {
      animation: intense-heat-anim 2s ease-in-out infinite;
    }
    &.autumn-leaf {
      animation: autumn-leaf-anim 5s ease-in-out infinite;
    }
    &.dew-drops,
    &.cold-dew {
      animation: dew-drops-anim 3s ease-in-out infinite;
    }
    &.autumn-breeze {
      animation: autumn-breeze-anim 4s ease-in-out infinite;
    }
    &.frost-fall {
      animation: frost-fall-anim 4s ease-in-out infinite;
    }
    &.winter-start {
      animation: slight-cold-anim 5s ease-in-out infinite;
    }
    &.light-snow {
      animation: light-snow-anim 8s linear infinite;
    }
    &.heavy-snow {
      animation: heavy-snow-anim 6s linear infinite;
    }
    &.winter-solstice {
      animation: winter-solstice-anim 5s ease-in-out infinite;
    }
    &.slight-cold {
      animation: slight-cold-anim 4s ease-in-out infinite;
    }
    &.severe-cold {
      animation: severe-cold-anim 6s ease-in-out infinite;
    }
    &.default-pulse {
      animation: pulse 3s ease-in-out infinite;
    }
  }

  .calendar-legend {
    margin-top: 16px;
    padding: 12px 16px;
    background: var(--el-fill-color-lighter);
    border-radius: 10px;

    .legend-title {
      font-size: 13px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      margin-bottom: 10px;
    }

    .legend-items {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;

      .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: var(--el-text-color-secondary);
        position: relative;

        // ScRibbon 在图例中的样式调整
        :deep(.sc-ribbon-corner) {
          position: relative;
          top: auto;
          right: auto;
        }

        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 50%;

          &.today {
            background: linear-gradient(
              135deg,
              var(--el-color-primary),
              var(--el-color-primary-light-3)
            );
            box-shadow: 0 2px 4px rgba(var(--el-color-primary-rgb), 0.3);
          }
        }

        .legend-badge {
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 10px;
          color: #fff;
          font-weight: 600;

          &.holiday-badge {
            background: linear-gradient(135deg, #f56c6c, #e85656);
          }

          &.solar-badge {
            background: linear-gradient(135deg, #67c23a, #5daf34);
          }
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .holiday-calendar {
    padding: 12px;

    :deep(.el-calendar) {
      .el-calendar__body .el-calendar-table .el-calendar-day .custom-date-cell {
        min-height: 70px;
        padding: 6px;

        .date-number {
          font-size: 14px;
        }

        .lunar-info {
          font-size: 10px;
        }

        .holiday-info .holiday-name {
          font-size: 9px;
          padding: 2px 4px;
        }

        .today-indicator {
          width: 16px;
          height: 16px;
          font-size: 9px;
        }
      }
    }

    .calendar-legend {
      padding: 10px 12px;

      .legend-items {
        gap: 10px;
      }
    }
  }
}
</style>

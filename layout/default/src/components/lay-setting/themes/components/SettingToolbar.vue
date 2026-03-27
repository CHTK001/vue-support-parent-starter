<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import ScSwitch from "@repo/components/ScSwitch/index.vue";
import ScSelect from "@repo/components/ScSelect/index.vue";
import type { OptionsType } from "@repo/components/ReSegmented/index";

const { t } = useI18n();

// ---- Props 定义 ----
const props = defineProps<{
  /** reactive 设置对象引用，子组件可直接修改 */
  settings: Record<string, any>;
  showSearchChange: (value: boolean) => void;
  showFullscreenChange: (value: boolean) => void;
  showHeaderClockChange: (value: boolean) => void;
  headerClockSecondEnabledChange: (value: boolean) => void;
  headerClockSecondTimezoneChange: (value: string) => void;
}>();

/** 时区选项（UTC-12 ~ UTC+12 整数时区） */
interface HeaderClockTimezoneOption extends OptionsType {
  offset: string;
}

const standardTimezones = [
  { value: "Etc/GMT+12", region: "贝克岛/豪兰岛", offsetHour: -12 },
  { value: "Pacific/Pago_Pago", region: "美属萨摩亚", offsetHour: -11 },
  { value: "Pacific/Honolulu", region: "美国夏威夷", offsetHour: -10 },
  { value: "America/Anchorage", region: "美国阿拉斯加", offsetHour: -9 },
  { value: "America/Los_Angeles", region: "美国西部（洛杉矶）", offsetHour: -8 },
  { value: "America/Denver", region: "美国山区时间（丹佛）", offsetHour: -7 },
  { value: "America/Chicago", region: "美国中部时间（芝加哥）", offsetHour: -6 },
  { value: "America/New_York", region: "美国东部时间（纽约）", offsetHour: -5 },
  { value: "America/Halifax", region: "加拿大大西洋时间", offsetHour: -4 },
  { value: "America/Sao_Paulo", region: "巴西/圣保罗", offsetHour: -3 },
  { value: "America/Noronha", region: "巴西费尔南多-迪诺罗尼亚", offsetHour: -2 },
  { value: "Atlantic/Azores", region: "葡萄牙亚速尔群岛", offsetHour: -1 },
  { value: "Europe/London", region: "英国/伦敦", offsetHour: 0 },
  { value: "Europe/Paris", region: "中欧时间（巴黎）", offsetHour: 1 },
  { value: "Europe/Helsinki", region: "东欧时间（赫尔辛基）", offsetHour: 2 },
  { value: "Europe/Moscow", region: "俄罗斯/莫斯科", offsetHour: 3 },
  { value: "Asia/Dubai", region: "阿联酋/迪拜", offsetHour: 4 },
  { value: "Asia/Karachi", region: "巴基斯坦/卡拉奇", offsetHour: 5 },
  { value: "Asia/Dhaka", region: "孟加拉国/达卡", offsetHour: 6 },
  { value: "Asia/Bangkok", region: "泰国/曼谷", offsetHour: 7 },
  { value: "Asia/Shanghai", region: "中国/北京时间", offsetHour: 8 },
  { value: "Asia/Tokyo", region: "日本/东京", offsetHour: 9 },
  { value: "Australia/Sydney", region: "澳大利亚/悉尼", offsetHour: 10 },
  { value: "Pacific/Guadalcanal", region: "所罗门群岛", offsetHour: 11 },
  { value: "Pacific/Auckland", region: "新西兰/奥克兰", offsetHour: 12 },
];

const headerClockTimezoneOptions = computed<HeaderClockTimezoneOption[]>(() =>
  standardTimezones.map(({ value, region, offsetHour }) => {
    const sign = offsetHour >= 0 ? "+" : "-";
    const offset = `UTC${sign}${String(Math.abs(offsetHour)).padStart(2, "0")}`;
    return { label: `${region} · ${offset}`, value, offset };
  }),
);
</script>

<template>
  <!-- 顶部工具栏配置区域 -->
  <div class="setting-section">
    <div class="section-header">
      <IconifyIconOnline icon="ri:menu-3-line" class="section-icon" />
      <h3 class="section-title">顶部工具栏</h3>
      <div class="section-description">控制顶部搜索、全屏等工具按钮的显示</div>
    </div>
    <div class="setting-content">
      <div class="setting-item">
        <div class="switch-card-grid">
          <ScSwitch
            v-model="settings.showSearch"
            layout="visual-card"
            label="显示搜索按钮"
            description="控制 lay-header 的搜索按钮是否显示"
            active-icon="ri:search-2-line"
            inactive-icon="ri:search-eye-line"
            @change="showSearchChange"
          />
          <ScSwitch
            v-model="settings.showFullscreen"
            layout="visual-card"
            label="显示全屏按钮"
            description="控制 lay-header 的全屏按钮是否显示"
            active-icon="ri:fullscreen-fill"
            inactive-icon="ri:fullscreen-exit-line"
            @change="showFullscreenChange"
          />
          <ScSwitch
            v-model="settings.showHeaderClock"
            layout="visual-card"
            label="显示顶部时间"
            description="在顶部工具栏显示当前时间，适合全屏和大屏展示"
            active-icon="ep:clock"
            @change="showHeaderClockChange"
          />
        </div>
      </div>

      <!-- 顶部时间第二时区：脱离 switch-card-grid，单独一行展示 -->
      <div v-if="settings.showHeaderClock" class="setting-item">
        <div class="header-clock-advanced">
          <div class="header-clock-advanced-inner">
            <div class="header-clock-advanced-label">
              <span class="header-clock-advanced-title">第二时区</span>
              <span class="header-clock-advanced-desc">可同时展示另一个时区的时间</span>
            </div>
            <div class="header-clock-advanced-control">
              <ScSwitch
                v-model="settings.headerClockSecondEnabled"
                size="small"
                label="开启"
                @change="headerClockSecondEnabledChange"
              />
            </div>
          </div>
          <template v-if="settings.headerClockSecondEnabled">
            <div class="header-clock-timezone-select-wrapper">
              <ScSelect
                v-model="settings.headerClockSecondTimezone"
                layout="dropdown"
                class="header-clock-timezone-select"
                :options="headerClockTimezoneOptions"
                placeholder="请选择第二时区"
                size="small"
                @change="headerClockSecondTimezoneChange"
              />
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

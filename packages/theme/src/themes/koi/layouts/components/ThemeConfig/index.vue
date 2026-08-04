<template>
  <!-- 主题配置 -->
  <ReDrawer
    ref="koiDrawerRef"
    title="主题配置"
    size="380"
    :footerHidden="true"
    :closeConfirm="themeConfigCloseConfirm"
    :closeOnly="true"
    :lock-scroll="false"
    drawer-class="theme-config-drawer"
    modal-class="theme-config-overlay"
  >
    <template #content>
      <!--
        theme-config-panel：主题配置独立作用域
        - 预览块使用 koi-* 类名，不与 html.layout-horizontal / Layout 组件类名冲突
        - isolation 防止预览 mix-blend-mode 影响抽屉外的主布局
      -->
      <div class="theme-config-panel p-t-8px select-none">
        <ReTab
          :tabs="configTabs"
          v-model="activeTab"
          variant="capsule"
          class="theme-config-tabs"
        >
          <!-- ============ 高级：计时器配置（顶部 tab，@repo/work Worker 驱动） ============ -->
          <template #advanced>
            <!-- 计时器配置 -->
            <div class="config-section">
              <div class="section-header">
                <el-icon :size="18" class="section-icon"><Clock /></el-icon>
                <span class="section-title">计时器配置</span>
              </div>

              <div class="section-card">
                <ReSwitch
                  title="启用顶部计时器"
                  tip="Header 右上角展示时间，多时区悬停查看（@repo/work Worker 驱动）"
                  v-model="timerEnable"
                />

                <!-- 时区列表（最多 3 个，UTC 偏移 -12 ~ +12） -->
                <div v-if="timerEnable" class="timer-zones">
                  <div class="timer-zones__head">
                    <span class="timer-zones__title">展示时区</span>
                    <span class="timer-zones__count">{{ timerZones.length }} / {{ MAX_TIMER_ZONES }}</span>
                  </div>

                  <div v-for="(zone, index) in timerZones" :key="index" class="timer-zone-row">
                    <span class="timer-zone-row__index">{{ index + 1 }}</span>
                    <el-select
                      v-model="timerZones[index]"
                      placeholder="选择时区偏移"
                      clearable
                      class="timer-zone-row__select"
                      @clear="removeTimerZone(index)"
                    >
                      <el-option
                        v-for="offset in timerZoneOptions"
                        :key="offset"
                        :label="formatZoneLabel(offset)"
                        :value="offset"
                      />
                    </el-select>
                    <el-button
                      class="timer-zone-row__remove"
                      :icon="Delete"
                      circle
                      size="small"
                      @click="removeTimerZone(index)"
                    />
                  </div>

                  <el-button
                    v-if="timerZones.length < MAX_TIMER_ZONES"
                    class="timer-zone-add"
                    type="primary"
                    plain
                    :icon="Plus"
                    @click="addTimerZone"
                  >
                    添加时区
                  </el-button>

                  <div class="timer-zones__tip">
                    <el-icon :size="13"><InfoFilled /></el-icon>
                    <span>最多 3 个时区，UTC-12 ~ UTC+12；清空后仅显示本地时间</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 用户配置：导入 / 导出 -->
            <div class="config-section">
              <div class="section-header">
                <el-icon :size="18" class="section-icon"><Files /></el-icon>
                <span class="section-title">用户配置</span>
              </div>
              <div class="section-card">
                <div class="config-io">
                  <div class="config-io__card" @click="exportUserConfig">
                    <span class="config-io__icon config-io__icon--export">
                      <el-icon :size="20"><Download /></el-icon>
                    </span>
                    <div class="config-io__info">
                      <span class="config-io__title">导出配置</span>
                      <span class="config-io__desc">备份到 JSON 文件</span>
                    </div>
                  </div>

                  <div class="config-io__card" @click="importUserConfig">
                    <span class="config-io__icon config-io__icon--import">
                      <el-icon :size="20"><Upload /></el-icon>
                    </span>
                    <div class="config-io__info">
                      <span class="config-io__title">导入配置</span>
                      <span class="config-io__desc">从 JSON 文件恢复</span>
                    </div>
                  </div>

                  <div class="config-io__tip">
                    <el-icon :size="13"><InfoFilled /></el-icon>
                    <span>导出当前主题/布局/计时器等用户配置，导入后可跨设备恢复</span>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- ============ 外观：主题颜色 + 布局样式 + 登录页样式 ============ -->
          <template #appearance>
            <!-- 主题模式：明亮 / 黑暗 / 自动 -->
            <div class="config-section">
              <div class="section-header">
                <el-icon :size="18" class="section-icon"><Moon /></el-icon>
                <span class="section-title">主题模式</span>
              </div>

              <div class="section-card">
                <ReTab
                  :tabs="themeModeTabs"
                  :model-value="themeMode"
                  variant="capsule"
                  nav-only
                  class="theme-mode-tabs"
                  @update:model-value="(val: string) => changeThemeMode(val as 'light' | 'dark' | 'auto')"
                />
              </div>
            </div>

            <!-- 主题颜色选择器 -->
            <div class="config-section">
              <div class="section-header">
                <el-icon :size="18" class="section-icon"><Connection /></el-icon>
                <span class="section-title">主题颜色</span>
              </div>

              <div class="section-card">
                <!-- 2 行 × 6 正圆形预设色板 -->
                <div class="theme-colors-grid">
                  <div
                    v-for="color in themeColors"
                    :key="color"
                    class="theme-color-item"
                    @click="changeThemeColor(color)"
                    :class="{ active: globalStore.themeColor === color }"
                  >
                    <div class="color-dot" :style="{ backgroundColor: color }">
                      <div class="color-check" v-if="globalStore.themeColor === color">
                        <el-icon><Check /></el-icon>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 自定义颜色区域：左预览方块 + 中文字 + 右亮度/深浅滑条 -->
                <div class="theme-color-custom-card">
                  <div class="custom-swatch" :style="{ backgroundColor: customColor }">
                    <el-icon v-if="isCustomActive" class="custom-swatch__check"><Check /></el-icon>
                    <!-- 透明取色器覆盖在色块上：点击色块即打开取色面板 -->
                    <el-color-picker
                      v-model="customBase"
                      class="theme-color-custom-card__hidden-picker"
                      :show-alpha="false"
                      @change="handleCustomColor"
                    />
                  </div>

                  <div class="custom-info">
                    <div class="custom-title">自定义颜色</div>
                    <div class="custom-desc">色盘或输入 HEX 色值</div>
                    <div class="custom-hex">{{ customColor }}</div>
                  </div>

                  <div class="custom-lightness">
                    <el-slider
                      v-model="customLightness"
                      :min="-100"
                      :max="100"
                      :step="1"
                      vertical
                      :height="72"
                      @input="applyCustomColor"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- 颜色状态：消息提示四种状态色（点击触发对应 el-message 演示） -->
            <div class="config-section">
              <div class="section-header">
                <el-icon :size="18" class="section-icon"><Bell /></el-icon>
                <span class="section-title">颜色状态</span>
              </div>

              <div class="section-card">
                <div class="msg-status-list">
                <div
                  v-for="item in msgStatusItems"
                  :key="item.type"
                  class="msg-status-item"
                  :class="`msg-status-item--${item.type}`"
                >
                  <!-- 左侧色块：可点击取色，实时控制全局 message 颜色 -->
                  <div
                    class="msg-status-item__badge"
                    :style="{ backgroundColor: item.color }"
                  >
                    <el-icon :size="14"><component :is="item.badgeIcon" /></el-icon>
                    <!-- 透明取色器覆盖在色块上：点击色块即打开取色面板 -->
                    <el-color-picker
                      :model-value="item.color"
                      class="msg-status-item__hidden-picker"
                      :show-alpha="false"
                      @change="(val: string | null) => handleMsgColorChange(item, val)"
                    />
                  </div>

                  <!-- 中间文字：加粗标题 + 色值 -->
                  <div class="msg-status-item__text">
                    <span class="msg-status-item__label">{{ item.label }}</span>
                    <span class="msg-status-item__hex">{{ item.color }}</span>
                  </div>

                  <!-- 右侧环形刷新图标：浅色圆形底 -->
                  <div class="msg-status-item__refresh">
                    <el-icon :size="13"><RefreshRight /></el-icon>
                  </div>
                </div>
              </div>
            </div>
            </div>

            <!-- 布局样式选择器 -->
            <div class="config-section">
              <div class="section-header">
                <el-icon :size="18" class="section-icon"><Notification /></el-icon>
                <span class="section-title">布局样式</span>
              </div>

              <div class="section-card">
                <div class="koi-layout-grid">
                <div
                  v-for="layoutOption in layoutOptions"
                  :key="layoutOption.value"
                  :class="['koi-layout-item', layoutOption.previewClass, { 'is-active': layout === layoutOption.value }]"
                  @click="setLayout(layoutOption.value)"
                >
                  <div class="koi-layout-preview">
                    <!-- 双栏专属预览：3 个实心蓝竖条 + 1 个虚线方框 -->
                    <template v-if="layoutOption.value === 'double'">
                      <div class="koi-double-bar"></div>
                      <div class="koi-double-bar"></div>
                      <div class="koi-double-bar"></div>
                      <div class="koi-double-dashed"></div>
                    </template>
                    <template v-else>
                      <div class="koi-block-aside"></div>
                      <div class="koi-layout-inner" v-if="layoutOption.hasContainer">
                        <div class="koi-block-header"></div>
                        <div class="koi-block-main"></div>
                      </div>
                      <div class="koi-block-header" v-if="!layoutOption.hasContainer && layoutOption.hasLight"></div>
                      <div
                        class="koi-block-main"
                        v-if="
                          !layoutOption.hasContainer &&
                          !layoutOption.hasLight &&
                          layoutOption.value !== 'columns' &&
                          layoutOption.value !== 'gradation-columns' &&
                          layoutOption.value !== 'frosted-columns'
                        "
                      ></div>
                      <template
                        v-if="
                          layoutOption.value === 'columns' ||
                          layoutOption.value === 'gradation-columns' ||
                          layoutOption.value === 'frosted-columns'
                        "
                      >
                        <div class="koi-block-header"></div>
                        <div class="koi-block-main"></div>
                      </template>
                    </template>
                  </div>
                  <div class="koi-layout-label">{{ layoutOption.label }}</div>
                  <div class="koi-layout-check" v-if="layout === layoutOption.value">
                    <el-icon><Check /></el-icon>
                  </div>
                </div>
                </div>
              </div>
            </div>

            <!-- 登录页样式选择器（与登录页同一组件，数据/预览统一） -->
            <div class="config-section">
              <div class="section-header">
                <el-icon :size="18" class="section-icon"><Monitor /></el-icon>
                <span class="section-title">登录页样式</span>
              </div>

              <div class="section-card">
                <KoiLoginStyleSelector />
              </div>
            </div>
          </template>

          <!-- ============ 界面：界面配置 ============ -->
          <template #interface>
            <div class="config-section">
              <div class="section-header">
                <el-icon :size="18" class="section-icon"><ChatLineRound /></el-icon>
                <span class="section-title">界面配置</span>
              </div>

              <div class="section-card">
                <div class="interface-config">
                <div class="config-item">
                  <div class="config-label">
                    <span>路由动画</span>
                  </div>
                  <el-select placeholder="请选择路由动画" v-model="transition" clearable class="config-input">
                    <el-option label="无动画" value="none" />
                    <el-option label="默认" value="fade-default" />
                    <el-option label="淡入淡出" value="fade" />
                    <el-option label="滑动" value="fade-slide" />
                    <el-option label="渐变" value="zoom-fade" />
                    <el-option label="底部滑出" value="fade-bottom" />
                    <el-option label="缩放消退" value="fade-scale" />
                  </el-select>
                </div>

                <div class="config-item">
                  <div class="config-label">菜单宽度</div>
                  <el-input-number class="config-input" :min="200" :max="260" :step="2" v-model="menuWidth" />
                </div>

                <div class="config-item">
                  <div class="config-label">标签页风格</div>
                  <el-select placeholder="请选择标签页风格" v-model="tabsStyle" class="config-input">
                    <el-option label="标签风格" value="card" />
                    <el-option label="谷歌风格" value="google" />
                    <el-option label="简约风格" value="plain" />
                  </el-select>
                </div>

                <div class="config-item">
                  <div class="config-label">组件尺寸</div>
                  <el-select
                    placeholder="请选择组件尺寸"
                    v-model="dimension"
                    clearable
                    class="config-input"
                    @change="handleDimension"
                  >
                    <el-option v-for="item in dimensionList" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </div>

                <ReSwitch
                  title="菜单手风琴"
                  tip="菜单展开[启用-单个/关闭-多个]"
                  v-model="uniqueOpened"
                />

                <ReSwitch title="侧边栏反转色" v-model="asideInverted" />

                <ReSwitch title="头部反转色" v-model="headerInverted" />

                <ReSwitch
                  title="灰色模式"
                  v-model="isGrey"
                  @change="changeGreyOrWeak('grey', !!$event)"
                />

                <ReSwitch
                  title="色弱模式"
                  v-model="isWeak"
                  @change="changeGreyOrWeak('weak', !!$event)"
                />

                <ReSwitch title="折叠菜单" v-model="isCollapse" />
                </div>
              </div>
            </div>
          </template>

          <!-- ============ 扩展：工具栏开关 + 消息通知 + 水印 ============ -->
          <template #extension>
            <!-- 工具栏开关 -->
            <div class="config-section">
              <div class="section-header">
                <el-icon :size="18" class="section-icon"><Operation /></el-icon>
                <span class="section-title">工具栏开关</span>
              </div>
              <div class="section-card">
                <div class="extension-switches">
                  <ReSwitch
                    v-for="item in toolbarSwitchList"
                    :key="item.key"
                    :title="item.label"
                    v-model="toolbarConfig[item.key]"
                  />
                </div>
              </div>
            </div>

            <!-- 消息通知 -->
            <div class="config-section">
              <div class="section-header">
                <el-icon :size="18" class="section-icon"><Bell /></el-icon>
                <span class="section-title">消息通知</span>
              </div>
              <div class="section-card">
                <div class="config-item">
                  <div class="config-label">展示位置</div>
                  <el-select v-model="messagePosition" class="config-input" @change="handleMessagePosition">
                    <el-option label="顶栏铃铛" value="toolbar" />
                    <el-option label="右下角浮窗" value="right-bottom" />
                    <el-option label="全部隐藏" value="hidden" />
                  </el-select>
                </div>
                <ReSwitch
                  title="实时推送"
                  tip="依赖 Socket 实时推送；关闭后仅 HTTP 拉取"
                  v-model="messageSocket"
                />
              </div>
            </div>

            <!-- 水印配置 -->
            <div class="config-section">
              <div class="section-header">
                <el-icon :size="18" class="section-icon"><Stamp /></el-icon>
                <span class="section-title">水印配置</span>
              </div>
              <div class="section-card">
                <ReSwitch title="启用全局水印" v-model="watermarkEnable" @change="handleWatermarkChange" />
                <div v-if="watermarkEnable" class="watermark-fields">
                  <el-input
                    v-model="watermarkText"
                    class="config-input"
                    placeholder="水印文案"
                    clearable
                    @change="handleWatermarkText"
                  />
                </div>
              </div>
            </div>
          </template>
        </ReTab>
      </div>
    </template>
  </ReDrawer>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch, computed } from "vue";
import { DEFAULT_THEME } from "@repo/config";
import { useTheme } from "@repo/theme";
import { storeToRefs } from "pinia";
import { clearSessionStorage, mittBus, applyMessageColorVars, mixColor, normalizeThemeColor } from "@repo/utils";
import useGlobalStore from "@repo/pinia/modules/global";
import { msgSuccess } from "@repo/core";
import { applyGlobalWatermark } from "@repo/core";
import { useI18n } from "vue-i18n";
import { getConfig, setConfig } from "@repo/config";
import type { OtherConfig, MessageConfig, TimerConfig, AppConfig } from "@repo/config";
import { ElMessage } from "element-plus";
import ReTab, { type ReTabItem } from "@repo/ui/re-tab";
import ReSwitch from "@repo/ui/re-switch";
import KoiLoginStyleSelector from "@repo/theme/koi/views/login/components/KoiLoginStyleSelector.vue";
import { Refresh, ArrowDown, Delete, Plus, Clock, Files, Download, Upload } from "@element-plus/icons-vue";
const { t } = useI18n();
const globalStore = useGlobalStore();

// 主题配置抽屉关闭是否二次确认（app.yaml other.themeConfigCloseConfirm）
const themeConfigCloseConfirm = computed(() => getConfig().other.themeConfigCloseConfirm);

// 设置面板 tab 分栏（高级置于扩展右侧）
const activeTab = ref("appearance");
const configTabs: ReTabItem[] = [
  { name: "appearance", label: "外观", icon: "Connection" },
  { name: "interface", label: "界面", icon: "Grid" },
  { name: "extension", label: "扩展", icon: "Menu" },
  { name: "advanced", label: "高级", icon: "Setting" },
];

const { changeThemeColor, changeGreyOrWeak, changeThemeMode } = useTheme();
const {
  layout,
  isCollapse,
  transition,
  tabsStyle,
  uniqueOpened,
  menuWidth,
  isGrey,
  isWeak,
  asideInverted,
  headerInverted,
  themeMode,
  isDark
} = storeToRefs(globalStore);

// 主题模式选项（明亮 / 黑暗 / 自动）→ 胶囊式分段控件
const themeModeTabs: ReTabItem[] = [
  { name: "light", label: "明亮", icon: "Sunny" },
  { name: "dark", label: "黑暗", icon: "Moon" },
  { name: "auto", label: "自动", icon: "Monitor" },
];

// ==================== 自定义主题颜色：基色 + 亮度/深浅滑条 ====================
/** 自定义颜色基色（取色器选出的色相，不含明暗调整） */
const customBase = ref<string>(normalizeThemeColor(globalStore.themeColor || DEFAULT_THEME));
/** 亮度/深浅调整（-100 ~ +100，负=加深，正=提亮） */
const customLightness = ref(0);

/** 根据基色 + 亮度调整计算最终颜色 */
function adjustLightness(hex: string, value: number): string {
  const safe = normalizeThemeColor(hex);
  if (value > 0) return mixColor(safe, "#ffffff", value / 100);
  if (value < 0) return mixColor(safe, "#000000", -value / 100);
  return safe;
}

/** 自定义颜色（响应式：基色或滑条变化即重算） */
const customColor = computed(() => adjustLightness(customBase.value, customLightness.value));

/** 自定义色当前是否生效（当前主题色不在预设色板中即视为自定义色） */
const isCustomActive = computed(() => !themeColors.includes(globalStore.themeColor));

/** 取色器选中新基色：重置亮度并应用 */
const handleCustomColor = (val: string | null) => {
  if (!val) return;
  customBase.value = normalizeThemeColor(val);
  customLightness.value = 0;
  applyCustomColor();
};

/** 应用当前自定义颜色到主题 */
const applyCustomColor = () => {
  changeThemeColor(customColor.value);
};

// ==================== 颜色状态：消息提示四种状态色（实时控制全局 message 颜色） ====================
/** 消息状态默认色值 */
const MSG_STATUS_DEFAULTS: Record<string, string> = {
  success: "#16A34A",
  warning: "#F97316",
  danger: "#DC2626",
  info: "#5D5B6E",
};

/** 消息状态项：type（对应 el-message）/ 标题 / 色值（可被用户取色修改）/ 左侧图标 */
const msgStatusItems = reactive<Array<{ type: string; label: string; color: string; badgeIcon: string }>>([
  { type: "success", label: "成功", color: MSG_STATUS_DEFAULTS.success, badgeIcon: "Check" },
  { type: "warning", label: "警告", color: MSG_STATUS_DEFAULTS.warning, badgeIcon: "Check" },
  { type: "danger", label: "危险", color: MSG_STATUS_DEFAULTS.danger, badgeIcon: "Check" },
  { type: "info", label: "信息", color: MSG_STATUS_DEFAULTS.info, badgeIcon: "ArrowDown" },
]);

/** 取色变化：实时写 CSS 变量控制全局 message 颜色，并触发演示 */
const handleMsgColorChange = (item: { type: string; color: string }, val: string | null) => {
  if (!val) {
    return;
  }
  item.color = val;
  applyMessageColorVars(document.documentElement, { [item.type]: val }, isDark.value);
  handleMsgStatusClick(item.type);
};

/** 点击状态卡片 → 触发对应类型的 el-message 演示 */
const handleMsgStatusClick = (type: string) => {
  const handlers: Record<string, () => void> = {
    success: () => ElMessage.success("成功提示：操作已完成"),
    warning: () => ElMessage.warning("警告提示：请确认操作"),
    danger: () => ElMessage.error("危险提示：操作失败"),
    info: () => ElMessage.info("信息提示：这是一条消息"),
  };
  handlers[type]?.();
};

/** 挂载时写入消息状态色 CSS 变量（保证全局 message 使用用户配置色） */
const applyAllMsgStatusColors = () => {
  const colors: Record<string, string> = {};
  msgStatusItems.forEach((item) => {
    colors[item.type] = item.color;
  });
  applyMessageColorVars(document.documentElement, colors, isDark.value);
};

// 组件尺寸相关
const dimension = computed(() => globalStore.dimension);
const dimensionList = ref<any>([]);

onMounted(() => {
  handleSwitchLanguage();
  mittBus.on(THEME_CONFIG_EVENT, handleThemeConfig);
  // 应用消息状态色 CSS 变量（实时控制全局 el-message 颜色）
  applyAllMsgStatusColors();
  // 暗色模式色阶不同，切换时重算
  watch(isDark, applyAllMsgStatusColors);
});

onUnmounted(() => {
  mittBus.off(THEME_CONFIG_EVENT, handleThemeConfig);
});

/** 切换语言 */
const handleSwitchLanguage = () => {
  dimensionList.value = [
    { label: t("header.dimensionList.default"), value: "default" },
    { label: t("header.dimensionList.large"), value: "large" },
    { label: t("header.dimensionList.small"), value: "small" }
  ];
};

/** 监听 globalStore.language 的变化 */
watch(
  () => globalStore.language,
  () => {
    handleSwitchLanguage();
  }
);

const handleDimension = (item: string) => {
  if (dimension.value === item) return;
  globalStore.setDimension(item);
  msgSuccess(t("msg.success"));
};

// 主题颜色配置
/** 预设主题色：2 行 × 6 正圆形色板 */
const themeColors = [
  // 第一行：选定蓝 / 深蓝 / 浅紫 / 灰紫 / 青绿色 / 深墨绿
  "#3986FF",
  "#1E56A0",
  "#A78BFA",
  "#8A7FA8",
  "#0FB5AE",
  "#0E7C66",
  // 第二行：橘橙 / 亮天蓝 / 正红 / 深紫 / 玫红 / 湖蓝
  "#FF7A2F",
  "#2EC9FF",
  "#F5222D",
  "#722ED1",
  "#EB2F96",
  "#13C2C2",
];

/** 布局预览类名 koi-* 前缀，避免与 html class / 真实 Layout 组件冲突 */
const layoutOptions = [
  { value: "vertical", label: "纵向", previewClass: "koi-layout-vertical", hasContainer: true, hasLight: false },
  { value: "columns", label: "分栏", previewClass: "koi-layout-columns", hasContainer: false, hasLight: false },
  { value: "double", label: "双栏", previewClass: "koi-layout-double", hasContainer: false, hasLight: false },
  { value: "classic", label: "经典", previewClass: "koi-layout-classic", hasContainer: true, hasLight: false },
  { value: "optimum", label: "混合", previewClass: "koi-layout-optimum", hasContainer: true, hasLight: false },
  { value: "horizontal", label: "横向", previewClass: "koi-layout-horizontal", hasContainer: false, hasLight: false }
];

const koiDrawerRef = ref();
const THEME_CONFIG_EVENT = "handleThemeConfig";

/** 打开主题配置 */
const handleThemeConfig = () => {
  koiDrawerRef.value?.koiOpen();
};

/** 布局切换（class 同步由 useTheme watch 自动完成，此处只改 store） */
const setLayout = (value: string) => {
  globalStore.setGlobalState("layout", value);
};

// ==================== 扩展 tab ====================

/** 工具栏开关列表（app.yaml other.toolbar） */
const toolbarSwitchList = [
  { key: "searchMenu", label: "搜索菜单" },
  { key: "refresh", label: "路由缓存刷新" },
  { key: "dark", label: "明亮/暗黑切换" },
  { key: "language", label: "语言翻译" },
  { key: "fullScreen", label: "全屏切换" },
  { key: "themeSetting", label: "主题配置入口" },
  { key: "user", label: "用户信息下拉" },
  { key: "breadcrumb", label: "面包屑导航" },
  { key: "breadcrumbDropdown", label: "面包屑子级下拉" },
  { key: "breadcrumbIcon", label: "面包屑图标" },
  { key: "tabIcon", label: "标签页图标" },
  { key: "logo", label: "Logo 显示" },
  { key: "message", label: "站内消息铃铛" },
] as const;

/** 响应式配置单例（直接修改即可实时联动组件开关） */
const appConfig = getConfig();

/** 工具栏开关 v-model（直接改响应式配置） */
const toolbarConfig = computed(() => appConfig.other.toolbar);

/** 顶部计时器：启用开关 / 时区列表（最多 3 个，UTC ±12） */
const timerEnable = ref(appConfig.other.timer.enable);
const timerZones = ref<number[]>([...appConfig.other.timer.zones]);
/** 最多时区数量 */
const MAX_TIMER_ZONES = 3;
/** UTC 偏移候选项（-12 ~ +12） */
const timerZoneOptions = Array.from({ length: 25 }, (_, i) => i - 12);

/** 时区标签（UTC+8 / UTC-5 / UTC±0） */
const formatZoneLabel = (offset: number): string =>
  offset === 0 ? "UTC±0（伦敦）" : `UTC${offset > 0 ? "+" : ""}${offset}`;

/** 添加时区（最多 3 个） */
const addTimerZone = () => {
  if (timerZones.value.length >= MAX_TIMER_ZONES) return;
  timerZones.value.push(0);
};

/** 移除时区 */
const removeTimerZone = (index: number) => {
  timerZones.value.splice(index, 1);
};

// 启用开关 / 时区列表变化 → 写回响应式配置（实时联动 Header 计时器）
watch(timerEnable, (val) => {
  appConfig.other.timer.enable = val;
});
watch(
  timerZones,
  (val) => {
    appConfig.other.timer.zones = val.slice(0, MAX_TIMER_ZONES);
  },
  { deep: true },
);

/** 消息通知：展示位置 / 实时推送 */
const messagePosition = ref(appConfig.message.position);
const messageSocket = ref(appConfig.message.socket);
const handleMessagePosition = (val: string) => {
  appConfig.message.position = val as "toolbar" | "right-bottom" | "hidden";
};
watch(messageSocket, (val) => {
  appConfig.message.socket = val;
});

/** 水印配置 */
const watermarkEnable = ref(appConfig.security.watermark.enable);
const watermarkText = ref(appConfig.security.watermark.text ?? "");
const handleWatermarkChange = (val: boolean) => {
  appConfig.security.watermark.enable = val;
  applyGlobalWatermark();
};
const handleWatermarkText = (val: string) => {
  appConfig.security.watermark.text = val;
  appConfig.security.watermark.enable = true;
  applyGlobalWatermark();
};

// ==================== 用户配置导入 / 导出 ====================

/** 导出文件前缀 */
const USER_CONFIG_FILE_PREFIX = "user-config";

/** 导出用户配置：appConfig 用户可调部分 + globalStore 界面状态 → JSON 文件 */
const exportUserConfig = () => {
  const cfg = getConfig();
  const snapshot = {
    version: 1,
    exportedAt: new Date().toISOString(),
    config: {
      other: JSON.parse(JSON.stringify(cfg.other)),
      message: JSON.parse(JSON.stringify(cfg.message)),
      security: {
        watermark: JSON.parse(JSON.stringify(cfg.security.watermark)),
      },
    },
    global: {
      themeColor: globalStore.themeColor,
      themeMode: globalStore.themeMode,
      layout: globalStore.layout,
      loginStyle: globalStore.loginStyle,
      transition: globalStore.transition,
      tabsStyle: globalStore.tabsStyle,
      dimension: globalStore.dimension,
      menuWidth: globalStore.menuWidth,
      uniqueOpened: globalStore.uniqueOpened,
      asideInverted: globalStore.asideInverted,
      headerInverted: globalStore.headerInverted,
      isGrey: globalStore.isGrey,
      isWeak: globalStore.isWeak,
    },
  };

  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${USER_CONFIG_FILE_PREFIX}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  msgSuccess("配置已导出");
};

/** 导入用户配置：读取 JSON 文件并应用（主题/布局/计时器等实时生效） */
const importUserConfig = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json,.json";
  input.onchange = async () => {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (
        !data ||
        typeof data !== "object" ||
        !data.config?.other ||
        typeof data.global !== "object"
      ) {
        throw new Error("invalid config file");
      }
      applyImportedConfig(data);
      msgSuccess("配置已导入");
    } catch {
      ElMessage.error("导入失败：文件格式不正确");
    }
  };
  input.click();
};

/** 应用导入的用户配置（写回响应式配置 + 全局状态 + 本地 ref 联动） */
const applyImportedConfig = (data: {
  config?: {
    other?: OtherConfig;
    message?: MessageConfig;
    security?: {
      watermark?: { enable?: boolean; text?: string; color?: string; alpha?: number; rotate?: number };
    };
  };
  global?: Record<string, unknown>;
}) => {
  const c = data.config ?? {};

  // 1. 响应式配置：工具栏/计时器/状态色/消息位置/水印（setConfig 深合并）
  setConfig({
    other: c.other as AppConfig["other"],
    message: c.message as AppConfig["message"],
    security: { watermark: c.security?.watermark } as AppConfig["security"],
  });

  // 2. 同步本组件本地 ref（其 watch 会继续写回响应式配置，保证抽屉 UI 一致）
  const timer = c.other?.timer as TimerConfig | undefined;
  if (timer) {
    timerEnable.value = !!timer.enable;
    timerZones.value = (timer.zones ?? []).slice(0, MAX_TIMER_ZONES);
  }
  const msg = c.message as MessageConfig | undefined;
  if (msg?.position) messagePosition.value = msg.position;
  if (typeof msg?.socket === "boolean") messageSocket.value = msg.socket;
  const wm = c.security?.watermark;
  if (wm) {
    watermarkEnable.value = !!wm.enable;
    watermarkText.value = wm.text ?? "";
  }

  // 3. 全局界面状态（layout / themeColor / themeMode 等）
  const g = data.global ?? {};
  const setters: Array<[string, unknown]> = [
    ["themeColor", g.themeColor],
    ["themeMode", g.themeMode],
    ["layout", g.layout],
    ["loginStyle", g.loginStyle],
    ["transition", g.transition],
    ["tabsStyle", g.tabsStyle],
    ["dimension", g.dimension],
    ["menuWidth", g.menuWidth],
    ["uniqueOpened", g.uniqueOpened],
    ["asideInverted", g.asideInverted],
    ["headerInverted", g.headerInverted],
    ["isGrey", g.isGrey],
    ["isWeak", g.isWeak],
  ];
  setters.forEach(([key, value]) => {
    if (value !== undefined) globalStore.setGlobalState(key, value);
  });

  // 4. 主题/水印实时重算（useTheme 全局 watch 已联动，此处兜底 + 水印需显式应用）
  useTheme().applyTheme();
  applyGlobalWatermark();
};

</script>

<style lang="scss">
/** 主题抽屉：遮罩与面板同速过渡，避免先亮遮罩后出面板造成的闪一下 */
.el-overlay.theme-config-overlay {
  transition: opacity 0.2s ease !important;
}

.el-drawer.theme-config-drawer {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

/* 内嵌透明取色器（el-color-picker 根节点不继承父 scoped id，须放在非 scoped 块） */
.msg-status-item__hidden-picker,
.theme-color-custom-card__hidden-picker {
  position: absolute !important;
  inset: 0;
  opacity: 0;

  .el-color-picker__trigger,
  .el-color-picker__color {
    display: block;
    width: 100%;
    height: 100%;
    padding: 0;
    border: none;
    background: transparent;
  }

  .el-color-picker__icon {
    display: none;
  }
}
</style>

<style lang="scss" scoped>
/** 主题配置面板：独立作用域，预览类名 koi-* 与真实 Layout 隔离 */
.theme-config-panel {
  isolation: isolate;
  contain: layout style;
}

.config-section {
  margin-bottom: 20px;
}

/* 配置项卡片：浅灰底 + 圆角，与抽屉背景区分 */
.section-card {
  padding: 14px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}

html.dark .section-card {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
}

/* 区块标题：浅蓝圆角方块图标（右上蓝点）+ 黑色加粗标题 + 标题下方渐变蓝短横条 */
.section-header {
  display: flex;
  align-items: center;
  padding-bottom: 16px;
  margin-bottom: 20px;

  .section-icon {
    position: relative;
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    margin-right: 10px;
    font-size: 17px;
    color: #2f8bf0;
    background: linear-gradient(135deg, #e8f2ff 0%, #d6e9ff 100%);
    border-radius: 10px;
    transition: all 0.3s ease;

    /* 图标右上角蓝色小圆点（新功能 / 未查看提醒标记） */
    &::after {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 8px;
      height: 8px;
      content: "";
      background: #2f8bf0;
      border: 2px solid var(--el-bg-color);
      border-radius: 50%;
      box-shadow: 0 0 6px rgba(47, 139, 240, 0.6);
    }
  }

  .section-title {
    position: relative;
    padding-bottom: 9px;
    font-size: 15px;
    font-weight: 700;
    color: #1f2329;
    line-height: 1.2;
    letter-spacing: 0.3px;

    /* 文字下方渐变蓝色短横条装饰 */
    &::after {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 34px;
      height: 3px;
      content: "";
      background: linear-gradient(90deg, #2f8bf0 0%, #7ab6ff 100%);
      border-radius: 3px;
    }
  }

  &:hover {
    .section-icon {
      transform: scale(1.05);
    }
  }
}

html.dark .section-header {
  .section-title {
    color: #e5eaf3;
  }

  .section-icon {
    background: linear-gradient(135deg, #1b2a3d 0%, #16232f 100%);
  }
}

/**
 * 主题模式切换：外层浅灰大圆角边框包裹三个选项，
 * 选中项叠加一层亮蓝圆角边框标记当前状态（明亮/黑暗无独立边框）。
 */
.theme-mode-tabs {
  width: 100%;

  /* 外层底盘：一整圈浅灰色大圆角边框，包裹全部选项 */
  :deep(.re-tab-capsule__nav) {
    padding: 3px;
    background: #f4f5f7;
    border: 1px solid #e4e6e8;
    border-radius: 12px;
  }

  /* 单个选项：选中时叠加亮蓝圆角边框；未选中无独立边框 */
  :deep(.re-tab-capsule__item) {
    padding: 6px 0;
    border: 1px solid transparent;
    border-radius: 9px;

    &.is-active {
      background: #fff;
      border-color: #2f8bf0;
      color: #2f8bf0;
      box-shadow: 0 1px 4px rgba(47, 139, 240, 0.18);
    }
  }

  :deep(.re-tab-capsule__item.is-active .re-tab-capsule__icon) {
    color: #2f8bf0;
  }
}

html.dark .theme-mode-tabs {
  :deep(.re-tab-capsule__nav) {
    background: #16181c;
    border-color: #2a2d33;
  }

  :deep(.re-tab-capsule__item) {
    &.is-active {
      background: #1e2430;
      border-color: #3d9bff;
      color: #6db4ff;
    }
  }

  :deep(.re-tab-capsule__item.is-active .re-tab-capsule__icon) {
    color: #6db4ff;
  }
}

/** 自定义颜色区域：左预览方块 + 中文字 + 右亮度/深浅滑条 */
.theme-color-custom-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  padding: 14px 18px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    border-color: var(--el-border-color);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  }

  .custom-swatch {
    position: relative;
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    cursor: pointer;
    border: 2px solid #fff;
    border-radius: 10px;
    outline: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.14);
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;

    &:hover {
      transform: scale(1.05);
    }

    .custom-swatch__check {
      font-size: 16px;
      color: #fff;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4));
      pointer-events: none;
    }
  }

  .custom-info {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 3px;
    min-width: 0;

    .custom-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--el-text-color-primary);
    }

    .custom-desc {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    .custom-hex {
      font-size: 13px;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      color: var(--el-text-color-primary);
    }
  }

  /* 右侧竖向亮度/深浅滑条 */
  .custom-lightness {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 78px;
    padding: 6px 0;
    background: var(--el-fill-color-lighter);
    border-radius: 20px;

    :deep(.el-slider) {
      height: 100%;
    }
  }
}

html.dark .theme-color-custom-card {
  background: #1d1d1d;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);

  .custom-title,
  .custom-hex {
    color: #e5e6eb;
  }

  .custom-desc {
    color: #6a6f78;
  }
}

/** 颜色状态：消息提示四种状态色卡片列表 */
.msg-status-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.msg-status-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--el-bg-color);
  border: 1px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;

  &:hover {
    transform: translateX(2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  /* 左侧色块：深色底 + 白色图标（可点击取色） */
  &__badge {
    position: relative;
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    color: #fff;
    border-radius: 7px;
    cursor: pointer;
    transition: transform 0.15s ease;

    &:hover {
      transform: scale(1.08);
    }
  }

  /* 中间文字 */
  &__text {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  &__label {
    font-size: 13px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    line-height: 1.3;
  }

  &__hex {
    font-size: 11px;
    font-weight: 400;
    color: var(--el-text-color-secondary);
    line-height: 1.3;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  }

  /* 右侧环形刷新：浅色圆形底 */
  &__refresh {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
  }

  /* ===== 成功：浅绿边框 / 深绿块 + 白对勾 / 浅淡绿圆形刷新 ===== */
  &--success {
    border-color: #bbe7c8;

    .msg-status-item__refresh {
      background: #e6f6ec;
      color: #16a34a;
    }
  }

  /* ===== 警告：浅橙边框 / 橙块 + 白对勾 / 浅米色圆形刷新 ===== */
  &--warning {
    border-color: #fed7aa;

    .msg-status-item__refresh {
      background: #fdf0e2;
      color: #f97316;
    }
  }

  /* ===== 危险：浅红边框 / 正红块 + 白对勾 / 浅粉色圆形刷新 ===== */
  &--danger {
    border-color: #fecaca;

    .msg-status-item__refresh {
      background: #fde8e8;
      color: #dc2626;
    }
  }

  /* ===== 信息：浅灰边框 / 深灰紫块 + 白下拉箭头 / 浅灰色圆形刷新 ===== */
  &--info {
    border-color: #e4e4ec;

    .msg-status-item__refresh {
      background: #f0f0f4;
      color: #5d5b6e;
    }
  }
}

/** 主题颜色选择器：2 行 × 6 正圆形预设色板 */
.theme-colors-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px 8px;

  .theme-color-item {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px 0;
    cursor: pointer;
    transition: transform 0.2s ease;

    &:hover {
      .color-dot {
        transform: scale(1.12);
      }
    }

    &:active {
      transform: scale(0.92);
    }

    /* 选中态：双层白蓝圆环 + 对勾 */
    &.active {
      .color-dot {
        box-shadow:
          0 0 0 2px #fff,
          0 0 0 4px #3986ff;
      }

      .color-check {
        opacity: 1;
        transform: scale(1);
      }
    }

    .color-dot {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.14);
      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
    }

    .color-check {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      color: #fff;
      font-size: 14px;
      font-weight: 700;
      opacity: 0;
      transform: scale(0.6);
      filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.35));
      transition:
        opacity 0.2s ease,
        transform 0.2s ease;
    }
  }
}

/** 毛玻璃布局背景缩略图：3 列 × 2 行 */
.frost-wallpaper-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.frost-wallpaper-item {
  position: relative;
  aspect-ratio: 16 / 10;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  /** 兜底色在行内 frostWallpaperThumbStyle 中与主题联动；此处仅作 CSS 降级 */
  background-color: color-mix(in srgb, var(--el-color-primary) 14%, var(--el-fill-color-light));
  background-size: cover;
  background-position: center;
  border: 2px solid transparent;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 6%);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 14px rgb(0 0 0 / 10%);
  }

  &.is-active {
    border-color: var(--el-color-primary);
    box-shadow: 0 2px 12px rgba(var(--el-color-primary-rgb), 0.35);
  }
}

.frost-wallpaper-check {
  position: absolute;
  right: 4px;
  bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  font-size: 12px;
  color: #fff;
  background: var(--el-color-primary);
  border-radius: 50%;
}

/** 布局配置预览（koi-* 与真实 Layout / html class 隔离） */
.koi-layout-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  .koi-layout-item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 8px;
    cursor: pointer;
    border: 2px solid transparent;
    border-radius: 12px;
    background: var(--el-bg-color);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      background-color: var(--el-fill-color-light);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
    }

    &.is-active {
      background-color: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary);
      box-shadow: 0 4px 20px rgba(var(--el-color-primary-rgb), 0.3);
    }

    .koi-layout-preview {
      isolation: isolate;
      width: 80px;
      height: 60px;
      margin-bottom: 8px;
      padding: 6px;
      border-radius: 8px;
      background: var(--el-fill-color-lighter);
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);

      .koi-block-aside {
        background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .koi-block-header {
        background: linear-gradient(135deg, var(--el-color-primary-light-5), var(--el-color-primary-light-7));
        border-radius: 4px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .koi-block-main {
        background: linear-gradient(135deg, var(--el-color-primary-light-8), var(--el-color-primary-light-9));
        border: 1px dashed var(--el-color-primary-light-5);
        border-radius: 4px;
      }
    }

    .koi-layout-label {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      text-align: center;
    }

    .koi-layout-check {
      position: absolute;
      top: 6px;
      right: 6px;
      width: 18px;
      height: 18px;
      background: var(--el-color-primary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 11px;
      animation: fadeInScale 0.3s ease;
    }
  }

  .koi-layout-vertical .koi-layout-preview {
    display: flex;
    justify-content: space-between;

    .koi-block-aside {
      width: 20%;
    }

    .koi-layout-inner {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 73%;

      .koi-block-header {
        height: 20%;
      }

      .koi-block-main {
        height: 69%;
      }
    }
  }

  .koi-layout-gradation .koi-layout-preview {
    display: flex;
    justify-content: space-between;

    .koi-block-aside {
      width: 20%;
      border-radius: 3px;
    }

    .koi-layout-inner {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 73%;
      padding: 2px;
      border-radius: 6px;
      background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--el-color-primary) 22%, var(--el-bg-color-page)),
        color-mix(in srgb, var(--el-bg-color-page) 88%, transparent)
      );

      .koi-block-header {
        height: 17%;
      }

      .koi-block-main {
        height: 70%;
        border-radius: 5px;
      }
    }
  }

  .koi-layout-frosted .koi-layout-preview {
    display: flex;
    justify-content: space-between;
    position: relative;
    overflow: hidden;

    &::after {
      position: absolute;
      inset: 0;
      pointer-events: none;
      content: "";
      background: linear-gradient(
        125deg,
        transparent 30%,
        color-mix(in srgb, var(--el-color-primary-light-7) 55%, transparent) 48%,
        transparent 62%
      );
      opacity: 0.45;
      mix-blend-mode: soft-light;
    }

    .koi-block-aside {
      width: 20%;
      border-radius: 3px;
      filter: blur(0.3px);
    }

    .koi-layout-inner {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 73%;
      padding: 2px;
      border-radius: 6px;
      background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--el-color-primary) 18%, var(--el-bg-color-page)),
        color-mix(in srgb, var(--el-bg-color-page) 82%, transparent)
      );
      backdrop-filter: blur(1px);

      .koi-block-header {
        height: 17%;
        opacity: 0.85;
      }

      .koi-block-main {
        height: 70%;
        border-radius: 5px;
        border: 1px dashed color-mix(in srgb, var(--el-color-primary) 35%, transparent);
      }
    }
  }

  .koi-layout-columns .koi-layout-preview {
    display: flex;
    justify-content: space-between;

    .koi-block-aside {
      width: 14%;
    }

    .koi-block-header {
      width: 17%;
    }

    .koi-block-main {
      width: 55%;
    }
  }

  .koi-layout-gradation-columns .koi-layout-preview {
    display: flex;
    justify-content: space-between;

    .koi-block-aside {
      width: 14%;
      border-radius: 3px;
    }

    .koi-block-header {
      width: 17%;
      border-radius: 3px;
      opacity: 0.95;
    }

    .koi-block-main {
      width: 53%;
      padding: 2px;
      border-radius: 6px;
      box-sizing: border-box;
      background: linear-gradient(
        125deg,
        color-mix(in srgb, var(--el-color-primary) 14%, var(--el-bg-color-page)),
        color-mix(in srgb, var(--el-bg-color-page) 90%, #fafbfc)
      );
    }
  }

  .koi-layout-frosted-columns .koi-layout-preview {
    display: flex;
    justify-content: space-between;
    position: relative;
    overflow: hidden;

    &::after {
      position: absolute;
      inset: 0;
      pointer-events: none;
      content: "";
      background: linear-gradient(
        125deg,
        transparent 30%,
        color-mix(in srgb, var(--el-color-primary-light-7) 48%, transparent) 50%,
        transparent 64%
      );
      opacity: 0.42;
      mix-blend-mode: soft-light;
    }

    .koi-block-aside {
      width: 14%;
      border-radius: 3px;
      filter: blur(0.2px);
    }

    .koi-block-header {
      width: 17%;
      border-radius: 3px;
      opacity: 0.93;
    }

    .koi-block-main {
      width: 53%;
      padding: 2px;
      border-radius: 6px;
      box-sizing: border-box;
      background: linear-gradient(
        125deg,
        color-mix(in srgb, var(--el-color-primary) 17%, var(--el-bg-color-page)),
        color-mix(in srgb, var(--el-bg-color-page) 86%, transparent)
      );
      border: 1px dashed color-mix(in srgb, var(--el-color-primary) 30%, transparent);
    }
  }

  .koi-layout-classic .koi-layout-preview {
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .koi-block-aside {
      height: 22%;
    }

    .koi-layout-inner {
      display: flex;
      justify-content: space-between;
      height: 70%;

      .koi-block-header {
        width: 20%;
      }

      .koi-block-main {
        width: 70%;
      }
    }
  }

  .koi-layout-optimum .koi-layout-preview {
    display: flex;
    justify-content: space-between;

    .koi-block-aside {
      width: 20%;
    }

    .koi-layout-inner {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 73%;

      .koi-block-header {
        height: 16%;
      }

      .koi-block-main {
        height: 72%;
      }
    }
  }

  .koi-layout-horizontal .koi-layout-preview {
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .koi-block-aside {
      height: 20%;
    }

    .koi-block-main {
      height: 67%;
    }
  }

  /** 双栏：浅蓝圆角实线外框 + 3 实心蓝竖条 + 1 虚线方框 + 右上角蓝色圆勾 + 底部居中蓝色文字 */
  .koi-layout-double.koi-layout-item {
    background: #f0f7ff;
    border-color: #bfdbfe;

    &:hover {
      background-color: #e8f1ff;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(47, 139, 240, 0.12);
    }

    &.is-active {
      background-color: #e6f1ff;
      border-color: #2f8bf0;
      box-shadow: 0 4px 20px rgba(47, 139, 240, 0.3);
    }

    .koi-layout-preview {
      display: flex;
      gap: 3px;
      align-items: stretch;
      padding: 8px;
      background: #fff;
      border: 1px solid #dbeafe;
      border-radius: 8px;
      box-sizing: border-box;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
    }

    .koi-double-bar {
      flex-shrink: 0;
      width: 14%;
      height: auto;
      border-radius: 3px;
      background: linear-gradient(180deg, #2f8bf0 0%, #7ab6ff 100%);
    }

    .koi-double-dashed {
      flex: 1;
      height: auto;
      border: 1.5px dashed #7ab6ff;
      border-radius: 4px;
    }

    .koi-layout-label {
      font-weight: 600;
      color: #2f8bf0;
    }

    .koi-layout-check {
      background: #2f8bf0;
      box-shadow: 0 2px 8px rgba(47, 139, 240, 0.4);
    }
  }
}

/** 双栏卡片：暗色模式深蓝底 */
html.dark .koi-layout-double.koi-layout-item {
  background: #17212b;
  border-color: #2a4a6b;

  &:hover {
    background-color: #1a2632;
    box-shadow: 0 6px 20px rgba(61, 155, 255, 0.12);
  }

  &.is-active {
    background-color: #1e2c3c;
    border-color: #3d9bff;
    box-shadow: 0 4px 20px rgba(61, 155, 255, 0.3);
  }

  .koi-layout-preview {
    background: #0f1419;
    border-color: #29415a;
  }

  .koi-double-bar {
    background: linear-gradient(180deg, #3d9bff 0%, #6db4ff 100%);
  }

  .koi-double-dashed {
    border-color: #6db4ff;
  }

  .koi-layout-label {
    color: #6db4ff;
  }

  .koi-layout-check {
    background: #3d9bff;
    box-shadow: 0 2px 8px rgba(61, 155, 255, 0.4);
  }
}

/** 登录页样式选择器（与布局选择器同风格） */
.koi-login-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  .koi-login-item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 8px;
    cursor: pointer;
    border: 2px solid transparent;
    border-radius: 12px;
    background: var(--el-bg-color);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      background-color: var(--el-fill-color-light);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
    }

    &.is-active {
      background-color: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary);
      box-shadow: 0 4px 20px rgba(var(--el-color-primary-rgb), 0.3);
    }

    .koi-login-preview {
      isolation: isolate;
      width: 80px;
      height: 60px;
      margin-bottom: 8px;
      padding: 8px;
      border-radius: 8px;
      background: var(--el-fill-color-lighter);
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      position: relative;

      /* 表单骨架 */
      .koi-login-preview-form {
        display: flex;
        flex-direction: column;
        gap: 4px;
        width: 42%;
        padding: 5px 6px;
        border-radius: 4px;
        background: var(--el-bg-color);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      }

      .koi-login-preview-line {
        display: block;
        width: 100%;
        height: 3px;
        border-radius: 2px;
        background: var(--el-border-color);

        &--title {
          width: 70%;
          height: 5px;
          background: var(--el-color-primary);
          margin-bottom: 2px;
        }
      }

      .koi-login-preview-btn {
        display: block;
        width: 100%;
        height: 6px;
        border-radius: 3px;
        margin-top: 2px;
        background: var(--el-color-primary);
        opacity: 0.85;
      }
    }

    /* 各样式缩略图差异 */
    .koi-login-glass .koi-login-preview {
      background: var(--el-color-primary-light-8);
    }

    .koi-login-slide .koi-login-preview {
      .koi-login-preview-form {
        margin-left: auto;
      }
    }

    .koi-login-split .koi-login-preview {
      background: linear-gradient(135deg, var(--el-color-primary-light-5) 55%, var(--el-fill-color-lighter) 55%);
    }

    .koi-login-simple .koi-login-preview {
      background-image: radial-gradient(var(--el-color-primary-light-5) 1px, transparent 1px);
      background-size: 10px 10px;
    }

    .koi-layout-label {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      text-align: center;
    }

    .koi-layout-check {
      position: absolute;
      top: 6px;
      right: 6px;
      width: 18px;
      height: 18px;
      background: var(--el-color-primary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 11px;
      animation: fadeInScale 0.3s ease;
    }
  }
}

/** 界面配置 */
.interface-config {
  display: flex;
  flex-direction: column;

  .config-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid var(--el-border-color-extra-light);

    &:last-child {
      border-bottom: none;
    }

    .config-label {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;
      margin-right: 16px;
      font-size: 14px;
      color: var(--el-text-color-primary);
      font-weight: 500;
      line-height: 1.4;
    }

    .config-input {
      width: 180px;
      flex-shrink: 1;
    }
  }

  :deep(.re-switch--card) {
    margin-top: 10px;
  }
}

/** 扩展：系统维护 */
.maintain-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .maintain-btn {
    width: 100%;
  }

  .maintain-tip {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.5;
  }
}

/** 扩展：工具栏开关 / 消息通知 / 水印（ReSwitch 卡片式） */
.extension-switches {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.config-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;

  .config-label {
    flex: 1;
    margin-right: 16px;
    font-size: 14px;
    color: var(--el-text-color-primary);
    font-weight: 500;
  }

  .config-input {
    width: 180px;
  }
}

.watermark-fields {
  margin-top: 12px;
}

/** 高级：计时器时区列表 */
.timer-zone-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;

  .config-item {
    padding: 6px 0;

    .config-label {
      flex: none;
      width: 56px;
      margin-right: 10px;
    }

    .config-input {
      flex: 1;
      width: auto;
    }

    .zone-remove-btn {
      flex-shrink: 0;
      margin-left: 6px;
    }
  }

  .zone-add-btn {
    width: 100%;
    margin-top: 2px;
  }

  .timer-zone-tip {
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
  }
}

/** 高级：用户配置导入 / 导出 */
.config-io {
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__btn {
    width: 100%;
    margin-left: 0;
  }

  &__tip {
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
  }
}

/** 动画 */
@keyframes fade-in-scale {
  0% {
    opacity: 0;
    transform: scale(0.6);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes color-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}

@keyframes color-preview-hover {
  0%,
  100% {
    transform: scale(1.05);
  }
  50% {
    transform: scale(1.08);
  }
}

@keyframes shimmer-sweep {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/** 响应式设计 */
// @media (max-width: 768px) {
//   .theme-colors-grid {
//     grid-template-columns: repeat(3, 1fr);
//     gap: 12px;
//   }

//   .layout-grid {
//     grid-template-columns: 1fr;
//     gap: 16px;
//   }

//   .interface-utils .utils-item {
//     flex-direction: column;
//     align-items: flex-start;
//     gap: 12px;

//     .utils-input {
//       width: 100%;
//     }
//   }
// }
</style>

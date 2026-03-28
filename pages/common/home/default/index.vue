<script setup>
import {  useRenderIcon  } from "@repo/components/ReIcon";
import { getConfig } from "@repo/config";
import { emitter, useLayoutLayoutStore, useUserStoreHook } from "@repo/core";
import { subscribeClock } from "@repo/utils";
import {
  computed,
  defineAsyncComponent,
  defineComponent,
  onErrorCaptured,
  nextTick,
  onBeforeMount,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  shallowRef,
  watch,
} from "vue";

const widgets = shallowRef();
const userLayoutObject = useLayoutLayoutStore();
const userStore = useUserStoreHook();

// 错误捕获组件
const SafePreview = defineComponent({
  name: "SafePreview",
  emits: ["error"],
  setup(props, { slots, emit }) {
    onErrorCaptured((err) => {
      emit("error", err);
      return false; // 阻止错误继续向上传播
    });
    return () => (slots.default ? slots.default() : null);
  },
});

const previewErrors = reactive({});
const handlePreviewError = (id) => {
  previewErrors[id] = true;
};

const CustomLayout = defineAsyncComponent(
  () => import("./layout/CustomLayout.vue"),
);
const hasLayout = computed(
  () => !!(getConfig().RemoteLayout || getConfig().LocationLayout),
);
const customizing = reactive({
  customizing: false,
});

// 搜索和筛选
const searchKeyword = ref("");
const selectedCategory = ref("all");
const currentTheme = ref("default");

// 设置项
const showHeaderInfo = ref(
  localStorage.getItem("home-show-header-info") !== "false",
);
watch(showHeaderInfo, (val) => {
  localStorage.setItem("home-show-header-info", String(val));
});

// 当前时间
const currentTime = ref(new Date());
let stopClockSubscription = null;

const FESTIVAL_THEME_META = {
  halloween: {
    badge: "Ghost Lab",
    description: "把首页切成幽灵紫与南瓜橙的夜巡控制台，卡片更有戏剧感。",
    highlights: [
      {
        icon: "ri:moon-foggy-line",
        label: "夜巡",
        title: "雾面氛围层",
        description: "强化深紫雾感和橙色点光，让页面先有气氛再有内容。",
      },
      {
        icon: "ri:ghost-2-line",
        label: "装饰",
        title: "悬浮卡片节奏",
        description: "让重点卡片有轻微发光边和浮动感，避免只是平铺换色。",
      },
      {
        icon: "ri:flashlight-line",
        label: "操作",
        title: "夜间控台交互",
        description: "按钮和状态强调改成暖橙主导，操作路径更聚焦。",
      },
    ],
  },
  christmas: {
    badge: "Aurora Gift",
    description: "首页变成松绿、礼盒红和暖金光泽的节日仪表舱。",
    highlights: [
      {
        icon: "ri:snowy-line",
        label: "氛围",
        title: "冷暖双层光",
        description: "保留松林深色底，叠加礼盒金色高光，画面更细腻。",
      },
      {
        icon: "ri:gift-2-line",
        label: "模块",
        title: "礼盒式信息块",
        description: "关键信息像礼盒分组陈列，视觉层次更明确。",
      },
      {
        icon: "ri:star-smile-line",
        label: "细节",
        title: "节庆高亮节奏",
        description: "高频按钮和摘要区改成暖金提示，不再只是单色绿红切换。",
      },
    ],
  },
  "spring-festival": {
    badge: "Lantern Grid",
    description: "用灯笼红、鎏金和绸缎光泽把首页做成迎新的值守看板。",
    highlights: [
      {
        icon: "ri:fire-line",
        label: "节奏",
        title: "迎新主视觉",
        description: "大面积中国红配合金色描边，建立更强的节庆识别。",
      },
      {
        icon: "ri:vip-crown-2-line",
        label: "重点",
        title: "鎏金信息层",
        description: "把关键指标和动作区提升成金色高权重信息层。",
      },
      {
        icon: "ri:sparkling-2-line",
        label: "动态",
        title: "灯火层次感",
        description: "装饰不只在背景，卡片本身也带一点灯火反光和温度。",
      },
    ],
  },
};

const festivalThemeMeta = computed(() => FESTIVAL_THEME_META[currentTheme.value] || null);
const handleThemeChange = (themeKey) => {
  currentTheme.value = themeKey || "default";
};

// 格式化时间
const formattedTime = computed(() => {
  const date = currentTime.value;
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
});

const formattedDate = computed(() => {
  const date = currentTime.value;
  const weekDays = [
    "星期日",
    "星期一",
    "星期二",
    "星期三",
    "星期四",
    "星期五",
    "星期六",
  ];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekDay = weekDays[date.getDay()];
  return `${month}月${day}日 ${weekDay}`;
});

// 获取欢迎语
const greeting = computed(() => {
  const hour = currentTime.value.getHours();
  if (hour < 6) return "凌晨好";
  if (hour < 9) return "早上好";
  if (hour < 12) return "上午好";
  if (hour < 14) return "中午好";
  if (hour < 17) return "下午好";
  if (hour < 19) return "傍晚好";
  return "晚上好";
});

// 统计信息
const widgetStats = computed(() => {
  const total = userLayoutObject.allCompsList()?.length || 0;
  const active = userLayoutObject.layout?.length || 0;
  const available = userLayoutObject.myCompsList()?.length || 0;
  return { total, active, available };
});

// 部件分类
const categories = computed(() => {
  const cats = new Map();
  cats.set("all", { label: "全部", count: 0 });

  userLayoutObject.allCompsList()?.forEach((item) => {
    cats.get("all").count++;
    const type = item.type === 1 ? "local" : "remote";
    if (!cats.has(type)) {
      cats.set(type, {
        label: type === "local" ? "本地部件" : "远程部件",
        count: 0,
      });
    }
    cats.get(type).count++;
  });

  return Array.from(cats.entries()).map(([key, value]) => ({
    value: key,
    ...value,
  }));
});

// 过滤后的部件列表
const filteredWidgetList = computed(() => {
  let list = userLayoutObject.myCompsList() || [];

  // 按分类筛选
  if (selectedCategory.value !== "all") {
    list = list.filter((item) => {
      if (selectedCategory.value === "local") return item.type === 1;
      if (selectedCategory.value === "remote") return item.type !== 1;
      return true;
    });
  }

  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    list = list.filter(
      (item) =>
        item.title?.toLowerCase().includes(keyword) ||
        item.description?.toLowerCase().includes(keyword),
    );
  }

  return list;
});

const handeCustom = async () => {
  customizing.customizing = true;
  nextTick(() => {
    const scale = 1;
    widgets.value.style.setProperty("transform", `scale(${scale})`);
    widgets.value.style.setProperty("--transform-scale", `${scale}`);
  });
};

/**
 * 恢复默认
 */
const backDefault = async () => {
  customizing.customizing = false;
  widgets.value.style.removeProperty("transform");
  userLayoutObject.resetLayout();
};
/**
 * 关闭
 */
const handleClose = async () => {
  customizing.customizing = false;
  widgets.value.style.removeProperty("transform");
};
/**
 *追加
 * @param item 追加
 */
const push = async (item) => {
  userLayoutObject.pushComp(item);
};

const handleUpdate = async () => {
  customizing.customizing = false;
  widgets.value.style.removeProperty("transform");
  userLayoutObject.saveLayout();
};

onBeforeMount(async () => {
  useLayoutLayoutStore().load();
});

onMounted(() => {
  handleThemeChange(document.documentElement.dataset.skin || "default");
  stopClockSubscription = subscribeClock((now) => {
    currentTime.value = new Date(now);
  });
  emitter.on("systemThemeChange", handleThemeChange);
});

onUnmounted(() => {
  stopClockSubscription?.();
  stopClockSubscription = null;
  emitter.off("systemThemeChange", handleThemeChange);
});
</script>
<template>
  <div
    ref="main"
    :class="[
      'widgets-home',
      customizing.customizing ? 'customizing' : '',
      `theme-${currentTheme}`,
    ]"
  >
    <div class="widgets-content">
      <!-- 优化后的头部区域 -->
      <div
        class="widgets-header"
        :class="{ 'header-compact': !showHeaderInfo }"
      >
          <div class="header-left" v-if="showHeaderInfo">
          <div class="header-greeting">
            <div class="greeting-text">
              <span class="greeting-hello">{{ greeting }}，</span>
              <span class="greeting-name">{{
                userStore?.username || "用户"
              }}</span>
            </div>
            <div class="greeting-subtitle">{{ $t("buttons.board") }}</div>
            <div v-if="festivalThemeMeta" class="festival-hero-note">
              <span class="festival-hero-kicker">{{ festivalThemeMeta.badge }}</span>
              <span class="festival-hero-copy">{{ festivalThemeMeta.description }}</span>
            </div>
          </div>
        </div>
        <div class="header-left" v-else>
          <div class="header-title">{{ $t("buttons.board") }}</div>
        </div>
        <div class="header-center" v-if="showHeaderInfo">
          <div class="header-time">
            <div class="time-display">{{ formattedTime }}</div>
            <div class="date-display">{{ formattedDate }}</div>
          </div>
        </div>
        <div class="header-right">
          <div
            class="header-stats"
            v-if="showHeaderInfo && hasLayout"
          >
            <div class="stat-item">
              <span class="stat-value">{{ widgetStats.active }}</span>
              <span class="stat-label">已添加</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value">{{ widgetStats.available }}</span>
              <span class="stat-label">可用</span>
            </div>
          </div>
          <div class="header-actions" v-if="hasLayout">
            <el-button
              v-if="customizing.customizing"
              type="primary"
              :icon="useRenderIcon('ep:check')"
              round
              @click="handleUpdate"
              >{{ $t("buttons.finish") }}</el-button>
            <el-button
              v-else
              type="primary"
              :icon="useRenderIcon('ep:edit')"
              round
              @click="handeCustom"
              >{{ $t("buttons.custom") }}</el-button>
          </div>
        </div>
      </div>

      <div v-if="festivalThemeMeta" class="festival-story-grid">
        <div
          v-for="item in festivalThemeMeta.highlights"
          :key="item.title"
          class="festival-story-card"
        >
          <div class="festival-story-icon">
            <IconifyIconOnline :icon="item.icon" />
          </div>
          <div class="festival-story-label">{{ item.label }}</div>
          <div class="festival-story-title">{{ item.title }}</div>
          <div class="festival-story-desc">{{ item.description }}</div>
        </div>
      </div>

      <!-- 部件内容区域 -->
      <div ref="widgets" class="widgets">
        <div class="widgets-wrapper">
          <div v-if="!hasLayout" class="empty-state">
            <div class="empty-icon">
              <el-icon :size="64">
                <component :is="useRenderIcon('ri:dashboard-3-line')" />
              </el-icon>
            </div>
            <div class="empty-title">暂无可用部件</div>
            <div class="empty-desc">{{ $t("message.noPlugin") }}</div>
          </div>
          <div v-else class="h-full">
            <div
              v-if="!userLayoutObject.hasSettingCompent()"
              class="empty-state"
            >
              <div class="empty-icon">
                <el-icon :size="64">
                  <component :is="useRenderIcon('ri:apps-2-add-line')" />
                </el-icon>
              </div>
              <div class="empty-title">开始自定义您的仪表板</div>
              <div class="empty-desc">点击右上角「自定义」按钮添加部件</div>
              <el-button
                type="primary"
                round
                @click="handeCustom"
                class="empty-action"
              >
                <el-icon class="mr-1">
                  <component :is="useRenderIcon('ep:plus')" />
                </el-icon>
                添加部件
              </el-button>
            </div>
            <CustomLayout
              v-else
              v-model="customizing.customizing"
            ></CustomLayout>
          </div>
        </div>
      </div>
    </div>

    <!-- 优化后的部件选择侧边栏 -->
      <div v-if="customizing.customizing" class="widgets-aside">
      <div class="aside-header">
        <div class="aside-title">
          <el-icon :size="20">
            <component :is="useRenderIcon('ri:apps-2-add-line')" />
          </el-icon>
          <span>添加部件</span>
        </div>
        <div class="aside-close" @click="handleClose()">
          <el-icon :size="18">
            <component :is="useRenderIcon('ep:close')" />
          </el-icon>
        </div>
      </div>

      <!-- 搜索栏 -->
      <div class="aside-search">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索部件..."
          clearable
          :prefix-icon="useRenderIcon('ep:search')"
        />
      </div>

      <!-- 分类筛选 -->
      <div class="aside-categories">
        <el-radio-group v-model="selectedCategory" size="small">
          <el-radio-button
            v-for="cat in categories"
            :key="cat.value"
            :value="cat.value"
          >
            {{ cat.label }} ({{ cat.count }})
          </el-radio-button>
        </el-radio-group>
      </div>

      <!-- 部件列表 -->
      <div class="aside-list">
        <div v-if="filteredWidgetList.length === 0" class="list-empty">
          <el-icon :size="40" color="var(--el-text-color-placeholder)">
            <component :is="useRenderIcon('ri:inbox-line')" />
          </el-icon>
          <p>没有找到匹配的部件</p>
        </div>
        <div
          v-for="item in filteredWidgetList"
          :key="item.key"
          class="widget-card"
          @click="push(item)"
        >
          <div class="widget-card-icon">
            <el-icon :size="24">
              <component :is="useRenderIcon(item.icon || 'ri:apps-line')" />
            </el-icon>
          </div>
          <div class="widget-card-content">
            <div class="widget-card-title">{{ item.title }}</div>
            <div class="widget-card-desc">
              {{ item.description || "暂无描述" }}
            </div>
            <div class="widget-card-meta">
              <el-tag
                size="small"
                :type="item.type === 1 ? 'success' : 'primary'"
              >
                {{ item.type === 1 ? "本地" : "远程" }}
              </el-tag>
            </div>
          </div>
          <div class="widget-card-action">
            <el-button type="primary" circle size="small">
              <el-icon><component :is="useRenderIcon('ep:plus')" /></el-icon>
            </el-button>
          </div>
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="aside-footer">
        <div class="footer-settings">
          <el-checkbox v-model="showHeaderInfo" size="small"
            >显示头部信息</el-checkbox>
        </div>
        <el-button size="small" @click="backDefault()">
          <el-icon class="mr-1"
            ><component :is="useRenderIcon('ep:refresh')"
          /></el-icon>
          {{ $t("buttons.default") }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
:deep(.vgl-item__resizer) {
  z-index: 99;
}

.vgl-layout {
  --vgl-placeholder-bg: var(--el-color-primary);
}

.widgets-home {
  --home-font-family:
    "Fira Sans",
    "Segoe UI",
    "PingFang SC",
    "Microsoft YaHei",
    sans-serif;
  --home-page-bg: linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0));
  --home-panel-bg: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.9));
  --home-panel-border: rgba(148, 163, 184, 0.12);
  --home-panel-shadow: 0 22px 40px -34px rgba(15, 23, 42, 0.2);
  --home-panel-overlay: linear-gradient(135deg, rgba(255, 255, 255, 0.22), transparent 40%);
  --home-panel-radius: 24px;
  --home-header-radius: 22px;
  --home-section-bg: transparent;
  --home-section-border: transparent;
  --home-section-shadow: none;
  --home-section-filter: none;
  --home-section-radius: 0px;
  --home-chip-bg: rgba(var(--el-color-primary-rgb), 0.06);
  --home-chip-border: rgba(var(--el-color-primary-rgb), 0.1);
  --home-chip-shadow: none;
  --home-chip-text: var(--el-color-primary);
  --home-stat-divider: rgba(148, 163, 184, 0.24);
  --home-title-color: var(--el-text-color-primary);
  --home-subtitle-color: var(--el-text-color-secondary);
  --home-time-color: var(--el-text-color-primary);
  --home-time-shadow: none;
  --home-heading-shadow: none;
  --home-empty-title-shadow: none;
  --home-empty-bg: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0.86));
  --home-empty-border: rgba(var(--el-color-primary-rgb), 0.16);
  --home-empty-shadow: 0 22px 44px -36px rgba(15, 23, 42, 0.2);
  --home-empty-icon-bg: linear-gradient(
    135deg,
    var(--el-color-primary-light-9),
    rgba(var(--el-color-primary-rgb), 0.18)
  );
  --home-empty-icon-color: var(--el-color-primary);
  --home-empty-icon-shadow:
    0 16px 32px rgba(var(--el-color-primary-rgb), 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
  --home-button-shadow: 0 12px 24px -20px rgba(var(--el-color-primary-rgb), 0.3);
  --home-festival-note-bg: rgba(var(--el-color-primary-rgb), 0.08);
  --home-festival-note-border: rgba(var(--el-color-primary-rgb), 0.14);
  --home-festival-note-shadow: 0 16px 28px -24px rgba(var(--el-color-primary-rgb), 0.18);
  --home-festival-card-bg: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.88));
  --home-festival-card-border: rgba(148, 163, 184, 0.14);
  --home-festival-card-shadow: 0 18px 34px -28px rgba(15, 23, 42, 0.16);
  --home-festival-card-overlay: linear-gradient(135deg, rgba(255, 255, 255, 0.24), transparent 55%);
  --home-festival-icon-bg: rgba(var(--el-color-primary-rgb), 0.12);
  --home-festival-icon-color: var(--el-color-primary);
  --home-festival-label: rgba(var(--el-color-primary-rgb), 0.7);
  display: flex;
  flex-direction: row;
  flex: 1;
  min-height: 100%;
  background: var(--home-page-bg);
  font-family: var(--home-font-family);
  color: var(--home-title-color);
}

.widgets-content {
  flex: 1;
  overflow: auto;
  overflow-x: hidden;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 头部区域 */
.widgets-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 22px 26px;
  background: var(--home-panel-bg);
  border-radius: var(--home-header-radius);
  border: 1px solid var(--home-panel-border);
  margin-bottom: 0;
  box-shadow: var(--home-panel-shadow);
  position: relative;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: var(--home-panel-overlay);
    pointer-events: none;
  }
}

.header-left {
  flex: 1;
  min-width: 0;
}

.header-greeting {
  .greeting-text {
    font-size: 28px;
    font-weight: 700;
    color: var(--home-title-color);
    margin-bottom: 6px;
    letter-spacing: -0.02em;
    text-shadow: var(--home-heading-shadow);

    .greeting-hello {
      color: var(--el-color-primary);
    }

    .greeting-name {
      color: var(--home-title-color);
    }
  }

  .greeting-subtitle {
    font-size: 14px;
    color: var(--home-subtitle-color);
  }
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--home-title-color);
  text-shadow: var(--home-heading-shadow);
}

.header-compact {
  padding: 14px 24px;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.header-time {
  text-align: center;

  .time-display {
    font-size: 36px;
    font-weight: 700;
    color: var(--home-time-color);
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.08em;
    text-shadow: var(--home-time-shadow);
    font-family:
      "Fira Code",
      "Consolas",
      "SFMono-Regular",
      monospace;
  }

  .date-display {
    font-size: 13px;
    color: var(--home-subtitle-color);
    margin-top: 6px;
  }
}

.header-right {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 20px;
}

.header-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 18px;
  background: var(--home-chip-bg);
  border-radius: 16px;
  border: 1px solid var(--home-chip-border);
  box-shadow: var(--home-chip-shadow);

  .stat-item {
    text-align: center;

    .stat-value {
      display: block;
      font-size: 20px;
      font-weight: 700;
      color: var(--home-chip-text);
    }

    .stat-label {
      font-size: 12px;
      color: var(--home-subtitle-color);
    }
  }

  .stat-divider {
    width: 1px;
    height: 30px;
    background: var(--home-stat-divider);
  }
}

.header-actions {
  :deep(.el-button) {
    padding: 10px 20px;
    font-weight: 500;
    box-shadow: var(--home-button-shadow);
  }
}

.festival-hero-note {
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 14px;
  max-width: min(360px, 100%);
  padding: 12px 14px;
  border-radius: 18px;
  background: var(--home-festival-note-bg);
  border: 1px solid var(--home-festival-note-border);
  box-shadow: var(--home-festival-note-shadow);
  backdrop-filter: blur(14px);
}

.festival-hero-kicker {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--home-festival-icon-color);
}

.festival-hero-copy {
  font-size: 13px;
  line-height: 1.55;
  color: var(--home-title-color);
}

.festival-story-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.festival-story-card {
  position: relative;
  overflow: hidden;
  padding: 18px 18px 16px;
  border-radius: 22px;
  background: var(--home-festival-card-bg);
  border: 1px solid var(--home-festival-card-border);
  box-shadow: var(--home-festival-card-shadow);

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: var(--home-festival-card-overlay);
    pointer-events: none;
  }
}

.festival-story-icon,
.festival-story-label,
.festival-story-title,
.festival-story-desc {
  position: relative;
  z-index: 1;
}

.festival-story-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
  font-size: 22px;
  background: var(--home-festival-icon-bg);
  color: var(--home-festival-icon-color);
}

.festival-story-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--home-festival-label);
}

.festival-story-title {
  margin-top: 8px;
  font-size: 17px;
  font-weight: 700;
  color: var(--home-title-color);
}

.festival-story-desc {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.65;
  color: var(--home-subtitle-color);
}

/* 部件内容区域 */
.widgets {
  --transform-scale: 1;
  transform-origin: top left;
  transition: transform 0.15s;
  flex: 1;
  min-height: 0;
  padding: 6px 0 0;
  border-radius: var(--home-section-radius);
  background: var(--home-section-bg);
  border: 1px solid var(--home-section-border);
  box-shadow: var(--home-section-shadow);
  backdrop-filter: var(--home-section-filter);
}

.item,
.widgets > .widgets-wrapper {
  width: 100%;
  height: 100%;
}

.widgets-wrapper {
  min-height: 100%;
  border-radius: var(--home-panel-radius);
  overflow: visible;
}

.draggable-box {
  height: 100%;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: clamp(280px, 40vh, 360px);
  width: 100%;
  text-align: center;
  max-width: min(720px, 100%);
  margin: 0 auto;
  padding: 44px 40px;
  border-radius: var(--home-panel-radius);
  border: 1px dashed var(--home-empty-border);
  background: var(--home-empty-bg);
  box-shadow: var(--home-empty-shadow);

  .empty-icon {
    width: 116px;
    height: 116px;
    border-radius: 50%;
    background: var(--home-empty-icon-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
    color: var(--home-empty-icon-color);
    box-shadow: var(--home-empty-icon-shadow);
  }

  .empty-title {
    font-size: 26px;
    font-weight: 700;
    color: var(--home-title-color);
    margin-bottom: 10px;
    letter-spacing: -0.02em;
    text-shadow: var(--home-empty-title-shadow);
  }

  .empty-desc {
    font-size: 15px;
    color: var(--home-subtitle-color);
    margin-bottom: 26px;
  }

  .empty-action {
    padding: 12px 30px;
    font-size: 15px;
    box-shadow: var(--home-button-shadow);
  }
}

html[data-skin="8bit"],
html.theme-8bit {
  .widgets-home {
    --home-font-family:
      "Fusion Pixel Zh_hans",
      "Courier New",
      "Microsoft YaHei",
      monospace;
    --home-page-bg:
      repeating-linear-gradient(
        90deg,
        rgba(17, 17, 17, 0.04) 0 1px,
        transparent 1px 24px
      ),
      repeating-linear-gradient(
        180deg,
        rgba(17, 17, 17, 0.04) 0 1px,
        transparent 1px 24px
      ),
      linear-gradient(180deg, #eff3f7 0%, #dbe2ea 100%);
    --home-panel-bg: linear-gradient(180deg, #ffffff, #f2f2f2);
    --home-panel-border: #111111;
    --home-panel-shadow: 8px 8px 0 rgba(17, 17, 17, 0.14);
    --home-panel-overlay: linear-gradient(180deg, transparent, transparent);
    --home-panel-radius: 0px;
    --home-header-radius: 0px;
    --home-chip-bg: #111111;
    --home-chip-border: #111111;
    --home-chip-shadow: none;
    --home-chip-text: #32cd32;
    --home-stat-divider: rgba(255, 255, 255, 0.2);
    --home-title-color: #101010;
    --home-subtitle-color: #494949;
    --home-time-color: #101010;
    --home-empty-bg: linear-gradient(180deg, #fafafa, #f0f0f0);
    --home-empty-border: #101010;
    --home-empty-shadow: 8px 8px 0 rgba(17, 17, 17, 0.14);
    --home-empty-icon-bg: linear-gradient(180deg, #9eff9e, #32cd32);
    --home-empty-icon-color: #101010;
    --home-empty-icon-shadow: none;
    --home-button-shadow: 4px 4px 0 rgba(17, 17, 17, 0.18);
  }

  .widgets-header,
  .header-stats,
  .empty-state {
    border-width: 3px;
    border-style: solid;
    backdrop-filter: none;
    box-shadow: none;
  }

  .empty-state {
    border-style: solid;
  }

  .empty-state .empty-icon {
    border-radius: 0;
  }
}

html[data-skin="future-tech"],
html.theme-future-tech {
  .widgets-home {
    --home-page-bg:
      radial-gradient(circle at top, rgba(0, 255, 255, 0.12), transparent 30%),
      linear-gradient(180deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0));
    --home-panel-bg: linear-gradient(180deg, rgba(7, 18, 42, 0.86), rgba(5, 12, 30, 0.78));
    --home-panel-border: rgba(0, 255, 255, 0.22);
    --home-panel-shadow: 0 28px 52px -36px rgba(0, 255, 255, 0.22);
    --home-panel-overlay: linear-gradient(135deg, rgba(97, 250, 255, 0.18), transparent 45%);
    --home-section-bg: linear-gradient(180deg, rgba(7, 18, 42, 0.22), rgba(5, 12, 30, 0.12));
    --home-section-border: rgba(0, 255, 255, 0.08);
    --home-section-shadow: inset 0 0 0 1px rgba(0, 255, 255, 0.04);
    --home-section-radius: 28px;
    --home-chip-bg: rgba(0, 255, 255, 0.08);
    --home-chip-border: rgba(0, 255, 255, 0.18);
    --home-chip-shadow: 0 18px 32px -26px rgba(0, 255, 255, 0.22);
    --home-chip-text: #66f8ff;
    --home-stat-divider: rgba(0, 255, 255, 0.18);
    --home-title-color: #dffcff;
    --home-subtitle-color: rgba(168, 240, 255, 0.72);
    --home-time-color: #66f8ff;
    --home-time-shadow: 0 0 16px rgba(0, 255, 255, 0.35);
    --home-heading-shadow: 0 0 12px rgba(0, 255, 255, 0.14);
    --home-empty-title-shadow: 0 0 12px rgba(0, 255, 255, 0.16);
    --home-empty-bg: linear-gradient(180deg, rgba(8, 23, 54, 0.88), rgba(3, 11, 26, 0.78));
    --home-empty-border: rgba(0, 255, 255, 0.2);
    --home-empty-shadow: 0 30px 48px -34px rgba(0, 255, 255, 0.24);
    --home-empty-icon-bg: radial-gradient(
      circle at 30% 30%,
      rgba(0, 255, 255, 0.32),
      rgba(0, 88, 122, 0.18) 62%,
      transparent 72%
    );
    --home-empty-icon-color: #66f8ff;
    --home-empty-icon-shadow: 0 0 26px rgba(0, 255, 255, 0.2);
    --home-button-shadow: 0 0 24px rgba(0, 255, 255, 0.12);
  }
}

html[data-skin="halloween"],
html.theme-halloween {
  .widgets-home {
    --home-page-bg:
      radial-gradient(circle at top, rgba(255, 117, 24, 0.12), transparent 28%),
      linear-gradient(180deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0));
    --home-panel-bg: linear-gradient(180deg, rgba(43, 10, 63, 0.88), rgba(23, 4, 35, 0.8));
    --home-panel-border: rgba(255, 117, 24, 0.22);
    --home-panel-shadow: 0 26px 48px -34px rgba(255, 117, 24, 0.22);
    --home-panel-overlay: linear-gradient(135deg, rgba(255, 145, 77, 0.18), transparent 45%);
    --home-section-bg: linear-gradient(180deg, rgba(43, 10, 63, 0.18), rgba(23, 4, 35, 0.12));
    --home-section-border: rgba(255, 117, 24, 0.08);
    --home-section-shadow: inset 0 0 0 1px rgba(255, 117, 24, 0.04);
    --home-section-radius: 28px;
    --home-chip-bg: rgba(255, 117, 24, 0.1);
    --home-chip-border: rgba(255, 117, 24, 0.18);
    --home-chip-shadow: 0 18px 32px -26px rgba(255, 117, 24, 0.22);
    --home-chip-text: #ffb05c;
    --home-stat-divider: rgba(255, 117, 24, 0.2);
    --home-title-color: #ffe5c8;
    --home-subtitle-color: rgba(255, 212, 171, 0.72);
    --home-time-color: #ffb05c;
    --home-time-shadow: 0 0 14px rgba(255, 117, 24, 0.26);
    --home-heading-shadow: 0 0 10px rgba(255, 117, 24, 0.1);
    --home-empty-title-shadow: 0 0 10px rgba(255, 117, 24, 0.12);
    --home-empty-bg: linear-gradient(180deg, rgba(52, 11, 76, 0.9), rgba(23, 4, 35, 0.8));
    --home-empty-border: rgba(255, 117, 24, 0.24);
    --home-empty-shadow: 0 28px 46px -34px rgba(255, 117, 24, 0.24);
    --home-empty-icon-bg: radial-gradient(
      circle at 30% 30%,
      rgba(255, 180, 92, 0.34),
      rgba(255, 117, 24, 0.18) 62%,
      transparent 72%
    );
    --home-empty-icon-color: #ffb05c;
    --home-empty-icon-shadow: 0 0 24px rgba(255, 117, 24, 0.18);
    --home-button-shadow: 0 16px 28px -22px rgba(255, 117, 24, 0.26);
    --home-festival-note-bg: rgba(255, 176, 92, 0.12);
    --home-festival-note-border: rgba(255, 176, 92, 0.18);
    --home-festival-note-shadow: 0 18px 32px -24px rgba(255, 117, 24, 0.24);
    --home-festival-card-bg: linear-gradient(180deg, rgba(54, 11, 79, 0.92), rgba(23, 4, 35, 0.86));
    --home-festival-card-border: rgba(255, 176, 92, 0.18);
    --home-festival-card-shadow: 0 22px 36px -26px rgba(255, 117, 24, 0.22);
    --home-festival-card-overlay: linear-gradient(135deg, rgba(255, 176, 92, 0.16), transparent 52%);
    --home-festival-icon-bg: rgba(255, 176, 92, 0.14);
    --home-festival-icon-color: #ffb05c;
    --home-festival-label: rgba(255, 212, 171, 0.7);
  }
}

html[data-skin="christmas"],
html.theme-christmas {
  .widgets-home {
    --home-page-bg:
      radial-gradient(circle at top, rgba(255, 225, 138, 0.12), transparent 28%),
      linear-gradient(180deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0));
    --home-panel-bg: linear-gradient(180deg, rgba(17, 70, 28, 0.9), rgba(12, 42, 20, 0.82));
    --home-panel-border: rgba(255, 225, 138, 0.22);
    --home-panel-shadow: 0 26px 46px -34px rgba(17, 70, 28, 0.28);
    --home-panel-overlay: linear-gradient(135deg, rgba(255, 225, 138, 0.16), transparent 44%);
    --home-section-bg: linear-gradient(180deg, rgba(17, 70, 28, 0.18), rgba(12, 42, 20, 0.12));
    --home-section-border: rgba(255, 225, 138, 0.08);
    --home-section-shadow: inset 0 0 0 1px rgba(255, 225, 138, 0.04);
    --home-section-radius: 28px;
    --home-chip-bg: rgba(255, 225, 138, 0.1);
    --home-chip-border: rgba(255, 225, 138, 0.18);
    --home-chip-shadow: 0 18px 32px -26px rgba(255, 225, 138, 0.18);
    --home-chip-text: #ffe18a;
    --home-stat-divider: rgba(255, 225, 138, 0.2);
    --home-title-color: #fff5d1;
    --home-subtitle-color: rgba(243, 237, 214, 0.72);
    --home-time-color: #ffe18a;
    --home-time-shadow: 0 0 12px rgba(255, 225, 138, 0.18);
    --home-heading-shadow: 0 0 10px rgba(255, 225, 138, 0.08);
    --home-empty-title-shadow: 0 0 10px rgba(255, 225, 138, 0.1);
    --home-empty-bg: linear-gradient(180deg, rgba(14, 54, 25, 0.92), rgba(120, 18, 44, 0.66));
    --home-empty-border: rgba(255, 225, 138, 0.24);
    --home-empty-shadow: 0 28px 46px -34px rgba(17, 70, 28, 0.3);
    --home-empty-icon-bg: radial-gradient(
      circle at 30% 30%,
      rgba(255, 225, 138, 0.32),
      rgba(198, 40, 40, 0.18) 62%,
      transparent 72%
    );
    --home-empty-icon-color: #ffe18a;
    --home-empty-icon-shadow: 0 0 24px rgba(255, 225, 138, 0.16);
    --home-button-shadow: 0 16px 28px -22px rgba(17, 70, 28, 0.26);
    --home-festival-note-bg: rgba(255, 225, 138, 0.12);
    --home-festival-note-border: rgba(255, 225, 138, 0.16);
    --home-festival-note-shadow: 0 18px 30px -24px rgba(17, 70, 28, 0.22);
    --home-festival-card-bg: linear-gradient(180deg, rgba(18, 63, 27, 0.92), rgba(120, 18, 44, 0.72));
    --home-festival-card-border: rgba(255, 225, 138, 0.18);
    --home-festival-card-shadow: 0 22px 36px -26px rgba(17, 70, 28, 0.26);
    --home-festival-card-overlay: linear-gradient(135deg, rgba(255, 225, 138, 0.16), transparent 52%);
    --home-festival-icon-bg: rgba(255, 225, 138, 0.14);
    --home-festival-icon-color: #ffe18a;
    --home-festival-label: rgba(243, 237, 214, 0.74);
  }
}

html[data-skin="spring-festival"],
html.theme-spring-festival {
  .widgets-home {
    --home-page-bg:
      radial-gradient(circle at top, rgba(245, 213, 122, 0.14), transparent 28%),
      linear-gradient(180deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0));
    --home-panel-bg: linear-gradient(180deg, rgba(111, 4, 20, 0.92), rgba(78, 2, 14, 0.82));
    --home-panel-border: rgba(245, 213, 122, 0.22);
    --home-panel-shadow: 0 26px 48px -34px rgba(111, 4, 20, 0.32);
    --home-panel-overlay: linear-gradient(135deg, rgba(245, 213, 122, 0.16), transparent 44%);
    --home-section-bg: linear-gradient(180deg, rgba(111, 4, 20, 0.18), rgba(78, 2, 14, 0.12));
    --home-section-border: rgba(245, 213, 122, 0.08);
    --home-section-shadow: inset 0 0 0 1px rgba(245, 213, 122, 0.04);
    --home-section-radius: 28px;
    --home-chip-bg: rgba(245, 213, 122, 0.1);
    --home-chip-border: rgba(245, 213, 122, 0.18);
    --home-chip-shadow: 0 18px 32px -26px rgba(245, 213, 122, 0.18);
    --home-chip-text: #f8e3a4;
    --home-stat-divider: rgba(245, 213, 122, 0.18);
    --home-title-color: #fff2be;
    --home-subtitle-color: rgba(255, 235, 185, 0.72);
    --home-time-color: #f8e3a4;
    --home-time-shadow: 0 0 14px rgba(245, 213, 122, 0.16);
    --home-heading-shadow: 0 0 10px rgba(245, 213, 122, 0.08);
    --home-empty-title-shadow: 0 0 10px rgba(245, 213, 122, 0.1);
    --home-empty-bg: linear-gradient(180deg, rgba(103, 2, 19, 0.94), rgba(63, 1, 12, 0.82));
    --home-empty-border: rgba(245, 213, 122, 0.24);
    --home-empty-shadow: 0 28px 48px -34px rgba(111, 4, 20, 0.34);
    --home-empty-icon-bg: radial-gradient(
      circle at 30% 30%,
      rgba(245, 213, 122, 0.34),
      rgba(210, 85, 40, 0.16) 62%,
      transparent 72%
    );
    --home-empty-icon-color: #f8e3a4;
    --home-empty-icon-shadow: 0 0 24px rgba(245, 213, 122, 0.16);
    --home-button-shadow: 0 16px 28px -22px rgba(111, 4, 20, 0.28);
    --home-festival-note-bg: rgba(245, 213, 122, 0.12);
    --home-festival-note-border: rgba(245, 213, 122, 0.18);
    --home-festival-note-shadow: 0 18px 30px -24px rgba(111, 4, 20, 0.26);
    --home-festival-card-bg: linear-gradient(180deg, rgba(105, 4, 19, 0.94), rgba(63, 1, 12, 0.86));
    --home-festival-card-border: rgba(245, 213, 122, 0.18);
    --home-festival-card-shadow: 0 22px 38px -26px rgba(111, 4, 20, 0.3);
    --home-festival-card-overlay: linear-gradient(135deg, rgba(245, 213, 122, 0.16), transparent 52%);
    --home-festival-icon-bg: rgba(245, 213, 122, 0.16);
    --home-festival-icon-color: #f8e3a4;
    --home-festival-label: rgba(255, 235, 185, 0.74);
  }
}

/* 部件选择侧边栏 */
.widgets-aside {
  width: 360px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(20px) saturate(180%);
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--el-border-color-lighter);
  z-index: 100;
  border-radius: 28px 0 0 28px;
  overflow: hidden;
}

html.dark .widgets-aside {
  background: rgba(30, 30, 30, 0.85);
  border-left-color: var(--el-border-color-darker);
}

.aside-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(
    135deg,
    var(--el-color-primary),
    var(--el-color-primary-dark-2)
  );
  color: #fff;
}

.aside-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
}

.aside-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: rgba(255, 255, 255, 0.85);

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
  }
}

.aside-search {
  padding: 16px 20px 12px;

  :deep(.el-input__wrapper) {
    border-radius: 8px;
    box-shadow: 0 0 0 1px var(--el-border-color) inset;

    &:hover,
    &.is-focus {
      box-shadow: 0 0 0 1px var(--el-color-primary) inset;
    }
  }
}

.aside-categories {
  padding: 0 20px 16px;

  :deep(.el-radio-group) {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  :deep(.el-radio-button) {
    .el-radio-button__inner {
      border-radius: 16px !important;
      border: 1px solid var(--el-border-color) !important;
      padding: 6px 14px;
      font-size: 12px;
    }

    &.is-active .el-radio-button__inner {
      background: var(--el-color-primary);
      border-color: var(--el-color-primary) !important;
    }
  }
}

.aside-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 20px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color);
    border-radius: 3px;
  }
}

.list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--el-text-color-placeholder);

  p {
    margin-top: 12px;
    font-size: 14px;
  }
}

.widget-card {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  margin-bottom: 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.14);
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.94);
    border-color: rgba(var(--el-color-primary-rgb), 0.18);
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
    transform: translateY(-4px);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

    .widget-card-action .el-button {
      background: var(--el-color-primary);
      border-color: var(--el-color-primary);
    }
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.widget-card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-7),
    var(--el-color-primary-light-5)
  );
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-color-primary);
  flex-shrink: 0;
  margin-right: 14px;
}

.widget-card-content {
  flex: 1;
  min-width: 0;
}

.widget-card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Added for preview */
.widget-card.has-preview {
  flex-direction: column;
  align-items: flex-start;
  padding: 0;
  overflow: hidden;
  position: relative;

  .widget-card-content {
    padding: 12px 16px;
    width: 100%;
  }

  .widget-card-action {
    position: absolute;
    top: 8px;
    right: 8px;
  }
}

.item-preview {
  width: 100%;
  height: 140px;
  background: var(--el-bg-color-page);
  border-bottom: 1px solid var(--el-border-color-lighter);
  position: relative;
  overflow: hidden;
}

.preview-scaler {
  width: 200%;
  height: 200%;
  transform: scale(0.5);
  transform-origin: top left;
  pointer-events: none;
}

.preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  cursor: grab;
  background: transparent;
}

.widget-card-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 6px;
}

.widget-card-meta {
  :deep(.el-tag) {
    border-radius: 4px;
    font-size: 11px;
    padding: 0 6px;
    height: 20px;
  }
}

.widget-card-action {
  flex-shrink: 0;
  margin-left: 12px;

  :deep(.el-button) {
    width: 32px;
    height: 32px;
    transition: all 0.2s;
  }
}

.aside-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;

  .footer-settings {
    display: flex;
    align-items: center;
    gap: 12px;

    :deep(.el-checkbox) {
      margin-right: 0;
    }
  }

  :deep(.el-button) {
    padding: 8px 20px;
  }
}

/* 自定义模式 */
.customizing .widgets-wrapper {
  margin-right: -360px;
}

.customizing .widgets-wrapper .el-col {
  padding-bottom: 15px;
}

.customizing .widgets-wrapper .draggable-box {
  border: 1px dashed var(--el-color-primary);
  padding: 15px;
}

.customizing .widgets-wrapper .no-widgets {
  display: none;
}

.item .widgets-item {
  height: 100%;
}

.customizing .widgets-item {
  position: relative;
  margin-bottom: 15px;
  height: 100%;
}

.customize-overlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.5);
  cursor: move;
}

.customize-overlay label {
  background: var(--el-color-primary);
  color: #fff;
  height: 40px;
  padding: 0 30px;
  border-radius: 40px;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
}

.customize-overlay label i {
  margin-right: 15px;
  font-size: 24px;
}

.customize-overlay .close {
  position: absolute;
  top: 15px;
  right: 15px;
}

.customize-overlay .close:focus,
.customize-overlay .close:hover {
  background: var(--el-button-hover-color);
}

.widgets-wrapper .sortable-ghost {
  opacity: 0.5;
}

/* 深色模式 */
.dark {
  .widgets-home {
    --home-page-bg:
      radial-gradient(circle at top left, rgba(var(--el-color-primary-rgb), 0.12), transparent 28%),
      linear-gradient(180deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0));
    --home-panel-bg: linear-gradient(180deg, rgba(17, 24, 39, 0.9), rgba(15, 23, 42, 0.84));
    --home-panel-border: rgba(148, 163, 184, 0.16);
    --home-panel-shadow: 0 26px 46px -34px rgba(2, 6, 23, 0.52);
    --home-section-bg: linear-gradient(180deg, rgba(17, 24, 39, 0.14), rgba(15, 23, 42, 0.08));
    --home-section-border: rgba(148, 163, 184, 0.08);
    --home-section-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.04);
    --home-section-radius: 28px;
    --home-chip-bg: rgba(var(--el-color-primary-rgb), 0.08);
    --home-chip-border: rgba(var(--el-color-primary-rgb), 0.14);
    --home-chip-text: var(--el-color-primary-light-3);
    --home-stat-divider: rgba(148, 163, 184, 0.18);
    --home-title-color: #f8fafc;
    --home-subtitle-color: rgba(203, 213, 225, 0.72);
    --home-time-color: #f8fafc;
    --home-empty-bg: linear-gradient(180deg, rgba(17, 24, 39, 0.88), rgba(15, 23, 42, 0.78));
    --home-empty-border: rgba(var(--el-color-primary-rgb), 0.18);
    --home-empty-shadow: 0 28px 44px -34px rgba(2, 6, 23, 0.54);
    --home-empty-icon-bg: linear-gradient(
      135deg,
      rgba(var(--el-color-primary-rgb), 0.28),
      rgba(var(--el-color-primary-rgb), 0.16)
    );
    --home-empty-icon-color: #f8fafc;
    --home-empty-icon-shadow: 0 16px 32px rgba(2, 6, 23, 0.34);
  }

  .widgets-header,
  .widgets,
  .empty-state {
    border-color: rgba(148, 163, 184, 0.16);
  }

  .widgets-aside {
    background: var(--el-bg-color);
  }

  .customize-overlay {
    background: rgba(0, 0, 0, 0.6);
  }

  .widget-card:hover {
    background: var(--el-fill-color);
  }

  .empty-state .empty-icon {
    background: linear-gradient(
      135deg,
      var(--el-color-primary-dark-2),
      var(--el-color-primary)
    );
    color: #fff;
  }
}

/* 响应式 */
@media (max-width: 1200px) {
  .header-center {
    display: none;
  }
}

@media (max-width: 992px) {
  .festival-story-grid {
    grid-template-columns: 1fr;
  }

  .widgets-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .header-right {
    width: 100%;
    justify-content: space-between;
  }

  .customizing .widgets {
    transform: scale(1) !important;
  }

  .customizing .widgets-aside {
    width: 100%;
    position: absolute;
    top: 50%;
    right: 0;
    bottom: 0;
    border-radius: 16px 16px 0 0;
  }

  .customizing .widgets-wrapper {
    margin-right: 0;
  }
}

@media (max-width: 768px) {
  .widgets-content {
    padding: 12px;
  }

  .widgets-header {
    padding: 16px 18px;
  }

  .widgets {
    padding-top: 8px;
  }

  .empty-state {
    padding: 36px 22px;
    min-height: 280px;
  }

  .header-stats {
    display: none;
  }

  .festival-hero-note {
    max-width: 100%;
  }
}
</style>

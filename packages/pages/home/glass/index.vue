<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { getConfig } from "@repo/config";
import { useLayoutLayoutStore, useUserStoreHook } from "@repo/core";
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onBeforeMount,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  shallowRef,
} from "vue";

defineOptions({
  name: "GlassHomeTheme",
});

const widgets = shallowRef();
const userLayoutObject = useLayoutLayoutStore();
const userStore = useUserStoreHook();

const CustomLayout = defineAsyncComponent(
  () => import("./layout/CustomLayout.vue")
);
const openRemoteLayout = getConfig().RemoteLayout;
const openLocationLayout = getConfig().LocationLayout;
const customizing = reactive({
  customizing: false,
  hasLayout: openRemoteLayout || openLocationLayout,
});

// 搜索和筛选
const searchKeyword = ref("");
const selectedCategory = ref("all");

// 设置项
const showHeaderInfo = ref(true); // 默认显示头部

// 当前时间
const currentTime = ref(new Date());
let timeInterval = null;

// 格式化时间
const formattedTime = computed(() => {
  const date = currentTime.value;
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
});

const formattedDate = computed(() => {
  const date = currentTime.value;
  const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  const weekDay = weekDays[date.getDay()];
  return `${weekDay}, ${month} ${day}`;
});

// 获取欢迎语
const greeting = computed(() => {
  const hour = currentTime.value.getHours();
  if (hour < 6) return "Good Night";
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
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
  cats.set("all", { label: "All", count: 0 });
  
  userLayoutObject.allCompsList()?.forEach((item) => {
    cats.get("all").count++;
    const type = item.type === 1 ? "local" : "remote";
    if (!cats.has(type)) {
      cats.set(type, { label: type === "local" ? "Local" : "Remote", count: 0 });
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
        item.description?.toLowerCase().includes(keyword)
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
  timeInterval = setInterval(() => {
    currentTime.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
});
</script>

<template>
  <div class="glass-home-page">
    <!-- 动态背景 -->
    <div class="background-mesh">
      <div class="mesh-shape shape-1"></div>
      <div class="mesh-shape shape-2"></div>
      <div class="mesh-shape shape-3"></div>
      <div class="mesh-shape shape-4"></div>
    </div>
    
    <div class="background-overlay"></div>

    <div
      class="home-main-container"
      ref="main"
      :class="{ 'is-customizing': customizing.customizing }"
    >
      <div class="glass-content-wrapper">
        <!-- Glass Header -->
        <div class="glass-header" :class="{ 'header-compact': !showHeaderInfo }">
          <div class="header-left">
            <div class="header-greeting" v-if="showHeaderInfo">
              <div class="greeting-text">
                <span class="greeting-hello">{{ greeting }},</span>
                <span class="greeting-name">{{ userStore?.username || 'User' }}</span>
              </div>
              <div class="greeting-subtitle">Welcome to your dashboard</div>
            </div>
            <div class="header-title" v-else>{{ $t("buttons.board") }}</div>
          </div>

          <div class="header-center" v-if="showHeaderInfo">
            <div class="header-time">
              <div class="time-display">{{ formattedTime }}</div>
              <div class="date-display">{{ formattedDate }}</div>
            </div>
          </div>

          <div class="header-right">
             <div class="header-stats" v-if="showHeaderInfo && customizing.hasLayout">
              <div class="stat-item">
                <span class="stat-value">{{ widgetStats.active }}</span>
                <span class="stat-label">Active</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <span class="stat-value">{{ widgetStats.available }}</span>
                <span class="stat-label">Total</span>
              </div>
            </div>
            
            <div class="header-actions" v-if="customizing.hasLayout">
              <el-button
                v-if="customizing.customizing"
                type="success"
                :icon="useRenderIcon('ep:check')"
                round
                class="glass-btn-primary"
                @click="handleUpdate"
              >Done</el-button>
              <el-button
                v-else
                type="primary"
                :icon="useRenderIcon('ep:edit')"
                round
                class="glass-btn"
                @click="handeCustom"
              >Customize</el-button>
            </div>
          </div>
        </div>
        
        <!-- Widgets Area -->
        <div ref="widgets" class="widgets-area">
          <div class="widgets-wrapper">
            <div v-if="!customizing.hasLayout" class="empty-state">
              <div class="empty-icon glass-panel">
                <el-icon :size="64">
                  <component :is="useRenderIcon('ri:dashboard-3-line')" />
                </el-icon>
              </div>
              <div class="empty-title">No Widgets Available</div>
              <div class="empty-desc">Please install plugins to add widgets.</div>
            </div>
            <div v-else class="h-full">
              <div
                v-if="!userLayoutObject.hasSettingCompent()"
                class="empty-state"
              >
                <div class="empty-icon glass-panel">
                  <el-icon :size="64">
                    <component :is="useRenderIcon('ri:layout-grid-line')" />
                  </el-icon>
                </div>
                <div class="empty-title">Start Building Your Dashboard</div>
                <div class="empty-desc">Click "Customize" to add widgets.</div>
                <el-button type="primary" round @click="handeCustom" class="glass-btn mt-4">
                  Start Now
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
      
      <!-- Glass Sidebar (Aside) -->
      <transition name="slide-right">
        <div v-if="customizing.customizing" class="glass-aside">
          <div class="aside-header">
            <div class="aside-title">
              <el-icon :size="20">
                <component :is="useRenderIcon('ri:apps-2-add-line')" />
              </el-icon>
              <span>Add Widget</span>
            </div>
            <div class="aside-close" @click="handleClose()">
              <el-icon :size="18">
                <component :is="useRenderIcon('ep:close')" />
              </el-icon>
            </div>
          </div>
          
          <div class="aside-search">
            <el-input
              v-model="searchKeyword"
              placeholder="Search widgets..."
              clearable
              :prefix-icon="useRenderIcon('ep:search')"
              class="glass-input"
            />
          </div>
          
          <div class="aside-categories">
            <div 
                v-for="cat in categories"
                :key="cat.value"
                class="cat-chip"
                :class="{ active: selectedCategory === cat.value }"
                @click="selectedCategory = cat.value"
            >
                {{ cat.label }}
                <span class="cat-count">{{ cat.count }}</span>
            </div>
          </div>
          
          <div class="aside-list custom-scrollbar">
            <div v-if="filteredWidgetList.length === 0" class="list-empty">
              <el-icon :size="40" class="opacity-50">
                <component :is="useRenderIcon('ri:inbox-line')" />
              </el-icon>
              <p>No widgets found</p>
            </div>
            <div
              v-for="item in filteredWidgetList"
              :key="item.key"
              class="widget-card glass-panel-sm"
              @click="push(item)"
            >
              <div class="widget-card-icon">
                <el-icon :size="24">
                  <component :is="useRenderIcon(item.icon || 'ri:apps-line')" />
                </el-icon>
              </div>
              <div class="widget-card-content">
                <div class="widget-card-title">{{ item.title }}</div>
                <div class="widget-card-desc">{{ item.description || 'No description' }}</div>
              </div>
              <div class="widget-card-action">
                <div class="add-btn">
                  <el-icon><component :is="useRenderIcon('ep:plus')" /></el-icon>
                </div>
              </div>
            </div>
          </div>
          
          <div class="aside-footer">
             <div class="footer-settings">
                <el-checkbox v-model="showHeaderInfo" class="glass-checkbox">Header Info</el-checkbox>
             </div>
             <el-button size="small" @click="backDefault()" class="glass-btn-sm">
                Reset
             </el-button>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped lang="scss">
// Variables
$glass-bg: rgba(255, 255, 255, 0.05);
$glass-border: rgba(255, 255, 255, 0.1);
$glass-blur: blur(16px);
$text-primary: #ffffff;
$text-secondary: rgba(255, 255, 255, 0.7);
$primary-gradient: linear-gradient(135deg, #6366f1, #8b5cf6);

.glass-home-page {
  position: relative;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: #0f172a; // Deep dark base
  color: $text-primary;
  font-family: 'Inter', system-ui, sans-serif;
}

// Background Mesh Animation (Same as Login)
.background-mesh {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  filter: blur(80px);
  opacity: 0.6;
}

.mesh-shape {
  position: absolute;
  border-radius: 50%;
  animation: float-mesh 20s infinite ease-in-out alternate;
}

.shape-1 { width: 60vw; height: 60vw; background: radial-gradient(circle, #4f46e5 0%, transparent 70%); top: -20%; left: -10%; animation-delay: -5s; }
.shape-2 { width: 50vw; height: 50vw; background: radial-gradient(circle, #ec4899 0%, transparent 70%); bottom: -10%; right: -10%; animation-delay: -2s; }
.shape-3 { width: 40vw; height: 40vw; background: radial-gradient(circle, #06b6d4 0%, transparent 70%); top: 40%; left: 30%; opacity: 0.4; }
.shape-4 { width: 30vw; height: 30vw; background: radial-gradient(circle, #8b5cf6 0%, transparent 70%); top: 10%; right: 20%; animation-delay: -8s; }

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(10px);
}

@keyframes float-mesh {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(30px, -30px) scale(1.1); }
  100% { transform: translate(-20px, 20px) scale(0.95); }
}

// Main Container
.home-main-container {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  transition: all 0.3s ease;
  
  &.is-customizing {
    .glass-content-wrapper {
        margin-right: 360px; // Make space for sidebar
    }
  }
}

.glass-content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
  overflow: hidden;
  transition: margin-right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

// Glass Header
.glass-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  
  &.header-compact {
      padding: 12px 24px;
  }
}

.header-left {
  flex: 1;
  .greeting-text {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 4px;
    background: linear-gradient(to right, #fff, #a5b4fc);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .greeting-subtitle {
    font-size: 14px;
    color: $text-secondary;
  }
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  
  .time-display {
    font-size: 36px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: 2px;
    background: linear-gradient(to bottom, #fff, #cbd5e1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-align: center;
  }
  .date-display {
    text-align: center;
    font-size: 13px;
    color: $text-secondary;
    margin-top: 4px;
    font-weight: 500;
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
  padding: 8px 20px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);

  .stat-item {
    text-align: center;
    .stat-value {
        display: block;
        font-size: 18px;
        font-weight: 700;
        color: #fff;
    }
    .stat-label {
        font-size: 11px;
        color: $text-secondary;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
  }
  
  .stat-divider {
      width: 1px;
      height: 24px;
      background: rgba(255, 255, 255, 0.1);
  }
}

// Buttons
.glass-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  }
}

.glass-btn-primary {
    background: $primary-gradient;
    border: none;
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
    
    &:hover {
        box-shadow: 0 6px 20px rgba(99, 102, 241, 0.6);
        transform: translateY(-1px);
    }
}

// Widgets Area
.widgets-area {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border-radius: 24px;
  
  // Custom Scrollbar
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    &:hover { background: rgba(255, 255, 255, 0.2); }
  }
}

.widgets-wrapper {
  height: 100%;
}

// Empty State
.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  
  .empty-icon {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 20px;
    color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .empty-title {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 8px;
  }
  
  .empty-desc {
      color: $text-secondary;
  }
}

// Aside Sidebar
.glass-aside {
  position: absolute;
  top: 24px;
  right: 24px;
  bottom: 24px;
  width: 340px;
  background: rgba(15, 23, 42, 0.85); // Darker background for readability
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  box-shadow: -10px 0 30px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  z-index: 100;
}

.aside-header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  .aside-title {
      font-size: 18px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
  }
  
  .aside-close {
      cursor: pointer;
      opacity: 0.7;
      &:hover { opacity: 1; transform: rotate(90deg); transition: 0.3s; }
  }
}

.aside-search {
  padding: 16px 20px;
  
  :deep(.el-input__wrapper) {
      background: rgba(255, 255, 255, 0.05);
      box-shadow: none;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      color: white;
      
      &.is-focus {
          border-color: #6366f1;
          background: rgba(255, 255, 255, 0.1);
      }
      
      input { color: white; }
  }
}

.aside-categories {
  display: flex;
  gap: 8px;
  padding: 0 20px 16px;
  flex-wrap: wrap;
  
  .cat-chip {
      padding: 6px 14px;
      font-size: 12px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
      
      &:hover { background: rgba(255, 255, 255, 0.1); }
      
      &.active {
          background: $primary-gradient;
          border-color: transparent;
          color: white;
          box-shadow: 0 2px 10px rgba(99, 102, 241, 0.3);
      }
      
      .cat-count {
          opacity: 0.7;
          font-size: 10px;
      }
  }
}

.aside-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 20px;
}

.widget-card {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateX(4px);
      
      .add-btn {
          background: #6366f1;
          color: white;
      }
  }
}

.widget-card-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
  color: white;
}

.widget-card-content {
  flex: 1;
  min-width: 0;
  
  .widget-card-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 2px;
      color: white;
  }
  
  .widget-card-desc {
      font-size: 11px;
      color: $text-secondary;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
  }
}

.add-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: white;
}

.aside-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  :deep(.el-checkbox) {
      color: $text-secondary;
      .el-checkbox__inner {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
      }
      &.is-checked .el-checkbox__inner {
          background: #6366f1;
          border-color: #6366f1;
      }
  }
}

// Transitions
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>

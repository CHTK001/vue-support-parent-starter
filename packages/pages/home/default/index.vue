<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { getConfig } from "@repo/config";
import { useLayoutLayoutStore, useUserStoreHook } from "@repo/core";
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
  watch
} from "vue";

const widgets = shallowRef();
const userLayoutObject = useLayoutLayoutStore();
const userStore = useUserStoreHook();

// 错误捕获组件
const SafePreview = defineComponent({
  name: 'SafePreview',
  emits: ['error'],
  setup(props, { slots, emit }) {
    onErrorCaptured((err) => {
      emit('error', err);
      return false; // 阻止错误继续向上传播
    });
    return () => slots.default ? slots.default() : null;
  }
});

const previewErrors = reactive({});
const handlePreviewError = (id) => {
  previewErrors[id] = true;
};

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
const showHeaderInfo = ref(localStorage.getItem("home-show-header-info") !== "false");
watch(showHeaderInfo, (val) => {
  localStorage.setItem("home-show-header-info", String(val));
});

// 当前时间
const currentTime = ref(new Date());
let timeInterval = null;

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
  const weekDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
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
      cats.set(type, { label: type === "local" ? "本地部件" : "远程部件", count: 0 });
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
  <div
    ref="main"
    :class="[
      'el-card widgets-home',
      customizing.customizing ? 'customizing' : '',
    ]"
  >
    <div class="widgets-content">
      <!-- 优化后的头部区域 -->
      <div class="widgets-header" :class="{ 'header-compact': !showHeaderInfo }">
        <div class="header-left" v-if="showHeaderInfo">
          <div class="header-greeting">
            <div class="greeting-text">
              <span class="greeting-hello">{{ greeting }}，</span>
              <span class="greeting-name">{{ userStore?.username || '用户' }}</span>
            </div>
            <div class="greeting-subtitle">{{ $t("buttons.board") }}</div>
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
          <div class="header-stats" v-if="showHeaderInfo && customizing.hasLayout">
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
          <div class="header-actions" v-if="customizing.hasLayout">
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
      
      <!-- 部件内容区域 -->
      <div ref="widgets" class="widgets">
        <div class="widgets-wrapper">
          <div v-if="!customizing.hasLayout" class="empty-state">
            <div class="empty-icon">
              <el-icon :size="64">
                <component :is="useRenderIcon('ri:dashboard-3-line')" />
              </el-icon>
            </div>
            <div class="empty-title">暂无可用部件</div>
            <div class="empty-desc">{{ $t('message.noPlugin') }}</div>
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
              <el-button type="primary" round @click="handeCustom" class="empty-action">
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
            <div class="widget-card-desc">{{ item.description || '暂无描述' }}</div>
            <div class="widget-card-meta">
              <el-tag size="small" :type="item.type === 1 ? 'success' : 'primary'">
                {{ item.type === 1 ? '本地' : '远程' }}
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
          <el-checkbox v-model="showHeaderInfo" size="small">显示头部信息</el-checkbox>
        </div>
        <el-button size="small" @click="backDefault()">
          <el-icon class="mr-1"><component :is="useRenderIcon('ep:refresh')" /></el-icon>
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
  display: flex;
  flex-direction: row;
  flex: 1;
  height: 100%;
  background: var(--el-bg-color-page);
}

.widgets-content {
  flex: 1;
  overflow: auto;
  overflow-x: hidden;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

/* 头部区域 */
.widgets-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: var(--el-bg-color);
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.header-left {
  flex: 1;
}

.header-greeting {
  .greeting-text {
    font-size: 22px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 4px;
    
    .greeting-hello {
      color: var(--el-color-primary);
    }
    
    .greeting-name {
      color: var(--el-text-color-primary);
    }
  }
  
  .greeting-subtitle {
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
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
    font-size: 32px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    font-variant-numeric: tabular-nums;
    letter-spacing: 2px;
  }
  
  .date-display {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin-top: 2px;
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
  padding: 8px 16px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  
  .stat-item {
    text-align: center;
    
    .stat-value {
      display: block;
      font-size: 20px;
      font-weight: 700;
      color: var(--el-color-primary);
    }
    
    .stat-label {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
  
  .stat-divider {
    width: 1px;
    height: 30px;
    background: var(--el-border-color-light);
  }
}

.header-actions {
  :deep(.el-button) {
    padding: 10px 20px;
    font-weight: 500;
  }
}

/* 部件内容区域 */
.widgets {
  --transform-scale: 1;
  transform-origin: top left;
  transition: transform 0.15s;
  flex: 1;
  min-height: 0;
}

.item,
.widgets > .widgets-wrapper {
  width: 100%;
  height: 100%;
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
  min-height: 400px;
  text-align: center;
  padding: 40px;
  
  .empty-icon {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-color-primary-light-7));
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
    color: var(--el-color-primary);
  }
  
  .empty-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 8px;
  }
  
  .empty-desc {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin-bottom: 24px;
  }
  
  .empty-action {
    padding: 12px 28px;
    font-size: 15px;
  }
}

/* 部件选择侧边栏 */
.widgets-aside {
  width: 360px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--el-border-color-lighter);
  z-index: 100;
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
  background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-dark-2));
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
    
    &:hover, &.is-focus {
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
  border-radius: 12px;
  background: var(--el-fill-color-lighter);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.25s ease;
  
  &:hover {
    background: var(--el-bg-color);
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
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
  background: linear-gradient(135deg, var(--el-color-primary-light-7), var(--el-color-primary-light-5));
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
    background: linear-gradient(135deg, var(--el-color-primary-dark-2), var(--el-color-primary));
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
    padding: 16px;
  }
  
  .header-stats {
    display: none;
  }
}
</style>

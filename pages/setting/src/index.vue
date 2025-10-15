<script setup lang="ts">
import { computed, defineComponent, defineAsyncComponent, nextTick, onMounted, reactive, ref, shallowRef, watch } from "vue";
// 将同步组件改为异步组件
const SaveLayoutRaw = defineAsyncComponent(() => import("./layout/base.vue"));
const SaveItem = defineAsyncComponent(() => import("./admin/index.vue"));
const GroupManagement = defineAsyncComponent(() => import("./group/index.vue"));

import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { localStorageProxy } from "@repo/utils";
import { ElMessage, ElLoading } from "element-plus";
import { useI18n } from "vue-i18n";
import { fetchListForGroup, type SysSettingGroup } from "./api/group";
const localStorageProxyObject = localStorageProxy();
const SETTING_TAB_VALUE = "setting-tab-value";

const { t } = useI18n();

const config = reactive({
  tabValue: localStorageProxyObject.getItem(SETTING_TAB_VALUE) || "default",
  saveItemStatus: false,
});

const saveItemRef = ref();
const data = reactive([]);
const layout = reactive({
  sms: defineAsyncComponent(() => import("./layout/sms.vue")),
  email: defineAsyncComponent(() => import("./layout/email.vue")),
  group: GroupManagement,
});

// 抽屉显示状态控制
const drawerVisible = reactive({
  group: false,
});
// 默认配置项（作为后备）
const defaultProductsConfig = [
  {
    group: "group",
    description: "管理系统配置分组",
    name: "系统组设置",
    isSetup: true,
    type: 4,
    icon: "mdi:tune-variant",
    hide: false,
  },
  {
    group: "default",
    description: t("product.default"),
    name: "基础设置",
    isSetup: true,
    type: 5,
    icon: "ri:airplay-fill",
    hide: false,
  },
];

// 从接口获取的配置项
const productsConfig = reactive([]);

const products = computed(() => {
  return productsConfig.filter((it) => !it.hide);
});
const saveLayoutRef = ref();

// 添加一个状态来跟踪组件是否已挂载
const isComponentMounted = ref(false);
// 添加组件加载状态
const componentLoadStatus = reactive({
  saveLayout: false,
  retryCount: 0,
  maxRetries: 3
});

// 添加加载状态
const loadingState = reactive({
  isLoading: false,
  loadingInstance: null
});

// 防抖控制
const debounceState = reactive({
  timeoutId: null,
  lastClickTime: 0
});

const currentItem = ref();

// 监听saveLayoutRef的变化
watch(saveLayoutRef, (newVal) => {
  if (newVal) {
    componentLoadStatus.saveLayout = true;
  }
});

// 等待组件加载的函数
const waitForComponentLoad = async (timeout = 1000) => {
  const startTime = Date.now();
  while (!saveLayoutRef.value && (Date.now() - startTime) < timeout) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  return !!saveLayoutRef.value;
};

// 显示加载提示
const showLoading = (message = "加载中...") => {
  if (!loadingState.loadingInstance) {
    loadingState.loadingInstance = ElLoading.service({
      lock: true,
      text: message,
      background: 'rgba(0, 0, 0, 0.7)'
    });
  }
};

// 隐藏加载提示
const hideLoading = () => {
  if (loadingState.loadingInstance) {
    loadingState.loadingInstance.close();
    loadingState.loadingInstance = null;
  }
};

// 防抖函数
const debounceClick = (func, delay = 300) => {
  return function(...args) {
    const now = Date.now();
    // 如果距离上次点击时间小于防抖延迟时间，则取消执行
    if (now - debounceState.lastClickTime < delay) {
      console.log('点击过于频繁，已阻止');
      return;
    }
    
    debounceState.lastClickTime = now;
    
    if (debounceState.timeoutId) {
      clearTimeout(debounceState.timeoutId);
    }
    
    debounceState.timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

const onRowClick = async (it) => {
  // 防抖检查
  const now = Date.now();
  if (now - debounceState.lastClickTime < 300) {
    console.log('点击过于频繁，已阻止');
    return;
  }
  debounceState.lastClickTime = now;
  
  // 显示加载提示
  showLoading("正在加载设置项...");
  
  try {
    // 确保组件已挂载
    if (!isComponentMounted.value) {
      console.warn('组件尚未挂载完成，稍后重试');
      // 等待一小段时间后重试
      setTimeout(() => {
        onRowClick(it);
      }, 100);
      return;
    }
    
    await nextTick();
    const _tabValue = config.tabValue;
    localStorageProxyObject.setItem(SETTING_TAB_VALUE, _tabValue);
    const item = products.value.filter((item) => item.group === _tabValue)[0];
    
    // 数据验证：确保item存在且有必要的属性
    if (!item) {
      console.error('未找到对应的配置项:', _tabValue);
      ElMessage.error('配置项不存在，请刷新页面重试');
      return;
    }
    
    if (!item.group) {
      console.error('配置项缺少group属性:', item);
      ElMessage.error('配置项数据异常，请联系管理员');
      return;
    }
    
    currentItem.value = item;

    // 如果是配置组管理，直接显示对话框
    if (item.group === "group") {
      drawerVisible[item.group] = true;
    } else if (layout[item.group]) {
      // 如果有自定义布局组件，显示抽屉
      drawerVisible[item.group] = true;
    } else {
      // 否则使用默认的设置布局
      try {
        // 确保SaveLayoutRaw组件已经加载
        if (!saveLayoutRef.value) {
          console.warn('SaveLayoutRaw组件未加载，等待组件加载...');
          
          // 等待组件加载完成，最多等待1秒
          const isLoaded = await waitForComponentLoad(1000);
          
          // 如果仍然没有加载成功，尝试重试机制
          if (!isLoaded && componentLoadStatus.retryCount < componentLoadStatus.maxRetries) {
            componentLoadStatus.retryCount++;
            console.warn(`组件加载失败，第${componentLoadStatus.retryCount}次重试`);
            await new Promise(resolve => setTimeout(resolve, 200 * componentLoadStatus.retryCount));
            hideLoading(); // 隐藏加载提示
            return await onRowClick(it); // 递归调用重试
          }
          
          if (!saveLayoutRef.value) {
            ElMessage.error('组件加载超时，请刷新页面重试');
            componentLoadStatus.retryCount = 0; // 重置重试计数
            hideLoading(); // 隐藏加载提示
            return;
          }
        }
        
        // 重置重试计数
        componentLoadStatus.retryCount = 0;
        
        // 验证item数据完整性
        if (!item.name) {
          console.warn('配置项缺少name属性，使用group作为默认名称:', item);
          item.name = item.group;
        }
        
        await saveLayoutRef.value.setData(item);
        await saveLayoutRef.value.open();
      } catch (error) {
        console.error('打开设置布局失败:', error);
        ElMessage.error('打开设置页面失败，请重试');
        componentLoadStatus.retryCount = 0; // 重置重试计数
      }
    }
  } finally {
    // 隐藏加载提示
    hideLoading();
  }
};

// 关闭设置面板
const close = (group) => {
  // 关闭对应的布局组件
  if (drawerVisible[group] !== undefined) {
    drawerVisible[group] = false;
  }

  // 如果是配置组管理，刷新配置数据
  if (group === "group") {
    loadProductsConfig();
  }

  console.log("关闭设置面板:", group);
};

// 打开配置组管理
const openGroupManagement = () => {
  const groupItem = productsConfig.find((item) => item.group === "group");
  if (groupItem) {
    currentItem.value = groupItem;
    drawerVisible.group = true;
  }
};

const handleOpenItemDialog = async () => {
  config.saveItemStatus = true;
  await nextTick();
  saveItemRef.value?.open();
};

const handleCloseItemDialog = async () => {
  config.saveItemStatus = false;
};

// 判断当前是否为默认页面
const isDefaultView = () => {
  return config.tabValue === "default";
};

// 获取当前选中的设置项
const getCurrentSetting = () => {
  return products.value.find((item) => item.group === config.tabValue);
};

/**
 * 从接口获取配置组数据
 * @author CH
 * @date 2024-01-15
 * @version 1.0.0
 */
const loadProductsConfig = async () => {
  try {
    // 显示加载提示
    showLoading("正在加载配置项...");
    
    const { data } = await fetchListForGroup({});
    if (data && data.length > 0) {
      // 将接口返回的配置组数据转换为产品配置格式
      const apiGroups = data
        .filter((group: SysSettingGroup) => group.sysSettingGroupEnable)
        .map((group: SysSettingGroup) => ({
          group: group.sysSettingGroupCode,
          name: group.sysSettingGroupName,
          description: group.sysSettingGroupRemark || `设置${group.sysSettingGroupName}`,
          isSetup: true,
          type: 4,
          icon: group.sysSettingGroupIcon || "ri:settings-line",
          hide: !group.sysSettingGroupEnable,
        }));

      // 确保 default 和 group 配置始终存在，将其作为固定值与远程配置合并
      const defaultItem = defaultProductsConfig.find((item) => item.group === "default");
      const groupItem = defaultProductsConfig.find((item) => item.group === "group");
      const otherDefaults = defaultProductsConfig.filter((item) => item.group !== "default" && item.group !== "group");

      // 过滤掉远程配置中的 default 和 group 项（如果存在）
      const filteredApiGroups = apiGroups.filter((item) => item.group !== "default" && item.group !== "group");

      // 合并配置：group（系统组设置）第一位 + default（基础配置）第二位 + 其他默认配置 + 远程配置
      productsConfig.splice(0, productsConfig.length, groupItem, defaultItem, ...otherDefaults, ...filteredApiGroups);
    } else {
      // 接口失败时使用默认配置
      productsConfig.splice(0, productsConfig.length, ...defaultProductsConfig);
      console.warn("获取配置组失败，使用默认配置");
    }
  } catch (error) {
    // 接口异常时使用默认配置
    productsConfig.splice(0, productsConfig.length, ...defaultProductsConfig);
    console.error("加载配置组失败:", error);
    ElMessage.warning("加载配置组失败，使用默认配置");
  } finally {
    // 隐藏加载提示
    hideLoading();
  }
};

// 组件挂载时加载配置
onMounted(() => {
  isComponentMounted.value = true;
  loadProductsConfig();
  
  // 添加一个微任务确保组件引用已建立
  nextTick(() => {
    setTimeout(() => {
      componentLoadStatus.saveLayout = !!saveLayoutRef.value;
    }, 100);
  });
});
</script>
<template>
  <div class="app-container h-full modern-setting-container">
    <el-button :icon="useRenderIcon('ri:settings-4-line')" class="floating-settings-btn" type="primary" circle @click="handleOpenItemDialog" />
    <el-button :icon="useRenderIcon('ri:group-line')" class="floating-group-btn" type="success" circle @click="openGroupManagement" />

    <!-- 页面标题 -->
    <div class="setting-header">
      <h1 class="setting-title">系统设置</h1>
      <p class="setting-subtitle">管理和配置系统各项功能</p>
    </div>

    <!-- 卡片网格布局 -->
    <div class="setting-cards-container">
      <div class="setting-cards-grid">
        <div
          v-for="item in products"
          :key="item.group"
          class="setting-card"
          :class="{ 'setting-card-active': config.tabValue === item.group }"
          @click="
            config.tabValue = item.group;
            onRowClick(item.group);
          "
        >
          <div class="setting-card-icon">
            <el-icon>
              <component :is="useRenderIcon(item.icon)" />
            </el-icon>
          </div>
          <div class="setting-card-content">
            <h3 class="setting-card-title">{{ item.name }}</h3>
            <p class="setting-card-description">{{ item.description || "设置" + item.name }}</p>
          </div>
          <div class="setting-card-indicator" v-if="config.tabValue === item.group"></div>
        </div>
      </div>
    </div>

    <!-- 设置内容区域 -->
    <div class="setting-content-container" v-if="currentItem">
      <SaveLayoutRaw  ref="saveLayoutRef" @close="close(currentItem.group)" class="w-full" />
      <template v-if="currentItem.group === 'group'">
        <!-- 配置组管理使用抽屉显示 -->
        <el-drawer 
          v-model="drawerVisible.group" 
          size="60%" 
          :title="currentItem.name" 
          destroy-on-close 
          @close="close(currentItem.group)" 
          :z-index="2000"
          :append-to-body="true"
          class="setting-drawer"
        >
          <GroupManagement :data="currentItem" />
        </el-drawer>
      </template>
      <template v-else>
        <el-drawer 
          v-model="drawerVisible[currentItem.group]" 
          size="50%" 
          :title="currentItem.name" 
          :z-index="2000"
          :append-to-body="true"
          :destroy-on-close="true"
          class="setting-drawer"
        >
          <component :is="layout[currentItem.group]" :data="currentItem" />
        </el-drawer>
      </template>
    </div>

    <SaveItem ref="saveItemRef" @close="handleCloseItemDialog" />
  </div>
</template>

<style lang="scss" scoped>
.modern-setting-container {
  background-color: var(--el-bg-color);
  border-radius: 16px;
  box-shadow: 
    0 15px 40px rgba(0, 0, 0, 0.15),
    0 8px 20px rgba(0, 0, 0, 0.1),
    0 4px 10px rgba(0, 0, 0, 0.05),
    0 1px 0 rgba(255, 255, 255, 0.9) inset;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  height: 100%;
  padding: 30px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// 添加drawer样式，确保初始渲染时不可见
.setting-drawer {
  visibility: hidden;
  
  &.el-drawer__open {
    visibility: visible;
  }
}

.floating-settings-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
  width: 38px !important;
  height: 38px !important;
  border-radius: 50%;
  box-shadow: 
    0 8px 20px rgba(0, 0, 0, 0.25),
    0 5px 15px rgba(0, 0, 0, 0.2),
    0 2px 8px rgba(0, 0, 0, 0.15),
    0 1px 0 rgba(255, 255, 255, 0.3) inset;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);

  &:hover {
    box-shadow: 
      0 12px 30px rgba(0, 0, 0, 0.3),
      0 8px 20px rgba(0, 0, 0, 0.25),
      0 4px 12px rgba(0, 0, 0, 0.2),
      0 1px 0 rgba(255, 255, 255, 0.4) inset;
    transform: translateY(-3px) scale(1.05);
  }
}

.floating-group-btn {
  position: fixed;
  bottom: 30px;
  right: 90px;
  z-index: 1000;
  width: 38px !important;
  height: 38px !important;
  border-radius: 50%;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25), 0 5px 15px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.15), 0 1px 0 rgba(255, 255, 255, 0.3) inset;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

}

.setting-tabs-container {
  padding: 0 20px;
}

.setting-header {
  padding: 0 30px;
  margin-bottom: 10px;
  position: relative;
  z-index: 1;
}

.setting-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0 0 8px;
  animation: fadeInUp 0.5s ease-out;
}

.setting-subtitle {
  font-size: 16px;
  color: var(--el-text-color-secondary);
  margin: 0;
  animation: fadeInUp 0.5s ease-out;
  animation-delay: 0.1s;
}

.setting-cards-container {
  padding: 0 30px;
  height: 100%;
  position: relative;
  z-index: 5;
}

.setting-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  animation: fadeIn 0.5s ease-out;
}

.setting-content-container {
  margin-top: 20px;
  padding: 0 30px 30px;
  animation: fadeIn 0.5s ease-out;
  position: relative;
}

.setting-card {
  background-color: var(--el-bg-color-overlay);
  border-radius: 16px;
  box-shadow: 
    0 10px 25px rgba(0, 0, 0, 0.1),
    0 6px 16px rgba(0, 0, 0, 0.08),
    0 3px 8px rgba(0, 0, 0, 0.05),
    0 1px 0 rgba(255, 255, 255, 0.7) inset;
  padding: 28px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: 1px solid var(--el-border-color-lighter);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: flex-start;
  height: 100%;
  min-height: 150px;
  backdrop-filter: blur(5px);
  z-index: 1;
}

.setting-card:hover {
  transform: translateY(-15px) scale(1.02);
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.2),
    0 15px 30px rgba(0, 0, 0, 0.15),
    0 8px 20px rgba(0, 0, 0, 0.12),
    0 3px 10px rgba(0, 0, 0, 0.08),
    0 1px 0 rgba(255, 255, 255, 0.85) inset;
}

.setting-card-active {
  border-color: var(--el-color-primary);
  box-shadow: 
    0 25px 50px rgba(var(--el-color-primary-rgb), 0.25),
    0 15px 30px rgba(var(--el-color-primary-rgb), 0.2),
    0 8px 20px rgba(var(--el-color-primary-rgb), 0.15),
    0 3px 10px rgba(var(--el-color-primary-rgb), 0.1),
    0 1px 0 rgba(255, 255, 255, 0.95) inset;
  background: linear-gradient(135deg, var(--app-primary-lighter) 0%, var(--app-primary-lightest) 100%);
  transform: translateY(-10px) scale(1.01);
  z-index: 10;
}

.setting-card-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, var(--app-primary) 0%, var(--app-primary-light-3) 100%);
  border-radius: 0 0 16px 16px;
  animation: fadeIn 0.3s ease-out;
}

.setting-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  font-size: 26px;
  color: var(--el-color-white);
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  border-radius: 14px;
  margin-right: 20px;
  transition: all 0.4s ease;
  box-shadow: 
    0 10px 20px var(--app-primary-shadow),
    0 6px 12px rgba(0, 0, 0, 0.15),
    0 3px 6px rgba(0, 0, 0, 0.1),
    0 1px 0 rgba(255, 255, 255, 0.4) inset;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.setting-card-icon::after {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, var(--app-white-transparent) 0%, var(--app-transparent) 70%);
  opacity: 0;
  transition: opacity 0.5s ease;
}

.setting-card:hover .setting-card-icon {
  transform: rotate(15deg) scale(1.12);
  box-shadow: 
    0 15px 30px rgba(var(--el-color-primary-rgb), 0.3),
    0 10px 20px rgba(var(--el-color-primary-rgb), 0.25),
    0 5px 12px rgba(var(--el-color-primary-rgb), 0.2),
    0 2px 6px rgba(var(--el-color-primary-rgb), 0.15),
    0 1px 0 rgba(255, 255, 255, 0.5) inset;
}

.setting-card:hover .setting-card-icon::after {
  opacity: 1;
}

.setting-card-content {
  flex: 1;
}

.setting-card-title {
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  transition: color 0.3s ease;
  letter-spacing: 0.3px;
}

.setting-card-description {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.3s ease;
  line-height: 1.6;
  white-space: normal;
  word-break: break-word;
  word-wrap: break-word;
  width: 100%;
}

.setting-card-active .setting-card-title {
  color: var(--el-color-primary);
}

.setting-card-active .setting-card-description {
  color: var(--app-text-regular);
}

.setting-card-content {
  flex: 1;
}

.setting-detail-container {
  background-color: var(--el-bg-color-overlay);
  border-radius: 12px;
  box-shadow: 
    0 8px 24px var(--app-shadow-sm),
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 2px 6px rgba(0, 0, 0, 0.05),
    0 1px 0 rgba(255, 255, 255, 0.7) inset;
  padding: 30px;
  margin-top: 20px;
  animation: fadeIn 0.5s ease-out;
  border: 1px solid var(--el-border-color-lighter);
  height: calc(100% - 40px);
  overflow-y: auto;
}

.modern-tabs {
  padding: 0 16px;

  :deep(.el-tabs__header) {
    margin-bottom: 25px;
    border-bottom: none;
    padding: 0 15px;
    position: relative;

    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 15px;
      right: 15px;
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, var(--app-border-light) 15%, var(--app-border-light) 85%, transparent 100%);
    }
  }

  :deep(.el-tabs__nav) {
    border: none !important;
  }

  :deep(.el-tabs__item) {
    height: 60px;
    line-height: 60px;
    transition: all 0.3s ease;
    border-bottom: 3px solid transparent;
    font-size: 15px;

    &.is-active {
      color: var(--app-primary);
      border-bottom: 3px solid var(--app-primary);
      font-weight: 600;
      transform: translateY(-2px);
    }

    &:hover:not(.is-active) {
      color: var(--app-primary-light-3);
      border-bottom: 3px solid var(--app-primary-light-7);
    }
  }

  :deep(.el-tabs__content) {
    height: calc(100% - 85px);
    overflow: auto;
    padding: 10px 15px;

    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--app-border-lighter);
      border-radius: 10px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }
}

.custom-tabs-label {
  display: flex;
  align-items: center;
  padding: 0 8px;

  .tab-icon {
    margin-right: 10px;
    font-size: 20px;
    transition: all 0.3s ease;
  }

  .tab-text {
    font-size: 15px;
    transition: all 0.3s ease;
  }
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--el-color-primary-rgb), 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(var(--el-color-primary-rgb), 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(var(--el-color-primary-rgb), 0);
  }
}

:deep(.el-form-item) {
  animation: fadeInUp 0.4s ease-out forwards;
  animation-delay: calc(var(--el-transition-duration) * 0.1 * var(--index, 0));
}

/* 卡片样式优化 */
.list-card-item {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px var(--app-shadow-sm);
  background-color: var(--app-bg-primary);
  border: 1px solid var(--app-border-lighter);

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 10px 25px var(--app-shadow);
    border-color: var(--app-primary-light-7);
  }

  &_detail {
    flex: 1;
    min-height: 160px;
    padding: 30px;
    transition: background-color 0.3s ease;

    &--logo {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 60px;
      font-size: 28px;
      color: var(--el-color-white);
      background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
      border-radius: 15px;
      transition: all 0.3s ease;
      box-shadow: 0 5px 15px var(--app-primary-shadow);

      &:hover {
        transform: rotate(15deg) scale(1.1);
      }

      &__disabled {
        color: var(--app-text-disabled);
        background: var(--app-fill-light);
        box-shadow: none;
      }
    }

    &--operation {
      display: flex;
      height: 100%;
      align-items: center;

      &--tag {
        border: 0;
        transition: all 0.3s ease;
        padding: 6px 12px;
        border-radius: 20px;

        &:hover {
          transform: scale(1.05);
        }
      }
    }

    &--name {
      margin: 24px 0 12px;
      font-size: 18px;
      font-weight: 600;
      transition: all 0.3s ease;
      color: var(--el-text-color-primary);
    }

    &--desc {
      display: -webkit-box;
      height: 44px;
      margin-bottom: 24px;
      overflow: hidden;
      font-size: 14px;
      line-height: 22px;
      text-overflow: ellipsis;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      color: var(--el-text-color-secondary);
      transition: all 0.3s ease;
    }
  }

  &__disabled {
    .list-card-item_detail--name,
    .list-card-item_detail--desc {
      color: var(--el-text-color-disabled);
    }

    .list-card-item_detail--operation--tag {
      color: var(--app-text-disabled);
      background-color: var(--app-fill-lighter);
    }
  }
}
</style>

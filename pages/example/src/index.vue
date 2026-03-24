<template>
  <div class="system-container modern-bg example-container thin-scroller">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <div class="header-icon">
            <IconifyIconOnline icon="ri:apps-2-line" />
          </div>
          <div class="header-text">
            <h1 class="page-title">组件库示例</h1>
            <p class="page-subtitle">探索丰富的 UI 组件，快速构建现代化应用</p>
          </div>
        </div>
        <div class="header-right">
          <div class="search-wrapper">
            <IconifyIconOnline icon="ri:search-line" class="search-icon" />
            <ScInput 
              v-model="searchText"
              placeholder="搜索组件..."
              clearable
              class="search-input"
            />
          </div>
          <div class="stats-badge">
            <IconifyIconOnline icon="ri:stack-line" />
            <span>{{ filteredComponents.length }} 个组件</span>
          </div>
        </div>
      </div>
      
      <!-- 分类筛选 -->
      <div class="category-filter">
        <div
          v-for="category in categories"
          :key="category.key"
          class="category-tag"
          :class="{ active: selectedCategory === category.key }"
          @click="selectedCategory = category.key"
        >
          <IconifyIconOnline :icon="category.icon" />
          <span>{{ category.label }}</span>
          <span class="category-count">({{ getCategoryCount(category.key) }})</span>
        </div>
      </div>
    </div>

    <!-- 组件网格 -->
    <div class="components-grid">
      <TransitionGroup name="card-list">
        <div
          v-for="(item, index) in filteredComponents"
          :key="item.name"
          class="component-card"
          :class="[`category-${item.category}`]"
          :style="{ '--delay': index * 0.03 + 's' }"
          @click="openComponentExample(item)"
          @mouseenter="handleCardHover(item, index)"
        >
          <!-- 装饰背景 -->
          <div class="card-bg"></div>
          <div class="card-glow"></div>
          <div class="card-shine"></div>

          <!-- 分类标签 -->
          <div class="card-badge" :class="`badge-${item.category}`">
            <IconifyIconOnline :icon="getCategoryIcon(item.category)" />
            <span>{{ getCategoryLabel(item.category) }}</span>
          </div>

          <!-- 图标区域 -->
          <div class="card-icon-wrapper">
            <div class="card-icon">
              <IconifyIconOnline :icon="item.icon" />
            </div>
            <div class="icon-ring"></div>
            <div class="icon-pulse"></div>
          </div>

          <!-- 内容区域 -->
          <div class="card-content">
            <h3 class="card-title">{{ item.name }}</h3>
            <p class="card-desc">{{ item.description }}</p>
            <div class="card-tags" v-if="item.tags && item.tags.length">
              <span
                v-for="tag in item.tags"
                :key="tag"
                class="card-tag"
              >{{ tag }}</span>
            </div>
          </div>

          <!-- 底部操作 -->
          <div class="card-footer">
            <span class="view-btn">
              <IconifyIconOnline icon="ri:eye-line" />
              查看示例
            </span>
            <IconifyIconOnline icon="ri:arrow-right-line" class="arrow-icon" />
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- 空状态 -->
    <div v-if="filteredComponents.length === 0" class="empty-state">
      <div class="empty-animation">
        <IconifyIconOnline icon="ri:search-eye-line" class="empty-icon" />
        <div class="empty-ripple"></div>
      </div>
      <h3>未找到匹配的组件</h3>
      <p>尝试使用其他关键词搜索或切换分类</p>
      <ScButton type="primary" @click="clearFilters" class="empty-action">
        <IconifyIconOnline icon="ri:refresh-line" />
        清除筛选
      </ScButton>
    </div>

    <!-- 组件详情对话框 -->
    <sc-dialog
      v-model="dialogVisible"
      :title="currentComponent?.name + ' 组件示例'"
      width="90%"
      destroy-on-close
      fullscreen
      class="example-dialog"
    >
      <template #header>
        <div class="dialog-header">
          <div class="dialog-icon">
            <IconifyIconOnline
              :icon="currentComponent?.icon || 'ri:code-box-line'"
            />
          </div>
          <div class="dialog-title-wrapper">
            <h2 class="dialog-title">{{ currentComponent?.name }}</h2>
            <p class="dialog-subtitle">{{ currentComponent?.description }}</p>
          </div>
        </div>
      </template>
      <component
        :is="currentComponent?.component"
        v-if="currentComponent"
      ></component>
    </sc-dialog>
  </div>
</template>

<script setup>
import { message } from "@repo/utils";
import { computed, defineAsyncComponent, ref, shallowRef } from "vue";
import { useRouter } from "vue-router";
import { IconifyIconOnline } from "@repo/components/ReIcon";

// 路由
const router = useRouter();

// 搜索文本
const searchText = ref("");

// 分类筛选
const selectedCategory = ref("all");

// 对话框控制
const dialogVisible = ref(false);
const currentComponent = shallowRef(null);

// 组件分类配置
const categories = [
  { key: "all", label: "全部", icon: "ri:apps-2-line" },
  { key: "form", label: "表单", icon: "ri:file-edit-line" },
  { key: "display", label: "展示", icon: "ri:gallery-line" },
  { key: "layout", label: "布局", icon: "ri:layout-grid-line" },
  { key: "feedback", label: "反馈", icon: "ri:message-3-line" },
  { key: "data", label: "数据", icon: "ri:database-2-line" },
  { key: "media", label: "媒体", icon: "ri:image-line" },
  { key: "other", label: "其他", icon: "ri:more-line" },
];

/**
 * 获取分类图标
 * @param {string} category 分类键
 * @returns {string} 图标名称
 */
const getCategoryIcon = (category) => {
  const categoryMap = {
    form: "ri:file-edit-line",
    display: "ri:gallery-line",
    layout: "ri:layout-grid-line",
    feedback: "ri:message-3-line",
    data: "ri:database-2-line",
    media: "ri:image-line",
    other: "ri:more-line",
  };
  return categoryMap[category] || "ri:code-box-line";
};

/**
 * 获取分类标签
 * @param {string} category 分类键
 * @returns {string} 分类名称
 */
const getCategoryLabel = (category) => {
  const categoryMap = {
    form: "表单",
    display: "展示",
    layout: "布局",
    feedback: "反馈",
    data: "数据",
    media: "媒体",
    other: "其他",
  };
  return categoryMap[category] || "组件";
};

/**
 * 获取分类数量
 * @param {string} category 分类键
 * @returns {number} 数量
 */
const getCategoryCount = (category) => {
  if (category === "all") {
    return components.length;
  }
  return components.filter((item) => item.category === category).length;
};

/**
 * 清除筛选
 */
const clearFilters = () => {
  searchText.value = "";
  selectedCategory.value = "all";
};

/**
 * 处理卡片悬停
 * @param {Object} item 组件项
 * @param {number} index 索引
 */
const handleCardHover = (item, index) => {
  // 可以在这里添加悬停效果逻辑
};

/**
 * 打开组件示例
 * @param {Object} component 组件信息
 */
const openComponentExample = (component) => {
  // TechUI 组件在新页面打开
  if (component.route) {
    router.push(component.route);
    return;
  }

  try {
    // 显示加载中消息
    message("正在加载组件示例...", { type: "info", duration: 1000 });

    // 设置当前组件并显示对话框
    currentComponent.value = component;
    dialogVisible.value = true;

    // 组件加载成功后的处理
    setTimeout(() => {
      if (dialogVisible.value) {
        message(`${component.name} 组件示例加载成功`, {
          type: "success",
          duration: 1500,
        });
      }
    }, 500);
  } catch (error) {
    message(
      `加载 ${component.name} 组件示例失败: ${error.message || "未知错误"}`,
      { type: "error" }
    );
    console.error("组件加载错误:", error);
    // 重置状态
    currentComponent.value = null;
    dialogVisible.value = false;
  }
};

// 定义异步组件加载配置
const asyncComponentOptions = {
  // 加载失败时显示的组件
  errorComponent: {
    template: `
      <div class="error-component">
        <ScAlert 
          title="组件加载失败"
          type="error"
          description="无法加载组件，请检查组件文件是否存在或者是否有错误"
          show-icon
          :closable="false"
        />
        <div class="error-details" v-if="error">
          <p><strong>错误信息:</strong> {{ error }}</p>
        </div>
      </div>
    `,
    props: ["error"],
  },
  // 加载中显示的组件
  loadingComponent: {
    template: `
      <div class="loading-component">
        <el-skeleton :rows="10" animated />
      </div>
    `,
  },
  // 延迟显示加载组件的时间
  delay: 200,
  // 超时时间
  timeout: 10000,
  // 加载失败时的回调
  onError: (error, retry, fail, attempts) => {
    console.log(console.trace());
    if (attempts <= 3) {
      console.warn(`组件加载失败，正在重试 (${attempts}/3)...`, error);
      retry();
    } else {
      console.error(`组件加载失败，已达到最大重试次数:`, error);
      fail();
    }
  },
};

// 创建异步组件加载函数
const resolveComponent = (path) => {
  return defineAsyncComponent({
    ...asyncComponentOptions,
    loader: () => /* @vite-ignore */ import(path),
  });
};

// 组件列表
const components = [
  {
    name: "ScTable",
    icon: "carbon:table",
    category: "data",
    tags: ["表格", "数据展示"],
    description:
      "表格组件，基于 Element Plus 的表格组件封装，提供了更强大的表格功能",
    component: resolveComponent("./components/ScTableExample.vue"),
  },
  {
    name: "ScDialog",
    icon: "carbon:popup",
    category: "feedback",
    tags: ["对话框", "弹窗"],
    description:
      "对话框组件，基于 Element Plus 的对话框组件封装，提供了更丰富的对话框功能和样式",
    component: resolveComponent("./components/ScDialogExample.vue"),
  },
  {
    name: "ScDialog (自定义模式)",
    icon: "ri:window-2-line",
    category: "feedback",
    tags: ["对话框", "高级"],
    description:
      "自定义对话框组件，支持拖拽、缩放、边缘吸附、任务栏模式等高级功能",
    component: resolveComponent("./components/ScDialog2Example.vue"),
  },
  {
    name: "ScSwitch",
    icon: "carbon:toggle-switch",
    category: "form",
    tags: ["开关", "表单"],
    description: "开关组件，支持多种布局样式，包括默认、卡片和滑块等布局",
    component: resolveComponent("./components/ScSwitchExample.vue"),
  },
  {
    name: "ScCard",
    icon: "ri:card-line",
    category: "display",
    tags: ["卡片", "展示"],
    description: "卡片组件，支持多种布局样式，包括默认、卡片和滑块等布局",
    component: resolveComponent("./components/ScCardExample.vue"),
  },
  {
    name: "ScInput",
    icon: "carbon:text-input",
    category: "form",
    tags: ["输入", "表单"],
    description:
      "输入组件，支持多种输入类型，如文本、文本域、数字、密码、颜色等",
    component: resolveComponent("./components/ScInputExample.vue"),
  },
  {
    name: "ScButton",
    icon: "ri:cursor-line",
    category: "form",
    tags: ["按钮", "交互"],
    description: "按钮组件，支持类型、尺寸、禁用和加载等多种状态",
    component: resolveComponent("./components/ScButtonExample.vue"),
  },
  {
    name: "ScTag",
    icon: "ri:price-tag-3-line",
    category: "display",
    tags: ["标签", "标记"],
    description: "标签组件，支持多种类型、可关闭、圆角和不同展示效果",
    component: resolveComponent("./components/ScTagExample.vue"),
  },
  {
    name: "ScBadge",
    icon: "ri:notification-badge-line",
    category: "display",
    tags: ["徽标", "角标"],
    description: "徽标组件，支持数字徽标、小红点及状态点展示",
    component: resolveComponent("./components/ScBadgeExample.vue"),
  },
  {
    name: "ScSelect",
    icon: "carbon:progress-bar",
    category: "form",
    tags: ["选择", "下拉"],
    description: "选择组件，提供多种加载动画和进度显示，支持自定义布局和样式",
    component: resolveComponent("./components/ScSelectExample.vue"),
  },
  {
    name: "ScText",
    icon: "ri:text",
    category: "display",
    tags: ["文本", "展示"],
    description:
      "文本组件，支持副文本、提示、编辑、复制、TypeIt打字机、远程调用等丰富功能",
    component: resolveComponent("./components/ScTextExample.vue"),
  },
  {
    name: "ScFilterBar",
    icon: "ri:filter-3-line",
    category: "form",
    tags: ["筛选", "搜索"],
    description:
      "高级筛选组件，支持展开收起、快捷筛选、多种布局、字段联动、实时搜索",
    component: resolveComponent("./components/ScFilterBarExample.vue"),
  },
  {
    name: "ScSearch",
    icon: "ri:search-line",
    category: "form",
    tags: ["搜索", "查询"],
    description: "搜索组件示例，占位演示后续可扩展为完整搜索场景",
    component: resolveComponent("./components/ScSearchExample.vue"),
  },
  {
    name: "ScQuery",
    icon: "ri:filter-2-line",
    category: "form",
    tags: ["查询", "条件"],
    description: "查询组件示例，占位演示后续可扩展为复杂查询场景",
    component: resolveComponent("./components/ScQueryExample.vue"),
  },
  {
    name: "ScTree",
    icon: "carbon:tree-view-alt",
    category: "data",
    tags: ["树形", "数据"],
    description:
      "树形控件，基于 Element Plus 的树形组件封装，提供了更便捷的树形数据展示能力",
    component: resolveComponent("./components/ScTreeExample.vue"),
  },
  {
    name: "ScLoading",
    icon: "carbon:progress-bar",
    category: "feedback",
    tags: ["加载", "动画"],
    description: "加载组件，提供多种加载动画和进度显示，支持自定义布局和样式",
    component: resolveComponent("./components/ScLoadExample.vue"),
  },
  {
    name: "ScWorkflow",
    icon: "carbon:progress-bar",
    category: "display",
    tags: ["工作流", "流程"],
    description: "工作流组件",
    component: resolveComponent("./components/ScWorkflowExample.vue"),
  },
  {
    name: "ScMap",
    icon: "ri:map-pin-range-line",
    category: "display",
    tags: ["地图", "定位"],
    description: "地图组件",
    component: resolveComponent("./components/ScMapExample.vue"),
  },
  {
    name: "ScLayer",
    icon: "ri:map-2-line",
    category: "display",
    tags: ["地图", "图层"],
    description:
      "基于OpenLayers的地图图层组件，提供测距、标记点、形状绘制等功能",
    component: resolveComponent("./components/ScLayerExample.vue"),
  },
  {
    name: "ScCron",
    icon: "carbon:time",
    category: "form",
    tags: ["时间", "表达式"],
    description: "Cron表达式组件，提供Cron表达式生成和解析功能，支持可视化配置",
    component: resolveComponent("./components/ScCronExample.vue"),
  },
  {
    name: "ReIcon",
    icon: "carbon:face-satisfied",
    category: "display",
    tags: ["图标", "UI"],
    description: "图标组件，提供丰富的图标库和使用方式，支持自定义图标和样式",
    component: resolveComponent("./components/ReIconExample.vue"),
  },
  {
    name: "ScSocketEventProcess",
    icon: "ri:progress-4-line",
    category: "feedback",
    tags: ["Socket", "进度"],
    description:
      "Socket事件进度条组件，用于监听Socket事件并显示进度，支持进度条和日志两种布局方式",
    component: resolveComponent("./components/ScSocketEventProcessExample.vue"),
  },
  {
    name: "ScRibbon",
    icon: "ri:bookmark-3-line",
    category: "display",
    tags: ["徽带", "角标"],
    description:
      "徽带/角标组件，支持 badge、corner、diagonal 和 banner 四种样式，支持图标、尺寸与颜色配置",
    component: resolveComponent("./components/ScRibbonExample.vue"),
  },
  {
    name: "ScMessageDialog",
    icon: "ri:message-3-line",
    category: "feedback",
    tags: ["消息", "对话框"],
    description:
      "消息对话框组件，用于显示操作进度、消息通知等，支持拖拽、靠边吸附、Grid吸附等功能",
    component: resolveComponent("./components/ScMessageDialogExample.vue"),
  },
  {
    name: "ScSocketMessageDialog",
    icon: "ri:broadcast-line",
    category: "feedback",
    tags: ["Socket", "消息"],
    description:
      "Socket消息对话框组件，用于显示实时Socket消息、进度等，支持多种布局模式和靠边吸附功能",
    component: resolveComponent(
      "./components/ScSocketMessageDialogExample.vue"
    ),
  },
  {
    name: "MonacoEditor",
    icon: "ri:code-box-line",
    category: "other",
    tags: ["编辑器", "代码"],
    description: "Monaco 编辑器组件，提供强大的代码编辑功能",
    component: resolveComponent("./components/MonacoEditorExample.vue"),
  },
  {
    name: "ReSeamlessScroll",
    icon: "ri:scroll-to-bottom-line",
    category: "display",
    tags: ["滚动", "动画"],
    description: "无缝滚动组件，支持垂直和水平滚动",
    component: resolveComponent("./components/ReSeamlessScrollExample.vue"),
  },
  {
    name: "ReSegmented",
    icon: "ri:layout-grid-line",
    category: "form",
    tags: ["分段", "切换"],
    description: "分段控制器组件，提供优雅的选项切换",
    component: resolveComponent("./components/ReSegmentedExample.vue"),
  },
  {
    name: "ReText",
    icon: "ri:text",
    category: "display",
    tags: ["文本", "展示"],
    description: "文本组件，支持多种文本样式和效果",
    component: resolveComponent("./components/ReTextExample.vue"),
  },
  {
    name: "ReTypeit",
    icon: "ri:keyboard-line",
    category: "display",
    tags: ["打字机", "动画"],
    description: "打字机效果组件，创建动态打字动画",
    component: resolveComponent("./components/ReTypeitExample.vue"),
  },
  {
    name: "ScCardInput",
    icon: "ri:bank-card-line",
    category: "form",
    tags: ["输入", "卡片"],
    description: "卡片输入组件，优雅的卡片式输入界面",
    component: resolveComponent("./components/ScCardInputExample.vue"),
  },
  {
    name: "ScCode",
    icon: "ri:code-s-slash-line",
    category: "display",
    tags: ["代码", "高亮"],
    description: "代码显示组件，支持语法高亮和代码美化",
    component: resolveComponent("./components/ScCodeExample.vue"),
  },
  {
    name: "ScContainer",
    icon: "ri:layout-masonry-line",
    category: "layout",
    tags: ["布局", "容器"],
    description: "布局容器组件，提供 Header、Aside、Main、Footer 布局结构",
    component: resolveComponent("./components/ScContainerExample.vue"),
  },
  {
    name: "ScPanel",
    icon: "ri:dashboard-3-line",
    category: "layout",
    tags: ["面板", "主题"],
    description:
      "面板组件，支持多种主题风格（default/tech/techui/glass/neon/modern/gradient），可折叠、最大化",
    component: resolveComponent("./components/ScPanelExample.vue"),
  },
  {
    name: "ScTech",
    icon: "ri:cpu-line",
    category: "display",
    tags: ["科技", "风格"],
    description:
      "科技风格组件集合示例，展示 TechUI 数据大屏风格的按钮、卡片、对话框等组件",
    component: resolveComponent("./components/ScTechExample.vue"),
  },
  {
    name: "ScCompare",
    icon: "ri:file-compare-line",
    category: "display",
    tags: ["对比", "差异"],
    description: "对比组件，支持文本和代码对比",
    component: resolveComponent("./components/ScCompareExample.vue"),
  },
  {
    name: "ScContextMenu",
    icon: "ri:menu-line",
    category: "other",
    tags: ["菜单", "右键"],
    description: "右键菜单组件，提供丰富的上下文菜单功能",
    component: resolveComponent("./components/ScContextMenuExample.vue"),
  },
  {
    name: "ScCountDown",
    icon: "ri:timer-line",
    category: "display",
    tags: ["倒计时", "时间"],
    description: "倒计时组件，支持多种倒计时样式",
    component: resolveComponent("./components/ScCountDownExample.vue"),
  },
  {
    name: "ScEcharts",
    icon: "ri:pie-chart-line",
    category: "data",
    tags: ["图表", "数据"],
    description: "图表组件，基于 ECharts 封装的图表组件",
    component: resolveComponent("./components/ScEchartsExample.vue"),
  },
  {
    name: "ScEditor",
    icon: "ri:edit-box-line",
    category: "other",
    tags: ["编辑器", "富文本"],
    description: "富文本编辑器组件，提供强大的编辑功能",
    component: resolveComponent("./components/ScEditorExample.vue"),
  },
  {
    name: "ScFile",
    icon: "ri:file-upload-line",
    category: "media",
    tags: ["文件", "上传"],
    description: "文件上传组件，支持多种文件上传方式",
    component: resolveComponent("./components/ScFileExample.vue"),
  },
  {
    name: "ScFormTable",
    icon: "ri:table-2",
    category: "data",
    tags: ["表单", "表格"],
    description: "表单表格组件，结合表单和表格的功能",
    component: resolveComponent("./components/ScFormTableExample.vue"),
  },
  {
    name: "ScImage",
    icon: "ri:image-line",
    category: "media",
    tags: ["图片", "预览"],
    description: "图片组件，支持预览、裁剪等功能",
    component: resolveComponent("./components/ScImageExample.vue"),
  },
  {
    name: "ScIp",
    icon: "ri:global-line",
    category: "form",
    tags: ["IP", "输入"],
    description: "IP 地址组件，提供 IP 地址输入和验证",
    component: resolveComponent("./components/ScIpExample.vue"),
  },
  {
    name: "ScPagination",
    icon: "ri:pages-line",
    category: "data",
    tags: ["分页", "导航"],
    description: "分页组件，提供多种分页样式",
    component: resolveComponent("./components/ScPagintionExample.vue"),
  },
  {
    name: "ScPasswordStrength",
    icon: "ri:lock-password-line",
    category: "form",
    tags: ["密码", "强度"],
    description: "密码强度组件，显示密码强度指示器",
    component: resolveComponent("./components/ScPasswordStrengthExample.vue"),
  },
  {
    name: "ScPromQL",
    icon: "ri:database-2-line",
    category: "data",
    tags: ["查询", "数据库"],
    description: "PromQL 查询组件，用于 Prometheus 查询",
    component: resolveComponent("./components/ScPromQLExample.vue"),
  },
  {
    name: "ScRegion",
    icon: "ri:map-pin-2-line",
    category: "form",
    tags: ["地区", "选择"],
    description: "地区选择组件，支持省市区三级联动",
    component: resolveComponent("./components/ScRegionExample.vue"),
  },
  {
    name: "ScSelectFilter",
    icon: "ri:filter-3-line",
    category: "form",
    tags: ["筛选", "选择"],
    description: "选择过滤组件，提供筛选功能",
    component: resolveComponent("./components/ScSelectFilterExample.vue"),
  },
  {
    name: "ScTableSelect",
    icon: "ri:table-line",
    category: "data",
    tags: ["表格", "选择"],
    description: "表格选择组件，在表格中进行选择",
    component: resolveComponent("./components/ScTableSelectExample.vue"),
  },
  {
    name: "ScUpload",
    icon: "ri:upload-cloud-line",
    category: "media",
    tags: ["上传", "文件"],
    description: "上传组件，支持多种上传方式和文件类型",
    component: resolveComponent("./components/ScUploadExample.vue"),
  },
  {
    name: "ScVideo",
    icon: "ri:video-line",
    category: "media",
    tags: ["视频", "播放"],
    description: "视频播放组件，支持多种视频格式",
    component: resolveComponent("./components/ScVideoExample.vue"),
  },
  {
    name: "ScThree",
    icon: "ri:3d-line",
    category: "media",
    tags: ["3D", "Three.js", "模型"],
    description: "基于 Three.js 的 3D 渲染组件，支持 glTF/glb 模型加载、场景预设、相机控制等功能",
    component: resolveComponent("./components/ScThreeExample.vue"),
  },
  {
    name: "ScThreeMap",
    icon: "ri:map-3d-line",
    category: "display",
    tags: ["3D", "地图", "模型", "联动"],
    description: "ScThree 与地图组件（ScMap/ScLayer）的联动示例，支持在地图上显示 3D 模型",
    component: resolveComponent("./components/ScThreeMapExample.vue"),
  },
  {
    name: "Template",
    icon: "ri:layout-line",
    category: "layout",
    tags: ["模板", "布局"],
    description: "模板组件示例，展示各种预制模板组件",
    component: resolveComponent("./components/TemplateExample.vue"),
  },
  {
    name: "TechUI",
    icon: "ri:rocket-2-line",
    category: "display",
    tags: ["科技", "风格"],
    description: "TechUI 科幻风格组件，基于 @techui/scifi 的科幻风格 UI 组件封装（独立页面）",
    route: "/example/techui",
  },
  {
    name: "ScReteEditor",
    icon: "ri:node-tree",
    category: "other",
    tags: ["可视化", "编辑器"],
    description: "可视化节点编辑器组件，基于 Rete.js，支持节点拖拽、连接、小地图、右键菜单等功能",
    component: resolveComponent("./components/ScReteEditorExample.vue"),
  },
  {
    name: "ScAlert",
    icon: "ri:alert-line",
    category: "feedback",
    tags: ["提示", "状态"],
    description: "告警提示组件，支持信息、成功、警告和错误等多种状态样式",
    component: resolveComponent("./components/ScAlertExample.vue"),
  },
  {
    name: "ScProgress",
    icon: "ri:loader-2-line",
    category: "data",
    tags: ["进度", "状态"],
    description: "进度条组件，支持线性、液体圆形进度等多种展示方式",
    component: resolveComponent("./components/ScProgressExample.vue"),
  },
  {
    name: "ScCheckbox",
    icon: "ri:checkbox-line",
    category: "form",
    tags: ["多选", "表单"],
    description: "复选框组件，支持单个复选与复选组、边框样式等",
    component: resolveComponent("./components/ScCheckboxExample.vue"),
  },
  {
    name: "ScRadio",
    icon: "ri:radio-button-line",
    category: "form",
    tags: ["单选", "表单"],
    description: "单选框组件，支持单个单选与单选组，适用于互斥选项场景",
    component: resolveComponent("./components/ScRadioExample.vue"),
  },
  {
    name: "ScInputNumber",
    icon: "ri:number-1",
    category: "form",
    tags: ["数字", "输入"],
    description: "数字输入组件，支持步长、精度、禁用等配置",
    component: resolveComponent("./components/ScInputNumberExample.vue"),
  },
  {
    name: "ScRate",
    icon: "ri:star-line",
    category: "form",
    tags: ["评分", "交互"],
    description: "评分组件，支持半星、显示文字、分段颜色等能力",
    component: resolveComponent("./components/ScRateExample.vue"),
  },
  {
    name: "ScColorPicker",
    icon: "ri:contrast-drop-line",
    category: "form",
    tags: ["颜色", "选择"],
    description: "颜色选择器组件，支持透明度与预设颜色面板",
    component: resolveComponent("./components/ScColorPickerExample.vue"),
  },
  {
    name: "ScDatePicker / ScTimePicker",
    icon: "ri:calendar-schedule-line",
    category: "form",
    tags: ["日期", "时间"],
    description: "日期与时间选择组件，支持单选与范围选择",
    component: resolveComponent("./components/ScDateTimeExample.vue"),
  },
  {
    name: "ScCascader / ScAutocomplete",
    icon: "ri:node-tree",
    category: "form",
    tags: ["级联", "自动完成"],
    description: "级联选择与自动完成输入组件，适合多级分类与搜索联想场景",
    component: resolveComponent("./components/ScCascaderAutocompleteExample.vue"),
  },
  {
    name: "ScForm",
    icon: "ri:article-line",
    category: "form",
    tags: ["表单", "布局"],
    description: "表单容器组件，结合 ScFormItem / ScRow / ScCol 快速搭建表单页面",
    component: resolveComponent("./components/ScFormExample.vue"),
  },
];

// 过滤后的组件列表
const filteredComponents = computed(() => {
  let result = components;

  // 分类筛选
  if (selectedCategory.value !== "all") {
    result = result.filter((item) => item.category === selectedCategory.value);
  }

  // 搜索筛选
  if (searchText.value) {
    const keyword = searchText.value.toLowerCase();
    result = result.filter(
      (item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword) ||
        (item.tags && item.tags.some((tag) => tag.toLowerCase().includes(keyword)))
    );
  }

  return result;
});
</script>

<style scoped lang="scss">
.example-container {
  min-height: auto;
  max-height: none;
  overflow-y: auto;
  padding: 0;
  position: relative;
  background: var(--page-bg);

  // 滚动条样式
  scrollbar-width: thin;
  scrollbar-color: var(--el-color-primary, #6366f1) transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-color-primary, #6366f1);
    border-radius: 3px;

    &:hover {
      background: var(--el-color-primary-light-3, #8b5cf6);
    }
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 10% 20%,
        rgba(99, 102, 241, 0.15) 0%,
        transparent 40%
      ),
      radial-gradient(
        circle at 90% 80%,
        rgba(168, 85, 247, 0.12) 0%,
        transparent 40%
      ),
      radial-gradient(
        circle at 50% 50%,
        rgba(59, 130, 246, 0.08) 0%,
        transparent 50%
      );
    pointer-events: none;
  }
}

/* 页面头部 */
.page-header {
  position: relative;
  z-index: 10;
  margin-bottom: 32px;
  padding: 28px 32px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.06),
    0 1px 2px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 16px;
  font-size: 28px;
  color: white;
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.35);
}

.header-text {
  .page-title {
    font-size: 28px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 6px 0;
    letter-spacing: -0.5px;
  }

  .page-subtitle {
    font-size: 15px;
    color: #64748b;
    margin: 0;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-wrapper {
  position: relative;

  .search-icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    font-size: 18px;
    z-index: 1;
  }

  .search-input {
    width: 280px;

    :deep(.el-input__wrapper) {
      padding-left: 44px;
      height: 44px;
      background: rgba(241, 245, 249, 0.8);
      border: 1px solid rgba(226, 232, 240, 0.8);
      border-radius: 12px;
      box-shadow: none;
      transition: all 0.3s ease;

      &:hover,
      &.is-focus {
        background: white;
        border-color: #6366f1;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
      }
    }
  }
}

.stats-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
}

/* 分类筛选 */
.category-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(226, 232, 240, 0.8);
}

.category-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(241, 245, 249, 0.8);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.5s ease;
  }

  &:hover {
    background: rgba(99, 102, 241, 0.1);
    border-color: rgba(99, 102, 241, 0.3);
    color: #6366f1;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);

    &::before {
      left: 100%;
    }
  }

  &.active {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    border-color: transparent;
    color: white;
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
    transform: translateY(-2px);

    .category-count {
      background: rgba(255, 255, 255, 0.2);
    }
  }

  .category-count {
    padding: 2px 6px;
    background: rgba(148, 163, 184, 0.2);
    border-radius: 8px;
    font-size: 11px;
    font-weight: 600;
    transition: all 0.3s ease;
  }
}

/* 组件网格 */
.components-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  position: relative;
  z-index: 1;
}

/* 卡片样式 */
.component-card {
  position: relative;
  padding: 24px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  cursor: pointer;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: cardFadeIn 0.5s ease forwards;
  animation-delay: var(--delay);
  opacity: 0;
  transform: translateY(20px);

  &:hover {
    transform: translateY(-8px);
    box-shadow:
      0 20px 40px rgba(0, 0, 0, 0.1),
      0 8px 16px rgba(99, 102, 241, 0.15);
    border-color: rgba(99, 102, 241, 0.3);

    .card-bg {
      opacity: 1;
    }

    .card-glow {
      opacity: 0.6;
    }

    .card-icon {
      transform: scale(1.1) rotate(5deg);
    }

    .icon-ring {
      transform: scale(1.2);
      opacity: 0.5;
    }

    .arrow-icon {
      transform: translateX(4px);
      opacity: 1;
    }

    .view-btn {
      color: #6366f1;
    }
  }
}

@keyframes cardFadeIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(99, 102, 241, 0.05) 0%,
    rgba(168, 85, 247, 0.05) 100%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle,
    rgba(99, 102, 241, 0.15) 0%,
    transparent 50%
  );
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.card-shine {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 70%
  );
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
  transform: rotate(45deg);
}

.component-card:hover .card-shine {
  opacity: 1;
  animation: shine 1.5s ease-in-out;
}

@keyframes shine {
  0% {
    transform: translateX(-100%) translateY(-100%) rotate(45deg);
  }
  100% {
    transform: translateX(100%) translateY(100%) rotate(45deg);
  }
}

.icon-pulse {
  position: absolute;
  width: 88px;
  height: 88px;
  border: 2px solid rgba(99, 102, 241, 0.4);
  border-radius: 24px;
  opacity: 0;
  transition: all 0.4s ease;
  animation: pulse 2s ease-in-out infinite;
}

.component-card:hover .icon-pulse {
  opacity: 1;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.4;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.2;
  }
}

.card-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  font-size: 12px;
  font-weight: 600;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  z-index: 2;
  transition: all 0.3s ease;

  &.badge-form {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  &.badge-display {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  &.badge-layout {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  }

  &.badge-feedback {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  }

  &.badge-data {
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  }

  &.badge-media {
    background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
    box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
  }

  &.badge-other {
    background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
    box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
  }
}

.card-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.card-icon {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-radius: 20px;
  font-size: 36px;
  color: #6366f1;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;
}

.icon-ring {
  position: absolute;
  width: 88px;
  height: 88px;
  border: 2px dashed rgba(99, 102, 241, 0.3);
  border-radius: 24px;
  transition: all 0.4s ease;
  opacity: 0;
}

.card-content {
  text-align: center;
  margin-bottom: 16px;
  position: relative;
  z-index: 1;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.card-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.card-tag {
  padding: 4px 10px;
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
  font-size: 11px;
  font-weight: 500;
  border-radius: 8px;
  border: 1px solid rgba(99, 102, 241, 0.2);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(99, 102, 241, 0.15);
    border-color: rgba(99, 102, 241, 0.3);
  }
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid rgba(226, 232, 240, 0.8);
  position: relative;
  z-index: 1;
}

.view-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  transition: color 0.3s ease;
}

.arrow-icon {
  font-size: 18px;
  color: #6366f1;
  opacity: 0;
  transform: translateX(0);
  transition: all 0.3s ease;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;

  .empty-animation {
    position: relative;
    margin-bottom: 32px;

    .empty-icon {
      font-size: 80px;
      color: #cbd5e1;
      position: relative;
      z-index: 1;
      animation: float 3s ease-in-out infinite;
    }

    .empty-ripple {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 120px;
      height: 120px;
      border: 2px solid rgba(99, 102, 241, 0.2);
      border-radius: 50%;
      animation: ripple 2s ease-out infinite;
    }
  }

  h3 {
    font-size: 20px;
    font-weight: 600;
    color: #475569;
    margin: 0 0 8px 0;
  }

  p {
    font-size: 14px;
    color: #94a3b8;
    margin: 0 0 24px 0;
  }

  .empty-action {
    margin-top: 8px;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes ripple {
  0% {
    width: 80px;
    height: 80px;
    opacity: 1;
  }
  100% {
    width: 200px;
    height: 200px;
    opacity: 0;
  }
}

/* 列表动画 */
.card-list-enter-active,
.card-list-leave-active {
  transition: all 0.4s ease;
}

.card-list-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
}

.card-list-leave-to {
  opacity: 0;
  transform: translateY(-30px) scale(0.95);
}

.card-list-move {
  transition: transform 0.4s ease;
}

/* 对话框样式 */
.dialog-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.dialog-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 14px;
  font-size: 24px;
  color: white;
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.3);
}

.dialog-title-wrapper {
  .dialog-title {
    font-size: 20px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 4px 0;
  }

  .dialog-subtitle {
    font-size: 13px;
    color: #64748b;
    margin: 0;
  }
}

:deep(.example-dialog) {
  .el-dialog__header {
    padding: 20px 24px;
    border-bottom: 1px solid #e2e8f0;
    margin-right: 0;
  }

  .el-dialog__body {
    padding: 24px;
  }

  .el-dialog__headerbtn {
    top: 20px;
    right: 20px;
    width: 36px;
    height: 36px;

    .el-dialog__close {
      font-size: 18px;
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .example-container {
    padding: 16px;
  }

  .page-header {
    padding: 20px;
  }

  .header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .header-left {
    justify-content: center;
  }

  .header-right {
    flex-direction: column;
  }

  .search-wrapper .search-input {
    width: 100%;
  }

  .stats-badge {
    justify-content: center;
  }

  .components-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .header-icon {
    width: 48px;
    height: 48px;
    font-size: 24px;
  }

  .header-text .page-title {
    font-size: 22px;
  }

  .category-filter {
    gap: 8px;
    margin-top: 16px;
    padding-top: 16px;
  }

  .category-tag {
    padding: 6px 12px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .category-filter {
    gap: 6px;
  }

  .category-tag {
    padding: 6px 10px;
    font-size: 11px;

    .category-count {
      display: none;
    }
  }

  .component-card {
    padding: 20px;
  }

  .card-icon {
    width: 60px;
    height: 60px;
    font-size: 30px;
  }
}

/* 暗色模式 */
:root.dark {
  .example-container {
    &::before {
      background:
        radial-gradient(
          circle at 10% 20%,
          rgba(99, 102, 241, 0.2) 0%,
          transparent 40%
        ),
        radial-gradient(
          circle at 90% 80%,
          rgba(168, 85, 247, 0.15) 0%,
          transparent 40%
        );
    }
  }

  .page-header {
    background: rgba(30, 41, 59, 0.9);
    border-color: rgba(51, 65, 85, 0.5);
  }

  .header-text .page-title {
    color: #f1f5f9;
  }

  .header-text .page-subtitle {
    color: #94a3b8;
  }

  .search-wrapper .search-input :deep(.el-input__wrapper) {
    background: rgba(51, 65, 85, 0.5);
    border-color: rgba(71, 85, 105, 0.5);

    &:hover,
    &.is-focus {
      background: rgba(51, 65, 85, 0.8);
    }
  }

  .category-filter {
    border-top-color: rgba(51, 65, 85, 0.8);
  }

  .category-tag {
    background: rgba(51, 65, 85, 0.5);
    border-color: rgba(71, 85, 105, 0.5);
    color: #94a3b8;

    &:hover {
      background: rgba(99, 102, 241, 0.2);
      border-color: rgba(99, 102, 241, 0.4);
      color: #a5b4fc;
    }

    &.active {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
    }

    .category-count {
      background: rgba(148, 163, 184, 0.3);
    }
  }

  .component-card {
    background: rgba(30, 41, 59, 0.9);
    border-color: rgba(51, 65, 85, 0.5);
  }

  .card-icon {
    background: linear-gradient(135deg, #334155 0%, #475569 100%);
  }

  .card-title {
    color: #f1f5f9;
  }

  .card-desc {
    color: #94a3b8;
  }

  .card-tag {
    background: rgba(99, 102, 241, 0.15);
    border-color: rgba(99, 102, 241, 0.3);
    color: #a5b4fc;

    &:hover {
      background: rgba(99, 102, 241, 0.25);
      border-color: rgba(99, 102, 241, 0.4);
    }
  }

  .card-footer {
    border-top-color: rgba(51, 65, 85, 0.8);
  }

  .empty-state {
    h3 {
      color: #cbd5e1;
    }

    p {
      color: #94a3b8;
    }
  }
}
</style>

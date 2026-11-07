<template>
  <div
    class="header-right"
    :class="{ 'is-header-inverted': isHeaderInverted }"
    ref="toolbarRef"
  >
    <!-- 顶部扩展槽：外部页面可注入大屏按钮等操作入口
         - 布局内：<template #header-extra>…</template>
         - 任意组件：<Teleport to="#koi-header-extra">…</Teleport> -->
    <div id="koi-header-extra" class="header-extra">
      <slot name="header-extra"></slot>
    </div>
    <!--
      顶栏条目：由 headerItems.ts 注册表驱动。

      - 未配 app.yaml other.toolbar.items → 按 HEADER_ITEMS 固有顺序渲染（与改造前逐条等价）
      - 配了 items → 按 yaml 给的顺序渲染，未列入的内置条目不再渲染
      - keepMounted 的条目用 v-show 隐藏（保留搜索态等组件状态）；
        其余用 v-if 卸载（天气/台风这类挂载即发请求的，不能留在后台空转）
      - v-show 必须落到 <div> 上：顶栏条目组件（ReWeather / ReExchangeRate / ReTyphoon）
        的根是 <el-popover> 这种 Fragment，v-show 拿不到元素根会报
        "Runtime directive used on component with non-element root node" 并且指令失效。
    -->
    <template v-for="item in renderItems" :key="item.key">
      <div v-if="item.keepMounted" v-show="item.visible">
        <component :is="item.component" v-bind="item.props" />
      </div>
      <component
        v-else-if="item.visible"
        :is="item.component"
        v-bind="item.props"
      />
    </template>

    <!-- 工具栏折叠（始终显示；默认折叠只显示头像，点击展开/收起图标） -->
    <div class="toolbar-toggle-wrap">
      <span class="toolbar-toggle-divider" aria-hidden="true"></span>
      <el-tooltip
        :content="isCollapsed ? t('header.collapseToolbar') : t('header.expandToolbar')"
        :show-after="1500"
        placement="bottom"
      >
        <button
          type="button"
          class="toolbar-toggle"
          :class="{ 'is-expanded': isCollapsed }"
          :aria-label="isCollapsed ? t('header.collapseToolbar') : t('header.expandToolbar')"
          @click="toggleToolbar"
        >
          <el-icon :size="14">
            <DArrowRight v-if="isCollapsed" />
            <DArrowLeft v-else />
          </el-icon>
        </button>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { storeToRefs } from "pinia";
import { DArrowLeft, DArrowRight } from "@element-plus/icons-vue";
import useGlobalStore from "@repo/pinia/modules/global";
import { getConfig, isCapabilityEnabled } from "@repo/config";
import { useI18n } from "vue-i18n";
import {
  HEADER_ITEMS,
  HEADER_ITEM_MAP,
  type HeaderItemContext,
  type HeaderItemDef,
} from "./headerItems";
import type { ToolbarItemConfig } from "@repo/config";
import { log } from "@repo/utils";

const emit = defineEmits(["widthChange"]);

const { t } = useI18n();
const globalStore = useGlobalStore();
const { headerInverted, asideInverted, layout, isDark } = storeToRefs(globalStore);
/** 头部反转色（仅亮色模式）；横向布局下侧栏反转等同顶栏反转 */
const isHeaderInverted = computed(() => {
  if (isDark.value) return false;
  if (headerInverted.value) return true;
  return layout.value === "horizontal" && asideInverted.value;
});

// 框架组件显隐开关（app.yaml other.toolbar 配置）
const toolbarConfig = computed(() => getConfig().other.toolbar);

/**
 * 工具栏展开状态。
 *
 * <p><b>注意这套命名是反的</b>：`isCollapsed = true` 表示「展开（图标都显示）」，
 * `false` 表示「折叠（只剩头像）」。历史上就这么写的，模板里大量
 * `v-show="isCollapsed && …"` 依赖它；本次重构保持语义不变，不在此处翻名，
 * 避免一次性连带改十几处条件。</p>
 */
const isCollapsed = ref(!(toolbarConfig.value.collapse ?? true));
const isSmallScreen = ref(true);
const toolbarRef = ref<HTMLElement>();

/** 注册表求值上下文：把配置与能力开关一次性喂给各条目，避免每个条目各读一遍 */
const itemContext = computed<HeaderItemContext>(() => {
  const cfg = getConfig();
  return {
    toolbar: cfg.other.toolbar,
    timer: cfg.other.timer,
    weather: cfg.other.weather,
    bigscreen: cfg.other.bigscreen,
    capability: isCapabilityEnabled,
  };
});

/** 一条待渲染的顶栏条目 */
interface RenderedItem {
  key: string;
  component: HeaderItemDef["component"];
  /** 是否可见（布尔开关 + 业务条件 + 折叠状态三者同时满足） */
  visible: boolean;
  /** true = 用 v-show 隐藏，保留组件实例 */
  keepMounted: boolean;
  /** 传给组件的 props（仅 acceptsOptions 的条目有） */
  props: Record<string, unknown>;
}

/**
 * 计算本次要渲染的条目。
 *
 * <p>显隐真相排序：`toolbar.<key>` 布尔 → 条目业务条件 → 折叠状态。
 * `collapsible:false` 或 `priority:'high'` 的条目不受折叠影响（天气/台风/头像等
 * 历史上就是常显，行为保持不变）。</p>
 */
const renderItems = computed<RenderedItem[]>(() => {
  const ctx = itemContext.value;
  const cfg = ctx.toolbar;
  const declared: ToolbarItemConfig[] = Array.isArray(cfg?.items) ? cfg.items : [];

  /** 待渲染集合：{ 定义, yaml 声明 } */
  const source: Array<{ def: HeaderItemDef; decl?: ToolbarItemConfig }> = [];
  if (declared.length > 0) {
    for (const decl of declared) {
      if (!decl || decl.visible === false) continue;
      const key = String(decl.key ?? "").trim();
      const def = HEADER_ITEM_MAP.get(key);
      if (!def) {
        // yaml 里写错键名时静默跳过会让排查很难，这里明确告警一次
        log.warn("header", `未知的顶栏条目 key：${key}（见 headerItems.ts 注册表）`);
        continue;
      }
      source.push({ def, decl });
    }
  } else {
    // 未配 items：沿用固有顺序，全部内置条目
    for (const def of HEADER_ITEMS) source.push({ def });
  }

  return source.map(({ def, decl }) => {
    const cfgFlags = cfg as unknown as Record<string, unknown>;
    const flagOn = def.flag ? cfgFlags[def.flag as string] !== false : true;
    const extraOn = def.enabled ? def.enabled(ctx) : true;
    const priority = decl?.priority ?? def.priority ?? "normal";
    const collapsible = def.collapsible ?? true;
    // 不受折叠影响的：明确 collapsible:false，或 yaml 标了 high
    const collapseOk = collapsible === false || priority === "high" ? true : isCollapsed.value;
    return {
      key: def.key,
      component: def.component,
      visible: flagOn && extraOn && collapseOk,
      keepMounted: !!def.keepMounted,
      props: def.acceptsOptions ? { options: decl?.options ?? {} } : {},
    };
  });
});


// 获取工具栏宽度并发送给父组件
const updateToolbarWidth = () => {
  if (toolbarRef.value) {
    const width = toolbarRef.value.offsetWidth;
    emit("widthChange", width);
  }
};

// 检查屏幕尺寸
const checkScreenSize = () => {
  isSmallScreen.value = window.innerWidth < 1200;
  // 小于1200px时自动折叠（只显示头像）；大于等于1200px保持当前状态（默认按配置 toolbar.collapse）
  if (isSmallScreen.value) {
    isCollapsed.value = false;
  }

  // 更新宽度
  nextTick(() => {
    updateToolbarWidth();
  });
};

// 切换工具栏折叠状态
const toggleToolbar = () => {
  isCollapsed.value = !isCollapsed.value;
  // 切换后更新宽度
  nextTick(() => {
    updateToolbarWidth();
  });
};

// 监听折叠状态变化
watch(isCollapsed, () => {
  nextTick(() => {
    updateToolbarWidth();
  });
});

// 监听窗口大小变化
onMounted(() => {
  checkScreenSize();
  window.addEventListener("resize", checkScreenSize);

  // 初始更新宽度
  nextTick(() => {
    updateToolbarWidth();
  });
});

onUnmounted(() => {
  window.removeEventListener("resize", checkScreenSize);
});
</script>

<style lang="scss" scoped>
.header-right {
  display: flex;
  align-items: center;
  height: 100%;
  gap: 2px;
  transition: all 0.3s ease;

  /** 头部反转色：仅折叠钮与图标 hover 使用同一套深色变量 */
  &.is-header-inverted {
    .toolbar-toggle {
      color: var(--el-header-text-color);
      background: var(--el-header-toolbar-collapse-bg-color);
      border-color: var(--el-header-toolbar-border-color);
      box-shadow: none;

      &:hover {
        color: var(--el-color-primary);
        background: var(--el-header-toolbar-collapse-hover-bg-color);
        border-color: var(--el-header-toolbar-border-color);
        box-shadow: none;
      }

      &:focus-visible {
        border-color: var(--el-color-primary);
        box-shadow: 0 0 0 2px var(--el-header-toolbar-collapse-hover-bg-color);
      }
    }
  }

  html.dark & {
    .toolbar-toggle {
      color: var(--el-header-text-color);
      background: var(--el-header-toolbar-collapse-bg-color);
      border-color: var(--el-header-toolbar-border-color);
      box-shadow: none;

      &:hover {
        color: var(--el-color-primary);
        background: var(--el-header-toolbar-collapse-hover-bg-color);
        border-color: var(--el-header-toolbar-border-color);
        box-shadow: none;
      }

      &:focus-visible {
        border-color: var(--el-color-primary);
        box-shadow: 0 0 0 2px var(--el-header-toolbar-collapse-hover-bg-color);
      }
    }
  }

  /* 顶部扩展槽：空内容不占位，有内容时与图标同排 */
  .header-extra {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 8px;

    &:empty {
      display: none;
    }
  }

  .toolbar-toggle-wrap {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    margin-left: 2px;
  }

  .toolbar-toggle-divider {
    width: 1px;
    height: 18px;
    margin-right: 5px;
    background: var(--el-header-toolbar-border-color);
    opacity: 0.75;
  }

  .toolbar-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    padding: 0;
    color: var(--el-color-primary);
    cursor: pointer;
    background: var(--el-header-toolbar-collapse-bg-color);
    border: 1px solid var(--el-color-primary-light-7);
    border-radius: 8px;
    outline: none;
    transition:
      background 0.25s ease,
      border-color 0.25s ease,
      box-shadow 0.25s ease,
      transform 0.2s ease;

    .el-icon {
      transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
    }

    &.is-expanded .el-icon {
      transform: translateX(-1px);
    }

    &:not(.is-expanded) .el-icon {
      transform: translateX(1px);
    }

    &:hover {
      background: var(--el-header-toolbar-collapse-hover-bg-color);
      border-color: var(--el-color-primary-light-5);
      box-shadow: 0 2px 10px rgba(var(--el-color-primary-rgb), 0.22);
    }

    &:active {
      transform: scale(0.94);
    }

    &:focus-visible {
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
    }
  }
}
</style>

<template>
  <!-- 有下级，用el-sub-menu，无下级用el-menu-item -->
  <template v-for="item in menuList" :key="item.path">
    <!-- 分组菜单：分组布局(provide 标记)或 meta.isGroup → 分组标题 + 组内平铺可见 items。
         标题是**纯分区标签**：不可点、不可折叠 —— 分组只是把同域条目归到一起，
         给它一个折叠开关只会让人误以为功能被删（需求口径：分组菜单不支持折叠，故无折叠按钮）。 -->
    <el-menu-item-group v-if="isGroupItem(item)">
      <template #title>
        <span class="menu-group-title" v-text="getMenuLanguage(item.meta?.title)"></span>
      </template>
      <ReAsideSubMenu :menuList="groupChildren(item)" />
    </el-menu-item-group>
    <!-- 单个子菜单且启用折叠：直接渲染子菜单项，用父级图标 -->
    <el-menu-item
      v-else-if="collapseSingleChild && item.children?.length === 1"
      :index="item.children[0].path"
      @click="handleMenuRouter(item.children[0])"
    >
      <!-- 图标放默认插槽：菜单折叠时 Element Plus 以默认插槽作为折叠触发器内容 -->
      <div class="icon-container">
        <ReIcon :name="item.meta?.icon || menuDefaultIcon" size="18" class="menu-icon"></ReIcon>
      </div>
      <template #title>
        <el-tooltip :content="getMenuLanguage(item.children[0].meta?.title)" :show-after="1500" placement="right">
          <div class="menu-title-row">
            <span class="menu-ellipsis" v-text="getMenuLanguage(item.children[0].meta?.title)"></span>
            <template v-if="item.children[0].meta?.isTag == 1">
              <span
                v-if="item.children[0].meta.tagName"
                class="menu-badge"
                :class="`menu-badge--${item.children[0].meta.tagType || 'primary'}`"
                v-text="item.children[0].meta.tagName"
              ></span>
              <span v-else class="menu-badge-dot" :style="{ background: badgeColor(item.children[0].meta.tagType) }"></span>
            </template>
          </div>
        </el-tooltip>
      </template>
    </el-menu-item>
    <!-- 有下级且多于1个 -->
    <el-sub-menu v-else-if="item.children?.length" :index="item.path">
      <template #title>
        <el-tooltip :content="getMenuLanguage(item.meta?.title)" :show-after="1500" placement="right">
          <div class="menu-title-wrap">
            <!-- 图标容器 - 负责偏移 -->
            <div class="icon-container">
              <!-- 图标本身 - 负责动画 -->
              <ReIcon :name="item.meta?.icon || menuDefaultIcon" size="18" class="menu-icon"></ReIcon>
            </div>
            <span class="menu-ellipsis" v-text="getMenuLanguage(item.meta?.title)"></span>
          </div>
        </el-tooltip>
      </template>
      <ReAsideSubMenu :menuList="item.children" />
    </el-sub-menu>
    <!-- 叶子节点[功能节点]；空分组（isGroup 且无可见子项）不渲染，避免悬空分组标题与不可点的分组路径项 -->
    <el-menu-item v-else-if="!(item.meta?.isGroup && !groupChildren(item).length)" :index="item.path" @click="handleMenuRouter(item)">
      <!-- 图标放默认插槽：菜单折叠时 Element Plus 以默认插槽作为折叠触发器内容 -->
      <div class="icon-container">
        <ReIcon :name="item.meta?.icon || menuDefaultIcon" size="18" class="menu-icon"></ReIcon>
      </div>
      <template #title>
        <el-tooltip :content="getMenuLanguage(item.meta?.title)" :show-after="1500" placement="right">
          <div class="menu-title-row">
            <span class="menu-ellipsis" v-text="getMenuLanguage(item.meta?.title)"></span>
            <template v-if="item.meta?.isTag == 1">
              <span
                v-if="item.meta.tagName"
                class="menu-badge"
                :class="`menu-badge--${item.meta.tagType || 'primary'}`"
                v-text="item.meta.tagName"
              ></span>
              <span v-else class="menu-badge-dot" :style="{ background: badgeColor(item.meta.tagType) }"></span>
            </template>
          </div>
        </el-tooltip>
      </template>
    </el-menu-item>
  </template>
</template>

<script setup lang="ts">
import ReAsideSubMenu from "@repo/theme/koi/layouts/components/Menu/ReAsideSubMenu.vue";
import { msgWarning } from "@repo/core";
import { useRouter } from "vue-router";
import { inject } from "vue";
import { getMenuLanguage } from "@repo/languages";
import { getConfig, resolveMenuDefaultIcon } from "@repo/config";

const router = useRouter();

/** 是否处于「分组导航」布局：仅 LayoutGroup 通过 provide 置 true，vertical 等同级布局保持可折叠子菜单 */
const groupMenuMode = inject<boolean>("koi-group-menu-mode", false);

// 获取父组件传递过来的数据
defineProps(["menuList"]);

const collapseSingleChild = getConfig().menu.collapseSingleChild;

/** 缺省菜单图标：菜单未配置 meta.icon 时兜底，避免图标位空白 */
const menuDefaultIcon = resolveMenuDefaultIcon();

/** 徽标类型 → 主题色（圆点徽标使用；标签徽标用 class 控制，适配深色模式） */
const badgeColorMap: Record<string, string> = {
  primary: "var(--el-color-primary)",
  success: "var(--el-color-success)",
  warning: "var(--el-color-warning)",
  danger: "var(--el-color-danger)",
  info: "var(--el-color-info)",
};
const badgeColor = (type?: string): string => badgeColorMap[type || "primary"] || badgeColorMap.primary;

/**
 * 分组（meta.isGroup）内的可见子项：showLink/isVisible 关闭的子页面只注册路由、不占菜单位。
 * 只服务 isGroup 分支，普通 el-sub-menu 的子项行为保持原样。
 */
const groupChildren = (item: any): any[] =>
  (item?.children ?? []).filter((child: any) => {
    const meta = child?.meta ?? {};
    if (meta.showLink === false) return false;
    const visible = meta.isVisible;
    return visible == null || visible === 1 || visible === true || visible === "1";
  });

/**
 * 是否按「平铺分组」渲染：分组布局（provide 标记）下任何含可见子项的父节点，或显式 meta.isGroup，
 * 渲染为分组标题 + 组内平铺 items（无折叠箭头）；vertical 等布局 groupMenuMode=false，保持 el-sub-menu。
 */
const isGroupItem = (item: any): boolean =>
  (groupMenuMode === true || item?.meta?.isGroup === true) && groupChildren(item).length > 0;

/** 打开标签页 或 外部链接 */
const handleMenuRouter = (value: any) => {
  if (value.meta?.linkUrl) {
    if (/^https?:\/\//.test(value.meta?.linkUrl)) {
      return window.open(value.meta.linkUrl, "_blank");
    } else {
      msgWarning("非正确链接地址，禁止跳转");
      return;
    }
  }
  router.push(value.path);
};
</script>

<style lang="scss" scoped>
/** 菜单标题过长使用省略号 */
.menu-title-wrap {
  display: flex;
  align-items: center;
  gap: 2px;
  width: 100%;
}

.menu-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  position: relative;
  transform: translate($aside-menu-font-icon-translate); // 文字偏移保持不变
}

/** 图标容器 - 只负责偏移 */
.icon-container {
  display: inline-block;
  flex-shrink: 0;
  transform: translate($aside-menu-font-icon-translate); // 图标容器偏移
}

/** 图标本身 - 负责动画 */
.menu-icon {
  display: block;
  transition: transform 0.3s ease;
}

/** 父节点 */
.el-menu-item {
  height: $aside-menu-height !important;
  margin-bottom: $aside-menu-margin-bottom;
  font-weight: $aside-menu-font-weight;
  --el-menu-item-height: $aside-menu-height;
  color: var(--el-menu-text-color);
  user-select: none;
  border-radius: $aside-menu-border-left;

  // 设置鼠标悬停时el-menu-item的样式
  &:hover {
    color: var(--el-menu-hover-text-color);
    background: var(--el-menu-hover-bg-color);
    border-radius: $aside-menu-border-left;

    // 实现鼠标悬停时icon变色和动画
    .menu-icon {
      color: var(--el-menu-hover-text-color);
      animation: koi-icon-scale 0.6s ease-in-out forwards;
    }
  }

  // 设置选择el-menu-item时的样式
  &.is-active {
    color: var(--el-menu-active-text-color);
    background: var(--el-menu-active-bg-color);

    /* 左侧强调色条：用 background 而非 border-left 画。
       原写法 `border-left: 4px solid var(--el-menu-border-left-color)` 里那个变量
       **在整个 koi 主题中从未定义**，整条 border-left 因变量无法解析而作废，
       实测 width 恒为 0px —— 激活态一直没有任何左侧色条。这里改用确定有定义的
       --el-color-primary，并用绝对定位独立控制粗细/高度/圆角，不再依赖边框。 */
    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 50%;
      width: 3px;
      height: 18px;
      transform: translateY(-50%);
      z-index: auto;
      pointer-events: none;
      background-color: var(--el-color-primary);
      border-radius: 0 3px 3px 0;
      transition: opacity 0.2s ease-in-out;
    }

    .menu-icon {
      color: var(--el-menu-active-text-color);
    }
  }
}

/** 子节点 */
:deep(.el-sub-menu__title) {
  height: $aside-menu-height;
  padding-right: 0;
  margin-bottom: $aside-menu-margin-bottom;
  font-weight: $aside-menu-font-weight;
  color: var(--el-menu-text-color);
  user-select: none;
  border-radius: $aside-menu-border-left;
  
  .icon-container {
    transform: translate($aside-menu-font-icon-translate); // 子菜单图标偏移
  }
  
  &:hover {
    color: var(--el-menu-hover-text-color);
    background: var(--el-menu-hover-bg-color);
    
    .menu-icon {
      animation: koi-icon-scale 0.6s ease-in-out forwards;
      color: var(--el-menu-hover-text-color);
    }
  }
  
  // &:active {
  //   color: var(--el-menu-active-text-color);
  //   background: var(--el-menu-active-bg-color);
  // }
}

/** 纯缩放动画 - 不受偏移影响 */
@keyframes koi-icon-scale {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 204, 0, 0);
  }
  70% {
    transform: scale(1.12);
    box-shadow: 0 0 0 15px rgba(255, 204, 0, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 204, 0, 0);
  }
}

/** 菜单标题行：文字 + 右侧徽标 */
.menu-title-row {
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  gap: 6px;

  .menu-ellipsis {
    flex: 1;
    min-width: 0;
  }
}

/** 菜单徽标（类型由修饰类控制，适配深色模式） */
.menu-badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 16px;
  padding: 0 6px;
  margin-left: auto;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  color: #fff;
  border-radius: 8px;
}
.menu-badge--primary { background: var(--el-color-primary); }
.menu-badge--success { background: var(--el-color-success); }
.menu-badge--warning { background: var(--el-color-warning); }
.menu-badge--danger { background: var(--el-color-danger); }
.menu-badge--info { background: var(--el-color-info); }

.menu-badge-dot {
  flex-shrink: 0;
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-left: auto;
  border-radius: 50%;
}

/** 分组菜单标题（meta.isGroup）：一级只做分区说明 —— 小号、灰色。
    标题容器里现在只有一个纯文本 span（无折叠按钮），本条只负责把 EP 标题容器本身
    「洗成」透明标签，字号/颜色/字重交给 .menu-group-title 与全局 .is-group-nav 规则控制。
    这是 menuConfig.groupNav=false 时的基础外观；开启增强后由全局
    .el-menu.is-group-nav 规则接管（见文件末尾非 scoped 样式块）。 */
:deep(.el-menu-item-group__title) {
  --el-menu-base-level-padding: 10px; // 与二级菜单图标起点对齐（EP 用该变量算 padding-left，直接写 padding-left 会被更高特异性规则覆盖）
  padding-top: 12px;
  padding-bottom: 6px;
  line-height: 1;
  text-transform: none;
  /* EP 默认给标题加 hover 底色，分组标签不该有 hover 反馈 */
  background: transparent;
  &:hover {
    background: transparent;
  }
}

/** 分组标题行：纯分区标签（不可点、不可折叠），只负责单行省略 */
.menu-group-title {
  display: block;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  user-select: none;
}
</style>

<style lang="scss">
/**
 * 分组导航（menuConfig.groupNav=true，由各纵向布局给 el-menu 加 .is-group-nav）
 *
 * 排版口径 —— 分组标题是「分区标签」，不是菜单项：
 *   字号更小、字重更轻、颜色更灰，与组内条目拉开层级。
 *   早期版本把标题做成 13px/600/深色（--el-text-color-primary），结果标题和条目
 *   几乎同权重，扫视时"题库资源/考试流程/数据配置"被当成可点条目，分组反而更难读。
 *
 * 用全局选择器而非组件 scoped：el-menu-item-group__title 由 Element Plus 在
 * el-menu-item-group 内部渲染，这里只需盖住组件内那条基础规则。
 * 特异性 (0,3,0) 高于组件内 :deep() 规则 (0,2,0)，故无需 !important。
 */
.el-menu.is-group-nav .el-menu-item-group__title {
  font-size: 12px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: 0.3px;
  color: var(--el-text-color-secondary);
}

/**
 * 分组之间的呼吸感：除首个分组外都上移留白。
 * 靠 .el-menu-item-group + .el-menu-item-group 相邻选择器，避免给首个分组也加顶部空隙
 * （顶部空隙会把 Logo 下方第一组推离 Logo）。
 */
.el-menu.is-group-nav .el-menu-item-group + .el-menu-item-group {
  margin-top: 10px;
}

/** 分组标题内的文字/箭头继承上面的灰字色；hover 时略深一点，给出可点反馈 */
.el-menu.is-group-nav .el-menu-item-group__title .menu-group-title {
  color: var(--el-text-color-secondary);
  transition: color 0.2s ease;
}
.el-menu.is-group-nav .el-menu-item-group__title .menu-group-title:hover {
  color: var(--el-text-color-primary);
}

/**
 * 组内条目：圆角胶囊 + 主色图标。
 * 图标用主色、文案用常规色，是 koi 的既有约定（图标负责定位，文案负责阅读），
 * 激活时二者同为主色。
 */
.el-menu.is-group-nav .el-menu-item {
  border-radius: 8px;
  .menu-icon {
    color: var(--el-color-primary);
  }
  &.is-active .menu-icon {
    color: var(--el-menu-active-text-color);
  }
}

/**
 * 分组导航增强：菜单折叠成窄图标轨时隐藏分组标题。
 * 约 33~56px 的窄宽会让横向标题逐字换行成竖排、虚占高度，故直接不显示
 * （组内条目图标本身已能表达归属）。
 */
.el-menu.is-group-nav.el-menu--collapse .el-menu-item-group__title {
  display: none;
}

/** 子级菜单字体高亮，父级菜单也高亮 */
.el-sub-menu.is-active > .el-sub-menu__title {
  color: var(--el-menu-parent-active-text-color) !important;
  
  .menu-icon {
    color: var(--el-menu-parent-active-text-color) !important;
  }
}

/** 菜单收缩时悬浮显示的弹窗样式 - 移除border */
.el-popper.is-pure {
  border: none !important;
  outline: none !important;
}

/** 菜单收缩时悬浮显示的二级、三级菜单 - 移除border */
.el-menu--popup-container {
  .el-menu--popup {
    border: none !important;
    outline: none !important;
    
    .el-menu-item {
      border: none !important;
      outline: none !important;
    }
    
    .el-sub-menu {
      border: none !important;
      outline: none !important;
      
      .el-sub-menu__title {
        border: none !important;
        outline: none !important;
      }
    }
  }
}

/** 覆盖所有层级的悬浮菜单border */
.el-menu--popup {
  border: none !important;
  outline: none !important;
  
  .el-menu-item,
  .el-sub-menu,
  .el-sub-menu__title {
    border: none !important;
    outline: none !important;
  }
}
</style>

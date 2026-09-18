<template>
  <!-- 有下级，用el-sub-menu，无下级用el-menu-item -->
  <template v-for="item in menuList" :key="item.path">
<!-- 分组菜单：meta.isGroup → 分组标题 + 组内平铺 items -->
    <el-menu-item-group v-if="item.meta?.isGroup && item.children?.length" :title="getMenuLanguage(item.meta?.title)">
      <ReAsideSubMenu :menuList="item.children" />
    </el-menu-item-group>
<!-- 单个子菜单且启用折叠：直接渲染子菜单项，用父级图标 -->
	<el-menu-item
		v-else-if="collapseSingleChild && item.children?.length === 1"
		:index="item.children[0].path"
		@click="handleMenuRouter(item.children[0])"
	>
		<template #title>
			<el-tooltip :content="getMenuLanguage(item.children[0].meta?.title)" :show-after="1500" placement="right">
				<div class="menu-title-wrap">
					<div class="icon-container">
						<ReIcon :name="item.meta?.icon || menuDefaultIcon" size="18" class="menu-icon"></ReIcon>
					</div>
					<span class="menu-ellipsis" v-text="getMenuLanguage(item.children[0].meta?.title)"></span>
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
    <!-- 叶子节点[功能节点]；空分组（isGroup 且无子项）不渲染，避免悬空分组标题 -->
    <el-menu-item v-else-if="!(item.meta?.isGroup && !item.children?.length)" :index="item.path" @click="handleMenuRouter(item)">
      <template #title>
        <el-tooltip :content="getMenuLanguage(item.meta?.title)" :show-after="1500" placement="right">
          <div class="menu-title-wrap">
            <!-- 图标容器 - 负责偏移 -->
            <div class="icon-container">
              <!-- 图标本身 - 负责动画 -->
              <ReIcon :name="item.meta?.icon || menuDefaultIcon" size="18" class="menu-icon"></ReIcon>
            </div>
            <span class="menu-ellipsis" v-text="getMenuLanguage(item.meta?.title)"></span>
            <span v-if="item.meta?.badge" class="menu-badge">{{ item.meta.badge }}</span>
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
import { getMenuLanguage } from "@repo/languages";
import { getConfig, resolveMenuDefaultIcon } from "@repo/config";

const router = useRouter();

// 获取父组件传递过来的数据
defineProps(["menuList"]);

const collapseSingleChild = getConfig().menu.collapseSingleChild;

/** 缺省菜单图标：菜单未配置 meta.icon 时兜底，避免图标位空白 */
const menuDefaultIcon = resolveMenuDefaultIcon();

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

    &::before {
      border-left: $aside-menu-border-left solid var(--el-menu-border-left-color);
      z-index: auto;
      content: "";
      background-color: transparent;
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      pointer-events: none;
      border-radius: $aside-menu-border-left;
      transition: background-color .3s ease-in-out;
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

/** 菜单徽标（meta.badge） */
.menu-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  margin-left: auto;
  font-size: 11px;
  line-height: 1;
  color: var(--el-menu-active-text-color);
  background: var(--el-color-danger);
  border-radius: 8px;
}

/** 分组菜单标题（meta.isGroup） */
:deep(.el-menu-item-group__title) {
  padding-top: 12px;
  padding-bottom: 4px;
  padding-left: 20px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-menu-text-color, #909399);
  text-transform: none;
  pointer-events: none;
}
</style>

<style lang="scss">
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
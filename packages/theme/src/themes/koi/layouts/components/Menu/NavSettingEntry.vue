<template>
  <!-- 底部系统配置入口。
       compact=true：纯图标（配合图标栏底部按钮坞，Columns/Double/Optimum 用）。
       compact=false 且 menuConfig.groupNav=true（默认）：图标 + 文字整行条目（Vertical/Group/Classic 用）。
       compact=false 且 groupNav=false：回退纯图标 + tooltip，与增强开关关闭前行为一致。

       目标路由未注册时不渲染：应用的路由树是按需装配的（如 eduai 只挂 eduaiRoutes，
       不含 pages/system 的 /system/config），此时这个入口点下去只会落到 404，
       对用户就是一个坏按钮 —— 直接隐藏，比留一个死链正确。 -->
  <div v-if="targetAvailable" class="nav-setting-entry" :class="{ 'is-compact': compact }">
    <el-tooltip v-if="iconOnly" :content="label" placement="right" :show-after="200">
      <button
        v-admin
        type="button"
        class="nav-setting-btn is-icon-only"
        :class="{ 'is-active': isActive }"
        :aria-label="label"
        @click="goSystemConfig"
      >
        <el-icon :size="18" class="nav-setting-icon"><Setting /></el-icon>
      </button>
    </el-tooltip>
    <button
      v-else
      v-admin
      type="button"
      class="nav-setting-btn"
      :class="{ 'is-active': isActive }"
      :aria-label="label"
      @click="goSystemConfig"
    >
      <el-icon :size="18" class="nav-setting-icon"><Setting /></el-icon>
      <span class="nav-setting-label">{{ label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * 侧边栏「系统配置」入口 —— 供所有纵向布局复用。
 *
 * 解决的问题：此前这段「图标 + tooltip + 点击跳 /system/config」的模板与样式
 * 在 LayoutGroup / LayoutVertical 里各抄了一份，样式随布局漂移；其余纵向布局则完全没有。
 * 抽成本组件后，新增纵向布局只需放一个标签，样式与开关行为保持单一来源。
 *
 * 受 menuConfig.groupNav 控制（默认 true）：
 * - true 且非 compact：图标 + 文字整行条目，视觉上与菜单项同高同规格
 * - false 或 compact：回退纯图标 + tooltip
 */
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Setting } from "@element-plus/icons-vue";
import { resolveGroupNav } from "@repo/config";
import useGlobalStore from "@repo/pinia/modules/global";

const props = withDefaults(
  defineProps<{
    /** 条目文字 */
    label?: string;
    /** 目标路由（产品级系统配置页，隐藏菜单） */
    path?: string;
    /** 纯图标模式：用于 Columns/Double/Optimum 的图标栏底部按钮坞 */
    compact?: boolean;
  }>(),
  {
    label: "设置",
    path: "/system/config",
    compact: false,
  },
);

const route = useRoute();
const router = useRouter();
const globalStore = useGlobalStore();

/** 分组导航增强开关（menuConfig.groupNav，缺省 true） */
const groupNav = computed(() => resolveGroupNav());

/**
 * 目标路由是否已注册。
 *
 * <p>各应用按需装配路由树（eduai 只挂 eduaiRoutes，不注册 pages/system 的
 * /system/config），未注册时入口必须整体隐藏，否则点击会稳定落到 404。</p>
 */
const targetAvailable = ref(false);

onMounted(() => {
  targetAvailable.value = router.hasRoute(props.path);
});

/** 是否只显示图标：图标坞模式、折叠态、或关闭增强开关 */
const iconOnly = computed(() => props.compact || !groupNav.value || globalStore.isCollapse);

const isActive = computed(() => route.path === props.path);

function goSystemConfig() {
  // 兜底：即便入口被外部条件渲染出来，目标路由不存在也绝不 push（push 会落 404）
  if (!router.hasRoute(props.path)) return;
  if (route.path !== props.path) router.push(props.path);
}
</script>

<style lang="scss" scoped>
/** 底部容器：上方一条分隔线，把设置入口与菜单列表分开 */
.nav-setting-entry {
  flex-shrink: 0;
  padding: 8px $aside-menu-padding-right 10px 0;
  border-top: 1px solid var(--el-border-color-lighter);
}

/** 图标栏按钮坞模式：与相邻的切换/头像按钮同规格，不画分隔线 */
.nav-setting-entry.is-compact {
  padding: 0;
  border-top: none;
}

.nav-setting-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: $aside-menu-height;
  padding: 0 12px;
  border: none;
  border-radius: $aside-menu-border-left;
  background: transparent;
  color: var(--el-menu-text-color, var(--el-text-color-regular));
  font-size: 14px;
  font-weight: $aside-menu-font-weight;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color var(--el-transition-duration, 0.2s), color var(--el-transition-duration, 0.2s);
}

.nav-setting-icon {
  flex-shrink: 0;
}

/** 纯图标：居中，不留文字位 */
.nav-setting-btn.is-icon-only {
  justify-content: center;
  height: 40px;
  padding: 0;
  border-radius: var(--el-border-radius-base, 6px);
}

.nav-setting-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-setting-btn:hover {
  background: var(--el-menu-hover-bg-color, var(--el-fill-color-light));
  color: var(--el-menu-hover-text-color, var(--el-color-primary));
}

.nav-setting-btn.is-active {
  background: var(--el-menu-active-bg-color, var(--el-color-primary-light-9));
  color: var(--el-menu-active-text-color, var(--el-color-primary));
}
</style>

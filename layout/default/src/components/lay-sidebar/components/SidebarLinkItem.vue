<script setup lang="ts">
import { isUrl } from "@pureadmin/utils";
import type { MenuType } from "@repo/core";
import { computed } from "vue";
import { useRouter } from "vue-router";

const props = defineProps<{
  to: MenuType | { path: string };
}>();

const router = useRouter();

const isExternalLink = computed(() => {
  if ("path" in props.to) {
    return isUrl(props.to.path);
  }
  return isUrl(props.to.name);
});

const isRemainingMenu = computed(() => {
  return "meta" in props.to && props.to.meta?.remaining === true;
});

const getLinkProps = (item: MenuType | { path: string }) => {
  if (isExternalLink.value) {
    const url = "path" in item ? item.path : item.name;
    return {
      href: url,
      target: "_blank",
      rel: "noopener",
    };
  }
  if (isRemainingMenu.value) {
    // remaining菜单项，不设置href，完全通过点击事件处理
    return {
      href: "javascript:void(0)",
    };
  }
  return {
    to: item,
  };
};

// 处理点击事件
function handleClick(event: Event) {
  if (isRemainingMenu.value) {
    event.preventDefault();
    const path = "path" in props.to ? props.to.path : props.to.name;
    const meta = "meta" in props.to ? props.to.meta : undefined;

    // 检查是否在当前页面打开
    if (meta?.remainingSelf === true) {
      // 在当前页面打开，跳转到remaining组件页面
      const componentPath = convertPathToComponentParam(path);
      router.push(`/remaining-component/${componentPath}`);
    } else {
      // 默认行为：在新标签页打开remaining组件页面
      const componentPath = convertPathToComponentParam(path);
      const fullUrl = `${window.location.origin}/#/remaining-component/${componentPath}`;
      window.open(fullUrl, "_blank");
    }
  }
}

// 将路径转换为组件路径参数
function convertPathToComponentParam(path: string): string {
  // 移除开头的斜杠并将路径转换为组件参数
  const cleanPath = path.replace(/^\//, "");
  return cleanPath.replace(/\//g, "-");
}
</script>

<template>
  <component :is="isExternalLink || isRemainingMenu ? 'a' : 'router-link'" v-bind="getLinkProps(to)" @click="handleClick">
    <slot />
  </component>
</template>

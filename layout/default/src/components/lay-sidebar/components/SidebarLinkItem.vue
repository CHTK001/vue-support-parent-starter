<script setup lang="ts">
import { isUrl } from "@pureadmin/utils";
import type { MenuType } from "@repo/core";
import { computed, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useMultiTagsStoreHook } from "@repo/core";

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
  // 只传递 path，避免传递整个路由对象导致循环
  const path = "path" in item ? item.path : item.name;
  return {
    to: path,
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
    return;
  }
  
  // 普通菜单点击：先添加标签，再跳转路由
  if (!isExternalLink.value && "meta" in props.to && "name" in props.to) {
    event.preventDefault();
    
    const menuItem = props.to as MenuType;
    const tagData = {
      path: menuItem.path,
      name: menuItem.name,
      meta: menuItem.meta,
      query: {},
      params: {}
    };
    
    // 先添加标签到 store
    const multiTagsStore = useMultiTagsStoreHook();
    const multiTags = multiTagsStore.multiTags;
    const exists = Array.isArray(multiTags) && multiTags.some(tag => tag.path === menuItem.path);
    
    if (!exists) {
      multiTagsStore.handleTags("push", tagData);
    }
    
    // 等待标签添加完成后再跳转路由
    nextTick(() => {
      if (menuItem.name) {
        router.push({ name: menuItem.name });
      } else {
        router.push({ path: menuItem.path });
      }
    });
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
  <component
    :is="isExternalLink || isRemainingMenu ? 'a' : 'router-link'"
    v-bind="getLinkProps(to)"
    @click="handleClick"
  >
    <slot />
  </component>
</template>

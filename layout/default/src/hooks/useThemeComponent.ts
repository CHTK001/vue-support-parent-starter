/**
 * 主题组件Hook
 * 提供主题组件动态加载功能
 * 支持多层监听机制确保实时响应主题切换
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useGlobal } from "@pureadmin/utils";
import { emitter } from "@repo/core";

export function useThemeComponent(themeComponents: Record<string, any>, defaultComponent: any) {
  const { $storage } = useGlobal<any>();
  
  // 使用 computed 来响应式读取 storage 中的主题值
  const storageTheme = computed(() => $storage?.configure?.systemTheme || 'default');
  
  // 获取当前主题
  const currentTheme = ref<string>(storageTheme.value);
  
  // 动态选择当前主题组件
  const CurrentComponent = computed(() => {
    const component = themeComponents[currentTheme.value] || defaultComponent;
    return component;
  });
  
  // 主题变化处理函数
  const handleThemeChange = (themeKey: string) => {
    if (currentTheme.value !== themeKey) {
      currentTheme.value = themeKey;
    }
  };
  
  // 1. emitter 事件监听
  emitter.on("systemThemeChange", handleThemeChange);
  
  // 2. 监听 storage 变化作为备用机制
  watch(storageTheme, (newTheme) => {
    if (newTheme && newTheme !== currentTheme.value) {
      currentTheme.value = newTheme;
    }
  }, { immediate: false });
  
  // 3. MutationObserver 监听 data-skin 属性变化作为最终保障
  let observer: MutationObserver | null = null;
  
  onMounted(() => {
    observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-skin') {
          const newTheme = document.documentElement.getAttribute('data-skin') || 'default';
          if (newTheme !== currentTheme.value) {
            currentTheme.value = newTheme;
          }
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-skin']
    });
  });
  
  onBeforeUnmount(() => {
    emitter.off("systemThemeChange", handleThemeChange);
    observer?.disconnect();
  });
  
  return {
    currentTheme,
    CurrentComponent,
  };
}

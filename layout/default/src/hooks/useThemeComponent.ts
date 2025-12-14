/**
 * 主题组件Hook
 * 提供主题组件动态加载功能
 */
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import { useGlobal } from "@pureadmin/utils";
import { emitter } from "@repo/core";

export function useThemeComponent(themeComponents: Record<string, any>, defaultComponent: any) {
  const { $storage } = useGlobal<any>();
  
  // 获取当前主题
  const currentTheme = ref<string>($storage?.configure?.systemTheme || 'default');
  
  // 动态选择当前主题组件
  const CurrentComponent = computed(() => {
    const component = themeComponents[currentTheme.value] || defaultComponent;
    console.log('🎨 useThemeComponent - 当前主题:', currentTheme.value, '组件:', component);
    return component;
  });
  
  // 监听主题变化 - 立即注册，不等到 onMounted
  const handleThemeChange = (themeKey: string) => {
    console.log('🔄 useThemeComponent - 主题变化:', themeKey);
    currentTheme.value = themeKey;
  };
  
  emitter.on("systemThemeChange", handleThemeChange);
  
  onBeforeUnmount(() => {
    emitter.off("systemThemeChange", handleThemeChange);
  });
  
  return {
    currentTheme,
    CurrentComponent,
  };
}

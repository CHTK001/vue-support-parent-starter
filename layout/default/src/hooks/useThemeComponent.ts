/**
 * 主题组件Hook
 * 提供主题组件动态加载功能
 */
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useGlobal } from "@pureadmin/utils";
import { emitter } from "@repo/core";

export function useThemeComponent(themeComponents: Record<string, any>, defaultComponent: any) {
  const { $storage } = useGlobal<any>();
  
  // 获取当前主题
  const currentTheme = ref<string>($storage?.configure?.systemTheme || 'default');
  console.log('🚀 useThemeComponent 初始化 - 主题:', currentTheme.value);
  
  // 动态选择当前主题组件
  const CurrentComponent = computed(() => {
    const component = themeComponents[currentTheme.value] || defaultComponent;
    console.log('🎨 useThemeComponent - 计算组件, 主题:', currentTheme.value, '找到组件:', !!component);
    return component;
  });
  
  // 监听主题变化
  const handleThemeChange = (themeKey: string) => {
    console.log('🔄 useThemeComponent - 收到主题变化事件:', themeKey, '当前主题:', currentTheme.value);
    if (currentTheme.value !== themeKey) {
      currentTheme.value = themeKey;
      console.log('✅ 主题已更新为:', currentTheme.value);
    }
  };
  
  // 立即注册事件监听
  emitter.on("systemThemeChange", handleThemeChange);
  console.log('📡 已注册 systemThemeChange 事件监听');
  
  onBeforeUnmount(() => {
    emitter.off("systemThemeChange", handleThemeChange);
    console.log('🧹 已注销 systemThemeChange 事件监听');
  });
  
  return {
    currentTheme,
    CurrentComponent,
  };
}

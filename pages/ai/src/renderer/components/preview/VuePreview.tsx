import React, { useEffect, useRef } from 'react';
import { createApp, type App as VueApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import DemoVue from './DemoVue.vue';

/**
 * 演示：在 React 组件容器内通过 Vue 运行时挂载一个 Vue 组件。
 * 用于验证 "React 内嵌 Vue" 技术可行性，不接入任何认证逻辑。
 */
const VuePreview: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const vueAppRef = useRef<VueApp | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const app = createApp(DemoVue);
    app.use(ElementPlus);
    app.mount(containerRef.current);
    vueAppRef.current = app;

    return () => {
      vueAppRef.current?.unmount();
      vueAppRef.current = null;
    };
  }, []);

  return <div ref={containerRef} className="vue-preview" />;
};

export default VuePreview;
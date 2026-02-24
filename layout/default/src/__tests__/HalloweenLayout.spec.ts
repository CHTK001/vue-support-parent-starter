
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import Index from '../index.vue';
import { useSettingStoreHook } from '@repo/core';

// Mock child components
vi.mock('../components/lay-sidebar/NavHover.vue', () => ({
  default: { template: '<div class="nav-hover">NavHover</div>' }
}));
vi.mock('../components/lay-navbar/index.vue', () => ({
  default: { template: '<div class="lay-navbar">LayNavbar</div>' }
}));
vi.mock('../components/lay-tag/index.vue', () => ({
  default: { template: '<div class="lay-tag">LayTag</div>' }
}));

describe('Layout Index - Halloween Theme', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    // Mock store state
    const settingStore = useSettingStoreHook();
    settingStore.hiddenSideBar = false;
    settingStore.fixedHeader = true;
  });

  it('renders NavHover, LayNavbar and LayTag in hover layout', async () => {
    // Mock storage/layout
    const wrapper = mount(Index, {
      global: {
        stubs: ['LayContent', 'LaySetting', 'LayAiChat', 'ScDebugConsole', 'ThemeSkinProvider', 'el-scrollbar', 'el-backtop'],
        mocks: {
          $storage: {
            layout: { layout: 'hover', overallStyle: 'light' },
            configure: { hideTabs: false }
          }
        }
      }
    });

    // Check NavHover rendering（左侧悬停导航）
    expect(wrapper.find('.nav-hover').exists()).toBe(true);

    // 顶部应渲染 LayNavbar
    expect(wrapper.find('.lay-navbar').exists()).toBe(true);
    
    // 只保留一处 LayTag（来自 Header 区域）
    expect(wrapper.findAll('.lay-tag').length).toBe(1);
  });

  it('hides LayNavbar when hiddenSideBar is true', async () => {
    const settingStore = useSettingStoreHook();
    settingStore.hiddenSideBar = true;

    const wrapper = mount(Index, {
      global: {
        stubs: ['LayContent', 'LaySetting', 'LayAiChat', 'ScDebugConsole', 'ThemeSkinProvider', 'el-scrollbar', 'el-backtop'],
        mocks: {
          $storage: {
            layout: { layout: 'hover', overallStyle: 'light' },
            configure: { hideTabs: false }
          }
        }
      }
    });

    expect(wrapper.find('.lay-navbar').exists()).toBe(false);
  });
});

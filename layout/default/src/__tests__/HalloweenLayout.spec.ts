
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

  it('renders NavHover and LayHeader in hover layout', async () => {
    // Mock storage/layout
    const wrapper = mount(Index, {
      global: {
        stubs: ['LayContent', 'LaySetting', 'LayAiChat', 'ScDebugConsole', 'ThemeSkinProvider', 'el-scrollbar', 'el-backtop', 'BackTopIcon'],
        mocks: {
          $storage: {
            layout: { layout: 'hover', overallStyle: 'light' },
            configure: { hideTabs: false }
          }
        }
      }
    });

    // Check NavHover rendering
    expect(wrapper.find('.nav-hover').exists()).toBe(true);

    // Check LayNavbar rendering (inside LayHeader)
    expect(wrapper.find('.lay-navbar').exists()).toBe(true);
    
    // Check LayTag rendering
    expect(wrapper.find('.lay-tag').exists()).toBe(true);
  });

  it('hides LayNavbar when hiddenSideBar is true', async () => {
    const settingStore = useSettingStoreHook();
    settingStore.hiddenSideBar = true;

    const wrapper = mount(Index, {
      global: {
        stubs: ['LayContent', 'LaySetting', 'LayAiChat', 'ScDebugConsole', 'ThemeSkinProvider', 'el-scrollbar', 'el-backtop', 'BackTopIcon'],
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

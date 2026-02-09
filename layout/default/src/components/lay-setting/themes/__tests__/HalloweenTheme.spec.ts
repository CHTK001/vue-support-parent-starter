import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import Halloween from '../Halloween.vue';
import { nextTick } from 'vue';

// Mock vue-i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

// Mock child components
vi.mock('../BaseSetting.vue', () => ({
  default: {
    name: 'BaseSetting',
    template: '<div class="base-setting-mock">Base Setting Content</div>'
  }
}));

vi.mock('@repo/components/ReIcon/src/iconifyIconOffline', () => ({
  default: {
    name: 'IconifyIconOffline',
    template: '<span class="icon-mock"></span>'
  }
}));

// Mock element-plus components
const ElButton = { template: '<button class="el-button"><slot /></button>' };
const ElInput = { template: '<input class="el-input" />' };
const ElSwitch = { template: '<div class="el-switch"></div>' };
const ElSlider = { template: '<div class="el-slider"></div>' };
const ElDivider = { template: '<div class="el-divider"><slot /></div>' };

describe('Halloween Theme Component', () => {
  it('should render the wrapper and BaseSetting', () => {
    const wrapper = mount(Halloween, {
      global: {
        components: {
          ElButton,
          ElInput,
          ElSwitch,
          ElSlider,
          ElDivider
        },
        stubs: {
          BaseSetting: true,
          IconifyIconOffline: true
        }
      }
    });

    // Check for specific Halloween wrapper
    expect(wrapper.find('.halloween-setting-wrapper').exists()).toBe(true);
    
    // Check BaseSetting exists
    expect(wrapper.findComponent({ name: 'BaseSetting' }).exists()).toBe(true);
  });

  it('should have correct CSS class for styling scope', () => {
    const wrapper = mount(Halloween, {
        global: {
            components: {
              ElButton,
              ElInput,
              ElSwitch,
              ElSlider,
              ElDivider
            },
            stubs: {
                BaseSetting: true
            }
        }
    });
    
    expect(wrapper.classes()).toContain('halloween-setting-wrapper');
  });
});

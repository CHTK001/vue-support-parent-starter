import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import LaySettingIndex from '../index.vue';
import { shallowRef } from 'vue';

// Mock hooks
const { mockUseThemeComponent } = vi.hoisted(() => {
  return {
    mockUseThemeComponent: vi.fn()
  };
});

vi.mock('../../../hooks/useThemeComponent', () => ({
  useThemeComponent: mockUseThemeComponent
}));

// Mock theme imports to avoid actual loading
vi.mock('../themes/Default.vue', () => ({ 
  default: { template: '<div class="mock-default">Default Theme</div>' } 
}));
vi.mock('../themes/Halloween.vue', () => ({ 
  default: { template: '<div class="mock-halloween">Halloween Theme</div>' } 
}));

// Mock external dependencies that might cause issues
vi.mock('@repo/config', () => ({
  getConfig: vi.fn(() => ({})),
  $t: vi.fn((key) => key)
}));

vi.mock('@repo/utils', () => ({
  useGlobal: vi.fn(() => ({ $storage: {} }))
}));

vi.mock('@repo/core', () => ({
  useAppStoreHook: vi.fn(),
  useMultiTagsStoreHook: vi.fn(),
  emitter: { on: vi.fn(), off: vi.fn(), emit: vi.fn() }
}));

describe('LaySetting/index.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders default theme correctly', () => {
    // Setup mock return value
    mockUseThemeComponent.mockReturnValue({
      CurrentComponent: shallowRef({ template: '<div class="mock-default">Default Theme</div>' }),
      currentTheme: shallowRef('default')
    });

    const wrapper = mount(LaySettingIndex);
    
    expect(wrapper.find('.mock-default').exists()).toBe(true);
    expect(wrapper.text()).toContain('Default Theme');
  });

  it('renders dynamic theme correctly', () => {
    // Setup mock return value for a different theme
    mockUseThemeComponent.mockReturnValue({
      CurrentComponent: shallowRef({ template: '<div class="mock-halloween">Halloween Theme</div>' }),
      currentTheme: shallowRef('halloween')
    });

    const wrapper = mount(LaySettingIndex);
    
    expect(wrapper.find('.mock-halloween').exists()).toBe(true);
    expect(wrapper.text()).toContain('Halloween Theme');
  });
});

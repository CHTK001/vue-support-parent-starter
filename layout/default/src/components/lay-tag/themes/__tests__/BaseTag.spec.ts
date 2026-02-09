
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseTag from '../BaseTag.vue';
import { ref, reactive, nextTick } from 'vue';

// Mock dependencies
vi.mock('@repo/config', () => ({
  $t: (key: string) => key,
  transformI18n: (key: string) => key,
  responsiveStorageNameSpace: () => 'responsive-',
}));

vi.mock('@repo/core', () => ({
  emitter: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
  getTopMenu: vi.fn(() => ({ path: '/home' })),
  handleAliveRoute: vi.fn(),
  useMultiTagsStoreHook: vi.fn(),
  useSettingStoreHook: vi.fn(),
  usePermissionStoreHook: vi.fn(() => ({ flatteningRoutes: [] })),
}));

// Mock useTags hook
vi.mock('../../../hooks/useTag', () => ({
  useTags: () => ({
    Close: 'close-icon',
    route: { path: '/home', query: {}, params: {}, meta: {} },
    router: { push: vi.fn(), replace: vi.fn(), options: { routes: [] } },
    visible: ref(false),
    showTags: ref(false),
    instance: { refs: {} },
    multiTags: ref([
      { path: '/home', meta: { title: 'Home' } },
      { path: '/page1', meta: { title: 'Page 1' } },
      { path: '/page2', meta: { title: 'Page 2' } },
      { path: '/page3', meta: { title: 'Page 3' } },
      { path: '/page4', meta: { title: 'Page 4' } },
      { path: '/page5', meta: { title: 'Page 5' } },
    ]),
    tagsViews: reactive([
      { show: true, text: 'Reload', icon: 'refresh' },
      { show: true, text: 'Close', icon: 'close' },
      { show: true, text: 'Close Left', icon: 'left' },
      { show: true, text: 'Close Right', icon: 'right' },
      { show: true, text: 'Close Other', icon: 'other' },
      { show: true, text: 'Close All', icon: 'all' },
    ]),
    buttonTop: ref(0),
    buttonLeft: ref(0),
    showModel: ref('smart'),
    translateX: ref(0),
    isFixedTag: () => false,
    pureSetting: {},
    activeIndex: ref(-1),
    getTabStyle: {},
    isScrolling: ref(false),
    iconIsActive: () => false,
    linkIsActive: () => '',
    currentSelect: ref({}),
    scheduleIsActive: () => '',
    getContextMenuStyle: {},
    closeMenu: vi.fn(),
    onMounted: vi.fn(),
    onMouseenter: vi.fn(),
    onMouseleave: vi.fn(),
    transformI18n: (key) => key,
    onContentFullScreen: vi.fn(),
  })
}));

vi.mock('@pureadmin/utils', () => ({
  delay: () => Promise.resolve(),
  isAllEmpty: () => false,
  isEqual: () => false,
  useGlobal: () => ({ $storage: { configure: {} } }),
  useResizeObserver: vi.fn((el, callback) => {
      // Simulate resize if needed
  }),
}));

vi.mock('@repo/utils', () => ({
  useDefer: () => () => true,
}));

vi.mock('@repo/components/ReIcon/src/hooks', () => ({
  useRenderIcon: () => 'span',
}));

describe('BaseTag.vue', () => {
  it('renders correctly', () => {
    const wrapper = mount(BaseTag, {
      global: {
        stubs: {
          IconifyIconOnline: true,
          IconifyIconOffline: true,
          'el-dropdown': { template: '<div><slot /><slot name="dropdown" /></div>' },
          'el-dropdown-menu': { template: '<div><slot /></div>' },
          'el-dropdown-item': { template: '<div><slot /></div>' },
          TagChrome: true,
        }
      }
    });
    
    expect(wrapper.exists()).toBe(true);
    // Should render the scroll container
    expect(wrapper.find('.scroll-container').exists()).toBe(true);
    // Should render tags (mocked 6 tags)
    expect(wrapper.findAll('.scroll-item').length).toBe(6);
  });

  it('renders context menu structure correctly', () => {
    const wrapper = mount(BaseTag, {
      global: {
        stubs: {
          IconifyIconOnline: true,
          IconifyIconOffline: true,
          'el-dropdown': true,
          'el-dropdown-menu': true,
          'el-dropdown-item': true,
          TagChrome: true,
        }
      }
    });

    const contextMenu = wrapper.find('.contextmenu');
    expect(contextMenu.exists()).toBe(true);
    // Check it's a UL
    expect(contextMenu.element.tagName).toBe('UL');
    // Check it has LI children directly (no wrapping div)
    // Note: useTags mock provides 6 items in tagsViews, sliced to 6 in template
    expect(contextMenu.findAll('li').length).toBe(6);
  });

  it('handles arrow clicks', async () => {
     const wrapper = mount(BaseTag, {
      global: {
        stubs: {
          IconifyIconOnline: true,
          IconifyIconOffline: true,
          'el-dropdown': true,
          'el-dropdown-menu': true,
          'el-dropdown-item': true,
          TagChrome: true,
        }
      }
    });

    // Manually show arrows by setting isShowArrow ref if possible, 
    // but it's internal.
    // However, we can verify that the elements exist in DOM (v-show just toggles display: none)
    const leftArrow = wrapper.find('.arrow-left');
    const rightArrow = wrapper.find('.arrow-right');
    
    expect(leftArrow.exists()).toBe(true);
    expect(rightArrow.exists()).toBe(true);
    
    // We can't easily test the scroll logic because Element.scrollTo is not implemented in JSDOM
    // and we mocked the scroll container via ref, but the ref update in test environment is tricky.
    // But we can ensure the structure is correct.
  });
});

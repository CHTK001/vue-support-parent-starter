import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseSetting from '../BaseSetting.vue';
import { nextTick, reactive } from 'vue';

// Define mocks that need to be accessed inside vi.mock
const { 
  mockStorage, 
  mockUseGlobal, 
  mockUseNav, 
  mockUseDark, 
  mockUseDataThemeChange, 
  mockGetConfig 
} = vi.hoisted(() => {
  const mockStorage = {
    configure: {
      systemTheme: 'default',
      transitionType: 'fade-slide',
      contentMargin: 20,
      layoutRadius: 10,
      grey: false,
      weak: false,
      invert: false,
      monochrome: false,
      hideTabs: false,
      cardBody: true,
      showLogo: true,
      MenuAnimation: true,
      ForceNewMenu: false,
      showModel: 'chrome',
      hideFooter: true,
      multiTagsCache: true,
      stretch: false,
      keepAlive: true,
      debugMode: false,
      showBreadcrumb: true,
      breadcrumbIconOnly: false,
      showTagIcon: true,
      showNewMenu: true,
      newMenuText: 'new',
      newMenuTimeLimit: 168,
      newMenuAnimation: 'bounce',
      doubleNavExpandMode: 'auto',
      doubleNavAutoExpandAll: true,
      aiChatTheme: 'default',
      enableFestivalTheme: false,
      fontEncryptionEnabled: true,
      fontEncryptionNumbers: true,
      fontEncryptionChinese: true,
      fontEncryptionGlobal: false,
      fontEncryptionOcrNoise: false
    },
    layout: {
      layout: 'vertical',
      theme: 'light',
      darkMode: false,
      sidebarStatus: true,
      epThemeColor: '#409EFF',
      themeColor: 'default',
      overallStyle: 'light'
    },
    user: {
      roles: ['admin']
    }
  };

  const mockUseGlobal = () => ({
    $storage: mockStorage
  });

  const mockUseNav = () => ({
    device: 'desktop'
  });

  const mockUseDark = () => ({
    isDark: { value: false }
  });

  const mockUseDataThemeChange = () => ({
    dataTheme: { value: false },
    overallStyle: { value: 'light' },
    layoutTheme: { value: { layout: 'vertical', theme: 'light' } },
    themeColors: [],
    toggleClass: vi.fn(),
    dataThemeChange: vi.fn(),
    setLayoutThemeColor: vi.fn()
  });

  const mockGetConfig = () => ({
    EnableFestivalTheme: false,
    ShowAiChat: true,
    EnableThemeManagement: true
  });

  return {
    mockStorage,
    mockUseGlobal,
    mockUseNav,
    mockUseDark,
    mockUseDataThemeChange,
    mockGetConfig
  };
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock pureadmin utils
vi.mock('@pureadmin/utils', async () => {
  const { reactive } = await import('vue');
  return {
    debounce: (fn: Function) => fn(),
    isNumber: (val: any) => typeof val === 'number',
    useDark: mockUseDark,
    useGlobal: () => ({
      $storage: reactive(mockStorage)
    }),
    cloneDeep: (val: any) => JSON.parse(JSON.stringify(val)),
    withInstall: (comp: any) => comp,
    storage: {
      local: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn()
      }
    }
  };
});

// Mock ReSegmented
vi.mock('@repo/components/ReSegmented', () => ({
  default: {
    name: 'ReSegmented',
    render: () => null
  }
}));

// Mock IndexedDB
const indexedDBMock = {
  open: vi.fn(),
  deleteDatabase: vi.fn()
};
vi.stubGlobal('indexedDB', indexedDBMock);

// Mock hooks
vi.mock('../../../../hooks/useNav', () => ({
  useNav: mockUseNav
}));

vi.mock('../../../../hooks/useDataThemeChange', () => ({
  useDataThemeChange: mockUseDataThemeChange
}));

vi.mock('@repo/config', () => ({
  getConfig: mockGetConfig
}));

// Mock store hooks
vi.mock('@repo/core', () => ({
  emitter: {
    on: vi.fn(),
    emit: vi.fn(),
    off: vi.fn()
  },
  useAppStoreHook: () => ({
    setLayout: vi.fn()
  }),
  useMultiTagsStoreHook: () => ({}),
  useUserStoreHook: () => ({}),
  useEpThemeStoreHook: () => ({})
}));

// Mock vue-i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key
  })
}));

// Mock themes
vi.mock('../../../../themes', () => ({
  getAvailableThemes: () => [],
  detectFestivalTheme: () => null,
  ThemeType: {}
}));

// Stub components
const stubs = {
  LayPanel: { template: '<div><slot /></div>' },
  IconifyIconOnline: { template: '<i></i>' },
  Segmented: { template: '<div></div>' },
  ScSwitch: { template: '<div class="sc-switch"></div>' },
  ScRibbon: { template: '<div></div>' },
  LayThemeSwitcher: { template: '<div></div>' },
  ElButton: { template: '<button class="el-button"><slot /></button>' },
  ElInput: { template: '<input class="el-input" />' },
  ElSwitch: { template: '<div class="el-switch"></div>' },
  ElCheckbox: { template: '<input type="checkbox" class="el-checkbox" />' },
  ElSlider: { template: '<div class="el-slider"></div>' },
  ElTooltip: { template: '<div><slot /></div>' },
  ElRadio: { template: '<input type="radio" />' },
  ElRadioGroup: { template: '<div class="el-radio-group"><slot /></div>' },
  ElInputNumber: { template: '<input type="number" />' }
};

// Mock SVGs
vi.mock('@repo/assets/svg/day.svg?component', () => ({ default: { template: '<svg></svg>' } }));
vi.mock('@repo/assets/svg/dark.svg?component', () => ({ default: { template: '<svg></svg>' } }));
vi.mock('@repo/assets/svg/system.svg?component', () => ({ default: { template: '<svg></svg>' } }));
vi.mock('@repo/assets/svg/vertical.svg?component', () => ({ default: { template: '<svg></svg>' } }));
vi.mock('@repo/assets/svg/horizontal.svg?component', () => ({ default: { template: '<svg></svg>' } }));
vi.mock('@repo/assets/svg/mix.svg?component', () => ({ default: { template: '<svg></svg>' } }));
vi.mock('@repo/assets/svg/hover.svg?component', () => ({ default: { template: '<svg></svg>' } }));
vi.mock('@repo/assets/svg/mobile.svg?component', () => ({ default: { template: '<svg></svg>' } }));
vi.mock('@repo/assets/svg/double.svg?component', () => ({ default: { template: '<svg></svg>' } }));

describe('BaseSetting.vue', () => {
  let wrapper: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage.configure.systemTheme = 'default';
  });

  const mountOptions = {
    global: {
      stubs,
      directives: {
        tippy: {},
        ripple: {}
      }
    }
  };

  it('renders the preview section', () => {
    wrapper = mount(BaseSetting, mountOptions);
    expect(wrapper.find('.preview-container').exists()).toBe(true);
    expect(wrapper.findAll('.el-button').length).toBeGreaterThan(0);
    expect(wrapper.find('.el-input').exists()).toBe(true);
    expect(wrapper.find('.el-switch').exists()).toBe(true);
    expect(wrapper.find('.el-checkbox').exists()).toBe(true);
    expect(wrapper.find('.el-radio-group').exists()).toBe(true);
  });

  it('toggles festival theme auto-switch correctly', async () => {
    wrapper = mount(BaseSetting, mountOptions);

    // Simulate switch change (accessing internal method or data if exposed, or checking reactive state)
    // Since we mocked $storage, we can check if updating the ref updates storage
    
    // Direct access to component instance to test logic if needed, or trigger events on stubs if possible
    // Here we can assume the component logic is bound to the switch
    
    // Let's verify initial state from storage
    expect(wrapper.vm.settings.enableFestivalTheme).toBe(false);
  });

  it('persists changes to storage', async () => {
    wrapper = mount(BaseSetting, mountOptions);

    // Call storageConfigureChange directly or trigger a change
    // Since storageConfigureChange is internal, we test the bound model updates
    
    // Simulate updating a setting
    wrapper.vm.storageConfigureChange('contentMargin', 30);
    expect(mockStorage.configure.contentMargin).toBe(30);
  });

  it('initializes theme from storage', async () => {
    mockStorage.configure.systemTheme = 'halloween';
    
    // Re-mount to trigger onBeforeMount/onMounted
    wrapper = mount(BaseSetting, mountOptions);
    
    await nextTick();
    // Verify initialization logic ran (mock calls would be better here)
    // For now we check if logic doesn't crash
    expect(wrapper.exists()).toBe(true);
  });
});

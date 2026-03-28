import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { shallowMount } from "@vue/test-utils";
import { getInitialConfig, putConfig } from "@repo/config";
import BaseTool from "../BaseTool.vue";

vi.mock("../../../../hooks/useNav", () => ({
  useNav: () => ({
    onPanel: vi.fn(),
  }),
}));

vi.mock("../../../../hooks/useTranslationLang", () => ({
  useTranslationLang: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@pureadmin/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@pureadmin/utils")>();
  return {
    ...actual,
    useGlobal: () => ({
      $storage: {
        configure: {},
      },
    }),
  };
});

vi.mock("@repo/core", () => ({
  emitter: {
    on: vi.fn(),
    off: vi.fn(),
  },
}));

vi.mock("@vueuse/core", () => ({
  useDraggable: () => ({
    style: {},
  }),
}));

vi.mock("../../lay-ai-chat/services/webLlmDownloadState", () => ({
  webLlmDownloadState: {
    downloading: false,
    progress: 0,
    fileName: "",
    text: "",
    speed: "",
  },
}));

vi.mock("../../lay-search/index.vue", () => ({
  default: {
    name: "LaySearch",
    template: "<div><slot /></div>",
  },
}));

vi.mock("../../lay-message/index.vue", () => ({
  default: {
    name: "LayMessage",
    template: "<div><slot /></div>",
  },
}));

vi.mock("../../lay-sidebar/components/SidebarFullScreen.vue", () => ({
  default: {
    name: "LaySidebarFullScreen",
    template: "<div><slot /></div>",
  },
}));

vi.mock("../dropdowns/LangDropdown.vue", () => ({
  default: {
    name: "LangDropdown",
    template: "<div><slot /></div>",
  },
}));

vi.mock("../dropdowns/UserDropdown.vue", () => ({
  default: {
    name: "UserDropdown",
    template: "<div><slot /></div>",
  },
}));

vi.mock("../HeaderClock.vue", () => ({
  default: {
    name: "HeaderClock",
    template: "<div class='header-clock-stub' />",
  },
}));

vi.mock("../components/ToolItem.vue", () => ({
  default: {
    name: "ToolItem",
    template: "<div><slot /></div>",
  },
}));

const cloneConfigValue = <T>(value: T): T =>
  value == null ? value : JSON.parse(JSON.stringify(value));

const setPageBehavior = (patch: Record<string, unknown>) => {
  putConfig("PageBehavior", {
    ...(cloneConfigValue(getInitialConfig("PageBehavior")) ?? {}),
    ...patch,
  });
};

const mountBaseTool = () =>
  shallowMount(BaseTool, {
    global: {
      stubs: {
        Teleport: true,
        IconifyIconOnline: true,
        IconifyIconOffline: true,
        ScText: true,
      },
      directives: {
        menu: () => undefined,
      },
    },
  });

describe("BaseTool runtime config", () => {
  afterEach(() => {
    putConfig("ShowBarSearch", getInitialConfig("ShowBarSearch"));
    putConfig("ShowLanguage", getInitialConfig("ShowLanguage"));
    putConfig("ShowBarSetting", getInitialConfig("ShowBarSetting"));
    putConfig("PageBehavior", cloneConfigValue(getInitialConfig("PageBehavior")));
  });

  it("reacts to ShowBarSearch updates when no local override is set", async () => {
    putConfig("ShowBarSearch", true);

    const wrapper = mountBaseTool();

    expect(wrapper.find("#header-search").exists()).toBe(true);

    putConfig("ShowBarSearch", false);
    await nextTick();

    expect(wrapper.find("#header-search").exists()).toBe(false);
  });

  it("reacts to PageBehavior.showHeaderClock updates when no local override is set", async () => {
    setPageBehavior({ showHeaderClock: true });

    const wrapper = mountBaseTool();

    expect(wrapper.find(".header-clock").exists()).toBe(true);

    setPageBehavior({ showHeaderClock: false });
    await nextTick();

    expect(wrapper.find(".header-clock").exists()).toBe(false);
  });
});

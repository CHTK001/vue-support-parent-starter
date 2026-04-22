import { afterEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import { resetOverlayStack } from "../../components/lay-overlay-stack/service";
import { resetStandaloneOverlayHostForTest } from "../ensureStandaloneOverlayHost";

vi.mock("@repo/core", () => ({
  SocketTemplateKey: Symbol("SocketTemplateKey"),
  createNamedSocketService: vi.fn(() => null),
  getGlobalSocketConfig: vi.fn(() => ({ urls: [], protocol: "ws", context: "" })),
  getGlobalSocketService: vi.fn(() => null),
}));

vi.mock("@repo/utils", () => ({
  message: vi.fn(),
}));

describe("resolveRuntimeProviders fallback host", () => {
  afterEach(() => {
    resetOverlayStack();
    resetStandaloneOverlayHostForTest();
  });

  it("mounts standalone overlay host when lay-xx task provider is missing", async () => {
    const { resolveRuntimeProviders } = await import("../resolveRuntimeProviders");

    const Probe = defineComponent({
      setup() {
        resolveRuntimeProviders({
          module: "runtime-provider-test",
          log: false,
        });
        return () => h("div", "probe");
      },
    });

    mount(Probe);

    expect(document.getElementById("sc-standalone-overlay-host")).toBeTruthy();
  });
});

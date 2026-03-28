import { computed, nextTick } from "vue";
import { afterEach, describe, expect, it } from "vitest";
import { getConfig, getInitialConfig, putConfig } from "../src/config";

const restoreRuntimeConfig = () => {
  putConfig("Title", getInitialConfig("Title"));
  putConfig("RemoteLayout", getInitialConfig("RemoteLayout"));
  putConfig("LocationLayout", getInitialConfig("LocationLayout"));
};

describe("runtime config reactivity", () => {
  afterEach(() => {
    restoreRuntimeConfig();
  });

  it("keeps computed readers in sync when scalar config changes", async () => {
    const title = computed(() => getConfig().Title);
    const nextTitle = "Monitor Hot Reload Title";

    putConfig("Title", nextTitle);
    await nextTick();

    expect(title.value).toBe(nextTitle);
  });

  it("re-evaluates layout availability when runtime layout flags change", async () => {
    const hasLayout = computed(
      () => !!(getConfig().RemoteLayout || getConfig().LocationLayout),
    );

    putConfig("RemoteLayout", false);
    putConfig("LocationLayout", false);
    await nextTick();
    expect(hasLayout.value).toBe(false);

    putConfig("RemoteLayout", true);
    await nextTick();
    expect(hasLayout.value).toBe(true);
  });
});

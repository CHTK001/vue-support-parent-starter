import { computed, ref } from "vue";
import { describe, expect, it } from "vitest";
import { normalizeSegmentedOptions } from "../../components/ReSegmented/src/normalize";

describe("ReSegmented options normalization", () => {
  it("unwraps computed options", () => {
    expect(
      normalizeSegmentedOptions(
        computed(() => [
          { label: "浅色", value: "light" },
          { label: "深色", value: "dark" },
        ]),
      ),
    ).toEqual([
      { label: "浅色", value: "light" },
      { label: "深色", value: "dark" },
    ]);
  });

  it("unwraps ref options and guards invalid values", () => {
    expect(
      normalizeSegmentedOptions(
        ref([
          { label: "固定", value: "fixed" },
          { label: "自定义", value: "custom" },
        ]),
      ),
    ).toEqual([
      { label: "固定", value: "fixed" },
      { label: "自定义", value: "custom" },
    ]);
    expect(normalizeSegmentedOptions({ options: [] })).toEqual([]);
  });
});

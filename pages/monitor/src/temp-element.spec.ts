import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";

const RootIsFigure = defineComponent({
  name: "RootIsFigure",
  template: `<div class="re-empty__figure"><span>hi</span></div>`,
});

const Wrapped = defineComponent({
  name: "Wrapped",
  template: `<div class="re-empty"><div class="re-empty__figure"><span>hi</span></div></div>`,
});

describe("wrapper.element experiment", () => {
  it("root is the class", async () => {
    const wrapper = mount(RootIsFigure);
    console.log("ROOT-EL outerHTML:", wrapper.element.outerHTML);
    console.log("ROOT-EL class:", wrapper.element.className);
    console.log("querySelector self:", wrapper.element.querySelector(".re-empty__figure"));
  });

  it("root is a wrapper", async () => {
    const wrapper = mount(Wrapped);
    console.log("ROOT-EL outerHTML:", wrapper.element.outerHTML);
    console.log("querySelector self:", wrapper.element.querySelector(".re-empty__figure"));
    console.log("find:", wrapper.find(".re-empty__figure").exists());
  });
});

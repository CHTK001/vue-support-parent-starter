import Draggabilly from "draggabilly";
import type { Directive } from "vue";

export const draggable: Directive = {
  mounted(el, binding) {
    debugger;
    new Draggabilly(el, binding.value);
  }
};

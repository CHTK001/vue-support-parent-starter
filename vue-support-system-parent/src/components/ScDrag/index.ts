import Draggabilly from "draggabilly";
export default {
  bind(el, binding) {
    debugger;
    new Draggabilly(el, binding.value);
  }
};

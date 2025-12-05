import type { El } from "typeit/dist/types";
import TypeIt, { type Options as TypeItOptions } from "typeit";
import { type PropType, ref, defineComponent, onMounted, onUnmounted, watch } from "vue";

/**
 * 打字机效果组件
 * 配置项详情请查阅 https://www.typeitjs.com/docs/vanilla/usage#options
 * @author CH
 * @version 1.0.1
 * @since 2025-12-02
 * @since 2025-12-05 修复循环播放问题，添加实例销毁逻辑
 */
export default defineComponent({
  name: "TypeIt",
  props: {
    options: {
      type: Object as PropType<TypeItOptions>,
      default: () => ({}) as TypeItOptions
    }
  },
  setup(props, { slots, expose }) {
    /**
     * 输出错误信息
     * @param message 错误信息
     */
    function throwError(message: string) {
      throw new TypeError(message);
    }

    /**
     * 获取浏览器默认语言
     */
    function getBrowserLanguage() {
      return navigator.language;
    }

    const typedItRef = ref<Element | null>(null);
    let typeItInstance: TypeIt | null = null;

    /**
     * 初始化 TypeIt 实例
     */
    function initTypeIt() {
      // 先销毁旧实例
      destroyTypeIt();

      const $typed = typedItRef.value?.querySelector(".type-it") as El;

      if (!$typed) {
        const errorMsg =
          getBrowserLanguage() === "zh-CN"
            ? "请确保有且只有一个具有class属性为 'type-it' 的元素"
            : "Please make sure that there is only one element with a Class attribute with 'type-it'";
        throwError(errorMsg);
        return;
      }

      // 清空元素内容
      $typed.innerHTML = "";

      // 创建新实例，确保 loop 选项正确传递
      typeItInstance = new TypeIt($typed, {
        ...props.options,
        loop: props.options.loop ?? false
      }).go();
    }

    /**
     * 销毁 TypeIt 实例
     */
    function destroyTypeIt() {
      if (typeItInstance) {
        typeItInstance.destroy();
        typeItInstance = null;
      }
    }

    /**
     * 重置并重新播放
     */
    function reset() {
      initTypeIt();
    }

    onMounted(() => {
      initTypeIt();
    });

    onUnmounted(() => {
      destroyTypeIt();
    });

    // 监听 options 变化，重新初始化
    watch(
      () => props.options,
      () => {
        initTypeIt();
      },
      { deep: true }
    );

    expose({
      typeIt: typeItInstance,
      reset,
      destroy: destroyTypeIt
    });

    return () => (
      <div ref={typedItRef}>
        {slots.default?.() ?? <span class="type-it"></span>}
      </div>
    );
  }
});

<script>
import {defineComponent} from "vue";

export default defineComponent({
  name: "Auth",
  props: {
    value: {
      type: undefined,
      default: []
    }
  }
  // setup(props, { slots }) {
  //   return () => {
  //     if (!slots) return null;
  //     return hasAuth(props.value) ? <Fragment>{slots.default?.()}</Fragment> : null;
  //   };
  // }
});
</script>
<template>
  <div>
    <div v-if="hasAuth(value)">
      <Fragment>
        <slot name="default" />
      </Fragment>
    </div>
  </div>
</template>
;

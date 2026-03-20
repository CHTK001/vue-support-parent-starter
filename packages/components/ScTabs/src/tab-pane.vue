<template>
  <el-tab-pane :label="label" :name="name" :disabled="disabled" :lazy="lazy" :closable="closable">
    <template v-if="$slots.default" #default>
      <slot />
    </template>
    <template v-if="$slots.label" #label>
      <slot name="label" />
    </template>
  </el-tab-pane>
</template>

<script setup lang="ts">
import type { PropType } from "vue";

defineProps({
  label: { type: String, default: "" },
  name: { type: [String, Number], default: "" },
  disabled: { type: Boolean, default: false },
  lazy: { type: Boolean, default: false },
  closable: { type: Boolean, default: false }
});
</script>

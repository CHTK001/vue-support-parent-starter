<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
const props = defineProps({
  tips: {
    type: String,
    default: ""
  },
  trigger: {
    type: String,
    default: "hover"
  },
  placement: {
    type: String,
    default: "top"
  }
});
</script>
<template>
  <div>
    <el-form-item v-bind="$attrs" v-on="$listeners">
      <template #label="{ label }">
        <span>{{ label }}</span>
        <el-tooltip v-if="props.tips" :trigger="props.trigger" :placement="props.placement" :content="props.tips">
          <el-icon class="tooltip">
            <component :is="useRenderIcon('ep:question-filled')" />
          </el-icon>
        </el-tooltip>
      </template>
      <slot />
    </el-form-item>
  </div>
</template>
<style scoped>
.tooltip {
  padding-top: 1em;
}
</style>

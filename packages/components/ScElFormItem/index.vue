<script setup>
import { defineProps } from "vue";

const props = defineProps({
  label: {
    type: String,
    default: "label",
  },
  value: {
    type: String,
    default: "value",
  },
  labelPosition: {
    type: Enum,
    default: "left"
  },
  labelWidth: {
    type: String | Number,
    default: "100px"
  },
  required: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: false
  },
  showMessage: {
    type: Boolean,
    default: true
  },
  inlineMessage: {
    type: String | Boolean,
    default: ""
  },
  size: {
    type: Enum,
    default: "medium"
  }
});
</script>
<template>
  <div>
    <el-form-item :label="props.label" 
        :prop="props.prop" 
        :label-position="props.labelPosition" 
        :label-width="props.labelWidth" 
        :required="props.required" 
        :error="props.error" 
        :size="props.size"
        :inline-message="props.inlineMessage"
        :show-message="props.showMessage">
      
        <template #default>
          <slot name="default"></slot>
        </template>
      
        <template #label>
          <slot name="label" :label="label"></slot>
        </template>
      
        <template #error>
          <slot name="error" :error="error"></slot>
        </template>
    </el-form-item>
  </div>
</template>
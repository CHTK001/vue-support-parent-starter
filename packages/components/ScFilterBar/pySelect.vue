<template>
  <el-select v-bind="$attrs" :filter-method="filterMethod" @visible-change="visibleChange">
    <el-option v-for="field in optionsList" :key="field.value" :label="field.label" :value="field" :disabled="isDisabled(field.value)" />
  </el-select>
</template>

<script>
import { pinyin } from "pinyin-pro";

export default {
  props: {
    options: { type: Array, default: () => [] },
    filter: { type: Array, default: () => [] }
  },
  data() {
    return {
      optionsList: [],
      optionsList_: []
    };
  },
  mounted() {
    this.optionsList = this.options;
    this.optionsList_ = [...this.options];
  },
  methods: {
    filterMethod(keyword) {
      if (keyword) {
        this.optionsList = this.optionsList_;
        this.optionsList = this.optionsList.filter(item => pinyin.match(item.label, keyword));
      } else {
        this.optionsList = this.optionsList_;
      }
    },
    visibleChange(isopen) {
      if (isopen) {
        this.optionsList = this.optionsList_;
      }
    },
    isDisabled(key) {
      if (this.filter.find(item => item.field.value == key && !item.field.repeat)) {
        return true;
      } else {
        return false;
      }
    }
  }
};
</script>

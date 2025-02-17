<script>
import { defineComponent, defineProps, shallowRef, watch } from "vue";
import { InputType} from "./types/index";
import { useI18n } from "vue-i18n";
import { message, queryEmail } from "@repo/utils";
import { fetchListDictItem, fetchSetting, fetchUpdateBatchSetting } from "@repo/core";

export default {
  props: {
     inputType:  {
      type: InputType,
      default: InputType.TEXT
    },
    dictId: {
      type :String,
      default: ""
    },
    dictOptionName: {
      type :String,
      default: "sysDictItemName"
    },
    dictOptionId: {
      type :String,
      default: "sysDictItemCode"
    }
  },
  data() {
    return {
      dictList: [],
      _inputType: InputType.TEXT
    }
  },
  watch: {
    inputType: {
      handler(newValue) {
        this._inputType = newValue;
      },
      immediate: true
    }
  },
  methods: {
    queryEmail,
    async queryDict(value) {
      if (this.props.onChange) {
        this.props.onChange(value);
      }
      if (this.props.dictId) {
        const { data } = await fetchListDictItem({
          sysDictId: this.props.dictId,
          sysDictItemCode: value,
        })
      }
    }
  }
}
</script>
<template>
  <div class="sc-input">
     <div>
      <slot name="prepend" />
    </div>
    <div>
      <el-input class="sc-input-item" v-bind="$attrs" v-on="$emit" v-if="_inputType === 'TextArea'" type="textarea" clearable />
      <el-input-number class="sc-input-item" v-bind="$attrs" v-on="$emit" v-else-if="_inputType === 'Number'" />
      <el-autocomplete class="sc-input-item" v-bind="$attrs" v-on="$emit" v-else-if="_inputType === 'Mail'" :fetch-suggestions="queryEmail" :trigger-on-focus="false" clearable />
      <el-input class="sc-input-item" v-bind="$attrs" v-on="$emit" v-else-if="_inputType === 'Password'" type="password" show-password />
      <el-color-picker class="sc-input-item" v-bind="$attrs" v-on="$emit"  v-else-if="_inputType === 'Color'" show-alpha />
      <el-select class="sc-input-item"  v-bind="$attrs" v-on="$emit"  v-else-if="_inputType === 'Dict'" :remote="true" :remote-method="queryDict" >
         <el-option v-for="(option, $index) in dictList" :key="$index" :label="option[props.dictOptionName]" :value="option[props.dictOptionId]" />
      </el-select>
      <el-segmented class="sc-input-item" v-else-if="_inputType == 'Boolean'"
          v-bind="$attrs" v-on="$emit"
            :options="[
              { label: $t('buttons.open'), value: true },
              { label: $t('buttons.close'), value: false }]"
          />
      <el-input class="sc-input-item" v-bind="$attrs" v-on="$emit" v-else clearable/>
    </div>

  </div>
   <div>
      <slot name="append" />
    </div>
</template>
<style scoped lang="scss">
.sc-input {
  height:100%; 
  width: 100%; 
  color: var(--el-color-info);
  position: relative;
  display: inline-flex;
  align-items: center;
  min-height: 100%;
  border-radius: var(--el-input-border-radius);
  padding: 0 20px;
  white-space: nowrap;
  .sc-input-item {
    height: var(--el-input-height);
    line-height: var(--el-input-height);
  }
  div {
    height: 100%;
  }
  :deep(.el-select) {
    height: 100%;
  }
}
</style>
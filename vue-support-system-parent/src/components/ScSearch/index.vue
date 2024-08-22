<script>
import ArrowDown from "@iconify-icons/ep/arrow-down";
import ArrowUp from "@iconify-icons/ep/arrow-up";
import Search from "@iconify-icons/ep/search";
import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Info from "@iconify-icons/ep/info-filled";
import Refresh from "@iconify-icons/line-md/backup-restore";
import Edit from "@iconify-icons/line-md/plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useI18n } from "vue-i18n";
import Segmented from "@/components/ReSegmented";

export default {
  name: "ScSearch",
  components: { Segmented },
  props: {
    showNumber: {
      type: Number,
      default: 2
    },
    columns: {
      type: Array,
      default() {
        return [];
      }
    },
    onSearch: {
      type: Function,
      default() {
        return () => {};
      }
    },
    onReset: {
      type: Function,
      default() {
        return () => {};
      }
    },
    onEdit: {
      type: Function,
      default() {
        return () => {};
      }
    }
  },
  data() {
    return {
      form: {},
      showNumberValue: 2,
      t: null,
      icon: {
        ArrowUp: null,
        ArrowDown: null,
        Refresh: null,
        Search: null,
        Edit: null,
        Info: null
      },
      visible: {
        query: false
      },
      loading: {
        query: false
      }
    };
  },
  mounted() {
    const { t } = useI18n();
    this.t = t;
    this.showNumberValue = this.showNumber;
    this.icon.ArrowUp = useRenderIcon(ArrowUp);
    this.icon.ArrowDown = useRenderIcon(ArrowDown);
    this.icon.Refresh = useRenderIcon(Refresh);
    this.icon.Info = useRenderIcon(Info);
    this.icon.Search = useRenderIcon(Search);
    this.icon.Edit = useRenderIcon(Edit);
  },
  methods: {
    useRenderIconValue(value) {
      return useRenderIcon(value);
    }
  }
};
</script>

<template>
  <div class="left-panel">
    <el-form
      ref="formRef"
      :inline="true"
      :model="form"
      class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px] overflow-auto"
    >
      <span v-for="(item, $index) in columns" :key="item.prop">
        <el-form-item
          v-if="$index < showNumberValue"
          :key="item.prop"
          :label="item.label"
          :prop="item.prop"
        >
          <template #label="{ label }">
            <span class="flex items-center relative">
              <span>{{ label }} </span>
              <span class="ml-[4px]">
                <el-tooltip v-if="item.tooltip" :content="item.tooltip">
                  <component :is="useRenderIconValue(icon.Info)" />
                </el-tooltip>
              </span>
            </span>
          </template>
          <el-input
            v-if="!item.type || item.type === 'input'"
            v-model="form[item.prop]"
            :placeholder="item.placeholder"
            :clearable="item.clearable"
            class="!w-[180px]"
          />
          <el-input
            v-else-if="item.type === 'textarea'"
            v-model="form[item.prop]"
            :placeholder="item.placeholder"
            :clearable="item.clearable"
            type="textarea"
            class="!w-[180px]"
          />
          <el-date-picker
            v-else-if="item.type === 'datepicker'"
            v-model="form[item.prop]"
            type="date"
            :placeholder="item.placeholder"
            :clearable="item.clearable"
            :value-format="item.valueFormat"
            class="!w-[180px]"
          />
          <el-radio-group
            v-else-if="item.type === 'radio'"
            v-model="form[item.prop]"
            :placeholder="item.placeholder"
            :clearable="item.clearable"
            class="!w-[180px]"
          >
            <el-radio-button
              v-for="it in item?.children || []"
              :key="it.value"
              :value="it.value"
              :label="it.label"
          /></el-radio-group>

          <Segmented
            v-else-if="item.type === 'segmented'"
            v-model="form[item.prop]"
            :options="item.children"
          />

          <el-select
            v-else-if="item.type === 'select'"
            v-model="form[item.prop]"
            :placeholder="item.placeholder"
            :clearable="item.clearable"
            class="!w-[180px]"
          >
            <el-option
              v-for="it in item?.children || []"
              :key="it.value"
              :value="it.value"
              :label="it.label"
          /></el-select>

          <el-input-number
            v-else-if="item.type === 'number'"
            v-model="form[item.prop]"
            :placeholder="item.placeholder"
            :clearable="item.clearable"
            :min="item.min"
            :max="item.max"
            class="!w-[180px]"
          />
        </el-form-item>
      </span>
    </el-form>
  </div>
  <div class="right-panel">
    <div class="right-panel-search">
      <el-button
        type="primary"
        :icon="icon.Search"
        :loading="loading.query"
        @click="onSearch(form)"
      />
      <el-button :icon="icon.Refresh" @click="onReset()" />
      <!-- <el-button :icon="Edit" @click="dialogOpen({}, 'save')" /> -->
      <el-button :icon="icon.Edit" @click="onEdit({}, 'save')" />
      <el-button
        v-if="!visible.query"
        :icon="icon.ArrowDown"
        plain
        text
        @click="
          showNumberValue = 99999;
          visible.query = true;
        "
        >展开</el-button
      >
      <el-button
        v-else
        :icon="icon.ArrowUp"
        plain
        text
        @click="
          showNumberValue = showNumber;
          visible.query = false;
        "
        >收起</el-button
      >
    </div>
  </div>
</template>

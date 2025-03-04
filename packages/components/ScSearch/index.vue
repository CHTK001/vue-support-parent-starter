<script>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import Segmented from "@repo/components/ReSegmented";
import ArrowDown from "@iconify-icons/ep/arrow-down";
import ArrowUp from "@iconify-icons/ep/arrow-up";
import Info from "@iconify-icons/ep/info-filled";
import Search from "@iconify-icons/ep/search";
import Refresh from "@iconify-icons/line-md/backup-restore";
import Edit from "@iconify-icons/line-md/plus";
import { markRaw } from "vue";
import { useI18n } from "vue-i18n";

export default {
  name: "ScSearch",
  components: { Segmented },
  props: {
    showNumber: {
      type: Number,
      default: 4
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
      showNumberValue: 4,
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
    this.icon.ArrowUp = markRaw(ArrowUp);
    this.icon.ArrowDown = markRaw(ArrowDown);
    this.icon.Refresh = markRaw(Refresh);
    this.icon.Info = markRaw(Info);
    this.icon.Search = markRaw(Search);
    this.icon.Edit = markRaw(Edit);
  },
  methods: {
    useRenderIcon,
    markRaw,
    onReset() {
      this.$nextTick(() => {
        this.$refs.formRef.resetFields();
        this.onSearch(this.form);
      });
    }
  }
};
</script>

<template>
  <div class="w-full">
    <el-form ref="formRef" :inline="true" :model="form" class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px]">
      <el-row :gutter="12">
        <el-col v-for="(item, $index) in columns" :key="item.prop" :md="12" :lg="6">
          <span v-if="item.isAdmin" v-admin>
            <el-form-item v-if="$index < showNumberValue" :key="item.prop" :label="item.label" :prop="item.prop" class="w-full">
              <template #label="{ label }">
                <span class="flex items-center relative">
                  <span>{{ label }}</span>
                  <span class="ml-[4px]">
                    <el-tooltip v-if="item.tooltip" :content="item.tooltip">
                      <component :is="useRenderIcon(icon.Info)" />
                    </el-tooltip>
                    <span v-else class="ml-3.5" />
                  </span>
                </span>
              </template>
              <el-input v-if="!item.type || item.type === 'input'" v-model="form[item.prop]" :placeholder="item.placeholder" :clearable="item.clearable" />
              <el-input v-else-if="item.type === 'textarea'" v-model="form[item.prop]" :placeholder="item.placeholder" :clearable="item.clearable" type="textarea" />
              <el-date-picker
                v-else-if="item.type === 'datepicker'"
                v-model="form[item.prop]"
                type="date"
                :placeholder="item.placeholder"
                :clearable="item.clearable"
                :value-format="item.valueFormat"
              />
              <el-radio-group v-else-if="item.type === 'radio'" v-model="form[item.prop]" :placeholder="item.placeholder" :clearable="item.clearable">
                <el-radio-button v-for="it in item?.children || []" :key="it.value" :value="it.value" :label="it.label" />
              </el-radio-group>

              <Segmented v-else-if="item.type === 'segmented'" v-model="form[item.prop]" :options="item.children" />

              <el-select v-else-if="item.type === 'select'" v-model="form[item.prop]" :placeholder="item.placeholder" :clearable="item.clearable" class="w-full">
                <el-option v-for="it in item?.children || []" :key="it.value" :value="it.value" :label="it.label" />
              </el-select>

              <el-input-number v-else-if="item.type === 'number'" v-model="form[item.prop]" :placeholder="item.placeholder" :clearable="item.clearable" :min="item.min" :max="item.max" />
              <slot />
            </el-form-item>
          </span>
          <span v-else>
            <el-form-item v-if="$index < showNumberValue" :key="item.prop" :label="item.label" :prop="item.prop" class="w-full">
              <template #label="{ label }">
                <span class="flex items-center relative">
                  <span>{{ label }}</span>
                  <span class="ml-[4px]">
                    <el-tooltip v-if="item.tooltip" :content="item.tooltip">
                      <el-icon>
                        <component :is="icon.Info" />
                      </el-icon>
                    </el-tooltip>
                    <span v-else class="ml-3.5" />
                  </span>
                </span>
              </template>
              <el-input v-if="!item.type || item.type === 'input'" v-model="form[item.prop]" :placeholder="item.placeholder" :clearable="item.clearable" />
              <el-input v-else-if="item.type === 'textarea'" v-model="form[item.prop]" :placeholder="item.placeholder" :clearable="item.clearable" type="textarea" />
              <el-date-picker
                v-else-if="item.type === 'datepicker'"
                v-model="form[item.prop]"
                type="date"
                :placeholder="item.placeholder"
                :clearable="item.clearable"
                :value-format="item.valueFormat"
              />
              <el-radio-group v-else-if="item.type === 'radio'" v-model="form[item.prop]" :placeholder="item.placeholder" :clearable="item.clearable">
                <el-radio-button v-for="it in item?.children || []" :key="it.value" :value="it.value" :label="it.label" />
              </el-radio-group>

              <Segmented v-else-if="item.type === 'segmented'" v-model="form[item.prop]" :options="item.children" />

              <el-select v-else-if="item.type === 'select'" v-model="form[item.prop]" :placeholder="item.placeholder" :clearable="item.clearable" class="w-full">
                <el-option v-for="it in item?.children || []" :key="it.value" :value="it.value" :label="it.label" />
              </el-select>

              <el-input-number v-else-if="item.type === 'number'" v-model="form[item.prop]" :placeholder="item.placeholder" :clearable="item.clearable" :min="item.min" :max="item.max" />
              <slot />
            </el-form-item>
          </span>
        </el-col>
        <div class="flex-1">
          <div>
            <div class="flex flex-wrap flex-row">
              <div class="flex-1" />
              <div class="flex flex-row flex-1 justify-end">
                <el-button
                  v-if="!visible.query && columns.length > showNumber"
                  :icon="useRenderIcon(icon.ArrowDown)"
                  plain
                  text
                  @click="
                    showNumberValue = 99999;
                    visible.query = true;
                  "
                >
                  展开
                </el-button>
                <el-button
                  v-else-if="columns.length > showNumber"
                  :icon="useRenderIcon(icon.ArrowUp)"
                  plain
                  text
                  @click="
                    showNumberValue = showNumber;
                    visible.query = false;
                  "
                >
                  收起
                </el-button>
                <el-button type="primary" :icon="useRenderIcon(icon.Search)" :loading="loading.query" @click="onSearch(form)" />
                <el-button v-if="columns.length > 0" :icon="useRenderIcon(icon.Refresh)" @click="onReset()" />
                <!-- <el-button :icon="Edit" @click="dialogOpen({}, 'save')" /> -->
                <el-button :icon="useRenderIcon(icon.Edit)" @click="onEdit({}, 'save')" />
              </div>
            </div>
          </div>
        </div>
      </el-row>
    </el-form>
  </div>
</template>

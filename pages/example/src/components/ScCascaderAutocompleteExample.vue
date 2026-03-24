<template>
  <div class="sc-cascader-autocomplete-example">
    <DemoBlock title="级联选择器" :code="codes.cascader">
      <div class="demo-row">
        <ScCascader
          v-model="cascaderValue"
          :options="cascaderOptions"
          clearable
          filterable
          placeholder="选择地区"
        />
      </div>
    </DemoBlock>

    <DemoBlock title="自动完成" :code="codes.autocomplete">
      <div class="demo-row">
        <ScAutocomplete
          v-model="keyword"
          :fetch-suggestions="querySearch"
          placeholder="搜索城市"
          clearable
        />
      </div>
    </DemoBlock>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ScAutocomplete, ScCascader } from "@repo/components";
import DemoBlock from "./DemoBlock.vue";

const cascaderValue = ref<(string | number)[] | string | number>("");

const cascaderOptions = [
  {
    value: "zhejiang",
    label: "浙江省",
    children: [
      {
        value: "hangzhou",
        label: "杭州市",
        children: [
          { value: "xihu", label: "西湖区" },
          { value: "yuhang", label: "余杭区" },
        ],
      },
    ],
  },
  {
    value: "jiangsu",
    label: "江苏省",
    children: [
      {
        value: "nanjing",
        label: "南京市",
        children: [
          { value: "xuanwu", label: "玄武区" },
          { value: "qinhuai", label: "秦淮区" },
        ],
      },
    ],
  },
];

interface CityItem {
  value: string;
  label: string;
}

const cities: CityItem[] = [
  { value: "Hangzhou", label: "杭州" },
  { value: "Nanjing", label: "南京" },
  { value: "Shanghai", label: "上海" },
  { value: "Beijing", label: "北京" },
  { value: "Shenzhen", label: "深圳" },
];

const keyword = ref("");

const querySearch = (queryString: string, cb: (list: CityItem[]) => void) => {
  const lower = queryString.toLowerCase();
  const result = lower
    ? cities.filter(
        (item) =>
          item.value.toLowerCase().includes(lower) ||
          item.label.toLowerCase().includes(lower),
      )
    : cities;
  cb(result);
};

const codes = {
  cascader: `<ScCascader
  v-model="cascaderValue"
  :options="cascaderOptions"
  clearable
  filterable
  placeholder="选择地区"
/>`,
  autocomplete: `<ScAutocomplete
  v-model="keyword"
  :fetch-suggestions="querySearch"
  placeholder="搜索城市"
  clearable
/>`,
};
</script>

<style scoped lang="scss">
.sc-cascader-autocomplete-example {
  padding: 20px;

  .demo-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
  }
}
</style>



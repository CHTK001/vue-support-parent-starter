<!--
 * ScFilterBar 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-05
-->
<template>
  <div class="sc-filter-bar-demo">
    <!-- 基础用法 -->
    <div class="demo-section">
      <h3 class="section-title">基础用法</h3>
      <ScFilterBar
        v-model="filterValues1"
        :fields="basicFields"
        :visible-count="3"
        @search="handleSearch"
        @reset="handleReset"
      />
      <div class="demo-result">
        <strong>筛选值：</strong>
        <code>{{ JSON.stringify(filterValues1) }}</code>
      </div>
    </div>

    <!-- 快捷筛选 -->
    <div class="demo-section">
      <h3 class="section-title">快捷筛选</h3>
      <ScFilterBar
        v-model="filterValues2"
        :fields="basicFields"
        :visible-count="2"
        :quick-filters="quickFilters"
        @search="handleSearch"
        @quick-filter="handleQuickFilter"
      />
    </div>

    <!-- 更多字段类型 -->
    <div class="demo-section">
      <h3 class="section-title">多种字段类型</h3>
      <ScFilterBar
        v-model="filterValues3"
        :fields="advancedFields"
        :visible-count="4"
        layout="inline"
        @search="handleSearch"
      />
    </div>

    <!-- Grid 布局 -->
    <div class="demo-section">
      <h3 class="section-title">Grid 布局</h3>
      <ScFilterBar
        v-model="filterValues4"
        :fields="gridFields"
        layout="grid"
        :columns="4"
        :visible-count="8"
        :show-expand="false"
        border
        background
        @search="handleSearch"
      />
    </div>

    <!-- 实时搜索 -->
    <div class="demo-section">
      <h3 class="section-title">实时搜索</h3>
      <ScFilterBar
        v-model="filterValues5"
        :fields="realtimeFields"
        :visible-count="3"
        realtime
        :debounce-time="500"
        :show-search="false"
        @search="handleRealtimeSearch"
        @change="handleChange"
      />
      <div class="demo-result">
        <strong>搜索次数：</strong> {{ searchCount }}
      </div>
    </div>

    <!-- 自定义插槽 -->
    <div class="demo-section">
      <h3 class="section-title">自定义插槽</h3>
      <ScFilterBar
        v-model="filterValues6"
        :fields="slotFields"
        :visible-count="3"
        @search="handleSearch"
      >
        <!-- 自定义字段 -->
        <template #customField="{ field, value, change }">
          <div class="custom-field">
            <el-slider
              v-model="filterValues6[field.prop]"
              :min="0"
              :max="100"
              @change="change"
            />
            <span class="custom-field-value">{{ value || 0 }}%</span>
          </div>
        </template>

        <!-- 自定义操作按钮 -->
        <template #actions="{ values, search, reset }">
          <el-button type="primary" @click="search">
            <IconifyIconOnline icon="ep:search" />
            高级搜索
          </el-button>
          <el-button @click="reset">
            <IconifyIconOnline icon="ep:refresh" />
            清空
          </el-button>
          <el-button type="success" @click="handleExport(values)">
            <IconifyIconOnline icon="ep:download" />
            导出
          </el-button>
        </template>
      </ScFilterBar>
    </div>

    <!-- 字段联动 -->
    <div class="demo-section">
      <h3 class="section-title">字段联动</h3>
      <ScFilterBar
        v-model="filterValues7"
        :fields="linkageFields"
        :visible-count="3"
        @search="handleSearch"
        @change="handleChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ScFilterBar } from "@repo/components/ScFilterBar";
import type {
  FilterField,
  FilterValue,
  QuickFilter,
} from "@repo/components/ScFilterBar";

// ==================== 筛选值 ====================
const filterValues1 = ref<FilterValue>({});
const filterValues2 = ref<FilterValue>({});
const filterValues3 = ref<FilterValue>({});
const filterValues4 = ref<FilterValue>({});
const filterValues5 = ref<FilterValue>({});
const filterValues6 = ref<FilterValue>({});
const filterValues7 = ref<FilterValue>({});
const searchCount = ref(0);

// ==================== 字段配置 ====================

/**
 * 基础字段
 */
const basicFields: FilterField[] = [
  {
    prop: "keyword",
    label: "关键词",
    type: "input",
    placeholder: "请输入关键词",
  },
  {
    prop: "status",
    label: "状态",
    type: "select",
    options: [
      { value: 1, label: "启用" },
      { value: 0, label: "禁用" },
      { value: 2, label: "待审核" },
    ],
  },
  {
    prop: "type",
    label: "类型",
    type: "select",
    multiple: true,
    options: [
      { value: "A", label: "类型A" },
      { value: "B", label: "类型B" },
      { value: "C", label: "类型C" },
    ],
  },
  {
    prop: "date",
    label: "日期",
    type: "date",
  },
  {
    prop: "dateRange",
    label: "日期范围",
    type: "daterange",
  },
];

/**
 * 快捷筛选
 */
const quickFilters: QuickFilter[] = [
  {
    key: "today",
    label: "今日",
    value: { date: new Date().toISOString().split("T")[0] },
    icon: "ep:calendar",
  },
  {
    key: "enabled",
    label: "已启用",
    value: { status: 1 },
    icon: "ep:check",
  },
  {
    key: "disabled",
    label: "已禁用",
    value: { status: 0 },
    icon: "ep:close",
  },
];

/**
 * 高级字段
 */
const advancedFields: FilterField[] = [
  {
    prop: "name",
    label: "名称",
    type: "input",
  },
  {
    prop: "category",
    label: "分类",
    type: "cascader",
    options: [
      {
        value: "electronics",
        label: "电子产品",
        children: [
          { value: "phone", label: "手机" },
          { value: "computer", label: "电脑" },
        ],
      },
      {
        value: "clothing",
        label: "服装",
        children: [
          { value: "mens", label: "男装" },
          { value: "womens", label: "女装" },
        ],
      },
    ],
  },
  {
    prop: "price",
    label: "价格",
    type: "number",
    props: { min: 0, max: 10000 },
  },
  {
    prop: "isActive",
    label: "是否激活",
    type: "switch",
  },
  {
    prop: "level",
    label: "等级",
    type: "radio",
    options: [
      { value: 1, label: "普通" },
      { value: 2, label: "VIP" },
      { value: 3, label: "SVIP" },
    ],
  },
  {
    prop: "tags",
    label: "标签",
    type: "checkbox",
    options: [
      { value: "hot", label: "热门" },
      { value: "new", label: "新品" },
      { value: "sale", label: "促销" },
    ],
  },
];

/**
 * Grid 布局字段
 */
const gridFields: FilterField[] = [
  { prop: "orderId", label: "订单号", type: "input" },
  { prop: "userName", label: "用户名", type: "input" },
  { prop: "phone", label: "手机号", type: "input" },
  {
    prop: "status",
    label: "订单状态",
    type: "select",
    options: [
      { value: 1, label: "待付款" },
      { value: 2, label: "待发货" },
      { value: 3, label: "已发货" },
      { value: 4, label: "已完成" },
    ],
  },
  {
    prop: "payType",
    label: "支付方式",
    type: "select",
    options: [
      { value: 1, label: "微信" },
      { value: 2, label: "支付宝" },
      { value: 3, label: "银行卡" },
    ],
  },
  { prop: "amount", label: "订单金额", type: "number" },
  { prop: "createTime", label: "下单时间", type: "daterange", span: 2 },
];

/**
 * 实时搜索字段
 */
const realtimeFields: FilterField[] = [
  {
    prop: "search",
    label: "搜索",
    type: "input",
    placeholder: "输入内容实时搜索",
  },
  {
    prop: "category",
    label: "分类",
    type: "select",
    options: [
      { value: 1, label: "分类1" },
      { value: 2, label: "分类2" },
    ],
  },
  {
    prop: "sort",
    label: "排序",
    type: "select",
    options: [
      { value: "asc", label: "升序" },
      { value: "desc", label: "降序" },
    ],
  },
];

/**
 * 插槽字段
 */
const slotFields: FilterField[] = [
  { prop: "name", label: "名称", type: "input" },
  { prop: "progress", label: "进度", slot: "customField" },
  {
    prop: "status",
    label: "状态",
    type: "select",
    options: [
      { value: 1, label: "进行中" },
      { value: 2, label: "已完成" },
    ],
  },
];

/**
 * 联动字段
 */
const linkageFields: FilterField[] = [
  {
    prop: "province",
    label: "省份",
    type: "select",
    options: [
      { value: "guangdong", label: "广东省" },
      { value: "zhejiang", label: "浙江省" },
    ],
    linkage: [
      {
        target: "city",
        type: "options",
        data: (value: unknown) => {
          if (value === "guangdong") {
            return [
              { value: "guangzhou", label: "广州市" },
              { value: "shenzhen", label: "深圳市" },
            ];
          } else if (value === "zhejiang") {
            return [
              { value: "hangzhou", label: "杭州市" },
              { value: "ningbo", label: "宁波市" },
            ];
          }
          return [];
        },
      },
      {
        target: "city",
        type: "value",
      },
    ],
  },
  {
    prop: "city",
    label: "城市",
    type: "select",
    options: [],
  },
  {
    prop: "detail",
    label: "详细地址",
    type: "input",
  },
];

// ==================== 事件处理 ====================

/**
 * 搜索事件
 */
function handleSearch(values: FilterValue): void {
  console.log("搜索:", values);
}

/**
 * 重置事件
 */
function handleReset(): void {
  console.log("重置");
}

/**
 * 快捷筛选事件
 */
function handleQuickFilter(filter: QuickFilter): void {
  console.log("快捷筛选:", filter);
}

/**
 * 实时搜索
 */
function handleRealtimeSearch(values: FilterValue): void {
  searchCount.value++;
  console.log("实时搜索:", values);
}

/**
 * 值变化事件
 */
function handleChange(prop: string, value: unknown, values: FilterValue): void {
  console.log("值变化:", prop, value, values);
}

/**
 * 导出
 */
function handleExport(values: FilterValue): void {
  console.log("导出:", values);
}
</script>

<style lang="scss" scoped>
.sc-filter-bar-demo {
  padding: 20px;

  .demo-section {
    margin-bottom: 32px;
    padding: 20px;
    background: var(--el-bg-color);
    border-radius: 8px;
    border: 1px solid var(--el-border-color-lighter);
  }

  .section-title {
    margin: 0 0 16px;
    padding-bottom: 12px;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .demo-result {
    margin-top: 16px;
    padding: 12px;
    background: var(--el-fill-color-lighter);
    border-radius: 6px;
    font-size: 13px;

    code {
      color: var(--el-color-primary);
      word-break: break-all;
    }
  }

  .custom-field {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 200px;

    .el-slider {
      flex: 1;
    }

    &-value {
      min-width: 40px;
      text-align: right;
      color: var(--el-color-primary);
      font-weight: 600;
    }
  }
}
</style>

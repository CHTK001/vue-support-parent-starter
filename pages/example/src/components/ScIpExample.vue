<template>
  <div class="sc-ip-example">
    <!-- 基础用法 -->
    <DemoBlock title="基础用法" :code="codes.basic">
      <p class="demo-tip">传入 IP 地址，自动查询并显示物理地址</p>
      <div class="demo-row">
        <ScIp ip="8.8.8.8" />
      </div>
    </DemoBlock>

    <!-- 直接传入物理地址 -->
    <DemoBlock title="直接传入物理地址" :code="codes.physicalAddress">
      <p class="demo-tip">如果已知物理地址，可以直接传入，不再查询</p>
      <div class="demo-row">
        <ScIp ip="114.114.114.114" physical-address="中国 江苏 南京 电信" />
      </div>
    </DemoBlock>

    <!-- 不显示原始IP -->
    <DemoBlock title="不显示原始IP" :code="codes.hideOriginal">
      <p class="demo-tip">只显示物理地址，不显示IP</p>
      <div class="demo-row">
        <ScIp ip="1.1.1.1" :show-original="false" />
      </div>
    </DemoBlock>

    <!-- 禁用搜索链接 -->
    <DemoBlock title="禁用搜索链接" :code="codes.noSearch">
      <p class="demo-tip">IP地址不可点击跳转搜索</p>
      <div class="demo-row">
        <ScIp ip="223.5.5.5" :open-search-original="false" />
      </div>
    </DemoBlock>

    <!-- 自定义空文本 -->
    <DemoBlock title="自定义空文本" :code="codes.emptyText">
      <p class="demo-tip">当无法获取物理地址时显示的文本</p>
      <div class="demo-row">
        <ScIp ip="192.168.1.1" empty-text="内网地址" />
      </div>
    </DemoBlock>

    <!-- 组合使用 -->
    <DemoBlock title="交互式演示" :code="codes.interactive">
      <div class="demo-controls">
        <el-button size="small" @click="testIp = '8.8.8.8'">Google DNS</el-button>
        <el-button size="small" @click="testIp = '1.1.1.1'">Cloudflare</el-button>
        <el-button size="small" @click="testIp = '114.114.114.114'">114 DNS</el-button>
        <el-button size="small" @click="testIp = '223.5.5.5'">阿里 DNS</el-button>
        <el-input v-model="testIp" placeholder="输入IP" style="width: 160px; margin-left: 12px" />
      </div>
      <div class="demo-row" style="margin-top: 16px">
        <ScIp :ip="testIp" />
      </div>
    </DemoBlock>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import ScIp from "@repo/components/ScIp/index.vue";
import DemoBlock from "./DemoBlock.vue";

/**
 * ScIp 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-06
 */

const testIp = ref("8.8.8.8");

// 代码模板
const codes = {
  basic: `<!-- 基础用法：传入IP自动查询物理地址 -->
<ScIp ip="8.8.8.8" />`,

  physicalAddress: `<!-- 直接传入物理地址，不再查询 -->
<ScIp 
  ip="114.114.114.114" 
  physical-address="中国 江苏 南京 电信" 
/>`,

  hideOriginal: `<!-- 只显示物理地址，不显示IP -->
<ScIp ip="1.1.1.1" :show-original="false" />`,

  noSearch: `<!-- IP地址不可点击跳转搜索 -->
<ScIp ip="223.5.5.5" :open-search-original="false" />`,

  emptyText: `<!-- 自定义无法获取物理地址时的显示文本 -->
<ScIp ip="192.168.1.1" empty-text="内网地址" />`,

  interactive: `<template>
  <ScIp :ip="testIp" />
</template>

<script setup>
import { ref } from "vue";
const testIp = ref("8.8.8.8");
<\/script>`
};
</script>

<style scoped lang="scss">
.sc-ip-example {
  padding: 20px;
}

.demo-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.demo-tip {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.demo-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
</style>

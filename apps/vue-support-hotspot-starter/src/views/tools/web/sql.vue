<template>
  <div class="bg-white p-[30px]">
    <el-segmented
      v-model="setting.type"
      :options="[
        { label: '格式化', value: '0' },
        { label: '解析SQL', value: '1' },
        { label: '清空', value: '-1' }
      ]"
      @change="handle"
    />
    <el-row class="pt-3">
      <el-col :span="10">
        <el-input v-model="oldSql" type="textarea" :rows="30" />
      </el-col>
      <el-col :span="2" class="p-[20px]">
        <el-button :icon="useRenderIcon('ep:d-arrow-right')" class="w-full" @click="handle" />
      </el-col>
      <el-col :span="10" class="h-full">
        <pre ref="sqlPre" class="h-full !max-h-[700px] language-sql line-numbers inline-color"><code class="language-sql line-numbers inline-color">{{ newSql }}</code> </pre>
      </el-col>
    </el-row>
  </div>
</template>
<script setup>
import { format } from "sql-formatter";
import { inject, reactive, unref, nextTick, ref } from "vue";
// 引入Prism.js
import Prism from "prismjs";
// 引入SQL语言插件
import "prismjs/components/prism-sql.min.js";
import "prismjs/themes/prism-tomorrow.min.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.min.css";
import "prismjs/plugins/line-highlight/prism-line-highlight.min.css";
import "prismjs/plugins/inline-color/prism-inline-color.min.css";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
const setting = reactive({
  type: "0"
});
const oldSql = ref("select field1,field2,field3 from my_table where my_condition;");
const newSql = ref("select field1,field2,field3 from my_table where my_condition;");

const handle = () => {
  try {
    if (setting.type == "0") {
      return handleFormat();
    }
    if (setting.type == "1") {
      return handleAnalysis();
    }
    if (setting.type == "-1") {
      newSql.value = "";
      oldSql.value = "";
    }
  } catch (e) {}
};
const handleAnalysis = () => {
  // 提取SQL查询部分
  const sqlPart = oldSql.value.match(/Preparing: (.*)/)[1];

  // 提取参数部分
  const paramsPart = oldSql.value.match(/Parameters: (.*)/)[1].replace(/\(.*?\)/g, "");

  // 将参数插入SQL查询中
  const paramsArray = paramsPart.split(", ").map(param => param.trim());
  let completeSql = sqlPart;
  paramsArray.forEach((param, index) => {
    completeSql = completeSql.replace("?", param);
  });

  newSql.value = format(completeSql);
  handlePrism();
};
const handleFormat = () => {
  newSql.value = format(oldSql.value);
  handlePrism();
};
const handlePrism = async () => {
  setTimeout(async () => {
    Prism.highlightAll();
    // 假设你的SQL代码在模板的pre标签中
    // 使用Prism.highlightElement来高亮代码
    try {
      document.querySelectorAll("pre code").forEach(ele => {
        Prism.highlightElement(ele);
      });
    } catch (error) {}
  }, 300);
};
handlePrism();
</script>

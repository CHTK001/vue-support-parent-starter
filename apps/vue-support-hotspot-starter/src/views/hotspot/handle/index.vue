<template>
  <div>
    <ul class="sortable-list connectList agile-list" style="overflow: auto; display: none; height: 100%; position: fixed; right: 0; width: 700px; background: white" />
    <div
      class="sortable-list connectList agile-list p-5 bg-white fixed top-1/4 right-[16px] z-[101] w-[280px] overflow-auto !h-[200px]"
      style="box-shadow: 0px 0px 12px rgba(0, 0, 0, 0.12); box-shadow: var(--el-box-shadow-light)"
    >
      <div v-for="it in data.data" :key="it" class="cursor-pointer truncate" :title="it.title" @click="handleClick(it.index)">
        <span v-html="it.title" />
      </div>
    </div>
    <el-card class="fixed z-[100] pt-3 right-4 counter">
      <span v-html="data.title" />
    </el-card>
    <el-row v-for="it in data.data" :id="'element' + it.index" :key="it">
      <el-col :span="24" class="mt-2 results">
        <el-card>
          <pre>
            <code id="person-code" class="class">
              <span v-html="it.code"/>
            </code>
          </pre>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import axios from "axios";
import $ from "jquery";
import { onBeforeMount, reactive } from "vue";
function scrollToElement(element) {
  element?.scrollIntoView({
    behavior: "smooth", // 平滑滚动
    block: "start", // 元素顶部与视窗顶部对齐
    // 或者 'end' 让元素底部与视窗底部对齐
    // 或者 'center' 让元素在视窗中垂直居中
    inline: "nearest" // 水平方向上，选择最近的边缘对齐
    // 或者 'start', 'end', 'center'
  });
}

const data = reactive({
  data: [],
  title: ""
});

const handleClick = async index => {
  scrollToElement(document.getElementById("element" + index));
};
onBeforeMount(async () => {
  axios.get((window.agentPath || "/agent") + "/stream_data").then(res => {
    let json = res.data;
    let xhr1 = json["data"];
    let xhr2 = json["title"];
    let split = xhr1.split("----");
    data.title = split[0] + split[1];
    split = split.slice(2);
    let $stream = $("#result > .v1");
    let arr = [];
    $stream.empty();
    let _index = 0;
    for (let item of split) {
      if (!item.trim()) {
        continue;
      }

      let index = item.indexOf("</span>");
      let id = undefined;
      if (index > -1) {
        id = item.substring(0, index).replace("Opend <span style='color:red;'>", "").replaceAll("\\", "_").replaceAll(".", "_").replaceAll(":", "_").replaceAll("\s+", "_").replaceAll("/", "_").trim();
      }
      arr.push({
        index: _index++,
        id: id,
        code: item,
        title: item?.trim()?.split("\n")[0]
      });
    }

    data.data = arr;
  });
});
</script>
<style lang="scss" scoped>
.counter {
  counter-reset: results;
}
.results::before {
  counter-increment: results;
  content: counter(results);
  color: #eee;
  font-size: 4.5em;
  position: absolute;
  text-align: right;
  left: 2%;
  width: 96%;
  line-height: 1em;
  top: 2%;
}
</style>
